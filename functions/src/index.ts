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
import * as logger from "firebase-functions/logger";
import * as functions from "firebase-functions/v1";
import { runStyleModel } from "./aiClient";
import { stylizeImage } from "./imageProcessing";
import { getOutputImagePath } from "./storagePaths";
import { JobDoc, UserDoc } from "./types";

initializeApp();
const db = getFirestore();

class LimitExceededError extends Error {
  constructor() {
    super("User limit exceeded");
    this.name = "LimitExceededError";
  }
}

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function resolveBucketName(): string {
  const explicit =
    process.env.STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET;
  if (explicit) return explicit;

  const firebaseConfig = process.env.FIREBASE_CONFIG;
  if (firebaseConfig) {
    try {
      const parsed = JSON.parse(firebaseConfig) as { storageBucket?: string };
      if (parsed.storageBucket) return parsed.storageBucket;
    } catch {
      // ignore
    }
  }

  const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
  if (projectId) {
    // Newer Firebase projects use *.firebasestorage.app, older use *.appspot.com
    return `${projectId}.firebasestorage.app`;
  }

  throw new Error(
    "Storage bucket name not configured. Set STORAGE_BUCKET env var."
  );
}

function getBucket() {
  // IMPORTANT: don't call bucket() at module-load time; firebase-tools "analyzes"
  // functions by requiring this file and expects no runtime errors.
  return getStorage().bucket(resolveBucketName());
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
  const file = getBucket().file(path);
  const [buffer] = await file.download();
  return buffer;
}

async function uploadBuffer(path: string, buffer: Buffer) {
  await getBucket().file(path).save(buffer, { contentType: "image/png" });
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

function normalizeErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : JSON.stringify(error);
}

function mapProcessingErrorCode(error: unknown): string {
  const msg = normalizeErrorMessage(error);
  if (msg.includes("OPENAI_API_KEY")) return "OPENAI_API_KEY_MISSING";
  if (msg.includes("No such object") || msg.includes("not found")) return "INPUT_NOT_FOUND";
  if (msg.toLowerCase().includes("storage bucket name not configured")) return "BUCKET_NOT_CONFIGURED";
  return "JOB_PROCESSING_ERROR";
}

export const processJob = functions
  .runWith({ maxInstances: 10 })
  .region("europe-central2")
  .firestore.document("jobs/{jobId}")
  .onCreate(async (snap: functions.firestore.QueryDocumentSnapshot, context: functions.EventContext) => {
  const jobId = context.params.jobId as string;
  const jobData = snap.data() as JobDoc | undefined;

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
      error: normalizeErrorMessage(error),
    });
    const code = mapProcessingErrorCode(error);
    await markJobError(
      jobRef,
      `Wystąpił błąd podczas przetwarzania zadania: ${normalizeErrorMessage(
        error
      )}`,
      code
    );
  }
  });
