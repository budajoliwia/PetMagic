import { Ionicons } from "@expo/vector-icons";
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
  Text,
  View,
} from "react-native";
import { db } from "../../src/firebase";
import { useStorageDownloadUrl } from "../../src/hooks/useStorageDownloadUrl";
import { GenerationDoc } from "../../src/models";
import { useAppTheme } from "../../src/theme";
import { Button } from "../../src/ui/Button";
import { Screen } from "../../src/ui/Screen";

export default function GenerationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors } = useAppTheme();

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
      <Screen scroll={false} padding={16}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.muted, fontSize: 14 }}>
            Ładowanie generacji...
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padding={16} contentContainerStyle={{ gap: 14 }}>
      {/* Nagłówek */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Button
          title="Wstecz"
          variant="ghost"
          size="md"
          onPress={() => router.back()}
          left={<Ionicons name="arrow-back-outline" size={18} color={colors.text} />}
          style={{ marginRight: 12 }}
        />
        <Text
          style={{
            color: colors.text,
            fontSize: 20,
            fontWeight: "800",
          }}
        >
          Szczegóły generacji
        </Text>
      </View>

      {/* Podgląd obrazka */}
      <View
        style={{
          borderRadius: 24,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 12,
          marginBottom: 16,
        }}
      >
        <View
          style={{
            borderRadius: 20,
            backgroundColor: colors.border,
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
              <Text style={{ color: colors.subtle, fontSize: 14 }}>
                {isOutputLoading ? "Ładowanie podglądu..." : "Brak podglądu"}
              </Text>
              {!!outputError && (
                <Text style={{ color: colors.danger, fontSize: 12 }}>
                  {outputError}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Meta informacje */}
      <View style={{ gap: 4, marginBottom: 24 }}>
        <Text style={{ color: colors.text, fontSize: 14 }}>
          Styl:{" "}
          <Text style={{ color: colors.muted }}>
            {generation?.style ?? "nieznany"}
          </Text>
        </Text>
        <Text style={{ color: colors.text, fontSize: 14 }}>
          Data:{" "}
          <Text style={{ color: colors.muted }}>{formatCreatedAt()}</Text>
        </Text>
      </View>

      {/* Akcje */}
      <View style={{ gap: 12, marginBottom: 16 }}>
        <Button
          title="Pobierz / Zapisz"
          onPress={handleSaveToGallery}
          left={<Ionicons name="download-outline" size={18} color={colors.onPrimary} />}
        />

        <Button
          title="Udostępnij"
          variant="secondary"
          onPress={handleShare}
          left={<Ionicons name="share-outline" size={18} color={colors.text} />}
        />

        <Button
          title={isFavorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
          variant={isFavorite ? "primary" : "secondary"}
          onPress={toggleFavorite}
          left={
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={18}
              color={isFavorite ? colors.onPrimary : colors.text}
            />
          }
        />
      </View>

      {error && (
        <Text style={{ color: colors.danger, fontSize: 12, marginTop: 8 }}>
          {error}
        </Text>
      )}
    </Screen>
  );
}

