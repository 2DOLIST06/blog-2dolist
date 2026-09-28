export interface RawNewsletterPreferences {
  email?: unknown;
  interests?: unknown;
  categories?: unknown;
  selectedCategories?: unknown;
  contentTypes?: unknown;
  content_types?: unknown;
  selectedContentTypes?: unknown;
  regions?: unknown;
  selectedRegions?: unknown;
  frequency?: unknown;
  subscribed?: unknown;
}

export interface NormalizedNewsletterRegion {
  id: string;
  name: string;
  slug?: string;
}

const firstArray = (...values: unknown[]): unknown[] => {
  const value = values.find(Array.isArray);
  return Array.isArray(value) ? value : [];
};

const stringArray = (...values: unknown[]): string[] =>
  firstArray(...values).filter((value): value is string => typeof value === 'string');

const normalizeRegions = (...values: unknown[]): NormalizedNewsletterRegion[] =>
  firstArray(...values).flatMap((value) => {
    if (typeof value === 'string') return [{ id: value, name: value }];
    if (!value || typeof value !== 'object') return [];

    const region = value as { id?: unknown; name?: unknown; slug?: unknown };
    if (typeof region.id !== 'string' || typeof region.name !== 'string') return [];
    return [{
      id: region.id,
      name: region.name,
      ...(typeof region.slug === 'string' ? { slug: region.slug } : {})
    }];
  });

/**
 * Adapts legacy newsletter records to the current frontend contract. Older
 * records can omit collections or expose interests/regions under their former
 * API names; components must never have to account for those wire variants.
 */
export const normalizeNewsletterPreferences = (value: unknown) => {
  const raw: RawNewsletterPreferences = value && typeof value === 'object'
    ? value as RawNewsletterPreferences
    : {};

  return {
    email: typeof raw.email === 'string' ? raw.email : '',
    interests: stringArray(raw.interests, raw.categories, raw.selectedCategories),
    contentTypes: stringArray(raw.contentTypes, raw.content_types, raw.selectedContentTypes),
    regions: normalizeRegions(raw.regions, raw.selectedRegions),
    frequency: typeof raw.frequency === 'string' ? raw.frequency : 'weekly',
    subscribed: typeof raw.subscribed === 'boolean' ? raw.subscribed : true
  };
};

export const normalizeNewsletterRegions = (value: unknown) => normalizeRegions(value);
