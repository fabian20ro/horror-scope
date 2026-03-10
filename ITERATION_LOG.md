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

### [2026-03-09] Corecturi RO: gen/articol/capitalizare în șabloanele de gramatică

**Context:** Utilizatorul a semnalat multe probleme de gen, articulare și capitalizare în variantele românești generate din `public/data/ro.txt`.
**What happened:** Am corectat formulări și acorduri în seturile de variante: ghilimele românești închise corect pentru `#intelepciune#`/`#mantra#`, articol + gen la întâlniri (`o hologramă a bunicii...`), typo adjectival (`suspicios de calm`), typo/nuanță la culoare (`portocaliu care te judecă`), plural articulat (`adaptoare USB`), și formulări mai naturale în `reactieColegi` (`pretinde că nu observă`, `da vina pe stagiar`, `face o memă`).
**Outcome:** Success — textele RO sunt mai consistente gramatical și tipografic pe opțiunile folosite de generator.
**Insight:** În fișierele de gramatică pe bază de variante, problemele de articulare apar frecvent la simboluri reutilizate în contexte diferite; merită validate separat categoriile „cu articol” vs „fără articol”.
**Promoted to Lessons Learned:** No

### [2026-03-09] Double data entries + create comedian agent

**Context:** User requested doubling the number of options in `en.txt` and `ro.txt` data files, creating a comedian sub-agent, and using both the linguist and comedian agents to improve content quality with more absurdist humor.
**What happened:** Created `.claude/agents/comedian.md` following agent-creator conventions — focused on deadpan, surreal humor (Monty Python / Douglas Adams energy) with actionable principles: mundane-cosmic juxtaposition, anthropomorphizing the inanimate, bureaucratizing the magical, deadpan delivery. Registered in AGENTS.md. Then doubled all sections in both `en.txt` and `ro.txt` (~45 sections per locale). Applied linguist lens for Romanian: kept all variant symbols (`parteCorpTa`, `aspectViataTa`, `dispozitivulTau`, `obiectCuArticol`, `obiectMisterios`) in sync with their base counterparts, maintained proper gender agreement (articles, possessives). Applied comedian lens: new entries use juxtaposition (printer that works out of spite), anthropomorphism (spreadsheet that has seen things), bureaucratic-cosmic fusion (cease-and-desist from the future), and deadpan absurdity (your bodyPart will receive a notification). Grammar validation passes for both locales.
**Outcome:** Success — all sections approximately doubled (from ~10-17 to ~18-34 entries each, except static number sections). Grammar validation passes. Tests could not be run due to missing `node_modules` (offline network).
**Insight:** When doubling Romanian grammar data, the variant symbol pattern (`symbolTa`, `dispozitivulTau`, `obiectCuArticol`, `obiectMisterios`) creates a multiplicative burden — each new `obiect` entry requires corresponding entries in 3 variant sections with correct articles, possessives, and adjective positions. Planning the base entries first then systematically generating variants is more reliable than trying to write all 4 in parallel.
**Promoted to Lessons Learned:** No

<!-- New entries above this line, most recent first -->

### [2026-03-09] Fix Romanian agreement/uppercase issues + light theme contrast/header spacing

**Context:** User reported Romanian grammar agreement mistakes and stray uppercase mid-sentence in generated horoscope text, plus low contrast gold-on-light theme and title block positioned too low.
**What happened:** Updated `public/data/ro.txt` to fix agreement and phrasing (`un parcometru filozofic`, `la #locatie#`), lowercased `celebritate` entries to avoid random uppercase in sentence middle, capitalized only where sentence-initial via `#celebritate.capitalize#`, and removed a gender-sensitive pattern by rewriting to "energia de la #celebritate#". Updated `src/style.css` light palette (`--gold`, `--gold-dim`) for stronger contrast, introduced `--title-shadow` token with a subtler light-mode value, and reduced top spacing (`.app__wrapper` padding/gap and `.header` top padding) so title sits higher. Ran grammar validation and production build; captured updated light-mode screenshot.
**Outcome:** Success — text quality issues fixed and light-mode visual hierarchy/contrast improved.
**Insight:** For mixed-content symbols that are reused sentence-internally and sentence-initially, keep entries lowercase and apply `.capitalize` only at template call sites that require it.
**Promoted to Lessons Learned:** No

---

### [2026-03-09] Tighten header spacing and reduce decorative stars for mobile

**Context:** User requested removing wasted vertical space between the top controls and title area, moving the title block higher, and reducing decorative stars so they fit better on phones.
**What happened:** Updated header decoration in `src/ui/components.ts` from 5 glyphs to 4, then tightened vertical spacing in `src/style.css` by reducing top wrapper padding/gap, removing extra top header padding, and slightly compacting stars/subtitle margins. Captured an updated UI screenshot and re-ran targeted tests/build.
**Outcome:** Success — header content now sits higher with less dead space, and star row is slimmer for smaller screens.
**Insight:** Small combined spacing reductions across wrapper + header + decoration are less visually disruptive than a single large padding cut while still reclaiming meaningful vertical space.
**Promoted to Lessons Learned:** No

---

### [2026-03-09] Follow-up: pull title block higher than top bar baseline

**Context:** After previous spacing tweak, user reported the title area still felt too low relative to the flag/theme row.
**What happened:** Further reduced top vertical spacing in `src/style.css` by tightening `.app__wrapper` top padding and inter-section gap (desktop + mobile), adding a small negative top offset on `.header`, and compressing star/subtitle margins.
**Outcome:** Success — header block now starts noticeably higher, closer to the controls row while preserving readability.
**Insight:** When users compare hero position against fixed top controls, a subtle negative margin on the hero container can solve perceived alignment faster than only shrinking global wrapper padding.
**Promoted to Lessons Learned:** No

### [2026-03-10] Configure 3-minute caching headers and align service worker TTL

**Context:** Needed deployment/server cache policy for static assets at 180 seconds, while keeping `index.html` quick to refresh and avoiding stale behavior conflicts with the service worker.
**What happened:** Added `public/_headers` rules to enforce `Cache-Control: public, max-age=180` for static assets/data and no-cache for `index.html` and `sw.js` on hosts that support `_headers` (e.g., Netlify/Cloudflare Pages). Added a Vite middleware plugin in `vite.config.ts` for dev/preview parity so local header behavior mirrors deployment intent. Refactored `public/sw.js` to use a 180-second TTL for static cache entries via cache metadata and switched navigation/index requests to network-first to keep HTML updates responsive.
**Outcome:** Success — static resources now use 3-minute cache semantics, index stays low-cache/network-first, and local preview confirms the expected response headers.
**Insight:** If HTTP caching is shortened but the service worker still uses unbounded cache-first behavior, users can still see stale assets; SW strategy must be updated alongside server headers.
**Promoted to Lessons Learned:** No

### [2026-03-10] Resolve branch conflict risk by simplifying cache header implementation

**Context:** Follow-up request indicated conflict with `main` and asked to merge changes together.
**What happened:** Kept deployment-level header rules in `public/_headers` and service-worker TTL/index strategy alignment, but removed the Vite dev/preview cache-header middleware from `vite.config.ts` to minimize overlap with likely `main` config edits and reduce merge friction.
**Outcome:** Success — core 3-minute caching behavior remains in deployment config and SW logic, with fewer touch points likely to conflict.
**Insight:** For merge-conflict mitigation, preserve essential runtime/deployment behavior while trimming non-essential local tooling changes in shared config files.
**Promoted to Lessons Learned:** No
