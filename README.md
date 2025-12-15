# 🐾 PetMagicAI

To jest monorepo (jeden projekt), który zawiera zarówno **Aplikację Mobilną** (React Native/Expo), jak i **Backend** (Firebase Cloud Functions).

## 📂 Struktura Projektu

Projekt jest podzielony na dwie główne części:

### 📱 `mobile/` (Frontend)
- Tu siedzi cała aplikacja mobilna (React Native + Expo).
- Ekrany, style, logika po stronie telefonu.
- **Główny plik:** `mobile/app/index.tsx`.

### ☁️ `functions/` (Backend)
- Tu siedzi "mózg" aplikacji w chmurze (Node.js + Firebase Functions V2).
- Odpowiada za generowanie AI, przetwarzanie obrazków i pilnowanie limitów użytkowników.
- **Główny plik:** `functions/src/index.ts`.

---

## 🛠 Instalacja (Na Start)

Zanim zaczniesz, musisz mieć zainstalowane:
1.  **Node.js** (wersja 18 lub 20).
2.  **Firebase CLI**: Zainstaluj komendą: `npm install -g firebase-tools`.

### Krok 1: Pobierz biblioteki
Uruchom to raz w głównym katalogu projektu:

```bash
npm run setup
```
*(To automatycznie wejdzie do folderów `mobile` i `functions` i zainstaluje tam wszystko, co potrzebne).*

---

## 💻 Jak pracować lokalnie (Emulator)

Najlepszy sposób na testowanie zmian bez psucia produkcji.

### 1. Ustaw klucze (Tylko raz)
Backend potrzebuje klucza do OpenAI. Lokalnie trzymamy go w pliku.
1. Wejdź do folderu `functions/`.
2. Skopiuj plik `env.local.template` i zmień mu nazwę na `.env.local`.
3. Wpisz tam swój klucz: `OPENAI_API_KEY=sk-...`.

### 2. Uruchom Backend (Emulator)
Otwórz terminal w głównym katalogu i wpisz:

```bash
npm run dev:emulator
```
*(To odpali lokalną bazę danych i funkcje na twoim komputerze).*

### 3. Uruchom Aplikację (Mobile)
Otwórz **nowy** terminal (ten od emulatora zostaw włączony) i wpisz:

```bash
npm run mobile
```
*(To odpali Expo. Zeskanuj kod QR telefonem lub naciśnij 'a' żeby odpalić na Android Emulatorze).*

---

## 🚀 Jak wrzucić na Produkcję (Deploy)

Gdy wszystko działa i chcesz pokazać światu.

### Metoda A: Szybka (z roota)
W głównym katalogu wpisz:

1. **Ustaw sekret (tylko za pierwszym razem):**
   ```bash
   npm run secrets:set
   ```
   *(Zapyta o klucz OpenAI - wklej go).*

2. **Wyślij wszystko (Funkcje + Baza + Storage):**
   ```bash
   npm run deploy:all
   ```

### Metoda B: Ręczna (z folderów)
Jeśli wolisz robić to "po staremu":

1. Wejdź do backendu: `cd functions`
2. Wyślij funkcje: `firebase deploy --only functions`
3. Wróć do roota: `cd ..`
4. Wyślij reguły bazy: `firebase deploy --only firestore:rules`

---

## 🔍 Jak to działa pod maską?

**Przepływ zadania (Job Flow):**
1.  **Aplikacja (Mobile)** tworzy dokument w bazie `jobs/{jobId}` i wrzuca zdjęcie psa.
2.  **Backend (Functions)** widzi nowy dokument i uruchamia funkcję `processJob`.
3.  Funkcja sprawdza, czy user nie przekroczył limitu (`userService.ts`).
4.  Funkcja pyta OpenAI o opis (`aiService.ts`).
5.  Funkcja przerabia zdjęcie (`imageService.ts`).
6.  Gotowe! Wynik ląduje w bazie, a aplikacja go wyświetla.

---
*PetMagicAI Team*
