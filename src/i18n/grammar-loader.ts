import type { Grammar } from '../engine/types.ts';

const SECTION_RE = /^===\s*(.+?)\s*===$/;
const INCLUDE_RE = /^@include\s+(.+)$/;

interface ParsedSection {
  entries: string[];
  includes: string[];
}

/** Parse a section-based grammar text file into symbol sections. */
export function parseGrammarText(
  content: string,
): Record<string, ParsedSection> {
  const sections: Record<string, ParsedSection> = {};
  let current: string | null = null;

  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (line === '' || line.startsWith('//')) continue;

    const sectionMatch = line.match(SECTION_RE);
    if (sectionMatch) {
      current = sectionMatch[1];
      if (!sections[current]) sections[current] = { entries: [], includes: [] };
      continue;
    }

    if (current === null) continue;

    const includeMatch = line.match(INCLUDE_RE);
    if (includeMatch) {
      sections[current].includes.push(includeMatch[1].trim());
    } else {
      sections[current].entries.push(line);
    }
  }

  return sections;
}

/** Parse a plain text file into a list of entries (one per non-blank line). */
export function parseEntriesFile(content: string): string[] {
  return content
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line !== '' && !line.trimStart().startsWith('//'));
}

/**
 * Load grammar data for a locale from external text files.
 *
 * The main file at `{basePath}{localeId}.txt` uses a section-based format:
 *
 *   === symbolName ===
 *   entry one
 *   entry two with #markers#
 *
 *   === anotherSymbol ===
 *   @include largeList.txt
 *
 * Include files are plain lists (one entry per line) loaded from
 * `{basePath}{localeId}/{filename}`. They do not support nesting.
 */
export async function loadGrammar(
  localeId: string,
  basePath?: string,
  fetchFn: typeof fetch = fetch,
): Promise<Grammar> {
  const base = basePath ?? `${import.meta.env.BASE_URL}data/`;
  const mainUrl = `${base}${localeId}.txt`;

  const response = await fetchFn(mainUrl);
  if (!response.ok) {
    throw new Error(`Failed to load grammar: ${mainUrl} (${response.status})`);
  }

  const content = await response.text();
  const sections = parseGrammarText(content);

  const grammar: Grammar = {};
  const includePromises: Promise<void>[] = [];

  for (const [symbol, section] of Object.entries(sections)) {
    grammar[symbol] = [...section.entries];

    for (const includePath of section.includes) {
      const includeUrl = `${base}${localeId}/${includePath}`;
      const promise = fetchFn(includeUrl).then(async (res) => {
        if (!res.ok) {
          console.warn(
            `Failed to load @include ${includePath} for [${symbol}]: ${res.status}`,
          );
          return;
        }
        const text = await res.text();
        grammar[symbol].push(...parseEntriesFile(text));
      });
      includePromises.push(promise);
    }
  }

  await Promise.all(includePromises);
  return grammar;
}
