VERSION:=$(shell cat VERSION)

JS_FILES = \
	src/start.jsf \
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
	src/end.jsf

modestmaps.min.js: modestmaps.js
	rm -f modestmaps.min.js
	java -jar tools/yuicompressor-2.4.2.jar modestmaps.js > modestmaps.min.js

modestmaps.js: src/copyright.js $(JS_FILES)
	cat src/copyright.js > modestmaps.js
	perl -pi -e 's#N\.N\.N#$(VERSION)#' modestmaps.js
	cat $(JS_FILES) >> modestmaps.js

clean:
	rm modestmaps.js
	rm modestmaps.min.js
