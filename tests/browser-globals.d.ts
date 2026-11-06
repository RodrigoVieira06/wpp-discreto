import type { Alias, Settings } from '../src/settings';

declare global {
  const stored: { settings: Settings; aliases: Alias[] };
  interface Window {
    failNextSave: boolean;
    expectedMessages: Record<string, string>;
    expectedLanguage: string;
    expectedSaveLabel: string;
  }
}
