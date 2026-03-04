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

<!-- New entries above this line, most recent first -->
