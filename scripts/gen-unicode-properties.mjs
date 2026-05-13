#!/usr/bin/env node
// Generate lib/unicode_properties.h covering every Unicode binary property and
// Script_Extensions value that ECMAScript's `\p{...}` accepts. RE2 itself
// supports General_Category and Script natively — those are translated
// elsewhere in lib/pattern.cc. This file ships the rest as codepoint-range
// tables that pattern.cc expands inline.
//
// Data sources:
//   - @unicode/unicode-17.0.0 (devDependency)         — per-property ranges
//   - PropertyValueAliases.txt (UCD)                   — script ISO short codes
//
// Run: node scripts/gen-unicode-properties.mjs [path-to-PropertyValueAliases.txt]
// Defaults to fetching PropertyValueAliases.txt over HTTPS.

import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const UNICODE_VERSION = '17.0.0';
const ALIASES_URL = `https://www.unicode.org/Public/UCD/latest/ucd/PropertyValueAliases.txt`;
const UNICODE_PKG = `@unicode/unicode-${UNICODE_VERSION}`;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.resolve(__dirname, '..', 'node_modules', UNICODE_PKG);
const OUTPUT_PATH = path.resolve(__dirname, '..', 'lib', 'unicode_properties.h');

// JS-spec binary properties (non-`v`-flag). Each entry: canonical name and
// any aliases the language accepts. Sources: ECMA-262 22.2.1.10 + TR-44.
// Properties of Strings (Basic_Emoji, RGI_Emoji, etc.) intentionally omitted
// — they match sequences, which need `v`-flag semantics RE2 doesn't model.
const JS_BINARY_PROPERTIES = {
  ASCII: [],
  ASCII_Hex_Digit: ['AHex'],
  Alphabetic: ['Alpha'],
  Any: [],
  Assigned: [],
  Bidi_Control: ['Bidi_C'],
  Bidi_Mirrored: ['Bidi_M'],
  Case_Ignorable: ['CI'],
  Cased: [],
  Changes_When_Casefolded: ['CWCF'],
  Changes_When_Casemapped: ['CWCM'],
  Changes_When_Lowercased: ['CWL'],
  Changes_When_NFKC_Casefolded: ['CWKCF'],
  Changes_When_Titlecased: ['CWT'],
  Changes_When_Uppercased: ['CWU'],
  Dash: [],
  Default_Ignorable_Code_Point: ['DI'],
  Deprecated: ['Dep'],
  Diacritic: ['Dia'],
  Emoji: [],
  Emoji_Component: ['EComp'],
  Emoji_Modifier: ['EMod'],
  Emoji_Modifier_Base: ['EBase'],
  Emoji_Presentation: ['EPres'],
  Extended_Pictographic: ['ExtPict'],
  Extender: ['Ext'],
  Grapheme_Base: ['Gr_Base'],
  Grapheme_Extend: ['Gr_Ext'],
  Hex_Digit: ['Hex'],
  IDS_Binary_Operator: ['IDSB'],
  IDS_Trinary_Operator: ['IDST'],
  ID_Continue: ['IDC'],
  ID_Start: ['IDS'],
  Ideographic: ['Ideo'],
  Join_Control: ['Join_C'],
  Logical_Order_Exception: ['LOE'],
  Lowercase: ['Lower'],
  Math: [],
  Noncharacter_Code_Point: ['NChar'],
  Pattern_Syntax: ['Pat_Syn'],
  Pattern_White_Space: ['Pat_WS'],
  Quotation_Mark: ['QMark'],
  Radical: [],
  Regional_Indicator: ['RI'],
  Sentence_Terminal: ['STerm'],
  Soft_Dotted: ['SD'],
  Terminal_Punctuation: ['Term'],
  Unified_Ideograph: ['UIdeo'],
  Uppercase: ['Upper'],
  Variation_Selector: ['VS'],
  White_Space: ['space'],
  XID_Continue: ['XIDC'],
  XID_Start: ['XIDS']
};

