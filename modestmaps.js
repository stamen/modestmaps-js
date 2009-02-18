//////////////////////////// Make inheritance bearable

function extend(child, parent)
{
  for (var property in parent.prototype) {
    if (typeof child.prototype[property] == "undefined")
      child.prototype[property] = parent.prototype[property];
  }
  return child;
}

//////////////////////////// Core

function Point(x,y) {
    this.x = parseFloat(x)
    this.y = parseFloat(y)
}

Point.prototype = {
    x: 0,
    y: 0,
    toString: function() {
        return "(" + this.x.toFixed(3) + ", " + this.y.toFixed(3) + ")";
    }
}

function Coordinate(row, column, zoom) {
    this.row = row
    this.column = column
    this.zoom = zoom
}

Coordinate.prototype = {

    row: 0,
    column: 0,
    zoom: 0,

    toString: function() {
        return "(" + this.row.toFixed(3) + ", " + this.column.toFixed(3) + " @" + this.zoom.toFixed(3) + ")"
    },

    copy: function() {
        return new Coordinate(this.row, this.column, this.zoom)
    },

    container: function() {
        return new Coordinate(Math.floor(this.row), Math.floor(this.column), Math.floor(this.zoom))
    },

    zoomTo: function(destination) {
        return new Coordinate(this.row * Math.pow(2, destination - this.zoom),
                          this.column * Math.pow(2, destination - this.zoom),
                          destination)
    },
    
    zoomBy: function(distance) {
        return new Coordinate(this.row * Math.pow(2, distance),
                          this.column * Math.pow(2, distance),
                          this.zoom + distance)
    },

    up: function(distance) {
        if (distance == undefined) distance = 1;
        return new Coordinate(this.row - distance, this.column, this.zoom)
    },

    right: function(distance) {
        if (distance == undefined) distance = 1;
        return new Coordinate(this.row, this.column + distance, this.zoom)
    },

    down: function(distance) {
        if (distance == undefined) distance = 1;
        return new Coordinate(this.row + distance, this.column, this.zoom)
    },

    left: function(distance) {
        if (distance == undefined) distance = 1;
        return new Coordinate(this.row, this.column - distance, this.zoom)
    }
}

//////////////////////////// Geo

function Location(lat, lon) {
    this.lat = parseFloat(lat)
    this.lon = parseFloat(lon)
}

Location.prototype = {
    lat: 0,
    lon: 0,
    toString: function() {
        return "(" + this.lat.toFixed(3) + ", " + this.lon.toFixed(3) + ")";
    }
}

function Transformation(ax, bx, cx, ay, by, cy) {
    this.ax = ax
    this.bx = bx
    this.cx = cx
    this.ay = ay
    this.by = by
    this.cy = cy
}

Transformation.prototype = {
    ax: 0, 
    bx: 0, 
    cx: 0, 
    ay: 0, 
    by: 0, 
    cy: 0,
    
    transform: function(point) {
        return new Point(this.ax*point.x + this.bx*point.y + this.cx,
                         this.ay*point.x + this.by*point.y + this.cy)
    },
                         
    untransform: function(point) {
        return new Point((point.x*this.by - point.y*this.bx - this.cx*this.by + this.cy*this.bx) / (this.ax*this.by - this.ay*this.bx),
                         (point.x*this.ay - point.y*this.ax - this.cx*this.ay + this.cy*this.ax) / (this.bx*this.ay - this.by*this.ax))
    },

    deriveTransformation: function(a1x, a1y, a2x, a2y, b1x, b1y, b2x, b2y, c1x, c1y, c2x, c2y) {
        // Generates a transform based on three pairs of points, a1 -> a2, b1 -> b2, c1 -> c2.
        var x = linearSolution(a1x, a1y, a2x, b1x, b1y, b2x, c1x, c1y, c2x)
        var y = linearSolution(a1x, a1y, a2y, b1x, b1y, b2y, c1x, c1y, c2y)
        return new Transformation(x[0], x[1], x[2], y[0], y[1], y[2])
    },

    linearSolution: function(r1, s1, t1, r2, s2, t2, r3, s3, t3) {
        /* Solves a system of linear equations.

          t1 = (a * r1) + (b + s1) + c
          t2 = (a * r2) + (b + s2) + c
          t3 = (a * r3) + (b + s3) + c

        r1 - t3 are the known values.
        a, b, c are the unknowns to be solved.
        returns the a, b, c coefficients.
        */

        // make them all floats
        r1 = parseFloat(r1)
        s1 = parseFloat(s1)
        t1 = parseFloat(t1)
        r2 = parseFloat(r2)
        s2 = parseFloat(s2)
        t2 = parseFloat(t2)
        r3 = parseFloat(r3)
        s3 = parseFloat(s3)
        t3 = parseFloat(t3)

        var a = (((t2 - t3) * (s1 - s2)) - ((t1 - t2) * (s2 - s3))) / (((r2 - r3) * (s1 - s2)) - ((r1 - r2) * (s2 - s3)))

        var b = (((t2 - t3) * (r1 - r2)) - ((t1 - t2) * (r2 - r3))) / (((s2 - s3) * (r1 - r2)) - ((s1 - s2) * (r2 - r3)))

        var c = t1 - (r1 * a) - (s1 * b)
    
        return new Array(a, b, c)
    }
}

