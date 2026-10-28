import { useState } from "react";
import { View, Text, Pressable, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { categories, filterArticles } from "../../src/domain";
import { ArticleCard } from "../../src/ArticleCard";
import {
  Screen,
  Heading,
  Card,
  Search,
  Icon,
  Button,
  DemoNotice,
  styles,
  colors,
  Empty,
} from "../../src/ui";
export default function Home() {
  const [query, setQuery] = useState("");
  const wide = useWindowDimensions().width > 650;
  const results = filterArticles(query);
  return (
    <Screen>
      <View style={styles.between}>
        <Heading title="弱电智诊" subtitle="把复杂故障，一步步理清。" />
        <View
          style={{
            backgroundColor: colors.light,
            padding: 12,
            borderRadius: 16,
          }}
        >
          <Icon name="tool" size={25} />
        </View>
      </View>
      <Search value={query} onChangeText={setQuery} />
      <Card
        style={{
          backgroundColor: colors.teal,
          borderColor: colors.teal,
          padding: 25,
        }}
      >
        <View style={styles.between}>
          <Text style={{ color: "#D6EBDD", fontSize: 12, letterSpacing: 2 }}>
            你的现场排障助手
          </Text>
          <Icon name="activity" color="#D6EBDD" />
        </View>
        <Text
          style={{
            color: "white",
            fontSize: wide ? 29 : 25,
            lineHeight: 39,
            fontWeight: "700",
          }}
        >
          遇到难题？ 从一次有条理的诊断开始
        </Text>
        <Text style={{ color: "#D6EBDD", lineHeight: 23, fontSize: 13 }}>
          描述故障，逐项检查，让每次维修都有迹可循。
        </Text>
        <View style={{ alignSelf: "flex-start", marginTop: 6 }}>
          <Button
            title="开始演示诊断"
            secondary
            icon="arrow-right"
            onPress={() => router.push("/diagnose")}
          />
        </View>
      </Card>
      <View style={{ gap: 14 }}>
        <Text style={styles.h2}>今天，要解决什么问题？</Text>
        <View style={styles.wrap}>
          {categories.map((c) => (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={`${c.name}故障诊断`}
              onPress={() =>
                router.push({
                  pathname: "/diagnose",
                  params: { category: c.id },
                })
              }
              style={{ width: wide ? "23.5%" : "48%", flexGrow: 1 }}
            >
              <Card style={{ gap: 10 }}>
                <View
                  style={{
                    backgroundColor: colors.light,
                    padding: 12,
                    borderRadius: 13,
                    alignSelf: "flex-start",
                  }}
                >
                  <Icon name={c.icon as "video"} />
                </View>
                <Text style={styles.h3}>{c.name}</Text>
                <Text style={{ color: colors.muted, fontSize: 11 }}>
                  {c.description}
                </Text>
              </Card>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={{ gap: 14 }}>
        <View style={styles.between}>
          <Text style={styles.h2}>
            {query ? "搜索结果" : "常见故障 · 先看这里"}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/knowledge")}
          >
            <Text style={{ color: colors.teal, fontSize: 13 }}>全部知识 →</Text>
          </Pressable>
        </View>
        {results.slice(0, 3).map((a) => (
          <ArticleCard key={a.id} article={a} />
        ))}
        {!results.length && (
          <Empty
            title="暂未找到相关内容"
            description="试试“离线”“Wi-Fi”或“画面”等关键词。"
          />
        )}
      </View>
      <DemoNotice />
    </Screen>
  );
}
