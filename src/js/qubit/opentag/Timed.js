//:import qubit.Define
//:import qubit.opentag.Timer

/*
 * TagSDK, a tag development platform
 * Copyright 2013-2016, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {

  qubit.Define.namespace("qubit.opentag.Timed", new qubit.opentag.Timer({
    rate: 37,
    dynamic: true
  }));

  /**
   * Singleton instance of qubit.opentag.Timer class with default rate of 20ms
   * 
   * This is a very useful object that replaces (wraps) standard `setTimeout` 
   * function. By using `qubit.opentag.Timer` instance all processes are 
   * controlled in a single timer loop with dynamic type execution. Dynamic 
   * type means that no time outs are created if execution stack of Timer 
   * class is empty. 
   * 
   * See [qubit.opentag.Timer](#!/api/qubit.opentag.Timer) for more details.
   * 
   * @class qubit.opentag.Timed
   * @singleton
   * @static
   * @extends qubit.opentag.Timer
   */
  var Timed = qubit.opentag.Timed;

  /**
   * Will wait for `test` function to return true, and when it return true
   * callback will be fired. It will check on `test` method no more often than
   * `often` number of milisecons. 
   * @param {Function} test
   * @param {Function} callback
   * @param {Number} often
   */
  Timed.tillTrue = function (test, callback, often) {
    var runner = function () {
      if (!test()) {
        Timed.setTimeout(runner, often || 33);
      } else {
        callback();
      }
    };

    runner();
  };

})();