function Projection(zoom, transformation) {
    if (!transformation) transformation = Transformation(1, 0, 0, 0, 1, 0)
    this.zoom = zoom
    this.transformation = transformation
}

Projection.prototype = {

    zoom: 0,
    transformation: null,
    
    rawProject: function(point) {
        alert("Abstract method not implemented by subclass.")
    },
        
    rawUnproject: function(point) {
        alert("Abstract method not implemented by subclass.")
    },

    project: function(point) {
        point = this.rawProject(point)
        if(this.transformation)
            point = this.transformation.transform(point)
        return point
    },
    
    unproject: function(point) {
        if(this.transformation)
            point = this.transformation.untransform(point)
        point = this.rawUnproject(point)
        return point
    },
        
    locationCoordinate: function(location) {
        var point = new Point(Math.PI * location.lon / 180.0, Math.PI * location.lat / 180.0)
        point = this.project(point)
        return new Coordinate(point.y, point.x, this.zoom)
    },

    coordinateLocation: function(coordinate) {
        coordinate = coordinate.zoomTo(this.zoom)
        var point = new Point(coordinate.column, coordinate.row)
        point = this.unproject(point)
        return new Location(180.0 * point.y / Math.PI, 180.0 * point.x / Math.PI)
    }
}

function LinearProjection(zoom, transformation) {
    Projection.call(this, zoom, transformation);
}

LinearProjection.prototype = {
    rawProject: function(point) {
        return new Point(point.x, point.y)
    },
    rawUnproject: function(point) {
        return new Point(point.x, point.y)
    }
}

extend(LinearProjection, Projection);

function MercatorProjection(zoom, transformation) {
    // super!
    Projection.call(this, zoom, transformation);
}

MercatorProjection.prototype = {
    rawProject: function(point) {
        return new Point(point.x,
                     Math.log(Math.tan(0.25 * Math.PI + 0.5 * point.y)))
    },

    rawUnproject: function(point) {
        return new Point(point.x,
                     2 * Math.atan(Math.pow(Math.E, point.y)) - 0.5 * Math.PI)
    }
}

extend(MercatorProjection, Projection);

//////////////////////////// Providers

function MapProvider(getTileUrl) {
    if (getTileUrl) {
        this.getTileUrl = getTileUrl
    }
}

MapProvider.prototype = {

    // defaults to Google-y Mercator style maps
    // see http://modestmaps.com/calculator.html for how to generate these magic numbers
    projection: new MercatorProjection(26, new Transformation(1.068070779e7, 0, 3.355443185e7, 0, -1.068070890e7, 3.355443057e7)),
    tileWidth: 256,
    tileHeight: 256,

    getTileUrl: function(coordinate) {
        alert("Abstract method not implemented by subclass.")
    },
    
    locationCoordinate: function(location) {
        return this.projection.locationCoordinate(location)
    },

    coordinateLocation: function(location) {
        return this.projection.coordinateLocation(location)
    },

    sourceCoordinate: function(coordinate) {
        var wrappedColumn = coordinate.column % Math.pow(2, coordinate.zoom)

        while (wrappedColumn < 0)
            wrappedColumn += Math.pow(2, coordinate.zoom)
            
        return new Coordinate(coordinate.row, wrappedColumn, coordinate.zoom)
    }
}

