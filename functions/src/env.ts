import dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

function isEmulatorRuntime(): boolean {
  return (
    process.env.FUNCTIONS_EMULATOR === "true" ||
    typeof process.env.FIREBASE_EMULATOR_HUB === "string"
  );
}

if (isEmulatorRuntime()) {
  const envLocalPath = path.resolve(__dirname, "..", ".env.local");
  if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
  }
}


