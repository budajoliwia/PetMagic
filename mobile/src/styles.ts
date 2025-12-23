import { JobType } from "./models";

/**
 * Single source of truth for style options shown in UI.
 * Keep these strings stable (they are persisted into Firestore `jobs.style` / `generations.style`).
 */
export const STYLES_BY_TYPE: Record<JobType, readonly string[]> = {
  sticker: [
    "Cartoon",
    "Kawaii",
    "Kawaii Plush",
    "Line Art",
  ],
  image: [
    "Cartoon",
    "Kawaii",
    "Kawaii Plush",
    "Line Art",
  ],
} as const;


