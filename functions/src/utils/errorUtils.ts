import { DocumentReference, FieldValue } from "firebase-admin/firestore";

export function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : JSON.stringify(error);
}

export function mapProcessingErrorCode(error: unknown): string {
  const msg = normalizeErrorMessage(error);
  if (msg.includes("OPENAI_API_KEY")) return "OPENAI_API_KEY_MISSING";
  if (msg.includes("No such object") || msg.includes("not found")) return "INPUT_NOT_FOUND";
  if (msg.toLowerCase().includes("storage bucket name not configured")) return "BUCKET_NOT_CONFIGURED";
  return "JOB_PROCESSING_ERROR";
}

export async function markJobError(
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

