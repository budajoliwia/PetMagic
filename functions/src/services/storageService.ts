import { storage } from "../core/firebase";

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
      // Ignore invalid FIREBASE_CONFIG JSON
    }
  }

  const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
  if (projectId) {
    return `${projectId}.firebasestorage.app`;
  }

  throw new Error(
    "Storage bucket name not configured. Set STORAGE_BUCKET env var."
  );
}

const getBucket = () => storage.bucket(resolveBucketName());

export async function downloadBuffer(path: string): Promise<Buffer> {
  const file = getBucket().file(path);
  const [buffer] = await file.download();
  return buffer;
}

export async function uploadBuffer(path: string, buffer: Buffer) {
  await getBucket().file(path).save(buffer, { contentType: "image/png" });
}

