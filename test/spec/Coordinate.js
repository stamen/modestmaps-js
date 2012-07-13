describe('Coordinate', function() {
  var coordinate;

  beforeEach(function() {
    coordinate = new MM.Coordinate(0, 0, 2);
  });

  it('generates a key', function() {
      expect(typeof coordinate.toKey()).toEqual('string');
  });

  it('can provide a zoomed-in coordinate', function() {
      expect((coordinate.zoomBy(1)).zoom).toEqual(3);
  });

  it('can provide a zoomed-out coordinate', function() {
      expect((coordinate.zoomBy(-1)).zoom).toEqual(1);
  });

  it('can be copied', function() {
      expect(coordinate.copy()).toEqual(coordinate);
  });

  it('will yield a container', function() {
      var oc = coordinate.copy();
      coordinate.right(0.1);
      expect(coordinate.container().column).toEqual(oc.column);
  });

});
