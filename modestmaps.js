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
        if (!distance) distance = 1;
        return new Coordinate(this.row - distance, this.column, this.zoom)
    },

    right: function(distance) {
        if (!distance) distance = 1;
        return new Coordinate(this.row, this.column + distance, this.zoom)
    },

    down: function(distance) {
        if (!distance) distance = 1;
        return new Coordinate(this.row + distance, this.column, this.zoom)
    },

    left: function(distance) {
        if (!distance) distance = 1;
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

function MapProvider() {
    alert("Abstract method not implemented by subclass.")
}

MapProvider.prototype = {
    projection: null,

    getTileUrls: function(coordinate) {
        alert("Abstract method not implemented by subclass.")
    },

    tileWidth: function() {
        alert("Abstract method not implemented by subclass.")
    },
    
    tileHeight: function() {
        alert("Abstract method not implemented by subclass.")
    },
    
    locationCoordinate: function(location) {
        return this.projection.locationCoordinate(location)
    },

    coordinateLocation: function(location) {
        return this.projection.coordinateLocation(location)
    },

    sourceCoordinate: function(coordinate) {
        alert("Abstract method not implemented by subclass.")
    },

    sourceCoordinate: function(coordinate) {
        var wrappedColumn = coordinate.column % Math.pow(2, coordinate.zoom)

        while (wrappedColumn < 0)
            wrappedColumn += Math.pow(2, coordinate.zoom)
            
        return new Coordinate(coordinate.row, wrappedColumn, coordinate.zoom)
    }
}

function BlueMarbleProvider() {
    var t = new Transformation(1.068070779e7, 0, 3.355443185e7,
		                       0, -1.068070890e7, 3.355443057e7)
    this.projection = new MercatorProjection(26, t)
}

BlueMarbleProvider.prototype = {
    tileWidth: function() {
        return 256
    },
    tileHeight: function() {
        return 256
    },
    getTileUrls: function(coordinate) {
        var img = coordinate.zoom.toFixed(0) +'-r'+ coordinate.row.toFixed(0) +'-c'+ coordinate.column.toFixed(0) + '.jpg';
        return 'http://s3.amazonaws.com/com.modestmaps.bluemarble/' + img;
    }
}

extend(BlueMarbleProvider, MapProvider);

//////////////////////////// Map

function calculateMapCenter(provider, centerCoord) {
    /* Based on a center coordinate, returns the coordinate
        of an initial tile and its point placement, relative to
        the map center.
    */

    // initial tile coordinate
    var initTileCoord = centerCoord.container()

    // initial tile position, assuming centered tile well in grid
    initX = (initTileCoord.column - centerCoord.column) * provider.tileWidth()
    initY = (initTileCoord.row - centerCoord.row) * provider.tileHeight()
    initPoint = new Point(Math.round(initX), Math.round(initY))
    
    return [ initTileCoord, initPoint ]
}

function calculateMapExtent(provider, width, height, locations) {

    var coordinates = new Array();
    
    var TL, BR;
    for (var i = 0; i < locations.length; i++) {
        coordinates[i] = provider.locationCoordinate(locations[i])
        if (TL) {
            TL.row = Math.min(TL.row, coordinates[i].row);
            TL.column = Math.min(TL.column, coordinates[i].column);
            TL.zoom = Math.min(TL.zoom, coordinates[i].zoom);
            BR.row = Math.max(BR.row, coordinates[i].row);
            BR.column = Math.max(BR.column, coordinates[i].column);
            BR.zoom = Math.max(BR.zoom, coordinates[i].zoom);
        }
        else {
            TL = coordinates[i].copy();
            BR = coordinates[i].copy();
        }
    }
    
    // multiplication factor between horizontal span and map width
    var hFactor = (BR.column - TL.column) / (width / provider.tileWidth())

    // multiplication factor expressed as base-2 logarithm, for zoom difference
    var hZoomDiff = Math.log(hFactor) / Math.log(2)
        
    // possible horizontal zoom to fit geographical extent in map width
    var hPossibleZoom = TL.zoom - Math.ceil(hZoomDiff)
        
    // multiplication factor between vertical span and map height
    var vFactor = (BR.row - TL.row) / (height / provider.tileHeight())
        
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
    centerCoord = new Coordinate(centerRow, centerColumn, centerZoom).zoomTo(initZoom)
    
    return calculateMapCenter(provider, centerCoord)
}


function Map(parent, provider, dimensions, coordinate, offset) {
    /* Instance of a map intended for drawing to a div.
    
        parent
            DOM element
    
        provider
            Instance of IMapProvider
            
        dimensions
            Size of output image, instance of Point
            
        coordinate
            Base tile, instance of Coordinate
            
        offset
            Position of base tile relative to map center, instance of Point
    */
    if (typeof parent == 'string') {
        parent = document.getElementById(parent)
    }
    this.parent = parent
    
    parent.style.position = 'relative';
    parent.style.width = dimensions.x + 'px';
    parent.style.height = dimensions.y + 'px';
    //parent.style.border = '1px solid red';
    parent.style.overflow = 'hidden'
    
    // TODO addEvent        
    this.parent.onmousedown = this.getMouseDown()
    
    this.provider = provider
    this.dimensions = dimensions
    this.coordinate = coordinate || new Coordinate(0,0,0)
    this.offset = offset || new Point(-128,-128)
    this.tiles = {}
    this.requestedTiles = {}
}

Map.prototype = {

    parent: null,
    provider: null,
    dimensions: null,
    coordinate: null,
    offset: null,

    tiles: null,
    requestedTiles: null,

    toString: function() {
        return 'Map(' + provider.toString() + dimensions + coordinate.toString() + offset.toString();
    },

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
        this.coordinate.column -= this.offset.x / this.provider.tileWidth();
        this.coordinate.row -= this.offset.y / this.provider.tileHeight();
        this.coordinate = this.coordinate.zoomBy(zoomOffset);
        var container = this.coordinate.container();
        this.offset.x = (container.column - this.coordinate.column) * this.provider.tileWidth()
        this.offset.y = (container.row - this.coordinate.row) * this.provider.tileHeight()
        this.coordinate = container;
        this.draw();
    },
    
    setCenter: function(location) {
        this.setCenterZoom(location, this.coordinate.zoom);
    },
    
    setCenterZoom: function(location, zoom) {
        this.coordinate = this.provider.locationCoordinate(location).zoomTo(zoom);
        console.log(this.coordinate);
        var container = this.coordinate.container();
        this.offset.x = (container.column - this.coordinate.column) * this.provider.tileWidth()
        this.offset.y = (container.row - this.coordinate.row) * this.provider.tileHeight()
        this.coordinate = container;
        this.draw();
    },
    
    panBy: function(dx, dy) {
        this.offset.x += dx;
        this.offset.y += dy;
        this.draw();
    },
    
    locationPoint: function(location) {
        /* Return an x, y point on the map image for a given geographical location. */
        
        var point = new Point(this.offset.x, this.offset.y)
        var coord = this.provider.locationCoordinate(location).zoomTo(this.coordinate.zoom)
        
        // distance from the known coordinate offset
        point.x += this.provider.tileWidth() * (coord.column - this.coordinate.column)
        point.y += this.provider.tileHeight() * (coord.row - this.coordinate.row)
        
        // because of the center/corner business
        point.x += this.dimensions.x/2
        point.y += this.dimensions.y/2
        
        return point
    },
    
    pointLocation: function(point) {
        /* Return a geographical location on the map image for a given x, y point. */
        
        var hizoomCoord = this.coordinate.zoomTo(Coordinate.MAX_ZOOM)
        
        // because of the center/corner business
        point = new Point(point.x - this.dimensions.x/2,
                           point.y - this.dimensions.y/2)
        
        // distance in tile widths from reference tile to point
        var xTiles = (point.x - this.offset.x) / this.provider.tileWidth();
        var yTiles = (point.y - this.offset.y) / this.provider.tileHeight();
        
        // distance in rows & columns at maximum zoom
        var xDistance = xTiles * Math.pow(2, (Coordinate.MAX_ZOOM - this.coordinate.zoom));
        var yDistance = yTiles * Math.pow(2, (Coordinate.MAX_ZOOM - this.coordinate.zoom));
        
        // new point coordinate reflecting that distance
        var coord = new Coordinate(Math.round(hizoomCoord.row + yDistance),
                                   Math.round(hizoomCoord.column + xDistance),
                                   hizoomCoord.zoom)

        coord = coord.zoomTo(this.coordinate.zoom)
        
        var location = this.provider.coordinateLocation(coord)
        
        return location
    },
    
    draw: function() {
        
        while (this.offset.x <= -this.provider.tileWidth()) {
            this.coordinate = this.coordinate.right();
            this.offset.x += this.provider.tileWidth();
        }
        while (this.offset.y <= -this.provider.tileHeight()) {
            this.coordinate = this.coordinate.down();
            this.offset.y += this.provider.tileHeight();
        }
        while (this.offset.x > 0) {
            this.coordinate = this.coordinate.left();
            this.offset.x -= this.provider.tileWidth();
        }
        while (this.offset.y > 0) {
            this.coordinate = this.coordinate.up();
            this.offset.y -= this.provider.tileHeight();
        }
        
        // so this is the center, taking the offset into account
        var coord = this.coordinate.copy()
        var corner = new Point(Math.floor(this.offset.x + this.dimensions.x/2), Math.floor(this.offset.y + this.dimensions.y/2))

        // get back to the top left
        while (corner.x > 0) {
            corner.x -= this.provider.tileWidth()
            coord = coord.left()
        }
        while (corner.y > 0) {
            corner.y -= this.provider.tileHeight()
            coord = coord.up()
        }

        var wantedTiles = {};
        
        var rowCoord = coord.copy()
        for (var y = corner.y; y < this.dimensions.y; y += this.provider.tileHeight()) {
            var tileCoord = rowCoord.copy()
            for (var x = corner.x; x < this.dimensions.x; x += this.provider.tileWidth()) {
                var tileKey = tileCoord.toString();
                wantedTiles[tileKey] = true;
                if (!this.tiles[tileKey]) {
                    if (!this.requestedTiles[tileKey]) {
                        this.requestTile(tileCoord);
                    }
                }
                else {
                    var tile = this.tiles[tileKey];
                    if (!document.getElementById(tileKey)) {
                        tile.style.position = 'absolute'
                        this.parent.appendChild(tile)
                    }
                    tile.style.left = x + 'px'
                    tile.style.top = y + 'px'
                }
                tileCoord = tileCoord.right()
            }
            rowCoord = rowCoord.down()
        }
        
        var visibleTiles = this.parent.getElementsByTagName('img');
        var condemnedTiles = new Array()
        for (var i = visibleTiles.length-1; i >= 0; i--) {
            if (!wantedTiles[visibleTiles[i].id]) {
                condemnedTiles.push(visibleTiles[i]);
            }
        }
        
        while (condemnedTiles.length > 0) {
            this.parent.removeChild(condemnedTiles.pop());        
        }
    },
    
    requestTile: function(tileCoord) {
        var tileKey = tileCoord.toString();
        if (!this.requestedTiles[tileKey]) {
            var tile = new Image()
            tile.id = tileKey;
            tile.src = this.provider.getTileUrls(tileCoord)
            tile.width = this.provider.tileWidth()
            tile.height = this.provider.tileHeight()
            this.requestedTiles[tileKey] = tile;
            var theMap = this;
            var theTiles = this.tiles;
            var theRequestedTiles = this.requestedTiles;
            tile.onload = function() {
                theTiles[tileKey] = tile;
                delete theRequestedTiles[tileKey];
                theMap.draw()
                if (tile.style.opacity) {
                    tile.style.opacity = 0;
                    tile.interval = setInterval(theMap.fadeTile, 25, tile);
                }
            }
        }
    },
    
    fadeTile: function(tile) {
        if (tile.style.opacity < 1) {
            tile.style.opacity = parseFloat(tile.style.opacity) + 0.05;
        }
        else {
            tile.style.opacity = 1;
            clearInterval(tile.interval);
        }
    }
    
}
