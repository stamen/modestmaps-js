    MM.touchHandler = function(map) {
        var handler = {},
            maxTapTime = 150,
            maxTapDistance = 10,
            maxDoubleTapDelay = 350,
            locations = {},
            coordinate = null,
            taps = [];

        // Test whether touches are from the same source -
        // whether this is the same touchmove event.
        function sameTouch(event, touch) {
            return (event && event.touch) &&
                (touch.identifier == event.touch.identifier);
        }

        // Quick euclidean distance between two points
        function distance(t1, t2) {
            return Math.sqrt(
                Math.pow(t1.screenX - t2.screenX, 2) +
                Math.pow(t1.screenY - t2.screenY, 2));
        }


        function interruptTouches(e) {
            for (var i = 0; i < e.touches.length; i += 1) {
                var t = e.touches[i];
                locations[t.identifier] = {
                    screenX: t.screenX,
                    screenY: t.screenY,
                    time: +new Date()
                };
            }
        }

        function touchStartMachine(e) {
            interruptTouches(e);
            coordinate = map.coordinate.copy();
            return MM.cancelEvent(e);
        }

        function touchMoveMachine(e) {
            var now = new Date().getTime();
            switch (e.touches.length) {
                case 1:
                    onPanning(e.touches[0]);
                    break;
                case 2:
                    onPinching(e);
                    break;
            }
            return MM.cancelEvent(e);
        }

        function touchEndMachine(e) {
            var now = new Date().getTime();

            if (e.changedTouches.length === 2) {
                onPinched(e);
            }

            // Look at each changed touch in turn.
            for (var i = 0; i < e.changedTouches.length; i += 1) {
                var t = e.changedTouches[i];
                var start = locations[t.identifier];
                if (!start) return;

                // we now know we have an event object and a
                // matching touch that's just ended. Let's see
                // what kind of event it is based on how long it
                // lasted and how far it moved.
                var time = now - start.time;
                var travel = distance(t, start);
                if (travel > maxTapDistance) {
                    // we will to assume that the drag has been handled separately
                } else if (time > maxTapTime) {
                    // close in time, but not in space: a hold
                    onHold({
                        x: t.screenX,
                        y: t.screenY,
                        end: now,
                        duration: time
                    });
                } else {
                    // close in both time and space: a tap
                    onTap({
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
            locations = {};
            return MM.cancelEvent(e);
        }


        // Handle a tap event - mainly watch for a doubleTap
        function onTap(tap) {
            if (taps.length &&
                (tap.time - taps[0].time) < maxDoubleTapDelay) {
                onDoubleTap(tap);
                return;
            }
            taps = [tap];
        }

        // Handle a double tap by zooming in a single zoom level to a
        // round zoom.
        function onDoubleTap(tap) {
            // zoom in to a round number
            var z = Math.floor(map.getZoom() + 2);
            z = z - map.getZoom();

            var p = new MM.Point(tap.x, tap.y);
            map.zoomByAbout(z, p);
        }

        // Re-transform the actual map parent's CSS transformation
        function onPanning(touch) {
            var start = locations[touch.identifier];
            map.coordinate = coordinate.copy();
            map.panBy(
                touch.screenX - start.screenX,
                touch.screenY - start.screenY);
        }

        // During a pinch event, don't recalculate zooms and centers,
        // but recalculate the CSS transformation
        function onPinching(e) {
            map.coordinate = coordinate.copy();

            map.panBy(
                ((e.touches[0].screenX +
                  e.touches[1].screenX) / 2) -
                ((locations[e.touches[0].identifier].screenX +
                  locations[e.touches[1].identifier].screenX) / 2),
                ((e.touches[0].screenY +
                  e.touches[1].screenY) / 2) -
                ((locations[e.touches[0].identifier].screenY +
                  locations[e.touches[1].identifier].screenY) / 2)
            );
            map.zoomBy(Math.log(e.scale) / Math.LN2 + coordinate.zoom - map.getZoom());
        }

        // When a pinch event ends, recalculate the zoom and center
        // of the map.
        function onPinched(touch1, touch2) {
            // TODO: easing
            if (options.snapToZoom) {
                map.setZoom(Math.round(map.getZoom()));
            }
        }

        handler.init = function(map, options) {
            map = map;
            options = options || {};

            MM.addEvent(map.parent, 'touchstart', touchStartMachine);
            MM.addEvent(map.parent, 'touchmove', touchMoveMachine);
            MM.addEvent(map.parent, 'touchend', touchEndMachine);

            snapToZoom = options.snapToZoom || true;
        };
    };
