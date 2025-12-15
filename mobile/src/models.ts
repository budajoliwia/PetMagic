import { Timestamp } from "firebase/firestore";

// users/{uid}
export interface UserDoc {
  email: string;
  createdAt: string;
  role: "user" | "admin";

  dailyLimit: number;
  usedToday: number;
  lastUsageDate: string | null;
}

// jobs/{jobsId}
export type JobStatus = "queued" | "processing" | "done" | "error";

export interface JobDoc {
  userId: string;
  type: "GENERATE_STICKER";

  inputImagePath: string;
  style: string;

  status: JobStatus;
  errorCode?: string;
  errorMessage?: string;

  resultGenerationId?: string;

  // Używamy Timestamp z firebase/firestore; przy zapisie korzystamy z serverTimestamp()
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

// generations/{generationId}
export interface GenerationDoc {
  userId: string;
  jobId: string;

  inputImagePath: string;
  outputImagePath: string;

  style: string;
  // Analogicznie jak w JobDoc - pole ustawiane przez serverTimestamp()
  createdAt: Timestamp | null;

  title?: string;
  isFavorite?: boolean;
}
