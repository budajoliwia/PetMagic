// src/storagePaths.ts

export function getInputImagePath(userId: string, jobId: string) {
  return `input/${userId}/${jobId}.jpg`;
}

export function getOutputImagePath(userId: string, generationId: string) {
  return `output/${userId}/${generationId}.png`;
}
