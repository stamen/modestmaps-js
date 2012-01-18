
    var HAS_HASHCHANGE = (function() {
        var doc_mode = window.documentMode;
        return ('onhashchange' in window) &&
            (doc_mode === undefined || doc_mode > 7);
    })();

    MM.Hash = function(map) {
        this.onMapMove = MM.bind(this.onMapMove, this);
        this.onHashChange = MM.bind(this.onHashChange, this);
        if (map) {
            this.init(map);
        }
    };

    MM.Hash.prototype = {
        map: null,
        lastHash: null,

        parseHash: function(hash) {
            var args = hash.split("/");
            if (args.length == 3) {
                var zoom = parseInt(args[0], 10),
                    lat = parseFloat(args[1]),
                    lon = parseFloat(args[2]);
                if (isNaN(zoom) || isNaN(lat) || isNaN(lon)) {
                    return false;
                } else {
                    return {
                        center: new MM.Location(lat, lon),
                        zoom: zoom
                    };
                }
            } else {
                return false;
            }
        },

        formatHash: function(map) {
            var center = map.getCenter(),
                zoom = map.getZoom(),
                precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));
            return "#" + [zoom,
                center.lat.toFixed(precision),
                center.lon.toFixed(precision)
            ].join("/");
        },

        init: function(map) {
            this.map = map;
            this.map.addCallback("drawn", this.onMapMove);
            // reset the hash
            this.lastHash = null;
            this.onHashChange();

            if (!this.isListening) {
                this.startListening();
            }
        },

        remove: function() {
            this.map = null;
            if (this.isListening) {
                this.stopListening();
            }
        },

        onMapMove: function(map) {
            // bail if we're moving the map (updating from a hash),
            // or if the map has no zoom set
            if (this.movingMap || this.map.zoom === 0) {
                return false;
            }
            var hash = this.formatHash(map);
            if (this.lastHash != hash) {
                location.replace(hash);
                this.lastHash = hash;
            }
        },

        movingMap: false,
        update: function() {
            var hash = location.hash;
            if (hash === this.lastHash) {
                // console.info("(no change)");
                return;
            }
            var sansHash = hash.substr(1),
                parsed = this.parseHash(sansHash);
            if (parsed) {
                // console.log("parsed:", parsed.zoom, parsed.center.toString());
                this.movingMap = true;
                this.map.setCenterZoom(parsed.center, parsed.zoom);
                this.movingMap = false;
            } else {
                // console.warn("parse error; resetting:", this.map.getCenter(), this.map.getZoom());
                this.onMapMove(this.map);
            }
        },

        // defer hash change updates every 100ms
        changeDefer: 100,
        changeTimeout: null,
        onHashChange: function() {
            // throttle calls to update() so that they only happen every
            // `changeDefer` ms
            if (!this.changeTimeout) {
                var that = this;
                this.changeTimeout = setTimeout(function() {
                    that.update();
                    that.changeTimeout = null;
                }, this.changeDefer);
            }
        },

        isListening: false,
        hashChangeInterval: null,
        startListening: function() {
            if (HAS_HASHCHANGE) {
                window.addEventListener("hashchange", this.onHashChange, false);
            } else {
                clearInterval(this.hashChangeInterval);
                this.hashChangeInterval = setInterval(this.onHashChange, 50);
            }
            this.isListening = true;
        },

        stopListening: function() {
            if (HAS_HASHCHANGE) {
                window.removeEventListener("hashchange", this.onHashChange);
            } else {
                clearInterval(this.hashChangeInterval);
            }
            this.isListening = false;
        }
    };
