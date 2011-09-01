var path = require('path'),
    sys = require('sys'),
    assert = require('assert'),
    MM = require('../modestmaps.js');

exports['basic location'] = function() {
    var l = new MM.Location(0, 0);
    assert.deepEqual(l, { lat: 0, lon: 0 });
};

exports['interpolate same point'] = function() {
    var l1 = new MM.Location(0, 0),
        l2 = new MM.Location(0, 0),
        l3 = MM.Location.interpolate(l1, l2, 0.5);

    assert.deepEqual(l3, { lat: 0, lon: 0 });
};
