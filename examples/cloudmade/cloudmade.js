// namespacing!
if (!MM) {
    var MM = { };
}

MM.CloudMadeProvider = function(key, style) {
    this.key = key;
    this.style = style;
    this.tileWidth = 256;
    this.tileHeight = 256;
};

MM.CloudMadeProvider.prototype = {
    key: null,
    style: null,
    getTile: function(coord) {
        coord = this.sourceCoordinate(coord);
        var worldSize = Math.pow(2, coord.zoom);
        var server = new Array('a.', 'b.', 'c.', '')[parseInt(worldSize * coord.row + coord.column, 10) % 4];
        var imgPath = new Array(this.key, this.style, this.tileWidth, coord.zoom, coord.column, coord.row).join('/');
        return 'http://' + server + 'tile.cloudmade.com/' + imgPath + '.png';
    }
};

MM.extend(MM.CloudMadeProvider, MM.MapProvider);
