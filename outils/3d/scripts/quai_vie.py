"""La vie du quai d'Insula, dans le repère de l'immeuble (immeuble.py) :
x le long de la façade, y < 0 vers le quai (le bord du quai est à y = -12,6), z = 0 au niveau du quai.
  - une terrasse de café (table, deux chaises, deux tasses), un banc contre la façade, des hortensias en pots ;
  - deux vélos, trois lampadaires (verres « VieLanterne », allumés la nuit par le site) ;
  - un coin de pêche près du bord : casiers, caisses, tonneau, panier, seau, cordage, bouée de sauvetage.
Les modèles Poly Haven (CC0) sont dans assets/quai_vie/<id>/<id>_1k.gltf. Appelé par ile_insula_v3.py."""
import bpy, bmesh, math, os, random
from mathutils import Vector
import immeuble as IM

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QV = os.path.join(ROOT, "assets", "quai_vie")
R = random.Random(11)


def tex_mat(name, png, tile):
    """matériau à image raccordable ; tile = taille d'une tuile en mètres (les UV sont en mètres)"""
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; b = IM.bsdf(m)
    tc = nt.nodes.new("ShaderNodeTexCoord"); mp = nt.nodes.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (1 / tile,) * 3
    t = nt.nodes.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(os.path.join(QV, "gen", png), check_existing=True)
    nt.links.new(tc.outputs["UV"], mp.inputs["Vector"]); nt.links.new(mp.outputs[0], t.inputs[0]); nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.85
    return m


def uv_metres(o):
    """UV en mètres, projetées sur la face dominante (après application de l'échelle)"""
    me = o.data; bm = bmesh.new(); bm.from_mesh(me); uvl = bm.loops.layers.uv.verify()
    for f in bm.faces:
        nx, ny, nz = (abs(c) for c in f.normal)
        for l in f.loops:
            c = l.vert.co
            l[uvl].uv = (c.y, c.z) if nx >= max(ny, nz) else (c.x, c.z) if ny >= nz else (c.x, c.y)
    bm.to_mesh(me); bm.free()


def apply_scale(o):
    me = o.data; S = o.scale.copy()
    for v in me.vertices:
        v.co = Vector((v.co.x * S.x, v.co.y * S.y, v.co.z * S.z))
    o.scale = (1, 1, 1)


class Vie(IM.Builder):
    def __init__(self, sc, parent):
        super().__init__(sc); self.root.name = "VieQuai"; self.root.parent = parent

    def mesh(self, name, bm, m):
        me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); me.materials.append(m)
        return self.link(bpy.data.objects.new(name, me))

    def ph(self, key, loc, rot=0.0, scale=1.0, maxpoly=1200, drop=()):
        """modèle Poly Haven à sa taille réelle, posé par sa base en loc (repère de l'immeuble)"""
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=os.path.join(QV, key, key + "_1k.gltf"))
        objs = [o for o in bpy.data.objects if o not in before]
        for o in [o for o in objs if any(d in o.name for d in drop)]:
            bpy.data.objects.remove(o, do_unlink=True); objs.remove(o)
        bpy.context.view_layer.update()     # boîte englobante avant tout rattachement (repère du modèle)
        pts = [o.matrix_world @ Vector(b) for o in objs if o.type == "MESH" for b in o.bound_box]
        mn = Vector([min(p[i] for p in pts) for i in range(3)]); mx = Vector([max(p[i] for p in pts) for i in range(3)])
        g = bpy.data.objects.new("Vie_" + key, None); self.link(g)
        tops = [o for o in objs if o.parent is None or o.parent not in objs]
        for o in tops:
            o.parent = g
        for o in tops:
            o.location = (o.location - Vector(((mn.x + mx.x) / 2, (mn.y + mx.y) / 2, mn.z))) * scale; o.scale = o.scale * scale
        for o in objs:
            if o.type == "MESH":
                o.name = "Vie_" + o.name
                if len(o.data.polygons) > maxpoly:
                    d = o.modifiers.new("Dec", "DECIMATE"); d.ratio = maxpoly / len(o.data.polygons)
        g.location = loc; g.rotation_euler.z = rot
        return g, (mx - mn) * scale


