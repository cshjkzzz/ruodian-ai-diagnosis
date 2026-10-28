import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Tabs } from "expo-router";
import { Icon, colors } from "../../src/ui";
const tabs = [
  { name: "index", title: "首页", icon: "home" },
  { name: "diagnose", title: "AI诊断", icon: "activity" },
  { name: "knowledge", title: "知识库", icon: "book-open" },
  { name: "records", title: "维修记录", icon: "clipboard" },
  { name: "me", title: "我的", icon: "user" },
] as const;
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerTitle: "弱电智诊",
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: "white",
          borderTopColor: colors.line,
          height: 64 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
        },
        tabBarItemStyle: { paddingVertical: 0 },
        tabBarLabelStyle: {
          fontSize: 11,
          lineHeight: 18,
          marginTop: 2,
          flexShrink: 0,
        },
      }}
    >
      {tabs.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color }) => (
              <Icon
                name={t.icon}
                color={typeof color === "string" ? color : colors.teal}
                size={21}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
