    MM.TouchHandler = function() { };

    MM.TouchHandler.prototype = {

        maxTapTime: 150,
        maxTapDistance: 10,
        maxDoubleTapDelay: 350,
        events: [],
        taps: [],

        init: function(map, options) {
            this.map = map;
            options = options || {};
            MM.addEvent(map.parent, 'touchstart', this.getTouchStartMachine());
            MM.addEvent(map.parent, 'touchmove', this.getTouchMoveMachine());
            MM.addEvent(map.parent, 'touchend', this.getTouchEndMachine());

            this.options = {};
            this.options.snapToZoom = options.snapToZoom || true;
        },

        // Essentially the entry point for touches to this control -
        // on an event, store the touches in the `events` array, one per touch.
        //
        // * TODO: this may be storing `events` as a global
        interruptTouches: function(events) {
            var now = new Date().getTime();
            for (var i = 0; i < events.length; i += 1) {
                var touch = events[i].touch;
                events[i] = {
                    screenX: touch.screenX,
                    screenY: touch.screenY,
                    touch: touch,
                    time: now,
                    start: null,
                    count: 0,
                    travel: 0
                };
                events[i].start = events[i];
            }
        },

        // Test whether touches are from the same source -
        // whether this is the same touchmove event.
        sameTouch: function(event, touch) {
            return (event && event.touch) &&
                (touch.identifier == event.touch.identifier);
        },

        // Quick euclidean distance between two points
        distance: function(t1, t2) {
            return Math.sqrt(
                Math.pow(t1.screenX - t2.screenX, 2) +
                Math.pow(t1.screenY - t2.screenY, 2));
        },

        // Generate a CSS transformation matrix from
        // one touch event.
        oneTouchMatrix: function(touch) {
            var start = touch.start;
            var x = touch.screenX - start.screenX;
            var y = touch.screenY - start.screenY;

            return [1, 0, 0, 1, x, y];
        },

        // Generate a CSS transformation matrix from
        // two touch events.
        twoTouchMatrix: function(t1, t2) {
            var t1_ = t1.start,
                t2_ = t2.start;

            var span =  this.distance(t1, t2),
                span_ = this.distance(t1_, t2_);

            var s = span / span_;

            var x = (t1.screenX + t2.screenX) / 2,
                y = (t1.screenY + t2.screenY) / 2;

            var x_ = (t1_.screenX + t2_.screenX) / 2,
                y_ = (t1_.screenY + t2_.screenY) / 2;

            var tx = s * -x_ + x,
                ty = s * -y_ + y;

            return [
                // scale
                s,
                // identity values
                0,
                0,
                // scale
                s,
                // translation along x
                tx,
                // translation along y
                ty
            ];
        },

        getTouchStartMachineHandler: null,

        getTouchStartMachine: function() {
            if (!this.getTouchStartMachineHandler) {
                var theHandler = this;
                var events = this.events;

                this.getTouchStartMachineHandler = function(e) {
                    theHandler.interruptTouches(events);

                    for (var i = 0; i < e.changedTouches.length; i += 1) {
                        var touch = e.changedTouches[i];
                        var newEvent = {
                            screenX: touch.screenX,
                            screenY: touch.screenY,
                            touch: touch,
                            time: new Date().getTime(),
                            start: null,
                            count: 0,
                            travel: 0
                        };
                        newEvent.start = newEvent;
                        events.push(newEvent);
                    }
                    return MM.cancelEvent(e);
                };
            }
            return this.getTouchStartMachineHandler;
        },

        getTouchStartMachineHandler: null,

        getTouchMoveMachine: function() {
            if (!this.getTouchMoveMachineHandler) {
                var theHandler = this;
                var events = this.events;

                this.getTouchMoveMachineHandler = function(e) {
                    var now = new Date().getTime();

                    // Look at each changed touch in turn.
                    for (var i = 0, touch = e.changedTouches[i];
                        i < e.changedTouches.length; i += 1) {
                        for (var j = 0; j < events.length; j += 1) {
                            if (theHandler.sameTouch(events[j], touch)) {
                                var newEvent = {
                                    screenX: touch.screenX,
                                    screenY: touch.screenY,
                                    touch: touch,
                                    time: now,
                                    start: null,
                                    count: events[j].count + 1,
                                    travel: events[j].travel +
                                        theHandler.distance(touch, events[j])
                                };
                                // Set a reference to the previous touch
                                newEvent.start = events[j].start;
                                events[j] = newEvent;
                            }
                        }
                    }

                    if (events.length === 1) {
                        theHandler.onPanning(events[0]);
                    } else if (events.length === 2) {
                        theHandler.onPinching(events[0], events[1]);
                    }

                    return MM.cancelEvent(e);
                };
            }
            return this.getTouchMoveMachineHandler;
        },

        getTouchEndMachineHandler: null,

        getTouchEndMachine: function() {
            if (!this.getTouchEndMachineHandler) {
                var theHandler = this;
                var events = this.events;

                this.getTouchEndMachineHandler = function(e) {
                    var now = new Date().getTime();

                    if (events.length === 1) {
                        theHandler.onPanned(events[0]);
                    } else if (events.length === 2) {
                        theHandler.onPinched(events[0], events[1]);
                    }

                    // Look at each changed touch in turn.
                    for (var i = 0; i < e.changedTouches.length; i += 1) {
                        var touch = e.changedTouches[i];

                        for (var j = 0; j < events.length; j += 1) {
                            if (theHandler.sameTouch(events[j], touch)) {
                                var event = {
                                    screenX: touch.screenX,
                                    screenY: touch.screenY,
                                    touch: touch,
                                    time: now,
                                    // pointer chase
                                    start: events[j].start,
                                    count: events[j].count + 1,
                                    travel: events[j].travel +
                                        theHandler.distance(touch, events[j]),
                                    last: events[j]
                                };
                                // Remove the event
                                events.splice(j, 1);
                                j -= 1;

                                // we now know we have an event object and a
                                // matching touch that's just ended. Let's see
                                // what kind of event it is based on how long it
                                // lasted and how far it moved.
                                var time = now - event.start.time;
                                if (event.travel > theHandler.maxTapDistance) {
                                    // we will to assume that the drag has been handled separately
                                } else if (time > theHandler.maxTapTime) {
                                    // close in time, but not in space: a hold
                                    theHandler.onHold({
                                        x: touch.screenX,
                                        y: touch.screenY,
                                        end: now,
                                        duration: time
                                    });
                                } else {
                                    // close in both time and space: a tap
                                    theHandler.onTap({
                                        x: touch.screenX,
                                        y: touch.screenY,
                                        time: now
                                    });
                                }
                            }
                        }
                    }

                    theHandler.interruptTouches(events);

                    if (e.touches.length === 0 && events.length >= 1) {
                        // Weird, sometimes an end event doesn't get thrown
                        // for a touch that nevertheless has disappeared.
                        events.splice(0, events.length);
                    }
                    return MM.cancelEvent(e);
                };
            }
            return this.getTouchEndMachineHandler;
        },

        onHold: function(hold) {
            // TODO
        },

        // Handle a tap event - mainly watch for a doubleTap
        onTap: function(tap) {
            if (this.taps.length &&
                (tap.time - this.taps[0].time) < this.maxDoubleTapDelay) {
                this.onDoubleTap(tap);
                return;
            }
            this.taps = [tap];
        },

        // Handle a double tap by zooming in a single zoom level to a
        // round zoom.
        onDoubleTap: function(tap) {
            // zoom in to a round number
            var z = Math.floor(this.map.getZoom() + 2);
            z = z - this.map.getZoom();

            var p = new MM.Point(tap.x, tap.y);
            this.map.zoomByAbout(z, p);
        },

        // Re-transform the actual map parent's CSS transformation
        onPanning: function(touch) {
            var m = this.oneTouchMatrix(touch);
            // http://www.w3.org/TR/css3-3d-transforms/#transform-functions
            // `matrix(a,b,c,d,e,f)` is equivalent to
            // `matrix3d(a, b, 0, 0, c, d, 0, 0, 0, 0, 1, 0, e, f, 0, 1)`
            /*
            m = [
                '1', '0', '0', '0', '0', '1', '0', '0', '0', '0', '1', '0',
                m[4].toFixed(0), m[5].toFixed(0), '0', '1'
            ];
            m = 'matrix3d(' + m.join(', ') + ')';
            */

            this.map.panBy(m[4], m[5]);
            // this.map.parent.style.webkitTransformOrigin = '0px 0px';
            // this.map.parent.style.webkitTransform = m;
        },

        onPanned: function(touch) {
            var m = this.oneTouchMatrix(touch);
            this.map.panBy(m[4], m[5]);
            // this.map.parent.style.webkitTransform = '';
        },

        // During a pinch event, don't recalculate zooms and centers,
        // but recalculate the CSS transformation
        onPinching: function(touch1, touch2) {
            var m = this.twoTouchMatrix(touch1, touch2);
            // http://www.w3.org/TR/css3-3d-transforms/#transform-functions
            // `matrix(a,b,c,d,e,f)` is equivalent to
            // `matrix3d(a, b, 0, 0, c, d, 0, 0, 0, 0, 1, 0, e, f, 0, 1)`
            m = [
                m[0].toFixed(3), '0', '0', '0', '0', m[3].toFixed(3),
                '0', '0', '0', '0', '1', '0',
                m[4].toFixed(0), m[5].toFixed(0),
                '0', '1'
            ];
            m = 'matrix3d(' + m.join(', ') + ')';

            this.map.parent.style.webkitTransformOrigin = '0px 0px';
            this.map.parent.style.webkitTransform = m;
        },

        // When a pinch event ends, recalculate the zoom and center
        // of the map.
        onPinched: function(touch1, touch2) {
            var m = this.twoTouchMatrix(touch1, touch2);
            var z = Math.log(m[0]) / Math.log(2);
            var p = new MM.Point(0, 0);

            // TODO: easing
            if (this.options.snapToZoom) {
                this.map.zoomBy(Math.round(z)).panBy(m[4], m[5]);
            } else {
                this.map.zoomByAbout(z, p).panBy(m[4], m[5]);
            }

            this.map.parent.style.webkitTransform = '';
        }
    };
