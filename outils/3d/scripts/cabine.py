"""Cabine d'Elba (version « plus complète » que l'intérieur réel), rendue dans Blender pour validation.
Repère : +X = vers l'avant, +Y = bâbord, Z = 0 au plancher.
Usage : Blender -b --factory-startup -P cabine.py -- [vue1,vue2,...] [preview]"""
import bpy, bmesh, math, os, sys
from mathutils import Vector, Matrix

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, "assets", "cabine")
TEX, GEN = os.path.join(A, "tex"), os.path.join(A, "gen")
OUT = os.path.join(ROOT, "renders", "cabine"); os.makedirs(OUT, exist_ok=True)
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
PREVIEW = "preview" in argv
VIEWS = next((a.split(",") for a in argv if a != "preview"), ["ensemble", "carte", "coffre", "bouteilles", "photo", "vhf"])

sc = bpy.context.scene
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
coll = sc.collection

# ---------------------------------------------------------------- matières
def img(path, non_color=False):
    im = bpy.data.images.load(path, check_existing=True)
    if non_color: im.colorspace_settings.name = "Non-Color"
    return im

def pbr(name, tex=None, scale=1.0, color=(0.8, 0.8, 0.8), rough=0.5, metal=0.0, emit=None, es=1.0, image=None):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree
    b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal
    if tex or image:
        tc = nt.nodes.new("ShaderNodeTexCoord"); mp = nt.nodes.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (scale, scale, scale)
        nt.links.new(tc.outputs["UV"], mp.inputs["Vector"])
        if image:
            t = nt.nodes.new("ShaderNodeTexImage"); t.image = img(image); nt.links.new(mp.outputs[0], t.inputs[0]); nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
        else:
            d = nt.nodes.new("ShaderNodeTexImage"); d.image = img(os.path.join(TEX, tex + "_diff_1k.jpg")); nt.links.new(mp.outputs[0], d.inputs[0]); nt.links.new(d.outputs["Color"], b.inputs["Base Color"])
            r = nt.nodes.new("ShaderNodeTexImage"); r.image = img(os.path.join(TEX, tex + "_rough_1k.jpg"), True); nt.links.new(mp.outputs[0], r.inputs[0]); nt.links.new(r.outputs["Color"], b.inputs["Roughness"])
            nmap = nt.nodes.new("ShaderNodeTexImage"); nmap.image = img(os.path.join(TEX, tex + "_nor_gl_1k.jpg"), True); nt.links.new(mp.outputs[0], nmap.inputs[0])
            nm = nt.nodes.new("ShaderNodeNormalMap"); nt.links.new(nmap.outputs["Color"], nm.inputs["Color"]); nt.links.new(nm.outputs["Normal"], b.inputs["Normal"])
    else:
        b.inputs["Base Color"].default_value = (*color, 1)
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1); b.inputs["Emission Strength"].default_value = es
    return m

