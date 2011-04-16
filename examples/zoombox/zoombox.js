com.modestmaps.ZoomBox = function(map) {

    this.map = map;

    var theBox = this;

    this.getMousePoint = function(e) {
        // start with just the mouse (x, y)
        var point = new com.modestmaps.Point(e.clientX, e.clientY);
        
        // correct for scrolled document
        point.x += document.body.scrollLeft + document.documentElement.scrollLeft;
        point.y += document.body.scrollTop + document.documentElement.scrollTop;

        // correct for nested offsets in DOM
        for(var node = this.map.parent; node; node = node.offsetParent) {
            point.x -= node.offsetLeft;
            point.y -= node.offsetTop;
        }
        
        return point;
    };

    var boxDiv = document.createElement('div');
    boxDiv.id = map.parent.id+'-zoombox';
    boxDiv.style.cssText = 'margin:0; padding:0; position:absolute; top:0; left:0;'
    boxDiv.style.width = map.dimensions.x+'px';
    boxDiv.style.height = map.dimensions.y+'px';        
    map.parent.appendChild(boxDiv);    

    var box = document.createElement('div');
    box.id = map.parent.id+'-zoombox-box';
    box.style.cssText = 'margin:0; padding:0; border:1px dashed #888; background: rgba(255,255,255,0.25); position: absolute; top: 0; left: 0; width: 0; height: 0; display: none;';
    boxDiv.appendChild(box);    

    // TODO: respond to resize

    var mouseDownPoint = null;
    
    this.mouseDown = function(e) {
        if (e.shiftKey) {
            mouseDownPoint = theBox.getMousePoint(e);
            
            box.style.left = mouseDownPoint.x + 'px';
            box.style.top = mouseDownPoint.y + 'px';
    
            com.modestmaps.addEvent(map.parent, 'mousemove', theBox.mouseMove);
            com.modestmaps.addEvent(map.parent, 'mouseup', theBox.mouseUp);
            
            map.parent.style.cursor = 'crosshair';
            
            return com.modestmaps.cancelEvent(e);
        }
    };

    this.mouseMove = function(e) {
        var point = theBox.getMousePoint(e);
        box.style.display = 'block';
        if (point.x < mouseDownPoint.x) {
            box.style.left = point.x + 'px';
        }
        else {
            box.style.left = mouseDownPoint.x + 'px';
        }
        box.style.width = Math.abs(point.x - mouseDownPoint.x) + 'px';
        if (point.y < mouseDownPoint.y) {
            box.style.top = point.y + 'px';
        }
        else {
            box.style.top = mouseDownPoint.y + 'px';
        }
        box.style.height = Math.abs(point.y - mouseDownPoint.y) + 'px';
        return com.modestmaps.cancelEvent(e);
    };    

    this.mouseUp = function(e) {
    
        var point = theBox.getMousePoint(e);
        
        var l1 = map.pointLocation(point);
        var l2 = map.pointLocation(mouseDownPoint);
        map.setExtent([l1,l2]);
    
        box.style.display = 'none';        
        com.modestmaps.removeEvent(map.parent, 'mousemove', theBox.mouseMove);
        com.modestmaps.removeEvent(map.parent, 'mouseup', theBox.mouseUp);        

        map.parent.style.cursor = 'auto';
        
        return com.modestmaps.cancelEvent(e);
    };
    
    com.modestmaps.addEvent(boxDiv, 'mousedown', this.mouseDown);
}
