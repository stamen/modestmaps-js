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

    it('can calculate distance to another location', function() {
        var a = new MM.Location(0, 1);
        var b = new MM.Location(0, 10);

        expect(MM.Location.distance(a, b)).toBeCloseTo(1001853.897);
    });

    it('can interpolate a new location', function() {
        var a = new MM.Location(0, 1);
        var b = new MM.Location(0, 10);

        expect(MM.Location.interpolate(a, b, 0.5).lat).toBeCloseTo(0);
        expect(MM.Location.interpolate(a, b, 0.5).lon).toBeCloseTo(5.5);
    });
});
