# 🐾 PetMagicAI

This project is a monorepo containing both the **Mobile App** (React Native/Expo) and the **Backend** (Firebase Cloud Functions).

## 📂 Project Structure

The codebase is strictly separated:

### 📱 `mobile/` (Frontend)
- Built with **React Native** & **Expo**.
- Contains all UI code (`app/`), assets, and frontend logic (`src/`).
- **Entry point:** `mobile/app/` (Expo Router).

### ☁️ `functions/` (Backend)
- Built with **Node.js** & **Firebase Cloud Functions (v2)**.
- Handles heavy logic: AI generation, image processing, user limits.
- **Entry point:** `functions/src/index.ts`.

---

## 🛠 Setup & Installation

### 1. Prerequisites
- Node.js (v18 or v20 recommended)
- Firebase CLI (`npm install -g firebase-tools`)

### 2. Install Dependencies (One Command)
Run this in the root directory to install dependencies for both parts:

```bash
npm run setup
```

Or manually:
```bash
cd mobile && npm install
cd ../functions && npm install
```

---

## 🚀 Running the Project

### Local Development (Emulator + App)

1. **Start Backend Emulator:**
   From root:
   ```bash
   npm run dev:emulator
   # or: firebase emulators:start
   ```

2. **Start Mobile App:**
   In a new terminal (from root):
   ```bash
   npm run mobile
   # or: cd mobile && npx expo start
   ```

### 🔑 Secrets (Backend)
- **Local:** Edit `functions/.env.local` (copy from template).
- **Production:** `firebase functions:secrets:set OPENAI_API_KEY`.

## 🏗 Architecture Details

**Job Processing Flow:**
1. App (Mobile) creates a `jobs/{jobId}` document and uploads an image.
2. Cloud Function `processJob` triggers on document creation.
3. **Step 1:** Checks User Limits (`functions/src/services/userService.ts`).
4. **Step 2:** Calls OpenAI (`functions/src/services/aiService.ts`).
5. **Step 3:** Processes image (`functions/src/services/imageService.ts`).
6. **Step 4:** Saves result.

---
*PetMagicAI Monorepo*
