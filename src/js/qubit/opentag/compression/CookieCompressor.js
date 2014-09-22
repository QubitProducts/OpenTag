//:include GLOBAL.js
//:include qubit/Define.js
//:include qubit/Cookie.js
//:include qubit/compression/Compressor.js
//:include qubit/opentag/Log.js
//:include qubit/opentag/compression/Encoder.js

(function() {
  var Define = qubit.Define;
  var Cookie = qubit.Cookie;
  var log = new qubit.opentag.Log("CookieCompressor -> ");
  
  var global = Define.global();
  var binSupported = false;
  //some servers are very bad. must be manually permitted.
  //!!global.chrome || (global.mozIndexedDB !== undefined);
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
    this.testBinary = false;
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
      if (config.binSupported !== undefined) {
        this.binSupported = !!config.binSupported;
      }
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
    var encoded = this.encoder.encode(string);
    
    var binOut;
    if (this.binSupported || this.testBinary) {
      var bin = this.compressor.compress(encoded);
      binOut =  "\"B" + this.encoder.encode(bin, 128) + "\"";
      
      Cookie.set("__qtag_test_bin__", binOut);
      var o = Cookie.get("__qtag_test_bin__");
      Cookie.rm("__qtag_test_bin__");
      
      if (o && o !== binOut) {
        binOut = null;
        log.FINEST("Binary cookie saving trial failed.");
      }
    }
    
    var ansiOut;
    var compressed = this.encoder.encode(this.compressor.compressAnsi(encoded));
    if ((!forceCompression) && encoded.length <= compressed.length) {
      ansiOut = "\"E" + encoded + "\"";
    } else {
      ansiOut = "\"C" + compressed + "\"";
    }
    
    if (binOut && binOut.length < ansiOut.length) {
      log.FINEST("Binary compression ratio: " + (binOut.length/string.length));
      return binOut;
    } else {
      log.FINEST("Compression ratio: " + (ansiOut.length/string.length));
      return ansiOut;
    }
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
    if (string.charAt(0) === "\"") {
      string = string.substring(1, string.length -1);
    }
    log.FINEST("Decompressing...");
    var code = string.charAt(0);
    string = string.substring(1);
    
    switch (code) {
      case "E":
        return this.encoder.decode(string);
      case "C":
        var tmp = this.compressor.decompressAnsi(this.encoder.decode(string));
        return this.encoder.decode(tmp);
      case "B":
        var tmp = this.compressor.decompress(this.encoder.decode(string));
        return this.encoder.decode(tmp);
      default:
        throw "This code is not supported! Code: " + code;
    }
  };
})();