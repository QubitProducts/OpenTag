//:include qubit/Define.js
//:include qubit/opentag/Log.js

/*
 * TagSDK, a tag development platform
 * Copyright 2013-2014, Qubit Group
 * http://opentag.qubitproducts.com
 * Author: Peter Fronc <peter.fronc@qubitdigital.com>
 */

(function () {
  var log = new qubit.opentag.Log("Timer -> ");

  /**
   * #Timer implementation.
   * 
   * Timer is intended to replace (wrap) the setTimeout
   * method so over/misuse of `setTiemout`method can be controlled. 
   * It supports rate and runtime runtime adjustment (slowing down etc.).
   * 
   * Interesting option for this timer is `dynamic` config property, if it
   * is set to true timer will be using intelligent timing adjustment for 
   * checking the execution stack (array where all timed out functions reside
   * with time assigned). For example, if there is function timed to be run
   * after 1000ms, timer will be checking stack around 1000ms later to run 
   * ready functions, if there was another function with 200ms delay, timer 
   * will check every 200ms if there is anything timed out in stack and so on
   * till stack is empty.
   * 
   * Dynamic option is much more lighter but less accurate.
   * 
   * See the PAI for more details and other functions.
   * 
   * 
   * @class qubit.opentag.Timer
   * @param {Object} config
   * @returns {qubit.opentag.Timer}
   */
  function Timer(config) {
    if (config) {
      log.FINEST("Config:");
      log.FINEST(config, true);
     /**
      * @private
      * Please use setRate to update timers rate
      * @type Number
      */
      this._rate = config.rate || 10;
      this._smallestRate = -1;
      if (config.start) {
        this.startPooling();
      }
      this.config = config;
    }
    this.inervals = [];
    this._lck_obj = {};
    this._binded_pool = this._pool.bind(this);
  }

  qubit.Define.clazz("qubit.opentag.Timer", Timer); 

  /**
   * @property [Array] timers
   * Array of pairs `{Date, Function}`
   * `Date` stands for timed out date.
   * `Function` is a function refernece to call.
   */
  Timer.prototype.timers = [];

  /**
   * Function starts pooling.
   * @param smallestRate {Number} optional smallest rate argument, it will 
   *  be used as temporal rate if dynamic option is set on timer and not 
   *  smaller than minimal rate set on timer
   */
  Timer.prototype.startPooling = function (smallestRate) {
    if (smallestRate && this.config.dynamic) {
      if (this._smallestRate < 0 || this._smallestRate > smallestRate) {
        // @TODO in futurewe can add more precise instrument than estimate
        this._smallestRate = Math.min(Math.floor(smallestRate / 2), 1500);
      }
    }
    if (!this.started) {
      this.started = true;
      setTimeout(this._binded_pool, 0);
    }
  };

  /**
   * @private
   * Pooling function.
   * Strictly private.
   */
  Timer.prototype._pool = function () {
    this.maxFrequent(function () {
      var name = "";
      if (this.config && this.config.name) {
        name = "[" + this.config.name + "]";
      }
      log.FINEST(name + "Pooling in progress...");
    }, 5000, this._lck_obj);

    this.callTimers();

    if (this.timers.length !== 0) {
      var rate = (this._smallestRate > this._rate) ?
                          this._smallestRate : this._rate;
      setTimeout(this._binded_pool, rate);
    } else {
      this.started = false;
      this._smallestRate = -1;
    }
  };

  /**
   * Worker clearing outdated timers. Used internally.
   * May be also called to manually to validate timers.
   */
  Timer.prototype.callTimers = function () {
    this.lastCalled = new Date().valueOf();
    for (var i = 0; i < this.timers.length; i++) {
      var timer = this.timers[i];
      var stamp = new Date().valueOf();
      if (stamp >= timer.time) {
        try {
          timer.execute();
        } catch (e) {
          log.ERROR("Error calling timer: " + e);
        }
        this.timers.splice(i, 1);
        --i;
      }
    }
  };

  /**
   * Clear execution stack.
   * It will remove any existing timeouts.
   */
  Timer.prototype.cancellAll = function () {
    this.timers = [];
    log.WARN("Cancelling all stack.");
  };

  /**
   * Function setting maximum interval time for this instance clock.
   * All setTiemout and setInterval will be no more often run than rate value.
   * @param {Number} time ms
     */
  Timer.prototype.setRate = function (time) {
    this._rate = time;
  };

  /**
   * Function letting running `fun` argument no more often than `time` 
   * property. **It does not warranty execution** - if function is recognised
   * to be called too early - it will be not run.
   * 
   * If `lockObj` is unset `fun.__maxFrequent__timer_opentag_qubit_` property
   *  will be used - notice that this lock will be shared with other calls 
   *  on this `fun` instance if `lockObj` is not provided, to ensure it does 
   *  not happen use a plain object instance or create separate instance of 
   *  timer for each frequent callers.
   * 
   * Typically, lock object will be a private property dedicated for a 
   * frequent calling block.
   * 
   * @param {Function} fun Function to be run
   * @param {Number} time in ms
   * @param {Object} lockObj lock object
   */
  Timer.prototype.maxFrequent = function (fun, time, lockObj) {
    if (!lockObj) {
      fun.__maxFrequent__timer_opentag_qubit_ = 
              fun.__maxFrequent__timer_opentag_qubit_ || {};
      lockObj = fun.__maxFrequent__timer_opentag_qubit_;
    }
    var last = lockObj.____last__timed__max__frequent____;

    if (!last || (new Date().valueOf() - last) > time) {
      last = new Date().valueOf();
      lockObj.____last__timed__max__frequent____ = last;
      fun();
    }
  };

  /**
   * Function that does not allow to run processes too often.
   * It works similarry to `maxFrequent` with that difference that if call is
   * detected too early it will not reject it but schedule to be run at 
   * nearest available time. **If function was already scheduled to run soon - 
   * it will not be scheduled.**
   * @param {Function} fun Function to be run.
   * @param {Number} time No more often then `time` in ms.
   * @param {Object} lockObj Lock object (empty object used as a lock)
   * @returns {Boolean} True if function was run immediately.
   */
  Timer.prototype.runIfNotScheduled = function (fun, time, lockObj) {
    if (lockObj.__lastRun__ &&
          (new Date().valueOf() < (time + lockObj.__lastRun__))) {
      return this.schedule(fun, time, lockObj);
    } else {
      lockObj.__lastRun__ = new Date().valueOf();
      fun();
      return true;
    }
  };

  /**
   * Scheduler that schedules only if not already scheduled.
   * @param {Function} fun
   * @param {Number} time
   * @param {Object} lockObj Lock object (empty object used as a lock)
   * @returns {Boolean} false only lockObject indicate function is already 
   * scheduled
   */
  Timer.prototype.schedule = function (fun, time, lockObj) {
    if (lockObj.___scheduled___)  {
      return false;
    } else {
      lockObj.___scheduled___ = new Date().valueOf();
      this.setTimeout(function () {
        lockObj.___scheduled___ = false;
        lockObj.__lastRun__ = new Date().valueOf();
        fun();
      }, time);
      return true;
    }
  };

  var ids = 1;
  /**
   * Set timeout method.
   * Run `call' function after minimum of `time` in miliseconds.
   * It wraps standard setTimeout so all calls can be controlled in one place.
   * @param {Function} call Function callback.
   * @param {Number} time Tiemout value in miliseconds.
   * @returns {Object} timer object (POJO)
   */
  Timer.prototype.setTimeout = function (call, time) {
    var timer = {
      id: ids++,
      time: new Date().valueOf() + (+time),
      execute: call
    };
    this.timers.push(timer);
    this.startPooling(time);
    return timer;
  };

  /**
   * Set interval method.
   * Run `call' function every minimum of `time` in miliseconds.
   * @param {Function} call Function callback.
   * @param {Number} time Interval value in miliseconds.
   * @returns {Object} setInterval return
   */
  Timer.prototype.setInterval = function (call, time) {
    log.FINEST("Native wrapper");
    var interv =  setInterval(call, time);
    this.inervals.push(interv);
    return interv;
  };
})();