M = {
    "mur": pbr("Boiserie", "wood_plank_wall", 1.6),
    "sol": pbr("Plancher", "plank_flooring_04", 1.2),
    "lin": pbr("LinBleu", "rough_linen", 3.0),
    "chene": pbr("Chene", "oak_wood_planks", 1.0),
    "creme": pbr("PlafondCreme", color=(0.86, 0.84, 0.78), rough=0.75),
    "vaigrage": pbr("Vaigrage", color=(0.82, 0.78, 0.68), rough=0.85),
    "placage": pbr("PlacageTeck", "oak_wood_planks", 0.7),
    "tekhoux": pbr("TeckHoux", image=os.path.join(GEN, "teck_houx.jpg"), scale=1.4, rough=0.35),
    "alu": pbr("Alu", color=(0.75, 0.76, 0.78), rough=0.3, metal=1.0),
    "fumee": pbr("VerreFume", color=(0.0, 0.0, 0.0), emit=(0.006, 0.010, 0.026), es=1.0, rough=0.05),
    "teck": pbr("Teck", color=(0.28, 0.14, 0.06), rough=0.45),
    "laiton": pbr("Laiton", color=(0.78, 0.56, 0.24), rough=0.3, metal=1.0),
    "nuit": pbr("HublotNuit", color=(0.0, 0.0, 0.0), emit=(0.03, 0.06, 0.16), es=1.2),
    "noir": pbr("PlastiqueNoir", color=(0.02, 0.02, 0.022), rough=0.35),
    "verre": pbr("VerreBouteille", color=(0.75, 0.88, 0.8), rough=0.03),
    "liege": pbr("Liege", color=(0.55, 0.38, 0.22), rough=0.9),
    "email": pbr("EmailBlanc", color=(0.85, 0.85, 0.82), rough=0.25),
    "carte": pbr("Carte", image=os.path.join(GEN, "carte_parcours.jpg"), rough=0.8),
    "livre": pbr("PagesLivre", image=os.path.join(GEN, "livre_de_bord.jpg"), rough=0.85),
    "parchemin": pbr("Parchemin", image=os.path.join(GEN, "message_bouteille.jpg"), rough=0.85),
    "vhf": pbr("EcranVHF", image=os.path.join(GEN, "vhf_ecran.png"), rough=0.4),
    "photo": pbr("PhotoElba", image=os.path.join(ROOT, "renders", "realiste.png"), rough=0.4),
}
# coussins : lin teinté bleu marine
nt = M["lin"].node_tree; bb = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"); dif = [n for n in nt.nodes if n.type == "TEX_IMAGE"][0]
mx_ = nt.nodes.new("ShaderNodeMix"); mx_.data_type = "RGBA"; mx_.blend_type = "MULTIPLY"; mx_.inputs[0].default_value = 1.0; mx_.inputs[7].default_value = (0.10, 0.2, 0.55, 1)
nt.links.new(dif.outputs["Color"], mx_.inputs[6]); nt.links.new(mx_.outputs[2], bb.inputs["Base Color"])
# placage teck : chêne assombri, fil vertical
nt = M["placage"].node_tree; bb = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"); dif = [n for n in nt.nodes if n.type == "TEX_IMAGE"][0]
mx2 = nt.nodes.new("ShaderNodeMix"); mx2.data_type = "RGBA"; mx2.blend_type = "MULTIPLY"; mx2.inputs[0].default_value = 1.0; mx2.inputs[7].default_value = (0.62, 0.36, 0.2, 1)
nt.links.new(dif.outputs["Color"], mx2.inputs[6]); nt.links.new(mx2.outputs[2], bb.inputs["Base Color"])
next(n for n in nt.nodes if n.type == "MAPPING").inputs["Rotation"].default_value = (0, 0, math.pi / 2)
v = M["verre"].node_tree.nodes; b = next(n for n in v if n.type == "BSDF_PRINCIPLED"); b.inputs["Transmission Weight"].default_value = 0.9
for k in ("vhf",):  # écran rétroéclairé
    nt = M[k].node_tree; bb = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"); t = next(n for n in nt.nodes if n.type == "TEX_IMAGE")
    nt.links.new(t.outputs["Color"], bb.inputs["Emission Color"]); bb.inputs["Emission Strength"].default_value = 1.5

def mesh_obj(name, bm, mat):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); coll.objects.link(o); o.data.materials.append(mat)
    for p in o.data.polygons: p.use_smooth = True
    return o

def box(name, x0, x1, y0, y1, z0, z1, mat, bevel=0.012):
    bpy.ops.mesh.primitive_cube_add(size=1, location=((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2))
    o = bpy.context.active_object; o.name = name; o.scale = (x1 - x0, y1 - y0, z1 - z0)
    bpy.ops.object.transform_apply(scale=True)
    if bevel: m = o.modifiers.new("Bev", "BEVEL"); m.width = bevel; m.segments = 2
    bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.uv.cube_project(cube_size=0.6); bpy.ops.object.mode_set(mode="OBJECT")
    o.data.materials.append(mat); return o

def cyl(name, loc, r, depth, mat, rot=(0, 0, 0), verts=24):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc, rotation=rot)
    o = bpy.context.active_object; o.name = name; o.data.materials.append(mat); bpy.ops.object.shade_smooth(); return o

# ---------------------------------------------------------------- coque intérieure (flancs courbes)
X0, X1 = -2.3, 1.55   # carré : de la descente à la cloison avant
def half_w(z, x):
    """demi-largeur intérieure à la hauteur z (flanc galbé) ; se resserre vers l'avant"""
    base = 0.72 + 0.5 * math.sin(min(1, z / 1.0) * math.pi / 2) - 0.18 * max(0, (z - 1.1) / 0.75) ** 1.5
    taper = 1 - 0.12 * max(0, (x - 0.6) / 1.0)
    return base * taper

