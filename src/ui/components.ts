import type { Horoscope } from '../horoscope/generator.ts';
import type { DivinationProfile } from '../divination/browser-oracle.ts';
import type { UIStrings } from '../i18n/types.ts';
import type { LocalePack } from '../i18n/types.ts';

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

export function createHeader(ui: UIStrings): HTMLElement {
  const header = el('header', 'header');
  const deco = el('div', 'header__stars', '✦ ☽ ✧ ☆ ✦');
  const title = el('h1', 'header__title', ui.title);
  const subtitle = el('p', 'header__subtitle', ui.subtitle);
  header.append(deco, title, subtitle);
  return header;
}

export function createLanguageSwitcher(
  locales: LocalePack[],
  currentId: string,
  onChange: (id: string) => void,
): HTMLElement {
  const nav = el('nav', 'lang-switcher');
  nav.setAttribute('aria-label', 'Language');
  for (const locale of locales) {
    const btn = el('button', 'lang-btn', locale.name);
    btn.setAttribute('aria-pressed', String(locale.id === currentId));
    if (locale.id === currentId) btn.classList.add('lang-btn--active');
    btn.addEventListener('click', () => onChange(locale.id));
    nav.appendChild(btn);
  }
  return nav;
}

export function createSignCard(
  horoscope: Horoscope,
  ui: UIStrings,
): HTMLElement {
  const card = el('section', 'card sign-card');
  const symbol = el('div', 'sign-card__symbol', horoscope.signSymbol);
  const label = el('div', 'sign-card__label', ui.yourSign);
  const name = el('div', 'sign-card__name', ui.signNames[horoscope.sign]);
  card.append(symbol, label, name);
  return card;
}

export function createHoroscopeCard(
  horoscope: Horoscope,
  ui: UIStrings,
): HTMLElement {
  const card = el('article', 'card horoscope-card');
  const heading = el('h2', 'horoscope-card__heading', ui.dailyHoroscope);

  const text = el('p', 'horoscope-card__text', horoscope.text);

  const details = el('div', 'horoscope-card__details');

  const items: [string, string][] = [
    [ui.luckyNumber, String(horoscope.luckyNumber)],
    [ui.luckyColor, horoscope.luckyColor],
    [ui.cosmicWarning, horoscope.warning],
    [ui.compatibility, horoscope.compatibility],
  ];

  for (const [label, value] of items) {
    const row = el('div', 'detail-row');
    row.appendChild(el('span', 'detail-row__label', label));
    row.appendChild(el('span', 'detail-row__value', value));
    details.appendChild(row);
  }

  card.append(heading, text, details);
  return card;
}

export function createDivinationPanel(
  divination: DivinationProfile,
  ui: UIStrings,
): HTMLElement {
  const section = el('section', 'card divination-card');
  const heading = el('h3', 'divination-card__heading', ui.browserDivination);

  const toggle = el('button', 'divination-card__toggle', '▼');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Toggle divination details');
  heading.appendChild(toggle);

  const list = el('div', 'divination-card__list');
  list.classList.add('divination-card__list--collapsed');

  for (const reading of divination.readings) {
    const label = ui.divinationLabels[reading.key] ?? reading.key;
    const row = el('div', 'detail-row');
    row.appendChild(el('span', 'detail-row__label', label));
    row.appendChild(el('span', 'detail-row__value', reading.raw));
    list.appendChild(row);
  }

  toggle.addEventListener('click', () => {
    const expanded = list.classList.toggle('divination-card__list--collapsed');
    toggle.setAttribute('aria-expanded', String(!expanded));
    toggle.textContent = expanded ? '▼' : '▲';
  });

  section.append(heading, list);
  return section;
}

export function createFooter(ui: UIStrings): HTMLElement {
  const footer = el('footer', 'footer');
  const gen = el('p', 'footer__generated', `✧ ${ui.generatedBy} ✧`);
  const disc = el('p', 'footer__disclaimer', ui.footer);

  const badgeLink = document.createElement('a');
  badgeLink.href = 'https://github.com/fabian20ro/horror-scope';
  badgeLink.className = 'footer__badge';
  badgeLink.target = '_blank';
  badgeLink.rel = 'noopener noreferrer';
  const badgeImg = document.createElement('img');
  badgeImg.src =
    'https://github.com/fabian20ro/horror-scope/actions/workflows/deploy.yml/badge.svg';
  badgeImg.alt = 'Deploy to GitHub Pages';
  badgeLink.appendChild(badgeImg);

  footer.append(gen, disc, badgeLink);
  return footer;
}
