//:import qubit.opentag.Log
//:import qubit.opentag.Utils
//:import qubit.Define
//:import qubit.opentag.filter.BaseFilter
//:import qubit.opentag.filter.URLFilter

/*
 * TagSDK, a tag development platform
 * Copyright 2013-2016, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  var BaseFilter = qubit.opentag.filter.BaseFilter;
  var URLFilter = qubit.opentag.filter.URLFilter;
  var Utils = qubit.opentag.Utils;

  /**
   * #Session enabled common filter class.
   *  
   * This class is a compatibility layer part for TagSDK.
   * Session filters are used to customise scripts execution and use custom
   * scripts:
   * - to determine match for the page
   * - to trigger tag execution
   * 
   * If config object contains properties:
   * - `customScript` a function that is used to determine if filter matches. 
   *  It takes session object as a parameter.
   * - `customStarter` a function that is responsible for running the tag.
   *  By default it is an empty function, calling "ready" argument immediately.
   *  The `ready` argument is a callback triggering tag loading. `customStarter`
   *  takes 3 arguments in the order:
   *  1) `session` the session object
   *  2) `ready` the ready callback that runs the tag, note: it will run the tag
   *  directly.
   *  3) `tag` tag reference object.
   * 
   * When creating tags, consider using new API that serve typical use cases for
   * the session filters.
   * 
   * Example:
   * If tag depends on some property that will appear in window scope, like
   *  `jQuery`, use `genericDependencies` array in tag object and push function
   *  there that returns true when the `jQuery` object exists.
   * 
   * 
   * @class qubit.opentag.filter.Filter
   * @extends qubit.opentag.filter.URLFilter
   * @param config {Object} config object used to build instance
   */
  var sessionVariableFilterCount = 0;
  function Filter(config) {
    var defaultConfig = {
      /**
       * Custom starter function for session filter.
       * Takes 3 arguments in the order:
       *  1) `session` the session object
       *  2) `ready` the ready callback that runs the tag, note: it will run the tag
       *  directly.
       *  3) `tag` tag reference object.
       * @cfg {Function}
       * @param {qubit.opentag.Session} session
       * @param {Function} ready
       * @param {qubit.opentag.BaseTag} tag
       */
      // customStarter: null,
      /**
       * Script deciding either script matches or not (top API level).
       * @cfg {Function}
       * @param {qubit.opentag.Session} session
       * @returns {Boolean}
       */
      // customScript: null
    };
    
    if (config) {
      for (var prop in config) {
        if (config.hasOwnProperty(prop)) {
          if (prop === "customStarter" && config[prop]) {
            this.customStarter = config[prop];
          } else  if (prop === "customScript" && config[prop]) {
            this.customScript = config[prop];
          }
          
          defaultConfig[prop] = config[prop];
        }
      }
      this.uid = "f" + (sessionVariableFilterCount++);
    }
    this.tagsToRun = [];
    Filter.SUPER.call(this, defaultConfig);
  }
  
  qubit.Define.clazz(
          "qubit.opentag.filter.Filter",
          Filter,
          URLFilter);
  
  /**
   * Custom starter function for session filter.
   * Takes 3 arguments in the order:
   *  1) `session` the session object.
   *  2) `ready` the ready callback that runs the tag, note: it will run the tag
   *  directly.
   *  3) `tag` tag reference object.
   * This function can be overrided by `config.customStarter` function.
   * 
   * @param {qubit.opentag.Session} session - the session object.
   * @param {Function} ready - the ready callback that runs the tag, note: 
   *                            it will run the tag
   *  directly.
   * @param {qubit.opentag.BaseTag} tag - reference to executing tag.
   */
  Filter.prototype.customStarter = function (session, ready, tag) {
    ready(false);
  };
  
