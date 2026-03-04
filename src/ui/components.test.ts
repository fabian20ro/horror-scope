// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { createRegenerateButton, createHoroscopeCard, createSignCard } from './components.ts';
import type { UIStrings } from '../i18n/types.ts';
import type { Horoscope } from '../horoscope/generator.ts';

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
  randomizeSign: 'Randomize',
  regenerate: 'Read Again',
  copyHoroscope: 'Copy',
  copiedHoroscope: 'Copied!',
  interpretWithAI: 'Interpret',
  aiInterpretQuery: 'interpret this: ',
  generatedBy: 'G',
  footer: 'F',
  signNames: {
    aries: 'A', taurus: 'T', gemini: 'G', cancer: 'C', leo: 'L',
    virgo: 'V', libra: 'Li', scorpio: 'Sc', sagittarius: 'Sa',
    capricorn: 'Ca', aquarius: 'Aq', pisces: 'P',
  },
  divinationLabels: {},
};

const minimalHoroscope: Horoscope = {
  sign: 'aries',
  signSymbol: '♈',
  text: 'You will find a mysterious sock.',
  luckyNumber: 42,
  luckyColor: 'purple',
  warning: 'Beware of pigeons.',
  compatibility: 'Leo',
  date: '2026-03-03',
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

describe('createSignCard', () => {
  it('renders a dice randomize button', () => {
    const card = createSignCard(minimalHoroscope, minimalUi, () => {});
    const btn = card.querySelector('.sign-card__randomize');
    expect(btn).not.toBeNull();
    expect(btn!.textContent).toBe('\u{1F3B2}');
    expect(btn!.getAttribute('aria-label')).toBe('Randomize');
  });

  it('calls onRandomize when dice button is clicked', () => {
    const onRandomize = vi.fn();
    const card = createSignCard(minimalHoroscope, minimalUi, onRandomize);
    const btn = card.querySelector('.sign-card__randomize') as HTMLElement;
    btn.click();
    expect(onRandomize).toHaveBeenCalledTimes(1);
  });

  it('displays the sign name next to the dice button', () => {
    const card = createSignCard(minimalHoroscope, minimalUi, () => {});
    const nameRow = card.querySelector('.sign-card__name-row');
    expect(nameRow).not.toBeNull();
    const name = nameRow!.querySelector('.sign-card__name');
    expect(name!.textContent).toBe('A');
  });
});

describe('createHoroscopeCard', () => {
  it('contains a heading row with two action buttons and a heading', () => {
    const card = createHoroscopeCard(minimalHoroscope, minimalUi);
    const headingRow = card.querySelector('.horoscope-card__heading-row');
    expect(headingRow).not.toBeNull();
    const buttons = headingRow!.querySelectorAll('.action-btn');
    expect(buttons.length).toBe(2);
    const heading = headingRow!.querySelector('.horoscope-card__heading');
    expect(heading).not.toBeNull();
  });

  it('places the copy button before the heading', () => {
    const card = createHoroscopeCard(minimalHoroscope, minimalUi);
    const headingRow = card.querySelector('.horoscope-card__heading-row')!;
    const firstChild = headingRow.children[0] as HTMLElement;
    expect(firstChild.textContent).toBe('⧉');
    expect(firstChild.getAttribute('aria-label')).toBe('Copy');
  });

  it('places the interpret button after the heading', () => {
    const card = createHoroscopeCard(minimalHoroscope, minimalUi);
    const headingRow = card.querySelector('.horoscope-card__heading-row')!;
    const lastChild = headingRow.children[2] as HTMLElement;
    expect(lastChild.textContent).toBe('→');
    expect(lastChild.getAttribute('aria-label')).toBe('Interpret');
  });

  it('displays the horoscope text', () => {
    const card = createHoroscopeCard(minimalHoroscope, minimalUi);
    const text = card.querySelector('.horoscope-card__text');
    expect(text?.textContent).toBe('You will find a mysterious sock.');
  });
});
