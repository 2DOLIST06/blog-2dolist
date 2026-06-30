# FRONT API INTEGRATION — The Muscle Temple

## Source de vérité
- Backend target: `https://the-muscle-temple-api-1.onrender.com`
- Contrat dérivé du code backend (routes/validation/schema), car la vérification live depuis cet environnement renvoie `403 CONNECT tunnel` sur les URLs Render testées.
- Si une info n’est pas vérifiable runtime: `INCONNU`.

---

## 0) Vérification runtime effectuée (et limite)

Tentatives faites:
- `GET /openapi.json`, `/swagger`, `/docs`, `/api/health`, `/api/posts`, etc.
- Résultat ici: `403 CONNECT tunnel` (donc inspection runtime impossible depuis ce poste).

Conclusion:
- OpenAPI/Swagger: **INCONNU (runtime)**.
- Contrat ci-dessous = **contrat code** (fiable côté repo), à valider une fois accès réseau direct OK.

---

## 1) Base URL & headers globaux

### Base URL prod
`https://the-muscle-temple-api-1.onrender.com`

### Headers
- Public: `Content-Type: application/json` (si body)
- Admin protégé:
  - `Authorization: Bearer <JWT>`
  - `Content-Type: application/json`

### CORS
Le backend accepte uniquement les origines listées dans `CORS_ORIGIN` (CSV), methods `GET,POST,PUT,PATCH,DELETE,OPTIONS`, credentials `true`.
➡️ Mettre ton domaine Vercel dans `CORS_ORIGIN`.

---

## 2) Auth token admin

### Login
`POST /admin-api/auth/login`

### Body
```json
{
  "email": "admin@muscletemple.com",
  "password": "string_min_8"
}
```

### Response
```json
{
  "data": {
    "token": "JWT_TOKEN",
    "user": {
      "id": "cuid",
      "email": "admin@muscletemple.com",
      "role": "ADMIN",
      "displayName": "Admin"
    }
  }
}
```

### Expiration
Access token: 12h

### Refresh token
INCONNU/absent (aucune route refresh trouvée dans le code)

### Endpoints protégés
Tous les `/admin-api/*` sauf `/admin-api/auth/login`.

### RBAC
`POST /admin-api/users` réservé rôle `ADMIN`.

Le reste du scope admin = JWT valide requis.

---

## 3) Endpoints validés

### Public (`/api`)
- `GET /api/health`
- `GET /api/posts?page=1&limit=10`
- `GET /api/posts/:slug`
- `GET /api/categories`
- `GET /api/categories/:slug/posts`
- `GET /api/authors`
- `GET /api/authors/:slug/posts`
- `GET /api/seo/pages/:key`

### Admin (`/admin-api`)
- `POST /admin-api/auth/login`
- `GET /admin-api/me`
- `GET /admin-api/dashboard`
- `GET /admin-api/posts`
- `POST /admin-api/posts`
- `PUT /admin-api/posts/:id`
- `DELETE /admin-api/posts/:id`
- `GET /admin-api/categories`
- `POST /admin-api/categories`
- `PUT /admin-api/categories/:id`
- `DELETE /admin-api/categories/:id`
- `GET /admin-api/authors`
- `POST /admin-api/authors`
- `PUT /admin-api/authors/:id`
- `DELETE /admin-api/authors/:id`
- `GET /admin-api/tags`
- `POST /admin-api/tags`
- `GET /admin-api/media`
- `POST /admin-api/media`
- `GET /admin-api/seo/page/:key`
- `PUT /admin-api/seo/page/:key`
- `POST /admin-api/users` (ADMIN only)

---

## 4) Mapping exact besoins front

| Besoin front | Endpoint | Notes |
|---|---|---|
| Liste articles publiés | `GET /api/posts` | pagination `page/limit` |
| Détail article par slug | `GET /api/posts/:slug` | inclut auteur/catégorie/tags/seo + `relatedPosts` |
| Catégories | `GET /api/categories` | avec `_count.posts` |
| Articles d’une catégorie | `GET /api/categories/:slug/posts` | |
| Auteurs | `GET /api/authors` | avec `_count.posts` |
| Articles d’un auteur | `GET /api/authors/:slug/posts` | |
| SEO page statique | `GET /api/seo/pages/:key` | |
| Liste posts admin (draft/published) | `GET /admin-api/posts` | pas de filtre query natif |
| Créer article | `POST /admin-api/posts` | `status` dans payload |
| Modifier article | `PUT /admin-api/posts/:id` | publish/unpublish via `status` |
| Supprimer article | `DELETE /admin-api/posts/:id` | |
| CRUD catégories | `/admin-api/categories...` | |
| CRUD auteurs | `/admin-api/authors...` | |
| Upload image fichier | INCONNU / Non implémenté | pas de multipart |
| Média via URL | `POST /admin-api/media` | référence URL uniquement |

---

## 5) Schémas de données (requests)

### SEO input (réutilisé)
```json
{
  "title": "string max 70 ou vide",
  "description": "string max 160 ou vide",
  "canonicalUrl": "url ou vide",
  "noIndex": false,
  "openGraphImageId": "string ou vide"
}
```

