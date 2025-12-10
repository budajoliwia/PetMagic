import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { auth, db } from "../src/firebase";
import { UserDoc } from "../src/models";

export default function HomeScreen() {
  const router = useRouter();
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [isFetchingUserDoc, setIsFetchingUserDoc] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const currentUser = auth.currentUser;

    if (!currentUser) {
      router.replace("/");
      setIsFetchingUserDoc(false);
      return;
    }

    const fetchUserDoc = async () => {
      try {
        const snapshot = await getDoc(doc(db, "users", currentUser.uid));
        if (snapshot.exists() && isMounted) {
          setUserDoc(snapshot.data() as UserDoc);
        } else if (!snapshot.exists()) {
          console.warn("User document missing for", currentUser.uid);
        }
      } catch (error) {
        console.error("Failed to load user document", error);
      } finally {
        if (isMounted) {
          setIsFetchingUserDoc(false);
        }
      }
    };

    fetchUserDoc();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Placeholder values – docelowo pobierane z Firestore (users/{uid})
  const dailyLimit = userDoc?.dailyLimit ?? 0;
  const usedToday = userDoc?.usedToday ?? 0;
  const remaining = Math.max(dailyLimit - usedToday, 0);

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
                  Dzienny limit: {dailyLimit}
                </Text>
                <Text style={{ color: "#9ca3af", fontSize: 16 }}>
                  Zużyto dziś: {usedToday}
                </Text>
                <Text style={{ color: "#22c55e", fontSize: 16, fontWeight: "600" }}>
                  Zostało: {remaining}
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

