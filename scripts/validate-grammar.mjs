import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, '../public/data');
const locales = ['en', 'ro'];
const minEntriesPerSymbol = 5;
const sectionRe = /^===\s*(.+?)\s*===$/;
const includeRe = /^@include\s+(.+)$/;
const symbolRefRe = /#([^#.]+)(?:\.[^#]+)?#/g;
const runtimeSymbols = new Set([
  'signName',
  'spirit_browser',
  'elemental_os',
  'life_resolution',
  'soul_window',
  'cultural_destiny',
  'soul_alignment',
  'temporal_energy',
  'parallel_lives',
  'cosmic_platform',
  'social_connectivity',
  'cosmic_timezone',
]);

function parseEntries(content) {
  return content
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== '' && !line.trimStart().startsWith('//'));
}

function parseSections(content) {
  const sections = new Map();
  let current = null;

  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('//')) continue;

    const sectionMatch = line.match(sectionRe);
    if (sectionMatch) {
      current = sectionMatch[1];
      if (!sections.has(current)) {
        sections.set(current, { entries: [], includes: [] });
      }
      continue;
    }

    if (!current) continue;

    const includeMatch = line.match(includeRe);
    if (includeMatch) {
      sections.get(current).includes.push(includeMatch[1].trim());
      continue;
    }

    sections.get(current).entries.push(line);
  }

  return sections;
}

function loadLocaleGrammar(locale) {
  const mainPath = resolve(dataDir, `${locale}.txt`);
  const sections = parseSections(readFileSync(mainPath, 'utf8'));
  const grammar = new Map();

  for (const [symbol, section] of sections.entries()) {
    const allEntries = [...section.entries];

    for (const includeFile of section.includes) {
      const includePath = resolve(dataDir, locale, includeFile);
      let includeContent;
      try {
        includeContent = readFileSync(includePath, 'utf8');
      } catch {
        throw new Error(`Missing include for ${locale}.${symbol}: ${includeFile}`);
      }
      allEntries.push(...parseEntries(includeContent));
    }

    grammar.set(symbol, allEntries);
  }

  return grammar;
}

function extractRefs(entry) {
  const refs = [];
  let match;
  while ((match = symbolRefRe.exec(entry)) !== null) {
    refs.push(match[1]);
  }
  return refs;
}

function validateLocale(locale) {
  const grammar = loadLocaleGrammar(locale);

  for (const [symbol, entries] of grammar.entries()) {
    if (entries.length < minEntriesPerSymbol) {
      throw new Error(
        `Locale ${locale}: symbol "${symbol}" has ${entries.length} entries (min ${minEntriesPerSymbol})`,
      );
    }
  }

  const roots = ['origin', 'warning', 'luckyColor', 'compatibility'];
  const seen = new Set();
  const queue = [...roots];

  while (queue.length > 0) {
    const symbol = queue.shift();
    if (!symbol || seen.has(symbol)) continue;
    seen.add(symbol);

    const entries = grammar.get(symbol);
    if (!entries) {
      if (runtimeSymbols.has(symbol)) {
        continue;
      }
      throw new Error(`Locale ${locale}: missing referenced symbol "${symbol}"`);
    }

    if (entries.length < minEntriesPerSymbol) {
      throw new Error(
        `Locale ${locale}: referenced symbol "${symbol}" has ${entries.length} entries (min ${minEntriesPerSymbol})`,
      );
    }

    for (const entry of entries) {
      for (const ref of extractRefs(entry)) {
        queue.push(ref);
      }
    }
  }
}

for (const locale of locales) {
  validateLocale(locale);
}

console.log(`Grammar validation passed for locales: ${locales.join(', ')}`);
