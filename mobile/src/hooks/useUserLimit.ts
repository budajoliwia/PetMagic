import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";
import { UserDoc } from "../models";

export type UserLimitState = {
  dailyLimit: number;
  usedToday: number;
  lastUsageDate: string | null;
  isLoading: boolean;
  error: string | null;
};

export function useUserLimit(uid?: string | null): UserLimitState {
  const normalizedUid = useMemo(
    () => (uid && uid.trim() ? uid.trim() : null),
    [uid]
  );

  const [state, setState] = useState<UserLimitState>({
    dailyLimit: 0,
    usedToday: 0,
    lastUsageDate: null,
    isLoading: !!normalizedUid,
    error: null,
  });

  useEffect(() => {
    if (!normalizedUid) {
      setState({
        dailyLimit: 0,
        usedToday: 0,
        lastUsageDate: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const unsub = onSnapshot(
      doc(db, "users", normalizedUid),
      (snap) => {
        if (!snap.exists()) {
          setState({
            dailyLimit: 0,
            usedToday: 0,
            lastUsageDate: null,
            isLoading: false,
            error: "Brak dokumentu użytkownika.",
          });
          return;
        }

        const data = snap.data() as Partial<UserDoc>;
        setState({
          dailyLimit: typeof data.dailyLimit === "number" ? data.dailyLimit : 0,
          usedToday: typeof data.usedToday === "number" ? data.usedToday : 0,
          lastUsageDate:
            typeof data.lastUsageDate === "string" ? data.lastUsageDate : null,
          isLoading: false,
          error: null,
        });
      },
      (err) => {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : "Nieznany błąd",
        }));
      }
    );

    return () => unsub();
  }, [normalizedUid]);

  return state;
}
