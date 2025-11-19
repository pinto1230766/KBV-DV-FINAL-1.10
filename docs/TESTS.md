# Tests Unitaires

Ce projet utilise **Vitest** pour les tests unitaires.

## Lancer les tests

Pour lancer tous les tests :
```bash
npm test
```

Pour lancer les tests en mode watch (surveillance continue) :
```bash
npx vitest
```

Pour lancer les tests avec couverture de code (nécessite l'installation de `@vitest/coverage-v8`) :
```bash
npx vitest run --coverage
```

## Structure des tests

Les fichiers de tests doivent être placés à côté des fichiers qu'ils testent, avec l'extension `.test.ts` ou `.test.tsx`.

Exemple :
- `utils/uuid.ts` (Code source)
- `utils/uuid.test.ts` (Test unitaire)

## Configuration

La configuration de Vitest se trouve dans `vite.config.ts`.
L'environnement de test est configuré pour simuler un navigateur (`jsdom`) via le fichier `setupTests.ts`.

## Exemple de test

```typescript
import { describe, it, expect } from 'vitest';
import { maFonction } from './maFonction';

describe('maFonction', () => {
  it('devrait retourner vrai', () => {
    expect(maFonction()).toBe(true);
  });
});
```
