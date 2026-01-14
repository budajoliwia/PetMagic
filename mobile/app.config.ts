import type { ConfigContext, ExpoConfig } from "@expo/config";
import appJson from "./app.json";

function parseBoolEnv(value: unknown): boolean | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(v)) return true;
  if (["0", "false", "no", "n", "off"].includes(v)) return false;
  return undefined;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  // Prefer app.json as the single source of truth, but allow Expo to inject/merge defaults.
  const base: ExpoConfig = ((appJson as any).expo ?? config) as ExpoConfig;

  // Allow cleartext HTTP traffic ONLY for local emulators/dev.
  // In EAS profiles we force EXPO_PUBLIC_USE_EMULATORS=0.
  const useEmulators = parseBoolEnv(process.env.EXPO_PUBLIC_USE_EMULATORS) ?? false;

  return {
    ...base,
    android: {
      ...(base.android ?? {}),
      // `usesCleartextTraffic` is supported by Expo, but not present in @expo/config-types yet.
      ...(useEmulators ? ({ usesCleartextTraffic: true } as any) : {}),
    },
  };
};


