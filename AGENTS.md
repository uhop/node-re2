# AGENTS.md — node-re2

> `node-re2` provides Node.js bindings for [RE2](https://github.com/google/re2): a fast, safe alternative to backtracking regular expression engines. The npm package name is `re2`. It is a C++ native addon built with `node-gyp` and `nan`.

For project structure, module dependencies, and the architecture overview see [ARCHITECTURE.md](./ARCHITECTURE.md).
For detailed usage docs see the [README](./README.md) and the [wiki](https://github.com/uhop/node-re2/wiki).

## Setup

This project uses git submodules for vendored dependencies (RE2 and Abseil):

```bash
git clone --recursive https://github.com/uhop/node-re2.git
cd node-re2
npm install
```

If the native addon fails to download a prebuilt artifact, it builds locally via `node-gyp`.

## Commands

- **Install:** `npm install` (downloads prebuilt artifact or builds from source)
- **Build (release):** `npm run rebuild` (or `node-gyp -j max rebuild`)
- **Build (debug):** `npm run rebuild:dev` (or `node-gyp -j max rebuild --debug`)
- **Test:** `npm test` (runs `tape6 --flags FO`, worker threads)
- **Test (sequential):** `npm run test:seq`
- **Test (multi-process):** `npm run test:proc`
- **Test (single file):** `node tests/test-<name>.mjs`
- **TypeScript check:** `npm run ts-check`
- **Lint:** `npm run lint` (Prettier check)
- **Lint fix:** `npm run lint:fix` (Prettier write)
- **Verify build:** `npm run verify-build`

## Project structure

```
node-re2/
├── package.json          # Package config; "tape6" section configures test discovery
├── binding.gyp           # node-gyp build configuration for the C++ addon
├── re2.js                # Main entry point: loads native addon, sets up Symbol aliases
├── re2.d.ts              # TypeScript declarations for the public API
├── tsconfig.json         # TypeScript config (noEmit, strict, types: ["node"])
├── lib/                  # C++ source code (native addon)
│   ├── addon.cc          # Node.js addon initialization, method registration
│   ├── wrapped_re2.h     # WrappedRE2 class definition (core C++ wrapper)
│   ├── wrapped_re2_set.h # WrappedRE2Set class definition (RE2.Set wrapper)
│   ├── isolate_data.h    # Per-isolate data struct for thread-safe addon state
│   ├── new.cc            # Constructor: parse pattern/flags, create RE2 instance
│   ├── exec.cc           # RE2.prototype.exec() implementation
│   ├── test.cc           # RE2.prototype.test() implementation
│   ├── match.cc          # RE2.prototype.match() implementation
│   ├── replace.cc        # RE2.prototype.replace() implementation
│   ├── search.cc         # RE2.prototype.search() implementation
│   ├── split.cc          # RE2.prototype.split() implementation
│   ├── to_string.cc      # RE2.prototype.toString() implementation
│   ├── accessors.cc      # Property accessors (source, flags, lastIndex, etc.)
│   ├── pattern.cc        # Pattern translation (RegExp → RE2 syntax, Unicode classes)
│   ├── set.cc            # RE2.Set implementation (multi-pattern matching)
│   ├── util.cc           # Shared utilities (UTF-8/UTF-16 conversion, buffer helpers)
│   ├── util.h            # Utility declarations
│   └── pattern.h         # Pattern translation declarations
├── scripts/
│   └── verify-build.js   # Quick smoke test for the built addon
├── tests/                # Test files (test-*.mjs using tape-six)
├── ts-tests/             # TypeScript type-checking tests
│   └── test-types.ts     # Verifies type declarations compile correctly
├── bench/                # Benchmarks
├── vendor/               # Vendored C++ dependencies (git submodules)
│   ├── re2/              # Google RE2 library source
│   └── abseil-cpp/       # Abseil C++ library (RE2 dependency)
└── .github/              # CI workflows, Dependabot config, actions
```

## Code style

- **CommonJS** throughout (`"type": "commonjs"` in package.json).
- **No transpilation** — JavaScript code runs directly.
- **C++ code** uses tabs for indentation, 4-wide. JavaScript uses 2-space indentation.
- **Prettier** for JS/TS formatting (see `.prettierrc`): 80 char width, single quotes, no bracket spacing, no trailing commas, arrow parens "avoid".
- **nan** (Native Abstractions for Node.js) for the C++ addon API.
- Semicolons are enforced by Prettier (default `semi: true`).
- Imports use `require()` syntax in source, `import` in tests (`.mjs`).

## Critical rules

- **Do not modify vendored code.** Never edit files under `vendor/`. They are git submodules.
- **Do not modify or delete test expectations** without understanding why they changed.
- **Do not add comments or remove comments** unless explicitly asked.
- **Keep `re2.js` and `re2.d.ts` in sync.** All public API exposed from `re2.js` must be typed in `re2.d.ts`.
- **The addon must build on all supported platforms:** Linux (x64, arm64, Alpine), macOS (x64, arm64), Windows (x64, arm64).
- **RE2 is always Unicode-mode.** The `u` flag is always added implicitly.
- **Buffer support is a first-class feature.** All methods that accept strings must also accept Buffers, returning Buffers when given Buffer input.

## Architecture

- `re2.js` is the main entry point. It loads the native C++ addon from `build/Release/re2.node` and sets up `Symbol.match`, `Symbol.search`, `Symbol.replace`, `Symbol.split`, and `Symbol.matchAll` on the prototype.
- The C++ addon (`lib/*.cc`) wraps Google's RE2 library via nan. Each RegExp method has its own `.cc` file.
- `lib/new.cc` handles construction: parsing patterns, translating RegExp syntax to RE2 syntax (via `lib/pattern.cc`), and creating the underlying `re2::RE2` instance.
- `lib/pattern.cc` translates JavaScript RegExp features to RE2 equivalents, including Unicode class names (`\p{Letter}` → `\p{L}`, `\p{Script=Latin}` → `\p{Latin}`).
- `lib/set.cc` implements `RE2.Set` for multi-pattern matching using `re2::RE2::Set`.
- `lib/util.cc` provides UTF-8 ↔ UTF-16 conversion helpers and buffer utilities.
- Prebuilt native artifacts are hosted on GitHub Releases and downloaded at install time via `install-artifact-from-github`.

## Writing tests

```js
import test from 'tape-six';
import {RE2} from '../re2.js';

test('example', t => {
  const re = new RE2('a(b*)', 'i');
  const result = re.exec('aBbC');
  t.ok(result);
  t.equal(result[0], 'aBb');
  t.equal(result[1], 'Bb');
});
```

- Test files use `tape-six`: `.mjs` for runtime tests, `.ts` for TypeScript typing tests.
- Test file naming convention: `test-*.mjs` in `tests/`, `test-*.ts` in `ts-tests/`.
- Tests are configured in `package.json` under the `"tape6"` section.
- Test files should be directly executable: `node tests/test-foo.mjs`.

## Key conventions

- The library is a drop-in replacement for `RegExp` — the `RE2` object emulates the standard `RegExp` API.
- `RE2.Set` provides multi-pattern matching: `new RE2.Set(patterns, flags, options)`.
- Static helpers: `RE2.getUtf8Length(str)`, `RE2.getUtf16Length(buf)`.
- `RE2.unicodeWarningLevel` controls behavior when non-Unicode regexps are created.
- The `install` script tries to download a prebuilt `.node` artifact before falling back to `node-gyp rebuild`.
- All C++ source is in `lib/`, all vendored third-party C++ is in `vendor/`.
