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

{% highlight js %}
var mm = com.modestmaps;

var provider = new MM.TemplatedMapProvider(
    'http://{S}.mqcdn.com/tiles/1.0.0/osm/{Z}/{X}/{Y}.png',
    ['otile1', 'otile2', 'otile3', 'otile4']);

var map = new com.modestmaps.Map('map', provider);
{% endhighlight %}
