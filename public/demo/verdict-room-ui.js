(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var MAX_IMPORT_BYTES = 2_000_000;
  var ACTIVE_MOUNTS = new WeakMap();
  var CHECK_COPY = Object.freeze({
    CANONICAL_PACKET: Object.freeze({
      stage: "identity",
      label: "Canonical packet",
      detail: "The live docket packet verifies and matches this exact review target.",
    }),
    CHRONOLOGY: Object.freeze({
      stage: "identity",
      label: "Chronology",
      detail: "The source dates and exact evidence anchors are in the claimed order.",
    }),
    SUBJECT_SCOPE: Object.freeze({
      stage: "identity",
      label: "Subject scope",
      detail: "The same specific subject grounds both sides of this bounded docket.",
    }),
    BEFORE_CONTEXT: Object.freeze({
      stage: "evidence",
      label: "Before context",
      detail: "The earlier excerpt and surrounding context support the proposition.",
    }),
    AFTER_CONTEXT: Object.freeze({
      stage: "evidence",
      label: "After context",
      detail: "The later excerpt and surrounding context support the response meaning.",
    }),
    CONTRADICTION_SWEEP: Object.freeze({
      stage: "evidence",
      label: "Contradiction sweep",
      detail: "Every attached receipt has a relied-on or context-only disposition.",
    }),
    SOURCE_AUDIO_BOUNDARY: Object.freeze({
      stage: "evidence",
      label: "Source-audio boundary",
      detail: "Trailer, movie, game, or other source audio was not treated as host speech.",
    }),
    RIGHTS_BOUNDARY: Object.freeze({
      stage: "evidence",
      label: "Rights boundary",
      detail: "Only official links and bounded excerpts are used; this clears no rights.",
    }),
    OUTCOME_REVIEW: Object.freeze({
      stage: "evidence",
      label: "Outcome review",
      detail: "A human checked the relevant whole-work or declared primary outcome source.",
    }),
    SPEAKER_EXCLUDED: Object.freeze({
      stage: "evidence",
      label: "Speaker excluded",
      detail: "The review neither identifies a speaker nor assumes same-person continuity.",
    }),
    CAUSALITY_EXCLUDED: Object.freeze({
      stage: "evidence",
      label: "Causality excluded",
      detail: "The review does not claim that the earlier source caused the later source.",
    }),
    PUBLIC_WORDING: Object.freeze({
      stage: "wording",
      label: "Public wording",
      detail: "The exact scoped wording and selected local conclusion are read together.",
    }),
  });
  var STAGES = Object.freeze([
    Object.freeze({
      id: "identity",
      eyebrow: "STAGE 01",
      title: "Source identity",
      detail: "Prove these are the exact two sources in the exact bounded docket.",
    }),
    Object.freeze({
      id: "evidence",
      eyebrow: "STAGE 02",
      title: "Evidence",
      detail: "Review context, counterweights, outcome, and every authority boundary.",
    }),
  ]);
  var VERDICT_COPY = Object.freeze({
    SUPPORTED: "Later evidence supports the bounded earlier proposition.",
    CONTRADICTED: "Later evidence contradicts the bounded earlier proposition.",
    MIXED: "Later evidence is materially mixed against the bounded earlier proposition.",
  });
  var REJECTION_COPY = Object.freeze({
    INSUFFICIENT_EVIDENCE: "Insufficient evidence",
    OUT_OF_SCOPE: "Out of scope",
    RIGHTS_BOUNDARY: "Rights boundary",
    DUPLICATE: "Duplicate docket",
  });

  function clean(value) {
    return typeof value === "string"
      ? value.replace(/\s+/g, " ").trim()
      : "";
  }

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function text(value) {
    return value == null ? "" : String(value);
  }

  function byteLength(value) {
    var source = String(value == null ? "" : value);
    var bytes = 0;
    for (var index = 0; index < source.length; index += 1) {
      var code = source.charCodeAt(index);
      if (code <= 0x7f) {
        bytes += 1;
      } else if (code <= 0x7ff) {
        bytes += 2;
      } else if (code >= 0xd800 && code <= 0xdbff) {
        bytes += 4;
        index += 1;
      } else {
        bytes += 3;
      }
    }
    return bytes;
  }

  function uiError(code, message, focusSelector) {
    var error = new Error(message);
    error.name = "VerdictRoomUIError";
    error.code = code;
    error.focusSelector = clean(focusSelector);
    return error;
  }

  function requireEngine(value) {
    var methods = [
      "getQueue",
      "getDocket",
      "getLedger",
      "getPublicProjection",
      "recordCheck",
      "markNeedsContext",
      "reject",
      "lockWording",
      "adjudicate",
      "undo",
      "revoke",
      "exportJSON",
      "exportMarkdown",
    ];
    if (
      !value ||
      !value.policy ||
      value.policy.localOnly !== true ||
      methods.some(function (method) {
        return typeof value[method] !== "function";
      })
    ) {
      throw uiError(
        "ENGINE_REQUIRED",
        "Verdict Room UI requires a compatible local Verdict Room engine."
      );
    }
    return value;
  }

  function append(node, children, documentRef) {
    array(children).forEach(function (child) {
      if (child == null || child === false) return;
      if (Array.isArray(child)) {
        append(node, child, documentRef);
        return;
      }
      node.appendChild(
        typeof child === "string" || typeof child === "number"
          ? documentRef.createTextNode(String(child))
          : child
      );
    });
    return node;
  }

  function element(documentRef, tag, attributes, children) {
    var node = documentRef.createElement(tag);
    Object.keys(attributes || {}).forEach(function (name) {
      var value = attributes[name];
      if (value == null || value === false) return;
      if (name === "className") {
        node.setAttribute("class", value);
      } else if (name === "text") {
        node.textContent = text(value);
      } else if (name === "checked" || name === "disabled" ||
        name === "hidden" || name === "required") {
        node[name] = value === true;
        if (value === true) node.setAttribute(name, "");
      } else if (name === "value") {
        node.value = text(value);
        node.setAttribute("value", text(value));
      } else {
        node.setAttribute(name, text(value));
      }
    });
    return append(node, children, documentRef);
  }

  function option(documentRef, value, label, selected, disabled) {
    return element(documentRef, "option", {
      value: value,
      selected: selected ? "" : null,
      disabled: disabled ? true : null,
      text: label,
    });
  }

  function formatSeconds(value) {
    var seconds = Math.max(0, Math.floor(Number(value) || 0));
    var hours = Math.floor(seconds / 3_600);
    var minutes = Math.floor((seconds % 3_600) / 60);
    var remainder = seconds % 60;
    var clock = [minutes, remainder].map(function (part) {
      return String(part).padStart(2, "0");
    }).join(":");
    return hours
      ? String(hours).padStart(2, "0") + ":" + clock
      : clock;
  }

  function safeFilename(value) {
    return clean(value)
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "verdict-room-session";
  }

  function directAction(node, mount) {
    var current = node;
    while (current && current !== mount) {
      if (
        typeof current.getAttribute === "function" &&
        current.getAttribute("data-vr-action")
      ) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  }

  function formKind(node) {
    return node && typeof node.getAttribute === "function"
      ? clean(node.getAttribute("data-vr-form"))
      : "";
  }

  function create(optionsValue) {
    var options = optionsValue || {};
    var room = requireEngine(options.engine);
    var documentRef = options.document || root.document;
    var mount = options.mount;
    if (
      !documentRef ||
      typeof documentRef.createElement !== "function" ||
      !mount ||
      typeof mount.replaceChildren !== "function"
    ) {
      throw uiError(
        "DOM_REQUIRED",
        "Verdict Room UI requires a document and a replaceable mount."
      );
    }
    var download = typeof options.download === "function"
      ? options.download
      : null;
    var restoreSession = typeof options.restoreSession === "function"
      ? options.restoreSession
      : null;
    var state = {
      mounted: false,
      selectedId: clean(options.initialDocketId),
      activeCheck: "",
      reducedProfanity: options.reducedProfanity === true,
      notice: "",
      error: "",
      errorOrigin: null,
      pendingFocus: "",
      pendingDialog: null,
      dialogOrigin: null,
      cachedQueue: [],
      cachedDocket: null,
      cachedLedger: [],
      stale: false,
      actor: {
        role: "",
        name: "",
        id: "",
        at: "",
        notes: "",
        humanAttested: false,
      },
    };
    var originalNodes = [];
    var mountAttribute = null;
    var mountHadAttribute = false;
    var focusBeforeMount = null;

    function query(selector, scope) {
      return (scope || mount).querySelector(selector);
    }

    function queryAll(selector, scope) {
      return Array.from((scope || mount).querySelectorAll(selector));
    }

    function setActorFromDom() {
      Object.keys(state.actor).forEach(function (key) {
        var control = query('[data-vr-model="' + key + '"]');
        if (!control) return;
        state.actor[key] = key === "humanAttested"
          ? control.checked === true
          : text(control.value);
      });
    }

    function commonAction() {
      setActorFromDom();
      if (!clean(state.actor.role)) {
        throw uiError(
          "REVIEWER_REQUIRED",
          "Enter the local human review role.",
          '[data-vr-model="role"]'
        );
      }
      if (!clean(state.actor.at)) {
        throw uiError(
          "TIMESTAMP_REQUIRED",
          "Enter a caller-supplied ISO 8601 timestamp with a timezone.",
          '[data-vr-model="at"]'
        );
      }
      if (!clean(state.actor.notes)) {
        throw uiError(
          "NOTES_REQUIRED",
          "Add notes for this exact event.",
          '[data-vr-model="notes"]'
        );
      }
      if (state.actor.humanAttested !== true) {
        throw uiError(
          "ATTESTATION_REQUIRED",
          "Confirm that a human performed this local review event.",
          '[data-vr-model="humanAttested"]'
        );
      }
      return {
        at: clean(state.actor.at),
        reviewer: {
          role: clean(state.actor.role),
          name: clean(state.actor.name),
          id: clean(state.actor.id),
          humanAttested: true,
        },
        notes: clean(state.actor.notes),
      };
    }

    function clearEventDraft() {
      state.actor.at = "";
      state.actor.notes = "";
      state.actor.humanAttested = false;
    }

    function announce(message) {
      state.notice = clean(message);
      var live = query("[data-vr-live]");
      if (live) live.textContent = state.notice;
    }

    function errorContent() {
      var output = [
        element(documentRef, "h2", {
          className: "vr-error-title",
          text: "REVIEW EVENT NOT SAVED",
        }),
        element(documentRef, "p", { text: state.error }),
      ];
      if (
        state.errorOrigin &&
        typeof state.errorOrigin.focus === "function" &&
        mount.contains(state.errorOrigin)
      ) {
        output.push(
          element(documentRef, "button", {
            className: "vr-quiet-button",
            type: "button",
            "data-vr-action": "return-error",
            text: "RETURN TO THE PRESERVED FORM",
          })
        );
      }
      return output;
    }

    function errorFocus(error, fallback) {
      if (
        error &&
        error.focusNode &&
        typeof error.focusNode.focus === "function" &&
        mount.contains(error.focusNode)
      ) {
        return error.focusNode;
      }
      var selector = clean(error && error.focusSelector);
      var target = selector ? query(selector) : null;
      if (target && typeof target.focus === "function") return target;
      if (
        fallback &&
        typeof fallback.focus === "function" &&
        mount.contains(fallback)
      ) {
        return fallback;
      }
      return null;
    }

    function showError(error, fallback) {
      var code = clean(error && error.code) || "REVIEW_FAILED";
      var message = clean(error && error.message) ||
        "The local review event was rejected.";
      state.error = code + ": " + message;
      state.errorOrigin = errorFocus(error, fallback);
      var summary = query("[data-vr-error]");
      if (summary) {
        summary.hidden = false;
        summary.removeAttribute("hidden");
        summary.replaceChildren.apply(summary, errorContent());
        summary.focus();
      }
      announce("Review event not saved. " + message);
    }

    function model() {
      var queue;
      var docket;
      var ledger;
      var projection;
      var metrics;
      state.stale = false;
      try {
        queue = room.getQueue({});
        if (
          !state.selectedId ||
          !queue.some(function (entry) {
            return entry.id === state.selectedId;
          })
        ) {
          state.selectedId = queue.length ? queue[0].id : "";
        }
        docket = state.selectedId
          ? room.getDocket(state.selectedId)
          : null;
        ledger = state.selectedId
          ? room.getLedger(state.selectedId)
          : [];
        projection = state.selectedId
          ? room.getPublicProjection(state.selectedId, {
            reducedProfanity: state.reducedProfanity,
          })
          : null;
        metrics = typeof room.getMetrics === "function"
          ? room.getMetrics()
          : null;
        state.cachedQueue = queue;
        state.cachedDocket = docket;
        state.cachedLedger = ledger;
      } catch (error) {
        if (!error || error.code !== "STALE_INPUT") throw error;
        state.stale = true;
        queue = state.cachedQueue;
        docket = state.cachedDocket;
        ledger = state.cachedLedger;
        projection = state.selectedId
          ? room.getPublicProjection(state.selectedId, {
            reducedProfanity: state.reducedProfanity,
          })
          : null;
        metrics = null;
      }
      return {
        queue: array(queue),
        docket: docket,
        ledger: array(ledger),
        projection: projection,
        metrics: metrics,
      };
    }

    function boundaryBanner() {
      return element(documentRef, "aside", {
        className: "vr-boundary",
        "aria-label": "Verdict Room authority boundary",
      }, [
        element(documentRef, "strong", {
          text: "DEVICE-LOCAL HUMAN OVERLAY",
        }),
        element(documentRef, "span", {
          text: "NOT CANON \u00b7 NOT PUBLISHED \u00b7 NOT IDENTITY-VERIFIED",
        }),
        element(documentRef, "span", {
          className: "vr-machine-disclosure",
          text: "The machine paired evidence. It did not decide the verdict.",
        }),
        element(documentRef, "p", {
          className: "vr-automation-disclosure",
          text: "AUTOMATION DISCLOSURE // Software organizes the bounded evidence and enforces workflow rules. A caller-attested human alone selects every check, exact wording, and local verdict. No AI or automation decides or publishes a result.",
        }),
      ]);
    }

    function header(view) {
      var active = view.metrics && view.metrics.activeVerdicts || 0;
      return element(documentRef, "header", {
        className: "vr-hero",
      }, [
        element(documentRef, "div", { className: "vr-hero-copy" }, [
          element(documentRef, "p", {
            className: "vr-kicker",
            text: "THE VERDICT ROOM // LOCAL REVIEW",
          }),
          element(documentRef, "h1", {
            id: "vrTitle",
            text: room.session && room.session.name || "Verdict Room",
          }),
          element(documentRef, "p", {
            className: "vr-deck",
            text: "Two sources enter. Twelve human checks decide whether a scoped local conclusion may leave.",
          }),
        ]),
        element(documentRef, "dl", {
          className: "vr-scoreboard",
          "aria-label": "Local session totals",
        }, [
          element(documentRef, "div", {}, [
            element(documentRef, "dt", { text: "DOCKETS" }),
            element(documentRef, "dd", { text: view.queue.length }),
          ]),
          element(documentRef, "div", {}, [
            element(documentRef, "dt", { text: "LOCAL VERDICTS" }),
            element(documentRef, "dd", { text: active }),
          ]),
          element(documentRef, "div", {}, [
            element(documentRef, "dt", { text: "SERVER RECORDS" }),
            element(documentRef, "dd", { text: "0" }),
          ]),
        ]),
      ]);
    }

    function queueRail(view) {
      return element(documentRef, "nav", {
        className: "vr-docket-rail",
        "aria-label": "Verdict Room dockets",
      }, [
        element(documentRef, "div", { className: "vr-rail-heading" }, [
          element(documentRef, "p", {
            className: "vr-kicker",
            text: "COURT CALENDAR",
          }),
          element(documentRef, "h2", { text: "Open a docket" }),
        ]),
        element(documentRef, "div", {
          className: "vr-docket-list",
        }, view.queue.map(function (entry, index) {
          var current = entry.id === state.selectedId;
          return element(documentRef, "button", {
            className: "vr-docket-tab" + (current ? " is-current" : ""),
            type: "button",
            "data-vr-action": "select-docket",
            "data-docket-id": entry.id,
            "data-vr-focus": "docket-" + index,
            "aria-current": current ? "page" : null,
          }, [
            element(documentRef, "span", {
              className: "vr-docket-number",
              text: String(index + 1).padStart(2, "0"),
            }),
            element(documentRef, "span", {
              className: "vr-docket-tab-copy",
            }, [
              element(documentRef, "strong", { text: entry.title }),
              element(documentRef, "span", {
                text: entry.state + " \u00b7 REV " + entry.revision +
                  " \u00b7 " + entry.checkCount + "/12",
              }),
            ]),
          ]);
        })),
      ]);
    }

    function fact(label, value, title) {
      return element(documentRef, "div", { className: "vr-fact" }, [
        element(documentRef, "dt", { text: label }),
        element(documentRef, "dd", {
          text: value,
          title: title || value,
        }),
      ]);
    }

    function bindingPanel(docket) {
      var binding = docket.binding;
      return element(documentRef, "section", {
        className: "vr-binding",
        "aria-labelledby": "vrBindingTitle",
      }, [
        element(documentRef, "div", { className: "vr-section-heading" }, [
          element(documentRef, "div", {}, [
            element(documentRef, "p", {
              className: "vr-kicker",
              text: "STRUCTURAL BINDING // MATCHED",
            }),
            element(documentRef, "h2", {
              id: "vrBindingTitle",
              text: binding.title,
              "data-vr-focus": "docket-heading",
              tabindex: "-1",
            }),
          ]),
          element(documentRef, "span", {
            className: "vr-state",
            text: docket.review.state + " // REVISION " + docket.review.revision,
          }),
        ]),
        element(documentRef, "p", {
          className: "vr-binding-caveat",
          text: "Exact hashes reveal structural change. They are not signatures, authentication, authorship, or proof of truth.",
        }),
        element(documentRef, "dl", { className: "vr-binding-grid" }, [
          fact("DOCKET ID", binding.id),
          fact("MACHINE PAIR SIGNAL", binding.pairSignal + " // NOT A VERDICT"),
          fact(
            "DOCKET BINDING SHA-256",
            binding.bindingHash,
            binding.bindingHash
          ),
          fact(
            "PACKET SHA-256",
            binding.packetHash,
            binding.packetHash
          ),
          fact(
            "PACKET FINGERPRINT",
            binding.packetFingerprint,
            binding.packetFingerprint
          ),
          fact(
            "REVIEW INPUT SHA-256",
            room.context.reviewInputHash,
            room.context.reviewInputHash
          ),
          fact(
            "CHANNELPACK",
            room.context.channelPackFingerprint,
            room.context.channelPackFingerprint
          ),
          fact(
            "CAPTION SET SHA-256",
            room.context.captionSetFingerprint,
            room.context.captionSetFingerprint
          ),
          fact(
            "DATA ARTIFACT FINGERPRINT",
            room.context.docketDataFingerprint,
            room.context.docketDataFingerprint
          ),
          fact(
            "VERDICT VOCABULARY SHA-256",
            room.context.vocabularyHash,
            room.context.vocabularyHash
          ),
          fact(
            "TARGET SET SHA-256",
            room.context.targetSetHash,
            room.context.targetSetHash
          ),
          fact("SUBJECT IDS", binding.subjectIds.join(" // ")),
          fact(
            "REQUIRED RECEIPT IDS",
            binding.requiredReceiptIds.join(" // ")
          ),
          fact(
            "OUTCOME REVIEW",
            binding.requiresOutcomeVerification ? "REQUIRED" : "NOT DECLARED"
          ),
          fact(
            "WHOLE-WORK VISUAL REVIEW",
            binding.requiresWholeWorkVisualReview
              ? "REQUIRED"
              : "NOT DECLARED"
          ),
        ]),
      ]);
    }

    function tapeCard(receipt, side) {
      var heading = side === "before"
        ? "BEFORE SOURCE // BOUNDED PROPOSITION"
        : "AFTER SOURCE // BOUNDED RESPONSE";
      return element(documentRef, "article", {
        className: "vr-tape vr-tape-" + side,
      }, [
        element(documentRef, "div", { className: "vr-tape-topline" }, [
          element(documentRef, "p", {
            className: "vr-kicker",
            text: heading,
          }),
          element(documentRef, "span", {
            className: "vr-timecode",
            text: formatSeconds(receipt.t),
          }),
        ]),
        element(documentRef, "blockquote", {
          text: "\u201c" + receipt.excerpt + "\u201d",
        }),
        element(documentRef, "dl", { className: "vr-tape-meta" }, [
          fact("EVIDENCE ID", receipt.id),
          fact("SOURCE", receipt.sourceTitle),
          fact("SOURCE DATE", receipt.sourceDate),
          fact("CONTENT MODE", receipt.contentMode),
          fact("RIGHTS MODE", receipt.rightsMode),
        ]),
        element(documentRef, "a", {
          className: "vr-tape-link",
          href: receipt.url,
          target: "_blank",
          rel: "noopener noreferrer",
          text: "OPEN OFFICIAL SOURCE AT " + formatSeconds(receipt.t) +
            " // NO AUTOPLAY",
        }),
      ]);
    }

    function evidenceCourt(docket) {
      var receipts = array(docket.requiredReceipts);
      var before = receipts.find(function (receipt) {
        return receipt.role === "FORECAST";
      });
      var after = receipts.find(function (receipt) {
        return receipt.role === "RESPONSE";
      });
      var additional = receipts.filter(function (receipt) {
        return receipt.role === "ADDITIONAL_RESPONSE";
      });
      return element(documentRef, "section", {
        className: "vr-court",
        "aria-labelledby": "vrCourtTitle",
      }, [
        element(documentRef, "div", { className: "vr-section-heading" }, [
          element(documentRef, "div", {}, [
            element(documentRef, "p", {
              className: "vr-kicker",
              text: "THE TWO-SOURCE COURTROOM",
            }),
            element(documentRef, "h2", {
              id: "vrCourtTitle",
              text: "Read both sources before touching a check",
            }),
          ]),
          element(documentRef, "span", {
            className: "vr-evidence-count",
            text: receipts.length + " EXACT RECEIPT" +
              (receipts.length === 1 ? "" : "S"),
          }),
        ]),
        element(documentRef, "div", {
          className: "vr-tape-grid",
        }, [
          before ? tapeCard(before, "before") : null,
          after ? tapeCard(after, "after") : null,
        ]),
        additional.length
          ? element(documentRef, "div", {
            className: "vr-counterweights",
          }, [
            element(documentRef, "h3", {
              text: "Attached counterweights // contradiction sweep required",
            }),
            element(documentRef, "div", {
              className: "vr-counterweight-grid",
            }, additional.map(function (receipt, index) {
              return element(documentRef, "article", {
                className: "vr-counterweight",
              }, [
                element(documentRef, "p", {
                  className: "vr-kicker",
                  text: "COUNTERWEIGHT " +
                    String(index + 1).padStart(2, "0"),
                }),
                element(documentRef, "blockquote", {
                  text: "\u201c" + receipt.excerpt + "\u201d",
                }),
                element(documentRef, "a", {
                  href: receipt.url,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  text: "OPEN " + receipt.sourceTitle + " AT " +
                    formatSeconds(receipt.t) + " // NO AUTOPLAY",
                }),
              ]);
            })),
          ])
          : null,
      ]);
    }

    function verdictPanel(docket, projection) {
      var active = projection &&
        projection.state === "ADJUDICATED" &&
        projection.formalLabel &&
        projection.comedyLabel &&
        projection.reviewedWording;
      var content = active
        ? element(documentRef, "div", {
          className: "vr-active-verdict",
          role: "group",
          "aria-labelledby": "vrFormalVerdict",
          "aria-describedby": "vrVerdictBoundary vrVerdictWording",
        }, [
          element(documentRef, "p", {
            id: "vrVerdictBoundary",
            className: "vr-verdict-boundary",
            text: "ACTIVE DEVICE-LOCAL HUMAN VERDICT // NOT CANON // NOT CREATOR-CERTIFIED",
          }),
          element(documentRef, "h2", {
            id: "vrFormalVerdict",
            text: projection.formalLabel,
          }),
          element(documentRef, "p", {
            className: "vr-comedy-verdict",
            text: projection.comedyLabel,
          }),
          element(documentRef, "p", {
            id: "vrVerdictWording",
            className: "vr-reviewed-wording",
            text: projection.reviewedWording,
          }),
          element(documentRef, "code", {
            className: "vr-decision-hash",
            text: projection.decisionHash,
          }),
        ])
        : element(documentRef, "div", {
          className: "vr-withheld-verdict",
        }, [
          element(documentRef, "p", {
            className: "vr-verdict-boundary",
            text: projection && projection.state === "STALE_INPUT"
              ? "STALE INPUT // ALL LOCAL VERDICT COPY SUPPRESSED"
              : "PUBLIC VERDICT WITHHELD // LOCAL REVIEW INCOMPLETE",
          }),
          element(documentRef, "h2", {
            text: "ZERO ACTIVE VERDICTS FOR THIS DOCKET",
          }),
          element(documentRef, "p", {
            text: "Formal label, comedy label, and reviewed wording remain absent until all 12 human checks and adjudication succeed.",
          }),
        ]);
      return element(documentRef, "section", {
        className: "vr-verdict-panel",
        "aria-label": "Current local verdict",
      }, [
        content,
        element(documentRef, "label", {
          className: "vr-bleep-toggle",
        }, [
          element(documentRef, "input", {
            type: "checkbox",
            checked: state.reducedProfanity,
            "data-vr-action": "toggle-profanity",
            "data-vr-focus": "profanity-toggle",
          }),
          element(documentRef, "span", {
            text: "Reduced-profanity display",
          }),
        ]),
        active
          ? element(documentRef, "button", {
            className: "vr-danger-button",
            type: "button",
            "data-vr-action": "open-revoke",
            "data-vr-focus": "revoke",
            text: "REVOKE THIS LOCAL VERDICT",
          })
          : null,
      ]);
    }

    function actorControls(ledger) {
      var latest = ledger.length ? ledger[ledger.length - 1] : null;
      return element(documentRef, "fieldset", {
        className: "vr-actor",
      }, [
        element(documentRef, "legend", {
          text: "Caller-attested local reviewer // identity labels may persist",
        }),
        element(documentRef, "p", {
          className: "vr-help",
          text: "These are local labels only. The engine does not authenticate the reviewer, timestamp, role, or source. Event time, notes, and human attestation reset after every saved event. " +
            (latest
              ? "The next caller-supplied timestamp must be later than " +
                latest.at + "."
              : "The first timestamp cannot precede the local session."),
        }),
        element(documentRef, "div", {
          className: "vr-form-grid",
        }, [
          labeledInput("vrReviewerRole", "Review role", "text", "role", true,
            "Example: editor"),
          labeledInput("vrReviewerName", "Local name // optional", "text",
            "name", false, "Not identity-verified"),
          labeledInput("vrReviewerId", "Local ID // optional", "text",
            "id", false, "Device-local label"),
          labeledInput("vrEventTime", "Event time // ISO 8601 + timezone",
            "text", "at", true, "2026-07-24T01:15:00-04:00"),
        ]),
        element(documentRef, "label", {
          className: "vr-field vr-field-wide",
          for: "vrEventNotes",
        }, [
          element(documentRef, "span", { text: "Notes for this exact event" }),
          element(documentRef, "textarea", {
            id: "vrEventNotes",
            rows: "3",
            maxlength: "4000",
            required: true,
            "data-vr-model": "notes",
            value: state.actor.notes,
          }),
        ]),
        element(documentRef, "label", {
          className: "vr-attestation",
        }, [
          element(documentRef, "input", {
            type: "checkbox",
            required: true,
            checked: state.actor.humanAttested,
            "data-vr-model": "humanAttested",
          }),
          element(documentRef, "span", {
            text: "I attest that a human performed this exact local review event. I understand this is not identity verification.",
          }),
        ]),
      ]);
    }

    function labeledInput(id, label, type, modelName, required, placeholder) {
      return element(documentRef, "label", {
        className: "vr-field",
        for: id,
      }, [
        element(documentRef, "span", { text: label }),
        element(documentRef, "input", {
          id: id,
          type: type,
          required: required,
          maxlength: modelName === "role" ? "120" : "200",
          placeholder: placeholder,
          "data-vr-model": modelName,
          value: state.actor[modelName],
        }),
      ]);
    }

    function receiptDisposition(receipt) {
      var receiptKey = receipt.id.replace(/[^a-zA-Z0-9_-]/g, "-");
      var forecast = receipt.role === "FORECAST";
      return element(documentRef, "fieldset", {
        className: "vr-receipt-disposition",
        "data-vr-receipt": receipt.id,
      }, [
        element(documentRef, "legend", {
          text: receipt.role + " // " + receipt.id,
        }),
        element(documentRef, "p", {
          text: "\u201c" + receipt.excerpt + "\u201d",
        }),
        element(documentRef, "div", { className: "vr-form-grid" }, [
          element(documentRef, "label", {
            className: "vr-field",
            for: "vrDisposition-" + receiptKey,
          }, [
            element(documentRef, "span", { text: "Disposition" }),
            element(documentRef, "select", {
              id: "vrDisposition-" + receiptKey,
              required: true,
              "data-vr-receipt-disposition": "",
            }, [
              option(documentRef, "", "Choose disposition", true, true),
              option(documentRef, "RELIED_ON", "Relied on", false, false),
              option(documentRef, "CONTEXT_ONLY", "Context only", false, false),
            ]),
          ]),
          element(documentRef, "label", {
            className: "vr-field",
            for: "vrStance-" + receiptKey,
          }, [
            element(documentRef, "span", { text: "Local stance" }),
            element(documentRef, "select", {
              id: "vrStance-" + receiptKey,
              required: true,
              "data-vr-receipt-stance": "",
            }, forecast
              ? [
                option(
                  documentRef,
                  "PROPOSITION",
                  "Proposition // required for earlier source",
                  true,
                  false
                ),
              ]
              : [
                option(documentRef, "", "Choose local stance", true, true),
                option(documentRef, "SUPPORTING", "Supporting", false, false),
                option(
                  documentRef,
                  "CONTRADICTING",
                  "Contradicting",
                  false,
                  false
                ),
                option(documentRef, "NEUTRAL", "Neutral", false, false),
              ]),
          ]),
        ]),
        element(documentRef, "label", {
          className: "vr-field",
          for: "vrReason-" + receiptKey,
        }, [
          element(documentRef, "span", {
            text: "Human reason for this disposition",
          }),
          element(documentRef, "textarea", {
            id: "vrReason-" + receiptKey,
            rows: "2",
            maxlength: "1000",
            required: true,
            "data-vr-receipt-reason": "",
          }),
        ]),
      ]);
    }

    function checkForm(code, docket) {
      var copy = CHECK_COPY[code];
      var special = [];
      if (code === "CONTRADICTION_SWEEP") {
        special.push(
          element(documentRef, "div", {
            className: "vr-disposition-list",
          }, docket.requiredReceipts.map(receiptDisposition))
        );
      }
      if (code === "OUTCOME_REVIEW") {
        special.push(
          element(documentRef, "div", {
            className: "vr-outcome-review vr-form-grid",
          }, [
            element(documentRef, "label", {
              className: "vr-field",
              for: "vrOutcomeMethod",
            }, [
              element(documentRef, "span", { text: "Human review method" }),
              element(documentRef, "select", {
                id: "vrOutcomeMethod",
                required: true,
                "data-vr-outcome-method": "",
              }, [
                option(documentRef, "", "Choose method", true, true),
                option(
                  documentRef,
                  "WHOLE_WORK_REVIEW",
                  "Whole-work review",
                  false,
                  false
                ),
                option(
                  documentRef,
                  "DECLARED_PRIMARY_SOURCE",
                  "Declared primary source",
                  false,
                  false
                ),
              ]),
            ]),
            element(documentRef, "label", {
              className: "vr-field",
              for: "vrOutcomeSource",
            }, [
              element(documentRef, "span", {
                text: "Source reference // local attestation",
              }),
              element(documentRef, "input", {
                id: "vrOutcomeSource",
                type: "text",
                maxlength: "1000",
                required: true,
                "data-vr-outcome-source": "",
              }),
            ]),
            element(documentRef, "label", {
              className: "vr-field vr-field-wide",
              for: "vrOutcomeNotes",
            }, [
              element(documentRef, "span", {
                text: "Outcome review notes",
              }),
              element(documentRef, "textarea", {
                id: "vrOutcomeNotes",
                rows: "3",
                maxlength: "4000",
                required: true,
                "data-vr-outcome-notes": "",
              }),
            ]),
          ])
        );
      }
      return element(documentRef, "form", {
        className: "vr-check-form",
        "data-vr-form": "check",
        "data-check-code": code,
        novalidate: "",
      }, [
        element(documentRef, "h4", {
          text: "Record PASS // " + copy.label,
          tabindex: "-1",
          "data-vr-focus": "active-check",
        }),
        element(documentRef, "p", {
          className: "vr-help",
          text: "This appends one caller-attested event. It does not edit the source docket.",
        }),
        special,
        element(documentRef, "div", {
          className: "vr-form-actions",
        }, [
          element(documentRef, "button", {
            className: "vr-primary-button",
            type: "submit",
            text: "APPEND " + copy.label.toUpperCase() + " PASS",
          }),
          element(documentRef, "button", {
            className: "vr-quiet-button",
            type: "button",
            "data-vr-action": "close-check",
            text: "CANCEL",
          }),
        ]),
      ]);
    }

    function checkRow(code, docket) {
      var copy = CHECK_COPY[code];
      var completed = docket.review.checks.find(function (entry) {
        return entry.code === code && entry.status === "PASS";
      });
      var active = state.activeCheck === code;
      var reviewOpen = [
        "UNREVIEWED",
        "NEEDS_CONTEXT",
        "REVOKED",
      ].indexOf(docket.review.state) >= 0;
      return element(documentRef, "li", {
        className: "vr-check" +
          (completed ? " is-complete" : "") +
          (active ? " is-active" : ""),
      }, [
        element(documentRef, "div", { className: "vr-check-summary" }, [
          element(documentRef, "span", {
            className: "vr-check-mark",
            text: completed ? "PASS" : "OPEN",
          }),
          element(documentRef, "div", { className: "vr-check-copy" }, [
            element(documentRef, "h4", { text: copy.label }),
            element(documentRef, "p", { text: copy.detail }),
            completed
              ? element(documentRef, "code", {
                text: completed.eventId,
              })
              : null,
          ]),
          completed
            ? null
            : element(documentRef, "button", {
              className: "vr-check-button",
              type: "button",
              disabled: !reviewOpen,
              "data-vr-action": "open-check",
              "data-check-code": code,
              "data-vr-focus": "check-" + code,
              "aria-expanded": active ? "true" : "false",
              text: active ? "REVIEWING" : "REVIEW",
            }),
        ]),
        active ? checkForm(code, docket) : null,
      ]);
    }

    function reviewStage(stage, docket) {
      var codes = Object.keys(CHECK_COPY).filter(function (code) {
        return CHECK_COPY[code].stage === stage.id;
      });
      var completed = codes.filter(function (code) {
        return docket.review.checks.some(function (entry) {
          return entry.code === code && entry.status === "PASS";
        });
      }).length;
      return element(documentRef, "section", {
        className: "vr-review-stage",
        "aria-labelledby": "vrStage-" + stage.id,
      }, [
        element(documentRef, "div", { className: "vr-stage-heading" }, [
          element(documentRef, "div", {}, [
            element(documentRef, "p", {
              className: "vr-kicker",
              text: stage.eyebrow,
            }),
            element(documentRef, "h3", {
              id: "vrStage-" + stage.id,
              text: stage.title,
            }),
            element(documentRef, "p", { text: stage.detail }),
          ]),
          element(documentRef, "strong", {
            className: "vr-stage-score",
            text: completed + "/" + codes.length + " PASS",
          }),
        ]),
        element(documentRef, "ol", {
          className: "vr-check-list",
        }, codes.map(function (code) {
          return checkRow(code, docket);
        })),
      ]);
    }

    function wordingStage(docket) {
      var locked = docket.review.checks.find(function (entry) {
        return entry.code === "PUBLIC_WORDING" && entry.status === "PASS";
      });
      var evidenceReady = docket.review.state === "EVIDENCE_CHECKED";
      return element(documentRef, "section", {
        className: "vr-review-stage vr-wording-stage",
        "aria-labelledby": "vrWordingTitle",
      }, [
        element(documentRef, "div", { className: "vr-stage-heading" }, [
          element(documentRef, "div", {}, [
            element(documentRef, "p", {
              className: "vr-kicker",
              text: "STAGE 03",
            }),
            element(documentRef, "h3", {
              id: "vrWordingTitle",
              text: "Public wording",
            }),
            element(documentRef, "p", {
              text: "Select a verdict code and approve its exact fixed scoped sentence together. This is check 12, not the adjudication.",
            }),
          ]),
          element(documentRef, "strong", {
            className: "vr-stage-score",
            text: locked ? "1/1 PASS" : "0/1 " +
              (evidenceReady ? "READY" : "LOCKED"),
          }),
        ]),
        locked
          ? element(documentRef, "div", {
            className: "vr-locked-wording",
          }, [
            element(documentRef, "span", {
              className: "vr-check-mark",
              text: "PASS",
            }),
            element(documentRef, "div", {}, [
              element(documentRef, "p", { text: docket.review.wording }),
              element(documentRef, "code", { text: locked.eventId }),
            ]),
          ])
          : element(documentRef, "form", {
            className: "vr-wording-form",
            "data-vr-form": "wording",
            novalidate: "",
          }, [
            element(documentRef, "label", {
              className: "vr-field",
              for: "vrReviewedWording",
            }, [
              element(documentRef, "span", {
                text: "Exact bounded wording",
              }),
              element(documentRef, "textarea", {
                id: "vrReviewedWording",
                rows: "4",
                maxlength: "4000",
                required: true,
                disabled: !evidenceReady,
                "data-vr-wording": "",
                placeholder: "Select a local verdict code below to load its fixed scoped sentence.",
              }),
            ]),
            element(documentRef, "button", {
              className: "vr-primary-button",
              type: "submit",
              disabled: !evidenceReady,
              "data-vr-focus": "wording",
              text: evidenceReady
                ? "APPEND CODE + PUBLIC WORDING PASS"
                : "COMPLETE ALL 11 EVIDENCE CHECKS FIRST",
            }),
          ]),
      ]);
    }

    function verdictControls(docket) {
      var evidenceReady = docket.review.state === "EVIDENCE_CHECKED";
      var ready = docket.review.state === "WORDING_CHECKED";
      var adjudicated = docket.review.state === "ADJUDICATED";
      var lockedCode = text(docket.review.lockedVerdictCode);
      if (adjudicated) {
        return element(documentRef, "section", {
          className: "vr-terminal-state vr-terminal-adjudicated",
          "aria-labelledby": "vrAdjudicatedTitle",
        }, [
          element(documentRef, "p", {
            className: "vr-kicker",
            text: "ACTIVE ADJUDICATION // SEALED",
          }),
          element(documentRef, "h3", {
            id: "vrAdjudicatedTitle",
            text: "This decision cannot be edited or undone",
          }),
          element(documentRef, "p", {
            text: "The exact revision, wording event, and 12 check events are bound to the active decision. Undo, hold, rejection, and editing are unavailable; the only transition is the separately confirmed revocation above.",
          }),
        ]);
      }
      return element(documentRef, "fieldset", {
        className: "vr-verdict-controls",
      }, [
        element(documentRef, "legend", {
          text: evidenceReady
            ? "Local verdict // select before approving check 12"
            : "Local verdict // bound by check 12",
        }),
        element(documentRef, "p", {
          className: "vr-help",
          text: adjudicated
            ? "This revision already has one active local verdict."
            : evidenceReady
              ? "Select the code that matches the relied-on later receipts. Its fixed scoped sentence will load above."
              : ready
                ? "The selected code and fixed public sentence are locked together. Final confirmation names the exact docket."
                : "Verdict choices remain disabled. No formal or comedy result is available.",
        }),
        element(documentRef, "div", {
          className: "vr-verdict-options",
        }, Object.keys(VERDICT_COPY).map(function (code) {
          return element(documentRef, "label", {
            className: "vr-verdict-option",
          }, [
            element(documentRef, "input", {
              type: "radio",
              name: "vr-verdict",
              value: code,
              checked: lockedCode === code,
              disabled: !evidenceReady,
              "data-vr-verdict-code": code,
            }),
            element(documentRef, "span", {}, [
              element(documentRef, "strong", { text: code }),
              element(documentRef, "small", { text: VERDICT_COPY[code] }),
            ]),
          ]);
        })),
        element(documentRef, "button", {
          className: "vr-gavel-button",
          type: "button",
          disabled: !ready,
          "data-vr-action": "open-adjudicate",
          "data-vr-focus": "adjudicate",
          text: ready
            ? "REVIEW LOCAL VERDICT CONFIRMATION"
            : evidenceReady
              ? "SELECT CODE + APPROVE CHECK 12 ABOVE"
              : "VERDICT LOCKED // " + docket.review.checks.length + "/12",
        }),
      ]);
    }

    function utilityActions(docket, ledger) {
      if (docket.review.state === "REJECTED") {
        return element(documentRef, "section", {
          className: "vr-terminal-state vr-terminal-rejected",
          "aria-labelledby": "vrRejectedTitle",
          "data-vr-focus": "terminal-state",
          tabindex: "-1",
        }, [
          element(documentRef, "p", {
            className: "vr-kicker",
            text: "REVISION REJECTED // TERMINAL",
          }),
          element(documentRef, "h3", {
            id: "vrRejectedTitle",
            text: "This rejection cannot be undone or reopened",
          }),
          element(documentRef, "p", {
            text: "The rejection remains in append-only history. This docket has no active local verdict and exposes no undo; every hold, check, wording, adjudication, and rejection control remains unavailable.",
          }),
        ]);
      }
      if (docket.review.state === "ADJUDICATED") {
        return null;
      }
      var latest = ledger.length ? ledger[ledger.length - 1] : null;
      var undoable = latest &&
        ["ADJUDICATE", "REJECT", "REVOKE", "UNDO"].indexOf(
          latest.type
        ) < 0 &&
        ["ADJUDICATED", "REJECTED"].indexOf(docket.review.state) < 0;
      var canNeedsContext = [
        "UNREVIEWED",
        "EVIDENCE_CHECKED",
        "WORDING_CHECKED",
      ].indexOf(docket.review.state) >= 0;
      var canReject = ["ADJUDICATED", "REJECTED"].indexOf(
        docket.review.state
      ) < 0;
      return element(documentRef, "section", {
        className: "vr-utility-actions",
        "aria-labelledby": "vrDispositionTitle",
      }, [
        element(documentRef, "h3", {
          id: "vrDispositionTitle",
          text: "Hold, reject, or append an undo",
        }),
        element(documentRef, "p", {
          className: "vr-help",
          text: "Nothing is deleted. Revisions, rejection, undo, and revocation remain in the ledger.",
        }),
        element(documentRef, "div", {
          className: "vr-form-actions",
        }, [
          element(documentRef, "button", {
            className: "vr-quiet-button",
            type: "button",
            disabled: !canNeedsContext,
            "data-vr-action": "needs-context",
            text: "NEEDS MORE CONTEXT",
          }),
          element(documentRef, "button", {
            className: "vr-quiet-button",
            type: "button",
            disabled: !undoable,
            "data-vr-action": "undo-latest",
            "data-event-id": undoable ? latest.id : "",
            text: undoable ? "APPEND UNDO FOR LATEST EVENT" : "NO UNDO AVAILABLE",
          }),
        ]),
        element(documentRef, "form", {
          className: "vr-reject-form",
          "data-vr-form": "reject",
          novalidate: "",
        }, [
          element(documentRef, "label", {
            className: "vr-field",
            for: "vrRejectReason",
          }, [
            element(documentRef, "span", { text: "Reject revision because" }),
            element(documentRef, "select", {
              id: "vrRejectReason",
              required: true,
              disabled: !canReject,
              "data-vr-reject-reason": "",
            }, [
              option(documentRef, "", "Choose reason", true, true),
            ].concat(Object.keys(REJECTION_COPY).map(function (code) {
              return option(
                documentRef,
                code,
                REJECTION_COPY[code],
                false,
                false
              );
            }))),
          ]),
          element(documentRef, "button", {
            className: "vr-danger-button",
            type: "submit",
            disabled: !canReject,
            text: "REVIEW TERMINAL REJECTION",
          }),
        ]),
      ]);
    }

    function reviewWorkflow(docket, ledger) {
      var complete = docket.review.checks.length;
      if (state.stale) {
        return element(documentRef, "section", {
          className: "vr-review vr-review-locked",
          "aria-labelledby": "vrReviewLockedTitle",
        }, [
          element(documentRef, "p", {
            className: "vr-kicker",
            text: "REVIEW CONTROLS WITHHELD // STALE INPUT",
          }),
          element(documentRef, "h2", {
            id: "vrReviewLockedTitle",
            text: "No local event can be recorded",
          }),
          element(documentRef, "p", {
            text: "The displayed evidence is a read-only last-known view. Restore against the exact bound inputs or begin a new local session before reviewing.",
          }),
        ]);
      }
      if (docket.review.state === "REJECTED") {
        return element(documentRef, "section", {
          className: "vr-review vr-review-terminal",
          "aria-labelledby": "vrReviewTitle",
        }, [
          element(documentRef, "div", {
            className: "vr-section-heading",
          }, [
            element(documentRef, "div", {}, [
              element(documentRef, "p", {
                className: "vr-kicker",
                text: "HUMAN REVIEW // TERMINAL RECORD",
              }),
              element(documentRef, "h2", {
                id: "vrReviewTitle",
                text: "This revision is closed",
              }),
            ]),
            element(documentRef, "strong", {
              className: "vr-stage-score",
              text: complete + "/12 PASS BEFORE REJECTION",
            }),
          ]),
          utilityActions(docket, ledger),
        ]);
      }
      return element(documentRef, "section", {
        className: "vr-review",
        "aria-labelledby": "vrReviewTitle",
      }, [
        element(documentRef, "div", { className: "vr-section-heading" }, [
          element(documentRef, "div", {}, [
            element(documentRef, "p", {
              className: "vr-kicker",
              text: "HUMAN REVIEW // EXACT EVENTS",
            }),
            element(documentRef, "h2", {
              id: "vrReviewTitle",
              text: "Three stages. Twelve checks. No shortcut.",
            }),
          ]),
          element(documentRef, "div", {
            className: "vr-progress-copy",
          }, [
            element(documentRef, "strong", {
              text: complete + "/12 PASS",
            }),
            element(documentRef, "progress", {
              max: "12",
              value: String(complete),
              "aria-label": complete + " of 12 review checks passed",
            }),
          ]),
        ]),
        actorControls(ledger),
        STAGES.map(function (stage) {
          return reviewStage(stage, docket);
        }),
        wordingStage(docket),
        verdictControls(docket),
        utilityActions(docket, ledger),
      ]);
    }

    function ledgerPanel(ledger) {
      return element(documentRef, "details", {
        className: "vr-ledger",
      }, [
        element(documentRef, "summary", {
          text: "APPEND-ONLY HISTORY // " + ledger.length + " EVENT" +
            (ledger.length === 1 ? "" : "S"),
        }),
        element(documentRef, "p", {
          className: "vr-help",
          text: "Every row stays in deterministic sequence. Hashes expose structural edits but do not authenticate a person.",
        }),
        ledger.length
          ? element(documentRef, "ol", {
            className: "vr-event-list",
          }, ledger.map(function (event) {
            return element(documentRef, "li", {}, [
              element(documentRef, "div", {
                className: "vr-event-heading",
              }, [
                element(documentRef, "strong", {
                  text: String(event.sequence).padStart(4, "0") +
                    " // " + event.type,
                }),
                element(documentRef, "time", {
                  datetime: event.at,
                  text: event.at,
                }),
              ]),
              element(documentRef, "p", {
                text: event.before.state + " \u2192 " + event.after.state +
                  " // REV " + event.after.revision,
              }),
              element(documentRef, "p", {
                text: event.reviewer.role +
                  " // CALLER-ATTESTED / NOT IDENTITY-VERIFIED",
              }),
              element(documentRef, "p", { text: event.notes }),
              element(documentRef, "code", {
                title: event.eventHash,
                text: event.eventHash,
              }),
            ]);
          }))
          : element(documentRef, "p", {
            className: "vr-empty",
            text: "No local human events recorded.",
          }),
      ]);
    }

    function transferPanel() {
      var importAvailable = Boolean(restoreSession);
      var exportAvailable = Boolean(download);
      return element(documentRef, "details", {
        className: "vr-transfer",
      }, [
        element(documentRef, "summary", {
          text: "BOUNDED EXPORT / ALL-OR-NOTHING IMPORT",
        }),
        element(documentRef, "div", {
          className: "vr-transfer-grid",
        }, [
          element(documentRef, "section", {}, [
            element(documentRef, "h3", { text: "Deterministic export" }),
            element(documentRef, "p", {
              text: "Exports are inert UTF-8 text payloads containing the bounded ledger, excerpts, and official links. Treat every JSON or Markdown field as untrusted text; never inject it into HTML. No media, captions, cookies, tokens, or generated export time.",
            }),
            element(documentRef, "div", {
              className: "vr-form-actions",
            }, [
              element(documentRef, "button", {
                className: "vr-primary-button",
                type: "button",
                disabled: !exportAvailable,
                "data-vr-action": "export-json",
                text: exportAvailable
                  ? "DOWNLOAD LOCAL SNAPSHOT JSON"
                  : "DOWNLOAD HOST UNAVAILABLE",
              }),
              element(documentRef, "button", {
                className: "vr-quiet-button",
                type: "button",
                disabled: !exportAvailable,
                "data-vr-action": "export-markdown",
                text: "DOWNLOAD LOCAL REVIEW TEXT (.MD)",
              }),
            ]),
          ]),
          element(documentRef, "form", {
            "data-vr-form": "import",
            novalidate: "",
          }, [
            element(documentRef, "h3", { text: "Verified local restore" }),
            element(documentRef, "p", {
              text: importAvailable
                ? "Paste canonical JSON. The current room remains untouched unless full binding, hash-chain, semantic replay, and snapshot equality pass."
                : "Import requires a host-supplied restore callback bound to the current canonical inputs.",
            }),
            element(documentRef, "label", {
              className: "vr-field",
              for: "vrImportJson",
            }, [
              element(documentRef, "span", {
                text: "Canonical Verdict Room JSON // 2 MB maximum",
              }),
              element(documentRef, "textarea", {
                id: "vrImportJson",
                rows: "6",
                maxlength: String(MAX_IMPORT_BYTES),
                disabled: !importAvailable,
                required: true,
                spellcheck: "false",
                "data-vr-import-json": "",
              }),
            ]),
            element(documentRef, "label", {
              className: "vr-attestation",
            }, [
              element(documentRef, "input", {
                type: "checkbox",
                required: true,
                disabled: !importAvailable,
                "data-vr-import-confirm": "",
              }),
              element(documentRef, "span", {
                text: "I understand a valid restore replaces the displayed local session. It does not merge, publish, or alter canon.",
              }),
            ]),
            element(documentRef, "button", {
              className: "vr-primary-button",
              type: "submit",
              disabled: !importAvailable,
              text: "VERIFY ENTIRE FILE, THEN RESTORE",
            }),
          ]),
        ]),
      ]);
    }

    function confirmationDialog(docket) {
      return element(documentRef, "dialog", {
        className: "vr-dialog",
        "data-vr-dialog": "",
        "aria-labelledby": "vrDialogTitle",
        "aria-describedby": "vrDialogConsequence",
      }, [
        element(documentRef, "p", {
          className: "vr-kicker",
          text: "EXPLICIT LOCAL CONFIRMATION",
        }),
        element(documentRef, "h2", {
          id: "vrDialogTitle",
          "data-vr-dialog-title": "",
          text: "Confirm local review event",
        }),
        element(documentRef, "p", {
          className: "vr-dialog-docket",
          text: docket.title + " // " + docket.id,
        }),
        element(documentRef, "p", {
          id: "vrDialogConsequence",
          "data-vr-dialog-copy": "",
          text: "No pending action.",
        }),
        element(documentRef, "dl", {
          className: "vr-dialog-binding",
          "aria-label": "Exact event binding",
        }, [
          fact(
            "EVENT",
            "NONE",
            "The exact event that will be appended."
          ),
          fact(
            "BOUND REVISION",
            "NONE",
            "The exact review revision expected at confirmation."
          ),
          fact(
            "LOCKED WORDING EVENT",
            "NONE",
            "The exact wording event expected at adjudication."
          ),
          fact(
            "ORDERED CHECK EVENTS",
            "NONE",
            "The exact ordered check-event set expected at adjudication."
          ),
          fact(
            "EXACT LOCKED WORDING / REASON",
            "NONE",
            "The exact wording or terminal rejection reason being confirmed."
          ),
        ].map(function (row, index) {
          row.setAttribute("data-vr-dialog-binding", String(index));
          return row;
        })),
        element(documentRef, "div", {
          className: "vr-dialog-error",
          role: "alert",
          tabindex: "-1",
          hidden: true,
          "data-vr-dialog-error": "",
        }),
        element(documentRef, "div", {
          className: "vr-form-actions",
        }, [
          element(documentRef, "button", {
            className: "vr-gavel-button",
            type: "button",
            "data-vr-action": "confirm-dialog",
            "data-vr-focus": "dialog-confirm",
            text: "CONFIRM",
          }),
          element(documentRef, "button", {
            className: "vr-quiet-button",
            type: "button",
            "data-vr-action": "cancel-dialog",
            text: "CANCEL",
          }),
        ]),
      ]);
    }

    function stalePanel() {
      return element(documentRef, "section", {
        className: "vr-stale",
        role: "alert",
      }, [
        element(documentRef, "p", {
          className: "vr-kicker",
          text: "STALE INPUT // FAIL CLOSED",
        }),
        element(documentRef, "h2", {
          text: "The canonical evidence changed",
        }),
        element(documentRef, "p", {
          text: "All prior formal labels, comedy labels, and reviewed wording are suppressed. Restore against the exact bound input or begin a new local session.",
        }),
      ]);
    }

    function render() {
      var view;
      try {
        view = model();
      } catch (error) {
        view = {
          queue: state.cachedQueue,
          docket: state.cachedDocket,
          ledger: state.cachedLedger,
          projection: null,
          metrics: null,
        };
        state.error = (error.code || "RENDER_FAILED") + ": " + error.message;
      }
      var content = [
        element(documentRef, "div", {
          className: "vr-error-summary",
          role: "alert",
          tabindex: "-1",
          hidden: !state.error,
          "data-vr-error": "",
        }, state.error ? errorContent() : []),
        element(documentRef, "div", {
          className: "vr-live",
          role: "status",
          "aria-live": "polite",
          "aria-atomic": "true",
          "data-vr-live": "",
          text: state.notice,
        }),
        header(view),
        boundaryBanner(),
      ];
      if (state.stale) content.push(stalePanel());
      if (view.queue.length) content.push(queueRail(view));
      if (view.docket) {
        content.push(
          bindingPanel(view.docket),
          evidenceCourt(view.docket),
          verdictPanel(view.docket, view.projection),
          reviewWorkflow(view.docket, view.ledger),
          ledgerPanel(view.ledger),
          transferPanel(),
          confirmationDialog(view.docket.binding)
        );
      } else if (!state.stale) {
        content.push(
          element(documentRef, "p", {
            className: "vr-empty",
            text: "No bounded dockets are available in this local session.",
          })
        );
      }
      var shell = element(documentRef, "section", {
        className: "verdict-room",
        "aria-labelledby": "vrTitle",
        "data-verdict-room": "",
      }, content);
      mount.replaceChildren(shell);
      if (state.pendingFocus) {
        var target = query(
          '[data-vr-focus="' + state.pendingFocus + '"]'
        );
        state.pendingFocus = "";
        if (target && typeof target.focus === "function") target.focus();
      }
    }

    function finishMutation(successMessage, focusKey) {
      state.error = "";
      state.errorOrigin = null;
      state.notice = successMessage;
      state.activeCheck = "";
      state.pendingFocus = focusKey || "";
      clearEventDraft();
      render();
    }

    function mutate(callback, successMessage, focusKey, errorOrigin) {
      try {
        callback();
        finishMutation(successMessage, focusKey);
      } catch (error) {
        showError(error, errorOrigin);
      }
    }

    function valueFrom(scope, selector, message) {
      var control = query(selector, scope);
      var value = clean(control && control.value);
      if (!value) {
        var error = uiError("FIELD_REQUIRED", message, selector);
        error.focusNode = control;
        throw error;
      }
      return value;
    }

    function submitCheck(form) {
      var code = clean(form.getAttribute("data-check-code"));
      var action = Object.assign(commonAction(), {
        code: code,
        status: "PASS",
      });
      if (code === "CONTRADICTION_SWEEP") {
        action.receiptDispositions = queryAll(
          "[data-vr-receipt]",
          form
        ).map(function (row) {
          return {
            receiptId: row.getAttribute("data-vr-receipt"),
            disposition: valueFrom(
              row,
              "[data-vr-receipt-disposition]",
              "Choose a disposition for every exact receipt."
            ),
            stance: valueFrom(
              row,
              "[data-vr-receipt-stance]",
              "Choose a local stance for every exact receipt."
            ),
            reason: valueFrom(
              row,
              "[data-vr-receipt-reason]",
              "Explain every receipt disposition."
            ),
          };
        });
      }
      if (code === "OUTCOME_REVIEW") {
        action.outcomeReview = {
          method: valueFrom(
            form,
            "[data-vr-outcome-method]",
            "Choose the human outcome review method."
          ),
          sourceReference: valueFrom(
            form,
            "[data-vr-outcome-source]",
            "Record the locally reviewed outcome source reference."
          ),
          notes: valueFrom(
            form,
            "[data-vr-outcome-notes]",
            "Add human outcome review notes."
          ),
        };
      }
      mutate(function () {
        room.recordCheck(state.selectedId, action);
      }, CHECK_COPY[code].label + " PASS appended to the local ledger.",
      "check-" + code, form);
    }

    function reviewSnapshot(review) {
      return {
        state: review.state,
        revision: review.revision,
        wording: text(review.wording),
        wordingEventId: text(review.wordingEventId),
        lockedVerdictCode: text(review.lockedVerdictCode),
        checkEventIds: array(review.checks).map(function (check) {
          return text(check.eventId);
        }),
        activeDecisionId: text(review.activeDecisionId),
      };
    }

    function sameStrings(left, right) {
      return (
        left.length === right.length &&
        left.every(function (value, index) {
          return value === right[index];
        })
      );
    }

    function setDialogFact(dialog, index, value) {
      var row = query(
        '[data-vr-dialog-binding="' + index + '"]',
        dialog
      );
      var target = row ? query("dd", row) : null;
      if (target) {
        target.textContent = text(value);
        target.setAttribute("title", text(value));
      }
    }

    function openDialog(kind, origin, detail) {
      var docket = room.getDocket(state.selectedId);
      var expected = reviewSnapshot(docket.review);
      var pending;
      if (kind === "adjudicate") {
        var lockedCode = expected.lockedVerdictCode;
        if (!lockedCode) {
          throw uiError(
            "VERDICT_REQUIRED",
            "Check 12 must bind one scoped verdict code before confirmation.",
            "[data-vr-verdict-code]"
          );
        }
        pending = {
          kind: kind,
          docketId: docket.id,
          expected: expected,
          action: Object.assign(commonAction(), {
            verdictCode: lockedCode,
            expectedRevision: expected.revision,
            wording: expected.wording,
            wordingEventId: expected.wordingEventId,
            checkEventIds: expected.checkEventIds.slice(),
          }),
          title: "Adjudicate this exact local docket?",
          copy: "This appends one " + lockedCode +
            " decision for revision " + docket.review.revision +
            ", bound to the displayed wording event and ordered 12-check event set. It creates a device-local overlay only; it does not publish, certify, or mutate canon.",
          eventLabel: "ADJUDICATE // " + lockedCode,
          exactValue: expected.wording,
          confirmLabel: "APPEND EXACT LOCAL VERDICT",
        };
      } else if (kind === "reject") {
        var reasonCode = clean(detail && detail.reasonCode);
        if (!reasonCode) {
          throw uiError(
            "REJECTION_REQUIRED",
            "Choose a bounded rejection reason before confirmation.",
            "[data-vr-reject-reason]"
          );
        }
        pending = {
          kind: kind,
          docketId: docket.id,
          expected: expected,
          action: Object.assign(commonAction(), {
            reasonCode: reasonCode,
          }),
          title: "Terminally reject this exact revision?",
          copy: "This appends a terminal rejection for revision " +
            expected.revision +
            ". It cannot be undone or reopened. No local verdict will be created.",
          eventLabel: "REJECT // " + reasonCode,
          exactValue: reasonCode,
          confirmLabel: "APPEND TERMINAL REJECTION",
        };
      } else {
        pending = {
          kind: kind,
          docketId: docket.id,
          expected: expected,
          action: Object.assign(commonAction(), {
            decisionId: docket.review.activeDecisionId,
          }),
          title: "Revoke this exact local verdict?",
          copy: "This appends a revocation for " +
            docket.review.activeDecisionId +
            ". Formal, comedy, and reviewed wording disappear immediately, while every prior event remains in history.",
          eventLabel: "REVOKE // " + docket.review.activeDecisionId,
          exactValue: expected.wording,
          confirmLabel: "APPEND EXACT REVOCATION",
        };
      }
      state.pendingDialog = pending;
      state.dialogOrigin = origin;
      var dialog = query("[data-vr-dialog]");
      query("[data-vr-dialog-title]", dialog).textContent = pending.title;
      query("[data-vr-dialog-copy]", dialog).textContent = pending.copy;
      setDialogFact(dialog, 0, pending.eventLabel);
      setDialogFact(dialog, 1, expected.revision);
      setDialogFact(
        dialog,
        2,
        expected.wordingEventId || "NOT APPLICABLE"
      );
      setDialogFact(
        dialog,
        3,
        expected.checkEventIds.length
          ? expected.checkEventIds.join(" // ")
          : "NOT APPLICABLE"
      );
      setDialogFact(dialog, 4, pending.exactValue || "NOT APPLICABLE");
      var dialogError = query("[data-vr-dialog-error]", dialog);
      if (dialogError) {
        dialogError.hidden = true;
        dialogError.setAttribute("hidden", "");
        dialogError.textContent = "";
      }
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
      var confirmButton = query('[data-vr-action="confirm-dialog"]', dialog);
      if (confirmButton) confirmButton.textContent = pending.confirmLabel;
      if (confirmButton && typeof confirmButton.focus === "function") {
        confirmButton.focus();
      }
    }

    function closeDialog(restoreFocus) {
      var dialog = query("[data-vr-dialog]");
      if (dialog) {
        if (typeof dialog.close === "function" && dialog.open) {
          dialog.close();
        } else {
          dialog.removeAttribute("open");
        }
      }
      var origin = state.dialogOrigin;
      state.pendingDialog = null;
      state.dialogOrigin = null;
      state.error = "";
      state.errorOrigin = null;
      if (
        restoreFocus &&
        origin &&
        typeof origin.focus === "function" &&
        mount.contains(origin)
      ) {
        origin.focus();
      }
    }

    function assertPendingUnchanged(pending) {
      var current = room.getDocket(pending.docketId);
      var actual = reviewSnapshot(current.review);
      var expected = pending.expected;
      if (
        actual.state !== expected.state ||
        actual.revision !== expected.revision ||
        actual.wording !== expected.wording ||
        actual.wordingEventId !== expected.wordingEventId ||
        actual.lockedVerdictCode !== expected.lockedVerdictCode ||
        actual.activeDecisionId !== expected.activeDecisionId ||
        !sameStrings(actual.checkEventIds, expected.checkEventIds)
      ) {
        throw uiError(
          "CONFIRMATION_STALE",
          "The exact review revision changed after this dialog opened. Cancel and review the current docket before confirming again."
        );
      }
    }

    function showDialogError(error) {
      var code = clean(error && error.code) || "REVIEW_FAILED";
      var message = clean(error && error.message) ||
        "The local review event was rejected.";
      state.error = code + ": " + message;
      var dialog = query("[data-vr-dialog]");
      var summary = dialog && query("[data-vr-dialog-error]", dialog);
      if (summary) {
        summary.hidden = false;
        summary.removeAttribute("hidden");
        summary.textContent = "EVENT NOT SAVED // " + state.error +
          " Your form values and exact confirmation remain unchanged.";
        summary.focus();
      }
      announce("Review event not saved. " + message);
    }

    function returnToErrorOrigin() {
      var origin = state.errorOrigin;
      var summary = query("[data-vr-error]");
      state.error = "";
      state.errorOrigin = null;
      if (summary) {
        summary.hidden = true;
        summary.setAttribute("hidden", "");
        summary.replaceChildren();
      }
      if (
        origin &&
        typeof origin.focus === "function" &&
        mount.contains(origin)
      ) {
        origin.focus();
        announce("Returned to the preserved correction field.");
      }
    }

    function confirmDialog() {
      var pending = state.pendingDialog;
      if (!pending) {
        showError(uiError("CONFIRMATION_MISSING", "No local action is pending."));
        return;
      }
      try {
        assertPendingUnchanged(pending);
        if (pending.kind === "adjudicate") {
          room.adjudicate(pending.docketId, pending.action);
          closeDialog(false);
          finishMutation(
            "Local verdict appended. This remains device-local and not canon.",
            "revoke"
          );
        } else if (pending.kind === "reject") {
          room.reject(pending.docketId, pending.action);
          closeDialog(false);
          finishMutation(
            "Terminal rejection appended. It cannot be undone or reopened.",
            "terminal-state"
          );
        } else {
          room.revoke(pending.docketId, pending.action);
          closeDialog(false);
          finishMutation(
            "Local verdict revoked. Public verdict copy was removed.",
            "adjudicate"
          );
        }
      } catch (error) {
        showDialogError(error);
      }
    }

    function exportFile(kind, origin) {
      try {
        if (!download) {
          throw uiError(
            "DOWNLOAD_UNAVAILABLE",
            "The host did not provide a bounded download handler."
          );
        }
        var contents = kind === "json"
          ? room.exportJSON(2)
          : room.exportMarkdown();
        if (typeof contents !== "string") {
          throw uiError(
            "EXPORT_INVALID",
            "The engine did not return an inert text export."
          );
        }
        if (byteLength(contents) > MAX_IMPORT_BYTES) {
          throw uiError(
            "EXPORT_LIMIT",
            "The local export exceeds the 2 MB transfer boundary."
          );
        }
        var extension = kind === "json" ? "json" : "md";
        var mime = kind === "json"
          ? "application/json;charset=utf-8"
          : "text/markdown;charset=utf-8";
        download(
          safeFilename(room.session && room.session.id) +
            ".verdict-room." + extension,
          contents,
          mime
        );
        announce(
          "Deterministic " + extension.toUpperCase() +
          " text export prepared locally. Nothing was rendered or published."
        );
      } catch (error) {
        showError(error, origin);
      }
    }

    function importFile(form) {
      try {
        if (!restoreSession) {
          throw uiError(
            "IMPORT_UNAVAILABLE",
            "The host did not provide a canonical restore callback."
          );
        }
        var contents = text(
          query("[data-vr-import-json]", form).value
        );
        if (!clean(contents)) {
          throw uiError("IMPORT_REQUIRED", "Paste canonical JSON to restore.");
        }
        if (byteLength(contents) > MAX_IMPORT_BYTES) {
          throw uiError(
            "IMPORT_LIMIT",
            "Verdict Room import exceeds the 2 MB transfer boundary."
          );
        }
        var confirmed = query("[data-vr-import-confirm]", form);
        if (!confirmed || confirmed.checked !== true) {
          throw uiError(
            "IMPORT_CONFIRMATION_REQUIRED",
            "Confirm that a valid restore replaces this displayed local session."
          );
        }
        var candidate = requireEngine(restoreSession(contents));
        if (
          candidate.context.channelId !== room.context.channelId ||
          candidate.context.channelPackFingerprint !==
            room.context.channelPackFingerprint
        ) {
          throw uiError(
            "IMPORT_BINDING_MISMATCH",
            "The restored room is bound to a different channel or ChannelPack."
          );
        }
        room = candidate;
        state.selectedId = "";
        state.cachedQueue = [];
        state.cachedDocket = null;
        state.cachedLedger = [];
        state.notice =
          "Entire local session verified and restored. Nothing was merged or published.";
        state.error = "";
        state.errorOrigin = null;
        clearEventDraft();
        state.pendingFocus = "docket-heading";
        render();
      } catch (error) {
        showError(error, form);
      }
    }

    function handleClick(event) {
      var actionNode = directAction(event.target, mount);
      if (!actionNode || actionNode.disabled === true) return;
      var action = actionNode.getAttribute("data-vr-action");
      try {
        if (action === "select-docket") {
          setActorFromDom();
          state.selectedId = actionNode.getAttribute("data-docket-id");
          state.activeCheck = "";
          state.error = "";
          state.notice = "Opened exact local docket " + state.selectedId + ".";
          state.pendingFocus = "docket-heading";
          render();
        } else if (action === "open-check") {
          setActorFromDom();
          state.activeCheck = actionNode.getAttribute("data-check-code");
          state.pendingFocus = "active-check";
          render();
        } else if (action === "close-check") {
          setActorFromDom();
          state.activeCheck = "";
          state.pendingFocus = "";
          render();
        } else if (action === "needs-context") {
          var contextAction = commonAction();
          mutate(function () {
            room.markNeedsContext(state.selectedId, contextAction);
          }, "Docket moved to NEEDS_CONTEXT in the append-only ledger.",
          "", actionNode);
        } else if (action === "undo-latest") {
          var undoAction = Object.assign(commonAction(), {
            eventId: actionNode.getAttribute("data-event-id"),
          });
          mutate(function () {
            room.undo(state.selectedId, undoAction);
          }, "Append-only undo recorded. No history was deleted.",
          "", actionNode);
        } else if (action === "open-adjudicate") {
          openDialog("adjudicate", actionNode);
        } else if (action === "open-revoke") {
          openDialog("revoke", actionNode);
        } else if (action === "cancel-dialog") {
          closeDialog(true);
        } else if (action === "confirm-dialog") {
          confirmDialog();
        } else if (action === "return-error") {
          returnToErrorOrigin();
        } else if (action === "export-json") {
          exportFile("json", actionNode);
        } else if (action === "export-markdown") {
          exportFile("markdown", actionNode);
        }
      } catch (error) {
        showError(error, actionNode);
      }
    }

    function handleChange(event) {
      var target = event.target;
      if (
        target &&
        target.getAttribute &&
        target.getAttribute("data-vr-action") === "toggle-profanity"
      ) {
        state.reducedProfanity = target.checked === true;
        state.pendingFocus = "profanity-toggle";
        state.notice = "Reduced-profanity display " +
          (state.reducedProfanity ? "enabled." : "disabled.");
        render();
        return;
      }
      if (
        target &&
        target.getAttribute &&
        target.getAttribute("data-vr-verdict-code") != null &&
        target.checked === true
      ) {
        var wordingControl = query("[data-vr-wording]");
        var fixedWording = room.policy.wordingByVerdictCode &&
          room.policy.wordingByVerdictCode[target.value];
        if (wordingControl && fixedWording) {
          wordingControl.value = fixedWording;
        }
      }
      setActorFromDom();
    }

    function handleInput() {
      setActorFromDom();
    }

    function handleSubmit(event) {
      var kind = formKind(event.target);
      if (!kind) return;
      event.preventDefault();
      try {
        if (kind === "check") {
          submitCheck(event.target);
        } else if (kind === "wording") {
          var selectedCode = query('[data-vr-verdict-code]:checked');
          if (!selectedCode) {
            throw uiError(
              "VERDICT_REQUIRED",
              "Select one scoped verdict code before approving check 12.",
              "[data-vr-verdict-code]"
            );
          }
          var wording = valueFrom(
            event.target,
            "[data-vr-wording]",
            "Enter the exact bounded wording before locking check 12."
          );
          var wordingAction = Object.assign(commonAction(), {
            verdictCode: selectedCode.value,
            wording: wording,
          });
          mutate(function () {
            room.lockWording(state.selectedId, wordingAction);
          }, "Public wording PASS appended. All 12 checks are complete.",
          "adjudicate", event.target);
        } else if (kind === "reject") {
          var reasonCode = valueFrom(
            event.target,
            "[data-vr-reject-reason]",
            "Choose a bounded rejection reason."
          );
          openDialog(
            "reject",
            query('button[type="submit"]', event.target) || event.target,
            { reasonCode: reasonCode }
          );
        } else if (kind === "import") {
          importFile(event.target);
        }
      } catch (error) {
        showError(error, event.target);
      }
    }

    function handleCancel(event) {
      if (
        event.target &&
        event.target.getAttribute &&
        event.target.getAttribute("data-vr-dialog") != null
      ) {
        event.preventDefault();
        closeDialog(true);
      }
    }

    function mountController() {
      if (state.mounted) return controller;
      var active = ACTIVE_MOUNTS.get(mount);
      if (active && active !== controller) {
        throw uiError(
          "MOUNT_IN_USE",
          "This mount already has an active Verdict Room controller."
        );
      }
      ACTIVE_MOUNTS.set(mount, controller);
      originalNodes = Array.from(mount.childNodes || []);
      mountHadAttribute = mount.hasAttribute("data-verdict-room-mounted");
      mountAttribute = mount.getAttribute("data-verdict-room-mounted");
      focusBeforeMount = documentRef.activeElement;
      mount.setAttribute("data-verdict-room-mounted", VERSION);
      mount.addEventListener("click", handleClick);
      mount.addEventListener("change", handleChange);
      mount.addEventListener("input", handleInput);
      mount.addEventListener("submit", handleSubmit);
      mount.addEventListener("cancel", handleCancel, true);
      state.mounted = true;
      render();
      return controller;
    }

    function destroy() {
      if (!state.mounted) return;
      var focusWasInside = Boolean(
        documentRef.activeElement &&
        mount.contains(documentRef.activeElement)
      );
      mount.removeEventListener("click", handleClick);
      mount.removeEventListener("change", handleChange);
      mount.removeEventListener("input", handleInput);
      mount.removeEventListener("submit", handleSubmit);
      mount.removeEventListener("cancel", handleCancel, true);
      closeDialog(false);
      mount.replaceChildren.apply(mount, originalNodes);
      if (mountHadAttribute) {
        mount.setAttribute("data-verdict-room-mounted", mountAttribute);
      } else {
        mount.removeAttribute("data-verdict-room-mounted");
      }
      ACTIVE_MOUNTS.delete(mount);
      state.mounted = false;
      if (
        focusWasInside &&
        focusBeforeMount &&
        typeof focusBeforeMount.focus === "function"
      ) {
        focusBeforeMount.focus();
      }
    }

    function refresh() {
      if (!state.mounted) return controller;
      setActorFromDom();
      render();
      return controller;
    }

    var controller = Object.freeze({
      mount: mountController,
      destroy: destroy,
      refresh: refresh,
      getState: function () {
        return Object.freeze({
          mounted: state.mounted,
          selectedId: state.selectedId,
          activeCheck: state.activeCheck,
          reducedProfanity: state.reducedProfanity,
          stale: state.stale,
          notice: state.notice,
          error: state.error,
          eventCount: state.cachedLedger.length,
        });
      },
      getEngine: function () {
        return room;
      },
    });
    return controller;
  }

  root.ShokkerVerdictRoomUI = Object.freeze({
    VERSION: VERSION,
    CHECK_COPY: CHECK_COPY,
    STAGES: STAGES,
    create: create,
  });
})(typeof window !== "undefined" ? window : globalThis);
