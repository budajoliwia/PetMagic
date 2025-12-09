import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function GenerationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [isFavorite, setIsFavorite] = useState(false);

  // Docelowo dane będą pobierane z generations/{generationId}
  const mockStyle = "Cartoon";
  const mockCreatedAt = "Dziś, 12:34";

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        padding: 16,
        backgroundColor: "#020617",
      }}
    >
      {/* Nagłówek */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 999,
            backgroundColor: "#0f172a",
            marginRight: 12,
          }}
        >
          <Text style={{ color: "#e5e7eb" }}>Wstecz</Text>
        </Pressable>
        <Text
          style={{
            color: "white",
            fontSize: 20,
            fontWeight: "700",
          }}
        >
          Szczegóły generacji
        </Text>
      </View>

      {/* Podgląd obrazka */}
      <View
        style={{
          borderRadius: 24,
          backgroundColor: "#0f172a",
          borderWidth: 1,
          borderColor: "#1f2937",
          padding: 12,
          marginBottom: 16,
        }}
      >
        <View
          style={{
            borderRadius: 20,
            backgroundColor: "#111827",
            aspectRatio: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#6b7280", fontSize: 14 }}>
            Podgląd wygenerowanego obrazka
          </Text>
          <Text style={{ color: "#4b5563", fontSize: 12, marginTop: 4 }}>
            (docelowo wczytywany z outputImagePath)
          </Text>
        </View>
      </View>

      {/* Meta informacje */}
      <View style={{ gap: 4, marginBottom: 24 }}>
        <Text style={{ color: "#e5e7eb", fontSize: 14 }}>
          ID generacji:{" "}
          <Text style={{ color: "#9ca3af" }}>{id ?? "brak"}</Text>
        </Text>
        <Text style={{ color: "#e5e7eb", fontSize: 14 }}>
          Styl: <Text style={{ color: "#a5b4fc" }}>{mockStyle}</Text>
        </Text>
        <Text style={{ color: "#e5e7eb", fontSize: 14 }}>
          Data: <Text style={{ color: "#9ca3af" }}>{mockCreatedAt}</Text>
        </Text>
      </View>

      {/* Akcje */}
      <View style={{ gap: 12, marginBottom: 16 }}>
        <Pressable
          style={{
            paddingVertical: 14,
            borderRadius: 999,
            backgroundColor: "#22c55e",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "#022c22",
              fontWeight: "700",
              fontSize: 15,
            }}
          >
            Pobierz / Zapisz
          </Text>
        </Pressable>

        <Pressable
          style={{
            paddingVertical: 14,
            borderRadius: 999,
            backgroundColor: "#0f172a",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#1f2937",
          }}
        >
          <Text
            style={{
              color: "#e5e7eb",
              fontWeight: "600",
              fontSize: 15,
            }}
          >
            Udostępnij
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setIsFavorite((prev) => !prev)}
          style={{
            paddingVertical: 12,
            borderRadius: 999,
            backgroundColor: isFavorite ? "#fbbf24" : "#0f172a",
            alignItems: "center",
            borderWidth: 1,
            borderColor: isFavorite ? "#facc15" : "#1f2937",
          }}
        >
          <Text
            style={{
              color: isFavorite ? "#422006" : "#e5e7eb",
              fontWeight: "600",
              fontSize: 14,
            }}
          >
            {isFavorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
          </Text>
        </Pressable>
      </View>

      <Text style={{ color: "#6b7280", fontSize: 12 }}>
        W przyszłości ten ekran pobierze dane z{" "}
        <Text style={{ fontWeight: "600" }}>generations/{id}</Text> i
        wyświetli prawdziwy obrazek na podstawie outputImagePath.
      </Text>
    </ScrollView>
  );
}


