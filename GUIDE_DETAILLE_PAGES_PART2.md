# Guide Détaillé - Pages et Fonctionnalités (Partie 2)

## PAGE 4: MODAL GÉNÉRATION DE MESSAGE

### Design
- **Taille**: Plein écran sur mobile, 800px largeur sur desktop
- **Layout**: Header fixe, corps scrollable, footer fixe
- **Animation**: Slide up depuis le bas

### Structure

#### 4.1 Header
- Bouton fermer (X) en haut à droite
- Titre: "Générer un message"
- Sous-titre: Nom de l'orateur + Date de visite

#### 4.2 Sélecteurs
**Sélecteur de langue** (4 boutons):
- Français (FR)
- Capverdien (CV)
- Anglais (EN)
- Espagnol (ES)
- Style: Boutons radio visuels

**Sélecteur de type de message** (dropdown):
- Confirmation & Besoins
- Détails de préparation
- Rappel J-7
- Rappel J-2
- Remerciements

**Sélecteur de destinataire** (si applicable):
- Orateur
- Contact d'accueil

#### 4.3 Zone de message
**Textarea**:
- Hauteur: 400px
- Police: Monospace
- Taille: 14px
- Bordure: Gris clair
- Fond: Blanc
- Scroll vertical

**Fonctionnalités**:
- Édition libre
- Copier/Coller
- Undo/Redo (Ctrl+Z / Ctrl+Y)

#### 4.4 Barre d'outils message
**Boutons**:
1. **Régénérer** (icône refresh)
   - Recharge le modèle
   - Remplace les variables

2. **Éditer le modèle** (icône crayon)
   - Bascule en mode édition de modèle
   - Affiche le modèle brut avec variables

3. **IA** (icône étoile)
   - Ouvre menu IA
   - Options: Réécrire, Raccourcir, Allonger, Changer ton

4. **Copier** (icône copie)
   - Copie dans presse-papiers
   - Toast de confirmation

5. **WhatsApp** (icône WhatsApp)
   - Ouvre WhatsApp avec message pré-rempli
   - Détecte si mobile ou desktop

6. **Partager** (icône partage)
   - Menu de partage natif (mobile)
   - Options de partage (desktop)

#### 4.5 Mode édition de modèle
**Affichage**:
- Textarea avec modèle brut
- Variables en surbrillance colorée
- Liste des variables disponibles (sidebar)

**Variables disponibles**:
```
{speakerName} - Nom de l'orateur
{hostName} - Nom du contact
{visitDate} - Date formatée
{visitTime} - Heure
{speakerPhone} - Téléphone orateur
{hostPhone} - Téléphone contact
{hostAddress} - Adresse contact
{hospitalityOverseer} - Responsable
{hospitalityOverseerPhone} - Tél responsable
{firstTimeIntroduction} - Intro premier contact
```

**Boutons**:
- Sauvegarder le modèle personnalisé
- Restaurer le modèle par défaut
- Annuler les modifications

#### 4.6 Menu IA
**Options**:
1. **Réécrire**
   - Prompt: "Réécris ce message de manière plus claire"
   - Température: 0.7

2. **Raccourcir**
   - Prompt: "Raccourcis ce message en gardant l'essentiel"
   - Température: 0.5

3. **Allonger**
   - Prompt: "Développe ce message avec plus de détails"
   - Température: 0.8

4. **Changer le ton**
   - Sous-menu: Formel, Amical, Professionnel
   - Température: 0.6

**Indicateur de chargement**:
- Spinner animé
- Texte: "Génération en cours..."
- Désactivation des boutons

#### 4.7 Footer
**Boutons**:
- Annuler (gris, gauche)
- Envoyer et marquer comme envoyé (bleu, droite)

**Action "Envoyer"**:
1. Copie le message dans presse-papiers
2. Enregistre la date d'envoi dans communicationStatus
3. Affiche toast de confirmation
4. Ferme le modal

### Fonctions JavaScript

