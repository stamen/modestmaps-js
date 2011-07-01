    // Make inheritance bearable: clone one level of properties
    MM.extend = function(child, parent) {
        for (var property in parent.prototype) {
            if (typeof child.prototype[property] == "undefined") {
                child.prototype[property] = parent.prototype[property];
            }
        }
        return child;
    };

    MM.getFrame = function () {
        // native animation frames
        // http://webstuff.nfshost.com/anim-timing/Overview.html
        // http://dev.chromium.org/developers/design-documents/requestanimationframe-implementation
        return function(callback) {
            (window.requestAnimationFrame  ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function (callback) {
                window.setTimeout(function () {
                    callback(+new Date());
                }, 10);
            })(callback);
        };
    }();

    // Inspired by LeafletJS
    MM.transformProperty = (function(props) {
        var style = document.documentElement.style;
        for (var i = 0; i < props.length; i++) {
            if (props[i] in style) {
                return props[i];
            }
        }
        return false;
    })(['transformProperty', 'WebkitTransform', 'OTransform', 'MozTransform', 'msTransform']);

    MM.translateString = function(point) {
        return (MM._browser.webkit3d ?
            'translate3d(' :
            'translate(') +
            point.x + 'px,' + point.y + 'px' +
            (MM._browser.webkit3d ? ',0)' : ')');
    };

    MM.matrixString = function(point) {
        // http://www.w3.org/TR/css3-3d-transforms/#transform-functions
        // `matrix(a,b,c,d,e,f)` is equivalent to
        // `matrix3d(a, b, 0, 0, c, d, 0, 0, 0, 0, 1, 0, e, f, 0, 1)`
        return (MM._browser.webkit3d ?
            'matrix3d(' :
            'matrix(') +
                [point.scale || '1', '0', '0', '0', '0', point.scale || '1', '0', '0', '0', '0', '1', '0',
                point.x, point.y, '0', '1'].join(',') +
            (MM._browser.webkit3d ? ')' : ')');
    };

    MM._browser = (function() {
        return {
            webkit: ('WebKitCSSMatrix' in window),
            webkit3d: ('WebKitCSSMatrix' in window) && ('m11' in new WebKitCSSMatrix())
        }
    })();

    MM.moveElement = function(el, point) {
        if (MM._browser.webkit) {
            el.style[MM.transformProperty] =  MM.matrixString(point);
        } else {
            el.style.left = point.x + 'px';
            el.style.top = point.y + 'px';
        }
    };

    // Events
    // Cancel an event: prevent it from bubbling
    MM.cancelEvent = function(e) {
        // there's more than one way to skin this cat
        e.cancelBubble = true;
        e.cancel = true;
        e.returnValue = false;
        if (e.stopPropagation) { e.stopPropagation(); }
        if (e.preventDefault) { e.preventDefault(); }
        return false;
    };

    // see http://ejohn.org/apps/jselect/event.html for the originals
    MM.addEvent = function(obj, type, fn) {
        if (obj.attachEvent) {
            obj['e'+type+fn] = fn;
            obj[type+fn] = function(){ obj['e'+type+fn](window.event); };
            obj.attachEvent('on'+type, obj[type+fn]);
        }
        else {
            obj.addEventListener(type, fn, false);
            if (type == 'mousewheel') {
                obj.addEventListener('DOMMouseScroll', fn, false);
            }
        }
    };

    MM.removeEvent = function( obj, type, fn ) {
        if ( obj.detachEvent ) {
            obj.detachEvent('on'+type, obj[type+fn]);
            obj[type+fn] = null;
        }
        else {
            obj.removeEventListener(type, fn, false);
            if (type == 'mousewheel') {
                obj.removeEventListener('DOMMouseScroll', fn, false);
            }
        }
    };

    // Cross-browser function to get current element style property
    MM.getStyle = function(el,styleProp) {
        if (el.currentStyle)
            var y = el.currentStyle[styleProp];
        else if (window.getComputedStyle)
            var y = document.defaultView.getComputedStyle(el,null).getPropertyValue(styleProp);
        return y;
    };
