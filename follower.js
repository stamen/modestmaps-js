function Follower(map, location, content)
{
    this.coord = map.provider.locationCoordinate(location);
    
    this.offset = new Point(0, 0);
    this.dimensions = new Point(100, 50);
    this.padding = new Point(10, 10);
    this.offset = new Point(0, -50);

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
    this.div.style.backgroundColor = 'white';
    this.div.style.border = 'solid black 1px';
    
    this.div.innerHTML = content;
    
    this.div.onmousedown = function(e) {
        e.cancelBubble = true;
        if (e.stopPropagation) e.stopPropagation();
        return false;
    };
    
    map.parent.appendChild(this.div);
    
    this.draw(map);
}

Follower.prototype = {

    div: null,
    coord: null,
    
    offset: null,
    dimensions: null,
    padding: null,

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
    }

};