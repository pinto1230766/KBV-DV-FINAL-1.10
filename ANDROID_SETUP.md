# Configuration Android pour KBV Lyon

## Autorisations Android nécessaires

Votre application KBV Lyon utilise les fonctionnalités suivantes qui nécessitent des autorisations Android spécifiques :

### 1. **Notifications Locales** (@capacitor/local-notifications)
- `POST_NOTIFICATIONS` - Pour afficher des notifications (Android 13+)
- `SCHEDULE_EXACT_ALARM` - Pour planifier des notifications précises
- `USE_EXACT_ALARM` - Pour utiliser des alarmes exactes

### 2. **Caméra** (@capacitor/camera)
- `CAMERA` - Pour accéder à l'appareil photo
- `READ_EXTERNAL_STORAGE` - Pour lire les photos de la galerie (Android 12 et inférieur)
- `WRITE_EXTERNAL_STORAGE` - Pour sauvegarder les photos (Android 12 et inférieur)
- `READ_MEDIA_IMAGES` - Pour lire les images (Android 13+)

### 3. **Géolocalisation** (@capacitor/geolocation)
- `ACCESS_FINE_LOCATION` - Pour la localisation précise
- `ACCESS_COARSE_LOCATION` - Pour la localisation approximative
- `ACCESS_BACKGROUND_LOCATION` - Pour la localisation en arrière-plan (si nécessaire)

### 4. **Système de fichiers** (@capacitor/filesystem)
- `READ_EXTERNAL_STORAGE` - Pour lire les fichiers
- `WRITE_EXTERNAL_STORAGE` - Pour écrire les fichiers

### 5. **Internet et Réseau**
- `INTERNET` - Pour les appels API (Google Gemini)
- `ACCESS_NETWORK_STATE` - Pour vérifier l'état de la connexion
- `ACCESS_WIFI_STATE` - Pour vérifier l'état du WiFi

### 6. **Autres autorisations système**
- `VIBRATE` - Pour les vibrations lors des notifications
- `WAKE_LOCK` - Pour maintenir l'appareil éveillé si nécessaire
- `RECEIVE_BOOT_COMPLETED` - Pour redémarrer les notifications après le redémarrage

## Étapes d'installation

### 1. Installer les dépendances
```bash
npm install
```

### 2. Construire l'application web
```bash
npm run build
```

### 3. Ajouter la plateforme Android
```bash
npx cap add android
```

### 4. Synchroniser les fichiers
```bash
npx cap sync android
```

### 5. Configurer AndroidManifest.xml

Après avoir exécuté `npx cap add android`, le fichier AndroidManifest.xml sera créé dans :
`android/app/src/main/AndroidManifest.xml`

Ajoutez les autorisations suivantes dans ce fichier (entre les balises `<manifest>` et `<application>`) :

```xml
<!-- Autorisations Internet et Réseau -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />

<!-- Autorisations Notifications -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.USE_EXACT_ALARM" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

<!-- Autorisations Caméra -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
<uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />

<!-- Autorisations Stockage (Android 12 et inférieur) -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32" />

<!-- Autorisations Média (Android 13+) -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />

<!-- Autorisations Géolocalisation -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<!-- Décommentez si vous avez besoin de la localisation en arrière-plan -->
<!-- <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" /> -->

<!-- Autorisations système -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
```

### 6. Configurer build.gradle

Dans `android/app/build.gradle`, assurez-vous que les versions suivantes sont configurées :

```gradle
android {
    compileSdkVersion 34
    defaultConfig {
        applicationId "com.kbv.lyon"
        minSdkVersion 22
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
}
```

### 7. Ouvrir le projet dans Android Studio
```bash
npx cap open android
```

### 8. Tester sur votre Samsung Galaxy Tab S10 Ultra

#### Option A : Via USB
1. Activez le mode développeur sur votre tablette :
   - Allez dans **Paramètres** > **À propos de la tablette**
   - Appuyez 7 fois sur **Numéro de build**
2. Activez le **Débogage USB** dans **Options de développeur**
3. Connectez votre tablette via USB
4. Dans Android Studio, cliquez sur **Run** (▶️)

#### Option B : Via WiFi (ADB sans fil)
1. Assurez-vous que votre PC et votre tablette sont sur le même réseau WiFi
2. Sur la tablette, activez **Débogage sans fil** dans **Options de développeur**
3. Notez l'adresse IP et le port affichés
4. Sur votre PC, exécutez :
   ```bash
   adb connect [IP_TABLETTE]:[PORT]
   ```
5. Dans Android Studio, sélectionnez votre appareil et cliquez sur **Run**

## Scripts npm disponibles

```bash
# Développement web
npm run dev

# Construction de l'application
npm run build

# Construction et synchronisation Android
npm run android:build

# Ouvrir Android Studio
npm run android:open

# Construction complète + sync + ouverture Android Studio
npm run android
```

## Résolution des problèmes courants

### Erreur : "SDK location not found"
Définissez la variable d'environnement `ANDROID_HOME` pointant vers votre SDK Android.

### Erreur : "Execution failed for task ':app:processDebugManifest'"
Vérifiez que toutes les autorisations dans AndroidManifest.xml sont correctement formatées.

### L'application se ferme au démarrage
Vérifiez les logs dans Android Studio (Logcat) pour identifier l'erreur spécifique.

### Les notifications ne fonctionnent pas
1. Vérifiez que l'autorisation POST_NOTIFICATIONS est accordée
2. Sur Android 13+, l'utilisateur doit accepter manuellement les notifications

### La caméra ne s'ouvre pas
1. Vérifiez que l'autorisation CAMERA est accordée
2. Testez sur un appareil physique (l'émulateur peut ne pas avoir de caméra)

## Configuration pour la production

Avant de publier sur le Google Play Store :

1. **Créez un keystore** pour signer l'application
2. **Configurez le fichier build.gradle** avec vos informations de signature
3. **Mettez à jour les icônes** dans `android/app/src/main/res/`
4. **Testez en mode release** : `./gradlew assembleRelease`
5. **Créez un fichier AAB** pour le Play Store : `./gradlew bundleRelease`

## Support

Pour plus d'informations sur Capacitor et Android :
- [Documentation Capacitor](https://capacitorjs.com/docs)
- [Documentation Android](https://developer.android.com/guide)
- [Capacitor Android Configuration](https://capacitorjs.com/docs/android/configuration)
