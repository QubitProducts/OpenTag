//:import html.html

(function () {
  var DOMContentLoaded,
    isReady = false,
    readyWait = 1,
    readyList,
    readyComplete, 
    bindReadyComplete, 
    doScrollCheck;
  readyComplete = function (wait) {
    var f;
    // A third-party is pushing the ready event forwards
    if (wait === true) {
      readyWait -= 1;
    }
  
    // Make sure that the DOM is not already loaded
    if (!readyWait || (wait !== true && !isReady)) {
      // Make sure body exists, at least, 
      // in case IE gets a little overzealous (ticket #5443).
      if (!document.body) {
        return setTimeout(readyComplete, 1);
      }
  
      // Remember that the DOM is ready
      isReady = true;
  
      // If a normal DOM Ready event fired, decrement, and wait if need be
      if (wait !== true) {
        readyWait -= 1;
        if (readyWait > 0) {
          return;
        }
      }
  
      // While there are functions bound, to execute
      while (readyList.length > 0) {
        f = readyList.shift();
        f();
      }
    }
  };
  

  //The DOM ready check for Internet Explorer
  doScrollCheck = function () {
    if (isReady) {
      return;
    }

    try {
      // If IE is used, use the trick by Diego Perini
      // http://javascript.nwbox.com/IEContentLoaded/
      document.documentElement.doScroll("left");
    } catch (e) {
      setTimeout(doScrollCheck, 1);
      return;
    }

    // and execute any waiting functions
    readyComplete();
  };
  
  bindReadyComplete = function () {
    if (readyList) {
      return;
    }
  
    readyList = [];
  
    // Catch cases where $(document).ready() is called after the
    // browser event has already occurred.
    if (document.readyState === "complete") {
      // Handle it asynchronously to allow scripts 
      // the opportunity to delay ready
      return setTimeout(readyComplete, 1);
    }
  
    // Mozilla, Opera and webkit nightlies currently support this event
    if (document.addEventListener) {
      // Use the handy event callback
      document.addEventListener("DOMContentLoaded", DOMContentLoaded, false);
  
      // A fallback to window.onload, that will always work
      window.addEventListener("load", readyComplete, false);
  
    // If IE event model is used
    } else if (document.attachEvent) {
      // ensure firing before onload,
      // maybe late but safe also for iframes
      document.attachEvent("onreadystatechange", DOMContentLoaded);
  
      // A fallback to window.onload, that will always work
      window.attachEvent("onload", readyComplete);
  
      // If IE and not a frame
      // continually check to see if the document is ready
      var toplevel = false;
  
      try {
        toplevel = (window.frameElement === null) || 
          (window.frameElement === undefined);
      } catch (e) {}
  
      if (document.documentElement.doScroll && toplevel) {
        doScrollCheck();
      }
    }
  };
  
  //Handle when the DOM is ready
  q.html.ready = function (fn) {
    // Attach the listeners
    bindReadyComplete();

    // Add the callback
    if (isReady) {
      setTimeout(fn, 1);
    } else {
      readyList.push(fn);
    }
  };
  
  //Cleanup functions for the document ready method
  if (document.addEventListener) {
    DOMContentLoaded = function () {
      document.removeEventListener("DOMContentLoaded", 
          DOMContentLoaded, false);
      readyComplete();
    };

  } else if (document.attachEvent) {
    DOMContentLoaded = function () {
      // Make sure body exists, at least, in case IE gets a 
      // little overzealous (ticket #5443).
      if (document.readyState === "complete") {
        document.detachEvent("onreadystatechange", DOMContentLoaded);
        readyComplete();
      }
    };
  }
}());