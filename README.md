# Mettre le site en ligne avec sauvegarde permanente

## Ce que tu vas obtenir
Un vrai site en ligne où les comptes restaurateurs et leurs données (menu, photos, réservations) sont sauvegardés pour toujours — même si tout le monde ferme son navigateur.

---

## Étape 1 — Créer la base de données (Supabase, gratuit)

1. Va sur [supabase.com](https://supabase.com) → **"Start your project"** → connecte-toi avec GitHub
2. Clique sur **"New project"**, donne-lui un nom (ex : `restaurant-saas`), choisis un mot de passe pour la base (garde-le de côté), et une région proche de toi (`Europe West` par exemple)
3. Attends 1-2 minutes que le projet se crée

## Étape 2 — Créer la table des sites

1. Dans le menu de gauche, clique sur **"SQL Editor"**
2. Clique sur **"New query"**
3. Ouvre le fichier `supabase-setup.sql` fourni avec ce projet, copie tout son contenu, colle-le dans l'éditeur
4. Clique sur **"Run"** (ou Ctrl+Entrée) — ça crée la table et les règles de sécurité (chaque restaurateur ne voit que son propre site)

## Étape 3 — Récupérer tes clés

1. Dans le menu de gauche, va dans **"Project Settings"** (icône engrenage) → **"API"**
2. Copie la valeur **"Project URL"**
3. Copie la valeur **"anon public"** (la clé publique)
4. Ouvre le fichier `src/supabaseClient.js` dans le projet, et remplace :
   - `COLLE_TON_PROJECT_URL_ICI` par ton Project URL
   - `COLLE_TA_CLE_ANON_ICI` par ta clé anon public

## Étape 4 — Désactiver la confirmation par email (recommandé pour tes tests)

Par défaut, Supabase demande à chaque nouvel utilisateur de confirmer son email avant de pouvoir se connecter — pratique pour un vrai lancement, gênant pour tes tests rapides.

1. Va dans **"Authentication"** → **"Providers"** → **"Email"**
2. Désactive **"Confirm email"**
3. Sauvegarde

(Tu pourras réactiver ça plus tard, une fois que tu voudras vraiment lancer le service auprès de vrais clients.)

## Étape 5 — Mettre en ligne sur GitHub + Vercel

1. Va sur [github.com](https://github.com), crée un nouveau repository (bouton **"New"**)
2. Sur la page du repository vide, clique sur **"uploading an existing file"**, glisse-dépose TOUS les fichiers du projet (garde la structure des dossiers, notamment `src`) — **y compris ton fichier `supabaseClient.js` déjà rempli avec tes clés**
3. Clique sur **"Commit changes"**
4. Va sur [vercel.com](https://vercel.com) → connecte-toi avec GitHub
5. **"Add New..."** → **"Project"** → importe ton repository
6. Clique sur **"Deploy"**
7. Attends 1-2 minutes, tu obtiens ton lien public

## Étape 6 — Tester

Ouvre ton lien Vercel, crée un compte restaurateur, remplis quelques infos, puis **ferme complètement le navigateur et rouvre le lien** — tes données doivent toujours être là. C'est le signe que tout fonctionne.

---

## En cas de souci
Reviens vers moi avec le message d'erreur exact (capture d'écran si possible) — je t'aiderai à le résoudre.

