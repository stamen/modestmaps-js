var MM = require('../../modestmaps.js'),
    Canvas = require('canvas'),
    Image = Canvas.Image;
    get = require('get'),
    express = require('express'),
    fs = require('fs');

function renderStaticMap(provider, dimensions, zoom, location, callback) {

  var canvas = new Canvas(dimensions.x, dimensions.y),
      ctx = canvas.getContext('2d'),
      // default to Google-y Mercator style maps
      projection = new MM.MercatorProjection(0,
        MM.deriveTransformation(-Math.PI,  Math.PI, 0, 0,
                                 Math.PI,  Math.PI, 1, 0,
                                -Math.PI, -Math.PI, 0, 1)),
      tileSize = new MM.Point(256, 256);
  
  var centerCoordinate = projection.locationCoordinate(location).zoomTo(zoom);

  function pointCoordinate(point) {
    // new point coordinate reflecting distance from map center, in tile widths
    var coord = centerCoordinate.copy();
    coord.column += (point.x - dimensions.x/2) / tileSize.x;
    coord.row += (point.y - dimensions.y/2) / tileSize.y;
    return coord;
  };

  function coordinatePoint(coord) {
    // Return an x, y point on the map image for a given coordinate.
    if (coord.zoom != zoom) {
      coord = coord.zoomTo(zoom);
    }
    var point = new MM.Point(dimensions.x/2, dimensions.y/2);
    point.x += tileSize.x * (coord.column - centerCoordinate.column);
    point.y += tileSize.y * (coord.row - centerCoordinate.row);
    return point;
  }

  var startCoord = pointCoordinate(new MM.Point(0,0)).container(),
      endCoord = pointCoordinate(dimensions).container(); 

  var numRequests = 0,
      completeRequests = 0;

  function checkDone() {
    if (completeRequests == numRequests) {
      callback(null, canvas);
    }
  }

  function getTile(url, p) {
    new get(url).asBuffer(function(error,data) { 
      if (error) {
        callback(url + ' error: ' + error);
      }
      else {
        var img = new Image();
        img.src = data;
        ctx.drawImage(img, p.x, p.y, tileSize.x, tileSize.y);
        completeRequests++;
        checkDone();
      }
    });
  }

  for (var column = startCoord.column; column <= endCoord.column; column++) {
    for (var row = startCoord.row; row <= endCoord.row; row++) {
      var c = new MM.Coordinate(row, column, zoom),
          url = provider.getTileUrl(c),
          p = coordinatePoint(c);
      if (url) {
        getTile(url, p);
        numRequests++;
      }
    }
  }
  
}

/* 
var provider = new MM.TemplatedMapProvider("http://tile.openstreetmap.org/{Z}/{X}/{Y}.png");
var dimensions = new MM.Point(800, 600);
var zoom = 11;
var location = new MM.Location(37.774929, -122.419415);

renderStaticMap(provider, dimensions, 11, location, function(err, canvas) {
  if (err) {
    throw err;
  }
  var out = fs.createWriteStream(__dirname + '/map.png'),
      stream = canvas.createPNGStream();
  stream.on('data', function(chunk){
    out.write(chunk);
  });
  stream.on('end', function(){
    console.log('saved map.png');
  });
});
*/

// just one for now...
var providers = {
  osm: new MM.TemplatedLayer("http://tile.openstreetmap.org/{Z}/{X}/{Y}.png")
}

var app = express.createServer();

app.get('/map', function(req,res) {
  var provider = providers[req.param("provider", "osm")], // default osm
      width = req.param("width", 800),
      height = req.param("height", 600),
      dimensions = new MM.Point(width, height),
      zoom = parseInt(req.param("zoom", 1)),
      lat = req.param("lat", 0.0),
      lon = req.param("lon", 0.0),
      location = new MM.Location(lat, lon);
  renderStaticMap(provider, dimensions, zoom, location, function(err,canvas) {
    if (err) {    
      res.send(new Error(err));
    } else {
      res.header('Content-Type', 'image/png');
      res.send(canvas.toBuffer());
    }
  });
});

app.listen(3000);



