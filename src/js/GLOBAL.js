//:import qubit.compat.Function

// PKG_ROOT is the default packaging root.
var PKG_ROOT = {__anonymous__: true};
var GLOBAL = null;
// remove this block to hide implementation
try {
  GLOBAL = (false || eval)("this");
} catch (e) {}

if (!GLOBAL) {
  try {
    var that = function () { return this; };
    GLOBAL = that();
  } catch (ex) {}
}
// direct reference, is referred everywhere
// GLOBAL will ALWAYS refer to shared global scope, either in node or browser
// however, entire classpath can be hidden, if necessary
PKG_ROOT = GLOBAL; //$anonymous or not

var qubit = PKG_ROOT.qubit || {};
if (!PKG_ROOT.qubit) {
  PKG_ROOT.qubit = qubit;
}

var qversion = "3.1.1-r2";

if (qubit.VERSION && qubit.VERSION !== qversion) {
  try {
    console.warn("There is already 'qubit.VERSION' set to: " + qubit.VERSION);
  } catch (ex) {}
}

qubit.VERSION = qversion;

try {
  if (typeof module === 'object') {
    module.exports = PKG_ROOT;
  }
} catch (e) {}

// shortcuts
var EMPTY_FUN = function () {};
var UNDEF;
