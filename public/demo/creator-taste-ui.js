(function (root) {
  "use strict";

  var section = document.getElementById("cut-test");
  if (!section || !root.ShokkerCreatorTasteCalibration) return;

  var elements = {
    proof: document.getElementById("cutTestProof"),
    launch: document.getElementById("cutTestLaunch"),
    goal: document.getElementById("cutTestGoal"),
    risk: document.getElementById("cutTestRisk"),
    start: document.getElementById("cutTestStart"),
    stage: document.getElementById("cutTestStage"),
    results: document.getElementById("cutTestResults"),
    live: null
  };
  var clipLab;
  var channelPack;
  var engine;
  var session;
  var artifact;
  var storageKey = "";
  var lastNotice = "";

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

  function announce(message) {
    if (!elements.live) return;
    elements.live.textContent = clean(message);
  }

  function focusInside(container, selector) {
    var target = container && container.querySelector(selector);
    if (!target || typeof target.focus !== "function") return;
    try {
      target.focus({ preventScroll: true });
    } catch {
      target.focus();
    }
  }

  function fmt(value) {
    return Number(value || 0).toLocaleString("en-US");
  }

  function displayText(value) {
    var text = clean(value);
    if (!document.body.classList.contains("office-bleep")) return text;
    return text.replace(
      /\b(fuck(?:ing|ed|er|ers)?|shit(?:ty|ting)?|dick|cock|pussy|cunt|asshole|bitch(?:es)?|goddamn)\b/gi,
      "[BLEEP]"
    );
  }

  function copy(value, message, focusSelector) {
    var text = String(value || "");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        lastNotice = message;
        announce(message);
        renderResults(focusSelector);
      }).catch(function () {
        fallbackCopy(text, message, focusSelector);
      });
      return;
    }
    fallbackCopy(text, message, focusSelector);
  }

  function fallbackCopy(text, message, focusSelector) {
    var field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    try {
      document.execCommand("copy");
      lastNotice = message;
      announce(message);
    } catch {
      lastNotice = "COPY BLOCKED // DOWNLOAD THE REPRODUCIBLE ARTIFACT INSTEAD";
      announce(lastNotice);
    }
    field.remove();
    renderResults(focusSelector);
  }

  function download(name, contents) {
    var blob = new Blob([contents], { type: "application/json;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }

  function buildCore() {
    var catalog = root.WWAM_CATALOG || {};
    var deep = root.WWAM_DEEP_DISTILL || {};
    var live = root.WWAM_LIVESTREAMS || {};
    var popular = root.WWAM_POPULAR_LIVE || {};
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
    clipLab = root.WWAMCreatorClipLab.create(showcase);
    channelPack = root.ShokkerChannelPack.compile(
      dna,
      root.WWAM_CHANNEL_PACK_ADAPTER
    );
  }

  function tasteAdapter(risk) {
    return {
      maxRisk: risk,
      labels: {
        product: "THE CUT TEST",
        operator: "UNAUTHENTICATED LOCAL OPERATOR",
        round: "CUT TEST ROUND",
        optionA: "CUT A",
        optionB: "CUT B",
        neither: "CLIP NEITHER",
        needsContext: "NEEDS CONTEXT",
        baseline: "UNTOUCHED MACHINE TOP 12",
        calibrated: "YOUR LOCAL CUT 12",
        categoryFacet: "WWAM SIGNAL",
        topicFacet: "MOVIE / TOPIC",
        entityFacet: "RECURRING CHARACTER",
        runtimeFacet: "EDIT RUNTIME",
        sourceTypeFacet: "SOURCE LANE"
      }
    };
  }

  function createEngine(goal, risk) {
    var created = root.ShokkerCreatorTasteCalibration.create({
      channelPack: channelPack,
      channelId: "wwam",
      clipLab: clipLab,
      maxRisk: risk,
      goal: goal,
      adapter: tasteAdapter(risk)
    });
    storageKey = [
      "wwam:creator-taste:v1",
      channelPack.fingerprint,
      clipLab.inputFingerprint,
      created.binding.goal,
      created.policy.maxRisk
    ].join(":");
    return created;
  }

  function renderProof() {
    if (!engine) {
      elements.proof.innerHTML =
        "<article><span>CALIBRATION ENGINE</span><b>READY TO DECLARE A TEST</b><p>Explicit choices only; no preference exists yet.</p></article>";
      return;
    }
    var progress = session ? session.getProgress() : null;
    var cards = [
      [fmt(engine.inventory.eligible), "ELIGIBLE EXACT-LEDGER CUTS",
        fmt(engine.inventory.eligibleSources) + " sources inside the " +
          engine.policy.maxRisk + " risk cap"],
      [engine.policy.rounds, "BLIND MATCHUPS",
        engine.policy.repeatChecks + " deterministic consistency checks included"],
      ["±" + engine.policy.modifierRange[1], "MAX TASTE MOVEMENT",
        "Risk, evidence, HOLD, canon, and speaker state cannot move"],
      [progress ? progress.completed + " / " + progress.required : "0 / 12",
        "EXPLICIT LOCAL CHOICES",
        "UNAUTHENTICATED LOCAL OPERATOR // NOT CREATOR APPROVAL"]
    ];
    elements.proof.innerHTML = cards.map(function (card) {
      return "<article><span>" + esc(card[1]) + "</span><b>" + esc(card[0]) +
        "</b><p>" + esc(card[2]) + "</p></article>";
    }).join("");
  }

  function candidateMarkup(candidate, side) {
    var topics = (candidate.topics || []).slice(0, 3).map(function (topic) {
      return topic.label || topic.id;
    }).filter(Boolean);
    return '<article class="cut-candidate" data-cut-side="' + side + '">' +
      "<header><span>CUT " + side + " // " + esc(candidate.category) + "</span><b>" +
      esc(candidate.durationSeconds + " SEC") + "</b></header>" +
      "<blockquote>“" + esc(displayText(candidate.excerpt.text)) + "”</blockquote>" +
      "<p>" + esc(candidate.sourceTitle) + " // " + esc(candidate.timecode) + "</p>" +
      "<dl><div><dt>EVIDENCE</dt><dd>" + esc(candidate.evidence.label) +
      "</dd></div><div><dt>CONTEXT RISK</dt><dd>" + esc(candidate.risk.label) +
      "</dd></div><div><dt>TOPIC</dt><dd>" +
      esc(topics.join(" · ") || "NO TOPIC LABEL") + "</dd></div></dl>" +
      '<a href="' + esc(candidate.receiptUrl) +
      '" target="_blank" rel="noopener">WATCH THE SURROUNDING TAPE ↗</a></article>';
  }

  function persistProgress() {
    if (!engine || !session) return;
    var payload = {
      schema: "wwam.cut-test-progress/v1",
      binding: engine.binding,
      choices: session.getDecisionLedger().map(function (decision) {
        return { roundId: decision.roundId, choice: decision.choice };
      })
    };
    try { localStorage.setItem(storageKey, JSON.stringify(payload)); } catch {}
  }

  function clearProgress() {
    try { localStorage.removeItem(storageKey); } catch {}
  }

  function resumeProgress() {
    var raw = "";
    try { raw = localStorage.getItem(storageKey) || ""; } catch {}
    if (!raw) return false;
    try {
      var saved = JSON.parse(raw);
      if (saved.schema !== "wwam.cut-test-progress/v1" ||
          JSON.stringify(saved.binding) !== JSON.stringify(engine.binding) ||
          !Array.isArray(saved.choices)) return false;
      var rounds = session.getRounds();
      saved.choices.forEach(function (decision, index) {
        if (!rounds[index] || rounds[index].id !== decision.roundId) {
          throw new Error("round blueprint changed");
        }
        session.decide(decision.roundId, decision.choice);
      });
      lastNotice = "LOCAL CUT TEST RESUMED // " +
        session.getProgress().completed + " DECISIONS RESTORED";
      return true;
    } catch {
      clearProgress();
      lastNotice = "SAVED CUT TEST HELD // THE INPUT SNAPSHOT CHANGED";
      return false;
    }
  }

  function finishOrHold(shouldFocus) {
    var progress = session.getProgress();
    if (progress.completed < progress.required) return false;
    if (!progress.minimumReached) {
      elements.stage.innerHTML =
        '<div class="cut-result-head"><div><span>CALIBRATION HELD</span>' +
        '<h3 tabindex="-1" data-cut-result-focus>THE TEST NEEDS MORE ACTUAL PREFERENCES.</h3></div><p>Only ' +
        progress.learningDecisions + " A/B choices were eligible to teach taste; " +
        progress.minimumPreferenceDecisions + " are required. NEEDS CONTEXT and NEITHER " +
        'correctly taught the model nothing.</p><div class="cut-export-actions">' +
        '<button type="button" data-cut-reset>RESET AND RETAKE</button></div></div>';
      var reset = elements.stage.querySelector("[data-cut-reset]");
      if (reset) reset.onclick = resetTest;
      clearProgress();
      renderProof();
      announce("Calibration held. At least six non-repeat A/B choices are required.");
      if (shouldFocus) {
        focusInside(elements.stage, "[data-cut-result-focus]");
      }
      return true;
    }
    try {
      artifact = session.finalize();
      clearProgress();
      elements.stage.innerHTML = "";
      renderResults(shouldFocus);
    } catch (error) {
      elements.stage.innerHTML = '<p class="cut-notice">CALIBRATION HELD // ' +
        esc(error.code || error.message || String(error)) + "</p>";
      announce("Calibration held. " + clean(error.code || error.message));
    }
    return true;
  }

  function renderRound(shouldFocus) {
    if (!session) return;
    if (finishOrHold(shouldFocus)) return;
    var round = session.getCurrentRound();
    var progress = session.getProgress();
    var percent = Math.round(progress.completed / progress.required * 100);
    elements.stage.innerHTML =
      '<div class="cut-round"><header class="cut-round-head" tabindex="-1" data-cut-round-focus><span>' +
      esc(round.label) + '</span><div class="cut-progress" role="progressbar" aria-valuemin="0" ' +
      'aria-valuemax="' + progress.required + '" aria-valuenow="' + progress.completed +
      '"><i style="--cut-progress:' + percent + '%"></i></div><b>' +
      progress.completed + " / " + progress.required + " LOCKED</b></header>" +
      '<div class="cut-matchup">' + candidateMarkup(round.optionA, "A") +
      '<div class="cut-versus">VS</div>' + candidateMarkup(round.optionB, "B") +
      '</div><div class="cut-decisions">' +
      '<button type="button" data-cut-decision="A">CLIP A</button>' +
      '<button type="button" data-cut-decision="B">CLIP B</button>' +
      '<button type="button" data-cut-decision="NEITHER">CLIP NEITHER</button>' +
      '<button type="button" data-cut-decision="NEEDS_CONTEXT">NEEDS CONTEXT</button>' +
      '</div><p class="cut-notice">' +
      esc(lastNotice || "Machine priority is hidden during the matchup. Watch either receipt before choosing; the decision stores exact source, timestamp, and receipt IDs.") +
      "</p></div>";
    Array.prototype.forEach.call(
      elements.stage.querySelectorAll("[data-cut-decision]"),
      function (button) {
        button.onclick = function () {
          var choice = button.getAttribute("data-cut-decision");
          try {
            session.decide(round.id, choice);
            lastNotice = choice === "NEEDS_CONTEXT"
              ? "CONTEXT ROUTE RECORDED // ZERO PREFERENCE WEIGHT"
              : choice === "NEITHER"
                ? "NEITHER RECORDED // ZERO PREFERENCE WEIGHT"
                : "EXPLICIT LOCAL CHOICE LOCKED // " + choice;
            persistProgress();
            renderProof();
            announce(lastNotice);
            renderRound(true);
          } catch (error) {
            lastNotice = "DECISION HELD // " + clean(error.code || error.message);
            announce(lastNotice);
            renderRound(true);
          }
        };
      }
    );
    renderProof();
    if (shouldFocus) {
      focusInside(elements.stage, "[data-cut-round-focus]");
    }
  }

  function movement(item) {
    var delta = Number(item.baselineRank) - Number(item.calibratedRank);
    return delta > 0 ? "↑" + delta : delta < 0 ? "↓" + Math.abs(delta) : "—";
  }

  function rankCard(item, baseline) {
    var delta = baseline ? "BASE " + item.baselineRank :
      movement(item) + " // " +
      (Number(item.preferenceModifier) >= 0 ? "+" : "") +
      Number(item.preferenceModifier || 0).toFixed(2);
    var className = !baseline && Number(item.baselineRank) > Number(item.calibratedRank)
      ? " is-up"
      : !baseline && Number(item.baselineRank) < Number(item.calibratedRank)
        ? " is-down"
        : "";
    var reason = baseline
      ? item.category + " // " + item.risk.label + " RISK // UNTOUCHED"
      : (item.calibrationReasons || []).slice(0, 1).join(" ") ||
        "No learned feature changed this candidate.";
    return '<article class="cut-rank-card' + className + '"><b>#' +
      String(baseline ? item.baselineRank : item.calibratedRank).padStart(2, "0") +
      "</b><div><h4>" + esc(displayText(item.excerpt.text)) + "</h4><p>" +
      esc(item.sourceTitle + " @ " + item.timecode + " // " + reason) +
      '</p></div><span>' + esc(delta) + "</span></article>";
  }

  function profileSentence() {
    if (!artifact) return "";
    var weights = (artifact.preferenceModel.featureWeights || []).filter(function (weight) {
      return Number(weight.weight) !== 0;
    }).slice(0, 4);
    if (!weights.length) {
      return "The explicit choices produced no stable feature movement; the baseline remains the honest cut.";
    }
    return "This local sample leaned " + weights.map(function (weight) {
      return (weight.weight > 0 ? "toward " : "away from ") +
        weight.valueLabel.toLowerCase();
    }).join(", ") + ". Descriptive only—not creator approval or a comedy verdict.";
  }

  function renderResults(shouldFocus) {
    if (!artifact) {
      elements.results.innerHTML = "";
      return;
    }
    var metrics = artifact.metrics;
    var verify = engine.verify(artifact);
    elements.results.innerHTML =
      '<div class="cut-result-head"><div><span>CALIBRATED LOCAL PREFERENCE // HUMAN APPROVAL NOT IMPLIED</span>' +
      '<h3 tabindex="-1" data-cut-result-focus>YOUR CUT, WITH THE MACHINE LEFT INTACT.</h3></div><p>' +
      esc(profileSentence()) + " " + esc(
        metrics.exactLedger.coveragePercent + "% exact-ledger coverage; " +
        metrics.safety.holdOverrides + " HOLD overrides; " +
        metrics.safety.riskMutations + " risk mutations; " +
        metrics.safety.protectedMutationTotal + " total protected-field mutations."
      ) + '</p><div class="cut-export-actions">' +
      '<button type="button" data-cut-copy>COPY REPRODUCIBLE ARTIFACT</button>' +
      '<button type="button" data-cut-download>DOWNLOAD JSON</button>' +
      '<button type="button" data-cut-reset>NEW CUT TEST</button></div></div>' +
      '<div class="cut-test-proof">' +
      "<article><span>RESTORE CHECK</span><b>" + (verify.ok ? "BYTE-BOUND" : "HELD") +
      "</b><p>Checksum is a consistency check, never a signature.</p></article>" +
      "<article><span>SHORTLIST DELTA</span><b>" +
      metrics.shortlistDelta.membershipChanges + " IN / OUT</b><p>" +
      metrics.shortlistDelta.positionChanges + " positions changed under the ±6 cap.</p></article>" +
      "<article><span>REPEAT CHECKS</span><b>" +
      metrics.repeatChecks.consistent + " / " + metrics.repeatChecks.scored +
      "</b><p>Descriptive consistency only; no identity authentication.</p></article>" +
      "<article><span>CONTEXT EXCLUSIONS</span><b>" +
      metrics.needsContextExcluded + "</b><p>Every context hold contributed zero taste weight.</p></article></div>" +
      '<div class="cut-result-grid"><section class="cut-ranking"><header><span>BASELINE // RECOVERABLE</span>' +
      "<b>UNTOUCHED MACHINE 12</b></header>" +
      artifact.shortlists.baseline.map(function (item) {
        return rankCard(item, true);
      }).join("") + '</section><section class="cut-ranking"><header><span>LOCAL CALIBRATION // ±6 MAX</span>' +
      "<b>YOUR CUT 12</b></header>" +
      artifact.shortlists.calibrated.map(function (item) {
        return rankCard(item, false);
      }).join("") + "</section></div>" +
      (lastNotice ? '<p class="cut-notice">' + esc(lastNotice) + "</p>" : "");
    var copyButton = elements.results.querySelector("[data-cut-copy]");
    var downloadButton = elements.results.querySelector("[data-cut-download]");
    var resetButton = elements.results.querySelector("[data-cut-reset]");
    if (copyButton) copyButton.onclick = function () {
      copy(
        session.exportJSON(2),
        "REPRODUCIBLE CUT TEST ARTIFACT COPIED",
        "[data-cut-copy]"
      );
    };
    if (downloadButton) downloadButton.onclick = function () {
      download("wwam-cut-test-" + artifact.fingerprint + ".json", session.exportJSON(2));
      lastNotice = "CUT TEST ARTIFACT DOWNLOADED // NO MEDIA INCLUDED";
      announce(lastNotice);
      renderResults("[data-cut-download]");
    };
    if (resetButton) resetButton.onclick = resetTest;
    renderProof();
    if (shouldFocus) {
      if (shouldFocus === true) {
        announce("Cut Test complete. Reproducible local artifact ready.");
        focusInside(elements.results, "[data-cut-result-focus]");
      } else {
        focusInside(elements.results, shouldFocus);
      }
    }
  }

  function resetTest() {
    clearProgress();
    session = null;
    artifact = null;
    engine = null;
    lastNotice = "";
    elements.stage.innerHTML = "";
    elements.results.innerHTML = "";
    elements.launch.hidden = false;
    renderProof();
    announce("Cut Test reset. No local preference profile is active.");
    elements.goal.focus();
  }

  function startTest() {
    var goal = clean(elements.goal.value || "shorts");
    var risk = clean(elements.risk.value || "MEDIUM").toUpperCase();
    try {
      engine = createEngine(goal, risk);
      session = engine.start();
      artifact = null;
      lastNotice = "";
      resumeProgress();
      elements.launch.hidden = true;
      elements.results.innerHTML = "";
      renderProof();
      announce("Cut Test started. Round one of twelve.");
      renderRound(true);
      elements.stage.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (error) {
      engine = null;
      session = null;
      elements.stage.innerHTML = '<p class="cut-notice">CUT TEST HELD // ' +
        esc(error.code || error.message || String(error)) + "</p>";
      announce("Cut Test held. " + clean(error.code || error.message));
      renderProof();
    }
  }

  function init() {
    try {
      buildCore();
      engine = createEngine("shorts", "MEDIUM");
      renderProof();
      engine = null;
      elements.start.onclick = startTest;
      elements.proof.removeAttribute("aria-live");
      elements.stage.removeAttribute("aria-live");
      elements.results.removeAttribute("aria-live");
      elements.live = document.getElementById("cutTestLiveStatus");
      if (!elements.live) {
        elements.live = document.createElement("p");
        elements.live.id = "cutTestLiveStatus";
        elements.live.className = "cut-notice";
        section.insertBefore(elements.live, elements.stage);
      }
      elements.live.setAttribute("role", "status");
      elements.live.setAttribute("aria-live", "polite");
      elements.live.setAttribute("aria-atomic", "true");
      section.setAttribute("aria-busy", "false");
      section.setAttribute("data-cut-test-ready", "true");
    } catch (error) {
      section.setAttribute("aria-busy", "false");
      section.setAttribute("data-cut-test-ready", "false");
      elements.proof.innerHTML =
        "<article><span>CUT TEST HELD</span><b>CALIBRATION FAILED CLOSED</b><p>" +
        esc(error.code || error.message || String(error)) + "</p></article>";
    }
  }

  init();
})(typeof window !== "undefined" ? window : globalThis);