for side in (1, -1):
    bm = bmesh.new(); nx, nz = 24, 14; grid = []
    uv = bm.loops.layers.uv.new()
    for i in range(nx + 1):
        x = X0 + (X1 - X0) * i / nx; row = []
        for j in range(nz + 1):
            z = 1.85 * j / nz; row.append(bm.verts.new((x, side * half_w(z, x), z)))
        grid.append(row)
    for i in range(nx):
        for j in range(nz):
            vs = [grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]]
            f = bm.faces.new(vs if side < 0 else list(reversed(vs)))
            for l, (a, c) in zip(f.loops, ([(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)] if side < 0 else [(i, j + 1), (i + 1, j + 1), (i + 1, j), (i, j)])):
                l[uv].uv = ((X0 + (X1 - X0) * a / nx) * 0.7, 1.85 * c / nz * 0.7)
    fl = mesh_obj("Flanc" + ("Babord" if side > 0 else "Tribord"), bm, M["placage"]); fl.data.materials.append(M["vaigrage"])
    for pf in fl.data.polygons: pf.material_index = 1 if pf.center.z > 1.2 else 0

# plafond bombé + barrots
bm = bmesh.new(); uvl = bm.loops.layers.uv.new(); nx, ny = 20, 10; g = []
for i in range(nx + 1):
    x = X0 + (X1 - X0) * i / nx; w = half_w(1.85, x); r = []
    for j in range(ny + 1):
        y = -w + 2 * w * j / ny; r.append(bm.verts.new((x, y, 1.85 + 0.06 * (1 - (y / w) ** 2))))
    g.append(r)
for i in range(nx):
    for j in range(ny): bm.faces.new([g[i][j], g[i][j + 1], g[i + 1][j + 1], g[i + 1][j]])
mesh_obj("Plafond", bm, M["creme"])
for k in range(8):
    x = X0 + 0.25 + k * (X1 - X0 - 0.5) / 7; w = half_w(1.85, x)
    pass
for s_ in (1, -1):
    box("MainCourante", -1.2, 1.0, s_ * 0.42 - 0.02, s_ * 0.42 + 0.02, 1.76, 1.8, M["teck"], 0.008)
    for xx in (-1.15, -0.4, 0.35, 0.95): box("Pied", xx - 0.02, xx + 0.02, s_ * 0.42 - 0.015, s_ * 0.42 + 0.015, 1.8, 1.88, M["teck"], 0.003)

# plancher (entre les couchettes) et socle
box("Plancher", X0, X1, -0.36, 0.36, -0.05, 0.0, M["tekhoux"], 0)
# couchettes bâbord / tribord : coffre en chêne + coussin + dossier
for side in (1, -1):
    yi, yo = side * 0.36, side * 1.0
    box("Couchette", -1.35, 1.25, min(yi, yo), max(yi, yo), 0.0, 0.40, M["chene"])
    box("Coussin", -1.33, 1.23, min(yi, yo) + (0.02 if side < 0 else 0), max(yi, yo) - (0.02 if side > 0 else 0), 0.40, 0.52, M["lin"], 0.04)
    yb = side * 1.05
    box("Dossier", -1.3, 1.2, min(yb, side * 1.18), max(yb, side * 1.18), 0.52, 0.92, M["lin"], 0.05)
    # étagère à violons au-dessus du dossier
    ys = side * 1.02
    box("Etagere", -1.1, 1.0, min(ys, side * 1.24), max(ys, side * 1.24), 1.16, 1.19, M["teck"], 0.004)
    box("Violon", -1.1, 1.0, min(side * 1.02, side * 1.04), max(side * 1.02, side * 1.04), 1.19, 1.27, M["teck"], 0.003)

# table centrale à abattants
box("Table", -0.55, 0.65, -0.33, 0.33, 0.70, 0.735, M["chene"], 0.01)
box("PiedTable", 0.0, 0.1, -0.05, 0.05, 0.0, 0.70, M["teck"], 0.006)
for y in (-0.33, 0.33): box("Violon", -0.55, 0.65, y - 0.012, y + 0.012, 0.735, 0.765, M["teck"], 0.003)

# cloison avant, porte vers la pointe avant
xb = X1
w = half_w(1.0, xb)
box("CloisonG", xb - 0.03, xb, 0.33, w + 0.1, 0.0, 1.9, M["placage"], 0)
box("CloisonD", xb - 0.03, xb, -w - 0.1, -0.33, 0.0, 1.9, M["placage"], 0)
box("Linteau", xb - 0.03, xb, -0.34, 0.34, 1.62, 1.9, M["placage"], 0)
box("Seuil", xb - 0.03, xb, -0.34, 0.34, 0.0, 0.18, M["teck"], 0)
# pointe avant (couchette en V), un peu plus sombre au-delà de la porte
box("PointeAvant", xb, xb + 1.4, -0.75, 0.75, 0.0, 0.45, M["chene"])
box("CoussinV", xb + 0.02, xb + 1.35, -0.72, 0.72, 0.45, 0.55, M["lin"], 0.05)
box("FondPointe", xb + 1.4, xb + 1.43, -0.8, 0.8, 0.0, 1.8, M["mur"], 0)
for s in (1, -1): box("FlancPointe", xb, xb + 1.4, min(s * 0.75, s * 0.78), max(s * 0.75, s * 0.78), 0, 1.8, M["mur"], 0)
box("PlafondPointe", xb, xb + 1.43, -0.8, 0.8, 1.8, 1.83, M["creme"], 0)

