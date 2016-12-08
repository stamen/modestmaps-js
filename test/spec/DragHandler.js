describe('DragHandler', function() {
    var map;

    beforeEach(function() {
        div = document.createElement('div');
        div.id = +new Date();
        div.style.width = 500;
        div.style.height = 500;

        var template = 'http://{S}tile.openstreetmap.org/{Z}/{X}/{Y}.png';
            var subdomains = [ '', 'a.', 'b.', 'c.' ];
        var provider = new MM.TemplatedLayer(template, subdomains);

        map = new MM.Map(div, provider, [
            new MM.DragHandler()
        ]);
        map.setCenterZoom(new MM.Location(0, 0), 0);
    });

    it('changes the cursor style to move while moving', function() {
        happen.mousedown(map.parent, { clientX: 10, clientY: 10 });
        expect(map.parent.style.cursor).toEqual('move');
    });

    it('pan the map when you do a panning motion', function() {
        expect(~~map.getCenter().lat).toEqual(0);
        expect(~~map.getCenter().lon).toEqual(0);
        happen.mousedown(map.parent, { clientX: 10, clientY: 10 });
        happen.mousemove(document, { clientX: 30, clientY: 30 });
        happen.mouseup(document, { clientX: 30, clientY: 30 });
        expect(~~map.getCenter().lat).toEqual(27);
        expect(~~map.getCenter().lon).toEqual(-28);
    });
});
