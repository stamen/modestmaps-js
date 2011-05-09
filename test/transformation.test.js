var path = require('path'),
    sys = require('sys'),
    assert = require('assert'),
    MM = require('../modestmaps.js');

exports['identity transform'] = function() {
    var t = new MM.Transformation(1, 0, 0, 0, 1, 0);
    var p = new MM.Point(1, 1);

    var p_ = t.transform(p);
    var p__ = t.untransform(p_);

    assert.deepEqual(p, { x: 1, y: 1 });
    assert.deepEqual(p_, { x: 1, y: 1 });
    assert.deepEqual(p__, { x: 1, y: 1 });
};

exports['inverse transform'] = function() {
    var t = new MM.Transformation(0, 1, 0, 1, 0, 0);
    var p = new MM.Point(0, 1);

    var p_ = t.transform(p);
    var p__ = t.untransform(p_);

    assert.deepEqual(p, { x: 0, y: 1 });
    assert.deepEqual(p_, { x: 1, y: 0 });
    assert.deepEqual(p__, { x: 0, y: 1 });
};

exports['addition transform'] = function() {
    var t = new MM.Transformation(1, 0, 1, 0, 1, 1);
    var p = new MM.Point(0, 0);

    var p_ = t.transform(p);
    var p__ = t.untransform(p_);

    assert.deepEqual(p, { x: 0, y: 0 });
    assert.deepEqual(p_, { x: 1, y: 1 });
    assert.deepEqual(p__, { x: 0, y: 0 });
};
