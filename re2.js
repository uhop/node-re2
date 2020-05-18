'use strict';


var binary = require('node-pre-gyp');
var path = require('path');
var binding_path = binary.find(path.resolve(path.join(__dirname,'./package.json')));
var RE2 = require(binding_path);

if (typeof Symbol != 'undefined') {
  Symbol.match &&
    (RE2.prototype[Symbol.match] = function(str) {
      return this.match(str);
    });
  Symbol.search &&
    (RE2.prototype[Symbol.search] = function(str) {
      return this.search(str);
    });
  Symbol.replace &&
    (RE2.prototype[Symbol.replace] = function(str, repl) {
      return this.replace(str, repl);
    });
  Symbol.split &&
    (RE2.prototype[Symbol.split] = function(str, limit) {
      return this.split(str, limit);
    });
}

module.exports = RE2;
