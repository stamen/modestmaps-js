describe('Providers', function() {
    // Currently not testing subdomain-based templatedmapprovider, since
    // the implementation should be kind of undefined.
    it('basic templatedmapprovider', function() {
        var p = new MM.Template(
            'http://{S}.tile.openstreetmap.org/{Z}/{X}/{Y}.png', ['a']);

       expect(p.getTile(new MM.Coordinate(1225, 1832, 12))).toEqual(
          'http://a.tile.openstreetmap.org/12/1832/1225.png');
    });
});
