    // Instance of a map intended for drawing to a div.
    //
    //  * `parent` (required DOM element)
    //      Can also be an ID of a DOM element
    //  * `provider` (required MM.MapProvider or URL template)
    //  * `location` (required MM.Location)
    //      Location for map to show
    //  * `zoom` (required number)
    MM.mapByCenterZoom = function(parent, layerish, location, zoom) {
        var layer = MM.coerceLayer(layerish),
            map = new MM.Map(parent, layer, false);
        map.setCenterZoom(location, zoom).draw();
        return map;
    };

    // Instance of a map intended for drawing to a div.
    //
    //  * `parent` (required DOM element)
    //      Can also be an ID of a DOM element
    //  * `provider` (required MM.MapProvider or URL template)
    //  * `locationA` (required MM.Location)
    //      Location of one map corner
    //  * `locationB` (required MM.Location)
    //      Location of other map corner
    MM.mapByExtent = function(parent, layerish, locationA, locationB) {
        var layer = MM.coerceLayer(layerish),
            map = new MM.Map(parent, layer, false);
        map.setExtent([locationA, locationB]).draw();
        return map;
    };
