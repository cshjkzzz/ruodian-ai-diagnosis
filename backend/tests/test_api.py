import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("RUODIAN_DB_PATH", str(tmp_path / "test.sqlite3"))
    with TestClient(app) as c:
        yield c

def test_health_and_capabilities(client):
    assert client.get("/health").json()["status"] == "ok"
    caps = client.get("/v1/capabilities").json()
    assert caps["demo"] and not caps["ai"] and not caps["subscriptions"]

def test_search_category_and_article(client):
    items = client.get("/v1/articles", params={"q": "离线", "category": "camera"}).json()["items"]
    assert len(items) == 1
    assert client.get("/v1/articles", params={"q": "离线", "category": "network"}).json()["items"] == []
    assert client.get(f"/v1/articles/{items[0]['id']}").json()["demo"]
    assert client.get("/v1/articles/missing").status_code == 404
    assert client.get("/v1/articles?category=invalid").status_code == 422

def test_record_crud_and_validation(client):
    payload = {"title": "摄像头离线", "description": "添加后离线", "category": "camera"}
    response = client.post("/v1/records", json=payload)
    assert response.status_code == 201
    record = response.json()
    rid = record["id"]
    assert client.get(f"/v1/records/{rid}").json()["title"] == payload["title"]
    changed = client.patch(f"/v1/records/{rid}", json={"status": "resolved", "notes": "已检查供电"}).json()
    assert changed["status"] == "resolved" and changed["createdAt"] == record["createdAt"]
    assert len(client.get("/v1/records").json()["items"]) == 1
    assert client.patch(f"/v1/records/{rid}", json={"title": None}).status_code == 422
    assert client.patch(f"/v1/records/{rid}", json={"title": "  "}).status_code == 422
    assert client.post("/v1/records", json=payload | {"answers": {"unknown": "pass"}}).status_code == 422
    assert client.delete(f"/v1/records/{rid}").status_code == 204
    assert client.get(f"/v1/records/{rid}").status_code == 404

def test_diagnosis_back_skip_save_and_persistence(client):
    session = client.post("/v1/diagnoses", json={"description": "录像机添加后离线", "brand": "演示品牌"}).json()
    sid = session["id"]
    assert session["demo"] and len(session["steps"]) == 6
    assert client.put(f"/v1/diagnoses/{sid}/answers/verify", json={"answer": "pass"}).status_code == 409
    for step in session["steps"]:
        assert client.put(f"/v1/diagnoses/{sid}/answers/{step['id']}", json={"answer": "pass"}).status_code == 200
    saved = client.post(f"/v1/diagnoses/{sid}/record").json()
    assert saved["status"] == "resolved"
    # Return to the second step and change it; later answers must be invalidated.
    result = client.put(f"/v1/diagnoses/{sid}/answers/power", json={"answer": "skip"}).json()
    assert result["answers"] == {"scope": "pass", "power": "skip"}
    saved_again = client.post(f"/v1/diagnoses/{sid}/record").json()
    assert saved_again["id"] == saved["id"] and saved_again["status"] == "pending"
    assert len(client.get("/v1/records").json()["items"]) == 1
    with TestClient(app) as restarted:
        assert restarted.get(f"/v1/records/{saved['id']}").status_code == 200
        assert restarted.get(f"/v1/diagnoses/{sid}").json()["answers"]["power"] == "skip"

def test_extensions_do_not_pretend_to_be_real_services(client):
    assert client.post("/v1/ai/diagnose").status_code == 501
    assert client.post("/v1/images/analyze").status_code == 501
    assert client.get("/v1/subscription").json()["active"] is False
