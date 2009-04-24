dojo.require("dojox.gfx");

// namespacing!
if (!com) {
    var com = { };
    if (!com.modestmaps) {
        com.modestmaps = { };
    }
}

com.modestmaps.MapControls = function(map)
{
    // get your div on
    
    this.div = document.createElement('div');
    this.div.style.position = 'absolute';
    this.div.style.left = '0px';
    this.div.style.top = '0px';
    map.parent.appendChild(this.div);

    dojo.require("dojox.gfx");

    this.canvas = dojox.gfx.createSurface(this.div, 200, 100);

    var left = this.canvas.createGroup();
    left.createCircle({cx: 0, cy: 0, r: 10}).setFill("red").setStroke("black");
    left.createPath().moveTo(-6, 0).lineTo(3, -5, 3, 5).setFill("white");
    left.setTransform({dx:15, dy:30});
    var down = this.canvas.createGroup();
    down.createCircle({cx: 0, cy: 0, r: 10}).setFill("red").setStroke("black");
    down.createPath().moveTo(0, 6).lineTo(-5, -3, 5, -3).setFill("white");
    down.setTransform({dx:40, dy:45});
    var right = this.canvas.createGroup();
    right.createCircle({cx: 0, cy: 0, r: 10}).setFill("red").setStroke("black");
    right.createPath().moveTo(6, 0).lineTo(-3, -5, -3, 5).setFill("white");
    right.setTransform({dx:65, dy:30});
    var up = this.canvas.createGroup();
    up.createCircle({cx: 0, cy: 0, r: 10}).setFill("red").setStroke("black");
    up.createPath().moveTo(0, -6).lineTo(-5, 3, 5, 3).setFill("white");
    up.setTransform({dx:40, dy:15});
    var zin = this.canvas.createGroup();
    zin.createCircle({cx: 0, cy: 0, r: 10}).setFill("red").setStroke("black");
    zin.createPath().moveTo(-5, 0).lineTo(5, 0).moveTo(0, -5).lineTo(0, 5).setStroke({color:"white", width:2});
    zin.setTransform({dx:95, dy:15});
    var zout = this.canvas.createGroup();
    zout.createCircle({cx: 0, cy: 0, r: 10}).setFill("red").setStroke("black");
    zout.createPath().moveTo(-5, 0).lineTo(5, 0).setStroke({color:"white", width:2});
    zout.setTransform({dx:95, dy:45});
    
    left.connect('click', map, 'panLeft');
    right.connect('click', map, 'panRight');
    up.connect('click', map, 'panUp');
    down.connect('click', map, 'panDown');
    zin.connect('click', map, 'zoomIn');
    zout.connect('click', map, 'zoomOut');
    
    left.rawNode.style.cursor = 'pointer';
    right.rawNode.style.cursor = 'pointer';
    up.rawNode.style.cursor = 'pointer';
    down.rawNode.style.cursor = 'pointer';
    zin.rawNode.style.cursor = 'pointer';
    zout.rawNode.style.cursor = 'pointer';
    
};

com.modestmaps.MapControls.prototype = {

    div: null,
    canvas: null
    
};