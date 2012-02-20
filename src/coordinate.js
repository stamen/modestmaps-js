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

    MM.Coordinate.prototype = {

        row: 0,
        column: 0,
        zoom: 0,

        toString: function() {
            return "("  + this.row.toFixed(3) +
                   ", " + this.column.toFixed(3) +
                   " @" + this.zoom.toFixed(3) + ")";
        },
        // Quickly generate a string representation of this coordinate to
        // index it in hashes. 
        toKey: function() {
            // We've tried to use efficient hash functions here before but we took
            // them out. Contributions welcome but watch out for collisions when the
            // row or column are negative and check thoroughly (exhaustively) before
            // committing.
            return this.zoom + ',' + this.row + ',' + this.column;
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
