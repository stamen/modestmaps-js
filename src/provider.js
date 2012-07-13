    // Providers
    // ---------
    // Providers provide tile URLs and possibly elements for layers.
    //
    // MapProvider ->
    //   Template
    //
    MM.MapProvider = function(getTile) {
        if (getTile) {
            this.getTile = getTile;
        }
    };

    MM.MapProvider.prototype = {

        // these are limits for available *tiles*
        // panning limits will be different (since you can wrap around columns)
        // but if you put Infinity in here it will screw up sourceCoordinate
        tileLimits: [
            new MM.Coordinate(0,0,0),             // top left outer
            new MM.Coordinate(1,1,0).zoomTo(18)   // bottom right inner
        ],

        getTileUrl: function(coordinate) {
            throw "Abstract method not implemented by subclass.";
        },

        getTile: function(coordinate) {
            throw "Abstract method not implemented by subclass.";
        },

        // releaseTile is not required
        releaseTile: function(element) { },

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
            var TL = this.tileLimits[0].zoomTo(coord.zoom),
                BR = this.tileLimits[1].zoomTo(coord.zoom),
                columnSize = Math.pow(2, coord.zoom),
                wrappedColumn;

            if (coord.column < 0) {
                wrappedColumn = ((coord.column % columnSize) + columnSize) % columnSize;
            } else {
                wrappedColumn = coord.column % columnSize;
            }

            if (coord.row < TL.row || coord.row >= BR.row) {
                return null;
            } else if (wrappedColumn < TL.column || wrappedColumn >= BR.column) {
                return null;
            } else {
                return new MM.Coordinate(coord.row, wrappedColumn, coord.zoom);
            }
        }
    };

    /**
     * FIXME: need a better explanation here! This is a pretty crucial part of
     * understanding how to use ModestMaps.
     *
     * TemplatedMapProvider is a tile provider that generates tile URLs from a
     * template string by replacing the following bits for each tile
     * coordinate:
     *
     * {Z}: the tile's zoom level (from 1 to ~20)
     * {X}: the tile's X, or column (from 0 to a very large number at higher
     * zooms)
     * {Y}: the tile's Y, or row (from 0 to a very large number at higher
     * zooms)
     *
     * E.g.:
     *
     * var osm = new MM.TemplatedMapProvider("http://tile.openstreetmap.org/{Z}/{X}/{Y}.png");
     *
     * Or:
     *
     * var placeholder = new MM.TemplatedMapProvider("http://placehold.it/256/f0f/fff.png&text={Z}/{X}/{Y}");
     *
     */
    MM.Template = function(template, subdomains) {
        var isQuadKey = template.match(/{(Q|quadkey)}/);
        // replace Microsoft style substitution strings
        if (isQuadKey) template = template
            .replace('{subdomains}', '{S}')
            .replace('{zoom}', '{Z}')
            .replace('{quadkey}', '{Q}');

        var hasSubdomains = (subdomains &&
            subdomains.length && template.indexOf("{S}") >= 0);

        function quadKey (row, column, zoom) {
            var key = '';
            for (var i = 1; i <= zoom; i++) {
                key += (((row >> zoom - i) & 1) << 1) | ((column >> zoom - i) & 1);
            }
            return key || '0';
        }

        var getTileUrl = function(coordinate) {
            var coord = this.sourceCoordinate(coordinate);
            if (!coord) {
                return null;
            }
            var base = template;
            if (hasSubdomains) {
                var index = parseInt(coord.zoom + coord.row + coord.column, 10) %
                    subdomains.length;
                base = base.replace('{S}', subdomains[index]);
            }
            if (isQuadKey) {
                return base
                    .replace('{Z}', coord.zoom.toFixed(0))
                    .replace('{Q}', quadKey(coord.row,
                        coord.column,
                        coord.zoom));
            } else {
                return base
                    .replace('{Z}', coord.zoom.toFixed(0))
                    .replace('{X}', coord.column.toFixed(0))
                    .replace('{Y}', coord.row.toFixed(0));
            }
        };

        MM.MapProvider.call(this, getTileUrl);
    };

    MM.Template.prototype = {
        // quadKey generator
        getTile: function(coord) {
          return this.getTileUrl(coord);
        }
    };

    MM.extend(MM.Template, MM.MapProvider);

    MM.TemplatedLayer = function(template, subdomains, name) {
      return new MM.Layer(new MM.Template(template, subdomains), null, name);
    };
