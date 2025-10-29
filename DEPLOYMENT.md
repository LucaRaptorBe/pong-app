# 🚀 Guide de Déploiement sur Render

Ce guide vous explique comment déployer votre jeu Pong multijoueur sur Render (gratuit).

## 📋 Architecture

Votre application nécessite **2 services** :
1. **Backend Socket.IO** - Gère les connexions temps réel
2. **Frontend Next.js** - Interface du jeu

## 🎯 Étapes de Déploiement

### Prérequis
- Un compte GitHub (gratuit)
- Un compte Render (gratuit) : https://render.com

### 1️⃣ Préparer le Code

**Important** : Votre code est déjà prêt pour la production ! Les fichiers suivants ont été configurés :
- ✅ `render.yaml` - Configuration Render
- ✅ `server.js` - Serveur Socket.IO avec CORS
- ✅ `lib/socketConnection.ts` - Client avec variables d'environnement

### 2️⃣ Pusher sur GitHub

```bash
# Initialiser git (si pas déjà fait)
git init
git add .
git commit -m "Ready for Render deployment"

# Créer un repo sur GitHub puis :
git remote add origin https://github.com/VOTRE-USERNAME/pong-app.git
git branch -M main
git push -u origin main
```

### 3️⃣ Déployer sur Render

#### A. Déployer le Backend Socket.IO (en premier)

1. Allez sur https://dashboard.render.com
2. Cliquez sur **"New +"** → **"Web Service"**
3. Connectez votre repo GitHub
4. Configuration :
   - **Name** : `pong-socketio-server`
   - **Environment** : `Node`
   - **Build Command** : `npm install`
   - **Start Command** : `node server.js`
   - **Instance Type** : `Free`
5. Variables d'environnement (onglet "Environment") :
   - `NODE_ENV` = `production`
   - `FRONTEND_URL` = (laissez vide pour l'instant, on le remplira après)
6. Cliquez sur **"Create Web Service"**
7. ⏱️ Attendez le déploiement (2-3 minutes)
8. 📝 **NOTEZ L'URL** (exemple : `https://pong-socketio-server.onrender.com`)

#### B. Déployer le Frontend Next.js

1. Cliquez sur **"New +"** → **"Web Service"**
2. Sélectionnez le même repo GitHub
3. Configuration :
   - **Name** : `pong-frontend`
   - **Environment** : `Node`
   - **Build Command** : `npm install && npm run build`
   - **Start Command** : `npm start`
   - **Instance Type** : `Free`
4. Variables d'environnement :
   - `NODE_ENV` = `production`
   - `NEXT_PUBLIC_SOCKET_URL` = `https://pong-socketio-server.onrender.com` (URL du backend notée à l'étape A)
5. Cliquez sur **"Create Web Service"**
6. ⏱️ Attendez le déploiement (3-5 minutes)
7. 📝 **NOTEZ L'URL** (exemple : `https://pong-frontend.onrender.com`)

#### C. Mettre à jour le Backend avec l'URL du Frontend

1. Retournez sur le service **pong-socketio-server**
2. Allez dans **"Environment"**
3. Modifiez `FRONTEND_URL` avec l'URL du frontend (exemple : `https://pong-frontend.onrender.com`)
4. Cliquez sur **"Save Changes"**
5. Le service redémarrera automatiquement

### 4️⃣ Tester l'Application

1. Ouvrez l'URL du frontend (exemple : `https://pong-frontend.onrender.com`)
2. ⏱️ **Première visite** : Attendez 30-60 secondes (cold start du free tier)
3. Créez une partie
4. Ouvrez un autre onglet/navigateur et rejoignez avec le code
5. Jouez ! 🎮

## ⚠️ Limitations du Free Tier

- **Cold start** : Les services s'arrêtent après 15 minutes d'inactivité
- **Premier lancement** : Prend 30-60 secondes à redémarrer
- **Solution** : Gratuit et parfait pour un portfolio/démo !

## 🐛 Dépannage

### Le jeu ne se connecte pas
- Vérifiez que les deux services sont "Live" (pastille verte) dans Render
- Vérifiez les variables d'environnement (surtout `NEXT_PUBLIC_SOCKET_URL`)
- Regardez les logs dans Render Dashboard

### Cold start trop long
- Normal pour le free tier ! Attendez 1 minute lors de la première connexion

### Erreur CORS
- Vérifiez que `FRONTEND_URL` est bien configuré dans le backend
- L'URL doit correspondre exactement (avec https://)

## 🎉 Félicitations !

Votre jeu Pong multijoueur est en ligne ! Partagez l'URL avec vos amis. 🏓

## 📚 Ressources

- [Documentation Render](https://render.com/docs)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

**Astuce** : Ajoutez l'URL de votre jeu dans votre portfolio ou CV ! 🚀
