/*EXCLUDE: NO-SEND*/
//:import qubit.Define
//:import cookie.PageView
//:import qubit.opentag.Log
//:import html.PostData

(function () {
  
  var log = new qubit.opentag.Log("Ping -> ");/*L*/
  
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
   * @param {Object} container Container reference
   * @param loadTimes {Array} Array of load time elements [time, BaseTag]
   */
  Ping.prototype.send = function (container, loadTimes) {
    var config = container.config;
    var pingString = 
            "c=" + config.clientId + "&" +
            "p=" + container.getContainerId() + "&" +
            "l=" + config.tellLoadTimesProbability + "&" +
            "pv=" + q.cookie.PageView.update() + "&" +
            "d=";
            
    var pingStrings = [];
    
    for (var i = 0; i < loadTimes.length; i++) {
      var tag = loadTimes[i].tag;
      var loadTime = loadTimes[i].loadTime;
      
      if (loadTime === null || isNaN(loadTime)) {
        // ignore unset load time entries.
        continue;
      }
      
      var loaderId = Ping.getPingID(tag);
      
      if (!tag.pingSent && loaderId && loadTime !== null) {
        if (loaderId !== undefined) {
          pingStrings.push('"' + loaderId + '":' + loadTime);
          tag.pingSent = true;
        } else {
          log.WARN("send: tag `" + tag.config.name +/*L*/
                  "` has no ID assigned! Time load will not be sent.");/*L*/
        }
      } else if (tag.pingSent) {
        log.FINEST("send: ping already sent for `" + tag.config.name +/*L*/
                "`, ignoring.");/*L*/
      } else if (loadTime === null) {
        log.FINEST("send: null load times for `" +/*L*/
                tag.config.name + "`, ignoring (ping not sent).");/*L*/
      }
    }
        
    // sending part
    if (config.pingServerUrl && pingStrings.length > 0) {
      pingString += encodeURIComponent("{" + pingStrings.join(',') + "}");
      var url = "//" + config.pingServerUrl + "/tag2?" + pingString;
      log.FINE("send: sending pings " + url);/*L*/
      q.html.PostData(url, null, "GET");
    } else {
      if (!pingStrings.length) {
        log.FINE("send: no pings to sent");/*L*/
      }
      if (!config.pingServerUrl) {
        log.WARN("send: config.pingServerUrl is unset!");/*L*/
      }
    }
  };
  
  /**
   * Disabled. Function sends error information to servers.
   * @private
   * @param {Object} container
   * @param {Object} errors
   */
  Ping.prototype.sendErrors = function (container, errors) {
    // @TODO add on-demand errors sending so client can easily invoke 
    //"qubut.opentag.Tags.sendAllErrors()
    log.WARN("Errors sending is disabled.");/*L*/
//    var config = container.config;
//    var loaderId, err, msg, errMsgs = [];
//    
//    for (var i = 0; i < errors.length; i++) {
//      var tag = errors[i];
//      err = errors[loaderId];
//      errMsgs.push("{r: '" + err.reason + "',u:'" + err.url + 
//        "',l:'" + err.lineNumber + "'}");
//    }
//    if (errMsgs.length > 0) {
//      log.INFO("about to send errors: " + errMsgs.join(","));/*L*/
//
//      msg = "c=" + config.opentagClientId + "&" + 
//        "p=" + container.getContainerId() + "&" +
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
   * @param {Object} container
   * @param {Object} tags
   */
  Ping.prototype.sendDedupe = function (container, tags) {
    var config = container.config;
    var pingString = "c=" + config.clientId + "&" +
      "p=" + container.getContainerId() + "&" +
      "l=" + (config.tellLoadTimesProbability) + "&" +
      "pv=" + q.cookie.PageView.update() + "&" +
      "dd=";

    var pingStrings = [];

    for (var i = 0; i < tags.length; i++) {
      var tag = tags[i];
      var loaderId = Ping.getPingID(tag);

      if (loaderId === undefined) {
        log.WARN("sendDedupe: tag `" + tag.config.name +/*L*/
                "` has no ID assigned! Deduplicaton time load " +/*L*/
                "will not be sent.");/*L*/
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
        log.FINE("sendDedupe: no dedupe pings to sent");/*L*/
      }
      if (!config.pingServerUrl) {
        log.WARN("sendDedupe: config.pingServerUrl is unset!");/*L*/
      }
    }
  };
  
  Ping.getPingID = function (tag) {
    if (tag.config.id) {
      return tag.config.id;
    }
    
    var idx = tag.PACKAGE_NAME.lastIndexOf(".");
    if (idx !== -1) {
      return tag.PACKAGE_NAME.substring(idx + 1);
    } else {
      return tag.PACKAGE_NAME;
    }
  };
  
  /*~session*/
}());
