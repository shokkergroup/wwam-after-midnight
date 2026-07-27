(function () {
  "use strict";

  var journeyByTarget = {
    top: "home", livewire: "shows", companion: "shows", popular25: "shows", archive: "shows",
    yearCanonSpotlight: "shows", "time-capsules": "shows", franchises: "watchalongs", autopsies: "watchalongs",
    "halloween-universe": "watchalongs", "comedy-vault": "watchalongs",
    characters: "characters", lore: "characters", loreDossier: "characters", ask: "ask", red100: "highlights",
    upinya: "highlights", "night-shift": "highlights", trivia: "highlights", memory: "studio",
    "verdict-room": "studio", "fresh-intake": "studio", labs: "studio", control: "studio",
    "clip-lab": "studio", "cut-test": "studio", canon: "studio", pitch: "studio"
  };

  var groupSelectors = {
    home: [".hero", "#proof", ".scope-strip", ".guided-home"],
    shows: ["#companion", "#livewire", "#popular25", "#archive", "#yearCanonSpotlight", ".archive-browser", "#time-capsules"],
    watchalongs: ["#halloween-universe", "#comedy-vault", "#franchises", "#autopsies"],
    characters: ["#characters", ".character-terminal", "#lore", "#loreDossier"],
    ask: ["#ask"],
    highlights: ["#red100", "#upinya", "#night-shift", "#trivia"],
    studio: ["#fresh-intake", ".intake-output", "#memory", "#verdict-room", "#labs", "#control", "#clip-lab", "#cut-test", "#canon", ".method", "#pitch"]
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

  function buildGuidedHome() {
    if (document.querySelector(".guided-home")) return;
    var host = document.createElement("section");
    host.className = "guided-home";
    host.setAttribute("aria-label", "WWAM archive starting points");
    host.innerHTML =
      '<div class="guided-home-head"><div><span>THREE DOORS. NO HOMEWORK.</span><h2>WHAT DO YOU WANT TO DO?</h2></div><p>The machinery is still here. The front door now gets you to a show, a movie, or a running bit before asking you to learn the archive.</p></div>' +
      '<div class="guided-door-grid">' +
        '<a class="guided-door guided-door-new" href="?source=LV2rmwEA0w4&section=wiki#archive"><span>01 // CATCH UP</span><h3>OPEN THE NEWEST SHOW</h3><p>Recap July 23, jump to Avengers, Clayface, Spider-Man or Hellraiser, then play the source at the exact moment.</p><b>ENTER THE SHOW WIKI →</b></a>' +
        '<a class="guided-door guided-door-movie" href="?source=28PfRNKoSCA&section=wiki#archive"><span>02 // WATCHALONG</span><h3>HALLOWEEN 4, DEEPER</h3><p>WWAM commentary plus the film ledger: budget, box office, production context, public-domain art and cited receipts.</p><b>OPEN THE MOVIE PAGE →</b></a>' +
        '<a class="guided-door guided-door-lore" href="#characters" data-journey-link="characters"><span>03 // RUNNING BITS</span><h3>FOLLOW THE CHARACTERS</h3><p>Dr. Loomis, Dr. Challis, Slenderman and Corey Feldman—performances, source clips and evidence-bounded character answers.</p><b>ENTER THE LORE →</b></a>' +
      '</div>' +
      '<div class="guided-shelf-head"><div><span class="guided-section-label">LIVE WIRE // LAST FIVE</span><h2>THE NEW STUFF, ALREADY MAPPED.</h2></div><a href="#archive" data-journey-link="shows">SEE EVERY SHOW →</a></div>' +
      '<div class="guided-latest-grid">' +
        recentCard("LV2rmwEA0w4", "JUL 23, 2026", "MOVIE NEWS + MORE", "Batman, Marvel and Hellraiser lead the map. Four sourced context doors connect the show to the exact trailers and games under discussion.", "AVENGERS • CLAYFACE • SPIDER-MAN • HELLRAISER", "4 CONTEXT DOORS") +
        recentCard("iz0WFhe6LYM", "JUL 16, 2026", "MOVIE NEWS + MORE", "The Batman Part II, A Nightmare on Elm Street, Crystal Lake and Halloween get a source-linked companion trail.", "BATMAN • ANOES • CRYSTAL LAKE • HALLOWEEN", "5 CONTEXT DOORS") +
        recentCard("ag3axSC9BpU", "JUL 9, 2026", "MOVIE NEWS + MORE", "Legend of the White Dragon, Soulm8te, Dune and Evil Dead become playable topic chapters instead of a three-hour wall.", "DUNE • SOULM8TE • EVIL DEAD • HALLOWEEN", "5 CONTEXT DOORS") +
        recentCard("x6tvsGRHgU0", "JUN 30, 2026", "HORROR BOX OFFICE TIER LIST", "A playable registered source with a visible trust gap: YouTube exposes no usable English captions, so the archive refuses to invent the discussion.", "CAPTION-LIMITED SOURCE", "NO FAKE SUMMARY") +
        recentCard("7PzSj-oIRjA", "JUN 25, 2026", "MOVIE NEWS + MORE", "Spider-Man, Halloween, Evil Dead and Batman are split into sourced doors, with rumor status shown before the reader clicks.", "SPIDER-MAN • HALLOWEEN • BATMAN", "5 CONTEXT DOORS") +
      '</div>' +
      '<div class="guided-shelf-head guided-franchise-head"><div><span class="guided-section-label">THE WATCHALONG VAULT // 39 SHOW WIKIS</span><h2>PICK YOUR NIGHTMARE.</h2></div><a href="#franchises" data-journey-link="watchalongs">OPEN THE FULL VAULT →</a></div>' +
      '<div class="guided-franchise-grid">' +
        '<a href="?source=6VXSBDZ-3WE&section=wiki#archive" style="--franchise-img:url(https://i.ytimg.com/vi/6VXSBDZ-3WE/maxresdefault.jpg)"><span>13 COMMENTARIES</span><h3>HALLOWEEN</h3><b>START IN 1978 →</b></a>' +
        '<a href="?source=WkYLphAdlYc&section=wiki#archive" style="--franchise-img:url(https://i.ytimg.com/vi/WkYLphAdlYc/maxresdefault.jpg)"><span>12 COMMENTARIES</span><h3>FRIDAY THE 13TH</h3><b>GO TO CAMP →</b></a>' +
        '<a href="?source=2G8lpFaeIdw&section=wiki#archive" style="--franchise-img:url(https://i.ytimg.com/vi/2G8lpFaeIdw/maxresdefault.jpg)"><span>6 COMMENTARIES</span><h3>SCREAM</h3><b>PICK UP THE PHONE →</b></a>' +
        '<a href="?source=7qgebnDYVi4&section=wiki#archive" style="--franchise-img:url(https://i.ytimg.com/vi/7qgebnDYVi4/maxresdefault.jpg)"><span>8 COMMENTARIES</span><h3>ELM STREET</h3><b>DON’T FALL ASLEEP →</b></a>' +
      '</div>';
    var hero = document.querySelector("main > .hero");
    if (hero) hero.insertAdjacentElement("afterend", host);
  }

  function assignGroups() {
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
    if (new URLSearchParams(location.search).has("source")) return "shows";
    return journeyByTarget[target] || "home";
  }

  function setJourney(group, targetId) {
    var active = group || "home";
    document.querySelectorAll("main > section").forEach(function (section) {
      section.dataset.guidedHidden = active === "all" || section.dataset.guidedGroup === active ? "false" : "true";
    });
    document.documentElement.classList.add("guided-shell-ready");
    document.body.dataset.guidedJourney = active;
    document.querySelectorAll("[data-journey-link]").forEach(function (link) {
      if (link.closest(".guided-primary-links")) {
        if (link.dataset.journeyLink === active || (active === "highlights" && link.dataset.journeyLink === "home") || (active === "studio" && link.dataset.journeyLink === "home")) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      }
    });
    if (targetId && targetId !== "top") {
      var move = function () {
        var target = document.getElementById(targetId);
        if (target && target.dataset.guidedHidden !== "true") target.scrollIntoView({behavior:"smooth", block:"start"});
      };
      requestAnimationFrame(move);
      window.setTimeout(move, 360);
    }
  }

  function closeMore() {
    var button = document.getElementById("guidedMoreButton");
    var panel = document.getElementById("guidedMorePanel");
    if (!button || !panel) return;
    button.setAttribute("aria-expanded", "false");
    panel.setAttribute("aria-hidden", "true");
    panel.setAttribute("inert", "");
    panel.classList.remove("is-open");
  }

  var guidedMikeIndex = 0;
  var guidedMikeSlides = null;

  function closeGuidedMike() {
    var tour = document.getElementById("pitchTour");
    if (!tour) return;
    tour.classList.remove("show");
    tour.setAttribute("aria-hidden","true");
    document.body.classList.remove("modal-open");
  }

  function runGuidedMikeAction(action) {
    var route = action || {};
    closeGuidedMike();
    if (route.kind === "source" || route.kind === "aftermath") {
      location.assign(location.pathname + "?source=" + encodeURIComponent(route.sourceId || "LV2rmwEA0w4") + "&section=" + encodeURIComponent(route.section || "wiki") + "#archive");
      return;
    }
    var targets = {night:["highlights","night-shift"],archive:["shows","archive"],lore:["characters","lore"],pilot:["studio","pitch"]};
    var target = targets[route.kind] || ["home","top"];
    setJourney(target[0],target[1]);
    var node = document.getElementById(target[1]);
    if (node) node.scrollIntoView({behavior:"smooth",block:"start"});
  }

  function renderGuidedMike() {
    var slides = guidedMikeSlides || [];
    var slide = slides[guidedMikeIndex];
    if (!slide) return;
    document.getElementById("tourBody").innerHTML = '<div class="tour-number">' + slide.number + '</div><div><p>' + slide.eyebrow + '</p><h2>' + slide.title + '</h2><span>' + slide.body + '</span><blockquote>' + slide.proof + '</blockquote><button class="tour-proof-button" data-guided-tour-proof>' + slide.action.label + ' →</button></div>';
    document.getElementById("tourProgress").style.width = ((guidedMikeIndex + 1) / slides.length * 100) + "%";
    document.getElementById("tourCounter").textContent = (guidedMikeIndex + 1) + " / " + slides.length;
    document.getElementById("tourBack").disabled = guidedMikeIndex === 0;
    document.getElementById("tourNext").textContent = guidedMikeIndex === slides.length - 1 ? "COPY DEMO LINK" : "NEXT →";
  }

  function revealGuidedMike() {
    guidedMikeSlides = window.WWAM_PITCH_TOUR || [];
    if (!guidedMikeSlides.length) return;
    guidedMikeIndex = 0;
    renderGuidedMike();
    var tour = document.getElementById("pitchTour");
    tour.classList.add("show");
    tour.setAttribute("aria-hidden","false");
    document.body.classList.add("modal-open");
    var close = document.getElementById("tourClose");
    if (close) close.focus();
  }

  function openGuidedMike() {
    if (window.WWAM_PITCH_TOUR && window.WWAM_PITCH_TOUR.length) { revealGuidedMike(); return; }
    var existing = document.querySelector('script[src*="pitch-tour-data.js"]');
    if (existing) { existing.addEventListener("load",revealGuidedMike,{once:true}); return; }
    var script = document.createElement("script");
    script.src = "pitch-tour-data.js";
    script.onload = revealGuidedMike;
    document.head.appendChild(script);
  }

  function wireNavigation() {
    var latestButton = document.getElementById("latestDossierButton");
    if (latestButton) latestButton.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      location.assign(location.pathname + "?source=LV2rmwEA0w4&section=wiki#archive");
    }, true);
    var button = document.getElementById("guidedMoreButton");
    var panel = document.getElementById("guidedMorePanel");
    if (button && panel) button.addEventListener("click", function () {
      var open = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(open));
      panel.setAttribute("aria-hidden", String(!open));
      if (open) panel.removeAttribute("inert"); else panel.setAttribute("inert", "");
      panel.classList.toggle("is-open", open);
    });
    document.addEventListener("click", function (event) {
      var mikeLauncher = event.target.closest("#mikeButton,#footerPitch,#pitchTourButton");
      var tourControl = event.target.closest("#tourClose,#tourBack,#tourNext,[data-guided-tour-proof]");
      if (mikeLauncher) {
        event.preventDefault(); event.stopImmediatePropagation(); openGuidedMike(); return;
      }
      if (tourControl) {
        event.preventDefault(); event.stopImmediatePropagation();
        if (tourControl.id === "tourClose") closeGuidedMike();
        else if (tourControl.id === "tourBack") { guidedMikeIndex = Math.max(0,guidedMikeIndex-1); renderGuidedMike(); }
        else if (tourControl.id === "tourNext") {
          if (guidedMikeSlides && guidedMikeIndex < guidedMikeSlides.length-1) { guidedMikeIndex += 1; renderGuidedMike(); }
          else if (navigator.clipboard) navigator.clipboard.writeText(location.origin + location.pathname);
        } else if (tourControl.hasAttribute("data-guided-tour-proof")) runGuidedMikeAction(guidedMikeSlides[guidedMikeIndex].action);
        return;
      }
      var link = event.target.closest("[data-journey-link]");
      if (link) {
        setJourney(link.dataset.journeyLink, (link.getAttribute("href") || "#top").split("#")[1] || "top");
        closeMore();
      } else if (panel && panel.classList.contains("is-open") && !event.target.closest("#guidedMorePanel") && !event.target.closest("#guidedMoreButton")) closeMore();
    });
    window.addEventListener("hashchange", function () {
      var target = (location.hash || "#top").slice(1);
      setJourney(journeyFromLocation(), target);
    });
  }

  function boot() {
    buildGuidedHome();
    assignGroups();
    wireNavigation();
    setJourney(journeyFromLocation(), null);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
