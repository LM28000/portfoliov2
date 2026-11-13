"""Images posées sur les objets de la cabine : carte du parcours, pages du livre de bord, dos de la photo, message en bouteille."""
import os, math, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "cabine", "gen")
F = "/System/Library/Fonts/Supplemental/"
hand = lambda s: ImageFont.truetype(F + "Bradley Hand Bold.ttf", s)
note = lambda s: ImageFont.truetype("/System/Library/Fonts/Noteworthy.ttc", s)
serif = lambda s: ImageFont.truetype(F + "Georgia.ttf", s)
serifI = lambda s: ImageFont.truetype(F + "Georgia Italic.ttf", s)
random.seed(4)

def paper(w, h, base=(236, 224, 196), spots=True):
    im = Image.new("RGB", (w, h), base); d = ImageDraw.Draw(im)
    for _ in range(int(w * h / 900)):
        x, y = random.randrange(w), random.randrange(h); c = random.randint(-14, 8)
        d.point((x, y), fill=tuple(max(0, min(255, v + c)) for v in base))
    if spots:
        for _ in range(6):
            x, y, r = random.randrange(w), random.randrange(h), random.randint(30, 120)
            ov = Image.new("L", (w, h), 0); ImageDraw.Draw(ov).ellipse([x - r, y - r, x + r, y + r], fill=28); ov = ov.filter(ImageFilter.GaussianBlur(r / 2))
            im = Image.composite(Image.new("RGB", (w, h), (196, 170, 120)), im, ov)
    # bords assombris
    ov = Image.new("L", (w, h), 0); dd = ImageDraw.Draw(ov)
    for i in range(40): dd.rectangle([i, i, w - 1 - i, h - 1 - i], outline=int(70 * (1 - i / 40)))
    return Image.composite(Image.new("RGB", (w, h), (150, 120, 80)), im, ov.filter(ImageFilter.GaussianBlur(8)))

# 1. carte du parcours : légende à gauche, carte de l'Ouest à droite (2048 x 1400)
import textwrap
W, H = 2048, 1400; im = paper(W, H, (232, 222, 196)); d = ImageDraw.Draw(im)
ink, sea, land, red = (40, 52, 70), (176, 201, 206), (220, 204, 160), (160, 45, 30)
serifB = lambda sz: ImageFont.truetype(F + "Georgia Bold.ttf", sz)
MX0, MY0, MX1, MY1 = 860, 60, W - 60, H - 60
LON0, LON1 = -5.3, 2.9
k = math.cos(math.radians(47.5)); span_lat = (LON1 - LON0) * k * (MY1 - MY0) / (MX1 - MX0); LAT1 = 50.35; LAT0 = LAT1 - span_lat
def P(lon, lat): return (MX0 + (lon - LON0) / (LON1 - LON0) * (MX1 - MX0), MY0 + (LAT1 - lat) / (LAT1 - LAT0) * (MY1 - MY0))
mp = Image.new("RGB", (W, H), sea); md = ImageDraw.Draw(mp)
COTE = [(1.6, 50.6), (1.55, 50.2), (1.4, 50.05), (0.6, 49.85), (0.1, 49.55), (0.2, 49.42), (-0.2, 49.3), (-0.9, 49.37), (-1.15, 49.38), (-1.27, 49.7), (-1.62, 49.66), (-1.94, 49.72), (-1.85, 49.4), (-1.65, 49.1), (-1.57, 48.75), (-1.38, 48.63), (-1.85, 48.67), (-2.03, 48.64), (-2.3, 48.62), (-2.75, 48.55), (-3.05, 48.82), (-3.55, 48.73), (-3.95, 48.72), (-4.35, 48.68), (-4.77, 48.52), (-4.6, 48.33), (-4.3, 48.3), (-4.62, 48.18), (-4.3, 48.12), (-4.73, 48.03), (-4.35, 47.95), (-4.17, 47.8), (-3.85, 47.79), (-3.5, 47.7), (-3.2, 47.57), (-2.95, 47.55), (-2.75, 47.5), (-2.45, 47.48), (-2.55, 47.3), (-2.2, 47.27), (-2.1, 47.1), (-2.0, 46.98), (-2.25, 46.88), (-2.0, 46.7), (-1.8, 46.52), (-1.45, 46.35), (-1.17, 46.16), (-1.08, 45.95), (-1.2, 45.75), (-1.15, 45.4), (-1.25, 44.8), (-1.25, 44.0)]
pts = [P(*c) for c in COTE]
md.polygon(pts + [(W + 80, H + 80), (W + 80, -80)], fill=land)
for kk in range(1, 4): md.line([(x - 22 * kk, y) for x, y in pts], fill=(140, 170, 182), width=2)
md.line(pts, fill=ink, width=4)
md.line([P(-2.2, 47.27), P(-1.55, 47.22), P(-0.55, 47.4), P(0.25, 47.38), P(1.0, 47.6)], fill=(110, 150, 175), width=5)
for lon in range(-5, 3): md.line([P(lon, LAT0), P(lon, LAT1)], fill=(150, 150, 140), width=1)
for lat in range(45, 51): md.line([P(LON0, lat), P(LON1, lat)], fill=(150, 150, 140), width=1)
mask = Image.new("L", (W, H), 0); ImageDraw.Draw(mask).rectangle([MX0, MY0, MX1, MY1], fill=255)
im.paste(Image.blend(mp, im, 0.15), (0, 0), mask); d = ImageDraw.Draw(im)
d.rectangle([MX0, MY0, MX1, MY1], outline=ink, width=4); d.rectangle([MX0 - 10, MY0 - 10, MX1 + 10, MY1 + 10], outline=(150, 130, 100), width=2)
for nm, lon, lat in [("Brest", -4.49, 48.39), ("Rennes", -1.68, 48.11), ("Le Mans", 0.2, 48.0), ("Paris", 2.35, 48.6), ("La Rochelle · port d'Elba", -1.15, 46.16)]:
    x, y = P(lon, lat); d.ellipse([x - 6, y - 6, x + 6, y + 6], fill=ink); d.text((x + 12, y - 4), nm, font=serifI(30), fill=(80, 80, 70))
