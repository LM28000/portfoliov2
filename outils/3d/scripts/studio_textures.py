"""Textures de l'immeuble « À vendre » et du studio témoin -> 3d/assets/studio/gen/
panneau À VENDRE, plaque de porte, carnet des amis (2 pages), annonces imprimées annotées."""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "studio", "gen"); os.makedirs(OUT, exist_ok=True)
SC = os.path.join(ROOT, "assets", "scenes")
HN = "/System/Library/Fonts/HelveticaNeue.ttc"; SUP = "/System/Library/Fonts/Supplemental/"
def F(s, i=0): return ImageFont.truetype(HN, s, index=i)
def HAND(s): return ImageFont.truetype(SUP + "Bradley Hand Bold.ttf", s)
BOLD, MED = 1, 10
RED, INK, NAVY = (200, 30, 36), (24, 26, 30), (31, 48, 74)

# panneau d'agent immobilier accroché au balcon (2 x 1 m)
W, H = 2000, 1000
p = Image.new("RGB", (W, H), (250, 250, 247)); d = ImageDraw.Draw(p)
d.rectangle((0, 0, W, 330), fill=RED)
t = "À VENDRE"; f = F(260, BOLD); w = d.textlength(t, font=f); d.text(((W - w) / 2, 30), t, font=f, fill=(255, 255, 255))
t = "Studio 18 m² · meublé · vue sur le port"; f = F(96, MED); w = d.textlength(t, font=f); d.text(((W - w) / 2, 390), t, font=f, fill=INK)
t = "9,4 % par an sur 15 ans"; f = F(150, BOLD); w = d.textlength(t, font=f); d.text(((W - w) / 2, 540), t, font=f, fill=(24, 112, 63))
d.rectangle((0, 800, W, H), fill=NAVY)
t = "Visite libre · 1er étage  ·  insula.du-cray.eu"; f = F(80, MED); w = d.textlength(t, font=f); d.text(((W - w) / 2, 850), t, font=f, fill=(255, 255, 255))
d.rectangle((8, 8, W - 8, H - 8), outline=(180, 180, 175), width=6)
p.save(os.path.join(OUT, "panneau_a_vendre.png"))

# plaque de porte en laiton
W, H = 1200, 600
pl = Image.new("RGB", (W, H), (176, 136, 64)); d = ImageDraw.Draw(pl)
for i in range(0, H, 3):
    d.line((0, i, W, i), fill=(184 + (i * 7) % 12, 143 + (i * 5) % 10, 70))
d.rectangle((20, 20, W - 20, H - 20), outline=(120, 88, 36), width=8)
for t, y, s in (("Studio témoin", 90, 120), ("1er étage · entrée libre", 300, 76), ("Insula", 430, 70)):
    f = F(s, BOLD if y == 90 else MED); w = d.textlength(t, font=f); d.text(((W - w) / 2, y), t, font=f, fill=(58, 40, 14))
pl.save(os.path.join(OUT, "plaque.png"))

# carnet des amis : deux pages manuscrites
def page(lines, title):
    W, H = 1100, 1500
    pg = Image.new("RGB", (W, H), (247, 242, 228)); d = ImageDraw.Draw(pg)
    for y in range(180, H - 60, 62):
        d.line((70, y, W - 50, y), fill=(178, 200, 222), width=2)
    d.line((120, 0, 120, H), fill=(226, 150, 150), width=3)
    d.text((140, 60), title, font=HAND(76), fill=(30, 52, 110))
    y = 128
    for txt, col, sz in lines:
        if txt:
            d.text((140, y + (62 - sz) - 4), txt, font=HAND(sz), fill=col)
        y += 62
    return pg.filter(ImageFilter.GaussianBlur(0.4))
BLUE, GRN, RD, PEN = (30, 52, 110), (20, 110, 60), (170, 30, 30), (40, 40, 48)
gauche = page([
    ("Ce qu'on cherche (tous les 3)", BLUE, 50),
    ("- un studio ou un T2, meublé", PEN, 46),
    ("- près d'une fac ou d'une gare", PEN, 46),
    ("- moins de 80 k€ tout compris", PEN, 46),
    ("- rendement > 5 % sur 15 ans", PEN, 46),
    ("- la banque doit dire oui !", PEN, 46),
    ("", PEN, 46),
    ("Villes à creuser", BLUE, 50),
    ("Cherbourg, Brest, Saint-Nazaire", PEN, 46),
    ("Rennes trop cher pour nous :(", RD, 46),
    ("Tours, Chartres : non", RD, 46),
    ("", PEN, 46),
    ("On en reparle dimanche", BLUE, 46),
    ("(apporter les simulations)", PEN, 42),
], "Notre projet")
droite = page([
    ("Saint-Nazaire · Gavy Océanis", BLUE, 50),
    ("18 m² · 62 k€ · 9,4 %", GRN, 48),
    ("visité : ok   offre ?", PEN, 46),
    ("A : on fonce   C : bruit ?", PEN, 44),
    ("", PEN, 46),
    ("Saint-Nazaire · Trébale", BLUE, 50),
    ("16 m² · 55 k€ · 8,3 %", GRN, 48),
    ("à voir samedi", PEN, 46),
    ("", PEN, 46),
    ("Brest · Menez Paul", BLUE, 50),
    ("20 m² · 75 k€ · 7 %", GRN, 48),
    ("trop loin pour visiter ?", RD, 44),
    ("", PEN, 46),
    ("On vote : Gavy Océanis !", RD, 50),
], "Les biens qu'on suit")
gauche.save(os.path.join(OUT, "carnet_gauche.png")); droite.save(os.path.join(OUT, "carnet_droite.png"))

# annonces imprimées, annotées (surligneur, notes)
for i in range(3):
    a = Image.open(os.path.join(SC, f"affiche_{i}.png")).convert("RGBA")
    lay = Image.new("RGBA", a.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    d.rectangle((0, 0, a.width, 92), fill=(250, 249, 245, 255)); d.text((32, 30), "Insula · annonce relevée le 12/11", font=F(30, MED), fill=(31, 48, 74, 255))
    if i == 0:
        d.rounded_rectangle((24, 586, 330, 700), 30, fill=(255, 235, 60, 110))
        d.text((360, 610), "celui-là !", font=HAND(54), fill=(190, 30, 30, 255))
    elif i == 1:
        d.text((300, 640), "à visiter", font=HAND(48), fill=(30, 52, 110, 255))
    else:
        d.line((30, 600, 330, 690), fill=(190, 30, 30, 220), width=8); d.text((330, 620), "bof", font=HAND(54), fill=(190, 30, 30, 255))
    Image.alpha_composite(a, lay).convert("RGB").save(os.path.join(OUT, f"annonce_{i}.png"))
print(sorted(os.listdir(OUT)))
