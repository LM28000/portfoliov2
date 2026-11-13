"""Île d'Insula v3 : le terrain, le ponton et les arbres de la v2, sans les bâtiments décoratifs.
Un seul immeuble sur le quai, au pied du ponton : panneau À VENDRE au balcon, studio témoin au 1er (immeuble.py).
Usage : Blender -b --factory-startup -P ile_insula_v3.py -- [preview] [vues=approche,quai,panneau,entree,table,baie]"""
import bpy, math, os, sys, random
from mathutils import Vector, Matrix, noise
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import immeuble as IM

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.realpath(__file__)))))  # racine du dépôt (le site)
SITE = os.path.join(REPO, "assets")
ASSETS = os.path.join(ROOT, "assets"); OUT = os.path.join(ROOT, "renders")
ELBA = os.path.join(SITE, "elba.glb")
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
PREVIEW = "preview" in argv
VUES = next((a.split("=")[1].split(",") for a in argv if a.startswith("vues=")), ["approche", "quai", "panneau", "entree", "table", "baie"])
random.seed(7)
sc = bpy.context.scene
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)

RX, RY, TOP = 72.0, 46.0, 9.0
# ponton (comme en v2) et immeuble à son pied, façade tournée vers le ponton
QX, QY, QROT = -50.0, -36.0, math.radians(135)
U = Vector((-math.sin(QROT), math.cos(QROT), 0))          # axe du ponton, vers le large
BLD = Vector((QX, QY, 0)) - U * 16.5; BROT = math.radians(-45)
GROUND = 1.45                      # quai à 1,45 m au-dessus de l'eau
DECK = 0.5                         # plancher du ponton : à mi-hauteur de la coque d'Elba (franc-bord ~0,9 m)
J_DECK = 2.96                      # hauteur du plancher dans le modèle du ponton, au-dessus de son point le plus bas
N_ = Vector((U.y, -U.x, 0))
ROOTJ = Vector((QX, QY, 0)) - U * 3.5                    # racine du ponton côté terre


def h0(x, y):
    r = math.sqrt((x / RX) ** 2 + (y / RY) ** 2)
    n = noise.fractal(Vector((x * 0.035, y * 0.035, 1.3)), 0.6, 2.0, 4)
    r = r * (1 + 0.12 * n)
    if r >= 1.15:
        return -3.0
    t = max(0.0, 1 - r)
    base = TOP * (1 - (1 - t) ** 2.6)
    cliff = 1.0 + 0.9 * max(0.0, y / RY) ** 2
    hh = base * cliff + 0.8 * noise.fractal(Vector((x * 0.08, y * 0.08, 5.1)), 0.5, 2.0, 3) * t
    hill = 9.0 * math.exp(-(((x - 42) / 13) ** 2 + ((y - 18) / 11) ** 2))
    return hh + hill - 1.2


def seg_d(p, a, b):
    ab = b - a; t = max(0.0, min(1.0, (p - a).dot(ab) / ab.length_squared)); return (p - (a + ab * t)).length


def sstep(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)


QUAI_S = -3.2   # bord du quai (mur de granit), mesuré le long du ponton depuis son centre


def h(x, y):
    """terrain v2 + esplanade plate côté terre, et bassin en eau profonde côté large :
    le ponton et Elba restent dans l'eau, le quai s'arrête net sur un mur de granit."""
    z = h0(x, y); p = Vector((x, y, 0)); q = p - Vector((QX, QY, 0))
    s, lat = q.dot(U), q.dot(N_)
    d = seg_d(p, BLD + U * -3.0, ROOTJ)
    w = sstep(15.0, 8.0, d) * sstep(QUAI_S + 0.3, QUAI_S - 2.0, s)      # esplanade : seulement en arrière du quai
    z = z * (1 - w) + (GROUND - 0.02) * w
    wc = sstep(QUAI_S - 0.2, QUAI_S + 0.8, s) * sstep(17.0, 11.0, abs(lat))  # bassin devant le quai
    return z * (1 - wc) + min(z, -2.2) * wc


