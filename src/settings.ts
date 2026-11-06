export type LanguagePreference = 'auto' | 'pt_BR' | 'en';

export interface Settings {
  enabled: boolean;
  aliasesEnabled: boolean;
  language: LanguagePreference;
  blurPreviews: boolean;
  blurChat: boolean;
  visibleCount: number;
  blurStrength: number;
}

export interface Alias {
  original: string;
  alias: string;
}

export const defaults: Readonly<Settings> = Object.freeze({
  enabled: true,
  aliasesEnabled: true,
  language: 'auto',
  blurPreviews: false,
  blurChat: false,
  visibleCount: 4,
  blurStrength: 8,
});

export const normalizeName = (value: unknown): string =>
  typeof value === 'string' ? value.normalize('NFC').trim() : '';

const bounded = (value: unknown, fallback: number, min: number, max: number): number =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, Math.round(value)))
    : fallback;

export function settings(value: unknown = {}): Settings {
  const input = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    enabled: input.enabled !== false,
    aliasesEnabled: input.aliasesEnabled !== false,
    language: input.language === 'pt_BR' || input.language === 'en' ? input.language : 'auto',
    blurPreviews: input.blurPreviews === true,
    blurChat: input.blurChat === true,
    visibleCount: bounded(input.visibleCount, defaults.visibleCount, 0, 12),
    blurStrength: bounded(input.blurStrength, defaults.blurStrength, 4, 16),
  };
}

export function aliases(value: unknown): Alias[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap((entry: unknown) => {
    if (!entry || typeof entry !== 'object') return [];
    const input = entry as Record<string, unknown>;
    const original = normalizeName(input.original).slice(0, 200);
    const alias = normalizeName(input.alias).slice(0, 100);
    if (!original || !alias || seen.has(original)) return [];
    seen.add(original);
    return [{ original, alias }];
  });
}
