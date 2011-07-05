    // Coordinate
    // ----------
    // An object representing a tile position, at as specified zoom level.
    // This is not necessarily a precise tile - `row`, `column`, and
    // `zoom` can be floating-point numbers, and the `container()` function
    // can be used to find the actual tile that contains the point.
    MM.Coordinate = function(row, column, zoom) {
        this.row = row;
        this.column = column;
        this.zoom = zoom;
    };

    // Based on http://graphics.stanford.edu/~seander/bithacks.html#InterleaveTableLookup
    MM._mortonLookup = (function() {
        var X = [ 0, 1 ], Y = [ 0, 2 ];
        for (var i = 4; i < 0xFFFF; i <<= 2) {
            for (var j = 0, l = X.length; j < l; j++) {
                X.push((X[j] | i));
                Y.push((X[j] | i) << 1);
            }
        }
        return [X, Y];
    })();

    MM.Coordinate.prototype = {

        row: 0,
        column: 0,
        zoom: 0,

        toString: function() {
            return "(" + this.row.toFixed(3) + ", "
                       + this.column.toFixed(3) + " @"
                       + this.zoom.toFixed(3) + ")";
        },
        // Quickly generate a string representation of this coordinate to
        // index it in hashes.
        toKey: function() {
            // Only works for 24 bit input numbers (up to 16777215).
            var X = MM._mortonLookup[0],
                Y = MM._mortonLookup[1],
                Z = 1 << (24 - this.zoom),
                x = this.column * Z,
                y = this.row * Z,
                m =
                (Y[y         & 0xFF] | X[x         & 0xFF]) +
                (Y[(y >> 8)  & 0xFF] | X[(x >> 8)  & 0xFF]) * 0x10000 +
                (Y[(y >> 16) & 0xFF] | X[(x >> 16) & 0xFF]) * 0x100000000;
            return m;
        },
        // Clone this object.
        copy: function() {
            return new MM.Coordinate(this.row, this.column, this.zoom);
        },
        // Get the actual, rounded-number tile that contains this point.
        container: function() {
            // using floor here (not parseInt, ~~) because we want -0.56 --> -1
            return new MM.Coordinate(Math.floor(this.row), 
                                     Math.floor(this.column), 
                                     Math.floor(this.zoom));
        },
        // Recalculate this Coordinate at a different zoom level and return the
        // new object.
        zoomTo: function(destination) {
            var power = Math.pow(2, destination - this.zoom);
            return new MM.Coordinate(this.row * power,
                                     this.column * power,
                                     destination);
        },
        // Recalculate this Coordinate at a different relative zoom level and return the
        // new object.
        zoomBy: function(distance) {
            var power = Math.pow(2, distance);
            return new MM.Coordinate(this.row * power,
                                     this.column * power,
                                     this.zoom + distance);
        },
        // Move this coordinate up by `dist` coordinates
        up: function(dist) {
            if (dist === undefined) dist = 1;
            return new MM.Coordinate(this.row - dist, this.column, this.zoom);
        },
        // Move this coordinate right by `dist` coordinates
        right: function(dist) {
            if (dist === undefined) dist = 1;
            return new MM.Coordinate(this.row, this.column + dist, this.zoom);
        },
        // Move this coordinate down by `dist` coordinates
        down: function(dist) {
            if (dist === undefined) dist = 1;
            return new MM.Coordinate(this.row + dist, this.column, this.zoom);
        },
        // Move this coordinate left by `dist` coordinates
        left: function(dist) {
            if (dist === undefined) dist = 1;
            return new MM.Coordinate(this.row, this.column - dist, this.zoom);
        }
    };
