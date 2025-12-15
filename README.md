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

---

## 🚀 Running Locally (Emulator)

1. **Configure Local Secrets:**
   Copy the template in `functions/` folder:
   ```bash
   cp functions/env.local.template functions/.env.local
   # Edit .env.local and add your OPENAI_API_KEY
   ```

2. **Start Backend Emulator:**
   From root:
   ```bash
   npm run dev:emulator
   ```

3. **Start Mobile App:**
   In a new terminal (from root):
   ```bash
   npm run mobile
   ```

---

## ☁️ Deployment to Production

### 1. Set Secrets (One-time setup)
In production, we use **Google Secret Manager**. The `.env.local` file is NOT uploaded.
Run this command and paste your OpenAI API Key when prompted:

```bash
npm run secrets:set
```

### 2. Deploy Everything
This command deploys **Functions, Firestore Rules, and Storage Rules** at once:

```bash
npm run deploy:all
```

**Note on V1 to V2 Migration:**
If you see errors about "1st Gen" functions during deploy, you might need to delete the old function in Firebase Console first, then redeploy.

---

## 🏗 Architecture Details

**Job Processing Flow:**
1. App (Mobile) creates a `jobs/{jobId}` document and uploads an image.
2. Cloud Function `processJob` (v2) triggers on document creation.
3. **Secrets:** In production, the function securely fetches `OPENAI_API_KEY` from Secret Manager. Locally, it reads from `.env.local`.

---
*PetMagicAI Monorepo*
