MM.Follower = function(map, location, content, dimensions) {
    this.coord = map.locationCoordinate(location);
    this.offset = new com.modestmaps.Point(0, 0);
    this.dimensions = dimensions || new com.modestmaps.Point(100, 50);
    this.padding = new com.modestmaps.Point(10, 10);
    this.offset = new com.modestmaps.Point(0, -this.dimensions.y);

    var follower = this;
    var callback = function(m, a) { return follower.draw(m); };
    map.addCallback('drawn', callback);
    this.div = document.createElement('div');
    this.div.style.position = 'absolute';
    this.div.style.width = this.dimensions.x + 'px';
    this.div.style.height = this.dimensions.y + 'px';
    //this.div.style.backgroundColor = 'white';
    //this.div.style.border = 'solid black 1px';
    this.div.innerHTML = content;
    MM.addEvent(this.div, 'mousedown', function(e) {
        if(!e) e = window.event;
        return com.modestmaps.cancelEvent(e);
    });
    map.parent.appendChild(this.div);
    this.draw(map);
};

MM.Follower.prototype = {

    div: null,
    coord: null,
    offset: null,
    dimensions: null,
    padding: null,

    draw: function(map) {
        var point;
        try {
            point = map.coordinatePoint(this.coord);
        } catch(e) {
            // too soon?
            return;
        }
        if (point.x + this.dimensions.x + this.offset.x < 0) {
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
        }
    }
};
