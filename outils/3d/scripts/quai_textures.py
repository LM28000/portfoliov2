"""Textures du quai d'Insula : dalles de granit (esplanade) et moellons (mur de quai).
Usage : python3 scripts/quai_textures.py  -> assets/quai_vie/gen/{dalles,moellons}.png"""
import os, random
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "quai_vie", "gen"); os.makedirs(OUT, exist_ok=True)
N = 512


def grain(im, amp, seed):
    r = random.Random(seed); px = im.load()
    for y in range(N):
        for x in range(N):
            d = r.randint(-amp, amp); c = px[x, y]; px[x, y] = tuple(max(0, min(255, v + d)) for v in c)
    return im


def pierre(seed, base, var):
    r = random.Random(seed); g = base + r.randint(-var, var); return (g + r.randint(-3, 3), g + r.randint(-3, 2), g - r.randint(0, 5))


def dalles():
    """une tuile de 2 m : rangées de 40 cm, dalles de 40 à 70 cm, joints décalés"""
    im = Image.new("RGB", (N, N), (70, 68, 64)); d = ImageDraw.Draw(im); r = random.Random(3)
    rows = 5; rh = N / rows
    for j in range(rows):
        x = -r.uniform(0, 80); k = 0
        while x < N:
            w = r.choice((102, 128, 154, 179)); c = pierre(j * 31 + k, 128, 14)
            for dx in (-N, 0, N):     # tuile raccordable
                d.rectangle((x + dx + 2, j * rh + 2, x + dx + w - 2, (j + 1) * rh - 2), fill=c)
            x += w; k += 1
    return grain(im.filter(ImageFilter.GaussianBlur(0.6)), 9, 5)


def moellons():
    """une tuile de 2 m : assises de 25 à 35 cm en granit"""
    im = Image.new("RGB", (N, N), (58, 56, 53)); d = ImageDraw.Draw(im); r = random.Random(8)
    y = 0; j = 0
    hs = [72, 80, 64, 88, 72, 80, 56]
    for hgt in hs:
        x = -r.uniform(0, 60); k = 0
        while x < N:
            w = r.uniform(90, 170); c = pierre(j * 17 + k, 104, 16)
            for dx in (-N, 0, N):
                d.rounded_rectangle((x + dx + 3, y + 3, x + dx + w - 3, y + hgt - 3), radius=6, fill=c)
            x += w; k += 1
        y += hgt; j += 1
    return grain(im.filter(ImageFilter.GaussianBlur(0.8)), 11, 9)


dalles().save(os.path.join(OUT, "dalles.png")); moellons().save(os.path.join(OUT, "moellons.png"))
print("ok", OUT)
