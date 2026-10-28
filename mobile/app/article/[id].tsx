import { useLocalSearchParams, router } from "expo-router";
import { Text, View } from "react-native";
import { articles, categoryName } from "../../src/domain";
import {
  Screen,
  Heading,
  Card,
  DemoNotice,
  Button,
  Empty,
  styles,
} from "../../src/ui";
export default function Article() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const a = articles.find((item) => item.id === id);
  if (!a)
    return (
      <Screen>
        <Empty title="文章不存在" description="请返回知识库重新选择。" />
        <Button
          title="返回知识库"
          onPress={() => router.replace("/knowledge")}
        />
      </Screen>
    );
  return (
    <Screen>
      <Text style={styles.badge}>
        {categoryName(a.category)} · {a.minutes} 分钟阅读 · 演示资料
      </Text>
      <Heading title={a.title} subtitle={a.summary} />
      <DemoNotice />
      {a.sections.map((s, i) => (
        <Card key={s.title}>
          <Text style={styles.badge}>0{i + 1}</Text>
          <Text style={styles.h2}>{s.title}</Text>
          <Text style={styles.body}>{s.body}</Text>
        </Card>
      ))}
      <View style={{ gap: 12 }}>
        <Text style={styles.subtitle}>
          资料来源：项目内人工编写的演示示例。未经厂商审核，不是官方技术文档。
        </Text>
        <Button
          title="带着这个现象开始演示排障"
          onPress={() =>
            router.push({
              pathname: "/diagnose",
              params: { category: a.category },
            })
          }
        />
      </View>
    </Screen>
  );
}
