---
description: Pre-release verification checklist for node-re2
---

# Release Check

Run through this checklist before publishing a new version.

## Steps

1. Check that `re2.js` and `re2.d.ts` are in sync (all exports, all types).
2. Check that `ARCHITECTURE.md` reflects any structural changes.
3. Check that `AGENTS.md` is up to date with any rule or workflow changes.
4. Check that `.windsurfrules`, `.clinerules`, `.cursorrules` are in sync with `AGENTS.md`.
5. Check that `llms.txt` and `llms-full.txt` are up to date with any API changes.
6. Verify `package.json`:
   - `files` array includes all necessary entries (`binding.gyp`, `lib`, `re2.d.ts`, `scripts/*.js`, `vendor`).
   - `main` points to `re2.js`.
   - `types` points to `re2.d.ts`.
7. Check that the copyright year in `LICENSE` includes the current year.
8. Bump `version` in `package.json`.
9. Update release history in `README.md`.
10. Run `npm install` to regenerate `package-lock.json`.
    // turbo
11. Rebuild the native addon: `npm run rebuild`
    // turbo
12. Run the quick smoke test: `npm run verify-build`
    // turbo
13. Run the full test suite: `npm test`
    // turbo
14. Run TypeScript check: `npm run ts-check`
    // turbo
15. Run lint: `npm run lint`
    // turbo
16. Dry-run publish to verify package contents: `npm pack --dry-run`
