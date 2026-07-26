/* eslint-disable @typescript-eslint/no-unused-expressions */
!function(e) {
    "use strict";
    var t = Object.create(null);
    function clean(e) {
        return String(null == e ? "" : e).trim();
    }
    function listFor(e, t) {
        return clean(e && e.getAttribute(t)).split(",").map(clean).filter(Boolean);
    }
    function loadAsset(e, r) {
        var n = clean(e), a = (r ? "style:" : "script:") + n;
        return n ? (t[a] || (t[a] = new Promise(function(e, o) {
            var i = function findAsset(e, t) {
                var r = t ? document.querySelectorAll('link[rel~="stylesheet"]') : document.scripts, n = t ? "href" : "src";
                return Array.prototype.find.call(r, function(t) {
                    return clean(t.getAttribute(n)).split("?")[0] === e;
                });
            }(n, r);
            if (i) {
                var u = "true" === i.getAttribute("data-feature-loaded");
                return (u = r ? u || i.sheet || !i.getAttribute("data-feature-style") : u || "true" === i.getAttribute("data-loaded") || "complete" === i.readyState || !i.getAttribute("data-feature-source") && !i.getAttribute("data-lazy-source")) ? void e() : (i.addEventListener("load", e, {
                    once: !0
                }), void i.addEventListener("error", o, {
                    once: !0
                }));
            }
            var s = document.createElement(r ? "link" : "script");
            r ? (s.rel = "stylesheet", s.href = n, s.setAttribute("data-feature-style", n)) : (s.src = n,
            s.async = !0, s.setAttribute("data-feature-source", n), s.setAttribute("data-lazy-source", n)),
            s.onload = function() {
                s.setAttribute("data-feature-loaded", "true"), r || s.setAttribute("data-loaded", "true"),
                e();
            }, s.onerror = function() {
                s.remove(), delete t[a], o(new Error("Unable to load " + n));
            }, (r ? document.head : document.body).appendChild(s);
        })), t[a]) : Promise.resolve();
    }
    function load(e) {
        return loadAsset(e, !1);
    }
    function loadStyle(e) {
        return loadAsset(e, !0);
    }
    function series(e, t) {
        return e.reduce(function(e, r) {
            return e.then(function() {
                return t(r);
            });
        }, Promise.resolve());
    }
    function setState(e, t, r) {
        e.setAttribute("data-feature-state", t), e.setAttribute("aria-busy", r ? "true" : "false");
    }
    function hydrate(e) {
        if (!e) return Promise.resolve(!1);
        if ("ready" === e.getAttribute("data-feature-state")) return Promise.resolve(!0);
        if (e._featureHydration) return e._featureHydration;
        var t = e.querySelector("[data-feature-retry]");
        t && t.remove();
        var r = listFor(e, "data-feature-styles"), n = listFor(e, "data-feature-scripts");
        return setState(e, "loading", !0), e._featureHydration = series(r, loadStyle).then(function() {
            return series(n, load);
        }).then(function() {
            return setState(e, "ready", !1), e.dispatchEvent(new CustomEvent("wwam:feature-ready", {
                bubbles: !0,
                detail: {
                    styles: r,
                    scripts: n
                }
            })), !0;
        }).catch(function(r) {
            setState(e, "failed", !1), e._featureHydration = null;
            var n = r && r.message ? r.message : String(r);
            return (t = document.createElement("button")).type = "button", t.className = "feature-retry",
            t.textContent = "FEATURE HELD // RETRY LOAD", t.setAttribute("data-feature-retry", ""),
            t.setAttribute("aria-label", "Feature load failed. Retry. " + n), t.onclick = function() {
                hydrate(e);
            }, e.prepend(t), e.dispatchEvent(new CustomEvent("wwam:feature-error", {
                bubbles: !0,
                detail: {
                    message: n
                }
            })), !1;
        }), e._featureHydration;
    }
    function prepare(t) {
        var trigger = function() {
            hydrate(t);
        };
        t.dataset.featureActivate && t.addEventListener("click", function() {
            hydrate(t).then(function(e) {
                e && t.dispatchEvent(new CustomEvent("wwam:feature-activate"));
            });
        });
        if (t.addEventListener("focusin", trigger, {
            once: !0
        }), t.addEventListener("pointerdown", trigger, {
            once: !0
        }), Array.prototype.forEach.call(document.querySelectorAll('a[href="#' + t.id + '"]'), function(e) {
            e.addEventListener("click", trigger, {
                once: !0
            });
        }), location.hash !== "#" + t.id) if ("IntersectionObserver" in e) {
            var r = new IntersectionObserver(function(e) {
                e.some(function(e) {
                    return e.isIntersecting;
                }) && (r.disconnect(), trigger());
            }, {
                rootMargin: "900px 0px"
            });
            r.observe(t);
        } else {
            var check = function() {
                var e = t.getBoundingClientRect();
                e.top <= innerHeight + 900 && e.bottom >= -900 && (removeEventListener("scroll", check),
                trigger());
            };
            addEventListener("scroll", check, {
                passive: !0
            }), check();
        } else trigger();
    }
    function init() {
        Array.prototype.forEach.call(document.querySelectorAll("[data-feature-scripts]"), prepare);
    }
    e.WWAMFeatureLoader = Object.freeze({
        load: load,
        loadStyle: loadStyle,
        hydrate: hydrate,
        init: init
    }), "loading" === document.readyState ? document.addEventListener("DOMContentLoaded", init, {
        once: !0
    }) : init();
}("undefined" != typeof window ? window : globalThis);