def terrain_mat():
    m = bpy.data.materials.new("Terrain"); m.use_nodes = True
    nt = m.node_tree; N = nt.nodes; L = nt.links.new
    b = next(n for n in N if n.type == "BSDF_PRINCIPLED"); b.inputs["Roughness"].default_value = 0.9
    geo = N.new("ShaderNodeNewGeometry"); sp = N.new("ShaderNodeSeparateXYZ"); sn = N.new("ShaderNodeSeparateXYZ")
    L(geo.outputs["Position"], sp.inputs[0]); L(geo.outputs["Normal"], sn.inputs[0])
    noi = N.new("ShaderNodeTexNoise"); noi.inputs["Scale"].default_value = 0.35
    hr = N.new("ShaderNodeMapRange"); hr.inputs["From Min"].default_value, hr.inputs["From Max"].default_value = 0.2, 1.4
    L(sp.outputs[2], hr.inputs["Value"])
    c1 = N.new("ShaderNodeMix"); c1.data_type = "RGBA"
    c1.inputs[6].default_value = (0.62, 0.52, 0.34, 1); c1.inputs[7].default_value = (0.12, 0.22, 0.06, 1)
    L(hr.outputs[0], c1.inputs[0])
    gv = N.new("ShaderNodeMix"); gv.data_type = "RGBA"; gv.inputs[7].default_value = (0.2, 0.28, 0.08, 1)
    L(c1.outputs[2], gv.inputs[6]); L(noi.outputs["Fac"], gv.inputs[0])
    sl = N.new("ShaderNodeMapRange"); sl.inputs["From Min"].default_value, sl.inputs["From Max"].default_value = 0.9, 0.7
    L(sn.outputs[2], sl.inputs["Value"])
    rock = N.new("ShaderNodeMix"); rock.data_type = "RGBA"; rock.inputs[7].default_value = (0.3, 0.29, 0.28, 1)
    L(gv.outputs[2], rock.inputs[6]); L(sl.outputs[0], rock.inputs[0])
    L(rock.outputs[2], b.inputs["Base Color"])
    bump = N.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.25
    n2 = N.new("ShaderNodeTexNoise"); n2.inputs["Scale"].default_value = 6
    L(n2.outputs["Fac"], bump.inputs["Height"]); L(bump.outputs["Normal"], b.inputs["Normal"])
    return m


def lib_collection(fname, rootname):
    with bpy.data.libraries.load(os.path.join(ASSETS, fname), link=False) as (src, dst):
        dst.objects = list(src.objects)
    c = bpy.data.collections.new("Lib_" + rootname)
    for o in dst.objects:
        if o is not None:
            c.objects.link(o)
    sc.collection.children.link(c); bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(b) for o in c.objects if o.type == "MESH" for b in o.bound_box]
    sc.collection.children.unlink(c)
    mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))); mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    c.instance_offset = Vector(((mn.x + mx.x) / 2, (mn.y + mx.y) / 2, mn.z))
    return c, mx - mn


def place(c, name, loc, rot=0.0, scale=1.0):
    e = bpy.data.objects.new(name, None); e.instance_type = "COLLECTION"; e.instance_collection = c
    e.location = loc; e.rotation_euler.z = rot; e.scale = (scale,) * 3; sc.collection.objects.link(e); return e


import bmesh
S = 70 if PREVIEW else 170
bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=S, y_segments=S, size=RX * 1.2)
for v in bm.verts:
    v.co.y *= RY / RX; v.co.z = h(v.co.x, v.co.y)
bmesh.ops.delete(bm, geom=[f for f in bm.faces if all(v.co.z <= -2.9 for v in f.verts)], context="FACES")
me = bpy.data.meshes.new("Ile"); bm.to_mesh(me); bm.free()
ile = bpy.data.objects.new("Ile", me); sc.collection.objects.link(ile)
for p in me.polygons:
    p.use_smooth = True
ile.data.materials.append(terrain_mat())
# esplanade pavée devant l'immeuble (dalle fine posée sur le plat)
pave = IM.mat("PavesQuai", (0.33, 0.31, 0.29), 0.85, bump=0.4, nscale=3)
bpy.ops.mesh.primitive_plane_add(size=1); esp = bpy.context.active_object; esp.name = "Esplanade"
e0 = BLD + U * 1.5; e1 = Vector((QX, QY, 0)) + U * (QUAI_S - 0.7); c_ = (e0 + e1) / 2
esp.location = (c_.x, c_.y, GROUND + 0.01); esp.rotation_euler.z = math.atan2(U.y, U.x)
esp.scale = ((e1 - e0).length, 20, 1); esp.data.materials.append(pave)

