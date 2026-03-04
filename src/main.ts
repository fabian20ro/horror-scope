import { readBrowserOracle } from './divination/browser-oracle.ts';
import { assignSign } from './divination/sign-assigner.ts';
import { generateHoroscope } from './horoscope/generator.ts';
import { randomSign } from './horoscope/zodiac.ts';
import type { ZodiacSign } from './horoscope/zodiac.ts';
import {
  getLocale,
  detectLanguage,
  persistLanguage,
} from './i18n/index.ts';
import { render } from './ui/renderer.ts';
import { scheduleMidnightGmt } from './engine/scheduler.ts';
import './style.css';

function initApp(): void {
  const container = document.getElementById('app')!;
  let langId = detectLanguage();
  let consultation = 0;
  let signOverride: ZodiacSign | null = null;

  function renderApp(): void {
    const divination = readBrowserOracle();
    const sign = signOverride ?? assignSign(divination.fingerprint);
    const locale = getLocale(langId);
    const horoscope = generateHoroscope(sign, locale, divination, new Date(), consultation);
    render(
      container,
      horoscope,
      divination,
      locale,
      (newLangId) => {
        langId = newLangId;
        persistLanguage(newLangId);
        renderApp();
      },
      () => {
        consultation++;
        renderApp();
      },
      () => {
        signOverride = randomSign(sign);
        consultation = 0;
        renderApp();
      },
    );
  }

  renderApp();
  scheduleMidnightGmt(renderApp);
}

initApp();
