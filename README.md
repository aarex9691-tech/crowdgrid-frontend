# CrowdGrid web app

React 19 + Vite + Tailwind CSS 4. Mobile-first, works as an installable web app, and keeps the passbook available offline.

## Run it

Start the API first (`crowdgrid-backend`: `npm run dev` on port 5000), then:

```bash
npm install
npm run dev          # http://localhost:5173
```

Vite forwards `/api` and `/uploads` to `http://localhost:5000`, so there is no CORS setup. To use a different API address, set `API_TARGET` before starting Vite.

### Scanner on a phone

Phone browsers only allow the camera on HTTPS pages. With the phone on the same Wi-Fi as the laptop:

```bash
npm run dev:phone
```

Open the `https://<laptop-ip>:5173` address that Vite prints, accept the self-signed certificate warning, and log in as the volunteer (`9000000005` / `Crowd@123`). On the laptop itself, `http://localhost:5173` can use the webcam directly.

No camera? Every pass has a "Copy pass code" link. Paste the code into the scanner's text box.

## Screens

| Path | Who | What |
|---|---|---|
| `/` | everyone | Hero for the flagship yatra with countdown, other yatras, public events (RSVP), corporate invitations |
| `/yatra/:slug?tab=` | everyone | Service ribbon: lodging, food, transit, seva, SOS + lost & found |
| `/passbook` | logged in | All passes with QR codes, cached for offline use |
| `/corporate/:slug` | logged in | Access code, then session checklist, then badge |
| `/scan` | staff | Camera QR scanner with green / red result |
| `/control` | Authority, Super Admin | Occupancy by sector, SOS queue, NGO verification, seva approvals |
| `/ngo` | NGO admin | Bed inventory, meal quotas, check-ins, seva approvals |
| `/account` | logged in | Bookings (cancel), register an NGO |

Role checks in the UI only hide screens. The API enforces every permission again.

## Design

- Colours: Godavari indigo `#1B2A4A`, marigold `#F2A900` for actions, kumkum red `#C8102E` reserved for SOS, tulsi green `#1E7F4F` for available or valid.
- Type: Mukta (Latin + Devanagari, ready for Hindi and Marathi) and Yatra One for the wordmark and hero. Both are self-hosted, so they work offline.
- Accessibility: 48 px minimum tap targets, visible focus rings, reduced motion respected, high-contrast text.

## Offline passbook

`src/lib/passCache.js` stores the last pass list in `localStorage`, and QR images are drawn on the device. `public/sw.js` (registered in production builds) caches the app shell, so `/passbook` opens without a network. To try it: `npm run build && npm run preview`, open the passbook once, then switch the browser to offline.
