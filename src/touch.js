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
            return {
                startCoordinate: touch.start.coordinate.copy(),
                x: touch.screenX - start.screenX,
                y: touch.screenY - start.screenY
            };
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

            return {
                // TODO: which is it, consistently?
                startCoordinate: t2_.coordinate || t1_.coordinate,
                // scale
                scale: span / span_,
                // translation along x
                x: s * -x_ + x,
                // translation along y
                y: s * -y + y
            };
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
                            coordinate: theHandler.map.coordinate.copy(),
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
            this.map.coordinate = m.startCoordinate;
            this.map.panBy(m.x, m.y);
        },

        onPanned: function(touch) {
            // var m = this.oneTouchMatrix(touch);
            // this.map.panBy(m.x, m.y]);
        },

        // During a pinch event, don't recalculate zooms and centers,
        // but recalculate the CSS transformation
        onPinching: function(touch1, touch2) {
            var m = this.twoTouchMatrix(touch1, touch2);
            this.map.coordinate = m.startCoordinate;
            // TODO: very broken, still.
            this.map.panZoom(m.x, m.y, m.startCoordinate.zoom * m.scale);
        },

        // When a pinch event ends, recalculate the zoom and center
        // of the map.
        onPinched: function(touch1, touch2) {
            // TODO: easing
            /*
            if (this.options.snapToZoom) {
                this.map.zoomBy(Math.round(z)).panBy(m[4], m[5]);
            }
            */
        }
    };
