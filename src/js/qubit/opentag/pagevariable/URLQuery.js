//:import qubit.Define
//:import qubit.opentag.Utils
//:import qubit.opentag.pagevariable.BaseVariable

/*
 * TagSDK, a tag development platform
 * Copyright 2013-2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  var Utils = qubit.opentag.Utils;
  
  /**
   * #URL query variable class.
   * 
   * This class controls variable value by resolving the value to
   * URL parameters values.
   * 
   * 
   * @class qubit.opentag.pagevariable.URLQuery
   * @extends qubit.opentag.pagevariable.BaseVariable
   * @param config {Object} config object used to build instance
   */
  function URLQuery(config) {
    URLQuery.SUPER.apply(this, arguments);
  }
  
  qubit.Define.clazz(
    "qubit.opentag.pagevariable.URLQuery",
    URLQuery,
    qubit.opentag.pagevariable.BaseVariable);
  
  /**
   * It returns URL parameter value for parameter named as `this.value`.
   * @returns {String}
   */
  URLQuery.prototype.getValue = function () {
    return Utils.getQueryParam(this.value);
  };
}());