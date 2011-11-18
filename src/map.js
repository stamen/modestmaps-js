
    // Map

    // Instance of a map intended for drawing to a div.
    //
    //  * `parent` (required DOM element)
    //      Can also be an ID of a DOM element
    //  * `providers` (required MapProvider or array)
    //      Provides tile URLs and map projections, can be an array of providers.
    //  * `dimensions` (optional Point)
    //      Size of map to create
    //  * `eventHandlers` (optional Array)
    //      If empty or null MouseHandler will be used
    //      Otherwise, each handler will be called with init(map)
    MM.Map = function(parent, providers, dimensions, eventHandlers) {

        if (typeof parent == 'string') {
            parent = document.getElementById(parent);
            if (!parent) {
                throw 'The ID provided to modest maps could not be found.';
            }
        }
        this.parent = parent;

        // we're no longer adding width and height to parent.style but we still
        // need to enforce padding, overflow and position otherwise everything screws up
        // TODO: maybe console.warn if the current values are bad?
        this.parent.style.padding = '0';
        this.parent.style.overflow = 'hidden';

        var position = MM.getStyle(this.parent, 'position');
        if (position != 'relative' && position != 'absolute') {
            this.parent.style.position = 'relative';
        }

        this.layers = [];
        
        if(providers instanceof Array) {
            // we were actually passed a list of providers
            for(var i = 0; i < providers.length; i++) {
                this.layers.push(new MM.Layer(this, providers[i]));
            }
        } else {
            // we were probably passed a single provider
            this.layers.push(new MM.Layer(this, providers));
        }
        
        // the first provider in the list gets to decide about projections and geometry
        this.provider = this.layers[0].provider;

        this.coordinate = new MM.Coordinate(0.5, 0.5, 0);

        // if you don't specify dimensions we assume you want to fill the parent
        // unless the parent has no w/h, in which case we'll still use a default
        if (!dimensions) {
            dimensions = new MM.Point(
                this.parent.offsetWidth,
                this.parent.offsetHeight);
            this.autoSize = true;
            var theMap = this;
            // use destroy to get rid of this handler from the DOM            
            MM.addEvent(window, 'resize', this.windowResize());
        }
        else {
            this.autoSize = false;
            this.parent.style.width = Math.round(dimensions.x) + 'px';
            this.parent.style.height = Math.round(dimensions.y) + 'px';
        }

        this.dimensions = dimensions;
        
        this.enablePyramidLoading = false;

        this.callbackManager = new MM.CallbackManager(this, [
            'zoomed',
            'panned',
            'centered',
            'extentset',
            'resized',
            'drawn'
        ]);

        // set up handlers last so that all required attributes/functions are in place if needed
        if (eventHandlers === undefined) {
            this.eventHandlers = [];
            this.eventHandlers.push(new MM.MouseHandler(this));
        } else {
            this.eventHandlers = eventHandlers;
            if (eventHandlers instanceof Array) {
                for (var i = 0; i < eventHandlers.length; i++) {
                    eventHandlers[i].init(this);
                }
            }
        }

    };

    MM.Map.prototype = {

        parent: null,
        provider: null,
        dimensions: null,
        coordinate: null,

    
        levels: null,
        layers: null,
    
        callbackManager: null,        

        eventHandlers: null,
        
        autoSize: null,

        toString: function() {
            return 'Map(#' + this.parent.id + ')';
        },
        
        // callbacks...

        addCallback: function(event, callback) {
            this.callbackManager.addCallback(event, callback);
            return this;
        },

        removeCallback: function(event, callback) {
            this.callbackManager.removeCallback(event, callback);
            return this;
        },

        dispatchCallback: function(event, message) {
            this.callbackManager.dispatchCallback(event, message);
            return this;
        },

        windowResize: function() {
            if (!this._windowResize) {
                var theMap = this;
                this._windowResize = function(event) {
                    // don't call setSize here because it sets parent.style.width/height
                    // and setting the height breaks percentages and default styles
                    theMap.dimensions = new MM.Point(theMap.parent.offsetWidth, theMap.parent.offsetHeight);
                    theMap.draw();
                    theMap.dispatchCallback('resized', [theMap.dimensions]);
                };
            }
            return this._windowResize;
        },

        // zooming
        zoomBy: function(zoomOffset) {
            this.coordinate = this.enforceLimits(this.coordinate.zoomBy(zoomOffset));
            MM.getFrame(this.getRedraw());
            this.dispatchCallback('zoomed', zoomOffset);
            return this;
        },

        zoomIn: function()  { return this.zoomBy(1); },
        zoomOut: function()  { return this.zoomBy(-1); },
        setZoom: function(z) { return this.zoomBy(z - this.coordinate.zoom); },

        zoomByAbout: function(zoomOffset, point) {
            var location = this.pointLocation(point);

            this.coordinate = this.enforceLimits(this.coordinate.zoomBy(zoomOffset));
            var newPoint = this.locationPoint(location);

            this.dispatchCallback('zoomed', zoomOffset);
            return this.panBy(point.x - newPoint.x, point.y - newPoint.y);
        },

        // panning
        panBy: function(dx, dy) {
            this.coordinate.column -= dx / this.provider.tileWidth;
            this.coordinate.row -= dy / this.provider.tileHeight;

            this.coordinate = this.enforceLimits(this.coordinate);

            // Defer until the browser is ready to draw.
            MM.getFrame(this.getRedraw());
            this.dispatchCallback('panned', [dx, dy]);
            return this;
        },

        /*
        panZoom: function(dx, dy, zoom) {
            this.coordinate.column -= dx / this.provider.tileWidth;
            this.coordinate.row -= dy / this.provider.tileHeight;
            this.coordinate = this.coordinate.zoomTo(zoom);

            // Defer until the browser is ready to draw.
            MM.getFrame(this.getRedraw());
            this.dispatchCallback('panned', [dx, dy]);
            return this;
        },
        */

        panLeft: function() { return this.panBy(100, 0); },
        panRight: function() { return this.panBy(-100, 0); },
        panDown: function() { return this.panBy(0, -100); },
        panUp: function() { return this.panBy(0, 100); },

        // positioning
        setCenter: function(location) {
            return this.setCenterZoom(location, this.coordinate.zoom);
        },

        setCenterZoom: function(location, zoom) {
            this.coordinate = this.provider.locationCoordinate(location).zoomTo(parseFloat(zoom) || 0);
            MM.getFrame(this.getRedraw());
            this.dispatchCallback('centered', [location, zoom]);
            return this;
        },

        setExtent: function(locations, any) {

            var TL, BR;
            for (var i = 0; i < locations.length; i++) {
                var coordinate = this.provider.locationCoordinate(locations[i]);
                if (TL) {
                    TL.row = Math.min(TL.row, coordinate.row);
                    TL.column = Math.min(TL.column, coordinate.column);
                    TL.zoom = Math.min(TL.zoom, coordinate.zoom);
                    BR.row = Math.max(BR.row, coordinate.row);
                    BR.column = Math.max(BR.column, coordinate.column);
                    BR.zoom = Math.max(BR.zoom, coordinate.zoom);
                }
                else {
                    TL = coordinate.copy();
                    BR = coordinate.copy();
                }
            }

            var width = this.dimensions.x + 1;
            var height = this.dimensions.y + 1;

            // multiplication factor between horizontal span and map width
            var hFactor = (BR.column - TL.column) / (width / this.provider.tileWidth);

            // multiplication factor expressed as base-2 logarithm, for zoom difference
            var hZoomDiff = Math.log(hFactor) / Math.log(2);

            // possible horizontal zoom to fit geographical extent in map width
            var hPossibleZoom = TL.zoom - (any ? hZoomDiff : Math.ceil(hZoomDiff));

            // multiplication factor between vertical span and map height
            var vFactor = (BR.row - TL.row) / (height / this.provider.tileHeight);

            // multiplication factor expressed as base-2 logarithm, for zoom difference
            var vZoomDiff = Math.log(vFactor) / Math.log(2);

            // possible vertical zoom to fit geographical extent in map height
            var vPossibleZoom = TL.zoom - (any ? vZoomDiff : Math.ceil(vZoomDiff));

            // initial zoom to fit extent vertically and horizontally
            var initZoom = Math.min(hPossibleZoom, vPossibleZoom);

            // additionally, make sure it's not outside the boundaries set by provider limits
            // this also catches Infinity stuff
            initZoom = Math.min(initZoom, this.provider.outerLimits()[1].zoom);
            initZoom = Math.max(initZoom, this.provider.outerLimits()[0].zoom);

            // coordinate of extent center
            var centerRow = (TL.row + BR.row) / 2;
            var centerColumn = (TL.column + BR.column) / 2;
            var centerZoom = TL.zoom;

            this.coordinate = new MM.Coordinate(centerRow, centerColumn, centerZoom).zoomTo(initZoom);
            this.draw(); // draw calls enforceLimits 
            // (if you switch to getFrame, call enforceLimits first)

            this.dispatchCallback('extentset', locations);
            return this;
        },

        // Resize the map's container `<div>`, redrawing the map and triggering
        // `resized` to make sure that the map's presentation is still correct.
        setSize: function(dimensionsOrX, orY) {
            if (dimensionsOrX.hasOwnProperty('x') && dimensionsOrX.hasOwnProperty('y')) {
                this.dimensions = dimensionsOrX;
            }
            else if (orY !== undefined && !isNaN(orY)) {
                this.dimensions = new MM.Point(dimensionsOrX, orY);
            }
            this.parent.style.width = Math.round(this.dimensions.x) + 'px';
            this.parent.style.height = Math.round(this.dimensions.y) + 'px';
            this.draw();
            this.dispatchCallback('resized', [this.dimensions]);
            return this;
        },

        // projecting points on and off screen
        coordinatePoint: function(coord) {
            // Return an x, y point on the map image for a given coordinate.
            if (coord.zoom != this.coordinate.zoom) {
                coord = coord.zoomTo(this.coordinate.zoom);
            }

            // distance from the center of the map
            var point = new MM.Point(this.dimensions.x / 2, this.dimensions.y / 2);
            point.x += this.provider.tileWidth * (coord.column - this.coordinate.column);
            point.y += this.provider.tileHeight * (coord.row - this.coordinate.row);

            return point;
        },

        // Get a `MM.Coordinate` from an `MM.Point` - returns a new tile-like object
        // from a screen point.
        pointCoordinate: function(point) {
            // new point coordinate reflecting distance from map center, in tile widths
            var coord = this.coordinate.copy();
            coord.column += (point.x - this.dimensions.x / 2) / this.provider.tileWidth;
            coord.row += (point.y - this.dimensions.y / 2) / this.provider.tileHeight;

            return coord;
        },

        // Return an x, y point on the map image for a given geographical location.
        locationPoint: function(location) {
            return this.coordinatePoint(this.provider.locationCoordinate(location));
        },

        // Return a geographical location on the map image for a given x, y point.
        pointLocation: function(point) {
            return this.provider.coordinateLocation(this.pointCoordinate(point));
        },

        // inspecting

        getExtent: function() {
            var extent = [];
            extent.push(this.pointLocation(new MM.Point(0, 0)));
            extent.push(this.pointLocation(this.dimensions));
            return extent;
        },

        // Get the current centerpoint of the map, returning a `Location`
        getCenter: function() {
            return this.provider.coordinateLocation(this.coordinate);
        },

        // Get the current zoom level of the map, returning a number
        getZoom: function() {
            return this.coordinate.zoom;
        },
        
        // layers
        
        getProviders: function() {
            var providers = [];
            
            for(var i = 0; i < this.layers.length; i++) {
                providers.push(this.layers[i].provider);
            }
            
            return providers;
        },
        
        getProviderAt: function(index) {
            return this.layers[index].provider;
        },
        
        setProviderAt: function(index, provider) {
            if(index < 0 || index >= this.layers.length) {
                throw new Error('invalid index in setProviderAt(): ' + index);
            }
            // pass it on.
            this.layers[index].setProvider(provider);
        },
        
        insertProviderAt: function(index, provider) {
            var layer = new MM.Layer(this, provider);
            
            if(index < 0 || index > this.layers.length) {
                throw new Error('invalid index in insertProviderAt(): ' + index);
            }
            
            if(index == this.layers.length) {
                // it just gets tacked on to the end
                this.layers.push(layer);
            } else {
                // it needs to get slipped in amongst the others
                var other = this.layers[index];
                other.parent.parentNode.insertBefore(layer.parent, other.parent);
                this.layers.splice(index, 0, layer);
            }

            MM.getFrame(this.getRedraw());
        },
        
        removeProviderAt: function(index) {
            if(index < 0 || index >= this.layers.length) {
                throw new Error('invalid index in removeProviderAt(): ' + index);
            }
            
            // gone baby gone.
            var old = this.layers[index];
            old.parent.parentNode.removeChild(old.parent);
            this.layers.splice(index, 1);
        },
        
        swapProviders: function(i, j) {
            if(i < 0 || i >= this.layers.length) {
                throw new Error('invalid index in removeProviderAt(): ' + index);
            }
            
            if(j < 0 || j >= this.layers.length) {
                throw new Error('invalid index in removeProviderAt(): ' + index);
            }
            
            var layer1 = this.layers[i],
                layer2 = this.layers[j],
                dummy = document.createElement('div');
            
            // kick layer2 out, replace it with the dummy.
            this.parent.replaceChild(dummy, layer2.parent);
            
            // put layer2 back in and kick layer1 out
            this.parent.replaceChild(layer2.parent, layer1.parent);
            
            // put layer1 back in and ditch the dummy
            this.parent.replaceChild(layer1.parent, dummy);
            
            // now do it to the layers array
            this.layers[i] = layer2;
            this.layers[j] = layer1;
        },
        
        // limits
        
        // Prevent the user from navigating the map outside the `outerLimits`
        // of the map's provider.
        enforceLimits: function(coord) {
            coord = coord.copy();
            var limits = this.provider.outerLimits();
            if (limits) {
                var minZoom = limits[0].zoom;
                var maxZoom = limits[1].zoom;
                if (coord.zoom < minZoom) {
                    coord = coord.zoomTo(minZoom);
                }
                else if (coord.zoom > maxZoom) {
                    coord = coord.zoomTo(maxZoom);
                }
            }
            return coord;
        },
        
        // rendering    
        
        // Redraw the tiles on the map, reusing existing tiles.
        draw: function() {
            // make sure we're not too far in or out:
            this.coordinate = this.enforceLimits(this.coordinate);

            // draw layers one by one
            for(var i = 0; i < this.layers.length; i++) {
                this.layers[i].draw();
            }

            MM.getFrame(this.getRedraw());
        },

        _redrawTimer: undefined,

        requestRedraw: function() {
            // we'll always draw within 1 second of this request,
            // sometimes faster if there's already a pending redraw
            // this is used when a new tile arrives so that we clear
            // any parent/child tiles that were only being displayed
            // until the tile loads at the right zoom level
            if (!this._redrawTimer) {
                this._redrawTimer = setTimeout(this.getRedraw(), 1000);
            }
        },

        _redraw: null,

        getRedraw: function() {
            // let's only create this closure once...
            if (!this._redraw) {
                var theMap = this;
                this._redraw = function() {
                    theMap.draw();
                    theMap._redrawTimer = 0;
                };
            }
            return this._redraw;
        },

        // Attempts to destroy all attachment a map has to a page
        // and clear its memory usage.
        destroy: function() {
            this.requestManager.clear();
            for (var i = 0; i < this.eventHandlers.length; i++) {
                this.eventHandlers[i].remove();
            }
            this.parent.removeChild(this.layerParent);
            MM.removeEvent(window, 'resize', this.windowResize());
            return this;
        }
    };
