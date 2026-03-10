# Résumé des Corrections pour Greenstone

## Problème
L'application envoyait des paramètres invalides (`q` et `limit`) à l'API Greenstone OAI-PMH, ce qui provoquait une erreur "bad argument" dans la console.

## Cause
Le protocole OAI-PMH (utilisé par Greenstone) ne supporte pas les paramètres personnalisés comme `q` (recherche) et `limit` (limite de résultats). Ces paramètres sont spécifiques à d'autres API mais ne sont pas valides pour OAI-PMH.

## Solutions Appliquées

### 1. Fichier: `src/app/features/collection/collection.ts`
**Lignes 75-111** - Méthode `fetchRecords()`
- **Avant**: Ajoutait les paramètres `q` et `limit` à l'URL OAI-PMH
- **Après**: 
  - Supprime les paramètres invalides `q` et `limit`
  - Utilise uniquement les paramètres OAI-PMH valides: `from` et `until` (pour la pagination)
  - Ajoute des commentaires expliquant que OAI-PMH ne supporte pas ces paramètres

### 2. Fichier: `src/app/features/search/search.ts`
**Lignes 139-170** - Méthode `onSubmit()`
- **Avant**: Passait tous les paramètres du formulaire (y compris `q` et `limit`) aux collections Greenstone
- **Après**: 
  - Filtre les paramètres `q` et `limit` lorsque la source est Greenstone
  - Conserve uniquement les paramètres OAI-PMH valides
  - Ajoute des commentaires expliquant la restriction

## Paramètres OAI-PMH Valides

Greenstone OAI-PMH supporte les paramètres suivants:
- `verb`: ListRecords, ListSets, Identify, GetRecord
- `metadataPrefix`: oai_dc, oai_qdc, etc.
- `set`: Nom de la collection
- `from`: Date de début (pour la pagination temporelle)
- `until`: Date de fin (pour la pagination temporelle)
- `resumptionToken`: Pour la pagination continue

## Paramètres Non-Supportés

Les paramètres suivants ne sont **pas** supportés par OAI-PMH:
- `q`: Recherche texte
- `limit`: Limite de résultats
- `offset`: Décalage de résultats
- `sort`: Tri des résultats

## Impact

- ✅ Plus d'erreurs "bad argument" dans la console
- ✅ Les requêtes Greenstone fonctionnent correctement
- ✅ La pagination côté client fonctionne toujours (filtres et tri locaux)
- ⚠️ La recherche texte (`q`) n'est plus disponible pour Greenstone (limitation du protocole OAI-PMH)

## Recommandations

Si la recherche texte est nécessaire pour Greenstone, il faudra:
1. Utiliser une autre API de Greenstone (ex: l'API de recherche Greenstone native)
2. Ou implémenter une recherche côté client après avoir récupéré tous les résultats
3. Ou utiliser un autre protocole que OAI-PMH

## Fichiers Modifiés

1. `src/app/features/collection/collection.ts`
2. `src/app/features/search/search.ts`

## Test

Pour tester les corrections:
1. Lancer l'application: `ng serve`
2. Accéder à une collection Greenstone via la page de recherche
3. Vérifier que:
   - Aucune erreur "bad argument" n'apparaît dans la console
   - Les résultats s'affichent correctement
   - La pagination fonctionne
