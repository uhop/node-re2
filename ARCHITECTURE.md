# Architecture

`node-re2` provides Node.js bindings for Google's [RE2](https://github.com/google/re2) regular expression engine. It is a C++ native addon built with `node-gyp` and `nan`. The `RE2` object is a drop-in replacement for `RegExp` with guaranteed linear-time matching (no ReDoS).

## Project layout

```
package.json              # Package config; "tape6" section configures test discovery
binding.gyp               # node-gyp build configuration for the C++ addon
re2.js                    # Main entry point: loads native addon, sets up Symbol aliases
re2.d.ts                  # TypeScript declarations for the public API
tsconfig.json             # TypeScript config (noEmit, strict, types: ["node"])
lib/                      # C++ source code (native addon)
├── addon.cc              # Node.js addon initialization, method registration
├── wrapped_re2.h         # WrappedRE2 class definition (core C++ wrapper)
├── wrapped_re2_set.h     # WrappedRE2Set class definition (RE2.Set wrapper)
├── isolate_data.h        # Per-isolate data struct for thread-safe addon state
├── new.cc                # Constructor: parse pattern/flags, create RE2 instance
├── exec.cc               # RE2.prototype.exec() implementation
├── test.cc               # RE2.prototype.test() implementation
├── match.cc              # RE2.prototype.match() implementation
├── replace.cc            # RE2.prototype.replace() implementation
├── search.cc             # RE2.prototype.search() implementation
├── split.cc              # RE2.prototype.split() implementation
├── to_string.cc          # RE2.prototype.toString() implementation
├── accessors.cc          # Property accessors (source, flags, lastIndex, etc.)
├── pattern.cc            # Pattern translation (RegExp → RE2 syntax, Unicode classes)
├── pattern.h             # Pattern translation declarations
├── set.cc                # RE2.Set implementation (multi-pattern matching)
├── util.cc               # Shared utilities (UTF-8/UTF-16 conversion, buffer helpers)
└── util.h                # Utility declarations
scripts/
└── verify-build.js       # Quick smoke test for the built addon
tests/                    # Test files (test-*.mjs using tape-six)
ts-tests/                 # TypeScript type-checking tests
└── test-types.ts         # Verifies type declarations compile correctly
bench/                    # Benchmarks
vendor/                   # Vendored C++ dependencies (git submodules) — DO NOT MODIFY
├── re2/                  # Google RE2 library source
└── abseil-cpp/           # Abseil C++ library (RE2 dependency)
.github/                  # CI workflows, Dependabot config, actions
```

## Core concepts

### How the addon works

1. `re2.js` is the entry point. It loads the compiled C++ addon from `build/Release/re2.node`.
2. The addon exposes an `RE2` constructor that wraps `re2::RE2` from Google's RE2 library.
3. `re2.js` adds `Symbol.match`, `Symbol.search`, `Symbol.replace`, `Symbol.split`, and `Symbol.matchAll` to the prototype so `RE2` instances work with ES6 string methods.
4. The `RE2` constructor can be called with or without `new` (factory mode).

### C++ addon structure

Each RegExp method has its own `.cc` file for maintainability:

| File            | Purpose                                                          |
| --------------- | ---------------------------------------------------------------- |
| `addon.cc`      | Node.js module initialization, registers all methods/accessors   |
| `isolate_data.h` | Per-isolate data struct (`AddonData`) for thread-safe addon state |
| `wrapped_re2.h` | `WrappedRE2` class: holds `re2::RE2*`, flags, lastIndex, source |
| `new.cc`        | Constructor: parses pattern + flags, translates syntax, creates RE2 instance |
| `exec.cc`       | `exec()` — find match with capture groups                       |
| `test.cc`       | `test()` — boolean match check                                  |
| `match.cc`      | `match()` — String.prototype.match equivalent                   |
| `replace.cc`    | `replace()` — substitution with string or function replacer     |
| `search.cc`     | `search()` — find index of first match                          |
| `split.cc`      | `split()` — split string by pattern                             |
| `to_string.cc`  | `toString()` — `/pattern/flags` representation                  |
| `accessors.cc`  | Property getters: `source`, `flags`, `lastIndex`, `global`, `ignoreCase`, `multiline`, `dotAll`, `unicode`, `sticky`, `hasIndices`, `internalSource` |
| `pattern.cc`    | Translates JS RegExp syntax to RE2 syntax, maps Unicode property names |
| `set.cc`        | `RE2.Set` — multi-pattern matching via `re2::RE2::Set`          |
| `util.cc`       | UTF-8 ↔ UTF-16 conversion, buffer/string helpers                |

