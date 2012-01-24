describe('Location', function() {
    it('creates a location', function() {
        var p = new MM.Location(0, 1);
        expect(p.lon).toEqual(1);
        expect(p.lat).toEqual(0);
    });
    it('can be copied', function() {
        var p = new MM.Location(0, 1);
        expect(p.lon).toEqual(1);
        expect(p.lat).toEqual(0);
        var cp = p.copy();
        expect(cp.lon).toEqual(1);
        expect(cp.lat).toEqual(0);
    });
});
