/**
 * Export the api to window.uv unless required as a commonjs module.
 */
var modulePresent = false;

try {
  if (typeof module === 'object' && module.exports) {
    module.exports = createUv
    modulePresent = true
  }
} catch (ex) {
  // workaround: just catch in case browser complains for unset module prop.
}

if (!modulePresent && window) {
  window.uv = createUv()
}

function createUv () {
  /**
   * Used to prevent recursive event calling.
   *
   * @type {Array}
   */
  var emittingEvents = []

  /**
   * Creates the uv object with empty
   * events and listeners arrays.
   *
   * @type {Object}
   */
  var uv = {
    emit: emit,
    on: on,
    once: once,
    events: [],
    listeners: []
  }

  return uv

  /**
   * Pushes an event to the events array and triggers any handlers for that event
   * type, passing the data to that handler. Clones the data to prevent side effects.
   *
   * @param {String} type The type of event.
   * @param {Object} data The data associated with the event.
   */
  function emit (type, data) {
    data = clone(data || {})
    data.meta = data.meta || {}
    data.meta.type = type
    emittingEvents.push(data)
    if (emittingEvents.length === 1) {
      callHandlers(emittingEvents[0])
    }

    /**
     * Remove disposed listeners
     * to prevent memory leak.
     */
    uv.listeners = filter(uv.listeners, function (l) {
      return !l.disposed
    })
  }

  /**
   * Calls all the handlers matching an event.
   *
   * @param  {Object} event
   */
  function callHandlers (event) {
    uv.events.push(event)
    forEach(uv.listeners, function (listener) {
      if (listener.disposed) return
      if (!matches(listener.type, event.meta.type)) return
      try {
        listener.callback.call(listener.context, event)
      } catch (e) {
        if (console && console.error) {
          console.error('Error emitting UV event', e.stack)
        }
      }
    })
    emittingEvents.shift()
    if (emittingEvents.length > 0) {
      callHandlers(emittingEvents[0])
    }
  }

  /**
   * Attaches an event handler to listen to the type of event specified.
   *
   * @param   {String|Regex} type         The type of event.
   * @param   {Function}     callback     The callback called when the event occurs.
   * @param   {Object}       context      The context that will be applied to the
   *                                      callback (optional).
   *
   * @returns {Object}                    A subscription object that
   *                                      returns a dispose method.
   */
  function on (type, callback, context) {
    var listener = {
      type: type,
      callback: callback,
      disposed: false,
      context: context || window
    }
    uv.listeners.push(listener)

    var subscription = {
      replay: replay,
      dispose: dispose
    }
    return subscription

    function replay () {
      forEach(uv.events, function (event) {
        if (listener.disposed) return
        if (!matches(type, event.meta.type)) return
        callback.call(context, event)
      })
      return subscription
    }

    function dispose () {
      listener.disposed = true
      return subscription
    }
  }

  /**
   * Attaches an event handler to listen to the type of event specified.
   * The handle will only be executed once.
   *
   * @param   {String|Regex} type     The type of event.
   * @param   {Function}     callback The callback called when the event occurs.
   * @param   {Object}       context  The context that will be applied
   *                                  to the callback (optional).
   *
   * @returns {Object}                A subscription object which can off the
   *                                  handler using the dispose method.
   */
  function once (type, callback, context) {
    var subscription = uv.on(type, function () {
      callback.apply(context || window, arguments)
      subscription.dispose()
    })
    return subscription
  }

  /**
   * Iterate over each item in an array.
   *
   * @param  {Array} list
   * @param  {Function} iterator
   */
  function forEach (list, iterator) {
    var length = list.length
    for (var i = 0; i < length; i++) {
      iterator(list[i], i)
    }
  }

  /**
   * Returns a shallow clone of the input
   * object.
   * @param  {Object} input
   *
   * @return {Object}
   */
  function clone (input) {
    var output = {}
    for (var key in input) {
      if (input.hasOwnProperty(key)) {
        output[key] = input[key]
      }
    }
    return output
  }

  /**
   * Returns true if the test string matches
   * the subject or the test regex matches the subject.
   * @param  {String|Regex} test
   * @param  {String}       subject
   *
   * @return {Boolean}
   */
  function matches (test, subject) {
    return typeof test === 'string' ? test === subject : test.test(subject)
  }

  /**
   * Returns a new array containing the items in
   * array for which predicate returns true.
   * @param  {Array}   list
   * @param  {Function} iterator
   *
   * @return {Array}
   */
  function filter (list, iterator) {
    var l = list.length
    var output = []
    for (var i = 0; i < l; i++) {
      if (iterator(list[i])) output.push(list[i])
    }
    return output
  }
}
