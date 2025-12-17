import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { Image } from "expo-image";
import { db } from "../../src/firebase";
import { useStorageDownloadUrl } from "../../src/hooks/useStorageDownloadUrl";
import { GenerationDoc } from "../../src/models";

export default function GenerationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [generation, setGeneration] = useState<GenerationDoc | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { url: outputUrl, isLoading: isOutputLoading, error: outputError } =
    useStorageDownloadUrl(generation?.outputImagePath);

  useEffect(() => {
    const loadGeneration = async () => {
      if (!id || typeof id !== "string") {
        setError("Brak identyfikatora generacji.");
        setIsLoading(false);
        return;
      }

      try {
        const ref = doc(db, "generations", id);
        const snapshot = await getDoc(ref);
        if (!snapshot.exists()) {
          setError("Generacja nie istnieje.");
          setIsLoading(false);
          return;
        }

        const data = snapshot.data() as GenerationDoc;
        setGeneration(data);
        setIsFavorite(!!data.isFavorite);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load generation", err);
        setError("Nie udało się pobrać danych generacji.");
        setIsLoading(false);
      }
    };

    loadGeneration();
  }, [id]);

  const formatCreatedAt = () => {
    if (!generation?.createdAt) return "";
    try {
      return generation.createdAt.toDate().toLocaleString();
    } catch {
      return "";
    }
  };

  const handleStubAction = (label: string) => {
    Alert.alert("Wkrótce", `Akcja „${label}” będzie dostępna w kolejnej wersji.`);
  };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#020617",
          gap: 12,
          padding: 16,
        }}
      >
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={{ color: "#9ca3af", fontSize: 14 }}>
          Ładowanie generacji...
        </Text>
      </View>
    );
  }

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
            overflow: "hidden",
          }}
        >
          {outputUrl ? (
            <Image
              source={{ uri: outputUrl }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          ) : (
            <View style={{ alignItems: "center", gap: 6 }}>
              <Text style={{ color: "#6b7280", fontSize: 14 }}>
                {isOutputLoading ? "Ładowanie podglądu..." : "Brak podglądu"}
              </Text>
              {!!outputError && (
                <Text style={{ color: "#fca5a5", fontSize: 12 }}>
                  {outputError}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Meta informacje */}
      <View style={{ gap: 4, marginBottom: 24 }}>
        <Text style={{ color: "#e5e7eb", fontSize: 14 }}>
          ID generacji:{" "}
          <Text style={{ color: "#9ca3af" }}>
            {typeof id === "string" ? id : "brak"}
          </Text>
        </Text>
        <Text style={{ color: "#e5e7eb", fontSize: 14 }}>
          Styl:{" "}
          <Text style={{ color: "#a5b4fc" }}>
            {generation?.style ?? "nieznany"}
          </Text>
        </Text>
        <Text style={{ color: "#e5e7eb", fontSize: 14 }}>
          Data:{" "}
          <Text style={{ color: "#9ca3af" }}>{formatCreatedAt()}</Text>
        </Text>
        {generation?.jobId && (
          <Text style={{ color: "#e5e7eb", fontSize: 14 }}>
            Job ID:{" "}
            <Text style={{ color: "#9ca3af" }}>{generation.jobId}</Text>
          </Text>
        )}
      </View>

      {/* Akcje */}
      <View style={{ gap: 12, marginBottom: 16 }}>
        <Pressable
          onPress={() => handleStubAction("Pobierz / Zapisz")}
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
          onPress={() => handleStubAction("Udostępnij")}
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

      {error && (
        <Text style={{ color: "#fecaca", fontSize: 12, marginTop: 8 }}>
          {error}
        </Text>
      )}

      <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 8 }}>
        Dane pochodzą z{" "}
        <Text style={{ fontWeight: "600" }}>generations/{id}</Text>. W
        przyszłości ten ekran wyświetli prawdziwy obrazek na podstawie
        outputImagePath.
      </Text>
    </ScrollView>
  );
}

