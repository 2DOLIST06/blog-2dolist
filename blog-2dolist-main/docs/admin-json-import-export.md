# Import et export JSON d’un article dans l’admin

L’éditeur de création et de modification propose, au-dessus du formulaire, les boutons **Importer JSON** et **Exporter JSON**. La fenêtre permet de coller un document, de choisir un fichier `.json`, de valider, d’appliquer, de copier ou de télécharger le JSON. L’application d’un import ne sauvegarde jamais l’article : il faut contrôler le formulaire puis cliquer sur **Enregistrer**.

## Format

L’objet racine représente directement l’article. Les champs obligatoires sont :

- `path` : chemin public commençant par `/`, par exemple `/2026/01/10/exemple/` ;
- `slug` et `title` : chaînes non vides ;
- au moins l’un de `contentHtml` (chaîne) ou `contentJson` (objet).

Tous les autres champs sont optionnels à l’import : `old_url`, `locale`, `status`, `isActive`, `isIndexable`, `h1`, `excerpt`, `chapoHtml`, `faqJson`, `metaTitle`, `metaDescription`, `canonicalUrl`, `robots`, `publishedAt`, `updatedAt`, `categoryName`, `categorySlug`, `authorName`, `authorSlug`, `coverImageUrl`, `coverImageAlt` et `tags`. L’export contient ces champs (sauf `old_url` lorsqu’il n’existe pas).

```json
{
  "old_url": "https://blog.2dolist.fr/2026/01/10/exemple/",
  "path": "/2026/01/10/exemple/",
  "slug": "exemple",
  "locale": "fr",
  "status": "PUBLISHED",
  "isActive": true,
  "isIndexable": true,
  "title": "Titre de l’article",
  "h1": "Titre H1",
  "excerpt": "Résumé court",
  "chapoHtml": "<p>Chapô</p>",
  "contentHtml": "<p>Contenu</p>",
  "contentJson": { "version": 1, "source": "json-import", "blocks": [] },
  "faqJson": [{ "question": "Question ?", "answer": "Réponse." }],
  "metaTitle": "Title SEO",
  "metaDescription": "Description SEO",
  "canonicalUrl": "https://blog.2dolist.fr/2026/01/10/exemple/",
  "robots": "index,follow",
  "publishedAt": "2026-01-10T09:00:00.000Z",
  "updatedAt": "2026-01-10T09:00:00.000Z",
  "categoryName": "Avion",
  "categorySlug": "avion",
  "authorName": "Nicolas Braun",
  "authorSlug": "nicolas-braun",
  "coverImageUrl": "https://cdn.example/image.jpg",
  "coverImageAlt": "Texte alternatif",
  "tags": ["bapteme-avion", "cote-azur"]
}
```

## Règles de validation

- Le blog est uniquement français : `locale` est omise ou vaut strictement `fr`.
- `path` reste la source de vérité. Il est conservé exactement, sans conversion en `/articles/[slug]`. Un préfixe `/fr` est refusé et n’est jamais ajouté.
- Si `canonicalUrl` est renseignée, elle doit être une URL absolue dont le pathname est exactement `path`.
- `status`, s’il est fourni, vaut `DRAFT` ou `PUBLISHED`.
- `contentJson`, s’il est fourni, est un objet ; `tags` est un tableau de chaînes ; `faqJson` est un tableau d’objets contenant des chaînes `question` et `answer`.
- Une catégorie ou un auteur absent des options génère un avertissement. Le front ne les crée pas : il faut les créer dans l’admin avant de sauvegarder.

## HTML, widgets GetYourGuide et FAQ

Les blocs `contentJson.blocks` de type `html` sont hydratés dans l’éditeur avec leur propriété `html` et restent modifiables. Les attributs `data-*`, notamment ceux de GetYourGuide, sont conservés. Les balises `script`, gestionnaires `on*` et URL `javascript:` sont retirés lors de l’édition d’un bloc HTML ; aucun HTML ni script n’est exécuté pendant l’import. Le script global GetYourGuide reste exclusivement géré par le layout.

`faqJson` remplit seulement le module FAQ. Il n’est ni injecté ni recopié dans `contentHtml`, qui reste inchangé, afin d’éviter toute duplication.

## Workflows recommandés

### Créer depuis un JSON

1. Ouvrir **Créer un article**, puis **Importer JSON**.
2. Coller le JSON ou choisir un fichier, puis cliquer sur **Valider**.
3. Corriger les erreurs bloquantes et examiner les avertissements de relations.
4. Cliquer sur **Appliquer**, relire tous les champs, puis **Enregistrer**.

### Exporter ou mettre à jour un article

1. Ouvrir l’article et modifier éventuellement ses champs.
2. Cliquer sur **Exporter JSON** : le document reflète l’état courant, y compris les modifications non sauvegardées.
3. Copier le texte ou télécharger le fichier `.json`.
4. Pour remplacer le formulaire d’un article existant, importer et appliquer un JSON : son identifiant interne est conservé et aucune sauvegarde automatique n’a lieu.
