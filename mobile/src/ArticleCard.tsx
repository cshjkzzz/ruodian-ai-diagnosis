import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { articles, categoryName } from "./domain";
import { Card, Icon, styles, colors } from "./ui";
export function ArticleCard({
  article: a,
}: {
  article: (typeof articles)[number];
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`阅读：${a.title}`}
      onPress={() => router.push(`/article/${a.id}`)}
    >
      <Card>
        <View style={styles.between}>
          <Text style={styles.badge}>
            {categoryName(a.category)} · 演示资料
          </Text>
          <Text style={styles.subtitle}>{a.minutes} 分钟阅读</Text>
        </View>
        <Text style={styles.h3}>{a.title}</Text>
        <Text style={styles.subtitle}>{a.summary}</Text>
        <View style={styles.between}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            {a.tags.join("  /  ")}
          </Text>
          <Icon name="arrow-up-right" size={18} />
        </View>
      </Card>
    </Pressable>
  );
}
