describe('Globals', function() {
    it('does not leak', function() {
      var globalsBefore = {};
      for (var key in window) {
          globalsBefore[key] = true;
      }

      var div = document.createElement('div');
      div.id = +new Date();
      div.style.width = 500;
      div.style.height = 500;
          var template = 'http://{S}tile.openstreetmap.org/{Z}/{X}/{Y}.png';
      var subdomains = [ '', 'a.', 'b.', 'c.' ];
      var provider = new MM.TemplatedLayer(template, subdomains);
      var map = new MM.Map(div, provider, new MM.Point(400, 400));

      var globalsAfter = {};
      for (var afterkey in window) {
          globalsAfter[afterkey] = true;
      }

      expect(globalsBefore).toEqual(globalsAfter);
    });
});
