import { useRef, useState } from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  steps,
  Answers,
  Answer,
  Category,
  categories,
  categoryName,
  diagnosisStatus,
  progress,
  truncateAfter,
  RepairRecord,
} from "../src/domain";
import { useRecords } from "../src/storage";
import {
  Screen,
  Heading,
  Card,
  Button,
  DemoNotice,
  Chip,
  Field,
  styles,
  colors,
  Icon,
} from "../src/ui";
export default function Diagnosis() {
  const params = useLocalSearchParams<{
    category?: string;
    brand?: string;
    model?: string;
    description?: string;
  }>();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const [savedId, setSavedId] = useState<string>();
  const createdAt = useRef(new Date().toISOString());
  const recordId = useRef(
    `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  );
  const store = useRecords();
  const done = index >= steps.length;
  const step = steps[Math.min(index, steps.length - 1)];
  const answer = answers[step.id];
  function choose(value: Answer) {
    setAnswers((old) => truncateAfter({ ...old, [step.id]: value }, index));
  }
  async function save() {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError("");
    const category = (
      categories.some((c) => c.id === params.category)
        ? params.category
        : "camera"
    ) as Category;
    const record: RepairRecord = {
      id: recordId.current,
      title: params.description?.trim() || "摄像头添加后离线 · 演示排障",
      category,
      brand: params.brand || "",
      model: params.model || "",
      description:
        params.description || "摄像头能搜索到，但录像机添加后显示离线",
      notes,
      answers,
      status: diagnosisStatus(answers),
      createdAt: createdAt.current,
      updatedAt: new Date().toISOString(),
    };
    try {
      await store.save(record);
      setSavedId(record.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败，请重试");
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  return (
    <Screen>
      <Text style={styles.badge}>现场示例 / 监控设备离线</Text>
      <Heading
        title={done ? "每一步，都有迹可循" : "循着线索，逐项确认"}
        subtitle={
          params.description || "摄像头能搜索到，但录像机添加后显示离线"
        }
      />
      <DemoNotice text="固定演示流程，不是 AI 生成的诊断结果。品牌与型号仅作记录，不改变演示检查内容。涉及断电、改网或重启时，请先确认现场授权。" />
      {params.category && params.category !== "camera" && (
        <DemoNotice
          text={`原始问题分类：${categoryName(params.category)}。以下为监控演示，不针对该分类生成建议。`}
        />
      )}
      <View style={{ gap: 10 }}>
        <View style={styles.between}>
          <Text style={styles.h3}>
            {done ? "流程回顾" : `检查 ${index + 1} / ${steps.length}`}
          </Text>
          <Text style={styles.subtitle}>已记录 {progress(answers)} 项</Text>
        </View>
        <View
          style={{ height: 6, backgroundColor: colors.line, borderRadius: 5 }}
        >
          <View
            style={{
              height: 6,
              width: `${(progress(answers) / steps.length) * 100}%`,
              backgroundColor: colors.teal,
              borderRadius: 5,
            }}
          />
        </View>
      </View>
      {done ? (
        <Card>
          <Icon
            name={
              diagnosisStatus(answers) === "resolved"
                ? "check-circle"
                : "clipboard"
            }
            size={34}
          />
          <Text style={styles.h2}>
            {diagnosisStatus(answers) === "resolved"
              ? "已标记为验证通过"
              : "仍需进一步排查"}
          </Text>
          <Text style={styles.subtitle}>
            此状态来自你选择的现场结果，不是系统判定。跳过的项目仍需在现场确认。
          </Text>
          {steps.map((s, i) => (
            <View key={s.id} style={styles.between}>
              <Text style={[styles.body, { flex: 1 }]}>
                {i + 1}. {s.title}
              </Text>
              <Chip
                title={
                  { pass: "已通过", fail: "有异常", skip: "已跳过" }[
                    answers[s.id] ?? "skip"
                  ]
                }
                onPress={() => setIndex(i)}
              />
            </View>
          ))}
        </Card>
      ) : (
        <Card>
          <Text style={styles.badge}>检查 0{index + 1}</Text>
          <Text style={styles.h2}>{step.title}</Text>
          <Text style={styles.body}>{step.description}</Text>
          <View style={styles.divider} />
          <Text style={styles.h3}>{step.check}</Text>
          <View style={{ gap: 10 }}>
            <Button
              title={step.pass}
              secondary={answer !== "pass"}
              onPress={() => choose("pass")}
            />
            <Button
              title={step.fail}
              secondary={answer !== "fail"}
              onPress={() => choose("fail")}
            />
          </View>
          {answer && (
            <View
              accessibilityLiveRegion="polite"
              style={{
                padding: 14,
                backgroundColor: answer === "fail" ? "#FFF3E2" : colors.light,
                borderRadius: 12,
              }}
            >
              <Text style={styles.body}>
                {answer === "pass"
                  ? step.passNote
                  : answer === "fail"
                    ? step.failNote
                    : "本项已跳过，不视为检查通过。"}
              </Text>
            </View>
          )}
          <View style={styles.wrap}>
            <Chip
              title="上一步"
              onPress={() => (index ? setIndex(index - 1) : router.back())}
            />
            <Chip
              title="跳过本项"
              active={answer === "skip"}
              onPress={() => {
                choose("skip");
                setIndex(index + 1);
              }}
            />
          </View>
          <Button
            title={
              index === steps.length - 1 ? "查看排查总结" : "记录结果，下一步"
            }
            disabled={!answer}
            onPress={() => setIndex(index + 1)}
          />
        </Card>
      )}
      <Card>
        <Field
          label="现场备注"
          placeholder="记录调整内容与待办事项，不要填写密码。"
          multiline
          maxLength={5000}
          value={notes}
          onChangeText={setNotes}
        />
        <Text style={styles.subtitle}>
          记录仅保存在当前设备 / 浏览器中，不上传云端。可随时保存当前进度。
        </Text>
        {error || store.error ? (
          <Text accessibilityRole="alert" style={{ color: "#A14334" }}>
            {error || store.error}
          </Text>
        ) : null}
        <Button
          title={saving ? "正在保存…" : "保存维修记录"}
          disabled={saving || !store.ready || !!store.error}
          icon="save"
          onPress={() => void save()}
        />
        {savedId && (
          <View accessibilityLiveRegion="polite" style={{ gap: 10 }}>
            <Text style={{ color: colors.teal }}>
              已保存到本地维修记录，再次保存会更新同一条记录。
            </Text>
            <Button
              title="查看已保存记录"
              secondary
              onPress={() => router.push(`/record/${savedId}`)}
            />
          </View>
        )}
      </Card>
    </Screen>
  );
}
