# PetMagicAI

Monorepo z aplikacją mobilną (Expo/React Native) oraz backendem (Firebase Cloud Functions + Firestore/Storage). Użytkownik wrzuca zdjęcie pupila i generuje z niego grafikę w stylu **sticker** albo **image**.

## Funkcje
- **Generowanie obrazów** na podstawie zdjęcia (OpenAI).
- **Kolejka jobów** w Firestore (`jobs/{jobId}`) + backendowy worker (`processJob`).
- **Historia generacji** (`generations/{id}`), zapisywanie/udostępnianie.
- **Limity dzienne** per użytkownik.

## Stack
- **Mobile**: Expo (React Native), Expo Router, Firebase Web SDK
- **Backend**: Firebase Cloud Functions (Gen2 dla `processJob`), Firestore, Storage
- **AI**: OpenAI (`gpt-image-1`)

## Struktura repo
- **`mobile/`**: aplikacja mobilna (wejście: `mobile/app/index.tsx`)
- **`functions/`**: Cloud Functions (wejście: `functions/src/index.ts`)

## Konfiguracja (env)
### Mobile (`mobile/.env`)
Skopiuj `mobile/env.example` → `mobile/.env` i uzupełnij:
- `EXPO_PUBLIC_FIREBASE_*` (z Firebase Console → Project settings → Web app)
- `EXPO_PUBLIC_USE_EMULATORS` i opcjonalnie `EXPO_PUBLIC_EMULATOR_HOST` (tylko do pracy na emulatorach)

### Functions (`functions/.env.local`)
Skopiuj `functions/env.local.template` → `functions/.env.local` i ustaw:
- `OPENAI_API_KEY=...`

## Uruchomienie lokalne (Firebase emulators)
1. Instalacja zależności (z roota):

```bash
npm run setup
```

2. Start emulatorów (z roota):

```bash
npm run dev:emulator
```

3. Start aplikacji (z roota, w drugim terminalu):

```bash
npm run mobile
```

Jeśli uruchamiasz na **fizycznym urządzeniu** i używasz emulatorów, ustaw `EXPO_PUBLIC_EMULATOR_HOST` na IP komputera w LAN (pokazywane przez Expo jako `exp://<IP>:8081`).

## Deploy (Firebase)
1. Ustaw sekret OpenAI (pierwszy raz):

```bash
npm run secrets:set
```

2. Deploy Functions + Firestore rules + Storage rules:

```bash
npm run deploy:all
```

## Build APK (EAS Build)
W `mobile/eas.json` są gotowe profile:
- `preview`: APK (internal distribution)
- `production`: AAB

Minimalnie:
1. `npm i -g eas-cli`
2. `cd mobile && eas init`
3. Dodaj wartości `EXPO_PUBLIC_FIREBASE_*` jako EAS secrets
4. Build:

```bash
eas build --platform android --profile preview
```

## Bezpieczeństwo i anti‑abuse (publiczne demo)
- **Firestore**: klient nie może tworzyć `users/{uid}` (profil tworzy backend), a `jobs/{jobId}` wymusza ścieżkę `input/{uid}/{jobId}.jpg`.
- **Storage**: upload `input/` tylko właściciel + limit rozmiaru + `image/jpeg`.
- **Limits**: backend egzekwuje dzienne limity (i refunduje limit, gdy job się wywali).

## Koszty (rekomendacja)
Jeśli robisz publiczne demo: ustaw budżet i alerty w Google Cloud Billing oraz monitoruj logi Functions.
