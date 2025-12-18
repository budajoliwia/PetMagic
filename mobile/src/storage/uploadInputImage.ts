import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { Image as RNImage } from "react-native";
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

  const getImageSizeAsync = (imageUri: string): Promise<{ width: number; height: number }> =>
    new Promise((resolve, reject) => {
      RNImage.getSize(
        imageUri,
        (width, height) => resolve({ width, height }),
        (error) => reject(error)
      );
    });

  // Resize (max long edge 1024px) + compress to JPEG quality 0.7 before upload.
  let uploadUri = uri;
  try {
    const { width, height } = await getImageSizeAsync(uri);
    const maxDim = Math.max(width, height);

    const actions: ImageManipulator.Action[] = [];
    if (maxDim > 1024) {
      if (width >= height) {
        actions.push({ resize: { width: 1024 } });
      } else {
        actions.push({ resize: { height: 1024 } });
      }
    }

    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      actions,
      {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    // Use the resized/compressed file for upload.
    uploadUri = manipulated.uri;
  } catch {
    // If we cannot read size / manipulate (rare), fall back to uploading the original.
    uploadUri = uri;
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

  const uploadPromise = FileSystem.uploadAsync(url, uploadUri, {
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

