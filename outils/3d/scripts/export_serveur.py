"""Exporte l'île du serveur pour le site : la base flottante (site/assets/base.glb) et le manège sous-marin (site/assets/manege.glb).
Base : centre du bassin à l'origine, bassin dans l'axe X (ouvert vers -X), pont à 5 m, flottaison à 0.
Manège : plateau au niveau 0 (le site le pose à -20 m) ; tout ce qui tourne est sous le nœud « Tournant », la tour du centre reste fixe.
Chaque caisson « Caisson0 »…« Caisson4 » a un enfant « Rideau… » (sa face avant, qui s'ouvre en tournant autour de X), une « Reglette » (éclairage) ;
les câbles vers la tour s'appellent « Liaison0 »…« Liaison4 ».
Usage : Blender -b --factory-startup -P 3d/scripts/export_serveur.py"""
import bpy, os, sys
HOME = os.path.expanduser("~/portfoliov2")
sys.path.insert(0, os.path.join(HOME, "3d", "scripts"))
OUT = os.path.join(HOME, "site", "assets")


def vider():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)


def preparer():
    sc = bpy.context.scene
    for o in list(sc.objects):
        if o.type == "LIGHT": bpy.data.objects.remove(o, do_unlink=True)
    for o in [o for o in sc.objects if o.type == "FONT"]: o.data.resolution_u = 2
    for o in [o for o in sc.objects if o.type == "CURVE"]: o.data.resolution_u = 6
    for o in [o for o in sc.objects if o.type in ("FONT", "CURVE")]:
        bpy.ops.object.select_all(action="DESELECT"); bpy.context.view_layer.objects.active = o; o.select_set(True); bpy.ops.object.convert(target="MESH")
    for o in sc.objects:
        if o.type == "MESH" and len(o.data.polygons) > 30 and not o.name.startswith(("Gravure", "Nom", "Marquage", "H")):
            for pg in o.data.polygons: pg.use_smooth = True


def exporter(nom):
    p = os.path.join(OUT, nom); bpy.ops.export_scene.gltf(filepath=p, export_format="GLB", export_apply=True, export_lights=False, export_cameras=False, export_extras=False, export_yup=True)
    print("EXPORT", nom, os.path.getsize(p) // 1024, "Ko")


vider()
import formes as F
import base_station as BS, carrousel as CR
# 1. la base
BS.build_base(F.H()); preparer(); exporter("base.glb")
# 2. le manège
vider()
CR.build_carrousel(F.H(), 0.0, rot=0.0, ouvert=-1, k_ouv=0.0, style="tiroirs", liens=None)
sc = bpy.context.scene; tour = ("Tour", "DomeTour", "HublotTour", "PlaqueTour", "GravureTour")
t = bpy.data.objects.new("Tournant", None); sc.collection.objects.link(t)
for o in [o for o in sc.objects if o.parent is None and o is not t and not o.name.startswith(tour)]: o.parent = t
preparer(); exporter("manege.glb")
