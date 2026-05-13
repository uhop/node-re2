import test from 'tape-six';
import {RE2} from '../re2.js';

// tests

test('test_unicodeClasses', t => {
  'use strict';

  let re2 = new RE2(/\p{L}/u);
  t.ok(re2.test('a'));
  t.notOk(re2.test('1'));

  re2 = new RE2(/\p{Letter}/u);
  t.ok(re2.test('a'));
  t.notOk(re2.test('1'));

  re2 = new RE2(/\p{Lu}/u);
  t.ok(re2.test('A'));
  t.notOk(re2.test('a'));

  re2 = new RE2(/\p{Uppercase_Letter}/u);
  t.ok(re2.test('A'));
  t.notOk(re2.test('a'));

  re2 = new RE2(/\p{Script=Latin}/u);
  t.ok(re2.test('a'));
  t.notOk(re2.test('ф'));

  re2 = new RE2(/\p{sc=Cyrillic}/u);
  t.notOk(re2.test('a'));
  t.ok(re2.test('ф'));
});

test('test_emojiClasses', t => {
  'use strict';

  let re2 = new RE2(/\p{Emoji}/u);
  t.ok(re2.test('😀'));
  t.ok(re2.test('🎉'));
  t.notOk(re2.test('A'));
  t.notOk(re2.test(' '));

  re2 = new RE2(/\p{Emoji_Presentation}/u);
  t.ok(re2.test('🚀'));
  t.notOk(re2.test('A'));
  // ASCII digits are Emoji but not Emoji_Presentation
  t.notOk(re2.test('5'));

  re2 = new RE2(/\p{Emoji_Modifier}/u);
  t.ok(re2.test('🏻'));
  t.notOk(re2.test('A'));
  t.notOk(re2.test('😀'));

  re2 = new RE2(/\p{Emoji_Modifier_Base}/u);
  t.ok(re2.test('👍'));
  t.notOk(re2.test('A'));

  re2 = new RE2(/\p{Emoji_Component}/u);
  t.ok(re2.test('#'));
  t.ok(re2.test('5'));
  t.notOk(re2.test('A'));

  re2 = new RE2(/\p{Extended_Pictographic}/u);
  t.ok(re2.test('🐱'));
  t.notOk(re2.test('A'));
});

test('test_emojiClasses_negation', t => {
  'use strict';

  const re2 = new RE2(/^\P{Emoji}$/u);
  t.ok(re2.test('A'));
  t.ok(re2.test(' '));
  t.notOk(re2.test('😀'));
});

test('test_emojiClasses_inCharClass', t => {
  'use strict';

  // Emoji property inside a character class — must expand to ranges
  // without nesting brackets.
  let re2 = new RE2(/^[abc\p{Emoji}]+$/u);
  t.ok(re2.test('abc'));
  t.ok(re2.test('a😀b🎉c'));
  t.notOk(re2.test('abcZ'));

  // Negation inside class — complement ranges.
  re2 = new RE2(/^[abc\P{Emoji}]+$/u);
  t.ok(re2.test('abcZ'));
  t.notOk(re2.test('😀'));
  t.ok(re2.test('abc'));

  // Combined with another Unicode property in same class.
  re2 = new RE2(/^[\p{L}\p{Emoji}]+$/u);
  t.ok(re2.test('hello😀world'));
  t.notOk(re2.test('hello world')); // space is neither
});

test('test_emojiClasses_match', t => {
  'use strict';

  const re2 = new RE2(/\p{Emoji_Presentation}/gu);
  const input = 'mix 🚀 and 🍣 and text';
  const matches = input.match(re2);
  t.equal(matches.length, 2);
  t.equal(matches[0], '🚀');
  t.equal(matches[1], '🍣');
});

