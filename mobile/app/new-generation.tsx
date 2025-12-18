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
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { auth, db } from "../src/firebase";
import { useUserLimit } from "../src/hooks/useUserLimit";
import { JobDoc, JobType } from "../src/models";
import { uploadInputImage } from "../src/storage/uploadInputImage";

const TYPE_OPTIONS: { label: string; value: JobType }[] = [
  { label: "Sticker", value: "sticker" },
  { label: "Image", value: "image" },
];

const STYLES_BY_TYPE: Record<JobType, string[]> = {
  sticker: ["Cartoon", "Kawaii", "Line Art", "Vector Art", "Pixel Art"],
  image: ["Cartoon", "Oil Painting", "Line Art", "Vector Art", "Pixel Art"],
};

export default function NewGenerationScreen() {
  const router = useRouter();
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
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        padding: 24,
        gap: 24,
        backgroundColor: "#020617",
      }}
    >
      <View>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: "white",
          }}
        >
          Nowa generacja
        </Text>
        <Text style={{ color: "#9ca3af", marginTop: 4 }}>
          Wybierz zdjęcie swojego pupila, rodzaj grafiki i styl.
        </Text>
      </View>

      {/* Rodzaj grafiki */}
      <View style={{ gap: 12 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: "white",
          }}
        >
          0. Rodzaj
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {TYPE_OPTIONS.map((opt) => {
            const isActive = jobType === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setJobType(opt.value)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: isActive ? "#22c55e" : "#374151",
                  backgroundColor: isActive ? "#064e3b" : "#020617",
                }}
              >
                <Text
                  style={{
                    color: isActive ? "#bbf7d0" : "#e5e7eb",
                    fontSize: 14,
                  }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Wybór zdjęcia */}
      <View style={{ gap: 12 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: "white",
          }}
        >
          1. Zdjęcie
        </Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable
            onPress={takePhoto}
            style={{
              flex: 1,
              padding: 12,
              backgroundColor: "#0f172a",
              borderRadius: 12,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#1f2937",
            }}
          >
            <Text style={{ color: "#e5e7eb" }}>Zrób zdjęcie</Text>
          </Pressable>
          <Pressable
            onPress={pickFromGallery}
            style={{
              flex: 1,
              padding: 12,
              backgroundColor: "#0f172a",
              borderRadius: 12,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#1f2937",
            }}
          >
            <Text style={{ color: "#e5e7eb" }}>Wybierz z galerii</Text>
          </Pressable>
        </View>
        <View
          style={{
            height: 180,
            borderRadius: 16,
            backgroundColor: "#0f172a",
            borderWidth: 1,
            borderColor: "#1f2937",
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
            <Text style={{ color: "#6b7280" }}>
              Podgląd zdjęcia (placeholder)
            </Text>
          )}
        </View>
      </View>

      {/* Wybór stylu */}
      <View style={{ gap: 12 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: "white",
          }}
        >
          2. Styl
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
              <Pressable
                key={style}
                onPress={() => setSelectedStyle(style)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: isActive ? "#22c55e" : "#374151",
                  backgroundColor: isActive ? "#064e3b" : "#020617",
                }}
              >
                <Text
                  style={{
                    color: isActive ? "#bbf7d0" : "#e5e7eb",
                    fontSize: 14,
                  }}
                >
                  {style}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Podsumowanie + Generuj */}
      <View style={{ marginTop: "auto", gap: 12 }}>
        {!isLoadingLimit && dailyLimit > 0 && (
          <Text style={{ color: isLimitReached ? "#fca5a5" : "#9ca3af" }}>
            Limit dzienny: {usedToday} / {dailyLimit}
          </Text>
        )}
        <Text style={{ color: "#9ca3af" }}>
          Wybrany styl: {selectedStyle ?? "brak (wybierz powyżej)"}
        </Text>
        <Pressable
          onPress={handleGenerate}
          style={{
            paddingVertical: 16,
            borderRadius: 999,
            backgroundColor: "#22c55e",
            alignItems: "center",
            opacity: isSubmitting || (!isLoadingLimit && isLimitReached) ? 0.7 : 1,
            flexDirection: "row",
            justifyContent: "center",
            gap: 10,
          }}
          disabled={isSubmitting || (!isLoadingLimit && isLimitReached)}
        >
          {isSubmitting && (
            <ActivityIndicator size="small" color="#022c22" />
          )}
          <Text
            style={{
              color: "#022c22",
              fontWeight: "700",
              fontSize: 16,
            }}
          >
            {isSubmitting
              ? "Generuję..."
              : !isLoadingLimit && isLimitReached
              ? "Limit osiągnięty"
              : "Generuj"}
          </Text>
        </Pressable>
       
      </View>
    </ScrollView>
  );
}


