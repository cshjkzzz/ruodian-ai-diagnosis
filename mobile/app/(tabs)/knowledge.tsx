import { useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { categories, filterArticles } from "../../src/domain";
import { ArticleCard } from "../../src/ArticleCard";
import {
  Screen,
  Heading,
  Search,
  Chip,
  DemoNotice,
  Empty,
  styles,
} from "../../src/ui";
export default function Knowledge() {
  const params = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(params.q ?? "");
  const [category, setCategory] = useState("all");
  const items = filterArticles(query, category);
  return (
    <Screen>
      <Heading
        title="现场知识库"
        subtitle="把经验整理成线索，让排查更有方向。"
      />
      <Search value={query} onChangeText={setQuery} />
      <View style={styles.wrap}>
        <Chip
          title="全部"
          active={category === "all"}
          onPress={() => setCategory("all")}
        />
        {categories.map((c) => (
          <Chip
            key={c.id}
            title={c.name}
            active={category === c.id}
            onPress={() => setCategory(c.id)}
          />
        ))}
      </View>
      <Text style={styles.subtitle}>共 {items.length} 篇演示文章</Text>
      {items.map((a) => (
        <ArticleCard key={a.id} article={a} />
      ))}
      {!items.length && (
        <Empty
          title="这里的知识还在整理中"
          description="换一个分类或关键词，查看已有演示文章。"
        />
      )}
      <DemoNotice />
    </Screen>
  );
}
