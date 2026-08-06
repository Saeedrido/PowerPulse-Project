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

## UI REDESIGN (TemplateMo 622 Clearwave — blue & white)

The whole site now uses the **TemplateMo 622 Clearwave** template look, recolored to a
blue & white palette, with a landing page that tells the PowerPulse project story.

- **Design tokens**: `--accent:#1D6FF2`, `--bg:#F4F8FD`, `--surface:#EBF2FB`,
  `--surface-2:#FFFFFF`, `--text-1:#0A1220` (+ mid/light accent shades). Fonts:
  **DM Sans** + **Playfair Display** (italic emphasis), radius 16/24.
- **`public/css/clearwave.css`** — new shared design system (template + all app
  components). Replaces `public/css/styles.css` (deleted; no files reference it anymore).
- **`public/js/clearwave.js`** — defensive template behaviors (nav scroll, mobile menu,
  reveal, counters, carousel, pricing toggle, FAQ accordion).
- **`public/index.html`** — rebuilt landing: hero with dashboard mock + float badges,
  use-case ticker, About-the-project row, 3 feature rows, 5-phone 3D carousel,
  stats counters, pricing toggle, testimonials, integrations, FAQ, CTA, footer with
  TemplateMo credit.
- **App views all ported** to the same template: `dashboard.html`, `setup.html`,
  `history.html`, `login.html`, `register.html`, `simulator/simulator.html`. Each keeps
  the exact legacy JS IDs/classes (`#logout`, `#locations`, `#notifications`,
  `#empty-state`, `.loc-card`, `#loc-form`, `#dev-form`, `#devices-list`,
  `#history-list`, `#reg-form`, `#login-form`, `#sim-*`, …) so existing JS and the
  e2e test keep working.
- **Shared app nav** (`.app-nav`) reused across dashboard/setup/history with a frosted
  background, mobile hamburger menu, and a `Simulator` quick link. Mobile-menu log out
  is wired via `.js-logout` (added a global handler in `public/js/app.js`).
- **Branch**: this redesign lives on branch **`Mamzy`** (tracking `origin/Mamzy`).
  Commit `7776abc` = landing + design system; app-view port is uncommitted as of the
  last session and should be committed + pushed.

---

## CURRENT STATE / WHERE TO STOP

**We are at: [ MVP COMPLETE + UI REDESIGNED + VERIFIED ]**

The full MVP is built, the whole UI is on the new blue & white Clearwave template, and
the automated Playwright demo test **passes end-to-end** on Windows (native node):
registration -> add "My Home" -> connect device -> simulator POWER OFF -> dashboard
shows POWER UNAVAILABLE (red status) + "Power has gone off" notification -> simulator POWER ON ->
dashboard shows POWER AVAILABLE (green status) + "Power has been restored" notification -> history
shows the full ON/OFF timeline.

Next time you open this project, **continue from here:**

1. Commit the app-view port on `Mamzy` (see `git status`) and push with a long timeout:
   `git push origin Mamzy`.
2. Run the app: `npm run dev`, then open `http://localhost:3000`.
3. Manually walk through the demo (see "Demo Scenario" below) to review the new UI.
4. Run the automated test any time with: `npx playwright test` (Chromium already installed).
5. Then decide which MVP item from the "Next Up" list below to build.

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
   **POWER UNAVAILABLE** (red) and show the notification *"Power has gone off at My Home."*
8. In the simulator click **POWER ON**.
9. Dashboard returns to **POWER AVAILABLE** (green) with *"Power has been restored at My Home."*
10. Open **History** to see the complete ON/OFF timeline.

---

## NEXT UP (TODO / BACKLOG)

- [x] Manual browser walkthrough of the full demo (login -> see My Home -> simulator OFF -> dashboard red -> notification -> ON -> green -> history).  [AUTOMATED via `npx playwright test` — passed]
- [x] Full UI redesign to the TemplateMo 622 Clearwave template (blue & white) — landing + all app views + simulator.
- [ ] Manual visual review/polish of the new UI (styling on mobile-sized screens).
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
