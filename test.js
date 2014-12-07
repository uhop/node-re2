var RE2 = require("./build/Release/re2.node");

console.log(RE2);
console.log(!!RE2.prototype);

var regex = new RE2("quick\\s(brown).+?(jumps)", "ig");

console.log(regex);
console.log(regex instanceof RE2);

console.log(regex.exec);
console.log(regex.test);

console.log(regex.match);
console.log(regex.replace);
console.log(regex.search);
console.log(regex.split);

console.log("source" in regex);
console.log("global" in regex);
console.log("ignoreCase" in regex);
console.log("multiline" in regex);
console.log("lastIndex" in regex);

console.log(regex.source);
console.log(regex.global);
console.log(regex.ignoreCase);
console.log(regex.multiline);
console.log(regex.lastIndex);

var result = regex.exec("The Quick Brown Fox Jumps Over The Lazy Dog");
console.log("exec:", result, regex.lastIndex);
regex.lastIndex = 0;
console.log("test:", regex.test("The Quick Brown Fox Jumps Over The Lazy Dog"), regex.lastIndex);