# coin cuisine bâbord arrière, table à cartes tribord arrière
box("Cuisine", X0 + 0.05, -1.4, 0.38, 1.05, 0.0, 0.88, M["chene"])
box("PlanCuisine", X0 + 0.05, -1.4, 0.38, 1.05, 0.88, 0.91, M["teck"], 0.006)
M["inox"] = pbr("Inox", color=(0.7, 0.7, 0.72), rough=0.2, metal=1.0)
cyl("Evier", (-1.6, 0.6, 0.905), 0.14, 0.02, M["inox"])
box("TableCartes", X0 + 0.05, -1.4, -1.05, -0.38, 0.0, 0.78, M["chene"])
box("PlateauCartes", X0 + 0.05, -1.4, -1.05, -0.38, 0.78, 0.80, M["teck"], 0.006)
# carte du parcours posée sur la table à cartes (sous un rebord)
bpy.ops.mesh.primitive_plane_add(size=1, location=(-1.85, -0.715, 0.803)); carte = bpy.context.active_object; carte.name = "CarteParcours"; carte.scale = (0.78, 0.55, 1); carte.rotation_euler.z = math.radians(-2)
carte.data.materials.append(M["carte"])

cyl("Epontille", (0.78, 0.0, 0.93), 0.045, 1.86, M["alu"])
box("Rechaud", X0 + 0.06, -1.75, 0.82, 1.04, 0.91, 1.03, M["inox"] if "inox" in M else M["alu"], 0.01)
for k in range(2): 
    bpy.ops.mesh.primitive_torus_add(major_radius=0.05, minor_radius=0.006, location=(X0 + 0.2 + k * 0.17, 0.93, 1.035)); bpy.context.active_object.data.materials.append(M["noir"])
box("Tableau", X0 + 0.01, X0 + 0.03, -1.0, -0.45, 1.32, 1.55, M["noir"], 0.004)
for i in range(6):
    for j in range(2): box("Interrupteur", X0 + 0.03, X0 + 0.045, -0.98 + i * 0.085, -0.95 + i * 0.085, 1.38 + j * 0.09, 1.42 + j * 0.09, pbr("Voyant", color=(0.1, 0.1, 0.1), emit=(1, 0.25, 0.1) if (i + j) % 3 == 0 else (0.1, 0.8, 0.3), es=2), 0)
# cloison arrière, ouverte au centre sur la descente
wa = half_w(1.0, X0)
box("CloisonArG", X0 - 0.03, X0, 0.34, wa + 0.15, 0.0, 1.9, M["placage"], 0)
box("CloisonArD", X0 - 0.03, X0, -wa - 0.15, -0.34, 0.0, 1.9, M["placage"], 0)
box("LinteauAr", X0 - 0.03, X0, -0.35, 0.35, 1.7, 1.9, M["placage"], 0)
# descente (marches) derrière la caméra
for k in range(4): box("Marche", X0 - 0.35 + k * 0.0, X0 - 0.05, -0.3, 0.3, 0.25 + k * 0.4, 0.29 + k * 0.4, M["teck"], 0.006)

# hublots ovales et capot de pont (clair de lune)
for side in (1, -1):
    for (xa, xz) in ((-1.25, -0.35), (-0.15, 0.95)):
        z0, z1 = 1.5, 1.68; y = side * (half_w(1.59, (xa + xz) / 2) - 0.012)
        box("Fenetre", xa, xz, min(y, y - side * 0.01), max(y, y - side * 0.01), z0, z1, M["fumee"], 0.02)
        box("CadreFenetre", xa - 0.025, xz + 0.025, min(y + side * 0.004, y - side * 0.006), max(y + side * 0.004, y - side * 0.006), z0 - 0.025, z1 + 0.025, M["alu"], 0.02)
