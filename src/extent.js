
    // MapExtent
    // ----------
    // An object representing a map's rectangular extent, defined by its north,
    // south, east and west bounds.

    MM.MapExtent = function(north, south, east, west) {
        this.north = north ? Math.max(north, south) : 0;
        this.south = south ? Math.min(north, south) : 0;
        this.east = east ? Math.max(east, west) : 0;
        this.west = west ? Math.min(east, west) : 0;
    };

    MM.MapExtent.prototype = {
        // boundary attributes
        north: 0,
        south: 0,
        east: 0,
        west: 0,

        // getters for the corner locations
        northWest: function() {
            return new MM.Location(this.north, this.west);
        },
        southEast: function() {
            return new MM.Location(this.south, this.east);
        },
        northEast: function() {
            return new MM.Location(this.north, this.east);
        },
        southWest: function() {
            return new MM.Location(this.south, this.west);
        },
        // getter for the center location
        center: function() {
            return new MM.Location(
                this.south + (this.north - this.south) / 2,
                this.east + (this.west - this.east) / 2
            );
        },

        // extend the bounds to include a location's latitude and longitude
        encloseLocation: function(loc) {
            if (loc.lat > this.north) this.north = loc.lat;
            if (loc.lat < this.south) this.south = loc.lat;
            if (loc.lon > this.east) this.east = loc.lon;
            if (loc.lon < this.west) this.west = loc.lon;
        },

        // extend the bounds to include multiple locations
        encloseLocations: function(locations) {
            var len = locations.length;
            for (var i = 0; i < len; i++) {
                this.encloseLocation(locations[i]);
            }
        },

        // extend the bounds to include another extent
        encloseExtent: function(extent) {
            if (extent.north > this.north) this.north = extent.north;
            if (extent.south < this.south) this.south = extent.south;
            if (extent.east > this.east) this.east = extent.east;
            if (extent.west < this.west) this.west = extent.west;
        },

        // determine if a location is within this extent
        containsLocation: function(loc) {
            return loc.lat >= this.south
                && loc.lat <= this.north
                && loc.lon >= this.west
                && loc.lon <= this.east;
        },

        // turn an extent into an array of locations containing its northwest
        // and southeast corners (used in MM.Map.setExtent())
        toArray: function() {
            return [this.northWest(), this.southEast()];
        }
    };

    MM.MapExtent.fromArray = function(locations) {
        var len = locations.length;
        if (len == 0) return new MM.MapExtent();

        var first = locations[0],
            extent = new MM.MapExtent(first.lat, first.lon, first.lat, first.lon);
        for (var i = 1; i < len; i++) {
            extent.encloseLocation(locations[i]);
        }
        return extent;
    };

