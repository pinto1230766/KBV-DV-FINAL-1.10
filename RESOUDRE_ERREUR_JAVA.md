# 🔧 Résoudre l'Erreur Java - "Unsupported class file major version 69"

**Date** : 2025-10-09 11:40  
**Erreur** : `Unsupported class file major version 69`

---

## 🔍 Cause du Problème

Cette erreur signifie que :
- Votre projet nécessite **Java 21** (class file version 65) ou supérieur
- Votre système utilise une version plus ancienne de Java
- Android Studio/Gradle ne peut pas compiler avec cette version

---

## ✅ Solution : Installer Java 21 (JDK 21)

### Option 1 : Via Android Studio (Recommandé)

1. **Ouvrez Android Studio**
2. Allez dans **File** > **Settings** (ou **Ctrl + Alt + S**)
3. Allez dans **Build, Execution, Deployment** > **Build Tools** > **Gradle**
4. Dans **Gradle JDK**, sélectionnez ou téléchargez **JDK 21**
5. Si JDK 21 n'est pas disponible, cliquez sur **Download JDK...**
6. Sélectionnez **Eclipse Temurin 21** ou **Oracle OpenJDK 21**
7. Cliquez sur **Download** puis **OK**

### Option 2 : Installation Manuelle

#### Via Winget (Windows)

```bash
# Installer OpenJDK 21
winget install Microsoft.OpenJDK.21

# Ou installer Eclipse Temurin 21
winget install EclipseAdoptium.Temurin.21.JDK
```

#### Via Téléchargement Direct

1. **Eclipse Temurin 21** (Recommandé)
   - Allez sur : <https://adoptium.net/temurin/releases/>
   - Version : **21 (LTS)**
   - OS : **Windows**
   - Architecture : **x64**
   - Package Type : **JDK**
   - Téléchargez et installez

2. **Oracle OpenJDK 21**
   - Allez sur : <https://jdk.java.net/21/>
   - Téléchargez Windows/x64
   - Extrayez dans `C:\Program Files\Java\jdk-21`

---

## 🔧 Configuration des Variables d'Environnement

### Méthode Automatique (PowerShell)

Créez un fichier `configure-java.ps1` :

```powershell
# Définir JAVA_HOME
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-21.0.5.11-hotspot", "Machine")

# Ajouter au PATH
$path = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
$javaPath = "C:\Program Files\Eclipse Adoptium\jdk-21.0.5.11-hotspot\bin"
if ($path -notlike "*$javaPath*") {
    [System.Environment]::SetEnvironmentVariable("Path", "$path;$javaPath", "Machine")
}

Write-Host "Java 21 configuré avec succès!"
```

Exécutez en tant qu'administrateur :

```powershell
powershell -ExecutionPolicy Bypass -File configure-java.ps1
```

### Méthode Manuelle

1. **Ouvrez les Variables d'environnement**
   - Appuyez sur **Windows + Pause**
   - Cliquez sur **Paramètres système avancés**
   - Cliquez sur **Variables d'environnement**

2. **Créer JAVA_HOME**
   - Dans **Variables système**, cliquez sur **Nouvelle**
   - Nom : `JAVA_HOME`
   - Valeur : `C:\Program Files\Eclipse Adoptium\jdk-21.0.5.11-hotspot`
   - (Ajustez le chemin selon votre installation)

3. **Modifier PATH**
   - Sélectionnez **Path** dans **Variables système**
   - Cliquez sur **Modifier**
   - Cliquez sur **Nouveau**
   - Ajoutez : `%JAVA_HOME%\bin`
   - Cliquez sur **OK**

4. **Redémarrez** votre terminal ou votre PC

---

## ✅ Vérification

### Vérifier la version Java

```bash
java -version
```

Vous devriez voir :

```text
openjdk version "21.0.x" 2024-xx-xx
OpenJDK Runtime Environment Temurin-21+xx (build 21.0.x+xx)
OpenJDK 64-Bit Server VM Temurin-21+xx (build 21.0.x+xx, mixed mode, sharing)
```

