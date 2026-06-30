# Project customization checklist

This front-end is now intended to be reusable for a generic WordPress-backed blog.

## Removed or neutralized legacy Body Training elements

- The front no longer injects a forced `musculation` category when the public API does not return it.
- The former strength-training category copy helpers were replaced by pass-through helpers. Category titles and descriptions now come from the API unless a future explicit configuration is added.
- Hard-coded Body Training Guide site names, production domain references, and strength-training SEO fallbacks in front-facing pages were replaced with centralized site configuration or neutral placeholders.
- The previous Unsplash fitness fallback image for posts and authors was removed. Fallback media now uses the configurable default Open Graph image.
- Header/footer navigation no longer links to a forced strength-training category.

## Centralized configurable values

Edit `lib/site/config.ts` or the matching environment variables before production:

- `NEXT_PUBLIC_SITE_NAME` for `SITE_NAME`
- `NEXT_PUBLIC_SITE_URL` for `SITE_URL`
- `NEXT_PUBLIC_DEFAULT_OG_IMAGE` for `DEFAULT_OG_IMAGE`
- `NEXT_PUBLIC_DEFAULT_META_TITLE` for `DEFAULT_META_TITLE`
- `NEXT_PUBLIC_DEFAULT_META_DESCRIPTION` for `DEFAULT_META_DESCRIPTION`
- `DEFAULT_LOCALE` and `SUPPORTED_LOCALES` are exported from the same file for locale-aware front-end code.

## Files to verify before production

- `lib/site/config.ts` for site identity, canonical URL, meta defaults, locales, and default image.
- SEO helpers in `lib/seo/metadata.ts`, `lib/seo/jsonld.ts`, `lib/seo/post-metadata.ts`, and `lib/seo/sitemap.ts`.
- Front pages under `app/`, especially home, about, contact, articles, categories, and authors pages.
- `lib/api/env.ts` for API base URLs. The default API URL is intentionally empty unless configured by environment variables.
- `next.config.ts` if the new WordPress media host differs from the current allowed remote image hosts.

## Remaining legacy elements

- Admin/editor schema names still contain the old internal schema namespace in `components/admin/PostEditorForm.tsx`. This task intentionally did not touch the back/admin area.
- Historical sample data and repository documentation may still mention the previous project. They are not used as front-facing API-rendered content in the migrated WordPress flow, but can be cleaned separately.
