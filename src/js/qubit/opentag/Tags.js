//:import qubit.opentag.Log
//:import qubit.Define
//:import qubit.opentag.BaseTag
//:import qubit.opentag.Utils
//:import qubit.opentag.filter.BaseFilter
//:import qubit.opentag.CustomTag
//:import qubit.opentag.LibraryTag

(function () {
  var log = new qubit.opentag.Log("Tags -> ");/*L*/
  var Utils = qubit.opentag.Utils;
  var BaseFilter = qubit.opentag.filter.BaseFilter;

  /**
   * @singleton
   * @class qubit.opentag.Tags
   * #Tags Utility Class
   * This class is an utlity object for accessing, grouping and filtering tags.
   */
  var Tags = function () {};

  qubit.Define.clazz("qubit.opentag.Tags", Tags);
  
  /**
   * @static
   * Get tag by its unique ID.
   * @param {String} id unique Id, on  tag it is 'uniqueId` property - if set.
   * @returns {qubit.opentag.BaseTag} tag instance
   */
  Tags.getById = function (id) {
    return qubit.opentag.BaseTag.getById(String(id));
  };

  /**
   * Returns all tags grouped by logical state, it collects ALL tags from ALL
   * Containers - tags unregistered will not be included. 
   * @returns {Object}
   */
  Tags.getAllTagsByState = function () {
    return qubit.opentag.Container.getAllTagsByState(Tags.getTags());
  };
  
  /**
   * Find tag by name
   * @param {String} match string, String.match() function will be used.
   * @returns {Array} array of qubit.opentag.BaseTag
   */
  Tags.findTagByName = function (match) {
    var tags = this.getTags();
    var results = [];
    for (var i = 0; i < tags.length; i++) {
      if (tags[i].config.name === match) {
        results.push(tags[i]);
      }
    }
    return results;
  };
  
  /**
   * Find tag by name
   * @param {String} match string, String.match() function will be used.
   * @returns {Array} array of qubit.opentag.BaseTag
   */
  Tags.findTagByMatch = function (match) {
    var tags = this.getTags();
    var results = [];
    for (var i = 0; i < tags.length; i++) {
      if (tags[i].config.name.match(match)) {
        results.push(tags[i]);
      }
    }
    return results;
  };
  /**
   * Utility used to find all containers storing tag reference.
   * @param {type} tag
   * @returns {Array} array of containers mapping the tag.
   */
  Tags.findTagContainers = function (tag) {
    var containers = Tags.getContainers();
    var containing = [];
    for (var i = 0; i < containers.length; i++) {
      var tagsMap = containers[i].tags;
      for (var prop in tagsMap) {
        if (tagsMap[prop] === tag) {
          containing.push(containers[i]);
          break;
        }
      }
    }
    return containing;
  };
  /**
   * Get all opentag instances map.
   * 
   * @returns Object
   */
  Tags.getTags = function () {
    log.FINEST("getTags");/*L*/
    return qubit.opentag.BaseTag.getTags();
  };
  
  /**
   * Reset all tags. It will make all tags ready to rerun like they never
   * were run.
   * 
   * @returns Object
   */
  Tags.resetAllTags = function (skipFilters) {
    log.WARN("reseting all tags!");/*L*/
    var tags = Tags.getTags();
    for (var i = 0; i < tags.length; i++) {
      tags[i].reset();
      if (!skipFilters) {
        tags[i].resetFilters();
      }
    }
  };

  /**
   * Returns all page variable instances associated with containers.
   * @returns {Array}
   */
  Tags.getContainersPageVariables = function () {
    var containers = Tags.getContainers();
    var vars = [];
    for (var i = 0; i < containers.length; i++) {
      vars = vars.concat(containers.getPageVariables());
    }
    return vars;
  };
  
  /**
   * @static
   * Returns all page variables associated with all registered tags.
   */
  Tags.getAllPageVariables = function () {
    var tags = Tags.getTags();
    var vars = [];
    for (var i = 0; i < tags.length; i++) {
      vars = vars.concat(tags[i].getPageVariables());
    }
    return vars;
  };

  /**
   * @static
   * Cancel all tags.
   */
  Tags.cancelAll = function () {
    var tags = Tags.getTags();
    for (var i = 0; i < tags.length; i++) {
      tags[i].cancel();
    }
  };
  
  /**
   * @static
   * Reset all tags.
   * @param {Boolean} skipFilters if should reset with filters.
   */
  Tags.resetAll = function (skipFilters) {
    var tags = Tags.getTags();
    for (var i = 0; i < tags.length; i++) {
      tags[i].reset();
      if (!skipFilters) {
        tags[i].resetFilters();
      }
    }
  };

  /**
   * Function used to get all page variables instances having same name.
   * 
   * @param {String} name token name that identifies the variable.
   * @return {qubit.opentag.pagevariable.BaseVariable} object 
       qubit.opentag.pagevariable.BaseVariable
       instance. 
   */
  Tags.getPageVariableByName = function (name) {
    var vars = Tags.getAllPageVariables();
    var rets = [];
    for (var i = 0; i < vars.length; i++) {
      if (vars[i].config.name === name) {
        rets.push(vars[i]);
      }
    }
    return rets;
  };
  
  /**
   * Gets load time for tag.
   * 
   * @param {qubit.opentag.BaseTag} tag
   * @returns {Object} Object return has two properties:
   * 
   * - `tag` reference to tag
   * 
   * - `loadTime` Number value or null if tag is finished running (note, it does
   *  not check if tag is loaded successfuly but if it was run)
   */
  Tags.getLoadTime = function (tag) {
    var start = tag.beforeRun;
    var end = tag.runIsFinished;
    if (isNaN(end)) {
      return {tag: tag, loadTime: null};
    } else {
      return {tag: tag, loadTime: (end - start)};
    }
  };

  /**
   * Gets load times for all tags or passed via argument.
   * 
   * @param {Object} tags tags map or an array (optional)
   */
  Tags.getLoadTimes = function (tags) {
    var ret = [];
    if (tags instanceof qubit.opentag.BaseTag) {
      ret.push([Tags.getLoadTime(tags[prop])]);
      return ret;
    }
    
    tags = tags || Tags.getTags();
    
    var array = tags instanceof Array;
    
    if (array) {
      for (var i = 0; i < tags.length; i++) {
        if (tags[i] instanceof qubit.opentag.BaseTag) {
          ret.push(Tags.getLoadTime(tags[i]));
        }
      }
    } else {
      for (var prop in tags) {
        if (tags[prop] instanceof qubit.opentag.BaseTag) {
          ret.push(Tags.getLoadTime(tags[prop]));
        }
      }
    }
    return ret;
  };
  
  /**
   * Function will enable all disabled container and all disabled tags in 
   * browser to ignore the disabled flag.
   */
  Tags.forceAllContainersAndTagsToRunIfDisabled = function () {
    qubit.opentag.Container.setCookieForDisabledContainersToRun();
    qubit.opentag.BaseTag.setCookieForcingTagsToRun();
  };
  
  /**
   * Function will clear all cookies that were set to force disabled tags
   * and disabled containers to run.
   * See `forceAllContainersAndTagsToRunIfDisabled` for more details.
   */
  Tags.rmAllContainersAndTagsForcingFlags = function () {
    qubit.opentag.Container.rmCookieForDisabledContainersToRun();
    qubit.opentag.BaseTag.rmAllCookiesForcingTagToRun();
  };
  
  /**
   * Containers getter.
   * Gets all containers registered.
   * @returns {Array} array of qubit.opentag.Container
   */
  Tags.getContainers = function () {
    return qubit.opentag.Container.getContainers();
  };
  
  /**
   * 
   * @param {type} startsWith
   * @returns {Array}
   */
  Tags.findAllTagsByClassPath = function (startsWith) {
    var start = new Date().valueOf();
    var ret = [];
    var excludes = [];
    
    try {
      excludes.push(qubit.opentag.CustomTag);
      excludes.push(qubit.opentag.LibraryTag);
    } catch (ex) {
      // not a package dependency
      log.FINEST("Warning:Missing known libraries: CustomTag, LibraryTag");/*L*/
    }
    
    var tags = Tags.getTags();
    
    for (var i = 0; i < tags.length; i++) {
      var tag = tags[i];
      if (Utils.indexInArray(excludes, tag) < 0 &&
              tag.PACKAGE_NAME.indexOf(startsWith) === 0) {
        ret.push(tag);
        log.FINEST("findAllTagsByClassPath(): found: " + tag.PACKAGE_NAME +/*L*/
                " -> " + tag.config.name);/*L*/
      }
    }
    
    log.FINE("findAllTags(): selection found in " + /*L*/
            (new Date().valueOf() - start));/*L*/
    
    return ret;
  };
  
  /**
   * @static
   * Function will result all tags found in `pckg` passed as argument. 
   * `pckg` can be a string with package name or direct reference to 
   * an object.
   * @param {type} pckg Package name or its reference.
   * @param {type} maxDeep Maximum deep level of package tree search, 
   *                starts from 1.
   * @returns {Array} Results array (never null).
   */
  Tags.findAllTags = function (pckg, maxDeep) {
    var BaseTag = qubit.opentag.BaseTag;
    var ret, excludes = [];
    var start = new Date().valueOf();
    try {
      excludes.push(qubit.opentag.CustomTag);
      excludes.push(qubit.opentag.LibraryTag);
    } catch (ex) {
      // not a package dependency
      log.FINEST("Warning:Missing known libraries: CustomTag, LibraryTag");/*L*/
    }
    ret = Tags.findAllInstances(pckg, BaseTag, excludes, maxDeep);
    log.FINE("findAllTags(): found in " + (new Date().valueOf() - start));/*L*/
    return ret;
  };
  
  
  /*
   * @private
   * Might be moved to Utils.
   * Local function - worker for the recursive search.
   * @param {type} pckg where to search
   * @param {type} check include deciding function
   * @param {type} excludes excludes array wher === will be checked.
   * @param {type} maxDeep how deep to search (no limits if unset)
   * @returns {Array}
   */
  var findAllIn = function (pckg, check, excludes, maxDeep) {
    var instances = [];
    
    if (typeof(pckg) === "string") {
      pckg = Utils.getObjectUsingPath(pckg);
    }
    
    if (pckg) {
      var cfg = {
        objectsOnly: true
      };
      
      if (maxDeep) {
        cfg.maxDeep = true;
      }
      
      cfg.track = true; /*L*/
      var start = new Date().valueOf(); /*L*/
      
      var fun = function (obj, parent, propName, trackPath) {
        if (check(obj)) {
          for (var i = 0; i < excludes.length; i++) {
            if (excludes[i] === obj) {
              return true;
            }
          }
          log.FINE("found [" + trackPath + "]:" + /*L*/
                  (obj.config ? obj.config.name : propName));/*L*/
          Utils.addToArrayIfNotExist(instances, obj);
          return true;// dont search in instances objects
        }
        return false;// get deeper
      }.bind(this);
      
      Utils.traverse(pckg, fun, cfg);
      
      log.FINE("Found in " + (new Date().valueOf() - start));/*L*/
    }
    return instances;
  };
  
  /**
   * 
   * @param {type} pckg
   * @param {type} clazz
   * @param {type} excludes
   * @param {type} maxDeep
   * @returns {Array}
   */
  Tags.findAllInstances = function (pckg, clazz, excludes, maxDeep) {
    var check = function (obj) {
      return obj instanceof clazz;
    };
    return findAllIn(pckg, check, excludes, maxDeep);
  };
  
  /**
   * 
   * @param {type} pckg
   * @param {type} clazz
   * @param {type} excludes
   * @param {type} maxDeep
   * @returns {Array}
   */
  Tags.findAllInheriting = function (pckg, clazz, excludes, maxDeep) {
    var check = function (obj) {
      return obj.prototype instanceof clazz;
    };
    return findAllIn(pckg, check, excludes, maxDeep);
  };
  
    
  /**
   * @static
   * Finds all filters in specified package (name or reference).
   * It will find all references that are instances of 
   *    qubit.opentag.filter.BaseFilter 
   * @param {type} pckg
   * @param {type} maxDeep
   * @returns {Array}
   */
  Tags.findAllFilters = function (pckg, maxDeep) {
    var excludes = [];
    try {
      excludes.push(qubit.opentag.filter.Filter);
      excludes.push(qubit.opentag.filter.URLFilter);
    } catch (ex) {
      // not a package dependency
      log.FINE("Warning: Missing known libraries: CustomTag, LibraryTag");/*L*/
    }
    return Tags.findAllInheriting(pckg, BaseFilter, excludes, maxDeep);
  };
  
  log.INFO("*** Qubit TagSDK *** ", true,/*L*/
           "font-size: 22px; color:#CCC;" + /*L*/
           "text-shadow:#fff 0px 1px 0, #555 0 -1px 0;");/*L*/
})();
