import type { Alias, Settings } from '../src/settings';

declare global {
  const messageListeners: Set<
    (request: unknown, sender: { id: string }, respond: (response: unknown) => void) => unknown
  >;
  const stored: { settings: Settings; aliases: Alias[] };
  interface Window {
    failNextSave: boolean;
    setSystemTheme: (dark: boolean) => void;
    expectedMessages: Record<string, string>;
    expectedLanguage: string;
    expectedSaveLabel: string;
    availableChats: string[];
    rejectChats: boolean;
  }
}
