export type ThemePreference = 'auto' | 'light' | 'dark';

export type LanguagePreference = 'auto' | 'pt_BR' | 'en';

export interface Settings {
  enabled: boolean;
  aliasesEnabled: boolean;
  confirmAliasRemoval: boolean;
  language: LanguagePreference;
  theme: ThemePreference;
  fontSize: number;
  blurPreviews: boolean;
  blurUnreadCounts: boolean;
  blurChat: boolean;
  fullBlur: boolean;
  visibleArea: number;
  blurStrength: number;
  blurImages: boolean;
  blurVideos: boolean;
  blurStickers: boolean;
}

export interface Alias {
  original: string;
  alias: string;
}

export const defaults: Readonly<Settings> = Object.freeze({
  enabled: true,
  aliasesEnabled: true,
  confirmAliasRemoval: true,
  language: 'auto',
  theme: 'auto',
  fontSize: 15,
  blurPreviews: false,
  blurUnreadCounts: false,
  blurChat: false,
  fullBlur: false,
  visibleArea: 40,
  blurStrength: 8,
  blurImages: false,
  blurVideos: false,
  blurStickers: false,
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
    confirmAliasRemoval: input.confirmAliasRemoval !== false,
    language: input.language === 'pt_BR' || input.language === 'en' ? input.language : 'auto',
    theme: input.theme === 'light' || input.theme === 'dark' ? input.theme : 'auto',
    fontSize: bounded(input.fontSize, defaults.fontSize, 14, 18),
    blurPreviews: input.blurPreviews === true,
    blurUnreadCounts: input.blurUnreadCounts === true,
    blurChat: input.blurChat === true,
    fullBlur: input.fullBlur === true || (input.fullBlur === undefined && input.visibleArea === 0),
    visibleArea: bounded(input.visibleArea, defaults.visibleArea, 20, 100),
    blurStrength: bounded(input.blurStrength, defaults.blurStrength, 4, 16),
    blurImages: input.blurImages === true,
    blurVideos: input.blurVideos === true,
    blurStickers: input.blurStickers === true,
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
