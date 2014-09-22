/*
 * TagSDK, a tag development platform
 * Copyright 2013-2014, Qubit Group
 * http://opentag.qubitproducts.com
 * @author Peter Fronc peter.fronc@qubitproducts.com
 */

(function () {
  
  var json = {};

  function checkIfInstanceOf(object, instances) {
    for (var i = 0; i < instances.length; i++) {
      if ((typeof(instances[i]) === "function") && /*ie case*/
            object instanceof instances[i]) {
        return true;
      }
    }
    return false;
  }
  json.checkIfInstanceOf = checkIfInstanceOf;
  
  function checkIfTypeOf(object, types) {
    for (var i = 0; i < types.length; i++) {
      if (typeof(object) === types[i]) {
        return true;
      }
    }
    return false;
  }

  function checkIfNameOf(string, names) {
    for (var i = 0; i < names.length; i++) {
      if (string === names[i]) {
        return true;
      }
    }
    return false;
  }

  function objectExistsInParentElements(object, parentElements) {
    if (object instanceof Object) {
      for (var i = 0; i < parentElements.length; i++) {
        if (parentElements[i] === object) {
          return true;
        }
      }
    }
    return false;
  }
  
  function removeFromArray(object, array) {
    for (var i = 0; i < array.length; i++) {
      if (array[i] === object) {
        array.splice(i, 1);
      }
    }
    return array;
  }

  function jsonString(object) {
    return "\"" + object.replace(/\\/g, "\\\\").replace(/\"/g, "\\\"") + "\"";
  }

  var _serialize = function (object, config, parentElements, level, levelMax) {
    if (!isNaN(levelMax) && level >= levelMax) {
      return undefined;
    }
    var excludedInstances, excludedTypes, excludedNames, own,
            includeFunctions = false, excludeOnTrue, dateAsString = true,
            raw = false, fakeFunctions = false;
    
    if (config) {
      if (config.raw) raw = config.raw; //json type as default
      if (config.excludedInstances) excludedInstances = config.excludedInstances;
      if (config.excludedTypes) excludedTypes = config.excludedTypes;
      if (config.excludedNames) excludedNames = config.excludedNames;
      if (config.own) own = config.hasOwn;
      if (config.fakeFunctions) fakeFunctions = config.fakeFunctions;
      if (config.includeFunctions) includeFunctions = config.includeFunctions;
      if (config.excludeOnTrue) excludeOnTrue = config.excludeOnTrue;
      if (config.dateAsString) dateAsString = config.dateAsString;
    }
    
    if (object instanceof Date) {
      return (!raw || dateAsString) ?
        jsonString(object.toISOString()) : object.valueOf();
    } else if (!includeFunctions && typeof object === "function") {
      return undefined;
    } else if (typeof object === "number") {
      return String(object);
    } else if (typeof object === "string") {
      return jsonString(object);
    } else if (object === null) {
      return "null";
    } else if (object === undefined) {
      return raw ? "undefined" : undefined;
    } else if (typeof prop === "boolean") {
      return String(object);
    }
    
    if (includeFunctions && typeof object === "function") {
      if (fakeFunctions) {
        return "(function(){})";
      }
    }
    
    if (objectExistsInParentElements(object, parentElements)) {
      return undefined;//"\"[parent contained]\"";
    }
    
    parentElements.push(object);
    ++level;
    
    if (object instanceof Array) {
      var strings = [];
      for (var i = 0; i < object.length; i++) {
        if (excludeOnTrue) {
          try {
            if (excludeOnTrue(object)) {
              continue;
            }
          } catch (ex) {}
        }
        if (excludedInstances && checkIfInstanceOf(object, excludedInstances)) {
          continue;
        }
        if (excludedTypes && checkIfTypeOf(object, excludedTypes)) {
          continue;
        }
        try {
          var el = _serialize(object[i], config, parentElements, level, levelMax);
        } catch (ex) {
          removeFromArray(object, parentElements);
          return jsonString(String(ex));
        }
        if (el !== undefined) {
          strings.push(el);
        }
      }
      removeFromArray(object, parentElements);
      return  "[" + strings.join(",") + "]";
    }

    var parts = [];
    for (var key in object) {
      var prop = object[key];
      if (own && !object.hasOwnProperty(key)) {
        continue;
      }
      if (excludeOnTrue) {
        try {
          if (excludeOnTrue(object)) {
            continue;
          }
        } catch (ex) {}
      }
      if (excludedInstances && checkIfInstanceOf(prop, excludedInstances)) {
        continue;
      }
      if (excludedTypes && checkIfTypeOf(prop, excludedTypes)) {
        continue;
      }
      if (excludedNames && checkIfNameOf(key, excludedNames)) {
        continue;
      }
      try {
        var objEl = _serialize(prop, config, parentElements, level, levelMax);
        if (objEl !== undefined) {
          var elString = ("\"" + key.replace(/\"/g, "\\\"") + "\":") + objEl;
          parts.push(elString);
        }
      } catch (ex) {//SOME OBJECT CAN THROW EXCEPTION ON Access, FRAMES ETC.
        removeFromArray(object, parentElements);
        return jsonString(String(ex));
      }
    }
    removeFromArray(object, parentElements);
    return "{" + parts.join(",") + "}";
  };

  /**
   * Exclusive and luxury javascript serializer.
   * 
   * Config object assignment:
   * 
   * <pre>
   *   config.excludedInstances Instanceof will be called
   *      on  excludeInstancess functions array
   *   config.excludedTypes array of objects that typeof
   *    will be called in order to exclude properties on object
   *   config.excludedNames array of strings that will be check
   *    on object's properties
   *   config.hasOwn if hasOwnProperty should apply for objects 
   *        (default false)
   *   config.includeFunctions if 
   *      functions should be included (default false)
   *   config.excludeOnTrue function that will take
   *      current objects property and must return boolean, if returns true,
   *      object will be added to serialized string
   *   config.level if specified, ho maximally deep
   *    properties generation can go.
   *   config.dateAsString = treat dates as strings (default true)
   *   config.raw dont use "json" specific output and serialize real values
   *     (undefines, dates as numbers)
   * </pre>
   * 
   * @param {type} object
   * @param {Object} config
   * @returns {String}
   */
  json.serialize = function (object, config) {
    var parentElements = [];
    var level;
    if (config) {
      level = config.level;
    }
    return _serialize(object, config, parentElements, 0, level);
  };
  
  var global = (0, eval("this")) || (function(){return this;}()) || this.window;
  
  /**
   * Parsing json function with specification specified in RFC4627, section 6. 
   * It is a simple security check. Enough for most of needs.
   * @param {type} string
   * @returns {RegExp}
   */
  json.parse = function (string) {
    if (!(/[^,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]/.test(
         string.replace(/"(\\.|[^"\\])*"/g, '')))) {
      var expression = "json.___tmp = (" + string + ")";
      if (global.execScript) {
         global.execScript(expression);
       } else {
         (function () {return global["eval"].call(global, expression); }());
       }
     } else {
       throw "insecure json!";
     }
     return json.___tmp;
  };

  global.json = json;
}());