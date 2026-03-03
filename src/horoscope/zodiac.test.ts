import { describe, it, expect } from 'vitest';
import { ZODIAC_SIGNS, ZODIAC_SYMBOLS } from './zodiac.ts';

describe('ZODIAC_SIGNS', () => {
  it('has exactly 12 signs', () => {
    expect(ZODIAC_SIGNS).toHaveLength(12);
  });

  it('has no duplicates', () => {
    expect(new Set(ZODIAC_SIGNS).size).toBe(12);
  });
});

describe('ZODIAC_SYMBOLS', () => {
  it('has a symbol for every sign', () => {
    for (const sign of ZODIAC_SIGNS) {
      expect(ZODIAC_SYMBOLS[sign]).toBeDefined();
      expect(ZODIAC_SYMBOLS[sign].length).toBeGreaterThan(0);
    }
  });
});
