"""Elba — Flirt 6 m (1977), d'après les photos : coque bleue, pont/rouf blancs,
antifouling rouge-brun, safran bois suspendu, hors-bord, échelle, bouée orange.
Repère : +X = étrave, +Y = bâbord, Z = 0 à la flottaison.
build_elba(coll) -> (rig, roles) ; roles = {role: [objets]}"""
import bpy, bmesh, math
from mathutils import Vector

L_STERN, L_BOW = -2.9, 3.1


def _link(o, coll):
    for uc in list(o.users_collection):
        uc.objects.unlink(o)
    coll.objects.link(o)
    return o


def _mesh(name, verts, faces, coll):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.validate()
    o = bpy.data.objects.new(name, me)
    coll.objects.link(o)
    return o


def _smooth(o):
    for p in o.data.polygons:
        p.use_smooth = True


def half_beam(u):
    if u <= 0.42:
        return 0.95 + 0.20 * math.sin(math.pi / 2 * u / 0.42)
    t = min(1.0, max(0.0, (u - 0.42) / 0.58))
    return max(0.015, 1.15 * (1 - t ** 2.1) ** 0.75)


def sheer(u):
    return 0.74 - 0.08 * math.sin(math.pi * u) + 0.26 * u ** 2.2


def bottom(u):
    return -0.12 - 0.32 * math.sin(math.pi * min(1, u * 1.05)) ** 0.7 + 0.25 * max(0, u - 0.85) / 0.15


def hull_point(u, th):
    """th = 0 au livet, pi/2 sur l'axe (quille)."""
    x = L_STERN + u * (L_BOW - L_STERN)
    hb, zs, zb = half_beam(u), sheer(u), bottom(u)
    y = hb * max(0.0, math.cos(th)) ** 0.55
    z = zs - (zs - zb) * max(0.0, math.sin(th)) ** 1.6
    hfrac = (z - zb) / max(1e-6, zs - zb)
    x -= 1.05 * max(0.0, (u - 0.7) / 0.3) ** 2.2 * (1 - hfrac)   # étrave élancée
    x -= 0.18 * (1 - u) ** 6 * (1 - hfrac)                          # tableau légèrement incliné
    return x, y, z


CAMBER = 0.06           # bouge du pont (bombé au centre)
D_DECK = 9              # points intérieurs du pont par couple
ROOF = dict(x0=-0.9, x1=1.05, w=0.78, zb=0.62, zt=0.98, xs=0.62, r=0.07, crown=0.03)
COCK = dict(x0=-2.6, x1=-0.95, y=0.575, z=0.30)


def u_of_x(x):
    return min(1.0, max(0.0, (x - L_STERN) / (L_BOW - L_STERN)))


def deck_z(x, y):
    """Hauteur exacte du pont en (x, y) : livet + bouge."""
    u = u_of_x(x)
    hb = half_beam(u)
    t = min(1.0, abs(y) / hb)
    return sheer(u) + CAMBER * (1 - t * t)


def transom_x(z):
    """Abscisse du tableau arrière (incliné) à la hauteur z, dans l'axe."""
    zs, zb = sheer(0), bottom(0)
    hfrac = min(1, max(0, (z - zb) / (zs - zb)))
    return L_STERN - 0.18 * (1 - hfrac)


def roof_ztop(x):
    R = ROOF
    if x <= R["xs"]:
        return R["zt"]
    f = (x - R["xs"]) / (R["x1"] - R["xs"])
    zf = deck_z(R["x1"], R["w"]) + 0.04
    return R["zt"] + (zf - R["zt"]) * f


def roof_top(x, y):
    R = ROOF
    inner = R["w"] - 0.08 - R["r"]
    t = min(1.0, abs(y) / inner)
    return roof_ztop(x) + R["crown"] * (1 - t * t)


def _placeholder(role):
    n = "role:" + role
    return bpy.data.materials.get(n) or bpy.data.materials.new(n)


