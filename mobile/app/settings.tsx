import { useState } from "react";
import { Text } from "react-native";
import { API_URL, getCapabilities } from "../src/api";
import { Screen, Heading, Card, Button, styles } from "../src/ui";
export default function Settings() {
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  async function check() {
    setBusy(true);
    try {
      const c = await getCapabilities();
      setResult(
        `后端已连接 · ${c.demo ? "演示模式" : "非演示模式"}。AI：${c.ai ? "可用" : "未接入"}；图片识别：${c.imageRecognition ? "可用" : "未接入"}；订阅：${c.subscriptions ? "可用" : "未接入"}。前端维修记录仍保存在本机，不与后端同步。`,
      );
    } catch (e) {
      setResult(e instanceof Error ? e.message : "连接失败");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Heading
        title="设置与数据说明"
        subtitle="清楚了解数据在哪里、功能做到哪一步。"
      />
      <Card>
        <Text style={styles.h2}>当前运行模式</Text>
        <Text style={styles.body}>
          本地演示模式。所有排障内容均为预设示例，未调用 AI 服务。
        </Text>
        <Text style={styles.h3}>后端地址</Text>
        <Text selectable style={styles.subtitle}>
          {API_URL || "未配置（不影响本地演示）"}
        </Text>
        <Button
          title={busy ? "检查中…" : "检查后端连接"}
          disabled={busy}
          secondary
          onPress={() => void check()}
        />
        {result ? (
          <Text accessibilityLiveRegion="polite" style={styles.body}>
            {result}
          </Text>
        ) : null}
      </Card>
      <Card>
        <Text style={styles.h2}>记录与隐私</Text>
        <Text style={styles.body}>
          维修记录与演示资料保存在当前设备 /
          浏览器的本地存储中，不自动上传。清除应用数据、卸载应用或清理浏览器存储可能丢失记录。本阶段不提供云端备份。
        </Text>
        <Text style={styles.body}>
          本地存储未加密，请勿填写密码、客户个人信息或敏感现场资料。后续云端同步与图片上传将独立设计授权和权限机制。
        </Text>
      </Card>
      <Card>
        <Text style={styles.h2}>关于弱电智诊</Text>
        <Text style={styles.subtitle}>版本 0.1.0 · 第一阶段基础版本</Text>
        <Text style={styles.body}>
          面向弱电安装、维修与运维人员的现场排障助手。当前非正式商业服务，不承诺故障诊断准确率。
        </Text>
      </Card>
    </Screen>
  );
}
