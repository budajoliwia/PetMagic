/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { initializeApp } from "firebase-admin/app";
import { DocumentReference, FieldValue, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { setGlobalOptions } from "firebase-functions";
import * as logger from "firebase-functions/logger";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { runStyleModel } from "./aiClient";
import { stylizeImage } from "./imageProcessing";
import { getOutputImagePath } from "./storagePaths";
import { JobDoc, UserDoc } from "./types";

initializeApp();
const db = getFirestore();
const storage = getStorage();
const bucket = storage.bucket();

setGlobalOptions({ maxInstances: 10 });

class LimitExceededError extends Error {
  constructor() {
    super("User limit exceeded");
    this.name = "LimitExceededError";
  }
}

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

async function consumeUserLimit(userId: string): Promise<void> {
  const userRef = db.collection("users").doc(userId);
  const today = getTodayKey();

  await db.runTransaction(async (tx) => {
    const userSnapshot = await tx.get(userRef);
    if (!userSnapshot.exists) {
      throw new Error("Missing user document");
    }

    const user = userSnapshot.data() as UserDoc;
    const dailyLimit = user.dailyLimit ?? 0;
    let usedToday = user.usedToday ?? 0;
    const lastUsageDate = user.lastUsageDate ?? null;

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

async function downloadBuffer(path: string): Promise<Buffer> {
  const file = bucket.file(path);
  const [buffer] = await file.download();
  return buffer;
}

async function uploadBuffer(path: string, buffer: Buffer) {
  await bucket.file(path).save(buffer, { contentType: "image/png" });
}

async function markJobError(
  jobRef: DocumentReference,
  message: string,
  code: string
) {
  await jobRef.update({
    status: "error",
    errorMessage: message,
    errorCode: code,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export const processJob = onDocumentCreated("jobs/{jobId}", async (event) => {
  const jobId = event.params.jobId;
  const jobData = event.data?.data() as JobDoc | undefined;

  if (!jobData) {
    logger.error("Job document payload missing", { jobId });
    return;
  }

  const jobRef = db.collection("jobs").doc(jobId);

  try {
    await consumeUserLimit(jobData.userId);
  } catch (error) {
    if (error instanceof LimitExceededError) {
    await markJobError(
      jobRef,
      "Daily job limit reached. Spróbuj jutro.",
      "LIMIT_REACHED"
    );
      return;
    }
    logger.error("Failed to consume user limit", {
      jobId,
      error: (error as Error).message,
    });
    await markJobError(
      jobRef,
      "Nie udało się sprawdzić limitu użytkownika.",
      "LIMIT_CHECK_FAILED"
    );
    return;
  }

  try {
    // mark as processing as soon as we start the heavy work
    await jobRef.update({
      status: "processing",
      updatedAt: FieldValue.serverTimestamp(),
    });

    const inputBuffer = await downloadBuffer(jobData.inputImagePath);
    const aiResponse = await runStyleModel({
      jobId,
      style: jobData.style,
      userId: jobData.userId,
    });

    logger.info("AI response received", {
      jobId,
      aiResponse,
    });

    const outputBuffer = await stylizeImage(inputBuffer, jobData.style);

    const generationRef = db.collection("generations").doc();
    const generationId = generationRef.id;
    const outputPath = getOutputImagePath(jobData.userId, generationId);

    await uploadBuffer(outputPath, outputBuffer);

    await generationRef.set({
      userId: jobData.userId,
      jobId,
      inputImagePath: jobData.inputImagePath,
      outputImagePath: outputPath,
      style: jobData.style,
      createdAt: FieldValue.serverTimestamp(),
      title: `Stylized ${jobData.style}`,
      isFavorite: false,
    });

    await jobRef.update({
      status: "done",
      resultGenerationId: generationId,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    logger.error("Job processing failed", {
      jobId,
      error: (error as Error).message,
    });
    await markJobError(
      jobRef,
      "Wystąpił błąd podczas przetwarzania zadania.",
      "JOB_PROCESSING_ERROR"
    );
  }
});
