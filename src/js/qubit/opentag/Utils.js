//:import qubit.Define
//:import qubit.Cookie

/*
 * TagSDK, a tag development platform
 * Copyright 2013-2016, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  
  var Define = qubit.Define;
  var Cookie = qubit.Cookie;
  
  /**
   * @class qubit.opentag.Utils
   * @singleton
   * 
   * #Generic Utility
   * 
   * It delivers utility tools for copying or traversing objects, acessing
   * and manipulating CSS class names, managing arrays, creating classes and
   * many more useful utilities. Please see the API.
   * 
   */
  var Utils = function () {};
  
  var global = Define.global();
  
  Define.clazz("qubit.opentag.Utils", Utils);
  
  /**
   * @deprecated see Define class.
   * 
   * Global scope accessor.
   * @returns {Object}
   */
  Utils.global = Define.global;
  
  /**
   * @deprecated see Define class.
   * 
   * Function builds desired name space.
   * It will not override existing elements.
   * @param {String} path
   * @param {Object} instance
   * @param {Object} pckg
   * @param {Boolean} noOverride
   * @returns {Object}
   */
  Utils.namespace = Define.namespace;
  
  /**
   * @deprecated see Define class.
   * 
   * Utility for simple class declaration (not definition).
   * It does similiar job as namespace with addition of adding CLASS_NAME
   * and PACKAGE_NAME on prototype. It also sets SUPER to extending class
   * instance.
   * 
   * @param {String} path
   * @param {Object} instance
   * @param {Function} extendingClass
   * @param {Object} pckg
   * @param {Object} config
   * @returns {Object} the class instance
   */
  Utils.clazz = Define.clazz;
  
  /**
   * Function resolving string with classpath to object addressed.
   * @param {String} path
   * @param {Object} base
   * @returns {Object}
   */
  Utils.getObjectUsingPath = function (path, base) {
    base = base || global;
    var parts = path.split(".");
    for (var i = 0; i < parts.length; i++) {
      if (base && parts[i]) {
        base = base[parts[i]];
      }
    }
    return base;
  };
  
  /**
   * Function gets parent object from name.
   * @param {type} name
   * @returns {Object}
   */
  Utils.getParentObject = function (name) {
    var idx = name.lastIndexOf(".");
    var path = name.substring(0, idx);
    return Utils.getObjectUsingPath(path);
  };

  
  
  
  /**
   * @deprecated.
   * Function checking if a page variable reference exists.
   * @param {Object} value
   * @returns {Boolean}
   */
  Utils.variableExists = function (value) {
    return (value !== undefined) && (value !== null);
  };

  Utils.ANON_VARS = [];
  /**
   * Function will create anonymous accessro string that when evaluated returns
   * object reference to object passed as a argument.
   * @param {Object} obj
   * @returns {String}
   */
  Utils.getAnonymousAcessor = function (obj) {
    var index = Utils.indexInArray(obj, Utils.ANON_VARS);
    if (index === -1) {
      index = addAnonymousAcessor(obj);
    }
    
    return "qubit.opentag.Utils.ANON_VARS[" + index + "]";
  };
  
  /**
   * Function adding an object to anonymous accessors array.
   * Strictly private.
   * @private
   * @param {Object} obj
   * @returns {Number}
   */
  function addAnonymousAcessor(obj) {
    return Utils.addToArrayIfNotExist(Utils.ANON_VARS, obj);
  }

  // GENERIC
  function escapeRegExp(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  }
  
  /**
   * Function replacing all matching instances of regex "patterns" in "string" 
   * with "replace" string.
   * 
   * Very useful wrapper.
   * 
   * @param {String} string
   * @param {String} pattern regex
   * @param {String} replace replacement string
   * @returns {String} results
   */
  Utils.replaceAll = function (string, pattern, replace) {
    return string.replace(new RegExp(escapeRegExp(pattern), 'g'), replace);
  };
  
  /**
   * Make text secure for innerHTML.
   * Function is quickly securing text so it's parts will not be html 
   * interpreted with `innerHTML` methods.
   * @param {String} string
   * @returns {String} String stripped from &lt; and &gt; chars.
   */
  Utils.secureText = function (string) {
    if (typeof (string) !== "string") {
      string += "";
    }
    string = string.replace(/</g, "&lt;");
    string = string.replace(/>/g, "&gt;");
    return string;
  };

  /**
   * Utility method getting the browser's URL.
   * @returns {String} document.location.href value
   */
  Utils.getUrl = function () {
    return document.location.href;
  };

  /**
   * Function gets url query parameters value.
   * 
   * @param {String} param
   * @returns {String}
   */
  Utils.getQueryParam = function (param) {
    var i, ii, params, url, query, queries, splitQuery;
    url = Utils.getUrl();
    if (url.indexOf("?") > 0) {
      queries = url.substring(url.indexOf("?") + 1).split("&");
      for (i = 0, ii = queries.length; i < ii; i += 1) {
        query = queries[i];
        if (query.indexOf("=") > 0) {
          splitQuery = query.split("=");
          if ((splitQuery.length === 2) && (splitQuery[0] === param)) {
            return splitQuery[1];
          }
        }
      }
    }
    return null;
  };

  /**
   * Function gets DOM Element text value (not inner HTML value).
   * @param {String} elementId
   * @returns {String} string value or null if element is invalid
   */
  Utils.getElementValue = function (elementId) {
    var el = document.getElementById(elementId);
    if (el) {
      return el.textContent || el.innerText;
    }
    return null;
  };
  
  // private helper for objectCopy
  var travelArray = [];
  function existsInPath(object, copy) {
    var len = travelArray.length;
    for (var i = 0; i < len; i++) {
      if (object === travelArray[i][0]) {
        return travelArray[i][1];
      }
    }
    
    travelArray[travelArray.length] = [object, copy];

    return false;
  }
  /**
   * Copy object.
   * deep option must be passed to protect from circural references.
   * 
   * Note that functions are treated as objects and some global scope objects
   *  are excluded from traversing.
   *  
   *  **Remember: by default DOM node and window element types are excluded
   *  from inclusion as they hage enormous properties tree contents - function 
   *  does circural checks but still the object is enormous.**
   *  
   * @param {Object} obj object to copy
   * @param cfg Configuration object:
   * 
   * - {Number} maxDeep how deep to enter to copy object
   * 
   * - {Boolean} nodes If enabled, it follow Node elements refernces
   *   and window.
   *   
   * - {Boolean} noOwn property if set cause excluding default "hasOwnProperty"
   * check.
   * 
   * - {Boolean} noFunctions If enabled, it excludes functions from copying
   * 
   * - {Boolean} proto If enabled, it ewill include `prototype` object(!), 
   * useful when cloning with inheritance.
   * 
   * - {Boolean} copyReference If enabled, it will set for
   *    each object "___copy_reference" property referring to copied object
   * 
   * - {Boolean} all This config option causes setting defaults to include any 
   * tupoe of objects in traversing process (win. nodes, etc. are set to true)
   * @returns {Object} copy of the object
   */
  Utils.objectCopy = function (obj, cfg) {
    cfg = cfg || {};
    var res = _objectCopy(obj, cfg, cfg.maxDeep);
    travelArray = [];
    return res;
  };
  
  function _objectCopy(obj, cfg, maxDeep, start, parentObj) {
    var nodes = false,
      noOwn = false,
      noFunctions = false,
      win = false,
      all = false,
      copyReference = false,
      emptyForMaxDeep = false;
    
    if (cfg) {
      all = !!cfg.all;
      nodes = all || cfg.nodes;
      win = all || cfg.win;
      noOwn = all;
      emptyForMaxDeep = !!cfg.emptyForMaxDeep;
      noFunctions = cfg.noFunctions && !all;
      
      if (cfg.noOwn !== undefined) {
        noOwn = !!cfg.noOwn;
      }      
      if (cfg.noFunctions !== undefined) {
        noFunctions =  !!cfg.noFunctions;
      }
      if (cfg.win !== undefined) {
        win = !!cfg.win;
      }
      if (cfg.nodes !== undefined) {
        nodes = !!cfg.nodes;
      }
      
      copyReference = !!cfg.copyReference;
    }
    
    if (maxDeep !== undefined && !maxDeep) {
      if (emptyForMaxDeep) {
        return;
      }
      return obj;
    } else if (maxDeep !== undefined) {
      maxDeep--;
    }

    if (!obj || !(obj instanceof Object)) {
      return obj;
    }

    if (!nodes) {
      try {
        if (obj instanceof Node) {
          return obj;
        }
      } catch (ie) {
        if (obj instanceof ActiveXObject && obj.nodeType !== undefined) {
          return obj; // IE case, no comment
        }
      }
      if (obj === document) {
        return obj;
      }
    }
    
    if (!win) {
      if (obj === global) {
        return obj;
      }
    }

    var copy = (obj instanceof Array) ? [] : {};

    if (obj instanceof Date) {
      copy = new Date(obj);
    }

    if (!noFunctions && obj instanceof Function) {
      var funStr = String(obj).replace(/\s+/g, "");
      if ((funStr.indexOf("{[nativecode]}") + 14) === funStr.length) {
        // native case
        copy = function () {
          return obj.apply(parentObj || this, arguments);
        };
      } else {
        copy = function () {
          return obj.apply(this, arguments);
        };
      }
    }

    if (start === undefined) {
      travelArray = [];
      start = 0;
    }
    
    var existingCopy = existsInPath(obj, copy);
    
    if (existingCopy) {
      return existingCopy;
    }
    
    // DONT follow native accessors!: obj[i] === obj[i]
    
    var i;
    if (copy instanceof Array) {
      for (i = 0; i < obj.length; i++) {
        if (obj[i] === obj[i]) {
          copy[copy.length] = _objectCopy(obj[i], cfg, maxDeep, start + 1, obj);
        } else {
          copy[copy.length] = obj[i];
        }
      }
    } else {
      i = 0;
      for (var prop in obj) {
        if (noOwn || obj.hasOwnProperty(prop)) {
          if (obj[prop] === obj[prop]) {
            copy[prop] = _objectCopy(obj[prop], cfg, maxDeep, start + 1, obj);
          } else {
            copy[prop] = obj[prop];
          }
        }
        i++;
      }
    }
    
    if (cfg.proto) {
      copy.prototype = _objectCopy(obj.prototype, cfg, maxDeep, start + 1, obj);
    }
    
    if (copyReference) {
      copy.___copy_ref = obj;
    }
    
    return copy;
  }
  
  var traverseArray = [];
  function existsInTraversePath(object, max) {
    for (var i = 0; i < max && i < traverseArray.length; i++) {
      if (object === traverseArray[i]) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Function used to traverse through an object and its properties.
   * 
   * Execution function `exe` will be called on each object's property:
   * `
      
      exe(obj, parent, propName, trackPath)
  
   * 
   * Where obj is the objects propery reference, parent is the parent object 
   * reference, propName is the property name and trackPath is a fully qualified
   * classpath leading to this object's property.
   * 
   * @param {Object} obj
   * @param {Object} cfg Optional configuration object with possible properties:
   * @param {Function} exe
   * 
   * - `objectsOnly` only properties that are Objects: obj instanceof Object
   * 
   * - `maxDeep` how deep to penetrate
   * 
   * - `hasOwn` checking if `hasOwnProperty` should be applied 
   *    (only own properties) (default true)
   *    
   * - `nodes` if DOM nodes should be included in traverse (default false)
   */
  Utils.traverse = function (obj, exe, cfg) {
    var u;
    _traverse(obj, exe, cfg, u, u, u, u, cfg.maxDeep);
  };
  
  function _traverse(obj, exe, cfg, start, parent, prop, trackPath, maxDeep) {
    cfg = cfg || {};

    if (cfg.hasOwn === undefined) {
      cfg.hasOwn = true;
    }

    if (cfg.objectsOnly && !(obj instanceof Object)) {
      return;
    }

    if (maxDeep !== undefined && !maxDeep) {
      return;
    } else if (maxDeep !== undefined) {
      maxDeep--;
    }

    if (!cfg || !cfg.nodes) {
      try {
        if (obj instanceof Node) {
          // dont follow those objects
          return;
        }
      } catch (ie) {
        if (obj instanceof ActiveXObject && obj.nodeType !== undefined) {
          return; // IE case, no comment
        }
      }
    }
    
    if (obj === global) {
      // dont follow those objects
      return;
    }

    if (start === undefined) {
      traverseArray = [];
      start = 0;
    }

    if (existsInTraversePath(obj, start)) {
      return;
    }

    traverseArray[start] = obj;
    parent = parent || obj;

    if (parent && prop && (parent[prop] !== parent[prop])) {
      // live getters will be ommited
      return;
    }

    var stopHere = exe(obj, parent, prop, trackPath);

    if (stopHere) {
      return;
    }

    var i = 0;
    var objPath = "";
    for (var pprop in obj) {
      if (!cfg.hasOwn || (obj.hasOwnProperty(pprop))) {
        try {
          var object = obj[pprop];
          if (cfg.track) {
            objPath = trackPath ? (trackPath + "." + pprop) : pprop;
          }
          _traverse(
                  object,
                  exe,
                  cfg,
                  start + 1,
                  parent,
                  pprop,
                  objPath,
                  maxDeep);
        } catch (e) {
        }
      }
      i++;
    }
  }

  /**
   * Prepares string to be quoted and evaluable.
   * @param {String} string
   * @returns {String} quoted string or the input parameter if parameter is not
   * a string.
   */
  Utils.prepareQuotedString = function (string) {
    if (typeof(string) === "string") {
      return "\"" + (string.replace(/\"/g, "\\\"")) + "\"";
    } else {
      return string;
    }
  };

/**
 * Converts a string expression to a function.
 * 
 * @param {String} expr expression used for function
 * @param {String} argzString optional arguments part string, example: 
 * "arg1, arg2"
 * @returns {Function} function made from expression block
 */
  Utils.expressionToFunction = function (expr, argzString) {
    argzString = argzString || "";
    var funTemplate = "function (" + argzString + ") {" + expr + "}";
    return Utils.gevalAndReturn(funTemplate).result;
  };
  
  /**
   * Utility for class creation.
   * 
   * @param {Object} config object with properties to be set on prototype.
   *    CONSTRUCTOR property (function) is a special property on such object and
   *     will be used to create constructor - optional. 
   * @param {String} classPath classpath to be used and set at
   * @param {Function} extClass class to inherit from
   * @param {Object} prototypeTemplate prototype template to use
   * @param {Object} pckg namespace package to be put at
   * @param {Function} constr optional constructor to use
   * @returns {Object} defined class reference
   */
  Utils.defineWrappedClass = function (
          classPath,
          extClass,
          prototypeTemplate,
          pckg,
          constr) {
    // or anonymous:
    var clazz = function () {
      if (constr) {
        return constr.apply(this, arguments);
      } else {
        return extClass.apply(this, arguments);
      }
    };
        
    // publish class
    Define.clazz(classPath, clazz, extClass, pckg);
    
    // pass prototype objects
    for (var prop in prototypeTemplate) {
      if (prototypeTemplate.hasOwnProperty(prop) && prop !== "CONSTRUCTOR") {
        clazz.prototype[prop] = prototypeTemplate[prop];
      }
    }
    return clazz;
  };
  
  /**
   * Useful method for copying objects and attaching new references
   * from other object.
   * @param {Object} A object to copy
   * @param {Object} B object's props to assign on A after copying.
   * @param {Number} maxDeep how deep to copy, default is 8 (javascript is slow
   *      and extra limitation is a good thing).
   * @returns {Object} Objects copy.
   */
  Utils.copyAandAddFromB = function (A, B, maxDeep) {
    maxDeep = maxDeep || 8;
    var copy = this.objectCopy(A, {maxDeep: maxDeep});
    for (var prop in B) {
      if (B.hasOwnProperty(prop)) {
        copy[prop] = B[prop];
      }
    }
    return copy;
  };
  
  /**
   * Important compat utility for keys at object listing.
   * @param {Object} obj
   * @returns {Array} keys array from object.
   */
  Utils.keys = function (obj) {
    if (obj instanceof Object) {
      if (Object.keys) {
        return Object.keys(obj);
      }
      var keys = [];
      for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          keys[keys.length] = prop;
        }
      }
      return keys;
    } else {
      throw "keys() called on non-object!";
    }
  };


  /**
   * Cross-browser source element resolving function from DOM event object.
   * 
   * @param {Object} evt
   * @returns {Element}
   */
  Utils.getSrcElement = function (evt) {
    var elem;
    evt = evt || window.event;
    if (evt.srcElement) {
      elem = evt.srcElement;
    } else if (evt.target) {
      elem = evt.target;
    }
    return elem;
  };

  /*
   * Local function taking as argument and array and a string that will be 
   * added to the array if it does not equal (===) to any of items.
   * 
   * @param {Array} array
   * @param {Object} obj
   * @returns {Number} objects position in array,
   *  if doesnt exist it will return -1. It means that object was appended at 
   *  the end of array.
   * if exists it will return its position.
   */
  Utils.addToArrayIfNotExist = function (array, obj, equals) {
    var i = 0, exists = false;
    for (; i < array.length; i += 1) {
      var tmp = equals && equals(array[i], obj);
      if (tmp || array[i] === obj) {
        exists = true;
        break;
      }
    }
    if (!exists) {
      array[array.length] = obj;
      i = -1;
    }
    return i;
  };
  
  /*
   * Local function taking as argument and array and a string that will be 
   * added to the array if it does not equal (===) to any of items.
   * 
   * @param {Array} array
   * @param {Object} obj
   * @returns {Number} objects position in array,
   *  if doesnt exist it will return -1. It means that object was appended at 
   *  the end of array.
   * if exists it will return its popsition.
   */
  Utils.indexInArray = function (array, obj) {
    for (var i = 0; i < array.length; i++) {
      if (array[i] === obj) {
        return i;
      }
    }
    return -1;
  };

  /**
   * Function checks if obj exists in array.
   */
  Utils.existsInArray = function (array, obj) {
    for (var i = 0; i < array.length; i++) {
      if (array[i] === obj) {
        return true;
      }
    }
    return false;
  };

  /*
   * Local function taking as argument and array and a string that will be  
   * removed from the array if it equals (===) to any of array items.
   * 
   * @param {Array} array
   * @param {Object} obj
   */
  Utils.removeFromArray = function (array, obj) {
    var i = 0, total = 0;
    for (; i < array.length;) {
      if (array[i] === obj) {
        array.splice(i, 1);
        total++;
      } else {
        i++;
      }
    }
    return total;
  };
  
  /**
   * Cross browser add className wrapper.
   * Nowadays, browsers support "classList" property - still not all of them.
   * 
   * @param {Element} node
   * @param {String} name
   */
  Utils.addClass = function (node, name) {
    var classes;
    try {
      node.classList.add(name);
    } catch (ex) {
      if (node.className === null) {
        node.className = name;
        return;
      }
      classes = node.className.split(" ");
      Utils.addToArrayIfNotExist(classes, name);
      node.className = classes.join(" ");
    }
  };
  
  /**
   * Cross browser remove className wrapper.
   * Nowadays, browsers support "classList" property - still not all of them.
   * 
   * @param {Element} node
   * @param {String} name
   */
  Utils.removeClass = function (node, name) {
    var classes;
    try {
      node.classList.remove(name);
    } catch (ex) {
      if (node.className === null) {
        node.className = "";
        return;
      }
      classes = node.className.split(" ");
      Utils.removeFromArray(classes, name);
      node.className = classes.join(" ");
    }
  };
  
  var prefix = "try{this.qubitopentagutilsgevalandreturn__var_test__=(";
  var suffix = ");}catch(ex){" +
      "this.qubitopentagutilsgevalandreturn__var_test__error = ex;}";
  /**
   * Evaluates expression and returns value of wrapped by "(" expression ")".
   * @param {String} expression
   * @returns {Object}
   */
  Utils.gevalAndReturn = function (expression) {
    var G = GLOBAL;
    G.qubitopentagutilsgevalandreturn__var_test__ = undefined;
    G.qubitopentagutilsgevalandreturn__var_test__error = undefined;
    
    expression  = prefix + expression + suffix;

    // must be geval
    Utils.geval(expression);

    var res = G.qubitopentagutilsgevalandreturn__var_test__;
    var err = G.qubitopentagutilsgevalandreturn__var_test__error;
    
    try {
      G.qubitopentagutilsgevalandreturn__var_test__ = UNDEF;
      G.qubitopentagutilsgevalandreturn__var_test__error = UNDEF;
      delete G.qubitopentagutilsgevalandreturn__var_test__;
      delete G.qubitopentagutilsgevalandreturn__var_test__error;
    } catch (ex) {/*IE magic*/}
    
    return {
      result: res,
      error: err
    };
  };
  
  /**
   * Trim function for string.
   * @param {String} string
   * @returns {String} result
   */
  Utils.trim = function (string) {
    try {
      return String(string).trim();
    } catch (noTrim) {
      return String(string).replace(/^\s+|\s+$/g, '');
    }
  };
  
  /**
   * Utility useful to apply default values on config objects, it sets
   * values from src on obj if unset on obj.
   * @param {Object} obj object to set on
   * @param {Object} src object to set from
   */
  Utils.setIfUnset = function (obj, src) {
    if (obj && src) {
      for (var prop in src) {
        if (src.hasOwnProperty(prop) && !obj.hasOwnProperty(prop)) {
          obj[prop] = src[prop];
        }
      }
    }
  };
  
  var rndSeed = Math.floor(Math.random() * 1000000000000);
  
  Utils.UUID = function () {
    if (!global.__qubit_uuid_cnt_43567bdfhgtb4vt5yeh978__) {
      global.__qubit_uuid_cnt_43567bdfhgtb4vt5yeh978__ = new Date().valueOf();
    }
    
    return rndSeed + "." + (++global.__qubit_uuid_cnt_43567bdfhgtb4vt5yeh978__);
  };
  
  /**
   * Shortcut to opverride object props. Commonly used.
   * @param {type} A
   * @param {type} B
   * @returns {Object} returns A
   */
  Utils.overrideFromLeftToRight = function (A, B) {
    if (A && B) {
      for (var prop in B) {
        if (B.hasOwnProperty(prop)) {
          A[prop] = B[prop];
        }
      }
    }
    return A;
  };
  
  /**
   * Global eval function.
   * It evaluates expression in a global scope.
   * @param {String} expression
   */
  Utils.geval = function (expression) {
    if (window && window.execScript) {
      // ie9-10 doesn't like empty strings.
      return window.execScript(expression === "" ? " " : expression);
    } else {
      return (function () {return global["eval"].call(global, expression); }());
    }
  };
  
  var _availStack = [];
  Utils.bodyAvailable = function (callback) {
    var avail = !!document.body;
    if (avail) {
      if (_availStack) {
        for (var i = 0; i < _availStack.length; i++) {
          try {
            _availStack[i]();
          } catch (ex) {
          }
        }
        _availStack = false;
      }
      callback();
    } else {
      _availStack.push(callback);
    }
  };
  
  Utils.rmCookiesMatching = function (string) {
    var cookies = Cookie.getAll();
    for (var i = 0; i < cookies.length; i++) {
      var name = cookies[i][0];
      if (name.match(string) === 0) {
        Cookie.rm(name);
      }
    }
  };
  
  var _readyCalls = [];
  var _loaded = false;
  var _flushed = false;
  /**
   * Function checks if body exists and document state is complete.
   * It accepts also callback which is run immediately if body exists and is 
   * loaded or will be called when body is loaded (window.onload time).
   * 
   * Use this method to run code when body is loaded.
   * 
   * @param {Function} callback
   * @returns {Boolean} true and only true if body and state is complete is available.
   */
  Utils.bodyReady = function (callback) {
    if (_flushed) {
      if (callback) {
        callback();
      }
      return true;
    }

    _loaded = _loaded ||
            !!(document.body && document.readyState === "complete");

    if (_loaded) {
      _flushed = true;
      for (var i = 0; i < _readyCalls.length; i++) {
        try {
          _readyCalls[i]();
        } catch (ex) {
          if (global.console && global.console.trace) {/*L*/
            global.console.trace(ex);/*L*/
          }/*L*/
        }
      }
      if (callback) {
        callback();
      }
    } else {
      if (callback) {
        _readyCalls.push(callback);
      }
    }

    return _loaded;
  };
  
  // @TODO maybe loop will be more "smooth" choice, review it.
  var oldOnload = global.onload;
  global.onload = function (e) {
    try {
      Utils.bodyReady();
    } catch (ex) {
      // odd chrome cases.
      try {
        window.qubit.opentag.Utils.bodyReady();
      } catch (ex1) {
        // just try
      }
    }

    var oldRef = false;

    try {
      oldRef = oldOnload;
    } catch (ex2) {
      // try!
    }

    if (oldRef) {
      oldRef(e);
    }
  };
  
  // FIX IT and CLEANUP
  (function () {
    var DOMContentLoaded,
            isReady = false,
            readyWait = 1,
            readyList,
            readyComplete,
            bindReadyComplete,
            doScrollCheck;

    readyComplete = function (wait) {
      var f;
      // A third-party is pushing the ready event forwards
      if (wait === true) {
        readyWait -= 1;
      }

      // Make sure that the DOM is not already loaded
      if (!readyWait || (wait !== true && !isReady)) {
        // Make sure body exists, at least, 
        // in case IE gets a little overzealous (ticket #5443).
        if (!document.body) {
          return setTimeout(readyComplete, 1);
        }

        // Remember that the DOM is ready
        isReady = true;

        // If a normal DOM Ready event fired, decrement, and wait if need be
        if (wait !== true) {
          readyWait -= 1;
          if (readyWait > 0) {
            return;
          }
        }

        // While there are functions bound, to execute
        while (readyList.length > 0) {
          f = readyList.shift();
          f();
        }
      }
    };


    // The DOM ready check for Internet Explorer
    doScrollCheck = function () {
      if (isReady) {
        return;
      }

      try {
        // If IE is used, use the trick by Diego Perini
        // http://javascript.nwbox.com/IEContentLoaded/
        document.documentElement.doScroll("left");
      } catch (e) {
        setTimeout(doScrollCheck, 1);
        return;
      }

      // and execute any waiting functions
      readyComplete();
    };

    bindReadyComplete = function () {
      if (readyList) {
        return;
      }

      readyList = [];

      // Catch cases where $(document).ready() is called after the
      // browser event has already occurred.
      if (document.readyState === "complete") {
        // Handle it asynchronously to allow scripts 
        // the opportunity to delay ready
        return setTimeout(readyComplete, 1);
      }

      // Mozilla, Opera and webkit nightlies currently support this event
      if (document.addEventListener) {
        // Use the handy event callback
        document.addEventListener("DOMContentLoaded", DOMContentLoaded, false);

        // A fallback to window.onload, that will always work
        window.addEventListener("load", readyComplete, false);

        // If IE event model is used
      } else if (document.attachEvent) {
        // ensure firing before onload,
        // maybe late but safe also for iframes
        document.attachEvent("onreadystatechange", DOMContentLoaded);

        // A fallback to window.onload, that will always work
        window.attachEvent("onload", readyComplete);

        // If IE and not a frame
        // continually check to see if the document is ready
        var toplevel = false;

        try {
          toplevel = (window.frameElement === null) ||
                  (window.frameElement === undefined);
        } catch (e) {
        }

        if (document.documentElement.doScroll && toplevel) {
          doScrollCheck();
        }
      }
    };

    // Handle when the DOM is ready
    var ready = function (fn) {
      // Attach the listeners
      bindReadyComplete();

      // Add the callback
      if (isReady) {
        setTimeout(fn, 1);
      } else {
        readyList.push(fn);
      }
    };

    // Cleanup functions for the document ready method
    if (document.addEventListener) {
      DOMContentLoaded = function () {
        document.removeEventListener("DOMContentLoaded",
                DOMContentLoaded, false);
        readyComplete();
      };

    } else if (document.attachEvent) {
      DOMContentLoaded = function () {
        // Make sure body exists, at least, in case IE gets a 
        // little overzealous (ticket #5443).
        if (document.readyState === "complete") {
          document.detachEvent("onreadystatechange", DOMContentLoaded);
          readyComplete();
        }
      };
    }

    ready(function () {
      _loaded = true;
      Utils.bodyReady();
    });
  }());
  
  
}());
