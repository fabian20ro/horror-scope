import { describe, it, expect } from 'vitest';
import { assignSign } from './sign-assigner.ts';
import { ZODIAC_SIGNS } from '../horoscope/zodiac.ts';

describe('assignSign', () => {
  it('returns a valid zodiac sign', () => {
    const sign = assignSign('test-fingerprint');
    expect(ZODIAC_SIGNS).toContain(sign);
  });

  it('is deterministic — same fingerprint always gives same sign', () => {
    const sign1 = assignSign('my|browser|fingerprint');
    const sign2 = assignSign('my|browser|fingerprint');
    expect(sign1).toBe(sign2);
  });

  it('different fingerprints can produce different signs', () => {
    const signs = new Set<string>();
    // Try a bunch of fingerprints — at least some should differ
    for (let i = 0; i < 100; i++) {
      signs.add(assignSign(`fingerprint-${i}`));
    }
    expect(signs.size).toBeGreaterThan(1);
  });

  it('all 12 signs are reachable', () => {
    const signs = new Set<string>();
    for (let i = 0; i < 10000; i++) {
      signs.add(assignSign(`fp-${i}`));
      if (signs.size === 12) break;
    }
    expect(signs.size).toBe(12);
  });

  it('handles empty string', () => {
    const sign = assignSign('');
    expect(ZODIAC_SIGNS).toContain(sign);
  });
});
