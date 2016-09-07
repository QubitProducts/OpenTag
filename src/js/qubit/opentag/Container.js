//:import qubit.Define
//:import qubit.opentag.Utils
//:import qubit.opentag.Timed
//:import qubit.opentag.BaseTag
//:import qubit.opentag.filter.BaseFilter
//:import qubit.opentag.filter.Filter
//:import qubit.opentag.Tags
//:import qubit.opentag.Ping
//:import qubit.opentag.Session
//:import qubit.Cookie
//:import qubit.Quick

/*
 * TagSDK, a tag development platform
 * Copyright 2013-2016, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  var Utils = qubit.opentag.Utils;
  var BaseFilter = qubit.opentag.filter.BaseFilter;
  var Filter = qubit.opentag.filter.Filter;
  var BaseTag = qubit.opentag.BaseTag;
  var Timed = qubit.opentag.Timed;
  var Tags = qubit.opentag.Tags;
  var Session = qubit.opentag.Session;//:session
  var Cookie = qubit.Cookie;
  var log = new qubit.opentag.Log("Container -> ");/*L*/

  var _counter = 1;

/* Consent hack from old qtag - will be updated by requires renewing consent.
 * @TODO seriously, clean this up in opentag! use global not window
 * Compatibility layer.
 */
  try {
    window.opentag_consentGiven = function () {
      Container.consentIsGiven = true;
      var all = Container.getContainers();
      for (var i = 0; i < all.length; i++) {
        try {
          all[i].run();
        } catch (ex) {
          log.ERROR("error running consent dependant containers: " + ex);/*L*/
        }
      }
    }.bind(this);
  } catch (ex) {
    log.WARN("opentag_consentGiven could not be set!");/*L*/
  }
  /**
   * #Tags Container class
   * Tags are normally grouped into container objects which define some of
   * the rules that apply to tags during load time.
   * 
   * Container object corresponds directly to the container object in 
   * [Opentag](http://opentag.qubitproducts.com/QDashboard).
   * 
   * Container loading engine controls which and how tag's will be run, it will 
   * also monitor tag's state and transmit statistical information (wherever it 
   * applies) for opentag.
   * 
   * Example of usage:
   *       


      var aContainer =  new qubit.opentag.Container({
        maxCookieLength: 1000,
        delayDocWrite: true,
        name: "Container A",
        tellLoadTimesProbability: true,
        trackSession: true
      });
  
      var tag = new qubit.opentag.LibraryTag({
        name: "Library Tag A",
        url: "http://code.jquery.com/jquery.js",
        script: "alert('Hello world!')"
      });
  
      aContainer.registerTag(tag);
      aContainer.run();
  
   * To use container, first instance must be creatyed. Before running 
   * container, all tags must be registered that container will manage (and run).
   * 
   * See config object properties for configuration details.
   * 
   * 
   * @class qubit.opentag.Container
   * @param config {Object} config object used to build instance
   * 
   */
  function Container(config) {
    this.runQueue = [];
    /*log*/
    this.log = new qubit.opentag.Log("", function () {
      return this.CLASS_NAME + "[" + this.config.name + "]";
    }.bind(this), true);
    /*~log*/
    
    /**
     * Tags that are bound to this container.
     * @property {Object} tags Map of qubit.opentag.BaseTag
     */
    this.tags = {};

    this.config = {/*CFG*/
      /**
       * @cfg {String} [cookieDomain=""]
       * A cookie domain used if you page uses subdomains.
       * Typically you will want to leave it empty or set it to
       * ".masterdomain.com" like.
       */
      cookieDomain: "",
      /**
       * @cfg {Number} [maxCookieLength=1000]
       * Maximum cookie length to be used by this tag. Set it to lower value
       * if serving pages use very long cookies.
       */
      maxCookieLength: 1000,
      /**
       * @cfg {Boolean} [gzip=true]
       * True by default, indicates if tags should be zipped with gzip standard.
       */
      gzip: true,
      /**
      * @cfg {Boolean} [delayDocWrite=false]
      * Indicates if all document.write calls should be delayed till entire 
      * document is loaded. Default is false.
      */
      delayDocWrite: false,
      /**
       * @cfg {String} [clientId=""]
       * A client ID associated with this container.
       * Its old opentagClientId value.
       * Client ID, it is required for correct pings to be sent [ping]
       */
      clientId: "",
      /**
       * @cfg name
       * Profile name.
       * [ping]
       */
      name: "",
      /**
       * @cfg
       * Seems that this setting triggers propability of isTellingLoadTimes
       * being set to true. You can choose values from 0.0 to 1.0 (float).
       * Old tellLoadTimesProbability [ping]
       */
      tellLoadTimesProbability: null,
      /**
       * @cfg {String} [pingServerUrl=null]
       * Ping server url setting. Statistic submission will not work without
       * this parameter being set.
       * Old pingServerUrl.
       */
      pingServerUrl: null,
      /**
       * @cfg {Boolean} [trackSession=null]
       * Indicates if container should track session.
       * Old opentag_track_session.
       */
      trackSession: null,
      /**
       * @cfg {Boolean} [disabled=false]
       * Indicates if container is disabled. Disabled container will not
       * run unless `force` parameter is used. See `run()` method for 
       * more details.
       */
      disabled: false,
      /**
       * @cfg {String} [containerId=""]
       * Container DB ID. This vaue is required for ping and session to work.
       * work.
       */
      containerId: "",
      /**
       * @cfg {Boolean} [scanTags=true]
       * Indicates if container should scan its class path for all tags.
       * Default is true.
       */
      scanTags: false,
      /**
       * @cfg {Boolean} [noPings=false] blocks pings.
       */
      noPings: false
    };/*~CFG*/
    
    /**
     * @protected
     * @property {Boolean} [ignoreTagsState=false]
     * If set to true, container will ignore any of tags state against consent
     * information and load all the tag as normal.
     * This property is mostly used for debugging purposes.
     */
    this.ignoreTagsState = false;
    
    if (config) {
      this.setConfig(config);
      
      if (!config.name) {
        this.config.name = "Cont-" + _counter++;
      }
      
      Container.register(this);
      this.log.FINE("container registered.");/*L*/
      /*no-send*/
      
      if (Container.NO_PINGS) {
        this.config.noPings = true;
      }
    
      this.ping = new qubit.opentag.Ping(this.config);

      this._sendPingsTrigger = this.sendPings.bind(this);
      
      /*~no-send*/
      if (config.init) {
        try {
          config.init.call(this, config);
        } catch (ex) {
          this.log.ERROR("init call failed:" + ex);/*L*/
        }
      }
      
      var _this = this;
      this._tagLoadedHandler = function (event) {
        if (_this._containerAlreadySentPings) {
          _this.sendPingsNotTooOften();
          if (event.success) {
            event.tag.log.INFO("[Other]SENDING LOAD STATS");/*L*/
          }
        }
      };
    }
    
    return this;
  }

  qubit.Define.clazz("qubit.opentag.Container", Container);

  var containers = [];
  /**
   *  Registering container function.
   *  By default each container instance is immediately registered in a global 
   *  registry, to access global registry call:
   *
   *     qubit.opentag.Container.getContainers();
   * 
   * @static
   * @param {qubit.opentag.Container} ref
   */
  Container.register = function (ref) {
    Utils.addToArrayIfNotExist(containers, ref);
  };
  
  /**
   * Function indicates if tag is telling load times. Tag's
   * implementation does attach timestamps for all their loading.
   * This property is used to indicate if loading times will be reported
   * by this container.
   * Value of this property is likely to be randomised, you should adjust 
   * `this.config.tellLoadTimesProbability` instead.
   * @protected
   * @property isTellingLoadTimes
   * @type Boolean
   */
  Container.prototype.isTellingLoadTimes = function () {
    var value = this.config.tellLoadTimesProbability;
    if (value === null) {
      value = 0;
    }
    return value > Math.random();
  };
  
  /**
   * Method to unregister and kill container.
   * @param {Boolean} withTags if tags should be destroyed as well. 
   *          Destroyed tags cannot be re-run and will be cancelled.
   */
  Container.prototype.destroy = function (withTags) {
    this.destroyed = true;
    this.unregister();
    if (withTags) {
      for (var prop in this.tags) {
        var tag = this.tags[prop];
        if (tag instanceof BaseTag) {
          tag.destroy();
          this.tags[prop] = null;
          delete this.tags[prop];
        }
      }
    }
    var name = this.PACKAGE_NAME.split(".");
    name = name[name.length - 1];
    
    var pkg = Utils.getParentObject(this.PACKAGE_NAME);
    pkg[name] = null;
    
    delete pkg[name];
  };
  
  /**
   * Function finds containers that have name equal to passed parameter.
   * @param {String} name string that will be used to compare.
   * @returns {Array} array of Containers registered in system.
   * 
   */
  Container.findContainersByName = function (name) {
    var items = this.getContainers();
    var results = [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].config.name === name) {
        results.push(items[i]);
      }
    }
    return results;
  };
  
  /**
   * Gets container by its's given ID.
   * @param {String} id
   * @returns {qubit.opentag.Container} Container instance if found or 
   *  null otherwise.
   */
  Container.getById = function (id) {
    var items = this.getContainers();
    for (var i = 0; i < items.length; i++) {
      if (items[i].getContainerId() === id) {
        return items[i];
      }
    }
    return null;
  };
  
  /**
   * Function used to unregister container from global registry.
   * @param {Boolean} withTags
   */
  Container.prototype.unregister = function (withTags) {
    Container.unregister(this, withTags);
  };

  /**
   * @static
   * Unregister method for container. useful for debugging.
   * See `Container.register()` for more details.
   * @param {qubit.opentag.Container} ref
   * @param {Boolean} withTags
   */
  Container.unregister = function (ref, withTags) {
    Utils.addToArrayIfNotExist(containers, ref);
    
    log.FINEST("Un-registering container named \"" +/*L*/
            ref.config.name + "\", instance of:");/*L*/
    log.FINEST(ref, true);/*L*/
    
    var index = Utils.removeFromArray(containers, ref);
    if (withTags) {
      for (var prop in this.tags) {
        var tag = this.tags[prop];
        if (tag instanceof BaseTag) {
          tag.unregister();
          this.tags[prop] = null;
          delete this.tags[prop];
        }
      }
    }
    
    if (!index || index.length === 0) {
      log.FINE("container is already unregisterd.");/*L*/
    }
  };

  /**
   * Tells if user has accepted the consent (by defaults checks cookie).
   * @returns {Boolean}
   */
  Container.prototype.hasConsent = function () {
    return Cookie.get("qubitconsent") === "Accepted";
  };

  /**
   * Registering container function. Same as `Container.register()` but applies
   * to class instance.
   * @param {qubit.opentag.Container} ref Optional.
   */
  Container.prototype.register = function (ref) {
    Container.register(ref || this);
  };

  /**
   * @static
   * Function returns all registered containers array.
   * @returns {Array}
   */
  Container.getContainers = function () {
    return containers;
  };
  
  /**
   * Function returns all registered containers array.
   * @returns {Array}
   */
  Container.prototype.getContainers = function () {
    return Container.getContainers();
  };
  
  /**
   * Function called when tag is registered with this container.
   * @event
   * @param {qubit.opentag.BaseTag} tag
   */
  Container.prototype.onTagRegistered = function (tag) {};
  
  /**
   * Function registering tag instance with this class instance.
   * Registered tag will have validated and possibly injected extra 
   * configuration.
   * Containers register tags **by their name**, and all Container's tags must 
   * have different name.
   * Container will not allow registering tag if there is 
   * already a tag with same name in container (!) - there will not be any 
   * exception thrown but tag will not be added to container!
   * 
   * @param {qubit.opentag.BaseTag} tag
   */
  Container.prototype.registerTag = function (tag) {
    var name = tag.config.name;
    if (this.tags[name]) {
      this.log.FINE("Tag with name `" + name + "` already is registered!");/*L*/
    } else {
      this.tags[name] = tag;
      tag.onAfter(this._tagLoadedHandler);
      try {
        this.onTagRegistered(tag);
      } catch (ex) {
        this.log.ERROR("onTagRegistered exception: " + ex);/*L*/
      }
    }
  };
  /**
   * Function registering tag instance.
   * It does same job like `registerTag` but the input is an array.
   * @param {Array} tags array of qubit.opentag.BaseTag
   */
  Container.prototype.registerTags = function (tags) {
    for (var i = 0; i < tags.length; i++) {
      this.registerTag(tags[i]);
    }
  };
  
  /**
   * Config setter for current instance.
   * Use this setter as config changes will affect registered tags.
   * It is important to use this function to set any configuration as it may 
   * affect tags registered and this method will remember to update
   * them accordingly.
   * @param {Object} config with values to be set.
   */
  Container.prototype.setConfig = function (config) {
    this.log.FINEST("Setting configuration:");/*L*/
    this.log.FINEST(config, true);/*L*/
    for (var prop in config) {
      this.config[prop] = config[prop];
    }
  };
  
  /**
   * Container and tags loading entry point.
   * This method triggers default tags loading, which is running with filters 
   * configuration.
   * To run tags directly, use `runWithoutFilters()` method.
   */
  Container.prototype.run = function () {
    this.log.FINE("starting loading");/*L*/
    this.runTags({
      command: "runOnceIfFiltersPass"
    });
  };

  /**
   * Container and tags loading entry point.
   * This method will trigger running all filters without filters check - any 
   * tags awaiting for filter condition will be tried to run WITHOUT that 
   * condition (ie. all filters disabled)!
   */
  Container.prototype.runWithoutFilters = function () {
    this.log.FINE("starting loading");/*L*/
    this.runTags({
      command: "run"
    });
  };

  /**
   * Function that will find tag by using it's name and return it if found.
   * @param {String} name
   * @returns {qubit.opentag.BaseTag} tag with specified name,
   *  undefined otherwise.
   */
  Container.prototype.getTagByname = function (name) {
    return this.tags[name];
  };
  
  /**
   * Function detecting if TagSDK was loaded synchronously or not.
   * @returns {Boolean}
   */
  Container.prototype.containerScriptLoadedSynchronously = function () {
    var i, ii, script, scripts, src;
    scripts = document.getElementsByTagName("script");
    for (i = 0, ii = scripts.length; i < ii; i += 1) {
      script = scripts[i];
      src = script.getAttribute("src");
      // removed "opentag", white labelling!!!
      if (!!src && (src.indexOf("" + 
          this.config.clientId + "-" + this.getContainerId() +
          ".js") > 0)) {
        return (script.getAttribute("async") === null && 
            // handle ie7
            (script.getAttribute("defer") === false ||
            // handle ie8
            script.getAttribute("defer") === "" ||
            // handle chrome/firefox
            script.getAttribute("defer") === null));
      } 
    }
    return true;
  };
  
  Container.prototype.prepareSessionIfNeeded = function () {
    /*session*/
    // @TODO add maybe better session condition here(much better...)  
    var trackSession = this.config.trackSession;
    if (trackSession !== true && trackSession !== false) {
      var tags = this.tags;
      for (var name in tags) {
        if (tags.hasOwnProperty(name)) {
          var tmpTag = tags[name];
          tmpTag.resolveAllDynamicData();
          var filters = tmpTag.getFilters();
          for (var i = 0; i < filters.length; i++) {
            var filter = filters[i];
            if (filter instanceof Filter && filter.isSession()) {
              this.trackSession = true;
              break;
            }
          }
          if (this.trackSession) {
            break;
          }
        }
      }
    } else {
      this.trackSession = trackSession;
    }

    if (Container.TRACK_SESSION) {
      this.trackSession = true;
    }

    if (this.trackSession) {
      this.session = Session.setupSession(this);
    }

    if (this.session) {
      this.log.INFO("Session attached:");/*L*/
      this.log.INFO(this.session, true);/*L*/
    }
    /*~session*/
  };
  
  /**
   * Function calling tags to start execution.
   * If Container.LOCKED is set to true or QUBIT_CONTAINERS_LOCKED is set to 
   * true container will not run - to run it, use force parameter. 
   * Those parameters are used mainly for debugging. Normally you can ignore 
   * locking mechanism.
   * @param config
   * @param {Boolean} force use if containers are LOCKED to enforce running.
   */
  Container.prototype.runTags = function (config, force) {
    if (this.destroyed) {
      throw "Container has been destroyed.";
    }
    
    if (!force) {
      if (Container.LOCKED || Utils.global().QUBIT_CONTAINERS_LOCKED) {
        this.log.INFO("All containers are LOCKED.");/*L*/
        this.log.INFO("To run, set Container.LOCKED to false and " +/*L*/
          " set Utils.global().QUBIT_CONTAINERS_LOCKED to false or " +/*L*/
          "use force parameter.");/*L*/
        this.log.WARN("Container locked - stopping here.");/*L*/
        return;
      }
    }
    
    if (this.onBeforeRun) {
      try {
        this.onBeforeRun();
      } catch (ex) {
        this.log.ERROR("Soft failure [Container.onBeforeRun()]: " + ex);/*L*/
      }
    }
    
    var forceAsync = !this.containerScriptLoadedSynchronously();
    
    var command = "runIfFiltersPass";
    if (config && config.command) {
      command = config.command;
    }
    /**
     * Timestamp indicating if and when tags running was executed.
     * @property {Number} runningStarted
     * @type Number
     */
    this.runningStarted = new Date().valueOf();
    this.log.FINE("triggering runningStarted at " + this.runningStarted);/*L*/
    var firedTagsMap = {};
    
    if (this.config.scanTags) {
      if (!this._scanned) {
        this.scanForTags();
        this._scanned = new Date().valueOf();
      }
    }
    
    // important to run it after tags scanning for this container.
    this.prepareSessionIfNeeded();
    
    // lets add priority option for tags
    // @todo review if ordering does make any sense
    var orderedTags = this.getTagsInOrder();
    
    for (var z = 0; z < orderedTags.length; z++) {
      try {
        var tag = orderedTags[z];
        var name = tag.config.name;
        // ignore tag state or check if clean and unstarted
        if (this.includedToRun(tag)) {
          // if dependencies are defined, and they are in the container, 
          // try to run them rather now instead of later! (reordering)
          var deps = tag.resolveDependencies();
          if (deps.length > 0) {
            for (var i = 0; i < deps.length; i++) {
              var dependency = deps[i];
              var depName = dependency.config.name;
              if (!firedTagsMap[depName] && this.tags[depName]) {
                firedTagsMap[depName] = dependency;
                this._tagRunner(dependency, command, forceAsync);
              }
            }
          }
          if (!firedTagsMap[name]) {
            firedTagsMap[name] = tag;
            this._tagRunner(tag, command, forceAsync);
          }
        }
      } catch (ex) {
        this.log.ERROR("Error while preparing tag '" + name +/*L*/
                "' to run.\n Error: " + ex);/*L*/
      }
    }
    // try to send pings sooner than later
    Timed.setTimeout(function () {
      this.sendPingsNotTooOften();
    }.bind(this), 1100);
    
    this.waitForAllTagsToFinish();
  };

  /**
   * @protected
   * @returns {Array}
   */
  Container.prototype.getTagsInOrder = function () {
    var tagsOrdered = [];
    for (var name in this.tags) {
      var tmpTag = this.tags[name];
      var priority = tmpTag.config.priority;
      
      if ((+priority) > 0) {
        var prIndex = 0;
        
        for (var c = 0; c < tagsOrdered.length; c++) {
          var tmpTagOrdered = tagsOrdered[c];
          if (tmpTagOrdered) {
            var priorityAlreadyIn = +tmpTagOrdered.config.priority;
            if (priorityAlreadyIn > 0 &&
                  priorityAlreadyIn > priority) {
              prIndex++;
            } else {
              break;
            }
          }
        }
        
        tagsOrdered.splice(prIndex, 0, tmpTag);
      } else {
        tagsOrdered.push(tmpTag);
      }
    }
    return tagsOrdered;
  };
  
  /**
   * @private Strictly private.
   * @param {type} tag
   * @param {type} command
   * @param {type} forceAsync
   * @returns {undefined}
   */
  Container.prototype._tagRunner = function (tag, command, forceAsync) {
    try {
      if (this.includedToRun(tag)) {
        this.log.FINE("triggering tag named: " + tag.config.name);/*L*/
        if (forceAsync) {
          tag.forceAsynchronous = true;
        }
        if (this.config.delayDocWrite) {
          tag.delayDocWrite = true;
        }
        // attach session if necessary
        tag.session = tag.session || this.session;//:session
        tag[command]();
      }
    } catch (ex) {
      this.log.ERROR(" -> tagRunner: Error running tag with name '" + /*L*/
              tag.config.name + /*L*/
              "'.\n Error: " + ex);/*L*/
    }
  };

  /**
   * Function resolves container id; first priority has config.containerId 
   * property, if its unset, container's top package location is used as it's 
   * unique.
   * @returns {Object} container ID.
   */
  Container.prototype.getContainerId = function () {
    if (this.config.containerId) {
      return this.config.containerId;
    } else {
      if (this._pkgName) {
        return this._pkgName;
      }
      var idx = this.PACKAGE_NAME.split(".");
      idx = idx[idx.length - 1];
      this._pkgName = idx;
      return idx;
    }
  };

  /**
   * @protected
   * If container can include the tag in running suite.
   * @param {qubit.opentag.BaseTag} tag tag to test if can be included
   * @returns {Boolean}
   */
  Container.prototype.includedToRun = function (tag) {
    if (!tag) {
      return false;
    }
    
    var cfg = tag.config;
    
    if (cfg.inactive) {
      return false;
    }
    
    if (cfg.disabled) {
      if (!tag.cookieSaysToRunEvenIfDisabled()) {
        return false;
      }
    }
    
    if (tag.disabledByCookie()) {
      return false;
    }
    
    var consentOk = Container.consentIsGiven ||
        (!cfg.needsConsent) || this.hasConsent();
    var atInitialState = (tag.state === BaseTag.prototype.STATE.INITIAL);
    return this.ignoreTagsState || (consentOk && atInitialState);
  };
  
  /**
   * Function will scan for Tags in Container package and register new results 
   * as its tags base.
   * @param {type} clean
   * @param {type} pkg optonal startWith string for classpath or object to 
   *                search in.
   * @returns {Array}
   */
  Container.prototype.scanForTags = function (clean, pkg) {
    if (clean) {
      this.tags = {};
    }
    
    var tags;
    if (pkg && typeof(pkg) === "object") {
      tags = this.findAllTags(pkg);
    } else {
      tags = this.findAllTagsByClassPath();
    }
    
    this.registerTags(tags);
    return tags;
  };
  
  /**
   * Function will result all tags found in default containers package or 
   * alternatively in `pckg` passed as argument. `pckg` can be a string
   * with package name or direct reference to an object.
   * @param {type} pckg Package name or its reference.
   * @param {type} maxDeep Maximum deep level of package tree search, 
   *                starts from 1.
   * @returns {Array} Results array (never null).
   */
  Container.prototype.findAllTags = function (pckg, maxDeep) {
    pckg = pckg || this.tagsPackageName || this.PACKAGE_NAME;
    return Tags.findAllTags(pckg, maxDeep);
  };
  
  /**
   * 
   * @param {type} startsWith
   * @returns {Array}
   */
  Container.prototype.findAllTagsByClassPath = function (startsWith) {
    startsWith = startsWith || this.PACKAGE_NAME;
    return Tags.findAllTagsByClassPath(startsWith);
  };
  
  /**
   * Function to find all filter instances in container package tree.
   * Use as utility - all tree searches are expensive.
   * @param {type} pckg alternatively where to look for filters, object or
   *                name
   * @param {type} maxDeep how deep to look for it (tree depth)
   * @returns {Array} Array with results.
   */
  Container.prototype.findAllFilters = function (pckg, maxDeep) {
    pckg = pckg || this.tagsPackageName || this.PACKAGE_NAME;
    return Tags.findAllFilters(pckg, maxDeep);
  };
  
  /**
   * @protected
   * Function used to trigger timer that awaits the tags to finish their
   * running.
   */
  Container.prototype.waitForAllTagsToFinish = function () {
    if (this._waitForAllTagsToFinishWaiting) {
      return;
    }
    
    if (!this._lastWaited) {
      this._lastWaited = new Date().valueOf();
    }
    
    var l = this.log;/*L*/
    var timedOut = (new Date().valueOf() - this._lastWaited) > 15 * 1000;
    var finished = this.allTagsFinished() || timedOut;
    
    if (!this._showFinishedOnce && finished) {
      this._lastWaited = null;
      if (timedOut) {
        this.log.WARN("Waiting too long. Check tags dependencies.");/*L*/
      }
      this._showFinishedOnce = true;
      /**
       * Property telling if and when all tags has been detected to finish
       * thir running.
       * @property runningFinished
       * @type Number
       */
      this.runningFinished = new Date().valueOf();
      
      /*log*/ // let us now print some results
      var results = this.getAllTagsByState();
      var awaitingLen = results.awaiting === null ?
                                  0 : Utils.keys(results.awaiting).length;
      var styling = " ;color: #0F7600;font-size: 12px;font-weight:bold; ";
      
      l.INFO("********************************************************",
        0, styling);
      l.INFO("Startup tags have ended their processing.", 0, styling);

      l.INFO("Finished in " +
          (this.runningFinished - this.runningStarted) + "ms.", 0, styling);
  
      var len;
      
      if (results.run) {
        len = Utils.keys(results.run).length;
        l.INFO("Successfully run tags[" + len + "]:", 0, styling);
        l.INFO(results.run, true);
      } else {
        l.INFO("No successfully run tags.", 0, styling);
      }
      
      if (results.failed) {
        len = Utils.keys(results.failed).length;
        var addRed = results.failed === null ? "" : "color: #DF5500;";
        l.INFO("Failed to run[" + len + "]:", 0,  styling + addRed);
        l.INFO(results.failed, true);
      } else {
        l.INFO("No failed tags.", 0,  styling);
      }
      
      if (results.awaiting) {
        len = Utils.keys(results.awaiting).length;
        l.INFO("There is still " + awaitingLen +
                " tag(s) ready to be fired by" +
                " awaiting filters that can run.",
                0, styling + "color: #DC9500;");
        l.INFO("Filter ready tags[" + len + "]:", 0, styling +
                "color: #DC9500;");
        l.INFO(results.awaiting, true);
      } else {
        l.INFO("No filter ready tags.", 0, styling);
      }

      if (results.consent) {
        len = Utils.keys(results.consent).length;
        l.INFO("Consent awaiting tags[" + len + "]:", 0, styling);
        l.INFO(results.consent, true);
      } else {
        l.INFO("No consent awaiting tags.", 0, styling);
      }
      
      if (results.locked) {
        len = Utils.keys(results.locked).length;
        l.INFO("Locked [" + len + "]:", 0,  styling);
        l.INFO(results.locked, true);
      } else {
        l.INFO("No locked tags.", 0,  styling);
      }
      
      if (results.other) {
        len = Utils.keys(results.other).length;
        l.INFO("Other unloaded tags[" + len + "]:", 0, styling);
        l.INFO(results.other, true);
      } else {
        l.INFO("No unloaded tags.", 0, styling);
      }
      
      l.INFO("********************************************************",
                    0, styling);
      /*~log*/
     
      // container adds listener to each tag to refire ping if necessary,
      // this property will cancell all those trying container to send
      // pings very early: before container finishes.
      this._containerAlreadySentPings = new Date().valueOf();
      
      /*no-send*/
      this.sendPingsNotTooOften();
      /*~no-send*/
      
      if (this.onTagsInitiallyRun) {
        this.onTagsInitiallyRun();
      }
      
    } else if (!finished) {
      this._waitForAllTagsToFinishWaiting = true;
      this._showFinishedOnce = false;

      Timed.setTimeout(function () {
        this._waitForAllTagsToFinishWaiting = false;
        this.waitForAllTagsToFinish();
      }.bind(this), 100);
        
    } else {
      l.INFO("********************************************************");/*L*/
      l.WARN("All tags seem to finished current jobs.");/*L*/
      l.INFO("********************************************************");/*L*/
    }
  };
  
  /**
   * @event
   * Event of tags run initially - it will be run when all tags are run initially.
   * Initially means that there still can be tags that have custom starters
   * running thou their load is not finished.
   */
  Container.prototype.onTagsInitiallyRun = EMPTY_FUN;
  
  /**
   * Function will reset all the tags to initial state. After reset all tags can
   * be re-run. Logs are never resetted.
   * @param {Boolean} skipFilters - if filters reset should be skipped.
   */
  Container.prototype.resetAllTags = function (skipFilters) {
    this.log.WARN("reseting all tags!");/*L*/
    for (var prop in this.tags) {
      if (this.tags.hasOwnProperty(prop)) {
        var tag = this.tags[prop];
        tag.reset();
        if (!skipFilters) {
          tag.resetFilters();
        }
      }
    }
  };
  
  /**
   * Function reset this container (including it's registered tags).
   * @param {Boolean} skipFilters - if filters should not be reset.
   */
  Container.prototype.reset = function (skipFilters) {
    this.log.WARN("reseting container!");/*L*/
    this.runningFinished = undefined;
    this._waitForAllTagsToFinishWaiting = undefined;
    this.runningStarted = undefined;
    this._showFinishedOnce = undefined;
    this.resetAllTags(skipFilters);
  };
  
  /*no-send*/
  /**
   * Function triggers sending statistical information. It takes special care
   * for how often this process is triggered. No matter how many tags are to be 
   * submitted - the process will be triggered no more often than 
   * 2000 miliseconds.
   */
  Container.prototype.sendPingsNotTooOften = function () {
    this._sndLck = this._sndLck || {};
    Timed.runIfNotScheduled(this._sendPingsTrigger, 2000, this._sndLck);
  };
  
  /**
   * Function sending pings for registered tags. It will check which tags are 
   * ready to be submitted and select them for submission.
   */
  Container.prototype.sendPings = function () {
    if (this.config.noPings) {
      this.log.WARN("Pings are cancelled due to configuration.");/*L*/
      return;
    }
    
    var i;
    if (this.isTellingLoadTimes()) {
//    Those are available in results:
//      run: runScripts, (to be sent NOW)
//      failed: failed, (to be NOT sent)
//      awaiting: filterReady, (to be set with callback)
//      consent: consent, (to be NOT sent)
//      locked: locked, (to be NOT sent)
//      other: other filterReady, (to be set with callback)
      var results = this.getAllTagsByState();
      var _this = this;
      var loadTimes;
      
      if (results.run) {
        // send "just run" load times
        loadTimes = Tags.getLoadTimes(results.run);
        this.log.INFO("Sending standard load pings");/*L*/
        this.lastPingsSentTime = new Date().valueOf();
        this.ping.send(this, loadTimes);
      }
      
      /*session*/
      // dedupe part:
      loadTimes = Tags.getLoadTimes();
      var deduplicatedTagsToBeSent = [];
      for (i = 0; i < loadTimes.length; i++) {
        var tag = loadTimes[i].tag;
        if (tag.config.dedupe && tag.sendDedupePing) {
          deduplicatedTagsToBeSent.push(tag);
        }
      }
      if (deduplicatedTagsToBeSent.length > 0) {
        this.log.INFO("Sending deduplication pings");/*L*/
        this.lastDedupePingsSentTime = new Date().valueOf();
        this.ping.sendDedupe(this, deduplicatedTagsToBeSent);
      }
      
      // set callbacks for "other"
      if (results.other) {
        loadTimes = Tags.getLoadTimes(results.other);
        var otherTagsToBeSent = [];
        for (i = 0; i < loadTimes.length; i++) {
          otherTagsToBeSent.push(loadTimes[i]);
        }
        
        // in case tags are fired and method used separately
        if (otherTagsToBeSent.length > 0) {
          this.ping.send(this, otherTagsToBeSent);
        }
      }
      
      // set callbacks for "other"
      if (results.awaiting) {
        loadTimes = Tags.getLoadTimes(results.awaiting);
        var awaitingTagsToBeSent = [];
        for (i = 0; i < loadTimes.length; i++) {
          awaitingTagsToBeSent.push(loadTimes[i]);
        }
        
        // in case tags are fired and method used separately
        if (awaitingTagsToBeSent.length > 0) {
          this.ping.send(this, awaitingTagsToBeSent);
        }
      }
      /*~session*/
    }
  };
  /*~no-send*/
  /**
   * Function returns ordered tags by:
   * - being executed (run)
   * - failed state (failed)
   * - consent awaiting (consent)
   * - being not executed (other)
   * - being awaiting active, filter delayed etc. (awaiting)
   * @returns {Object} A map containing human friendly named collections.
   */
  Container.prototype.getAllTagsByState = function () {
    return Container.getAllTagsByState(this.tags);
  };
  
  /**
   * @static
   * Function returns ordered tags by:
   * - being executed (run)
   * - failed state (failed)
   * - consent awaiting (consent)
   * - being not executed (other)
   * - being awaiting active, filter delayed etc. (awaiting)
   * @param {qubit.opentag.BaseTag} tags to be used
   * @returns {Object} A map containing human friendly named collections.
   */
  Container.getAllTagsByState = function (tags) {
    var runScripts = null, other = null, filterReady = null, failed = null,
            consent = null, locked = null;

    var LOWEST_FAIL_STATE = BaseTag.prototype.STATE.EXECUTED_WITH_ERRORS;
    for (var prop in tags) {
      var tag = tags[prop];
      if (tag instanceof BaseTag) {
        var name = tag.config.name;
        if (tag.scriptExecuted > 0) {
          runScripts = runScripts || {};
          attachRenamedIfExist(runScripts, tag, name);
        } else if (tag.locked) {
          locked = locked || {};
          attachRenamedIfExist(locked, tag, name);
        } else if (tag.scriptExecuted < 0 || (tag.state >= LOWEST_FAIL_STATE)) {
          failed = failed || {};
          attachRenamedIfExist(failed, tag, name);
        } else if (tag.filtersState() === BaseFilter.state.SESSION ||
                tag.filtersState() > 0) {
          filterReady = filterReady || {};
          attachRenamedIfExist(filterReady, tag, name);
        } else if (tag.config.needsConsent) {
          // consent needing unloaded
          consent = consent || {};
          attachRenamedIfExist(consent, tag, name);
        } else {
          other = other || {};
          attachRenamedIfExist(other, tag, name);
        }
      }
    }
    
    // note that sendPings is using this function to select pings to be sent.
    return {
      run: runScripts,
      failed: failed,
      awaiting: filterReady,
      consent: consent,
      locked: locked,
      other: other
    };
  };
  
  var steps = {};
  function attachRenamedIfExist(obj, src, name) {
    if (obj[name]) {
      steps[name] = steps[name] || 1;
      name += "(" + steps[name] + ")";
      steps[name]++;
    }
    obj[name] = src;
  }
  
  /**
   * @protected
   * Function detects if all initial tags are finished loading 
   * (excludes SESSION types).
   * This method is mostly used internally or for debugging purposes.
   * @returns {Boolean}
   */
  Container.prototype.allTagsFinished = function () {
    for (var prop in this.tags) {
      if (this.tags.hasOwnProperty(prop)) {
        var tag = this.tags[prop];
        if (tag instanceof qubit.opentag.BaseTag) {
          // tag.filtersState() < 0 === filters are passed
          // tag.locked is not locked
          // === 0 FAILED
          // > 0 filter is awaiting
          var state = tag.filtersState();
          if (!tag.config.disabled) {
            var notFailedAndUnlocked = tag.filtersState() < 0 && !tag.locked;
            var tagNotFinishedOrNotRunner = 
                    !(tag.finished() || (tag.config.runner && !tag.isRunning));
            if (notFailedAndUnlocked && tagNotFinishedOrNotRunner) {
              var isNotSession = (state !== BaseFilter.state.SESSION);
              var doesWaitForDeps = +tag.awaitingDependencies > 0;
              if (isNotSession && !doesWaitForDeps) {
                return false;
              }
            }
          }
        }
      }
    }
    return true;
  };
  
  /**
   * Returns all variables associated with this container.
   * @returns {Array} Array of variable instances of 
   * [qubit.opentag.pagevariable.BaseVariable](
     #!/api/qubit.opentag.pagevariable.BaseVariable)
   */
  Container.prototype.getPageVariables = function () {
    var vars = [];
    for (var prop in this.tags) {
      if (this.tags.hasOwnProperty(prop)) {
        var tVars = this.tags[prop].getPageVariables();
        for (var i = 0; i < tVars.length; i++) {
          // for each parameter, get variable instance if not added already
          Utils.addToArrayIfNotExist(vars, tVars[i]);
        }
      }
    }
    return vars;
  };
  
  /**
   * Function used to get all containers page variables instances having the 
   * name as specified.
   * 
   * @param {String} name token name that identifies the variable.
   * @return {qubit.opentag.pagevariable.BaseVariable} 
   *            object qubit.opentag.pagevariable.BaseVariable instance. 
   */
  Container.getPageVariableByName = function (name) {
    var vars = this.getAllPageVariables();
    var rets = [];
    for (var i = 0; i < vars.length; i++) {
      if (vars[i].config.name === name) {
        rets.push(vars[i]);
      }
    }
    return rets;
  };
  
  var disableCookiePrefix = "qubit.opentag.disableContainerRunning_";
  var forceCookiePrefix = "qubit.opentag.forceContainerRunning";
  
  /**
   * @private
   * @returns {String}
   */
  Container.prototype._getCookieNameForDisabling = function () {
    return disableCookiePrefix + this.getContainerId() + this.config.name;
  };
  
  /**
   * 
   * @returns {Boolean}
   */
  Container.prototype.disabledByCookie = function () {
    return !!Cookie.get(this._getCookieNameForDisabling());
  };
  
  /**
   * 
   */
  Container.prototype.setCookieToDisable = function () {
    Cookie.set(this._getCookieNameForDisabling(), "true");
  };
  
  /**
   * 
   * @returns {undefined}
   */
  Container.prototype.rmCookieToDisable = function () {
    Cookie.rm(this._getCookieNameForDisabling());
  };
  
  /**
   * 
   */
  Container.rmAllDisablingCookies = function () {
    Utils.rmCookiesMatching(disableCookiePrefix);
  };
  
  /**
   * When container is disabled - this method will set a cookie
   * so all containers will ignore disabled state in config and will run as
   * normal.
   * This is an useful method for debugging and testing purposes.
   */
  Container.setCookieForDisabledContainersToRun = function () {
    Cookie.set(forceCookiePrefix, "true");
  };
  
  /**
   * This method clears cookie set with `setCookieForDisabledContainersToRun()`.
   */
  Container.rmCookieForDisabledContainersToRun = function () {
    Cookie.rm(forceCookiePrefix);
  };
})();
