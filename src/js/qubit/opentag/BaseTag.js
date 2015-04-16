//:include qubit/Define.js
//:include qubit/opentag/Utils.js
//:include qubit/opentag/Timed.js
//:include qubit/opentag/TagsUtils.js
//:include qubit/opentag/filter/BaseFilter.js
//:include qubit/opentag/pagevariable/BaseVariable.js
//:include qubit/opentag/TagHelper.js
//:include qubit/opentag/GenericLoader.js

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
  var BaseFilter = qubit.opentag.filter.BaseFilter;
  var GenericLoader = qubit.opentag.GenericLoader;
  var TagHelper = qubit.opentag.TagHelper;
  var log = new qubit.opentag.Log("BaseTag -> ");

  /**
   * @class qubit.opentag.BaseTag
   * @extends qubit.opentag.GenericLoader
   * 
   * #BaseTag - Father class of any tag
   * 
   * This class has properties and API shared by all tag types.
   * To check if object is a tag its instance must be compared to this class
   * prototype.
   * 
   * BaseTag has [GenericLoader](#!/api/qubit.opentag.GenericLoader) as a parent
   * class. GenericLoader implements entire engione for urls loading, 
   * dependencies management, configuration and many more. In practice, at most
   * of times [CustomTag](#!/api/qubit.opentag.CustomTag) or 
   * [LibraryTag](#!/api/qubit.opentag.LibraryTag) will be used.
   * 
   * @param {Object} config Please see properties for configuration options.
   *  Each property can be set at initialization time via config object.
   */
  function BaseTag(config) {
    
    var defaults = {
     /**
      * How much filter should be timed out. By default - never if
      * filters is configured to await. It is unlikely this option will be used.
      * Typical filters are never timed out.
      * @cfg filterTimeout
      * @type Number
      */
      filterTimeout: (config && config.filterTimeout) ||
              this.FILTER_WAIT_TIMEOUT,
      /**
       * Package property indicates where this tag will reside
       * (in what namespace). This property is used by structure packagers to
       * locate a tag.
       * It is optional.
       * This property does not affect this tag itself, it is only configuration
       * property.
       * @cfg package
       * @type Object 
       */
      PACKAGE: (config && config.PACKAGE),
      /**
       * Is this tag a dedupe tag? `dedupe` option indicates that tag is
       * deduplicating statistic information - this typically happens only for
       * session tags. If `dedupe` is set to `true` a container will send
       * deduplicated ping message for this tag when its loaded.
       * This property does not affect this tag itself, it is only configuration
       * property.
       * @cfg dedupe
       * @type Boolean
       */
      dedupe: false,
      /**
       * If the tag requires consent tag. If set to true, container will not 
       * trigger tag loading untill consent agreement has been validated.
       * This property does not affect this tag itself, it is only configuration
       * property.
       * @cfg needsConsent
       * @type Boolean
       */
      needsConsent: false,
      /**
       * This property indicates that tag is inactive.
       * @cfg inactive
       * @type Boolean
       */
      inactive: false,
      /**
       * Variables map.
       * Variables can be passed as a map with veriable mapped to token name.
       * This mapping will work only if pramater with the token name has no
       * variable defined in config, it will be ignored otherwise.
       * @cfg variables
       * @type Object
       */
      variables: null,
      /**
       * New API.
       * Custom runner, if set, run will not fire tag running but
       * runner will be invoked instead.
       * It is duty of runner to remeber to call `this.run()` to start the 
       * execution chain.
       * 
       * Default value is NULL.
       * 
       * This option will bemostly used by custom tags to replace 
       * "session filters".
       * @cfg runner
       * @type Function
       */
      runner: null,
      /**
       * If set to true, tag will not be run automatically by container.
       * @cfg disabled
       * @type Boolean
       */
      disabled: false,
      /**
       * Indicates this tag will be locked untill `unlock` method will be 
       * called. By default no tag is locked.
       * @cfg locked
       * @type Boolean
       */
      locked: false
    };
    
    Utils.setIfUnset(config, defaults);
    
    BaseTag.superclass.apply(this, arguments);
  
    /**
     * Named page variables. These variables are not strictly bonded to any
     * parameters. In old tag running mechanism this array is never used.
     * In case of any page variable object that is added here, tag will include
     * it as page variable dependency.
     * 
     * Named variables is a new feature. To get page variables related to 
     * parameters use `this.getPageVariables()`
     * @property Array[qubit.opentag.filter.BaseFilter]
     */
    this.namedVariables = {};
    
    /**
     * Parameters array. Parasmeters are a plain objects containing:
     * 
     * `name` property, indicating parameter's name.
     * 
     * `token` property indicating unique name to be used to replace its 
     * `${token}` occurences in html, pre, post and config.[pre,post, script] 
     * strings with values fetched by `this.valueForToken("token"). To retrieve
     *  at any run time the value, use `this.valueForToken("token")`.
     * `defaultValue` If defined, it will be used to fall back to this 
     * expression based value.
     * Default value will be taken if normal token value does not exist and 
     * script is timed out.
     * 
     * @property {Array} parameters
     */
    this.parameters = [];
    
    /**
     * Local filters of this tag.
     * Use getFilters for fetching all filters applying to this tag.
     * @property {Array} filters Array of qubit.opentag.filter.BaseFilter
     */
    this.filters = [];
    
    /**
     * Session object, if any attached - there may be no session defined and this
     * object will be unset. This is same session object that is passed to filters.
     * @property {qubit.opentag.Session}
     */
    this.session = null;
    
    if (config) {
      this.addState("INITIAL");

      try {
        BaseTag.register(this);
      } catch (ex) {
        this.log.WARN("Problem with registering tag " + this.config.name);
        this.log.WARN(ex, true);
        // RETHINK THIS, it looks usefull but a bit circural...
      }
      
      if (config.filters) {
        for (var i = 0; i < config.filters.length; i++) {
          this.addFilter(config.filters[i]);
        }
      }
      
      if (config.parameters) {
        this.parameters = this.parameters.concat(config.parameters);
      }
      
      if (config.variables) {
        for (var prop in config.variables) {
          if (config.variables.hasOwnProperty(prop)) {
            var param = this.getParameterByTokenName(prop);
            if (param) {
              var variable = config.variables[prop];
              param.variable = variable;
              if (variable.defaultValue !== undefined) {
                param.defaultValue = variable.defaultValue;
              }
              if (variable.uv !== undefined) {
                param.uv = variable.uv;
              }
            }
          }
        }
      }
      
      if (config.locked) {
        this.lock();
      }
      
      this.log.FINEST("Initializing variables.");
      this.initPageVariablesForParameters();
      
      /**
       * @property {String} uniqueRefString This property is 
       * null by default. Typically, it is set by a container instance if any.
       */
      this.uniqueRefString = null;
      
      this.onTagInit();
    }
  }
  
  qubit.Define.clazz("qubit.opentag.BaseTag", BaseTag, GenericLoader);
  
  /**
   * Returns value for a token name.
   * If page varable exist and is bound to a parameter using
   * specific token name equal to `token` argument it will be returned by 
   * this function.
   * This function tries first to read from parameters variables and parameter
   * default values , if not found any **variable** (including defaults) 
   * `this.namedVariables` will be searched for the value of variable witn
   * name matching the token.
   * 
   * Note: if variable is defined dierctly for parameter - even if unset it 
   * will be used **only**.
   * 
   * @param {String} token name
   * @param {Boolean} defaults if default value should be checked
   * @returns 
   */
  BaseTag.prototype.valueForToken = function (token, defaults) {
    var param = this.getParameterByTokenName(token);
    if (param) {
      if (defaults === undefined) {
        if (this.loadingTimedOut) {
          defaults = true;
        }
      }
      return this.getParameterValue(param, defaults);
    }
    if (this.namedVariables && this.namedVariables[token]) {
      var variable = _getSetNamedVariable(this, token);
      if (variable) {
        return variable.getRelativeValue(defaults);
      }
    }
    return undefined;
  };
  
  /**
   *  Default timeout for script to load.
   * @property {Number} LOADING_TIMEOUT
   */
  BaseTag.prototype.LOADING_TIMEOUT = 5 * 1000;
  
  /**
   *  Default timeout for script filter to wait.
   *  Default value is -1 which means: awaiting filters are never timed out.
   * @property {Number} FILTER_WAIT_TIMEOUT
   */
  BaseTag.prototype.FILTER_WAIT_TIMEOUT = -1;
  
  BaseTag.prototype.run = function () {
    if (this.config.runner) {
      var ret = false;
      try {
        this.log.INFO("Running custom runner...");
        this.addState("AWAITING_CALLBACK");
        ret = this._runner = new Date().valueOf();
        this.config.runner.call(this);
      } catch (e) {
        this.log.ERROR("Error while running custom runner: " + e);
      }
      return ret;
    } else {
      this._runner = false;
      return this.start();
    }
  };
  
  /**
   * If tag has been not yet executed, it may be locked for execution.
   * Locking execution is kind of middle lock between actually triggering 
   * final stage of tag and it's filters pass. Tag that filters haven't 
   * passed will not execute no matter if lock is applied or not.
   * @returns {undefined}
   */
  BaseTag.prototype.lock = function () {
    this.locked = true;
    this._unlock = null;
  };
  
  /**
   * New API.
   * Function used to unlock the tag. When tag has a property `locked` set to 
   * true and is not fired yet, running a tag will not has effect untill unlock
   * method is called on it. It can be called after tag tried to execute.
   * @returns {undefined}
   */
  BaseTag.prototype.unlock = function () {
    this.locked = false;
    if (this._unlock) {
      this._unlock();
      this._unlock = false;
    }
  };
  
  /**
   * Starter used to run tag. It wraps run function only and is ment to be used
   * in runner function body. See `config.runner` property for more details.
   * @param {Boolean} force tag may be disabled, use force to force running.
   * If tag `'run(true)` is called, private forcing property will be set and 
   * this method will try to force execution.
   * @returns {undefined}
   */
  BaseTag.prototype.start = function () {
    if (!this.locked) {
      return BaseTag.superclass.prototype.run.call(this);
    } else {
      this.log.WARN("Tag is locked. Running delegated.");
      this._unlock = function () {
        return BaseTag.superclass.prototype.run.call(this);
      }.bind(this);
      return false;
    }
  };

  /**
   * Starter used to run tag only once. It wraps run function only and is ment
   * to be used in runner function body. See `config.runner` property 
   * for more details.
   * @returns {undefined}
   */
  BaseTag.prototype.startOnce = function () {
    if (!this.locked) {
      return BaseTag.superclass.prototype.runOnce.call(this);
    } else {
      this._unlock = function () {
        return BaseTag.superclass.prototype.runOnce.call(this);
      }.bind(this);
      return false;
    }
  };

  /**
   * It gets ALL filters related to this tag in theirs order of load.
   * @returns {Array}
   */
  BaseTag.prototype.getFilters = function () {
    return this.filters;
  };
  
  /**
   * Run tag only once and only if filter passes.
   */
  BaseTag.prototype.runOnceIfFiltersPass = function () {
    if (!this._runOnceIfFiltersPassTriggered && !this.scriptExecuted) {
      this._runOnceIfFiltersPassTriggered = new Date().valueOf();
      this.runIfFiltersPass();
    }
  };

  /**
   * Function used to run a tag. It is a wrapper around run function, before
   * running the tag, it does check on filters with `filtersState`.
   * Note that run triggers entire process for loading dependencies and the
   * tag if url based.
   * @returns {BaseFilter.state}
   */
  BaseTag.prototype.runIfFiltersPass = function () {
    var state = this.filtersState(true);
    this.addState("FILTER_ACTIVE");
    
    if (!this.filtersRunTriggered) {
      this.filtersRunTriggered = new Date().valueOf();
    }
    
    //it is a number of BaseFilter.state type or time when to stop checking
    if (state === BaseFilter.state.SESSION) {
      this.addState("AWAITING_CALLBACK");
      this.log.FINE("tag is in session and will be manually triggered " + 
              "by custom starter");//L
      this.awaitingCallback = new Date().valueOf();
    } else if (state === BaseFilter.state.PASS) {
      this.filtersPassed = new Date().valueOf();
      this.log.FINE("tag passed filters tests");
      try {
        this.onFiltersPassed();
      } catch (ex) {
        this.log.ERROR("error running onFiltersDelayed:" + ex);
      }
      this.run();
    } else if (state === BaseFilter.state.FAIL) {
      this.log.FINE("tag failed to pass filters");
      this._markFiltersFailed();
      this._markFinished();
    } else if (state > 0) {
      var tout = this.config.filterTimeout;
      if (tout < 0 || 
              ((new Date().valueOf() - this.filtersRunTriggered) > tout)) {
        //try again in [state] ms in future
        //if state is lesser than 0 its passing call and the end.
        if (!this._awaitingForFilterInformed) {
          this.log.INFO("filters found indicating for tag to wait " +
                  "for applicable conditions - waiting...");//L
          this._awaitingForFilterInformed = new Date().valueOf();
          
          try {
            this.onFiltersDelayed();
          } catch (ex) {
            this.log.ERROR("error running onFiltersDelayed:" + ex);
          }
        }
        this._setTimeout(this.runIfFiltersPass.bind(this), state);
      } else {
        this._markFiltersFailed();
        this._markFinished();
        this.filtersRunTimedOut = new Date().valueOf();
        this.log.WARN("awaiting for filters timed out.");
      }
    }
    
    try {
      this.onFiltersCheck(state);
    } catch (e) {
      this.log.ERROR(e);
    }
    
    return state;
  };

  BaseTag.prototype._markFiltersFailed = function () {
    this.addState("FILTERS_FAILED");
    this.filtersPassed = -(new Date().valueOf());
  };

  /**
   * State properties used as a tag's current state and passed history. 
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
          BaseTag.prototype.STATE = {
            INITIAL: 0,
            FILTER_ACTIVE: 1,
            AWAITING_CALLBACK: 2,
            FILTERS_FAILED: 4,
            STARTED: 8,
            LOADING_DEPENDENCIES: 16,
            LOADED_DEPENDENCIES: 32,
            LOADING_URL: 64,
            LOADED_URL: 128,
            EXECUTED: 256,
            EXECUTED_WITH_ERRORS: 512,
            FAILED_TO_LOAD_DEPENDENCIES: 1024,
            FAILED_TO_LOAD_URL: 2048,
            FAILED_TO_EXECUTE: 4096,
            TIMED_OUT: 2 * 4096,
            UNEXPECTED_FAIL: 4 * 4096
          };
  
   * 
   * @property {Object} STATE
   */
  BaseTag.prototype.STATE = {
    INITIAL: 0,
    FILTER_ACTIVE: 1,
    AWAITING_CALLBACK: 2,
    FILTERS_FAILED: 4,
    STARTED: 8,
    LOADING_DEPENDENCIES: 16,
    LOADED_DEPENDENCIES: 32,
    LOADING_URL: 64,
    LOADED_URL: 128,
    EXECUTED: 256,
    EXECUTED_WITH_ERRORS: 512,
    FAILED_TO_LOAD_DEPENDENCIES: 1024,
    FAILED_TO_LOAD_URL: 2048,
    FAILED_TO_EXECUTE: 4096,
    TIMED_OUT: 4096 * 2,
    UNEXPECTED_FAIL: 4096 * 2 * 2,
    CANCELLED: 4096 * 2 * 2 * 2
  };
  
  /**
   * Function used to set state by using state name (a string).
   * This function has no effect if name passed in does not equal to one
   * of `this.STATE` properties.
   * @param {String} stateName
   */
  BaseTag.prototype.addState = function (stateName) {
    BaseTag.superclass.prototype.addState.call(this, stateName);

    try {
      BaseTag.onStateChange(this);
    } catch (ex) {
      this.log.ERROR(ex);
    }

    this.stateStack = [];
    var s = this.STATE;
    var current = this.state;
    var stack = this.stateStack;

    if (current & s.INITIAL) {
      stack.push("Initial state.");
    }
    if (current & s.FILTER_ACTIVE) {
      stack.push("Tag running with filters pass triggered.");
    }
    if (current & s.FILTERS_FAILED) {
      stack.push("Filters failed to pass.");
    }
    if (current & s.AWAITING_CALLBACK) {
      stack.push("Awaiting callback to run this tag. Not pooling.");
    }
    if (current & s.STARTED) {
      stack.push("Tag is initialized and loading has been started.");
    }
    if (current & s.LOADING_DEPENDENCIES) {
      stack.push("Dependencies are being loaded.");
    }
    if (current & s.LOADED_DEPENDENCIES) {
      stack.push("Dependencies loading process has been finished.");
    }
    if (current & s.LOADING_URL) {
      stack.push("External URL is being loaded.");
    }
    if (current & s.LOADED_URL) {
      stack.push("External URL has been loaded.");
    }
    if (current & s.EXECUTED) {
      stack.push("Main script has been executed.");
    }
    if (current & s.EXECUTED_WITH_ERRORS) {
      stack.push("Main script has been executed but errors occured.");
    }
    if (current & s.FAILED_TO_LOAD_DEPENDENCIES) {
      stack.push("Dependencies has failed to load.");
    }
    if (current & s.FAILED_TO_LOAD_URL) {
      stack.push("URL location failed to load.");
    }
    if (current & s.FAILED_TO_EXECUTE) {
      stack.push("Script failed to execute.");
    }
    if (current & s.TIMED_OUT) {
      stack.push("Script timed out awaiting for dependencies.");
    }
    if (current & s.UNEXPECTED_FAIL) {
      stack.push("Script occured UNEXPECTED exception and is failed.");
    }
    if (current & s.CANCELLED) {
      stack.push("Tag has been cancelled.");
    }
  };
  
