JS_FILES = \
	src/start.js \
	src/utils.js \
	src/point.js \
	src/coordinate.js \
	src/location.js \
	src/extent.js \
	src/transformation.js \
	src/projection.js \
	src/provider.js \
	src/mouse.js \
	src/touch.js \
	src/callbacks.js \
	src/requests.js \
	src/layer.js \
	src/map.js \
	src/convenience.js \
	src/end.js

all: modestmaps.js modestmaps.min.js

modestmaps.min.js: modestmaps.js
	rm -f modestmaps.min.js
	java -jar tools/yuicompressor-2.4.2.jar modestmaps.js > modestmaps.min.js

modestmaps.js: $(JS_FILES) Makefile
	rm -f modestmaps.js
	cat $(JS_FILES) >> modestmaps.js

clean:
	rm modestmaps.js
	rm modestmaps.min.js

doc:
	./node_modules/.bin/docco src/*.js

tests:
	./node_modules/.bin/expresso test/*.test.js
