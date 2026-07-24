(function (root) {
  "use strict";

  var pending = Object.create(null);

  function clean(value) {
    return String(value == null ? "" : value).trim();
  }

  function findScript(source) {
    return Array.prototype.find.call(document.scripts, function (script) {
      return clean(script.getAttribute("src")).split("?")[0] === source;
    });
  }

  function load(source) {
    var src = clean(source);
    if (!src) return Promise.resolve();
    if (pending[src]) return pending[src];
    pending[src] = new Promise(function (resolve, reject) {
      var existing = findScript(src);
      if (existing) {
        if (existing.getAttribute("data-feature-loaded") === "true" ||
            existing.getAttribute("data-loaded") === "true" ||
            existing.readyState === "complete" ||
            (!existing.getAttribute("data-feature-source") &&
              !existing.getAttribute("data-lazy-source"))) {
          resolve();
          return;
        }
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }
      var script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.setAttribute("data-feature-source", src);
      script.setAttribute("data-lazy-source", src);
      script.onload = function () {
        script.setAttribute("data-feature-loaded", "true");
        script.setAttribute("data-loaded", "true");
        resolve();
      };
      script.onerror = function () {
        script.remove();
        delete pending[src];
        reject(new Error("Unable to load " + src));
      };
      document.body.appendChild(script);
    });
    return pending[src];
  }

  function scriptsFor(section) {
    return clean(section && section.getAttribute("data-feature-scripts"))
      .split(",")
      .map(clean)
      .filter(Boolean);
  }

  function hydrate(section) {
    if (!section) return Promise.resolve(false);
    if (section.getAttribute("data-feature-state") === "ready") {
      return Promise.resolve(true);
    }
    if (section._featureHydration) return section._featureHydration;
    var oldRetry = section.querySelector("[data-feature-retry]");
    if (oldRetry) oldRetry.remove();
    section.setAttribute("data-feature-state", "loading");
    section.setAttribute("aria-busy", "true");
    section._featureHydration = scriptsFor(section)
      .reduce(function (chain, source) {
        return chain.then(function () {
          return load(source);
        });
      }, Promise.resolve())
      .then(function () {
        section.setAttribute("data-feature-state", "ready");
        section.setAttribute("aria-busy", "false");
        section.dispatchEvent(new CustomEvent("wwam:feature-ready", {
          bubbles: true,
          detail: { scripts: scriptsFor(section) }
        }));
        return true;
      })
      .catch(function (error) {
        section.setAttribute("data-feature-state", "failed");
        section.setAttribute("aria-busy", "false");
        section._featureHydration = null;
        var retry = document.createElement("button");
        retry.type = "button";
        retry.className = "feature-retry";
        retry.textContent = "FEATURE HELD // RETRY LOAD";
        retry.setAttribute("data-feature-retry", "");
        retry.setAttribute(
          "aria-label",
          "Feature load failed. Retry. " +
            (error && error.message ? error.message : String(error))
        );
        retry.onclick = function () { hydrate(section); };
        section.prepend(retry);
        section.dispatchEvent(new CustomEvent("wwam:feature-error", {
          bubbles: true,
          detail: { message: error && error.message ? error.message : String(error) }
        }));
        return false;
      });
    return section._featureHydration;
  }

  function prepare(section) {
    var trigger = function () {
      hydrate(section);
    };
    section.addEventListener("focusin", trigger, { once: true });
    section.addEventListener("pointerdown", trigger, { once: true });
    Array.prototype.forEach.call(
      document.querySelectorAll('a[href="#' + section.id + '"]'),
      function (link) {
        link.addEventListener("click", trigger, { once: true });
      }
    );
    if (location.hash === "#" + section.id) {
      trigger();
      return;
    }
    if ("IntersectionObserver" in root) {
      var observer = new IntersectionObserver(function (entries) {
        if (entries.some(function (entry) { return entry.isIntersecting; })) {
          observer.disconnect();
          trigger();
        }
      }, { rootMargin: "900px 0px" });
      observer.observe(section);
      return;
    }
    var check = function () {
      var rect = section.getBoundingClientRect();
      if (rect.top <= innerHeight + 900 && rect.bottom >= -900) {
        removeEventListener("scroll", check);
        trigger();
      }
    };
    addEventListener("scroll", check, { passive: true });
    check();
  }

  function init() {
    Array.prototype.forEach.call(
      document.querySelectorAll("[data-feature-scripts]"),
      prepare
    );
  }

  root.WWAMFeatureLoader = Object.freeze({
    load: load,
    hydrate: hydrate,
    init: init
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : globalThis);
