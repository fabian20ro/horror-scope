import { describe, it, expect } from 'vitest';
import { getLocale, getAvailableLocales } from './index.ts';

describe('getLocale', () => {
  it('returns English locale for "en"', () => {
    const locale = getLocale('en');
    expect(locale.id).toBe('en');
    expect(locale.name).toBe('English');
  });

  it('returns Romanian locale for "ro"', () => {
    const locale = getLocale('ro');
    expect(locale.id).toBe('ro');
    expect(locale.name).toBe('Română');
  });

  it('falls back to English for unknown locale', () => {
    const locale = getLocale('xx');
    expect(locale.id).toBe('en');
  });
});

describe('getAvailableLocales', () => {
  it('returns all registered locales', () => {
    const locales = getAvailableLocales();
    expect(locales.length).toBe(2);
    const ids = locales.map((l) => l.id);
    expect(ids).toContain('en');
    expect(ids).toContain('ro');
  });

  it('each locale has required grammar symbols', () => {
    for (const locale of getAvailableLocales()) {
      expect(locale.grammar.origin).toBeDefined();
      expect(locale.grammar.warning).toBeDefined();
      expect(locale.grammar.luckyColor).toBeDefined();
      expect(locale.grammar.compatibility).toBeDefined();
    }
  });

  it('each locale has all zodiac sign names', () => {
    const signs = [
      'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
      'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
    ] as const;
    for (const locale of getAvailableLocales()) {
      for (const sign of signs) {
        expect(locale.ui.signNames[sign]).toBeDefined();
      }
    }
  });
});
