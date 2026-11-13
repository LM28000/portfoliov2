"""L'immeuble du quai d'Insula (l'« insula ») et son studio témoin au 1er étage.
Module importé par ile_insula_v3.py. Tout est construit en coordonnées locales puis rattaché à un objet racine :
  x : le long de la façade (-4.5 .. 4.5), y : profondeur (façade extérieure en y = 0, l'intérieur vers +y), z : depuis le sol du quai.
Les murs sont un seul volume ; les ouvertures, le studio et les embrasures sont creusés par booléens EXACT appliqués.
Les accessoires sont posés sur les surfaces (sol du studio en z = FLOOR, plateau de table en z = TABLE)."""
import bpy, bmesh, math, os, random
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, "assets"); ST = os.path.join(A, "studio"); GEN = os.path.join(ST, "gen"); TEX = os.path.join(A, "cabine", "tex"); SC_ = os.path.join(A, "scenes")
W2, D, EAVE = 4.5, 8.0, 8.6           # demi-largeur, profondeur, égout du toit
FLOOR, CEIL = 3.0, 5.7                # studio : sol fini (avant parquet), plafond
RX0, RX1, RY0, RY1 = -4.15, 0.85, 0.35, 4.0   # pièce du studio (5,0 x 3,65 m = 18 m²)
BAY_A, BAY_B = -1.75, 2.4             # axes des travées (studio sur la travée A)
FW = 0.9                              # demi-largeur de la porte-fenêtre
PARQ = 0.02; TABLE = FLOOR + PARQ + 0.75
random.seed(5)
POINTS = {}


def bsdf(m):
    return next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")


_M = {}
def mat(name, col=(0.8, 0.8, 0.8), rough=0.5, metal=0.0, emit=None, es=0.0, transm=0.0, bump=0.0, nscale=8.0):
    if name in _M:
        return _M[name]
    m = bpy.data.materials.new(name); m.use_nodes = True; b = bsdf(m); nt = m.node_tree
    b.inputs["Base Color"].default_value = (*col, 1); b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal
    if transm:
        b.inputs["Transmission Weight"].default_value = transm; b.inputs["IOR"].default_value = 1.45
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1); b.inputs["Emission Strength"].default_value = es
    if bump:
        nz = nt.nodes.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = nscale; bp = nt.nodes.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = bump
        nt.links.new(nz.outputs["Fac"], bp.inputs["Height"]); nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])
    _M[name] = m; return m


def pbr(name, tex, scale=1.0, tint=None):
    if name in _M:
        return _M[name]
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; b = bsdf(m)
    tc = nt.nodes.new("ShaderNodeTexCoord"); mp = nt.nodes.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (scale,) * 3
    nt.links.new(tc.outputs["UV"], mp.inputs["Vector"])
    d = nt.nodes.new("ShaderNodeTexImage"); d.image = bpy.data.images.load(os.path.join(TEX, f"{tex}_diff_1k.jpg"), check_existing=True); nt.links.new(mp.outputs[0], d.inputs[0])
    out = d.outputs["Color"]
    if tint:
        mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"; mx.blend_type = "MULTIPLY"; mx.inputs[0].default_value = 1.0; mx.inputs[7].default_value = (*tint, 1)
        nt.links.new(out, mx.inputs[6]); out = mx.outputs[2]
    nt.links.new(out, b.inputs["Base Color"])
    r = nt.nodes.new("ShaderNodeTexImage"); r.image = bpy.data.images.load(os.path.join(TEX, f"{tex}_rough_1k.jpg"), check_existing=True); r.image.colorspace_settings.name = "Non-Color"
    nt.links.new(mp.outputs[0], r.inputs[0]); nt.links.new(r.outputs["Color"], b.inputs["Roughness"])
    _M[name] = m; return m


def img_mat(name, path, es=0.0, rough=0.5, screen=False):
    if name in _M:
        return _M[name]
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; b = bsdf(m)
    t = nt.nodes.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(path, check_existing=True); t.extension = "CLIP"
    if screen:
        nt.links.new(t.outputs["Color"], b.inputs["Emission Color"]); b.inputs["Emission Strength"].default_value = es
        b.inputs["Base Color"].default_value = (0.01, 0.01, 0.01, 1)
    else:
        nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
        if es:
            nt.links.new(t.outputs["Color"], b.inputs["Emission Color"]); b.inputs["Emission Strength"].default_value = es
    b.inputs["Roughness"].default_value = rough
    _M[name] = m; return m


