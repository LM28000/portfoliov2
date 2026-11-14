"""Exporte l'île v3 (blender/insula_v3.blend) pour le site :
  assets/ile_insula.glb : terrain, quai, ponton, passerelle, immeuble (extérieur)
  assets/studio.glb     : le studio témoin (objets marqués « studio »), chargé à l'arrivée
  3d/web/ile_arbres_v3.json  : arbres -> imposteurs (même format que PR_TREES de scene.js)
Usage : Blender -b blender/insula_v3.blend -P scripts/export_ile_v3.py"""
import bpy, os, json, math
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.realpath(__file__)))))  # racine du dépôt (le site)
SITE = os.path.join(REPO, "assets")
sc = bpy.context.scene
# 1. arbres -> liste [type, x, y, z, rot, échelle] ; types : 0 arbre côtier, 1..3 pins a/b/c
trees = []
for o in list(sc.objects):
    if o.name.startswith("Arbre") and o.instance_collection:
        n = o.instance_collection.name.lower()
        k = 0 if "pine" not in n else 1 if "_a_" in n or n.endswith("_a") else 2 if "_b_" in n or n.endswith("_b") else 3
        trees.append([k, round(o.location.x, 1), round(o.location.y, 1), round(o.location.z, 2), round(o.rotation_euler.z, 2), round(o.scale.x, 2)])
        bpy.data.objects.remove(o, do_unlink=True)
json.dump(trees, open(os.path.join(ROOT, "web", "ile_arbres_v3.json"), "w"))
# 2. ni mer, ni Elba, ni lumières, ni caméra
def kill(o):
    for c in list(o.children):
        kill(c)
    bpy.data.objects.remove(o, do_unlink=True)
for o in [o for o in sc.objects if o.name.startswith("Elba") and o.parent is None]:
    kill(o)
for o in list(sc.objects):
    if o.type in ("CAMERA", "LIGHT") or o.name.startswith("Mer") or (o.type == "MESH" and max(o.dimensions) > 1000):
        bpy.data.objects.remove(o, do_unlink=True)
# 3. instances -> objets réels (le ponton)
for o in sc.objects:
    o.select_set(o.type == "EMPTY" and o.instance_collection is not None)
sel = [o for o in sc.objects if o.select_get()]
if sel:
    with bpy.context.temp_override(selected_objects=sel, active_object=sel[0]):
        bpy.ops.object.duplicates_make_real(use_base_parent=True, use_hierarchy=True)
# 4. matériaux simples pour le web : ni relief ni rugosité texturée, pas de métal (pas de carte d'environnement côté site)
for m in bpy.data.materials:
    if not m.use_nodes:
        continue
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type in ("NORMAL_MAP", "BUMP"):
            nt.nodes.remove(n)
    for n in nt.nodes:
        if n.type == "BSDF_PRINCIPLED":
            for k in ("Metallic", "Roughness"):
                for l in list(n.inputs[k].links):
                    nt.links.remove(l)
            if n.inputs["Metallic"].default_value > 0.5:
                c = n.inputs["Base Color"].default_value; n.inputs["Base Color"].default_value = (c[0] * 0.8, c[1] * 0.8, c[2] * 0.8, 1)
            n.inputs["Metallic"].default_value = 0.0
LISIBLES = ("fiche", "carnet", "annonce", "panneau", "plaque", "ecran", "porte_cles", "affiche")
for im in bpy.data.images:
    try:
        w, h = im.size; lim = 1024 if any(k in im.name.lower() for k in LISIBLES) else 512
        if max(w, h) > lim:
            f = lim / max(w, h); im.scale(max(1, int(w * f)), max(1, int(h * f)))
    except Exception as e:
        print("img", im.name, e)
# 5. allègement des gros modèles du studio
dg = bpy.context.evaluated_depsgraph_get()
for o in sc.objects:
    if o.type == "MESH" and o.get("studio") and len(o.data.polygons) > 15000:
        d = o.modifiers.new("Dec", "DECIMATE"); d.ratio = 12000 / len(o.data.polygons)
# 6. deux fichiers : le studio (objets marqués, détachés de la racine de l'immeuble) et le reste
studio = [o for o in sc.objects if o.get("studio")]
for o in studio:
    if o.parent and not o.parent.get("studio"):
        mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw
def export(objs, path):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", export_apply=True, export_yup=True, use_selection=True,
                              export_image_format="JPEG", export_jpeg_quality=82, export_cameras=False, export_lights=False, export_extras=True)
    print("GLB", path, round(os.path.getsize(path) / 1e6, 2), "Mo", len(objs), "objets")
export(studio, os.path.join(SITE, "studio.glb"))
export([o for o in sc.objects if not o.get("studio")], os.path.join(SITE, "ile_insula.glb"))
print("arbres", len(trees))
