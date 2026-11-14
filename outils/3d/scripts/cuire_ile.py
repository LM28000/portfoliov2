"""Éclairage figé (« baking ») de l'île d'Insula : la lumière du soleil et du ciel, ombres et rebonds compris,
calculée par Cycles et enregistrée dans deux textures de lumière (deuxième jeu d'UV, « Lumiere ») :
  assets/ile_lumiere_sol.jpg   le terrain (les ombres des arbres y sont)
  assets/ile_lumiere_quai.jpg  le quai, le mur, le ponton, l'immeuble (extérieur) et les objets du quai
Les textures stockent l'éclairement divisé par ECHELLE (le site multiplie d'autant).
Usage : Blender -b blender/insula_v3.blend -P scripts/cuire_ile.py [-- preview]   -> blender/insula_v3_cuit.blend
Puis : Blender -b blender/insula_v3_cuit.blend -P scripts/export_ile_v3.py"""
import bpy, os, sys, math
import numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.realpath(__file__)))))
SITE = os.path.join(REPO, "assets")
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
PREVIEW = "preview" in argv
ECHELLE = 4.0
sc = bpy.context.scene

# le ponton est une instance de collection : on le rend réel pour pouvoir le cuire
for o in sc.objects:
    o.select_set(o.type == "EMPTY" and o.instance_collection is not None and o.name.startswith("Quai"))
sel = [o for o in sc.objects if o.select_get()]
if sel:
    with bpy.context.temp_override(selected_objects=sel, active_object=sel[0]):
        bpy.ops.object.duplicates_make_real(use_base_parent=True, use_hierarchy=True)


def exclu(o):
    n = o.name; mats = [s.material.name for s in o.material_slots if s.material]
    if o.get("studio") or n.startswith(("Mer", "Elba", "Arbre")) or max(o.dimensions) > 1000:
        return True
    if any(m.startswith(("VerreClair", "VieLanterne", "Eau", "Lanterne", "PanneauMat", "PlaqueMat")) for m in mats):
        return True          # verres, lanternes, écrits : ils gardent leur rendu
    p = o.parent
    while p:
        if p.name.startswith(("Elba", "Quai")):      # Elba ; le ponton modélisé (son maillage se cuit mal)
            return True
        p = p.parent
    return False


meshes = [o for o in sc.objects if o.type == "MESH" and not exclu(o) and o.visible_get()]
sol = [o for o in meshes if o.name.startswith("Ile")]
# seulement les grandes surfaces fixes ; les petits objets (Vie_…) gardent leur éclairage en temps réel,
# mais projettent leurs ombres sur le pavage figé
quai = [o for o in meshes if o not in sol and not o.name.startswith("Vie_") and (o.parent is None or not o.parent.name.startswith(("Vie", "VieQuai")))]
print("CUIRE", len(sol), "terrain,", len(quai), "objets du quai")

# les modificateurs (décimation…) sont appliqués d'abord : les UV de lumière doivent suivre la géométrie exportée
for o in quai:
    if o.modifiers:
        with bpy.context.temp_override(object=o, active_object=o, selected_objects=[o]):
            for m in list(o.modifiers):
                try:
                    bpy.ops.object.modifier_apply(modifier=m.name)
                except Exception as e:
                    print("mod", o.name, m.name, e)
# maillages partagés entre plusieurs objets : chacun a besoin de ses propres UV de lumière
for o in sol + quai:
    if o.data.users > 1:
        o.data = o.data.copy()


def uv_dessus(o):
    """terrain : projection vue de dessus (pas de coutures)"""
    uv = o.data.uv_layers.get("Lumiere") or o.data.uv_layers.new(name="Lumiere")
    xs = [v.co.x for v in o.data.vertices]; ys = [v.co.y for v in o.data.vertices]; x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    for l in o.data.loops:
        c = o.data.vertices[l.vertex_index].co; uv.data[l.index].uv = ((c.x - x0) / (x1 - x0), (c.y - y0) / (y1 - y0))
    o.data.uv_layers.active = uv
    for l in o.data.uv_layers:
        l.active_render = l.name != "Lumiere"


