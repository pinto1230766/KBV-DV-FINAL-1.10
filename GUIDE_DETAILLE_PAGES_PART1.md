# Guide Détaillé - Pages et Fonctionnalités (Partie 1)

## PAGE 1: DASHBOARD (Tableau de bord)

### Design

- **Layout**: Grille responsive (1 colonne mobile, 2-3 colonnes desktop)
- **Couleurs**: Cartes blanches sur fond gris clair, accents bleu primaire
- **Typographie**: Titres en gras, texte secondaire en gris

### Sections

#### 1.1 En-tête

- **Logo** de la congrégation (personnalisable)
- **Nom de la congrégation** (ex: "KBV DV LYON .FP")
- **Sous-titre** (ex: "Gestion des Orateurs Visiteurs")
- **Bouton recherche** (icône loupe) - Ouvre recherche globale
- **Bouton impression** (icône imprimante) - Aperçu avant impression
- **Toggle thème** (soleil/lune) - Basculer clair/sombre

#### 1.2 Statistiques Rapides (4 cartes)

##### Carte 1: Total Visites

- Icône: Calendrier
- Nombre total de visites programmées
- Texte: "Visites programmées"
- Couleur: Bleu

##### Carte 2: Visites ce mois

- Icône: Calendrier avec horloge
- Nombre de visites du mois en cours
- Texte: "Ce mois-ci"
- Couleur: Vert

##### Carte 3: Orateurs

- Icône: Utilisateur
- Nombre total d'orateurs
- Texte: "Orateurs"
- Couleur: Violet

##### Carte 4: Contacts d'accueil

- Icône: Maison
- Nombre total de contacts
- Texte: "Contacts d'accueil"
- Couleur: Orange

#### 1.3 Prochaines Visites (7 jours)

### Design - Prochaines Visites

- Titre: "Prochaines visites (7 jours)"
- Liste de cartes horizontales
- Chaque carte affiche:
  - Photo de l'orateur (ou initiales si pas de photo)
  - Nom de l'orateur (gras)
  - Congrégation (texte secondaire)
  - Date formatée (ex: "Samedi 15 janvier 2025")
  - Heure (ex: "14:30")
  - Badge de statut (En attente/Confirmé)
  - Icône de type (Physique/Zoom/Streaming)
  - Bouton "Générer message" (icône enveloppe)

### Interactions

- Clic sur carte → Ouvre modal de modification
- Clic sur "Générer message" → Ouvre modal de génération de message
- Survol → Ombre portée et légère élévation

### État vide

- Icône calendrier grisée
- Texte: "Aucune visite programmée dans les 7 prochains jours"
- Bouton: "Programmer une visite"

#### 1.4 Visites Nécessitant une Action

### Design - Visites Nécessitant une Action

- Titre: "Visites nécessitant une action"
- Badge rouge avec nombre d'actions
- Liste de cartes avec indicateur d'urgence

### Types d'actions

1. **Pas de contact d'accueil assigné**
   - Badge rouge: "Accueil manquant"
   - Bouton: "Demander un accueil"

2. **Confirmation non envoyée (< 7 jours)**
   - Badge orange: "Confirmation urgente"
   - Bouton: "Envoyer confirmation"

3. **Rappel J-7 à envoyer**
   - Badge jaune: "Rappel J-7"
   - Bouton: "Envoyer rappel"

4. **Visite passée non archivée**
   - Badge gris: "À archiver"
   - Bouton: "Archiver"

#### 1.5 Graphiques

##### Graphique 1: Visites par Mois (Barres)

- Titre: "Visites par mois"
- Axe X: Mois (Jan, Fév, Mar...)
- Axe Y: Nombre de visites
- Couleur: Dégradé bleu
- Hauteur: 300px
- Responsive: Scroll horizontal sur mobile

##### Graphique 2: Répartition par Type (Donut)

