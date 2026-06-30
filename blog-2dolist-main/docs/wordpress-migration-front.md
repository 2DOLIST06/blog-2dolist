# Migration WordPress — conservation des URLs côté front

Ce front Next.js est préparé pour servir les articles importés depuis WordPress sur leurs URLs historiques exactes, sans forcer une structure `/articles/[slug]`.

## Principe

Chaque article peut contenir un champ `path` renvoyé par l'API. Lorsque ce champ existe, le front l'utilise comme URL publique prioritaire pour les liens internes et les pages article. Pour le sitemap et les metadata, `canonicalUrl` reste prioritaire lorsqu'il est fourni.

Exemples :

- `path: "/mon-article/"` → article servi sur `/mon-article/`
- `path: "/blog/mon-article/"` → article servi sur `/blog/mon-article/`
- `path: "/categorie/article/"` → article servi sur `/categorie/article/`

Les routes historiques Next.js `/articles/[slug]` et `/fr/articles/[slug]` restent actives en compatibilité.

## Champs API nécessaires

Pour une migration SEO propre, chaque post devrait exposer :

- `slug` : identifiant court de l'article.
- `path` : chemin public WordPress exact, idéalement avec le slash final si WordPress l'utilisait.
- `canonicalUrl` : URL canonique absolue si elle doit être imposée.
- `locale` : `en` ou `fr`.
- `translations` : traductions disponibles. Une traduction est conservée si elle expose au moins une URL exploitable : `canonicalUrl`, `path` ou, en dernier recours seulement, `slug`.
- `hreflang` : URLs hreflang absolues à utiliser telles quelles.
- `publishedAt` / `updatedAt` : dates utilisées par les metadata et le sitemap.

## Endpoint back attendu

Le front appelle un endpoint de résolution par chemin exact :

```txt
GET /api/posts/by-path?path=${encodedPath}&locale=${locale}
```

Exemple :

```txt
GET /api/posts/by-path?path=%2Fblog%2Fmon-article%2F&locale=fr
```

Réponses acceptées côté front :

- `{ "data": { ...post } }`
- `{ "data": { "post": { ...post } } }`
- `{ "post": { ...post } }`

Si l'endpoint n'existe pas encore ou retourne une erreur, le front ne crashe pas : il traite l'article comme introuvable et laisse Next.js rendre la 404/noindex de la page demandée.

## Routes de compatibilité

Les routes suivantes restent disponibles :

- `/articles/[slug]`
- `/fr/articles/[slug]`
- `/blog/[slug]` : tente d'abord de servir le post dont le `path` vaut `/blog/[slug]/`, puis redirige vers `/articles/[slug]` si aucun post n'est trouvé.
- `/blog` : reste redirigée vers `/articles`.

## Liens internes

Les liens internes vers un article doivent passer par l'utilitaire central `getPostHref(post, locale)`.

Règle :

1. si `post.path` existe, utiliser `post.path` ;
2. si le composant manipule une URL absolue et que `canonicalUrl` est disponible, utiliser `canonicalUrl` ;
3. sinon utiliser le fallback Next.js actuel : `/articles/[slug]` ou `/fr/articles/[slug]`.

Pour les liens de traduction, le front ne reconstruit un fallback `/articles/[slug]` ou `/fr/articles/[slug]` que si la traduction n'a ni `path` ni `canonicalUrl`.

## Sitemap

Le sitemap continue à utiliser la priorité suivante :

1. `post.canonicalUrl` si disponible ;
2. sinon `post.path` si disponible ;
3. sinon fallback `/articles/[slug]` ou `/fr/articles/[slug]`.

Ainsi, il ne génère pas d'URL `/articles/[slug]` lorsqu'une URL WordPress exacte est fournie par `path`.

## Configuration du projet

La configuration front centralisée se trouve dans `lib/site/config.ts` et se pilote par variables publiques Next.js :

- `NEXT_PUBLIC_SITE_NAME` : nom public du site, utilisé notamment dans les metadata.
- `NEXT_PUBLIC_SITE_URL` : URL absolue de production, sans slash final.
- `NEXT_PUBLIC_DEFAULT_LOCALE` : locale par défaut des routes sans préfixe. Valeurs acceptées : `en` ou `fr`. Pour un projet français sans préfixe obligatoire, définir `NEXT_PUBLIC_DEFAULT_LOCALE=fr`.

Les routes `/fr/...` continuent explicitement de demander `locale=fr`. Les routes sans préfixe utilisent la locale par défaut configurée pour les appels `getPostByPath`, ce qui permet de servir un projet français sans forcer `en`.

## Points à vérifier avant production

- Le back expose bien `/api/posts/by-path` et recherche sur le chemin exact, slash final inclus si nécessaire.
- Les `path` importés depuis WordPress sont uniques par locale.
- Les `canonicalUrl` pointent vers le domaine final de production.
- Les `hreflang` renvoyés par l'API utilisent les URLs finales exactes et ne nécessitent pas de reconstruction côté front.
- Les anciennes URLs WordPress importantes répondent en 200 dans Next.js.
- Le sitemap de production liste les URLs WordPress exactes attendues.
- Les anciennes redirections WordPress/back/CDN ne contredisent pas les routes Next.js.

- Aucune règle `noindex` globale ne doit être ajoutée : seules les pages article introuvables génèrent une metadata `noIndex`.
- Vérifier un article avec traduction `canonicalUrl` sans `path`, un article avec traduction `path`, puis un article legacy avec seulement `slug`.
