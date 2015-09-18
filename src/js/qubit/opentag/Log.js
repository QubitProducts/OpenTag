/*NO LOG*/
//:import qubit.Define
/* jshint white: false */

/*
 * TagSDK, a tag development platform
 * Copyright 2013-2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  
  var Define = qubit.Define;
  var _console = null;
  
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
    
    this.collectLogs = !!Log.isCollecting();
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
  
  var LEVEL = Log.LEVEL_NONE;
  LEVEL = Log.LEVEL_INFO;/*D*///line deleted during merge
  var COLLECT_LEVEL = Log.LEVEL_FINE;
  var COLLECT = true;
  
  /**
   * Global setter to indicate if logs should be collected (memorised).
   * Memorised logs can be print again with rePrint methods on logger instances
   * or directly on global `Log.rePrintAll()` method.
   * @param {Boolean} isCollecting if logs should be collected. Takes effect 
   *  immediately.
   */
  Log.setCollecting = function (isCollecting) {
    COLLECT = !!isCollecting;
  };
  
  /**
   * Getter that returns true if system is collecting logs.
   * @returns {Boolean} true only if system is collecting logs.
   */
  Log.isCollecting = function () {
    return COLLECT || Log.COLLECT;
  };
  
  /**
   * Global logger level setter.
   * @param {Number} level one of qubit.opentag.Log.LEVEL_* properties
   */
  Log.setLevel = function (level) {
    LEVEL = +level;
  };
  
  /**
   * 
   * `Log.getLevel()` getter/setter is used to controll globally current and 
   * default logging levels.
   * Choose from Log.LEVEL_* properties to adjust system logging output.
   * 
   * Example:
    
         qubit.opentag.Log.setLevel(qubit.opentag.Log.LEVEL_FINEST);

   *  will enable all logs to 
   * be at output.
   
         qubit.opentag.Log.setLevel(qubit.opentag.Log.LEVEL_NONE);
  
   * will disable any logs.
   * 
   * All log levels:
    
        Log.LEVEL_FINEST = 4;
        Log.LEVEL_FINE = 3;
        Log.LEVEL_INFO = 2;
        Log.LEVEL_WARN = 1;
        Log.LEVEL_ERROR = 0;
        Log.LEVEL_NONE = -1;
    
    
   * @returns {Number} current level, one of qubit.opentag.Log.LEVEL_* 
   *   properties
   */
  Log.getLevel = function () {
    return LEVEL;
  };
  
  /**
   * Collection level setter. One of qubit.opentag.Log.LEVEL_*.
   * Collection level indicates which level should be used to memorise logs 
   * so they can be printed again. See `rePrintAll()` for more details.
   * @param {Number} level one of qubit.opentag.Log.LEVEL_* properties
   */
  Log.setCollectLevel = function (level) {
    COLLECT_LEVEL =  +level;
  };
  
  /**
   * Same as `gelLevel` but the level is set agains logs collected to be 
   * memorised for later use. See `rePrintAll()` for more details.
   * @returns {Number} level one of qubit.opentag.Log.LEVEL_* properties
   */
  Log.getCollectLevel = function () {
    return COLLECT_LEVEL;
  };
  
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
   * @param {Boolean} noclean if console should not be cleared
   * @param {Array} array alternative array of logs to be reprinted, normally
   *   you dont need to use it unless you implement custom logs history.
   */
  Log.rePrintAll = function (level, delay, noClean, array) {
    var oldLevel = LEVEL;
    
    if (level !== undefined) {
      LEVEL = level;
    }
    
    try {
      if (Log.isCollecting()) {
        try {
          if (!noClean) {
            _console.clear();
          }
        } catch (ex) {
          
        }
        var collection = array || Log.logsCollection;
        var counter = 0;
        for (var i = 0; i < collection.length; i++) {
          (function (j) {
            var log = collection[j];
            var logLevel = log[3];
            if (logLevel !== undefined && LEVEL >= logLevel) {
              counter++;
              if (!delay) {
                Log.print.apply(Log, log);
              } else {
                qubit.opentag.Timed.setTimeout(function () {
                  if (level !== undefined) {
                    LEVEL = level;
                  }
                  try {
                    Log.print.apply(Log, log);
                  } finally {
                    LEVEL = oldLevel;
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
      LEVEL = oldLevel;
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
  
  //dummy for now
  var altConsole = {};
  /**
   * 
   * Attach console object to controll logging print method.
   * @param {Object} xconsole
   * @returns {Object} console attached
   */
  Log.setConsole = function (xconsole) {
    _console = xconsole || altConsole;
    return _console;
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
      _last_run = new Date().valueOf() + delay;
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
    if (level !== undefined && LEVEL < level) {
      return;
    }
    try {
      if (_console && _console.log) {
        if (style && Log.isStyleSupported()){
          if (type && _console[type]) {
            _console[type]("%c" + message, style);
          } else {
            _console.log("%c" + message, style);
          }
        } else {
          if (type && _console[type]) {
            _console[type](message);
          } else {
            _console.log(message);
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
      level = Log.getCollectLevel();
    }
    
    var collected = false;
    var collectingGlobally = (this.collectLogs && Log.isCollecting() &&
      (Log.getCollectLevel() >= +level));
    
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
      _console.clear();
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
    var pass = LEVEL >= level;
    if (Log.getCollectLevel() >= 0 || pass) {
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
