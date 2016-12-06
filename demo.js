/* eslint-env node, browser*/
/* eslint no-console:0 */

var fs = require('fs'),
    Nightmare = require('nightmare');

require('nightmare-inline-download')(Nightmare);
//switch to nightmare-download-manager for more control and feed back on download proccess

var waitURL = function (urlRegEx) {

    return function (nightmare) {
        nightmare.wait(function (url) {
            url = new RegExp(url);
            return url.test(document.location.href);
        }, urlRegEx);
    }
}

//until the user interface works, we will use this for now.
var authData = JSON.parse(fs.readFileSync("./auth.json"));



Nightmare.prototype.waitURL = function (url) {
    this.wait(function (url) {
        url = new RegExp(url);
        return url.test(document.location.href);
    }, url);

    return this;

}



var nightmare = Nightmare({
    show: true,
    typeInterval: 20,
    openDevTools: {
        mode: 'detach'
    },
    alwaysOnTop: false,
    waitTimeout: 2 * 60 * 1000
});
var ou = "55363";
//var ou = "112655";
//var ou = "10011";

nightmare
    .goto('https://byui.brightspace.com/d2l/login?noredirect=1')
    .type("#userName", authData.username)
    .type("#password", authData.password)
    .click("a.vui-button-primary")
    //.use(waitURL("https://byui.brightspace.com/d2l/home"))
    //.waitURL2("https://byui.brightspace.com/d2l/home")
    .waitURL("https://byui.brightspace.com/d2l/home")
    //    .wait(function () {
    //        //go to d2l home
    //        return document.location.href === "https://byui.brightspace.com/d2l/home";
    //    })
    //go to check box page 
    .goto("https://byui.brightspace.com/d2l/lms/importExport/export/export_select_components.d2l?ou=" + ou)
    .wait('input[name="checkAll"]')
    .click('input[name="checkAll"]')
    .click('a.vui-button-primary')
    //go to confirm page
    .wait(function (ou) {
        return document.location.href === "https://byui.brightspace.com/d2l/lms/importExport/export/export_select_confirm.d2l?ou=" + ou;
    }, ou)
    .wait('.vui-button-primary')
    .check('input[name="exportFiles"]')
    .click('.vui-button-primary')
    //go to zipping proccess page
    .wait(function (ou) {
        return document.location.href === "https://byui.brightspace.com/d2l/lms/importExport/export/export_process.d2l?ou=" + ou;
    }, ou)
    .wait('.vui-button-primary[aria-disabled="false"]')
    .click('a.vui-button-primary')
    //go to export_summary
    .wait(function () {
        return document.location.origin + document.location.pathname === "https://byui.brightspace.com/d2l/lms/importExport/export/export_summary.d2l";
    }, ou)
    .wait('form a.vui-link')
    .click('form a.vui-link')
    .download("./" + ou + "_export.zip")
    //.end()
    .then(function () {
        console.log("done");
    })
    .catch(function (error) {
        console.error(error);
    });
