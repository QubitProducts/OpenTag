//:import qubit.Define
//:import qubit.opentag.pagevariable.BaseVariable
//:import qubit.qprotocol.PubSub
//:import qubit.opentag.Utils

//:include uv-api/uv-api.js 

/*
 * TagSDK, a tag development platform
 * Copyright 2013-2016, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  
  var PubSub = qubit.qprotocol.PubSub;
  var Utils = qubit.opentag.Utils;
  var DELIMITER = ":";

  /**
   * #QProtocolVariable type variable class.
   * 
   * This is a page variable that makes it easy to read and listen to incoming
   * qprotocol events. 
   * 
   * QProtocol does support value changed event handlers and handlers can be 
   * added using `this.onValueChanged(callback)` function. 
   * Callback will receive oldValue and variable instance reference as 
   * parameters.
   * 
   * Example:
   * 
   * 
   *     varRef.onValueChanged(function(oldValue, variableRef){
   *       console.log(variableRef.getValue() !== oldValue); // true
   *     });
   * 
   * 
   * 
   * See properties to check on configuration options.
   * 
   * Author: Peter Fronc <peter.fronc@qubitdigital.com>
   * 
   * @class qubit.opentag.pagevariable.QProtocolVariable
   * @extends qubit.opentag.pagevariable.BaseVariable
   * @param config {Object} config object used to build instance
   */
  function QProtocolVariable(config) {
    QProtocolVariable.SUPER.apply(this, arguments);
  }
  
  qubit.Define.clazz(
          "qubit.opentag.pagevariable.QProtocolVariable",
          QProtocolVariable,
          qubit.opentag.pagevariable.BaseVariable);
  
  /**
   * Init function is called by `getValue()`
   */
  QProtocolVariable.prototype.init = function () {
    if (this.initialized) {
      return false;
    } else {
      // mark first use
      this.initialized = new Date().valueOf();
    }
    
    this.callHandlersOnRead = true;
    
    /**
     * Event name that this variable listens to. 
     * Its the `meta.type` property in qprotocol event object.
     * 
     * Value can also contain optional object path that will be accessed.
     * 
     * Path property indicates which event object child should be
     * used as this variable output value (normally event object is).
     * 
     * It may be usefult to not to have to check long object paths when
     * accessing directly event (eq. code like: `a && a.b && a.b.c && a.b.c.d` to
     * access `a.b.c.d` only).
     * 
     * Example: 
     * 
     * uv.variable.in.event@my.event.name
     * 
     * reference.     * 
     * @property {String} value - event name (event.meta.type)
     */
    
    if (!this.handlerAttached) {
      var _this = this;
      
      var result = this.getValueAndPath(this.value);
      
      this.eventName = result[0];
      this.objectPath = result[1];
      
      this.updateValue();
      
      PubSub.subscribe(this.eventName, function (event) {
        _this.updateValue(event);
      });
      
      this.handlerAttached = new Date().valueOf();
    }
  };
  
  QProtocolVariable.prototype.getValueAndPath = function (value) {
    var eventName = value;
    var opath;

    if (eventName) {
      var idx = value.indexOf(DELIMITER);
      if (idx !== -1) {
        eventName = value.substring(0, idx);
        opath = value.substring(idx + 1);
      }
    }

    return [eventName, opath];
  };
  
  QProtocolVariable.prototype.getValue = function () {
    this.init();
    return this.currentValue;
  };
  
  /**
   * Function returns event hitory object that contains following properties:
   * - `current` property, pointing to most recent qprotocol event that this 
   *    page variable listens to.
   * - `history` property that points to array containing all events that 
   *    were published.
   * 
   * In general:
   * ```
   *     this.getEventsHistory().current === this.getEventsHistory().history[0]
   * ```
   * 
   * @returns {Object} event history object.
   */
  QProtocolVariable.prototype.getEventsHistory = function () {
    return PubSub.getEventHistory(this.eventName);
  };
  
  /**
   * Function is a worker used to update current variable state.
   * 
   * It is possible to overload/reimplement this method where necessary.
   * 
   * Normaqlly it updates current value when new event is incoming 
   * from uv-api.
   * 
   * This function is used directly by
   * @param {Object} event optional event.
   * @returns {Object} the current value.
   */
  QProtocolVariable.prototype.updateValue = function (event) {
    if (!event) {
      var history = this.getEventsHistory();
      if (history) {
        event = history.current;
      }
    }
    
    var newValue;
    var opath = this.objectPath;
    
    if (event && opath) {
      newValue = Utils.getObjectUsingPath(opath, event);
    } else {
      newValue = event;
    }

    this._updateCurrentValue(newValue);
    
    return newValue;
  };
  
  /**
   * Disabled for QProtocol - qprotocol handles event by itself.
   */
  QProtocolVariable.prototype.startObservingForChanges = function () {
    // this variable manages itself all updates
  };
  
  /**
   * Disabled for QProtocol - qprotocol handles event by itself.
   */
  QProtocolVariable.prototype.stopObservingForChanges = function () {
    // this variable manages itself all updates
  };
  
}());