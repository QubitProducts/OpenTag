//:import qubit.Define
//:import qubit.opentag.Utils
//:import qubit.opentag.pagevariable.BaseVariable

/*
 * TagSDK, a tag development platform
 * Copyright 2013-2016, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  var Utils = qubit.opentag.Utils;
  
  /**
   * #DOM text content variable class.
   * 
   * 
   * @class qubit.opentag.pagevariable.DOMText
   * @extends qubit.opentag.pagevariable.BaseVariable
   * @param config {Object} config object used to build instance
   */
  function DOMText(config) {
    DOMText.SUPER.apply(this, arguments);
  }
  
  qubit.Define.clazz(
          "qubit.opentag.pagevariable.DOMText",
          DOMText,
          qubit.opentag.pagevariable.BaseVariable);
  /**
   * Get the element text value with specified ID (innerText like).
   * @returns {String} returns DOM string text value (not inner html)
   */
  DOMText.prototype.getValue = function () {
    this.log.FINEST("reading DOM element contents value");/*L*/
    var val = Utils.getElementValue(this.value);
    this._updateCurrentValue(val);
    return val;
  };
  
}());