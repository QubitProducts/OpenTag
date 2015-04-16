//:include qubit/compat/Function.js

//PKG_ROOT is the default packaging root.
var PKG_ROOT = {__anonymous__: true};
var GLOBAL = null;
//remove this block to hide implementation
try {
  GLOBAL = (false || eval)("this") || (function () { return this; }());
} catch (e) {}

//direct reference, is referred everywhere
//GLOBAL will ALWAYS refer to shared global scope, either in node or browser
//however, entire classpath can be hidden, if necessary
PKG_ROOT = GLOBAL; //$anonymous or not

var qubit = PKG_ROOT.qubit || {};
if (!PKG_ROOT.qubit) {
  PKG_ROOT.qubit = qubit;
}

qubit.VERSION = "1.1.10";

try {
  module.exports = PKG_ROOT;
} catch (e) {}

//shortcuts
var EMPTY_FUN = function () {};
var UNDEF;
