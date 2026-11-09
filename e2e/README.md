# Automated tests for the November handover

This folder turns the handover doc's **39 manual test cases** into browser tests
(Playwright), and adds one command that runs **every** automated check in the doc.

Everything runs on the **test database** (`TEST_MONGO_URI`, name ending in `_test`).
The shared demo database is never touched, and nobody else's laptop is affected.

## One-time setup

Both repos side by side, as in the doc:

```
crowdgrid-backend/      <- has .env with TEST_MONGO_URI, SEED_PASSWORD, JWT_SECRET, QR_SECRET
crowdgrid-frontend/
  e2e/                  <- you are here
```

```powershell
cd crowdgrid-backend;  npm install
cd ../crowdgrid-frontend;  npm install
cd e2e;  npm run setup          # installs Playwright and its Chromium browser
```

## Run everything

```powershell
cd crowdgrid-frontend/e2e
npm run all
```

| Step | Command it runs | Passing looks like |
|---|---|---|
| Backend unit tests | `npm run test:unit` | "0 failed" |
| Route benchmark | `npm run bench:route` | exit 0 (same best cost in 3 scenarios) |
| Seed the test database | `npm run seed:test` | "Seed complete" |
| Flow tests | `npm run test:flows` | "All checks passed" |
| Concurrency tests | `npm run test:concurrency` | exit 0 (10 of 200 per night, 1 of 20 meal tokens) |
| Frontend lint | `npm run lint` | exit 0 |
| Frontend build | `npm run build` | exit 0 |
| Manual cases 1-39 | `npx playwright test` | see `results/manual-cases.md` |

The summary is written to `results/all-tests.md`.
`npm run all -- --no-db` runs only the steps that need no database; `npm run all -- --no-e2e` skips the browser.

## Run only the 39 manual cases

```powershell
npm test                         # all 39, headless (about 5 minutes)
npm run test:headed              # watch the browser do it
npx playwright test tests/02-lodging.spec.js   # one area (cases in an area build on each other)
npm run report                   # open the HTML report (screenshots, video and trace of any failure)
```

Before the first case the tests **seed the test database** and start their own backend on
port **5055** (pointing at the test database) and the website on **5174**. Your normal
`npm run dev` on 5000/5173 can keep running.

`results/manual-cases.md` (and `.csv`) is the doc's table with the **Result** column filled in:
PASS, FAIL (with the reason), or SKIPPED. Paste it into the doc or the group.

### Settings (optional, environment variables)

| Variable | Default | What it does |
|---|---|---|
| `CROWDGRID_BACKEND_DIR` | `../../crowdgrid-backend` | where the backend repo is |
| `E2E_API_PORT` / `E2E_WEB_PORT` | 5055 / 5174 | ports used by the test run |
| `E2E_SKIP_SEED=1` | off | do not re-seed before the run (faster re-runs) |
| `E2E_EXTERNAL_BACKEND=1` | off | use a backend you started yourself on `E2E_API_PORT` (it must use the test database); case 28 is then skipped |

## How each case is checked

| # | Area | Automated check |
|---|---|---|
| 1-4 | Sign-up | Real sign-up page: refused without a code, code shown on screen, wrong code refused, right code logs in as a pilgrim |
| 5 | Login | Each of the 7 demo accounts logs in on the login page and lands on its own home page |
| 6-7 | Language | Header picker: Hindi tabs, hint and buttons; Marathi stays after a refresh |
| 8-13 | Lodging | Fresh pilgrim books 5 beds at Panchavati Tent City - Block A tonight (tent and bed numbers, stay in the passbook); a 6th bed is refused; tomorrow shows 5 more free; 5 more booked for tomorrow; check-out picker stops at 7 nights (and the server refuses 8); Tapovan shows "Sold out" |
| 14 | Lodging | NGO admin's tent map: tonight's guests show only on tonight, tomorrow's only on tomorrow |
| 15 | Transport | E-Shuttle S1 pass for 3: "seats left" drops by exactly 3 after a reload |
| 16-17 | Food | Token for 4 (tomorrow's lunch, so the time of day never matters): one QR, plates left drop by 4; a second claim says "limit 1 per meal" |
| 18-20 | Payment | Ramkund Dharamshala, 2 beds x 2 nights: total = price x 4, "Please pay by"; fail@upi declined; test@okaxis paid, QR issued, stay in the passbook |
| 21 | Refund | A paid stay 4 days ahead (set up through the API) is cancelled from the passbook: "Refund (100%)" |
| 22 | QR | "Live QR · changes in Ns" and the QR picture changes within 30 s |
| 23-26 | Scanner | Volunteer's scanner, "Bus gate", code typed in the box (same text the camera reads): VALID; again: already used; the code from 2 minutes earlier: "more than a minute old: probably a screenshot"; after "Reset this QR", the old copy is rejected |
| 27-30 | Missing | Report with a real PNG photo shows on the bulletin; backend is stopped and started again and the photo still loads; a text file sent as a .jpg is refused by the server; logged out, no phone numbers are shown |
| 31-32 | SOS | Pilgrim taps SOS; it appears in the open control room without a reload; Acknowledge and Mark resolved each pop up on the pilgrim's screen |
| 33-36 | Route | Safest and shortest routes drawn; Dijkstra and A* agree; authority closes a lane on the route and the pilgrim's open map re-plans by itself; after 50 route requests the lane panel shows "N routed here recently" (the lane is reopened afterwards) |
| 37-39 | Security | Pilgrim on /control sees "isn't available for your account"; volunteer sees no booking or claim buttons; 5 wrong passwords lock a fresh test account (never a demo one) for 15 minutes |

Each area uses its **own fresh pilgrim account**, so runs do not depend on each other and
the demo pilgrims are left alone. The only demo accounts used are the staff ones
(authority, NGO admin, volunteer) and the 7 logins in case 5, always with the right password.

### Differences from doing it by hand

- **Case 25**: instead of waiting 2 real minutes, the test takes the QR text that was on the
  screen 2 minutes earlier (computed from the key on the phone, the same way the passbook draws it).
  The server sees exactly what an old screenshot would show it.
- **Cases 23-26** type the QR text into the scanner's "Camera not working?" box instead of
  pointing a camera at the screen. The server check is identical.
- **Case 21** buys the 4-days-ahead stay through the API to save time; the cancellation and the
  refund shown are done in the browser.
- **Case 36** sends the 50 route requests directly to the API instead of pressing refresh 50 times.

## Continuous integration

`.github/workflows/build.yml` has an `e2e` job. It runs only when the frontend repository has
`TEST_MONGO_URI` and `SEED_PASSWORD` secrets, and uploads the report as `e2e-report`.
The backend workflow's flow tests use the same test database: if both run at once they can
disturb each other, so re-run the failed one.

## If something goes wrong

- **"Something is already answering on http://localhost:5055"**: an old test backend is still
  running. Stop it (Task Manager / `kill`), or set `E2E_API_PORT`.
- **Backend did not start**: the last lines of `.state/backend.log` are printed; usually a
  missing `.env` value or Atlas not reachable from your network.
- **"Too many attempts from this network"**: the API allows 50 sign-in attempts per 15 minutes.
  The suite uses about 35 and restarts the backend halfway (case 28), which resets the count.
  Wait 15 minutes if you run single cases over and over with `E2E_EXTERNAL_BACKEND=1`.