/**
   * Init event. 
   * Run at the end of constructors body.
   * @event onTagInit
   */
  BaseTag.prototype.onTagInit = EMPTY_FUN;
  /**
   * State being set global event.
   * @static
   * @param {qubit.opentag.BaseTag} tag reference
   * @event onStateChange
   */
  BaseTag.onStateChange = EMPTY_FUN;
  /**
   * Event triggered if tag has run filter delaying request.
   * Filters delaying execution will trigger this event once only.
   * @event onFiltersDelayed
   */
  BaseTag.prototype.onFiltersDelayed = EMPTY_FUN;
  
  /**
   * Event triggered if tag has passed all filters succesfuly.
   * It does not include Session filters in its firing logic.
   * @event onFiltersPassed
   */
  BaseTag.prototype.onFiltersPassed = EMPTY_FUN;
  
  /**
   * Event triggered if tag is checking filters.
   * Tag may periodically check filters staus, it happens if any of filters 
   * return timed state value, see 
   * [BaseFilter](#!/api/qubit.opentag.filter.BaseFilter) for more information.
   * @event onFiltersCheck
   * @param {qubit.opentag.BaseFilter.state} onFiltersCheck
   */
  BaseTag.prototype.onFiltersCheck = EMPTY_FUN;
  
  /**
   * Property representing binary table with this tag's state.
   * `this.state` property is a number that is a binary representation
   * of its state history, for example:
   *
   *     this.state & s.FILTER_ACTIVE
   *
   *  resulting as true, means that `s.FILTER_ACTIVE` is set.
   *  Defasult value is set to:
   *
   *     qubti.opentag.BaseTag.prototype.STATE.INITIAL
   * 
   * Notice that `GenericLoader` has different state values table.
   * State object is a very useful object to read current and historical
   * tags state.
   * 
   * @property {Number} state
   */
  BaseTag.prototype.state = BaseTag.prototype.STATE.INITIAL;
    
  /**
   * Function returns true and only true if all variables have set the value.
   * If `tryDefaults` is set to `true` possible default value assigned to 
   * matched parameters or variables will be used to resolve the values.
   * @param tryDefaults {Boolean} name try also defaults if variables are unset.
   * @returns {Boolean} True if all variables have values.
   */
  BaseTag.prototype.arePageVariablesLoaded = function (tryDefaults) {
    return TagHelper.allParameterVariablesReadyForTag(this, tryDefaults);
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
  BaseTag.prototype.getDependenciesToBeLoaded =
          function (tryDefaults, arrayToAdd) {
    var failures = arrayToAdd || [];
    
    if (!this.arePageVariablesLoaded(tryDefaults)) {
      failures.push("page variables");
    }
    
    return BaseTag.superclass.prototype
            .getDependenciesToBeLoaded.call(this, tryDefaults, failures);
  };
  
  /**
   * @protected
   * URL handling wrapper. This function is used to prepare URL in config object
   * before its passed to url loading mechanism, it typically replaces any 
   * tokens with variable values.
   * @param {String} url
   * @returns {String}
   */
  BaseTag.prototype.prepareURL = function (url) {
    return this.replaceTokensWithValues(url);
  };
  
  /**
   * @protected
   * Location object handling wrapper. When location object is passed (typically
   *  DOM ID or "BODY" or "HEAD") it may contain some string patterns like 
   *  token. This function ensures that the string passed will contain right 
   *  value before passing it to executrion context (typically HTML injection 
   *  or `document.write` operations) 
   * @param {String} loc
   * @returns {String}
   */
  BaseTag.prototype.prepareLocationObject = function (loc) {
    return this.replaceTokensWithValues(loc);
  };

  /**
   * HTML config object handling wrapper.
   * It does ensure that HTML passed into configuration has put all token values
   * (if they exist) into the string before it is passed to execution context
   * (HTML injection).
   * @param {String} html
   * @returns {String}
   */
  BaseTag.prototype.prepareHTML = function (html) {
    if (html) {
      html = this.replaceTokensWithValues(html);
    }
    return html;
  };
  
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
   * `this.script` function with passed configuration. If the `config.script` 
   * is a string, it will be used to construct function to be run (not eval 
   * will be run), the functi0on is always executed with tag scope applied.
   * This function is not intended to be use outside class and therefore is
   * strictly protected.
   * @protected
   */
  BaseTag.prototype._executeScript = function () {
    if (this.config && this.config.script) {
      if (typeof (this.config.script) === "function") {
        this.script = this.config.script;
      } else {
        var expr = this.replaceTokensWithValues(String(this.config.script));
        this.script = Utils.expressionToFunction(expr).bind(this);
      }
    }
    
    BaseTag.superclass.prototype._executeScript.call(this);
  };
  
  /**
   * This function is used to replace any string with tokens in it with its 
   * corresponding values. It delegates some of replacement process to 
   * [BaseVariable.prototype.replaceToken](
     #!/api/qubit.opentag.pagevariable.BaseVariable-method-replaceToken) 
   * per variable that is used.
   * @param {String} string
   * @returns {String} resulting string
   */
  BaseTag.prototype.replaceTokensWithValues = function (string) {
    if (!string || string.indexOf("${") === -1) {
      //serious performance improvements.
      //regex are heavy
      return string;
    }
    var params = this.parameters;
    
    if (params) {
      for (var i = 0; i < params.length; i++) {
        var parameter = params[i];
        var variable = this.getVariableForParameter(parameter);

        if (variable) {
          var token = params[i].token;
          var value = this.valueForToken(token);
          string = variable.replaceToken(token, string, value);
        }
      }
    }
    return string;
  };
  
  /**
   * Function gets parameter object by parameter name.
   * **Last parameter matchin name is returned.**
   * @param {String} name parameter name
   * @returns {Object} parameter reference
   */
  BaseTag.prototype.getParameter = function (name) {
    var params = this.parameters;
    var ret = null;
    if (params) {
      for (var i = 0; i < params.length; i++) {
        if (params[i].name === name) {
          ret = params[i];
        }
      }
    }
    return ret;
  };
  
  /**
   * Simple manual parameter setter. This funmction is intended to use for
   * debugging and testing purposes. Parameters and variables should be defined
   * and bond at configuration time.
   * @param {String} tokenName
   * @param {Object} variable any object, will be passed `value` property
   *  variable config object
   * @returns {Boolean} true if parameter was founmd, false otherwise
   */
  BaseTag.prototype.setParameterValueByTokenName = 
          function (tokenName, variable) {
    var param = this.getParameterByTokenName(tokenName);
    if (param !== null) {
      //it will be automatically converted by TagHelper to 
      //the instance on first access.
      param.variable = {
        value: variable
      };
      return true;
    }
    return false;
  };
  
  /**
   * Function gets parameter value by passing parameter as argument or its name.
   * If defaults is specified, it will return its default value if it was 
   * defined.
   * @param {Object} parameterOrName
   * @param {Boolean} defaults
   * @returns {Object} any value assigned
   */
  BaseTag.prototype.getParameterValue = function (parameterOrName, defaults) {
    var param = (typeof(parameterOrName) === "string") ?
        this.getParameter(parameterOrName) : parameterOrName;
    if (param) {
      var variable = this.getVariableForParameter(param);
      if (variable) {
        try {
          var value;
          if (defaults) {
            value = Utils.gevalAndReturn(param.defaultValue).result;
          }
          value = variable.getRelativeValue(defaults, value);
          return value;
        } catch (ex) {
          this.log.ERROR("error while trying to resolve variable value:" + ex);
          this.log.ERROR("Variable defaults string is invalid: " + 
                  param.defaultValue);//L
          return undefined;
          //throw ex;
        }
      }
    }
    return undefined;
  };
  /**
   * Entry method used to check if all filters used by this tag are passed.
   * BaseTag searches for filters in this.config.**package**.filters location.
   * The location should indicate all filters used by this tag.
   * The **package* config property is a crucial tags property used to
   * configure antiore tags.
   * Filter state is not just a boolean, in this case it will return one of
   * [BaseFilter.state](
     #!/api/qubit.opentag.filter.BaseFilter-static-property-state)
   * properties. In this very case, `SESSION `is never expected to be returned
   *  here.
   * @returns {BaseFilter.state}
   */
  BaseTag.prototype.filtersState = function (runLastSessionFIlterIfPresent) {
    var run = runLastSessionFIlterIfPresent;
    return TagsUtils.filtersState(this.filters, this.session, this, run);
  };
  
  /**
   * Adding filter function.
   * @param filter {qubit.opentag.filter.BaseFilter}
   */
  BaseTag.prototype.addFilter = function (filter) {
    if (this.session) {
      filter.setSession(this.session);
    }
    this.filters.push(filter);
  };
  
  /**
   * Reset tag method, it will bring tag to its initial state so it can be
   * re-run clean. It does not reset logs!
   * Used for debugging purposes.
   */
  BaseTag.prototype.reset = function () {
    BaseTag.superclass.prototype.reset.call(this);
    this.resetFilters();
    var u;
    this.filtersPassed = u;
    this.dedupePingSent = u;
    this.pingSent = u;
    this._runOnceIfFiltersPassTriggered = u;
    this.filtersRunTriggered = u;
    this._runner = u;
  };
  
  /**
   * Function will reset all filters. Any disabled filters will be re-enabled.
   */
  BaseTag.prototype.resetFilters = function () {
    for (var i = 0; i < this.filters.length; i++) {
      this.filters[i].reset();
    }
  };
  
  /**
   * Function will return parameter object by using token name.
   * As many paramaters can use same token name, first will be returned.
   * 
   * [See parameters guide for more details](#!/guide/defining_parameter)
   * 
   * @param {String} name Token name used to search for value.
   * @returns {Object}
   */
  BaseTag.prototype.getParameterByTokenName = function (name) {
    var ret = null;
    if (this.parameters) {
      var params = this.parameters;
      for (var i = 0; i < params.length; i++) {
        if (params[i].token === name) {
          ret = params[i];
        }
      }
    }
    return ret;
  };
  
  /**
   * Removing filter function.
   * It removes filter instance from `this.filters` array.
   * @param {qubit.opentag.filter.BaseFilter} filter
   */
  BaseTag.prototype.removeFilter = function (filter) {
    Utils.removeFromArray(this.filters, filter);
  };
  
  var _counter_tag_map = 0;
  var tags = [];
  var tagAccessorsMap = {};
  var UNIQUE_REF = {};
  
  /**
   * Method used to register a qubit.opentag.BaseTag in a global array.
   * It is quite useful to hav reference to all Tag instances. Each BaseTag
   * constructor triggers this function to add itself to the registry array.
   * Function does not check origins of the class.
   * @static
   * @param {BaseTag} tag
   */
  BaseTag.register = function (tag) {
    log.FINEST("registering tag named \"" +
            tag.config.name + "\", instance of:");//L
    log.FINEST(tag, true);
    var index = Utils.addToArrayIfNotExist(tags, tag);
    if (index !== -1) {
      log.FINE("tag already exists in tags registry.");
    }
    if (index === -1) {
      tag._tagIndex = tags.length - 1;
    } else {
      tag._tagIndex = index;
    }
    if (tag.config.id) {
      var str = "Q" + tag.config.id;
      UNIQUE_REF[str] = tag;
      tag.uniqueId = str;
    }
  };
  
  /**
   * @static
   * Get tag by its unique ID.
   * @param {String} id unique Id, it is the 'uniqueId` property - if set.
   * @returns {qubit.opentag.BaseTag} tag instance
   */
  BaseTag.getById = function (id) {
    return UNIQUE_REF[String(id)];
  };
  
  /**
   * Get tag by its unique ID.
   * @param {String} id unique Id, it is the 'uniqueId` property - if set.
   * @returns {qubit.opentag.BaseTag} tag instance
   */
  BaseTag.prototype.getById = BaseTag.getById;
  
  /**
   * Use this function to unregister this tag from the registry.
   * It is useful especially for debugging purposes.
   * @param {qubit.opentag.BaseTag} ref optional reference, `this` will be 
   * used if undefined.
   */
  BaseTag.prototype.unregister = function (ref) {
    BaseTag.unregister(ref || this);
  };
  
  /**
   * Use this function to unregister `tag` from the registry.
   * @static
   * @param {qubit.opentag.BaseTag} tag
   */
  BaseTag.unregister = function (tag) {
    log.FINEST("Un-registering tag named \"" +
            tag.config.name + "\", instance of:");//L
    log.FINEST(tag, true);
    var index = Utils.removeFromArray(tags, tag);
    if (!index || index.length === 0) {
      log.FINEST("tag " + tag.config.name + " is already unregisterd.");
    }

    tag._tagIndex = -1;
  };
  
  /**
   * Returns all tags registered in the system (global registry).
   * @static
   * @returns {Array}
   */
  BaseTag.getTags = function () {
    return tags;
  };  
  /**
   * Returns map of all tags in the system that were returned as string reference. See `this.getAccessorString()` for more details.
   * @static
   * @returns {Array}
   */
  BaseTag.getAccessorsMap = function () {
    return tagAccessorsMap;
  };
  
  /**
   * Returns all tags registered in the system (global registry).
   * @returns {Array}
   */
  BaseTag.prototype.getTags = function () {
    return tags;
  };
  
  /**
   * @protected
   * Function used to validate and initialize parameters and any variables 
   * assigned. If variables were passed as plain objects, they will be converted
   * to BaseVariable instances.
   * It is always run at constructor time.
   */
  BaseTag.prototype.initPageVariablesForParameters = function () {
    var params = this.parameters;
    if (params) {
      for (var i = 0; i < params.length; i++) {
        params[i].variable = TagHelper
                .validateAndGetVariableForParameter(params[i]);
      }
    }
    if (this.namedVariables) {
      for (var prop in this.namedVariables) {
        if (this.namedVariables.hasOwnProperty(prop)) {
          this.namedVariables[prop] = 
                  TagHelper.initPageVariable(this.namedVariables[prop]);
        }
      }
    }
  };
  
  /**
   * Function returns all page variables defined within this tag.
   * All variables assigned to parameters and any variables alone from 
   * `this.namedVariables`.
   * During getting variables from `this.parameters` array, 
   * they will be re-validated.
   * @returns {Array} BaseVariable
   */
  BaseTag.prototype.getPageVariables = function () {
    var params = this.parameters;
    var vars = [];
    
    if (params) {
      for (var i = 0; i < params.length; i++) {
        var v = this.getVariableForParameter(params[i]);
        if (v !== null) {
          Utils.addToArrayIfNotExist(vars, v);
        }
      }
    }
    //add named variables and do not duplicate
    if (this.namedVariables) {
      for (var key in this.namedVariables) {
        //getSetVariable validates each time variable
        Utils.addToArrayIfNotExist(vars, _getSetNamedVariable(this, key));
      }
    }
    return vars;
  };
  
  /**
   * Function returns a string that can be used to get this tag instance in its
   *  evaluation time at ANY scope.
   * @returns {String}
   */
  BaseTag.prototype.getAccessorString = function () {
    if (!this._accessorsMapKey) {
      this._accessorsMapKey = "_" + _counter_tag_map++;
      tagAccessorsMap[this._accessorsMapKey] = this;
    }
    return "qubit.opentag.BaseTag.getAccessorsMap()." + this._accessorsMapKey;
  };
  
  /**
   * Function returns page variable object for the parameter instance.
   * It is advised to use this method when unsure what type of variable 
   * object is.
   * @param param {Object}
   * @returns {qubit.opentag.pagevariable.BaseVariable} BaseVariable instance
   */ 
  BaseTag.prototype.getVariableForParameter = function (param) {
    var variable = TagHelper.validateAndGetVariableForParameter(param);
    var existAndIsNotEmpty = variable && !variable.config.empty;
    if (!existAndIsNotEmpty && 
            (this.namedVariables && this.namedVariables[param.token])) {
      // @todo clean it up
      //use alternative value
      variable = _getSetNamedVariable(this, param.token);
    }
    return variable;
  };

  /**
   * Logs this tag variables debugable information.
   * @returns {Array} Array of objects with properties:
   * 
   *  name - name of variable
   *  
   *  exists - if variable value exists by tag meaning
   *  
   *  token - parameters token associated with variable, if exists,
   *    null otherwise.
   *  
   *  value - current variable value
   *  
   *  variable - direct variable reference
   */
  BaseTag.prototype.checkVariablesState = function () {
    var res = [];
    this.log.FINE("Tag has been timed out, showing variables:");
    var pairs = TagHelper.getAllVariablesWithParameters(this);
    
    for (var i = 0; i < pairs.length; i++) {
      var param = pairs[i].parameter;
      var variable = pairs[i].variable;
      var val;
      
      if (param && param.token) {
        val = this.valueForToken(param.token);
      } else {
        val = variable.getRelativeValue(true);
      }
      
      var tmp = {
        name: variable.config.name,
        exists: variable.exists(),
        token: param ? param.token : null,
        value: val,
        variable: variable
      };
      
      res.push(tmp);
      
      /*log*/
      this.log.FINE(
              " Variable Name: " + tmp.name +
              ", Exists: " + tmp.exists +
              ", Token: " + (param ? param.token : "<param is not assigned>") +
              ", Value:" + val
              );
      /*~log*/
    }
    
    return res;
  };

  /**
   * @protected
   * Triggers onLoadTimeout event.
   */
  BaseTag.prototype._triggerOnLoadTimeout = function () {
    this.checkVariablesState();//L
    this.onLoadTimeout();
  };

  function _getSetNamedVariable(tag, token) {
    var variable = TagHelper.initPageVariable(tag.namedVariables[token]);
    tag.namedVariables[token] = variable;
    return variable;
  }
  
  BaseTag.prototype._getUniqueId = function () {
    var id = this.config.name;
    if (this.config.id) {
      id = this.config.id;
    }
    return id;
  };
  
  var cookiePrefix = "qubit.tag.forceRunning_";
  var cookieRunAll = "qubit.tag.forceAllToRun";
  
  BaseTag.prototype.cookieSaysToRunEvenIfDisabled = function () {
    var id = this._getUniqueId();
    var ret = !!qubit.Cookie.get(cookieRunAll);
    if (!ret) {
      ret = !!qubit.Cookie.get(cookiePrefix + id);
    }
    return ret;
  };
  
  /**
   * Sets a cookie that will make container running this tag and ignoring  
   * tag's disabled state (so it will be run by container as normal).
   * To clear the cookie - use `rmCookieForcingTagToRun()`.
   */
  BaseTag.prototype.setCookieForcingTagToRun = function () {
    var id = this._getUniqueId();
    qubit.Cookie.set(cookiePrefix + id, "true");
  };
  
  /**
   * Sets global cookie that make any container ignoring this tag's 
   * disabled state so this tag will be run as normal.
   * To clear cookie set by this method, use `rmCookieForcingTagsToRun()`.
   */
  BaseTag.setCookieForcingTagsToRun = function () {
    qubit.Cookie.set(cookieRunAll, "true");
  };
  
  /**
   * This method clears the cookie set by 
   * `setCookieForcingTagsToR`setCookieForcingTagsToRun()`.
   */
  BaseTag.rmCookieForcingTagsToRun = function () {
    qubit.Cookie.rm(cookieRunAll);
  };
  
  /**
   * This function clears cookie set for this tag by 
   * `setCookieForcingTagToRun()`.
   */
  BaseTag.prototype.rmCookieForcingTagToRun = function () {
    var id = this._getUniqueId();
    qubit.Cookie.rm(cookiePrefix + id);
  };
  
  /**
   * Removes all possible cookies that force any disabled tags to run.
   * It clears all cookies set by any instance of tag with 
   * `setCookieForcingTagToRun()` and cookie set with 
   * `setCookieForcingTagsToRun()`.
   */
  BaseTag.rmAllCookiesForcingTagToRun = function () {
    var cookies = qubit.Cookie.getAll();
    for (var i = 0; i < cookies.length; i++) {
      var name = cookies[i][0];
      if (name.indexOf(cookiePrefix) === 0) {
        qubit.Cookie.rm(name);
      }
    }
    BaseTag.rmCookieForcingTagsToRun();
  };
}());