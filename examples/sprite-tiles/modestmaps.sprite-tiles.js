(function(MM) {

    /**
     * The SpriteMapProvider creates <div> tiles with a background-image CSS
     * property of the tile URL, and scrolls the background image using a
     * provided offset, via setOffset(). The offsets are multiples of the
     * tile size, so use 1 to get a 256px offset instead of 256. Usage:
     *
     * var provider = new SpriteMapProvider(new mm.TemplatedMapProvider(...));
     * provider.setOffset(1); // offsets vertically by 256px
     * provider.setOffset(2); // by 512px
     */
    MM.SpriteMapProvider = function(template_provider) {
        this.template_provider = template_provider;
        this.offset = 0;
        this.tiles = {};
        // FIXME: this is hard-coded now, but it should come from the map or the provider.
        // Currently, though, there's no way for the provider to know about the map.
        this.tileSize = new MM.Point(256, 256);
    };

    MM.SpriteMapProvider.prototype = {
        tiles: null,
        tileSize: null,
        offset: 0,

        getOffset: function() {
            return this.offset;
        },
        setOffset: function(offset) {
            if (this.offset != offset) {
                this.offset = offset;
                this.applyOffsets();
            }
        },

        applyOffset: function(tile) {
            var left = 0,
                top = -this.offset * this.tileSize.y;
            tile.style.backgroundPosition = left + "px " + top + "px";
        },

        applyOffsets: function() {
            for (var key in this.tiles) {
                this.applyOffset(this.tiles[key]);
            }
        },

        getTile: function(coord) {
            var key = coord.toKey();
            if (this.tiles.hasOwnProperty(key)) {
                return this.tiles[key];
            } else {
                var url = this.template_provider.getTileUrl(coord);
                if (url) {
                    var tile = document.createElement("div");
                    tile.style.backgroundRepeat = "no-repeat";
                    tile.backgroundTimeout = setTimeout(function() {
                        tile.style.backgroundImage = "url(" + url + ")";
                    }, 100);

                    /*
                     * OTE: because using matrix transforms invalidates
                     * explicit width and height values, we need to put a
                     * "strut" inside each tile div that provides its intrinsic
                     * size. This has the awesome side benefit of scaling
                     * automatically.
                     */
                    var strut = tile.appendChild(document.createElement("span"));
                    strut.style.display = "block";
                    strut.style.width = this.tileSize.x + "px";
                    strut.style.height = this.tileSize.y + "px";

                    this.tiles[key] = tile;
                    this.applyOffset(tile);
                    return tile;
                } else {
                    return null;
                }
            }
        },

        releaseTile: function(coord) {
            var key = coord.toKey(),
                tile = this.tiles[key];
            // clearTimeout(tile.backgroundTimeout);
            delete this.tiles[key];
        },

        reAddTile: function(key, coord, tile) {
            // console.log("re-add:", key, tile);
            this.tiles[key] = tile;
            this.applyOffset(tile);
        }
    };

})(com.modestmaps);