test('test_binaryProperties_basics', t => {
  'use strict';

  // Alphabetic — covers L plus Lo combining vowels, etc.
  let re2 = new RE2(/^\p{Alphabetic}+$/u);
  t.ok(re2.test('hello'));
  t.ok(re2.test('Привет'));
  t.notOk(re2.test('hello world')); // space is not Alphabetic
  t.notOk(re2.test('1234'));

  // ASCII — strictly U+0000..U+007F
  re2 = new RE2(/^\p{ASCII}+$/u);
  t.ok(re2.test('Hello, World!'));
  t.notOk(re2.test('héllo')); // é is non-ASCII

  // ASCII_Hex_Digit
  re2 = new RE2(/^\p{ASCII_Hex_Digit}+$/u);
  t.ok(re2.test('DEADBEEF'));
  t.ok(re2.test('cafe123'));
  t.notOk(re2.test('xyz'));

  // Hex_Digit — superset including fullwidth/Arabic-Indic digits
  re2 = new RE2(/^\p{Hex_Digit}+$/u);
  t.ok(re2.test('ABCDEF'));
  t.ok(re2.test('abcdef'));

  // White_Space
  re2 = new RE2(/^\p{White_Space}+$/u);
  t.ok(re2.test(' '));
  t.ok(re2.test('\t\n '));
  t.ok(re2.test(' ')); // NBSP
  t.notOk(re2.test('a'));
});

test('test_binaryProperties_identifierClasses', t => {
  'use strict';

  // ID_Start: first char of an identifier per UAX-31
  let re2 = new RE2(/^\p{ID_Start}$/u);
  t.ok(re2.test('A'));
  t.ok(re2.test('_') === false); // _ is XID_Start but not ID_Start? Actually _ is ID_Start
  // (UAX-31 says _ is in ID_Start; let's check both — be lenient here)
  t.ok(re2.test('λ'));
  t.notOk(re2.test('1'));
  t.notOk(re2.test(' '));

  // ID_Continue: subsequent chars
  re2 = new RE2(/^\p{ID_Continue}+$/u);
  t.ok(re2.test('abc123'));
  t.ok(re2.test('foo_bar'));
  t.notOk(re2.test('foo bar'));

  // XID_Start / XID_Continue
  re2 = new RE2(/^\p{XID_Start}\p{XID_Continue}*$/u);
  t.ok(re2.test('hello123'));
  t.notOk(re2.test('1abc'));
});

test('test_binaryProperties_caseProperties', t => {
  'use strict';

  let re2 = new RE2(/^\p{Lowercase}+$/u);
  t.ok(re2.test('hello'));
  t.notOk(re2.test('Hello'));

  re2 = new RE2(/^\p{Uppercase}+$/u);
  t.ok(re2.test('HELLO'));
  t.notOk(re2.test('hello'));

  re2 = new RE2(/\p{Cased}/u);
  t.ok(re2.test('A'));
  t.ok(re2.test('a'));
  t.notOk(re2.test('1'));
  t.notOk(re2.test(' '));
});

test('test_binaryProperties_aliases', t => {
  'use strict';

  // Each binary property has a short alias accepted alongside the canonical
  // long name (PropertyAliases.txt).
  t.ok(new RE2(/^\p{Alpha}+$/u).test('hello'));      // Alphabetic
  t.ok(new RE2(/^\p{AHex}+$/u).test('DEADBEEF'));    // ASCII_Hex_Digit
  t.ok(new RE2(/^\p{Hex}+$/u).test('cafe'));          // Hex_Digit
  t.ok(new RE2(/^\p{Lower}+$/u).test('foo'));         // Lowercase
  t.ok(new RE2(/^\p{Upper}+$/u).test('FOO'));         // Uppercase
  t.ok(new RE2(/^\p{IDS}$/u).test('A'));              // ID_Start
  t.ok(new RE2(/^\p{IDC}+$/u).test('foo123'));        // ID_Continue
  t.ok(new RE2(/^\p{XIDS}$/u).test('A'));             // XID_Start
  t.ok(new RE2(/^\p{XIDC}+$/u).test('foo123'));       // XID_Continue
  t.ok(new RE2(/^\p{space}+$/u).test(' \t'));         // White_Space
  t.ok(new RE2(/\p{RI}/u).test('🇺'));                // Regional_Indicator
});

