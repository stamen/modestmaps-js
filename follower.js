function Follower(map)
{
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
    
    this.div.innerHTML = '...';
    
    map.parent.appendChild(this.div);
}

Follower.prototype = {

    div: null,

    onMapMoved: function(map, message)
    {
        var ccs = map.getTileCornerCoordinates();
        this.div.innerHTML = ccs.length + ' / ' + ccs[0][0].toString() + ' / ' + ccs[0][1].toString() + ' / ' + map.getCenter().toString();
        
        var point = map.locationPoint(new Location(37.81153005440273, -122.26660966873169));
        this.div.style.left = point.x + 'px';
        this.div.style.top = point.y + 'px';
    }

};