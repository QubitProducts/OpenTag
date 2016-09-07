//:import qubit.Define

/*
 * TagSDK, a tag development platform
 * Copyright 2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
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
    return unescape(string); //old version compatibility
  };
  /**
   * @static
   * Default encoding method for cookie. Defaulting to `encodeURIComponent`.
   * 
   * @param {String} string string to encode
   * @returns {String} encoded string
   */
  Cookie.encode = function (string) {
    return escape(string);
  };
  
  /**
   * @static
   * Cookie setter function.
   * 
   * @param {String} name cookie name
   * @param {String} value cookie string to be set
   * @param {Number} days days to expire
   * @param {String} domain cookie domain
   * @param {Boolean} notEncoded if should NOT encode value and name with default
   *    method.
   */
  Cookie.set = function (name, value, days, domain, notEncoded) {
    var expires;
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toGMTString();
    } else {
      expires = "";
    }
    
    if (!notEncoded) {
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
   * @param {Boolean} notDecoded should NOT cookie be decoded using default
   *  method. If true, cookie will not be decoded.
   * 
   * @returns {String} cookie string or `null` if not found.
   */
  Cookie.get = function (name, notDecoded) {
    var part = name + "=";
    var chunks = document.cookie.split(';');
    for (var i = 0; i < chunks.length; i++) {
      var chunk = chunks[i];
      while (chunk.charAt(0) === ' ') {
        chunk = chunk.substring(1, chunk.length);
      }
      if (chunk.indexOf(part) === 0) {
        var tmp = chunk.substring(part.length, chunk.length);
        if (!notDecoded) {
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
  Cookie.getAllForName = function (name, decoded) {
    if (!name) {
      return [];
    }
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
   * Gets all cookies and returns them as pairs [name, value],
   * decoded by default.
   * @param {type} decoded
   * @returns {Array}
   */
  Cookie.getAll = function (decoded) {
    var chunks = document.cookie.split(';');
    var cookies = [];
    for (var i = 0; i < chunks.length; i++) {
      var chunk = chunks[i];
      while (chunk.charAt(0) === ' ') {
        chunk = chunk.substring(1, chunk.length);
      }
      var name = chunk.substring(0, chunk.indexOf("="));
      var tmp = chunk.substring(name.length + 1, chunk.length);
      if (decoded) {
        tmp = Cookie.decode(tmp);
      }
      cookies.push([name, tmp]);
    }
    return cookies;
  };

  /**
   * @static
   * Clearing cookie function.
   * 
   * @param {String} name cookie name
   * @param {String} domain cookie domain
   */
  Cookie.rm = function (name, domain) {
    Cookie.set(name, "", -1, domain);
  };

})();