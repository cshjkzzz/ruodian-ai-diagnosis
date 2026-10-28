import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  TextInputProps,
  ViewStyle,
} from "react-native";
import { Feather } from "@expo/vector-icons";
export const colors = {
  bg: "#F6F8F7",
  white: "#FFFFFF",
  ink: "#203C36",
  muted: "#70817B",
  teal: "#167C66",
  light: "#E9F3ED",
  line: "#E4EBE6",
  amber: "#996625",
};
export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: 22,
    gap: 22,
    width: "100%",
    maxWidth: 1000,
    alignSelf: "center",
    paddingBottom: 40,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  between: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 29,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: 1,
  },
  subtitle: { fontSize: 14, color: colors.muted, lineHeight: 23 },
  h2: { fontSize: 19, fontWeight: "700", color: colors.ink },
  h3: { fontSize: 16, fontWeight: "600", color: colors.ink, lineHeight: 25 },
  body: { fontSize: 15, color: colors.ink, lineHeight: 25 },
  card: {
    padding: 20,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 12,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    padding: 15,
    color: colors.ink,
    fontSize: 15,
    minHeight: 50,
  },
  badge: {
    color: colors.teal,
    backgroundColor: colors.light,
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: "600",
  },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  divider: { height: 1, backgroundColor: colors.line },
});
export function Screen({ children }: React.PropsWithChildren) {
  return (
    <ScrollView
      style={styles.page}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.content}
    >
      {children}
    </ScrollView>
  );
}
export function Heading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}
export function Card({
  children,
  style,
}: React.PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}
export function Icon({
  name,
  color = colors.teal,
  size = 22,
}: {
  name: React.ComponentProps<typeof Feather>["name"];
  color?: string;
  size?: number;
}) {
  return <Feather name={name} color={color} size={size} />;
}
export function Button({
  title,
  onPress,
  secondary,
  disabled,
  icon,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  icon?: React.ComponentProps<typeof Feather>["name"];
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: secondary ? colors.light : colors.teal,
        padding: 15,
        borderRadius: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        opacity: disabled ? 0.45 : pressed ? 0.75 : 1,
      })}
    >
      {icon && (
        <Icon name={icon} color={secondary ? colors.teal : "white"} size={18} />
      )}
      <Text
        style={{
          fontSize: 15,
          fontWeight: "600",
          color: secondary ? colors.teal : "white",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.h3}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          props.multiline && { minHeight: 110, textAlignVertical: "top" },
        ]}
        {...props}
      />
    </View>
  );
}
export function Search({
  value,
  onChangeText,
  placeholder = "搜索故障、设备或关键词",
}: {
  value: string;
  onChangeText: (s: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={[styles.row, styles.input]}>
      <Icon name="search" size={19} color={colors.muted} />
      <TextInput
        accessibilityLabel={placeholder}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        value={value}
        onChangeText={onChangeText}
        style={{ flex: 1, fontSize: 14, color: colors.ink, padding: 0 }}
      />
      {value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="清除搜索"
          onPress={() => onChangeText("")}
        >
          <Icon name="x" size={18} />
        </Pressable>
      ) : null}
    </View>
  );
}
export function Chip({
  title,
  active,
  onPress,
}: {
  title: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={{
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: active ? colors.teal : colors.white,
        borderWidth: 1,
        borderColor: active ? colors.teal : colors.line,
      }}
    >
      <Text style={{ color: active ? "white" : colors.muted, fontSize: 13 }}>
        {title}
      </Text>
    </Pressable>
  );
}
export function DemoNotice({
  text = "演示模式 · 以下内容为示例，不代表厂商官方技术资料。现场操作请遵循对应设备手册与安全规范。",
}: {
  text?: string;
}) {
  return (
    <View
      style={[
        styles.row,
        {
          alignItems: "flex-start",
          backgroundColor: "#F1EEE4",
          borderRadius: 12,
          padding: 12,
        },
      ]}
    >
      <Icon name="info" color={colors.amber} size={16} />
      <Text style={{ flex: 1, fontSize: 12, lineHeight: 20, color: "#806C45" }}>
        {text}
      </Text>
    </View>
  );
}
export function Empty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card style={{ alignItems: "center", paddingVertical: 35 }}>
      <Icon name="inbox" size={32} />
      <Text style={styles.h3}>{title}</Text>
      <Text style={styles.subtitle}>{description}</Text>
    </Card>
  );
}
