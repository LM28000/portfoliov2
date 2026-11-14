"""Elba devient un vrai sous-marin : la coque elle-même se déforme, en continu, pilotée par t de 0 à 1.
Sub(loc, yaw) ; sub.pose(t) ; sub.key(frame).
1. le gréement rentre (voiles, câbles, bôme, mât télescopique) ;
2. le pont s'aplanit (rouf, cockpit, accastillage), la quille et le moteur rentrent ;
3. la coque se déforme : le tableau arrière s'étire en queue effilée, l'étrave s'arrondit en nez, le pont se bombe ;
   les couleurs passent du bleu et blanc au noir, l'antifouling devient le bas rouge du sous-marin ;
4. le kiosque monte, les ailerons en croix sortent de la queue, l'hélice repliable se déplie, les feux s'allument.
Repère d'Elba : +X étrave, +Y bâbord, Z = 0 à la flottaison."""
import bpy, bmesh, math, os, sys
from mathutils import Vector, Quaternion
HOME = os.path.expanduser("~/portfoliov2")
sys.path.insert(0, os.path.join(HOME, "3d", "scripts"))
import immeuble as IM
import elba as EL
M = IM.mat
sc = bpy.context.scene


def ss(a, b, t):
    x = max(0.0, min(1.0, (t - a) / (b - a))); return x * x * x * (x * (6 * x - 15) + 10)


def lerp(a, b, k): return a + (b - a) * k


PH = dict(voiles=(0.00, 0.20), cables=(0.12, 0.30), bome=(0.14, 0.30), mat=(0.20, 0.42), pont=(0.16, 0.36), plat=(0.18, 0.36),
          quille=(0.18, 0.34), moteur_bascule=(0.16, 0.26), moteur_rentre=(0.24, 0.36),
          forme=(0.38, 0.70), couleur=(0.42, 0.68), kiosque=(0.68, 0.82), ailerons=(0.72, 0.84), helice_sort=(0.72, 0.80),
          helice_deplie=(0.78, 0.86), feux=(0.80, 0.90), periscope=(0.84, 0.92), plonge=(0.88, 1.0))
T_SWAP = 0.37                                           # le pont est plat : la coque d'Elba laisse place à la coque déformable, identique
# le sous-marin : corps de révolution d'axe (y = 0, z = ZC)
ZC, RAY, XN, XM1, XM0, XS0, XT, RH = 0.12, 1.3, 4.2, 1.9, -1.7, -2.4, -6.5, 0.14
NOIR = (0.011, 0.013, 0.015)


def rayon(x):
    if x >= XM1: return RAY * math.sqrt(max(0.0, 1 - ((x - XM1) / (XN - XM1)) ** 2))
    if x >= XM0: return RAY
    s = min(1.0, (XM0 - x) / (XM0 - XT)); return RH + (RAY - RH) * (1 - s ** 1.8)


def _link(o, parent=None):
    for c in list(o.users_collection): c.objects.unlink(o)
    sc.collection.objects.link(o)
    if parent: o.parent = parent
    return o


def _empty(name, loc, parent=None):
    e = bpy.data.objects.new(name, None); sc.collection.objects.link(e); e.location = loc
    if parent: e.parent = parent
    return e


def _reparent(o, p):
    bpy.context.view_layer.update(); mw = o.matrix_world.copy(); o.parent = p; o.matrix_parent_inverse.identity(); o.matrix_world = mw


def _mesh(name, verts, faces, mats, parent, smooth=True, mat_idx=None):
    me = bpy.data.meshes.new(name); me.from_pydata(verts, [], faces); me.validate()
    for m in (mats if isinstance(mats, list) else [mats]): me.materials.append(m)
    for i, p in enumerate(me.polygons):
        p.use_smooth = smooth
        if mat_idx: p.material_index = mat_idx[i]
    return _link(bpy.data.objects.new(name, me), parent)


def _ext(o):
    bpy.context.view_layer.update(); pts = [o.matrix_world @ v.co for v in o.data.vertices]
    return pts, min(pts, key=lambda p: p.z), max(pts, key=lambda p: p.z)


def _hull_y(x, z):
    """demi-largeur de la coque d'Elba à (x, z) (sans l'élancement d'étrave) ; None hors de la coque"""
    u = EL.u_of_x(x); zs, zb = EL.sheer(u), EL.bottom(u)
    if z > zs or z < zb: return None
    st = ((zs - z) / (zs - zb)) ** (1 / 1.6); th = math.asin(min(1.0, st))
    return EL.half_beam(u) * max(0.0, math.cos(th)) ** 0.55


