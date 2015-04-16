//:include qubit/Define.js
//:include qubit/opentag/Log.js

/*
 * TagSDK, a tag development platform
 * Copyright 2013-2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  var counter = 0;
  
  /**
   * @class qubit.opentag.filter.BaseFilter
   * 
   * #Base filter class.
   * 
   * Filters are objects that can be used with any 
   * qubit.opentag.BaseTag instances. Tag use filters ONLY when 
   * `runIfFiltersPass` is used to run a tag. Containers will run by default 
   * tags with filters associated with them.
   * 
   * Filter object has a `match` function that determines if filter can be used
   * with the tag. Second important function is `getState` function that 
   * describes filter's state:
   *  - DISABLED filter is disabled and ignored, same effect as filter is not 
   *  associated with the tag.
   *  - SESSION filter is in session
   *  - PASS filter passed and tag can be run.
   *  - FAIL filter failed to pass
   *  - `any value higher than 0` value higher than 0 indicates that filter
   *   must be tested again in time of the value of miliseconds. Tag will query 
   *   filter for state again after the miliseconds amount indicated by the 
   *   state value.
   * 
   * 
   * @param config {Object} config object used to build instance
   */
  function BaseFilter(config) {
    /*log*/
    this.log = new qubit.opentag.Log("", function () {
      return this.CLASS_NAME + "[" + this.config.name + "]";
    }.bind(this), "collectLogs");
    /*~log*/
    
    this.config = {
      /**
       * Filter order number - it is used by tag to determine order of filters.
       * @cfg {String} [order=0]
       */
      order: 0,
      /**
       * Include property indicates if this is "include" or "exclude" type
       *  filter.
       * @cfg {Boolean} [include=true]
       */
      include: true,
      /**
       * Filter name - each filter should have a name, if not specified - 
       * default will be given.
       * @cfg {String} [name="Filter-<timestamp>"]
       */
      name: "Filter-" + (counter++),
      /**
       * If defined, it will be used as final state decision maker.
       * It takes 2 arguments: (`this`, `passed`). passed argument is
       * the last state decision value taken.
       * @cfg {Function} [script=undefined]
       */
      script: undefined,
      /**
       * Session object - can be passed via configuration.
       * @cfg {qubit.opentag.Session} [session=undefined]
       */
      session: undefined
    };
    
    /**
     * Session object - if attached, it will be attached normally by 
     * tag instance.
     * @property {qubit.opentag.Session} session
     */
    this.session = null;
    
    if (config) {
      for (var prop in config) {
        if (config.hasOwnProperty(prop)) {
          this.config[prop] = config[prop];
        }
      }
      if (config.session) {
        this.setSession(config.session);
      }
    }
  }
  
  qubit.Define.clazz("qubit.opentag.filter.BaseFilter", BaseFilter);
  

  /**
   * State value higher than 0 is used to distinqt delayed filters.
   *
   *     {
   *        DISABLED: -3,
   *        SESSION: -2,
   *        PASS: -1, //positive numbers are used for timeout
   *        FAIL: 0
   *     }; 
   * 
   * @static
   * @property {Number} state
   */
  BaseFilter.state = {
    DISABLED: -3,
    SESSION: -2,
    PASS: -1, //positive numbers are used for timeout
    FAIL: 0
  };
  
  /**
   * Function will reset object to initial state (disabled state will be turned
   *  to enabled).
   */
  BaseFilter.prototype.reset = function () {
    this.enable();
  };
  
  /**
   * Function will disable filter. State returned will be turned to disabled.
   */
  BaseFilter.prototype.disable = function () {
    this.config.disabled = true;
  };
  
  /**
   * Function will enmable filter.
   */
  BaseFilter.prototype.enable = function () {
    this.config.disabled = false;
  };
  
  /**
   * Function that determines if filter matches for use.
   * @returns {Boolean}
   */
  BaseFilter.prototype.match = function () {
    return true;
  };
  
  /**
   * Session object setter for filter.
   * @param {qubit.opentag.Session} session
   */
  BaseFilter.prototype.setSession = function (session) {
    this.session = session;
  };
  
  /**
   * Session object getter for filter.
   * @returns {qubit.opentag.Session}
   */
  BaseFilter.prototype.getSession = function () {
    return this.session;
  };
  
  /**
   * Filter function used to test filter for its state.
   * Tag has 2 stages at using filters:
   * 1) Checks if filter matches(apply) for the page - if so, tag will 
   * use the filter.
   * 2) If filter matches the page, it will run `getState()` to determine 
   * state type and decide on execution and how it relates with other filters.
   * @returns {Boolean}
   */
  BaseFilter.prototype.getState = function () {
    var passed = BaseFilter.state.PASS;
    
    if (this.config.disabled) {
      return BaseFilter.state.DISABLED;
    }
    
    if (this.config.script) {
      passed = this.config.script.call(this, passed);
    }
    
    if (isNaN(+passed)) {
      this.log.WARN("filters should use a numerical state as a return " +
              "for getState():" +//L
              " BaseFilter.state. Filter will fail. Returned: " + passed);//L
      passed = BaseFilter.state.FAIL;
    }
    
    this.lastState = +passed;
    
    return passed;
  };
}());