import { hashString } from '../engine/random.ts';
import { ZODIAC_SIGNS, type ZodiacSign } from '../horoscope/zodiac.ts';

export function assignSign(fingerprint: string): ZodiacSign {
  const hash = hashString(fingerprint);
  const index = hash % ZODIAC_SIGNS.length;
  return ZODIAC_SIGNS[index];
}
