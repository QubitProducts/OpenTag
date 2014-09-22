//:include qubit/opentag/Log.js
//:include qubit/opentag/Utils.js
//:include qubit/opentag/BaseTag.js

(function(){
  var Utils = qubit.opentag.Utils;
  var log = new qubit.opentag.Log("Tags -> ");
  
  /**
   * @singleton
   * @class qubit.opentag.Tags
   * #Tags Utility Class
   * This class is an utlity object for accessing, grouping and filtering tags.
   */
  var Tags = function () {};

  Utils.clazz("qubit.opentag.Tags", Tags);
  
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
    for(var i = 0; i < tags.length; i++) {
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
    for(var i = 0; i < tags.length; i++) {
      if (tags[i].config.name.match(match)) {
        results.push(tags[i]);
      }
    }
    return results;
  };
  /**
   * Get all opentag instances map.
   * 
   * @returns Object
   */
  Tags.getTags = function () {
    log.FINEST("getTags");
    return qubit.opentag.BaseTag.getTags();
  };
  
  /**
   * Reset all tags. It will make all tags ready to rerun like they never
   * were run.
   * 
   * @returns Object
   */
  Tags.resetAllTags = function () {
    log.WARN("reseting all tags!");
    var tags = Tags.getTags();
    for (var i = 0; i < tags.length; i++) {
      tags[i].reset();
    }
  };

  /**
   * Returns all page variable instances associated with containers.
   * @returns {Array}
   */
  Tags.getContainersPageVariables = function () {
    var containers = Tags.getContainers();
    var vars = [];
    for(var i =0; i < containers.length; i++) {
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
    for(var i = 0; i < tags.length; i++) {
      vars = vars.concat(tags[i].getPageVariables());
    }
    return vars;
  };

  /**
   * @static
   * Cancell all tags.
   */
  Tags.cancelAll = function () {
    var tags = Tags.getTags();
    for(var i = 0; i < tags.length; i++) {
      tags[i].cancel();
    }
  };
  
  /**
   * @static
   * Reset all tags.
   */
  Tags.resetAll = function () {
    var tags = Tags.getTags();
    for(var i = 0; i < tags.length; i++) {
      tags[i].reset();
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
      for(var i = 0; i < tags.length; i++) {
        if (tags[i] instanceof qubit.opentag.BaseTag) {
          ret.push(Tags.getLoadTime(tags[i]));
        }
      }
    } else {
      for(var prop in tags) {
        if (tags[prop] instanceof qubit.opentag.BaseTag) {
          ret.push(Tags.getLoadTime(tags[prop]));
        }
      }
    }
    return ret;
  };
    
  
  /**
   * Containers getter.
   * Gets all containers registered.
   * @returns {Array} array of qubit.opentag.Container
   */
  Tags.getContainers = function () {
    return qubit.opentag.Container.getContainers();
  };
  
  log.INFO("*** Qubit TagSDK *** ", true,
           "font-size: 22px; color:#CCC;"+//L
           "text-shadow:#fff 0px 1px 0, #555 0 -1px 0;");//L
})();