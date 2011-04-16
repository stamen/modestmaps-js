    //////////////////////////// RequestManager is an image loading queue 
    
    MM.RequestManager = function(parent) {
    
        this.loadingBay = document.createDocumentFragment();

        this.requestsById = {};
        this.openRequestCount = 0;
        
        this.maxOpenRequests = 4;
        this.requestQueue = [];    
        
        this.callbackManager = new MM.CallbackManager(this, [ 'requestcomplete' ]);
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

        // queue management:

        clear: function() {
            this.clearExcept({});
        },
        
        clearExcept: function(validKeys) {

            // clear things from the queue first...
            for (var i = 0; i < this.requestQueue.length; i++) {
                var request = this.requestQueue[i];
                if (request && !(request.key in validKeys)) {
                    this.requestQueue[i] = null;
                }
            }
            
            // then check the loadingBay...
            var openRequests = this.loadingBay.childNodes;
            for (var j = openRequests.length-1; j >= 0; j--) {
                var img = openRequests[j];
                if (!(img.id in validKeys)) {
                    this.loadingBay.removeChild(img);
                    this.openRequestCount--;
                    //console.log(this.openRequestCount + " open requests");
                    img.src = img.coord = img.onload = img.onerror = null;
                }
            }
        
            // hasOwnProperty protects against prototype additions
            // "The standard describes an augmentable Object.prototype. 
            //  Ignore standards at your own peril."
            // -- http://www.yuiblog.com/blog/2006/09/26/for-in-intrigue/
            for (var id in this.requestsById) {
                if (this.requestsById.hasOwnProperty(id)) {
                    if (!(id in validKeys)) {
                        var request = this.requestsById[id];
                        // whether we've done the request or not...
                        delete this.requestsById[id];
                        if (request !== null) {
                            request = request.key = request.coord = request.url = null;
                        }
                    }
                }
            }

        },

        hasRequest: function(id) {
            return (id in this.requestsById);
        },

        // TODO: remove dependency on coord (it's for sorting, maybe call it data?)
        // TODO: rename to requestImage once it's not tile specific
        requestTile: function(key, coord, url) {
            if (!(key in this.requestsById)) {
                var request = { key: key, coord: coord.copy(), url: url };
                // if there's no url just make sure we don't request this image again
                this.requestsById[key] = request;
                if (url) {
                    this.requestQueue.push(request);
                    //console.log(this.requestQueue.length + ' pending requests');
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

        processQueue: function(sortFunc) {
            if (sortFunc && this.requestQueue.length > 8) {
                this.requestQueue.sort(sortFunc);
            }
            while (this.openRequestCount < this.maxOpenRequests && this.requestQueue.length > 0) {
                var request = this.requestQueue.pop();
                if (request) {
                    
                    this.openRequestCount++;
                    //console.log(this.openRequestCount + ' open requests');

                    // JSLitmus benchmark shows createElement is a little faster than
                    // new Image() in Firefox and roughly the same in Safari:
                    // http://tinyurl.com/y9wz2jj http://tinyurl.com/yes6rrt 
                    var img = document.createElement('img');

                    // FIXME: key is technically not unique in document if there 
                    // are two Maps but toKey is supposed to be fast so we're trying 
                    // to avoid a prefix ... hence we can't use any calls to
                    // document.getElementById() to retrieve images                    
                    img.id = request.key;
                    img.style.position = 'absolute';
                    // FIXME: store this elsewhere to avoid scary memory leaks?
                    // FIXME: call this 'data' not 'coord' so that RequestManager is less Tile-centric?
                    img.coord = request.coord; 
                    
                    // add it to the DOM in a hidden layer, this is a bit of a hack, but it's
                    // so that the event we get in image.onload has srcElement assigned in IE6
                    this.loadingBay.appendChild(img);
                    // set these before img.src to avoid missing an img that's already cached            
                    img.onload = img.onerror = this.getLoadComplete();
                    img.src = request.url;
                    
                    // keep things tidy
                    request = request.key = request.coord = request.url = null;
                }
            }
        },
    
        _loadComplete: null,
        
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
    
                    //console.log(theManager.openRequestCount + ' open requests');

                    // NB:- complete is also true onerror if we got a 404
                    if (img.complete || 
                        (img.readyState && img.readyState == 'complete')) {
                        theManager.dispatchCallback('requestcomplete', img);
                    }
                    else {
                        // if it didn't finish clear its src to make sure it 
                        // really stops loading
                        // FIXME: we'll never retry because this id is still
                        // in requestsById - is that right?
                        img.src = null;
                    }
                    
                    // keep going in the same order
                    // use setTimeout() to avoid the IE recursion limit, see
                    // http://cappuccino.org/discuss/2010/03/01/internet-explorer-global-variables-and-stack-overflows/
                    // and https://github.com/stamen/modestmaps-js/issues/12
                    setTimeout(theManager.getProcessQueue(), 0);

                };
            }
            return this._loadComplete;
        }        
    
    };
