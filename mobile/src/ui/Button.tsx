import React from "react";
import { Pressable, PressableProps, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../theme";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

type Props = PressableProps & {
  title: string;
  variant?: Variant;
  size?: Size;
  left?: React.ReactNode;
};

export function Button({
  title,
  variant = "primary",
  size = "lg",
  left,
  disabled,
  style,
  ...rest
}: Props) {
  const { colors } = useAppTheme();

  const height = size === "lg" ? 48 : 40;
  const padX = size === "lg" ? 16 : 14;

  const bg = (() => {
    if (variant === "primary") return colors.primary;
    if (variant === "secondary") return colors.card;
    if (variant === "danger") return colors.danger;
    return "transparent";
  })();

  const borderColor = (() => {
    if (variant === "ghost") return colors.border;
    if (variant === "secondary") return colors.border;
    return "transparent";
  })();

  const textColor = (() => {
    if (variant === "primary") return colors.onPrimary;
    if (variant === "danger") return "#111827";
    return colors.text;
  })();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          paddingHorizontal: padX,
          backgroundColor: bg,
          borderColor,
          opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
        },
        style as any,
      ]}
      {...rest}
    >
      <View style={styles.inner}>
        {left ? <View style={{ marginRight: 10 }}>{left}</View> : null}
        <Text style={[styles.text, { color: textColor }]} numberOfLines={1}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  inner: { flexDirection: "row", alignItems: "center" },
  text: { fontWeight: "700", fontSize: 15 },
});


