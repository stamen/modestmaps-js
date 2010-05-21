modestmaps.min.js: modestmaps.js
	java -jar tools/yuicompressor-2.4.2.jar modestmaps.js > modestmaps.min.js

clean:
	rm modestmaps.min.js
