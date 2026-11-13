"""Scène commune (mer, voilier, île, phare) + 4 styles de rendu.
Usage : Blender -b -P scene.py -- <style> [preview]
styles : realiste | toon | diorama | nuit
"""
import bpy, bmesh, math, os, sys
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")
OUT = os.path.join(ROOT, "renders")
os.makedirs(OUT, exist_ok=True)
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else ["realiste"]
STYLE = argv[0]
PREVIEW = "preview" in argv

sc = bpy.context.scene
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
for c in list(bpy.data.collections):
    bpy.data.collections.remove(c)


def coll(name):
    c = bpy.data.collections.new(name)
    sc.collection.children.link(c)
    return c


C_SEA, C_BOAT, C_ISL = coll("Mer"), coll("Bateau"), coll("Ile")


def put(o, c):
    for uc in list(o.users_collection):
        uc.objects.unlink(o)
    c.objects.link(o)
    return o


def prim(op, name, c, **kw):
    op(**kw)
    o = bpy.context.active_object
    o.name = name
    return put(o, c)


# ---------------------------------------------------------------- matériaux
def bsdf(m):
    return next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")


def pmat(name, color, rough=0.4, metal=0.0, emit=None, emit_s=0.0, trans=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = bsdf(m)
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    b.inputs["Transmission Weight"].default_value = trans
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1)
        b.inputs["Emission Strength"].default_value = emit_s
    return m


