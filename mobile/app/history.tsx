import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { auth, db } from "../src/firebase";
import { useStorageDownloadUrl } from "../src/hooks/useStorageDownloadUrl";
import { useUserLimit } from "../src/hooks/useUserLimit";
import { GenerationDoc } from "../src/models";

type HistoryItem = {
  id: string;
  data: GenerationDoc;
};

function GenerationThumbnail({ outputImagePath }: { outputImagePath?: string }) {
  const { url, isLoading, error } = useStorageDownloadUrl(outputImagePath);

  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
      />
    );
  }

  return (
    <View style={{ alignItems: "center", justifyContent: "center", gap: 6 }}>
      {isLoading ? (
        <ActivityIndicator size="small" color="#22c55e" />
      ) : (
        <Text style={{ color: "#6b7280", fontSize: 12 }}>
          {error ? "Błąd podglądu" : "Brak podglądu"}
        </Text>
      )}
    </View>
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<
    "Wszystkie" | "Ulubione" | "Sticker" | "Cartoon"
  >("Wszystkie");
  const currentUserId = auth.currentUser?.uid ?? null;
  const { dailyLimit, usedToday, isLoading: isLoadingLimit } =
    useUserLimit(currentUserId);
  const dailyLimitLabel = dailyLimit > 0 ? String(dailyLimit) : "∞";

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      router.replace("/");
      return;
    }

    const constraints = [
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
    ];
    if (activeFilter === "Ulubione") {
      constraints.splice(1, 0, where("isFavorite", "==", true));
    }

    const q = query(collection(db, "generations"), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const next: HistoryItem[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          data: docSnap.data() as GenerationDoc,
        }));
        setItems(next);
        setIsLoading(false);
      },
      (err) => {
        console.error("Failed to load generations history", err);
        setError("Failed to load generations history.");
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [router, activeFilter]);

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View
          style={{
            marginTop: 32,
            alignItems: "center",
            gap: 12,
          }}
        >
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={{ color: "#9ca3af", fontSize: 14 }}>
            Ładowanie historii generacji...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
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
          <Text style={{ color: "#fecaca", fontSize: 14 }}>{error}</Text>
        </View>
      );
    }

    return (
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
    );
  };

  const formatCreatedAt = (doc: GenerationDoc) => {
    const ts = doc.createdAt;
    if (!ts) return "";

    try {
      const date = ts.toDate();
      return date.toLocaleString();
    } catch {
      return "";
    }
  };

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

        {/* Pasek limitu */}
        <View
          style={{
            padding: 12,
            borderRadius: 12,
            backgroundColor: "#0f172a",
            borderWidth: 1,
            borderColor: "#1f2937",
          }}
        >
          <Text style={{ color: "#e5e7eb", fontSize: 13, fontWeight: "600" }}>
            {isLoadingLimit
              ? "Ładowanie limitu..."
              : `Użyto: ${usedToday} / ${dailyLimitLabel} dzisiaj`}
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
            <Pressable
              key={label}
              onPress={() => setActiveFilter(label as any)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "#1f2937",
                backgroundColor:
                  label === activeFilter ? "#0f172a" : "transparent",
              }}
            >
              <Text style={{ color: "#e5e7eb", fontSize: 12 }}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Grid miniaturek */}
        {items.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={items}
            numColumns={2}
            keyExtractor={(item) => item.id}
            columnWrapperStyle={{ gap: 12 }}
            contentContainerStyle={{ gap: 12, paddingTop: 8 }}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/generation/[id]",
                    params: { id: item.id },
                  })
                }
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
                    overflow: "hidden",
                  }}
                >
                  <GenerationThumbnail
                    outputImagePath={item.data.outputImagePath}
                  />
                </View>
                <View style={{ marginTop: 6 }}>
                  <Text
                    style={{
                      color: "#e5e7eb",
                      fontSize: 12,
                      fontWeight: "600",
                    }}
                  >
                    {item.data.style}
                  </Text>
                  <Text style={{ color: "#6b7280", fontSize: 11 }}>
                    {formatCreatedAt(item.data)}
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

