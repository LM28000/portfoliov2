"""Photos d'arbres (imposteurs) pour le web : vue de côté orthographique, fond transparent."""
import bpy, os, math
from mathutils import Vector
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A, W = os.path.join(ROOT, "assets"), os.path.join(ROOT, "web")
sc = bpy.context.scene
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
sc.render.engine = "CYCLES"; sc.cycles.samples = 48; sc.cycles.use_denoising = True
try:
    sc.cycles.device = "GPU"
except Exception: pass
sc.render.film_transparent = True
sc.view_settings.view_transform = "AgX"
w = bpy.data.worlds.new("W"); sc.world = w; w.use_nodes = True
next(n for n in w.node_tree.nodes if n.type == "BACKGROUND").inputs["Color"].default_value = (0.75, 0.8, 0.9, 1)
sun = bpy.data.objects.new("Sun", bpy.data.lights.new("Sun", "SUN")); sun.data.energy = 3.5
sc.collection.objects.link(sun); sun.rotation_euler = (math.radians(45), 0, math.radians(-35))
cam = bpy.data.objects.new("Cam", bpy.data.cameras.new("Cam")); sc.collection.objects.link(cam); sc.camera = cam
cam.data.type = "ORTHO"
for fn in ("arbre_cotier.blend", "pins.blend"):
    with bpy.data.libraries.load(os.path.join(A, fn), link=False) as (src, dst):
        dst.objects = list(src.objects)
    for o in dst.objects:
        if o.type != "MESH": continue
        sc.collection.objects.link(o)
        for p in bpy.data.objects:
            if p.type == "MESH": p.hide_render = (p is not o)
        o.location = (0, 0, 0); bpy.context.view_layer.update()
        bb = [o.matrix_world @ Vector(c) for c in o.bound_box]
        xmin, xmax = min(v.x for v in bb), max(v.x for v in bb)
        zmin, zmax = min(v.z for v in bb), max(v.z for v in bb)
        cx = (xmin + xmax) / 2; hgt = zmax - zmin; wid = xmax - xmin
        cam.location = (cx, -60, zmin + hgt / 2); cam.rotation_euler = (math.radians(90), 0, 0)
        cam.data.ortho_scale = max(hgt, wid) * 1.03      # s'applique au plus grand côté de l'image
        big = 1024 if hgt > wid * 1.3 else 512
        if hgt >= wid:
            sc.render.resolution_y = big; sc.render.resolution_x = max(64, int(big * wid / hgt * 1.03))
        else:
            sc.render.resolution_x = big; sc.render.resolution_y = max(64, int(big * hgt / wid * 1.03))
        name = o.name.replace("_LOD0", "")
        sc.render.filepath = os.path.join(W, f"arbre_{name}.png")
        bpy.ops.render.render(write_still=True)
        print("IMP", name, round(wid, 2), round(hgt, 2), round(zmin, 2), round(cx, 2), sc.render.resolution_x, sc.render.resolution_y)
