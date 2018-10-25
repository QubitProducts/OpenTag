//:import GLOBAL
//:import qubit.opentag.LibraryTag
//:import qubit.Define;
/*
 * Opentag, a tag deployment platform
 * Copyright 2013-2016, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  var LibraryTag = qubit.opentag.LibraryTag;
  var Define = qubit.Define;

  /**
   * @class qubit.Quick
   * @singleton
   *
   * #Quick is a quick reference for often used utilities.
   *
   */
  function Quick() {
  }

  /**
   * Quick `qubit.opentag.LibraryTag.define(...)` shortcut.
   * @return {undefined}
   */
  Quick.library = function () {
    return LibraryTag.define.apply(LibraryTag, arguments);
  };

  /**
   * Quick `qubit.opentag.LibraryTag.getLibraryByClasspath(...)` shortcut.
   * @return {undefined}
   */
  Quick.libraryRef = function () {
    return LibraryTag.getLibraryByClasspath.apply(
      LibraryTag.getLibraryByClasspath,
      arguments);
  };

  Define.namespace("qubit.Quick", Quick);
}());