- Titre: "Répartition par type de visite"
- Segments:
  - Physique (bleu)
  - Zoom (vert)
  - Streaming (orange)
- Légende avec pourcentages
- Centre: Total de visites

#### 1.6 Actions Rapides (Boutons flottants)

### Bouton Principal (FAB - Floating Action Button)

- Position: Bas droite, fixe
- Icône: Plus (+)
- Couleur: Bleu primaire
- Au clic: Menu contextuel avec 3 options

### Menu contextuel

1. "Programmer une visite" (icône calendrier)
2. "Ajouter un orateur" (icône utilisateur)
3. "Ajouter un contact" (icône maison)

### Fonctions JavaScript

```typescript
// Récupérer les statistiques
const getStats = () => {
  return {
    totalVisits: visits.length,
    thisMonth: visits.filter(v => isThisMonth(v.visitDate)).length,
    totalSpeakers: speakers.length,
    totalHosts: hosts.length
  };
};

// Récupérer les prochaines visites (7 jours)
const getUpcomingVisits = () => {
  const today = new Date();
  const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  return visits
    .filter(v => {
      const visitDate = new Date(v.visitDate);
      return visitDate >= today && visitDate <= in7Days;
    })
    .sort((a, b) => new Date(a.visitDate) - new Date(b.visitDate));
};

// Récupérer les visites nécessitant une action
const getVisitsNeedingAction = () => {
  const today = new Date();
  const actions = [];
  
  visits.forEach(visit => {
    const visitDate = new Date(visit.visitDate);
    const daysUntil = Math.ceil((visitDate - today) / (1000 * 60 * 60 * 24));
    
    // Pas de contact d'accueil
    if (visit.host === 'À définir' && visit.locationType === 'physical') {
      actions.push({ visit, type: 'no_host', priority: 'high' });
    }
    
    // Confirmation non envoyée
    if (!visit.communicationStatus?.confirmation?.speaker && daysUntil < 7) {
      actions.push({ visit, type: 'no_confirmation', priority: 'urgent' });
    }
    
    // Rappel J-7
    if (daysUntil === 7 && !visit.communicationStatus?.['reminder-7']?.speaker) {
      actions.push({ visit, type: 'reminder_7', priority: 'medium' });
    }
    
    // Visite passée non archivée
    if (daysUntil < 0 && visit.status !== 'completed') {
      actions.push({ visit, type: 'to_archive', priority: 'low' });
    }
  });
  
  return actions.sort((a, b) => {
    const priority = { urgent: 0, high: 1, medium: 2, low: 3 };
    return priority[a.priority] - priority[b.priority];
  });
};

// Données pour graphique barres
const getMonthlyVisitsData = () => {
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const data = new Array(12).fill(0);
  
  visits.forEach(visit => {
    const month = new Date(visit.visitDate).getMonth();
    data[month]++;
  });
  
  return months.map((month, index) => ({
    month,
    count: data[index]
  }));
};

// Données pour graphique donut
const getVisitTypeDistribution = () => {
  const types = { physical: 0, zoom: 0, streaming: 0 };
  
  visits.forEach(visit => {
    types[visit.locationType]++;
  });
  
  const total = visits.length;
  
  return [
    { type: 'Physique', count: types.physical, percentage: (types.physical / total * 100).toFixed(1) },
    { type: 'Zoom', count: types.zoom, percentage: (types.zoom / total * 100).toFixed(1) },
    { type: 'Streaming', count: types.streaming, percentage: (types.streaming / total * 100).toFixed(1) }
  ];
};
```

### Responsive

- **Mobile (< 768px)**: 1 colonne, graphiques en pleine largeur
- **Tablet (768-1024px)**: 2 colonnes, graphiques côte à côte
- **Desktop (> 1024px)**: 3 colonnes, layout optimisé

---

## PAGE 2: PLANNING (Gestion des visites)

### Design - Planning