# ------------------------------------------------------------------ objets faits ici
def velo(V, name, loc, rot, couleur, lean=0.0):
    """un vélo de ville : cadre en tubes, deux roues, guidon, selle, panier avant"""
    cadre = IM.mat("VeloCadre_" + name, couleur, 0.35)
    noir = IM.mat("VeloNoir", (0.02, 0.02, 0.02), 0.6); chrome = IM.mat("VeloChrome", (0.55, 0.55, 0.55), 0.3)
    g = bpy.data.objects.new("Vie_" + name, None); V.link(g); g.location = loc; g.rotation_euler = (lean, 0, rot)
    r = 0.34
    A, Bk = Vector((-0.53, 0, r)), Vector((0.53, 0, r))                  # moyeux arrière, avant
    P = Vector((-0.08, 0, 0.30)); S = Vector((-0.2, 0, 0.82)); H = Vector((0.36, 0, 0.86)); F = Vector((0.42, 0, 0.62))
    def tube(a, b, rad, m, nm="Tube"):
        d = b - a; bpy.ops.mesh.primitive_cylinder_add(radius=rad, depth=d.length, vertices=6, location=(a + b) / 2)
        o = bpy.context.active_object; o.rotation_euler = d.to_track_quat("Z", "Y").to_euler(); o.data.materials.append(m)
        for uc in list(o.users_collection):
            uc.objects.unlink(o)
        V.link(o); o.parent = g; o.name = "Vie_" + name + nm; return o
    for c in (A, Bk):
        bpy.ops.mesh.primitive_torus_add(major_radius=r - 0.02, minor_radius=0.022, major_segments=24, minor_segments=5, location=c, rotation=(math.pi / 2, 0, 0))
        o = bpy.context.active_object; o.data.materials.append(noir)
        for uc in list(o.users_collection):
            uc.objects.unlink(o)
        V.link(o); o.parent = g; o.name = "Vie_" + name + "Roue"
        for k in range(8):                                                # rayons
            a = k * math.pi / 8; dv = Vector((math.cos(a), 0, math.sin(a))) * (r - 0.04)
            tube(c - dv, c + dv, 0.003, chrome, "Rayon")
    for a, b in ((A, P), (A, S), (P, S), (P, F), (S + Vector((0.02, 0, -0.05)), F + Vector((0, 0, 0.12))), (F, Bk)):
        tube(a, b, 0.018, cadre)
    tube(F + Vector((0, 0, 0.12)), H, 0.016, chrome); tube(H + Vector((0, -0.26, 0)), H + Vector((0, 0.26, 0)), 0.013, chrome)
    tube(S, S + Vector((0, 0, 0.08)), 0.012, chrome)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=12, ring_count=8, location=S + Vector((-0.02, 0, 0.1)))
    o = bpy.context.active_object; o.scale = (0.13, 0.07, 0.03); o.data.materials.append(IM.mat("VeloSelle", (0.22, 0.12, 0.06), 0.5))
    for uc in list(o.users_collection):
        uc.objects.unlink(o)
    V.link(o); o.parent = g; o.name = "Vie_" + name + "Selle"
    # garde-boues et panier en osier devant
    osier = IM.mat("Osier", (0.55, 0.4, 0.22), 0.8)
    pk = V.box("Vie_" + name + "Panier", 0.52, 0.82, -0.15, 0.15, 0.72, 0.92, osier); pk.parent = g
    return g


