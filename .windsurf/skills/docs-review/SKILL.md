---
name: docs-review
description: Review and improve English in documentation files for brevity and clarity. Use when asked to review docs, improve documentation writing, or edit prose for clarity.
---

# Review Documentation for node-re2

Review and improve English in documentation files for brevity, clarity, and correctness.

## Steps

1. Read the target documentation file(s).
2. Check for:
   - Grammatical errors and awkward phrasing.
   - Verbose or redundant sentences — prefer concise, direct language.
   - Consistency with existing project terminology (RE2, RegExp, Buffer, nan, node-gyp, etc.).
   - Correct code examples that match the current API.
   - Accurate links (wiki, npm, GitHub).
3. Make edits directly in the file:
   - Preserve the existing structure and headings.
   - Do not add or remove comments in code examples unless explicitly asked.
   - Keep technical accuracy — do not change meaning.
4. If reviewing `README.md`, cross-check API descriptions against `re2.d.ts`.
5. If reviewing `llms.txt` or `llms-full.txt`, ensure examples are runnable and API signatures match `re2.d.ts`.
6. Report a summary of changes made.

## Style guidelines

- Use active voice.
- Prefer short sentences.
- Use "RE2" (not "re2" or "Re2") when referring to the engine or the JS object.
- Use backticks for code references: `RE2`, `Buffer`, `exec()`, etc.
- Use "e.g." and "i.e." sparingly — prefer "for example" and "that is" in longer prose.
- American English spelling.
