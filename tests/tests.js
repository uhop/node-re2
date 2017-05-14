"use strict";


var unit = require("heya-unit");

var testGeneral  = require("./test_general");
var testExec     = require("./test_exec");
var testTest     = require("./test_test");
var testToString = require("./test_toString");
var testMatch    = require("./test_match");
var testReplace  = require("./test_replace");
var testSearch   = require("./test_search");
var testSplit    = require("./test_split");
var testInvalid  = require("./test_invalid");


unit.run();
