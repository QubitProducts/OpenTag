//:include qubit/Define.js

/*
 * TagSDK, a tag development platform
 * Copyright 2013-2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  var Define = qubit.Define;
  
  /**
   * #PatternType static class.
   * 
   * This is a map for URL pattern types with descriptive names.
   * 
   * 
   * @class qubit.opentag.filter.pattern.PatternType
   * @singleton
   * @type Object
   */
  var PatternType = {
    /**
     * @property {Object} CONTAINS
     */
    CONTAINS: "Contains",
    /**
     * @property {Object} MATCHES_EXACTLY
     */
    MATCHES_EXACTLY: "Matches Exactly",
    /**
     * @property {Object} STARTS_WITH
     */
    STARTS_WITH: "Starts with",
    /**
     * @property {Object} ENDS_WITH
     */
    ENDS_WITH: "Ends with",
    /**
     * @property {Object} REGULAR_EXPRESSION
     */
    REGULAR_EXPRESSION: "Regular Expression",
    /**
     * @property {Object} ALL_URLS
     */
    ALL_URLS: "All URLs"
  };
  
  Define.namespace("qubit.opentag.filter.pattern.PatternType", PatternType);
}());


