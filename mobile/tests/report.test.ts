import test from "node:test";
import assert from "node:assert/strict";
import {
  steps,
  parseRecords,
  truncateAfter,
  type RepairRecord,
  type Answers,
} from "../src/domain";
import {
  generateReport,
  effectiveReportState,
  sameReportEvidence,
  mergeReportForSave,
} from "../src/report";
const base: RepairRecord = {
  id: "test",
  title: "摄像头离线",
  description: "摄像头可搜索，添加后离线",
  brand: "演示品牌",
  model: "演示型号",
  category: "camera",
  notes: "",
  answers: {},
  status: "pending",
  createdAt: "2026-10-28T00:00:00Z",
  updatedAt: "2026-10-28T00:00:00Z",
};
const normal: Answers = Object.fromEntries(steps.map((s) => [s.id, "pass"]));
for (const [stepId, title] of [
  ["power", "供电或物理链路不稳定的可能性"],
  ["address", "地址规划、网段或地址冲突问题的可能性"],
  ["credentials", "认证信息、激活或账号锁定问题的可能性"],
  ["protocol", "接入协议、服务或端口配置不匹配的可能性"],
]) {
  test(`${stepId}异常只生成相应可能原因与用户证据`, () => {
    const report = generateReport({
      ...base,
      answers: { ...normal, [stepId]: "fail", verify: "fail" },
    });
    assert.equal(report.status, "possible");
    assert.equal(report.causes.length, 1);
    assert.equal(report.causes[0].title, title);
    assert.equal(report.causes[0].stepId, stepId);
    assert.ok(
      report.causes[0].evidence.includes(
        steps.find((s) => s.id === stepId)!.fail,
      ),
    );
    assert.ok(
      report.recommendations.includes(
        steps.find((s) => s.id === stepId)!.failNote,
      ),
    );
  });
}
test("跳过关键检查会明确提示信息不足，异常线索不会成为确定根因", () => {
  const report = generateReport({
    ...base,
    answers: { ...normal, power: "fail", address: "skip", verify: "fail" },
  });
  assert.equal(report.status, "insufficient");
  assert.equal(report.causes.length, 1);
  assert.match(report.conclusion, /关键检查信息不足/);
  assert.ok(report.limitations.some((s) => s.includes("核对 IP")));
  assert.ok(report.recommendations[0].startsWith("补查："));
});
test("所有检查正常但仍未恢复时不得强推原因", () => {
  const report = generateReport({
    ...base,
    answers: { ...normal, verify: "fail" },
  });
  assert.equal(report.status, "insufficient");
  assert.deepEqual(report.causes, []);
  assert.match(report.conclusion, /进一步排查/);
});
test("未回答、最终验证跳过和适用范围失败有不同提示", () => {
  const report = generateReport({
    ...base,
    answers: { scope: "pass", power: "fail" },
  });
  assert.equal(
    report.checks.find((c) => c.id === "address")!.result,
    "unanswered",
  );
  assert.equal(report.status, "insufficient");
  assert.equal(
    generateReport({ ...base, answers: { ...normal, verify: "skip" } }).status,
    "insufficient",
  );
  const unsafe = generateReport({
    ...base,
    answers: { ...normal, scope: "fail", power: "fail", verify: "fail" },
  });
  assert.deepEqual(unsafe.causes, []);
  assert.match(unsafe.conclusion, /维护条件未确认/);
});
test("修复确认不等于确认根因，人工否认修复覆盖旧验证状态", () => {
  const report = generateReport({ ...base, answers: normal });
  assert.equal(report.status, "confirmed");
  assert.deepEqual(report.causes, []);
  const confirmation = {
    repairActions: "更换线缆",
    finalCause: "现场确认接触不良",
    repaired: true,
    updatedAt: base.updatedAt,
  };
  assert.equal(effectiveReportState(report, confirmation), "confirmed");
  assert.equal(
    effectiveReportState(report, { ...confirmation, repaired: false }),
    "insufficient",
  );
  const pending = generateReport({
    ...base,
    answers: { ...normal, verify: "fail" },
  });
  assert.equal(effectiveReportState(pending, confirmation), "confirmed");
  assert.equal(pending.status, "insufficient");
});
test("新旧记录兼容，报告快照与人工确认可序列化持久化，损坏扩展拒绝覆盖", () => {
  assert.equal(parseRecords(JSON.stringify([base]))[0].report, undefined);
  const report = generateReport(
    { ...base, answers: { ...normal, address: "fail", verify: "fail" } },
    base.createdAt,
  );
  const record = {
    ...base,
    report,
    confirmation: {
      repairActions: "按规划修改地址",
      finalCause: "现场确认地址冲突",
      repaired: true,
      updatedAt: base.updatedAt,
    },
  };
  const restored = parseRecords(JSON.stringify([record]))[0];
  assert.deepEqual(restored, record);
  const edited = {
    ...restored,
    description: "编辑后的描述",
    confirmation: { ...record.confirmation, finalCause: "复核后的原因" },
  };
  assert.deepEqual(edited.report, report);
  assert.equal(edited.report.input.description, base.description);
  assert.throws(() =>
    parseRecords(JSON.stringify([{ ...base, report: { version: 1 } }])),
  );
  assert.throws(() =>
    parseRecords(
      JSON.stringify([{ ...base, confirmation: { repaired: "yes" } }]),
    ),
  );
});
test("返回修改后不复用旧结论或人工修复状态", () => {
  const original = generateReport({ ...base, answers: normal });
  const changed = generateReport({
    ...base,
    answers: truncateAfter({ ...normal, power: "fail" }, 1),
  });
  assert.equal(changed.status, "insufficient");
  assert.equal(sameReportEvidence(original, changed), false);
  assert.equal(
    sameReportEvidence(original, { ...original, generatedAt: "later" }),
    true,
  );
});

test("重复保存同一报告保留后续人工编辑，证据改变则不沿用旧确认", () => {
  const report = generateReport({ ...base, answers: normal });
  const draft = { ...base, report, answers: normal };
  const existing = {
    ...draft,
    title: "人工修改标题",
    confirmation: {
      repairActions: "处理措施",
      finalCause: "人工原因",
      repaired: true,
      updatedAt: base.updatedAt,
    },
    status: "resolved" as const,
  };
  const merged = mergeReportForSave({ ...draft, notes: "新备注" }, existing);
  assert.equal(merged.title, "人工修改标题");
  assert.equal(merged.confirmation?.finalCause, "人工原因");
  assert.equal(merged.notes, "新备注");
  const changed = {
    ...draft,
    answers: { scope: "pass" as const, power: "fail" as const },
    report: generateReport({
      ...base,
      answers: { scope: "pass", power: "fail" },
    }),
  };
  assert.equal(mergeReportForSave(changed, existing).confirmation, undefined);
});
