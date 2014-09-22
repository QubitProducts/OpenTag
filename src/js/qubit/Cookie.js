//:include GLOBAL.js
//:include qubit/Define.js

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