Modest Maps JS is a BSD-licensed display and interaction library for tile-based
maps in Javascript.

Our intent is to provide a minimal, extensible, customizable, and free display
library for discriminating designers and developers who want to use interactive
maps in their own projects. Modest Maps provides a core set of features in a
tight, clean package, with plenty of hooks for additional functionality.

# [Documentation](https://github.com/modestmaps/modestmaps-js/wiki)

## Building

This package includes a copy of [YUICompressor](http://developer.yahoo.com/yui/compressor/),
which requires a version of Java on your system. To create a new build of
Modest Maps (only necessary for development), run `make` from the root
directory.

## Developing with npm:

Modest Maps includes a `package.json` file to guide usage of its code on the
server-side, and to handle certain dependencies.

To install developer dependencies - needed for documentation and tests -
you'll need [npm](http://npmjs.org/):

    npm install --dev

## Tests

Tests require `expresso` to be installed by `npm`, as noted above. To run tests,

    make tests
