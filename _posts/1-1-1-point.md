---
title: Point
tags: api
layout: default
---

Point is a pixel position on screen, expressed as a simple pair of numbers.
The methods of Map that convert to/from points work relative to the map's 
containing div element. This is used to locate the pixel within
the map, starting at `(0, 0)` in the upper-lefthand corner.

### API

#### Constructor

{% highlight js %}new com.modestmaps.Point(x, y){% endhighlight %}

#### Class Methods
