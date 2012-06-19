describe('Point', function() {
    it('creates a point', function() {
        var p = new MM.Point(0, 1);
        expect(p.x).toEqual(0);
        expect(p.y).toEqual(1);
    });

    it('correctly computes distance to another point', function() {
        var p = new MM.Point(0, 0);
        var q = new MM.Point(0, 10);
        expect(MM.Point.distance(p, q)).toEqual(10);

        var p1 = new MM.Point(0, 0);
        var q1 = new MM.Point(5, 2);
        expect(MM.Point.distance(p1, q1)).toBeCloseTo(5.3851);
    });

    it('correctly interpolates positions', function() {
        var p = new MM.Point(0, 0);
        var q = new MM.Point(0, 10);
        expect(MM.Point.interpolate(p, q, 0.5).y).toEqual(5);
    });

    it('can yield a copy', function() {
        var p = new MM.Point(0, 0);
        expect(p.copy()).toEqual(p);
    });
});
