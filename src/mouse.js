    // Event Handlers
    // --------------

    // A utility function for finding the offset of the
    // mouse from the top-left of the page
    MM.getMousePoint = function(e, map) {
        // start with just the mouse (x, y)
        var point = new MM.Point(e.clientX, e.clientY);

        // correct for scrolled document
        point.x += document.body.scrollLeft + document.documentElement.scrollLeft;
        point.y += document.body.scrollTop + document.documentElement.scrollTop;

        // correct for nested offsets in DOM
        for (var node = map.parent; node; node = node.offsetParent) {
            point.x -= node.offsetLeft;
            point.y -= node.offsetTop;
        }
        return point;
    };

    // A handler that allows mouse-wheel zooming - zooming in
    // when page would scroll up, and out when the page would scroll down.
    MM.mouseWheelHandler = function(map) {
        var handler = {},
            prevTime;

        function handler(e) {
            var delta = 0;
            prevTime = prevTime || new Date().getTime();

            if (e.wheelDelta) {
                delta = e.wheelDelta;
            } else if (e.detail) {
                delta = -e.detail;
            }

            // limit mousewheeling to once every 200ms
            var timeSince = new Date().getTime() - prevTime;

            if (Math.abs(delta) > 0 && (timeSince > 200)) {
                var point = MM.getMousePoint(e, map);
                map.zoomByAbout(delta > 0 ? 1 : -1, point);

                prevTime = new Date().getTime();
            }

            // Cancel the event so that the page doesn't scroll
            return MM.cancelEvent(e);
        }

        handler.init = function(x) {
            if (!arguments.length) return map;
            if (map) {
                MM.removeEvent(map.parent, 'mousewheel', handler);
            } else {
                map = x;
                MM.addEvent(map.parent, 'mousewheel', handler);
            }
            return handler;
        };

        if (map !== undefined) {
            handler.init(map);
        } else {
            return handler;
        }
    };

    MM.doubleClickHandler = function(map) {
        var handler = {};

        function doubleClick(e) {
            // Get the point on the map that was double-clicked
            var point = MM.getMousePoint(e, map);
            // use shift-double-click to zoom out
            map.zoomByAbout(e.shiftKey ? -1 : 1, point);
            return MM.cancelEvent(e);
        }

        handler.init = function(x) {
            map = x;
            MM.addEvent(map.parent, 'dblclick', doubleClick);
        };

        if (map !== undefined) handler.init(map);

        return handler;
    };

    // Handle the use of mouse dragging to pan the map.
    MM.dragHandler = function(map) {
        var handler = {},
            prevMouse;

        function mouseUp(e) {
            MM.removeEvent(document, 'mouseup', mouseUp);
            MM.removeEvent(document, 'mousemove', mouseMove);

            prevMouse = null;
            map.parent.style.cursor = '';

            return MM.cancelEvent(e);
        }

        function mouseMove(e) {
            if (prevMouse) {
                map.panBy(
                    e.clientX - prevMouse.x,
                    e.clientY - prevMouse.y);
                prevMouse.x = e.clientX;
                prevMouse.y = e.clientY;
                prevMouse.t = +new Date();
            }

            return MM.cancelEvent(e);
        },


        function mouseDown(e) {
            MM.addEvent(document, 'mouseup', mouseUp);
            MM.addEvent(document, 'mousemove', mouseMove);

            prevMouse = new MM.Point(e.clientX, e.clientY);
            map.parent.style.cursor = 'move';

            return MM.cancelEvent(e);
        };

        handler.init = function(x) {
            MM.addEvent(map.parent, 'mousedown', mouseDown);
        };

        if (map !== undefined) handler.init(map);

        return handler;
    };
