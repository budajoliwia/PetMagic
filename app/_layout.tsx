import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="home" options={{ title: "PetMagicAI" }} />
      <Stack.Screen
        name="new-generation"
        options={{ title: "Nowa generacja" }}
      />
      <Stack.Screen
        name="job-status"
        options={{ title: "Status generacji" }}
      />
      <Stack.Screen
        name="history"
        options={{ title: "Twoje generacje" }}
      />
      <Stack.Screen
        name="generation/[id]"
        options={{ title: "Szczegóły generacji" }}
      />
    </Stack>
  );
}