box("Capot", -0.4, 0.2, -0.28, 0.28, 1.88, 1.9, M["fumee"], 0)
box("CadreCapot", -0.43, 0.23, -0.31, 0.31, 1.86, 1.88, M["alu"], 0.01)

# ---------------------------------------------------------------- objets récupérés (Poly Haven)
def load(fname, loc, rot_z=0.0, scale=1.0, keep=None):
    with bpy.data.libraries.load(os.path.join(A, fname), link=False) as (src, dst):
        dst.objects = list(src.objects)
    objs = [o for o in dst.objects if o is not None]
    for o in objs:
        coll.objects.link(o)
    root = bpy.data.objects.new("Grp_" + fname.split(".")[0], None); coll.objects.link(root)
    bpy.context.view_layer.update()
    mn = Vector((1e9, 1e9, 1e9)); mx = Vector((-1e9, -1e9, -1e9))
    for o in objs:
        if o.type != "MESH": continue
        for c in o.bound_box:
            p = o.matrix_world @ Vector(c); mn = Vector(map(min, mn, p)); mx = Vector(map(max, mx, p))
    ctr = Vector(((mn.x + mx.x) / 2, (mn.y + mx.y) / 2, mn.z))
    for o in objs:
        if o.parent is None:
            o.location -= ctr; o.parent = root
    root.location = loc; root.rotation_euler.z = rot_z; root.scale = (scale,) * 3
    return root, {o.name: o for o in objs}

coffre, cparts = load("coffre.blend", (xb + 0.55, 0.0, 0.55), math.radians(-90), 0.6)
lid = next(o for n, o in cparts.items() if n.endswith("_lid"))
# rouleau du CV dans le coffre, noué d'un ruban rouge
cyl("RouleauCV", (xb + 0.55, 0.0, 0.70), 0.045, 0.42, M["parchemin"], (math.pi / 2, 0, 0))
cyl("Ruban", (xb + 0.55, 0.0, 0.70), 0.048, 0.04, pbr("RubanRouge", color=(0.6, 0.04, 0.03), rough=0.5), (math.pi / 2, 0, 0))
lanterne, _ = load("lanterne_bois.blend", (0.05, 0.0, 1.28), 0.3, 1.0)
laiton, _ = load("lanterne_laiton.blend", (-1.95, 0.48, 0.91), 0.0, 1.0)
cuir = pbr("CuirRouge", color=(0.25, 0.06, 0.04), rough=0.55)
box("Couverture", 0.0, 0.32, -0.23, 0.23, 0.735, 0.745, cuir, 0.004)
bpy.ops.mesh.primitive_grid_add(x_subdivisions=24, y_subdivisions=2, size=1, location=(0.16, 0.0, 0.762))
pg = bpy.context.active_object; pg.name = "PagesLivre"; pg.scale = (0.44, 0.30, 1); pg.rotation_euler.z = math.radians(90); bpy.ops.object.transform_apply(scale=True, rotation=True)
for vv in pg.data.vertices: vv.co.z += 0.018 * math.cos(vv.co.y / 0.22 * math.pi / 2) ** 0.5 - 0.006 * (abs(vv.co.y) < 0.012)
box("TranchePages", 0.015, 0.305, -0.215, 0.215, 0.745, 0.758, pbr("Tranche", color=(0.85, 0.8, 0.68), rough=0.9), 0.003)
pg.data.materials.append(M["livre"])
livres, _ = load("livres.blend", (-0.15, 1.13, 1.19), math.radians(90), 0.85)
compas, _ = load("compas.blend", (-1.5, -0.43, 0.80), math.radians(30), 1.4)
cadre, _ = load("cadre.blend", (xb - 0.035, 0.68, 1.02), math.radians(-90), 0.9)
appareil, _ = load("appareil_photo.blend", (0.8, 0.62, 0.52), math.radians(40), 1.0)
seau, _ = load("seau.blend", (-1.25, 0.55, 0.0), 0.4, 0.9)

