describe('DoubleClickHandler', function() {
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
                                     new MM.DoubleClickHandler()
        ]);
        map.setCenterZoom(new MM.Location(0, 0), 0);
    });

    it('does not zoom in on single click', function() {
        expect(map.getZoom()).toEqual(0);
        happen.click(map.parent);
        expect(map.getZoom()).toEqual(0);
    });

    it('zooms in on double click', function() {
        expect(map.getZoom()).toEqual(0);
        happen.dblclick(map.parent);
        expect(map.getZoom()).toEqual(1);
    });

    it('zooms out on double click with shift', function() {
        map.setZoom(1);
        happen.dblclick(map.parent, { shift: true });
        expect(map.getZoom()).toEqual(0);
    });
});
