"""Assemble une suite d'images (f00000.png…) en vidéo MP4 H.264, avec le montage vidéo de Blender (pas besoin de ffmpeg).
Usage : Blender -b --factory-startup -P 3d/scripts/monter_film.py -- <dossier des images> <sortie.mp4> [fps] [qualité : HIGH|MEDIUM|LOW|VERYLOW] [échelle en %]"""
import bpy, os, sys
a = sys.argv[sys.argv.index("--") + 1:]; src, out = a[0], a[1]; fps = int(a[2]) if len(a) > 2 else 30; q = a[3] if len(a) > 3 else "HIGH"; pct = int(a[4]) if len(a) > 4 else 100
files = sorted(f for f in os.listdir(src) if f.startswith("f") and f.endswith((".png", ".jpg")))
sc = bpy.context.scene; sc.render.fps = fps; ed = sc.sequence_editor_create()
st = (ed.strips if hasattr(ed, "strips") else ed.sequences).new_image("film", os.path.join(src, files[0]), 1, 1)
for f in files[1:]: st.elements.append(f)
sc.frame_start, sc.frame_end = 1, len(files)
w, h = 1920, 1080
try:
    import struct
    if files[0].endswith(".png"):
        with open(os.path.join(src, files[0]), "rb") as fh: fh.read(16); w, h = struct.unpack(">II", fh.read(8))
    else:
        im = bpy.data.images.load(os.path.join(src, files[0])); w, h = im.size[0], im.size[1]; bpy.data.images.remove(im)
except Exception as e: print("taille", e)
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = round(w * pct / 200) * 2, round(h * pct / 200) * 2, 100   # dimensions paires (H.264)
# l'image entière est réduite (sinon Blender garde le centre) ; couleurs transmises telles quelles (pas de rendu « 3D » AgX ou Filmic)
st.transform.scale_x = sc.render.resolution_x / w; st.transform.scale_y = sc.render.resolution_y / h
sc.view_settings.view_transform = "Standard"; sc.view_settings.look = "None"; sc.view_settings.exposure = 0; sc.view_settings.gamma = 1
try: sc.sequencer_colorspace_settings.name = "sRGB"
except Exception as e: print("espace", e)
s = sc.render.image_settings
try: s.media_type = "VIDEO"
except Exception: pass
s.file_format = "FFMPEG"; sc.render.ffmpeg.format = "MPEG4"; sc.render.ffmpeg.codec = "H264"; sc.render.ffmpeg.constant_rate_factor = q
sc.render.ffmpeg.ffmpeg_preset = "BEST"; sc.render.ffmpeg.gopsize = fps
sc.render.filepath = out; sc.render.use_sequencer = True
bpy.ops.render.render(animation=True); print("FILM", out, os.path.getsize(out) // 1024, "Ko,", len(files), "images")
