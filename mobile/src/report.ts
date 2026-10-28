import demo from "../../shared/demo.json";
import type { Answer, RepairRecord } from "./domain";
export const RULE_VERSION = "camera-offline-demo-v0.2";
export type ReportState = "possible" | "insufficient" | "confirmed";
export const reportStateLabels: Record<ReportState, string> = {
  possible: "已定位可能原因",
  insufficient: "待进一步检查",
  confirmed: "已由用户确认修复",
};
export type RepairConfirmation = {
  repairActions: string;
  finalCause: string;
  repaired: boolean | null;
  updatedAt: string;
};
export type DiagnosisReport = {
  version: 1;
  ruleVersion: string;
  generatedAt: string;
  demo: true;
  input: {
    description: string;
    brand: string;
    model: string;
    category: string;
  };
  checks: {
    id: string;
    title: string;
    result: Answer | "unanswered";
    evidence: string;
  }[];
  causes: {
    stepId: string;
    title: string;
    evidence: string;
    recommendation: string;
  }[];
  recommendations: string[];
  verification: string[];
  limitations: string[];
  status: ReportState;
  conclusion: string;
};
const causeNames: Record<string, string> = {
  power: "供电或物理链路不稳定的可能性",
  address: "地址规划、网段或地址冲突问题的可能性",
  credentials: "认证信息、激活或账号锁定问题的可能性",
  protocol: "接入协议、服务或端口配置不匹配的可能性",
};
export function generateReport(
  record: Pick<
    RepairRecord,
    "description" | "brand" | "model" | "category" | "answers"
  >,
  generatedAt = new Date().toISOString(),
): DiagnosisReport {
  const checks: DiagnosisReport["checks"] = demo.steps.map((s) => {
    const result = record.answers[s.id] ?? "unanswered";
    return {
      id: s.id,
      title: s.title,
      result,
      evidence:
        result === "pass"
          ? s.pass
          : result === "fail"
            ? s.fail
            : result === "skip"
              ? "用户跳过，未取得检查证据"
              : "尚未检查，未取得检查证据",
    };
  });
  const scopeValid = record.answers.scope === "pass";
  const missing = checks.filter(
    (c) => c.result === "skip" || c.result === "unanswered",
  );
  const keyMissing = missing.filter((c) => c.id !== "verify");
  const causes = scopeValid
    ? demo.steps
        .filter((s) => causeNames[s.id] && record.answers[s.id] === "fail")
        .map((s) => ({
          stepId: s.id,
          title: causeNames[s.id],
          evidence: `“${s.title}”中，用户选择“${s.fail}”。`,
          recommendation: s.failNote,
        }))
    : [];
  const status: ReportState =
    record.answers.verify === "pass"
      ? "confirmed"
      : scopeValid && keyMissing.length === 0 && causes.length > 0
        ? "possible"
        : "insufficient";
  const recommendations = !scopeValid
    ? [
        "先确认现象符合摄像头离线示例并取得现场维护授权，再继续排障；当前报告不能用于指导配置变更。",
      ]
    : [
        ...missing
          .filter((c) => c.id !== "verify")
          .map((c) => `补查：${c.title}，不能将跳过视为通过。`),
        ...causes.map((c) => c.recommendation),
      ];
  if (scopeValid && causes.length === 0 && record.answers.verify !== "pass")
    recommendations.push(
      "已检查项目未提供可定位的异常证据。保留离线错误提示、设备型号、固件版本和接入拓扑，联系厂商支持进一步排查；不要盲目重置或开放全部端口。",
    );
  if (scopeValid && record.answers.verify === "pass")
    recommendations.push(
      "记录实际维修措施与最终确认原因；本次恢复不等于系统已确认根因，建议持续观察。",
    );
  const limitations = [
    "本报告来自本地固定演示规则，不调用 AI 或外部 API，未经厂商审核；可能原因均为待验证的系统推测，不是确定根因。",
    "系统未测量现场供电、网络或设备状态，证据仅来自用户选择；品牌型号仅作记录，不影响规则。",
  ];
  if (!scopeValid)
    limitations.push("现象适用性或现场维护条件未确认，不能据此定位可能原因。");
  if (keyMissing.length)
    limitations.push(
      `关键检查信息不足：${keyMissing.map((c) => c.title).join("、")}。应补查后再判断，其他异常线索也不能据此认定为根因。`,
    );
  if (record.category !== "camera")
    limitations.push(
      "原始问题分类不是监控；此报告只适用固定摄像头离线演示，不是该分类的专用诊断。",
    );
  if (record.answers.verify !== "pass")
    limitations.push("尚未获得用户确认的完整恢复验证，不能认定已经修复。");
  return {
    version: 1,
    ruleVersion: RULE_VERSION,
    generatedAt,
    demo: true,
    input: {
      description: record.description,
      brand: record.brand,
      model: record.model,
      category: record.category,
    },
    checks,
    causes,
    recommendations,
    verification: [
      "在授权范围内复核设备在线状态和实时画面，记录验证时间、观察时长及是否再次掉线。",
      "检查录像写入与实际回放，确认时间、通道与画面正常；仅能搜索到设备不算验证通过。",
      "若仍离线或反复出现，保留错误提示和已查项目，停止盲目变更并交由厂商或专业人员进一步排查。",
    ],
    limitations,
    status,
    conclusion:
      status === "confirmed"
        ? `用户在恢复验证中选择了验证通过；系统没有据此确认故障根因。${keyMissing.length ? "关键检查信息不足，仍应补查后再判断原因。" : ""}`
        : !scopeValid
          ? "适用范围或维护条件未确认，当前信息不足以定位原因。"
          : keyMissing.length
            ? "关键检查信息不足，请补查。现有异常仅作为后续线索。"
            : causes.length
              ? "已发现与可能原因对应的异常线索，需要按建议处理并验证；尚未确定根因。"
              : "已检查项目未发现可定位的异常，但问题尚未确认恢复，需要进一步排查。",
  };
}
export function effectiveReportState(
  report: DiagnosisReport,
  confirmation?: RepairConfirmation,
): ReportState {
  if (confirmation?.repaired === true) return "confirmed";
  if (confirmation?.repaired === false && report.status === "confirmed") {
    return report.checks.every(
      (c) =>
        c.id === "verify" || (c.result !== "skip" && c.result !== "unanswered"),
    ) &&
      report.checks.find((c) => c.id === "scope")?.result === "pass" &&
      report.causes.length
      ? "possible"
      : "insufficient";
  }
  return report.status;
}
export function isDiagnosisReport(value: unknown): value is DiagnosisReport {
  if (!value || typeof value !== "object") return false;
  const v = value as DiagnosisReport;
  return (
    v.version === 1 &&
    v.demo === true &&
    typeof v.ruleVersion === "string" &&
    typeof v.generatedAt === "string" &&
    !!v.input &&
    ["description", "brand", "model", "category"].every(
      (k) => typeof v.input[k as keyof typeof v.input] === "string",
    ) &&
    Array.isArray(v.checks) &&
    v.checks.length === demo.steps.length &&
    v.checks.every(
      (c, i) =>
        c?.id === demo.steps[i].id &&
        typeof c.title === "string" &&
        ["pass", "fail", "skip", "unanswered"].includes(c.result) &&
        typeof c.evidence === "string",
    ) &&
    Array.isArray(v.causes) &&
    v.causes.every(
      (c) =>
        c &&
        ["stepId", "title", "evidence", "recommendation"].every(
          (k) => typeof c[k as keyof typeof c] === "string",
        ),
    ) &&
    [v.recommendations, v.verification, v.limitations].every(
      (a) => Array.isArray(a) && a.every((s) => typeof s === "string"),
    ) &&
    ["possible", "insufficient", "confirmed"].includes(v.status) &&
    typeof v.conclusion === "string"
  );
}
export function isRepairConfirmation(
  value: unknown,
): value is RepairConfirmation {
  if (!value || typeof value !== "object") return false;
  const v = value as RepairConfirmation;
  return (
    typeof v.repairActions === "string" &&
    typeof v.finalCause === "string" &&
    (v.repaired === null || typeof v.repaired === "boolean") &&
    typeof v.updatedAt === "string"
  );
}

export function sameReportEvidence(
  a: DiagnosisReport | undefined,
  b: DiagnosisReport | undefined,
) {
  return (
    !!a &&
    !!b &&
    a.ruleVersion === b.ruleVersion &&
    JSON.stringify(a.input) === JSON.stringify(b.input) &&
    JSON.stringify(a.checks) === JSON.stringify(b.checks)
  );
}

// Repeated saves of the same report must not overwrite later manual record edits.
export function mergeReportForSave(
  draft: RepairRecord,
  existing?: RepairRecord,
): RepairRecord {
  if (!existing || !sameReportEvidence(existing.report, draft.report))
    return draft;
  return {
    ...existing,
    report: draft.report,
    notes: draft.notes,
    updatedAt: draft.updatedAt,
  };
}