def hortensia(V, name, loc, teinte):
    """pot en terre cuite et boule d'hortensias (boules de fleurs sur un feuillage)"""
    terre = IM.mat("TerreCuite", (0.55, 0.26, 0.15), 0.85)
    bm = bmesh.new(); prof = [(0.0, 0.0), (0.2, 0.0), (0.26, 0.5), (0.29, 0.52), (0.29, 0.56), (0.0, 0.56)]
    seg = 20; rings = []
    for (rr, zz) in prof:
        rings.append([bm.verts.new((rr * math.cos(2 * math.pi * k / seg), rr * math.sin(2 * math.pi * k / seg), zz)) for k in range(seg)])
    for a, b in zip(rings, rings[1:]):
        for k in range(seg):
            bm.faces.new((a[k], a[(k + 1) % seg], b[(k + 1) % seg], b[k]))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    pot = V.mesh("Vie_" + name + "Pot", bm, terre); pot.location = loc
    feuille = IM.mat("FeuillageHortensia", (0.12, 0.26, 0.08), 0.8)
    fleur = IM.mat("Hortensia_" + teinte[0], teinte[1], 0.7)
    for k in range(16):
        a = R.uniform(0, 2 * math.pi); d = R.uniform(0, 0.24); z = 0.62 + R.uniform(0, 0.38) - d * 0.6
        bpy.ops.mesh.primitive_ico_sphere_add(radius=R.uniform(0.1, 0.15), subdivisions=1, location=(loc[0] + d * math.cos(a), loc[1] + d * math.sin(a), loc[2] + z))
        o = bpy.context.active_object; o.data.materials.append(fleur if k % 3 else feuille)
        for uc in list(o.users_collection):
            uc.objects.unlink(o)
        V.link(o); o.name = "Vie_" + name + "Fleur"
        for v in o.data.vertices:
            v.co *= 1 + 0.18 * R.uniform(-1, 1)
        for f_ in o.data.polygons:
            f_.use_smooth = True


def lampadaire(V, k, loc):
    """lampadaire de quai en fonte : socle, fût, crosse, lanterne à quatre verres"""
    fonte = IM.mat("FonteVerte", (0.03, 0.07, 0.05), 0.5)
    verre = IM.mat("VieLanterne", (0.95, 0.85, 0.6), 0.2, emit=(1, 0.75, 0.42), es=0.0)
    x, y = loc
    V.cyl("Vie_LampSocle", (x, y, 0.25), 0.16, 0.5, fonte, v=12)
    V.cyl("Vie_LampFut", (x, y, 1.9), 0.06, 2.9, fonte, v=12)
    V.cyl("Vie_LampBague", (x, y, 3.35), 0.09, 0.1, fonte, v=12)
    V.box("Vie_LampBase_%d" % k, x - 0.16, x + 0.16, y - 0.16, y + 0.16, 3.4, 3.47, fonte)
    V.box("Vie_LanterneVerre_%d" % k, x - 0.13, x + 0.13, y - 0.13, y + 0.13, 3.47, 3.88, verre)
    for sx in (-1, 1):
        for sy in (-1, 1):
            V.box("Vie_LampMontant", x + sx * 0.13 - 0.015, x + sx * 0.13 + 0.015, y + sy * 0.13 - 0.015, y + sy * 0.13 + 0.015, 3.47, 3.88, fonte)
    bm = bmesh.new(); r = bmesh.ops.create_cone(bm, cap_ends=True, segments=4, radius1=0.25, radius2=0.03, depth=0.22)
    bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=__import__("mathutils").Matrix.Rotation(math.pi / 4, 3, "Z"))
    top = V.mesh("Vie_LampChapeau_%d" % k, bm, fonte); top.location = (x, y, 3.99)
    V.cyl("Vie_LampPerche_%d" % k, (x, y, 4.14), 0.025, 0.08, fonte, v=8)   # perchoir des mouettes


