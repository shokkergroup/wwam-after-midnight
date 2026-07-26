(function (root) {
  "use strict";

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

  function duration(value) {
    var total = Math.max(0, Math.round(Number(value) || 0));
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor(total % 3600 / 60);
    return hours ? hours + "H " + String(minutes).padStart(2, "0") + "M" :
      minutes + "M";
  }

  function date(value) {
    var parts = clean(value).split("-");
    return parts.length === 3 ? parts[1] + "." + parts[2] + "." + parts[0] :
      clean(value);
  }

  function sourceBriefUrl(item) {
    return "./?source=" + encodeURIComponent(item.id) +
      "&section=wiki#archive";
  }

  function saveJson(filename, value) {
    var blob = new Blob([JSON.stringify(value, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }

  var toastTimer = 0;
  function toast(message) {
    var node = document.getElementById("runwayToast");
    if (!node) return;
    node.textContent = clean(message);
    node.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      node.classList.remove("show");
    }, 2600);
  }

  function fallbackCopy(value) {
    var field = document.createElement("textarea");
    field.value = value;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    var copied = false;
    try {
      copied = Boolean(document.execCommand && document.execCommand("copy"));
    } catch {}
    field.remove();
    return copied;
  }

  function copyText(value, message) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      navigator.clipboard.writeText(value).then(function () {
        toast(message);
      }).catch(function () {
        toast(fallbackCopy(value) ? message : "COPY BLOCKED // DOWNLOAD INSTEAD");
      });
      return;
    }
    toast(fallbackCopy(value) ? message : "COPY BLOCKED // DOWNLOAD INSTEAD");
  }

  var atlasEngine;
  var worklist;
  var all = [];
  var active = null;
  var state = {
    query: "",
    workType: "",
    year: "",
    limit: 24,
  };

  function workLabel(item) {
    return item.workType === "recover-caption"
      ? "RECOVER CAPTION PATH"
      : "ACQUIRE TIMED CAPTIONS";
  }

  function workScore(item) {
    var priority = item.atlasPriority;
    if (!priority) {
      return '<div class="work-score"><span><b>KNOWN</b>CAPTION GAP</span>' +
        '<span><b>HOLD</b>CONTENT CLAIMS</span><span><b>REVIEW</b>ACCESS + RIGHTS</span></div>';
    }
    return '<div class="work-score"><span><b>' +
      Number(priority.breakdown.popularity || 0).toFixed(1) +
      '</b>VIEW GRAVITY / 50</span><span><b>' +
      Number(priority.breakdown.recency || 0).toFixed(1) +
      '</b>RECENCY / 30</span><span><b>' +
      Number(priority.breakdown.franchise || 0).toFixed(1) +
      '</b>TITLE SIGNAL / 20</span></div>';
  }

  function card(item) {
    var rank = item.workType === "acquire-caption" && item.atlasPriority
      ? "ATLAS #" + String(item.atlasPriority.rank).padStart(3, "0")
      : "RECOVERY #" + String(item.laneRank).padStart(2, "0");
    return '<article class="work-card" data-work-source="' + esc(item.id) + '">' +
      '<div class="work-card-media"><img loading="lazy" src="' +
      esc(item.thumbnail) + '" alt=""><span>' + esc(rank) + '</span><b>' +
      esc(duration(item.duration)) + '</b></div><div class="work-card-body">' +
      '<span class="work-kicker">' + esc(workLabel(item)) + ' // ' +
      esc(date(item.date)) + '</span><h3>' + esc(item.displayTitle || item.title) +
      '</h3><p class="work-next">' + esc(item.nextAction) + '</p>' +
      workScore(item) + '<div class="work-actions"><button type="button" ' +
      'data-runway-action="inspect" data-source-id="' + esc(item.id) +
      '">OPEN WORK ITEM</button><a href="' + esc(sourceBriefUrl(item)) +
      '">OPEN SOURCE BRIEF</a><a href="' + esc(item.url) +
      '" target="_blank" rel="noopener">INSPECT OFFICIAL UPLOAD &#8599;</a>' +
      '</div></div></article>';
  }

  function recoveryCard(item) {
    return '<article class="recovery-card"><img loading="lazy" src="' +
      esc(item.thumbnail) + '" alt=""><div><span>RECOVERY #' +
      String(item.laneRank).padStart(2, "0") + ' // ' +
      esc(item.availability.toUpperCase()) + '</span><h3>' +
      esc(item.displayTitle || item.title) + '</h3><p>' +
      esc(item.nextAction) + '</p><button type="button" data-runway-action="inspect" ' +
      'data-source-id="' + esc(item.id) + '">OPEN RECOVERY FILE</button></div></article>';
  }

  function renderProof() {
    var stats = worklist.getStats();
    var rows = [
      [stats.workItems, "UNFINISHED SOURCE BRIEFS"],
      [stats.acquireCaptions, "CAPTION ACQUISITION JOBS"],
      [stats.recoverCaptions, "CAPTION RECOVERY JOBS"],
      [40, "TEN-SOURCE WORK COHORTS"],
      [stats.contentClaims, "CONTENT CLAIMS FROM TITLES"],
      [stats.autoPromotions, "AUTOMATIC PROMOTIONS"],
    ];
    document.getElementById("runwayProof").innerHTML = rows.map(function (row) {
      return "<article><b>" + esc(number(row[0])) + "</b><span>" +
        esc(row[1]) + "</span></article>";
    }).join("");
  }

  function filtered() {
    var needle = clean(state.query).toLowerCase();
    return all.filter(function (item) {
      if (state.workType && item.workType !== state.workType) return false;
      if (state.year && item.date.slice(0, 4) !== state.year) return false;
      if (!needle) return true;
      return [
        item.id,
        item.title,
        item.displayTitle,
        item.date,
        item.workType,
      ].join(" ").toLowerCase().includes(needle);
    });
  }

  function renderWorklist() {
    var matches = filtered();
    var visible = matches.slice(0, state.limit);
    var grid = document.getElementById("runwayGrid");
    grid.innerHTML = visible.length
      ? visible.map(card).join("")
      : '<p class="loading">No canonical source metadata matches those filters.</p>';
    document.getElementById("runwayStatus").textContent =
      number(visible.length) + " SHOWN // " + number(matches.length) +
      " MATCHED // " + number(all.length) + " TOTAL WORK ITEMS";
    var more = document.getElementById("runwayMore");
    more.hidden = visible.length >= matches.length;
    more.textContent = "Open " +
      number(Math.min(24, matches.length - visible.length)) + " more work items";
  }

  function renderRecovery() {
    var recovery = worklist.getWorklist({
      workType: "recover-caption",
    }).records;
    document.getElementById("runwayRecovery").innerHTML =
      recovery.map(recoveryCard).join("");
  }

  function renderYears() {
    var counts = all.reduce(function (output, item) {
      var year = item.date.slice(0, 4);
      output[year] = (output[year] || 0) + 1;
      return output;
    }, {});
    var years = Object.keys(counts).sort().reverse();
    document.getElementById("runwayYear").innerHTML =
      '<option value="">ALL YEARS // ' + all.length + '</option>' +
      years.map(function (year) {
        return '<option value="' + esc(year) + '">' + esc(year) + " // " +
          counts[year] + "</option>";
      }).join("");
  }

  function detailMarkup(item) {
    var packet = worklist.getStagePacket(item.id);
    var rank = item.workType === "acquire-caption" && item.atlasPriority
      ? "ATLAS PRIORITY #" + item.atlasPriority.rank + " // SCORE " +
        Number(item.atlasPriority.score || 0).toFixed(1)
      : "CAPTION RECOVERY #" + item.laneRank;
    var facts = [
      ["UPLOAD", date(item.date)],
      ["RUNTIME", duration(item.duration)],
      ["CACHED VIEWS", number(item.views)],
      ["SOURCE ID", item.id],
    ];
    return '<article class="work-detail"><header><div><span class="work-detail-label">' +
      esc(workLabel(item)) + '</span><h2 id="runwayDialogTitle">' +
      esc(item.displayTitle || item.title) + '</h2><p>' + esc(rank) +
      '</p></div><b>#' + String(item.workRank).padStart(3, "0") +
      '</b></header><p>' + esc(item.nextAction) + '</p><div class="work-detail-facts">' +
      facts.map(function (fact) {
        return '<span><small>' + esc(fact[0]) + '</small><b>' +
          esc(fact[1]) + '</b></span>';
      }).join("") + '</div><div class="work-detail-policy">' +
      '<span>TRANSCRIPT REGISTERED // NO</span><span>CONTENT CLAIMS // SEALED</span>' +
      '<span>SPEAKER DIARIZED // NO</span><span>VISUAL CONTEXT VERIFIED // NO</span>' +
      '<span>PROMOTION ALLOWED // NO</span><span>NEXT VALID STATE // QUARANTINE</span>' +
      '</div><div class="work-detail-actions"><button type="button" ' +
      'data-runway-action="copy-packet" data-source-id="' + esc(item.id) +
      '">COPY STAGE PACKET</button><button type="button" ' +
      'data-runway-action="download-packet" data-source-id="' + esc(item.id) +
      '">DOWNLOAD STAGE PACKET</button><a href="' + esc(sourceBriefUrl(item)) +
      '">OPEN SOURCE BRIEF</a><a href="' + esc(item.url) +
      '" target="_blank" rel="noopener">OPEN OFFICIAL UPLOAD &#8599;</a></div>' +
      '<code>EXPECTED PRIVATE CACHE BINDING // ' +
      esc(packet.transcript.expectedCacheBinding) + '<br>WORK ITEM // ' +
      esc(packet.workItemFingerprint) + '<br>WORKLIST // ' +
      esc(packet.worklistFingerprint) + '</code></article>';
  }

  function openDetail(id) {
    var item = worklist.getRecord(id);
    if (!item) return;
    active = item;
    document.getElementById("runwayDialogContent").innerHTML = detailMarkup(item);
    var dialog = document.getElementById("runwayDialog");
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function packetFor(id) {
    return worklist.getStagePacket(id || active && active.id);
  }

  function handleAction(event) {
    var control = event.target.closest("[data-runway-action]");
    if (!control) return;
    var action = control.getAttribute("data-runway-action");
    var id = control.getAttribute("data-source-id");
    if (action === "inspect") openDetail(id);
    else if (action === "copy-packet") {
      var copyPacket = packetFor(id);
      if (copyPacket) {
        copyText(
          JSON.stringify(copyPacket, null, 2),
          "SOURCE-BOUND STAGE PACKET COPIED // TIMED CAPTIONS STILL REQUIRED"
        );
      }
    } else if (action === "download-packet") {
      var downloadPacket = packetFor(id);
      if (downloadPacket) {
        saveJson("wwam-distill-stage-" + downloadPacket.source.id + ".json", downloadPacket);
        toast("STAGE PACKET DOWNLOADED // NO TRANSCRIPT OR CONTENT CLAIMS INCLUDED");
      }
    }
  }

  function bind() {
    document.addEventListener("click", handleAction);
    document.getElementById("runwaySearch").addEventListener("input", function (event) {
      state.query = event.target.value;
      state.limit = 24;
      renderWorklist();
    });
    document.getElementById("runwayType").addEventListener("change", function (event) {
      state.workType = event.target.value;
      state.limit = 24;
      renderWorklist();
    });
    document.getElementById("runwayYear").addEventListener("change", function (event) {
      state.year = event.target.value;
      state.limit = 24;
      renderWorklist();
    });
    document.getElementById("runwayReset").addEventListener("click", function () {
      state = { query: "", workType: "", year: "", limit: 24 };
      document.getElementById("runwaySearch").value = "";
      document.getElementById("runwayType").value = "";
      document.getElementById("runwayYear").value = "";
      renderWorklist();
    });
    document.getElementById("runwayMore").addEventListener("click", function () {
      state.limit += 24;
      renderWorklist();
    });
    document.getElementById("runwayDownload").addEventListener("click", function () {
      saveJson("wwam-complete-distill-worklist.json", worklist.exportManifest());
      toast("COMPLETE " + worklist.getStats().workItems + "-SOURCE WORKLIST DOWNLOADED");
    });
  }

  function fail(error) {
    var message = clean(error && error.message || error);
    document.getElementById("runwayStatus").textContent =
      "WORKLIST HELD // " + message;
    document.getElementById("runwayGrid").innerHTML =
      '<p class="loading">The worklist failed closed. No plausible replacement ledger was rendered.</p>';
    document.getElementById("runwayRecovery").innerHTML =
      '<p class="loading">Recovery ledger unavailable.</p>';
  }

  function init() {
    try {
      if (!root.WWAM_ARCHIVE_ATLAS || !root.WWAM_CATALOG ||
          !root.WWAMArchiveAtlasEngine || !root.ShokkerDistillWorklist) {
        throw new Error("Canonical worklist dependencies are unavailable.");
      }
      atlasEngine = root.WWAMArchiveAtlasEngine.create(root.WWAM_ARCHIVE_ATLAS);
      worklist = root.ShokkerDistillWorklist.create({
        atlas: root.WWAM_ARCHIVE_ATLAS,
        atlasEngine: atlasEngine,
        catalog: root.WWAM_CATALOG,
        channel: { id: "wwam", label: "We Watched A Movie" },
      });
      var verification = worklist.verifyFingerprint();
      if (!verification.ok) {
        throw new Error("The worklist fingerprint did not reproduce.");
      }
      all = worklist.getWorklist().records;
      renderProof();
      renderRecovery();
      renderYears();
      renderWorklist();
      bind();
      var download = document.getElementById("runwayDownload");
      download.disabled = false;
      document.getElementById("runwayFingerprint").textContent =
        worklist.exportManifest().fingerprint +
        " // STRUCTURAL CHANGE DETECTION, NOT AUTHENTICATION";
    } catch (error) {
      fail(error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : globalThis);
