describe('Map', function() {
  var map, div, sink;

  function Receiver() { }
  Receiver.prototype.receive = function() { };

  beforeEach(function() {
    sink = new Receiver();
    div = document.createElement('div');
    div.id = +new Date();
    div.style.width = 500;
    div.style.height = 500;

    var template = 'http://{S}tile.openstreetmap.org/{Z}/{X}/{Y}.png';
    var subdomains = [ '', 'a.', 'b.', 'c.' ];
    var provider = new com.modestmaps.TemplatedMapProvider(template, subdomains);

    map = new com.modestmaps.Map(div, provider);
    map.setCenterZoom(new com.modestmaps.Location(0, 0), 0);
  });

  it('attaches itself to a parent div', function() {
      expect(map.parent).toEqual(div);
  });

  it('has set a proper zoom level', function() {
      expect(map.getZoom()).toEqual(0);
  });

  it('has a center coordinate', function() {
      expect(typeof map.coordinate.row).toEqual('number');
      expect(typeof map.coordinate.column).toEqual('number');
      expect(typeof map.coordinate.zoom).toEqual('number');
  });

  it('binds and calls drawn', function() {
      spyOn(sink, 'receive');
      map.addCallback('drawn', sink.receive);

      runs(function() {
          map.draw();
      });

      waits(500);

      runs(function() {
          expect(sink.receive).toHaveBeenCalledWith(map, undefined);
      });
  });

  it('binds and calls zoomed', function() {
      spyOn(sink, 'receive');
      map.addCallback('zoomed', sink.receive);

      runs(function() {
          map.zoomIn();
      });

      waits(500);

      runs(function() {
          expect(sink.receive).toHaveBeenCalledWith(map, 1);
      });
  });

  it('binds and calls panned', function() {
      spyOn(sink, 'receive');
      map.addCallback('panned', sink.receive);

      runs(function() {
          map.panBy(2, 2);
      });

      waits(500);

      runs(function() {
          expect(sink.receive).toHaveBeenCalledWith(map, [2, 2]);
      });
  });


  it('binds and calls resized', function() {
      spyOn(sink, 'receive');
      map.addCallback('resized', sink.receive);

      runs(function() {
          map.setSize({
              x: 200, y: 300
          });
      });

      waits(500);

      runs(function() {
          expect(sink.receive).toHaveBeenCalledWith(map, [{ x: 200, y: 300}]);
      });
  });
});
