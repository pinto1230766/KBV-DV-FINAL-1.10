/**
 * Utilitaires pour la manipulation sécurisée des tableaux
 */

/**
 * Supprime un élément d'un tableau de manière sûre sans laisser de trous
 * @param array - Le tableau source
 * @param index - L'index de l'élément à supprimer
 * @returns Un nouveau tableau sans l'élément à l'index spécifié
 */
export function safeDelete<T>(array: T[], index: number): T[] {
    if (!Array.isArray(array)) {
        console.warn('safeDelete attend un tableau en premier argument');
        return [];
    }
    
    if (index < 0 || index >= array.length) {
        console.warn(`Index ${index} hors limites`);
        return [...array];
    }
    
    return [...array.slice(0, index), ...array.slice(index + 1)];
}

/**
 * Met à jour un élément d'un tableau de manière immuable
 * @param array - Le tableau source
 * @param index - L'index de l'élément à mettre à jour
 * @param updater - Fonction de mise à jour ou nouvelle valeur
 * @returns Un nouveau tableau avec l'élément mis à jour
 */
export function updateArrayItem<T>(
    array: T[], 
    index: number, 
    updater: ((item: T) => T) | T
): T[] {
    if (!Array.isArray(array)) {
        console.warn('updateArrayItem attend un tableau en premier argument');
        return [];
    }
    
    if (index < 0 || index >= array.length) {
        console.warn(`Index ${index} hors limites`);
        return [...array];
    }
    
    const newItem = typeof updater === 'function' 
        ? (updater as Function)(array[index])
        : updater;
    
    return [
        ...array.slice(0, index),
        newItem,
        ...array.slice(index + 1)
    ];
}

/**
 * Évite les doublons dans un tableau
 * @param array - Tableau source
 * @param key - Clé pour identifier les doublons (optionnel)
 * @returns Un nouveau tableau sans doublons
 */
export function deduplicate<T>(array: T[], key?: keyof T): T[] {
    if (!Array.isArray(array)) return [];
    
    if (key) {
        const seen = new Set();
        return array.filter(item => {
            const value = item[key];
            if (seen.has(value)) return false;
            seen.add(value);
            return true;
        });
    }
    
    return [...new Set(array)];
}

/**
 * Filtre les valeurs nulles ou indéfinies d'un tableau
 * @param array - Tableau source
 * @returns Un nouveau tableau sans les valeurs nulles ou indéfinies
 */
export function filterFalsy<T>(array: (T | null | undefined)[]): T[] {
    return array.filter((item): item is T => item !== null && item !== undefined);
}

/**
 * Trouve l'index d'un élément dans un tableau avec une fonction de recherche
 * @param array - Tableau source
 * @param predicate - Fonction de test
 * @returns L'index de l'élément trouvé, ou -1 si non trouvé
 */
export function findIndexSafe<T>(
    array: T[], 
    predicate: (value: T, index: number, obj: T[]) => boolean
): number {
    if (!Array.isArray(array) || typeof predicate !== 'function') return -1;
    return array.findIndex(predicate);
}

/**
 * Trouve un élément dans un tableau de manière sécurisée
 * @param array - Tableau source
 * @param predicate - Fonction de test
 * @returns L'élément trouvé ou undefined
 */
export function findSafe<T>(
    array: T[], 
    predicate: (value: T, index: number, obj: T[]) => boolean
): T | undefined {
    if (!Array.isArray(array) || typeof predicate !== 'function') return undefined;
    return array.find(predicate);
}

/**
 * Mappe un tableau de manière sécurisée
 * @param array - Tableau source
 * @param callback - Fonction de mappage
 * @returns Un nouveau tableau avec les éléments transformés
 */
export function mapSafe<T, U>(
    array: T[], 
    callback: (value: T, index: number, array: T[]) => U
): U[] {
    if (!Array.isArray(array) || typeof callback !== 'function') return [];
    return array.map(callback);
}

/**
 * Filtre un tableau de manière sécurisée
 * @param array - Tableau source
 * @param predicate - Fonction de test
 * @returns Un nouveau tableau avec les éléments qui passent le test
 */
export function filterSafe<T>(
    array: T[], 
    predicate: (value: T, index: number, array: T[]) => boolean
): T[] {
    if (!Array.isArray(array) || typeof predicate !== 'function') return [];
    return array.filter(predicate);
}

/**
 * Réduit un tableau de manière sécurisée
 * @param array - Tableau source
 * @param callback - Fonction de réduction
 * @param initialValue - Valeur initiale
 * @returns La valeur réduite
 */
export function reduceSafe<T, U>(
    array: T[], 
    callback: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, 
    initialValue: U
): U {
    if (!Array.isArray(array) || typeof callback !== 'function') return initialValue;
    return array.reduce(callback, initialValue);
}

/**
 * Vérifie si un tableau contient un élément
 * @param array - Tableau source
 * @param searchElement - Élément à rechercher
 * @param fromIndex - Index de départ (optionnel)
 * @returns true si l'élément est trouvé, false sinon
 */
export function includesSafe<T>(
    array: T[], 
    searchElement: T, 
    fromIndex?: number
): boolean {
    if (!Array.isArray(array)) return false;
    return array.includes(searchElement, fromIndex);
}

export default {
    safeDelete,
    updateArrayItem,
    deduplicate,
    filterFalsy,
    findIndexSafe,
    findSafe,
    mapSafe,
    filterSafe,
    reduceSafe,
    includesSafe
};
