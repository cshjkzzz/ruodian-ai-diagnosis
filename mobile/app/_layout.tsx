import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RecordsProvider } from "../src/storage";
import { colors } from "../src/ui";
export default function Layout() {
  return (
    <SafeAreaProvider>
      <RecordsProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.ink,
            headerShadowVisible: false,
            headerBackTitle: "返回",
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="diagnosis"
            options={{ title: "现场排障 · 演示" }}
          />
          <Stack.Screen name="article/[id]" options={{ title: "知识详情" }} />
          <Stack.Screen name="record/[id]" options={{ title: "维修记录" }} />
          <Stack.Screen name="settings" options={{ title: "设置" }} />
          <Stack.Screen name="profile" options={{ title: "用户资料" }} />
          <Stack.Screen name="membership" options={{ title: "会员权益" }} />
          <Stack.Screen name="+not-found" options={{ title: "页面未找到" }} />
        </Stack>
      </RecordsProvider>
    </SafeAreaProvider>
  );
}
