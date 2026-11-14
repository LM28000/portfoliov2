# Les modèles 3D

Les modèles du site sont construits par des scripts Python pour Blender (`outils/3d/scripts`), qui s'exécutent sans interface. Les fichiers lourds ne sont pas dans le dépôt : les modèles téléchargés, les `.blend` (plusieurs Go) et les rendus de contrôle.

## Le dossier de travail

Les scripts calculent leurs chemins à partir de leur emplacement :
- **le dossier de travail** est le parent de `scripts/`, par défaut `outils/3d/` ;
- **les fichiers produits pour le site** vont dans `assets/` à la racine du dépôt.

```
outils/3d/
  scripts/      versionné : les scripts ci-dessous
  assets/       à remplir : modèles et textures tiers (voir plus bas), textures générées (*/gen/)
  blender/      produit : elba.blend, insula_v3.blend, cabine.blend
  renders/      produit : rendus de contrôle
  web/          produit : imposteurs d'arbres, points du studio, liste des arbres
  video/        captures d'Insula utilisées comme textures (p2.png, p3.png)
```

`assets/`, `blender/`, `renders/`, `web/` et `video/` sont ignorés par git. On peut aussi garder ces dossiers ailleurs et y créer un lien `scripts → outils/3d/scripts` : les scripts suivent le lien.

Il faut Blender 5 (testé en 5.3) et Python 3 avec Pillow pour les textures. Les textures écrites utilisent des polices de macOS (Helvetica Neue, Bradley Hand). Sur un autre système, changez les chemins en tête de `studio_textures.py` et de `scenes_textures.py`.

```bash
B=/Applications/Blender.app/Contents/MacOS/Blender      # macOS
cd outils/3d
```

## Elba

```bash
$B -b --factory-startup -P scripts/scene.py -- studio export     # construit Elba (elba.py) -> blender/elba.blend
$B -b blender/elba.blend -P scripts/export_elba.py               # -> assets/elba.glb
```

`elba.py` modélise le bateau d'après mes photos : un Flirt 6 m de 1977, coque bleue, safran en bois, hors-bord. La proue est vers +X. `scene.py -- studio` produit aussi des vues de contrôle (`renders/studio_*.png`).

## Les arbres (imposteurs)

```bash
$B -b --factory-startup -P scripts/imposteurs.py                 # -> web/arbre_*.png (vue de côté, fond transparent)
for f in web/arbre_*.png; do cwebp -q 80 "$f" -o ../../assets/$(basename "${f%.png}").webp; done
```

Sur le site, chaque arbre est fait de deux plans croisés qui portent ces images.

## L'île d'Insula et le studio

```bash
INSULA_DIR=~/immobilier-tool python3 scripts/scenes_textures.py  # écrans, fiche, porte-clés (captures d'Insula) -> assets/scenes/
python3 scripts/quai_textures.py                                 # dalles et moellons du quai -> assets/quai_vie/gen/
python3 scripts/studio_textures.py                               # panneau À VENDRE, plaque, carnet, annonces -> assets/studio/gen/
$B -b --factory-startup -P scripts/ile_insula_v3.py -- preview   # île + immeuble + studio -> blender/insula_v3.blend, renders/v3_*.png
$B -b blender/insula_v3.blend -P scripts/export_ile_v3.py        # -> assets/ile_insula.glb, assets/studio.glb, web/ile_arbres_v3.json
```

- **Les vues de contrôle :** `ile_insula_v3.py` les rend (`-- vues=approche,quai,panneau,entree,table,baie`). `-- vues=aucune` enregistre seulement le `.blend`, et `preview` rend en basse qualité.
- **L'immeuble** est construit par `immeuble.py`, dans son propre repère (voir [Architecture](architecture.md#repères)) :
  - les murs sont un seul volume, et le studio, la porte-fenêtre et les embrasures y sont creusés par booléens ;
  - les objets du studio portent la propriété `studio`, ce qui permet à l'export de les mettre dans `studio.glb`.
