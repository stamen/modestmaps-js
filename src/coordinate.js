
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
    
        toKey: function() {
            /* there used to be a clever hash function here but there were collisions.
               TODO: optimize, but test for collisions properly :) */
            return [ Math.floor(this.zoom), Math.floor(this.column), Math.floor(this.row) ].join(',');
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
            if (dist === undefined) dist = 1;
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