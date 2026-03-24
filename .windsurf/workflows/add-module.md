---
description: Checklist for adding a new C++ method or JS feature to node-re2
---

# Add a New Module

Follow these steps when adding a new method, feature, or C++ implementation.

## New C++ method (e.g., `lib/foo.cc`)

1. Create `lib/foo.cc` with the implementation.
   - Use nan for the Node.js addon API.
   - Follow existing patterns in `lib/exec.cc` or `lib/test.cc`.
   - Tabs for indentation, 4-wide.
   - Include `lib/wrapped_re2.h` and `lib/util.h` as needed.
2. Register the method in `lib/addon.cc`:
   - Add `Nan::SetPrototypeMethod(tpl, "foo", Foo);` or equivalent.
3. Add the method to `lib/wrapped_re2.h` if it needs a static declaration.
4. Add the source file to `binding.gyp` in the `"sources"` array.
   // turbo
5. Rebuild the addon: `npm run rebuild`
6. Update `re2.js` if JS-side setup is needed (e.g., Symbol aliases).
7. Update `re2.d.ts` with TypeScript declarations for the new method.
   - Keep `re2.js` and `re2.d.ts` in sync.
8. Create `tests/test-foo.mjs` with automated tests (tape-six, ESM):
   - `import {default as RE2} from '../re2.js';`
   - Test with strings and Buffers.
   - Test edge cases (empty input, no match, global flag, etc.).
   // turbo
9. Run the new test: `node tests/test-foo.mjs`
10. Update TypeScript tests in `ts-tests/test-types.ts` if the public API changed.
11. Update `README.md` with documentation for the new feature.
12. Update `ARCHITECTURE.md` — add to project layout and C++ addon table.
13. Update `llms.txt` and `llms-full.txt` with a description and examples.
14. Update `AGENTS.md` if the architecture quick reference needs updating.
    // turbo
15. Verify: `npm test`
    // turbo
16. Verify: `npm run ts-check`
    // turbo
17. Verify: `npm run lint`

## JS-only feature (e.g., new Symbol alias, helper)

1. Add the implementation to `re2.js`.
2. Update `re2.d.ts` with TypeScript declarations.
3. Create or update tests in `tests/`.
   // turbo
4. Run the new test: `node tests/test-<name>.mjs`
5. Update `README.md`, `llms.txt`, `llms-full.txt`.
6. Update `AGENTS.md` and `ARCHITECTURE.md` if needed.
   // turbo
7. Verify: `npm test`
   // turbo
8. Verify: `npm run ts-check`
   // turbo
9. Verify: `npm run lint`
