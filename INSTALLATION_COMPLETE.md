# 🚀 Installation Complète - KBV Lyon App

## 📋 Prérequis

### Logiciels nécessaires
- **Node.js** (version 18 ou supérieure) - [Télécharger](https://nodejs.org/)
- **Android Studio** - [Télécharger](https://developer.android.com/studio)
- **Git** (optionnel) - [Télécharger](https://git-scm.com/)

### Configuration Android Studio
1. Installez Android Studio
2. Lors de l'installation, assurez-vous d'installer :
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device (pour émulateur)
3. Configurez les variables d'environnement :
   - `ANDROID_HOME` = Chemin vers le SDK Android (ex: `C:\Users\VotreNom\AppData\Local\Android\Sdk`)
   - Ajoutez au PATH : `%ANDROID_HOME%\platform-tools`

---

## 🛠️ Installation du Projet

### 1. Installation des dépendances
Ouvrez un terminal dans le dossier du projet et exécutez :

```bash
npm install
```

Cette commande va installer toutes les dépendances nécessaires :
- React 19
- Capacitor 7
- Plugins Capacitor (Camera, Geolocation, Notifications, etc.)
- Google Gemini AI
- Ionic PWA Elements
- Vite (bundler)
- TypeScript

### 2. Configuration de l'environnement

Le fichier `.env.local` a été créé. Ajoutez-y votre clé API Google Gemini :

```env
VITE_GEMINI_API_KEY=votre_cle_api_gemini_ici
```

Pour obtenir une clé API Gemini :
1. Allez sur [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Créez une nouvelle clé API
3. Copiez-la dans le fichier `.env.local`

### 3. Construction de l'application web

```bash
npm run build
```

Cette commande compile l'application React et crée les fichiers optimisés dans le dossier `dist/`.

### 4. Ajout de la plateforme Android

```bash
npx cap add android
```

Cette commande crée le dossier `android/` avec toute la structure nécessaire pour Android.

### 5. Configuration des autorisations Android

**IMPORTANT** : Après l'étape 4, vous devez configurer les autorisations Android.

Ouvrez le fichier : `android/app/src/main/AndroidManifest.xml`

Copiez tout le contenu du fichier `AndroidManifest.template.xml` et remplacez le contenu existant.

Le template inclut toutes les autorisations nécessaires pour :
- 📸 Caméra
- 📍 Géolocalisation
- 🔔 Notifications
- 📁 Système de fichiers
- 🌐 Internet
- 📤 Partage

### 6. Synchronisation

```bash
npx cap sync android
```

Cette commande synchronise les fichiers web avec le projet Android.

### 7. Ouverture dans Android Studio

```bash
npx cap open android
```

Android Studio s'ouvrira avec votre projet.

---

## 📱 Déploiement sur Samsung Galaxy Tab S10 Ultra

Consultez le guide détaillé : **[DEPLOIEMENT_SAMSUNG_S10_ULTRA.md](./DEPLOIEMENT_SAMSUNG_S10_ULTRA.md)**

### Résumé rapide

1. **Activez le mode développeur** sur votre tablette :
   - Paramètres > À propos de la tablette
   - Appuyez 7 fois sur "Numéro de build"

2. **Activez le débogage USB** :
   - Paramètres > Options de développeur
   - Activez "Débogage USB"

3. **Connectez votre tablette** via USB

4. **Autorisez le débogage** sur la tablette

5. **Dans Android Studio**, cliquez sur Run (▶️)

---

## 🎯 Scripts npm disponibles

```bash
# Développement web (navigateur)
npm run dev

# Construction de l'application web
npm run build

# Prévisualisation de la version de production
npm run preview

# Construction + Sync + Ouverture Android Studio
npm run android

# Construction + Sync Android seulement
npm run android:build

# Ouverture Android Studio seulement
npm run android:open
```

---

## 📁 Structure du Projet

```
kbv-dv-lyon-final/
├── android/                    # Projet Android (créé après npx cap add android)
├── assets/                     # Images et ressources
├── components/                 # Composants React
├── contexts/                   # Contextes React (DataContext, ToastContext, etc.)
├── hooks/                      # Hooks personnalisés
├── utils/                      # Fonctions utilitaires
├── dist/                       # Fichiers compilés (après npm run build)
├── node_modules/               # Dépendances npm
├── App.tsx                     # Composant principal
├── index.tsx                   # Point d'entrée
├── types.ts                    # Types TypeScript
├── constants.ts                # Constantes de l'application
├── capacitor.config.ts         # Configuration Capacitor
├── vite.config.ts              # Configuration Vite
├── tsconfig.json               # Configuration TypeScript
├── package.json                # Dépendances et scripts
├── AndroidManifest.template.xml # Template pour AndroidManifest.xml
├── ANDROID_SETUP.md            # Guide de configuration Android
├── DEPLOIEMENT_SAMSUNG_S10_ULTRA.md # Guide de déploiement
└── INSTALLATION_COMPLETE.md    # Ce fichier
```

---

## 🔧 Fonctionnalités de l'Application

### Gestion des Visites
- 📅 Planification des visites d'orateurs
- 📊 Tableau de bord avec statistiques
- 📆 Vues multiples (Cartes, Liste, Calendrier, Semaine, Chronologie)
- ✅ Archivage des visites terminées

### Gestion des Orateurs
- 👤 Base de données des orateurs
- 📝 Historique des visites par orateur
- 📞 Informations de contact
- 🎤 Liste des discours disponibles

### Gestion des Contacts d'Accueil
- 🏠 Base de données des frères pour l'accueil
- 📍 Géolocalisation des adresses
- 📧 Envoi de messages

### Messagerie
- 💬 Génération de messages avec IA (Google Gemini)
- 📤 Envoi de messages personnalisés
- 🌍 Support multilingue (Français, Anglais, Espagnol, etc.)

### Discours Publics
- 📚 Base de données de 200+ discours publics
- 🔍 Recherche et filtrage
- 📋 Attribution aux orateurs

### Statistiques
- 📈 Graphiques et analyses
- 📊 Statistiques par orateur
- 📅 Historique des visites

### Notifications
- 🔔 Rappels pour les visites à venir
- ⏰ Notifications programmables
- 🔕 Gestion des préférences

---

## 🔐 Autorisations Android Configurées

L'application demande les autorisations suivantes :

### Autorisations critiques
- **CAMERA** - Pour prendre des photos
- **ACCESS_FINE_LOCATION** - Pour la géolocalisation précise
- **POST_NOTIFICATIONS** - Pour les notifications (Android 13+)
- **READ_MEDIA_IMAGES** - Pour accéder aux images (Android 13+)

### Autorisations standard
- **INTERNET** - Pour l'API Google Gemini
- **ACCESS_NETWORK_STATE** - Pour vérifier la connexion
- **VIBRATE** - Pour les notifications
- **SCHEDULE_EXACT_ALARM** - Pour les rappels précis

Consultez [ANDROID_SETUP.md](./ANDROID_SETUP.md) pour la liste complète.

---

## 🐛 Résolution de Problèmes

### Erreur : "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Erreur : "SDK location not found"
Configurez la variable d'environnement `ANDROID_HOME`.

### Erreur : "Manifest merger failed"
Vérifiez que `AndroidManifest.xml` est correctement configuré avec le template fourni.

### L'application se ferme au démarrage
1. Ouvrez Logcat dans Android Studio
2. Filtrez par `com.kbv.lyon`
3. Recherchez les erreurs en rouge

### Les notifications ne fonctionnent pas
1. Vérifiez que l'autorisation POST_NOTIFICATIONS est accordée
2. Sur Android 13+, l'utilisateur doit accepter manuellement

---

## 📚 Documentation Supplémentaire

- **[ANDROID_SETUP.md](./ANDROID_SETUP.md)** - Configuration détaillée Android
- **[DEPLOIEMENT_SAMSUNG_S10_ULTRA.md](./DEPLOIEMENT_SAMSUNG_S10_ULTRA.md)** - Guide de déploiement sur tablette
- **[AndroidManifest.template.xml](./AndroidManifest.template.xml)** - Template des autorisations

---

## 🔄 Workflow de Développement

### Développement Web
```bash
npm run dev
```
Ouvrez http://localhost:5173 dans votre navigateur.

### Test sur Android
```bash
npm run build
npx cap sync android
npx cap open android
```
Puis cliquez sur Run dans Android Studio.

### Mise à jour après modifications
```bash
npm run build
npx cap sync android
```
Puis redéployez depuis Android Studio.

---

## 🌟 Fonctionnalités Avancées

### Mode Sombre
L'application supporte automatiquement le mode sombre.

### PWA (Progressive Web App)
L'application peut être installée comme PWA sur navigateur.

### Offline
Certaines fonctionnalités fonctionnent hors ligne grâce au stockage local.

### Responsive
Interface adaptée aux tablettes et smartphones.

---

## 📞 Support et Aide

### Ressources Officielles
- [Documentation Capacitor](https://capacitorjs.com/docs)
- [Documentation React](https://react.dev/)
- [Documentation Android](https://developer.android.com/)
- [Google Gemini AI](https://ai.google.dev/)

### Commandes Utiles
```bash
# Vérifier les appareils connectés
adb devices

# Voir les logs
adb logcat

# Nettoyer le projet Android
cd android && ./gradlew clean

# Reconstruire tout
npm run build && npx cap sync android
```

---

## ✅ Checklist d'Installation

- [ ] Node.js installé
- [ ] Android Studio installé
- [ ] Variables d'environnement configurées
- [ ] `npm install` exécuté avec succès
- [ ] Clé API Gemini ajoutée dans `.env.local`
- [ ] `npm run build` réussi
- [ ] `npx cap add android` exécuté
- [ ] `AndroidManifest.xml` configuré avec le template
- [ ] `npx cap sync android` réussi
- [ ] Mode développeur activé sur la tablette
- [ ] Débogage USB activé
- [ ] Tablette connectée et autorisée
- [ ] Application déployée et testée

---

## 🎉 Félicitations !

Votre application KBV Lyon est maintenant prête à être utilisée sur votre Samsung Galaxy Tab S10 Ultra !

Pour toute question ou problème, consultez les guides de dépannage dans les fichiers de documentation.

**Bon développement ! 🚀**