//  // must be same as in the Filter.js template in repo templates
//  var customStarterTemplate = 
//          "function (session, cb) {cb(false);}";
//  var customScriptTemplate = 
//          "function (session) {return true;}";
//  
//  Filter.customStarterTemplate = customStarterTemplate;
//  Filter.customScriptTemplate = customScriptTemplate;
  
  /**
   * This function tells if filter is an empty session type (is URL filter).
   */
  Filter.prototype.isSession = function () {
    if (this.config.sessionDisabled) {
      return false;
    }
    
    if (this.customStarter === null && this.customScript === null) {
      return false;
    }
    
//    if (his.customStarter.toString() !== customStarterTemplate) {
//      return true;
//    }
//    
//    if (this.customScript.toString() !== customScriptTemplate) {
//      return true;
//    }
//
//    return false;
    
    return true;
  };
  
  /**
   * Script deciding either script matches or not (top API level).
   * This function can be overrided by `config.customScript` function.
   * 
   * @param {qubit.opentag.Session} session
   * @returns {Boolean}
   */
  Filter.prototype.customScript = function (session) {
    return true;
  };
  
  /**
   * Match function for a filter.
   * @returns {Boolean}
   */
  Filter.prototype.match = function (url) {
    var match = true;
    try {
      if (this.customScript) {
        if (this._matchState === undefined) {
          this._matchState = !!this.customScript(this.getSession());
        }
        match = this._matchState;
      }
    } catch (ex) {
      this.log.FINE("Filter match throws exception:" + ex);/*L*/
      match = false;
    }
    
    return match && Filter.SUPER.prototype.match.call(this, url);
  };
  
  /**
   * Function that will trigger running tag directly the callback privided in
   * configuration object, the `customStarter`.
   * @param {qubit.opentag.BaseTag} tag
   */
  Filter.prototype.runTag = function (tag) {
    // remember associated tags to run
    Utils.addToArrayIfNotExist(this.tagsToRun, tag);
    // queue execution if starter didnt fire
    if (!this.starterExecuted) {
      // first time running runTag? Trigger starter.
      if (!this._starterWasRun) {
        // enter "customStarter", only once
        this._starterWasRun = true;
        // this step will enable callback to be cancelled easily.
        var recallUUID = this.runtimeId;
        // prepare callback
        var callback = function (rerun) {
          if (recallUUID !== this.runtimeId) {
            this.log.FINE("Filter was cancelled (reset?)."); /*L*/
            return;
          }
          // mark starterExecuted on filter so any next tags will be fired immediately,
          // rather than queued for execution.
          this.reRun = rerun;
          this.starterExecuted = new Date().valueOf();
          this._processQueuedTagsToRun();
          // done
        }.bind(this);

        if (this.customStarter) {
          // default starter executes immediately
          this.customStarter(this.getSession(), callback, tag);
        } else {
          // if unset - used default
          Filter.prototype.customStarter.call(
            this,
            this.getSession(),
            callback,
            tag);
        }
      }
    } else {
      // if the starter was executed, run tags immediately
      // hasnt be called, tags are queued to execute.
      this._triggerTag(tag);
    }
  };
  
  /**
   * @private
   * Strictly private.
   */
  Filter.prototype._processQueuedTagsToRun = function () {
    for (var i = 0; i < this.tagsToRun.length; i++) {
      var tag = this.tagsToRun[i];
      this._triggerTag(tag);
    }
  };
  
  Filter.prototype._triggerTag = function (tag) {
    if (this.reRun === true) {
      tag.run();
    } else {
      tag.runOnce();
    }
  };
  
  /**
   * State function, this function adds to standard state function the SESSION
   * state. Session state is used if `customStarter` is attached.
   * @param {qubit.opentag.Session} session optional session
   */
  Filter.prototype.getState = function (session) {
    if (session) {
      this.setSession(session);
    }
    var pass = Filter.SUPER.prototype.getState.call(this);
    
    if (pass === BaseFilter.state.DISABLED) {
      return BaseFilter.state.DISABLED;
    }
    
    if (pass === BaseFilter.state.PASS) {
      if (this.isSession()) {
        pass = BaseFilter.state.SESSION;
      }
    }
    
    if (this.config.script) {
      pass = this.config.script.call(this, pass, this.getSession());
    }
    
    this.lastState = pass;
    return pass;
  };
  
  /**
   * Reset function.
   */
  Filter.prototype.reset = function () {
    Filter.SUPER.prototype.reset.call(this);
    this._matchState = undefined;
    this._starterWasRun = undefined;
    this.starterExecuted = undefined;
    this.tagsToRun = [];
    this.reRun = undefined;
  };
}());