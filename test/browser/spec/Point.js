describe('Point', function() {
    var MM = com.modestmaps;

    it('creates a point', function() {
        var p = new MM.Point(0, 1);
        expect(p).toEqual({ x: 0, y: 1 });
    });
});