def _box(name, x0, x1, y0, y1, z0, z1, coll, role=None):
    v = [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0), (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]
    f = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    o = _mesh(name, v, f, coll)
    if role:
        o.data.materials.append(_placeholder(role))
    return o


def _apply(o):
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    old = o.data
    o.modifiers.clear()
    o.data = me
    me.name = o.name
    bpy.data.meshes.remove(old)


def _bool(target, ops, mode):
    for i, op in enumerate(ops):
        m = target.modifiers.new(f"B{i}", "BOOLEAN")
        m.operation = mode; m.object = op; m.solver = "EXACT"
        try:
            m.material_mode = "TRANSFER"
        except Exception:
            pass
        op.hide_render = True; op.hide_viewport = True
    _apply(target)
    for op in ops:
        me = op.data
        bpy.data.objects.remove(op, do_unlink=True)
        bpy.data.meshes.remove(me)


def _shell(coll, US=60, TH=15):
    """Coque + pont en UN volume fermé : le pont part exactement du livet."""
    rings = []
    for i in range(US + 1):
        u = i / US
        side = [hull_point(u, (k / (TH - 1)) * math.pi / 2) for k in range(TH)]
        ring = side + [(x, -y, z) for (x, y, z) in reversed(side[:-1])]
        xd, hb = side[0][0], side[0][1]
        for j in range(1, D_DECK + 1):
            y = -hb + 2 * hb * j / (D_DECK + 1)
            ring.append((xd, y, sheer(u) + CAMBER * (1 - (y / max(hb, 1e-6)) ** 2)))
        rings.append(ring)
    n = len(rings[0]); first_deck = 2 * TH - 2
    verts = [v for r in rings for v in r]
    faces, mats = [], []
    for i in range(US):
        for j in range(n):
            jn = (j + 1) % n
            faces.append((i * n + j, i * n + jn, (i + 1) * n + jn, (i + 1) * n + j))
            mats.append(1 if j >= first_deck else 0)
    faces.append(tuple(range(n - 1, -1, -1))); mats.append(0)            # tableau
    faces.append(tuple(US * n + j for j in range(n))); mats.append(0)     # étrave
    o = _mesh("Coque", verts, faces, coll)
    o.data.materials.append(_placeholder("coque")); o.data.materials.append(_placeholder("pont"))
    for p, mi in zip(o.data.polygons, mats):
        p.material_index = mi
    bm = bmesh.new(); bm.from_mesh(o.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.004)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(o.data); bm.free()
    return o


def _roof(coll):
    """Rouf en volume : profil arrondi, pente avant, pied enfoncé dans le pont (puis fusionné)."""
    R = ROOF
    xs = [R["x0"], R["xs"] - 0.3, R["xs"]] + [R["xs"] + (R["x1"] - R["xs"]) * k / 6 for k in range(1, 7)]
    prof_n = None; verts = []; rings = []
    for x in xs:
        zt = roof_ztop(x)
        r = min(R["r"], max(0.01, (zt - deck_z(x, R["w"])) * 0.45))
        pts = []
        wt = R["w"] - 0.08
        pts.append((R["w"], R["zb"]))
        for k in range(6):                     # coin arrondi
            a = (math.pi / 2) * k / 5
            pts.append((wt - r + r * math.cos(a), zt - r + r * math.sin(a)))
        for k in range(1, 4):                  # bombé du dessus
            yy = (wt - r) * (1 - k / 4)
            t = yy / (wt - r)
            pts.append((yy, zt + R["crown"] * (1 - t * t) - R["crown"] * 0 ))
        half = pts
        full = [(x, y, z) for (y, z) in half] + [(x, -y, z) for (y, z) in reversed(half)]
        # fix crown continuity : on recale le dessus sur roof_top
        full = [(px, py, roof_top(px, py) if pz >= zt - 1e-6 and abs(py) <= wt - r + 1e-6 else pz) for (px, py, pz) in full]
        rings.append(full)
    n = len(rings[0])
    verts = [v for r_ in rings for v in r_]
    faces = [(i * n + j, i * n + (j + 1) % n, (i + 1) * n + (j + 1) % n, (i + 1) * n + j) for i in range(len(rings) - 1) for j in range(n)]
    faces.append(tuple(range(n - 1, -1, -1)))
    last = len(rings) - 1
    faces.append(tuple(last * n + j for j in range(n)))
    o = _mesh("Rouf", verts, faces, coll)
    o.data.materials.append(_placeholder("rouf"))
    bm = bmesh.new(); bm.from_mesh(o.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.002)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(o.data); bm.free()
    return o


