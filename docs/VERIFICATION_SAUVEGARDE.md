# Vérification de la fonction de sauvegarde

## ✅ Données sauvegardées par `exportData()`

La fonction `exportData()` dans `contexts/DataContext.tsx` (ligne 766-902) sauvegarde **TOUTES** les données de l'application via `JSON.stringify(appData)`.

### Contenu de `appData` (interface définie ligne 15-26):

1. **✅ speakers**: Speaker[]
   - Liste complète des orateurs avec :
     - id, nom, congregation
     - talkHistory (historique des discours)
     - telephone, notes, photoUrl
     - maritalStatus, isVehiculed, gender, tags

2. **✅ visits**: Visit[]
   - Toutes les visites à venir avec :
     - Informations de l'orateur (id, nom, congregation, telephone, photoUrl)
     - Détails de la visite (visitId, visitDate, visitTime, arrivalDate, departureDate)
     - Hébergement (host, accommodation, meals)
     - Statut (status, locationType)
     - Pièces jointes (attachments)
     - Dépenses (expenses)
     - Communication (communicationStatus)
     - Checklist, feedback
     - Discours (talkNoOrType, talkTheme)

3. **✅ hosts**: Host[]
   - Liste des hôtes avec :
     - nom, telephone, gender
     - address, photoUrl, notes
     - unavailabilities (indisponibilités)
     - tags

4. **✅ archivedVisits**: Visit[]
   - Toutes les visites archivées avec les mêmes informations que `visits`

5. **✅ customTemplates**: CustomMessageTemplates
   - Tous les modèles de messages personnalisés par langue, type et rôle

6. **✅ customHostRequestTemplates**: CustomHostRequestTemplates
   - Modèles de demandes d'accueil personnalisés par langue

7. **✅ congregationProfile**: CongregationProfile
   - Profil de la congrégation :
     - name, subtitle, defaultTime, city
     - latitude, longitude
     - hospitalityOverseer, hospitalityOverseerPhone
     - backupPhoneNumber

8. **✅ publicTalks**: PublicTalk[]
   - Liste complète des discours publics (number, theme)

9. **✅ savedViews**: SavedView[]
   - Vues sauvegardées avec filtres

10. **✅ specialDates**: SpecialDate[]
    - Dates spéciales (assemblées, visits du CO, etc.)

## 📝 Format de sauvegarde

- **Format**: JSON (lisible et portable)
- **Nom du fichier**: `gestion_visiteurs_tj_backup_YYYY-MM-DD.json`
- **Emplacement**:
  - Web: Téléchargement automatique
  - Android: `Documents/KBV_Lyon_Backups/`
  - iOS: Accessible via l'app "Fichiers"

## ⚠️ Ce qui N'est PAS sauvegardé (et c'est normal)

- **Logo** : Sauvegardé séparément dans localStorage sous `congregationLogo`
- **Paramètres de chiffrement** : Stockés localement pour la sécurité
- **Cache temporaire** : Données temporaires qui ne nécessitent pas de sauvegarde

## ✅ Conclusion

**La fonction `exportData()` sauvegarde TOUTES les données importantes de l'application.**

Toutes les informations essentielles sont incluses dans la sauvegarde :
- 100% des orateurs
- 100% des visites (passées et futures)
- 100% des hôtes
- 100% des paramètres personnalisés
- 100% du profil de congrégation
- 100% des données auxiliaires

## 🔄 Fonction de restauration

La fonction `importData()` (ligne 904-1036) restaure également toutes ces données avec :
- Fusion intelligente pour éviter les doublons
- Préservation des données existantes
- Mise à jour des informations en conflit
