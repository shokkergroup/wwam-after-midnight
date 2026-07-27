(function (global) {
  "use strict";

  var VERSION = "1.0.1";

  function renderClaimAudit(options) {
    var trustEngine = options.trustEngine;
    var esc = options.esc;
    var timelines = trustEngine.timelineAudits.slice().sort(function (a, b) {
      return b.projectedOrAmbiguousReceiptIds.length - a.projectedOrAmbiguousReceiptIds.length;
    }).slice(0, 8);
    var courts = trustEngine.courtAudits.slice(0, 6);
    return '<div class="canon-lane-head warning"><div><span>DISCOVERY CANDIDATES // NOT CREATOR-CERTIFIED CANON</span><h3>0 TAKE TIMELINES AND 0 COURTS CURRENTLY PASS THE STRICT CANON GATE.</h3></div><p>Receipt trails and machine-surfaced argument boards—not host-change claims or verdicts.</p></div>' +
      '<div class="claim-audit"><section><header><span>TAKE TIMELINE AUDIT</span><b>' +
      trustEngine.metrics.timelines + ' REVIEWED</b></header>' + timelines.map(function (timeline) {
        return '<article><div><h4>' + esc(timeline.subject) + '</h4><b>' +
          timeline.directOpinionReceiptIds.length + '/' + Number(timeline.receipts || 0) + ' DIRECT</b></div><p>' +
          esc(timeline.safePublicLabel) + '</p><small>' +
          timeline.projectedOrAmbiguousReceiptIds.length + ' AMBIGUOUS OR PROJECTED RECEIPTS // CANON BLOCKED</small></article>';
      }).join("") + '</section><section><header><span>COURT AUDIT</span><b>' +
      trustEngine.metrics.courts + ' REVIEWED</b></header>' + courts.map(function (court) {
        return '<article><div><h4>' + esc(court.title) + '</h4><b>' + esc(court.verdict) +
          '</b></div><p>' + esc(court.safePublicLabel) + '</p><small>' +
          court.directProsecutionReceipts.length + ' DIRECT PROSECUTION // ' +
          court.directDefenseReceipts.length + ' DIRECT DEFENSE</small></article>';
      }).join("") + '</section></div>';
  }


  function reviewCandidateButton(candidate, state, esc) {
    return '<button class="' + (candidate.id === state.reviewSelected ? "on" : "") +
      '" data-review-select="' + esc(candidate.id) + '"><span>' +
      esc(candidate.origin.toUpperCase() + " // " + candidate.severity + " // " +
        candidate.reviewStatus.replace(/-/g, " ").toUpperCase()) +
      '</span><b>' + esc(candidate.title) + '</b><small>' +
      candidate.evidence.length + ' EVIDENCE RECEIPT' +
      (candidate.evidence.length === 1 ? "" : "S") + '</small></button>';
  }

  function renderHumanReviewSession(options) {
    var humanReviewSession = options.session;
    var state = options.state;
    var esc = options.esc;
    var timestamp = options.timestamp;
    var canonEvidenceButton = options.evidenceButton;
    var transitionsByStatus = options.transitions || {};
    if (!humanReviewSession) {
      return '<p class="memory-empty">THE LOCAL REVIEW SESSION COULD NOT INITIALIZE. NO DECISIONS WERE RECORDED.</p>';
    }
    var filters = {
      origin: state.reviewOrigin,
      status: state.reviewStatus,
      query: state.reviewQuery,
    };
    var allMatches = humanReviewSession.getQueue(filters);
    var queue = allMatches.slice(0, 40);
    if (!state.reviewSelected || !allMatches.some(function (item) {
      return item.id === state.reviewSelected;
    })) {
      state.reviewSelected = queue[0] ? queue[0].id : "";
    }
    var candidate = state.reviewSelected ? humanReviewSession.getCandidate(state.reviewSelected) : null;
    var history = candidate ? humanReviewSession.getLedger(candidate.id) : [];
    var metrics = humanReviewSession.metrics;
    var transitions = candidate && transitionsByStatus[candidate.reviewStatus] || [];
    var evidence = candidate ? candidate.evidence : [];
    var dossier = candidate ?
      '<article class="review-dossier"><header><div><span>' +
      esc(candidate.origin.toUpperCase() + " FINDING // " + candidate.kind.toUpperCase()) +
      '</span><h4>' + esc(candidate.title) + '</h4></div><b>' +
      esc(candidate.reviewStatus.replace(/-/g, " ").toUpperCase()) +
      '</b></header><p>' + esc(candidate.summary || candidate.claim || "No summary supplied.") +
      '</p><blockquote>' + esc(candidate.recommendation || "Human context review required.") +
      '</blockquote><div class="review-evidence"><span>ATTACHED PLAYABLE EVIDENCE // CHECK BEFORE POSITIVE ROUTING</span>' +
      (evidence.length ? evidence.map(function (item, index) {
        return '<div class="review-evidence-row"><input type="checkbox" aria-label="Include receipt ' +
          String(index + 1) + '" data-review-evidence value="' + esc(item.id) +
          '" ' + (item.eligibleForProgression ? "checked" : "disabled") + '><b>RECEIPT ' +
          String(index + 1).padStart(2, "0") + '</b><span>' +
          esc((item.sourceId || "UNRESOLVED SOURCE") + " @ " +
            (item.t == null ? "NO TIME" : timestamp(item.t)) + " // " +
            (item.evidenceLevel || "UNLABELED")) + '</span>' +
          (item.sourceId && item.t != null ?
            canonEvidenceButton(item, "OPEN FULL SOURCE CONTEXT") : "") + '</div>';
      }).join("") :
        '<div class="review-no-evidence">NO PLAYABLE RECEIPT ATTACHED. POSITIVE PROGRESSION IS LOCKED.</div>') +
      '</div><form id="humanReviewForm"><div class="review-form-grid">' +
      '<label><span>CALLER-ATTESTED HUMAN REVIEWER ROLE</span><input id="reviewRole" required placeholder="editor, researcher, owner..."></label>' +
      '<label><span>OPTIONAL REVIEWER NAME / ID</span><input id="reviewName" placeholder="Ricky or reviewer-17"></label>' +
      '<label><span>HUMAN-ENTERED ISO TIME + ZONE</span><input id="reviewAt" required ' +
      'placeholder="2026-07-23T21:30:00-04:00"></label>' +
      '<label class="wide"><span>HUMAN NOTES</span><textarea id="reviewNotes" required placeholder="What did you check, and what remains uncertain?"></textarea></label>' +
      '<label class="wide"><span>EXACT WORDING YOU PERSONALLY CHECKED // REQUIRED FOR WORDING CHECKED</span>' +
      '<textarea id="reviewWording" placeholder="Do not paste a certification label. Preserve the evidence boundary."></textarea></label>' +
      '<label class="wide review-attestation"><input id="reviewAttestation" type="checkbox" required>' +
      '<span>I ATTEST THIS DECISION WAS MADE BY A HUMAN REVIEWER. THIS LOCAL PROTOTYPE DOES NOT AUTHENTICATE IDENTITY.</span></label>' +
      '</div><div class="review-actions">' +
      (transitions.length ? transitions.map(function (status) {
        var positive = status === "wording-checked" || status === "ready-for-creator-review";
        return '<button type="button" data-review-decision="' + esc(status) +
          '" class="' + (positive ? "positive" : status === "reject-candidate" ? "reject" : "") +
          '" ' + (positive && !evidence.some(function (item) {
            return item.eligibleForProgression;
          }) ? "disabled" : "") + '>' + esc(status.replace(/-/g, " ").toUpperCase()) +
          '</button>';
      }).join("") : '<b>TERMINAL LOCAL STATUS // NO FURTHER TRANSITION</b>') +
      '</div><small>Routing only. This form cannot certify a creator, identify an undiarized speaker, or mutate canon.</small></form>' +
      (history.length ? '<div class="review-history"><span>PROOF-CHAINED LOCAL HISTORY</span>' +
        history.map(function (decision) {
          return '<article><b>' + esc(decision.before.status.toUpperCase() + " -> " +
            decision.after.status.toUpperCase()) + '</b><span>' + esc(decision.at) +
            ' // ' + esc(decision.reviewer.role.toUpperCase()) + '</span><small>' +
            esc(decision.proofFingerprint) + '</small></article>';
        }).join("") + '</div>' : "") + '</article>' :
      '<div class="review-dossier review-empty"><b>NO FINDINGS MATCH THIS FILTER.</b><span>Widen the origin, status, or search terms.</span></div>';

    return '<div class="canon-lane-head"><div><span>LOCAL REVIEW ROUTING // CALLER-ATTESTED, CORPUS-BOUND, ZERO SELF-CERTIFICATION</span>' +
      '<h3>' + metrics.candidates + ' FINDINGS. ' + metrics.decisions +
      ' CALLER-ATTESTED DECISIONS. 0 CANON MUTATIONS.</h3></div><p>Identity is not authenticated. Decisions stay local; incompatible ledgers are quarantined for export.</p></div>' +
      '<div class="review-session-metrics">' + [
        [metrics.unreviewed, "UNREVIEWED"],
        [metrics.needsContext, "NEEDS CONTEXT"],
        [metrics.wordingChecked, "WORDING CHECKED"],
        [metrics.readyForCreatorReview, "READY FOR CREATOR REVIEW"],
        [metrics.rejected, "REJECTED"],
      ].map(function (item) {
        return '<div><b>' + item[0] + '</b><span>' + item[1] + '</span></div>';
      }).join("") + '</div>' +
      '<div class="review-session-toolbar"><label><span>FINDING ORIGIN</span><select id="reviewOrigin">' +
      '<option value="">TRUST + CANON</option><option value="trust" ' +
      (state.reviewOrigin === "trust" ? "selected" : "") + '>TRUST DESK</option><option value="canon" ' +
      (state.reviewOrigin === "canon" ? "selected" : "") + '>CANON AUDIT</option></select></label>' +
      '<label><span>LOCAL STATUS</span><select id="reviewStatus"><option value="">ALL STATUSES</option>' +
      ["unreviewed", "needs-context", "wording-checked", "ready-for-creator-review", "reject-candidate"].map(function (status) {
        return '<option value="' + status + '" ' + (state.reviewStatus === status ? "selected" : "") +
          '>' + status.replace(/-/g, " ").toUpperCase() + '</option>';
      }).join("") + '</select></label><label><span>SEARCH FINDINGS</span><input id="reviewQuery" value="' +
      esc(state.reviewQuery) + '" placeholder="court, character, excerpt..."></label><div><button id="reviewCopySession">COPY SESSION</button>' +
      '<button id="reviewDownloadSession">DOWNLOAD JSON</button>' +
      (state.reviewQuarantinedLedger ? '<button id="reviewDownloadQuarantine">EXPORT HELD LEDGER</button>' : "") +
      '</div></div>' +
      '<p class="review-notice" id="reviewNotice" role="status" aria-live="polite"' +
      (state.reviewNotice || state.reviewRestoreNotice ? "" : ' hidden') + '>' +
      esc([state.reviewRestoreNotice, state.reviewNotice].filter(Boolean).join(" ")) + '</p>' +
      '<div class="review-session-grid"><aside><header><span>' + allMatches.length +
      ' MATCHES // SHOWING ' + queue.length + '</span><b>' +
      esc(humanReviewSession.corpus.reviewInputFingerprint) + '</b></header><div>' +
      queue.map(function (item) { return reviewCandidateButton(item, state, esc); }).join("") + '</div></aside><section>' + dossier +
      '</section></div>';
  }


  global.WWAMCanonDeskUI = Object.freeze({
    VERSION: VERSION,
    renderClaimAudit: renderClaimAudit,
    renderHumanReviewSession: renderHumanReviewSession,
  });
})(window);
