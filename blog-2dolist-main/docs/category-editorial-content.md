# Contenu éditorial des catégories

Le front applique les textes de secours définis dans `lib/content/category-copy.ts` **uniquement** lorsqu'un champ renvoyé par l'API est vide. Les contenus existants et les chemins historiques restent donc prioritaires.

L'API renvoie déjà `excerpt`, `contentHtml`, `contentJson`, `metaTitle`, `metaDescription`, `canonicalUrl` et `isIndexable`; aucune modification d'API n'est nécessaire. Elle peut aussi fournir `h1`, désormais pris en charge par le front.

Pour enregistrer les valeurs de base en base de données, exécuter d'abord une simulation :

```bash
API_BASE_URL=https://api.example.test npm run content:seed-categories
```

Puis appliquer avec un jeton d'administration :

```bash
API_BASE_URL=https://api.example.test ADMIN_API_TOKEN=… npm run content:seed-categories -- --write
```

Le script envoie uniquement les champs actuellement vides. Il ne modifie ni les chemins de catégories, ni les articles, ni leur import.
