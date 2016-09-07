//:import qubit.Define

////Author Peter Fronc
// UTF supported.


(function () {

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
  function LZW(config) {
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
  LZW.prototype.encode = function (string) {
    var dictsize = this.alphabet.length;
    var extDict = {};
    var results = [];
    var index = 0;
    var curr = string.charAt(index++);
    var next;
    var dict = this.dict;

    while (!!(next = string.charAt(index++))) {
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
  LZW.prototype.decode = function (codes) {
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
      if (code === dict[p]) {
        return p;
      }
    }
    return null;
  }

}());