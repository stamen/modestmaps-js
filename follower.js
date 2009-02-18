function Follower(map)
{
    this.coord = map.provider.locationCoordinate(new Location(37.811530, -122.2666097));

    var follower = this;
    
    var callback = function(m, a) { return follower.onMapMoved(m, a); };
    map.addCallback('panned', callback);
    map.addCallback('zoomed', callback);
    map.addCallback('centered', callback);
    map.addCallback('extentset', callback);
    
    this.div = document.createElement('div');
    this.div.style.position = 'absolute';
    this.div.style.left = '10px';
    this.div.style.top = '10px';
    
    this.div.innerHTML = '&#xB0; Broadway and Grand';
    
    map.parent.appendChild(this.div);
}

Follower.prototype = {

    div: null,
    coord: null,

    onMapMoved: function(map, message)
    {
        var point = map.coordinatePoint(this.coord);
        
        if(point.x < 0 || point.y < 0 || point.x > map.dimensions.x || point.y > map.dimensions.y) {
            this.div.style.display = 'none';

        } else {
            this.div.style.display = 'block';
            this.div.style.left = point.x + 'px';
            this.div.style.top = point.y + 'px';
        }
    }

};