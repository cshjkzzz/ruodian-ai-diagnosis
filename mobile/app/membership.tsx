import { Text, View } from "react-native";
import { Screen, Heading, Card, DemoNotice, Icon, styles } from "../src/ui";
export default function Membership() {
  return (
    <Screen>
      <Text style={styles.badge}>产品规划 · 当前未开放</Text>
      <Heading
        title="让专业，多一份支持"
        subtitle="订阅服务尚在规划中，所有权益均未上线。"
      />
      {[
        {
          icon: "activity" as const,
          title: "AI 深度诊断",
          body: "规划接入模型辅助分析，提供可追溯的排障建议。",
        },
        {
          icon: "camera" as const,
          title: "现场图片识别",
          body: "规划识别设备与指示灯，上传前将征求授权。",
        },
        {
          icon: "book-open" as const,
          title: "专业知识库",
          body: "规划引入授权资料、版本管理与来源标注。",
        },
        {
          icon: "users" as const,
          title: "团队维修档案",
          body: "规划账号权限、云端同步与团队经验沉淀。",
        },
      ].map((x) => (
        <Card key={x.title}>
          <View style={styles.row}>
            <Icon name={x.icon} />
            <Text style={styles.h2}>{x.title}</Text>
          </View>
          <Text style={styles.subtitle}>{x.body}</Text>
          <Text style={styles.badge}>规划中 · 暂不可用</Text>
        </Card>
      ))}
      <DemoNotice text="本版本无订阅、无价格、无支付入口，也不会扣费。正式上线前将另行公布服务条款与会员权益。" />
    </Screen>
  );
}
