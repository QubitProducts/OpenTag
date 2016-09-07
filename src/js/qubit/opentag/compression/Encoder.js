//:import qubit.Define
//:import qubit.Cookie

(function () {
  var Define = qubit.Define;
  var Cookie = qubit.Cookie;
  
  //order matters!
  //make sure that replacement char does not equal to first character of
  //any coded words!
  //Escape character used in encoder: *
  //exclude also: _, N, +, *, T, Q staring from - or number
  //number dash codes are SPECIAL.
  var definitions = [
    ['","referrer":[{"url":"http://', "1-"],
    ['","referrer":[{"url":"https://', "2-"],
    [',"referrer":[{"url":"http://', "3-"],
    [',"referrer":[{"url":"https://', "4-"],
    [',"sessionStartTime":', "5-"],
    ["www.google.co.uk",   "6-"],
    ["www.google.",   "7-"],
    ["\"sessionStartTime\":",  "8-"],
    ["\"landing\":\"",   "9-"],
    ["http%3A%2F%2Fwww",  "10-"],
    ["\"landing\":",   "L"],
    ["\"time\":",   "A"],
    ["\"pageViews\":",  "P"],
    ["\"sessionCount\":",  "B"],
    ["\"referrer\":",  "R"],
    ["\"url\":\"http://www.",  "J"],
    ["\"url\":\"https://www.",  "M"],
    ["\"url\":\"",   "I"],
    ["\"url\":",   "U"],
    ["http://www.",   "W"],
    ["https://www.",   "V"],
    ["%2Fen%2Ftsuk%2F",  "K"],
    ["\"sessionLandingPage\":",  "F"],
    ["http%3A%2F%2F",  "D"],
    ["http://",   "H"],
    ["https://",   "X"],
    ["\"\"",  "O"],
    ["\",",  "Y"],
    ['":{}}', "z"],
    ["<", "S"],
    [">", "G"],
    ["[", "Z"],
    ["]", "E"],
    ["{", "a"],
    ["}", "b"],
    ["(", "c"],
    [")", "d"],
    ["!", "e"],
    ["#", "f"],
    ["$", "g"],
    ["!", "q"],
    ["'", "i"],
    [":", "j"],
    ["?", "k"],
    ["^", "x"],
    ["`", "m"],
    ["|", "n"],
    ["~", "o"],
    ["%", "v"],
    [",", "C"]
  ];
  
  function prepareDefinitions(array) {
    var definitions = [];
    for (var i = 0; i < array.length; i++) {
      var preparedString = escapeRegExp(array[i][0]);
      definitions.push([new RegExp(preparedString, "g"), "*" + array[i][1]]);
    }
    return definitions;
  }
  
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
  function Encoder(config) {
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
   * @param {Boolean} limitUTFRange if true, utf range will be limited to value
   *                  specified.
   * @returns {String} encoded string. 
   */
  Encoder.prototype.encode = function encode(string, limitUTFRange) {
    // one rule: 
    // replacement char cannot be first char of any words and
    // no numbers or dot!!!
    var ret = string.replace(/\*/g, "**");
    var ininitalDdict = dynamicDictionary(ret);
    
    for (var i = 0; i < this._regexDefs.length; i++) {
      var pair = this._regexDefs[i];
      ret = ret.replace(pair[0], pair[1]);
    }
    
    //a must section, normally first, but ist safer to do it fater dictionary as
    //can be changed by developer.
    // @TODO move those to the dictionary... 
    ret = ret.replace(/;/g, "*-");
    ret = ret.replace(/&/g, "*.");
    ret = ret.replace(/\\/g, "*/");
    ret = ret.replace(/=/g, "*+");
    ret = ret.replace(/\n/g, "*N");
    ret = ret.replace(/ /g, "*_");
    ret = ret.replace(/\t/g, "*T");
    ret = ret.replace(/"/g, "*Q");
    
    //test server with
    // document.cookie=
    // 'x="abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ' + 
    // '*!-#$+()@\'%./:<>?[]^_`{|}~"'
     
    //start searching for interesting keywords now
    var ddict = dynamicDictionary(ret);
    ddict.concat(ininitalDdict);
    // actually space is fine, just trimming occurs
    // run dictionary before possible UTF, there ius not conflict as UTF method
    // will ignore standard characters used by dictionaries
    var result = replaceWithDynamicDictionary(ddict, ret);
    var actualDict = result[1];
    var replacementsOccured = actualDict.length > 0;
    
    if (replacementsOccured) {
      ret = result[0];
    }
    
    //utf section
    if (!limitUTFRange) {
      ret = replaceWithUTFEncoding(ret);
    } else {
      ret = replaceWithUTFEncoding(ret, limitUTFRange);
    }
    
    if (replacementsOccured) {
      return "Y" + actualDict.join("*") + "@" + ret;
    } else {
      return "N" + ret;
    }
  };
  
  function replaceWithUTFEncoding(string, range) {
    var rewrite = [];
    for (var i = 0; i < string.length; i++) {
      var inRange = true;
      if (range) {
        inRange = string.charCodeAt(i) <= range;
      }
      var inCookieAlphabet = Cookie.cookieAlphabetMap
              .hasOwnProperty(string.charAt(i));
      if (inRange && !inCookieAlphabet) {
        rewrite.push("*" + string.charCodeAt(i) + ".");
      } else {
        rewrite.push(string.charAt(i));
      }
    }
    return rewrite.join("");
  }
  
  /*
   * Private wrapper over Dynamic words replaced.
   */
  function replaceWithDynamicDictionary(ddict, string) {
    string = string.replace(/@/g, "@@");
    var dict = [];
    for (var i = 0, j = 0; i < ddict.length; i++) {
      //new regex is expensive operation
      var pattern = ddict[i][0];
      var rx = new RegExp(escapeRegExp(pattern), 'g');
      var out = string.replace(rx, "@" + j + "-");
      if (out !== string) {
        dict.push(ddict[i][0]);
        j++;
        string = out;
      }
    }
    return [string, dict];
  }
  
  function escapeRegExp(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  }
  
  //"abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ*-+@./_"
  var dynamicDictChars = 
    "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ+_.";
  var dynamicDictCharsMap = {};
  for (var i = 0; i < dynamicDictChars.length; i++) {
    dynamicDictCharsMap[dynamicDictChars.charAt(i)] = true;
  }
  
  var MIN_WORD_LEN = 4;
  var MIN_OCCURENCE_LEN = 2;
  function dynamicDictionary(str) {
    var parts = {};
    var word = "";
    for (var i = 0; i < str.length; i++) {
      var ch = str.charAt(i);
      if (!dynamicDictCharsMap[ch]) {
        if (isNaN(parts[word])) {
          parts[word] = str.split(word).length - 1;
        }
        word = "";
      } else {
        word += ch;
      }
    }
    var dict = [];
    for (var prop in parts) {
      if (parts.hasOwnProperty(prop)) {
        var occurringNum = parts[prop];
        if (occurringNum >= MIN_OCCURENCE_LEN && prop.length >= MIN_WORD_LEN) {
          dict.push([prop, occurringNum]);
        }
      }
    }
    // @todo, make this function more sophisticated, use multiple + one word len
    //instead of just len
    dict = dict.sort(function (a, b) {
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
  Encoder.prototype.decode = function (string) {
    var ddict = null;
    if (string.charAt(0) === "N") {
      string = string.substring(1);
    } else if (string.charAt(0) === "Y") {
      var qMkIdx = string.indexOf("@");
      if (qMkIdx >= 0) {
        ddict = string.substring(1, qMkIdx);
        ddict = ddict.split("*");
        string = string.substring(qMkIdx + 1);
        //decode only if there was dynamic encoding
        string = decodeDynamicDictionary(string, ddict);
      }
    }
    
    var ret = "";
    var codeWord = false;
    var collectingNum = false;
    var utfNum = "";
    for (var i = 0; i < string.length; i++) {
      var ch = string.charAt(i);
      if (ch === "*" || codeWord || collectingNum) {
        if (codeWord || collectingNum) {
          codeWord = false;
          
          if (!isNaN(+("-" + ch))) {
            // utf code or ext dict, collect number
            utfNum = utfNum + ch;
            collectingNum = true;
          } else if (collectingNum) {
            //was collecting number  till now
            if (ch === ".") {
              //utf case
              ret += String.fromCharCode(+utfNum);
            } else if (ch === "-" &&
                    getDefinitionByChar(utfNum + "-", this._defs)) {
              //ext dict case
              ret += getDefinitionByChar(utfNum + "-", this._defs);
            } else {
              //unrecognised, dump as was
              ret += "*" + utfNum + ch;
            }
            utfNum = "";
            collectingNum = false;
          } else if (ch === "*") {
            ret += "*";
          } else if (ch === "-") {
            ret += ";";
          } else if (ch === "/") {
            ret += "\\";
          } else if (ch === ".") {
            ret += "&";
          } else if (ch === "+") {
            ret += "=";
          } else if (ch === "N") {
            ret += "\n";
          } else if (ch === "_") {
            ret += " ";
          } else if (ch === "T") {
            ret += "\t";
          } else if (ch === "Q") {
            ret += "\"";
          } else if (getDefinitionByChar(ch, this._defs) !== null) {
            //any other chars are in the dictionary
            var def = getDefinitionByChar(ch, this._defs);
            ret += def;
          } else {
            //unrecognised! dump as was
            ret += "*" + ch;
          }
        } else {
          codeWord = true;
        }
      } else {
        ret += ch;
      }
    }
    if (utfNum) {
      //last utfNum collection was uncleared! bring it back
      ret += "*" + utfNum;
    }
    if (codeWord) {
      //flush empty fflash
      ret += "*";
    }
    return ret;
  };
  
  //some cleanups needed.
  function decodeDynamicDictionary(string, ddict) {
    if (!ddict || ddict.length === 0 || !string) {
      return string;
    }
    var ret = "";
    var codeWord = false;
    var collectingNum = false;
    var codeNum = "";
    for (var i = 0; i < string.length; i++) {
      var ch = string.charAt(i);
      
      if (ch === "@" || codeWord || collectingNum) {
        if (codeWord || collectingNum) {
          codeWord = false;
          
          if (ch === "@") {
            ret += "@";
          } else  if (!isNaN(+("-" + ch))) {
            // dynamic dictionary code
            collectingNum = true;
            codeNum = codeNum + ch;
          } else {
            if (collectingNum) {
              if (ddict && ch === "-" && ddict[+codeNum]) {
                //dictionary code case
                ret += ddict[+codeNum];
              } else {
                //unrecognised, dump as is
                ret += "@" + codeNum + ch;
              }
              codeNum = "";
              collectingNum = false;
            } else {
              //not a code! dump as was
              ret += "@" + ch;
            }
          }
        } else {
          codeWord = true;
        }
      } else {
        ret += ch;
      }
    }
    if (codeNum) {
      //last codeNum collection was uncleared! bring it back
      ret += "@" + codeNum;
    }
    if (codeWord) {
      //flush empty fflash
      ret += "@";
    }
    return ret;
  }
  
})();