"""Exporte le village de caissons du serveur et la bouée jaune pour le site : site/assets/fond.glb.
Le sable est à z = 0 (le site place le village à -20 m) ; la bouée est un nœud à part, « MarqueSpeciale », à l'origine.
Usage : Blender -b --factory-startup -P 3d/scripts/export_fond.py -- export"""
"""Storyboard de la plongée d'Elba vers le village de caissons du serveur (rendus de proposition, hors site).
Usage : Blender -b --factory-startup -P maquettes/plongee.py -- <arrivee|mue|pret|plongee|village|caisson> [preview]
Rendus -> 3d/renders/plongee_<vue>[_preview].png"""
import bpy, math, os, sys, random
from mathutils import Vector, Matrix, noise
HOME = os.path.expanduser("~/portfoliov2")
sys.path.insert(0, os.path.join(HOME, "3d", "scripts"))
import immeuble as IM

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
V = argv[0]; PREVIEW = "preview" in argv
SOUS = V in ("plongee", "village", "caisson")
GEN = os.path.join(HOME, "3d", "assets", "pistes", "gen")
R = random.Random(7)
sc = bpy.context.scene
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
M = IM.mat
FOND = 0.0          # profondeur du sable

metal = M("Acier", (0.45, 0.46, 0.47), 0.35, 1.0)
noir = M("Noir", (0.02, 0.02, 0.02), 0.5)
jaune = M("JauneSignal", (0.95, 0.62, 0.04), 0.4)
laiton = M("Laiton", (0.72, 0.52, 0.22), 0.3, 1.0)
coque_blanche = M("CoqueCaisson", (0.78, 0.8, 0.8), 0.45, 0.2, bump=0.08, nscale=3)
verre = M("VerreBulle", (0.55, 0.78, 0.88), 0.03, transm=0.85)
granit = M("RocheFonce", (0.16, 0.15, 0.14), 0.85, bump=0.5, nscale=6)


def link(o):
    for c in list(o.users_collection):
        c.objects.unlink(o)
    sc.collection.objects.link(o); return o


def grp(name, loc=(0, 0, 0), rot=(0, 0, 0)):
    g = bpy.data.objects.new(name, None); sc.collection.objects.link(g); g.location = loc; g.rotation_euler = rot; return g


def par(o, g, m=None):
    link(o)
    if m: o.data.materials.append(m)
    if g: o.parent = g
    return o


def cyl(name, c, r, d, m, rot=(0, 0, 0), v=32, g=None):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=d, vertices=v, location=c, rotation=rot)
    o = bpy.context.active_object; o.name = name; return par(o, g, m)


def sph(name, c, r, m, scale=(1, 1, 1), g=None, seg=32):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=seg, ring_count=seg // 2, location=c)
    o = bpy.context.active_object; o.name = name; o.scale = scale
    for p in o.data.polygons: p.use_smooth = True
    return par(o, g, m)


def cube(name, c, s, m, rot=(0, 0, 0), g=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=c, rotation=rot)
    o = bpy.context.active_object; o.name = name; o.scale = s; return par(o, g, m)


def torus(name, c, R_, r, m, rot=(0, 0, 0), g=None, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R_, minor_radius=r, major_segments=48, minor_segments=8, location=c, rotation=rot)
    o = bpy.context.active_object; o.name = name; o.scale = scale; return par(o, g, m)


def tube(name, a, b, r, m, g=None, v=12):
    a, b = Vector(a), Vector(b); d = b - a
    o = cyl(name, (a + b) / 2, r, d.length, m, v=v, g=None); o.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
    if g: o.parent = g
    return o


def courbe(name, pts, r, m):
    cv = bpy.data.curves.new(name, "CURVE"); cv.dimensions = "3D"; cv.bevel_depth = r; cv.bevel_resolution = 1
    sp = cv.splines.new("BEZIER"); sp.bezier_points.add(len(pts) - 1)
    for i, pt in enumerate(pts):
        bp = sp.bezier_points[i]; bp.co = pt; bp.handle_left_type = bp.handle_right_type = "AUTO"
    o = bpy.data.objects.new(name, cv); o.data.materials.append(m); sc.collection.objects.link(o); return o


def texte(name, s, c, size, m, rot, g=None):
    cu = bpy.data.curves.new(name, "FONT"); cu.body = s; cu.align_x = "CENTER"; cu.align_y = "CENTER"; cu.size = size; cu.extrude = 0.004
    o = bpy.data.objects.new(name, cu); o.data.materials.append(m); sc.collection.objects.link(o); o.location = c; o.rotation_euler = rot
    if g: o.parent = g
    return o


