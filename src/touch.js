    MM.TouchHandler = function(map, options) {
        if (map) {
            this.init(map, options);
        }
    };

    MM.TouchHandler.prototype = {

        maxTapTime: 250,
        maxTapDistance: 30,
        maxDoubleTapDelay: 350,
        locations: {},
        taps: [],
        wasPinching: false,
        lastPinchCenter: null,

        init: function(map, options) {
            this.map = map;
            options = options || {};

            // Fail early if this isn't a touch device.
            if (!this.isTouchable()) return false;

            this._touchStartMachine = MM.bind(this.touchStartMachine, this);
            this._touchMoveMachine = MM.bind(this.touchMoveMachine, this);
            this._touchEndMachine = MM.bind(this.touchEndMachine, this);
            MM.addEvent(map.parent, 'touchstart',
                this._touchStartMachine);
            MM.addEvent(map.parent, 'touchmove',
                this._touchMoveMachine);
            MM.addEvent(map.parent, 'touchend',
                this._touchEndMachine);

            this.options = {};
            this.options.snapToZoom = options.snapToZoom || true;
        },

        isTouchable: function() {
             var el = document.createElement('div');
             el.setAttribute('ongesturestart', 'return;');
             return (typeof el.ongesturestart === 'function');
        },

        remove: function() {
            // Fail early if this isn't a touch device.
            if (!this.isTouchable()) return false;

            MM.removeEvent(this.map.parent, 'touchstart',
                this._touchStartMachine);
            MM.removeEvent(this.map.parent, 'touchmove',
                this._touchMoveMachine);
            MM.removeEvent(this.map.parent, 'touchend',
                this._touchEndMachine);
        },

        updateTouches: function(e) {
            for (var i = 0; i < e.touches.length; i += 1) {
                var t = e.touches[i];
                if (t.identifier in this.locations) {
                    var l = this.locations[t.identifier];
                    l.x = t.screenX;
                    l.y = t.screenY;
                    l.scale = e.scale;
                }
                else {
                    this.locations[t.identifier] = {
                        scale: e.scale,
                        startPos: { x: t.screenX, y: t.screenY },
                        x: t.screenX,
                        y: t.screenY,
                        time: new Date().getTime()
                    };
                }
            }
        },

        // Test whether touches are from the same source -
        // whether this is the same touchmove event.
        sameTouch: function(event, touch) {
            return (event && event.touch) &&
                (touch.identifier == event.touch.identifier);
        },

        touchStartMachine: function(e) {
            this.updateTouches(e);
            return MM.cancelEvent(e);
        },

        touchMoveMachine: function(e) {
            switch (e.touches.length) {
                case 1:
                    this.onPanning(e.touches[0]);
                    break;
                case 2:
                    this.onPinching(e);
                    break;
            }
            this.updateTouches(e);
            this.map.fastForward = true;
            var m = this.map;
            if (typeof _touchEndMiss !== 'undefined') {
                window.clearTimeout(_touchEndMiss);
            }

            _touchEndMiss = window.setTimeout(function() {
                m.fastForward = false;
                m.draw();
            }, 100);

            return MM.cancelEvent(e);
        },

        touchEndMachine: function(e) {
            var now = new Date().getTime();
            // round zoom if we're done pinching
            if (e.touches.length === 0 && this.wasPinching) {
                this.onPinched(this.lastPinchCenter);
                this.map.fastForward = false;
                this.map.draw();
            }

            // Look at each changed touch in turn.
            for (var i = 0; i < e.changedTouches.length; i += 1) {
                var t = e.changedTouches[i],
                    loc = this.locations[t.identifier];
                // if we didn't see this one (bug?)
                // or if it was consumed by pinching already
                // just skip to the next one
                if (!loc || loc.wasPinch) {
                    continue;
                }

                // we now know we have an event object and a
                // matching touch that's just ended. Let's see
                // what kind of event it is based on how long it
                // lasted and how far it moved.
                var pos = { x: t.screenX, y: t.screenY },
                    time = now - loc.time,
                    travel = MM.Point.distance(pos, loc.startPos);
                if (travel > this.maxTapDistance) {
                    // we will to assume that the drag has been handled separately
                } else if (time > this.maxTapTime) {
                    // close in space, but not in time: a hold
                    pos.end = now;
                    pos.duration = time;
                    this.onHold(pos);
                } else {
                    // close in both time and space: a tap
                    pos.time = now;
                    this.onTap(pos);
                }
            }

            // Weird, sometimes an end event doesn't get thrown
            // for a touch that nevertheless has disappeared.
            // Still, this will eventually catch those ids:

            var validTouchIds = {};
            for (var j = 0; j < e.touches.length; j++) {
                validTouchIds[e.touches[j].identifier] = true;
            }
            for (var id in this.locations) {
                if (!(id in validTouchIds)) {
                    delete validTouchIds[id];
                }
            }

            return MM.cancelEvent(e);
        },

        onHold: function(hold) {
            // TODO
        },

        // Handle a tap event - mainly watch for a doubleTap
        onTap: function(tap) {
            if (this.taps.length &&
                (tap.time - this.taps[0].time) < this.maxDoubleTapDelay) {
                this.onDoubleTap(tap);
                this.taps = [];
                return;
            }
            this.taps = [tap];
        },

        // Handle a double tap by zooming in a single zoom level to a
        // round zoom.
        onDoubleTap: function(tap) {

            var z = this.map.getZoom(), // current zoom
                tz = Math.round(z) + 1, // target zoom
                dz = tz - z;            // desired delate
            // zoom in to a round number
            var p = new MM.Point(tap.x, tap.y);
            this.map.zoomByAbout(dz, p);
        },

        // Re-transform the actual map parent's CSS transformation
        onPanning: function(touch) {
            var pos = { x: touch.screenX, y: touch.screenY },
                prev = this.locations[touch.identifier];
            this.map.panBy(pos.x - prev.x, pos.y - prev.y);
        },

        onPinching: function(e) {
            // use the first two touches and their previous positions
            var t0 = e.touches[0],
                t1 = e.touches[1],
                p0 = new MM.Point(t0.screenX, t0.screenY),
                p1 = new MM.Point(t1.screenX, t1.screenY),
                l0 = this.locations[t0.identifier],
                l1 = this.locations[t1.identifier];

            // mark these touches so they aren't used as taps/holds
            l0.wasPinch = true;
            l1.wasPinch = true;

            // scale about the center of these touches
            var center = MM.Point.interpolate(p0, p1, 0.5);

            this.map.zoomByAbout(
                Math.log(e.scale) / Math.LN2 -
                Math.log(l0.scale) / Math.LN2,
                center );

            // pan from the previous center of these touches
            var prevCenter = MM.Point.interpolate(l0, l1, 0.5);

            this.map.panBy(center.x - prevCenter.x,
                           center.y - prevCenter.y);
            this.wasPinching = true;
            this.lastPinchCenter = center;
        },

        // When a pinch event ends, round the zoom of the map.
        onPinched: function(p) {
            // TODO: easing
            if (this.options.snapToZoom) {
                var z = this.map.getZoom(), // current zoom
                    tz = Math.round(z);     // target zoom
                this.map.zoomByAbout(tz - z, p);
            }
            this.wasPinching = false;
        }
    };
