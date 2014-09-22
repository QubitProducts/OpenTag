//:include qubit/opentag/GLOBAL.js
//:include qubit/opentag/Log.js
//:include qubit/Cookie.js
//:include qubit/opentag/compat/OldTagRunner.js
//:include html/UVListener.js

/** EXCLUDE FROM NEW API **/

qubit.opentag.Log.LEVEL = 0;
qubit.opentag.Log.COLLECT_LEVEL = 3;

var log = new qubit.opentag.Log("Main -> ");

(function () {
  qubit.opentag.Log.LEVEL = qubit.opentag.Log.LEVEL_NONE;
  qubit.opentag.Log.COLLECT_LEVEL = 3;
  
  /*debug*/
  qubit.opentag.Log.LEVEL = qubit.opentag.Log.LEVEL_INFO;
  qubit.opentag.Log.COLLECT_LEVEL = 5;
  /*~debug*/
  
  var filters = [],
    pageVars = {},
    scriptLoaders = {},
    delayDocWrite = false,
    qTagClientId = "",
    containerName = "Opentag",
    profileName = "",
    tellLoadTimesProbability = 0,
    maxCookieLength = 3000,
    pingServerUrl = null,
    qtag_track_session = false,
    qtag_domain = "",
    scriptURL = null;

  /*INSERT_DATA*/

  /*NEVER INCLUDE*/
  //this content is available ONLY in direct main-src page.
  filters = window.filters || filters;
  pageVars = window.pageVars || pageVars;
  scriptLoaders = window.scriptLoaders || scriptLoaders;
  delayDocWrite = false || window.delayDocWrite,
  qTagClientId = window.qTagClientId || qTagClientId,
  containerName = window.containerName || containerName,
  profileName = window.profileName || "",
  tellLoadTimesProbability = window.tellLoadTimesProbability || 
          tellLoadTimesProbability,
  maxCookieLength = window.maxCookieLength || maxCookieLength,
  pingServerUrl = window.pingServerUrl || pingServerUrl,
  qtag_track_session = false || qtag_track_session,
  qtag_domain = window.qtag_domain || qtag_domain,
  scriptURL = window.scriptURL || scriptURL;
  /*~NEVER INCLUDE*/
  
  //defaults
  var mainConfig = {};
  
  // real part
  try {
    mainConfig.filters = filters;
  } catch (e) {}
  try {
    mainConfig.pageVars = pageVars;
  } catch (e) {}
  try {
    mainConfig.scriptLoaders = scriptLoaders;
  } catch (e) {}
  try {
    mainConfig.delayDocWrite = delayDocWrite;
  } catch (e) {}
  try {
    mainConfig.qTagClientId = qTagClientId;
  } catch (e) {}
  try {
    mainConfig.containerName = containerName;
  } catch (e) {}
  try {
    mainConfig.profileName = profileName;
  } catch (e) {}
  try {
    mainConfig.tellLoadTimesProbability = tellLoadTimesProbability;
  } catch (e) {}
  try {
    mainConfig.maxCookieLength = maxCookieLength;
  } catch (e) {}
  try {
    mainConfig.pingServerUrl = pingServerUrl;
  } catch (e) {}
  try {
    mainConfig.qtag_track_session = qtag_track_session;
  } catch (e) {}
  try {
    mainConfig.qtag_domain = qtag_domain;
  } catch (e) {}
  try {
    mainConfig.scriptURL = scriptURL;
  } catch (e) {}

  /*session*/
  mainConfig.qtag_track_session = true;
  /*~session*/
  
  var Cookie = qubit.Cookie;
  
  // @TODO delegate to Alex to update his resources.
  // Introduction will be necessary
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
    if (document.location.href.indexOf("opentag_disabled=true") >= 0) {
      return true;
    }
    return false;
  }

  var started = false;
  function old(mainConfig) {
    if (disabled()) {
      return;
    }
    /**exclude at tests**/
    if (started) {
      return;
    }
    started = true;
    
    var selfDebug = false;
    
    /*debug*/
    selfDebug = true;
    /*~debug*/
    
    var debugToolRequested = requestedDebugTool();
    var debugRequested = debugToolRequested || requestedDebugMode();
    
    if (!selfDebug && debugRequested) {
      //redirect and exit
      var debugScript = document.createElement("script");
      var url;
      
      if (mainConfig.scriptURL) {
        url = mainConfig.scriptURL;
        var dLen = "-debug.js".length;
        if (url.lastIndexOf("-debug.js") !== url.length - dLen) {
          url = url.substring(0, url.length - ".js".length);
          url += "-debug.js";
        }
      }
      
      var urlCDN = "//d3c3cq33003psk.cloudfront.net/opentag-" +
              mainConfig.qTagClientId + "-" +
              mainConfig.profileName + "-debug.js";
      
      if (url && urlCDN !== url) {
        debugScript.src = url;
      } else {
        debugScript.src = "//s3-eu-west-1.amazonaws.com/opentag/opentag-" +
        mainConfig.qTagClientId + "-" + mainConfig.profileName + "-debug.js";
      }
      if (!window.QUBIT_DEBUG_TOOL_LOADED) {
        window.QUBIT_DEBUG_TOOL_LOADED = true;
        window.TAGSDK_NS_OVERRIDE = true;
        document.getElementsByTagName("head")[0].appendChild(debugScript);
      }
      //stop
      return;
    }

    new qubit.opentag.OldTagRunner(mainConfig).run();
    
    /*debug*/
    if (selfDebug && debugToolRequested) {
      //load tool
      var debugTool = document.createElement("script");
      debugTool.src = "https://s3-eu-west-1.amazonaws.com" +
              "/opentag-dev/debug-tool/loader.js";
      document.getElementsByTagName("head")[0].appendChild(debugTool);
    }
    /*~debug*/
    
    /**~exclude at tests**/
  }
  
  q.html.UVListener.init(); /*UVListener*/
  //triggers entire load
  old(mainConfig);
})();