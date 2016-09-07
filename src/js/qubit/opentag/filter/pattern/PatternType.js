//:import qubit.Define

/*
 * TagSDK, a tag development platform
 * Copyright 2013-2016, Qubit Group
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
    CONTAINS: "CONTAINS",
    /**
     * @property {Object} MATCHES_EXACTLY
     */
    MATCHES_EXACTLY: "MATCHES_EXACTLY",
    /**
     * @property {Object} STARTS_WITH
     */
    STARTS_WITH: "STARTS_WITH",
    /**
     * @property {Object} ENDS_WITH
     */
    ENDS_WITH: "ENDS_WITH",
    /**
     * @property {Object} REGULAR_EXPRESSION
     */
    REGULAR_EXPRESSION: "REGULAR_EXPRESSION",
    /**
     * @property {Object} ALL_URLS
     */
    ALL_URLS: "ALL_URLS"
  };
  
  Define.namespace("qubit.opentag.filter.pattern.PatternType", PatternType);
}());