# photo d'Elba dans le cadre (plan juste devant le verre)
bpy.context.view_layer.update()
gl = next(o for o in bpy.data.objects if o.name.startswith("hanging_picture_frame_03_glass"))
gmn = Vector((1e9,) * 3); gmx = Vector((-1e9,) * 3)
for c in gl.bound_box: p_ = gl.matrix_world @ Vector(c); gmn = Vector(map(min, gmn, p_)); gmx = Vector(map(max, gmx, p_))
gc = (gmn + gmx) / 2; gh = gmx.z - gmn.z; gw = gmx.y - gmn.y
bpy.ops.mesh.primitive_plane_add(size=1, location=(gmn.x - 0.002, gc.y, gc.z), rotation=(math.pi / 2, 0, math.radians(-90)))
ph = bpy.context.active_object; ph.name = "PhotoElba"; ph.scale = (gw * 0.98, gh * 0.98, 1)
mp_ = M["photo"]; nt = mp_.node_tree; bb = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"); tco = next(n for n in nt.nodes if n.type == "TEX_COORD")
sep = nt.nodes.new("ShaderNodeSeparateXYZ"); nt.links.new(tco.outputs["UV"], sep.inputs[0])
def mth(op, a, b_=None):
    n = nt.nodes.new("ShaderNodeMath"); n.operation = op
    for i, x in enumerate((a, b_)):
        if x is None: continue
        if isinstance(x, (int, float)): n.inputs[i].default_value = x
        else: nt.links.new(x, n.inputs[i])
    return n.outputs[0]
du = mth("MULTIPLY", mth("SUBTRACT", sep.outputs[0], 0.5), 2.0); dv = mth("MULTIPLY", mth("SUBTRACT", sep.outputs[1], 0.5), 2.0)
r2 = mth("ADD", mth("MULTIPLY", du, du), mth("MULTIPLY", dv, dv)); a_ = mth("LESS_THAN", r2, 1.0)
nt.links.new(a_, bb.inputs["Alpha"]); mp_.blend_method = "HASHED" if hasattr(mp_, "blend_method") else None
mpp = next(n for n in nt.nodes if n.type == "MAPPING"); mpp.inputs["Scale"].default_value = (0.62, 1.0, 1.0); mpp.inputs["Location"].default_value = (0.2, 0.0, 0.0)
ph.data.materials.append(mp_); bpy.context.view_layer.update(); mw = ph.matrix_world.copy(); ph.parent = cadre; ph.matrix_world = mw

# ---------------------------------------------------------------- objets modélisés : VHF, bouteilles, tasse, pavillons
# VHF fixée à la cloison arrière tribord, au-dessus de la table à cartes
vx, vy, vz = X0 + 0.07, -0.72, 1.18
box("VHF", vx, vx + 0.12, vy - 0.15, vy + 0.15, vz - 0.07, vz + 0.07, M["noir"], 0.012)
bpy.ops.mesh.primitive_plane_add(size=1, location=(vx + 0.121, vy - 0.04, vz + 0.01), rotation=(math.pi / 2, 0, math.pi / 2))
e = bpy.context.active_object; e.name = "EcranVHF"; e.scale = (0.13, 0.05, 1); e.data.materials.append(M["vhf"])
for k in range(2): cyl("Bouton", (vx + 0.13, vy + 0.07 + k * 0.05, vz), 0.016, 0.02, M["noir"], (0, math.pi / 2, 0))
box("Combine", vx + 0.02, vx + 0.07, vy + 0.17, vy + 0.21, vz - 0.12, vz + 0.04, M["noir"], 0.01)
# casier à bouteilles sur l'étagère tribord : bouteilles couchées, message roulé à l'intérieur
box("Casier", -0.95, 0.75, -1.2, -1.04, 1.19, 1.3, M["teck"], 0.006)
for k in range(5):
    x = -0.75 + k * 0.32; y, z = -1.12, 1.36
    grp = bpy.data.objects.new(f"BouteilleGrp{k}", None); coll.objects.link(grp); grp.location = (x, y, z)
    for o_ in (cyl(f"Bouteille{k}", (x, y, z), 0.045, 0.26, M["verre"], (0, math.pi / 2, 0)), cyl(f"Goulot{k}", (x + 0.16, y, z), 0.018, 0.08, M["verre"], (0, math.pi / 2, 0)),
               cyl(f"Bouchon{k}", (x + 0.205, y, z), 0.02, 0.03, M["liege"], (0, math.pi / 2, 0)), cyl(f"Message{k}", (x, y, z), 0.022, 0.16, M["parchemin"], (0, math.pi / 2, 0))):
        mw = o_.matrix_world.copy(); o_.parent = grp; o_.matrix_world = mw
    box("Cale", x - 0.1, x - 0.08, y - 0.07, y + 0.07, 1.3, 1.35, M["teck"], 0.003)
