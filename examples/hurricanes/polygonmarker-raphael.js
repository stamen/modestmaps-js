// namespacing!
if (!com) {
    var com = { };
    if (!com.modestmaps) {
        com.modestmaps = { };
    }
}

com.modestmaps.PolygonMarker = function(map, locations, fillStyle, fillAlpha, strokeStyle)
{
    this.fillStyle = fillStyle;
    this.fillAlpha = fillAlpha;
    this.strokeStyle = strokeStyle;

    this.coords = [];

    // top left    
    var maxLat = locations[0].lat;
    var minLon = locations[0].lon;

    // bottom right
    var minLat = locations[0].lat;
    var maxLon = locations[0].lon;
    
    for (var i = 0; i < locations.length; i++) {
        this.coords.push(map.locationCoordinate(locations[i]));
        minLat = Math.min(minLat, locations[i].lat);
        maxLat = Math.max(maxLat, locations[i].lat);
        minLon = Math.min(minLon, locations[i].lon);
        maxLon = Math.max(maxLon, locations[i].lon);
    }

    var topLeftLocation = new com.modestmaps.Location(maxLat, minLon);
    var bottomRightLocation = new com.modestmaps.Location(minLat, maxLon);

//    console.log(topLeftLocation);
//    console.log(bottomRightLocation);
    
    this.topLeftCoord = map.locationCoordinate(topLeftLocation);
    this.bottomRightCoord = map.locationCoordinate(bottomRightLocation);
    
//    console.log(this.topLeftCoord);
//    console.log(this.bottomRightCoord);


    // listen for events
    
    var follower = this;    
    var callback = function(m, a) { return follower.draw(m); };
    map.addCallback('panned', callback);
    map.addCallback('zoomed', callback);
    map.addCallback('centered', callback);
    map.addCallback('extentset', callback);
    
    // get your div on
    
    this.div = document.createElement('div');
    this.div.style.position = 'absolute';
    map.parent.appendChild(this.div);
    
    this.draw(map);
}

com.modestmaps.PolygonMarker.prototype = {

    div: null,
    canvas: null,

    coords: null,
    topLeftCoord: null,
    bottomRightCoord: null,
    
    drawZoom: null,
    
    fillStyle: null,
    fillAlpha: null,
    strokeStyle: null,
    
    draw: function(map)
    {
        try {
            var point = map.coordinatePoint(this.topLeftCoord);

        } catch(e) {
            // too soon?
            return;
        }
        
        /* if(point.x + this.dimensions.x + this.offset.x < 0) {
            // too far left
            this.div.style.display = 'none';
        
        } else if(point.y + this.dimensions.y + this.offset.y < 0) {
            // too far up
            this.div.style.display = 'none';
        
        } else if(point.x + this.offset.x > map.dimensions.x) {
            // too far right
            this.div.style.display = 'none';
        
        } else if(point.y + this.offset.y > map.dimensions.y) {
            // too far down
            this.div.style.display = 'none';

        } else {
            this.div.style.display = 'block';
            this.div.style.left = point.x + this.offset.x + 'px';
            this.div.style.top = point.y + this.offset.y + 'px';
        } */
        
        this.div.style.display = 'block';
        this.div.style.left = point.x + 'px';
        this.div.style.top = point.y + 'px';

        if (this.drawZoom != map.getZoom()) {

            var topLeftPoint = map.coordinatePoint(this.topLeftCoord);
            var bottomRightPoint = map.coordinatePoint(this.bottomRightCoord);
        
            var canvasWidth = bottomRightPoint.x - topLeftPoint.x;
            var canvasHeight = bottomRightPoint.y - topLeftPoint.y;
        
            if (this.canvas) {
                this.canvas.remove();
                // TODO: resize?
            }

            this.canvas = Raphael(this.div, canvasWidth, canvasHeight);
        
            var points = [];
            for (var i = 0; i < this.coords.length; i++) {
                var point = map.coordinatePoint(this.coords[i]);
                point.x -= topLeftPoint.x;
                point.y -= topLeftPoint.y;
                points.push(point);
            }

            var pathParams = {};

            if (this.fillStyle) {
                pathParams['fill'] = this.fillStyle;
                pathParams['fill-opacity'] = this.fillAlpha;
            }
            if (this.strokeStyle) pathParams['stroke'] = this.strokeStyle;
            
            var path = this.canvas.path(pathParams);

            path.moveTo(points[0].x, points[0].y);
            for (var i = 1; i < points.length; i++) {
                path.lineTo(points[i].x, points[i].y);
            }
            path.andClose();
            
            this.drawZoom = map.getZoom();
        }        
        
    },

    clear: function(){
        this.canvas.clear();
        this.coords = [];
    }
};
