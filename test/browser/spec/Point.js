describe('Point', function() {
    it('creates a point', function() {
        var p = new MM.Point(0, 1);
        expect(p.x).toEqual(0);
        expect(p.y).toEqual(1);
    });
});
