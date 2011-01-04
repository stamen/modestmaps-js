
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
            a=a-b; a=a-c; a=a^(c >>> 13);
            b=b-c; b=b-a; b=b^(a << 8); 
            c=c-a; c=c-b; c=c^(b >>> 13);
            a=a-b; a=a-c; a=a^(c >>> 12);
            b=b-c; b=b-a; b=b^(a << 16);
            c=c-a; c=c-b; c=c^(b >>> 5);
            a=a-b; a=a-c; a=a^(c >>> 3);
            b=b-c; b=b-a; b=b^(a << 10);
            c=c-a; c=c-b; c=c^(b >>> 15);
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