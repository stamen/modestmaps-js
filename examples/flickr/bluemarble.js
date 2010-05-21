com.modestmaps.BlueMarbleProvider = function() {
    com.modestmaps.MapProvider.call(this, function(coordinate) {
        var img = coordinate.zoom.toFixed(0) +'-r'+ coordinate.row.toFixed(0) +'-c'+ coordinate.column.toFixed(0) + '.jpg';
        return 'http://s3.amazonaws.com/com.modestmaps.bluemarble/' + img;
    });
};

com.modestmaps.extend(com.modestmaps.BlueMarbleProvider, com.modestmaps.MapProvider);
