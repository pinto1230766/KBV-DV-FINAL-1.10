# 🔐 Autorisations Android - KBV Lyon

## Vue d'ensemble

Votre application KBV Lyon nécessite plusieurs autorisations Android pour fonctionner correctement sur votre Samsung Galaxy Tab S10 Ultra. Ce document détaille chaque autorisation, son utilité et comment elle est utilisée dans l'application.

---

## 📋 Liste Complète des Autorisations

### 🌐 Internet et Réseau

#### `INTERNET`
- **Type** : Normale (accordée automatiquement)
- **Utilisation** : Connexion à l'API Google Gemini pour la génération de messages
- **Obligatoire** : Oui
- **Code** :
  ```xml
  <uses-permission android:name="android.permission.INTERNET" />
  ```

#### `ACCESS_NETWORK_STATE`
- **Type** : Normale
- **Utilisation** : Vérifier si l'appareil est connecté à Internet avant d'appeler l'API
- **Obligatoire** : Oui
- **Code** :
  ```xml
  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
  ```

#### `ACCESS_WIFI_STATE`
- **Type** : Normale
- **Utilisation** : Vérifier l'état de la connexion WiFi
- **Obligatoire** : Non
- **Code** :
  ```xml
  <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
  ```

---

### 🔔 Notifications

#### `POST_NOTIFICATIONS` (Android 13+)
- **Type** : Dangereuse (nécessite l'accord de l'utilisateur)
- **Utilisation** : Afficher des notifications pour les rappels de visites
- **Obligatoire** : Oui (pour les notifications)
- **Demandée** : Au premier lancement ou lors de l'activation des notifications
- **Code** :
  ```xml
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
  ```

#### `SCHEDULE_EXACT_ALARM`
- **Type** : Normale (mais nécessite une configuration spéciale sur Android 12+)
- **Utilisation** : Planifier des notifications à des heures précises
- **Obligatoire** : Oui (pour les rappels)
- **Code** :
  ```xml
  <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
  ```

#### `USE_EXACT_ALARM`
- **Type** : Normale
- **Utilisation** : Utiliser des alarmes exactes pour les notifications
- **Obligatoire** : Oui
- **Code** :
  ```xml
  <uses-permission android:name="android.permission.USE_EXACT_ALARM" />
  ```

#### `VIBRATE`
- **Type** : Normale
- **Utilisation** : Faire vibrer l'appareil lors des notifications
- **Obligatoire** : Non
- **Code** :
  ```xml
  <uses-permission android:name="android.permission.VIBRATE" />
  ```

#### `WAKE_LOCK`
- **Type** : Normale
- **Utilisation** : Maintenir l'appareil éveillé pour afficher les notifications
- **Obligatoire** : Oui
- **Code** :
  ```xml
  <uses-permission android:name="android.permission.WAKE_LOCK" />
  ```

#### `RECEIVE_BOOT_COMPLETED`
- **Type** : Normale
- **Utilisation** : Redémarrer les notifications planifiées après le redémarrage de l'appareil
- **Obligatoire** : Oui
- **Code** :
  ```xml
  <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
  ```

---

### 📸 Caméra

#### `CAMERA`
- **Type** : Dangereuse
- **Utilisation** : Prendre des photos (si fonctionnalité activée)
- **Obligatoire** : Non (seulement si vous utilisez la caméra)
- **Demandée** : Lors de la première utilisation de la caméra
- **Code** :
  ```xml
  <uses-permission android:name="android.permission.CAMERA" />
  <uses-feature android:name="android.hardware.camera" android:required="false" />
  <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
  ```

---

### 📁 Stockage et Médias

#### `READ_EXTERNAL_STORAGE` (Android 12 et inférieur)
- **Type** : Dangereuse
- **Utilisation** : Lire les fichiers et images de la galerie
- **Obligatoire** : Non
- **Demandée** : Lors de l'accès à la galerie
- **Code** :
  ```xml
  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" 
                   android:maxSdkVersion="32" />
  ```