cx, cy, R = MX1 - 150, MY1 - 160, 110
for a in range(0, 360, 45):
    r = R if a % 90 == 0 else R * 0.6; ang = math.radians(a - 90)
    p1 = (cx + r * math.cos(ang), cy + r * math.sin(ang)); pl = (cx + 18 * math.cos(ang + 1.57), cy + 18 * math.sin(ang + 1.57)); pr = (cx + 18 * math.cos(ang - 1.57), cy + 18 * math.sin(ang - 1.57))
    d.polygon([p1, pl, (cx, cy)], fill=ink); d.polygon([p1, pr, (cx, cy)], fill=(200, 190, 160), outline=ink)
d.text((cx - 12, cy - R - 54), "N", font=serif(38), fill=ink)
def pastille(x, y, txt, r=34, fs=40):
    d.ellipse([x - r, y - r, x + r, y + r], fill=red, outline=(255, 245, 230), width=5); w_ = d.textlength(txt, font=serifB(fs)); d.text((x - w_ / 2, y - fs * 0.62), txt, font=serifB(fs), fill=(255, 250, 240))
STOPS = [("1", (-0.32, 47.77), "Précigné", (44, -70)), ("2", (-1.55, 47.22), "Nantes", (44, 6)), ("3", (2.29, 48.89), "Levallois", (-250, -84)), ("4", (-3.4, 46.25), "Insula", (44, -24)), ("5", (-4.4, 47.15), "Cap 2028", (44, -24))]
route = [s_[1] for s_ in STOPS]
for (a_, b_) in zip(route, route[1:]):
    (x1, y1), (x2, y2) = P(*a_), P(*b_); n = int(math.hypot(x2 - x1, y2 - y1) / 26)
    for i in range(0, n, 2): t1, t2 = i / n, (i + 1) / n; d.line([(x1 + (x2 - x1) * t1, y1 + (y2 - y1) * t1), (x1 + (x2 - x1) * t2, y1 + (y2 - y1) * t2)], fill=red, width=8)
