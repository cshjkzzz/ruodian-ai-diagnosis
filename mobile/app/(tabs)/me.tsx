import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import { useRecords } from "../../src/storage";
import {
  Screen,
  Heading,
  Card,
  Button,
  Icon,
  DemoNotice,
  styles,
  colors,
} from "../../src/ui";
export default function Me() {
  const { records } = useRecords();
  const [name, setName] = useState("现场工程师");
  useFocusEffect(
    useCallback(() => {
      let active = true;
      AsyncStorage.getItem("ruodian.profile.v1")
        .then((raw) => {
          if (!active || !raw) return;
          const profile = JSON.parse(raw);
          if (typeof profile.name === "string") setName(profile.name);
        })
        .catch(() => {
          if (active) setName("现场工程师");
        });
      return () => {
        active = false;
      };
    }, []),
  );
  return (
    <Screen>
      <Heading title="我的工作台" subtitle="专注现场，也照顾每一次积累。" />
      <Card>
        <View style={styles.row}>
          <View
            style={{
              backgroundColor: colors.light,
              borderRadius: 22,
              padding: 18,
            }}
          >
            <Icon name="user" size={30} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.h2}>{name}</Text>
            <Text style={styles.subtitle}>本地演示用户 · 尚未登录</Text>
          </View>
        </View>
        <Button
          title="查看与编辑资料"
          secondary
          onPress={() => router.push("/profile")}
        />
      </Card>
      <View style={styles.row}>
        {[
          { value: records.length, title: "本机维修记录" },
          {
            value: records.filter((r) => r.status === "resolved").length,
            title: "已标记解决",
          },
        ].map((s) => (
          <Card key={s.title} style={{ flex: 1, alignItems: "center" }}>
            <Text
              style={{ fontSize: 30, fontWeight: "700", color: colors.teal }}
            >
              {s.value}
            </Text>
            <Text style={styles.subtitle}>{s.title}</Text>
          </Card>
        ))}
      </View>
      <Card style={{ backgroundColor: "#EFEDE4", borderColor: "#E8E3D4" }}>
        <View style={styles.row}>
          <Icon name="award" color="#8A7143" />
          <Text style={styles.h2}>专业会员 · 敬请期待</Text>
        </View>
        <Text style={styles.subtitle}>
          计划提供深度诊断、专业知识与团队协作。当前尚未提供订阅或付费服务。
        </Text>
        <Button
          title="了解规划中的权益"
          secondary
          onPress={() => router.push("/membership")}
        />
      </Card>
      {[
        {
          title: "设置与数据说明",
          icon: "settings" as const,
          path: "/settings" as const,
        },
        {
          title: "我的维修记录",
          icon: "clipboard" as const,
          path: "/records" as const,
        },
      ].map((item) => (
        <Pressable
          key={item.title}
          accessibilityRole="button"
          onPress={() => router.push(item.path)}
        >
          <Card>
            <View style={styles.between}>
              <View style={styles.row}>
                <Icon name={item.icon} />
                <Text style={styles.h3}>{item.title}</Text>
              </View>
              <Icon name="chevron-right" size={18} />
            </View>
          </Card>
        </Pressable>
      ))}
      <DemoNotice text="弱电智诊 v0.2.0 · 产品基础演示版。尚未接入用户登录、真实 AI、图片识别或支付。" />
    </Screen>
  );
}
