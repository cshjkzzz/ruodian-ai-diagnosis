"""Development-only demo API. No real AI, payment, authentication or production data."""
from contextlib import asynccontextmanager
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import sqlite3
from typing import Literal
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field

DEMO = json.loads((Path(__file__).resolve().parents[2] / "shared/demo.json").read_text())
Category = Literal["camera", "network", "access", "computer"]
Answer = Literal["pass", "fail", "skip"]
STEP_IDS = {s["id"] for s in DEMO["steps"]}
DEFAULT_DB = Path(__file__).resolve().parents[1] / ".data/ruodian.sqlite3"

def database():
    path = Path(os.environ.get("RUODIAN_DB_PATH", str(DEFAULT_DB)))
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn

@asynccontextmanager
async def lifespan(app: FastAPI):
    with database() as db:
        db.execute("CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY, data TEXT NOT NULL)")
        db.execute("CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, data TEXT NOT NULL)")
    yield

app = FastAPI(title="弱电智诊 · 演示 API", version="0.1.0", lifespan=lifespan,
              description="仅用于本地开发。无身份认证，请勿用于公网或真实客户数据。技术内容均为人工编写的演示资料。")
app.add_middleware(CORSMiddleware,
    allow_origins=[s.strip() for s in os.environ.get("RUODIAN_CORS_ORIGINS", "http://localhost:8081,http://127.0.0.1:8081").split(",") if s.strip()],
    allow_credentials=False, allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"], allow_headers=["Content-Type"])

def now():
    return datetime.now(timezone.utc).isoformat()

class RecordInput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    title: str = Field(min_length=1, max_length=2000)
    category: Category = "camera"
    brand: str = Field(default="", max_length=80)
    model: str = Field(default="", max_length=120)
    description: str = Field(min_length=1, max_length=2000)
    notes: str = Field(default="", max_length=5000)
    status: Literal["pending", "resolved"] = "pending"
    answers: dict[str, Answer] = Field(default_factory=dict)

class RecordPatch(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    title: str | None = Field(default=None, min_length=1, max_length=2000)
    category: Category | None = None
    brand: str | None = Field(default=None, max_length=80)
    model: str | None = Field(default=None, max_length=120)
    description: str | None = Field(default=None, min_length=1, max_length=2000)
    notes: str | None = Field(default=None, max_length=5000)
    status: Literal["pending", "resolved"] | None = None
    answers: dict[str, Answer] | None = None

class DiagnosisInput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    description: str = Field(min_length=1, max_length=2000)
    category: Category = "camera"
    brand: str = Field(default="", max_length=80)
    model: str = Field(default="", max_length=120)

class AnswerInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    answer: Answer

def read_entity(table: Literal["records", "sessions"], entity_id: str):
    with database() as db:
        row = db.execute(f"SELECT data FROM {table} WHERE id = ?", (entity_id,)).fetchone()
    if not row:
        raise HTTPException(404, "记录不存在" if table == "records" else "排障会话不存在")
    return json.loads(row["data"])

def write_entity(table: Literal["records", "sessions"], item: dict):
    with database() as db:
        db.execute(f"INSERT INTO {table} (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data",
                   (item["id"], json.dumps(item, ensure_ascii=False)))
    return item

def validate_answers(answers: dict):
    if not set(answers).issubset(STEP_IDS):
        raise HTTPException(422, "包含未知检查步骤")

@app.get("/health")
def health():
    with database() as db:
        db.execute("SELECT 1").fetchone()
    return {"status": "ok", "demo": True, "version": "0.1.0"}

@app.get("/v1/capabilities")
def capabilities():
    return {"demo": True, "ai": False, "imageRecognition": False, "subscriptions": False,
            "recordStorage": "development-sqlite", "authentication": False}

@app.get("/v1/categories")
def categories():
    return {"demo": True, "items": DEMO["categories"]}

@app.get("/v1/articles")
def articles(q: str = Query(default="", max_length=200), category: Category | None = None):
    items = [a for a in DEMO["articles"] if (not category or a["category"] == category)
             and q.strip().lower() in json.dumps(a, ensure_ascii=False).lower()]
    return {"demo": True, "source": "人工编写的演示资料，非厂商官方文档", "items": items}

@app.get("/v1/articles/{article_id}")
def article(article_id: str):
    item = next((a for a in DEMO["articles"] if a["id"] == article_id), None)
    if not item:
        raise HTTPException(404, "文章不存在")
    return {"demo": True, "source": "人工编写的演示资料，非厂商官方文档", "article": item}

@app.post("/v1/diagnoses", status_code=201)
def create_diagnosis(payload: DiagnosisInput):
    item = {"id": str(uuid4()), **payload.model_dump(), "demo": True, "flowCategory": "camera",
            "notice": "固定摄像头离线演示，不依据品牌、型号或描述生成 AI 结论", "answers": {}, "createdAt": now()}
    return write_entity("sessions", item) | {"steps": DEMO["steps"]}

@app.get("/v1/diagnoses/{session_id}")
def get_diagnosis(session_id: str):
    return read_entity("sessions", session_id) | {"steps": DEMO["steps"]}

@app.put("/v1/diagnoses/{session_id}/answers/{step_id}")
def answer_step(session_id: str, step_id: str, payload: AnswerInput):
    item = read_entity("sessions", session_id)
    ids = [s["id"] for s in DEMO["steps"]]
    if step_id not in ids:
        raise HTTPException(404, "检查步骤不存在")
    index = ids.index(step_id)
    if any(s not in item["answers"] for s in ids[:index]):
        raise HTTPException(409, "请先完成或跳过前面的检查步骤")
    item["answers"] = {k: v for k, v in item["answers"].items() if k in ids[:index]}
    item["answers"][step_id] = payload.answer
    return write_entity("sessions", item)

@app.post("/v1/diagnoses/{session_id}/record", status_code=201)
def save_diagnosis(session_id: str):
    item = read_entity("sessions", session_id)
    record_id = f"diagnosis-{session_id}"
    timestamp = now()
    # Saving a session repeatedly updates the same record rather than duplicating it.
    try:
        created = read_entity("records", record_id)["createdAt"]
    except HTTPException as exc:
        if exc.status_code != 404:
            raise
        created = timestamp
    record = {k: item[k] for k in ("description", "category", "brand", "model", "answers")}
    record.update(id=record_id, title=item["description"], notes="固定摄像头离线演示流程",
                  status="resolved" if item["answers"].get("verify") == "pass" else "pending",
                  createdAt=created, updatedAt=timestamp, demo=True)
    return write_entity("records", record)

@app.get("/v1/records")
def records():
    with database() as db:
        rows = db.execute("SELECT data FROM records").fetchall()
    return {"demo": True, "items": sorted([json.loads(r["data"]) for r in rows], key=lambda r: r["updatedAt"], reverse=True)}

@app.post("/v1/records", status_code=201)
def create_record(payload: RecordInput):
    validate_answers(payload.answers)
    timestamp = now()
    return write_entity("records", {**payload.model_dump(), "id": str(uuid4()), "createdAt": timestamp, "updatedAt": timestamp, "demo": True})

@app.get("/v1/records/{record_id}")
def get_record(record_id: str):
    return read_entity("records", record_id)

@app.patch("/v1/records/{record_id}")
def update_record(record_id: str, payload: RecordPatch):
    item = read_entity("records", record_id)
    changes = payload.model_dump(exclude_unset=True)
    if any(value is None for value in changes.values()):
        raise HTTPException(422, "字段不可设为 null；清空文本请使用空字符串")
    if "answers" in changes:
        validate_answers(changes["answers"])
    return write_entity("records", item | changes | {"updatedAt": now()})

@app.delete("/v1/records/{record_id}", status_code=204)
def delete_record(record_id: str):
    read_entity("records", record_id)
    with database() as db:
        db.execute("DELETE FROM records WHERE id = ?", (record_id,))

@app.post("/v1/ai/diagnose", status_code=501)
def ai_stub():
    return {"demo": True, "code": "AI_NOT_CONFIGURED", "message": "AI 模型尚未接入，请使用演示排障流程"}

@app.post("/v1/images/analyze", status_code=501)
def image_stub():
    return {"demo": True, "code": "IMAGE_NOT_CONFIGURED", "message": "图片识别尚未接入，不接收或保存图片"}

@app.get("/v1/subscription")
def subscription():
    return {"demo": True, "available": False, "active": False, "features": [], "message": "会员订阅尚未开放，无支付与扣费"}
