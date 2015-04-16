//:include qubit/Define.js

/*NO CONSENT COOKIE*/

/*
 * TagSDK, a tag development platform
 * Copyright 2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {

  //var log = new qubit.opentag.Log("ConsentCookie: ");

  /**
   * @private
   * @TODO Temporarily unused - consent tag in old config must be refactored 
   * to be ready for new implementation.
   * 
   * #ConsentCookie class
   * It is responsible for rendering and processing any cookie consent on
   * a page.
   * 
   * @param config {Object} config object used to build instance
   * @class qubit.opentag.consent.ConsentCookie
   */
  function ConsentCookie(config) {
    this.config = {
      /**
       * @cfg {ConsentCookie.MODES} [mode=ConsentCookie.MODES.notification]
       * Cookie consent mode.
       */
      mode: ConsentCookie.MODES.notification,
      /**
       * @cfg {Number} [askAgain=2 * 60 * 1000]
       * Ask again time setting.
       */
      askAgain: 2 * 60 * 1000,
      /**
       * @cfg {Number} [sampleRate=100]
       * Sample rate percentage.
       */
      sampleRate: 100,
      /**
       * @cfg {String} 
       * [cookieAndPrivacyPolicyText="privacy and cookies policy"]
       * Cookie and privacy polict text.
       */
      cookieAndPrivacyPolicyText: "privacy and cookies policy",
      /**
       * @cfg {String} 
       * [cookieAndPrivacyPolicyLink="http://www.yoursite.com/privacy"]
       * Cookieand privacy policy link.
       */
      cookieAndPrivacyPolicyLink: "http://www.yoursite.com/privacy",
      /**
       * @cfg {Boolean} 
       * [hideStatusOnConsentGiven=true]
       * Should it hide status on consent given.
       */
      hideStatusOnConsentGiven: true
    };

    if (config) {
      for (var prop in config) {
        if (config.hasOwnProperty(prop)) {
          this.config[prop] = config[prop];
        }
      }
    }
  }

  qubit.Define.clazz("qubit.opentag.consent.ConsentCookie", ConsentCookie);

  /**
   * Modes.
   * @class qubit.opentag.consent.ConsentCookie.MODES
   * @static
   * @singleton
   * Code:
   
      ConsentCookie.MODES = {
        notification: "Notification Only",
        implicit: "Implicit consent",
        explicit: "Explicit Consent"
      }
   */
  ConsentCookie.MODES = {
    notification: "Notification Only",
    implicit: "Implicit consent",
    explicit: "Explicit Consent"
  };

  /**
   * Notification widget HTML & CSS fragments
   * @class qubit.opentag.consent.ConsentCookie.NOTIFICATION_WIDGET
   * @static
   * @singleton
   */
  ConsentCookie.NOTIFICATION_WIDGET = {
    /**
     * @property {String} HTML
     */
    HTML:
      "<div class=\"content\">\n" +
      "  <h1>Privacy and Cookies</h1>\n" +
      "  <p>\n" +
      "    For this website to run at its best, we ask the browser\n" +
      "    (like Google Chrome and Internet Explorer) for a little \n" +
      "    personal information. Nothing drastic, just enough to \n" +
      "    remember your preferences, login ID, and what you like to \n" +
      "    look at (on our site). Having this information to hand  \n" +
      "    helps us understand your needs and improve our\n" +
      "    service to you. \n" +
      "  </p>\n" +
      "  <p>\n" +
      "  If you would like to learn more about the information we \n" +
      "  store, how it is used or how to disable Cookies please read our\n" +
      "    <a href=\"{{cookieAndprivacyPolicyUrl}}\" \n" +
      "      target = \"_blank\"\n" +
      "      id=\"{{cookieAndPrivacyAndPolicyId}}\">\n" +
      "      {{cookieAndprivacyPolicyText}}\n" +
      "    </a>.\n" +
      "  </p>\n" +
      "</div>",
    /**
     * @property {String} IFRAME_CSS
     */
    IFRAME_CSS:
      "top: 0;\n" +
      "left: 0;\n" +
      "height: 185px;\n" +
      "width: 100%;\n" +
      "box-shadow: 0 0 20px 0px #888;\n" +
      "z-index: 2147483647;",
    /**
     * @property {String} CONTENT_CSS
     */
    CONTENT_CSS:
      "body {\n" +
      "  padding-top: 8px;\n" +
      "  text-align: center;\n" +
      "  background: url(https://d3c3cq33003psk.cloudfront.net/consent/img/cbg_w.png) repeat;\n" +
      "  font-size: 12px;\n" +
      "  line-height: 17px;\n" +
      "  font-family: arial, helvetica;\n" +
      "  color: #555;\n" +
      "  text-shadow: 0px 0px 1px #CCC;\n" +
      "}\n" +
      ".content {\n" +
      "  text-align: left;\n" +
      "  width: 800px;\n" +
      "  margin: 0 auto;\n" +
      "  padding-top: 5px;\n" +
      "}\n" +
      "body p {\n" +
      "  margin: 5px 0px;\n" +
      "}\n" +
      "a {\n" +
      "  color: #2e9dc5;\n" +
      "}\n" +
      "h1 {\n" +
      "  font-size: 1.4em;\n" +
      "}\n" +
      ".action-footer {\n" +
      "  margin-top: 0px;\n" +
      "}\n" +
      ".action-footer .button {\n" +
      "  padding: 5px 8px;\n" +
      "  line-height: 16px;\n" +
      "  cursor: pointer;\n" +
      "}\n" +
      "#{{closeButtonId}} {\n" +
      "  vertical-align: middle\n" +
      "  color: #939598;\n" +
      "  padding: 5px 10px 5px 10px;\n" +
      "  font-size: 13px;\n" +
      "  text-decoration: none;\n" +
      "  margin-top: 0px;\n" +
      "  float: right;\n" +
      "  cursor: pointer;\n" +
      "  border: 1px solid #EEE;\n" +
      "  background: #EEE;\n" +
      "  border-radius: 5px;\n" +
      "}\n" +
      ".action-footer #{{acceptButtonId}} {\n" +
      "  -moz-box-shadow:inset 0px 1px 0px 0px #bbdaf7;\n" +
      "  -webkit-box-shadow:inset 0px 1px 0px 0px #bbdaf7;\n" +
      "  box-shadow:inset 0px 1px 0px 0px #bbdaf7;\n" +
      "  background:-webkit-gradient( linear, left top, left bottom, color-stop(0.05, #35b7de), color-stop(1, #0189a1) );\n" +
      "  background:-moz-linear-gradient( center top, #35b7de 5%, #0189a1 100% );\n" +
      "  filter:progid:DXImageTransform.Microsoft.gradient(startColorstr=\"#35b7de\", endColorstr=\"#0189a1\");\n" +
      "  background-color:#35b7de;\n" +
      "  -moz-border-radius:4px;\n" +
      "  -webkit-border-radius:4px;\n" +
      "  border-radius:4px;\n" +
      "  border:1px solid #0189a1;\n" +
      "  display:inline-block;\n" +
      "  color:#fff;\n" +
      "  font-weight:normal;\n" +
      "  text-decoration:none;\n" +
      "  vertical-align: middle;\n" +
      "  float:right;\n" +
      "}\n" +
      ".action-footer #{{acceptButtonId}}:hover {\n" +
      "  background:-webkit-gradient( linear, left top, left bottom, color-stop(0.05, #0189a1), color-stop(1, #35b7de) );\n" +
      "  background:-moz-linear-gradient( center top, #0189a1 5%, #35b7de 100% );\n" +
      "  filter:progid:DXImageTransform.Microsoft.gradient(startColorstr=\"#0189a1\", endColorstr=\"#35b7de\");\n" +
      "  background-color:#0189a1;\n" +
      "}\n" +
      ".action-footer #{{acceptButtonId}}:active {\n" +
      "  position:relative;\n" +
      "  top: 1px;\n" +
      "}\n" +
      ".action-footer #{{declineButtonId}} {\n" +
      "  color: #555;\n" +
      "  float:right;\n" +
      "  margin-right: 15px;\n" +
      "}",
    /**
     * @property {String} ACCEPT_BUTTON
     */
    ACCEPT_BUTTON: "Enable Cookies",
    /**
     * @property {String} DECLINE_BUTTON
     */
    DECLINE_BUTTON: "No, Thank You"
  };

  /**
   * Status widget HTML & CSS fragments
   * @class qubit.opentag.consent.ConsentCookie.STATUS_WIDGET
   * @static
   * @singleton
   */
  ConsentCookie.STATUS_WIDGET = {
    /**
     * @property {String} HTML
     */
    HTML:
      "<div class=\"content\">\n" +
      "  <div class=\"icon\"></div>\n" +
      "  <div id=\"{{cookieStatusId}}\"></div>\n" +
      "</div>",
    /**
     * @property {String} IFRAME_CSS
     */
    IFRAME_CSS:
      "bottom: 0;\n" +
      "left: 0;\n" +
      "height: 20px;\n" +
      "width: 100%;\n" +
      "z-index: 2147483647;",
    /**
     * @property {String} CONTENT_CSS
     */
    CONTENT_CSS:
      "body {\n" +
      "  background: transparent;\n" +
      "  margin: 0;\n" +
      "  padding: 0;\n" +
      "  font-family: arial, helvetica;\n" +
      "  text-align: center;\n" +
      "  vertical-align: middle;\n" +
      "  font-size: 12px;\n" +
      "  line-height: 18px;\n" +
      "}\n" +
      ".content {\n" +
      "  width: 800px;\n" +
      "  margin: 0 auto;\n" +
      "  text-align: left;\n" +
      "}\n" +
      "html>body #{{cookieStatusId}} {\n" +
      "  width: auto;\n" +
      "}\n" +
      "#{{cookieStatusId}} {\n" +
      "  padding: 1px 10px 0px 22px;\n" +
      "  width: 11.5em;\n" +
      "  cursor: pointer; !important\n" +
      "}\n" +
      ".icon {\n" +
      "  background-image: url(\"https://d3c3cq33003psk.cloudfront.net/consent/img/background-image.png\");\n" +
      "  width: 20px;\n" +
      "  height: 20px;\n" +
      "  position: absolute;\n" +
      "  background-position: 6px -116px;\n" +
      "  background-repeat: no-repeat;\n" +
      "  z-index: 199999;\n" +
      "}\n" +
      ".declined #{{cookieStatusId}} {\n" +
      "  -webkit-box-shadow:inset 0px 1px 0px 0px #f5978e;\n" +
      "  box-shadow:inset 0px 1px 0px 0px #f5978e;\n" +
      "  background:-webkit-gradient( linear, left top, left bottom, color-stop(0.05, #f24537), color-stop(1, #c62d1f) );\n" +
      "  background:-moz-linear-gradient( center top, #f24537 5%, #c62d1f 100% );\n" +
      "  filter:progid:DXImageTransform.Microsoft.gradient(startColorstr=\"#f24537\", endColorstr=\"#c62d1f\");\n" +
      "  background-color:#f24537;\n" +
      "  -moz-border-radius:5px 5px 0px 0px;\n" +
      "  -webkit-border-radius:5px 5px 0px 0px;\n" +
      "  border-radius:5px 5px 0px 0px;\n" +
      "  border:1px solid #d02718;\n" +
      "  display:inline-block;\n" +
      "  color:#ffffff;\n" +
      "  font-family:arial;\n" +
      "  font-size:12px;\n" +
      "  text-decoration:none;\n" +
      "}\n" +
      ".declined #{{cookieStatusId}}:hover {\n" +
      "  background:-webkit-gradient( linear, left top, left bottom, color-stop(0.05, #c62d1f), color-stop(1, #f24537) );\n" +
      "  background:-moz-linear-gradient( center top, #c62d1f 5%, #f24537 100% );\n" +
      "  filter:progid:DXImageTransform.Microsoft.gradient(startColorstr=\"#c62d1f\", endColorstr=\"#f24537\");\n" +
      "  background-color:#c62d1f;\n" +
      "}\n" +
      ".declined #{{cookieStatusId}}:active {\n" +
      "  position:relative;\n" +
      "  top: 1px;\n" +
      "}\n" +
      ".accepted #{{cookieStatusId}} {\n" +
      "  -moz-box-shadow:inset 0px 1px 0px 0px #6ebf26;\n" +
      "  -webkit-box-shadow:inset 0px 1px 0px 0px #6ebf26;\n" +
      "  box-shadow:inset 0px 1px 0px 0px #6ebf26;\n" +
      "  background:-webkit-gradient( linear, left top, left bottom, color-stop(0.05, #7ca814), color-stop(1, #5e8007) );\n" +
      "  background:-moz-linear-gradient( center top, #7ca814 5%,#5e8007 100% );\n" +
      "  filter:progid:DXImageTransform.Microsoft.gradient(startColorstr=\"#7ca814\", endColorstr=\"#5e8007\");\n" +
      "  background-color:#7ca814;\n" +
      "  -moz-border-radius:5px 5px 0px 0px;\n" +
      "  -webkit-border-radius:5px 5px 0px 0px;\n" +
      "  border-radius:5px 5px 0px 0px;\n" +
      "  border:1px solid #619908;\n" +
      "  display:inline-block;\n" +
      "  color:#ffffff;\n" +
      "  font-family:arial;\n" +
      "  font-size:12px;\n" +
      "  font-weight:normal;\n" +
      "  text-decoration:none;\n" +
      "}\n" +
      ".accepted #{{cookieStatusId}}:hover {\n" +
      "  background:-webkit-gradient( linear, left top, left bottom, color-stop(0.05, #5e8007), color-stop(1, #7ca814) );\n" +
      "  background:-moz-linear-gradient( center top, #5e8007 5%, #7ca814 100% );\n" +
      "  filter:progid:DXImageTransform.Microsoft.gradient(startColorstr=\"#5e8007\", endColorstr=\"#7ca814\");\n" +
      "  background-color:#5e8007;\n" +
      "}\n" +
      ".accepted #{{cookieStatusId}}:active {\n" +
      "  position:relative;\n" +
      "  top: 1px;\n" +
      "}",
    /**
     * @property {String} ACCEPT_BUTTON
     */
    ACCEPT_BUTTON: "Cookies Enabled",
    /**
     * @property {String} DECLINE_BUTTON
     */
    DECLINE_BUTTON: "Cookies Disabled"
  };
})();