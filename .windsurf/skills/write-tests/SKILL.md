---
name: write-tests
description: Write or update tape-six tests for a module or feature. Use when asked to write tests, add test coverage, or create typing tests for node-re2.
---

# Write Tests for node-re2

Write or update tests using the tape-six testing library.

## Steps

1. Read `node_modules/tape-six/TESTING.md` for the full tape-six API reference (assertions, hooks, patterns, configuration).
2. Identify the module or feature to test. Read its source code to understand the public API.
3. Check existing tests in `tests/` for node-re2 conventions and patterns.
4. Create or update the test file in `tests/`:
   - For runtime tests use `.mjs`.
   - Import RE2 with: `import {default as RE2} from '../re2.js';`
   - Import tape-six with: `import test from 'tape-six';`
   - Test with both **string** and **Buffer** inputs — Buffer support is a first-class feature.
   - Test edge cases: empty strings, no match, global flag behavior, lastIndex, Unicode input.
5. For TypeScript typing tests, update `ts-tests/test-types.ts`:
   - Verify typed usage patterns compile correctly.
   // turbo
6. Run the new test file directly to verify: `node tests/test-<name>.mjs`
   // turbo
7. Run the full test suite to check for regressions: `npm test`
   - If debugging, use `npm run test:seq` (runs sequentially, easier to trace issues).
8. Report results and any failures.

## node-re2 test conventions

- Test file naming: `test-*.mjs` in `tests/`.
- TypeScript typing tests: `test-*.ts` in `ts-tests/`.
- Runtime tests (`.mjs`): ESM imports, `import test from 'tape-six'`.
- Tests are configured in `package.json` under the `"tape6"` section.
- Test files should be directly executable: `node tests/test-foo.mjs`.
- Existing tests use synchronous `t => { ... }` style (not async/promise-based).
- Always test both string and Buffer variants of methods.
- Use `t.ok()`, `t.equal()`, `t.deepEqual()`, `t.fail()` for assertions.
- Use try/catch blocks to test error conditions (e.g., invalid patterns throwing `SyntaxError`).
