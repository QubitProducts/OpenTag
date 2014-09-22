/**
 * @author Peter Fronc <peter.fronc@qubitdigital.com>
 */
(function () {
  /**
   * Bind function should be already native in most browsers.
   * If not, we must use very basic replacement here.
   * We may inject recommended by:
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference
   * /Global_Objects/Function/bind
   * Template, but for now it will stay simple.
   * It is recommended that you pass specific arguments using closures.
   * 
   * @param {Object} ctx
   * @returns {Function} scoped function
   */
  Function.prototype.bind = Function.prototype.bind || function (ctx) {
    var _this = this;
    return function () {
      return _this.apply(ctx, arguments);
    };
  };
}());
