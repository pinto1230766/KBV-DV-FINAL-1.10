# Documentation Complète du Projet KBV Lyon - Gestion des Orateurs Visiteurs

## 1. ARCHITECTURE GÉNÉRALE

### 1.1 Stack Technique

- **Frontend**: React 18 + TypeScript
- **Build**: Vite
- **Mobile**: Capacitor (Android/iOS)
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Storage**: IndexedDB (via idb)
- **Encryption**: Web Crypto API
- **AI**: Google Gemini API
- **Notifications**: Capacitor Local Notifications

### 1.2 Structure des Dossiers

```
KBV-DV-FINAL-1.10/
├── components/          # Composants React
├── contexts/           # Contexts React (State global)
├── hooks/              # Custom hooks
├── utils/              # Fonctions utilitaires
├── data/               # Données statiques
├── android/            # Projet Android natif
├── public/             # Assets statiques
└── types.ts            # Définitions TypeScript
```

## 2. TYPES DE DONNÉES (types.ts)

### 2.1 Types Principaux

```typescript
// Orateur
interface Speaker {
  id: string;
  nom: string;
  congregation: string;
  telephone?: string;
  email?: string;
  photoUrl?: string;
  gender: 'male' | 'female';
  talkHistory: TalkHistory[];
  notes?: string;
  tags?: string[];
  isVehiculed?: boolean;
}

// Visite
interface Visit {
  id: string;                    // ID de l'orateur
  visitId: string;               // ID unique de la visite
  nom: string;
  congregation: string;
  telephone?: string;
  photoUrl?: string;
  visitDate: string;             // Format: YYYY-MM-DD
  visitTime: string;             // Format: HH:MM
  host: string;                  // Nom du contact d'accueil
  accommodation: string;
  meals: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  locationType: 'physical' | 'zoom' | 'streaming';
  talkNoOrType: string | null;
  talkTheme: string | null;
  communicationStatus?: CommunicationStatus;
  notes?: string;
  attachments?: Attachment[];
  expenses?: Expense[];
  checklist?: ChecklistItem[];
  feedback?: Feedback;
}

// Contact d'accueil
interface Host {
  nom: string;
  telephone?: string;
  email?: string;
  address?: string;
  gender: 'male' | 'female' | 'couple';
  notes?: string;
  tags?: string[];
  unavailabilities?: string[];  // Dates au format YYYY-MM-DD
  photoUrl?: string;
}

// Statut de communication
interface CommunicationStatus {
  [messageType: string]: {
    [role: string]: string;      // Date ISO de l'envoi
  };
}

// Discours public
interface PublicTalk {
  number: number | string;
  theme: string;
}

// Date spéciale
interface SpecialDate {
  id: string;
  date: string;                  // Format: YYYY-MM-DD
  name: string;
  type: 'co_visit' | 'assembly' | 'special_talk' | 'memorial' | 'convention' | 'other';
  description?: string;
}

// Message d'orateur
interface SpeakerMessage {
  id: string;
  speakerId: string;
  speakerName: string;
  speakerPhone: string;
  receivedAt: string;            // Date ISO
  read: boolean;
  notificationSent: boolean;
}
```

### 2.2 Types de Messages

```typescript
type MessageType = 'confirmation' | 'preparation' | 'reminder-7' | 'reminder-2' | 'thanks';
type MessageRole = 'speaker' | 'host';
type Language = 'fr' | 'cv' | 'en' | 'es';
```

## 3. CONTEXTES (State Management)

### 3.1 DataContext

**Fichier**: `contexts/DataContext.tsx`

**État Global**:

```typescript
interface AppData {
  speakers: Speaker[];
  visits: Visit[];
  hosts: Host[];
  archivedVisits: Visit[];
  customTemplates: CustomMessageTemplates;
  customHostRequestTemplates: CustomHostRequestTemplates;
  congregationProfile: CongregationProfile;
  publicTalks: PublicTalk[];
  savedViews: SavedView[];
  specialDates: SpecialDate[];
  speakerMessages: SpeakerMessage[];
}
```

**Fonctions Principales**:

- `addSpeaker(speaker)` - Ajouter un orateur
- `updateSpeaker(speaker)` - Modifier un orateur
- `deleteSpeaker(speakerId)` - Supprimer un orateur
- `addVisit(visit)` - Programmer une visite
- `updateVisit(visit)` - Modifier une visite
- `deleteVisit(visitId)` - Supprimer une visite
- `completeVisit(visit)` - Archiver une visite terminée
- `addHost(host)` - Ajouter un contact d'accueil
- `updateHost(hostName, data)` - Modifier un contact
- `deleteHost(hostName)` - Supprimer un contact
- `logCommunication(visitId, type, role)` - Enregistrer un envoi de message
- `saveCustomTemplate(lang, type, role, text)` - Sauvegarder un modèle personnalisé
- `exportData()` - Exporter toutes les données en JSON
- `importData(data)` - Importer des données avec fusion intelligente
- `resetData()` - Réinitialiser toutes les données
- `enableEncryption(password)` - Activer le chiffrement
- `disableEncryption(password)` - Désactiver le chiffrement
- `syncWithGoogleSheet()` - Synchroniser avec Google Sheets

