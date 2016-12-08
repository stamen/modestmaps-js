describe('Extent', function() {
  var ext;

  function Receiver() { }
  Receiver.prototype.receive = function() { };

  beforeEach(function() {
    ext = new MM.Extent(-10, -10, 10, 10);

  });

  it('properly initializes its sides', function() {
      expect(ext.west).toEqual(-10);
      expect(ext.south).toEqual(-10);
      expect(ext.north).toEqual(10);
      expect(ext.east).toEqual(10);
  });

  it('expands to fit a location', function() {
      ext.encloseLocation(new MM.Location(-40, -40));
      expect(ext.west).toEqual(-40);
      expect(ext.south).toEqual(-40);
  });

  it('expands to fit locations', function() {
      ext.encloseLocations([
        new MM.Location(-40, -40),
        new MM.Location(40, 40)
      ]);
      expect(ext.west).toEqual(-40);
      expect(ext.east).toEqual(40);
      expect(ext.south).toEqual(-40);
      expect(ext.north).toEqual(40);
  });

  it('knows when it contains a location', function() {
      expect(ext.containsLocation(new MM.Location(0, 0))).toEqual(true);
      expect(ext.containsLocation(new MM.Location(0, 90))).toEqual(false);
  });

});
