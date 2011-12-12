/* Modernizr 2.0.6 (Custom Build) | MIT & BSD
 * Build: http://www.modernizr.com/download/#-hashchange-hasevent
 */
;window.Modernizr=function(a,b,c){function x(a,b){return!!~(""+a).indexOf(b)}function w(a,b){return typeof a===b}function v(a,b){return u(prefixes.join(a+";")+(b||""))}function u(a){j.cssText=a}var d="2.0.6",e={},f=b.documentElement,g=b.head||b.getElementsByTagName("head")[0],h="modernizr",i=b.createElement(h),j=i.style,k,l=Object.prototype.toString,m={},n={},o={},p=[],q=function(){function d(d,e){e=e||b.createElement(a[d]||"div"),d="on"+d;var f=d in e;f||(e.setAttribute||(e=b.createElement("div")),e.setAttribute&&e.removeAttribute&&(e.setAttribute(d,""),f=w(e[d],"function"),w(e[d],c)||(e[d]=c),e.removeAttribute(d))),e=null;return f}var a={select:"input",change:"input",submit:"form",reset:"form",error:"img",load:"img",abort:"img"};return d}(),r,s={}.hasOwnProperty,t;!w(s,c)&&!w(s.call,c)?t=function(a,b){return s.call(a,b)}:t=function(a,b){return b in a&&w(a.constructor.prototype[b],c)},m.hashchange=function(){return q("hashchange",a)&&(b.documentMode===c||b.documentMode>7)};for(var y in m)t(m,y)&&(r=y.toLowerCase(),e[r]=m[y](),p.push((e[r]?"":"no-")+r));u(""),i=k=null,e._version=d,e.hasEvent=q;return e}(this,this.document);

// namespacing!
if (!com) {
    var com = {};
}
if (!com.modestmaps) {
    com.modestmaps = {};
}

(function(MM) {

    MM.Hash = function(map) {
        this.onMapMove = MM.bind(this.onMapMove, this);
        this.onHashChange = MM.bind(this.onHashChange, this);
        if (map) {
            this.setMap(map);
        }
    };

    MM.Hash.prototype = {
        map: null,
        lastHash: null,

        parseHash: function(hash) {
            var args = hash.split("/");
            if (args.length == 3) {
                var zoom = parseInt(args[0]),
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

        setMap: function(map) {
            if (this.map) {
                this.map.removeCallback("drawn", this.onMapMove);
            }
            if (map) {
                this.map = map;
                this.map.addCallback("drawn", this.onMapMove);
                // reset the hash
                this.lastHash = null;
                this.onHashChange();

                if (!this.isListening) {
                    this.startListening();
                }
            } else {
                if (this.isListening) {
                    this.stopListening();
                }
            }
        },

        onMapMove: function(map) {
            if (this.movingMap) {
                return false;
            }
            var hash = this.formatHash(map);
            if (this.lastHash != hash) {
                location.replace(hash);
                this.lastHash = hash;
            }
        },

        onHashChange: function() {
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
                // console.warn("parse error; resetting");
                this.onMapMove(this.map);
            }
        },

        isListening: false,
        hashChangeInterval: null,
        startListening: function() {
            if (Modernizr.hashchange) {
                window.addEventListener("hashchange", this.onHashChange, false);
            } else {
                clearInterval(this.hashChangeInterval);
                this.hashChangeInterval = setInterval(this.onHashChange, 50);
            }
        },

        stopListening: function() {
            if (Modernizr.hashchange) {
                window.removeEventListener("hashchange", this.onHashChange);
            } else {
                clearInterval(this.hashChangeInterval);
            }
        }
    };

})(com.modestmaps);
