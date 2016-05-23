function getRoot() {
    var origin = window.location.origin;
    var url = '';
    if (origin.indexOf('localhost') != -1 || origin.indexOf('127.0.0') != -1) {
        url = origin;
    } else if (origin.indexOf('.com') != -1) {
        url = "https://gcdc2013-iogrow.appspot.com";
    }
    return url + '/_ah/api';
}
 var ROOT = getRoot();
 // var ROOT = 'https://gcdc2013-iogrow.appspot.com/_ah/api';
 // var ROOT = '/_ah/api';
 // var ROOT = 'https://preprod-iogrow.appspot.com/_ah/api';
var apisToLoad;
var callback = function () {
    if (--apisToLoad == 0) {
        signin(true, userAuthed);
    }
};
function loadGapi() {
    window.is_signed_in = false;
    window.authResult = undefined;
    var apisToLoad;
    var callback = function () {
        if (--apisToLoad == 0) {
            apiLoaded();
        }
    }
    apisToLoad = 2; // must match number of calls to gapi.client.load()
    gapi.client.load('crmengine', 'v1', callback, ROOT);
    gapi.load('picker', {'callback': callback});
}
function apiLoaded() {
    // When the API is loaded start angularJS app
    var $injector = angular.bootstrap(document, ['crmEngine']);
    if (!window.location.hash) {
        window.location.replace('/#/leads');
    }
}

var isMobile = navigator.appVersion.indexOf("Mobile") > -1;
var isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
if (isMobile || !isChrome) {
    $("#chromeExtension").remove();
}
if (isMobile) {

    $(".app-menu").remove();
}
function SignOut() {
    if (typeof(Storage) != "undefined") {
        localStorage.removeItem('access_token');
    }
    window.location.replace(window.uuser.logout_url);
}

var iogrow = {};
iogrow.ioStorageCache = {
    read: function (key) {
        var data = {};
        if (typeof(Storage) != "undefined") {
            if (localStorage.getItem(key) === "") {
                data = {};
            } else {
                data = JSON.parse(localStorage.getItem(key));
                if (data == null) {
                    data = {};
                }
            }

        }
        return data;
    },
    write: function (key, data) {
        if (typeof(Storage) != "undefined") {
            localStorage[key] = JSON.stringify(data);
        }
    },
    renderIfUpdated: function (key, newData, callback) {
        if (typeof(Storage) != "undefined") {
            var existingData = localStorage[key];
            var stringifyNewData = JSON.stringify(newData);
            if (typeof(existingData) === 'undefined') {
                this.write(key, newData);
            } else if ((existingData.localeCompare(stringifyNewData) !== 0) || (existingData === '{}')) {
                this.write(key, newData);
                callback(newData);
            }
        }

    }
};
// upload logo javascript
function ShowUpdateLogo() {
    try {
        var logoPan = document.getElementById("update_logo_pan");
        logoPan.style.display = "inline";
    }
    catch (e) {
    }
}
function HideupdateLogo() {

    try {
        var logoPan = document.getElementById("update_logo_pan");
        logoPan.style.display = "none";

    } catch (e) {
    }
}
var created_at = new Date(window.uuser.created_at);
// sales/admin tabs plus intercom declaration
$('document').ready(function () {
    if (window.location.hash.indexOf('admin') != -1) {$('#sales_tabs').hide();$('#admin_tabs').show();} 
    else {$('#sales_tabs').show();$('#admin_tabs').hide();}
    //intercom declaration
    window.Intercom('boot', {
            app_id: "s9iirr8w",
            // TODO: The current logged in user's full name
            name: window.uuser.google_display_name,
            // TODO: The current logged in user's email address.
            email: window.uuser.email,
            gid: window.uuser.google_user_id,
            completed_tour: window.uuser.completed_tour,
            oranization: window.organization_name,
            // TODO: The current logged in user's sign-up date as a Unix timestamp.
            created_at: created_at.getTime() / 1000
    });
});
// google sign in
window.___gcfg = {
    // lang: 'en',
    parsetags: 'explicit',
    lang: 'en-US'
};
(function () {
    var po = document.createElement('script');
    po.type = 'text/javascript';
    po.async = true;
    po.src = 'https://plus.google.com/js/client:plusone.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(po, s);
})();
// intercom function
(function () {
var w = window;
var ic = w.Intercom;
if (typeof ic === "function") {
    ic('reattach_activator');
    ic('update', intercomSettings);
} else {
    var d = document;
    var i = function () {
        i.c(arguments)
    };
    i.q = [];
    i.c = function (args) {
        i.q.push(args)
    };
    w.Intercom = i;
    function l() {
        var s = d.createElement('script');
        s.type = 'text/javascript';
        s.async = true;
        s.src = 'https://widget.intercom.io/widget/s9iirr8w';
        var x = d.getElementsByTagName('script')[0];
        x.parentNode.insertBefore(s, x);
    }

    if (w.attachEvent) {
        w.attachEvent('onload', l);
    } else {
        w.addEventListener('load', l, false);
    }
}
})();
// loadCSS async
function loadCSS(e, n, o, t) {
        "use strict";
        var d = window.document.createElement("link"), i = n || window.document.getElementsByTagName("script")[0], s = window.document.styleSheets;
        return d.rel = "stylesheet", d.href = e, d.media = "only x", t && (d.onload = t), i.parentNode.insertBefore(d, i), d.onloadcssdefined = function (n) {
            for (var o, t = 0; t < s.length; t++)s[t].href && s[t].href.indexOf(e) > -1 && (o = !0);
            o ? n() : setTimeout(function () {
                d.onloadcssdefined(n)
            })
        }, d.onloadcssdefined(function () {
            d.media = o || "all"
        }), d
    }
loadCSS("/static/build/css/_async.css");
// mixpanel declaration
mixpanel.people.set({
    "$email": window.uuser.email,    // only special properties need the $
    "$name": window.uuser.google_display_name,
    "$created": window.uuser.created_at,
    "$updated_at": window.uuser.updated_at,
    // //"$organization": window.uuser.organization}}",
    "$language": window.uuser.language
});
 (function (i, s, o, g, r, a, m) {
        i['GoogleAnalyticsObject'] = r;
        i[r] = i[r] || function () {
                    (i[r].q = i[r].q || []).push(arguments)
                }, i[r].l = 1 * new Date();
            a = s.createElement(o),
                    m = s.getElementsByTagName(o)[0];
            a.async = 1;
            a.src = g;
            m.parentNode.insertBefore(a, m)
        })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

        ga('create', 'UA-52188380-1', {'userId': window.uuser.google_user_id});
        ga('set', 'dimension1', window.uuser.google_user_id); // Set a `customUserId` dimension at page level
        ga('require', 'displayfeatures');
        ga('send', 'pageview');
