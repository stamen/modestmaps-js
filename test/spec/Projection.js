describe('Projection', function() {
    var m, l;

    beforeEach(function() {
        m = new MM.MercatorProjection(10);
        l = new MM.LinearProjection(10);
    });

    it('can instantiate a mercator projection', function() {
        // TODO: row is a very small number because of odd javascript math.
        expect(m.locationCoordinate(new MM.Location(0, 0)).column).toEqual(0);
        expect(m.locationCoordinate(new MM.Location(0, 0)).zoom).toEqual(10);
        expect(m.coordinateLocation(new MM.Coordinate(0, 0, 10)))
            .toEqual(new MM.Location(0, 0));
    });

    it('linear projects do not change normal points', function() {
        expect(l.project({x: 10, y: 10}).x).toEqual(10);
        expect(l.project({x: 10, y: 10}).y).toEqual(10);
        expect(l.unproject({x: 10, y: 10}).x).toEqual(10);
        expect(l.unproject({x: 10, y: 10}).y).toEqual(10);
    });

    it('is accurate up to 3 decimals', function() {
        // Confirm that these values are valid up to a 3 decimals
        var c2 = m.locationCoordinate(new MM.Location(37, -122));
        expect(Math.round(c2.row * 1000) / 1000).toEqual(0.696);
        expect(Math.round(c2.column * 1000) / 1000).toEqual(-2.129);
        expect(c2.zoom).toEqual(10);
    });

    it('coordinatelocation to work', function() {
        var l2 = m.coordinateLocation(new MM.Coordinate(0.696, -2.129, 10));
        expect(Math.round(l2.lat * 1000) / 1000).toEqual(37.001);
        expect(Math.round(l2.lon * 1000) / 1000).toEqual(-121.983);
    });
});
