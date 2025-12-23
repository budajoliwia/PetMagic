import Constants from "expo-constants";
import { Platform } from "react-native";

function parseBoolEnv(value: string | undefined): boolean | undefined {
  if (value == null) return undefined;
  const v = value.trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(v)) return true;
  if (["0", "false", "no", "n", "off"].includes(v)) return false;
  return undefined;
}

export const USE_EMULATORS: boolean =
  parseBoolEnv(process.env.EXPO_PUBLIC_USE_EMULATORS) ?? __DEV__;

/**
 * Returns a host that the app (phone/simulator) can reach.
 *
 * - Physical device: MUST provide EXPO_PUBLIC_EMULATOR_HOST (LAN IP of your PC)
 * - Android Emulator: defaults to 10.0.2.2
 * - iOS Simulator / Web: defaults to localhost
 */
export function getEmulatorHost(): string {
  const fromEnv = process.env.EXPO_PUBLIC_EMULATOR_HOST?.trim();
  if (fromEnv && fromEnv.length > 0) return fromEnv;

  // When emulators are not used, this should never be called.
  if (!USE_EMULATORS) {
    throw new Error(
      "getEmulatorHost() was called but USE_EMULATORS is false. Check your emulator wiring."
    );
  }

  // expo-constants returns false for simulators/emulators and true for physical devices.
  const isDevice = Constants.isDevice ?? true;

  if (Platform.OS === "android" && !isDevice) return "10.0.2.2";
  if (Platform.OS === "ios" && !isDevice) return "localhost";
  if (Platform.OS === "web") return "localhost";

  throw new Error(
    "EXPO_PUBLIC_EMULATOR_HOST is required when using emulators on a physical device. " +
      "Set it to the LAN IP of your PC (the one shown by Expo as exp://<IP>:8081) and restart Expo."
  );
}


