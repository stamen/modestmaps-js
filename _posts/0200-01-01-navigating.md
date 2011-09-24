---
title: Navigating
tags: manual
layout: default
---

Map provides several different ways to change the current center and zoom level, apart from `setCenterZoom` and `setExtent`. 

Some of them are useful when wiring up map controls such as `zoomIn` and `zoomOut`, that go in and out by whole zoom levels, and `panLeft`, `panRight`, `panDown` and `panUp` that move in 100px increments. 

When responding to mouse-wheel or gesture zooming events you'll probably want to use `zoomByAbout`:


{% highlight js %}
// San Francisco
var sfLocation = new com.modestmaps.Location(37.7749295, -122.4194155);

// San Francisco on screen:
var sfPoint = map.locationPoint(sfLocation);

// zoom in by one step, keeping SF in the same place on screen:
map.zoomByAbout(1, sfPoint);
{% endhighlight %}

When responding to mouse events, or scripting animation, you'll probably want to use the relative functions `zoomBy` and `panBy`:

{% highlight js %}
// zoom in by one step:
map.zoomBy(1);

// scroll by 50,50:
map.panBy(50,50);
{% endhighlight %}
