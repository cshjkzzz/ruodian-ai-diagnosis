import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { categories } from "../../src/domain";
import {
  Screen,
  Heading,
  Card,
  Field,
  Chip,
  Button,
  DemoNotice,
  Icon,
  styles,
} from "../../src/ui";
export default function Diagnose() {
  const params = useLocalSearchParams<{ category?: string }>();
  const [category, setCategory] = useState("camera");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (categories.some((c) => c.id === params.category))
      setCategory(params.category!);
  }, [params.category]);
  function start() {
    if (!description.trim()) {
      setError("请先描述故障，或使用下方现场示例。");
      return;
    }
    setError("");
    router.push({
      pathname: "/diagnosis",
      params: {
        category,
        brand: brand.trim(),
        model: model.trim(),
        description: description.trim(),
      },
    });
  }
  return (
    <Screen>
      <Heading
        title="一起，理清故障"
        subtitle="从现场现象开始，留下每一步排查依据。"
      />
      <DemoNotice text="AI 功能尚未接入。当前仅提供固定的摄像头离线演示流程，不会根据描述生成诊断结论。" />
      <Card>
        <Text style={styles.h3}>设备分类</Text>
        <View style={styles.wrap}>
          {categories.map((c) => (
            <Chip
              key={c.id}
              title={c.name}
              active={category === c.id}
              onPress={() => setCategory(c.id)}
            />
          ))}
        </View>
        <Field
          label="故障描述"
          placeholder="例如：摄像头能搜索到，但录像机添加后显示离线……"
          multiline
          value={description}
          onChangeText={setDescription}
          maxLength={2000}
        />
        <Text style={styles.subtitle}>
          请勿输入设备密码、客户个人信息或其他敏感内容。
        </Text>
        <Text style={styles.h3}>设备品牌（可选）</Text>
        <View style={styles.wrap}>
          {["海康威视", "大华", "宇视", "其他"].map((b) => (
            <Chip
              key={b}
              title={b}
              active={brand === b}
              onPress={() => setBrand(brand === b ? "" : b)}
            />
          ))}
        </View>
        <Field
          label="品牌名称"
          placeholder="选择上方品牌，或自行填写"
          value={brand}
          onChangeText={setBrand}
          maxLength={80}
        />
        <Field
          label="设备型号（可选）"
          placeholder="如不清楚，可暂不填写"
          value={model}
          onChangeText={setModel}
          maxLength={120}
        />
        {error ? (
          <Text accessibilityRole="alert" style={{ color: "#A14334" }}>
            {error}
          </Text>
        ) : null}
        <Button title="进入演示排查" icon="arrow-right" onPress={start} />
        {category !== "camera" && (
          <Text style={styles.subtitle}>
            当前所选分类尚无专用流程。下一页仍将明确展示“监控摄像头离线”示例，原始分类保存在记录中。
          </Text>
        )}
      </Card>
      <Card>
        <View style={styles.row}>
          <Icon name="compass" />
          <Text style={styles.h3}>先体验一次现场排障</Text>
        </View>
        <Text style={styles.body}>摄像头能搜索到，但录像机添加后显示离线</Text>
        <Text style={styles.subtitle}>
          6 个检查步骤 · 可返回、跳过和保存进度
        </Text>
        <Button
          title="使用此现场示例"
          secondary
          onPress={() =>
            router.push({
              pathname: "/diagnosis",
              params: {
                category: "camera",
                description: "摄像头能搜索到，但录像机添加后显示离线",
              },
            })
          }
        />
      </Card>
    </Screen>
  );
}
