! function(t, e) {
    if ("function" == typeof define && define.amd) define(e);
    else {
        var n = e();
        t.ResizeController = n.ResizeController, t.ResponsiveImage = n.ResponsiveImage, t.ScrollController = n.ScrollController, t.morlock = n.morlock
    }
}(this, function() {
    var t, e, n;
    return function(i) {
        function r(t, e) {
            return w.call(t, e)
        }

        function o(t, e) {
            var n, i, r, o, a, s, c, u, l, f, h = e && e.split("/"),
                d = g.map,
                p = d && d["*"] || {};
            if (t && "." === t.charAt(0))
                if (e) {
                    for (h = h.slice(0, h.length - 1), t = h.concat(t.split("/")), u = 0; u < t.length; u += 1)
                        if (f = t[u], "." === f) t.splice(u, 1), u -= 1;
                        else if (".." === f) {
                        if (1 === u && (".." === t[2] || ".." === t[0])) break;
                        u > 0 && (t.splice(u - 1, 2), u -= 2)
                    }
                    t = t.join("/")
                } else 0 === t.indexOf("./") && (t = t.substring(2));
            if ((h || p) && d) {
                for (n = t.split("/"), u = n.length; u > 0; u -= 1) {
                    if (i = n.slice(0, u).join("/"), h)
                        for (l = h.length; l > 0; l -= 1)
                            if (r = d[h.slice(0, l).join("/")], r && (r = r[i])) {
                                o = r, a = u;
                                break
                            }
                    if (o) break;
                    !s && p && p[i] && (s = p[i], c = u)
                }!o && s && (o = s, a = c), o && (n.splice(0, a, o), t = n.join("/"))
            }
            return t
        }

        function a(t, e) {
            return function() {
                return d.apply(i, x.call(arguments, 0).concat([t, e]))
            }
        }

        function s(t) {
            return function(e) {
                return o(e, t)
            }
        }

        function c(t) {
            return function(e) {
                m[t] = e
            }
        }

        function u(t) {
            if (r(v, t)) {
                var e = v[t];
                delete v[t], y[t] = !0, h.apply(i, e)
            }
            if (!r(m, t) && !r(y, t)) throw new Error("No " + t);
            return m[t]
        }

        function l(t) {
            var e, n = t ? t.indexOf("!") : -1;
            return n > -1 && (e = t.substring(0, n), t = t.substring(n + 1, t.length)), [e, t]
        }

        function f(t) {
            return function() {
                return g && g.config && g.config[t] || {}
            }
        }
        var h, d, p, b, m = {},
            v = {},
            g = {},
            y = {},
            w = Object.prototype.hasOwnProperty,
            x = [].slice;
        p = function(t, e) {
            var n, i = l(t),
                r = i[0];
            return t = i[1], r && (r = o(r, e), n = u(r)), r ? t = n && n.normalize ? n.normalize(t, s(e)) : o(t, e) : (t = o(t, e), i = l(t), r = i[0], t = i[1], r && (n = u(r))), {
                f: r ? r + "!" + t : t,
                n: t,
                pr: r,
                p: n
            }
        }, b = {
            require: function(t) {
                return a(t)
            },
            exports: function(t) {
                var e = m[t];
                return "undefined" != typeof e ? e : m[t] = {}
            },
            module: function(t) {
                return {
                    id: t,
                    uri: "",
                    exports: m[t],
                    config: f(t)
                }
            }
        }, h = function(t, e, n, o) {
            var s, l, f, h, d, g, w = [];
            if (o = o || t, "function" == typeof n) {
                for (e = !e.length && n.length ? ["require", "exports", "module"] : e, d = 0; d < e.length; d += 1)
                    if (h = p(e[d], o), l = h.f, "require" === l) w[d] = b.require(t);
                    else if ("exports" === l) w[d] = b.exports(t), g = !0;
                else if ("module" === l) s = w[d] = b.module(t);
                else if (r(m, l) || r(v, l) || r(y, l)) w[d] = u(l);
                else {
                    if (!h.p) throw new Error(t + " missing " + l);
                    h.p.load(h.n, a(o, !0), c(l), {}), w[d] = m[l]
                }
                f = n.apply(m[t], w), t && (s && s.exports !== i && s.exports !== m[t] ? m[t] = s.exports : f === i && g || (m[t] = f))
            } else t && (m[t] = n)
        }, t = e = d = function(t, e, n, r, o) {
            return "string" == typeof t ? b[t] ? b[t](e) : u(p(t, e).f) : (t.splice || (g = t, e.splice ? (t = e, e = n, n = null) : t = i), e = e || function() {}, "function" == typeof n && (n = r, r = o), r ? h(i, t, e, n) : setTimeout(function() {
                h(i, t, e, n)
            }, 4), d)
        }, d.config = function(t) {
            return g = t, g.deps && d(g.deps, g.callback), d
        }, t._defined = m, n = function(t, e, n) {
            e.splice || (n = e, e = []), !r(m, t) && !r(v, t) && (v[t] = [t, e, n])
        }, n.amd = {
            jQuery: !0
        }
    }(), n("../vendor/almond", function() {}), n("morlock/core/util", ["exports"], function(t) {
        function e(t, e) {
            return Array.prototype.slice.call(t, e)
        }

        function n(t) {
            return e(t, 0)
        }

        function i(t, e) {
            if (Array.prototype.indexOf) return t.indexOf(e);
            for (var n = 0; n < t.length; n++)
                if (t[n] === e) return n;
            return -1
        }

        function r(t, e) {
            var n, i = 0;
            return function() {
                var r = arguments,
                    o = +new Date,
                    a = e - (o - i);
                0 >= a ? (clearTimeout(n), n = null, i = o, j(t, r)) : n || (n = setTimeout(function() {
                    i = +new Date, n = null, j(t, r)
                }, a))
            }
        }

        function o(t, e) {
            var n = null;
            return function() {
                clearTimeout(n);
                var i = arguments;
                n = setTimeout(function() {
                    n = null, t.apply(null, i)
                }, e)
            }
        }

        function a(t, e, n) {
            var i = document.documentElement;
            return s("(min-" + t + ":" + window[e] + "px)") ? function() {
                return window[e]
            } : function() {
                return i[n]
            }
        }

        function s(t) {
            var e = window.matchMedia || window.msMatchMedia;
            if (e) return !!e(t).matches;
            var n = document.createElement("div");
            return n.id = "testmq", n.innerHTML = '<style id="stestmq">@media ' + t + " { #testmq { position: absolute; } }</style>", document.body.appendChild(n), "absolute" == (window.getComputedStyle ? getComputedStyle(n, null) : n.currentStyle).position
        }

        function c() {
            return G && window.pageYOffset != document.documentElement.scrollTop ? document.documentElement.scrollTop : window.pageYOffset || document.documentElement.scrollTop
        }

        function u(t, e, n) {
            if (e = "number" == typeof e && e || 0, t && !t.nodeType && (t = t[0]), !t || 1 !== t.nodeType) return !1;
            var i = t.getBoundingClientRect();
            "undefined" == typeof n && (n = c());
            var r = 0 > n ? i.top + n : i.top,
                o = {
                    right: i.right + e,
                    left: i.left - e,
                    bottom: i.bottom + e,
                    top: r - e
                };
            return o.width = o.right - o.left, o.height = o.bottom - o.top, o
        }

        function l(t, e) {
            return x(function(n, i) {
                return n[i] = t(e[i], i), n
            }, h(e), {})
        }

        function f(t, e) {
            return x(function(e, n) {
                return P(e, t(n))
            }, e, [])
        }

        function h(t) {
            if (!t) return [];
            if (Object.keys) return Object.keys(t);
            var e = [];
            for (var n in t) t.hasOwnProperty(n) && e.push(n);
            return e
        }

        function d(t, e) {
            return t[e]
        }

        function p(t, e, n) {
            t[e] = n
        }

        function b(t) {
            return function() {
                return j(t, Array.prototype.reverse.call(arguments))
            }
        }

        function m(t) {
            return !t || !t.length
        }

        function v(t) {
            return f(z(d, t), h(t))
        }

        function g(t) {
            this.fn = t
        }

        function y(t) {
            var e = function() {
                for (var e = t.apply(this, arguments); e instanceof g;) e = e.exec();
                return e
            };
            return e.original_fn = t, e
        }

        function w(t) {
            var e = this,
                n = D(arguments);
            return new g(t.original_fn instanceof Function ? function() {
                return t.original_fn.apply(e, n)
            } : function() {
                return t.apply(e, n)
            })
        }

        function x(t, e, n) {
            var i = y(function r(e, n) {
                return m(n) ? e : w(r, t(e, N(n)), D(n))
            });
            return i(n, e)
        }

        function k(t, e) {
            return x(function(e, n) {
                return Q(t(n)) ? P(e, n) : e
            }, e, [])
        }

        function S(t, e) {
            return x(function(e, n) {
                return Q(t(n)) ? e : P(e, n)
            }, e, [])
        }

        function E(t) {
            return !t
        }

        function T(t, e) {
            return t === e
        }

        function A(t, e) {
            return function() {
                var n = t;
                return "function" == typeof t && (n = j(t, arguments)), n ? j(e, arguments) : void 0
            }
        }

        function C(t, e) {
            return Function.prototype.bind ? t.bind(e) : function() {
                return t.apply(e, arguments)
            }
        }

        function z(t) {
            var n = D(arguments);
            return function() {
                var i = e(arguments, 0);
                return t.apply(this, n.concat(i))
            }
        }

        function L(t, e) {
            return function() {
                setTimeout(z(t, arguments), e)
            }
        }

        function O(t, e) {
            return L(t, "undefined" != typeof e ? 1 : e)
        }

        function j(t, e) {
            return t.apply(null, e)
        }

        function D(t, n) {
            return n = "undefined" != typeof n ? n : 1, e(t, n)
        }

        function F(t) {
            return j(t, D(arguments))
        }

        function M(t, e, n) {
            return t.addEventListener ? (t.addEventListener(e, n, !1), function() {
                t.removeEventListener(e, n, !1)
            }) : t.attachEvent ? (t.attachEvent("on" + e, n), function() {
                t.detachEvent("on" + e, n)
            }) : void 0
        }

        function q(t, e) {
            return e[t]
        }

        function N(t) {
            return t[0]
        }

        function I(t) {
            return t[t.length - 1]
        }

        function R(t, e) {
            var i = n(t);
            return Array.prototype.unshift.call(i, e), i
        }

        function V(t, e) {
            var i = n(t);
            return Array.prototype.shift.call(i, e), i
        }

        function P(t, e) {
            var i = n(t);
            return Array.prototype.push.call(i, e), i
        }

        function B(t, e) {
            var i = n(t);
            return Array.prototype.pop.call(i, e), i
        }

        function H(t, e) {
            var i = n(t);
            return Array.prototype.sort.call(i, e), i
        }

        function X() {
            var t = arguments;
            return function(e) {
                for (var n = t.length - 1; n >= 0; --n) e = t[n](e);
                return e
            }
        }

        function K(t) {
            var e = D(arguments),
                n = !1;
            return function() {
                return n ? void 0 : (n = !0, j(t, e))
            }
        }

        function $(t) {
            return parseInt(t, 10)
        }

        function Y(t) {
            return t
        }
        var W = a("width", "innerWidth", "clientWidth"),
            U = a("height", "innerHeight", "clientHeight"),
            G = -1 !== navigator.userAgent.indexOf("MSIE 10");
        g.prototype.exec = function() {
            return this.fn()
        };
        var Q = z(T, !0),
            J = function() {
                for (var t = window.requestAnimationFrame, e = 0, n = ["webkit", "moz"], i = 0; i < n.length && !t; ++i) t = window[n[i] + "RequestAnimationFrame"];
                return t || (t = function(t) {
                    var n = (new Date).getTime(),
                        i = Math.max(0, 16 - (n - e)),
                        r = window.setTimeout(function() {
                            t(n + i)
                        }, i);
                    return e = n + i, r
                }), t
            }();
        t.indexOf = i, t.throttle = r, t.debounce = o, t.getViewportHeight = U, t.getViewportWidth = W, t.testMQ = s, t.getRect = u, t.mapObject = l, t.objectKeys = h, t.functionBind = C, t.partial = z, t.map = f, t.apply = j, t.objectVals = v, t.call = F, t.push = P, t.pop = B, t.unshift = R, t.equals = T, t.not = E, t.delay = L, t.unshift = R, t.nth = q, t.first = N, t.last = I, t.compose = X, t.select = k, t.isTrue = Q, t.get = d, t.shift = V, t.eventListener = M, t.when = A, t.reduce = x, t.once = K, t.sortBy = H, t.parseInteger = $, t.set = p, t.flip = b, t.trampoline = y, t.tailCall = w, t.copyArray = n, t.defer = O, t.slice = e, t.isEmpty = m, t.reject = S, t.rest = D, t.constantly = Y, t.rAF = J, t.documentScrollY = c
    }), n("morlock/core/stream", ["morlock/core/util", "exports"], function(t, e) {
        function n(t) {
            return this instanceof n ? (this.trackSubscribers = !!t, this.subscribers = null, this.subscriberSubscribers = null, this.streamID = V++, this.value = null, void 0) : new n(t)
        }

        function i(t) {
            return new n(t)
        }

        function r(t, e) {
            T(D(q(N), e), t.subscribers), t.value = e
        }

        function o(t) {
            return t.value
        }

        function a(t, e) {
            t.subscribers = t.subscribers || [], t.subscribers.push(e), t.trackSubscribers && T(D(q(N), e), t.subscriberSubscribers)
        }

        function s(t, e) {
            if (t.subscribers) {
                var n = I(t.subscribers, e); - 1 !== n && t.subscribers.splice(n, 1)
            }
        }

        function c(t, e) {
            t.trackSubscribers && (t.subscriberSubscribers = t.subscriberSubscribers || [], t.subscriberSubscribers.push(e))
        }

        function u(t, e) {
            var n = i(!0),
                o = D(r, n),
                a = D(z, t, e, o);
            return c(n, F(a)), n
        }

        function l(t) {
            var e = i(!0),
                n = D(r, e),
                o = D(setInterval, n, t);
            return c(e, F(o)), e
        }

        function f(t) {
            var e = i(!0),
                n = D(r, e),
                o = D(setTimeout, n, t);
            return c(e, F(o)), e
        }

        function h() {
            function t(e) {
                n(e), R(t)
            }
            var e = i(!0),
                n = D(r, e);
            return c(e, F(t)), e
        }

        function d() {
            var t = M(arguments),
                e = i(),
                n = D(r, e);
            return T(function(t) {
                return a(t, n)
            }, t), e
        }

        function p(t, e, n) {
            var o = i(),
                s = D(r, o),
                c = T(function(t) {
                    return ":e:" === t ? s : t
                }, n);
            return a(t, A(A, [e, c])), o
        }

        function b(t, e) {
            return 0 >= t ? e : p(e, E, [":e:", t])
        }

        function m(t, e) {
            return 0 >= t ? e : p(e, S, [":e:", t])
        }

        function v(t, e) {
            return 0 >= t ? e : p(e, k, [":e:", t])
        }

        function g(t, e) {
            return p(e, L, [":e:", t])
        }

        function y(t, e) {
            return p(e, O, [t, ":e:"])
        }

        function w(t, e) {
            return y(L(D(j, t), C), e)
        }

        function x(t, e) {
            return p(e, L, [":e:", D(o, t)])
        }
        var k = t.debounce,
            S = t.throttle,
            E = t.delay,
            T = t.map,
            A = t.apply,
            C = t.first,
            A = (t.rest, t.push, t.apply),
            z = (t.unshift, t.eventListener),
            L = t.compose,
            O = t.when,
            j = t.equals,
            D = t.partial,
            F = t.once,
            M = t.copyArray,
            q = t.flip,
            N = t.call,
            I = t.indexOf,
            R = t.rAF,
            V = 0;
        e.create = i, e.emit = r, e.getValue = o, e.onValue = a, e.offValue = s, e.onSubscription = c, e.createFromEvents = u, e.timeout = f, e.createFromRAF = h, e.merge = d, e.delay = b, e.throttle = m, e.debounce = v, e.map = g, e.filter = y, e.filterFirst = w, e.sample = x, e.interval = l
    }), n("morlock/streams/breakpoint-stream", ["morlock/core/util", "morlock/core/stream", "exports"], function(t, e, n) {
        function i(t, e) {
            var n = s(function(t, n) {
                var i = f.create(),
                    o = "string" == typeof t ? t : r(t);
                return f.onValue(e, function() {
                    var t = f.getValue(i);
                    t = null !== t ? t : !1, t !== l(o) && f.emit(i, !t)
                }), f.map(a(u, [n]), i)
            }, t);
            return c(f.merge, o(n))
        }

        function r(t) {
            var e;
            return "undefined" != typeof t.mq ? e = t.mq : (t.max = "undefined" != typeof t.max ? t.max : 1 / 0, t.min = "undefined" != typeof t.min ? t.min : 0, e = "only screen", t.max < 1 / 0 && (e += " and (max-width: " + t.max + "px)"), t.min > 0 && (e += " and (min-width: " + t.min + "px)")), e
        }
        var o = t.objectVals,
            a = t.partial,
            s = t.mapObject,
            c = t.apply,
            u = t.push,
            l = t.testMQ,
            f = e;
        n.create = i
    }), n("morlock/streams/resize-stream", ["morlock/core/stream", "exports"], function(t, e) {
        function n(t) {
            t = t || {};
            var e = "undefined" != typeof t.throttleMs ? t.throttleMs : 200,
                n = "undefined" != typeof t.orientationChangeDelayMs ? t.orientationChangeDelayMs : 100,
                r = "undefined" != typeof t.resizeStream ? t.resizeStream : i.createFromEvents(window, "resize"),
                o = i.merge(i.throttle(e, r), i.delay(n, i.createFromEvents(window, "orientationchange")));
            return setTimeout(function() {
                var t = document.createEvent("HTMLEvents");
                t.initEvent("resize", !0, !0), window.dispatchEvent(t)
            }, 10), o
        }
        var i = t;
        e.create = n
    }), n("morlock/controllers/resize-controller", ["morlock/core/util", "morlock/core/stream", "morlock/streams/breakpoint-stream", "morlock/streams/resize-stream", "exports"], function(t, e, n, i, r) {
        function o(t) {
            if (!(this instanceof o)) return new o(t);
            t = t || {};
            var e, n = b.create(t);
            "undefined" != typeof t.breakpoints && (e = p.create(t.breakpoints, n)), this.on = function(t, i) {
                "resize" === t ? d.onValue(d.map(function() {
                    return [window.innerWidth, window.innerHeight]
                }, n), i) : "breakpoint" === t && e && d.onValue(d.map(function(t) {
                    return [c(t), t[1] ? "enter" : "exit"]
                }, e), i)
            };
            var i = {};
            e && d.onValue(e, function(t) {
                i[t[0]] = t[1]
            }), this.getActiveBreakpoints = function() {
                var t = u(l, s(h, i));
                return f(t, a(i))
            }
        }
        var a = t.objectKeys,
            s = t.partial,
            c = (t.equals, t.first),
            u = t.compose,
            l = t.isTrue,
            f = t.select,
            h = t.get,
            d = (t.shift, t.nth, e),
            p = n,
            b = i;
        r["default"] = o
    }), n("morlock/streams/scroll-stream", ["morlock/core/stream", "morlock/core/util", "exports"], function(t, e, n) {
        function i(t) {
            t = t || {};
            var e = "undefined" != typeof t.debounceMs ? t.debounceMs : 200,
                n = o.debounce(e, r());
            return setTimeout(function() {
                var t = document.createEvent("HTMLEvents");
                t.initEvent("scroll", !0, !0), window.dispatchEvent(t)
            }, 10), n
        }

        function r() {
            var t, e = !0;
            o.onValue(o.createFromEvents(window, "scroll"), function() {
                e = !0
            });
            var n = o.createFromRAF(),
                i = o.filter(function() {
                    if (!e) return !1;
                    e = !1;
                    var n = a();
                    return t !== n ? (t = n, !0) : !1
                }, n);
            return o.map(function() {
                return t
            }, i)
        }
        var o = t,
            a = e.documentScrollY;
        n.create = i
    }), n("morlock/streams/element-tracker-stream", ["morlock/core/util", "morlock/core/stream", "exports"], function(t, e, n) {
        function i(t, e, n) {
            function i() {
                c = r(), s()
            }

            function s(e) {
                var n = o(t, null, e),
                    i = !!n && n.bottom >= 0 && n.top <= c;
                l && !i ? (l = !1, a.emit(u, "exit")) : !l && i && (l = !0, a.emit(u, "enter"))
            }
            var c, u = a.create(),
                l = !1;
            return a.onValue(e, s), a.onValue(n, i), i(), u
        }
        var r = t.getViewportHeight,
            o = t.getRect,
            a = e;
        n.create = i
    }), n("morlock/streams/scroll-tracker-stream", ["morlock/core/util", "morlock/core/stream", "morlock/streams/scroll-stream", "exports"], function(t, e, n, i) {
        function r(t, e) {
            e = e || a.create({
                debounceMs: 0
            });
            var n = o.create(),
                i = !1,
                r = !0;
            return o.onValue(e, function(e) {
                (r || i) && t > e ? (i = !1, o.emit(n, ["before", t])) : (r || !i) && e >= t && (i = !0, o.emit(n, ["after", t])), r = !1
            }), setTimeout(function() {
                var t = document.createEvent("HTMLEvents");
                t.initEvent("scroll", !0, !0), window.dispatchEvent(t)
            }, 10), n
        }
        var o = (t.getViewportHeight, t.getRect, e),
            a = n;
        i.create = r
    }), n("morlock/controllers/scroll-controller", ["morlock/core/util", "morlock/core/stream", "morlock/streams/scroll-stream", "morlock/streams/resize-stream", "morlock/streams/element-tracker-stream", "morlock/streams/scroll-tracker-stream", "exports"], function(t, e, n, i, r, o, a) {
        function s(t) {
            if (!(this instanceof s)) return new s(t);
            this.id = s.nextID++;
            var e = f.create(t);
            this.on = function(t, n) {
                "scrollEnd" === t && l.onValue(e, n)
            };
            var n = h.create();
            s.instances[this.id] = this, this.destroy = function() {
                delete s.instances[this.id]
            }, this.observeElement = function(t) {
                function i(t, e) {
                    var n, i = "both";
                    1 === t.length ? n = t[0] : (i = t[0], n = t[1]);
                    var s;
                    "both" === i ? s = r : "enter" === i ? s = o : "exit" === i && (s = a), e(s, n), e === l.onValue && r.value === i && l.emit(s, r.value)
                }
                var r = d.create(t, e, n),
                    o = l.filter(c(u, "enter"), r),
                    a = l.filter(c(u, "exit"), r);
                return {
                    on: function() {
                        return i(arguments, l.onValue), this
                    },
                    off: function() {
                        return i(arguments, l.offValue), this
                    }
                }
            }, this.observePosition = function(t) {
                function n(t, e) {
                    var n, a = "both";
                    1 === t.length ? n = t[0] : (a = t[0], n = t[1]);
                    var s;
                    "both" === a ? s = i : "before" === a ? s = r : "after" === a && (s = o), e(s, n)
                }
                var i = p.create(t, e),
                    r = l.filterFirst("before", i),
                    o = l.filterFirst("after", i);
                return {
                    on: function() {
                        return n(arguments, l.onValue), this
                    },
                    off: function() {
                        return n(arguments, l.offValue), this
                    }
                }
            }
        }
        var c = t.partial,
            u = t.equals,
            l = (t.compose, t.constantly, t.first, e),
            f = n,
            h = i,
            d = r,
            p = o;
        s.instances = {}, s.nextID = 1, a["default"] = s
    }), n("morlock/core/responsive-image", ["morlock/core/util", "morlock/controllers/scroll-controller", "exports"], function(t, e, n) {
        function i() {
            return this instanceof i ? (this.element = null, this.loadedSizes = {}, this.knownSizes = [], this.currentBreakpoint = null, this.src = null, this.hasWebp = !1, this.isFlexible = !1, this.hasRetina = !1, this.preserveAspectRatio = !1, this.knownDimensions = null, this.hasLoaded = !1, void 0) : new i
        }

        function r(t) {
            function e() {
                r.off("enter", e), n.lazyLoad = !1, c(n, !0)
            }
            var n = new i;
            if (b(w(m(y, n)), t), n.knownDimensions && n.preserveAspectRatio && a(n), t.lazyLoad) {
                var r = S.observeElement(t.element);
                r.on("enter", e)
            }
            return n
        }

        function o(t) {
            var e = {};
            e.element = t, e.src = t.getAttribute("data-src"), e.lazyLoad = "true" === t.getAttribute("data-lazyload"), e.hasWebp = "true" === t.getAttribute("data-hasWebp"), e.isFlexible = "false" !== t.getAttribute("data-isFlexible"), e.hasRetina = "true" === t.getAttribute("data-hasRetina") && window.devicePixelRatio > 1.5, e.preserveAspectRatio = "true" === t.getAttribute("data-preserveAspectRatio");
            var n = t.getAttribute("data-knownDimensions");
            return n && "false" !== n && (e.knownDimensions = [g(n.split("x")[0]), g(n.split("x")[1])]), e.knownSizes = s(e.element), e.knownDimensions && e.preserveAspectRatio && a(e), r(e)
        }

        function a(t) {
            t.element.style.paddingBottom = t.knownDimensions[1] / t.knownDimensions[0] * 100 + "%"
        }

        function s(t) {
            var e = t.getAttribute("data-breakpoints"),
                n = p(function(t) {
                    return g(t)
                }, e ? e.split(",") : []);
            return n.length <= 0 ? [0] : v(n, function(t, e) {
                return e - t
            })
        }

        function c(t) {
            if (!t.lazyLoad) {
                for (var e, n = 0; n < t.knownSizes.length; n++) {
                    var i = t.knownSizes[n],
                        r = "only screen and (max-width: " + i + "px)";
                    if (0 === n && (r = "only screen"), !x(r)) break;
                    e = i
                }
                e !== t.currentBreakpoint && (t.currentBreakpoint = e, u(t, t.currentBreakpoint))
            }
        }

        function u(t, e) {
            var n = t.loadedSizes[e];
            if ("undefined" != typeof n) l(t, n);
            else {
                var i = new Image;
                i.onload = function() {
                    t.loadedSizes[e] = i, l(t, i)
                }, i.src = d(t, e)
            }
        }

        function l(t, e) {
            return t.hasLoaded || (t.hasLoaded = !0, setTimeout(function() {
                t.element.className += " loaded"
            }, 100)), "img" === t.element.tagName.toLowerCase() ? f(t, e) : h(t, e)
        }

        function f(t, e) {
            t.element.src = e.src
        }

        function h(t, e) {
            if (t.element.style.backgroundImage = "url(" + e.src + ")", t.preserveAspectRatio) {
                var n = Modernizr.prefixed("backgroundSize");
                t.element.style[n] = "cover";
                var i, r;
                t.knownDimensions ? (i = t.knownDimensions[0], r = t.knownDimensions[1]) : (i = e.width, r = e.height), t.isFlexible ? t.element.style.paddingBottom = r / i * 100 + "%" : (t.element.style.width = i + "px", t.element.style.height = r + "px")
            }
        }

        function d(t, e) {
            if (0 === e) return t.src;
            var n = t.src.split("."),
                i = n.pop(),
                r = t.hasWebp && Modernizr.webp ? "webp" : i;
            return n.join(".") + "-" + e + (t.hasRetina ? "@2x" : "") + "." + r
        }
        var p = t.map,
            b = t.mapObject,
            m = t.partial,
            v = t.sortBy,
            g = t.parseInteger,
            y = t.set,
            w = t.flip,
            x = t.testMQ,
            k = e["default"],
            S = new k({
                debounceMs: 0
            });
        n.create = r, n.createFromElement = o, n.update = c
    }), n("morlock/plugins/jquery.breakpointer", ["morlock/controllers/resize-controller"], function(t) {
        t["default"];
        "undefined" != typeof $ && ($.fn.breakpointer = function() {})
    }), n("morlock/plugins/jquery.scrolltracker", ["morlock/controllers/scroll-controller"], function(t) {
        t["default"];
        "undefined" != typeof $ && ($.fn.scrolltracker = function() {})
    }), n("morlock/plugins/jquery.eventstream", ["morlock/core/util", "morlock/core/stream"], function(t, e) {
        var n = t.map,
            i = e;
        "undefined" != typeof $ && ($.fn.eventstream = function(t) {
            var e = this,
                r = n(function(e) {
                    var n = i.create(),
                        r = $(e);
                    return r.on(t, function(t) {
                        i.emit(n, t)
                    }), r.data("stream", n), n
                }, e);
            if (r.length > 1) {
                i.merge(r)
            }
            return e
        })
    }), n("morlock/plugins/jquery.morlockResize", ["morlock/controllers/resize-controller"], function(t) {
        var e = t["default"];
        "undefined" != typeof jQuery && (jQuery.fn.morlockResize = function(t, n) {
            var i = new e(n);
            return $(this).each(function() {
                if (this === window) {
                    var e = $(this);
                    e.on("morlockResize", t), i.on("resize", function() {
                        e.trigger("morlockResize")
                    })
                }
            })
        })
    }), n("morlock/base", ["morlock/controllers/resize-controller", "morlock/controllers/scroll-controller", "morlock/core/responsive-image", "morlock/plugins/jquery.breakpointer", "morlock/plugins/jquery.scrolltracker", "morlock/plugins/jquery.eventstream", "morlock/plugins/jquery.morlockResize", "exports"], function(t, e, n, i, r, o, a, s) {
        function c(t) {
            return t = "undefined" != typeof t ? t : 0, d[t] = d[t] || new f({
                debounceMs: t
            }), d[t]
        }

        function u(t) {
            return p[t] = p[t] || b.observePosition(t), p[t]
        }
        var l = t["default"],
            f = e["default"],
            h = n,
            d = {},
            p = {},
            b = {
                onScrollEnd: function(t) {
                    var e = c();
                    return e.on("scrollEnd", t)
                },
                observeElement: function() {
                    var t = c();
                    return t.observeElement.apply(t, arguments)
                },
                observePosition: function() {
                    var t = c();
                    return t.observePosition.apply(t, arguments)
                },
                position: {
                    before: function(t, e) {
                        var n = u(t);
                        return n.on("before", e)
                    },
                    after: function(t, e) {
                        var n = u(t);
                        return n.on("after", e)
                    }
                }
            };
        s.ResizeController = l, s.ResponsiveImage = h, s.ScrollController = f, s.morlock = b
    }), e(["morlock/base"]), e("morlock/base")
});
var cyclops = function() {
    function t(t, e) {
        for (var n = Math.min(t.length, e.length), i = new Array(n), r = 0; n > r; r++) i[r] = t[r] + e[r];
        return i
    }

    function e(t, e) {
        for (var n = Math.min(t.length, e.length), i = new Array(n), r = 0; n > r; r++) i[r] = t[r] - e[r];
        return i
    }

    function n(t, e) {
        for (var n = t.length, i = new Array(n), r = 0; n > r; r++) i[r] = e * t[r];
        return i
    }

    function i(e, i, r) {
        var o = r.x - i.x,
            a = (e - i.x) / o,
            s = 1 - a,
            c = n(i.y, s),
            u = n(r.y, a);
        return t(c, u)
    }

    function r(e, i, r) {
        var o = r.x - i.x,
            a = (e - i.x) / o,
            s = i.tangent,
            c = i.y,
            u = r.y,
            l = r.tangent,
            f = n(t(n(s, -.5), t(n(c, 1.5), t(n(u, -1.5), n(l, .5)))), a * a * a),
            h = n(t(n(s, 1), t(n(c, -2.5), t(n(u, 2), n(l, -.5)))), a * a),
            d = n(t(n(s, -.5), n(u, .5)), a),
            p = c;
        return t(f, t(h, t(d, p)))
    }

    function o(t, e) {
        var n, i, r, o = e.length;
        for (n = 0, i = o - 1; i - n > 1;) r = Math.floor((n + i) / 2), e[r] <= t ? n = r : i = r;
        return n
    }

    function a(t) {
        t.position = {
            left: [],
            right: []
        }, t.speed = {
            left: [],
            right: []
        }, t.arcLength = [];
        for (var n = 0; n < t.x.length - 1; n++) {
            var a = t.x[n],
                s = t.x[n + 1],
                c = (e(t.y[n + 1], t.y[n]), {
                    x: a,
                    y: t.y[n],
                    tangent: t.left.tangent[n]
                }),
                u = {
                    x: s,
                    y: t.y[n + 1],
                    tangent: t.right.tangent[n + 1]
                };
            t.position.left.push(c), t.position.right.push(u)
        }
        return function(e) {
            var n = o(e, t.x);
            return t.left.type && "linear" == t.left.type[n] ? i(e, t.position.left[n], t.position.right[n]) : r(e, t.position.left[n], t.position.right[n])
        }
    }

    function s(t) {
        return isNaN(t) || !isFinite(t) ? 0 : t
    }

    function c(t) {
        for (var e = 0; e < t.length; e++) t[e] = s(t[e]);
        return t
    }

    function u(t, e) {
        for (var n = [], i = e[0], r = e[1], o = 0; o < t.length; o++) n.push(s((t[o] - i[o]) / (r[o] - i[o])));
        return n
    }

    function l(t) {
        for (var e = t.frameData, n = [], i = [], r = 0; r < e.length; r++) {
            var o = e[r];
            n.push(o.t), i.push(o.val.length ? o.val : [o.val])
        }
        var a = t.begin,
            s = t.end,
            c = [a, s];
        return {
            x: n,
            y: i,
            start: t.startTime,
            duration: t.duration,
            bounds: c
        }
    }

    function f(t) {
        for (var i = {
                tangent: []
            }, r = {
                tangent: []
            }, o = t.y.length, a = 1; o - 1 > a; a++) i.tangent[a] = t.y[a - 1], r.tangent[a] = t.y[a + 1];
        return i.tangent[0] = e(n(t.y[0], 2), t.y[1]), r.tangent[o - 1] = e(n(t.y[o - 1], 2), t.y[o - 2]), {
            left: i,
            right: r
        }
    }

    function h(t) {
        var e = a(t),
            n = function(n) {
                var i = n * t.duration + t.start;
                return c(e(i))
            };
        return t.original = e, t.func = n, t.normalizedFunc = function(e) {
            var i = n(e),
                r = u(i, t.bounds);
            return r
        }, t
    }

    function d(t) {
        var e = l(t),
            n = f(e);
        e.left = n.left, e.right = n.right;
        var i = h(e);
        return i
    }

    function p(t) {
        for (var e in t)
            if (t.hasOwnProperty(e)) {
                var n = d(t[e]);
                m[e] = n
            }
    }

    function b(t, e) {
        return e || (e = 0),
            function(n) {
                return m[t].normalizedFunc(n)[e]
            }
    }
    var m = {};
    return {
        loadCurves: p,
        getCurve: b
    }
}();
! function() {
    function ba(t) {
        t = t.split(".");
        for (var e, n = m; e = t.shift();) {
            if (null == n[e]) return null;
            n = n[e]
        }
        return n
    }

    function ca() {}

    function da(t) {
        var e = typeof t;
        if ("object" == e) {
            if (!t) return "null";
            if (t instanceof Array) return "array";
            if (t instanceof Object) return e;
            var n = Object.prototype.toString.call(t);
            if ("[object Window]" == n) return "object";
            if ("[object Array]" == n || "number" == typeof t.length && "undefined" != typeof t.splice && "undefined" != typeof t.propertyIsEnumerable && !t.propertyIsEnumerable("splice")) return "array";
            if ("[object Function]" == n || "undefined" != typeof t.call && "undefined" != typeof t.propertyIsEnumerable && !t.propertyIsEnumerable("call")) return "function"
        } else if ("function" == e && "undefined" == typeof t.call) return "object";
        return e
    }

    function p(t) {
        return "array" == da(t)
    }

    function ea(t) {
        var e = da(t);
        return "array" == e || "object" == e && "number" == typeof t.length
    }

    function q(t) {
        return "string" == typeof t
    }

    function fa(t) {
        return "function" == da(t)
    }

    function ha(t) {
        var e = typeof t;
        return "object" == e && null != t || "function" == e
    }

    function ja(t) {
        return t[ka] || (t[ka] = ++la)
    }

    function ma(t) {
        return t.call.apply(t.bind, arguments)
    }

    function pa(t, e) {
        if (!t) throw Error();
        if (2 < arguments.length) {
            var n = Array.prototype.slice.call(arguments, 2);
            return function() {
                var i = Array.prototype.slice.call(arguments);
                return Array.prototype.unshift.apply(i, n), t.apply(e, i)
            }
        }
        return function() {
            return t.apply(e, arguments)
        }
    }

    function r() {
        return r = Function.prototype.bind && -1 != Function.prototype.bind.toString().indexOf("native code") ? ma : pa, r.apply(null, arguments)
    }

    function qa(t) {
        var e = Array.prototype.slice.call(arguments, 1);
        return function() {
            var n = e.slice();
            return n.push.apply(n, arguments), t.apply(this, n)
        }
    }

    function u(t, e) {
        var n = t.split("."),
            i = m;
        n[0] in i || !i.execScript || i.execScript("var " + n[0]);
        for (var r; n.length && (r = n.shift());) n.length || void 0 === e ? i = i[r] ? i[r] : i[r] = {} : i[r] = e
    }

    function v(t, e) {
        function n() {}
        n.prototype = e.prototype, t.p = e.prototype, t.prototype = new n, t.prototype.constructor = t, t.Dc = function(t, n) {
            return e.prototype[n].apply(t, Array.prototype.slice.call(arguments, 2))
        }
    }

    function sa(t) {
        if (Error.captureStackTrace) Error.captureStackTrace(this, sa);
        else {
            var e = Error().stack;
            e && (this.stack = e)
        }
        t && (this.message = String(t))
    }

    function ua(t) {
        for (var e = t.split("%s"), n = "", i = Array.prototype.slice.call(arguments, 1); i.length && 1 < e.length;) n += e.shift() + i.shift();
        return n + e.join("%s")
    }

    function va(t) {
        return t.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
    }

    function wa(t) {
        return xa.test(t) ? (-1 != t.indexOf("&") && (t = t.replace(ya, "&")), -1 != t.indexOf("<") && (t = t.replace(za, "&lt;")), -1 != t.indexOf(">") && (t = t.replace(Aa, "&gt;")), -1 != t.indexOf('"') && (t = t.replace(Ba, "&quot;")), -1 != t.indexOf("'") && (t = t.replace(Ca, "&#39;")), t) : t
    }

    function Da(t, e) {
        return e > t ? -1 : t > e ? 1 : 0
    }

    function Ea(t) {
        return String(t).replace(/\-([a-z])/g, function(t, e) {
            return e.toUpperCase()
        })
    }

    function Fa(t) {
        var e = q(void 0) ? "undefined".replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08") : "\\s";
        return t.replace(new RegExp("(^" + (e ? "|[" + e + "]+" : "") + ")([a-z])", "g"), function(t, e, n) {
            return e + n.toUpperCase()
        })
    }

    function Ja(t, e) {
        e.unshift(t), sa.call(this, ua.apply(null, e)), e.shift()
    }

    function Ka(t) {
        throw new Ja("Failure" + (t ? ": " + t : ""), Array.prototype.slice.call(arguments, 1))
    }

    function Oa(t, e) {
        var n;
        t: {
            n = t.length;
            for (var i = q(t) ? t.split("") : t, r = 0; n > r; r++)
                if (r in i && e.call(void 0, i[r], r, t)) {
                    n = r;
                    break t
                }
            n = -1
        }
        return 0 > n ? null : q(t) ? t.charAt(n) : t[n]
    }

    function A(t, e) {
        return 0 <= La(t, e)
    }

    function Pa(t, e) {
        var n, i = La(t, e);
        return (n = i >= 0) && x.splice.call(t, i, 1), n
    }

    function Qa() {
        return x.concat.apply(x, arguments)
    }

    function Ra(t) {
        var e = t.length;
        if (e > 0) {
            for (var n = Array(e), i = 0; e > i; i++) n[i] = t[i];
            return n
        }
        return []
    }

    function Sa(t, e, n) {
        return 2 >= arguments.length ? x.slice.call(t, e) : x.slice.call(t, e, n)
    }

    function Ta(t, e) {
        for (var n in t) e.call(void 0, t[n], n, t)
    }

    function Ua(t) {
        var e, n = [],
            i = 0;
        for (e in t) n[i++] = t[e];
        return n
    }

    function Va(t) {
        var e, n = [],
            i = 0;
        for (e in t) n[i++] = e;
        return n
    }

    function Wa() {
        var t, e = Xa;
        for (t in e) return !1;
        return !0
    }

    function Za(t) {
        for (var e, n, i = 1; i < arguments.length; i++) {
            n = arguments[i];
            for (e in n) t[e] = n[e];
            for (var r = 0; r < Ya.length; r++) e = Ya[r], Object.prototype.hasOwnProperty.call(n, e) && (t[e] = n[e])
        }
    }

    function $a(t) {
        if ("function" == typeof t.n) return t.n();
        if (q(t)) return t.split("");
        if (ea(t)) {
            for (var e = [], n = t.length, i = 0; n > i; i++) e.push(t[i]);
            return e
        }
        return Ua(t)
    }

    function ab(t, e) {
        if ("function" == typeof t.forEach) t.forEach(e, void 0);
        else if (ea(t) || q(t)) z(t, e, void 0);
        else {
            var n;
            if ("function" == typeof t.H) n = t.H();
            else if ("function" != typeof t.n)
                if (ea(t) || q(t)) {
                    n = [];
                    for (var i = t.length, r = 0; i > r; r++) n.push(r)
                } else n = Va(t);
            else n = void 0;
            for (var i = $a(t), r = i.length, o = 0; r > o; o++) e.call(void 0, i[o], n && n[o], t)
        }
    }

    function bb() {
        return !0
    }

    function gb() {}

    function hb(t) {
        if (t instanceof gb) return t;
        if ("function" == typeof t.La) return t.La(!1);
        if (ea(t)) {
            var e = 0,
                n = new gb;
            return n.next = function() {
                for (;;) {
                    if (e >= t.length) throw fb;
                    if (e in t) return t[e++];
                    e++
                }
            }, n
        }
        throw Error("Not implemented")
    }

    function ib(t) {
        var e = jb;
        if (ea(e)) try {
            z(e, t, void 0)
        } catch (n) {
            if (n !== fb) throw n
        } else {
            e = hb(e);
            try {
                for (;;) t.call(void 0, e.next(), void 0, e)
            } catch (i) {
                if (i !== fb) throw i
            }
        }
    }

    function kb(t) {
        this.s = {}, this.c = [], this.Ha = this.e = 0;
        var e = arguments.length;
        if (e > 1) {
            if (e % 2) throw Error("Uneven number of arguments");
            for (var n = 0; e > n; n += 2) this.set(arguments[n], arguments[n + 1])
        } else if (t) {
            t instanceof kb ? (e = t.H(), n = t.n()) : (e = Va(t), n = Ua(t));
            for (var i = 0; i < e.length; i++) this.set(e[i], n[i])
        }
    }

    function lb(t) {
        if (t.e != t.c.length) {
            for (var e = 0, n = 0; e < t.c.length;) {
                var i = t.c[e];
                mb(t.s, i) && (t.c[n++] = i), e++
            }
            t.c.length = n
        }
        if (t.e != t.c.length) {
            for (var r = {}, n = e = 0; e < t.c.length;) i = t.c[e], mb(r, i) || (t.c[n++] = i, r[i] = 1), e++;
            t.c.length = n
        }
    }

    function mb(t, e) {
        return Object.prototype.hasOwnProperty.call(t, e)
    }

    function B(t) {
        return -1 != nb.indexOf(t)
    }

    function vb() {
        var t = m.document;
        return t ? t.documentMode : void 0
    }

    function F(t) {
        var e;
        if (!(e = xb[t])) {
            e = 0;
            for (var n = va(String(wb)).split("."), i = va(String(t)).split("."), r = Math.max(n.length, i.length), o = 0; 0 == e && r > o; o++) {
                var a = n[o] || "",
                    s = i[o] || "",
                    c = RegExp("(\\d*)(\\D*)", "g"),
                    u = RegExp("(\\d*)(\\D*)", "g");
                do {
                    var l = c.exec(a) || ["", "", ""],
                        f = u.exec(s) || ["", "", ""];
                    if (0 == l[0].length && 0 == f[0].length) break;
                    e = Da(0 == l[1].length ? 0 : parseInt(l[1], 10), 0 == f[1].length ? 0 : parseInt(f[1], 10)) || Da(0 == l[2].length, 0 == f[2].length) || Da(l[2], f[2])
                } while (0 == e)
            }
            e = xb[t] = e >= 0
        }
        return e
    }

    function Db(t) {
        if (Eb) {
            Eb = !1;
            var e = m.location;
            if (e) {
                var n = e.href;
                if (n && (n = (n = Db(n)[3] || null) && decodeURIComponent(n)) && n != e.hostname) throw Eb = !0, Error()
            }
        }
        return t.match(Cb)
    }

    function Fb(t, e) {
        var n;
        if (t instanceof Fb) this.k = void 0 !== e ? e : t.k, Gb(this, t.ba), n = t.Ga, G(this), this.Ga = n, n = t.K, G(this), this.K = n, Hb(this, t.Aa), n = t.Y, G(this), this.Y = n, Ib(this, t.i.v()), n = t.T, G(this), this.T = n;
        else if (t && (n = Db(String(t)))) {
            this.k = !!e, Gb(this, n[1] || "", !0);
            var i = n[2] || "";
            G(this), this.Ga = i ? decodeURIComponent(i) : "", i = n[3] || "", G(this), this.K = i ? decodeURIComponent(i) : "", Hb(this, n[4]), i = n[5] || "", G(this), this.Y = i ? decodeURIComponent(i) : "", Ib(this, n[6] || "", !0), n = n[7] || "", G(this), this.T = n ? decodeURIComponent(n) : ""
        } else this.k = !!e, this.i = new Jb(null, 0, this.k)
    }

    function Gb(t, e, n) {
        G(t), t.ba = n ? e ? decodeURIComponent(e) : "" : e, t.ba && (t.ba = t.ba.replace(/:$/, ""))
    }

    function Hb(t, e) {
        if (G(t), e) {
            if (e = Number(e), isNaN(e) || 0 > e) throw Error("Bad port number " + e);
            t.Aa = e
        } else t.Aa = null
    }

    function Ib(t, e, n) {
        G(t), e instanceof Jb ? (t.i = e, t.i.lb(t.k)) : (n || (e = Kb(e, Pb)), t.i = new Jb(e, 0, t.k))
    }

    function G(t) {
        if (t.qc) throw Error("Tried to modify a read-only Uri")
    }

    function Qb(t) {
        return t instanceof Fb ? t.v() : new Fb(t, void 0)
    }

    function Kb(t, e) {
        return q(t) ? encodeURI(t).replace(e, Rb) : null
    }

    function Rb(t) {
        return t = t.charCodeAt(0), "%" + (t >> 4 & 15).toString(16) + (15 & t).toString(16)
    }

    function Jb(t, e, n) {
        this.j = t || null, this.k = !!n
    }

    function Sb(t) {
        if (!t.d && (t.d = new kb, t.e = 0, t.j))
            for (var e = t.j.split("&"), n = 0; n < e.length; n++) {
                var i = e[n].indexOf("="),
                    r = null,
                    o = null;
                i >= 0 ? (r = e[n].substring(0, i), o = e[n].substring(i + 1)) : r = e[n], r = decodeURIComponent(r.replace(/\+/g, " ")), r = Tb(t, r), t.add(r, o ? decodeURIComponent(o.replace(/\+/g, " ")) : "")
            }
    }

    function Ub(t, e, n) {
        t.remove(e), 0 < n.length && (t.j = null, t.d.set(Tb(t, e), Ra(n)), t.e += n.length)
    }

    function Tb(t, e) {
        var n = String(e);
        return t.k && (n = n.toLowerCase()), n
    }

    function Yb(t) {
        return t = t.className, q(t) && t.match(/\S+/g) || []
    }

    function Zb(t) {
        for (var e = Yb(t), n = Sa(arguments, 1), i = e.length + n.length, r = e, o = 0; o < n.length; o++) A(r, n[o]) || r.push(n[o]);
        return t.className = e.join(" "), e.length == i
    }

    function H(t, e) {
        this.x = void 0 !== t ? t : 0, this.y = void 0 !== e ? e : 0
    }

    function J(t, e) {
        this.width = t, this.height = e
    }

    function $b(t) {
        return t ? new ac(bc(t)) : ta || (ta = new ac)
    }

    function cc(t, e) {
        return q(e) ? t.getElementById(e) : e
    }

    function K(t, e) {
        var n = e || document;
        return n.querySelectorAll && n.querySelector ? n.querySelectorAll("." + t) : dc("*", t, e)
    }

    function L(t, e) {
        var n = e || document,
            i = null;
        return (i = n.querySelectorAll && n.querySelector ? n.querySelector("." + t) : dc("*", t, e)[0]) || null
    }

    function dc(t, e, n) {
        var i = document;
        if (n = n || i, t = t && "*" != t ? t.toUpperCase() : "", n.querySelectorAll && n.querySelector && (t || e)) return n.querySelectorAll(t + (e ? "." + e : ""));
        if (e && n.getElementsByClassName) {
            if (n = n.getElementsByClassName(e), t) {
                for (var r, i = {}, o = 0, a = 0; r = n[a]; a++) t == r.nodeName && (i[o++] = r);
                return i.length = o, i
            }
            return n
        }
        if (n = n.getElementsByTagName(t || "*"), e) {
            for (i = {}, a = o = 0; r = n[a]; a++) t = r.className, "function" == typeof t.split && A(t.split(/\s+/), e) && (i[o++] = r);
            return i.length = o, i
        }
        return n
    }

    function ec(t, e) {
        Ta(e, function(e, n) {
            "style" == n ? t.style.cssText = e : "class" == n ? t.className = e : "for" == n ? t.htmlFor = e : n in fc ? t.setAttribute(fc[n], e) : 0 == n.lastIndexOf("aria-", 0) || 0 == n.lastIndexOf("data-", 0) ? t.setAttribute(n, e) : t[n] = e
        })
    }

    function gc() {
        var t = window.document,
            t = jc(t) ? t.documentElement : t.body;
        return new J(t.clientWidth, t.clientHeight)
    }

    function kc(t) {
        var e = !E && jc(t) ? t.documentElement : t.body || t.documentElement;
        return t = t.parentWindow || t.defaultView, D && F("10") && t.pageYOffset != e.scrollTop ? new H(e.scrollLeft, e.scrollTop) : new H(t.pageXOffset || e.scrollLeft, t.pageYOffset || e.scrollTop)
    }

    function lc() {
        var t = arguments,
            e = document,
            n = t[0],
            i = t[1];
        if (!Vb && i && (i.name || i.type)) {
            if (n = ["<", n], i.name && n.push(' name="', wa(i.name), '"'), i.type) {
                n.push(' type="', wa(i.type), '"');
                var r = {};
                Za(r, i), delete r.type, i = r
            }
            n.push(">"), n = n.join("")
        }
        return n = e.createElement(n), i && (q(i) ? n.className = i : p(i) ? Zb.apply(null, [n].concat(i)) : ec(n, i)), 2 < t.length && mc(e, n, t), n
    }

    function mc(t, e, n) {
        function i(n) {
            n && e.appendChild(q(n) ? t.createTextNode(n) : n)
        }
        for (var r = 2; r < n.length; r++) {
            var o = n[r];
            !ea(o) || ha(o) && 0 < o.nodeType ? i(o) : z(nc(o) ? Ra(o) : o, i)
        }
    }

    function jc(t) {
        return "CSS1Compat" == t.compatMode
    }

    function oc(t) {
        var e = O.Ka;
        e.insertBefore(t, e.childNodes[0] || null)
    }

    function pc(t, e) {
        var n = e.parentNode;
        n && n.replaceChild(t, e)
    }

    function qc(t) {
        return !Xb || D && F("9") && !F("10") && m.SVGElement && t instanceof m.SVGElement ? (t = t.parentNode, ha(t) && 1 == t.nodeType ? t : null) : t.parentElement
    }

    function bc(t) {
        return 9 == t.nodeType ? t : t.ownerDocument || t.document
    }

    function nc(t) {
        if (t && "number" == typeof t.length) {
            if (ha(t)) return "function" == typeof t.item || "string" == typeof t.item;
            if (fa(t)) return "function" == typeof t.item
        }
        return !1
    }

    function rc(t, e, n) {
        if (!e && !n) return null;
        var i = e ? e.toUpperCase() : null;
        return sc(t, function(t) {
            var e;
            return (e = !i || t.nodeName == i) && ((e = !n) || (e = A(Yb(t), n))), e
        })
    }

    function sc(t, e) {
        for (var n = 0; t;) {
            if (e(t)) return t;
            t = t.parentNode, n++
        }
        return null
    }

    function ac(t) {
        this.R = t || m.document || document
    }

    function P() {
        0 != vc && (wc[ja(this)] = this)
    }

    function Q(t, e) {
        this.type = t, this.currentTarget = this.target = e, this.defaultPrevented = this.Z = !1, this.Qb = !0
    }

    function xc(t) {
        return xc[" "](t), t
    }

    function yc(t, e) {
        if (Q.call(this, t ? t.type : ""), this.relatedTarget = this.currentTarget = this.target = null, this.charCode = this.keyCode = this.button = this.screenY = this.screenX = this.clientY = this.clientX = this.offsetY = this.offsetX = 0, this.metaKey = this.shiftKey = this.altKey = this.ctrlKey = !1, this.xb = this.state = null, t) {
            var n = this.type = t.type;
            this.target = t.target || t.srcElement, this.currentTarget = e;
            var i = t.relatedTarget;
            if (i) {
                if (rb) {
                    var r;
                    t: {
                        try {
                            xc(i.nodeName), r = !0;
                            break t
                        } catch (o) {}
                        r = !1
                    }
                    r || (i = null)
                }
            } else "mouseover" == n ? i = t.fromElement : "mouseout" == n && (i = t.toElement);
            this.relatedTarget = i, this.offsetX = E || void 0 !== t.offsetX ? t.offsetX : t.layerX, this.offsetY = E || void 0 !== t.offsetY ? t.offsetY : t.layerY, this.clientX = void 0 !== t.clientX ? t.clientX : t.pageX, this.clientY = void 0 !== t.clientY ? t.clientY : t.pageY, this.screenX = t.screenX || 0, this.screenY = t.screenY || 0, this.button = t.button, this.keyCode = t.keyCode || 0, this.charCode = t.charCode || ("keypress" == n ? t.keyCode : 0), this.ctrlKey = t.ctrlKey, this.altKey = t.altKey, this.shiftKey = t.shiftKey, this.metaKey = t.metaKey, this.state = t.state, this.xb = t, t.defaultPrevented && this.preventDefault()
        }
    }

    function Ac(t) {
        try {
            return !(!t || !t[zc])
        } catch (e) {
            return !1
        }
    }

    function Cc(t, e, n, i, r) {
        this.M = t, this.Ba = null, this.src = e, this.type = n, this.na = !!i, this.sa = r, this.key = ++Bc, this.aa = this.ma = !1
    }

    function Dc(t) {
        t.aa = !0, t.M = null, t.Ba = null, t.src = null, t.sa = null
    }

    function Ec(t) {
        this.src = t, this.g = {}, this.ka = 0
    }

    function Gc(t, e) {
        var n = e.type;
        if (!(n in t.g)) return !1;
        var i = Pa(t.g[n], e);
        return i && (Dc(e), 0 == t.g[n].length && (delete t.g[n], t.ka--)), i
    }

    function Fc(t, e, n, i) {
        for (var r = 0; r < t.length; ++r) {
            var o = t[r];
            if (!o.aa && o.M == e && o.na == !!n && o.sa == i) return r
        }
        return -1
    }

    function S(t, e, n, i, r) {
        if (p(e)) {
            for (var o = 0; o < e.length; o++) S(t, e[o], n, i, r);
            return null
        }
        return n = Kc(n), Ac(t) ? t.W(e, n, i, r) : Lc(t, e, n, !1, i, r)
    }

    function Lc(t, e, n, i, r, o) {
        if (!e) throw Error("Invalid event type");
        var a = !!r,
            s = Mc(t);
        return s || (t[Hc] = s = new Ec(t)), n = s.add(e, n, i, r, o), n.Ba ? n : (i = Nc(), n.Ba = i, i.src = t, i.M = n, t.addEventListener ? t.addEventListener(e.toString(), i, a) : t.attachEvent(Oc(e.toString()), i), Jc++, n)
    }

    function Nc() {
        var t = Pc,
            e = tc ? function(n) {
                return t.call(e.src, e.M, n)
            } : function(n) {
                return n = t.call(e.src, e.M, n), n ? void 0 : n
            };
        return e
    }

    function Qc(t, e, n, i, r) {
        if (p(e)) {
            for (var o = 0; o < e.length; o++) Qc(t, e[o], n, i, r);
            return null
        }
        return n = Kc(n), Ac(t) ? t.ab(e, n, i, r) : Lc(t, e, n, !0, i, r)
    }

    function Rc(t, e, n, i, r) {
        if (p(e))
            for (var o = 0; o < e.length; o++) Rc(t, e[o], n, i, r);
        else n = Kc(n), Ac(t) ? t.nb(e, n, i, r) : t && (t = Mc(t)) && (e = t.ca(e, n, !!i, r)) && Sc(e)
    }

    function Sc(t) {
        if ("number" == typeof t || !t || t.aa) return !1;
        var e = t.src;
        if (Ac(e)) return Gc(e.w, t);
        var n = t.type,
            i = t.Ba;
        return e.removeEventListener ? e.removeEventListener(n, i, t.na) : e.detachEvent && e.detachEvent(Oc(n), i), Jc--, (n = Mc(e)) ? (Gc(n, t), 0 == n.ka && (n.src = null, e[Hc] = null)) : Dc(t), !0
    }

    function Oc(t) {
        return t in Ic ? Ic[t] : Ic[t] = "on" + t
    }

    function Tc(t, e, n, i) {
        var r = 1;
        if ((t = Mc(t)) && (e = t.g[e.toString()]))
            for (e = Ra(e), t = 0; t < e.length; t++) {
                var o = e[t];
                o && o.na == n && !o.aa && (r &= !1 !== Uc(o, i))
            }
        return Boolean(r)
    }

    function Uc(t, e) {
        var n = t.M,
            i = t.sa || t.src;
        return t.ma && Sc(t), n.call(i, e)
    }

    function Pc(t, e) {
        if (t.aa) return !0;
        if (!tc) {
            var n = e || ba("window.event"),
                i = new yc(n, this),
                r = !0;
            if (!(0 > n.keyCode || void 0 != n.returnValue)) {
                t: {
                    var o = !1;
                    if (0 == n.keyCode) try {
                        n.keyCode = -1;
                        break t
                    } catch (a) {
                        o = !0
                    }(o || void 0 == n.returnValue) && (n.returnValue = !0)
                }
                for (n = [], o = i.currentTarget; o; o = o.parentNode) n.push(o);
                for (var o = t.type, s = n.length - 1; !i.Z && s >= 0; s--) i.currentTarget = n[s],
                r &= Tc(n[s], o, !0, i);
                for (s = 0; !i.Z && s < n.length; s++) i.currentTarget = n[s],
                r &= Tc(n[s], o, !1, i)
            }
            return r
        }
        return Uc(t, new yc(e, this))
    }

    function Mc(t) {
        return t = t[Hc], t instanceof Ec ? t : null
    }

    function Kc(t) {
        return fa(t) ? t : t[Vc] || (t[Vc] = function(e) {
            return t.handleEvent(e)
        })
    }

    function Wc(t) {
        P.call(this), this.U = t, this.c = {}
    }

    function Yc(t, e, n, i, r, o) {
        if (p(n))
            for (var a = 0; a < n.length; a++) Yc(t, e, n[a], i, r, o);
        else {
            if (e = Qc(e, n, i || t.handleEvent, r, o || t.U || t), !e) return t;
            t.c[e.key] = e
        }
        return t
    }

    function T() {
        P.call(this), this.w = new Ec(this), this.$b = this
    }

    function Zc(t, e, n, i) {
        if (e = t.w.g[String(e)], !e) return !0;
        e = Ra(e);
        for (var r = !0, o = 0; o < e.length; ++o) {
            var a = e[o];
            if (a && !a.aa && a.na == n) {
                var s = a.M,
                    c = a.sa || a.src;
                a.ma && Gc(t.w, a), r = !1 !== s.call(c, i) && r
            }
        }
        return r && 0 != i.Qb
    }

    function $c() {
        T.call(this), this.t = ad, this.wb = this.startTime = null
    }

    function bd(t, e, n) {
        if (fa(t)) n && (t = r(t, n));
        else {
            if (!t || "function" != typeof t.handleEvent) throw Error("Invalid listener argument");
            t = r(t.handleEvent, t)
        }
        return e > 2147483647 ? -1 : m.setTimeout(t, e || 0)
    }

    function cd(t, e, n) {
        P.call(this), this.bb = t, this.oc = e || 0, this.U = n, this.ac = r(this.hc, this)
    }

    function ed(t) {
        t = ja(t), delete Xa[t], Wa() && dd && dd.stop()
    }

    function fd() {
        dd || (dd = new cd(function() {
            gd()
        }, 20));
        var t = dd;
        t.Za() || t.start()
    }

    function gd() {
        var t = ra();
        Ta(Xa, function(e) {
            hd(e, t)
        }), Wa() || fd()
    }

    function id(t, e, n, i) {
        if ($c.call(this), !p(t) || !p(e)) throw Error("Start and end parameters must be arrays");
        if (t.length != e.length) throw Error("Start and end points must be the same length");
        this.ia = t, this.ic = e, this.duration = n, this.qb = i, this.coords = []
    }

    function hd(t, e) {
        t.l = (e - t.startTime) / (t.wb - t.startTime), 1 <= t.l && (t.l = 1), jd(t, t.l), 1 == t.l ? (t.t = ad, ed(t), t.r("finish"), t.r("end")) : 1 == t.t && t.r("animate")
    }

    function jd(t, e) {
        fa(t.qb) && (e = t.qb(e)), t.coords = Array(t.ia.length);
        for (var n = 0; n < t.ia.length; n++) t.coords[n] = (t.ic[n] - t.ia[n]) * e + t.ia[n]
    }

    function kd(t, e) {
        Q.call(this, t), this.coords = e.coords, this.x = e.coords[0], this.y = e.coords[1], this.z = e.coords[2], this.duration = e.duration, this.l = e.l, this.state = e.t
    }

    function ld(t) {
        return 1 - Math.pow(1 - t, 3)
    }

    function U(t, e, n, i) {
        this.top = t, this.right = e, this.bottom = n, this.left = i
    }

    function V(t, e, n) {
        q(e) ? md(t, n, e) : Ta(e, qa(md, t))
    }

    function md(t, e, n) {
        var i;
        t: if (i = Ea(n), void 0 === t.style[i] && (n = (E ? "Webkit" : rb ? "Moz" : D ? "ms" : qb ? "O" : null) + Fa(n), void 0 !== t.style[n])) {
            i = n;
            break t
        }
        i && (t.style[i] = e)
    }

    function W(t, e) {
        var n = bc(t);
        return n.defaultView && n.defaultView.getComputedStyle && (n = n.defaultView.getComputedStyle(t, null)) ? n[e] || n.getPropertyValue(e) || "" : ""
    }

    function nd(t, e) {
        return W(t, e) || (t.currentStyle ? t.currentStyle[e] : null) || t.style && t.style[e]
    }

    function od(t) {
        var e;
        try {
            e = t.getBoundingClientRect()
        } catch (n) {
            return {
                left: 0,
                top: 0,
                right: 0,
                bottom: 0
            }
        }
        return D && t.ownerDocument.body && (t = t.ownerDocument, e.left -= t.documentElement.clientLeft + t.body.clientLeft, e.top -= t.documentElement.clientTop + t.body.clientTop), e
    }

    function pd(t) {
        if (D && !(D && zb >= 8)) return t.offsetParent;
        var e = bc(t),
            n = nd(t, "position"),
            i = "fixed" == n || "absolute" == n;
        for (t = t.parentNode; t && t != e; t = t.parentNode)
            if (n = nd(t, "position"), i = i && "static" == n && t != e.documentElement && t != e.body, !i && (t.scrollWidth > t.clientWidth || t.scrollHeight > t.clientHeight || "fixed" == n || "absolute" == n || "relative" == n)) return t;
        return null
    }

    function qd(t) {
        var e, n, i = bc(t),
            r = nd(t, "position"),
            o = rb && i.getBoxObjectFor && !t.getBoundingClientRect && "absolute" == r && (e = i.getBoxObjectFor(t)) && (0 > e.screenX || 0 > e.screenY),
            a = new H(0, 0);
        if (e = i ? bc(i) : document, (n = !D) || (n = D && zb >= 9) || (n = $b(e), n = jc(n.R)), n = n ? e.documentElement : e.body, t == n) return a;
        if (t.getBoundingClientRect) e = od(t), t = $b(i), t = kc(t.R), a.x = e.left + t.x, a.y = e.top + t.y;
        else if (i.getBoxObjectFor && !o) e = i.getBoxObjectFor(t), t = i.getBoxObjectFor(n), a.x = e.screenX - t.screenX, a.y = e.screenY - t.screenY;
        else {
            o = t;
            do {
                if (a.x += o.offsetLeft, a.y += o.offsetTop, o != t && (a.x += o.clientLeft || 0, a.y += o.clientTop || 0), E && "fixed" == nd(o, "position")) {
                    a.x += i.body.scrollLeft, a.y += i.body.scrollTop;
                    break
                }
                o = o.offsetParent
            } while (o && o != t);
            for ((qb || E && "absolute" == r) && (a.y -= i.body.offsetTop), o = t;
                (o = pd(o)) && o != i.body && o != n;) a.x -= o.scrollLeft, qb && "TR" == o.tagName || (a.y -= o.scrollTop)
        }
        return a
    }

    function rd(t) {
        return "number" == typeof t && (t = Math.round(t) + "px"), t
    }

    function X(t) {
        var e = sd;
        if ("none" != nd(t, "display")) return e(t);
        var n = t.style,
            i = n.display,
            r = n.visibility,
            o = n.position;
        return n.visibility = "hidden", n.position = "absolute", n.display = "inline", t = e(t), n.display = i, n.position = o, n.visibility = r, t
    }

    function sd(t) {
        var e = t.offsetWidth,
            n = t.offsetHeight,
            i = E && !e && !n;
        return (void 0 === e || i) && t.getBoundingClientRect ? (t = od(t), new J(t.right - t.left, t.bottom - t.top)) : new J(e, n)
    }

    function td(t) {
        t = t.style, "opacity" in t ? t.opacity = 1 : "MozOpacity" in t ? t.MozOpacity = 1 : "filter" in t && (t.filter = "alpha(opacity=100)")
    }

    function ud(t, e, n, i) {
        if (/^\d+px?$/.test(e)) return parseInt(e, 10);
        var r = t.style[n],
            o = t.runtimeStyle[n];
        return t.runtimeStyle[n] = t.currentStyle[n], t.style[n] = e, e = t.style[i], t.style[n] = r, t.runtimeStyle[n] = o, e
    }

    function vd(t, e) {
        var n = t.currentStyle ? t.currentStyle[e] : null;
        return n ? ud(t, n, "left", "pixelLeft") : 0
    }

    function Fd(t, e) {
        if ("none" == (t.currentStyle ? t.currentStyle[e + "Style"] : null)) return 0;
        var n = t.currentStyle ? t.currentStyle[e + "Width"] : null;
        return n in wd ? wd[n] : ud(t, n, "left", "pixelLeft")
    }

    function Y(t, e) {
        return t.dataset ? e in t.dataset ? t.dataset[e] : null : t.getAttribute("data-" + String(e).replace(/([A-Z])/g, "-$1").toLowerCase())
    }

    function Hd(t) {
        return t.classList ? t.classList : (t = t.className, q(t) && t.match(/\S+/g) || [])
    }

    function Z(t, e) {
        return t.classList ? t.classList.contains(e) : A(Hd(t), e)
    }

    function Id(t, e) {
        t.classList ? t.classList.add(e) : Z(t, e) || (t.className += 0 < t.className.length ? " " + e : e)
    }

    function Jd(t, e) {
        t.classList ? t.classList.remove(e) : Z(t, e) && (t.className = Ma(Hd(t), function(t) {
            return t != e
        }).join(" "))
    }

    function Kd(t, e, n) {
        Z(t, e) && (Jd(t, e), Id(t, n))
    }

    function Ld(a) {
        if (a = String(a), /^\s*$/.test(a) ? 0 : /^[\],:{}\s\u2028\u2029]*$/.test(a.replace(/\\["\\\/bfnrtu]/g, "@").replace(/"[^"\\\n\r\u2028\u2029\x00-\x08\x0a-\x1f]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]").replace(/(?:^|:|,)(?:[\s\u2028\u2029]*\[)+/g, ""))) try {
            return eval("(" + a + ")")
        } catch (b) {}
        throw Error("Invalid JSON string: " + a)
    }

    function Md(t) {
        return Nd(t || arguments.callee.caller, [])
    }

    function Nd(t, e) {
        var n = [];
        if (A(e, t)) n.push("[...circular reference...]");
        else if (t && 50 > e.length) {
            n.push(Od(t) + "(");
            for (var i = t.arguments, r = 0; i && r < i.length; r++) {
                r > 0 && n.push(", ");
                var o;
                switch (o = i[r], typeof o) {
                    case "object":
                        o = o ? "object" : "null";
                        break;
                    case "string":
                        break;
                    case "number":
                        o = String(o);
                        break;
                    case "boolean":
                        o = o ? "true" : "false";
                        break;
                    case "function":
                        o = (o = Od(o)) ? o : "[fn]";
                        break;
                    default:
                        o = typeof o
                }
                40 < o.length && (o = o.substr(0, 40) + "..."), n.push(o)
            }
            e.push(t), n.push(")\n");
            try {
                n.push(Nd(t.caller, e))
            } catch (a) {
                n.push("[exception trying to get caller]\n")
            }
        } else n.push(t ? "[...long stack...]" : "[end]");
        return n.join("")
    }

    function Od(t) {
        if (Pd[t]) return Pd[t];
        if (t = String(t), !Pd[t]) {
            var e = /function ([^\(]+)/.exec(t);
            Pd[t] = e ? e[1] : "[Anonymous]"
        }
        return Pd[t]
    }

    function Qd(t, e, n, i, r) {
        this.reset(t, e, n, i, r)
    }

    function Sd(t) {
        this.f = t, this.Eb = this.Na = this.fa = this.X = null
    }

    function Td(t, e) {
        this.name = t, this.value = e
    }

    function Xd(t) {
        return t.fa ? t.fa : t.X ? Xd(t.X) : (Ka("Root logger has no level set."), null)
    }

    function $d(t) {
        Zd || (Zd = new Sd(""), Yd[""] = Zd, Zd.Tb(Vd));
        var e;
        if (!(e = Yd[t])) {
            e = new Sd(t);
            var n = t.lastIndexOf("."),
                i = t.substr(n + 1),
                n = $d(t.substr(0, n));
            n.Db()[i] = e, e.X = n, Yd[t] = e
        }
        return e
    }

    function ae(t, e) {
        t && t.log(Wd, e, void 0)
    }

    function be() {}

    function ce(t) {
        var e;
        return (e = t.tb) || (e = {}, de(t) && (e[0] = !0, e[1] = !0), e = t.tb = e), e
    }

    function fe() {}

    function ge(t) {
        return (t = de(t)) ? new ActiveXObject(t) : new XMLHttpRequest
    }

    function de(t) {
        if (!t.Fb && "undefined" == typeof XMLHttpRequest && "undefined" != typeof ActiveXObject) {
            for (var e = ["MSXML2.XMLHTTP.6.0", "MSXML2.XMLHTTP.3.0", "MSXML2.XMLHTTP", "Microsoft.XMLHTTP"], n = 0; n < e.length; n++) {
                var i = e[n];
                try {
                    return new ActiveXObject(i), t.Fb = i
                } catch (r) {}
            }
            throw Error("Could not create ActiveXObject. ActiveX might be disabled, or MSXML might not be installed")
        }
        return t.Fb
    }

    function he(t) {
        T.call(this), this.headers = new kb, this.Ja = t || null, this.F = !1, this.Ia = this.a = null, this.ea = this.Ib = this.va = "", this.L = this.Ya = this.ta = this.Ta = !1, this.ja = 0, this.Da = null, this.Pb = ie, this.Fa = this.Cc = !1
    }

    function oe(t) {
        var e = new he;
        ne.push(e), t && e.W("complete", t), e.ab("ready", e.cc), e.send("../static/json/files.json", void 0, void 0, void 0)
    }

    function te(t) {
        return D && F(9) && "number" == typeof t.timeout && void 0 !== t.ontimeout
    }

    function re(t) {
        return "content-type" == t.toLowerCase()
    }

    function qe(t, e) {
        t.F = !1, t.a && (t.L = !0, t.a.abort(), t.L = !1), t.ea = e, ue(t), ve(t)
    }

    function ue(t) {
        t.Ta || (t.Ta = !0, t.dispatchEvent("complete"), t.dispatchEvent("error"))
    }

    function we(t) {
        if (t.F && "undefined" != typeof aa)
            if (t.Ia[1] && 4 == xe(t) && 2 == ye(t)) ae(t.o, pe(t, "Local request error detected and ignored"));
            else if (t.ta && 4 == xe(t)) bd(t.Lb, 0, t);
        else if (t.dispatchEvent("readystatechange"), 4 == xe(t)) {
            ae(t.o, pe(t, "Request complete")), t.F = !1;
            try {
                var e, n, i = ye(t);
                t: switch (i) {
                    case 200:
                    case 201:
                    case 202:
                    case 204:
                    case 206:
                    case 304:
                    case 1223:
                        n = !0;
                        break t;
                    default:
                        n = !1
                }
                if (!(e = n)) {
                    var r;
                    if (r = 0 === i) {
                        var o = Db(String(t.va))[1] || null;
                        if (!o && self.location) var a = self.location.protocol,
                            o = a.substr(0, a.length - 1);
                        r = !le.test(o ? o.toLowerCase() : "")
                    }
                    e = r
                }
                if (e) t.dispatchEvent("complete"), t.dispatchEvent("success");
                else {
                    var s;
                    try {
                        s = 2 < xe(t) ? t.a.statusText : ""
                    } catch (c) {
                        ae(t.o, "Can not get status: " + c.message), s = ""
                    }
                    t.ea = s + " [" + ye(t) + "]", ue(t)
                }
            } finally {
                ve(t)
            }
        }
    }

    function ve(t, e) {
        if (t.a) {
            se(t);
            var n = t.a,
                i = t.Ia[0] ? ca : null;
            t.a = null, t.Ia = null, e || t.dispatchEvent("ready");
            try {
                n.onreadystatechange = i
            } catch (r) {
                (n = t.o) && n.log(Ud, "Problem encountered resetting onreadystatechange: " + r.message, void 0)
            }
        }
    }

    function se(t) {
        t.a && t.Fa && (t.a.ontimeout = null), "number" == typeof t.Da && (m.clearTimeout(t.Da), t.Da = null)
    }

    function xe(t) {
        return t.a ? t.a.readyState : 0
    }

    function ye(t) {
        try {
            return 2 < xe(t) ? t.a.status : -1
        } catch (e) {
            return -1
        }
    }

    function pe(t, e) {
        return e + " [" + t.Ib + " " + t.va + " " + ye(t) + "]"
    }

    function ze() {
        T.call(this), this.Rb = 600, this.yc = 1, this.zc = ld, this.Sb = new H(0, 0), this.Qa = kc(document), new $b, this.ra = new Wc(this)
    }

    function Ae(t, e) {
        var n = t.id.match("_temp");
        e != n && (t.id = e ? t.id + "_temp" : t.id.replace("_temp", ""))
    }

    function Fe(t) {
        function e() {
            a = +new Date, r = null, o = t.apply(n, i)
        }
        var n, i, r, o, a = 0;
        return function() {
            var s = +new Date,
                c = 10 - (s - a);
            return n = this, i = arguments, 0 >= c ? (clearTimeout(r), r = null, a = s, o = t.apply(n, i)) : r || (r = setTimeout(e, c)), o
        }
    }

    function Ge(t) {
        var e, n = null;
        return function() {
            var i = this,
                r = arguments;
            return clearTimeout(n), n = setTimeout(function() {
                n = null, e = t.apply(i, r)
            }, 200), e
        }
    }

    function Ee(t) {
        Ie.push(t), He || (He = !0, Qc(document, "mousemove", function() {
            if (De = !0, He = !1, 0 < Ie.length)
                for (var t, e = 0; t = Ie[e]; e++) t()
        }))
    }

    function Ke(t) {
        if (t = t || "hoverable", De) {
            Id(document.body, t);
            var e = Ge(function() {
                Je = window.isScrolling = !1, Id(document.body, t)
            });
            S(window, "scroll", function() {
                Je || (Je = window.isScrolling = !0, Jd(document.body, t)), e()
            })
        } else Ee(function() {
            Ke(t)
        })
    }

    function Me() {
        var t = Ge(function() {
            Le = window.isTouchMoving = !1
        });
        S(window, "touchmove", function() {
            Le || (Le = window.isTouchMoving = !0), t()
        })
    }

    function Ne(t) {
        z(t, function(t) {
            (t = t.lastChild) && 3 == t.nodeType && (t.nodeValue = t.nodeValue.replace(/\s+([^\s]+\s*)$/g, " $1"))
        })
    }

    function Qe(t) {
        if (P.call(this), void 0 != t.previousElementSibling) t = t.previousElementSibling;
        else
            for (t = t.previousSibling; t && 1 != t.nodeType;) t = t.previousSibling;
        this.gb = t, this.f = Y(this.gb, "navName"), L("toggle-nav-closed"), this.C = qc(this.gb), this.I = document.body, this.cb = L("site-logo-image"), this.$a = !1, this.pc = Z(this.I, "nav-light"), this.Ea = [], this.dc = [], jb.set(this.f, this)
    }

    function Re() {
        var t = K("js-mobilenav");
        z(t, function(t) {
            new Qe(t)
        }), t = K("js-mobilenav-toggle"), z(t, function(t) {
            var e = Y(t, "targetNav");
            if (e) {
                e = jb.get(e), t = Be(t, r(e.toggle, e)), e.Ea.push(t), t = ub || pb;
                var e = L("download-mobile"),
                    n = L("download-mobile-android"),
                    i = L("download-mobile-ios");
                V(e, {
                    display: "none"
                }), C ? V(n, {
                    display: "inline-block"
                }) : t ? V(i, {
                    display: "inline-block"
                }) : V(e, {
                    display: "inline-block"
                })
            }
        }), t = K("js-mobilenav-toggle-close"), z(t, function(t) {
            var e = Y(t, "targetNav");
            e && (e = jb.get(e), t = Be(t, r(e.ec, e)), e.Ea.push(t))
        })
    }

    function Se() {
        ib(function(t) {
            t.resize()
        })
    }

    function Xe(t) {
        P.call(this), this.sb = new kb, this.h = t, this.ga = L("js-select-menu", this.h), this.ua = K("js-select-menu-item", this.h), this.Zb = Y(this.h, "selectFirst"), this.za = (this.za = Y(this.h, "selectPopulated")) || !1, this.fb = null, t = rc(this.h, null, "js-tabs"), t = Y(t, "tabName"), this.xc = Ye.get(t), Ze(this), $e(this), this.sb.set(this.f, this)
    }

    function Ze(t) {
        t.za || (z(t.ua, function(e) {
            e = Y(e, "selectItem"), e = lc("option", {
                "class": "js-select-menu-option select-menu-option",
                value: e
            }, e), t.ga.appendChild(e)
        }), t.za = !0), t.fb = K("js-select-menu-option", t.h)
    }

    function $e(t) {
        if (t.ga && (t.Pa = S(t.ga, "change", function(e) {
                af(t, e.target.value)
            }), t.Zb)) {
            var e = t.fb[0].value;
            t.ga.value = e, af(t, e)
        }
    }

    function af(t, e) {
        z(t.ua, function(t) {
            Jd(t, "select-is-active")
        });
        var n = Oa(t.ua, function(t) {
            return Y(t, "selectItem") === e
        });
        n && Id(n, "select-is-active"), t.xc.Ob()
    }

    function bf() {
        var t = K("js-select-menu-container");
        z(t, function(t) {
            new Xe(t)
        })
    }

    function cf(t, e, n) {
        if (P.call(this), this.Ca = t, this.Xa = e, this.Q = n, this.mb = .9, e = Y(this.Ca, "tabTarget")) {
            this.B = Gd("[data-tab-name=" + e + "]")[0], df(this);
            var i = this;
            this.tc = Be(t, function() {
                i.Q.setActive(i.Xa)
            })
        }(t = K("js-delay", this.B)) && t.length && (this.Q.nc = !0, this.oa = [].slice.call(t), this.vb = this.oa.slice(0), this.vb.reverse())
    }

    function df(t) {
        Jd(t.Ca, "tab-is-active"), Jd(t.B, "tab-is-active"), TweenLite.set(t.B, {
            autoAlpha: 0
        })
    }

    function ff(t, e, n) {
        t = e ? t.vb : t.oa, TweenLite.to(t, 0, {
            x: e ? -100 : 100,
            opacity: 0
        }), z(t, function(t) {
            TweenMax.to(t, .1, {
                opacity: 1,
                delay: i * n + .05
            }, n), TweenMax.to(t, .6, {
                x: 0,
                delay: i * n,
                ease: Expo.easeOut
            })
        })
    }

    function gf(t) {
        P.call(this), this.h = t, this.f = Y(this.h, "tabName"), this.Oa = L("js-tab-content-container", this.h), this.nc = !1, hf(this), this.J = r(function() {
            var t = $.getActiveBreakpoints();
            this.Ac = A(t, "desktop")
        }, this), $.on("breakpoint", this.J), this.ha = r(this.Ob, this), $.on("resize", this.ha), Ye.set(this.f, this)
    }

    function hf(t) {
        var e = K("js-activate-tab", t.h);
        t.O = Na(e, function(t, e) {
            return new cf(t, e, this)
        }, t), t.setActive(0)
    }

    function ef(t, e) {
        t.Oa.style.height = e + "px"
    }

    function jf() {
        var t = K("js-tabs");
        z(t, function(t) {
            new gf(t)
        })
    }

    function kf(t) {
        if (P.call(this), this.f = ja(t), "undefined" == typeof lf.get(this.f)) {
            if (this.m = t, this.gc = "true" === Y(this.m, "reverseParallax") ? -1 : 1, t = Y(this.m, "parallaxSpeed"), this.mb = "undefined" != typeof t && null !== t ? t : 7, t = Y(this.m, "parallaxFade"), this.Ab = "undefined" != typeof t && null !== t ? t : !1) {
                t = gc().height;
                var e = X(this.m).height;
                this.rb = (t - e) / 2 * .68
            }
            this.hb = Y(this.m, "origin"), this.ob(), this.ha = r(this.ob, this), $.on("resize", this.ha);
            var n = Fe(r(this.Mb, this)),
                i = null;
            this.J = r(function() {
                var t = $.getActiveBreakpoints();
                A(t, "fullFeatured") ? i || (i = S(window, "scroll", n)) : (i && (Sc(i), i = null), TweenLite.set(this.m, {
                    y: 0
                }))
            }, this), $.on("breakpoint", this.J), this.Mb(), lf.set(this.f, this)
        }
    }

    function mf() {
        var t = K("js-parallax-image"),
            e = document.documentElement,
            n = document.body;
        t && Z(e, "csstransforms3d") && !Z(n, "ie-patch") && Na(t, function(t) {
            return new kf(t)
        })
    }

    function nf(t) {
        this.qa = t, this.f = Y(this.qa, "videoName"), this.bc = Y(this.qa, "videoClass"), this.X = qc(this.qa), this.Nb = this.Wb = this.Vb = this.Xb = !1;
        var e = this;
        this.J = function() {
            var t = $.getActiveBreakpoints();
            A(t, "fullFeatured") && !e.Xb && (of(e), e.Xb = !0)
        }, $.on("breakpoint", this.J), Pe.observeElement(this.X).on("enter", function() {
            e.Wb || (e.Wb = !0, e.Vb ? setTimeout(function() {
                e.q.play()
            }, 800) : e.Nb = !0)
        })
    }

    function of(t) {
        t.q = document.createElement("video"), t.q.className = t.bc, t.q.style.visibility = "hidden", Modernizr.video.webm ? (t.q.src = t.f + ".webm", t.q.type = "video/webm") : (t.q.src = t.f + ".mp4", t.q.type = "video/mp4"), pc(t.q, t.qa), S(t.q, "canplaythrough", function() {
            this.q.style.visibility = "visible", this.Vb = !0, this.Nb && this.q.play()
        }, !1, t)
    }

    function pf() {
        this.rc = ob, this.ub = 0 < window.navigator.userAgent.indexOf("CrOS"), this.A()
    }

    function rf(t) {
        var e = L("dropdown-trigger"),
            n = L("dropdown-list");
        S(e, "click", function(t) {
            t.preventDefault(), V(n, {
                maxHeight: this.Sa ? 0 : 1
            }), this.Sa = !this.Sa
        }, t)
    }

    function qf(t) {
        var e = L("download-desktop");
        t = t.ub ? "content-chrome-os" : "content-linux", e && e.parentNode && e.parentNode.removeChild(e), V(L(t), {
            display: "block"
        })
    }

    function sf() {
        this.A()
    }

    function vf() {
        var t = ub || pb,
            e = Gd(".mobile-button-selector .download-mobile"),
            n = Gd(".mobile-button-selector .download-mobile-android"),
            i = Gd(".mobile-button-selector .download-mobile-ios");
        z(e, function(t) {
            V(t, {
                display: "none"
            })
        }), C ? z(n, function(t) {
            V(t, {
                display: "inline-block"
            })
        }) : t ? z(i, function(t) {
            V(t, {
                display: "inline-block"
            })
        }) : z(e, function(t) {
            V(t, {
                display: "inline-block"
            })
        })
    }

    function wf() {
        if (!(C || sb || ub || pb) && Modernizr.video && (Modernizr.video.webm || Modernizr.video.h264)) {
            var t = K("js-video");
            z(t, function(t) {
                new nf(t)
            })
        }
    }

    function xf(t) {
        if (!E || sb || C || 768 >= gc().width) {
            var e = cc(document, "svg-files"),
                n = lc("img", {
                    style: "width:auto",
                    "class": "example",
                    src: "images/home/files.png"
                });
            pc(n, e)
        } else new he, oe(function(e) {
            e = e.target, e = e.a ? Ld(e.a.responseText) : void 0, t.Bb = e, cyclops.loadCurves(t.Bb), t.Cb = !0, t.Ua && yf(t)
        }), e = Gd(".section-filetypes h2")[0], Pe.observeElement(e).on("enter", function() {
            t.Ua || (t.Ua = !0, t.Cb && setTimeout(function() {
                yf(t)
            }, 1e3))
        })
    }

    function yf(t) {
        var e = t.Bb;
        t = cc(document, "svg-files").getSVGDocument();
        var n = L("svg-logo", t),
            i = cyclops.getCurve("logo_scale");
        TweenLite.to(n, e.logo_scale.duration / 1e3, {
            scale: e.logo_scale.end[0] / 100,
            ease: i,
            onComplete: function() {
                V(n, "display", "none")
            }
        }), t = K("file-icon", t), z(t, function(t) {
            var n = Y(t, "curve"),
                i = n + "-scale",
                n = n + "-position",
                r = cyclops.getCurve(i),
                o = cyclops.getCurve(n),
                a = e[i].duration / 1e3,
                s = e[n].duration / 1e3,
                c = e[i].begin[0] / 100,
                u = e[n].begin[0] - 55,
                l = e[n].end[0] - 55,
                f = e[n].begin[1] - 70,
                h = e[n].end[1] - 70;
            setTimeout(function() {
                V(t, "display", "block"), TweenLite.fromTo(t, a, {
                    scale: c
                }, {
                    scale: .87,
                    ease: r
                }), TweenLite.fromTo(t, s, {
                    x: u,
                    y: f
                }, {
                    x: l,
                    y: h,
                    ease: o
                }), TweenLite.from(t, .5, {
                    opacity: 0
                })
            }, e[i].startTime + 500)
        })
    }

    function zf() {
        this.ra = new Wc(this), this.A()
    }

    function Af() {
        this.A()
    }

    function Ef(t) {
        this.ya = t, this.A()
    }

    function Ff() {
        $ = new ResizeController({
            breakpoints: {
                mobile: {
                    max: 767
                },
                tablet: {
                    min: 768,
                    max: 1043
                },
                fullFeatured: {
                    min: 768
                },
                fullNav: {
                    min: 890
                },
                desktop: {
                    min: 1044
                }
            }
        }), $.on("breakpoint", function() {
            var t = $.getActiveBreakpoints(),
                t = A(t, "mobile"),
                e = L("section-centered"),
                n = 0 < window.navigator.userAgent.indexOf("CrOS");
            t || C || n || ub || mf(), (t || C) && null !== e && V(e, "opacity", 1)
        })
    }

    function Gf() {
        var t = K("js-responsive-image"),
            e = [];
        z(t, function(t) {
            e.push(ResponsiveImage.createFromElement(t))
        }), $.on("breakpoint", function() {
            z(e, function(t) {
                ResponsiveImage.update(t)
            })
        })
    }

    function If() {
        var t = L("nav-light");
        if ("undefined" != typeof t) {
            var e = X(O.pb).height,
                n = L("site-logo-image"),
                i = L("toggle-nav-open");
            O.D && (e = lc("div", {
                id: "nav-tick",
                style: "top:-" + e + "px"
            }), oc(e), Pe.observeElement(cc(document, "nav-tick")).on("enter", function() {
                0 >= kc(document).y || (Kd(t, "nav-dark", "nav-light"), Kd(n, "icon-google-logo-dark", "icon-google-logo"), Kd(i, "icon-mobile-open-dark", "icon-mobile-open"))
            }).on("exit", function() {
                0 >= kc(document).y || (Kd(t, "nav-light", "nav-dark"), Kd(n, "icon-google-logo", "icon-google-logo-dark"), Kd(i, "icon-mobile-open", "icon-mobile-open-dark"))
            }))
        }
    }

    function Hf() {
        var t = K("js-vertical-align");
        z(t, function(t) {
            V(t, "margin-top", "-" + t.clientHeight / 2 + "px")
        })
    }

    function Bf(t, e) {
        var n = Ma(Gd(t), function(t) {
            return !Z(t, e || "allow-orphan")
        });
        Ne(n)
    }

    function tf() {
        var t = gc().height,
            e = K("js-fullscreen");
        z(e, function(e) {
            V(e, "height", "auto");
            var n = X(e).height,
                n = n >= t ? n : t,
                i = Y(e, "includeHeader");
            "undefined" != typeof i && null !== i && i && (n -= X(Oe.Ec).height), i = L("section-photo-fullscreen", e), e.style.height = rd(n), null !== i && (i.style.height = rd(n + 200)), Z(e, "section-intro") && V(document.body, {
                paddingTop: n + "px"
            })
        })
    }

    function Cf() {
        var t = document.body,
            e = X(O.D).height;
        V(t, {
            paddingTop: e + "px"
        })
    }

    function uf() {
        var t = gc().height,
            e = X(O.pb).height,
            n = .5 * (t - e),
            t = K("js-hinted-fullscreen");
        z(t, function(t) {
            V(t, "height", "auto");
            var e, i = Z(t, "section-filesanywhere") ? 100 : 0,
                r = bc(t);
            e = D && t.currentStyle;
            var o;
            if ((o = e) && (r = $b(r), o = jc(r.R) && "auto" != e.width && "auto" != e.height && !e.boxSizing), o) r = ud(t, e.width, "width", "pixelWidth"), e = ud(t, e.height, "height", "pixelHeight"), e = new J(r, e);
            else {
                if (e = new J(t.offsetWidth, t.offsetHeight), D) {
                    r = vd(t, "paddingLeft"), o = vd(t, "paddingRight");
                    var a = vd(t, "paddingTop"),
                        s = vd(t, "paddingBottom"),
                        r = new U(a, o, s, r)
                } else r = W(t, "paddingLeft"), o = W(t, "paddingRight"), a = W(t, "paddingTop"), s = W(t, "paddingBottom"), r = new U(parseFloat(a), parseFloat(o), parseFloat(s), parseFloat(r));
                if (!D || D && zb >= 9) o = W(t, "borderLeftWidth"), a = W(t, "borderRightWidth"), s = W(t, "borderTopWidth"), c = W(t, "borderBottomWidth"), o = new U(parseFloat(s), parseFloat(a), parseFloat(c), parseFloat(o));
                else {
                    o = Fd(t, "borderLeft");
                    var a = Fd(t, "borderRight"),
                        s = Fd(t, "borderTop"),
                        c = Fd(t, "borderBottom");
                    o = new U(s, a, c, o)
                }
                e = new J(e.width - o.left - r.left - r.right - o.right, e.height - o.top - r.top - r.bottom - o.bottom)
            }
            e = e.height, n > e ? V(t, "height", n + i + "px") : V(t, "height", e + i + "px")
        })
    }

    function Df() {
        var t = K("js-locked-height-wrapper");
        z(t, function(t) {
            t = K("js-locked-height-element", t);
            var e = Na(t, function(t) {
                    return X(t).height
                }),
                n = Math.max.apply(null, e);
            z(t, function(t) {
                V(t, {
                    minHeight: n + "px"
                })
            })
        })
    }
    var h, aa = aa || {},
        m = this,
        ka = "closure_uid_" + (1e9 * Math.random() >>> 0),
        la = 0,
        ra = Date.now || function() {
            return +new Date
        };
    Function.prototype.bind = Function.prototype.bind || function(t) {
        if (1 < arguments.length) {
            var e = Array.prototype.slice.call(arguments, 1);
            return e.unshift(this, t), r.apply(null, e)
        }
        return r(this, t)
    }, v(sa, Error), sa.prototype.name = "CustomError";
    var ta, ya = /&/g,
        za = /</g,
        Aa = />/g,
        Ba = /"/g,
        Ca = /'/g,
        xa = /[&<>"']/;
    v(Ja, sa), Ja.prototype.name = "AssertionError";
    var x = Array.prototype,
        La = x.indexOf ? function(t, e, n) {
            return x.indexOf.call(t, e, n)
        } : function(t, e, n) {
            if (n = null == n ? 0 : 0 > n ? Math.max(0, t.length + n) : n, q(t)) return q(e) && 1 == e.length ? t.indexOf(e, n) : -1;
            for (; n < t.length; n++)
                if (n in t && t[n] === e) return n;
            return -1
        },
        z = x.forEach ? function(t, e, n) {
            x.forEach.call(t, e, n)
        } : function(t, e, n) {
            for (var i = t.length, r = q(t) ? t.split("") : t, o = 0; i > o; o++) o in r && e.call(n, r[o], o, t)
        },
        Ma = x.filter ? function(t, e, n) {
            return x.filter.call(t, e, n)
        } : function(t, e, n) {
            for (var i = t.length, r = [], o = 0, a = q(t) ? t.split("") : t, s = 0; i > s; s++)
                if (s in a) {
                    var c = a[s];
                    e.call(n, c, s, t) && (r[o++] = c)
                }
            return r
        },
        Na = x.map ? function(t, e, n) {
            return x.map.call(t, e, n)
        } : function(t, e, n) {
            for (var i = t.length, r = Array(i), o = q(t) ? t.split("") : t, a = 0; i > a; a++) a in o && (r[a] = e.call(n, o[a], a, t));
            return r
        },
        Ya = "constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" "),
        fb = "StopIteration" in m ? m.StopIteration : Error("StopIteration");
    gb.prototype.next = function() {
        throw fb
    }, gb.prototype.La = function() {
        return this
    }, h = kb.prototype, h.n = function() {
        lb(this);
        for (var t = [], e = 0; e < this.c.length; e++) t.push(this.s[this.c[e]]);
        return t
    }, h.H = function() {
        return lb(this), this.c.concat()
    }, h.G = function(t) {
        return mb(this.s, t)
    }, h.remove = function(t) {
        return mb(this.s, t) ? (delete this.s[t], this.e--, this.Ha++, this.c.length > 2 * this.e && lb(this), !0) : !1
    }, h.get = function(t, e) {
        return mb(this.s, t) ? this.s[t] : e
    }, h.set = function(t, e) {
        mb(this.s, t) || (this.e++, this.c.push(t), this.Ha++), this.s[t] = e
    }, h.forEach = function(t, e) {
        for (var n = this.H(), i = 0; i < n.length; i++) {
            var r = n[i],
                o = this.get(r);
            t.call(e, o, r, this)
        }
    }, h.v = function() {
        return new kb(this)
    }, h.La = function(t) {
        lb(this);
        var e = 0,
            n = this.c,
            i = this.s,
            r = this.Ha,
            o = this,
            a = new gb;
        return a.next = function() {
            for (;;) {
                if (r != o.Ha) throw Error("The map has changed since the iterator was created");
                if (e >= n.length) throw fb;
                var a = n[e++];
                return t ? a : i[a]
            }
        }, a
    };
    var nb = m.navigator ? m.navigator.userAgent : "",
        ob, C, pb, qb = B("Opera") || B("OPR"),
        D = B("Trident") || B("MSIE"),
        rb = B("Gecko") && !B("WebKit") && !(B("Trident") || B("MSIE")),
        E = B("WebKit"),
        sb = E && B("Mobile"),
        tb = m.navigator || null;
    ob = -1 != (tb && tb.platform || "").indexOf("Linux"), C = !!nb && -1 != nb.indexOf("Android"), pb = !!nb && -1 != nb.indexOf("iPhone");
    var ub = !!nb && -1 != nb.indexOf("iPad"),
        wb = function() {
            var t, e = "";
            return qb && m.opera ? (e = m.opera.version, fa(e) ? e() : e) : (rb ? t = /rv\:([^\);]+)(\)|;)/ : D ? t = /\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/ : E && (t = /WebKit\/(\S+)/), t && (e = (e = t.exec(nb)) ? e[1] : ""), D && (t = vb(), t > parseFloat(e)) ? String(t) : e)
        }(),
        xb = {},
        yb = m.document,
        zb = yb && D ? vb() || ("CSS1Compat" == yb.compatMode ? parseInt(wb, 10) : 5) : void 0,
        Cb = RegExp("^(?:([^:/?#.]+):)?(?://(?:([^/?#]*)@)?([^/#?]*?)(?::([0-9]+))?(?=[/#?]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#(.*))?$"),
        Eb = E;
    h = Fb.prototype, h.ba = "", h.Ga = "", h.K = "", h.Aa = null, h.Y = "", h.T = "", h.qc = !1, h.k = !1, h.toString = function() {
        var t = [],
            e = this.ba;
        if (e && t.push(Kb(e, Lb), ":"), e = this.K) {
            t.push("//");
            var n = this.Ga;
            n && t.push(Kb(n, Lb), "@"), t.push(encodeURIComponent(String(e))), e = this.Aa, null != e && t.push(":", String(e))
        }
        return (e = this.Y) && (this.K && "/" != e.charAt(0) && t.push("/"), t.push(Kb(e, "/" == e.charAt(0) ? Mb : Nb))), (e = this.i.toString()) && t.push("?", e), (e = this.T) && t.push("#", Kb(e, Ob)), t.join("")
    }, h.v = function() {
        return new Fb(this)
    }, h.lb = function(t) {
        return this.k = t, this.i && this.i.lb(t), this
    };
    var Lb = /[#\/\?@]/g,
        Nb = /[\#\?:]/g,
        Mb = /[\#\?]/g,
        Pb = /[\#\?@]/g,
        Ob = /#/g;
    h = Jb.prototype, h.d = null, h.e = null, h.add = function(t, e) {
        Sb(this), this.j = null, t = Tb(this, t);
        var n = this.d.get(t);
        return n || this.d.set(t, n = []), n.push(e), this.e++, this
    }, h.remove = function(t) {
        return Sb(this), t = Tb(this, t), this.d.G(t) ? (this.j = null, this.e -= this.d.get(t).length, this.d.remove(t)) : !1
    }, h.G = function(t) {
        return Sb(this), t = Tb(this, t), this.d.G(t)
    }, h.H = function() {
        Sb(this);
        for (var t = this.d.n(), e = this.d.H(), n = [], i = 0; i < e.length; i++)
            for (var r = t[i], o = 0; o < r.length; o++) n.push(e[i]);
        return n
    }, h.n = function(t) {
        Sb(this);
        var e = [];
        if (q(t)) this.G(t) && (e = Qa(e, this.d.get(Tb(this, t))));
        else {
            t = this.d.n();
            for (var n = 0; n < t.length; n++) e = Qa(e, t[n])
        }
        return e
    }, h.set = function(t, e) {
        return Sb(this), this.j = null, t = Tb(this, t), this.G(t) && (this.e -= this.d.get(t).length), this.d.set(t, [e]), this.e++, this
    }, h.get = function(t, e) {
        var n = t ? this.n(t) : [];
        return 0 < n.length ? String(n[0]) : e
    }, h.toString = function() {
        if (this.j) return this.j;
        if (!this.d) return "";
        for (var t = [], e = this.d.H(), n = 0; n < e.length; n++)
            for (var i = e[n], r = encodeURIComponent(String(i)), i = this.n(i), o = 0; o < i.length; o++) {
                var a = r;
                "" !== i[o] && (a += "=" + encodeURIComponent(String(i[o]))), t.push(a)
            }
        return this.j = t.join("&")
    }, h.v = function() {
        var t = new Jb;
        return t.j = this.j, this.d && (t.d = this.d.v(), t.e = this.e), t
    }, h.lb = function(t) {
        t && !this.k && (Sb(this), this.j = null, this.d.forEach(function(t, e) {
            var n = e.toLowerCase();
            e != n && (this.remove(e), Ub(this, n, t))
        }, this)), this.k = t
    };
    var Vb = !D || D && zb >= 9,
        Wb = !rb && !D || D && D && zb >= 9 || rb && F("1.9.1");
    D && F("9");
    var Xb = D || qb || E;
    H.prototype.v = function() {
        return new H(this.x, this.y)
    }, H.prototype.toString = function() {
        return "(" + this.x + ", " + this.y + ")"
    }, H.prototype.round = function() {
        return this.x = Math.round(this.x), this.y = Math.round(this.y), this
    }, J.prototype.v = function() {
        return new J(this.width, this.height)
    }, J.prototype.toString = function() {
        return "(" + this.width + " x " + this.height + ")"
    }, J.prototype.round = function() {
        return this.width = Math.round(this.width), this.height = Math.round(this.height), this
    };
    var fc = {
        cellpadding: "cellPadding",
        cellspacing: "cellSpacing",
        colspan: "colSpan",
        frameborder: "frameBorder",
        height: "height",
        maxlength: "maxLength",
        role: "role",
        rowspan: "rowSpan",
        type: "type",
        usemap: "useMap",
        valign: "vAlign",
        width: "width"
    };
    h = ac.prototype, h.createElement = function(t) {
        return this.R.createElement(t)
    }, h.createTextNode = function(t) {
        return this.R.createTextNode(String(t))
    }, h.appendChild = function(t, e) {
        t.appendChild(e)
    }, h.Db = function(t) {
        return Wb && void 0 != t.children ? t.children : Ma(t.childNodes, function(t) {
            return 1 == t.nodeType
        })
    }, h.contains = function(t, e) {
        if (t.contains && 1 == e.nodeType) return t == e || t.contains(e);
        if ("undefined" != typeof t.compareDocumentPosition) return t == e || Boolean(16 & t.compareDocumentPosition(e));
        for (; e && t != e;) e = e.parentNode;
        return e == t
    };
    var tc = !D || D && zb >= 9,
        uc = D && !F("9");
    !E || F("528"), rb && F("1.9b") || D && F("8") || qb && F("9.5") || E && F("528"), rb && !F("8") || D && F("9");
    var vc = 0,
        wc = {};
    P.prototype.Ra = !1, P.prototype.pa = function() {
        if (!this.Ra && (this.Ra = !0, this.b(), 0 != vc)) {
            var t = ja(this);
            delete wc[t]
        }
    }, P.prototype.b = function() {
        if (this.Kb)
            for (; this.Kb.length;) this.Kb.shift()()
    }, Q.prototype.b = function() {}, Q.prototype.pa = function() {}, Q.prototype.preventDefault = function() {
        this.defaultPrevented = !0, this.Qb = !1
    }, xc[" "] = ca, v(yc, Q), yc.prototype.preventDefault = function() {
        yc.p.preventDefault.call(this);
        var t = this.xb;
        if (t.preventDefault) t.preventDefault();
        else if (t.returnValue = !1, uc) try {
            (t.ctrlKey || 112 <= t.keyCode && 123 >= t.keyCode) && (t.keyCode = -1)
        } catch (e) {}
    }, yc.prototype.b = function() {};
    var zc = "closure_listenable_" + (1e6 * Math.random() | 0),
        Bc = 0;
    Ec.prototype.add = function(t, e, n, i, r) {
        var o = t.toString();
        t = this.g[o], t || (t = this.g[o] = [], this.ka++);
        var a = Fc(t, e, i, r);
        return a > -1 ? (e = t[a], n || (e.ma = !1)) : (e = new Cc(e, this.src, o, !!i, r), e.ma = n, t.push(e)), e
    }, Ec.prototype.remove = function(t, e, n, i) {
        if (t = t.toString(), !(t in this.g)) return !1;
        var r = this.g[t];
        return e = Fc(r, e, n, i), e > -1 ? (Dc(r[e]), x.splice.call(r, e, 1), 0 == r.length && (delete this.g[t], this.ka--), !0) : !1
    }, Ec.prototype.jb = function(t) {
        t = t && t.toString();
        var e, n = 0;
        for (e in this.g)
            if (!t || e == t) {
                for (var i = this.g[e], r = 0; r < i.length; r++) ++n, Dc(i[r]);
                delete this.g[e], this.ka--
            }
        return n
    }, Ec.prototype.ca = function(t, e, n, i) {
        t = this.g[t.toString()];
        var r = -1;
        return t && (r = Fc(t, e, n, i)), r > -1 ? t[r] : null
    };
    var Hc = "closure_lm_" + (1e6 * Math.random() | 0),
        Ic = {},
        Jc = 0,
        Vc = "__closure_events_fn_" + (1e9 * Math.random() >>> 0);
    v(Wc, P);
    var Xc = [];
    h = Wc.prototype, h.W = function(t, e, n, i) {
        p(e) || (e && (Xc[0] = e.toString()), e = Xc);
        for (var r = 0; r < e.length; r++) {
            var o = S(t, e[r], n || this.handleEvent, i || !1, this.U || this);
            if (!o) break;
            this.c[o.key] = o
        }
        return this
    }, h.ab = function(t, e, n, i) {
        return Yc(this, t, e, n, i)
    }, h.nb = function(t, e, n, i, r) {
        if (p(e))
            for (var o = 0; o < e.length; o++) this.nb(t, e[o], n, i, r);
        else n = n || this.handleEvent, r = r || this.U || this, n = Kc(n), i = !!i, e = Ac(t) ? t.ca(e, n, i, r) : t && (t = Mc(t)) ? t.ca(e, n, i, r) : null, e && (Sc(e), delete this.c[e.key]);
        return this
    }, h.jb = function() {
        Ta(this.c, Sc), this.c = {}
    }, h.b = function() {
        Wc.p.b.call(this), this.jb()
    }, h.handleEvent = function() {
        throw Error("EventHandler.handleEvent not implemented")
    }, v(T, P), T.prototype[zc] = !0, h = T.prototype, h.ib = null, h.addEventListener = function(t, e, n, i) {
        S(this, t, e, n, i)
    }, h.removeEventListener = function(t, e, n, i) {
        Rc(this, t, e, n, i)
    }, h.dispatchEvent = function(t) {
        var e, n = this.ib;
        if (n)
            for (e = []; n; n = n.ib) e.push(n);
        var n = this.$b,
            i = t.type || t;
        if (q(t)) t = new Q(t, n);
        else if (t instanceof Q) t.target = t.target || n;
        else {
            var r = t;
            t = new Q(i, n), Za(t, r)
        }
        var o, r = !0;
        if (e)
            for (var a = e.length - 1; !t.Z && a >= 0; a--) o = t.currentTarget = e[a], r = Zc(o, i, !0, t) && r;
        if (t.Z || (o = t.currentTarget = n, r = Zc(o, i, !0, t) && r, t.Z || (r = Zc(o, i, !1, t) && r)), e)
            for (a = 0; !t.Z && a < e.length; a++) o = t.currentTarget = e[a], r = Zc(o, i, !1, t) && r;
        return r
    }, h.b = function() {
        T.p.b.call(this), this.w && this.w.jb(void 0), this.ib = null
    }, h.W = function(t, e, n, i) {
        return this.w.add(String(t), e, !1, n, i)
    }, h.ab = function(t, e, n, i) {
        return this.w.add(String(t), e, !0, n, i)
    }, h.nb = function(t, e, n, i) {
        return this.w.remove(String(t), e, n, i)
    }, h.ca = function(t, e, n, i) {
        return this.w.ca(String(t), e, n, i)
    }, v($c, T);
    var ad = 0;
    $c.prototype.r = function(t) {
        this.dispatchEvent(t)
    }, v(cd, P), h = cd.prototype, h.da = 0, h.b = function() {
        cd.p.b.call(this), this.stop(), delete this.bb, delete this.U
    }, h.start = function(t) {
        this.stop(), this.da = bd(this.ac, void 0 !== t ? t : this.oc)
    }, h.stop = function() {
        this.Za() && m.clearTimeout(this.da), this.da = 0
    }, h.Za = function() {
        return 0 != this.da
    }, h.hc = function() {
        this.da = 0, this.bb && this.bb.call(this.U)
    };
    var Xa = {},
        dd = null;
    v(id, $c), h = id.prototype, h.l = 0, h.play = function(t) {
        if (t || this.t == ad) this.l = 0, this.coords = this.ia;
        else if (1 == this.t) return !1;
        ed(this), this.startTime = t = ra(), -1 == this.t && (this.startTime -= this.duration * this.l), this.wb = this.startTime + this.duration, this.l || this.r("begin"), this.r("play"), -1 == this.t && this.r("resume"), this.t = 1;
        var e = ja(this);
        return e in Xa || (Xa[e] = this), fd(), hd(this, t), !0
    }, h.stop = function(t) {
        ed(this), this.t = ad, t && (this.l = 1), jd(this, this.l), this.r("stop"), this.r("end")
    }, h.b = function() {
        this.t == ad || this.stop(!1), this.r("destroy"), id.p.b.call(this)
    }, h.r = function(t) {
        this.dispatchEvent(new kd(t, this))
    }, v(kd, Q), U.prototype.v = function() {
        return new U(this.top, this.right, this.bottom, this.left)
    }, U.prototype.toString = function() {
        return "(" + this.top + "t, " + this.right + "r, " + this.bottom + "b, " + this.left + "l)"
    }, U.prototype.contains = function(t) {
        return this && t ? t instanceof U ? t.left >= this.left && t.right <= this.right && t.top >= this.top && t.bottom <= this.bottom : t.x >= this.left && t.x <= this.right && t.y >= this.top && t.y <= this.bottom : !1
    }, U.prototype.round = function() {
        return this.top = Math.round(this.top), this.right = Math.round(this.right), this.bottom = Math.round(this.bottom), this.left = Math.round(this.left), this
    };
    var wd = {
            thin: 2,
            medium: 4,
            thick: 6
        },
        Gd = function() {
            function t(t, n) {
                if (!t) return [];
                if (t.constructor == Array) return t;
                if (!q(t)) return [t];
                if (q(n) && (n = cc(document, n), !n)) return [];
                n = n || document;
                var r = n.ownerDocument || n.documentElement;
                return k = n.contentType && "application/xml" == n.contentType || qb && (n.doctype || "[object XMLDocument]" == r.toString()) || !!r && (D ? r.xml : n.xmlVersion || r.xmlVersion), (r = i(t)(n)) && r.wa ? r : e(r)
            }

            function e(t) {
                if (t && t.wa) return t;
                var e = [];
                if (!t || !t.length) return e;
                if (t[0] && e.push(t[0]), 2 > t.length) return e;
                if (V++, D && k) {
                    var n = V + "";
                    t[0].setAttribute("_zipIdx", n);
                    for (var i, r = 1; i = t[r]; r++) t[r].getAttribute("_zipIdx") != n && e.push(i), i.setAttribute("_zipIdx", n)
                } else if (D && t.fc) try {
                    for (r = 1; i = t[r]; r++) m(i) && e.push(i)
                } catch (o) {} else
                    for (t[0] && (t[0]._zipIdx = V), r = 1; i = t[r]; r++) t[r]._zipIdx != V && e.push(i), i._zipIdx = V;
                return e
            }

            function n(t, e) {
                if (!e) return 1;
                var n = P(t);
                return e[n] ? 0 : e[n] = 1
            }

            function i(t, e) {
                if (R) {
                    var n = I[t];
                    if (n && !e) return n
                }
                if (n = N[t]) return n;
                var n = t.charAt(0),
                    o = -1 == t.indexOf(" ");
                if (0 <= t.indexOf("#") && o && (e = !0), !R || e || -1 != ">~+".indexOf(n) || D && -1 != t.indexOf(":") || w && 0 <= t.indexOf(".") || -1 != t.indexOf(":contains") || -1 != t.indexOf("|=")) {
                    var a = t.split(/\s*,\s*/);
                    return N[t] = 2 > a.length ? r(t) : function(t) {
                        for (var e, n = 0, i = []; e = a[n++];) i = i.concat(r(e)(t));
                        return i
                    }
                }
                var s = 0 <= ">~+".indexOf(t.charAt(t.length - 1)) ? t + " *" : t;
                return I[t] = function(e) {
                    try {
                        if (9 != e.nodeType && !o) throw "";
                        var n = e.querySelectorAll(s);
                        return D ? n.fc = !0 : n.wa = !0, n
                    } catch (r) {
                        return i(t, !0)(e)
                    }
                }
            }

            function r(t) {
                var e = g(va(t));
                if (1 == e.length) {
                    var n = o(e[0]);
                    return function(t) {
                        return (t = n(t, [])) && (t.wa = !0), t
                    }
                }
                return function(t) {
                    t = y(t);
                    for (var n, i, r, a, s = e.length, c = 0; s > c; c++) {
                        a = [], n = e[c], i = t.length - 1, i > 0 && (r = {}, a.wa = !0), i = o(n);
                        for (var u = 0; n = t[u]; u++) i(n, a, r);
                        if (!a.length) break;
                        t = a
                    }
                    return a
                }
            }

            function o(t) {
                var e = M[t.$];
                if (e) return e;
                var n = t.Gb,
                    n = n ? n.xa : "",
                    i = u(t, {
                        S: 1
                    }),
                    r = "*" == t.tag,
                    o = document.getElementsByClassName;
                if (n) o = {
                    S: 1
                }, r && (o.tag = 1), i = u(t, o), "+" == n ? e = c(i) : "~" == n ? e = s(i) : ">" == n && (e = a(i));
                else if (t.id) i = !t.Jb && r ? bb : u(t, {
                    S: 1,
                    id: 1
                }), e = function(e, n) {
                    var r;
                    r = $b(e), r = cc(r.R, t.id);
                    var o;
                    if ((o = r && i(r)) && !(o = 9 == e.nodeType)) {
                        for (o = r.parentNode; o && o != e;) o = o.parentNode;
                        o = !!o
                    }
                    return o ? y(r, n) : void 0
                };
                else if (o && /\{\s*\[native code\]\s*\}/.test(String(o)) && t.u.length && !w) var i = u(t, {
                        S: 1,
                        u: 1,
                        id: 1
                    }),
                    l = t.u.join(" "),
                    e = function(t, e) {
                        for (var n, r = y(0, e), o = 0, a = t.getElementsByClassName(l); n = a[o++];) i(n, t) && r.push(n);
                        return r
                    };
                else r || t.Jb ? (i = u(t, {
                    S: 1,
                    tag: 1,
                    id: 1
                }), e = function(e, n) {
                    for (var r, o = y(0, n), a = 0, s = e.getElementsByTagName(t.Wa()); r = s[a++];) i(r, e) && o.push(r);
                    return o
                }) : e = function(e, n) {
                    for (var i, r = y(0, n), o = 0, a = e.getElementsByTagName(t.Wa()); i = a[o++];) r.push(i);
                    return r
                };
                return M[t.$] = e
            }

            function a(t) {
                return t = t || bb,
                    function(e, i, r) {
                        for (var o = 0, a = e[x]; e = a[o++];) L(e) && (!r || n(e, r)) && t(e, o) && i.push(e);
                        return i
                    }
            }

            function s(t) {
                return function(e, i, r) {
                    for (e = e[A]; e;) {
                        if (L(e)) {
                            if (r && !n(e, r)) break;
                            t(e) && i.push(e)
                        }
                        e = e[A]
                    }
                    return i
                }
            }

            function c(t) {
                return function(e, i, r) {
                    for (; e = e[A];)
                        if (!T || m(e)) {
                            r && !n(e, r) || !t(e) || i.push(e);
                            break
                        }
                    return i
                }
            }

            function u(t, e) {
                if (!t) return bb;
                e = e || {};
                var n = null;
                return e.S || (n = v(n, m)), e.tag || "*" != t.tag && (n = v(n, function(e) {
                    return e && e.tagName == t.Wa()
                })), e.u || z(t.u, function(t, e) {
                    var i = new RegExp("(?:^|\\s)" + t + "(?:\\s|$)");
                    n = v(n, function(t) {
                        return i.test(t.className)
                    }), n.count = e
                }), e.N || z(t.N, function(t) {
                    var e = t.name;
                    O[e] && (n = v(n, O[e](e, t.value)))
                }), e.la || z(t.la, function(t) {
                    var e, i = t.Ma;
                    t.type && S[t.type] ? e = S[t.type](i, t.eb) : i.length && (e = j(i)), e && (n = v(n, e))
                }), e.id || t.id && (n = v(n, function(e) {
                    return !!e && e.id == t.id
                })), n || "default" in e || (n = bb), n
            }

            function l(t) {
                return h(t) % 2
            }

            function f(t) {
                return !(h(t) % 2)
            }

            function h(t) {
                var e = t.parentNode,
                    n = 0,
                    i = e[x],
                    r = t._i || -1,
                    o = e._l || -1;
                if (!i) return -1;
                if (i = i.length, o == i && r >= 0 && o >= 0) return r;
                for (e._l = i, r = -1, e = e.firstElementChild || e.firstChild; e; e = e[A]) L(e) && (e._i = ++n, t === e && (r = n));
                return r
            }

            function d(t) {
                for (; t = t[A];)
                    if (L(t)) return !1;
                return !0
            }

            function p(t) {
                for (; t = t[C];)
                    if (L(t)) return !1;
                return !0
            }

            function b(t, e) {
                return t ? "class" == e ? t.className || "" : "for" == e ? t.htmlFor || "" : "style" == e ? t.style.cssText || "" : (k ? t.getAttribute(e) : t.getAttribute(e, 2)) || "" : ""
            }

            function m(t) {
                return 1 == t.nodeType
            }

            function v(t, e) {
                return t ? e ? function() {
                    return t.apply(window, arguments) && e.apply(window, arguments)
                } : t : e
            }

            function g(t) {
                function e() {
                    if (l >= 0 && (m.id = n(l, p).replace(/\\/g, ""), l = -1), f >= 0) {
                        var t = f == p ? null : n(f, p);
                        0 > ">~+".indexOf(t) ? m.tag = t : m.xa = t, f = -1
                    }
                    u >= 0 && (m.u.push(n(u + 1, p).replace(/\\/g, "")), u = -1)
                }

                function n(e, n) {
                    return va(t.slice(e, n))
                }
                t = 0 <= ">~+".indexOf(t.slice(-1)) ? t + " * " : t + " ";
                for (var i, r = [], o = -1, a = -1, s = -1, c = -1, u = -1, l = -1, f = -1, h = "", d = "", p = 0, b = t.length, m = null, v = null; h = d, d = t.charAt(p), b > p; p++) "\\" != h && (m || (i = p, m = {
                    $: null,
                    N: [],
                    la: [],
                    u: [],
                    tag: null,
                    xa: null,
                    id: null,
                    Wa: function() {
                        return k ? this.wc : this.tag
                    }
                }, f = p), o >= 0 ? "]" == d ? (v.Ma ? v.eb = n(s || o + 1, p) : v.Ma = n(o + 1, p), !(o = v.eb) || '"' != o.charAt(0) && "'" != o.charAt(0) || (v.eb = o.slice(1, -1)), m.la.push(v), v = null, o = s = -1) : "=" == d && (s = 0 <= "|~^$*".indexOf(h) ? h : "", v.type = s + d, v.Ma = n(o + 1, p - s.length), s = p + 1) : a >= 0 ? ")" == d && (c >= 0 && (v.value = n(a + 1, p)), c = a = -1) : "#" == d ? (e(), l = p + 1) : "." == d ? (e(), u = p) : ":" == d ? (e(), c = p) : "[" == d ? (e(), o = p, v = {}) : "(" == d ? (c >= 0 && (v = {
                    name: n(c + 1, p),
                    value: null
                }, m.N.push(v)), a = p) : " " == d && h != d && (e(), c >= 0 && m.N.push({
                    name: n(c + 1, p)
                }), m.Jb = m.N.length || m.la.length || m.u.length, m.Gc = m.$ = n(i, p), m.wc = m.tag = m.xa ? null : m.tag || "*", m.tag && (m.tag = m.tag.toUpperCase()), r.length && r[r.length - 1].xa && (m.Gb = r.pop(), m.$ = m.Gb.$ + " " + m.$), r.push(m), m = null));
                return r
            }

            function y(t, e) {
                var n = e || [];
                return t && n.push(t), n
            }
            var w = E && "BackCompat" == document.compatMode,
                x = document.firstChild.children ? "children" : "childNodes",
                k = !1,
                S = {
                    "*=": function(t, e) {
                        return function(n) {
                            return 0 <= b(n, t).indexOf(e)
                        }
                    },
                    "^=": function(t, e) {
                        return function(n) {
                            return 0 == b(n, t).indexOf(e)
                        }
                    },
                    "$=": function(t, e) {
                        return function(n) {
                            return n = " " + b(n, t), n.lastIndexOf(e) == n.length - e.length
                        }
                    },
                    "~=": function(t, e) {
                        var n = " " + e + " ";
                        return function(e) {
                            return 0 <= (" " + b(e, t) + " ").indexOf(n)
                        }
                    },
                    "|=": function(t, e) {
                        return e = " " + e,
                            function(n) {
                                return n = " " + b(n, t), n == e || 0 == n.indexOf(e + "-")
                            }
                    },
                    "=": function(t, e) {
                        return function(n) {
                            return b(n, t) == e
                        }
                    }
                },
                T = "undefined" == typeof document.firstChild.nextElementSibling,
                A = T ? "nextSibling" : "nextElementSibling",
                C = T ? "previousSibling" : "previousElementSibling",
                L = T ? m : bb,
                O = {
                    checked: function() {
                        return function(t) {
                            return t.checked || t.attributes.checked
                        }
                    },
                    "first-child": function() {
                        return p
                    },
                    "last-child": function() {
                        return d
                    },
                    "only-child": function() {
                        return function(t) {
                            return p(t) && d(t) ? !0 : !1
                        }
                    },
                    empty: function() {
                        return function(t) {
                            var e = t.childNodes;
                            for (t = t.childNodes.length - 1; t >= 0; t--) {
                                var n = e[t].nodeType;
                                if (1 === n || 3 == n) return !1
                            }
                            return !0
                        }
                    },
                    contains: function(t, e) {
                        var n = e.charAt(0);
                        return ('"' == n || "'" == n) && (e = e.slice(1, -1)),
                            function(t) {
                                return 0 <= t.innerHTML.indexOf(e)
                            }
                    },
                    not: function(t, e) {
                        var n = g(e)[0],
                            i = {
                                S: 1
                            };
                        "*" != n.tag && (i.tag = 1), n.u.length || (i.u = 1);
                        var r = u(n, i);
                        return function(t) {
                            return !r(t)
                        }
                    },
                    "nth-child": function(t, e) {
                        if ("odd" == e) return l;
                        if ("even" == e) return f;
                        if (-1 != e.indexOf("n")) {
                            var n = e.split("n", 2),
                                i = n[0] ? "-" == n[0] ? -1 : parseInt(n[0], 10) : 1,
                                r = n[1] ? parseInt(n[1], 10) : 0,
                                o = 0,
                                a = -1;
                            if (i > 0 ? 0 > r ? r = r % i && i + r % i : r > 0 && (r >= i && (o = r - r % i), r %= i) : 0 > i && (i *= -1, r > 0 && (a = r, r %= i)), i > 0) return function(t) {
                                return t = h(t), t >= o && (0 > a || a >= t) && t % i == r
                            };
                            e = r
                        }
                        var s = parseInt(e, 10);
                        return function(t) {
                            return h(t) == s
                        }
                    }
                },
                j = D ? function(t) {
                    var e = t.toLowerCase();
                    return "class" == e && (t = "className"),
                        function(n) {
                            return k ? n.getAttribute(t) : n[t] || n[e]
                        }
                } : function(t) {
                    return function(e) {
                        return e && e.getAttribute && e.hasAttribute(t)
                    }
                },
                M = {},
                N = {},
                I = {},
                R = !!document.querySelectorAll && (!E || F("526")),
                V = 0,
                P = D ? function(t) {
                    return k ? t.getAttribute("_uid") || t.setAttribute("_uid", ++V) || V : t.uniqueID
                } : function(t) {
                    return t._uid || (t._uid = ++V)
                };
            return t.N = O, t
        }();
    u("goog.dom.query", Gd), u("goog.dom.query.pseudos", Gd.N);
    var Pd = {};
    Qd.prototype.zb = null, Qd.prototype.yb = null;
    var Rd = 0;
    Qd.prototype.reset = function(t, e, n, i, r) {
        "number" == typeof r || Rd++, i || ra(), this.fa = t, this.sc = e, delete this.zb, delete this.yb
    }, Qd.prototype.Tb = function(t) {
        this.fa = t
    }, Td.prototype.toString = function() {
        return this.name
    };
    var Ud = new Td("SEVERE", 1e3),
        Vd = new Td("CONFIG", 700),
        Wd = new Td("FINE", 500);
    h = Sd.prototype, h.getParent = function() {
        return this.X
    }, h.Db = function() {
        return this.Na || (this.Na = {}), this.Na
    }, h.Tb = function(t) {
        this.fa = t
    }, h.log = function(t, e, n) {
        if (t.value >= Xd(this).value)
            for (fa(e) && (e = e()), t = this.kc(t, e, n), e = "log:" + t.sc, m.console && (m.console.timeStamp ? m.console.timeStamp(e) : m.console.markTimeline && m.console.markTimeline(e)), m.msWriteProfilerMark && m.msWriteProfilerMark(e), e = this; e;) {
                n = e;
                var i = t;
                if (n.Eb)
                    for (var r = 0, o = void 0; o = n.Eb[r]; r++) o(i);
                e = e.getParent()
            }
    }, h.kc = function(t, e, n) {
        var i = new Qd(t, String(e), this.f);
        if (n) {
            i.zb = n;
            var r, o = arguments.callee.caller;
            try {
                var a, s = ba("window.location.href");
                if (q(n)) a = {
                    message: n,
                    name: "Unknown error",
                    lineNumber: "Not available",
                    fileName: s,
                    stack: "Not available"
                };
                else {
                    var c, u, l = !1;
                    try {
                        c = n.lineNumber || n.Fc || "Not available"
                    } catch (f) {
                        c = "Not available", l = !0
                    }
                    try {
                        u = n.fileName || n.filename || n.sourceURL || m.$googDebugFname || s
                    } catch (h) {
                        u = "Not available", l = !0
                    }
                    a = !l && n.lineNumber && n.fileName && n.stack && n.message && n.name ? n : {
                        message: n.message || "Not available",
                        name: n.name || "UnknownError",
                        lineNumber: c,
                        fileName: u,
                        stack: n.stack || "Not available"
                    }
                }
                r = "Message: " + wa(a.message) + '\nUrl: <a href="view-source:' + a.fileName + '" target="_new">' + a.fileName + "</a>\nLine: " + a.lineNumber + "\n\nBrowser stack:\n" + wa(a.stack + "-> ") + "[end]\n\nJS stack traversal:\n" + wa(Md(o) + "-> ")
            } catch (d) {
                r = "Exception trying to expose exception! You win, we lose. " + d
            }
            i.yb = r
        }
        return i
    };
    var Yd = {},
        Zd = null;
    be.prototype.tb = null;
    var ee;
    v(fe, be), ee = new fe, v(he, T);
    var ie = "",
        je = he.prototype,
        ke = $d("goog.net.XhrIo");
    je.o = ke;
    var le = /^https?$/i,
        me = ["POST", "PUT"],
        ne = [];
    h = he.prototype, h.cc = function() {
        this.pa(), Pa(ne, this)
    }, h.send = function(t, e, n, i) {
        if (this.a) throw Error("[goog.net.XhrIo] Object is active with another request=" + this.va + "; newUri=" + t);
        e = e ? e.toUpperCase() : "GET", this.va = t, this.ea = "", this.Ib = e, this.Ta = !1, this.F = !0, this.a = ge(this.Ja ? this.Ja : ee), this.Ia = ce(this.Ja ? this.Ja : ee), this.a.onreadystatechange = r(this.Lb, this);
        try {
            ae(this.o, pe(this, "Opening Xhr")), this.Ya = !0, this.a.open(e, String(t), !0), this.Ya = !1
        } catch (o) {
            return ae(this.o, pe(this, "Error opening Xhr: " + o.message)), void qe(this, o)
        }
        t = n || "";
        var a = this.headers.v();
        i && ab(i, function(t, e) {
            a.set(e, t)
        }), i = Oa(a.H(), re), n = m.FormData && t instanceof m.FormData, !A(me, e) || i || n || a.set("Content-Type", "application/x-www-form-urlencoded;charset=utf-8"), a.forEach(function(t, e) {
            this.a.setRequestHeader(e, t)
        }, this), this.Pb && (this.a.responseType = this.Pb), "withCredentials" in this.a && (this.a.withCredentials = this.Cc);
        try {
            se(this), 0 < this.ja && (this.Fa = te(this.a), ae(this.o, pe(this, "Will abort after " + this.ja + "ms if incomplete, xhr2 " + this.Fa)), this.Fa ? (this.a.timeout = this.ja, this.a.ontimeout = r(this.Ub, this)) : this.Da = bd(this.Ub, this.ja, this)), ae(this.o, pe(this, "Sending request")), this.ta = !0, this.a.send(t), this.ta = !1
        } catch (s) {
            ae(this.o, pe(this, "Send error: " + s.message)), qe(this, s)
        }
    }, h.Ub = function() {
        "undefined" != typeof aa && this.a && (this.ea = "Timed out after " + this.ja + "ms, aborting", ae(this.o, pe(this, this.ea)), this.dispatchEvent("timeout"), this.abort(8))
    }, h.abort = function() {
        this.a && this.F && (ae(this.o, pe(this, "Aborting")), this.F = !1, this.L = !0, this.a.abort(), this.L = !1, this.dispatchEvent("complete"), this.dispatchEvent("abort"), ve(this))
    }, h.b = function() {
        this.a && (this.F && (this.F = !1, this.L = !0, this.a.abort(), this.L = !1), ve(this, !0)), he.p.b.call(this)
    }, h.Lb = function() {
        this.Ra || (this.Ya || this.ta || this.L ? we(this) : this.vc())
    }, h.vc = function() {
        we(this)
    }, h.Za = function() {
        return !!this.a
    }, v(ze, T), ze.prototype.scrollTo = function(t, e) {
        this.Qa = kc(document);
        var n = e || this.Sb;
        t = new H(n.x + t.x, n.y + t.y), n = new id([this.Qa.x, this.Qa.y], [t.x, t.y], this.yc * this.Rb, this.zc), this.ra.W(n, ["begin", "finish", "animate"], this.mc), n.play()
    }, ze.prototype.mc = function(t) {
        switch (t.type) {
            case "begin":
                this.dispatchEvent("b");
                break;
            case "finish":
                window.scrollTo(t.x, t.y), this.dispatchEvent("a"), t.pa();
                break;
            case "animate":
                window.scrollTo(t.x, t.y)
        }
    }, ze.prototype.lc = function(t) {
        t.preventDefault(), t = t.target;
        var e = rc(t, "A", "gweb-smoothscroll-control");
        e && (t = e), t = t.href.match(/(#)(.*)/)[2], e = cc(document, t), Ae(e, !0);
        var n = qd(e);
        this.scrollTo(n, void 0), window.location.hash = t, Ae(e, !1)
    };
    var Be;
    Be = function(t, e, n) {
        function i() {
            r.push(S(t, "mousedown", function(t) {
                Ce ? Ce = !1 : e.call(n, t)
            }))
        }
        var r = [];
        return Modernizr.touch && function() {
                r.push(S(t, "touchend", function(t) {
                    Ce = !0, e.call(n, t)
                }))
            }(), De ? i() : Ee(i),
            function() {
                for (var t = 0; t < r.length; t++) Sc(r[t])
            }
    };
    var De = !Modernizr.touch,
        He = !1,
        He = !1,
        Ie = [],
        Ce = !1,
        Je = window.isScrolling = !1,
        Le = window.isTouchMoving = !1,
        Oe = {},
        $, Pe, O;
    v(Qe, P);
    var jb = new kb;
    Qe.prototype.b = function() {
        jb.remove(this.f), this.C = this.gb = null, z(this.Ea, unlistenFunc), this.Ea.length = 0, this.dc.length = 0, Qe.p.b.call(this)
    }, Qe.prototype.resize = function() {
        this.$a && (this.C.style.width = window.innerWidth + "px", this.C.style.height = window.innerHeight + "px", this.I.style.width = window.innerWidth + "px", this.I.style.height = window.innerHeight + "px")
    }, Qe.prototype.toggle = function() {
        if (!Z(this.C, "is-active")) {
            Id(this.C, "is-active");
            var t = {
                width: window.innerWidth + "px",
                height: window.innerHeight + "px",
                overflow: "hidden"
            };
            V(this.C, t), V(this.I, t), this.$a = !0, this.Hb = Z(this.cb, "icon-google-logo-dark"), this.Hb || (Kd(this.I, "nav-light", "nav-dark"), Kd(this.cb, "icon-google-logo", "icon-google-logo-dark"))
        }
    }, Qe.prototype.ec = function() {
        if (Z(this.C, "is-active")) {
            Jd(this.C, "is-active");
            var t = {
                width: "",
                height: "",
                overflow: ""
            };
            V(this.C, t), V(this.I, t), this.pc && !this.Hb && (Kd(this.I, "nav-dark", "nav-light"), Kd(this.cb, "icon-google-logo-dark", "icon-google-logo")), this.$a = !1
        }
    }, v(Xe, P), Xe.prototype.b = function() {
        this.sb.remove(this.f), this.fb = this.ua = this.ga = this.h = null, this.Pa && (Sc(this.Pa), this.Pa = null), Xe.p.b.call(this)
    }, v(cf, P), cf.prototype.b = function() {
        this.Q = this.Ca = null, this.tc(), cf.p.b.call(this)
    }, cf.prototype.show = function(t) {
        ef(this.Q, X(this.B).height), Id(this.Ca, "tab-is-active"), Id(this.B, "tab-is-active");
        var e;
        e = "undefined" == typeof t || !1 === t, this.oa || e ? (TweenLite.set(this.B, {
            autoAlpha: 1,
            x: 0
        }), this.oa && !e && (t = this.Xa < t, e = .1, Z(this.Q.h, "js-delay-fast") && (e = .05), Z(this.Q.h, "js-delay-slow") && (e = .25), ff(this, t, e))) : (TweenLite.set(this.B, {
            autoAlpha: 1
        }), TweenLite.fromTo(this.B, this.mb, {
            x: t > this.Xa ? -50 : 50
        }, {
            x: 0,
            ease: Expo.easeOut
        })), t = K("js-tab-lazy-load", this.Oa), z(t, function(t) {
            t.src || (t.src = Y(t, "src"))
        })
    }, v(gf, P);
    var Ye = new kb;
    gf.prototype.b = function() {
        Ye.remove(this.f), this.Oa = this.h = null, $.off("breakpoint", this.J), $.off("resize", this.ha), z(this.O, function(t) {
            t.pa()
        }), this.O = null, gf.p.b.call(this)
    }, gf.prototype.setActive = function(t) {
        t !== this.P && ("undefined" != typeof this.P && this.O[this.P] && df(this.O[this.P]), "undefined" != typeof t && this.O[t] && this.O[t].show(this.Ac && this.P), this.P = t)
    }, gf.prototype.Ob = function() {
        ef(this, X(this.O[this.P].B).height)
    }, v(kf, P);
    var lf = new kb;
    kf.prototype.b = function() {
        lf.remove(this.f), this.m = null, $.off("resize", this.ha), $.off("breakpoint", this.J), kf.p.b.call(this)
    }, kf.prototype.ob = function() {
        this.uc = "undefined" != typeof this.hb && null !== this.hb ? this.hb : qd(this.m).y, X(this.m)
    }, kf.prototype.Mb = function() {
        if (!(0 > kc(document).y)) {
            this.ob();
            var t = (kc(document).y - this.uc) / (this.mb * this.gc);
            TweenLite.set(this.m, {
                y: t
            }), this.Ab && 0 >= t && TweenLite.set(this.m, {
                opacity: (this.rb + t) / this.rb
            })
        }
    }, u("drive.pages.Download", pf), pf.prototype.A = function() {
        this.Va(), this.minHeight = this.V = parseInt(W(O.D, "height")), this.Sa = !1, this.dir = document.documentElement.getAttribute("dir");
        var t = r(function() {
            var t = gc().height,
                e = X(O.Yb).height;
            if (t !== e && (this.V += t - e, this.V >= this.minHeight ? O.D.style.height = rd(this.V) : (O.D.style.height = rd(this.minHeight), this.V = this.minHeight)), t = gc().width, e = L("content"), 1300 > t) "rtl" === this.dir ? V(e, {
                marginRight: "auto"
            }) : V(e, {
                marginLeft: "auto"
            });
            else {
                var n = L("example"),
                    i = X(n).width,
                    n = i + 520,
                    i = (t - n) / 2 + (i - 520) - 30;
                n > t && (i -= 70), "rtl" === this.dir ? V(e, {
                    marginRight: i + "px"
                }) : V(e, {
                    marginLeft: i + "px"
                })
            }
        }, this);
        t(), this.rc || this.ub ? qf(this) : rf(this), C || sb || ub || pb || S(window, "resize", t)
    }, pf.prototype.Va = function() {
        O = {
            D: L("section-intro"),
            Yb: L("download")
        }
    }, u("drive.pages.Home", sf), sf.prototype.A = function() {
        function t() {
            tf(), uf()
        }
        this.Ua = this.Cb = !1, t(), vf(), wf(), xf(this), C || sb || ub || pb || S(window, "resize", t)
    }, u("drive.pages.UsingDrive", zf), zf.prototype.A = function() {
        function t() {
            tf(), uf()
        }
        jf(), bf(), t(), C || sb || ub || pb || S(window, "resize", t);
        var e = Gd(".select-menu");
        z(e, function(t) {
            this.ra.W(t, "change", this.jc, !1, this)
        }, this)
    }, zf.prototype.jc = function(t) {
        "undefined" != typeof _gaq && _gaq.push(["_trackEvent", "Drive", "Tabs", t.target.value])
    }, u("drive.pages.Work", Af), Af.prototype.A = function() {
        Bf(".list-features li"), Cf(), setTimeout(Df, 100), C || sb || ub || pb || S(window, "resize", Cf)
    }, u("drive.SetUp", Ef), Ef.prototype.A = function() {
        Ke(), Me();
        var t = document.documentElement;
        Modernizr.mq("only all") || Id(t, "no-mq");
        var e = /(Android)/.exec(navigator.userAgent);
        if (!/(Chrome)/.exec(navigator.userAgent) && e && Id(t, "android-browser"), (C || sb || ub || pb) && Id(t, "mobile-device"), this.Va(), Ff(), Gf(), Bf("h1,h2,h3,h4,h5,h6,p"), Hf(), Re(), $.on("resize", Se), Pe = new ScrollController({
                debounceMs: 10
            }), this.kb = new ze, this.kb.Rb = 500, this.kb.Sb = new H(0, -40), t = this.kb, e = dc("a", "gweb-smoothscroll-control", null))
            for (var n, i = 0; n = e[i]; i++) {
                var r, o = Qb(n.href),
                    a = o.K + o.Y,
                    s = Qb(window.location.hostname + window.location.pathname);
                a == s.K + s.Y && o.T && (r = n.href.match(/(#)(.*)/)[2], r = cc(document, r)), r && t.ra.W(n, "click", t.lc)
            }
        r = {
            home: sf,
            usingDrive: zf,
            download: pf,
            work: Af
        }, "undefined" != typeof this.ya && r[this.ya] && (this.page = new r[this.ya]), "download" !== this.ya && If(), O.D && td(O.D), O.Ka && td(O.Ka)
    }, Ef.prototype.Va = function() {
        O = {
            pb: L("header"),
            D: L("section-intro"),
            Ka: L("unfixed-wrapper")
        }
    }, u("drive.avoidOrphans", Bf), u("drive.setFullOnResize", tf), u("drive.setFixedPanel", Cf), u("drive.setPanelOnResize", uf), u("drive.setEqualHeightElements", Df), u("drive.QueryParamManager", function() {
        if (this.Bc = new Fb(window.location.href), this.i = this.Bc.i, document.referrer && !this.i.G("usp"))
            for (var t = K("get-started"), e = 0; t[e]; e++) {
                var n = new Fb(t[e].href),
                    i = n,
                    r = document.referrer;
                G(i), p(r) || (r = [String(r)]), Ub(i.i, "urp", r), t[e].href = n.toString()
            }
        var o, t = {
                "get-started": ["authuser", "usp"]
            },
            e = new Fb(window.location.href);
        for (o in t)
            for (n = t[o], i = 0, r = n.length; r > i; i++) {
                var a, s = n[i];
                a = s;
                var c = e.i,
                    u = new Jb(e.T);
                if (a = c.G(a) ? c.n(a) : u.n(a))
                    for (var c = dc("a", o, void 0), u = 0, l = c.length; l > u; u++) {
                        var f = new Fb(c[u].href),
                            h = f,
                            d = s,
                            b = a,
                            m = h.i;
                        m.G(d), b && b.length && (Ub(m, d, b), Ib(h, m)), c[u].href = f.toString()
                    }
            }
    })
}();