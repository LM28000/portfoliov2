"""Le manège sous-marin du serveur : un plateau tournant, la tour fixe du nœud central, cinq caissons.
Le caisson de devant s'ouvre en rideau (sa face avant glisse sur le dessus) ; à l'intérieur, une baie : un module par service.
build_carrousel(H, rot, ouvert, k_ouv, style, liens) ; repère : centre du plateau en (0, 0), sable à z = FOND."""
import bpy, bmesh, math
from mathutils import Vector

CAISSONS = [
    ("ACCÈS", ["Headscale", "Authentik", "Vaultwarden"], "Connexion unique : Nextcloud, Matrix, Portainer"),
    ("CLOUD ET MESSAGERIE", ["Nextcloud", "Matrix"], "Derrière la connexion unique"),
    ("IA LOCALE", ["Ollama"], "Des modèles de langue chez moi"),
    ("SUPERVISION", ["Grafana", "Uptime Kuma", "Scrutiny", "Dozzle"], "Tous les services surveillés"),
    ("SAUVEGARDES", ["Kopia"], "Toutes les données Docker, chaque nuit"),
]
LIENS = {0: [1], 3: [0, 1, 2, 4], 4: [0, 1, 2, 3]}     # qui s'allume quand on ouvre un caisson (vers le nœud, puis vers eux)


def _arc_mesh(name, L, r, a0, a1, n_a=28, n_x=2):
    """portion de cylindre d'axe X, angles mesurés autour de X depuis -Y (vers l'extérieur) en montant vers +Z"""
    vs, fs = [], []
    for i in range(n_x + 1):
        x = -L / 2 + L * i / n_x
        for j in range(n_a + 1):
            a = math.radians(a0 + (a1 - a0) * j / n_a); vs.append((x, -r * math.cos(a), r * math.sin(a)))
    for i in range(n_x):
        for j in range(n_a):
            p = i * (n_a + 1) + j; fs.append([p, p + 1, p + n_a + 2, p + n_a + 1])
    me = bpy.data.meshes.new(name); me.from_pydata(vs, [], fs); me.validate()
    for pg in me.polygons: pg.use_smooth = True
    return me


