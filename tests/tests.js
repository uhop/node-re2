"use strict";


var unit = require("heya-unit");

require("./test_general");
require("./test_source");
require("./test_exec");
require("./test_test");
require("./test_toString");
require("./test_match");
require("./test_replace");
require("./test_search");
require("./test_split");
require("./test_invalid");
require("./test_symbols");
require("./test_prototype");
require("./test_new");
require("./test_groups");

unit.run();