# tasse émaillée fumante
cyl("Tasse", (-0.3, -0.12, 0.775), 0.042, 0.085, M["email"])
bpy.ops.mesh.primitive_torus_add(major_radius=0.03, minor_radius=0.007, location=(-0.3, -0.17, 0.78), rotation=(math.pi / 2, 0, 0))
bpy.context.active_object.data.materials.append(M["email"])
# pavillons de signaux L et M sous le plafond
def flag(x, y, z, kind):
    s = 0.2; bpy.ops.mesh.primitive_plane_add(size=s, location=(x, y, z), rotation=(math.pi / 2, 0, 0)); f = bpy.context.active_object
    m = bpy.data.materials.new("Pavillon" + kind); m.use_nodes = True; nt = m.node_tree; bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"); bsdf.inputs["Roughness"].default_value = 0.9
    tc = nt.nodes.new("ShaderNodeTexCoord"); sep = nt.nodes.new("ShaderNodeSeparateXYZ"); nt.links.new(tc.outputs["UV"], sep.inputs[0])
    if kind == "L":  # damier jaune / noir
        gx = nt.nodes.new("ShaderNodeMath"); gx.operation = "GREATER_THAN"; gx.inputs[1].default_value = 0.5; nt.links.new(sep.outputs[0], gx.inputs[0])
        gy = nt.nodes.new("ShaderNodeMath"); gy.operation = "GREATER_THAN"; gy.inputs[1].default_value = 0.5; nt.links.new(sep.outputs[1], gy.inputs[0])
        xo = nt.nodes.new("ShaderNodeMath"); xo.operation = "COMPARE"; xo.inputs[2].default_value = 0.1; nt.links.new(gx.outputs[0], xo.inputs[0]); nt.links.new(gy.outputs[0], xo.inputs[1])
        mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"; mix.inputs[6].default_value = (0.02, 0.02, 0.02, 1); mix.inputs[7].default_value = (0.95, 0.75, 0.05, 1)
        nt.links.new(xo.outputs[0], mix.inputs[0]); nt.links.new(mix.outputs[2], bsdf.inputs["Base Color"])
    else:  # M : croix de Saint-André blanche sur bleu
        d1 = nt.nodes.new("ShaderNodeMath"); d1.operation = "SUBTRACT"; nt.links.new(sep.outputs[0], d1.inputs[0]); nt.links.new(sep.outputs[1], d1.inputs[1])
        a1 = nt.nodes.new("ShaderNodeMath"); a1.operation = "ABSOLUTE"; nt.links.new(d1.outputs[0], a1.inputs[0])
        s2 = nt.nodes.new("ShaderNodeMath"); s2.operation = "ADD"; nt.links.new(sep.outputs[0], s2.inputs[0]); nt.links.new(sep.outputs[1], s2.inputs[1])
        d2 = nt.nodes.new("ShaderNodeMath"); d2.operation = "SUBTRACT"; d2.inputs[1].default_value = 1.0; nt.links.new(s2.outputs[0], d2.inputs[0])
        a2 = nt.nodes.new("ShaderNodeMath"); a2.operation = "ABSOLUTE"; nt.links.new(d2.outputs[0], a2.inputs[0])
        mn_ = nt.nodes.new("ShaderNodeMath"); mn_.operation = "MINIMUM"; nt.links.new(a1.outputs[0], mn_.inputs[0]); nt.links.new(a2.outputs[0], mn_.inputs[1])
        lt = nt.nodes.new("ShaderNodeMath"); lt.operation = "LESS_THAN"; lt.inputs[1].default_value = 0.14; nt.links.new(mn_.outputs[0], lt.inputs[0])
        mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"; mix.inputs[6].default_value = (0.03, 0.12, 0.55, 1); mix.inputs[7].default_value = (0.95, 0.95, 0.95, 1)
        nt.links.new(lt.outputs[0], mix.inputs[0]); nt.links.new(mix.outputs[2], bsdf.inputs["Base Color"])
    f.data.materials.append(m); f.rotation_euler.z = math.radians(90); return f
for i, k in enumerate(["L", "M"]):
    flag(0.9 + 0.0, 0.18 - i * 0.26, 1.66, k)
cyl("Drisse", (0.9, 0.0, 1.77), 0.004, 0.9, M["teck"], (math.pi / 2, 0, 0))

# ---------------------------------------------------------------- lumière : lanternes chaudes, lune froide
def point(name, loc, color, energy, radius=0.05):
    l = bpy.data.lights.new(name, "POINT"); l.color = color; l.energy = energy; l.shadow_soft_size = radius
    o = bpy.data.objects.new(name, l); coll.objects.link(o); o.location = loc; return o
