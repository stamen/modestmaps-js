
    // Providers
    // ---------
    // Providers provide tile URLs and possibly elements for layers.
    MM.MapProvider = function(getTileUrl) {
        if (getTileUrl) {
            this.getTileUrl = getTileUrl;
        }
    };

    MM.MapProvider.prototype = {

        // these are limits for available *tiles*
        // panning limits will be different (since you can wrap around columns)
        // but if you put Infinity in here it will screw up sourceCoordinate
        tileLimits: [ new MM.Coordinate(0,0,0),             // top left outer
                      new MM.Coordinate(1,1,0).zoomTo(18) ], // bottom right inner

        getTileUrl: function(coordinate) {
            throw "Abstract method not implemented by subclass.";
        },

        getTile: function(coordinate) {
            throw "Abstract method not implemented by subclass.";
        },

        releaseTile: function(element) {
            throw "Abstract method not implemented by subclass.";
        },

        // use this to tell MapProvider that tiles only exist between certain zoom levels.
        // should be set separately on Map to restrict interactive zoom/pan ranges
        setZoomRange: function(minZoom, maxZoom) {
            this.tileLimits[0] = this.tileLimits[0].zoomTo(minZoom);
            this.tileLimits[1] = this.tileLimits[1].zoomTo(maxZoom);
        },

        // return null if coord is above/below row extents
        // wrap column around the world if it's outside column extents
        // ... you should override this function if you change the tile limits
        // ... see enforce-limits in examples for details
        sourceCoordinate: function(coord) {
            var TL = this.tileLimits[0].zoomTo(coord.zoom);
            var BR = this.tileLimits[1].zoomTo(coord.zoom);
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
        var getTileUrl = function(coordinate) {
            coordinate = this.sourceCoordinate(coordinate);
            if (!coordinate) {
                return null;
            }
            var base = template;
            if (subdomains && subdomains.length && base.indexOf("{S}") >= 0) {
                var subdomain = parseInt(coordinate.zoom +
                    coordinate.row + coordinate.column, 10) % subdomains.length;
                base = base.replace('{S}', subdomains[subdomain]);
            }
            return base
                .replace('{Z}', coordinate.zoom.toFixed(0))
                .replace('{X}', coordinate.column.toFixed(0))
                .replace('{Y}', coordinate.row.toFixed(0));
        };

        MM.MapProvider.call(this, getTileUrl);
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
