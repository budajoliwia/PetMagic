import * as FileSystem from "expo-file-system/legacy";
import { auth, storage } from "../firebase";
import { getInputImagePath } from "../storagePaths";

export async function uploadInputImage(
  uri: string,
  userId: string,
  jobId: string
): Promise<string> {
  const inputImagePath = getInputImagePath(userId, jobId);
  const scheme = uri.split(":")[0] ?? "unknown";

  const fileInfo = await FileSystem.getInfoAsync(uri);
  if (!fileInfo.exists) {
    throw new Error(`Selected image file not found. uriScheme=${scheme}`);
  }

  const bucket = storage.app.options.storageBucket;
  if (!bucket) {
    throw new Error("Storage bucket is not configured in Firebase app options.");
  }

  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error("Missing auth token for Storage upload.");
  }

  // Use Storage REST API to avoid Blob/ArrayBuffer incompatibilities in React Native runtimes.
  // If you're running emulators on a physical device, this must be the LAN IP of your PC.
  const emulatorHost =
    process.env.EXPO_PUBLIC_EMULATOR_HOST ?? "192.168.1.30";
  const baseUrl =
    emulatorHost && emulatorHost.length > 0
      ? `http://${emulatorHost}:9199`
      : "https://firebasestorage.googleapis.com";

  const url = `${baseUrl}/v0/b/${encodeURIComponent(
    bucket
  )}/o?uploadType=media&name=${encodeURIComponent(inputImagePath)}`;

  const uploadPromise = FileSystem.uploadAsync(url, uri, {
    httpMethod: "POST",
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "image/jpeg",
    },
  });

  const timeoutMs = 25_000;
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(
        new Error(
          `Upload timed out after ${timeoutMs}ms. Check emulator reachability (${baseUrl}) and Wi‑Fi/firewall. uriScheme=${scheme}`
        )
      );
    }, timeoutMs);
  });

  const result = await Promise.race([uploadPromise, timeoutPromise]);

  // Fail fast on non-2xx responses with some context.
  if (result.status < 200 || result.status >= 300) {
    const bodyPreview =
      typeof result.body === "string" ? result.body.slice(0, 200) : "";
    throw new Error(
      `Storage upload failed: HTTP ${result.status}. ${bodyPreview}`
    );
  }

  return inputImagePath;
}

