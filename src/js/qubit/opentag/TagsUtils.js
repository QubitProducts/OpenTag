//:include GLOBAL.js
//:include html/FileLoader.js
//:include qubit/opentag/filter/BaseFilter.js
//:include qubit/opentag/filter/SessionVariableFilter.js
//:include html/HtmlInjector.js

(function () {
    var Utils = qubit.opentag.Utils;
    var log = new qubit.opentag.Log("TagsUtils -> ");
    var BaseFilter = qubit.opentag.filter.BaseFilter;
    var HtmlInjector = q.html.HtmlInjector;
    var FileLoader = q.html.fileLoader;
    var SessionVariableFilter = qubit.opentag.filter.SessionVariableFilter;
    
    /**
     * #Tag utility class
     * This class contains typical utility functions related to tags/loaders.
     * @singleton
     * @class qubit.opentag.TagsUtils
     */
    var TagsUtils = function () {};
    
    Utils.clazz("qubit.opentag.TagsUtils", TagsUtils);
    
    var _bodyLoaded = false;
    /**
     * Function returns true when body is interactible(it checks if body tag
     * exists and "loading" state is unset).
     * @returns {Boolean}
     */
    TagsUtils.bodyLoaded = function () {
      if (_bodyLoaded) {
        return true;
      }
      _bodyLoaded = !!(document.body && document.readyState !== "loading");
      return _bodyLoaded;
    };
    
    var loadedURLs = {};
    
    var STATE = {
      SUCCESS: "success",
      FAIL: "failure",
      INIT: "not started"
    };
    
    /**
     * Utility function for script url loading.
     * 
     * @param {Object} config Configuration object with properties:
     * 
     *  - `url` url to use 
     *  
     *  - `noMultipleLoad` do not load URL if was previously loaded (optional)
     *    
     *  - `onsuccess` event handler (optional) 
     *  
     *  - `onerror`  event handler (optional)
     *
     *  - `node` node to append (optional)
     * @return {undefined}
     */
    TagsUtils.loadScript = function (config) {
      var url = config.url;
      
      var loadingCheck = function (passedUrlFromLoader, loadError, loadFailed) {
        loadedURLs[url].error = loadError;
        if (loadFailed) {
          log.ERROR("Loading process error:");
          log.ERROR(loadError, true);
          loadedURLs[url].state = STATE.FAIL;
          config.onerror();
        } else {
          loadedURLs[url].state = STATE.SUCCESS;
          config.onsuccess();
        }
      };
      
      if (loadedURLs[url]) {
        if (config.noMultipleLoad) {
          log.FINE(url + " is already loaded, with state: " +
                  loadedURLs[url].state);//L
          return loadingCheck(
            url,
            loadedURLs[url].error,
            loadedURLs[url].state === STATE.FAIL
          );
        }
        loadedURLs[url].count += 1;
      } else {
        loadedURLs[url] = {
          count: 1,
          state: null
        };
      }
      
      var useWrite = !config.async;
      
      var loaded = TagsUtils.bodyLoaded();
      if (useWrite && loaded) {
        log.WARN("Script configured for synchronous injection while " +
                "document seems to be already loaded. Secure option " +//L
                "applies. Script will be appended in standard way.");//L
      }
      
      useWrite = useWrite && !loaded;
      
      if (useWrite) {
        log.WARN("Adding script element by using document.write. IE will" +
                " error check fail broken url's.");//L
        TagsUtils.writeScriptURL(
          url,
          function (allOk, error) {
            loadingCheck(url, error, !allOk);
          });
      } else {
        FileLoader.load(
          url,
          false,
          loadingCheck,
          config.node,
          config.async
        );
      }
    };
    
    
    var docWriteMethods = null;
    
    /**
     * Function holding `document.write` calls and let any writes to be 
     * collected into passed array as argument.
     * 
     * @param {Array} array
     * @param {qubit.opentag.Log} log log instance (optional)
       */
    TagsUtils.redirectDocumentWritesToArray = function (array, log) {
      var text = array;
      log && log.FINE("redirecting document.write methods...");
      docWriteMethods = docWriteMethods || {
        write: document.write,
        writeln: document.writeln
      };
      
      document.write = function (t) {
        text.push(t);
        log && log.FINE("Received call from document.write with:" + t);
      };
      document.writeln = function (t) {
        text.push(t);
        log && log.FINE("Received call from document.writeln with:" + t);
      };
    };
    
    /**
     * Function flushes all doc write redirects from the array passed (appended
     * string) and brings back normal document.write method.
     * 
     * @param {Array} array
     * @param {String} location
     * @param {Boolean} append
     * @param {qubit.opentag.Log} log
     * @param {Function} cb callback
     * @returns {Boolean} true if flushing location was ready and strings were
     *                    appended.
     */
    TagsUtils.flushDocWritesArray =
            function (array, location, append, log, cb) {
      var el = location;
      if (el && array) {
        var flushed = array.splice(0, array.length);
        try {
          TagsUtils.injectHTML(el, append, flushed.join("\n"), cb || EMPTY_FUN);
          return true;
        } catch(ex) {
          log.ERROR("Loading html caused exception:" + ex);
        }
      } else {
        var message = "Flushing location not found!";
        log && log.ERROR(message);
        return false;
      }
      if (cb) {
        cb();
      }
      return true;
    };

    /**
     * Unlocks document writes to normal state (if locked).
     */
    TagsUtils.unlockDocumentWrites = function () {
      if (docWriteMethods) {
        log && log.FINEST("Bringing back document.write");     
        document.write = docWriteMethods.write;
        document.writeln = docWriteMethods.writeln;
        docWriteMethods = null;
      }
    };

    var wsCounter = 0;
    /**
     * @deprecated
     * Old qtag write method for scripts.
     * @param {String} url
     * @param {Function} callback
     */
    TagsUtils.writeScriptURL = function (url, callback) {
      //@TODO review it.
      var callName = "_" + wsCounter++;
      var accessorName = TagsUtils.prototype.PACKAGE_NAME +
              ".TagsUtils.writeScriptURL.callbacks." + callName;
          
      TagsUtils.writeScriptURL.callbacks[callName] = function (error) {
        if (error) {
          callback(false, "error while loading script " + url);
        } else {
          callback(true);
        }
        TagsUtils.writeScriptURL.callbacks[callName] = undefined;
        delete TagsUtils.writeScriptURL.callbacks[callName];
      };
      
      var jsIE = "if(this.readyState === \"loaded\" || " +
              "this.readyState === \"complete\"){ try {" +
               accessorName + "(true)" +
              "} catch (ex) {}}";
      
      var jsNonIE = "try{" + accessorName + "(false)}catch(ex){}";
      var jsNonIEerr = "try{" + accessorName +
              "(true)}catch(ex){}";
      
      var scr = "scr", value;
      url = FileLoader.tidyUrl(url);
      value = "<" + scr + "ipt onload='" + jsNonIE +
              "'  onerror='" + jsNonIEerr +
              "' onreadystatechange='" + jsIE +
              "' type='text/javascript' " +
              " src='" + url + "'>" +
              //@TODO consider adding async option here
              //(doies it  really make sense?)
        "</" + scr + "ipt>";
      document.write(value);
    };
    
    TagsUtils.writeScriptURL.callbacks = {};
    
    var SESSION = BaseFilter.state.SESSION;
    var PASS = BaseFilter.state.PASS;
    var FAIL = BaseFilter.state.FAIL;
    
    /**
     * Entry method used to check if all filters used by this tag are passed.
     * BaseTag searches for filters in this.config.**package**.filters location.
     * The location should indicate all filters used by this tag.
     * The **package* config property is a crucial tags property used to
     * configure antiore tags. Filters can be added at runtime and via config
     * object as an array.
     * @param filters {Array} Array of filters to be analysed.
     * @param session {qubit.opentag.Session} tag that check is
     *  performed on
     * @returns {BaseFilter.state} numerical state.
     */
    TagsUtils.filtersState = function (filters, session, tag) {
      //tag.log.FINEST("Sorting filters...");
      //@todo maybe this should be done buch earlier
      filters = filters.sort(function (a, b) {
        try {
          return b.config.order - a.config.order;
        } catch (nex) {
          return 0;
        }
      });
      
      var decision = PASS;
      if (!filters || (filters.length === 0)) {
        return decision;
      }
      
      //loop and execute - MATCH
      var lastFilterResponded = null;
      var disabledFiltersPresent = false;
      var sessionFiltersPresent = false;
      var waitingResponse = 0;
      var response;
      var lastSessionFilter;
      
      var filter;
      var lastUnmatched;
      for (var i = 0; i < filters.length; i++) {
        filter = filters[i];
        filter.setSession(session);
        
        if (filter.match()) {
          response = filter.getState();
          // positive response means that filter tells to WAIT for execution
          // and try in 'response' miliseconds
          if (response > 0) {
            if (waitingResponse === 0 || waitingResponse > response) {
              waitingResponse = response;
            }
          } else if (response === BaseFilter.state.DISABLED) {
            tag.log.WARN("filter with name " + filter.config.name +
                    " is disabled");//L
            disabledFiltersPresent = true;
          } else if (response === SESSION) {
            sessionFiltersPresent = true;
            lastFilterResponded = filter;
            lastSessionFilter = filter;
          } else {
            lastFilterResponded = filter;
          }
        } else {
          lastUnmatched = filter;
        }
      }
      
      var onlyAwaitingFiltersPresent = false;
      if (lastFilterResponded === null) {
        onlyAwaitingFiltersPresent = true;
        if (!disabledFiltersPresent) {
          //all filters failed
          decision = FAIL;
        } else {
          //none passed but one of filters was disabled
          decision = PASS;
        }
      } else {
        //some filters matched, review state of final matched filter
        if (lastFilterResponded.config.include) {
          //last response was to INCLUDE this tag
          decision = response;
        } else {
          //last response was to EXCLUDE this tag
          decision = (response === PASS) ? FAIL : PASS;
        }
      }
      
      //if all passed, 
      //after standard checks, check if any filter called to wait
      if (waitingResponse > 0 && 
              (decision === PASS || onlyAwaitingFiltersPresent)) {
        decision = waitingResponse;
      }
      
      if (decision === SESSION ||
              ((decision === PASS) && sessionFiltersPresent)) {
        if (!lastSessionFilter.config.include) {
          return FAIL;
        }
        
        decision = SESSION;
        if (lastSessionFilter instanceof SessionVariableFilter) {
          try {
            lastSessionFilter.runTag(tag);
          } catch (ex) {
            lastSessionFilter.log.FINEST("trying custom starter failed:" + ex);
          }
        }
      }
      
      if (tag.config.dedupe && decision === PASS) {
        if (lastUnmatched && lastUnmatched instanceof SessionVariableFilter) {
          tag.sendDedupePing = true;
          decision = FAIL;
        }
      }
      
      return decision;
    };

    /**
     * HTML injection utility.
     * This function will analyse code if there are any script objects and call 
     * calback when everything is loaded.
     * @param {Element} location DOM Element where to append
     * @param {Boolean} append Appent or insert before (false).
     * @param {String} html HTML to be appended
     * @param {Function} callback Callback to be called when ready.
     */
    TagsUtils.injectHTML = function (location, append, html, callback) {
//      if (!TagsUtils.bodyLoaded()) {
//        document.write(html);
//        callback();
//        return;
//      }
      //@TODO: this is old code, and buggy, refactor it.
      return HtmlInjector.inject(
              location,
              (!append) ? 1 : 0,
              html,
              callback || EMPTY_FUN);
    };
    
    /**
     * Resolves injection location for a tag.
     * 
     * @param {qubit.opentag.BaseTag} tag Tag reference
     * @returns {Element} document Element location for a tag.
     */
    TagsUtils.getHTMLLocationForTag = function (tag) {
      var el;
      var name = tag.prepareLocationObject(tag.config.locationObject);
      switch (name) {
        case "HEAD":
           el = document.getElementsByTagName("head")[0];
           break;
         case "BODY":
           el = document.body;
           break;
         default:
          if (name) {
            el = document.getElementById(name);
          } else {
            el = document.body;
          }
      }
      
      return el;
    };
    
})();