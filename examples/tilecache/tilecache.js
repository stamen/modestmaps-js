MM.TileCacheMapProvider = function(template, subdomains) {

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
        return addZeros(parseInt(i / 1000000, 10)) + '/' +
            addZeros(parseInt(i / 1000, 10)) + '/' + addZeros(i % 1000);
    }

    // this is like a call to 'super', kinda...
    // we end up initializing a basic modestmaps.js MapProvider with
    // a getTileURL function that knows about the above utility functions
    MM.MapProvider.call(this, function(coord) {
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
        if (url.indexOf('{S}') > -1) {
            var subdomain = (subdomains && subdomains.length > 0) ?
              subdomains[parseInt(mod.row + mod.column, 10) % subdomains.length] : '';
            url = url.replace('{S}', subdomain ? subdomain + '.' : '');
        }

        return url;
    });
};

MM.extend(MM.TileCacheMapProvider, MM.MapProvider);