class Builder:
    def __init__(self, sc):
        self.sc = sc
        self.root = bpy.data.objects.new("Immeuble", None); sc.collection.objects.link(self.root)

    def link(self, o):
        self.sc.collection.objects.link(o); o.parent = self.root; return o

    def boxes_mesh(self, name, boxes, mats):
        """un seul maillage fait de plusieurs pavés ; boxes = [(x0, x1, y0, y1, z0, z1, mat_index)]"""
        bm = bmesh.new()
        for (x0, x1, y0, y1, z0, z1, mi) in boxes:
            r = bmesh.ops.create_cube(bm, size=1.0)
            for v in r["verts"]:
                v.co.x = x0 + (v.co.x + 0.5) * (x1 - x0); v.co.y = y0 + (v.co.y + 0.5) * (y1 - y0); v.co.z = z0 + (v.co.z + 0.5) * (z1 - z0)
            for f in {f for v in r["verts"] for f in v.link_faces}:
                f.material_index = mi
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        uvl = bm.loops.layers.uv.verify()
        for f in bm.faces:
            nx, ny, nz = (abs(c) for c in f.normal)
            for l in f.loops:
                co = l.vert.co
                l[uvl].uv = (co.y, co.z) if nx >= max(ny, nz) else (co.x, co.z) if ny >= nz else (co.x, co.y)
        me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
        for m in mats:
            me.materials.append(m)
        o = bpy.data.objects.new(name, me); return self.link(o)

    def box(self, name, x0, x1, y0, y1, z0, z1, m, bevel=0.0, seg=2):
        o = self.boxes_mesh(name, [(x0, x1, y0, y1, z0, z1, 0)], [m])
        if bevel:
            md = o.modifiers.new("b", "BEVEL"); md.width = bevel; md.segments = seg; md.limit_method = "NONE"
        return o

    def boolean(self, target, cutter, op):
        md = target.modifiers.new("bool", "BOOLEAN"); md.operation = op; md.object = cutter; md.solver = "EXACT"
        md.use_self = True; md.use_hole_tolerant = True
        try:
            md.material_mode = "TRANSFER"
        except Exception:
            pass
        dg = bpy.context.evaluated_depsgraph_get(); me = bpy.data.meshes.new_from_object(target.evaluated_get(dg))
        target.modifiers.clear(); old = target.data; target.data = me; bpy.data.meshes.remove(old)
        bpy.data.objects.remove(cutter, do_unlink=True)

    def plane(self, name, c, w, h, m, rot=(math.pi / 2, 0, 0)):
        me = bpy.data.meshes.new(name)
        me.from_pydata([(-w / 2, -h / 2, 0), (w / 2, -h / 2, 0), (w / 2, h / 2, 0), (-w / 2, h / 2, 0)], [], [(0, 1, 2, 3)])
        uv = me.uv_layers.new()
        for i, p in enumerate([(0, 0), (1, 0), (1, 1), (0, 1)]):
            uv.data[i].uv = p
        me.materials.append(m); o = bpy.data.objects.new(name, me); self.link(o); o.location = c; o.rotation_euler = rot; return o

    def cyl(self, name, c, r, d, m, rot=(0, 0, 0), v=16):
        bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=d, location=c, rotation=rot, vertices=v)
        o = bpy.context.active_object; o.name = name; o.data.materials.append(m)
        for uc in list(o.users_collection):
            uc.objects.unlink(o)
        return self.link(o)

    def gltf(self, key, target, loc, rot=0.0, axis="max", floor=None, single=False):
        """modèle Poly Haven (glTF) : mis à l'échelle (plus grande dimension = target), posé par sa base en loc"""
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=os.path.join(ST, key, key + ".gltf"))
        objs = [o for o in bpy.data.objects if o not in before]
        if single:
            meshes = [o for o in objs if o.type == "MESH"]
            keep = max(meshes, key=lambda o: o.dimensions.x * o.dimensions.y * o.dimensions.z)
            for o in objs:
                if o is not keep and o.type == "MESH":
                    bpy.data.objects.remove(o, do_unlink=True)
            objs = [keep]; keep.parent = None
        g = bpy.data.objects.new(key, None); self.link(g)
        tops = [o for o in objs if o.parent is None or o.parent not in objs]
        for o in tops:
            o.parent = g
        bpy.context.view_layer.update()
        pts = [o.matrix_world @ Vector(b) for o in objs if o.type == "MESH" for b in o.bound_box]
        mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))); mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
        dim = mx - mn; s = target / (max(dim) if axis == "max" else dim.z)
        for o in tops:
            o.location = (o.location - Vector(((mn.x + mx.x) / 2, (mn.y + mx.y) / 2, mn.z))) * s; o.scale = o.scale * s
        g.location = loc; g.rotation_euler.z = rot
        return g, dim * s


