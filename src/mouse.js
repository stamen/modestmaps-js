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
    MM.MouseWheelHandler = function(map) {
        if (map !== undefined) {
            this.init(map);
        }
    };

    MM.MouseWheelHandler.prototype = {

        init: function(map) {
            this.map = map;
            MM.addEvent(map.parent, 'mousewheel', this.getMouseWheel());
        },

        mouseWheelHandler: null,

        getMouseWheel: function() {
            // Ensure that this handler is attached once.
            if (!this.mouseWheelHandler) {
                var theHandler = this;
                var prevTime = new Date().getTime();
                this.mouseWheelHandler = function(e) {

                    var delta = 0;
                    if (e.wheelDelta) {
                        delta = e.wheelDelta;
                    } else if (e.detail) {
                        delta = -e.detail;
                    }

                    // limit mousewheeling to once every 200ms
                    var timeSince = new Date().getTime() - prevTime;

                    if (Math.abs(delta) > 0 && (timeSince > 200)) {
                        var point = MM.getMousePoint(e, theHandler.map);
                        theHandler.map.zoomByAbout(delta > 0 ? 1 : -1, point);

                        prevTime = new Date().getTime();
                    }

                    // Cancel the event so that the page doesn't scroll
                    return MM.cancelEvent(e);
                };
            }
            return this.mouseWheelHandler;
        }
    };

    // Handle double clicks, that zoom the map in one zoom level.
    MM.DoubleClickHandler = function(map) {
        if (map !== undefined) {
            this.init(map);
        }
    };

    MM.DoubleClickHandler.prototype = {

        init: function(map) {
            this.map = map;
            MM.addEvent(map.parent, 'dblclick', this.getDoubleClick());
        },

        doubleClickHandler: null,

        getDoubleClick: function() {
            // Ensure that this handler is attached once.
            if (!this.doubleClickHandler) {
                var theHandler = this;
                this.doubleClickHandler = function(e) {
                    // Get the point on the map that was double-clicked
                    var point = MM.getMousePoint(e, theHandler.map);

                    // use shift-double-click to zoom out
                    theHandler.map.zoomByAbout(e.shiftKey ? -1 : 1, point);

                    return MM.cancelEvent(e);
                };
            }
            return this.doubleClickHandler;
        }
    };

    // Handle the use of mouse dragging to pan the map.
    MM.DragHandler = function(map) {
        if (map !== undefined) {
            this.init(map);
        }
    };

    MM.DragHandler.prototype = {

        init: function(map) {
            this.map = map;
            MM.addEvent(map.parent, 'mousedown', this.getMouseDown());
        },

        mouseDownHandler: null,

        getMouseDown: function() {
            // Ensure that this handler is attached once.
            if (!this.mouseDownHandler) {
                var theHandler = this;
                this.mouseDownHandler = function(e) {

                    MM.addEvent(document, 'mouseup', theHandler.getMouseUp());
                    MM.addEvent(document, 'mousemove', theHandler.getMouseMove());

                    theHandler.prevMouse = new MM.Point(e.clientX, e.clientY);
                    theHandler.map.parent.style.cursor = 'move';

                    return MM.cancelEvent(e);
                };
            }
            return this.mouseDownHandler;
        },

        mouseMoveHandler: null,

        getMouseMove: function() {
            // Ensure that this handler is attached once.
            if (!this.mouseMoveHandler) {
                var theHandler = this;
                this.mouseMoveHandler = function(e) {

                    if (theHandler.prevMouse) {
                        theHandler.map.panBy(
                            e.clientX - theHandler.prevMouse.x,
                            e.clientY - theHandler.prevMouse.y);
                        theHandler.prevMouse.x = e.clientX;
                        theHandler.prevMouse.y = e.clientY;
                    }

                    return MM.cancelEvent(e);
                };
            }
            return this.mouseMoveHandler;
        },

        mouseUpHandler: null,

        getMouseUp: function() {
            // Ensure that this handler is attached once.
            if (!this.mouseUpHandler) {
                var theHandler = this;
                this.mouseUpHandler = function(e) {

                    MM.removeEvent(document, 'mouseup', theHandler.getMouseUp());
                    MM.removeEvent(document, 'mousemove', theHandler.getMouseMove());

                    theHandler.prevMouse = null;
                    theHandler.map.parent.style.cursor = '';

                    return MM.cancelEvent(e);
                };
            }
            return this.mouseUpHandler;
        }
    };

    // A shortcut for adding drag, double click,
    // and mouse wheel events to the map. This is the default
    // handler attached to a map if the handlers argument isn't given.
    MM.MouseHandler = function(map) {
        if (map !== undefined) {
            this.init(map);
        }
    };

    MM.MouseHandler.prototype = {
        init: function(map) {
            this.map = map;
            new MM.DragHandler(map);
            new MM.DoubleClickHandler(map);
            new MM.MouseWheelHandler(map);
        }
    };