def uv_lumiere(objs, marge):
    for o in objs:
        uv = o.data.uv_layers.get("Lumiere") or o.data.uv_layers.new(name="Lumiere")
        o.data.uv_layers.active = uv
        for l in o.data.uv_layers:
            l.active_render = (l.name != "Lumiere") if len(o.data.uv_layers) > 1 else True
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.lightmap_pack(PREF_CONTEXT="ALL_FACES", PREF_PACK_IN_ONE=True, PREF_NEW_UVLAYER=False, PREF_BOX_DIV=12, PREF_MARGIN_DIV=marge)
    bpy.ops.object.mode_set(mode="OBJECT")


def cuire(objs, nom, taille):
    for o in objs:
        o["cuit"] = nom.split("_")[-1]          # « sol » ou « quai » : le site repère ainsi les surfaces figées
    img = bpy.data.images.new(nom, taille, taille, float_buffer=True, alpha=False)
    nodes = []
    for o in objs:
        for s in o.material_slots:
            m = s.material
            if not m or not m.use_nodes:
                continue
            n = m.node_tree.nodes.get("CuissonLumiere") or m.node_tree.nodes.new("ShaderNodeTexImage")
            n.name = "CuissonLumiere"; n.image = img; m.node_tree.nodes.active = n; nodes.append((m, n))
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    b = sc.render.bake; b.use_pass_direct = True; b.use_pass_indirect = True; b.use_pass_color = False; b.margin = 6; b.target = "IMAGE_TEXTURES"
    bpy.ops.object.bake(type="DIFFUSE")
    px = np.array(img.pixels[:], dtype=np.float32).reshape(-1, 4)
    rgb = px[:, :3].reshape(taille, taille, 3)
    k = np.array([1, 4, 6, 4, 1], dtype=np.float32); k /= k.sum()           # léger lissage (le calcul de cuisson n'a pas de débruitage)
    for ax in (0, 1):
        rgb = sum(np.roll(rgb, i - 2, axis=ax) * k[i] for i in range(5))
    px[:, :3] = np.clip(rgb.reshape(-1, 3) / ECHELLE, 0, 1) ** (1 / 2.2)          # encodage gamma : plus de précision dans les ombres
    px[:, 3] = 1
    out = bpy.data.images.new(nom + "_8", taille, taille, alpha=False); out.pixels = px.ravel().tolist()
    out.filepath_raw = os.path.join(ROOT, "renders", nom + ".png"); out.file_format = "PNG"; out.save()
    for m in {m for m, _ in nodes}:      # le nœud ne sert qu'à la cuisson : retiré pour que l'export l'ignore
        n = m.node_tree.nodes.get("CuissonLumiere")
        if n:
            m.node_tree.nodes.remove(n)
    print("CUIT", nom, out.filepath_raw)


sc.render.engine = "CYCLES"; sc.cycles.samples = 24 if PREVIEW else 128; sc.cycles.use_denoising = True
try:
    pr = bpy.context.preferences.addons["cycles"].preferences; pr.compute_device_type = "METAL"; pr.get_devices()
    for dv in pr.devices:
        dv.use = True
    sc.cycles.device = "GPU"
except Exception as e:
    print("GPU", e)
# le studio n'a pas à recevoir ni bloquer la lumière extérieure pendant la cuisson, sauf ses murs (dans l'immeuble)
for o in sol:
    uv_dessus(o)
cuire(sol, "ile_lumiere_sol", 1024 if PREVIEW else 2048)
sc.cycles.samples = 24 if PREVIEW else 48          # le quai : beaucoup d'objets, cuisson longue ; le lissage compense
uv_lumiere(quai, 0.12); cuire(quai, "ile_lumiere_quai", 1024)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, "blender", "insula_v3_cuit.blend"))
print("ECHELLE", ECHELLE)
