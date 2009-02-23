// namespacing!
if (!com) {
    var com = { };
    if (!com.modestmaps) {
        com.modestmaps = { };
    }
}

com.modestmaps.CloudMadeProvider = function(key, style) {
    this.key = key;
    this.style = style;
}

com.modestmaps.CloudMadeProvider.prototype = {
    key: null,
    style: null,
    getTileUrl: function(coord) {
        coord = this.sourceCoordinate(coord);
        var worldSize = Math.pow(2, coord.zoom);
        var server = new Array('a.', 'b.', 'c.', '')[parseInt(worldSize * coord.row + coord.column) % 4];
        var imgPath = new Array(this.key, this.style, this.tileWidth, coord.zoom, coord.column, coord.row).join('/');
        return 'http://' + server + 'tile.cloudmade.com/' + imgPath + '.png';
    }
}

com.modestmaps.extend(com.modestmaps.CloudMadeProvider, com.modestmaps.MapProvider);
