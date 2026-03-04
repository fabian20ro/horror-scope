import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseGrammarText,
  parseEntriesFile,
  loadGrammar,
} from './grammar-loader.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type FetchFn = (url: string) => Promise<Response>;

describe('parseGrammarText', () => {
  it('parses a single section with entries', () => {
    const content = `=== creature ===
unicorn
dragon
phoenix`;
    const result = parseGrammarText(content);
    expect(result.creature.entries).toEqual(['unicorn', 'dragon', 'phoenix']);
    expect(result.creature.includes).toEqual([]);
  });

  it('parses multiple sections', () => {
    const content = `=== creature ===
unicorn
dragon

=== food ===
toast
sushi`;
    const result = parseGrammarText(content);
    expect(result.creature.entries).toEqual(['unicorn', 'dragon']);
    expect(result.food.entries).toEqual(['toast', 'sushi']);
  });

  it('skips blank lines', () => {
    const content = `=== creature ===

unicorn

dragon

`;
    const result = parseGrammarText(content);
    expect(result.creature.entries).toEqual(['unicorn', 'dragon']);
  });

  it('skips comment lines starting with //', () => {
    const content = `=== creature ===
// These are mythical creatures
unicorn
// dragon is commented out
phoenix`;
    const result = parseGrammarText(content);
    expect(result.creature.entries).toEqual(['unicorn', 'phoenix']);
  });

  it('ignores lines before any section header', () => {
    const content = `this is preamble
// and a comment

=== creature ===
unicorn`;
    const result = parseGrammarText(content);
    expect(Object.keys(result)).toEqual(['creature']);
    expect(result.creature.entries).toEqual(['unicorn']);
  });

  it('detects @include directives', () => {
    const content = `=== creature ===
@include creatures.txt
unicorn`;
    const result = parseGrammarText(content);
    expect(result.creature.entries).toEqual(['unicorn']);
    expect(result.creature.includes).toEqual(['creatures.txt']);
  });

  it('handles multiple @include directives in one section', () => {
    const content = `=== creature ===
@include mythical.txt
@include modern.txt`;
    const result = parseGrammarText(content);
    expect(result.creature.includes).toEqual(['mythical.txt', 'modern.txt']);
  });

  it('preserves entries with #markers#', () => {
    const content = `=== origin ===
#opening.capitalize# #prediction#
The #cosmicBody# speaks: #prediction#`;
    const result = parseGrammarText(content);
    expect(result.origin.entries).toEqual([
      '#opening.capitalize# #prediction#',
      'The #cosmicBody# speaks: #prediction#',
    ]);
  });

  it('handles section names with spaces', () => {
    const content = `=== spirit animal ===
wolf
eagle`;
    const result = parseGrammarText(content);
    expect(result['spirit animal'].entries).toEqual(['wolf', 'eagle']);
  });

  it('trims section names', () => {
    const content = `===  creature  ===
unicorn`;
    const result = parseGrammarText(content);
    expect(result.creature).toBeDefined();
  });

  it('preserves entries with special characters', () => {
    const content = `=== food ===
existential espresso
Uranus (yes, that Uranus)
someone's toast`;
    const result = parseGrammarText(content);
    expect(result.food.entries).toEqual([
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
    expect(result.item.entries).toEqual(['common~~5', 'rare~~1']);
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

  it('resolves @include directives', async () => {
    const fetch = mockFetch({
      'http://test/data/en.txt': `=== creature ===
@include creatures.txt
phoenix`,
      'http://test/data/en/creatures.txt': `unicorn
dragon`,
    });

    const grammar = await loadGrammar('en', 'http://test/data/', fetch);
    expect(grammar.creature).toContain('phoenix');
    expect(grammar.creature).toContain('unicorn');
    expect(grammar.creature).toContain('dragon');
  });

  it('handles inline entries alongside @include', async () => {
    const fetch = mockFetch({
      'http://test/data/en.txt': `=== creature ===
inline entry
@include more.txt`,
      'http://test/data/en/more.txt': `included entry`,
    });

    const grammar = await loadGrammar('en', 'http://test/data/', fetch);
    expect(grammar.creature).toContain('inline entry');
    expect(grammar.creature).toContain('included entry');
  });

  it('warns and continues when an @include file is missing', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetch = mockFetch({
      'http://test/data/en.txt': `=== creature ===
@include missing.txt
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

  it('loads multiple @include files in parallel', async () => {
    const fetch = vi.fn((url: string) => {
      const files: Record<string, string> = {
        'http://test/data/en.txt': `=== a ===
@include a.txt
@include b.txt`,
        'http://test/data/en/a.txt': 'alpha',
        'http://test/data/en/b.txt': 'beta',
      };
      const content = files[url];
      return Promise.resolve(
        content !== undefined
          ? ({ ok: true, text: () => Promise.resolve(content) } as Response)
          : ({ ok: false, status: 404 } as Response),
      );
    }) as FetchFn;

    const grammar = await loadGrammar('en', 'http://test/data/', fetch);
    expect(grammar.a).toContain('alpha');
    expect(grammar.a).toContain('beta');
  });
});

describe('data file integrity', () => {
  function readDataFile(locale: string): string {
    return readFileSync(
      resolve(__dirname, '../../public/data', `${locale}.txt`),
      'utf-8',
    );
  }

  const requiredSymbols = ['origin', 'warning', 'luckyColor', 'compatibility'];

  for (const locale of ['en', 'ro']) {
    describe(`${locale}.txt`, () => {
      it('parses without errors', () => {
        const content = readDataFile(locale);
        const sections = parseGrammarText(content);
        expect(Object.keys(sections).length).toBeGreaterThan(0);
      });

      it(`has required grammar symbols: ${requiredSymbols.join(', ')}`, () => {
        const content = readDataFile(locale);
        const sections = parseGrammarText(content);
        for (const symbol of requiredSymbols) {
          expect(
            sections[symbol],
            `Missing required symbol "${symbol}" in ${locale}.txt`,
          ).toBeDefined();
          expect(
            sections[symbol].entries.length,
            `Symbol "${symbol}" in ${locale}.txt has no entries`,
          ).toBeGreaterThan(0);
        }
      });

      it('has no empty sections', () => {
        const content = readDataFile(locale);
        const sections = parseGrammarText(content);
        for (const [name, section] of Object.entries(sections)) {
          const total = section.entries.length + section.includes.length;
          expect(
            total,
            `Section "${name}" in ${locale}.txt is empty`,
          ).toBeGreaterThan(0);
        }
      });
    });
  }
});
