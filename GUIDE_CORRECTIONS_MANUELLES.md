# Guide de Correction Manuelle - constants.ts

## 📋 Résumé

Il reste **3 erreurs TypeScript** dans le fichier `constants.ts` qui nécessitent une correction manuelle car le fichier est trop volumineux (1355 lignes) pour mes outils automatiques.

---

## ✅ Erreur 1 : SpecialDate.description (Ligne ~775)

**Localisation :** Recherchez `description: talk.theme,` dans la fonction `.map(event => {`

**Problème :** `talk.theme` est de type `string | null`, mais `description` attend `string | undefined`

**Code actuel :**

```typescript
return {
    id: event.id,
    date: talk.date,
    name: event.nom,
    type: type,
    description: talk.theme,  // ❌ ERREUR ICI
};
```

**Code corrigé :**

```typescript
return {
    id: event.id,
    date: talk.date,
    name: event.nom,
    type: type,
    description: talk.theme ?? undefined,  // ✅ CORRECTION
};
```

---

## ✅ Erreur 2 : messageTemplates - Langues manquantes (Ligne ~851)

**Localisation :** Recherchez `export const messageTemplates: Record<Language,`

**Problème :** Le type `Language` inclut `'en'` et `'es'`, mais ils ne sont pas définis

**Code actuel :**

```typescript
export const messageTemplates: Record<Language, Record<MessageType, Record<MessageRole, string>>> = {
  fr: {
    // ... tous les templates français
  },
  cv: {
    // ... tous les templates cap-vertiens
  }
  // ❌ Il manque 'en' et 'es'
};
```

**Code corrigé :**
Ajoutez **AVANT** le `};` final de `messageTemplates` :

```typescript
  },
  en: {
    confirmation: { speaker: '', host: '' },
    preparation: { speaker: '', host: '' },
    'reminder-7': { speaker: '', host: '' },
    'reminder-2': { speaker: '', host: '' },
    thanks: { speaker: '', host: '' }
  },
  es: {
    confirmation: { speaker: '', host: '' },
    preparation: { speaker: '', host: '' },
    'reminder-7': { speaker: '', host: '' },
    'reminder-2': { speaker: '', host: '' },
    thanks: { speaker: '', host: '' }
  }
};
```

---

## ✅ Erreur 3 : hostRequestMessageTemplates - Langues manquantes (Ligne ~1124)

**Localisation :** Recherchez `export const hostRequestMessageTemplates: Record<Language, string>`

**Problème :** Même problème, langues `'en'` et `'es'` manquantes

**Code actuel :**

```typescript
export const hostRequestMessageTemplates: Record<Language, string> = {
  fr: '...',
  cv: '...'
  // ❌ Il manque 'en' et 'es'
};
```

**Code corrigé :**

```typescript
export const hostRequestMessageTemplates: Record<Language, string> = {
  fr: '...',
  cv: '...',
  en: '',
  es: ''
};
```

---

## 🎯 Instructions Étape par Étape

1. **Ouvrez** `constants.ts` dans votre éditeur
2. **Utilisez Ctrl+F** pour rechercher chaque section mentionnée ci-dessus
3. **Appliquez** les corrections une par une
4. **Sauvegardez** le fichier
5. **Vérifiez** avec `npx tsc --noEmit` qu'il ne reste plus d'erreurs

---

## ✅ Vérification Finale

Après avoir appliqué toutes les corrections, exécutez :

```bash
npx tsc --noEmit
```

Vous devriez voir **0 erreurs TypeScript** ! 🎉

---

## 📊 Progression Totale

- ✅ **11 erreurs corrigées automatiquement** (73%)
- ✅ **1 erreur corrigée** dans `utils/crypto.ts`
- ⚠️ **3 erreurs à corriger manuellement** dans `constants.ts`

### Total : 15 erreurs → 12 corrigées → 3 restantes (80% de progression)
