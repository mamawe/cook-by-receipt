#!/usr/bin/env python3
"""Generate cook by Receipt branded assets: OG image, app icons, favicon."""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, "public")
os.makedirs(PUB, exist_ok=True)

FONT_DIR = "/System/Library/Fonts/Supplemental"
F_REG = os.path.join(FONT_DIR, "Arial.ttf")
F_BOLD = os.path.join(FONT_DIR, "Arial Bold.ttf")
F_BLACK = os.path.join(FONT_DIR, "Arial Black.ttf")

EMERALD = (15, 118, 110)        # #0f766e
EMERALD_DARK = (17, 94, 89)     # #115e59
WHITE = (255, 255, 255)
TEAL100 = (204, 251, 241)       # #ccfbf1
EMERALD_A = EMERALD + (255,)


def vgrad(w, h, top, bottom):
    img = Image.new("RGB", (w, h))
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / (h - 1)
        c = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        d.line([(0, y), (w, y)], fill=c)
    return img


def center_text(d, cx, cy, text, font, fill):
    bbox = d.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    d.text((cx - w / 2 - bbox[0], cy - h / 2 - bbox[1]), text, font=font, fill=fill)


# ---------------------------------------------------------------------------
# OG image 1200 x 630
# ---------------------------------------------------------------------------
W, H = 1200, 630
og = vgrad(W, H, EMERALD, EMERALD_DARK)
d = ImageDraw.Draw(og)

M = 90
badge_cx, badge_cy, br = M + 105, M + 105, 105
d.ellipse([badge_cx - br, badge_cy - br, badge_cx + br, badge_cy + br], fill=WHITE)
fc_font = ImageFont.truetype(F_BLACK, 150)
center_text(d, badge_cx, badge_cy + 4, "CR", fc_font, EMERALD)

word_font = ImageFont.truetype(F_BLACK, 96)
sub_font = ImageFont.truetype(F_REG, 38)
word_y = badge_cy - 52
d.text((M + 250, word_y), "cook by Receipt", font=word_font, fill=WHITE)
d.text((M + 252, word_y + 104), "Smart Pantry & Zero-Waste Meal Planner", font=sub_font, fill=TEAL100)

# ingredient chips row
chips = ["Tomato", "Chicken", "Spinach", "Rice", "Eggs"]
chip_font = ImageFont.truetype(F_BOLD, 30)
cx = M
cy = 470
pad_x = 26
for label in chips:
    bb = d.textbbox((0, 0), label, font=chip_font)
    tw = bb[2] - bb[0]
    cw = tw + pad_x * 2
    d.rounded_rectangle([cx, cy, cx + cw, cy + 56], radius=28, outline=TEAL100, width=2)
    d.text((cx + pad_x, cy + 14), label, font=chip_font, fill=WHITE)
    cx += cw + 18

d.text((W - M - 300, H - 70), "AI-powered zero-waste cooking", font=sub_font, fill=TEAL100)
og.save(os.path.join(PUB, "og-image.png"))
print("wrote og-image.png")

# ---------------------------------------------------------------------------
# App icons 512 / 192
# ---------------------------------------------------------------------------
S = 512
icon = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(icon)
d.rounded_rectangle([0, 0, S - 1, S - 1], radius=110, fill=EMERALD_A)
fc = ImageFont.truetype(F_BLACK, 250)
center_text(d, S / 2, S / 2 + 6, "CR", fc, WHITE + (255,))
icon.save(os.path.join(PUB, "icon-512.png"))
icon.resize((192, 192)).save(os.path.join(PUB, "icon-192.png"))
print("wrote icon-512.png + icon-192.png")

# ---------------------------------------------------------------------------
# Favicon
# ---------------------------------------------------------------------------
icon.save(os.path.join(PUB, "favicon.ico"),
          sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
print("wrote favicon.ico")
