/* eslint-env node, browser*/
/* eslint no-console:0 */

var Nightmare = require('nightmare');
require('nightmare-inline-download')(Nightmare);
//switch to nightmare-download-manager for more control and feed back on download proccess

Nightmare.action('gotoLocal', function (name, options, parent, win, renderer, done) {
    parent.respondTo('gotoLocal', function (url, done) {
        var path = require('path');
        win.loadURL(url.format({
            pathname: path.join(__dirname, 'index.html'),
            protocol: 'file:',
            slashes: true
        }));
        done();
    });
    done();
}, function (url, done) {
    this.child.call('gotoLocal', done);
});

var nightmare = Nightmare({
    show: true,
    typeInterval: 20,
    alwaysOnTop: false,
    //    openDevTools: {
    //        mode: 'detach'
    //    },
    waitTimeout: 2 * 60 * 1000
});


var ou = "55363";
//var ou = "112655";
//var ou = "10011";

nightmare
    .goto('./test.html')
    //.end()
    .then(function () {
        console.log("done");
    })
    .catch(function (error) {
        console.error(error);
    });




parent.respondTo('goto', function (url, headers, timeout, done) {
    if (!url || typeof url !== 'string') {
        return done('goto: `url` must be a non-empty string');
    }

    var httpReferrer = '';
    var extraHeaders = '';
    for (var key in headers) {
        if (key.toLowerCase() == 'referer') {
            httpReferrer = headers[key];
            continue;
        }

        extraHeaders += key + ': ' + headers[key] + '\n';
    }
    var loadUrlOptions = {
        extraHeaders: extraHeaders
    };
    httpReferrer && (loadUrlOptions.httpReferrer = httpReferrer);

    if (win.webContents.getURL() == url) {
        done();
    } else {
        var responseData = {};
        var domLoaded = false;

        var timer = setTimeout(function () {
            // If the DOM loaded before timing out, consider the load successful.
            var error = domLoaded ? undefined : {
                message: 'navigation error',
                code: -7, // chromium's generic networking timeout code
                details: `Navigation timed out after ${timeout} ms`,
                url: url
            };
            // Even if "successful," note that some things didn't finish.
            responseData.details = `Not all resources loaded after ${timeout} ms`;
            cleanup(error, responseData);
        }, timeout);

        function handleFailure(event, code, detail, failedUrl, isMainFrame) {
            if (isMainFrame) {
                cleanup({
                    message: 'navigation error',
                    code: code,
                    details: detail,
                    url: failedUrl || url
                });
            }
        }

        function handleDetails(
            event, status, newUrl, oldUrl, statusCode, method, referrer, headers, resourceType) {
            if (resourceType === 'mainFrame') {
                responseData = {
                    url: newUrl,
                    code: statusCode,
                    method: method,
                    referrer: referrer,
                    headers: headers
                };
            }
        }

        function handleDomReady() {
            domLoaded = true;
        }

        // We will have already unsubscribed if load failed, so assume success.
        function handleFinish(event) {
            cleanup(null, responseData);
        }

        function cleanup(error, data) {
            clearTimeout(timer);
            win.webContents.removeListener('did-fail-load', handleFailure);
            win.webContents.removeListener('did-fail-provisional-load', handleFailure);
            win.webContents.removeListener('did-get-response-details', handleDetails);
            win.webContents.removeListener('dom-ready', handleDomReady);
            win.webContents.removeListener('did-finish-load', handleFinish);
            setIsReady(true);
            // wait a tick before notifying to resolve race conditions for events
            setImmediate(() => done(error, data));
        }

        // In most environments, loadURL handles this logic for us, but in some
        // it just hangs for unhandled protocols. Mitigate by checking ourselves.
        function canLoadProtocol(protocol, callback) {
            protocol = (protocol || '').replace(/:$/, '');
            if (!protocol || KNOWN_PROTOCOLS.includes(protocol)) {
                return callback(true);
            }
            electron.protocol.isProtocolHandled(protocol, callback);
        }

        function startLoading() {
            // abort any pending loads first
            if (win.webContents.isLoading()) {
                parent.emit('log', 'aborting pending page load');
                win.webContents.once('did-stop-loading', function () {
                    startLoading(true);
                });
                return win.webContents.stop();
            }

            win.webContents.on('did-fail-load', handleFailure);
            win.webContents.on('did-fail-provisional-load', handleFailure);
            win.webContents.on('did-get-response-details', handleDetails);
            win.webContents.on('dom-ready', handleDomReady);
            win.webContents.on('did-finish-load', handleFinish);
            win.webContents.loadURL(url, loadUrlOptions);

            // javascript: URLs *may* trigger page loads; wait a bit to see
            if (protocol === 'javascript:') {
                setTimeout(function () {
                    if (!win.webContents.isLoadingMainFrame()) {
                        done(null, {
                            url: url,
                            code: 200,
                            method: 'GET',
                            referrer: win.webContents.getURL(),
                            headers: {}
                        });
                    }
                }, 10);
            }
        }

        var protocol = urlFormat.parse(url).protocol;
        canLoadProtocol(protocol, function startLoad(canLoad) {
            if (canLoad) {
                parent.emit('log',
                    `Navigating: "${url}",
            headers: ${extraHeaders || '[none]'},
            timeout: ${timeout}`);
                return startLoading();
            }

            cleanup({
                message: 'navigation error',
                code: -1000,
                details: 'unhandled protocol',
                url: url
            });
        });
    }
});
