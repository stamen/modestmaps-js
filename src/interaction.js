    //////////////////////////// Event Handlers

    // map is optional here, use init if you don't have a map yet
    MM.MouseHandler = function(map) { 
        if (map !== undefined) {
            this.init(map);
        }
    };
    
    MM.MouseHandler.prototype = {
    
        init: function(map) {
            this.map = map;
            MM.addEvent(map.parent, 'dblclick', this.getDoubleClick());
            MM.addEvent(map.parent, 'mousedown', this.getMouseDown());
            MM.addEvent(map.parent, 'mousewheel', this.getMouseWheel());            
        },
        
        mouseDownHandler: null,
    
        getMouseDown: function() {
            if (!this.mouseDownHandler) {
                var theHandler = this;
                this.mouseDownHandler = function(e) {
        
                    MM.addEvent(document, 'mouseup', theHandler.getMouseUp());
                    MM.addEvent(document, 'mousemove', theHandler.getMouseMove());
                            
                    theHandler.prevMouse = new MM.Point(e.clientX, e.clientY);
                    
                    theHandler.map.parent.style.cursor = 'move';
                
                    return MM.cancelEvent(e);
                };
            }
            return this.mouseDownHandler;
        },
        
        mouseMoveHandler: null,
        
        getMouseMove: function() {
            if (!this.mouseMoveHandler) {
                var theHandler = this;
                this.mouseMoveHandler = function(e) {
        
                    if (theHandler.prevMouse) {
                        theHandler.map.panBy(e.clientX - theHandler.prevMouse.x, e.clientY - theHandler.prevMouse.y);
                        theHandler.prevMouse.x = e.clientX;
                        theHandler.prevMouse.y = e.clientY;
                    }
                
                    return MM.cancelEvent(e);
                };
            }
            return this.mouseMoveHandler;
        },
    
        mouseUpHandler: null,
    
        getMouseUp: function() {
            if (!this.mouseUpHandler) {
                var theHandler = this;
                this.mouseUpHandler = function(e) {
        
                    MM.removeEvent(document, 'mouseup', theHandler.getMouseUp());
                    MM.removeEvent(document, 'mousemove', theHandler.getMouseMove());
            
                    theHandler.prevMouse = null;
    
                    theHandler.map.parent.style.cursor = '';                
            
                    return MM.cancelEvent(e);
                };
            }
            return this.mouseUpHandler;
        },
        
        mouseWheelHandler: null,
    
        getMouseWheel: function() {
            if (!this.mouseWheelHandler) {
                var theHandler = this;
                var prevTime = new Date().getTime();
                this.mouseWheelHandler = function(e) {
        
                    var delta = 0;
                    
                    if (e.wheelDelta) {
                        delta = e.wheelDelta;
                    }
                    else if (e.detail) {
                        delta = -e.detail;
                    }
        
                    // limit mousewheeling to once every 200ms
                    var timeSince = new Date().getTime() - prevTime;
        
                    if (Math.abs(delta) > 0 && (timeSince > 200)) {
                        
                        var point = theHandler.getMousePoint(e);
                        
                        theHandler.map.zoomByAbout(delta > 0 ? 1 : -1, point);
                        
                        prevTime = new Date().getTime();
                    }
                    
                    return MM.cancelEvent(e);
                };
            }
            return this.mouseWheelHandler;
        },
    
        doubleClickHandler: null,
    
        getDoubleClick: function() {
            if (!this.doubleClickHandler) {
                var theHandler = this;
                this.doubleClickHandler = function(e) {
        
                    var point = theHandler.getMousePoint(e);
                    
                    // use shift-double-click to zoom out
                    theHandler.map.zoomByAbout(e.shiftKey ? -1 : 1, point);    
                    
                    return MM.cancelEvent(e);
                };
            }
            return this.doubleClickHandler;
        },
    
        // interaction helper
    
        getMousePoint: function(e) {
            // start with just the mouse (x, y)
            var point = new MM.Point(e.clientX, e.clientY);
            
            // correct for scrolled document
            point.x += document.body.scrollLeft + document.documentElement.scrollLeft;
            point.y += document.body.scrollTop + document.documentElement.scrollTop;
    
            // correct for nested offsets in DOM
            for(var node = this.map.parent; node; node = node.offsetParent) {
                point.x -= node.offsetLeft;
                point.y -= node.offsetTop;
            }
            
            return point;
        }
    
    };
