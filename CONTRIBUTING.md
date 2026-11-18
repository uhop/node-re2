# Contributing to node-re2

Thank you for your interest in contributing!

## Discuss significant changes first

Every significant change starts as a conversation. Before you write code, open a
[discussion](https://github.com/uhop/node-re2/discussions) or an
[issue](https://github.com/uhop/node-re2/issues) that describes the problem and the change you
propose, and wait for a maintainer to approve it explicitly. A pull request for a significant
change that wasn't discussed and approved first isn't merged, and may be closed without review.

A significant change is anything beyond a small fix: a new feature or option, a change to the
public API or to documented behavior, a new dependency, a refactor, or a change to the build, the
tests, or CI. Small fixes can go straight to a pull request: a typo, a broken link, or a bug fix
of a few lines with a test that fails without it.

The discussion saves your time as much as ours: a change that doesn't fit the project is cheaper
to turn down before it is written. Approval covers the plan you described, and the pull request is
still reviewed against it.

To report a security vulnerability, don't use a public discussion or issue: follow
[SECURITY.md](./SECURITY.md).

### What a change has to fit

Read the README and the [wiki](https://github.com/uhop/node-re2/wiki) first: they say what
node-re2 is for and how it is meant to be used.

- **The project's purpose.** node-re2 is a drop-in replacement for `RegExp` that matches untrusted
  text in linear time, using Google's RE2 engine. A change that takes it outside that purpose, or
  that serves one application's special needs, belongs in a fork you maintain yourself. The license
  allows it, and for a special need it is the better path.
- **The cost of keeping it.** A merged change is maintained here from then on, by the maintainer:
  its author rarely comes back to fix what turns up later. Each feature also grows the API and the
  documentation every user has to learn. A change has to be worth that cost, and a feature can be
  declined for that reason alone.
- **Speed.** Speed is one of the reasons to choose node-re2 over the built-in engine. A change to
  matching, the result builders, or the conversions between strings, buffers, and offsets comes
  with benchmark results before and after (see `bench/`), and doesn't slow the common case.
- **One concern per pull request.** A pull request that mixes several changes goes back to its
  author to be split.

## Getting started

This project uses git submodules for vendored dependencies (RE2 and Abseil). Clone recursively:

```bash
git clone --recursive https://github.com/uhop/node-re2.git
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
