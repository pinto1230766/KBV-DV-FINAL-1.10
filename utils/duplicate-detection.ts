import { Speaker, Host, Visit } from '../types';

// Fonction pour normaliser les noms (enlever accents, espaces, etc.)
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Enlever les accents
    .replace(/[^a-z0-9]/g, '') // Garder seulement lettres et chiffres
    .replace(/\s+/g, ''); // Enlever tous les espaces
}

// Fonction pour calculer la distance de Levenshtein (similarité entre chaînes)
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Fonction pour calculer le pourcentage de similarité
function calculateSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 100 : ((maxLength - distance) / maxLength) * 100;
}

export interface DuplicateGroup<T> {
  items: T[];
  similarity: number;
  reason: string;
}

export class DuplicateDetector {
  // Détecter les doublons d'orateurs
  static findSpeakerDuplicates(speakers: Speaker[], threshold: number = 85): DuplicateGroup<Speaker>[] {
    const duplicateGroups: DuplicateGroup<Speaker>[] = [];
    const processed = new Set<string>();

    if (!speakers || !Array.isArray(speakers)) return duplicateGroups;

    for (let i = 0; i < speakers.length; i++) {
      if (processed.has(speakers[i].id)) continue;

      const currentSpeaker = speakers[i];
      const group: Speaker[] = [currentSpeaker];
      processed.add(currentSpeaker.id);
      let groupMaxSimilarity = 0;

      for (let j = i + 1; j < speakers.length; j++) {
        if (processed.has(speakers[j].id)) continue;

        const otherSpeaker = speakers[j];
        const reasons: string[] = [];
        let maxSimilarity = 0;

        // Vérifier similarité du nom
        const nameSimilarity = calculateSimilarity(
          normalizeName(currentSpeaker.nom),
          normalizeName(otherSpeaker.nom)
        );

        if (nameSimilarity >= threshold) {
          reasons.push(`Nom similaire (${Math.round(nameSimilarity)}%)`);
          maxSimilarity = Math.max(maxSimilarity, nameSimilarity);
        }

        // Vérifier nom exact mais congrégation différente
        if (normalizeName(currentSpeaker.nom) === normalizeName(otherSpeaker.nom) &&
            currentSpeaker.congregation !== otherSpeaker.congregation) {
          reasons.push('Même nom, congrégation différente');
          maxSimilarity = 100;
        }

        // Vérifier même téléphone
        if (currentSpeaker.telephone && otherSpeaker.telephone &&
            currentSpeaker.telephone === otherSpeaker.telephone) {
          reasons.push('Même numéro de téléphone');
          maxSimilarity = 100;
        }

        // Vérifier même photo
        if (currentSpeaker.photoUrl && otherSpeaker.photoUrl &&
            currentSpeaker.photoUrl === otherSpeaker.photoUrl) {
          reasons.push('Même photo');
          maxSimilarity = 100;
        }

        if (reasons.length > 0) {
          group.push(otherSpeaker);
          processed.add(otherSpeaker.id);
          groupMaxSimilarity = Math.max(groupMaxSimilarity, maxSimilarity);
        }
      }

      if (group.length > 1) {
        duplicateGroups.push({
          items: group,
          similarity: groupMaxSimilarity,
          reason: `${group.length} orateurs similaires`
        });
      }
    }

    return duplicateGroups.sort((a, b) => b.similarity - a.similarity);
  }

