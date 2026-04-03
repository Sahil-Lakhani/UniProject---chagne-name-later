"""
generate-qrs.py — Generates QR code PNGs for every attendee in the Google Sheet.

Usage:
    pip install -r requirements.txt
    python generate-qrs.py

Authentication:
    Requires a Google service account JSON key file.
    Set SERVICE_ACCOUNT_FILE in .env (path to the JSON key), OR place it at
    scripts/service_account.json next to this file.

    The service account must have at least Viewer access to the spreadsheet
    (share the sheet with the service account email).

Output: ../output/{row}_{name}.png
Token format: "ROW:{row}:{HMAC-SHA256(str(row), SECRET)}"
"""

import hmac
import hashlib
import os
import sys

from dotenv import load_dotenv
import gspread
from google.oauth2.service_account import Credentials
import qrcode
from PIL import Image, ImageDraw, ImageFont

# ── Config ────────────────────────────────────────────────────────────────────

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

SECRET         = os.environ['QR_SECRET']
SPREADSHEET_ID = os.environ['SPREADSHEET_ID']
SHEET_NAME     = os.environ.get('SHEET_NAME', 'testSheet')

# Path to the service account JSON — check .env first, then default location
_default_sa = os.path.join(os.path.dirname(__file__), 'service_account.json')
SERVICE_ACCOUNT_FILE = os.environ.get('SERVICE_ACCOUNT_FILE', _default_sa)

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'output')

# Column C (0-based index 2) holds the attendee name — must match Code.gs
NAME_COL_INDEX = 2   # column C

# ── Sheets helpers ────────────────────────────────────────────────────────────

def fetch_attendees() -> list[dict]:
    """
    Reads the Google Sheet and returns a list of {row, name} dicts.
    Row numbers are 1-based (matching the sheet), starting at 2 (row 1 = header).
    Rows with an empty name column are skipped.
    """
    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        print(f"ERROR: Service account file not found at: {SERVICE_ACCOUNT_FILE}")
        print("  → Create a service account at console.cloud.google.com")
        print("  → Download the JSON key and set SERVICE_ACCOUNT_FILE in .env")
        sys.exit(1)

    scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly']
    creds  = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=scopes)
    client = gspread.authorize(creds)

    sheet      = client.open_by_key(SPREADSHEET_ID).worksheet(SHEET_NAME)
    all_values = sheet.get_all_values()   # list of rows (each row is a list of strings)

    attendees = []
    for i, row in enumerate(all_values[1:], start=2):  # skip header, row index starts at 2
        name = row[NAME_COL_INDEX].strip() if len(row) > NAME_COL_INDEX else ''
        if not name:
            continue
        attendees.append({'row': i, 'name': name})

    return attendees

# ── QR helpers ────────────────────────────────────────────────────────────────

def generate_token(row: int) -> str:
    """Creates a signed token matching the format expected by Code.gs."""
    mac = hmac.new(SECRET.encode(), str(row).encode(), hashlib.sha256).hexdigest()
    return f"ROW:{row}:{mac}"


def generate_qr_png(row: int, name: str, output_path: str) -> None:
    """Generates a QR code PNG with the attendee name printed below."""
    token = generate_token(row)

    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(token)
    qr.make(fit=True)

    qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGB")
    qr_width, qr_height = qr_img.size

    label_height = 50
    canvas = Image.new("RGB", (qr_width, qr_height + label_height), "white")
    canvas.paste(qr_img, (0, 0))

    draw = ImageDraw.Draw(canvas)
    try:
        font = ImageFont.truetype("arial.ttf", 18)
    except (IOError, OSError):
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
        except (IOError, OSError):
            font = ImageFont.load_default()

    bbox      = draw.textbbox((0, 0), name, font=font)
    text_w    = bbox[2] - bbox[0]
    text_x    = (qr_width - text_w) // 2
    text_y    = qr_height + (label_height - (bbox[3] - bbox[1])) // 2
    draw.text((text_x, text_y), name, fill="black", font=font)

    canvas.save(output_path)

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print(f"Fetching attendees from sheet '{SHEET_NAME}'…")
    attendees = fetch_attendees()

    if not attendees:
        print("No attendees found (all name cells in column C are empty).")
        return

    print(f"Found {len(attendees)} attendee(s). Generating QR codes…\n")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    for attendee in attendees:
        row  = attendee['row']
        name = attendee['name']

        safe_name   = name.replace(" ", "_").replace("/", "-")
        filename    = f"{row}_{safe_name}.png"
        output_path = os.path.join(OUTPUT_DIR, filename)

        generate_qr_png(row, name, output_path)
        print(f"  Row {row:>4} │ {name}")
        print(f"           Token : {generate_token(row)}")
        print(f"           Saved : {output_path}")
        print()

    print(f"Done. {len(attendees)} QR code(s) written to {os.path.abspath(OUTPUT_DIR)}/")


if __name__ == "__main__":
    main()
