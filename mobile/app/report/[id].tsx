import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useRecords } from "../../src/storage";
import {
  generateReport,
  sameReportEvidence,
  mergeReportForSave,
} from "../../src/report";
import { ReportView } from "../../src/ReportView";
import {
  Screen,
  Heading,
  Empty,
  Button,
  Card,
  Field,
  styles,
  colors,
} from "../../src/ui";
export default function ReportPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useRecords();
  const preview = id === "preview";
  const record = preview
    ? store.reportDraft
    : store.records.find((r) => r.id === id);
  const existing = store.records.find((r) => r.id === record?.id);
  const report = useMemo(
    () => (record ? (record.report ?? generateReport(record)) : undefined),
    [record],
  );
  const [notes, setNotes] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  if (!store.ready)
    return (
      <Screen>
        <Text>正在读取报告…</Text>
      </Screen>
    );
  if (store.error)
    return (
      <Screen>
        <Text style={styles.body}>{store.error}</Text>
        <Button title="重试读取" onPress={() => void store.reload()} />
      </Screen>
    );
  if (!record || !report)
    return (
      <Screen>
        <Empty
          title="报告暂不可用"
          description={
            preview
              ? "未保存的报告在刷新后不会保留，请返回诊断流程重新生成。"
              : "对应记录不存在，可能已删除或保存在其他设备。"
          }
        />
        <Button
          title="返回维修记录"
          onPress={() => router.replace("/records")}
        />
      </Screen>
    );
  const currentConfirmation = preview
    ? sameReportEvidence(existing?.report, report)
      ? existing?.confirmation
      : undefined
    : record.confirmation;
  async function save() {
    if (!record || busy) return;
    setBusy(true);
    setError("");
    try {
      const draft = {
        ...record,
        notes:
          notes ??
          (sameReportEvidence(existing?.report, report)
            ? (existing?.notes ?? record.notes)
            : record.notes),
        report,
        updatedAt: new Date().toISOString(),
      };
      await store.save(mergeReportForSave(draft, existing));
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败，请重试");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Heading
        title="诊断报告"
        subtitle={
          preview
            ? "生成报告后，请保存到本机维修记录。"
            : "历史报告快照 · 本机存储，不与云端同步"
        }
      />
      {!record.report && (
        <Text style={styles.subtitle}>
          旧记录未保存原始报告；以下按当前 v0.2
          演示规则补充生成，保存后可保留此快照。
        </Text>
      )}
      <ReportView report={report} confirmation={currentConfirmation} />
      <Card>
        <Field
          label="现场备注"
          value={notes ?? record.notes}
          multiline
          maxLength={5000}
          onChangeText={(s) => {
            setNotes(s);
            setSaved(false);
          }}
        />
        <Text style={styles.subtitle}>
          仅保存在本机。保存会更新同一次排障对应的记录，不上传云端。
        </Text>
        {error ? <Text accessibilityRole="alert">{error}</Text> : null}
        <Button
          title={busy ? "正在保存…" : "保存维修记录"}
          disabled={busy}
          icon="save"
          onPress={() => void save()}
        />
        {saved && (
          <View accessibilityLiveRegion="polite" style={{ gap: 10 }}>
            <Text style={{ color: colors.teal }}>
              已保存到本地维修记录，再次保存会更新同一条记录。
            </Text>
            <Button
              title="查看已保存记录"
              secondary
              onPress={() => router.push(`/record/${record.id}`)}
            />
          </View>
        )}
        {!preview && (
          <Button
            title="编辑维修确认"
            secondary
            onPress={() => router.push(`/record/${record.id}`)}
          />
        )}
      </Card>
      {preview && (
        <Button
          title="返回检查流程"
          secondary
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/diagnose")
          }
        />
      )}
    </Screen>
  );
}
