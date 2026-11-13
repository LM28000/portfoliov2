# Publication

Le site est hébergé par Cloudflare. **Chaque envoi sur `main` le remet en ligne** en une trentaine de secondes, à l'adresse https://louis-marie.du-cray.eu. Le dépôt est servi tel quel : il n'y a pas d'étape de build. `docs/` et `outils/` sont dans le dépôt, mais la page ne les charge pas.

## Avant d'envoyer

1. **Augmentez la version** `?v=N` de tous les `<script>` et du `<link>` de `index.html` si `js/` ou `style.css` ont changé. Sans cela, un visiteur peut garder l'ancienne version en cache.
2. **Si un texte de la radio a changé,** régénérez sa voix (voir [Le son](son.md)).
3. **Lancez les vérifications :**
   ```bash
   cd outils && npm install          # une fois
   npm run verifier                  # rapide, sans navigateur
   python3 -m http.server 8000 --directory .. &   # le site en local
   npm run parcours                  # parcours complet dans Chrome (~3 min)
   ```

## Après l'envoi

- **GitHub** relance `outils/verifier.cjs` (workflow « Vérifications ») à chaque envoi et à chaque pull request.
- **Le parcours de test** peut viser le site en ligne :
  ```bash
  npm run parcours -- https://louis-marie.du-cray.eu/
  ```
- **Les captures** du parcours sont dans `outils/tests/captures/` : archipel, quai, panneau, studio, objets, ordinateur, clés, cabine.

## Ce que vérifie `verifier.cjs`

- **Le code :** la syntaxe de chaque fichier de `js/`.
- **La page :**
  - les scripts et styles de `index.html` existent ;
  - ils ont tous la même version ;
  - chaque fichier `js/` est bien chargé.
- **Les fichiers et la voix :**
  - chaque fichier de `assets/` cité par le code existe ;
  - chaque phrase de la VHF a son clip, et aucun clip n'est orphelin.
- **Le poids :**
  - aucun fichier ne dépasse 15 Mo, avec un avertissement au-delà de 6 Mo ;
  - le premier affichage (Elba et l'île) reste sous 8 Mo.
- **La confidentialité :** aucun fichier suivi ne contient de chemin absolu propre à une machine (dossier utilisateur macOS) ni de numéro de téléphone.
