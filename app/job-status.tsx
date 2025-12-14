import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View
} from "react-native";
import { db } from "../src/firebase";
import { JobDoc } from "../src/models";

export default function JobStatusScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId?: string }>();

  const [job, setJob] = useState<JobDoc | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId || typeof jobId !== "string") {
      setError("Brak identyfikatora zadania.");
      setIsLoading(false);
      return;
    }

    const jobRef = doc(db, "jobs", jobId);

    const unsubscribe = onSnapshot(
      jobRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setError("Job does not exist.");
          setIsLoading(false);
          return;
        }

        const data = snapshot.data() as JobDoc;
        setJob(data);
        setIsLoading(false);

        // Jeśli zadanie jest zakończone i ma resultGenerationId → przejdź do szczegółów generacji
        if (data.status === "done" && data.resultGenerationId) {
          router.replace({
            pathname: "/generation/[id]",
            params: { id: data.resultGenerationId },
          });
        }
      },
      (err) => {
        console.error("Failed to subscribe to job", err);
        setError("Failed to get job status.");
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [jobId, router]);

  const statusLabel = useMemo(() => {
    const status = job?.status;
    switch (status) {
      case "queued":
        return "Queued";
      case "processing":
        return "Processing";
      case "done":
        return "Done";
      case "error":
        return "Error";
      default:
        return status ?? "Unknown";
    }
  }, [job?.status]);

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        padding: 24,
        backgroundColor: "#020617",
      }}
    >
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
        }}
      >
        <View style={{ alignItems: "center", gap: 12 }}>
          <Text
            style={{
              color: "white",
              fontSize: 24,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            Twoja grafika powstaje…
          </Text>
          <Text
            style={{
              color: "#9ca3af",
              fontSize: 14,
              textAlign: "center",
            }}
          >
            To może potrwać kilkanaście sekund. Nie zamykaj aplikacji.
          </Text>
        </View>

        <View style={{ alignItems: "center", gap: 16 }}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#22c55e" />
          ) : (
            <ActivityIndicator size="small" color="#22c55e" />
          )}
          <Text style={{ color: "#a5b4fc", fontSize: 14 }}>
            Creating generation...
          </Text>
        </View>

        <View
          style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 12,
            backgroundColor: "#0f172a",
            width: "100%",
            gap: 8,
          }}
        >
          <Text
            style={{
              color: "#e5e7eb",
              fontSize: 14,
              fontWeight: "600",
            }}
          >
            Status joba:
          </Text>
          {error ? (
            <Text style={{ color: "#f97373", fontSize: 14 }}>{error}</Text>
          ) : (
            <>
              <Text style={{ color: "#9ca3af", fontSize: 14 }}>
                status:{" "}
                <Text style={{ color: "#22c55e" }}>{job?.status}</Text> (
                {statusLabel})
              </Text>
              <Text style={{ color: "#6b7280", fontSize: 12 }}>
                Ten ekran nasłuchuje dokumentu{" "}
                <Text style={{ fontWeight: "600" }}>jobs/{jobId}</Text> i po
                zakończeniu zadania przechodzi do szczegółów generacji.
              </Text>
            </>
          )}
        </View>

        <View style={{ width: "100%", marginTop: "auto", gap: 12 }}>
          <Pressable
            onPress={() => router.replace("/home")}
            style={{
              paddingVertical: 14,
              borderRadius: 999,
              backgroundColor: "#0f172a",
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#1f2937",
            }}
          >
            <Text style={{ color: "#e5e7eb", fontWeight: "500" }}>
              Wróć do ekranu głównego
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