function BlueMarbleProvider() {
    MapProvider.call(this, function(coordinate) {
        var img = coordinate.zoom.toFixed(0) +'-r'+ coordinate.row.toFixed(0) +'-c'+ coordinate.column.toFixed(0) + '.jpg';
        return 'http://s3.amazonaws.com/com.modestmaps.bluemarble/' + img;
    });
}

extend(BlueMarbleProvider, MapProvider);

//////////////////////////// Map

function Map(parent, provider, dimensions) {
    /* Instance of a map intended for drawing to a div.
    
        parent
            DOM element
    
        provider
            Instance of IMapProvider
            
        dimensions
            Size of output image, instance of Point

    */
    if (typeof parent == 'string') {
        parent = document.getElementById(parent)
    }
    this.parent = parent
    
    this.parent.style.position = 'relative'
    this.parent.style.width = dimensions.x + 'px'
    this.parent.style.height = dimensions.y + 'px'
    this.parent.style.padding = '0'
    this.parent.style.overflow = 'hidden'
    this.parent.style.backgroundColor = '#eee'
    
    // TODO addEvent        
    this.parent.onmousedown = this.getMouseDown()
    
    if (this.parent.addEventListener) {
        this.parent.addEventListener('DOMMouseScroll', this.getMouseWheel(), false);
    }
    this.parent.onmousewheel = this.getMouseWheel()

    this.layers = new Array();

    // add a div for each zoom level
    for (var z = 0; z <= 20; z++) {
        var layer = document.createElement('div')
        layer.id = 'zoom-'+z;
        layer.style.margin = '0'
        layer.style.padding = '0'
        layer.style.width = '100%'
        layer.style.height = '100%'
        layer.style.position = 'absolute'
        layer.style.top = '0px'
        layer.style.left = '0px'
        this.parent.appendChild(layer);
        this.layers.push(layer)
    }
    
    this.provider = provider;
    this.dimensions = dimensions;
    this.coordinate = new Coordinate(0.5,0.5,0);
    this.tiles = new Object();
    this.requestedTiles = new Object();
    
    this.callbacks = {zoomed: [], panned: [], centered: [], extentset: []};
}

