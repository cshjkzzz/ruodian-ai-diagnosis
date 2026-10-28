import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  steps,
  RepairRecord,
  categories,
  diagnosisStatus,
} from "../../src/domain";
import type { RepairConfirmation } from "../../src/report";
import { useRecords } from "../../src/storage";
import {
  Screen,
  Heading,
  Card,
  Field,
  Button,
  Chip,
  Empty,
  styles,
} from "../../src/ui";
export default function RecordDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useRecords();
  const existing = store.records.find((r) => r.id === id);
  const [draft, setDraft] = useState<RepairRecord>();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    setDraft(existing);
  }, [existing]);
  if (!store.ready)
    return (
      <Screen>
        <Text>正在读取…</Text>
      </Screen>
    );
  if (store.error)
    return (
      <Screen>
        <Text style={styles.body}>{store.error}</Text>
        <Button title="重试读取" onPress={() => void store.reload()} />
      </Screen>
    );
  if (!draft)
    return (
      <Screen>
        <Empty
          title="记录不存在"
          description="可能已被删除，或保存在另一台设备 / 浏览器中。"
        />
        <Button
          title="返回记录列表"
          onPress={() => router.replace("/records")}
        />
      </Screen>
    );
  function update<K extends keyof RepairRecord>(
    key: K,
    value: RepairRecord[K],
  ) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
    setMessage("");
  }
  function confirmRepair(patch: Partial<RepairConfirmation>) {
    if (!draft) return;
    const confirmation: RepairConfirmation = {
      repairActions: "",
      finalCause: "",
      repaired: null,
      ...draft.confirmation,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    setDraft({
      ...draft,
      confirmation,
      status:
        confirmation.repaired === null
          ? diagnosisStatus(draft.answers)
          : confirmation.repaired
            ? "resolved"
            : "pending",
    });
    setMessage("");
  }
  async function save() {
    if (!draft || busy) return;
    if (!draft.title.trim() || !draft.description.trim()) {
      setMessage("标题和故障描述不能为空。");
      return;
    }
    setBusy(true);
    try {
      await store.save({
        ...draft,
        title: draft.title.trim(),
        updatedAt: new Date().toISOString(),
      });
      setMessage("修改已保存到本机。");
    } catch {
      setMessage("保存失败，请检查存储空间并重试。");
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!draft || busy) return;
    setBusy(true);
    try {
      await store.remove(draft.id);
      router.replace("/records");
    } catch {
      setMessage("删除失败，请重试。");
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Heading title="现场处理档案" subtitle="本机记录 · 演示流程 · 可编辑" />
      <Button
        title="查看历史诊断报告"
        secondary
        onPress={() => router.push(`/report/${draft.id}`)}
      />
      <Card>
        <Field
          label="记录标题"
          value={draft.title}
          maxLength={2000}
          onChangeText={(s) => update("title", s)}
        />
        <Text style={styles.h3}>设备分类</Text>
        <View style={styles.wrap}>
          {categories.map((c) => (
            <Chip
              key={c.id}
              title={c.name}
              active={draft.category === c.id}
              onPress={() =>
                update("category", c.id as RepairRecord["category"])
              }
            />
          ))}
        </View>
        <Field
          label="设备品牌"
          value={draft.brand}
          maxLength={80}
          onChangeText={(s) => update("brand", s)}
        />
        <Field
          label="设备型号"
          value={draft.model}
          maxLength={120}
          onChangeText={(s) => update("model", s)}
        />
        <Field
          label="故障描述"
          value={draft.description}
          maxLength={2000}
          multiline
          onChangeText={(s) => update("description", s)}
        />
        <Field
          label="处理备注"
          value={draft.notes}
          maxLength={5000}
          multiline
          onChangeText={(s) => update("notes", s)}
        />
        <Text style={styles.h3}>处理状态（手动记录）</Text>
        <View style={styles.wrap}>
          <Chip
            title="待排查"
            active={draft.status === "pending"}
            onPress={() => confirmRepair({ repaired: false })}
          />
          <Chip
            title="已解决"
            active={draft.status === "resolved"}
            onPress={() => confirmRepair({ repaired: true })}
          />
        </View>
        <Text style={styles.subtitle}>
          创建于 {new Date(draft.createdAt).toLocaleString("zh-CN")}
        </Text>
      </Card>
      <Card>
        <Text style={styles.h2}>演示检查历史</Text>
        {steps.map((s) => (
          <View key={s.id} style={styles.between}>
            <Text style={[styles.body, { flex: 1 }]}>{s.title}</Text>
            <Text style={styles.subtitle}>
              {draft.answers[s.id]
                ? { pass: "已通过", fail: "有异常", skip: "已跳过" }[
                    draft.answers[s.id]!
                  ]
                : "未检查"}
            </Text>
          </View>
        ))}
      </Card>
      <Card>
        <Text style={styles.h2}>维修人员确认 · 非系统推测</Text>
        <Field
          label="实际维修措施"
          multiline
          maxLength={5000}
          value={draft.confirmation?.repairActions ?? ""}
          onChangeText={(s) => confirmRepair({ repairActions: s })}
        />
        <Field
          label="最终故障原因（人工确认）"
          multiline
          maxLength={2000}
          value={draft.confirmation?.finalCause ?? ""}
          placeholder="未确认时请留空，不自动采用系统推测"
          onChangeText={(s) => confirmRepair({ finalCause: s })}
        />
        <Text style={styles.h3}>是否修复（维修人员确认）</Text>
        <View style={styles.wrap}>
          <Chip
            title="尚未确认"
            active={draft.confirmation?.repaired == null}
            onPress={() => confirmRepair({ repaired: null })}
          />
          <Chip
            title="尚未修复"
            active={draft.confirmation?.repaired === false}
            onPress={() => confirmRepair({ repaired: false })}
          />
          <Chip
            title="已修复"
            active={draft.confirmation?.repaired === true}
            onPress={() => confirmRepair({ repaired: true })}
          />
        </View>
        <Text style={styles.subtitle}>
          请点击下方“保存修改”。人工确认独立保存，不会把报告中的可能原因改为系统确认的根因。
        </Text>
      </Card>
      {message ? (
        <Text accessibilityLiveRegion="polite" style={styles.body}>
          {message}
        </Text>
      ) : null}
      <Button
        title={busy ? "正在处理…" : "保存修改"}
        disabled={busy}
        onPress={() => void save()}
      />
      <Button
        title="删除这条记录"
        secondary
        disabled={busy}
        onPress={() => setConfirmDelete(true)}
      />
      {confirmDelete && (
        <Card>
          <Text style={styles.body}>
            确定删除本机这条记录？此操作无法撤销。
          </Text>
          <Button
            title="确认删除"
            disabled={busy}
            onPress={() => void remove()}
          />
          <Button
            title="保留记录"
            secondary
            disabled={busy}
            onPress={() => setConfirmDelete(false)}
          />
        </Card>
      )}
    </Screen>
  );
}