**Stockage**:

- IndexedDB pour les données non chiffrées
- IndexedDB pour les données chiffrées (avec mot de passe)
- Migration automatique depuis localStorage

### 3.2 SettingsContext

**Fichier**: `contexts/SettingsContext.tsx`

**Paramètres**:

```typescript
interface Settings {
  theme: 'light' | 'dark' | 'auto';
  language: Language;
  notifications: {
    enabled: boolean;
    reminderDays: number[];
  };
  aiSettings: {
    enabled: boolean;
    model: string;
    temperature: number;
  };
}
```

### 3.3 ToastContext

**Fichier**: `contexts/ToastContext.tsx`

**Fonction**: Afficher des notifications toast

- `addToast(message, type, duration)` - Afficher un toast

### 3.4 ConfirmContext

**Fichier**: `contexts/ConfirmContext.tsx`

**Fonction**: Afficher des dialogues de confirmation

- `confirm(message)` - Retourne une Promise<boolean>

## 4. COMPOSANTS PRINCIPAUX

### 4.1 App.tsx

**Composant racine** qui gère:

- Navigation entre onglets
- Modales globales
- Raccourcis clavier
- État de l'application

**Onglets**:

1. Dashboard - Vue d'ensemble
2. Planning - Gestion des visites
3. Messaging - Centre de messagerie
4. Talks - Gestion des discours
5. Statistics - Statistiques
6. Settings - Paramètres

### 4.2 Dashboard

**Fichier**: `components/Dashboard.tsx`

**Fonctionnalités**:

- Statistiques en temps réel
- Prochaines visites (7 jours)
- Visites nécessitant une action
- Graphiques (barres et donut)
- Accès rapide aux actions

### 4.3 UpcomingVisits

**Fichier**: `components/UpcomingVisits.tsx`

**Modes d'affichage**:

- Cartes (cards)
- Liste (list)
- Semaine (week)
- Calendrier (calendar)
- Chronologie (timeline)

**Actions par visite**:

- Modifier
- Supprimer
- Marquer comme terminée
- Générer un message
- Voir les détails

### 4.4 MessagingCenter

**Fichier**: `components/MessagingCenter.tsx`

**Deux vues**:

1. **Visites & Accueil**: Gestion des communications par visite
2. **Messages Orateurs**: Messages reçus des orateurs

**Étapes de communication**:

- Confirmation & Besoins (orateur)
- Détails de préparation (orateur + accueil)
- Rappel J-7 (orateur + accueil)
- Rappel J-2 (orateur)
- Remerciements (orateur + accueil)

### 4.5 MessageGeneratorModal

**Fichier**: `components/MessageGeneratorModal.tsx`

**Fonctionnalités**:

- Génération de messages à partir de modèles
- Personnalisation selon le genre (Frère/Sœur)
- Adaptation pour couples
- Remplacement de variables dynamiques
- Génération IA avec Google Gemini
- Copie dans le presse-papiers
- Partage WhatsApp
- Édition et sauvegarde de modèles personnalisés

**Variables disponibles**:

- `{speakerName}` - Nom de l'orateur
- `{hostName}` - Nom du contact d'accueil
- `{visitDate}` - Date formatée de la visite
- `{visitTime}` - Heure de la visite
- `{speakerPhone}` - Téléphone de l'orateur
- `{hostPhone}` - Téléphone du contact
- `{hostAddress}` - Adresse du contact
- `{hospitalityOverseer}` - Responsable de l'accueil
- `{hospitalityOverseerPhone}` - Téléphone du responsable
- `{firstTimeIntroduction}` - Introduction pour premier contact

### 4.6 SpeakerList & HostList

**Fichiers**: `components/SpeakerList.tsx`, `components/HostList.tsx`

**Fonctionnalités**:

- Liste avec recherche et filtres
- Tri par nom, congrégation, dernière visite
- Tags personnalisés
- Actions rapides (programmer, modifier, supprimer)
- Détection de doublons
- Fusion de doublons

### 4.7 ScheduleVisitModal

**Fichier**: `components/ScheduleVisitModal.tsx`

**Formulaire complet**:

- Sélection de l'orateur
- Date et heure
- Type de visite (physique/zoom/streaming)
- Sélection du discours
- Attribution du contact d'accueil
- Hébergement et repas
- Notes et pièces jointes
- Checklist personnalisée