def _slab_on_side(name, xc, ln, zc, hgt, sy, coll, role):
    """Plaque collée au flanc incliné du rouf (à moitié dedans)."""
    R = ROOF
    zr = R["zt"] - R["r"]
    slope = 0.08 / (zr - R["zb"])
    yc = R["w"] - slope * (zc - R["zb"])
    o = _box(name, -ln / 2, ln / 2, -0.012, 0.012, -hgt / 2, hgt / 2, coll, role)
    o.location = (xc, sy * yc, zc)
    o.rotation_euler = (sy * -math.atan(slope), 0, 0)
    return o


def build_elba(coll):
    roles = {k: [] for k in ("_multi", "coque", "liston", "pont", "rouf", "hublot", "inox", "alu", "cable", "voile",
                             "bois", "moteur", "bouee", "nom", "feu_babord", "feu_tribord", "feu_tete")}
    R, C = ROOF, COCK

    # 1. coque + pont, un seul volume
    hull = _shell(coll)

    # 2. quille fusionnée (son dessus est noyé dans la coque)
    kv = [(-0.55, -0.06, -0.15), (0.75, -0.06, -0.15), (0.45, -0.05, -1.15), (-0.2, -0.05, -1.15),
          (-0.55, 0.06, -0.15), (0.75, 0.06, -0.15), (0.45, 0.05, -1.15), (-0.2, 0.05, -1.15)]
    kf = [(0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
    keel = _mesh("Quille", kv, kf, coll); keel.data.materials.append(_placeholder("coque"))
    kb = keel.modifiers.new("Bev", "BEVEL"); kb.width = 0.03; kb.segments = 3; _apply(keel)

    # 3. rouf + fenêtres + descente + capot coulissant + mains courantes + panneau avant
    roof = _roof(coll)
    adds = [keel, roof]
    for sy in (1, -1):
        adds.append(_slab_on_side(f"Fenetre{sy}", -0.12, 1.25, 0.875, 0.085, sy, coll, "hublot"))
        zr = roof_top(-0.15, 0.5)
        adds.append(_box(f"MainCourante{sy}", -0.75, 0.45, sy * 0.5 - 0.025, sy * 0.5 + 0.025, zr - 0.02, zr + 0.045, coll, "bois"))
    adds.append(_box("Descente", R["x0"] - 0.012, R["x0"] + 0.012, -0.27, 0.27, deck_z(R["x0"], 0.27) - 0.02, R["zt"] - 0.04, coll, "hublot"))
    zt0 = roof_top(R["x0"], 0.3)
    adds.append(_box("Capot", R["x0"] - 0.02, R["x0"] + 0.55, -0.32, 0.32, zt0 - 0.03, zt0 + 0.045, coll, "rouf"))
    zh = deck_z(1.75, 0.25)
    adds.append(_box("Panneau", 1.5, 2.0, -0.25, 0.25, zh - 0.04, deck_z(1.75, 0) + 0.06, coll, "rouf"))
    adds.append(_box("PanneauVitre", 1.54, 1.96, -0.21, 0.21, deck_z(1.75, 0) + 0.05, deck_z(1.75, 0) + 0.07, coll, "hublot"))
    _bool(hull, adds, "UNION")

    # 4. cockpit creusé dans le volume, puis banquettes
    cut = _box("DecoupeCockpit", C["x0"], C["x1"], -C["y"], C["y"], C["z"], 1.6, coll, "pont")
    _bool(hull, [cut], "DIFFERENCE")
    benches = [_box(f"Banquette{sy}", C["x0"] - 0.03, C["x1"] + 0.03, min(sy * 0.27, sy * (C["y"] + 0.05)), max(sy * 0.27, sy * (C["y"] + 0.05)), C["z"] - 0.05, 0.56, coll, "pont") for sy in (1, -1)]
    _bool(hull, benches, "UNION")

    me = hull.data
    try:
        me.shade_smooth(); me.set_sharp_from_angle(angle=math.radians(38))
    except Exception:
        for p in me.polygons: p.use_smooth = True
    roles["_multi"].append(hull)

    # liston noir : bande pleine, à moitié noyée dans le bordé
    US = 60
    lv, lf = [], []
    for i in range(US + 1):
        u = i / US
        x, y, z = hull_point(u, 0)
        lv += [(x, y * 0.99 - 0.004, z + 0.012), (x, y + 0.012, z + 0.012), (x, y + 0.012, z - 0.05), (x, y * 0.99 - 0.004, z - 0.05)]
    for i in range(US):
        for k in range(4):
            a, b_ = 4 * i + k, 4 * i + (k + 1) % 4
            lf.append((a, b_, b_ + 4, a + 4))
    lf.append((3, 2, 1, 0)); lf.append(tuple(4 * US + k for k in range(4)))
    m = len(lv)
    lv += [(x, -y, z) for (x, y, z) in lv]
    lf += [tuple(m + i for i in reversed(f)) for f in lf]
    lis = _mesh("Liston", lv, lf, coll); _smooth(lis)
    roles["liston"].append(lis)

    def tube(name, pts, r, role):
        cu = bpy.data.curves.new(name, "CURVE"); cu.dimensions = "3D"
        sp = cu.splines.new("POLY"); sp.points.add(len(pts) - 1)
        for i, p in enumerate(pts):
            sp.points[i].co = (*p, 1)
        cu.bevel_depth = r; cu.bevel_resolution = 3; cu.use_fill_caps = True
        o = bpy.data.objects.new(name, cu); coll.objects.link(o)
        roles[role].append(o)
        return o

    def on_deck(x, y, sink=0.01):
        return (x, y, deck_z(x, y) - sink)

    def edge_y(x, inset):
        return half_beam(u_of_x(x)) - inset

    # mât posé sur le rouf, barres de flèche, bôme
    mx = 0.8
    mz0, mz1 = roof_top(mx, 0) - 0.02, 9.2
    tube("Mat", [(mx, 0, mz0), (mx, 0, mz1)], 0.055, "alu")
    sz = 5.6
    for sy in (1, -1):
        tube("Barre", [(mx, 0, sz), (mx - 0.12, sy * 0.72, sz)], 0.018, "alu")
    boom_end = (-1.9, -0.32, 1.6)
    tube("Bome", [(mx - 0.05, 0, 1.55), boom_end], 0.045, "alu")

    # gréement dormant : chaque câble finit SUR le pont
    head = (mx, 0, mz1 - 0.1)
    stem = (L_BOW - 0.06, 0, deck_z(L_BOW - 0.06, 0) - 0.01)
    tube("Etai", [head, stem], 0.006, "cable")
    tube("Pataras", [head, on_deck(L_STERN + 0.04, 0)], 0.006, "cable")
    for sy in (1, -1):
        xc = mx - 0.15
        tube("Hauban", [head, (mx - 0.12, sy * 0.72, sz), on_deck(xc, sy * edge_y(xc, 0.05))], 0.006, "cable")
        xl = mx + 0.25
        tube("BasHauban", [(mx, 0, sz - 0.2), on_deck(xl, sy * edge_y(xl, 0.06))], 0.006, "cable")

    # balcon avant : pieds sur le pont
    xp = 2.55
    yp = min(0.42, edge_y(xp, 0.05))
    zb = deck_z(xp, yp) - 0.01
    tube("Balcon", [(xp, yp, zb), (2.6, yp, 1.5), (2.95, 0.12, 1.55), (2.95, -0.12, 1.55), (2.6, -yp, 1.5), (xp, -yp, zb)], 0.016, "inox")
    # balcon arrière, chandeliers, filières
    for sy in (1, -1):
        xa = -2.15; ya = edge_y(xa, 0.08)
        tube("Balcon AR", [on_deck(xa, sy * ya), (-2.2, sy * (ya - 0.02), 1.4), (-2.75, sy * (ya - 0.1), 1.42), (-2.78, sy * 0.35, 1.42), on_deck(-2.78, sy * 0.35)], 0.016, "inox")
        tops = []
        for xs_ in (-1.0, 0.35, 1.6):
            yy = sy * edge_y(xs_, 0.08)
            zd = deck_z(xs_, yy)
            tube("Chandelier", [(xs_, yy, zd - 0.01), (xs_, yy, zd + 0.62)], 0.012, "inox")
            tops.append((xs_, yy, zd + 0.6))
        tube("Filiere", [(-2.2, sy * (ya - 0.02), 1.38)] + tops + [(2.6, sy * yp, 1.48)], 0.004, "cable")
        # embases de chandelier
    # safran bois : bord d'attaque parallèle au tableau, aiguillots qui touchent
    zt_r, zb_r = 0.78, -0.72
    gap = 0.035
    le_top, le_bot = transom_x(zt_r) - gap, transom_x(max(zb_r, bottom(0))) - gap
    th_ = 0.022
    rv = []
    for (zz, xle, ch) in ((zt_r, le_top, 0.22), (0.05, transom_x(0.05) - gap, 0.36), (zb_r, le_bot - 0.03, 0.26)):
        rv += [(xle, -th_, zz), (xle - ch, -th_ * 0.4, zz), (xle - ch, th_ * 0.4, zz), (xle, th_, zz)]
    rf = [(0, 1, 2, 3), (11, 10, 9, 8)]
    for k in range(2):
        o_ = 4 * k
        rf += [(o_ + 0, o_ + 4, o_ + 5, o_ + 1), (o_ + 1, o_ + 5, o_ + 6, o_ + 2), (o_ + 2, o_ + 6, o_ + 7, o_ + 3), (o_ + 3, o_ + 7, o_ + 4, o_ + 0)]
    rud = _mesh("Safran", rv, rf, coll)
    rb = rud.modifiers.new("Bev", "BEVEL"); rb.width = 0.012; rb.segments = 2
    _smooth(rud)
    roles["bois"].append(rud)
    for zz in (0.55, 0.0):
        tube("Ferrure", [(transom_x(zz) + 0.01, 0, zz), (transom_x(zz) - gap - 0.03, 0, zz)], 0.018, "inox")
    tube("Barre franche", [(le_top - 0.12, 0, zt_r - 0.03), (-2.4, 0, 0.95), (-1.6, 0, 1.0)], 0.025, "bois")

    # hors-bord sur chaise vissée au tableau
    oy = -0.5
    zc = 0.6
    xt = transom_x(zc)
    brk = _box("Chaise", xt - 0.26, xt + 0.01, oy - 0.1, oy + 0.1, zc - 0.06, zc + 0.06, coll)
    roles["moteur"].append(brk)
    cxm = xt - 0.38
    cow = _box("Capot moteur", cxm - 0.16, cxm + 0.16, oy - 0.12, oy + 0.12, zc + 0.02, zc + 0.32, coll)
    cb = cow.modifiers.new("Bev", "BEVEL"); cb.width = 0.06; cb.segments = 4
    roles["moteur"].append(cow)
    tube("Embase", [(cxm, oy, zc + 0.04), (cxm, oy, -0.3)], 0.035, "moteur")
    low = _box("Pied", cxm - 0.12, cxm + 0.12, oy - 0.035, oy + 0.035, -0.42, -0.3, coll)
    roles["moteur"].append(low)

    # échelle de bain accrochée au pont, qui longe le tableau
    for dy in (0.2, 0.44):
        p0 = on_deck(L_STERN + 0.12, dy)
        tube("Echelle", [p0, (L_STERN - 0.02, dy, p0[2] + 0.07), (transom_x(0.4) - 0.04, dy, 0.4), (transom_x(0.0) - 0.05, dy, 0.0), (transom_x(0.0) - 0.05, dy, -0.62)], 0.012, "inox")
    for zz in (-0.18, -0.42):
        xr = transom_x(0.0) - 0.05
        tube("Marche", [(xr, 0.2, zz), (xr, 0.44, zz)], 0.018, "inox")

    # bouée couronne pendue au balcon arrière
    bpy.ops.mesh.primitive_torus_add(major_radius=0.28, minor_radius=0.075, location=(-2.87, 0.6, 1.42 - 0.215), rotation=(0, math.pi / 2, 0))
    buoy = _link(bpy.context.active_object, coll); buoy.name = "Bouee"
    roles["bouee"].append(buoy)

    # nom sur le tableau, posé à plat sur sa pente (côté bâbord, hors de l'échelle)
    tilt = math.atan(0.18 / (sheer(0) - bottom(0)))
    for body, z_, size in (("Elba", 0.42, 0.2), ("LR", 0.26, 0.11)):
        cu = bpy.data.curves.new("Nom" + body, "FONT"); cu.body = body; cu.size = size; cu.align_x = "CENTER"; cu.extrude = 0.003
        t = bpy.data.objects.new("Nom" + body, cu); coll.objects.link(t)
        t.location = (transom_x(z_) - 0.006, 0.68, z_)
        t.rotation_euler = (math.pi / 2 - tilt, 0, -math.pi / 2)
        roles["nom"].append(t)

    # winchs et taquets posés sur le pont
    for sy in (1, -1):
        for wx in (-1.05, -2.2):
            wy = sy * 0.8
            zd = deck_z(wx, wy)
            bpy.ops.mesh.primitive_cylinder_add(radius=0.07, depth=0.13, location=(wx, wy, zd + 0.055))
            wn = _link(bpy.context.active_object, coll); wn.name = "Winch"; roles["inox"].append(wn)
        zd = deck_z(2.3, sy * 0.25)
        cl = _box("Taquet", 2.21, 2.39, sy * 0.25 - 0.02, sy * 0.25 + 0.02, zd - 0.01, zd + 0.04, coll)
        roles["inox"].append(cl)

    # voiles (creux selon la normale)
    def sail(name, a, b, c, belly):
        me_ = bpy.data.meshes.new(name); me_.from_pydata([a, b, c], [], [(0, 1, 2)])
        o = bpy.data.objects.new(name, me_); coll.objects.link(o)
        bm_ = bmesh.new(); bm_.from_mesh(me_)
        bmesh.ops.subdivide_edges(bm_, edges=bm_.edges[:], cuts=14, use_grid_fill=True)
        A, B, C_ = Vector(a), Vector(b), Vector(c)
        nrm = (B - A).cross(C_ - A).normalized()
        if nrm.y < 0:
            nrm = -nrm
        luff = (B - A)
        for v in bm_.verts:
            p = v.co - A
            along = p.dot(luff.normalized()) / luff.length
            dist = (p - luff.normalized() * p.dot(luff.normalized())).length
            chord_ = (C_ - A).length * (1 - along)
            t = max(0.0, min(1.0, dist / max(chord_, 1e-3)))
            v.co += -nrm * belly * math.sin(math.pi * t) * max(0.0, 1 - along) ** 0.6
        bm_.to_mesh(me_); bm_.free()
        _smooth(o)
        o.modifiers.new("Ep", "SOLIDIFY").thickness = 0.008
        roles["voile"].append(o)
        return o

    sail("GrandVoile", (mx - 0.06, 0, 1.62), (mx - 0.06, 0, mz1 - 0.25), (boom_end[0] + 0.05, boom_end[1], boom_end[2] + 0.05), 0.42)
    A_, B_, C2 = Vector((mx - 0.06, 0, 1.62)), Vector((mx - 0.06, 0, mz1 - 0.25)), Vector((boom_end[0] + 0.05, boom_end[1], boom_end[2] + 0.05))
    for t in (0.22, 0.45, 0.68):
        P_ = B_.lerp(C2, t)
        tube("Latte", [tuple(P_ + Vector((0.02, 0, 0))), tuple(P_ + Vector((0.6, 0.0, 0.0)))], 0.01, "cable")
    sail("Genois", (mx + 0.05, 0, mz1 - 0.6), (stem[0] - 0.04, 0, stem[2] + 0.1), (-0.45, -0.95, 1.05), 0.38)

    # feux de navigation sur le balcon
    for role, pos in (("feu_babord", (2.6, yp, 1.53)), ("feu_tribord", (2.6, -yp, 1.53)), ("feu_tete", (mx, 0, mz1 + 0.05))):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.05, location=pos)
        o = _link(bpy.context.active_object, coll); o.name = role
        roles[role].append(o)

    bpy.ops.object.empty_add(location=(0, 0, 0))
    rig = _link(bpy.context.active_object, coll); rig.name = "Elba"
    for o in coll.objects:
        if o is not rig and o.parent is None:
            o.parent = rig
    return rig, roles


def hull_material(blue=(0.008, 0.09, 0.62), anti=(0.32, 0.07, 0.04), rough=0.22, toon_fn=None):
    """Bleu au-dessus de la flottaison, antifouling dessous (coordonnées objet Z)."""
    if toon_fn:
        return toon_fn("CoqueBleue", (0.1, 0.3, 0.85))
    m = bpy.data.materials.new("CoqueElba"); m.use_nodes = True
    nt = m.node_tree
    b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Roughness"].default_value = rough
    b.inputs["Coat Weight"].default_value = 0.4
    tc = nt.nodes.new("ShaderNodeTexCoord"); sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    rp = nt.nodes.new("ShaderNodeValToRGB"); rp.color_ramp.interpolation = "CONSTANT"
    rp.color_ramp.elements[0].color = (*anti, 1)
    rp.color_ramp.elements[1].position = 0.5; rp.color_ramp.elements[1].color = (*blue, 1)
    mr = nt.nodes.new("ShaderNodeMapRange")
    mr.inputs["From Min"].default_value, mr.inputs["From Max"].default_value = -0.5, 0.5
    nt.links.new(tc.outputs["Object"], sep.inputs[0])
    nt.links.new(sep.outputs["Z"], mr.inputs["Value"])
    nt.links.new(mr.outputs[0], rp.inputs["Fac"])
    nt.links.new(rp.outputs["Color"], b.inputs["Base Color"])
    return m


def seam_material(m, spacing=0.9):
    """Ajoute des coutures horizontales (bandes fines plus sombres) à une matière de voile."""
    m = m.copy(); m.name = m.name + "Coutures"
    nt = m.node_tree; b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    base = tuple(b.inputs["Base Color"].default_value)
    tc = nt.nodes.new("ShaderNodeTexCoord"); sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Object"], sep.inputs[0])
    mod = nt.nodes.new("ShaderNodeMath"); mod.operation = "PINGPONG"; mod.inputs[1].default_value = spacing / 2
    nt.links.new(sep.outputs[2], mod.inputs[0])
    thr = nt.nodes.new("ShaderNodeMath"); thr.operation = "LESS_THAN"; thr.inputs[1].default_value = 0.012
    nt.links.new(mod.outputs[0], thr.inputs[0])
    mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"
    mix.inputs[6].default_value = base; mix.inputs[7].default_value = (base[0] * 0.78, base[1] * 0.78, base[2] * 0.76, 1)
    nt.links.new(thr.outputs[0], mix.inputs[0]); nt.links.new(mix.outputs[2], b.inputs["Base Color"])
    return m