const loadAliases = async arg => {
  if (arg) return fs.readFile(arg, 'utf8');
  const res = await fetch(ALIASES_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${ALIASES_URL}`);
  return res.text();
};

const parseScriptAliases = text => {
  const map = new Map();
  for (const raw of text.split('\n')) {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) continue;
    const parts = line.split(';').map(s => s.trim());
    if (parts[0] !== 'sc') continue;
    // `sc ; Adlm ; Adlam` — alias on the left, canonical on the right.
    const [, alias, canonical] = parts;
    if (alias && canonical && alias !== canonical) {
      map.set(canonical, alias);
    }
  }
  return map;
};

const readRanges = relPath => {
  // ranges.js exports an array of UnicodeRange { begin, end } — end is exclusive.
  // Use require via createRequire so the script stays an ESM module without
  // round-tripping through dynamic import (the package is CJS-only).
  const mod = require(relPath);
  if (!Array.isArray(mod)) {
    throw new Error(`${relPath}: ranges.js did not export an array`);
  }
  // Coerce to inclusive [lo, hi] pairs.
  return mod.map(r => [r.begin, r.end - 1]).sort((a, b) => a[0] - b[0]);
};

import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);

const cidentSafe = s => s.replace(/[^A-Za-z0-9_]/g, '_');
const hex = n => `0x${n.toString(16).toUpperCase()}`;

const emitRangeArray = (lines, identSlug, ranges) => {
  lines.push(`static const UnicodeRange kRanges_${identSlug}[] = {`);
  for (const [lo, hi] of ranges) {
    lines.push(`\t{${hex(lo)}, ${hex(hi)}},`);
  }
  lines.push('};');
  lines.push('');
};

const collectBinaryProperties = () => {
  const dir = path.join(PKG_ROOT, 'Binary_Property');
  const entries = [];
  for (const [canonical, aliases] of Object.entries(JS_BINARY_PROPERTIES)) {
    const ranges = readRanges(path.join(dir, canonical, 'ranges.js'));
    entries.push({canonical, aliases, ranges});
  }
  return entries;
};

const collectScriptExtensions = scriptAliases => {
  const dir = path.join(PKG_ROOT, 'Script_Extensions');
  const dirs = require('node:fs').readdirSync(dir).sort();
  const entries = [];
  for (const canonical of dirs) {
    const stat = require('node:fs').statSync(path.join(dir, canonical));
    if (!stat.isDirectory()) continue;
    const ranges = readRanges(path.join(dir, canonical, 'ranges.js'));
    const alias = scriptAliases.get(canonical);
    entries.push({canonical, aliases: alias ? [alias] : [], ranges});
  }
  return entries;
};

const emit = (binaryEntries, scxEntries) => {
  const lines = [];
  lines.push('// Auto-generated by scripts/gen-unicode-properties.mjs — do not edit by hand.');
  lines.push('// Source: @unicode/unicode-17.0.0 + Unicode PropertyValueAliases.txt');
  lines.push(`// Unicode version: ${UNICODE_VERSION}`);
  lines.push('');
  lines.push('#pragma once');
  lines.push('');
  lines.push('#include <cstddef>');
  lines.push('#include <cstdint>');
  lines.push('');
  lines.push('struct UnicodeRange { uint32_t lo; uint32_t hi; };');
  lines.push('struct UnicodePropertyTable {');
  lines.push('\tconst char *name;');
  lines.push('\tconst UnicodeRange *ranges;');
  lines.push('\tsize_t count;');
  lines.push('};');
  lines.push('');

  const emitTable = (groupName, entries) => {
    for (const {canonical, ranges} of entries) {
      emitRangeArray(lines, cidentSafe(canonical), ranges);
    }
    lines.push(`static const UnicodePropertyTable k${groupName}[] = {`);
    for (const {canonical, aliases, ranges} of entries) {
      const slug = cidentSafe(canonical);
      lines.push(`\t{"${canonical}", kRanges_${slug}, ${ranges.length}},`);
      for (const alias of aliases) {
        lines.push(`\t{"${alias}", kRanges_${slug}, ${ranges.length}},`);
      }
    }
    lines.push('};');
    lines.push(`static const size_t k${groupName}Count = sizeof(k${groupName}) / sizeof(UnicodePropertyTable);`);
    lines.push('');
  };

  emitTable('BinaryProperties', binaryEntries);
  emitTable('ScriptExtensions', scxEntries);

  return lines.join('\n');
};

const main = async () => {
  const aliasesText = await loadAliases(process.argv[2]);
  const scriptAliases = parseScriptAliases(aliasesText);
  const binaryEntries = collectBinaryProperties();
  const scxEntries = collectScriptExtensions(scriptAliases);
  const out = emit(binaryEntries, scxEntries);
  await fs.writeFile(OUTPUT_PATH, out);

  const totalBinaryRanges = binaryEntries.reduce((a, e) => a + e.ranges.length, 0);
  const totalScxRanges = scxEntries.reduce((a, e) => a + e.ranges.length, 0);
  console.error(`Wrote ${OUTPUT_PATH}`);
  console.error(`Binary properties: ${binaryEntries.length} canonical (${totalBinaryRanges} ranges total)`);
  console.error(`Script_Extensions: ${scxEntries.length} canonical (${totalScxRanges} ranges total)`);
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
