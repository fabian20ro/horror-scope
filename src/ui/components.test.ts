// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { createRegenerateButton } from './components.ts';
import type { UIStrings } from '../i18n/types.ts';

const minimalUi: UIStrings = {
  title: 'T',
  subtitle: 'S',
  yourSign: 'Y',
  dailyHoroscope: 'D',
  luckyNumber: 'L',
  luckyColor: 'C',
  cosmicWarning: 'W',
  compatibility: 'Co',
  browserDivination: 'B',
  regenerate: 'Read Again',
  generatedBy: 'G',
  footer: 'F',
  signNames: {
    aries: 'A', taurus: 'T', gemini: 'G', cancer: 'C', leo: 'L',
    virgo: 'V', libra: 'Li', scorpio: 'Sc', sagittarius: 'Sa',
    capricorn: 'Ca', aquarius: 'Aq', pisces: 'P',
  },
  divinationLabels: {},
};

describe('createRegenerateButton', () => {
  it('returns a button element', () => {
    const btn = createRegenerateButton(minimalUi, () => {});
    expect(btn.tagName).toBe('BUTTON');
  });

  it('has the regen-btn CSS class', () => {
    const btn = createRegenerateButton(minimalUi, () => {});
    expect(btn.className).toBe('regen-btn');
  });

  it('displays the regenerate label from UIStrings', () => {
    const btn = createRegenerateButton(minimalUi, () => {});
    expect(btn.textContent).toBe('Read Again');
  });

  it('calls the callback when clicked', () => {
    const onRegenerate = vi.fn();
    const btn = createRegenerateButton(minimalUi, onRegenerate);
    btn.click();
    expect(onRegenerate).toHaveBeenCalledTimes(1);
  });

  it('does not call callback before click', () => {
    const onRegenerate = vi.fn();
    createRegenerateButton(minimalUi, onRegenerate);
    expect(onRegenerate).not.toHaveBeenCalled();
  });
});
