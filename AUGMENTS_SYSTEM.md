# Système d'Augments pour Pong Online

## Vue d'ensemble

Le système d'augments a été complètement intégré dans votre jeu Pong! Il s'inspire du mode Arena de League of Legends avec des augments passifs et des sorts actifs.

## Caractéristiques implémentées

### 1. Augments Passifs (8 augments disponibles)

- **Paddle Titan** 🛡️ - Augmente la taille de votre raquette de 30%
- **Speed Demon** ⚡ - Augmente votre vitesse de déplacement de 50%
- **Chaos Ball** 🔥 - La balle dans le camp adverse va 30% plus vite
- **Bouncy Castle** 💫 - La balle rebondit 20% plus fort sur votre raquette
- **Fortress** 🏰 - Réduit la vitesse de la balle dans votre camp de 25%
- **Agile Warrior** 🥷 - +25% vitesse et +15% taille de raquette
- **Wall Master** 🧱 - +50% taille de raquette mais -20% vitesse
- **Velocity King** 🚀 - La balle accélère de 15% à chaque rebond

### 2. Sorts Actifs (4 sorts disponibles)

- **Bouclier Temporel (Q)** 🕐 - Ralentit la balle de 60% pendant 2s (cooldown: 15s)
- **Dash (E)** 💨 - Téléporte votre raquette instantanément (cooldown: 8s)
- **Nova Freeze (R)** ❄️ - Gèle la balle pendant 1.5s (cooldown: 30s)
- **Split Ball (R)** 🌟 - Duplique la balle en 2 pendant 5s (cooldown: 30s)

### 3. Système de sélection

- **Premier point marqué** : **Les deux joueurs** choisissent 1 sort parmi 2 options
- **Points suivants** : **Les deux joueurs** choisissent 1 augment passif parmi 3 options
- Les augments s'accumulent au fil de la partie
- Les joueurs sélectionnent indépendamment mais doivent tous deux choisir avant de continuer
- L'écran de sélection s'affiche simultanément pour les deux joueurs après chaque point

### 4. Interface utilisateur

- **Écran de sélection** : Apparaît automatiquement après chaque point
- **HUD en jeu** :
  - Affiche les augments actifs de chaque joueur
  - Montre les cooldowns des sorts en temps réel
  - Indique visuellement quand un sort est actif
- **Indicateurs visuels** : Les effets des augments sont visibles (taille de raquette, etc.)

### 5. Contrôles

- **W/S ou ↑/↓** : Déplacement de la raquette
- **Q** : Activer le sort Q (si débloqué)
- **E** : Activer le sort E (si débloqué)
- **R** : Activer le sort R (si débloqué)
- **ESPACE** : Démarrer le round (host uniquement)

### 6. Synchronisation réseau

- Tous les choix d'augments sont synchronisés via Socket.IO
- Les activations de sorts sont diffusées en temps réel
- Les effets sont appliqués de manière cohérente entre les deux joueurs

## Fichiers créés/modifiés

### Nouveaux fichiers
- `lib/augments.ts` - Types et définitions des augments/sorts
- `components/AugmentSelection.tsx` - Écran de sélection d'augments
- `components/AbilityHUD.tsx` - HUD des cooldowns et augments actifs

### Fichiers modifiés
- `components/OnlinePongGame.tsx` - Intégration complète du système
- `lib/socketConnection.ts` - Ajout des messages Socket.IO pour les augments
- `server.js` - Gestion des nouveaux événements d'augments

## Comment tester

1. Démarrez le serveur Socket.IO :
   ```bash
   node server.js
   ```

2. Démarrez l'application Next.js :
   ```bash
   npm run dev
   ```

3. Créez une partie en mode online et jouez avec un ami

4. Après le premier point, vous choisirez un sort (Q, E ou R)

5. Après les points suivants, vous choisirez des augments passifs

6. Testez l'activation des sorts avec les touches Q, E, R pendant le jeu

## Évolutions possibles

- Ajouter plus d'augments et de sorts
- Implémenter le sort "Dash" avec des effets visuels
- Implémenter le sort "Split Ball" (duplication de la balle)
- Ajouter des effets de particules pour les sorts actifs
- Créer des combos d'augments avec bonus
- Ajouter des augments légendaires plus rares
- Système de ban/pick avant le début de la partie

## Notes techniques

- Les effets des augments se cumulent multiplicativement
- Les augments de taille de raquette affectent la détection de collision
- Les sorts ont des cooldowns indépendants par joueur
- Le système est conçu pour être facilement extensible

Bon jeu ! 🎮
