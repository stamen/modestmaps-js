
    //////////////////////////// Layer

    MM.Layer = function(map, provider)
    {
        this.parent = document.createElement('div');
        this.parent.style.cssText = 'position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; margin: 0; padding: 0; z-index: 0';

        map.parent.appendChild(this.parent);
        
        this.provider = provider;
    }
    
    MM.Layer.prototype = {
    
        parent: null,
        provider: null,
        tiles: null
    
    };
