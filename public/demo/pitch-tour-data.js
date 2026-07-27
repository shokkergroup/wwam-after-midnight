(function (root) {
  "use strict";

  root.WWAM_PITCH_TOUR = Object.freeze([
    {
      number: "01",
      eyebrow: "THE ARCHIVE GAP",
      title: "THOUSANDS OF HOURS.<br>NO MEMORY LAYER.",
      body: "YouTube remembers titles—not the bits, receipts, and exact seconds worth reviving.",
      proof: "THE BACK CATALOG IS BURIED.",
      action: { kind: "night", label: "RUN TONIGHT'S SOURCE-GROUNDED SHIFT" },
    },
    {
      number: "02",
      eyebrow: "THE SOURCE SESSION",
      title: "510 SHOW WIKIS.<br>ASK ONE. PROVE IT.",
      body: "Every upload opens as its own honest, playable, interrogable micro-wiki. The source ID never changes underneath the answer.",
      proof: "510 SOURCE FILES // 194 FULL SHOW WIKIS // 16 TOPIC-NAVIGATION ONLY // 300 HONEST SOURCE BRIEFS // 3,310 SOURCE RECEIPTS.",
      action: {
        kind: "source",
        label: "ASK THE JULY 23 TAPE ABOUT LOOMIS",
        sourceId: "LV2rmwEA0w4",
        section: "ask",
        query: "Show me the Dr. Loomis moments in this tape.",
      },
    },
    {
      number: "03",
      eyebrow: "THE MAP",
      title: "472 STREAMS.<br>EVERY BLIND SPOT VISIBLE.",
      body: "The feed maps depth, evidence, and blind spots instead of pretending every title has been understood.",
      proof: "1,197 CACHED HOURS. GAPS VISIBLE.",
      action: { kind: "archive", label: "OPEN THE ARCHIVE ATLAS" },
    },
    {
      number: "04",
      eyebrow: "THE LORE SYSTEM",
      title: "THE CHANNEL<br>REMEMBERS ITSELF.",
      body: "Time Machines track takes; Ancestry tracks bits; every connection keeps its receipts and authority boundary.",
      proof: "CONNECTED MEMORY. NO SELF-CERTIFYING CANON.",
      action: {
        kind: "lore",
        label: "OPEN THE LOOMIS CONSTELLATION",
        entry: "character:loomis",
      },
    },
    {
      number: "05",
      eyebrow: "THE WORKFLOW",
      title: "ONE SHOW BECOMES<br>THE AFTERMATH PACK.",
      body: "The July 23 upload became a source-locked review desk: 21 receipts, 23 registered review candidates, four research threads, and nine separately counted cold-open boards.",
      proof: "SOURCE → CUT WINDOW → RISK → HUMAN ROUTE → EDITOR PACKET.",
      action: {
        kind: "aftermath",
        label: "OPEN JULY 23'S AFTERMATH PACK",
        sourceId: "LV2rmwEA0w4",
        section: "aftermath",
      },
    },
    {
      number: "06",
      eyebrow: "THE SHOWCASE",
      title: "THREE SHOWS.<br>ONE REVIEWABLE WORKFLOW.",
      body: "A bounded prototype traces three exact-source Aftermath Packs through local review ledgers and editor handoffs.",
      proof: "NO PERFORMANCE CLAIMS. VISIBLE INPUTS. HUMAN REVIEW REQUIRED.",
      action: {
        kind: "pilot",
        label: "OPEN THE THREE-SHOW WORKFLOW",
        goal: "compilation-workflow",
      },
    },
  ]);
})(typeof window !== "undefined" ? window : globalThis);