- **Layout**: Liste/Grille avec barre d'outils en haut
- **Filtres**: Barre latérale collapsible
- **Couleurs**: Cartes de visite avec bordure colorée selon statut

### Sections

#### 2.1 Barre d'outils

**Gauche**:

- Titre: "Planning des visites"
- Compteur: "X visites programmées"

**Droite**:

- **Sélecteur de vue** (5 boutons):
  1. Cartes (icône grille)
  2. Liste (icône liste)
  3. Semaine (icône calendrier semaine)
  4. Calendrier (icône calendrier mois)
  5. Chronologie (icône timeline)

- **Bouton "Nouvelle visite"** (bleu, icône +)

#### 2.2 Visites Passées Non Archivées

**Affichage conditionnel** (si visites passées existent):

- Bandeau orange en haut
- Texte: "X visite(s) passée(s) à archiver"
- Bouton: "Archiver toutes"
- Liste déroulante des visites concernées
- Checkbox pour sélection multiple
- Bouton: "Archiver la sélection"

#### 2.3 Vue Cartes (par défaut)

**Design de carte**:

- **En-tête**:
  - Photo orateur (gauche, ronde, 60px)
  - Nom orateur (gras, 18px)
  - Congrégation (gris, 14px)
  - Badge statut (droite, coloré)

- **Corps**:
  - Date complète (icône calendrier)
  - Heure (icône horloge)
  - Type de visite (icône selon type)
  - Contact d'accueil (icône maison)
  - Discours N° et thème (icône podium)

- **Barre de progression communication**:
  - 5 étapes: Confirmation, Préparation, Rappel, Remerciements
  - Étapes complétées en vert
  - Étapes en attente en gris
  - Pourcentage affiché

- **Pied de carte**:
  - Bouton "Modifier" (icône crayon)
  - Bouton "Message" (icône enveloppe)
  - Menu contextuel (3 points):
    - Marquer comme terminée
    - Dupliquer
    - Supprimer

**Grille**:

- Mobile: 1 colonne
- Tablet: 2 colonnes
- Desktop: 3 colonnes
- Gap: 16px

#### 2.4 Vue Liste

**Tableau avec colonnes**:

1. Photo + Nom
2. Congrégation
3. Date
4. Heure
5. Type
6. Contact
7. Statut
8. Communication (barre)
9. Actions

**Fonctionnalités**:

- Tri par colonne (clic sur en-tête)
- Sélection multiple (checkbox)
- Actions groupées (archiver, supprimer)
- Pagination (50 par page)

#### 2.5 Vue Semaine

**Design**:

- 7 colonnes (Lun-Dim)
- Ligne par semaine
- Cartes compactes dans chaque jour
- Navigation semaine précédente/suivante
- Bouton "Aujourd'hui"

**Carte compacte**:

- Heure (gras)
- Nom orateur
- Icône type
- Clic → Détails

#### 2.6 Vue Calendrier

**Design**:

- Calendrier mensuel classique
- Navigation mois précédent/suivant
- Bouton "Aujourd'hui"
- Dates spéciales marquées (assemblées, etc.)

**Jour avec visite**:

- Badge avec nombre de visites
- Couleur selon statut
- Clic → Liste des visites du jour

**Modal jour**:

- Liste des visites
- Bouton "Ajouter visite ce jour"

#### 2.7 Vue Chronologie

**Design**:

- Ligne de temps verticale
- Cartes attachées à la ligne
- Groupement par mois
- Scroll infini

**Éléments**:

- Point sur la ligne (coloré selon statut)
- Ligne connectrice
- Carte avec détails
- Date relative (ex: "Dans 5 jours")

### Fonctions JavaScript

