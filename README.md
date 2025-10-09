# KBV DV LYON - Application de Gestion des Visites

Une application mobile moderne pour gérer les visites d'orateurs, développée avec React, TypeScript et Capacitor.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-19-blue)
![Capacitor](https://img.shields.io/badge/Capacitor-7-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)

---

## Fonctionnalités

### Gestion des Visites

- Planification des visites d'orateurs
- Vues multiples : Cartes, Liste, Calendrier, Semaine, Chronologie
- Archivage automatique des visites terminées
- Rappels et notifications

### Gestion des Orateurs

- Base de données complète des orateurs
- Historique des visites par orateur
- Informations de contact
- Liste des discours disponibles

### Gestion des Contacts d'Accueil

- Base de données des frères pour l'accueil
- Géolocalisation des adresses
- Envoi de messages personnalisés

### Messagerie Intelligente

- Génération de messages avec IA (Google Gemini)
- Support multilingue (Français, Anglais, Espagnol, etc.)
- Templates personnalisables

### Discours Publics

- Base de données de 200+ discours
- Recherche et filtrage avancés
- Attribution aux orateurs

### Statistiques

- Graphiques et analyses
- Statistiques par orateur
- Rapports imprimables

### Notifications

- Rappels pour les visites à venir
- Notifications programmables
- Gestion des préférences

### Interface Moderne

- Mode sombre/clair
- Design responsive (tablettes et smartphones)
- PWA (Progressive Web App)
- Interface intuitive

---

## Installation Rapide

### Prérequis

- Node.js 18+ ([Télécharger](https://nodejs.org/))
- Android Studio ([Télécharger](https://developer.android.com/studio))
- Samsung Galaxy Tab S10 Ultra (ou autre appareil Android)

### Installation Automatique

#### Windows (PowerShell)

```powershell
.\setup-android.ps1
```

#### Windows (Batch)

```cmd
setup-android.bat
```

### Installation Manuelle

1. **Installer les dépendances**

   ```bash
   npm install
   ```

2. **Construire l'application**

   ```bash
   npm run build
   ```

3. **Ajouter la plateforme Android**

   ```bash
   npx cap add android
   ```

4. **Configurer les autorisations**

   - Copiez le contenu de `AndroidManifest.template.xml`
   - Collez-le dans `android/app/src/main/AndroidManifest.xml`

5. **Synchroniser**

   ```bash
   npx cap sync android
   ```

6. **Ouvrir dans Android Studio**

   ```bash
   npx cap open android
   ```

---

## Documentation Complète

- **[INSTALLATION_COMPLETE.md](./INSTALLATION_COMPLETE.md)** - Guide d'installation détaillé
- **[DEPLOIEMENT_SAMSUNG_S10ULTRA.md](./DEPLOIEMENT_SAMSUNG_S10ULTRA.md)** - Déploiement sur tablette Samsung
- **[ANDROID_SETUP.md](./ANDROID_SETUP.md)** - Configuration Android détaillée
- **[AUTORISATIONS_ANDROID.md](./AUTORISATIONS_ANDROID.md)** - Liste complète des autorisations

---

## Technologies

### Frontend

- **React 19** - Framework UI
- **TypeScript 5.8** - Typage statique
- **Vite 6** - Build tool ultra-rapide

### Mobile

- **Capacitor 7** - Framework mobile natif
- **@capacitor/android** - Plateforme Android
- **@capacitor/camera** - Accès caméra
- **@capacitor/geolocation** - Géolocalisation
- **@capacitor/local-notifications** - Notifications
- **@capacitor/filesystem** - Système de fichiers
- **@capacitor/share** - Partage de contenu

### IA et Services

- **Google Gemini AI** - Génération de messages intelligents
- **@ionic/pwa-elements** - Éléments PWA

---

## Autorisations Android

L'application nécessite les autorisations suivantes :

### Essentielles

- **INTERNET** - API Google Gemini
- **ACCESS_NETWORK_STATE** - Vérification connexion
- **POST_NOTIFICATIONS** - Notifications (Android 13+)
- **SCHEDULE_EXACT_ALARM** - Rappels précis

### Optionnelles

- **CAMERA** - Appareil photo
- **ACCESS_FINE_LOCATION** - Géolocalisation
- **READ_MEDIA_IMAGES** - Accès galerie (Android 13+)

Consultez [AUTORISATIONS_ANDROID.md](./AUTORISATIONS_ANDROID.md) pour la liste complète.

---

## Scripts npm

```bash
# Développement web
npm run dev

# Construction
npm run build

# Prévisualisation
npm run preview

# Android : Build + Sync + Open
npm run android

# Android : Build + Sync seulement
npm run android:build

# Android : Open Android Studio
npm run android:open
```

---

## Structure du Projet

```text
kbv-dv-lyon-final/
├── android/                    # Projet Android (après npx cap add android)
├── assets/                     # Images et ressources
├── components/                 # Composants React
│   ├── Dashboard.tsx
│   ├── CalendarView.tsx
│   ├── MessagingCenter.tsx
│   └── ...
├── contexts/                   # Contextes React
│   ├── DataContext.tsx
│   ├── ToastContext.tsx
│   └── ConfirmContext.tsx
├── hooks/                      # Hooks personnalisés
├── utils/                      # Fonctions utilitaires
├── dist/                       # Build de production
├── App.tsx                     # Composant principal
├── index.tsx                   # Point d'entrée
├── types.ts                    # Types TypeScript
├── constants.ts                # Constantes
├── capacitor.config.ts         # Configuration Capacitor
├── vite.config.ts              # Configuration Vite
├── tsconfig.json               # Configuration TypeScript
├── package.json                # Dépendances
├── AndroidManifest.template.xml # Template autorisations
├── setup-android.ps1           # Script installation PowerShell
├── setup-android.bat           # Script installation Batch
└── Documentation/
    ├── INSTALLATION_COMPLETE.md
    ├── DEPLOIEMENT_SAMSUNG_S10ULTRA.md
    ├── ANDROID_SETUP.md
    └── AUTORISATIONS_ANDROID.md