def casier(V, name, loc, rot):
    """casier à homards : base en bois, cage demi-cylindrique en filet"""
    bois = IM.mat("CasierBois", (0.36, 0.27, 0.18), 0.85); filet = IM.mat("CasierFilet", (0.1, 0.22, 0.3), 0.7)
    g = bpy.data.objects.new("Vie_" + name, None); V.link(g); g.location = loc; g.rotation_euler.z = rot
    b = V.box("Vie_" + name + "Base", -0.38, 0.38, -0.25, 0.25, 0.0, 0.05, bois); b.parent = g
    bm = bmesh.new(); seg, L, rr = 8, 0.72, 0.25
    rows = []
    for i in range(4):
        x = -L / 2 + i * L / 3
        rows.append([bm.verts.new((x, rr * math.cos(math.pi * k / seg), 0.05 + rr * math.sin(math.pi * k / seg))) for k in range(seg + 1)])
    for a, c in zip(rows, rows[1:]):
        for k in range(seg):
            bm.faces.new((a[k], a[k + 1], c[k + 1], c[k]))
    cage = V.mesh("Vie_" + name + "Cage", bm, filet); cage.parent = g
    w = cage.modifiers.new("Filet", "WIREFRAME"); w.thickness = 0.012; w.use_replace = True
    for x in (-0.36, 0.36):                                                    # deux arceaux en bois
        bpy.ops.mesh.primitive_torus_add(major_radius=rr, minor_radius=0.014, major_segments=16, minor_segments=6, location=(x, 0, 0.05), rotation=(0, math.pi / 2, 0))
        o = bpy.context.active_object; o.data.materials.append(bois)
        bpy.context.view_layer.update(); bm2 = bmesh.new(); bm2.from_mesh(o.data)
        bmesh.ops.delete(bm2, geom=[v for v in bm2.verts if (o.matrix_world @ v.co).z < 0.045], context="VERTS"); bm2.to_mesh(o.data); bm2.free()
        for uc in list(o.users_collection):
            uc.objects.unlink(o)
        V.link(o); o.parent = g; o.name = "Vie_" + name + "Arceau"
    return g


