(function (root) {
  "use strict";
  var doc = root.document;
  var mount = doc && doc.getElementById("livestreamCanonMount");
  if (!mount) return;

  function text(node, fallback) {
    return node && String(node.textContent || "").trim() || fallback || "";
  }

  function addAnchors() {
    Array.prototype.forEach.call(mount.querySelectorAll(".lvc-audio-pass"), function (pass) {
      if (pass.querySelector(".lvc-listening-anchors") || !pass.querySelector(".lvc-audio-candidates > a")) return;
      var allCandidates = Array.prototype.slice.call(pass.querySelectorAll(".lvc-audio-candidates > a"));
      var priority = ["STRAIGHT TO STEVE'S ASSHOLE", "WWAM UP IN YA", "CHARACTER SIGNAL", "FAN SIGNAL", "ROOM BREAK", "TAKE GETS NUCLEAR"];
      var candidates = [];
      priority.forEach(function (category) {
        if (candidates.length >= 3) return;
        var match = allCandidates.filter(function (source) { return candidates.indexOf(source) < 0 && text(source.querySelector("header b"), "").indexOf(category) >= 0; })[0];
        if (match) candidates.push(match);
      });
      allCandidates.forEach(function (source) { if (candidates.length < 3 && candidates.indexOf(source) < 0) candidates.push(source); });
      var shelf = doc.createElement("section");
      shelf.className = "lvc-listening-anchors";
      shelf.setAttribute("aria-label", "First listening anchors");
      var label = doc.createElement("span");
      label.textContent = "FIRST LISTENING ANCHORS // SOURCE-LOCAL SHORTCUTS";
      shelf.appendChild(label);
      candidates.forEach(function (source) {
        var link = doc.createElement("a");
        link.href = source.getAttribute("href") || "#";
        link.removeAttribute("target");
        link.removeAttribute("rel");
        var heading = doc.createElement("b");
        heading.textContent = text(source.querySelector("header b"), "SOURCE RECEIPT");
        var clock = doc.createElement("small");
        clock.textContent = text(source.querySelector("header span"), "OPEN AT TAPE");
        var excerpt = doc.createElement("p");
        excerpt.textContent = text(source.querySelector("p"), "Open this bounded route and listen.");
        link.appendChild(heading);
        link.appendChild(clock);
        link.appendChild(excerpt);
        shelf.appendChild(link);
      });
      var foot = pass.querySelector(".lvc-audio-pass-foot");
      pass.insertBefore(shelf, foot || null);
    });
  }

  addAnchors();
  if (root.MutationObserver) new root.MutationObserver(addAnchors).observe(mount, { childList: true, subtree: true });
})(typeof window !== "undefined" ? window : globalThis);
