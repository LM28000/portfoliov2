"""Exporte la cabine (3d/blender/cabine.blend) en GLB pour le site : matières procédurales remplacées par des images,
objets nommés pour les interactions, textures ramenées à 1024 px (2048 pour la carte)."""
import bpy, os, math
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.realpath(__file__)))))  # racine du dépôt (le site)
SITE = os.path.join(REPO, "assets")
GEN = os.path.join(ROOT, "assets", "cabine", "gen")
OUT = os.path.join(SITE, "cabine.glb")
def img_mat(name, path, rough=0.6, alpha=False, emit=False):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    t = nt.nodes.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(path); nt.links.new(t.outputs["Color"], b.inputs["Base Color"]); b.inputs["Roughness"].default_value = rough
    if alpha: nt.links.new(t.outputs["Alpha"], b.inputs["Alpha"])
    if emit: nt.links.new(t.outputs["Color"], b.inputs["Emission Color"]); b.inputs["Emission Strength"].default_value = 1.0
    return m
SWAP = {"LinBleu": img_mat("LinMarine", os.path.join(GEN, "lin_marine.jpg"), 0.95), "PlacageTeck": img_mat("PlacageTeck", os.path.join(GEN, "teck_placage.jpg"), 0.45),
        "PavillonL": img_mat("PavillonL", os.path.join(GEN, "pavillon_L.png"), 0.9), "PavillonM": img_mat("PavillonM", os.path.join(GEN, "pavillon_M.png"), 0.9),
        "PhotoElba": img_mat("PhotoElba", os.path.join(GEN, "photo_elba_ovale.png"), 0.4, alpha=True), "EcranVHF": img_mat("EcranVHF", os.path.join(GEN, "vhf_ecran.png"), 0.4, emit=True)}
for o in bpy.data.objects:
    if o.type != "MESH": continue
    for i, sl in enumerate(o.material_slots):
        if sl.material and sl.material.name in SWAP: o.material_slots[i].material = SWAP[sl.material.name]
for o in list(bpy.data.objects):
    if o.type in ("LIGHT", "CAMERA"): bpy.data.objects.remove(o, do_unlink=True)
for o in bpy.data.objects:
    if o.name.startswith("DecoupeCockpit"): bpy.data.objects.remove(o, do_unlink=True)
# pas de cartes de relief (vu de près, la lumière de la lanterne suffit)
for m in bpy.data.materials:
    if not m.use_nodes: continue
    for n in list(m.node_tree.nodes):
        if n.type in ("NORMAL_MAP", "BUMP"): m.node_tree.nodes.remove(n)
# photo : géométrie ovale (le JPEG ne garde pas la transparence)
import bmesh
ph = bpy.data.objects.get("PhotoElba")
if ph:
    bm = bmesh.new(); uv = bm.loops.layers.uv.new(); N = 48
    vs = [bm.verts.new((0.5 * math.cos(2 * math.pi * i / N), 0.5 * math.sin(2 * math.pi * i / N), 0)) for i in range(N)]
    f = bm.faces.new(vs)
    for l in f.loops: l[uv].uv = (l.vert.co.x + 0.5, l.vert.co.y + 0.5)
    bm.to_mesh(ph.data); bm.free()
# objets très détaillés : allégés (vus d'assez loin dans la cabine)
DEC = {"treasure_chest": 0.22, "Lantern_01": 0.3, "Camera_01": 0.25, "hanging_picture_frame_03": 0.3, "seadogs_compass": 0.5, "wooden_bucket_01": 0.5, "wooden_lantern_01": 0.6, "book_encyclopedia": 0.6}
for o in bpy.data.objects:
    if o.type == "MESH":
        r = next((v for k_, v in DEC.items() if o.name.startswith(k_)), None)
        if r and len(o.data.polygons) > 800 and not o.name.endswith("_lid"):
            d = o.modifiers.new("Dec", "DECIMATE"); d.ratio = r
        elif r and o.name.endswith("_lid"):
            d = o.modifiers.new("Dec", "DECIMATE"); d.ratio = r
BIG = ("carte", "lin_marine", "teck_placage", "teck_houx", "plank_flooring", "wood_plank_wall", "oak_wood", "livre", "photo")
for im in bpy.data.images:
    try:
        w, h = im.size; lim = 2048 if "carte" in im.name else (1024 if any(k in im.name for k in BIG) else 512)
        if max(w, h) > lim: f = lim / max(w, h); im.scale(int(w * f), int(h * f))
    except Exception as e: print("img", im.name, e)
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", export_apply=True, export_yup=True, export_cameras=False, export_lights=False,
                          export_image_format="JPEG", export_jpeg_quality=80, use_visible=False)
print("GLB", OUT, os.path.getsize(OUT))
