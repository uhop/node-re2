'use strict';

// This is a light-weight script to make sure that the package works.

const assert = require('assert').strict;

const RE2  = require("../re2");

const sample = "abbcdefabh";

const re1 = new RE2("ab*", "g");
assert(re1.test(sample));

const re2 = RE2("ab*");
assert(re2.test(sample));

const re3 = new RE2("abc");
assert(!re3.test(sample));
