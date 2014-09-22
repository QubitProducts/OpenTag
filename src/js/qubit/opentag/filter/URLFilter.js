//:include qubit/opentag/Log.js
//:include qubit/opentag/Utils.js
//:include qubit/opentag/Timed.js
//:include qubit/opentag/filter/BaseFilter.js
//:include qubit/opentag/filter/pattern/PatternType.js

/*
 * TagSDK, a tag development platform
 * Copyright 2013-2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  var Utils = qubit.opentag.Utils;
  var BaseFilter = qubit.opentag.filter.BaseFilter;
  var Timed = qubit.opentag.Timed;
  var PatternType = qubit.opentag.filter.pattern.PatternType;
    
  /**
   * #URLFilter filter class.
   * 
   * This filter class implements various URL matching patterns, see
   * [PatternType](#!/api/qubit.opentag.filter.pattern.PatternType) class
   * for more details.
   * 
   * 
   * @class qubit.opentag.filter.URLFilter
   * @extends qubit.opentag.filter.BaseFilter
   * @param config {Object} config object used to build instance
   */
  function URLFilter(config) {
    this._lockObject = {};
    var defaultConfig = {
      /**
       * Pattern type. See qubit.opentag.filter.pattern.PatternType for more 
       * choices. Defaults to PatternType.CONTAINS.
       * @cfg {String}
       */
      patternType: PatternType.CONTAINS,
      /**
       * URL pattern that this filter will match
       * @cfg {String}
       */
      pattern: ""
    };
    
    if (config) {
      for(var prop in config) {
        if (config.hasOwnProperty(prop)) {
          defaultConfig[prop] = config[prop];
        }
      }
    }
    
    URLFilter.superclass.call(this, defaultConfig);
  }
  
  Utils.clazz("qubit.opentag.filter.URLFilter", URLFilter, BaseFilter);
  
  /**
   * URL getting wrapper.
   * By default (no arguments) it uses 
   * [Utils.getUrl()](#!/api/qubit.opentag.Utils) to get page URL.
   * @param {String} url Use to everride default behaviour, and use url instead 
   * [Utils](#!/api/qubit.opentag.Utils) utility.
   * @returns {String} URL string
   */
  URLFilter.prototype.getURL = function (url) {
    return url || Utils.getUrl();
  };
  
  /**
   * Filter match function. This function determines if given URL (or default)
   * matches the pattern defined in configuration.
   * 
   * @param {String} url url string (optional), normally document's is used
   * @returns {Boolean} url optional url to be given to run match on.
   */
  URLFilter.prototype.match = function (url) {
    url = this.getURL(url);
    var match = true; //be optimist
    var pattern = this.config.pattern;
    
    switch (this.config.patternType) {
      case PatternType.CONTAINS:
        match = (url.toLowerCase().indexOf(pattern.toLowerCase()) >= 0);
        break;
      case PatternType.MATCHES_EXACTLY:
        match = (url.toLowerCase() === this.config.pattern.toLowerCase());
        break;
      case PatternType.STARTS_WITH:
        match = (url.toLowerCase().indexOf(pattern.toLowerCase()) === 0);
        break;
      case PatternType.ENDS_WITH:
        match = ((url.lastIndexOf(pattern.toLowerCase()) + pattern.length) ===
                   url.length);
        break;
      case PatternType.REGULAR_EXPRESSION:
        match = new RegExp(pattern).test(url);
        break;
      case PatternType.ALL_URLS:
        match = true;
        break;
    }
    /*log*/
    Timed.maxFrequent(function() {
      this.log.FINEST("[ Filter " + this.config.name +
              "] Checking if patternType '" +//L
              this.config.patternType + "' match '" +//L
              pattern + "' pattern: " +//L
              (match ? ("Yes -> " + match) : "No") +//L
              ", include: " + (this.config.include));//L
    }.bind(this), 1000, this._lockObject);
    /*~log*/
    return match;
  };
  
}());