### Pattern translation (pattern.cc)

JavaScript RegExp features are translated to RE2 equivalents:

- Named groups: `(?<name>...)` syntax is preserved (RE2 supports it natively).
- Unicode classes: long names like `\p{Letter}` are mapped to short names `\p{L}`. Script names like `\p{Script=Latin}` are mapped to `\p{Latin}`.
- Backreferences and lookahead assertions are **not supported** — RE2 throws `SyntaxError`.

### Buffer support

All methods accept both strings and Node.js Buffers:

- Buffer inputs are assumed UTF-8 encoded.
- Buffer inputs produce Buffer outputs (in composite result objects too).
- Offsets and lengths are in bytes (not characters) when using Buffers.
- The `useBuffers` property on replacer functions controls offset reporting in `replace()`.

### RE2.Set (set.cc)

Multi-pattern matching using `re2::RE2::Set`:

- `new RE2.Set(patterns, flags?, options?)` — compile multiple patterns into a single automaton.
- `set.test(str)` — returns `true` if any pattern matches.
- `set.match(str)` — returns array of indices of matching patterns.
- Properties: `size`, `source`, `sources`, `flags`, `anchor`.

### Build system

- `binding.gyp` defines the node-gyp build: compiles all `.cc` files in `lib/` plus vendored RE2 and Abseil sources.
- Platform-specific compiler flags are set for GCC, Clang, and MSVC.
- The `install` npm script first tries to download a prebuilt `re2.node` from GitHub Releases via `install-artifact-from-github`, falling back to a local `node-gyp rebuild`.
- Prebuilt artifacts cover: Linux (x64, arm64, Alpine/musl), macOS (x64, arm64), Windows (x64, arm64).

## Module dependency graph

```
re2.js ──→ build/Release/re2.node (compiled C++ addon)
                │
                ├── lib/addon.cc (init)
                │     ├── lib/new.cc ──→ lib/pattern.cc
                │     ├── lib/exec.cc
                │     ├── lib/test.cc
                │     ├── lib/match.cc
                │     ├── lib/replace.cc
                │     ├── lib/search.cc
                │     ├── lib/split.cc
                │     ├── lib/to_string.cc
                │     ├── lib/accessors.cc
                │     └── lib/set.cc
                │
                ├── lib/wrapped_re2.h (shared class definition)
                ├── lib/wrapped_re2_set.h (RE2.Set class)
                ├── lib/util.cc / lib/util.h (shared utilities)
                │
                └── vendor/ (re2 + abseil-cpp)
```

## Testing

- **Framework**: tape-six (`tape6`)
- **Run all**: `npm test` (worker threads via `tape6 --flags FO`)
- **Run sequential**: `npm run test:seq`
- **Run multi-process**: `npm run test:proc`
- **Run single file**: `node tests/test-<name>.mjs`
- **TypeScript check**: `npm run ts-check`
- **Lint**: `npm run lint` (Prettier check)
- **Lint fix**: `npm run lint:fix` (Prettier write)
- **Verify build**: `npm run verify-build` (quick smoke test)

## Import paths

```js
// CommonJS (source, scripts)
const RE2 = require('re2');

// ESM (tests)
import {RE2} from '../re2.js';
```
