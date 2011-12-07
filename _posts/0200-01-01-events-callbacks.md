---
title: Events
tags: manual
layout: page
---


`Map` can report on several events using a simple callback system. To be notified of map changes subscribe to some or all of the following events: `panned`, `zoomed`, `extentset`, `centered`, `resized`, `drawn`. Each callback will receive the current map as its first argument.

To make overlays that follow the map, or update parts of the page when the map changes, the simplest callback to register is 'drawn':

{% highlight js %}
map.addCallback('drawn', function(m) {
    // respond to new center:
    document.getElementById('info').innerHTML = m.getCenter().toString();
});
{% endhighlight %}

Map also exposes a `removeCallback` method for keeping things tidy, and uses `dispatchCallback` internally to notify listeners of changes.