- **La vie du quai** est construite par `quai_vie.py`, dans le repère de l'immeuble : terrasse de café, banc, vélos, hortensias, trois lampadaires, coin de pêche, bouée de sauvetage, et la bouée de chenal du bassin. Le site anime ensuite les mouettes, la fumée de la cheminée et la bouée de chenal, et allume les lampadaires la nuit (`js/quai.js`). Il retrouve ces objets par leur nom : `VieLanterne` (matériau des verres), `Vie_LampPerche_1` et `_2` (perchoirs des mouettes), `Vie_BoueeMer`.
- **L'éclairage figé** (facultatif, désactivé sur l'île) : `cuire_ile.py` calcule la lumière dans Blender et écrit `blender/insula_v3_cuit.blend` et deux textures de lumière ; exporter ensuite depuis ce fichier. Voir `js/lumiere.js`.
- **Après un export**, reportez dans le code :
  - la liste `web/ile_arbres_v3.json` dans `PR_TREES` (`js/scene.js`) ;
  - si l'immeuble a bougé, `web/studio_points.json` dans `PR_BLD` et `PR_STU_L` (`js/studio.js`).

### Modèles et textures à placer dans `assets/`

| Fichier | Source | Licence |
|---|---|---|
| `quai.blend` | « river jetty and boatyard », floor2727 (Sketchfab) | CC-BY 4.0 |
| `arbre_cotier.blend`, `pins.blend` | island_tree_01, pine_tree_01, Poly Haven | CC0 |
| `umhlanga_sunrise_2k.hdr` | Poly Haven (ciel des rendus de contrôle) | CC0 |
| `studio/<id>/<id>.gltf` | Poly Haven, glTF 1k : Sofa_01, painted_wooden_chair_01, side_table_01, desk_lamp_arm_01, modern_ceiling_lamp_01, anthurium_botany_01, vintage_electric_kettle, ceramic_vase_01, throw_pillows_01, hanging_picture_frame_01 | CC0 |
| `quai_vie/<id>/<id>_1k.gltf` | Poly Haven, glTF 1k : outdoor_table_chair_set_01, painted_wooden_bench, planter_box_01, wooden_crate_01, wooden_crate_02, barrel_03, wicker_basket_01, wooden_bucket_01, lifebuoy, ocean_buoy | CC0 |
| `cabine/tex/` | oak_wood_planks, plank_flooring_04, rough_linen, wood_plank_wall, Poly Haven (1k) | CC0 |

Les modèles Poly Haven se téléchargent par leur API, par exemple `https://api.polyhaven.com/files/Sofa_01` (format `gltf`, résolution `1k`).

## La cabine

```bash
python3 scripts/cabine_textures.py                               # carte du parcours, livre de bord, VHF, photo… -> assets/cabine/gen/
$B -b --factory-startup -P scripts/cabine.py                     # -> blender/cabine.blend, renders/cabine/
$B -b blender/cabine.blend -P scripts/export_cabine.py           # -> assets/cabine.glb
```

Les objets de la cabine (coffre, compas, lanternes, livres, seau, appareil photo, cadre) sont des modèles Poly Haven (CC0), enregistrés en `.blend` dans `assets/cabine/`.

## Ce que le code attend des modèles

Le site retrouve les objets par leur nom. Si vous renommez un objet dans un script, mettez le code à jour.

| Modèle | Noms utilisés | Par |
|---|---|---|
| `ile_insula.glb` | `Ile…` (terrain recoloré par hauteur), `Quai` (ponton : axe et accostage) | `scene.js` |
| | `PanneauAVendre`, `Balcon…`, `Barreau`, `Porte`, `Plaque`, `PFVerre`… (clics sur le panneau et la porte) | `studio.js` |
| | matière `VerreClair` (rendue translucide) | `studio.js` |
| `studio.glb` | `PC_ecran` : ses UV donnent les coins où poser l'app | `studio.js` |
| | `Annonce0`…`2`, `Carnet…`, `Frigo`, `Fiche`, `Aimant`, `Cle`, `PorteCles`, `Torus` (clics) | `studio.js` |
| `cabine.glb` | `BouteilleGrp0`…`4`, `CarteParcours`, `treasure_chest…`, `PagesLivre`, `Grp_cadre`, `VHF`… | `cabin3d.js` |
| `elba.glb` | matières `feu_…` (feux de navigation), `Hublot…` (allumés la nuit) | `scene.js`, `cabin.js` |

Côté web, les matières sont simplifiées à l'export : pas de relief, pas de métal (le site n'a pas de carte d'environnement), et des textures de 512 ou 1024 px. Les textures qu'on doit lire de près gardent 1024 px.
