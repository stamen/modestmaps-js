---
title: Coordinate
tags: api
layout: default
---

Coordinate is a three dimensional position that helps to convert between zoom
levels. It is expressed as a row, column, and zoom. Zoom levels in Modest
Maps start at zero, and grow as you zoom in. Tile providers typically express
tile locations in such coordinates, which is why the map provider interface
understands coordinates and not points. Whole-number coordinates in the tile
grid correspond exactly to tile images requested from the provider server.

## API

### Constructor

{% highlight js %}new com.modestmaps.Coordinate(row, column, zoom){% endhighlight %}

### Class Methods