point("LanterneTable", (0.05, 0.0, 1.42), (1.0, 0.62, 0.32), 55)
point("LanterneCartes", (-1.55, -0.52, 0.98), (1.0, 0.6, 0.3), 14)
point("Pointe", (xb + 0.8, 0, 1.2), (1.0, 0.6, 0.32), 8)
point("DansCoffre", (xb + 0.55, -0.1, 0.95), (1.0, 0.75, 0.45), 6, 0.1)
point("Remplissage", (-1.8, 0, 1.6), (1.0, 0.7, 0.45), 22, 0.5)
point("Sol", (0.1, 0, 0.45), (1.0, 0.6, 0.35), 6, 0.3)
sun = bpy.data.lights.new("Lune", "AREA"); sun.color = (0.55, 0.65, 1.0); sun.energy = 12; sun.size = 0.6
so = bpy.data.objects.new("Lune", sun); coll.objects.link(so); so.location = (-0.1, 0, 1.95); so.rotation_euler = (0, 0, 0)
w = bpy.data.worlds.new("Nuit"); sc.world = w; w.use_nodes = True; next(n for n in w.node_tree.nodes if n.type == "BACKGROUND").inputs["Color"].default_value = (0.004, 0.006, 0.012, 1)
# flamme visible dans la lanterne de table
cyl("Flamme", (0.05, 0.0, 1.43), 0.012, 0.04, pbr("Flamme", color=(1, 0.6, 0.2), emit=(1, 0.55, 0.15), es=40))

# ---------------------------------------------------------------- rendu
try:
    sc.render.engine = "CYCLES"
except TypeError as e:
    print(e)
sc.cycles.samples = 48 if PREVIEW else 160; sc.cycles.use_denoising = True
try:
    sc.cycles.device = "GPU"; prefs = bpy.context.preferences.addons["cycles"].preferences; prefs.compute_device_type = "METAL"; prefs.get_devices()
    for d_ in prefs.devices: d_.use = True
except Exception as e:
    print("GPU", e)
sc.view_settings.view_transform = "AgX"
try: sc.view_settings.look = "AgX - Medium High Contrast"
except Exception: pass
sc.render.resolution_x, sc.render.resolution_y = (960, 600) if PREVIEW else (1600, 1000)
cam = bpy.data.objects.new("Cam", bpy.data.cameras.new("Cam")); coll.objects.link(cam); sc.camera = cam

def aim(loc, tgt, lens, up=None):
    cam.location = loc; d_ = Vector(tgt) - Vector(loc); cam.rotation_euler = d_.to_track_quat("-Z", "Y").to_euler(); cam.data.lens = lens
    if up is not None: cam.rotation_euler = (0, 0, up)
VUES = {
    "ensemble": ((-2.05, -0.15, 1.42), (1.4, 0.15, 0.85), 18),
    "carte": ((-1.86, -0.715, 1.45), (-1.85, -0.715, 0.80), 34),
    "coffre": ((xb + 0.05, -0.32, 1.32), (xb + 0.58, 0.0, 0.62), 26),
    "bouteilles": ((-0.1, -0.45, 1.5), (-0.1, -1.12, 1.33), 26),
    "photo": ((xb - 0.8, 0.55, 1.25), (xb - 0.05, 0.68, 1.245), 40),
    "vhf": ((-1.2, -0.45, 1.35), (X0 + 0.12, -0.72, 1.12), 26),
    "livre": ((0.16, 0.0, 1.32), (0.16, 0.0, 0.76), 36),
}
if "coffre" in VIEWS: lid.rotation_euler.x -= math.radians(0)
for name in VIEWS:
    if name not in VUES: continue
    if name == "coffre":  # couvercle ouvert autour de sa charnière (arête arrière)
        bpy.context.view_layer.update(); lmn = Vector((1e9,) * 3); lmx = Vector((-1e9,) * 3)
        for c in lid.bound_box: p_ = lid.matrix_world @ Vector(c); lmn = Vector(map(min, lmn, p_)); lmx = Vector(map(max, lmx, p_))
        hinge = Vector((lmx.x, (lmn.y + lmx.y) / 2, lmn.z + 0.02)); R = Matrix.Translation(hinge) @ Matrix.Rotation(math.radians(-100), 4, "Y") @ Matrix.Translation(-hinge)
        saved = lid.matrix_world.copy(); lid.matrix_world = R @ saved
    aim(*VUES[name], up={'carte': 0.0, 'livre': math.radians(90)}.get(name)); sc.render.filepath = os.path.join(OUT, f"cabine_{name}.png"); bpy.ops.render.render(write_still=True); print("RENDERED", sc.render.filepath)
    if name == "coffre": lid.matrix_world = saved
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, "blender", "cabine.blend"))