class Sub:
    def __init__(self, loc=(0, 0, 0), yaw=0.0):
        before = set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=os.path.join(HOME, "site", "assets", "elba.glb"))
        new = [o for o in bpy.data.objects if o not in before]
        self.root = next(o for o in new if o.type == "EMPTY" and o.name.startswith("Elba")); R = self.root
        self.parts = {}
        for o in new: self.parts.setdefault(o.name.split(".")[0], []).append(o)
        P = lambda k: self.parts.get(k, [])
        self.hull = P("Coque")[0]
        self.noir = M("SousMarinNoir", NOIR, 0.58)
        self.laiton = M("LaitonSM", (0.72, 0.52, 0.22), 0.3, 1.0)
        # --- gréement (comme avant) : génois enroulé sur l'étai, grand-voile tassée, câbles rembobinés, mât télescopique
        etai = P("Etai")[0]; _, lo_, hi_ = _ext(etai)
        self.e_gen = _empty("EnrouleurGenois", lo_, R); self.e_gen.rotation_mode = "QUATERNION"
        self.e_gen.rotation_quaternion = (hi_ - lo_).normalized().to_track_quat("Z", "X")
        for o in P("Genois"): _reparent(o, self.e_gen)
        self.e_bome = _empty("Vit-de-mulet", (0.78, 0.0, 1.6), R)
        for o in P("Bome") + P("GrandVoile") + P("Latte"): _reparent(o, self.e_bome)
        self.e_cab = []
        for k in ("Etai", "Pataras", "Hauban", "BasHauban"):
            for o in P(k):
                _, lo, _ = _ext(o); e = _empty("Enrouleur" + k, lo, R); _reparent(o, e); self.e_cab.append(e)
        _reparent(self.e_gen, self.e_cab[0]); bpy.context.view_layer.update(); self.q_gen = self.e_gen.rotation_quaternion.copy()
        self.e_mat = _empty("PiedDeMat", (0.80, 0.0, 0.93), R)
        for o in P("Mat"): _reparent(o, self.e_mat)
        self.e_barres = []
        for o in P("Barre"):
            e = _empty("Barre", (0.0, 0.0, 5.6 - 0.93), self.e_mat); _reparent(o, e); self.e_barres.append(e)
        self.e_tete = _empty("TeteDeMat", (0.80, 0.0, 9.2), R)
        for o in P("feu_tete"): _reparent(o, self.e_tete)
        # --- accastillage : s'abaisse jusqu'au pont et se resserre vers l'axe
        self.e_pont = _empty("Pont", (0, 0, 0.70), R)
        for k in ("Chandelier", "Filiere", "Balcon", "Bouee", "Balcon AR", "Taquet", "Winch", "Barre franche", "feu_babord", "feu_tribord"):
            for o in P(k): _reparent(o, self.e_pont)
        # le liston rentre dans la coque
        self.e_liston = _empty("Liston", (0, 0, 0.55), R)
        for o in P("Liston"): _reparent(o, self.e_liston)
        self._quille(); self._moteur(); self._pont_plat(); self._coque_sm(); self._kiosque(); self._queue(); self._feux()
        R.location = loc; R.rotation_euler = (0, 0, yaw); self.loc0 = Vector(loc); self.yaw = yaw

    # ------------------------------------------------------------------ quille et moteur
    def _quille(self):
        hull = self.hull; mw = hull.matrix_world.copy()
        bm = bmesh.new(); bm.from_mesh(hull.data)
        bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, -0.455), plane_no=(0, 0, 1))
        bas = lambda f: all(v.co.z < -0.45 for v in f.verts)
        k = bm.copy()
        bmesh.ops.delete(bm, geom=[f for f in bm.faces if bas(f)], context="FACES"); bmesh.ops.holes_fill(bm, edges=[e for e in bm.edges if e.is_boundary], sides=0)
        bm.to_mesh(hull.data); bm.free()
        bmesh.ops.delete(k, geom=[f for f in k.faces if not bas(f)], context="FACES"); bmesh.ops.delete(k, geom=[v for v in k.verts if not v.link_faces], context="VERTS")
        bmesh.ops.holes_fill(k, edges=[e for e in k.edges if e.is_boundary], sides=0)
        me = bpy.data.meshes.new("Quille"); k.to_mesh(me); k.free()
        for m in hull.data.materials: me.materials.append(m)
        q = bpy.data.objects.new("Quille", me); sc.collection.objects.link(q); q.matrix_world = mw
        self.e_quille = _empty("Quille", (0, 0, 0), self.root); _reparent(q, self.e_quille)

    def _moteur(self):
        self.e_mot = _empty("MoteurGlisse", (0, 0, 0), self.root)
        self.e_bascule = _empty("MoteurPivot", (-3.15, -0.5, 0.6), self.e_mot)
        for k in ("Capot moteur", "Chaise", "Embase", "Pied"):
            for o in self.parts.get(k, []): _reparent(o, self.e_bascule)

    # ------------------------------------------------------------------ le pont s'aplanit (clé de forme sur la coque d'Elba)
    def _pont_plat(self):
        me = self.hull.data
        if not me.shape_keys: self.hull.shape_key_add(name="Base")
        sk = self.hull.shape_key_add(name="Plat"); n = 0
        for i, v in enumerate(me.vertices):
            x, y, z = v.co; u = EL.u_of_x(x); zs = EL.sheer(u); hb = EL.half_beam(u)
            if x < EL.L_STERN + 0.06 and z < zs - 0.01: continue                       # tableau arrière
            if z <= zs + 0.004:
                yh = _hull_y(x, z)
                if yh is None or z < 0.12 or abs(y) > yh - 0.025: continue              # bordé extérieur, fond
            if abs(y) > hb: continue
            sk.data[i].co = (x, y, EL.deck_z(x, y) - 0.002); n += 1
        self.k_plat = sk; print("PONT PLAT", n, "sommets")
        # rouf, hublots et boiseries prennent la couleur du pont
        self.fondus = []
        blanc = IM.bsdf(next(m for m in me.materials if m.name.startswith("PontBlanc"))).inputs["Base Color"].default_value[:]
        for m in me.materials:
            if m.name.split(".")[0] in ("Rouf", "Hublot", "Bois"):
                b = IM.bsdf(m); self.fondus.append((b, tuple(b.inputs["Base Color"].default_value[:]), blanc))
        self.wl = max((self.hull.matrix_world @ me.vertices[vi].co).z for p in me.polygons if me.materials[p.material_index].name.startswith("Antifouling") for vi in p.vertices)
        print("FLOTTAISON", round(self.wl, 3))

    # ------------------------------------------------------------------ la coque déformable : Elba au pont plat -> corps de sous-marin
    def _coque_sm(self):
        NU, NT, NA = 80, 18, 72
        mats = {m.name.split(".")[0]: m for m in self.hull.data.materials}
        self.m_bleu = mats["CoqueBleue"].copy(); self.m_pont = mats["PontBlanc"].copy(); self.m_af = mats["Antifouling"].copy()
        self.c_bleu = tuple(IM.bsdf(self.m_bleu).inputs["Base Color"].default_value[:]); self.c_pont = tuple(IM.bsdf(self.m_pont).inputs["Base Color"].default_value[:])
        self.c_af = tuple(IM.bsdf(self.m_af).inputs["Base Color"].default_value[:])

        def pointA(u, a):
            if a <= math.pi:                                   # pont : de bâbord (a = 0) à tribord (a = pi)
                s = 1 - 2 * a / math.pi; x = EL.L_STERN + u * (EL.L_BOW - EL.L_STERN); y = EL.half_beam(u) * s
                return Vector((x, y, EL.deck_z(x, y))), True
            b = a - math.pi; th = b if b <= math.pi / 2 else math.pi - b
            x, yh, z = EL.hull_point(u, th); return Vector((x, -yh if b <= math.pi / 2 else yh, z)), False

        def pointB(x, a):
            r = rayon(x); return Vector((x, r * math.cos(a), ZC + r * math.sin(a)))
        rings = []                                            # (points A, points B, est_pont[])
        cen = None
        ring0 = [pointA(0.0, 2 * math.pi * j / NA) for j in range(NA)]
        cen = sum((p for p, _ in ring0), Vector()) / NA; self.x_tableau = cen.x
        for k in range(NT, 0, -1):                             # la queue : au départ, anneaux concentriques sur le tableau arrière
            rho = 1 - k / NT; xb = XS0 + (XT - XS0) * k / NT
            rings.append(([cen + (p - cen) * rho for p, _ in ring0], [pointB(xb, 2 * math.pi * j / NA) for j in range(NA)], [False] * NA))
        for i in range(NU):
            u = i / (NU - 1); xb = XS0 + (XN - XS0) * (u ** 0.92)
            A = [pointA(u, 2 * math.pi * j / NA) for j in range(NA)]
            rings.append(([p for p, _ in A], [pointB(xb, 2 * math.pi * j / NA) for j in range(NA)], [d for _, d in A]))
        vA, vB, fs, mi = [], [], [], []
        for (A, B_, _) in rings: vA += A; vB += B_
        vA.append(cen + (ring0[0][0] - cen) * 0); vB.append(Vector((XT, 0, ZC)))         # bouchon de la queue (moyeu)
        c_idx = len(vA) - 1
        for r in range(len(rings) - 1):
            for j in range(NA):
                a, b = r * NA + j, r * NA + (j + 1) % NA; c, d = a + NA, b + NA
                fs.append([a, b, d, c])
                pa = (vA[a] + vA[b] + vA[c] + vA[d]) / 4; deck = rings[r + 1][2][j] and rings[r + 1][2][(j + 1) % NA] and r >= NT
                mi.append(1 if deck else (2 if pa.z < self.wl else 0))
        for j in range(NA):
            fs.append([c_idx, (j + 1) % NA, j]); mi.append(2 if vA[j].z < self.wl else 0)
        o = _mesh("CoqueSousMarin", [tuple(v) for v in vA], fs, [self.m_bleu, self.m_pont, self.m_af], self.root, mat_idx=mi)
        o.shape_key_add(name="Elba"); kb = o.shape_key_add(name="SousMarin")
        for i, v in enumerate(vB): kb.data[i].co = v
        self.sm = o; self.k_forme = kb; o.hide_render = True
        bpy.context.view_layer.objects.active = o
        # arrondi propre des normales
        for p in o.data.polygons: p.use_smooth = True

    # ------------------------------------------------------------------ kiosque, barres de kiosque, périscope
    def _kiosque(self):
        R = self.root; self.e_kio = _empty("Kiosque", (0, 0, 0), R)
        L_, W_, z0, z1, xn, rr = 2.4, 0.5, ZC + RAY - 0.25, ZC + RAY + 1.45, 2.15, 0.08
        NP = 48

        def section(k_):
            pts = []
            for i in range(NP):
                a = 2 * math.pi * i / NP; c, s_ = math.cos(a), math.sin(a)
                xx = (1 - c) / 2                                        # 0 au nez, 1 au bord de fuite
                half = W_ / 2 * (1.48 * math.sqrt(max(0, xx)) - 0.62 * xx - 0.86 * xx * xx) / 0.62 * 0.62
                half = W_ / 2 * min(1.0, 2.2 * math.sqrt(max(0.0, xx)) * (1 - xx) ** 0.9)
                pts.append((xn - L_ * xx, math.copysign(half, s_) if abs(s_) > 1e-6 else 0.0))
            cx = xn - L_ / 2
            return [(cx + (x - cx) * k_, y * k_) for x, y in pts]
        levels = [(z0, 1.0)] + [(z1 - rr + rr * math.sin(math.pi / 2 * j / 4), 1 - (1 - math.cos(math.pi / 2 * j / 4)) * 0.12) for j in range(0, 5)]
        vs, fs = [], []
        for (z, k_) in levels:
            sh = 0.12 * (z - z0) / (z1 - z0)            # bord d'attaque légèrement incliné
            for (x, y) in section(k_): vs.append((x - sh * (1 if x > xn - L_ / 2 else 0.2), y, z))
        for j in range(len(levels) - 1):
            for i in range(NP): fs.append([j * NP + i, j * NP + (i + 1) % NP, (j + 1) * NP + (i + 1) % NP, (j + 1) * NP + i])
        fs.append(list(range((len(levels) - 1) * NP, len(levels) * NP))[::-1])
        _mesh("Kiosque", vs, fs, self.noir, self.e_kio)
        # barres de plongée du kiosque
        for side in (1, -1):
            vs2 = []; span, ch, zp, xp = 0.75, 0.55, ZC + RAY + 0.95, xn - 0.6
            for (yy, cs) in ((W_ * 0.3, 1.0), (span, 0.62)):
                for (dx, dz) in ((ch * 0.45 * cs, 0), (0, 0.04 * cs), (-ch * 0.55 * cs, 0), (0, -0.04 * cs)):
                    vs2.append((xp + dx - (0.12 if yy == span else 0), side * yy, zp + dz))
            f2 = [[0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7], [4, 5, 6, 7], [3, 2, 1, 0]]
            if side < 0: f2 = [f[::-1] for f in f2]
            _mesh("BarreKiosque", vs2, f2, self.noir, self.e_kio, smooth=False)
        # numéro de coque
        for side in (1, -1):
            cu = bpy.data.curves.new("Numero", "FONT"); cu.body = "S 28"; cu.align_x = "CENTER"; cu.align_y = "CENTER"; cu.size = 0.3; cu.extrude = 0.003
            t = bpy.data.objects.new("Numero", cu); t.data.materials.append(M("PeintureBlanche", (0.85, 0.85, 0.82), 0.6)); sc.collection.objects.link(t); t.parent = self.e_kio
            t.location = (xn - 0.95, side * (W_ / 2 * 0.97 + 0.004), ZC + RAY + 0.35); t.rotation_euler = (math.pi / 2, 0, 0 if side < 0 else math.pi)
        self.kio_tasse = 0.25         # rangé tassé dans la coque d'Elba (hauteur x 0,25), il se déploie une fois le dos formé

    # ------------------------------------------------------------------ queue : ailerons en croix, hélice repliable
    def _queue(self):
        R = self.root; self.ailerons = []
        xa, xb_, span = -4.95, -5.8, 0.66
        for k in range(4):
            ang = k * math.pi / 2; e = _empty("Aileron", (0, 0, ZC), R); e.rotation_euler.x = ang
            g = _empty("AileronGlisse", (0, 0, 0), e)
            ra, rb = rayon(xa) - 0.05, rayon(xb_) - 0.05
            vs = [(xa, 0, -0.035), (xa, 0, 0.035), (xb_, 0, 0.03), (xb_, 0, -0.03)]
            vs = []
            for (x, r0, dx) in ((xa, ra, 0.0), (xb_, rb, 0.0)):
                pass
            # profil : bord d'attaque en flèche, saumon plus court
            quad = [(xa, ra), (xb_, rb), (xb_ - 0.05, rb + span), (xa - 0.45, ra + span * 0.95)]
            vs = [(x, y, -0.035) for x, y in quad] + [(x, y, 0.035) for x, y in quad]
            fs = [[0, 1, 2, 3], [7, 6, 5, 4], [0, 4, 5, 1], [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 4, 0]]
            o = _mesh("Aileron", vs, fs, self.noir, g, smooth=False)
            bv = o.modifiers.new("Arrondi", "BEVEL"); bv.width = 0.02; bv.segments = 2
            self.ailerons.append((g, span + 0.08))
        # hélice : moyeu conique et sept pales repliables
        self.e_hel = _empty("Helice", (XT, 0, ZC), R)
        self.e_rot = _empty("HeliceRot", (0, 0, 0), self.e_hel)
        bronze = M("Bronze", (0.62, 0.42, 0.2), 0.28, 1.0)
        bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=RH * 1.05, radius2=0.03, depth=0.42, location=(-0.21, 0, 0), rotation=(0, -math.pi / 2, 0))
        hub = bpy.context.active_object; hub.data.materials.append(bronze); _link(hub, self.e_rot)
        for p in hub.data.polygons: p.use_smooth = True
        self.pales = []
        for k in range(7):
            a = 2 * math.pi * k / 7; hk = _empty("Charniere", (-0.12, 0, 0), self.e_rot); hk.rotation_euler.x = a
            pv = _empty("PalePivot", (0, 0, RH * 0.8), hk)
            bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=1, location=(0, 0, 0.36))
            b = bpy.context.active_object; b.scale = (0.12, 0.022, 0.36); b.rotation_euler = (0, math.radians(32), 0); b.data.materials.append(bronze); _link(b, pv)
            for p in b.data.polygons: p.use_smooth = True
            self.pales.append(pv)
        self.hel_in = 1.25

    # ------------------------------------------------------------------ feux : phares au nez, hublots sur les flancs
    def _feux(self):
        R = self.root; self.feux = []; self.sortants = []
        self.m_hub = M("HublotSM", (0.02, 0.03, 0.04), 0.06, emit=(1.0, 0.72, 0.42), es=0.0)
        self.m_phare = M("PhareSM", (0.7, 0.72, 0.74), 0.12, emit=(0.85, 0.95, 1.0), es=0.0)
        spots = []
        for side in (1, -1):
            for (x, a, rad, m) in ((3.25, math.radians(-12), 0.09, self.m_phare),) + tuple((xh, math.radians(18), 0.11, self.m_hub) for xh in (-0.9, -0.1, 0.7)):
                r = rayon(x); n = Vector((0, side * math.cos(a), math.sin(a)))
                e = _empty("Sortant", (x, 0, ZC), R)
                bpy.ops.mesh.primitive_cylinder_add(radius=rad, depth=0.05, vertices=28, location=(0, 0, 0))
                d = bpy.context.active_object; d.data.materials.append(m); _link(d, e)
                d.rotation_euler = n.to_track_quat("Z", "X").to_euler(); d.location = n * r
                bpy.ops.mesh.primitive_torus_add(major_radius=rad + 0.012, minor_radius=0.014, location=(0, 0, 0))
                t = bpy.context.active_object; t.data.materials.append(self.laiton); _link(t, e); t.rotation_euler = d.rotation_euler; t.location = n * (r + 0.01)
                self.sortants.append((e, n, x))
                if m is self.m_phare:
                    l = bpy.data.lights.new("PhareSM", "SPOT"); l.energy = 0; l.spot_size = math.radians(42); l.spot_blend = 0.6; l.color = (0.85, 0.95, 1.0)
                    lo = bpy.data.objects.new("PhareSM", l); sc.collection.objects.link(lo); lo.parent = e; lo.location = n * (r + 0.1) + Vector((0.05, 0, 0))
                    lo.rotation_euler = (Vector((1, side * 0.15, -0.2))).to_track_quat("-Z", "Y").to_euler(); self.feux.append(lo)
        l = bpy.data.lights.new("Interieur", "POINT"); l.energy = 0; l.color = (1.0, 0.72, 0.42)
        lo = bpy.data.objects.new("Interieur", l); sc.collection.objects.link(lo); lo.parent = R; lo.location = (0.0, 0, ZC + 0.4); self.interieur = lo

    # ------------------------------------------------------------------ la pose
    def pose(self, t, profondeur=1.5, tangage=0.0):
        k = lambda n: ss(*PH[n], t)
        kv = k("voiles"); g = self.e_gen; g.scale = (lerp(1, 0.04, kv), lerp(1, 0.04, kv), 1)
        g.rotation_quaternion = self.q_gen @ Quaternion((0, 0, 1), kv * 5 * math.pi)
        self.e_bome.scale = (lerp(1, 0.004, k("bome")), 1, lerp(1, 0.003, kv))
        kc = k("cables")
        for e in self.e_cab: e.scale = (lerp(1, 0.002, kc),) * 3
        for e in self.e_barres: e.scale = (1, lerp(1, 0.002, ss(0.10, 0.24, t)), 1)
        # mât : descend jusqu'à 2,35 m, puis remonte en périscope au-dessus du kiosque
        top = lerp(lerp(9.2, 2.2, k("mat")), ZC + RAY + 2.1, k("periscope")); h = top - 0.93
        self.e_mat.scale = (1, 1, h / (9.2 - 0.93)); self.e_tete.location = (0.80, 0, top)
        kp_ = k("pont"); self.e_pont.scale = (1, lerp(1, 0.8, kp_), lerp(1, 0.02, kp_))
        self.e_liston.scale = (1, lerp(1, 0.93, kp_), lerp(1, 0.12, kp_))
        self.e_quille.location.z = 0.74 * k("quille")
        self.e_bascule.rotation_euler.y = math.radians(90) * k("moteur_bascule")
        km2 = k("moteur_rentre"); self.e_mot.location = (1.55 * km2, 0, -0.45 * km2)
        # pont plat, puis bascule vers la coque déformable (identique à cet instant)
        kpl = k("plat"); self.k_plat.value = kpl
        for (b, c0, c1) in self.fondus: b.inputs["Base Color"].default_value = tuple(lerp(c0[i], c1[i], kpl) for i in range(4))
        swap = t >= T_SWAP; self.hull.hide_render = swap; self.hull.hide_viewport = swap; self.sm.hide_render = not swap; self.sm.hide_viewport = not swap
        self.k_forme.value = k("forme")
        kcol = k("couleur")
        for m, c0 in ((self.m_bleu, self.c_bleu), (self.m_pont, self.c_pont)):
            IM.bsdf(m).inputs["Base Color"].default_value = tuple(lerp(c0[i], (NOIR + (1,))[i], kcol) for i in range(4))
            IM.bsdf(m).inputs["Roughness"].default_value = lerp(0.3, 0.58, kcol)
        IM.bsdf(self.m_af).inputs["Base Color"].default_value = tuple(lerp(self.c_af[i], (0.42, 0.07, 0.04, 1)[i], kcol) for i in range(4))
        # pièces du sous-marin
        self.e_kio.scale = (1, 1, lerp(self.kio_tasse, 1, k("kiosque")))
        kfo = k("forme"); ka = k("ailerons")
        for (gg, d) in self.ailerons:        # suivent la queue qui s'allonge, puis coulissent hors de la queue
            gg.parent.location.x = lerp(3.0, 0, kfo); gg.scale = (1, lerp(0.4, 1, ka), 1); gg.location.y = -lerp(d, 0, ka) * lerp(0.4, 1, ka)
        self.e_hel.location.x = lerp(self.x_tableau + self.hel_in, XT + self.hel_in, kfo) - self.hel_in * k("helice_sort")   # suit la pointe de la queue
        kd = k("helice_deplie")
        for pv in self.pales: pv.rotation_euler.y = math.radians(lerp(-88, 0, kd))   # repliées vers l'arrière, puis en croix
        self.e_rot.rotation_euler.x = ss(0.86, 1.0, t) * 9 * math.pi
        for (e, n, x0) in self.sortants:     # rangés au fond de la coque d'Elba, ils affleurent une fois la forme prise
            e.location = Vector((lerp(min(x0, 1.6), x0, kfo), 0, ZC)) + n * -(lerp(0.12, 0, ka) + 0.6 * (1 - kfo))
        kf = k("feux")
        IM.bsdf(self.m_hub).inputs["Emission Strength"].default_value = 6.0 * kf; IM.bsdf(self.m_phare).inputs["Emission Strength"].default_value = 30.0 * kf
        for lo in self.feux: lo.data.energy = 2000 * kf

        kp = k("plonge"); R = self.root
        # en prenant sa forme, il s'enfonce : la flottaison remonte sur la coque, comme un sous-marin en surface
        R.location = self.loc0 + Vector((0, 0, -0.62 * kfo - profondeur * kp)); R.rotation_euler = (0, tangage * kp, self.yaw)

    def objets_animes(self):
        return ([self.e_gen, self.e_bome, self.e_mat, self.e_tete, self.e_pont, self.e_liston, self.e_kio, self.e_quille, self.e_mot, self.e_bascule,
                 self.e_hel, self.e_rot, self.root] + self.e_cab + self.e_barres + [g for g, _ in self.ailerons] + self.pales + [e for e, _, _ in self.sortants] + [g.parent for g, _ in self.ailerons])

    def key(self, frame):
        for o in self.objets_animes():
            for p in ("location", "scale", "rotation_euler"): o.keyframe_insert(p, frame=frame)
            if o.rotation_mode == "QUATERNION": o.keyframe_insert("rotation_quaternion", frame=frame)
        for o in (self.hull, self.sm):
            o.keyframe_insert("hide_render", frame=frame); o.keyframe_insert("hide_viewport", frame=frame)
        self.k_plat.keyframe_insert("value", frame=frame); self.k_forme.keyframe_insert("value", frame=frame)
        for (b, _, _) in self.fondus: b.inputs["Base Color"].keyframe_insert("default_value", frame=frame)
        for m in (self.m_bleu, self.m_pont, self.m_af):
            IM.bsdf(m).inputs["Base Color"].keyframe_insert("default_value", frame=frame); IM.bsdf(m).inputs["Roughness"].keyframe_insert("default_value", frame=frame)
        for m in (self.m_hub, self.m_phare): IM.bsdf(m).inputs["Emission Strength"].keyframe_insert("default_value", frame=frame)
        for lo in self.feux: lo.data.keyframe_insert("energy", frame=frame)
