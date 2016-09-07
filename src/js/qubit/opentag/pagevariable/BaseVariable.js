//:import qubit.opentag.Utils
//:import qubit.Define
//:import qubit.opentag.Timed

/*
 * TagSDK, a tag development platform
 * Copyright 2013-2016, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  var Utils = qubit.opentag.Utils;
  var Timed = qubit.opentag.Timed;
  var log = new qubit.opentag.Log("BaseVariable -> ");/*L*/
    
  var BV_COUNTER = 0;
  
  /**
   * 
   * 
   * #Page variable base object. 
   * 
   * It is a base for all page variable objects.
   * Page variable is an object that is used to resolve certain value on a page
   * (a number, object, string etc.).
   * Tags that have parameters defined use BaseVariables instances to get values
   * from the page by bonding variable instances to the parameter objects.
   * That way when value for parameter is fetched - bonded variable is used
   * to get the value from page. Page variable objects can be shared 
   * among different parameters and tags. 
   * 
   * This concepts exists as page variables values retrieval can be a complex 
   * process, including even external server calls.
   * 
   * Each parameter can have defined default value within its configuration.
   * In new TagSDK API, also variable object can have default value - in old
   * qtag configuration this feature is not used.
   * 
   * **Please note: variables with same configurations return old instance.**
   * 
   * 
   * @class qubit.opentag.pagevariable.BaseVariable
   * @param config {Object} config object used to build instance
   */
  function BaseVariable(config) {
    // defaults
    this.config = {};
    this.handlers = [];
    /*log*/
    // Add for all detailed logger and collector
    this.log = new qubit.opentag.Log("", function () {
      return this.CLASS_NAME + "[" + this.uniqueId + "]";
    }.bind(this), "collectLogs");
    /*~log*/
    
    this.parameters = null;
    
    /**
     * If this property is set then 
     *        listener handlers will be triggered on each value read.
     * @property {Boolean} callHandlersOnRead 
     */
    this.callHandlersOnRead = false;
    
    if (config) {
      this.uniqueId = "BV" + BV_COUNTER++;
      BaseVariable.ALL_VARIABLES[this.uniqueId] = this;
      
      for (var prop in config) {
        if (config.hasOwnProperty(prop)) {
          this.config[prop] = config[prop];
          if (prop === "value") {
            this.value = config.value;
          }
        }
      }
      
      var ret = BaseVariable.register(this);
      if (ret && ret !== this) {
        ret.log.FINEST("Variable config already registered.");/*L*/
        ret.log.FINEST("Returning existing one.");/*L*/
      }
      
      return ret;
    }
  }
  
  qubit.Define.clazz("qubit.opentag.pagevariable.BaseVariable", BaseVariable);
  
  BaseVariable.ALL_VARIABLES = {};
  
  var OBSERVED_VARIABLES = [];
  BaseVariable.OBSERVED_VARIABLES = OBSERVED_VARIABLES;
  
  BaseVariable.pageVariables = [];

  /**
   * @static
   * Static function used to register variable globally.
   * All page variable instances are exposed as 
   * `qubit.opentag.pagevariable.BaseVariable.pageVariables`.
   * @param {qubit.opentag.pagevariable.BaseVariable} variable
   */
  BaseVariable.register = function (variable) {
    if (variable instanceof BaseVariable) {
      for (var i = 0; i < BaseVariable.pageVariables.length; i++) {
        var regVar = BaseVariable.pageVariables[i];
        if (variable === regVar) {
          return regVar;// exit
        }
      }
      BaseVariable.pageVariables.push(variable);
      return variable;
    }
    return null;
  };
  
  /**
   * BaseVariable returns variable current value. It is not a plain getter and
   * children classes often reimplement its behaviour.
   * 
   * This function must always return valid runtime value of this variable 
   * object.
   * 
   * 
   * 
   * @returns {Object}
   */
  BaseVariable.prototype.getValue = function () {
    // validate and dispatch
    this._updateCurrentValue(this.value);
    return this.currentValue;
  };

  /**
   * @protected
   * 
   * When overwriting `getValue()` function remember to call this function with 
   * value returned passed as the argument - this function takes care of 
   * seting currentValue and dispatching change handling event.
   * 
   * It is protected and should be used with care.
   * 
   * When overwriting this method remember that `getValue()` byt default returns
   * `this.currentValue` which this function sets - therefore should be also
   * reimplemented. 
   * 
   * In most cases only "getValue" needs to be implemented in sub-classes.
   * 
   * @param {Object} newValue new value that getValue have generated.
   * @returns {Boolean}
   */
  BaseVariable.prototype._updateCurrentValue = function (newValue) {
    if (!this.valuesAreEqual(newValue, this.currentValue)) {
      this.oldValue = this.currentValue;
      this.currentValue = newValue;
      if (!observingStopped || this.callHandlersOnRead) {
        this._handleValueChanged();
      }
      return true;
    }
    return false;
  };
  
  /**
   * BaseVariable returns exactly whats set.
   * @returns {Object}
   */
  BaseVariable.prototype.getDefaultValue = function () {
    return this.defaultValue;
  };
  
  /**
   * Naturally, the value is always string, as its used to deduct real value.
   * @param {String} string
   */
  BaseVariable.prototype.setDefaultValue = function (string) {
    this.defaultValue = string;
  };
  
  /**
   * Variable logical (!) existance indicator.
   * @param {Boolean} useDefaults  if should check that defaults count in
   * @returns {Boolean}
   */
  BaseVariable.prototype.exists = function (useDefaults) {
    var exists = Utils.variableExists(this.getValue());
    if (useDefaults) {
      exists = exists || Utils.variableExists(this.getDefaultValue());
    }
    return exists;
  };
  
  /**
   * Relative value is a value fallbing back in order:
   * 1) try normal value
   * 2) try defaults value suggested by argument
   * 3) try fallback defaults of variable instance itself
   * 
   * @param {Boolean} useDefaults Try internal defaults if all fails
   * @param {Object} defaultValue Alternative value if does not exist. Note, it
   *        has higher priority than variable defaults.
   * @returns {Object}
   */
  BaseVariable.prototype.getRelativeValue = 
          function (useDefaults, defaultValue) {
    var pageValue = this.getValue();
    
    if (!Utils.variableExists(pageValue)) {
      pageValue = defaultValue;
    }
    var defLoc;
    if (useDefaults && !Utils.variableExists(pageValue)) {
      defLoc = this.getDefaultValue();
      if (Utils.variableExists(defLoc)) {
        pageValue = defLoc;
      }
    }
    return pageValue;
  };
  
  /**
   * Function replacing token in a stgring with value of the variable, or,
   * if value does not exists, with accessor string - a special code that 
   * can retrieve this variable value from any scope. It is useful for html
   * fragments that cannot be evaluated or value should be entered later.
   * @param {String} token
   * @param {String} string
   * @param {Boolean} useExpressionAccessor
   * @param {String} altValue
   * @returns {String} replacement
   */
  BaseVariable.prototype.replaceToken =
          function (token, string, altValue, useExpressionAccessor) {
    var exists = this.exists();
    var value = exists ? this.getValue() : altValue;
    token = "\\$\\{" + token + "\\}";
    
    if ((useExpressionAccessor || (value instanceof Array))) {
      var acessorString;
      if (exists) {
        acessorString = this.getValueAccessorString();
      } else {
        acessorString = Utils.getAnonymousAcessor(value);
      }
      return string.replace(new RegExp(token, "g"), acessorString);
    } else {
      return string.replace(new RegExp(token, "g"), value);
    }
  };
  
  /**
   * Variable instance accessor string. It is easy to access directly variable
   *  by evaluating this string.
   * @returns {String}
   */
  BaseVariable.prototype.getAccessorString = function () {
    return "qubit.opentag.pagevariable.BaseVariable.ALL_VARIABLES." +
              this.uniqueId;
  };
  
  /**
   * Variable value accessor string. It is easy to access variable VALUE
   *  by evaluating this string.
   * @returns {String}
   */
  BaseVariable.prototype.getValueAccessorString = function () {
    return this.getAccessorString() + ".getValue()";
  };
  
  /**
   * 
   * Variables does support value changed event handlers and handlers can be 
   * added using this function. Callback will receive oldValue
   * and variable instance reference as parameters.
   * 
   * Example:
   * ```
   *    varRef.onValueChanged(function(oldValue, variableRef){
   *      console.log(variableRef.getValue() !== oldValue); // true
   *    });
   * ```
   * @param {Function} callback
   * @param {Boolean} startObserving
   * @returns {undefined}
   */
  BaseVariable.prototype.onValueChanged = function (callback, startObserving) {
    if (Utils.addToArrayIfNotExist(this.handlers, callback) === -1) {
      this.log.FINE("Attached value changed handler: " + callback);/*L*/
    }
    
    if (startObserving !== false) {
      this.startObservingForChanges();
    }
  };
  
  BaseVariable.prototype.deatchOnValueChanged = function (callback) {
    if (Utils.removeFromArray(this.handlers, callback) > 0) {
      this.log.FINE("Dettached value changed handler: " + callback);/*L*/
    }
  };
  
  /**
   * @protected
   * 
   * Protected helper handling value changed.
   */
  BaseVariable.prototype._handleValueChanged = function () {
    var event = {
      oldValue: this.oldValue,
      newValue: this.currentValue,
      variable: this
    };
    
    for (var i = 0; i < this.handlers.length; i++) {
      try {
        this.handlers[i](event);
      } catch (e) {
        this.log.ERROR(/*L*/
          "Error while calling qprotocol variable change handler: " + e);/*L*/
      }
    }
  };
  
  var observingStopped = true;
  /**
   * @static
   * This property indicates how often polling will occur for monitoring 
   * variables. Default value is 333 (in miliseconds).
   * 
   * Simply adjust `qubit.opentag.pagevariable.BaseVariable.CHECK_POLL_RATE`
   * at any time to control polling rate.
   * 
   * 
   * @property {Number} BaseVariable.CHECK_POLL_RATE
   */
  BaseVariable.CHECK_POLL_RATE = 333;
  
  function checkIfChangedAndContinue() {
    if (observingStopped) {
      return false;
    }
    
    for (var i = 0; i < OBSERVED_VARIABLES.length; i++) {
      try {
        var variable = OBSERVED_VARIABLES[i];
        // get value triggers the update on new value
        variable.getValue();
      } catch (ex) {
        log.ERROR("Value change update exception: " + ex);/*L*/
      }
    }
    
    Timed.setTimeout(checkIfChangedAndContinue, BaseVariable.CHECK_POLL_RATE);
    
    return true;
  }
  
  /**
   * Function is responsible for starting this variable to be monitored.
   * By deafult it will run (if necessary) observer loop and add this variable 
   * to observed objects pool.
   */
  BaseVariable.prototype.startObservingForChanges = function () {
    this.addToObservedVariables(); // make sure this variable is observed
    if (observingStopped) {
      observingStopped = false;
      checkIfChangedAndContinue();
    }
  };
  
  /**
   * Function will cause stopping observing this variable - no variable change
   * events will bepublished any more. If this is a last variable in a pool - it
   * will also stop the polling engine.
   */
  BaseVariable.prototype.stopObservingForChanges = function () {
    this.removeFromObservedVariables();
    if (OBSERVED_VARIABLES.length === 0) {
      observingStopped = true;
    }
  };
  
  /**
   * Function adds this variable to the pool.
   */
  BaseVariable.prototype.addToObservedVariables = function () {
    Utils.addToArrayIfNotExist(OBSERVED_VARIABLES, this);
  };
  
  /**
   * Function removes this variable from the pool.
   */
  BaseVariable.prototype.removeFromObservedVariables = function () {
    Utils.removeFromArray(OBSERVED_VARIABLES, this);
  };
  
  /**
   * Function returns all variables array that are monitored for changes.
   */
  BaseVariable.prototype.getObservedVariables = function () {
    return OBSERVED_VARIABLES;
  };
  
  /**
   * Override this method to compare how old variable value is equal to 
   * new value. currently if `a` was old this.getValue() result, and `b` is new,
   * `a === b` is returned.
   * 
   * @param {Object} a leftside value to be 
   *                    compared (old value of this.getValue())
   * @param {Object} b rightside value to be 
   *                    compared (new value of this.getValue())
   * @returns {Boolean} if equal
   */
  BaseVariable.prototype.valuesAreEqual = function (a, b) {
    return a === b;
  };
  
}());