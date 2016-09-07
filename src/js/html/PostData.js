/*global XDomainRequest */

//= require <html/html>
//= require <html/FileLoader>

q.html.PostData = function (url, data, type) {

  var _post, agent, isIe, isIe9, isOldIe, fullUrl, loaded, 
    retry, retryDelay, retryCount;

  retryCount = 2;
  retryDelay = 5000;
  loaded = false;

  retry = function () {
    if (retryCount > 0) {
      setTimeout(function () {
        if (!loaded) {
          retryCount -= 1;
          _post();
        }
      }, retryDelay);
    }
  };

  agent = navigator.userAgent.toLowerCase();
  isIe = agent.indexOf("msie") !== -1;
  isIe9 = agent.indexOf("msie 9") !== -1;
  isOldIe = ((agent.indexOf('msie 7') !== -1) ||
    (agent.indexOf('msie 6') !== -1));
  fullUrl = ("https:" === document.location.protocol ? "https:" : "http:") +
    url;
  type = type || "POST";

  _post = function () {
    var xhr;
    try {
      xhr = null;

      try {
        xhr = new XMLHttpRequest();
      } catch (e1) {

      }

      if (xhr && !isIe) {
        xhr.open(type, fullUrl, true);
      } else if (typeof XDomainRequest !== "undefined") {
        xhr = new XDomainRequest();
        xhr.open(type, fullUrl);
      } else {
        xhr = null;
      }

      try {
        xhr.withCredentials = false;
      } catch (e2) {

      }
      if (xhr.setRequestHeader) {
        xhr.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
      }
      xhr.onload = function () {
        loaded = true;
      };
      xhr.onreadystatechange = function () {};
      xhr.ontimeout = function () {};
      xhr.onerror = function () {};
      xhr.onprogress = function () {};

      xhr.send(data);

    } catch (err) {
      try {
        try {
          q.html.fileLoader.load(fullUrl);
        } catch (err2) {
          if (window.console && window.console.log) {
            window.console.log(err);
          }
        }
      } catch (e) {
      }
    }
    retry();
  };
  if (isOldIe) {
    q.html.fileLoader.load(fullUrl);
    return;
  } else {
    _post();
  }
};
