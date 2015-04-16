/*UVListener package*/
//:include html/Json2.js

(function () {
  function trim(text) {
    return text.replace(/^\s+/, "").replace(/\s+$/, "");
  }
  
  var UVListener = {
      callbacks: {},
      unfired_events: [],
      early_callbacks: null,
      currentUV: null
    },
    uv,
    uvLocation = "universal_variable",
    starterId = 0,
    POLL_DELAY_MS = 500,
    timer;

  /*** INTERNAL FUNCTIONS ***/

  UVListener._isArray = function (input) {
    return (Object.prototype.toString.call(input) === "[object Array]");
  };

  // Determines if a given subelement (denoted by keyString) has changed
  UVListener._targetChanged = function (keyString, old, newObject) {
    var oldAsObject, oldTarget, newTarget;
    if (newObject === null) {
      if (old === "null") {
        return false;
      } else {
        return true;
      }
    } else if (newObject === undefined) {
      if (old === newObject) {
        return false;
      } else {
        return true;
      }
    } else {
      oldAsObject = JSON.parse(old);
      oldTarget = UVListener._getNested(oldAsObject, keyString);
      newTarget = UVListener._getNested(newObject, keyString);
      return !UVListener._jsonIsEqual(oldTarget, newTarget);
    }
  };

  // Go through all the things that have been pushed 
  // before the API has loaded
  UVListener._processCallbacks = function () {
    var i;
    if (UVListener.early_callbacks && UVListener.early_callbacks.length > 0) {
      for (i = 0; i < UVListener.early_callbacks.length; i += 1) {
        UVListener.push(UVListener.early_callbacks[i]);
      }
      UVListener.early_callbacks = null;
    }
  };

  // Get all the keys out of a string in an array format
  UVListener._keyStringToArr = function (keyString) {
    keyString = trim(keyString);
    if (keyString === "") {
      return [];
    } else {
      // convert indexes to properties
      keyString = keyString.replace(/\[(\w+)\]/g, ".$1");
      // strip a leading dot
      keyString = keyString.replace(/^\./, ""); 
      return keyString.split(".");
    }
  };

  // Get the value of a nested thing in an object.
  // e.g. UVListener._getNested(universal_variable, "transaction.total")
  UVListener._getNested = function (object, keyString) {
    var arr = UVListener._keyStringToArr(keyString),
      n;
    while (arr.length > 0) {
      n = arr.shift();
      if (object.hasOwnProperty(n)) {
        object = object[n];
      } else {
        return;
      }
    }
    return object;
  };

  // Compare the two arguments using JSON.stringify
  UVListener._jsonIsEqual = function (obj1, obj2) {
    if (typeof obj1 !== "string") {
      obj1 = JSON.stringify(obj1, UVListener._stripEvents);
    }
    if (typeof obj2 !== "string") {
      obj2 = JSON.stringify(obj2, UVListener._stripEvents);
    }
    return obj1 === obj2;
  };

  // Causes JSON.stringify to skip the events object, if passed as the second
  // argument: JSON.stringify(object, UVListener._stripEvents)
  UVListener._stripEvents = function (key, value) {
    if (key !== "events") {
      return value;
    } else {
      return undefined;
    }
  };

  UVListener._on = function (type, func) {
    var typeArray, key;
    // Separate type from keyString
    typeArray = type.split(":");
    type = typeArray[0];
    key = typeArray[1];
    UVListener.callbacks[type] = UVListener.callbacks[type] || [];
    // Include keyString in the callback object (if specified)
    if (key) {
      UVListener.callbacks[type].push({
        keyString: key,
        func: func
      });
    } else {
      UVListener.callbacks[type].push({
        func: func
      });
    }
  };

  UVListener._trigger = function (type, data) {
    var i, keyString;
    // Are there any callbacks which might be relevant?
    if (UVListener.callbacks[type]) {
      // Loop through all potentially relevant callbacks
      for (i = 0; i < UVListener.callbacks[type].length; i += 1) {
        // Make sure the callback has a function we can use
        if (typeof UVListener.callbacks[type][i].func === "function") {
          // Determine if there's an associated keyString
          keyString = UVListener.callbacks[type][i].keyString;
          if (keyString) {
            // Handle the keyString if we know how
            if (type === "change" && 
                UVListener._targetChanged(keyString, UVListener.currentUV, uv)) {
              UVListener.callbacks[type][i].func(data);
            } // Place logic for other types which use keyStrings here.
          // If there's no keyString, just callback 
          } else {
            UVListener.callbacks[type][i].func(data);
          }
        } 
      }
    }
  };

  // Modified push function for uv.events array
  UVListener._eventsPush = function (evt) {
    var i, ii;
    uv.events[uv.events.length] = evt;
    evt.time = evt.time || (new Date()).getTime();
    if (UVListener.callbacks.event) {
      i = 0; ii = UVListener.callbacks.event.length;
      for (i; i < ii; i += 1) {
        UVListener.callbacks.event[i].func(evt);
      }
    }
    evt.has_fired = true;
  };

  UVListener._getUnfiredEvents = function () {
    var i = 0;
    for (i = 0; i < uv.events.length; i += 1) {
      if (!uv.events[i].has_fired) {
        //Event hasn't fired, re-insert it now that push is redefined.
        UVListener.unfired_events.push(uv.events.splice(i, 1)[0]);
        i -= 1; //The remaining events have shifted backward.
      }
    }
  };

  UVListener._fireEvents = function () {
    while (UVListener.unfired_events.length > 0) {
      uv.events.push(UVListener.unfired_events.shift());
    }
  };

  UVListener._resetEventsPush = function () {
    uv.events = uv.events || [];
    if (uv.events.push.toString().indexOf("[native code]") !== -1) {
      uv.events.push = UVListener._eventsPush;
      UVListener._getUnfiredEvents();
      UVListener._fireEvents();
    }
  };

  UVListener._checkForChanges = function () {
    // Only check if we actually have some callbacks registered
    if (UVListener.callbacks.change && UVListener.callbacks.change.length > 0) {
      if (!UVListener._jsonIsEqual(UVListener.currentUV, uv)) {
        // If UV changed, trigger "change" callbacks.
        UVListener._trigger("change", uv);
        // After triggering, log the new UV as current.
        UVListener.currentUV = JSON.stringify(uv, UVListener._stripEvents);
      }
    }
  };

  UVListener._setUVLocation = function (newLoc) {
    uvLocation = newLoc;
    UVListener._initUV();
  };

  UVListener._initUV = function () {
    window[uvLocation] = window[uvLocation] || {
      events: []
    };
    uv = window[uvLocation];
    if (!uv.events) {
      uv.events = [];
    }
  };

  /*** INTENDED API ***/

  /* USAGE
    Change listening:

    Fire a callback function on any change to UV:
      window.uv_listener.push(["on", "change", callback]);

    Fire a callback function on any change to specific part of UV:
      window.uv_listener.push(["on", "change:keyString", callback])
    where "keyString" is a property path within the UV. For example:
      "change:transaction" will fire if the transaction object is changed
      "change:basket.line_items.length" will fire if products are added to ore
        removed from the basket

    Event listening:
      window.uv_listener.push(["on", "event", callback])
    Note that the callback is expected to take an argument (the event object)
      and also do the processing to determine if the event is relevant.
  */

  UVListener.push = function (data) {
    if (!UVListener._isArray(data)) {
      return;
    }
    if (data[0] === "on") {
      UVListener._on(data[1], data[2]);
    } else if (data[0] === "trigger" && data[1]) {
      UVListener._trigger(data[1]);
    }
  };

  /*** INITIALIZATION ***/

  UVListener.init = function (testing, uvLoc) {
    if (uvLoc) {
      uvLocation = uvLoc;
    }
    UVListener._initUV();
    // Hold onto anything pushed to uv_listener before initialization
    // This is a little awkward now that the desired uv_listener is an object
    if (!window.uv_listener || UVListener._isArray(window.uv_listener)) {
      // Store the current uv_listener if the old is an array
      UVListener.early_callbacks = window.uv_listener || null;
      window.uv_listener = UVListener;
      if (!testing) {
        UVListener.start();
      }
    } else {
      if (uvLoc) {
        // If init is called with a specified location, ensure we're using that
        // This is necessary because typically qTracker will come second,
        // and it would not actually update window.UVListener, but it's also the
        // place where we tend to set custom locations.
        window.uv_listener._setUVLocation(uvLocation);
      }
    }
    
  };

  UVListener.start = function () {
    // Store a dump of the current UV
    UVListener.currentUV = JSON.stringify(uv, UVListener._stripEvents);

    // Begin polling
    timer = setInterval(function () {
      UVListener._initUV();
      UVListener._resetEventsPush();
      UVListener._checkForChanges();
    }, POLL_DELAY_MS);
    
    // Process things added before the API loads
    UVListener._processCallbacks();
  };

  q.html.UVListener = UVListener;
}());
