/**
 * @author Peter Fronc <peter.fronc@qubitdigital.com>
 */
(function () {
  /** 
   * @class qubit.compat.Function
   * @static
   * @private
   * 
   * #Function compatibility check class.
   * This object is UNSET and exists only for compatibility check of browser.
   * It checks status of bind method and applies Mozilla recommended fix.
   * It applies only for very old browsers where `Function.prototype.bind` is
   * not present.
   * 
   * Recommended by:
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference
   * /Global_Objects/Function/bind
   * 
   */
  if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
      if (typeof this !== 'function') {
        // closest thing possible to the ECMAScript 5
        // internal IsCallable function
        throw new TypeError('Function.prototype.bind - what is trying ' +
                'to be bound is not callable');
      }

      var aArgs = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        FNOP = function () {},
        fBound = function () {
          return fToBind.apply(this instanceof FNOP ? this : oThis,
            aArgs.concat(Array.prototype.slice.call(arguments)));
        };

      FNOP.prototype = this.prototype;
      fBound.prototype = new FNOP();

      return fBound;
    };
  }
}());
