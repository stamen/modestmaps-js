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

    MM.MouseWheelHandler = function() {
        var handler = {},
            map,
            _zoomDiv,
            prevTime,
            precise = false;

        function mouseWheel(e) {
            var delta = 0;
            prevTime = prevTime || new Date().getTime();

            try {
                _zoomDiv.scrollTop = 1000;
                _zoomDiv.dispatchEvent(e);
                delta = 1000 - _zoomDiv.scrollTop;
            } catch (error) {
                delta = e.wheelDelta || (-e.detail * 5);
            }

            // limit mousewheeling to once every 200ms
            var timeSince = new Date().getTime() - prevTime;
            var point = MM.getMousePoint(e, map);

            if (Math.abs(delta) > 0 && (timeSince > 200) && !precise) {
                map.zoomByAbout(delta > 0 ? 1 : -1, point);
                prevTime = new Date().getTime();
            } else if (precise) {
                map.zoomByAbout(delta * 0.001, point);
            }

            // Cancel the event so that the page doesn't scroll
            return MM.cancelEvent(e);
        }

        handler.init = function(x) {
            map = x;
            _zoomDiv = document.body.appendChild(document.createElement('div'));
            _zoomDiv.style.cssText = 'visibility:hidden;top:0;height:0;width:0;overflow-y:scroll';
            var innerDiv = _zoomDiv.appendChild(document.createElement('div'));
            innerDiv.style.height = '2000px';
            MM.addEvent(map.parent, 'mousewheel', mouseWheel);
            return handler;
        };

        handler.precise = function(x) {
            if (!arguments.length) return precise;
            precise = x;
            return handler;
        };

        handler.remove = function() {
            MM.removeEvent(map.parent, 'mousewheel', mouseWheel);
            _zoomDiv.parentNode.removeChild(_zoomDiv);
        };

        return handler;
    };

    MM.DoubleClickHandler = function() {
        var handler = {},
            map;

        function doubleClick(e) {
            // Ensure that this handler is attached once.
            // Get the point on the map that was double-clicked
            var point = MM.getMousePoint(e, map);
            // use shift-double-click to zoom out
            map.zoomByAbout(e.shiftKey ? -1 : 1, point);
            return MM.cancelEvent(e);
        }

        handler.init = function(x) {
            map = x;
            MM.addEvent(map.parent, 'dblclick', doubleClick);
            return handler;
        };

        handler.remove = function() {
            MM.removeEvent(map.parent, 'dblclick', doubleClick);
        };

        return handler;
    };

    // Handle the use of mouse dragging to pan the map.
    MM.DragHandler = function() {
        var handler = {},
            prevMouse,
            map;

        function mouseDown(e) {
            if (e.shiftKey || e.button == 2) return;
            MM.addEvent(document, 'mouseup', mouseUp);
            MM.addEvent(document, 'mousemove', mouseMove);

            prevMouse = new MM.Point(e.clientX, e.clientY);
            map.parent.style.cursor = 'move';

            return MM.cancelEvent(e);
        }

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
        }

        handler.init = function(x) {
            map = x;
            MM.addEvent(map.parent, 'mousedown', mouseDown);
            return handler;
        };

        handler.remove = function() {
            MM.removeEvent(map.parent, 'mousedown', mouseDown);
        };

        return handler;
    };

    MM.MouseHandler = function() {
        var handler = {},
            map,
            handlers;

        handler.init = function(x) {
            map = x;
            handlers = [
                MM.DragHandler().init(map),
                MM.DoubleClickHandler().init(map),
                MM.MouseWheelHandler().init(map)
            ];
            return handler;
        };

        handler.remove = function() {
            for (var i = 0; i < handlers.length; i++) {
                handlers[i].remove();
            }
            return handler;
        };

        return handler;
    };
