"""Exporte Elba et sa transformation en sous-marin pour le site : site/assets/elba_sousmarin.glb.
L'animation « mue » couvre t de 0 à 1 sur NF images (le site la joue en réglant le temps de l'action).
Les fondus de couleur, les feux et la bascule de coque (Coque -> CoqueSousMarin à T_SWAP) sont faits par le site.
Usage : Blender -b --factory-startup -P 3d/scripts/export_sousmarin.py"""
import bpy, os, sys, math
HOME = os.path.expanduser("~/portfoliov2")
sys.path.insert(0, os.path.join(HOME, "3d", "scripts"))
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
import sousmarin as SM

sc = bpy.context.scene
sub = SM.Sub((0, 0, 0), 0.0)
# pas de lumières dans le fichier (le site crée les siennes) ; les textes deviennent des maillages
for o in list(sc.objects):
    if o.type == "LIGHT": bpy.data.objects.remove(o, do_unlink=True)
for o in [o for o in sc.objects if o.type == "FONT"]:
    bpy.context.view_layer.objects.active = o; o.select_set(True); bpy.ops.object.convert(target="MESH"); o.select_set(False)
NF = 120; sc.frame_start, sc.frame_end = 0, NF; sc.render.fps = 24
sub.feux = []
for f in range(NF + 1):
    sub.pose(f / NF, profondeur=0.0); sub.key(f)
# interpolation linéaire entre les images (l'animation est déjà échantillonnée)
for ob in [o for o in sc.objects if o.animation_data and o.animation_data.action] + [k for k in bpy.data.shape_keys if k.animation_data and k.animation_data.action]:
    act = ob.animation_data.action
    curves = act.fcurves if hasattr(act, "fcurves") else [fc for l in act.layers for s in l.strips for cb in s.channelbags for fc in cb.fcurves]
    for fc in curves:
        for kp in fc.keyframe_points: kp.interpolation = "LINEAR"
sub.pose(0.0, profondeur=0.0); sc.frame_set(0)
out = os.path.join(HOME, "site", "assets", "elba_sousmarin.glb")
bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_animations=True, export_animation_mode="SCENE", export_force_sampling=True,
                          export_morph=True, export_morph_normal=True, export_lights=False, export_cameras=False, export_apply=False,
                          export_optimize_animation_size=True, export_extras=False, export_yup=True)
print("EXPORT", out, os.path.getsize(out) // 1024, "Ko")
