import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { auth } from "../src/firebase";
import { useUserLimit } from "../src/hooks/useUserLimit";
import { useAppTheme } from "../src/theme";
import { Button } from "../src/ui/Button";
import { Screen } from "../src/ui/Screen";

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { colors, isDark, toggle } = useAppTheme();
  const [userId, setUserId] = useState<string | null>(auth.currentUser?.uid ?? null);
  const { dailyLimit, usedToday, isLoading: isFetchingUserDoc } = useUserLimit(userId);

  useEffect(() => {
    let isMounted = true;
    const currentUser = auth.currentUser;

    if (!currentUser) {
      router.replace("/");
      return;
    }

    if (isMounted) setUserId(currentUser.uid);

    return () => {
      isMounted = false;
    };
  }, [router]);

  const dailyLimitLabel = dailyLimit > 0 ? String(dailyLimit) : "∞";

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      router.replace("/");
    } catch (error) {
      // Prosty komunikat błędu – w przyszłości można to rozbudować
      console.error("Logout error", error);
      Alert.alert("Błąd", "Nie udało się wylogować. Spróbuj ponownie.");
    }
  }, [router]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Pressable
            onPress={toggle}
            hitSlop={10}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Ionicons
              name={isDark ? "sunny-outline" : "moon-outline"}
              size={18}
              color={colors.text}
            />
          </Pressable>

          <Pressable
            onPress={handleLogout}
            hitSlop={10}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.text} />
          </Pressable>
        </View>
      ),
    });
  }, [colors.border, colors.card, colors.text, handleLogout, isDark, navigation, toggle]);

  return (
    <Screen>
      <View style={{ gap: 18 }}>
        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.text, fontSize: 28, fontWeight: "800" }}>
            PetMagicAI
          </Text>
          <Text style={{ color: colors.muted, fontSize: 15 }}>
            Zamień zdjęcia pupila w nowoczesne grafiki.
          </Text>
        </View>

        {/* Karta dziennego limitu */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            gap: 8,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ color: colors.muted, fontSize: 13, fontWeight: "700" }}>
            Dzisiejszy limit
          </Text>
          {isFetchingUserDoc ? (
            <Text style={{ color: colors.subtle, fontSize: 14 }}>
              Ładowanie limitu...
            </Text>
          ) : (
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800" }}>
              {usedToday} / {dailyLimitLabel}
            </Text>
          )}
        </View>

        {/* Główne CTA */}
        <View style={{ gap: 10 }}>
          <Text style={{ color: colors.muted, fontSize: 13, fontWeight: "700" }}>
            Akcje
          </Text>
          <Button
            title="Stwórz nową grafikę"
            onPress={() => router.push("/new-generation")}
            left={<Ionicons name="sparkles-outline" size={18} color={colors.onPrimary} />}
          />
          <Button
            title="Historia generacji"
            variant="secondary"
            onPress={() => router.push("/history")}
            left={<Ionicons name="time-outline" size={18} color={colors.text} />}
          />
        </View>

        {/* Placeholder ostatnich generacji */}
        <View style={{ marginTop: 10, gap: 6 }}>
          <Text style={{ color: colors.muted, fontSize: 13, fontWeight: "700" }}>
            Ostatnie generacje
          </Text>
          <Text style={{ color: colors.subtle, fontSize: 13 }}>
            Tu wkrótce pojawią się miniaturki ostatnich prac.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

