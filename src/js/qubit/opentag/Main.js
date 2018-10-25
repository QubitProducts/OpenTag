/* global qubit, GLOBAL, q */

//:import GLOBAL
//:import qubit.opentag.Log
//:import qubit.opentag.Utils
//:import qubit.Cookie
//:import html.UVListener
//:import qubit.Define
//:import qubit.opentag.Container
//:import qubit.opentag.BaseTag

(function () {
  var log = new qubit.opentag.Log("Main -> ");/*L*/
  var Cookie = qubit.Cookie;
  var Utils = qubit.opentag.Utils;

  function Main() {
  }

  function requestedDebugMode() {
    var isDebug = false;
    if (Cookie.get("opentag_debug") ||
            document.location.href.indexOf("opentag_debug") >= 0) {
      isDebug = true;
    }
    return isDebug;
  }

  function requestedDebugTool() {
    var isDebug = false;
    if (Cookie.get("opentag_debug_tool") ||
            document.location.href.indexOf("opentag_debug_tool") >= 0) {
      isDebug = true;
    }
    return isDebug;
  }

  function disabled() {
    try {
      var fun = GLOBAL.TAGSDK_MAIN_DISABLED_FUNCTION;
      if (fun && fun()) {
        return true;
      }
    } catch (ex) {
      log.ERROR("Buggy GLOBAL.TAGSDK_MAIN_DISABLED_FUNCTION ?\n " + ex); /*L*/
    }
    
    if (document.location.href.indexOf("opentag_disabled=true") >= 0) {
      return true;
    }
    return false;
  }

  qubit.opentag.Log.setLevel(qubit.opentag.Log.LEVEL_NONE);/*L*/
  qubit.opentag.Log.setCollectLevel(3);/*L*/

  /*debug*/
  qubit.opentag.Log.setLevel(qubit.opentag.Log.LEVEL_INFO);/*L*/
  qubit.opentag.Log.setCollectLevel(4);/*L*/
  /*~debug*/

  qubit.opentag.Log.setLevelFromCookie();

  /**
   * Default runner method for opentag program. It decides on all aspects of 
   * initial load - if the debug mode is used too.
   */
  Main.run = function () {
    var needDebugModeButNotInDebug = false;
    
    if (disabled()) {
      return;
    }
    
    var selfDebug = false;
    /*debug*/
    selfDebug = true;
    qubit.DEBUG_MODE = true;
    /*~debug*/
    var debugToolRequested = requestedDebugTool();
    var debugRequested = debugToolRequested || requestedDebugMode();

    if (!selfDebug && debugRequested) {
      if (!qubit.DEBUG_MODE) {
        // clear existing tagsdk! And only for Log attaching purpose!
        GLOBAL.TAGSDK_NS_OVERRIDE = true;
      } else {
        GLOBAL.TAGSDK_NS_OVERRIDE = false;
      }
      needDebugModeButNotInDebug = true; // STOP, RUNNIG CANCELLED
    }

    if (qubit.DEBUG_MODE) {
      GLOBAL.TAGSDK_NS_OVERRIDE = false;
    }

    try {
      q.html.UVListener.init(); /*UVListener*/
    } catch (uvInitFalure) {
      // ignore the failure
    }

    // triggers entire load
    Main.runAllContainers(needDebugModeButNotInDebug);

    /*debug*/
    if (!needDebugModeButNotInDebug) {
      if (selfDebug && debugToolRequested && !GLOBAL.TAGSDK_DEBUG_TOOL_LOADED) {
        // load tool
        var debugTool = document.createElement("script");
        debugTool.src = 
          "https://s3-eu-west-1.amazonaws.com/" +
          "opentag-dev/debug-tool/loader-v3.js";
        document.getElementsByTagName("head")[0].appendChild(debugTool);
        GLOBAL.TAGSDK_DEBUG_TOOL_LOADED = true;
      }
    }
    /*~debug*/
  };

  function setIfUnset(object, property, value) {
    if (value && (
            object[property] === undefined || 
            object[property] === "" ||
            object[property] === null
      )) {
      object[property] = value;
    }
  }

  /**
   * Function running all containers - if debug option  is chosen, opentag will
   * try to reload itself with debugging logs enabled.
   * @param {Boolean} needDebugModeButNotInDebug 
   *                                    if debug mode scripts must be loaded
   * @returns {undefined}
   */
  Main.runAllContainers = function (needDebugModeButNotInDebug) {
    
    try {
      var containers = qubit.opentag.Container.getContainers();

      for (var i = 0; i < containers.length; i++) {
        var container = containers[i];
        var contCfg = container.config;
        
        if (!container.runningStarted && !container.configuredInMain) {
          contCfg.scanTags = true;
          
          var clientConfig = 
            Utils.getParentObject(container.PACKAGE_NAME).ClientConfig;
    
          if (clientConfig) {
            setIfUnset(container.config, "clientId", clientConfig.id);
          }
          
          var sysDefaults = 
            Utils.getParentObject(container.PACKAGE_NAME).SystemDefaults;
    
          if (sysDefaults) {
            setIfUnset(contCfg, "pingServerUrl",
                    sysDefaults.pingServerUrl);
            setIfUnset(contCfg, "tellLoadTimesProbability",
                    sysDefaults.tellLoadTimesProbability);
          }
          
          container.configuredInMain = true;
          
          if (needDebugModeButNotInDebug) {
            container.destroy(true);
            pruneContainerPackage(container);
            Main.loadDebugVersion(container);
          } else {
            if (!GLOBAL.QUBIT_OPENTAG_STOP_MAIN_EXECUTION) {
              log.INFO("Running container " + container.CLASSPATH);/*L*/
              container.run();
            } else {
              (function () {// new scope
                var runner = qubit.opentag.RUN_STOPPED_EXECUTON;
                qubit.opentag.RUN_STOPPED_EXECUTON = function () {
                  try {
                    if (runner) {
                      runner();
                    }
                  } finally {
                    container.run();
                  }
                };
              }(container));
            }
          } 
        }
      }
    } catch (ex) {
      // silent & reports
    }
  };

  // function prunes container and everything in it.
  function pruneContainerPackage(container) {
    var name = container.PACKAGE_NAME.split(".");
    name = name[name.length - 1];
    
    var pkg = Utils.getParentObject(container.PACKAGE_NAME);
    pkg[name] = null;
    
    delete pkg[name];
  }

  function getClientId(container) {
    var parent = Utils.getParentObject(container.PACKAGE_NAME);
    var cfg = parent.ClientConfig;
    if (cfg && cfg.clientId) {
      return cfg.clientId;
    } else {
      var parts = container.PACKAGE_NAME.split(".");
      return parts[parts.length - 2].substring(1);
    }
  }

  Main.loadDebugVersion = function (container) {
    var debugScript = document.createElement("script");
    var url;
    
    var scriptURL = container.config.scriptURL;
    var clientId = getClientId(container);
    var containerId = container.getContainerId();
    
    if (scriptURL) {
      url = scriptURL;
      var dLen = "-debug.js".length;
      if (url.lastIndexOf("-debug.js") !== url.length - dLen) {
        url = url.substring(0, url.length - ".js".length);
        url += "-debug.js";
      }
    }

    var urlCDN = "//d3c3cq33003psk.cloudfront.net/opentag-" +
      clientId + "-" + containerId + "-debug.js";

    if (url && urlCDN !== url) {
      debugScript.src = url;
    } else {
      debugScript.src = "//s3-eu-west-1.amazonaws.com/opentag/opentag-" +
        clientId + "-" + containerId + "-debug.js";
    }

    document.getElementsByTagName("head")[0].appendChild(debugScript);
  };

  qubit.Define.namespace("qubit.opentag.Main", Main);
}());
