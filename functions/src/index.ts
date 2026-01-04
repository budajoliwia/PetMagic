/**
 * Entry point for Cloud Functions.
 * Exports triggers defined in the `triggers` directory.
 */

import "./core/firebase"; // Ensure initialization runs
export { onUserCreated } from "./triggers/onUserCreated";
export { processJob } from "./triggers/processJob";

