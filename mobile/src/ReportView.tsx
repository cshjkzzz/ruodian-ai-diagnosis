import { Text, View } from "react-native";
import { categoryName } from "./domain";
import {
  type DiagnosisReport,
  type RepairConfirmation,
  effectiveReportState,
  reportStateLabels,
} from "./report";
import { Card, DemoNotice, styles } from "./ui";
export function ReportView({
  report,
  confirmation,
}: {
  report: DiagnosisReport;
  confirmation?: RepairConfirmation;
}) {
  const state = effectiveReportState(report, confirmation);
  const missing = report.checks.filter(
    (c) => c.result === "skip" || c.result === "unanswered",
  );
  return (
    <>
      <Text style={styles.badge}>{reportStateLabels[state]}</Text>
      <DemoNotice text="演示规则报告 · 系统推测不是确定根因。未接入 AI、图片识别或外部 API；报告只依据用户选择，不代表厂商官方结论。" />
      <Card>
        <Text style={styles.h2}>故障与设备</Text>
        <Text style={styles.body}>{report.input.description}</Text>
        <Text style={styles.subtitle}>
          原始分类：{categoryName(report.input.category)} · 演示流程：监控离线
        </Text>
        <Text style={styles.body}>品牌：{report.input.brand || "未填写"}</Text>
        <Text style={styles.body}>型号：{report.input.model || "未填写"}</Text>
        <Text style={styles.subtitle}>规则：{report.ruleVersion}</Text>
        <Text style={styles.subtitle}>
          生成于：{new Date(report.generatedAt).toLocaleString("zh-CN")}
        </Text>
      </Card>
      <Card>
        <Text style={styles.h2}>诊断结论 · 系统推测</Text>
        <Text style={styles.body}>{report.conclusion}</Text>
        {report.status === "confirmed" && (
          <Text style={styles.subtitle}>
            已标记为验证通过（来自生成报告时的用户选择）
          </Text>
        )}
        {confirmation?.repaired === false && (
          <Text style={styles.body}>
            维修人员最新确认：尚未修复。历史验证通过不代表当前已经恢复。
          </Text>
        )}
        {report.causes.length ? (
          report.causes.map((c) => (
            <View key={c.stepId} style={{ gap: 8 }}>
              <Text style={styles.h3}>{c.title}</Text>
              <Text style={styles.body}>对应证据：{c.evidence}</Text>
              <Text style={styles.subtitle}>
                仅为待验证的可能原因，不是确定根因。
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.subtitle}>
            没有足够证据提出具体原因，不强行推断故障根因。
          </Text>
        )}
      </Card>
      <Card>
        <Text style={styles.h2}>检查项目与结果</Text>
        {report.checks
          .filter((c) => c.result !== "skip" && c.result !== "unanswered")
          .map((c) => (
            <View key={c.id} style={{ gap: 5 }}>
              <Text style={styles.h3}>
                {c.title} · {c.result === "pass" ? "已通过" : "有异常"}
              </Text>
              <Text style={styles.subtitle}>用户选择：{c.evidence}</Text>
            </View>
          ))}
        {report.checks.every(
          (c) => c.result === "skip" || c.result === "unanswered",
        ) && <Text style={styles.subtitle}>尚无已完成的检查。</Text>}
      </Card>
      <Card>
        <Text style={styles.h2}>推荐处理步骤</Text>
        {report.recommendations.map((s, i) => (
          <Text key={s} style={styles.body}>
            {i + 1}. {s}
          </Text>
        ))}
      </Card>
      <Card>
        <Text style={styles.h2}>后续验证方法</Text>
        {report.verification.map((s, i) => (
          <Text key={s} style={styles.body}>
            {i + 1}. {s}
          </Text>
        ))}
      </Card>
      <Card>
        <Text style={styles.h2}>未检查项目与诊断局限</Text>
        {missing.length ? (
          missing.map((c) => (
            <Text key={c.id} style={styles.body}>
              {c.title} · {c.result === "skip" ? "已跳过" : "未检查"}
            </Text>
          ))
        ) : (
          <Text style={styles.subtitle}>
            本演示项目均已填写，但不代表已覆盖所有现场可能性。
          </Text>
        )}
        {report.limitations.map((s) => (
          <Text key={s} style={styles.subtitle}>
            {s}
          </Text>
        ))}
      </Card>
      <Card>
        <Text style={styles.h2}>维修人员确认 · 非系统推测</Text>
        <Text style={styles.body}>
          是否修复：
          {confirmation?.repaired === true
            ? "已修复（人工确认）"
            : confirmation?.repaired === false
              ? "尚未修复（人工确认）"
              : "尚未填写人工确认"}
        </Text>
        <Text style={styles.body}>
          实际维修措施：{confirmation?.repairActions || "未填写"}
        </Text>
        <Text style={styles.body}>
          最终故障原因：
          {confirmation?.finalCause || "未确认；不自动采用系统推测"}
        </Text>
        <Text style={styles.subtitle}>
          可在维修记录中补充或编辑；人工填写不会改写上面的系统报告快照。
        </Text>
      </Card>
    </>
  );
}
