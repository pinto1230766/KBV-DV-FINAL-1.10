# ⬇️ Télécharger et Installer Java 21

**Date** : 2025-10-09 11:44  
**Objectif** : Installer Java 21 pour résoudre l'erreur Gradle

---

## ⚡ Solution la Plus Simple : Via Android Studio

**C'est la méthode recommandée - Android Studio téléchargera Java pour vous !**

### Étapes

1. **Ouvrez Android Studio**
2. **File** > **Settings** (Ctrl + Alt + S)
3. **Build, Execution, Deployment** > **Build Tools** > **Gradle**
4. **Gradle JDK** : Cliquez sur la liste déroulante
5. Cliquez sur **"Download JDK..."**
6. Sélectionnez :
   - **Version** : 21
   - **Vendor** : Eclipse Temurin (AdoptOpenJDK)
7. Cliquez sur **Download**
8. Attendez la fin du téléchargement (quelques minutes)
9. Cliquez sur **OK**
10. **File** > **Sync Project with Gradle Files**

**C'est tout ! Android Studio gère tout automatiquement.**

---

## 📥 Méthode Alternative : Téléchargement Manuel

Si vous préférez télécharger manuellement :

### Option 1 : Eclipse Temurin (Recommandé)

**Lien direct** : <https://adoptium.net/temurin/releases/>

1. Allez sur le site
2. Sélectionnez :
   - **Version** : 21 (LTS)
   - **Operating System** : Windows
   - **Architecture** : x64
   - **Package Type** : JDK
   - **Image Type** : JDK
3. Cliquez sur le bouton **.msi** pour télécharger
4. Exécutez le fichier téléchargé
5. Suivez l'assistant d'installation
6. Cochez **"Set JAVA_HOME variable"**
7. Cochez **"Add to PATH"**
8. Cliquez sur **Install**

### Option 2 : Oracle OpenJDK

**Lien direct** : <https://jdk.java.net/21/>

1. Allez sur le site
2. Téléchargez **Windows / x64** (fichier .zip)
3. Extrayez le fichier dans `C:\Program Files\Java\jdk-21`
4. Configurez les variables d'environnement (voir ci-dessous)

---

## 🔧 Configuration des Variables d'Environnement

### Si vous avez installé avec le .msi

**Rien à faire !** L'installeur configure tout automatiquement.

### Si vous avez extrait le .zip

#### Via l'Interface Windows

1. **Windows + Pause** (ou Clic droit sur "Ce PC" > Propriétés)
2. **Paramètres système avancés**
3. **Variables d'environnement**
4. Dans **Variables système**, cliquez sur **Nouvelle**
   - **Nom** : `JAVA_HOME`
   - **Valeur** : `C:\Program Files\Java\jdk-21` (ajustez selon votre chemin)
5. Sélectionnez **Path**, cliquez sur **Modifier**
6. Cliquez sur **Nouveau**
7. Ajoutez : `%JAVA_HOME%\bin`
8. Cliquez sur **OK** partout
9. **Redémarrez** votre terminal

#### Via PowerShell (Admin)

```powershell
# Définir JAVA_HOME
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-21.0.5.11-hotspot", "Machine")

# Ajouter au PATH
$path = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
$javaPath = "$env:JAVA_HOME\bin"
[System.Environment]::SetEnvironmentVariable("Path", "$path;$javaPath", "Machine")

Write-Host "Java 21 configuré !"
```

---

## ✅ Vérification

### Ouvrez un NOUVEAU terminal PowerShell

```powershell
# Vérifier Java
java -version
```

**Résultat attendu** :

```text
openjdk version "21.0.5" 2024-10-15
OpenJDK Runtime Environment Temurin-21.0.5+11 (build 21.0.5+11)
OpenJDK 64-Bit Server VM Temurin-21.0.5+11 (build 21.0.5+11, mixed mode, sharing)
```

### Vérifier JAVA_HOME

```powershell
echo $env:JAVA_HOME
```

**Résultat attendu** :

```text
C:\Program Files\Eclipse Adoptium\jdk-21.0.5.11-hotspot
```

---

## 🔄 Après Installation

### 1. Redémarrer Android Studio

Fermez complètement Android Studio et rouvrez-le.

### 2. Configurer Gradle JDK

1. **File** > **Settings** > **Gradle**
2. **Gradle JDK** : Sélectionnez le JDK 21 nouvellement installé
3. Cliquez sur **OK**

### 3. Synchroniser le Projet

```text
File > Sync Project with Gradle Files
```

### 4. Nettoyer et Rebuild

```text
Build > Clean Project
Build > Rebuild Project
```

### 5. Essayer de Compiler

Cliquez sur **Run** (▶️) ou **Build** > **Make Project**

---

## 📋 Liens de Téléchargement Direct

### Eclipse Temurin 21 (Recommandé)

**Windows x64 MSI** :
<https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.5%2B11/OpenJDK21U-jdk_x64_windows_hotspot_21.0.5_11.msi>

**Taille** : ~180 MB

### Oracle OpenJDK 21

**Windows x64 ZIP** :
<https://download.java.net/java/GA/jdk21/fd2272bbf8e04c3dbaee13770090416c/35/GPL/openjdk-21_windows-x64_bin.zip>

**Taille** : ~190 MB

---

## ⚠️ Problèmes Courants

### "Java n'est pas reconnu"

- Redémarrez votre terminal
- Vérifiez que `%JAVA_HOME%\bin` est dans le PATH
- Redémarrez votre PC si nécessaire

### "JAVA_HOME is not set"

- Vérifiez que la variable JAVA_HOME existe
- Redémarrez votre terminal
- Utilisez un NOUVEAU terminal (pas celui qui était déjà ouvert)

### Android Studio ne voit pas le JDK

1. **File** > **Invalidate Caches / Restart**
2. Redémarrez Android Studio
3. **File** > **Settings** > **Gradle**
4. Cliquez sur le **+** à côté de "Gradle JDK"
5. Naviguez vers `C:\Program Files\Eclipse Adoptium\jdk-21.0.5.11-hotspot`

---

## 🎯 Résumé

### Méthode Recommandée

1. ✅ Ouvrir Android Studio
2. ✅ File > Settings > Gradle
3. ✅ Download JDK... > Version 21 > Eclipse Temurin
4. ✅ Télécharger et installer
5. ✅ Sync Project

### Méthode Manuelle

1. ✅ Télécharger Eclipse Temurin 21 MSI
2. ✅ Installer (cocher "Set JAVA_HOME" et "Add to PATH")
3. ✅ Redémarrer le terminal
4. ✅ Vérifier avec `java -version`
5. ✅ Configurer dans Android Studio
6. ✅ Sync et Rebuild

---

## 📞 Besoin d'Aide ?

Si vous avez des problèmes :

1. Vérifiez que vous utilisez un **NOUVEAU** terminal
2. Redémarrez Android Studio
3. Vérifiez `java -version` dans le terminal
4. Vérifiez que JAVA_HOME est défini : `echo $env:JAVA_HOME`

---

**La méthode la plus simple est via Android Studio - laissez-le télécharger Java pour vous ! 🚀**

---

## 📝 Informations du Guide

- **Guide créé** : 2025-10-09 11:44
- **Objectif** : Installer Java 21
- **Méthode recommandée** : Via Android Studio