### Post create/update input
```json
{
  "title": "string min 4",
  "slug": "string optionnel",
  "excerpt": "string max 280",
  "contentMarkdown": "string min 10",
  "contentJson": {},
  "status": "DRAFT | PUBLISHED | ARCHIVED",
  "publishedAt": "ISO datetime ou null",
  "readingTimeMinutes": 8,
  "authorId": "string",
  "categoryId": "string ou null",
  "coverImageId": "string ou null",
  "tagIds": ["string"],
  "relatedPostIds": ["string"],
  "seo": {
    "title": "SEO",
    "description": "Desc",
    "canonicalUrl": "",
    "noIndex": false
  }
}
```

### Category create/update input
```json
{
  "name": "string min 2",
  "slug": "string optionnel",
  "description": "string optionnel",
  "seo": {}
}
```

### Author create/update input
```json
{
  "name": "string min 2",
  "slug": "string optionnel",
  "bio": "string optionnel",
  "avatarMediaId": "string ou null",
  "seo": {}
}
```

### Media create input (pas upload)
```json
{
  "url": "URL obligatoire",
  "altText": "string optionnel",
  "caption": "string optionnel",
  "mimeType": "string optionnel",
  "source": "string optionnel"
}
```

### Login input
```json
{
  "email": "email",
  "password": "string min 8"
}
```

---

## 6) Schéma DB (enums + types utiles front)

### Enums
- `UserRole`: `ADMIN | EDITOR`
- `PostStatus`: `DRAFT | PUBLISHED | ARCHIVED`
- `SeoEntityType`: `POST | CATEGORY | AUTHOR | PAGE`

### Dates
`createdAt`, `updatedAt`, `publishedAt`: DateTime Prisma (ISO 8601 en JSON)

---

## 7) Pagination / tri / filtres

### Pagination
`GET /api/posts`:
- query `page` (default 1)
- query `limit` (default 10, max 50)

### Tri codé
- `/api/posts`: `publishedAt desc`
- `/api/categories/:slug/posts`: `publishedAt desc`
- `/api/authors/:slug/posts`: `publishedAt desc`
- `/admin-api/posts`: `updatedAt desc`

### Filtres query (autres)
INCONNU/absent (pas de filtre explicite côté query string)

---

## 8) Erreurs HTTP & format

### Explicites dans le code
- `401`: login invalide, token manquant/invalide (Unauthorized)
- `403`: rôle insuffisant (Forbidden)
- `404`: post/category/author/seo non trouvé (selon endpoint)
- `409`: delete category/author si dépendances (posts liés)
- `200/201`: réponses succès (selon Fastify default)

### Format erreur
Souvent:
```json
{ "message": "..." }
```

Pour erreurs validation/framework globales: INCONNU exact (pas de handler global custom visible)

- `422`: INCONNU / non explicite
- `500`: INCONNU / default Fastify

---

## 9) cURL prêts à l’emploi

### Health
```bash
curl "https://the-muscle-temple-api-1.onrender.com/api/health"
```

### Login admin
```bash
curl -X POST "https://the-muscle-temple-api-1.onrender.com/admin-api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@muscletemple.com","password":"YOUR_PASSWORD"}'
```

### Posts publics paginés
```bash
curl "https://the-muscle-temple-api-1.onrender.com/api/posts?page=1&limit=10"
```

### Détail article
```bash
curl "https://the-muscle-temple-api-1.onrender.com/api/posts/my-post-slug"
```

### Create post admin
```bash
curl -X POST "https://the-muscle-temple-api-1.onrender.com/admin-api/posts" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Titre",
    "contentMarkdown":"## Contenu ...",
    "status":"DRAFT",
    "authorId":"AUTHOR_ID",
    "categoryId":"CATEGORY_ID",
    "tagIds":[],
    "relatedPostIds":[],
    "seo":{"title":"SEO","description":"Desc","canonicalUrl":"","noIndex":false}
  }'
```

### Media (URL)
```bash
curl -X POST "https://the-muscle-temple-api-1.onrender.com/admin-api/media" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://cdn.example.com/image.jpg","altText":"image"}'
```

---

## 10) Checklist intégration front (10 étapes max)
1. Définir `NEXT_PUBLIC_API_URL`.
2. Implémenter client public `/api/*`.
3. Implémenter login admin + stockage JWT.
4. Ajouter header `Authorization: Bearer`.
5. Mapper formulaires Post/Category/Author/Media.
6. Gérer pagination `page/limit` sur `/api/posts`.
7. Gérer statuts post (`DRAFT/PUBLISHED/ARCHIVED`) dans admin.
8. Gérer erreurs `401/403/404/409`.
9. Vérifier CORS backend (`CORS_ORIGIN = domaine Vercel`).
10. Vérifier runtime réel (openapi/docs + curl) depuis un poste sans blocage réseau.

---

## 11) Risques / blocages
- Pas de refresh token.
- Pas d’upload fichier natif (multipart absent).
- Pas de `GET /api/categories/:slug` ni `GET /api/authors/:slug` détail seul.
- Pas de format d’erreur unifié garanti pour toutes erreurs framework.
- OpenAPI/Swagger runtime non confirmé (INCONNU).
