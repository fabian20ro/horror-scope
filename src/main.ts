import { readBrowserOracle } from './divination/browser-oracle.ts';
import { assignSign } from './divination/sign-assigner.ts';
import { generateHoroscope } from './horoscope/generator.ts';
import {
  getLocale,
  detectLanguage,
  persistLanguage,
  loadAllGrammars,
} from './i18n/index.ts';
import { render } from './ui/renderer.ts';
import { scheduleMidnightGmt } from './engine/scheduler.ts';
import './style.css';

async function initApp(): Promise<void> {
  await loadAllGrammars();

  const container = document.getElementById('app')!;
  let langId = detectLanguage();
  let consultation = 0;

  function renderApp(): void {
    const divination = readBrowserOracle();
    const sign = assignSign(divination.fingerprint);
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
    );
  }

  renderApp();
  scheduleMidnightGmt(renderApp);
}

initApp();
