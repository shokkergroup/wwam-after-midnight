(function () {
  "use strict";

  var journeyByTarget = {
    top: "home",
    "shows-hub": "shows", livewire: "shows", companion: "shows", popular25: "shows", archive: "shows",
    yearCanonSpotlight: "shows", "archive-browser": "shows", "time-capsules": "shows",
    "watchalongs-hub": "watchalongs", franchises: "watchalongs", autopsies: "watchalongs",
    "halloween-universe": "watchalongs", "comedy-vault": "watchalongs",
    "characters-hub": "characters", characters: "characters", lore: "characters", loreDossier: "characters", memory: "characters",
    "tape-keeps-score": "characters",
    ask: "ask",
    "best-bits": "highlights", red100: "highlights", upinya: "highlights",
    "steves-asshole": "highlights", "night-shift": "highlights", trivia: "highlights",
    "verdict-room": "studio", "fresh-intake": "studio", labs: "studio", control: "studio",
    "clip-lab": "studio", "cut-test": "studio", canon: "studio", pitch: "studio"
  };

  var groupSelectors = {
    home: [".wwam-editorial-hero", ".wwam-pick-your-poison", ".guided-home"],
    shows: ["#shows-hub", "#companion", "#livewire", "#popular25", "#archive", "#yearCanonSpotlight", ".archive-browser", "#time-capsules"],
    watchalongs: ["#watchalongs-hub", "#halloween-universe", "#comedy-vault", "#franchises", "#autopsies"],
    characters: ["#characters-hub", "#characters", "#lore", "#loreDossier", "#memory"],
    ask: ["#ask"],
    highlights: ["#best-bits", "#red100", "#upinya", "#steves-asshole", "#night-shift", "#trivia"],
    studio: ["#fresh-intake", ".intake-output", "#verdict-room", "#labs", "#control", "#clip-lab", "#cut-test", "#canon", ".method", "#pitch", "#proof", ".scope-strip", ".legacy-machine-hero"]
  };

  var primaryViewSelectors = {
    home: [".wwam-editorial-hero", ".wwam-pick-your-poison", ".guided-home"],
    shows: ["#shows-hub", "#livewire", "#archive"],
    watchalongs: ["#watchalongs-hub", "#franchises", "#autopsies"],
    characters: ["#characters-hub", "#characters", "#lore"],
    ask: ["#ask"],
    highlights: ["#best-bits", "#upinya", "#steves-asshole"]
  };

  var routeHubIds = {
    shows: "shows-hub",
    watchalongs: "watchalongs-hub",
    characters: "characters-hub",
    highlights: "best-bits"
  };

  function recentCard(id, date, title, summary, topics, state) {
    return '<article class="guided-show-card">' +
      '<a class="guided-show-image" href="?source=' + id + '&section=wiki#archive" aria-label="Open the ' + date + ' show wiki">' +
        '<img src="https://i.ytimg.com/vi/' + id + '/maxresdefault.jpg" alt="WWAM livestream thumbnail for ' + date + '" loading="lazy">' +
        '<span>' + state + '</span>' +
      '</a>' +
      '<div class="guided-show-copy"><p>' + date + ' // ' + topics + '</p><h3>' + title + '</h3><div>' + summary + '</div>' +
      '<a href="?source=' + id + '&section=wiki#archive">OPEN SHOW WIKI <b>→</b></a></div>' +
    '</article>';
  }

  function tonightStamp() {
    var now = new Date();
    var days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    var months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return days[now.getDay()] + " // " + months[now.getMonth()] + " " + now.getDate();
  }

  function buildGuidedHome() {
    if (document.querySelector(".guided-home")) return;
    var host = document.createElement("section");
    host.className = "guided-home";
    host.setAttribute("aria-label", "More ways to begin exploring WWAM");
    host.innerHTML =
      '<a class="wwam-tonights-cut" href="#night-shift" data-journey-link="highlights" aria-label="Start tonight&rsquo;s Night Shift cut">' +
        '<span class="wwam-tonights-cut-date">TONIGHT&rsquo;S CUT // ' + tonightStamp() + '</span>' +
        '<span class="wwam-tonights-cut-copy"><b>FIVE PLAYABLE STOPS. ONE WEIRD WAY THROUGH WWAM.</b><em>A fresh show opens the door, an old callback follows, and tonight&rsquo;s route stays put until midnight.</em></span>' +
        '<span class="wwam-tonights-cut-action">START THE NIGHT SHIFT <b>&rarr;</b></span>' +
      '</a>' +
      '<div class="guided-shelf-head"><div><span class="guided-section-label">02 // THE LATEST FIVE</span><h2>FIVE NIGHTS. FIVE CLEAN ENTRIES.</h2></div><a href="#shows-hub" data-journey-link="shows">SEE ALL SHOWS &rarr;</a></div>' +
      '<p class="guided-shelf-dek">Each show opens as its own wiki with a recap, topics, best moments, and exact jumps back to the source.</p>' +
      '<div class="guided-latest-grid">' +
        recentCard("LV2rmwEA0w4", "JUL 23, 2026", "MOVIE NEWS + MORE", "Batman, Marvel and Hellraiser lead the night. Jump straight to four of the biggest conversations.", "AVENGERS &bull; CLAYFACE &bull; SPIDER-MAN &bull; HELLRAISER", "4 TOPICS") +
        recentCard("iz0WFhe6LYM", "JUL 16, 2026", "MOVIE NEWS + MORE", "The Batman Part II, A Nightmare on Elm Street, Crystal Lake and Halloween. Pick a topic and skip the dead air.", "BATMAN &bull; ANOES &bull; CRYSTAL LAKE &bull; HALLOWEEN", "5 TOPICS") +
        recentCard("ag3axSC9BpU", "JUL 9, 2026", "MOVIE NEWS + MORE", "Legend of the White Dragon, Soulm8te, Dune and Evil Dead. Search the night or jump straight to a topic.", "DUNE &bull; SOULM8TE &bull; EVIL DEAD &bull; HALLOWEEN", "5 TOPICS") +
        recentCard("x6tvsGRHgU0", "JUN 30, 2026", "HORROR BOX OFFICE TIER LIST", "YouTube did not provide usable English captions for this one, so it stays watch-only for now.", "CAPTION-LIMITED SOURCE", "WATCH-ONLY") +
        recentCard("7PzSj-oIRjA", "JUN 25, 2026", "MOVIE NEWS + MORE", "Spider-Man, Halloween, Evil Dead and Batman. Every topic opens at the part you actually came for.", "SPIDER-MAN &bull; HALLOWEEN &bull; BATMAN", "5 TOPICS") +
      '</div>' +
      '<div class="guided-shelf-head guided-franchise-head"><div><span class="guided-section-label">03 // PICK A FRANCHISE</span><h2>CHOOSE THE MOVIE WORLD.</h2></div><a href="#watchalongs-hub" data-journey-link="watchalongs">ALL WATCHALONGS &rarr;</a></div>' +
      '<div class="guided-franchise-grid">' +
        '<a href="?source=6VXSBDZ-3WE&section=wiki#archive" style="--franchise-img:url(https://i.ytimg.com/vi/6VXSBDZ-3WE/maxresdefault.jpg)"><span>13 COMMENTARIES</span><h3>HALLOWEEN</h3><b>START IN 1978 &rarr;</b></a>' +
        '<a href="?source=WkYLphAdlYc&section=wiki#archive" style="--franchise-img:url(https://i.ytimg.com/vi/WkYLphAdlYc/maxresdefault.jpg)"><span>12 COMMENTARIES</span><h3>FRIDAY THE 13TH</h3><b>GO TO CAMP &rarr;</b></a>' +
        '<a href="?source=2G8lpFaeIdw&section=wiki#archive" style="--franchise-img:url(https://i.ytimg.com/vi/2G8lpFaeIdw/maxresdefault.jpg)"><span>6 COMMENTARIES</span><h3>SCREAM</h3><b>PICK UP THE PHONE &rarr;</b></a>' +
        '<a href="?source=7qgebnDYVi4&section=wiki#archive" style="--franchise-img:url(https://i.ytimg.com/vi/7qgebnDYVi4/maxresdefault.jpg)"><span>8 COMMENTARIES</span><h3>ELM STREET</h3><b>DON&rsquo;T FALL ASLEEP &rarr;</b></a>' +
      '</div>';
    var lead = document.querySelector("main > .wwam-pick-your-poison") || document.querySelector("main > .hero");
    if (lead) lead.insertAdjacentElement("afterend", host);
  }

  function buildRouteHubs() {
    if (document.getElementById("shows-hub")) return;
    var configs = [
      {
        id: "shows-hub", group: "shows", number: "01", eyebrow: "THE LIVESTREAM ARCHIVE",
        title: "PICK A NIGHT.<br><em>OPEN ITS WIKI.</em>",
        copy: "Start with the newest show or search the full archive. Every show file keeps the recap, topics, best moments, and original tape together.",
        links: [
          ["#livewire", "shows", "NEWEST SHOWS", "The latest mapped broadcasts"],
          ["#archive", "shows", "ALL SHOW WIKIS", "Search every indexed night"],
          ["#popular25", "shows", "MOST WATCHED", "The foundational live canon"],
          ["#time-capsules", "shows", "BY YEAR", "Browse the channel by era"],
          ["#companion", "shows", "WATCH WITH A GUIDE", "Follow a long show live"]
        ]
      },
      {
        id: "watchalongs-hub", group: "watchalongs", number: "01", eyebrow: "THE COMMENTARY SHELF",
        title: "PICK A MOVIE.<br><em>ENTER ITS WORLD.</em>",
        copy: "Choose a franchise or a one-off commentary. The movie context, WWAM versions, playable moments, and source record stay in one place.",
        links: [
          ["#franchises", "watchalongs", "ALL COMMENTARIES", "Halloween, Friday, Scream, Elm Street"],
          ["#halloween-universe", "watchalongs", "HALLOWEEN UNIVERSE", "WWAM's deepest franchise map"],
          ["#comedy-vault", "watchalongs", "COMEDY SHELF", "Scary Movie, Waiting, Harold & Kumar"],
          ["#autopsies", "watchalongs", "COMMENTARY WIKIS", "Open the individual movie files"]
        ]
      },
      {
        id: "best-bits", group: "highlights", number: "01", eyebrow: "THE GOOD PARTS",
        title: "SKIP THE SETUP.<br><em>PLAY THE MOMENT.</em>",
        copy: "The funniest lines, the hardest rejections, and the archive's wildest playable moments now live under one obvious roof.",
        links: [
          ["#upinya", "highlights", "WWAM UP IN YA", "The most deranged things said on tape"],
          ["#steves-asshole", "highlights", "STEVE'S ASSHOLE", "Everything Mike and J sent straight to hell"],
          ["#red100", "highlights", "RED BAND 100", "The ranked wall of memorable chaos"],
          ["#night-shift", "highlights", "NIGHT SHIFT", "A guided late-night cut"]
        ]
      },
      {
        id: "characters-hub", group: "characters", number: "01", eyebrow: "THE RECURRING CAST",
        title: "FOLLOW THE BIT.<br><em>HEAR THE REAL TAPE.</em>",
        copy: "Loomis, Challis, Slenderman, and Corey Feldman get one coherent home: fan-made riffs up front, real performance clips directly underneath.",
        links: [
          ["#characters", "characters", "ASK A CHARACTER", "Pick a voice and open its clip shelf"],
          ["#lore", "characters", "LORE GALAXY", "See how the recurring bits connect"],
          ["#memory", "characters", "MEMORY TRAILS", "Follow callbacks across the archive"]
        ]
      }
    ];
    var firstContent = document.querySelector("main > #halloween-universe") || document.querySelector("main > section:nth-of-type(4)");
    configs.forEach(function (config) {
      var section = document.createElement("section");
      section.className = "wwam-route-hub";
      section.id = config.id;
      section.dataset.routeHub = config.group;
      section.innerHTML =
        '<a class="wwam-route-home" href="#top" data-journey-link="home">WWAM AFTER MIDNIGHT / HOME</a>' +
        '<div class="wwam-route-hub-copy"><p>' + config.number + ' // ' + config.eyebrow + '</p><h1>' + config.title + '</h1><span>' + config.copy + '</span></div>' +
        '<nav class="wwam-route-local-nav" aria-label="' + config.eyebrow + ' sections">' +
          config.links.map(function (link) {
            return '<a href="' + link[0] + '" data-journey-link="' + link[1] + '"><b>' + link[2] + '</b><small>' + link[3] + '</small></a>';
          }).join("") +
        '</nav>';
      if (firstContent) firstContent.parentNode.insertBefore(section, firstContent);
    });
  }
  function arrangeFanFirstControls() {
    var askCopy = document.querySelector("#ask .ask-copy");
    var askForm = document.getElementById("askForm");
    var examples = document.getElementById("askExamples");
    if (askCopy && askForm && examples && askForm.parentElement !== askCopy) {
      askCopy.insertBefore(askForm, examples);
    }
    var askInput = document.getElementById("askInput");
    if (askInput) askInput.placeholder = "Which show, movie, bit, or character are you looking for?";
    var emptyAsk = document.querySelector("#askResults .empty-state");
    if (emptyAsk) emptyAsk.textContent = "Try \"What did they think of Halloween Ends?\", \"How many shows mention Batman?\", or \"Show me the funniest Loomis bit.\" If the archive cannot prove it, it will say so.";
    var terminal = document.querySelector("#characters .character-terminal");
    var characterForm = document.getElementById("characterForm");
    var portrait = document.getElementById("characterPortrait");
    if (terminal && characterForm && portrait && characterForm.previousElementSibling === portrait) {
      terminal.insertBefore(characterForm, portrait);
  }
  }


  function tuckEditorTools() {
    var askSection = document.getElementById("ask");
    if (!askSection) return;
    function tuck() {
      var review = askSection.querySelector(".ask-review");
      if (!review) return;
      var results = document.getElementById("askResults");
      var hasAnswer = Boolean(results && results.getAttribute("data-ask-query"));
      var existing = review.closest(".ask-review-disclosure");
      if (existing) {
        existing.hidden = !hasAnswer;
        return;
      }
      var disclosure = document.createElement("details");
      disclosure.className = "ask-review-disclosure";
      disclosure.hidden = !hasAnswer;
      var summary = document.createElement("summary");
      summary.textContent = "REPORT A WRONG ANSWER";
      review.parentNode.insertBefore(disclosure, review);
      disclosure.appendChild(summary);
      disclosure.appendChild(review);
    }
    tuck();
    if (!askSection.__wwamEditorObserver && typeof MutationObserver === "function") {
      askSection.__wwamEditorObserver = new MutationObserver(tuck);
      askSection.__wwamEditorObserver.observe(askSection, { childList: true, subtree: true });
    }
  }

  function assignGroups() {
    var archiveBrowser = document.querySelector(".archive-browser");
    if (archiveBrowser && !archiveBrowser.id) archiveBrowser.id = "archive-browser";
    var sections = Array.prototype.slice.call(document.querySelectorAll("main > section"));
    sections.forEach(function (section) { section.dataset.guidedGroup = "all"; });
    Object.keys(groupSelectors).forEach(function (group) {
      groupSelectors[group].forEach(function (selector) {
        document.querySelectorAll(selector).forEach(function (section) {
          if (section.parentElement && section.parentElement.tagName === "MAIN") section.dataset.guidedGroup = group;
        });
      });
    });
  }

  function journeyFromLocation() {
    var target = (location.hash || "#top").slice(1);
    var sourceId = new URLSearchParams(location.search).get("source");
    if (sourceId) {
      var catalog = Array.isArray(window.WWAM_CATALOG) ? window.WWAM_CATALOG : [];
      return catalog.some(function (item) { return item && item.id === sourceId; }) ? "watchalongs" : "shows";
    }
    return journeyByTarget[target] || "home";
  }

  function routeScrollTop(target) {
    if (!target || target.id === "top") return 0;
    var header = document.querySelector(".wwam-site-header");
    var headerBottom = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
    var currentTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    return Math.max(0, Math.round(
      currentTop + target.getBoundingClientRect().top - headerBottom - 16
    ));
  }

  function moveRouteTarget(target, behavior) {
    if (!target || target.dataset.guidedHidden === "true") return;
    var root = document.documentElement;
    var previousScrollBehavior = root.style.scrollBehavior;
    if (behavior !== "smooth") root.style.scrollBehavior = "auto";
    window.scrollTo({
      top: routeScrollTop(target),
      left: 0,
      behavior: behavior === "smooth" ? "smooth" : "auto"
    });
    root.style.scrollBehavior = previousScrollBehavior;
  }

  function focusRouteTarget(target) {
    if (!target || typeof target.focus !== "function") return;
    if (!target.hasAttribute("tabindex")) {
      target.setAttribute("tabindex", "-1");
      target.setAttribute("data-route-focus-target", "");
    }
    try { target.focus({ preventScroll: true }); }
    catch (error) { target.focus(); }
  }

  function sectionsForView(active, targetId) {
    var allowed = new Set();

    function addSelector(selector) {
      document.querySelectorAll(selector).forEach(function (node) {
        var section = node.matches && node.matches("main > section") ? node : node.closest && node.closest("main > section");
        if (section) allowed.add(section);
      });
    }

    function addPrimary(group) {
      (primaryViewSelectors[group] || []).forEach(addSelector);
    }

    if (active === "all") {
      document.querySelectorAll("main > section").forEach(function (section) { allowed.add(section); });
      return allowed;
    }

    if (active === "home" || active === "ask") {
      addPrimary(active);
      return allowed;
    }

    var hubId = routeHubIds[active];
    if (hubId) addSelector("#" + hubId);

    var target = targetId ? document.getElementById(targetId) : null;
    var targetSection = target && target.closest ? target.closest("main > section") : null;
    var isRouteHome = !targetId || targetId === hubId;
    var isMatchingDetail = targetSection && targetSection.dataset.guidedGroup === active && targetSection.id !== hubId;

    if (isRouteHome || !isMatchingDetail) addPrimary(active);
    else allowed.add(targetSection);

    if (!allowed.size && targetSection) allowed.add(targetSection);
    return allowed;
  }
  function setJourney(group, targetId, options) {
    var active = group || "home";
    var routeOptions = options || {};
    var visibleSections = sectionsForView(active, targetId);
    document.querySelectorAll("main > section").forEach(function (section) {
      section.dataset.guidedHidden = visibleSections.has(section) ? "false" : "true";
    });
    document.documentElement.classList.add("guided-shell-ready");
    document.body.dataset.guidedJourney = active;
    document.body.dataset.guidedTarget = targetId || "top";
    document.body.dataset.guidedDetail = Boolean(routeHubIds[active] && targetId !== routeHubIds[active]) ? "true" : "false";
    document.querySelectorAll("[data-journey-link]").forEach(function (link) {
      if (link.closest(".guided-primary-links")) {
        if (link.dataset.journeyLink === active) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      }
    });
    document.querySelectorAll(".wwam-route-local-nav a").forEach(function (link) {
      if ((link.getAttribute("href") || "") === "#" + targetId) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    document.dispatchEvent(new CustomEvent("wwam:journey-change", {
      detail: { group: active, targetId: targetId || "top" }
    }));
    if (targetId) {
      var move = function (behavior) {
        var target = document.getElementById(targetId);
        moveRouteTarget(target, behavior);
      };
      var target = document.getElementById(targetId);
      var targetSection = target && target.closest ? target.closest("main > section") : null;
      var sections = Array.prototype.slice.call(document.querySelectorAll("main > section"));
      var targetIndex = targetSection ? sections.indexOf(targetSection) : -1;
      var visibleBeforeTarget = targetIndex < 0 ? [] : sections.slice(0, targetIndex).filter(function (section) {
        return section.dataset.guidedHidden !== "true";
      });
      var blockers = targetIndex < 0 ? [] : sections.slice(0, targetIndex + 1).filter(function (section) {
        return section.dataset.guidedHidden !== "true" && section.hasAttribute("data-feature-scripts");
      });
      requestAnimationFrame(function () {
        move(routeOptions.behavior === "auto" ? "auto" : "smooth");
        if (routeOptions.focus) focusRouteTarget(target);
      });
      window.setTimeout(function () { move("auto"); }, 360);
      if (typeof window.__wwamReleaseRoutePin === "function") {
        window.__wwamReleaseRoutePin();
      }
      if (window.__wwamRoutePinTimer) window.clearInterval(window.__wwamRoutePinTimer);
      if (window.__wwamRouteResizeObserver) {
        window.__wwamRouteResizeObserver.disconnect();
        window.__wwamRouteResizeObserver = null;
      }
      var routePinActive = true;
      var releaseRoutePin;
      var releaseRoutePinFromKeyboard = function (event) {
        if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].indexOf(event.key) >= 0) {
          releaseRoutePin();
        }
      };
      releaseRoutePin = function () {
        if (!routePinActive) return;
        routePinActive = false;
        if (window.__wwamRoutePinTimer) window.clearInterval(window.__wwamRoutePinTimer);
        window.__wwamRoutePinTimer = null;
        if (window.__wwamRouteResizeObserver) {
          window.__wwamRouteResizeObserver.disconnect();
          window.__wwamRouteResizeObserver = null;
        }
        window.removeEventListener("wheel", releaseRoutePin);
        window.removeEventListener("touchstart", releaseRoutePin);
        window.removeEventListener("pointerdown", releaseRoutePin);
        window.removeEventListener("keydown", releaseRoutePinFromKeyboard);
        if (window.__wwamReleaseRoutePin === releaseRoutePin) {
          window.__wwamReleaseRoutePin = null;
        }
      };
      window.__wwamReleaseRoutePin = releaseRoutePin;
      window.__wwamRoutePinTimer = window.setInterval(function () {
        if (routePinActive) move("auto");
      }, 180);
      window.addEventListener("wheel", releaseRoutePin, { passive: true });
      window.addEventListener("touchstart", releaseRoutePin, { passive: true });
      window.addEventListener("pointerdown", releaseRoutePin, { passive: true });
      window.addEventListener("keydown", releaseRoutePinFromKeyboard);
      window.setTimeout(function () {
        if (!routePinActive) return;
        move("auto");
        releaseRoutePin();
      }, 5000);
      if (typeof ResizeObserver === "function" && visibleBeforeTarget.length) {
        var routeObserver = new ResizeObserver(function () {
          if (!routePinActive) return;
          requestAnimationFrame(function () {
            if (routePinActive) move("auto");
          });
        });
        visibleBeforeTarget.forEach(function (section) { routeObserver.observe(section); });
        window.__wwamRouteResizeObserver = routeObserver;
        window.setTimeout(function () {
          if (!routePinActive) return;
          if (window.__wwamRouteResizeObserver === routeObserver) {
            routeObserver.disconnect();
            window.__wwamRouteResizeObserver = null;
            move("auto");
          }
        }, 4800);
      } else {
        window.setTimeout(function () {
          if (routePinActive) move("auto");
        }, 1800);
      }
      if (window.WWAMFeatureLoader && blockers.length) {
        Promise.all(blockers.map(function (section) {
          return window.WWAMFeatureLoader.hydrate(section);
        })).then(function () {
          if (!routePinActive) return;
          requestAnimationFrame(function () {
            if (routePinActive) move("auto");
          });
          window.setTimeout(function () {
            if (routePinActive) move("auto");
          }, 120);
        });
      }
    }
  }

  function wireHomeSearch() {
    var form = document.getElementById("wwamHomeSearch");
    var input = document.getElementById("wwamHomeSearchInput");
    if (!form || !input) return;
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var query = input.value.trim();
      history.pushState(null, "", location.pathname + "#ask");
      setJourney("ask", "ask", { behavior: "smooth", focus: true });
      window.setTimeout(function () {
        var askInput = document.getElementById("askInput");
        var askForm = document.getElementById("askForm");
        if (!askInput) return;
        askInput.value = query;
        askInput.focus();
        if (query && askForm) {
          if (typeof askForm.requestSubmit === "function") askForm.requestSubmit();
          else askForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        }
      }, 120);
    });
  }
  function wireNavigation() {
    var latestButton = document.getElementById("latestDossierButton");
    if (latestButton) latestButton.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      location.assign(location.pathname + "?source=LV2rmwEA0w4&section=wiki#archive");
    }, true);

    document.addEventListener("click", function (event) {
      var link = event.target.closest("[data-journey-link]");
      if (link) {
        var href = link.getAttribute("href") || "#top";
        var targetId = href.split("#")[1] || "top";
        if (href.charAt(0) === "#") {
          event.preventDefault();
          if (location.hash !== href || location.search) history.pushState(null, "", location.pathname + href);
        }
        setJourney(link.dataset.journeyLink, targetId, { behavior: "smooth", focus: true });
      }
    });

    window.addEventListener("hashchange", function () {
      var target = (location.hash || "#top").slice(1);
      setJourney(journeyFromLocation(), target, { behavior: "auto" });
    });
  }

  function boot() {
    buildGuidedHome();
    buildRouteHubs();
    assignGroups();
    arrangeFanFirstControls();
    tuckEditorTools();
    wireHomeSearch();
    wireNavigation();
    var initialTarget = (location.hash || "#top").slice(1);
    setJourney(journeyFromLocation(), initialTarget, { behavior: "auto" });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
