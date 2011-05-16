var path = require('path'),
    sys = require('sys'),
    assert = require('assert'),
    MM = require('../modestmaps.js');

exports['coordinate zooming'] = function() {
    var c = new MM.Coordinate(0, 1, 2);
    assert.deepEqual(c, { row: 0, column: 1, zoom: 2 });

    var z3 = c.zoomTo(3);
    assert.deepEqual(z3, { row: 0, column: 2, zoom: 3 });

    var z1 = c.zoomTo(1);
    assert.deepEqual(z1, { row: 0, column: 0.5, zoom: 1 });

    var cr = c.right();
    assert.deepEqual(cr, { row: 0, column: 2, zoom: 2 });

    var cu = c.up();
    assert.deepEqual(cu, { row: -1, column: 1, zoom: 2 });

    var cl = c.left();
    assert.deepEqual(cl, { row: 0, column: 0, zoom: 2 });

    var cl = c.down();
    assert.deepEqual(cl, { row: 1, column: 1, zoom: 2 });
};