  // Détecter les doublons d'hôtes
  static findHostDuplicates(hosts: Host[], threshold: number = 85): DuplicateGroup<Host>[] {
    const duplicateGroups: DuplicateGroup<Host>[] = [];
    const processed = new Set<string>();

    if (!hosts || !Array.isArray(hosts)) return duplicateGroups;

    for (let i = 0; i < hosts.length; i++) {
      const hostKey = `${hosts[i].nom}_${hosts[i].telephone}`;
      if (processed.has(hostKey)) continue;

      const currentHost = hosts[i];
      const group: Host[] = [currentHost];
      processed.add(hostKey);
      let groupMaxSimilarity = 0;

      for (let j = i + 1; j < hosts.length; j++) {
        const otherHostKey = `${hosts[j].nom}_${hosts[j].telephone}`;
        if (processed.has(otherHostKey)) continue;

        const otherHost = hosts[j];
        const reasons: string[] = [];
        let maxSimilarity = 0;

        // Vérifier similarité du nom
        const nameSimilarity = calculateSimilarity(
          normalizeName(currentHost.nom),
          normalizeName(otherHost.nom)
        );

        if (nameSimilarity >= threshold) {
          reasons.push(`Nom similaire (${Math.round(nameSimilarity)}%)`);
          maxSimilarity = Math.max(maxSimilarity, nameSimilarity);
        }

        // Vérifier même téléphone
        if (currentHost.telephone && otherHost.telephone &&
            currentHost.telephone === otherHost.telephone) {
          reasons.push('Même numéro de téléphone');
          maxSimilarity = 100;
        }

        // Vérifier même adresse
        if (currentHost.address && otherHost.address &&
            normalizeName(currentHost.address) === normalizeName(otherHost.address)) {
          reasons.push('Même adresse');
          maxSimilarity = Math.max(maxSimilarity, 90);
        }

        // Vérifier même photo
        if (currentHost.photoUrl && otherHost.photoUrl &&
            currentHost.photoUrl === otherHost.photoUrl) {
          reasons.push('Même photo');
          maxSimilarity = 100;
        }

        if (reasons.length > 0) {
          group.push(otherHost);
          processed.add(otherHostKey);
          groupMaxSimilarity = Math.max(groupMaxSimilarity, maxSimilarity);
        }
      }

      if (group.length > 1) {
        duplicateGroups.push({
          items: group,
          similarity: groupMaxSimilarity,
          reason: `${group.length} contacts similaires`
        });
      }
    }

    return duplicateGroups.sort((a, b) => b.similarity - a.similarity);
  }

  // Détecter les doublons de visites
  static findVisitDuplicates(visits: Visit[]): DuplicateGroup<Visit>[] {
    const duplicateGroups: DuplicateGroup<Visit>[] = [];
    const visitMap = new Map<string, Visit[]>();

    if (!visits || !Array.isArray(visits)) return duplicateGroups;

    // Grouper par orateur + date
    visits.forEach(visit => {
      const key = `${visit.id}_${visit.visitDate}`;
      if (!visitMap.has(key)) {
        visitMap.set(key, []);
      }
      visitMap.get(key)!.push(visit);
    });

    // Identifier les groupes avec plus d'une visite
    visitMap.forEach((group, key) => {
      if (group.length > 1) {
        duplicateGroups.push({
          items: group,
          similarity: 100,
          reason: `${group.length} visites identiques (même orateur, même date)`
        });
      }
    });

    return duplicateGroups;
  }

  // Analyse complète des doublons
  static analyzeAllDuplicates(speakers: Speaker[], hosts: Host[], visits: Visit[], archivedVisits: Visit[]) {
    const allVisits = [...(visits || []), ...(archivedVisits || [])];
    
    return {
      speakers: this.findSpeakerDuplicates(speakers),
      hosts: this.findHostDuplicates(hosts),
      visits: this.findVisitDuplicates(allVisits),
      summary: {
        totalSpeakerDuplicates: this.findSpeakerDuplicates(speakers).reduce((sum, group) => sum + group.items.length - 1, 0),
        totalHostDuplicates: this.findHostDuplicates(hosts).reduce((sum, group) => sum + group.items.length - 1, 0),
        totalVisitDuplicates: this.findVisitDuplicates(allVisits).reduce((sum, group) => sum + group.items.length - 1, 0)
      }
    };
  }

  // Suggestions de nettoyage automatique
  static getCleanupSuggestions(speakers: Speaker[], hosts: Host[], visits: Visit[], archivedVisits: Visit[]) {
    const analysis = this.analyzeAllDuplicates(speakers, hosts, visits, archivedVisits);
    const suggestions: string[] = [];

    if (analysis.summary.totalSpeakerDuplicates > 0) {
      suggestions.push(`${analysis.summary.totalSpeakerDuplicates} orateur(s) en doublon détecté(s)`);
    }

    if (analysis.summary.totalHostDuplicates > 0) {
      suggestions.push(`${analysis.summary.totalHostDuplicates} contact(s) d'accueil en doublon détecté(s)`);
    }

    if (analysis.summary.totalVisitDuplicates > 0) {
      suggestions.push(`${analysis.summary.totalVisitDuplicates} visite(s) en doublon détectée(s)`);
    }

    return {
      suggestions,
      hasIssues: suggestions.length > 0,
      analysis
    };
  }
}