def cordage(V, name, loc, tours=7):
    """cordage lové à plat (spirale), en tube"""
    cv = bpy.data.curves.new(name, "CURVE"); cv.dimensions = "3D"; cv.bevel_depth = 0.018; cv.bevel_resolution = 0
    sp = cv.splines.new("POLY"); n = tours * 24; sp.points.add(n - 1)
    for i in range(n):
        a = i / 24 * 2 * math.pi; r = 0.08 + 0.038 * i / 24
        sp.points[i].co = (r * math.cos(a), r * math.sin(a), 0.02 + 0.006 * math.sin(i * 0.7), 1)
    o = bpy.data.objects.new("Vie_" + name, cv); o.data.materials.append(IM.mat("Cordage", (0.72, 0.62, 0.42), 0.9)); V.link(o); o.location = loc
    me = bpy.data.meshes.new_from_object(o.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    m = bpy.data.objects.new("Vie_" + name, me); V.link(m); m.location = loc; bpy.data.objects.remove(o, do_unlink=True); return m


def tasse(V, loc):
    fa = IM.mat("Faience", (0.92, 0.9, 0.86), 0.25); cafe = IM.mat("Cafe", (0.12, 0.06, 0.03), 0.2)
    V.cyl("Vie_Soucoupe", (loc[0], loc[1], loc[2] + 0.004), 0.06, 0.008, fa, v=20)
    V.cyl("Vie_Tasse", (loc[0], loc[1], loc[2] + 0.035), 0.035, 0.055, fa, v=20)
    V.cyl("Vie_TasseCafe", (loc[0], loc[1], loc[2] + 0.061), 0.031, 0.004, cafe, v=20)


# ------------------------------------------------------------------ le quai
def build(sc, root):
    V = Vie(sc, root)
    # terrasse de café, à gauche de l'immeuble, au soleil du soir
    V.ph("outdoor_table_chair_set_01", (-7.1, -3.0, 0), math.radians(90))
    bpy.context.view_layer.update()
    tab = next(o for o in bpy.data.objects if o.name.startswith("Vie_outdoor_table_chair_set_01_table"))
    zt = max((tab.matrix_world @ Vector(c)).z for c in tab.bound_box) - V.root.matrix_world.translation.z
    tasse(V, (-7.22, -2.9, zt)); tasse(V, (-6.95, -3.15, zt))
    V.ph("planter_box_01", (-9.2, -3.0, 0), math.radians(90))
    geranium = IM.mat("Geranium", (0.75, 0.08, 0.07), 0.7); feuil = IM.mat("FeuillageHortensia", (0.12, 0.26, 0.08), 0.8)
    for k in range(9):                                               # géraniums dans la jardinière
        y_ = -3.36 + k * 0.09; bpy.ops.mesh.primitive_ico_sphere_add(radius=R.uniform(0.07, 0.1), subdivisions=1, location=(-9.2 + R.uniform(-0.1, 0.1), y_, 0.44 + R.uniform(0, 0.06)))
        o = bpy.context.active_object; o.data.materials.append(geranium if k % 2 else feuil)
        for f_ in o.data.polygons:
            f_.use_smooth = True
        for uc in list(o.users_collection):
            uc.objects.unlink(o)
        V.link(o); o.name = "Vie_Geranium"
    hortensia(V, "HortTerrasse", (-9.0, -1.1, 0), ("rose", (0.78, 0.36, 0.55)))
    lampadaire(V, 0, (-9.3, -5.2))
    # contre la façade : vélo, banc, hortensias de part et d'autre de la porte
    velo(V, "VeloVert", (-3.55, -0.32, 0), 0.0, (0.16, 0.36, 0.32), lean=math.radians(-4))
    V.ph("painted_wooden_bench", (0.35, -0.42, 0), 0.0)
    hortensia(V, "HortPorteG", (1.35, -0.4, 0), ("bleu", (0.32, 0.42, 0.78)))
    hortensia(V, "HortPorteD", (4.0, -0.4, 0), ("bleu", (0.32, 0.42, 0.78)))
    velo(V, "VeloCreme", (4.82, 1.9, 0), math.radians(90), (0.85, 0.8, 0.66), lean=math.radians(4))
    # au bord du quai : lampadaires, bouée, coin de pêche
    lampadaire(V, 1, (-6.5, -11.7)); lampadaire(V, 2, (6.5, -11.7))
    V.cyl("Vie_PoteauBouee", (-3.8, -12.25, 0.6), 0.05, 1.2, IM.mat("BoisPoteau", (0.3, 0.22, 0.15), 0.8), v=10)
    V.ph("lifebuoy", (-3.8, -12.33, 0.42), math.radians(180))
    for i, (x, y, r_) in enumerate(((5.2, -10.9, 0.15), (6.0, -10.3, -0.3), (5.55, -10.6, 0.05))):
        casier(V, "Casier%d" % i, (x, y, 0.47 if i == 2 else 0), r_)
    V.ph("wooden_crate_02", (8.0, -10.2, 0), math.radians(70))
    V.ph("wooden_crate_01", (8.3, -9.0, 0), math.radians(-10))
    V.ph("wicker_basket_01", (8.3, -9.0, 0.35), math.radians(30))
    V.ph("barrel_03", (9.0, -10.9, 0), 0.0)
    V.ph("wooden_bucket_01", (2.4, -12.0, 0), 0.6)
    cordage(V, "Cordage", (3.0, -11.6, 0.0))
    return V.root


def bouee_mer(sc, loc):
    """bouée de chenal dans le bassin (animée par le site : « Vie_BoueeMer »)"""
    V = Vie(sc, None); V.root.name = "Vie_BoueeMer"
    g, d = V.ph("ocean_buoy", (0, 0, -0.9), 0.0, maxpoly=1500)
    V.root.location = loc
    return V.root
