import test from "node:test";
import assert from "node:assert/strict";
import {
  filterArticles,
  diagnosisStatus,
  progress,
  truncateAfter,
  parseRecords,
  steps,
} from "../src/domain";
test("知识库按分类和中文关键词交叉搜索", () => {
  assert.equal(filterArticles("离线", "camera").length, 1);
  assert.equal(filterArticles("离线", "network").length, 0);
  assert.equal(filterArticles("wi-fi")[0].id, "network-no-internet");
  assert.equal(filterArticles("不存在").length, 0);
});
test("仅最终现场验证通过才标记解决，跳过与异常仍待处理", () => {
  assert.equal(diagnosisStatus({ power: "pass" }), "pending");
  assert.equal(diagnosisStatus({ verify: "skip" }), "pending");
  assert.equal(diagnosisStatus({ verify: "fail" }), "pending");
  assert.equal(diagnosisStatus({ verify: "pass" }), "resolved");
});
test("返回修改早期结果时清除下游旧答案，防止过时的解决状态", () => {
  const result = truncateAfter(
    { scope: "pass", power: "fail", verify: "pass" },
    1,
  );
  assert.deepEqual(result, { scope: "pass", power: "fail" });
  assert.equal(diagnosisStatus(result), "pending");
  assert.equal(progress(result), 2);
});
test("本地记录读取拒绝损坏数据，避免静默覆盖", () => {
  assert.deepEqual(parseRecords(null), []);
  assert.deepEqual(parseRecords("[]"), []);
  assert.throws(() => parseRecords("{broken"));
  assert.throws(() => parseRecords('[{"id":"1"}]'));
});
test("完整演示可以回顾六个检查项，跳过不算验证通过", () => {
  const answers = Object.fromEntries(steps.map((s) => [s.id, "skip" as const]));
  assert.equal(progress(answers), 6);
  assert.equal(diagnosisStatus(answers), "pending");
});
