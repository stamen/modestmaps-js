    // RequestManager
    // --------------
    // an image loading queue
    MM.RequestManager = function() {

        // The loading bay is a document fragment to optimize appending, since
        // the elements within are invisible. See
        //  [this blog post](http://ejohn.org/blog/dom-documentfragments/).
        this.loadingBay = document.createDocumentFragment();

        this.requestsById = {};
        this.openRequestCount = 0;

        this.maxOpenRequests = 4;
        this.requestQueue = [];

        this.callbackManager = new MM.CallbackManager(this, [
            'requestcomplete', 'requesterror']);
    };

    MM.RequestManager.prototype = {

        // DOM element, hidden, for making sure images dispatch complete events
        loadingBay: null,

        // all known requests, by ID
        requestsById: null,

        // current pending requests
        requestQueue: null,

        // current open requests (children of loadingBay)
        openRequestCount: null,

        // the number of open requests permitted at one time, clamped down
        // because of domain-connection limits.
        maxOpenRequests: null,

        // for dispatching 'requestcomplete'
        callbackManager: null,

        addCallback: function(event, callback) {
            this.callbackManager.addCallback(event,callback);
        },

        removeCallback: function(event, callback) {
            this.callbackManager.removeCallback(event,callback);
        },

        dispatchCallback: function(event, message) {
            this.callbackManager.dispatchCallback(event,message);
        },

        // Clear everything in the queue by excluding nothing
        clear: function() {
            this.clearExcept({});
        },

        clearRequest: function(id) {
            if(id in this.requestsById) {
                delete this.requestsById[id];
            }

            for(var i = 0; i < this.requestQueue.length; i++) {
                var request = this.requestQueue[i];
                if(request && request.id == id) {
                    this.requestQueue[i] = null;
                }
            }
        },

        // Clear everything in the queue except for certain keys, specified
        // by an object of the form
        //
        //     { key: throwawayvalue }
        clearExcept: function(validIds) {

            // clear things from the queue first...
            for (var i = 0; i < this.requestQueue.length; i++) {
                var request = this.requestQueue[i];
                if (request && !(request.id in validIds)) {
                    this.requestQueue[i] = null;
                }
            }

            // then check the loadingBay...
            var openRequests = this.loadingBay.childNodes;
            for (var j = openRequests.length-1; j >= 0; j--) {
                var img = openRequests[j];
                if (!(img.id in validIds)) {
                    this.loadingBay.removeChild(img);
                    this.openRequestCount--;
                    /* console.log(this.openRequestCount + " open requests"); */
                    img.src = img.coord = img.onload = img.onerror = null;
                }
            }

            // hasOwnProperty protects against prototype additions
            // > "The standard describes an augmentable Object.prototype.
            //  Ignore standards at your own peril."
            // -- http://www.yuiblog.com/blog/2006/09/26/for-in-intrigue/
            for (var id in this.requestsById) {
                if (!(id in validIds)) {
                    if (this.requestsById.hasOwnProperty(id)) {
                        var requestToRemove = this.requestsById[id];
                        // whether we've done the request or not...
                        delete this.requestsById[id];
                        if (requestToRemove !== null) {
                            requestToRemove =
                                requestToRemove.id =
                                requestToRemove.coord =
                                requestToRemove.url = null;
                        }
                    }
                }
            }
        },

        // Given a tile id, check whether the RequestManager is currently
        // requesting it and waiting for the result.
        hasRequest: function(id) {
            return (id in this.requestsById);
        },

        // * TODO: remove dependency on coord (it's for sorting, maybe call it data?)
        // * TODO: rename to requestImage once it's not tile specific
        requestTile: function(id, coord, url) {
            if (!(id in this.requestsById)) {
                var request = { id: id, coord: coord.copy(), url: url };
                // if there's no url just make sure we don't request this image again
                this.requestsById[id] = request;
                if (url) {
                    this.requestQueue.push(request);
                    /* console.log(this.requestQueue.length + ' pending requests'); */
                }
            }
        },

        getProcessQueue: function() {
            // let's only create this closure once...
            if (!this._processQueue) {
                var theManager = this;
                this._processQueue = function() {
                    theManager.processQueue();
                };
            }
            return this._processQueue;
        },

        // Select images from the `requestQueue` and create image elements for
        // them, attaching their load events to the function returned by
        // `this.getLoadComplete()` so that they can be added to the map.
        processQueue: function(sortFunc) {
            // When the request queue fills up beyond 8, start sorting the
            // requests so that spiral-loading or another pattern can be used.
            if (sortFunc && this.requestQueue.length > 8) {
                this.requestQueue.sort(sortFunc);
            }
            while (this.openRequestCount < this.maxOpenRequests && this.requestQueue.length > 0) {
                var request = this.requestQueue.pop();
                if (request) {
                    this.openRequestCount++;
                    /* console.log(this.openRequestCount + ' open requests'); */

                    // JSLitmus benchmark shows createElement is a little faster than
                    // new Image() in Firefox and roughly the same in Safari:
                    // http://tinyurl.com/y9wz2jj http://tinyurl.com/yes6rrt
                    var img = document.createElement('img');

                    // FIXME: id is technically not unique in document if there
                    // are two Maps but toKey is supposed to be fast so we're trying
                    // to avoid a prefix ... hence we can't use any calls to
                    // `document.getElementById()` to retrieve images
                    img.id = request.id;
                    img.style.position = 'absolute';
                    // * FIXME: store this elsewhere to avoid scary memory leaks?
                    // * FIXME: call this 'data' not 'coord' so that RequestManager is less Tile-centric?
                    img.coord = request.coord;
                    // add it to the DOM in a hidden layer, this is a bit of a hack, but it's
                    // so that the event we get in image.onload has srcElement assigned in IE6
                    this.loadingBay.appendChild(img);
                    // set these before img.src to avoid missing an img that's already cached
                    img.onload = img.onerror = this.getLoadComplete();
                    img.src = request.url;

                    // keep things tidy
                    request = request.id = request.coord = request.url = null;
                }
            }
        },

        _loadComplete: null,

        // Get the singleton `_loadComplete` function that is called on image
        // load events, either removing them from the queue and dispatching an
        // event to add them to the map, or deleting them if the image failed
        // to load.
        getLoadComplete: function() {
            // let's only create this closure once...
            if (!this._loadComplete) {
                var theManager = this;
                this._loadComplete = function(e) {
                    // this is needed because we don't use MM.addEvent for images
                    e = e || window.event;

                    // srcElement for IE, target for FF, Safari etc.
                    var img = e.srcElement || e.target;

                    // unset these straight away so we don't call this twice
                    img.onload = img.onerror = null;

                    // pull it back out of the (hidden) DOM
                    // so that draw will add it correctly later
                    theManager.loadingBay.removeChild(img);
                    theManager.openRequestCount--;
                    delete theManager.requestsById[img.id];

                    /* console.log(theManager.openRequestCount + ' open requests'); */

                    // NB:- complete is also true onerror if we got a 404
                    if (e.type === 'load' && (img.complete ||
                        (img.readyState && img.readyState == 'complete'))) {
                        theManager.dispatchCallback('requestcomplete', img);
                    } else {
                        // if it didn't finish clear its src to make sure it
                        // really stops loading
                        // FIXME: we'll never retry because this id is still
                        // in requestsById - is that right?
                        theManager.dispatchCallback('requesterror', {
                            element: img,
                            url: ('' + img.src)
                        });
                        img.src = null;
                    }

                    // keep going in the same order
                    // use `setTimeout()` to avoid the IE recursion limit, see
                    // http://cappuccino.org/discuss/2010/03/01/internet-explorer-global-variables-and-stack-overflows/
                    // and https://github.com/stamen/modestmaps-js/issues/12
                    setTimeout(theManager.getProcessQueue(), 0);

                };
            }
            return this._loadComplete;
        }

    };
