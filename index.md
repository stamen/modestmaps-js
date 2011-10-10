---
title:
layout: default
---

<img src='images/js.png' class='left' alt='Javascript Logo' />

__Modest Maps__ is a family of minimalist map APIs, targeting different platforms. The goal is to provide a minimal, extensible, customizable, and
[free](http://www.opensource.org/licenses/bsd-license.php) basis for mapping.


Our intent is to provide a minimal, extensible, customizable, and free display
library for discriminating designers and developers who want to use
interactive maps in their own projects. Modest Maps provides a core set of
features in a tight, clean package, with plenty of hooks for
additional functionality.

<div class='live'>
  {% highlight html %}
    <div class='map' id='map-1'></div>
    <script>
      var template = 'http://d.tiles.mapbox.com/mapbox/2.0.0/' +
          'mapbox.world-bright/{Z}/{X}/{Y}.png';
      var provider = new com.modestmaps.TemplatedMapProvider(template);
      var map = new com.modestmaps.Map('map-1', provider);
      map.setZoom(2);
    </script>
  {% endhighlight %}
</div>