for num, (lon, lat), name, (ox, oy) in STOPS:
    x, y = P(lon, lat); pastille(x, y, num); d.text((x + ox, y + oy), name, font=serifB(48), fill=red if num == "5" else ink)
# légende à gauche
d.text((60, 60), "Carte du parcours", font=serifI(78), fill=ink); d.text((64, 160), "Louis-Marie Perret du Cray", font=serif(34), fill=(70, 70, 62))
LG = [("1", "2020 – 2023 · Précigné", "Académie musicale de Liesse : bac mention Bien (maths, NSI). 1er prix national des très jeunes altistes."),
      ("2", "Depuis 2023 · Nantes", "Prépa Clemenceau, puis ESILV, cycle ingénieur (2024 – 2028). DeVinci Junior, développement commercial (2024 – 2025)."),
      ("3", "Depuis sept. 2025 · Levallois", "Devoteam, Group IT : alternance en IA agentique et RSE."),
      ("4", "2026 · Insula", "Mon premier projet personnel publié."),
      ("5", "2028 · Cap", "Le diplôme d'ingénieur.")]
yy = 260
for num, head, body in LG:
    pastille(92, yy + 26, num, 28, 34); d.text((140, yy), head, font=serifB(38), fill=ink)
    lines = textwrap.wrap(body, 36)
    for j, line in enumerate(lines): d.text((140, yy + 54 + j * 38), line, font=serif(31), fill=(55, 55, 50))
    yy += 54 + len(lines) * 38 + 46
im.save(os.path.join(OUT, "carte_parcours.jpg"), quality=90)

