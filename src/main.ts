import { readBrowserOracle } from './divination/browser-oracle.ts';
import { assignSign } from './divination/sign-assigner.ts';
import { generateHoroscope } from './horoscope/generator.ts';
import { randomSign } from './horoscope/zodiac.ts';
import type { ZodiacSign } from './horoscope/zodiac.ts';
import {
  getLocale,
  detectLanguage,
  persistLanguage,
  loadAllGrammars,
} from './i18n/index.ts';
import { render } from './ui/renderer.ts';
import { scheduleMidnightGmt } from './engine/scheduler.ts';
import './style.css';

const THEME_KEY = 'horror-scope-theme';

function detectTheme(): 'dark' | 'light' {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // localStorage unavailable
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(theme: 'dark' | 'light'): void {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // localStorage unavailable
  }
}

async function initApp(): Promise<void> {
  await loadAllGrammars();

  const container = document.getElementById('app')!;
  let langId = detectLanguage();
  let consultation = 0;
  let signOverride: ZodiacSign | null = null;
  let theme = detectTheme();
  applyTheme(theme);

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
      theme === 'dark',
      () => {
        theme = theme === 'dark' ? 'light' : 'dark';
        applyTheme(theme);
        renderApp();
      },
    );
  }

  renderApp();
  scheduleMidnightGmt(renderApp);
}

initApp();
