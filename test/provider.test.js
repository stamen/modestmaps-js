var path = require('path'),
    sys = require('sys'),
    assert = require('assert'),
    MM = require('../modestmaps.js');

// Currently not testing subdomain-based templatedmapprovider, since
// the implementation should be kind of undefined.
exports['basic templatedmapprovider'] = function() {
    var p = new MM.TemplatedMapProvider('http://{S}.tile.openstreetmap.org/{Z}/{X}/{Y}.png', ['a']);

    assert.deepEqual(
      p.getTileUrl(new MM.Coordinate(1225, 1832, 12)),
      'http://a.tile.openstreetmap.org/12/1832/1225.png');
};
