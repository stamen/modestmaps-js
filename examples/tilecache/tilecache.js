com.modestmaps.TileCacheMapProvider = function(template, subdomains) {

    // utility functions...

    function addZeros(i, zeros) {
        if (zeros === undefined) {
            zeros = 3;
        }
        var s = i.toString();
        while (s.length < zeros)
        {
            s = '0' + s;
        }
        return s;
    }
    
    function tilePad(i) {
        return addZeros(parseInt(i / 1000000)) + '/' + addZeros(parseInt(i / 1000)) + '/' + addZeros(i % 1000);
    }

    // this is like a call to 'super', kinda... 
    // we end up initializing a basic modestmaps.js MapProvider with 
    // a getTileURL function that knows about the above utility functions

    com.modestmaps.MapProvider.call(this, function(coord) {
    
        coord = this.sourceCoordinate(coord);
        if (!coord) {
            return null;
        }

        var mod = coord.copy();

        // fill in coordinates into URL
        var url = template.replace('{Z}', mod.zoom)
                          .replace('{X}', tilePad(mod.column))
                          .replace('{Y}', tilePad(Math.pow(2, mod.zoom) - 1 - mod.row));
        
        // replace the {S} portion of the url with the appropriate subdomain
        if (url.indexOf('{S}') > -1)
        {
            var subdomain = (subdomains && subdomains.length > 0)
                                   ? subdomains[parseInt(mod.row + mod.column) % subdomains.length]
                                   : '';
            url = url.replace('{S}', subdomain ? subdomain + '.' : '');
        }

        return url;        
    });
    
};

com.modestmaps.extend(com.modestmaps.TileCacheMapProvider, com.modestmaps.MapProvider);
