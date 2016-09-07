/*EXCLUDE: SESSION*/
//:import cookie.SimpleSessionCounter
//:import html.Json2
//:import qubit.Define
//:import qubit.opentag.Utils
//:import qubit.opentag.compression.CookieCompressor
//:import qubit.opentag.Log
//:import qubit.Cookie

(function () {

  var Cookie = qubit.Cookie;
  var Utils = qubit.opentag.Utils;
    
  var log = new qubit.opentag.Log("Session -> ");/*L*/
  
  /**
   * #Session utilities class.
   * 
   * Session object is a simple class for managing session for opentag.

   * @class qubit.opentag.Session
   * @singleton
   */
  var Session = function () {};
  
  qubit.Define.clazz("qubit.opentag.Session", Session);

  var compressor = new qubit.opentag.compression.CookieCompressor({});

  /**
   * Utility function to read compressed cookie.
   * 
   * @param {String} name cookie name
   * @returns {String} decompressed cookie
   */
  Session.readCompressedCookie = function (name) {
    var cookie = Cookie.get(name, true);
    return compressor.decompress(cookie);
  };
  
  /**
   * Function used to setup the session object.
   * 
   * @param {Object} config session configuration object
   * @returns {Object} session object.
   */
  Session.setupSession = function (container) {
    var config = container.config;
    var session, i, cookie, cookieText, cookieName, now;
    session = {};
    session.sessionCount = q.cookie.SimpleSessionCounter
            .update(config.cookieDomain);
    
    cookieName = "qtag_" + container.getContainerId();
    var xCookieName = "x_qtag_" + container.getContainerId();
    
    // compat for non compressed cookie, historical compability, remove this
    // code after 15th of Sep 2015
    cookie = Cookie.get(cookieName);
    var nonCompressedCookie = !!cookie;
    
    if (cookie === null) {
      // try compressed new cookie in use
      cookie = Cookie.get(xCookieName, true);
      cookie = compressor.decompress(cookie);
    }

    if (cookie) {
      try {
        cookie = JSON.parse(cookie);
      } catch (e) {
        cookie = {
          sc: 0,
          sessionCount: 0,
          pageViews: 0,
          sessionStartTime: 0,
          referrer: [],
          sessionLandingPage: "",
          __v: {}
        };
      }
    } else {
      cookie = {
        sc: 0,
        sessionCount: 0,
        pageViews: 0,
        sessionStartTime: 0,
        referrer: [],
        sessionLandingPage: "",
        __v: {}
      };
    }
    
    now = new Date().getTime();
    
    // At this point session.sessionCount is from SimpleSessionCounter
    // cookie.sc is the last simpleSessionCounter result we have
    // we do this to see if there is a change in it
    if (session.sessionCount !== parseInt(cookie.sc, 10)) {
      cookie.sessionStartTime = now;
      cookie.sc = session.sessionCount;
      cookie.sessionCount += 1;
      cookie.referrer.push({
        url: Session.getReferrer(),
        landing: Utils.getUrl().substring(0, 300),
        time: now
      });
      cookie.sessionLandingPage = Utils.getUrl().substring(0, 300);
    } else if (Session.isReferrerDifferent()) {
      // If the referrer is different, then update it.
      if (!Session
              .referrerIsSameAsPrevious(cookie.referrer, now, 30 * 60 * 1000)) {
        cookie.referrer.push({
          url: Session.getReferrer(),
          landing: Utils.getUrl().substring(0, 300),
          time: now
        });
        cookie.sessionLandingPage = Utils.getUrl().substring(0, 300);
        cookie.sessionStartTime = now;
        cookie.sessionCount += 1;
      }
    }
    // Always set the saved session count to be the used sessionCount
    session.sessionCount = cookie.sessionCount;
    session.sessionStartTime = cookie.sessionStartTime;
    session.pageStartTime = now;
    cookie.pageViews += 1;
    session.pageViews = cookie.pageViews;
    session.sessionLandingPage = cookie.sessionLandingPage;

    session.referrer = cookie.referrer;
    if (session.referrer.length > 5) {
      session.referrer.splice(2, session.referrer.length - 5);
    }

    cookieText = JSON.stringify(cookie);

    i = 0;

    while ((compressor.compress(cookieText).length > config.maxCookieLength) &&
            (i < 5)) {
      if (cookie.referrer.length >= 3) {
        cookie.referrer.splice(2, 1);
      } else if (cookie.referrer.length === 2) {
        cookie.referrer = [cookie.referrer[0]];
      } else if (cookie.referrer.length === 1) {
        cookie.referrer = [];
      }
      cookieText = JSON.stringify(cookie);
      i += 1;
    }

    session.referrer = cookie.referrer;
    
    if (nonCompressedCookie) {
      // remove old cookie if exists
      Cookie.rm(cookieName);
    }
    
    var xCookieText = compressor.compress(cookieText);
    Cookie.rm(xCookieName);
    if (config.maxCookieLength > 0) {
      Cookie.set(xCookieName, xCookieText, 365, config.cookieDomain, true);
    }

    session.setVariable = function (key, value, time) {
      var t = (!!time) ? time : 0;
      cookie.__v[key] = [value, t];
      var xCookieText = compressor.compress(JSON.stringify(cookie));
      if (config.maxCookieLength > 0) {
        Cookie.set(xCookieName, xCookieText, 365, config.cookieDomain, true);
      } else {
        Cookie.rm(xCookieName);
      }
    };
    
    session.getCookie = function (name, compressed) {
      var res = Cookie.get(name, true); // get encoded
      if (res && (compressed || name.indexOf("x_") === 0)) {
        log.FINE("getCookie() : Comressed cookie accessed:\n" +/*L*/
                name + "=" + res);/*L*/
        try {
          res = compressor.decompress(res);
        } catch (ex) {
          log.ERROR("Cookie failed to decompress: " + ex);/*L*/
        }
      } else {
        // apply decoding
        if (res !== null) {
          res = Cookie.decode(res);
        }
      }
      return res;
    };
    
    session.getVariable = function (key) {
      var v, t, now;
      v = cookie.__v[key];
      if (v) {
        t = v[1];
        if ((t === 0) || (t > new Date().getTime())) {
          return v[0];
        }
      }
      return null;
    };
    
    session.on = function (event, el, fn) {
      if (el.attachEvent) {
        el.attachEvent("on" + event, fn);
      } else if (el.addEventListener) {
        el.addEventListener(event, fn, false);
      }
    };
    
    session.getTagCookie = function () {
      return Session.readCompressedCookie(xCookieName);
    };
    
    Session.lastSession = session;
    
    return session;
  };
  
  /**
   * Function check current refferer is same as last one.
   * 
   * @param {Array} referrers
   * @param {Date} now
   * @param {Number} overlapDuration
   * @returns {Boolean}
   */
  Session.referrerIsSameAsPrevious = function (referrers, now, overlapDuration) {
    var url, landing, lastReferrer;
    if (referrers.length > 0) {
      url = Session.getReferrer();
      landing = Utils.getUrl().substring(0, 300);
      lastReferrer = referrers[referrers.length - 1];

      return (lastReferrer.url === url) && 
        (lastReferrer.landing === landing) && 
        ((lastReferrer.time + overlapDuration) > now);
    }
    return false;
  };
  
  /**
   * Checks if page referrer is different from this domain.
   * 
   * @returns {Boolean}
   */
  Session.isReferrerDifferent = function () {
    var start, end, ref;
    ref = Session.getReferrer();
    start = ref.indexOf("://");
    // If it can't find a protocol, something weird is going on. 
    // Return it and track it on the server.
    if (start === -1) {
      return true;
    }
    start += 3;
    try {
      if (ref.substring(start).indexOf(Session.getDomain()) !== 0) {
        return true;
      }
      return false;
    } catch (ex) {
      return true;
    }
  };

  /**
   * Gets referrer for page.
   * @returns {String}
   */
  Session.getReferrer = function () {
    if (document.referrer) {
      return document.referrer.substring(0, 300);
    }
    return "direct";
  };

/**
 * Gets host domain.
 * @returns {String}
 */
  Session.getDomain = function () {
    return document.location.host;
  };

}());
