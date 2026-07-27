(function (root) {
  "use strict";

  var section = document.getElementById("companion");
  if (!section || !root.WWAMTapeCompanionEngine) return;

  var elements = {
    proof: document.getElementById("companionProof"),
    search: document.getElementById("companionSourceSearch"),
    list: document.getElementById("companionSourceList"),
    latest: document.getElementById("companionLatest"),
    resume: document.getElementById("companionResume"),
    player: document.getElementById("companionPlayer"),
    clock: document.getElementById("companionClock"),
    status: document.getElementById("companionStatus"),
    manual: document.getElementById("companionManualTime"),
    official: document.getElementById("companionOfficial"),
    share: document.getElementById("companionShare"),
    fallback: document.getElementById("companionFallback"),
    memoryTitle: document.getElementById("companionMemoryTitle"),
    heat: document.getElementById("companionHeat"),
    now: document.getElementById("companionNow"),
    next: document.getElementById("companionNext"),
    history: document.getElementById("companionHistory")
  };
  var engine;
  var sources = [];
  var activeSource = null;
  var player = null;
  var playerReady = false;
  var ticker = null;
  var currentSecond = 0;
  var previousSecond = 0;
  var crossedIds = new Set();
  var ytPromise = null;
  var restoreHandled = false;
  var storageKey = "";
  var lastProofCount = -1;
  var lastRenderSignature = "";
  var lastPersistSecond = -Infinity;

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function clean(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  function fmt(value) {
    return Number(value || 0).toLocaleString("en-US");
  }

  function timecode(value) {
    var total = Math.max(0, Math.round(Number(value) || 0));
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var seconds = total % 60;
    return (hours ? String(hours).padStart(2, "0") + ":" : "") +
      String(minutes).padStart(2, "0") + ":" +
      String(seconds).padStart(2, "0");
  }

  function sourceUrl(sourceId, at) {
    return "https://www.youtube.com/watch?v=" + encodeURIComponent(sourceId) +
      "&t=" + Math.max(0, Math.round(Number(at) || 0)) + "s";
  }

  function reducedLanguage() {
    return document.body.classList.contains("office-bleep");
  }

  function displayText(value) {
    var text = clean(value);
    if (!reducedLanguage()) return text;
    return text
      .replace(/\b(fuck(?:ing|ed|er|ers)?|shit(?:ty|ting)?|dick|cock|pussy|cunt|asshole|bitch(?:es)?|goddamn)\b/gi, "[BLEEP]");
  }

  function copy(value, success) {
    var text = String(value || "");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        setStatus(success);
      }).catch(function () {
        fallbackCopy(text, success);
      });
      return;
    }
    fallbackCopy(text, success);
  }

  function fallbackCopy(text, success) {
    var field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    try {
      document.execCommand("copy");
      setStatus(success);
    } catch {
      setStatus("COPY BLOCKED // OPEN THE OFFICIAL SOURCE INSTEAD");
    }
    field.remove();
  }

  function setStatus(message) {
    elements.status.textContent = clean(message || "FULL COMPANIONS");
  }

  function buildInputs() {
    var catalog = root.WWAM_CATALOG || {};
    var deep = root.WWAM_DEEP_DISTILL || {};
    var live = root.WWAM_LIVESTREAMS || {};
    var popular = root.WWAM_POPULAR_LIVE || {};
    var atlas = root.WWAM_ARCHIVE_ATLAS || {};
    var curated = root.WWAM_CURATED || {};
    var characters = root.WWAM_CHARACTER_LORE || {};
    var dna = root.WWAM_CHANNEL_DNA || {};
    var showcase = root.WWAMShowcaseEngine.create({
      catalog: catalog,
      deep: deep,
      live: live,
      popular: popular,
      characters: characters,
      dna: dna
    });
    var lore = root.WWAMLoreEngine && root.WWAMLoreEngine.create
      ? root.WWAMLoreEngine.create({
          catalog: catalog,
          deep: deep,
          live: live,
          popular: popular,
          characters: characters
        })
      : null;
    var ranked = root.WWAMRedBandRankingV2 && root.WWAMRedBandRankingV2.create
      ? root.WWAMRedBandRankingV2.create({
          catalog: catalog,
          deep: deep,
          live: live,
          popular: popular,
          curation: curated,
          characters: characters
        })
      : null;
    var registeredSources = (showcase.sources || []).concat(
      (atlas.records || []).map(function (record) {
        var lanes = Array.isArray(record.lanes) ? record.lanes.slice() : [];
        var commentary = lanes.indexOf("commentary-catalog") >= 0;
        return {
          id: record.id,
          title: record.title,
          date: record.date,
          durationSeconds: record.duration,
          type: commentary ? "commentary" : "livestream",
          lane: lanes[0] || "archive-metadata",
          lanes: lanes,
          url: record.url,
          captioned: record.coverage === "deeply-indexed"
        };
      })
    );
    return {
      showcase: showcase,
      sources: registeredSources,
      deep: deep,
      live: live,
      popular: popular,
      curation: curated,
      characters: characters,
      lore: lore,
      rankedCandidates: ranked
    };
  }

  function renderProof() {
    if (lastProofCount === crossedIds.size) return;
    lastProofCount = crossedIds.size;
    var metrics = engine.metrics;
    var cards = [
      [metrics.companionReady + " / " + metrics.sources, "FULL COMPANIONS",
        metrics.limited + " shows stay watch-only"],
      [fmt(metrics.exactReceiptMembers), "PLAYABLE MOMENTS",
        fmt(metrics.exactIncidents) + " moments tied to an exact second"],
      [fmt(metrics.heatWindows), "SHOW ENERGY WINDOWS",
        "A rough guide to where the night gets loud"],
      [crossedIds.size, "MOMENTS WE'VE PASSED",
        "Upcoming moments stay out of sight"]
    ];
    elements.proof.innerHTML = cards.map(function (card) {
      return "<article><span>" + esc(card[1]) + "</span><b>" + esc(card[0]) +
        "</b><p>" + esc(card[2]) + "</p></article>";
    }).join("");
  }

  function renderSources() {
    var query = clean(elements.search.value).toLowerCase();
    var visible = sources.filter(function (source) {
      return !query || [
        source.title,
        source.date,
        source.type,
        source.lane,
        source.lanes.join(" ")
      ].join(" ").toLowerCase().indexOf(query) >= 0;
    });
    elements.list.innerHTML = visible.map(function (source) {
      var selected = activeSource && activeSource.id === source.id;
      var limited = source.readiness.status !== "companion-ready";
      return '<button type="button" role="option" aria-selected="' +
        (selected ? "true" : "false") + '" class="companion-source ' +
        (selected ? "on " : "") + (limited ? "is-limited" : "") +
        '" data-companion-source="' + esc(source.id) + '"><span>' +
        esc(source.date || "UNDATED") + " // " +
        esc(limited ? source.readiness.label : source.counts.exactReceiptMembers +
          " MOMENTS · " + source.counts.heatWindows + " ENERGY WINDOWS") +
        "</span><b>" + esc(source.title) + "</b></button>";
    }).join("") || '<p class="companion-fallback">NO SOURCE TITLE MATCHES THAT SEARCH.</p>';
    Array.prototype.forEach.call(
      elements.list.querySelectorAll("[data-companion-source]"),
      function (button) {
        button.onclick = function () {
          selectSource(button.getAttribute("data-companion-source"), 0, {
            reason: "SHOW READY // PRESS PLAY"
          });
        };
      }
    );
  }

  function destroyPlayer() {
    if (ticker) clearInterval(ticker);
    ticker = null;
    playerReady = false;
    if (player && typeof player.destroy === "function") {
      try { player.destroy(); } catch {}
    }
    player = null;
  }

  function loadYouTubeApi() {
    if (!root.ShokkerYouTubePlayback.hosted()) {
      return Promise.reject(new Error("YouTube IFrame API requires an HTTP(S) page identity"));
    }
    if (root.YT && root.YT.Player) return Promise.resolve(root.YT);
    if (ytPromise) return ytPromise;
    ytPromise = new Promise(function (resolve, reject) {
      var settled = false;
      var previous = root.onYouTubeIframeAPIReady;
      root.onYouTubeIframeAPIReady = function () {
        if (typeof previous === "function") previous();
        if (!settled && root.YT && root.YT.Player) {
          settled = true;
          resolve(root.YT);
        }
      };
      var existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!existing) {
        var script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        script.referrerPolicy = root.ShokkerYouTubePlayback.referrerPolicy;
        script.onerror = function () {
          if (!settled) {
            settled = true;
            reject(new Error("YouTube player API unavailable"));
          }
        };
        document.head.appendChild(script);
      }
      setTimeout(function () {
        if (!settled && !(root.YT && root.YT.Player)) {
          settled = true;
          reject(new Error("YouTube player API timed out"));
        }
      }, 12000);
    });
    return ytPromise;
  }

  function mountIframeFallback(source, startAt, forceHostedBridge, status, copy) {
    destroyPlayer();
    elements.player.innerHTML =
      '<div class="companion-player-host">' +
      root.ShokkerYouTubePlayback.iframe(source.id, {
        autoplay: false,
        start: startAt,
        forceHostedBridge: forceHostedBridge === true,
        title: "Official YouTube Tape Companion playback"
      }) + '</div>';
    elements.fallback.textContent = copy;
    setStatus(status);
  }

  function mountPlayer(source, startAt) {
    destroyPlayer();
    if (!root.ShokkerYouTubePlayback.hosted()) {
      mountIframeFallback(
        source,
        startAt,
        true,
        "HOSTED PLAYER READY // USE THE TIMELINE IF NEEDED",
        "Local-file mode routes playback through the hosted WWAM player. " +
        "Use the manual sync rail to move the memory system to the same second."
      );
      return;
    }
    elements.player.innerHTML =
      '<div class="companion-player-host"><div id="companionYoutubePlayer"></div></div>';
    setStatus(source.readiness.status === "companion-ready"
      ? "LOADING OFFICIAL YOUTUBE PLAYER"
      : "WATCH-ONLY SHOW // NO TIMED MOMENTS");
    loadYouTubeApi().then(function (YT) {
      if (!activeSource || activeSource.id !== source.id) return;
      player = new YT.Player("companionYoutubePlayer", {
        videoId: source.id,
        playerVars: root.ShokkerYouTubePlayback.playerVars({
          autoplay: false,
          start: startAt
        }),
        events: {
          onReady: function () {
            playerReady = true;
            if (startAt > 0) player.seekTo(startAt, true);
            setStatus(source.readiness.status === "companion-ready"
              ? "PLAYER READY // SECOND SCREEN READY"
              : "PLAYER READY // WATCH-ONLY SHOW");
            ticker = setInterval(tickPlayer, 500);
          },
          onStateChange: function (event) {
            if (!root.YT || !root.YT.PlayerState) return;
            if (event.data === root.YT.PlayerState.PLAYING) {
              setStatus("SHOW PLAYING // SECOND SCREEN IN SYNC");
            } else if (event.data === root.YT.PlayerState.PAUSED) {
              persist(true);
              setStatus("SHOW PAUSED AT " + timecode(currentSecond));
            } else if (event.data === root.YT.PlayerState.ENDED) {
              persist(true);
              setStatus("SHOW COMPLETE // " + crossedIds.size + " MOMENTS PASSED");
            }
          },
          onError: function (event) {
            var code = Number(event && event.data);
            playerReady = false;
            if (code === 153) {
              mountIframeFallback(
                source,
                currentSecond || startAt,
                true,
                "PLAYER SWITCHED // USE THE TIMELINE IF THE SECOND SCREEN DRIFTS",
                "YouTube could not start the first player, so Tape Companion switched players. If the second screen drifts, move the timeline to the same second."
              );
            } else {
              setStatus("EMBED UNAVAILABLE // MANUAL SYNC + OFFICIAL LINK READY");
              elements.fallback.textContent =
                "YouTube could not play this show here. Open the original, then move this timeline to the same second.";
            }
          }
        }
      });
    }).catch(function () {
      mountIframeFallback(
        source,
        currentSecond || startAt,
        false,
        "PLAYER READY // USE THE TIMELINE IF NEEDED",
        "The synchronized YouTube API was unavailable, so Tape Companion loaded the same official source in a direct on-page player. Use the manual sync rail to move the memory system to the same second."
      );
    });
  }

  function tickPlayer() {
    if (!playerReady || !player || typeof player.getCurrentTime !== "function") return;
    var value;
    try { value = Number(player.getCurrentTime()); } catch { return; }
    if (!Number.isFinite(value)) return;
    if (Math.abs(value - currentSecond) < 0.2) return;
    updateAt(value, false);
  }

  function annotationBadges(event) {
    var badges = [];
    (event.annotations || []).forEach(function (annotation) {
      if (annotation.type === "ranked-candidate") {
        badges.push({
          className: "is-red",
          label: "RED BAND #" + String(annotation.rank).padStart(3, "0") +
            " // ARCHIVE PICK"
        });
      } else if (annotation.type === "editorial-selection") {
        badges.push({
          className: "is-curated",
          label: "UP IN YA // EDITORIAL SELECTION"
        });
      } else if (annotation.type === "recurring-character") {
        badges.push({
          className: "is-character",
          label: clean(annotation.displayLabel || "RECURRING CHARACTER") +
            " // VOICE NOT CONFIRMED"
        });
      }
    });
    if ((event.loreConnections || []).length) {
      var connection = (event.loreConnections || []).filter(function (item) {
        return /character|bit|lineage/i.test(item.entryKind || "");
      })[0] || event.loreConnections[0];
      badges.push({
        className: "",
        label: "ARCHIVE CONNECTION // " + clean(connection.displayLabel) +
          " // " + Number(connection.evidenceCount || 0) + " LINKS"
      });
    }
    return badges;
  }

  function presentationMember(event) {
    if (!event) return null;
    var members = event.members || [];
    var latestId = clean(event.latestRevealedMemberId);
    var eligible = members.filter(function (member) {
      return Number(member.at) <= currentSecond;
    });
    var selected = eligible.filter(function (member) {
      return latestId && member.id === latestId;
    })[0];
    return selected || eligible[eligible.length - 1] || event;
  }

  function renderEvent(event) {
    if (!event) {
      return "<span>ON SCREEN NOW</span><p>Nothing is mapped in this 18-second stretch. Keep watching.</p>";
    }
    var subject = presentationMember(event);
    var badges = annotationBadges(event);
    return "<span>" + esc(subject.label || "SHOW MOMENT") + " // " +
      esc(timecode(subject.at)) + "</span>" +
      (subject.excerpt
        ? "<blockquote>“" + esc(displayText(subject.excerpt)) + "”</blockquote>"
        : "<p>This moment is mapped without showing an automatic-caption fragment.</p>") +
      (badges.length
        ? '<div class="companion-badges">' + badges.map(function (badge) {
            return '<b class="' + badge.className + '">' + esc(badge.label) + "</b>";
          }).join("") + "</div>"
        : "") +
      '<a href="' + esc(subject.url || sourceUrl(activeSource.id, subject.at)) +
      '" target="_blank" rel="noopener">PLAY THIS MOMENT IN THE ORIGINAL SHOW ↗</a>';
  }

  function uniqueEvents(events) {
    var seen = new Set();
    return (events || []).filter(function (event) {
      if (!event || seen.has(event.id)) return false;
      seen.add(event.id);
      return true;
    });
  }

  function renderSnapshot(snapshot, crossing) {
    if (!snapshot) return;
    var crossingEvents = crossing && crossing.events || [];
    crossingEvents.forEach(function (event) { crossedIds.add(event.id); });
    currentSecond = snapshot.seconds;
    elements.clock.textContent = timecode(currentSecond);
    elements.manual.value = String(Math.round(currentSecond));
    elements.official.href = sourceUrl(snapshot.source.id, currentSecond);
    elements.share.disabled = false;
    if (crossingEvents.length) {
      setStatus(crossingEvents.length + " " +
        (crossingEvents.length === 1 ? "MOMENT" : "MOMENTS") + " PASSED");
    }

    var signature = [
      snapshot.source.id,
      Math.round(currentSecond),
      snapshot.currentHeat && snapshot.currentHeat.id,
      (snapshot.activeEvents || []).map(function (event) {
        return event.id + ":" + event.members.length;
      }).join(","),
      snapshot.future && snapshot.future.next && snapshot.future.next.at,
      (snapshot.history || []).slice(-8).map(function (event) {
        return event.id + ":" + event.members.length;
      }).join(",")
    ].join("|");
    if (signature === lastRenderSignature) {
      persist(false);
      return;
    }
    lastRenderSignature = signature;

    var heat = snapshot.currentHeat && snapshot.currentHeat.heat;
    var heatScore = heat ? Math.round(Number(heat.score || 0)) : 0;
    var heatLabel = !heat ? "QUIET STRETCH" :
      heatScore >= 75 ? "OFF THE RAILS" :
        heatScore >= 45 ? "GETTING LOUD" : "LOW BOIL";
    elements.heat.innerHTML = "<span>SHOW ENERGY // ROUGH GUIDE</span><b>" +
      heatLabel + '</b><i style="--companion-heat:' + heatScore + '%"></i>' +
      (heat
        ? "<small>" + esc(clean(heat.signal || "SHOW MOMENT")) +
          (heat.topic ? " // " + esc(clean(heat.topic)) : "") + "</small>"
        : "");

    var active = uniqueEvents(crossingEvents.concat(snapshot.activeEvents || []));
    var primary = active.length ? active[active.length - 1] : null;
    var primarySubject = presentationMember(primary);
    elements.now.innerHTML = renderEvent(primary);
    elements.memoryTitle.textContent = primarySubject
      ? clean(primarySubject.label || "SHOW MOMENT") + " JUST PASSED."
      : snapshot.readiness.status === "companion-ready"
        ? "THE SECOND SCREEN IS READY."
        : "WATCH-ONLY SHOW.";

    var next = snapshot.future && snapshot.future.next;
    elements.next.innerHTML = "<span>COMING UP // DETAILS STAY HIDDEN</span><b>" +
      (next ? "IN " + timecode(next.secondsUntil) + " // " + timecode(next.at) : "END OF SHOW MAP") +
      "</b>";

    var history = uniqueEvents((snapshot.history || []).concat(snapshot.activeEvents || []))
      .slice(-8)
      .reverse();
    elements.history.innerHTML = history.map(function (event) {
      var subject = presentationMember(event);
      var badges = annotationBadges(event);
      return "<li><time>" + esc(timecode(subject.at)) + "</time><b>" +
        esc(displayText(subject.label || "SHOW MOMENT")) + "</b><small>" +
        esc(subject.excerpt ? displayText(subject.excerpt) :
          badges[0] ? badges[0].label : "MAPPED TO THE ORIGINAL SHOW") + "</small></li>";
    }).join("");
    renderProof();
    persist(false);
  }

  function updateAt(value, forceSnapshot) {
    if (!activeSource) return;
    var nextSecond = Math.max(0, Math.min(
      Number(value) || 0,
      Number(activeSource.durationSeconds || value || 0)
    ));
    var crossing = forceSnapshot
      ? { mode: "snapshot", events: [] }
      : engine.crossedEvents(activeSource.id, previousSecond, nextSecond);
    var snapshot = crossing.snapshot || engine.snapshotAt(activeSource.id, nextSecond);
    renderSnapshot(snapshot, crossing);
    previousSecond = nextSecond;
  }

  function persist(force) {
    if (!activeSource || !storageKey) return;
    if (!force && Math.abs(currentSecond - lastPersistSecond) < 5) return;
    try {
      localStorage.setItem(storageKey, engine.serializeShareState(activeSource.id, currentSecond));
      lastPersistSecond = currentSecond;
    } catch {}
  }

  function restoreToken(token, reason) {
    var restored = engine.restoreShareState(token);
    if (!restored.ok) {
      setStatus("SHARED TAPE HELD // " + clean(restored.code || "INCOMPATIBLE STATE"));
      return false;
    }
    selectSource(restored.sourceId, restored.seconds, {
      reason: reason || "EXACT COMPANION STATE RESTORED"
    });
    return true;
  }

  function selectSource(sourceId, at, options) {
    var source = sources.filter(function (candidate) {
      return candidate.id === sourceId;
    })[0];
    if (!source) {
      setStatus("THAT SHOW IS NOT IN THIS COMPANION");
      return;
    }
    activeSource = source;
    currentSecond = Math.max(0, Math.min(Number(at) || 0, source.durationSeconds || Infinity));
    previousSecond = currentSecond;
    crossedIds = new Set();
    lastProofCount = -1;
    lastRenderSignature = "";
    lastPersistSecond = -Infinity;
    elements.manual.disabled = false;
    elements.manual.max = String(Math.max(1, Math.round(source.durationSeconds || 1)));
    elements.manual.value = String(Math.round(currentSecond));
    elements.official.href = sourceUrl(source.id, currentSecond);
    elements.share.disabled = false;
    elements.fallback.textContent = source.readiness.limitation ||
      "If embedded playback is unavailable, the same exact second opens on the official WWAM upload.";
    renderSources();
    renderSnapshot(engine.snapshotAt(source.id, currentSecond), { mode: "snapshot", events: [] });
    mountPlayer(source, currentSecond);
    setStatus(
      source.readiness.status === "companion-ready"
        ? options && options.reason || "SOURCE LOADED // PRESS PLAY WHEN READY"
        : "WATCH-ONLY SHOW LOADED // PRESS PLAY"
    );
  }

  function handleCompanionOpen(event) {
    var detail = event && event.detail;
    var sourceId = clean(detail && detail.sourceId);
    var at = Number(detail && detail.at);
    if (!sourceId || !Number.isFinite(at) || at < 0) {
      setStatus("SHOW WIKI MOMENT COULD NOT LOAD // TRY ANOTHER");
      return;
    }
    selectSource(sourceId, at, {
      reason: "SHOW WIKI MOMENT LOADED // PRESS PLAY"
    });
  }

  function initControls() {
    elements.search.addEventListener("input", renderSources);
    elements.latest.onclick = function () {
      var latest = sources.filter(function (source) {
        return source.readiness.status === "companion-ready";
      })[0] || sources[0];
      if (latest) selectSource(latest.id, 0, {
        reason: "NEWEST SHOW LOADED // PRESS PLAY"
      });
    };
    elements.resume.onclick = function () {
      var saved = "";
      try { saved = localStorage.getItem(storageKey) || ""; } catch {}
      if (!saved || !restoreToken(saved, "LAST WATCH RESTORED")) {
        setStatus(saved ? "SAVED STATE HELD // SNAPSHOT CHANGED" : "NO SAVED TAPE YET");
      }
    };
    elements.manual.addEventListener("input", function () {
      var at = Number(elements.manual.value || 0);
      if (playerReady && player && typeof player.seekTo === "function") {
        try { player.seekTo(at, true); } catch {}
      }
      previousSecond = at;
      updateAt(at, true);
      persist(true);
      setStatus("TIMELINE MOVED TO " + timecode(at));
    });
    elements.share.onclick = function () {
      if (!activeSource) return;
      var token = engine.serializeShareState(activeSource.id, currentSecond);
      persist(true);
      var url = new URL(location.href);
      url.searchParams.set("companion", token);
      url.hash = "companion";
      copy(url.toString(), "THIS SECOND COPIED");
    };
    root.addEventListener("wwam:tape-companion-open", handleCompanionOpen);
    root.addEventListener("pagehide", function () { persist(true); });
  }

  function init() {
    try {
      engine = root.WWAMTapeCompanionEngine.create(buildInputs(), {
        channelId: "wwam",
        snapshotDate: "2026-07-23"
      });
      sources = engine.listSources();
      storageKey = "wwam:tape-companion:" + engine.archiveFingerprint;
      renderProof();
      renderSources();
      initControls();
      section.setAttribute("aria-busy", "false");
      section.setAttribute("data-companion-ready", "true");
      var shared = new URLSearchParams(location.search).get("companion");
      if (shared) {
        restoreHandled = true;
        restoreToken(shared, "SHARED COMPANION SECOND RESTORED");
      }
      if (!restoreHandled) {
        setStatus(
          fmt(engine.metrics.sources) + " SHOWS // " +
          fmt(engine.metrics.companionReady) + " FULL COMPANIONS // PICK ONE"
        );
      }
    } catch (error) {
      section.setAttribute("aria-busy", "false");
      section.setAttribute("data-companion-ready", "false");
      elements.proof.innerHTML =
        "<article><span>SECOND SCREEN UNAVAILABLE</span><b>THIS ROOM COULD NOT OPEN</b><p>" +
        esc(error && error.message ? error.message : String(error)) + "</p></article>";
      setStatus("COMPANION INITIALIZATION FAILED");
    }
  }

  init();
})(typeof window !== "undefined" ? window : globalThis);
