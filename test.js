var RE2 = require("./build/Release/re2.node");

console.log(RE2);

var regex = new RE2("quick\\s(brown).+?(jumps)", "ig");

console.log(regex);
console.log(regex.prototype);
console.log(regex instanceof RE2);

console.log(regex.exec);
console.log(regex.test);
console.log(regex.replace);
console.log(regex.split);

console.log("global" in regex);
console.log("ignoreCase" in regex);
console.log("multiline" in regex);
console.log("lastIndex" in regex);

var result = regex.exec("The Quick Brown Fox Jumps Over The Lazy Dog");
console.log("result:", result, regex.lastIndex);

console.log(regex.global);
console.log(regex.ignoreCase);
console.log(regex.multiline);
console.log(regex.lastIndex);

regex.lastIndex = 2;
console.log(regex.lastIndex);
