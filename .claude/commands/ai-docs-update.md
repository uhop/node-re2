---
description: Update AI-facing documentation files after API or architecture changes
---

# AI Documentation Update

Update all AI-facing files after changes to the public API, modules, or project structure.

## Steps

1. Read `re2.js` and `re2.d.ts` to identify the current public API.
2. Read `AGENTS.md` and `ARCHITECTURE.md` for current state.
3. Identify what changed (new methods, new flags, new C++ files, renamed exports, removed features, etc.).
4. Update `llms.txt`:
   - Ensure the API section matches `re2.d.ts`.
   - Update common patterns if new features were added.
   - Keep it concise — this is for quick LLM consumption.
5. Update `llms-full.txt`:
   - Full API reference with all methods, options, and examples.
   - Include any new features, RE2.Set changes, or Buffer behavior.
6. Update `ARCHITECTURE.md` if project structure or module dependencies changed.
7. Update `AGENTS.md` if critical rules, commands, or architecture quick reference changed.
8. Sync `.windsurfrules`, `.cursorrules`, `.clinerules` if `AGENTS.md` changed:
   - These three files should be identical copies of the condensed rules.
9. Update `README.md` if the public-facing docs need to reflect new features.
10. Track progress with the todo list and provide a summary when done.
