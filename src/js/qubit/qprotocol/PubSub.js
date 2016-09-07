/* global qubit */

//:import GLOBAL
//:import qubit.Define
//:include uv-api/uv-api.js 

/*
 * Opentag, a tag deployment platform.
 * Copyright (C) 2011-2016, Qubit.com
 * All rights reserved.
 * 
 * @author peter.fronc@qubit.com
 */

var allEventsByType = {};
var unqueuedEvents = [];

var inititated = false;
var inititatedSuccessfully = false;

var global = qubit.Define.global();

function getUV() {
  return global.uv;
}

function initiate() {
  var uv = getUV();
  
  if (!uv || !uv.emit) {
    return false;
  }
  
  if (!inititated) {
    inititated = true;
    
    // bring back any awaiting events
    for (var i = 0; i < unqueuedEvents.length; i++) {
      var tmp = unqueuedEvents[i];
      if (tmp.on) {
        uv.on.apply(uv, tmp.on);
      } else if (tmp.emit) {
        uv.emit.apply(uv, tmp.emit);
      }
    }
    
    uv.on(/.*/, function (event) {
      var type = event.meta.type;
      var obj = allEventsByType[type];

      if (!obj) {
        allEventsByType[type] = {current: event, history: [event]};
      } else {
        obj.current = event;
        obj.history.push(event);
      }
    }).replay();
    
    inititatedSuccessfully = true;
  }
  
  return true;
}

var PubSub = {
  
  allEventsByType: allEventsByType,
  
  
  subscribe: function (eventName, callback) {
    if (inititatedSuccessfully) {
      var uv = getUV();
      uv.on(eventName, callback);
    } else {
      unqueuedEvents.push({on: [eventName, callback]});
    }
  },
  
  getEventHistory: function (name) {
    return this.allEventsByType[name];
  },
  
  /**
   * QProtocol event emmiter wrapper for opentag.
   * 
   * Always use this API to emit qprotocol events if you use opentag and not
   * uv-api directly.
   * 
   * @param {String} eventName event.meta.type used in qprotocol.
   * @param {Object} event Obect that will be dispatched.
   */
  publish: function (eventName, event) {
    if (inititatedSuccessfully) {
      var uv = getUV();
      uv.emit(eventName, event);
    } else {
      unqueuedEvents.push({emit: [eventName, event]});
    }
  },
  
  /**
   * 
   * This is the function that enables the QProtocol wiring for opentag.
   * It is run immediately after this class declaration.
   */
  connect: function () {
    initiate();
  }
};

// initialize the PubSub, later on the uv-api may not be added into opentag
// and therefore excluded
PubSub.connect();

qubit.Define.namespace("qubit.qprotocol.PubSub", PubSub);