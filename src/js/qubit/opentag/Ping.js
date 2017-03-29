/*EXCLUDE: NO-SEND*/
//:import qubit.Define
//:import cookie.PageView
//:import qubit.opentag.Log
//:import html.PostData

(function () {
  
  var log = new qubit.opentag.Log("Ping -> ");/*L*/
  var appJsonCT = "text/plain;charset=UTF-8";
  
  /**
   * #Ping processing class.
   * It requires opentag instance passed to work correctly.
   * 
   * @class qubit.opentag.Ping
   */
  function Ping() {}

  qubit.Define.clazz("qubit.opentag.Ping", Ping);
  
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
  };

  /*session*/
  
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
  
  function prepareContainerMsg(container, config) {
    var msgObject = {};
    
    msgObject.clientId = "" + config.clientId;
    msgObject.containerId = "" + container.getContainerId();
    msgObject.classpath = "" + container.PACKAGE_NAME;
    msgObject.opentagStats = true;
    
    if (container.sentPing) {
      msgObject.containerLoad = false;
    } else {
      container.sentPing = new Date().valueOf();
      msgObject.containerLoad = true;
    }
    
    msgObject.isS3 = false;
//    msgObject.tellLoadTimesProbability = "" + config.tellLoadTimesProbability;
    msgObject.pageViewId = q.cookie.PageView.update();
    
    msgObject.tags = [];
    
    return msgObject;
  }

  /**
   * Function sends ping information to the servers.
   * @param {Object} container Container reference
   * @param loadTimes {Array} Array of load time elements [time, BaseTag]
   */
  Ping.prototype.send = function (container, loadTimes) {
    var config = container.config;
    var msgObject = prepareContainerMsg(container, config);
    var tagLogs = msgObject.tags;
    var pingURL = config.pingServerUrl;
    
    for (var i = 0; i < loadTimes.length; i++) {
      var tag = loadTimes[i].tag;
      var loadTime = loadTimes[i].loadTime;
      
      if (loadTime === null || isNaN(loadTime)) {
        // ignore unset load time entries.
        continue;
      }
      
      var tagMsg = {};
      var tagID = Ping.getPingID(tag);
      
      if (!tag.pingSent && tagID && loadTime !== null) {
        if (tagID !== undefined) {
          tagMsg.tagId = tagID;
          tagMsg.loadTime = loadTime;
          tagMsg.fired = true;
          tagLogs.push(tagMsg);
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
    if (pingURL && (tagLogs.length > 0 || msgObject.containerLoad)) {
      var pingString = JSON.stringify(msgObject);
      var url = "//" + pingURL;
      log.FINE("send: sending pings " + url);/*L*/
      q.html.PostData(url, pingString, "POST", appJsonCT);
    } else {
      if (!tagLogs.length) {
        log.FINE("send: no pings to sent");/*L*/
      }
      if (!pingURL) {
        log.WARN("send: pingURL is unset!");/*L*/
      }
    }
  };
  
  /**
   * Function send deduplicated information ping to servers.
   * @param {Object} container
   * @param {Object} tags
   */
  Ping.prototype.sendDedupe = function (container, tags) {
    var config = container.config;
    var msgObject = prepareContainerMsg(container, config);
    var pingURL = config.pingServerUrl;
    var tagLogs = msgObject.tags;

    for (var i = 0; i < tags.length; i++) {
      var tag = tags[i];
      var tagId = Ping.getPingID(tag);
      var tagMsg = {};

      if (tagId === undefined) {
        log.WARN("sendDedupe: tag `" + tag.config.name +/*L*/
                "` has no ID assigned! Deduplicaton time load " +/*L*/
                "will not be sent.");/*L*/
      } else if (!tag.dedupePingSent) {
        tagMsg.tagId = "" + tagId;
        tagMsg.fired = false;
        tagMsg.loadTime = 0;
        tagLogs.push(tagMsg);
        tag.dedupePingSent = true;
      }
    }
    
    if (pingURL && (tagLogs.length > 0 || msgObject.containerLoad)) {
      var pingString = JSON.stringify(msgObject);
      var url = "//" + pingURL;
      log.FINE("send: sending pings " + url);/*L*/
      q.html.PostData(url, pingString, "POST", appJsonCT);
    } else {
      if (!tagLogs.length) {
        log.FINE("sendDedupe: no dedupe pings to sent");/*L*/
      }
      if (!pingURL) {
        log.WARN("sendDedupe: pingURL is unset!");/*L*/
      }
    }
  };
  
  /*~session*/
}());
