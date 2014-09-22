//:include qubit/opentag/Log.js
//:include qubit/opentag/Utils.js
//:include qubit/opentag/filter/BaseFilter.js

/*
 * TagSDK, a tag development platform
 * Copyright 2013-2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  var Utils = qubit.opentag.Utils;
  var BaseFilter = qubit.opentag.filter.BaseFilter;

  /**
   * #SessionVariable filter class.
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
   * @class qubit.opentag.filter.SessionVariableFilter
   * @extends qubit.opentag.filter.BaseFilter
   * @param config {Object} config object used to build instance
   */
  function SessionVariableFilter(config) {
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
      customStarter: function(session, ready, tag) {
        ready(false);
      },
      /**
       * Script deciding either script matches or not (top API level).
       * @cfg {Function}
       * @param {qubit.opentag.Session} session
       * @returns {Boolean}
       */
      customScript: function (session) {
        return true;
      }
    };
    
    if (config) {
      for(var prop in config) {
        if (config.hasOwnProperty(prop)) {
          if (prop === "customStarter" && !config[prop]) {
            continue;
          }
          if (prop === "customScript" && !config[prop]) {
            continue;
          }
          defaultConfig[prop] = config[prop];
        }
      }
    }
    
    SessionVariableFilter.superclass.call(this, defaultConfig);
  }
  
  Utils.clazz(
          "qubit.opentag.filter.SessionVariableFilter",
          SessionVariableFilter,
          BaseFilter);
  
  /**
   * Match function for a filter.
   * @returns {Boolean}
   */
  SessionVariableFilter.prototype.match = function () {
    try {
      return !!this.config.customScript(this.getSession());
    } catch (ex) {
      this.log.FINE("Filter match throws exception:" + ex);
      return false;
    }
  };
  
  /**
   * Function that will trigger running tag directly the callback privided in
   * configuration object, the `customStarter`.
   * @param {qubit.opentag.BaseTag} tag
   */
  SessionVariableFilter.prototype.runTag = function (tag) {
    if (!this._runTag) {
      if (this.config.customStarter) {
        //trigger "customStarter", only once
        this._runTag = true;
        this.config.customStarter(this.getSession(), function (rerun) {
          this.lastRun = new Date().valueOf();
          if (rerun === true) {
            tag.run();
          } else {
            tag.runOnce();
          }
          //done
        }.bind(this), tag);
      }
    }
  };
  
  /**
   * State function, this function adds to standard state function the SESSION
   * state. Session state is used if `customStarter` is attached.
   * @param {qubit.opentag.Session} session optional session
   */
  SessionVariableFilter.prototype.getState = function (session) {
    if (session) {
      this.setSession(session);
    }
    var pass = SessionVariableFilter.superclass.prototype.getState.call(this);
    
    if (pass === BaseFilter.state.DISABLED) {
      return BaseFilter.state.DISABLED;
    }
    
    if (pass === BaseFilter.state.PASS) {
      if (this.config.customStarter) {
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
  SessionVariableFilter.prototype.reset = function () {
    SessionVariableFilter.superclass.prototype.reset.call(this);
    this._runTag = undefined;
  };
}());