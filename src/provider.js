
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
        projection: new MM.MercatorProjection(0,
            MM.deriveTransformation(-Math.PI,  Math.PI, 0, 0,
                Math.PI,  Math.PI, 1, 0,
                -Math.PI, -Math.PI, 0, 1)),

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

        getTile: function(coordinate) {
            throw "Abstract method not implemented by subclass.";
        },

        releaseTile: function(element) {
            throw "Abstract method not implemented by subclass.";
        },

        locationCoordinate: function(location) {
            return this.projection.locationCoordinate(location);
        },

        coordinateLocation: function(coordinate) {
            return this.projection.coordinateLocation(coordinate);
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
        var isQuadKey = false;
        if (template.match(/{(Q|quadkey)}/)) {
            isQuadKey = true;
            // replace Microsoft style substitution strings
            template = template
                .replace('{subdomains}', '{S}')
                .replace('{zoom}', '{Z}')
                .replace('{quadkey}', '{Q}');
        }

        // parse subdomains from the URL template in the form:
        // {S:domain1,domain2,domain3}
        if (!subdomains && template.indexOf("{S:") > -1) {
            var match = template.match(/{S:([^}])*}/);
            if (match) {
                subdomains = match[1].split(",");
                template = template.replace(match[0], "{S}");
            }
        }

        var hasSubdomains = false;
        if (subdomains && subdomains.length && template.indexOf("{S}") >= 0) {
            hasSubdomains = true;
        }

        var getTileUrl = function(coordinate) {
            var coord = this.sourceCoordinate(coordinate);
            if (!coord) {
                return null;
            }
            var base = template;
            if (hasSubdomains) {
                var index = parseInt(coord.zoom + coord.row + coord.column, 10) % subdomains.length;
                base = base.replace('{S}', subdomains[index]);
            }
            if (isQuadKey) {
                return base
                    .replace('{Z}', coord.zoom.toFixed(0))
                    .replace('{Q}', this.quadKey(coord.row, coord.column, coord.zoom));
            } else {
                return base
                    .replace('{Z}', coord.zoom.toFixed(0))
                    .replace('{X}', coord.column.toFixed(0))
                    .replace('{Y}', coord.row.toFixed(0));
            }
        };
    
        MM.MapProvider.call(this, getTileUrl);
    };

    MM.TemplatedMapProvider.prototype = {
        // quadKey generator
        quadKey: function(row, column, zoom) {
            var key = "";
            for (var i = 1; i <= zoom; i++) {
                key += (((row >> zoom - i) & 1) << 1) | ((column >> zoom - i) & 1);
            }
            return key || "0";
        }
    };

    MM.extend(MM.TemplatedMapProvider, MM.MapProvider);

   /**
    * Possible new kind of provider that deals in elements.
    */
    MM.TilePaintingProvider = function(template_provider) {
        this.template_provider = template_provider;
    };

    MM.TilePaintingProvider.prototype = {

        getTile: function(coord) {
            return this.template_provider.getTileUrl(coord);
        },

        releaseTile: function(coord) {
        }
    };

    MM.extend(MM.TilePaintingProvider, MM.MapProvider);
