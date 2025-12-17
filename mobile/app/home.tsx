import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { auth } from "../src/firebase";
import { useUserLimit } from "../src/hooks/useUserLimit";

export default function HomeScreen() {
  const router = useRouter();
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/");
    } catch (error) {
      // Prosty komunikat błędu – w przyszłości można to rozbudować
      // eslint-disable-next-line no-console
      console.error("Logout error", error);
      Alert.alert("Błąd", "Nie udało się wylogować. Spróbuj ponownie.");
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        padding: 24,
        backgroundColor: "#020617",
      }}
    >
      <View style={{ gap: 24 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text
              style={{
                color: "white",
                fontSize: 28,
                fontWeight: "700",
                marginBottom: 4,
              }}
            >
              PetMagicAI 🐾
            </Text>
            <Text style={{ color: "#9ca3af", fontSize: 16 }}>
              Zamień zdjęcia swojego pupila w magiczne grafiki.
            </Text>
          </View>

          <Pressable
            onPress={handleLogout}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: "#4b5563",
              backgroundColor: "transparent",
            }}
          >
            <Text style={{ color: "#e5e7eb", fontSize: 12, fontWeight: "500" }}>
              Wyloguj
            </Text>
          </Pressable>
        </View>

        {/* Karta dziennego limitu */}
          <View
            style={{
              backgroundColor: "#0f172a",
              borderRadius: 16,
              padding: 20,
              gap: 8,
            }}
          >
            <Text
              style={{
                color: "#e5e7eb",
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              Dzisiejszy limit
            </Text>
            {isFetchingUserDoc ? (
              <Text style={{ color: "#9ca3af", fontSize: 14 }}>
                Ładowanie limitu...
              </Text>
            ) : (
              <>
                <Text style={{ color: "white", fontSize: 22, fontWeight: "700" }}>
                  Użyto: {usedToday} / {dailyLimitLabel} dzisiaj
                </Text>
              </>
            )}
          </View>

        {/* Główne CTA */}
        <View style={{ gap: 12 }}>
          <Text
            style={{
              color: "#e5e7eb",
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            Co chcesz zrobić?
          </Text>

          <Pressable
            onPress={() => router.push("/new-generation")}
            style={{
              backgroundColor: "#22c55e",
              borderRadius: 999,
              paddingVertical: 16,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: "black",
                fontSize: 16,
                fontWeight: "700",
              }}
            >
              Stwórz nową grafikę
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/history")}
            style={{
              backgroundColor: "#0f172a",
              borderRadius: 999,
              paddingVertical: 14,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#1f2937",
            }}
          >
            <Text
              style={{
                color: "#e5e7eb",
                fontSize: 15,
                fontWeight: "500",
              }}
            >
              Zobacz historię generacji
            </Text>
          </Pressable>
        </View>

        {/* Placeholder ostatnich generacji */}
        <View style={{ marginTop: 16, gap: 12 }}>
          <Text
            style={{
              color: "#e5e7eb",
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            Ostatnie generacje
          </Text>
          <Text style={{ color: "#6b7280", fontSize: 13 }}>
            W przyszłości pojawią się tu miniaturki Twoich ostatnich grafik.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

