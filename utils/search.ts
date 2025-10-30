import { Speaker, Visit, Host, PublicTalk } from '../types';

export interface SearchResult {
  type: 'speaker' | 'visit' | 'host' | 'talk';
  item: Speaker | Visit | Host | PublicTalk;
  score: number;
  matches: string[];
}

class SearchEngine {
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private calculateScore(query: string, text: string): number {
    const normalizedQuery = this.normalizeText(query);
    const normalizedText = this.normalizeText(text);
    
    if (normalizedText === normalizedQuery) return 100;
    if (normalizedText.startsWith(normalizedQuery)) return 90;
    if (normalizedText.includes(normalizedQuery)) return 70;
    
    // Recherche de mots partiels
    const queryWords = normalizedQuery.split(' ').filter(w => w.length > 1);
    const textWords = normalizedText.split(' ');
    
    let matchCount = 0;
    for (const queryWord of queryWords) {
      for (const textWord of textWords) {
        if (textWord.includes(queryWord)) {
          matchCount++;
          break;
        }
      }
    }
    
    return queryWords.length > 0 ? (matchCount / queryWords.length) * 50 : 0;
  }

  private searchInSpeaker(speaker: Speaker, query: string): SearchResult | null {
    const matches: string[] = [];
    let totalScore = 0;

    // Recherche dans le nom
    const nameScore = this.calculateScore(query, speaker.nom);
    if (nameScore > 0) {
      matches.push('nom');
      totalScore += nameScore * 2; // Poids plus élevé pour le nom
    }

    // Recherche dans la congrégation
    const congregationScore = this.calculateScore(query, speaker.congregation);
    if (congregationScore > 0) {
      matches.push('congregation');
      totalScore += congregationScore;
    }

    // Recherche dans les tags
    if (speaker.tags) {
      for (const tag of speaker.tags) {
        const tagScore = this.calculateScore(query, tag);
        if (tagScore > 0) {
          matches.push('tags');
          totalScore += tagScore * 0.5;
          break;
        }
      }
    }

    return totalScore > 10 ? {
      type: 'speaker',
      item: speaker,
      score: totalScore,
      matches
    } : null;
  }

  private searchInVisit(visit: Visit, query: string): SearchResult | null {
    const matches: string[] = [];
    let totalScore = 0;

    // Recherche dans le nom de l'orateur
    const nameScore = this.calculateScore(query, visit.nom);
    if (nameScore > 0) {
      matches.push('orateur');
      totalScore += nameScore * 2;
    }

    // Recherche dans la congrégation
    const congregationScore = this.calculateScore(query, visit.congregation);
    if (congregationScore > 0) {
      matches.push('congregation');
      totalScore += congregationScore;
    }

    // Recherche dans le thème du discours
    const themeScore = this.calculateScore(query, visit.talkTheme);
    if (themeScore > 0) {
      matches.push('theme');
      totalScore += themeScore;
    }

    // Recherche dans l'hôte
    const hostScore = this.calculateScore(query, visit.host);
    if (hostScore > 0) {
      matches.push('hote');
      totalScore += hostScore;
    }

    return totalScore > 10 ? {
      type: 'visit',
      item: visit,
      score: totalScore,
      matches
    } : null;
  }

  private searchInHost(host: Host, query: string): SearchResult | null {
    const matches: string[] = [];
    let totalScore = 0;

    // Recherche dans le nom
    const nameScore = this.calculateScore(query, host.nom);
    if (nameScore > 0) {
      matches.push('nom');
      totalScore += nameScore * 2;
    }

    // Recherche dans l'adresse
    if (host.adresse) {
      const addressScore = this.calculateScore(query, host.adresse);
      if (addressScore > 0) {
        matches.push('adresse');
        totalScore += addressScore;
      }
    }

    // Recherche dans les tags
    if (host.tags) {
      for (const tag of host.tags) {
        const tagScore = this.calculateScore(query, tag);
        if (tagScore > 0) {
          matches.push('tags');
          totalScore += tagScore * 0.5;
          break;
        }
      }
    }

    return totalScore > 10 ? {
      type: 'host',
      item: host,
      score: totalScore,
      matches
    } : null;
  }

  private searchInTalk(talk: PublicTalk, query: string): SearchResult | null {
    const matches: string[] = [];
    let totalScore = 0;

    // Recherche dans le numéro
    const numberScore = this.calculateScore(query, talk.number.toString());
    if (numberScore > 0) {
      matches.push('numero');
      totalScore += numberScore * 1.5;
    }

    // Recherche dans le thème
    const themeScore = this.calculateScore(query, talk.theme);
    if (themeScore > 0) {
      matches.push('theme');
      totalScore += themeScore * 2;
    }

    return totalScore > 10 ? {
      type: 'talk',
      item: talk,
      score: totalScore,
      matches
    } : null;
  }

  search(
    query: string,
    data: {
      speakers: Speaker[];
      visits: Visit[];
      hosts: Host[];
      talks: PublicTalk[];
    },
    options: {
      types?: ('speaker' | 'visit' | 'host' | 'talk')[];
      limit?: number;
    } = {}
  ): SearchResult[] {
    if (!query.trim()) return [];

    const { types = ['speaker', 'visit', 'host', 'talk'], limit = 50 } = options;
    const results: SearchResult[] = [];

    // Recherche dans les orateurs
    if (types.includes('speaker')) {
      for (const speaker of data.speakers) {
        const result = this.searchInSpeaker(speaker, query);
        if (result) results.push(result);
      }
    }

    // Recherche dans les visites
    if (types.includes('visit')) {
      for (const visit of data.visits) {
        const result = this.searchInVisit(visit, query);
        if (result) results.push(result);
      }
    }

    // Recherche dans les hôtes
    if (types.includes('host')) {
      for (const host of data.hosts) {
        const result = this.searchInHost(host, query);
        if (result) results.push(result);
      }
    }

    // Recherche dans les discours
    if (types.includes('talk')) {
      for (const talk of data.talks) {
        const result = this.searchInTalk(talk, query);
        if (result) results.push(result);
      }
    }

    // Trier par score et limiter les résultats
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

export const searchEngine = new SearchEngine();