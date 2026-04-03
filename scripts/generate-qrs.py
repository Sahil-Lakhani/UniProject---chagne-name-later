"""
generate-qrs.py does this One-time local script to generate QR code PNGs for attendees.

Usage:
    pip install -r requirements.txt
    python generate-qrs.py

Output:  ../output/{row}_{name}.png
Each PNG contains the signed token QR code with the attendee's name printed below.

Token format: "ROW:{row}:{HMAC-SHA256(str(row), SECRET)}"
and also were making this hard codded for my row so later add the files sheet
This must match the format in src/lib/qr.js exactly.
"""

import hmac
import hashlib
import os

import qrcode
from PIL import Image, ImageDraw, ImageFont


#change it later coz its hardcoded and use the uni one 
SECRET = "c1609776f2ef33807d974013fc06754c79972411f0de86cad1886ab8d825b133"
SPREADSHEET_ID = "1feNGZOlKBdtETu5AlkKzXYtivHcnG-K1oeVnl9xwpi8"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "output")

ATTENDEES = [
    {"row": 17, "name": "Mohammed Sahil Lakhani"},
    # Add more attendees 
    # {"row": 18, "name": "Jane Doe"},
    # {"row": 19, "name": "John Smith"},
]

def generate_token(row: int) -> str:
    """
    Creates a signed token for the given row number.
    Must match the format in src/lib/qr.js → generateToken().

    Example (row 17):(here thats my row number in the sheet)
        token = generate_token(17)
        print(token)
        # "ROW:17:a3c9f2..." (64-char hex HMAC suffix)
    """
    mac = hmac.new(SECRET.encode(), str(row).encode(), hashlib.sha256).hexdigest()
    return f"ROW:{row}:{mac}"


def generate_qr_png(row: int, name: str, output_path: str) -> None:
    """
    generates a qr code PNG for the given attendee and saves it to output_path. name is printed as a text label below the QR code.
    """
    token = generate_token(row)

    # Create QR code image
    qr = qrcode.QRCode(
        version=None,          # auto-size
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

    #NAME
    bbox = draw.textbbox((0, 0), name, font=font)
    text_width = bbox[2] - bbox[0]
    text_x = (qr_width - text_width) // 2
    text_y = qr_height + (label_height - (bbox[3] - bbox[1])) // 2
    draw.text((text_x, text_y), name, fill="black", font=font)

    canvas.save(output_path)

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    for attendee in ATTENDEES:
        row = attendee["row"]
        name = attendee["name"]

        safe_name = name.replace(" ", "_").replace("/", "-")
        filename = f"{row}_{safe_name}.png"
        output_path = os.path.join(OUTPUT_DIR, filename)

        generate_qr_png(row, name, output_path)
        print(f"Generated QR for row {row} → {name}")
        print(f"  Token : {generate_token(row)}")
        print(f"  Saved : {output_path}")
        print()

    print(f"Done. {len(ATTENDEES)} QR code(s) written to {os.path.abspath(OUTPUT_DIR)}/")




if __name__ == "__main__":
    main()