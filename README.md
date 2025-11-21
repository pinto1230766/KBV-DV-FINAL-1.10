# KBV Lyon - Application de Gestion

Cette application, développée avec React et Capacitor, permet la gestion des visites d'orateurs, des contacts, et la planification d'événements pour l'assemblée KBV Lyon.

## 📋 Sommaire

- [Prérequis](#prérequis)
- [Installation](#️-installation)
- [Scripts disponibles](#-scripts-disponibles)
- [Déploiement sur Android](#-déploiement-sur-android)
- [Développement sans fil (WiFi)](#-développement-sans-fil-wifi)
- [Gestion des assets (icônes et images)](#-gestion-des-assets-icônes-et-images)
- [Construction d'un APK pour la distribution](#-construction-dun-apk-pour-la-distribution)
- [Dépannage](#-dépannage)

---

## Prérequis

Avant de commencer, assurez-vous d'avoir installé les logiciels suivants :

- **Node.js** (version 18 ou supérieure) - [Télécharger](https://nodejs.org/)
- **Android Studio** - [Télécharger](https://developer.android.com/studio)

### Configuration d'Android Studio

1. Installez Android Studio et assurez-vous que les composants suivants sont inclus :
    - Android SDK
    - Android SDK Platform-Tools
    - Android Virtual Device (pour l'émulateur, optionnel)

2. Configurez la variable d'environnement `ANDROID_HOME` pour qu'elle pointe vers le répertoire de votre SDK Android.
    - Exemple Windows : `C:\Users\VotreNom\AppData\Local\Android\Sdk`
    - Ajoutez également le dossier `platform-tools` à votre `PATH` système.

---

## 🛠️ Installation

Vous pouvez utiliser les scripts `setup-android.bat` (pour CMD) ou `setup-android.ps1` (pour PowerShell) qui automatisent toutes les étapes ci-dessous.

Si vous préférez une installation manuelle, suivez ces étapes :

1. **Installer les dépendances**
    Ouvrez un terminal à la racine du projet et exécutez :

    ```bash
    npm install
    ```

2. **Configurer l'environnement**
    Copiez le fichier `.env.local.example` vers `.env.local` et ajoutez votre clé API Google Gemini.

    ```bash
    cp .env.local.example .env.local
    ```

    Modifiez le fichier `.env.local` :

    ```env
    VITE_GEMINI_API_KEY=votre_cle_api_gemini_ici
    ```

    Vous pouvez obtenir une clé API sur Google AI Studio.

3. **Construire l'application web**
    Cette commande compile le code React/TypeScript dans le dossier `dist/`.

    ```bash
    npm run build
    ```

4. **Ajouter la plateforme Android**
    Cette commande crée le projet natif Android dans le dossier `android/`.

    ```bash
    npx cap add android
    ```

5. **Configurer le manifeste Android**
    Copiez le contenu du fichier `AndroidManifest.template.xml` et remplacez entièrement le contenu du fichier `android/app/src/main/AndroidManifest.xml`. Ce template contient toutes les autorisations nécessaires.

6. **Synchroniser le projet**
    Cette commande copie les fichiers web (`dist/`) et met à jour les plugins natifs.

    ```bash
    npx cap sync android
    ```

---

## 🚀 Scripts disponibles

- `npm run dev`: Lance le serveur de développement pour tester l'application dans un navigateur web.
- `npm run build`: Construit l'application web pour la production.
- `npm run android`: Exécute `build`, `sync` et ouvre Android Studio.
- `npm run android:open`: Ouvre le projet dans Android Studio.

---

## 📱 Déploiement sur Android

### 1. Configuration de l'appareil Android

a. **Activer le Mode Développeur**

- Allez dans **Paramètres** > **À propos de l'appareil**.
- Appuyez **7 fois** sur **Numéro de build** jusqu'à ce qu'un message confirme l'activation.

b. **Activer le Débogage USB**

- Retournez dans **Paramètres**, puis allez dans le nouveau menu **Options de développeur**.
- Activez **Débogage USB**.

### 2. Déploiement via USB

a. **Connecter l'appareil**

- Connectez votre tablette ou téléphone à votre ordinateur via un câble USB.
- Sur l'appareil, autorisez le débogage USB lorsque la pop-up apparaît.

b. **Lancer l'application**

- Exécutez la commande suivante pour ouvrir Android Studio :

     ```bash
     npm run android:open
     ```

- Dans Android Studio, sélectionnez votre appareil dans la liste déroulante en haut.
- Cliquez sur le bouton **Run (▶️)** pour compiler et installer l'application sur votre appareil.

---

## 🌐 Développement sans fil (WiFi)

Pour déployer sans câble, vous pouvez utiliser ADB sur WiFi.

1. **Configuration initiale (une seule fois)**
    - Connectez votre appareil via USB.
    - Assurez-vous que votre PC et votre appareil sont sur le même réseau WiFi.
    - Exécutez `adb tcpip 5555` dans un terminal.
    - Débranchez le câble USB.
    - Trouvez l'adresse IP de votre appareil (dans les paramètres WiFi) et exécutez :

      ```bash
      adb connect VOTRE_ADRESSE_IP:5555
      ```

2. **Déploiements suivants**
    Assurez-vous simplement que l'appareil est connecté (`adb devices`) et utilisez les commandes de déploiement habituelles.

---

## 🎨 Gestion des assets (icônes et images)

Pour une gestion simplifiée et complète des icônes et écrans de démarrage de votre application (pour le web, Android et iOS), il est fortement recommandé d'utiliser l'outil `@capacitor/assets`.

### 1. Préparer votre image source

Créez une image de haute résolution (idéalement 1024x1024 pixels ou plus, au format PNG ou SVG) pour votre icône d'application. Placez-la par exemple à la racine de votre projet sous le nom `app-icon.png`.

### 2. Installer `@capacitor/assets`

```bash
npm install -D @capacitor/assets
```

### 3. Générer les assets

Exécutez la commande suivante en spécifiant votre image source :

```bash
npx @capacitor/assets generate --icon app-icon.png --splash splash.png --pwa
```

Cette commande va :

- Créer toutes les icônes nécessaires dans les dossiers `mipmap-xxx` de votre projet Android.
- Créer les icônes pour les PWA dans `public/assets/icons/`.
- Mettre à jour `index.html` et `manifest.json` pour référencer ces nouvelles icônes.

**Note :** Si vous n'avez pas d'image de splash screen (`splash.png`), vous pouvez omettre l'option `--splash`.

### Images dans l'application

Placez toutes les autres images (photos, illustrations) dans le dossier `public/` et référencez-les avec un chemin absolu depuis la racine.

**Exemple :**

```tsx
// L'image est située dans public/images/mon-image.jpg
<img src="/images/mon-image.jpg" alt="Description" />
```

---

## 📦 Construction d'un APK pour la distribution

### APK de débogage (pour tests)

```bash
cd android
./gradlew assembleDebug
```

L'APK sera généré dans `android/app/build/outputs/apk/debug/app-debug.apk`.

### APK de production (signé)

1. **Créer un keystore** (si vous n'en avez pas) :

    ```bash
    keytool -genkey -v -keystore mon-app.keystore -alias mon_alias -keyalg RSA -keysize 2048 -validity 10000
    ```

2. **Configurer la signature**
    Créez un fichier `keystore.properties` à la racine du dossier `android/` (ajoutez-le à `.gitignore`) avec les informations suivantes :

    ```properties
    storePassword=votre_mot_de_passe_keystore
    keyAlias=mon_alias
    keyPassword=votre_mot_de_passe_alias
    storeFile=../mon-app.keystore
    ```

3. **Modifier `build.gradle`**
    Dans `android/app/build.gradle`, chargez ces propriétés et configurez le `signingConfig`.

4. **Construire l'APK** :

    ```bash
    cd android
    ./gradlew assembleRelease
    ```

L'APK signé sera généré dans `android/app/build/outputs/apk/release/app-release.apk`.

---

## 🔧 Dépannage

### Erreur : `SDK location not found`

Assurez-vous que la variable d'environnement `ANDROID_HOME` est correctement configurée et qu'elle pointe vers le répertoire de votre SDK Android.

### Erreur : `Manifest merger failed`

Cette erreur se produit souvent en cas de conflit entre le `AndroidManifest.xml` principal et ceux des plugins. Le `AndroidManifest.template.xml` fourni contient déjà une correction pour un conflit courant avec `android:exported`.

**Solution générale :**

1. Ajoutez le namespace `tools` à la balise `<manifest>` :

    ```xml
    <manifest xmlns:android="http://schemas.android.com/apk/res/android"
        xmlns:tools="http://schemas.android.com/tools">
    ```

2. Sur l'élément qui pose problème, ajoutez `tools:replace="android:attributeName"` pour forcer l'utilisation de votre valeur.

    ```xml
    <receiver
        android:name="..."
        android:exported="true"
        tools:replace="android:exported">
        ...
    </receiver>
    ```

### L'application se ferme immédiatement au démarrage

1. Ouvrez Android Studio et allez dans l'onglet **Logcat**.
2. Filtrez les logs par le nom de votre package (ex: `com.kbv.lyon`).
3. Recherchez les erreurs (en rouge) qui se produisent au lancement. Les causes courantes sont des autorisations manquantes ou des erreurs de plugin.

### La tablette n'est pas détectée par `adb`

1. **Vérifiez le câble USB** : utilisez un câble de données, pas seulement de chargement.
2. **Changez de port USB**.
3. **Révoquez les autorisations de débogage USB** sur la tablette (dans les Options de développeur) et reconnectez l'appareil.
4. **Installez les drivers USB** de votre appareil sur votre ordinateur.

### Problèmes d'images ou de styles (CSS)

1. **Videz le cache** de votre navigateur ou de l'application sur l'appareil.
2. **Vérifiez les chemins** : toutes les ressources dans `public/` doivent être appelées avec un chemin absolu (ex: `/images/logo.png`).
3. **Reconstruisez et resynchronisez** le projet pour vous assurer que les derniers fichiers sont copiés :

    ```bash
    npm run build
    npx cap sync android
    ```

---

## Bon développement ! 🚀
