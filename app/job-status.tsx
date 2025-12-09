import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, ScrollView, Text, View, Pressable } from "react-native";

// Na razie status i dane joba są mockowane.
// Docelowo ten ekran będzie nasłuchiwał dokumentu jobs/{jobId} w Firestore.
const MOCK_STATUS: "queued" | "processing" | "done" | "error" = "queued";

export default function JobStatusScreen() {
  const router = useRouter();

  const statusLabel = useMemo(() => {
    switch (MOCK_STATUS) {
      case "queued":
        return "Zakolejkowane";
      case "processing":
        return "Przetwarzanie";
      case "done":
        return "Gotowe";
      case "error":
        return "Błąd";
      default:
        return MOCK_STATUS;
    }
  }, []);

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        padding: 24,
        backgroundColor: "#020617",
      }}
    >
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
        }}
      >
        <View style={{ alignItems: "center", gap: 12 }}>
          <Text
            style={{
              color: "white",
              fontSize: 24,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            Twoja grafika powstaje…
          </Text>
          <Text
            style={{
              color: "#9ca3af",
              fontSize: 14,
              textAlign: "center",
            }}
          >
            To może potrwać kilkanaście sekund. Nie zamykaj aplikacji.
          </Text>
        </View>

        <View style={{ alignItems: "center", gap: 16 }}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={{ color: "#a5b4fc", fontSize: 14 }}>
            Analizuję futerko… Dodaję magię… ✨
          </Text>
        </View>

        <View
          style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 12,
            backgroundColor: "#0f172a",
            width: "100%",
            gap: 8,
          }}
        >
          <Text
            style={{
              color: "#e5e7eb",
              fontSize: 14,
              fontWeight: "600",
            }}
          >
            Status joba (mock):
          </Text>
          <Text style={{ color: "#9ca3af", fontSize: 14 }}>
            status: <Text style={{ color: "#22c55e" }}>{MOCK_STATUS}</Text> (
            {statusLabel})
          </Text>
          <Text style={{ color: "#6b7280", fontSize: 12 }}>
            Docelowo ten ekran będzie reagował na status:{" "}
            <Text style={{ fontWeight: "600" }}>
              queued / processing / done / error
            </Text>{" "}
            i w przypadku{" "}
            <Text style={{ fontWeight: "600" }}>done</Text> przejdzie do
            ekranu szczegółów generacji.
          </Text>
        </View>

        <View style={{ width: "100%", marginTop: "auto", gap: 12 }}>
          <Pressable
            onPress={() => router.replace("/home")}
            style={{
              paddingVertical: 14,
              borderRadius: 999,
              backgroundColor: "#0f172a",
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#1f2937",
            }}
          >
            <Text style={{ color: "#e5e7eb", fontWeight: "500" }}>
              Wróć do ekranu głównego
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}


