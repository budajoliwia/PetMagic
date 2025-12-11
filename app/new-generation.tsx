import { useRouter } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { auth, db } from "../src/firebase";
import { JobDoc } from "../src/models";

const STYLES = ["Sticker", "Cartoon", "Oil Painting", "Line Art"] as const;

export default function NewGenerationScreen() {
  const router = useRouter();
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGenerate = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Error", "Please login to generate a new generation.");
      return;
    }
    if(!selectedStyle){
      Alert.alert("Choose a style to generate a new generation.");
      return;
    }

    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);

      const jobPayload: Omit<JobDoc, "resultGenerationId"> = {
        userId: currentUser.uid,
        type: "GENERATE_STICKER",
        inputImagePath: `input/${currentUser.uid}/fake-placeholder.jpg`, // na razie fake
        style: selectedStyle,
        status: "processing",
        // na kliencie używamy serverTimestamp – typowo rzutujemy do any
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };

      const jobRef = await addDoc(collection(db, "jobs"), jobPayload);

      router.push({ pathname: "/job-status", params: { jobId: jobRef.id } });
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
          Wybierz zdjęcie swojego pupila i styl grafiki.
        </Text>
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
          }}
        >
          <Text style={{ color: "#6b7280" }}>
            Podgląd zdjęcia (placeholder)
          </Text>
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
          {STYLES.map((style) => {
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
            opacity: selectedStyle && !isSubmitting ? 1 : 0.8,
          }}
          disabled={!selectedStyle || isSubmitting}
        >
          <Text
            style={{
              color: "#022c22",
              fontWeight: "700",
              fontSize: 16,
            }}
          >
            Generuj
          </Text>
        </Pressable>
        <Text style={{ color: "#6b7280", fontSize: 12 }}>
          Na razie przycisk tylko przechodzi do ekranu statusu. Upload i
          wywołanie Cloud Function dodamy później.
        </Text>
      </View>
    </ScrollView>
  );
}


