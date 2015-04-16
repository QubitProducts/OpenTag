//:include qubit/opentag/Utils.js
//:include qubit/Define.js

/*
 * TagSDK, a tag development platform
 * Copyright 2013-2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  var Utils = qubit.opentag.Utils;
  
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
    //defaults
    this.config = {};
    
    /*log*/
    //Add for all detailed logger and collector
    this.log = new qubit.opentag.Log("", function () {
      return this.CLASS_NAME + "[" + this.uniqueId + "]";
    }.bind(this), "collectLogs");
    /*~log*/
    
    this.parameters = null;
    
    if (config) {
      this.uniqueId = "BV" + BV_COUNTER++;
      BaseVariable.ALL_VARIABLES[this.uniqueId] = this;
      
      for (var prop in config) {
        this.config[prop] = config[prop];
      }
      
      if (config.value !== undefined) {
        this.value = config.value;
      }
      
      if (config.defaultValue !== undefined) {
        this.defaultValue = config.defaultValue;
      }
      
      var ret = BaseVariable.register(this);
      if (ret && ret !== this) {
        ret.log.FINEST("Variable config already registered.");
        ret.log.FINEST("Returning existing one.");
      }
      return ret;
      //return this or an existing configuration
    }
  }
  
  qubit.Define.clazz("qubit.opentag.pagevariable.BaseVariable", BaseVariable);
  
  BaseVariable.ALL_VARIABLES = {};

  BaseVariable.pageVariables = [];

  /**
   * @static
   * Static function used to register variable globally.
   * All page variable instances are exposed as 
   * `qubit.opentag.pagevariable.BaseVariable.pageVariables`.
   * @param {qubit.opentag.pagevariable.BaseVariable} config
   */
  BaseVariable.register = function (variable) {
    if (variable instanceof BaseVariable) {
      for (var i = 0; i < BaseVariable.pageVariables.length; i++) {
        var regVar = BaseVariable.pageVariables[i];
        if ((variable.constructor === regVar.constructor) &&
                (propertiesMatch(regVar.config, variable.config))) {
          return regVar;//exit
        }
      }
      BaseVariable.pageVariables.push(variable);
      return variable;
    }
    return null;
  };
  
  //helper function
  function propertiesMatch(cfg, ccfg) {
    for (var cprop in ccfg) {
      var value = ccfg[cprop];
      for (var prop in cfg) {
        if (cfg.hasOwnProperty(prop)) {
          if (cfg[prop] !== value) {
            return false;
          }
        } 
      }
    }
    return true;
  }
  
  /**
   * BaseVariable returns exactly whats set.
   * @returns {Object}
   */
  BaseVariable.prototype.getValue = function () {
    return this.value;
  };
  
  /**
   * Naturally, the value is always string, as its used to deduct real value.
   * This function sets value directly on `this.value` property - each
   * implementation of `BaseVariable` can interpret getting value different!
   * @param {String} string
   */
  BaseVariable.prototype.setValue = function (string) {
    this.value = string;
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
}());