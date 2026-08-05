# POWERPULSE MVP — PROGRESS TRACKER

> Keep this file updated every time you work on the project. It records what has been
> done and exactly where to stop/continue next time. Read it first before starting work.

---

## HOW TO RUN THIS PROJECT

Open a terminal **inside this PowerPulse folder** and run:

```
npm install
npm run dev
```

Then open your browser at:

- Web dashboard: **http://localhost:3000**
- IoT Simulator: **http://localhost:3000/simulator.html**

To run the automated Playwright demo test (needs the dev server running in another terminal):

```
npx playwright test
```

---

## WHAT HAS BEEN DONE (✓)

- [x] Project structure created (backend, frontend, simulator, e2e tests).
- [x] Node.js + Express backend with SQLite database (sql.js — SQLite compiled to WASM, no native build).
- [x] Database schema: Users, Locations, Devices, PowerEvents, Notifications.
- [x] REST API endpoints:
  - `POST /auth/register`
  - `POST /auth/login`
  - `GET /locations`, `POST /locations`, `GET /locations/:id`
  - `POST /devices`, `GET /devices/:id`
  - `POST /devices/status`  (public IoT endpoint — device authenticates with its device code)
  - `GET /locations/:id/status`
  - `GET /locations/:id/history`
  - `GET /notifications`
- [x] Device identity validation (device code) before accepting status updates.
- [x] Power state change detection (ON <-> OFF) + PowerEvent creation.
- [x] Current power status tracking + device last-seen time.
- [x] In-app notification system (message + created time), separated from core logic.
- [x] Frontend dashboard (landing page, register/login, dashboard, history, setup).
- [x] IoT Simulator page with POWER ON / POWER OFF buttons.
- [x] Polling mechanism on the dashboard for live status updates (structure ready for WebSockets later).
- [x] Playwright E2E test covering the full hackathon demo scenario.

## ENVIRONMENT NOTES (WSL / WINDOWS)

- This project runs inside WSL. The folder is on the Windows Desktop at
  `C:\Users\Prof. Timehin\Desktop\PowerPulse`.
- `node_modules` is NOT stored on the Windows filesystem. It is a symlink to
  `/home/saeedrido/.powerpulse-deps/node_modules` because writing node_modules to the
  Windows drive (`/mnt/c`) causes file corruption (a known WSL issue). Do NOT delete
  that symlink or run `npm install` directly in a way that replaces it.
- `better-sqlite3` needs native compilation that fails on this setup, so the project
  uses **sql.js** (SQLite in WASM) instead — no native build required.
- To run Playwright browser tests, the system libraries `libnss3 libnspr4 libasound2t64`
  must be installed once with sudo:
  `sudo npx playwright install-deps chromium`
- The database file is stored at `data/powerpulse.db`. Delete it to reset all data.

---

## CURRENT STATE / WHERE TO STOP

**We are at: [ MVP COMPLETE + VERIFIED ]**

The full MVP is built and the automated Playwright demo test **passes end-to-end**:
registration -> add "My Home" -> connect device -> simulator POWER OFF -> dashboard
shows 🔴 POWER UNAVAILABLE + "Power has gone off" notification -> simulator POWER ON ->
dashboard shows 🟢 POWER AVAILABLE + "Power has been restored" notification -> history
shows the full ON/OFF timeline.

Next time you open this project, **continue from here:**

1. Run the app: `npm run dev`, then open `http://localhost:3000`.
2. Manually walk through the demo (see "Demo Scenario" below) to review the UI.
3. Run the automated test any time with: `npx playwright test`
4. Then decide which MVP item from the "Next Up" list below to build.

## SETUP RECAP (one-time, already done)
- Browser system libraries were installed with `sudo apt-get install -y libnss3 libnspr4 libasound2t64`.
- Playwright Chromium was installed with `npx playwright install chromium`.

---

## DEMO SCENARIO (manual walkthrough)

1. Open `http://localhost:3000` → click **Get Started** → create an account.
2. On the dashboard click **Setup**.
3. Add a location named **My Home**.
4. Connect a device using the code **PP-DEMO-0001** (or any code) to My Home.
5. Go back to **Dashboard**. Open the **IoT Simulator** in a new tab (`/simulator/simulator.html`).
6. Set the same device code, click **POWER OFF**.
7. Switch back to the Dashboard — within ~5 seconds it should change to
   **🔴 POWER UNAVAILABLE** and show the notification *"Power has gone off at My Home."*
8. In the simulator click **POWER ON**.
9. Dashboard returns to **🟢 POWER AVAILABLE** with *"Power has been restored at My Home."*
10. Open **History** to see the complete ON/OFF timeline.

---

## NEXT UP (TODO / BACKLOG)

- [x] Manual browser walkthrough of the full demo (login -> see My Home -> simulator OFF -> dashboard red -> notification -> ON -> green -> history).  [AUTOMATED via `npx playwright test` — passed]
- [ ] Manual visual review/polish of the UI (styling on mobile-sized screens).
- [ ] (Later) Replace polling with WebSockets/SignalR for live updates.
- [ ] (Later) Real hardware integration: replace simulator with a real ESP32 device using the same `/devices/:id/status` API.
- [ ] (Later, explicitly OUT of MVP scope) Payments, SMS, WhatsApp, native apps, analytics.

---

## NOTES / DECISIONS

- Using **SQLite** via `better-sqlite3` so the MVP has no external database server to install.
- Using **plain HTML/CSS/JS** frontend served by Express to keep the MVP simple to run.
- **Notifications** are stored in the DB and shown in-app. The code is split into a separate
  service so push/email/SMS/WhatsApp can be plugged in later without touching the core power logic.
- Dashboard uses **polling** (simple) now; the code is structured so WebSockets can be added later.
