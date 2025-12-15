import dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

function isEmulatorRuntime(): boolean {
  return (
    process.env.FUNCTIONS_EMULATOR === "true" ||
    typeof process.env.FIREBASE_EMULATOR_HUB === "string"
  );
}

// For local development: load functions/.env.local (gitignored) into process.env.
// In production: rely on Secret Manager injection (secrets: ["OPENAI_API_KEY"]).
if (isEmulatorRuntime()) {
  const envLocalPath = path.resolve(__dirname, "..", ".env.local");
  if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
  }
}


