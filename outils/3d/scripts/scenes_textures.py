"""Textures des 4 scènes (round 14) à partir des vraies captures d'Insula -> 3d/assets/scenes/"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "scenes"); os.makedirs(OUT, exist_ok=True)
INSULA = os.environ.get("INSULA_DIR", os.path.expanduser("~/immobilier-tool"))  # dépôt d'Insula (captures de son README)
APP = os.path.join(INSULA, "docs", "images"); VID = os.path.join(ROOT, "video")
SITE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.realpath(__file__))))), "assets")
HN = "/System/Library/Fonts/HelveticaNeue.ttc"
def F(size, idx=0):
    return ImageFont.truetype(HN, size, index=idx)
BOLD, MED = 1, 10

# écrans
Image.open(os.path.join(APP, "telephone.jpg")).convert("RGB").save(os.path.join(OUT, "ecran_telephone.png"))
Image.open(os.path.join(APP, "ordinateur.jpg")).convert("RGB").resize((1920, 1200), Image.LANCZOS).save(os.path.join(OUT, "ecran_ordinateur.png"))
Image.open(os.path.join(SITE, "demo-poster.jpg")).convert("RGB").save(os.path.join(OUT, "ecran_cine.png"))
# fiche du bien (aimantée sur le frigo) : le panneau de gauche de la fiche
p3 = Image.open(os.path.join(VID, "p3.png")).convert("RGB")
fiche = p3.crop((12, 68, 448, 800)); bg = Image.new("RGB", (fiche.width + 40, fiche.height + 40), (250, 250, 248)); bg.paste(fiche, (20, 20))
bg.save(os.path.join(OUT, "fiche.png"))

# affichettes de vitrine : une par annonce de Saint-Nazaire (capture p2)
p2 = Image.open(os.path.join(VID, "p2.png")).convert("RGB")
ROWS = [(312, "62 k€ · 18 m²", "Gavy Océanis", "9,4 %", "+5 €"), (398, "55 k€ · 16 m²", "Trébale", "8,3 %", "+1 €"),
        (484, "64 k€ · 20 m²", "Ville Port", "8,0 %", "−29 €"), (571, "50 k€ · 14 m²", "Hôtel de ville", "7,2 %", "−5 €"),
        (657, "66 k€ · 17 m²", "Hyper Centre", "6,9 %", "−57 €")]
NAVY, GREEN = (31, 48, 74), (24, 112, 63)
for i, (y, prix, q, r, cf) in enumerate(ROWS):
    W, H = 620, 877
    a = Image.new("RGB", (W, H), (250, 249, 245)); d = ImageDraw.Draw(a)
    d.rectangle((0, 0, W, 92), fill=NAVY)
    d.text((32, 24), "À VENDRE · STUDIO", font=F(38, BOLD), fill=(255, 255, 255))
    ph = p2.crop((32, y + 19, 103, y + 66)).resize((W - 64, 330), Image.BICUBIC).filter(ImageFilter.GaussianBlur(1.2))
    a.paste(ph, (32, 118))
    yy = 118 + ph.height + 26
    d.text((32, yy), prix, font=F(50, BOLD), fill=(20, 24, 30))
    d.text((32, yy + 66), f"Saint-Nazaire · {q}", font=F(30), fill=(80, 88, 98))
    d.text((32, yy + 112), r, font=F(92, BOLD), fill=GREEN)
    d.text((32, yy + 218), "par an sur 15 ans, revente comprise", font=F(24), fill=(80, 88, 98))
    d.text((32, yy + 256), f"cash-flow {cf} par mois", font=F(26, MED), fill=(40, 44, 50))
    d.line((32, H - 64, W - 32, H - 64), fill=(210, 210, 205), width=2)
    d.text((32, H - 50), "insula.du-cray.eu", font=F(24, MED), fill=NAVY)
    a.save(os.path.join(OUT, f"affiche_{i}.png"))

# enseigne et vitrophanie
W, H = 2400, 420
e = Image.new("RGB", (W, H), (22, 34, 52)); d = ImageDraw.Draw(e)
d.rectangle((14, 14, W - 14, H - 14), outline=(201, 160, 82), width=6)
t = "AGENCE INSULA"; f = F(190, BOLD); w = d.textlength(t, font=f); d.text(((W - w) / 2, 52), t, font=f, fill=(238, 206, 140))
t = "sans commission · faite maison"; f = F(74); w = d.textlength(t, font=f); d.text(((W - w) / 2, 282), t, font=f, fill=(214, 196, 160))
e.save(os.path.join(OUT, "enseigne.png"))
v = Image.new("RGBA", (1200, 300), (0, 0, 0, 0)); d = ImageDraw.Draw(v)
d.text((20, 40), "Entrée libre", font=F(96, BOLD), fill=(255, 255, 255, 235))
d.text((20, 170), "22 villes · les annonces du soir", font=F(56), fill=(255, 255, 255, 220))
v.save(os.path.join(OUT, "vitrophanie.png"))
# porte-clés
k = Image.new("RGB", (400, 200), (31, 48, 74)); d = ImageDraw.Draw(k)
t = "INSULA"; f = F(96, BOLD); w = d.textlength(t, font=f); d.text(((400 - w) / 2, 45), t, font=f, fill=(255, 255, 255))
k.save(os.path.join(OUT, "porte_cles.png"))
print("ok", sorted(os.listdir(OUT)))
