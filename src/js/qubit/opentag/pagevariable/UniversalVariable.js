//:import qubit.Define
//:import qubit.opentag.pagevariable.Expression

/*
 * TagSDK, a tag development platform
 * Copyright 2013-2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {

  /**
   * #UniversalVariable type variable class.
   * 
   * This class controlls how expression based page variables are executed
   * and parsed. It will detect universal variable "arrays" objects with hash
   * notation. It also provides all utilities to deal with expressions defined
   * as a `uv` properties on parameter objects in tag configuration.
   * In typical scenarion this class wil evaluate strings passed as values and
   * return the value via `getValue`.
   * 
   * 
   * Author: Peter Fronc <peter.fronc@qubitdigital.com>
   * 
   * @class qubit.opentag.pagevariable.UniversalVariable
   * @extends qubit.opentag.pagevariable.Expression
   * @param config {Object} config object used to build instance
   */
  function UniversalVariable(config) {
    UniversalVariable.SUPER.apply(this, arguments);
  }
  
  qubit.Define.clazz(
          "qubit.opentag.pagevariable.UniversalVariable",
          UniversalVariable,
          qubit.opentag.pagevariable.Expression);
}());