Map.prototype = {

    parent: null,
    provider: null,
    dimensions: null,
    coordinate: null,

    tiles: null,
    requestedTiles: null,
    layers: null,
    
    callbacks: null,

    toString: function() {
        return 'Map(' + this.provider.toString() + this.dimensions.toString() + this.coordinate.toString() + ')';
    },
    
    addCallback: function(event, callback)
    {
        if(typeof(callback) == 'function' && this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    },
    
    dispatchCallback: function(event, message)
    {
        if(this.callbacks[event]) {
            for(var i = 0; i < this.callbacks[event].length; i += 1) {
                try {
                    this.callbacks[event][i](this, message);
                } catch(e) {
                    // meh
                }
            }
        }
    },

    // events

    getMouseDown: function() {
        var theMap = this;
        return function(e) {
    	    if (!e) var e = window.event;

            // TODO addEvent
            document.onmouseup = theMap.getMouseUp();
            document.onmousemove = theMap.getMouseMove();
    	
        	theMap.prevMouse = new Point(e.clientX, e.clientY);
    	
    	    e.cancelBubble = true;
    	    if (e.stopPropagation) e.stopPropagation();
        	return false;
        };
    },
    
    getMouseMove: function() {
        var theMap = this;
        return function(e) {
        	if (!e) var e = window.event;

            if (theMap.prevMouse) {
                theMap.panBy(e.clientX - theMap.prevMouse.x, e.clientY - theMap.prevMouse.y);
        	    theMap.prevMouse.x = e.clientX
            	theMap.prevMouse.y = e.clientY
            }
    	
    	    e.cancelBubble = true;
        	if (e.stopPropagation) e.stopPropagation();
    	    return false;
    	};
    },

    getMouseUp: function() {
        var theMap = this;
        return function(e) {
            if (!e) var e = window.event;
    
            // TODO removeEvent
            document.onmouseup = null;
            document.onmousemove = null;
            theMap.prevMouse = null;
    
            e.cancelBubble = true;
            if (e.stopPropagation) e.stopPropagation();
            return false;    	
        }
    },

    getMouseWheel: function() {
        var theMap = this;
        var prevTime = new Date().getTime();
        return function(e) {
    	    if (!e) var e = window.event;

            var delta = 0;
            
            if (e.wheelDelta) {
                delta = e.wheelDelta;
            }
            else if (e.detail) {
                delta = -e.detail;
            }

            // limit mousewheeling to once every 200ms
            var timeSince = new Date().getTime() - prevTime;

            if (delta != 0 && (timeSince > 200)) {
            	
            	var point = new Point(e.clientX, e.clientY);
            	point.x += document.body.scrollLeft + document.documentElement.scrollLeft;
            	point.x -= map.parent.offsetLeft;
            	point.y += document.body.scrollTop + document.documentElement.scrollTop;
            	point.y -= map.parent.offsetTop;
            	
            	theMap.zoomByAbout(delta > 0 ? 1 : -1, point);
            	
            	prevTime = new Date().getTime();
            }
 
            e.cancelBubble = true;
            if (e.stopPropagation) e.stopPropagation();
            
            return false;
        };
    },
        
    // zooming
    
    zoomIn: function() {
        this.zoomBy(1);
    },

    zoomOut: function() {
        this.zoomBy(-1);
    },
    
    setZoom: function(z) {
        this.zoomBy(z - this.coordinate.zoom);
    },
    
    zoomBy: function(zoomOffset) {
        this.coordinate = this.coordinate.zoomBy(zoomOffset);
        this.draw();

        this.dispatchCallback('zoomed', zoomOffset);
    },
    
    zoomByAbout: function(zoomOffset, point) {
        var location = this.pointLocation(point)
        this.coordinate = this.coordinate.zoomBy(zoomOffset)
        var newPoint = this.locationPoint(location)
        this.panBy(point.x - newPoint.x, point.y - newPoint.y)

        this.dispatchCallback('zoomed', zoomOffset);
    },

    // panning
    
    panBy: function(dx, dy) {
        this.coordinate.column -= dx / this.provider.tileWidth;
        this.coordinate.row -= dy / this.provider.tileHeight;
        this.draw();

        this.dispatchCallback('panned', [dx, dy]);
    },

    panLeft: function() {
        this.panBy(100,0);
    },
    
    panRight: function() {
        this.panBy(-100,0);
    },
    
    panDown: function() {
        this.panBy(0,-100);
    },
    
    panUp: function() {
        this.panBy(0,100);
    },
    
    // positioning
    
    setCenter: function(location) {
        this.setCenterZoom(location, this.coordinate.zoom);
    },
    
    setCenterZoom: function(location, zoom) {
        this.coordinate = this.provider.locationCoordinate(location).zoomTo(zoom);
        this.draw();

        this.dispatchCallback('centered', [location, zoom]);
    },

    setExtent: function(locations) {

        var TL, BR;
        for (var i = 0; i < locations.length; i++) {
            var coordinate = this.provider.locationCoordinate(locations[i])
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
        var hFactor = (BR.column - TL.column) / (width / this.provider.tileWidth)
    
        // multiplication factor expressed as base-2 logarithm, for zoom difference
        var hZoomDiff = Math.log(hFactor) / Math.log(2)
            
        // possible horizontal zoom to fit geographical extent in map width
        var hPossibleZoom = TL.zoom - Math.ceil(hZoomDiff)
            
        // multiplication factor between vertical span and map height
        var vFactor = (BR.row - TL.row) / (height / this.provider.tileHeight)
            
        // multiplication factor expressed as base-2 logarithm, for zoom difference
        var vZoomDiff = Math.log(vFactor) / Math.log(2)
            
        // possible vertical zoom to fit geographical extent in map height
        var vPossibleZoom = TL.zoom - Math.ceil(vZoomDiff)
            
        // initial zoom to fit extent vertically and horizontally
        var initZoom = Math.min(hPossibleZoom, vPossibleZoom)
    
        // additionally, make sure it's not outside the boundaries set by provider limits
        // initZoom = min(initZoom, provider.outerLimits()[1].zoom)
        // initZoom = max(initZoom, provider.outerLimits()[0].zoom)
    
        // coordinate of extent center
        centerRow = (TL.row + BR.row) / 2
        centerColumn = (TL.column + BR.column) / 2
        centerZoom = (TL.zoom + BR.zoom) / 2
        
        this.coordinate = new Coordinate(centerRow, centerColumn, centerZoom).zoomTo(initZoom);
        this.draw();

        this.dispatchCallback('extentset', locations);
    },
    
    // projecting points on and off screen
    
    coordinatePoint: function(coord)
    {
        /* Return an x, y point on the map image for a given coordinate. */
        
        if(coord.zoom != this.coordinate.zoom) {
            coord = coord.zoomTo(this.coordinate.zoom);
        }
        
        // distance from the center of the map
        var point = new Point(this.dimensions.x/2, this.dimensions.y/2)
        point.x += this.provider.tileWidth * (coord.column - this.coordinate.column)
        point.y += this.provider.tileHeight * (coord.row - this.coordinate.row)
        
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
        var extent = new Array();
        extent.push(this.pointLocation(new Point(0,0)));
        extent.push(this.pointLocation(this.dimensions));
        return extent;
    },
    
    getCenter: function() {
        return this.provider.coordinateLocation(this.coordinate);
    },
    
    getZoom: function() {
        return this.coordinate.zoom;
    },
    
    // rendering    
    
    draw: function(onlyThisLayer) {

        //console.log('--- begin draw ' + onlyThisLayer);
        
        // so this is the corner, taking the container offset into account
        var baseCoord = this.coordinate.container()
        var baseCorner = new Point(this.dimensions.x/2, this.dimensions.y/2);
        baseCorner.x += (baseCoord.column - this.coordinate.column) * this.provider.tileWidth
        baseCorner.y += (baseCoord.row - this.coordinate.row) * this.provider.tileHeight

        // get back to the top left
        while (baseCorner.x > 0) {
            baseCorner.x -= this.provider.tileWidth
            baseCoord.column -= 1;
        }
        while (baseCorner.y > 0) {
            baseCorner.y -= this.provider.tileHeight
            baseCoord.row -= 1;
        }

        var wantedTiles = new Object()
        
        var thisLayer = document.getElementById('zoom-'+parseInt(baseCoord.zoom));
        thisLayer.coordinate = this.coordinate.copy();
        
        var showParentLayer = false
        
        var tileCoord = baseCoord.copy()

        for (var y = baseCorner.y; y < this.dimensions.y; y += this.provider.tileHeight) {
            for (var x = baseCorner.x; x < this.dimensions.x; x += this.provider.tileWidth) {
                var tileKey = tileCoord.toString();
                wantedTiles[tileKey] = true;
                if (!this.tiles[tileKey]) {
                    if (!this.requestedTiles[tileKey]) {
                        this.requestTile(tileCoord);
                    }
                    showParentLayer = true
                    if (!onlyThisLayer) {
                        for (var pz = 1; pz <= 5; pz++) {
                            var parentKey = tileCoord.zoomBy(-pz).container().toString();
                            wantedTiles[parentKey] = true;
                        }
                        var childCoord = tileCoord.zoomBy(1);
                        wantedTiles[childCoord.toString()] = true;
                        wantedTiles[childCoord.right().toString()] = true;
                        childCoord = childCoord.down();
                        wantedTiles[childCoord.toString()] = true;
                        wantedTiles[childCoord.right().toString()] = true;
                    }
                }
                else {
                    var tile = this.tiles[tileKey];
                    if (!document.getElementById(tile.id)) {
                        thisLayer.appendChild(tile)
                    }
                    tile.style.left = x + 'px'
                    tile.style.top = y + 'px'
                }
                tileCoord.column += 1
            }
            tileCoord.row += 1
            tileCoord.column = baseCoord.column
        }
        
        //console.log(showParentLayer);
        
        if (!onlyThisLayer || !showParentLayer) {

            for (var i = 0; i < baseCoord.zoom-5; i++) {
                var layer = this.layers[i];
                layer.style.display = 'none'

                var visibleTiles = layer.getElementsByTagName('img');
                for (var j = visibleTiles.length-1; j >= 0; j--) {
                    layer.removeChild(visibleTiles[j])
                }                    
            }

            for (var i = baseCoord.zoom+2; i < this.layers.length; i++) {
                var layer = this.layers[i];
                layer.style.display = 'none'

                var visibleTiles = layer.getElementsByTagName('img');
                for (var j = visibleTiles.length-1; j >= 0; j--) {
                    layer.removeChild(visibleTiles[j])
                }                    
            }
        
            for (var i = baseCoord.zoom-5; i < Math.min(baseCoord.zoom+2, this.layers.length); i++) {

                var layer = this.layers[i];

                var scale = 1;

                var theCoord = null;

                if (layer.coordinate) {
                    layer.style.display = 'block';
                    if (layer != thisLayer) {
                        theCoord = this.coordinate.zoomTo(layer.coordinate.zoom);
                        scale = Math.pow(2, this.coordinate.zoom - layer.coordinate.zoom);
                    }
                }
                else {
                    layer.style.display = 'none';
                }

                var visibleTiles = layer.getElementsByTagName('img');
                for (var j = visibleTiles.length-1; j >= 0; j--) {
                    var tile = visibleTiles[j];
                    if (!wantedTiles[tile.id]) {
                        layer.removeChild(tile)
                    }
                    else if (theCoord) {
                        var tx = ((this.dimensions.x/2) + (tile.coord.column - theCoord.column) * this.provider.tileWidth * scale);
                        var ty = ((this.dimensions.y/2) + (tile.coord.row - theCoord.row) * this.provider.tileHeight * scale);
                        tile.style.left = parseInt(tx) + 'px'; 
                        tile.style.top = parseInt(ty) + 'px'; 
                        tile.width = this.provider.tileWidth * scale;
                        tile.height = this.provider.tileHeight * scale;
                    }
                    else {
                        tile.width = this.provider.tileWidth;
                        tile.height = this.provider.tileHeight;                    
                    }
                }
            }
            
        }
        
        //console.log('--- end draw ' + onlyThisLayer);
    },
    
    redrawTimer: undefined,
    
    requestTile: function(tileCoord) {
        var tileKey = tileCoord.toString();
        if (!this.requestedTiles[tileKey]) {
            var tile = new Image()
            tile.id = tileKey
            tile.coord = tileCoord.copy();
            tile.src = this.provider.getTileUrl(tileCoord)
            tile.width = this.provider.tileWidth
            tile.height = this.provider.tileHeight
            tile.style.position = 'absolute'
            this.requestedTiles[tileKey] = tile
            var theMap = this
            var theTiles = this.tiles
            var theRequestedTiles = this.requestedTiles
            function loadComplete() {
                delete theRequestedTiles[tileKey]
                theTiles[tileKey] = tile
                // TODO: can we position the tile here instead of redrawing all tiles?
                theMap.draw(true)
                if (theMap.redrawTimer) clearTimeout(redrawTimer);
                function redraw() {
                    theMap.draw(true);
                    theMap = null;
                }
                redrawTimer = setTimeout(redraw, 1000);
                // tidy closure?
                theTiles = null;
                theRequestedTiles = null;
                tile = null;
            }
            tile.onload = loadComplete;
            tile.onerror = loadComplete;
        }
    }
        
}
