/*
 * TagSDK, a tag development platform
 * Copyright 2013-2016, Qubit Group
 * http://opentag.qubitproducts.com
 * @author Piotr (Peter) Fronc <peter.fronc@qubitproducts.com>
 */

//:import qubit.Define
//:import qubit.opentag.Utils
//:import qubit.opentag.Timed
//:import qubit.opentag.TagsUtils
//:import qubit.opentag.pagevariable.BaseVariable
//:import qubit.opentag.pagevariable.Expression
//:import qubit.opentag.pagevariable.DOMText
//:import qubit.opentag.pagevariable.Cookie
//:import qubit.opentag.pagevariable.URLQuery

(function () {
  var Utils = qubit.opentag.Utils;
  var TagsUtils = qubit.opentag.TagsUtils;
  var Timed = qubit.opentag.Timed;
  var BaseVariable = qubit.opentag.pagevariable.BaseVariable;
  var Expression = qubit.opentag.pagevariable.Expression;
  var UniversalVariable = qubit.opentag.pagevariable.UniversalVariable;
  var DOMText = qubit.opentag.pagevariable.DOMText;
  var Cookie = qubit.opentag.pagevariable.Cookie;
  var URLQuery = qubit.opentag.pagevariable.URLQuery;

  // var log = new qubit.opentag.Log("TagHelper -> ");

  /**
   * @class qubit.opentag.TagHelper
   * #Helper class for BaseTag and GenericLoader
   * This is not an utility class but supporting class for 
   * BaseTag/GenericLoader classes.
   * This class implements some of compatibility and utility methods 
   * specific for tag execution and management.
   * 
   */
  function TagHelper() {}

  qubit.Define.clazz("qubit.opentag.TagHelper", TagHelper);

  /**
   * Injects HTML fragments for a tag.
   * This function is not error safe.
   * @param {qubit.opentag.BaseTag} tag
   * @param {Function} callback
   * @param {Boolean} tryWrite
   * @param {String} altHtml
   */
  TagHelper.injectHTMLForLoader = 
          function (tag, callback, tryWrite, altHtml) {
    var html = (altHtml !== undefined) ? altHtml : tag.getHtml();

    if (html) {
      var append = (tag.config.locationPlaceHolder === "END");
      var location = TagsUtils.getHTMLLocationForTag(tag);

      tag.log.FINE("injecting html into page:");/*L*/
      tag.log.FINE(html);/*L*/
      tag.injectHTMLNotFinished = true;
      
      try {
        if (location) {
          TagsUtils.injectHTML(location, append, html, function () {
            tag.log.FINE("finished html injection.");/*L*/
            tag.injectHTMLNotFinished = false;
            if (callback) {
              try {
                callback();
              } catch (e) {
                tag.log.ERROR("error while trying to run callback after" +/*L*/
                        " html injection: " + e);/*L*/
              }
            }
          }.bind(tag));
        } else if (tryWrite && document.readyState === "loading") {
          document.write(html);
          tag.injectHTMLNotFinished = false;
        } else {
          tag.injectHTMLFailed = new Date().valueOf();
          tag.log.ERROR("location was not found or/and html is " + /*L*/
                  "told to not to write at runtime or" + /*L*/
                  " document is already loaded. Please check tag's " +/*L*/
                  "configuration. Injection cancelled.");/*L*/
        }
      } catch (ex) {
        tag.injectHTMLNotFinished = false;
        // @TODO do we fail tags when exceptions are thrown?
        tag.injectHTMLFailed = new Date().valueOf();
        tag.log.ERROR("error while trying to inject html: " + ex);/*L*/
      }
    }
  };
    
  /**
   * @private
   * Helper function.
   * @param {qubit.opentag.BaseTag} tag
   * @param {qubit.opentag.pagevariable.BaseVariable} varRef
   * @returns {Array}
   */
  function findParamatersForVariable(tag, varRef) {
    var ret = [];
    try {
      var params = tag.parameters;
      if (params) {
        for (var i = 0; i < params.length; i++) {
          if (tag.getVariableForParameter(params[i]) === varRef) {
            ret.push(params[i]);
          }
        }
      }
    } catch (ex) {}
    return ret;
  }
  
  /**
   * 
   * @param {qubit.opentag.BaseTag} tag
   * @returns {Array} Array of [parameter,variable] pairs
   */
  TagHelper.getAllVariablesWithParameters = function (tag) {
    var vars = tag.getPageVariables();
    var results = [];
    for (var i = 0; i < vars.length; i++) {
      var pageVar = vars[i];
      var parameters = findParamatersForVariable(tag, pageVar);
      for (var j = 0; j < parameters.length; j++) {
        results.push({
          parameter: parameters[j],
          variable: pageVar
        });
      }
    }
    return results;
  };
  
  var _lock_obj = {};
  /**
   * Indicates if all parameters have variables assigned for the tag.
   * Ready means that variable values have values defined. 
   * @param {qubit.opentag.BaseTag} tag
   * @param {Boolean} tryDefaults
   * @returns {Boolean}
   */
  TagHelper.allParameterVariablesReadyForTag = function (tag, tryDefaults) {
    var useDefaults = tryDefaults;
    var log = tag.log;/*L*/
    var allReady = true;
    var vars = tag.getPageVariables();

    for (var i = 0; i < vars.length; i++) {
      var pageVar = vars[i];
      
      try {
        var parameters = findParamatersForVariable(tag, pageVar);
        var exist = pageVar.exists();
        if (!exist && useDefaults) {
          if (parameters.length > 0) {
            exist = !!parameters[0].defaultValue;
          }
          exist = exist || pageVar.exists(true);
        }

        /*log*/
        var name = pageVar.config.name ? pageVar.config.name : "[unnamed]";

        Timed.maxFrequent(function () {
          log.FINEST("Variable '" + name + "' exists? " + exist);/*L*/
        }, 5000, _lock_obj);
        /*~log*/
        
        if (!exist) {
          allReady = false;
          break;
        }
      } catch (ex) {
        /*log*/
        Timed.maxFrequent(function () {
          log.ERROR("Error checking variable existence ");
          log.ERROR([pageVar, ex]);
        }, 5000, _lock_obj);
        /*~log*/
        allReady = false;
        break;
      }
    }
    
    /*log*/
    if (allReady && !_lock_obj.alreadyNotified) {
      _lock_obj = {};
      _lock_obj.alreadyNotified = true;
    }

    Timed.maxFrequent(function () {
      log.FINEST("Checking page variables, variables are ready: " + allReady);/*L*/
      if (!allReady) {
        log.FINE("Variables not ready, waiting...");
      } else {
        _lock_obj.clear = true;
        log.FINE("Variables ready.");
      }
    }, 2000, _lock_obj);
    /*~log*/
    
    return allReady;
  };
  
  
  var JS_VALUE = "2";
  var QUERY_PARAM = "3";
  var COOKIE_VALUE = "4";
  var ELEMENT_VALUE = "5";
  
  /**
   * Gets and validates variable object for parameter.
   * This function ALWAYS return BaseVariable instance, for parameters without 
   * variables it will initialize empty one and return it.
   * @param {Object} param parameter object
   * @returns {qubit.opentag.pagevariable.BaseVariable} instance of 
   *    BaseVariable or null
   */
  TagHelper.validateAndGetVariableForParameter = function (param) {
    if (param.hasOwnProperty("variable") && param.variable) {// @todo review
      // validate it:
      param.variable = TagHelper.initPageVariable(param.variable);
      // DISABLING UV SHORT DEFINITIONS PROCESSING
//    } else if (param.uv) {// empty strings are also excluded
//      param.variable = new UniversalVariable({
//        name: param.uv,
//        value: param.uv
//      });
    }
    
    return param.variable;
  };
  
  /**
   * Function will initialize variable object depending on configuration
   * object passed. If the object is an instance of BaseVariable, it will
   * be returned unchanged.
   * @param {Object} cfg Config object or Variable instance with properties:
   *  
   *  - `cfg.type` if type is defined it will be used to resolve by number 
   *  or a type name:
   *  
   *    - `"EPRESSION"` or `2` - to instance of 
   *      qubit.opentag.pagevariable.Expression
   *    
   *    - `"URL_PARAMETER"` or `3` - to instance of 
   *      qubit.opentag.pagevariable.URLQuery
   *    
   *    - `"COOKIE_VALUE"` or `4` - to instance of 
   *      qubit.opentag.pagevariable.Cookie`
   *    
   *    - `"DOM_VALUE"` or `5` - to instance of 
   *      qubit.opentag.pagevariable.DOMText
   *    
   *    - `"any other value"` - to instance of 
   *      qubit.opentag.pagevariable.BaseVariable
   *  
   *  The `cfg` config is passed to paga variable constructor as object config.
   * 
   *  `cfg` can be also a string specifying classpath to variable instance.
   * @returns {qubit.opentag.pagevariable.BaseVariable}
   */
  TagHelper.initPageVariable = function (cfg) {
    if (!cfg || cfg instanceof BaseVariable) {
      return cfg;
    }
    
    if (typeof(cfg) === "string") {
      var tmp = Utils.getObjectUsingPath(cfg);
      if (tmp && tmp instanceof BaseVariable) {
        return tmp;
      }
    }
    
    switch (cfg.type) {
    case JS_VALUE:
      return new Expression(cfg);
    case QUERY_PARAM:
      return  new URLQuery(cfg);
    case COOKIE_VALUE:
      return new Cookie(cfg);
    case ELEMENT_VALUE:
      return new DOMText(cfg);
    case 'EPRESSION':
      return new Expression(cfg);
    case 'URL_PARAMETER':
      return  new URLQuery(cfg);
    case 'COOKIE_VALUE':
      return new Cookie(cfg);
    case 'DOM_VALUE':
      return new DOMText(cfg);
    default:
      return new BaseVariable(cfg);
    }
  };
}());