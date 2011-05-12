var path = require('path'),
    sys = require('sys'),
    assert = require('assert'),
    MM = require('../modestmaps.js');

exports['mercator projection'] = function() {
    var m = new MM.MercatorProjection(10);
    // TODO: row is a very small number because of odd javascript math.
    assert.equal(0, m.locationCoordinate(new MM.Location(0, 0)).column);
    assert.equal(10, m.locationCoordinate(new MM.Location(0, 0)).zoom);

    assert.deepEqual({
        lon: 0,
        lat: 0
      },
      m.coordinateLocation(new MM.Coordinate(0, 0, 10))
    );

    // Confirm that these values are valid up to a 3 decimals
    var c2 = m.locationCoordinate(new MM.Location(37, -122))
    assert.equal(Math.round(c2.row * 1000) / 1000, 0.696);
    assert.equal(Math.round(c2.column * 1000) / 1000, -2.129);
    assert.equal(c2.zoom, 10);

    var l2 = m.coordinateLocation(new MM.Coordinate(0.696, -2.129, 10));
    assert.equal(Math.round(l2.lat * 1000) / 1000, 37.001);
    assert.equal(Math.round(l2.lon * 1000) / 1000, -121.983);
};
