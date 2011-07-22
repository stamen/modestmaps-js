    // Projection
    // ----------

    // An abstract class / interface for projections
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
            throw "Abstract method not implemented by subclass.";
        },

        rawUnproject: function(point) {
            throw "Abstract method not implemented by subclass.";
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
            var point = {
                x: Math.PI * location.lon / 180.0,
                y: Math.PI * location.lat / 180.0
            };
            point = this.project(point);
            return {
                row: point.y,
                column: point.x,
                zoom: this.zoom
            };
        },

        coordinateLocation: function(coordinate) {
            coordinate = coordinate.zoomTo(this.zoom);
            var point = {
                x: coordinate.column,
                y: coordinate.row
            };
            point = this.unproject(point);
            return {
                lat: 180.0 * point.y / Math.PI,
                lon: 180.0 * point.x / Math.PI
            };
        }
    };

    // A projection for equilateral maps, based on longitude and latitude
    MM.LinearProjection = function(zoom, transformation) {
        MM.Projection.call(this, zoom, transformation);
    };

    // The Linear projection doesn't reproject points
    MM.LinearProjection.prototype = {
        rawProject: function(point) {
            return { x: point.x, y: point.y };
        },
        rawUnproject: function(point) {
            return { x: point.x, y: point.y };
        }
    };

    MM.extend(MM.LinearProjection, MM.Projection);

    MM.MercatorProjection = function(zoom, transformation) {
        // super!
        MM.Projection.call(this, zoom, transformation);
    };

    // Project lon/lat points into meters required for Mercator
    MM.MercatorProjection.prototype = {
        rawProject: function(point) {
            return {
                x: point.x,
                y: Math.log(Math.tan(0.25 * Math.PI + 0.5 * point.y))
            };
        },

        rawUnproject: function(point) {
            return {
                x: point.x,
                y: 2 * Math.atan(Math.pow(Math.E, point.y)) - 0.5 * Math.PI
            };
        }
    };

    MM.extend(MM.MercatorProjection, MM.Projection);
