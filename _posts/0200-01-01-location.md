---
title: Location
tags: api
layout: default
---

Location is a geographical latitude and longitude, expressed as a simple pair of
numbers. For example, San Francisco is near 37°N, 122°W or `new com.modestmaps.Location(37, -122)`.

## API

### Constructor

{% highlight js %}new com.modestmaps.Location(lat, lon){% endhighlight %}

### Class Methods

{% highlight js %}com.modestmaps.Location.distance(l1, l2, r){% endhighlight %}

{% highlight js %}com.modestmaps.Location.interpolate(l1, l2, f){% endhighlight %}
