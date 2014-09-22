try{(function () {
/**
 * @author Peter Fronc <peter.fronc@qubitdigital.com>
 */
(function () {
  /**
   * Bind function should be already native in most browsers.
   * If not, we must use very basic replacement here.
   * We may inject recommended by:
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference
   * /Global_Objects/Function/bind
   * Template, but for now it will stay simple.
   * It is recommended that you pass specific arguments using closures.
   * 
   * @param {Object} ctx
   * @returns {Function} scoped function
   */
  Function.prototype.bind = Function.prototype.bind || function (ctx) {
    var _this = this;
    return function () {
      return _this.apply(ctx, arguments);
    };
  };
}());


//shortcuts
var EMPTY_FUN = function () {};
var UNDEF;


/*
 * Opentag, a tag deployment platform
 * Copyright 2013-2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  
  /**
   * @class qubit.Define
   * @singleton
   * 
   * #Generic Utility
   * 
   * It delivers utility tools for copying or traversing objects, acessing
   * and manipulating CSS class names, managing arrays, creating classes and
   * many more useful utilities. Please see the API.
   * 
   */
  function Define() {}

  var global = null;
  try {
    global = (false || eval)("this") || (function () { return this; }());
  } catch (e) {}
  
  /**
   * Global scope accessor.
   * @returns {Object}
   */
  Define.global = function () {
    return global;
  };

  /**
   * Function builds desired name space.
   * It will not override existing elements.
   * @param {String} path
   * @param {Object} instance
   * @param {Object} pckg
   * @param {Boolean} noOverride
   * @returns {Object}
   */
  Define.namespace = function (path, instance, pckg, noOverride) {
    var files = path.split("."),
      //access eval INDIRECT so it is called globally
      current = Define.NAMESPACE_BASE || Define.global(),
      last = null,
      lastName = null,
      i;
    
    current = pckg || current;
    
    for (i = 0; i < files.length - 1; i += 1) {
      last = current;
      lastName = files[i];
      current[lastName] = current[lastName] || {};
      current = current[lastName];
    }
    
    last = current;
    lastName = files[files.length - 1];
    
    if (global.TAGSDK_NS_OVERRIDE) {
       noOverride = false;
    }
    
    if (instance !== undefined) {
      if (last[lastName] === undefined || !noOverride) {
        last[lastName] = instance;
      }
    } else {
      last[lastName] = last[lastName] || {};
    }
    
    return last[lastName];
  };

  /**
   * Utility for simple class declaration (not definition).
   * It does similiar job as namespace with addition of adding CLASS_NAME
   * and PACKAGE_NAME on prototype. It also sets superclass to extending class
   * instance.
   * 
   * @param {String} path
   * @param {Object} instance
   * @param {Function} extendingClass
   * @param {Object} pckg
   * @param {Object} config
   * @returns {Object} the class instance
   */
  Define.clazz = function (path, instance, extendingClass, pckg, config) {
    Define.namespace(path, instance, pckg, true);
    if (typeof(extendingClass) === "function") {
      instance.superclass = extendingClass;
      instance.prototype = new instance.superclass(config);
    }
    if (instance.prototype) {
      var names = path.split(".");
      instance.prototype.CLASS_NAME = names[names.length - 1];
      names.splice(names.length - 1, 1);
      instance.prototype.PACKAGE_NAME = names.join(".");
    }
    return instance;
  };

  Define.clazz("qubit.Define", Define);
  
}());



/*
 * TagSDK, a tag development platform
 * Copyright 2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function() {
  var cookieAlphabet = 
          "abcdefghijklmnopqrstuvwxyz" + "0123456789" +
          "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + "*!-#$&+()@" +
          "'%./:<>?[" + "\"]^_`{|}~" +
          "\\" +
          ";=";
  
  var cookieAlphabetMap = {};
  for (var i = 0; i < cookieAlphabet.length; i++) {
    cookieAlphabetMap[cookieAlphabet.charAt(i)] = i;
  }
  
  /**
   * @class qubit.Cookie
   * 
   * Cookie class with static methods to use for setting and getting and
   * removing cookie.
   * 
   * @param {Object} config
   */
  function Cookie(config) {
  }

  qubit.Define.clazz("qubit.Cookie", Cookie);
  
  Cookie.cookieAlphabet = cookieAlphabet;
  Cookie.cookieAlphabetMap = cookieAlphabetMap;
  
  /**
   * @static
   * Default decoding method for cookie. Defaulting to `decodeURIComponent`.
   * 
   * @param {String} string string to decode
   * @returns {String} decoded string
   */
  Cookie.decode = function (string) {
    return decodeURIComponent(string);
  };
  
  /**
   * @static
   * Default encoding method for cookie. Defaulting to `encodeURIComponent`.
   * 
   * @param {String} string string to encode
   * @returns {String} encoded string
   */
  Cookie.encode = function (string) {
    return encodeURIComponent(string);
  };
  
  /**
   * @static
   * Cookie setter function.
   * 
   * @param {String} name cookie name
   * @param {String} value cookie string to be set
   * @param {Number} days days to expire
   * @param {String} domain cookie domain
   * @param {Boolean} encoded if should encode value and name with default
   *    method.
   */
  Cookie.set = function(name, value, days, domain, encoded) {
    var expires;
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toGMTString();
    } else {
      expires = "";
    }
    
    if (encoded) {
      name = Cookie.encode(name);
      value = Cookie.encode(value);
    }
    
    var cookie = name + "=" + value + expires + "; path=/;";

    if (domain) {
      cookie += " domain=" + domain;
    }

    document.cookie = cookie;
  };

  /**
   * @static
   * Get cookie function.
   * 
   * @param {String} name cookie name
   * @param {Boolean} decoded should cookie be decoded using default method.
   * 
   * @returns {String} cookie string or `null` if not found.
   */
  Cookie.get = function(name, decoded) {
    var part = name + "=";
    var chunks = document.cookie.split(';');
    for (var i = 0; i < chunks.length; i++) {
      var chunk = chunks[i];
      while (chunk.charAt(0) === ' ') {
        chunk = chunk.substring(1, chunk.length);
      }
      if (chunk.indexOf(part) === 0) {
        var tmp = chunk.substring(part.length, chunk.length);
        if (decoded) {
          tmp = Cookie.decode(tmp);
        }
        return tmp;
      }
    }
    return null;
  };

  /**
   * @static
   * Gets all of cookies for given name.
   * 
   * @param {String} name cookie(s) name
   * @param {Boolean} decoded should cookies be decoded using default method.
   * 
   * @returns {Array} cookies strings array, if there is no cookies, 
   *    empty array is returned.
   */
  Cookie.getAll = function(name, decoded) {
    var part = name + "=";
    var chunks = document.cookie.split(';');
    var cookies = [];
    for (var i = 0; i < chunks.length; i++) {
      var chunk = chunks[i];
      while (chunk.charAt(0) === ' ') {
        chunk = chunk.substring(1, chunk.length);
      }
      if (chunk.indexOf(part) === 0) {
        var tmp = chunk.substring(part.length, chunk.length);
        if (decoded) {
          tmp = Cookie.decode(tmp);
        }
        cookies.push(tmp);
      }
    }
    return cookies;
  };

  /**
   * @static
   * Clearing cookie function.
   * 
   * @param {String} name cookie name
   */
  Cookie.rm = function(name, domain) {
    Cookie.set(name, "", -1, domain);
  };

})();



////Author Peter Fronc
// UTF supported.


(function() {

  var defaultAlphabet = [];
  //"0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ~_.-*()'!%"
  //.split("");//[];

  var len = Math.pow(2, 8);//256
  for (var c = 0; c < len; c++) {
    defaultAlphabet.push(String.fromCharCode(c));
  }

//dictionary
  var xdict = {};
  for (var i = 0; i < defaultAlphabet.length; i++) {
    xdict[defaultAlphabet[i]] = i;
  }

  var Define = qubit.Define;
  
  /**
   * @class qubit.compression.LZW
   * 
   * LZW algorithm implementation.
   * Each instance must receive config object, ehich accepts optional options:
   * 
   * alphabet: property, if set will override default alphabet array. alphabet
   *  must be char array used to code strings. Note, if strings contain 
   *  characters that are not in alphabet - LZW will throw exception.
   * 
   * @param {Object} config
   */
  function LZW (config) {
    if (config) {
      if (config.alphabet) {
        this.alphabet = config.alphabet;
        this.dict = {};
        for (var i = 0; i < this.alphabet.length; i++) {
          this.dict[this.alphabet[i]] = i;
        }
      } else {
        this.alphabet = defaultAlphabet;
        this.dict = xdict;
      }
    }
  }

  Define.clazz("qubit.compression.LZW", LZW);

  /**
   * Function encoding string to LZW numbers array.
   * @param {String} string
   * @returns {Array} array of numbers.
   */
  LZW.prototype.encode = function(string) {
    var dictsize = this.alphabet.length;
    var extDict = {};
    var results = [];
    var index = 0;
    var curr = string.charAt(index++);
    var next;
    var dict = this.dict;

    while (next = string.charAt(index++)) {
      var newWord = curr + next;
      if (dict.hasOwnProperty(newWord) || extDict.hasOwnProperty(newWord)) {
        curr = newWord;
      } else {
        var val = dict.hasOwnProperty(curr) ? dict[curr] : extDict[curr];
        if (val === undefined) {
          throw "Dictionary base is to small for those contents: " + curr;
        }
        results.push(val);
        extDict[newWord] = dictsize++;
        curr = next;
      }
    }

    if (curr !== "") {
      results.push(extDict.hasOwnProperty(curr) ? extDict[curr] : dict[curr]);
    }

    return results;
  };

  /**
   * Function decodes the LZW array to a astring.
   * @param {Array} codes array of LZW numbers to decode
   * @returns {String} decoded string
   */
  LZW.prototype.decode = function(codes) {
    var dict = this.dict;
    var dictSize = this.alphabet.length;
    var chunk;
    var locdict = {};
    var prevChar = getFromDict(codes[0], dict);
    var prevChunk = prevChar;
    var results = [prevChar];

    for (var i = 1; i < codes.length; i++) {
      //recovering encoding, we must get chunk and add dictionary word
      var currentCode = codes[i];
      chunk = getFromDict(currentCode, dict);

      if (chunk === null) {
        //well, check if in recovered dictionary
        if (locdict.hasOwnProperty(currentCode)) {
          chunk = locdict[currentCode];
        }
        if (chunk === null) {
          //if not in both, but we know it had to be there, means
          //was added in "last step" - so it is last word + the character
          //
          chunk = prevChunk + prevChar;
        }
      }
      //add chunk
      results.push(chunk);

      //add dictionary asssigned
      //previous char now is known, its current chunk first char (previous
      //chunk when added, added dictionary word, we add it now, step later)
      prevChar = chunk.charAt(0);
      //recreate dict
      locdict[dictSize++] = prevChunk + prevChar;
      prevChunk = chunk;
    }
    return results.join("");
  };

  function getFromDict(code, dict) {
    for (var p in dict) {
      if (code === dict[p])
        return p;
    }
    return null;
  }

}());




(function () {
  //mex is manual "hex"
  
  var mex = "abcdefghijklmnopqrstuvwxyz" + "0123456789" + "'%./:<>?[";
  var Umex = "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + "*!-#$&+()@" + "\"]^_`{|}~";
  var mexMap = {};
  
  for (var i = 0; i < mex.length; i++) {
    mexMap[mex.charAt(i)] = i;
  }
  
  var UmexMap = {};
  for (var i = 0; i < mex.length; i++) {
    UmexMap[Umex.charAt(i)] = i;
  }
  
  var UmexToMexMap = {};
  for (var i = 0; i < mex.length; i++) {
    UmexToMexMap[mex.charAt(i)] = Umex.charAt(i);
  }
  
  var mnums = mex.split("");
  var maxMnum = mnums.length;
  
  function converToMex(number) {
    var rest = 0;
    var minus = number < 0;
    
    if (minus) {
      number = -number;
    }
    
    var newNum = "";
    var first = true;
    
    do {
      rest = number % maxMnum;
      if (first) {
        newNum = UmexToMexMap[mnums[rest]];
        first = false;
      } else {
        newNum = mnums[rest] + newNum;
      }
      number = (number - rest) / maxMnum;
    } while (number > 0);
    if (minus) {
      return "-" + newNum;
    }
    return newNum;
  };
  
  function convertFromMex(mexNum) {
    var newNum = 0;
    var pow = 0;
    var first = true;
    for (var i = 0; i < mexNum.length; i++) {
      var cur = mexNum.charAt(mexNum.length - 1 - i);
      if (first) {
        first = false;
        cur = mex.charAt(UmexMap[cur]);
      }
      newNum += mexMap[cur] * Math.pow(maxMnum, pow++);
    }
    return newNum;
  };
  
  var lzw = new qubit.compression.LZW({});
  
  var Define = qubit.Define;
  
  /**
   * @class qubit.compression.Compressor
   * Compressor class.
   * @param {Object} config - unused.
   */
  function Compressor (config) {
  }

  Define.clazz("qubit.compression.Compressor", Compressor);

  /**
   * Compression function used to compress string with binary output in UTF
   * form.
   * @param {String} string
   * @param {qubit.compression.LZW} lz optional LZW instance. Use it to pass 
   *    custom LZW instance.
   * @returns {String} compressed string in binary UTF coded form.
   */
  Compressor.prototype.compress = function(string, lz) {
    var array = (lz || lzw).encode(string);
    var result = [];

    for (var i = 0; i < array.length; i++) {
      result.push(String.fromCharCode(array[i]));
    }
    return result.join("");
  };
  
  /**
   * Function used to compress content and with custom encoding output coded
   * with characters set from 45 locang character array. All characters are 
   * plain ANSI C types. This compression has worse performance than binary 
   * and for short string will be as goog as 2x larger than binary output.
   * For very short strings it can be even longer than source.
   * Advantage of this compressor is that its output is ANSI C coded.
   * 
   * @param {String} string string to be compressed
   * @param {qubit.compression.LZW} lz optional LZW instance to be used.
   * @returns {String}
   */
  Compressor.prototype.compressAnsi = function(string, lz) {
    var array = (lz || lzw).encode(string);
    var result = [];

    for (var i = 0; i < array.length; i++) {
      var num = converToMex(array[i]);
      result.push(num);
    }
    return result.join("");
  };
  
  /**
   * Function used to decompress `compressAnsi()` function output strings.
   * @param {String} code compressed string
   * @param {qubit.compression.LZW} lz optional LZW instance to be used.
   * @returns {String} decompressed string
   */
  Compressor.prototype.decompressAnsi = function(code, lz) {
    var array = [];
    var curr = "";
    for (var i = 0; i < code.length; i++) {
      var ch = code.charAt(i);
      if (UmexMap.hasOwnProperty(ch)) {
        var num = curr + ch;
        curr = "";
        num = convertFromMex(num);
        array.push(num);
      } else {
        curr += ch;
      }
    }
    return (lz || lzw).decode(array);
  };
  /**
   * Function will decopmress compressed string by `compress()` function.
   * 
   * @param {String} code compressed string
   * @param {qubit.compression.LZW} lz optional LZW instance to be used.
   * @returns {String} decompressed string
   */
  Compressor.prototype.decompress = function(code, lz) {
    var array = [];
    for (var i = 0; i < code.length; i++) {
      array.push(code.charCodeAt(i));
    }
    return (lz || lzw).decode(array);
  };
  
}());




