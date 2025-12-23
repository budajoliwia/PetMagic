import { StatusBar } from "expo-status-bar";
import React from "react";
import { ScrollView, ScrollViewProps, View, ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "../theme";

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  padding?: number;
  contentContainerStyle?: ScrollViewProps["contentContainerStyle"];
  style?: ViewProps["style"];
};

export function Screen({
  children,
  scroll = true,
  padding = 20,
  contentContainerStyle,
  style,
}: Props) {
  const { colors, isDark } = useAppTheme();

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: colors.bg }, style]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      {scroll ? (
        <ScrollView
          contentContainerStyle={[
            { padding, paddingBottom: padding + 12, flexGrow: 1 },
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, padding }}>{children}</View>
      )}
    </SafeAreaView>
  );
}


