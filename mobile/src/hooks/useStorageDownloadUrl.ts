import { getDownloadURL, ref } from "firebase/storage";
import { useEffect, useMemo, useState } from "react";
import { storage } from "../firebase";

type UseStorageDownloadUrlState = {
  url: string | null;
  isLoading: boolean;
  error: string | null;
};

// Very small in-memory cache to avoid re-fetching URLs in lists.
const urlCache = new Map<string, string>();

export function useStorageDownloadUrl(path?: string | null): UseStorageDownloadUrlState {
  const normalizedPath = useMemo(() => {
    if (!path) return null;
    const trimmed = path.trim();
    return trimmed.length > 0 ? trimmed : null;
  }, [path]);

  const [url, setUrl] = useState<string | null>(() => {
    if (!normalizedPath) return null;
    return urlCache.get(normalizedPath) ?? null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (!normalizedPath) return false;
    return !urlCache.has(normalizedPath);
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!normalizedPath) {
        setUrl(null);
        setIsLoading(false);
        setError(null);
        return;
      }

      const cached = urlCache.get(normalizedPath);
      if (cached) {
        setUrl(cached);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const nextUrl = await getDownloadURL(ref(storage, normalizedPath));
        if (cancelled) return;
        urlCache.set(normalizedPath, nextUrl);
        setUrl(nextUrl);
        setIsLoading(false);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Unknown error";
        setUrl(null);
        setError(message);
        setIsLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [normalizedPath]);

  return { url, isLoading, error };
}


