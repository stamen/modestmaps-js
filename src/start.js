/*!
 * Modest Maps JS v0.21.0-layers
 * http://modestmaps.com/
 *
 * Copyright (c) 2011 Stamen Design, All Rights Reserved.
 *
 * Open source under the BSD License.
 * http://creativecommons.org/licenses/BSD/
 *
 * Versioned using Semantic Versioning (v.major.minor.patch)
 * See CHANGELOG and http://semver.org/ for more details.
 *
 */

var previous_mm = mm;

// namespacing for backwards-compatibility
if (!com) {
    var com = {};
    if (!com.modestmaps) com.modestmaps = {};
}

var mm = com.modestmaps = {
  noConflict: function() {
    mm = previous_mm;
    return this;
  }
};

(function(MM) {