def build_carrousel(H, FOND, rot=0.0, ouvert=0, k_ouv=1.0, style="tiroirs", liens=None):
    cube, cyl, sph, tube, courbe, texte, M, emis = H["cube"], H["cyl"], H["sph"], H["tube"], H["courbe"], H["texte"], H["M"], H["emis"]
    metal, noir, laiton = H["metal"], H["noir"], H["laiton"]; sc = bpy.context.scene
    blanc = M("CoqueCaissonM", (0.8, 0.82, 0.82), 0.4, 0.2); inter = M("Interieur", (0.18, 0.2, 0.22), 0.6); facade = M("Facade", (0.07, 0.08, 0.09), 0.45, 0.4)
    grave = M("Grave", (0.06, 0.04, 0.02), 0.6); vertled = emis("LedVerte", (0.2, 1, 0.45), 18); bleuled = emis("LedBleue", (0.3, 0.7, 1), 18)
    lien_on = emis("LienAllume", (0.3, 0.85, 1.0), 14); cable = M("CableNoir", (0.02, 0.02, 0.025), 0.5)
    Z = FOND
    # plateau tournant et rail
    cyl("Plateau", (0, 0, Z + 0.35), 13.0, 0.7, M("PlateauAcier", (0.3, 0.32, 0.33), 0.5, 0.7), v=96)
    bpy.ops.mesh.primitive_torus_add(major_radius=13.0, minor_radius=0.18, major_segments=96, minor_segments=8, location=(0, 0, Z + 0.72)); t = bpy.context.active_object; t.data.materials.append(emis("Liseré", (0.3, 0.8, 1), 4))
    for k in range(24):
        a = k * math.tau / 24 + rot; cyl("Galet", (math.cos(a) * 13.2, math.sin(a) * 13.2, Z + 0.2), 0.3, 0.4, metal, v=12)
    # tour du nœud central (fixe) : PILOTAGE / Portainer
    cyl("Tour", (0, 0, Z + 3.8), 2.2, 6.2, blanc, v=48); sph("DomeTour", (0, 0, Z + 6.9), 2.2, blanc, (1, 1, 0.5), seg=32)
    for k in range(8):
        a = k * math.tau / 8; cyl("HublotTour", (math.cos(a) * 2.18, math.sin(a) * 2.18, Z + 4.6), 0.3, 0.08, emis("HublotTour", (0.4, 0.85, 1), 3), (math.pi / 2, 0, a + math.pi / 2), v=24)
    cube("PlaqueTour", (0, -2.24, Z + 2.6), (2.4, 0.05, 0.7), laiton)
    texte("GravureTour", "PILOTAGE · Portainer", (0, -2.28, Z + 2.6), 0.26, grave, (math.pi / 2, 0, 0))
    # la couronne du manège : en haut de la tour, des rayons jusqu'au-dessus de chaque caisson
    bpy.ops.mesh.primitive_torus_add(major_radius=9.4, minor_radius=0.16, major_segments=96, minor_segments=8, location=(0, 0, Z + 6.4)); cr = bpy.context.active_object; cr.data.materials.append(metal)
    bpy.ops.mesh.primitive_torus_add(major_radius=9.4, minor_radius=0.07, major_segments=96, minor_segments=6, location=(0, 0, Z + 6.15)); cr2 = bpy.context.active_object; cr2.data.materials.append(emis("Couronne", (0.3, 0.8, 1), 5))
    for i in range(5):
        a = -math.pi / 2 + i * math.tau / 5 + rot; x, y = math.cos(a) * 9.4, math.sin(a) * 9.4
        tube("Rayon", (math.cos(a) * 2.2, math.sin(a) * 2.2, Z + 7.0), (x, y, Z + 6.4), 0.13, metal)
        tube("Suspente", (x, y, Z + 6.4), (x, y, Z + 0.7 + 0.5 + 2 * 1.4 + 0.05), 0.07, metal)
    lit = set(liens or [])
    R0, L, r = 9.4, 7.0, 1.4
    for i, (nom, services, note) in enumerate(CAISSONS):
        a = -math.pi / 2 + i * math.tau / 5 + rot; cx, cy = math.cos(a) * R0, math.sin(a) * R0
        g = bpy.data.objects.new("Caisson" + str(i), None); sc.collection.objects.link(g); g.location = (cx, cy, Z + 0.7 + 0.5 + r); g.rotation_euler.z = a + math.pi / 2
        par = lambda o: (setattr(o, "parent", g), o)[1]
        k = k_ouv if i == ouvert else 0.0
        VA0, VA1 = -50, 70                       # le rideau : face avant, du bas-avant au haut
        o = bpy.data.objects.new("Coque", _arc_mesh("Coque", L, r, VA1, 360 + VA0)); o.data.materials.append(blanc); sc.collection.objects.link(o); par(o)
        sd = o.modifiers.new("e", "SOLIDIFY"); sd.thickness = 0.06; sd.offset = -1
        v = bpy.data.objects.new("Rideau", _arc_mesh("Rideau", L - 0.1, r + 0.07, VA0, VA1)); v.data.materials.append(blanc); sc.collection.objects.link(v); par(v)
        sd = v.modifiers.new("e", "SOLIDIFY"); sd.thickness = 0.05; sd.offset = -1
        v.rotation_euler.x = math.radians(-118 * k)          # il glisse vers le haut et l'arrière
        for s in (-1, 1):
            sph("Fond", (s * L / 2, 0, 0), r, blanc, (0.45, 1, 1), seg=32).parent = g
            bpy.ops.mesh.primitive_torus_add(major_radius=r + 0.05, minor_radius=0.06, major_segments=40, minor_segments=6, location=(s * (L / 2 - 0.1), 0, 0), rotation=(0, math.pi / 2, 0)); tt = bpy.context.active_object; tt.data.materials.append(metal); par(tt)
            cube("Berceau", (s * L * 0.32, 0, -r - 0.25), (0.5, 2.0, 0.5), metal).parent = g
        # plaque gravée sur le rideau (elle monte avec lui)
        ap = math.radians(18); n_ = Vector((0, -math.cos(ap), math.sin(ap)))
        pl = cube("Plaque", tuple(n_ * (r + 0.13)), (min(3.4, 0.17 * len(nom) + 0.6), 0.03, 0.42), laiton); pl.rotation_euler.x = -ap; pl.parent = v
        tx = texte("Gravure", nom, tuple(n_ * (r + 0.15)), 0.22, grave, (math.pi / 2 - ap, 0, 0)); tx.parent = v
        # intérieur : plancher, baie contre la paroi du fond, éclairage
        cube("Plancher", (0, 0, -r * 0.62), (L - 0.4, 2 * r * 0.75, 0.08), inter).parent = g
        cube("Baie", (0, r * 0.55, 0.05), (L - 1.0, 0.5, 1.9), facade).parent = g
        cube("Reglette", (0, 0, r * 0.82), (L - 1.2, 0.12, 0.05), emis("Reglette", (0.9, 0.95, 1), 6 if k > 0 else 0)).parent = g
        n = len(services)
        for j, sv in enumerate(services):
            if style == "tiroirs":
                w = min(1.5, (L - 1.6) / max(1, n) - 0.15); x = -(n - 1) * (w + 0.15) / 2 + j * (w + 0.15)
                for row in range(2):
                    zz = 0.45 - row * 0.62
                    dr = cube("Tiroir", (x, r * 0.55 - 0.27, zz), (w, 0.06, 0.5), M("TiroirGris", (0.22, 0.24, 0.26), 0.4, 0.6)); dr.parent = g
                    if row == 0:
                        lb = cube("Etiquette", (x, r * 0.55 - 0.31, zz + 0.05), (w * 0.8, 0.01, 0.18), laiton); lb.parent = g
                        tt2 = texte("Nom", sv, (x, r * 0.55 - 0.32, zz + 0.05), 0.11, grave, (math.pi / 2, 0, 0)); tt2.parent = g
                    cyl("Led", (x + w / 2 - 0.1, r * 0.55 - 0.31, zz - 0.15), 0.025, 0.02, vertled if (row + j) % 3 else bleuled, (math.pi / 2, 0, 0), v=8).parent = g
                    cube("Poignee", (x, r * 0.55 - 0.32, zz - 0.15), (w * 0.4, 0.03, 0.04), metal).parent = g
            else:
                x = -(n - 1) * 0.55 / 2 + j * 0.55
                cd = cube("Carte", (x, r * 0.55 - 0.3, 0.05), (0.16, 0.7, 1.6), M("CarteVerte", (0.05, 0.22, 0.12), 0.4)); cd.parent = g
                fp = cube("FacadeCarte", (x, r * 0.55 - 0.66, 0.05), (0.2, 0.03, 1.65), facade); fp.parent = g
                for q in range(4): cyl("Led", (x, r * 0.55 - 0.69, 0.6 - q * 0.12), 0.025, 0.02, vertled if q % 2 == 0 else bleuled, (math.pi / 2, 0, 0), v=8).parent = g
                lb = cube("Etiquette", (x, r * 0.55 - 0.69, -0.35), (0.18, 0.01, 0.9), laiton); lb.parent = g
                tt2 = texte("Nom", sv, (x, r * 0.55 - 0.70, -0.35), 0.1, grave, (math.pi / 2, math.pi / 2, 0)); tt2.parent = g
        if k > 0:
            l = bpy.data.lights.new("Interieur" + str(i), "AREA"); l.energy = 300 * k; l.size = L - 1; l.size_y = 0.4; l.shape = "RECTANGLE"; l.color = (0.85, 0.93, 1)
            lo = bpy.data.objects.new("Interieur" + str(i), l); sc.collection.objects.link(lo); lo.parent = g; lo.location = (0, -0.3, r * 0.7)
        # câble vers la tour, posé sur le plateau
        p0 = Vector((cx, cy, 0)) * ((R0 - r - 0.3) / R0); p1 = Vector((cx, cy, 0)) * (2.4 / R0)
        on = (i == ouvert and lit) or (i in lit)
        courbe("Liaison" + str(i), [(p0.x, p0.y, Z + 0.85), ((p0.x + p1.x) / 2, (p0.y + p1.y) / 2, Z + 0.8), (p1.x, p1.y, Z + 0.9)], 0.11, lien_on if on else cable)
        if on:                                    # impulsions de lumière le long du câble
            for q in range(5):
                f = (q + 0.5) / 5; pp = p0.lerp(p1, f); sph("Impulsion", (pp.x, pp.y, Z + 0.86), 0.2, emis("Impulsion", (0.6, 0.95, 1), 40), seg=10)
    return dict(R0=R0, r=r, L=L, z=Z + 0.7 + 0.5 + r)