### Vérifier JAVA_HOME

```bash
echo %JAVA_HOME%
```

Devrait afficher : `C:\Program Files\Eclipse Adoptium\jdk-21.0.5.11-hotspot`

---

## 🔧 Configuration Gradle (Si nécessaire)

### Dans gradle.properties

Créez ou modifiez `android/gradle.properties` :

```properties
# Java Version
org.gradle.java.home=C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.5.11-hotspot

# Gradle JVM
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
```

### Dans build.gradle

Vérifiez `android/app/build.gradle` :

```gradle
android {
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = '17'
    }
}
```

---

## 🔄 Après Installation

### 1. Nettoyer le Projet

```bash
cd android
gradlew clean
cd ..
```

### 2. Resynchroniser Capacitor

```bash
npx cap sync android
```

### 3. Ouvrir Android Studio

```bash
npx cap open android
```

### 4. Dans Android Studio

1. **File** > **Invalidate Caches / Restart**
2. Cliquez sur **Invalidate and Restart**
3. Attendez que Gradle se synchronise
4. Essayez de compiler

---

## ⚠️ Problèmes Courants

### Erreur : "JAVA_HOME is not set"

```bash
# Windows CMD
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.5.11-hotspot

# PowerShell
$env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-21.0.5.11-hotspot"
```

### Erreur : "Could not find or load main class"

- Vérifiez que `%JAVA_HOME%\bin` est dans le PATH
- Redémarrez votre terminal

### Gradle utilise toujours l'ancienne version

Dans Android Studio :
1. **File** > **Settings**
2. **Build, Execution, Deployment** > **Build Tools** > **Gradle**
3. **Gradle JDK** : Sélectionnez **JDK 21**
4. Cliquez sur **OK**
5. **File** > **Sync Project with Gradle Files**

---

## 📋 Versions Java et Class File

| Java Version | Class File Version | Major Version |
|--------------|-------------------|---------------|
| Java 8 | 52 | 52 |
| Java 11 | 55 | 55 |
| Java 17 | 61 | 61 |
| Java 21 | 65 | 65 |
| Java 25 | 69 | 69 |

**Votre erreur** : Version 69 = Java 25 (non nécessaire)
**Version requise** : Java 21 (version 65) minimum

---

## 🎯 Résumé des Étapes

1. ✅ Installer Java 21 (JDK 21)
2. ✅ Configurer JAVA_HOME
3. ✅ Ajouter Java au PATH
4. ✅ Redémarrer le terminal
5. ✅ Vérifier avec `java -version`
6. ✅ Configurer Android Studio pour utiliser JDK 21
7. ✅ Nettoyer et resynchroniser le projet
8. ✅ Recompiler

---

## 🚀 Après Résolution

Une fois Java 21 installé et configuré :

```bash
# Nettoyer
cd android
gradlew clean
cd ..

# Resynchroniser
npx cap sync android

# Ouvrir Android Studio
npx cap open android
```

---

## 📞 Commandes de Diagnostic

```bash
# Version Java
java -version

# Version Javac
javac -version

# JAVA_HOME
echo %JAVA_HOME%

# PATH
echo %PATH%

# Gradle version
cd android
gradlew --version
cd ..
```

---

## ✅ Checklist

- [ ] Java 21 installé
- [ ] JAVA_HOME configuré
- [ ] PATH mis à jour
- [ ] Terminal redémarré
- [ ] `java -version` affiche Java 21
- [ ] Android Studio configuré avec JDK 21
- [ ] Projet nettoyé
- [ ] Gradle synchronisé
- [ ] Compilation réussie

---

**Bon courage ! 🚀**

---

*Guide créé : 2025-10-09 11:40*  
*Erreur : Unsupported class file major version 69*  
*Solution : Installer Java 21*