# mur de quai en granit le long du bord, de -12 à +12 m de part et d'autre du ponton
mq = IM.mat("GranitQuai", (0.36, 0.35, 0.33), 0.85, bump=0.5, nscale=4)
bpy.ops.mesh.primitive_cube_add(size=1); wq = bpy.context.active_object; wq.name = "MurQuai"
c0 = Vector((QX, QY, 0)) + U * (QUAI_S - 0.35)
wq.location = (c0.x, c0.y, (GROUND - 2.4) / 2); wq.rotation_euler.z = math.atan2(U.y, U.x); wq.scale = (0.7, 26, GROUND + 2.4); wq.data.materials.append(mq)
bpy.ops.mesh.primitive_cube_add(size=1); cq = bpy.context.active_object; cq.name = "Couronnement"
cq.location = (c0.x + U.x * 0.05, c0.y + U.y * 0.05, GROUND + 0.06); cq.rotation_euler.z = math.atan2(U.y, U.x); cq.scale = (0.85, 26, 0.16); cq.data.materials.append(mq)
for i in range(5):
    bp_ = c0 + U * 0.25 + N_ * (-10 + i * 5)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.18, depth=0.5, location=(bp_.x, bp_.y, GROUND + 0.38), vertices=16); bpy.context.active_object.data.materials.append(IM.mat("BitteFonte", (0.05, 0.05, 0.06), 0.4))

# passerelle en bois : du couronnement du quai jusqu'au plancher du ponton
bois_p = IM.mat("BoisPasserelle", (0.33, 0.24, 0.16), 0.8, bump=0.3, nscale=12)
p0 = Vector((QX, QY, 0)) + U * (QUAI_S - 0.2); p1 = Vector((QX, QY, 0)) + U * (QUAI_S + 2.6)
L_ = (p1 - p0).length; z0_, z1_ = GROUND + 0.12, DECK + 0.06; ang = math.atan2(z0_ - z1_, L_)
for lat, w_, h_ in ((0.0, 1.1, 0.07), (-0.58, 0.05, 0.05), (0.58, 0.05, 0.05)):
    bpy.ops.mesh.primitive_cube_add(size=1); o = bpy.context.active_object; o.name = "Passerelle"
    c = (p0 + p1) / 2 + N_ * lat; o.location = (c.x, c.y, (z0_ + z1_) / 2 + (0.9 if w_ < 0.1 else 0))
    o.rotation_euler = (0, ang, math.atan2(U.y, U.x)); o.scale = (L_ / math.cos(ang), w_, h_); o.data.materials.append(bois_p)
for t_ in (0.15, 0.5, 0.85):
    for lat in (-0.58, 0.58):
        q_ = p0.lerp(p1, t_) + N_ * lat; zq = z0_ + (z1_ - z0_) * t_
        bpy.ops.mesh.primitive_cylinder_add(radius=0.025, depth=0.9, location=(q_.x, q_.y, zq + 0.45), vertices=8); bpy.context.active_object.data.materials.append(bois_p)

# mer
bpy.ops.mesh.primitive_plane_add(size=2); sea = bpy.context.active_object; sea.name = "Mer"
om = sea.modifiers.new("Ocean", "OCEAN"); om.geometry_mode = "GENERATE"; om.size = 1; om.spatial_size = 100
om.repeat_x = om.repeat_y = 3; om.resolution = 8 if PREVIEW else 16; om.wave_scale = 0.5; om.choppiness = 1.1; om.wind_velocity = 7
sea.location = (-150, -150, 0); bpy.ops.object.shade_smooth()
bpy.ops.mesh.primitive_plane_add(size=6000, location=(0, 0, -0.3)); far = bpy.context.active_object
eau = IM.mat("Eau", (0.01, 0.09, 0.12), 0.04, transm=0.6)
sea.data.materials.append(eau); far.data.materials.append(eau)