### 4.8 TalksManager

**Fichier**: `components/TalksManager.tsx`

**Gestion des discours**:

- Liste complète des 194 discours
- Ajout/modification/suppression
- Import en masse depuis texte
- Recherche et filtres
- Statistiques d'utilisation

### 4.9 Statistics

**Fichier**: `components/Statistics.tsx`

**Statistiques affichées**:

- Nombre total de visites
- Visites par mois/année
- Orateurs les plus fréquents
- Discours les plus donnés
- Taux de communication
- Graphiques interactifs

### 4.10 Settings

**Fichier**: `components/Settings.tsx`

**Sections**:

1. **Profil de la congrégation**: Nom, responsable, téléphone
2. **Apparence**: Thème (clair/sombre/auto)
3. **Langue**: FR, CV, EN, ES
4. **Notifications**: Activation, jours de rappel
5. **IA**: Activation, modèle, température
6. **Sécurité**: Chiffrement, mot de passe
7. **Données**: Import/Export, Réinitialisation
8. **Synchronisation**: Google Sheets
9. **Archives**: Gestion des visites archivées
10. **Logo**: Personnalisation du logo

## 5. HOOKS PERSONNALISÉS

### 5.1 useDataCache

**Fichier**: `hooks/useDataCache.ts`

**Fonction**: Optimiser les calculs dérivés

- `upcomingVisits` - Visites à venir triées
- `pastUnarchivedVisits` - Visites passées non archivées (90 jours)
- `allSpeakerTags` - Liste de tous les tags d'orateurs
- `allHostTags` - Liste de tous les tags de contacts

### 5.2 useDataValidation

**Fichier**: `hooks/useDataValidation.ts`

**Fonction**: Valider et nettoyer les données

- `validateSpeaker(speaker)` - Validation d'orateur
- `validateVisit(visit)` - Validation de visite
- `validateHost(host)` - Validation de contact
- `sanitizeInput(text)` - Nettoyage XSS

### 5.3 useKeyboardShortcuts

**Fichier**: `hooks/useKeyboardShortcuts.ts`

**Raccourcis globaux**:

- `Ctrl+K` - Recherche globale
- `Ctrl+N` - Nouvelle visite
- `Ctrl+S` - Sauvegarder
- `Ctrl+P` - Imprimer
- `Ctrl+/` - Aide
- `Esc` - Fermer modal

### 5.4 useVisitNotifications

**Fichier**: `hooks/useVisitNotifications.ts`

**Fonction**: Programmer les notifications locales

- Rappels J-7 et J-2
- Notifications personnalisables
- Gestion des permissions

### 5.5 useSessionTimeout

**Fichier**: `hooks/useSessionTimeout.ts`

**Fonction**: Verrouiller après inactivité (si chiffrement activé)

- Timeout configurable
- Extension automatique sur activité

## 6. UTILITAIRES

### 6.1 crypto.ts

**Fonctions**:

- `encrypt(data, password)` - Chiffrer avec AES-GCM
- `decrypt(encryptedData, password)` - Déchiffrer

### 6.2 performanceCache.ts

**Fonction**: Cache en mémoire avec TTL

- `get(key)` - Récupérer du cache
- `set(key, value, ttl)` - Mettre en cache
- `invalidate(key)` - Invalider le cache

### 6.3 smartNotifications.ts

**Fonction**: Notifications intelligentes basées sur règles

- Analyse du statut de communication
- Programmation automatique des rappels
- Priorisation des notifications urgentes

### 6.4 sensitiveDataManager.ts

**Fonction**: Gestion des données sensibles

- Chiffrement sélectif (téléphones, emails)
- Déchiffrement à la demande

### 6.5 idb.ts

**Fonction**: Wrapper pour IndexedDB

- `get(key)` - Lire
- `set(key, value)` - Écrire
- `del(key)` - Supprimer

## 7. MODÈLES DE MESSAGES

### 7.1 Structure

**Fichier**: `constants.ts`

```typescript
messageTemplates[langue][typeMessage][role]
```

### 7.2 Langues supportées

- Français (fr)
- Capverdien (cv)
- Anglais (en)
- Espagnol (es)

### 7.3 Types de messages

