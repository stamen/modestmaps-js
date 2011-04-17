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

all: modestmaps.js modestmaps.min.js

modestmaps.min.js: modestmaps.tmp.js
	java -jar tools/yuicompressor-2.4.2.jar modestmaps.tmp.js > modestmaps.min.js

modestmaps.js: modestmaps.tmp.js
	cat modestmaps.tmp.js > modestmaps.js

modestmaps.tmp.js: src/copyright.js $(JS_FILES)
	cat src/copyright.js > modestmaps.tmp.js
	perl -pi -e 's#N\.N\.N#$(VERSION)#' modestmaps.tmp.js
	cat $(JS_FILES) >> modestmaps.tmp.js

clean:
	rm modestmaps.tmp.js