```typescript
// Filtrer les visites
const filterVisits = (visits, filters) => {
  return visits.filter(visit => {
    // Filtre par statut
    if (filters.status && visit.status !== filters.status) return false;
    
    // Filtre par type
    if (filters.type && visit.locationType !== filters.type) return false;
    
    // Filtre par période
    if (filters.dateRange) {
      const visitDate = new Date(visit.visitDate);
      if (visitDate < filters.dateRange.start || visitDate > filters.dateRange.end) {
        return false;
      }
    }
    
    // Filtre par recherche
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return visit.nom.toLowerCase().includes(search) ||
             visit.congregation.toLowerCase().includes(search);
    }
    
    return true;
  });
};

// Trier les visites
const sortVisits = (visits, sortBy, order) => {
  return [...visits].sort((a, b) => {
    let comparison = 0;
    
    switch(sortBy) {
      case 'date':
        comparison = new Date(a.visitDate) - new Date(b.visitDate);
        break;
      case 'name':
        comparison = a.nom.localeCompare(b.nom);
        break;
      case 'congregation':
        comparison = a.congregation.localeCompare(b.congregation);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
    }
    
    return order === 'asc' ? comparison : -comparison;
  });
};

// Grouper par semaine
const groupByWeek = (visits) => {
  const weeks = new Map();
  
  visits.forEach(visit => {
    const date = new Date(visit.visitDate);
    const weekStart = getWeekStart(date);
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeks.has(weekKey)) {
      weeks.set(weekKey, []);
    }
    weeks.get(weekKey).push(visit);
  });
  
  return Array.from(weeks.entries()).map(([weekStart, visits]) => ({
    weekStart: new Date(weekStart),
    visits: visits.sort((a, b) => new Date(a.visitDate) - new Date(b.visitDate))
  }));
};

// Grouper par mois pour calendrier
const groupByMonth = (visits, year, month) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendar = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    visits: []
  }));
  
  visits.forEach(visit => {
    const date = new Date(visit.visitDate);
    if (date.getFullYear() === year && date.getMonth() === month) {
      const day = date.getDate();
      calendar[day - 1].visits.push(visit);
    }
  });
  
  return calendar;
};
```

### Interactions

**Drag & Drop** (Vue calendrier):

- Glisser une visite d'un jour à un autre
- Confirmation avant modification
- Mise à jour automatique

**Sélection multiple**:

- Checkbox sur chaque carte/ligne
- Barre d'actions apparaît en bas
- Actions: Archiver, Supprimer, Exporter

**Recherche en temps réel**:

- Champ de recherche en haut
- Filtrage instantané
- Surlignage des résultats

---

## PAGE 3: MESSAGERIE (Centre de communication)

### Design - Messagerie

- **Layout**: Split view (liste gauche, détails droite)
- **Couleurs**: Vert pour messages envoyés, gris pour en attente
- **Responsive**: Vue unique sur mobile avec navigation

### Sections

#### 3.1 Onglets principaux

##### Onglet 1: Visites & Accueil

- Gestion des communications par visite
- Liste des visites avec statut de communication

##### Onglet 2: Messages Orateurs

- Messages reçus des orateurs
- Notifications de disponibilité
- Historique des échanges

#### 3.2 Barre de recherche

- Champ de recherche par nom d'orateur
- Filtrage en temps réel
- Icône loupe

#### 3.3 Bouton "Demande d'accueil"

**Affichage conditionnel** (si visites sans accueil):

- Bouton orange avec badge
- Badge: Nombre de visites sans accueil
- Clic → Modal de sélection

**Modal de sélection**:

- Liste des visites sans accueil
- Checkbox pour sélection multiple
- Aperçu du message généré
- Bouton "Envoyer la demande"

#### 3.4 Liste des conversations (gauche)

**Design de carte conversation**:

- Photo orateur (ronde, 48px)
- Nom orateur (gras)
- Date de visite (format court)
- Barre de progression (5 étapes)
- Badge urgence (si < 7 jours et pas de confirmation)

**États**:

- Sélectionnée: Fond bleu, texte blanc
- Non sélectionnée: Fond blanc, hover gris clair
- Urgente: Bordure rouge

