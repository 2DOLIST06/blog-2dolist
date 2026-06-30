# Project customization notes

## Legacy demo content cleanup

- The front no longer injects a forced category when the public API does not return one.
- Former category copy helpers were replaced by pass-through helpers. Category titles and descriptions now come from the API unless a future explicit configuration is added.
- Hard-coded demo site names, production domain references, and topic-specific SEO fallbacks in front-facing pages were replaced with centralized site configuration or neutral placeholders.
- Previous demo fallback media for posts and authors was removed. Fallback media now uses the configurable default Open Graph image.
- Header/footer navigation no longer links to a forced topic category.

## Current customization surface

- Public site identity is centralized in `lib/site/config.ts`.
- Use `NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_DEFAULT_META_TITLE`, `NEXT_PUBLIC_DEFAULT_META_DESCRIPTION`, and `NEXT_PUBLIC_DEFAULT_OG_IMAGE` to adapt the project per deployment.
- `DEFAULT_LOCALE` and `SUPPORTED_LOCALES` are exported from the same file for locale-aware front-end code.
- Content-specific copy should come from the API, not from hard-coded front-end fallbacks.
