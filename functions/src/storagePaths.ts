// functions/src/storagePaths.ts

export function getInputImagePath(userId: string, jobId: string): string {
  return `input/${userId}/${jobId}.jpg`;
}

export function getOutputImagePath(userId: string, generationId: string): string {
  return `output/${userId}/${generationId}.png`;
}
