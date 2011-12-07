    if (typeof module !== 'undefined' && module.exports) {
      module.exports = {
          Point: MM.Point,
          Projection: MM.Projection,
          MercatorProjection: MM.MercatorProjection,
          LinearProjection: MM.LinearProjection,
          Transformation: MM.Transformation,
          Location: MM.Location,
          MapProvider: MM.MapProvider,
          TemplatedMapProvider: MM.TemplatedMapProvider,
          Coordinate: MM.Coordinate,
          deriveTransformation: MM.deriveTransformation
      };
    }
})(MM);
