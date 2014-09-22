//:include GLOBAL.js
//:include qubit/Define.js
//:include qubit/compression/LZW.js

(function () {
  //mex is manual "hex"
  
  var mex = "abcdefghijklmnopqrstuvwxyz" + "0123456789" + "'%./:<>?[";
  var Umex = "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + "*!-+()@{|}" + "\"]^_`~$&#";
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