```typescript
// Générer le message à partir du modèle
const generateMessage = (template, visit, speaker, host, language) => {
  let message = template;
  
  // Remplacement des variables
  message = message.replace(/{speakerName}/g, visit.nom);
  message = message.replace(/{hostName}/g, visit.host);
  message = message.replace(/{visitDate}/g, formatFullDate(visit.visitDate));
  message = message.replace(/{visitTime}/g, visit.visitTime);
  message = message.replace(/{speakerPhone}/g, formatPhone(speaker?.telephone));
  message = message.replace(/{hostPhone}/g, formatPhone(host?.telephone));
  message = message.replace(/{hostAddress}/g, host?.address || '(non renseignée)');
  message = message.replace(/{hospitalityOverseer}/g, congregationProfile.hospitalityOverseer);
  message = message.replace(/{hospitalityOverseerPhone}/g, congregationProfile.hospitalityOverseerPhone);
  
  // Introduction premier contact
  const isFirstContact = !visit.communicationStatus || 
                         Object.keys(visit.communicationStatus).length === 0;
  if (isFirstContact) {
    const intro = language === 'fr' 
      ? "\nJe suis le responsable de l'accueil pour le groupe capverdien de Lyon."
      : "\nMi é responsavel pa akolhimentu na grupu kabuverdianu di Lyon.";
    message = message.replace(/{firstTimeIntroduction}/g, intro);
  } else {
    message = message.replace(/{firstTimeIntroduction}/g, '');
  }
  
  // Adaptation selon le genre
  message = adaptGender(message, speaker?.gender, host?.gender);
  
  return message;
};

// Adapter selon le genre
const adaptGender = (message, speakerGender, hostGender) => {
  // Orateur féminin
  if (speakerGender === 'female') {
    message = message.replace(/Bonjour Frère/g, 'Bonjour Sœur');
    message = message.replace(/Frère \*{speakerName}\*/g, 'Sœur *{speakerName}*');
    message = message.replace(/notre orateur invité, Frère/g, 'notre oratrice invitée, Sœur');
  }
  
  // Contact féminin
  if (hostGender === 'female') {
    message = message.replace(/Bonjour Frère {hostName}/g, 'Bonjour Sœur {hostName}');
    message = message.replace(/notre frère/g, 'notre sœur');
  }
  
  // Couple
  if (hostGender === 'couple') {
    message = message.replace(/Frère {hostName}/g, '{hostName}');
    message = message.replace(/tu vas bien/g, 'vous allez bien');
    message = message.replace(/Je te contacte/g, 'Je vous contacte');
    // ... autres remplacements tu/vous
  }
  
  return message;
};

// Générer avec IA
const generateWithAI = async (message, action, apiKey) => {
  const prompts = {
    rewrite: "Réécris ce message de manière plus claire et professionnelle",
    shorten: "Raccourcis ce message en gardant l'essentiel",
    expand: "Développe ce message avec plus de détails",
    formal: "Réécris ce message avec un ton plus formel",
    friendly: "Réécris ce message avec un ton plus amical"
  };
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  
  const prompt = `${prompts[action]}:\n\n${message}`;
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};

// Copier dans presse-papiers
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback pour anciens navigateurs
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
};

// Ouvrir WhatsApp
const openWhatsApp = (phone, message) => {
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const encodedMessage = encodeURIComponent(message);
  
  // Détection mobile vs desktop
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const url = isMobile
    ? `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`
    : `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;
  
  window.open(url, '_blank');
};
```

---

## PAGE 5: MODAL PROGRAMMER UNE VISITE

### Design
- **Taille**: Plein écran sur mobile, 900px sur desktop
- **Layout**: Formulaire en plusieurs sections
- **Validation**: En temps réel avec messages d'erreur

### Structure

#### 5.1 Header
- Titre: "Programmer une visite" ou "Modifier la visite"
- Bouton fermer (X)

#### 5.2 Section 1: Orateur
**Champ de sélection d'orateur**:
- Autocomplete avec recherche
- Affiche: Photo + Nom + Congrégation
- Option: "Nouvel orateur" (ouvre modal d'ajout)

**Si nouvel orateur**:
- Champ Nom (requis)
- Champ Congrégation (requis)
- Champ Téléphone
- Champ Email
- Sélecteur Genre (Frère/Sœur)

#### 5.3 Section 2: Date et heure
**Champ Date**:
- Date picker
- Format: JJ/MM/AAAA
- Validation: Date future uniquement
- Indicateur: Dates spéciales (assemblées, etc.)

**Champ Heure**:
- Time picker
- Format: HH:MM
- Valeur par défaut: 14:30

**Alerte conflits**:
- Si visite déjà programmée ce jour
- Message: "Une visite est déjà programmée ce jour"
- Option: Continuer quand même

#### 5.4 Section 3: Type de visite
**Radio buttons**:
1. **Physique** (icône maison)
   - Active les champs d'accueil
   
2. **Zoom** (icône vidéo)
   - Désactive les champs d'accueil
   - Champ lien Zoom (optionnel)
   
3. **Streaming** (icône broadcast)
   - Désactive les champs d'accueil
   - Champ lien streaming (optionnel)

#### 5.5 Section 4: Discours
**Champ de sélection**:
- Autocomplete avec recherche
- Affiche: N° + Thème
- Filtre par numéro ou thème
- Option: "Autre" (champ texte libre)

**Historique**:
- Affiche les discours déjà donnés par cet orateur
- Badge "Déjà donné" avec date

#### 5.6 Section 5: Accueil (si physique)
**Champ de sélection de contact**:
- Dropdown avec recherche
- Affiche: Nom + Adresse
- Option: "À définir" (par défaut)
- Option: "Nouveau contact" (ouvre modal)

**Détails d'accueil**:
- Checkbox "Hébergement nécessaire"
- Checkbox "Repas nécessaire"
- Champ Notes (textarea)

**Indisponibilités**:
- Affiche si contact indisponible à cette date
- Message d'avertissement

#### 5.7 Section 6: Informations complémentaires
**Champ Statut**:
- Dropdown: En attente / Confirmé / Annulé
- Par défaut: En attente

**Champ Notes**:
- Textarea multiligne
- Placeholder: "Notes sur la visite..."

**Pièces jointes**:
- Bouton "Ajouter une pièce jointe"
- Liste des fichiers ajoutés
- Types acceptés: PDF, images, documents

**Checklist personnalisée**:
- Bouton "Ajouter une tâche"
- Liste de tâches avec checkbox
- Exemples: "Confirmer transport", "Préparer repas"

#### 5.8 Footer
**Boutons**:
- Annuler (gris, gauche)
- Si modification: "Supprimer" (rouge, centre)
- Enregistrer (bleu, droite)

**Validation**:
- Champs requis: Orateur, Date, Heure
- Messages d'erreur sous chaque champ
- Désactivation du bouton si invalide

### Fonctions JavaScript

```typescript
// Valider le formulaire
const validateVisitForm = (formData) => {
  const errors = {};
  
  // Orateur requis
  if (!formData.speakerId) {
    errors.speaker = "Veuillez sélectionner un orateur";
  }
  
  // Date requise et future
  if (!formData.visitDate) {
    errors.date = "Veuillez sélectionner une date";
  } else {
    const visitDate = new Date(formData.visitDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (visitDate < today) {
      errors.date = "La date doit être dans le futur";
    }
  }
  
  // Heure requise
  if (!formData.visitTime) {
    errors.time = "Veuillez sélectionner une heure";
  }
  
  // Vérifier conflit de date
  const conflict = visits.find(v => 
    v.visitDate === formData.visitDate && 
    v.visitId !== formData.visitId
  );
  if (conflict) {
    errors.dateConflict = `Une visite est déjà programmée ce jour (${conflict.nom})`;
  }
  
  return errors;
};

// Vérifier disponibilité du contact
const checkHostAvailability = (hostName, date) => {
  const host = hosts.find(h => h.nom === hostName);
  if (!host) return { available: true };
  
  const isUnavailable = host.unavailabilities?.includes(date);
  
  return {
    available: !isUnavailable,
    message: isUnavailable ? `${hostName} n'est pas disponible à cette date` : null
  };
};

// Sauvegarder la visite
const saveVisit = async (formData) => {
  // Validation
  const errors = validateVisitForm(formData);
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }
  
  // Récupérer les infos de l'orateur
  const speaker = speakers.find(s => s.id === formData.speakerId);
  
  // Créer l'objet visite
  const visit = {
    id: speaker.id,
    visitId: formData.visitId || generateUUID(),
    nom: speaker.nom,
    congregation: speaker.congregation,
    telephone: speaker.telephone,
    photoUrl: speaker.photoUrl,
    visitDate: formData.visitDate,
    visitTime: formData.visitTime,
    host: formData.host || 'À définir',
    accommodation: formData.accommodation || '',
    meals: formData.meals || '',
    status: formData.status || 'pending',
    locationType: formData.locationType,
    talkNoOrType: formData.talkNo,
    talkTheme: formData.talkTheme,
    communicationStatus: formData.communicationStatus || {},
    notes: formData.notes,
    attachments: formData.attachments || [],
    expenses: formData.expenses || [],
    checklist: formData.checklist || []
  };
  
  // Sauvegarder
  if (formData.visitId) {
    await updateVisit(visit);
  } else {
    await addVisit(visit);
  }
  
  return { success: true, visit };
};
```

---

## PAGE 6: LISTES ORATEURS ET CONTACTS

### Design
- **Layout**: Grille de cartes avec sidebar de filtres
- **Responsive**: 1 colonne mobile, 2-3 colonnes desktop

### Section Orateurs

#### 6.1 Barre d'outils
**Gauche**:
- Titre: "Orateurs"
- Compteur: "X orateurs"

**Centre**:
- Champ de recherche
- Placeholder: "Rechercher par nom ou congrégation..."

**Droite**:
- Bouton "Nouvel orateur" (bleu, icône +)
- Bouton "Détecter doublons" (icône scan)

#### 6.2 Filtres (sidebar collapsible)
**Filtre par congrégation**:
- Liste de checkboxes
- Toutes les congrégations uniques
- Compteur par congrégation

**Filtre par tags**:
- Liste de checkboxes
- Tous les tags uniques
- Couleurs personnalisées

**Filtre par dernière visite**:
- Jamais visité
- < 6 mois
- 6-12 mois
- > 12 mois

**Tri**:
- Par nom (A-Z / Z-A)
- Par congrégation
- Par dernière visite (récent / ancien)

#### 6.3 Carte orateur
**Design**:
- Photo (ronde, 80px) ou initiales
- Nom (gras, 18px)
- Congrégation (gris, 14px)
- Téléphone (icône + numéro)
- Email (icône + email)
- Tags (badges colorés)

**Statistiques**:
- Nombre de visites
- Dernière visite (date relative)
- Discours donnés (nombre)

**Actions**:
- Bouton "Programmer" (bleu)
- Bouton "Message" (vert)
- Menu contextuel (3 points):
  - Modifier
  - Voir l'historique
  - Supprimer

**Hover**:
- Élévation de la carte
- Affichage des notes (tooltip)

#### 6.4 Modal détails orateur
**Onglets**:
1. **Informations**
   - Formulaire d'édition
   - Photo (upload)
   - Tous les champs

2. **Historique**
   - Liste des visites passées
   - Date + Discours
   - Feedback (si disponible)

3. **Statistiques**
   - Graphique des visites par année
   - Discours les plus donnés
   - Taux de confirmation

#### 6.5 Détection de doublons
**Modal**:
- Liste des doublons potentiels
- Groupés par similarité
- Score de correspondance (%)

**Carte doublon**:
- Deux cartes côte à côte
- Différences surlignées
- Bouton "Fusionner"

**Modal fusion**:
- Sélection de l'enregistrement principal
- Choix des champs à conserver
- Aperçu du résultat
- Bouton "Confirmer la fusion"

### Section Contacts d'accueil

#### 6.6 Barre d'outils
Identique aux orateurs avec:
- Titre: "Contacts d'accueil"
- Bouton "Nouveau contact"

#### 6.7 Carte contact
**Design**:
- Photo ou icône maison
- Nom (gras)
- Adresse complète
- Téléphone
- Tags (ex: "sans escaliers", "animaux")

**Statistiques**:
- Nombre d'accueils
- Dernier accueil
- Disponibilité (calendrier)

**Actions**:
- Bouton "Assigner" (bleu)
- Bouton "Message" (vert)
- Menu contextuel:
  - Modifier
  - Gérer indisponibilités
  - Supprimer

#### 6.8 Gestion des indisponibilités
**Modal**:
- Calendrier mensuel
- Dates indisponibles en rouge
- Clic sur date pour toggle
- Bouton "Ajouter période"

**Formulaire période**:
- Date début
- Date fin
- Raison (optionnel)

### Fonctions JavaScript

```typescript
// Recherche et filtrage
const filterSpeakers = (speakers, filters) => {
  return speakers.filter(speaker => {
    // Recherche textuelle
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const matchName = speaker.nom.toLowerCase().includes(search);
      const matchCong = speaker.congregation.toLowerCase().includes(search);
      if (!matchName && !matchCong) return false;
    }
    
    // Filtre congrégation
    if (filters.congregations?.length > 0) {
      if (!filters.congregations.includes(speaker.congregation)) return false;
    }
    
    // Filtre tags
    if (filters.tags?.length > 0) {
      const hasTags = filters.tags.some(tag => speaker.tags?.includes(tag));
      if (!hasTags) return false;
    }
    
    // Filtre dernière visite
    if (filters.lastVisit) {
      const lastVisit = getLastVisitDate(speaker);
      const monthsAgo = lastVisit ? getMonthsAgo(lastVisit) : Infinity;
      
      switch(filters.lastVisit) {
        case 'never':
          if (lastVisit) return false;
          break;
        case 'recent':
          if (monthsAgo > 6) return false;
          break;
        case 'medium':
          if (monthsAgo < 6 || monthsAgo > 12) return false;
          break;
        case 'old':
          if (monthsAgo < 12) return false;
          break;
      }
    }
    
    return true;
  });
};

