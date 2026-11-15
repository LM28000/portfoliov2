"""La base flottante du serveur (station océanographique en U, bassin central ouvert au sud) : construite dans la scène de plongee.py.
build_base() -> dict des repères utiles. Repère : bassin dans l'axe X (ouvert vers -X), centre du bassin à l'origine, pont à z = 5."""
import bpy, math
from mathutils import Vector


def build_base(H):
    """H : les fonctions et matériaux de plongee.py (cube, cyl, sph, tube, courbe, texte, M, metal, noir, jaune, emis)"""
    cube, cyl, sph, tube, courbe, texte, M = H["cube"], H["cyl"], H["sph"], H["tube"], H["courbe"], H["texte"], H["M"]
    orange = M("CoqueOrange", (0.36, 0.06, 0.008), 0.4); af = M("AntifoulingBase", (0.25, 0.06, 0.04), 0.7); pont = M("PontGris", (0.16, 0.17, 0.18), 0.85, bump=0.15, nscale=3)
    blanc = M("Superstructure", (0.86, 0.87, 0.86), 0.5); vitre = M("VitreBase", (0.03, 0.05, 0.07), 0.08, 0.2); jaune = M("JauneGrue", (0.95, 0.66, 0.05), 0.45)
    noir = H["noir"]; metal = H["metal"]; emis = H["emis"]; vert = M("Helisurface", (0.12, 0.28, 0.16), 0.8); blancp = M("PeintureSol", (0.9, 0.9, 0.86), 0.7)
    D, Z0, ZB = 5.0, 0.0, -4.0            # hauteur du pont, flottaison, fond des coques
    BW, HW, X0, X1 = 7.0, 8.0, -22.0, 16.0  # demi-largeur du bassin, largeur d'une coque, bout sud, début du bloc nord
    for s in (-1, 1):
        yc = s * (BW + HW / 2)
        cube("Coque", ((X0 + X1 + 10) / 2, yc, (D + 0.6) / 2), (X1 + 10 - X0, HW, D - 0.6), orange)       # œuvres mortes
        cube("Carene", ((X0 + X1 + 10) / 2, yc, (ZB + 0.6) / 2), (X1 + 10 - X0, HW, -ZB + 0.6), af)                             # sous la flottaison
        cube("PontCoque", ((X0 + X1 + 10) / 2, yc, D + 0.05), (X1 + 10 - X0, HW, 0.1), pont)
        # étrave arrondie au sud
        cyl("NezCoque", (X0, yc, (D + ZB) / 2), HW / 2, D - ZB, orange, v=32)
        cyl("NezPont", (X0, yc, D + 0.05), HW / 2, 0.1, pont, v=32)
        # bandes blanches et marquage
        cube("Liseret", ((X0 + X1 + 10) / 2, yc + s * (HW / 2 + 0.01), D - 0.5), (X1 + 10 - X0, 0.02, 0.35), blanc)
        texte("Marquage", "S 28", (X0 + 12, yc + s * (HW / 2 + 0.03), 2.6), 2.2, blanc, (math.pi / 2, 0, 0 if s < 0 else math.pi))
        # défenses côté bassin, échelle
        for x in range(int(X0) + 4, int(X1), 5):
            cyl("Defense", (x, s * (BW + 0.25), 1.2), 0.35, 1.6, noir, v=16)
        # garde-corps
        for (yy) in (yc - HW / 2 + 0.15, yc + HW / 2 - 0.15):
            for z in (D + 0.55, D + 1.05):
                cube("Lisse", ((X0 + X1 + 10) / 2, yy, z), (X1 + 10 - X0, 0.05, 0.05), blanc)
            for x in range(int(X0), int(X1 + 10), 2):
                cyl("Montant", (x, yy, D + 0.55), 0.03, 1.1, blanc, v=6)
        # conteneurs et bossoirs de canots
        cols = [M("ConteneurBleu", (0.06, 0.2, 0.42), 0.6), M("ConteneurVert", (0.12, 0.32, 0.18), 0.6), M("ConteneurBlanc", (0.8, 0.8, 0.78), 0.6), M("ConteneurRouge", (0.5, 0.08, 0.05), 0.6)]
        for k in range(4):
            x = X0 + 6 + k * 6.6
            cube("Conteneur", (x, yc + s * 1.2, D + 1.3), (6.06, 2.44, 2.59), cols[(k + (s > 0)) % 4])
            if k % 2 == 0: cube("Conteneur", (x, yc + s * 1.2, D + 3.9), (6.06, 2.44, 2.59), cols[(k + 2) % 4])
        for x in (X0 + 9, X1 - 2):
            sph("Canot", (x, yc + s * (HW / 2 + 0.9), D - 0.6), 1.0, orange, (3.0, 1.0, 1.0), seg=24)
            cube("ToitCanot", (x, yc + s * (HW / 2 + 0.9), D - 0.05), (4.0, 1.3, 0.5), blanc)
        # rails du portique
        cube("Rail", ((X0 + X1) / 2, s * (BW + 0.6), D + 0.2), (X1 - X0, 0.3, 0.3), metal)
        # feux d'entrée du bassin (rouge à bâbord, vert à tribord)
        cyl("FeuEntree", (X0, s * (BW + 0.8), D + 1.6), 0.15, 0.4, emis("FeuRouge" if s > 0 else "FeuVert", (1, 0.1, 0.05) if s > 0 else (0.1, 1, 0.3), 12), v=12)
    # bloc nord : bâtiment, passerelle de commandement, hélisurface
    cube("BlocNord", ((X1 + X1 + 10) / 2, 0, (D + ZB) / 2), (10, 2 * (BW + HW), D - ZB), orange)
    cube("PontNord", ((X1 + X1 + 10) / 2, 0, D + 0.05), (10, 2 * (BW + HW), 0.1), pont)
    cube("CloisonBassin", (X1 + 0.02, 0, (D + ZB) / 2), (0.1, 2 * BW, D - ZB), M("CloisonGrise", (0.4, 0.42, 0.44), 0.6))
    for (z0, h, w, d) in ((D, 3.2, 9, 22), (D + 3.2, 3.2, 8, 18), (D + 6.4, 2.8, 6, 12)):
        cube("Etage", (X1 + 5, 0, z0 + h / 2), (w, d, h), blanc)
        cube("Fenetres", (X1 + 5 - w / 2 - 0.02, 0, z0 + h * 0.55), (0.05, d * 0.9, h * 0.38), vitre)
        cube("FenetresC", (X1 + 5, d / 2 + 0.02, z0 + h * 0.55), (w * 0.85, 0.05, h * 0.38), vitre)
        cube("FenetresC", (X1 + 5, -d / 2 - 0.02, z0 + h * 0.55), (w * 0.85, 0.05, h * 0.38), vitre)
    cube("Passerelle", (X1 + 4.6, 0, D + 9.2 + 1.0), (7.4, 14, 2.0), blanc)
    cube("VitresPasserelle", (X1 + 4.6 - 3.72, 0, D + 9.2 + 1.1), (0.05, 13.6, 1.1), vitre)
    cube("ToitPasserelle", (X1 + 4.6, 0, D + 11.3), (8.2, 14.6, 0.2), blanc)
    cyl("Mat", (X1 + 6, 3, D + 15), 0.18, 8, blanc, v=10)
    sph("Radome", (X1 + 6, 3, D + 19.2), 0.9, blanc, seg=20)
    cube("Radar", (X1 + 6, -3, D + 12.2), (0.3, 3.6, 0.25), noir)
    for k in range(3): cyl("Antenne", (X1 + 7.5, -4 + k * 1.5, D + 13.4), 0.03, 4, metal, v=6)
    # hélisurface sur le toit du bloc nord, côté est (porte-à-faux)
    HX, HY, HZ = X1 + 5, -14.5, D + 4.6
    cyl("Helisurface", (HX, HY, HZ), 5.0, 0.25, vert, v=48)
    bpy.ops.mesh.primitive_torus_add(major_radius=3.7, minor_radius=0.12, major_segments=48, minor_segments=6, location=(HX, HY, HZ + 0.15))
    tor = bpy.context.active_object; tor.data.materials.append(jaune)
    texte("H", "H", (HX, HY, HZ + 0.16), 3.4, blancp, (0, 0, math.pi / 2))
    for a in range(6):
        aa = a * math.pi / 3; tube("Pilier", (HX + math.cos(aa) * 4.0, HY + math.sin(aa) * 4.0, HZ - 0.1), (HX + math.cos(aa) * 2.5, HY + math.sin(aa) * 2.5, D), 0.12, metal)
    # portique roulant au-dessus du bassin
    gx = 0.0
    for s in (-1, 1):
        for dx in (-1.6, 1.6):
            tube("PiedPortique", (gx + dx, s * (BW + 0.6), D + 0.3), (gx + dx * 0.5, s * (BW + 0.4), D + 13), 0.3, jaune)
        cube("Bogie", (gx, s * (BW + 0.6), D + 0.6), (4.2, 0.9, 0.8), jaune)
    cube("Poutre", (gx, 0, D + 13.4), (1.6, 2 * BW + 2.4, 1.4), jaune)
    cube("Chariot", (gx, 0, D + 12.3), (2.2, 2.2, 1.0), jaune)
    for dy in (-0.5, 0.5): cyl("Cable", (gx + 0.0, dy, D + 6.5), 0.03, 11, metal, v=6)
    cube("Palonnier", (gx, 0, D + 1.0), (6.5, 0.3, 0.3), jaune)
    # éclairage du bassin
    for x in range(int(X0) + 6, int(X1), 8):
        for s in (-1, 1):
            cyl("Lampadaire", (x, s * (BW + 1.2), D + 2.5), 0.06, 5, metal, v=6)
            cube("Projecteur", (x, s * (BW + 0.9), D + 5.0), (0.5, 0.6, 0.3), emis("Projo", (1, 0.9, 0.75), 6))
    # amarres vers le fond (chaînes)
    for (x, s) in ((X0 + 2, 1), (X0 + 2, -1), (X1 + 8, 1), (X1 + 8, -1)):
        y = s * (BW + HW + 0.2); courbe("Chaine", [(x, y, ZB + 1), (x - 6 if x < 0 else x + 6, y + s * 8, -12), (x - 16 if x < 0 else x + 16, y + s * 18, -19.8)], 0.12, metal)
    return dict(D=D, BW=BW, X0=X0, X1=X1, ZB=ZB)
