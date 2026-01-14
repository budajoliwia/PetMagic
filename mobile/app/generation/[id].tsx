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
  Platform,
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

    if (Platform.OS === "web") {
      return outputUrl;
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
      if (Platform.OS === "web") {
        if (!outputUrl) {
          Alert.alert("Błąd", "Brak URL do wygenerowanego obrazka.");
          return;
        }

        const fileName = `generation-${typeof id === "string" ? id : "unknown"}.png`;

        try {
          const res = await fetch(outputUrl);
          if (!res.ok) {
            throw new Error(`Download failed: HTTP ${res.status}`);
          }
          const blob = await res.blob();
          const href = URL.createObjectURL(blob);

          const a = document.createElement("a");
          a.href = href;
          a.download = fileName;
          a.rel = "noopener";
          document.body.appendChild(a);
          a.click();
          a.remove();

          setTimeout(() => URL.revokeObjectURL(href), 1000);

          Alert.alert("Gotowe", "Pobieranie rozpoczęte.");
        } catch (downloadErr) {
          console.warn("Web download failed; opening URL instead", downloadErr);
          window.open(outputUrl, "_blank", "noopener,noreferrer");
          Alert.alert("Info", "Otworzyłem obraz w nowej karcie. Tam możesz go zapisać.");
        }
        return;
      }

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
      if (Platform.OS === "web") {
        if (!outputUrl) {
          Alert.alert("Błąd", "Brak URL do wygenerowanego obrazka.");
          return;
        }

        const nav = navigator as any;
        const canShare = typeof nav?.share === "function";

        // Prefer sharing as a File if supported; otherwise share the URL.
        if (canShare) {
          try {
            const fileName = `generation-${typeof id === "string" ? id : "unknown"}.png`;

            try {
              const res = await fetch(outputUrl);
              const blob = await res.blob();
              const file = new File([blob], fileName, {
                type: blob.type || "image/png",
              });

              if (typeof nav?.canShare === "function" && nav.canShare({ files: [file] })) {
                await nav.share({
                  files: [file],
                  title: "Udostępnij wygenerowaną grafikę",
                  text: "Wygenerowana grafika",
                });
              } else {
                await nav.share({
                  title: "Udostępnij wygenerowaną grafikę",
                  text: "Link do grafiki",
                  url: outputUrl,
                });
              }
            } catch (fileShareErr) {
              console.warn("Web file share failed; sharing URL instead", fileShareErr);
              await nav.share({
                title: "Udostępnij wygenerowaną grafikę",
                text: "Link do grafiki",
                url: outputUrl,
              });
            }

            Alert.alert("Info", "Zamknięto okno udostępniania.");
            return;
          } catch (shareErr) {
            console.warn("Web share failed, falling back to clipboard", shareErr);
          }
        }

        // Fallback: copy URL to clipboard
        try {
          await navigator.clipboard?.writeText(outputUrl);
          Alert.alert("Gotowe", "Skopiowano link do schowka.");
        } catch {
          Alert.alert(
            "Info",
            `Udostępnianie na web nie jest dostępne. Skopiuj link ręcznie:\n\n${outputUrl}`
          );
        }
        return;
      }

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

