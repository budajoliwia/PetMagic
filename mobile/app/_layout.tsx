import { Stack } from "expo-router";
import React from "react";
import { AppThemeProvider, useAppTheme } from "../src/theme";

function ThemedStack() {
  const { colors } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="home" options={{ title: "PetMagicAI" }} />
      <Stack.Screen name="new-generation" options={{ title: "Nowa generacja" }} />
      <Stack.Screen name="job-status" options={{ title: "Status generacji" }} />
      <Stack.Screen name="history" options={{ title: "Twoje generacje" }} />
      <Stack.Screen name="generation/[id]" options={{ title: "Szczegóły generacji" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <ThemedStack />
    </AppThemeProvider>
  );
}
