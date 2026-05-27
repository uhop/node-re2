# Contributing to node-re2

Thank you for your interest in contributing!

## Getting started

This project uses git submodules for vendored dependencies (RE2 and Abseil). Clone recursively:

```bash
git clone --recursive git@github.com:uhop/node-re2.git
cd node-re2
npm install
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the module map and dependency graph.

## Development workflow

1. Make your changes.
2. Rebuild the addon: `npm run rebuild`
3. Lint: `npm run lint:fix`
4. Test: `npm test`
5. Type-check: `npm run ts-check`

## Code style

- CommonJS (`require()`/`module.exports`) in JavaScript source, ESM (`import`) in tests (`.mjs`).
- C++ code uses tabs (4-wide indentation). JavaScript uses 2-space indentation.
- Formatted with Prettier — see `.prettierrc` for settings.
- C++ addon API uses nan (Native Abstractions for Node.js).
- Keep `re2.js` and `re2.d.ts` in sync.

## Important notes

- Never edit files under `vendor/` — they are git submodules.
- RE2 always operates in Unicode mode — the `u` flag is added implicitly.
- Buffer support is a first-class feature — all methods must handle both strings and Buffers.

## License

This project is distributed under the [BSD-3-Clause license](./LICENSE).
External contributions are accepted only under licenses compatible with
BSD-3-Clause; submissions under fundamentally incompatible licenses cannot
be merged.

## AI agents

If you are an AI coding agent, see [AGENTS.md](./AGENTS.md) for detailed project conventions, commands, and architecture.