/*
 * TagSDK, a tag development platform
 * Copyright 2013-2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  
  var Define = qubit.Define;
  
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
  function Utils() {}
  
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
   * and PACKAGE_NAME on prototype. It also sets superclass to extending class
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
   * @deprecated.
   * Function checking if a page variable reference exists.
   * @param {Object} value
   * @returns {Boolean}
   */
  Utils.variableExists = function (value) {
    return (value !== undefined) && (value !== null) && (value !== "");
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
  function addAnonymousAcessor (obj) {
    return Utils.addToArrayIfNotExist(Utils.ANON_VARS, obj);
  };

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
  
  //private helper for objectCopy
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
    var res = _objectCopy (obj, cfg, cfg.maxDeep);
    travelArray = [];
    return res;
  };
  
  function _objectCopy(obj, cfg, maxDeep, start, parentObj) {
    var nodes = false,
      noOwn = false,
      noFunctions = false,
      win = false,
      all = false,
      copyReference = false;
    
    if (cfg) {
      all = !!cfg.all;
      nodes = all || cfg.nodes;
      win = all || cfg.win;
      noOwn = all;
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
      return;
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
          return obj; //IE case, no comment
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
      var funStr = String(obj).replace(/\s+/g,"");
      if ((funStr.indexOf("{[nativecode]}") + 14) === funStr.length) {
        //native case
        copy = function() {
          return obj.apply(parentObj || this, arguments);
        };
      } else {
        copy = function() {
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
   * 
         exe(obj, parent, propName, trackPath)
   * 
   * Where obj is the objects propery reference, parent is the parent object 
   * reference, propName is the property name and trackPath is a fully qualified
   * classpath leading to this object's property.
   * 
   * @param {Object} obj
   * @param {Function} exe
   * @param {Object} cfg Optional configuration object with possible properties:
   * 
   * - `objectsOnly` only properties that are Objects
   * 
   * - `maxDeep` how deep to penetrate
   * 
   * - `hasOwn` checking if `hasOwnProperty` should be applied 
   *    (only own properties) (default true)
   *    
   * - `nodes` if DOM nodes should be included in traverse (default false)
   */
   Utils.traverse = function (obj, exe, cfg) {
     _traverse(obj, exe, cfg);
   };
   
   function _traverse(obj, exe, cfg, start, parent, prop, trackPath) {
    cfg = cfg || {};
    
    if (cfg.hasOwn === undefined) {
      cfg.hasOwn = true;
    }
    
    if (cfg.objectsOnly && !(obj instanceof Object)) {
      return;
    }
    
    if (cfg.maxDeep !== undefined && !cfg.maxDeep) {
      return;
    } else if (cfg.maxDeep !== undefined) {
      cfg.maxDeep--;
    }
    
    if (!cfg || !cfg.nodes) {
      try {
        if (obj instanceof Node) {
          //dont follow those objects
          return;
        }
      } catch (ie) {
        if (obj instanceof ActiveXObject && obj.nodeType !== undefined) {
          return; //IE case, no comment
        }
      }
    }
    if (obj === global) {
      //dont follow those objects
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
      //live getters will be ommited
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
          _traverse(object, exe, cfg, start + 1, parent, pprop, objPath);
        } catch (e) {}
      }
      i++;
    }
  };

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
   * @param {Function} extendingClass class to inherit from
   * @returns {Object} defined class reference
   */
  Utils.defineClass = function (classPath, extendingClass, config) {
    
    var names = classPath.split(".");
    var className = names[names.length - 1];
    
    //create class
    //@TODO create eval fix and do proper wrap.
    var clazz;
    var funTemplate = "(function " + className + "() {" +
      "  if (" + classPath + "._CONSTRUCTOR) {" +
      "    return " + classPath + "._CONSTRUCTOR.apply(this, arguments);" +
      "  } else {" +
      "    if (" + classPath + ".superclass) {" +
      "      return " + classPath + ".superclass.apply(this, arguments);" +
      "    }" + 
      "  }" +
      "})";
    
    clazz = Utils.gevalAndReturn(funTemplate).result;

//or anonymous:
//    var clazz = function () {
//      if (CONSTR) {
//         CONSTR.apply(this, arguments);
//      } else if (clazz.superclass) {
//        clazz.superclass.apply(this, arguments);
//      }
//    };

    var CONSTRUCTOR = config.CONSTRUCTOR;
    
    clazz._CONSTRUCTOR = CONSTRUCTOR;
    clazz.superclass = extendingClass;
    
    //publish class
    Utils.clazz(classPath, clazz, extendingClass);
    
    //pass prototype objects
    for (var prop in config) {
      if (config.hasOwnProperty(prop) && prop !== "CONSTRUCTOR") {
        clazz.prototype[prop] = config[prop];
      }
    }
    return clazz;
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
   * if exists it will return its popsition.
   */
  Utils.addToArrayIfNotExist = function (array, obj) {
    var i = 0, exists = false;
    for (; i < array.length; i += 1) {
      if (array[i] === obj) {
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
    var i = 0, exists = false;
    for (; i < array.length; i++) {
      if (array[i] === obj) {
        exists = true;
        break;
      }
    }
    return exists ? i : -1;
  };
  
  /*
   * Local function taking as argument and array and a string that will be  
   * removed from the array if it equals (===) to any of array items.
   * 
   * @param {Array} array
   * @param {Object} obj
   */
  Utils.removeFromArray = function (array, obj) {
    var i = 0;
    for (; i < array.length; i += 1) {
      if (array[i] === obj) {
        array.splice(i, 1);
      }
    }
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
  
  /**
   * Evaluates expression and returns value of wrapped by "(" expression ")".
   * @param {String} expression
   * @returns {Object}
   */
  Utils.gevalAndReturn = function (expression) {
    Utils.gevalAndReturn.___var_test___ = undefined;
    Utils.gevalAndReturn.___var_test___error = undefined;
    expression  =
            "try{qubit.opentag.Utils.gevalAndReturn.___var_test___=(" +
            expression +
            ");}catch(ex){" +
            "qubit.opentag.Utils.gevalAndReturn.___var_test___error = ex;" +
            "}";
    Utils.geval(expression);
    var res = Utils.gevalAndReturn.___var_test___;
    var err = Utils.gevalAndReturn.___var_test___error;
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
  
  /**
   * Global eval function.
   * It evaluates expression in a global scope.
   * @param {String} expression
   */
  Utils.geval = function (expression) {
    //@todo replace withy global
    if (window && window.execScript) {
      window.execScript(expression);
    } else {
      (function () {return global["eval"].call(global, expression); }());
    }
  };
  
  var _readyCalls = [];
  var _loaded = false;
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
  Utils.bodyReady = function(callback) {
    if (_loaded) {
      if (callback) {
        callback();
      }
      return true;
    }

    _loaded = !!(document.body && document.readyState === "complete");

    if (_loaded) {
      for (var i = 0; i < _readyCalls.length; i++) {
        try {
          _readyCalls[i]();
        } catch (ex) {
          if (global.console && global.console.trace) {//L
            global.console.trace(ex);//L
          }//L
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
  
  //@TODO maybe loop will be more "smooth" choice, review it.
  var oldOnload = global.onload;
  global.onload = function (e) {
    Utils.bodyReady();
    if (oldOnload) {
      oldOnload(e);
    }
  };
  
}());
/*NO LOG*/

/* jshint white: false */

/*
 * TagSDK, a tag development platform
 * Copyright 2013-2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  
  var Define = qubit.Define;
  var c = null;
  
  /**
   * @class qubit.opentag.Log
   * 
   * #Logging class
   * 
   * ALWAYS USE LOGGER IN A SEPARATE LINES. Lines containing logger 
   * may be deleted by compression process.
   * 
   * @param prefix {String} typical prefix to be used for each logger instance
   * @param clazz {Object} class object or function returning special
   * prefixed logging contents.
   * @param collectLocally {Boolean} should collect logs locally
   */
  function Log(prefix, clazz, collectLocally) {
    
    this.collectLogs = !!Log.COLLECT;
    this.collectLocally = collectLocally;
    /**
     * Collection of logging inputs:
     * 
     * [message, styling, ifPlain, type, level]
     * 
     * @property
     * @type Array
     */
    this.collection = [];
    
    this.getPrefix = function () {
      var clz = "";
      if (clazz) {
        if (typeof(clazz) === "function") {
          clz = clazz(this.ref);
        } else if (clazz.CLASS_NAME) {
          clz = clazz.CLASS_NAME;
        } else if (clazz.constructor && clazz.constructor.name) {
          clz = clazz.constructor.name;
        }
        if (clz) {
          clz += " -> ";
        }
      }
      return (prefix || "") + clz;
    };
  }

  Define.clazz("qubit.opentag.Log", Log);

  /**
   * Static property used to define finest level.
   * @property {Number} [LEVEL_FINEST=4]
   */
  Log.LEVEL_FINEST = 4;
  /**
   * Static property used to define fine level.
   * @property {Number} [LEVEL_FINE=3]
   */
  Log.LEVEL_FINE = 3;
  /**
   * Static property used to define informative level.
   * @property {Number} [LEVEL_INFO=2]
   */
  Log.LEVEL_INFO = 2;
  /**
   * Static property used to define severe level.
   * @property {Number} [LEVEL_WARN=1]
   */
  Log.LEVEL_WARN = 1;
  /**
   * Static property used to define severe level.
   * @property {Number} [LEVEL_ERROR=0]
   */
  Log.LEVEL_ERROR = 0;
  
  /**
   * @property {Number} [LEVEL_NONE=-1]
   * Static property used to define no logging level.
   */
  Log.LEVEL_NONE = -1;
  
  /**
   * @static
   * @property {Number} [MAX_LOG_LEN=10000]
   * Static property used to limit maximum amount of logs collected.
   */
  Log.MAX_LOG_LEN = 10000;
  
  /**
   * @property {Number} [MAX_LOG_LEN=-1]
   * Maximum log collection limit for this instance, 
   * default is -1, which means no limit is set.
   */
  Log.prototype.MAX_LOG_LEN = -1;
  
  /**
   * @property LEVEL
   * 
   * `Log.LEVEL` property is used to controll globally current and default loggin
   * level.
   * Choose from Log.LEVEL_* properties to adjust system logging output.
   * 
   * Example:
    
         qubit.opentag.Log.LEVEL = qubit.opentag.Log.LEVEL_FINEST;

   *  will enable all logs to 
   * be at output.
   
         qubit.opentag.Log.LEVEL = qubit.opentag.Log.LEVEL_NONE;
  
   * will disable any logs.
   * 
   * All log levels:
    
        Log.LEVEL_FINEST = 4;
        Log.LEVEL_FINE = 3;
        Log.LEVEL_INFO = 2;
        Log.LEVEL_WARN = 1;
        Log.LEVEL_ERROR = 0;
        Log.LEVEL_NONE = -1;
  
   */
  Log.LEVEL = Log.LEVEL_NONE;
  Log.LEVEL = Log.LEVEL_INFO;/*D*///line deleted during merge
  Log.COLLECT_LEVEL = Log.LEVEL_FINE;
  Log.COLLECT = true;
  
  var collection = [];
  
  /**
   * Collection of logging inputs globally.
   * Contents for each element:
   * 
   * [message, styling, ifPlain, type, level]
   * 
   * @static
   * @property
   * @type Array
   */
  Log.logsCollection = collection;
  
  /**
   * Function will cause re-printing all of the logs that were collected.
   * Collection mechanism has it's own LEVEL configuration same
   * as plain logging in console.
   * @param {Number} level logging LEVEL value to use
   * @param {Number} delay delay each message by delay ms value
   */
  Log.rePrintAll = function (level, delay, noClean, array) {
    var oldLevel = Log.LEVEL;
    
    if (level !== undefined) {
      Log.LEVEL = level;
    }
    
    try {
      if (Log.COLLECT) {
        try {
          if (!noClean) {
            c.clear();
          }
        } catch (ex) {
          
        }
        var collection = array || Log.logsCollection;
        var counter = 0;
        for (var i = 0; i < collection.length; i++) {
          (function (j) {
            var log = collection[j];
            var logLevel = log[3];
            if (logLevel !== undefined && Log.LEVEL >= logLevel) {
              counter++;
              if (!delay) {
                Log.print.apply(Log, log);
              } else {
                qubit.opentag.Timed.setTimeout(function () {
                  if (level !== undefined) {
                    Log.LEVEL = level;
                  }
                  try {
                    Log.print.apply(Log, log);
                  } finally {
                    Log.LEVEL = oldLevel;
                  }
                }, counter * delay);
              }
            }
          })(i);
        }
      }
    } catch (ex) {
      //for sanity
    } finally {
      Log.LEVEL = oldLevel;
    }
  };
  
  var _ssupported = !!Define.global().webkitURL;
  /**
   * Use styling by default.
   * @returns {Boolean}
   */
  Log.isStyleSupported = function () {
    return _ssupported;
  };
  
  var altConsole = {
    
  };
  /**
   * 
   * Attach console object to controll logging print method.
   * @param {Object} xconsole
   * @returns {Object} console attached
   */
  Log.setConsole = function (xconsole) {
    xconsole = xconsole || altConsole;
    return c = xconsole;
  };
  
  /**
   * @static
   * @property Runtime property, if higher that zero, it will be delay between
   * each of logger messages. If there is to much logs being run, slowing down
   * may be good idea. To do it, just set this property to any milisecond value
   * you like.
   * @type Array
   */
  Log.delayPrint = -1;
  
  var _last_run = new Date().valueOf();
  /*
   * @protected
   * Print method.
   * Override this method if you prefer different logging output.
   * By default all messages are redirected to console.
   * 
   * This method is used by all logging methods as final output.
   * @param {String} message
   * @param {String} style CSS style
   * @param {String} type console['type'] call
   * @param {Number} level number
   */
  Log.prototype.printMessage = function (message, style, type, level) {
    if (Log.delayPrint > 0) {
      var delay = Log.delayPrint;
      var ago = _last_run - new Date().valueOf();
      if (ago > 0) {
        //_count_close_msgs meassures how many times print was called in
        //lower than default scale
        delay += ago;
      }
      try { //try delayed option, if package exists
        qubit.opentag.Timed.setTimeout(function () {
            this.print(message, style, type, level);
        }.bind(this), delay);
      } catch (e) {
        setTimeout(function () {
          this.print(message, style, type, level);
        }.bind(this), delay);
      }
      _last_run  = new Date().valueOf() + delay;
    } else {
      this.print(message, style, type, level);
    }
  };
  
  /**
   * Instance print method.
   * @param {String} message
   * @param {String} style CSS style
   * @param {String} type console['type'] call
   * @param {Number} level number
   */
  Log.prototype.print = function (message, style, type, level) {
    Log.print(message, style, type, level);
  };
  
  /**
   * @static
   * Static log print method.
   * @param {String} message
   * @param {String} style CSS style
   * @param {String} type console[<type>] call
   * @param {Number} level number
   */
  Log.print = function (message, style, type, level) {
    //pre-eliminary step
    if (level !== undefined && Log.LEVEL < level) {
      return;
    }
    try {
      if (c && c.log) {
        if (style && Log.isStyleSupported()){
          if (type && c[type]) {
            c[type]("%c" + message, style);
          } else {
            c.log("%c" + message, style);
          }
        } else {
          if (type && c[type]) {
            c[type](message);
          } else {
            c.log(message);
          }
        }
      }
    } catch (ex) {
      //swollow...
    }
  };
  
  /**
   * Collector function for log class.
   * This function manages logs collection process.
   * @protected
   * @param {Array} toPrint array to print
   * @param {Number} level
   * @returns {Array}
   */
  Log.prototype.collect = function (toPrint, level) {
    if (level === undefined) {
      level = Log.COLLECT_LEVEL;
    }
    
    var collected = false;
    var collectingGlobally = 
            (this.collectLogs && Log.COLLECT && Log.COLLECT_LEVEL >= +level);
    
    if (collectingGlobally) {
      collection.push(toPrint);
      collected = true;
    }
    
    if (this.collectLocally && collectingGlobally) {
      this.collection.push(toPrint);
      collected = true;
    }
    
    if (Log.MAX_LOG_LEN > 0) {
      if (collection.length > Log.MAX_LOG_LEN) {
        collection.splice(0, collection.length - Log.MAX_LOG_LEN);
      }
    }
    
    if (Log.MAX_LOG_LEN > 0 || this.MAX_LOG_LEN > 0) {
      var len = Log.MAX_LOG_LEN;
      if (this.MAX_LOG_LEN > 0) {
        len = this.MAX_LOG_LEN;
      }
      if (this.collection.length > len) {
          this.collection.splice(0, this.collection.length - len);
      }
    }
    
    return collected ? toPrint : null;
  };
  
  /**
   * Clears console and the logs collection.
   */
  Log.clearAllLogs = function () {
    try {
      c.clear();
    } catch (e) {
    } finally {
      collection.splice(0, collection.length);
    }
  };
  
  /**
   * @static
   * Returns logs collection set filtered by level. Utility function.
   * @param {Number} level One of Log.LEVEL_* values.
   * @param {Array} altCollection alternatrie collection source
   * @returns {Array}
   */
  Log.getCollectedByLevel = function (level, altCollection) {
    altCollection = altCollection || collection;
    var results = [];
    for (var i = 0; i < altCollection.length; i++) {
      var log = altCollection[i];
      var msg = log[0];
      var lvl = msg[4];
      if (lvl === level) {
        results.push(log);
      }
    }
    return results;
  };


  /**
   * Re-printing function for all instance log.
   * @param {Number} level logging level to apply
   * @param {Number} delay delay metween messages (in ms)
   * @param {Boolean} clean Clear the console before re-print
   */
  Log.prototype.rePrint = function (level, delay, clean) {
    Log.rePrintAll(level, delay, !clean, this.collection);
  };

  /**
   * @private
   * 
   * Logger function, this is strictly private function that manages logging
   * process.
   * 
   * @param {qubit.opentag.Log} log
   * @param {String} prefix
   * @param {String} type console[type]
   * @param {String} message
   * @param {Boolean} plain if just a plain output of console
   * @param {Boolean} style optional styling
   * @param {String} plainStyle CSS styling string
   * @param {Number} level
   */
  function logger(log, prefix, type, message, plain, style, plainStyle, level) {
    var toPrint;
    var pass = Log.LEVEL >= level;
    if (Log.COLLECT_LEVEL >= 0 || pass) {
      if (plain) {
        toPrint = [message, plainStyle, type];
      } else {
        toPrint = [
          prefix + log.getPrefix() + message,
          style,
          type
        ];
      }
      toPrint[3] = level;
      log.collect(toPrint, level);
      if (pass) {
        log.printMessage.apply(log, toPrint);
      }
    }
  }
  
  //it is important it is not in one line. New build will strip logs for release
  /**
   * @method
   * Finest level logging function.
   * 
   * @param {String} message Message to be logged.
   * @param {Boolean} plain If true, message object will be logged as plain as 
   *    passed directly to console. It's usefull if your console supports JSON 
   *    style browsing objects.
   */
  Log.prototype.
    FINEST = function (message, plain) {
      logger (this, "FINEST: ", false, message, plain, "color:#CCCCCC;", false,
        Log.LEVEL_FINEST);
    };
    
  /**
   * @method
   * Fine level logging function.
   * 
   * @param {String} message Message to be logged.
   * @param {Boolean} plain If true, message object will be logged as plain as 
   *    passed directly to console. It's usefull if your console supports JSON 
   *    style browsing objects.
   */
  Log.prototype.
    FINE = function (message, plain) {
      logger (this, "FINE: ", false, message, plain, "color:#999999;", false,
        Log.LEVEL_FINE);
    };
  
  /**
   * @method
   * Information level logging function.
   * 
   * @param {String} message Message to be logged.
   * @param {Boolean} plain If true, message object will be logged as plain as 
   *    passed directly to console. It's usefull if your console supports JSON 
   *    style browsing objects.
   * @param style {String} CSS styling - inline.
   */
  Log.prototype.
    INFO = function (message, plain, style) {
      logger (this, "INFO: ", "info", message, plain, style, style,
        Log.LEVEL_INFO);
    };
  
  /**
   * @method
   * Severe/Error level logging function.
   * 
   * @param {String} message Message to be logged.
   * @param {Boolean} plain If true, message object will be logged as plain as 
   *    passed directly to console. It's usefull if your console supports JSON 
   *    style browsing objects.
   */
  Log.prototype.
    WARN = function (message, plain) {
      logger (this, "WARN: ", "warn", message, plain, "color:#26A110;", false,
        Log.LEVEL_WARN);
    };
    
  /**
   * @method
   * Severe/Error level logging function.
   * 
   * @param {String} message Message to be logged.
   * @param {Boolean} plain If true, message object will be logged as plain as 
   *    passed directly to console. It's usefull if your console supports JSON 
   *    style browsing objects.
   */
  Log.prototype.
    ERROR = function (message, plain) {
      logger(this, "ERROR: ", "error", message, plain, "color:red;", false,
        Log.LEVEL_ERROR);
    };
    
  Log.setConsole(Define.global().console);
}());




/*
 * TagSDK, a tag development platform
 * Copyright 2013-2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function(){
    var Utils = qubit.opentag.Utils;
    var log = new qubit.opentag.Log("Timer -> ");
    
    /**
     * #Timer implementation.
     * 
     * Timer is intended to replace (wrap) the setTimeout
     * method so over/misuse of `setTiemout`method can be controlled. 
     * It supports rate and runtime runtime adjustment (slowing down etc.).
     * 
     * Interesting option for this timer is `dynamic` config property, if it
     * is set to true timer will be using intelligent timing adjustment for 
     * checking the execution stack (array where all timed out functions reside
     * with time assigned). For example, if there is function timed to be run
     * after 1000ms, timer will be checking stack around 1000ms later to run 
     * ready functions, if there was another function with 200ms delay, timer 
     * will check every 200ms if there is anything timed out in stack and so on
     * till stack is empty.
     * 
     * Dynamic option is much more lighter but less accurate.
     * 
     * See the PAI for more details and other functions.
     * 
     * 
     * @class qubit.opentag.Timer
     * @param {Object} config
     * @returns {qubit.opentag.Timer}
     */
    function Timer (config) {
      if (config) {
        log.FINEST("Config:");
        log.FINEST(config, true);
       /**
        * @private
        * Please use setRate to update timers rate
        * @type Number
        */
        this._rate = config.rate || 10;
        this._smallestRate = -1;
        if (config.start) {
          this.startPooling();
        }
        this.config = config;
      }
      this.inervals = [];
      this._lck_obj = {};
      this._binded_pool = this._pool.bind(this);
    }
    
    Utils.clazz("qubit.opentag.Timer", Timer); 
    
    /**
     * @property [Array] timers
     * Array of pairs `{Date, Function}`
     * `Date` stands for timed out date.
     * `Function` is a function refernece to call.
     */
    Timer.prototype.timers = [];
    
    /**
     * Function starts pooling.
     * @param smallestRate {Number} optional smallest rate argument, it will 
     *  be used as temporal rate if dynamic option is set on timer and not 
     *  smaller than minimal rate set on timer
     */
    Timer.prototype.startPooling = function (smallestRate) {
      if (smallestRate && this.config.dynamic) {
        if(this._smallestRate < 0 || this._smallestRate > smallestRate){
          //@TODO in futurewe can add more precise instrument than estimate
          this._smallestRate = Math.min(Math.floor(smallestRate/2), 1500);
        }
      }
      if (!this.started) {
        this.started = true;
        setTimeout(this._binded_pool, 0);
      }
    };
    
    /**
     * @private
     * Pooling function.
     * Strictly private.
     */
    Timer.prototype._pool = function () {
      this.maxFrequent(function () {
        var name = "";
        if (this.config && this.config.name) {
          name = "[" + this.config.name + "]";
        }
        log.FINEST(name + "Pooling in progress...");
      }, 5000, this._lck_obj);
      
      this.callTimers();
      
      if (this.timers.length !== 0) {
        var rate = (this._smallestRate > this._rate) ?
                            this._smallestRate : this._rate;
        setTimeout(this._binded_pool, rate);
      } else {
        this.started = false;
        this._smallestRate = -1;
      }
    };
    
    /**
     * Worker clearing outdated timers. Used internally.
     * May be also called to manually to validate timers.
     */
    Timer.prototype.callTimers = function () {
      this.lastCalled = new Date().valueOf();
      for (var i = 0; i < this.timers.length; i++) {
        var timer = this.timers[i];
        var stamp = new Date().valueOf();
        if (stamp >= timer.time) {
          try {
            timer.execute();
          } catch (e) {
            log.ERROR("Error calling timer: " + e)
          }
          this.timers.splice(i,1);
          --i;
        }
      }
    };
    
    /**
     * Clear execution stack.
     * It will remove any existing timeouts.
     */
    Timer.prototype.cancellAll = function () {
      this.timers = [];
      log.WARN("Cancelling all stack.");
    };
    
    /**
     * Function setting maximum interval time for this instance clock.
     * All setTiemout and setInterval will be no more often run than rate value.
     * @param {Number} time ms
       */
    Timer.prototype.setRate = function (time) {
      this._rate = time;
    };
    
    /**
     * Function letting running `fun` argument no more often than `time` 
     * property. **It does not warranty execution** - if function is recognised
     * to be called too early - it will be not run.
     * 
     * If `lockObj` is unset `fun.__maxFrequent__timer_opentag_qubit_` property
     *  will be used - notice that this lock will be shared with other calls 
     *  on this `fun` instance if `lockObj` is not provided, to ensure it does 
     *  not happen use a plain object instance or create separate instance of 
     *  timer for each frequent callers.
     * 
     * Typically, lock object will be a private property dedicated for a 
     * frequent calling block.
     * 
     * @param {Function} fun Function to be run
     * @param {Number} time in ms
     * @param {Object} lockObj lock object
     */
    Timer.prototype.maxFrequent = function(fun, time, lockObj) {
      if (!lockObj) {
        fun.__maxFrequent__timer_opentag_qubit_ = 
                fun.__maxFrequent__timer_opentag_qubit_ || {};
        lockObj = fun.__maxFrequent__timer_opentag_qubit_;
      }
      var last = lockObj.____last__timed__max__frequent____;
      
      if (!last || (new Date().valueOf() - last) > time) {
        last = new Date().valueOf();
        lockObj.____last__timed__max__frequent____ = last;
        fun();
      }
    };
    
    /**
     * Function that does not allow to run processes too often.
     * It works similarry to `maxFrequent` with that difference that if call is
     * detected too early it will not reject it but schedule to be run at 
     * nearest available time. **If function was already scheduled to run soon - 
     * it will not be scheduled.**
     * @param {Function} fun Function to be run.
     * @param {Number} time No more often then `time` in ms.
     * @param {Object} lockObj Lock object (empty object used as a lock)
     * @returns {Boolean} True if function was run immediately.
     */
    Timer.prototype.runIfNotScheduled = function(fun, time, lockObj) {
      if (lockObj.__lastRun__ &&
            (new Date().valueOf() < (time + lockObj.__lastRun__))) {
        return this.schedule(fun, time, lockObj);
      } else {
        lockObj.__lastRun__ = new Date().valueOf();
        fun();
        return true;
      }
    };
    
    /**
     * Scheduler that schedules only if not already scheduled.
     * @param {Function} fun
     * @param {Number} time
     * @param {Object} lockObj Lock object (empty object used as a lock)
     * @returns {Boolean} false only lockObject indicate function is already 
     * scheduled
     */
    Timer.prototype.schedule = function(fun, time, lockObj) {
      if (lockObj.___scheduled___)  {
        return false;
      } else {
        lockObj.___scheduled___ = new Date().valueOf();
        this.setTimeout(function () {
          lockObj.___scheduled___ = false;
          lockObj.__lastRun__ = new Date().valueOf();
          fun();
        }, time);
        return true;
      }
    };
    
    var ids = 1;
    /**
     * Set timeout method.
     * Run `call' function after minimum of `time` in miliseconds.
     * It wraps standard setTimeout so all calls can be controlled in one place.
     * @param {Function} call Function callback.
     * @param {Number} time Tiemout value in miliseconds.
     * @returns {Object} timer object (POJO)
     */
    Timer.prototype.setTimeout = function (call, time) {
      var timer = {
        id: ids++,
        time: new Date().valueOf() + (+time),
        execute: call
      };
      this.timers.push(timer);
      this.startPooling(time);
      return timer;
    };
    
    /**
     * Set interval method.
     * Run `call' function every minimum of `time` in miliseconds.
     * @param {Function} call Function callback.
     * @param {Number} time Interval value in miliseconds.
     * @returns {Object} setInterval return
     */
    Timer.prototype.setInterval = function (call, time) {
      log.FINEST("Native wrapper");
      var interv =  setInterval(call, time);
      this.inervals.push(interv);
      return interv;
    };
})();




/*
 * TagSDK, a tag development platform
 * Copyright 2013-2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function(){
    var Utils = qubit.opentag.Utils;
    
    Utils.namespace("qubit.opentag.Timed", new qubit.opentag.Timer({
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
    Timed.tillTrue = function(test, callback, often) {
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

var q = {};


q.html = q.html || {};


q.html.fileLoader = {};

/**
 * Load a file at url, optionally calling functions before and after it 
 * is loaded
 * @param url The url to load
 * @param preLoadAction A function called before the url is loaded. If it 
                        returns false or throws an exception it will 
                        prevent the url from loading. Takes the url as 
                        an argument.
 * @param postLoadHandler A function called after the url is loaded. 
 *                        Takes the url as an argument.
 */
q.html.fileLoader.load = function (url, preLoadAction, postLoadHandler,
    parentNode, async, attributes) {
  var scriptEl, preLoadResult, loadError, doPostLoad, loaded;
  loaded = false;

  doPostLoad = function (loadFailed) {
    return function () {
      if (!loaded) {
        loaded = true;
        if (loadFailed && !loadError) {
          loadError = {
            url: document.location.href
          };
        }
        postLoadHandler(url, loadError, loadFailed);
      }
    };
  };
  
  //try to run the preLoadAction.
  try {
    if (preLoadAction) {
      preLoadResult = preLoadAction(url);
    }
  } catch (e) {
    preLoadResult = false;
    postLoadHandler(url, "Exception loading pre", true);
  } finally {
    if (preLoadResult !== false) {
      //create the javascript element.
      scriptEl = q.html.fileLoader.createScriptEl(url, async, 
          false, attributes);
      //assign the post load handler to run when it has loaded, 
      //if it exists.
      if (postLoadHandler) {
        scriptEl.onload = doPostLoad(false);
        scriptEl.onerror = doPostLoad(true);
        scriptEl.onreadystatechange = function () {
          if ((this.readyState === "complete") || 
              (this.readyState === "loaded")) {
            setTimeout(function () {
              doPostLoad(false)();
            }, 1);
          }
        };
      }
      if (!parentNode) {
        parentNode = window.document.getElementsByTagName("head")[0];
      }
      
      parentNode.appendChild(scriptEl);
      //The script is not loaded until it is added to the script.
      
    }
  }
};
q.html.fileLoader.createScriptEl = function (path, async, forceReload, attr) {
  var a, scriptEl = document.createElement("script");
  scriptEl.type = "text/javascript";
  scriptEl.src = q.html.fileLoader.tidyUrl(path) + 
    (forceReload ? ("?" + new Date().getTime()) : "");
  //Makes FF (version < 4) behave like IE/WebKit 
  //(this is on bydefault on FF4+)
  //See: https://developer.mozilla.org/en/html/element/script
  if (async !== false) {
    scriptEl.async = "true";
    scriptEl.defer = "true";
  } else {
    //TODO investigate whether scriptEl.async = false is enough in all browsers
    //in that case we don't need this mysterious if statement
    scriptEl.async = "false";
    if (scriptEl.async !== false) {
      scriptEl.async = false;
    }
    scriptEl.defer = "false";
  }
  for (a in attr) {
    if (attr.hasOwnProperty(a)) {
      scriptEl.setAttribute(a, attr[a]);
    }
  }
  return scriptEl;
};

q.html.fileLoader.tidyUrl = function (path) {
  if (path.substring(0, 5) === 'http:') {
    return path;
  }
  if (path.substring(0, 6) === 'https:') {
    return path;
  }
  return "//" + path;
};



/*
 * TagSDK, a tag development platform
 * Copyright 2013-2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  var Utils = qubit.opentag.Utils;
  var counter = 0;
  
  /**
   * @class qubit.opentag.filter.BaseFilter
   * 
   * #Base filter class.
   * 
   * Filters are objects that can be used with any 
   * qubit.opentag.BaseTag instances. Tag use filters ONLY when 
   * `runIfFiltersPass` is used to run a tag. Containers will run by default 
   * tags with filters associated with them.
   * 
   * Filter object has a `match` function that determines if filter can be used
   * with the tag. Second important function is `getState` function that 
   * describes filter's state:
   *  - DISABLED filter is disabled and ignored, same effect as filter is not 
   *  associated with the tag.
   *  - SESSION filter is in session
   *  - PASS filter passed and tag can be run.
   *  - FAIL filter failed to pass
   *  - `any value higher than 0` value higher than 0 indicates that filter
   *   must be tested again in time of the value of miliseconds. Tag will query 
   *   filter for state again after the miliseconds amount indicated by the 
   *   state value.
   * 
   * 
   * @param config {Object} config object used to build instance
   */
  function BaseFilter (config) {
    /*log*/
    this.log = new qubit.opentag.Log("", function () {
      return this.CLASS_NAME + "[" + this.config.name + "]";
    }.bind(this), "collectLogs");
    /*~log*/
    
    this.config = {
      /**
       * Filter order number - it is used by tag to determine order of filters.
       * @cfg {String} [order=0]
       */
      order: 0,
      /**
       * Include property indicates if this is "include" or "exclude" type
       *  filter.
       * @cfg {Boolean} [include=true]
       */
      include: true,
      /**
       * Filter name - each filter should have a name, if not specified - 
       * default will be given.
       * @cfg {String} [name="Filter-<timestamp>"]
       */
      name: "Filter-" + (counter++),
      /**
       * If defined, it will be used as final state decision maker.
       * It takes 2 arguments: (`this`, `passed`). passed argument is
       * the last state decision value taken.
       * @cfg {Function} [script=undefined]
       */
      script: undefined,
      /**
       * Session object - can be passed via configuration.
       * @cfg {qubit.opentag.Session} [session=undefined]
       */
      session: undefined
    };
    
    /**
     * Session object - if attached, it will be attached normally by 
     * tag instance.
     * @property {qubit.opentag.Session} session
     */
    this.session = null;
    
    if (config) {
      for (var prop in config) {
        if (config.hasOwnProperty(prop)) {
          this.config[prop] = config[prop];
        }
      }
      if (config.session) {
        this.setSession(config.session);
      }
    }
  }
  
  Utils.clazz("qubit.opentag.filter.BaseFilter", BaseFilter);
  

  /**
   * State value higher than 0 is used to distinqt delayed filters.
   *
   *     {
   *        DISABLED: -3,
   *        SESSION: -2,
   *        PASS: -1, //positive numbers are used for timeout
   *        FAIL: 0
   *     }; 
   * 
   * @static
   * @property {Number} state
   */
  BaseFilter.state = {
    DISABLED: -3,
    SESSION: -2,
    PASS: -1, //positive numbers are used for timeout
    FAIL: 0
  };
  
  /**
   * Function will reset object to initial state (disabled state will be turned
   *  to enabled).
   */
  BaseFilter.prototype.reset = function () {
    this.enable();
  };
  
  /**
   * Function will disable filter. State returned will be turned to disabled.
   */
  BaseFilter.prototype.disable = function () {
    this.config.disabled = true;
  };
  
  /**
   * Function will enmable filter.
   */
  BaseFilter.prototype.enable = function () {
    this.config.disabled = false;
  };
  
  /**
   * Function that determines if filter matches for use.
   * @returns {Boolean}
   */
  BaseFilter.prototype.match = function () {
    return true;
  };
  
  /**
   * Session object setter for filter.
   * @param {qubit.opentag.Session} session
   */
  BaseFilter.prototype.setSession = function (session) {
    this.session = session;
  };
  
  /**
   * Session object getter for filter.
   * @returns {qubit.opentag.Session}
   */
  BaseFilter.prototype.getSession = function () {
    return this.session;
  };
  
  /**
   * Filter function used to test filter for its state.
   * Tag has 2 stages at using filters:
   * 1) Checks if filter matches(apply) for the page - if so, tag will 
   * use the filter.
   * 2) If filter matches the page, it will run `getState()` to determine 
   * state type and decide on execution and how it relates with other filters.
   * @returns {Boolean}
   */
  BaseFilter.prototype.getState = function () {
    var passed = BaseFilter.state.PASS;
    
    if (this.config.disabled) {
      return BaseFilter.state.DISABLED;
    }
    
    if (this.config.script) {
      passed = this.config.script.call(this, passed);
    }
    
    if (isNaN(+passed)) {
      this.log.WARN("filters should use a numerical state as a return " +
              "for getState():" +//L
              " BaseFilter.state. Filter will fail. Returned: " + passed);//L
      passed = BaseFilter.state.FAIL;
    }
    
    this.lastState = +passed;
    
    return passed;
  };
}());




/*
 * TagSDK, a tag development platform
 * Copyright 2013-2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  var Utils = qubit.opentag.Utils;
  var BaseFilter = qubit.opentag.filter.BaseFilter;

  /**
   * #SessionVariable filter class.
   *  
   * This class is a compatibility layer part for TagSDK.
   * Session filters are used to customise scripts execution and use custom
   * scripts:
   * - to determine match for the page
   * - to trigger tag execution
   * 
   * If config object contains properties:
   * - `customScript` a function that is used to determine if filter matches. 
   *  It takes session object as a parameter.
   * - `customStarter` a function that is responsible for running the tag.
   *  By default it is an empty function, calling "ready" argument immediately.
   *  The `ready` argument is a callback triggering tag loading. `customStarter`
   *  takes 3 arguments in the order:
   *  1) `session` the session object
   *  2) `ready` the ready callback that runs the tag, note: it will run the tag
   *  directly.
   *  3) `tag` tag reference object.
   * 
   * When creating tags, consider using new API that serve typical use cases for
   * the session filters.
   * 
   * Example:
   * If tag depends on some property that will appear in window scope, like
   *  `jQuery`, use `genericDependencies` array in tag object and push function
   *  there that returns true when the `jQuery` object exists.
   * 
   * 
   * @class qubit.opentag.filter.SessionVariableFilter
   * @extends qubit.opentag.filter.BaseFilter
   * @param config {Object} config object used to build instance
   */
  function SessionVariableFilter(config) {
    var defaultConfig = {
      /**
       * Custom starter function for session filter.
       * Takes 3 arguments in the order:
       *  1) `session` the session object
       *  2) `ready` the ready callback that runs the tag, note: it will run the tag
       *  directly.
       *  3) `tag` tag reference object.
       * @cfg {Function}
       * @param {qubit.opentag.Session} session
       * @param {Function} ready
       * @param {qubit.opentag.BaseTag} tag
       */
      customStarter: function(session, ready, tag) {
        ready(false);
      },
      /**
       * Script deciding either script matches or not (top API level).
       * @cfg {Function}
       * @param {qubit.opentag.Session} session
       * @returns {Boolean}
       */
      customScript: function (session) {
        return true;
      }
    };
    
    if (config) {
      for(var prop in config) {
        if (config.hasOwnProperty(prop)) {
          if (prop === "customStarter" && !config[prop]) {
            continue;
          }
          if (prop === "customScript" && !config[prop]) {
            continue;
          }
          defaultConfig[prop] = config[prop];
        }
      }
    }
    
    SessionVariableFilter.superclass.call(this, defaultConfig);
  }
  
  Utils.clazz(
          "qubit.opentag.filter.SessionVariableFilter",
          SessionVariableFilter,
          BaseFilter);
  
  /**
   * Match function for a filter.
   * @returns {Boolean}
   */
  SessionVariableFilter.prototype.match = function () {
    try {
      return !!this.config.customScript(this.getSession());
    } catch (ex) {
      this.log.FINE("Filter match throws exception:" + ex);
      return false;
    }
  };
  
  /**
   * Function that will trigger running tag directly the callback privided in
   * configuration object, the `customStarter`.
   * @param {qubit.opentag.BaseTag} tag
   */
  SessionVariableFilter.prototype.runTag = function (tag) {
    if (!this._runTag) {
      if (this.config.customStarter) {
        //trigger "customStarter", only once
        this._runTag = true;
        this.config.customStarter(this.getSession(), function (rerun) {
          this.lastRun = new Date().valueOf();
          if (rerun === true) {
            tag.run();
          } else {
            tag.runOnce();
          }
          //done
        }.bind(this), tag);
      }
    }
  };
  
  /**
   * State function, this function adds to standard state function the SESSION
   * state. Session state is used if `customStarter` is attached.
   * @param {qubit.opentag.Session} session optional session
   */
  SessionVariableFilter.prototype.getState = function (session) {
    if (session) {
      this.setSession(session);
    }
    var pass = SessionVariableFilter.superclass.prototype.getState.call(this);
    
    if (pass === BaseFilter.state.DISABLED) {
      return BaseFilter.state.DISABLED;
    }
    
    if (pass === BaseFilter.state.PASS) {
      if (this.config.customStarter) {
        pass = BaseFilter.state.SESSION;
      }
    }
    
    if (this.config.script) {
      pass = this.config.script.call(this, pass, this.getSession());
    }
    
    this.lastState = pass;
    return pass;
  };
  
  /**
   * Reset function.
   */
  SessionVariableFilter.prototype.reset = function () {
    SessionVariableFilter.superclass.prototype.reset.call(this);
    this._runTag = undefined;
  };
}());
/*jslint evil: true */


q.html.GlobalEval = {};

//TODO: write unit test for this.

//Adapted from http://weblogs.java.net/blog/driscoll/archive/2009/09/08/eval-javascript-global-context
q.html.GlobalEval.globalEval = function (src) {
  if (window.execScript) {
    window.execScript(src);
  } else {
    var fn = function () {
      window["eval"].call(window, src);
    };
    fn();
  }
};
/*jslint evil: true */



/*global escape, unescape*/

//this is quite redundant package, simpler method can be used

q.html.HtmlInjector = {};

q.html.HtmlInjector.inject = function (el, injectStart, str, cb, parentNode) {
  var i, ii, d, scriptsRaw, scripts, script, contents;
  if (str.toLowerCase().indexOf("<script") >= 0) {
    d = document.createElement("div");
    //In IE, if you don't put a char here and the only thing the HTML contains
    //is a script element, the inner html doesn't get set.
    d.innerHTML = "a" + str;
    scriptsRaw = d.getElementsByTagName("script");
    //Make copy of the raw array that is given by the browser, as the
    //raw array changes as the dom changes.
    scripts = [];
    for (i = 0, ii = scriptsRaw.length; i < ii; i += 1) {
      scripts.push(scriptsRaw[i]);
    }
    contents = [];
    for (i = 0, ii = scripts.length; i < ii; i += 1) {
      script = scripts[i];
      var s = {
        attributes: q.html.HtmlInjector.getAttributes(script)
      };
      if (script.src) {
        s.src = script.src;
      } else {
        s.script = script.innerHTML;
      }
      contents.push(s);
      //Note: this line changes the length of scriptsRaw.
      script.parentNode.removeChild(script);
    }
    if (d.innerHTML) {
      //Remove first character in the html, put in above
      if (d.innerHTML.length > 0) {
        d.innerHTML = d.innerHTML.substring(1);
      }
    }
    q.html.HtmlInjector.doInject(el, injectStart, d);
    q.html.HtmlInjector.loadScripts(contents, 0, cb, el);
    //use document fragments if adding to multiple elements!
  } else {
    d = document.createElement("div");
    d.innerHTML = str;
    q.html.HtmlInjector.doInject(el, injectStart, d);
    if (cb) {
      cb();
    }
  }
};

q.html.HtmlInjector.doInject = function (el, injectStart, d) {
  if (d.childNodes.length > 0) {
    var fragment = document.createDocumentFragment();
    while (d.childNodes.length > 0) {
      fragment.appendChild(d.removeChild(d.childNodes[0]));
    }
    if (injectStart) {
      q.html.HtmlInjector.injectAtStart(el, fragment);
    } else {
      q.html.HtmlInjector.injectAtEnd(el, fragment);
    }
  }
};
q.html.HtmlInjector.injectAtStart = function (el, fragment) {
  if (el.childNodes.length === 0) {
    el.appendChild(fragment);
  } else {
    el.insertBefore(fragment, el.childNodes[0]);
  }
  
};
q.html.HtmlInjector.injectAtEnd = function (el, fragment, counter) {
  if (!counter) {
    counter = 1;
  }
  if ((el === document.body) && 
      (document.readyState !== "complete") && 
      (counter < 50)) {
    setTimeout(function () {
      q.html.HtmlInjector.injectAtEnd(el, fragment, counter + 1);
    }, 100);
  } else {
    el.appendChild(fragment);
  }
};
q.html.HtmlInjector.loadScripts = function (contents, i, cb, parentNode) {
  var ii, c, foundSrc = false;
  for (ii = contents.length; i < ii; i += 1) {
    c = contents[i];
    if (c.src) {
      foundSrc = true;
      break;
    } else {
      q.html.GlobalEval.globalEval(c.script);
    }
  }
  if (foundSrc) {
    q.html.fileLoader.load(
      c.src,
      null,
      function () {
        q.html.HtmlInjector.loadScripts(contents, i + 1, cb, parentNode);
      },
      parentNode,
      false,
      c.attributes
    );
  }
  if (cb && (i === ii)) {
    cb();
  }
};
q.html.HtmlInjector.getAttributes = function (node) {
  var a, aLength, attributes, val, name, map = {};
  if (node) {
    attributes = node.attributes;
    aLength = attributes.length;
    for (a = 0; a < aLength; a++) {
      val = attributes[a].value;
      name = attributes[a].name.toLowerCase();
      if ((val !== "") && ((name === "id") || (name === "class") ||
          (name === "charset") || (name.substr(0,5) === "data-"))) {
        map[name] = val;
      }
    }
    return map;
  }
};






(function () {
    var Utils = qubit.opentag.Utils;
    var log = new qubit.opentag.Log("TagsUtils -> ");
    var BaseFilter = qubit.opentag.filter.BaseFilter;
    var HtmlInjector = q.html.HtmlInjector;
    var FileLoader = q.html.fileLoader;
    var SessionVariableFilter = qubit.opentag.filter.SessionVariableFilter;
    
    /**
     * #Tag utility class
     * This class contains typical utility functions related to tags/loaders.
     * @singleton
     * @class qubit.opentag.TagsUtils
     */
    var TagsUtils = function () {};
    
    Utils.clazz("qubit.opentag.TagsUtils", TagsUtils);
    
    var _bodyLoaded = false;
    /**
     * Function returns true when body is interactible(it checks if body tag
     * exists and "loading" state is unset).
     * @returns {Boolean}
     */
    TagsUtils.bodyLoaded = function () {
      if (_bodyLoaded) {
        return true;
      }
      _bodyLoaded = !!(document.body && document.readyState !== "loading");
      return _bodyLoaded;
    };
    
    var loadedURLs = {};
    
    var STATE = {
      SUCCESS: "success",
      FAIL: "failure",
      INIT: "not started"
    };
    
    /**
     * Utility function for script url loading.
     * 
     * @param {Object} config Configuration object with properties:
     * 
     *  - `url` url to use 
     *  
     *  - `noMultipleLoad` do not load URL if was previously loaded (optional)
     *    
     *  - `onsuccess` event handler (optional) 
     *  
     *  - `onerror`  event handler (optional)
     *
     *  - `node` node to append (optional)
     * @return {undefined}
     */
    TagsUtils.loadScript = function (config) {
      var url = config.url;
      
      var loadingCheck = function (passedUrlFromLoader, loadError, loadFailed) {
        loadedURLs[url].error = loadError;
        if (loadFailed) {
          log.ERROR("Loading process error:");
          log.ERROR(loadError, true);
          loadedURLs[url].state = STATE.FAIL;
          config.onerror();
        } else {
          loadedURLs[url].state = STATE.SUCCESS;
          config.onsuccess();
        }
      };
      
      if (loadedURLs[url]) {
        if (config.noMultipleLoad) {
          log.FINE(url + " is already loaded, with state: " +
                  loadedURLs[url].state);//L
          return loadingCheck(
            url,
            loadedURLs[url].error,
            loadedURLs[url].state === STATE.FAIL
          );
        }
        loadedURLs[url].count += 1;
      } else {
        loadedURLs[url] = {
          count: 1,
          state: null
        };
      }
      
      var useWrite = !config.async;
      
      var loaded = TagsUtils.bodyLoaded();
      if (useWrite && loaded) {
        log.WARN("Script configured for synchronous injection while " +
                "document seems to be already loaded. Secure option " +//L
                "applies. Script will be appended in standard way.");//L
      }
      
      useWrite = useWrite && !loaded;
      
      if (useWrite) {
        log.WARN("Adding script element by using document.write. IE will" +
                " error check fail broken url's.");//L
        TagsUtils.writeScriptURL(
          url,
          function (allOk, error) {
            loadingCheck(url, error, !allOk);
          });
      } else {
        FileLoader.load(
          url,
          false,
          loadingCheck,
          config.node,
          config.async
        );
      }
    };
    
    
    var docWriteMethods = null;
    
    /**
     * Function holding `document.write` calls and let any writes to be 
     * collected into passed array as argument.
     * 
     * @param {Array} array
     * @param {qubit.opentag.Log} log log instance (optional)
       */
    TagsUtils.redirectDocumentWritesToArray = function (array, log) {
      var text = array;
      log && log.FINE("redirecting document.write methods...");
      docWriteMethods = docWriteMethods || {
        write: document.write,
        writeln: document.writeln
      };
      
      document.write = function (t) {
        text.push(t);
        log && log.FINE("Received call from document.write with:" + t);
      };
      document.writeln = function (t) {
        text.push(t);
        log && log.FINE("Received call from document.writeln with:" + t);
      };
    };
    
    /**
     * Function flushes all doc write redirects from the array passed (appended
     * string) and brings back normal document.write method.
     * 
     * @param {Array} array
     * @param {String} location
     * @param {Boolean} append
     * @param {qubit.opentag.Log} log
     * @param {Function} cb callback
     * @returns {Boolean} true if flushing location was ready and strings were
     *                    appended.
     */
    TagsUtils.flushDocWritesArray =
            function (array, location, append, log, cb) {
      var el = location;
      if (el && array) {
        var flushed = array.splice(0, array.length);
        try {
          TagsUtils.injectHTML(el, append, flushed.join("\n"), cb || EMPTY_FUN);
          return true;
        } catch(ex) {
          log.ERROR("Loading html caused exception:" + ex);
        }
      } else {
        var message = "Flushing location not found!";
        log && log.ERROR(message);
        return false;
      }
      if (cb) {
        cb();
      }
      return true;
    };

    /**
     * Unlocks document writes to normal state (if locked).
     */
    TagsUtils.unlockDocumentWrites = function () {
      if (docWriteMethods) {
        log && log.FINEST("Bringing back document.write");     
        document.write = docWriteMethods.write;
        document.writeln = docWriteMethods.writeln;
        docWriteMethods = null;
      }
    };

    var wsCounter = 0;
    /**
     * @deprecated
     * Old qtag write method for scripts.
     * @param {String} url
     * @param {Function} callback
     */
    TagsUtils.writeScriptURL = function (url, callback) {
      //@TODO review it.
      var callName = "_" + wsCounter++;
      var accessorName = TagsUtils.prototype.PACKAGE_NAME +
              ".TagsUtils.writeScriptURL.callbacks." + callName;
          
      TagsUtils.writeScriptURL.callbacks[callName] = function (error) {
        if (error) {
          callback(false, "error while loading script " + url);
        } else {
          callback(true);
        }
        TagsUtils.writeScriptURL.callbacks[callName] = undefined;
        delete TagsUtils.writeScriptURL.callbacks[callName];
      };
      
      var jsIE = "if(this.readyState === \"loaded\" || " +
              "this.readyState === \"complete\"){ try {" +
               accessorName + "(true)" +
              "} catch (ex) {}}";
      
      var jsNonIE = "try{" + accessorName + "(false)}catch(ex){}";
      var jsNonIEerr = "try{" + accessorName +
              "(true)}catch(ex){}";
      
      var scr = "scr", value;
      url = FileLoader.tidyUrl(url);
      value = "<" + scr + "ipt onload='" + jsNonIE +
              "'  onerror='" + jsNonIEerr +
              "' onreadystatechange='" + jsIE +
              "' type='text/javascript' " +
              " src='" + url + "'>" +
              //@TODO consider adding async option here
              //(doies it  really make sense?)
        "</" + scr + "ipt>";
      document.write(value);
    };
    
    TagsUtils.writeScriptURL.callbacks = {};
    
    var SESSION = BaseFilter.state.SESSION;
    var PASS = BaseFilter.state.PASS;
    var FAIL = BaseFilter.state.FAIL;
    
    /**
     * Entry method used to check if all filters used by this tag are passed.
     * BaseTag searches for filters in this.config.**package**.filters location.
     * The location should indicate all filters used by this tag.
     * The **package* config property is a crucial tags property used to
     * configure antiore tags. Filters can be added at runtime and via config
     * object as an array.
     * @param filters {Array} Array of filters to be analysed.
     * @param session {qubit.opentag.Session} tag that check is
     *  performed on
     * @returns {BaseFilter.state} numerical state.
     */
    TagsUtils.filtersState = function (filters, session, tag) {
      //tag.log.FINEST("Sorting filters...");
      //@todo maybe this should be done buch earlier
      filters = filters.sort(function (a, b) {
        try {
          return b.config.order - a.config.order;
        } catch (nex) {
          return 0;
        }
      });
      
      var decision = PASS;
      if (!filters || (filters.length === 0)) {
        return decision;
      }
      
      //loop and execute - MATCH
      var lastFilterResponded = null;
      var disabledFiltersPresent = false;
      var sessionFiltersPresent = false;
      var waitingResponse = 0;
      var response;
      var lastSessionFilter;
      
      var filter;
      var lastUnmatched;
      for (var i = 0; i < filters.length; i++) {
        filter = filters[i];
        filter.setSession(session);
        
        if (filter.match()) {
          response = filter.getState();
          // positive response means that filter tells to WAIT for execution
          // and try in 'response' miliseconds
          if (response > 0) {
            if (waitingResponse === 0 || waitingResponse > response) {
              waitingResponse = response;
            }
          } else if (response === BaseFilter.state.DISABLED) {
            tag.log.WARN("filter with name " + filter.config.name +
                    " is disabled");//L
            disabledFiltersPresent = true;
          } else if (response === SESSION) {
            sessionFiltersPresent = true;
            lastFilterResponded = filter;
            lastSessionFilter = filter;
          } else {
            lastFilterResponded = filter;
          }
        } else {
          lastUnmatched = filter;
        }
      }
      
      var onlyAwaitingFiltersPresent = false;
      if (lastFilterResponded === null) {
        onlyAwaitingFiltersPresent = true;
        if (!disabledFiltersPresent) {
          //all filters failed
          decision = FAIL;
        } else {
          //none passed but one of filters was disabled
          decision = PASS;
        }
      } else {
        //some filters matched, review state of final matched filter
        if (lastFilterResponded.config.include) {
          //last response was to INCLUDE this tag
          decision = response;
        } else {
          //last response was to EXCLUDE this tag
          decision = (response === PASS) ? FAIL : PASS;
        }
      }
      
      //if all passed, 
      //after standard checks, check if any filter called to wait
      if (waitingResponse > 0 && 
              (decision === PASS || onlyAwaitingFiltersPresent)) {
        decision = waitingResponse;
      }
      
      if (decision === SESSION ||
              ((decision === PASS) && sessionFiltersPresent)) {
        if (!lastSessionFilter.config.include) {
          return FAIL;
        }
        
        decision = SESSION;
        if (lastSessionFilter instanceof SessionVariableFilter) {
          try {
            lastSessionFilter.runTag(tag);
          } catch (ex) {
            lastSessionFilter.log.FINEST("trying custom starter failed:" + ex);
          }
        }
      }
      
      if (tag.config.dedupe && decision === PASS) {
        if (lastUnmatched && lastUnmatched instanceof SessionVariableFilter) {
          tag.sendDedupePing = true;
          decision = FAIL;
        }
      }
      
      return decision;
    };

    /**
     * HTML injection utility.
     * This function will analyse code if there are any script objects and call 
     * calback when everything is loaded.
     * @param {Element} location DOM Element where to append
     * @param {Boolean} append Appent or insert before (false).
     * @param {String} html HTML to be appended
     * @param {Function} callback Callback to be called when ready.
     */
    TagsUtils.injectHTML = function (location, append, html, callback) {
//      if (!TagsUtils.bodyLoaded()) {
//        document.write(html);
//        callback();
//        return;
//      }
      //@TODO: this is old code, and buggy, refactor it.
      return HtmlInjector.inject(
              location,
              (!append) ? 1 : 0,
              html,
              callback || EMPTY_FUN);
    };
    
    /**
     * Resolves injection location for a tag.
     * 
     * @param {qubit.opentag.BaseTag} tag Tag reference
     * @returns {Element} document Element location for a tag.
     */
    TagsUtils.getHTMLLocationForTag = function (tag) {
      var el;
      var name = tag.prepareLocationObject(tag.config.locationObject);
      switch (name) {
        case "HEAD":
           el = document.getElementsByTagName("head")[0];
           break;
         case "BODY":
           el = document.body;
           break;
         default:
          if (name) {
            el = document.getElementById(name);
          } else {
            el = document.body;
          }
      }
      
      return el;
    };
    
})();


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
  function BaseVariable (config) {
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
  
  Utils.clazz("qubit.opentag.pagevariable.BaseVariable", BaseVariable);
  
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
    if (useDefaults && !Utils.variableExists(pageValue)) {
      pageValue = this.getDefaultValue();
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
          function(token, string, altValue, useExpressionAccessor) {
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
   * #Exression type variable class.
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
    Expression.superclass.apply(this, arguments);
  }
  
  Utils.clazz(
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
    		this.log.FINEST(this.failMessage);
    	}
      this.log.FINEST("getting value from expression: " + ret);
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
      pathOfElements = pathOfElements.replace(".","");
    }
    
    for(var i = 0; i < array.length; i++) {
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
          function(token, string, altValue, exp) {
    if ((this.getValue() instanceof Array)) {
      exp = true;
    }
    //UV case! this is a hack abit - copied logic from origins
    return Expression.superclass.prototype
       .replaceToken.call(this, token, string, altValue, exp);
  };
  
}());



/*
 * TagSDK, a tag development platform
 * Copyright 2013-2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  var Utils = qubit.opentag.Utils;
  
  /**
   * #DOM text content variable class.
   * 
   * 
   * @class qubit.opentag.pagevariable.DOMText
   * @extends qubit.opentag.pagevariable.BaseVariable
   * @param config {Object} config object used to build instance
   */
  function DOMText(config) {
    DOMText.superclass.apply(this, arguments);
  }
  
  Utils.clazz(
          "qubit.opentag.pagevariable.DOMText",
          DOMText,
          qubit.opentag.pagevariable.BaseVariable);
  /**
   * Get the element text value with specified ID (innerText like).
   * @returns {String} returns DOM string text value (not inner html)
   */
  DOMText.prototype.getValue = function () {
    this.log.FINEST("reading DOM element contents value");
    return Utils.getElementValue(this.value);
  };
  
}());





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
  
  Utils.clazz(
          "qubit.opentag.pagevariable.Cookie",
          Cookie,
          qubit.opentag.pagevariable.BaseVariable);
  
  /**
   * Returns value for the variable object - here it returns
   * cookie by using string defined at `this.value` object.
   * @returns {String} cookie value
   */
  Cookie.prototype.getValue = function () {
    var val = qubit.Cookie.get(this.value, true);
    Timed.maxFrequent(function () {
      this.log.FINEST("reading cookie value: " + val);
    }.bind(this), 2000, this._lockObject);
    return val;
  };
  
}());



