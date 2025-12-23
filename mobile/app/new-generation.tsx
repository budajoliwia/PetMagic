import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Text,
  View,
} from "react-native";
import { auth, db } from "../src/firebase";
import { useUserLimit } from "../src/hooks/useUserLimit";
import { JobDoc, JobType } from "../src/models";
import { uploadInputImage } from "../src/storage/uploadInputImage";
import { STYLES_BY_TYPE } from "../src/styles";
import { useAppTheme } from "../src/theme";
import { Button } from "../src/ui/Button";
import { Chip } from "../src/ui/Chip";
import { Screen } from "../src/ui/Screen";

const TYPE_OPTIONS: { label: string; value: JobType }[] = [
  { label: "Sticker", value: "sticker" },
  { label: "Image", value: "image" },
];

export default function NewGenerationScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [jobType, setJobType] = useState<JobType>("sticker");
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUserId = auth.currentUser?.uid ?? null;
  const { dailyLimit, usedToday, isLoading: isLoadingLimit } =
    useUserLimit(currentUserId);
  const isLimitReached = dailyLimit > 0 && usedToday >= dailyLimit;

  const availableStyles = STYLES_BY_TYPE[jobType];

  // Ensure selected style belongs to current type
  useEffect(() => {
    if (selectedStyle && !availableStyles.includes(selectedStyle)) {
      setSelectedStyle(availableStyles[0] ?? null);
    }
    if (!selectedStyle && availableStyles.length > 0) {
      setSelectedStyle(availableStyles[0]);
    }
  }, [jobType, availableStyles, selectedStyle]);

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Error", "Enable access to the gallery to continue.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      // On iOS we can get `ph://` URIs; convert to a real file:// by exporting base64.
      if (asset.base64) {
        const tempUri = `${FileSystem.cacheDirectory}picked-${Date.now()}.jpg`;
        await FileSystem.writeAsStringAsync(tempUri, asset.base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        setSelectedImageUri(tempUri);
      } else {
        setSelectedImageUri(asset.uri);
      }
    }
  };

  const takePhoto = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Info", "Aparat nie jest obsługiwany w trybie web. Użyj galerii.");
      return;
    }
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Error", "Enable access to the camera to continue.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      if (asset.base64) {
        const tempUri = `${FileSystem.cacheDirectory}captured-${Date.now()}.jpg`;
        await FileSystem.writeAsStringAsync(tempUri, asset.base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        setSelectedImageUri(tempUri);
      } else {
        setSelectedImageUri(asset.uri);
      }
    }
  };

  const handleGenerate = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Error", "Please login to generate a new generation.");
      return;
    }
    if (!isLoadingLimit && isLimitReached) {
      Alert.alert(
        "Limit przekroczony",
        `Wykorzystałeś dzienny limit generacji (${usedToday} / ${dailyLimit}). Spróbuj jutro.`
      );
      return;
    }
    if(!selectedStyle){
      Alert.alert("Choose a style to generate a new generation.");
      return;
    }
    if (!selectedImageUri) {
      Alert.alert("Error", "Select an image from the gallery or take a new photo.");
      return;
    }

    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);

      const jobRef = doc(collection(db, "jobs"));
      const jobId = jobRef.id;
      let inputImagePath: string;

      try {
        inputImagePath = await uploadInputImage(
          selectedImageUri,
          currentUser.uid,
          jobId
        );
      } catch (uploadError) {
        console.error("Failed to upload input image", uploadError);
        Alert.alert(
          "Error",
          "Failed to upload the selected photo. Please try again."
        );
        return;
      }

      const jobPayload: Omit<JobDoc, "resultGenerationId"> = {
        userId: currentUser.uid,
        type: jobType,
        inputImagePath,
        style: selectedStyle,
        status: "queued",
        // na kliencie używamy serverTimestamp – typowo rzutujemy do any
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };
      await setDoc(jobRef, jobPayload);

      router.push({
        pathname: "/job-status",
        params: { jobId },
      });
    } catch (error) {
      console.error("Failed to create job", error);
      Alert.alert(
        "Error",
        "Failed to create job. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen contentContainerStyle={{ gap: 18 }}>
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text }}>
          Nowa generacja
        </Text>
        <Text style={{ color: colors.muted, marginTop: 2, fontSize: 14 }}>
          Wybierz zdjęcie, rodzaj grafiki i styl.
        </Text>
      </View>

      {/* Rodzaj grafiki */}
      <View style={{ gap: 12 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            color: colors.muted,
          }}
        >
          Rodzaj
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {TYPE_OPTIONS.map((opt) => {
            const isActive = jobType === opt.value;
            return (
              <Chip
                key={opt.value}
                label={opt.label}
                selected={isActive}
                onPress={() => setJobType(opt.value)}
              />
            );
          })}
        </View>
      </View>

      {/* Wybór zdjęcia */}
      <View style={{ gap: 12 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            color: colors.muted,
          }}
        >
          Zdjęcie
        </Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Button
              title="Zrób zdjęcie"
              variant="secondary"
              size="md"
              onPress={takePhoto}
              left={
                <Ionicons name="camera-outline" size={18} color={colors.text} />
              }
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title="Z galerii"
              variant="secondary"
              size="md"
              onPress={pickFromGallery}
              left={
                <Ionicons name="images-outline" size={18} color={colors.text} />
              }
            />
          </View>
        </View>
        <View
          style={{
            height: 180,
            borderRadius: 16,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {selectedImageUri ? (
            <Image
              source={{ uri: selectedImageUri }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          ) : (
            <Text style={{ color: colors.subtle }}>Podgląd zdjęcia</Text>
          )}
        </View>
      </View>

      {/* Wybór stylu */}
      <View style={{ gap: 12 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            color: colors.muted,
          }}
        >
          Styl
        </Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {availableStyles.map((style) => {
            const isActive = selectedStyle === style;
            return (
              <Chip
                key={style}
                label={style}
                selected={isActive}
                onPress={() => setSelectedStyle(style)}
              />
            );
          })}
        </View>
      </View>

      {/* Podsumowanie + Generuj */}
      <View style={{ marginTop: 8, gap: 10 }}>
        {!isLoadingLimit && dailyLimit > 0 && (
          <Text style={{ color: isLimitReached ? colors.danger : colors.subtle }}>
            Limit dzienny: {usedToday} / {dailyLimit}
          </Text>
        )}
        <Text style={{ color: colors.subtle }}>
          Wybrany styl: {selectedStyle ?? "brak (wybierz powyżej)"}
        </Text>
        <Button
          onPress={handleGenerate}
          disabled={isSubmitting || (!isLoadingLimit && isLimitReached)}
          title={
            isSubmitting
              ? "Generuję..."
              : !isLoadingLimit && isLimitReached
              ? "Limit osiągnięty"
              : "Generuj"
          }
          left={
            isSubmitting ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <Ionicons name="sparkles-outline" size={18} color={colors.onPrimary} />
            )
          }
        />
      </View>
    </Screen>
  );
}