# ponton (river jetty, floor2727, CC-BY), comme en v2
C_QUAI, dq = lib_collection("quai.blend", "Quai")
# on ne garde que le ponton : l'abri et la cale (côté terre, y local < 0,5) cachaient la porte de l'immeuble
for o in list(C_QUAI.objects):
    if o.type == "MESH" and max((o.matrix_world @ Vector(c)).y for c in o.bound_box) < 0.5:
        bpy.data.objects.remove(o, do_unlink=True)
place(C_QUAI, "Quai", (QX, QY, DECK - J_DECK), QROT)

# l'immeuble et son studio
B = IM.build(sc, None, None, with_interior=True)
B.root.location = (BLD.x, BLD.y, GROUND); B.root.rotation_euler.z = BROT
MW = Matrix.Translation((BLD.x, BLD.y, GROUND)) @ Matrix.Rotation(BROT, 4, "Z")
def W(p):
    return MW @ Vector(p)

# Elba amarrée le long du ponton, proue vers le large
EL = Vector((QX, QY, 0)) + U * 5.0 + N_ * 2.75
before = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=ELBA)
eroot = bpy.data.objects.new("Elba", None); sc.collection.objects.link(eroot)
for o in [o for o in bpy.data.objects if o not in before]:
    if o.parent is None and o is not eroot:
        o.parent = eroot
eroot.location = (EL.x, EL.y, 0.0); eroot.rotation_euler.z = math.atan2(U.y, U.x)

# arbres Poly Haven (CC0), hors de l'esplanade et de l'immeuble
def lib_each(fname):
    with bpy.data.libraries.load(os.path.join(ASSETS, fname), link=False) as (src, dst):
        dst.objects = list(src.objects)
    out = []
    for o in dst.objects:
        if o is None or o.type != "MESH":
            continue
        c = bpy.data.collections.new("Lib_" + o.name); c.objects.link(o); o.location = (0, 0, 0); out.append(c)
    return out
TREES = lib_each("arbre_cotier.blend") * 2 + lib_each("pins.blend")
for k in range(150):
    x, y = random.uniform(-RX * 0.85, RX * 0.85), random.uniform(-RY * 0.85, RY * 0.85)
    z = h(x, y); p = Vector((x, y, 0))
    if z < 1.2 or seg_d(p, BLD + U * 4, ROOTJ) < 16 or (p - BLD).length < 14:
        continue
    c = random.choice(TREES)
    s_ = random.uniform(0.6, 1.0) if "pine" in c.name else random.uniform(0.9, 1.4)
    place(c, "Arbre", (x, y, z - 0.2), random.uniform(0, 6.28), s_)

# lumière de fin d'après-midi, venant du large (sud-ouest)
w = bpy.data.worlds.new("Monde"); sc.world = w; w.use_nodes = True
nt = w.node_tree; bg = next(n for n in nt.nodes if n.type == "BACKGROUND")
env = nt.nodes.new("ShaderNodeTexEnvironment"); env.image = bpy.data.images.load(os.path.join(ASSETS, "umhlanga_sunrise_2k.hdr"))
mp = nt.nodes.new("ShaderNodeMapping"); tc = nt.nodes.new("ShaderNodeTexCoord"); mp.inputs["Rotation"].default_value[2] = math.radians(250)
nt.links.new(tc.outputs["Generated"], mp.inputs["Vector"]); nt.links.new(mp.outputs["Vector"], env.inputs["Vector"]); nt.links.new(env.outputs["Color"], bg.inputs["Color"])
sun = bpy.data.lights.new("Soleil", "SUN"); sun.energy = 3.6; sun.angle = math.radians(1.5); sun.color = (1, 0.82, 0.62)
so = bpy.data.objects.new("Soleil", sun); sc.collection.objects.link(so); so.rotation_euler = (math.radians(68), 0, math.radians(-60))
# dans le studio : lumière douce de la baie + suspension
la = bpy.data.lights.new("Baie", "AREA"); la.energy = 140; la.size = 1.8; la.color = (1, 0.92, 0.82)
lo = bpy.data.objects.new("Baie", la); sc.collection.objects.link(lo); lo.parent = B.root; lo.location = (IM.BAY_A, IM.RY0 + 0.05, IM.FLOOR + 1.2); lo.rotation_euler = (math.radians(90), 0, 0)
lp = bpy.data.lights.new("Suspension", "POINT"); lp.energy = 40; lp.color = (1, 0.8, 0.55); lp.shadow_soft_size = 0.15
lpo = bpy.data.objects.new("Suspension", lp); sc.collection.objects.link(lpo); lpo.parent = B.root; lpo.location = (-1.75, 1.5, IM.CEIL - 0.85)

