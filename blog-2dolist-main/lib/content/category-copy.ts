import type { Category } from '@/types/content';

/**
 * Category labels and descriptions are intentionally passed through from the API.
 * Keep project-specific category overrides out of the front unless they are made
 * explicit in site configuration.
 */
export const withConfiguredShortCategoryCopy = (category: Category): Category => category;

export const withConfiguredLongCategoryCopy = (category: Category): Category => category;
