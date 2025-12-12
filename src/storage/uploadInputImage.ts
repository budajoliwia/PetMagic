import { ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase";
import { getInputImagePath } from "../storagePaths";

export async function uploadInputImage(
  uri: string,
  userId: string,
  jobId: string
): Promise<string> {
  const inputImagePath = getInputImagePath(userId, jobId);
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error("Failed to read the selected image");
  }

  const blob = await response.blob();
  await uploadBytes(ref(storage, inputImagePath), blob);

  return inputImagePath;
}

