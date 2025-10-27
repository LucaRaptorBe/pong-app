# 🚀 Configuration Supabase - Guide pas à pas

Ce guide vous explique comment configurer Supabase pour activer le mode multijoueur en ligne de votre jeu Pong.

## ⏱️ Temps requis : 5 minutes

## 📋 Étape 1 : Créer un compte Supabase

1. Allez sur [https://supabase.com](https://supabase.com)
2. Cliquez sur **"Start your project"**
3. Connectez-vous avec votre compte GitHub (recommandé) ou créez un compte par email
4. C'est **100% gratuit** jusqu'à 500 MB de base de données et 200 connexions simultanées

## 🏗️ Étape 2 : Créer un nouveau projet

1. Une fois connecté, cliquez sur **"New project"**
2. Remplissez les informations :
   - **Name** : `pong-app` (ou le nom de votre choix)
   - **Database Password** : Générez un mot de passe fort (vous en aurez besoin que si vous utilisez la base de données)
   - **Region** : Choisissez la région la plus proche de vous (ex: `West EU (Ireland)` pour l'Europe)
   - **Pricing Plan** : Sélectionnez **Free** (gratuit)
3. Cliquez sur **"Create new project"**
4. Attendez 1-2 minutes que le projet soit créé ⏳

## 🔑 Étape 3 : Récupérer les clés API

1. Une fois le projet créé, allez dans **Settings** (⚙️ dans le menu de gauche)
2. Cliquez sur **API** dans le sous-menu
3. Vous verrez plusieurs informations, **copiez ces 2 éléments** :

### a) Project URL
Cherchez la section **"Project URL"** et copiez l'URL qui ressemble à :
```
https://xxxxxxxxxxxxx.supabase.co
```

### b) anon/public key
Cherchez la section **"Project API keys"** et copiez la clé **`anon` `public`** qui ressemble à :
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **Attention** : Ne copiez PAS la clé `service_role`, elle est privée !

## 📝 Étape 4 : Configurer les variables d'environnement

1. Ouvrez le dossier de votre projet Pong
2. Copiez le fichier `.env.local.example` en `.env.local` :
   ```bash
   cp .env.local.example .env.local
   ```
3. Ouvrez `.env.local` et remplacez les valeurs :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. Sauvegardez le fichier

## 🎮 Étape 5 : Activer Supabase Realtime

1. Dans votre projet Supabase, allez dans **Database** (dans le menu de gauche)
2. Cliquez sur **Replication** dans le sous-menu
3. Vous devriez voir que **Realtime** est déjà activé par défaut ✅

C'est tout ! Vous n'avez pas besoin de créer de tables ou de schémas, car nous utilisons uniquement **Broadcast** (pas la base de données).

## ✅ Étape 6 : Tester

1. Redémarrez votre serveur de développement si nécessaire :
   ```bash
   npm run dev
   ```
2. Ouvrez [http://localhost:3000](http://localhost:3000)
3. Cliquez sur **Mode En Ligne**
4. Créez une partie
5. Ouvrez un autre onglet ou un autre navigateur
6. Rejoignez la partie avec le code
7. **Ça marche !** 🎉

## 🚀 Étape 7 : Déployer sur Vercel (optionnel)

Si vous déployez sur Vercel, n'oubliez pas d'ajouter les variables d'environnement :

1. Allez sur [https://vercel.com](https://vercel.com)
2. Sélectionnez votre projet
3. Allez dans **Settings > Environment Variables**
4. Ajoutez :
   - `NEXT_PUBLIC_SUPABASE_URL` = votre URL Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = votre clé anon
5. Redéployez votre projet

## 🐛 Dépannage

### Erreur : "Invalid API key"
- Vérifiez que vous avez bien copié la clé **`anon`** et pas la clé `service_role`
- Vérifiez qu'il n'y a pas d'espaces avant ou après les clés dans `.env.local`

### Erreur : "Failed to connect to realtime"
- Vérifiez que votre projet Supabase est bien démarré (pas en pause)
- Vérifiez votre connexion Internet
- Ouvrez la console du navigateur (F12) pour voir les erreurs détaillées

### Les joueurs ne peuvent pas se connecter
- Assurez-vous que les deux joueurs utilisent le **même code de salle**
- Vérifiez que Realtime est bien activé dans votre projet Supabase
- Essayez de rafraîchir la page

## 💰 Limites du plan gratuit

Le plan gratuit de Supabase inclut :
- ✅ 500 MB de base de données (on n'utilise pas de DB pour ce jeu)
- ✅ **200 connexions simultanées** → 100 parties en simultané
- ✅ 2 GB de bande passante par mois
- ✅ Realtime illimité

Pour un jeu Pong, le plan gratuit est **largement suffisant** ! 🎉

## 📚 Ressources

- [Documentation Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Supabase Broadcast Documentation](https://supabase.com/docs/guides/realtime/broadcast)
- [Supabase Dashboard](https://app.supabase.com)

---

**Besoin d'aide ?** Ouvrez une issue sur GitHub !
