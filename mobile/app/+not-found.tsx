import { router } from "expo-router";
import { Screen, Empty, Button } from "../src/ui";
export default function NotFound() {
  return (
    <Screen>
      <Empty
        title="这个页面暂时找不到"
        description="返回首页继续使用弱电智诊。"
      />
      <Button title="返回首页" onPress={() => router.replace("/")} />
    </Screen>
  );
}