#### `WRITE_EXTERNAL_STORAGE` (Android 12 et inférieur)
- **Type** : Dangereuse
- **Utilisation** : Sauvegarder des fichiers sur le stockage externe
- **Obligatoire** : Non
- **Demandée** : Lors de la sauvegarde de fichiers
- **Code** :
  ```xml
  <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" 
                   android:maxSdkVersion="32" />
  ```

#### `READ_MEDIA_IMAGES` (Android 13+)
- **Type** : Dangereuse
- **Utilisation** : Accéder aux images de l'appareil
- **Obligatoire** : Non
- **Demandée** : Lors de l'accès aux images
- **Code** :
  ```xml
  <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
  ```

#### `READ_MEDIA_VIDEO` (Android 13+)
- **Type** : Dangereuse
- **Utilisation** : Accéder aux vidéos de l'appareil
- **Obligatoire** : Non
- **Code** :
  ```xml
  <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
  ```

#### `READ_MEDIA_AUDIO` (Android 13+)
- **Type** : Dangereuse
- **Utilisation** : Accéder aux fichiers audio
- **Obligatoire** : Non
- **Code** :
  ```xml
  <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
  ```

---

### 📍 Géolocalisation

#### `ACCESS_FINE_LOCATION`
- **Type** : Dangereuse
- **Utilisation** : Obtenir la position GPS précise pour les adresses
- **Obligatoire** : Non (seulement si vous utilisez la géolocalisation)
- **Demandée** : Lors de la première utilisation de la géolocalisation
- **Code** :
  ```xml
  <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
  ```

#### `ACCESS_COARSE_LOCATION`
- **Type** : Dangereuse
- **Utilisation** : Obtenir une position approximative (réseau/WiFi)
- **Obligatoire** : Non
- **Demandée** : Lors de la première utilisation de la géolocalisation
- **Code** :
  ```xml
  <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
  ```

#### `ACCESS_BACKGROUND_LOCATION` (Optionnel)
- **Type** : Dangereuse
- **Utilisation** : Accéder à la localisation en arrière-plan
- **Obligatoire** : Non
- **Demandée** : Seulement si nécessaire
- **⚠️ Attention** : Nécessite une justification pour le Google Play Store
- **Code** :
  ```xml
  <!-- Décommentez seulement si nécessaire -->
  <!-- <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" /> -->
  ```

---

### ⚙️ Système

#### `FOREGROUND_SERVICE`
- **Type** : Normale
- **Utilisation** : Exécuter des services en premier plan (notifications persistantes)
- **Obligatoire** : Oui
- **Code** :
  ```xml
  <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
  ```

#### `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`
- **Type** : Normale (mais nécessite une justification)
- **Utilisation** : Demander à ignorer les optimisations de batterie
- **Obligatoire** : Non
- **Code** :
  ```xml
  <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
  ```

---

## 🎯 Autorisations par Fonctionnalité

### Fonctionnalités Essentielles
Ces autorisations sont nécessaires pour le fonctionnement de base :
- ✅ `INTERNET` - API Google Gemini
- ✅ `ACCESS_NETWORK_STATE` - Vérification de connexion
- ✅ `WAKE_LOCK` - Notifications
- ✅ `FOREGROUND_SERVICE` - Services

### Notifications et Rappels
Pour les rappels de visites :
- ✅ `POST_NOTIFICATIONS` (Android 13+)
- ✅ `SCHEDULE_EXACT_ALARM`
- ✅ `USE_EXACT_ALARM`
- ✅ `VIBRATE`
- ✅ `RECEIVE_BOOT_COMPLETED`

### Caméra (Optionnel)
Si vous utilisez la caméra :
- 📸 `CAMERA`
- 📸 `READ_MEDIA_IMAGES` (Android 13+)
- 📸 `READ_EXTERNAL_STORAGE` (Android 12-)