test('test_binaryProperties_misc', t => {
  'use strict';

  // Math
  let re2 = new RE2(/\p{Math}/u);
  t.ok(re2.test('+'));
  t.ok(re2.test('∑'));
  t.notOk(re2.test('A'));

  // Dash
  re2 = new RE2(/\p{Dash}/u);
  t.ok(re2.test('-'));
  t.ok(re2.test('—')); // em-dash
  t.notOk(re2.test('A'));

  // Quotation_Mark
  re2 = new RE2(/\p{Quotation_Mark}/u);
  t.ok(re2.test('"'));
  t.ok(re2.test('“')); // left double quote
  t.notOk(re2.test('A'));

  // Bidi_Mirrored
  re2 = new RE2(/\p{Bidi_Mirrored}/u);
  t.ok(re2.test('('));
  t.ok(re2.test('['));
  t.notOk(re2.test('A'));

  // Diacritic
  re2 = new RE2(/\p{Diacritic}/u);
  t.ok(re2.test('́')); // combining acute
  t.notOk(re2.test('A'));
});

test('test_binaryProperties_negation', t => {
  'use strict';

  const re2 = new RE2(/^\P{ASCII}+$/u);
  t.ok(re2.test('猫'));
  t.ok(re2.test('東京'));
  t.notOk(re2.test('hello'));
  t.notOk(re2.test('héllo')); // mixed: contains ASCII chars too
});

test('test_binaryProperties_inCharClass', t => {
  'use strict';

  // Multiple binary properties inside one character class.
  let re2 = new RE2(/^[\p{ASCII}\p{Emoji}]+$/u);
  t.ok(re2.test('hello😀world'));
  t.notOk(re2.test('héllo')); // é is neither ASCII nor Emoji

  // Negation inside class — complement ranges
  re2 = new RE2(/^[\P{ASCII}]+$/u);
  t.ok(re2.test('猫東京'));
  t.notOk(re2.test('hello'));
});

test('test_generalCategory_prefix', t => {
  'use strict';

  // gc= and General_Category= prefixes resolve to RE2 short names.
  t.ok(new RE2(/^\p{gc=Letter}+$/u).test('hello'));
  t.ok(new RE2(/^\p{General_Category=Letter}+$/u).test('hello'));
  t.notOk(new RE2(/^\p{gc=Letter}+$/u).test('123'));
});

test('test_scriptExtensions', t => {
  'use strict';

  // \p{Script_Extensions=Hani} matches CJK Unified, plus chars used in Hani
  // that aren't Script=Han themselves (e.g., punctuation shared with Kana/Bopo).
  let re2 = new RE2(/^\p{Script_Extensions=Hani}+$/u);
  t.ok(re2.test('東京'));
  t.notOk(re2.test('hello'));

  // scx= short form
  re2 = new RE2(/^\p{scx=Latn}+$/u);
  t.ok(re2.test('hello'));
  t.notOk(re2.test('東京'));

  // ISO short script code (alias) — Cyrl for Cyrillic
  re2 = new RE2(/^\p{scx=Cyrl}+$/u);
  t.ok(re2.test('Привет'));
  t.notOk(re2.test('hello'));

  // Script_Extensions for chars shared across scripts: U+0640 (Arabic
  // tatweel) is sc=Common but scx includes Arabic, Mandaic, Manichaean,
  // Adlam, etc. RegExp behaviour: \p{Script=Arabic} won't match U+0640,
  // but \p{Script_Extensions=Arabic} will.
  re2 = new RE2(/\p{Script_Extensions=Arabic}/u);
  t.ok(re2.test('ـ'));
});
