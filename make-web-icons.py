"""Generate this site's icon assets from the app's launcher master.

Usage: /usr/bin/python3 make-web-icons.py   (needs Pillow)

Source of truth is the app repo's master, so the site can never drift from the
launcher icon:
    ../tourneysmith/scripts/assets/tourneysmith-icon-source.png

Two things here are deliberate and easy to get wrong by hand:

1. The master carries wide white margins for Android's adaptive-icon safe zone.
   A favicon that keeps them renders the mark unreadably small, so the web
   assets are cropped to the ink first.
2. Alpha is derived from each pixel's distance from white and the colour is then
   un-premultiplied, rather than colour-keying white out. A hard key leaves
   white fringing on every anti-aliased edge of the letterforms.

apple-touch-icon and og-image stay opaque on purpose: iOS renders alpha in a
home-screen tile as black, and social platforms do the same to OpenGraph images.
"""
from PIL import Image, ImageChops
import os

SRC = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "tourneysmith", "scripts", "assets", "tourneysmith-icon-source.png",
)

src = Image.open(SRC).convert("RGB")
if src.size != (1024, 1024):
    raise SystemExit(f"{SRC} must be a square 1024x1024 master, got {src.size}")

mark = src.crop(ImageChops.difference(src, Image.new("RGB", src.size, (255,) * 3)).getbbox())


def white_to_alpha(img):
    img = img.convert("RGB")
    out = Image.new("RGBA", img.size)
    sp, dp = img.load(), out.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b = sp[x, y]
            a = 255 - min(r, g, b)
            if a == 0:
                dp[x, y] = (0, 0, 0, 0)
            else:
                k = 255 - a
                dp[x, y] = (
                    min(255, round((r - k) * 255 / a)),
                    min(255, round((g - k) * 255 / a)),
                    min(255, round((b - k) * 255 / a)),
                    a,
                )
    return out


rgba = white_to_alpha(mark)

# Header lockup keeps its natural ~2:1 aspect; a square canvas beside the
# wordmark would be mostly empty space.
h = 64
rgba.resize((round(rgba.width * h / rgba.height), h), Image.LANCZOS).save("brand-mark.png")

# Favicons must be square, so pad the transparent lockup rather than back it.
side = max(rgba.size)
square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
square.paste(rgba, ((side - rgba.width) // 2, (side - rgba.height) // 2))
square.resize((32, 32), Image.LANCZOS).save("favicon.png")

src.resize((180, 180), Image.LANCZOS).save("apple-touch-icon.png")

og = Image.new("RGB", (1200, 630), (255, 255, 255))
opaque = Image.new("RGB", (side, side), (255, 255, 255))
opaque.paste(square, (0, 0), square)
s = opaque.resize((420, 420), Image.LANCZOS)
og.paste(s, ((1200 - 420) // 2, (630 - 420) // 2))
og.save("og-image.png")

for f in ("brand-mark.png", "favicon.png", "apple-touch-icon.png", "og-image.png"):
    im = Image.open(f)
    print(f"  {f}: {im.size[0]}x{im.size[1]} {im.mode}")
