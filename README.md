# 🏓 Pong Game - 2 Players (Local & Online)

Un jeu de Pong classique pour 2 joueurs avec mode local et multijoueur en ligne, créé avec Next.js, TypeScript et Supabase.

## 🎮 Modes de jeu

### Mode Local
- Jouez à 2 sur le même ordinateur
- Contrôles : W/S (Joueur 1) et ↑/↓ (Joueur 2)

### Mode En Ligne
- Jouez contre quelqu'un d'autre via Internet
- Créez une partie et partagez le code à 6 caractères
- Ou rejoignez une partie existante avec un code
- Synchronisation en temps réel via Supabase

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

### 2. Configuration Supabase (pour le mode en ligne)

1. Créez un compte gratuit sur [https://supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Allez dans **Settings > API**
4. Copiez votre **Project URL** et votre **anon/public key**
5. Créez un fichier `.env.local` à la racine du projet :

```bash
cp .env.local.example .env.local
```

6. Éditez `.env.local` et ajoutez vos clés :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon-publique
```

### 3. Lancer le serveur de développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

### 4. Build pour production

```bash
npm run build
npm start
```

## 🛠️ Technologies utilisées

- **Next.js 16** - Framework React avec App Router
- **TypeScript** - Typage statique
- **Tailwind CSS** - Styling
- **Supabase** - Backend temps réel pour le multijoueur
- **Canvas API** - Rendu du jeu
- **Web Audio API** - Effets sonores

## 📦 Déploiement

### Sur Vercel

1. Connectez-vous à [https://vercel.com](https://vercel.com)
2. Importez votre repository GitHub
3. Ajoutez vos variables d'environnement :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Déployez !

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

1. **Création de salle** : Le joueur 1 génère un code unique
2. **Connexion** : Les deux joueurs se connectent au même "channel" Supabase
3. **Synchronisation** :
   - Chaque joueur envoie uniquement la position de SA raquette
   - L'hôte calcule la physique de la balle et envoie l'état complet du jeu
   - L'invité reçoit et affiche l'état du jeu
4. **Temps réel** : Utilisation de Supabase Realtime (WebSocket) pour une latence de ~50-100ms

### Pourquoi l'hôte calcule la physique ?

Pour éviter les problèmes de synchronisation, un seul joueur (l'hôte) est responsable de :
- Calculer la position de la balle
- Détecter les collisions
- Gérer les scores

L'invité reçoit simplement l'état du jeu et l'affiche.

## 🐛 Dépannage

### Le mode en ligne ne fonctionne pas ?

- Vérifiez que vous avez bien configuré les variables d'environnement Supabase
- Vérifiez que vous avez créé un projet Supabase
- Ouvrez la console du navigateur pour voir les erreurs éventuelles

### Les deux joueurs ne peuvent pas se connecter ?

- Assurez-vous que les deux joueurs utilisent le **même code de salle**
- Vérifiez que les deux joueurs sont connectés à Internet
- Essayez de rafraîchir la page

### Latence élevée ?

- Supabase Realtime a une latence de ~50-100ms, c'est normal
- Pour une latence plus faible, il faudrait utiliser Socket.IO avec un serveur dédié

## 📝 Licence

MIT

---

Créé avec ❤️ par [LucaRaptorBe](https://github.com/LucaRaptorBe)

Technologies : Next.js + Supabase + TypeScript + Tailwind CSS
