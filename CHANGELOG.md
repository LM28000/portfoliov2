# Journal des changements

## 15 novembre 2026 : la base flottante et le manège

- **La plongée se voit d'en dessous** : à la fin de la mue, la caméra descend sous le bassin et regarde le sous-marin en sortir entre les deux coques, puis le suit jusqu'au manège. La caméra reste libre : elle reçoit des consignes, mais ne t'est jamais imposée.
- **La remontée, en miroir** : on suit le sous-marin qui quitte le manège, on le regarde remonter dans le bassin par en dessous, puis la caméra ressort de l'eau à l'entrée du bassin et prend de la hauteur pendant qu'Elba reprend sa forme.
- **Les caissons se lisent de près** : quand un caisson s'ouvre, la caméra entre dedans. Chaque tiroir porte une étiquette nette (le service et son rôle), et un clic fait coulisser le tiroir et dit ce qui est configuré. La fiche sur le côté disparaît.
- **L'îlot du serveur devient une base flottante**, une station océanographique en U : deux coques orange, des conteneurs, un portique roulant, une passerelle et une hélisurface. Elba entre dans le bassin central par le sud et s'y transforme en sous-marin, sous le portique.
- **La plongée part du bassin** : le sous-marin descend par le fond du bassin, passe sous la coque et rejoint le fond. La remontée revient au bassin par en dessous, nez vers la sortie.
- **Au fond, un manège de caissons** : cinq caissons tournent autour du nœud central (PILOTAGE, Portainer). On le fait tourner avec les flèches, les boutons ou en cliquant sur un caisson. Celui qui arrive devant s'ouvre en rideau et montre ses services, un tiroir gravé par service. Des impulsions de lumière courent sur la couronne vers les caissons qu'il dessert : la connexion unique, les sauvegardes, la supervision.
- **La liste des services** suit ce qui tourne vraiment : Headscale, Authentik, Vaultwarden, Nextcloud, Matrix, Ollama, Grafana, Uptime Kuma, Scrutiny, Dozzle, Kopia et Portainer. La version texte est à jour.

## 14 novembre 2026 : la plongée au serveur

- **L'île du serveur change.** Le bâtiment en béton laisse place à un îlot nu et à une bouée jaune à voyant en X, la marque qui signale un câble ou une installation sous l'eau. Elba s'arrête à côté.
- **« Plonger avec Elba » :** la coque d'Elba se déforme, sans coupure, en un vrai sous-marin. Les voiles, les câbles et le mât rentrent, puis le pont s'aplanit, la quille et le moteur rentrent. La coque s'étire et vire au noir. Enfin, le kiosque, les ailerons et l'hélice sortent. La caméra reste libre pendant la transformation.
- **Sous l'eau :** brouillard bleu-vert, surface vue d'en dessous, reflets du soleil sur le sable, rayons de lumière, poissons et bulles. À vingt mètres, sept caissons, un par famille de services, sont reliés à un nœud central. Un clic sur un caisson ouvre sa fiche. « Faire surface » rejoue tout à l'envers.
- **La plongée est fluide de bout en bout :** l'hélice tourne en continu, l'assiette suit la pente en douceur, et la remontée a sa propre route (le sous-marin ne recule plus).
- **Deux modèles chargés seulement à l'approche de l'île** : `elba_sousmarin.glb` (2 Mo) et `fond.glb` (1 Mo). Le parcours de test couvre la plongée.

## 14 novembre 2026 : nouveau moteur, ombres en temps réel

- **Une passe de finition** en qualité « haute » : léger halo sur le soleil, la lune et les lanternes, recoins assombris à l'extérieur. La mer et le ciel écrivent maintenant des valeurs de lumière, converties comme le reste de la scène. Coupée dans le studio.
- **Le lissage des bords** de la finition passe en SMAA : avec le halo, le lissage d'origine (MSAA) faisait clignoter l'écran en noir dans Chrome.
- **Les ombres** suivent le point regardé et couvrent toute l'île quand on recule : elles ne disparaissent plus en se déplaçant.

