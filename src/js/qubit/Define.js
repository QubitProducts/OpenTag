//:include GLOBAL.js

/*
 * Opentag, a tag deployment platform
 * Copyright 2013-2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  
  /**
   * @class qubit.Define
   * @singleton
   * 
   * #Generic Utility
   * 
   * It delivers utility tools for copying or traversing objects, acessing
   * and manipulating CSS class names, managing arrays, creating classes and
   * many more useful utilities. Please see the API.
   * 
   */
  function Define() {}
  
  /**
   * Global scope accessor.
   * @returns {Object}
   */
  Define.global = function () {
    return GLOBAL;
  };

  /**
   * Function builds desired name space in global scope.
   * It will not override existing elements.
   * Global option does not apply if pckg is specified.
   * @param {String} path
   * @param {Object} instance
   * @param {Object} pckg
   * @param {Boolean} noOverride
   * @returns {Object}
   */
  Define.globalNamespace = function (path, instance, pckg, noOverride) {
    return _namespace(path, instance, pckg, noOverride, true);
  };
  
  /**
   * Function builds desired name space in defalt PKG_ROOT scope.
   * It will not override existing elements.
   * @param {String} path dot notation based objects path.
   * @param {Object} instance reference to be put as last `object` node. If `undefined` 
   *                  empty object will be used
   * @param {Object} pckg object to start namespace at
   * @param {Boolean} noOverride if set, "instance" parameter will not override
   *    if object already exists in namespace. Can be ignored if 
   *    `GLOBAL.TAGSDK_NS_OVERRIDE` is set to true (no overriding mode)
   * @returns {Object} `{root, object}` pair where namespace starts at "root" 
   *        and ends at "object". "object" is the top element namespace created.
   */
  Define.namespace = function (path, instance, pckg, noOverride) {
    return _namespace(path, instance, pckg, noOverride, false);
  };
  
  function _namespace(path, instance, pckg, noOverride, isGlobal) {
    var files = path.split("."),
      //access eval INDIRECT so it is called globally
      current = Define.NAMESPACE_BASE || PKG_ROOT,
      last = null,
      lastName = null,
      i;
    
    if (isGlobal) {
      current = GLOBAL;
    }
    
    var root = current;
    
    current = pckg || current;
    
    for (i = 0; i < files.length - 1; i += 1) {
      last = current;
      lastName = files[i];
      current[lastName] = current[lastName] || {};
      current = current[lastName];
    }
    
    last = current;
    lastName = files[files.length - 1];
    
    if (GLOBAL.TAGSDK_NS_OVERRIDE) {
      noOverride = false;
    }
    
    if (instance !== undefined) {
      if (last[lastName] === undefined || !noOverride) {
        last[lastName] = instance;
      }
    } else {
      last[lastName] = last[lastName] || {};
    }
    
    return {
      root: root,
      object: last
    };
  }

  /**
   * Utility for simple class declaration (not definition).
   * It does similiar job as namespace with addition of adding CLASS_NAME
   * and PACKAGE_NAME on prototype. It also sets superclass to extending class
   * instance.
   * 
   * @param {String} path
   * @param {Object} instance
   * @param {Function} extendingClass
   * @param {Object} pckg
   * @param {Object} config
   * @returns {Object} the class instance
   */
  Define.clazz = function (path, instance, extendingClass, pckg, config) {
    Define.namespace(path, instance, pckg, true);
    if (typeof(extendingClass) === "function") {
      instance.superclass = extendingClass;
      instance.prototype = new instance.superclass(config);
    }
    var names = path.split(".");
    if (instance.prototype) {
      instance.prototype.CLASS_NAME = names[names.length - 1];
      names.splice(names.length - 1, 1);
      instance.prototype.PACKAGE_NAME = names.join(".");
    } else {
      instance.STATIC_NAME = names[names.length - 1];
      names.splice(names.length - 1, 1);
      instance.PACKAGE_NAME = names.join(".");
    }
    return instance;
  };

  Define.clazz("qubit.Define", Define);
  
}());