**Grille**:

- Desktop: 3 colonnes
- Mobile: 1 colonne, pleine largeur

#### 3.5 Détails de conversation (droite)

**En-tête**:

- Photo orateur
- Nom orateur (gras, 20px)
- Date complète de visite
- Bouton retour (mobile uniquement)

**Section 1: Communications Orateur**

- Titre: "Communications Orateur"
- Liste des étapes:

**Étape 1: Confirmation & Besoins**

- Icône: Enveloppe (gris) ou Check (vert)
- Label: "Confirmation & Besoins"
- Date d'envoi (si envoyé)
- Bouton "Générer" (si non envoyé)

**Étape 2: Détails de préparation**

- Icône: Document
- Label: "Détails de préparation"
- Date d'envoi (si envoyé)
- Bouton "Générer" (si non envoyé)

**Étape 3: Rappel J-7**

- Icône: Cloche
- Label: "Rappel J-7"
- Date d'envoi (si envoyé)
- Bouton "Générer" (si non envoyé)

**Étape 4: Rappel J-2**

- Icône: Cloche urgente
- Label: "Rappel J-2"
- Date d'envoi (si envoyé)
- Bouton "Générer" (si non envoyé)

**Étape 5: Remerciements**

- Icône: Cœur
- Label: "Remerciements"
- Date d'envoi (si envoyé)
- Bouton "Générer" (si non envoyé)

**Section 2: Communication Personnalisée**

- Titre: "Communication Personnalisée (Orateur)"
- Zone de texte multiligne
- Placeholder: "Écrivez votre message personnalisé..."
- Bouton "Générer le message"

**Section 3: Communications Accueil** (si visite physique)

- Titre: "Communications Accueil (Nom du contact)"
- Mêmes étapes que pour l'orateur (sauf rappel J-2)
- Affichage conditionnel selon type de visite

### Fonctions JavaScript

```typescript
// Calculer la progression de communication
const getCommunicationProgress = (visit) => {
  const steps = [
    { type: 'confirmation', role: 'speaker' },
    { type: 'preparation', role: 'speaker' },
    { type: 'preparation', role: 'host' },
    { type: 'reminder-7', role: 'speaker' },
    { type: 'thanks', role: 'speaker' }
  ];
  
  // Filtrer les étapes applicables
  const applicableSteps = steps.filter(step => {
    if (step.role === 'host' && visit.locationType !== 'physical') {
      return false;
    }
    return true;
  });
  
  // Compter les étapes complétées
  const completedSteps = applicableSteps.filter(step => {
    if (step.type === 'reminder-7') {
      // Rappel compté si J-7 OU J-2 envoyé
      return visit.communicationStatus?.['reminder-7']?.[step.role] ||
             visit.communicationStatus?.['reminder-2']?.[step.role];
    }
    return visit.communicationStatus?.[step.type]?.[step.role];
  });
  
  return {
    total: applicableSteps.length,
    completed: completedSteps.length,
    percentage: (completedSteps.length / applicableSteps.length) * 100
  };
};

// Vérifier si visite est urgente
const isUrgent = (visit) => {
  const today = new Date();
  const visitDate = new Date(visit.visitDate);
  const daysUntil = Math.ceil((visitDate - today) / (1000 * 60 * 60 * 24));
  
  return daysUntil < 7 && !visit.communicationStatus?.confirmation?.speaker;
};

// Récupérer les visites sans accueil
const getVisitsNeedingHost = (visits) => {
  return visits.filter(v =>
    v.host === 'À définir' &&
    v.status !== 'cancelled' &&
    v.locationType === 'physical' &&
    !v.congregation.toLowerCase().includes('lyon')
  ).sort((a, b) => new Date(a.visitDate) - new Date(b.visitDate));
};
```

### Modal de génération de message

(Voir section dédiée plus bas)