- **three.js r187** à la place de r128 : un seul script dans `vendor/`, construit par `outils/moteur`. Le site reste sans étape de construction.
- **Les ombres du soleil en temps réel** : arbres, immeuble, Elba et objets du quai projettent leurs ombres sur le terrain et le pavage.
- **Une lumière d'environnement** tirée du ciel du site, qui suit la tombée de la nuit.
- **Deux niveaux de qualité** : « haute » sur ordinateur, « simple » sur téléphone (l'ancien rendu, plus léger).
- **Le carnet des amis** a des prénoms (inventés), les lampadaires éclairent le quai la nuit, les mouettes sont plus visibles, la cabine est allégée (5,7 Mo).

## 13 novembre 2026 : un quai habité

- **Le quai d'Insula prend vie.** Des dalles de granit à la place de la dalle grise, et un mur de quai en moellons. Une terrasse de café avec deux tasses, un banc, deux vélos, des hortensias de part et d'autre de la porte, trois lampadaires en fonte, et un coin de pêche avec casiers, caisses, tonneau et cordage.
- **Ce qui bouge :** des mouettes posées sur les lampadaires et d'autres qui tournent au-dessus du port, la fumée de la cheminée, la bouée de chenal qui tangue. Les lampadaires s'allument à la tombée de la nuit.

## 13 novembre 2026 : Insula, le studio à vendre

- **L'île d'Insula refaite.** Les bâtiments décoratifs, le cinéma et la longue-vue disparaissent. Il ne reste qu'un immeuble au pied du ponton, avec un panneau « À vendre » au balcon. Le ponton est abaissé à mi-hauteur de la coque d'Elba, avec une passerelle depuis le quai.
- **Le studio témoin du 1er étage.** On y entre par la porte-fenêtre, sans fondu. On s'approche de l'ordinateur, des annonces imprimées, du carnet des amis, de la fiche sur le frigo et des clés. La baie donne vraiment sur Elba.
- **La vraie app d'Insula** s'utilise directement sur l'écran du portable, en perspective.
- **On peut bouger après avoir choisi un objet,** dans le studio comme dans la cabine : on tourne autour, on s'approche.
- **Les gestes de la carte d'Insula :** glisser pour déplacer, Ctrl ou clic droit pour tourner, deux doigts pour zoomer. L'ancien mode reste disponible.
- **Les étiquettes des îles** ne bloquent plus une rotation ni la molette.
- **Pour la publication :** fichiers versionnés contre le cache, voix de la VHF régénérées, crédits à jour.
- **Le dépôt :** documentation (`docs/`), outils de fabrication (`outils/`), vérifications automatiques et parcours de test.

## 12 novembre 2026 : l'archipel, la cabine et le son

- **L'archipel.** On arrive en vue aérienne sur trois îles-projets : Insula, la Carte vivante et le serveur. Un clic survole une île, et « Tout voir en 1 minute » ouvre la version texte.
- **Les traversées.** Le pilote auto mène d'île en île, avec une traversée express à vue (sans fondu au noir) et un bouton « Arriver plus vite ». Dézoomer à fond ramène à l'archipel.
- **La cabine d'Elba**, modélisée dans Blender :
  - la carte du parcours ;
  - le coffre et le CV en PDF ;
  - le livre de bord du visiteur ;
  - les bouteilles à message ;
  - la photo qui se retourne ;
  - la VHF pour écrire.
  On y descend par l'ouverture du rouf, sans fondu.
- **Le son.** La voix de la VHF est une synthèse Piper passée par un filtre radio. L'ambiance marine est générée dans le navigateur, et la musique est du domaine public (Mendelssohn, Satie).
- **L'audit d'usage :**
  - une version texte sans 3D, aussi pour les lecteurs d'écran ;
  - l'identité au premier écran ;
  - le respect du mouvement réduit ;
  - une carte du voyage progressive, avec un compteur ;
  - la progression gardée d'une visite à l'autre.
- **Une navigation cohérente.** Sur une île, on est toujours à bord d'Elba. Le pilote auto mène vers la bonne destination, et l'accostage est proposé pour l'île visée.

## 11 novembre 2026 : le premier site

- **La traversée, du ponton à l'île d'Insula,** avec Elba modélisé d'après mes photos. On barre soi-même ou au pilote auto, et on arrive le long du quai.
- **La démo d'Insula :** curseur visible, fiche qui défile.
- **La fin du parcours :** tombée de la nuit, cabine, VHF.
- **La carte du voyage,** dépliée depuis la carte marine, pour sauter à n'importe quelle étape.
