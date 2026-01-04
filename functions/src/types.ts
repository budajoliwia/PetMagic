import type { Timestamp } from "firebase-admin/firestore";

export interface UserDoc {
  email: string;
  createdAt: Timestamp | null;
  role: "user" | "admin";

  dailyLimit: number;
  usedToday: number;
  lastUsageDate: string | null;
}

export type JobStatus = "queued" | "processing" | "done" | "error";
export type JobType = "sticker" | "image";

export interface JobDoc {
  userId: string;
  type: JobType;

  inputImagePath: string;
  style: string;

  status: JobStatus;
  errorCode?: string;
  errorMessage?: string;

  resultGenerationId?: string;

  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface GenerationDoc {
  userId: string;
  jobId: string;

  inputImagePath: string;
  outputImagePath: string;

  style: string;
  createdAt: Timestamp | null;

  title?: string;
  isFavorite?: boolean;
}

