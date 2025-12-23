import React from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { useAppTheme } from "../theme";

export function Chip({
  label,
  selected,
  onPress,
  style,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  const { colors, isDark } = useAppTheme();

  const bg = selected ? (isDark ? "#063B2D" : "#DCFCE7") : "transparent";
  const border = selected ? colors.primary : colors.border;
  const text = selected ? colors.text : colors.muted;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          borderColor: border,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color: text }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
  },
});