// Détecter les doublons
const detectDuplicates = (speakers) => {
  const duplicates = [];
  
  for (let i = 0; i < speakers.length; i++) {
    for (let j = i + 1; j < speakers.length; j++) {
      const similarity = calculateSimilarity(speakers[i], speakers[j]);
      
      if (similarity > 0.7) {
        duplicates.push({
          speaker1: speakers[i],
          speaker2: speakers[j],
          similarity: similarity,
          differences: findDifferences(speakers[i], speakers[j])
        });
      }
    }
  }
  
  return duplicates.sort((a, b) => b.similarity - a.similarity);
};

// Calculer similarité
const calculateSimilarity = (s1, s2) => {
  const name1 = normalizeName(s1.nom);
  const name2 = normalizeName(s2.nom);
  
  // Levenshtein distance
  const distance = levenshteinDistance(name1, name2);
  const maxLength = Math.max(name1.length, name2.length);
  const nameSimilarity = 1 - (distance / maxLength);
  
  // Congrégation identique = bonus
  const congBonus = s1.congregation === s2.congregation ? 0.2 : 0;
  
  return Math.min(nameSimilarity + congBonus, 1);
};

// Fusionner deux orateurs
const mergeSpeakers = (primaryId, duplicateIds) => {
  const primary = speakers.find(s => s.id === primaryId);
  const duplicates = speakers.filter(s => duplicateIds.includes(s.id));
  
  // Fusionner l'historique
  const mergedHistory = [
    ...primary.talkHistory,
    ...duplicates.flatMap(d => d.talkHistory)
  ].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Fusionner les tags
  const mergedTags = [...new Set([
    ...(primary.tags || []),
    ...duplicates.flatMap(d => d.tags || [])
  ])];
  
  // Mettre à jour l'orateur principal
  const updated = {
    ...primary,
    talkHistory: mergedHistory,
    tags: mergedTags
  };
  
  // Mettre à jour les visites
  visits.forEach(visit => {
    if (duplicateIds.includes(visit.id)) {
      visit.id = primaryId;
      visit.nom = primary.nom;
      visit.congregation = primary.congregation;
    }
  });
  
  // Supprimer les doublons
  duplicateIds.forEach(id => deleteSpeaker(id));
  
  // Sauvegarder
  updateSpeaker(updated);
};
```

