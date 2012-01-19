
    // Layer

    MM.Layer = function(provider, parent) {
        this.parent = parent || document.createElement('div');
        this.parent.style.cssText = 'position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; margin: 0; padding: 0; z-index: 0';

        this.levels = {};

        this.requestManager = new MM.RequestManager();
        this.requestManager.addCallback('requestcomplete', this.getTileComplete());

        if (provider) {
            this.setProvider(provider);
        }
    };

    MM.Layer.prototype = {

        map: null, // TODO: remove
        parent: null,
        tiles: null,
        levels: null,

        requestManager: null,
        tileCacheSize: null,
        maxTileCacheSize: null,

        provider: null,
        recentTiles: null,
        recentTilesById: null,

        enablePyramidLoading: false,

        _tileComplete: null,

        getTileComplete: function() {
            if(!this._tileComplete) {
                var theLayer = this;
                this._tileComplete = function(manager, tile) {

                    // cache the tile itself:
                    theLayer.tiles[tile.id] = tile;
                    theLayer.tileCacheSize++;

                    // also keep a record of when we last touched this tile:
                    var record = {
                        id: tile.id,
                        lastTouchedTime: new Date().getTime()
                    };
                    theLayer.recentTilesById[tile.id] = record;
                    theLayer.recentTiles.push(record);

                    // position this tile (avoids a full draw() call):
                    theLayer.positionTile(tile);
                };
            }

            return this._tileComplete;
        },

        draw: function() {
            // if we're in between zoom levels, we need to choose the nearest:
            var baseZoom = Math.round(this.map.coordinate.zoom);

            // these are the top left and bottom right tile coordinates
            // we'll be loading everything in between:
            var startCoord = this.map.pointCoordinate(new MM.Point(0,0))
                .zoomTo(baseZoom).container();
            var endCoord = this.map.pointCoordinate(this.map.dimensions)
                .zoomTo(baseZoom).container().right().down();

            // tiles with invalid keys will be removed from visible levels
            // requests for tiles with invalid keys will be canceled
            // (this object maps from a tile key to a boolean)
            var validTileKeys = { };

            // make sure we have a container for tiles in the current level
            var levelElement = this.createOrGetLevel(startCoord.zoom);

            // use this coordinate for generating keys, parents and children:
            var tileCoord = startCoord.copy();

            for (tileCoord.column = startCoord.column;
                 tileCoord.column <= endCoord.column; tileCoord.column++) {
                for (tileCoord.row = startCoord.row;
                     tileCoord.row <= endCoord.row; tileCoord.row++) {
                    var validKeys = this.inventoryVisibleTile(levelElement, tileCoord);

                    while (validKeys.length) {
                        validTileKeys[validKeys.pop()] = true;
                    }
                }
            }

            // i from i to zoom-5 are levels that would be scaled too big,
            // i from zoom + 2 to levels. length are levels that would be
            // scaled too small (and tiles would be too numerous)
            for (var name in this.levels) {
                if (this.levels.hasOwnProperty(name)) {
                    var zoom = parseInt(name,10);

                    if (zoom >= startCoord.zoom-5 && zoom < startCoord.zoom+2) {
                        continue;
                    }

                    var level = this.levels[name];
                    level.style.display = 'none';
                    var visibleTiles = this.tileElementsInLevel(level);

                    while (visibleTiles.length) {
                        this.provider.releaseTile(visibleTiles[0].coord);
                        this.requestManager.clearRequest(visibleTiles[0].coord.toKey());
                        level.removeChild(visibleTiles[0]);
                        visibleTiles.shift();
                    }
                }
            }

            // levels we want to see, if they have tiles in validTileKeys
            var minLevel = startCoord.zoom - 5;
            var maxLevel = startCoord.zoom + 2;

            for (var z = minLevel; z < maxLevel; z++) {
                this.adjustVisibleLevel(this.levels[z], z, validTileKeys);
            }

            // cancel requests that aren't visible:
            this.requestManager.clearExcept(validTileKeys);

            // get newly requested tiles, sort according to current view:
            this.requestManager.processQueue(this.getCenterDistanceCompare());

            // make sure we don't have too much stuff:
            this.checkCache();
        },

        /**
         * For a given tile coordinate in a given level element, ensure that it's
         * correctly represented in the DOM including potentially-overlapping
         * parent and child tiles for pyramid loading.
         *
         * Return a list of valid (i.e. loadable?) tile keys.
         */
        inventoryVisibleTile: function(layer_element, tile_coord) {
            var tile_key = tile_coord.toKey(),
                valid_tile_keys = [tile_key];

            /*
             * Check that the needed tile already exists someplace - add it to the DOM if it does.
             */
            if (tile_key in this.tiles) {
                var tile = this.tiles[tile_key];

                // ensure it's in the DOM:
                if (tile.parentNode != layer_element) {
                    layer_element.appendChild(tile);
                    // if the provider implements reAddTile(), call it
                    if ("reAddTile" in this.provider) {
                        this.provider.reAddTile(tile_key, tile_coord, tile);
                    }
                }

                return valid_tile_keys;
            }

            /*
             * Check that the needed tile has even been requested at all.
             */
            if (!this.requestManager.hasRequest(tile_key)) {
                var tileToRequest = this.provider.getTile(tile_coord);
                if (typeof tileToRequest == 'string') {
                    this.addTileImage(tile_key, tile_coord, tileToRequest);
                // tile must be truish
                } else if (tileToRequest) {
                    this.addTileElement(tile_key, tile_coord, tileToRequest);
                }
            }

            // look for a parent tile in our image cache
            var tileCovered = false;
            var maxStepsOut = tile_coord.zoom;

            for (var pz = 1; pz <= maxStepsOut; pz++) {
                var parent_coord = tile_coord.zoomBy(-pz).container();
                var parent_key = parent_coord.toKey();

                if (this.enablePyramidLoading) {
                    // mark all parent tiles valid
                    valid_tile_keys.push(parent_key);
                    var parentLevel = this.createOrGetLevel(parent_coord.zoom);

                    //parentLevel.coordinate = parent_coord.copy();
                    if (parent_key in this.tiles) {
                        var parentTile = this.tiles[parent_key];
                        if (parentTile.parentNode != parentLevel) {
                            parentLevel.appendChild(parentTile);
                        }
                    } else if (!this.requestManager.hasRequest(parent_key)) {
                        // force load of parent tiles we don't already have
                        var tileToAdd = this.provider.getTile(parent_coord);

                        if (typeof tileToAdd == 'string') {
                            this.addTileImage(parent_key, parent_coord, tileToAdd);
                        } else {
                            this.addTileElement(parent_key, parent_coord, tileToAdd);
                        }
                    }
                } else {
                    // only mark it valid if we have it already
                    if (parent_key in this.tiles) {
                        valid_tile_keys.push(parent_key);
                        tileCovered = true;
                        break;
                    }
                }
            }

            // if we didn't find a parent, look at the children:
            if(!tileCovered && !this.enablePyramidLoading) {
                var child_coord = tile_coord.zoomBy(1);

                // mark everything valid whether or not we have it:
                valid_tile_keys.push(child_coord.toKey());
                child_coord.column += 1;
                valid_tile_keys.push(child_coord.toKey());
                child_coord.row += 1;
                valid_tile_keys.push(child_coord.toKey());
                child_coord.column -= 1;
                valid_tile_keys.push(child_coord.toKey());
            }

            return valid_tile_keys;
        },

        tileElementsInLevel: function(level) {
            // this is somewhat future proof, we're looking for DOM elements
            // not necessarily <img> elements
            var tiles = [];
            for(var tile = level.firstChild; tile; tile = tile.nextSibling) {
                if(tile.nodeType == 1) {
                    tiles.push(tile);
                }
            }
            return tiles;
        },

        /**
         * For a given level, adjust visibility as a whole and discard individual
         * tiles based on values in valid_tile_keys from inventoryVisibleTile().
         */
        adjustVisibleLevel: function(level, zoom, valid_tile_keys) {
            // for tracking time of tile usage:
            var now = new Date().getTime();

            if (!level) {
                // no tiles for this level yet
                return;
            }

            var scale = 1;
            var theCoord = this.map.coordinate.copy();

            if (level.childNodes.length > 0) {
                level.style.display = 'block';
                scale = Math.pow(2, this.map.coordinate.zoom - zoom);
                theCoord = theCoord.zoomTo(zoom);
            } else {
                level.style.display = 'none';
            }

            var tileWidth = this.map.tileSize.x * scale;
            var tileHeight = this.map.tileSize.y * scale;
            var center = new MM.Point(this.map.dimensions.x/2, this.map.dimensions.y/2);
            var tiles = this.tileElementsInLevel(level);

            while (tiles.length) {
                var tile = tiles.pop();

                if (!valid_tile_keys[tile.id]) {
                    this.provider.releaseTile(tile.coord);
                    this.requestManager.clearRequest(tile.coord.toKey());
                    level.removeChild(tile);
                } else {
                    // position tiles
                    MM.moveElement(tile, {
                        x: Math.round(center.x +
                            (tile.coord.column - theCoord.column) * tileWidth),
                        y: Math.round(center.y +
                            (tile.coord.row - theCoord.row) * tileHeight),
                        scale: scale,
                        // TODO: pass only scale or only w/h
                        width: this.map.tileSize.x,
                        height: this.map.tileSize.y
                    });

                    // log last-touched-time of currently cached tiles
                    this.recentTilesById[tile.id].lastTouchedTime = now;
                }
            }
        },

        createOrGetLevel: function(zoom) {
            if (zoom in this.levels) {
                return this.levels[zoom];
            }

            //console.log('creating level ' + zoom);
            var level = document.createElement('div');
            level.id = this.parent.id+'-zoom-'+zoom;
            level.style.cssText = this.parent.style.cssText;
            level.style.zIndex = zoom;
            this.parent.appendChild(level);
            this.levels[zoom] = level;
            return level;
        },

        addTileImage: function(key, coord, url) {
            this.requestManager.requestTile(key, coord, url);
        },

        addTileElement: function(key, coordinate, element) {
            // Expected in draw()
            element.id = key;
            element.coord = coordinate.copy();

            // cache the tile itself:
            this.tiles[key] = element;
            this.tileCacheSize++;

            // also keep a record of when we last touched this tile:
            var record = {
                id: key,
                lastTouchedTime: new Date().getTime()
            };
            this.recentTilesById[key] = record;
            this.recentTiles.push(record);

            this.positionTile(element);
        },

        positionTile: function(tile) {
            // position this tile (avoids a full draw() call):
            var theCoord = this.map.coordinate.zoomTo(tile.coord.zoom);
            var scale = Math.pow(2, this.map.coordinate.zoom - tile.coord.zoom);

            // Start tile positioning and prevent drag for modern browsers
            tile.style.cssText = 'position:absolute;-webkit-user-select: none;-webkit-user-drag: none;-moz-user-drag: none;';

            // Prevent drag for IE
            tile.ondragstart = function() { return false; };

            var tx = ((this.map.dimensions.x/2) +
                (tile.coord.column - theCoord.column) *
                this.map.tileSize.x * scale);
            var ty = ((this.map.dimensions.y/2) +
                (tile.coord.row - theCoord.row) *
                this.map.tileSize.y * scale);

            // TODO: pass only scale or only w/h
            MM.moveElement(tile, {
                x: Math.round(tx),
                y: Math.round(ty),
                scale: scale,
                width: this.map.tileSize.x,
                height: this.map.tileSize.y
            });

            // add tile to its level
            var theLevel = this.levels[tile.coord.zoom];
            theLevel.appendChild(tile);

            // Support style transition if available.
            tile.className = 'map-tile-loaded';

            // ensure the level is visible if it's still the current level
            if (Math.round(this.map.coordinate.zoom) == tile.coord.zoom) {
                theLevel.style.display = 'block';
            }

            // request a lazy redraw of all levels
            // this will remove tiles that were only visible
            // to cover this tile while it loaded:
            this.requestRedraw();
        },

        _redrawTimer: undefined,

        requestRedraw: function() {
            // we'll always draw within 1 second of this request,
            // sometimes faster if there's already a pending redraw
            // this is used when a new tile arrives so that we clear
            // any parent/child tiles that were only being displayed
            // until the tile loads at the right zoom level
            if (!this._redrawTimer) {
                this._redrawTimer = setTimeout(this.getRedraw(), 1000);
            }
        },

        _redraw: null,

        getRedraw: function() {
            // let's only create this closure once...
            if (!this._redraw) {
                var theLayer = this;
                this._redraw = function() {
                    theLayer.draw();
                    theLayer._redrawTimer = 0;
                };
            }
            return this._redraw;
        },

        // keeps cache below max size
        // (called every time we receive a new tile and add it to the cache)
        checkCache: function() {
            var numTilesOnScreen = this.parent.getElementsByTagName('img').length;
            var maxTiles = Math.max(numTilesOnScreen, this.maxTileCacheSize);

            if (this.tileCacheSize > maxTiles) {
                // sort from newest (highest) to oldest (lowest)
                this.recentTiles.sort(function(t1, t2) {
                    return t2.lastTouchedTime < t1.lastTouchedTime ? -1 :
                      t2.lastTouchedTime > t1.lastTouchedTime ? 1 : 0;
                });
            }

            while (this.tileCacheSize > maxTiles) {
                // delete the oldest record
                var tileRecord = this.recentTiles.pop();
                var now = new Date().getTime();
                delete this.recentTilesById[tileRecord.id];
                //window.console.log('removing ' + tileRecord.id +
                //                   ' last seen ' + (now-tileRecord.lastTouchedTime) + 'ms ago');
                // now actually remove it from the cache...
                var tile = this.tiles[tileRecord.id];
                if (tile.parentNode) {
                    // I'm leaving this uncommented for now but you should never see it:
                    alert("Gah: trying to removing cached tile even though it's still in the DOM");
                } else {
                    delete this.tiles[tileRecord.id];
                    this.tileCacheSize--;
                }
            }
        },

        setProvider: function(newProvider) {
            var firstProvider = (this.provider === null);

            // if we already have a provider the we'll need to
            // clear the DOM, cancel requests and redraw
            if (!firstProvider) {
                this.requestManager.clear();

                for (var name in this.levels) {
                    if (this.levels.hasOwnProperty(name)) {
                        var level = this.levels[name];

                        while (level.firstChild) {
                            this.provider.releaseTile(level.firstChild.coord);
                            level.removeChild(level.firstChild);
                        }
                    }
                }
            }

            // first provider or not we'll init/reset some values...

            this.tiles = {};
            this.tileCacheSize = 0;
            this.maxTileCacheSize = 64;
            this.recentTilesById = {};
            this.recentTiles = [];

            // for later: check geometry of old provider and set a new coordinate center
            // if needed (now? or when?)

            this.provider = newProvider;

            if (!firstProvider) {
                this.draw();
            }
        },

        // compares manhattan distance from center of
        // requested tiles to current map center
        // NB:- requested tiles are *popped* from queue, so we do a descending sort
        getCenterDistanceCompare: function() {
            var theCoord = this.map.coordinate.zoomTo(Math.round(this.map.coordinate.zoom));

            return function(r1, r2) {
                if (r1 && r2) {
                    var c1 = r1.coord;
                    var c2 = r2.coord;
                    if (c1.zoom == c2.zoom) {
                        var ds1 = Math.abs(theCoord.row - c1.row - 0.5) +
                                  Math.abs(theCoord.column - c1.column - 0.5);
                        var ds2 = Math.abs(theCoord.row - c2.row - 0.5) +
                                  Math.abs(theCoord.column - c2.column - 0.5);
                        return ds1 < ds2 ? 1 : ds1 > ds2 ? -1 : 0;
                    } else {
                        return c1.zoom < c2.zoom ? 1 : c1.zoom > c2.zoom ? -1 : 0;
                    }
                }
                return r1 ? 1 : r2 ? -1 : 0;
            };
        },

        // Remove this layer from the DOM, cancel all of its requests
        // and unbind any callbacks that are bound to it.
        destroy: function() {
            this.requestManager.clear();
            this.requestManager.removeCallback('requestcomplete', this.getTileComplete());
            // TODO: does requestManager need a destroy function too?
            this.provider = null;
            // If this layer was ever attached to the DOM, detach it.
            if (this.parent.parentNode) {
              this.parent.parentNode.removeChild(this.parent);
            }
            this.map = null;
        }

    };
