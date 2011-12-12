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
    MM.MouseWheelHandler = function(map, precise) {
        // only init() if we get a map
        if (map) {
            this.init(map, precise);
        // allow (null, true) as constructor args
        } else if (arguments.length > 1) {
            this.precise = precise ? true : false;
        }
    };

    MM.MouseWheelHandler.prototype = {
        precise: false,

        init: function(map) {
            this.map = map;
            this._mouseWheel = MM.bind(this.mouseWheel, this);

            this._zoomDiv = document.body.appendChild(document.createElement('div'));
            this._zoomDiv.style.cssText = 'visibility:hidden;top:0;height:0;width:0;overflow-y:scroll';
            var innerDiv = this._zoomDiv.appendChild(document.createElement('div'));
            innerDiv.style.height = '2000px';
            MM.addEvent(map.parent, 'mousewheel', this._mouseWheel);
        },

        remove: function() {
            MM.removeEvent(this.map.parent, 'mousewheel', this._mouseWheel);
            this._zoomDiv.parentNode.removeChild(this._zoomDiv);
        },

        mouseWheel: function(e) {
            var delta = 0;
            this.prevTime = this.prevTime || new Date().getTime();

            try {
                this._zoomDiv.scrollTop = 1000;
                this._zoomDiv.dispatchEvent(e);
                delta = 1000 - this._zoomDiv.scrollTop;
            } catch (error) {
                delta = e.wheelDelta || (-e.detail * 5);
            }

            // limit mousewheeling to once every 200ms
            var timeSince = new Date().getTime() - this.prevTime;

            if (Math.abs(delta) > 0 && (timeSince > 200) && !this.precise) {
                var point = MM.getMousePoint(e, this.map);
                this.map.zoomByAbout(delta > 0 ? 1 : -1, point);

                this.prevTime = new Date().getTime();
            } else if (this.precise) {
                var point = MM.getMousePoint(e, this.map);
                this.map.zoomByAbout(delta * 0.001, point);
            }

            // Cancel the event so that the page doesn't scroll
            return MM.cancelEvent(e);
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
            this._doubleClick = MM.bind(this.doubleClick, this);
            MM.addEvent(map.parent, 'dblclick', this._doubleClick);
        },

        remove: function() {
            MM.removeEvent(this.map.parent, 'dblclick', this._doubleClick);
        },

        doubleClick: function(e) {
            // Ensure that this handler is attached once.
            // Get the point on the map that was double-clicked
            var point = MM.getMousePoint(e, this.map);

            // use shift-double-click to zoom out
            this.map.zoomByAbout(e.shiftKey ? -1 : 1, point);

            return MM.cancelEvent(e);
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
            this._mouseDown = MM.bind(this.mouseDown, this);
            MM.addEvent(map.parent, 'mousedown', this._mouseDown);
        },

        remove: function() {
            MM.removeEvent(this.map.parent, 'mousedown', this._mouseDown);
        },

        mouseDown: function(e) {
            MM.addEvent(document, 'mouseup', this._mouseUp = MM.bind(this.mouseUp, this));
            MM.addEvent(document, 'mousemove', this._mouseMove = MM.bind(this.mouseMove, this));

            this.prevMouse = new MM.Point(e.clientX, e.clientY);
            this.map.parent.style.cursor = 'move';

            return MM.cancelEvent(e);
        },

        mouseMove: function(e) {
            if (this.prevMouse) {
                this.map.panBy(
                    e.clientX - this.prevMouse.x,
                    e.clientY - this.prevMouse.y);
                this.prevMouse.x = e.clientX;
                this.prevMouse.y = e.clientY;
                this.prevMouse.t = +new Date();
            }

            return MM.cancelEvent(e);
        },

        mouseUp: function(e) {
            MM.removeEvent(document, 'mouseup', this._mouseUp);
            MM.removeEvent(document, 'mousemove', this._mouseMove);

            this.prevMouse = null;
            this.map.parent.style.cursor = '';

            return MM.cancelEvent(e);
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
            this.handlers = [
                new MM.DragHandler(map),
                new MM.DoubleClickHandler(map),
                new MM.MouseWheelHandler(map)
            ];
        },
        remove: function() {
            for (var i = 0; i < this.handlers.length; i++) {
                this.handlers[i].remove();
            }
        }
    };
