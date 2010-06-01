/*!
 * Modest Maps JS v0.9.3
 * http://modestmaps.com/
 *
 * Copyright (c) 2010 Stamen Design, All Rights Reserved.
 *
 * Open source under the BSD License.
 * http://creativecommons.org/licenses/BSD/
 *
 * Versioned using Semantic Versioning.
 * See http://semver.org/ for details.
 * 
 */

// namespacing!
if (!com) {
    var com = { };
    if (!com.modestmaps) {
        com.modestmaps = {};
    }
}

(function(MM) {

    //////////////////////////// Make inheritance bearable
    
    MM.extend = function(child, parent) {
        for (var property in parent.prototype) {
            if (typeof child.prototype[property] == "undefined") {
                child.prototype[property] = parent.prototype[property];
            }
        }
        return child;
    };
    
    /////////////////////////// Eeeeeeeeeeeeeeeeeeeeeevents
    
    MM.cancelEvent = function(e) {
        //console.log('cancel: ' + e);
        // there's more than one way to skin this cat
        e.cancelBubble = true;
        e.cancel = true;
        e.returnValue = false;
        if (e.stopPropagation) { e.stopPropagation(); }
        if (e.preventDefault) { e.preventDefault(); }
        return false;
    };
    
    // see http://ejohn.org/apps/jselect/event.html for the originals
    
    MM.addEvent = function(obj, type, fn) {
        if (obj.attachEvent) {
            obj['e'+type+fn] = fn;
            obj[type+fn] = function(){ obj['e'+type+fn](window.event); };
            obj.attachEvent('on'+type, obj[type+fn]);
        }
        else {
            obj.addEventListener(type, fn, false);
            if (type == 'mousewheel') {
                obj.addEventListener('DOMMouseScroll', fn, false);
            }
        }
    };
    
    MM.removeEvent = function( obj, type, fn ) {
        if ( obj.detachEvent ) {
            obj.detachEvent('on'+type, obj[type+fn]);
            obj[type+fn] = null;
        }
        else {
            obj.removeEventListener(type, fn, false);
            if (type == 'mousewheel') {
                obj.removeEventListener('DOMMouseScroll', fn, false);
            }
        }
    };
    
    /////////////////////////////
        
    MM.getStyle = function(el,styleProp) {
        if (el.currentStyle)
            var y = el.currentStyle[styleProp];
        else if (window.getComputedStyle)
            var y = document.defaultView.getComputedStyle(el,null).getPropertyValue(styleProp);
        return y;
    }
    
    //////////////////////////// Core
    
    MM.Point = function(x, y) {
        this.x = parseFloat(x);
        this.y = parseFloat(y);
    };
    
    MM.Point.prototype = {
        x: 0,
        y: 0,
        toString: function() {
            return "(" + this.x.toFixed(3) + ", " + this.y.toFixed(3) + ")";
        }
    };
    
    MM.Coordinate = function(row, column, zoom) {
        this.row = row;
        this.column = column;
        this.zoom = zoom;
    };
    
    MM.Coordinate.prototype = {
    
        row: 0,
        column: 0,
        zoom: 0,
    
        toString: function() {
            return "(" + this.row.toFixed(3) + ", "
                       + this.column.toFixed(3) + " @"
                       + this.zoom.toFixed(3) + ")";
        },
    
        /* hopfully/somewhat optimized because firebug 
           said we were spending a lot of time in toString() */
        toKey: function() {
            var a = Math.floor(this.row);
            var b = Math.floor(this.column);
            var c = Math.floor(this.zoom);
            a=a-b;	a=a-c;	a=a^(c >>> 13);
            b=b-c;	b=b-a;	b=b^(a << 8); 
            c=c-a;	c=c-b;	c=c^(b >>> 13);
            a=a-b;	a=a-c;	a=a^(c >>> 12);
            b=b-c;	b=b-a;	b=b^(a << 16);
            c=c-a;	c=c-b;	c=c^(b >>> 5);
            a=a-b;	a=a-c;	a=a^(c >>> 3);
            b=b-c;	b=b-a;	b=b^(a << 10);
            c=c-a;	c=c-b;	c=c^(b >>> 15);
            return c;
        },
    
        copy: function() {
            return new MM.Coordinate(this.row, this.column, this.zoom);
        },
    
        container: function() {
            // using floor here (not parseInt, ~~) because we want -0.56 --> -1
            return new MM.Coordinate(Math.floor(this.row), 
                                     Math.floor(this.column), 
                                     Math.floor(this.zoom));
        },
    
        zoomTo: function(destination) {
            var power = Math.pow(2, destination - this.zoom);
            return new MM.Coordinate(this.row * power,
                                     this.column * power,
                                     destination);
        },
        
        zoomBy: function(distance) {
            var power = Math.pow(2, distance);
            return new MM.Coordinate(this.row * power,
                                     this.column * power,
                                     this.zoom + distance);
        },
    
        up: function(dist) {
            if (dist === undefined)	dist = 1;
            return new MM.Coordinate(this.row - dist, this.column, this.zoom);
        },
    
        right: function(dist) {
            if (dist === undefined) dist = 1;
            return new MM.Coordinate(this.row, this.column + dist, this.zoom);
        },
    
        down: function(dist) {
            if (dist === undefined) dist = 1;
            return new MM.Coordinate(this.row + dist, this.column, this.zoom);
        },
    
        left: function(dist) {
            if (dist === undefined) dist = 1;
            return new MM.Coordinate(this.row, this.column - dist, this.zoom);
        }
    };
    
    //////////////////////////// Geo
    
    MM.Location = function(lat, lon) {
        this.lat = parseFloat(lat);
        this.lon = parseFloat(lon);
    };
    
    MM.Location.prototype = {
        lat: 0,
        lon: 0,
        toString: function() {
            return "(" + this.lat.toFixed(3) + ", " + this.lon.toFixed(3) + ")";
        }
    };
    
    MM.Transformation = function(ax, bx, cx, ay, by, cy) {
        this.ax = ax;
        this.bx = bx;
        this.cx = cx;
        this.ay = ay;
        this.by = by;
        this.cy = cy;
    };

    MM.Transformation.prototype = {
    
        ax: 0, 
        bx: 0, 
        cx: 0, 
        ay: 0, 
        by: 0, 
        cy: 0,
        
        transform: function(point) {
            return new MM.Point(this.ax*point.x + this.bx*point.y + this.cx,
                                this.ay*point.x + this.by*point.y + this.cy);
        },
                             
        untransform: function(point) {
            return new MM.Point((point.x*this.by - point.y*this.bx 
                               - this.cx*this.by + this.cy*this.bx) 
                              / (this.ax*this.by - this.ay*this.bx),
                                (point.x*this.ay - point.y*this.ax
                               - this.cx*this.ay + this.cy*this.ax)
                              / (this.bx*this.ay - this.by*this.ax));
        }
        
    };

    
    MM.deriveTransformation = function(a1x, a1y, a2x, a2y, 
                                       b1x, b1y, b2x, b2y, 
                                       c1x, c1y, c2x, c2y) {
        // Generates a transform based on three pairs of points, 
        // a1 -> a2, b1 -> b2, c1 -> c2.
        var x = MM.linearSolution(a1x, a1y, a2x, 
                                  b1x, b1y, b2x, 
                                  c1x, c1y, c2x);
        var y = MM.linearSolution(a1x, a1y, a2y, 
                                  b1x, b1y, b2y, 
                                  c1x, c1y, c2y);
        return new MM.Transformation(x[0], x[1], x[2], y[0], y[1], y[2]);
    };
    
    MM.linearSolution = function(r1, s1, t1, r2, s2, t2, r3, s3, t3) {
        /* Solves a system of linear equations.

          t1 = (a * r1) + (b + s1) + c
          t2 = (a * r2) + (b + s2) + c
          t3 = (a * r3) + (b + s3) + c

        r1 - t3 are the known values.
        a, b, c are the unknowns to be solved.
        returns the a, b, c coefficients.
        */

        // make them all floats
        r1 = parseFloat(r1);
        s1 = parseFloat(s1);
        t1 = parseFloat(t1);
        r2 = parseFloat(r2);
        s2 = parseFloat(s2);
        t2 = parseFloat(t2);
        r3 = parseFloat(r3);
        s3 = parseFloat(s3);
        t3 = parseFloat(t3);

        var a = (((t2 - t3) * (s1 - s2)) - ((t1 - t2) * (s2 - s3)))
              / (((r2 - r3) * (s1 - s2)) - ((r1 - r2) * (s2 - s3)));

        var b = (((t2 - t3) * (r1 - r2)) - ((t1 - t2) * (r2 - r3))) 
              / (((s2 - s3) * (r1 - r2)) - ((s1 - s2) * (r2 - r3)));

        var c = t1 - (r1 * a) - (s1 * b);
    
        return [ a, b, c ];
    };
    
    MM.Projection = function(zoom, transformation) {
        if (!transformation) {
            transformation = new MM.Transformation(1, 0, 0, 0, 1, 0);
        }
        this.zoom = zoom;
        this.transformation = transformation;
    };
    
    MM.Projection.prototype = {
    
        zoom: 0,
        transformation: null,
        
        rawProject: function(point) {
            alert("Abstract method not implemented by subclass.");
        },
            
        rawUnproject: function(point) {
            alert("Abstract method not implemented by subclass.");
        },
    
        project: function(point) {
            point = this.rawProject(point);
            if(this.transformation) {
                point = this.transformation.transform(point);
            }
            return point;
        },
        
        unproject: function(point) {
            if(this.transformation) {
                point = this.transformation.untransform(point);
            }
            point = this.rawUnproject(point);
            return point;
        },
            
        locationCoordinate: function(location) {
            var point = new MM.Point(Math.PI * location.lon / 180.0, 
                                     Math.PI * location.lat / 180.0);
            point = this.project(point);
            return new MM.Coordinate(point.y, point.x, this.zoom);
        },
    
        coordinateLocation: function(coordinate) {
            coordinate = coordinate.zoomTo(this.zoom);
            var point = new MM.Point(coordinate.column, coordinate.row);
            point = this.unproject(point);
            return new MM.Location(180.0 * point.y / Math.PI,
                                   180.0 * point.x / Math.PI);
        }
    };
    
    MM.LinearProjection = function(zoom, transformation) {
        MM.Projection.call(this, zoom, transformation);
    };
    
    MM.LinearProjection.prototype = {
        rawProject: function(point) {
            return new MM.Point(point.x, point.y);
        },
        rawUnproject: function(point) {
            return new MM.Point(point.x, point.y);
        }
    };
    
    MM.extend(MM.LinearProjection, MM.Projection);
    
    MM.MercatorProjection = function(zoom, transformation) {
        // super!
        MM.Projection.call(this, zoom, transformation);
    };
    
    MM.MercatorProjection.prototype = {
        rawProject: function(point) {
            return new MM.Point(point.x,
                         Math.log(Math.tan(0.25 * Math.PI + 0.5 * point.y)));
        },
    
        rawUnproject: function(point) {
            return new MM.Point(point.x,
                    2 * Math.atan(Math.pow(Math.E, point.y)) - 0.5 * Math.PI);
        }
    };
    
    MM.extend(MM.MercatorProjection, MM.Projection);
    
    //////////////////////////// Providers
    
    MM.MapProvider = function(getTileUrl) {
        if (getTileUrl) {
            this.getTileUrl = getTileUrl;
        }
    };
    
    MM.MapProvider.prototype = {
    
        // defaults to Google-y Mercator style maps
        // (for how to generate these magic numbers
        // see http://modestmaps.com/calculator.html)
        projection: new MM.MercatorProjection(
                        26, 
                        new MM.Transformation(1.068070779e7, 0, 3.355443185e7,
                                              0, -1.068070890e7, 3.355443057e7)
                    ),
                    
        tileWidth: 256,
        tileHeight: 256,
        
        topLeftOuterLimit: new MM.Coordinate(0,0,0),
        bottomRightInnerLimit: new MM.Coordinate(1,1,0).zoomTo(18),
        
        getTileUrl: function(coordinate) {
            alert("Abstract method not implemented by subclass.");
        },
        
        locationCoordinate: function(location) {
            return this.projection.locationCoordinate(location);
        },
    
        coordinateLocation: function(location) {
            return this.projection.coordinateLocation(location);
        },
        
        outerLimits: function() {
            return [ this.topLeftOuterLimit.copy(), 
                     this.bottomRightInnerLimit.copy() ];
        },
    
        sourceCoordinate: function(coord) {
            // TODO: fix this function for linear projections
            var size = Math.pow(2, coord.zoom);
            // assume infinite horizontal scrolling
            if (coord.row >= 0 && coord.row < size) {
                var wrappedColumn = coord.column % size;
                while (wrappedColumn < 0) {
                    wrappedColumn += size;
                }
                return new MM.Coordinate(coord.row, wrappedColumn, coord.zoom);
            }
            // otherwise it's too high or too low:
            return null;
        }
    };
    
    MM.TemplatedMapProvider = function(template, subdomains) {
        MM.MapProvider.call(this, function(coordinate) {
            coordinate = this.sourceCoordinate(coordinate);
            if (!coordinate) {
                return null;
            }
            var base = template;
            if (subdomains && subdomains.length && base.indexOf("{S}") >= 0) {
                var subdomain = parseInt(coordinate.zoom + coordinate.row + coordinate.column) % subdomains.length;
                base = base.replace('{S}', subdomains[subdomain]);
            }
            return base.replace('{Z}', coordinate.zoom.toFixed(0)).replace('{X}', coordinate.column.toFixed(0)).replace('{Y}', coordinate.row.toFixed(0));
        });
    };
    
    MM.extend(MM.TemplatedMapProvider, MM.MapProvider);
    
    
    //////////////////////////// Event Handlers

    // map is optional here, use init if you don't have a map yet
    MM.MouseHandler = function(map) { 
        if (map !== undefined) {
            this.init(map);
        }
    };
    
    MM.MouseHandler.prototype = {
    
        init: function(map) {
            this.map = map;
            MM.addEvent(map.parent, 'dblclick', this.getDoubleClick());
            MM.addEvent(map.parent, 'mousedown', this.getMouseDown());
            MM.addEvent(map.parent, 'mousewheel', this.getMouseWheel());            
        },
        
        mouseDownHandler: null,
    
        getMouseDown: function() {
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
            if (!this.mouseMoveHandler) {
                var theHandler = this;
                this.mouseMoveHandler = function(e) {
        
                    if (theHandler.prevMouse) {
                        theHandler.map.panBy(e.clientX - theHandler.prevMouse.x, e.clientY - theHandler.prevMouse.y);
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
        },
        
        mouseWheelHandler: null,
    
        getMouseWheel: function() {
            if (!this.mouseWheelHandler) {
                var theHandler = this;
                var prevTime = new Date().getTime();
                this.mouseWheelHandler = function(e) {
        
                    var delta = 0;
                    
                    if (e.wheelDelta) {
                        delta = e.wheelDelta;
                    }
                    else if (e.detail) {
                        delta = -e.detail;
                    }
        
                    // limit mousewheeling to once every 200ms
                    var timeSince = new Date().getTime() - prevTime;
        
                    if (Math.abs(delta) > 0 && (timeSince > 200)) {
                        
                        var point = theHandler.getMousePoint(e);
                        
                        theHandler.map.zoomByAbout(delta > 0 ? 1 : -1, point);
                        
                        prevTime = new Date().getTime();
                    }
                    
                    return MM.cancelEvent(e);
                };
            }
            return this.mouseWheelHandler;
        },
    
        doubleClickHandler: null,
    
        getDoubleClick: function() {
            if (!this.doubleClickHandler) {
                var theHandler = this;
                this.doubleClickHandler = function(e) {
        
                    var point = theHandler.getMousePoint(e);
                    
                    // use shift-double-click to zoom out
                    theHandler.map.zoomByAbout(e.shiftKey ? -1 : 1, point);    
                    
                    return MM.cancelEvent(e);
                };
            }
            return this.doubleClickHandler;
        },
    
        // interaction helper
    
        getMousePoint: function(e)
        {
            // start with just the mouse (x, y)
            var point = new MM.Point(e.clientX, e.clientY);
            
            // correct for scrolled document
            point.x += document.body.scrollLeft + document.documentElement.scrollLeft;
            point.y += document.body.scrollTop + document.documentElement.scrollTop;
    
            // correct for nested offsets in DOM
            for(var node = this.map.parent; node; node = node.offsetParent) {
                point.x -= node.offsetLeft;
                point.y -= node.offsetTop;
            }
            
            return point;
        }
    
    };
    
    //////////////////////////// Map
    
    MM.Map = function(parent, provider, dimensions, eventHandlers) {
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
    
        // add an invisible layer so that image.onload will have a srcElement in IE6
        this.loadingLayer = document.createElement('div');
        this.loadingLayer.id = this.parent.id+'-loading-layer';
        this.loadingLayer.style.display = 'none';
        this.parent.appendChild(this.loadingLayer);
    
        this.layers = {};

        this.layerParent = document.createElement('div');
        this.layerParent.id = this.parent.id+'-layers';
        this.layerParent.style.margin = '0';
        this.layerParent.style.padding = '0';
        this.layerParent.style.width = '100%';
        this.layerParent.style.height = '100%';
        this.layerParent.style.position = 'absolute';
        this.layerParent.style.top = '0px';
        this.layerParent.style.left = '0px';
        this.layerParent.style.zIndex = '0';
        this.parent.appendChild(this.layerParent);
    
        this.coordinate = new MM.Coordinate(0.5,0.5,0);
        
        this.setProvider(provider);
        
        this.callbacks = { zoomed: [], panned: [], centered: [], extentset: [], resized: [] };
    };
    
    MM.Map.prototype = {
    
        parent: null,
        provider: null,
        dimensions: null,
        coordinate: null,
    
        tiles: null,
        requestedTiles: null,
        layers: null,
        layerParent: null,
        loadingLayer: null,
    
        requestCount: null,
        maxSimultaneousRequests: null,
        requestQueue: null,
        
        tileCacheSize: null,
        
        maxTileCacheSize: null,
        recentTiles: null,
        recentTilesById: null,
        
        callbacks: null,
        eventHandlers: null,
    
        toString: function() {
            return 'Map(' + this.provider.toString() + this.dimensions.toString() + this.coordinate.toString() + ')';
        },
        
        addCallback: function(event, callback)
        {
            if (typeof(callback) == 'function' && this.callbacks[event]) {
                this.callbacks[event].push(callback);
            }
        },
        
        dispatchCallback: function(event, message)
        {
            if(this.callbacks[event]) {
                for (var i = 0; i < this.callbacks[event].length; i += 1) {
                    try {
                        this.callbacks[event][i](this, message);
                    } catch(e) {
                        // meh
                    }
                }
            }
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
            var location = this.pointLocation(point);
            this.zoomBy(zoomOffset);
            var newPoint = this.locationPoint(location);
            this.panBy(point.x - newPoint.x, point.y - newPoint.y);
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
            this.coordinate = this.provider.locationCoordinate(location).zoomTo(parseFloat(zoom) || 0);
            this.draw();
            this.dispatchCallback('centered', [location, zoom]);
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
            // initZoom = min(initZoom, provider.outerLimits()[1].zoom)
            // initZoom = max(initZoom, provider.outerLimits()[0].zoom)
        
            // coordinate of extent center
            var centerRow = (TL.row + BR.row) / 2;
            var centerColumn = (TL.column + BR.column) / 2;
            var centerZoom = TL.zoom;
            
            this.coordinate = new MM.Coordinate(centerRow, centerColumn, centerZoom).zoomTo(initZoom);
            this.draw();
    
            this.dispatchCallback('extentset', locations);
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
                // hasOwnProperty protects against prototype additions
                // "The standard describes an augmentable Object.prototype. 
                //  Ignore standards at your own peril."
                // -- http://www.yuiblog.com/blog/2006/09/26/for-in-intrigue/
                for (var tileKey in this.requestedTiles) {
                    if (this.requestedTiles.hasOwnProperty(tileKey)) {
                        var tile = this.requestedTiles[tileKey];
                        this.cancelTileRequest(tile);
                        tile = null;
                    }
                }
                
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
            this.requestedTiles = {};
        
            this.requestCount = 0;
            this.maxSimultaneousRequests = 4;
            this.requestQueue = [];
            
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
        },

        // stats
        
        getStats: function() {
            return {
                'Request Queue Length': this.requestQueue.length,
                'Open Request Count': this.requestCount,
                'Tile Cache Size': this.tileCacheSize,
                'Tiles On Screen': this.parent.getElementsByTagName('img').length
            };        
        },
        
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
            }
            return coord;
        },
        
        // rendering    
        
        draw: function() {
    
            this.coordinate = this.enforceLimits(this.coordinate);
    
            // so this is the corner, taking the container offset into account
            var baseCoord = this.coordinate.container();
            var baseCorner = new MM.Point(this.dimensions.x/2, this.dimensions.y/2);
            baseCorner.x += (baseCoord.column - this.coordinate.column) * this.provider.tileWidth;
            baseCorner.y += (baseCoord.row - this.coordinate.row) * this.provider.tileHeight;
    
            // get back to the top left
            while (baseCorner.x > 0) {
                baseCorner.x -= this.provider.tileWidth;
                baseCoord.column -= 1;
            }
            while (baseCorner.y > 0) {
                baseCorner.y -= this.provider.tileHeight;
                baseCoord.row -= 1;
            }
    
            var wantedTiles = { };
            
            var thisLayer = this.layers[baseCoord.zoom];
            if (!thisLayer) {
                thisLayer = this.createLayer(baseCoord.zoom);
            }
            thisLayer.coordinate = baseCoord.copy();
            
            var tileCoord = baseCoord.copy();
    
            // storing these locally might not be faster but it is clearer
            // [JSLitmus tests were inconclusive]
            var maxY = this.dimensions.y;
            var maxX = this.dimensions.x;
            var yStep = this.provider.tileHeight;
            var xStep = this.provider.tileWidth;
    
            for (var y = baseCorner.y; y < maxY; y += yStep) {
                for (var x = baseCorner.x; x < maxX; x += xStep) {
                    var tileKey = tileCoord.toKey();
                    wantedTiles[tileKey] = true;
                    if (!this.tiles[tileKey]) {
                        if (!this.requestedTiles[tileKey]) {
                            this.requestTile(tileCoord);
                        }
                        for (var pz = 1; pz <= 5; pz++) {
                            var parentKey = tileCoord.zoomBy(-pz).container().toKey();
                            wantedTiles[parentKey] = true;
                        }
                        var childCoord = tileCoord.zoomBy(1);
                        wantedTiles[childCoord.toKey()] = true;
                        childCoord.column += 1;
                        wantedTiles[childCoord.toKey()] = true;
                        childCoord.row += 1;
                        wantedTiles[childCoord.toKey()] = true;
                        childCoord.column -= 1;
                        wantedTiles[childCoord.toKey()] = true;
                    }
                    else {
                        var tile = this.tiles[tileKey];
                        if (tile.parentNode != thisLayer) {
                            thisLayer.appendChild(tile);
                        }
                    }
                    tileCoord.column += 1;
                }
                tileCoord.row += 1;
                tileCoord.column = baseCoord.column;
            }
            
            // i from i to zoom-5 are layers that would be scaled too big,
            // i from zoom+2 to layers.length are layers that would be 
            // scaled too small (and tiles would be too numerous)                
            for (var name in this.layers) {
                if (this.layers.hasOwnProperty(name)) {
                    var zoom = parseInt(name,10);
                    if (zoom >= baseCoord.zoom-5 && zoom < baseCoord.zoom+2) {
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
        
            // layers we want to see, if they have tiles in wantedTiles
            var minLayer = baseCoord.zoom-5;
            var maxLayer = baseCoord.zoom+2;
            for (var i = minLayer; i < maxLayer; i++) {

                var layer = this.layers[i];
                
                if (!layer) {
                    continue;
                }

                var theCoord = null;
                var scale = 1;

                if (layer.coordinate) {
                    layer.style.display = 'block';
                    theCoord = this.coordinate.zoomTo(layer.coordinate.zoom);
                    scale = Math.pow(2, this.coordinate.zoom - layer.coordinate.zoom);
                }
                else {
                    layer.style.display = 'none';
                }

                var visibleTiles = layer.getElementsByTagName('img');
                for (var j = visibleTiles.length-1; j >= 0; j--) {
                    var tile = visibleTiles[j];
                    if (!wantedTiles[tile.id]) {
                        layer.removeChild(tile);
                    }
                    else {
                        // position tiles (using theCoord if scaling is needed)
                        var tx = ((this.dimensions.x/2) + (tile.coord.column - theCoord.column) * this.provider.tileWidth * scale);
                        var ty = ((this.dimensions.y/2) + (tile.coord.row - theCoord.row) * this.provider.tileHeight * scale);
                        tile.style.left = tx + 'px'; 
                        tile.style.top = ty + 'px'; 
                        tile.width = this.provider.tileWidth * scale;
                        tile.height = this.provider.tileHeight * scale;
                        // log last-touched-time of currently cached tiles
                        this.recentTilesById[tile.id].lastTouchedTime = now;
                    }
                }
                
            }
    
            for (var tileKey in this.requestedTiles) {
                if (this.requestedTiles.hasOwnProperty(tileKey)) {
                    if (!(tileKey in wantedTiles)) {
                        var tile = this.requestedTiles[tileKey];
                        this.cancelTileRequest(tile);
                        tile = null;
                    }
                }
            }
            
            // get newly requested tiles
            this.processQueue();
            
            // make sure we don't have too much stuff
            this.checkCache();
        },
        
        redrawTimer: undefined,
        
        requestRedraw: function() {
            if (this.redrawTimer) clearTimeout(this.redrawTimer);
            this.redrawTimer = setTimeout(this.getRedraw(), 1000);
        },
    
        _redraw: null,
        
        getRedraw: function() {
            // let's only create this closure once...
            if (!this._redraw) {
                var theMap = this;
                this._redraw = function() {
                    theMap.draw();
                };
            }
            return this._redraw;
        },
        
        createLayer: function(zoom) {
            var layer = document.createElement('div');
            layer.id = this.parent.id+'-zoom-'+zoom;
            layer.style.margin = '0';
            layer.style.padding = '0';
            layer.style.width = '100%';
            layer.style.height = '100%';
            layer.style.position = 'absolute';
            layer.style.top = '0px';
            layer.style.left = '0px';
            layer.style.zIndex = zoom;
            this.layerParent.appendChild(layer);
            this.layers[zoom] = layer;
            return layer;
        },
        
        requestTile: function(tileCoord) {
            var tileKey = tileCoord.toKey();
            if (!this.requestedTiles[tileKey]) {
                // JSLitmus benchmark shows createElement is a little faster than
                // new Image() in Firefox and roughly the same in Safari:
                // http://tinyurl.com/y9wz2jj http://tinyurl.com/yes6rrt 
                var tile = document.createElement('img');
                // if there's no tileURL we still should't request this tile again
                this.requestedTiles[tileKey] = tile;
                var tileURL = this.provider.getTileUrl(tileCoord);
                if (tileURL) {
                    // FIXME: tileKey is technically not unique in document if there 
                    // are two Maps but toKey is supposed to be fast so we're trying 
                    // to avoid a prefix ... hence we can't use any calls to
                    // document.getElementById() to retrieve tiles
                    tile.id = tileKey;
                    tile.width = this.provider.tileWidth;
                    tile.height = this.provider.tileHeight;
                    tile.style.position = 'absolute';                
                    tile.coord = tileCoord.copy(); // FIXME: store this elsewhere to avoid scary memory leaks?
                    this.requestQueue.push({ tile: tile, url: tileURL });
                }
            }
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
                    return t2.lastTouchedTime - t1.lastTouchedTime;
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
        
        processQueue: function() {
            if (this.requestQueue.length > 8) {
                this.requestQueue.sort(this.getCenterDistanceCompare());
            }
            while (this.requestCount < this.maxSimultaneousRequests && this.requestQueue.length > 0) {
                var request = this.requestQueue.pop();
                if (request) {
                    this.requestCount++;
                    // add it to the DOM in a hidden layer, this is a bit of a hack, but it's
                    // so that the event we get in image.onload has srcElement assigned in IE6
                    this.loadingLayer.appendChild(request.tile);                
                    // set these before tile.src to avoid missing a tile that's already cached            
                    request.tile.onload = request.tile.onerror = this.getLoadComplete();
                    request.tile.src = request.url;
                    // keep things tidy
                    request.tile = request.url = null;
                }
            }
        },
    
        cancelTileRequest: function(tile) {
            // whether we've done the request or not...
            delete this.requestedTiles[tile.id];    
            if (tile.src) { // FIXME: what if the tile *should* have a null URL?
                tile.onload = tile.onerror = null;
                //delete tile['coord']; // causes an error in IE6
                tile.coord = null;
                // not sure if this is necessary, but hopefully it guarantees the tile stops loading?
                tile.src = null;
                // pull it back out of the DOM
                this.loadingLayer.removeChild(tile);
                // correct this...
                this.requestCount--;
            }
            else {
                for (var i = 0; i < this.requestQueue.length; i++) {
                    var request = this.requestQueue[i];
                    if (request && request.tile === tile) {
                        this.requestQueue[i] = null;
                        request.tile = request.tile.coord = request.url = null;
                    }
                }
            }
        },
        
        _loadComplete: null,
        
        getLoadComplete: function() {
            // let's only create this closure once...
            if (!this._loadComplete) {
                var theMap = this;
                this._loadComplete = function(e) {
                    // this is needed because we don't use MM.addEvent for tiles
                    e = e || window.event;
    
                    // srcElement for IE, target for FF, Safari etc.
                    var tile = e.srcElement || e.target;
    
                    // unset these straight away so we don't call this twice
                    tile.onload = tile.onerror = null;
    
                    // pull it back out of the (hidden) DOM 
                    // so that draw will add it correctly later
                    theMap.loadingLayer.removeChild(tile);
                    
                    theMap.requestCount--;
    
                    delete theMap.requestedTiles[tile.id];
    
                    // NB:- complete is also true onerror if we got a 404
                    if (tile.complete || 
                        (tile.readyState && tile.readyState == 'complete')) {

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

                        // add tile to its layer:
                        var theLayer = theMap.layers[tile.coord.zoom];
                        //if (!theLayer) {
                        //    theLayer = theMap.createLayer(tile.coord.zoom);
                        //}
                        theLayer.appendChild(tile);

                        // position this tile (avoids a draw() call):
                        var theCoord = theMap.coordinate.zoomTo(theLayer.coordinate.zoom);
                        var scale = Math.pow(2, theMap.coordinate.zoom - theLayer.coordinate.zoom);
                        var tx = ((theMap.dimensions.x/2) + (tile.coord.column - theCoord.column) * theMap.provider.tileWidth * scale);
                        var ty = ((theMap.dimensions.y/2) + (tile.coord.row - theCoord.row) * theMap.provider.tileHeight * scale);
                        tile.style.left = tx + 'px'; 
                        tile.style.top = ty + 'px'; 
                        tile.width = theMap.provider.tileWidth * scale;
                        tile.height = theMap.provider.tileHeight * scale;                    
                    }
                    else {
                        // if it didn't finish clear its src to make sure it 
                        // really stops loading
                        // FIXME: if we don't add it to theMap.tiles then we'll
                        // request it  again if and when the map moves
                        // - that's probably broken behaviour :(
                        tile.src = null;
                    }
                    
                    // keep going
                    theMap.processQueue();
                    
                    // request a lazy redraw of all layers 
                    // this will remove tiles that were only visible
                    // to cover this tile while it loaded:
                    theMap.requestRedraw();
                };
            }
            return this._loadComplete;
        },
        
        // compares manhattan distance from center of 
        // requested tiles to current map center
        getCenterDistanceCompare: function() {
            var theCoordinate = this.coordinate.copy();
            return function(r1, r2) {
                if (r1 && r2) {
                    var c1 = r1.tile.coord;
                    var c2 = r2.tile.coord;
                    var ds1 = Math.abs(theCoordinate.row - c1.row - 0.5) + 
                              Math.abs(theCoordinate.column - c1.column - 0.5);
                    var ds2 = Math.abs(theCoordinate.row - c2.row - 0.5) + 
                              Math.abs(theCoordinate.column - c2.column - 0.5);
                    return ds1 < ds2 ? 1 : ds1 > ds2 ? -1 : 0;
                }
                return r1 ? 1 : r2 ? -1 : 0;
            };
        }
        
    };

})(com.modestmaps);