### Géolocalisation (Optionnel)
Si vous utilisez la géolocalisation :
- 📍 `ACCESS_FINE_LOCATION`
- 📍 `ACCESS_COARSE_LOCATION`

---

## 🔒 Gestion des Autorisations

### Autorisations Normales
Ces autorisations sont accordées automatiquement lors de l'installation :
- INTERNET
- ACCESS_NETWORK_STATE
- ACCESS_WIFI_STATE
- VIBRATE
- WAKE_LOCK
- RECEIVE_BOOT_COMPLETED
- SCHEDULE_EXACT_ALARM
- USE_EXACT_ALARM
- FOREGROUND_SERVICE

### Autorisations Dangereuses
Ces autorisations nécessitent l'accord explicite de l'utilisateur :
- POST_NOTIFICATIONS (Android 13+)
- CAMERA
- ACCESS_FINE_LOCATION
- ACCESS_COARSE_LOCATION
- READ_EXTERNAL_STORAGE (Android 12-)
- WRITE_EXTERNAL_STORAGE (Android 12-)
- READ_MEDIA_IMAGES (Android 13+)
- READ_MEDIA_VIDEO (Android 13+)

---

## 📱 Comment l'Utilisateur Accorde les Autorisations

### Lors de l'Installation
Les autorisations normales sont accordées automatiquement.

### Lors de la Première Utilisation
L'application demandera les autorisations dangereuses au moment où elles sont nécessaires :

1. **Notifications** : Popup lors du premier lancement
2. **Caméra** : Popup lors du premier clic sur "Prendre une photo"
3. **Géolocalisation** : Popup lors de la première utilisation de la carte
4. **Stockage** : Popup lors de l'accès à la galerie

### Gestion Manuelle
L'utilisateur peut gérer les autorisations dans :
**Paramètres** > **Applications** > **KBV Lyon** > **Autorisations**

---

## 🛡️ Sécurité et Confidentialité

### Données Collectées
L'application ne collecte aucune donnée personnelle en dehors de l'appareil, sauf :
- Requêtes envoyées à l'API Google Gemini (pour la génération de messages)

### Stockage Local
Toutes les données (visites, orateurs, contacts) sont stockées localement sur l'appareil.

### Pas de Tracking
Aucun service de tracking ou d'analyse n'est utilisé.

---

## ✅ Checklist de Configuration

Avant de déployer sur votre Samsung Galaxy Tab S10 Ultra :

- [ ] Toutes les autorisations sont dans AndroidManifest.xml
- [ ] Les autorisations dangereuses sont demandées au bon moment
- [ ] L'utilisateur peut refuser les autorisations optionnelles
- [ ] L'application fonctionne même sans certaines autorisations
- [ ] Les messages d'erreur sont clairs si une autorisation est refusée

---

## 📞 Support

Si vous rencontrez des problèmes avec les autorisations :

1. **Vérifiez AndroidManifest.xml** : Toutes les autorisations doivent être présentes
2. **Réinstallez l'application** : Désinstallez et réinstallez pour réinitialiser les autorisations
3. **Vérifiez les paramètres** : Paramètres > Applications > KBV Lyon > Autorisations
4. **Consultez les logs** : Utilisez Logcat dans Android Studio pour voir les erreurs

---

## 🔄 Mise à Jour des Autorisations

Si vous ajoutez de nouvelles fonctionnalités nécessitant des autorisations :

1. Ajoutez l'autorisation dans `AndroidManifest.xml`
2. Demandez l'autorisation dans le code au moment approprié
3. Gérez le cas où l'utilisateur refuse
4. Testez sur votre appareil
5. Mettez à jour cette documentation

---

**Dernière mise à jour** : 2025-10-09
**Version de l'application** : 1.0.0
**Version Android minimale** : 22 (Android 5.1)
**Version Android cible** : 34 (Android 14)
