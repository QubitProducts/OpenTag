//:include GLOBAL.js
//:include qubit/opentag/Log.js
//:include qubit/opentag/Container.js
//:include qubit/opentag/Utils.js
//:include qubit/opentag/LibraryTag.js
//:include qubit/opentag/CustomTag.js
//:include qubit/opentag/filter/URLFilter.js
//:include qubit/opentag/filter/SessionVariableFilter.js
//:include qubit/opentag/pagevariable/BaseVariable.js
//:include qubit/opentag/pagevariable/URLQuery.js
//:include qubit/opentag/pagevariable/Cookie.js
//:include qubit/opentag/pagevariable/DOMText.js
//:include qubit/opentag/pagevariable/Expression.js

/*
 * TagSDK, a tag development platform
 * Copyright 2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function() {
  var Utils = qubit.opentag.Utils;
  var PatternType = qubit.opentag.filter.pattern.PatternType;
  var URLFilter = qubit.opentag.filter.URLFilter;
  var SessionVariableFilter = qubit.opentag.filter.SessionVariableFilter;
  var LibraryTag = qubit.opentag.LibraryTag;
  var CustomTag = qubit.opentag.CustomTag;
  var DOMText = qubit.opentag.pagevariable.DOMText;
  var BaseVariable = qubit.opentag.pagevariable.BaseVariable;
  var URLQuery = qubit.opentag.pagevariable.URLQuery;
  var Cookie = qubit.opentag.pagevariable.Cookie;
  var Expression = qubit.opentag.pagevariable.Expression;
  
  var log = new qubit.opentag.Log("OldTagRunner -> ");
  
  /**
   * @private
   * #Old tag configuratrion runner class.
   * 
   * This class is a translation layer between old qtag configuration and 
   * new TagSDK configuration scheme. 
   * This class is used by the compatibility layer in Opentag only.
   * Please refer to the guide pages on how to run tags and use libraries.
   * @class qubit.opentag.compat.OldTagRunner
   * @param config {Object} config object used to build instance
   */
  function OldTagRunner(config) {
    log.INFO("init, config passed:");
    log.INFO(config, true);
    this.config = {
      filters: [],
      profileName: "",
      qTagClientId: "",
      pageVars: {},
      scriptLoaders: {},
      tellLoadTimesProbability: 0,
      pingServerUrl: "",
      qtag_domain: "",
      delayDocWrite: false,
      maxCookieLength: 3000,
      containerName: ""
    };

    /*session*/
    this.config.qtag_track_session = true;
    /*~session*/

    for (var prop in config) {
      if (config.hasOwnProperty(prop)) {
        this.config[prop] = config[prop];
      }
    }
  }
  
  Utils.clazz("qubit.opentag.OldTagRunner", OldTagRunner);
  
  /**
   * Old configuration runner function.
   * This is entry method to parse and create container with all tags definitions. 
   */
  OldTagRunner.prototype.run = function() {
    if (!this._run) {
      this._run = new Date().valueOf();
      log.FINE("entering run");
      this.container = new qubit.opentag.Container({
        cookieDomain: this.config.qtag_domain,
        maxCookieLength: this.config.maxCookieLength,
        delayDocWrite: this.config.delayDocWrite,
        gzip: true,
        clientId: this.config.qTagClientId,
        containerId: this.config.profileName,
        name: this.config.containerName,
        tellLoadTimesProbability: this.config.tellLoadTimesProbability,
        pingServerUrl: this.config.pingServerUrl,
        trackSession: this.config.qtag_track_session
      });
      var tags = this.getTags();
      this.container.registerTags(tags);
      this.container.run();
    }
  };

  /**
   * Function parses configuration and returns new tag instances array.
   * @returns {Array} array of qubit.opentag.BaseTag
   */
  OldTagRunner.prototype.getTags = function () {
    var filters = this.config.filters;
    var tagDefinitions = this.config.scriptLoaders;
    var pageVars = this.config.pageVars;

    var tags = [];

    for (var prop in tagDefinitions) {
      if (tagDefinitions.hasOwnProperty(prop)) {
        var loader = tagDefinitions[prop];
        //property is at same time tag's ID used elsewhere
        
        //collect filters for tag
        var filterDefinitions = findFilters(filters, prop);
        //collect parameters
        var parameterDefinitions = findParameters(loader, pageVars);
        
        //@TODO must decide here! if custom!
        // create instance
        
        var location = "";
        if (loader.locationId === 1) {
          location = "HEAD";
        } else if (loader.locationId === 2) {
          location = "BODY";
        } else if (loader.locationId === 3) {
          location = loader.locationDetail;
        }
        
        var dedupe = loader.dedupe;
        
        var cfg = {
          name: loader.name,
          filters: filterDefinitions,
          parameters: parameterDefinitions,
          id: loader.id,
          locked: !!loader.locked,
          url: loader.url,
          html: loader.html,
          template: !!loader.template,
          locationPlaceHolder: ((+loader.positionId) === 1) ? "NOT_END" : "END",
          locationObject: location,
          async: loader.async,
          needsConsent: loader.needsConsent,
          usesDocumentWrite: loader.usesDocWrite,
          genericDependencies: loader.genericDependencies
        };
        
        if (loader.prePostWindowScope !== undefined) {
          cfg.prePostWindowScope = loader.prePostWindowScope;
        }
        
        if (dedupe) {
          cfg.dedupe = true;
        }
        
        if (loader.runner) {
          cfg.runner = loader.runner;
        }
        
        if (loader.pre) {
          cfg.pre = loader.pre;
        }
        
        if (loader.post) {
          cfg.post = loader.post;
        }
        
        if (loader.script) {
          cfg.script = loader.script;
        }
        
        var tag = null;
        
        if (cfg.template) {
          tag = new LibraryTag(cfg);
        } else {
          tag = new CustomTag(cfg);
        }

        //attach to original "loader" array to pick it at dependencies check
        tagDefinitions[prop].instance = tag;
        
        //add the tag
        tags.push(tag);
      }
    }
    
    //all tags ready, finally, attach dependencies (defined by IDs here)
    for (var prop in tagDefinitions) {
      if (tagDefinitions.hasOwnProperty(prop)) {
        var dependencies = [];
        var loader = tagDefinitions[prop];
        if (loader.dependencies) {
          for (var j = 0; j < loader.dependencies.length; j++) {
            var tagId = loader.dependencies[j];
            var dependency = tagDefinitions[tagId].instance;
            dependencies.push(dependency);
          }
          var tag = loader.instance;
          tag.dependencies = dependencies.concat(tag.dependencies);
        }
      }
    }
    return tags;
  };

  var V_JS_VALUE = "2";
  var V_QUERY_PARAM = "3";
  var V_COOKIE_VALUE = "4";
  var V_ELEMENT_VALUE = "5";
  
  /**
   * Finds parameters for "loader" and attaches its variables found in 
   * `variables`.
   * 
   * @param {Object} loader
   * @param {Object} variables
   * @returns {Array}
   */
  function findParameters(loader, variables) {
    var parameters = loader.pageVars;
    var ret = [];
    for (var prop in parameters) {
      if (parameters.hasOwnProperty(prop)) {
        var param = parameters[prop];
        var variableDefinition = variables[prop];
        
        if (variableDefinition) {
          var variable;
          var varCfg = {
            name: variableDefinition.name,
            value: variableDefinition.value
          };
          
          switch (variableDefinition.type) {
            case V_JS_VALUE: //covers also UV
              variable = new Expression(varCfg);
              break;
            case V_QUERY_PARAM:
              variable = new URLQuery(varCfg);
              break;
            case V_COOKIE_VALUE:
              variable = new Cookie(varCfg);
              break;
            case V_ELEMENT_VALUE:
              variable = new DOMText(varCfg);
              break;
            default:
              variable = new BaseVariable(varCfg);
          }
          
          var parameter = {
            token: param.token
          };
        
          if (param.defaultValue) {
            parameter.defaultValue = param.defaultValue;
          }
          
          if (variable) {
            parameter.variable = variable;
          }
          
          ret.push(parameter);
        }
      }
    }
    return ret;
  };

  var NORMAL_FILTER = "1";
  var DEDUPE_URL_FILTER = "2";
  var DEDUPE_SESSION_FILTER = "3";
  /**
   * @private
   * Filter type getter.
   * @type String
   */
  var getFilterType = function(filter) {
    var x = parseInt(filter.patternType, 10);
    if ((x < 10) || (x === 100)) {
      return NORMAL_FILTER;
    }
    if ((x >= 10) && (x < 20)) {
      return DEDUPE_URL_FILTER;
    }
    if (x === 110) {
      return DEDUPE_SESSION_FILTER;
    }
  };

  /*
   * Function loops through filters for the tag and return a set of filters
   *  belonging to tags scripts.
   * @param {Number} id
   * @param {Array} filters
   * @returns {Array}
   */
  function findFilters(filters, id) {
    log.FINE("getting filters");
    var filtersToReturn = [];
    for (var i = 0; i < filters.length; i++) {
      var filter = filters[i];
      
      var idx = Utils.indexInArray(filter.scriptLoaderKeys, id);
      if (idx !== -1) {
        //  NORMAL_FILTER = "1";
        //  DEDUPE_URL_FILTER = "2";//dedupe has sense only for session
        //  DEDUPE_SESSION_FILTER = "3";
        var session = false;
        switch (getFilterType(filter)) {
          case NORMAL_FILTER:
          case DEDUPE_URL_FILTER:
            break;
          case DEDUPE_SESSION_FILTER:
            session = true;
            break;
        }

        if (session ||
            filter.starter ||
            typeof(filter.pattern) === "function") {
          filter.instance = new SessionVariableFilter({
            include: (+filter.filterType === 1),
            name: filter.name,
            customStarter: filter.starter,
            customScript: filter.pattern
          });
        } else {
          filter.instance = new URLFilter({
            include: (+filter.filterType === 1),
            name: filter.name,
            patternType: resolvePatternType(filter),
            pattern: filter.pattern
          });
        }
        if (filter.priority !== undefined) {
          filter.instance.config.order = +filter.priority;
        }
        filtersToReturn.push(filter.instance);
      }
    }
    var sortFun = function(a, b) {
      return +a.priority > +b.priority;
    };
    return filtersToReturn.sort(sortFun);
  }

  /*
   * Pattern type resolver for old QTag system.
   * It translates match pattern numbers from database to meaningful states.
   */
  var ALL = "1";
  var SUBSTRING = "2";
  var REGEX = "3";
  var EXACT_MATCH = "4";
  var FN = "100";
  var DEDUPE_FN = "110";
  
  /**
   * Translates old pattern types to new PatternType properties for URLs.
   * @param {Object} filter
   * @returns {qubit.opentag.filter.pattern.PatternType}
   */
  function resolvePatternType(filter) {
    switch (filter.patternType) {
      case FN:
      case DEDUPE_FN:
        return null;
        //session execution it was...
      case EXACT_MATCH:
      case "1" + EXACT_MATCH:
        return PatternType.MATCHES_EXACTLY;
      case SUBSTRING:
      case "1" + SUBSTRING:
        return PatternType.CONTAINS;
      case REGEX:
      case "1" + REGEX:
        return PatternType.REGULAR_EXPRESSION;
      case ALL:
      case "1" + ALL:
        return PatternType.ALL_URLS;
      default:
        return null;
    }
  }
})();