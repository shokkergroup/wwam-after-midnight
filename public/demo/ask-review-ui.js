(function (root) {
  "use strict";

  var STORAGE_KEY = "wwam-ask-review-queue-v1";

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function text(node) {
    return node && node.textContent ? node.textContent.replace(/\s+/g, " ").trim() : "";
  }

  function downloadJson(documentRef, name, payload) {
    var blob = new Blob([payload], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var anchor = documentRef.createElement("a");
    anchor.href = url;
    anchor.download = name;
    documentRef.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function parseSecond(value) {
    var raw = String(value || "").trim();
    if (!raw) return null;
    if (/^\d+(?:\.\d+)?$/.test(raw)) return Math.round(Number(raw));
    var parts = raw.split(":").map(Number);
    if (parts.length < 2 || parts.length > 3 ||
        parts.some(function (part) { return !Number.isFinite(part) || part < 0; }) ||
        parts.slice(1).some(function (part) { return part >= 60; })) return NaN;
    return Math.round(parts.reduce(function (total, part) { return total * 60 + part; }, 0));
  }

  function create(options) {
    var config = options || {};
    var engine = config.engine;
    var documentRef = config.document || root.document;
    var storage = config.storage;
    var now = config.now || function () { return new Date().toISOString(); };
    var queue = [];
    var reviewRoot = null;
    var form = null;
    var observer = null;
    var observedAt = "";
    var renderedQuery = "";
    var answerReady = false;
    var inputNode = null;

    if (!storage) {
      try {
        storage = root.localStorage;
      } catch {
        storage = null;
      }
    }

    if (!engine || typeof engine.createPacket !== "function") {
      throw new Error("Ask Review UI requires WWAMAskReviewEngine.");
    }

    function loadQueue() {
      if (!storage) return queue;
      try {
        var parsed = JSON.parse(storage.getItem(STORAGE_KEY) || "[]");
        queue = JSON.parse(engine.exportQueue(parsed)).packets;
      } catch {
        queue = [];
      }
      return queue;
    }

    function saveQueue() {
      if (!storage) return false;
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(queue));
        return true;
      } catch {
        return false;
      }
    }

    function resultSnapshot() {
      var results = documentRef.getElementById("askResults");
      var currentQuery = inputNode ? inputNode.value.trim() : "";
      if (!answerReady || !renderedQuery || currentQuery !== renderedQuery) {
        throw new Error("Submit this exact query and wait for its rendered answer before reviewing it.");
      }
      var answer = results && results.querySelector(".answer-brief");
      var boundary = results && results.querySelector(".ask-boundary");
      var answerSummary = answer && answer.querySelector(".derived-answer-copy, h3");
      var intentText = text(answer && answer.querySelector("span")).replace(/^INTENT\s*\/\/\s*/i, "");
      var entityText = text(answer && answer.querySelector("b")).replace(/^ENTITY\s*\/\/\s*/i, "");
      var statusText = text(boundary && boundary.querySelector("header span"))
        .replace(/^ANSWER STATUS\s*\/\/\s*/i, "");
      var receipts = results ? Array.prototype.map.call(
        results.querySelectorAll("[data-ask-source][data-id][data-time]"),
        function (button) {
          var article = button.closest("article");
          return {
            source: button.getAttribute("data-ask-source"),
            sourceId: button.getAttribute("data-id"),
            at: Number(button.getAttribute("data-time")),
            title: text(article && article.querySelector("h3")),
            evidenceLevel: text(article && article.querySelector("p span"))
          };
        }
      ) : [];
      return {
        query: renderedQuery,
        observedAt: observedAt || now(),
        answer: {
          readout: text(documentRef.getElementById("askStatus")),
          summary: text(answerSummary),
          answerStatus: statusText,
          intent: intentText,
          entity: entityText,
          resultCount: receipts.length
        },
        receipts: receipts
      };
    }

    function setActionsReady(ready) {
      var helpful = reviewRoot.querySelector("[data-ask-review-helpful]");
      var open = reviewRoot.querySelector("[data-ask-review-open]");
      helpful.disabled = !ready;
      open.disabled = !ready;
      open.setAttribute("aria-expanded", form && !form.hidden ? "true" : "false");
    }

    function captureRenderedAnswer() {
      var results = documentRef.getElementById("askResults");
      var answer = results && results.querySelector(".answer-brief");
      var boundQuery = results ? String(results.getAttribute("data-ask-query") || "").trim() : "";
      renderedQuery = answer && boundQuery ? boundQuery : "";
      answerReady = Boolean(renderedQuery);
      observedAt = answerReady ? now() : "";
      if (form) form.hidden = true;
      setActionsReady(answerReady && inputNode.value.trim() === renderedQuery);
      if (answerReady) {
        setMessage("ANSWER READY // FLAG ONLY WHAT A HUMAN SHOULD CHECK", "neutral");
      }
    }

    function handleInput() {
      var matches = answerReady && inputNode.value.trim() === renderedQuery;
      if (!matches && form && !form.hidden) {
        form.hidden = true;
        reviewRoot.querySelector("[data-ask-review-open]").setAttribute("aria-expanded", "false");
      }
      setActionsReady(matches);
      if (answerReady && !matches) {
        setMessage("SUBMIT THE EDITED QUERY BEFORE REVIEWING IT", "error");
      }
    }

    function setMessage(message, kind) {
      var node = reviewRoot.querySelector("[data-ask-review-message]");
      node.textContent = message;
      node.setAttribute("data-tone", kind || "neutral");
    }

    function renderMetrics() {
      var metrics = engine.summarize(queue);
      reviewRoot.querySelector("[data-ask-review-count]").textContent = String(metrics.total);
      reviewRoot.querySelector("[data-ask-review-metrics]").textContent =
        metrics.needsReview + " NEED REVIEW // " + metrics.helpful +
        " HELPFUL // " + metrics.receiptBound + " RECEIPT-BOUND";
      reviewRoot.querySelector("[data-ask-review-export]").disabled = metrics.total === 0;
      reviewRoot.querySelector("[data-ask-review-clear]").disabled = metrics.total === 0;
    }

    function addPacket(issueKind, note, proposal) {
      var packet = engine.createPacket(Object.assign(resultSnapshot(), {
        issueKind: issueKind,
        note: note || "",
        proposal: proposal || {}
      }));
      if (!queue.some(function (candidate) { return candidate.packetId === packet.packetId; })) {
        queue.push(packet);
      }
      var persisted = saveQueue();
      renderMetrics();
      setMessage(persisted ? (issueKind === "helpful" ?
        "HELPFUL SIGNAL HELD ON THIS DEVICE // THANK YOU" :
        "HELD FOR HUMAN REVIEW // NOTHING WAS SILENTLY REWRITTEN") :
        "HELD IN MEMORY ONLY // STORAGE BLOCKED // DOWNLOAD QUEUE NOW",
      persisted ? "success" : "error");
      return packet;
    }

    function bind() {
      reviewRoot.querySelector("[data-ask-review-helpful]").onclick = function () {
        try {
          addPacket("helpful", "");
        } catch (error) {
          setMessage(error.message || "REVIEW PACKET COULD NOT BE BUILT", "error");
        }
      };
      reviewRoot.querySelector("[data-ask-review-open]").onclick = function () {
        form.hidden = false;
        this.setAttribute("aria-expanded", "true");
        form.querySelector("select").focus();
      };
      reviewRoot.querySelector("[data-ask-review-cancel]").onclick = function () {
        form.hidden = true;
        var open = reviewRoot.querySelector("[data-ask-review-open]");
        open.setAttribute("aria-expanded", "false");
        open.focus();
      };
      form.onsubmit = function (event) {
        event.preventDefault();
        var proposedAt = parseSecond(form.querySelector("[data-ask-review-time]").value);
        if (Number.isNaN(proposedAt)) {
          setMessage("USE SECONDS OR HH:MM:SS FOR THE BETTER SECOND", "error");
          return;
        }
        try {
          addPacket(
            form.querySelector("select").value,
            form.querySelector("textarea").value,
            {
              sourceId: form.querySelector("[data-ask-review-source]").value,
              at: proposedAt,
              expectedAnswer: form.querySelector("[data-ask-review-expected]").value
            }
          );
        } catch (error) {
          setMessage(error.message || "REVIEW PACKET COULD NOT BE BUILT", "error");
          return;
        }
        form.reset();
        form.hidden = true;
        var open = reviewRoot.querySelector("[data-ask-review-open]");
        open.setAttribute("aria-expanded", "false");
        open.focus();
      };
      reviewRoot.querySelector("[data-ask-review-export]").onclick = function () {
        downloadJson(documentRef, "wwam-ask-review-queue.json", engine.exportQueue(queue));
        setMessage("REVIEW QUEUE DOWNLOADED // HUMAN DECISION STILL REQUIRED", "success");
      };
      reviewRoot.querySelector("[data-ask-review-clear]").onclick = function () {
        if (root.confirm && !root.confirm("Clear the local Ask review queue?")) return;
        queue = [];
        var persisted = saveQueue();
        renderMetrics();
        setMessage(persisted ? "LOCAL REVIEW QUEUE CLEARED" :
          "CLEARED IN THIS TAB // STORED COPY COULD NOT BE UPDATED",
        persisted ? "neutral" : "error");
      };
      inputNode.addEventListener("input", handleInput);
    }

    function mount() {
      if (reviewRoot) return reviewRoot;
      var machine = documentRef.querySelector("#ask .ask-machine");
      var results = documentRef.getElementById("askResults");
      inputNode = documentRef.getElementById("askInput");
      if (!machine || !results || !inputNode) return null;
      reviewRoot = documentRef.createElement("section");
      reviewRoot.className = "ask-review";
      reviewRoot.id = "askReview";
      reviewRoot.setAttribute("aria-labelledby", "askReviewTitle");
      reviewRoot.innerHTML =
        '<header><div><span>ANSWER AUDIT // LOCAL REVIEW QUEUE</span>' +
        '<h3 id="askReviewTitle">MAKE THE TAPE SMARTER.</h3></div>' +
        '<b><i data-ask-review-count>0</i> HELD</b></header>' +
        '<p>Wrong source? Wrong second? Missing context? Turn the rendered answer into a precise, ' +
        'append-only review packet. It stays on this device until you export it.</p>' +
        '<div class="ask-review-actions"><button type="button" data-ask-review-helpful disabled>NAILED IT</button>' +
        '<button type="button" data-ask-review-open disabled aria-expanded="false" ' +
        'aria-controls="askReviewForm">FLAG THIS ANSWER</button></div>' +
        '<form id="askReviewForm" hidden><label><span>WHAT FAILED?</span><select>' +
        '<option value="wrong-source">WRONG SOURCE</option>' +
        '<option value="wrong-timestamp">WRONG SECOND</option>' +
        '<option value="wrong-answer">WRONG ANSWER</option>' +
        '<option value="missing-receipt">MISSING RECEIPT</option>' +
        '<option value="speaker-attribution">SPEAKER / ATTRIBUTION PROBLEM</option>' +
        '<option value="misleading-wording">MISLEADING WORDING</option>' +
        '<option value="other">OTHER</option></select></label>' +
        '<label><span>EDITOR NOTE // OPTIONAL</span><textarea maxlength="500" ' +
        'placeholder="What should a human check against the original tape?"></textarea></label>' +
        '<div class="ask-review-proposal"><label><span>BETTER SOURCE ID // OPTIONAL</span>' +
        '<input data-ask-review-source maxlength="128" placeholder="Exact YouTube video ID"></label>' +
        '<label><span>BETTER SECOND // OPTIONAL</span><input data-ask-review-time ' +
        'placeholder="44:05 or 2645"></label></div>' +
        '<label><span>EXPECTED ANSWER // OPTIONAL</span><input data-ask-review-expected ' +
        'maxlength="500" placeholder="What should Ask have returned?"></label>' +
        '<div><button type="submit">HOLD FOR REVIEW</button>' +
        '<button type="button" data-ask-review-cancel>CANCEL</button></div></form>' +
        '<footer><span data-ask-review-metrics>0 NEED REVIEW // 0 HELPFUL // 0 RECEIPT-BOUND</span>' +
        '<div><button type="button" data-ask-review-export disabled>DOWNLOAD QUEUE</button>' +
        '<button type="button" data-ask-review-clear disabled>CLEAR LOCAL QUEUE</button></div></footer>' +
        '<small data-ask-review-message role="status" aria-live="polite">' +
        'REVIEW PROPOSALS DO NOT CHANGE ASK, CANON, OR SPEAKER CERTIFICATION.</small>';
      machine.appendChild(reviewRoot);
      form = reviewRoot.querySelector("form");
      loadQueue();
      renderMetrics();
      bind();
      observer = new MutationObserver(function () {
        captureRenderedAnswer();
      });
      observer.observe(results, { childList: true, subtree: true });
      captureRenderedAnswer();
      return reviewRoot;
    }

    function destroy() {
      if (observer) observer.disconnect();
      if (inputNode) inputNode.removeEventListener("input", handleInput);
      if (reviewRoot) reviewRoot.remove();
      reviewRoot = null;
      observer = null;
      inputNode = null;
    }

    return Object.freeze({
      mount: mount,
      destroy: destroy,
      getQueue: function () { return array(queue).map(function (packet) {
        return JSON.parse(JSON.stringify(packet));
      }); },
      capture: resultSnapshot,
      addPacket: addPacket
    });
  }

  function autoMount() {
    if (!root.document || !root.WWAMAskReviewEngine || root.WWAMAskReviewUIInstance) return;
    var instance = create({
      engine: root.WWAMAskReviewEngine.create(),
      document: root.document
    });
    if (instance.mount()) root.WWAMAskReviewUIInstance = instance;
  }

  root.WWAMAskReviewUI = Object.freeze({
    create: create,
    storageKey: STORAGE_KEY
  });
  if (root.document) {
    if (root.document.readyState === "loading") {
      root.document.addEventListener("DOMContentLoaded", autoMount, { once: true });
    } else {
      autoMount();
    }
  }
}(typeof window !== "undefined" ? window : globalThis));
