import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Text } from "react-native";
import { Screen, Heading, Card, Field, Button, styles } from "../src/ui";
const KEY = "ruodian.profile.v1";
export default function Profile() {
  const [name, setName] = useState("现场工程师");
  const [role, setRole] = useState("弱电安装 / 运维");
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  async function load() {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p.name !== "string" || typeof p.role !== "string")
          throw new Error();
        setName(p.name);
        setRole(p.role);
      }
      setReady(true);
      setMessage("");
    } catch {
      setMessage("资料读取失败，已保留原数据。请重试。");
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function save() {
    if (!name.trim()) {
      setMessage("请填写称呼。");
      return;
    }
    setBusy(true);
    try {
      await AsyncStorage.setItem(
        KEY,
        JSON.stringify({ name: name.trim(), role: role.trim() }),
      );
      setMessage("资料已保存到本机，不代表已注册或登录。");
    } catch {
      setMessage("保存失败，请重试。");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Heading title="用户资料" subtitle="仅用于本机演示，不创建云端账号。" />
      <Card>
        <Field
          label="怎么称呼你"
          value={name}
          maxLength={40}
          onChangeText={setName}
        />
        <Field
          label="工作方向"
          value={role}
          maxLength={80}
          onChangeText={setRole}
        />
        <Text style={styles.subtitle}>
          请勿填写手机号、身份证等敏感个人信息。
        </Text>
        <Button
          title={busy ? "保存中…" : "保存资料"}
          disabled={!ready || busy}
          onPress={() => void save()}
        />
        {!ready && (
          <Button title="重新读取资料" secondary onPress={() => void load()} />
        )}
      </Card>
      {message ? (
        <Text accessibilityLiveRegion="polite" style={styles.body}>
          {message}
        </Text>
      ) : null}
    </Screen>
  );
}