def emis(name, col, es):
    return M(name, (0.02, 0.02, 0.02), 0.3, emit=col, es=es)


# ------------------------------------------------------------------ Elba et sa transformation
MAT_PIVOT = Vector((0.80, 0.0, 0.93))
GREEMENT = ("Mat", "Barre", "feu_tete")
CABLES = ("Etai", "Pataras", "Hauban", "BasHauban")
VOILES = ("Genois", "GrandVoile", "Latte")


# ---- version légère pour le site : moins de segments (invisible à la distance où on les voit)
_cyl, _sph, _torus = cyl, sph, torus
def cyl(name, c, r, d, m, rot=(0, 0, 0), v=32, g=None): return _cyl(name, c, r, d, m, rot, min(v, 24), g)
def sph(name, c, r, m, scale=(1, 1, 1), g=None, seg=32): return _sph(name, c, r, m, scale, g, min(seg, 18))
def torus(name, c, R_, r, m, rot=(0, 0, 0), g=None, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R_, minor_radius=r, major_segments=24, minor_segments=5, location=c, rotation=rot)
    o = bpy.context.active_object; o.name = name; o.scale = scale; return par(o, g, m)

def bouee(loc):
    g = grp("MarqueSpeciale", loc)
    cyl("Flotteur", (0, 0, 0.2), 0.9, 1.2, jaune, v=40, g=g)
    cyl("Jupe", (0, 0, -0.55), 0.6, 0.5, M("Rouille", (0.35, 0.18, 0.08), 0.8), v=24, g=g)
    for a in range(3):
        aa = a * 2 * math.pi / 3; tube("Pylone", (0.55 * math.cos(aa), 0.55 * math.sin(aa), 0.8), (0, 0, 3.2), 0.05, jaune, g=g)
    cyl("Mat", (0, 0, 3.4), 0.06, 0.8, jaune, v=12, g=g)
    for s in (-1, 1):
        cube("VoyantX", (0, 0, 4.05), (0.08, 0.9, 0.12), jaune, (s * math.radians(45), 0, 0), g=g)
    cyl("Feu", (0, 0, 3.85), 0.09, 0.14, emis("FeuJaune", (1, 0.8, 0.2), 4.0), v=16, g=g)
    return g


# ------------------------------------------------------------------ les caissons
def caisson(name, loc, yaw, L, r, plaque, n_hub=4, actif=True):
    g = grp(name, loc, (0, 0, yaw))
    cyl("Coque", (0, 0, 0), r, L, coque_blanche, (0, math.pi / 2, 0), v=64, g=g)
    for s in (-1, 1):
        sph("Fond", (s * L / 2, 0, 0), r, coque_blanche, (0.45, 1, 1), g=g, seg=48)
        torus("Cerclage", (s * (L / 2 - 0.25), 0, 0), r + 0.02, 0.06, metal, (0, math.pi / 2, 0), g=g)
    for s in (-1, 1):
        torus("Cerclage", (s * L * 0.18, 0, 0), r + 0.02, 0.06, metal, (0, math.pi / 2, 0), g=g)
    for s in (-1, 1):            # patins et pieds
        cube("Patin", (0, s * r * 0.7, -r - 0.45), (L * 0.8, 0.25, 0.18), metal, g=g)
        for x in (-L * 0.3, L * 0.3):
            tube("Pied", (x, s * r * 0.55, -r * 0.75), (x, s * r * 0.7, -r - 0.4), 0.08, metal, g=g)
    # hublots sur le flanc -y : on voit les baies derrière
    vitre = IM.img_mat("HublotRacks", os.path.join(GEN, "hublot_racks.png"), 3.0 if actif else 0.3, 0.15, screen=True)
    for k in range(n_hub):
        x = -L * 0.32 + k * (L * 0.64 / max(1, n_hub - 1))
        cyl("Hublot", (x, -r + 0.06, -0.15), 0.34, 0.1, vitre, (math.pi / 2, 0, 0), v=32, g=g)
        torus("BagueHublot", (x, -r + 0.02, -0.15), 0.37, 0.05, laiton, (math.pi / 2, 0, 0), g=g)
    if plaque:                   # plaque de laiton gravée, au-dessus des hublots, épousant la coque
        th = math.radians(34); n_ = Vector((0, -math.cos(th), math.sin(th)))
        cube("Plaque", tuple(n_ * (r + 0.02)), (min(2.2, 0.16 * len(plaque) + 0.4), 0.03, 0.42), laiton, (-th, 0, 0), g=g)
        texte("Gravure", plaque, tuple(n_ * (r + 0.045)), 0.2, M("Grave", (0.06, 0.04, 0.02), 0.6), (math.pi / 2 - th, 0, 0), g=g)
    # diode d'état sur le dôme
    cyl("Etat", (L / 2 - 0.6, 0, r - 0.02), 0.1, 0.06, emis("EtatVert", (0.2, 1, 0.4), 15.0 if actif else 0), v=16, g=g)
    lt = bpy.data.lights.new(name + "Lueur", "POINT"); lt.energy = 450 if actif else 0; lt.color = (0.4, 0.8, 1.0); lt.shadow_soft_size = 0.3
    lo = bpy.data.objects.new(name + "Lueur", lt); sc.collection.objects.link(lo); lo.parent = g; lo.location = (0, -r - 0.6, -0.15)
    return g


