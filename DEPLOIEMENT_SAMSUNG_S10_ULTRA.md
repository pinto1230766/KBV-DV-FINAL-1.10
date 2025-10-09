# Guide de Déploiement - Samsung Galaxy Tab S10 Ultra

## 🚀 Déploiement Rapide

### Étape 1 : Installation des dépendances
```bash
npm install
```

### Étape 2 : Construction de l'application
```bash
npm run build
```

### Étape 3 : Ajout de la plateforme Android
```bash
npx cap add android
```

### Étape 4 : Copie du fichier AndroidManifest.xml
Après l'étape 3, un dossier `android` sera créé. Copiez le contenu du fichier `AndroidManifest.template.xml` dans :
```
android/app/src/main/AndroidManifest.xml
```

**IMPORTANT** : Remplacez tout le contenu du fichier existant par le template fourni.

### Étape 5 : Synchronisation
```bash
npx cap sync android
```

### Étape 6 : Ouverture dans Android Studio
```bash
npx cap open android
```

---

## 📱 Configuration de votre Samsung Galaxy Tab S10 Ultra

### Activation du Mode Développeur
1. Ouvrez **Paramètres** sur votre tablette
2. Allez dans **À propos de la tablette**
3. Appuyez **7 fois** sur **Numéro de build**
4. Un message "Vous êtes maintenant développeur" apparaîtra

### Activation du Débogage USB
1. Retournez dans **Paramètres**
2. Allez dans **Options de développeur** (nouvellement apparu)
3. Activez **Options de développeur** (interrupteur en haut)
4. Activez **Débogage USB**
5. Activez **Installer via USB** (si disponible)

### Connexion USB
1. Connectez votre tablette à votre PC via câble USB
2. Sur la tablette, une popup apparaîtra : **"Autoriser le débogage USB ?"**
3. Cochez **"Toujours autoriser depuis cet ordinateur"**
4. Appuyez sur **OK**

### Vérification de la connexion
Dans votre terminal, exécutez :
```bash
adb devices
```

Vous devriez voir votre appareil listé :
```
List of devices attached
XXXXXXXXXX      device
```

---

## 🔧 Déploiement depuis Android Studio

### Première fois
1. Android Studio devrait détecter automatiquement votre tablette
2. En haut de l'écran, sélectionnez votre appareil dans le menu déroulant
3. Cliquez sur le bouton **Run** (▶️) ou appuyez sur **Shift + F10**
4. L'application sera installée et lancée sur votre tablette

### Déploiements suivants
Utilisez simplement le script npm :
```bash
npm run android
```

Cela va :
1. Construire l'application web
2. Synchroniser avec Android
3. Ouvrir Android Studio
4. Vous pourrez ensuite cliquer sur Run

---

## 🌐 Déploiement sans fil (WiFi)

### Configuration initiale (une seule fois)
1. Connectez d'abord votre tablette via USB
2. Assurez-vous que votre PC et tablette sont sur le même réseau WiFi
3. Exécutez :
   ```bash
   adb tcpip 5555
   ```
4. Débranchez le câble USB
5. Sur votre tablette, allez dans **Paramètres** > **Options de développeur** > **Débogage sans fil**
6. Notez l'adresse IP de votre tablette (ex: 192.168.1.100)
7. Sur votre PC, exécutez :
   ```bash
   adb connect 192.168.1.100:5555
   ```

### Déploiements suivants sans fil
Une fois configuré, vous pouvez déployer sans câble :
1. Assurez-vous que les deux appareils sont sur le même WiFi
2. Exécutez `adb connect [IP_TABLETTE]:5555` si nécessaire
3. Utilisez `npm run android` normalement

---

## 🛠️ Résolution de problèmes spécifiques

### La tablette n'est pas détectée
1. **Vérifiez le câble USB** : Utilisez un câble de données (pas seulement de charge)
2. **Changez de port USB** : Essayez un autre port USB sur votre PC
3. **Réinstallez les drivers** : 
   - Téléchargez Samsung USB Driver for Mobile Phones
   - Installez et redémarrez votre PC
4. **Révoquez les autorisations** :
   - Sur la tablette : **Options de développeur** > **Révoquer les autorisations de débogage USB**
   - Reconnectez et réautorisez

### "adb: device unauthorized"
1. Sur la tablette, allez dans **Options de développeur**
2. Cliquez sur **Révoquer les autorisations de débogage USB**
3. Débranchez et rebranchez le câble
4. Acceptez la nouvelle demande d'autorisation

