'use strict';

var _slice = Array.prototype.slice,
    _once = function (func) {
        var ran = false, memo;
        return function () {
            if (ran) return memo;
            ran = true;
            memo = func.apply(this, arguments);
            func = null;
            return memo;
        };
    };

/**
 * Events system based on Backbone.Events
 *
 * A module that can be mixed in to *any object* in order to provide it with
 * custom events. You may bind with `on` or remove with `off` callback
 * functions to an event; `trigger`-ing an event fires all callbacks in
 * succession.
 *
 *     Backbone.js 1.1.2
 *     (c) 2010-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 *     Backbone may be freely distributed under the MIT license.
 *     For all details and documentation:
 *     http://backbonejs.org
 *
 * @constructor
 */
var EventsSystem = function Events() {
    this._events = undefined;
};

// Bind an event to a `callback` function. Passing `"all"` will bind
// the callback to all events fired.
EventsSystem.prototype.on = function (name, callback, context) {
    if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
    this._events || (this._events = {});
    var events = this._events[name] || (this._events[name] = []);
    events.push({callback: callback, context: context, ctx: context || this});
    return this;
};

// Bind an event to only be triggered a single time. After the first time
// the callback is invoked, it will be removed.
EventsSystem.prototype.once = function (name, callback, context) {
    if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
    var self = this;
    var once = _once(function () {
        self.off(name, once);
        callback.apply(this, arguments);
    });
    once._callback = callback;
    return this.on(name, once, context);
};

// Remove one or many callbacks. If `context` is null, removes all
// callbacks with that function. If `callback` is null, removes all
// callbacks for the event. If `name` is null, removes all bound
// callbacks for all events.
EventsSystem.prototype.off = function (name, callback, context) {
    if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;

    // Remove all callbacks for all events.
    if (!name && !callback && !context) {
        this._events = undefined;
        return this;
    }

    var names;
    if (name) {
        names = [name];
    } else {
        throw new Error('Argument "name" hasnt passed');
    }

    for (var i = 0, length = names.length; i < length; i++) {
        name = names[i];

        // Bail out if there are no events stored.
        var events = this._events[name];
        if (!events) continue;

        // Remove all callbacks for this event.
        if (!callback && !context) {
            delete this._events[name];
            continue;
        }

        // Find any remaining events.
        var remaining = [];
        for (var j = 0, k = events.length; j < k; j++) {
            var event = events[j];
            if (
                callback && callback !== event.callback &&
                callback !== event.callback._callback ||
                context && context !== event.context
                ) {
                remaining.push(event);
            }
        }

        // Replace events if there are any remaining.  Otherwise, clean up.
        if (remaining.length) {
            this._events[name] = remaining;
        } else {
            delete this._events[name];
        }
    }

    return this;
};

// Trigger one or many events, firing all bound callbacks. Callbacks are
// passed the same arguments as `trigger` is, apart from the event name
// (unless you're listening on `"all"`, which will cause your callback to
// receive the true name of the event as the first argument).
EventsSystem.prototype.trigger = function (name) {
    if (!this._events) return this;
    var args = _slice.call(arguments, 1);
    if (!eventsApi(this, 'trigger', name, args)) return this;
    var events = this._events[name];
    var allEvents = this._events.all;
    if (events) this.triggerEvents(events, args);
    if (allEvents) this.triggerEvents(allEvents, arguments);
    return this;
};

// A difficult-to-believe, but optimized internal dispatch function for
// triggering events. Tries to keep the usual cases speedy (most internal
// Backbone events have 3 arguments).
EventsSystem.prototype.triggerEvents = function (events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
        case 0:
            while (++i < l) (ev = events[i]).callback.call(ev.ctx);
            return;
        case 1:
            while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1);
            return;
        case 2:
            while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2);
            return;
        case 3:
            while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3);
            return;
        default:
            while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
            return;
    }
};

// Regular expression used to split event strings.
var eventSplitter = /\s+/;

// Implement fancy features of the Events API such as multiple event
// names `"change blur"` and jQuery-style event maps `{change: action}`
// in terms of the existing API.
var eventsApi = function (obj, action, name, rest) {
    if (!name) return true;

    // Handle event maps.
    if (typeof name === 'object') {
        for (var key in name) {
            //noinspection JSUnfilteredForInLoop
            obj[action].apply(obj, [key, name[key]].concat(rest));
        }
        return false;
    }

    // Handle space separated event names.
    if (eventSplitter.test(name)) {
        var names = name.split(eventSplitter);
        for (var i = 0, length = names.length; i < length; i++) {
            obj[action].apply(obj, [names[i]].concat(rest));
        }
        return false;
    }

    return true;
};

exports.EventsSystem = EventsSystem;