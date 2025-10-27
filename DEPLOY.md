# 🚀 Guide de déploiement

## Étape 1 : Créer le repository GitHub

1. Allez sur https://github.com/new
2. Nom du repository : `pong-app`
3. Description : "Jeu Pong 2 joueurs avec Next.js"
4. Mode : **Public**
5. N'ajoutez PAS de README, .gitignore ou licence
6. Cliquez sur "Create repository"

## Étape 2 : Pousser le code vers GitHub

Remplacez `VOTRE-USERNAME` par votre nom d'utilisateur GitHub :

```bash
git remote add origin https://github.com/VOTRE-USERNAME/pong-app.git
git branch -M main
git push -u origin main
```

## Étape 3 : Déployer sur Vercel

### Option A : Via le site web Vercel (Recommandé)

1. Allez sur https://vercel.com
2. Connectez-vous avec votre compte GitHub
3. Cliquez sur "Add New" → "Project"
4. Importez votre repository `pong-app`
5. Gardez les paramètres par défaut (Vercel détecte automatiquement Next.js)
6. Cliquez sur "Deploy"
7. Attendez 1-2 minutes
8. Votre jeu est en ligne ! 🎉

### Option B : Via Vercel CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Pour le déploiement en production
vercel --prod
```

## URLs finales

Une fois déployé, vous aurez :
- **GitHub** : https://github.com/VOTRE-USERNAME/pong-app
- **Vercel** : https://pong-app-VOTRE-USERNAME.vercel.app (ou domaine personnalisé)

## Tester localement

```bash
npm run dev
```

Puis ouvrez http://localhost:3000

---

**Note** : Le jeu fonctionne entièrement côté client (pas de serveur requis), donc le déploiement est instantané et gratuit sur Vercel !
