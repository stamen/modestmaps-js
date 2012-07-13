describe('Transformation', function() {
    it('can do an identity transform', function() {
        var t = new MM.Transformation(1, 0, 0, 0, 1, 0);
        var p = new MM.Point(1, 1);

        var p_ = t.transform(p);
        var p__ = t.untransform(p_);

        expect(p).toEqual(new MM.Point(1, 1));
        expect(p_).toEqual(new MM.Point(1, 1));
        expect(p__).toEqual(new MM.Point(1, 1));
    });

    it('can do an inverse transform', function() {
        var t = new MM.Transformation(0, 1, 0, 1, 0, 0);
        var p = new MM.Point(0, 1);

        var p_ = t.transform(p);
        var p__ = t.untransform(p_);

        expect(p).toEqual(new MM.Point(0, 1));
        expect(p_).toEqual(new MM.Point(1, 0));
        expect(p__).toEqual(new MM.Point(0, 1));
    });

    it('can do an addition transform', function() {
        var t = new MM.Transformation(1, 0, 1, 0, 1, 1);
        var p = new MM.Point(0, 0);

        var p_ = t.transform(p);
        var p__ = t.untransform(p_);

        expect(p).toEqual(new MM.Point(0, 0));
        expect(p_).toEqual(new MM.Point(1,  1));
        expect(p__).toEqual(new MM.Point(0, 0));
    });
});