def build(sc, loc, rot, with_interior=True):
    B = Builder(sc)
    enduit = mat("EnduitChaux", (0.84, 0.81, 0.74), 0.9, bump=0.15, nscale=14)
    granit = mat("GranitGris", (0.42, 0.41, 0.39), 0.8, bump=0.35, nscale=22)
    ardoise = mat("ArdoiseToit", (0.12, 0.14, 0.17), 0.45, bump=0.2, nscale=30)
    platre = mat("PlatreBlanc", (0.88, 0.87, 0.84), 0.85)
    bleu = mat("VoletBleuBreton", (0.1, 0.25, 0.42), 0.55)
    blanc = mat("MenuiserieBlanche", (0.9, 0.9, 0.88), 0.4)
    vitre = mat("VitreSombre", (0.02, 0.03, 0.04), 0.06)
    verre = mat("VerreClair", (0.92, 0.94, 0.95), 0.02, transm=1.0)
    fer = mat("FerForge", (0.03, 0.03, 0.035), 0.4, 0.7)
    bois = mat("PorteBois", (0.08, 0.16, 0.24), 0.45)

    # ---------------------------------------------------------------- murs : un seul volume, creusé
    walls = B.boxes_mesh("Murs", [(-W2, W2, 0, D, 0, EAVE, 0)], [enduit, platre, enduit])
    cuts = [(RX0, RX1, RY0, RY1, FLOOR, CEIL, 1),                                   # le studio (plâtre)
            (BAY_A - FW, BAY_A + FW, -0.1, RY0 + 0.01, FLOOR, FLOOR + 2.25, 1)]       # porte-fenêtre traversante
    for x, zs, w, h in ((BAY_A, 0.9, 0.7, 1.4), (BAY_B, 0.0, 0.6, 2.35), (BAY_B, 3.55, 0.6, 1.5), (BAY_A, 6.3, 0.6, 1.4), (BAY_B, 6.3, 0.6, 1.4)):
        cuts.append((x - w, x + w, -0.1, 0.2, zs + (0.0 if zs == 0.0 else 0.0), zs + h, 2))   # embrasures (fenêtres aveugles, porte d'entrée)
    cutter = B.boxes_mesh("Coupes", cuts, [enduit, platre, enduit])
    B.boolean(walls, cutter, "DIFFERENCE")
    # soubassement, chaînages d'angle, appuis et linteaux en granit, unis aux murs
    gr = [(-W2 - 0.04, W2 + 0.04, -0.04, D + 0.04, -0.6, 0.55, 0)]
    for sx in (-1, 1):
        x0 = sx * W2
        for k in range(10):
            z0 = 0.55 + k * 0.8; long_ = k % 2 == 0
            gr.append((min(x0, x0 - sx * (0.6 if long_ else 0.35)), max(x0, x0 - sx * (0.6 if long_ else 0.35)), -0.04, 0.0, z0, z0 + 0.38, 0))
    for x, zs, w, h in ((BAY_A, 0.9, 0.7, 1.4), (BAY_B, 3.55, 0.6, 1.5), (BAY_A, 6.3, 0.6, 1.4), (BAY_B, 6.3, 0.6, 1.4), (BAY_B, 0.0, 0.6, 2.35), (BAY_A, FLOOR, FW, 2.25)):
        gr.append((x - w - 0.12, x + w + 0.12, -0.06, 0.0, zs + h, zs + h + 0.3, 0))      # linteau
        if zs > 0.5 and zs != FLOOR:
            gr.append((x - w - 0.06, x + w + 0.06, -0.08, 0.0, zs - 0.1, zs, 0))         # appui
    gmesh = B.boxes_mesh("Granit", gr, [granit])
    B.boolean(walls, gmesh, "UNION")
    walls.data.polygons.foreach_set("use_smooth", [False] * len(walls.data.polygons))

    # ---------------------------------------------------------------- toit d'ardoise (pignons sur les côtés) et cheminées
    rh, ov = 3.2, 0.35
    me = bpy.data.meshes.new("Toit")
    v = [(-W2 - 0.15, -ov, EAVE - 0.1), (W2 + 0.15, -ov, EAVE - 0.1), (W2 + 0.15, D + ov, EAVE - 0.1), (-W2 - 0.15, D + ov, EAVE - 0.1),
         (-W2 - 0.15, D / 2, EAVE + rh), (W2 + 0.15, D / 2, EAVE + rh)]
    f = [(0, 1, 5, 4), (2, 3, 4, 5), (0, 4, 3), (1, 2, 5), (0, 3, 2, 1)]
    me.from_pydata(v, [], f); me.materials.append(ardoise); roof = B.link(bpy.data.objects.new("Toit", me))
    sol = roof.modifiers.new("e", "SOLIDIFY"); sol.thickness = 0.12
    pignon = B.boxes_mesh("Pignons", [], [enduit])
    pme = bpy.data.meshes.new("PignonsM")
    pv, pf = [], []
    for sx in (-1, 1):
        x = sx * W2; b0 = len(pv); pv += [(x, 0, EAVE - 0.1), (x, D, EAVE - 0.1), (x, D / 2, EAVE + rh - 0.12)]; pf.append((b0, b0 + 1, b0 + 2) if sx > 0 else (b0, b0 + 2, b0 + 1))
    pme.from_pydata(pv, [], pf); pme.materials.append(enduit); pignon.data = pme
    pignon.modifiers.new("e", "SOLIDIFY").thickness = 0.35
    for sx in (-1, 1):
        B.box("Cheminee", sx * W2 - 0.55 if sx > 0 else sx * W2 - 0.05, sx * W2 + 0.05 if sx > 0 else sx * W2 + 0.55, D / 2 - 0.45, D / 2 + 0.45, EAVE + rh - 0.6, EAVE + rh + 1.1, granit)
        B.box("ChemineeCouvre", sx * W2 - 0.6 if sx > 0 else sx * W2 - 0.1, sx * W2 + 0.1 if sx > 0 else sx * W2 + 0.6, D / 2 - 0.5, D / 2 + 0.5, EAVE + rh + 1.1, EAVE + rh + 1.2, granit)
    # lucarne au-dessus de la travée B
    B.box("Lucarne", BAY_B - 0.7, BAY_B + 0.7, 0.35, 1.7, EAVE - 0.1, EAVE + 1.5, enduit)
    B.box("LucarneToit", BAY_B - 0.85, BAY_B + 0.85, 0.2, 1.8, EAVE + 1.5, EAVE + 1.62, ardoise)
    B.box("LucarneVitre", BAY_B - 0.45, BAY_B + 0.45, 0.32, 0.36, EAVE + 0.15, EAVE + 1.25, vitre)

    # ---------------------------------------------------------------- menuiseries, volets, porte
    for x, zs, w, h in ((BAY_A, 0.9, 0.7, 1.4), (BAY_B, 3.55, 0.6, 1.5), (BAY_A, 6.3, 0.6, 1.4), (BAY_B, 6.3, 0.6, 1.4)):
        B.box("Vitre", x - w, x + w, 0.17, 0.2, zs, zs + h, vitre)
        B.box("Dormant", x - w, x + w, 0.12, 0.17, zs, zs + 0.06, blanc); B.box("Dormant", x - w, x + w, 0.12, 0.17, zs + h - 0.06, zs + h, blanc)
        B.box("Meneau", x - 0.03, x + 0.03, 0.12, 0.17, zs, zs + h, blanc); B.box("Traverse", x - w, x + w, 0.12, 0.17, zs + h * 0.55, zs + h * 0.55 + 0.04, blanc)
        for sx in (-1, 1):
            B.box("Volet", x + sx * (w + 0.03) - (0 if sx > 0 else w), x + sx * (w + 0.03) + (w if sx > 0 else 0), -0.08, -0.03, zs, zs + h, bleu)
    # porte d'entrée (travée B) avec imposte et plaque « Studio témoin »
    B.box("Porte", BAY_B - 0.6, BAY_B + 0.6, 0.12, 0.2, 0.0, 2.0, bois)
    B.box("Imposte", BAY_B - 0.6, BAY_B + 0.6, 0.15, 0.2, 2.0, 2.35, vitre)
    B.cyl("Poignee", (BAY_B + 0.45, 0.08, 1.05), 0.03, 0.08, mat("Laiton", (0.78, 0.58, 0.26), 0.3, 1.0), (math.pi / 2, 0, 0))
    B.plane("Plaque", (BAY_B + 1.05, -0.012, 1.55), 0.5, 0.25, img_mat("PlaqueMat", os.path.join(GEN, "plaque.png"), 0.0, 0.35))
    POINTS["porte"] = (BAY_B, -0.3, 1.2)
    # porte-fenêtre du studio : dormant, deux vantaux vitrés
    x0, x1, z0, z1 = BAY_A - FW, BAY_A + FW, FLOOR, FLOOR + 2.25
    for (a, b_, c, d_) in ((x0, x0 + 0.07, z0, z1), (x1 - 0.07, x1, z0, z1), (x0, x1, z1 - 0.07, z1), (BAY_A - 0.035, BAY_A + 0.035, z0, z1),
                           (x0, x1, z0, z0 + 0.12), (x0, x1, z0 + 1.0, z0 + 1.04)):
        B.box("PFDormant", a, b_, 0.14, 0.2, c, d_, blanc)
    B.box("PFVerre", x0 + 0.07, x1 - 0.07, 0.165, 0.175, z0 + 0.12, z1 - 0.07, verre)
    # balcon : dalle de granit, garde-corps en fer forgé, panneau À VENDRE
    bx0, bx1 = BAY_A - FW - 0.3, BAY_A + FW + 0.3
    B.box("BalconDalle", bx0, bx1, -1.0, 0.0, FLOOR - 0.16, FLOOR, granit)
    for i in range(4):
        B.box("Console", bx0 + 0.2 + i * (bx1 - bx0 - 0.4) / 3 - 0.08, bx0 + 0.2 + i * (bx1 - bx0 - 0.4) / 3 + 0.08, -0.8, 0.0, FLOOR - 0.45, FLOOR - 0.16, granit)
    for i in range(int((bx1 - bx0) / 0.12) + 1):
        x = bx0 + 0.04 + i * 0.12
        if x > bx1 - 0.03:
            break
        B.box("Barreau", x - 0.012, x + 0.012, -0.95, -0.926, FLOOR, FLOOR + 1.0, fer)
    for sy in (-0.95,):
        B.box("MainCourante", bx0, bx1, sy - 0.02, sy + 0.04, FLOOR + 1.0, FLOOR + 1.05, fer)
    for x in (bx0, bx1):
        B.box("RetourGC", x - 0.02, x + 0.02, -0.95, 0.0, FLOOR + 1.0, FLOOR + 1.05, fer)
        B.box("RetourBarreau", x - 0.012, x + 0.012, -0.6, -0.576, FLOOR, FLOOR + 1.0, fer)
    sign = B.box("PanneauDos", BAY_A - 1.0, BAY_A + 1.0, -1.0, -0.975, FLOOR + 0.05, FLOOR + 1.05, blanc)
    B.plane("PanneauAVendre", (BAY_A, -1.003, FLOOR + 0.55), 2.0, 1.0, img_mat("PanneauMat", os.path.join(GEN, "panneau_a_vendre.png"), 0.15, 0.45))
    for x in (BAY_A - 0.9, BAY_A + 0.9):
        B.box("Attache", x - 0.03, x + 0.03, -1.0, -0.93, FLOOR + 0.98, FLOOR + 1.06, fer)
    POINTS["panneau"] = (BAY_A, -1.3, FLOOR + 0.55)
    # numéro de rue, applique au-dessus de la porte
    B.cyl("Applique", (BAY_B, -0.12, 2.75), 0.09, 0.22, mat("Lanterne", (0.9, 0.85, 0.7), 0.3, emit=(1, 0.8, 0.55), es=4.0))

    if not with_interior:
        return B
    B.mark = set(bpy.data.objects)
    # ================================================================ le studio
    fl = FLOOR + PARQ
    B.box("Parquet", RX0, RX1, RY0, RY1, FLOOR, fl, pbr("ParquetChene", "plank_flooring_04", 0.5))
    B.box("Plinthes", RX0, RX1, RY1 - 0.02, RY1, fl, fl + 0.08, blanc); B.box("Plinthes", RX0, RX0 + 0.02, RY0, RY1, fl, fl + 0.08, blanc)
    # porte palière au fond
    B.box("PortePaliere", -0.75, 0.15, RY1 - 0.04, RY1, fl, fl + 2.05, mat("PortePalBlanche", (0.86, 0.86, 0.84), 0.35))
    B.cyl("PoigneeInt", (0.0, RY1 - 0.07, fl + 1.0), 0.012, 0.12, mat("Inox", (0.8, 0.8, 0.82), 0.2, 1.0), (0, math.pi / 2, 0))
    POINTS["entree"] = (-0.3, RY1 - 0.35, fl + 1.62)
    # table de chêne devant la baie, deux chaises
    oak = pbr("ChenePlateau", "oak_wood_planks", 1.0)
    tx, ty, tw, td = -1.75, 1.2, 1.4, 0.8
    B.box("Table", tx - tw / 2, tx + tw / 2, ty - td / 2, ty + td / 2, TABLE - 0.035, TABLE, oak, bevel=0.006)
    for sx in (-1, 1):
        for sy in (-1, 1):
            B.box("PiedTable", tx + sx * (tw / 2 - 0.08) - 0.025, tx + sx * (tw / 2 - 0.08) + 0.025, ty + sy * (td / 2 - 0.08) - 0.025, ty + sy * (td / 2 - 0.08) + 0.025, fl, TABLE - 0.035, oak)
    for x, r in ((tx - 0.35, math.pi + 0.08), (tx + 0.4, math.pi - 0.12)):
        B.gltf("painted_wooden_chair_01", 0.9, (x, ty + 0.62, fl), r, axis="z")
    # l'ordinateur (le seul écran) : la démo au repos, l'app au clic
    alu = mat("AluPC", (0.72, 0.73, 0.75), 0.28, 1.0)
    lx, ly = tx - 0.3, ty - 0.05
    B.box("PC_base", lx - 0.17, lx + 0.17, ly - 0.117, ly + 0.117, TABLE, TABLE + 0.012, alu, bevel=0.003)
    t_ = math.radians(14)
    lid = B.box("PC_capot", -0.17, 0.17, -0.003, 0.003, 0.0, 0.225, alu, bevel=0.002); lid.location = (lx, ly - 0.115, TABLE + 0.012); lid.rotation_euler = (t_, 0, 0)
    scr = B.plane("PC_ecran", (0, 0.0035, 0.1125), 0.32, 0.2, img_mat("EcranDemo", os.path.join(SC_, "ecran_cine.png"), 1.5, 0.12, screen=True), (math.pi / 2, 0, math.pi))
    scr.parent = lid
    POINTS["ordi"] = (lx, ly, TABLE + 0.12)
    # les annonces imprimées, en éventail, et le surligneur
    for i, (dx, dy, r) in enumerate(((0.28, -0.02, -0.18), (0.4, 0.06, 0.12), (0.52, -0.05, 0.32))):
        B.plane(f"Annonce{i}", (tx + dx, ty + dy, TABLE + 0.001 + i * 0.0008), 0.21, 0.297, img_mat(f"AnnonceMat{i}", os.path.join(GEN, f"annonce_{i}.png"), 0.0, 0.7), (0, 0, math.pi + r))
    B.cyl("Surligneur", (tx + 0.25, ty + 0.2, TABLE + 0.008), 0.008, 0.13, mat("Jaune", (0.98, 0.85, 0.05), 0.4), (math.pi / 2, 0, 0.7))
    POINTS["annonces"] = (tx + 0.4, ty, TABLE)
    # le carnet des amis, ouvert
    cx, cy = tx + 0.05, ty + 0.22
    B.box("CarnetCouv", cx - 0.215, cx + 0.215, cy - 0.15, cy + 0.15, TABLE, TABLE + 0.004, mat("CuirCarnet", (0.32, 0.12, 0.08), 0.6))
    B.plane("CarnetG", (cx + 0.105, cy, TABLE + 0.0065), 0.2, 0.28, img_mat("CarnetGMat", os.path.join(GEN, "carnet_gauche.png"), 0.0, 0.8), (0, math.radians(2), math.pi))
    B.plane("CarnetD", (cx - 0.105, cy, TABLE + 0.0065), 0.2, 0.28, img_mat("CarnetDMat", os.path.join(GEN, "carnet_droite.png"), 0.0, 0.8), (0, math.radians(-2), math.pi))
    B.box("CarnetPli", cx - 0.004, cx + 0.004, cy - 0.14, cy + 0.14, TABLE + 0.004, TABLE + 0.008, mat("PapierPli", (0.85, 0.82, 0.74), 0.8))
    POINTS["carnet"] = (cx, cy, TABLE)
    # les clés (porte-clés Insula), une tasse
    laiton = mat("Laiton", (0.78, 0.58, 0.26), 0.3, 1.0)
    kx, ky = tx - 0.55, ty + 0.26
    for dx, dy, r in ((0, 0, 0.022), (0.03, 0.01, 0.015)):
        bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=0.0025, location=(kx + dx, ky + dy, TABLE + 0.003)); t = bpy.context.active_object; t.data.materials.append(laiton)
        for uc in list(t.users_collection):
            uc.objects.unlink(t)
        B.link(t)
    B.box("Cle", kx + 0.035, kx + 0.095, ky - 0.006, ky + 0.006, TABLE, TABLE + 0.003, laiton).rotation_euler.z = 0.0
    tag = B.box("PorteCles", kx - 0.085, kx - 0.025, ky - 0.015, ky + 0.015, TABLE, TABLE + 0.004, mat("CuirBleu", (0.1, 0.15, 0.25), 0.5), bevel=0.003)
    B.plane("PorteClesTxt", (kx - 0.055, ky, TABLE + 0.0042), 0.055, 0.027, img_mat("PorteClesMat", os.path.join(SC_, "porte_cles.png"), 0.0, 0.5), (0, 0, math.pi))
    POINTS["cles"] = (kx, ky, TABLE)
    B.cyl("Tasse", (tx - 0.58, ty - 0.18, TABLE + 0.045), 0.04, 0.09, mat("Faience", (0.88, 0.86, 0.8), 0.25), v=24)
    # lampe d'architecte sur la table, suspension au-dessus
    B.gltf("desk_lamp_arm_01", 0.55, (tx - 0.62, ty - 0.28, TABLE), math.radians(30), axis="z")
    B.gltf("modern_ceiling_lamp_01", 0.42, (tx, ty + 0.3, CEIL - 0.75), 0.0)
    # cuisine contre le mur de droite, frigo près de l'entrée, la fiche aimantée
    B.box("PlanTravail", RX1 - 0.62, RX1, 1.55, 3.05, fl + 0.86, fl + 0.9, oak)
    B.box("Meubles", RX1 - 0.6, RX1, 1.56, 3.04, fl, fl + 0.86, blanc)
    for k in range(3):
        B.box("Facade", RX1 - 0.605, RX1 - 0.6, 1.58 + k * 0.49, 1.58 + k * 0.49 + 0.46, fl + 0.1, fl + 0.82, mat("FacadeGrise", (0.55, 0.6, 0.62), 0.4))
    B.box("Credence", RX1 - 0.02, RX1, 1.55, 3.05, fl + 0.9, fl + 1.5, mat("Zellige", (0.72, 0.82, 0.86), 0.15))
    B.box("Evier", RX1 - 0.5, RX1 - 0.15, 2.4, 2.8, fl + 0.88, fl + 0.905, mat("Inox", (0.8, 0.8, 0.82), 0.2, 1.0))
    B.gltf("vintage_electric_kettle", 0.25, (RX1 - 0.32, 1.85, fl + 0.9), math.radians(-100))
    B.box("Frigo", RX1 - 0.64, RX1, 3.2, 3.84, fl, fl + 1.8, mat("FrigoBlanc", (0.88, 0.88, 0.86), 0.25), bevel=0.03)
    fx = RX1 - 0.645
    B.plane("Fiche", (fx, 3.52, fl + 1.25), 0.3, 0.3 * 772 / 476, img_mat("FicheFrigo", os.path.join(SC_, "fiche.png"), 0.0, 0.6), (math.pi / 2, 0, -math.pi / 2))
    for dy, dz in ((-0.12, 1.47), (0.12, 1.47), (-0.12, 1.02)):
        B.cyl("Aimant", (fx - 0.004, 3.52 + dy, fl + dz), 0.018, 0.012, mat("Aim" + str(dz), random.choice([(0.8, 0.2, 0.15), (0.15, 0.45, 0.8), (0.95, 0.75, 0.1)]), 0.4), (0, math.pi / 2, 0))
    POINTS["frigo"] = (fx, 3.52, fl + 1.25)
    # coin salon : canapé, coussins, guéridon, plante, cadre, tapis
    B.gltf("Sofa_01", 1.85, (RX0 + 0.5, 2.55, fl), -math.pi / 2)
    B.gltf("throw_pillows_01", 0.5, (RX0 + 0.45, 2.2, fl + 0.45), -math.pi / 2 + 0.3)
    B.gltf("side_table_01", 0.5, (RX0 + 0.35, 1.25, fl), 0.0, axis="z")
    B.gltf("ceramic_vase_01", 0.2, (RX0 + 0.35, 1.25, fl + 0.5), 0.0, axis="z")
    B.gltf("anthurium_botany_01", 1.0, (RX1 - 0.95, RY1 - 0.45, fl), 0.6, axis="z", single=True)
    B.gltf("hanging_picture_frame_01", 0.7, (RX0 + 0.02, 2.55, fl + 1.35), -math.pi / 2)
    B.box("Tapis", RX0 + 0.9, RX0 + 2.3, 1.7, 3.4, fl, fl + 0.008, pbr("TapisLin", "rough_linen", 2.0, tint=(0.75, 0.62, 0.45)))
    # rideaux de lin de part et d'autre de la baie, mur du canapé bleu-gris
    lin_r = pbr("RideauLin", "rough_linen", 2.5, tint=(0.95, 0.92, 0.85))
    for sx in (-1, 1):
        x0 = BAY_A + sx * (FW + 0.05); x1 = BAY_A + sx * (FW + 0.55)
        B.box("Rideau", min(x0, x1), max(x0, x1), RY0 + 0.04, RY0 + 0.1, fl + 0.05, CEIL - 0.12, lin_r)
    B.box("Tringle", BAY_A - FW - 0.65, BAY_A + FW + 0.65, RY0 + 0.07, RY0 + 0.09, CEIL - 0.11, CEIL - 0.09, mat("Fer2", (0.05, 0.05, 0.05), 0.4, 0.6))
    B.box("MurCouleur", RX0, RX0 + 0.004, RY0, RY1, fl, CEIL, mat("BleuGris", (0.32, 0.42, 0.5), 0.85))
    POINTS["baie"] = (BAY_A, RY0, FLOOR + 1.5)
    for o in bpy.data.objects:
        if o not in B.mark:
            o["studio"] = 1
    return B
