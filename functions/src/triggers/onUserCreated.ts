import { FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import * as functions from "firebase-functions/v1";
import { db } from "../core/firebase";


export const onUserCreated = functions
  .region("europe-central2")
  .auth.user()
  .onCreate(async (user) => {
    const uid = user.uid;
    const email = user.email ?? "";

    const userRef = db.collection("users").doc(uid);

    try {
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(userRef);
        if (snap.exists) return;

        tx.set(userRef, {
          email,
          createdAt: FieldValue.serverTimestamp(),
          role: "user",
          dailyLimit: 5,
          usedToday: 0,
          lastUsageDate: null,
        });
      });
    } catch (error) {
      logger.error("Failed to create user profile document", { uid, error });
    }
  });


