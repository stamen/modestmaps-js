function kothicProvider() {
  var k = {};

  var canvases = {};
  var scripts = {};
  var callbacks = {};

  var kothic = new Kothic({
      buffered: false,
      styles: MapCSS.availableStyles,
      locales: ['be', 'ru', 'en']
  });

  function loadScript(url) {
     var script = document.createElement('script');
     script.src = url;
     script.charset = 'utf-8';
     document.getElementsByTagName('head')[0].appendChild(script);
     return script;
  }

  function _invertYAxe (data) {
    var type, coordinates, tileSize = data.granularity, i, j, k, l, feature;
    for (i = 0; i < data.features.length; i++) {
        feature = data.features[i];
        coordinates = feature.coordinates;
        type = data.features[i].type;
        if (type === 'Point') {
            coordinates[1] = tileSize - coordinates[1];
        } else if (type === 'MultiPoint' || type === 'LineString') {
            for (j = 0; j < coordinates.length; j++) {
                coordinates[j][1] = tileSize - coordinates[j][1];
            }
        } else if (type === 'MultiLineString' || type === 'Polygon') {
            for (k = 0; k < coordinates.length; k++) {
                for (j = 0; j < coordinates[k].length; j++) {
                    coordinates[k][j][1] = tileSize - coordinates[k][j][1];
                }
            }
        } else if (type === 'MultiPolygon') {
            for (l = 0; l < coordinates.length; l++) {
                for (k = 0; k < coordinates[l].length; k++) {
                    for (j = 0; j < coordinates[l][k].length; j++) {
                        coordinates[l][k][j][1] = tileSize - coordinates[l][k][j][1];
                    }
                }
            }
        } else {
            throw "Unexpected GeoJSON type: " + type;
        }
        if (feature.hasOwnProperty('reprpoint')) {
            feature.reprpoint[1] = tileSize - feature.reprpoint[1];
        }
    }
  }

  function onKothicDataResponse(data, zoom, x, y) {
    var key = [zoom, x, y].join('/'),
      canvas = canvases[key];
    _invertYAxe(data);
    function onRenderComplete() {
        callbacks[key](canvas);
        document.getElementsByTagName('head')[0].removeChild(scripts[key]);
        delete scripts[key];
        // delete callbacks[key];
    }
    kothic.render(canvas, data, zoom, onRenderComplete);
  }

  window.onKothicDataResponse = onKothicDataResponse;

  k.getTile = function(coord, callback) {
    var zoomOffset = 0,
      key = [(coord.zoom), coord.column, coord.row].join('/'),
      url = 'http://osmosnimki.ru/vtile/' + key + '.js';
    canvases[key] = document.createElement('canvas');
    canvases[key].width = 256;
    canvases[key].height = 256;
    scripts[key] = loadScript(url);
    callbacks[key] = callback;
  };

  k.releaseTile = function() { };
  return k;
}
