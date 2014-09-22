/*NO LOG*/
//:include qubit/Define.js
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
