// namespacing!
if (!com) {
    var com = { };
    if (!com.modestmaps) {
        com.modestmaps = { };
    }
}

com.modestmaps.CabFollower = function(map, location, content)
{
    this.coord = map.locationCoordinate(location);
    
    this.dimensions = new com.modestmaps.Point(20, 20);
    this.offset = new com.modestmaps.Point(this.dimensions.x/2, -this.dimensions.y/2);

    var follower = this;
    
    var callback = function(m, a) { return follower.draw(m); };
    map.addCallback('panned', callback);
    map.addCallback('zoomed', callback);
    map.addCallback('centered', callback);
    map.addCallback('extentset', callback);
    
    this.div = document.createElement('div');
    this.div.style.position = 'absolute';
    this.div.style.width = this.dimensions.x + 'px';
    this.div.style.height = this.dimensions.y + 'px';
    
    var circle = document.createElement('canvas');
    this.div.appendChild(circle);
    if (typeof G_vmlCanvasManager !== 'undefined') circle = G_vmlCanvasManager.initElement(circle);
    
    circle.style.position = 'absolute';
    circle.style.left = '0px';
    circle.style.top = '0px';
    circle.width = this.dimensions.x;
    circle.height = this.dimensions.y;
    var ctx = circle.getContext("2d");
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255,255,0,1)";
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.beginPath();
    ctx.arc(this.dimensions.x/2, this.dimensions.x/2, -2+this.dimensions.x/2, 0, Math.PI*2, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    map.parent.appendChild(this.div);
    
    this.draw(map);
}

com.modestmaps.CabFollower.prototype = {

    div: null,
    coord: null,
    
    offset: null,
    dimensions: null,
    margin: null,

    draw: function(map)
    {
        try {
            var point = map.coordinatePoint(this.coord);

        } catch(e) {
            // too soon?
            return;
        }
        
        if(point.x + this.dimensions.x + this.offset.x < 0) {
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
    },
    
};
