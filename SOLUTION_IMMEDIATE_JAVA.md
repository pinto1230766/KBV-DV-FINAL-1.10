# ⚡ Solution Immédiate - Erreur Java

**Erreur** : `Unsupported class file major version 69`  
**Cause** : Gradle utilise une mauvaise version de Java

---

## ✅ Solution Rapide dans Android Studio

### Étape 1 : Ouvrir les Paramètres

1. Dans Android Studio, allez dans **File** > **Settings**
2. Ou appuyez sur **Ctrl + Alt + S**

### Étape 2 : Configurer Gradle JDK

1. Allez dans **Build, Execution, Deployment** > **Build Tools** > **Gradle**
2. Trouvez **Gradle JDK**
3. Sélectionnez **JDK 17** ou **JDK 21** dans la liste déroulante
4. Si aucun JDK n'est disponible, cliquez sur **Download JDK...**

### Étape 3 : Télécharger JDK (si nécessaire)

1. Cliquez sur **Download JDK...**
2. Sélectionnez :
   - **Vendor** : Eclipse Temurin
   - **Version** : 21
3. Cliquez sur **Download**
4. Attendez la fin du téléchargement
5. Cliquez sur **OK**

### Étape 4 : Synchroniser

1. Cliquez sur **File** > **Sync Project with Gradle Files**
2. Ou cliquez sur l'icône 🔄 dans la barre d'outils

### Étape 5 : Nettoyer et Rebuild

1. **Build** > **Clean Project**
2. Attendez la fin
3. **Build** > **Rebuild Project**

---

## 🔄 Solution Alternative : Via gradle.properties

Si Android Studio ne fonctionne pas, modifiez le fichier :

**Fichier** : `android/gradle.properties`

Ajoutez cette ligne :

```properties
org.gradle.java.home=C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.5.11-hotspot
```

(Ajustez le chemin selon votre installation Java)

---

## 📋 Vérification

### Dans Android Studio

1. **File** > **Settings** > **Build Tools** > **Gradle**
2. Vérifiez que **Gradle JDK** affiche **JDK 17** ou **JDK 21**

### Dans le Terminal

```bash
# Vérifier la version Java utilisée par Gradle
cd android
gradlew --version
```

Devrait afficher :

```text
JVM:          21.0.x (Eclipse Adoptium 21.0.x+xx)
```

---

## ⚠️ Si l'Erreur Persiste

### Option 1 : Invalider les Caches

1. **File** > **Invalidate Caches / Restart**
2. Cochez **Invalidate and Restart**
3. Attendez le redémarrage

### Option 2 : Supprimer les Caches Gradle

```bash
# Supprimer le cache Gradle
rmdir /s /q %USERPROFILE%\.gradle\caches

# Nettoyer le projet
cd android
gradlew clean
cd ..

# Resynchroniser
npx cap sync android
```

### Option 3 : Réinstaller le Projet Android

```bash
# Supprimer le dossier android
rmdir /s /q android

# Réajouter la plateforme
npx cap add android

# Copier AndroidManifest.xml
copy AndroidManifest.template.xml android\app\src\main\AndroidManifest.xml

# Synchroniser
npx cap sync android

# Ouvrir Android Studio
npx cap open android
```

---

## 🎯 Résumé des Étapes

1. ✅ Ouvrir Android Studio
2. ✅ **File** > **Settings** > **Gradle**
3. ✅ Sélectionner **JDK 17** ou **JDK 21**
4. ✅ Télécharger si nécessaire
5. ✅ **File** > **Sync Project with Gradle Files**
6. ✅ **Build** > **Clean Project**
7. ✅ **Build** > **Rebuild Project**
8. ✅ Essayer de compiler

---

## 📞 Commandes Utiles

```bash
# Vérifier Java
java -version

# Vérifier Gradle
cd android
gradlew --version

# Nettoyer
gradlew clean

# Lister les JDK disponibles dans Gradle
gradlew -q javaToolchains
```

---

## ✅ Checklist

- [ ] Android Studio ouvert
- [ ] Settings > Gradle > JDK configuré
- [ ] JDK 17 ou 21 sélectionné
- [ ] Projet synchronisé
- [ ] Projet nettoyé
- [ ] Compilation réussie

---

**Suivez ces étapes et l'erreur sera résolue ! 🚀**

---

## 📋 Informations de la Solution

- **Solution créée** : 2025-10-09 11:43
- **Erreur** : Unsupported class file major version 69
- **Solution** : Configurer JDK 17 ou 21 dans Android Studio
