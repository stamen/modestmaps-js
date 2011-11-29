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
    };

    MM.SpriteMapProvider.prototype = {
        tiles: null,
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
                top = -this.offset * this.tileHeight;
            tile.style.backgroundPosition = left + "px " + top + "px";
            // tile.style.backgroundPosition = -(this.offset * 100) + "% left";
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
                    tile.backgroundTimeout = setTimeout(function() {
                        tile.style.backgroundImage = "url(" + url + ")";
                    }, 100);
                    tile.style.backgroundRepeat = "no-repeat";
                    tile.style.width = this.tileWidth + "px";
                    tile.style.height = this.tileHeight + "px";
                    tile.style.overflow = "hidden";
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
            console.log("re-add:", key, tile);
            this.tiles[key] = tile;
            this.applyOffset(tile);
        }
    };

    mm.extend(MM.SpriteMapProvider, MM.TemplatedMapProvider);

})(com.modestmaps);
