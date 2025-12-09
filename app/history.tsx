import { useRouter } from "expo-router";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";

type HistoryItem = {
  id: string;
  style: string;
  createdAtLabel: string;
};

// Mockowane dane – docelowo query do kolekcji generations
const MOCK_HISTORY: HistoryItem[] = [
  {
    id: "gen_1",
    style: "Sticker",
    createdAtLabel: "Dziś, 12:34",
  },
  {
    id: "gen_2",
    style: "Cartoon",
    createdAtLabel: "Wczoraj, 19:10",
  },
  {
    id: "gen_3",
    style: "Oil Painting",
    createdAtLabel: "2 dni temu",
  },
  {
    id: "gen_4",
    style: "Line Art",
    createdAtLabel: "3 dni temu",
  },
];

export default function HistoryScreen() {
  const router = useRouter();

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        padding: 16,
        backgroundColor: "#020617",
      }}
    >
      <View style={{ gap: 16 }}>
        <View>
          <Text
            style={{
              color: "white",
              fontSize: 24,
              fontWeight: "700",
            }}
          >
            Twoje generacje
          </Text>
          <Text style={{ color: "#9ca3af", marginTop: 4, fontSize: 14 }}>
            Przeglądaj historię wygenerowanych grafik.
          </Text>
        </View>

        {/* Filtry (UI-only) */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 4,
          }}
        >
          {["Wszystkie", "Ulubione", "Sticker", "Cartoon"].map((label) => (
            <View
              key={label}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "#1f2937",
                backgroundColor:
                  label === "Wszystkie" ? "#0f172a" : "transparent",
              }}
            >
              <Text style={{ color: "#e5e7eb", fontSize: 12 }}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Grid miniaturek */}
        {MOCK_HISTORY.length === 0 ? (
          <View
            style={{
              marginTop: 32,
              padding: 16,
              borderRadius: 12,
              backgroundColor: "#0f172a",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Text style={{ color: "#e5e7eb", fontSize: 14 }}>
              Nie masz jeszcze żadnych generacji.
            </Text>
            <Pressable
              onPress={() => router.push("/new-generation")}
              style={{
                marginTop: 4,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: "#22c55e",
              }}
            >
              <Text
                style={{
                  color: "#022c22",
                  fontWeight: "600",
                  fontSize: 14,
                }}
              >
                Stwórz pierwszą grafikę
              </Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={MOCK_HISTORY}
            numColumns={2}
            keyExtractor={(item) => item.id}
            columnWrapperStyle={{ gap: 12 }}
            contentContainerStyle={{ gap: 12, paddingTop: 8 }}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push(`/generation/${item.id}`)}
                style={{
                  flex: 1,
                  aspectRatio: 1,
                  borderRadius: 16,
                  backgroundColor: "#0f172a",
                  borderWidth: 1,
                  borderColor: "#1f2937",
                  padding: 10,
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{
                    flex: 1,
                    borderRadius: 12,
                    backgroundColor: "#111827",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#6b7280", fontSize: 12 }}>
                    Miniatura
                  </Text>
                </View>
                <View style={{ marginTop: 6 }}>
                  <Text
                    style={{
                      color: "#e5e7eb",
                      fontSize: 12,
                      fontWeight: "600",
                    }}
                  >
                    {item.style}
                  </Text>
                  <Text style={{ color: "#6b7280", fontSize: 11 }}>
                    {item.createdAtLabel}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        )}
      </View>
    </ScrollView>
  );
}


