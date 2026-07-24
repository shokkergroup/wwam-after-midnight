(function (root) {
  "use strict";

  var SAMPLE = Object.freeze({
    id: "LocalDemo01",
    url: "https://www.youtube.com/watch?v=LocalDemo01",
    title: "LOCAL DEMO // Synthetic WWAM intake proof",
    date: "2026-07-24",
    duration: "120",
    lane: "fresh-live",
    format: "webvtt",
    transcript: [
      "WEBVTT",
      "",
      "00:00:05.000 --> 00:00:09.000",
      "Ghostface walks in and somebody says no way.",
      "",
      "00:00:24.000 --> 00:00:29.000",
      "This Halloween theory about Michael Myers is wild.",
      "",
      "00:00:49.000 --> 00:00:54.000",
      "Oh my god, Freddy Krueger at Crystal Lake.",
      "",
      "00:01:17.000 --> 00:01:22.000",
      "Dr Loomis calls and the room says are you kidding me.",
      "",
      "00:01:44.000 --> 00:01:50.000",
      "Silver Shamrock, Friday the 13th, holy shit."
    ].join("\n")
  });

  function clean(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function displayText(value) {
    var output = clean(value);
    if (!root.document ||
        !root.document.body ||
        !root.document.body.classList.contains("office-bleep")) {
      return output;
    }
    return output.replace(
      /\b(fuck(?:ing|ed|er|ers)?|shit(?:ty|ting)?|dick|cock|pussy|cunt|asshole|bitch(?:es)?|goddamn)\b/gi,
      "[BLEEP]"
    );
  }

  function youtubeId(value) {
    var input = clean(value);
    if (/^[A-Za-z0-9_-]{11}$/.test(input)) return input;
    var match = input.match(
      /^https:\/\/(?:www\.|m\.)?youtube\.com\/(?:live|embed|shorts)\/([A-Za-z0-9_-]{11})(?:[?#].*)?$/i
    );
    if (match) return match[1];
    match = input.match(
      /^https:\/\/youtu\.be\/([A-Za-z0-9_-]{11})(?:[?#].*)?$/i
    );
    if (match) return match[1];
    match = input.match(
      /^https:\/\/(?:www\.|m\.)?youtube\.com\/watch\?([^#]+)(?:#.*)?$/i
    );
    if (!match) return "";
    var ids = match[1].split("&").reduce(function (result, pair) {
      var parts = pair.split("=");
      var key;
      var entry;
      try {
        key = decodeURIComponent(parts.shift() || "");
        entry = decodeURIComponent(parts.join("=") || "");
      } catch {
        return result;
      }
      if (key === "v") result.push(entry);
      return result;
    }, []);
    return ids.length === 1 && /^[A-Za-z0-9_-]{11}$/.test(ids[0])
      ? ids[0]
      : "";
  }

  function durationSeconds(value) {
    var input = clean(value);
    if (/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(input)) {
      var direct = Number(input);
      return direct > 0 ? Math.round(direct * 1000) / 1000 : NaN;
    }
    if (!/^\d{1,4}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/.test(input)) {
      return NaN;
    }
    var parts = input.split(":").map(Number);
    var seconds;
    if (parts.length === 2) {
      if (parts[1] >= 60) return NaN;
      seconds = parts[0] * 60 + parts[1];
    } else {
      if (parts[1] >= 60 || parts[2] >= 60) return NaN;
      seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return seconds > 0 ? Math.round(seconds * 1000) / 1000 : NaN;
  }

  function timecode(value) {
    var total = Math.max(0, Math.floor(Number(value) || 0));
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor(total % 3600 / 60);
    var seconds = total % 60;
    return [hours, minutes, seconds].map(function (part) {
      return String(part).padStart(2, "0");
    }).join(":");
  }

  function detectFormat(name, content) {
    var fileName = clean(name).toLowerCase();
    var sample = String(content == null ? "" : content).trim();
    if (/\.vtt$/i.test(fileName) || /^WEBVTT(?:\s|$)/i.test(sample)) {
      return "webvtt";
    }
    if (/\.srt$/i.test(fileName) ||
        /^\d+\s*\r?\n\d{2}:\d{2}:\d{2},\d{3}\s+-->/m.test(sample)) {
      return "srt";
    }
    if (/\.(?:json|json3)$/i.test(fileName) ||
        /^\s*\{[\s\S]*"(?:events|wireMagic)"\s*:/i.test(sample)) {
      return "youtube-json3";
    }
    return "plain-text";
  }

  function chaptersFor(candidates, duration, count) {
    var total = Number(duration) || 0;
    var bucketCount = Math.max(1, Number(count) || 8);
    var size = total > 0 ? total / bucketCount : 1;
    var list = Array.isArray(candidates) ? candidates : [];
    var chapters = Array.from({ length: bucketCount }, function (_, index) {
      var start = index * size;
      var end = index === bucketCount - 1 ? total : (index + 1) * size;
      var members = list.filter(function (candidate) {
        var at = Number(candidate && candidate.at) || 0;
        return at >= start && (index === bucketCount - 1 ? at <= end : at < end);
      });
      var labels = Array.from(new Set(members.map(function (candidate) {
        return clean(candidate && candidate.label);
      }).filter(Boolean))).slice(0, 3);
      return {
        index: index + 1,
        start: Math.round(start * 1000) / 1000,
        end: Math.round(end * 1000) / 1000,
        count: members.length,
        labels: labels,
        firstCandidate: members[0] || null,
        heatPercent: 0
      };
    });
    var hottest = Math.max.apply(null, chapters.map(function (chapter) {
      return chapter.count;
    }).concat([0]));
    chapters.forEach(function (chapter) {
      chapter.heatPercent = hottest
        ? Math.max(8, Math.round(chapter.count / hottest * 100))
        : 0;
    });
    return chapters;
  }

  function rules() {
    return {
      topics: [
        {
          id: "elm-street",
          label: "ELM STREET MENTION",
          terms: ["nightmare on elm street", "freddy krueger", "freddy"]
        },
        {
          id: "friday-the-13th",
          label: "FRIDAY THE 13TH MENTION",
          terms: ["friday the 13th", "jason voorhees", "crystal lake"]
        },
        {
          id: "halloween",
          label: "HALLOWEEN MENTION",
          terms: ["halloween", "michael myers", "silver shamrock"]
        },
        {
          id: "scream",
          label: "SCREAM MENTION",
          terms: ["scream", "ghostface", "woodsboro"]
        },
        {
          id: "wwam-characters",
          label: "RECURRING CHARACTER MENTION",
          terms: ["dr loomis", "dr challis", "slenderman", "corey feldman"]
        }
      ],
      signals: [
        {
          id: "captioned-laughter",
          label: "CAPTIONED LAUGHTER",
          terms: ["laughter", "laughing"]
        },
        {
          id: "full-send",
          label: "FULL SEND LANGUAGE",
          terms: ["holy shit", "fuck yeah", "let's go"]
        },
        {
          id: "room-break",
          label: "ROOM BREAK PHRASE",
          terms: ["oh my god", "no way", "are you kidding me"]
        }
      ]
    };
  }

  var publicApi = Object.freeze({
    sample: SAMPLE,
    youtubeId: youtubeId,
    durationSeconds: durationSeconds,
    timecode: timecode,
    detectFormat: detectFormat,
    chaptersFor: chaptersFor,
    rules: rules
  });
  root.WWAMFreshTapeIntakeUI = publicApi;

  var doc = root.document;
  if (!doc) return;
  var section = doc.getElementById("fresh-intake");
  if (!section) return;

  var elements = {
    proof: doc.getElementById("freshIntakeProof"),
    form: doc.getElementById("freshIntakeForm"),
    id: doc.getElementById("freshSourceId"),
    url: doc.getElementById("freshSourceUrl"),
    title: doc.getElementById("freshSourceTitle"),
    date: doc.getElementById("freshSourceDate"),
    duration: doc.getElementById("freshSourceDuration"),
    lane: doc.getElementById("freshSourceLane"),
    format: doc.getElementById("freshTranscriptFormat"),
    file: doc.getElementById("freshTranscriptFile"),
    transcript: doc.getElementById("freshTranscriptContent"),
    rules: doc.getElementById("freshIntakeRules"),
    run: doc.getElementById("freshIntakeRun"),
    sample: doc.getElementById("freshIntakeSample"),
    burn: doc.getElementById("freshIntakeBurn"),
    clear: doc.getElementById("freshIntakeClear"),
    status: doc.getElementById("freshIntakeStatus"),
    output: doc.getElementById("freshIntakeOutput")
  };

  var engine = null;
  var channelPack = null;
  var artifact = null;
  var artifactIsSample = false;
  var sampleActive = false;
  var visibleCandidates = 36;
  var lastNotice = "";

  function announce(message) {
    lastNotice = clean(message);
    if (elements.status) elements.status.textContent = lastNotice;
  }

  function focusResult() {
    var target = elements.output &&
      elements.output.querySelector("[data-fresh-result-focus]");
    if (!target || typeof target.focus !== "function") return;
    try {
      target.focus({ preventScroll: true });
    } catch {
      target.focus();
    }
  }

  function sourceLabel() {
    return artifactIsSample
      ? "LOCAL DEMO // SYNTHETIC // NOT ARCHIVE PROOF"
      : "LOCAL INTAKE // CHANNEL OWNERSHIP UNVERIFIED";
  }

  function renderProof() {
    if (!engine) {
      elements.proof.innerHTML =
        "<article><span>INTAKE HELD</span><b>FAIL-CLOSED</b>" +
        "<p>The local evidence contract did not initialize.</p></article>";
      return;
    }
    var cards = [
      ["0", "UPLOAD ENDPOINTS CALLED",
        "Transcript processing happens in this browser tab."],
      [engine.binding.sourceLanes.length, "DECLARED SOURCE LANES",
        "The selected lane must exist in the compiled ChannelPack."],
      ["QUARANTINE", "ONLY POSSIBLE OUTPUT",
        "Machine candidates cannot promote themselves."],
      ["UNKNOWN", "SPEAKER STATE",
        "Every candidate remains explicitly not diarized."]
    ];
    elements.proof.innerHTML = cards.map(function (card) {
      return "<article><span>" + esc(card[1]) + "</span><b>" +
        esc(card[0]) + "</b><p>" + esc(card[2]) + "</p></article>";
    }).join("");
  }

  function renderLaneOptions() {
    var lanes = channelPack && Array.isArray(channelPack.sourceLanes)
      ? channelPack.sourceLanes
      : [];
    elements.lane.innerHTML = lanes.map(function (lane) {
      return '<option value="' + esc(lane.id) + '">' +
        esc(lane.label + " // " + lane.id) + "</option>";
    }).join("");
    if (lanes.some(function (lane) { return lane.id === "fresh-live"; })) {
      elements.lane.value = "fresh-live";
    }
  }

  function renderRules() {
    var active = engine.rules.topics.concat(engine.rules.signals);
    elements.rules.innerHTML =
      "<header><span>ACTIVE LITERAL LENSES</span><b>" +
      active.length + " RULES // NO REGEX GUESSING</b></header><div>" +
      active.map(function (rule) {
        return '<span class="intake-rule ' + esc(rule.kind) + '">' +
          esc(rule.label) + "</span>";
      }).join("") + "</div>";
  }

  function emptyMarkup() {
    return '<div class="intake-empty">' +
      '<div class="intake-radar" aria-hidden="true"><i></i><i></i><i></i></div>' +
      '<span>LOCAL DROP ZONE ARMED</span>' +
      '<h3 tabindex="-1" data-fresh-result-focus>BRING A TIMED TRANSCRIPT. KEEP THE CLAIMS HONEST.</h3>' +
      "<p>WebVTT, SRT, and YouTube JSON3 can surface exact quarantine candidates. " +
      "Untimed plain text is accepted only as a held input with zero candidates.</p>" +
      "<ol><li>Bind the exact YouTube ID to its official HTTPS URL.</li>" +
      "<li>Parse the timed transcript locally against explicit literal lenses.</li>" +
      "<li>Export a restorable quarantine artifact with no raw transcript.</li></ol></div>";
  }

  function policyMarkup() {
    return '<div class="intake-policy" aria-label="Fresh Tape Intake evidence boundary">' +
      "<span>MACHINE SURFACED</span><span>PROMOTION FORBIDDEN</span>" +
      "<span>SPEAKER UNKNOWN / NOT DIARIZED</span>" +
      "<span>CHANNEL OWNERSHIP UNVERIFIED</span>" +
      "<span>RAW TRANSCRIPT OMITTED FROM EXPORT</span>" +
      "<span>STRUCTURAL CHECK ONLY / AUTHENTICITY NOT VERIFIED</span></div>";
  }

  function metricMarkup() {
    var metrics = artifact.metrics;
    var ingest = artifact.ingest;
    var cards = [
      [metrics.candidates, "EXACT CANDIDATES"],
      [artifact.evidenceLedger.entries.length, "CANDIDATE-EVENT RECEIPTS"],
      [ingest.uniqueEvents, "TIMED EVENTS"],
      [ingest.duplicatesRemoved, "EXACT DUPLICATES REMOVED"],
      [ingest.wordsAudited, "WORDS LOCALLY AUDITED"]
    ];
    return '<div class="intake-result-proof">' + cards.map(function (card) {
      return "<article><b>" + Number(card[0]).toLocaleString("en-US") +
        "</b><span>" + esc(card[1]) + "</span></article>";
    }).join("") + "</div>";
  }

  function chapterMarkup() {
    var chapters = chaptersFor(
      artifact.candidates,
      artifact.source.durationSeconds,
      8
    );
    return '<section class="intake-chapters" aria-labelledby="intakeChaptersTitle">' +
      '<header><div><span>LOCAL HEAT MAP</span><h4 id="intakeChaptersTitle">EIGHT-CHAPTER SIGNAL ARC</h4></div>' +
      "<b>RELATIVE CANDIDATE DENSITY</b></header>" +
      '<div class="intake-heat-rail">' + chapters.map(function (chapter) {
        var label = "Chapter " + chapter.index + ", " + chapter.count +
          " candidate" + (chapter.count === 1 ? "" : "s");
        var inner = '<i style="--fresh-heat:' + chapter.heatPercent +
          '%"></i><span>' + timecode(chapter.start) + "</span><b>" +
          chapter.count + "</b>";
        return chapter.firstCandidate
          ? '<a href="' + esc(chapter.firstCandidate.timecodeUrl) +
            '" target="_blank" rel="noopener" aria-label="' + esc(
              label + ". Open the first exact candidate."
            ) + '">' + inner + "</a>"
          : '<span aria-label="' + esc(label) + '">' + inner + "</span>";
      }).join("") + "</div>" +
      '<ol class="intake-chapter-list">' + chapters.map(function (chapter) {
        var summary = chapter.labels.join(" / ") || "NO MATCHING LITERAL SIGNAL";
        return "<li><span>CH " + String(chapter.index).padStart(2, "0") +
          " // " + timecode(chapter.start) + "-" + timecode(chapter.end) +
          "</span><b>" + esc(summary) + "</b><small>" + chapter.count +
          " CANDIDATE" + (chapter.count === 1 ? "" : "S") + "</small></li>";
      }).join("") + "</ol></section>";
  }

  function candidateMarkup(candidate, index) {
    return '<article class="intake-candidate">' +
      "<header><span>#" + String(index + 1).padStart(3, "0") + " // " +
      esc(candidate.kind.toUpperCase()) + "</span><a href=\"" +
      esc(candidate.timecodeUrl) +
      '" target="_blank" rel="noopener">' + timecode(candidate.at) +
      " OPEN SOURCE &nearr;</a></header><h4>" + esc(candidate.label) +
      "</h4><blockquote>&ldquo;" + esc(displayText(candidate.excerpt.text)) +
      "&rdquo;</blockquote><div><span>MACHINE SURFACED</span>" +
      "<span>QUARANTINE ONLY</span><span>SPEAKER UNKNOWN</span>" +
      "<span>NOT DIARIZED</span></div><footer><b>EXACT EVENT " +
      timecode(candidate.at) + "-" + timecode(candidate.end) +
      "</b><small>" + esc(candidate.derivation.method) + "</small></footer></article>";
  }

  function candidateListMarkup() {
    var candidates = artifact.candidates;
    if (!candidates.length) {
      return '<section class="intake-candidates"><header><div><span>EXACT CANDIDATE LEDGER</span>' +
        "<h4>NO LITERAL SIGNALS MATCHED.</h4></div><b>ZERO CLAIMS INVENTED</b></header>" +
        '<div class="intake-no-matches">The timed transcript parsed, but none of the ' +
        "declared literal lenses matched. The structure-checked artifact still preserves its " +
        "source binding and ingest ledger.</div></section>";
    }
    var showing = candidates.slice(0, visibleCandidates);
    return '<section class="intake-candidates" aria-labelledby="intakeCandidatesTitle">' +
      '<header><div><span>EXACT CANDIDATE LEDGER</span>' +
      '<h4 id="intakeCandidatesTitle">THE MACHINE FOUND PLACES TO LOOK. NOT TRUTH.</h4></div><b>' +
      showing.length + " OF " + candidates.length + " SHOWN</b></header>" +
      '<div class="intake-candidate-list">' + showing.map(candidateMarkup).join("") +
      "</div>" + (showing.length < candidates.length
        ? '<button class="intake-more" type="button" data-fresh-more>SHOW ' +
          Math.min(36, candidates.length - showing.length) + " MORE CANDIDATES</button>"
        : "") + "</section>";
  }

  function heldMarkup() {
    var reason = artifact.holdReasons[0] || {
      code: "UNTIMED_TRANSCRIPT",
      message: "Timestamp evidence is required."
    };
    return '<div class="intake-result-head is-held">' +
      '<div><span>' + esc(sourceLabel()) + '</span><h3 tabindex="-1" data-fresh-result-focus>' +
      "HELD. NO CLOCK, NO MOMENT CLAIM.</h3></div><p>" +
      esc(reason.code + " // " + reason.message) +
      '</p><div class="intake-result-actions" data-fresh-actions></div></div>' +
      metricMarkup() + policyMarkup() +
      '<div class="intake-held"><b>0 DERIVED CANDIDATES</b>' +
      "<p>Plain text can help an operator inspect source-level context, but it cannot " +
      "produce a playable moment without timestamps. Add WebVTT, SRT, or JSON3 timing " +
      "and run a new local intake.</p></div>";
  }

  function quarantinedMarkup() {
    return '<div class="intake-result-head">' +
      '<div><span>' + esc(sourceLabel()) +
      '</span><h3 tabindex="-1" data-fresh-result-focus>QUARANTINED. EXACTLY WHERE IT BELONGS.</h3></div>' +
      "<p>" + esc(displayText(artifact.source.title)) + " // " + esc(artifact.source.date) +
      " // " + esc(artifact.source.laneLabel) + "</p>" +
      '<div class="intake-result-actions" data-fresh-actions></div></div>' +
      metricMarkup() + policyMarkup() +
      '<div class="intake-result-grid">' + chapterMarkup() +
      candidateListMarkup() + "</div>";
  }

  function structuralReportPassed(report) {
    return !!report &&
      report.ok === true &&
      report.scope === "structural-change-detection-only" &&
      report.authenticityVerified === false &&
      report.sourceContentVerified === false &&
      report.authorityVerified === false;
  }

  function actionMarkup() {
    var verification = engine.verifyExport(artifact);
    var structural = structuralReportPassed(verification);
    return '<button type="button" data-fresh-copy>COPY STRUCTURE-CHECKED JSON</button>' +
      '<button type="button" data-fresh-download>DOWNLOAD STRUCTURE-CHECKED ARTIFACT</button>' +
      '<small>' + (structural
        ? "STRUCTURAL RESTORE CHECK PASSED // AUTHENTICITY NOT VERIFIED"
        : "STRUCTURAL RESTORE CHECK HELD") +
      " // CHECKSUM IS NOT A SIGNATURE // " + esc(artifact.fingerprint) + "</small>";
  }

  function fallbackCopy(value) {
    var field = doc.createElement("textarea");
    field.value = value;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    doc.body.appendChild(field);
    field.select();
    var copied = false;
    try {
      copied = !!doc.execCommand && doc.execCommand("copy");
    } catch {}
    field.remove();
    if (copied) {
      announce(
        "STRUCTURE-CHECKED JSON COPIED // AUTHENTICITY NOT VERIFIED // RAW TRANSCRIPT OMITTED"
      );
    } else {
      announce("COPY BLOCKED // DOWNLOAD THE STRUCTURE-CHECKED ARTIFACT INSTEAD");
    }
  }

  function copyArtifact() {
    var payload;
    try {
      if (!structuralReportPassed(engine.verifyExport(artifact))) {
        announce("COPY HELD // STRUCTURAL RESTORE CHECK FAILED");
        return;
      }
      payload = engine.serialize(artifact);
    } catch (error) {
      announce("EXPORT HELD // " + clean(error.code || error.message));
      return;
    }
    if (root.navigator && root.navigator.clipboard &&
        typeof root.navigator.clipboard.writeText === "function") {
      root.navigator.clipboard.writeText(payload).then(function () {
        announce(
          "STRUCTURE-CHECKED JSON COPIED // AUTHENTICITY NOT VERIFIED // RAW TRANSCRIPT OMITTED"
        );
      }).catch(function () {
        fallbackCopy(payload);
      });
      return;
    }
    fallbackCopy(payload);
  }

  function downloadArtifact() {
    var payload;
    var report = engine.verifyExport(artifact);
    if (!structuralReportPassed(report)) {
      announce("EXPORT HELD // STRUCTURAL RESTORE CHECK FAILED");
      return;
    }
    try {
      payload = engine.serialize(artifact);
      var blob = new root.Blob([payload], {
        type: "application/json;charset=utf-8"
      });
      var url = root.URL.createObjectURL(blob);
      var link = doc.createElement("a");
      link.href = url;
      link.download = "wwam-fresh-intake-" + artifact.source.id + "-" +
        artifact.fingerprint + ".json";
      doc.body.appendChild(link);
      link.click();
      link.remove();
      root.setTimeout(function () { root.URL.revokeObjectURL(url); }, 0);
      announce(
        "STRUCTURE-CHECKED ARTIFACT DOWNLOADED // AUTHENTICITY NOT VERIFIED // RAW TRANSCRIPT OMITTED"
      );
    } catch (error) {
      announce("DOWNLOAD HELD // " + clean(error.message || error));
    }
  }

  function bindResultActions() {
    var actions = elements.output.querySelector("[data-fresh-actions]");
    if (actions) actions.innerHTML = actionMarkup();
    var copyButton = elements.output.querySelector("[data-fresh-copy]");
    var downloadButton = elements.output.querySelector("[data-fresh-download]");
    var moreButton = elements.output.querySelector("[data-fresh-more]");
    if (copyButton) copyButton.onclick = copyArtifact;
    if (downloadButton) downloadButton.onclick = downloadArtifact;
    if (moreButton) {
      moreButton.onclick = function () {
        visibleCandidates += 36;
        renderArtifact(false);
        var next = elements.output.querySelector(
          ".intake-candidate:nth-child(" + Math.max(1, visibleCandidates - 35) + ")"
        );
        if (next) {
          next.setAttribute("tabindex", "-1");
          next.focus();
        }
      };
    }
  }

  function renderArtifact(shouldFocus) {
    elements.output.innerHTML = artifact.status === "held"
      ? heldMarkup()
      : quarantinedMarkup();
    bindResultActions();
    if (lastNotice) elements.status.textContent = lastNotice;
    if (shouldFocus) focusResult();
  }

  function errorGuidance(code) {
    var messages = {
      INVALID_SOURCE_ID:
        "Use the exact 11-character YouTube video ID.",
      INVALID_SOURCE_URL:
        "Use an official HTTPS youtube.com or youtu.be video URL.",
      SOURCE_ID_MISMATCH:
        "The ID, URL, and transcript source binding must describe one video.",
      INVALID_SOURCE_DATE:
        "Use a real calendar date in YYYY-MM-DD form.",
      INVALID_SOURCE_DURATION:
        "Enter positive seconds or a valid MM:SS / HH:MM:SS duration.",
      INVALID_SOURCE_LANE:
        "Choose one source lane declared by this ChannelPack.",
      INVALID_SOURCE_TITLE:
        "Add a short, factual source title.",
      UNSUPPORTED_FORMAT:
        "Choose WebVTT, SRT, YouTube JSON3, or plain text.",
      PAYLOAD_TOO_LARGE:
        "Use a transcript smaller than the local intake boundary.",
      EMPTY_TRANSCRIPT:
        "Paste or choose a transcript before running intake."
    };
    return messages[code] ||
      "Check the source metadata and transcript format, then run the local intake again.";
  }

  function renderError(error) {
    var code = clean(error && error.code || "INTAKE_ERROR");
    var message = clean(error && error.message || String(error));
    artifact = null;
    elements.output.innerHTML =
      '<div class="intake-error"><span>FAILED CLOSED // ' + esc(code) +
      '</span><h3 tabindex="-1" data-fresh-result-focus>THE DROP NEVER ENTERED THE LEDGER.</h3>' +
      "<p>" + esc(message) + "</p><b>" + esc(errorGuidance(code)) +
      "</b></div>";
    announce("INTAKE HELD // " + code);
    focusResult();
  }

  function normalizeSourceEntry(origin) {
    var rawId = clean(elements.id.value);
    var rawUrl = clean(elements.url.value);
    var idFromId = youtubeId(rawId);
    var idFromUrl = youtubeId(rawUrl);
    var preferred = origin === "url" ? idFromUrl :
      origin === "id" ? idFromId : "";
    var conflict = idFromId && idFromUrl && idFromId !== idFromUrl;

    if (!conflict && preferred) {
      if (!rawId || idFromId === preferred) elements.id.value = preferred;
      if (!rawUrl || idFromUrl === preferred) {
        elements.url.value = "https://www.youtube.com/watch?v=" + preferred;
      }
    } else if (!conflict && !rawId && idFromUrl) {
      elements.id.value = idFromUrl;
      elements.url.value = "https://www.youtube.com/watch?v=" + idFromUrl;
    } else if (!conflict && !rawUrl && idFromId) {
      elements.id.value = idFromId;
      elements.url.value = "https://www.youtube.com/watch?v=" + idFromId;
    } else if (!conflict && idFromId && idFromUrl) {
      elements.id.value = idFromId;
      elements.url.value = "https://www.youtube.com/watch?v=" + idFromId;
    }
    return clean(elements.id.value);
  }

  function exactSampleLoaded() {
    return sampleActive &&
      clean(elements.id.value) === SAMPLE.id &&
      clean(elements.url.value) === SAMPLE.url &&
      clean(elements.title.value) === SAMPLE.title &&
      clean(elements.date.value) === SAMPLE.date &&
      clean(elements.duration.value) === SAMPLE.duration &&
      clean(elements.lane.value) === SAMPLE.lane &&
      clean(elements.format.value) === SAMPLE.format &&
      elements.transcript.value === SAMPLE.transcript;
  }

  function runIntake(event) {
    if (event) event.preventDefault();
    try {
      var id = normalizeSourceEntry();
      var seconds = durationSeconds(elements.duration.value);
      if (!elements.transcript.value) {
        var empty = new Error("Transcript content is required.");
        empty.code = "EMPTY_TRANSCRIPT";
        throw empty;
      }
      var isSample = exactSampleLoaded();
      artifact = engine.intake({
        source: {
          id: id,
          url: elements.url.value,
          title: elements.title.value,
          date: elements.date.value,
          durationSeconds: seconds,
          lane: elements.lane.value
        },
        transcript: {
          format: elements.format.value,
          sourceId: id,
          content: elements.transcript.value
        }
      });
      var report = engine.verifyExport(artifact);
      if (!structuralReportPassed(report)) {
        var invalid = new Error("The local artifact failed its restore check.");
        invalid.code = "INVALID_EXPORT";
        throw invalid;
      }
      artifactIsSample = isSample;
      visibleCandidates = 36;
      announce(artifact.status === "held"
        ? "UNTIMED INPUT HELD // ZERO CANDIDATES // STRUCTURE-CHECKED EXPORT READY"
        : artifact.metrics.candidates +
          " QUARANTINE CANDIDATES // STRUCTURAL RESTORE CHECK PASSED");
      renderArtifact(true);
    } catch (error) {
      renderError(error);
    }
  }

  function setSampleState(active) {
    sampleActive = !!active;
    section.setAttribute("data-fresh-sample", sampleActive ? "true" : "false");
  }

  function loadSample() {
    elements.id.value = SAMPLE.id;
    elements.url.value = SAMPLE.url;
    elements.title.value = SAMPLE.title;
    elements.date.value = SAMPLE.date;
    elements.duration.value = SAMPLE.duration;
    if (Array.prototype.some.call(elements.lane.options, function (option) {
      return option.value === SAMPLE.lane;
    })) elements.lane.value = SAMPLE.lane;
    elements.format.value = SAMPLE.format;
    elements.transcript.value = SAMPLE.transcript;
    elements.file.value = "";
    setSampleState(true);
    announce(
      "SYNTHETIC LOCAL DEMO LOADED // NOT A WWAM SOURCE // RUN WHEN READY"
    );
    elements.run.focus();
  }

  function burnInput() {
    elements.transcript.value = "";
    elements.file.value = "";
    setSampleState(false);
    announce(artifact
      ? "RAW INPUT CLEARED FROM FORM // BOUNDED ARTIFACT STILL IN MEMORY"
      : "RAW INPUT CLEARED FROM FORM // NOTHING WAS STORED");
    elements.transcript.focus();
  }

  function clearAll() {
    elements.form.reset();
    renderLaneOptions();
    elements.format.value = "webvtt";
    elements.file.value = "";
    artifact = null;
    artifactIsSample = false;
    visibleCandidates = 36;
    setSampleState(false);
    elements.output.innerHTML = emptyMarkup();
    announce("LOCAL INTAKE CLEARED // NOTHING PERSISTED");
    elements.id.focus();
  }

  function readFile() {
    var file = elements.file.files && elements.file.files[0];
    if (!file) return;
    var maxBytes = Number(engine && engine.limits.maxBytes) || 2000000;
    if (Number(file.size) > maxBytes) {
      var tooLarge = new Error(
        "The selected transcript exceeds the " +
        maxBytes.toLocaleString("en-US") + "-byte local boundary."
      );
      tooLarge.code = "PAYLOAD_TOO_LARGE";
      renderError(tooLarge);
      elements.file.value = "";
      return;
    }
    Promise.resolve(file.text()).then(function (content) {
      elements.transcript.value = content;
      elements.format.value = detectFormat(file.name, content);
      setSampleState(false);
      announce(
        "LOCAL FILE READ // " + clean(file.name) + " // " +
        elements.format.options[elements.format.selectedIndex].text
      );
      elements.transcript.focus();
    }).catch(function () {
      var readError = new Error(
        "The browser could not read this local transcript file."
      );
      readError.code = "FILE_READ_ERROR";
      renderError(readError);
    });
  }

  function bind() {
    elements.form.addEventListener("submit", runIntake);
    elements.sample.addEventListener("click", loadSample);
    elements.burn.addEventListener("click", burnInput);
    elements.clear.addEventListener("click", clearAll);
    elements.file.addEventListener("change", readFile);
    elements.url.addEventListener("change", function () {
      normalizeSourceEntry("url");
    });
    elements.id.addEventListener("change", function () {
      normalizeSourceEntry("id");
    });
    elements.form.addEventListener("input", function (event) {
      if (event && event.target !== elements.file && sampleActive) {
        setSampleState(false);
      }
    });
  }

  function init() {
    try {
      if (!root.ShokkerChannelPack ||
          !root.WWAM_CHANNEL_DNA ||
          !root.WWAM_CHANNEL_PACK_ADAPTER ||
          !root.ShokkerFreshTapeIntakeEngine) {
        throw new Error("Fresh Tape Intake dependencies are unavailable.");
      }
      channelPack = root.ShokkerChannelPack.compile(
        root.WWAM_CHANNEL_DNA,
        root.WWAM_CHANNEL_PACK_ADAPTER
      );
      engine = root.ShokkerFreshTapeIntakeEngine.create({
        channelPack: channelPack,
        rules: rules()
      });
      renderLaneOptions();
      renderRules();
      renderProof();
      bind();
      elements.output.innerHTML = emptyMarkup();
      section.setAttribute("aria-busy", "false");
      section.setAttribute("data-fresh-intake-ready", "true");
      announce("LOCAL DROP ZONE READY // NOTHING LEAVES THIS BROWSER");
    } catch (error) {
      section.setAttribute("aria-busy", "false");
      section.setAttribute("data-fresh-intake-ready", "false");
      elements.proof.innerHTML =
        "<article><span>INTAKE HELD</span><b>FAIL-CLOSED</b><p>" +
        esc(error.code || error.message || String(error)) + "</p></article>";
      elements.output.innerHTML =
        '<div class="intake-error"><span>ENGINE UNAVAILABLE</span>' +
        '<h3 tabindex="-1" data-fresh-result-focus>THE DROP ZONE STAYED CLOSED.</h3>' +
        "<p>" + esc(error.code || error.message || String(error)) + "</p></div>";
      Array.prototype.forEach.call(
        elements.form.querySelectorAll("input, select, textarea, button"),
        function (control) { control.disabled = true; }
      );
      announce("LOCAL INTAKE HELD // ENGINE FAILED CLOSED");
    }
  }

  init();
})(typeof window !== "undefined" ? window : globalThis);
