(function () {
  "use strict";

  function isPrimary(link) {
    var href = link.getAttribute("href") || "";
    return href === "#sourceDossierPlayerSection" ||
      href === "#sourceDossierFanRead" ||
      href === "#sourceDossierEpisodeGuide" ||
      href === "#sourceDossierShowWikiSummary" ||
      href.indexOf("sourceDossierShowWikiLane-best-moments") >= 0 ||
      href === "#sourceDossierAsk";
  }

  function relabel(link) {
    var href = link.getAttribute("href") || "";
    if (href === "#sourceDossierPlayerSection") link.textContent = "PLAY THE SHOW";
    if (href === "#sourceDossierFanRead") link.textContent = "FAN READ";
    if (href === "#sourceDossierEpisodeGuide") link.textContent = "DEEP DIVE";
    if (href === "#sourceDossierAsk") link.textContent = "ASK THIS SHOW";
  }

  function enhance(nav) {
    if (!nav) return;
    var host = nav.querySelector(":scope > div") || nav;
    var signature = Array.prototype.slice.call(host.querySelectorAll('a[href]')).map(function (link) {
      return link.getAttribute("href") || "";
    }).sort().join("|");
    if (nav.dataset.editorialSignature === signature) return;
    nav.dataset.editorialSignature = signature;
    var existing = host.querySelector(":scope > .wwam-dossier-more");
    if (existing) {
      var existingTray = existing.querySelector(":scope > .wwam-dossier-more-tray");
      if (existingTray) {
        Array.prototype.slice.call(existingTray.querySelectorAll(":scope > a"))
          .forEach(function (link) { host.insertBefore(link, existing); });
      }
      existing.remove();
    }
    var links = Array.prototype.slice.call(host.querySelectorAll(":scope > a"));
    if (links.length < 4) return;
    nav.dataset.editorialNav = "true";
    nav.setAttribute("aria-label", "Show Wiki shortcuts");

    links.forEach(function (link) {
      link.classList.remove("wwam-dossier-primary-link");
    });
    links.filter(isPrimary).forEach(function (link) {
      relabel(link);
      link.classList.add("wwam-dossier-primary-link");
    });

    var secondary = links.filter(function (link) { return !isPrimary(link); });
    if (!secondary.length) return;
    var details = document.createElement("details");
    details.className = "wwam-dossier-more";
    var summary = document.createElement("summary");
    summary.textContent = "EXPLORE ALL";
    var tray = document.createElement("div");
    tray.className = "wwam-dossier-more-tray";
    secondary.forEach(function (link) { tray.appendChild(link); });
    details.appendChild(summary);
    details.appendChild(tray);
    host.appendChild(details);
  }

  function scan(root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(".source-dossier-explore").forEach(enhance);
    if (scope.matches && scope.matches(".source-dossier-explore")) enhance(scope);
    if (scope.closest) enhance(scope.closest(".source-dossier-explore"));
  }

  function boot() {
    scan(document);
    var host = document.getElementById("modalContent") || document.body;
    new MutationObserver(function (records) {
      records.forEach(function (record) {
        Array.prototype.forEach.call(record.addedNodes, function (node) {
          if (node.nodeType === 1) scan(node);
        });
      });
    }).observe(host, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
