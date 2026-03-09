# Iteration Log

> Append-only journal of AI agent work sessions.
> **Add an entry at the end of every iteration.**
> Same issue 2+ times? Promote to `LESSONS_LEARNED.md`.

## Entry Format

---

### [YYYY-MM-DD] Brief Description

**Context:** What was the goal
**What happened:** Key actions, decisions
**Outcome:** Success / partial / failure
**Insight:** (optional) What would you tell the next agent?
**Promoted to Lessons Learned:** Yes / No

---

### [2026-03-04] Externalize grammar data to text files

**Context:** Grammar data (~37-42 symbols per locale) was hardcoded in TypeScript locale files. Goal: move to external text files for easier editing, extensibility, and future CDN delivery.
**What happened:** Designed section-based text format (`=== symbol ===` headers), created grammar-loader module with `@include` support for splitting large sections, moved all grammar data to `public/data/{locale}.txt`, made app init async with `loadAllGrammars()`. Added 29 new tests including data file integrity checks.
**Outcome:** Success — 90 tests passing, build succeeds, data files served as static assets.
**Insight:** When adding Node-only imports (`node:fs`, `node:path`) to test files in a browser-targeted project, exclude test files from `tsconfig.json` (`"exclude": ["src/**/*.test.ts"]`). The `tsc` build check doesn't need to type-check test files since Vitest handles that separately. Also: plan mode may discard files created before `ExitPlanMode` — recreate them after approval.
**Promoted to Lessons Learned:** Yes (tsconfig exclude pattern)

---

### [2026-03-04] Fix Romanian gender mismatches and expand phrase variety

**Context:** Romanian horoscope templates had gender agreement bugs — possessive pronouns (ta/tău) and object clitics (-l/-o) were hardcoded in parent templates, but child symbols contained entries of mixed grammatical gender. Additionally, many symbol sections had only 5-8 entries causing repetitive output.
**What happened:** Created three new gender-variant symbols (`parteCorpTa`, `aspectViataTa`, `dispozitivulTau`) following the established pattern of embedding gendered elements in symbol entries. Updated all affected templates to use these variants. Restructured templates with object pronoun clitics (`verifică-l`, `Ține-l`) to avoid gendered forms entirely. Added ~100+ new entries across all 40+ symbol sections while maintaining gender agreement.
**Outcome:** Success — 112 tests passing, build succeeds, all gender mismatches resolved.
**Insight:** Romanian gender agreement in CFG-based systems should always be handled by creating variant symbols (e.g., `symbolTa`, `symbolTau`) rather than hardcoding gendered words in templates. The pattern: bare symbol for gender-neutral contexts, variant symbol with possessive/article embedded for gendered contexts. Keep bare and variant symbols in sync when adding new entries.
**Promoted to Lessons Learned:** Yes (Romanian gender variant symbol pattern)

---

### [2026-03-09] Reliability + i18n accessibility + PWA hardening

**Context:** Implement fixes 1, 2, 3, 5, and 6: startup failure handling, truthful copy feedback, localized accessibility labels, real PWA support, and build-time grammar integrity enforcement for both locales.
**What happened:** Added startup `loadAllGrammars()` error fallback with retry in `src/main.ts`; made action buttons await async outcomes and only show success feedback when the result is not false; localized aria-label strings by extending `UIStrings` and wiring `createTopBar`/`createDivinationPanel` to locale text; added `public/manifest.webmanifest`, `public/sw.js`, and service worker registration; introduced `scripts/validate-grammar.mjs` that recursively validates symbol references from roots and enforces minimum 5 entries per symbol for `en`/`ro`, then wired it into `build` via `npm run validate:grammar && tsc && vite build`. Updated/added tests in UI suites for new behavior.
**Outcome:** Success — `npm test`, `npm run validate:grammar`, and `npm run build` all pass.
**Insight:** Recursive grammar validation must account for runtime-injected symbols (e.g., `signName`, divination symbols) or it will incorrectly fail static checks for unresolved references.
**Promoted to Lessons Learned:** No

<!-- New entries above this line, most recent first -->