def toon(name, color, shade=0.55, outline=True):
    """Aplats : diffuse -> Shader to RGB -> rampe constante -> émission."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != "OUTPUT_MATERIAL":
            nt.nodes.remove(n)
    out = next(n for n in nt.nodes if n.type == "OUTPUT_MATERIAL")
    d = nt.nodes.new("ShaderNodeBsdfDiffuse")
    s2r = nt.nodes.new("ShaderNodeShaderToRGB")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "CONSTANT"
    e0, e1 = ramp.color_ramp.elements
    e0.position, e0.color = 0.0, (color[0] * shade, color[1] * shade, color[2] * (shade + 0.1), 1)
    e1.position, e1.color = 0.32, (*color, 1)
    hi = ramp.color_ramp.elements.new(0.85)
    hi.color = (min(1, color[0] * 1.15 + 0.08), min(1, color[1] * 1.15 + 0.08), min(1, color[2] * 1.1 + 0.08), 1)
    em = nt.nodes.new("ShaderNodeEmission")
    nt.links.new(d.outputs[0], s2r.inputs[0])
    nt.links.new(s2r.outputs["Color"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], em.inputs["Color"])
    nt.links.new(em.outputs[0], out.inputs["Surface"])
    return m


def setm(o, m):
    o.data.materials.clear()
    o.data.materials.append(m)


# ---------------------------------------------------------------- mer
bpy.ops.mesh.primitive_plane_add(size=2)
sea = put(bpy.context.active_object, C_SEA)
sea.name = "Ocean"
om = sea.modifiers.new("Ocean", "OCEAN")
om.geometry_mode = "GENERATE"
om.size = 1.0
om.spatial_size = 80
om.repeat_x = om.repeat_y = 3
om.resolution = 8 if PREVIEW else 18
om.viewport_resolution = 6
om.wave_scale = 0.75
om.choppiness = 1.3
om.wind_velocity = 9
om.random_seed = 7
om.use_normals = True
om.use_foam = True
om.foam_layer_name = "foam"
om.foam_coverage = 0.05
sea.location = (-120, -110, 0)
bpy.ops.object.shade_smooth()
bpy.ops.mesh.primitive_plane_add(size=8000, location=(0, 0, -0.3))
far = put(bpy.context.active_object, C_SEA)
far.name = "MerLoin"

# ---------------------------------------------------------------- Elba (Flirt 6 m, d'après photos)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import elba as ELBA
rig, ROLES = ELBA.build_elba(C_BOAT)
rig.location = (0, 0, 0.0)
rig.rotation_euler = (math.radians(-7), math.radians(3), math.radians(-95))

# ---------------------------------------------------------------- île + phare
tex = bpy.data.textures.new("RochNoise", "CLOUDS")
tex.noise_scale, tex.noise_depth = 0.9, 4
tex2 = bpy.data.textures.new("RochVor", "VORONOI")
tex2.noise_scale = 0.35
rock = prim(bpy.ops.mesh.primitive_ico_sphere_add, "Rocher", C_ISL, subdivisions=6, radius=14, location=(-30, 70, 0.5))
rock.scale = (1.4, 1.0, 0.62)
d = rock.modifiers.new("D", "DISPLACE")
d.texture, d.strength = tex, 4.5
d2 = rock.modifiers.new("D2", "DISPLACE")
d2.texture, d2.strength = tex2, 1.5
bpy.ops.object.shade_smooth()
rocks = [rock]
for i, (x, y, s) in enumerate([(-12, 58, 2.5), (-16, 55, 1.6), (-48, 64, 3), (-8, 66, 1.2)]):
    r = prim(bpy.ops.mesh.primitive_ico_sphere_add, f"Caillou{i}", C_ISL, subdivisions=3, radius=s, location=(x, y, -0.5))
    r.scale = (1.3, 1, 0.6)
    dd = r.modifiers.new("D", "DISPLACE")
    dd.texture, dd.strength = tex, s * 0.5
    bpy.ops.object.shade_smooth()
    rocks.append(r)
gx, gy, gz = -26, 72, 8.3
P = {}
P["tour"] = prim(bpy.ops.mesh.primitive_cone_add, "PhareTour", C_ISL, vertices=32, radius1=1.6, radius2=1.05, depth=11, location=(gx, gy, gz + 5.5))
P["b1"] = prim(bpy.ops.mesh.primitive_cylinder_add, "PhareBande", C_ISL, vertices=32, radius=1.42, depth=1.6, location=(gx, gy, gz + 4.2))
P["b2"] = prim(bpy.ops.mesh.primitive_cylinder_add, "PhareBande2", C_ISL, vertices=32, radius=1.25, depth=1.6, location=(gx, gy, gz + 8.2))
P["gal"] = prim(bpy.ops.mesh.primitive_cylinder_add, "PhareGalerie", C_ISL, vertices=32, radius=1.6, depth=0.25, location=(gx, gy, gz + 11.1))
P["lan"] = prim(bpy.ops.mesh.primitive_cylinder_add, "PhareLanterne", C_ISL, vertices=16, radius=0.85, depth=1.4, location=(gx, gy, gz + 11.9))
P["dome"] = prim(bpy.ops.mesh.primitive_cone_add, "PhareDome", C_ISL, vertices=32, radius1=1.0, radius2=0.1, depth=1.1, location=(gx, gy, gz + 13.15))
P["maison"] = prim(bpy.ops.mesh.primitive_cube_add, "Maison", C_ISL, size=1, location=(gx + 4, gy - 1, gz + 0.8))
P["maison"].scale = (3.2, 2.2, 2.0)
P["toit"] = prim(bpy.ops.mesh.primitive_cylinder_add, "Toit", C_ISL, vertices=3, radius=1.6, depth=3.4, location=(gx + 4, gy - 1, gz + 2.1), rotation=(0, math.pi / 2, 0))
P["toit"].scale = (1, 1.3, 1)
for o in P.values():
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.shade_smooth() if o.name in ("PhareTour", "PhareBande", "PhareBande2", "PhareGalerie", "PhareDome") else None

# ---------------------------------------------------------------- caméra
cd = bpy.data.cameras.new("Camera")
cam = bpy.data.objects.new("Camera", cd)
sc.collection.objects.link(cam)
sc.camera = cam
cd.clip_end = 6000


def aim(loc, target, lens):
    cam.location = loc
    cam.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    cd.lens = lens


aim((7.5, -10.5, 2.7), (-4, 10, 5.0), 26)
sc.render.resolution_x, sc.render.resolution_y = 1600, 900
sc.render.resolution_percentage = 50 if PREVIEW else 100
sc.view_settings.view_transform = "AgX"
sc.view_settings.look = "None"


def use_engine(name):
    try:
        sc.render.engine = name
    except TypeError as e:
        print("engines:", e)
        raise


def cycles(samples):
    use_engine("CYCLES")
    sc.cycles.samples = 16 if PREVIEW else samples
    sc.cycles.use_denoising = True
    try:
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "METAL"
        prefs.get_devices()
        for dv_ in prefs.devices:
            dv_.use = True
        sc.cycles.device = "GPU"
    except Exception as e:
        print("GPU:", e)


def world_hdri(path, strength=1.0, rot=200):
    w = bpy.data.worlds.new("Monde")
    sc.world = w
    w.use_nodes = True
    nt = w.node_tree
    bg = next(n for n in nt.nodes if n.type == "BACKGROUND")
    env = nt.nodes.new("ShaderNodeTexEnvironment")
    env.image = bpy.data.images.load(path)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Rotation"].default_value[2] = math.radians(rot)
    nt.links.new(tc.outputs["Generated"], mp.inputs["Vector"])
    nt.links.new(mp.outputs["Vector"], env.inputs["Vector"])
    nt.links.new(env.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = strength
    return w


def world_gradient(bottom, top, strength=1.0, stars=False):
    w = bpy.data.worlds.new("Monde")
    sc.world = w
    w.use_nodes = True
    nt = w.node_tree
    bg = next(n for n in nt.nodes if n.type == "BACKGROUND")
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position, ramp.color_ramp.elements[0].color = 0.0, (*bottom, 1)
    ramp.color_ramp.elements[1].position, ramp.color_ramp.elements[1].color = 0.45, (*top, 1)
    nt.links.new(tc.outputs["Generated"], sep.inputs[0])
    nt.links.new(sep.outputs["Z"], ramp.inputs["Fac"])
    col_out = ramp.outputs["Color"]
    if stars:
        vor = nt.nodes.new("ShaderNodeTexVoronoi")
        vor.inputs["Scale"].default_value = 420
        st = nt.nodes.new("ShaderNodeMapRange")
        st.inputs["From Min"].default_value, st.inputs["From Max"].default_value = 0.0, 0.05
        st.inputs["To Min"].default_value, st.inputs["To Max"].default_value = 6.0, 0.0
        st.clamp = True
        nt.links.new(tc.outputs["Generated"], vor.inputs["Vector"])
        nt.links.new(vor.outputs["Distance"], st.inputs["Value"])
        mask = nt.nodes.new("ShaderNodeMapRange")
        mask.inputs["From Min"].default_value, mask.inputs["From Max"].default_value = 0.5, 0.56
        nt.links.new(sep.outputs["Z"], mask.inputs["Value"])
        mul = nt.nodes.new("ShaderNodeMath")
        mul.operation = "MULTIPLY"
        nt.links.new(st.outputs[0], mul.inputs[0])
        nt.links.new(mask.outputs[0], mul.inputs[1])
        add = nt.nodes.new("ShaderNodeMixRGB")
        add.blend_type = "ADD"
        add.inputs["Fac"].default_value = 1.0
        nt.links.new(col_out, add.inputs["Color1"])
        nt.links.new(mul.outputs[0], add.inputs["Color2"])
        col_out = add.outputs["Color"]
    nt.links.new(col_out, bg.inputs["Color"])
    bg.inputs["Strength"].default_value = strength
    return w


def rock_pbr(scale=3.0):
    m = bpy.data.materials.new("Roche")
    m.use_nodes = True
    nt = m.node_tree
    b = bsdf(m)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (scale, scale, scale)
    nt.links.new(tc.outputs["UV"], mp.inputs["Vector"])

    def img(fn, noncolor=False):
        t = nt.nodes.new("ShaderNodeTexImage")
        t.image = bpy.data.images.load(os.path.join(ASSETS, fn))
        if noncolor:
            t.image.colorspace_settings.name = "Non-Color"
        nt.links.new(mp.outputs["Vector"], t.inputs["Vector"])
        return t
    dif = img("marble_cliff_05_diff_1k.jpg")
    rgh = img("marble_cliff_05_rough_1k.jpg", True)
    nor = img("marble_cliff_05_nor_gl_1k.jpg", True)
    nm = nt.nodes.new("ShaderNodeNormalMap")
    nt.links.new(dif.outputs["Color"], b.inputs["Base Color"])
    nt.links.new(rgh.outputs["Color"], b.inputs["Roughness"])
    nt.links.new(nor.outputs["Color"], nm.inputs["Color"])
    nt.links.new(nm.outputs["Normal"], b.inputs["Normal"])
    return m


def water_pbr(color=(0.01, 0.07, 0.1), foam_col=(0.9, 0.92, 0.93), trans=0.0):
    w = bpy.data.materials.new("Eau")
    w.use_nodes = True
    nt = w.node_tree
    b = bsdf(w)
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = 0.04
    b.inputs["IOR"].default_value = 1.33
    b.inputs["Transmission Weight"].default_value = trans
    fa = nt.nodes.new("ShaderNodeAttribute")
    fa.attribute_name = "foam"
    rp = nt.nodes.new("ShaderNodeValToRGB")
    rp.color_ramp.elements[0].position, rp.color_ramp.elements[1].position = 0.62, 0.95
    fb = nt.nodes.new("ShaderNodeBsdfPrincipled")
    fb.inputs["Base Color"].default_value = (*foam_col, 1)
    fb.inputs["Roughness"].default_value = 0.7
    mix = nt.nodes.new("ShaderNodeMixShader")
    out = next(n for n in nt.nodes if n.type == "OUTPUT_MATERIAL")
    nt.links.new(fa.outputs["Fac"], rp.inputs["Fac"])
    nt.links.new(rp.outputs["Color"], mix.inputs["Fac"])
    nt.links.new(b.outputs["BSDF"], mix.inputs[1])
    nt.links.new(fb.outputs["BSDF"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])
    return w


def assign_common(M, toon_fn=None):
    setm(sea, M["eau"]); setm(far, M["eau"])
    fb = {"liston": "hublot", "inox": "alu", "cable": "alu", "bois": "pont", "moteur": "hublot",
          "bouee": "rouge", "nom": "blanc", "feu_babord": "lanterne", "feu_tribord": "lanterne", "feu_tete": "lanterne"}
    hullm = M.get("coque_elba") or ELBA.hull_material(toon_fn=toon_fn)
    def resolve(role):
        if role == "coque":
            return hullm
        return M.get(role) or M.get("feu_" + role) or M.get(fb.get(role, "blanc"))
    for o in ROLES.get("_multi", []):
        for i, sl in enumerate(o.material_slots):
            if sl.material and sl.material.name.startswith("role:"):
                o.data.materials[i] = resolve(sl.material.name[5:])
    for role, objs in ROLES.items():
        if role == "_multi":
            continue
        if role == "coque":
            mat = hullm
        elif role == "voile" and not toon_fn:
            mat = ELBA.seam_material(M["voile"])
        else:
            mat = M.get(role) or M.get("feu_" + role) or M.get(fb.get(role, "blanc"))
        for o in objs:
            o.data.materials.clear(); o.data.materials.append(mat)
    for r in rocks:
        setm(r, M["roche"])
    for k in ("tour", "gal", "dome", "maison"):
        setm(P[k], M["blanc"])
    setm(P["b1"], M["rouge"]); setm(P["b2"], M["rouge"]); setm(P["toit"], M["toit"]); setm(P["lan"], M["lanterne"])




def load_phare(loc, scale, rot_z=0.0):
    """Phare Sketchfab (spospider, CC-BY) depuis la bibliothèque locale. Renvoie la position de la lanterne."""
    lib = os.path.join(ASSETS, "phare_sketchfab.blend")
    with bpy.data.libraries.load(lib, link=False) as (src, dst):
        dst.objects = list(src.objects)
    c = coll("PhareSF")
    root = None
    for o in dst.objects:
        if o is None:
            continue
        c.objects.link(o)
        if o.name.startswith("PhareSketchfab"):
            root = o
    root.location = loc
    root.scale = (root.scale[0] * scale,) * 3
    root.rotation_euler = (root.rotation_euler[0], root.rotation_euler[1], rot_z)
    bpy.context.view_layer.update()
    for o in C_ISL.objects:
        o.hide_render = True
    glass = [o for o in c.objects if "topLightGlass" in o.name and o.type == "MESH"]
    pts = [o.matrix_world @ Vector(b) for o in glass for b in o.bound_box]
    ctr = sum(pts, Vector()) / len(pts)
    print("lanterne", ctr)
    return ctr



def load_elba_sf(night=False):
    """Elba d'après le modèle Sketchfab « Pocket Cruiser Sailboat » (parsonsben, CC-BY), recoloré.
    Le bateau reste orienté étrave vers -Y (cap ≈ celui du rig maison)."""
    lib = os.path.join(ASSETS, "elba_sketchfab.blend")
    with bpy.data.libraries.load(lib, link=False) as (src, dst):
        dst.objects = list(src.objects)
    c = coll("ElbaSF")
    root = None
    for o in dst.objects:
        if o is None:
            continue
        c.objects.link(o)
        if o.name.startswith("ElbaSketchfab"):
            root = o
    root.location = (0.0, 0.0, -0.62)
    root.rotation_euler = (0.0, math.radians(-5), 0.0)
    for mat in bpy.data.materials:
        if mat.name.startswith("ElbaRecolor") and mat.node_tree:
            for n in mat.node_tree.nodes:
                if n.type == "TEX_COORD":
                    n.object = root
            print("recolor relié à", root.name, mat.name)
    for o in C_BOAT.objects:
        o.hide_render = True
    bpy.context.view_layer.update()
    if night:
        hull = next(o for o in c.objects if o.type == "MESH" and o.name.endswith("M_PocketCruiserSailboat_0") and "Rudder" not in o.name and "Sails" not in o.name)
        W = [hull.matrix_world @ v.co for v in hull.data.vertices]
        top = max(W, key=lambda p: p.z)
        bow = min(W, key=lambda p: p.y)
        for nm, pos, col in (("FeuTeteSF", top + Vector((0, 0, 0.08)), (1, 1, 1)), ("FeuBabSF", bow + Vector((0.35, 0.35, 0.55)), (1, 0.05, 0.05)), ("FeuTriSF", bow + Vector((-0.35, 0.35, 0.55)), (0.1, 1, 0.25))):
            sph = prim(bpy.ops.mesh.primitive_uv_sphere_add, nm, c, radius=0.06, location=pos)
            setm(sph, pmat(nm, col, emit=col, emit_s=60))
        cab = bpy.data.lights.new("CabineSF", "POINT"); cab.energy = 40; cab.color = (1, 0.65, 0.35)
        co = bpy.data.objects.new("CabineSF", cab); c.objects.link(co); co.location = (0, 0.3, 1.5)
    return root

# ================================================================= STYLES
if STYLE == "realiste":
    cycles(128)
    world_hdri(os.path.join(ASSETS, "umhlanga_sunrise_2k.hdr"), 1.0, 200)
    M = dict(eau=water_pbr(), coque=pmat("Gelcoat", (0.86, 0.86, 0.84), 0.15), pont=pmat("Pont", (0.6, 0.58, 0.53), 0.6),
             liston=pmat("Liston", (0.02, 0.02, 0.025), 0.4), rouf=pmat("Rouf", (0.82, 0.82, 0.8), 0.3),
             hublot=pmat("Hublot", (0.02, 0.03, 0.04), 0.05), alu=pmat("Alu", (0.8, 0.8, 0.82), 0.25, 1.0),
             voile=pmat("Voile", (0.9, 0.88, 0.82), 0.75, trans=0.12), roche=rock_pbr(3.0),
             blanc=pmat("Blanc", (0.82, 0.8, 0.76), 0.6), rouge=pmat("Rouge", (0.55, 0.05, 0.04), 0.5),
             toit=pmat("Ardoise", (0.12, 0.13, 0.15), 0.5), lanterne=pmat("Lanterne", (1, 0.85, 0.5), 0.2, emit=(1, 0.8, 0.45), emit_s=6),
             inox=pmat("Inox", (0.85, 0.86, 0.88), 0.15, 1.0),
             cable=pmat("Cable", (0.7, 0.7, 0.72), 0.3, 1.0), bois=pmat("Bois", (0.32, 0.17, 0.08), 0.5),
             moteur=pmat("Moteur", (0.03, 0.03, 0.035), 0.35), bouee=pmat("Bouee", (0.95, 0.25, 0.04), 0.5),
             nom=pmat("Nom", (0.95, 0.95, 0.95), 0.3))
    M["pont"] = pmat("PontBlanc", (0.82, 0.81, 0.77), 0.55)
    assign_common(M)
    load_phare((-30, 70, -1.0), 1.5, math.radians(200))
    # load_elba_sf()  # modèle Sketchfab écarté : on garde Elba modélisé
    cd.dof.use_dof = True
    cd.dof.focus_object = rig
    cd.dof.aperture_fstop = 8

elif STYLE == "toon":
    use_engine("BLENDER_EEVEE")
    sc.eevee.taa_render_samples = 32 if PREVIEW else 64
    world_gradient((0.95, 0.78, 0.62), (0.32, 0.62, 0.92), 1.0)
    sun = bpy.data.lights.new("Soleil", "SUN")
    sun.energy = 4.0
    so = bpy.data.objects.new("Soleil", sun)
    sc.collection.objects.link(so)
    so.rotation_euler = (math.radians(55), 0, math.radians(-40))
    om.wave_scale = 0.6
    om.choppiness = 0.9
    eau = toon("EauToon", (0.12, 0.55, 0.72), 0.6)
    # écume dessinée sur les crêtes
    nt = eau.node_tree
    em = next(n for n in nt.nodes if n.type == "EMISSION")
    fa = nt.nodes.new("ShaderNodeAttribute"); fa.attribute_name = "foam"
    rp = nt.nodes.new("ShaderNodeValToRGB"); rp.color_ramp.interpolation = "CONSTANT"
    rp.color_ramp.elements[1].position = 0.55
    ramp_main = [n for n in nt.nodes if n.type == "VALTORGB" and n is not rp][0]
    mixc = nt.nodes.new("ShaderNodeMixRGB")
    mixc.inputs["Color2"].default_value = (0.97, 0.99, 1, 1)
    nt.links.new(fa.outputs["Fac"], rp.inputs["Fac"])
    nt.links.new(rp.outputs["Color"], mixc.inputs["Fac"])
    nt.links.new(ramp_main.outputs["Color"], mixc.inputs["Color1"])
    nt.links.new(mixc.outputs["Color"], em.inputs["Color"])
    M = dict(eau=eau, coque=toon("Coque", (0.96, 0.95, 0.9)), pont=toon("Pont", (0.85, 0.65, 0.42)), liston=toon("Liston", (0.1, 0.2, 0.45)),
             rouf=toon("Rouf", (0.98, 0.97, 0.93)), hublot=toon("Hublot", (0.1, 0.12, 0.2)), alu=toon("Alu", (0.75, 0.78, 0.82)),
             voile=toon("Voile", (1.0, 0.97, 0.9), 0.75), roche=toon("Roche", (0.62, 0.56, 0.5)), blanc=toon("Blanc", (0.97, 0.95, 0.9)),
             rouge=toon("Rouge", (0.88, 0.2, 0.18)), toit=toon("Toit", (0.25, 0.3, 0.42)), lanterne=toon("Lanterne", (1, 0.9, 0.5), 1.0))
    assign_common(M, toon_fn=toon)
    sc.render.use_freestyle = True
    sc.render.line_thickness_mode = "ABSOLUTE"
    sc.render.line_thickness = 1.6
    ls = sc.view_layers[0].freestyle_settings.linesets[0]
    ls.linestyle.color = (0.08, 0.1, 0.16)
    ls.select_by_visibility = True
    far.hide_render = True
    sea.visible_shadow = False
    sc.view_settings.view_transform = "Standard"
    # roche plus simple : moins de bosses pour un dessin plus lisible
    rock.modifiers["D2"].strength = 0.4
    rock.modifiers["D"].strength = 3.0
    sc.view_settings.view_transform = "Standard"
    # roche plus simple : moins de bosses pour un dessin plus lisible
    rock.modifiers["D2"].strength = 0.4
    rock.modifiers["D"].strength = 3.0

elif STYLE == "diorama":
    cycles(128)
    # île rapprochée et réduite, la mer découpée en disque posé sur un socle
    for o in C_ISL.objects:
        o.location = Vector((o.location.x * 0.42 + 2, o.location.y * 0.42 - 6, o.location.z * 0.42))
        o.scale = o.scale * 0.42
    for m_ in rock.modifiers:
        m_.strength *= 0.42
    far.hide_render = True
    sea.hide_render = True
    # disque d'eau : grille circulaire, vagues en déplacement, épaisseur vers le bas
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=220, y_segments=220, size=24)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.xy.length > 24.0], context="VERTS")
    dmesh = bpy.data.meshes.new("DisqueEau")
    bm.to_mesh(dmesh)
    bm.free()
    disc = bpy.data.objects.new("DisqueEau", dmesh)
    C_SEA.objects.link(disc)
    disc.location = (-4, 10, 0)
    for p in dmesh.polygons:
        p.use_smooth = True
    od = disc.modifiers.new("Ocean", "OCEAN")
    od.geometry_mode = "DISPLACE"
    od.spatial_size = 40
    od.resolution = 14
    od.wave_scale = 0.35
    od.choppiness = 1.0
    od.wind_velocity = 8
    od.random_seed = 7
    od.use_foam = False
    od.foam_layer_name = "foam"
    od.foam_coverage = 0.05
    so_ = disc.modifiers.new("Epaisseur", "SOLIDIFY")
    so_.thickness = 8.0
    so_.offset = -1
    so_.use_rim = True
    sea = disc
    socle = prim(bpy.ops.mesh.primitive_cylinder_add, "Socle", C_SEA, vertices=96, radius=24.6, depth=3, location=(-4, 10, -9.8))
    sb = socle.modifiers.new("Bev", "BEVEL"); sb.width, sb.segments = 0.4, 4
    fond = prim(bpy.ops.mesh.primitive_cylinder_add, "FondMer", C_SEA, vertices=96, radius=23.9, depth=0.5, location=(-4, 10, -8.2))
    sable = prim(bpy.ops.mesh.primitive_ico_sphere_add, "FondSable", C_SEA, subdivisions=4, radius=23.5, location=(-4, 10, -7.9))
    sable.scale = (1, 1, 0.08)
    world_gradient((0.93, 0.9, 0.86), (0.82, 0.86, 0.9), 0.6)
    for nm, loc, en, sz in (("Cle", (40, -40, 50), 9000, 30), ("Remp", (-50, -10, 30), 2500, 40), ("Contre", (-10, 60, 40), 4000, 20)):
        ld = bpy.data.lights.new(nm, "AREA"); ld.energy = en; ld.size = sz
        lo = bpy.data.objects.new(nm, ld); sc.collection.objects.link(lo)
        lo.location = loc
        lo.rotation_euler = (Vector((-4, 10, 0)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    eau = water_pbr((0.06, 0.38, 0.42), trans=0.9)
    vol = eau.node_tree.nodes.new("ShaderNodeVolumeAbsorption")
    vol.inputs["Color"].default_value = (0.45, 0.82, 0.86, 1); vol.inputs["Density"].default_value = 0.05
    eau.node_tree.links.new(vol.outputs[0], next(n for n in eau.node_tree.nodes if n.type == "OUTPUT_MATERIAL").inputs["Volume"])
    M = dict(eau=eau, coque=pmat("Gelcoat", (0.9, 0.9, 0.87), 0.35), pont=pmat("Pont", (0.7, 0.55, 0.38), 0.6),
             liston=pmat("Liston", (0.05, 0.12, 0.3), 0.4), rouf=pmat("Rouf", (0.88, 0.88, 0.85), 0.4),
             hublot=pmat("Hublot", (0.05, 0.06, 0.08), 0.2), alu=pmat("Alu", (0.75, 0.75, 0.75), 0.35, 1.0),
             voile=pmat("Voile", (0.95, 0.93, 0.88), 0.8), roche=pmat("RocheMaquette", (0.55, 0.5, 0.45), 0.85),
             blanc=pmat("Blanc", (0.92, 0.9, 0.86), 0.6), rouge=pmat("Rouge", (0.75, 0.12, 0.1), 0.55),
             toit=pmat("Toit", (0.2, 0.25, 0.35), 0.6), lanterne=pmat("Lanterne", (1, 0.85, 0.5), 0.2, emit=(1, 0.8, 0.45), emit_s=3))
    assign_common(M)
    setm(socle, pmat("Bois", (0.35, 0.2, 0.1), 0.45))
    setm(fond, pmat("FondBleu", (0.05, 0.2, 0.25), 0.8))
    setm(sable, pmat("Sable", (0.75, 0.65, 0.48), 0.9))
    for o in C_ISL.objects:
        pass
    rig.scale = (0.9, 0.9, 0.9)
    aim((66, -74, 50), (-4, 9, -3.5), 72)
    cd.dof.use_dof = True
    cd.dof.focus_object = rig
    cd.dof.aperture_fstop = 1.4

elif STYLE == "nuit":
    cycles(160)
    world_gradient((0.02, 0.035, 0.08), (0.003, 0.006, 0.02), 1.0, stars=True)
    moon = bpy.data.lights.new("Lune", "SUN"); moon.energy = 0.35; moon.color = (0.65, 0.75, 1.0); moon.angle = math.radians(0.6)
    mo = bpy.data.objects.new("Lune", moon); sc.collection.objects.link(mo)
    mo.rotation_euler = (math.radians(70), 0, math.radians(150))
    disc = prim(bpy.ops.mesh.primitive_uv_sphere_add, "DisqueLune", C_SEA, radius=18, location=(-900, 700, 240))
    setm(disc, pmat("Lune", (1, 1, 1), 1.0, emit=(0.95, 0.95, 1.0), emit_s=8))
    eau = water_pbr((0.005, 0.015, 0.03), foam_col=(0.3, 0.8, 1.0))
    fb = [n for n in eau.node_tree.nodes if n.type == "BSDF_PRINCIPLED"][1]
    fb.inputs["Emission Color"].default_value = (0.2, 0.85, 1.0, 1); fb.inputs["Emission Strength"].default_value = 0.25
    M = dict(eau=eau, coque=pmat("Gelcoat", (0.8, 0.8, 0.78), 0.2), pont=pmat("Pont", (0.5, 0.48, 0.44), 0.6),
             liston=pmat("Liston", (0.03, 0.08, 0.2), 0.3), rouf=pmat("Rouf", (0.75, 0.75, 0.73), 0.3),
             hublot=pmat("HublotNuit", (1, 0.7, 0.35), 0.3, emit=(1, 0.62, 0.3), emit_s=12), alu=pmat("Alu", (0.8, 0.8, 0.82), 0.25, 1.0),
             voile=pmat("Voile", (0.85, 0.85, 0.82), 0.75, trans=0.1), roche=rock_pbr(3.0),
             blanc=pmat("Blanc", (0.8, 0.78, 0.74), 0.6), rouge=pmat("Rouge", (0.5, 0.05, 0.04), 0.5),
             toit=pmat("Ardoise", (0.1, 0.11, 0.13), 0.5), lanterne=pmat("Lanterne", (1, 0.9, 0.65), 0.2, emit=(1, 0.85, 0.55), emit_s=120))
    M["feu_FeuBabord"] = pmat("FB", (1, 0, 0), emit=(1, 0.05, 0.05), emit_s=60)
    M["feu_FeuTribord"] = pmat("FT", (0, 1, 0), emit=(0.1, 1, 0.25), emit_s=60)
    M["feu_tete"] = pmat("FH", (1, 1, 1), emit=(1, 1, 1), emit_s=60)
    M["feu_babord"] = M.pop("feu_FeuBabord"); M["feu_tribord"] = M.pop("feu_FeuTribord"); M.pop("feu_FeuTete", None)
    M.update(liston=pmat("Liston", (0.02, 0.02, 0.025), 0.4), inox=pmat("Inox", (0.85, 0.86, 0.88), 0.15, 1.0),
             cable=pmat("Cable", (0.6, 0.6, 0.62), 0.3, 1.0), bois=pmat("Bois", (0.28, 0.15, 0.07), 0.5),
             moteur=pmat("Moteur", (0.03, 0.03, 0.035), 0.35), bouee=pmat("Bouee", (0.8, 0.2, 0.03), 0.5),
             nom=pmat("Nom", (0.9, 0.9, 0.9), 0.3), pont=pmat("PontBlanc", (0.75, 0.74, 0.7), 0.55))
    assign_common(M)
    far.data.materials.clear(); far.data.materials.append(M["eau"])
    LP = load_phare((-30, 70, -1.0), 1.5, math.radians(200))
    # load_elba_sf(night=True)
    # faisceau du phare : cône de volume
    beam = prim(bpy.ops.mesh.primitive_cone_add, "Faisceau", C_ISL, vertices=48, radius1=9, radius2=0.5, depth=90,
                location=(LP.x + 40, LP.y - 25, LP.z))
    beam.rotation_euler = (LP - beam.location).to_track_quat("Z", "Y").to_euler()
    bm_ = bpy.data.materials.new("Faisceau"); bm_.use_nodes = True
    nt = bm_.node_tree
    for n in list(nt.nodes):
        if n.type != "OUTPUT_MATERIAL":
            nt.nodes.remove(n)
    pv = nt.nodes.new("ShaderNodeVolumePrincipled")
    pv.inputs["Color"].default_value = (1, 0.92, 0.75, 1); pv.inputs["Density"].default_value = 0.00025
    pv.inputs["Emission Color"].default_value = (1, 0.85, 0.6, 1); pv.inputs["Emission Strength"].default_value = 0.006
    nt.links.new(pv.outputs[0], next(n for n in nt.nodes if n.type == "OUTPUT_MATERIAL").inputs["Volume"])
    setm(beam, bm_)
    pl = bpy.data.lights.new("LumPhare", "POINT"); pl.energy = 1500; pl.color = (1, 0.82, 0.55); pl.shadow_soft_size = 0.5
    plo = bpy.data.objects.new("LumPhare", pl); sc.collection.objects.link(plo); plo.location = LP
    bl = bpy.data.lights.new("LumBateau", "POINT"); bl.energy = 60; bl.color = (1, 0.65, 0.35)
    blo = bpy.data.objects.new("LumBateau", bl); sc.collection.objects.link(blo); blo.parent = rig; blo.location = (-0.4, 0, 2.0)
    try:
        sc.view_settings.look = "AgX - Medium High Contrast"
    except TypeError:
        pass
    aim((7.5, -10.5, 2.4), (-5, 10, 5.2), 26)

elif STYLE == "studio":
    cycles(48)
    world_gradient((0.75, 0.77, 0.8), (0.9, 0.92, 0.95), 1.0)
    for o in list(C_ISL.objects) + list(C_SEA.objects):
        o.hide_render = True
    sun = bpy.data.lights.new("Soleil", "SUN"); sun.energy = 3.0; sun.angle = math.radians(5)
    so = bpy.data.objects.new("Soleil", sun); sc.collection.objects.link(so); so.rotation_euler = (math.radians(50), 0, math.radians(30))
    M = dict(eau=pmat("x", (0, 0, 0)), coque=None, pont=pmat("PontBlanc", (0.82, 0.81, 0.77), 0.55), liston=pmat("Liston", (0.02, 0.02, 0.025), 0.4),
             rouf=pmat("Rouf", (0.85, 0.85, 0.83), 0.3), hublot=pmat("Hublot", (0.02, 0.03, 0.04), 0.05), alu=pmat("Alu", (0.8, 0.8, 0.82), 0.25, 1.0),
             voile=pmat("Voile", (0.92, 0.9, 0.84), 0.75), roche=pmat("r", (0.5, 0.5, 0.5)), blanc=pmat("Blanc", (0.85, 0.85, 0.83), 0.5),
             rouge=pmat("Rouge", (0.6, 0.05, 0.04), 0.5), toit=pmat("t", (0.1, 0.1, 0.1)), lanterne=pmat("L", (1, 1, 1)),
             inox=pmat("Inox", (0.85, 0.86, 0.88), 0.15, 1.0), cable=pmat("Cable", (0.2, 0.2, 0.22), 0.3, 1.0), bois=pmat("Bois", (0.32, 0.17, 0.08), 0.5),
             moteur=pmat("Moteur", (0.03, 0.03, 0.035), 0.35), bouee=pmat("Bouee", (0.95, 0.25, 0.04), 0.5), nom=pmat("Nom", (0.95, 0.95, 0.95), 0.3))
    M.pop("coque")
    assign_common(M)
    rig.rotation_euler = (0, 0, 0)
    if "export" in argv:
        for c in (C_ISL, C_SEA):
            for o in list(c.objects): bpy.data.objects.remove(o, do_unlink=True)
            bpy.data.collections.remove(c)
        bpy.ops.outliner.orphans_purge(do_recursive=True)
        aim((12, -10, 5.6), (0, 0, 4.4), 40)
        dst = os.path.join(ROOT, "blender", "elba.blend")
        bpy.ops.wm.save_as_mainfile(filepath=dst)
        print("SAVED", dst)
        raise SystemExit(0)
    sc.render.resolution_x, sc.render.resolution_y = 900, 700
    views = {"profil": ((0.2, -17.5, 4.8), (0.2, 0, 4.6), 40), "avant34": ((12, -10, 5.6), (0, 0, 4.4), 40),
             "arriere34": ((-12, -8.5, 5.0), (-0.5, 0, 4.3), 40), "dessus": ((0.1, -0.1, 22), (0.1, 0, 0.5), 35),
             "rouf": ((4.6, -5.2, 3.4), (-0.4, 0, 0.8), 35),
             "cote": ((1.2, -4.6, 1.25), (-0.2, 0, 0.85), 32), "cockpit": ((-4.6, -2.6, 2.7), (-1.6, 0, 0.55), 32),
             "tableau": ((-6.0, -1.6, 0.8), (-3.0, 0, 0.25), 35)}
    only = [a for a in argv if a.startswith("vue=")]
    if only:
        keep = only[0][4:].split(",")
        views = {k: v for k, v in views.items() if k in keep}
    for nm, (loc, tgt, lens) in views.items():
        aim(loc, tgt, lens)
        sc.render.filepath = os.path.join(OUT, f"studio_{nm}.png")
        bpy.ops.render.render(write_still=True)
        print("RENDERED", sc.render.filepath)
    raise SystemExit(0)

else:
    raise SystemExit("style inconnu: " + STYLE)

tag = STYLE + ("_preview" if PREVIEW else "")
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, "blender", f"scene_{tag}.blend"))
sc.render.filepath = os.path.join(OUT, f"{tag}.png")
bpy.ops.render.render(write_still=True)
print("RENDERED", sc.render.filepath)
