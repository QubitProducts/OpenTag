/*
 * Copyright 2013-2014, Qubit Group
 * http://opentag.qubitproducts.com
 * @author Peter Fronc peter.fronc@qubitproducts.com
 * 
 * This library is licensed under LGPL v3 license.
 * For details please see attached LICENSE file or go to:
 * https://www.gnu.org/licenses/lgpl.html
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

  function checkIfExcluded(object, exclude) {
    for (var i = 0; i < exclude.length; i++) {
      if (object === exclude[i]) {
        return true;
      }
    }
    return false;
  }

  function checkIfNameMatch(string, matches) {
    try {
      for (var i = 0; i < matches.length; i++) {
        if (matches[i].test(string)) {
          return true;
        }
      }
    } catch (ex) {
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
    if (typeof object !== "string") {
      return "\"" + object + "\"";
    }
    return "\"" + object
            .replace(/\\/g, "\\\\")
            .replace(/\"/g, "\\\"")
            .replace(/\n/g, "\\n") +
            "\"";
  }
  
  var TAB = "  ";
  var _serialize = function (
          object,
          config,
          parentElements,
          level,
          levelMax,
          propOrIdx) {
    if (!isNaN(levelMax) && level >= levelMax) {
      return undefined;
    }
    var excludeInstances, excludeTypes, exclude, excludeMatches, 
            excludeNames, hasOwn = true,
            includeFunctions = false, excludeOnTrue, dateAsString = true,
            raw = false, fakeFunctions = false, realFunctions = false,
            prettyPrint = false, render;
    
    if (config) {
      if (config.prettyPrint) {
        prettyPrint = true;
      }
      if (config.raw) {
        raw = config.raw;
      } //json type as default
      if (config.renderFunction) {
        render = config.renderFunction;
      } //json type as default
      if (config.excludeInstances) {
        excludeInstances = config.excludeInstances;
      }
      if (config.excludeTypes) {
        excludeTypes = config.excludeTypes;
      }
      if (config.exclude) {
        exclude = config.exclude;
      }
      if (config.excludeNames) {
        excludeNames = config.excludeNames;
      }
      if (config.excludeMatches) {
        excludeMatches = config.excludeMatches;
      }
      if (config.hasOwn !== undefined) {
        hasOwn = config.hasOwn;
      }
      if (config.fakeFunctions) {
        fakeFunctions = config.fakeFunctions;
      }
      if (config.realFunctions) {
        realFunctions = config.realFunctions;
      }
      if (config.includeFunctions) {
        includeFunctions = config.includeFunctions;
      }
      if (config.excludeOnTrue) {
        excludeOnTrue = config.excludeOnTrue;
      }
      if (config.dateAsString) {
        dateAsString = config.dateAsString;
      }
    }
    
    var i;
    
    var indent = "";
    var eol = "";
    if (prettyPrint) {
      for (i = 0; i < level; i++) {
        indent += TAB;
      }
      eol = "\n";
    }
    
    if (excludeOnTrue) {
      try {
        if (excludeOnTrue(object)) {
          return undefined;
        }
      } catch (ex) {}
    }
    
    if (typeof render === "function") {
      var rendered = render(object, propOrIdx);
      if (typeof rendered === "string") {
        return jsonString(rendered);
      }
    }
    
    if (object instanceof Date) {
      return (!raw || dateAsString) ?
        jsonString(object.toISOString()) : object.valueOf();
    } else if (!includeFunctions && typeof object === "function") {
      return undefined;
    } else if (typeof object === "number") {
      return drawValue(indent, String(object));
    } else if (typeof object === "string") {
      return drawValue(indent, jsonString(object));
    } else if (object === null) {
      return drawValue(indent, "null");
    } else if (object === undefined) {
      return raw ? drawValue(indent, "undefined") : undefined;
    } else if (typeof object === "boolean") {
      return drawValue(indent, String(object));
    }
    
        
    if (includeFunctions && typeof object === "function") {
      if (fakeFunctions) {
        return "(function () {})";
      }
    }
    
    if (includeFunctions && typeof object === "function") {
      if (realFunctions) {
        var out = prettyPrint ? object.toString() : object.toString();
        return drawValue(indent, out);
      }
    }
    
    if (objectExistsInParentElements(object, parentElements)) {
      return undefined;//"\"[parent contained]\"";
    }
    
    parentElements.push(object);
    ++level;
    
    if (object instanceof Array) {
      var strings = [];
      for (i = 0; i < object.length; i++) {
        if (excludeInstances && checkIfInstanceOf(object, excludeInstances)) {
          continue;
        }
        if (excludeTypes && checkIfTypeOf(object, excludeTypes)) {
          continue;
        }
        var el;
        try {
          var obj = object[i];
          if (!raw && (obj === undefined)) {
            obj = null;
          }
          el = _serialize(obj, config, parentElements, level, levelMax, i);
        } catch (ex) {
          removeFromArray(object, parentElements);
          return jsonString(String(ex));
        }
        if (el !== undefined) {
          strings.push(el);
        }
      }
      removeFromArray(object, parentElements);
      return drawObject("[", "]", indent, eol, strings);
    }

    var parts = [];
    for (var key in object) {
      var prop = object[key];
      if (hasOwn && !object.hasOwnProperty(key)) {
        continue;
      }
      if (excludeInstances && checkIfInstanceOf(prop, excludeInstances)) {
        continue;
      }
      if (excludeTypes && checkIfTypeOf(prop, excludeTypes)) {
        continue;
      }
      if (excludeNames && checkIfNameOf(key, excludeNames)) {
        continue;
      }
      if (exclude && checkIfExcluded(prop, exclude)) {
        continue;
      }
      if (excludeMatches && checkIfNameMatch(key, excludeMatches)) {
        continue;
      }
      try {
        var objEl = 
            _serialize(prop, config, parentElements, level, levelMax, key);
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
    return drawObject("{", "}", indent, eol, parts);
  };

  function drawValue(indent, string) {
    return indent ? (" " + string) : string;
  }

  function drawObject(s, e, indent, eol, parts) {
    var array, spaceAfterColon = " ";
    if (indent === "") {
      spaceAfterColon = "";
    }
    if (indent || eol) {
      if (parts.length === 0) {
        array = [spaceAfterColon, s, parts.join(","), e];
      } else {
        array = [
          spaceAfterColon, s, "\n",
          indent, TAB,
          parts.join("," + "\n" + indent + TAB),
          "\n", indent, e
        ];
      }
    } else {
      array = [s, parts.join(","), e];
    }
    
    return array.join("");
  }

  /**
   * Exclusive and luxury javascript serializer.
   * 
   * Config object assignment:
   * 
   * <pre>
   *   config.excludeInstances Instanceof will be called
   *      on  excludeInstancess functions array
   *   config.excludeTypes array of objects that typeof
   *    will be called in order to exclude properties on object
   *   config.excludeNames array of strings that will be check
   *    on object's properties
   *   config.renderFunction custom renderer function, must return string,
   *      any other value will be ignored.
   *   config.hasOwn if hasOwnProperty should apply for objects 
   *        (default false)
   *   config.realFunctions serializer will output toString of function objects,
   *    this option only applies if includeFunctions is enabled
   *   config.fakeFunctions if includeFunctions is applied, this option will cause
   *    empty function to be attached for such objects.
   *   config.includeFunctions if 
   *      functions should be included (default false), if only this option is specified
   *      fuinctions will be treated as objects and serializer will go over its properties.
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
  
  var global = (0, eval("this")) || (function () {return this; }()) ||
          this.window;
  
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
  
  /**
   * Simple function securing string to be used in json.
   */
  json.jsonString = jsonString;
  
  try {
    module.exports = json;
  } catch (e) {
    //try exports
  }
}());

