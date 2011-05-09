var path = require('path'),
    sys = require('sys'),
    assert = require('assert'),
    MM = require('../modestmaps.js');

exports['basic point'] = function() {
    var p = new MM.Point(0, 1);
    assert.deepEqual(p, { x: 0, y: 1 });
};
