(function (root) {
  "use strict";

  var index = root.WWAM_FAM_INDEX;
  var section = root.document && root.document.getElementById("fam-hall");
  var mount = root.document && root.document.getElementById("famHallMount");
  if (!index || !section || !mount) return;

  var state = { query: "", tier: "ALL" };

  function clean(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function number(value) {
    return Number(value || 0).toLocaleString("en-US");
  }

  function money(value) {
    return Number(value || 0).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    });
  }

  function clock(value) {
    var total = Math.max(0, Math.floor(Number(value) || 0));
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var seconds = total % 60;
    return (hours ? hours + ":" + String(minutes).padStart(2, "0") + ":" :
      minutes + ":") + String(seconds).padStart(2, "0");
  }

  function date(value) {
    var parts = clean(value).split("-");
    if (parts.length !== 3) return clean(value);
    return parts[1] + "." + parts[2] + "." + parts[0];
  }

  function initials(name) {
    return clean(name).replace(/["']/g, "").split(/\s+/).filter(function (word) {
      return !/^the$/i.test(word);
    }).slice(0, 2).map(function (word) {
      return word.charAt(0).toUpperCase();
    }).join("");
  }

  function showLink(receipt, label) {
    return '<a class="fam-receipt-link" href="?source=' +
      encodeURIComponent(receipt.sourceId) + "&at=" +
      encodeURIComponent(receipt.at) + '&section=wiki#archive"><span>' +
      esc(clean(receipt.interactionType) || "ROOM READ") + "</span><b>" +
      esc(label || receipt.title) + "</b><small>" + esc(date(receipt.date)) +
      " // " + esc(clock(receipt.at)) + " &rarr;</small></a>";
  }

  function sampleMarkup(member) {
    var sample = member.verifiedReplaySample;
    if (!sample) return "";
    return '<aside class="fam-sample-proof"><span>' + esc(sample.label) +
      ' // NOT A LIFETIME TOTAL</span><div><b>' + esc(sample.showsPresent) +
      "/" + esc(sample.totalSampleShows) + "</b><small>SHOWS PRESENT</small></div>" +
      '<div><b>' + esc(sample.paidMessages) +
      "</b><small>PAID MESSAGES</small></div><div><b>" +
      esc(money(sample.paidUsd)) +
      "</b><small>VERIFIED SAMPLE</small></div><p>" +
      esc(sample.boundary) + "</p></aside>";
  }

  function featuredMember(member, className) {
    if (!member) return "";
    var receipts = (member.featuredReceipts || []).slice(0, 3);
    return '<article class="fam-featured ' + esc(className || "") +
      '"><header><div class="fam-monogram" aria-hidden="true">' +
      esc(initials(member.displayName)) + "</div><div><span>" +
      esc(member.publicHandle || member.tier) + "</span><h3>" +
      esc(member.displayName) + "</h3><b>" + esc(member.honor) +
      "</b></div></header><p>" + esc(member.tagline) +
      '</p><div class="fam-featured-stats"><div><b>' +
      esc(number(member.observedShows)) +
      "</b><span>CAPTION-INDEX SHOWS</span></div><div><b>" +
      esc(number(member.observedReadouts)) +
      "</b><span>PLAYABLE READOUTS</span></div></div>" +
      sampleMarkup(member) +
      (receipts.length ? '<div class="fam-featured-receipts">' +
        receipts.map(function (receipt) {
          return showLink(receipt, receipt.title);
        }).join("") + "</div>" : "") + "</article>";
  }

  function memberCard(member, rank) {
    var receipts = (member.featuredReceipts || []).slice(0, 2);
    return '<article class="fam-member-card" data-fam-tier="' +
      esc(member.tier) + '"><header><span>#' +
      String(rank + 1).padStart(2, "0") + " // " + esc(member.tier) +
      '</span><div class="fam-card-monogram" aria-hidden="true">' +
      esc(initials(member.displayName)) + "</div></header><h3>" +
      esc(member.displayName) + "</h3>" +
      (member.publicHandle ? "<small>" + esc(member.publicHandle) + "</small>" : "") +
      "<b>" + esc(member.honor) + "</b><p>" + esc(member.tagline) +
      '</p><div class="fam-card-stats"><span><b>' +
      esc(number(member.observedShows)) +
      "</b> OBSERVED SHOWS</span><span><b>" +
      esc(number(member.observedReadouts)) +
      "</b> READOUTS</span></div>" +
      (receipts.length ? '<div class="fam-card-receipts">' +
        receipts.map(function (receipt) {
          return showLink(receipt, "PLAY A RECEIPT");
        }).join("") + "</div>" : "") + "</article>";
  }

  function latestShowCard(show) {
    var first = (show.callouts || [])[0] || {};
    var link = "?source=" + encodeURIComponent(show.sourceId) +
      (Number.isFinite(Number(first.at)) ? "&at=" + encodeURIComponent(first.at) : "") +
      "&section=wiki#archive";
    return '<article class="fam-latest-show"><a class="fam-latest-art" href="' +
      link + '"><img src="' + esc(show.thumbnail) +
      '" alt="" loading="lazy"><span>' + esc(show.calloutCount) +
      " ROOM " + (show.calloutCount === 1 ? "READ" : "READS") +
      '</span></a><div><small>' + esc(date(show.date)) +
      "</small><h3>" + esc(show.title) + "</h3><p><b>" +
      esc(show.fanCount) + "</b> PUBLIC " +
      (show.fanCount === 1 ? "NAME" : "NAMES") +
      " IN THIS SHOW'S FAM PASS</p><a href=\"" + link +
      '">OPEN THE SHOW ROLL CALL &rarr;</a></div></article>';
  }

  function filterMembers() {
    var query = clean(state.query).toLowerCase();
    return (index.hallOfFame || []).filter(function (member) {
      if (state.tier !== "ALL" && member.tier !== state.tier) return false;
      if (!query) return true;
      return [
        member.displayName,
        member.publicHandle,
        member.honor,
        (member.aliases || []).join(" "),
      ].join(" ").toLowerCase().indexOf(query) >= 0;
    });
  }

  function hallGridMarkup() {
    var members = filterMembers();
    return members.length ?
      members.map(function (member) {
        return memberCard(member, index.hallOfFame.indexOf(member));
      }).join("") :
      '<div class="fam-no-results"><b>THAT NAME ISN\'T IN THIS PASS.</b>' +
      "<span>Try a public handle or clear the filter. Similar ASR spellings are not silently merged.</span></div>";
  }

  function render() {
    var members = index.hallOfFame || [];
    var michael = members.find(function (member) {
      return member.id === "michael-parten";
    });
    var lee = members.find(function (member) {
      return member.id === "lee-the-machine-bowers";
    });
    mount.innerHTML =
      '<div class="fam-hero"><div class="fam-hero-copy"><p>THE PEOPLE WHO KEEP THIS BEAUTIFUL SHITSHOW ALIVE</p>' +
      "<h1>WWAM FAM<br><em>HALL OF FAME.</em></h1><span>Not a rich list. Not a guessed donor total. This is the live room, rebuilt from public-name readouts, exact show timestamps, and a small verified chat-replay sample.</span></div>" +
      '<div class="fam-hero-signal" aria-label="WWAM FAM archive statistics"><div><b>' +
      esc(number(index.stats.captionSourcesAudited)) +
      "</b><span>CAPTION TAPES CHECKED</span></div><div><b>" +
      esc(number(index.stats.showsWithPublishedFamCallouts)) +
      "</b><span>SHOWS WITH FAM READS</span></div><div><b>" +
      esc(number(index.stats.publishedCallouts)) +
      "</b><span>PLAYABLE CALLOUTS</span></div><div><b>" +
      esc(number(index.stats.hallMembers)) +
      "</b><span>HALL MEMBERS</span></div></div></div>" +
      '<aside class="fam-truth-strip"><b>HOW THIS HALL WORKS</b><p>' +
      esc(index.evidencePolicy.publicClaim) + " " +
      esc(index.evidencePolicy.liveChatSampleBoundary) +
      '</p><a href="#famSpellingDesk">OPEN THE NAME DESK &darr;</a></aside>' +
      '<section class="fam-first-ballot" aria-labelledby="famFirstBallotTitle"><header><span>THE TWO NAMES THAT STARTED THIS REQUEST</span><h2 id="famFirstBallotTitle">FIRST, GIVE THE ROOM ITS FLOWERS.</h2></header><div>' +
      featuredMember(michael, "is-michael") +
      featuredMember(lee, "is-lee") + "</div></section>" +
      '<section class="fam-hall-board" aria-labelledby="famHallBoardTitle"><header><div><span>RECOGNITION BOARD // DISTINCT SHOWS, NOT DOLLARS</span><h2 id="famHallBoardTitle">WHO KEEPS SHOWING UP?</h2></div><p>Ranked by distinct tapes containing a conservative public-name interaction readout. Every card carries playable examples.</p></header>' +
      '<div class="fam-controls"><label><span>FIND A FAM MEMBER</span><input id="famSearch" value="' +
      esc(state.query) + '" placeholder="Lee, Michael, Robin, a handle..."></label>' +
      '<div role="group" aria-label="Filter Hall of Fame tier">' +
      ["ALL", "FIRST BALLOT", "ROOM REGULARS", "THE DEEP BENCH"].map(function (tier) {
        return '<button type="button" data-fam-tier="' + esc(tier) +
          '" aria-pressed="' + (state.tier === tier ? "true" : "false") +
          '">' + esc(tier === "ALL" ? "ALL FAM" : tier) + "</button>";
      }).join("") + '</div></div><div class="fam-member-grid" id="famMemberGrid">' +
      hallGridMarkup() + "</div></section>" +
      '<section class="fam-latest" aria-labelledby="famLatestTitle"><header><span>THE NEWEST ROOM RECEIPTS</span><h2 id="famLatestTitle">THE FAM WAS JUST HERE.</h2><p>Open a recent show and land on its own FAM Roll Call inside the episode wiki.</p></header><div>' +
      (index.latestShows || []).slice(0, 6).map(latestShowCard).join("") +
      "</div></section>" +
      '<section class="fam-spelling-desk" id="famSpellingDesk"><div><span>THE NAME DESK</span><h2>THE CAPTIONS GOT MICHAEL WRONG.</h2></div><p>' +
      esc(index.spellingDesk.michaelParten) +
      "</p><p>" + esc(index.spellingDesk.correctionPolicy) +
      "</p></section>";

    var search = root.document.getElementById("famSearch");
    if (search) {
      search.addEventListener("input", function () {
        state.query = search.value;
        var grid = root.document.getElementById("famMemberGrid");
        if (grid) grid.innerHTML = hallGridMarkup();
      });
    }
    Array.prototype.forEach.call(
      section.querySelectorAll("[data-fam-tier]"),
      function (button) {
        button.addEventListener("click", function () {
          state.tier = button.getAttribute("data-fam-tier") || "ALL";
          render();
          var field = root.document.getElementById("famSearch");
          if (field) field.focus();
        });
      },
    );
    section.setAttribute("aria-busy", "false");
  }

  render();
  root.WWAMFamUI = Object.freeze({
    version: "1.0.0",
    render: render,
  });
})(typeof window !== "undefined" ? window : globalThis);
