import { FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { db } from "../core/firebase";
import { generateImageFromInput } from "../services/aiService";
import { normalizeOutput } from "../services/imageService";
import { downloadBuffer, uploadBuffer } from "../services/storageService";
import {
  consumeUserLimit,
  LimitExceededError,
  refundUserLimit,
} from "../services/userService";
import { JobDoc } from "../types";
import {
  mapProcessingErrorCode,
  markJobError,
  normalizeErrorMessage,
} from "../utils/errorUtils";
import { getOutputImagePath } from "../utils/paths";

export const processJob = onDocumentCreated(
  {
    document: "jobs/{jobId}",
    region: "europe-central2",
    maxInstances: 10,
    secrets: ["OPENAI_API_KEY"],
    // Image generation + Storage I/O can exceed the default ~60s in emulators/CF.
    timeoutSeconds: 300,
    memory: "2GiB",
  },
  async (event) => {
    const jobId = event.params.jobId as string;
    const jobData = event.data?.data() as JobDoc | undefined;

    if (!jobData) {
      logger.error("Job document payload missing", { jobId });
      return;
    }

    const jobRef = db.collection("jobs").doc(jobId);

    // 1. Check Limits
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
      logger.error("Failed to consume user limit", { jobId, error: normalizeErrorMessage(error) });
      await markJobError(jobRef, "Nie udało się sprawdzić limitu użytkownika.", "LIMIT_CHECK_FAILED");
      return;
    }

    // 2. Process Job
    try {
      await jobRef.update({
        status: "processing",
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Download Input
      const inputBuffer = await downloadBuffer(jobData.inputImagePath);

      const jobType = jobData.type === "image" ? "image" : "sticker";

      const outputBuffer = await generateImageFromInput({
        inputImage: inputBuffer,
        style: jobData.style,
        type: jobType,
      });

      // Upload Output
      const generationRef = db.collection("generations").doc();
      const generationId = generationRef.id;
      const outputPath = getOutputImagePath(jobData.userId, generationId);

      // Stickers: enforce PNG; images can stay PNG for consistency.
      const finalBuffer = await normalizeOutput(outputBuffer, jobType === "sticker");
      await uploadBuffer(outputPath, finalBuffer);

      // Save Generation
      await generationRef.set({
        userId: jobData.userId,
        jobId,
        inputImagePath: jobData.inputImagePath,
        outputImagePath: outputPath,
        type: jobType,
        style: jobData.style,
        createdAt: FieldValue.serverTimestamp(),
        title: `Stylized ${jobData.style}`,
        isFavorite: false,
      });

      // Mark Done
      await jobRef.update({
        status: "done",
        resultGenerationId: generationId,
        updatedAt: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      // Best-effort refund: failed generations should not consume daily usage.
      try {
        await refundUserLimit(jobData.userId);
      } catch (refundError) {
        logger.warn("Failed to refund user limit after job failure", {
          jobId,
          refundError: normalizeErrorMessage(refundError),
        });
      }

      logger.error("Job processing failed", { jobId, error: normalizeErrorMessage(error) });
      const code = mapProcessingErrorCode(error);
      await markJobError(
        jobRef,
        `Wystąpił błąd podczas przetwarzania zadania: ${normalizeErrorMessage(error)}`,
        code
      );
    }
  }
);

