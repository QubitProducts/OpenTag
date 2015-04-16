//:include qubit/Define.js
//:include qubit/opentag/pagevariable/BaseVariable.js
//:include qubit/Cookie.js
//:include qubit/opentag/Timed.js

/*
 * TagSDK, a tag development platform
 * Copyright 2013-2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  var Timed = qubit.opentag.Timed;

  
  /**
   * #Cookie page variable class.
   * 
   * This object is used to controll logic behind cookie object manipulation
   * and values retrieval for Cookie type page variables.
   * 
   * 
   * @class qubit.opentag.pagevariable.Cookie
   * @extends qubit.opentag.pagevariable.BaseVariable
   * @param config {Object} config object used to build instance
   */
  function Cookie(config) {
    Cookie.superclass.apply(this, arguments);
    this._lockObject = {};
  }
  
  qubit.Define.clazz(
          "qubit.opentag.pagevariable.Cookie",
          Cookie,
          qubit.opentag.pagevariable.BaseVariable);
  
  /**
   * Returns value for the variable object - here it returns
   * cookie by using string defined at `this.value` object.
   * @returns {String} cookie value
   */
  Cookie.prototype.getValue = function () {
    var val = qubit.Cookie.get(this.value);
    Timed.maxFrequent(function () {
      this.log.FINEST("reading cookie value: " + val);
    }.bind(this), 2000, this._lockObject);
    return val;
  };
  
}());