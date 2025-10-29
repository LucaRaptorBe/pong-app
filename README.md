# 🏓 Pong Game - 2 Players (Local & Online)

Un jeu de Pong classique pour 2 joueurs avec mode local et multijoueur en ligne, créé avec Next.js, TypeScript et Socket.IO.

## 🎮 Modes de jeu

### Mode Local
- Jouez à 2 sur le même ordinateur
- Contrôles : W/S (Joueur 1) et ↑/↓ (Joueur 2)

### Mode En Ligne
- Jouez contre quelqu'un d'autre via Internet
- Créez une partie et partagez le code à 6 caractères
- Ou rejoignez une partie existante avec un code
- **Connexion temps réel** via Socket.IO - latence ultra-faible !

## 🎮 Fonctionnalités

- **2 modes de jeu** : Local (même clavier) et En Ligne (multijoueur)
- **Contrôles simples** :
  - Joueur 1 : W (haut) / S (bas)
  - Joueur 2 : ↑ (haut) / ↓ (bas)
  - Pause : Espace (mode local uniquement)
  - Paramètres : Échap (mode local uniquement)
- **Paramètres personnalisables** (mode local) :
  - Vitesse de la balle
  - Vitesse des raquettes
  - Score pour gagner
- **Effets visuels** :
  - Effets de lueur (glow) sur les raquettes et la balle
  - Traînées visuelles
  - Animations fluides
- **Effets sonores** :
  - Sons de rebond
  - Sons de score
  - Son de victoire
- **Système de salles** (mode en ligne) :
  - Codes de salle uniques à 6 caractères
  - Indicateur de connexion en temps réel
  - Gestion des déconnexions

## 🚀 Installation et démarrage

### 1. Installer les dépendances

```bash
npm install
```

### 2. Lancer le serveur de développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

### 3. Build pour production

```bash
npm run build
npm start
```

### 3. Lancer le serveur Socket.IO (pour le mode en ligne)

```bash
# Dans un terminal séparé
npm run server
```

Le serveur Socket.IO tourne sur le port 3003.

## 🛠️ Technologies utilisées

- **Next.js 16** - Framework React avec App Router
- **TypeScript** - Typage statique
- **Tailwind CSS** - Styling
- **Socket.IO** - Communication temps réel pour le multijoueur
- **Canvas API** - Rendu du jeu
- **Web Audio API** - Effets sonores

## 📦 Déploiement

### Sur Render (Recommandé - Gratuit)

Le mode multijoueur nécessite un serveur Socket.IO. Vercel ne supporte pas les WebSockets, donc nous utilisons Render.

**📖 Voir le guide complet :** [DEPLOYMENT.md](./DEPLOYMENT.md)

**Résumé rapide :**
1. Pushez votre code sur GitHub
2. Créez 2 services sur Render (Backend + Frontend)
3. Configurez les variables d'environnement
4. C'est prêt ! 🚀

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/LucaRaptorBe/pong-app)

## 🎯 Comment jouer

### Mode Local

1. Cliquez sur **Mode Local**
2. Cliquez sur "Commencer" pour lancer le jeu
3. Utilisez W/S pour contrôler la raquette gauche (Joueur 1)
4. Utilisez ↑/↓ pour contrôler la raquette droite (Joueur 2)
5. Marquez des points en faisant passer la balle derrière la raquette adverse
6. Le premier joueur à atteindre le score de victoire gagne !

### Mode En Ligne

#### Créer une partie :
1. Cliquez sur **Mode En Ligne**
2. Cliquez sur **Créer une partie**
3. Un code à 6 caractères sera généré (ex: ABC123)
4. Partagez ce code avec votre adversaire
5. Cliquez sur **Commencer la partie**
6. Attendez que votre adversaire rejoigne

#### Rejoindre une partie :
1. Cliquez sur **Mode En Ligne**
2. Cliquez sur **Rejoindre une partie**
3. Entrez le code à 6 caractères partagé par votre adversaire
4. Cliquez sur **Rejoindre**
5. La partie commence automatiquement !

### Contrôles en ligne
- **Hôte (joueur qui a créé)** : W/S (raquette verte à gauche)
- **Invité (joueur qui a rejoint)** : ↑/↓ (raquette rose à droite)

## 🏗️ Architecture du multijoueur

### Comment ça marche ?

1. **Création de salle** : Le joueur 1 génère un code unique à 6 caractères
2. **Connexion Socket.IO** : Les deux joueurs se connectent au serveur Socket.IO
3. **Synchronisation temps réel** :
   - Chaque joueur envoie uniquement la position de SA raquette
   - L'hôte calcule la physique de la balle et envoie l'état complet du jeu
   - L'invité reçoit et affiche l'état du jeu
   - Communication bidirectionnelle via WebSockets

### Pourquoi l'hôte calcule la physique ?

Pour éviter les problèmes de synchronisation, un seul joueur (l'hôte) est responsable de :
- Calculer la position de la balle
- Détecter les collisions
- Gérer les scores

L'invité reçoit simplement l'état du jeu et l'affiche.

### Avantages de Socket.IO

✅ **Temps réel** : Communication bidirectionnelle instantanée
✅ **Fiable** : Reconnexion automatique en cas de déconnexion
✅ **Compatible** : Fonctionne sur tous les navigateurs modernes
✅ **Scalable** : Supporte plusieurs parties simultanées
✅ **Fallback automatique** : Passe de WebSocket à long-polling si nécessaire

## 🐛 Dépannage

### Le mode en ligne ne fonctionne pas ?

- Vérifiez que le serveur Socket.IO est démarré (`npm run server`)
- Ouvrez la console du navigateur pour voir les erreurs éventuelles
- Vérifiez que le port 3003 n'est pas bloqué
- En production : vérifiez les variables d'environnement dans Render

### Les deux joueurs ne peuvent pas se connecter ?

- Assurez-vous que les deux joueurs utilisent le **même code de salle**
- Vérifiez que les deux joueurs sont connectés au même serveur
- En production : Attendez 30-60s si c'est la première connexion (cold start)

## 📝 Licence

MIT

---

Créé avec ❤️ par [LucaRaptorBe](https://github.com/LucaRaptorBe)

Technologies : Next.js + Socket.IO + TypeScript + Tailwind CSS
