import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Text,
  View
} from "react-native";
import { db } from "../src/firebase";
import { JobDoc } from "../src/models";
import { useAppTheme } from "../src/theme";
import { Button } from "../src/ui/Button";
import { Screen } from "../src/ui/Screen";

export default function JobStatusScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId?: string }>();
  const { colors } = useAppTheme();

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

  const isLimitReachedError =
    job?.status === "error" && job?.errorCode === "LIMIT_REACHED";

  const errorDetails =
    job?.status === "error"
      ? {
          code: job?.errorCode ?? "UNKNOWN",
          message:
            job?.errorMessage ??
            "Wystąpił błąd podczas generowania. Spróbuj ponownie za chwilę.",
        }
      : null;

  const statusLabel = useMemo(() => {
    const status = job?.status;
    switch (status) {
      case "queued":
        return "W kolejce…";
      case "processing":
        return "Generuję…";
      case "done":
        return "Gotowe";
      case "error":
        return "Nie wyszło — spróbuj ponownie";
      default:
        return status ?? "Unknown";
    }
  }, [job?.status]);

  const showDetailsCard = !!error || isLimitReachedError || (!!errorDetails && !isLimitReachedError);

  return (
    <Screen contentContainerStyle={{ justifyContent: "center" }}>
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
              color: colors.text,
              fontSize: 24,
              fontWeight: "800",
              textAlign: "center",
            }}
          >
            Twoja grafika powstaje…
          </Text>
          <Text
            style={{
              color: colors.muted,
              fontSize: 14,
              textAlign: "center",
            }}
          >
            To może potrwać kilkanaście sekund. Nie zamykaj aplikacji.
          </Text>
        </View>

        <View style={{ alignItems: "center", gap: 16 }}>
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <ActivityIndicator size="small" color={colors.primary} />
          )}
          <Text style={{ color: colors.muted, fontSize: 14 }}>
            {job?.status ? statusLabel : "W kolejce…"}
          </Text>
        </View>

        {showDetailsCard && (
          <View
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 12,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              width: "100%",
              gap: 8,
            }}
          >
            {error ? (
              <Text style={{ color: colors.danger, fontSize: 14 }}>{error}</Text>
            ) : isLimitReachedError ? (
              <Text style={{ color: colors.danger, fontSize: 14 }}>
                Przekroczono dzienny limit generacji. Spróbuj jutro.
              </Text>
            ) : errorDetails ? (
              <>
                <Text style={{ color: colors.danger, fontSize: 14 }}>
                  {errorDetails.message}
                </Text>
                <Text style={{ color: colors.subtle, fontSize: 12 }}>
                  Kod: {errorDetails.code}
                </Text>
              </>
            ) : null}
          </View>
        )}

        <View style={{ width: "100%", marginTop: "auto", gap: 12 }}>
          <Button
            title="Wróć do ekranu głównego"
            variant="secondary"
            onPress={() => router.replace("/home")}
          />
        </View>
      </View>
    </Screen>
  );
}

