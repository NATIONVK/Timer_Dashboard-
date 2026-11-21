# Timer Dashboard

Mobile-first focus timer and productivity dashboard by NATIONVK.

## Core areas
- Blue Particle Heart focus environment
- Focus timer with pause, resume, finish and session restore
- Dashboard with daily/weekly totals, streak, subject breakdown, monthly activity calendar, recent sessions and CSV export

## Run and preview in Termux (Android)

Install the basic tools:

```bash
pkg update && pkg upgrade -y
pkg install git nodejs-lts -y
```

Clone and run the app:

```bash
git clone https://github.com/NATIONVK/Timer_Dashboard-.git
cd Timer_Dashboard-
npm install
npm run dev
```

Open the local address shown by Vite (normally `http://localhost:5173`) in your Android browser. Keep the Termux session running while previewing.

## Build an APK

The GitHub Actions workflow builds a debug APK automatically after a push to `main`, and can also be started manually from the repository's Actions tab.

1. Push your latest changes to GitHub.
2. Open the repository's **Actions** tab.
3. Open the latest **Build Timer Dashboard Web and APK** run.
4. Under **Artifacts**, download `Timer-Dashboard-debug-APK`.
5. Extract the ZIP and install `app-debug.apk` on your Android phone. Allow installation from the app used to open the APK if Android asks.

The Termux workflow is for live web preview. Android APK compilation is handled by GitHub Actions, so a full Android SDK/Gradle toolchain does not need to be installed on the phone.

## Build web assets locally

```bash
npm run build
```

All study data is stored locally in this browser/app installation. This repository is independent from FOCUS-FLOW-4.0; that repository is reference-only.