### L'application se ferme immédiatement
1. Ouvrez **Logcat** dans Android Studio
2. Filtrez par votre package : `com.kbv.lyon`
3. Recherchez les erreurs en rouge
4. Les erreurs courantes :
   - **Permission denied** : Vérifiez AndroidManifest.xml
   - **ClassNotFoundException** : Exécutez `npx cap sync android`
   - **Network error** : Vérifiez votre connexion Internet

### Les autorisations ne sont pas demandées
1. Désinstallez l'application de la tablette
2. Nettoyez le projet :
   ```bash
   cd android
   ./gradlew clean
   cd ..
   ```
3. Resynchronisez :
   ```bash
   npx cap sync android
   ```
4. Réinstallez l'application

### Erreur "Manifest merger failed"
1. Ouvrez `android/app/src/main/AndroidManifest.xml`
2. Vérifiez qu'il n'y a pas de doublons d'autorisations
3. Assurez-vous que toutes les balises XML sont correctement fermées

---

## 📋 Checklist avant déploiement

- [ ] Node.js et npm installés
- [ ] Android Studio installé avec SDK Android
- [ ] Variables d'environnement configurées (ANDROID_HOME)
- [ ] Mode développeur activé sur la tablette
- [ ] Débogage USB activé
- [ ] Tablette connectée et autorisée
- [ ] `adb devices` montre votre appareil
- [ ] Dépendances npm installées
- [ ] Application web construite (`npm run build`)
- [ ] Plateforme Android ajoutée (`npx cap add android`)
- [ ] AndroidManifest.xml configuré avec toutes les autorisations
- [ ] Synchronisation effectuée (`npx cap sync android`)

---

## 🎯 Commandes utiles

```bash
# Vérifier les appareils connectés
adb devices

# Voir les logs en temps réel
adb logcat

# Installer un APK manuellement
adb install chemin/vers/app.apk

# Désinstaller l'application
adb uninstall com.kbv.lyon

# Redémarrer le serveur ADB
adb kill-server
adb start-server

# Capturer une capture d'écran
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png

# Ouvrir un shell sur l'appareil
adb shell

# Vérifier les autorisations de l'application
adb shell dumpsys package com.kbv.lyon | grep permission
```

---

## 📦 Construction d'un APK pour distribution

### APK Debug (pour tests)
```bash
cd android
./gradlew assembleDebug
```
L'APK sera dans : `android/app/build/outputs/apk/debug/app-debug.apk`

### APK Release (pour production)
1. Créez un keystore :
   ```bash
   keytool -genkey -v -keystore kbv-lyon.keystore -alias kbv-lyon -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Configurez `android/app/build.gradle` :
   ```gradle
   android {
       signingConfigs {
           release {
               storeFile file('kbv-lyon.keystore')
               storePassword 'votre_mot_de_passe'
               keyAlias 'kbv-lyon'
               keyPassword 'votre_mot_de_passe'
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
           }
       }
   }
   ```

3. Construisez l'APK :
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

L'APK sera dans : `android/app/build/outputs/apk/release/app-release.apk`

---

## 🔐 Autorisations configurées

Votre application demande les autorisations suivantes :

### Autorisations dangereuses (nécessitent l'accord de l'utilisateur)
- ✅ **CAMERA** - Accès à l'appareil photo
- ✅ **ACCESS_FINE_LOCATION** - Localisation précise
- ✅ **ACCESS_COARSE_LOCATION** - Localisation approximative
- ✅ **POST_NOTIFICATIONS** - Afficher des notifications (Android 13+)
- ✅ **READ_MEDIA_IMAGES** - Lire les images (Android 13+)
- ✅ **READ_EXTERNAL_STORAGE** - Lire le stockage (Android 12-)
- ✅ **WRITE_EXTERNAL_STORAGE** - Écrire sur le stockage (Android 12-)

### Autorisations normales (accordées automatiquement)
- ✅ **INTERNET** - Connexion Internet
- ✅ **ACCESS_NETWORK_STATE** - État du réseau
- ✅ **ACCESS_WIFI_STATE** - État du WiFi
- ✅ **VIBRATE** - Vibration
- ✅ **WAKE_LOCK** - Maintenir l'appareil éveillé
- ✅ **RECEIVE_BOOT_COMPLETED** - Redémarrage système
- ✅ **SCHEDULE_EXACT_ALARM** - Alarmes précises
- ✅ **FOREGROUND_SERVICE** - Services en premier plan

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Consultez les logs dans Android Studio (Logcat)
2. Vérifiez que toutes les autorisations sont dans AndroidManifest.xml
3. Assurez-vous que la tablette est bien en mode développeur
4. Essayez de nettoyer et reconstruire le projet

**Bonne chance avec votre déploiement ! 🚀**
