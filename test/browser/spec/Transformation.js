describe('Transformation', function() {
    var MM = com.modestmaps;
    it('can do an identity transform', function() {
        var t = new MM.Transformation(1, 0, 0, 0, 1, 0);
        var p = new MM.Point(1, 1);

        var p_ = t.transform(p);
        var p__ = t.untransform(p_);

        expect(p).toEqual({ x: 1, y: 1 });
        expect(p_).toEqual({ x: 1, y: 1 });
        expect(p__).toEqual({ x: 1, y: 1 });
    });

    it('can do an inverse transform', function() {
        var t = new MM.Transformation(0, 1, 0, 1, 0, 0);
        var p = new MM.Point(0, 1);

        var p_ = t.transform(p);
        var p__ = t.untransform(p_);

        expect(p).toEqual({ x: 0, y: 1 });
        expect(p_).toEqual({ x: 1, y: 0 });
        expect(p__).toEqual({ x: 0, y: 1 });
    });

    it('can do an addition transform', function() {
        var t = new MM.Transformation(1, 0, 1, 0, 1, 1);
        var p = new MM.Point(0, 0);

        var p_ = t.transform(p);
        var p__ = t.untransform(p_);

        expect(p).toEqual({ x: 0, y: 0 });
        expect(p_).toEqual({ x: 1, y: 1 });
        expect(p__).toEqual({ x: 0, y: 0 });
    });
});
