"""Exporte l'île de Vigie pour le site : la plateforme de lancement et sa fusée (site/assets/vigie.glb). Voir vigie_plateforme.py pour les nœuds.
Usage : Blender -b --factory-startup -P 3d/scripts/export_vigie.py   (option -- rendu.png : en plus, une image de contrôle)"""
import bpy, os, sys, math
HOME = os.path.expanduser("~/portfoliov2")
sys.path.insert(0, os.path.join(HOME, "3d", "scripts"))
OUT = os.path.join(HOME, "site", "assets")
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
import formes as F, vigie_plateforme as VP
VP.build(F.H())
sc = bpy.context.scene
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
for o in [o for o in sc.objects if o.type == "FONT"]: o.data.resolution_u = 2
for o in [o for o in sc.objects if o.type == "FONT"]:
    bpy.ops.object.select_all(action="DESELECT"); bpy.context.view_layer.objects.active = o; o.select_set(True); bpy.ops.object.convert(target="MESH")
for o in sc.objects:
    if o.type == "MESH" and len(o.data.polygons) > 30 and not o.name.startswith(("Marquage", "NomFusee", "Pont", "Hangar", "Conteneur", "PasDeTir")):
        for pg in o.data.polygons: pg.use_smooth = True
if argv:   # image de contrôle (EEVEE)
    cam = bpy.data.objects.new("Cam", bpy.data.cameras.new("Cam")); sc.collection.objects.link(cam); sc.camera = cam
    cam.location = (-70, -95, 45); cam.rotation_euler = (math.radians(72), 0, math.radians(-36)); cam.data.lens = 35
    sun = bpy.data.objects.new("Sol", bpy.data.lights.new("Sol", "SUN")); sun.data.energy = 4; sun.rotation_euler = (0.8, 0.2, -0.6); sc.collection.objects.link(sun)
    w = bpy.data.worlds.new("W"); sc.world = w; w.use_nodes = True; w.node_tree.nodes["Background"].inputs[0].default_value = (0.6, 0.7, 0.85, 1); w.node_tree.nodes["Background"].inputs[1].default_value = 0.8
    try: sc.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError: sc.render.engine = "BLENDER_EEVEE"
    sc.render.resolution_x, sc.render.resolution_y = 1280, 800; sc.render.filepath = argv[0]; bpy.ops.render.render(write_still=True); print("RENDU", argv[0])
p = os.path.join(OUT, "vigie.glb")
bpy.ops.export_scene.gltf(filepath=p, export_format="GLB", export_apply=True, export_lights=False, export_cameras=False, export_extras=False, export_yup=True)
print("EXPORT vigie.glb", os.path.getsize(p) // 1024, "Ko")
