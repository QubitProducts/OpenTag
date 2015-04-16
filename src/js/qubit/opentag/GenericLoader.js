//:include qubit/Define.js
//:include qubit/Events.js
//:include qubit/opentag/Utils.js
//:include qubit/opentag/Timed.js
//:include qubit/opentag/TagsUtils.js
//:include qubit/opentag/TagHelper.js
//:include qubit/opentag/Log.js

/* global EMPTY_FUN, qubit */

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
    
    //consider moving all direct events here
    this.events = new qubit.Events({});
    
    this._depLoadedHandler = function () {
      if (this.dependenciesLoaded() && this.awaitingDependencies) {
        this.log.FINE("All dependencies has run successfuly. Triggering load.");
        this._triggerLoadingAndExecution();
      }
    }.bind(this);
    
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
       *  `document.getElementsById(string)`
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
      dontWaitForInjectionLocation: false,
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
        var deps = config.dependencies.concat(this.getDependencies());
        this.setDependencies(deps);
      }
      
      if (config.PACKAGE) {
        this._package = config.PACKAGE;
      }
      
      this.onInit();
    }
  }
  
  qubit.Define.clazz("qubit.opentag.GenericLoader", GenericLoader);
  
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
   * `this.script` function with passed configuration.
   * This function is not intended to be use outside class and therefore is
   * strictly protected.
   * @protected
   */
  GenericLoader.prototype._executeScript = function () {
    this.log.INFO("executing main script...");
    var success = false;
    
    try {
      this.script();
      success = true;
      this.log.INFO("executed without errors.");
    } catch (ex) {
      this.addState("EXECUTED_WITH_ERRORS");
      this.executedWithErrors = new Date().valueOf();
      this.log.ERROR("Error while executing: " + ex);
      this.log.ERROR("There was an error while executing instance of tag: " +
              this.CLASS_NAME + " from package: " + this.PACKAGE_NAME);//L
      this.log.ERROR(ex, true);
      this._onError(ex);
    } finally {
      this._onExecute(success);
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
   * @param {Array} chain array for recursive steps.
   * @returns {Number}
   */
  GenericLoader.prototype._getTimeout = function (chain) {
    var tout = +this.config.timeout;
    var deps = this.getDependencies();
    if (tout !== -1 && deps.length > 0) {
      var max = 0;
      chain = chain || [];
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
   * @private
   * Strictly private. May be disposed at any time.
   * @param {Boolean} noErrors if error occured is passed.
   */
  GenericLoader.prototype._onExecute = function (noErrors) {
    this.onExecute(noErrors);
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
        this.log.FINE("flushing: " + this._securedWrites.join("\n"));
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
    try { 
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
    this.log.FINE("running after...");
    this.afterRun =  new Date().valueOf();
    try { 
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
   */
  GenericLoader.prototype.runOnce = function () {
    if (!this._runOnceTriggered && !this.scriptExecuted) {
      this._runOnceTriggered = new Date().valueOf();
      this.run();
    } else {
      this.log.FINEST("runOnce has been already executed.");
    }
  };
  
  /**
   * 
   * GenericLoader.CANCEL_ALL properety will cause ALL loaders/tags/libraries
   * to cancel running on `run()` time. It is convinient property to controll 
   * that any tag will not be run after setting to `true`.
   * 
   * @property {Boolean} CANCEL_ALL If set to true, all tags, if not run yet,
   * will be cancelled - no tag will run.
   * @static
   */
  GenericLoader.CANCEL_ALL = false;
  
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
   * @returns {Boolean} false if tag is currently loading, true otherwise.
   */
  GenericLoader.prototype.run = function () {
    if (this.cancelled || GenericLoader.CANCEL_ALL) {
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
    this._ignoreDeps = !!this.ignoreDependencies;
    if (!this._ignoreDeps && !this.dependenciesLoaded()) {
      this.log.FINE("Dependencies (other loaders) not ready. " +
              " Attaching handlers.");//L
      // as all deps are not loaded - there will be at least one that will call
      // success event where this parent will listen. Cannot continue otherwise.
      this._attachDepsEventsToContinue();
      return false;
    }
    
    return this._triggerLoadingAndExecution();
  };
  
  /**
   * @private strictly private. Execution load and trigger.
   * @returns {Boolean}
   */
  GenericLoader.prototype._triggerLoadingAndExecution =
          function () {
    this.awaitingDependencies = -new Date().valueOf();
    
    //make sure its loaded before execution
    this.load();
    
    if (this._ignoreDeps) {
      this.execute();
    } else {
      this.waitForDependenciesAndExecute();
    }
    return true;
  };
  
  /**
   * @private
   * Strictly private.
   * @returns {undefined}
   */
  GenericLoader.prototype._attachDepsEventsToContinue = function () {
    this.log.FINE("Attaching success events to dependencies...");
    //important lock and state indicator!
    this.awaitingDependencies = new Date().valueOf();
    
    var deps = this.getDependencies();
    for (var i = 0; i < deps.length; i++) {
      try {
        deps[i].events.on("success", this._depLoadedHandler);
      } catch (ex) {
        this.log.WARN("Cannot set event for dependency -> ", deps[i]);
        this.log.WARN("Exception: ", ex);
      }
    }
    
    this.log.FINE("Attached " + deps.length + " handlers.");
  };
  
  /**
   * Returns true only if all dependant loaders were successfuly run.
   * 
   * @returns {Boolean}
   */
  GenericLoader.prototype.dependenciesLoaded = function () {
    var deps = this.getDependencies();
    for (var i = 0; i < deps.length; i++) {
      if (deps[i] !== this) {
        var executed = (+deps[i].scriptExecuted) > 0;
        if (!executed) {
          return false;
        }
      }
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

    if (this.shouldWaitForDocWriteProtection()) {
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
      } else {
        var successful = this.scriptExecuted > 0;
        try {
          if (!this.afterRun) {
            this.afterRun =  new Date().valueOf();
            this.after(successful);
          }
        } catch (ex) {
          this.executedWithErrors = new Date().valueOf();
        }
        if (!this.executedWithErrors) {
          //this event will cause other awaiting dependencies to run
          if (successful) {
            this.events.call("success");
          }
        }
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
   * Triggered when tag is cancelled.
   */
  GenericLoader.prototype.onCancel = EMPTY_FUN;
  
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
//    if (GenericLoader.LOCK_DOC_WRITE !== this && 
//        GenericLoader.LOCK_DOC_WRITE) {
//      //this condition holds tag to wait at any other tag using doc write
//      //currently TagsUtils.writeScriptURL checks if redirects of doc write
//      //are set and will unlock it for current execution of tags that can use 
//      //doc write and dont need to wait.
//      //KEEP this block for debugging reasons.
//      return true;
//    }
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
    this.ignoreDependencies = true;
    this.run();
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
    UNEXPECTED_FAIL: 2048,
    CANCELLED: 2048 * 2
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
    this.onAllDependenciesLoaded();
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
    
    //normally body injection location is one of dependencies, by adding 
    //condition here, full body load need and interactiveBodyLoadNeed is taken
    //out of timeout procedure. If removed here, locatrions will be still 
    //checked to exist but timeout will apply.
    var fullBodyNeededAndUnLoaded = this._fullBodyNeededAndUnLoaded();
    var interactiveBodyNeededButNotReady = this._bodyNeededButNotAvailable();
    
    if (fullBodyNeededAndUnLoaded || interactiveBodyNeededButNotReady) {
      this.waitForDependenciesFinished = false;
    } else {
      if (!this.timeoutCountdownStart) {
        //start count down here.
        this.timeoutCountdownStart = new Date().valueOf();
      }
      //check deps and proceed
      if (this.allDependenciesLoaded()) {
        this._markLoadedSuccesfuly();
      } else {
        if (this._loadingOutOfTimeFrames()) {
          this.loadingTimedOut = new Date().valueOf();
          if (this.allDependenciesLoaded(true)) {//give last chance for defaults
            this._markLoadedSuccesfuly();
          } else {
            this.log.WARN("timed out while loading dependencies.");
            this.addState("TIMED_OUT");
            this.loadingDependenciesFailed = new Date().valueOf();
            this._triggerOnLoadTimeout();
          }
        } else {
          //wait for dependencies, no matter what.
          // @TODO let it be done by a nicer tool... single timeout processor
          this.waitForDependenciesFinished = false;
        }
      }
    }
    
    if (!this.waitForDependenciesFinished) {
      this._setTimeout(_waitForDependencies.bind(this), 65);
      /*log*/ //make some nice counter logs count down...
      var diff = (new Date().valueOf() - this.loadStarted);
      var freq = 3000;
      var curr = diff / this.getTimeout();
      var steps = Math.ceil(this.getTimeout() / freq);
      
      this._lockObject.curr = curr;
      
      Timed.maxFrequent(function () {
        if (fullBodyNeededAndUnLoaded) {
          this.log.FINE("Full body needed. Waiting for full body.");
        }
        if (interactiveBodyNeededButNotReady) {
          this.log.FINE("Interactive body needed. Waiting for body.");
        }
        this.log.FINE("Waiting for dependencies, counting... " +
                this._lockObject.count++ + " (" + steps + ")");//L
      }.bind(this), freq, this._lockObject);
      /*~log*/
    } else {
      this.addState("LOADED_DEPENDENCIES");
    }
  }
  
  /**
   * Checker indicating if all dependencies are satisfied.
   * @param tryDefaults {Boolean} name try also defaults if variables are unset.
   * @param {Array} arrayToAdd optional failures to write array
   * @returns {Boolean}
   */
  GenericLoader.prototype.allDependenciesLoaded =
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
      failures.push("injection location");
    }
    var i;
    var deps = this.getDependencies();
    for (i = 0; i < deps.length; i++) {
      if (deps[i] !== this) {
        var executed = (+deps[i].scriptExecuted) > 0;
        if (!executed) {
          var name = deps[i].config ?
            deps[i].config.name : "anonymous";
          failures.push("dependant Tag with name -> " + name);
        }
      }
    }
    
    for (i = 0; i < this.genericDependencies.length; i++) {
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
    return !!(this.delayDocWrite && this.config.usesDocumentWrite);
  };
  
  /**
   * @private
   * Exclusive helper checking if tag needs to hold on unlimited time with
   * loading till body is available and interactive (document.body exists).
   * @returns {Boolean}
   */
  GenericLoader.prototype._bodyNeededButNotAvailable = function () {
    if (this._dontWaitForInjections()) {
      return false;
    }
    //if it is body, tag needs to wait for body
    //once needed check if loaded.
    return this._isBodyLocationNeeded() && !TagsUtils.bodyAvailable();
  };
  
  /**
   * @private
   * Private helper - indicated is body location is needed.
   * @returns {Boolean}
   */
  GenericLoader.prototype._isBodyLocationNeeded = function () {
    //synchronous load is excluded from awaiting for body
    if (!this.isLoadingAsynchronously()) {
      return false;
    }
    
    if (this._isBodyLocationSet()) {
        return true;
    } else {
      var atHead = (this.config.locationObject === "HEAD");
      return atHead && (this.config.locationPlaceHolder === "END");
    }
  };
  
  /**
   * @private
   * Strictly private.
   * @returns {Boolean}
   */
  GenericLoader.prototype._isBodyLocationSet = function () {
    var locObj = this.config.locationObject;
    return !locObj || (locObj === "BODY");
  };
  
  /**
   * @private
   * @returns {Boolean} true if full body is needed and unloaded
   */
  GenericLoader.prototype._fullBodyNeededAndUnLoaded = function () {
    if (this._dontWaitForInjections()) {
      return false;
    }
    
    var needed = false;
    if (this._isBodyLocationNeeded()) {
      needed = (this.config.locationPlaceHolder === "END");
    }
    
    needed = needed || (
        this.fullbodyNeeded ||
        this.docWriteAsksToWaitForBody()
      );
    
    return needed && !Utils.bodyReady();
  };
  /**
   * @private
   * Strictly private. Override helper.
   * @returns {Boolean} 
   */
  GenericLoader.prototype._dontWaitForInjections = function () {
    return this.config.dontWaitForInjectionLocation ||
            this.dontWaitForInjectionLocation || 
            GenericLoader.dontWaitForInjectionLocation;
  };
  
  /**
   * @protected
   * This function checks phisically if
   * loaction for injections is ready.
   * Injection location is necessary for:
   * - html injector
   * - document writes flushing
   * @returns {Boolean}
   */
  GenericLoader.prototype.injectionLocationReady = function () {
    if (this._dontWaitForInjections()) {
      return true;
    }
    // currently it is always false with current tag run-flow
    // tag can still be synchronous and full body is needed:
    // delay doc write case
    if (this._fullBodyNeededAndUnLoaded()) {
      return false;
    }
    //async check happens after the full body load needed as takes over it.
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
    return (new Date().valueOf() - this.timeoutCountdownStart) > 
      this.getTimeout();
  };
  
  /**
   * Function used as a worker for processing loaders's other dependant tags.
   * It is a looping trigger to call "load" on dependencies.
   * `this.getDependencies()` array containes other dependant loaders.
   */
  GenericLoader.prototype.loadDependencies = function () {
    this._loadDependencies();
  };
  
  /**
   * Dependant loaders array getter.
   * @returns {Array} dependencies array, instances of loaders this loader
   *                  is dependant on. The array can be used to add more
   *                  dependencies.
   */
  GenericLoader.prototype.getDependencies = function () {
    return this.dependencies;
  };
  
  /**
   * Setter for dependant loaders.
   * @param {Array} deps dependencies array. Array of 
   *                 qubit.opentag.GenericLoader instances.
   */
  GenericLoader.prototype.setDependencies = function (deps) {
    this.dependencies = deps;
  };
  
  /**
   * @private
   * Strictly private - `loadDependencies` worker.
   * @param {Array} chain
   */
  GenericLoader.prototype._loadDependencies = function (chain) {
    chain = chain || [];
    var deps = this.getDependencies();
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
   * It is called each time an `log._onError` is called.
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
  GenericLoader.prototype.onAllDependenciesLoaded = EMPTY_FUN;
  
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
   */
  GenericLoader.prototype.load = function () {
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

    //by default dependencies (other tags) are not loaded automatically
    this.addState("LOADING_DEPENDENCIES");
    this.log.INFO("Load started.");
    
    try {
      /**
       * @property {Number} loadStarted Timestamp telling when loading process
       *  has started.
       */
      if (!this._ignoreDeps && this.config.loadDependenciesOnLoad) {
        this.loadDependencies();
      }
    } catch (ex) {
      this.log.ERROR("loadDependencies: unexpected exception occured: \n" +
              ex + "\ntrying to finish... ");//L
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
        try {
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
   * @param location {String} location to append scripts (optional), by default
   *                this.config.urlLocation is used
   */
  GenericLoader.prototype.loadURL = function (url, callback, location) {
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
        try {
          if (callback) {
            callback(false);
          }
        } catch (ex) {
          this.log.ERROR("error at callback for error at " +
                  passedUrl + ":" + ex);//L
        }
      }.bind(this),
      url: passedUrl,
      node: location || this.config.urlLocation,
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
    this.awaitingDependencies = u;
    this.timeoutCountdownStart = u;
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
    // @TODO add more sophisticated async judgement:
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
