/* global GLOBAL */

//:import GLOBAL

/*
 * Opentag, a tag deployment platform
 * Copyright 2013-2016, Qubit Group
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

  // keep those next to each other
  Define.STANDARD_CS_NS = "qubit.cs";
  Define.clientSpaceClasspath = function () {
    if (window.qubit.CLIENT_CONFIG) {
      return "qubit.cs.d" + window.qubit.CLIENT_CONFIG.id;
    }
    return Define.STANDARD_CS_NS;
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
      // access eval INDIRECT so it is called globally
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
    
    if (GLOBAL.TAGSDK_NS_FORCED_OVERRIDE_OPTION !== undefined) {
      noOverride = !GLOBAL.TAGSDK_NS_FORCED_OVERRIDE_OPTION;
    }
    
    if (instance !== undefined) {
      if (last[lastName] === undefined || !noOverride) {
        last[lastName] = instance;
      }
    } else {
      last[lastName] = last[lastName] || {};
    }
    
    if (instance) {
      instance.CLASSPATH = files.join(".");
      files.splice(files.length - 1, 1);
      instance.PACKAGE_NAME = files.join(".");
    }
  
    return {
      root: root,
      object: last,
      instance: last[lastName]
    };
  }

  
  /**
   * Function behaves exactly the same as `Define.namespace`, with the 
   * difference that path will be prefixed with client space namespace 
   * ("qubit.cs").
   * 
   * Function builds desired name space in defalt PKG_ROOT scope.
   * It will not override existing elements.
   * @param {String} path dot notation based objects path.
   * @param {Object} instance reference to be put as last `object` node. 
   *                  If `undefined` empty object will be used.
   * @param {Object} pckg object to start namespace at
   * @param {Boolean} noOverride if set, "instance" parameter will not override
   *    if object already exists in namespace. Can be ignored if 
   *    `GLOBAL.TAGSDK_NS_OVERRIDE` is set to true (no overriding mode)
   * @returns {Object} `{root, object}` pair where namespace starts at "root" 
   *        and ends at "object". "object" is the top element namespace created.
   */
  Define.clientNamespace = function (path, instance, pckg, noOverride) {
    return Define.namespace(
      Define.clientSpaceClasspath() + "." + path, instance, pckg, noOverride);
  };

  /**
   * Utility for simple class declaration (not definition).
   * It does similiar job as namespace with addition of adding CLASS_NAME
   * and PACKAGE_NAME on prototype. It also sets SUPER to extending class
   * Class.
   * 
   * @param {String} path
   * @param {Object} Class
   * @param {Function} SuperClass
   * @param {Object} pckg
   * @param {Object} config
   * @returns {Object} the class Class
   */
  Define.clazz = function (path, Class, SuperClass, pckg, config) {
    Define.namespace(path, Class, pckg, true);
    if (typeof(SuperClass) === "function") {
      Class.SUPER = SuperClass;// also used by Utils.defineWrappedClass
      Class.superclass = SuperClass; // deprecated use SUPER
      Class.prototype = new SuperClass(config);
      Class.prototype.SUPER = SuperClass;
      Class.prototype.CLASS = Class;
    }
    var names = path.split(".");
    if (Class.prototype) {
      Class.prototype.CLASSPATH = names.join(".");
      Class.prototype.CLASS_NAME = names[names.length - 1];
      names.splice(names.length - 1, 1);
      Class.prototype.PACKAGE_NAME = names.join(".");
    } else {
      Class.CLASSPATH = names.join(".");
      Class.STATIC_NAME = names[names.length - 1];
      names.splice(names.length - 1, 1);
      Class.PACKAGE_NAME = names.join(".");
    }
    return Class;
  };

  Define.clazz("qubit.Define", Define);

  /**
   * Function behaves exactly the same as `Define.clazz`, with the 
   * difference that path will be prefixed with client space namespace 
   * ("qubit.cs").
   * Utility for simple class declaration (not definition).
   * It does similiar job as namespace with addition of adding CLASS_NAME
   * and PACKAGE_NAME on prototype. It also sets SUPER to extending class
   * Class.
   * 
   * @param {String} path
   * @param {Object} Class
   * @param {Function} SuperClass
   * @param {Object} pckg
   * @param {Object} config
   * @returns {Object} the class Class
   */
  Define.clientClazz = function (path, Class, SuperClass, pckg, config) {
    return Define.clazz(
      Define.clientSpaceClasspath() + "." + path,
      Class,
      SuperClass,
      pckg,
      config);
  };
  
  Define.STANDARD_VS_NS = "qubit.vs";
  
  Define.vendorsSpaceClasspath = function (path) {
    var cp = qubit.VENDOR_SPACE_CP;
    var result = (cp === undefined || cp === null) ? Define.STANDARD_VS_NS : cp;
    
    if (path) {
      if (result) {
        return result + "." + path;
      } else {
        return path;
      }
    }
    
    return result;
  };
  
  var nsTmp = Define.vendorsSpaceClasspath();
  var _vspace;
  
  if (nsTmp) {
    _vspace = Define.namespace(nsTmp, {}, null, true).instance;
  } else {
    _vspace = Define.global();
  }
  
  Define.getVendorSpace = function () {
    return _vspace;
  };
  
  Define.vendorNamespace = function (path, instance, pckg, noOverride) {
    path = Define.vendorsSpaceClasspath(path);
    return Define.namespace(path, instance, pckg, noOverride);
  };
  
  Define.vendorClazz = function (path, Class, SuperClass, pckg, config) {
    path = Define.vendorsSpaceClasspath(path);
    return Define.clazz(path, Class, SuperClass, pckg, config);
  };
}());