# 2. livre de bord ouvert (deux pages, 2048 x 1400)
W, H = 2048, 1400; im = paper(W, H, (240, 232, 210), spots=False); d = ImageDraw.Draw(im)
for x in range(W // 2 - 30, W // 2 + 30): d.line([(x, 0), (x, H)], fill=(int(200 - 60 * (1 - abs(x - W // 2) / 30)),) * 3)
for side in (0, 1):
    x0 = 120 + side * (W // 2)
    for k in range(18): d.line([(x0, 300 + k * 60), (x0 + W // 2 - 240, 300 + k * 60)], fill=(170, 190, 210), width=2)
    d.line([(x0 + 150, 230), (x0 + 150, H - 80)], fill=(210, 120, 110), width=2)
d.text((140, 90), "Livre de bord — Elba", font=serifI(72), fill=(70, 30, 20))
L = [("Heure", "Événement"), ("—", "Appareillé du ponton, vent léger."), ("—", "Cap au nord, Insula en vue."), ("—", "Accosté le long du quai."), ("—", "Cinéma, longue-vue, coulisses."), ("—", "La nuit tombe. Cabine.")]
for i, (h, e) in enumerate(L):
    d.text((140, 250 + i * 120), h, font=hand(46), fill=(40, 52, 90)); d.text((300, 250 + i * 120), e, font=hand(52), fill=(40, 52, 90))
d.text((W // 2 + 140, 90), "Prochaines escales", font=serifI(64), fill=(70, 30, 20))
for i, e in enumerate(["Île n° 2 — bientôt", "Île n° 3 — bientôt", "…"]):
    d.text((W // 2 + 160, 260 + i * 120), "–  " + e, font=hand(54), fill=(40, 52, 90))
im.save(os.path.join(OUT, "livre_de_bord.jpg"), quality=90)

# 3. dos de la photo (mot manuscrit)
W, H = 900, 1200; im = paper(W, H, (232, 220, 192)); d = ImageDraw.Draw(im)
txt = ["Louis-Marie", "", "élève-ingénieur à l'ESILV,", "en alternance chez Devoteam", "(IA agentique & RSE).", "", "Je construis les outils", "qui me manquent.", "", "Musicien (alto, violon),", "et marin sur Elba."]
for i, l in enumerate(txt): d.text((90, 110 + i * 82), l, font=note(56 if i else 76), fill=(30, 40, 80))
im.save(os.path.join(OUT, "photo_dos.jpg"), quality=90)

# 4. message en bouteille (parchemin déroulé)
W, H = 900, 1400; im = paper(W, H, (230, 214, 176)); d = ImageDraw.Draw(im)
for i, l in enumerate(["Message n° 1", "", "Une anecdote ou un", "témoignage viendra ici.", "", "(à écrire ensemble)"]): d.text((90, 160 + i * 96), l, font=hand(74 if i == 0 else 58), fill=(60, 40, 30))
im.save(os.path.join(OUT, "message_bouteille.jpg"), quality=90)

# 5. étiquette du CV (ruban) et écran de la VHF
im = paper(600, 260, (238, 228, 205), spots=False); d = ImageDraw.Draw(im); d.text((60, 70), "CV — L.-M. P. du Cray", font=serifI(50), fill=(70, 30, 20)); im.save(os.path.join(OUT, "cv_etiquette.jpg"), quality=90)
im = Image.new("RGB", (400, 160), (120, 235, 160)); d = ImageDraw.Draw(im); d.text((30, 20), "CH", font=serif(40), fill=(10, 50, 25)); d.text((140, 6), "16", font=serif(130), fill=(10, 50, 25)); im.save(os.path.join(OUT, "vhf_ecran.png"))
# 6. plancher teck et houx
W, H = 1024, 1024; im = Image.new("RGB", (W, H)); d = ImageDraw.Draw(im); random.seed(3)
for i in range(16):
    x0 = i * 64; base = (112 + random.randint(-12, 12), 64 + random.randint(-8, 8), 32 + random.randint(-6, 6))
    for x in range(x0, x0 + 58):
        for y in range(0, H, 4):
            c = int(14 * math.sin((y + i * 37) / (13 + i % 5)) + random.randint(-6, 6)); d.line([(x, y), (x, y + 3)], fill=tuple(max(0, v + c) for v in base))
    d.rectangle([x0 + 58, 0, x0 + 63, H], fill=(214, 200, 168))
im.save(os.path.join(OUT, "teck_houx.jpg"), quality=88)
print("ok", sorted(os.listdir(OUT)))

# ---------- images pour l'export web (remplacent les matières procédurales de Blender)
TEXD = os.path.join(os.path.dirname(OUT), "tex")
def tint(src, mul, out, rot=0):
    im = Image.open(os.path.join(TEXD, src)).convert("RGB")
    if rot: im = im.rotate(rot, expand=True)
    r, g, b = im.split(); im = Image.merge("RGB", [c.point(lambda v, m=m: int(v * m)) for c, m in zip((r, g, b), mul)])
    im.save(os.path.join(OUT, out), quality=88)
tint("rough_linen_diff_1k.jpg", (0.36, 0.5, 0.82), "lin_marine.jpg")
tint("oak_wood_planks_diff_1k.jpg", (0.8, 0.62, 0.46), "teck_placage.jpg", rot=90)
# pavillons L (damier jaune/noir) et M (croix blanche sur bleu)
fl = Image.new("RGB", (256, 256), (240, 190, 20)); dd = ImageDraw.Draw(fl); dd.rectangle([0, 0, 127, 127], fill=(15, 15, 15)); dd.rectangle([128, 128, 255, 255], fill=(15, 15, 15)); fl.save(os.path.join(OUT, "pavillon_L.png"))
fm = Image.new("RGB", (256, 256), (10, 40, 140)); dd = ImageDraw.Draw(fm); dd.line([(0, 0), (255, 255)], fill=(245, 245, 245), width=48); dd.line([(0, 255), (255, 0)], fill=(245, 245, 245), width=48); fm.save(os.path.join(OUT, "pavillon_M.png"))
# photo d'Elba découpée en ovale (transparence)
ROOT3 = os.path.dirname(os.path.dirname(OUT)); src = Image.open(os.path.join(os.path.dirname(ROOT3), "renders", "realiste.png")).convert("RGB")
w0, h0 = src.size; cw = int(h0 * 0.73); src = src.crop((int(w0 * 0.08), 0, int(w0 * 0.08) + cw, h0)).resize((512, 700))
al = Image.new("L", (512, 700), 0); ImageDraw.Draw(al).ellipse([0, 0, 511, 699], fill=255); src.putalpha(al); src.save(os.path.join(OUT, "photo_elba_ovale.png"))
print("export ok")