1. **confirmation**: Premier contact, demande de besoins
2. **preparation**: Détails pratiques (contact d'accueil, adresse)
3. **reminder-7**: Rappel 7 jours avant
4. **reminder-2**: Rappel 2 jours avant
5. **thanks**: Remerciements après la visite

### 7.4 Personnalisation

- Modèles par défaut
- Modèles personnalisés sauvegardés
- Édition en ligne
- Restauration des modèles par défaut

## 8. FONCTIONNALITÉS AVANCÉES

### 8.1 Synchronisation Google Sheets

**Fonction**: `syncWithGoogleSheet()`

**Processus**:

1. Connexion à Google Sheets via API publique
2. Lecture des onglets configurés
3. Parsing des données (Date, Orateur, Congrégation, N°, Thème)
4. Fusion intelligente avec données existantes
5. Mise à jour des orateurs et visites
6. Rapport détaillé des ajouts/modifications

### 8.2 Import/Export de données

**Export**:

- Format JSON complet
- Sauvegarde sur appareil (Android/iOS)
- Téléchargement navigateur (Web)

**Import**:

- Fusion intelligente (pas d'écrasement)
- Détection de doublons
- Validation des données
- Rapport d'import

### 8.3 Génération IA

**Intégration**: Google Gemini API

**Fonctionnalités**:

- Réécriture de messages
- Adaptation du ton
- Traduction
- Suggestions contextuelles

**Configuration**:

- Modèle sélectionnable
- Température ajustable
- Activation/désactivation

### 8.4 Gestion des doublons

**Détection**:

- Normalisation des noms (accents, casse, espaces)
- Comparaison phonétique
- Suggestions de fusion

**Fusion**:

- Sélection de l'enregistrement principal
- Fusion de l'historique
- Mise à jour des références

### 8.5 Accessibilité

**Fichier**: `components/AccessibilityProvider.tsx`

**Fonctionnalités**:

- Support lecteur d'écran
- Navigation clavier complète
- Mode contraste élevé
- Respect des préférences système (reduced motion)
- Annonces ARIA
- Focus management

### 8.6 Mode hors ligne

**Fonctionnalités**:

- Détection du statut en ligne/hors ligne
- Stockage local complet
- Synchronisation à la reconnexion
- Indicateur visuel

## 9. SÉCURITÉ

### 9.1 Chiffrement

- AES-GCM 256 bits
- Dérivation de clé PBKDF2
- Salt aléatoire par chiffrement
- Chiffrement complet de la base de données

### 9.2 Validation des données

- Sanitisation XSS
- Validation des types
- Validation des formats (email, téléphone, date)
- Protection contre l'injection

### 9.3 Gestion des sessions

- Timeout d'inactivité
- Verrouillage automatique
- Extension de session sur activité

## 10. PERFORMANCE

### 10.1 Optimisations

- Lazy loading des composants lourds
- Memoization avec useMemo/useCallback
- Cache en mémoire pour calculs coûteux
- Virtualisation des longues listes
- Debouncing des recherches

### 10.2 Bundle

- Code splitting par route
- Tree shaking
- Minification
- Compression

## 11. DÉPLOIEMENT

### 11.1 Web

```bash
npm run build
# Déployer le dossier dist/
```

### 11.2 Android

```bash
npm run build
npx cap sync android
npx cap open android
# Build APK dans Android Studio
```

### 11.3 iOS

```bash
npm run build
npx cap sync ios
npx cap open ios
# Build dans Xcode
```

## 12. CONFIGURATION

### 12.1 Variables d'environnement

```env
VITE_GEMINI_API_KEY=votre_cle_api
```

### 12.2 Capacitor

**Fichier**: `capacitor.config.ts`

- App ID: com.kbv.lyon
- App Name: KBV Lyon
- Permissions: Notifications, Storage, Network

### 12.3 Android

**Fichier**: `android/app/src/main/AndroidManifest.xml`

- Permissions réseau
- Permissions notifications
- Permissions stockage

## 13. TESTS

### 13.1 Tests unitaires

- Validation des données
- Fonctions utilitaires
- Hooks personnalisés

### 13.2 Tests d'intégration

- Flux complets (ajout visite, génération message)
- Import/Export
- Synchronisation

## 14. MAINTENANCE

### 14.1 Logs

- Console pour développement
- Pas de logs en production
- Gestion des erreurs avec ErrorBoundary

### 14.2 Mises à jour

- Vérification de version
- Migration de données si nécessaire
- Changelog

## 15. DONNÉES INITIALES

### 15.1 Orateurs

- 65+ orateurs pré-configurés
- Historique des visites
- Informations de contact

### 15.2 Contacts d'accueil

- 12 contacts pré-configurés
- Adresses à Lyon
- Préférences et notes

### 15.3 Discours

- 194 discours publics en capverdien
- Numéros et thèmes

### 15.4 Dates spéciales

- Visites du surveillant de circonscription
- Assemblées
- Discours spécial
- Mémorial

## 16. ROADMAP FUTURE

### 16.1 Fonctionnalités prévues

- Mode multi-congrégation
- Partage de calendrier
- Intégration calendrier système
- Export PDF personnalisé
- Statistiques avancées
- Backup automatique cloud

### 16.2 Améliorations techniques

- PWA complète
- Service Worker pour cache
- Synchronisation temps réel
- Tests automatisés complets
