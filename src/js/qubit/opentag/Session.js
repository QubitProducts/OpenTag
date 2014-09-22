/*EXCLUDE: SESSION*/
//:include cookie/SimpleSessionCounter.js
//:include html/Json2.js
//:include qubit/opentag/Utils.js
//:include qubit/opentag/compression/CookieCompressor.js
//:include qubit/opentag/Log.js
//:include qubit/Cookie.js

(function () {

  var Cookie = qubit.Cookie;
  var Utils = qubit.opentag.Utils;
    
  var log = new qubit.opentag.Log("Session -> ");
  
  /**
   * #Session utilities class.
   * 
   * Session object is a simple class for managing session for opentag.

   * @class qubit.opentag.Session
   * @singleton
   */
  var Session = function () {};
  
  Utils.clazz("qubit.opentag.Session", Session);

  var compressor = new qubit.opentag.compression.CookieCompressor({});

  /**
   * Utility function to read compressed cookie.
   * 
   * @param {String} name cookie name
   * @returns {String} decompressed cookie
   */
  Session.readCompressedCookie = function (name) {
    var cookie = Cookie.get(name);
    return compressor.decompress(cookie);
  };
  
  /**
   * Function used to setup the session object.
   * 
   * @param {Object} config session configuration object
   * @returns {Object} session object.
   */
  Session.setupSession = function (config) {
    var session, i, cookie, cookieText, cookieName, now;
    session = {};
    session.sessionCount = q.cookie.SimpleSessionCounter
            .update(config.cookieDomain);
    
    cookieName = "qtag_" + config.containerId;
    var xCookieName = "x_qtag_" + config.containerId;
    
    // compat for non compressed cookie, historical compability, remove this
    // code after 15th of Sep 2015
    cookie = Cookie.get(cookieName, true);
    var nonCompressedCookie = !!cookie;
    
    if (cookie === null) {
      cookie = Cookie.get(xCookieName);
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
    
    //At this point session.sessionCount is from SimpleSessionCounter
    //cookie.sc is the last simpleSessionCounter result we have
    //we do this to see if there is a change in it
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
      //If the referrer is different, then update it.
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
    //Always set the saved session count to be the used sessionCount
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

    while ((compressor.compress(cookieText).length > config.maxCookieLength)
            && (i < 5)) {
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
      //remove old cookie if exists
      Cookie.rm(cookieName);
    }
    
    var xCookieText = compressor.compress(cookieText);
    Cookie.rm(xCookieName);
    Cookie.set(xCookieName, xCookieText, 365, config.cookieDomain);

    session.setVariable = function (key, value, time) {
      var t = (!!time) ? time : 0;
      cookie.__v[key] = [value, t];
      var xCookieText = compressor.compress(JSON.stringify(cookie));
      Cookie.set(xCookieName, xCookieText, 365, config.cookieDomain);
    };
    
    session.getCookie = function (name, compressed) {
      var res = Cookie.get(name); //get encoded
      if (res && (compressed || name.indexOf("x_") === 0)) {
        log.FINE("getCookie() : Comressed cookie accessed:\n" +
                name + "=" + res);//L
        try {
          res = compressor.decompress(res);
        } catch (ex) {
          log.ERROR("Cookie failed to decompress: " + ex);
        }
      } else {
        //apply decoding
        res = Cookie.decode(res);
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
    //If it can't find a protocol, something weird is going on. 
    //Return it and track it on the server.
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
