// namespacing!
if (!com) {
    var com = {};
}
if (!com.modestmaps) {
    com.modestmaps = {};
}

(function(MM) {

    MM.ExtentSelector = function(parent, extent) {
        this.parent = parent || document.createElement("div");
        this.initialize();
        if (extent) {
            this.setExtent(extent);
        }
        this.callbackManager = new MM.CallbackManager(this, ["extentset", "update", "draw"]);
    };

    MM.ExtentSelector.prototype = {
        // an MM.Extent instance
        extent: null,
        // if this is false, we won't allow moving the extent from the
        // center
        allowMoveCenter: true,

        // event interface
        callbackManager: null,
        addCallback: function(event, callback) {
            this.callbackManager.addCallback(event, callback);
        },
        removeCallback: function(event, callback) {
            this.callbackManager.removeCallback(event, callback);
        },
        dispatchCallback: function(event, message) {
            this.callbackManager.dispatchCallback(event, message);
        },

        // extent getter and setter
        getExtent: function() {
            return this.extent;
        },
        setExtent: function(extent) {
            this.extent = this.coerceExtent.apply(this, arguments);
            this.dispatchCallback("extentset", this.extent.copy());
            this.draw();
        },

        // coerces arguments into a Extent instance
        coerceExtent: function(extent) {
            if (extent instanceof Array) {
                return MM.Extent.fromArray(extent);
            } else {
                return extent;
            }
        },

        // set up UI elements and event dispatchers
        initialize: function() {
            this.parent.style.display = "block";
            this.parent.style.position = "absolute";
            this.parent.style.top =
                this.parent.style.left =
                this.parent.style.width =
                this.parent.style.height = "0px";

            this.handles = this.parent.appendChild(document.createElement("div"));
            this.handles.setAttribute("class", "handles");
            this.handles.style.position = "absolute";
            this.handles.style.width = this.handles.style.height = "100%";

            var names = [
                "north", "south", "east", "west",
                "northwest", "northeast", "southeast", "southwest"
            ];
            for (var i = 0; i < names.length; i++) {
                this.handles[names[i]] = this.createHandle(names[i]);
            }

            this.onHandleDown.bound = MM.bind(this.onHandleDown, this);
            MM.addEvent(this.handles, "mousedown", this.onHandleDown.bound);
        },

        // clean up event handlers
        // TODO: remove dynamically created DOM elements (handles, etc.)?
        destroy: function() {
            MM.removeEvent(this.handles, "mousedown", this.onHandleDown.bound);
        },

        /*
         * move the selector by the x and y of the supplied delta (an
         * MM.Point, presumably), optionally supplying a handle name
         * ("north", "east", "south", "west", "northeast", "northwest",
         * "southeast", "southwest").
         *
         * Returns true if the extent changed, false if not.
         */
        moveHandleBy: function(delta, name) {
            var parent = this.parent,
                top = parent.offsetTop,
                left = parent.offsetLeft,
                bottom = top + parent.offsetHeight,
                right = left + parent.offsetWidth,
                width = right - left,
                height = bottom - top;

            switch (name) {
                case "north":
                    top += delta.y;
                    break;
                case "south":
                    bottom += delta.y;
                    break;
                case "east":
                    right += delta.x;
                    break;
                case "west":
                    left += delta.x;
                    break;

                case "northwest":
                    left += delta.x;
                    top += delta.y;
                    break;
                case "northeast":
                    right += delta.x;
                    top += delta.y;
                    break;
                case "southeast":
                    right += delta.x;
                    bottom += delta.y;
                    break;
                case "southwest":
                    left += delta.x;
                    bottom += delta.y;
                    break;

                // unrecognized name: move the whole thing
                default:
                    left += delta.x;
                    right += delta.x;
                    top += delta.y;
                    bottom += delta.y;
                    break;
            }

            var x = left;
            left = Math.min(left, right);
            right = Math.max(x, right);
            width = right - left;
            var y = top;
            top = Math.min(top, bottom);
            bottom = Math.max(y, bottom);
            height = bottom - top;

            parent.style.left = left + "px";
            parent.style.width = (right - left) + "px";
            parent.style.top = top + "px";
            parent.style.height = (bottom - top) + "px";
            return true;
        },

        /*
         * This is the callback for mousedown events on the handles
         * element. It moves the specified handle
         */ 
        onHandleDown: function(e) {
            var that = this,
                handles = this.handles,
                parent = this.parent,
                target = e.srcElement || e.target,
                name = target.getAttribute("data-name"),
                map = this.map,
                pos = MM.getMousePoint(e, map);

            // if no handle name is provided and we're not allowed to move
            // the center, return early (not canceling the event)
            if (!name && !this.allowMoveCenter) {
                return;
            }

            function mousemove(e) {
                var p = MM.getMousePoint(e, map),
                    delta = new MM.Point(p.x - pos.x, p.y - pos.y);
                // console.log("moving", name || "[whole thing]", "by", [delta.x, delta.y]);

                var changed = that.moveHandleBy(delta, name);
                if (changed) {
                    that.updateExtent();
                }

                pos = p;
                return MM.cancelEvent(e);
            }

            // listen for mousemove and mouseup events on the entire document
            var scope = document;

            function mouseup(e) {
                MM.removeEvent(scope, "mousemove", mousemove);
                MM.removeEvent(scope, "mouseup", mouseup);
                return MM.cancelEvent(e);
            }

            MM.addEvent(scope, "mousemove", mousemove);
            MM.addEvent(scope, "mouseup", mouseup);

            return MM.cancelEvent(e);
        },

        // create a handle with the given name
        createHandle: function(name) {
            var handle = this.handles.appendChild(document.createElement("div"));
            handle.setAttribute("class", "handle handle-" + name);
            handle.setAttribute("data-name", name);
            handle.style.position = "absolute";
            return handle;
        },

        // show and hide the selector
        show: function() {
            this.parent.style.display = "";
        },
        hide: function() {
            this.parent.style.display = "none";
        },

        // update the screen bounds of the selector from the extent
        draw: function() {
            if (this.extent) {
                var topLeft = this.map.locationPoint(this.extent.northWest()),
                    bottomRight = this.map.locationPoint(this.extent.southEast()),
                    width = bottomRight.x - topLeft.x,
                    height = bottomRight.y - topLeft.y;
                this.parent.style.top = ~~topLeft.y + "px";
                this.parent.style.left = ~~topLeft.x + "px";
                this.parent.style.width = ~~width + "px";
                this.parent.style.height = ~~height + "px";
                this.parent.style.visibility = "visible";
            } else {
                this.parent.style.visibility = "hidden";
            }
            this.dispatchCallback("draw");
        },

        // update the geographic extent from the screen bounds
        updateExtent: function() {
            var top = this.parent.offsetTop,
                left = this.parent.offsetLeft,
                width = this.parent.offsetWidth,
                height = this.parent.offsetHeight;
            var topLeft = new MM.Point(left, top),
                bottomRight = new MM.Point(left + width, top + height),
                northWest = this.map.pointLocation(topLeft),
                southEast = this.map.pointLocation(bottomRight);
            this.extent.north = northWest.lat;
            this.extent.south = southEast.lat;
            this.extent.west = northWest.lon;
            this.extent.east = southEast.lon;
            this.dispatchCallback("extentset", this.extent.copy());
        }
    };

})(com.modestmaps);
