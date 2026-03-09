import { describe, it, expect, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseGrammarText,
  parseEntriesFile,
  loadGrammar,
} from './grammar-loader.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type FetchFn = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

describe('parseGrammarText', () => {
  it('parses a single section with entries', () => {
    const content = `=== creature ===
unicorn
dragon
phoenix`;
    const result = parseGrammarText(content);
    expect(result.sections.creature).toEqual(['unicorn', 'dragon', 'phoenix']);
    expect(result.imports).toEqual([]);
  });

  it('parses multiple sections', () => {
    const content = `=== creature ===
unicorn
dragon

=== food ===
toast
sushi`;
    const result = parseGrammarText(content);
    expect(result.sections.creature).toEqual(['unicorn', 'dragon']);
    expect(result.sections.food).toEqual(['toast', 'sushi']);
  });

  it('skips blank lines', () => {
    const content = `=== creature ===

unicorn

dragon

`;
    const result = parseGrammarText(content);
    expect(result.sections.creature).toEqual(['unicorn', 'dragon']);
  });

  it('skips comment lines starting with //', () => {
    const content = `=== creature ===
// These are mythical creatures
unicorn
// dragon is commented out
phoenix`;
    const result = parseGrammarText(content);
    expect(result.sections.creature).toEqual(['unicorn', 'phoenix']);
  });

  it('ignores lines before any section header', () => {
    const content = `this is preamble
// and a comment

=== creature ===
unicorn`;
    const result = parseGrammarText(content);
    expect(Object.keys(result.sections)).toEqual(['creature']);
    expect(result.sections.creature).toEqual(['unicorn']);
  });

  it('detects @from import directives', () => {
    const content = `@from creatures.txt import *

=== food ===
toast`;
    const result = parseGrammarText(content);
    expect(result.imports).toEqual(['creatures.txt']);
    expect(result.sections.food).toEqual(['toast']);
  });

  it('handles multiple @from import directives', () => {
    const content = `@from a-c.txt import *
@from d-g.txt import *

=== origin ===
template`;
    const result = parseGrammarText(content);
    expect(result.imports).toEqual(['a-c.txt', 'd-g.txt']);
  });

  it('preserves entries with #markers#', () => {
    const content = `=== origin ===
#opening.capitalize# #prediction#
The #cosmicBody# speaks: #prediction#`;
    const result = parseGrammarText(content);
    expect(result.sections.origin).toEqual([
      '#opening.capitalize# #prediction#',
      'The #cosmicBody# speaks: #prediction#',
    ]);
  });

  it('handles section names with spaces', () => {
    const content = `=== spirit animal ===
wolf
eagle`;
    const result = parseGrammarText(content);
    expect(result.sections['spirit animal']).toEqual(['wolf', 'eagle']);
  });

  it('trims section names', () => {
    const content = `===  creature  ===
unicorn`;
    const result = parseGrammarText(content);
    expect(result.sections.creature).toBeDefined();
  });

  it('preserves entries with special characters', () => {
    const content = `=== food ===
existential espresso
Uranus (yes, that Uranus)
someone's toast`;
    const result = parseGrammarText(content);
    expect(result.sections.food).toEqual([
      'existential espresso',
      'Uranus (yes, that Uranus)',
      "someone's toast",
    ]);
  });

  it('handles weighted entries (~~)', () => {
    const content = `=== item ===
common~~5
rare~~1`;
    const result = parseGrammarText(content);
    expect(result.sections.item).toEqual(['common~~5', 'rare~~1']);
  });
});

describe('parseEntriesFile', () => {
  it('parses lines into entries', () => {
    const content = `unicorn
dragon
phoenix`;
    expect(parseEntriesFile(content)).toEqual(['unicorn', 'dragon', 'phoenix']);
  });

  it('skips blank lines', () => {
    const content = `unicorn

dragon

`;
    expect(parseEntriesFile(content)).toEqual(['unicorn', 'dragon']);
  });

  it('skips comment lines', () => {
    const content = `// header comment
unicorn
// skip this
dragon`;
    expect(parseEntriesFile(content)).toEqual(['unicorn', 'dragon']);
  });

  it('returns empty array for empty content', () => {
    expect(parseEntriesFile('')).toEqual([]);
  });

  it('returns empty array for only comments and blanks', () => {
    expect(parseEntriesFile('// comment\n\n// another')).toEqual([]);
  });
});

