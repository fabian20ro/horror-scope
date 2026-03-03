import type { LocalePack } from './types.ts';
import { en } from './locales/en.ts';
import { ro } from './locales/ro.ts';

const STORAGE_KEY = 'horror-scope-lang';

const registry = new Map<string, LocalePack>();
registry.set('en', en);
registry.set('ro', ro);

export function getLocale(id: string): LocalePack {
  return registry.get(id) ?? en;
}

export function getAvailableLocales(): LocalePack[] {
  return Array.from(registry.values());
}

export function detectLanguage(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && registry.has(saved)) return saved;
  } catch {
    // localStorage unavailable
  }
  const browserLang = navigator.language?.slice(0, 2);
  if (registry.has(browserLang)) return browserLang;
  return 'en';
}

export function persistLanguage(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // localStorage unavailable
  }
}
