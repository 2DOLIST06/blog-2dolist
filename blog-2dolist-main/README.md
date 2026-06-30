# The Muscle Temple — Frontend Foundation

Base front professionnelle pour un blog musculation/fitness avec **Next.js App Router**, **TypeScript** et **Tailwind CSS**.
Le projet est structuré pour être facilement réutilisable sur d'autres blogs et prêt pour un futur backend séparé.

## Lancer le projet

```bash
npm install
npm run dev
```

Build production :

```bash
npm run build
npm run start
```

Contrôles qualité :

```bash
npm run lint
npm run typecheck
```

---

## Stack technique

- Next.js 15 (App Router)
- TypeScript strict
- Tailwind CSS
- SEO centralisé (metadata, robots, sitemap, JSON-LD)

---

## Architecture

```txt
app/
  (routes et pages)
components/
  blog/        # composants éditoriaux (cards, TOC, author box...)
  layout/      # header, footer, breadcrumbs
  ui/          # briques UI génériques
lib/
  content/     # couche d’accès au contenu (abstraction prête pour API)
  seo/         # helpers SEO réutilisables
data/
  posts.ts     # contenu mock local
  categories.ts
  authors.ts
types/
  content.ts   # modèles Post, Category, Author, Navigation, etc.
  seo.ts
public/
  assets statiques
```

---

## Où brancher le futur backend

La couche à remplacer est principalement :

- `lib/content/repository.ts`

Aujourd’hui, elle lit les fichiers `data/*.ts`.
Demain, vous pouvez conserver la même interface (`getAllPosts`, `getPostBySlug`, etc.) et remplacer l’implémentation par des appels API/SDK CMS.

Cela évite de recoder les pages et composants.

---

## SEO : où gérer

- `lib/seo/metadata.ts` : génération centralisée des metadata (title, description, OG, Twitter, canonical, robots)
- `lib/seo/jsonld.ts` : JSON-LD (BlogPosting + BreadcrumbList)
- `app/robots.ts` : robots.txt
- `app/sitemap.ts` : sitemap.xml

---

## Où ajouter des articles

- `data/posts.ts`
- `data/categories.ts`
- `data/authors.ts`

Les pages se mettent à jour automatiquement via la couche `contentRepository`.

---

## Pages incluses

- `/` Accueil (hero, articles mis en avant, catégories, dernier article, newsletter)
- `/articles` Liste des articles
- `/articles/[slug]` Article détaillé (breadcrumb, TOC, auteur, articles liés, JSON-LD)
- `/categories/[slug]` Page catégorie
- `/authors/[slug]` Page auteur
- `/about` À propos
- `/contact` Contact
- `404` personnalisée

---

## Déploiement Vercel

Le projet est prêt à être déployé tel quel sur Vercel (build Next.js standard, App Router, routes statiques/dynamiques).

---

## Espace admin (sans authentification front)

Routes admin disponibles :

- `/admin`
- `/admin/posts`
- `/admin/posts/new`
- `/admin/posts/[slug]/edit`

Route de compatibilité :

- `/admin/login` redirige automatiquement vers `/admin/posts`.

### Authentification

Variables recommandées :

```bash
NEXT_PUBLIC_API_URL=https://the-muscle-temple-api-1.onrender.com
```

Token serveur requis pour les routes API admin (pas de login utilisateur côté front) :

```bash
ADMIN_ACCESS_TOKEN=une-cle-longue-aleatoire-et-secrete
```

### Fonctionnalités admin incluses

- Dashboard admin
- Liste des articles
- Création / édition d’article
- Upload image (base64 pour preview)
- Gestion publication (draft/published)
- Champs SEO complets : title, description, canonical, OG image, noindex

> Note: cette version admin est orientée front-first. Les créations/modifications sont stockées côté navigateur (localStorage) en attendant le backend/CMS.

## Configuration CMS (blog)

- Variable front: `NEXT_PUBLIC_CMS_API_URL`
- Exemple local: `NEXT_PUBLIC_CMS_API_URL=http://localhost:3001`
- Exemple prod: `NEXT_PUBLIC_CMS_API_URL=https://cms.my-domain.com`
- Changer simplement la valeur par environnement (local, preview, production) sans modifier le code.

