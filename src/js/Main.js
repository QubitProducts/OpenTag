//:include GLOBAL.js
//:include qubit/opentag/Log.js
//:include qubit/Cookie.js
//:include qubit/opentag/compat/OldTagRunner.js
//:include html/UVListener.js
//:include qubit/Define.js

/** EXCLUDE FROM NEW API **/

qubit.opentag.Log.setLevel(0);
qubit.opentag.Log.setCollectLevel(3);

var log = new qubit.opentag.Log("Main -> ");

(function () {
  qubit.opentag.Log.setLevel(qubit.opentag.Log.LEVEL_NONE);
  qubit.opentag.Log.setCollectLevel(3);
  
  /*debug*/
  qubit.opentag.Log.setLevel(qubit.opentag.Log.LEVEL_INFO);
  qubit.opentag.Log.setCollectLevel(4);
  /*~debug*/
  
  var filters = [],
    pageVars = {},
    scriptLoaders = {},
    delayDocWrite = false,
    qTagClientId = "",
    containerName = "Opentag",
    profileName = "",
    tellLoadTimesProbability = 0,
    containerDisabled = false,
    maxCookieLength = 1000,
    pingServerUrl = null,
    qtag_track_session = false,
    qtag_domain = "",
    scriptURL = null;

  /*INSERT_DATA*/

  /*NEVER INCLUDE*/
  //this content is available ONLY in direct main-src page.
  filters = GLOBAL.filters || filters;
  pageVars = GLOBAL.pageVars || pageVars;
  scriptLoaders = GLOBAL.scriptLoaders || scriptLoaders;
  delayDocWrite = false || GLOBAL.delayDocWrite,
  qTagClientId = GLOBAL.qTagClientId || qTagClientId,
  containerName = GLOBAL.containerName || containerName,
  profileName = GLOBAL.profileName || "",
  tellLoadTimesProbability = GLOBAL.tellLoadTimesProbability || 
          tellLoadTimesProbability,
  containerDisabled = GLOBAL.containerDisabled || containerDisabled,
  maxCookieLength = GLOBAL.maxCookieLength || maxCookieLength,
  pingServerUrl = GLOBAL.pingServerUrl || pingServerUrl,
  qtag_track_session = false || qtag_track_session,
  qtag_domain = GLOBAL.qtag_domain || qtag_domain,
  scriptURL = GLOBAL.scriptURL || scriptURL;
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
    mainConfig.containerDisabled = containerDisabled;
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
    var otRef = qubit.opentag;
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
      
      if (!otRef.Log) {
        //clear existing tagsdk! And only for Log attaching purpose!
        GLOBAL.TAGSDK_NS_OVERRIDE = true;
      } else {
        GLOBAL.TAGSDK_NS_OVERRIDE = false;
      }
      
      document.getElementsByTagName("head")[0].appendChild(debugScript);
      //stop
      return;
    }

    if (otRef.Log) {
      GLOBAL.TAGSDK_NS_OVERRIDE = false;
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
