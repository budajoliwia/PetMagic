import { FieldValue } from "firebase-admin/firestore";
import { db } from "../core/firebase";
import { UserDoc } from "../types";

export class LimitExceededError extends Error {
  constructor() {
    super("User limit exceeded");
    this.name = "LimitExceededError";
  }
}

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

export async function consumeUserLimit(userId: string): Promise<void> {
  const userRef = db.collection("users").doc(userId);
  const today = getTodayKey();

  await db.runTransaction(async (tx) => {
    const userSnapshot = await tx.get(userRef);
    if (!userSnapshot.exists) {
      tx.set(userRef, {
        email: "",
        createdAt: FieldValue.serverTimestamp(),
        role: "user",
        dailyLimit: 5,
        usedToday: 0,
        lastUsageDate: null,
      });
    }

    const user = (userSnapshot.exists ? userSnapshot.data() : null) as UserDoc | null;
    const dailyLimit = user?.dailyLimit ?? 5;
    let usedToday = user?.usedToday ?? 0;
    const lastUsageDate = user?.lastUsageDate ?? null;

    // Reset counter if it's a new day
    if (lastUsageDate !== today) {
      usedToday = 0;
    }

    if (dailyLimit > 0 && usedToday >= dailyLimit) {
      throw new LimitExceededError();
    }

    tx.update(userRef, {
      usedToday: usedToday + 1,
      lastUsageDate: today,
    });
  });
}

/**
 * Refund a previously consumed daily usage (best-effort).
 * This is used when a generation fails after we already consumed the limit.
 */
export async function refundUserLimit(userId: string): Promise<void> {
  const userRef = db.collection("users").doc(userId);
  const today = getTodayKey();

  await db.runTransaction(async (tx) => {
    const userSnapshot = await tx.get(userRef);
    if (!userSnapshot.exists) {
      // nothing to refund
      return;
    }

    const user = userSnapshot.data() as UserDoc;
    const lastUsageDate = user.lastUsageDate ?? null;
    const usedToday = user.usedToday ?? 0;

    // Only refund for today's counter
    if (lastUsageDate !== today) return;
    if (usedToday <= 0) return;

    tx.update(userRef, {
      usedToday: usedToday - 1,
      lastUsageDate: today,
    });
  });
}

