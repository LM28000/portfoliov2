"""Petites fonctions de modélisation partagées (cube, cylindre, sphère, tube, courbe, texte, matières émissives) pour les exports du serveur."""
import bpy, math, os, sys
from mathutils import Vector
HOME = os.path.expanduser("~/portfoliov2")
sys.path.insert(0, os.path.join(HOME, "3d", "scripts"))
import immeuble as IM
M = IM.mat
sc = bpy.context.scene
metal = M("Acier", (0.45, 0.46, 0.47), 0.35, 1.0)
noir = M("Noir", (0.02, 0.02, 0.02), 0.5)
laiton = M("Laiton", (0.72, 0.52, 0.22), 0.3, 1.0)


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


def H():
    """le jeu de fonctions attendu par base_station.build_base et carrousel.build_carrousel"""
    return dict(cube=cube, cyl=cyl, sph=sph, tube=tube, courbe=courbe, texte=texte, M=M, metal=metal, noir=noir, emis=emis, laiton=laiton)
