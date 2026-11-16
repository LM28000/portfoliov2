"""L'île de Vigie : une plateforme de lancement en mer, sa tour et sa fusée « ARCHIPEL », pour le site (assets/vigie.glb).
Repère Blender : centre de la plateforme à l'origine, x vers l'est, y vers le nord, pont à z = 12, flottaison à 0.
Ce qui bouge sur le site est regroupé sous des nœuds vides :
  Fusee (pied de la fusée, sur le pas de tir) > Etage1 (premier étage, moteurs, interétage, ailerons)
                                             > Etage2 (deuxième étage) > Capsule (cône, hublots, bouclier) > Parachutes (repliés, à déployer)
  Bras (bras d'accès et salle blanche, pivote autour de la tour), Ascenseur (la cabine, qui monte le long de la tour)."""
import bpy, math


def build(H):
    cube, cyl, sph, tube, texte, M, emis, metal = H["cube"], H["cyl"], H["sph"], H["tube"], H["texte"], H["M"], H["emis"], H["metal"]
    sc = bpy.context.scene

    def grp(name, loc, parent=None):
        g = bpy.data.objects.new(name, None); sc.collection.objects.link(g); g.location = loc
        if parent: g.parent = parent
        return g

    def sous(o, g):
        o.parent = g; return o

    def cone(name, c, r1, r2, d, m, v=48, g=None):
        bpy.ops.mesh.primitive_cone_add(vertices=v, radius1=r1, radius2=r2, depth=d, location=c); o = bpy.context.active_object; o.name = name; o.data.materials.append(m)
        if g: o.parent = g
        return o

    blanc = M("FuseeBlanc", (0.88, 0.89, 0.9), 0.35); noir = M("FuseeNoir", (0.03, 0.03, 0.035), 0.45); gris = M("PlateformeGris", (0.5, 0.52, 0.54), 0.6)
    pont = M("PontPlateforme", (0.22, 0.23, 0.24), 0.85, bump=0.15, nscale=3); rouge = M("TourRouge", (0.55, 0.07, 0.04), 0.5); orange = M("FlotteurOrange", (0.42, 0.08, 0.01), 0.45)
    D = 12.0
    # --- la plateforme : deux flotteurs, six colonnes, le pont
    for s in (-1, 1):
        cube("Flotteur", (0, s * 12, -1.5), (52, 7, 6), orange)
        for x in (-26, 26): sph("NezFlotteur", (x, s * 12, -1.5), 3.5, orange, (1.2, 1, 0.86), seg=24)
        for x in (-18, 0, 18): cyl("Colonne", (x, s * 12, 7.0), 3.2, 10, gris, v=32)
        cube("Liseret", (0, s * 15.52, 1.0), (52, 0.04, 0.5), M("LiseretBlanc", (0.85, 0.85, 0.82), 0.6))
    cube("Pont", (0, 0, D), (48, 32, 2.4), gris); cube("PontDessus", (0, 0, D + 1.25), (48, 32, 0.1), pont)
    # garde-corps tout autour du pont
    gc = M("GardeCorps", (0.8, 0.8, 0.76), 0.5)
    for (a, b) in (((-24, -16), (24, -16)), ((24, -16), (24, 16)), ((24, 16), (-24, 16)), ((-24, 16), (-24, -16))):
        for z in (D + 1.85, D + 2.35): tube("Lisse", (a[0], a[1], z), (b[0], b[1], z), 0.04, gc, v=6)
        n = int(math.hypot(b[0] - a[0], b[1] - a[1]) / 2)
        for k in range(n + 1):
            x = a[0] + (b[0] - a[0]) * k / n; y = a[1] + (b[1] - a[1]) * k / n; cyl("Montant", (x, y, D + 1.85), 0.03, 1.1, gc, v=6)
    # ponton d'accostage au ras de l'eau (pour Elba), escalier vers le pont
    bois = M("PontonBois", (0.35, 0.25, 0.16), 0.8)
    cube("Ponton", (-10, -17.5, 0.5), (18, 3, 0.4), bois)
    for x in (-18, -10, -2):
        for y in (-16.3, -18.7): cyl("Pieu", (x, y, -0.6), 0.16, 2.6, bois, v=8)
    for k in range(10): cube("Marche", (-0.4 + k * 0.62, -16.4, 1.15 + k * 1.15), (0.62, 1.4, 0.15), metal)
    tube("RampeEscalier", (-0.7, -17.1, 2.2), (5.5, -17.1, 13.7), 0.04, gc, v=6)
    # hangar marqué VIGIE, conteneurs
    cube("Hangar", (-14, 4, D + 4.5), (16, 18, 8), M("HangarBlanc", (0.82, 0.83, 0.82), 0.6))
    cube("PorteHangar", (-5.95, 4, D + 4.0), (0.1, 12, 7), M("PorteGris", (0.3, 0.32, 0.34), 0.5))
    texte("Marquage", "VIGIE", (-14, -5.03, D + 6.0), 2.2, M("MarquageBleu", (0.05, 0.2, 0.45), 0.6), (math.pi / 2, 0, 0))
    for k, c in enumerate([(0.06, 0.2, 0.42), (0.8, 0.8, 0.78), (0.5, 0.08, 0.05)]): cube("Conteneur", (-18, -10 + k * 2.6, D + 2.6), (6.06, 2.44, 2.59), M("Cont%d" % k, c, 0.6))
    # le pas de tir et la fosse à flammes, au bord est
    cube("PasDeTir", (14, 0, D + 1.6), (10, 10, 0.8), M("Beton", (0.55, 0.55, 0.52), 0.9))
    cube("Fosse", (19.6, 0, D - 0.4), (1.4, 6, 3.4), noir)
    for (dx, dy) in ((-3, -3), (3, -3), (-3, 3), (3, 3)): cube("Bride", (14 + dx, dy, D + 2.4), (0.6, 0.6, 0.8), metal)
    # la tour en treillis, au sud de la fusée
    tx, ty, HT = 14, -9.0, 54
    for (dx, dy) in ((-2, -2), (2, -2), (-2, 2), (2, 2)): cyl("PiedTour", (tx + dx, ty + dy, D + 1.3 + HT / 2), 0.25, HT, rouge, v=8)
    for k in range(int(HT / 3)):
        z = D + 1.3 + k * 3
        for (a, b) in (((-2, -2), (2, -2)), ((2, -2), (2, 2)), ((2, 2), (-2, 2)), ((-2, 2), (-2, -2))):
            tube("Traverse", (tx + a[0], ty + a[1], z), (tx + b[0], ty + b[1], z), 0.09, rouge, v=6)
            tube("Diagonale", (tx + a[0], ty + a[1], z), (tx + b[0], ty + b[1], z + 3), 0.07, rouge, v=6)
    cube("ToitTour", (tx, ty, D + 1.3 + HT + 0.2), (4.6, 4.6, 0.4), rouge)
    sph("Projo", (tx + 2.2, ty - 2.2, D + HT + 2.0), 0.4, emis("FeuTour", (1, 0.3, 0.2), 8), seg=12)
    ZA = D + 47.0                                  # niveau de l'accès à la capsule
    asc = cube("Ascenseur", (tx, ty, D + 2.6), (2.2, 2.2, 2.6), M("Cabine", (0.85, 0.85, 0.8), 0.5))
    bras = grp("Bras", (tx, ty + 2.0, ZA))         # pivot sur la face nord de la tour
    sous(cube("BrasAcces", (0, 2.4, 0), (1.6, 5.2, 1.0), M("Bras", (0.75, 0.75, 0.72), 0.5)), bras)
    sous(cube("SalleBlanche", (0, 4.4, 0.2), (2.6, 1.4, 2.4), M("SalleBlanche", (0.9, 0.9, 0.88), 0.5)), bras)
    # --- la fusée : premier étage, interétage noir, deuxième étage, capsule
    fus = grp("Fusee", (14, 0, D + 2.6))
    e1 = grp("Etage1", (0, 0, 0), fus)
    cyl("Etage1Corps", (0, 0, 16), 1.85, 32, blanc, v=48, g=e1)
    for k in range(9):
        a = k * math.tau / 9; cyl("Moteur", (math.cos(a) * 1.1 * (k > 0), math.sin(a) * 1.1 * (k > 0), -0.6), 0.32, 1.4, metal, v=16, g=e1)
    cyl("Interetage", (0, 0, 33), 1.86, 2, noir, v=48, g=e1)
    for k in range(4):
        a = k * math.tau / 4 + 0.4; o = cube("Aileron", (math.cos(a) * 1.9, math.sin(a) * 1.9, 29.5), (0.12, 0.9, 1.6), noir, g=e1); o.rotation_euler.z = a
    texte("NomFusee", "ARCHIPEL", (0, -1.87, 18), 1.1, noir, (math.pi / 2, math.pi / 2, 0), g=e1)
    e2 = grp("Etage2", (0, 0, 34), fus)
    cyl("Etage2Corps", (0, 0, 5), 1.85, 10, blanc, v=48, g=e2)
    cone("MoteurEtage2", (0, 0, -0.9), 0.75, 0.3, 1.8, metal, v=24, g=e2)
    cap = grp("Capsule", (0, 0, 10), e2)
    cone("CapsuleCone", (0, 0, 1.8), 1.85, 0.5, 3.6, blanc, g=cap)
    cone("CapsulePointe", (0, 0, 4.4), 0.5, 0.08, 1.6, noir, v=24, g=cap)
    cyl("Bouclier", (0, 0, 0.08), 1.9, 0.16, M("Bouclier", (0.12, 0.08, 0.06), 0.8), v=48, g=cap)
    for k in range(3): cyl("Hublot", (math.cos(k * 2.1 - math.pi / 2) * 1.45, math.sin(k * 2.1 - math.pi / 2) * 1.45, 1.3), 0.22, 0.08, emis("HublotCapsule", (1, 0.8, 0.5), 3), (math.pi / 2, 0, k * 2.1), v=16, g=cap)
    para = grp("Parachutes", (0, 0, 3.2), cap)
    toile = [M("Toile1", (0.8, 0.12, 0.06), 0.8), M("Toile2", (0.92, 0.92, 0.9), 0.8)]; corde = M("Corde", (0.8, 0.8, 0.75), 0.8)
    import bmesh
    for k in range(3):
        a = k * math.tau / 3 + 0.5; px, py, pz = math.cos(a) * 6.5, math.sin(a) * 6.5, 20
        bpy.ops.mesh.primitive_uv_sphere_add(radius=7, segments=24, ring_count=12, location=(px, py, pz)); p = bpy.context.active_object; p.name = "Voile"
        bm = bmesh.new(); bm.from_mesh(p.data); bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < 1.2], context="VERTS")
        for f_ in bm.faces: f_.material_index = int((math.atan2(f_.calc_center_median().y, f_.calc_center_median().x) + math.pi) / math.tau * 12) % 2
        bm.to_mesh(p.data); bm.free(); p.data.materials.append(toile[0]); p.data.materials.append(toile[1]); p.scale = (1, 1, 0.8); p.rotation_euler = (-math.sin(a) * 0.28, math.cos(a) * 0.28, 0); p.parent = para
        for q in range(8):
            b = q * math.tau / 8; tube("Suspente", (0, 0, 0), (px + math.cos(b) * 6.2, py + math.sin(b) * 6.2, pz + 1.0), 0.03, corde, v=4, g=para)
    # le reste : la plateforme
    pl = grp("Plateforme", (0, 0, 0))
    for o in list(sc.objects):
        if o.parent is None and o not in (pl, fus, bras, asc): o.parent = pl
    asc.parent = None
    return dict(D=D, ZA=ZA)
