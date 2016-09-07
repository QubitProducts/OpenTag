//:import GLOBAL
//:import qubit.Define
//:import qubit.opentag.Utils
//:import qubit.opentag.BaseTag

/*
 * TagSDK, a tag development platform
 * Copyright 2013-2016, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  var Utils = qubit.opentag.Utils;
  var Define = qubit.Define;
  
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
      var zuper = qubit.opentag.Utils.getObjectUsingPath(path, PKG_ROOT);
      if (zuper.__instance) {
        zuper.__instance.log.FINEST("Returning singleton instance.");/*L*/
        return zuper.__instance;
      }
      zuper.__instance = this;
    }
    
    LibraryTag.SUPER.call(this, config); 
  }
  
  qubit.Define.clazz(
          "qubit.opentag.LibraryTag",
          LibraryTag,
          qubit.opentag.BaseTag);
  
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
    description: "",
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
    ],
    /**
     * @protected
     * Compatibility property used internally. It causes running pre post bodies
     * in a window scope - it is recommended to always run them in normal scope.
     * This property is mostly used with old tags that were run in window scope.
     * @cfg {Boolean} [prePostWindowScope=false]
     */
    prePostWindowScope: false
  };
  
  /**
   * @event 
   */
  LibraryTag.prototype.pre = function () {
    this.log.FINEST("emtpy pre called");/*L*/
  };
  
  /**
   * 
   * @event
   */
  LibraryTag.prototype.post = function () {
    this.log.FINEST("emtpy post called");/*L*/
  };
  
  function extractAndEvalFunctionBody(fun, tag) {
    var expr = fun.toString();
    expr = expr.replace(/\s*function\s*\([\w\s,_\d\$]*\)\s*\{/, "");
    expr = expr.substring(0, expr.lastIndexOf("}"));
    
    // ""+_this.val...'
    expr = expr.replace(
      /(["']\s*\+\s*)\s*_*\w+\s*\.\s*valueForToken\s*\(\s*'([^']*)'\s*\)/g,
      "$1\"${$2}\"");
    expr = expr.replace(
      /\s*_*\w+\s*\.\s*valueForToken\s*\(\s*'([^']*)'\s*\)(\s*\+\s*["'])/g,
      "\"${$1}\"$2");
    
    // ""+_this.val..."
    expr = expr.replace(
      /(["']\s*\+\s*)\s*_*\w+\s*\.\s*valueForToken\s*\(\s*"([^"]*)"\s*\)/g,
      "$1\"${$2}\"");
    expr = expr.replace(
      /\s*_*\w+\s*\.\s*valueForToken\s*\(\s*"([^"]*)"\s*\)(\s*\+\s*["'])/g,
      "\"${$1}\"$2");
    
    // _this.val..."'
    expr = expr.replace(
      /(\s*)_*\w+\s*\.\s*valueForToken\s*\(\s*'([^']*)'(\s*)\)/g,
      "$1${$2}$3");
    expr = expr.replace(
      /(\s*)_*\w+\s*\.\s*valueForToken\s*\(\s*"([^"]*)"(\s*)\)/g,
      "$1${$2}$3");
    
    expr = tag.replaceTokensWithValues(expr);
    Utils.geval(expr);
  }
  
  /**
   * Callback triggered always before loading tag.
   * Can be called only once, any repeated calls will have no effect.
   */
  LibraryTag.prototype.before = function () {
    LibraryTag.SUPER.prototype.before.call(this);
    
//    if (this.getHtml() || this.config.script) {
//      this.log.FINE("html or config.script is set while using pre." +/*L*/
//              " Cancelling running pre.");/*L*/
//      return false;// continue normally
//    }
    
    this.log.INFO("Running PRE script execution...");/*L*/
    try {
      var cfg = this.config;
      if (cfg && cfg.pre) {
        if (typeof(cfg.pre) === "function") {
          this.pre = cfg.pre;
        } else {
          var expr = this.replaceTokensWithValues(String(cfg.pre));
          this.pre = Utils.expressionToFunction(expr).bind(this);
        }
      }
      if (this.config.prePostWindowScope && 
              this.pre !== LibraryTag.prototype.pre &&
              this.pre.toString) {
        extractAndEvalFunctionBody(this.pre, this);
      } else {
        this.pre();
      }
    } catch (ex) {
      this.log.ERROR(/*L*/
        this.config.name + " exception while running pre: " + ex);/*L*/
      return true;// cancel running 
    }
    return false;
  };
  
  /**
   * Callback triggered always before loading tag.
   * Can be called only once, any repeated calls will have no effect.
   * @param success if tag execution was successful
   */
  LibraryTag.prototype.after = function (success) {
    LibraryTag.SUPER.prototype.after.call(this, success);
//    if (this.getHtml() || this.config.script) {
//      this.log.WARN("html or config.script is set while using post." +/*L*/
//              " Cancelling running post.");/*L*/
//      return;
//    }
    
    this.log.INFO("Running POST script execution...");/*L*/
    try {
      var cfg = this.config;
      if (cfg && cfg.post) {
        if (typeof(cfg.post) === "function") {
          this.post = cfg.post;
        } else {
          var expr = this.replaceTokensWithValues(String(cfg.post));
          this.post = Utils.expressionToFunction(expr).bind(this);
        }
      }
      if (this.config.prePostWindowScope && 
                this.post !== LibraryTag.prototype.post &&
                  this.post.toString) {
        extractAndEvalFunctionBody(this.post, this);
      } else {
        this.post(success);
      }
    } catch (ex) {
      this.log.ERROR(/*L*/
        this.config.name + " exception while running post: " + ex);/*L*/
    }
  };
  
  /**
   * Utils.defineWrapperClass wrapper for LibraryTag.
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
      .replace(/\.+/g, ".");
    
    namespace = qubit.Define.vendorsSpaceClasspath(namespace);
    
    // config must be set in runtime - for each instance
    var libraryDefaultConfig = {};
    
    if (libConfig.getDefaultConfig) {
      libraryDefaultConfig = libConfig.getDefaultConfig();
    }
    
    var constr = libConfig.CONSTRUCTOR;
    
    // prepare new config that does not override .config object in Library class
    var prototypeTemplate = {};
   
    for (var prop in libConfig) {
      if (prop !== "config") {
        prototypeTemplate[prop] = libConfig[prop];
      }
    }
    
    // add new constructor
    var constructor = function (cfg) {
      // update instance properties for new defaults
      cfg = cfg || {};
      cfg = Utils.overrideFromLeftToRight(libraryDefaultConfig, cfg);
      
      // --- standard ---
      // run library standard constructor
      var ret = qubit.opentag.LibraryTag.call(this, cfg);
      
      // any additional constructor? run it.
      if (constr) {
        constr.call(this, cfg);
      }
      
      if (ret) {
        return ret;
      }
    };
    
    var ret = qubit.opentag.Utils.defineWrappedClass(
      namespace, LibraryTag, prototypeTemplate, GLOBAL, constructor);
    
    var ns = Define.STANDARD_VS_NS + ".";
    // make sure standard ns is always set
    if (namespace.indexOf(ns) !== 0) {//
      Utils.namespace(ns + namespace, ret);
    }
    
    return ret;
  };
  
  LibraryTag.getLibraryByClasspath = function (namespace) {
    return Utils.getObjectUsingPath(namespace, qubit.Define.getVendorSpace());
  };
  
}());
