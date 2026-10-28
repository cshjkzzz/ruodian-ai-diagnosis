import { useState } from "react";
import { Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import { useRecords } from "../../src/storage";
import { categoryName } from "../../src/domain";
import {
  Screen,
  Heading,
  Card,
  Search,
  Chip,
  Empty,
  Button,
  Icon,
  styles,
  colors,
} from "../../src/ui";
export default function Records() {
  const store = useRecords();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const items = store.records.filter(
    (r) =>
      (status === "all" || r.status === status) &&
      `${r.title} ${r.description} ${r.brand} ${r.model} ${r.notes}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  return (
    <Screen>
      <Heading title="维修记录" subtitle="让每次处理，都成为下次的经验。" />
      <Text style={styles.badge}>本机存储 · 演示阶段 · 不与云端同步</Text>
      <Search
        value={query}
        onChangeText={setQuery}
        placeholder="搜索记录、品牌或处理备注"
      />
      <View style={styles.wrap}>
        {[
          { id: "all", title: "全部" },
          { id: "pending", title: "待排查" },
          { id: "resolved", title: "已解决" },
        ].map((s) => (
          <Chip
            key={s.id}
            title={s.title}
            active={status === s.id}
            onPress={() => setStatus(s.id)}
          />
        ))}
      </View>
      {!store.ready ? (
        <Text style={styles.subtitle}>正在读取本地记录…</Text>
      ) : store.error ? (
        <Card>
          <Text style={styles.body}>{store.error}</Text>
          <Button title="重试读取" onPress={() => void store.reload()} />
        </Card>
      ) : items.length ? (
        items.map((r) => (
          <Pressable
            key={r.id}
            accessibilityRole="button"
            onPress={() => router.push(`/record/${r.id}`)}
          >
            <Card>
              <View style={styles.between}>
                <Text style={styles.badge}>
                  {categoryName(r.category)} ·{" "}
                  {r.status === "resolved" ? "已解决" : "待排查"}
                </Text>
                <Icon name="chevron-right" size={18} />
              </View>
              <Text numberOfLines={2} style={styles.h3}>
                {r.title}
              </Text>
              <Text style={styles.subtitle}>
                {[r.brand, r.model].filter(Boolean).join(" / ") ||
                  "未填写设备品牌型号"}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>
                更新于 {new Date(r.updatedAt).toLocaleString("zh-CN")}
              </Text>
            </Card>
          </Pressable>
        ))
      ) : (
        <Empty
          title={
            query || status !== "all" ? "未找到匹配记录" : "还没有维修记录"
          }
          description="完成或暂停一次演示排障后，即可保存记录。"
        />
      )}
      <Button
        title="开始一次现场演示"
        secondary
        onPress={() => router.push("/diagnose")}
      />
    </Screen>
  );
}
