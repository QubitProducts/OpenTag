/*jslint evil: true */
//= require <html/html>

q.html.GlobalEval = {};

// TODO: write unit test for this.

// Adapted from http://weblogs.java.net/blog/driscoll/archive/2009/09/08/eval-javascript-global-context
q.html.GlobalEval.globalEval = function (src) {
  if (window.execScript) {
    window.execScript(src === "" ? " " : src);
  } else {
    var fn = function () {
      window["eval"].call(window, src);
    };
    fn();
  }
};