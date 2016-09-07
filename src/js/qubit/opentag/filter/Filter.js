//:import qubit.opentag.Log
//:import qubit.Define
//:import qubit.opentag.filter.SessionVariableFilter

/*
 * TagSDK, a tag development platform
 * Copyright 2013-2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  var SessionVariableFilter = qubit.opentag.filter.SessionVariableFilter;

  /**
   * #SessionVariable filter class.
   * @class qubit.opentag.filter.Filter
   * @extends qubit.opentag.filter.SessionVariableFilter
   * @param config {Object} config object used to build instance
   */
  function Filter(config) {
//    var defaultConfig = {};
//    Utils.setIfUnset(config, defaultConfig);
    Filter.SUPER.call(this, config);
  }
  
  qubit.Define.clazz(
          "qubit.opentag.filter.Filter",
          Filter,
          SessionVariableFilter);
}());