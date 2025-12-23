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
  Text,
  View,
} from "react-native";
import { auth, db } from "../src/firebase";
import { useStorageDownloadUrl } from "../src/hooks/useStorageDownloadUrl";
import { useUserLimit } from "../src/hooks/useUserLimit";
import { GenerationDoc } from "../src/models";
import { STYLES_BY_TYPE } from "../src/styles";
import { useAppTheme } from "../src/theme";
import { Button } from "../src/ui/Button";
import { Chip } from "../src/ui/Chip";
import { Screen } from "../src/ui/Screen";

type HistoryItem = {
  id: string;
  data: GenerationDoc;
};

function GenerationThumbnail({ outputImagePath }: { outputImagePath?: string }) {
  const { url, isLoading, error } = useStorageDownloadUrl(outputImagePath);
  const { colors } = useAppTheme();

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
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Text style={{ color: colors.subtle, fontSize: 12 }}>
          {error ? "Błąd podglądu" : "Brak podglądu"}
        </Text>
      )}
    </View>
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"sticker" | "image" | null>(null);
  const [styleFilter, setStyleFilter] = useState<string | null>(null);
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
    if (favoritesOnly) {
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
  }, [router, favoritesOnly]);

  const availableStyleFilters = STYLES_BY_TYPE.sticker;

  const filteredItems = items.filter(({ data }) => {
    if (typeFilter && data.type && data.type !== typeFilter) return false;
    if (typeFilter && !data.type) return false;
    if (styleFilter && data.style !== styleFilter) return false;
    return true;
  });

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
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.muted, fontSize: 14 }}>
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
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            gap: 8,
          }}
        >
          <Text style={{ color: colors.danger, fontSize: 14 }}>{error}</Text>
        </View>
      );
    }

    return (
      <View
        style={{
          marginTop: 32,
          padding: 16,
          borderRadius: 12,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: "center",
          gap: 8,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 14 }}>
          Nie masz jeszcze żadnych generacji.
        </Text>
        <View style={{ width: "100%" }}>
          <Button
            title="Stwórz pierwszą grafikę"
            onPress={() => router.push("/new-generation")}
          />
        </View>
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
    <Screen padding={16} contentContainerStyle={{ gap: 14 }}>
      <View style={{ gap: 14 }}>
        <View>
          <Text
            style={{
              color: colors.text,
              fontSize: 24,
              fontWeight: "800",
            }}
          >
            Twoje generacje
          </Text>
          <Text style={{ color: colors.muted, marginTop: 4, fontSize: 14 }}>
            Przeglądaj historię wygenerowanych grafik.
          </Text>
        </View>

        {/* Pasek limitu */}
        <View
          style={{
            padding: 12,
            borderRadius: 12,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>
            {isLoadingLimit
              ? "Ładowanie limitu..."
              : `Użyto: ${usedToday} / ${dailyLimitLabel} dzisiaj`}
          </Text>
        </View>

        {/* Filtry (UI-only) */}
        <View style={{ gap: 8, marginTop: 4 }}>
          {/* Row 1: scope */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <Chip
              label="Wszystkie"
              selected={!favoritesOnly}
              onPress={() => setFavoritesOnly(false)}
            />
            <Chip
              label="Ulubione"
              selected={favoritesOnly}
              onPress={() => setFavoritesOnly(true)}
            />
          </View>

          {/* Row 2: type */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <Chip
              label="Sticker"
              selected={typeFilter === "sticker"}
              onPress={() =>
                setTypeFilter((prev) => (prev === "sticker" ? null : "sticker"))
              }
            />
            <Chip
              label="Image"
              selected={typeFilter === "image"}
              onPress={() =>
                setTypeFilter((prev) => (prev === "image" ? null : "image"))
              }
            />
          </View>

          {/* Row 3: style (optional, compact) */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {availableStyleFilters.map((s) => (
              <Chip
                key={s}
                label={s}
                selected={styleFilter === s}
                onPress={() => setStyleFilter((prev) => (prev === s ? null : s))}
              />
            ))}
          </View>
        </View>

        {/* Grid miniaturek */}
        {items.length === 0 ? (
          renderEmptyState()
        ) : filteredItems.length === 0 ? (
          <View
            style={{
              marginTop: 24,
              padding: 16,
              borderRadius: 12,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              gap: 10,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>
              Brak wyników dla wybranych filtrów
            </Text>
            <Text style={{ color: colors.muted, fontSize: 13 }}>
              Zmień filtry lub wyczyść je, aby zobaczyć więcej generacji.
            </Text>
            <Button
              title="Wyczyść filtry"
              variant="secondary"
              onPress={() => {
                setFavoritesOnly(false);
                setTypeFilter(null);
                setStyleFilter(null);
              }}
            />
          </View>
        ) : (
          <FlatList
            data={filteredItems}
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
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 10,
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{
                    flex: 1,
                    borderRadius: 12,
                    backgroundColor: colors.border,
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
                      color: colors.text,
                      fontSize: 12,
                      fontWeight: "700",
                    }}
                    numberOfLines={1}
                  >
                    {item.data.style}
                  </Text>
                  {item.data.type && (
                    <Text style={{ color: colors.muted, fontSize: 11 }}>
                      {item.data.type === "sticker" ? "Sticker" : "Image"}
                    </Text>
                  )}
                  <Text style={{ color: colors.subtle, fontSize: 11 }}>
                    {formatCreatedAt(item.data)}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        )}
      </View>
    </Screen>
  );
}

