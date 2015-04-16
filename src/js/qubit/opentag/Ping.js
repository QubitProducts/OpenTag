/*EXCLUDE: NO-SEND*/
//:include qubit/Define.js
//:include cookie/PageView.js
//:include qubit/opentag/Log.js
//:include html/PostData.js

(function () {
  
  var log = new qubit.opentag.Log("Ping -> ");
  
  /**
   * #Ping processing class.
   * It requires opentag instance passed to work correctly.
   * 
   * @class qubit.opentag.Ping
   */
  function Ping() {}

  qubit.Define.clazz("qubit.opentag.Ping", Ping);
  
  /**
   * Function sends ping information to the servers.
   * @param {Object} config Container config
   * @param loadTimes {Array} Array of load time elements [time, BaseTag]
   */
  Ping.prototype.send = function (config, loadTimes) { 
    var pingString = 
            "c=" + config.clientId + "&" +
            "p=" + config.containerId + "&" +
            "l=" + config.tellLoadTimesProbability + "&" +
            "pv=" + q.cookie.PageView.update() + "&" +
            "d=";
            
    var pingStrings = [];
    
    for (var i = 0; i < loadTimes.length; i++) {
      var tag = loadTimes[i].tag;
      var loadTime = loadTimes[i].loadTime;
      
      if (loadTime === null || isNaN(loadTime)) {
        //ignore unset load time entries.
        continue;
      }
      
      var loaderId = tag.config.id;
      
      if (!tag.pingSent && loaderId && loadTime !== null) {
        if (loaderId !== undefined) {
          pingStrings.push('"' + loaderId + '":' + loadTime);
          tag.pingSent = true;
        } else {
          log.WARN("send: tag `" + tag.config.name +
                  "` has no ID assigned! Time load will not be sent.");//L
        }
      } else if (tag.pingSent) {
        log.FINEST("send: ping already sent for `" + tag.config.name +
                "`, ignoring.");//L
      } else if (loadTime === null) {
        log.FINEST("send: null load times for `" +
                tag.config.name + "`, ignoring (ping not sent).");//L
      }
    }
        
    //sending part
    if (config.pingServerUrl && pingStrings.length > 0) {
      pingString += encodeURIComponent("{" + pingStrings.join(',') + "}");
      var url = "//" + config.pingServerUrl + "/tag2?" + pingString;
      log.FINE("send: sending pings " + url);
      q.html.PostData(url, null, "GET");
    } else {
      if (!pingStrings.length) {
        log.FINE("send: no pings to sent");
      }
      if (!config.pingServerUrl) {
        log.WARN("send: config.pingServerUrl is unset!");
      }
    }
  };
  
  /**
   * Disabled. Function sends error information to servers.
   * @private
   * @param {Object} config
   */
  Ping.prototype.sendErrors = function (config, errors) {
    // @TODO add on-demand errors sending so client can easily invoke 
    //"qubut.opentag.Tags.sendAllErrors()
    log.WARN("Errors sending is disabled.");
//    var loaderId, err, msg, errMsgs = [];
//    
//    for (var i = 0; i < errors.length; i++) {
//      var tag = errors[i];
//      err = errors[loaderId];
//      errMsgs.push("{r: '" + err.reason + "',u:'" + err.url + 
//        "',l:'" + err.lineNumber + "'}");
//    }
//    if (errMsgs.length > 0) {
//      log.INFO("about to send errors: " + errMsgs.join(","));
//
//      msg = "c=" + config.opentagClientId + "&" + 
//        "p=" + config.containerId + "&" +
//        "pv=" + q.cookie.PageView.update() + "&" +
//        "e=" + ("[" + errMsgs.join(",") + "]");
//      if (config.pingServerUrl) {
//        q.html.PostData("//" + config.pingServerUrl + "/tag_err?" +
//          msg, null, "GET");
//      }
//    }
  };

  /*session*/

  /**
   * Function send deduplicated information ping to servers.
   * @param {Object} config
   * @param {Object} tags
   */
  Ping.prototype.sendDedupe = function (config, tags) {
    var pingString = "c=" + config.clientId + "&" +
      "p=" + config.containerId + "&" +
      "l=" + (config.tellLoadTimesProbability) + "&" +
      "pv=" + q.cookie.PageView.update() + "&" +
      "dd=";

    var pingStrings = [];

    for (var i = 0; i < tags.length; i++) {
      var tag = tags[i];
      var loaderId = tag.config.id;

      if (loaderId === undefined) {
        log.WARN("sendDedupe: tag `" + tag.config.name +
                "` has no ID assigned! Deduplicaton time load " +//L
                "will not be sent.");//L
      } else if (!tag.dedupePingSent) {
        pingStrings.push(loaderId);
        tag.dedupePingSent = true;
      }
    }

    if (pingStrings.length > 0 && config.pingServerUrl) {
      pingString += encodeURIComponent("[" + pingStrings.join(',') + "]");
      q.html.PostData("//" + config.pingServerUrl + 
        "/tag2?" + pingString, null, "GET");
    } else {
      if (!pingStrings.length) {
        log.FINE("sendDedupe: no dedupe pings to sent");
      }
      if (!config.pingServerUrl) {
        log.WARN("sendDedupe: config.pingServerUrl is unset!");
      }
    }
  };
  
  /*~session*/
}());
