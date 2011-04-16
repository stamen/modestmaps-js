JS_FILES = \
	src/start.js \
	src/utils.js \
	src/point.js \
	src/coordinate.js \
	src/location.js \
	src/transformation.js \
	src/projection.js \
	src/provider.js \
	src/interaction.js \
	src/callbacks.js \
	src/requests.js \
	src/map.js \
	src/end.js

modestmaps.min.js: modestmaps.js
	rm -f modestmaps.min.js
	java -jar tools/yuicompressor-2.4.2.jar modestmaps.js > modestmaps.min.js
	chmod a-w modestmaps.min.js

modestmaps.js: $(JS_FILES) Makefile 
	rm -f modestmaps.js
	cat $(JS_FILES) >> modestmaps.js
	chmod a-w modestmaps.js

clean:
	rm modestmaps.js
	rm modestmaps.min.js
