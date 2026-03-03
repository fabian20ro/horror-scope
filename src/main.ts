import { readBrowserOracle } from './divination/browser-oracle.ts';
import { assignSign } from './divination/sign-assigner.ts';
import { generateHoroscope } from './horoscope/generator.ts';
import {
  getLocale,
  detectLanguage,
  persistLanguage,
} from './i18n/index.ts';
import { render } from './ui/renderer.ts';
import './style.css';

function initApp(): void {
  const container = document.getElementById('app')!;

  const divination = readBrowserOracle();
  const sign = assignSign(divination.fingerprint);
  let langId = detectLanguage();

  function renderApp(): void {
    const locale = getLocale(langId);
    const horoscope = generateHoroscope(sign, locale, divination);
    render(container, horoscope, divination, locale, (newLangId) => {
      langId = newLangId;
      persistLanguage(newLangId);
      renderApp();
    });
  }

  renderApp();
}

initApp();
