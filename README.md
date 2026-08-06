# PowerPulse — IoT Electricity Monitoring MVP

PowerPulse lets a user remotely know whether electricity is currently available at a
registered location (home, pharmacy, shop, etc.). A small IoT device (simulated in this
MVP) detects power changes and reports them to the backend, which stores every ON/OFF
event and shows the live status on a web dashboard.

This is a **Node.js + Express + SQLite** app with a **plain HTML/CSS/JS** frontend and a
**Playwright** end-to-end test.

---

## Requirements

- **Node.js 18 or newer** (free download from nodejs.org)
- No database server needed — SQLite is bundled (runs in-process via `sql.js`)
- No WSL / Docker required — works on **Windows, macOS and Linux**

---

## Setup & Run

```bash
npm install
npm run dev
```

Then open your browser:

- **Web dashboard:** http://localhost:3000
- **IoT Simulator:** http://localhost:3000/simulator/simulator.html

> **Windows note:** run these commands in PowerShell, Command Prompt, or any terminal.
> There is no WSL requirement.

---

## Quick Demo (2 minutes)

1. Open http://localhost:3000 → click **Get Started** → create an account.
2. On the dashboard click **Setup**.
3. Add a location named **My Home**.
4. Connect a device using the code **PP-DEMO-0001**.
5. Open the **IoT Simulator** in a new tab, set the same device code.
6. Click **POWER OFF** → the dashboard changes to **POWER UNAVAILABLE** (red status)
   and shows the notification *"Power has gone off at My Home."*
7. Click **POWER ON** → the dashboard returns to **POWER AVAILABLE** (green status).
8. Open **History** to see the complete ON/OFF timeline.

---

## Running the automated test (Playwright)

```bash
npm install
npx playwright install chromium   # one-time, downloads the test browser
npx playwright test
```

This drives a real browser through the full demo scenario (register → add location →
connect device → simulator OFF/ON → dashboard + notification + history).

> **Windows note:** if `npx playwright install chromium` reports missing system
> libraries, install Playwright's dependencies with:
> `npx playwright install --with-deps`

---

## Project structure

```
PowerPulse/
├─ src/                 # Backend (Express + SQLite)
│  ├─ server.js         # App entry point
│  ├─ routes/           # auth, locations, devices, notifications
│  ├─ services/         # power logic + notification system
│  ├─ db/               # SQLite database setup
│  └─ middleware/       # JWT auth
├─ public/              # Frontend (landing, login, register, dashboard, history, setup)
├─ simulator/           # IoT device simulator (POWER ON / OFF)
├─ e2e/                 # Playwright test
└─ data/                # SQLite database file (created at runtime, gitignored)
```

---

## Main API endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/register` | Create an account |
| POST | `/auth/login` | Log in (returns a JWT) |
| GET/POST | `/locations` | List / create locations |
| GET | `/locations/:id` | One location |
| GET | `/locations/:id/status` | Current power status |
| GET | `/locations/:id/history` | ON/OFF event history |
| POST | `/devices` | Register a device (auth required) |
| POST | `/devices/status` | IoT device reports power state (device code = identity) |
| GET | `/notifications` | In-app notifications |

---

## Notes for developers

- The database file is `data/powerpulse.db` and is **created automatically** on first
  run. Delete it to reset all data.
- The notification system is separated from the power logic, so future channels
  (email, SMS, push, WhatsApp) can be added without touching the core event code.
- The dashboard currently uses polling; the code is structured so WebSockets can be
  added later.
- The IoT endpoint (`POST /devices/status`) authenticates with a **device code**, so a
  real ESP32-based device can replace the simulator without backend changes.
- See `PROGRESS.md` for the project tracker and full demo walkthrough.
