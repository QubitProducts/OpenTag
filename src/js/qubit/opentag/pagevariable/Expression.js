//:import qubit.Define
//:import qubit.opentag.pagevariable.BaseVariable
//:import qubit.opentag.Timed

/*
 * TagSDK, a tag development platform
 * Copyright 2013-2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  var Utils = qubit.opentag.Utils;
  var Timed = qubit.opentag.Timed;
  
  /**
   * #Expression type variable class.
   * 
   * This class controlls how expression based page variables are executed
   * and parsed. It will detect universal variable "arrays" objects with hash
   * notation. It also provides all utilities to deal with expressions defined
   * as a `uv` properties on parameter objects in tag configuration.
   * In typical scenarion this class wil evaluate strings passed as values and
   * return the value via `getValue`.
   * 
   * 
   * Author: Peter Fronc <peter.fronc@qubitdigital.com>
   * 
   * @class qubit.opentag.pagevariable.Expression
   * @extends qubit.opentag.pagevariable.BaseVariable
   * @param config {Object} config object used to build instance
   */
  function Expression(config) {
    this._lockExprObject = {};
    Expression.SUPER.apply(this, arguments);
  }
  
  qubit.Define.clazz(
          "qubit.opentag.pagevariable.Expression",
          Expression,
          qubit.opentag.pagevariable.BaseVariable);

  /**
   * This getter is a heart of the Expression class, it detects if 
   * the expression contains "hashed" array typical for universal variable
   * and depending on result it evaluates directly string to value or
   * parse the hashed array and evaluates results to be returned.
   * @returns {Object}
   */
  Expression.prototype.getValue = function () {
    var ret;
    var error;
    try {
      if (this.value.indexOf("[#]") === -1) {
        var tmp = Utils.gevalAndReturn(this.value);
        ret = tmp.result;
        this.failMessage = null;
        error = tmp.error;
      } else {
        ret = Expression.parseUVArray(this.value);
      }
    } catch (e) {
      error = e;
    }
    if (error) {
      var msg = "could not read value of expression: \n" + this.value +
              "\nexact cause: " + error;
      if (this.failMessage !== msg) {
        this.failMessage = msg;
      }
      ret = null;
    }
    /*log*/
    Timed.maxFrequent(function () {
      if (this.failMessage) {
        this.log.FINEST(this.failMessage);/*L*/
      }
      this.log.FINEST("getting value from expression: " + ret);/*L*/
    }.bind(this), 10000, this._lockExprObject);
    /*~log*/
    return ret;
  };
  
  /**
   * Modern get value function for hashed UV (universla variables).
   * It replaces and simplifies old implementation.
   * @param {String} uv
   * @returns {Array}
   */
  Expression.parseUVArray = function (uv) {
    var parts = uv.split("[#]");
    var array = Utils.gevalAndReturn(parts[0]).result;
    var collection = [];
    var pathOfElements = parts[1];
    
    if (pathOfElements.indexOf(".") === 0) {
      pathOfElements = pathOfElements.replace(".", "");
    }
    
    for (var i = 0; i < array.length; i++) {
      var element = Utils.getObjectUsingPath(pathOfElements, array[i]);
      collection.push(element);
    }
    
    return collection;
  };

  /**
   * Function replacing token for Expression object.
   * It checks if this variable is an Array and intruct
   * parent `replaceToken` to use accessor string instead of direct value.
   * 
   * @param {String} token
   * @param {String} string
   * @param {Object} altValue
   * @param {String} exp
   * @returns {String} replaced string
   */
  Expression.prototype.replaceToken =
          function (token, string, altValue, exp) {
    if ((this.getValue() instanceof Array)) {
      exp = true;
    }
    //UV case! this is a hack abit - copied logic from origins
    return Expression.SUPER.prototype
       .replaceToken.call(this, token, string, altValue, exp);
  };
  
}());