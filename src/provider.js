
    // Providers
    // ---------
    // Providers provide tile URLs and possibly elements for layers.
    MM.MapProvider = function(getTileUrl) {
        if (getTileUrl) {
            this.getTileUrl = getTileUrl;
        }
    };

    MM.MapProvider.prototype = {
        // defaults to Google-y Mercator style maps
        projection: new MM.MercatorProjection( 0, 
                        MM.deriveTransformation(-Math.PI,  Math.PI, 0, 0, 
                                                 Math.PI,  Math.PI, 1, 0, 
                                                -Math.PI, -Math.PI, 0, 1) ),
                    
        tileWidth: 256,
        tileHeight: 256,
        
        // these are limits for available *tiles*
        // panning limits will be different (since you can wrap around columns)
        // but if you put Infinity in here it will screw up sourceCoordinate
        topLeftOuterLimit: new MM.Coordinate(0,0,0),
        bottomRightInnerLimit: new MM.Coordinate(1,1,0).zoomTo(18),
        
        getTileUrl: function(coordinate) {
            throw "Abstract method not implemented by subclass.";
        },

        getTile: function(coordinate)
        {
            console && console.log("Abstract method not implemented by subclass.");
        },
        
        releaseTile: function(element)
        {
            console && console.log("Abstract method not implemented by subclass.");
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

        // use this to tell MapProvider  that tiles only exist between certain zoom levels.
        // Map will respect thse zoom limits and not allow zooming outside this range
        setZoomRange: function(minZoom, maxZoom) {
            this.topLeftOuterLimit = this.topLeftOuterLimit.zoomTo(minZoom);
            this.bottomRightInnerLimit = this.bottomRightInnerLimit.zoomTo(maxZoom);
        },
    
        sourceCoordinate: function(coord) {
            var TL = this.topLeftOuterLimit.zoomTo(coord.zoom);
            var BR = this.bottomRightInnerLimit.zoomTo(coord.zoom);
            var vSize = BR.row - TL.row;
            if (coord.row < 0 | coord.row >= vSize) {
                // it's too high or too low:
                return null;
            }
            var hSize = BR.column - TL.column;
            // assume infinite horizontal scrolling
            var wrappedColumn = coord.column % hSize;
            while (wrappedColumn < 0) {
                wrappedColumn += hSize;
            }
            return new MM.Coordinate(coord.row, wrappedColumn, coord.zoom);
        }
    };
    
    // A simple tileprovider builder that supports `XYZ`-style tiles.
    MM.TemplatedMapProvider = function(template, subdomains)
    {
        var getTileUrl = function(coordinate)
        {
            coordinate = this.sourceCoordinate(coordinate);
            if (!coordinate) {
                return null;
            }
            var base = template;
            if (subdomains && subdomains.length && base.indexOf("{S}") >= 0) {
                var subdomain = parseInt(coordinate.zoom + coordinate.row + coordinate.column, 10) % subdomains.length;
                base = base.replace('{S}', subdomains[subdomain]);
            }
            return base
                .replace('{Z}', coordinate.zoom.toFixed(0))
                .replace('{X}', coordinate.column.toFixed(0))
                .replace('{Y}', coordinate.row.toFixed(0));
        }
    
        MM.MapProvider.call(this, getTileUrl);
    };

    MM.extend(MM.TemplatedMapProvider, MM.MapProvider);
    
   /**
    * Possible new kind of provider that deals in elements.
    */
    MM.TilePaintingProvider = function(template_provider)
    {
        this.template_provider = template_provider;
    }
    
    MM.TilePaintingProvider.prototype = {
    
        getTile: function(coord)
        {
            return this.template_provider.getTileUrl(coord);
        },
        
        releaseTile: function(coord)
        {
        }
    }
    
    MM.extend(MM.TilePaintingProvider, MM.MapProvider);
