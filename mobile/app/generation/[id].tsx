import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
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

  const getLocalOutputFile = async (): Promise<string> => {
    if (!outputUrl) {
      throw new Error("Brak URL do wygenerowanego obrazka.");
    }
    const fileName = `generation-${typeof id === "string" ? id : "unknown"}.png`;
    const localUri = `${FileSystem.cacheDirectory}${fileName}`;

    const info = await FileSystem.getInfoAsync(localUri);
    if (info.exists) return localUri;

    const res = await FileSystem.downloadAsync(outputUrl, localUri);
    return res.uri;
  };

  const handleSaveToGallery = async () => {
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Brak uprawnień", "Aby zapisać obraz, zezwól na dostęp do galerii.");
        return;
      }

      const localUri = await getLocalOutputFile();
      await MediaLibrary.saveToLibraryAsync(localUri);
      Alert.alert("Gotowe", "Zapisano do galerii.");
    } catch (err) {
      console.error("Failed to save image to gallery", err);
      Alert.alert("Błąd", "Nie udało się zapisać obrazka do galerii.");
    }
  };

  const handleShare = async () => {
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert("Info", "Udostępnianie nie jest obsługiwane na tym urządzeniu.");
        return;
      }
      const localUri = await getLocalOutputFile();
      await Sharing.shareAsync(localUri, {
        mimeType: "image/png",
        dialogTitle: "Udostępnij wygenerowaną grafikę",
      });
      // Expo Sharing API does not reliably indicate whether the user completed or cancelled sharing.
      // We show a neutral confirmation that the sheet was displayed and closed.
      Alert.alert("Info", "Zamknięto okno udostępniania.");
    } catch (err) {
      console.error("Failed to share image", err);
      Alert.alert("Błąd", "Nie udało się udostępnić obrazka.");
    }
  };

  const toggleFavorite = async () => {
    if (!id || typeof id !== "string") return;

    const next = !isFavorite;
    setIsFavorite(next);

    try {
      await updateDoc(doc(db, "generations", id), { isFavorite: next });
    } catch (err) {
      console.error("Failed to update favorite state", err);
      setIsFavorite(!next);
      Alert.alert("Błąd", "Nie udało się zaktualizować ulubionych. Spróbuj ponownie.");
    }
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
          onPress={handleSaveToGallery}
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
          onPress={handleShare}
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
          onPress={toggleFavorite}
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

