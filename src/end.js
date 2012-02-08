    if (typeof module !== 'undefined' && module.exports) {
      module.exports = {
          Point: MM.Point,
          Projection: MM.Projection,
          MercatorProjection: MM.MercatorProjection,
          LinearProjection: MM.LinearProjection,
          Transformation: MM.Transformation,
          deriveTransformation: MM.deriveTransformation,
          Location: MM.Location,
          MapProvider: MM.MapProvider,
          TemplatedMapProvider: MM.TemplatedMapProvider,
          Coordinate: MM.Coordinate
      };
    }
})(com.modestmaps);
