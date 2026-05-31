# Guide de déploiement — BGE FC Prono 2026

## Structure du projet

bgefc-pronostics/
├── index.html          ← L'app principale
├── vercel.json         ← Configuration Vercel + cron job
├── package.json        ← Projet Node.js
└── api/
    └── sync-matches.js ← Fonction automatique (toutes les heures)

---

## Étape 1 : Récupérer la clé service Supabase

1. Va sur supabase.com → ton projet → Settings → API
2. Copie la clé "service_role" (pas la clé "anon")
   Elle ressemble à : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
3. Garde-la de côté, tu en auras besoin à l'étape 3.

---

## Étape 2 : Créer un compte GitHub et déposer le projet

1. Va sur github.com → crée un compte gratuit si tu n'en as pas
2. Clique sur "New repository"
3. Nom : bgefc-prono-2026
4. Clique "Create repository"
5. Clique sur "uploading an existing file"
6. Glisse-dépose TOUS les fichiers du dossier bgefc-pronostics
   (index.html, vercel.json, package.json, et le dossier api/)
7. Clique "Commit changes"

---

## Étape 3 : Déployer sur Vercel

1. Va sur vercel.com → "Sign up" avec ton compte GitHub
2. Clique "Add New Project"
3. Sélectionne ton repository "bgefc-prono-2026"
4. Clique "Deploy"

Avant de valider, ajoute les variables d'environnement :
→ Clique sur "Environment Variables"
→ Ajoute : SUPABASE_SERVICE_KEY = [colle ta clé service Supabase ici]
→ Clique "Add"

5. Clique "Deploy"
6. Vercel te donne une URL du type : bgefc-prono-2026.vercel.app

---

## Étape 4 : Vérifier le cron job

1. Dans Vercel → ton projet → onglet "Cron Jobs"
2. Tu dois voir "sync-matches" avec un planning "0 * * * *" (toutes les heures)
3. Tu peux cliquer "Run" pour forcer une synchronisation immédiate
4. Vérifie dans Supabase → Table "matches" que les données se sont mises à jour

---

## Fonctionnement automatique

Toutes les heures, Vercel appelle football-data.org avec ta clé API.
Les matchs, équipes et scores se mettent à jour dans Supabase.
Les points de tous les participants sont recalculés automatiquement.
Zéro intervention manuelle pendant toute la Coupe du monde.

---

## Partager le lien à tes collègues

Une fois déployé, envoie ce lien par mail :
https://bgefc-prono-2026.vercel.app

Chaque collègue crée son compte, choisit son équipe BGE FC, et c'est parti !

---

## En cas de problème

Contacte Julien Colin (administrateur de l'app).
Depuis le panneau admin, tu peux supprimer un compte ou corriger une équipe.
