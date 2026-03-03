import type { Grammar } from '../engine/types.ts';
import type { ZodiacSign } from '../horoscope/zodiac.ts';

export interface UIStrings {
  title: string;
  subtitle: string;
  yourSign: string;
  dailyHoroscope: string;
  luckyNumber: string;
  luckyColor: string;
  cosmicWarning: string;
  compatibility: string;
  browserDivination: string;
  regenerate: string;
  generatedBy: string;
  footer: string;
  signNames: Record<ZodiacSign, string>;
  divinationLabels: Record<string, string>;
}

export interface LocalePack {
  id: string;
  name: string;
  ui: UIStrings;
  grammar: Grammar;
}
