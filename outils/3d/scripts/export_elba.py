"""Exporte Elba (blender/elba.blend, fait par « scene.py -- studio export ») en GLB léger pour le site : courbes -> maillages,
coque bleue / antifouling en deux matières simples (glTF ne lit pas la rampe de couleur)."""
import bpy, os, bmesh
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.realpath(__file__)))))  # racine du dépôt (le site)
SITE = os.path.join(REPO, "assets")
OUT = os.path.join(SITE, "elba.glb")

def pm(name, col, rough=0.5, metal=0.0, emit=None):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Base Color"].default_value = (*col, 1); b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1); b.inputs["Emission Strength"].default_value = 3
    return m

blue, anti = pm("CoqueBleue", (0.02, 0.12, 0.55), 0.25), pm("Antifouling", (0.32, 0.07, 0.04), 0.6)
hull = bpy.data.objects["Coque"]
mats = hull.data.materials
i_coque = next(i for i, m in enumerate(mats) if m and m.name.startswith("CoqueElba"))
mats[i_coque] = blue
mats.append(anti); i_anti = len(mats) - 1
for p in hull.data.polygons:
    if p.material_index == i_coque and p.center.z < 0.02:
        p.material_index = i_anti
for o in bpy.data.objects:
    if o.type == "MESH" and o.name.startswith("feu_"):
        col = {"feu_babord": (1, 0.05, 0.05), "feu_tribord": (0.1, 1, 0.25)}.get(o.name, (1, 1, 1))
        o.data.materials.clear(); o.data.materials.append(pm(o.name, col, emit=col))
# courbes et textes -> maillages
for o in list(bpy.data.objects):
    o.hide_set(False); o.hide_viewport = False
    if o.type in ("CURVE", "FONT"):
        dg = bpy.context.evaluated_depsgraph_get()
        me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
        n = bpy.data.objects.new(o.name, me)
        for c in o.users_collection: c.objects.link(n)
        n.parent = o.parent; n.matrix_world = o.matrix_world.copy()
        bpy.data.objects.remove(o, do_unlink=True)
for o in list(bpy.data.objects):
    if o.type in ("CAMERA", "LIGHT") or o.name == "DecoupeCockpit":
        bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", export_apply=True, export_yup=True,
                          export_cameras=False, export_lights=False)
print("GLB", OUT, os.path.getsize(OUT))
