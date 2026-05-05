import type { Grammar } from '../engine/types.ts';

const SECTION_RE = /^===\s*(.+?)\s*===$/;
const FROM_RE = /^@from\s+(\S+)\s+import\s+\*$/;

/** Result of parsing a grammar text file. */
export interface ParsedGrammar {
  imports: string[];
  sections: Record<string, string[]>;
}

/** Parse a section-based grammar text file into sections and top-level imports. */
export function parseGrammarText(content: string): ParsedGrammar {
  const sections: Record<string, string[]> = {};
  const imports: string[] = [];
  let current: string | null = null;

  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (line === '' || line.startsWith('//')) continue;

    // Top-level @from directives (before or between sections)
    const fromMatch = line.match(FROM_RE);
    if (fromMatch) {
      imports.push(fromMatch[1]);
      continue;
    }

    const sectionMatch = line.match(SECTION_RE);
    if (sectionMatch) {
      current = sectionMatch[1];
      if (!sections[current]) sections[current] = [];
      continue;
    }

    if (current === null) continue;
    sections[current].push(line);
  }

  return { imports, sections };
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
 *   @from a-c.txt import *
 *   @from d-g.txt import *
 *
 *   === symbolName ===
 *   entry one
 *   entry two with #markers#
 *
 * Import files are full section-based files (same format, may also contain
 * @from directives) loaded from `{basePath}{localeId}/{filename}`.
 * All imported sections are merged into the main grammar. Files are
 * fetched in parallel for optimal performance.
 */
export async function loadGrammar(
  localeId: string,
  basePath?: string,
  fetchFn: typeof fetch = fetch,
  strict: boolean = false,
): Promise<Grammar> {
  const base = basePath ?? `${import.meta.env.BASE_URL}data/`;
  const mainUrl = `${base}${localeId}.txt`;

  const response = await fetchFn(mainUrl);
  if (!response.ok) {
    throw new Error(`Failed to load grammar: ${mainUrl} (${response.status})`);
  }

  const content = await response.text();
  const parsed = parseGrammarText(content);

  // Start fetching all imported files in parallel
  const importPromises = parsed.imports.map(async (importPath) => {
    const importUrl = `${base}${localeId}/${importPath}`;
    const res = await fetchFn(importUrl);
    if (!res.ok) {
      const errorMsg = `Failed to load @from ${importPath}: ${res.status}`;
      if (strict) {
        throw new Error(errorMsg);
      }
      console.warn(errorMsg);
      return null;
    }
    const text = await res.text();
    return parseGrammarText(text);
  });
  const importResults = await Promise.all(importPromises);

  // Build the grammar: start with the main file's sections
  const grammar: Grammar = {};
  for (const [symbol, entries] of Object.entries(parsed.sections)) {
    if (!grammar[symbol]) grammar[symbol] = [];
    grammar[symbol].push(...entries);
  }

  // Merge sections from all imported files
  for (const result of importResults) {
    if (!result) continue;
    for (const [symbol, entries] of Object.entries(result.sections)) {
      if (!grammar[symbol]) grammar[symbol] = [];
      grammar[symbol].push(...entries);
    }
  }

  return grammar;
}