cd = bpy.data.cameras.new("Cam"); cam = bpy.data.objects.new("Cam", cd); sc.collection.objects.link(cam); sc.camera = cam; cd.clip_end = 5000; cd.clip_start = 0.02
try:
    sc.render.engine = "CYCLES"
except TypeError as e:
    print(e)
sc.cycles.samples = 20 if PREVIEW else 140; sc.cycles.use_denoising = True
try:
    prefs = bpy.context.preferences.addons["cycles"].preferences; prefs.compute_device_type = "METAL"; prefs.get_devices()
    for dv in prefs.devices:
        dv.use = True
    sc.cycles.device = "GPU"
except Exception as e:
    print("GPU", e)
sc.view_settings.view_transform = "AgX"
sc.render.resolution_x, sc.render.resolution_y = 1600, 1000; sc.render.resolution_percentage = 50 if PREVIEW else 100


def shoot(view, loc, tgt, lens, dof=None):
    if view not in VUES:
        return
    cam.location = Vector(loc); cd.lens = lens
    cam.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    cd.dof.use_dof = bool(dof)
    if dof:
        cd.dof.focus_distance = (Vector(tgt) - Vector(loc)).length; cd.dof.aperture_fstop = dof
    sc.render.filepath = os.path.join(OUT, f"v3_{view}" + ("_preview" if PREVIEW else "") + ".png")
    bpy.ops.render.render(write_still=True); print("RENDERED", sc.render.filepath)


bpy.context.view_layer.update()
P = IM.POINTS
TX, TY = -1.75, 1.2
shoot("approche", BLD + U * 62 + N_ * 26 + Vector((0, 0, 13)), BLD + Vector((0, 0, 5)), 42)
shoot("quai", Vector((QX, QY, 0)) + U * 9 - N_ * 11 + Vector((0, 0, 6.5)), W((0.0, 0, 5.4)), 30)
shoot("panneau", W((IM.BAY_A - 2.5, -8.5, 1.65)), W((IM.BAY_A + 0.8, -1, IM.FLOOR + 0.9)), 30)
shoot("entree", W(P["entree"]), W((IM.BAY_A + 0.2, 0.6, IM.FLOOR + 1.0)), 17)
shoot("table", W((TX + 0.05, TY + 1.05, IM.TABLE + 0.6)), W((TX + 0.02, TY + 0.02, IM.TABLE)), 30, dof=5.0)
shoot("baie", W((IM.BAY_A + 0.35, 2.9, IM.FLOOR + 1.68)), Vector((EL.x, EL.y, 1.2)), 24)
import json
os.makedirs(os.path.join(ROOT, "web"), exist_ok=True)
json.dump({"points": {k: [round(c, 3) for c in W(v)] for k, v in P.items()}, "bld": [BLD.x, BLD.y, GROUND], "brot": BROT,
           "local": {"FLOOR": IM.FLOOR, "CEIL": IM.CEIL, "TABLE": IM.TABLE, "RX0": IM.RX0, "RX1": IM.RX1, "RY0": IM.RY0, "RY1": IM.RY1, "BAY_A": IM.BAY_A, "BAY_B": IM.BAY_B, "FW": IM.FW},
           "elba": [EL.x, EL.y], "u": [U.x, U.y], "deck": DECK, "ground": GROUND},
          open(os.path.join(ROOT, "web", "studio_points.json"), "w"), indent=1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, "blender", "insula_v3.blend"))
print("DONE", "points", {k: tuple(round(c, 2) for c in W(v)) for k, v in P.items()})
