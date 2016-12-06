/* eslint-env node, browser*/
/* eslint no-console:0 */

var Nightmare = require('nightmare');
var path = require('path');
require('nightmare-inline-download')(Nightmare);

//switch to nightmare-download-manager for more control and feed back on download proccess


Nightmare.action('printJAM', function (name, options, parent, win, renderer, done) {
        console.log(name);
        parent.respondTo('printJAM', function (words, done) {
            //document.querySelector('h1').innerHTML = words;
            console.log("electron scope: " + words);
            done(null, words);

        });
        done();
    },
    function (words, done) {
        console.log("words1: " + words);
        //console.log(this);
        this.child.call('printJAM', words, done);
        return this;
    }
);


Nightmare.action('printWinSize', function (done) {
    this.evaluate_now(function (done) {
        var out = {
            w: Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
            h: Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
        };
        console.log(out);
        done();
    }, done)
    done();
});

Nightmare.action('waitURL', function (url, done) {
    console.log("kind of in window: " + url);
    this.evaluate_now(function (url, done) {
        console.log("in window:", url);
        console.log(url);
        var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
        var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
        console.log({
            height: h,
            width: w
        });
        return done;
    }, done, url)
});

Nightmare.action('waitURL2', function (url, done) {
    url = new RegExp(url);
    this.wait(function (url) {
        return url.test(document.location.href);
    }, url);
});

var plugin = {
    waitURL: function (urlRegEx) {
        var url = new RegExp(urlRegEx);
        return function (nightmare) {
            nightmare.wait(function () {
                return url.test(document.location.href);
            })
        }
    }
}




var nightmare = Nightmare({
    show: true,
    typeInterval: 20,
    alwaysOnTop: false,
    openDevTools: {
        mode: 'detach'
    },
    waitTimeout: 2 * 60 * 1000
});


//nightmare.on('console', function (type, data, data2) {
//    console.log('Catch Window Log ------------------------');
//    console.log(data);
//    console.log(data2);
//    console.log('End Window Log   ------------------------\n');
//});

//var ou = "55363";
//var ou = "112655";
//var ou = "10011";
var coolpath = path.resolve('./test.html');
//console.log(coolpath);
nightmare
    .goto('file:///' + coolpath)
    .goto('http://www.lds.org')
    .printWinSize()
    //.waitURL("this is my URL")
    //.printJAM("hi")
    //    .then(function (words, done) {
    //        console.log("in the end ", words);
    //        return done;
    //    })

//.end()
.then(function () {
        console.log("make it to the end");

    })
    .catch(function (error) {
        console.error(error);
    });
