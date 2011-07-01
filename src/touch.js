    MM.TouchHandler = function() { };

    MM.TouchHandler.prototype = {

        maxTapTime: 150,
        maxTapDistance: 10,
        maxDoubleTapDelay: 350,
        locations: {},
        coordinate: null,
        taps: [],

        init: function(map, options) {
            this.map = map;
            options = options || {};
            MM.addEvent(map.parent, 'touchstart',
                MM.bind(this.touchStartMachine, this));
            MM.addEvent(map.parent, 'touchmove',
                MM.bind(this.touchMoveMachine, this));
            MM.addEvent(map.parent, 'touchend',
                MM.bind(this.touchEndMachine, this));

            this.options = {};
            this.options.snapToZoom = options.snapToZoom || true;
        },

        interruptTouches: function(e) {
            for (var i = 0; i < e.touches.length; i += 1) {
                var t = e.touches[i];
                this.locations[t.identifier] = {
                    screenX: t.screenX,
                    screenY: t.screenY,
                    time: +new Date()
                };
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
        // two touch events.
        twoTouchMatrix: function(t1, t2) {
            var t1_ = this.locations[t1.identifier],
                t2_ = this.locations[t2.identifier],
                span =  this.distance(t1, t2),
                span_ = this.distance(t1_, t2_),
                s = span / span_,
                x = (t1.screenX + t2.screenX) / 2,
                y = (t1.screenY + t2.screenY) / 2,
                x_ = (t1_.screenX + t2_.screenX) / 2,
                y_ = (t1_.screenY + t2_.screenY) / 2;

            return {
                scale: span / span_,
                x: s * -x_ + x, // translation along x
                y: s * -y + y // translation along y
            };
        },

        touchStartMachine: function(e) {
            this.interruptTouches(e);
            this.coordinate = this.map.coordinate.copy();
            return MM.cancelEvent(e);
        },

        touchMoveMachine: function(e) {
            var now = new Date().getTime();
            switch (e.touches.length) {
                case 1:
                    this.onPanning(e.touches[0]);
                    break;
                case 2:
                    this.onPinching(e.touches[0], e.touches[1]);
                    break;
            }
            return MM.cancelEvent(e);
        },

        touchEndMachine: function(e) {
            var now = new Date().getTime();

            // Look at each changed touch in turn.
            for (var i = 0; i < e.changedTouches.length; i += 1) {
                var t = e.changedTouches[i];
                var start = this.locations[t.identifier];

                // we now know we have an event object and a
                // matching touch that's just ended. Let's see
                // what kind of event it is based on how long it
                // lasted and how far it moved.
                var time = now - start.time;
                var travel = this.distance(t, start)
                if (travel > this.maxTapDistance) {
                    // we will to assume that the drag has been handled separately
                } else if (time > this.maxTapTime) {
                    // close in time, but not in space: a hold
                    this.onHold({
                        x: t.screenX,
                        y: t.screenY,
                        end: now,
                        duration: time
                    });
                } else {
                    // close in both time and space: a tap
                    this.onTap({
                        x: t.screenX,
                        y: t.screenY,
                        time: now
                    });
                }
            }

            // this.interruptTouches(events);

            // Weird, sometimes an end event doesn't get thrown
            // for a touch that nevertheless has disappeared.
            // TODO
            // if (e.touches.length === 0 && events.length >= 1) {
            //     events.splice(0, events.length);
            // }
            this.locations = {};
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
            var start = this.locations[touch.identifier];
            this.map.coordinate = this.coordinate.copy();
            this.map.panBy(
                touch.screenX - start.screenX,
                touch.screenY - start.screenY);
        },

        onPanned: function(touch) {
            // var m = this.oneTouchMatrix(touch);
            // this.map.panBy(m.x, m.y]);
        },

        // During a pinch event, don't recalculate zooms and centers,
        // but recalculate the CSS transformation
        onPinching: function(touch1, touch2) {
            var m = this.twoTouchMatrix(touch1, touch2);
            this.map.coordinate = this.coordinate.copy();
            // TODO: very broken, still.
            this.map.panZoom(m.x, m.y, this.coordinate.zoom * m.scale);
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
