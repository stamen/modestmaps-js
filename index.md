---
title: Home
layout: default
---

Modest Maps JS is a BSD-licensed display and interaction library for
tile-based maps in Javascript.

Our intent is to provide a minimal, extensible, customizable, and free display
library for discriminating designers and developers who want to use
interactive maps in their own projects. Modest Maps provides a core set of
features in a tight, clean package, with plenty of hooks for
additional functionality.

<div class='live'>
{% highlight html %}
<div class='map' id='map-1'></div>
<script type='text/javascript'>
var template = 'http://d.tiles.mapbox.com/mapbox/2.0.0/' +
    'mapbox.world-bright/{Z}/{X}/{Y}.png';
var provider = new com.modestmaps.TemplatedMapProvider(template);
var map = new com.modestmaps.Map('map-1', provider);
map.setZoom(2);
</script>
{% endhighlight %}
</div>
