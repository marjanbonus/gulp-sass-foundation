/*!
 * Modernizr v2.8.3
 * www.modernizr.com
 *
 * Copyright (c) Faruk Ates, Paul Irish, Alex Sexton
 * Available under the BSD and MIT licenses: www.modernizr.com/license/
 */

/*
 * Modernizr tests which native CSS3 and HTML5 features are available in
 * the current UA and makes the results available to you in two ways:
 * as properties on a global Modernizr object, and as classes on the
 * <html> element. This information allows you to progressively enhance
 * your pages with a granular level of control over the experience.
 *
 * Modernizr has an optional (not included) conditional resource loader
 * called Modernizr.load(), based on Yepnope.js (yepnopejs.com).
 * To get a build that includes Modernizr.load(), as well as choosing
 * which tests to include, go to www.modernizr.com/download/
 *
 * Authors        Faruk Ates, Paul Irish, Alex Sexton
 * Contributors   Ryan Seddon, Ben Alman
 */

window.Modernizr = (function( window, document, undefined ) {

    var version = '2.8.3',

    Modernizr = {},

    /*>>cssclasses*/
    // option for enabling the HTML classes to be added
    enableClasses = true,
    /*>>cssclasses*/

    docElement = document.documentElement,

    /**
     * Create our "modernizr" element that we do most feature tests on.
     */
    mod = 'modernizr',
    modElem = document.createElement(mod),
    mStyle = modElem.style,

    /**
     * Create the input element for various Web Forms feature tests.
     */
    inputElem /*>>inputelem*/ = document.createElement('input') /*>>inputelem*/ ,

    /*>>smile*/
    smile = ':)',
    /*>>smile*/

    toString = {}.toString,

    // TODO :: make the prefixes more granular
    /*>>prefixes*/
    // List of property values to set for css tests. See ticket #21
    prefixes = ' -webkit- -moz- -o- -ms- '.split(' '),
    /*>>prefixes*/

    /*>>domprefixes*/
    // Following spec is to expose vendor-specific style properties as:
    //   elem.style.WebkitBorderRadius
    // and the following would be incorrect:
    //   elem.style.webkitBorderRadius

    // Webkit ghosts their properties in lowercase but Opera & Moz do not.
    // Microsoft uses a lowercase `ms` instead of the correct `Ms` in IE8+
    //   erik.eae.net/archives/2008/03/10/21.48.10/

    // More here: github.com/Modernizr/Modernizr/issues/issue/21
    omPrefixes = 'Webkit Moz O ms',

    cssomPrefixes = omPrefixes.split(' '),

    domPrefixes = omPrefixes.toLowerCase().split(' '),
    /*>>domprefixes*/

    /*>>ns*/
    ns = {'svg': 'http://www.w3.org/2000/svg'},
    /*>>ns*/

    tests = {},
    inputs = {},
    attrs = {},

    classes = [],

    slice = classes.slice,

    featureName, // used in testing loop


    /*>>teststyles*/
    // Inject element with style element and some CSS rules
    injectElementWithStyles = function( rule, callback, nodes, testnames ) {

      var style, ret, node, docOverflow,
          div = document.createElement('div'),
          // After page load injecting a fake body doesn't work so check if body exists
          body = document.body,
          // IE6 and 7 won't return offsetWidth or offsetHeight unless it's in the body element, so we fake it.
          fakeBody = body || document.createElement('body');

      if ( parseInt(nodes, 10) ) {
          // In order not to give false positives we create a node for each test
          // This also allows the method to scale for unspecified uses
          while ( nodes-- ) {
              node = document.createElement('div');
              node.id = testnames ? testnames[nodes] : mod + (nodes + 1);
              div.appendChild(node);
          }
      }

      // <style> elements in IE6-9 are considered 'NoScope' elements and therefore will be removed
      // when injected with innerHTML. To get around this you need to prepend the 'NoScope' element
      // with a 'scoped' element, in our case the soft-hyphen entity as it won't mess with our measurements.
      // msdn.microsoft.com/en-us/library/ms533897%28VS.85%29.aspx
      // Documents served as xml will throw if using &shy; so use xml friendly encoded version. See issue #277
      style = ['&#173;','<style id="s', mod, '">', rule, '</style>'].join('');
      div.id = mod;
      // IE6 will false positive on some tests due to the style element inside the test div somehow interfering offsetHeight, so insert it into body or fakebody.
      // Opera will act all quirky when injecting elements in documentElement when page is served as xml, needs fakebody too. #270
      (body ? div : fakeBody).innerHTML += style;
      fakeBody.appendChild(div);
      if ( !body ) {
          //avoid crashing IE8, if background image is used
          fakeBody.style.background = '';
          //Safari 5.13/5.1.4 OSX stops loading if ::-webkit-scrollbar is used and scrollbars are visible
          fakeBody.style.overflow = 'hidden';
          docOverflow = docElement.style.overflow;
          docElement.style.overflow = 'hidden';
          docElement.appendChild(fakeBody);
      }

      ret = callback(div, rule);
      // If this is done after page load we don't want to remove the body so check if body exists
      if ( !body ) {
          fakeBody.parentNode.removeChild(fakeBody);
          docElement.style.overflow = docOverflow;
      } else {
          div.parentNode.removeChild(div);
      }

      return !!ret;

    },
    /*>>teststyles*/

    /*>>mq*/
    // adapted from matchMedia polyfill
    // by Scott Jehl and Paul Irish
    // gist.github.com/786768
    testMediaQuery = function( mq ) {

      var matchMedia = window.matchMedia || window.msMatchMedia;
      if ( matchMedia ) {
        return matchMedia(mq) && matchMedia(mq).matches || false;
      }

      var bool;

      injectElementWithStyles('@media ' + mq + ' { #' + mod + ' { position: absolute; } }', function( node ) {
        bool = (window.getComputedStyle ?
                  getComputedStyle(node, null) :
                  node.currentStyle)['position'] == 'absolute';
      });

      return bool;

     },
     /*>>mq*/


    /*>>hasevent*/
    //
    // isEventSupported determines if a given element supports the given event
    // kangax.github.com/iseventsupported/
    //
    // The following results are known incorrects:
    //   Modernizr.hasEvent("webkitTransitionEnd", elem) // false negative
    //   Modernizr.hasEvent("textInput") // in Webkit. github.com/Modernizr/Modernizr/issues/333
    //   ...
    isEventSupported = (function() {

      var TAGNAMES = {
        'select': 'input', 'change': 'input',
        'submit': 'form', 'reset': 'form',
        'error': 'img', 'load': 'img', 'abort': 'img'
      };

      function isEventSupported( eventName, element ) {

        element = element || document.createElement(TAGNAMES[eventName] || 'div');
        eventName = 'on' + eventName;

        // When using `setAttribute`, IE skips "unload", WebKit skips "unload" and "resize", whereas `in` "catches" those
        var isSupported = eventName in element;

        if ( !isSupported ) {
          // If it has no `setAttribute` (i.e. doesn't implement Node interface), try generic element
          if ( !element.setAttribute ) {
            element = document.createElement('div');
          }
          if ( element.setAttribute && element.removeAttribute ) {
            element.setAttribute(eventName, '');
            isSupported = is(element[eventName], 'function');

            // If property was created, "remove it" (by setting value to `undefined`)
            if ( !is(element[eventName], 'undefined') ) {
              element[eventName] = undefined;
            }
            element.removeAttribute(eventName);
          }
        }

        element = null;
        return isSupported;
      }
      return isEventSupported;
    })(),
    /*>>hasevent*/

    // TODO :: Add flag for hasownprop ? didn't last time

    // hasOwnProperty shim by kangax needed for Safari 2.0 support
    _hasOwnProperty = ({}).hasOwnProperty, hasOwnProp;

    if ( !is(_hasOwnProperty, 'undefined') && !is(_hasOwnProperty.call, 'undefined') ) {
      hasOwnProp = function (object, property) {
        return _hasOwnProperty.call(object, property);
      };
    }
    else {
      hasOwnProp = function (object, property) { /* yes, this can give false positives/negatives, but most of the time we don't care about those */
        return ((property in object) && is(object.constructor.prototype[property], 'undefined'));
      };
    }

    // Adapted from ES5-shim https://github.com/kriskowal/es5-shim/blob/master/es5-shim.js
    // es5.github.com/#x15.3.4.5

    if (!Function.prototype.bind) {
      Function.prototype.bind = function bind(that) {

        var target = this;

        if (typeof target != "function") {
            throw new TypeError();
        }

        var args = slice.call(arguments, 1),
            bound = function () {

            if (this instanceof bound) {

              var F = function(){};
              F.prototype = target.prototype;
              var self = new F();

              var result = target.apply(
                  self,
                  args.concat(slice.call(arguments))
              );
              if (Object(result) === result) {
                  return result;
              }
              return self;

            } else {

              return target.apply(
                  that,
                  args.concat(slice.call(arguments))
              );

            }

        };

        return bound;
      };
    }

    /**
     * setCss applies given styles to the Modernizr DOM node.
     */
    function setCss( str ) {
        mStyle.cssText = str;
    }

    /**
     * setCssAll extrapolates all vendor-specific css strings.
     */
    function setCssAll( str1, str2 ) {
        return setCss(prefixes.join(str1 + ';') + ( str2 || '' ));
    }

    /**
     * is returns a boolean for if typeof obj is exactly type.
     */
    function is( obj, type ) {
        return typeof obj === type;
    }

    /**
     * contains returns a boolean for if substr is found within str.
     */
    function contains( str, substr ) {
        return !!~('' + str).indexOf(substr);
    }

    /*>>testprop*/

    // testProps is a generic CSS / DOM property test.

    // In testing support for a given CSS property, it's legit to test:
    //    `elem.style[styleName] !== undefined`
    // If the property is supported it will return an empty string,
    // if unsupported it will return undefined.

    // We'll take advantage of this quick test and skip setting a style
    // on our modernizr element, but instead just testing undefined vs
    // empty string.

    // Because the testing of the CSS property names (with "-", as
    // opposed to the camelCase DOM properties) is non-portable and
    // non-standard but works in WebKit and IE (but not Gecko or Opera),
    // we explicitly reject properties with dashes so that authors
    // developing in WebKit or IE first don't end up with
    // browser-specific content by accident.

    function testProps( props, prefixed ) {
        for ( var i in props ) {
            var prop = props[i];
            if ( !contains(prop, "-") && mStyle[prop] !== undefined ) {
                return prefixed == 'pfx' ? prop : true;
            }
        }
        return false;
    }
    /*>>testprop*/

    // TODO :: add testDOMProps
    /**
     * testDOMProps is a generic DOM property test; if a browser supports
     *   a certain property, it won't return undefined for it.
     */
    function testDOMProps( props, obj, elem ) {
        for ( var i in props ) {
            var item = obj[props[i]];
            if ( item !== undefined) {

                // return the property name as a string
                if (elem === false) return props[i];

                // let's bind a function
                if (is(item, 'function')){
                  // default to autobind unless override
                  return item.bind(elem || obj);
                }

                // return the unbound function or obj or value
                return item;
            }
        }
        return false;
    }

    /*>>testallprops*/
    /**
     * testPropsAll tests a list of DOM properties we want to check against.
     *   We specify literally ALL possible (known and/or likely) properties on
     *   the element including the non-vendor prefixed one, for forward-
     *   compatibility.
     */
    function testPropsAll( prop, prefixed, elem ) {

        var ucProp  = prop.charAt(0).toUpperCase() + prop.slice(1),
            props   = (prop + ' ' + cssomPrefixes.join(ucProp + ' ') + ucProp).split(' ');

        // did they call .prefixed('boxSizing') or are we just testing a prop?
        if(is(prefixed, "string") || is(prefixed, "undefined")) {
          return testProps(props, prefixed);

        // otherwise, they called .prefixed('requestAnimationFrame', window[, elem])
        } else {
          props = (prop + ' ' + (domPrefixes).join(ucProp + ' ') + ucProp).split(' ');
          return testDOMProps(props, prefixed, elem);
        }
    }
    /*>>testallprops*/


    /**
     * Tests
     * -----
     */

    // The *new* flexbox
    // dev.w3.org/csswg/css3-flexbox

    tests['flexbox'] = function() {
      return testPropsAll('flexWrap');
    };

    // The *old* flexbox
    // www.w3.org/TR/2009/WD-css3-flexbox-20090723/

    tests['flexboxlegacy'] = function() {
        return testPropsAll('boxDirection');
    };

    // On the S60 and BB Storm, getContext exists, but always returns undefined
    // so we actually have to call getContext() to verify
    // github.com/Modernizr/Modernizr/issues/issue/97/

    tests['canvas'] = function() {
        var elem = document.createElement('canvas');
        return !!(elem.getContext && elem.getContext('2d'));
    };

    tests['canvastext'] = function() {
        return !!(Modernizr['canvas'] && is(document.createElement('canvas').getContext('2d').fillText, 'function'));
    };

    // webk.it/70117 is tracking a legit WebGL feature detect proposal

    // We do a soft detect which may false positive in order to avoid
    // an expensive context creation: bugzil.la/732441

    tests['webgl'] = function() {
        return !!window.WebGLRenderingContext;
    };

    /*
     * The Modernizr.touch test only indicates if the browser supports
     *    touch events, which does not necessarily reflect a touchscreen
     *    device, as evidenced by tablets running Windows 7 or, alas,
     *    the Palm Pre / WebOS (touch) phones.
     *
     * Additionally, Chrome (desktop) used to lie about its support on this,
     *    but that has since been rectified: crbug.com/36415
     *
     * We also test for Firefox 4 Multitouch Support.
     *
     * For more info, see: modernizr.github.com/Modernizr/touch.html
     */

    tests['touch'] = function() {
        var bool;

        if(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
          bool = true;
        } else {
          injectElementWithStyles(['@media (',prefixes.join('touch-enabled),('),mod,')','{#modernizr{top:9px;position:absolute}}'].join(''), function( node ) {
            bool = node.offsetTop === 9;
          });
        }

        return bool;
    };


    // geolocation is often considered a trivial feature detect...
    // Turns out, it's quite tricky to get right:
    //
    // Using !!navigator.geolocation does two things we don't want. It:
    //   1. Leaks memory in IE9: github.com/Modernizr/Modernizr/issues/513
    //   2. Disables page caching in WebKit: webk.it/43956
    //
    // Meanwhile, in Firefox < 8, an about:config setting could expose
    // a false positive that would throw an exception: bugzil.la/688158

    tests['geolocation'] = function() {
        return 'geolocation' in navigator;
    };


    tests['postmessage'] = function() {
      return !!window.postMessage;
    };


    // Chrome incognito mode used to throw an exception when using openDatabase
    // It doesn't anymore.
    tests['websqldatabase'] = function() {
      return !!window.openDatabase;
    };

    // Vendors had inconsistent prefixing with the experimental Indexed DB:
    // - Webkit's implementation is accessible through webkitIndexedDB
    // - Firefox shipped moz_indexedDB before FF4b9, but since then has been mozIndexedDB
    // For speed, we don't test the legacy (and beta-only) indexedDB
    tests['indexedDB'] = function() {
      return !!testPropsAll("indexedDB", window);
    };

    // documentMode logic from YUI to filter out IE8 Compat Mode
    //   which false positives.
    tests['hashchange'] = function() {
      return isEventSupported('hashchange', window) && (document.documentMode === undefined || document.documentMode > 7);
    };

    // Per 1.6:
    // This used to be Modernizr.historymanagement but the longer
    // name has been deprecated in favor of a shorter and property-matching one.
    // The old API is still available in 1.6, but as of 2.0 will throw a warning,
    // and in the first release thereafter disappear entirely.
    tests['history'] = function() {
      return !!(window.history && history.pushState);
    };

    tests['draganddrop'] = function() {
        var div = document.createElement('div');
        return ('draggable' in div) || ('ondragstart' in div && 'ondrop' in div);
    };

    // FF3.6 was EOL'ed on 4/24/12, but the ESR version of FF10
    // will be supported until FF19 (2/12/13), at which time, ESR becomes FF17.
    // FF10 still uses prefixes, so check for it until then.
    // for more ESR info, see: mozilla.org/en-US/firefox/organizations/faq/
    tests['websockets'] = function() {
        return 'WebSocket' in window || 'MozWebSocket' in window;
    };


    // css-tricks.com/rgba-browser-support/
    tests['rgba'] = function() {
        // Set an rgba() color and check the returned value

        setCss('background-color:rgba(150,255,150,.5)');

        return contains(mStyle.backgroundColor, 'rgba');
    };

    tests['hsla'] = function() {
        // Same as rgba(), in fact, browsers re-map hsla() to rgba() internally,
        //   except IE9 who retains it as hsla

        setCss('background-color:hsla(120,40%,100%,.5)');

        return contains(mStyle.backgroundColor, 'rgba') || contains(mStyle.backgroundColor, 'hsla');
    };

    tests['multiplebgs'] = function() {
        // Setting multiple images AND a color on the background shorthand property
        //  and then querying the style.background property value for the number of
        //  occurrences of "url(" is a reliable method for detecting ACTUAL support for this!

        setCss('background:url(https://),url(https://),red url(https://)');

        // If the UA supports multiple backgrounds, there should be three occurrences
        //   of the string "url(" in the return value for elemStyle.background

        return (/(url\s*\(.*?){3}/).test(mStyle.background);
    };



    // this will false positive in Opera Mini
    //   github.com/Modernizr/Modernizr/issues/396

    tests['backgroundsize'] = function() {
        return testPropsAll('backgroundSize');
    };

    tests['borderimage'] = function() {
        return testPropsAll('borderImage');
    };


    // Super comprehensive table about all the unique implementations of
    // border-radius: muddledramblings.com/table-of-css3-border-radius-compliance

    tests['borderradius'] = function() {
        return testPropsAll('borderRadius');
    };

    // WebOS unfortunately false positives on this test.
    tests['boxshadow'] = function() {
        return testPropsAll('boxShadow');
    };

    // FF3.0 will false positive on this test
    tests['textshadow'] = function() {
        return document.createElement('div').style.textShadow === '';
    };


    tests['opacity'] = function() {
        // Browsers that actually have CSS Opacity implemented have done so
        //  according to spec, which means their return values are within the
        //  range of [0.0,1.0] - including the leading zero.

        setCssAll('opacity:.55');

        // The non-literal . in this regex is intentional:
        //   German Chrome returns this value as 0,55
        // github.com/Modernizr/Modernizr/issues/#issue/59/comment/516632
        return (/^0.55$/).test(mStyle.opacity);
    };


    // Note, Android < 4 will pass this test, but can only animate
    //   a single property at a time
    //   goo.gl/v3V4Gp
    tests['cssanimations'] = function() {
        return testPropsAll('animationName');
    };


    tests['csscolumns'] = function() {
        return testPropsAll('columnCount');
    };


    tests['cssgradients'] = function() {
        /**
         * For CSS Gradients syntax, please see:
         * webkit.org/blog/175/introducing-css-gradients/
         * developer.mozilla.org/en/CSS/-moz-linear-gradient
         * developer.mozilla.org/en/CSS/-moz-radial-gradient
         * dev.w3.org/csswg/css3-images/#gradients-
         */

        var str1 = 'background-image:',
            str2 = 'gradient(linear,left top,right bottom,from(#9f9),to(white));',
            str3 = 'linear-gradient(left top,#9f9, white);';

        setCss(
             // legacy webkit syntax (FIXME: remove when syntax not in use anymore)
              (str1 + '-webkit- '.split(' ').join(str2 + str1) +
             // standard syntax             // trailing 'background-image:'
              prefixes.join(str3 + str1)).slice(0, -str1.length)
        );

        return contains(mStyle.backgroundImage, 'gradient');
    };


    tests['cssreflections'] = function() {
        return testPropsAll('boxReflect');
    };


    tests['csstransforms'] = function() {
        return !!testPropsAll('transform');
    };


    tests['csstransforms3d'] = function() {

        var ret = !!testPropsAll('perspective');

        // Webkit's 3D transforms are passed off to the browser's own graphics renderer.
        //   It works fine in Safari on Leopard and Snow Leopard, but not in Chrome in
        //   some conditions. As a result, Webkit typically recognizes the syntax but
        //   will sometimes throw a false positive, thus we must do a more thorough check:
        if ( ret && 'webkitPerspective' in docElement.style ) {

          // Webkit allows this media query to succeed only if the feature is enabled.
          // `@media (transform-3d),(-webkit-transform-3d){ ... }`
          injectElementWithStyles('@media (transform-3d),(-webkit-transform-3d){#modernizr{left:9px;position:absolute;height:3px;}}', function( node, rule ) {
            ret = node.offsetLeft === 9 && node.offsetHeight === 3;
          });
        }
        return ret;
    };


    tests['csstransitions'] = function() {
        return testPropsAll('transition');
    };


    /*>>fontface*/
    // @font-face detection routine by Diego Perini
    // javascript.nwbox.com/CSSSupport/

    // false positives:
    //   WebOS github.com/Modernizr/Modernizr/issues/342
    //   WP7   github.com/Modernizr/Modernizr/issues/538
    tests['fontface'] = function() {
        var bool;

        injectElementWithStyles('@font-face {font-family:"font";src:url("https://")}', function( node, rule ) {
          var style = document.getElementById('smodernizr'),
              sheet = style.sheet || style.styleSheet,
              cssText = sheet ? (sheet.cssRules && sheet.cssRules[0] ? sheet.cssRules[0].cssText : sheet.cssText || '') : '';

          bool = /src/i.test(cssText) && cssText.indexOf(rule.split(' ')[0]) === 0;
        });

        return bool;
    };
    /*>>fontface*/

    // CSS generated content detection
    tests['generatedcontent'] = function() {
        var bool;

        injectElementWithStyles(['#',mod,'{font:0/0 a}#',mod,':after{content:"',smile,'";visibility:hidden;font:3px/1 a}'].join(''), function( node ) {
          bool = node.offsetHeight >= 3;
        });

        return bool;
    };



    // These tests evaluate support of the video/audio elements, as well as
    // testing what types of content they support.
    //
    // We're using the Boolean constructor here, so that we can extend the value
    // e.g.  Modernizr.video     // true
    //       Modernizr.video.ogg // 'probably'
    //
    // Codec values from : github.com/NielsLeenheer/html5test/blob/9106a8/index.html#L845
    //                     thx to NielsLeenheer and zcorpan

    // Note: in some older browsers, "no" was a return value instead of empty string.
    //   It was live in FF3.5.0 and 3.5.1, but fixed in 3.5.2
    //   It was also live in Safari 4.0.0 - 4.0.4, but fixed in 4.0.5

    tests['video'] = function() {
        var elem = document.createElement('video'),
            bool = false;

        // IE9 Running on Windows Server SKU can cause an exception to be thrown, bug #224
        try {
            if ( bool = !!elem.canPlayType ) {
                bool      = new Boolean(bool);
                bool.ogg  = elem.canPlayType('video/ogg; codecs="theora"')      .replace(/^no$/,'');

                // Without QuickTime, this value will be `undefined`. github.com/Modernizr/Modernizr/issues/546
                bool.h264 = elem.canPlayType('video/mp4; codecs="avc1.42E01E"') .replace(/^no$/,'');

                bool.webm = elem.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/^no$/,'');
            }

        } catch(e) { }

        return bool;
    };

    tests['audio'] = function() {
        var elem = document.createElement('audio'),
            bool = false;

        try {
            if ( bool = !!elem.canPlayType ) {
                bool      = new Boolean(bool);
                bool.ogg  = elem.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/,'');
                bool.mp3  = elem.canPlayType('audio/mpeg;')               .replace(/^no$/,'');

                // Mimetypes accepted:
                //   developer.mozilla.org/En/Media_formats_supported_by_the_audio_and_video_elements
                //   bit.ly/iphoneoscodecs
                bool.wav  = elem.canPlayType('audio/wav; codecs="1"')     .replace(/^no$/,'');
                bool.m4a  = ( elem.canPlayType('audio/x-m4a;')            ||
                              elem.canPlayType('audio/aac;'))             .replace(/^no$/,'');
            }
        } catch(e) { }

        return bool;
    };


    // In FF4, if disabled, window.localStorage should === null.

    // Normally, we could not test that directly and need to do a
    //   `('localStorage' in window) && ` test first because otherwise Firefox will
    //   throw bugzil.la/365772 if cookies are disabled

    // Also in iOS5 Private Browsing mode, attempting to use localStorage.setItem
    // will throw the exception:
    //   QUOTA_EXCEEDED_ERRROR DOM Exception 22.
    // Peculiarly, getItem and removeItem calls do not throw.

    // Because we are forced to try/catch this, we'll go aggressive.

    // Just FWIW: IE8 Compat mode supports these features completely:
    //   www.quirksmode.org/dom/html5.html
    // But IE8 doesn't support either with local files

    tests['localstorage'] = function() {
        try {
            localStorage.setItem(mod, mod);
            localStorage.removeItem(mod);
            return true;
        } catch(e) {
            return false;
        }
    };

    tests['sessionstorage'] = function() {
        try {
            sessionStorage.setItem(mod, mod);
            sessionStorage.removeItem(mod);
            return true;
        } catch(e) {
            return false;
        }
    };


    tests['webworkers'] = function() {
        return !!window.Worker;
    };


    tests['applicationcache'] = function() {
        return !!window.applicationCache;
    };


    // Thanks to Erik Dahlstrom
    tests['svg'] = function() {
        return !!document.createElementNS && !!document.createElementNS(ns.svg, 'svg').createSVGRect;
    };

    // specifically for SVG inline in HTML, not within XHTML
    // test page: paulirish.com/demo/inline-svg
    tests['inlinesvg'] = function() {
      var div = document.createElement('div');
      div.innerHTML = '<svg/>';
      return (div.firstChild && div.firstChild.namespaceURI) == ns.svg;
    };

    // SVG SMIL animation
    tests['smil'] = function() {
        return !!document.createElementNS && /SVGAnimate/.test(toString.call(document.createElementNS(ns.svg, 'animate')));
    };

    // This test is only for clip paths in SVG proper, not clip paths on HTML content
    // demo: srufaculty.sru.edu/david.dailey/svg/newstuff/clipPath4.svg

    // However read the comments to dig into applying SVG clippaths to HTML content here:
    //   github.com/Modernizr/Modernizr/issues/213#issuecomment-1149491
    tests['svgclippaths'] = function() {
        return !!document.createElementNS && /SVGClipPath/.test(toString.call(document.createElementNS(ns.svg, 'clipPath')));
    };

    /*>>webforms*/
    // input features and input types go directly onto the ret object, bypassing the tests loop.
    // Hold this guy to execute in a moment.
    function webforms() {
        /*>>input*/
        // Run through HTML5's new input attributes to see if the UA understands any.
        // We're using f which is the <input> element created early on
        // Mike Taylr has created a comprehensive resource for testing these attributes
        //   when applied to all input types:
        //   miketaylr.com/code/input-type-attr.html
        // spec: www.whatwg.org/specs/web-apps/current-work/multipage/the-input-element.html#input-type-attr-summary

        // Only input placeholder is tested while textarea's placeholder is not.
        // Currently Safari 4 and Opera 11 have support only for the input placeholder
        // Both tests are available in feature-detects/forms-placeholder.js
        Modernizr['input'] = (function( props ) {
            for ( var i = 0, len = props.length; i < len; i++ ) {
                attrs[ props[i] ] = !!(props[i] in inputElem);
            }
            if (attrs.list){
              // safari false positive's on datalist: webk.it/74252
              // see also github.com/Modernizr/Modernizr/issues/146
              attrs.list = !!(document.createElement('datalist') && window.HTMLDataListElement);
            }
            return attrs;
        })('autocomplete autofocus list placeholder max min multiple pattern required step'.split(' '));
        /*>>input*/

        /*>>inputtypes*/
        // Run through HTML5's new input types to see if the UA understands any.
        //   This is put behind the tests runloop because it doesn't return a
        //   true/false like all the other tests; instead, it returns an object
        //   containing each input type with its corresponding true/false value

        // Big thanks to @miketaylr for the html5 forms expertise. miketaylr.com/
        Modernizr['inputtypes'] = (function(props) {

            for ( var i = 0, bool, inputElemType, defaultView, len = props.length; i < len; i++ ) {

                inputElem.setAttribute('type', inputElemType = props[i]);
                bool = inputElem.type !== 'text';

                // We first check to see if the type we give it sticks..
                // If the type does, we feed it a textual value, which shouldn't be valid.
                // If the value doesn't stick, we know there's input sanitization which infers a custom UI
                if ( bool ) {

                    inputElem.value         = smile;
                    inputElem.style.cssText = 'position:absolute;visibility:hidden;';

                    if ( /^range$/.test(inputElemType) && inputElem.style.WebkitAppearance !== undefined ) {

                      docElement.appendChild(inputElem);
                      defaultView = document.defaultView;

                      // Safari 2-4 allows the smiley as a value, despite making a slider
                      bool =  defaultView.getComputedStyle &&
                              defaultView.getComputedStyle(inputElem, null).WebkitAppearance !== 'textfield' &&
                              // Mobile android web browser has false positive, so must
                              // check the height to see if the widget is actually there.
                              (inputElem.offsetHeight !== 0);

                      docElement.removeChild(inputElem);

                    } else if ( /^(search|tel)$/.test(inputElemType) ){
                      // Spec doesn't define any special parsing or detectable UI
                      //   behaviors so we pass these through as true

                      // Interestingly, opera fails the earlier test, so it doesn't
                      //  even make it here.

                    } else if ( /^(url|email)$/.test(inputElemType) ) {
                      // Real url and email support comes with prebaked validation.
                      bool = inputElem.checkValidity && inputElem.checkValidity() === false;

                    } else {
                      // If the upgraded input compontent rejects the :) text, we got a winner
                      bool = inputElem.value != smile;
                    }
                }

                inputs[ props[i] ] = !!bool;
            }
            return inputs;
        })('search tel url email datetime date month week time datetime-local number range color'.split(' '));
        /*>>inputtypes*/
    }
    /*>>webforms*/


    // End of test definitions
    // -----------------------



    // Run through all tests and detect their support in the current UA.
    // todo: hypothetically we could be doing an array of tests and use a basic loop here.
    for ( var feature in tests ) {
        if ( hasOwnProp(tests, feature) ) {
            // run the test, throw the return value into the Modernizr,
            //   then based on that boolean, define an appropriate className
            //   and push it into an array of classes we'll join later.
            featureName  = feature.toLowerCase();
            Modernizr[featureName] = tests[feature]();

            classes.push((Modernizr[featureName] ? '' : 'no-') + featureName);
        }
    }

    /*>>webforms*/
    // input tests need to run.
    Modernizr.input || webforms();
    /*>>webforms*/


    /**
     * addTest allows the user to define their own feature tests
     * the result will be added onto the Modernizr object,
     * as well as an appropriate className set on the html element
     *
     * @param feature - String naming the feature
     * @param test - Function returning true if feature is supported, false if not
     */
     Modernizr.addTest = function ( feature, test ) {
       if ( typeof feature == 'object' ) {
         for ( var key in feature ) {
           if ( hasOwnProp( feature, key ) ) {
             Modernizr.addTest( key, feature[ key ] );
           }
         }
       } else {

         feature = feature.toLowerCase();

         if ( Modernizr[feature] !== undefined ) {
           // we're going to quit if you're trying to overwrite an existing test
           // if we were to allow it, we'd do this:
           //   var re = new RegExp("\\b(no-)?" + feature + "\\b");
           //   docElement.className = docElement.className.replace( re, '' );
           // but, no rly, stuff 'em.
           return Modernizr;
         }

         test = typeof test == 'function' ? test() : test;

         if (typeof enableClasses !== "undefined" && enableClasses) {
           docElement.className += ' ' + (test ? '' : 'no-') + feature;
         }
         Modernizr[feature] = test;

       }

       return Modernizr; // allow chaining.
     };


    // Reset modElem.cssText to nothing to reduce memory footprint.
    setCss('');
    modElem = inputElem = null;

    /*>>shiv*/
    /**
     * @preserve HTML5 Shiv prev3.7.1 | @afarkas @jdalton @jon_neal @rem | MIT/GPL2 Licensed
     */
    ;(function(window, document) {
        /*jshint evil:true */
        /** version */
        var version = '3.7.0';

        /** Preset options */
        var options = window.html5 || {};

        /** Used to skip problem elements */
        var reSkip = /^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i;

        /** Not all elements can be cloned in IE **/
        var saveClones = /^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i;

        /** Detect whether the browser supports default html5 styles */
        var supportsHtml5Styles;

        /** Name of the expando, to work with multiple documents or to re-shiv one document */
        var expando = '_html5shiv';

        /** The id for the the documents expando */
        var expanID = 0;

        /** Cached data for each document */
        var expandoData = {};

        /** Detect whether the browser supports unknown elements */
        var supportsUnknownElements;

        (function() {
          try {
            var a = document.createElement('a');
            a.innerHTML = '<xyz></xyz>';
            //if the hidden property is implemented we can assume, that the browser supports basic HTML5 Styles
            supportsHtml5Styles = ('hidden' in a);

            supportsUnknownElements = a.childNodes.length == 1 || (function() {
              // assign a false positive if unable to shiv
              (document.createElement)('a');
              var frag = document.createDocumentFragment();
              return (
                typeof frag.cloneNode == 'undefined' ||
                typeof frag.createDocumentFragment == 'undefined' ||
                typeof frag.createElement == 'undefined'
              );
            }());
          } catch(e) {
            // assign a false positive if detection fails => unable to shiv
            supportsHtml5Styles = true;
            supportsUnknownElements = true;
          }

        }());

        /*--------------------------------------------------------------------------*/

        /**
         * Creates a style sheet with the given CSS text and adds it to the document.
         * @private
         * @param {Document} ownerDocument The document.
         * @param {String} cssText The CSS text.
         * @returns {StyleSheet} The style element.
         */
        function addStyleSheet(ownerDocument, cssText) {
          var p = ownerDocument.createElement('p'),
          parent = ownerDocument.getElementsByTagName('head')[0] || ownerDocument.documentElement;

          p.innerHTML = 'x<style>' + cssText + '</style>';
          return parent.insertBefore(p.lastChild, parent.firstChild);
        }

        /**
         * Returns the value of `html5.elements` as an array.
         * @private
         * @returns {Array} An array of shived element node names.
         */
        function getElements() {
          var elements = html5.elements;
          return typeof elements == 'string' ? elements.split(' ') : elements;
        }

        /**
         * Returns the data associated to the given document
         * @private
         * @param {Document} ownerDocument The document.
         * @returns {Object} An object of data.
         */
        function getExpandoData(ownerDocument) {
          var data = expandoData[ownerDocument[expando]];
          if (!data) {
            data = {};
            expanID++;
            ownerDocument[expando] = expanID;
            expandoData[expanID] = data;
          }
          return data;
        }

        /**
         * returns a shived element for the given nodeName and document
         * @memberOf html5
         * @param {String} nodeName name of the element
         * @param {Document} ownerDocument The context document.
         * @returns {Object} The shived element.
         */
        function createElement(nodeName, ownerDocument, data){
          if (!ownerDocument) {
            ownerDocument = document;
          }
          if(supportsUnknownElements){
            return ownerDocument.createElement(nodeName);
          }
          if (!data) {
            data = getExpandoData(ownerDocument);
          }
          var node;

          if (data.cache[nodeName]) {
            node = data.cache[nodeName].cloneNode();
          } else if (saveClones.test(nodeName)) {
            node = (data.cache[nodeName] = data.createElem(nodeName)).cloneNode();
          } else {
            node = data.createElem(nodeName);
          }

          // Avoid adding some elements to fragments in IE < 9 because
          // * Attributes like `name` or `type` cannot be set/changed once an element
          //   is inserted into a document/fragment
          // * Link elements with `src` attributes that are inaccessible, as with
          //   a 403 response, will cause the tab/window to crash
          // * Script elements appended to fragments will execute when their `src`
          //   or `text` property is set
          return node.canHaveChildren && !reSkip.test(nodeName) && !node.tagUrn ? data.frag.appendChild(node) : node;
        }

        /**
         * returns a shived DocumentFragment for the given document
         * @memberOf html5
         * @param {Document} ownerDocument The context document.
         * @returns {Object} The shived DocumentFragment.
         */
        function createDocumentFragment(ownerDocument, data){
          if (!ownerDocument) {
            ownerDocument = document;
          }
          if(supportsUnknownElements){
            return ownerDocument.createDocumentFragment();
          }
          data = data || getExpandoData(ownerDocument);
          var clone = data.frag.cloneNode(),
          i = 0,
          elems = getElements(),
          l = elems.length;
          for(;i<l;i++){
            clone.createElement(elems[i]);
          }
          return clone;
        }

        /**
         * Shivs the `createElement` and `createDocumentFragment` methods of the document.
         * @private
         * @param {Document|DocumentFragment} ownerDocument The document.
         * @param {Object} data of the document.
         */
        function shivMethods(ownerDocument, data) {
          if (!data.cache) {
            data.cache = {};
            data.createElem = ownerDocument.createElement;
            data.createFrag = ownerDocument.createDocumentFragment;
            data.frag = data.createFrag();
          }


          ownerDocument.createElement = function(nodeName) {
            //abort shiv
            if (!html5.shivMethods) {
              return data.createElem(nodeName);
            }
            return createElement(nodeName, ownerDocument, data);
          };

          ownerDocument.createDocumentFragment = Function('h,f', 'return function(){' +
                                                          'var n=f.cloneNode(),c=n.createElement;' +
                                                          'h.shivMethods&&(' +
                                                          // unroll the `createElement` calls
                                                          getElements().join().replace(/[\w\-]+/g, function(nodeName) {
            data.createElem(nodeName);
            data.frag.createElement(nodeName);
            return 'c("' + nodeName + '")';
          }) +
            ');return n}'
                                                         )(html5, data.frag);
        }

        /*--------------------------------------------------------------------------*/

        /**
         * Shivs the given document.
         * @memberOf html5
         * @param {Document} ownerDocument The document to shiv.
         * @returns {Document} The shived document.
         */
        function shivDocument(ownerDocument) {
          if (!ownerDocument) {
            ownerDocument = document;
          }
          var data = getExpandoData(ownerDocument);

          if (html5.shivCSS && !supportsHtml5Styles && !data.hasCSS) {
            data.hasCSS = !!addStyleSheet(ownerDocument,
                                          // corrects block display not defined in IE6/7/8/9
                                          'article,aside,dialog,figcaption,figure,footer,header,hgroup,main,nav,section{display:block}' +
                                            // adds styling not present in IE6/7/8/9
                                            'mark{background:#FF0;color:#000}' +
                                            // hides non-rendered elements
                                            'template{display:none}'
                                         );
          }
          if (!supportsUnknownElements) {
            shivMethods(ownerDocument, data);
          }
          return ownerDocument;
        }

        /*--------------------------------------------------------------------------*/

        /**
         * The `html5` object is exposed so that more elements can be shived and
         * existing shiving can be detected on iframes.
         * @type Object
         * @example
         *
         * // options can be changed before the script is included
         * html5 = { 'elements': 'mark section', 'shivCSS': false, 'shivMethods': false };
         */
        var html5 = {

          /**
           * An array or space separated string of node names of the elements to shiv.
           * @memberOf html5
           * @type Array|String
           */
          'elements': options.elements || 'abbr article aside audio bdi canvas data datalist details dialog figcaption figure footer header hgroup main mark meter nav output progress section summary template time video',

          /**
           * current version of html5shiv
           */
          'version': version,

          /**
           * A flag to indicate that the HTML5 style sheet should be inserted.
           * @memberOf html5
           * @type Boolean
           */
          'shivCSS': (options.shivCSS !== false),

          /**
           * Is equal to true if a browser supports creating unknown/HTML5 elements
           * @memberOf html5
           * @type boolean
           */
          'supportsUnknownElements': supportsUnknownElements,

          /**
           * A flag to indicate that the document's `createElement` and `createDocumentFragment`
           * methods should be overwritten.
           * @memberOf html5
           * @type Boolean
           */
          'shivMethods': (options.shivMethods !== false),

          /**
           * A string to describe the type of `html5` object ("default" or "default print").
           * @memberOf html5
           * @type String
           */
          'type': 'default',

          // shivs the document according to the specified `html5` object options
          'shivDocument': shivDocument,

          //creates a shived element
          createElement: createElement,

          //creates a shived documentFragment
          createDocumentFragment: createDocumentFragment
        };

        /*--------------------------------------------------------------------------*/

        // expose html5
        window.html5 = html5;

        // shiv the document
        shivDocument(document);

    }(this, document));
    /*>>shiv*/

    // Assign private properties to the return object with prefix
    Modernizr._version      = version;

    // expose these for the plugin API. Look in the source for how to join() them against your input
    /*>>prefixes*/
    Modernizr._prefixes     = prefixes;
    /*>>prefixes*/
    /*>>domprefixes*/
    Modernizr._domPrefixes  = domPrefixes;
    Modernizr._cssomPrefixes  = cssomPrefixes;
    /*>>domprefixes*/

    /*>>mq*/
    // Modernizr.mq tests a given media query, live against the current state of the window
    // A few important notes:
    //   * If a browser does not support media queries at all (eg. oldIE) the mq() will always return false
    //   * A max-width or orientation query will be evaluated against the current state, which may change later.
    //   * You must specify values. Eg. If you are testing support for the min-width media query use:
    //       Modernizr.mq('(min-width:0)')
    // usage:
    // Modernizr.mq('only screen and (max-width:768)')
    Modernizr.mq            = testMediaQuery;
    /*>>mq*/

    /*>>hasevent*/
    // Modernizr.hasEvent() detects support for a given event, with an optional element to test on
    // Modernizr.hasEvent('gesturestart', elem)
    Modernizr.hasEvent      = isEventSupported;
    /*>>hasevent*/

    /*>>testprop*/
    // Modernizr.testProp() investigates whether a given style property is recognized
    // Note that the property names must be provided in the camelCase variant.
    // Modernizr.testProp('pointerEvents')
    Modernizr.testProp      = function(prop){
        return testProps([prop]);
    };
    /*>>testprop*/

    /*>>testallprops*/
    // Modernizr.testAllProps() investigates whether a given style property,
    //   or any of its vendor-prefixed variants, is recognized
    // Note that the property names must be provided in the camelCase variant.
    // Modernizr.testAllProps('boxSizing')
    Modernizr.testAllProps  = testPropsAll;
    /*>>testallprops*/


    /*>>teststyles*/
    // Modernizr.testStyles() allows you to add custom styles to the document and test an element afterwards
    // Modernizr.testStyles('#modernizr { position:absolute }', function(elem, rule){ ... })
    Modernizr.testStyles    = injectElementWithStyles;
    /*>>teststyles*/


    /*>>prefixed*/
    // Modernizr.prefixed() returns the prefixed or nonprefixed property name variant of your input
    // Modernizr.prefixed('boxSizing') // 'MozBoxSizing'

    // Properties must be passed as dom-style camelcase, rather than `box-sizing` hypentated style.
    // Return values will also be the camelCase variant, if you need to translate that to hypenated style use:
    //
    //     str.replace(/([A-Z])/g, function(str,m1){ return '-' + m1.toLowerCase(); }).replace(/^ms-/,'-ms-');

    // If you're trying to ascertain which transition end event to bind to, you might do something like...
    //
    //     var transEndEventNames = {
    //       'WebkitTransition' : 'webkitTransitionEnd',
    //       'MozTransition'    : 'transitionend',
    //       'OTransition'      : 'oTransitionEnd',
    //       'msTransition'     : 'MSTransitionEnd',
    //       'transition'       : 'transitionend'
    //     },
    //     transEndEventName = transEndEventNames[ Modernizr.prefixed('transition') ];

    Modernizr.prefixed      = function(prop, obj, elem){
      if(!obj) {
        return testPropsAll(prop, 'pfx');
      } else {
        // Testing DOM property e.g. Modernizr.prefixed('requestAnimationFrame', window) // 'mozRequestAnimationFrame'
        return testPropsAll(prop, obj, elem);
      }
    };
    /*>>prefixed*/


    /*>>cssclasses*/
    // Remove "no-js" class from <html> element, if it exists:
    docElement.className = docElement.className.replace(/(^|\s)no-js(\s|$)/, '$1$2') +

                            // Add the new classes to the <html> element.
                            (enableClasses ? ' js ' + classes.join(' ') : '');
    /*>>cssclasses*/

    return Modernizr;

})(this, this.document);

/*
 * Foundation Responsive Library
 * http://foundation.zurb.com
 * Copyright 2014, ZURB
 * Free to use under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
*/

(function ($, window, document, undefined) {
  'use strict';

  var header_helpers = function (class_array) {
    var i = class_array.length;
    var head = $('head');

    while (i--) {
      if(head.has('.' + class_array[i]).length === 0) {
        head.append('<meta class="' + class_array[i] + '" />');
      }
    }
  };

  header_helpers([
    'foundation-mq-small',
    'foundation-mq-medium',
    'foundation-mq-large',
    'foundation-mq-xlarge',
    'foundation-mq-xxlarge',
    'foundation-data-attribute-namespace']);

  // Enable FastClick if present

  $(function() {
    if (typeof FastClick !== 'undefined') {
      // Don't attach to body if undefined
      if (typeof document.body !== 'undefined') {
        FastClick.attach(document.body);
      }
    }
  });

  // private Fast Selector wrapper,
  // returns jQuery object. Only use where
  // getElementById is not available.
  var S = function (selector, context) {
    if (typeof selector === 'string') {
      if (context) {
        var cont;
        if (context.jquery) {
          cont = context[0];
          if (!cont) return context;
        } else {
          cont = context;
        }
        return $(cont.querySelectorAll(selector));
      }

      return $(document.querySelectorAll(selector));
    }

    return $(selector, context);
  };

  // Namespace functions.

  var attr_name = function (init) {
    var arr = [];
    if (!init) arr.push('data');
    if (this.namespace.length > 0) arr.push(this.namespace);
    arr.push(this.name);

    return arr.join('-');
  };

  var add_namespace = function (str) {
    var parts = str.split('-'),
        i = parts.length,
        arr = [];

    while (i--) {
      if (i !== 0) {
        arr.push(parts[i]);
      } else {
        if (this.namespace.length > 0) {
          arr.push(this.namespace, parts[i]);
        } else {
          arr.push(parts[i]);
        }
      }
    }

    return arr.reverse().join('-');
  };

  // Event binding and data-options updating.

  var bindings = function (method, options) {
    var self = this,
        should_bind_events = !S(this).data(this.attr_name(true));


    if (S(this.scope).is('[' + this.attr_name() +']')) {
      S(this.scope).data(this.attr_name(true) + '-init', $.extend({}, this.settings, (options || method), this.data_options(S(this.scope))));

      if (should_bind_events) {
        this.events(this.scope);
      }

    } else {
      S('[' + this.attr_name() +']', this.scope).each(function () {
        var should_bind_events = !S(this).data(self.attr_name(true) + '-init');
        S(this).data(self.attr_name(true) + '-init', $.extend({}, self.settings, (options || method), self.data_options(S(this))));

        if (should_bind_events) {
          self.events(this);
        }
      });
    }
    // # Patch to fix #5043 to move this *after* the if/else clause in order for Backbone and similar frameworks to have improved control over event binding and data-options updating.
    if (typeof method === 'string') {
      return this[method].call(this, options);
    }

  };

  var single_image_loaded = function (image, callback) {
    function loaded () {
      callback(image[0]);
    }

    function bindLoad () {
      this.one('load', loaded);

      if (/MSIE (\d+\.\d+);/.test(navigator.userAgent)) {
        var src = this.attr( 'src' ),
            param = src.match( /\?/ ) ? '&' : '?';

        param += 'random=' + (new Date()).getTime();
        this.attr('src', src + param);
      }
    }

    if (!image.attr('src')) {
      loaded();
      return;
    }

    if (image[0].complete || image[0].readyState === 4) {
      loaded();
    } else {
      bindLoad.call(image);
    }
  };

  /*
    https://github.com/paulirish/matchMedia.js
  */

  window.matchMedia = window.matchMedia || (function( doc ) {

    "use strict";

    var bool,
        docElem = doc.documentElement,
        refNode = docElem.firstElementChild || docElem.firstChild,
        // fakeBody required for <FF4 when executed in <head>
        fakeBody = doc.createElement( "body" ),
        div = doc.createElement( "div" );

    div.id = "mq-test-1";
    div.style.cssText = "position:absolute;top:-100em";
    fakeBody.style.background = "none";
    fakeBody.appendChild(div);

    return function (q) {

      div.innerHTML = "&shy;<style media=\"" + q + "\"> #mq-test-1 { width: 42px; }</style>";

      docElem.insertBefore( fakeBody, refNode );
      bool = div.offsetWidth === 42;
      docElem.removeChild( fakeBody );

      return {
        matches: bool,
        media: q
      };

    };

  }( document ));

  /*
   * jquery.requestAnimationFrame
   * https://github.com/gnarf37/jquery-requestAnimationFrame
   * Requires jQuery 1.8+
   *
   * Copyright (c) 2012 Corey Frang
   * Licensed under the MIT license.
   */

  (function($) {

  // requestAnimationFrame polyfill adapted from Erik Möller
  // fixes from Paul Irish and Tino Zijdel
  // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
  // http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

  var animating,
      lastTime = 0,
      vendors = ['webkit', 'moz'],
      requestAnimationFrame = window.requestAnimationFrame,
      cancelAnimationFrame = window.cancelAnimationFrame,
      jqueryFxAvailable = 'undefined' !== typeof jQuery.fx;

  for (; lastTime < vendors.length && !requestAnimationFrame; lastTime++) {
    requestAnimationFrame = window[ vendors[lastTime] + "RequestAnimationFrame" ];
    cancelAnimationFrame = cancelAnimationFrame ||
      window[ vendors[lastTime] + "CancelAnimationFrame" ] ||
      window[ vendors[lastTime] + "CancelRequestAnimationFrame" ];
  }

  function raf() {
    if (animating) {
      requestAnimationFrame(raf);

      if (jqueryFxAvailable) {
        jQuery.fx.tick();
      }
    }
  }

  if (requestAnimationFrame) {
    // use rAF
    window.requestAnimationFrame = requestAnimationFrame;
    window.cancelAnimationFrame = cancelAnimationFrame;

    if (jqueryFxAvailable) {
      jQuery.fx.timer = function (timer) {
        if (timer() && jQuery.timers.push(timer) && !animating) {
          animating = true;
          raf();
        }
      };

      jQuery.fx.stop = function () {
        animating = false;
      };
    }
  } else {
    // polyfill
    window.requestAnimationFrame = function (callback) {
      var currTime = new Date().getTime(),
        timeToCall = Math.max(0, 16 - (currTime - lastTime)),
        id = window.setTimeout(function () {
          callback(currTime + timeToCall);
        }, timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };

    window.cancelAnimationFrame = function (id) {
      clearTimeout(id);
    };

  }

  }( jQuery ));


  function removeQuotes (string) {
    if (typeof string === 'string' || string instanceof String) {
      string = string.replace(/^['\\/"]+|(;\s?})+|['\\/"]+$/g, '');
    }

    return string;
  }

  window.Foundation = {
    name : 'Foundation',

    version : '5.4.5',

    media_queries : {
      small : S('.foundation-mq-small').css('font-family').replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g, ''),
      medium : S('.foundation-mq-medium').css('font-family').replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g, ''),
      large : S('.foundation-mq-large').css('font-family').replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g, ''),
      xlarge: S('.foundation-mq-xlarge').css('font-family').replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g, ''),
      xxlarge: S('.foundation-mq-xxlarge').css('font-family').replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g, '')
    },

    stylesheet : $('<style></style>').appendTo('head')[0].sheet,

    global: {
      namespace: undefined
    },

    init : function (scope, libraries, method, options, response) {
      var args = [scope, method, options, response],
          responses = [];

      // check RTL
      this.rtl = /rtl/i.test(S('html').attr('dir'));

      // set foundation global scope
      this.scope = scope || this.scope;

      this.set_namespace();

      if (libraries && typeof libraries === 'string' && !/reflow/i.test(libraries)) {
        if (this.libs.hasOwnProperty(libraries)) {
          responses.push(this.init_lib(libraries, args));
        }
      } else {
        for (var lib in this.libs) {
          responses.push(this.init_lib(lib, libraries));
        }
      }

      S(window).load(function(){
        S(window)
          .trigger('resize.fndtn.clearing')
          .trigger('resize.fndtn.dropdown')
          .trigger('resize.fndtn.equalizer')
          .trigger('resize.fndtn.interchange')
          .trigger('resize.fndtn.joyride')
          .trigger('resize.fndtn.magellan')
          .trigger('resize.fndtn.topbar')
          .trigger('resize.fndtn.slider');
      });

      return scope;
    },

    init_lib : function (lib, args) {
      if (this.libs.hasOwnProperty(lib)) {
        this.patch(this.libs[lib]);

        if (args && args.hasOwnProperty(lib)) {
            if (typeof this.libs[lib].settings !== 'undefined') {
                $.extend(true, this.libs[lib].settings, args[lib]);
            }
            else if (typeof this.libs[lib].defaults !== 'undefined') {
                $.extend(true, this.libs[lib].defaults, args[lib]);
            }
          return this.libs[lib].init.apply(this.libs[lib], [this.scope, args[lib]]);
        }

        args = args instanceof Array ? args : new Array(args);    // PATCH: added this line
        return this.libs[lib].init.apply(this.libs[lib], args);
      }

      return function () {};
    },

    patch : function (lib) {
      lib.scope = this.scope;
      lib.namespace = this.global.namespace;
      lib.rtl = this.rtl;
      lib['data_options'] = this.utils.data_options;
      lib['attr_name'] = attr_name;
      lib['add_namespace'] = add_namespace;
      lib['bindings'] = bindings;
      lib['S'] = this.utils.S;
    },

    inherit : function (scope, methods) {
      var methods_arr = methods.split(' '),
          i = methods_arr.length;

      while (i--) {
        if (this.utils.hasOwnProperty(methods_arr[i])) {
          scope[methods_arr[i]] = this.utils[methods_arr[i]];
        }
      }
    },

    set_namespace: function () {

      // Description:
      //    Don't bother reading the namespace out of the meta tag
      //    if the namespace has been set globally in javascript
      //
      // Example:
      //    Foundation.global.namespace = 'my-namespace';
      // or make it an empty string:
      //    Foundation.global.namespace = '';
      //
      //

      // If the namespace has not been set (is undefined), try to read it out of the meta element.
      // Otherwise use the globally defined namespace, even if it's empty ('')
      var namespace = ( this.global.namespace === undefined ) ? $('.foundation-data-attribute-namespace').css('font-family') : this.global.namespace;

      // Finally, if the namsepace is either undefined or false, set it to an empty string.
      // Otherwise use the namespace value.
      this.global.namespace = ( namespace === undefined || /false/i.test(namespace) ) ? '' : namespace;
    },

    libs : {},

    // methods that can be inherited in libraries
    utils : {

      // Description:
      //    Fast Selector wrapper returns jQuery object. Only use where getElementById
      //    is not available.
      //
      // Arguments:
      //    Selector (String): CSS selector describing the element(s) to be
      //    returned as a jQuery object.
      //
      //    Scope (String): CSS selector describing the area to be searched. Default
      //    is document.
      //
      // Returns:
      //    Element (jQuery Object): jQuery object containing elements matching the
      //    selector within the scope.
      S : S,

      // Description:
      //    Executes a function a max of once every n milliseconds
      //
      // Arguments:
      //    Func (Function): Function to be throttled.
      //
      //    Delay (Integer): Function execution threshold in milliseconds.
      //
      // Returns:
      //    Lazy_function (Function): Function with throttling applied.
      throttle : function (func, delay) {
        var timer = null;

        return function () {
          var context = this, args = arguments;

          if (timer == null) {
            timer = setTimeout(function () {
              func.apply(context, args);
              timer = null;
            }, delay);
          }
        };
      },

      // Description:
      //    Executes a function when it stops being invoked for n seconds
      //    Modified version of _.debounce() http://underscorejs.org
      //
      // Arguments:
      //    Func (Function): Function to be debounced.
      //
      //    Delay (Integer): Function execution threshold in milliseconds.
      //
      //    Immediate (Bool): Whether the function should be called at the beginning
      //    of the delay instead of the end. Default is false.
      //
      // Returns:
      //    Lazy_function (Function): Function with debouncing applied.
      debounce : function (func, delay, immediate) {
        var timeout, result;
        return function () {
          var context = this, args = arguments;
          var later = function () {
            timeout = null;
            if (!immediate) result = func.apply(context, args);
          };
          var callNow = immediate && !timeout;
          clearTimeout(timeout);
          timeout = setTimeout(later, delay);
          if (callNow) result = func.apply(context, args);
          return result;
        };
      },

      // Description:
      //    Parses data-options attribute
      //
      // Arguments:
      //    El (jQuery Object): Element to be parsed.
      //
      // Returns:
      //    Options (Javascript Object): Contents of the element's data-options
      //    attribute.
      data_options : function (el, data_attr_name) {
        data_attr_name = data_attr_name || 'options';
        var opts = {}, ii, p, opts_arr,
            data_options = function (el) {
              var namespace = Foundation.global.namespace;

              if (namespace.length > 0) {
                return el.data(namespace + '-' + data_attr_name);
              }

              return el.data(data_attr_name);
            };

        var cached_options = data_options(el);

        if (typeof cached_options === 'object') {
          return cached_options;
        }

        opts_arr = (cached_options || ':').split(';');
        ii = opts_arr.length;

        function isNumber (o) {
          return ! isNaN (o-0) && o !== null && o !== "" && o !== false && o !== true;
        }

        function trim (str) {
          if (typeof str === 'string') return $.trim(str);
          return str;
        }

        while (ii--) {
          p = opts_arr[ii].split(':');
          p = [p[0], p.slice(1).join(':')];

          if (/true/i.test(p[1])) p[1] = true;
          if (/false/i.test(p[1])) p[1] = false;
          if (isNumber(p[1])) {
            if (p[1].indexOf('.') === -1) {
              p[1] = parseInt(p[1], 10);
            } else {
              p[1] = parseFloat(p[1]);
            }
          }

          if (p.length === 2 && p[0].length > 0) {
            opts[trim(p[0])] = trim(p[1]);
          }
        }

        return opts;
      },

      // Description:
      //    Adds JS-recognizable media queries
      //
      // Arguments:
      //    Media (String): Key string for the media query to be stored as in
      //    Foundation.media_queries
      //
      //    Class (String): Class name for the generated <meta> tag
      register_media : function (media, media_class) {
        if(Foundation.media_queries[media] === undefined) {
          $('head').append('<meta class="' + media_class + '"/>');
          Foundation.media_queries[media] = removeQuotes($('.' + media_class).css('font-family'));
        }
      },

      // Description:
      //    Add custom CSS within a JS-defined media query
      //
      // Arguments:
      //    Rule (String): CSS rule to be appended to the document.
      //
      //    Media (String): Optional media query string for the CSS rule to be
      //    nested under.
      add_custom_rule : function (rule, media) {
        if (media === undefined && Foundation.stylesheet) {
          Foundation.stylesheet.insertRule(rule, Foundation.stylesheet.cssRules.length);
        } else {
          var query = Foundation.media_queries[media];

          if (query !== undefined) {
            Foundation.stylesheet.insertRule('@media ' +
              Foundation.media_queries[media] + '{ ' + rule + ' }');
          }
        }
      },

      // Description:
      //    Performs a callback function when an image is fully loaded
      //
      // Arguments:
      //    Image (jQuery Object): Image(s) to check if loaded.
      //
      //    Callback (Function): Function to execute when image is fully loaded.
      image_loaded : function (images, callback) {
        var self = this,
            unloaded = images.length;

        if (unloaded === 0) {
          callback(images);
        }

        images.each(function () {
          single_image_loaded(self.S(this), function () {
            unloaded -= 1;
            if (unloaded === 0) {
              callback(images);
            }
          });
        });
      },

      // Description:
      //    Returns a random, alphanumeric string
      //
      // Arguments:
      //    Length (Integer): Length of string to be generated. Defaults to random
      //    integer.
      //
      // Returns:
      //    Rand (String): Pseudo-random, alphanumeric string.
      random_str : function () {
        if (!this.fidx) this.fidx = 0;
        this.prefix = this.prefix || [(this.name || 'F'), (+new Date).toString(36)].join('-');

        return this.prefix + (this.fidx++).toString(36);
      }
    }
  };

  $.fn.foundation = function () {
    var args = Array.prototype.slice.call(arguments, 0);

    return this.each(function () {
      Foundation.init.apply(Foundation, [this].concat(args));
      return this;
    });
  };

}(jQuery, window, window.document));

;(function ($, window, document, undefined) {
  'use strict';

  Foundation.libs.dropdown = {
    name : 'dropdown',

    version : '5.4.5',

    settings : {
      active_class: 'open',
      mega_class: 'mega',
      align: 'bottom',
      is_hover: false,
      opened: function(){},
      closed: function(){}
    },

    init : function (scope, method, options) {
      Foundation.inherit(this, 'throttle');

      this.bindings(method, options);
    },

    events : function (scope) {
      var self = this,
          S = self.S;

      S(this.scope)
        .off('.dropdown')
        .on('click.fndtn.dropdown', '[' + this.attr_name() + ']', function (e) {
          var settings = S(this).data(self.attr_name(true) + '-init') || self.settings;
          if (!settings.is_hover || Modernizr.touch) {
            e.preventDefault();
            self.toggle($(this));
          }
        })
        .on('mouseenter.fndtn.dropdown', '[' + this.attr_name() + '], [' + this.attr_name() + '-content]', function (e) {
          var $this = S(this),
              dropdown,
              target;

          clearTimeout(self.timeout);

          if ($this.data(self.data_attr())) {
            dropdown = S('#' + $this.data(self.data_attr()));
            target = $this;
          } else {
            dropdown = $this;
            target = S("[" + self.attr_name() + "='" + dropdown.attr('id') + "']");
          }

          var settings = target.data(self.attr_name(true) + '-init') || self.settings;

          if(S(e.target).data(self.data_attr()) && settings.is_hover) {
            self.closeall.call(self);
          }

          if (settings.is_hover) self.open.apply(self, [dropdown, target]);
        })
        .on('mouseleave.fndtn.dropdown', '[' + this.attr_name() + '], [' + this.attr_name() + '-content]', function (e) {
          var $this = S(this);
          self.timeout = setTimeout(function () {
            if ($this.data(self.data_attr())) {
              var settings = $this.data(self.data_attr(true) + '-init') || self.settings;
              if (settings.is_hover) self.close.call(self, S('#' + $this.data(self.data_attr())));
            } else {
              var target   = S('[' + self.attr_name() + '="' + S(this).attr('id') + '"]'),
                  settings = target.data(self.attr_name(true) + '-init') || self.settings;
              if (settings.is_hover) self.close.call(self, $this);
            }
          }.bind(this), 150);
        })
        .on('click.fndtn.dropdown', function (e) {
          var parent = S(e.target).closest('[' + self.attr_name() + '-content]');

          if (S(e.target).closest('[' + self.attr_name() + ']').length > 0) {
            return;
          }
          if (!(S(e.target).data('revealId')) &&
            (parent.length > 0 && (S(e.target).is('[' + self.attr_name() + '-content]') ||
              $.contains(parent.first()[0], e.target)))) {
            e.stopPropagation();
            return;
          }

          self.close.call(self, S('[' + self.attr_name() + '-content]'));
        })
        .on('opened.fndtn.dropdown', '[' + self.attr_name() + '-content]', function () {
            self.settings.opened.call(this);
        })
        .on('closed.fndtn.dropdown', '[' + self.attr_name() + '-content]', function () {
            self.settings.closed.call(this);
        });

      S(window)
        .off('.dropdown')
        .on('resize.fndtn.dropdown', self.throttle(function () {
          self.resize.call(self);
        }, 50));

      this.resize();
    },

    close: function (dropdown) {
      var self = this;
      dropdown.each(function () {
        var original_target = $('[' + self.attr_name() + '=' + dropdown[0].id + ']') || $('aria-controls=' + dropdown[0].id+ ']');
        original_target.attr('aria-expanded', "false");
        if (self.S(this).hasClass(self.settings.active_class)) {
          self.S(this)
            .css(Foundation.rtl ? 'right':'left', '-99999px')
            .attr('aria-hidden', "true")
            .removeClass(self.settings.active_class)
            .prev('[' + self.attr_name() + ']')
            .removeClass(self.settings.active_class)
            .removeData('target');

          self.S(this).trigger('closed').trigger('closed.fndtn.dropdown', [dropdown]);
        }
      });
    },

    closeall: function() {
      var self = this;
      $.each(self.S('[' + this.attr_name() + '-content]'), function() {
        self.close.call(self, self.S(this));
      });
    },

    open: function (dropdown, target) {
        this
          .css(dropdown
            .addClass(this.settings.active_class), target);
        dropdown.prev('[' + this.attr_name() + ']').addClass(this.settings.active_class);
        dropdown.data('target', target.get(0)).trigger('opened').trigger('opened.fndtn.dropdown', [dropdown, target]);
        dropdown.attr('aria-hidden', 'false');
        target.attr('aria-expanded', 'true');
        dropdown.focus();
    },

    data_attr: function () {
      if (this.namespace.length > 0) {
        return this.namespace + '-' + this.name;
      }

      return this.name;
    },

    toggle : function (target) {
      var dropdown = this.S('#' + target.data(this.data_attr()));
      if (dropdown.length === 0) {
        // No dropdown found, not continuing
        return;
      }

      this.close.call(this, this.S('[' + this.attr_name() + '-content]').not(dropdown));

      if (dropdown.hasClass(this.settings.active_class)) {
        this.close.call(this, dropdown);
        if (dropdown.data('target') !== target.get(0))
          this.open.call(this, dropdown, target);
      } else {
        this.open.call(this, dropdown, target);
      }
    },

    resize : function () {
      var dropdown = this.S('[' + this.attr_name() + '-content].open'),
          target = this.S("[" + this.attr_name() + "='" + dropdown.attr('id') + "']");

      if (dropdown.length && target.length) {
        this.css(dropdown, target);
      }
    },

    css : function (dropdown, target) {
      var left_offset = Math.max((target.width() - dropdown.width()) / 2, 8),
          settings = target.data(this.attr_name(true) + '-init') || this.settings;

      this.clear_idx();

      if (this.small()) {
        var p = this.dirs.bottom.call(dropdown, target, settings);

        dropdown.attr('style', '').removeClass('drop-left drop-right drop-top').css({
          position : 'absolute',
          width: '95%',
          'max-width': 'none',
          top: p.top
        });

        dropdown.css(Foundation.rtl ? 'right':'left', left_offset);
      } else {

        this.style(dropdown, target, settings);
      }

      return dropdown;
    },

    style : function (dropdown, target, settings) {
      var css = $.extend({position: 'absolute'},
        this.dirs[settings.align].call(dropdown, target, settings));

      dropdown.attr('style', '').css(css);
    },

    // return CSS property object
    // `this` is the dropdown
    dirs : {
      // Calculate target offset
      _base : function (t) {
        var o_p = this.offsetParent(),
            o = o_p.offset(),
            p = t.offset();

        p.top -= o.top;
        p.left -= o.left;

        return p;
      },
      top: function (t, s) {
        var self = Foundation.libs.dropdown,
            p = self.dirs._base.call(this, t);

        this.addClass('drop-top');

        if (t.outerWidth() < this.outerWidth() || self.small() || this.hasClass(s.mega_menu)) {
          self.adjust_pip(this,t,s,p);
        }

        if (Foundation.rtl) {
          return {left: p.left - this.outerWidth() + t.outerWidth(),
            top: p.top - this.outerHeight()};
        }

        return {left: p.left, top: p.top - this.outerHeight()};
      },
      bottom: function (t,s) {
        var self = Foundation.libs.dropdown,
            p = self.dirs._base.call(this, t);

        if (t.outerWidth() < this.outerWidth() || self.small() || this.hasClass(s.mega_menu)) {
          self.adjust_pip(this,t,s,p);
        }

        if (self.rtl) {
          return {left: p.left - this.outerWidth() + t.outerWidth(), top: p.top + t.outerHeight()};
        }

        return {left: p.left, top: p.top + t.outerHeight()};
      },
      left: function (t, s) {
        var p = Foundation.libs.dropdown.dirs._base.call(this, t);

        this.addClass('drop-left');

        return {left: p.left - this.outerWidth(), top: p.top};
      },
      right: function (t, s) {
        var p = Foundation.libs.dropdown.dirs._base.call(this, t);

        this.addClass('drop-right');

        return {left: p.left + t.outerWidth(), top: p.top};
      }
    },

    // Insert rule to style psuedo elements
    adjust_pip : function (dropdown,target,settings,position) {
      var sheet = Foundation.stylesheet,
          pip_offset_base = 8;

      if (dropdown.hasClass(settings.mega_class)) {
        pip_offset_base = position.left + (target.outerWidth()/2) - 8;
      }
      else if (this.small()) {
        pip_offset_base += position.left - 8;
      }

      this.rule_idx = sheet.cssRules.length;

      var sel_before = '.f-dropdown.open:before',
          sel_after  = '.f-dropdown.open:after',
          css_before = 'left: ' + pip_offset_base + 'px;',
          css_after  = 'left: ' + (pip_offset_base - 1) + 'px;';

      if (sheet.insertRule) {
        sheet.insertRule([sel_before, '{', css_before, '}'].join(' '), this.rule_idx);
        sheet.insertRule([sel_after, '{', css_after, '}'].join(' '), this.rule_idx + 1);
      } else {
        sheet.addRule(sel_before, css_before, this.rule_idx);
        sheet.addRule(sel_after, css_after, this.rule_idx + 1);
      }
    },

    // Remove old dropdown rule index
    clear_idx : function () {
      var sheet = Foundation.stylesheet;

      if (this.rule_idx) {
        sheet.deleteRule(this.rule_idx);
        sheet.deleteRule(this.rule_idx);
        delete this.rule_idx;
      }
    },

    small : function () {
      return matchMedia(Foundation.media_queries.small).matches &&
        !matchMedia(Foundation.media_queries.medium).matches;
    },

    off: function () {
      this.S(this.scope).off('.fndtn.dropdown');
      this.S('html, body').off('.fndtn.dropdown');
      this.S(window).off('.fndtn.dropdown');
      this.S('[data-dropdown-content]').off('.fndtn.dropdown');
    },

    reflow : function () {}
  };
}(jQuery, window, window.document));

;(function ($, window, document, undefined) {
  'use strict';

  Foundation.libs.equalizer = {
    name : 'equalizer',

    version : '5.4.5',

    settings : {
      use_tallest: true,
      before_height_change: $.noop,
      after_height_change: $.noop,
      equalize_on_stack: false
    },

    init : function (scope, method, options) {
      Foundation.inherit(this, 'image_loaded');
      this.bindings(method, options);
      this.reflow();
    },

    events : function () {
      this.S(window).off('.equalizer').on('resize.fndtn.equalizer', function(e){
        this.reflow();
      }.bind(this));
    },

    equalize: function(equalizer) {
      var isStacked = false,
          vals = equalizer.find('[' + this.attr_name() + '-watch]:visible'),
          settings = equalizer.data(this.attr_name(true)+'-init');

      if (vals.length === 0) return;
      var firstTopOffset = vals.first().offset().top;
      settings.before_height_change();
      equalizer.trigger('before-height-change').trigger('before-height-change.fndth.equalizer');
      vals.height('inherit');
      vals.each(function(){
        var el = $(this);
        if (el.offset().top !== firstTopOffset) {
          isStacked = true;
        }
      });

      if (settings.equalize_on_stack === false) {
        if (isStacked) return;
      };

      var heights = vals.map(function(){ return $(this).outerHeight(false) }).get();

      if (settings.use_tallest) {
        var max = Math.max.apply(null, heights);
        vals.css('height', max);
      } else {
        var min = Math.min.apply(null, heights);
        vals.css('height', min);
      }
      settings.after_height_change();
      equalizer.trigger('after-height-change').trigger('after-height-change.fndtn.equalizer');
    },

    reflow : function () {
      var self = this;

      this.S('[' + this.attr_name() + ']', this.scope).each(function(){
        var $eq_target = $(this);
        self.image_loaded(self.S('img', this), function(){
          self.equalize($eq_target)
        });
      });
    }
  };
})(jQuery, window, window.document);


;(function ($, window, document, undefined) {
  'use strict';

  Foundation.libs.offcanvas = {
    name : 'offcanvas',

    version : '5.4.5',

    settings : {
      open_method: 'move',
      close_on_click: false
    },

    init : function (scope, method, options) {
      this.bindings(method, options);
    },

    events : function () {
      var self = this,
          S = self.S,
          move_class = '',
          right_postfix = '',
          left_postfix = '';

      if (this.settings.open_method === 'move') {
        move_class = 'move-';
        right_postfix = 'right';
        left_postfix = 'left';
      } else if (this.settings.open_method === 'overlap_single') {
        move_class = 'offcanvas-overlap-';
        right_postfix = 'right';
        left_postfix = 'left';
      } else if (this.settings.open_method === 'overlap') {
        move_class = 'offcanvas-overlap';
      }

      S(this.scope).off('.offcanvas')
        .on('click.fndtn.offcanvas', '.left-off-canvas-toggle', function (e) {
          self.click_toggle_class(e, move_class + right_postfix);
          if (self.settings.open_method !== 'overlap'){
            S(".left-submenu").removeClass(move_class + right_postfix);
          }
          $('.left-off-canvas-toggle').attr('aria-expanded', 'true');
        })
        .on('click.fndtn.offcanvas', '.left-off-canvas-menu a', function (e) {
          var settings = self.get_settings(e);
          var parent = S(this).parent();

          if(settings.close_on_click && !parent.hasClass("has-submenu") && !parent.hasClass("back")){
            self.hide.call(self, move_class + right_postfix, self.get_wrapper(e));
            parent.parent().removeClass(move_class + right_postfix);
          }else if(S(this).parent().hasClass("has-submenu")){
            e.preventDefault();
            S(this).siblings(".left-submenu").toggleClass(move_class + right_postfix);
          }else if(parent.hasClass("back")){
            e.preventDefault();
            parent.parent().removeClass(move_class + right_postfix);
          }
          $('.left-off-canvas-toggle').attr('aria-expanded', 'true');
        })
        .on('click.fndtn.offcanvas', '.right-off-canvas-toggle', function (e) {
          self.click_toggle_class(e, move_class + left_postfix);
          if (self.settings.open_method !== 'overlap'){
            S(".right-submenu").removeClass(move_class + left_postfix);
          }
          $('.right-off-canvas-toggle').attr('aria-expanded', 'true');
        })
        .on('click.fndtn.offcanvas', '.right-off-canvas-menu a', function (e) {
          var settings = self.get_settings(e);
          var parent = S(this).parent();

          if(settings.close_on_click && !parent.hasClass("has-submenu") && !parent.hasClass("back")){
            self.hide.call(self, move_class + left_postfix, self.get_wrapper(e));
            parent.parent().removeClass(move_class + left_postfix);
          }else if(S(this).parent().hasClass("has-submenu")){
            e.preventDefault();
            S(this).siblings(".right-submenu").toggleClass(move_class + left_postfix);
          }else if(parent.hasClass("back")){
            e.preventDefault();
            parent.parent().removeClass(move_class + left_postfix);
          }
          $('.right-off-canvas-toggle').attr('aria-expanded', 'true');
        })
        .on('click.fndtn.offcanvas', '.exit-off-canvas', function (e) {
          self.click_remove_class(e, move_class + left_postfix);
          S(".right-submenu").removeClass(move_class + left_postfix);
          if (right_postfix){
            self.click_remove_class(e, move_class + right_postfix);
            S(".left-submenu").removeClass(move_class + left_postfix);
          }
          $('.right-off-canvas-toggle').attr('aria-expanded', 'true');
        })
        .on('click.fndtn.offcanvas', '.exit-off-canvas', function (e) {
          self.click_remove_class(e, move_class + left_postfix);
          $('.left-off-canvas-toggle').attr('aria-expanded', 'false');
          if (right_postfix) {
            self.click_remove_class(e, move_class + right_postfix);
            $('.right-off-canvas-toggle').attr('aria-expanded', "false");
          }
        });
    },

    toggle: function(class_name, $off_canvas) {
      $off_canvas = $off_canvas || this.get_wrapper();
      if ($off_canvas.is('.' + class_name)) {
        this.hide(class_name, $off_canvas);
      } else {
        this.show(class_name, $off_canvas);
      }
    },

    show: function(class_name, $off_canvas) {
      $off_canvas = $off_canvas || this.get_wrapper();
      $off_canvas.trigger('open').trigger('open.fndtn.offcanvas');
      $off_canvas.addClass(class_name);
    },

    hide: function(class_name, $off_canvas) {
      $off_canvas = $off_canvas || this.get_wrapper();
      $off_canvas.trigger('close').trigger('close.fndtn.offcanvas');
      $off_canvas.removeClass(class_name);
    },

    click_toggle_class: function(e, class_name) {
      e.preventDefault();
      var $off_canvas = this.get_wrapper(e);
      this.toggle(class_name, $off_canvas);
    },

    click_remove_class: function(e, class_name) {
      e.preventDefault();
      var $off_canvas = this.get_wrapper(e);
      this.hide(class_name, $off_canvas);
    },

    get_settings: function(e) {
      var offcanvas  = this.S(e.target).closest('[' + this.attr_name() + ']');
      return offcanvas.data(this.attr_name(true) + '-init') || this.settings;
    },

    get_wrapper: function(e) {
      var $off_canvas = this.S(e ? e.target : this.scope).closest('.off-canvas-wrap');

      if ($off_canvas.length === 0) {
        $off_canvas = this.S('.off-canvas-wrap');
      }
      return $off_canvas;
    },

    reflow : function () {}
  };
}(jQuery, window, window.document));

;(function ($, window, document, undefined) {
  'use strict';

  var noop = function() {};

  var Orbit = function(el, settings) {
    // Don't reinitialize plugin
    if (el.hasClass(settings.slides_container_class)) {
      return this;
    }

    var self = this,
        container,
        slides_container = el,
        number_container,
        bullets_container,
        timer_container,
        idx = 0,
        animate,
        timer,
        locked = false,
        adjust_height_after = false;


    self.slides = function() {
      return slides_container.children(settings.slide_selector);
    };

    self.slides().first().addClass(settings.active_slide_class);

    self.update_slide_number = function(index) {
      if (settings.slide_number) {
        number_container.find('span:first').text(parseInt(index)+1);
        number_container.find('span:last').text(self.slides().length);
      }
      if (settings.bullets) {
        bullets_container.children().removeClass(settings.bullets_active_class);
        $(bullets_container.children().get(index)).addClass(settings.bullets_active_class);
      }
    };

    self.update_active_link = function(index) {
      var link = $('[data-orbit-link="'+self.slides().eq(index).attr('data-orbit-slide')+'"]');
      link.siblings().removeClass(settings.bullets_active_class);
      link.addClass(settings.bullets_active_class);
    };

    self.build_markup = function() {
      slides_container.wrap('<div class="'+settings.container_class+'"></div>');
      container = slides_container.parent();
      slides_container.addClass(settings.slides_container_class);

      if (settings.stack_on_small) {
        container.addClass(settings.stack_on_small_class);
      }

      if (settings.navigation_arrows) {
        container.append($('<a href="#"><span></span></a>').addClass(settings.prev_class));
        container.append($('<a href="#"><span></span></a>').addClass(settings.next_class));
      }

      if (settings.timer) {
        timer_container = $('<div>').addClass(settings.timer_container_class);
        timer_container.append('<span>');
        timer_container.append($('<div>').addClass(settings.timer_progress_class));
        timer_container.addClass(settings.timer_paused_class);
        container.append(timer_container);
      }

      if (settings.slide_number) {
        number_container = $('<div>').addClass(settings.slide_number_class);
        number_container.append('<span></span> ' + settings.slide_number_text + ' <span></span>');
        container.append(number_container);
      }

      if (settings.bullets) {
        bullets_container = $('<ol>').addClass(settings.bullets_container_class);
        container.append(bullets_container);
        bullets_container.wrap('<div class="orbit-bullets-container"></div>');
        self.slides().each(function(idx, el) {
          var bullet = $('<li>').attr('data-orbit-slide', idx).on('click', self.link_bullet);;
          bullets_container.append(bullet);
        });
      }

    };

    self._goto = function(next_idx, start_timer) {
      // if (locked) {return false;}
      if (next_idx === idx) {return false;}
      if (typeof timer === 'object') {timer.restart();}
      var slides = self.slides();

      var dir = 'next';
      locked = true;
      if (next_idx < idx) {dir = 'prev';}
      if (next_idx >= slides.length) {
        if (!settings.circular) return false;
        next_idx = 0;
      } else if (next_idx < 0) {
        if (!settings.circular) return false;
        next_idx = slides.length - 1;
      }

      var current = $(slides.get(idx));
      var next = $(slides.get(next_idx));

      current.css('zIndex', 2);
      current.removeClass(settings.active_slide_class);
      next.css('zIndex', 4).addClass(settings.active_slide_class);

      slides_container.trigger('before-slide-change.fndtn.orbit');
      settings.before_slide_change();
      self.update_active_link(next_idx);

      var callback = function() {
        var unlock = function() {
          idx = next_idx;
          locked = false;
          if (start_timer === true) {timer = self.create_timer(); timer.start();}
          self.update_slide_number(idx);
          slides_container.trigger('after-slide-change.fndtn.orbit',[{slide_number: idx, total_slides: slides.length}]);
          settings.after_slide_change(idx, slides.length);
        };
        if (slides_container.height() != next.height() && settings.variable_height) {
          slides_container.animate({'height': next.height()}, 250, 'linear', unlock);
        } else {
          unlock();
        }
      };

      if (slides.length === 1) {callback(); return false;}

      var start_animation = function() {
        if (dir === 'next') {animate.next(current, next, callback);}
        if (dir === 'prev') {animate.prev(current, next, callback);}
      };

      if (next.height() > slides_container.height() && settings.variable_height) {
        slides_container.animate({'height': next.height()}, 250, 'linear', start_animation);
      } else {
        start_animation();
      }
    };

    self.next = function(e) {
      e.stopImmediatePropagation();
      e.preventDefault();
      self._goto(idx + 1);
    };

    self.prev = function(e) {
      e.stopImmediatePropagation();
      e.preventDefault();
      self._goto(idx - 1);
    };

    self.link_custom = function(e) {
      e.preventDefault();
      var link = $(this).attr('data-orbit-link');
      if ((typeof link === 'string') && (link = $.trim(link)) != "") {
        var slide = container.find('[data-orbit-slide='+link+']');
        if (slide.index() != -1) {self._goto(slide.index());}
      }
    };

    self.link_bullet = function(e) {
      var index = $(this).attr('data-orbit-slide');
      if ((typeof index === 'string') && (index = $.trim(index)) != "") {
        if(isNaN(parseInt(index)))
        {
          var slide = container.find('[data-orbit-slide='+index+']');
          if (slide.index() != -1) {self._goto(slide.index() + 1);}
        }
        else
        {
          self._goto(parseInt(index));
        }
      }

    }

    self.timer_callback = function() {
      self._goto(idx + 1, true);
    }

    self.compute_dimensions = function() {
      var current = $(self.slides().get(idx));
      var h = current.height();
      if (!settings.variable_height) {
        self.slides().each(function(){
          if ($(this).height() > h) { h = $(this).height(); }
        });
      }
      slides_container.height(h);
    };

    self.create_timer = function() {
      var t = new Timer(
        container.find('.'+settings.timer_container_class),
        settings,
        self.timer_callback
      );
      return t;
    };

    self.stop_timer = function() {
      if (typeof timer === 'object') timer.stop();
    };

    self.toggle_timer = function() {
      var t = container.find('.'+settings.timer_container_class);
      if (t.hasClass(settings.timer_paused_class)) {
        if (typeof timer === 'undefined') {timer = self.create_timer();}
        timer.start();
      }
      else {
        if (typeof timer === 'object') {timer.stop();}
      }
    };

    self.init = function() {
      self.build_markup();
      if (settings.timer) {
        timer = self.create_timer();
        Foundation.utils.image_loaded(this.slides().children('img'), timer.start);
      }
      animate = new FadeAnimation(settings, slides_container);
      if (settings.animation === 'slide')
        animate = new SlideAnimation(settings, slides_container);

      container.on('click', '.'+settings.next_class, self.next);
      container.on('click', '.'+settings.prev_class, self.prev);

      if (settings.next_on_click) {
        container.on('click', '.'+settings.slides_container_class+' [data-orbit-slide]', self.link_bullet);
      }

      container.on('click', self.toggle_timer);
      if (settings.swipe) {
        container.on('touchstart.fndtn.orbit', function(e) {
          if (!e.touches) {e = e.originalEvent;}
          var data = {
            start_page_x: e.touches[0].pageX,
            start_page_y: e.touches[0].pageY,
            start_time: (new Date()).getTime(),
            delta_x: 0,
            is_scrolling: undefined
          };
          container.data('swipe-transition', data);
          e.stopPropagation();
        })
        .on('touchmove.fndtn.orbit', function(e) {
          if (!e.touches) { e = e.originalEvent; }
          // Ignore pinch/zoom events
          if(e.touches.length > 1 || e.scale && e.scale !== 1) return;

          var data = container.data('swipe-transition');
          if (typeof data === 'undefined') {data = {};}

          data.delta_x = e.touches[0].pageX - data.start_page_x;

          if ( typeof data.is_scrolling === 'undefined') {
            data.is_scrolling = !!( data.is_scrolling || Math.abs(data.delta_x) < Math.abs(e.touches[0].pageY - data.start_page_y) );
          }

          if (!data.is_scrolling && !data.active) {
            e.preventDefault();
            var direction = (data.delta_x < 0) ? (idx+1) : (idx-1);
            data.active = true;
            self._goto(direction);
          }
        })
        .on('touchend.fndtn.orbit', function(e) {
          container.data('swipe-transition', {});
          e.stopPropagation();
        })
      }
      container.on('mouseenter.fndtn.orbit', function(e) {
        if (settings.timer && settings.pause_on_hover) {
          self.stop_timer();
        }
      })
      .on('mouseleave.fndtn.orbit', function(e) {
        if (settings.timer && settings.resume_on_mouseout) {
          timer.start();
        }
      });

      $(document).on('click', '[data-orbit-link]', self.link_custom);
      $(window).on('load resize', self.compute_dimensions);
      Foundation.utils.image_loaded(this.slides().children('img'), self.compute_dimensions);
      Foundation.utils.image_loaded(this.slides().children('img'), function() {
        container.prev('.'+settings.preloader_class).css('display', 'none');
        self.update_slide_number(0);
        self.update_active_link(0);
        slides_container.trigger('ready.fndtn.orbit');
      });
    };

    self.init();
  };

  var Timer = function(el, settings, callback) {
    var self = this,
        duration = settings.timer_speed,
        progress = el.find('.'+settings.timer_progress_class),
        start,
        timeout,
        left = -1;

    this.update_progress = function(w) {
      var new_progress = progress.clone();
      new_progress.attr('style', '');
      new_progress.css('width', w+'%');
      progress.replaceWith(new_progress);
      progress = new_progress;
    };

    this.restart = function() {
      clearTimeout(timeout);
      el.addClass(settings.timer_paused_class);
      left = -1;
      self.update_progress(0);
    };

    this.start = function() {
      if (!el.hasClass(settings.timer_paused_class)) {return true;}
      left = (left === -1) ? duration : left;
      el.removeClass(settings.timer_paused_class);
      start = new Date().getTime();
      progress.animate({'width': '100%'}, left, 'linear');
      timeout = setTimeout(function() {
        self.restart();
        callback();
      }, left);
      el.trigger('timer-started.fndtn.orbit')
    };

    this.stop = function() {
      if (el.hasClass(settings.timer_paused_class)) {return true;}
      clearTimeout(timeout);
      el.addClass(settings.timer_paused_class);
      var end = new Date().getTime();
      left = left - (end - start);
      var w = 100 - ((left / duration) * 100);
      self.update_progress(w);
      el.trigger('timer-stopped.fndtn.orbit');
    };
  };

  var SlideAnimation = function(settings, container) {
    var duration = settings.animation_speed;
    var is_rtl = ($('html[dir=rtl]').length === 1);
    var margin = is_rtl ? 'marginRight' : 'marginLeft';
    var animMargin = {};
    animMargin[margin] = '0%';

    this.next = function(current, next, callback) {
      current.animate({marginLeft:'-100%'}, duration);
      next.animate(animMargin, duration, function() {
        current.css(margin, '100%');
        callback();
      });
    };

    this.prev = function(current, prev, callback) {
      current.animate({marginLeft:'100%'}, duration);
      prev.css(margin, '-100%');
      prev.animate(animMargin, duration, function() {
        current.css(margin, '100%');
        callback();
      });
    };
  };

  var FadeAnimation = function(settings, container) {
    var duration = settings.animation_speed;
    var is_rtl = ($('html[dir=rtl]').length === 1);
    var margin = is_rtl ? 'marginRight' : 'marginLeft';

    this.next = function(current, next, callback) {
      next.css({'margin':'0%', 'opacity':'0.01'});
      next.animate({'opacity':'1'}, duration, 'linear', function() {
        current.css('margin', '100%');
        callback();
      });
    };

    this.prev = function(current, prev, callback) {
      prev.css({'margin':'0%', 'opacity':'0.01'});
      prev.animate({'opacity':'1'}, duration, 'linear', function() {
        current.css('margin', '100%');
        callback();
      });
    };
  };


  Foundation.libs = Foundation.libs || {};

  Foundation.libs.orbit = {
    name: 'orbit',

    version: '5.4.5',

    settings: {
      animation: 'slide',
      timer_speed: 10000,
      pause_on_hover: true,
      resume_on_mouseout: false,
      next_on_click: true,
      animation_speed: 500,
      stack_on_small: false,
      navigation_arrows: true,
      slide_number: true,
      slide_number_text: 'of',
      container_class: 'orbit-container',
      stack_on_small_class: 'orbit-stack-on-small',
      next_class: 'orbit-next',
      prev_class: 'orbit-prev',
      timer_container_class: 'orbit-timer',
      timer_paused_class: 'paused',
      timer_progress_class: 'orbit-progress',
      slides_container_class: 'orbit-slides-container',
      preloader_class: 'preloader',
      slide_selector: '*',
      bullets_container_class: 'orbit-bullets',
      bullets_active_class: 'active',
      slide_number_class: 'orbit-slide-number',
      caption_class: 'orbit-caption',
      active_slide_class: 'active',
      orbit_transition_class: 'orbit-transitioning',
      bullets: true,
      circular: true,
      timer: true,
      variable_height: false,
      swipe: true,
      before_slide_change: noop,
      after_slide_change: noop
    },

    init : function (scope, method, options) {
      var self = this;
      this.bindings(method, options);
    },

    events : function (instance) {
      var orbit_instance = new Orbit(this.S(instance), this.S(instance).data('orbit-init'));
      this.S(instance).data(this.name + '-instance', orbit_instance);
    },

    reflow : function () {
      var self = this;

      if (self.S(self.scope).is('[data-orbit]')) {
        var $el = self.S(self.scope);
        var instance = $el.data(self.name + '-instance');
        instance.compute_dimensions();
      } else {
        self.S('[data-orbit]', self.scope).each(function(idx, el) {
          var $el = self.S(el);
          var opts = self.data_options($el);
          var instance = $el.data(self.name + '-instance');
          instance.compute_dimensions();
        });
      }
    }
  };


}(jQuery, window, window.document));

;(function ($, window, document, undefined) {
  'use strict';

  Foundation.libs.topbar = {
    name : 'topbar',

    version: '5.4.5',

    settings : {
      index : 0,
      sticky_class : 'sticky',
      custom_back_text: true,
      back_text: 'Back',
      mobile_show_parent_link: true,
      is_hover: true,
      scrolltop : true, // jump to top when sticky nav menu toggle is clicked
      sticky_on : 'all'
    },

    init : function (section, method, options) {
      Foundation.inherit(this, 'add_custom_rule register_media throttle');
      var self = this;

      self.register_media('topbar', 'foundation-mq-topbar');

      this.bindings(method, options);

      self.S('[' + this.attr_name() + ']', this.scope).each(function () {
        var topbar = $(this),
            settings = topbar.data(self.attr_name(true) + '-init'),
            section = self.S('section, .top-bar-section', this);
        topbar.data('index', 0);
        var topbarContainer = topbar.parent();
        if (topbarContainer.hasClass('fixed') || self.is_sticky(topbar, topbarContainer, settings) ) {
          self.settings.sticky_class = settings.sticky_class;
          self.settings.sticky_topbar = topbar;
          topbar.data('height', topbarContainer.outerHeight());
          topbar.data('stickyoffset', topbarContainer.offset().top);
        } else {
          topbar.data('height', topbar.outerHeight());
        }

        if (!settings.assembled) {
          self.assemble(topbar);
        }

        if (settings.is_hover) {
          self.S('.has-dropdown', topbar).addClass('not-click');
        } else {
          self.S('.has-dropdown', topbar).removeClass('not-click');
        }

        // Pad body when sticky (scrolled) or fixed.
        self.add_custom_rule('.f-topbar-fixed { padding-top: ' + topbar.data('height') + 'px }');

        if (topbarContainer.hasClass('fixed')) {
          self.S('body').addClass('f-topbar-fixed');
        }
      });

    },

    is_sticky: function (topbar, topbarContainer, settings) {
      var sticky = topbarContainer.hasClass(settings.sticky_class);

      if (sticky && settings.sticky_on === 'all') {
        return true;
      } else if (sticky && this.small() && settings.sticky_on === 'small') {
        return (matchMedia(Foundation.media_queries.small).matches && !matchMedia(Foundation.media_queries.medium).matches &&
            !matchMedia(Foundation.media_queries.large).matches);
        //return true;
      } else if (sticky && this.medium() && settings.sticky_on === 'medium') {
        return (matchMedia(Foundation.media_queries.small).matches && matchMedia(Foundation.media_queries.medium).matches &&
            !matchMedia(Foundation.media_queries.large).matches);
        //return true;
      } else if(sticky && this.large() && settings.sticky_on === 'large') {
        return (matchMedia(Foundation.media_queries.small).matches && matchMedia(Foundation.media_queries.medium).matches &&
            matchMedia(Foundation.media_queries.large).matches);
        //return true;
      }

      return false;
    },

    toggle: function (toggleEl) {
      var self = this,
          topbar;

      if (toggleEl) {
        topbar = self.S(toggleEl).closest('[' + this.attr_name() + ']');
      } else {
        topbar = self.S('[' + this.attr_name() + ']');
      }

      var settings = topbar.data(this.attr_name(true) + '-init');

      var section = self.S('section, .top-bar-section', topbar);

      if (self.breakpoint()) {
        if (!self.rtl) {
          section.css({left: '0%'});
          $('>.name', section).css({left: '100%'});
        } else {
          section.css({right: '0%'});
          $('>.name', section).css({right: '100%'});
        }

        self.S('li.moved', section).removeClass('moved');
        topbar.data('index', 0);

        topbar
          .toggleClass('expanded')
          .css('height', '');
      }

      if (settings.scrolltop) {
        if (!topbar.hasClass('expanded')) {
          if (topbar.hasClass('fixed')) {
            topbar.parent().addClass('fixed');
            topbar.removeClass('fixed');
            self.S('body').addClass('f-topbar-fixed');
          }
        } else if (topbar.parent().hasClass('fixed')) {
          if (settings.scrolltop) {
            topbar.parent().removeClass('fixed');
            topbar.addClass('fixed');
            self.S('body').removeClass('f-topbar-fixed');

            window.scrollTo(0,0);
          } else {
            topbar.parent().removeClass('expanded');
          }
        }
      } else {
        if (self.is_sticky(topbar, topbar.parent(), settings)) {
          topbar.parent().addClass('fixed');
        }

        if (topbar.parent().hasClass('fixed')) {
          if (!topbar.hasClass('expanded')) {
            topbar.removeClass('fixed');
            topbar.parent().removeClass('expanded');
            self.update_sticky_positioning();
          } else {
            topbar.addClass('fixed');
            topbar.parent().addClass('expanded');
            self.S('body').addClass('f-topbar-fixed');
          }
        }
      }
    },

    timer : null,

    events : function (bar) {
      var self = this,
          S = this.S;

      S(this.scope)
        .off('.topbar')
        .on('click.fndtn.topbar', '[' + this.attr_name() + '] .toggle-topbar', function (e) {
          e.preventDefault();
          self.toggle(this);
        })
        .on('click.fndtn.topbar','.top-bar .top-bar-section li a[href^="#"],[' + this.attr_name() + '] .top-bar-section li a[href^="#"]',function (e) {
            var li = $(this).closest('li');
            if(self.breakpoint() && !li.hasClass('back') && !li.hasClass('has-dropdown'))
            {
            self.toggle();
            }
        })
        .on('click.fndtn.topbar', '[' + this.attr_name() + '] li.has-dropdown', function (e) {
          var li = S(this),
              target = S(e.target),
              topbar = li.closest('[' + self.attr_name() + ']'),
              settings = topbar.data(self.attr_name(true) + '-init');

          if(target.data('revealId')) {
            self.toggle();
            return;
          }

          if (self.breakpoint()) return;
          if (settings.is_hover && !Modernizr.touch) return;

          e.stopImmediatePropagation();

          if (li.hasClass('hover')) {
            li
              .removeClass('hover')
              .find('li')
              .removeClass('hover');

            li.parents('li.hover')
              .removeClass('hover');
          } else {
            li.addClass('hover');

            $(li).siblings().removeClass('hover');

            if (target[0].nodeName === 'A' && target.parent().hasClass('has-dropdown')) {
              e.preventDefault();
            }
          }
        })
        .on('click.fndtn.topbar', '[' + this.attr_name() + '] .has-dropdown>a', function (e) {
          if (self.breakpoint()) {

            e.preventDefault();

            var $this = S(this),
                topbar = $this.closest('[' + self.attr_name() + ']'),
                section = topbar.find('section, .top-bar-section'),
                dropdownHeight = $this.next('.dropdown').outerHeight(),
                $selectedLi = $this.closest('li');

            topbar.data('index', topbar.data('index') + 1);
            $selectedLi.addClass('moved');

            if (!self.rtl) {
              section.css({left: -(100 * topbar.data('index')) + '%'});
              section.find('>.name').css({left: 100 * topbar.data('index') + '%'});
            } else {
              section.css({right: -(100 * topbar.data('index')) + '%'});
              section.find('>.name').css({right: 100 * topbar.data('index') + '%'});
            }

            topbar.css('height', $this.siblings('ul').outerHeight(true) + topbar.data('height'));
          }
        });

      S(window).off(".topbar").on("resize.fndtn.topbar", self.throttle(function() {
          self.resize.call(self);
      }, 50)).trigger("resize").trigger("resize.fndtn.topbar").load(function(){
          // Ensure that the offset is calculated after all of the pages resources have loaded
          S(this).trigger("resize.fndtn.topbar");
      });

      S('body').off('.topbar').on('click.fndtn.topbar', function (e) {
        var parent = S(e.target).closest('li').closest('li.hover');

        if (parent.length > 0) {
          return;
        }

        S('[' + self.attr_name() + '] li.hover').removeClass('hover');
      });

      // Go up a level on Click
      S(this.scope).on('click.fndtn.topbar', '[' + this.attr_name() + '] .has-dropdown .back', function (e) {
        e.preventDefault();

        var $this = S(this),
            topbar = $this.closest('[' + self.attr_name() + ']'),
            section = topbar.find('section, .top-bar-section'),
            settings = topbar.data(self.attr_name(true) + '-init'),
            $movedLi = $this.closest('li.moved'),
            $previousLevelUl = $movedLi.parent();

        topbar.data('index', topbar.data('index') - 1);

        if (!self.rtl) {
          section.css({left: -(100 * topbar.data('index')) + '%'});
          section.find('>.name').css({left: 100 * topbar.data('index') + '%'});
        } else {
          section.css({right: -(100 * topbar.data('index')) + '%'});
          section.find('>.name').css({right: 100 * topbar.data('index') + '%'});
        }

        if (topbar.data('index') === 0) {
          topbar.css('height', '');
        } else {
          topbar.css('height', $previousLevelUl.outerHeight(true) + topbar.data('height'));
        }

        setTimeout(function () {
          $movedLi.removeClass('moved');
        }, 300);
      });

      // Show dropdown menus when their items are focused
      S(this.scope).find('.dropdown a')
        .focus(function() {
          $(this).parents('.has-dropdown').addClass('hover');
        })
        .blur(function() {
          $(this).parents('.has-dropdown').removeClass('hover');
        });
    },

    resize : function () {
      var self = this;
      self.S('[' + this.attr_name() + ']').each(function () {
        var topbar = self.S(this),
            settings = topbar.data(self.attr_name(true) + '-init');

        var stickyContainer = topbar.parent('.' + self.settings.sticky_class);
        var stickyOffset;

        if (!self.breakpoint()) {
          var doToggle = topbar.hasClass('expanded');
          topbar
            .css('height', '')
            .removeClass('expanded')
            .find('li')
            .removeClass('hover');

            if(doToggle) {
              self.toggle(topbar);
            }
        }

        if(self.is_sticky(topbar, stickyContainer, settings)) {
          if(stickyContainer.hasClass('fixed')) {
            // Remove the fixed to allow for correct calculation of the offset.
            stickyContainer.removeClass('fixed');

            stickyOffset = stickyContainer.offset().top;
            if(self.S(document.body).hasClass('f-topbar-fixed')) {
              stickyOffset -= topbar.data('height');
            }

            topbar.data('stickyoffset', stickyOffset);
            stickyContainer.addClass('fixed');
          } else {
            stickyOffset = stickyContainer.offset().top;
            topbar.data('stickyoffset', stickyOffset);
          }
        }

      });
    },

    breakpoint : function () {
      return !matchMedia(Foundation.media_queries['topbar']).matches;
    },

    small : function () {
      return matchMedia(Foundation.media_queries['small']).matches;
    },

    medium : function () {
      return matchMedia(Foundation.media_queries['medium']).matches;
    },

    large : function () {
      return matchMedia(Foundation.media_queries['large']).matches;
    },

    assemble : function (topbar) {
      var self = this,
          settings = topbar.data(this.attr_name(true) + '-init'),
          section = self.S('section, .top-bar-section', topbar);

      // Pull element out of the DOM for manipulation
      section.detach();

      self.S('.has-dropdown>a', section).each(function () {
        var $link = self.S(this),
            $dropdown = $link.siblings('.dropdown'),
            url = $link.attr('href'),
            $titleLi;


        if (!$dropdown.find('.title.back').length) {

          if (settings.mobile_show_parent_link == true && url) {
            $titleLi = $('<li class="title back js-generated"><h5><a href="javascript:void(0)"></a></h5></li><li class="parent-link show-for-small"><a class="parent-link js-generated" href="' + url + '">' + $link.html() +'</a></li>');
          } else {
            $titleLi = $('<li class="title back js-generated"><h5><a href="javascript:void(0)"></a></h5>');
          }

          // Copy link to subnav
          if (settings.custom_back_text == true) {
            $('h5>a', $titleLi).html(settings.back_text);
          } else {
            $('h5>a', $titleLi).html('&laquo; ' + $link.html());
          }
          $dropdown.prepend($titleLi);
        }
      });

      // Put element back in the DOM
      section.appendTo(topbar);

      // check for sticky
      this.sticky();

      this.assembled(topbar);
    },

    assembled : function (topbar) {
      topbar.data(this.attr_name(true), $.extend({}, topbar.data(this.attr_name(true)), {assembled: true}));
    },

    height : function (ul) {
      var total = 0,
          self = this;

      $('> li', ul).each(function () {
        total += self.S(this).outerHeight(true);
      });

      return total;
    },

    sticky : function () {
      var self = this;

      this.S(window).on('scroll', function() {
        self.update_sticky_positioning();
      });
    },

    update_sticky_positioning: function() {
      var klass = '.' + this.settings.sticky_class,
          $window = this.S(window),
          self = this;

      if (self.settings.sticky_topbar && self.is_sticky(this.settings.sticky_topbar,this.settings.sticky_topbar.parent(), this.settings)) {
        var distance = this.settings.sticky_topbar.data('stickyoffset');
        if (!self.S(klass).hasClass('expanded')) {
          if ($window.scrollTop() > (distance)) {
            if (!self.S(klass).hasClass('fixed')) {
              self.S(klass).addClass('fixed');
              self.S('body').addClass('f-topbar-fixed');
            }
          } else if ($window.scrollTop() <= distance) {
            if (self.S(klass).hasClass('fixed')) {
              self.S(klass).removeClass('fixed');
              self.S('body').removeClass('f-topbar-fixed');
            }
          }
        }
      }
    },

    off : function () {
      this.S(this.scope).off('.fndtn.topbar');
      this.S(window).off('.fndtn.topbar');
    },

    reflow : function () {}
  };
}(jQuery, window, window.document));

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVybml6ci5qcyIsImZvdW5kYXRpb24uanMiLCJmb3VuZGF0aW9uLmRyb3Bkb3duLmpzIiwiZm91bmRhdGlvbi5lcXVhbGl6ZXIuanMiLCJmb3VuZGF0aW9uLm9mZmNhbnZhcy5qcyIsImZvdW5kYXRpb24ub3JiaXQuanMiLCJmb3VuZGF0aW9uLnRvcGJhci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5M0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsVUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeGRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoic2NyaXB0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyohXG4gKiBNb2Rlcm5penIgdjIuOC4zXG4gKiB3d3cubW9kZXJuaXpyLmNvbVxuICpcbiAqIENvcHlyaWdodCAoYykgRmFydWsgQXRlcywgUGF1bCBJcmlzaCwgQWxleCBTZXh0b25cbiAqIEF2YWlsYWJsZSB1bmRlciB0aGUgQlNEIGFuZCBNSVQgbGljZW5zZXM6IHd3dy5tb2Rlcm5penIuY29tL2xpY2Vuc2UvXG4gKi9cblxuLypcbiAqIE1vZGVybml6ciB0ZXN0cyB3aGljaCBuYXRpdmUgQ1NTMyBhbmQgSFRNTDUgZmVhdHVyZXMgYXJlIGF2YWlsYWJsZSBpblxuICogdGhlIGN1cnJlbnQgVUEgYW5kIG1ha2VzIHRoZSByZXN1bHRzIGF2YWlsYWJsZSB0byB5b3UgaW4gdHdvIHdheXM6XG4gKiBhcyBwcm9wZXJ0aWVzIG9uIGEgZ2xvYmFsIE1vZGVybml6ciBvYmplY3QsIGFuZCBhcyBjbGFzc2VzIG9uIHRoZVxuICogPGh0bWw+IGVsZW1lbnQuIFRoaXMgaW5mb3JtYXRpb24gYWxsb3dzIHlvdSB0byBwcm9ncmVzc2l2ZWx5IGVuaGFuY2VcbiAqIHlvdXIgcGFnZXMgd2l0aCBhIGdyYW51bGFyIGxldmVsIG9mIGNvbnRyb2wgb3ZlciB0aGUgZXhwZXJpZW5jZS5cbiAqXG4gKiBNb2Rlcm5penIgaGFzIGFuIG9wdGlvbmFsIChub3QgaW5jbHVkZWQpIGNvbmRpdGlvbmFsIHJlc291cmNlIGxvYWRlclxuICogY2FsbGVkIE1vZGVybml6ci5sb2FkKCksIGJhc2VkIG9uIFllcG5vcGUuanMgKHllcG5vcGVqcy5jb20pLlxuICogVG8gZ2V0IGEgYnVpbGQgdGhhdCBpbmNsdWRlcyBNb2Rlcm5penIubG9hZCgpLCBhcyB3ZWxsIGFzIGNob29zaW5nXG4gKiB3aGljaCB0ZXN0cyB0byBpbmNsdWRlLCBnbyB0byB3d3cubW9kZXJuaXpyLmNvbS9kb3dubG9hZC9cbiAqXG4gKiBBdXRob3JzICAgICAgICBGYXJ1ayBBdGVzLCBQYXVsIElyaXNoLCBBbGV4IFNleHRvblxuICogQ29udHJpYnV0b3JzICAgUnlhbiBTZWRkb24sIEJlbiBBbG1hblxuICovXG5cbndpbmRvdy5Nb2Rlcm5penIgPSAoZnVuY3Rpb24oIHdpbmRvdywgZG9jdW1lbnQsIHVuZGVmaW5lZCApIHtcblxuICAgIHZhciB2ZXJzaW9uID0gJzIuOC4zJyxcblxuICAgIE1vZGVybml6ciA9IHt9LFxuXG4gICAgLyo+PmNzc2NsYXNzZXMqL1xuICAgIC8vIG9wdGlvbiBmb3IgZW5hYmxpbmcgdGhlIEhUTUwgY2xhc3NlcyB0byBiZSBhZGRlZFxuICAgIGVuYWJsZUNsYXNzZXMgPSB0cnVlLFxuICAgIC8qPj5jc3NjbGFzc2VzKi9cblxuICAgIGRvY0VsZW1lbnQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgb3VyIFwibW9kZXJuaXpyXCIgZWxlbWVudCB0aGF0IHdlIGRvIG1vc3QgZmVhdHVyZSB0ZXN0cyBvbi5cbiAgICAgKi9cbiAgICBtb2QgPSAnbW9kZXJuaXpyJyxcbiAgICBtb2RFbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChtb2QpLFxuICAgIG1TdHlsZSA9IG1vZEVsZW0uc3R5bGUsXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgdGhlIGlucHV0IGVsZW1lbnQgZm9yIHZhcmlvdXMgV2ViIEZvcm1zIGZlYXR1cmUgdGVzdHMuXG4gICAgICovXG4gICAgaW5wdXRFbGVtIC8qPj5pbnB1dGVsZW0qLyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0JykgLyo+PmlucHV0ZWxlbSovICxcblxuICAgIC8qPj5zbWlsZSovXG4gICAgc21pbGUgPSAnOiknLFxuICAgIC8qPj5zbWlsZSovXG5cbiAgICB0b1N0cmluZyA9IHt9LnRvU3RyaW5nLFxuXG4gICAgLy8gVE9ETyA6OiBtYWtlIHRoZSBwcmVmaXhlcyBtb3JlIGdyYW51bGFyXG4gICAgLyo+PnByZWZpeGVzKi9cbiAgICAvLyBMaXN0IG9mIHByb3BlcnR5IHZhbHVlcyB0byBzZXQgZm9yIGNzcyB0ZXN0cy4gU2VlIHRpY2tldCAjMjFcbiAgICBwcmVmaXhlcyA9ICcgLXdlYmtpdC0gLW1vei0gLW8tIC1tcy0gJy5zcGxpdCgnICcpLFxuICAgIC8qPj5wcmVmaXhlcyovXG5cbiAgICAvKj4+ZG9tcHJlZml4ZXMqL1xuICAgIC8vIEZvbGxvd2luZyBzcGVjIGlzIHRvIGV4cG9zZSB2ZW5kb3Itc3BlY2lmaWMgc3R5bGUgcHJvcGVydGllcyBhczpcbiAgICAvLyAgIGVsZW0uc3R5bGUuV2Via2l0Qm9yZGVyUmFkaXVzXG4gICAgLy8gYW5kIHRoZSBmb2xsb3dpbmcgd291bGQgYmUgaW5jb3JyZWN0OlxuICAgIC8vICAgZWxlbS5zdHlsZS53ZWJraXRCb3JkZXJSYWRpdXNcblxuICAgIC8vIFdlYmtpdCBnaG9zdHMgdGhlaXIgcHJvcGVydGllcyBpbiBsb3dlcmNhc2UgYnV0IE9wZXJhICYgTW96IGRvIG5vdC5cbiAgICAvLyBNaWNyb3NvZnQgdXNlcyBhIGxvd2VyY2FzZSBgbXNgIGluc3RlYWQgb2YgdGhlIGNvcnJlY3QgYE1zYCBpbiBJRTgrXG4gICAgLy8gICBlcmlrLmVhZS5uZXQvYXJjaGl2ZXMvMjAwOC8wMy8xMC8yMS40OC4xMC9cblxuICAgIC8vIE1vcmUgaGVyZTogZ2l0aHViLmNvbS9Nb2Rlcm5penIvTW9kZXJuaXpyL2lzc3Vlcy9pc3N1ZS8yMVxuICAgIG9tUHJlZml4ZXMgPSAnV2Via2l0IE1veiBPIG1zJyxcblxuICAgIGNzc29tUHJlZml4ZXMgPSBvbVByZWZpeGVzLnNwbGl0KCcgJyksXG5cbiAgICBkb21QcmVmaXhlcyA9IG9tUHJlZml4ZXMudG9Mb3dlckNhc2UoKS5zcGxpdCgnICcpLFxuICAgIC8qPj5kb21wcmVmaXhlcyovXG5cbiAgICAvKj4+bnMqL1xuICAgIG5zID0geydzdmcnOiAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnfSxcbiAgICAvKj4+bnMqL1xuXG4gICAgdGVzdHMgPSB7fSxcbiAgICBpbnB1dHMgPSB7fSxcbiAgICBhdHRycyA9IHt9LFxuXG4gICAgY2xhc3NlcyA9IFtdLFxuXG4gICAgc2xpY2UgPSBjbGFzc2VzLnNsaWNlLFxuXG4gICAgZmVhdHVyZU5hbWUsIC8vIHVzZWQgaW4gdGVzdGluZyBsb29wXG5cblxuICAgIC8qPj50ZXN0c3R5bGVzKi9cbiAgICAvLyBJbmplY3QgZWxlbWVudCB3aXRoIHN0eWxlIGVsZW1lbnQgYW5kIHNvbWUgQ1NTIHJ1bGVzXG4gICAgaW5qZWN0RWxlbWVudFdpdGhTdHlsZXMgPSBmdW5jdGlvbiggcnVsZSwgY2FsbGJhY2ssIG5vZGVzLCB0ZXN0bmFtZXMgKSB7XG5cbiAgICAgIHZhciBzdHlsZSwgcmV0LCBub2RlLCBkb2NPdmVyZmxvdyxcbiAgICAgICAgICBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcbiAgICAgICAgICAvLyBBZnRlciBwYWdlIGxvYWQgaW5qZWN0aW5nIGEgZmFrZSBib2R5IGRvZXNuJ3Qgd29yayBzbyBjaGVjayBpZiBib2R5IGV4aXN0c1xuICAgICAgICAgIGJvZHkgPSBkb2N1bWVudC5ib2R5LFxuICAgICAgICAgIC8vIElFNiBhbmQgNyB3b24ndCByZXR1cm4gb2Zmc2V0V2lkdGggb3Igb2Zmc2V0SGVpZ2h0IHVubGVzcyBpdCdzIGluIHRoZSBib2R5IGVsZW1lbnQsIHNvIHdlIGZha2UgaXQuXG4gICAgICAgICAgZmFrZUJvZHkgPSBib2R5IHx8IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2JvZHknKTtcblxuICAgICAgaWYgKCBwYXJzZUludChub2RlcywgMTApICkge1xuICAgICAgICAgIC8vIEluIG9yZGVyIG5vdCB0byBnaXZlIGZhbHNlIHBvc2l0aXZlcyB3ZSBjcmVhdGUgYSBub2RlIGZvciBlYWNoIHRlc3RcbiAgICAgICAgICAvLyBUaGlzIGFsc28gYWxsb3dzIHRoZSBtZXRob2QgdG8gc2NhbGUgZm9yIHVuc3BlY2lmaWVkIHVzZXNcbiAgICAgICAgICB3aGlsZSAoIG5vZGVzLS0gKSB7XG4gICAgICAgICAgICAgIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgICAgbm9kZS5pZCA9IHRlc3RuYW1lcyA/IHRlc3RuYW1lc1tub2Rlc10gOiBtb2QgKyAobm9kZXMgKyAxKTtcbiAgICAgICAgICAgICAgZGl2LmFwcGVuZENoaWxkKG5vZGUpO1xuICAgICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gPHN0eWxlPiBlbGVtZW50cyBpbiBJRTYtOSBhcmUgY29uc2lkZXJlZCAnTm9TY29wZScgZWxlbWVudHMgYW5kIHRoZXJlZm9yZSB3aWxsIGJlIHJlbW92ZWRcbiAgICAgIC8vIHdoZW4gaW5qZWN0ZWQgd2l0aCBpbm5lckhUTUwuIFRvIGdldCBhcm91bmQgdGhpcyB5b3UgbmVlZCB0byBwcmVwZW5kIHRoZSAnTm9TY29wZScgZWxlbWVudFxuICAgICAgLy8gd2l0aCBhICdzY29wZWQnIGVsZW1lbnQsIGluIG91ciBjYXNlIHRoZSBzb2Z0LWh5cGhlbiBlbnRpdHkgYXMgaXQgd29uJ3QgbWVzcyB3aXRoIG91ciBtZWFzdXJlbWVudHMuXG4gICAgICAvLyBtc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9tczUzMzg5NyUyOFZTLjg1JTI5LmFzcHhcbiAgICAgIC8vIERvY3VtZW50cyBzZXJ2ZWQgYXMgeG1sIHdpbGwgdGhyb3cgaWYgdXNpbmcgJnNoeTsgc28gdXNlIHhtbCBmcmllbmRseSBlbmNvZGVkIHZlcnNpb24uIFNlZSBpc3N1ZSAjMjc3XG4gICAgICBzdHlsZSA9IFsnJiMxNzM7JywnPHN0eWxlIGlkPVwicycsIG1vZCwgJ1wiPicsIHJ1bGUsICc8L3N0eWxlPiddLmpvaW4oJycpO1xuICAgICAgZGl2LmlkID0gbW9kO1xuICAgICAgLy8gSUU2IHdpbGwgZmFsc2UgcG9zaXRpdmUgb24gc29tZSB0ZXN0cyBkdWUgdG8gdGhlIHN0eWxlIGVsZW1lbnQgaW5zaWRlIHRoZSB0ZXN0IGRpdiBzb21laG93IGludGVyZmVyaW5nIG9mZnNldEhlaWdodCwgc28gaW5zZXJ0IGl0IGludG8gYm9keSBvciBmYWtlYm9keS5cbiAgICAgIC8vIE9wZXJhIHdpbGwgYWN0IGFsbCBxdWlya3kgd2hlbiBpbmplY3RpbmcgZWxlbWVudHMgaW4gZG9jdW1lbnRFbGVtZW50IHdoZW4gcGFnZSBpcyBzZXJ2ZWQgYXMgeG1sLCBuZWVkcyBmYWtlYm9keSB0b28uICMyNzBcbiAgICAgIChib2R5ID8gZGl2IDogZmFrZUJvZHkpLmlubmVySFRNTCArPSBzdHlsZTtcbiAgICAgIGZha2VCb2R5LmFwcGVuZENoaWxkKGRpdik7XG4gICAgICBpZiAoICFib2R5ICkge1xuICAgICAgICAgIC8vYXZvaWQgY3Jhc2hpbmcgSUU4LCBpZiBiYWNrZ3JvdW5kIGltYWdlIGlzIHVzZWRcbiAgICAgICAgICBmYWtlQm9keS5zdHlsZS5iYWNrZ3JvdW5kID0gJyc7XG4gICAgICAgICAgLy9TYWZhcmkgNS4xMy81LjEuNCBPU1ggc3RvcHMgbG9hZGluZyBpZiA6Oi13ZWJraXQtc2Nyb2xsYmFyIGlzIHVzZWQgYW5kIHNjcm9sbGJhcnMgYXJlIHZpc2libGVcbiAgICAgICAgICBmYWtlQm9keS5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xuICAgICAgICAgIGRvY092ZXJmbG93ID0gZG9jRWxlbWVudC5zdHlsZS5vdmVyZmxvdztcbiAgICAgICAgICBkb2NFbGVtZW50LnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG4gICAgICAgICAgZG9jRWxlbWVudC5hcHBlbmRDaGlsZChmYWtlQm9keSk7XG4gICAgICB9XG5cbiAgICAgIHJldCA9IGNhbGxiYWNrKGRpdiwgcnVsZSk7XG4gICAgICAvLyBJZiB0aGlzIGlzIGRvbmUgYWZ0ZXIgcGFnZSBsb2FkIHdlIGRvbid0IHdhbnQgdG8gcmVtb3ZlIHRoZSBib2R5IHNvIGNoZWNrIGlmIGJvZHkgZXhpc3RzXG4gICAgICBpZiAoICFib2R5ICkge1xuICAgICAgICAgIGZha2VCb2R5LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZmFrZUJvZHkpO1xuICAgICAgICAgIGRvY0VsZW1lbnQuc3R5bGUub3ZlcmZsb3cgPSBkb2NPdmVyZmxvdztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGl2LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZGl2KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuICEhcmV0O1xuXG4gICAgfSxcbiAgICAvKj4+dGVzdHN0eWxlcyovXG5cbiAgICAvKj4+bXEqL1xuICAgIC8vIGFkYXB0ZWQgZnJvbSBtYXRjaE1lZGlhIHBvbHlmaWxsXG4gICAgLy8gYnkgU2NvdHQgSmVobCBhbmQgUGF1bCBJcmlzaFxuICAgIC8vIGdpc3QuZ2l0aHViLmNvbS83ODY3NjhcbiAgICB0ZXN0TWVkaWFRdWVyeSA9IGZ1bmN0aW9uKCBtcSApIHtcblxuICAgICAgdmFyIG1hdGNoTWVkaWEgPSB3aW5kb3cubWF0Y2hNZWRpYSB8fCB3aW5kb3cubXNNYXRjaE1lZGlhO1xuICAgICAgaWYgKCBtYXRjaE1lZGlhICkge1xuICAgICAgICByZXR1cm4gbWF0Y2hNZWRpYShtcSkgJiYgbWF0Y2hNZWRpYShtcSkubWF0Y2hlcyB8fCBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgdmFyIGJvb2w7XG5cbiAgICAgIGluamVjdEVsZW1lbnRXaXRoU3R5bGVzKCdAbWVkaWEgJyArIG1xICsgJyB7ICMnICsgbW9kICsgJyB7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgfSB9JywgZnVuY3Rpb24oIG5vZGUgKSB7XG4gICAgICAgIGJvb2wgPSAod2luZG93LmdldENvbXB1dGVkU3R5bGUgP1xuICAgICAgICAgICAgICAgICAgZ2V0Q29tcHV0ZWRTdHlsZShub2RlLCBudWxsKSA6XG4gICAgICAgICAgICAgICAgICBub2RlLmN1cnJlbnRTdHlsZSlbJ3Bvc2l0aW9uJ10gPT0gJ2Fic29sdXRlJztcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gYm9vbDtcblxuICAgICB9LFxuICAgICAvKj4+bXEqL1xuXG5cbiAgICAvKj4+aGFzZXZlbnQqL1xuICAgIC8vXG4gICAgLy8gaXNFdmVudFN1cHBvcnRlZCBkZXRlcm1pbmVzIGlmIGEgZ2l2ZW4gZWxlbWVudCBzdXBwb3J0cyB0aGUgZ2l2ZW4gZXZlbnRcbiAgICAvLyBrYW5nYXguZ2l0aHViLmNvbS9pc2V2ZW50c3VwcG9ydGVkL1xuICAgIC8vXG4gICAgLy8gVGhlIGZvbGxvd2luZyByZXN1bHRzIGFyZSBrbm93biBpbmNvcnJlY3RzOlxuICAgIC8vICAgTW9kZXJuaXpyLmhhc0V2ZW50KFwid2Via2l0VHJhbnNpdGlvbkVuZFwiLCBlbGVtKSAvLyBmYWxzZSBuZWdhdGl2ZVxuICAgIC8vICAgTW9kZXJuaXpyLmhhc0V2ZW50KFwidGV4dElucHV0XCIpIC8vIGluIFdlYmtpdC4gZ2l0aHViLmNvbS9Nb2Rlcm5penIvTW9kZXJuaXpyL2lzc3Vlcy8zMzNcbiAgICAvLyAgIC4uLlxuICAgIGlzRXZlbnRTdXBwb3J0ZWQgPSAoZnVuY3Rpb24oKSB7XG5cbiAgICAgIHZhciBUQUdOQU1FUyA9IHtcbiAgICAgICAgJ3NlbGVjdCc6ICdpbnB1dCcsICdjaGFuZ2UnOiAnaW5wdXQnLFxuICAgICAgICAnc3VibWl0JzogJ2Zvcm0nLCAncmVzZXQnOiAnZm9ybScsXG4gICAgICAgICdlcnJvcic6ICdpbWcnLCAnbG9hZCc6ICdpbWcnLCAnYWJvcnQnOiAnaW1nJ1xuICAgICAgfTtcblxuICAgICAgZnVuY3Rpb24gaXNFdmVudFN1cHBvcnRlZCggZXZlbnROYW1lLCBlbGVtZW50ICkge1xuXG4gICAgICAgIGVsZW1lbnQgPSBlbGVtZW50IHx8IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoVEFHTkFNRVNbZXZlbnROYW1lXSB8fCAnZGl2Jyk7XG4gICAgICAgIGV2ZW50TmFtZSA9ICdvbicgKyBldmVudE5hbWU7XG5cbiAgICAgICAgLy8gV2hlbiB1c2luZyBgc2V0QXR0cmlidXRlYCwgSUUgc2tpcHMgXCJ1bmxvYWRcIiwgV2ViS2l0IHNraXBzIFwidW5sb2FkXCIgYW5kIFwicmVzaXplXCIsIHdoZXJlYXMgYGluYCBcImNhdGNoZXNcIiB0aG9zZVxuICAgICAgICB2YXIgaXNTdXBwb3J0ZWQgPSBldmVudE5hbWUgaW4gZWxlbWVudDtcblxuICAgICAgICBpZiAoICFpc1N1cHBvcnRlZCApIHtcbiAgICAgICAgICAvLyBJZiBpdCBoYXMgbm8gYHNldEF0dHJpYnV0ZWAgKGkuZS4gZG9lc24ndCBpbXBsZW1lbnQgTm9kZSBpbnRlcmZhY2UpLCB0cnkgZ2VuZXJpYyBlbGVtZW50XG4gICAgICAgICAgaWYgKCAhZWxlbWVudC5zZXRBdHRyaWJ1dGUgKSB7XG4gICAgICAgICAgICBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICggZWxlbWVudC5zZXRBdHRyaWJ1dGUgJiYgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUgKSB7XG4gICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShldmVudE5hbWUsICcnKTtcbiAgICAgICAgICAgIGlzU3VwcG9ydGVkID0gaXMoZWxlbWVudFtldmVudE5hbWVdLCAnZnVuY3Rpb24nKTtcblxuICAgICAgICAgICAgLy8gSWYgcHJvcGVydHkgd2FzIGNyZWF0ZWQsIFwicmVtb3ZlIGl0XCIgKGJ5IHNldHRpbmcgdmFsdWUgdG8gYHVuZGVmaW5lZGApXG4gICAgICAgICAgICBpZiAoICFpcyhlbGVtZW50W2V2ZW50TmFtZV0sICd1bmRlZmluZWQnKSApIHtcbiAgICAgICAgICAgICAgZWxlbWVudFtldmVudE5hbWVdID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoZXZlbnROYW1lKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50ID0gbnVsbDtcbiAgICAgICAgcmV0dXJuIGlzU3VwcG9ydGVkO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGlzRXZlbnRTdXBwb3J0ZWQ7XG4gICAgfSkoKSxcbiAgICAvKj4+aGFzZXZlbnQqL1xuXG4gICAgLy8gVE9ETyA6OiBBZGQgZmxhZyBmb3IgaGFzb3ducHJvcCA/IGRpZG4ndCBsYXN0IHRpbWVcblxuICAgIC8vIGhhc093blByb3BlcnR5IHNoaW0gYnkga2FuZ2F4IG5lZWRlZCBmb3IgU2FmYXJpIDIuMCBzdXBwb3J0XG4gICAgX2hhc093blByb3BlcnR5ID0gKHt9KS5oYXNPd25Qcm9wZXJ0eSwgaGFzT3duUHJvcDtcblxuICAgIGlmICggIWlzKF9oYXNPd25Qcm9wZXJ0eSwgJ3VuZGVmaW5lZCcpICYmICFpcyhfaGFzT3duUHJvcGVydHkuY2FsbCwgJ3VuZGVmaW5lZCcpICkge1xuICAgICAgaGFzT3duUHJvcCA9IGZ1bmN0aW9uIChvYmplY3QsIHByb3BlcnR5KSB7XG4gICAgICAgIHJldHVybiBfaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTtcbiAgICAgIH07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgaGFzT3duUHJvcCA9IGZ1bmN0aW9uIChvYmplY3QsIHByb3BlcnR5KSB7IC8qIHllcywgdGhpcyBjYW4gZ2l2ZSBmYWxzZSBwb3NpdGl2ZXMvbmVnYXRpdmVzLCBidXQgbW9zdCBvZiB0aGUgdGltZSB3ZSBkb24ndCBjYXJlIGFib3V0IHRob3NlICovXG4gICAgICAgIHJldHVybiAoKHByb3BlcnR5IGluIG9iamVjdCkgJiYgaXMob2JqZWN0LmNvbnN0cnVjdG9yLnByb3RvdHlwZVtwcm9wZXJ0eV0sICd1bmRlZmluZWQnKSk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIEFkYXB0ZWQgZnJvbSBFUzUtc2hpbSBodHRwczovL2dpdGh1Yi5jb20va3Jpc2tvd2FsL2VzNS1zaGltL2Jsb2IvbWFzdGVyL2VzNS1zaGltLmpzXG4gICAgLy8gZXM1LmdpdGh1Yi5jb20vI3gxNS4zLjQuNVxuXG4gICAgaWYgKCFGdW5jdGlvbi5wcm90b3R5cGUuYmluZCkge1xuICAgICAgRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgPSBmdW5jdGlvbiBiaW5kKHRoYXQpIHtcblxuICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpcztcblxuICAgICAgICBpZiAodHlwZW9mIHRhcmdldCAhPSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLFxuICAgICAgICAgICAgYm91bmQgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgIGlmICh0aGlzIGluc3RhbmNlb2YgYm91bmQpIHtcblxuICAgICAgICAgICAgICB2YXIgRiA9IGZ1bmN0aW9uKCl7fTtcbiAgICAgICAgICAgICAgRi5wcm90b3R5cGUgPSB0YXJnZXQucHJvdG90eXBlO1xuICAgICAgICAgICAgICB2YXIgc2VsZiA9IG5ldyBGKCk7XG5cbiAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHRhcmdldC5hcHBseShcbiAgICAgICAgICAgICAgICAgIHNlbGYsXG4gICAgICAgICAgICAgICAgICBhcmdzLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cykpXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIGlmIChPYmplY3QocmVzdWx0KSA9PT0gcmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBzZWxmO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgIHJldHVybiB0YXJnZXQuYXBwbHkoXG4gICAgICAgICAgICAgICAgICB0aGF0LFxuICAgICAgICAgICAgICAgICAgYXJncy5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMpKVxuICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gYm91bmQ7XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHNldENzcyBhcHBsaWVzIGdpdmVuIHN0eWxlcyB0byB0aGUgTW9kZXJuaXpyIERPTSBub2RlLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHNldENzcyggc3RyICkge1xuICAgICAgICBtU3R5bGUuY3NzVGV4dCA9IHN0cjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBzZXRDc3NBbGwgZXh0cmFwb2xhdGVzIGFsbCB2ZW5kb3Itc3BlY2lmaWMgY3NzIHN0cmluZ3MuXG4gICAgICovXG4gICAgZnVuY3Rpb24gc2V0Q3NzQWxsKCBzdHIxLCBzdHIyICkge1xuICAgICAgICByZXR1cm4gc2V0Q3NzKHByZWZpeGVzLmpvaW4oc3RyMSArICc7JykgKyAoIHN0cjIgfHwgJycgKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogaXMgcmV0dXJucyBhIGJvb2xlYW4gZm9yIGlmIHR5cGVvZiBvYmogaXMgZXhhY3RseSB0eXBlLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGlzKCBvYmosIHR5cGUgKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2Ygb2JqID09PSB0eXBlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGNvbnRhaW5zIHJldHVybnMgYSBib29sZWFuIGZvciBpZiBzdWJzdHIgaXMgZm91bmQgd2l0aGluIHN0ci5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjb250YWlucyggc3RyLCBzdWJzdHIgKSB7XG4gICAgICAgIHJldHVybiAhIX4oJycgKyBzdHIpLmluZGV4T2Yoc3Vic3RyKTtcbiAgICB9XG5cbiAgICAvKj4+dGVzdHByb3AqL1xuXG4gICAgLy8gdGVzdFByb3BzIGlzIGEgZ2VuZXJpYyBDU1MgLyBET00gcHJvcGVydHkgdGVzdC5cblxuICAgIC8vIEluIHRlc3Rpbmcgc3VwcG9ydCBmb3IgYSBnaXZlbiBDU1MgcHJvcGVydHksIGl0J3MgbGVnaXQgdG8gdGVzdDpcbiAgICAvLyAgICBgZWxlbS5zdHlsZVtzdHlsZU5hbWVdICE9PSB1bmRlZmluZWRgXG4gICAgLy8gSWYgdGhlIHByb3BlcnR5IGlzIHN1cHBvcnRlZCBpdCB3aWxsIHJldHVybiBhbiBlbXB0eSBzdHJpbmcsXG4gICAgLy8gaWYgdW5zdXBwb3J0ZWQgaXQgd2lsbCByZXR1cm4gdW5kZWZpbmVkLlxuXG4gICAgLy8gV2UnbGwgdGFrZSBhZHZhbnRhZ2Ugb2YgdGhpcyBxdWljayB0ZXN0IGFuZCBza2lwIHNldHRpbmcgYSBzdHlsZVxuICAgIC8vIG9uIG91ciBtb2Rlcm5penIgZWxlbWVudCwgYnV0IGluc3RlYWQganVzdCB0ZXN0aW5nIHVuZGVmaW5lZCB2c1xuICAgIC8vIGVtcHR5IHN0cmluZy5cblxuICAgIC8vIEJlY2F1c2UgdGhlIHRlc3Rpbmcgb2YgdGhlIENTUyBwcm9wZXJ0eSBuYW1lcyAod2l0aCBcIi1cIiwgYXNcbiAgICAvLyBvcHBvc2VkIHRvIHRoZSBjYW1lbENhc2UgRE9NIHByb3BlcnRpZXMpIGlzIG5vbi1wb3J0YWJsZSBhbmRcbiAgICAvLyBub24tc3RhbmRhcmQgYnV0IHdvcmtzIGluIFdlYktpdCBhbmQgSUUgKGJ1dCBub3QgR2Vja28gb3IgT3BlcmEpLFxuICAgIC8vIHdlIGV4cGxpY2l0bHkgcmVqZWN0IHByb3BlcnRpZXMgd2l0aCBkYXNoZXMgc28gdGhhdCBhdXRob3JzXG4gICAgLy8gZGV2ZWxvcGluZyBpbiBXZWJLaXQgb3IgSUUgZmlyc3QgZG9uJ3QgZW5kIHVwIHdpdGhcbiAgICAvLyBicm93c2VyLXNwZWNpZmljIGNvbnRlbnQgYnkgYWNjaWRlbnQuXG5cbiAgICBmdW5jdGlvbiB0ZXN0UHJvcHMoIHByb3BzLCBwcmVmaXhlZCApIHtcbiAgICAgICAgZm9yICggdmFyIGkgaW4gcHJvcHMgKSB7XG4gICAgICAgICAgICB2YXIgcHJvcCA9IHByb3BzW2ldO1xuICAgICAgICAgICAgaWYgKCAhY29udGFpbnMocHJvcCwgXCItXCIpICYmIG1TdHlsZVtwcm9wXSAhPT0gdW5kZWZpbmVkICkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcmVmaXhlZCA9PSAncGZ4JyA/IHByb3AgOiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLyo+PnRlc3Rwcm9wKi9cblxuICAgIC8vIFRPRE8gOjogYWRkIHRlc3RET01Qcm9wc1xuICAgIC8qKlxuICAgICAqIHRlc3RET01Qcm9wcyBpcyBhIGdlbmVyaWMgRE9NIHByb3BlcnR5IHRlc3Q7IGlmIGEgYnJvd3NlciBzdXBwb3J0c1xuICAgICAqICAgYSBjZXJ0YWluIHByb3BlcnR5LCBpdCB3b24ndCByZXR1cm4gdW5kZWZpbmVkIGZvciBpdC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiB0ZXN0RE9NUHJvcHMoIHByb3BzLCBvYmosIGVsZW0gKSB7XG4gICAgICAgIGZvciAoIHZhciBpIGluIHByb3BzICkge1xuICAgICAgICAgICAgdmFyIGl0ZW0gPSBvYmpbcHJvcHNbaV1dO1xuICAgICAgICAgICAgaWYgKCBpdGVtICE9PSB1bmRlZmluZWQpIHtcblxuICAgICAgICAgICAgICAgIC8vIHJldHVybiB0aGUgcHJvcGVydHkgbmFtZSBhcyBhIHN0cmluZ1xuICAgICAgICAgICAgICAgIGlmIChlbGVtID09PSBmYWxzZSkgcmV0dXJuIHByb3BzW2ldO1xuXG4gICAgICAgICAgICAgICAgLy8gbGV0J3MgYmluZCBhIGZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgaWYgKGlzKGl0ZW0sICdmdW5jdGlvbicpKXtcbiAgICAgICAgICAgICAgICAgIC8vIGRlZmF1bHQgdG8gYXV0b2JpbmQgdW5sZXNzIG92ZXJyaWRlXG4gICAgICAgICAgICAgICAgICByZXR1cm4gaXRlbS5iaW5kKGVsZW0gfHwgb2JqKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyByZXR1cm4gdGhlIHVuYm91bmQgZnVuY3Rpb24gb3Igb2JqIG9yIHZhbHVlXG4gICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8qPj50ZXN0YWxscHJvcHMqL1xuICAgIC8qKlxuICAgICAqIHRlc3RQcm9wc0FsbCB0ZXN0cyBhIGxpc3Qgb2YgRE9NIHByb3BlcnRpZXMgd2Ugd2FudCB0byBjaGVjayBhZ2FpbnN0LlxuICAgICAqICAgV2Ugc3BlY2lmeSBsaXRlcmFsbHkgQUxMIHBvc3NpYmxlIChrbm93biBhbmQvb3IgbGlrZWx5KSBwcm9wZXJ0aWVzIG9uXG4gICAgICogICB0aGUgZWxlbWVudCBpbmNsdWRpbmcgdGhlIG5vbi12ZW5kb3IgcHJlZml4ZWQgb25lLCBmb3IgZm9yd2FyZC1cbiAgICAgKiAgIGNvbXBhdGliaWxpdHkuXG4gICAgICovXG4gICAgZnVuY3Rpb24gdGVzdFByb3BzQWxsKCBwcm9wLCBwcmVmaXhlZCwgZWxlbSApIHtcblxuICAgICAgICB2YXIgdWNQcm9wICA9IHByb3AuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBwcm9wLnNsaWNlKDEpLFxuICAgICAgICAgICAgcHJvcHMgICA9IChwcm9wICsgJyAnICsgY3Nzb21QcmVmaXhlcy5qb2luKHVjUHJvcCArICcgJykgKyB1Y1Byb3ApLnNwbGl0KCcgJyk7XG5cbiAgICAgICAgLy8gZGlkIHRoZXkgY2FsbCAucHJlZml4ZWQoJ2JveFNpemluZycpIG9yIGFyZSB3ZSBqdXN0IHRlc3RpbmcgYSBwcm9wP1xuICAgICAgICBpZihpcyhwcmVmaXhlZCwgXCJzdHJpbmdcIikgfHwgaXMocHJlZml4ZWQsIFwidW5kZWZpbmVkXCIpKSB7XG4gICAgICAgICAgcmV0dXJuIHRlc3RQcm9wcyhwcm9wcywgcHJlZml4ZWQpO1xuXG4gICAgICAgIC8vIG90aGVyd2lzZSwgdGhleSBjYWxsZWQgLnByZWZpeGVkKCdyZXF1ZXN0QW5pbWF0aW9uRnJhbWUnLCB3aW5kb3dbLCBlbGVtXSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwcm9wcyA9IChwcm9wICsgJyAnICsgKGRvbVByZWZpeGVzKS5qb2luKHVjUHJvcCArICcgJykgKyB1Y1Byb3ApLnNwbGl0KCcgJyk7XG4gICAgICAgICAgcmV0dXJuIHRlc3RET01Qcm9wcyhwcm9wcywgcHJlZml4ZWQsIGVsZW0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qPj50ZXN0YWxscHJvcHMqL1xuXG5cbiAgICAvKipcbiAgICAgKiBUZXN0c1xuICAgICAqIC0tLS0tXG4gICAgICovXG5cbiAgICAvLyBUaGUgKm5ldyogZmxleGJveFxuICAgIC8vIGRldi53My5vcmcvY3Nzd2cvY3NzMy1mbGV4Ym94XG5cbiAgICB0ZXN0c1snZmxleGJveCddID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGVzdFByb3BzQWxsKCdmbGV4V3JhcCcpO1xuICAgIH07XG5cbiAgICAvLyBUaGUgKm9sZCogZmxleGJveFxuICAgIC8vIHd3dy53My5vcmcvVFIvMjAwOS9XRC1jc3MzLWZsZXhib3gtMjAwOTA3MjMvXG5cbiAgICB0ZXN0c1snZmxleGJveGxlZ2FjeSddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0ZXN0UHJvcHNBbGwoJ2JveERpcmVjdGlvbicpO1xuICAgIH07XG5cbiAgICAvLyBPbiB0aGUgUzYwIGFuZCBCQiBTdG9ybSwgZ2V0Q29udGV4dCBleGlzdHMsIGJ1dCBhbHdheXMgcmV0dXJucyB1bmRlZmluZWRcbiAgICAvLyBzbyB3ZSBhY3R1YWxseSBoYXZlIHRvIGNhbGwgZ2V0Q29udGV4dCgpIHRvIHZlcmlmeVxuICAgIC8vIGdpdGh1Yi5jb20vTW9kZXJuaXpyL01vZGVybml6ci9pc3N1ZXMvaXNzdWUvOTcvXG5cbiAgICB0ZXN0c1snY2FudmFzJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgcmV0dXJuICEhKGVsZW0uZ2V0Q29udGV4dCAmJiBlbGVtLmdldENvbnRleHQoJzJkJykpO1xuICAgIH07XG5cbiAgICB0ZXN0c1snY2FudmFzdGV4dCddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAhIShNb2Rlcm5penJbJ2NhbnZhcyddICYmIGlzKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpLmdldENvbnRleHQoJzJkJykuZmlsbFRleHQsICdmdW5jdGlvbicpKTtcbiAgICB9O1xuXG4gICAgLy8gd2Viay5pdC83MDExNyBpcyB0cmFja2luZyBhIGxlZ2l0IFdlYkdMIGZlYXR1cmUgZGV0ZWN0IHByb3Bvc2FsXG5cbiAgICAvLyBXZSBkbyBhIHNvZnQgZGV0ZWN0IHdoaWNoIG1heSBmYWxzZSBwb3NpdGl2ZSBpbiBvcmRlciB0byBhdm9pZFxuICAgIC8vIGFuIGV4cGVuc2l2ZSBjb250ZXh0IGNyZWF0aW9uOiBidWd6aWwubGEvNzMyNDQxXG5cbiAgICB0ZXN0c1snd2ViZ2wnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gISF3aW5kb3cuV2ViR0xSZW5kZXJpbmdDb250ZXh0O1xuICAgIH07XG5cbiAgICAvKlxuICAgICAqIFRoZSBNb2Rlcm5penIudG91Y2ggdGVzdCBvbmx5IGluZGljYXRlcyBpZiB0aGUgYnJvd3NlciBzdXBwb3J0c1xuICAgICAqICAgIHRvdWNoIGV2ZW50cywgd2hpY2ggZG9lcyBub3QgbmVjZXNzYXJpbHkgcmVmbGVjdCBhIHRvdWNoc2NyZWVuXG4gICAgICogICAgZGV2aWNlLCBhcyBldmlkZW5jZWQgYnkgdGFibGV0cyBydW5uaW5nIFdpbmRvd3MgNyBvciwgYWxhcyxcbiAgICAgKiAgICB0aGUgUGFsbSBQcmUgLyBXZWJPUyAodG91Y2gpIHBob25lcy5cbiAgICAgKlxuICAgICAqIEFkZGl0aW9uYWxseSwgQ2hyb21lIChkZXNrdG9wKSB1c2VkIHRvIGxpZSBhYm91dCBpdHMgc3VwcG9ydCBvbiB0aGlzLFxuICAgICAqICAgIGJ1dCB0aGF0IGhhcyBzaW5jZSBiZWVuIHJlY3RpZmllZDogY3JidWcuY29tLzM2NDE1XG4gICAgICpcbiAgICAgKiBXZSBhbHNvIHRlc3QgZm9yIEZpcmVmb3ggNCBNdWx0aXRvdWNoIFN1cHBvcnQuXG4gICAgICpcbiAgICAgKiBGb3IgbW9yZSBpbmZvLCBzZWU6IG1vZGVybml6ci5naXRodWIuY29tL01vZGVybml6ci90b3VjaC5odG1sXG4gICAgICovXG5cbiAgICB0ZXN0c1sndG91Y2gnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYm9vbDtcblxuICAgICAgICBpZigoJ29udG91Y2hzdGFydCcgaW4gd2luZG93KSB8fCB3aW5kb3cuRG9jdW1lbnRUb3VjaCAmJiBkb2N1bWVudCBpbnN0YW5jZW9mIERvY3VtZW50VG91Y2gpIHtcbiAgICAgICAgICBib29sID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpbmplY3RFbGVtZW50V2l0aFN0eWxlcyhbJ0BtZWRpYSAoJyxwcmVmaXhlcy5qb2luKCd0b3VjaC1lbmFibGVkKSwoJyksbW9kLCcpJywneyNtb2Rlcm5penJ7dG9wOjlweDtwb3NpdGlvbjphYnNvbHV0ZX19J10uam9pbignJyksIGZ1bmN0aW9uKCBub2RlICkge1xuICAgICAgICAgICAgYm9vbCA9IG5vZGUub2Zmc2V0VG9wID09PSA5O1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGJvb2w7XG4gICAgfTtcblxuXG4gICAgLy8gZ2VvbG9jYXRpb24gaXMgb2Z0ZW4gY29uc2lkZXJlZCBhIHRyaXZpYWwgZmVhdHVyZSBkZXRlY3QuLi5cbiAgICAvLyBUdXJucyBvdXQsIGl0J3MgcXVpdGUgdHJpY2t5IHRvIGdldCByaWdodDpcbiAgICAvL1xuICAgIC8vIFVzaW5nICEhbmF2aWdhdG9yLmdlb2xvY2F0aW9uIGRvZXMgdHdvIHRoaW5ncyB3ZSBkb24ndCB3YW50LiBJdDpcbiAgICAvLyAgIDEuIExlYWtzIG1lbW9yeSBpbiBJRTk6IGdpdGh1Yi5jb20vTW9kZXJuaXpyL01vZGVybml6ci9pc3N1ZXMvNTEzXG4gICAgLy8gICAyLiBEaXNhYmxlcyBwYWdlIGNhY2hpbmcgaW4gV2ViS2l0OiB3ZWJrLml0LzQzOTU2XG4gICAgLy9cbiAgICAvLyBNZWFud2hpbGUsIGluIEZpcmVmb3ggPCA4LCBhbiBhYm91dDpjb25maWcgc2V0dGluZyBjb3VsZCBleHBvc2VcbiAgICAvLyBhIGZhbHNlIHBvc2l0aXZlIHRoYXQgd291bGQgdGhyb3cgYW4gZXhjZXB0aW9uOiBidWd6aWwubGEvNjg4MTU4XG5cbiAgICB0ZXN0c1snZ2VvbG9jYXRpb24nXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gJ2dlb2xvY2F0aW9uJyBpbiBuYXZpZ2F0b3I7XG4gICAgfTtcblxuXG4gICAgdGVzdHNbJ3Bvc3RtZXNzYWdlJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAhIXdpbmRvdy5wb3N0TWVzc2FnZTtcbiAgICB9O1xuXG5cbiAgICAvLyBDaHJvbWUgaW5jb2duaXRvIG1vZGUgdXNlZCB0byB0aHJvdyBhbiBleGNlcHRpb24gd2hlbiB1c2luZyBvcGVuRGF0YWJhc2VcbiAgICAvLyBJdCBkb2Vzbid0IGFueW1vcmUuXG4gICAgdGVzdHNbJ3dlYnNxbGRhdGFiYXNlJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAhIXdpbmRvdy5vcGVuRGF0YWJhc2U7XG4gICAgfTtcblxuICAgIC8vIFZlbmRvcnMgaGFkIGluY29uc2lzdGVudCBwcmVmaXhpbmcgd2l0aCB0aGUgZXhwZXJpbWVudGFsIEluZGV4ZWQgREI6XG4gICAgLy8gLSBXZWJraXQncyBpbXBsZW1lbnRhdGlvbiBpcyBhY2Nlc3NpYmxlIHRocm91Z2ggd2Via2l0SW5kZXhlZERCXG4gICAgLy8gLSBGaXJlZm94IHNoaXBwZWQgbW96X2luZGV4ZWREQiBiZWZvcmUgRkY0YjksIGJ1dCBzaW5jZSB0aGVuIGhhcyBiZWVuIG1vekluZGV4ZWREQlxuICAgIC8vIEZvciBzcGVlZCwgd2UgZG9uJ3QgdGVzdCB0aGUgbGVnYWN5IChhbmQgYmV0YS1vbmx5KSBpbmRleGVkREJcbiAgICB0ZXN0c1snaW5kZXhlZERCJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAhIXRlc3RQcm9wc0FsbChcImluZGV4ZWREQlwiLCB3aW5kb3cpO1xuICAgIH07XG5cbiAgICAvLyBkb2N1bWVudE1vZGUgbG9naWMgZnJvbSBZVUkgdG8gZmlsdGVyIG91dCBJRTggQ29tcGF0IE1vZGVcbiAgICAvLyAgIHdoaWNoIGZhbHNlIHBvc2l0aXZlcy5cbiAgICB0ZXN0c1snaGFzaGNoYW5nZSddID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gaXNFdmVudFN1cHBvcnRlZCgnaGFzaGNoYW5nZScsIHdpbmRvdykgJiYgKGRvY3VtZW50LmRvY3VtZW50TW9kZSA9PT0gdW5kZWZpbmVkIHx8IGRvY3VtZW50LmRvY3VtZW50TW9kZSA+IDcpO1xuICAgIH07XG5cbiAgICAvLyBQZXIgMS42OlxuICAgIC8vIFRoaXMgdXNlZCB0byBiZSBNb2Rlcm5penIuaGlzdG9yeW1hbmFnZW1lbnQgYnV0IHRoZSBsb25nZXJcbiAgICAvLyBuYW1lIGhhcyBiZWVuIGRlcHJlY2F0ZWQgaW4gZmF2b3Igb2YgYSBzaG9ydGVyIGFuZCBwcm9wZXJ0eS1tYXRjaGluZyBvbmUuXG4gICAgLy8gVGhlIG9sZCBBUEkgaXMgc3RpbGwgYXZhaWxhYmxlIGluIDEuNiwgYnV0IGFzIG9mIDIuMCB3aWxsIHRocm93IGEgd2FybmluZyxcbiAgICAvLyBhbmQgaW4gdGhlIGZpcnN0IHJlbGVhc2UgdGhlcmVhZnRlciBkaXNhcHBlYXIgZW50aXJlbHkuXG4gICAgdGVzdHNbJ2hpc3RvcnknXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICEhKHdpbmRvdy5oaXN0b3J5ICYmIGhpc3RvcnkucHVzaFN0YXRlKTtcbiAgICB9O1xuXG4gICAgdGVzdHNbJ2RyYWdhbmRkcm9wJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICByZXR1cm4gKCdkcmFnZ2FibGUnIGluIGRpdikgfHwgKCdvbmRyYWdzdGFydCcgaW4gZGl2ICYmICdvbmRyb3AnIGluIGRpdik7XG4gICAgfTtcblxuICAgIC8vIEZGMy42IHdhcyBFT0wnZWQgb24gNC8yNC8xMiwgYnV0IHRoZSBFU1IgdmVyc2lvbiBvZiBGRjEwXG4gICAgLy8gd2lsbCBiZSBzdXBwb3J0ZWQgdW50aWwgRkYxOSAoMi8xMi8xMyksIGF0IHdoaWNoIHRpbWUsIEVTUiBiZWNvbWVzIEZGMTcuXG4gICAgLy8gRkYxMCBzdGlsbCB1c2VzIHByZWZpeGVzLCBzbyBjaGVjayBmb3IgaXQgdW50aWwgdGhlbi5cbiAgICAvLyBmb3IgbW9yZSBFU1IgaW5mbywgc2VlOiBtb3ppbGxhLm9yZy9lbi1VUy9maXJlZm94L29yZ2FuaXphdGlvbnMvZmFxL1xuICAgIHRlc3RzWyd3ZWJzb2NrZXRzJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICdXZWJTb2NrZXQnIGluIHdpbmRvdyB8fCAnTW96V2ViU29ja2V0JyBpbiB3aW5kb3c7XG4gICAgfTtcblxuXG4gICAgLy8gY3NzLXRyaWNrcy5jb20vcmdiYS1icm93c2VyLXN1cHBvcnQvXG4gICAgdGVzdHNbJ3JnYmEnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBTZXQgYW4gcmdiYSgpIGNvbG9yIGFuZCBjaGVjayB0aGUgcmV0dXJuZWQgdmFsdWVcblxuICAgICAgICBzZXRDc3MoJ2JhY2tncm91bmQtY29sb3I6cmdiYSgxNTAsMjU1LDE1MCwuNSknKTtcblxuICAgICAgICByZXR1cm4gY29udGFpbnMobVN0eWxlLmJhY2tncm91bmRDb2xvciwgJ3JnYmEnKTtcbiAgICB9O1xuXG4gICAgdGVzdHNbJ2hzbGEnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBTYW1lIGFzIHJnYmEoKSwgaW4gZmFjdCwgYnJvd3NlcnMgcmUtbWFwIGhzbGEoKSB0byByZ2JhKCkgaW50ZXJuYWxseSxcbiAgICAgICAgLy8gICBleGNlcHQgSUU5IHdobyByZXRhaW5zIGl0IGFzIGhzbGFcblxuICAgICAgICBzZXRDc3MoJ2JhY2tncm91bmQtY29sb3I6aHNsYSgxMjAsNDAlLDEwMCUsLjUpJyk7XG5cbiAgICAgICAgcmV0dXJuIGNvbnRhaW5zKG1TdHlsZS5iYWNrZ3JvdW5kQ29sb3IsICdyZ2JhJykgfHwgY29udGFpbnMobVN0eWxlLmJhY2tncm91bmRDb2xvciwgJ2hzbGEnKTtcbiAgICB9O1xuXG4gICAgdGVzdHNbJ211bHRpcGxlYmdzJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gU2V0dGluZyBtdWx0aXBsZSBpbWFnZXMgQU5EIGEgY29sb3Igb24gdGhlIGJhY2tncm91bmQgc2hvcnRoYW5kIHByb3BlcnR5XG4gICAgICAgIC8vICBhbmQgdGhlbiBxdWVyeWluZyB0aGUgc3R5bGUuYmFja2dyb3VuZCBwcm9wZXJ0eSB2YWx1ZSBmb3IgdGhlIG51bWJlciBvZlxuICAgICAgICAvLyAgb2NjdXJyZW5jZXMgb2YgXCJ1cmwoXCIgaXMgYSByZWxpYWJsZSBtZXRob2QgZm9yIGRldGVjdGluZyBBQ1RVQUwgc3VwcG9ydCBmb3IgdGhpcyFcblxuICAgICAgICBzZXRDc3MoJ2JhY2tncm91bmQ6dXJsKGh0dHBzOi8vKSx1cmwoaHR0cHM6Ly8pLHJlZCB1cmwoaHR0cHM6Ly8pJyk7XG5cbiAgICAgICAgLy8gSWYgdGhlIFVBIHN1cHBvcnRzIG11bHRpcGxlIGJhY2tncm91bmRzLCB0aGVyZSBzaG91bGQgYmUgdGhyZWUgb2NjdXJyZW5jZXNcbiAgICAgICAgLy8gICBvZiB0aGUgc3RyaW5nIFwidXJsKFwiIGluIHRoZSByZXR1cm4gdmFsdWUgZm9yIGVsZW1TdHlsZS5iYWNrZ3JvdW5kXG5cbiAgICAgICAgcmV0dXJuICgvKHVybFxccypcXCguKj8pezN9LykudGVzdChtU3R5bGUuYmFja2dyb3VuZCk7XG4gICAgfTtcblxuXG5cbiAgICAvLyB0aGlzIHdpbGwgZmFsc2UgcG9zaXRpdmUgaW4gT3BlcmEgTWluaVxuICAgIC8vICAgZ2l0aHViLmNvbS9Nb2Rlcm5penIvTW9kZXJuaXpyL2lzc3Vlcy8zOTZcblxuICAgIHRlc3RzWydiYWNrZ3JvdW5kc2l6ZSddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0ZXN0UHJvcHNBbGwoJ2JhY2tncm91bmRTaXplJyk7XG4gICAgfTtcblxuICAgIHRlc3RzWydib3JkZXJpbWFnZSddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0ZXN0UHJvcHNBbGwoJ2JvcmRlckltYWdlJyk7XG4gICAgfTtcblxuXG4gICAgLy8gU3VwZXIgY29tcHJlaGVuc2l2ZSB0YWJsZSBhYm91dCBhbGwgdGhlIHVuaXF1ZSBpbXBsZW1lbnRhdGlvbnMgb2ZcbiAgICAvLyBib3JkZXItcmFkaXVzOiBtdWRkbGVkcmFtYmxpbmdzLmNvbS90YWJsZS1vZi1jc3MzLWJvcmRlci1yYWRpdXMtY29tcGxpYW5jZVxuXG4gICAgdGVzdHNbJ2JvcmRlcnJhZGl1cyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0ZXN0UHJvcHNBbGwoJ2JvcmRlclJhZGl1cycpO1xuICAgIH07XG5cbiAgICAvLyBXZWJPUyB1bmZvcnR1bmF0ZWx5IGZhbHNlIHBvc2l0aXZlcyBvbiB0aGlzIHRlc3QuXG4gICAgdGVzdHNbJ2JveHNoYWRvdyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0ZXN0UHJvcHNBbGwoJ2JveFNoYWRvdycpO1xuICAgIH07XG5cbiAgICAvLyBGRjMuMCB3aWxsIGZhbHNlIHBvc2l0aXZlIG9uIHRoaXMgdGVzdFxuICAgIHRlc3RzWyd0ZXh0c2hhZG93J10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLnN0eWxlLnRleHRTaGFkb3cgPT09ICcnO1xuICAgIH07XG5cblxuICAgIHRlc3RzWydvcGFjaXR5J10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gQnJvd3NlcnMgdGhhdCBhY3R1YWxseSBoYXZlIENTUyBPcGFjaXR5IGltcGxlbWVudGVkIGhhdmUgZG9uZSBzb1xuICAgICAgICAvLyAgYWNjb3JkaW5nIHRvIHNwZWMsIHdoaWNoIG1lYW5zIHRoZWlyIHJldHVybiB2YWx1ZXMgYXJlIHdpdGhpbiB0aGVcbiAgICAgICAgLy8gIHJhbmdlIG9mIFswLjAsMS4wXSAtIGluY2x1ZGluZyB0aGUgbGVhZGluZyB6ZXJvLlxuXG4gICAgICAgIHNldENzc0FsbCgnb3BhY2l0eTouNTUnKTtcblxuICAgICAgICAvLyBUaGUgbm9uLWxpdGVyYWwgLiBpbiB0aGlzIHJlZ2V4IGlzIGludGVudGlvbmFsOlxuICAgICAgICAvLyAgIEdlcm1hbiBDaHJvbWUgcmV0dXJucyB0aGlzIHZhbHVlIGFzIDAsNTVcbiAgICAgICAgLy8gZ2l0aHViLmNvbS9Nb2Rlcm5penIvTW9kZXJuaXpyL2lzc3Vlcy8jaXNzdWUvNTkvY29tbWVudC81MTY2MzJcbiAgICAgICAgcmV0dXJuICgvXjAuNTUkLykudGVzdChtU3R5bGUub3BhY2l0eSk7XG4gICAgfTtcblxuXG4gICAgLy8gTm90ZSwgQW5kcm9pZCA8IDQgd2lsbCBwYXNzIHRoaXMgdGVzdCwgYnV0IGNhbiBvbmx5IGFuaW1hdGVcbiAgICAvLyAgIGEgc2luZ2xlIHByb3BlcnR5IGF0IGEgdGltZVxuICAgIC8vICAgZ29vLmdsL3YzVjRHcFxuICAgIHRlc3RzWydjc3NhbmltYXRpb25zJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRlc3RQcm9wc0FsbCgnYW5pbWF0aW9uTmFtZScpO1xuICAgIH07XG5cblxuICAgIHRlc3RzWydjc3Njb2x1bW5zJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRlc3RQcm9wc0FsbCgnY29sdW1uQ291bnQnKTtcbiAgICB9O1xuXG5cbiAgICB0ZXN0c1snY3NzZ3JhZGllbnRzJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZvciBDU1MgR3JhZGllbnRzIHN5bnRheCwgcGxlYXNlIHNlZTpcbiAgICAgICAgICogd2Via2l0Lm9yZy9ibG9nLzE3NS9pbnRyb2R1Y2luZy1jc3MtZ3JhZGllbnRzL1xuICAgICAgICAgKiBkZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vQ1NTLy1tb3otbGluZWFyLWdyYWRpZW50XG4gICAgICAgICAqIGRldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9DU1MvLW1vei1yYWRpYWwtZ3JhZGllbnRcbiAgICAgICAgICogZGV2LnczLm9yZy9jc3N3Zy9jc3MzLWltYWdlcy8jZ3JhZGllbnRzLVxuICAgICAgICAgKi9cblxuICAgICAgICB2YXIgc3RyMSA9ICdiYWNrZ3JvdW5kLWltYWdlOicsXG4gICAgICAgICAgICBzdHIyID0gJ2dyYWRpZW50KGxpbmVhcixsZWZ0IHRvcCxyaWdodCBib3R0b20sZnJvbSgjOWY5KSx0byh3aGl0ZSkpOycsXG4gICAgICAgICAgICBzdHIzID0gJ2xpbmVhci1ncmFkaWVudChsZWZ0IHRvcCwjOWY5LCB3aGl0ZSk7JztcblxuICAgICAgICBzZXRDc3MoXG4gICAgICAgICAgICAgLy8gbGVnYWN5IHdlYmtpdCBzeW50YXggKEZJWE1FOiByZW1vdmUgd2hlbiBzeW50YXggbm90IGluIHVzZSBhbnltb3JlKVxuICAgICAgICAgICAgICAoc3RyMSArICctd2Via2l0LSAnLnNwbGl0KCcgJykuam9pbihzdHIyICsgc3RyMSkgK1xuICAgICAgICAgICAgIC8vIHN0YW5kYXJkIHN5bnRheCAgICAgICAgICAgICAvLyB0cmFpbGluZyAnYmFja2dyb3VuZC1pbWFnZTonXG4gICAgICAgICAgICAgIHByZWZpeGVzLmpvaW4oc3RyMyArIHN0cjEpKS5zbGljZSgwLCAtc3RyMS5sZW5ndGgpXG4gICAgICAgICk7XG5cbiAgICAgICAgcmV0dXJuIGNvbnRhaW5zKG1TdHlsZS5iYWNrZ3JvdW5kSW1hZ2UsICdncmFkaWVudCcpO1xuICAgIH07XG5cblxuICAgIHRlc3RzWydjc3NyZWZsZWN0aW9ucyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0ZXN0UHJvcHNBbGwoJ2JveFJlZmxlY3QnKTtcbiAgICB9O1xuXG5cbiAgICB0ZXN0c1snY3NzdHJhbnNmb3JtcyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAhIXRlc3RQcm9wc0FsbCgndHJhbnNmb3JtJyk7XG4gICAgfTtcblxuXG4gICAgdGVzdHNbJ2Nzc3RyYW5zZm9ybXMzZCddID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgdmFyIHJldCA9ICEhdGVzdFByb3BzQWxsKCdwZXJzcGVjdGl2ZScpO1xuXG4gICAgICAgIC8vIFdlYmtpdCdzIDNEIHRyYW5zZm9ybXMgYXJlIHBhc3NlZCBvZmYgdG8gdGhlIGJyb3dzZXIncyBvd24gZ3JhcGhpY3MgcmVuZGVyZXIuXG4gICAgICAgIC8vICAgSXQgd29ya3MgZmluZSBpbiBTYWZhcmkgb24gTGVvcGFyZCBhbmQgU25vdyBMZW9wYXJkLCBidXQgbm90IGluIENocm9tZSBpblxuICAgICAgICAvLyAgIHNvbWUgY29uZGl0aW9ucy4gQXMgYSByZXN1bHQsIFdlYmtpdCB0eXBpY2FsbHkgcmVjb2duaXplcyB0aGUgc3ludGF4IGJ1dFxuICAgICAgICAvLyAgIHdpbGwgc29tZXRpbWVzIHRocm93IGEgZmFsc2UgcG9zaXRpdmUsIHRodXMgd2UgbXVzdCBkbyBhIG1vcmUgdGhvcm91Z2ggY2hlY2s6XG4gICAgICAgIGlmICggcmV0ICYmICd3ZWJraXRQZXJzcGVjdGl2ZScgaW4gZG9jRWxlbWVudC5zdHlsZSApIHtcblxuICAgICAgICAgIC8vIFdlYmtpdCBhbGxvd3MgdGhpcyBtZWRpYSBxdWVyeSB0byBzdWNjZWVkIG9ubHkgaWYgdGhlIGZlYXR1cmUgaXMgZW5hYmxlZC5cbiAgICAgICAgICAvLyBgQG1lZGlhICh0cmFuc2Zvcm0tM2QpLCgtd2Via2l0LXRyYW5zZm9ybS0zZCl7IC4uLiB9YFxuICAgICAgICAgIGluamVjdEVsZW1lbnRXaXRoU3R5bGVzKCdAbWVkaWEgKHRyYW5zZm9ybS0zZCksKC13ZWJraXQtdHJhbnNmb3JtLTNkKXsjbW9kZXJuaXpye2xlZnQ6OXB4O3Bvc2l0aW9uOmFic29sdXRlO2hlaWdodDozcHg7fX0nLCBmdW5jdGlvbiggbm9kZSwgcnVsZSApIHtcbiAgICAgICAgICAgIHJldCA9IG5vZGUub2Zmc2V0TGVmdCA9PT0gOSAmJiBub2RlLm9mZnNldEhlaWdodCA9PT0gMztcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH07XG5cblxuICAgIHRlc3RzWydjc3N0cmFuc2l0aW9ucyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0ZXN0UHJvcHNBbGwoJ3RyYW5zaXRpb24nKTtcbiAgICB9O1xuXG5cbiAgICAvKj4+Zm9udGZhY2UqL1xuICAgIC8vIEBmb250LWZhY2UgZGV0ZWN0aW9uIHJvdXRpbmUgYnkgRGllZ28gUGVyaW5pXG4gICAgLy8gamF2YXNjcmlwdC5ud2JveC5jb20vQ1NTU3VwcG9ydC9cblxuICAgIC8vIGZhbHNlIHBvc2l0aXZlczpcbiAgICAvLyAgIFdlYk9TIGdpdGh1Yi5jb20vTW9kZXJuaXpyL01vZGVybml6ci9pc3N1ZXMvMzQyXG4gICAgLy8gICBXUDcgICBnaXRodWIuY29tL01vZGVybml6ci9Nb2Rlcm5penIvaXNzdWVzLzUzOFxuICAgIHRlc3RzWydmb250ZmFjZSddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBib29sO1xuXG4gICAgICAgIGluamVjdEVsZW1lbnRXaXRoU3R5bGVzKCdAZm9udC1mYWNlIHtmb250LWZhbWlseTpcImZvbnRcIjtzcmM6dXJsKFwiaHR0cHM6Ly9cIil9JywgZnVuY3Rpb24oIG5vZGUsIHJ1bGUgKSB7XG4gICAgICAgICAgdmFyIHN0eWxlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Ntb2Rlcm5penInKSxcbiAgICAgICAgICAgICAgc2hlZXQgPSBzdHlsZS5zaGVldCB8fCBzdHlsZS5zdHlsZVNoZWV0LFxuICAgICAgICAgICAgICBjc3NUZXh0ID0gc2hlZXQgPyAoc2hlZXQuY3NzUnVsZXMgJiYgc2hlZXQuY3NzUnVsZXNbMF0gPyBzaGVldC5jc3NSdWxlc1swXS5jc3NUZXh0IDogc2hlZXQuY3NzVGV4dCB8fCAnJykgOiAnJztcblxuICAgICAgICAgIGJvb2wgPSAvc3JjL2kudGVzdChjc3NUZXh0KSAmJiBjc3NUZXh0LmluZGV4T2YocnVsZS5zcGxpdCgnICcpWzBdKSA9PT0gMDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGJvb2w7XG4gICAgfTtcbiAgICAvKj4+Zm9udGZhY2UqL1xuXG4gICAgLy8gQ1NTIGdlbmVyYXRlZCBjb250ZW50IGRldGVjdGlvblxuICAgIHRlc3RzWydnZW5lcmF0ZWRjb250ZW50J10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGJvb2w7XG5cbiAgICAgICAgaW5qZWN0RWxlbWVudFdpdGhTdHlsZXMoWycjJyxtb2QsJ3tmb250OjAvMCBhfSMnLG1vZCwnOmFmdGVye2NvbnRlbnQ6XCInLHNtaWxlLCdcIjt2aXNpYmlsaXR5OmhpZGRlbjtmb250OjNweC8xIGF9J10uam9pbignJyksIGZ1bmN0aW9uKCBub2RlICkge1xuICAgICAgICAgIGJvb2wgPSBub2RlLm9mZnNldEhlaWdodCA+PSAzO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gYm9vbDtcbiAgICB9O1xuXG5cblxuICAgIC8vIFRoZXNlIHRlc3RzIGV2YWx1YXRlIHN1cHBvcnQgb2YgdGhlIHZpZGVvL2F1ZGlvIGVsZW1lbnRzLCBhcyB3ZWxsIGFzXG4gICAgLy8gdGVzdGluZyB3aGF0IHR5cGVzIG9mIGNvbnRlbnQgdGhleSBzdXBwb3J0LlxuICAgIC8vXG4gICAgLy8gV2UncmUgdXNpbmcgdGhlIEJvb2xlYW4gY29uc3RydWN0b3IgaGVyZSwgc28gdGhhdCB3ZSBjYW4gZXh0ZW5kIHRoZSB2YWx1ZVxuICAgIC8vIGUuZy4gIE1vZGVybml6ci52aWRlbyAgICAgLy8gdHJ1ZVxuICAgIC8vICAgICAgIE1vZGVybml6ci52aWRlby5vZ2cgLy8gJ3Byb2JhYmx5J1xuICAgIC8vXG4gICAgLy8gQ29kZWMgdmFsdWVzIGZyb20gOiBnaXRodWIuY29tL05pZWxzTGVlbmhlZXIvaHRtbDV0ZXN0L2Jsb2IvOTEwNmE4L2luZGV4Lmh0bWwjTDg0NVxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgdGh4IHRvIE5pZWxzTGVlbmhlZXIgYW5kIHpjb3JwYW5cblxuICAgIC8vIE5vdGU6IGluIHNvbWUgb2xkZXIgYnJvd3NlcnMsIFwibm9cIiB3YXMgYSByZXR1cm4gdmFsdWUgaW5zdGVhZCBvZiBlbXB0eSBzdHJpbmcuXG4gICAgLy8gICBJdCB3YXMgbGl2ZSBpbiBGRjMuNS4wIGFuZCAzLjUuMSwgYnV0IGZpeGVkIGluIDMuNS4yXG4gICAgLy8gICBJdCB3YXMgYWxzbyBsaXZlIGluIFNhZmFyaSA0LjAuMCAtIDQuMC40LCBidXQgZml4ZWQgaW4gNC4wLjVcblxuICAgIHRlc3RzWyd2aWRlbyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBlbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndmlkZW8nKSxcbiAgICAgICAgICAgIGJvb2wgPSBmYWxzZTtcblxuICAgICAgICAvLyBJRTkgUnVubmluZyBvbiBXaW5kb3dzIFNlcnZlciBTS1UgY2FuIGNhdXNlIGFuIGV4Y2VwdGlvbiB0byBiZSB0aHJvd24sIGJ1ZyAjMjI0XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoIGJvb2wgPSAhIWVsZW0uY2FuUGxheVR5cGUgKSB7XG4gICAgICAgICAgICAgICAgYm9vbCAgICAgID0gbmV3IEJvb2xlYW4oYm9vbCk7XG4gICAgICAgICAgICAgICAgYm9vbC5vZ2cgID0gZWxlbS5jYW5QbGF5VHlwZSgndmlkZW8vb2dnOyBjb2RlY3M9XCJ0aGVvcmFcIicpICAgICAgLnJlcGxhY2UoL15ubyQvLCcnKTtcblxuICAgICAgICAgICAgICAgIC8vIFdpdGhvdXQgUXVpY2tUaW1lLCB0aGlzIHZhbHVlIHdpbGwgYmUgYHVuZGVmaW5lZGAuIGdpdGh1Yi5jb20vTW9kZXJuaXpyL01vZGVybml6ci9pc3N1ZXMvNTQ2XG4gICAgICAgICAgICAgICAgYm9vbC5oMjY0ID0gZWxlbS5jYW5QbGF5VHlwZSgndmlkZW8vbXA0OyBjb2RlY3M9XCJhdmMxLjQyRTAxRVwiJykgLnJlcGxhY2UoL15ubyQvLCcnKTtcblxuICAgICAgICAgICAgICAgIGJvb2wud2VibSA9IGVsZW0uY2FuUGxheVR5cGUoJ3ZpZGVvL3dlYm07IGNvZGVjcz1cInZwOCwgdm9yYmlzXCInKS5yZXBsYWNlKC9ebm8kLywnJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSBjYXRjaChlKSB7IH1cblxuICAgICAgICByZXR1cm4gYm9vbDtcbiAgICB9O1xuXG4gICAgdGVzdHNbJ2F1ZGlvJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhdWRpbycpLFxuICAgICAgICAgICAgYm9vbCA9IGZhbHNlO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoIGJvb2wgPSAhIWVsZW0uY2FuUGxheVR5cGUgKSB7XG4gICAgICAgICAgICAgICAgYm9vbCAgICAgID0gbmV3IEJvb2xlYW4oYm9vbCk7XG4gICAgICAgICAgICAgICAgYm9vbC5vZ2cgID0gZWxlbS5jYW5QbGF5VHlwZSgnYXVkaW8vb2dnOyBjb2RlY3M9XCJ2b3JiaXNcIicpLnJlcGxhY2UoL15ubyQvLCcnKTtcbiAgICAgICAgICAgICAgICBib29sLm1wMyAgPSBlbGVtLmNhblBsYXlUeXBlKCdhdWRpby9tcGVnOycpICAgICAgICAgICAgICAgLnJlcGxhY2UoL15ubyQvLCcnKTtcblxuICAgICAgICAgICAgICAgIC8vIE1pbWV0eXBlcyBhY2NlcHRlZDpcbiAgICAgICAgICAgICAgICAvLyAgIGRldmVsb3Blci5tb3ppbGxhLm9yZy9Fbi9NZWRpYV9mb3JtYXRzX3N1cHBvcnRlZF9ieV90aGVfYXVkaW9fYW5kX3ZpZGVvX2VsZW1lbnRzXG4gICAgICAgICAgICAgICAgLy8gICBiaXQubHkvaXBob25lb3Njb2RlY3NcbiAgICAgICAgICAgICAgICBib29sLndhdiAgPSBlbGVtLmNhblBsYXlUeXBlKCdhdWRpby93YXY7IGNvZGVjcz1cIjFcIicpICAgICAucmVwbGFjZSgvXm5vJC8sJycpO1xuICAgICAgICAgICAgICAgIGJvb2wubTRhICA9ICggZWxlbS5jYW5QbGF5VHlwZSgnYXVkaW8veC1tNGE7JykgICAgICAgICAgICB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jYW5QbGF5VHlwZSgnYXVkaW8vYWFjOycpKSAgICAgICAgICAgICAucmVwbGFjZSgvXm5vJC8sJycpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoKGUpIHsgfVxuXG4gICAgICAgIHJldHVybiBib29sO1xuICAgIH07XG5cblxuICAgIC8vIEluIEZGNCwgaWYgZGlzYWJsZWQsIHdpbmRvdy5sb2NhbFN0b3JhZ2Ugc2hvdWxkID09PSBudWxsLlxuXG4gICAgLy8gTm9ybWFsbHksIHdlIGNvdWxkIG5vdCB0ZXN0IHRoYXQgZGlyZWN0bHkgYW5kIG5lZWQgdG8gZG8gYVxuICAgIC8vICAgYCgnbG9jYWxTdG9yYWdlJyBpbiB3aW5kb3cpICYmIGAgdGVzdCBmaXJzdCBiZWNhdXNlIG90aGVyd2lzZSBGaXJlZm94IHdpbGxcbiAgICAvLyAgIHRocm93IGJ1Z3ppbC5sYS8zNjU3NzIgaWYgY29va2llcyBhcmUgZGlzYWJsZWRcblxuICAgIC8vIEFsc28gaW4gaU9TNSBQcml2YXRlIEJyb3dzaW5nIG1vZGUsIGF0dGVtcHRpbmcgdG8gdXNlIGxvY2FsU3RvcmFnZS5zZXRJdGVtXG4gICAgLy8gd2lsbCB0aHJvdyB0aGUgZXhjZXB0aW9uOlxuICAgIC8vICAgUVVPVEFfRVhDRUVERURfRVJSUk9SIERPTSBFeGNlcHRpb24gMjIuXG4gICAgLy8gUGVjdWxpYXJseSwgZ2V0SXRlbSBhbmQgcmVtb3ZlSXRlbSBjYWxscyBkbyBub3QgdGhyb3cuXG5cbiAgICAvLyBCZWNhdXNlIHdlIGFyZSBmb3JjZWQgdG8gdHJ5L2NhdGNoIHRoaXMsIHdlJ2xsIGdvIGFnZ3Jlc3NpdmUuXG5cbiAgICAvLyBKdXN0IEZXSVc6IElFOCBDb21wYXQgbW9kZSBzdXBwb3J0cyB0aGVzZSBmZWF0dXJlcyBjb21wbGV0ZWx5OlxuICAgIC8vICAgd3d3LnF1aXJrc21vZGUub3JnL2RvbS9odG1sNS5odG1sXG4gICAgLy8gQnV0IElFOCBkb2Vzbid0IHN1cHBvcnQgZWl0aGVyIHdpdGggbG9jYWwgZmlsZXNcblxuICAgIHRlc3RzWydsb2NhbHN0b3JhZ2UnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0obW9kLCBtb2QpO1xuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0obW9kKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB0ZXN0c1snc2Vzc2lvbnN0b3JhZ2UnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbShtb2QsIG1vZCk7XG4gICAgICAgICAgICBzZXNzaW9uU3RvcmFnZS5yZW1vdmVJdGVtKG1vZCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9O1xuXG5cbiAgICB0ZXN0c1snd2Vid29ya2VycyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAhIXdpbmRvdy5Xb3JrZXI7XG4gICAgfTtcblxuXG4gICAgdGVzdHNbJ2FwcGxpY2F0aW9uY2FjaGUnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gISF3aW5kb3cuYXBwbGljYXRpb25DYWNoZTtcbiAgICB9O1xuXG5cbiAgICAvLyBUaGFua3MgdG8gRXJpayBEYWhsc3Ryb21cbiAgICB0ZXN0c1snc3ZnJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICEhZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TICYmICEhZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5zLnN2ZywgJ3N2ZycpLmNyZWF0ZVNWR1JlY3Q7XG4gICAgfTtcblxuICAgIC8vIHNwZWNpZmljYWxseSBmb3IgU1ZHIGlubGluZSBpbiBIVE1MLCBub3Qgd2l0aGluIFhIVE1MXG4gICAgLy8gdGVzdCBwYWdlOiBwYXVsaXJpc2guY29tL2RlbW8vaW5saW5lLXN2Z1xuICAgIHRlc3RzWydpbmxpbmVzdmcnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgZGl2LmlubmVySFRNTCA9ICc8c3ZnLz4nO1xuICAgICAgcmV0dXJuIChkaXYuZmlyc3RDaGlsZCAmJiBkaXYuZmlyc3RDaGlsZC5uYW1lc3BhY2VVUkkpID09IG5zLnN2ZztcbiAgICB9O1xuXG4gICAgLy8gU1ZHIFNNSUwgYW5pbWF0aW9uXG4gICAgdGVzdHNbJ3NtaWwnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gISFkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMgJiYgL1NWR0FuaW1hdGUvLnRlc3QodG9TdHJpbmcuY2FsbChkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMobnMuc3ZnLCAnYW5pbWF0ZScpKSk7XG4gICAgfTtcblxuICAgIC8vIFRoaXMgdGVzdCBpcyBvbmx5IGZvciBjbGlwIHBhdGhzIGluIFNWRyBwcm9wZXIsIG5vdCBjbGlwIHBhdGhzIG9uIEhUTUwgY29udGVudFxuICAgIC8vIGRlbW86IHNydWZhY3VsdHkuc3J1LmVkdS9kYXZpZC5kYWlsZXkvc3ZnL25ld3N0dWZmL2NsaXBQYXRoNC5zdmdcblxuICAgIC8vIEhvd2V2ZXIgcmVhZCB0aGUgY29tbWVudHMgdG8gZGlnIGludG8gYXBwbHlpbmcgU1ZHIGNsaXBwYXRocyB0byBIVE1MIGNvbnRlbnQgaGVyZTpcbiAgICAvLyAgIGdpdGh1Yi5jb20vTW9kZXJuaXpyL01vZGVybml6ci9pc3N1ZXMvMjEzI2lzc3VlY29tbWVudC0xMTQ5NDkxXG4gICAgdGVzdHNbJ3N2Z2NsaXBwYXRocyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAhIWRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyAmJiAvU1ZHQ2xpcFBhdGgvLnRlc3QodG9TdHJpbmcuY2FsbChkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMobnMuc3ZnLCAnY2xpcFBhdGgnKSkpO1xuICAgIH07XG5cbiAgICAvKj4+d2ViZm9ybXMqL1xuICAgIC8vIGlucHV0IGZlYXR1cmVzIGFuZCBpbnB1dCB0eXBlcyBnbyBkaXJlY3RseSBvbnRvIHRoZSByZXQgb2JqZWN0LCBieXBhc3NpbmcgdGhlIHRlc3RzIGxvb3AuXG4gICAgLy8gSG9sZCB0aGlzIGd1eSB0byBleGVjdXRlIGluIGEgbW9tZW50LlxuICAgIGZ1bmN0aW9uIHdlYmZvcm1zKCkge1xuICAgICAgICAvKj4+aW5wdXQqL1xuICAgICAgICAvLyBSdW4gdGhyb3VnaCBIVE1MNSdzIG5ldyBpbnB1dCBhdHRyaWJ1dGVzIHRvIHNlZSBpZiB0aGUgVUEgdW5kZXJzdGFuZHMgYW55LlxuICAgICAgICAvLyBXZSdyZSB1c2luZyBmIHdoaWNoIGlzIHRoZSA8aW5wdXQ+IGVsZW1lbnQgY3JlYXRlZCBlYXJseSBvblxuICAgICAgICAvLyBNaWtlIFRheWxyIGhhcyBjcmVhdGVkIGEgY29tcHJlaGVuc2l2ZSByZXNvdXJjZSBmb3IgdGVzdGluZyB0aGVzZSBhdHRyaWJ1dGVzXG4gICAgICAgIC8vICAgd2hlbiBhcHBsaWVkIHRvIGFsbCBpbnB1dCB0eXBlczpcbiAgICAgICAgLy8gICBtaWtldGF5bHIuY29tL2NvZGUvaW5wdXQtdHlwZS1hdHRyLmh0bWxcbiAgICAgICAgLy8gc3BlYzogd3d3LndoYXR3Zy5vcmcvc3BlY3Mvd2ViLWFwcHMvY3VycmVudC13b3JrL211bHRpcGFnZS90aGUtaW5wdXQtZWxlbWVudC5odG1sI2lucHV0LXR5cGUtYXR0ci1zdW1tYXJ5XG5cbiAgICAgICAgLy8gT25seSBpbnB1dCBwbGFjZWhvbGRlciBpcyB0ZXN0ZWQgd2hpbGUgdGV4dGFyZWEncyBwbGFjZWhvbGRlciBpcyBub3QuXG4gICAgICAgIC8vIEN1cnJlbnRseSBTYWZhcmkgNCBhbmQgT3BlcmEgMTEgaGF2ZSBzdXBwb3J0IG9ubHkgZm9yIHRoZSBpbnB1dCBwbGFjZWhvbGRlclxuICAgICAgICAvLyBCb3RoIHRlc3RzIGFyZSBhdmFpbGFibGUgaW4gZmVhdHVyZS1kZXRlY3RzL2Zvcm1zLXBsYWNlaG9sZGVyLmpzXG4gICAgICAgIE1vZGVybml6clsnaW5wdXQnXSA9IChmdW5jdGlvbiggcHJvcHMgKSB7XG4gICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGxlbiA9IHByb3BzLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuICAgICAgICAgICAgICAgIGF0dHJzWyBwcm9wc1tpXSBdID0gISEocHJvcHNbaV0gaW4gaW5wdXRFbGVtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhdHRycy5saXN0KXtcbiAgICAgICAgICAgICAgLy8gc2FmYXJpIGZhbHNlIHBvc2l0aXZlJ3Mgb24gZGF0YWxpc3Q6IHdlYmsuaXQvNzQyNTJcbiAgICAgICAgICAgICAgLy8gc2VlIGFsc28gZ2l0aHViLmNvbS9Nb2Rlcm5penIvTW9kZXJuaXpyL2lzc3Vlcy8xNDZcbiAgICAgICAgICAgICAgYXR0cnMubGlzdCA9ICEhKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RhdGFsaXN0JykgJiYgd2luZG93LkhUTUxEYXRhTGlzdEVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGF0dHJzO1xuICAgICAgICB9KSgnYXV0b2NvbXBsZXRlIGF1dG9mb2N1cyBsaXN0IHBsYWNlaG9sZGVyIG1heCBtaW4gbXVsdGlwbGUgcGF0dGVybiByZXF1aXJlZCBzdGVwJy5zcGxpdCgnICcpKTtcbiAgICAgICAgLyo+PmlucHV0Ki9cblxuICAgICAgICAvKj4+aW5wdXR0eXBlcyovXG4gICAgICAgIC8vIFJ1biB0aHJvdWdoIEhUTUw1J3MgbmV3IGlucHV0IHR5cGVzIHRvIHNlZSBpZiB0aGUgVUEgdW5kZXJzdGFuZHMgYW55LlxuICAgICAgICAvLyAgIFRoaXMgaXMgcHV0IGJlaGluZCB0aGUgdGVzdHMgcnVubG9vcCBiZWNhdXNlIGl0IGRvZXNuJ3QgcmV0dXJuIGFcbiAgICAgICAgLy8gICB0cnVlL2ZhbHNlIGxpa2UgYWxsIHRoZSBvdGhlciB0ZXN0czsgaW5zdGVhZCwgaXQgcmV0dXJucyBhbiBvYmplY3RcbiAgICAgICAgLy8gICBjb250YWluaW5nIGVhY2ggaW5wdXQgdHlwZSB3aXRoIGl0cyBjb3JyZXNwb25kaW5nIHRydWUvZmFsc2UgdmFsdWVcblxuICAgICAgICAvLyBCaWcgdGhhbmtzIHRvIEBtaWtldGF5bHIgZm9yIHRoZSBodG1sNSBmb3JtcyBleHBlcnRpc2UuIG1pa2V0YXlsci5jb20vXG4gICAgICAgIE1vZGVybml6clsnaW5wdXR0eXBlcyddID0gKGZ1bmN0aW9uKHByb3BzKSB7XG5cbiAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCwgYm9vbCwgaW5wdXRFbGVtVHlwZSwgZGVmYXVsdFZpZXcsIGxlbiA9IHByb3BzLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuXG4gICAgICAgICAgICAgICAgaW5wdXRFbGVtLnNldEF0dHJpYnV0ZSgndHlwZScsIGlucHV0RWxlbVR5cGUgPSBwcm9wc1tpXSk7XG4gICAgICAgICAgICAgICAgYm9vbCA9IGlucHV0RWxlbS50eXBlICE9PSAndGV4dCc7XG5cbiAgICAgICAgICAgICAgICAvLyBXZSBmaXJzdCBjaGVjayB0byBzZWUgaWYgdGhlIHR5cGUgd2UgZ2l2ZSBpdCBzdGlja3MuLlxuICAgICAgICAgICAgICAgIC8vIElmIHRoZSB0eXBlIGRvZXMsIHdlIGZlZWQgaXQgYSB0ZXh0dWFsIHZhbHVlLCB3aGljaCBzaG91bGRuJ3QgYmUgdmFsaWQuXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIHZhbHVlIGRvZXNuJ3Qgc3RpY2ssIHdlIGtub3cgdGhlcmUncyBpbnB1dCBzYW5pdGl6YXRpb24gd2hpY2ggaW5mZXJzIGEgY3VzdG9tIFVJXG4gICAgICAgICAgICAgICAgaWYgKCBib29sICkge1xuXG4gICAgICAgICAgICAgICAgICAgIGlucHV0RWxlbS52YWx1ZSAgICAgICAgID0gc21pbGU7XG4gICAgICAgICAgICAgICAgICAgIGlucHV0RWxlbS5zdHlsZS5jc3NUZXh0ID0gJ3Bvc2l0aW9uOmFic29sdXRlO3Zpc2liaWxpdHk6aGlkZGVuOyc7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCAvXnJhbmdlJC8udGVzdChpbnB1dEVsZW1UeXBlKSAmJiBpbnB1dEVsZW0uc3R5bGUuV2Via2l0QXBwZWFyYW5jZSAhPT0gdW5kZWZpbmVkICkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgZG9jRWxlbWVudC5hcHBlbmRDaGlsZChpbnB1dEVsZW0pO1xuICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRWaWV3ID0gZG9jdW1lbnQuZGVmYXVsdFZpZXc7XG5cbiAgICAgICAgICAgICAgICAgICAgICAvLyBTYWZhcmkgMi00IGFsbG93cyB0aGUgc21pbGV5IGFzIGEgdmFsdWUsIGRlc3BpdGUgbWFraW5nIGEgc2xpZGVyXG4gICAgICAgICAgICAgICAgICAgICAgYm9vbCA9ICBkZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKGlucHV0RWxlbSwgbnVsbCkuV2Via2l0QXBwZWFyYW5jZSAhPT0gJ3RleHRmaWVsZCcgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1vYmlsZSBhbmRyb2lkIHdlYiBicm93c2VyIGhhcyBmYWxzZSBwb3NpdGl2ZSwgc28gbXVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2hlY2sgdGhlIGhlaWdodCB0byBzZWUgaWYgdGhlIHdpZGdldCBpcyBhY3R1YWxseSB0aGVyZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChpbnB1dEVsZW0ub2Zmc2V0SGVpZ2h0ICE9PSAwKTtcblxuICAgICAgICAgICAgICAgICAgICAgIGRvY0VsZW1lbnQucmVtb3ZlQ2hpbGQoaW5wdXRFbGVtKTtcblxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCAvXihzZWFyY2h8dGVsKSQvLnRlc3QoaW5wdXRFbGVtVHlwZSkgKXtcbiAgICAgICAgICAgICAgICAgICAgICAvLyBTcGVjIGRvZXNuJ3QgZGVmaW5lIGFueSBzcGVjaWFsIHBhcnNpbmcgb3IgZGV0ZWN0YWJsZSBVSVxuICAgICAgICAgICAgICAgICAgICAgIC8vICAgYmVoYXZpb3JzIHNvIHdlIHBhc3MgdGhlc2UgdGhyb3VnaCBhcyB0cnVlXG5cbiAgICAgICAgICAgICAgICAgICAgICAvLyBJbnRlcmVzdGluZ2x5LCBvcGVyYSBmYWlscyB0aGUgZWFybGllciB0ZXN0LCBzbyBpdCBkb2Vzbid0XG4gICAgICAgICAgICAgICAgICAgICAgLy8gIGV2ZW4gbWFrZSBpdCBoZXJlLlxuXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIC9eKHVybHxlbWFpbCkkLy50ZXN0KGlucHV0RWxlbVR5cGUpICkge1xuICAgICAgICAgICAgICAgICAgICAgIC8vIFJlYWwgdXJsIGFuZCBlbWFpbCBzdXBwb3J0IGNvbWVzIHdpdGggcHJlYmFrZWQgdmFsaWRhdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgICBib29sID0gaW5wdXRFbGVtLmNoZWNrVmFsaWRpdHkgJiYgaW5wdXRFbGVtLmNoZWNrVmFsaWRpdHkoKSA9PT0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgdXBncmFkZWQgaW5wdXQgY29tcG9udGVudCByZWplY3RzIHRoZSA6KSB0ZXh0LCB3ZSBnb3QgYSB3aW5uZXJcbiAgICAgICAgICAgICAgICAgICAgICBib29sID0gaW5wdXRFbGVtLnZhbHVlICE9IHNtaWxlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaW5wdXRzWyBwcm9wc1tpXSBdID0gISFib29sO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGlucHV0cztcbiAgICAgICAgfSkoJ3NlYXJjaCB0ZWwgdXJsIGVtYWlsIGRhdGV0aW1lIGRhdGUgbW9udGggd2VlayB0aW1lIGRhdGV0aW1lLWxvY2FsIG51bWJlciByYW5nZSBjb2xvcicuc3BsaXQoJyAnKSk7XG4gICAgICAgIC8qPj5pbnB1dHR5cGVzKi9cbiAgICB9XG4gICAgLyo+PndlYmZvcm1zKi9cblxuXG4gICAgLy8gRW5kIG9mIHRlc3QgZGVmaW5pdGlvbnNcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cblxuICAgIC8vIFJ1biB0aHJvdWdoIGFsbCB0ZXN0cyBhbmQgZGV0ZWN0IHRoZWlyIHN1cHBvcnQgaW4gdGhlIGN1cnJlbnQgVUEuXG4gICAgLy8gdG9kbzogaHlwb3RoZXRpY2FsbHkgd2UgY291bGQgYmUgZG9pbmcgYW4gYXJyYXkgb2YgdGVzdHMgYW5kIHVzZSBhIGJhc2ljIGxvb3AgaGVyZS5cbiAgICBmb3IgKCB2YXIgZmVhdHVyZSBpbiB0ZXN0cyApIHtcbiAgICAgICAgaWYgKCBoYXNPd25Qcm9wKHRlc3RzLCBmZWF0dXJlKSApIHtcbiAgICAgICAgICAgIC8vIHJ1biB0aGUgdGVzdCwgdGhyb3cgdGhlIHJldHVybiB2YWx1ZSBpbnRvIHRoZSBNb2Rlcm5penIsXG4gICAgICAgICAgICAvLyAgIHRoZW4gYmFzZWQgb24gdGhhdCBib29sZWFuLCBkZWZpbmUgYW4gYXBwcm9wcmlhdGUgY2xhc3NOYW1lXG4gICAgICAgICAgICAvLyAgIGFuZCBwdXNoIGl0IGludG8gYW4gYXJyYXkgb2YgY2xhc3NlcyB3ZSdsbCBqb2luIGxhdGVyLlxuICAgICAgICAgICAgZmVhdHVyZU5hbWUgID0gZmVhdHVyZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgTW9kZXJuaXpyW2ZlYXR1cmVOYW1lXSA9IHRlc3RzW2ZlYXR1cmVdKCk7XG5cbiAgICAgICAgICAgIGNsYXNzZXMucHVzaCgoTW9kZXJuaXpyW2ZlYXR1cmVOYW1lXSA/ICcnIDogJ25vLScpICsgZmVhdHVyZU5hbWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyo+PndlYmZvcm1zKi9cbiAgICAvLyBpbnB1dCB0ZXN0cyBuZWVkIHRvIHJ1bi5cbiAgICBNb2Rlcm5penIuaW5wdXQgfHwgd2ViZm9ybXMoKTtcbiAgICAvKj4+d2ViZm9ybXMqL1xuXG5cbiAgICAvKipcbiAgICAgKiBhZGRUZXN0IGFsbG93cyB0aGUgdXNlciB0byBkZWZpbmUgdGhlaXIgb3duIGZlYXR1cmUgdGVzdHNcbiAgICAgKiB0aGUgcmVzdWx0IHdpbGwgYmUgYWRkZWQgb250byB0aGUgTW9kZXJuaXpyIG9iamVjdCxcbiAgICAgKiBhcyB3ZWxsIGFzIGFuIGFwcHJvcHJpYXRlIGNsYXNzTmFtZSBzZXQgb24gdGhlIGh0bWwgZWxlbWVudFxuICAgICAqXG4gICAgICogQHBhcmFtIGZlYXR1cmUgLSBTdHJpbmcgbmFtaW5nIHRoZSBmZWF0dXJlXG4gICAgICogQHBhcmFtIHRlc3QgLSBGdW5jdGlvbiByZXR1cm5pbmcgdHJ1ZSBpZiBmZWF0dXJlIGlzIHN1cHBvcnRlZCwgZmFsc2UgaWYgbm90XG4gICAgICovXG4gICAgIE1vZGVybml6ci5hZGRUZXN0ID0gZnVuY3Rpb24gKCBmZWF0dXJlLCB0ZXN0ICkge1xuICAgICAgIGlmICggdHlwZW9mIGZlYXR1cmUgPT0gJ29iamVjdCcgKSB7XG4gICAgICAgICBmb3IgKCB2YXIga2V5IGluIGZlYXR1cmUgKSB7XG4gICAgICAgICAgIGlmICggaGFzT3duUHJvcCggZmVhdHVyZSwga2V5ICkgKSB7XG4gICAgICAgICAgICAgTW9kZXJuaXpyLmFkZFRlc3QoIGtleSwgZmVhdHVyZVsga2V5IF0gKTtcbiAgICAgICAgICAgfVxuICAgICAgICAgfVxuICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgIGZlYXR1cmUgPSBmZWF0dXJlLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgIGlmICggTW9kZXJuaXpyW2ZlYXR1cmVdICE9PSB1bmRlZmluZWQgKSB7XG4gICAgICAgICAgIC8vIHdlJ3JlIGdvaW5nIHRvIHF1aXQgaWYgeW91J3JlIHRyeWluZyB0byBvdmVyd3JpdGUgYW4gZXhpc3RpbmcgdGVzdFxuICAgICAgICAgICAvLyBpZiB3ZSB3ZXJlIHRvIGFsbG93IGl0LCB3ZSdkIGRvIHRoaXM6XG4gICAgICAgICAgIC8vICAgdmFyIHJlID0gbmV3IFJlZ0V4cChcIlxcXFxiKG5vLSk/XCIgKyBmZWF0dXJlICsgXCJcXFxcYlwiKTtcbiAgICAgICAgICAgLy8gICBkb2NFbGVtZW50LmNsYXNzTmFtZSA9IGRvY0VsZW1lbnQuY2xhc3NOYW1lLnJlcGxhY2UoIHJlLCAnJyApO1xuICAgICAgICAgICAvLyBidXQsIG5vIHJseSwgc3R1ZmYgJ2VtLlxuICAgICAgICAgICByZXR1cm4gTW9kZXJuaXpyO1xuICAgICAgICAgfVxuXG4gICAgICAgICB0ZXN0ID0gdHlwZW9mIHRlc3QgPT0gJ2Z1bmN0aW9uJyA/IHRlc3QoKSA6IHRlc3Q7XG5cbiAgICAgICAgIGlmICh0eXBlb2YgZW5hYmxlQ2xhc3NlcyAhPT0gXCJ1bmRlZmluZWRcIiAmJiBlbmFibGVDbGFzc2VzKSB7XG4gICAgICAgICAgIGRvY0VsZW1lbnQuY2xhc3NOYW1lICs9ICcgJyArICh0ZXN0ID8gJycgOiAnbm8tJykgKyBmZWF0dXJlO1xuICAgICAgICAgfVxuICAgICAgICAgTW9kZXJuaXpyW2ZlYXR1cmVdID0gdGVzdDtcblxuICAgICAgIH1cblxuICAgICAgIHJldHVybiBNb2Rlcm5penI7IC8vIGFsbG93IGNoYWluaW5nLlxuICAgICB9O1xuXG5cbiAgICAvLyBSZXNldCBtb2RFbGVtLmNzc1RleHQgdG8gbm90aGluZyB0byByZWR1Y2UgbWVtb3J5IGZvb3RwcmludC5cbiAgICBzZXRDc3MoJycpO1xuICAgIG1vZEVsZW0gPSBpbnB1dEVsZW0gPSBudWxsO1xuXG4gICAgLyo+PnNoaXYqL1xuICAgIC8qKlxuICAgICAqIEBwcmVzZXJ2ZSBIVE1MNSBTaGl2IHByZXYzLjcuMSB8IEBhZmFya2FzIEBqZGFsdG9uIEBqb25fbmVhbCBAcmVtIHwgTUlUL0dQTDIgTGljZW5zZWRcbiAgICAgKi9cbiAgICA7KGZ1bmN0aW9uKHdpbmRvdywgZG9jdW1lbnQpIHtcbiAgICAgICAgLypqc2hpbnQgZXZpbDp0cnVlICovXG4gICAgICAgIC8qKiB2ZXJzaW9uICovXG4gICAgICAgIHZhciB2ZXJzaW9uID0gJzMuNy4wJztcblxuICAgICAgICAvKiogUHJlc2V0IG9wdGlvbnMgKi9cbiAgICAgICAgdmFyIG9wdGlvbnMgPSB3aW5kb3cuaHRtbDUgfHwge307XG5cbiAgICAgICAgLyoqIFVzZWQgdG8gc2tpcCBwcm9ibGVtIGVsZW1lbnRzICovXG4gICAgICAgIHZhciByZVNraXAgPSAvXjx8Xig/OmJ1dHRvbnxtYXB8c2VsZWN0fHRleHRhcmVhfG9iamVjdHxpZnJhbWV8b3B0aW9ufG9wdGdyb3VwKSQvaTtcblxuICAgICAgICAvKiogTm90IGFsbCBlbGVtZW50cyBjYW4gYmUgY2xvbmVkIGluIElFICoqL1xuICAgICAgICB2YXIgc2F2ZUNsb25lcyA9IC9eKD86YXxifGNvZGV8ZGl2fGZpZWxkc2V0fGgxfGgyfGgzfGg0fGg1fGg2fGl8bGFiZWx8bGl8b2x8cHxxfHNwYW58c3Ryb25nfHN0eWxlfHRhYmxlfHRib2R5fHRkfHRofHRyfHVsKSQvaTtcblxuICAgICAgICAvKiogRGV0ZWN0IHdoZXRoZXIgdGhlIGJyb3dzZXIgc3VwcG9ydHMgZGVmYXVsdCBodG1sNSBzdHlsZXMgKi9cbiAgICAgICAgdmFyIHN1cHBvcnRzSHRtbDVTdHlsZXM7XG5cbiAgICAgICAgLyoqIE5hbWUgb2YgdGhlIGV4cGFuZG8sIHRvIHdvcmsgd2l0aCBtdWx0aXBsZSBkb2N1bWVudHMgb3IgdG8gcmUtc2hpdiBvbmUgZG9jdW1lbnQgKi9cbiAgICAgICAgdmFyIGV4cGFuZG8gPSAnX2h0bWw1c2hpdic7XG5cbiAgICAgICAgLyoqIFRoZSBpZCBmb3IgdGhlIHRoZSBkb2N1bWVudHMgZXhwYW5kbyAqL1xuICAgICAgICB2YXIgZXhwYW5JRCA9IDA7XG5cbiAgICAgICAgLyoqIENhY2hlZCBkYXRhIGZvciBlYWNoIGRvY3VtZW50ICovXG4gICAgICAgIHZhciBleHBhbmRvRGF0YSA9IHt9O1xuXG4gICAgICAgIC8qKiBEZXRlY3Qgd2hldGhlciB0aGUgYnJvd3NlciBzdXBwb3J0cyB1bmtub3duIGVsZW1lbnRzICovXG4gICAgICAgIHZhciBzdXBwb3J0c1Vua25vd25FbGVtZW50cztcblxuICAgICAgICAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICAgICAgYS5pbm5lckhUTUwgPSAnPHh5ej48L3h5ej4nO1xuICAgICAgICAgICAgLy9pZiB0aGUgaGlkZGVuIHByb3BlcnR5IGlzIGltcGxlbWVudGVkIHdlIGNhbiBhc3N1bWUsIHRoYXQgdGhlIGJyb3dzZXIgc3VwcG9ydHMgYmFzaWMgSFRNTDUgU3R5bGVzXG4gICAgICAgICAgICBzdXBwb3J0c0h0bWw1U3R5bGVzID0gKCdoaWRkZW4nIGluIGEpO1xuXG4gICAgICAgICAgICBzdXBwb3J0c1Vua25vd25FbGVtZW50cyA9IGEuY2hpbGROb2Rlcy5sZW5ndGggPT0gMSB8fCAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIC8vIGFzc2lnbiBhIGZhbHNlIHBvc2l0aXZlIGlmIHVuYWJsZSB0byBzaGl2XG4gICAgICAgICAgICAgIChkb2N1bWVudC5jcmVhdGVFbGVtZW50KSgnYScpO1xuICAgICAgICAgICAgICB2YXIgZnJhZyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICB0eXBlb2YgZnJhZy5jbG9uZU5vZGUgPT0gJ3VuZGVmaW5lZCcgfHxcbiAgICAgICAgICAgICAgICB0eXBlb2YgZnJhZy5jcmVhdGVEb2N1bWVudEZyYWdtZW50ID09ICd1bmRlZmluZWQnIHx8XG4gICAgICAgICAgICAgICAgdHlwZW9mIGZyYWcuY3JlYXRlRWxlbWVudCA9PSAndW5kZWZpbmVkJ1xuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSgpKTtcbiAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgIC8vIGFzc2lnbiBhIGZhbHNlIHBvc2l0aXZlIGlmIGRldGVjdGlvbiBmYWlscyA9PiB1bmFibGUgdG8gc2hpdlxuICAgICAgICAgICAgc3VwcG9ydHNIdG1sNVN0eWxlcyA9IHRydWU7XG4gICAgICAgICAgICBzdXBwb3J0c1Vua25vd25FbGVtZW50cyA9IHRydWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgIH0oKSk7XG5cbiAgICAgICAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENyZWF0ZXMgYSBzdHlsZSBzaGVldCB3aXRoIHRoZSBnaXZlbiBDU1MgdGV4dCBhbmQgYWRkcyBpdCB0byB0aGUgZG9jdW1lbnQuXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqIEBwYXJhbSB7RG9jdW1lbnR9IG93bmVyRG9jdW1lbnQgVGhlIGRvY3VtZW50LlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gY3NzVGV4dCBUaGUgQ1NTIHRleHQuXG4gICAgICAgICAqIEByZXR1cm5zIHtTdHlsZVNoZWV0fSBUaGUgc3R5bGUgZWxlbWVudC5cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGFkZFN0eWxlU2hlZXQob3duZXJEb2N1bWVudCwgY3NzVGV4dCkge1xuICAgICAgICAgIHZhciBwID0gb3duZXJEb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyksXG4gICAgICAgICAgcGFyZW50ID0gb3duZXJEb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdIHx8IG93bmVyRG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuXG4gICAgICAgICAgcC5pbm5lckhUTUwgPSAneDxzdHlsZT4nICsgY3NzVGV4dCArICc8L3N0eWxlPic7XG4gICAgICAgICAgcmV0dXJuIHBhcmVudC5pbnNlcnRCZWZvcmUocC5sYXN0Q2hpbGQsIHBhcmVudC5maXJzdENoaWxkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm5zIHRoZSB2YWx1ZSBvZiBgaHRtbDUuZWxlbWVudHNgIGFzIGFuIGFycmF5LlxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKiBAcmV0dXJucyB7QXJyYXl9IEFuIGFycmF5IG9mIHNoaXZlZCBlbGVtZW50IG5vZGUgbmFtZXMuXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBnZXRFbGVtZW50cygpIHtcbiAgICAgICAgICB2YXIgZWxlbWVudHMgPSBodG1sNS5lbGVtZW50cztcbiAgICAgICAgICByZXR1cm4gdHlwZW9mIGVsZW1lbnRzID09ICdzdHJpbmcnID8gZWxlbWVudHMuc3BsaXQoJyAnKSA6IGVsZW1lbnRzO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybnMgdGhlIGRhdGEgYXNzb2NpYXRlZCB0byB0aGUgZ2l2ZW4gZG9jdW1lbnRcbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICogQHBhcmFtIHtEb2N1bWVudH0gb3duZXJEb2N1bWVudCBUaGUgZG9jdW1lbnQuXG4gICAgICAgICAqIEByZXR1cm5zIHtPYmplY3R9IEFuIG9iamVjdCBvZiBkYXRhLlxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gZ2V0RXhwYW5kb0RhdGEob3duZXJEb2N1bWVudCkge1xuICAgICAgICAgIHZhciBkYXRhID0gZXhwYW5kb0RhdGFbb3duZXJEb2N1bWVudFtleHBhbmRvXV07XG4gICAgICAgICAgaWYgKCFkYXRhKSB7XG4gICAgICAgICAgICBkYXRhID0ge307XG4gICAgICAgICAgICBleHBhbklEKys7XG4gICAgICAgICAgICBvd25lckRvY3VtZW50W2V4cGFuZG9dID0gZXhwYW5JRDtcbiAgICAgICAgICAgIGV4cGFuZG9EYXRhW2V4cGFuSURdID0gZGF0YTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogcmV0dXJucyBhIHNoaXZlZCBlbGVtZW50IGZvciB0aGUgZ2l2ZW4gbm9kZU5hbWUgYW5kIGRvY3VtZW50XG4gICAgICAgICAqIEBtZW1iZXJPZiBodG1sNVxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gbm9kZU5hbWUgbmFtZSBvZiB0aGUgZWxlbWVudFxuICAgICAgICAgKiBAcGFyYW0ge0RvY3VtZW50fSBvd25lckRvY3VtZW50IFRoZSBjb250ZXh0IGRvY3VtZW50LlxuICAgICAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBUaGUgc2hpdmVkIGVsZW1lbnQuXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBjcmVhdGVFbGVtZW50KG5vZGVOYW1lLCBvd25lckRvY3VtZW50LCBkYXRhKXtcbiAgICAgICAgICBpZiAoIW93bmVyRG9jdW1lbnQpIHtcbiAgICAgICAgICAgIG93bmVyRG9jdW1lbnQgPSBkb2N1bWVudDtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYoc3VwcG9ydHNVbmtub3duRWxlbWVudHMpe1xuICAgICAgICAgICAgcmV0dXJuIG93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudChub2RlTmFtZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghZGF0YSkge1xuICAgICAgICAgICAgZGF0YSA9IGdldEV4cGFuZG9EYXRhKG93bmVyRG9jdW1lbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgbm9kZTtcblxuICAgICAgICAgIGlmIChkYXRhLmNhY2hlW25vZGVOYW1lXSkge1xuICAgICAgICAgICAgbm9kZSA9IGRhdGEuY2FjaGVbbm9kZU5hbWVdLmNsb25lTm9kZSgpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoc2F2ZUNsb25lcy50ZXN0KG5vZGVOYW1lKSkge1xuICAgICAgICAgICAgbm9kZSA9IChkYXRhLmNhY2hlW25vZGVOYW1lXSA9IGRhdGEuY3JlYXRlRWxlbShub2RlTmFtZSkpLmNsb25lTm9kZSgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBub2RlID0gZGF0YS5jcmVhdGVFbGVtKG5vZGVOYW1lKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBBdm9pZCBhZGRpbmcgc29tZSBlbGVtZW50cyB0byBmcmFnbWVudHMgaW4gSUUgPCA5IGJlY2F1c2VcbiAgICAgICAgICAvLyAqIEF0dHJpYnV0ZXMgbGlrZSBgbmFtZWAgb3IgYHR5cGVgIGNhbm5vdCBiZSBzZXQvY2hhbmdlZCBvbmNlIGFuIGVsZW1lbnRcbiAgICAgICAgICAvLyAgIGlzIGluc2VydGVkIGludG8gYSBkb2N1bWVudC9mcmFnbWVudFxuICAgICAgICAgIC8vICogTGluayBlbGVtZW50cyB3aXRoIGBzcmNgIGF0dHJpYnV0ZXMgdGhhdCBhcmUgaW5hY2Nlc3NpYmxlLCBhcyB3aXRoXG4gICAgICAgICAgLy8gICBhIDQwMyByZXNwb25zZSwgd2lsbCBjYXVzZSB0aGUgdGFiL3dpbmRvdyB0byBjcmFzaFxuICAgICAgICAgIC8vICogU2NyaXB0IGVsZW1lbnRzIGFwcGVuZGVkIHRvIGZyYWdtZW50cyB3aWxsIGV4ZWN1dGUgd2hlbiB0aGVpciBgc3JjYFxuICAgICAgICAgIC8vICAgb3IgYHRleHRgIHByb3BlcnR5IGlzIHNldFxuICAgICAgICAgIHJldHVybiBub2RlLmNhbkhhdmVDaGlsZHJlbiAmJiAhcmVTa2lwLnRlc3Qobm9kZU5hbWUpICYmICFub2RlLnRhZ1VybiA/IGRhdGEuZnJhZy5hcHBlbmRDaGlsZChub2RlKSA6IG5vZGU7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogcmV0dXJucyBhIHNoaXZlZCBEb2N1bWVudEZyYWdtZW50IGZvciB0aGUgZ2l2ZW4gZG9jdW1lbnRcbiAgICAgICAgICogQG1lbWJlck9mIGh0bWw1XG4gICAgICAgICAqIEBwYXJhbSB7RG9jdW1lbnR9IG93bmVyRG9jdW1lbnQgVGhlIGNvbnRleHQgZG9jdW1lbnQuXG4gICAgICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFRoZSBzaGl2ZWQgRG9jdW1lbnRGcmFnbWVudC5cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZURvY3VtZW50RnJhZ21lbnQob3duZXJEb2N1bWVudCwgZGF0YSl7XG4gICAgICAgICAgaWYgKCFvd25lckRvY3VtZW50KSB7XG4gICAgICAgICAgICBvd25lckRvY3VtZW50ID0gZG9jdW1lbnQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKHN1cHBvcnRzVW5rbm93bkVsZW1lbnRzKXtcbiAgICAgICAgICAgIHJldHVybiBvd25lckRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZGF0YSA9IGRhdGEgfHwgZ2V0RXhwYW5kb0RhdGEob3duZXJEb2N1bWVudCk7XG4gICAgICAgICAgdmFyIGNsb25lID0gZGF0YS5mcmFnLmNsb25lTm9kZSgpLFxuICAgICAgICAgIGkgPSAwLFxuICAgICAgICAgIGVsZW1zID0gZ2V0RWxlbWVudHMoKSxcbiAgICAgICAgICBsID0gZWxlbXMubGVuZ3RoO1xuICAgICAgICAgIGZvcig7aTxsO2krKyl7XG4gICAgICAgICAgICBjbG9uZS5jcmVhdGVFbGVtZW50KGVsZW1zW2ldKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGNsb25lO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNoaXZzIHRoZSBgY3JlYXRlRWxlbWVudGAgYW5kIGBjcmVhdGVEb2N1bWVudEZyYWdtZW50YCBtZXRob2RzIG9mIHRoZSBkb2N1bWVudC5cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICogQHBhcmFtIHtEb2N1bWVudHxEb2N1bWVudEZyYWdtZW50fSBvd25lckRvY3VtZW50IFRoZSBkb2N1bWVudC5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgb2YgdGhlIGRvY3VtZW50LlxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gc2hpdk1ldGhvZHMob3duZXJEb2N1bWVudCwgZGF0YSkge1xuICAgICAgICAgIGlmICghZGF0YS5jYWNoZSkge1xuICAgICAgICAgICAgZGF0YS5jYWNoZSA9IHt9O1xuICAgICAgICAgICAgZGF0YS5jcmVhdGVFbGVtID0gb3duZXJEb2N1bWVudC5jcmVhdGVFbGVtZW50O1xuICAgICAgICAgICAgZGF0YS5jcmVhdGVGcmFnID0gb3duZXJEb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50O1xuICAgICAgICAgICAgZGF0YS5mcmFnID0gZGF0YS5jcmVhdGVGcmFnKCk7XG4gICAgICAgICAgfVxuXG5cbiAgICAgICAgICBvd25lckRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbihub2RlTmFtZSkge1xuICAgICAgICAgICAgLy9hYm9ydCBzaGl2XG4gICAgICAgICAgICBpZiAoIWh0bWw1LnNoaXZNZXRob2RzKSB7XG4gICAgICAgICAgICAgIHJldHVybiBkYXRhLmNyZWF0ZUVsZW0obm9kZU5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNyZWF0ZUVsZW1lbnQobm9kZU5hbWUsIG93bmVyRG9jdW1lbnQsIGRhdGEpO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICBvd25lckRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQgPSBGdW5jdGlvbignaCxmJywgJ3JldHVybiBmdW5jdGlvbigpeycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd2YXIgbj1mLmNsb25lTm9kZSgpLGM9bi5jcmVhdGVFbGVtZW50OycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdoLnNoaXZNZXRob2RzJiYoJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdW5yb2xsIHRoZSBgY3JlYXRlRWxlbWVudGAgY2FsbHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRFbGVtZW50cygpLmpvaW4oKS5yZXBsYWNlKC9bXFx3XFwtXSsvZywgZnVuY3Rpb24obm9kZU5hbWUpIHtcbiAgICAgICAgICAgIGRhdGEuY3JlYXRlRWxlbShub2RlTmFtZSk7XG4gICAgICAgICAgICBkYXRhLmZyYWcuY3JlYXRlRWxlbWVudChub2RlTmFtZSk7XG4gICAgICAgICAgICByZXR1cm4gJ2MoXCInICsgbm9kZU5hbWUgKyAnXCIpJztcbiAgICAgICAgICB9KSArXG4gICAgICAgICAgICAnKTtyZXR1cm4gbn0nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApKGh0bWw1LCBkYXRhLmZyYWcpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNoaXZzIHRoZSBnaXZlbiBkb2N1bWVudC5cbiAgICAgICAgICogQG1lbWJlck9mIGh0bWw1XG4gICAgICAgICAqIEBwYXJhbSB7RG9jdW1lbnR9IG93bmVyRG9jdW1lbnQgVGhlIGRvY3VtZW50IHRvIHNoaXYuXG4gICAgICAgICAqIEByZXR1cm5zIHtEb2N1bWVudH0gVGhlIHNoaXZlZCBkb2N1bWVudC5cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIHNoaXZEb2N1bWVudChvd25lckRvY3VtZW50KSB7XG4gICAgICAgICAgaWYgKCFvd25lckRvY3VtZW50KSB7XG4gICAgICAgICAgICBvd25lckRvY3VtZW50ID0gZG9jdW1lbnQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBkYXRhID0gZ2V0RXhwYW5kb0RhdGEob3duZXJEb2N1bWVudCk7XG5cbiAgICAgICAgICBpZiAoaHRtbDUuc2hpdkNTUyAmJiAhc3VwcG9ydHNIdG1sNVN0eWxlcyAmJiAhZGF0YS5oYXNDU1MpIHtcbiAgICAgICAgICAgIGRhdGEuaGFzQ1NTID0gISFhZGRTdHlsZVNoZWV0KG93bmVyRG9jdW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb3JyZWN0cyBibG9jayBkaXNwbGF5IG5vdCBkZWZpbmVkIGluIElFNi83LzgvOVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2FydGljbGUsYXNpZGUsZGlhbG9nLGZpZ2NhcHRpb24sZmlndXJlLGZvb3RlcixoZWFkZXIsaGdyb3VwLG1haW4sbmF2LHNlY3Rpb257ZGlzcGxheTpibG9ja30nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYWRkcyBzdHlsaW5nIG5vdCBwcmVzZW50IGluIElFNi83LzgvOVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbWFya3tiYWNrZ3JvdW5kOiNGRjA7Y29sb3I6IzAwMH0nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaGlkZXMgbm9uLXJlbmRlcmVkIGVsZW1lbnRzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd0ZW1wbGF0ZXtkaXNwbGF5Om5vbmV9J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIXN1cHBvcnRzVW5rbm93bkVsZW1lbnRzKSB7XG4gICAgICAgICAgICBzaGl2TWV0aG9kcyhvd25lckRvY3VtZW50LCBkYXRhKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG93bmVyRG9jdW1lbnQ7XG4gICAgICAgIH1cblxuICAgICAgICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGBodG1sNWAgb2JqZWN0IGlzIGV4cG9zZWQgc28gdGhhdCBtb3JlIGVsZW1lbnRzIGNhbiBiZSBzaGl2ZWQgYW5kXG4gICAgICAgICAqIGV4aXN0aW5nIHNoaXZpbmcgY2FuIGJlIGRldGVjdGVkIG9uIGlmcmFtZXMuXG4gICAgICAgICAqIEB0eXBlIE9iamVjdFxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKlxuICAgICAgICAgKiAvLyBvcHRpb25zIGNhbiBiZSBjaGFuZ2VkIGJlZm9yZSB0aGUgc2NyaXB0IGlzIGluY2x1ZGVkXG4gICAgICAgICAqIGh0bWw1ID0geyAnZWxlbWVudHMnOiAnbWFyayBzZWN0aW9uJywgJ3NoaXZDU1MnOiBmYWxzZSwgJ3NoaXZNZXRob2RzJzogZmFsc2UgfTtcbiAgICAgICAgICovXG4gICAgICAgIHZhciBodG1sNSA9IHtcblxuICAgICAgICAgIC8qKlxuICAgICAgICAgICAqIEFuIGFycmF5IG9yIHNwYWNlIHNlcGFyYXRlZCBzdHJpbmcgb2Ygbm9kZSBuYW1lcyBvZiB0aGUgZWxlbWVudHMgdG8gc2hpdi5cbiAgICAgICAgICAgKiBAbWVtYmVyT2YgaHRtbDVcbiAgICAgICAgICAgKiBAdHlwZSBBcnJheXxTdHJpbmdcbiAgICAgICAgICAgKi9cbiAgICAgICAgICAnZWxlbWVudHMnOiBvcHRpb25zLmVsZW1lbnRzIHx8ICdhYmJyIGFydGljbGUgYXNpZGUgYXVkaW8gYmRpIGNhbnZhcyBkYXRhIGRhdGFsaXN0IGRldGFpbHMgZGlhbG9nIGZpZ2NhcHRpb24gZmlndXJlIGZvb3RlciBoZWFkZXIgaGdyb3VwIG1haW4gbWFyayBtZXRlciBuYXYgb3V0cHV0IHByb2dyZXNzIHNlY3Rpb24gc3VtbWFyeSB0ZW1wbGF0ZSB0aW1lIHZpZGVvJyxcblxuICAgICAgICAgIC8qKlxuICAgICAgICAgICAqIGN1cnJlbnQgdmVyc2lvbiBvZiBodG1sNXNoaXZcbiAgICAgICAgICAgKi9cbiAgICAgICAgICAndmVyc2lvbic6IHZlcnNpb24sXG5cbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBBIGZsYWcgdG8gaW5kaWNhdGUgdGhhdCB0aGUgSFRNTDUgc3R5bGUgc2hlZXQgc2hvdWxkIGJlIGluc2VydGVkLlxuICAgICAgICAgICAqIEBtZW1iZXJPZiBodG1sNVxuICAgICAgICAgICAqIEB0eXBlIEJvb2xlYW5cbiAgICAgICAgICAgKi9cbiAgICAgICAgICAnc2hpdkNTUyc6IChvcHRpb25zLnNoaXZDU1MgIT09IGZhbHNlKSxcblxuICAgICAgICAgIC8qKlxuICAgICAgICAgICAqIElzIGVxdWFsIHRvIHRydWUgaWYgYSBicm93c2VyIHN1cHBvcnRzIGNyZWF0aW5nIHVua25vd24vSFRNTDUgZWxlbWVudHNcbiAgICAgICAgICAgKiBAbWVtYmVyT2YgaHRtbDVcbiAgICAgICAgICAgKiBAdHlwZSBib29sZWFuXG4gICAgICAgICAgICovXG4gICAgICAgICAgJ3N1cHBvcnRzVW5rbm93bkVsZW1lbnRzJzogc3VwcG9ydHNVbmtub3duRWxlbWVudHMsXG5cbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBBIGZsYWcgdG8gaW5kaWNhdGUgdGhhdCB0aGUgZG9jdW1lbnQncyBgY3JlYXRlRWxlbWVudGAgYW5kIGBjcmVhdGVEb2N1bWVudEZyYWdtZW50YFxuICAgICAgICAgICAqIG1ldGhvZHMgc2hvdWxkIGJlIG92ZXJ3cml0dGVuLlxuICAgICAgICAgICAqIEBtZW1iZXJPZiBodG1sNVxuICAgICAgICAgICAqIEB0eXBlIEJvb2xlYW5cbiAgICAgICAgICAgKi9cbiAgICAgICAgICAnc2hpdk1ldGhvZHMnOiAob3B0aW9ucy5zaGl2TWV0aG9kcyAhPT0gZmFsc2UpLFxuXG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogQSBzdHJpbmcgdG8gZGVzY3JpYmUgdGhlIHR5cGUgb2YgYGh0bWw1YCBvYmplY3QgKFwiZGVmYXVsdFwiIG9yIFwiZGVmYXVsdCBwcmludFwiKS5cbiAgICAgICAgICAgKiBAbWVtYmVyT2YgaHRtbDVcbiAgICAgICAgICAgKiBAdHlwZSBTdHJpbmdcbiAgICAgICAgICAgKi9cbiAgICAgICAgICAndHlwZSc6ICdkZWZhdWx0JyxcblxuICAgICAgICAgIC8vIHNoaXZzIHRoZSBkb2N1bWVudCBhY2NvcmRpbmcgdG8gdGhlIHNwZWNpZmllZCBgaHRtbDVgIG9iamVjdCBvcHRpb25zXG4gICAgICAgICAgJ3NoaXZEb2N1bWVudCc6IHNoaXZEb2N1bWVudCxcblxuICAgICAgICAgIC8vY3JlYXRlcyBhIHNoaXZlZCBlbGVtZW50XG4gICAgICAgICAgY3JlYXRlRWxlbWVudDogY3JlYXRlRWxlbWVudCxcblxuICAgICAgICAgIC8vY3JlYXRlcyBhIHNoaXZlZCBkb2N1bWVudEZyYWdtZW50XG4gICAgICAgICAgY3JlYXRlRG9jdW1lbnRGcmFnbWVudDogY3JlYXRlRG9jdW1lbnRGcmFnbWVudFxuICAgICAgICB9O1xuXG4gICAgICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gICAgICAgIC8vIGV4cG9zZSBodG1sNVxuICAgICAgICB3aW5kb3cuaHRtbDUgPSBodG1sNTtcblxuICAgICAgICAvLyBzaGl2IHRoZSBkb2N1bWVudFxuICAgICAgICBzaGl2RG9jdW1lbnQoZG9jdW1lbnQpO1xuXG4gICAgfSh0aGlzLCBkb2N1bWVudCkpO1xuICAgIC8qPj5zaGl2Ki9cblxuICAgIC8vIEFzc2lnbiBwcml2YXRlIHByb3BlcnRpZXMgdG8gdGhlIHJldHVybiBvYmplY3Qgd2l0aCBwcmVmaXhcbiAgICBNb2Rlcm5penIuX3ZlcnNpb24gICAgICA9IHZlcnNpb247XG5cbiAgICAvLyBleHBvc2UgdGhlc2UgZm9yIHRoZSBwbHVnaW4gQVBJLiBMb29rIGluIHRoZSBzb3VyY2UgZm9yIGhvdyB0byBqb2luKCkgdGhlbSBhZ2FpbnN0IHlvdXIgaW5wdXRcbiAgICAvKj4+cHJlZml4ZXMqL1xuICAgIE1vZGVybml6ci5fcHJlZml4ZXMgICAgID0gcHJlZml4ZXM7XG4gICAgLyo+PnByZWZpeGVzKi9cbiAgICAvKj4+ZG9tcHJlZml4ZXMqL1xuICAgIE1vZGVybml6ci5fZG9tUHJlZml4ZXMgID0gZG9tUHJlZml4ZXM7XG4gICAgTW9kZXJuaXpyLl9jc3NvbVByZWZpeGVzICA9IGNzc29tUHJlZml4ZXM7XG4gICAgLyo+PmRvbXByZWZpeGVzKi9cblxuICAgIC8qPj5tcSovXG4gICAgLy8gTW9kZXJuaXpyLm1xIHRlc3RzIGEgZ2l2ZW4gbWVkaWEgcXVlcnksIGxpdmUgYWdhaW5zdCB0aGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgd2luZG93XG4gICAgLy8gQSBmZXcgaW1wb3J0YW50IG5vdGVzOlxuICAgIC8vICAgKiBJZiBhIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCBtZWRpYSBxdWVyaWVzIGF0IGFsbCAoZWcuIG9sZElFKSB0aGUgbXEoKSB3aWxsIGFsd2F5cyByZXR1cm4gZmFsc2VcbiAgICAvLyAgICogQSBtYXgtd2lkdGggb3Igb3JpZW50YXRpb24gcXVlcnkgd2lsbCBiZSBldmFsdWF0ZWQgYWdhaW5zdCB0aGUgY3VycmVudCBzdGF0ZSwgd2hpY2ggbWF5IGNoYW5nZSBsYXRlci5cbiAgICAvLyAgICogWW91IG11c3Qgc3BlY2lmeSB2YWx1ZXMuIEVnLiBJZiB5b3UgYXJlIHRlc3Rpbmcgc3VwcG9ydCBmb3IgdGhlIG1pbi13aWR0aCBtZWRpYSBxdWVyeSB1c2U6XG4gICAgLy8gICAgICAgTW9kZXJuaXpyLm1xKCcobWluLXdpZHRoOjApJylcbiAgICAvLyB1c2FnZTpcbiAgICAvLyBNb2Rlcm5penIubXEoJ29ubHkgc2NyZWVuIGFuZCAobWF4LXdpZHRoOjc2OCknKVxuICAgIE1vZGVybml6ci5tcSAgICAgICAgICAgID0gdGVzdE1lZGlhUXVlcnk7XG4gICAgLyo+Pm1xKi9cblxuICAgIC8qPj5oYXNldmVudCovXG4gICAgLy8gTW9kZXJuaXpyLmhhc0V2ZW50KCkgZGV0ZWN0cyBzdXBwb3J0IGZvciBhIGdpdmVuIGV2ZW50LCB3aXRoIGFuIG9wdGlvbmFsIGVsZW1lbnQgdG8gdGVzdCBvblxuICAgIC8vIE1vZGVybml6ci5oYXNFdmVudCgnZ2VzdHVyZXN0YXJ0JywgZWxlbSlcbiAgICBNb2Rlcm5penIuaGFzRXZlbnQgICAgICA9IGlzRXZlbnRTdXBwb3J0ZWQ7XG4gICAgLyo+Pmhhc2V2ZW50Ki9cblxuICAgIC8qPj50ZXN0cHJvcCovXG4gICAgLy8gTW9kZXJuaXpyLnRlc3RQcm9wKCkgaW52ZXN0aWdhdGVzIHdoZXRoZXIgYSBnaXZlbiBzdHlsZSBwcm9wZXJ0eSBpcyByZWNvZ25pemVkXG4gICAgLy8gTm90ZSB0aGF0IHRoZSBwcm9wZXJ0eSBuYW1lcyBtdXN0IGJlIHByb3ZpZGVkIGluIHRoZSBjYW1lbENhc2UgdmFyaWFudC5cbiAgICAvLyBNb2Rlcm5penIudGVzdFByb3AoJ3BvaW50ZXJFdmVudHMnKVxuICAgIE1vZGVybml6ci50ZXN0UHJvcCAgICAgID0gZnVuY3Rpb24ocHJvcCl7XG4gICAgICAgIHJldHVybiB0ZXN0UHJvcHMoW3Byb3BdKTtcbiAgICB9O1xuICAgIC8qPj50ZXN0cHJvcCovXG5cbiAgICAvKj4+dGVzdGFsbHByb3BzKi9cbiAgICAvLyBNb2Rlcm5penIudGVzdEFsbFByb3BzKCkgaW52ZXN0aWdhdGVzIHdoZXRoZXIgYSBnaXZlbiBzdHlsZSBwcm9wZXJ0eSxcbiAgICAvLyAgIG9yIGFueSBvZiBpdHMgdmVuZG9yLXByZWZpeGVkIHZhcmlhbnRzLCBpcyByZWNvZ25pemVkXG4gICAgLy8gTm90ZSB0aGF0IHRoZSBwcm9wZXJ0eSBuYW1lcyBtdXN0IGJlIHByb3ZpZGVkIGluIHRoZSBjYW1lbENhc2UgdmFyaWFudC5cbiAgICAvLyBNb2Rlcm5penIudGVzdEFsbFByb3BzKCdib3hTaXppbmcnKVxuICAgIE1vZGVybml6ci50ZXN0QWxsUHJvcHMgID0gdGVzdFByb3BzQWxsO1xuICAgIC8qPj50ZXN0YWxscHJvcHMqL1xuXG5cbiAgICAvKj4+dGVzdHN0eWxlcyovXG4gICAgLy8gTW9kZXJuaXpyLnRlc3RTdHlsZXMoKSBhbGxvd3MgeW91IHRvIGFkZCBjdXN0b20gc3R5bGVzIHRvIHRoZSBkb2N1bWVudCBhbmQgdGVzdCBhbiBlbGVtZW50IGFmdGVyd2FyZHNcbiAgICAvLyBNb2Rlcm5penIudGVzdFN0eWxlcygnI21vZGVybml6ciB7IHBvc2l0aW9uOmFic29sdXRlIH0nLCBmdW5jdGlvbihlbGVtLCBydWxlKXsgLi4uIH0pXG4gICAgTW9kZXJuaXpyLnRlc3RTdHlsZXMgICAgPSBpbmplY3RFbGVtZW50V2l0aFN0eWxlcztcbiAgICAvKj4+dGVzdHN0eWxlcyovXG5cblxuICAgIC8qPj5wcmVmaXhlZCovXG4gICAgLy8gTW9kZXJuaXpyLnByZWZpeGVkKCkgcmV0dXJucyB0aGUgcHJlZml4ZWQgb3Igbm9ucHJlZml4ZWQgcHJvcGVydHkgbmFtZSB2YXJpYW50IG9mIHlvdXIgaW5wdXRcbiAgICAvLyBNb2Rlcm5penIucHJlZml4ZWQoJ2JveFNpemluZycpIC8vICdNb3pCb3hTaXppbmcnXG5cbiAgICAvLyBQcm9wZXJ0aWVzIG11c3QgYmUgcGFzc2VkIGFzIGRvbS1zdHlsZSBjYW1lbGNhc2UsIHJhdGhlciB0aGFuIGBib3gtc2l6aW5nYCBoeXBlbnRhdGVkIHN0eWxlLlxuICAgIC8vIFJldHVybiB2YWx1ZXMgd2lsbCBhbHNvIGJlIHRoZSBjYW1lbENhc2UgdmFyaWFudCwgaWYgeW91IG5lZWQgdG8gdHJhbnNsYXRlIHRoYXQgdG8gaHlwZW5hdGVkIHN0eWxlIHVzZTpcbiAgICAvL1xuICAgIC8vICAgICBzdHIucmVwbGFjZSgvKFtBLVpdKS9nLCBmdW5jdGlvbihzdHIsbTEpeyByZXR1cm4gJy0nICsgbTEudG9Mb3dlckNhc2UoKTsgfSkucmVwbGFjZSgvXm1zLS8sJy1tcy0nKTtcblxuICAgIC8vIElmIHlvdSdyZSB0cnlpbmcgdG8gYXNjZXJ0YWluIHdoaWNoIHRyYW5zaXRpb24gZW5kIGV2ZW50IHRvIGJpbmQgdG8sIHlvdSBtaWdodCBkbyBzb21ldGhpbmcgbGlrZS4uLlxuICAgIC8vXG4gICAgLy8gICAgIHZhciB0cmFuc0VuZEV2ZW50TmFtZXMgPSB7XG4gICAgLy8gICAgICAgJ1dlYmtpdFRyYW5zaXRpb24nIDogJ3dlYmtpdFRyYW5zaXRpb25FbmQnLFxuICAgIC8vICAgICAgICdNb3pUcmFuc2l0aW9uJyAgICA6ICd0cmFuc2l0aW9uZW5kJyxcbiAgICAvLyAgICAgICAnT1RyYW5zaXRpb24nICAgICAgOiAnb1RyYW5zaXRpb25FbmQnLFxuICAgIC8vICAgICAgICdtc1RyYW5zaXRpb24nICAgICA6ICdNU1RyYW5zaXRpb25FbmQnLFxuICAgIC8vICAgICAgICd0cmFuc2l0aW9uJyAgICAgICA6ICd0cmFuc2l0aW9uZW5kJ1xuICAgIC8vICAgICB9LFxuICAgIC8vICAgICB0cmFuc0VuZEV2ZW50TmFtZSA9IHRyYW5zRW5kRXZlbnROYW1lc1sgTW9kZXJuaXpyLnByZWZpeGVkKCd0cmFuc2l0aW9uJykgXTtcblxuICAgIE1vZGVybml6ci5wcmVmaXhlZCAgICAgID0gZnVuY3Rpb24ocHJvcCwgb2JqLCBlbGVtKXtcbiAgICAgIGlmKCFvYmopIHtcbiAgICAgICAgcmV0dXJuIHRlc3RQcm9wc0FsbChwcm9wLCAncGZ4Jyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBUZXN0aW5nIERPTSBwcm9wZXJ0eSBlLmcuIE1vZGVybml6ci5wcmVmaXhlZCgncmVxdWVzdEFuaW1hdGlvbkZyYW1lJywgd2luZG93KSAvLyAnbW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lJ1xuICAgICAgICByZXR1cm4gdGVzdFByb3BzQWxsKHByb3AsIG9iaiwgZWxlbSk7XG4gICAgICB9XG4gICAgfTtcbiAgICAvKj4+cHJlZml4ZWQqL1xuXG5cbiAgICAvKj4+Y3NzY2xhc3NlcyovXG4gICAgLy8gUmVtb3ZlIFwibm8tanNcIiBjbGFzcyBmcm9tIDxodG1sPiBlbGVtZW50LCBpZiBpdCBleGlzdHM6XG4gICAgZG9jRWxlbWVudC5jbGFzc05hbWUgPSBkb2NFbGVtZW50LmNsYXNzTmFtZS5yZXBsYWNlKC8oXnxcXHMpbm8tanMoXFxzfCQpLywgJyQxJDInKSArXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGQgdGhlIG5ldyBjbGFzc2VzIHRvIHRoZSA8aHRtbD4gZWxlbWVudC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZW5hYmxlQ2xhc3NlcyA/ICcganMgJyArIGNsYXNzZXMuam9pbignICcpIDogJycpO1xuICAgIC8qPj5jc3NjbGFzc2VzKi9cblxuICAgIHJldHVybiBNb2Rlcm5penI7XG5cbn0pKHRoaXMsIHRoaXMuZG9jdW1lbnQpO1xuIiwiLypcbiAqIEZvdW5kYXRpb24gUmVzcG9uc2l2ZSBMaWJyYXJ5XG4gKiBodHRwOi8vZm91bmRhdGlvbi56dXJiLmNvbVxuICogQ29weXJpZ2h0IDIwMTQsIFpVUkJcbiAqIEZyZWUgdG8gdXNlIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiAqIGh0dHA6Ly93d3cub3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvbWl0LWxpY2Vuc2UucGhwXG4qL1xuXG4oZnVuY3Rpb24gKCQsIHdpbmRvdywgZG9jdW1lbnQsIHVuZGVmaW5lZCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIGhlYWRlcl9oZWxwZXJzID0gZnVuY3Rpb24gKGNsYXNzX2FycmF5KSB7XG4gICAgdmFyIGkgPSBjbGFzc19hcnJheS5sZW5ndGg7XG4gICAgdmFyIGhlYWQgPSAkKCdoZWFkJyk7XG5cbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICBpZihoZWFkLmhhcygnLicgKyBjbGFzc19hcnJheVtpXSkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGhlYWQuYXBwZW5kKCc8bWV0YSBjbGFzcz1cIicgKyBjbGFzc19hcnJheVtpXSArICdcIiAvPicpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBoZWFkZXJfaGVscGVycyhbXG4gICAgJ2ZvdW5kYXRpb24tbXEtc21hbGwnLFxuICAgICdmb3VuZGF0aW9uLW1xLW1lZGl1bScsXG4gICAgJ2ZvdW5kYXRpb24tbXEtbGFyZ2UnLFxuICAgICdmb3VuZGF0aW9uLW1xLXhsYXJnZScsXG4gICAgJ2ZvdW5kYXRpb24tbXEteHhsYXJnZScsXG4gICAgJ2ZvdW5kYXRpb24tZGF0YS1hdHRyaWJ1dGUtbmFtZXNwYWNlJ10pO1xuXG4gIC8vIEVuYWJsZSBGYXN0Q2xpY2sgaWYgcHJlc2VudFxuXG4gICQoZnVuY3Rpb24oKSB7XG4gICAgaWYgKHR5cGVvZiBGYXN0Q2xpY2sgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAvLyBEb24ndCBhdHRhY2ggdG8gYm9keSBpZiB1bmRlZmluZWRcbiAgICAgIGlmICh0eXBlb2YgZG9jdW1lbnQuYm9keSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgRmFzdENsaWNrLmF0dGFjaChkb2N1bWVudC5ib2R5KTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIC8vIHByaXZhdGUgRmFzdCBTZWxlY3RvciB3cmFwcGVyLFxuICAvLyByZXR1cm5zIGpRdWVyeSBvYmplY3QuIE9ubHkgdXNlIHdoZXJlXG4gIC8vIGdldEVsZW1lbnRCeUlkIGlzIG5vdCBhdmFpbGFibGUuXG4gIHZhciBTID0gZnVuY3Rpb24gKHNlbGVjdG9yLCBjb250ZXh0KSB7XG4gICAgaWYgKHR5cGVvZiBzZWxlY3RvciA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGlmIChjb250ZXh0KSB7XG4gICAgICAgIHZhciBjb250O1xuICAgICAgICBpZiAoY29udGV4dC5qcXVlcnkpIHtcbiAgICAgICAgICBjb250ID0gY29udGV4dFswXTtcbiAgICAgICAgICBpZiAoIWNvbnQpIHJldHVybiBjb250ZXh0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnQgPSBjb250ZXh0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAkKGNvbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcikpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gJChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuICQoc2VsZWN0b3IsIGNvbnRleHQpO1xuICB9O1xuXG4gIC8vIE5hbWVzcGFjZSBmdW5jdGlvbnMuXG5cbiAgdmFyIGF0dHJfbmFtZSA9IGZ1bmN0aW9uIChpbml0KSB7XG4gICAgdmFyIGFyciA9IFtdO1xuICAgIGlmICghaW5pdCkgYXJyLnB1c2goJ2RhdGEnKTtcbiAgICBpZiAodGhpcy5uYW1lc3BhY2UubGVuZ3RoID4gMCkgYXJyLnB1c2godGhpcy5uYW1lc3BhY2UpO1xuICAgIGFyci5wdXNoKHRoaXMubmFtZSk7XG5cbiAgICByZXR1cm4gYXJyLmpvaW4oJy0nKTtcbiAgfTtcblxuICB2YXIgYWRkX25hbWVzcGFjZSA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgICB2YXIgcGFydHMgPSBzdHIuc3BsaXQoJy0nKSxcbiAgICAgICAgaSA9IHBhcnRzLmxlbmd0aCxcbiAgICAgICAgYXJyID0gW107XG5cbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICBpZiAoaSAhPT0gMCkge1xuICAgICAgICBhcnIucHVzaChwYXJ0c1tpXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodGhpcy5uYW1lc3BhY2UubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGFyci5wdXNoKHRoaXMubmFtZXNwYWNlLCBwYXJ0c1tpXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYXJyLnB1c2gocGFydHNbaV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGFyci5yZXZlcnNlKCkuam9pbignLScpO1xuICB9O1xuXG4gIC8vIEV2ZW50IGJpbmRpbmcgYW5kIGRhdGEtb3B0aW9ucyB1cGRhdGluZy5cblxuICB2YXIgYmluZGluZ3MgPSBmdW5jdGlvbiAobWV0aG9kLCBvcHRpb25zKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgICBzaG91bGRfYmluZF9ldmVudHMgPSAhUyh0aGlzKS5kYXRhKHRoaXMuYXR0cl9uYW1lKHRydWUpKTtcblxuXG4gICAgaWYgKFModGhpcy5zY29wZSkuaXMoJ1snICsgdGhpcy5hdHRyX25hbWUoKSArJ10nKSkge1xuICAgICAgUyh0aGlzLnNjb3BlKS5kYXRhKHRoaXMuYXR0cl9uYW1lKHRydWUpICsgJy1pbml0JywgJC5leHRlbmQoe30sIHRoaXMuc2V0dGluZ3MsIChvcHRpb25zIHx8IG1ldGhvZCksIHRoaXMuZGF0YV9vcHRpb25zKFModGhpcy5zY29wZSkpKSk7XG5cbiAgICAgIGlmIChzaG91bGRfYmluZF9ldmVudHMpIHtcbiAgICAgICAgdGhpcy5ldmVudHModGhpcy5zY29wZSk7XG4gICAgICB9XG5cbiAgICB9IGVsc2Uge1xuICAgICAgUygnWycgKyB0aGlzLmF0dHJfbmFtZSgpICsnXScsIHRoaXMuc2NvcGUpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgc2hvdWxkX2JpbmRfZXZlbnRzID0gIVModGhpcykuZGF0YShzZWxmLmF0dHJfbmFtZSh0cnVlKSArICctaW5pdCcpO1xuICAgICAgICBTKHRoaXMpLmRhdGEoc2VsZi5hdHRyX25hbWUodHJ1ZSkgKyAnLWluaXQnLCAkLmV4dGVuZCh7fSwgc2VsZi5zZXR0aW5ncywgKG9wdGlvbnMgfHwgbWV0aG9kKSwgc2VsZi5kYXRhX29wdGlvbnMoUyh0aGlzKSkpKTtcblxuICAgICAgICBpZiAoc2hvdWxkX2JpbmRfZXZlbnRzKSB7XG4gICAgICAgICAgc2VsZi5ldmVudHModGhpcyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICAvLyAjIFBhdGNoIHRvIGZpeCAjNTA0MyB0byBtb3ZlIHRoaXMgKmFmdGVyKiB0aGUgaWYvZWxzZSBjbGF1c2UgaW4gb3JkZXIgZm9yIEJhY2tib25lIGFuZCBzaW1pbGFyIGZyYW1ld29ya3MgdG8gaGF2ZSBpbXByb3ZlZCBjb250cm9sIG92ZXIgZXZlbnQgYmluZGluZyBhbmQgZGF0YS1vcHRpb25zIHVwZGF0aW5nLlxuICAgIGlmICh0eXBlb2YgbWV0aG9kID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIHRoaXNbbWV0aG9kXS5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuICAgIH1cblxuICB9O1xuXG4gIHZhciBzaW5nbGVfaW1hZ2VfbG9hZGVkID0gZnVuY3Rpb24gKGltYWdlLCBjYWxsYmFjaykge1xuICAgIGZ1bmN0aW9uIGxvYWRlZCAoKSB7XG4gICAgICBjYWxsYmFjayhpbWFnZVswXSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYmluZExvYWQgKCkge1xuICAgICAgdGhpcy5vbmUoJ2xvYWQnLCBsb2FkZWQpO1xuXG4gICAgICBpZiAoL01TSUUgKFxcZCtcXC5cXGQrKTsvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIHtcbiAgICAgICAgdmFyIHNyYyA9IHRoaXMuYXR0ciggJ3NyYycgKSxcbiAgICAgICAgICAgIHBhcmFtID0gc3JjLm1hdGNoKCAvXFw/LyApID8gJyYnIDogJz8nO1xuXG4gICAgICAgIHBhcmFtICs9ICdyYW5kb209JyArIChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gICAgICAgIHRoaXMuYXR0cignc3JjJywgc3JjICsgcGFyYW0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghaW1hZ2UuYXR0cignc3JjJykpIHtcbiAgICAgIGxvYWRlZCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChpbWFnZVswXS5jb21wbGV0ZSB8fCBpbWFnZVswXS5yZWFkeVN0YXRlID09PSA0KSB7XG4gICAgICBsb2FkZWQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYmluZExvYWQuY2FsbChpbWFnZSk7XG4gICAgfVxuICB9O1xuXG4gIC8qXG4gICAgaHR0cHM6Ly9naXRodWIuY29tL3BhdWxpcmlzaC9tYXRjaE1lZGlhLmpzXG4gICovXG5cbiAgd2luZG93Lm1hdGNoTWVkaWEgPSB3aW5kb3cubWF0Y2hNZWRpYSB8fCAoZnVuY3Rpb24oIGRvYyApIHtcblxuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgdmFyIGJvb2wsXG4gICAgICAgIGRvY0VsZW0gPSBkb2MuZG9jdW1lbnRFbGVtZW50LFxuICAgICAgICByZWZOb2RlID0gZG9jRWxlbS5maXJzdEVsZW1lbnRDaGlsZCB8fCBkb2NFbGVtLmZpcnN0Q2hpbGQsXG4gICAgICAgIC8vIGZha2VCb2R5IHJlcXVpcmVkIGZvciA8RkY0IHdoZW4gZXhlY3V0ZWQgaW4gPGhlYWQ+XG4gICAgICAgIGZha2VCb2R5ID0gZG9jLmNyZWF0ZUVsZW1lbnQoIFwiYm9keVwiICksXG4gICAgICAgIGRpdiA9IGRvYy5jcmVhdGVFbGVtZW50KCBcImRpdlwiICk7XG5cbiAgICBkaXYuaWQgPSBcIm1xLXRlc3QtMVwiO1xuICAgIGRpdi5zdHlsZS5jc3NUZXh0ID0gXCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6LTEwMGVtXCI7XG4gICAgZmFrZUJvZHkuc3R5bGUuYmFja2dyb3VuZCA9IFwibm9uZVwiO1xuICAgIGZha2VCb2R5LmFwcGVuZENoaWxkKGRpdik7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKHEpIHtcblxuICAgICAgZGl2LmlubmVySFRNTCA9IFwiJnNoeTs8c3R5bGUgbWVkaWE9XFxcIlwiICsgcSArIFwiXFxcIj4gI21xLXRlc3QtMSB7IHdpZHRoOiA0MnB4OyB9PC9zdHlsZT5cIjtcblxuICAgICAgZG9jRWxlbS5pbnNlcnRCZWZvcmUoIGZha2VCb2R5LCByZWZOb2RlICk7XG4gICAgICBib29sID0gZGl2Lm9mZnNldFdpZHRoID09PSA0MjtcbiAgICAgIGRvY0VsZW0ucmVtb3ZlQ2hpbGQoIGZha2VCb2R5ICk7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIG1hdGNoZXM6IGJvb2wsXG4gICAgICAgIG1lZGlhOiBxXG4gICAgICB9O1xuXG4gICAgfTtcblxuICB9KCBkb2N1bWVudCApKTtcblxuICAvKlxuICAgKiBqcXVlcnkucmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4gICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9nbmFyZjM3L2pxdWVyeS1yZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAgICogUmVxdWlyZXMgalF1ZXJ5IDEuOCtcbiAgICpcbiAgICogQ29weXJpZ2h0IChjKSAyMDEyIENvcmV5IEZyYW5nXG4gICAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiAgICovXG5cbiAgKGZ1bmN0aW9uKCQpIHtcblxuICAvLyByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgcG9seWZpbGwgYWRhcHRlZCBmcm9tIEVyaWsgTcO2bGxlclxuICAvLyBmaXhlcyBmcm9tIFBhdWwgSXJpc2ggYW5kIFRpbm8gWmlqZGVsXG4gIC8vIGh0dHA6Ly9wYXVsaXJpc2guY29tLzIwMTEvcmVxdWVzdGFuaW1hdGlvbmZyYW1lLWZvci1zbWFydC1hbmltYXRpbmcvXG4gIC8vIGh0dHA6Ly9teS5vcGVyYS5jb20vZW1vbGxlci9ibG9nLzIwMTEvMTIvMjAvcmVxdWVzdGFuaW1hdGlvbmZyYW1lLWZvci1zbWFydC1lci1hbmltYXRpbmdcblxuICB2YXIgYW5pbWF0aW5nLFxuICAgICAgbGFzdFRpbWUgPSAwLFxuICAgICAgdmVuZG9ycyA9IFsnd2Via2l0JywgJ21veiddLFxuICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSxcbiAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lID0gd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lLFxuICAgICAganF1ZXJ5RnhBdmFpbGFibGUgPSAndW5kZWZpbmVkJyAhPT0gdHlwZW9mIGpRdWVyeS5meDtcblxuICBmb3IgKDsgbGFzdFRpbWUgPCB2ZW5kb3JzLmxlbmd0aCAmJiAhcmVxdWVzdEFuaW1hdGlvbkZyYW1lOyBsYXN0VGltZSsrKSB7XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93WyB2ZW5kb3JzW2xhc3RUaW1lXSArIFwiUmVxdWVzdEFuaW1hdGlvbkZyYW1lXCIgXTtcbiAgICBjYW5jZWxBbmltYXRpb25GcmFtZSA9IGNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgICB3aW5kb3dbIHZlbmRvcnNbbGFzdFRpbWVdICsgXCJDYW5jZWxBbmltYXRpb25GcmFtZVwiIF0gfHxcbiAgICAgIHdpbmRvd1sgdmVuZG9yc1tsYXN0VGltZV0gKyBcIkNhbmNlbFJlcXVlc3RBbmltYXRpb25GcmFtZVwiIF07XG4gIH1cblxuICBmdW5jdGlvbiByYWYoKSB7XG4gICAgaWYgKGFuaW1hdGluZykge1xuICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJhZik7XG5cbiAgICAgIGlmIChqcXVlcnlGeEF2YWlsYWJsZSkge1xuICAgICAgICBqUXVlcnkuZngudGljaygpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChyZXF1ZXN0QW5pbWF0aW9uRnJhbWUpIHtcbiAgICAvLyB1c2UgckFGXG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHJlcXVlc3RBbmltYXRpb25GcmFtZTtcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBjYW5jZWxBbmltYXRpb25GcmFtZTtcblxuICAgIGlmIChqcXVlcnlGeEF2YWlsYWJsZSkge1xuICAgICAgalF1ZXJ5LmZ4LnRpbWVyID0gZnVuY3Rpb24gKHRpbWVyKSB7XG4gICAgICAgIGlmICh0aW1lcigpICYmIGpRdWVyeS50aW1lcnMucHVzaCh0aW1lcikgJiYgIWFuaW1hdGluZykge1xuICAgICAgICAgIGFuaW1hdGluZyA9IHRydWU7XG4gICAgICAgICAgcmFmKCk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGpRdWVyeS5meC5zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBhbmltYXRpbmcgPSBmYWxzZTtcbiAgICAgIH07XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIHBvbHlmaWxsXG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgdmFyIGN1cnJUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCksXG4gICAgICAgIHRpbWVUb0NhbGwgPSBNYXRoLm1heCgwLCAxNiAtIChjdXJyVGltZSAtIGxhc3RUaW1lKSksXG4gICAgICAgIGlkID0gd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNhbGxiYWNrKGN1cnJUaW1lICsgdGltZVRvQ2FsbCk7XG4gICAgICAgIH0sIHRpbWVUb0NhbGwpO1xuICAgICAgbGFzdFRpbWUgPSBjdXJyVGltZSArIHRpbWVUb0NhbGw7XG4gICAgICByZXR1cm4gaWQ7XG4gICAgfTtcblxuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgY2xlYXJUaW1lb3V0KGlkKTtcbiAgICB9O1xuXG4gIH1cblxuICB9KCBqUXVlcnkgKSk7XG5cblxuICBmdW5jdGlvbiByZW1vdmVRdW90ZXMgKHN0cmluZykge1xuICAgIGlmICh0eXBlb2Ygc3RyaW5nID09PSAnc3RyaW5nJyB8fCBzdHJpbmcgaW5zdGFuY2VvZiBTdHJpbmcpIHtcbiAgICAgIHN0cmluZyA9IHN0cmluZy5yZXBsYWNlKC9eWydcXFxcL1wiXSt8KDtcXHM/fSkrfFsnXFxcXC9cIl0rJC9nLCAnJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0cmluZztcbiAgfVxuXG4gIHdpbmRvdy5Gb3VuZGF0aW9uID0ge1xuICAgIG5hbWUgOiAnRm91bmRhdGlvbicsXG5cbiAgICB2ZXJzaW9uIDogJzUuNC41JyxcblxuICAgIG1lZGlhX3F1ZXJpZXMgOiB7XG4gICAgICBzbWFsbCA6IFMoJy5mb3VuZGF0aW9uLW1xLXNtYWxsJykuY3NzKCdmb250LWZhbWlseScpLnJlcGxhY2UoL15bXFwvXFxcXCdcIl0rfCg7XFxzP30pK3xbXFwvXFxcXCdcIl0rJC9nLCAnJyksXG4gICAgICBtZWRpdW0gOiBTKCcuZm91bmRhdGlvbi1tcS1tZWRpdW0nKS5jc3MoJ2ZvbnQtZmFtaWx5JykucmVwbGFjZSgvXltcXC9cXFxcJ1wiXSt8KDtcXHM/fSkrfFtcXC9cXFxcJ1wiXSskL2csICcnKSxcbiAgICAgIGxhcmdlIDogUygnLmZvdW5kYXRpb24tbXEtbGFyZ2UnKS5jc3MoJ2ZvbnQtZmFtaWx5JykucmVwbGFjZSgvXltcXC9cXFxcJ1wiXSt8KDtcXHM/fSkrfFtcXC9cXFxcJ1wiXSskL2csICcnKSxcbiAgICAgIHhsYXJnZTogUygnLmZvdW5kYXRpb24tbXEteGxhcmdlJykuY3NzKCdmb250LWZhbWlseScpLnJlcGxhY2UoL15bXFwvXFxcXCdcIl0rfCg7XFxzP30pK3xbXFwvXFxcXCdcIl0rJC9nLCAnJyksXG4gICAgICB4eGxhcmdlOiBTKCcuZm91bmRhdGlvbi1tcS14eGxhcmdlJykuY3NzKCdmb250LWZhbWlseScpLnJlcGxhY2UoL15bXFwvXFxcXCdcIl0rfCg7XFxzP30pK3xbXFwvXFxcXCdcIl0rJC9nLCAnJylcbiAgICB9LFxuXG4gICAgc3R5bGVzaGVldCA6ICQoJzxzdHlsZT48L3N0eWxlPicpLmFwcGVuZFRvKCdoZWFkJylbMF0uc2hlZXQsXG5cbiAgICBnbG9iYWw6IHtcbiAgICAgIG5hbWVzcGFjZTogdW5kZWZpbmVkXG4gICAgfSxcblxuICAgIGluaXQgOiBmdW5jdGlvbiAoc2NvcGUsIGxpYnJhcmllcywgbWV0aG9kLCBvcHRpb25zLCByZXNwb25zZSkge1xuICAgICAgdmFyIGFyZ3MgPSBbc2NvcGUsIG1ldGhvZCwgb3B0aW9ucywgcmVzcG9uc2VdLFxuICAgICAgICAgIHJlc3BvbnNlcyA9IFtdO1xuXG4gICAgICAvLyBjaGVjayBSVExcbiAgICAgIHRoaXMucnRsID0gL3J0bC9pLnRlc3QoUygnaHRtbCcpLmF0dHIoJ2RpcicpKTtcblxuICAgICAgLy8gc2V0IGZvdW5kYXRpb24gZ2xvYmFsIHNjb3BlXG4gICAgICB0aGlzLnNjb3BlID0gc2NvcGUgfHwgdGhpcy5zY29wZTtcblxuICAgICAgdGhpcy5zZXRfbmFtZXNwYWNlKCk7XG5cbiAgICAgIGlmIChsaWJyYXJpZXMgJiYgdHlwZW9mIGxpYnJhcmllcyA9PT0gJ3N0cmluZycgJiYgIS9yZWZsb3cvaS50ZXN0KGxpYnJhcmllcykpIHtcbiAgICAgICAgaWYgKHRoaXMubGlicy5oYXNPd25Qcm9wZXJ0eShsaWJyYXJpZXMpKSB7XG4gICAgICAgICAgcmVzcG9uc2VzLnB1c2godGhpcy5pbml0X2xpYihsaWJyYXJpZXMsIGFyZ3MpKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yICh2YXIgbGliIGluIHRoaXMubGlicykge1xuICAgICAgICAgIHJlc3BvbnNlcy5wdXNoKHRoaXMuaW5pdF9saWIobGliLCBsaWJyYXJpZXMpKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBTKHdpbmRvdykubG9hZChmdW5jdGlvbigpe1xuICAgICAgICBTKHdpbmRvdylcbiAgICAgICAgICAudHJpZ2dlcigncmVzaXplLmZuZHRuLmNsZWFyaW5nJylcbiAgICAgICAgICAudHJpZ2dlcigncmVzaXplLmZuZHRuLmRyb3Bkb3duJylcbiAgICAgICAgICAudHJpZ2dlcigncmVzaXplLmZuZHRuLmVxdWFsaXplcicpXG4gICAgICAgICAgLnRyaWdnZXIoJ3Jlc2l6ZS5mbmR0bi5pbnRlcmNoYW5nZScpXG4gICAgICAgICAgLnRyaWdnZXIoJ3Jlc2l6ZS5mbmR0bi5qb3lyaWRlJylcbiAgICAgICAgICAudHJpZ2dlcigncmVzaXplLmZuZHRuLm1hZ2VsbGFuJylcbiAgICAgICAgICAudHJpZ2dlcigncmVzaXplLmZuZHRuLnRvcGJhcicpXG4gICAgICAgICAgLnRyaWdnZXIoJ3Jlc2l6ZS5mbmR0bi5zbGlkZXInKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gc2NvcGU7XG4gICAgfSxcblxuICAgIGluaXRfbGliIDogZnVuY3Rpb24gKGxpYiwgYXJncykge1xuICAgICAgaWYgKHRoaXMubGlicy5oYXNPd25Qcm9wZXJ0eShsaWIpKSB7XG4gICAgICAgIHRoaXMucGF0Y2godGhpcy5saWJzW2xpYl0pO1xuXG4gICAgICAgIGlmIChhcmdzICYmIGFyZ3MuaGFzT3duUHJvcGVydHkobGliKSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmxpYnNbbGliXS5zZXR0aW5ncyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAkLmV4dGVuZCh0cnVlLCB0aGlzLmxpYnNbbGliXS5zZXR0aW5ncywgYXJnc1tsaWJdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiB0aGlzLmxpYnNbbGliXS5kZWZhdWx0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAkLmV4dGVuZCh0cnVlLCB0aGlzLmxpYnNbbGliXS5kZWZhdWx0cywgYXJnc1tsaWJdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdGhpcy5saWJzW2xpYl0uaW5pdC5hcHBseSh0aGlzLmxpYnNbbGliXSwgW3RoaXMuc2NvcGUsIGFyZ3NbbGliXV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgYXJncyA9IGFyZ3MgaW5zdGFuY2VvZiBBcnJheSA/IGFyZ3MgOiBuZXcgQXJyYXkoYXJncyk7ICAgIC8vIFBBVENIOiBhZGRlZCB0aGlzIGxpbmVcbiAgICAgICAgcmV0dXJuIHRoaXMubGlic1tsaWJdLmluaXQuYXBwbHkodGhpcy5saWJzW2xpYl0sIGFyZ3MpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKCkge307XG4gICAgfSxcblxuICAgIHBhdGNoIDogZnVuY3Rpb24gKGxpYikge1xuICAgICAgbGliLnNjb3BlID0gdGhpcy5zY29wZTtcbiAgICAgIGxpYi5uYW1lc3BhY2UgPSB0aGlzLmdsb2JhbC5uYW1lc3BhY2U7XG4gICAgICBsaWIucnRsID0gdGhpcy5ydGw7XG4gICAgICBsaWJbJ2RhdGFfb3B0aW9ucyddID0gdGhpcy51dGlscy5kYXRhX29wdGlvbnM7XG4gICAgICBsaWJbJ2F0dHJfbmFtZSddID0gYXR0cl9uYW1lO1xuICAgICAgbGliWydhZGRfbmFtZXNwYWNlJ10gPSBhZGRfbmFtZXNwYWNlO1xuICAgICAgbGliWydiaW5kaW5ncyddID0gYmluZGluZ3M7XG4gICAgICBsaWJbJ1MnXSA9IHRoaXMudXRpbHMuUztcbiAgICB9LFxuXG4gICAgaW5oZXJpdCA6IGZ1bmN0aW9uIChzY29wZSwgbWV0aG9kcykge1xuICAgICAgdmFyIG1ldGhvZHNfYXJyID0gbWV0aG9kcy5zcGxpdCgnICcpLFxuICAgICAgICAgIGkgPSBtZXRob2RzX2Fyci5sZW5ndGg7XG5cbiAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgaWYgKHRoaXMudXRpbHMuaGFzT3duUHJvcGVydHkobWV0aG9kc19hcnJbaV0pKSB7XG4gICAgICAgICAgc2NvcGVbbWV0aG9kc19hcnJbaV1dID0gdGhpcy51dGlsc1ttZXRob2RzX2FycltpXV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuXG4gICAgc2V0X25hbWVzcGFjZTogZnVuY3Rpb24gKCkge1xuXG4gICAgICAvLyBEZXNjcmlwdGlvbjpcbiAgICAgIC8vICAgIERvbid0IGJvdGhlciByZWFkaW5nIHRoZSBuYW1lc3BhY2Ugb3V0IG9mIHRoZSBtZXRhIHRhZ1xuICAgICAgLy8gICAgaWYgdGhlIG5hbWVzcGFjZSBoYXMgYmVlbiBzZXQgZ2xvYmFsbHkgaW4gamF2YXNjcmlwdFxuICAgICAgLy9cbiAgICAgIC8vIEV4YW1wbGU6XG4gICAgICAvLyAgICBGb3VuZGF0aW9uLmdsb2JhbC5uYW1lc3BhY2UgPSAnbXktbmFtZXNwYWNlJztcbiAgICAgIC8vIG9yIG1ha2UgaXQgYW4gZW1wdHkgc3RyaW5nOlxuICAgICAgLy8gICAgRm91bmRhdGlvbi5nbG9iYWwubmFtZXNwYWNlID0gJyc7XG4gICAgICAvL1xuICAgICAgLy9cblxuICAgICAgLy8gSWYgdGhlIG5hbWVzcGFjZSBoYXMgbm90IGJlZW4gc2V0IChpcyB1bmRlZmluZWQpLCB0cnkgdG8gcmVhZCBpdCBvdXQgb2YgdGhlIG1ldGEgZWxlbWVudC5cbiAgICAgIC8vIE90aGVyd2lzZSB1c2UgdGhlIGdsb2JhbGx5IGRlZmluZWQgbmFtZXNwYWNlLCBldmVuIGlmIGl0J3MgZW1wdHkgKCcnKVxuICAgICAgdmFyIG5hbWVzcGFjZSA9ICggdGhpcy5nbG9iYWwubmFtZXNwYWNlID09PSB1bmRlZmluZWQgKSA/ICQoJy5mb3VuZGF0aW9uLWRhdGEtYXR0cmlidXRlLW5hbWVzcGFjZScpLmNzcygnZm9udC1mYW1pbHknKSA6IHRoaXMuZ2xvYmFsLm5hbWVzcGFjZTtcblxuICAgICAgLy8gRmluYWxseSwgaWYgdGhlIG5hbXNlcGFjZSBpcyBlaXRoZXIgdW5kZWZpbmVkIG9yIGZhbHNlLCBzZXQgaXQgdG8gYW4gZW1wdHkgc3RyaW5nLlxuICAgICAgLy8gT3RoZXJ3aXNlIHVzZSB0aGUgbmFtZXNwYWNlIHZhbHVlLlxuICAgICAgdGhpcy5nbG9iYWwubmFtZXNwYWNlID0gKCBuYW1lc3BhY2UgPT09IHVuZGVmaW5lZCB8fCAvZmFsc2UvaS50ZXN0KG5hbWVzcGFjZSkgKSA/ICcnIDogbmFtZXNwYWNlO1xuICAgIH0sXG5cbiAgICBsaWJzIDoge30sXG5cbiAgICAvLyBtZXRob2RzIHRoYXQgY2FuIGJlIGluaGVyaXRlZCBpbiBsaWJyYXJpZXNcbiAgICB1dGlscyA6IHtcblxuICAgICAgLy8gRGVzY3JpcHRpb246XG4gICAgICAvLyAgICBGYXN0IFNlbGVjdG9yIHdyYXBwZXIgcmV0dXJucyBqUXVlcnkgb2JqZWN0LiBPbmx5IHVzZSB3aGVyZSBnZXRFbGVtZW50QnlJZFxuICAgICAgLy8gICAgaXMgbm90IGF2YWlsYWJsZS5cbiAgICAgIC8vXG4gICAgICAvLyBBcmd1bWVudHM6XG4gICAgICAvLyAgICBTZWxlY3RvciAoU3RyaW5nKTogQ1NTIHNlbGVjdG9yIGRlc2NyaWJpbmcgdGhlIGVsZW1lbnQocykgdG8gYmVcbiAgICAgIC8vICAgIHJldHVybmVkIGFzIGEgalF1ZXJ5IG9iamVjdC5cbiAgICAgIC8vXG4gICAgICAvLyAgICBTY29wZSAoU3RyaW5nKTogQ1NTIHNlbGVjdG9yIGRlc2NyaWJpbmcgdGhlIGFyZWEgdG8gYmUgc2VhcmNoZWQuIERlZmF1bHRcbiAgICAgIC8vICAgIGlzIGRvY3VtZW50LlxuICAgICAgLy9cbiAgICAgIC8vIFJldHVybnM6XG4gICAgICAvLyAgICBFbGVtZW50IChqUXVlcnkgT2JqZWN0KTogalF1ZXJ5IG9iamVjdCBjb250YWluaW5nIGVsZW1lbnRzIG1hdGNoaW5nIHRoZVxuICAgICAgLy8gICAgc2VsZWN0b3Igd2l0aGluIHRoZSBzY29wZS5cbiAgICAgIFMgOiBTLFxuXG4gICAgICAvLyBEZXNjcmlwdGlvbjpcbiAgICAgIC8vICAgIEV4ZWN1dGVzIGEgZnVuY3Rpb24gYSBtYXggb2Ygb25jZSBldmVyeSBuIG1pbGxpc2Vjb25kc1xuICAgICAgLy9cbiAgICAgIC8vIEFyZ3VtZW50czpcbiAgICAgIC8vICAgIEZ1bmMgKEZ1bmN0aW9uKTogRnVuY3Rpb24gdG8gYmUgdGhyb3R0bGVkLlxuICAgICAgLy9cbiAgICAgIC8vICAgIERlbGF5IChJbnRlZ2VyKTogRnVuY3Rpb24gZXhlY3V0aW9uIHRocmVzaG9sZCBpbiBtaWxsaXNlY29uZHMuXG4gICAgICAvL1xuICAgICAgLy8gUmV0dXJuczpcbiAgICAgIC8vICAgIExhenlfZnVuY3Rpb24gKEZ1bmN0aW9uKTogRnVuY3Rpb24gd2l0aCB0aHJvdHRsaW5nIGFwcGxpZWQuXG4gICAgICB0aHJvdHRsZSA6IGZ1bmN0aW9uIChmdW5jLCBkZWxheSkge1xuICAgICAgICB2YXIgdGltZXIgPSBudWxsO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdmFyIGNvbnRleHQgPSB0aGlzLCBhcmdzID0gYXJndW1lbnRzO1xuXG4gICAgICAgICAgaWYgKHRpbWVyID09IG51bGwpIHtcbiAgICAgICAgICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICAgIHRpbWVyID0gbnVsbDtcbiAgICAgICAgICAgIH0sIGRlbGF5KTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9LFxuXG4gICAgICAvLyBEZXNjcmlwdGlvbjpcbiAgICAgIC8vICAgIEV4ZWN1dGVzIGEgZnVuY3Rpb24gd2hlbiBpdCBzdG9wcyBiZWluZyBpbnZva2VkIGZvciBuIHNlY29uZHNcbiAgICAgIC8vICAgIE1vZGlmaWVkIHZlcnNpb24gb2YgXy5kZWJvdW5jZSgpIGh0dHA6Ly91bmRlcnNjb3JlanMub3JnXG4gICAgICAvL1xuICAgICAgLy8gQXJndW1lbnRzOlxuICAgICAgLy8gICAgRnVuYyAoRnVuY3Rpb24pOiBGdW5jdGlvbiB0byBiZSBkZWJvdW5jZWQuXG4gICAgICAvL1xuICAgICAgLy8gICAgRGVsYXkgKEludGVnZXIpOiBGdW5jdGlvbiBleGVjdXRpb24gdGhyZXNob2xkIGluIG1pbGxpc2Vjb25kcy5cbiAgICAgIC8vXG4gICAgICAvLyAgICBJbW1lZGlhdGUgKEJvb2wpOiBXaGV0aGVyIHRoZSBmdW5jdGlvbiBzaG91bGQgYmUgY2FsbGVkIGF0IHRoZSBiZWdpbm5pbmdcbiAgICAgIC8vICAgIG9mIHRoZSBkZWxheSBpbnN0ZWFkIG9mIHRoZSBlbmQuIERlZmF1bHQgaXMgZmFsc2UuXG4gICAgICAvL1xuICAgICAgLy8gUmV0dXJuczpcbiAgICAgIC8vICAgIExhenlfZnVuY3Rpb24gKEZ1bmN0aW9uKTogRnVuY3Rpb24gd2l0aCBkZWJvdW5jaW5nIGFwcGxpZWQuXG4gICAgICBkZWJvdW5jZSA6IGZ1bmN0aW9uIChmdW5jLCBkZWxheSwgaW1tZWRpYXRlKSB7XG4gICAgICAgIHZhciB0aW1lb3V0LCByZXN1bHQ7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdmFyIGNvbnRleHQgPSB0aGlzLCBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgICAgIHZhciBsYXRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICAgICAgaWYgKCFpbW1lZGlhdGUpIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgfTtcbiAgICAgICAgICB2YXIgY2FsbE5vdyA9IGltbWVkaWF0ZSAmJiAhdGltZW91dDtcbiAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIGRlbGF5KTtcbiAgICAgICAgICBpZiAoY2FsbE5vdykgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgICAgfSxcblxuICAgICAgLy8gRGVzY3JpcHRpb246XG4gICAgICAvLyAgICBQYXJzZXMgZGF0YS1vcHRpb25zIGF0dHJpYnV0ZVxuICAgICAgLy9cbiAgICAgIC8vIEFyZ3VtZW50czpcbiAgICAgIC8vICAgIEVsIChqUXVlcnkgT2JqZWN0KTogRWxlbWVudCB0byBiZSBwYXJzZWQuXG4gICAgICAvL1xuICAgICAgLy8gUmV0dXJuczpcbiAgICAgIC8vICAgIE9wdGlvbnMgKEphdmFzY3JpcHQgT2JqZWN0KTogQ29udGVudHMgb2YgdGhlIGVsZW1lbnQncyBkYXRhLW9wdGlvbnNcbiAgICAgIC8vICAgIGF0dHJpYnV0ZS5cbiAgICAgIGRhdGFfb3B0aW9ucyA6IGZ1bmN0aW9uIChlbCwgZGF0YV9hdHRyX25hbWUpIHtcbiAgICAgICAgZGF0YV9hdHRyX25hbWUgPSBkYXRhX2F0dHJfbmFtZSB8fCAnb3B0aW9ucyc7XG4gICAgICAgIHZhciBvcHRzID0ge30sIGlpLCBwLCBvcHRzX2FycixcbiAgICAgICAgICAgIGRhdGFfb3B0aW9ucyA9IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICB2YXIgbmFtZXNwYWNlID0gRm91bmRhdGlvbi5nbG9iYWwubmFtZXNwYWNlO1xuXG4gICAgICAgICAgICAgIGlmIChuYW1lc3BhY2UubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlbC5kYXRhKG5hbWVzcGFjZSArICctJyArIGRhdGFfYXR0cl9uYW1lKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHJldHVybiBlbC5kYXRhKGRhdGFfYXR0cl9uYW1lKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgdmFyIGNhY2hlZF9vcHRpb25zID0gZGF0YV9vcHRpb25zKGVsKTtcblxuICAgICAgICBpZiAodHlwZW9mIGNhY2hlZF9vcHRpb25zID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgIHJldHVybiBjYWNoZWRfb3B0aW9ucztcbiAgICAgICAgfVxuXG4gICAgICAgIG9wdHNfYXJyID0gKGNhY2hlZF9vcHRpb25zIHx8ICc6Jykuc3BsaXQoJzsnKTtcbiAgICAgICAgaWkgPSBvcHRzX2Fyci5sZW5ndGg7XG5cbiAgICAgICAgZnVuY3Rpb24gaXNOdW1iZXIgKG8pIHtcbiAgICAgICAgICByZXR1cm4gISBpc05hTiAoby0wKSAmJiBvICE9PSBudWxsICYmIG8gIT09IFwiXCIgJiYgbyAhPT0gZmFsc2UgJiYgbyAhPT0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHRyaW0gKHN0cikge1xuICAgICAgICAgIGlmICh0eXBlb2Ygc3RyID09PSAnc3RyaW5nJykgcmV0dXJuICQudHJpbShzdHIpO1xuICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICAgIH1cblxuICAgICAgICB3aGlsZSAoaWktLSkge1xuICAgICAgICAgIHAgPSBvcHRzX2FycltpaV0uc3BsaXQoJzonKTtcbiAgICAgICAgICBwID0gW3BbMF0sIHAuc2xpY2UoMSkuam9pbignOicpXTtcblxuICAgICAgICAgIGlmICgvdHJ1ZS9pLnRlc3QocFsxXSkpIHBbMV0gPSB0cnVlO1xuICAgICAgICAgIGlmICgvZmFsc2UvaS50ZXN0KHBbMV0pKSBwWzFdID0gZmFsc2U7XG4gICAgICAgICAgaWYgKGlzTnVtYmVyKHBbMV0pKSB7XG4gICAgICAgICAgICBpZiAocFsxXS5pbmRleE9mKCcuJykgPT09IC0xKSB7XG4gICAgICAgICAgICAgIHBbMV0gPSBwYXJzZUludChwWzFdLCAxMCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwWzFdID0gcGFyc2VGbG9hdChwWzFdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAocC5sZW5ndGggPT09IDIgJiYgcFswXS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBvcHRzW3RyaW0ocFswXSldID0gdHJpbShwWzFdKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb3B0cztcbiAgICAgIH0sXG5cbiAgICAgIC8vIERlc2NyaXB0aW9uOlxuICAgICAgLy8gICAgQWRkcyBKUy1yZWNvZ25pemFibGUgbWVkaWEgcXVlcmllc1xuICAgICAgLy9cbiAgICAgIC8vIEFyZ3VtZW50czpcbiAgICAgIC8vICAgIE1lZGlhIChTdHJpbmcpOiBLZXkgc3RyaW5nIGZvciB0aGUgbWVkaWEgcXVlcnkgdG8gYmUgc3RvcmVkIGFzIGluXG4gICAgICAvLyAgICBGb3VuZGF0aW9uLm1lZGlhX3F1ZXJpZXNcbiAgICAgIC8vXG4gICAgICAvLyAgICBDbGFzcyAoU3RyaW5nKTogQ2xhc3MgbmFtZSBmb3IgdGhlIGdlbmVyYXRlZCA8bWV0YT4gdGFnXG4gICAgICByZWdpc3Rlcl9tZWRpYSA6IGZ1bmN0aW9uIChtZWRpYSwgbWVkaWFfY2xhc3MpIHtcbiAgICAgICAgaWYoRm91bmRhdGlvbi5tZWRpYV9xdWVyaWVzW21lZGlhXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgJCgnaGVhZCcpLmFwcGVuZCgnPG1ldGEgY2xhc3M9XCInICsgbWVkaWFfY2xhc3MgKyAnXCIvPicpO1xuICAgICAgICAgIEZvdW5kYXRpb24ubWVkaWFfcXVlcmllc1ttZWRpYV0gPSByZW1vdmVRdW90ZXMoJCgnLicgKyBtZWRpYV9jbGFzcykuY3NzKCdmb250LWZhbWlseScpKTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgLy8gRGVzY3JpcHRpb246XG4gICAgICAvLyAgICBBZGQgY3VzdG9tIENTUyB3aXRoaW4gYSBKUy1kZWZpbmVkIG1lZGlhIHF1ZXJ5XG4gICAgICAvL1xuICAgICAgLy8gQXJndW1lbnRzOlxuICAgICAgLy8gICAgUnVsZSAoU3RyaW5nKTogQ1NTIHJ1bGUgdG8gYmUgYXBwZW5kZWQgdG8gdGhlIGRvY3VtZW50LlxuICAgICAgLy9cbiAgICAgIC8vICAgIE1lZGlhIChTdHJpbmcpOiBPcHRpb25hbCBtZWRpYSBxdWVyeSBzdHJpbmcgZm9yIHRoZSBDU1MgcnVsZSB0byBiZVxuICAgICAgLy8gICAgbmVzdGVkIHVuZGVyLlxuICAgICAgYWRkX2N1c3RvbV9ydWxlIDogZnVuY3Rpb24gKHJ1bGUsIG1lZGlhKSB7XG4gICAgICAgIGlmIChtZWRpYSA9PT0gdW5kZWZpbmVkICYmIEZvdW5kYXRpb24uc3R5bGVzaGVldCkge1xuICAgICAgICAgIEZvdW5kYXRpb24uc3R5bGVzaGVldC5pbnNlcnRSdWxlKHJ1bGUsIEZvdW5kYXRpb24uc3R5bGVzaGVldC5jc3NSdWxlcy5sZW5ndGgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBxdWVyeSA9IEZvdW5kYXRpb24ubWVkaWFfcXVlcmllc1ttZWRpYV07XG5cbiAgICAgICAgICBpZiAocXVlcnkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgRm91bmRhdGlvbi5zdHlsZXNoZWV0Lmluc2VydFJ1bGUoJ0BtZWRpYSAnICtcbiAgICAgICAgICAgICAgRm91bmRhdGlvbi5tZWRpYV9xdWVyaWVzW21lZGlhXSArICd7ICcgKyBydWxlICsgJyB9Jyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICAvLyBEZXNjcmlwdGlvbjpcbiAgICAgIC8vICAgIFBlcmZvcm1zIGEgY2FsbGJhY2sgZnVuY3Rpb24gd2hlbiBhbiBpbWFnZSBpcyBmdWxseSBsb2FkZWRcbiAgICAgIC8vXG4gICAgICAvLyBBcmd1bWVudHM6XG4gICAgICAvLyAgICBJbWFnZSAoalF1ZXJ5IE9iamVjdCk6IEltYWdlKHMpIHRvIGNoZWNrIGlmIGxvYWRlZC5cbiAgICAgIC8vXG4gICAgICAvLyAgICBDYWxsYmFjayAoRnVuY3Rpb24pOiBGdW5jdGlvbiB0byBleGVjdXRlIHdoZW4gaW1hZ2UgaXMgZnVsbHkgbG9hZGVkLlxuICAgICAgaW1hZ2VfbG9hZGVkIDogZnVuY3Rpb24gKGltYWdlcywgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgICAgICAgdW5sb2FkZWQgPSBpbWFnZXMubGVuZ3RoO1xuXG4gICAgICAgIGlmICh1bmxvYWRlZCA9PT0gMCkge1xuICAgICAgICAgIGNhbGxiYWNrKGltYWdlcyk7XG4gICAgICAgIH1cblxuICAgICAgICBpbWFnZXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgc2luZ2xlX2ltYWdlX2xvYWRlZChzZWxmLlModGhpcyksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHVubG9hZGVkIC09IDE7XG4gICAgICAgICAgICBpZiAodW5sb2FkZWQgPT09IDApIHtcbiAgICAgICAgICAgICAgY2FsbGJhY2soaW1hZ2VzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuXG4gICAgICAvLyBEZXNjcmlwdGlvbjpcbiAgICAgIC8vICAgIFJldHVybnMgYSByYW5kb20sIGFscGhhbnVtZXJpYyBzdHJpbmdcbiAgICAgIC8vXG4gICAgICAvLyBBcmd1bWVudHM6XG4gICAgICAvLyAgICBMZW5ndGggKEludGVnZXIpOiBMZW5ndGggb2Ygc3RyaW5nIHRvIGJlIGdlbmVyYXRlZC4gRGVmYXVsdHMgdG8gcmFuZG9tXG4gICAgICAvLyAgICBpbnRlZ2VyLlxuICAgICAgLy9cbiAgICAgIC8vIFJldHVybnM6XG4gICAgICAvLyAgICBSYW5kIChTdHJpbmcpOiBQc2V1ZG8tcmFuZG9tLCBhbHBoYW51bWVyaWMgc3RyaW5nLlxuICAgICAgcmFuZG9tX3N0ciA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmZpZHgpIHRoaXMuZmlkeCA9IDA7XG4gICAgICAgIHRoaXMucHJlZml4ID0gdGhpcy5wcmVmaXggfHwgWyh0aGlzLm5hbWUgfHwgJ0YnKSwgKCtuZXcgRGF0ZSkudG9TdHJpbmcoMzYpXS5qb2luKCctJyk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMucHJlZml4ICsgKHRoaXMuZmlkeCsrKS50b1N0cmluZygzNik7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gICQuZm4uZm91bmRhdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG5cbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIEZvdW5kYXRpb24uaW5pdC5hcHBseShGb3VuZGF0aW9uLCBbdGhpc10uY29uY2F0KGFyZ3MpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0pO1xuICB9O1xuXG59KGpRdWVyeSwgd2luZG93LCB3aW5kb3cuZG9jdW1lbnQpKTtcbiIsIjsoZnVuY3Rpb24gKCQsIHdpbmRvdywgZG9jdW1lbnQsIHVuZGVmaW5lZCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgRm91bmRhdGlvbi5saWJzLmRyb3Bkb3duID0ge1xuICAgIG5hbWUgOiAnZHJvcGRvd24nLFxuXG4gICAgdmVyc2lvbiA6ICc1LjQuNScsXG5cbiAgICBzZXR0aW5ncyA6IHtcbiAgICAgIGFjdGl2ZV9jbGFzczogJ29wZW4nLFxuICAgICAgbWVnYV9jbGFzczogJ21lZ2EnLFxuICAgICAgYWxpZ246ICdib3R0b20nLFxuICAgICAgaXNfaG92ZXI6IGZhbHNlLFxuICAgICAgb3BlbmVkOiBmdW5jdGlvbigpe30sXG4gICAgICBjbG9zZWQ6IGZ1bmN0aW9uKCl7fVxuICAgIH0sXG5cbiAgICBpbml0IDogZnVuY3Rpb24gKHNjb3BlLCBtZXRob2QsIG9wdGlvbnMpIHtcbiAgICAgIEZvdW5kYXRpb24uaW5oZXJpdCh0aGlzLCAndGhyb3R0bGUnKTtcblxuICAgICAgdGhpcy5iaW5kaW5ncyhtZXRob2QsIG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICBldmVudHMgOiBmdW5jdGlvbiAoc2NvcGUpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgICBTID0gc2VsZi5TO1xuXG4gICAgICBTKHRoaXMuc2NvcGUpXG4gICAgICAgIC5vZmYoJy5kcm9wZG93bicpXG4gICAgICAgIC5vbignY2xpY2suZm5kdG4uZHJvcGRvd24nLCAnWycgKyB0aGlzLmF0dHJfbmFtZSgpICsgJ10nLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgIHZhciBzZXR0aW5ncyA9IFModGhpcykuZGF0YShzZWxmLmF0dHJfbmFtZSh0cnVlKSArICctaW5pdCcpIHx8IHNlbGYuc2V0dGluZ3M7XG4gICAgICAgICAgaWYgKCFzZXR0aW5ncy5pc19ob3ZlciB8fCBNb2Rlcm5penIudG91Y2gpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHNlbGYudG9nZ2xlKCQodGhpcykpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdtb3VzZWVudGVyLmZuZHRuLmRyb3Bkb3duJywgJ1snICsgdGhpcy5hdHRyX25hbWUoKSArICddLCBbJyArIHRoaXMuYXR0cl9uYW1lKCkgKyAnLWNvbnRlbnRdJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICB2YXIgJHRoaXMgPSBTKHRoaXMpLFxuICAgICAgICAgICAgICBkcm9wZG93bixcbiAgICAgICAgICAgICAgdGFyZ2V0O1xuXG4gICAgICAgICAgY2xlYXJUaW1lb3V0KHNlbGYudGltZW91dCk7XG5cbiAgICAgICAgICBpZiAoJHRoaXMuZGF0YShzZWxmLmRhdGFfYXR0cigpKSkge1xuICAgICAgICAgICAgZHJvcGRvd24gPSBTKCcjJyArICR0aGlzLmRhdGEoc2VsZi5kYXRhX2F0dHIoKSkpO1xuICAgICAgICAgICAgdGFyZ2V0ID0gJHRoaXM7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRyb3Bkb3duID0gJHRoaXM7XG4gICAgICAgICAgICB0YXJnZXQgPSBTKFwiW1wiICsgc2VsZi5hdHRyX25hbWUoKSArIFwiPSdcIiArIGRyb3Bkb3duLmF0dHIoJ2lkJykgKyBcIiddXCIpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhciBzZXR0aW5ncyA9IHRhcmdldC5kYXRhKHNlbGYuYXR0cl9uYW1lKHRydWUpICsgJy1pbml0JykgfHwgc2VsZi5zZXR0aW5ncztcblxuICAgICAgICAgIGlmKFMoZS50YXJnZXQpLmRhdGEoc2VsZi5kYXRhX2F0dHIoKSkgJiYgc2V0dGluZ3MuaXNfaG92ZXIpIHtcbiAgICAgICAgICAgIHNlbGYuY2xvc2VhbGwuY2FsbChzZWxmKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoc2V0dGluZ3MuaXNfaG92ZXIpIHNlbGYub3Blbi5hcHBseShzZWxmLCBbZHJvcGRvd24sIHRhcmdldF0pO1xuICAgICAgICB9KVxuICAgICAgICAub24oJ21vdXNlbGVhdmUuZm5kdG4uZHJvcGRvd24nLCAnWycgKyB0aGlzLmF0dHJfbmFtZSgpICsgJ10sIFsnICsgdGhpcy5hdHRyX25hbWUoKSArICctY29udGVudF0nLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgIHZhciAkdGhpcyA9IFModGhpcyk7XG4gICAgICAgICAgc2VsZi50aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoJHRoaXMuZGF0YShzZWxmLmRhdGFfYXR0cigpKSkge1xuICAgICAgICAgICAgICB2YXIgc2V0dGluZ3MgPSAkdGhpcy5kYXRhKHNlbGYuZGF0YV9hdHRyKHRydWUpICsgJy1pbml0JykgfHwgc2VsZi5zZXR0aW5ncztcbiAgICAgICAgICAgICAgaWYgKHNldHRpbmdzLmlzX2hvdmVyKSBzZWxmLmNsb3NlLmNhbGwoc2VsZiwgUygnIycgKyAkdGhpcy5kYXRhKHNlbGYuZGF0YV9hdHRyKCkpKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB2YXIgdGFyZ2V0ICAgPSBTKCdbJyArIHNlbGYuYXR0cl9uYW1lKCkgKyAnPVwiJyArIFModGhpcykuYXR0cignaWQnKSArICdcIl0nKSxcbiAgICAgICAgICAgICAgICAgIHNldHRpbmdzID0gdGFyZ2V0LmRhdGEoc2VsZi5hdHRyX25hbWUodHJ1ZSkgKyAnLWluaXQnKSB8fCBzZWxmLnNldHRpbmdzO1xuICAgICAgICAgICAgICBpZiAoc2V0dGluZ3MuaXNfaG92ZXIpIHNlbGYuY2xvc2UuY2FsbChzZWxmLCAkdGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfS5iaW5kKHRoaXMpLCAxNTApO1xuICAgICAgICB9KVxuICAgICAgICAub24oJ2NsaWNrLmZuZHRuLmRyb3Bkb3duJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICB2YXIgcGFyZW50ID0gUyhlLnRhcmdldCkuY2xvc2VzdCgnWycgKyBzZWxmLmF0dHJfbmFtZSgpICsgJy1jb250ZW50XScpO1xuXG4gICAgICAgICAgaWYgKFMoZS50YXJnZXQpLmNsb3Nlc3QoJ1snICsgc2VsZi5hdHRyX25hbWUoKSArICddJykubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIShTKGUudGFyZ2V0KS5kYXRhKCdyZXZlYWxJZCcpKSAmJlxuICAgICAgICAgICAgKHBhcmVudC5sZW5ndGggPiAwICYmIChTKGUudGFyZ2V0KS5pcygnWycgKyBzZWxmLmF0dHJfbmFtZSgpICsgJy1jb250ZW50XScpIHx8XG4gICAgICAgICAgICAgICQuY29udGFpbnMocGFyZW50LmZpcnN0KClbMF0sIGUudGFyZ2V0KSkpKSB7XG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHNlbGYuY2xvc2UuY2FsbChzZWxmLCBTKCdbJyArIHNlbGYuYXR0cl9uYW1lKCkgKyAnLWNvbnRlbnRdJykpO1xuICAgICAgICB9KVxuICAgICAgICAub24oJ29wZW5lZC5mbmR0bi5kcm9wZG93bicsICdbJyArIHNlbGYuYXR0cl9uYW1lKCkgKyAnLWNvbnRlbnRdJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5zZXR0aW5ncy5vcGVuZWQuY2FsbCh0aGlzKTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdjbG9zZWQuZm5kdG4uZHJvcGRvd24nLCAnWycgKyBzZWxmLmF0dHJfbmFtZSgpICsgJy1jb250ZW50XScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuc2V0dGluZ3MuY2xvc2VkLmNhbGwodGhpcyk7XG4gICAgICAgIH0pO1xuXG4gICAgICBTKHdpbmRvdylcbiAgICAgICAgLm9mZignLmRyb3Bkb3duJylcbiAgICAgICAgLm9uKCdyZXNpemUuZm5kdG4uZHJvcGRvd24nLCBzZWxmLnRocm90dGxlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBzZWxmLnJlc2l6ZS5jYWxsKHNlbGYpO1xuICAgICAgICB9LCA1MCkpO1xuXG4gICAgICB0aGlzLnJlc2l6ZSgpO1xuICAgIH0sXG5cbiAgICBjbG9zZTogZnVuY3Rpb24gKGRyb3Bkb3duKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICBkcm9wZG93bi5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG9yaWdpbmFsX3RhcmdldCA9ICQoJ1snICsgc2VsZi5hdHRyX25hbWUoKSArICc9JyArIGRyb3Bkb3duWzBdLmlkICsgJ10nKSB8fCAkKCdhcmlhLWNvbnRyb2xzPScgKyBkcm9wZG93blswXS5pZCsgJ10nKTtcbiAgICAgICAgb3JpZ2luYWxfdGFyZ2V0LmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBcImZhbHNlXCIpO1xuICAgICAgICBpZiAoc2VsZi5TKHRoaXMpLmhhc0NsYXNzKHNlbGYuc2V0dGluZ3MuYWN0aXZlX2NsYXNzKSkge1xuICAgICAgICAgIHNlbGYuUyh0aGlzKVxuICAgICAgICAgICAgLmNzcyhGb3VuZGF0aW9uLnJ0bCA/ICdyaWdodCc6J2xlZnQnLCAnLTk5OTk5cHgnKVxuICAgICAgICAgICAgLmF0dHIoJ2FyaWEtaGlkZGVuJywgXCJ0cnVlXCIpXG4gICAgICAgICAgICAucmVtb3ZlQ2xhc3Moc2VsZi5zZXR0aW5ncy5hY3RpdmVfY2xhc3MpXG4gICAgICAgICAgICAucHJldignWycgKyBzZWxmLmF0dHJfbmFtZSgpICsgJ10nKVxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKHNlbGYuc2V0dGluZ3MuYWN0aXZlX2NsYXNzKVxuICAgICAgICAgICAgLnJlbW92ZURhdGEoJ3RhcmdldCcpO1xuXG4gICAgICAgICAgc2VsZi5TKHRoaXMpLnRyaWdnZXIoJ2Nsb3NlZCcpLnRyaWdnZXIoJ2Nsb3NlZC5mbmR0bi5kcm9wZG93bicsIFtkcm9wZG93bl0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgY2xvc2VhbGw6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgJC5lYWNoKHNlbGYuUygnWycgKyB0aGlzLmF0dHJfbmFtZSgpICsgJy1jb250ZW50XScpLCBmdW5jdGlvbigpIHtcbiAgICAgICAgc2VsZi5jbG9zZS5jYWxsKHNlbGYsIHNlbGYuUyh0aGlzKSk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgb3BlbjogZnVuY3Rpb24gKGRyb3Bkb3duLCB0YXJnZXQpIHtcbiAgICAgICAgdGhpc1xuICAgICAgICAgIC5jc3MoZHJvcGRvd25cbiAgICAgICAgICAgIC5hZGRDbGFzcyh0aGlzLnNldHRpbmdzLmFjdGl2ZV9jbGFzcyksIHRhcmdldCk7XG4gICAgICAgIGRyb3Bkb3duLnByZXYoJ1snICsgdGhpcy5hdHRyX25hbWUoKSArICddJykuYWRkQ2xhc3ModGhpcy5zZXR0aW5ncy5hY3RpdmVfY2xhc3MpO1xuICAgICAgICBkcm9wZG93bi5kYXRhKCd0YXJnZXQnLCB0YXJnZXQuZ2V0KDApKS50cmlnZ2VyKCdvcGVuZWQnKS50cmlnZ2VyKCdvcGVuZWQuZm5kdG4uZHJvcGRvd24nLCBbZHJvcGRvd24sIHRhcmdldF0pO1xuICAgICAgICBkcm9wZG93bi5hdHRyKCdhcmlhLWhpZGRlbicsICdmYWxzZScpO1xuICAgICAgICB0YXJnZXQuYXR0cignYXJpYS1leHBhbmRlZCcsICd0cnVlJyk7XG4gICAgICAgIGRyb3Bkb3duLmZvY3VzKCk7XG4gICAgfSxcblxuICAgIGRhdGFfYXR0cjogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHRoaXMubmFtZXNwYWNlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubmFtZXNwYWNlICsgJy0nICsgdGhpcy5uYW1lO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5uYW1lO1xuICAgIH0sXG5cbiAgICB0b2dnbGUgOiBmdW5jdGlvbiAodGFyZ2V0KSB7XG4gICAgICB2YXIgZHJvcGRvd24gPSB0aGlzLlMoJyMnICsgdGFyZ2V0LmRhdGEodGhpcy5kYXRhX2F0dHIoKSkpO1xuICAgICAgaWYgKGRyb3Bkb3duLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAvLyBObyBkcm9wZG93biBmb3VuZCwgbm90IGNvbnRpbnVpbmdcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmNsb3NlLmNhbGwodGhpcywgdGhpcy5TKCdbJyArIHRoaXMuYXR0cl9uYW1lKCkgKyAnLWNvbnRlbnRdJykubm90KGRyb3Bkb3duKSk7XG5cbiAgICAgIGlmIChkcm9wZG93bi5oYXNDbGFzcyh0aGlzLnNldHRpbmdzLmFjdGl2ZV9jbGFzcykpIHtcbiAgICAgICAgdGhpcy5jbG9zZS5jYWxsKHRoaXMsIGRyb3Bkb3duKTtcbiAgICAgICAgaWYgKGRyb3Bkb3duLmRhdGEoJ3RhcmdldCcpICE9PSB0YXJnZXQuZ2V0KDApKVxuICAgICAgICAgIHRoaXMub3Blbi5jYWxsKHRoaXMsIGRyb3Bkb3duLCB0YXJnZXQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5vcGVuLmNhbGwodGhpcywgZHJvcGRvd24sIHRhcmdldCk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIHJlc2l6ZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBkcm9wZG93biA9IHRoaXMuUygnWycgKyB0aGlzLmF0dHJfbmFtZSgpICsgJy1jb250ZW50XS5vcGVuJyksXG4gICAgICAgICAgdGFyZ2V0ID0gdGhpcy5TKFwiW1wiICsgdGhpcy5hdHRyX25hbWUoKSArIFwiPSdcIiArIGRyb3Bkb3duLmF0dHIoJ2lkJykgKyBcIiddXCIpO1xuXG4gICAgICBpZiAoZHJvcGRvd24ubGVuZ3RoICYmIHRhcmdldC5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy5jc3MoZHJvcGRvd24sIHRhcmdldCk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIGNzcyA6IGZ1bmN0aW9uIChkcm9wZG93biwgdGFyZ2V0KSB7XG4gICAgICB2YXIgbGVmdF9vZmZzZXQgPSBNYXRoLm1heCgodGFyZ2V0LndpZHRoKCkgLSBkcm9wZG93bi53aWR0aCgpKSAvIDIsIDgpLFxuICAgICAgICAgIHNldHRpbmdzID0gdGFyZ2V0LmRhdGEodGhpcy5hdHRyX25hbWUodHJ1ZSkgKyAnLWluaXQnKSB8fCB0aGlzLnNldHRpbmdzO1xuXG4gICAgICB0aGlzLmNsZWFyX2lkeCgpO1xuXG4gICAgICBpZiAodGhpcy5zbWFsbCgpKSB7XG4gICAgICAgIHZhciBwID0gdGhpcy5kaXJzLmJvdHRvbS5jYWxsKGRyb3Bkb3duLCB0YXJnZXQsIHNldHRpbmdzKTtcblxuICAgICAgICBkcm9wZG93bi5hdHRyKCdzdHlsZScsICcnKS5yZW1vdmVDbGFzcygnZHJvcC1sZWZ0IGRyb3AtcmlnaHQgZHJvcC10b3AnKS5jc3Moe1xuICAgICAgICAgIHBvc2l0aW9uIDogJ2Fic29sdXRlJyxcbiAgICAgICAgICB3aWR0aDogJzk1JScsXG4gICAgICAgICAgJ21heC13aWR0aCc6ICdub25lJyxcbiAgICAgICAgICB0b3A6IHAudG9wXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGRyb3Bkb3duLmNzcyhGb3VuZGF0aW9uLnJ0bCA/ICdyaWdodCc6J2xlZnQnLCBsZWZ0X29mZnNldCk7XG4gICAgICB9IGVsc2Uge1xuXG4gICAgICAgIHRoaXMuc3R5bGUoZHJvcGRvd24sIHRhcmdldCwgc2V0dGluZ3MpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZHJvcGRvd247XG4gICAgfSxcblxuICAgIHN0eWxlIDogZnVuY3Rpb24gKGRyb3Bkb3duLCB0YXJnZXQsIHNldHRpbmdzKSB7XG4gICAgICB2YXIgY3NzID0gJC5leHRlbmQoe3Bvc2l0aW9uOiAnYWJzb2x1dGUnfSxcbiAgICAgICAgdGhpcy5kaXJzW3NldHRpbmdzLmFsaWduXS5jYWxsKGRyb3Bkb3duLCB0YXJnZXQsIHNldHRpbmdzKSk7XG5cbiAgICAgIGRyb3Bkb3duLmF0dHIoJ3N0eWxlJywgJycpLmNzcyhjc3MpO1xuICAgIH0sXG5cbiAgICAvLyByZXR1cm4gQ1NTIHByb3BlcnR5IG9iamVjdFxuICAgIC8vIGB0aGlzYCBpcyB0aGUgZHJvcGRvd25cbiAgICBkaXJzIDoge1xuICAgICAgLy8gQ2FsY3VsYXRlIHRhcmdldCBvZmZzZXRcbiAgICAgIF9iYXNlIDogZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgdmFyIG9fcCA9IHRoaXMub2Zmc2V0UGFyZW50KCksXG4gICAgICAgICAgICBvID0gb19wLm9mZnNldCgpLFxuICAgICAgICAgICAgcCA9IHQub2Zmc2V0KCk7XG5cbiAgICAgICAgcC50b3AgLT0gby50b3A7XG4gICAgICAgIHAubGVmdCAtPSBvLmxlZnQ7XG5cbiAgICAgICAgcmV0dXJuIHA7XG4gICAgICB9LFxuICAgICAgdG9wOiBmdW5jdGlvbiAodCwgcykge1xuICAgICAgICB2YXIgc2VsZiA9IEZvdW5kYXRpb24ubGlicy5kcm9wZG93bixcbiAgICAgICAgICAgIHAgPSBzZWxmLmRpcnMuX2Jhc2UuY2FsbCh0aGlzLCB0KTtcblxuICAgICAgICB0aGlzLmFkZENsYXNzKCdkcm9wLXRvcCcpO1xuXG4gICAgICAgIGlmICh0Lm91dGVyV2lkdGgoKSA8IHRoaXMub3V0ZXJXaWR0aCgpIHx8IHNlbGYuc21hbGwoKSB8fCB0aGlzLmhhc0NsYXNzKHMubWVnYV9tZW51KSkge1xuICAgICAgICAgIHNlbGYuYWRqdXN0X3BpcCh0aGlzLHQscyxwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChGb3VuZGF0aW9uLnJ0bCkge1xuICAgICAgICAgIHJldHVybiB7bGVmdDogcC5sZWZ0IC0gdGhpcy5vdXRlcldpZHRoKCkgKyB0Lm91dGVyV2lkdGgoKSxcbiAgICAgICAgICAgIHRvcDogcC50b3AgLSB0aGlzLm91dGVySGVpZ2h0KCl9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtsZWZ0OiBwLmxlZnQsIHRvcDogcC50b3AgLSB0aGlzLm91dGVySGVpZ2h0KCl9O1xuICAgICAgfSxcbiAgICAgIGJvdHRvbTogZnVuY3Rpb24gKHQscykge1xuICAgICAgICB2YXIgc2VsZiA9IEZvdW5kYXRpb24ubGlicy5kcm9wZG93bixcbiAgICAgICAgICAgIHAgPSBzZWxmLmRpcnMuX2Jhc2UuY2FsbCh0aGlzLCB0KTtcblxuICAgICAgICBpZiAodC5vdXRlcldpZHRoKCkgPCB0aGlzLm91dGVyV2lkdGgoKSB8fCBzZWxmLnNtYWxsKCkgfHwgdGhpcy5oYXNDbGFzcyhzLm1lZ2FfbWVudSkpIHtcbiAgICAgICAgICBzZWxmLmFkanVzdF9waXAodGhpcyx0LHMscCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2VsZi5ydGwpIHtcbiAgICAgICAgICByZXR1cm4ge2xlZnQ6IHAubGVmdCAtIHRoaXMub3V0ZXJXaWR0aCgpICsgdC5vdXRlcldpZHRoKCksIHRvcDogcC50b3AgKyB0Lm91dGVySGVpZ2h0KCl9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtsZWZ0OiBwLmxlZnQsIHRvcDogcC50b3AgKyB0Lm91dGVySGVpZ2h0KCl9O1xuICAgICAgfSxcbiAgICAgIGxlZnQ6IGZ1bmN0aW9uICh0LCBzKSB7XG4gICAgICAgIHZhciBwID0gRm91bmRhdGlvbi5saWJzLmRyb3Bkb3duLmRpcnMuX2Jhc2UuY2FsbCh0aGlzLCB0KTtcblxuICAgICAgICB0aGlzLmFkZENsYXNzKCdkcm9wLWxlZnQnKTtcblxuICAgICAgICByZXR1cm4ge2xlZnQ6IHAubGVmdCAtIHRoaXMub3V0ZXJXaWR0aCgpLCB0b3A6IHAudG9wfTtcbiAgICAgIH0sXG4gICAgICByaWdodDogZnVuY3Rpb24gKHQsIHMpIHtcbiAgICAgICAgdmFyIHAgPSBGb3VuZGF0aW9uLmxpYnMuZHJvcGRvd24uZGlycy5fYmFzZS5jYWxsKHRoaXMsIHQpO1xuXG4gICAgICAgIHRoaXMuYWRkQ2xhc3MoJ2Ryb3AtcmlnaHQnKTtcblxuICAgICAgICByZXR1cm4ge2xlZnQ6IHAubGVmdCArIHQub3V0ZXJXaWR0aCgpLCB0b3A6IHAudG9wfTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gSW5zZXJ0IHJ1bGUgdG8gc3R5bGUgcHN1ZWRvIGVsZW1lbnRzXG4gICAgYWRqdXN0X3BpcCA6IGZ1bmN0aW9uIChkcm9wZG93bix0YXJnZXQsc2V0dGluZ3MscG9zaXRpb24pIHtcbiAgICAgIHZhciBzaGVldCA9IEZvdW5kYXRpb24uc3R5bGVzaGVldCxcbiAgICAgICAgICBwaXBfb2Zmc2V0X2Jhc2UgPSA4O1xuXG4gICAgICBpZiAoZHJvcGRvd24uaGFzQ2xhc3Moc2V0dGluZ3MubWVnYV9jbGFzcykpIHtcbiAgICAgICAgcGlwX29mZnNldF9iYXNlID0gcG9zaXRpb24ubGVmdCArICh0YXJnZXQub3V0ZXJXaWR0aCgpLzIpIC0gODtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKHRoaXMuc21hbGwoKSkge1xuICAgICAgICBwaXBfb2Zmc2V0X2Jhc2UgKz0gcG9zaXRpb24ubGVmdCAtIDg7XG4gICAgICB9XG5cbiAgICAgIHRoaXMucnVsZV9pZHggPSBzaGVldC5jc3NSdWxlcy5sZW5ndGg7XG5cbiAgICAgIHZhciBzZWxfYmVmb3JlID0gJy5mLWRyb3Bkb3duLm9wZW46YmVmb3JlJyxcbiAgICAgICAgICBzZWxfYWZ0ZXIgID0gJy5mLWRyb3Bkb3duLm9wZW46YWZ0ZXInLFxuICAgICAgICAgIGNzc19iZWZvcmUgPSAnbGVmdDogJyArIHBpcF9vZmZzZXRfYmFzZSArICdweDsnLFxuICAgICAgICAgIGNzc19hZnRlciAgPSAnbGVmdDogJyArIChwaXBfb2Zmc2V0X2Jhc2UgLSAxKSArICdweDsnO1xuXG4gICAgICBpZiAoc2hlZXQuaW5zZXJ0UnVsZSkge1xuICAgICAgICBzaGVldC5pbnNlcnRSdWxlKFtzZWxfYmVmb3JlLCAneycsIGNzc19iZWZvcmUsICd9J10uam9pbignICcpLCB0aGlzLnJ1bGVfaWR4KTtcbiAgICAgICAgc2hlZXQuaW5zZXJ0UnVsZShbc2VsX2FmdGVyLCAneycsIGNzc19hZnRlciwgJ30nXS5qb2luKCcgJyksIHRoaXMucnVsZV9pZHggKyAxKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNoZWV0LmFkZFJ1bGUoc2VsX2JlZm9yZSwgY3NzX2JlZm9yZSwgdGhpcy5ydWxlX2lkeCk7XG4gICAgICAgIHNoZWV0LmFkZFJ1bGUoc2VsX2FmdGVyLCBjc3NfYWZ0ZXIsIHRoaXMucnVsZV9pZHggKyAxKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gUmVtb3ZlIG9sZCBkcm9wZG93biBydWxlIGluZGV4XG4gICAgY2xlYXJfaWR4IDogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHNoZWV0ID0gRm91bmRhdGlvbi5zdHlsZXNoZWV0O1xuXG4gICAgICBpZiAodGhpcy5ydWxlX2lkeCkge1xuICAgICAgICBzaGVldC5kZWxldGVSdWxlKHRoaXMucnVsZV9pZHgpO1xuICAgICAgICBzaGVldC5kZWxldGVSdWxlKHRoaXMucnVsZV9pZHgpO1xuICAgICAgICBkZWxldGUgdGhpcy5ydWxlX2lkeDtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgc21hbGwgOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gbWF0Y2hNZWRpYShGb3VuZGF0aW9uLm1lZGlhX3F1ZXJpZXMuc21hbGwpLm1hdGNoZXMgJiZcbiAgICAgICAgIW1hdGNoTWVkaWEoRm91bmRhdGlvbi5tZWRpYV9xdWVyaWVzLm1lZGl1bSkubWF0Y2hlcztcbiAgICB9LFxuXG4gICAgb2ZmOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLlModGhpcy5zY29wZSkub2ZmKCcuZm5kdG4uZHJvcGRvd24nKTtcbiAgICAgIHRoaXMuUygnaHRtbCwgYm9keScpLm9mZignLmZuZHRuLmRyb3Bkb3duJyk7XG4gICAgICB0aGlzLlMod2luZG93KS5vZmYoJy5mbmR0bi5kcm9wZG93bicpO1xuICAgICAgdGhpcy5TKCdbZGF0YS1kcm9wZG93bi1jb250ZW50XScpLm9mZignLmZuZHRuLmRyb3Bkb3duJyk7XG4gICAgfSxcblxuICAgIHJlZmxvdyA6IGZ1bmN0aW9uICgpIHt9XG4gIH07XG59KGpRdWVyeSwgd2luZG93LCB3aW5kb3cuZG9jdW1lbnQpKTtcbiIsIjsoZnVuY3Rpb24gKCQsIHdpbmRvdywgZG9jdW1lbnQsIHVuZGVmaW5lZCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgRm91bmRhdGlvbi5saWJzLmVxdWFsaXplciA9IHtcbiAgICBuYW1lIDogJ2VxdWFsaXplcicsXG5cbiAgICB2ZXJzaW9uIDogJzUuNC41JyxcblxuICAgIHNldHRpbmdzIDoge1xuICAgICAgdXNlX3RhbGxlc3Q6IHRydWUsXG4gICAgICBiZWZvcmVfaGVpZ2h0X2NoYW5nZTogJC5ub29wLFxuICAgICAgYWZ0ZXJfaGVpZ2h0X2NoYW5nZTogJC5ub29wLFxuICAgICAgZXF1YWxpemVfb25fc3RhY2s6IGZhbHNlXG4gICAgfSxcblxuICAgIGluaXQgOiBmdW5jdGlvbiAoc2NvcGUsIG1ldGhvZCwgb3B0aW9ucykge1xuICAgICAgRm91bmRhdGlvbi5pbmhlcml0KHRoaXMsICdpbWFnZV9sb2FkZWQnKTtcbiAgICAgIHRoaXMuYmluZGluZ3MobWV0aG9kLCBvcHRpb25zKTtcbiAgICAgIHRoaXMucmVmbG93KCk7XG4gICAgfSxcblxuICAgIGV2ZW50cyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuUyh3aW5kb3cpLm9mZignLmVxdWFsaXplcicpLm9uKCdyZXNpemUuZm5kdG4uZXF1YWxpemVyJywgZnVuY3Rpb24oZSl7XG4gICAgICAgIHRoaXMucmVmbG93KCk7XG4gICAgICB9LmJpbmQodGhpcykpO1xuICAgIH0sXG5cbiAgICBlcXVhbGl6ZTogZnVuY3Rpb24oZXF1YWxpemVyKSB7XG4gICAgICB2YXIgaXNTdGFja2VkID0gZmFsc2UsXG4gICAgICAgICAgdmFscyA9IGVxdWFsaXplci5maW5kKCdbJyArIHRoaXMuYXR0cl9uYW1lKCkgKyAnLXdhdGNoXTp2aXNpYmxlJyksXG4gICAgICAgICAgc2V0dGluZ3MgPSBlcXVhbGl6ZXIuZGF0YSh0aGlzLmF0dHJfbmFtZSh0cnVlKSsnLWluaXQnKTtcblxuICAgICAgaWYgKHZhbHMubGVuZ3RoID09PSAwKSByZXR1cm47XG4gICAgICB2YXIgZmlyc3RUb3BPZmZzZXQgPSB2YWxzLmZpcnN0KCkub2Zmc2V0KCkudG9wO1xuICAgICAgc2V0dGluZ3MuYmVmb3JlX2hlaWdodF9jaGFuZ2UoKTtcbiAgICAgIGVxdWFsaXplci50cmlnZ2VyKCdiZWZvcmUtaGVpZ2h0LWNoYW5nZScpLnRyaWdnZXIoJ2JlZm9yZS1oZWlnaHQtY2hhbmdlLmZuZHRoLmVxdWFsaXplcicpO1xuICAgICAgdmFscy5oZWlnaHQoJ2luaGVyaXQnKTtcbiAgICAgIHZhbHMuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICB2YXIgZWwgPSAkKHRoaXMpO1xuICAgICAgICBpZiAoZWwub2Zmc2V0KCkudG9wICE9PSBmaXJzdFRvcE9mZnNldCkge1xuICAgICAgICAgIGlzU3RhY2tlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBpZiAoc2V0dGluZ3MuZXF1YWxpemVfb25fc3RhY2sgPT09IGZhbHNlKSB7XG4gICAgICAgIGlmIChpc1N0YWNrZWQpIHJldHVybjtcbiAgICAgIH07XG5cbiAgICAgIHZhciBoZWlnaHRzID0gdmFscy5tYXAoZnVuY3Rpb24oKXsgcmV0dXJuICQodGhpcykub3V0ZXJIZWlnaHQoZmFsc2UpIH0pLmdldCgpO1xuXG4gICAgICBpZiAoc2V0dGluZ3MudXNlX3RhbGxlc3QpIHtcbiAgICAgICAgdmFyIG1heCA9IE1hdGgubWF4LmFwcGx5KG51bGwsIGhlaWdodHMpO1xuICAgICAgICB2YWxzLmNzcygnaGVpZ2h0JywgbWF4KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBtaW4gPSBNYXRoLm1pbi5hcHBseShudWxsLCBoZWlnaHRzKTtcbiAgICAgICAgdmFscy5jc3MoJ2hlaWdodCcsIG1pbik7XG4gICAgICB9XG4gICAgICBzZXR0aW5ncy5hZnRlcl9oZWlnaHRfY2hhbmdlKCk7XG4gICAgICBlcXVhbGl6ZXIudHJpZ2dlcignYWZ0ZXItaGVpZ2h0LWNoYW5nZScpLnRyaWdnZXIoJ2FmdGVyLWhlaWdodC1jaGFuZ2UuZm5kdG4uZXF1YWxpemVyJyk7XG4gICAgfSxcblxuICAgIHJlZmxvdyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgdGhpcy5TKCdbJyArIHRoaXMuYXR0cl9uYW1lKCkgKyAnXScsIHRoaXMuc2NvcGUpLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyICRlcV90YXJnZXQgPSAkKHRoaXMpO1xuICAgICAgICBzZWxmLmltYWdlX2xvYWRlZChzZWxmLlMoJ2ltZycsIHRoaXMpLCBmdW5jdGlvbigpe1xuICAgICAgICAgIHNlbGYuZXF1YWxpemUoJGVxX3RhcmdldClcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG59KShqUXVlcnksIHdpbmRvdywgd2luZG93LmRvY3VtZW50KTtcblxuIiwiOyhmdW5jdGlvbiAoJCwgd2luZG93LCBkb2N1bWVudCwgdW5kZWZpbmVkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBGb3VuZGF0aW9uLmxpYnMub2ZmY2FudmFzID0ge1xuICAgIG5hbWUgOiAnb2ZmY2FudmFzJyxcblxuICAgIHZlcnNpb24gOiAnNS40LjUnLFxuXG4gICAgc2V0dGluZ3MgOiB7XG4gICAgICBvcGVuX21ldGhvZDogJ21vdmUnLFxuICAgICAgY2xvc2Vfb25fY2xpY2s6IGZhbHNlXG4gICAgfSxcblxuICAgIGluaXQgOiBmdW5jdGlvbiAoc2NvcGUsIG1ldGhvZCwgb3B0aW9ucykge1xuICAgICAgdGhpcy5iaW5kaW5ncyhtZXRob2QsIG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICBldmVudHMgOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgICAgUyA9IHNlbGYuUyxcbiAgICAgICAgICBtb3ZlX2NsYXNzID0gJycsXG4gICAgICAgICAgcmlnaHRfcG9zdGZpeCA9ICcnLFxuICAgICAgICAgIGxlZnRfcG9zdGZpeCA9ICcnO1xuXG4gICAgICBpZiAodGhpcy5zZXR0aW5ncy5vcGVuX21ldGhvZCA9PT0gJ21vdmUnKSB7XG4gICAgICAgIG1vdmVfY2xhc3MgPSAnbW92ZS0nO1xuICAgICAgICByaWdodF9wb3N0Zml4ID0gJ3JpZ2h0JztcbiAgICAgICAgbGVmdF9wb3N0Zml4ID0gJ2xlZnQnO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLnNldHRpbmdzLm9wZW5fbWV0aG9kID09PSAnb3ZlcmxhcF9zaW5nbGUnKSB7XG4gICAgICAgIG1vdmVfY2xhc3MgPSAnb2ZmY2FudmFzLW92ZXJsYXAtJztcbiAgICAgICAgcmlnaHRfcG9zdGZpeCA9ICdyaWdodCc7XG4gICAgICAgIGxlZnRfcG9zdGZpeCA9ICdsZWZ0JztcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5zZXR0aW5ncy5vcGVuX21ldGhvZCA9PT0gJ292ZXJsYXAnKSB7XG4gICAgICAgIG1vdmVfY2xhc3MgPSAnb2ZmY2FudmFzLW92ZXJsYXAnO1xuICAgICAgfVxuXG4gICAgICBTKHRoaXMuc2NvcGUpLm9mZignLm9mZmNhbnZhcycpXG4gICAgICAgIC5vbignY2xpY2suZm5kdG4ub2ZmY2FudmFzJywgJy5sZWZ0LW9mZi1jYW52YXMtdG9nZ2xlJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICBzZWxmLmNsaWNrX3RvZ2dsZV9jbGFzcyhlLCBtb3ZlX2NsYXNzICsgcmlnaHRfcG9zdGZpeCk7XG4gICAgICAgICAgaWYgKHNlbGYuc2V0dGluZ3Mub3Blbl9tZXRob2QgIT09ICdvdmVybGFwJyl7XG4gICAgICAgICAgICBTKFwiLmxlZnQtc3VibWVudVwiKS5yZW1vdmVDbGFzcyhtb3ZlX2NsYXNzICsgcmlnaHRfcG9zdGZpeCk7XG4gICAgICAgICAgfVxuICAgICAgICAgICQoJy5sZWZ0LW9mZi1jYW52YXMtdG9nZ2xlJykuYXR0cignYXJpYS1leHBhbmRlZCcsICd0cnVlJyk7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignY2xpY2suZm5kdG4ub2ZmY2FudmFzJywgJy5sZWZ0LW9mZi1jYW52YXMtbWVudSBhJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICB2YXIgc2V0dGluZ3MgPSBzZWxmLmdldF9zZXR0aW5ncyhlKTtcbiAgICAgICAgICB2YXIgcGFyZW50ID0gUyh0aGlzKS5wYXJlbnQoKTtcblxuICAgICAgICAgIGlmKHNldHRpbmdzLmNsb3NlX29uX2NsaWNrICYmICFwYXJlbnQuaGFzQ2xhc3MoXCJoYXMtc3VibWVudVwiKSAmJiAhcGFyZW50Lmhhc0NsYXNzKFwiYmFja1wiKSl7XG4gICAgICAgICAgICBzZWxmLmhpZGUuY2FsbChzZWxmLCBtb3ZlX2NsYXNzICsgcmlnaHRfcG9zdGZpeCwgc2VsZi5nZXRfd3JhcHBlcihlKSk7XG4gICAgICAgICAgICBwYXJlbnQucGFyZW50KCkucmVtb3ZlQ2xhc3MobW92ZV9jbGFzcyArIHJpZ2h0X3Bvc3RmaXgpO1xuICAgICAgICAgIH1lbHNlIGlmKFModGhpcykucGFyZW50KCkuaGFzQ2xhc3MoXCJoYXMtc3VibWVudVwiKSl7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBTKHRoaXMpLnNpYmxpbmdzKFwiLmxlZnQtc3VibWVudVwiKS50b2dnbGVDbGFzcyhtb3ZlX2NsYXNzICsgcmlnaHRfcG9zdGZpeCk7XG4gICAgICAgICAgfWVsc2UgaWYocGFyZW50Lmhhc0NsYXNzKFwiYmFja1wiKSl7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBwYXJlbnQucGFyZW50KCkucmVtb3ZlQ2xhc3MobW92ZV9jbGFzcyArIHJpZ2h0X3Bvc3RmaXgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAkKCcubGVmdC1vZmYtY2FudmFzLXRvZ2dsZScpLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCAndHJ1ZScpO1xuICAgICAgICB9KVxuICAgICAgICAub24oJ2NsaWNrLmZuZHRuLm9mZmNhbnZhcycsICcucmlnaHQtb2ZmLWNhbnZhcy10b2dnbGUnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgIHNlbGYuY2xpY2tfdG9nZ2xlX2NsYXNzKGUsIG1vdmVfY2xhc3MgKyBsZWZ0X3Bvc3RmaXgpO1xuICAgICAgICAgIGlmIChzZWxmLnNldHRpbmdzLm9wZW5fbWV0aG9kICE9PSAnb3ZlcmxhcCcpe1xuICAgICAgICAgICAgUyhcIi5yaWdodC1zdWJtZW51XCIpLnJlbW92ZUNsYXNzKG1vdmVfY2xhc3MgKyBsZWZ0X3Bvc3RmaXgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAkKCcucmlnaHQtb2ZmLWNhbnZhcy10b2dnbGUnKS5hdHRyKCdhcmlhLWV4cGFuZGVkJywgJ3RydWUnKTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdjbGljay5mbmR0bi5vZmZjYW52YXMnLCAnLnJpZ2h0LW9mZi1jYW52YXMtbWVudSBhJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICB2YXIgc2V0dGluZ3MgPSBzZWxmLmdldF9zZXR0aW5ncyhlKTtcbiAgICAgICAgICB2YXIgcGFyZW50ID0gUyh0aGlzKS5wYXJlbnQoKTtcblxuICAgICAgICAgIGlmKHNldHRpbmdzLmNsb3NlX29uX2NsaWNrICYmICFwYXJlbnQuaGFzQ2xhc3MoXCJoYXMtc3VibWVudVwiKSAmJiAhcGFyZW50Lmhhc0NsYXNzKFwiYmFja1wiKSl7XG4gICAgICAgICAgICBzZWxmLmhpZGUuY2FsbChzZWxmLCBtb3ZlX2NsYXNzICsgbGVmdF9wb3N0Zml4LCBzZWxmLmdldF93cmFwcGVyKGUpKTtcbiAgICAgICAgICAgIHBhcmVudC5wYXJlbnQoKS5yZW1vdmVDbGFzcyhtb3ZlX2NsYXNzICsgbGVmdF9wb3N0Zml4KTtcbiAgICAgICAgICB9ZWxzZSBpZihTKHRoaXMpLnBhcmVudCgpLmhhc0NsYXNzKFwiaGFzLXN1Ym1lbnVcIikpe1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgUyh0aGlzKS5zaWJsaW5ncyhcIi5yaWdodC1zdWJtZW51XCIpLnRvZ2dsZUNsYXNzKG1vdmVfY2xhc3MgKyBsZWZ0X3Bvc3RmaXgpO1xuICAgICAgICAgIH1lbHNlIGlmKHBhcmVudC5oYXNDbGFzcyhcImJhY2tcIikpe1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgcGFyZW50LnBhcmVudCgpLnJlbW92ZUNsYXNzKG1vdmVfY2xhc3MgKyBsZWZ0X3Bvc3RmaXgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAkKCcucmlnaHQtb2ZmLWNhbnZhcy10b2dnbGUnKS5hdHRyKCdhcmlhLWV4cGFuZGVkJywgJ3RydWUnKTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdjbGljay5mbmR0bi5vZmZjYW52YXMnLCAnLmV4aXQtb2ZmLWNhbnZhcycsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgc2VsZi5jbGlja19yZW1vdmVfY2xhc3MoZSwgbW92ZV9jbGFzcyArIGxlZnRfcG9zdGZpeCk7XG4gICAgICAgICAgUyhcIi5yaWdodC1zdWJtZW51XCIpLnJlbW92ZUNsYXNzKG1vdmVfY2xhc3MgKyBsZWZ0X3Bvc3RmaXgpO1xuICAgICAgICAgIGlmIChyaWdodF9wb3N0Zml4KXtcbiAgICAgICAgICAgIHNlbGYuY2xpY2tfcmVtb3ZlX2NsYXNzKGUsIG1vdmVfY2xhc3MgKyByaWdodF9wb3N0Zml4KTtcbiAgICAgICAgICAgIFMoXCIubGVmdC1zdWJtZW51XCIpLnJlbW92ZUNsYXNzKG1vdmVfY2xhc3MgKyBsZWZ0X3Bvc3RmaXgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAkKCcucmlnaHQtb2ZmLWNhbnZhcy10b2dnbGUnKS5hdHRyKCdhcmlhLWV4cGFuZGVkJywgJ3RydWUnKTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdjbGljay5mbmR0bi5vZmZjYW52YXMnLCAnLmV4aXQtb2ZmLWNhbnZhcycsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgc2VsZi5jbGlja19yZW1vdmVfY2xhc3MoZSwgbW92ZV9jbGFzcyArIGxlZnRfcG9zdGZpeCk7XG4gICAgICAgICAgJCgnLmxlZnQtb2ZmLWNhbnZhcy10b2dnbGUnKS5hdHRyKCdhcmlhLWV4cGFuZGVkJywgJ2ZhbHNlJyk7XG4gICAgICAgICAgaWYgKHJpZ2h0X3Bvc3RmaXgpIHtcbiAgICAgICAgICAgIHNlbGYuY2xpY2tfcmVtb3ZlX2NsYXNzKGUsIG1vdmVfY2xhc3MgKyByaWdodF9wb3N0Zml4KTtcbiAgICAgICAgICAgICQoJy5yaWdodC1vZmYtY2FudmFzLXRvZ2dsZScpLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBcImZhbHNlXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIHRvZ2dsZTogZnVuY3Rpb24oY2xhc3NfbmFtZSwgJG9mZl9jYW52YXMpIHtcbiAgICAgICRvZmZfY2FudmFzID0gJG9mZl9jYW52YXMgfHwgdGhpcy5nZXRfd3JhcHBlcigpO1xuICAgICAgaWYgKCRvZmZfY2FudmFzLmlzKCcuJyArIGNsYXNzX25hbWUpKSB7XG4gICAgICAgIHRoaXMuaGlkZShjbGFzc19uYW1lLCAkb2ZmX2NhbnZhcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnNob3coY2xhc3NfbmFtZSwgJG9mZl9jYW52YXMpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBzaG93OiBmdW5jdGlvbihjbGFzc19uYW1lLCAkb2ZmX2NhbnZhcykge1xuICAgICAgJG9mZl9jYW52YXMgPSAkb2ZmX2NhbnZhcyB8fCB0aGlzLmdldF93cmFwcGVyKCk7XG4gICAgICAkb2ZmX2NhbnZhcy50cmlnZ2VyKCdvcGVuJykudHJpZ2dlcignb3Blbi5mbmR0bi5vZmZjYW52YXMnKTtcbiAgICAgICRvZmZfY2FudmFzLmFkZENsYXNzKGNsYXNzX25hbWUpO1xuICAgIH0sXG5cbiAgICBoaWRlOiBmdW5jdGlvbihjbGFzc19uYW1lLCAkb2ZmX2NhbnZhcykge1xuICAgICAgJG9mZl9jYW52YXMgPSAkb2ZmX2NhbnZhcyB8fCB0aGlzLmdldF93cmFwcGVyKCk7XG4gICAgICAkb2ZmX2NhbnZhcy50cmlnZ2VyKCdjbG9zZScpLnRyaWdnZXIoJ2Nsb3NlLmZuZHRuLm9mZmNhbnZhcycpO1xuICAgICAgJG9mZl9jYW52YXMucmVtb3ZlQ2xhc3MoY2xhc3NfbmFtZSk7XG4gICAgfSxcblxuICAgIGNsaWNrX3RvZ2dsZV9jbGFzczogZnVuY3Rpb24oZSwgY2xhc3NfbmFtZSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdmFyICRvZmZfY2FudmFzID0gdGhpcy5nZXRfd3JhcHBlcihlKTtcbiAgICAgIHRoaXMudG9nZ2xlKGNsYXNzX25hbWUsICRvZmZfY2FudmFzKTtcbiAgICB9LFxuXG4gICAgY2xpY2tfcmVtb3ZlX2NsYXNzOiBmdW5jdGlvbihlLCBjbGFzc19uYW1lKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB2YXIgJG9mZl9jYW52YXMgPSB0aGlzLmdldF93cmFwcGVyKGUpO1xuICAgICAgdGhpcy5oaWRlKGNsYXNzX25hbWUsICRvZmZfY2FudmFzKTtcbiAgICB9LFxuXG4gICAgZ2V0X3NldHRpbmdzOiBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgb2ZmY2FudmFzICA9IHRoaXMuUyhlLnRhcmdldCkuY2xvc2VzdCgnWycgKyB0aGlzLmF0dHJfbmFtZSgpICsgJ10nKTtcbiAgICAgIHJldHVybiBvZmZjYW52YXMuZGF0YSh0aGlzLmF0dHJfbmFtZSh0cnVlKSArICctaW5pdCcpIHx8IHRoaXMuc2V0dGluZ3M7XG4gICAgfSxcblxuICAgIGdldF93cmFwcGVyOiBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgJG9mZl9jYW52YXMgPSB0aGlzLlMoZSA/IGUudGFyZ2V0IDogdGhpcy5zY29wZSkuY2xvc2VzdCgnLm9mZi1jYW52YXMtd3JhcCcpO1xuXG4gICAgICBpZiAoJG9mZl9jYW52YXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICRvZmZfY2FudmFzID0gdGhpcy5TKCcub2ZmLWNhbnZhcy13cmFwJyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gJG9mZl9jYW52YXM7XG4gICAgfSxcblxuICAgIHJlZmxvdyA6IGZ1bmN0aW9uICgpIHt9XG4gIH07XG59KGpRdWVyeSwgd2luZG93LCB3aW5kb3cuZG9jdW1lbnQpKTtcbiIsIjsoZnVuY3Rpb24gKCQsIHdpbmRvdywgZG9jdW1lbnQsIHVuZGVmaW5lZCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIG5vb3AgPSBmdW5jdGlvbigpIHt9O1xuXG4gIHZhciBPcmJpdCA9IGZ1bmN0aW9uKGVsLCBzZXR0aW5ncykge1xuICAgIC8vIERvbid0IHJlaW5pdGlhbGl6ZSBwbHVnaW5cbiAgICBpZiAoZWwuaGFzQ2xhc3Moc2V0dGluZ3Muc2xpZGVzX2NvbnRhaW5lcl9jbGFzcykpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgY29udGFpbmVyLFxuICAgICAgICBzbGlkZXNfY29udGFpbmVyID0gZWwsXG4gICAgICAgIG51bWJlcl9jb250YWluZXIsXG4gICAgICAgIGJ1bGxldHNfY29udGFpbmVyLFxuICAgICAgICB0aW1lcl9jb250YWluZXIsXG4gICAgICAgIGlkeCA9IDAsXG4gICAgICAgIGFuaW1hdGUsXG4gICAgICAgIHRpbWVyLFxuICAgICAgICBsb2NrZWQgPSBmYWxzZSxcbiAgICAgICAgYWRqdXN0X2hlaWdodF9hZnRlciA9IGZhbHNlO1xuXG5cbiAgICBzZWxmLnNsaWRlcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHNsaWRlc19jb250YWluZXIuY2hpbGRyZW4oc2V0dGluZ3Muc2xpZGVfc2VsZWN0b3IpO1xuICAgIH07XG5cbiAgICBzZWxmLnNsaWRlcygpLmZpcnN0KCkuYWRkQ2xhc3Moc2V0dGluZ3MuYWN0aXZlX3NsaWRlX2NsYXNzKTtcblxuICAgIHNlbGYudXBkYXRlX3NsaWRlX251bWJlciA9IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICBpZiAoc2V0dGluZ3Muc2xpZGVfbnVtYmVyKSB7XG4gICAgICAgIG51bWJlcl9jb250YWluZXIuZmluZCgnc3BhbjpmaXJzdCcpLnRleHQocGFyc2VJbnQoaW5kZXgpKzEpO1xuICAgICAgICBudW1iZXJfY29udGFpbmVyLmZpbmQoJ3NwYW46bGFzdCcpLnRleHQoc2VsZi5zbGlkZXMoKS5sZW5ndGgpO1xuICAgICAgfVxuICAgICAgaWYgKHNldHRpbmdzLmJ1bGxldHMpIHtcbiAgICAgICAgYnVsbGV0c19jb250YWluZXIuY2hpbGRyZW4oKS5yZW1vdmVDbGFzcyhzZXR0aW5ncy5idWxsZXRzX2FjdGl2ZV9jbGFzcyk7XG4gICAgICAgICQoYnVsbGV0c19jb250YWluZXIuY2hpbGRyZW4oKS5nZXQoaW5kZXgpKS5hZGRDbGFzcyhzZXR0aW5ncy5idWxsZXRzX2FjdGl2ZV9jbGFzcyk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHNlbGYudXBkYXRlX2FjdGl2ZV9saW5rID0gZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgIHZhciBsaW5rID0gJCgnW2RhdGEtb3JiaXQtbGluaz1cIicrc2VsZi5zbGlkZXMoKS5lcShpbmRleCkuYXR0cignZGF0YS1vcmJpdC1zbGlkZScpKydcIl0nKTtcbiAgICAgIGxpbmsuc2libGluZ3MoKS5yZW1vdmVDbGFzcyhzZXR0aW5ncy5idWxsZXRzX2FjdGl2ZV9jbGFzcyk7XG4gICAgICBsaW5rLmFkZENsYXNzKHNldHRpbmdzLmJ1bGxldHNfYWN0aXZlX2NsYXNzKTtcbiAgICB9O1xuXG4gICAgc2VsZi5idWlsZF9tYXJrdXAgPSBmdW5jdGlvbigpIHtcbiAgICAgIHNsaWRlc19jb250YWluZXIud3JhcCgnPGRpdiBjbGFzcz1cIicrc2V0dGluZ3MuY29udGFpbmVyX2NsYXNzKydcIj48L2Rpdj4nKTtcbiAgICAgIGNvbnRhaW5lciA9IHNsaWRlc19jb250YWluZXIucGFyZW50KCk7XG4gICAgICBzbGlkZXNfY29udGFpbmVyLmFkZENsYXNzKHNldHRpbmdzLnNsaWRlc19jb250YWluZXJfY2xhc3MpO1xuXG4gICAgICBpZiAoc2V0dGluZ3Muc3RhY2tfb25fc21hbGwpIHtcbiAgICAgICAgY29udGFpbmVyLmFkZENsYXNzKHNldHRpbmdzLnN0YWNrX29uX3NtYWxsX2NsYXNzKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHNldHRpbmdzLm5hdmlnYXRpb25fYXJyb3dzKSB7XG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmQoJCgnPGEgaHJlZj1cIiNcIj48c3Bhbj48L3NwYW4+PC9hPicpLmFkZENsYXNzKHNldHRpbmdzLnByZXZfY2xhc3MpKTtcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZCgkKCc8YSBocmVmPVwiI1wiPjxzcGFuPjwvc3Bhbj48L2E+JykuYWRkQ2xhc3Moc2V0dGluZ3MubmV4dF9jbGFzcykpO1xuICAgICAgfVxuXG4gICAgICBpZiAoc2V0dGluZ3MudGltZXIpIHtcbiAgICAgICAgdGltZXJfY29udGFpbmVyID0gJCgnPGRpdj4nKS5hZGRDbGFzcyhzZXR0aW5ncy50aW1lcl9jb250YWluZXJfY2xhc3MpO1xuICAgICAgICB0aW1lcl9jb250YWluZXIuYXBwZW5kKCc8c3Bhbj4nKTtcbiAgICAgICAgdGltZXJfY29udGFpbmVyLmFwcGVuZCgkKCc8ZGl2PicpLmFkZENsYXNzKHNldHRpbmdzLnRpbWVyX3Byb2dyZXNzX2NsYXNzKSk7XG4gICAgICAgIHRpbWVyX2NvbnRhaW5lci5hZGRDbGFzcyhzZXR0aW5ncy50aW1lcl9wYXVzZWRfY2xhc3MpO1xuICAgICAgICBjb250YWluZXIuYXBwZW5kKHRpbWVyX2NvbnRhaW5lcik7XG4gICAgICB9XG5cbiAgICAgIGlmIChzZXR0aW5ncy5zbGlkZV9udW1iZXIpIHtcbiAgICAgICAgbnVtYmVyX2NvbnRhaW5lciA9ICQoJzxkaXY+JykuYWRkQ2xhc3Moc2V0dGluZ3Muc2xpZGVfbnVtYmVyX2NsYXNzKTtcbiAgICAgICAgbnVtYmVyX2NvbnRhaW5lci5hcHBlbmQoJzxzcGFuPjwvc3Bhbj4gJyArIHNldHRpbmdzLnNsaWRlX251bWJlcl90ZXh0ICsgJyA8c3Bhbj48L3NwYW4+Jyk7XG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmQobnVtYmVyX2NvbnRhaW5lcik7XG4gICAgICB9XG5cbiAgICAgIGlmIChzZXR0aW5ncy5idWxsZXRzKSB7XG4gICAgICAgIGJ1bGxldHNfY29udGFpbmVyID0gJCgnPG9sPicpLmFkZENsYXNzKHNldHRpbmdzLmJ1bGxldHNfY29udGFpbmVyX2NsYXNzKTtcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZChidWxsZXRzX2NvbnRhaW5lcik7XG4gICAgICAgIGJ1bGxldHNfY29udGFpbmVyLndyYXAoJzxkaXYgY2xhc3M9XCJvcmJpdC1idWxsZXRzLWNvbnRhaW5lclwiPjwvZGl2PicpO1xuICAgICAgICBzZWxmLnNsaWRlcygpLmVhY2goZnVuY3Rpb24oaWR4LCBlbCkge1xuICAgICAgICAgIHZhciBidWxsZXQgPSAkKCc8bGk+JykuYXR0cignZGF0YS1vcmJpdC1zbGlkZScsIGlkeCkub24oJ2NsaWNrJywgc2VsZi5saW5rX2J1bGxldCk7O1xuICAgICAgICAgIGJ1bGxldHNfY29udGFpbmVyLmFwcGVuZChidWxsZXQpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgIH07XG5cbiAgICBzZWxmLl9nb3RvID0gZnVuY3Rpb24obmV4dF9pZHgsIHN0YXJ0X3RpbWVyKSB7XG4gICAgICAvLyBpZiAobG9ja2VkKSB7cmV0dXJuIGZhbHNlO31cbiAgICAgIGlmIChuZXh0X2lkeCA9PT0gaWR4KSB7cmV0dXJuIGZhbHNlO31cbiAgICAgIGlmICh0eXBlb2YgdGltZXIgPT09ICdvYmplY3QnKSB7dGltZXIucmVzdGFydCgpO31cbiAgICAgIHZhciBzbGlkZXMgPSBzZWxmLnNsaWRlcygpO1xuXG4gICAgICB2YXIgZGlyID0gJ25leHQnO1xuICAgICAgbG9ja2VkID0gdHJ1ZTtcbiAgICAgIGlmIChuZXh0X2lkeCA8IGlkeCkge2RpciA9ICdwcmV2Jzt9XG4gICAgICBpZiAobmV4dF9pZHggPj0gc2xpZGVzLmxlbmd0aCkge1xuICAgICAgICBpZiAoIXNldHRpbmdzLmNpcmN1bGFyKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIG5leHRfaWR4ID0gMDtcbiAgICAgIH0gZWxzZSBpZiAobmV4dF9pZHggPCAwKSB7XG4gICAgICAgIGlmICghc2V0dGluZ3MuY2lyY3VsYXIpIHJldHVybiBmYWxzZTtcbiAgICAgICAgbmV4dF9pZHggPSBzbGlkZXMubGVuZ3RoIC0gMTtcbiAgICAgIH1cblxuICAgICAgdmFyIGN1cnJlbnQgPSAkKHNsaWRlcy5nZXQoaWR4KSk7XG4gICAgICB2YXIgbmV4dCA9ICQoc2xpZGVzLmdldChuZXh0X2lkeCkpO1xuXG4gICAgICBjdXJyZW50LmNzcygnekluZGV4JywgMik7XG4gICAgICBjdXJyZW50LnJlbW92ZUNsYXNzKHNldHRpbmdzLmFjdGl2ZV9zbGlkZV9jbGFzcyk7XG4gICAgICBuZXh0LmNzcygnekluZGV4JywgNCkuYWRkQ2xhc3Moc2V0dGluZ3MuYWN0aXZlX3NsaWRlX2NsYXNzKTtcblxuICAgICAgc2xpZGVzX2NvbnRhaW5lci50cmlnZ2VyKCdiZWZvcmUtc2xpZGUtY2hhbmdlLmZuZHRuLm9yYml0Jyk7XG4gICAgICBzZXR0aW5ncy5iZWZvcmVfc2xpZGVfY2hhbmdlKCk7XG4gICAgICBzZWxmLnVwZGF0ZV9hY3RpdmVfbGluayhuZXh0X2lkeCk7XG5cbiAgICAgIHZhciBjYWxsYmFjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdW5sb2NrID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWR4ID0gbmV4dF9pZHg7XG4gICAgICAgICAgbG9ja2VkID0gZmFsc2U7XG4gICAgICAgICAgaWYgKHN0YXJ0X3RpbWVyID09PSB0cnVlKSB7dGltZXIgPSBzZWxmLmNyZWF0ZV90aW1lcigpOyB0aW1lci5zdGFydCgpO31cbiAgICAgICAgICBzZWxmLnVwZGF0ZV9zbGlkZV9udW1iZXIoaWR4KTtcbiAgICAgICAgICBzbGlkZXNfY29udGFpbmVyLnRyaWdnZXIoJ2FmdGVyLXNsaWRlLWNoYW5nZS5mbmR0bi5vcmJpdCcsW3tzbGlkZV9udW1iZXI6IGlkeCwgdG90YWxfc2xpZGVzOiBzbGlkZXMubGVuZ3RofV0pO1xuICAgICAgICAgIHNldHRpbmdzLmFmdGVyX3NsaWRlX2NoYW5nZShpZHgsIHNsaWRlcy5sZW5ndGgpO1xuICAgICAgICB9O1xuICAgICAgICBpZiAoc2xpZGVzX2NvbnRhaW5lci5oZWlnaHQoKSAhPSBuZXh0LmhlaWdodCgpICYmIHNldHRpbmdzLnZhcmlhYmxlX2hlaWdodCkge1xuICAgICAgICAgIHNsaWRlc19jb250YWluZXIuYW5pbWF0ZSh7J2hlaWdodCc6IG5leHQuaGVpZ2h0KCl9LCAyNTAsICdsaW5lYXInLCB1bmxvY2spO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHVubG9jaygpO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBpZiAoc2xpZGVzLmxlbmd0aCA9PT0gMSkge2NhbGxiYWNrKCk7IHJldHVybiBmYWxzZTt9XG5cbiAgICAgIHZhciBzdGFydF9hbmltYXRpb24gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGRpciA9PT0gJ25leHQnKSB7YW5pbWF0ZS5uZXh0KGN1cnJlbnQsIG5leHQsIGNhbGxiYWNrKTt9XG4gICAgICAgIGlmIChkaXIgPT09ICdwcmV2Jykge2FuaW1hdGUucHJldihjdXJyZW50LCBuZXh0LCBjYWxsYmFjayk7fVxuICAgICAgfTtcblxuICAgICAgaWYgKG5leHQuaGVpZ2h0KCkgPiBzbGlkZXNfY29udGFpbmVyLmhlaWdodCgpICYmIHNldHRpbmdzLnZhcmlhYmxlX2hlaWdodCkge1xuICAgICAgICBzbGlkZXNfY29udGFpbmVyLmFuaW1hdGUoeydoZWlnaHQnOiBuZXh0LmhlaWdodCgpfSwgMjUwLCAnbGluZWFyJywgc3RhcnRfYW5pbWF0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXJ0X2FuaW1hdGlvbigpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBzZWxmLm5leHQgPSBmdW5jdGlvbihlKSB7XG4gICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgc2VsZi5fZ290byhpZHggKyAxKTtcbiAgICB9O1xuXG4gICAgc2VsZi5wcmV2ID0gZnVuY3Rpb24oZSkge1xuICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHNlbGYuX2dvdG8oaWR4IC0gMSk7XG4gICAgfTtcblxuICAgIHNlbGYubGlua19jdXN0b20gPSBmdW5jdGlvbihlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB2YXIgbGluayA9ICQodGhpcykuYXR0cignZGF0YS1vcmJpdC1saW5rJyk7XG4gICAgICBpZiAoKHR5cGVvZiBsaW5rID09PSAnc3RyaW5nJykgJiYgKGxpbmsgPSAkLnRyaW0obGluaykpICE9IFwiXCIpIHtcbiAgICAgICAgdmFyIHNsaWRlID0gY29udGFpbmVyLmZpbmQoJ1tkYXRhLW9yYml0LXNsaWRlPScrbGluaysnXScpO1xuICAgICAgICBpZiAoc2xpZGUuaW5kZXgoKSAhPSAtMSkge3NlbGYuX2dvdG8oc2xpZGUuaW5kZXgoKSk7fVxuICAgICAgfVxuICAgIH07XG5cbiAgICBzZWxmLmxpbmtfYnVsbGV0ID0gZnVuY3Rpb24oZSkge1xuICAgICAgdmFyIGluZGV4ID0gJCh0aGlzKS5hdHRyKCdkYXRhLW9yYml0LXNsaWRlJyk7XG4gICAgICBpZiAoKHR5cGVvZiBpbmRleCA9PT0gJ3N0cmluZycpICYmIChpbmRleCA9ICQudHJpbShpbmRleCkpICE9IFwiXCIpIHtcbiAgICAgICAgaWYoaXNOYU4ocGFyc2VJbnQoaW5kZXgpKSlcbiAgICAgICAge1xuICAgICAgICAgIHZhciBzbGlkZSA9IGNvbnRhaW5lci5maW5kKCdbZGF0YS1vcmJpdC1zbGlkZT0nK2luZGV4KyddJyk7XG4gICAgICAgICAgaWYgKHNsaWRlLmluZGV4KCkgIT0gLTEpIHtzZWxmLl9nb3RvKHNsaWRlLmluZGV4KCkgKyAxKTt9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgc2VsZi5fZ290byhwYXJzZUludChpbmRleCkpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICB9XG5cbiAgICBzZWxmLnRpbWVyX2NhbGxiYWNrID0gZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLl9nb3RvKGlkeCArIDEsIHRydWUpO1xuICAgIH1cblxuICAgIHNlbGYuY29tcHV0ZV9kaW1lbnNpb25zID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgY3VycmVudCA9ICQoc2VsZi5zbGlkZXMoKS5nZXQoaWR4KSk7XG4gICAgICB2YXIgaCA9IGN1cnJlbnQuaGVpZ2h0KCk7XG4gICAgICBpZiAoIXNldHRpbmdzLnZhcmlhYmxlX2hlaWdodCkge1xuICAgICAgICBzZWxmLnNsaWRlcygpLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgICBpZiAoJCh0aGlzKS5oZWlnaHQoKSA+IGgpIHsgaCA9ICQodGhpcykuaGVpZ2h0KCk7IH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBzbGlkZXNfY29udGFpbmVyLmhlaWdodChoKTtcbiAgICB9O1xuXG4gICAgc2VsZi5jcmVhdGVfdGltZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB0ID0gbmV3IFRpbWVyKFxuICAgICAgICBjb250YWluZXIuZmluZCgnLicrc2V0dGluZ3MudGltZXJfY29udGFpbmVyX2NsYXNzKSxcbiAgICAgICAgc2V0dGluZ3MsXG4gICAgICAgIHNlbGYudGltZXJfY2FsbGJhY2tcbiAgICAgICk7XG4gICAgICByZXR1cm4gdDtcbiAgICB9O1xuXG4gICAgc2VsZi5zdG9wX3RpbWVyID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAodHlwZW9mIHRpbWVyID09PSAnb2JqZWN0JykgdGltZXIuc3RvcCgpO1xuICAgIH07XG5cbiAgICBzZWxmLnRvZ2dsZV90aW1lciA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHQgPSBjb250YWluZXIuZmluZCgnLicrc2V0dGluZ3MudGltZXJfY29udGFpbmVyX2NsYXNzKTtcbiAgICAgIGlmICh0Lmhhc0NsYXNzKHNldHRpbmdzLnRpbWVyX3BhdXNlZF9jbGFzcykpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB0aW1lciA9PT0gJ3VuZGVmaW5lZCcpIHt0aW1lciA9IHNlbGYuY3JlYXRlX3RpbWVyKCk7fVxuICAgICAgICB0aW1lci5zdGFydCgpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGlmICh0eXBlb2YgdGltZXIgPT09ICdvYmplY3QnKSB7dGltZXIuc3RvcCgpO31cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgc2VsZi5pbml0ID0gZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLmJ1aWxkX21hcmt1cCgpO1xuICAgICAgaWYgKHNldHRpbmdzLnRpbWVyKSB7XG4gICAgICAgIHRpbWVyID0gc2VsZi5jcmVhdGVfdGltZXIoKTtcbiAgICAgICAgRm91bmRhdGlvbi51dGlscy5pbWFnZV9sb2FkZWQodGhpcy5zbGlkZXMoKS5jaGlsZHJlbignaW1nJyksIHRpbWVyLnN0YXJ0KTtcbiAgICAgIH1cbiAgICAgIGFuaW1hdGUgPSBuZXcgRmFkZUFuaW1hdGlvbihzZXR0aW5ncywgc2xpZGVzX2NvbnRhaW5lcik7XG4gICAgICBpZiAoc2V0dGluZ3MuYW5pbWF0aW9uID09PSAnc2xpZGUnKVxuICAgICAgICBhbmltYXRlID0gbmV3IFNsaWRlQW5pbWF0aW9uKHNldHRpbmdzLCBzbGlkZXNfY29udGFpbmVyKTtcblxuICAgICAgY29udGFpbmVyLm9uKCdjbGljaycsICcuJytzZXR0aW5ncy5uZXh0X2NsYXNzLCBzZWxmLm5leHQpO1xuICAgICAgY29udGFpbmVyLm9uKCdjbGljaycsICcuJytzZXR0aW5ncy5wcmV2X2NsYXNzLCBzZWxmLnByZXYpO1xuXG4gICAgICBpZiAoc2V0dGluZ3MubmV4dF9vbl9jbGljaykge1xuICAgICAgICBjb250YWluZXIub24oJ2NsaWNrJywgJy4nK3NldHRpbmdzLnNsaWRlc19jb250YWluZXJfY2xhc3MrJyBbZGF0YS1vcmJpdC1zbGlkZV0nLCBzZWxmLmxpbmtfYnVsbGV0KTtcbiAgICAgIH1cblxuICAgICAgY29udGFpbmVyLm9uKCdjbGljaycsIHNlbGYudG9nZ2xlX3RpbWVyKTtcbiAgICAgIGlmIChzZXR0aW5ncy5zd2lwZSkge1xuICAgICAgICBjb250YWluZXIub24oJ3RvdWNoc3RhcnQuZm5kdG4ub3JiaXQnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgaWYgKCFlLnRvdWNoZXMpIHtlID0gZS5vcmlnaW5hbEV2ZW50O31cbiAgICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIHN0YXJ0X3BhZ2VfeDogZS50b3VjaGVzWzBdLnBhZ2VYLFxuICAgICAgICAgICAgc3RhcnRfcGFnZV95OiBlLnRvdWNoZXNbMF0ucGFnZVksXG4gICAgICAgICAgICBzdGFydF90aW1lOiAobmV3IERhdGUoKSkuZ2V0VGltZSgpLFxuICAgICAgICAgICAgZGVsdGFfeDogMCxcbiAgICAgICAgICAgIGlzX3Njcm9sbGluZzogdW5kZWZpbmVkXG4gICAgICAgICAgfTtcbiAgICAgICAgICBjb250YWluZXIuZGF0YSgnc3dpcGUtdHJhbnNpdGlvbicsIGRhdGEpO1xuICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbigndG91Y2htb3ZlLmZuZHRuLm9yYml0JywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgIGlmICghZS50b3VjaGVzKSB7IGUgPSBlLm9yaWdpbmFsRXZlbnQ7IH1cbiAgICAgICAgICAvLyBJZ25vcmUgcGluY2gvem9vbSBldmVudHNcbiAgICAgICAgICBpZihlLnRvdWNoZXMubGVuZ3RoID4gMSB8fCBlLnNjYWxlICYmIGUuc2NhbGUgIT09IDEpIHJldHVybjtcblxuICAgICAgICAgIHZhciBkYXRhID0gY29udGFpbmVyLmRhdGEoJ3N3aXBlLXRyYW5zaXRpb24nKTtcbiAgICAgICAgICBpZiAodHlwZW9mIGRhdGEgPT09ICd1bmRlZmluZWQnKSB7ZGF0YSA9IHt9O31cblxuICAgICAgICAgIGRhdGEuZGVsdGFfeCA9IGUudG91Y2hlc1swXS5wYWdlWCAtIGRhdGEuc3RhcnRfcGFnZV94O1xuXG4gICAgICAgICAgaWYgKCB0eXBlb2YgZGF0YS5pc19zY3JvbGxpbmcgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBkYXRhLmlzX3Njcm9sbGluZyA9ICEhKCBkYXRhLmlzX3Njcm9sbGluZyB8fCBNYXRoLmFicyhkYXRhLmRlbHRhX3gpIDwgTWF0aC5hYnMoZS50b3VjaGVzWzBdLnBhZ2VZIC0gZGF0YS5zdGFydF9wYWdlX3kpICk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFkYXRhLmlzX3Njcm9sbGluZyAmJiAhZGF0YS5hY3RpdmUpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHZhciBkaXJlY3Rpb24gPSAoZGF0YS5kZWx0YV94IDwgMCkgPyAoaWR4KzEpIDogKGlkeC0xKTtcbiAgICAgICAgICAgIGRhdGEuYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgICAgIHNlbGYuX2dvdG8oZGlyZWN0aW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5vbigndG91Y2hlbmQuZm5kdG4ub3JiaXQnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgY29udGFpbmVyLmRhdGEoJ3N3aXBlLXRyYW5zaXRpb24nLCB7fSk7XG4gICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICAgIGNvbnRhaW5lci5vbignbW91c2VlbnRlci5mbmR0bi5vcmJpdCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKHNldHRpbmdzLnRpbWVyICYmIHNldHRpbmdzLnBhdXNlX29uX2hvdmVyKSB7XG4gICAgICAgICAgc2VsZi5zdG9wX3RpbWVyKCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAub24oJ21vdXNlbGVhdmUuZm5kdG4ub3JiaXQnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmIChzZXR0aW5ncy50aW1lciAmJiBzZXR0aW5ncy5yZXN1bWVfb25fbW91c2VvdXQpIHtcbiAgICAgICAgICB0aW1lci5zdGFydCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJ1tkYXRhLW9yYml0LWxpbmtdJywgc2VsZi5saW5rX2N1c3RvbSk7XG4gICAgICAkKHdpbmRvdykub24oJ2xvYWQgcmVzaXplJywgc2VsZi5jb21wdXRlX2RpbWVuc2lvbnMpO1xuICAgICAgRm91bmRhdGlvbi51dGlscy5pbWFnZV9sb2FkZWQodGhpcy5zbGlkZXMoKS5jaGlsZHJlbignaW1nJyksIHNlbGYuY29tcHV0ZV9kaW1lbnNpb25zKTtcbiAgICAgIEZvdW5kYXRpb24udXRpbHMuaW1hZ2VfbG9hZGVkKHRoaXMuc2xpZGVzKCkuY2hpbGRyZW4oJ2ltZycpLCBmdW5jdGlvbigpIHtcbiAgICAgICAgY29udGFpbmVyLnByZXYoJy4nK3NldHRpbmdzLnByZWxvYWRlcl9jbGFzcykuY3NzKCdkaXNwbGF5JywgJ25vbmUnKTtcbiAgICAgICAgc2VsZi51cGRhdGVfc2xpZGVfbnVtYmVyKDApO1xuICAgICAgICBzZWxmLnVwZGF0ZV9hY3RpdmVfbGluaygwKTtcbiAgICAgICAgc2xpZGVzX2NvbnRhaW5lci50cmlnZ2VyKCdyZWFkeS5mbmR0bi5vcmJpdCcpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHNlbGYuaW5pdCgpO1xuICB9O1xuXG4gIHZhciBUaW1lciA9IGZ1bmN0aW9uKGVsLCBzZXR0aW5ncywgY2FsbGJhY2spIHtcbiAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgIGR1cmF0aW9uID0gc2V0dGluZ3MudGltZXJfc3BlZWQsXG4gICAgICAgIHByb2dyZXNzID0gZWwuZmluZCgnLicrc2V0dGluZ3MudGltZXJfcHJvZ3Jlc3NfY2xhc3MpLFxuICAgICAgICBzdGFydCxcbiAgICAgICAgdGltZW91dCxcbiAgICAgICAgbGVmdCA9IC0xO1xuXG4gICAgdGhpcy51cGRhdGVfcHJvZ3Jlc3MgPSBmdW5jdGlvbih3KSB7XG4gICAgICB2YXIgbmV3X3Byb2dyZXNzID0gcHJvZ3Jlc3MuY2xvbmUoKTtcbiAgICAgIG5ld19wcm9ncmVzcy5hdHRyKCdzdHlsZScsICcnKTtcbiAgICAgIG5ld19wcm9ncmVzcy5jc3MoJ3dpZHRoJywgdysnJScpO1xuICAgICAgcHJvZ3Jlc3MucmVwbGFjZVdpdGgobmV3X3Byb2dyZXNzKTtcbiAgICAgIHByb2dyZXNzID0gbmV3X3Byb2dyZXNzO1xuICAgIH07XG5cbiAgICB0aGlzLnJlc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgIGVsLmFkZENsYXNzKHNldHRpbmdzLnRpbWVyX3BhdXNlZF9jbGFzcyk7XG4gICAgICBsZWZ0ID0gLTE7XG4gICAgICBzZWxmLnVwZGF0ZV9wcm9ncmVzcygwKTtcbiAgICB9O1xuXG4gICAgdGhpcy5zdGFydCA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCFlbC5oYXNDbGFzcyhzZXR0aW5ncy50aW1lcl9wYXVzZWRfY2xhc3MpKSB7cmV0dXJuIHRydWU7fVxuICAgICAgbGVmdCA9IChsZWZ0ID09PSAtMSkgPyBkdXJhdGlvbiA6IGxlZnQ7XG4gICAgICBlbC5yZW1vdmVDbGFzcyhzZXR0aW5ncy50aW1lcl9wYXVzZWRfY2xhc3MpO1xuICAgICAgc3RhcnQgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgIHByb2dyZXNzLmFuaW1hdGUoeyd3aWR0aCc6ICcxMDAlJ30sIGxlZnQsICdsaW5lYXInKTtcbiAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBzZWxmLnJlc3RhcnQoKTtcbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgIH0sIGxlZnQpO1xuICAgICAgZWwudHJpZ2dlcigndGltZXItc3RhcnRlZC5mbmR0bi5vcmJpdCcpXG4gICAgfTtcblxuICAgIHRoaXMuc3RvcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKGVsLmhhc0NsYXNzKHNldHRpbmdzLnRpbWVyX3BhdXNlZF9jbGFzcykpIHtyZXR1cm4gdHJ1ZTt9XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICBlbC5hZGRDbGFzcyhzZXR0aW5ncy50aW1lcl9wYXVzZWRfY2xhc3MpO1xuICAgICAgdmFyIGVuZCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgbGVmdCA9IGxlZnQgLSAoZW5kIC0gc3RhcnQpO1xuICAgICAgdmFyIHcgPSAxMDAgLSAoKGxlZnQgLyBkdXJhdGlvbikgKiAxMDApO1xuICAgICAgc2VsZi51cGRhdGVfcHJvZ3Jlc3Modyk7XG4gICAgICBlbC50cmlnZ2VyKCd0aW1lci1zdG9wcGVkLmZuZHRuLm9yYml0Jyk7XG4gICAgfTtcbiAgfTtcblxuICB2YXIgU2xpZGVBbmltYXRpb24gPSBmdW5jdGlvbihzZXR0aW5ncywgY29udGFpbmVyKSB7XG4gICAgdmFyIGR1cmF0aW9uID0gc2V0dGluZ3MuYW5pbWF0aW9uX3NwZWVkO1xuICAgIHZhciBpc19ydGwgPSAoJCgnaHRtbFtkaXI9cnRsXScpLmxlbmd0aCA9PT0gMSk7XG4gICAgdmFyIG1hcmdpbiA9IGlzX3J0bCA/ICdtYXJnaW5SaWdodCcgOiAnbWFyZ2luTGVmdCc7XG4gICAgdmFyIGFuaW1NYXJnaW4gPSB7fTtcbiAgICBhbmltTWFyZ2luW21hcmdpbl0gPSAnMCUnO1xuXG4gICAgdGhpcy5uZXh0ID0gZnVuY3Rpb24oY3VycmVudCwgbmV4dCwgY2FsbGJhY2spIHtcbiAgICAgIGN1cnJlbnQuYW5pbWF0ZSh7bWFyZ2luTGVmdDonLTEwMCUnfSwgZHVyYXRpb24pO1xuICAgICAgbmV4dC5hbmltYXRlKGFuaW1NYXJnaW4sIGR1cmF0aW9uLCBmdW5jdGlvbigpIHtcbiAgICAgICAgY3VycmVudC5jc3MobWFyZ2luLCAnMTAwJScpO1xuICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHRoaXMucHJldiA9IGZ1bmN0aW9uKGN1cnJlbnQsIHByZXYsIGNhbGxiYWNrKSB7XG4gICAgICBjdXJyZW50LmFuaW1hdGUoe21hcmdpbkxlZnQ6JzEwMCUnfSwgZHVyYXRpb24pO1xuICAgICAgcHJldi5jc3MobWFyZ2luLCAnLTEwMCUnKTtcbiAgICAgIHByZXYuYW5pbWF0ZShhbmltTWFyZ2luLCBkdXJhdGlvbiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIGN1cnJlbnQuY3NzKG1hcmdpbiwgJzEwMCUnKTtcbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH07XG5cbiAgdmFyIEZhZGVBbmltYXRpb24gPSBmdW5jdGlvbihzZXR0aW5ncywgY29udGFpbmVyKSB7XG4gICAgdmFyIGR1cmF0aW9uID0gc2V0dGluZ3MuYW5pbWF0aW9uX3NwZWVkO1xuICAgIHZhciBpc19ydGwgPSAoJCgnaHRtbFtkaXI9cnRsXScpLmxlbmd0aCA9PT0gMSk7XG4gICAgdmFyIG1hcmdpbiA9IGlzX3J0bCA/ICdtYXJnaW5SaWdodCcgOiAnbWFyZ2luTGVmdCc7XG5cbiAgICB0aGlzLm5leHQgPSBmdW5jdGlvbihjdXJyZW50LCBuZXh0LCBjYWxsYmFjaykge1xuICAgICAgbmV4dC5jc3MoeydtYXJnaW4nOicwJScsICdvcGFjaXR5JzonMC4wMSd9KTtcbiAgICAgIG5leHQuYW5pbWF0ZSh7J29wYWNpdHknOicxJ30sIGR1cmF0aW9uLCAnbGluZWFyJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGN1cnJlbnQuY3NzKCdtYXJnaW4nLCAnMTAwJScpO1xuICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHRoaXMucHJldiA9IGZ1bmN0aW9uKGN1cnJlbnQsIHByZXYsIGNhbGxiYWNrKSB7XG4gICAgICBwcmV2LmNzcyh7J21hcmdpbic6JzAlJywgJ29wYWNpdHknOicwLjAxJ30pO1xuICAgICAgcHJldi5hbmltYXRlKHsnb3BhY2l0eSc6JzEnfSwgZHVyYXRpb24sICdsaW5lYXInLCBmdW5jdGlvbigpIHtcbiAgICAgICAgY3VycmVudC5jc3MoJ21hcmdpbicsICcxMDAlJyk7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9O1xuXG5cbiAgRm91bmRhdGlvbi5saWJzID0gRm91bmRhdGlvbi5saWJzIHx8IHt9O1xuXG4gIEZvdW5kYXRpb24ubGlicy5vcmJpdCA9IHtcbiAgICBuYW1lOiAnb3JiaXQnLFxuXG4gICAgdmVyc2lvbjogJzUuNC41JyxcblxuICAgIHNldHRpbmdzOiB7XG4gICAgICBhbmltYXRpb246ICdzbGlkZScsXG4gICAgICB0aW1lcl9zcGVlZDogMTAwMDAsXG4gICAgICBwYXVzZV9vbl9ob3ZlcjogdHJ1ZSxcbiAgICAgIHJlc3VtZV9vbl9tb3VzZW91dDogZmFsc2UsXG4gICAgICBuZXh0X29uX2NsaWNrOiB0cnVlLFxuICAgICAgYW5pbWF0aW9uX3NwZWVkOiA1MDAsXG4gICAgICBzdGFja19vbl9zbWFsbDogZmFsc2UsXG4gICAgICBuYXZpZ2F0aW9uX2Fycm93czogdHJ1ZSxcbiAgICAgIHNsaWRlX251bWJlcjogdHJ1ZSxcbiAgICAgIHNsaWRlX251bWJlcl90ZXh0OiAnb2YnLFxuICAgICAgY29udGFpbmVyX2NsYXNzOiAnb3JiaXQtY29udGFpbmVyJyxcbiAgICAgIHN0YWNrX29uX3NtYWxsX2NsYXNzOiAnb3JiaXQtc3RhY2stb24tc21hbGwnLFxuICAgICAgbmV4dF9jbGFzczogJ29yYml0LW5leHQnLFxuICAgICAgcHJldl9jbGFzczogJ29yYml0LXByZXYnLFxuICAgICAgdGltZXJfY29udGFpbmVyX2NsYXNzOiAnb3JiaXQtdGltZXInLFxuICAgICAgdGltZXJfcGF1c2VkX2NsYXNzOiAncGF1c2VkJyxcbiAgICAgIHRpbWVyX3Byb2dyZXNzX2NsYXNzOiAnb3JiaXQtcHJvZ3Jlc3MnLFxuICAgICAgc2xpZGVzX2NvbnRhaW5lcl9jbGFzczogJ29yYml0LXNsaWRlcy1jb250YWluZXInLFxuICAgICAgcHJlbG9hZGVyX2NsYXNzOiAncHJlbG9hZGVyJyxcbiAgICAgIHNsaWRlX3NlbGVjdG9yOiAnKicsXG4gICAgICBidWxsZXRzX2NvbnRhaW5lcl9jbGFzczogJ29yYml0LWJ1bGxldHMnLFxuICAgICAgYnVsbGV0c19hY3RpdmVfY2xhc3M6ICdhY3RpdmUnLFxuICAgICAgc2xpZGVfbnVtYmVyX2NsYXNzOiAnb3JiaXQtc2xpZGUtbnVtYmVyJyxcbiAgICAgIGNhcHRpb25fY2xhc3M6ICdvcmJpdC1jYXB0aW9uJyxcbiAgICAgIGFjdGl2ZV9zbGlkZV9jbGFzczogJ2FjdGl2ZScsXG4gICAgICBvcmJpdF90cmFuc2l0aW9uX2NsYXNzOiAnb3JiaXQtdHJhbnNpdGlvbmluZycsXG4gICAgICBidWxsZXRzOiB0cnVlLFxuICAgICAgY2lyY3VsYXI6IHRydWUsXG4gICAgICB0aW1lcjogdHJ1ZSxcbiAgICAgIHZhcmlhYmxlX2hlaWdodDogZmFsc2UsXG4gICAgICBzd2lwZTogdHJ1ZSxcbiAgICAgIGJlZm9yZV9zbGlkZV9jaGFuZ2U6IG5vb3AsXG4gICAgICBhZnRlcl9zbGlkZV9jaGFuZ2U6IG5vb3BcbiAgICB9LFxuXG4gICAgaW5pdCA6IGZ1bmN0aW9uIChzY29wZSwgbWV0aG9kLCBvcHRpb25zKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB0aGlzLmJpbmRpbmdzKG1ldGhvZCwgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIGV2ZW50cyA6IGZ1bmN0aW9uIChpbnN0YW5jZSkge1xuICAgICAgdmFyIG9yYml0X2luc3RhbmNlID0gbmV3IE9yYml0KHRoaXMuUyhpbnN0YW5jZSksIHRoaXMuUyhpbnN0YW5jZSkuZGF0YSgnb3JiaXQtaW5pdCcpKTtcbiAgICAgIHRoaXMuUyhpbnN0YW5jZSkuZGF0YSh0aGlzLm5hbWUgKyAnLWluc3RhbmNlJywgb3JiaXRfaW5zdGFuY2UpO1xuICAgIH0sXG5cbiAgICByZWZsb3cgOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIGlmIChzZWxmLlMoc2VsZi5zY29wZSkuaXMoJ1tkYXRhLW9yYml0XScpKSB7XG4gICAgICAgIHZhciAkZWwgPSBzZWxmLlMoc2VsZi5zY29wZSk7XG4gICAgICAgIHZhciBpbnN0YW5jZSA9ICRlbC5kYXRhKHNlbGYubmFtZSArICctaW5zdGFuY2UnKTtcbiAgICAgICAgaW5zdGFuY2UuY29tcHV0ZV9kaW1lbnNpb25zKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZWxmLlMoJ1tkYXRhLW9yYml0XScsIHNlbGYuc2NvcGUpLmVhY2goZnVuY3Rpb24oaWR4LCBlbCkge1xuICAgICAgICAgIHZhciAkZWwgPSBzZWxmLlMoZWwpO1xuICAgICAgICAgIHZhciBvcHRzID0gc2VsZi5kYXRhX29wdGlvbnMoJGVsKTtcbiAgICAgICAgICB2YXIgaW5zdGFuY2UgPSAkZWwuZGF0YShzZWxmLm5hbWUgKyAnLWluc3RhbmNlJyk7XG4gICAgICAgICAgaW5zdGFuY2UuY29tcHV0ZV9kaW1lbnNpb25zKCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuXG59KGpRdWVyeSwgd2luZG93LCB3aW5kb3cuZG9jdW1lbnQpKTtcbiIsIjsoZnVuY3Rpb24gKCQsIHdpbmRvdywgZG9jdW1lbnQsIHVuZGVmaW5lZCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgRm91bmRhdGlvbi5saWJzLnRvcGJhciA9IHtcbiAgICBuYW1lIDogJ3RvcGJhcicsXG5cbiAgICB2ZXJzaW9uOiAnNS40LjUnLFxuXG4gICAgc2V0dGluZ3MgOiB7XG4gICAgICBpbmRleCA6IDAsXG4gICAgICBzdGlja3lfY2xhc3MgOiAnc3RpY2t5JyxcbiAgICAgIGN1c3RvbV9iYWNrX3RleHQ6IHRydWUsXG4gICAgICBiYWNrX3RleHQ6ICdCYWNrJyxcbiAgICAgIG1vYmlsZV9zaG93X3BhcmVudF9saW5rOiB0cnVlLFxuICAgICAgaXNfaG92ZXI6IHRydWUsXG4gICAgICBzY3JvbGx0b3AgOiB0cnVlLCAvLyBqdW1wIHRvIHRvcCB3aGVuIHN0aWNreSBuYXYgbWVudSB0b2dnbGUgaXMgY2xpY2tlZFxuICAgICAgc3RpY2t5X29uIDogJ2FsbCdcbiAgICB9LFxuXG4gICAgaW5pdCA6IGZ1bmN0aW9uIChzZWN0aW9uLCBtZXRob2QsIG9wdGlvbnMpIHtcbiAgICAgIEZvdW5kYXRpb24uaW5oZXJpdCh0aGlzLCAnYWRkX2N1c3RvbV9ydWxlIHJlZ2lzdGVyX21lZGlhIHRocm90dGxlJyk7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIHNlbGYucmVnaXN0ZXJfbWVkaWEoJ3RvcGJhcicsICdmb3VuZGF0aW9uLW1xLXRvcGJhcicpO1xuXG4gICAgICB0aGlzLmJpbmRpbmdzKG1ldGhvZCwgb3B0aW9ucyk7XG5cbiAgICAgIHNlbGYuUygnWycgKyB0aGlzLmF0dHJfbmFtZSgpICsgJ10nLCB0aGlzLnNjb3BlKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHRvcGJhciA9ICQodGhpcyksXG4gICAgICAgICAgICBzZXR0aW5ncyA9IHRvcGJhci5kYXRhKHNlbGYuYXR0cl9uYW1lKHRydWUpICsgJy1pbml0JyksXG4gICAgICAgICAgICBzZWN0aW9uID0gc2VsZi5TKCdzZWN0aW9uLCAudG9wLWJhci1zZWN0aW9uJywgdGhpcyk7XG4gICAgICAgIHRvcGJhci5kYXRhKCdpbmRleCcsIDApO1xuICAgICAgICB2YXIgdG9wYmFyQ29udGFpbmVyID0gdG9wYmFyLnBhcmVudCgpO1xuICAgICAgICBpZiAodG9wYmFyQ29udGFpbmVyLmhhc0NsYXNzKCdmaXhlZCcpIHx8IHNlbGYuaXNfc3RpY2t5KHRvcGJhciwgdG9wYmFyQ29udGFpbmVyLCBzZXR0aW5ncykgKSB7XG4gICAgICAgICAgc2VsZi5zZXR0aW5ncy5zdGlja3lfY2xhc3MgPSBzZXR0aW5ncy5zdGlja3lfY2xhc3M7XG4gICAgICAgICAgc2VsZi5zZXR0aW5ncy5zdGlja3lfdG9wYmFyID0gdG9wYmFyO1xuICAgICAgICAgIHRvcGJhci5kYXRhKCdoZWlnaHQnLCB0b3BiYXJDb250YWluZXIub3V0ZXJIZWlnaHQoKSk7XG4gICAgICAgICAgdG9wYmFyLmRhdGEoJ3N0aWNreW9mZnNldCcsIHRvcGJhckNvbnRhaW5lci5vZmZzZXQoKS50b3ApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRvcGJhci5kYXRhKCdoZWlnaHQnLCB0b3BiYXIub3V0ZXJIZWlnaHQoKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXNldHRpbmdzLmFzc2VtYmxlZCkge1xuICAgICAgICAgIHNlbGYuYXNzZW1ibGUodG9wYmFyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzZXR0aW5ncy5pc19ob3Zlcikge1xuICAgICAgICAgIHNlbGYuUygnLmhhcy1kcm9wZG93bicsIHRvcGJhcikuYWRkQ2xhc3MoJ25vdC1jbGljaycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlbGYuUygnLmhhcy1kcm9wZG93bicsIHRvcGJhcikucmVtb3ZlQ2xhc3MoJ25vdC1jbGljaycpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUGFkIGJvZHkgd2hlbiBzdGlja3kgKHNjcm9sbGVkKSBvciBmaXhlZC5cbiAgICAgICAgc2VsZi5hZGRfY3VzdG9tX3J1bGUoJy5mLXRvcGJhci1maXhlZCB7IHBhZGRpbmctdG9wOiAnICsgdG9wYmFyLmRhdGEoJ2hlaWdodCcpICsgJ3B4IH0nKTtcblxuICAgICAgICBpZiAodG9wYmFyQ29udGFpbmVyLmhhc0NsYXNzKCdmaXhlZCcpKSB7XG4gICAgICAgICAgc2VsZi5TKCdib2R5JykuYWRkQ2xhc3MoJ2YtdG9wYmFyLWZpeGVkJyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgfSxcblxuICAgIGlzX3N0aWNreTogZnVuY3Rpb24gKHRvcGJhciwgdG9wYmFyQ29udGFpbmVyLCBzZXR0aW5ncykge1xuICAgICAgdmFyIHN0aWNreSA9IHRvcGJhckNvbnRhaW5lci5oYXNDbGFzcyhzZXR0aW5ncy5zdGlja3lfY2xhc3MpO1xuXG4gICAgICBpZiAoc3RpY2t5ICYmIHNldHRpbmdzLnN0aWNreV9vbiA9PT0gJ2FsbCcpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGVsc2UgaWYgKHN0aWNreSAmJiB0aGlzLnNtYWxsKCkgJiYgc2V0dGluZ3Muc3RpY2t5X29uID09PSAnc21hbGwnKSB7XG4gICAgICAgIHJldHVybiAobWF0Y2hNZWRpYShGb3VuZGF0aW9uLm1lZGlhX3F1ZXJpZXMuc21hbGwpLm1hdGNoZXMgJiYgIW1hdGNoTWVkaWEoRm91bmRhdGlvbi5tZWRpYV9xdWVyaWVzLm1lZGl1bSkubWF0Y2hlcyAmJlxuICAgICAgICAgICAgIW1hdGNoTWVkaWEoRm91bmRhdGlvbi5tZWRpYV9xdWVyaWVzLmxhcmdlKS5tYXRjaGVzKTtcbiAgICAgICAgLy9yZXR1cm4gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAoc3RpY2t5ICYmIHRoaXMubWVkaXVtKCkgJiYgc2V0dGluZ3Muc3RpY2t5X29uID09PSAnbWVkaXVtJykge1xuICAgICAgICByZXR1cm4gKG1hdGNoTWVkaWEoRm91bmRhdGlvbi5tZWRpYV9xdWVyaWVzLnNtYWxsKS5tYXRjaGVzICYmIG1hdGNoTWVkaWEoRm91bmRhdGlvbi5tZWRpYV9xdWVyaWVzLm1lZGl1bSkubWF0Y2hlcyAmJlxuICAgICAgICAgICAgIW1hdGNoTWVkaWEoRm91bmRhdGlvbi5tZWRpYV9xdWVyaWVzLmxhcmdlKS5tYXRjaGVzKTtcbiAgICAgICAgLy9yZXR1cm4gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZihzdGlja3kgJiYgdGhpcy5sYXJnZSgpICYmIHNldHRpbmdzLnN0aWNreV9vbiA9PT0gJ2xhcmdlJykge1xuICAgICAgICByZXR1cm4gKG1hdGNoTWVkaWEoRm91bmRhdGlvbi5tZWRpYV9xdWVyaWVzLnNtYWxsKS5tYXRjaGVzICYmIG1hdGNoTWVkaWEoRm91bmRhdGlvbi5tZWRpYV9xdWVyaWVzLm1lZGl1bSkubWF0Y2hlcyAmJlxuICAgICAgICAgICAgbWF0Y2hNZWRpYShGb3VuZGF0aW9uLm1lZGlhX3F1ZXJpZXMubGFyZ2UpLm1hdGNoZXMpO1xuICAgICAgICAvL3JldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuICAgIHRvZ2dsZTogZnVuY3Rpb24gKHRvZ2dsZUVsKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgICAgdG9wYmFyO1xuXG4gICAgICBpZiAodG9nZ2xlRWwpIHtcbiAgICAgICAgdG9wYmFyID0gc2VsZi5TKHRvZ2dsZUVsKS5jbG9zZXN0KCdbJyArIHRoaXMuYXR0cl9uYW1lKCkgKyAnXScpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdG9wYmFyID0gc2VsZi5TKCdbJyArIHRoaXMuYXR0cl9uYW1lKCkgKyAnXScpO1xuICAgICAgfVxuXG4gICAgICB2YXIgc2V0dGluZ3MgPSB0b3BiYXIuZGF0YSh0aGlzLmF0dHJfbmFtZSh0cnVlKSArICctaW5pdCcpO1xuXG4gICAgICB2YXIgc2VjdGlvbiA9IHNlbGYuUygnc2VjdGlvbiwgLnRvcC1iYXItc2VjdGlvbicsIHRvcGJhcik7XG5cbiAgICAgIGlmIChzZWxmLmJyZWFrcG9pbnQoKSkge1xuICAgICAgICBpZiAoIXNlbGYucnRsKSB7XG4gICAgICAgICAgc2VjdGlvbi5jc3Moe2xlZnQ6ICcwJSd9KTtcbiAgICAgICAgICAkKCc+Lm5hbWUnLCBzZWN0aW9uKS5jc3Moe2xlZnQ6ICcxMDAlJ30pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlY3Rpb24uY3NzKHtyaWdodDogJzAlJ30pO1xuICAgICAgICAgICQoJz4ubmFtZScsIHNlY3Rpb24pLmNzcyh7cmlnaHQ6ICcxMDAlJ30pO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5TKCdsaS5tb3ZlZCcsIHNlY3Rpb24pLnJlbW92ZUNsYXNzKCdtb3ZlZCcpO1xuICAgICAgICB0b3BiYXIuZGF0YSgnaW5kZXgnLCAwKTtcblxuICAgICAgICB0b3BiYXJcbiAgICAgICAgICAudG9nZ2xlQ2xhc3MoJ2V4cGFuZGVkJylcbiAgICAgICAgICAuY3NzKCdoZWlnaHQnLCAnJyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChzZXR0aW5ncy5zY3JvbGx0b3ApIHtcbiAgICAgICAgaWYgKCF0b3BiYXIuaGFzQ2xhc3MoJ2V4cGFuZGVkJykpIHtcbiAgICAgICAgICBpZiAodG9wYmFyLmhhc0NsYXNzKCdmaXhlZCcpKSB7XG4gICAgICAgICAgICB0b3BiYXIucGFyZW50KCkuYWRkQ2xhc3MoJ2ZpeGVkJyk7XG4gICAgICAgICAgICB0b3BiYXIucmVtb3ZlQ2xhc3MoJ2ZpeGVkJyk7XG4gICAgICAgICAgICBzZWxmLlMoJ2JvZHknKS5hZGRDbGFzcygnZi10b3BiYXItZml4ZWQnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodG9wYmFyLnBhcmVudCgpLmhhc0NsYXNzKCdmaXhlZCcpKSB7XG4gICAgICAgICAgaWYgKHNldHRpbmdzLnNjcm9sbHRvcCkge1xuICAgICAgICAgICAgdG9wYmFyLnBhcmVudCgpLnJlbW92ZUNsYXNzKCdmaXhlZCcpO1xuICAgICAgICAgICAgdG9wYmFyLmFkZENsYXNzKCdmaXhlZCcpO1xuICAgICAgICAgICAgc2VsZi5TKCdib2R5JykucmVtb3ZlQ2xhc3MoJ2YtdG9wYmFyLWZpeGVkJyk7XG5cbiAgICAgICAgICAgIHdpbmRvdy5zY3JvbGxUbygwLDApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0b3BiYXIucGFyZW50KCkucmVtb3ZlQ2xhc3MoJ2V4cGFuZGVkJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoc2VsZi5pc19zdGlja3kodG9wYmFyLCB0b3BiYXIucGFyZW50KCksIHNldHRpbmdzKSkge1xuICAgICAgICAgIHRvcGJhci5wYXJlbnQoKS5hZGRDbGFzcygnZml4ZWQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0b3BiYXIucGFyZW50KCkuaGFzQ2xhc3MoJ2ZpeGVkJykpIHtcbiAgICAgICAgICBpZiAoIXRvcGJhci5oYXNDbGFzcygnZXhwYW5kZWQnKSkge1xuICAgICAgICAgICAgdG9wYmFyLnJlbW92ZUNsYXNzKCdmaXhlZCcpO1xuICAgICAgICAgICAgdG9wYmFyLnBhcmVudCgpLnJlbW92ZUNsYXNzKCdleHBhbmRlZCcpO1xuICAgICAgICAgICAgc2VsZi51cGRhdGVfc3RpY2t5X3Bvc2l0aW9uaW5nKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRvcGJhci5hZGRDbGFzcygnZml4ZWQnKTtcbiAgICAgICAgICAgIHRvcGJhci5wYXJlbnQoKS5hZGRDbGFzcygnZXhwYW5kZWQnKTtcbiAgICAgICAgICAgIHNlbGYuUygnYm9keScpLmFkZENsYXNzKCdmLXRvcGJhci1maXhlZCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG5cbiAgICB0aW1lciA6IG51bGwsXG5cbiAgICBldmVudHMgOiBmdW5jdGlvbiAoYmFyKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgICAgUyA9IHRoaXMuUztcblxuICAgICAgUyh0aGlzLnNjb3BlKVxuICAgICAgICAub2ZmKCcudG9wYmFyJylcbiAgICAgICAgLm9uKCdjbGljay5mbmR0bi50b3BiYXInLCAnWycgKyB0aGlzLmF0dHJfbmFtZSgpICsgJ10gLnRvZ2dsZS10b3BiYXInLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICBzZWxmLnRvZ2dsZSh0aGlzKTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdjbGljay5mbmR0bi50b3BiYXInLCcudG9wLWJhciAudG9wLWJhci1zZWN0aW9uIGxpIGFbaHJlZl49XCIjXCJdLFsnICsgdGhpcy5hdHRyX25hbWUoKSArICddIC50b3AtYmFyLXNlY3Rpb24gbGkgYVtocmVmXj1cIiNcIl0nLGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICB2YXIgbGkgPSAkKHRoaXMpLmNsb3Nlc3QoJ2xpJyk7XG4gICAgICAgICAgICBpZihzZWxmLmJyZWFrcG9pbnQoKSAmJiAhbGkuaGFzQ2xhc3MoJ2JhY2snKSAmJiAhbGkuaGFzQ2xhc3MoJ2hhcy1kcm9wZG93bicpKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgc2VsZi50b2dnbGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdjbGljay5mbmR0bi50b3BiYXInLCAnWycgKyB0aGlzLmF0dHJfbmFtZSgpICsgJ10gbGkuaGFzLWRyb3Bkb3duJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICB2YXIgbGkgPSBTKHRoaXMpLFxuICAgICAgICAgICAgICB0YXJnZXQgPSBTKGUudGFyZ2V0KSxcbiAgICAgICAgICAgICAgdG9wYmFyID0gbGkuY2xvc2VzdCgnWycgKyBzZWxmLmF0dHJfbmFtZSgpICsgJ10nKSxcbiAgICAgICAgICAgICAgc2V0dGluZ3MgPSB0b3BiYXIuZGF0YShzZWxmLmF0dHJfbmFtZSh0cnVlKSArICctaW5pdCcpO1xuXG4gICAgICAgICAgaWYodGFyZ2V0LmRhdGEoJ3JldmVhbElkJykpIHtcbiAgICAgICAgICAgIHNlbGYudG9nZ2xlKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHNlbGYuYnJlYWtwb2ludCgpKSByZXR1cm47XG4gICAgICAgICAgaWYgKHNldHRpbmdzLmlzX2hvdmVyICYmICFNb2Rlcm5penIudG91Y2gpIHJldHVybjtcblxuICAgICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG5cbiAgICAgICAgICBpZiAobGkuaGFzQ2xhc3MoJ2hvdmVyJykpIHtcbiAgICAgICAgICAgIGxpXG4gICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnaG92ZXInKVxuICAgICAgICAgICAgICAuZmluZCgnbGknKVxuICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2hvdmVyJyk7XG5cbiAgICAgICAgICAgIGxpLnBhcmVudHMoJ2xpLmhvdmVyJylcbiAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdob3ZlcicpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsaS5hZGRDbGFzcygnaG92ZXInKTtcblxuICAgICAgICAgICAgJChsaSkuc2libGluZ3MoKS5yZW1vdmVDbGFzcygnaG92ZXInKTtcblxuICAgICAgICAgICAgaWYgKHRhcmdldFswXS5ub2RlTmFtZSA9PT0gJ0EnICYmIHRhcmdldC5wYXJlbnQoKS5oYXNDbGFzcygnaGFzLWRyb3Bkb3duJykpIHtcbiAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdjbGljay5mbmR0bi50b3BiYXInLCAnWycgKyB0aGlzLmF0dHJfbmFtZSgpICsgJ10gLmhhcy1kcm9wZG93bj5hJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICBpZiAoc2VsZi5icmVha3BvaW50KCkpIHtcblxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgICB2YXIgJHRoaXMgPSBTKHRoaXMpLFxuICAgICAgICAgICAgICAgIHRvcGJhciA9ICR0aGlzLmNsb3Nlc3QoJ1snICsgc2VsZi5hdHRyX25hbWUoKSArICddJyksXG4gICAgICAgICAgICAgICAgc2VjdGlvbiA9IHRvcGJhci5maW5kKCdzZWN0aW9uLCAudG9wLWJhci1zZWN0aW9uJyksXG4gICAgICAgICAgICAgICAgZHJvcGRvd25IZWlnaHQgPSAkdGhpcy5uZXh0KCcuZHJvcGRvd24nKS5vdXRlckhlaWdodCgpLFxuICAgICAgICAgICAgICAgICRzZWxlY3RlZExpID0gJHRoaXMuY2xvc2VzdCgnbGknKTtcblxuICAgICAgICAgICAgdG9wYmFyLmRhdGEoJ2luZGV4JywgdG9wYmFyLmRhdGEoJ2luZGV4JykgKyAxKTtcbiAgICAgICAgICAgICRzZWxlY3RlZExpLmFkZENsYXNzKCdtb3ZlZCcpO1xuXG4gICAgICAgICAgICBpZiAoIXNlbGYucnRsKSB7XG4gICAgICAgICAgICAgIHNlY3Rpb24uY3NzKHtsZWZ0OiAtKDEwMCAqIHRvcGJhci5kYXRhKCdpbmRleCcpKSArICclJ30pO1xuICAgICAgICAgICAgICBzZWN0aW9uLmZpbmQoJz4ubmFtZScpLmNzcyh7bGVmdDogMTAwICogdG9wYmFyLmRhdGEoJ2luZGV4JykgKyAnJSd9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHNlY3Rpb24uY3NzKHtyaWdodDogLSgxMDAgKiB0b3BiYXIuZGF0YSgnaW5kZXgnKSkgKyAnJSd9KTtcbiAgICAgICAgICAgICAgc2VjdGlvbi5maW5kKCc+Lm5hbWUnKS5jc3Moe3JpZ2h0OiAxMDAgKiB0b3BiYXIuZGF0YSgnaW5kZXgnKSArICclJ30pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0b3BiYXIuY3NzKCdoZWlnaHQnLCAkdGhpcy5zaWJsaW5ncygndWwnKS5vdXRlckhlaWdodCh0cnVlKSArIHRvcGJhci5kYXRhKCdoZWlnaHQnKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgUyh3aW5kb3cpLm9mZihcIi50b3BiYXJcIikub24oXCJyZXNpemUuZm5kdG4udG9wYmFyXCIsIHNlbGYudGhyb3R0bGUoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgc2VsZi5yZXNpemUuY2FsbChzZWxmKTtcbiAgICAgIH0sIDUwKSkudHJpZ2dlcihcInJlc2l6ZVwiKS50cmlnZ2VyKFwicmVzaXplLmZuZHRuLnRvcGJhclwiKS5sb2FkKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgLy8gRW5zdXJlIHRoYXQgdGhlIG9mZnNldCBpcyBjYWxjdWxhdGVkIGFmdGVyIGFsbCBvZiB0aGUgcGFnZXMgcmVzb3VyY2VzIGhhdmUgbG9hZGVkXG4gICAgICAgICAgUyh0aGlzKS50cmlnZ2VyKFwicmVzaXplLmZuZHRuLnRvcGJhclwiKTtcbiAgICAgIH0pO1xuXG4gICAgICBTKCdib2R5Jykub2ZmKCcudG9wYmFyJykub24oJ2NsaWNrLmZuZHRuLnRvcGJhcicsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHZhciBwYXJlbnQgPSBTKGUudGFyZ2V0KS5jbG9zZXN0KCdsaScpLmNsb3Nlc3QoJ2xpLmhvdmVyJyk7XG5cbiAgICAgICAgaWYgKHBhcmVudC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgUygnWycgKyBzZWxmLmF0dHJfbmFtZSgpICsgJ10gbGkuaG92ZXInKS5yZW1vdmVDbGFzcygnaG92ZXInKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBHbyB1cCBhIGxldmVsIG9uIENsaWNrXG4gICAgICBTKHRoaXMuc2NvcGUpLm9uKCdjbGljay5mbmR0bi50b3BiYXInLCAnWycgKyB0aGlzLmF0dHJfbmFtZSgpICsgJ10gLmhhcy1kcm9wZG93biAuYmFjaycsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICB2YXIgJHRoaXMgPSBTKHRoaXMpLFxuICAgICAgICAgICAgdG9wYmFyID0gJHRoaXMuY2xvc2VzdCgnWycgKyBzZWxmLmF0dHJfbmFtZSgpICsgJ10nKSxcbiAgICAgICAgICAgIHNlY3Rpb24gPSB0b3BiYXIuZmluZCgnc2VjdGlvbiwgLnRvcC1iYXItc2VjdGlvbicpLFxuICAgICAgICAgICAgc2V0dGluZ3MgPSB0b3BiYXIuZGF0YShzZWxmLmF0dHJfbmFtZSh0cnVlKSArICctaW5pdCcpLFxuICAgICAgICAgICAgJG1vdmVkTGkgPSAkdGhpcy5jbG9zZXN0KCdsaS5tb3ZlZCcpLFxuICAgICAgICAgICAgJHByZXZpb3VzTGV2ZWxVbCA9ICRtb3ZlZExpLnBhcmVudCgpO1xuXG4gICAgICAgIHRvcGJhci5kYXRhKCdpbmRleCcsIHRvcGJhci5kYXRhKCdpbmRleCcpIC0gMSk7XG5cbiAgICAgICAgaWYgKCFzZWxmLnJ0bCkge1xuICAgICAgICAgIHNlY3Rpb24uY3NzKHtsZWZ0OiAtKDEwMCAqIHRvcGJhci5kYXRhKCdpbmRleCcpKSArICclJ30pO1xuICAgICAgICAgIHNlY3Rpb24uZmluZCgnPi5uYW1lJykuY3NzKHtsZWZ0OiAxMDAgKiB0b3BiYXIuZGF0YSgnaW5kZXgnKSArICclJ30pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlY3Rpb24uY3NzKHtyaWdodDogLSgxMDAgKiB0b3BiYXIuZGF0YSgnaW5kZXgnKSkgKyAnJSd9KTtcbiAgICAgICAgICBzZWN0aW9uLmZpbmQoJz4ubmFtZScpLmNzcyh7cmlnaHQ6IDEwMCAqIHRvcGJhci5kYXRhKCdpbmRleCcpICsgJyUnfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodG9wYmFyLmRhdGEoJ2luZGV4JykgPT09IDApIHtcbiAgICAgICAgICB0b3BiYXIuY3NzKCdoZWlnaHQnLCAnJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdG9wYmFyLmNzcygnaGVpZ2h0JywgJHByZXZpb3VzTGV2ZWxVbC5vdXRlckhlaWdodCh0cnVlKSArIHRvcGJhci5kYXRhKCdoZWlnaHQnKSk7XG4gICAgICAgIH1cblxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAkbW92ZWRMaS5yZW1vdmVDbGFzcygnbW92ZWQnKTtcbiAgICAgICAgfSwgMzAwKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBTaG93IGRyb3Bkb3duIG1lbnVzIHdoZW4gdGhlaXIgaXRlbXMgYXJlIGZvY3VzZWRcbiAgICAgIFModGhpcy5zY29wZSkuZmluZCgnLmRyb3Bkb3duIGEnKVxuICAgICAgICAuZm9jdXMoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgJCh0aGlzKS5wYXJlbnRzKCcuaGFzLWRyb3Bkb3duJykuYWRkQ2xhc3MoJ2hvdmVyJyk7XG4gICAgICAgIH0pXG4gICAgICAgIC5ibHVyKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICQodGhpcykucGFyZW50cygnLmhhcy1kcm9wZG93bicpLnJlbW92ZUNsYXNzKCdob3ZlcicpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgcmVzaXplIDogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgc2VsZi5TKCdbJyArIHRoaXMuYXR0cl9uYW1lKCkgKyAnXScpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdG9wYmFyID0gc2VsZi5TKHRoaXMpLFxuICAgICAgICAgICAgc2V0dGluZ3MgPSB0b3BiYXIuZGF0YShzZWxmLmF0dHJfbmFtZSh0cnVlKSArICctaW5pdCcpO1xuXG4gICAgICAgIHZhciBzdGlja3lDb250YWluZXIgPSB0b3BiYXIucGFyZW50KCcuJyArIHNlbGYuc2V0dGluZ3Muc3RpY2t5X2NsYXNzKTtcbiAgICAgICAgdmFyIHN0aWNreU9mZnNldDtcblxuICAgICAgICBpZiAoIXNlbGYuYnJlYWtwb2ludCgpKSB7XG4gICAgICAgICAgdmFyIGRvVG9nZ2xlID0gdG9wYmFyLmhhc0NsYXNzKCdleHBhbmRlZCcpO1xuICAgICAgICAgIHRvcGJhclxuICAgICAgICAgICAgLmNzcygnaGVpZ2h0JywgJycpXG4gICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2V4cGFuZGVkJylcbiAgICAgICAgICAgIC5maW5kKCdsaScpXG4gICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2hvdmVyJyk7XG5cbiAgICAgICAgICAgIGlmKGRvVG9nZ2xlKSB7XG4gICAgICAgICAgICAgIHNlbGYudG9nZ2xlKHRvcGJhcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZihzZWxmLmlzX3N0aWNreSh0b3BiYXIsIHN0aWNreUNvbnRhaW5lciwgc2V0dGluZ3MpKSB7XG4gICAgICAgICAgaWYoc3RpY2t5Q29udGFpbmVyLmhhc0NsYXNzKCdmaXhlZCcpKSB7XG4gICAgICAgICAgICAvLyBSZW1vdmUgdGhlIGZpeGVkIHRvIGFsbG93IGZvciBjb3JyZWN0IGNhbGN1bGF0aW9uIG9mIHRoZSBvZmZzZXQuXG4gICAgICAgICAgICBzdGlja3lDb250YWluZXIucmVtb3ZlQ2xhc3MoJ2ZpeGVkJyk7XG5cbiAgICAgICAgICAgIHN0aWNreU9mZnNldCA9IHN0aWNreUNvbnRhaW5lci5vZmZzZXQoKS50b3A7XG4gICAgICAgICAgICBpZihzZWxmLlMoZG9jdW1lbnQuYm9keSkuaGFzQ2xhc3MoJ2YtdG9wYmFyLWZpeGVkJykpIHtcbiAgICAgICAgICAgICAgc3RpY2t5T2Zmc2V0IC09IHRvcGJhci5kYXRhKCdoZWlnaHQnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdG9wYmFyLmRhdGEoJ3N0aWNreW9mZnNldCcsIHN0aWNreU9mZnNldCk7XG4gICAgICAgICAgICBzdGlja3lDb250YWluZXIuYWRkQ2xhc3MoJ2ZpeGVkJyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0aWNreU9mZnNldCA9IHN0aWNreUNvbnRhaW5lci5vZmZzZXQoKS50b3A7XG4gICAgICAgICAgICB0b3BiYXIuZGF0YSgnc3RpY2t5b2Zmc2V0Jywgc3RpY2t5T2Zmc2V0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgfSk7XG4gICAgfSxcblxuICAgIGJyZWFrcG9pbnQgOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gIW1hdGNoTWVkaWEoRm91bmRhdGlvbi5tZWRpYV9xdWVyaWVzWyd0b3BiYXInXSkubWF0Y2hlcztcbiAgICB9LFxuXG4gICAgc21hbGwgOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gbWF0Y2hNZWRpYShGb3VuZGF0aW9uLm1lZGlhX3F1ZXJpZXNbJ3NtYWxsJ10pLm1hdGNoZXM7XG4gICAgfSxcblxuICAgIG1lZGl1bSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBtYXRjaE1lZGlhKEZvdW5kYXRpb24ubWVkaWFfcXVlcmllc1snbWVkaXVtJ10pLm1hdGNoZXM7XG4gICAgfSxcblxuICAgIGxhcmdlIDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIG1hdGNoTWVkaWEoRm91bmRhdGlvbi5tZWRpYV9xdWVyaWVzWydsYXJnZSddKS5tYXRjaGVzO1xuICAgIH0sXG5cbiAgICBhc3NlbWJsZSA6IGZ1bmN0aW9uICh0b3BiYXIpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgICBzZXR0aW5ncyA9IHRvcGJhci5kYXRhKHRoaXMuYXR0cl9uYW1lKHRydWUpICsgJy1pbml0JyksXG4gICAgICAgICAgc2VjdGlvbiA9IHNlbGYuUygnc2VjdGlvbiwgLnRvcC1iYXItc2VjdGlvbicsIHRvcGJhcik7XG5cbiAgICAgIC8vIFB1bGwgZWxlbWVudCBvdXQgb2YgdGhlIERPTSBmb3IgbWFuaXB1bGF0aW9uXG4gICAgICBzZWN0aW9uLmRldGFjaCgpO1xuXG4gICAgICBzZWxmLlMoJy5oYXMtZHJvcGRvd24+YScsIHNlY3Rpb24pLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgJGxpbmsgPSBzZWxmLlModGhpcyksXG4gICAgICAgICAgICAkZHJvcGRvd24gPSAkbGluay5zaWJsaW5ncygnLmRyb3Bkb3duJyksXG4gICAgICAgICAgICB1cmwgPSAkbGluay5hdHRyKCdocmVmJyksXG4gICAgICAgICAgICAkdGl0bGVMaTtcblxuXG4gICAgICAgIGlmICghJGRyb3Bkb3duLmZpbmQoJy50aXRsZS5iYWNrJykubGVuZ3RoKSB7XG5cbiAgICAgICAgICBpZiAoc2V0dGluZ3MubW9iaWxlX3Nob3dfcGFyZW50X2xpbmsgPT0gdHJ1ZSAmJiB1cmwpIHtcbiAgICAgICAgICAgICR0aXRsZUxpID0gJCgnPGxpIGNsYXNzPVwidGl0bGUgYmFjayBqcy1nZW5lcmF0ZWRcIj48aDU+PGEgaHJlZj1cImphdmFzY3JpcHQ6dm9pZCgwKVwiPjwvYT48L2g1PjwvbGk+PGxpIGNsYXNzPVwicGFyZW50LWxpbmsgc2hvdy1mb3Itc21hbGxcIj48YSBjbGFzcz1cInBhcmVudC1saW5rIGpzLWdlbmVyYXRlZFwiIGhyZWY9XCInICsgdXJsICsgJ1wiPicgKyAkbGluay5odG1sKCkgKyc8L2E+PC9saT4nKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHRpdGxlTGkgPSAkKCc8bGkgY2xhc3M9XCJ0aXRsZSBiYWNrIGpzLWdlbmVyYXRlZFwiPjxoNT48YSBocmVmPVwiamF2YXNjcmlwdDp2b2lkKDApXCI+PC9hPjwvaDU+Jyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQ29weSBsaW5rIHRvIHN1Ym5hdlxuICAgICAgICAgIGlmIChzZXR0aW5ncy5jdXN0b21fYmFja190ZXh0ID09IHRydWUpIHtcbiAgICAgICAgICAgICQoJ2g1PmEnLCAkdGl0bGVMaSkuaHRtbChzZXR0aW5ncy5iYWNrX3RleHQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkKCdoNT5hJywgJHRpdGxlTGkpLmh0bWwoJyZsYXF1bzsgJyArICRsaW5rLmh0bWwoKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgICRkcm9wZG93bi5wcmVwZW5kKCR0aXRsZUxpKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIFB1dCBlbGVtZW50IGJhY2sgaW4gdGhlIERPTVxuICAgICAgc2VjdGlvbi5hcHBlbmRUbyh0b3BiYXIpO1xuXG4gICAgICAvLyBjaGVjayBmb3Igc3RpY2t5XG4gICAgICB0aGlzLnN0aWNreSgpO1xuXG4gICAgICB0aGlzLmFzc2VtYmxlZCh0b3BiYXIpO1xuICAgIH0sXG5cbiAgICBhc3NlbWJsZWQgOiBmdW5jdGlvbiAodG9wYmFyKSB7XG4gICAgICB0b3BiYXIuZGF0YSh0aGlzLmF0dHJfbmFtZSh0cnVlKSwgJC5leHRlbmQoe30sIHRvcGJhci5kYXRhKHRoaXMuYXR0cl9uYW1lKHRydWUpKSwge2Fzc2VtYmxlZDogdHJ1ZX0pKTtcbiAgICB9LFxuXG4gICAgaGVpZ2h0IDogZnVuY3Rpb24gKHVsKSB7XG4gICAgICB2YXIgdG90YWwgPSAwLFxuICAgICAgICAgIHNlbGYgPSB0aGlzO1xuXG4gICAgICAkKCc+IGxpJywgdWwpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICB0b3RhbCArPSBzZWxmLlModGhpcykub3V0ZXJIZWlnaHQodHJ1ZSk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHRvdGFsO1xuICAgIH0sXG5cbiAgICBzdGlja3kgOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIHRoaXMuUyh3aW5kb3cpLm9uKCdzY3JvbGwnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgc2VsZi51cGRhdGVfc3RpY2t5X3Bvc2l0aW9uaW5nKCk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgdXBkYXRlX3N0aWNreV9wb3NpdGlvbmluZzogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIga2xhc3MgPSAnLicgKyB0aGlzLnNldHRpbmdzLnN0aWNreV9jbGFzcyxcbiAgICAgICAgICAkd2luZG93ID0gdGhpcy5TKHdpbmRvdyksXG4gICAgICAgICAgc2VsZiA9IHRoaXM7XG5cbiAgICAgIGlmIChzZWxmLnNldHRpbmdzLnN0aWNreV90b3BiYXIgJiYgc2VsZi5pc19zdGlja3kodGhpcy5zZXR0aW5ncy5zdGlja3lfdG9wYmFyLHRoaXMuc2V0dGluZ3Muc3RpY2t5X3RvcGJhci5wYXJlbnQoKSwgdGhpcy5zZXR0aW5ncykpIHtcbiAgICAgICAgdmFyIGRpc3RhbmNlID0gdGhpcy5zZXR0aW5ncy5zdGlja3lfdG9wYmFyLmRhdGEoJ3N0aWNreW9mZnNldCcpO1xuICAgICAgICBpZiAoIXNlbGYuUyhrbGFzcykuaGFzQ2xhc3MoJ2V4cGFuZGVkJykpIHtcbiAgICAgICAgICBpZiAoJHdpbmRvdy5zY3JvbGxUb3AoKSA+IChkaXN0YW5jZSkpIHtcbiAgICAgICAgICAgIGlmICghc2VsZi5TKGtsYXNzKS5oYXNDbGFzcygnZml4ZWQnKSkge1xuICAgICAgICAgICAgICBzZWxmLlMoa2xhc3MpLmFkZENsYXNzKCdmaXhlZCcpO1xuICAgICAgICAgICAgICBzZWxmLlMoJ2JvZHknKS5hZGRDbGFzcygnZi10b3BiYXItZml4ZWQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKCR3aW5kb3cuc2Nyb2xsVG9wKCkgPD0gZGlzdGFuY2UpIHtcbiAgICAgICAgICAgIGlmIChzZWxmLlMoa2xhc3MpLmhhc0NsYXNzKCdmaXhlZCcpKSB7XG4gICAgICAgICAgICAgIHNlbGYuUyhrbGFzcykucmVtb3ZlQ2xhc3MoJ2ZpeGVkJyk7XG4gICAgICAgICAgICAgIHNlbGYuUygnYm9keScpLnJlbW92ZUNsYXNzKCdmLXRvcGJhci1maXhlZCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG5cbiAgICBvZmYgOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLlModGhpcy5zY29wZSkub2ZmKCcuZm5kdG4udG9wYmFyJyk7XG4gICAgICB0aGlzLlMod2luZG93KS5vZmYoJy5mbmR0bi50b3BiYXInKTtcbiAgICB9LFxuXG4gICAgcmVmbG93IDogZnVuY3Rpb24gKCkge31cbiAgfTtcbn0oalF1ZXJ5LCB3aW5kb3csIHdpbmRvdy5kb2N1bWVudCkpO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9