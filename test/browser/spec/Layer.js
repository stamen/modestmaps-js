describe('Layer', function() {
    // Currently not testing subdomain-based templatedmapprovider, since
    // the implementation should be kind of undefined.
    it('layer can be created and destroyed', function() {
        var p = new MM.TemplatedLayer(
            'http://{S}.tile.openstreetmap.org/{Z}/{X}/{Y}.png', ['a']);
        var l = new MM.Layer(p);

        l.destroy();
        expect(l.map).toEqual(null);
    });
});