/*
 * TagSDK, a tag development platform
 * Copyright 2013-2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  var Utils = qubit.opentag.Utils;
  
  /**
   * #URL query variable class.
   * 
   * This class controls variable value by resolving the value to
   * URL parameters values.
   * 
   * 
   * @class qubit.opentag.pagevariable.URLQuery
   * @extends qubit.opentag.pagevariable.BaseVariable
   * @param config {Object} config object used to build instance
   */
  function URLQuery(config) {
    URLQuery.superclass.apply(this, arguments);
  }
  
  Utils.clazz(
    "qubit.opentag.pagevariable.URLQuery",
    URLQuery,
    qubit.opentag.pagevariable.BaseVariable);
  
  /**
   * It returns URL parameter value for parameter named as `this.value`.
   * @returns {String}
   */
  URLQuery.prototype.getValue = function () {
    return Utils.getQueryParam(this.value);
  };
}());
/*
 * TagSDK, a tag development platform
 * Copyright 2013-2014, Qubit Group
 * http://opentag.qubitproducts.com
 * @author Piotr (Peter) Fronc <peter.fronc@qubitproducts.com>
 */










(function () {
  var Utils = qubit.opentag.Utils;
  var TagsUtils = qubit.opentag.TagsUtils;
  var Timed = qubit.opentag.Timed;
  var BaseVariable = qubit.opentag.pagevariable.BaseVariable;
  var Expression = qubit.opentag.pagevariable.Expression;
  var DOMText = qubit.opentag.pagevariable.DOMText;
  var Cookie = qubit.opentag.pagevariable.Cookie;
  var URLQuery = qubit.opentag.pagevariable.URLQuery;

  //var log = new qubit.opentag.Log("TagHelper -> ");

  /**
   * @class qubit.opentag.TagHelper
   * #Helper class for BaseTag and GenericLoader
   * This is not an utility class but supporting class for 
   * BaseTag/GenericLoader classes.
   * This class implements some of compatibility and utility methods 
   * specific for tag execution and management.
   * 
   */
  function TagHelper () {};

  Utils.clazz("qubit.opentag.TagHelper", TagHelper);

  /**
   * Injects HTML fragments for a tag.
   * This function is not error safe.
   * @param {qubit.opentag.BaseTag} tag
   * @param {Function} callback
   * @param {Boolean} tryWrite
   * @param {String} altHtml
   */
  TagHelper.injectHTMLForLoader = 
          function(tag, callback, tryWrite, altHtml) {
    var config = tag.config;
    var html = (altHtml !== undefined) ? altHtml : config.html;

    if (html) {
      var append = (config.locationPlaceHolder === "END");
      var location = TagsUtils.getHTMLLocationForTag(tag);

      tag.log.FINE("injecting html into page:");
      tag.log.FINE(html);
      tag.injectHTMLNotFinished = true;
      
      try {
        if (location) {
          TagsUtils.injectHTML(location, append, html, function() {
            tag.log.FINE("finished html injection.");
            tag.injectHTMLNotFinished = false;
            if (callback) {
              try {
                callback();
              } catch (e) {
                tag.log.ERROR("error while trying to run callback after" +
                        " html injection: " + e);//L
              }
            }
          }.bind(tag));
        } else if (tryWrite && document.readyState === "loading") {
            document.write(html);
            tag.injectHTMLNotFinished = false;
        } else {
          tag.injectHTMLFailed = new Date().valueOf();
          tag.log.ERROR("location was not found or/and html is " + 
                  "told to not to write at runtime or" + //L
                  " document is already loaded. Please check tag's " +//L
                  "configuration. Injection cancelled.");//L
        }
      } catch (ex) {
        tag.injectHTMLNotFinished = false;
        //@TODO do we fail tags when exceptions are thrown?
        tag.injectHTMLFailed = new Date().valueOf();
        tag.log.ERROR("error while trying to inject html: " + ex);
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
      if (params)
        for (var i = 0; i < params.length; i++) {
          if (params[i].variable === varRef) {
            ret.push(params[i]);
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
  TagHelper.getAllVariablesWithParameters = function(tag) {
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
  TagHelper.allParameterVariablesReadyForTag = function(tag, tryDefaults) {
    var useDefaults = tryDefaults;
    var log = tag.log;
    var allReady = true;
    var vars = tag.getPageVariables();

    for (var i = 0; i < vars.length; i++) {
      var pageVar = vars[i];
      
      try {
        var parameters = findParamatersForVariable(tag, pageVar);
        var exist = pageVar.exists();
        if (!exist && useDefaults) {
          if (parameters.length > 0) {
            exist = Utils.variableExists(parameters[0].defaultValue);
          }
          exist = exist || pageVar.exists(true);
        }

        /*log*/
        var name = pageVar.config.name ? pageVar.config.name : "[unnamed]";

        Timed.maxFrequent(function() {
          log.FINEST("Variable '" + name + "' exists? " + exist);
        }, 5000, _lock_obj);
        /*~log*/
        
        if (!exist) {
          allReady = false;
          break;
        }
      } catch (ex) {
        /*log*/
        Timed.maxFrequent(function() {
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

    Timed.maxFrequent(function() {
      log.FINEST("Checking page variables, variables are ready: " + allReady);
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
  TagHelper.validateAndGetVariableForParameter = function(param) {
    if (param.hasOwnProperty("variable")) {
      if (param.variable) {
        return param.variable = TagHelper.initPageVariable(param.variable);
      }
    }
    
    if (param.uv) {//empty strings are also excluded
      return param.variable = new Expression({
        name: param.uv,
        value: param.uv
      });
    }
    //got here? well: not set! initialize.
    return param.variable = TagHelper.initPageVariable({
      value: undefined,
      empty: true
    });
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
   * @returns {qubit.opentag.pagevariable.BaseVariable}
   */
  TagHelper.initPageVariable = function (cfg) {
    if (!cfg || cfg instanceof BaseVariable) {
      return cfg;
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







/*
 * TagSDK, a tag development platform
 * Copyright 2013-2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  var Utils = qubit.opentag.Utils;
  var TagsUtils = qubit.opentag.TagsUtils;
  var Timed = qubit.opentag.Timed;
  var TagHelper = qubit.opentag.TagHelper;
  var nameCounter = 0;
  var Log = qubit.opentag.Log;

  /*
   * @TODO - extract lower generic class for a script loader so it is better 
   * separated by logic.
   * For now this is base tag only and its good.
   */

  /**
   * @class qubit.opentag.GenericLoader
   * 
   * #Heart and Brains of all Tags
   * 
   * GenericLoader class is a generic javascript and html wrapper.
   * It's purpose is to be a most universal and generic object for loading, 
   * injecting and executing objects such as scripts, linked scripts or html 
   * fragments.
   * BaseTag extends and uses this class extensively in order of managing
   * tag's dependencies, injecting code, loading links and almost any posssible
   * javascript content manipulation.
   * 
   * GenericLoader provides very rich API for controlling flow and execution of 
   * javascriptand HTML - please look at the API documentation.
   * 
   * GenericLoader does not implement any Tag specific logic - such 
   * implementation takes place in BaseTag class or its extending objects.
   * 
   * Typical usage cases:
   *  
   *  - Loading URL based script and executing code after its successfully 
   *  loaded
   *  
   *  - Setting up html fragments in conjunction with script URL links to 
   *  execute code.
   *  
   *  - defining code that relays on some generic dependencies collected and
   *  defined in the configuration file.
   * 
   * This class also implements detailed state management and logging 
   * information. GenericLoader can be directly browsed in a console to check
   *  its state for properties.
   * 
   * #Logger
   * 
   * Each GenericLoader instance has by default a logger instance enabled.
   * Logging information can be browsed and re-printed at any time in the 
   * console. To re-print logging information simply call:
   * 
         this.log.rePrint(<log level>);
  
   * `this` refers to the loader instance. `<log level>` is a one of 
   * `qubit.qopentag.Log.LEVEL_*` properties.
   * 
   * #Example
   * 
   * Example of a loader that will load the jQuery link and run hello 
   * world code:
   
        var loader = new qubit.opentag.GenericLoader({
          url: [
              "http://code.jquery.com/jquery.js",
              "http://underscorejs.org/underscore-min.js"
          ],
          html: "<img src='http://www.qubitproducts.com/sites/all/themes/qubit/img/logo.png'>"
          // this image will be inserted after scripts are fetched
        });
        
        //this script will be executed after script links will be loaded and
        //the html will be injected
        loader.script = function () {
          alert("Hello World!");
        };
        
        loader.run();

   * Notice that url is an array. It can be a string only and will be 
   * interpreted as a single url.
   * Try this example by copying it and pasting in the page running TagSDK.
   * GenericLoader does not implement any of filter logic, it has no `pre` 
   * or `post` handlers that is present in LibraryTag or CustomTag objects.
   * This class handles only generic javascript and html specific processing
   * for code loading and html.
   *  
   * 
   * @param {Object} config Please see properties for configuration options.
   *  Each property can be set at initialization time via config object.
   */
  function GenericLoader(config) {
    /*log*/
    this.log = new Log("", function () {
      return this.CLASS_NAME + "[" + this.config.name + "]";
    }.bind(this), "collectLogs");
    
    /*~log*/
    this.urlsLoaded = 0;
    this.urlsFailed = 0;
    
    this.config = {
      /**
       * Name of the tag. Note that Tag's name must be unique in container.
       * Default value will be always set if not passed in:
       * "Tag-" + nameCounter++
       * Always remember to use name for your Tags.
       * @cfg name
       * @type {String}
       */
      name: "Tag-" + nameCounter++,
      /**
       * Should this loader be asynchronous?
       * If this property is set to true, loader will load any content in 
       * asynchronous mode.
       * @cfg {Boolean} [async=false]
       */
      async: true,
      /**
       * Property tells if this script's contents may use document.write 
       * method. Scripts with such a methods, if run with this property will be
       * prepared for situation when document is already loaded. Such a scripts
       * will have the document.write methods proxied and delegated its 
       * arguments (html strings) to be appended after loading document.
       * @cfg {Boolean} [usesDocumentWrite=false]
       */
      usesDocumentWrite: false,
      /**
       * Each script have a default timeout value, in this case it is 5000ms.
       * If during that time dependencies such as (script links, html,
       * generic dependencies) will not be satisfied - script will stop 
       * loading and set fail state.
       * @cfg {Number} [timeout=5000]
       */
      timeout: this.LOADING_TIMEOUT,
      /**
       * Dependencies array is an object that can contain references to other
       * GenericLoader instances, loader will not fire the script untill all
       * dependencies are **loaded and executed**.
       * @cfg dependencies
       * @type Array array of qubit.opentag.GenericLoader
       */
      dependencies: [],
      /**
       * Optional url string value or array of strings defining dependant
       * script urls to be loaded.
       * This is one of script's dependencies to be satisfied.
       * @cfg url
       * @type Array array of URL strings or just a url string
       */
      url: null,
      /**
       * Optional, specify if script must be appended at specific location.
       * See `url` property.
       * @cfg urlLocation
       * @type Element DOM element where script will be injected.
       */
      urlLocation: null,
      /**
       * HTML location placeholder. It defaults to "end" string and indicates
       * that HTML injection operation will be "appendTo" the defined location
       * object (see `locationObect`). If there is different property assigned
       * HTML fragment will be "inserted before".
       * @cfg {String} [locationPlaceHolder="END"]
       */
      locationPlaceHolder: "END",
      /**
       * Location object name. It defaults to "BODY". It can have 
       * following values:
       * 
       * - "BODY" indication HTML will be injected to the document.body
       * 
       * - "HEAD" indicating HTML will be injected to HEAD element
       * 
       * - unset property will default to document.body
       * 
       * - Any other string value will resolve to 
       *  `document.getelementsById(string)`
       *  
       * Way the HTML passed with `html` config property is injected is 
       * controlled by `locationPlaceHolder` property.
       * This property applies when html property is set.
       * @cfg {String} [locationObject=null]
       */
      locationObject: null,
      /**
       * Option will cause this script to inject location be immediately marked
       * as ready.
       */
      dontWaitForBody: false,
      /**
       * By default we do care for not loading scripts with same href value.
       * Set this property to false in order to load script any time its 
       * defined in any Tag's config.url object.
       * @cfg {Boolean} [noMultipleLoad=false]
       */
      noMultipleLoad: false,
      /**
       * Property telling if load process should trigger dependencies loading
       * automatically.
       * Default is that none of dependencies are auto-loaded.
       * For external scripts properties please use external tools
       * or build system.
       * @cfg {Boolean} [loadDependenciesOnLoad=false]
       */
      loadDependenciesOnLoad: false
  };
    
    /**
     * If checked and usesDocumentWrite is true, tag will be instructed to 
     * delay execution till body is available.
     * @property {Boolean} [delayDocWrite=false]
     */
    this.delayDocWrite = false;
    
    /**
     * Dependencies of this tag. Other tag INSTANCES (if any!).
     * @property {Array} dependencies Array of qubit.opentag.GenericLoader 
     * instances.
     */
    this.dependencies = [];
    
    /**
     * Lock object used for frequent logging limitation purposes. 
     * It is as persistent as tmp files. Strictly private.
     * @private
     * @property {Object}
     */
    this._lockObject = {
      count: 0
    };
    /**
     * @private
     * This is prive property used for limiting frequent logging.
     * @property {Object} 
     */
    this._lockObjectDepsLoaded = {};
    
    /**
     * This is a very usefull property.
     * It must contain functions only.
     * If this property contains functions - loader will hold loading untill 
     * all functions return `true`.
     * @property {Array} Array of functions.
     */
    this.genericDependencies = this.genericDependencies || [];
    
    if (config) {
      this.log.FINE("instance...");
      if (!config.name) {
        var n = "Tag-" + nameCounter++;
        this.config.name = n;
        this.log.WARN("Name was not specified for tag. Assigning auto: " + n);
      }
      
      this.addState("INITIAL");
      
      for (var prop in config) {
        this.config[prop] = config[prop];
      }
      
      if (config.genericDependencies) {
        this.genericDependencies = 
          this.genericDependencies.concat(config.genericDependencies);
      }
      
      if (config.dependencies) {
        this.dependencies = config.dependencies.concat(this.dependencies);
      }
      
      if (config.PACKAGE) {
        this._package = config.PACKAGE;
      }
      
      this.onInit();
    }
  }
  
  Utils.clazz("qubit.opentag.GenericLoader", GenericLoader);
  
  /**
   * @event Empty on init event.
   * Run at the end of constructors body.
   */
  GenericLoader.prototype.onInit = EMPTY_FUN;
  
  /**
   *  Default timeout for script to load. This value indicates longest time
   *  that running process will wait for dependencies related to execution.
   *  If the value is `-1` timeout is infinite.
   * @property {Number} LOADING_TIMEOUT
   */
  GenericLoader.prototype.LOADING_TIMEOUT = 5 * 1000;
  
  /**
   * Private method delegating script execution.
   * When running process executes _scriptExecute, in order:
   * 
   * - All dependencies have been met
   * - onBefore event has been fired
   * - Script URL has been loaded
   * - HTML has been injected
   * 
   * This is a direct method used to execute `script` function on the loader.
   * It does check if config containe `script` property and will replace current
   * `this.script` function with passed configuration. If the `config.script` 
   * is a string, it will be used to construct function to be run (not eval 
   * will be run), the functi0on is always executed with tag scope applied.
   * This function is not intended to be use outside class and therefore is
   * strictly private.
   * @private
   */
  GenericLoader.prototype._executeScript = function () {
    if (this.config && this.config.script) {
      if (typeof (this.config.script) === "function") {
        this.script = this.config.script;
      } else {
        var expr = this.replaceTokensWithValues(String(this.config.script));
        this.script = Utils.expressionToFunction(expr).bind(this);
      }
    }
    
    this.log.INFO("executing main script...");
    var success = false;
    
    try {
      this.script();
      success = true;
      this.log.INFO("executed without errors.");
    } catch (ex) {
      this.addState("EXECUTED_WITH_ERRORS");
      this.log.ERROR("Error while executing: " + ex);
      this.log.ERROR("There was an error while executing instance of tag: "
              + this.CLASS_NAME + " from package: " + this.PACKAGE_NAME);//L
      this.log.ERROR(ex, true);
      this._onError(ex);
    } finally {
      this.onExecute(success);
    }
  };
  
  /**
   * Return this loader's timeout value.
   * @returns {Number} timeout including dependencies layer maximum 
   *        of timeouts
   */
  GenericLoader.prototype.getTimeout = function () {
    return this._getTimeout();
  };
  
  /**
   * Strictly private timeout worker. Do not use.
   * @private
   */
  GenericLoader.prototype._getTimeout = function (chain) {
    var tout = +this.config.timeout;
    if (tout !== -1 && this.dependencies.length > 0) {
      var max = 0;
      chain = chain || [];
      var deps = this.dependencies;
      var present = (Utils.indexInArray(chain, this) !== -1);
      if (!present) {
        chain[chain.length] = this;
        for (var i = 0; i < deps.length; i++) {
          var val = deps[i]._getTimeout(chain);
          if (val > max) {
            max = val;
          }
        }
        if (max > 0) {
          tout += max;
        }
      } else {
        return 0;
      }
    }
    return tout;
  };
  
  /**
   * @event
   * onExecute event - will be triggered only if main execution occurs.
   * @param {Boolean} success if execution was without errors
   */
  GenericLoader.prototype.onExecute = EMPTY_FUN;
  
  /**
   * @private
   * Private function used to flush array of `document.write` operations.
   * See `config.usesDocumentWrite` property for more details.
   * @param {Function} cb callback
   * @returns {Boolean}
   */
  GenericLoader.prototype._flushDocWrites = function (cb) {
    // check if any stack from secured doc.write left before calling main
    // function
    var ret = true;
    this._docWriteNotFlushed = false;
    try {
      var loc = TagsUtils.getHTMLLocationForTag(this);
      if (loc && this._securedWrites && this._securedWrites.length > 0) {
        this.log.FINE("flushing document.write proxy array");
        this.log.FINE("flushing: "+ this._securedWrites.join("\n"));
        var append = (this.config.locationPlaceHolder === "END");
        ret = TagsUtils.flushDocWritesArray(
            this._securedWrites,
            loc,
            append,
            this.log,
            cb);
        if (ret) {
          this._docWriteFlushed = new Date().valueOf();
        } else {
          this._docWriteNotFlushed = new Date().valueOf();
        }
      }
    } catch (ex) {
      this.log.ERROR("Unexpected exception during flushing! " + ex);
      this._onError(ex);
    }
    
    if (cb) {
      cb();
    }
    
    if (this._securedWrites && this._securedWrites.length > 0) {
      ret = false;
      this._docWriteNotFlushed = new Date().valueOf();
    }
    
    return ret;
  };
  
  /**
   * Object logger.
   * This a logger instance, created for each loader.
   * Each logger instance maintains it's own history. To check more on logging
   * API polease refer to [logger docs](#!/api/qubit.opentag.Log)
   */
  GenericLoader.prototype.log = EMPTY_FUN;
  
  /**
   * Function will return true and only true when is not loading and finished
   * its duty (it does not indicate if job was sucessful and main script was
   * executed see `this.scriptExecuted` property if you need to check if
   * script was succesfuly run).
   * @return {Boolean} 
   */
  GenericLoader.prototype.finished = function () {
    return !!this.runIsFinished;
  };
  
  /**
   * Executing function as a tag exit point. If all parameters exist and all
   * fileters are passed this function will be called in order to execute
   * the tag. See also see `before` and `after` functions
   */
  GenericLoader.prototype.script = function () {
    this.log.INFO("Script run.");
  };
  
  /**
   * Callback triggered always before loading tag.
   * Can be called only once, any repeated calls will have no effect.
   * This method will be run only after reset.
   */
  GenericLoader.prototype.before = function () {
    this.log.FINE("running before handler...");
    this.beforeRun = new Date().valueOf();
    try{ 
      this.onBefore();
    } catch (ex) {
      this.log.ERROR("onBefore error: " + ex);
      this._onError(ex);
    }
  };
  
  /**
   * This event fires before entering execution scope.
   * Execution scope includes:
   * 
   * - Loading script URLs (`url` property)
   * 
   * - Injecting HTML
   * 
   * - running `script` function
   * @event onBefore before event.
   */
  GenericLoader.prototype.onBefore = EMPTY_FUN;

  /**
   * Callback triggered always after loading - if succesful.
   * Can be called only once, any repeated calls will have no effect.
   * @param success {Boolean} If the script executed without errors
   */
  GenericLoader.prototype.after = function (success) {
    this.log.FINE("running after handler...");
    this.afterRun =  new Date().valueOf();
    try{ 
      this.onAfter(success);
    } catch (ex) {
      this.log.ERROR("onAfter error: " + ex);
      this._onError(ex);
    }
  };
  
  /**
   * This event fires after script execution, either it was successful or not.
   * Parameter pased is true if execution was successful.
   * @event onAfter after event.
   * @param success {Boolean} If the script executed without errors
   */
  GenericLoader.prototype.onAfter = function (success) {};
  
  /**
   * By using this function one can be sure that script will be executed only
   * once until script is reset.
   * Use this function if you must be ensured that execution occurs only once.
   * @param {Boolean} ignoreDeps if ignore dependencies and run immediately. 
   */
  GenericLoader.prototype.runOnce = function (ignoreDeps) {
    if (!this._runOnceTriggered && !this.scriptExecuted) {
      this._runOnceTriggered = new Date().valueOf();
      this.run(ignoreDeps);
    } else {
      this.log.FINEST("runOnce has been already executed.");
    }
  };
  
  /**
   * This properety will cause ALL loaders/tags/libraries to cancel running on
   * `run()` time. It is convinient property to controll that any tag will not
   * be run after setting to `true`.
   */
  GenericLoader.CANCELL_ALL = false;
  
  /**
   * It tells how many times loader was run.
   * This property is not reset with `reset()` function.
   */
  GenericLoader.prototype.runCounter = 0;
  /**
   * Running process trigger. Tags can often contain resources that have
   * to be fetched and this function initialises such processes where it is 
   * necessary. This function can be called only once, after that, each call
   * will be ignored.
   * If there is no dependencies to load, script will be invoked immediately.
   * This method has no effect is tag is in running state (is currently loading).
   * @param {Boolean} ignoreDependencies if true, loader will not wait 
   * for dependencies to load
   * @returns {Boolean} false if tag is currently loading, true otherwise.
   */
  GenericLoader.prototype.run = function (ignoreDependencies) {
    if (this.cancelled || GenericLoader.CANCELL_ALL) {
      this._handleCancel();
      return false;
    }
    
    if (this.isRunning) {
      this.log.FINE("loader is currently in progress, try again later.");
      return false;
    }
    
    if (this.lastRun) {
      this.log.FINE("Running again. Run count: " + (this.runCounter + 1));
      this.reset();
    }
    
    this.lastRun = this.isRunning = new Date().valueOf();
    this.runCounter++;
    
    //make sure its loaded before execution
    this.load(ignoreDependencies);
    
    if (ignoreDependencies) {
      this.execute();
    } else {
      this.waitForDependenciesAndExecute();
    }
    return true;
  };

  GenericLoader.prototype._setTimeout = function (fun, time) {
    this._wasTimed = new Date().valueOf();
    return Timed.setTimeout(fun, time);
  };

  /**
   * @private
   * Handling cancellation help[er. Strictly private.
   */
  GenericLoader.prototype._handleCancel = function () {
    this.addState("CANCELLED");
    this.log.INFO("loader is cancelled.");
    try {
      this.onCancel();
    } catch (ex) {
      this.log.ERROR("Exception at onCancel" + ex);
      this._onError(ex);
    }
  };

  /**
   * @protected
   * Function will execute immmediatelly if dependencies are satisfied,
   *  will wait in timeout manner otherwise till fail or load state is gained.
   * This is a protected method and should be used in API development process.
   * This method controlls awaiting for dependencies cycle and runs the 
   * execution block.
   */
  GenericLoader.prototype.waitForDependenciesAndExecute = function () {
    if (this.cancelled) {
      this._handleCancel();
      return;
    }
    if (this.loadedDependencies) {
      //dependencies ready
      this.execute();      
    } else if (this.loadingDependenciesFailed) {
      this.log.INFO("script execution failed before running: " +
        "dependencies failed to load."); //L
      this._markFailure();
      this._markFinished();
    } else {
      this._setTimeout(this.waitForDependenciesAndExecute.bind(this), 30);
    }
  };
  
  /**
   * @protected
   * Executes the tag's execution block, it does not check on dependencies.
   * It is final execution stage entry.
   * Typically you should use `run` function to execute this class.
   * `execute` method will not check if dependencies are loaded, but will t
   * rigger execution block directly:
   * 
   * - URLs loading
   * 
   * - HTML injection
   * 
   * - `script` execution
   * 
   * This function differs from `run(true)` with that it will not check on
   * currently loading process or anything else. It triggers directly execution
   * block.
   */
  GenericLoader.prototype.execute = function () {
    this.log.FINE("entering execute...");
    this._triggerExecution();
  };
  
  /**
   * Private helper function for `this.execute`, because some of execution
   * (scripts, html elemnts awaiting) can be delayed, this function will
   * help waiting for those delayed execution parts to run.
   * This method protects from multiple running 
   * @private
   */
  GenericLoader.prototype._triggerExecution = function () {
    if (this.cancelled) {
      this._handleCancel();
      return;
    }
    
    if (this.scriptExecuted) {
      return; //execution can be called only if script execution state is unset
    }
    
    var finished = true;
    
    if(this.shouldWaitForDocWriteProtection()) {
      finished = false;
    } else {
      if (!this._beforeEntered) {
        this._beforeEntered = new Date().valueOf();
        var cancel = false;

        try {
            cancel = this.before();
        } catch (ex) {
          //decision changed: failured before callback must stop execution.
          this.log.ERROR("`before` thrown an exception");
          this.log.ERROR(ex, true);
          this._onError(ex);
        }

        if (cancel) {
          this.log.INFO("before calback cancelled execution.");
          this._markFailure();
          this._markFinished();
          return;
        }
      }
      finished = 
              this.loadExecutionURLsAndHTML(this._triggerExecution.bind(this));
    }
    
    if (this.scriptExecuted) {
      return; //execution could be called already! by last url sync load!
    }
    
    if (this.unexpectedFail) {//wait for deps
      finished = true; //override, done, error
    }
    
    if (!finished) {
      this._setTimeout(this._triggerExecution.bind(this), 30);
    } else {
      this._flushDocWrites();
      //now check if failures occured
      if (this.scriptLoadingFailed ||
          this.injectHTMLFailed ||
          this.unexpectedFail) {
        this._markFailure();
      } else {
        //no failures, run!
        this.log.FINE("Executing...");
        this.scriptExecuted = new Date().valueOf();
        this.addState("EXECUTED");
        this._executeScript();
      }
      if (this.cancelled) {
        this._handleCancel();
        return false;
      } else if (!this.afterRun) {
        this.afterRun =  new Date().valueOf();
        this.after(this.scriptExecuted > 0);
      }
      this._flushDocWrites();
      this._markFinished();
      this.log.INFO("* stopped [" +
              ((this.scriptExecuted > 0) ? "executed" : "not executed") +//L
              "] *");//L
    }
  };
  
  GenericLoader.prototype._markFailure = function () {
    this.log.INFO("Script execution failed.");
    this.scriptExecuted = -(new Date().valueOf());
    this.addState("FAILED_TO_EXECUTE");
  };
  
  /**
   * Private marking helper for loader, its is used to mark loaders job
   * as finished, no matter if job was successful or not.
   * @private
   */
  GenericLoader.prototype._markFinished = function () {
    this.runIsFinished = new Date().valueOf();
    this.isRunning = false;
    //unlock possibly locked doc write
    if (GenericLoader.LOCK_DOC_WRITE === this) {
      this._flushDocWrites();
      TagsUtils.unlockDocumentWrites();
      GenericLoader.LOCK_DOC_WRITE = false;
    }
    this.onFinished(true);
  };
  
  /**
   * @event
   * Triggered when loader stopps precessing. It does not indicate if running
   * was sucessful but that running proces has ended.
   */
  GenericLoader.prototype.onFinished = EMPTY_FUN;
  
  /**
   * @event
   * Triggered if tag is loading and cancelled method is triggered.
   */
  GenericLoader.prototype.onFinished = EMPTY_FUN;
  
  /**
   * This function queries tag if document write execution should be
   * secured. Dependeing on config and tag's state it will return true or false.
   * @returns {Boolean}
   */
  GenericLoader.prototype.shouldWaitForDocWriteProtection = function () {
    if (this.willSecureDocumentWrite()) {
      //we can use more generic check
      if (!GenericLoader.LOCK_DOC_WRITE) {
        //obtain lock, so no other tag can proceed
        GenericLoader.LOCK_DOC_WRITE = this;
        this._secureWriteAndCollectForExecution();
      } else if (GenericLoader.LOCK_DOC_WRITE !== this) {
        if (!this._lockedDocWriteInformed) {
          this._lockedDocWriteInformed = new Date().valueOf();
          this.log.WARN("Tag will wait till document.write be available.");
          this.log.FINE(GenericLoader.LOCK_DOC_WRITE, true);
        }
        //only case: LOCK_DOC_WRITE lock obtained not by myself - wait then
        return true;
      }
    }
    return false;
  };
  
  /**
   * This function will run loader without waiting for it's dependences.
   * It will behave exactly as `this.run(true)`
   */
  GenericLoader.prototype.runWithoutDependencies = function () {
    this.run(true);
  };
  
  /**
   * @protected
   * Function responsible for (in order) loading all script url's and injecting
   * HTML fragments.
   * @param {Function} callback to be run when finished
   * @returns {Boolean}
   */
  GenericLoader.prototype.loadExecutionURLsAndHTML = function (callback) {
    if (this.cancelled) {
      this._handleCancel();
      return true;
    }
    //if dependencies are okay, execute entire execution logic:
    // 1) load URLs
    // 2) after 1) inject HTML (can have some async stuff)
    // 3) 1& -> 2 finished : execute main script
    
    if (!this._loadExecutionURLsAndHTMLInformed) {
      //show this message once
      this._loadExecutionURLsAndHTMLInformed = true;
      this.log.INFO("tag is loaded, trying execution...");
    }

    //check if url/urls are specified, delay if any
    this._triggerURLsLoading(callback);
    ///this._flushDocWrites();
    
    //check if 1) is finished.
    if (!this.loadURLsNotFinished) {
      this._flushDocWrites();
      //once URL(s) are loaded/finished, try html injection
      //check if html injection is done, and start it if not started
      this._triggerHTMLInjection();
      this._flushDocWrites();
      //if URL is finished, and after that HTML injection is done...
      if (!this.injectHTMLNotFinished) {
        this._flushDocWrites();
        //check if 1) & 2) is finished.
        this.log.INFO("url and html awaiting has ended...");
        if (!this._docWriteNotFlushed) {
          if (this._docWriteFlushed) {
            this.log.INFO("flushed document.write...");
          }
          return true;
        }
      }
    }

    return false;
  };
  
  /**
   * @private
   * Function will trigger URL loading, it can be called effectively only once.
   * It means that after one call, it will have no effect.
   * @param {Function} callback
   */
  GenericLoader.prototype._triggerURLsLoading = function (callback) {
    if (!this._urlLoadTriggered && this.config.url) {
      this._urlLoadTriggered = true;
      this.log.INFO("tag has url option set to: " + this.config.url);//L
      this.log.INFO("loading url and delaying execution till link is loaded");
      this.loadURLs(false, callback);
    }
  };
  
  /**
   * @private
   * Function will trigger HTML inject, it can be called effectively only once.
   * It means that after one call, it will have no effect.
   */
  GenericLoader.prototype._triggerHTMLInjection = function () {
    if (!this._injectHTMLTriggered && this.config.html) {
      this._injectHTMLTriggered = true;
      this.log.FINE("tag has html option set to: " + this.config.html);//L
      this.log.INFO("injecting html and delaying execution till is ready");
      this.injectHTML();
    }
  };
  
  /**
   * State properties used as a loader's current state and passed history. 
   * This is quite usefull metric ordered state indicator.
   * 
   * consider this example:
   * 
   * 
   *    this.state > this.STATE.FAILED_TO_LOAD_DEPENDENCIES
   *    
   * It translates to script being fully loaded with dependenciess and passed 
   * filters, but unfortune to have url script loading problems or final script 
   * execution itself.
   * 
   * This is very useful when creating automated debugging tools.
   * 
   * Full defnition:
   * 
          GenericLoader.prototype.STATE = {
            INITIAL: 0,
            STARTED: 1,
            LOADING_DEPENDENCIES: 2,
            LOADED_DEPENDENCIES: 4,
            LOADING_URL: 8,
            LOADED_URL: 16,
            EXECUTED: 32,
            EXECUTED_WITH_ERRORS: 64,
            FAILED_TO_LOAD_DEPENDENCIES: 128,
            FAILED_TO_LOAD_URL: 256,
            FAILED_TO_EXECUTE: 512,
            TIMED_OUT: 1024,
            UNEXPECTED_FAIL: 2048
          };
  
   * 
   * @property {Object} STATE
   */
  GenericLoader.prototype.STATE = {
    INITIAL: 0,
    STARTED: 1,
    CANCELLED: 1*2,
    LOADING_DEPENDENCIES: 2*2,
    LOADED_DEPENDENCIES: 4*2,
    LOADING_URL: 8*2,
    LOADED_URL: 16*2,
    EXECUTED: 32*2,
    EXECUTED_WITH_ERRORS: 64*2,
    FAILED_TO_LOAD_DEPENDENCIES: 128*2,
    FAILED_TO_LOAD_URL: 256*2,
    FAILED_TO_EXECUTE: 512*2,
    TIMED_OUT: 1024*2,
    UNEXPECTED_FAIL: 2048*2
  };
  
  /**
   * Function used to set state by using state name (a string).
   * This function has no effect if name passed in does not equal to one
   * of `this.STATE` properties.
   * @param {String} stateName
   */
  GenericLoader.prototype.addState = function (stateName) {
    if (this.STATE.hasOwnProperty(stateName)) {
      //this.log.FINEST("Updating state.");
      this.state = (this.state | this.STATE[stateName]);
      try {
        this.onStateChange(stateName);
      } catch (ex) {
        this.log.ERROR(ex);
        this._onError(ex);
      }
    }
  };
  
  /**
   * @event
   * State being set event. Triggered on EACH state change. Useful event 
   * to monitor loader's state.
   * @param {String} state name being set
   */
  GenericLoader.prototype.onStateChange = EMPTY_FUN;
  
  /**
   * Method cancels the loader.
   * @returns {undefined}
   */
  GenericLoader.prototype.cancel = function () {
    this.cancelled = new Date().valueOf();
  };
  
  /**
   * Property representing binary table with this tag's state.
   * `state` property is a number, in binary presentation it represents a set
   * of `1` and `0`, each number field corresponds to one of `2^n` values.
   * Each n-th value corresponds to one of `this.STATE` property (they are
   * numbers of 2^n).
   * @property {Number} state
   */
  GenericLoader.prototype.state = GenericLoader.prototype.STATE.INITIAL;
  
  /**
   * Private loader marker, it basically tells that loading of dependencies
   * was successful. Strictly private.
   * @private
   */
  GenericLoader.prototype._markLoadedSuccesfuly = function () {
    /**
     * @property {Number} loaded Property telling if and when all loading
     * has been finished.
     */
    this.loadedDependencies = new Date().valueOf();
    this.onDependenciesLoaded();
  };
  
  /**
   * Strictly private.
   * This function secures and collect `document.write` operations for later
   * execution.
   * @private
   */
  GenericLoader.prototype._secureWriteAndCollectForExecution = function () {
    if (!this._securedWrites) {
      this._securedWrites = [];
      TagsUtils.redirectDocumentWritesToArray(this._securedWrites, this.log);
    }
  };
  
  /**
   * This is anonymous function that is good to be known if more
   * knowledge on how tag are loaded is necessary.
   * This function is directly used by `this.load()`
   * It is not avaialble on object's instance.
   * Strictly private.
   * @private
   */
  function _waitForDependencies() {
    if (this.cancelled) {
      this._handleCancel();
      return;
    }
    /**
     * It indicates ONLY if _waitForDependencies has finished it's job - NOT
     * if started.
     * @property
     * @type Boolean
     */
    this.waitForDependenciesFinished = new Date().valueOf();
    
    if (this.dependenciesLoaded()) {
      this._markLoadedSuccesfuly();
    } else {
      if (this._loadingOutOfTimeFrames()) {
        this.loadingTimedOut = new Date().valueOf();
        if (this.dependenciesLoaded(true)) {//give last chance for defaults
          this._markLoadedSuccesfuly();
        } else {
          this.log.WARN("timed out while loading dependencies.");
          this.addState("TIMED_OUT");
          this.loadingDependenciesFailed = new Date().valueOf();
          this._triggerOnLoadTimeout();
        }
      } else {
        //wait for dependencies, no matter what.
        //@TODO let it be done by a nicer tool... single timeout processor
        this.waitForDependenciesFinished = false;
        this._setTimeout(_waitForDependencies.bind(this), 75);
      }
    }
    if (!this.waitForDependenciesFinished) {
      /*log*/ //make some nice counter logs count down...
      var diff = (new Date().valueOf() - this.loadStarted);
      var freq = 4000;
      var curr = diff / this.getTimeout();
      var steps = Math.ceil(this.getTimeout() / freq);
      
      this._lockObject.curr = curr;
      
      Timed.maxFrequent(function () {
        this.log.FINE("Waiting for dependencies, counting... "
                + this._lockObject.count++ + " (" + steps + ")");//L
      }.bind(this), freq, this._lockObject);
      /*~log*/
    } else {
      this.addState("LOADED_DEPENDENCIES");
    }
  };
  
  /**
   * Checker indicating if all dependencies are satisfied.
   * @param tryDefaults {Boolean} name try also defaults if variables are unset.
   * @param {Array} arrayToAdd optional failures to write array
   * @returns {Boolean}
   */
  GenericLoader.prototype.dependenciesLoaded =
          function (tryDefaults, arrayToAdd) {
    return this.getDependenciesToBeLoaded(tryDefaults, arrayToAdd).length === 0;
  };
  
  /**
   * @protected
   * Function returning array of plain strings containing human friendly names
   * of dependencies that are still to be satisfied upon load.
   * Untill this method return empty array tag will never enter execution block
   * (loading: scripts, html, and execution code).
   * @param tryDefaults {Boolean} indicates if default values should be used.
   * @param arrayToAdd {Array} This method may be used in chain and to pass
   * any of existing dependencies use this array.
   * @returns {Boolean}
   */
  GenericLoader.prototype.getDependenciesToBeLoaded =
          function (tryDefaults, arrayToAdd) {
    var failures = arrayToAdd || [];

    if (!this.injectionLocationReady()) {
      failures.push("html injection location");
    }
    
    for(var i = 0; i < this.dependencies.length; i++) {
      if (this.dependencies[i] !== this) {
        var state = this.dependencies[i].scriptExecuted;
        if (!state || +state <= 0) {
          var name = this.dependencies[i].config ?
            this.dependencies[i].config.name : "anonymous";
          failures.push("dependant Tag with name -> " + name);
        }
      }
    }
    
    for(var i = 0; i < this.genericDependencies.length; i++) {
      var ready = this.genericDependencies[i](this);
      if (!ready) {
        failures.push("this.genericDependencies[" + i + "] (index: " + i + ")");
      }
    }
    
    if (failures !== "") {
      /*log*/
      Timed.maxFrequent(function () {
          var awaitingList = failures.join(", ");
          if (awaitingList) {
            this.log.FINE("Dependencies check: Waiting for: " + awaitingList);
          } else {
            this.log.FINE("Dependencies check: No basic dependencies.");
          }
      }.bind(this), 5000, this._lockObjectDepsLoaded);
      /*~log*/
    }
    
    return failures;
  };

  /**
   * @protected
   * Function indicates if loader must wait till body is loaded - document.write
   * configuration case.
   * @returns {Boolean} 
   */
  GenericLoader.prototype.docWriteAsksToWaitForBody = function () {
    //tag must wait for location if asynchronous, or instructed to protect
    //writes
    return !!(this.config.delayDocWrite && this.config.usesDocumentWrite);
  };
  
  /**
   * This function, unlikely as `injectionLocationReady` checks phisically if
   * loaction for injections is ready.
   * Injection location is necessary for:
   * - html injector
   * - document writes flushing
   * @returns {Boolean}
   */
  GenericLoader.prototype.injectionLocationReady = function () {
    // if this is synchronous script then mark location as any time ready
    // ---> (!this.injectionLocationReady()) <---
    // please note, if location is not present, document.write action will be
    // performed
    
    if (this.docWriteAsksToWaitForBody() && !Utils.bodyReady()) {
      return false;
    }
    
    if (this.config.dontWaitForBody) {
      return true;
    }
    
//    if (!this.config.html && !this.config.waitForBody) {
//      return true;
//    }
//    
    if (!this.isLoadingAsynchronously()) {
      return true;
    }
    
    return !!TagsUtils.getHTMLLocationForTag(this);
  };
  
  /**
   * Method indicating if time between `run()` and current time exceeded
   * allowed time frames for this loader.
   * @returns {Boolean}
   */
  GenericLoader.prototype._loadingOutOfTimeFrames = function () {
    if (this.getTimeout() < 0) {
      return false;
    }
    return (new Date().valueOf() - this.loadStarted) > 
      this.getTimeout();
  };
  
  /**
   * Function used as a worker for processing loaders's other dependant tags.
   * It is a looping trigger to call "load" on dependencies.
   * `this.dependencies` array containes other dependant loaders.
   */
  GenericLoader.prototype.loadDependencies = function () {
    this._loadDependencies();
  };
  
  /**
   * @private
   * Strictly private - `loadDependencies` worker.
   * @param {Array} chain
   */
  GenericLoader.prototype._loadDependencies = function (chain) {
    chain = chain || [];
    var deps = this.dependencies;
    var present = Utils.indexInArray(chain, this) !== -1;
    if (!present) {
      chain[chain.length] = this;
      for (var i = 0; i < deps.length; i++) {
          deps[i].load(chain);
      }
    }
  };
  
  /**
   * @event
   * If there is any loading error, Tag SDK will call this function with the
   * error message as a parameter. Override wherever necessary.
   * It is called each time an `log.ERROR` is called and not only.
   * @param {String} error Error string.
   */
  GenericLoader.prototype.onError = EMPTY_FUN;
  
  /**
   * @private
   * Strictly private.
   * @param {Object} msg
   */
  GenericLoader.prototype._onError = function (msg) {
    try {
      this.onError(msg);
    } catch (ex) {
      
    }
  };
  
  /**
   * Triggers onLoadTimeout event.
   * @protected
   */
  GenericLoader.prototype._triggerOnLoadTimeout = function () {
    this.onLoadTimeout();
  };
  
  /**
   * It is called when tag loading is timed out
   * @event
   */
  GenericLoader.prototype.onLoadTimeout = EMPTY_FUN;
  
  /**
   * @event
   * Run when the script urls is loaded succesfuly (not dependencies.)
   */
  GenericLoader.prototype.onScriptsLoadSuccess = EMPTY_FUN;
  
  /**
   * @event
   * Triggered when script loading error has occured.
   * @param {String} message Error message.
   */
  GenericLoader.prototype.onScriptLoadError = EMPTY_FUN;
  
  /**
   * @event
   * Triggered when loader's dependencies are loaded.
   */
  GenericLoader.prototype.onDependenciesLoaded = EMPTY_FUN;
  
  /**
   * @event onBeforeLoad
   * Will run before `load()`.
   */
  GenericLoader.prototype.onBeforeLoad = EMPTY_FUN;
  
  /**
   * Function used to load this tag itself and its dependencies if 
   * this.config.loadDependenciesOnLoad is set to true.
   * The dependencies are typically other tags, if this option is set to true,
   * this function will try to load other dependenciess - normally tag WAITS
   * for other dependencies to be present (ie. does not load them automatically,
   * that job is mostly managed by containers).
   * 
   * It does not load URL being a part of tag execution process.
   * This function does not trigger any real loading in this base class however
   * bonds logically loading entry point.
   * It will trigger process awaiting for all dependencies to be satisfied.
   * 
   * Can be run only once. `load` function is an entry point for any process 
   * leading to run/execute the tag.
   * @param {Boolean} ignoreDependencies if ignore dependencies
   */
  GenericLoader.prototype.load = function (ignoreDependencies) {
    if (this.loadStarted) {
      return;
    } else {
      this.loadStarted = new Date().valueOf();
      try {
        this.onBeforeLoad();
      } catch (ex) {
        this.log.ERROR("onBeforeLoad error: " + ex);
        this._onError(ex);
      }
    }

    this.addState("LOADING_DEPENDENCIES");
    this.log.INFO("Load started.");
    
    try {
      /**
       * @property {Number} loadStarted Timestamp telling when loading process
       *  has started.
       */
      if (!ignoreDependencies && this.config.loadDependenciesOnLoad) {
        this.loadDependencies();
      }
    } catch (ex) {
      this.log.ERROR("loadDependencies: unexpected exception occured: \n"
              + ex + "\ntrying to finish... ");//L
      throw ex;
    }
    
    _waitForDependencies.call(this);
  };
  
  /**
   * Private helper - handler for single script load.
   * @private
   * @param {Boolean} success
   * @param {Array} urls Array of single String url
   * @param {Function} callback
   */
  GenericLoader.prototype._singleUrlLoadHandler = 
          function (success, urls, callback) {
    ++this.urlsLoaded;

    if (!success) {
      ++this.urlsFailed;
    }

    if (this.urlsLoaded === urls.length) {
      this.loadURLsNotFinished = false;
      if (success && this.urlsFailed === 0) {
        this.log.INFO("succesfully loaded " + this.urlsLoaded + " urls.");
        this.addState("LOADED_URL");
        this.urlsLoaded = new Date().valueOf();
        try {
          if (callback) {
            callback(true);
          }
        } catch (ex) {
          this.log.ERROR("Callback error:" + ex);
          this._onError(ex);
        } finally {
          this.onScriptsLoadSuccess();
        }
      } else {
        var message = "error loading urls. Failed " + this.urlsFailed;
        this.log.ERROR(message);
        this._onError(message);
        this.addState("FAILED_TO_LOAD_URL");
        this.urlsLoaded = -new Date().valueOf();
        try{
          this.scriptLoadingFailed = true;
          if (callback) {
            callback(false);
          }
        } catch (ex) {
          this.log.ERROR("Callback error:" + ex);
          this._onError(ex);
        } finally {
          this.onScriptLoadError(message);
        }
      }
    }
  };
  
  /**
   * Script URLs loader. This method will load all scripts in this tag defined
   * in config object or overriding urlz parameter.
   * Use this method load any URL(s).
   * 
   * @param {Array} urlz String array or single string with url
   * @param {Function} callback
   */
  GenericLoader.prototype.loadURLs = function (urlz, callback) {
    var urls = urlz || this.config.url;    
    
    this.addState("LOADING_URL");
    this.log.FINE("loading URL(s) ...");
    
    try {
      if (urls && !(urls instanceof Array)) {
        urls = [urls];
      }
      
      for (var i = 0; i < urls.length; i++) {
        this.loadURLsNotFinished = true;
        this.log.FINE("loading URL: " + urls[i] + " ...");
        var url = urls[i];
        url = this.prepareURL(url);
        this.loadURL(url, function (success) {
          this._singleUrlLoadHandler(success, urls, callback);
        }.bind(this));
        
      }
    } catch (ex) {
      this.log.ERROR("loadURLs thrown unexpected exception! : " + ex);
      this.loadURLsNotFinished = false;
      this.addState("UNEXPECTED_FAIL");
      this.unexpectedFail = new Date().valueOf();
      this._onError(ex);
    }
  };

  /**
   * Function responsible for preparing location object string.
   * It is genuinly used to prepare html injection location config property.
   * 
   * @param {String} loc
   * @returns {String}
   */
  GenericLoader.prototype.prepareLocationObject = function (loc) {
    return loc;
  };

  /**
   * Function responsible for preparing url strings used to load scripts.
   * @param {String} url
   * @returns {String}
   */
  GenericLoader.prototype.prepareURL = function (url) {
    return url;
  };

  /**
   * Function responsible for preparing html fragments to be injected.
   * @param {String} html
   * @returns {String}
   */
  GenericLoader.prototype.prepareHTML = function (html) {
    return html;
  };
  
  /**
   * Script URL loader. 
   * @param url {String} url, overriding URL to use
   * @param callback {Function} callback optional
   */
  GenericLoader.prototype.loadURL = function (url, callback) {
    var passedUrl = url;
    this.addState("LOADING_URL");
    TagsUtils.loadScript({
      onsuccess: function () {
        this.log.FINE("succesfully loaded " + passedUrl);
        try {
          if (callback) {
            callback(true);
          }
        } catch (ex) {
          this.log.ERROR("error at callback for " + passedUrl + ":" + ex);
        }
      }.bind(this),
      onerror: function () {
        this.log.ERROR("error loading " + passedUrl);
        try{
          if (callback) {
            callback(false);
          }
        } catch (ex) {
          this.log.ERROR("error at callback for error at " +
                  passedUrl + ":" + ex);//L
        }
      }.bind(this),
      url: passedUrl,
      node: this.config.urlLocation || document.body,
      async: this.isLoadingAsynchronously(),
      noMultipleLoad: this.config.noMultipleLoad
    });
  };
  
  /**
   * Reset method. Brings this object to initial state.
   * Reset will keep logging information.
   */
  GenericLoader.prototype.reset = function () {
    this.log.FINE("resetting.");
    var u;
    this._injectHTMLTriggered = u;
    this._loadExecutionURLsAndHTMLInformed = u;
    this._lockedDocWriteInformed = u;
    this._runOnceTriggered = u;
    this._urlLoadTriggered = u;
    this.afterRun = u;
    this.beforeRun = u;
    this.filtersRunTriggered = u;
    this.injectHTMLFailed = u;
    this.loadStarted = u;
    this.loadURLsNotFinished = u;
    this.loadedDependencies = u;
    this.loadingDependenciesFailed = u;
    this.loadingTimedOut = u;
    this.runIsFinished = u;
    this.scriptExecuted = u;
    this.scriptLoadingFailed = u;
    this.delayDocWrite = u;
    this._securedWrites = u;
    this.state = 0;
    this.unexpectedFail = u;
    this.urlsFailed = 0;
    this.urlsLoaded = 0;
    this.waitForDependenciesFinished = u;
    this.isRunning = u;
    this._lastRun = u;
    this.cancelled = u;
    this._beforeEntered = u;
    this.addState("INITIAL");
  };
  
  /**
   * Function to indicate if loader should proceed asynchronously (depending
   * on configuration).
   * @returns {Boolean}
   */
  GenericLoader.prototype.isLoadingAsynchronously = function () {
//    var becauseOfDocWriteOverrideAndMakeItAsync = 
//            (this.config.url && this.config.url.length > 0);
//    return becauseOfDocWriteOverrideAndMakeItAsync ||
//      !!(this.config.async || this.forceAsynchronous);
    //@TODO add more sophisticated async judgement:
    // any URL loading should be triggereing async
    // any html containing scripts with src also shouold cause delay
    // only CHROME has synchronous onload callbvacks, but chrome is not the only
    // browser.
    if (this._wasTimed) {
      //if timer was triggered, script is no longer synchronously loading!
      return true;
    }
    return !!(this.config.async || this.forceAsynchronous);
  };
  
  /**
   * Function indicating if loader shall secure `document.write` operations.
   * @returns {Boolean}
   */
  GenericLoader.prototype.willSecureDocumentWrite = function () {
    return (this.config.usesDocumentWrite && this.isLoadingAsynchronously());
  };
  
  /**
   * HTML injection trigger for tag. It will try to inject html and update
   * on tags state.
   * @param {Function} callback
   */
  GenericLoader.prototype.injectHTML = function (callback) {
     //on sync - try to dpc.write
    var tryWriteIfNoLocation = !this.docWriteAsksToWaitForBody();
    // tryWriteIfNoLocation set to true will cause immediate document.write
    // call if location was not found!
    var html = this.prepareHTML(this.config.html);
    if (html) {
      TagHelper.injectHTMLForLoader(this, callback, tryWriteIfNoLocation, html);
    }
  };
  
  /**
   * Clone this loader and return it.
   * @returns {qubit.opentag.GenericLoader}
   */
  GenericLoader.prototype.clone = function () {
    var clone = new GenericLoader(this.config);
    return clone;
  };
  
}());









/*
 * TagSDK, a tag development platform
 * Copyright 2013-2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  var Utils = qubit.opentag.Utils;
  var TagsUtils = qubit.opentag.TagsUtils;
  var Timed = qubit.opentag.Timed;
  var BaseFilter = qubit.opentag.filter.BaseFilter;
  var GenericLoader = qubit.opentag.GenericLoader;
  var TagHelper = qubit.opentag.TagHelper;
  var log = new qubit.opentag.Log("BaseTag -> ");

  /**
   * @class qubit.opentag.BaseTag
   * @extends qubit.opentag.GenericLoader
   * 
   * #BaseTag - Father class of any tag
   * 
   * This class has properties and API shared by all tag types.
   * To check if object is a tag its instance must be compared to this class
   * prototype.
   * 
   * BaseTag has [GenericLoader](#!/api/qubit.opentag.GenericLoader) as a parent
   * class. GenericLoader implements entire engione for urls loading, 
   * dependencies management, configuration and many more. In practice, at most
   * of times [CustomTag](#!/api/qubit.opentag.CustomTag) or 
   * [LibraryTag](#!/api/qubit.opentag.LibraryTag) will be used.
   * 
   * @param {Object} config Please see properties for configuration options.
   *  Each property can be set at initialization time via config object.
   */
  function BaseTag(config) {
    
    var defaults = {
     /**
      * How much filter should be timed out. By default - never if
      * filters is configured to await. It is unlikely this option will be used.
      * Typical filters are never timed out.
      * @cfg filterTimeout
      * @type Number
      */
      filterTimeout: (config && config.filterTimeout) 
              || this.FILTER_WAIT_TIMEOUT,
      /**
       * Package property indicates where this tag will reside
       * (in what namespace). This property is used by structure packagers to
       * locate a tag.
       * It is optional.
       * This property does not affect this tag itself, it is only configuration
       * property.
       * @cfg package
       * @type Object 
       */
      PACKAGE: (config && config.PACKAGE),
      /**
       * Is this tag a dedupe tag? `dedupe` option indicates that tag is
       * deduplicating statistic information - this typically happens only for
       * session tags. If `dedupe` is set to `true` a container will send
       * deduplicated ping message for this tag when its loaded.
       * This property does not affect this tag itself, it is only configuration
       * property.
       * @cfg dedupe
       * @type Boolean
       */
      dedupe: false,
      /**
       * If the tag requires consent tag. If set to true, container will not 
       * trigger tag loading untill consent agreement has been validated.
       * This property does not affect this tag itself, it is only configuration
       * property.
       * @cfg needsConsent
       * @type Boolean
       */
      needsConsent: false,
      /**
       * This property indicates that tag is inactive.
       * @cfg inactive
       * @type Boolean
       */
      inactive: false,
      /**
       * Variables map.
       * Variables can be passed as a map with veriable mapped to token name.
       * This mapping will work only if pramater with the token name has no
       * variable defined in config, it will be ignored otherwise.
       * @cfg variables
       * @type Object
       */
      variables: null,
      /**
       * New API.
       * Custom runner, if set, run will not fire tag running but
       * runner will be invoked instead.
       * It is duty of runner to remeber to call `this.run()` to start the 
       * execution chain.
       * 
       * Default value is NULL.
       * 
       * This option will bemostly used by custom tags to replace 
       * "session filters".
       * @cfg runner
       * @type Function
       */
      runner: null
    };
    
    Utils.setIfUnset(config, defaults);
    
    BaseTag.superclass.apply(this, arguments);
  
    /**
     * Named page variables. These variables are not strictly bonded to any
     * parameters. In old tag running mechanism this array is never used.
     * In case of any page variable object that is added here, tag will include
     * it as page variable dependency.
     * 
     * Named variables is a new feature. To get page variables related to 
     * parameters use `this.getPageVariables()`
     * @property Array[qubit.opentag.filter.BaseFilter]
     */
    this.namedVariables = {};
    
    /**
     * Parameters array. Parasmeters are a plain objects containing:
     * 
     * `name` property, indicating parameter's name.
     * 
     * `token` property indicating unique name to be used to replace its 
     * `${token}` occurences in html, pre, post and config.[pre,post, script] 
     * strings with values fetched by `this.valueForToken("token"). To retrieve
     *  at any run time the value, use `this.valueForToken("token")`.
     * `defaultValue` If defined, it will be used to fall back to this 
     * expression based value.
     * Default value will be taken if normal token value does not exist and 
     * script is timed out.
     * 
     * @property {Array} parameters
     */
    this.parameters = [];
    
    /**
     * Local filters of this tag.
     * Use getFilters for fetching all filters applying to this tag.
     * @property {Array} filters Array of qubit.opentag.filter.BaseFilter
     */
    this.filters = [];
    
    /**
     * Session object, if any attached - there may be no session defined and this
     * object will be unset. This is same session object that is passed to filters.
     * @property {qubit.opentag.Session}
     */
    this.session = null;
    
    if (config) {
      this.addState("INITIAL");

      try {
        BaseTag.register(this);
      } catch (ex) {
        this.log.WARN("Problem with registering tag " + this.config.name);
        this.log.WARN(ex, true);
        // RETHINK THIS, it looks usefull but a bit circural...
      }
      
      if (config.filters) {
        for (var i = 0; i < config.filters.length; i++) {
          this.addFilter(config.filters[i]);
        }
      }
      
      if (config.parameters) {
        this.parameters = this.parameters.concat(config.parameters);
      }
      
      if (config.variables) {
        for (var prop in config.variables) {
          if (config.variables.hasOwnProperty(prop)) {
            var param = this.getParameterByTokenName(prop);
            if(param) {
              var variable = config.variables[prop];
              param.variable = variable;
              if (variable.defaultValue !== undefined) {
                param.defaultValue = variable.defaultValue;
              }
              if (variable.uv !== undefined) {
                param.uv = variable.uv;
              }
            }
          }
        }
      }
      
      this.log.FINEST("Initializing variables.");
      this.initPageVariablesForParameters();
      
      this.onTagInit();
    }
  }
  
  Utils.clazz("qubit.opentag.BaseTag", BaseTag, GenericLoader);
  
  /**
   * Returns value for a token name.
   * If page varable exist and is bound to a parameter using
   * specific token name equal to `token` argument it will be returned by 
   * this function.
   * This function tries first to read from parameters variables and parameter
   * default values , if not found any **variable** (including defaults) 
   * `this.namedVariables` will be searched for the value of variable witn
   * name matching the token.
   * 
   * Note: if variable is defined dierctly for parameter - even if unset it 
   * will be used **only**.
   * 
   * @param {String} token name
   * @param {Boolean} defaults if default value should be checked
   * @returns 
   */
  BaseTag.prototype.valueForToken = function (token, defaults) {
    var param = this.getParameterByTokenName(token);
    if (param) {
      if (defaults === undefined) {
        if (this.loadingTimedOut) {
          defaults = true;
        }
      }
      return this.getParameterValue(param, defaults);
    }
    if (this.namedVariables && this.namedVariables[token]) {
      var variable = _getSetNamedVariable(this, token);
      if (variable) {
        return variable.getRelativeValue(defaults);
      }
    }
    return undefined;
  };
  
  /**
   *  Default timeout for script to load.
   * @property {Number} LOADING_TIMEOUT
   */
  BaseTag.prototype.LOADING_TIMEOUT = 5 * 1000;
  
  /**
   *  Default timeout for script filter to wait.
   *  Default value is -1 which means: awaiting filters are never timed out.
   * @property {Number} FILTER_WAIT_TIMEOUT
   */
  BaseTag.prototype.FILTER_WAIT_TIMEOUT = -1;
  
  BaseTag.prototype.run = function (ignoreDeps) {
    if (this.config && this.config.runner) {
      var ret = false;
      try {
        this.log.INFO("Running custom runner...");
        this.addState("AWAITING_CALLBACK");
        ret = this._runner = new Date().valueOf();
        this.config.runner.call(this);
      } catch (e) {
        this.log.ERROR("Error while running custom runner: " + e);
      }
      return ret;
    } else {
      this._runner = false;
      return this.start(ignoreDeps);
    }
  };
  
  /**
   * Starter used to run tag. It wraps run function only and is ment to be used
   * in runner function body. See `config.runner` property for more details.
   * @param {Boolean} ignoreDeps same as oin `run()` method
   * @returns {undefined}
   */
  BaseTag.prototype.start = function (ignoreDeps) {
    return BaseTag.superclass.prototype.run.call(this, ignoreDeps);
  };

  /**
   * Starter used to run tag only once. It wraps run function only and is ment
   * to be used in runner function body. See `config.runner` property 
   * for more details.
   * @param {Boolean} ignoreDeps same as oin `run()` method
   * @returns {undefined}
   */
  BaseTag.prototype.startOnce = function (ignoreDeps) {
    return BaseTag.superclass.prototype.runOnce.call(this, ignoreDeps);
  };

  /**
   * It gets ALL filters related to this tag in theirs order of load.
   * @returns {Array}
   */
  BaseTag.prototype.getFilters = function () {
    return this.filters;
  };
  
  /**
   * Run tag only once and only if filter passes.
   */
  BaseTag.prototype.runOnceIfFiltersPass = function () {
    if (!this._runOnceIfFiltersPassTriggered && !this.scriptExecuted) {
      this._runOnceIfFiltersPassTriggered = new Date().valueOf();
      this.runIfFiltersPass();
    }
  };

  /**
   * Function used to run a tag. It is a wrapper around run function, before
   * running the tag, it does check on filters with `filtersState`.
   * Note that run triggers entire process for loading dependencies and the
   * tag if url based.
   * @returns {BaseFilter.state}
   */
  BaseTag.prototype.runIfFiltersPass = function () {
    var state = this.filtersState();
    this.addState("FILTER_ACTIVE");
    
    if (!this.filtersRunTriggered) {
      this.filtersRunTriggered = new Date().valueOf();
    }
    
    //it is a number of BaseFilter.state type or time when to stop checking
    if (state === BaseFilter.state.SESSION) {
      this.addState("AWAITING_CALLBACK");
      this.log.FINE("tag is in session and will be manually triggered " + 
              "by custom starter");//L
      this.awaitingCallback = new Date().valueOf();
    } else if (state === BaseFilter.state.PASS) {
      this.filtersPassed = new Date().valueOf();
      this.log.FINE("tag passed filters tests");
      try {
        this.onFiltersPassed();
      } catch (ex) {
        this.log.ERROR("error running onFiltersDelayed:" + ex);
      }
      this.run();
    } else if (state === BaseFilter.state.FAIL) {
      this.log.FINE("tag failed to pass filters");
      this._markFiltersFailed();
      this._markFinished();
    } else if (state > 0) {
      var tout = this.config.filterTimeout;
      if (tout < 0 || 
              ((new Date().valueOf() - this.filtersRunTriggered) > tout)) {
        //try again in [state] ms in future
        //if state is lesser than 0 its passing call and the end.
        if (!this._awaitingForFilterInformed) {
          this.log.INFO("filters found indicating for tag to wait " +
                  "for applicable conditions - waiting...");//L
          this._awaitingForFilterInformed = new Date().valueOf();
          
          try {
            this.onFiltersDelayed();
          } catch (ex) {
            this.log.ERROR("error running onFiltersDelayed:" + ex);
          }
        }
        this._setTimeout(this.runIfFiltersPass.bind(this), state);
      } else {
        this._markFiltersFailed();
        this._markFinished();
        this.filtersRunTimedOut = new Date().valueOf();
        this.log.WARN("awaiting for filters timed out.");
      }
    }
    
    try {
      this.onFiltersCheck(state);
    } catch (e) {
      this.log.ERROR(e);
    }
    
    return state;
  };

  BaseTag.prototype._markFiltersFailed = function () {
    this.addState("FILTERS_FAILED");
    this.filtersPassed = -(new Date().valueOf());
  };

  /**
   * State properties used as a tag's current state and passed history. 
   * This is quite usefull metric ordered state indicator.
   * 
   * consider this example:
   * 
   * 
   *    this.state > this.STATE.FAILED_TO_LOAD_DEPENDENCIES
   *    
   * It translates to script being fully loaded with dependenciess and passed 
   * filters, but unfortune to have url script loading problems or final script 
   * execution itself.
   * 
   * This is very useful when creating automated debugging tools.
   * 
   * Full defnition:
   * 
          BaseTag.prototype.STATE = {
            INITIAL: 0,
            FILTER_ACTIVE: 1,
            AWAITING_CALLBACK: 2,
            FILTERS_FAILED: 4,
            STARTED: 8,
            LOADING_DEPENDENCIES: 16,
            LOADED_DEPENDENCIES: 32,
            LOADING_URL: 64,
            LOADED_URL: 128,
            EXECUTED: 256,
            EXECUTED_WITH_ERRORS: 512,
            FAILED_TO_LOAD_DEPENDENCIES: 1024,
            FAILED_TO_LOAD_URL: 2048,
            FAILED_TO_EXECUTE: 4096,
            TIMED_OUT: 2 * 4096,
            UNEXPECTED_FAIL: 4 * 4096
          };
  
   * 
   * @property {Object} STATE
   */
  BaseTag.prototype.STATE = {
    INITIAL: 0,
    FILTER_ACTIVE: 1,
    AWAITING_CALLBACK: 2,
    FILTERS_FAILED: 4,
    STARTED: 8,
    CANCELLED: 8*2,
    LOADING_DEPENDENCIES: 16*2,
    LOADED_DEPENDENCIES: 32*2,
    LOADING_URL: 64*2,
    LOADED_URL: 128*2,
    EXECUTED: 256*2,
    EXECUTED_WITH_ERRORS: 512*2,
    FAILED_TO_LOAD_DEPENDENCIES: 1024*2,
    FAILED_TO_LOAD_URL: 2048*2,
    FAILED_TO_EXECUTE: 4096*2,
    TIMED_OUT: 4096*2*2,
    UNEXPECTED_FAIL: 4096*2*2*2
  };
  
  /**
   * Function used to set state by using state name (a string).
   * This function has no effect if name passed in does not equal to one
   * of `this.STATE` properties.
   * @param {String} stateName
   */
  BaseTag.prototype.addState = function(stateName) {
    BaseTag.superclass.prototype.addState.call(this, stateName);

    try {
      BaseTag.onStateChange(this);
    } catch (ex) {
      this.log.ERROR(ex);
    }

    this.stateStack = [];
    var s = this.STATE;
    var current = this.state;
    var stack = this.stateStack;

    if (current & s.INITIAL) {
      stack.push("Initial state.");
    }
    if (current & s.FILTER_ACTIVE) {
      stack.push("Tag running with filters pass triggered.");
    }
    if (current & s.FILTERS_FAILED) {
      stack.push("Filters failed to pass.");
    }
    if (current & s.AWAITING_CALLBACK) {
      stack.push("Awaiting callback to run this tag. Not pooling.");
    }
    if (current & s.STARTED) {
      stack.push("Tag is initialized and loading has been started.");
    }
    if (current & s.LOADING_DEPENDENCIES) {
      stack.push("Dependencies are being loaded.");
    }
    if (current & s.LOADED_DEPENDENCIES) {
      stack.push("Dependencies loading process has been finished.");
    }
    if (current & s.LOADING_URL) {
      stack.push("External URL is being loaded.");
    }
    if (current & s.LOADED_URL) {
      stack.push("External URL has been loaded.");
    }
    if (current & s.EXECUTED) {
      stack.push("Main script has been executed.");
    }
    if (current & s.EXECUTED_WITH_ERRORS) {
      stack.push("Main script has been executed but errors occured.");
    }
    if (current & s.FAILED_TO_LOAD_DEPENDENCIES) {
      stack.push("Dependencies has failed to load.");
    }
    if (current & s.FAILED_TO_LOAD_URL) {
      stack.push("URL location failed to load.");
    }
    if (current & s.FAILED_TO_EXECUTE) {
      stack.push("Script failed to execute.");
    }
    if (current & s.TIMED_OUT) {
      stack.push("Script timed out awaiting for dependencies.");
    }
    if (current & s.UNEXPECTED_FAIL) {
      stack.push("Script occured UNEXPECTED exception and is failed.");
    }
    if (current & s.CANCELLED) {
      stack.push("Tag has been cancelled.");
    }
  };
  
/**
   * Init event. 
   * Run at the end of constructors body.
   * @event onTagInit
   */
  BaseTag.prototype.onTagInit = EMPTY_FUN;
  /**
   * State being set global event.
   * @static
   * @param {qubit.opentag.BaseTag} tag reference
   * @event onStateChange
   */
  BaseTag.onStateChange = EMPTY_FUN;
  /**
   * Event triggered if tag has run filter delaying request.
   * Filters delaying execution will trigger this event once only.
   * @event onFiltersDelayed
   */
  BaseTag.prototype.onFiltersDelayed = EMPTY_FUN;
  
  /**
   * Event triggered if tag has passed all filters succesfuly.
   * It does not include Session filters in its firing logic.
   * @event onFiltersPassed
   */
  BaseTag.prototype.onFiltersPassed = EMPTY_FUN;
  
  /**
   * Event triggered if tag is checking filters.
   * Tag may periodically check filters staus, it happens if any of filters 
   * return timed state value, see 
   * [BaseFilter](#!/api/qubit.opentag.filter.BaseFilter) for more information.
   * @event onFiltersCheck
   * @param {qubit.opentag.BaseFilter.state} onFiltersCheck
   */
  BaseTag.prototype.onFiltersCheck = EMPTY_FUN;
  
  /**
   * Property representing binary table with this tag's state.
   * `this.state` property is a number that is a binary representation
   * of its state history, for example:
   *
   *     this.state & s.FILTER_ACTIVE
   *
   *  resulting as true, means that `s.FILTER_ACTIVE` is set.
   *  Defasult value is set to:
   *
   *     qubti.opentag.BaseTag.prototype.STATE.INITIAL
   * 
   * Notice that `GenericLoader` has different state values table.
   * State object is a very useful object to read current and historical
   * tags state.
   * 
   * @property {Number} state
   */
  BaseTag.prototype.state = BaseTag.prototype.STATE.INITIAL;
    
  /**
   * Function returns true and only true if all variables have set the value.
   * If `tryDefaults` is set to `true` possible default value assigned to 
   * matched parameters or variables will be used to resolve the values.
   * @param tryDefaults {Boolean} name try also defaults if variables are unset.
   * @returns {Boolean} True if all variables have values.
   */
  BaseTag.prototype.arePageVariablesLoaded = function (tryDefaults) {
    return TagHelper.allParameterVariablesReadyForTag(this, tryDefaults);
  };
  
  /**
   * @protected
   * Function returning array of plain strings containing human friendly names
   * of dependencies that are still to be satisfied upon load.
   * Untill this method return empty array tag will never enter execution block
   * (loading: scripts, html, and execution code).
   * @param tryDefaults {Boolean} indicates if default values should be used.
   * @param arrayToAdd {Array} This method may be used in chain and to pass
   * any of existing dependencies use this array.
   * @returns {Boolean}
   */
  BaseTag.prototype.getDependenciesToBeLoaded =
          function (tryDefaults, arrayToAdd) {
    var failures = arrayToAdd || [];
    
    if (!this.arePageVariablesLoaded(tryDefaults)) {
      failures.push("page variables");
    }
    
    return BaseTag.superclass.prototype
            .getDependenciesToBeLoaded.call(this, tryDefaults, failures);
  };
  
  /**
   * @protected
   * URL handling wrapper. This function is used to prepare URL in config object
   * before its passed to url loading mechanism, it typically replaces any 
   * tokens with variable values.
   * @param {String} url
   * @returns {String}
   */
  BaseTag.prototype.prepareURL = function (url) {
    return this.replaceTokensWithValues(url);
  };
  
  /**
   * @protected
   * Location object handling wrapper. When location object is passed (typically
   *  DOM ID or "BODY" or "HEAD") it may contain some string patterns like 
   *  token. This function ensures that the string passed will contain right 
   *  value before passing it to executrion context (typically HTML injection 
   *  or `document.write` operations) 
   * @param {String} loc
   * @returns {String}
   */
  BaseTag.prototype.prepareLocationObject = function (loc) {
    return this.replaceTokensWithValues(loc);
  };

  /**
   * HTML config object handling wrapper.
   * It does ensure that HTML passed into configuration has put all token values
   * (if they exist) into the string before it is passed to execution context
   * (HTML injection).
   * @param {String} html
   * @returns {String}
   */
  BaseTag.prototype.prepareHTML = function (html) {
    if (html) {
      html = this.replaceTokensWithValues(html);
    }
    return html;
  };
  
  /**
   * This function is used to replace any string with tokens in it with its 
   * corresponding values. It delegates some of replacement process to 
   * [BaseVariable.prototype.replaceToken](
     #!/api/qubit.opentag.pagevariable.BaseVariable-method-replaceToken) 
   * per variable that is used.
   * @param {String} string
   * @returns {String} resulting string
   */
  BaseTag.prototype.replaceTokensWithValues = function (string) {
    if (!string || string.indexOf("${") === -1) {
      //serious performance improvements.
      //regex are heavy
      return string;
    }
    var params = this.parameters;
    
    if (params) for (var i = 0; i < params.length; i++) {
      var parameter = params[i];
      var variable = this.getVariableForParameter(parameter);
      
      if (variable) {
        var token = params[i].token;
        var value = this.valueForToken(token);
        string = variable.replaceToken(token, string, value);
      }
    }
    return string;
  };
  
  /**
   * Function gets parameter object by parameter name.
   * **Last parameter matchin name is returned.**
   * @param {String} name parameter name
   * @returns {Object} parameter reference
   */
  BaseTag.prototype.getParameter = function (name) {
    var params = this.parameters;
    var ret = null;
    if (params) for (var i = 0; i < params.length; i++) {
      if (params[i].name === name) {
        ret = params[i];
      }
    }
    return ret;
  };
  
  /**
   * Simple manual parameter setter. This funmction is intended to use for
   * debugging and testing purposes. Parameters and variables should be defined
   * and bond at configuration time.
   * @param {String} tokenName
   * @param {Object} variable any object, will be passed `value` property
   *  variable config object
   * @returns {Boolean} true if parameter was founmd, false otherwise
   */
  BaseTag.prototype.setParameterValueByTokenName = 
          function (tokenName, variable) {
    var param = this.getParameterByTokenName(tokenName);
    if (param !== null) {
      //it will be automatically converted by TagHelper to 
      //the instance on first access.
      param.variable = {
        value: variable
      };
      return true;
    }
    return false;
  };
  
  /**
   * Function gets parameter value by passing parameter as argument or its name.
   * If defaults is specified, it will return its default value if it was 
   * defined.
   * @param {Object} parameterOrName
   * @param {Boolean} defaults
   * @returns {Object} any value assigned
   */
  BaseTag.prototype.getParameterValue = function (parameterOrName, defaults) {
    var param = (typeof(parameterOrName) === "string") ?
        this.getParameter(parameterOrName) : parameterOrName;
    if (param) {
      var variable = this.getVariableForParameter(param);
      if (variable) {
        try {
          var value;
          if (defaults) {
            value = Utils.gevalAndReturn(param.defaultValue).result;
          }
          value = variable.getRelativeValue(defaults, value);
          return value;
        } catch (ex) {
          this.log.ERROR("error while trying to resolve variable value:" + ex);
          this.log.ERROR("Variable defaults string is invalid: " + 
                  param.defaultValue);//L
          return undefined;
          //throw ex;
        }
      }
    }
    return undefined;
  };
  /**
   * Entry method used to check if all filters used by this tag are passed.
   * BaseTag searches for filters in this.config.**package**.filters location.
   * The location should indicate all filters used by this tag.
   * The **package* config property is a crucial tags property used to
   * configure antiore tags.
   * Filter state is not just a boolean, in this case it will return one of
   * [BaseFilter.state](
     #!/api/qubit.opentag.filter.BaseFilter-static-property-state)
   * properties. In this very case, `SESSION `is never expected to be returned
   *  here.
   * @returns {BaseFilter.state}
   */
  BaseTag.prototype.filtersState = function () {
    return TagsUtils.filtersState(this.filters, this.session, this);
  };
  
  /**
   * Adding filter function.
   * @param filter {qubit.opentag.filter.BaseFilter}
   */
  BaseTag.prototype.addFilter = function (filter) {
    if (this.session) {
      filter.setSession(this.session);
    }
    this.filters.push(filter);
  };
  
  /**
   * Reset tag method, it will bring tag to its initial state so it can be
   * re-run clean. It does not reset logs!
   * Used for debugging purposes.
   */
  BaseTag.prototype.reset = function () {
    BaseTag.superclass.prototype.reset.call(this);
    this.resetFilters();
    var u;
    this.filtersPassed = u;
    this.dedupePingSent = u;
    this.pingSent = u;
    this._runOnceIfFiltersPassTriggered = u;
    this.filtersRunTriggered = u;
    this._runner = u;
  };
  
  /**
   * Function will reset all filters. Any disabled filters will be re-enabled.
   */
  BaseTag.prototype.resetFilters = function () {
    for (var i = 0; i < this.filters.length; i++) {
      this.filters[i].reset();
    }
  };
  
  /**
   * Function will return parameter object by using token name.
   * As many paramaters can use same token name, first will be returned.
   * 
   * [See parameters guide for more details](#!/guide/defining_parameter)
   * 
   * @param {String} name Token name used to search for value.
   * @returns {Object}
   */
  BaseTag.prototype.getParameterByTokenName = function (name) {
    var ret = null;
    if (this.parameters) {
      var params = this.parameters;
      for (var i = 0; i < params.length; i++) {
        if (params[i].token === name) {
          ret = params[i];
        }
      }
    }
    return ret;
  };
  
  /**
   * Removing filter function.
   * It removes filter instance from `this.filters` array.
   * @param {qubit.opentag.filter.BaseFilter} filter
   */
  BaseTag.prototype.removeFilter = function (filter) {
    Utils.removeFromArray(this.filters, filter);
  };
  
  var _counter_tag_map = 0;
  var tags = [];
  var tagAccessorsMap = {};
  /**
   * Method used to register a qubit.opentag.BaseTag in a global array.
   * It is quite useful to hav reference to all Tag instances. Each BaseTag
   * constructor triggers this function to add itself to the registry array.
   * Function does not check origins of the class.
   * @static
   * @param {BaseTag} tag
   */
  BaseTag.register = function (tag) {
    log.FINEST("registering tag named \"" +
            tag.config.name + "\", instance of:");//L
    log.FINEST(tag, true);
    var index = Utils.addToArrayIfNotExist(tags, tag);
    if (index !== -1) {
      log.FINE("tag already exists in tags registry.");
    }
    if (index === -1) {
      tag._tagIndex = tags.length - 1;
    } else {
      tag._tagIndex = index;
    }
  };
  
  /**
   * Use this function to unregister this tag from the registry.
   * It is useful especially for debugging purposes.
   * @param {qubit.opentag.BaseTag} ref optional reference, `this` will be 
   * used if undefined.
   */
  BaseTag.prototype.unregister = function (ref) {
    BaseTag.unregister(ref || this);
  };
  
  /**
   * Use this function to unregister `tag` from the registry.
   * @static
   * @param {qubit.opentag.BaseTag} tag
   */
  BaseTag.unregister = function (tag) {
    log.FINEST("Un-registering tag named \"" +
            tag.config.name + "\", instance of:");//L
    log.FINEST(tag, true);
    var index = Utils.removeFromArray(tags, tag);
    if (!index || index.length === 0) {
      log.FINEST("tag " + tag.config.name + " is already unregisterd.");
    }

    tag._tagIndex = -1;
  };
  
  /**
   * Returns all tags registered in the system (global registry).
   * @static
   * @returns {Array}
   */
  BaseTag.getTags = function () {
    return tags;
  };  
  /**
   * Returns map of all tags in the system that were returned as string reference. See `this.getAccessorString()` for more details.
   * @static
   * @returns {Array}
   */
  BaseTag.getAccessorsMap = function () {
    return tagAccessorsMap;
  };
  
  /**
   * Returns all tags registered in the system (global registry).
   * @returns {Array}
   */
  BaseTag.prototype.getTags = function () {
    return tags;
  };
  
  /**
   * @protected
   * Function used to validate and initialize parameters and any variables 
   * assigned. If variables were passed as plain objects, they will be converted
   * to BaseVariable instances.
   * It is always run at constructor time.
   */
  BaseTag.prototype.initPageVariablesForParameters = function () {
    var params = this.parameters;
    if (params) {
      for (var i = 0; i < params.length; i++) {
        params[i].variable = TagHelper
                .validateAndGetVariableForParameter(params[i]);
      }
    }
    if (this.namedVariables) {
      for (var prop in this.namedVariables) {
        if (this.namedVariables.hasOwnProperty(prop)) {
          this.namedVariables[prop] = 
                  TagHelper.initPageVariable(this.namedVariables[prop]);
        }
      }
    }
  };
  
  /**
   * Function returns all page variables defined within this tag.
   * All variables assigned to parameters and any variables alone from 
   * `this.namedVariables`.
   * During getting variables from `this.parameters` array, 
   * they will be re-validated.
   * @returns {Array} BaseVariable
   */
  BaseTag.prototype.getPageVariables = function () {
    var params = this.parameters;
    var vars = [];
    
    if (params) {
      for (var i = 0; i < params.length; i++) {
        var v = this.getVariableForParameter(params[i]);
        if (v !== null) {
          Utils.addToArrayIfNotExist(vars, v);
        }
      }
    }
    //add named variables and do not duplicate
    if (this.namedVariables) {
      for (var key in this.namedVariables) {
        //getSetVariable validates each time variable
        Utils.addToArrayIfNotExist(vars, _getSetNamedVariable(this, key));
      }
    }
    return vars;
  };
  
  /**
   * Function returns a string that can be used to get this tag instance in its
   *  evaluation time at ANY scope.
   * @returns {String}
   */
  BaseTag.prototype.getAccessorString = function () {
    if (!this._accessorsMapKey) {
      this._accessorsMapKey = "_" + _counter_tag_map++;
      tagAccessorsMap[this._accessorsMapKey] = this;
    }
    return "qubit.opentag.BaseTag.getAccessorsMap()." + this._accessorsMapKey;
  };
  
  /**
   * Function returns page variable object for the parameter instance.
   * It is advised to use this method when unsure what type of variable 
   * object is.
   * @param param {Object}
   * @returns {qubit.opentag.pagevariable.BaseVariable} BaseVariable instance
   */ 
  BaseTag.prototype.getVariableForParameter = function (param) {
    var variable = TagHelper.validateAndGetVariableForParameter(param);

    if (variable && !variable.config.empty) {
      //if exists and is not empty variable
      //ignore parameter has own variable
    } else if (this.namedVariables && this.namedVariables[param.token]) {
      //@todo clean it up
      //use alternative value
      variable = _getSetNamedVariable(this, param.token);
    }
    return variable;
  };

  /**
   * Logs this tag variables debugable information.
   * @returns {Array} Array of objects with properties:
   * 
   *  name - name of variable
   *  
   *  exists - if variable value exists by tag meaning
   *  
   *  token - parameters token associated with variable, if exists,
   *    null otherwise.
   *  
   *  value - current variable value
   *  
   *  variable - direct variable reference
   */
  BaseTag.prototype.checkVariablesState = function () {
    var res = [];
    this.log.FINE("Tag has been timed out, showing variables:");
    var pairs = TagHelper.getAllVariablesWithParameters(this);
    
    for (var i = 0; i < pairs.length; i++) {
      var param = pairs[i].parameter;
      var variable = pairs[i].variable;
      var val;
      
      if (param && param.token) {
        val = this.valueForToken(param.token);
      } else {
        val = variable.getRelativeValue(true);
      };
      
      var tmp = {
        name: variable.config.name,
        exists: variable.exists(),
        token: param ? param.token : null,
        value: val,
        variable: variable
      };
      res.push(tmp);
      
      /*log*/
      this.log.FINE(
              " Variable Name: " + tmp.name +
              ", Exists: " + tmp.exists +
              ", Token: " + (param ? param.token : "<param is not assigned>") +
              ", Value:" + val
              );
      /*~log*/
    }
    
    return res;
  };

  /**
   * @protected
   * Triggers onLoadTimeout event.
   */
  BaseTag.prototype._triggerOnLoadTimeout = function () {
    this.checkVariablesState();//L
    this.onLoadTimeout();
  };

  function _getSetNamedVariable(tag, token) {
    var variable = TagHelper.initPageVariable(tag.namedVariables[token]);
    tag.namedVariables[token] = variable;
    return variable;
  };
}());




(function(){
  var Utils = qubit.opentag.Utils;
  var log = new qubit.opentag.Log("Tags -> ");
  
  /**
   * @singleton
   * @class qubit.opentag.Tags
   * #Tags Utility Class
   * This class is an utlity object for accessing, grouping and filtering tags.
   */
  var Tags = function () {};

  Utils.clazz("qubit.opentag.Tags", Tags);

  /**
   * Returns all tags grouped by logical state, it collects ALL tags from ALL
   * Containers - tags unregistered will not be included. 
   * @returns {Object}
   */
  Tags.getAllTagsByState = function () {
    return qubit.opentag.Container.getAllTagsByState(Tags.getTags());
  };
  
  /**
   * Find tag by name
   * @param {String} match string, String.match() function will be used.
   * @returns {Array} array of qubit.opentag.BaseTag
   */
  Tags.findTagByName = function (match) {
    var tags = this.getTags();
    var results = [];
    for(var i = 0; i < tags.length; i++) {
      if (tags[i].config.name === match) {
        results.push(tags[i]);
      }
    }
    return results;
  };
  
  /**
   * Find tag by name
   * @param {String} match string, String.match() function will be used.
   * @returns {Array} array of qubit.opentag.BaseTag
   */
  Tags.findTagByMatch = function (match) {
    var tags = this.getTags();
    var results = [];
    for(var i = 0; i < tags.length; i++) {
      if (tags[i].config.name.match(match)) {
        results.push(tags[i]);
      }
    }
    return results;
  };
  /**
   * Get all opentag instances map.
   * 
   * @returns Object
   */
  Tags.getTags = function () {
    log.FINEST("getTags");
    return qubit.opentag.BaseTag.getTags();
  };
  
  /**
   * Reset all tags. It will make all tags ready to rerun like they never
   * were run.
   * 
   * @returns Object
   */
  Tags.resetAllTags = function () {
    log.WARN("reseting all tags!");
    var tags = Tags.getTags();
    for (var i = 0; i < tags.length; i++) {
      tags[i].reset();
    }
  };

  /**
   * Returns all page variable instances associated with containers.
   * @returns {Array}
   */
  Tags.getContainersPageVariables = function () {
    var containers = Tags.getContainers();
    var vars = [];
    for(var i =0; i < containers.length; i++) {
      vars = vars.concat(containers.getPageVariables());
    }
    return vars;
  };
  
  /**
   * @static
   * Returns all page variables associated with all registered tags.
   */
  Tags.getAllPageVariables = function () {
    var tags = Tags.getTags();
    var vars = [];
    for(var i = 0; i < tags.length; i++) {
      vars = vars.concat(tags[i].getPageVariables());
    }
    return vars;
  };

  /**
   * @static
   * Cancell all tags.
   */
  Tags.cancelAll = function () {
    var tags = Tags.getTags();
    for(var i = 0; i < tags.length; i++) {
      tags[i].cancel();
    }
  };
  
  /**
   * @static
   * Reset all tags.
   */
  Tags.resetAll = function () {
    var tags = Tags.getTags();
    for(var i = 0; i < tags.length; i++) {
      tags[i].reset();
    }
  };

  /**
   * Function used to get all page variables instances having same name.
   * 
   * @param {String} name token name that identifies the variable.
   * @return {qubit.opentag.pagevariable.BaseVariable} object 
       qubit.opentag.pagevariable.BaseVariable
       instance. 
   */
  Tags.getPageVariableByName = function (name) {
    var vars = Tags.getAllPageVariables();
    var rets = [];
    for (var i = 0; i < vars.length; i++) {
      if (vars[i].config.name === name) {
        rets.push(vars[i]);
      }
    }
    return rets;
  };
  
  /**
   * Gets load time for tag.
   * 
   * @param {qubit.opentag.BaseTag} tag
   * @returns {Object} Object return has two properties:
   * 
   * - `tag` reference to tag
   * 
   * - `loadTime` Number value or null if tag is finished running (note, it does
   *  not check if tag is loaded successfuly but if it was run)
   */
  Tags.getLoadTime = function (tag) {
    var start = tag.beforeRun;
    var end = tag.runIsFinished;
    if (isNaN(end)) {
      return {tag: tag, loadTime: null};
    } else {
      return {tag: tag, loadTime: (end - start)};
    }
  };

  /**
   * Gets load times for all tags or passed via argument.
   * 
   * @param {Object} tags tags map or an array (optional)
   */
  Tags.getLoadTimes = function (tags) {
    var ret = [];
    if (tags instanceof qubit.opentag.BaseTag) {
      ret.push([Tags.getLoadTime(tags[prop])]);
      return ret;
    }
    
    tags = tags || Tags.getTags();
    
    var array = tags instanceof Array;
    
    if (array) {
      for(var i = 0; i < tags.length; i++) {
        if (tags[i] instanceof qubit.opentag.BaseTag) {
          ret.push(Tags.getLoadTime(tags[i]));
        }
      }
    } else {
      for(var prop in tags) {
        if (tags[prop] instanceof qubit.opentag.BaseTag) {
          ret.push(Tags.getLoadTime(tags[prop]));
        }
      }
    }
    return ret;
  };
    
  
  /**
   * Containers getter.
   * Gets all containers registered.
   * @returns {Array} array of qubit.opentag.Container
   */
  Tags.getContainers = function () {
    return qubit.opentag.Container.getContainers();
  };
  
  log.INFO("*** Qubit TagSDK *** ", true,
           "font-size: 22px; color:#CCC;"+//L
           "text-shadow:#fff 0px 1px 0, #555 0 -1px 0;");//L
})();


q.cookie = {};

q.cookie.PageView = {};
q.cookie.PageView.update = function () {
  var a, r;
  r = function _() {
    return (Math.floor(1 + Math.random() * 65536)).toString(36).substring(1);
  };
  if (!window.__pageViewId__) {
    a = new Date().getTime().toString(36);
    window.__pageViewId__ = a + r() + r() + r();
  }
  return window.__pageViewId__;
};
/*global XDomainRequest */




q.html.PostData = function (url, data, type) {

  var _post, agent, isIe, isIe9, isOldIe, fullUrl, loaded, 
    retry, retryDelay, retryCount;

  retryCount = 2;
  retryDelay = 5000;
  loaded = false;

  retry = function () {
    if (retryCount > 0) {
      setTimeout(function () {
        if (!loaded) {
          retryCount -= 1;
          _post();
        }
      }, retryDelay);
    }
  };

  agent = navigator.userAgent.toLowerCase();
  isIe = agent.indexOf("msie") !== -1;
  isIe9 = agent.indexOf("msie 9") !== -1;
  isOldIe = ((agent.indexOf('msie 7') !== -1) ||
    (agent.indexOf('msie 6') !== -1));
  fullUrl = ("https:" === document.location.protocol ? "https:" : "http:") +
    url;
  type = type || "POST";

  _post = function () {
    var xhr;
    try {
      xhr = null;

      try {
        xhr = new XMLHttpRequest();
      } catch (e1) {

      }

      if (xhr && !isIe) {
        xhr.open(type, fullUrl, true);
      } else if (typeof XDomainRequest !== "undefined") {
        xhr = new XDomainRequest();
        xhr.open(type, fullUrl);
      } else {
        xhr = null;
      }

      try {
        xhr.withCredentials = false;
      } catch (e2) {

      }
      if (xhr.setRequestHeader) {
        xhr.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
      }
      xhr.onload = function () {
        loaded = true;
      };
      xhr.onreadystatechange = function () {};
      xhr.ontimeout = function () {};
      xhr.onerror = function () {};
      xhr.onprogress = function () {};

      xhr.send(data);

    } catch (err) {
      try {
        try {
          q.html.fileLoader.load(fullUrl);
        } catch (err2) {
          if (window.console && window.console.log) {
            window.console.log(err);
          }
        }
      } catch (e) {
      }
    }
    retry();
  };
  if (isOldIe) {
    q.html.fileLoader.load(fullUrl);
    return;
  } else {
    _post();
  }
};
/*EXCLUDE: NO-SEND*/





(function () {
  
  var Utils = qubit.opentag.Utils;
  var log = new qubit.opentag.Log("Ping -> ");
  
  /**
   * #Ping processing class.
   * It requires opentag instance passed to work correctly.
   * 
   * @class qubit.opentag.Ping
   */
  function Ping() {}

  Utils.clazz("qubit.opentag.Ping", Ping);
  
  /**
   * Function sends ping information to the servers.
   * @param {Object} config Container config
   * @param loadTimes {Array} Array of load time elements [time, BaseTag]
   */
  Ping.prototype.send = function (config, loadTimes) { 
    var pingString = 
            "c=" + config.clientId + "&" +
            "p=" + config.containerId + "&" +
            "l=" + config.tellLoadTimesProbability + "&" +
            "pv=" + q.cookie.PageView.update() + "&" +
            "d=";
            
    var pingStrings = [];
    
    for (var i = 0; i < loadTimes.length; i++) {
      var tag = loadTimes[i].tag;
      var loadTime = loadTimes[i].loadTime;
      var loaderId = tag.config.ID;
      
      if (!tag.pingSent && loaderId && loadTime !== null) {
        if (loaderId !== undefined) {
          pingStrings.push('"' + loaderId + '":' + loadTime);
          tag.pingSent = true;
        } else {
          log.WARN("send: tag `" + tag.config.name +
                  "` has no ID assigned! Time load will not be sent.");//L
        }
      } else if (tag.pingSent) {
        log.FINEST("send: ping already sent for `" + tag.config.name +
                "`, ignoring.");//L
      } else if (loadTime === null) {
        log.FINEST("send:tried to send null load times for `" +
                tag.config.name + "`, ignoring.");//L
      }
    }
        
    //sending part
    if (config.pingServerUrl && pingStrings.length > 0) {
      pingString += encodeURIComponent("{" + pingStrings.join(',') + "}");
      var url = "//" + config.pingServerUrl + "/tag2?" + pingString;
      log.FINE("send: sending pings " + url);
      q.html.PostData(url, null, "GET");
    } else {
      if (!pingStrings.length) {
        log.FINE("send: no pings to sent");
      }
      if (!config.pingServerUrl) {
        log.WARN("send: config.pingServerUrl is unset!");
      }
    }
  };
  
  /**
   * Disabled. Function sends error information to servers.
   * @private
   * @param {Object} config
   */
  Ping.prototype.sendErrors = function (config, errors) {
    //@TODO add on-demand errors sending so client can easily invoke 
    //"qubut.opentag.Tags.sendAllErrors()
    log.WARN("Errors sending is disabled.");
//    var loaderId, err, msg, errMsgs = [];
//    
//    for (var i = 0; i < errors.length; i++) {
//      var tag = errors[i];
//      err = errors[loaderId];
//      errMsgs.push("{r: '" + err.reason + "',u:'" + err.url + 
//        "',l:'" + err.lineNumber + "'}");
//    }
//    if (errMsgs.length > 0) {
//      log.INFO("about to send errors: " + errMsgs.join(","));
//
//      msg = "c=" + config.opentagClientId + "&" + 
//        "p=" + config.containerId + "&" +
//        "pv=" + q.cookie.PageView.update() + "&" +
//        "e=" + ("[" + errMsgs.join(",") + "]");
//      if (config.pingServerUrl) {
//        q.html.PostData("//" + config.pingServerUrl + "/tag_err?" +
//          msg, null, "GET");
//      }
//    }
  };

  /*session*/

  /**
   * Function send deduplicated information ping to servers.
   * @param {Object} config
   * @param {Object} tags
   */
  Ping.prototype.sendDedupe = function (config, tags) {
    var pingString = "c=" + config.clientId + "&" +
      "p=" + config.containerId + "&" +
      "l=" + (config.tellLoadTimesProbability) + "&" +
      "pv=" + q.cookie.PageView.update() + "&" +
      "dd=";

    var pingStrings = [];

    for (var i = 0; i < tags.length; i++) {
      var tag = tags[i];
      var loaderId = tag.config.ID;

      if (loaderId === undefined) {
        log.WARN("sendDedupe: tag `" + tag.config.name +
                "` has no ID assigned! Deduplicaton time load " +//L
                "will not be sent.");//L
      } else if (!tag.dedupePingSent) {
        pingStrings.push(loaderId);
        tag.dedupePingSent = true;
      }
    }

    if (pingStrings.length > 0 && config.pingServerUrl) {
      pingString += encodeURIComponent("[" + pingStrings.join(',') + "]");
      q.html.PostData("//" + config.pingServerUrl + 
        "/tag2?" + pingString, null, "GET");
    } else {
      if (!pingStrings.length) {
        log.FINE("sendDedupe: no dedupe pings to sent");
      }
      if (!config.pingServerUrl) {
        log.WARN("sendDedupe: config.pingServerUrl is unset!");
      }
    }
  };
  
  /*~session*/
  }());
/*EXCLUDE: SESSION*/



q.cookie.SimpleSessionCounter = {};
//Qubit Session Tracker
q.cookie.SimpleSessionCounter._cookieName = "_qst_s";
q.cookie.SimpleSessionCounter._sessionCookie = "_qsst_s";
q.cookie.SimpleSessionCounter.update = function (domain) {
  var c, s, ga, mins = 30;
  c = qubit.Cookie.get(q.cookie.SimpleSessionCounter._cookieName, true);
  s = qubit.Cookie.get(q.cookie.SimpleSessionCounter._sessionCookie, true);
  if (!c) {
    c = 1;
  } else {
    c = parseInt(c, 10);
    if (!s || (parseInt(s, 10) < (new Date().getTime() - mins * 60 * 1000))) {
      c += 1;
    }
  }
  qubit.Cookie.set(q.cookie.SimpleSessionCounter._cookieName, 
    c, 365, domain, true);
  qubit.Cookie.set(q.cookie.SimpleSessionCounter._sessionCookie, 
    new Date().getTime().toString(), null, domain, true);
  return c;
};
/*EXCLUDE: JSON*/
/*
    http://www.JSON.org/json2.js
    2011-02-23

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, strict: false, regexp: false */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

var JSON = {};
// ALWAYS OVERWRITE JSON LOCALLY, ASSUME THIS FILE WILL ALWAYS BE IN CLOSURE
// if (!JSON || window.forceJSONRewrite) {
//     JSON = {};
// }

(function () {
    "use strict";

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    // PROTECTING AGAINST PROTOTYPE.JS
    // don't rely on Date, Number, String and Boolean prototypes
    
    // if (typeof Date.prototype.toJSON !== 'function') {

    //     Date.prototype.toJSON = function (key) {

    //         return isFinite(this.valueOf()) ?
    //             this.getUTCFullYear()     + '-' +
    //             f(this.getUTCMonth() + 1) + '-' +
    //             f(this.getUTCDate())      + 'T' +
    //             f(this.getUTCHours())     + ':' +
    //             f(this.getUTCMinutes())   + ':' +
    //             f(this.getUTCSeconds())   + 'Z' : null;
    //     };

    //     String.prototype.toJSON      =
    //         Number.prototype.toJSON  =
    //         Boolean.prototype.toJSON = function (key) {
    //             return this.valueOf();
    //         };
    // }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string' ? c :
                '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }

    // PROTECTION AGAINST PROTOTYPE.JS
    // we'll use this function to stringify Date
    function stringifyDate(key) {
        return isFinite(key.valueOf()) ?
            key.getUTCFullYear()     + '-' +
            f(key.getUTCMonth() + 1) + '-' +
            f(key.getUTCDate())      + 'T' +
            f(key.getUTCHours())     + ':' +
            f(key.getUTCMinutes())   + ':' +
            f(key.getUTCSeconds())   + 'Z' : null;
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];


        // PROTECTION AGAINST PROTOTYPE.JS
        // don't call value.toJSON, only specially treat Date, Number, String and Boolean

// If the value has a toJSON method, call it to obtain a replacement value.

        // if (value && typeof value === 'object' &&
        //         typeof value.toJSON === 'function') {
        //     value = value.toJSON(key);
        // }

        if (value instanceof Date) {
            value = stringifyDate(value);
        } else if ((value instanceof String) || (value instanceof Number) || (value instanceof Boolean)) {
            value = value.valueOf();
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0 ? '[]' : gap ?
                    '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
                    '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0 ? '{}' : gap ?
                '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
                '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function' ?
                    walk({'': j}, '') : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());




(function(){
  var Define = qubit.Define;
  var Cookie = qubit.Cookie;
  
  //order matters!
  //make sure that replacement char does not equal to first character of
  //any coded words!
  //exclude also: \_, \N, \+, \*, \T, \C
  var definitions = [
    ["www\.google\.co",   "G"],
    ["\"landing\":",   "L"],
    ["\"time\":",   "A"],
    ["\"url\":",   "U"],
    ["\"sessionStartTime\":",  "S"],
    ["\"pageViews\":",  "P"],
    ["\"sessionCount\":",  "B"],
    ["\"sessionLandingPage\":",  "E"],
    ["\"referrer\":",  "R"],
    ["\"url\":\"http://www.",  "J"],
    ["\"url\":\"https://www.",  "M"],
    ["http://www\.",   "W"],
    ["https://www\.",   "V"],
    ["%2Fen%2Ftsuk%2F",  "K"],
    ["http%3A%2F%2Fwww",  "F"],
    ["http%3A%2F%2F",  "D"],
    ["http://",   "H"],
    ["https://",   "X"],
    [".co.uk/",  "Q"],
    [".co.uk",  "O"]
  ];
  
  function prepareDefinitions(array) {
    var definitions = [];
    for (var i = 0; i < array.length; i++) {
      definitions.push([new RegExp(array[i][0], "g"), "\\" + array[i][1]]);
    }
    return definitions;
  };
  
  function getDefinitionByChar(ch, definitions) {
    for (var i = 0; i < definitions.length; i++) {
      if (definitions[i][1] === ch) {
        return definitions[i][0];
      }
    }
    return null;
  }
  
  var regexDefinitions = prepareDefinitions(definitions);
  
  /**
   * @class qubit.opentag.compression.Encoder
   * 
   * Opentag session cookie encoding class. It is used instead of 
   * encodeURIComponent/escape functions.
   * It has much shorter output than standard encoders.
   * It also encodes common names found in session JSON object.
   * 
   * @param {Object} config standard config object to construct instance.
   *        Empty.
   */
  function Encoder (config) {
    /**
     * @cfg {Array} definitions Array of definition arrays. Eachy element
     * is an array containing RegExp instance and replacement string.
     * This array is used as addition to decode strings.
     * By default it is opentag session object optimized.
     * Definitions rules: 
     * 
     *    1) replacement string starts with \
     *    2) Next character is a single value
     *    3) The character cannot be first char of any words from definitions
     *    4) No numbers can be used or a dot (reserved for UTF)
     * 
     */
    this._regexDefs = regexDefinitions;
    this._defs = definitions;
    
    if (config) {
      if (config.definitions) {
        this._regexDefs = prepareDefinitions(config.definitions);
        this._defs = config.definitions;
      }
    }
  }
  
  Define.clazz("qubit.opentag.compression.Encoder", Encoder);
  
  /**
   * Function is a custom encoding function with specific support for 
   * opentag session object.
   * @param {String} string to encode
   * @param {Boolean} noutf if true, utf long chars will not be encoded
   * @returns {String} encoded string. 
   */
  Encoder.prototype.encode = function encode(string, noutf) {
    // one rule: 
    // replacement char cannot be first char of any words and
    // no numbers or dot!!!
    var res = string.replace(/\\/g, "\\\\");
    
    var ddict = dynamicDictionary(res);
    
    for (var i = 0; i < this._regexDefs.length; i++) {
      var pair = this._regexDefs[i];
      res = res.replace(pair[0], pair[1]);
    }
    
    res = res.replace(/;/g, "\\*");
    res = res.replace(/=/g, "\\+");
    res = res.replace(/\n/g, "\\N");
    res = res.replace(/ /g, "\\_");
    res = res.replace(/\t/g, "\\T");
    res = res.replace(/,/g, "\\C");
    // actually space is fine, just trimming occurs
    // @TODO: add \12345 numbers as encoding, so UTF chars can be added.
    
    var actualDict = [];
    for (var i = 0, j = 0; i < ddict.length; i++) {
      //new regex is expensive operation
      var pattern = ddict[i][0];
      var rx = new RegExp(escapeRegExp(pattern), 'g');
      var out = res.replace(rx, "\\" + j + "-");
      if (out !== res) {
        actualDict.push(ddict[i][0]);
        j++;
        res = out;
      }
    }

    if (!noutf) {
      var rewrite = [];
      for (var i = 0; i < res.length; i++) {
        if (!Cookie.cookieAlphabetMap.hasOwnProperty(res.charAt(i))) {
          rewrite.push("\\" + res.charCodeAt(i) + ".");
        } else {
          rewrite.push(res.charAt(i));
        }
      }
      res = rewrite.join("");
    }
    
    if (actualDict.length > 0) {
      return "Y" + actualDict.join("&") + "?" + res;
    } else {
      return "N" + res;
    }
  };
  
  function escapeRegExp(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  }
  
  var MIN_WORD_LEN = 4;
  var MIN_OCCURENCE_LEN = 2;
  function dynamicDictionary(str) {
    var pts = {};
    var word = "";
    for (var i = 0; i < str.length; i++) {
      var ch = str.charAt(i);
      switch (ch) {
        case "=":
        case "&":
        case "?":
        case "/":
        case ",":
        case ":":
          if (isNaN(pts[word])) {
            pts[word] = str.split(word).length - 1;
          }
          word = "";
          break;
        default:
          word += ch;
          break;
      }
    }
    var dict = [];
    for (var prop in pts) {
      if (pts.hasOwnProperty(prop)) {
        var ocr = pts[prop];
        if (ocr >= MIN_OCCURENCE_LEN && prop.length >= MIN_WORD_LEN) {
          dict.push([prop, ocr]);
        }
      }
    }

    dict = dict.sort(function(a, b) {
      if (a[0].length === b[0].length) {
        return 0;
      }
      if (b[0].length > a[0].length) {
        return 1;
      } else {
        return -1;
      }
    });

    return dict;
  }
  
  /**
   * Decoding function of this encoder.
   * 
   * @param {String} string to decode
   * @returns {String} decoded string
   */
  Encoder.prototype.decode = function(string) {
    var ddict = null;
    if (string.charAt(0) === "N") {
      string = string.substring(1);
    } else if (string.charAt(0) === "Y") {
      var qMkIdx = string.indexOf("?");
      if (qMkIdx >= 0) {
        ddict = string.substring(1, qMkIdx);
        ddict = ddict.split("&");
        string = string.substring(qMkIdx + 1);
      }
    }
    
    var res = "";
    var codeWord = false;
    var numbered = false;
    var utfNum = "";
    for (var i = 0; i < string.length; i++) {
      var ch = string.charAt(i);
      if (ch === "\\" || codeWord || numbered) {
        if (codeWord || numbered) {
          codeWord = false;
          if (ch === "\\") {
            res += "\\";
          } else if (ch === "*") {
            res += ";";
          } else if (ch === "+") {
            res += "=";
          } else if (ch === "N") {
            res += "\n";
          } else if (ch === "_") {
            res += " ";
          } else if (ch === "T") {
            res += "\t";
          } else if (ch === "C") {
            res += ",";
          } else if (getDefinitionByChar(ch, this._defs) !== null) {
            var def = getDefinitionByChar(ch, this._defs);
            res += def;
          } else {
            if (!isNaN(+("-"+ch))) {
              //utf code
              numbered = true;
              utfNum = utfNum + ch;
            } else {
              if (numbered) {
                if (ch === ".") {
                  res += String.fromCharCode(+utfNum);
                } else if (ddict && ch === "-") {
                  res += ddict[+utfNum];
                } else {
                  res += "\\" + utfNum + ch;
                }
                utfNum = "";
                numbered = false;
              } else {
                //not a code!
                res += "\\" + ch;
              }
            }
          }
        } else {
          codeWord = true;
        }
      } else {
        res += ch;
      }
    }
    if (utfNum) {
      //last utfNum was uncleared
      res += "\\" + utfNum;
    }
    if (codeWord) {
      //flush empty fflash
      res += "\\";
    }
    return res;
  };
  
})();







(function() {
  var Define = qubit.Define;
  var Cookie = qubit.Cookie;
  var log = new qubit.opentag.Log("CookieCompressor -> ");
  
  var global = Define.global();
  var binSupported = !!global.chrome || (global.mozIndexedDB !== undefined);
  /**
   * @class qubit.opentag.compression.Cookiecompressor
   * 
   * Cookie compressor class. 
   * This class is used to compress opentag session cookie.
   * 
   * @param {Object} config standard config object to construct instance.
   *        Empty.
   */
  function CookieCompressor(config) {
    this.testBinary = true;
    this.binSupported = binSupported;
    
    if (config) {
      log.FINEST("Created compressor instance.");
      /**
       * @property {qubit.compression.Compressor} compressor 
       * instance used for compression and decompression.
       */
      this.compressor = new qubit.compression.Compressor();
      /**
       * @property {qubit.opentag.compression.Encoder} encoder instance used
       * for encodeing and decoding strings.
       */
      this.encoder = new qubit.opentag.compression.Encoder({});
    }
  }

  Define.clazz("qubit.opentag.compression.CookieCompressor", CookieCompressor);
  
  /**
   * Function will compress a string that can be saved as cookie.
   * It also encodes string and makes sure that can be saved as cookie.
   * 
   * It will return string that is a binary content whenever full utf writing 
   * content is successful in the environment (it will be tested for even 
   * those that are not).
   * 
   * It is VERY inneficient to use encodeURIComponent together with this 
   * function. This function already provides encoded string and extra encoding
   * will cause waste of text space.
   * 
   * @param {String} string
   * @param {Boolean} forceCompression if true, C type compression will be 
   * enforced. C type compression occures when two conditions occure:
   * 
   *    1) it pays off - output is smaller than encoded input)
   * 
   *    2) binary save is not possible
   * 
   * @returns {String} compressed string
   */
  CookieCompressor.prototype.compress = function(string, forceCompression) {
    if (typeof(string) !== "string" || string === "") {
      return string;
    }
    log.FINEST("Compressing...");
    var res;
    var encoded = this.encoder.encode(string);
    
    if (this.binSupported) {
      var bin = this.compressor.compress(encoded);
      res = this.encoder.encode(bin, true);
      log.FINEST("Binary compression ratio: " + (res.length/string.length));
      return "B" + res;
    } else if (this.testBinary) {
      var bin = this.compressor.compress(encoded);
      res = this.encoder.encode(bin, true);
      
      Cookie.set("__qtag_test_bin__", res);
      var o = Cookie.get("__qtag_test_bin__");
      Cookie.rm("__qtag_test_bin__");
      
      if (o === res) {
        log.FINEST("Binary compression ratio: " + (res.length/string.length));
        return "B" + res;
      } else {
        log.FINEST("Binary cookie saving trial failed.");
      }
    }
    
    var compressed = this.compressor.compressAnsi(encoded);
    if ((!forceCompression) && encoded.length <= compressed.length) {
      res = "E" + encoded;
    } else {
      res = "C" + compressed;
    }
    log.FINEST("Compression ratio: " + (res.length/string.length));
    return res;
  };

  /**
   * Decompresses any string that is compressed with this class 
   * compress function.
   * 
   * @param {String} string compressed string
   * @returns {String} resulting string
   */
  CookieCompressor.prototype.decompress = function(string) {
    if (typeof(string) !== "string" || string === "") {
      return string;
    }
    log.FINEST("Decompressing...");
    var code = string.charAt(0);
    string = string.substring(1);
    
    switch (code) {
      case "E":
        return this.encoder.decode(string);
      case "C":
        var tmp = this.compressor.decompressAnsi(string);
        return this.encoder.decode(tmp);
      case "B":
        var tmp = this.compressor.decompress(this.encoder.decode(string));
        return this.encoder.decode(tmp);
      default:
        throw "This code is not supported! Code: " + code;
    }
  };
})();
/*EXCLUDE: SESSION*/







(function () {

  var Cookie = qubit.Cookie;
  var Utils = qubit.opentag.Utils;
    
  var log = new qubit.opentag.Log("Session -> ");
  
  /**
   * #Session utilities class.
   * 
   * Session object is a simple class for managing session for opentag.

   * @class qubit.opentag.Session
   * @singleton
   */
  var Session = function () {};
  
  Utils.clazz("qubit.opentag.Session", Session);

  var compressor = new qubit.opentag.compression.CookieCompressor({});

  /**
   * Utility function to read compressed cookie.
   * 
   * @param {String} name cookie name
   * @returns {String} decompressed cookie
   */
  Session.readCompressedCookie = function (name) {
    var cookie = Cookie.get(name);
    return compressor.decompress(cookie);
  };
  
  /**
   * Function used to setup the session object.
   * 
   * @param {Object} config session configuration object
   * @returns {Object} session object.
   */
  Session.setupSession = function (config) {
    var session, i, cookie, cookieText, cookieName, now;
    session = {};
    session.sessionCount = q.cookie.SimpleSessionCounter
            .update(config.cookieDomain);
    
    cookieName = "qtag_" + config.containerId;
    var xCookieName = "x_qtag_" + config.containerId;
    
    // compat for non compressed cookie, historical compability, remove this
    // code after 15th of Sep 2015
    cookie = Cookie.get(cookieName, true);
    var nonCompressedCookie = !!cookie;
    
    if (cookie === null) {
      cookie = Cookie.get(xCookieName);
      cookie = compressor.decompress(cookie);
    }

    if (cookie) {
      try {
        cookie = JSON.parse(cookie);
      } catch (e) {
        cookie = {
          sc: 0,
          sessionCount: 0,
          pageViews: 0,
          sessionStartTime: 0,
          referrer: [],
          sessionLandingPage: "",
          __v: {}
        };
      }
    } else {
      cookie = {
        sc: 0,
        sessionCount: 0,
        pageViews: 0,
        sessionStartTime: 0,
        referrer: [],
        sessionLandingPage: "",
        __v: {}
      };
    }
    
    now = new Date().getTime();
    
    //At this point session.sessionCount is from SimpleSessionCounter
    //cookie.sc is the last simpleSessionCounter result we have
    //we do this to see if there is a change in it
    if (session.sessionCount !== parseInt(cookie.sc, 10)) {
      cookie.sessionStartTime = now;
      cookie.sc = session.sessionCount;
      cookie.sessionCount += 1;
      cookie.referrer.push({
        url: Session.getReferrer(),
        landing: Utils.getUrl().substring(0, 300),
        time: now
      });
      cookie.sessionLandingPage = Utils.getUrl().substring(0, 300);
    } else if (Session.isReferrerDifferent()) {
      //If the referrer is different, then update it.
      if (!Session
              .referrerIsSameAsPrevious(cookie.referrer, now, 30 * 60 * 1000)) {
        cookie.referrer.push({
          url: Session.getReferrer(),
          landing: Utils.getUrl().substring(0, 300),
          time: now
        });
        cookie.sessionLandingPage = Utils.getUrl().substring(0, 300);
        cookie.sessionStartTime = now;
        cookie.sessionCount += 1;
      }
    }
    //Always set the saved session count to be the used sessionCount
    session.sessionCount = cookie.sessionCount;
    session.sessionStartTime = cookie.sessionStartTime;
    session.pageStartTime = now;
    cookie.pageViews += 1;
    session.pageViews = cookie.pageViews;
    session.sessionLandingPage = cookie.sessionLandingPage;

    session.referrer = cookie.referrer;
    if (session.referrer.length > 5) {
      session.referrer.splice(2, session.referrer.length - 5);
    }

    cookieText = JSON.stringify(cookie);

    i = 0;

    while ((compressor.compress(cookieText).length > config.maxCookieLength)
            && (i < 5)) {
      if (cookie.referrer.length >= 3) {
        cookie.referrer.splice(2, 1);
      } else if (cookie.referrer.length === 2) {
        cookie.referrer = [cookie.referrer[0]];
      } else if (cookie.referrer.length === 1) {
        cookie.referrer = [];
      }
      cookieText = JSON.stringify(cookie);
      i += 1;
    }

    session.referrer = cookie.referrer;
    
    if (nonCompressedCookie) {
      //remove old cookie if exists
      Cookie.rm(cookieName);
    }
    
    var xCookieText = compressor.compress(cookieText);
    Cookie.rm(xCookieName);
    Cookie.set(xCookieName, xCookieText, 365, config.cookieDomain);

    session.setVariable = function (key, value, time) {
      var t = (!!time) ? time : 0;
      cookie.__v[key] = [value, t];
      var xCookieText = compressor.compress(JSON.stringify(cookie));
      Cookie.set(xCookieName, xCookieText, 365, config.cookieDomain);
    };
    
    session.getCookie = function (name, compressed) {
      var res = Cookie.get(name); //get encoded
      if (res && (compressed || name.indexOf("x_") === 0)) {
        log.FINE("getCookie() : Comressed cookie accessed:\n" +
                name + "=" + res);//L
        try {
          res = compressor.decompress(res);
        } catch (ex) {
          log.ERROR("Cookie failed to decompress: " + ex);
        }
      } else {
        //apply decoding
        res = Cookie.decode(res);
      }
      return res;
    };
    
    session.getVariable = function (key) {
      var v, t, now;
      v = cookie.__v[key];
      if (v) {
        t = v[1];
        if ((t === 0) || (t > new Date().getTime())) {
          return v[0];
        }
      }
      return null;
    };
    
    session.on = function (event, el, fn) {
      if (el.attachEvent) {
        el.attachEvent("on" + event, fn);
      } else if (el.addEventListener) {
        el.addEventListener(event, fn, false);
      }
    };
    return session;
  };
  
  /**
   * Function check current refferer is same as last one.
   * 
   * @param {Array} referrers
   * @param {Date} now
   * @param {Number} overlapDuration
   * @returns {Boolean}
   */
  Session.referrerIsSameAsPrevious = function (referrers, now, overlapDuration) {
    var url, landing, lastReferrer;
    if (referrers.length > 0) {
      url = Session.getReferrer();
      landing = Utils.getUrl().substring(0, 300);
      lastReferrer = referrers[referrers.length - 1];

      return (lastReferrer.url === url) && 
        (lastReferrer.landing === landing) && 
        ((lastReferrer.time + overlapDuration) > now);
    }
    return false;
  };
  
  /**
   * Checks if page referrer is different from this domain.
   * 
   * @returns {Boolean}
   */
  Session.isReferrerDifferent = function () {
    var start, end, ref;
    ref = Session.getReferrer();
    start = ref.indexOf("://");
    //If it can't find a protocol, something weird is going on. 
    //Return it and track it on the server.
    if (start === -1) {
      return true;
    }
    start += 3;
    try {
      if (ref.substring(start).indexOf(Session.getDomain()) !== 0) {
        return true;
      }
      return false;
    } catch (ex) {
      return true;
    }
  };

  /**
   * Gets referrer for page.
   * @returns {String}
   */
  Session.getReferrer = function () {
    if (document.referrer) {
      return document.referrer.substring(0, 300);
    }
    return "direct";
  };

/**
 * Gets host domain.
 * @returns {String}
 */
  Session.getDomain = function () {
    return document.location.host;
  };

}());










/*
 * TagSDK, a tag development platform
 * Copyright 2013-2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function(){
  var Utils = qubit.opentag.Utils;
  var BaseFilter = qubit.opentag.filter.BaseFilter;
  var BaseTag = qubit.opentag.BaseTag;
  var Timed = qubit.opentag.Timed;
  var Tags = qubit.opentag.Tags;
  var Session = qubit.opentag.Session;//:session
  var Cookie = qubit.Cookie;
  var log = new qubit.opentag.Log("Container -> ");

  var _counter = 1;

/* Consent hack from old qtag - will be updated by requires renewing consent.
 * @TODO seriously, clean this up in opentag! use global not window
 * Compatibility layer.
 */
  window.opentag_consentGiven = function () {
    Container.consentIsGiven = true;
    var all = Container.getContainers();
    for (var i = 0; i < all.length; i++) {
      try {
        all[i].run();
      } catch (ex) {
        log.ERROR("error running consent dependant containers: " + ex);
      }
    }
  }.bind(this);
  
  /**
   * #Tags Container class
   * Tags are normally grouped into container objects which define some of
   * the rules that apply to tags during load time.
   * 
   * Container object corresponds directly to the container object in 
   * [Opentag](http://opentag.qubitproducts.com/QDashboard).
   * 
   * Container loading engine controls which and how tag's will be run, it will 
   * also monitor tag's state and transmit statistical information (wherever it 
   * applies) for opentag.
   * 
   * Example of usage:
   *
   *       var aContainer =  new qubit.opentag.Container({
        maxCookieLength: 2500,
        delayDocWrite: true,
        name: "Container A",
        tellLoadTimesProbability: true,
        trackSession: true
      });
  
      var tag = new qubit.opentag.LibraryTag({
        name: "Library Tag A",
        url: "http://code.jquery.com/jquery.js",
        script: "alert('Hello world!')"
      });
  
      aContainer.registerTag(tag);
      aContainer.run();
  
   * To use container, first instance must be creatyed. Before running 
   * container, all tags must be registered that container will manage (and run).
   * 
   * See config object properties for configuration details.
   * 
   * 
   * @class qubit.opentag.Container
   * @param config {Object} config object used to build instance
   * 
   */
  function Container (config) {
    this.runQueue = [];
    /*log*/
    this.log = new qubit.opentag.Log("", function () {
      return this.CLASS_NAME + "[" + this.config.name + "]";
    }.bind(this), true);
    /*~log*/
    
    /**
     * Tags that are bound to this container.
     * @property {Object} tags Map of qubit.opentag.BaseTag
     */
    this.tags = {};

    this.config = {/*CFG*/
      /**
       * @cfg {String} [cookieDomain=""]
       * A cookie domain used if you page uses subdomains.
       * Typically you will want to leave it empty or set it to
       * ".masterdomain.com" like.
       */
      cookieDomain: "",
      /**
       * @cfg {Number} [maxCookieLength=3000]
       * Maximum cookie length to be used by this tag. Set it to lower value
       * if serving pages use very long cookies.
       */
      maxCookieLength: 1000,
      /**
       * @cfg {Boolean} [gzip=true]
       * True by default, indicates if tags should be zipped with gzip standard.
       */
      gzip: true,
      /**
      * @cfg {Boolean} [delayDocWrite=false]
      * Indicates if all document.write calls should be delayed till entire 
      * document is loaded. Default is false.
      */
      delayDocWrite: false,
      /**
       * @cfg {String} [clientId=""]
       * A client ID associated with this container.
       * Its old opentagClientId value.
       * Client ID, it is required for correct pings to be sent [ping]
       */
      clientId: "",
      /**
       * @cfg name
       * Profile name (same as old profileName).
       * [ping]
       */
      name: "",
      /**
       * @cfg
       * Seems that this setting triggers propability of isTellingLoadTimes
       * being set to true. You can choose values from 0.0 to 1.0 (float).
       * Old tellLoadTimesProbability [ping]
       */
      tellLoadTimesProbability: 0,
      /**
       * @cfg {String} [pingServerUrl=null]
       * Ping server url setting. Statistic submission will not work without
       * this parameter being set.
       * Old pingServerUrl.
       */
      pingServerUrl: null,
      /**
       * @cfg {Boolean} [trackSession=false]
       * Indicates if container should track session.
       * Old opentag_track_session.
       */
      trackSession: false,
      /**
       * @cfg {String} [containerId=""]
       * Container DB ID. This vaue is required for ping and session to work.
       * work.
       */
      containerId: ""
    };/*~CFG*/
    
    /**
     * @protected
     * @property {Boolean} [ignoreTagsState=false]
     * If set to true, container will ignore any of tags state against consent
     * information and load all the tag as normal.
     * This property is mostly used for debugging purposes.
     */
    this.ignoreTagsState = false;
    
    if (config) {
      this.setConfig(config);
      /**
       * Property indicates if tag is telling load times. Tag's
       * implementation does attach timestamps for all their loading.
       * This property is used to indicate if loading times will be reported
       * by this container.
       * Value of this property is likely to be randomised, you should adjust 
       * `this.config.tellLoadTimesProbability` instead.
       * @protected
       * @property isTellingLoadTimes
       * @type Boolean
       */
      this.isTellingLoadTimes =
          this.config.tellLoadTimesProbability > Math.random();
      
      if (!config.name) {
        this.config.name = "Cont-" + _counter++;
      }
      
      Container.register(this);
      this.log.FINE("container registered.");
      /*no-send*/
      this.ping = new qubit.opentag.Ping(this.config);
      /*~no-send*/
      /*session*///@TODO add maybe better session condition here(much better...)  
      if (this.config.trackSession) {
        this.session = Session.setupSession(this.config);
      }
      if (this.session) {
        this.log.INFO("Session attached:");
        this.log.INFO(this.session, true);
      }
      /*~session*/
    }
    
    return this;
  }

  Utils.clazz("qubit.opentag.Container", Container);

  var containers = [];
  /**
   *  Registering container function.
   *  By default each container instance is immediately registered in a global 
   *  registry, to access global registry call:
   *
   *     qubit.opentag.Container.getContainers();
   * 
   * @static
   * @param {qubit.opentag.Container} ref
   */
  Container.register = function (ref) {
    Utils.addToArrayIfNotExist(containers, ref);
  };
  
  /**
   * Function used to unregister container from global registry.
   */
  Container.prototype.unregister = function () {
    Container.unregister(this);
  };

  /**
   * @static
   * Unregister method for container. useful for debugging.
   * See `Container.register()` for more details.
   * @param {qubit.opentag.Container} ref
   */
  Container.unregister = function (ref) {
    Utils.addToArrayIfNotExist(containers, ref);
    log.FINEST("Un-registering container named \"" +
            ref.config.name + "\", instance of:");//L
    log.FINEST(ref, true);
    var index = Utils.removeFromArray(containers, ref);
    if (!index || index.length === 0) {
      log.FINE("container is already unregisterd.");
    }
  };

  /**
   * Tells if user has accepted the consent (by defaults checks cookie).
   * @returns {Boolean}
   */
  Container.prototype.hasConsent = function () {
    return Cookie.get("qubitconsent", true) === "Accepted";
  };

  /**
   * Registering container function. Same as `Container.register()` but applies
   * to class instance.
   * @param {qubit.opentag.Container} ref Optional.
   */
  Container.prototype.register = function (ref) {
    Container.register(ref || this);
  };

  /**
   * @static
   * Function returns all registered containers array.
   * @returns {Array}
   */
  Container.getContainers = function () {
    return containers;
  };
  
  /**
   * Function returns all registered containers array.
   * @returns {Array}
   */
  Container.prototype.getContainers = function () {
    return Container.getContainers();
  };
  
  /**
   * Function called wheh tag is registered with this container.
   * @event
   * @param {qubit.opentag.BaseTag} tag
   */
  Container.prototype.onTagRegistered = function (tag) {};
  
  /**
   * Function registering tag instance with this class instance.
   * Registered tag will have validated and possibly injected extra 
   * configuration.
   * Containers register tags **by their name**, and all Container's tags must 
   * have different name.
   * Container will not allow registering tag if there is 
   * already a tag with same name in container (!) - there will not be any 
   * exception thrown but tag will not be added to container!
   * 
   * @param {qubit.opentag.BaseTag} tag
   */
  Container.prototype.registerTag = function (tag) {
    var name = tag.config.name;
    if (this.tags[name]) {
      this.log.FINE("Tag with name `" + name + "` already is registered!");
    } else {
      this.tags[name] = tag;
      try {
        this.onTagRegistered(tag);
      } catch (ex) {
        this.log.ERROR("onTagRegistered exception: " + ex);
      }
    }
  };
  /**
   * Function registering tag instance.
   * It does same job like `registerTag` but the input is an array.
   * @param {Array} tags array of qubit.opentag.BaseTag
   */
  Container.prototype.registerTags = function (tags) {
    for (var i = 0; i < tags.length; i++) {
      this.registerTag(tags[i]);
    }
  };
  
  /**
   * Config setter for current instance.
   * Use this setter as config changes will affect registered tags.
   * It is important to use this function to set any configuration as it may 
   * affect tags registered and this method will remember to update
   * them accordingly.
   * @param {Object} config with values to be set.
   */
  Container.prototype.setConfig = function (config) {
    this.log.FINEST("Setting configuration:");
    this.log.FINEST(config, true);
    for (var prop in config) {
      this.config[prop] = config[prop];
    }
  };
  
  /**
   * Container and tags loading entry point.
   * This method triggers default tags loading, which is running with filters 
   * configuration.
   * To run tags directly, use `runWithoutFilters()` method.
   */
  Container.prototype.run = function () {
    this.log.FINE("starting loading");
    this.runTags({
      command: "runOnceIfFiltersPass"
    });
  };

  /**
   * Container and tags loading entry point.
   * This method will trigger running all filters without filters check - any 
   * tags awaiting for filter condition will be tried to run WITHOUT that 
   * condition (ie. all filters disabled)!
   */
  Container.prototype.runWithoutFilters = function () {
    this.log.FINE("starting loading");
    this.runTags({
      command: "run"
    });
  };

  /**
   * Function that will find tag by using it's name and return it if found.
   * @param {String} name
   * @returns {qubit.opentag.BaseTag} tag with specified name,
   *  undefined otherwise.
   */
  Container.prototype.getTagByname = function (name) {
    return this.tags[name];
  };
  
  /**
   * Function detecting if TagSDK was loaded synchronously or not.
   * @returns {Boolean}
   */
  Container.prototype.containerScriptLoadedSynchronously = function () {
    var i, ii, script, scripts, src;
    scripts = document.getElementsByTagName("script");
    for (i = 0, ii = scripts.length; i < ii; i += 1) {
      script = scripts[i];
      src = script.getAttribute("src");
      //removed "opentag", white labelling!!!
      if (!!src && (src.indexOf("" + 
          this.config.clientId + "-" + this.config.profileName +
          ".js") > 0)) {
        return (script.getAttribute("async") === null && 
            //handle ie7
            (script.getAttribute("defer") === false ||
            //handle ie8
            script.getAttribute("defer") === "" ||
            //handle chrome/firefox
            script.getAttribute("defer") === null));
      } 
    }
    return true;
  };
  
  /**
   * Function calling tags to start execution.
   * @param config
   */
  Container.prototype.runTags = function (config) {
    if (Container.OFF || Utils.global().QUBIT_CONTAINERS_OFF) {
      this.log.INFO("Container are DISABLED.");
      this.log.INFO("To enable, set Container.OFF to " +
              "true and set QUBIT_CONTAINERS_OFF to false.");//L
      this.log.WARN("Container disabled -will stop here.");
      return;
    }
    
    var containerIsSynchronous = this.containerScriptLoadedSynchronously();
    
    var command = "runIfFiltersPass";
    if (config && config.command) {
      command = config.command;
    }
    /**
     * Timestamp indicating if and when tags running was executed.
     * @property {Number} runningStarted
     * @type Number
     */
    this.runningStarted = new Date().valueOf();
    this.log.FINE("triggering runningStarted at " + this.runningStarted);
    var tagsRunMap = {};
    for (var name in this.tags) {
      try {
        var tag = this.tags[name];
        //ignore tag state or check if clean and unstarted
        if (this.includedToRun(tag)) {
          this.log.FINE("triggering tag named: " + name);
          
          if (!containerIsSynchronous) {
            tag.forceAsynchronous = true;
          }
          
          if (this.config.delayDocWrite) {
            tag.delayDocWrite = true;
          }
            //attach session if necessary
          tag.session = tag.session || this.session;//:session
          //if dependencies are defind, and they are in the container, 
          //try to run them immediately instead of waiting later!
          if (tag.dependencies.length > 0) {
            for (var i = 0; i < tag.dependencies.length; i++) {
              var dependency = tag.dependencies[i];
              var dname = dependency.config.name;
              if(!tagsRunMap[dname] && this.tags[dname]) {
                tagsRunMap[dname] = dependency;
                dependency[command]();
              }
            }
          }
          if (!tagsRunMap[name]) {
            tagsRunMap[name] = tag;
            tag[command]();
          }
        }
      } catch (ex) {
        this.log.ERROR("Error running tag with name '" + name +
                "'.\n Error: " + ex);//L
      }
    }
    this.waitForAllTagsToFinish();
  };

  /**
   * @protected
   * If container can include the tag in running suite.
   * @param {qubit.opentag.BaseTag} tag tag to test if can be included
   * @returns {Boolean}
   */
  Container.prototype.includedToRun = function(tag) {
    if (tag.config.inactive) {
      return false;
    }
    var consentOk = Container.consentIsGiven ||
        (!tag.config.needsConsent) || this.hasConsent();
    var atInitialState = (tag.state === BaseTag.prototype.STATE.INITIAL);
    return this.ignoreTagsState || (consentOk && atInitialState);
  };

  /**
   * @protected
   * Function used to trigger timer that awaits the tags to finish their
   * running.
   */
  Container.prototype.waitForAllTagsToFinish = function () {
    if (this._waitForAllTagsToFinishWaiting) {
      return;
    }
    
    var l = this.log;//L
    var finished = this.allTagsFinished();
    
    if (!this._showFinishedOnce && finished) {
      this._showFinishedOnce = true;
      /**
       * Property telling if and when all tags has been detected to finish
       * thir running.
       * @property runningFinished
       * @type Number
       */
      this.runningFinished = new Date().valueOf();
      
      /*log*/ // let us now print some results
      var results = this.getAllTagsByState();
      var awaitingLen = results.awaiting === null ?
                                  0 : Utils.keys(results.awaiting).length;
      var styling = " ;color: #0F7600;font-size: 12px;font-weight:bold; ";
      
      l.INFO("********************************************************",
        0, styling);
      l.INFO("Startup tags have ended their processing.", 0, styling);

      l.INFO("Finished in " +
          (this.runningFinished - this.runningStarted) + "ms.", 0, styling);
      
      if (results.run) {
        var len = Utils.keys(results.run).length;
        l.INFO("Successfully run tags[" + len + "]:", 0, styling);
        l.INFO(results.run, true);
      } else {
        l.INFO("No successfully run tags.", 0, styling);
      }
      
      if (results.failed) {
        var len = Utils.keys(results.failed).length;
        var addRed = results.failed === null ? "" : "color: #DF5500;";
        l.INFO("Failed to run[" + len + "]:", 0,  styling + addRed);
        l.INFO(results.failed, true);
      } else {
        l.INFO("No failed tags.", 0,  styling);
      }
      
      if (results.awaiting) {
        var len = Utils.keys(results.awaiting).length;
        l.INFO("There is still " + awaitingLen +
                " tag(s) ready to be fired by" +
                " awaiting filters that can run.",
                0, styling + "color: #DC9500;");
        l.INFO("Filter ready tags[" + len + "]:", 0, styling +
                "color: #DC9500;");//L
        l.INFO(results.awaiting, true);
      } else {
        l.INFO("No filter ready tags.", 0, styling);
      }

      if (results.consent) {
        var len = Utils.keys(results.consent).length;
        l.INFO("Consent awaiting tags[" + len + "]:", 0, styling);
        l.INFO(results.consent, true);
      } else {
        l.INFO("No consent awaiting tags.", 0, styling);
      }
      
      if (results.other) {
        var len = Utils.keys(results.other).length;
        l.INFO("Other unloaded tags[" + len + "]:", 0, styling);
        l.INFO(results.other, true);
      } else {
        l.INFO("No unloaded tags.", 0, styling);
      }
      
      l.INFO("********************************************************",
                    0, styling);
      /*~log*/
      
      /*no-send*/
      this.sendPingsNotTooOften();
      /*~no-send*/
      
      if (this.onTagsInitiallyRun) {
        this.onTagsInitiallyRun();
      }
      
    } else if (!finished) {
        this._waitForAllTagsToFinishWaiting = true;
        this._showFinishedOnce = false;
        
        Timed.setTimeout(function () {
          this._waitForAllTagsToFinishWaiting = false;
          this.waitForAllTagsToFinish();
        }.bind(this), 100);
        
    } else {
      l.INFO("********************************************************");
      l.WARN("All tags seem to finished current jobs.");
      l.INFO("********************************************************");
    }
  };
  
  /**
   * @event
   * Event of tags run initially - it will be run when all tags are run initially.
   * Initially means that there still can be tags that have custom starters
   * running thou their load is not finished.
   */
  Container.prototype.onTagsInitiallyRun = EMPTY_FUN;
  
  /**
   * Function will reset all the tags to initial state. After reset all tags can
   * be re-run. Logs are never resetted.
   */
  Container.prototype.resetAllTags = function () {
    log.WARN("reseting all tags!");
    for (var prop in this.tags) {
      if (this.tags.hasOwnProperty(prop)) {
        this.tags[prop].reset();
      }
    }
  };
  
  /**
   * Function reset this container (including it's registered tags).
   */
  Container.prototype.reset = function () {
    log.WARN("reseting container!");
    this.runningFinished = undefined;
    this._waitForAllTagsToFinishWaiting = undefined;
    this.runningStarted = undefined;
    this._showFinishedOnce = undefined;
    this.resetAllTags();
  };
  
  /*no-send*/
  /**
   * Function triggers sending statistical information. It takes special care
   * for how often this process is triggered. No matter how many tags are to be 
   * submitted - the process will be triggered no more often than 
   * 2000 miliseconds.
   */
  Container.prototype.sendPingsNotTooOften = function () {
    this._sndLck = this._sndLck || {};
    Timed.runIfNotScheduled(this.sendPings.bind(this), 2000, this._sndLck);
  };
  
  /**
   * Function sending pings for registered tags. It will check which tags are 
   * ready to be submitted and select them for submission.
   */
  Container.prototype.sendPings = function () {
    if (this.isTellingLoadTimes) {
      var results = this.getAllTagsByState();
      var _this = this;
      var loadTimes;
      
      if (results.run) {
        //send "just run" load times
        loadTimes = Tags.getLoadTimes(results.run);
        this.log.INFO("sending standard load pings");
        this.lastPingsSentTime = new Date().valueOf();
        this.ping.send(this.config, loadTimes);
      }
      
      /*session*/
      //dedupe
      loadTimes = Tags.getLoadTimes();
      var deduplicatedTagsToBeSent = [];
      for (var i = 0; i < loadTimes.length; i++) {
        (function(j) {
          var tag = loadTimes[j].tag;
          if (tag.config.dedupe && tag.sendDedupePing) {
            deduplicatedTagsToBeSent.push(tag);
          }
        }(i));
      }
      if (deduplicatedTagsToBeSent.length > 0) {
        this.log.INFO("sending deduplication pings");
        this.lastDedupePingsSentTime = new Date().valueOf();
        this.ping.sendDedupe(this.config, deduplicatedTagsToBeSent);
      }

      if (results.other) {
        loadTimes = Tags.getLoadTimes(results.other);
        var awaitingTagsToBeSent = [];
        for (var i = 0; i < loadTimes.length; i++) {
          (function(j) {
            var tag = loadTimes[j].tag;
            awaitingTagsToBeSent.push(loadTimes[j]);
            var after = tag.onAfter;
            tag.onAfter = function(success) {
              after.call(tag, success);
              _this.sendPingsNotTooOften();
              if (success) {
                tag.log.INFO("SENDING LOAD STATS");
              }
            };
          }(i));
        }
      }

      if (results.awaiting) {
        loadTimes = Tags.getLoadTimes(results.awaiting);
        var awaitingTagsToBeSent = [];
        for (var i = 0; i < loadTimes.length; i++) {
          (function(j) {
            var tag = loadTimes[j].tag;
            awaitingTagsToBeSent.push(loadTimes[j]);

            var after = tag.onAfter;
            tag.onAfter = function(success) {
              after.call(tag, success);
              _this.sendPingsNotTooOften();
              if (success) {
                tag.log.INFO("SENDING LOAD STATS");
              }
            };
          }(i));
        }

        if (awaitingTagsToBeSent.length > 0) {
          this.ping.send(this.config, awaitingTagsToBeSent);
        }
      }
      /*~session*/
    }
  };
  /*~no-send*/
  /**
   * Function returns ordered tags by:
   * - being executed (run)
   * - failed state (failed)
   * - consent awaiting (consent)
   * - being not executed (other)
   * - being awaiting active, filter delayed etc. (awaiting)
   * @returns {Object} A map containing human friendly named collections.
   */
  Container.prototype.getAllTagsByState = function () {
    return Container.getAllTagsByState(this.tags);
  };
  
  /**
   * @static
   * Function returns ordered tags by:
   * - being executed (run)
   * - failed state (failed)
   * - consent awaiting (consent)
   * - being not executed (other)
   * - being awaiting active, filter delayed etc. (awaiting)
   * @param {qubit.opentag.BaseTag} tags to be used
   * @returns {Object} A map containing human friendly named collections.
   */
  Container.getAllTagsByState = function (tags) {
    var runScripts = null, other = null, filterReady = null, failed = null,
            consent = null;
    
    var FILTERS_FAILED = BaseTag.prototype.STATE.FILTERS_FAILED;
    for (var prop in tags) {
      var tag = tags[prop];
      if (tag instanceof BaseTag) {
        var name = tag.config.name;
        if (tag.scriptExecuted > 0) {
          runScripts = runScripts || {};
          attachRenamedIfExist(runScripts, tag, name);
        } else if (tag.scriptExecuted < 0 || (tag.state > FILTERS_FAILED)) {
            failed = failed || {};
            attachRenamedIfExist(failed, tag, name);
        } else if (tag.filtersState() === BaseFilter.state.SESSION ||
                tag.filtersState() > 0) {
          filterReady = filterReady || {};
          attachRenamedIfExist(filterReady, tag, name);
        } else if (tag.config.needsConsent) {
            //consent needing unloaded
            consent = consent || {};
            attachRenamedIfExist(consent, tag, name);
        } else {
          other = other || {};
          attachRenamedIfExist(other, tag, name);
        }
      }
    }
    
    return {
      run: runScripts,
      failed: failed,
      awaiting: filterReady,
      consent: consent,
      other: other
    };
  };
  
  var steps = {};
  function attachRenamedIfExist(obj, src, name) {
    if (obj[name]) {
      steps[name] = steps[name] || 1;
      name += "(" + steps[name] + ")";
      steps[name]++;
    }
    obj[name] = src;
  }
  
  /**
   * @protected
   * Function detects if all initial tags are finished loading 
   * (excludes SESSION types).
   * This method is mostly used internally or for debugging purposes.
   * @returns {Boolean}
   */
  Container.prototype.allTagsFinished = function () {
    for(var prop in this.tags) {
      if (this.tags.hasOwnProperty(prop)) {
        var tag = this.tags[prop];
        if (tag instanceof qubit.opentag.BaseTag) {
          //tag.filtersState() < 0 === filters are passed
          // === 0 FAILED
          // > 0 filter is awaiting
          var state = tag.filtersState();
          if (tag.filtersState() < 0 &&
                  !(tag.finished() || (tag.config.runner && !tag.isRunning))) {
            if (state !== BaseFilter.state.SESSION) {
              return false;
            }
          }
        }
      }
    }
    return true;
  };
  
  /**
   * Returns all variables associated with this container.
   * @returns {Array} Array of variable instances of 
   * [qubit.opentag.pagevariable.BaseVariable](
     #!/api/qubit.opentag.pagevariable.BaseVariable)
   */
  Container.prototype.getPageVariables = function () {
  var vars = [];
  for (var prop in this.tags) {
    if (this.tags.hasOwnProperty(prop)) {
      var tVars = this.tags[prop].getPageVariables();
      for (var i = 0; i < tVars.length; i++) {
        //for each parameter, get variable instance if not added already
        Utils.addToArrayIfNotExist(vars, tVars[i]);
      }
    }
  }
    return vars;
  };
  
  /**
   * Function used to get all containers page variables instances having the 
   * name as specified.
   * 
   * @param {String} name token name that identifies the variable.
   * @return {qubit.opentag.pagevariable.BaseVariable} 
   *            object qubit.opentag.pagevariable.BaseVariable instance. 
   */
  Container.getPageVariableByName = function (name) {
    var vars = this.getAllPageVariables();
    var rets = [];
    for (var i = 0; i < vars.length; i++) {
      if (vars[i].config.name === name) {
        rets.push(vars[i]);
      }
    }
    return rets;
  };
})();



/*
 * TagSDK, a tag development platform
 * Copyright 2013-2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  var Utils = qubit.opentag.Utils;
  
  /**
   * #Library tag instance class.
   * This class is ment to be extended and used as a Tag Library base 
   * class.
   * 
   * Please see [Start Guide](#!/guide/getting_started)
   * and [Creating Library (Advanced)](#!/guide/creating_library)
   *
   * Please see 
   *  
   * @class qubit.opentag.LibraryTag
   * @extends qubit.opentag.BaseTag
   * @param config {Object} config object used to build instance
   */
  function LibraryTag(config) {
    
    Utils.setIfUnset(config, LibraryTag.defaultConfig);
    
    if (this.singleton) {
      var path = this.PACKAGE_NAME  + "." + this.CLASS_NAME;
      var zuper = 
              qubit.opentag.Utils.getObjectUsingPath(path);
      if (zuper.__instance) {
        zuper.__instance.log.FINEST("Returning singleton instance.");
        return zuper.__instance;
      }
      zuper.__instance = this;
    }
    
    LibraryTag.superclass.call(this, config); 
  }
  
  Utils.clazz("qubit.opentag.LibraryTag", LibraryTag, qubit.opentag.BaseTag);
  
  /**
   * @static
   * Default configuration object.
   * @property {Object}
   */
  LibraryTag.defaultConfig = {
    /*DATA*/
    /**
     * Optional, vendor's name.
     * @cfg {String} [vendor=null]
     */
    vendor: null,
    /**
     * Optional, image URL for library tag this.log. icon.
     * Image should be an 64x64 pixel sized.
     * @cfg {String} [imageUrl=null]
     */
    imageUrl: null,
    /**
     * Library description..
     * @cfg {String} [description="Provide description."]
     */
    description: "Provide description.",
    /**
     * Is library asynchoronous?
     * @cfg {String} [async=true]
     */
    async: false,
    /**
     * Is this a private library? Not published.
     * @cfg {Boolean} [isPrivate=false]
     */
    isPrivate: false,
    /**
     * Library can be notified for version upgrades.
     * @cfg {Boolean} [upgradeable=true]
     */
    upgradeable: true,
    /**
     * HTML content to be appended to the page body
     * @cfg {String} [html=null]
     */
    html: "",
    /**
     * Parameters object.
     * @cfg {String} [parameters=null]
     */
    parameters: [
    ]
  };
  
  /**
   * @event 
   */
  LibraryTag.prototype.pre = function () {
    this.log.FINEST("emtpy pre called");
  };
  
  /**
   * 
   * @event
   */
  LibraryTag.prototype.post = function () {
    this.log.FINEST("emtpy post called");
  };
  
  /**
   * Callback triggered always before loading tag.
   * Can be called only once, any repeated calls will have no effect.
   */
  LibraryTag.prototype.before = function () {
    LibraryTag.superclass.prototype.before.call(this);
    
    if (this.config.html || this.config.script) {
      log.WARN("config.html or config.script is set while using pre." +
              " Cancelling running pre.");//L
      return false;//continue normally
    }
    
    this.log.INFO("Running PRE script execution...");
    try {
      var cfg = this.config;
      if (cfg && cfg.pre) {
        if (typeof(cfg.pre) === "function") {
          this.pre = cfg.pre;
          this.pre();
        } else {
          var expr = this.replaceTokensWithValues(String(cfg.pre));
          if (this.config.prePostWindowScope) {
            Utils.geval(expr);
          } else {
            this.pre = Utils.expressionToFunction(expr).bind(this);
            this.pre();
          }
        }
      } else {
        this.pre();
      }
    } catch (ex) {
      this.log.ERROR(this.config.name + " exception while running pre: " + ex);
      return true;//cancell running 
    }
    return false;
  };
  
  /**
   * Callback triggered always before loading tag.
   * Can be called only once, any repeated calls will have no effect.
   * @param success if tag execution was successful
   */
  LibraryTag.prototype.after = function (success) {
    LibraryTag.superclass.prototype.after.call(this, success);
    if (this.config.html || this.config.script) {
      log.WARN("config.html or config.script is set while using post." +
              " Cancelling running post.");//L
      return;
    }
    
    this.log.INFO("Running POST script execution...");
    try {
      var cfg = this.config;
      if (cfg && cfg.post) {
        if (typeof(cfg.post) === "function") {
          this.post = cfg.post;
          this.post(success);
        } else {
          var expr = this.replaceTokensWithValues(String(cfg.post));
          if (this.config.prePostWindowScope) {
            Utils.geval(expr);
          } else {
            this.post = Utils.expressionToFunction(expr).bind(this);
            this.post(success);
          }
        }
      } else {
        this.post(success);
      }
    } catch (ex) {
      this.log.ERROR(this.config.name + " exception while running pre: " + ex);
    }
  };
  
  
  /**
   * Utils.defineClass wrapper for LibraryTag.
   * 
   * This method is used to easy define a tag library class. Tag Library class 
   * is any class that extends qubit.opentag.LibraryTag class.
   * 
   * All of the properties passed via `libConfig` object will be put at 
   * new library class proptotype with exception of:
   * 
   * - CONSTRUCTOR This object is a property used to pass a constructor into 
   * the library class. It is unlikely one will need it and its recommended to 
   * be used by advanced users. Constructor is called AFTER `super()` call and 
   * has one argument which is standard configuration object.
   * 
   * This function also supports `singlerton` option, pass `singleton` property
   * to the libConfig to make the library a singleton.
   * 
   * Singleton libraries can be instantiated only once, each repeated 
   * `new` call will return existing instance.
   * 
   * @static
   * @param {String} namespace full class name (with package) 
   * @param {String} libConfig prototype config
   * @return {Function} reference to extended class
   */
  LibraryTag.define = function (namespace, libConfig) {
    namespace = namespace.replace(/^[\.]+/g, "")
      .replace(/[\.]+$/g, "")
      .replace(/\.+/g,".");
    
    //config must be set in runtime - for each instance
    var libraryDefaultConfig = libConfig.config;
    var constr = libConfig.CONSTRUCTOR;
    
    //prepare new config that does not override .config object in Library class
    var prototypeTemplate = {};
   
    for (var prop in libConfig) {
      if (prop !== "config") {
        prototypeTemplate[prop] = libConfig[prop];
      }
    }
    
    //add new constructor
    prototypeTemplate.CONSTRUCTOR = function (cfg) {
      //update instance properties for new defaults
      cfg = cfg || {};
      //@todo repair this
      var defaultsCopy = Utils.objectCopy(libraryDefaultConfig, {maxDeep: 5});
      for(var prop in defaultsCopy) {
        if (!cfg.hasOwnProperty(prop)) {
          cfg[prop] = defaultsCopy[prop];
        }
      }
      // --- standard ---
      //run library standard constructor
      var ret = qubit.opentag.LibraryTag.call(this, cfg);
      //any additional constructor? run it.
      if (constr) {
          constr.call(this, cfg);
      }
      if (ret) {
        return ret;
      }
    };
    
    var ret = qubit.opentag.Utils
            .defineClass(namespace, LibraryTag, prototypeTemplate);
    
    //register them also in qubit scope.
    Utils.namespace("qubit.opentag.libraries." + namespace, ret);
    return ret;
  };
}());



/*
 * TagSDK, a tag development platform
 * Copyright 2013-2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  var Utils = qubit.opentag.Utils;
  
  /**
   * #Class representing custom tag type of a Tag. 
   * It inherits all default behaviour from LibraryTag.
   * 
   * This tag is typically used to run custom configuration tags in Opentag, 
   * it extends LibraryTag implementation and redefines it's default configuration.
   * 
   * Example of simple tag run as direct instance:
   *
        var tag = new qubit.opentag.CustomTag({
          name: "Custom Tag A"
        });
        
        tag.script = function () {
          alert("Hello World!");
        };
        
        tag.run();

   *  
   * See config properties for more details on configuration.
   * 
   * 
   * @class qubit.opentag.CustomTag
   * @extends qubit.opentag.BaseTag
   * @param config {Object} config object used to build instance
   */
  function CustomTag(config) {
    var defaults = {
      url: null,
      html: "",
      locationPlaceHolder: "NOT_END",
      locationObject: "BODY",
      prePostWindowScope: true,
      async: true
    };
    
    Utils.setIfUnset(config, defaults);
    
    CustomTag.superclass.call(this, config);
  }
  
  Utils.clazz("qubit.opentag.CustomTag", CustomTag, qubit.opentag.LibraryTag);
}());


/*
 * TagSDK, a tag development platform
 * Copyright 2013-2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  var Utils = qubit.opentag.Utils;
  
  /**
   * #PatternType static class.
   * 
   * This is a map for URL pattern types with descriptive names.
   * 
   * 
   * @class qubit.opentag.filter.pattern.PatternType
   * @singleton
   * @type Object
   */
  var PatternType = {
    /**
     * @property {Object} CONTAINS
     */
    CONTAINS: "Contains",
    /**
     * @property {Object} MATCHES_EXACTLY
     */
    MATCHES_EXACTLY: "Matches Exactly",
    /**
     * @property {Object} STARTS_WITH
     */
    STARTS_WITH: "Starts with",
    /**
     * @property {Object} ENDS_WITH
     */
    ENDS_WITH: "Ends with",
    /**
     * @property {Object} REGULAR_EXPRESSION
     */
    REGULAR_EXPRESSION: "Regular Expression",
    /**
     * @property {Object} ALL_URLS
     */
    ALL_URLS: "All URLs"
  };
  
  Utils.namespace("qubit.opentag.filter.pattern.PatternType", PatternType);
}());








/*
 * TagSDK, a tag development platform
 * Copyright 2013-2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  var Utils = qubit.opentag.Utils;
  var BaseFilter = qubit.opentag.filter.BaseFilter;
  var Timed = qubit.opentag.Timed;
  var PatternType = qubit.opentag.filter.pattern.PatternType;
    
  /**
   * #URLFilter filter class.
   * 
   * This filter class implements various URL matching patterns, see
   * [PatternType](#!/api/qubit.opentag.filter.pattern.PatternType) class
   * for more details.
   * 
   * 
   * @class qubit.opentag.filter.URLFilter
   * @extends qubit.opentag.filter.BaseFilter
   * @param config {Object} config object used to build instance
   */
  function URLFilter(config) {
    this._lockObject = {};
    var defaultConfig = {
      /**
       * Pattern type. See qubit.opentag.filter.pattern.PatternType for more 
       * choices. Defaults to PatternType.CONTAINS.
       * @cfg {String}
       */
      patternType: PatternType.CONTAINS,
      /**
       * URL pattern that this filter will match
       * @cfg {String}
       */
      pattern: ""
    };
    
    if (config) {
      for(var prop in config) {
        if (config.hasOwnProperty(prop)) {
          defaultConfig[prop] = config[prop];
        }
      }
    }
    
    URLFilter.superclass.call(this, defaultConfig);
  }
  
  Utils.clazz("qubit.opentag.filter.URLFilter", URLFilter, BaseFilter);
  
  /**
   * URL getting wrapper.
   * By default (no arguments) it uses 
   * [Utils.getUrl()](#!/api/qubit.opentag.Utils) to get page URL.
   * @param {String} url Use to everride default behaviour, and use url instead 
   * [Utils](#!/api/qubit.opentag.Utils) utility.
   * @returns {String} URL string
   */
  URLFilter.prototype.getURL = function (url) {
    return url || Utils.getUrl();
  };
  
  /**
   * Filter match function. This function determines if given URL (or default)
   * matches the pattern defined in configuration.
   * 
   * @param {String} url url string (optional), normally document's is used
   * @returns {Boolean} url optional url to be given to run match on.
   */
  URLFilter.prototype.match = function (url) {
    url = this.getURL(url);
    var match = true; //be optimist
    var pattern = this.config.pattern;
    
    switch (this.config.patternType) {
      case PatternType.CONTAINS:
        match = (url.toLowerCase().indexOf(pattern.toLowerCase()) >= 0);
        break;
      case PatternType.MATCHES_EXACTLY:
        match = (url.toLowerCase() === this.config.pattern.toLowerCase());
        break;
      case PatternType.STARTS_WITH:
        match = (url.toLowerCase().indexOf(pattern.toLowerCase()) === 0);
        break;
      case PatternType.ENDS_WITH:
        match = ((url.lastIndexOf(pattern.toLowerCase()) + pattern.length) ===
                   url.length);
        break;
      case PatternType.REGULAR_EXPRESSION:
        match = new RegExp(pattern).test(url);
        break;
      case PatternType.ALL_URLS:
        match = true;
        break;
    }
    /*log*/
    Timed.maxFrequent(function() {
      this.log.FINEST("[ Filter " + this.config.name +
              "] Checking if patternType '" +//L
              this.config.patternType + "' match '" +//L
              pattern + "' pattern: " +//L
              (match ? ("Yes -> " + match) : "No") +//L
              ", include: " + (this.config.include));//L
    }.bind(this), 1000, this._lockObject);
    /*~log*/
    return match;
  };
  
}());














/*
 * TagSDK, a tag development platform
 * Copyright 2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function() {
  var Utils = qubit.opentag.Utils;
  var PatternType = qubit.opentag.filter.pattern.PatternType;
  var URLFilter = qubit.opentag.filter.URLFilter;
  var SessionVariableFilter = qubit.opentag.filter.SessionVariableFilter;
  var LibraryTag = qubit.opentag.LibraryTag;
  var CustomTag = qubit.opentag.CustomTag;
  var DOMText = qubit.opentag.pagevariable.DOMText;
  var BaseVariable = qubit.opentag.pagevariable.BaseVariable;
  var URLQuery = qubit.opentag.pagevariable.URLQuery;
  var Cookie = qubit.opentag.pagevariable.Cookie;
  var Expression = qubit.opentag.pagevariable.Expression;
  
  var log = new qubit.opentag.Log("OldTagRunner -> ");
  
  /**
   * @private
   * #Old tag configuratrion runner class.
   * 
   * This class is a translation layer between old qtag configuration and 
   * new TagSDK configuration scheme. 
   * This class is used by the compatibility layer in Opentag only.
   * Please refer to the guide pages on how to run tags and use libraries.
   * @class qubit.opentag.compat.OldTagRunner
   * @param config {Object} config object used to build instance
   */
  function OldTagRunner(config) {
    log.INFO("init, config passed:");
    log.INFO(config, true);
    this.config = {
      filters: [],
      profileName: "",
      qTagClientId: "",
      pageVars: {},
      scriptLoaders: {},
      tellLoadTimesProbability: 0,
      pingServerUrl: "",
      qtag_domain: "",
      delayDocWrite: false,
      maxCookieLength: 3000,
      containerName: ""
    };

    /*session*/
    this.config.qtag_track_session = true;
    /*~session*/

    for (var prop in config) {
      if (config.hasOwnProperty(prop)) {
        this.config[prop] = config[prop];
      }
    }
  }
  
  Utils.clazz("qubit.opentag.OldTagRunner", OldTagRunner);
  
  /**
   * Old configuration runner function.
   * This is entry method to parse and create container with all tags definitions. 
   */
  OldTagRunner.prototype.run = function() {
    if (!this._run) {
      this._run = new Date().valueOf();
      log.FINE("entering run");
      this.container = new qubit.opentag.Container({
        cookieDomain: this.config.qtag_domain,
        maxCookieLength: this.config.maxCookieLength,
        delayDocWrite: this.config.delayDocWrite,
        gzip: true,
        clientId: this.config.qTagClientId,
        containerId: this.config.profileName,
        name: this.config.containerName,
        tellLoadTimesProbability: this.config.tellLoadTimesProbability,
        pingServerUrl: this.config.pingServerUrl,
        trackSession: this.config.qtag_track_session
      });
      var tags = this.getTags();
      this.container.registerTags(tags);
      this.container.run();
    }
  };

  /**
   * Function parses configuration and returns new tag instances array.
   * @returns {Array} array of qubit.opentag.BaseTag
   */
  OldTagRunner.prototype.getTags = function () {
    var filters = this.config.filters;
    var tagDefinitions = this.config.scriptLoaders;
    var pageVars = this.config.pageVars;

    var tags = [];

    for (var prop in tagDefinitions) {
      if (tagDefinitions.hasOwnProperty(prop)) {
        var loader = tagDefinitions[prop];
        //property is at same time tag's ID used elsewhere
        
        //collect filters for tag
        var filterDefinitions = findFilters(filters, prop);
        //collect parameters
        var parameterDefinitions = findParameters(loader, pageVars);
        
        //@TODO must decide here! if custom!
        // create instance
        
        var location = "";
        if (loader.locationId === 1) {
          location = "HEAD";
        } else if (loader.locationId === 2) {
          location = "BODY";
        } else if (loader.locationId === 3) {
          location = loader.locationDetail;
        }
        
        var dedupe = loader.dedupe;
        
        var cfg = {
          name: loader.name,
          filters: filterDefinitions,
          parameters: parameterDefinitions,
          ID: loader.id,
          url: loader.url,
          html: loader.html,
          template: !!loader.template,
          locationPlaceHolder: ((+loader.positionId) === 1) ? "NOT_END" : "END",
          locationObject: location,
          async: loader.async,
          needsConsent: loader.needsConsent,
          usesDocumentWrite: loader.usesDocWrite,
          genericDependencies: loader.genericDependencies
        };
        
        if (loader.prePostWindowScope !== undefined) {
          cfg.prePostWindowScope = loader.prePostWindowScope;
        }
        
        if (dedupe) {
          cfg.dedupe = true;
        }
        
        if (loader.runner) {
          cfg.runner = loader.runner;
        }
        
        if (loader.pre) {
          cfg.pre = loader.pre;
        }
        
        if (loader.post) {
          cfg.post = loader.post;
        }
        
        if (loader.script) {
          cfg.script = loader.script;
        }
        
        var tag = null;
        
        if (cfg.template) {
          tag = new LibraryTag(cfg);
        } else {
          tag = new CustomTag(cfg);
        }

        //attach to original "loader" array to pick it at dependencies check
        tagDefinitions[prop].instance = tag;
        
        //add the tag
        tags.push(tag);
      }
    }
    
    //all tags ready, finally, attach dependencies (defined by IDs here)
    for (var prop in tagDefinitions) {
      if (tagDefinitions.hasOwnProperty(prop)) {
        var dependencies = [];
        var loader = tagDefinitions[prop];
        if (loader.dependencies) {
          for (var j = 0; j < loader.dependencies.length; j++) {
            var tagId = loader.dependencies[j];
            var dependency = tagDefinitions[tagId].instance;
            dependencies.push(dependency);
          }
          var tag = loader.instance;
          tag.dependencies = dependencies.concat(tag.dependencies);
        }
      }
    }
    return tags;
  };

  var V_JS_VALUE = "2";
  var V_QUERY_PARAM = "3";
  var V_COOKIE_VALUE = "4";
  var V_ELEMENT_VALUE = "5";
  
  /**
   * Finds parameters for "loader" and attaches its variables found in 
   * `variables`.
   * 
   * @param {Object} loader
   * @param {Object} variables
   * @returns {Array}
   */
  function findParameters(loader, variables) {
    var parameters = loader.pageVars;
    var ret = [];
    for (var prop in parameters) {
      if (parameters.hasOwnProperty(prop)) {
        var param = parameters[prop];
        var variableDefinition = variables[prop];
        
        if (variableDefinition) {
          var variable;
          var varCfg = {
            name: variableDefinition.name,
            value: variableDefinition.value
          };
          
          switch (variableDefinition.type) {
            case V_JS_VALUE: //covers also UV
              variable = new Expression(varCfg);
              break;
            case V_QUERY_PARAM:
              variable = new URLQuery(varCfg);
              break;
            case V_COOKIE_VALUE:
              variable = new Cookie(varCfg);
              break;
            case V_ELEMENT_VALUE:
              variable = new DOMText(varCfg);
              break;
            default:
              variable = new BaseVariable(varCfg);
          }
          
          var parameter = {
            token: param.token
          };
        
          if (param.defaultValue) {
            parameter.defaultValue = param.defaultValue;
          }
          
          if (variable) {
            parameter.variable = variable;
          }
          
          ret.push(parameter);
        }
      }
    }
    return ret;
  };

  var NORMAL_FILTER = "1";
  var DEDUPE_URL_FILTER = "2";
  var DEDUPE_SESSION_FILTER = "3";
  /**
   * @private
   * Filter type getter.
   * @type String
   */
  var getFilterType = function(filter) {
    var x = parseInt(filter.patternType, 10);
    if ((x < 10) || (x === 100)) {
      return NORMAL_FILTER;
    }
    if ((x >= 10) && (x < 20)) {
      return DEDUPE_URL_FILTER;
    }
    if (x === 110) {
      return DEDUPE_SESSION_FILTER;
    }
  };

  /*
   * Function loops through filters for the tag and return a set of filters
   *  belonging to tags scripts.
   * @param {Number} id
   * @param {Array} filters
   * @returns {Array}
   */
  function findFilters(filters, id) {
    log.FINE("getting filters");
    var filtersToReturn = [];
    for (var i = 0; i < filters.length; i++) {
      var filter = filters[i];
      
      var idx = Utils.indexInArray(filter.scriptLoaderKeys, id);
      if (idx !== -1) {
        //  NORMAL_FILTER = "1";
        //  DEDUPE_URL_FILTER = "2";//dedupe has sense only for session
        //  DEDUPE_SESSION_FILTER = "3";
        var session = false;
        switch (getFilterType(filter)) {
          case NORMAL_FILTER:
          case DEDUPE_URL_FILTER:
            break;
          case DEDUPE_SESSION_FILTER:
            session = true;
            break;
        }

        if (session ||
            filter.starter ||
            typeof(filter.pattern) === "function") {
          filter.instance = new SessionVariableFilter({
            include: (+filter.filterType === 1),
            name: filter.name,
            customStarter: filter.starter,
            customScript: filter.pattern
          });
        } else {
          filter.instance = new URLFilter({
            include: (+filter.filterType === 1),
            name: filter.name,
            patternType: resolvePatternType(filter),
            pattern: filter.pattern
          });
        }
        if (filter.priority !== undefined) {
          filter.instance.config.order = +filter.priority;
        }
        filtersToReturn.push(filter.instance);
      }
    }
    var sortFun = function(a, b) {
      return +a.priority > +b.priority;
    };
    return filtersToReturn.sort(sortFun);
  }

  /*
   * Pattern type resolver for old QTag system.
   * It translates match pattern numbers from database to meaningful states.
   */
  var ALL = "1";
  var SUBSTRING = "2";
  var REGEX = "3";
  var EXACT_MATCH = "4";
  var FN = "100";
  var DEDUPE_FN = "110";
  
  /**
   * Translates old pattern types to new PatternType properties for URLs.
   * @param {Object} filter
   * @returns {qubit.opentag.filter.pattern.PatternType}
   */
  function resolvePatternType(filter) {
    switch (filter.patternType) {
      case FN:
      case DEDUPE_FN:
        return null;
        //session execution it was...
      case EXACT_MATCH:
      case "1" + EXACT_MATCH:
        return PatternType.MATCHES_EXACTLY;
      case SUBSTRING:
      case "1" + SUBSTRING:
        return PatternType.CONTAINS;
      case REGEX:
      case "1" + REGEX:
        return PatternType.REGULAR_EXPRESSION;
      case ALL:
      case "1" + ALL:
        return PatternType.ALL_URLS;
      default:
        return null;
    }
  }
})();


(function () {
  var category = {
    id: 4,
    name: "AB & Multi-Variate Testing"
  };
  
  qubit.opentag.Utils.namespace(
          "qubit.opentag.data.category.ABMultiVariateTesting",
          category);
}());


(function () {
  var category = {
    id: 10,
    name: "Advertising Network"
  };
  
  qubit.opentag.Utils.namespace(
          "qubit.opentag.data.category.AdvertisingNetwork",
          category);
}());


(function () {
  var category = {
    id: 5,
    name: "Affiliate Networks"
  };
  
  qubit.opentag.Utils.namespace(
          "qubit.opentag.data.category.AffiliateNetworks",
          category);
}());


(function () {
  var category = {
    id: 9,
    name: "Audience Management"
  };
  
  qubit.opentag.Utils.namespace(
          "qubit.opentag.data.category.AudienceManagement",
          category);
}());


(function () {
  var category = {
    id: 13,
    name: "DSP"
  };
  
  qubit.opentag.Utils.namespace(
          "qubit.opentag.data.category.DSP",
          category);
}());


(function () {
  var category = {
    id: 14,
    name: "DSP (Ad Server)"
  };
  
  qubit.opentag.Utils.namespace(
          "qubit.opentag.data.category.DSPAdServer",
          category);
}());


(function () {
  var category = {
    id: 12,
    name: "Digital Media Agencies"
  };
  
  qubit.opentag.Utils.namespace(
          "qubit.opentag.data.category.DigitalMediaAgencies",
          category);
}());


(function () {
  var category = {
    id: 15,
    name: "Email Service Provider (ESP)"
  };
  
  qubit.opentag.Utils.namespace(
          "qubit.opentag.data.category.EmailServiceProviderESP",
          category);
}());


(function () {
  var category = {
    id: 16,
    name: "Feed Management (Shopping Comparison)"
  };
  
  qubit.opentag.Utils.namespace(
          "qubit.opentag.data.category.FeedManagementShoppingComparison",
          category);
}());


(function () {
  var category = {
    id: 17,
    name: "Live Chat & Customer Service Engine"
  };
  
  qubit.opentag.Utils.namespace(
          "qubit.opentag.data.category.LiveChatCustomerServiceEngine",
          category);
}());


(function () {
  var category = {
    id: 18,
    name: "Merchandising & Rich Media"
  };
  
  qubit.opentag.Utils.namespace(
          "qubit.opentag.data.category.MerchandisingRichMedia",
          category);
}());


(function () {
  var category = {
    id: 19,
    name: "Personalisation Platform"
  };
  
  qubit.opentag.Utils.namespace(
          "qubit.opentag.data.category.PersonalisationPlatform",
          category);
}());


(function () {
  var category = {
    id: 6,
    name: "Ratings & Review Engine"
  };
  
  qubit.opentag.Utils.namespace(
          "qubit.opentag.data.category.RatingsReviewEngine",
          category);
}());


(function () {
  var category = {
    id: 8,
    name: "Re-Targeting"
  };
  
  qubit.opentag.Utils.namespace(
          "qubit.opentag.data.category.ReTargeting",
          category);
}());


(function () {
  var category = {
    id: 7,
    name: "Search Engine"
  };
  
  qubit.opentag.Utils.namespace(
          "qubit.opentag.data.category.SearchEngine",
          category);
}());


(function () {
  var category = {
    id: 3,
    name: "Social"
  };
  
  qubit.opentag.Utils.namespace(
          "qubit.opentag.data.category.Social",
          category);
}());


(function () {
  var category = {
    id: 11,
    name: "Tag Management"
  };
  
  qubit.opentag.Utils.namespace(
          "qubit.opentag.data.category.TagManagement",
          category);
}());


(function () {
  var category = {
    id: 2,
    name: "Web Analytics"
  };
  
  qubit.opentag.Utils.namespace(
          "qubit.opentag.data.category.WebAnalytics",
          category);
}());


(function () {
  var category = {
    id: 1,
    name: "Web Utilities / JavaScript Tools"
  };
  
  qubit.opentag.Utils.namespace(
          "qubit.opentag.data.category.ABMultiVariateTesting",
          category);
}());
}());} catch (e) {
  try {
    if (window.debug) {
      console.log(e);
    }
  } catch (ex) {}
}