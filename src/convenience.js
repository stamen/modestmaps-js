    
    // Instance of a map intended for drawing to a div.
    //
    //  * `parent` (required DOM element)
    //      Can also be an ID of a DOM element
    //  * `provider` (required MM.MapProvider or URL template)
    //  * `location` (required MM.Location)
    //      Location for map to show
    //  * `zoom` (required number)
    MM.mapByCenterZoom = function(parent, provider, location, zoom)
    {
        if (typeof provider == 'string')
        {
            provider = new MM.TemplatedMapProvider(provider);
        }

        var layer = new MM.Layer(provider, null),
            map = new MM.Map(parent, layer, false);
        
        map.setCenterZoom(location, zoom);
        map.draw();
        
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
    MM.mapByExtent = function(parent, provider, locationA, locationB)
    {
        if (typeof provider == 'string')
        {
            provider = new MM.TemplatedMapProvider(provider);
        }

        var layer = new MM.Layer(provider, null),
            map = new MM.Map(parent, layer, false);
        
        map.setExtent([locationA, locationB]);
        map.draw();
        
        return map;
    };
