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

  function shortcutRank(link) {
    var href = link.getAttribute("href") || "";
    if (href === "#sourceDossierPlayerSection") return 0;
    if (href === "#sourceDossierShowWikiSummary") return 1;
    if (href.indexOf("sourceDossierShowWikiLane-best-moments") >= 0) return 2;
    if (href.indexOf("sourceDossierShowWikiLane-up-in-ya") >= 0 ||
        href === "#sourceDossierFeldmanDamage-wildest-detour") return 3;
    if (href.indexOf("sourceDossierShowWikiLane-straight-to-steves-asshole") >= 0 ||
        href === "#sourceDossierFeldmanDamage-hated") return 4;
    if (href === "#sourceDossierAsk") return 5;
    if (href === "#sourceDossierFanRead") return 6;
    if (href === "#sourceDossierEpisodeGuide") return 7;
    return 20;
  }

  function enhance(nav) {
    if (!nav) return;
    var host = nav.querySelector(":scope > div") || nav;
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
    var signature = links.map(function (link) {
      return link.getAttribute("href") || "";
    }).sort().join("|");
    if (nav.dataset.editorialSignature === signature) return;
    nav.dataset.editorialSignature = signature;
    if (links.length < 4) return;
    nav.dataset.editorialNav = "true";
    nav.setAttribute("aria-label", "Show Wiki shortcuts");

    links.forEach(function (link) {
      link.classList.remove("wwam-dossier-primary-link");
      link.classList.remove("wwam-dossier-secondary-link");
    });
    links.forEach(function (link) {
      if (isPrimary(link)) {
        relabel(link);
        link.classList.add("wwam-dossier-primary-link");
      } else {
        link.classList.add("wwam-dossier-secondary-link");
      }
    });
    links.map(function (link, index) {
      return { link: link, index: index, rank: shortcutRank(link) };
    }).sort(function (left, right) {
      return left.rank - right.rank || left.index - right.index;
    }).forEach(function (entry) {
      host.appendChild(entry.link);
    });
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