SERVICES = ["CLOUD PRIVÉ", "IA LOCALE", "MESSAGERIE", "ACCÈS", "SUPERVISION", "SAUVEGARDES"]
CAPS = {}


def village():
    zc = FOND + 1.4 + 0.65
    hub = caisson("Noeud", (0, 0, FOND + 1.9 + 0.65), 0, 10, 1.9, "RÉSEAU", n_hub=6)
    for i, nom in enumerate(SERVICES):
        a = math.radians(90 + i * 60); d = 15.0
        x, y = d * math.cos(a), d * math.sin(a)
        g = caisson("Caisson" + str(i), (x, y, zc), a, 7, 1.4, nom, n_hub=3)
        CAPS[nom] = g
        # câble du bout intérieur vers le nœud, posé sur le sable
        inner = Vector((x, y, FOND + 0.12)) * 1; inner.xy = Vector((x, y)) * (1 - 4.6 / d)
        courbe("Liaison", [(inner.x, inner.y, FOND + 0.6), ((inner.x) * 0.6, (inner.y) * 0.6, FOND + 0.1), (inner.x * 0.25, inner.y * 0.25, FOND + 0.5)], 0.09, noir)
    # le gros câble vers l'île de la Carte vivante
    courbe("CableCarte", [(5.2, 0, FOND + 1.2), (9, -3, FOND + 0.2), (24, -10, FOND + 0.15), (70, -28, FOND + 0.2), (160, -60, FOND + 0.2)], 0.22, noir)
    for t in range(6):
        x = 14 + t * 12; cube("Lest", (x, -6 - t * 4.6 * 0.8, FOND + 0.25), (1.0, 1.0, 0.5), M("BetonFond", (0.5, 0.5, 0.47), 0.9), (0, 0, -0.4))



village(); b = bouee((0, 0, 0))
R2 = random.Random(11)
for k in range(26):                      # quelques roches autour du village
    a = R2.uniform(0, 6.283); d = R2.uniform(21, 34)
    sph("Roche", (math.cos(a) * d, math.sin(a) * d, 0), R2.uniform(0.5, 1.6), granit, (1, R2.uniform(0.7, 1.3), R2.uniform(0.4, 0.7)), seg=10)
for o in list(sc.objects):
    if o.type == "LIGHT": bpy.data.objects.remove(o, do_unlink=True)
for o in [o for o in sc.objects if o.type == "FONT"]: o.data.resolution_u = 2
for o in [o for o in sc.objects if o.type == "CURVE"]: o.data.resolution_u = 6
for o in [o for o in sc.objects if o.type in ("FONT", "CURVE")]:
    bpy.ops.object.select_all(action="DESELECT"); bpy.context.view_layer.objects.active = o; o.select_set(True); bpy.ops.object.convert(target="MESH")
for o in sc.objects:                      # ombrage lissé sur les pièces rondes : quatre fois moins de sommets
    if o.type == "MESH" and len(o.data.polygons) > 30 and not o.name.startswith("Gravure"):
        for pg in o.data.polygons: pg.use_smooth = True
outp = os.path.join(HOME, "site", "assets", "fond.glb")
bpy.ops.export_scene.gltf(filepath=outp, export_format="GLB", export_apply=True, export_lights=False, export_cameras=False, export_extras=False, export_yup=True)
print("EXPORT", outp, os.path.getsize(outp) // 1024, "Ko")