describe('loadGrammar', () => {
  function mockFetch(files: Record<string, string>): FetchFn {
    return vi.fn((url: string) => {
      const content = files[url];
      if (content !== undefined) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(content),
        } as Response);
      }
      return Promise.resolve({
        ok: false,
        status: 404,
      } as Response);
    });
  }

  it('loads and parses a grammar file', async () => {
    const fetch = mockFetch({
      'http://test/data/en.txt': `=== creature ===
unicorn
dragon

=== food ===
toast`,
    });

    const grammar = await loadGrammar('en', 'http://test/data/', fetch);
    expect(grammar.creature).toEqual(['unicorn', 'dragon']);
    expect(grammar.food).toEqual(['toast']);
  });

  it('resolves @from import directives', async () => {
    const fetch = mockFetch({
      'http://test/data/en.txt': `@from creatures.txt import *

=== food ===
toast`,
      'http://test/data/en/creatures.txt': `=== creature ===
unicorn
dragon`,
    });

    const grammar = await loadGrammar('en', 'http://test/data/', fetch);
    expect(grammar.creature).toEqual(['unicorn', 'dragon']);
    expect(grammar.food).toEqual(['toast']);
  });

  it('merges sections from multiple @from imports', async () => {
    const fetch = mockFetch({
      'http://test/data/en.txt': `@from file1.txt import *
@from file2.txt import *`,
      'http://test/data/en/file1.txt': `=== creature ===
unicorn`,
      'http://test/data/en/file2.txt': `=== food ===
toast

=== color ===
red`,
    });

    const grammar = await loadGrammar('en', 'http://test/data/', fetch);
    expect(grammar.creature).toEqual(['unicorn']);
    expect(grammar.food).toEqual(['toast']);
    expect(grammar.color).toEqual(['red']);
  });

  it('merges same-name sections across files (no overwrite)', async () => {
    const fetch = mockFetch({
      'http://test/data/en.txt': `@from extras.txt import *

=== creature ===
phoenix`,
      'http://test/data/en/extras.txt': `=== creature ===
unicorn
dragon`,
    });

    const grammar = await loadGrammar('en', 'http://test/data/', fetch);
    expect(grammar.creature).toContain('phoenix');
    expect(grammar.creature).toContain('unicorn');
    expect(grammar.creature).toContain('dragon');
    expect(grammar.creature).toHaveLength(3);
  });

  it('warns and continues when an @from file is missing', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetch = mockFetch({
      'http://test/data/en.txt': `@from missing.txt import *

=== creature ===
dragon`,
    });

    const grammar = await loadGrammar('en', 'http://test/data/', fetch);
    expect(grammar.creature).toEqual(['dragon']);
    expect(warnSpy).toHaveBeenCalledOnce();
    warnSpy.mockRestore();
  });

  it('throws when the main grammar file is missing', async () => {
    const fetch = mockFetch({});
    await expect(
      loadGrammar('xx', 'http://test/data/', fetch),
    ).rejects.toThrow('Failed to load grammar');
  });

  it('loads multiple @from files in parallel', async () => {
    const fetch = vi.fn((url: string) => {
      const files: Record<string, string> = {
        'http://test/data/en.txt': `@from a.txt import *
@from b.txt import *`,
        'http://test/data/en/a.txt': `=== alpha ===
alpha entry`,
        'http://test/data/en/b.txt': `=== beta ===
beta entry`,
      };
      const content = files[url];
      return Promise.resolve(
        content !== undefined
          ? ({ ok: true, text: () => Promise.resolve(content) } as Response)
          : ({ ok: false, status: 404 } as Response),
      );
    }) as FetchFn;

    const grammar = await loadGrammar('en', 'http://test/data/', fetch);
    expect(grammar.alpha).toContain('alpha entry');
    expect(grammar.beta).toContain('beta entry');
  });
});

describe('data file integrity', () => {
  function readDataFile(locale: string): string {
    return readFileSync(
      resolve(__dirname, '../../public/data', `${locale}.txt`),
      'utf-8',
    );
  }

  function readImportFile(locale: string, filename: string): string {
    return readFileSync(
      resolve(__dirname, '../../public/data', locale, filename),
      'utf-8',
    );
  }

  function loadAllSections(locale: string): Record<string, string[]> {
    const content = readDataFile(locale);
    const parsed = parseGrammarText(content);
    const allSections: Record<string, string[]> = { ...parsed.sections };

    for (const importFile of parsed.imports) {
      const importContent = readImportFile(locale, importFile);
      const importParsed = parseGrammarText(importContent);
      for (const [symbol, entries] of Object.entries(importParsed.sections)) {
        if (!allSections[symbol]) allSections[symbol] = [];
        allSections[symbol].push(...entries);
      }
    }

    return allSections;
  }

  const requiredSymbols = ['origin', 'warning', 'luckyColor', 'compatibility'];

  for (const locale of ['en', 'ro']) {
    describe(`${locale} data files`, () => {
      it('main file parses without errors', () => {
        const content = readDataFile(locale);
        const parsed = parseGrammarText(content);
        const totalSections = Object.keys(parsed.sections).length;
        const totalImports = parsed.imports.length;
        expect(totalSections + totalImports).toBeGreaterThan(0);
      });

      it('all @from import files exist and parse', () => {
        const content = readDataFile(locale);
        const parsed = parseGrammarText(content);
        for (const importFile of parsed.imports) {
          const importContent = readImportFile(locale, importFile);
          const importParsed = parseGrammarText(importContent);
          expect(
            Object.keys(importParsed.sections).length,
            `Import file ${importFile} has no sections`,
          ).toBeGreaterThan(0);
        }
      });

      it(`has required grammar symbols: ${requiredSymbols.join(', ')}`, () => {
        const allSections = loadAllSections(locale);
        for (const symbol of requiredSymbols) {
          expect(
            allSections[symbol],
            `Missing required symbol "${symbol}" in ${locale}`,
          ).toBeDefined();
          expect(
            allSections[symbol].length,
            `Symbol "${symbol}" in ${locale} has no entries`,
          ).toBeGreaterThan(0);
        }
      });

      it('has no empty sections', () => {
        const allSections = loadAllSections(locale);
        for (const [name, entries] of Object.entries(allSections)) {
          expect(
            entries.length,
            `Section "${name}" in ${locale} is empty`,
          ).toBeGreaterThan(0);
        }
      });
    });
  }
});
