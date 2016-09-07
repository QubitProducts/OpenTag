//:import qubit.Define
//:import qubit.opentag.Utils
//:import qubit.opentag.LibraryTag

/*
 * TagSDK, a tag development platform
 * Copyright 2013-2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  var Utils = qubit.opentag.Utils;
  
  /**
   * #Class representing custom tag type of a Tag. 
   * It inherits all default behaviour from LibraryTag.
   * 
   * This tag is typically used to run custom configuration tags in Opentag, 
   * it extends LibraryTag implementation and redefines it's default configuration.
   * 
   * Example of simple tag run as direct instance:
   *
        var tag = new qubit.opentag.CustomTag({
          name: "Custom Tag A"
        });
        
        tag.script = function () {
          alert("Hello World!");
        };
        
        tag.run();

   *  
   * See config properties for more details on configuration.
   * 
   * 
   * @class qubit.opentag.CustomTag
   * @extends qubit.opentag.BaseTag
   * @param config {Object} config object used to build instance
   */
  function CustomTag(config) {
    var defaults = {
      url: null,
      html: "",
      locationPlaceHolder: "NOT_END",
      locationObject: "BODY",
      async: true
    };
    
    Utils.setIfUnset(config, defaults);
    
    CustomTag.SUPER.call(this, config);
  }
  
  qubit.Define.clazz(
          "qubit.opentag.CustomTag",
          CustomTag,
          qubit.opentag.LibraryTag);
}());