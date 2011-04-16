
    //////////////////////////// Map

    /* Instance of a map intended for drawing to a div.
    
        parent (required DOM element)
            Can also be an ID of a DOM element
    
        provider (required MapProvider)
            Provides tile URLs and map projections
            
        dimensions (optional Point)
            Size of map to create
            
        eventHandlers (optional Array)
            If empty or null MouseHandler will be used
            Otherwise, each handler will be called with init(map)

    */    
    MM.Map = function(parent, provider, dimensions, eventHandlers) {
    
        if (typeof parent == 'string') {
            parent = document.getElementById(parent);
        }
        this.parent = parent;
    
        // we're no longer adding width and height to parent.style but we still
        // need to enforce padding, overflow and position otherwise everything screws up
        // TODO: maybe console.warn if the current values are bad?
        this.parent.style.padding = '0';
        this.parent.style.overflow = 'hidden';
        
        var position = MM.getStyle(this.parent, 'position');
        if (position != "relative" && position != "absolute") {
            this.parent.style.position = 'relative';
        }

        // if you don't specify dimensions we assume you want to fill the parent
        // unless the parent has no w/h, in which case we'll still use a default
        if (!dimensions) {
            var w = this.parent.offsetWidth;
            var h = this.parent.offsetHeight;
            if (!w) {
                w = 640;
                this.parent.style.width = w+'px';
            }
            if (!h) {
                h = 480;
                this.parent.style.height = h+'px';
            }        
            dimensions = new MM.Point(w, h);
            // FIXME: listeners like this will stop the map being removed cleanly?
            // when does removeEvent get called?
            var theMap = this;
            MM.addEvent(window, 'resize', function(event) {
                // don't call setSize here because it sets parent.style.width/height
                // and setting the height breaks percentages and default styles
                theMap.dimensions = new MM.Point(theMap.parent.offsetWidth, theMap.parent.offsetHeight);
                theMap.draw();
                theMap.dispatchCallback('resized', [ theMap.dimensions ]);
            });
        }
        else {
            this.parent.style.width = Math.round(dimensions.x)+'px';
            this.parent.style.height = Math.round(dimensions.y)+'px';
        }

        this.dimensions = dimensions;
                                
        // TODO: is it sensible to do this (could be more than one map on a page)
        /*
        // add a style element so layer/tile styles can be class-based
        // thanks to http://www.phpied.com/dynamic-script-and-style-elements-in-ie/
        var css = document.createElement('style');
        css.setAttribute("type", "text/css");
        var def = "div.modestmaps-layer {"
            + "position: absolute;"
            + "top: 0px; left: 0px;"
            + "width: 100%; height: 100%;"
            + "margin: 0; padding: 0; border: 0;"
        + "}";
        if (css.styleSheet) { // IE
            css.styleSheet.cssText = def;
        } else { // the world
            css.appendChild(document.createTextNode(def));
        }
        //document.getElementsByTagName('head')[0].appendChild(ss1);        
        this.parent.appendChild(css);        
        */

        this.requestManager = new MM.RequestManager(this.parent);    
        this.requestManager.addCallback('requestcomplete', this.getTileComplete());
    
        this.layers = {};

        this.layerParent = document.createElement('div');
        this.layerParent.id = this.parent.id+'-layers';
        // this text is also used in createOrGetLayer
        this.layerParent.style.cssText = 'position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; margin: 0; padding: 0; z-index: 0';
        
        this.parent.appendChild(this.layerParent);
    
        this.coordinate = new MM.Coordinate(0.5,0.5,0);
        
        this.setProvider(provider);
        
        this.enablePyramidLoading = false;
        
        this.callbackManager = new MM.CallbackManager(this, [ 'zoomed', 'panned', 'centered', 'extentset', 'resized', 'drawn' ]);

        // set up handlers last so that all required attributes/functions are in place if needed
        if (eventHandlers === undefined) {
            this.eventHandlers = [];
            this.eventHandlers.push(new MM.MouseHandler(this));
        }
        else {
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
    
        tiles: null,
        layers: null,
        layerParent: null,
    
        requestManager: null,
    
        tileCacheSize: null,
        
        maxTileCacheSize: null,
        recentTiles: null,
        recentTilesById: null,

        callbackManager: null,        
        eventHandlers: null,
    
        toString: function() {
            return 'Map(#' + this.parent.id + ')';
        },
        
        // callbacks...
        
        addCallback: function(event, callback) {
            this.callbackManager.addCallback(event,callback);
        },

        removeCallback: function(event, callback) {
            this.callbackManager.removeCallback(event,callback);
        },
        
        dispatchCallback: function(event, message) {
            this.callbackManager.dispatchCallback(event,message);
        },
    
        // zooming
        
        zoomBy: function(zoomOffset) {
            this.coordinate = this.coordinate.zoomBy(zoomOffset);
            this.draw();
            this.dispatchCallback('zoomed', zoomOffset);
            return this;
        },

        zoomIn:  function()  { return this.zoomBy(1); },
        zoomOut: function()  { return this.zoomBy(-1); },
        setZoom: function(z) { return this.zoomBy(z - this.coordinate.zoom); },
                
        zoomByAbout: function(zoomOffset, point) {
            var location = this.pointLocation(point);
            this.zoomBy(zoomOffset);
            var newPoint = this.locationPoint(location);
            return this.panBy(point.x - newPoint.x, point.y - newPoint.y);
        },
    
        // panning
        
        panBy: function(dx, dy) {
            this.coordinate.column -= dx / this.provider.tileWidth;
            this.coordinate.row -= dy / this.provider.tileHeight;
            this.draw();
            this.dispatchCallback('panned', [dx, dy]);
            return this;
        },
    
        panLeft:  function() { return this.panBy(100,0); },
        panRight: function() { return this.panBy(-100,0); },
        panDown:  function() { return this.panBy(0,-100); },
        panUp:    function() { return this.panBy(0,100); },
        
        // positioning
        
        setCenter: function(location) {
            return this.setCenterZoom(location, this.coordinate.zoom);
        },
    
        setCenterZoom: function(location, zoom) {
            this.coordinate = this.provider.locationCoordinate(location).zoomTo(parseFloat(zoom) || 0);
            this.draw();
            this.dispatchCallback('centered', [location, zoom]);
            return this;
        },
    
        setExtent: function(locations) {
    
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
            var hPossibleZoom = TL.zoom - Math.ceil(hZoomDiff);
                
            // multiplication factor between vertical span and map height
            var vFactor = (BR.row - TL.row) / (height / this.provider.tileHeight);
                
            // multiplication factor expressed as base-2 logarithm, for zoom difference
            var vZoomDiff = Math.log(vFactor) / Math.log(2);
                
            // possible vertical zoom to fit geographical extent in map height
            var vPossibleZoom = TL.zoom - Math.ceil(vZoomDiff);
                
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
            this.draw();
    
            this.dispatchCallback('extentset', locations);
            return this;
        },
    
        // map dimensions
        
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
            this.dispatchCallback('resized', [ this.dimensions ]);
            return this;
        },
        
        // projecting points on and off screen
        
        coordinatePoint: function(coord)
        {
            /* Return an x, y point on the map image for a given coordinate. */
            
            if(coord.zoom != this.coordinate.zoom) {
                coord = coord.zoomTo(this.coordinate.zoom);
            }
            
            // distance from the center of the map
            var point = new MM.Point(this.dimensions.x/2, this.dimensions.y/2);
            point.x += this.provider.tileWidth * (coord.column - this.coordinate.column);
            point.y += this.provider.tileHeight * (coord.row - this.coordinate.row);
            
            return point;
        },
    
        pointCoordinate: function(point)
        {
            /* Return a coordinate on the map image for a given x, y point. */
            
            // new point coordinate reflecting distance from map center, in tile widths
            var coord = this.coordinate.copy();
            coord.column += (point.x - this.dimensions.x/2) / this.provider.tileWidth;
            coord.row += (point.y - this.dimensions.y/2) / this.provider.tileHeight;
            
            return coord;
        },
    
        locationPoint: function(location)
        {
            /* Return an x, y point on the map image for a given geographical location. */
            return this.coordinatePoint(this.provider.locationCoordinate(location));
        },
        
        pointLocation: function(point)
        {
            /* Return a geographical location on the map image for a given x, y point. */
            return this.provider.coordinateLocation(this.pointCoordinate(point));
        },
        
        // inspecting
    
        getExtent: function() {
            var extent = [];
            extent.push(this.pointLocation(new MM.Point(0,0)));
            extent.push(this.pointLocation(this.dimensions));
            return extent;
        },
        
        getCenter: function() {
            return this.provider.coordinateLocation(this.coordinate);
        },
        
        getZoom: function() {
            return this.coordinate.zoom;
        },
    
        setProvider: function(newProvider) {

            var firstProvider = false;            
            if (this.provider === null) {
                firstProvider = true;
            }        
        
            // if we already have a provider the we'll need to
            // clear the DOM, cancel requests and redraw
            if (!firstProvider) {

                this.requestManager.clear();
                
                for (var name in this.layers) {
                    if (this.layers.hasOwnProperty(name)) {
                        var layer = this.layers[name];
                        while(layer.firstChild) {
                            layer.removeChild(layer.firstChild);
                        }
                    }
                }
            }

            // first provider or not we'll init/reset some values...

            this.tiles = {};
        
            this.tileCacheSize = 0;
            
            this.maxTileCacheSize = 64;
            this.recentTiles = [];
            this.recentTilesById = {};            

            // for later: check geometry of old provider and set a new coordinate center 
            // if needed (now? or when?)

            this.provider = newProvider;

            if (!firstProvider) {            
                this.draw();
            }
            return this;
        },

        // stats
        
        /*
        getStats: function() {
            return {
                'Request Queue Length': this.requestManager.requestQueue.length,
                'Open Request Count': this.requestManager.requestCount,
                'Tile Cache Size': this.tileCacheSize,
                'Tiles On Screen': this.parent.getElementsByTagName('img').length
            };        
        },*/
        
        // limits
        
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
                
                /*                 
                // this generally does the *intended* thing,
                // but it's not always desired behavior so it's disabled for now
                
                var topLeftLimit = limits[0].zoomTo(coord.zoom);
                var bottomRightLimit = limits[1].zoomTo(coord.zoom);
                var currentTopLeft = this.pointCoordinate(new MM.Point(0,0));
                var currentBottomRight = this.pointCoordinate(this.dimensions);
                
                if (bottomRightLimit.row - topLeftLimit.row < currentBottomRight.row - currentTopLeft.row) {
                    // if the limit is smaller than the current view center it
                    coord.row = (bottomRightLimit.row + topLeftLimit.row) / 2;
                }
                else {
                    if (currentTopLeft.row < topLeftLimit.row) {
                        coord.row += topLeftLimit.row - currentTopLeft.row;
                    }
                    else if (currentBottomRight.row > bottomRightLimit.row) {
                        coord.row -= currentBottomRight.row - bottomRightLimit.row;
                    }
                }
                if (bottomRightLimit.column - topLeftLimit.column < currentBottomRight.column - currentTopLeft.column) {
                    // if the limit is smaller than the current view, center it
                    coord.column = (bottomRightLimit.column + topLeftLimit.column) / 2;                    
                }
                else {
                    if (currentTopLeft.column < topLeftLimit.column) {
                        coord.column += topLeftLimit.column - currentTopLeft.column;
                    }
                    else if (currentBottomRight.column > bottomRightLimit.column) {
                        coord.column -= currentBottomRight.column - bottomRightLimit.column;
                    }
                }
                */
                
            }
            return coord;
        },
        
        // rendering    
        
        draw: function() {
    
            // make sure we're not too far in or out:
            this.coordinate = this.enforceLimits(this.coordinate);

            // if we're in between zoom levels, we need to choose the nearest:
            var baseZoom = Math.round(this.coordinate.zoom);

            // these are the top left and bottom right tile coordinates
            // we'll be loading everything in between:
            var startCoord = this.pointCoordinate(new MM.Point(0,0)).zoomTo(baseZoom).container();
            var endCoord = this.pointCoordinate(this.dimensions).zoomTo(baseZoom).container().right().down();

            var tilePadding = 0;
            if (tilePadding) {
                startCoord = startCoord.left(tilePadding).up(tilePadding);
                endCoord = endCoord.right(tilePadding).down(tilePadding);
            }

            // tiles with invalid keys will be removed from visible layers
            // requests for tiles with invalid keys will be canceled
            // (this object maps from a tile key to a boolean)
            var validTileKeys = { };
            
            // make sure we have a container for tiles in the current layer
            var thisLayer = this.createOrGetLayer(startCoord.zoom);

            // use this coordinate for generating keys, parents and children:
            var tileCoord = startCoord.copy();

            for (tileCoord.column = startCoord.column; tileCoord.column <= endCoord.column; tileCoord.column += 1) {
                for (tileCoord.row = startCoord.row; tileCoord.row <= endCoord.row; tileCoord.row += 1) {
                    var tileKey = tileCoord.toKey();
                    validTileKeys[tileKey] = true;
                    if (tileKey in this.tiles) {
                        var tile = this.tiles[tileKey];
                        // ensure it's in the DOM:
                        if (tile.parentNode != thisLayer) {
                            thisLayer.appendChild(tile);
                        }
                    }
                    else {
                        if (!this.requestManager.hasRequest(tileKey)) {
                            var tileURL = this.provider.getTileUrl(tileCoord);
                            this.requestManager.requestTile(tileKey, tileCoord, tileURL);
                        }
                        // look for a parent tile in our image cache
                        var tileCovered = false;
                        var maxStepsOut = tileCoord.zoom;
                        for (var pz = 1; pz <= maxStepsOut; pz++) {
                            var parentCoord = tileCoord.zoomBy(-pz).container();
                            var parentKey = parentCoord.toKey();
                            
                            if (this.enablePyramidLoading) {
                                // mark all parent tiles valid
                                validTileKeys[parentKey] = true;
                                var parentLayer = this.createOrGetLayer(parentCoord.zoom);
                                //parentLayer.coordinate = parentCoord.copy();
                                if (parentKey in this.tiles) {
                                    var parentTile = this.tiles[parentKey];
                                    if (parentTile.parentNode != parentLayer) {
                                        parentLayer.appendChild(parentTile);
                                    }                            
                                }
                                else if (!this.requestManager.hasRequest(parentKey)) {
                                    // force load of parent tiles we don't already have
                                    var tileURL = this.provider.getTileUrl(parentCoord);
                                    this.requestManager.requestTile(parentKey, parentCoord, tileURL);                            
                                }
                            }
                            else {
                                // only mark it valid if we have it already
                                if (parentKey in this.tiles) {
                                    validTileKeys[parentKey] = true;
                                    tileCovered = true;
                                    break;
                                }
                            }
                            
                        }
                        // if we didn't find a parent, look at the children:
                        if (!tileCovered && !this.enablePyramidLoading) {
                            var childCoord = tileCoord.zoomBy(1);
                            // mark everything valid whether or not we have it:
                            validTileKeys[childCoord.toKey()] = true;
                            childCoord.column += 1;
                            validTileKeys[childCoord.toKey()] = true;
                            childCoord.row += 1;
                            validTileKeys[childCoord.toKey()] = true;
                            childCoord.column -= 1;
                            validTileKeys[childCoord.toKey()] = true;
                        }
                    }
                }
            }
            
            // i from i to zoom-5 are layers that would be scaled too big,
            // i from zoom+2 to layers.length are layers that would be 
            // scaled too small (and tiles would be too numerous)                
            for (var name in this.layers) {
                if (this.layers.hasOwnProperty(name)) {
                    var zoom = parseInt(name,10);
                    if (zoom >= startCoord.zoom-5 && zoom < startCoord.zoom+2) {
                        continue;
                    }
                    var layer = this.layers[name];
                    layer.style.display = 'none';
                    var visibleTiles = layer.getElementsByTagName('img');
                    for (var j = visibleTiles.length-1; j >= 0; j--) {
                        layer.removeChild(visibleTiles[j]);
                    }                    
                }
            }
        
            // for tracking time of tile usage:
            var now = new Date().getTime();
        
            // layers we want to see, if they have tiles in validTileKeys
            var minLayer = startCoord.zoom-5;
            var maxLayer = startCoord.zoom+2;
            for (var i = minLayer; i < maxLayer; i++) {

                var layer = this.layers[i];
                
                if (!layer) {
                    // no tiles for this layer yet
                    continue;
                }

                var scale = 1;
                var theCoord = this.coordinate.copy();

                if (layer.childNodes.length > 0) {
                    layer.style.display = 'block';
                    scale = Math.pow(2, this.coordinate.zoom - i);
                    theCoord = theCoord.zoomTo(i);
                }
                else {
                    layer.style.display = 'none';
                }
                
                var tileWidth = this.provider.tileWidth * scale;
                var tileHeight = this.provider.tileHeight * scale;
                var center = new MM.Point(this.dimensions.x/2, this.dimensions.y/2);

                var visibleTiles = layer.getElementsByTagName('img');
                for (var j = visibleTiles.length-1; j >= 0; j--) {
                    var tile = visibleTiles[j];
                    if (!validTileKeys[tile.id]) {
                        layer.removeChild(tile);
                    }
                    else {
                        // position tiles
                        var tx = center.x + (tile.coord.column - theCoord.column) * tileWidth;
                        var ty = center.y + (tile.coord.row - theCoord.row) * tileHeight;
                        tile.style.left = Math.round(tx) + 'px'; 
                        tile.style.top = Math.round(ty) + 'px'; 
                        // using style here and not raw width/height for ipad/iphone scaling
                        // see examples/touch/test.html
                        tile.style.width = Math.ceil(tileWidth) + 'px';
                        tile.style.height = Math.ceil(tileHeight) + 'px';
                        // log last-touched-time of currently cached tiles
                        this.recentTilesById[tile.id].lastTouchedTime = now;
                    }
                }
                
            }
    
            // cancel requests that aren't visible:
            this.requestManager.clearExcept(validTileKeys);
            
            // get newly requested tiles, sort according to current view:
            this.requestManager.processQueue(this.getCenterDistanceCompare());
            
            // make sure we don't have too much stuff:
            this.checkCache();

            this.dispatchCallback('drawn');
        },
        
        _tileComplete: null,
        
        getTileComplete: function() {
            if (!this._tileComplete) {
                var theMap = this;
                this._tileComplete = function(manager, tile) {
                
                    // cache the tile itself:
                    theMap.tiles[tile.id] = tile;
                    theMap.tileCacheSize++;
                    
                    // also keep a record of when we last touched this tile:
                    var record = { 
                        id: tile.id, 
                        lastTouchedTime: new Date().getTime() 
                    };
                    theMap.recentTilesById[tile.id] = record;
                    theMap.recentTiles.push(record);                        

                    // position this tile (avoids a full draw() call):
                    var theCoord = theMap.coordinate.zoomTo(tile.coord.zoom);
                    var scale = Math.pow(2, theMap.coordinate.zoom - tile.coord.zoom);
                    var tx = ((theMap.dimensions.x/2) + (tile.coord.column - theCoord.column) * theMap.provider.tileWidth * scale);
                    var ty = ((theMap.dimensions.y/2) + (tile.coord.row - theCoord.row) * theMap.provider.tileHeight * scale);
                    tile.style.left = Math.round(tx) + 'px'; 
                    tile.style.top = Math.round(ty) + 'px'; 
                    // using style here and not raw width/height for ipad/iphone scaling
                    // see examples/touch/test.html                    
                    tile.style.width = Math.ceil(theMap.provider.tileWidth * scale) + 'px';
                    tile.style.height = Math.ceil(theMap.provider.tileHeight * scale) + 'px';

                    // add tile to its layer
                    var theLayer = theMap.layers[tile.coord.zoom];
                    theLayer.appendChild(tile);                    

                    // ensure the layer is visible if it's still the current layer
                    if (Math.round(theMap.coordinate.zoom) == tile.coord.zoom) {
                        theLayer.style.display = 'block';
                    }

                    // request a lazy redraw of all layers 
                    // this will remove tiles that were only visible
                    // to cover this tile while it loaded:
                    theMap.requestRedraw();                
                };
            }
            return this._tileComplete;
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
        
        createOrGetLayer: function(zoom) {
            if (zoom in this.layers) {
                return this.layers[zoom];
            }
            //console.log('creating layer ' + zoom);
            var layer = document.createElement('div');
            layer.id = this.parent.id+'-zoom-'+zoom;
            layer.style.cssText = this.layerParent.style.cssText;
            layer.style.zIndex = zoom;
            this.layerParent.appendChild(layer);
            this.layers[zoom] = layer;
            return layer;
        },
        
        /* 
         * keeps cache below max size
         * (called every time we receive a new tile and add it to the cache)
         */
        checkCache: function() {
            var numTilesOnScreen = this.parent.getElementsByTagName('img').length;
            var maxTiles = Math.max(numTilesOnScreen, this.maxTileCacheSize);
            if (this.tileCacheSize > maxTiles) {
                // sort from newest (highest) to oldest (lowest)
                this.recentTiles.sort(function(t1, t2) {
                    return t2.lastTouchedTime < t1.lastTouchedTime ? -1 : t2.lastTouchedTime > t1.lastTouchedTime ? 1 : 0;
                });            
            }
            while (this.tileCacheSize > maxTiles) {
                // delete the oldest record
                var tileRecord = this.recentTiles.pop();
                var now = new Date().getTime();
                delete this.recentTilesById[tileRecord.id];
                //window.console.log('removing ' + tileRecord.id + 
                //                   ' last seen ' + (now-tileRecord.lastTouchedTime) + 'ms ago');
                // now actually remove it from the cache...
                var tile = this.tiles[tileRecord.id];
                if (tile.parentNode) {
                    // I'm leaving this uncommented for now but you should never see it:
                    alert("Gah: trying to removing cached tile even though it's still in the DOM");
                }
                else {
                    delete this.tiles[tileRecord.id];
                    this.tileCacheSize--;
                }
            }
        },
        
        // compares manhattan distance from center of 
        // requested tiles to current map center
        // NB:- requested tiles are *popped* from queue, so we do a descending sort
        getCenterDistanceCompare: function() {
            var theCoord = this.coordinate.zoomTo(Math.round(this.coordinate.zoom));
            return function(r1, r2) {
                if (r1 && r2) {
                    var c1 = r1.coord;
                    var c2 = r2.coord;
                    if (c1.zoom == c2.zoom) {
                        var ds1 = Math.abs(theCoord.row - c1.row - 0.5) + 
                                  Math.abs(theCoord.column - c1.column - 0.5);
                        var ds2 = Math.abs(theCoord.row - c2.row - 0.5) + 
                                  Math.abs(theCoord.column - c2.column - 0.5);
                        return ds1 < ds2 ? 1 : ds1 > ds2 ? -1 : 0;
                    }
                    else {
                        return c1.zoom < c2.zoom ? 1 : c1.zoom > c2.zoom ? -1 : 0;
                    }
                }
                return r1 ? 1 : r2 ? -1 : 0;
            };
        }
        
    };
    

