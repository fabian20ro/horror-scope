# Lessons Learned

> Maintained by AI agents. Contains validated, reusable insights.
> **Read at the start of every task. Update at the end of every iteration.**

## How to Use This File

### Reading (Start of Every Task)
Read this before writing any code to avoid repeating known mistakes.

### Writing (End of Every Iteration)
If a new reusable insight was gained, add it to the appropriate category.

### Promotion from Iteration Log
Patterns appearing 2+ times in `ITERATION_LOG.md` should be promoted here.

### Pruning
Obsolete lessons → Archive section at bottom (with date and reason). Never delete.

---

## Architecture & Design Decisions

<!-- Format: **[YYYY-MM-DD]** Brief title — Explanation -->

**[2026-03-04]** Grammar data lives in `public/data/` — Grammar rules are loaded at runtime from section-based `.txt` files via `fetch()`, not compiled into the JS bundle. This allows editing without rebuilding and provides a natural CDN migration path. UI strings remain in TypeScript for type safety. The `@include` directive supports splitting large sections into separate files under `public/data/{locale}/`.

## Code Patterns & Pitfalls

<!-- Format: **[YYYY-MM-DD]** Brief title — Explanation -->

## Testing & Quality

<!-- Format: **[YYYY-MM-DD]** Brief title — Explanation -->

**[2026-03-04]** Exclude test files from tsconfig build — When test files use Node-only modules (`node:fs`, `node:path`) in a browser-targeted project, add `"exclude": ["src/**/*.test.ts"]` to `tsconfig.json`. Vitest type-checks tests separately; `tsc` in the build script doesn't need to.

## Performance & Infrastructure

<!-- Format: **[YYYY-MM-DD]** Brief title — Explanation -->

## Dependencies & External Services

<!-- Format: **[YYYY-MM-DD]** Brief title — Explanation -->

## Process & Workflow

<!-- Format: **[YYYY-MM-DD]** Brief title — Explanation -->

---

## Archive

<!-- Format: **[YYYY-MM-DD] Archived [YYYY-MM-DD]** Title — Reason for archival -->
