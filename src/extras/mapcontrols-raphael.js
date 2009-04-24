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

    this.canvas = Raphael(this.div, 200, 100);

    var left = this.canvas.circle(15, 30, 10).attr("fill", "red");
    var lefta = this.canvas.path({fill: "white"}, "M -6 0 L 3 -5 L 3 5").translate(15, 30);
    var down = this.canvas.circle(40, 45, 10).attr("fill", "red");
    var downa = this.canvas.path({fill: "white"}, "M 0 6 L -5 -3 L 5 -3").translate(40, 45);
    var right = this.canvas.circle(65, 30, 10).attr("fill", "red");
    var righta = this.canvas.path({fill: "white"}, "M 6 0 L -3 -5 L -3 5").translate(65, 30);
    var up = this.canvas.circle(40, 15, 10).attr("fill", "red");
    var upa = this.canvas.path({fill: "white"}, "M 0 -6 L -5 3 L 5 3").translate(40, 15);
    var zin = this.canvas.circle(95, 15, 10).attr("fill", "red");
    var zina = this.canvas.path({stroke: "white", 'stroke-width': 2}, "M -5 0 L 5 0 M 0 -5 L 0 5").translate(95, 15);
    var zout = this.canvas.circle(95, 45, 10).attr("fill", "red");
    var zouta = this.canvas.path({stroke: "white", 'stroke-width': 2}, "M -5 0 L 5 0").translate(95, 45);
    
    lefta.node.onclick = left.node.onclick = function() { map.panLeft() };
    righta.node.onclick = right.node.onclick = function() { map.panRight() };
    upa.node.onclick = up.node.onclick = function() { map.panUp() };
    downa.node.onclick = down.node.onclick = function() { map.panDown() };
    zina.node.onclick = zin.node.onclick = function() { map.zoomIn() };
    zouta.node.onclick = zout.node.onclick = function() { map.zoomOut() };
    
    lefta.node.style.cursor = left.node.style.cursor = 'pointer';
    righta.node.style.cursor = right.node.style.cursor = 'pointer';
    upa.node.style.cursor = up.node.style.cursor = 'pointer';
    downa.node.style.cursor = down.node.style.cursor = 'pointer';
    zina.node.style.cursor = zin.node.style.cursor = 'pointer';
    zouta.node.style.cursor = zout.node.style.cursor = 'pointer';
    
};

com.modestmaps.MapControls.prototype = {

    div: null,
    canvas: null
    
};