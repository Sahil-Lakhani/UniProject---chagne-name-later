# Design: Google Apps Script QR Check-In Backend

**Date:** 2026-04-03
**Status:** Approved

---

## Problem

The current `src/lib/sheets.js` calls the Google Sheets REST API v4 directly from the browser using an API key. API keys cannot authorize write operations — the Sheets API v4 requires OAuth 2.0 for writes. This means `markAsScanned()` fails in production. Additionally, `VITE_QR_SECRET` is baked into the browser JS bundle, exposing the HMAC secret to anyone who opens DevTools.

---

## Solution

Replace the REST API approach with a Google Apps Script (GAS) Web App that acts as a free, serverless backend. The React app sends the raw scanned token to the GAS URL; the GAS validates the HMAC, reads and writes the sheet, and returns JSON.

---

## Architecture

```
[Mobile Browser]                    [Google Apps Script Web App]
     │                                        │
     │  POST { token, mode }                  │
     ├───────────────────────────────────────>│
     │                                        │  1. Validate HMAC
     │                                        │  2. Read attendee row
     │                                        │  3. Check already scanned
     │                                        │  4. Write TRUE + timestamp
     │  JSON { success, name, ... }           │
     │<───────────────────────────────────────│
```

---

## Components

### `google-apps-script/Code.gs` (new)

The full backend. Deployed once as a GAS Web App (Execute as: Me, Access: Anyone).

- `doPost(e)` — entry point, parses `{ token, mode }`, returns `ContentService` JSON
- `validateHmac(rowNumber, providedMac)` — uses `Utilities.computeHmacSha256Signature()`, free built-in
- `getAttendee(sheet, rowNumber)` — reads columns C–Q for the given row
- `markAttendee(sheet, rowNumber, mode)` — checks scanned state, writes TRUE + ISO timestamp

**Secret storage:** `QR_SECRET` is stored as a GAS Script Property (Project Settings → Script Properties in the Apps Script editor). Never hardcoded in source. Safe to commit `Code.gs` to git.

**Column map (same as before):**
- N = conference_scanned, O = conference_scanned_at
- P = workshop_scanned, Q = workshop_scanned_at

**Response shapes:**
```json
{ "success": true, "name": "...", "workshopInterest": "..." }
{ "success": false, "alreadyScanned": true, "scannedAt": "..." }
{ "success": false, "error": "Invalid QR code." }
```

---

### `src/lib/sheets.js` (replaced)

Shrinks to ~20 lines. Single export: `markAsScanned(rawToken, mode)`.

- Reads `VITE_GAS_URL` from env
- POSTs `{ token: rawToken, mode }` with `Content-Type: text/plain` (avoids CORS preflight)
- Returns the JSON response directly
- Throws on HTTP error

`getAttendee()` and `getAllAttendees()` are removed — not needed by the scanner app.

---

### `src/lib/sheets.d.ts` (updated)

Signature change: `markAsScanned(rawToken: string, mode: 'conference' | 'workshop')`.

---

### `src/App.tsx` (updated)

- Remove `import { validateToken } from './lib/qr'`
- Remove the `validateToken(rawToken)` call and `if (!valid)` early return in `handleScan`
- Change `markAsScanned(rowNumber, mode)` → `markAsScanned(rawToken, mode)`
- All screen states, `ScanResult` interface, and UI remain unchanged

---

### `src/lib/qr.js` + `src/lib/qr.d.ts` (deleted)

HMAC logic moves entirely into the GAS backend. These files are no longer needed.

---

### `scripts/generate-qrs.py` (updated)

- Add `from dotenv import load_dotenv` + `load_dotenv()`
- Replace hardcoded `SECRET` and `SPREADSHEET_ID` with `os.environ['QR_SECRET']` and `os.environ['SPREADSHEET_ID']`
- No functional changes to QR generation logic

---

### `scripts/requirements.txt` (updated)

Add `python-dotenv`.

---

## Environment Variables

| Variable | Used by | Purpose |
|----------|---------|---------|
| `QR_SECRET` | Python script | HMAC secret for token generation |
| `SPREADSHEET_ID` | Python script | Google Sheet ID |
| `VITE_GAS_URL` | React app | GAS Web App endpoint |
| `VITE_SCANNER_PIN` | React app | PIN lock (unchanged) |

`VITE_SHEETS_API_KEY` and `VITE_QR_SECRET` are removed entirely.
`VITE_SPREADSHEET_ID` becomes `SPREADSHEET_ID` (no VITE_ prefix = not bundled into browser JS).

---

## Data Flow

1. Camera scans QR → raw string `"ROW:17:abc123..."`
2. `App.tsx` calls `markAsScanned("ROW:17:abc123...", "conference")`
3. `sheets.js` POSTs `{ token, mode }` to `VITE_GAS_URL`
4. GAS parses token, validates HMAC against Script Property secret
5. GAS reads row 17 columns N–Q
6. If already scanned → returns `{ success: false, alreadyScanned: true, scannedAt: "..." }`
7. If not scanned → writes `TRUE` + timestamp, returns `{ success: true, name: "...", workshopInterest: "..." }`
8. `App.tsx` sets result state → `ResultCard` renders

---

## Files Changed Summary

| File | Action |
|------|--------|
| `google-apps-script/Code.gs` | Add |
| `src/lib/sheets.js` | Replace |
| `src/lib/sheets.d.ts` | Update |
| `src/App.tsx` | Update |
| `src/lib/qr.js` | Delete |
| `src/lib/qr.d.ts` | Delete |
| `scripts/generate-qrs.py` | Update |
| `scripts/requirements.txt` | Update |
| `.env.example` | Update |
