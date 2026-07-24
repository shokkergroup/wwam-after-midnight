(function () {
  "use strict";

  var catalog = window.WWAM_CATALOG || [];
  var deep = window.WWAM_DEEP_DISTILL || { meta: {}, franchises: [], tapes: [], hot100: [] };
  var live = window.WWAM_LIVESTREAMS || { meta: {}, streams: [], topicIndex: [] };
  var popular = window.WWAM_POPULAR_LIVE || { meta: {}, streams: [], topicIndex: [] };
  var curated = window.WWAM_CURATED || { upInYa: [], askExamples: [] };
  var characterLore = window.WWAM_CHARACTER_LORE || { meta: {}, characters: [] };
  var channelDNA = window.WWAM_CHANNEL_DNA || {};
  var askEngine;
  var showcaseEngine;
  var showcaseReceiptById = {};
  var showcaseSourceById = {};
  var tapeById = {};
  var itemById = {};
  var streamById = {};
  var state = {
    redBand: localStorage.getItem("wwam-band") !== "bleep",
    hotCategory: "ALL EVIDENCE",
    hotLimit: 12,
    franchise: "ALL",
    vaultQuery: "",
    lab: "Halloween",
    soundSource: "commentary",
    liveTopic: "ALL TOPICS",
    popularQuery: "",
    popularTopic: "ALL TOPICS",
    character: "",
    memoryTab: "time",
    memoryEntity: "Halloween",
    askContext: null,
    descentMinutes: 20,
    descentMode: "CHAOS",
    tourSlide: 0,
    consoleIndex: 0,
  };

  deep.tapes.forEach(function (tape) { tapeById[tape.id] = tape; });
  catalog.forEach(function (item) { itemById[item.id] = item; });
  live.streams.forEach(function (stream) {
    stream._lane = "fresh";
    streamById[stream.id] = stream;
  });
  popular.streams.forEach(function (stream) {
    stream._lane = "popular";
    streamById[stream.id] = stream;
  });
  askEngine = window.WWAMSearchEngine.create(catalog, deep, live, curated, popular);
  showcaseEngine = window.WWAMShowcaseEngine && window.WWAMShowcaseEngine.create ?
    window.WWAMShowcaseEngine.create({
      catalog: catalog,
      deep: deep,
      live: live,
      popular: popular,
      characters: characterLore,
      dna: channelDNA,
    }) : null;
  if (showcaseEngine) {
    (showcaseEngine.receipts || []).forEach(function (receipt) { showcaseReceiptById[receipt.id] = receipt; });
    (showcaseEngine.sources || []).forEach(function (source) { showcaseSourceById[source.id] = source; });
  }

  var franchiseOrder = ["Halloween", "Friday the 13th", "Scream", "A Nightmare on Elm Street"];
  var colors = {
    "Halloween": "#ff4a24",
    "Friday the 13th": "#d8ff38",
    "Scream": "#ff397f",
    "A Nightmare on Elm Street": "#55e5ff",
  };
  var categoryCopy = {
    "OUT OF POCKET": "The sentence that gets the group chat subpoenaed.",
    "FRANCHISE FELONY": "Aggravated assault on a movie's reputation.",
    "LOVE LETTER": "Genuine affection, still holding a knife.",
    "THEORY BOARD": "Confidence enters. Future context waits outside.",
    "KILL ROOM": "The body-count vocabulary spikes.",
    "BIT ENERGY": "A callback signal escaped the grave.",
    "BREAKDOWN": "On-mic structural integrity approaches zero.",
    "HORROR BRAIN": "The horror-nerd cortex has the wheel.",
  };
  var tourSlides = [
    {
      number: "01",
      eyebrow: "THE PROBLEM",
      title: "THOUSANDS OF HOURS.<br>NO MEMORY LAYER.",
      body: "YouTube knows what a video is called. It does not know where a bit was born, when a take reversed, which commentary became a fan favorite, or what exact second deserves to live again.",
      proof: "THE BACK CATALOG IS VALUABLE—BUT MOST OF ITS VALUE IS BURIED.",
    },
    {
      number: "02",
      eyebrow: "THE RECEIPT",
      title: "1,880,873 WORDS.<br>74 SOURCES. PROVE IT.",
      body: "The expanded demo audits every available caption across 39 franchise commentaries, the rolling Fresh 10, and 25 new foundational livestreams—then turns 872 bounded evidence receipts into paths back to the exact source second.",
      proof: "71 CAPTIONED SOURCES. THREE HONESTLY DISCLOSED GAPS. ZERO COUNTERFEIT ANALYSIS.",
    },
    {
      number: "03",
      eyebrow: "THE MOAT",
      title: "THE CHANNEL<br>REMEMBERS ITSELF.",
      body: "Take Time Machines reveal changing opinions. Bit Ancestry tracks recurring characters. Ask the Character pairs a clearly labeled fan-made riff with a bounded real performance clip. WWAM Court puts contradictory receipts on trial.",
      proof: "168 MEMORY NODES. 603 SOURCE-BACKED EDGES. FOUR VERIFIED CHARACTER LINEAGES.",
    },
    {
      number: "04",
      eyebrow: "THE MONEY",
      title: "MEMORY CREATES<br>NEW INVENTORY.",
      body: "Premium franchise vaults. Member-only extended receipts. Sponsored lore labs. Annual supercuts. Merch tied to recurring bits. Share cards that drive old-video traffic. The archive creates surfaces without interrupting the show.",
      proof: "DISCOVERY → RETENTION → MEMBERSHIP → MERCH → MORE BACK-CATALOG VIEWS.",
    },
    {
      number: "05",
      eyebrow: "THE ASK",
      title: "THIS IS THE DEMO.<br>THE SYSTEM IS THE PRODUCT.",
      body: "The creator-facing Control Room shows what the latest stream changed, what an editor should verify, which older uploads just became relevant, and which moments can become tomorrow's compilation, Short, membership perk, or merch callback.",
      proof: "THE CHANNEL'S HISTORY STOPS BEING STORAGE AND STARTS COMPOUNDING.",
    },
  ];

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function fmt(value) {
    return Number(value || 0).toLocaleString("en-US");
  }

  function duration(seconds) {
    if (!seconds) return "TAPE SEALED";
    var total = Math.round(seconds);
    var hours = Math.floor(total / 3600);
    var minutes = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    var secs = String(total % 60).padStart(2, "0");
    return hours + ":" + minutes + ":" + secs;
  }

  function timestamp(seconds) {
    var total = Math.max(0, Math.round(seconds || 0));
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var secs = String(total % 60).padStart(2, "0");
    return (hours ? hours + ":" + String(minutes).padStart(2, "0") : minutes) + ":" + secs;
  }

  function shortDate(value) {
    if (!value) return "DATE BURIED";
    return new Date(value + "T12:00:00").toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    }).toUpperCase();
  }

  function franchiseSlug(name) {
    var found = deep.franchises.filter(function (item) { return item.name === name; })[0];
    return found ? found.slug : "unknown";
  }

  function displayQuote(value) {
    if (state.redBand) return value;
    return value.replace(/\b(fuck\w*|shit\w*|bitch\w*|asshole\w*|dick\w*|motherfucker\w*|goddamn\w*)\b/gi, "••••");
  }

  function renderProof() {
    var meta = deep.meta;
    var liveMeta = live.meta || {};
    var popularMeta = popular.meta || {};
    var sourceCount = meta.tapes + (liveMeta.streams || 0) + (popularMeta.streams || 0);
    var words = meta.wordsAudited + (liveMeta.wordsAudited || 0) + (popularMeta.wordsAudited || 0);
    var hours = meta.captionHours + (liveMeta.hours || 0) + (popularMeta.hours || 0);
    var moments = meta.hotMoments + (liveMeta.moments || 0) + (popularMeta.moments || 0);
    document.getElementById("proof").innerHTML = [
      ["SOURCES", showcaseMetric("sources", sourceCount), "COMMENTARIES + FRESH 10 + POPULAR 25"],
      ["WORDS AUDITED", fmt(showcaseMetric("wordsAudited", words)), "AVAILABLE CAPTIONS"],
      ["HOURS", hours, "UNDER THE KNIFE"],
      ["RECEIPTS", showcaseMetric("receipts", moments), "PLAYABLE EVIDENCE"],
      ["MEMORY NODES", showcaseMetric("nodes", (liveMeta.topics || 0) + (popularMeta.topics || 0)), "CONNECTED, NOT JUST TAGGED"],
    ].map(function (stat) {
      return '<article><span>' + stat[0] + '</span><b>' + stat[1] + '</b><small>' + stat[2] + '</small></article>';
    }).join("");
  }

  function showcaseMetric(name, fallback) {
    if (!showcaseEngine) return fallback || 0;
    var aliases = {
      nodes: "graphNodes",
      edges: "graphEdges",
      timelines: "timeMachines",
      bits: "bitLineages",
    };
    var key = aliases[name] || name;
    if (showcaseEngine.metrics && showcaseEngine.metrics[key] != null) return showcaseEngine.metrics[key];
    if (showcaseEngine.getMetrics) {
      var metrics = showcaseEngine.getMetrics();
      if (metrics && metrics[key] != null) return metrics[key];
    }
    return fallback || 0;
  }

  function enrichEvidence(item) {
    item = item || {};
    var receipt = showcaseReceiptById[item.receiptId] || {};
    var sourceId = item.sourceId || receipt.sourceId || item.id;
    var source = showcaseSourceById[sourceId] || streamById[sourceId] || itemById[sourceId] || {};
    return Object.assign({}, receipt, item, {
      sourceId: sourceId,
      id: sourceId,
      source: item.source || receipt.sourceType || (itemById[sourceId] ? "commentary" : "livestream"),
      at: Number(item.at != null ? item.at : item.t != null ? item.t : receipt.t || 0),
      t: Number(item.t != null ? item.t : item.at != null ? item.at : receipt.t || 0),
      title: item.title || receipt.sourceTitle || source.title || source.film || "WWAM SOURCE",
      date: item.date || receipt.date || source.date,
      category: item.category || receipt.category || item.sentiment || "SOURCE RECEIPT",
      excerpt: item.excerpt || item.quote || receipt.excerpt || "",
    });
  }

  function renderMarquee() {
    var items = deep.franchises.map(function (franchise) {
      return '<button data-franchise="' + esc(franchise.name) + '"><b>' + esc(franchise.killer) + '</b><span>' +
        franchise.tapes + ' TAPES // ' + fmt(franchise.wordsAudited) + ' WORDS // ' + franchise.avgUnhinged +
        ' UNHINGED</span></button>';
    });
    document.getElementById("franchiseMarquee").innerHTML = items.concat(items).join("");
    Array.prototype.forEach.call(document.querySelectorAll("#franchiseMarquee button"), function (button) {
      button.onclick = function () {
        setFranchise(button.getAttribute("data-franchise"));
        document.getElementById("autopsies").scrollIntoView({ behavior: "smooth" });
      };
    });
  }

  function renderHeroConsole() {
    var moments = deep.hot100.filter(function (moment) { return moment.rank <= 16; });
    if (!moments.length) return;
    var moment = moments[state.consoleIndex % moments.length];
    var item = itemById[moment.tapeId];
    document.getElementById("heroConsole").innerHTML =
      '<div class="console-rank">#' + String(moment.rank).padStart(3, "0") + '</div>' +
      '<p>“' + esc(displayQuote(moment.quote)) + '”</p>' +
      '<div><span>' + esc(moment.category) + '</span><b>' + esc(item.film) + ' @ ' + timestamp(moment.t) + '</b></div>' +
      '<button data-play="' + item.id + '" data-time="' + moment.t + '">PLAY THE RECEIPT →</button>';
    document.getElementById("consoleClock").textContent = timestamp(moment.t);
    var button = document.querySelector("#heroConsole [data-play]");
    if (button) button.onclick = function () { openDossier(button.getAttribute("data-play"), Number(button.getAttribute("data-time"))); };
  }

  function categories() {
    var found = [];
    deep.hot100.forEach(function (moment) {
      if (found.indexOf(moment.category) < 0) found.push(moment.category);
    });
    return ["ALL EVIDENCE"].concat(found);
  }

  function renderCategoryFilters() {
    document.getElementById("categoryFilters").innerHTML = categories().map(function (category) {
      return '<button class="' + (state.hotCategory === category ? "on" : "") + '" data-category="' +
        esc(category) + '">' + esc(category) + '</button>';
    }).join("");
    Array.prototype.forEach.call(document.querySelectorAll("#categoryFilters button"), function (button) {
      button.onclick = function () {
        state.hotCategory = button.getAttribute("data-category");
        state.hotLimit = 12;
        renderCategoryFilters();
        renderHot100();
      };
    });
  }

  function renderHot100() {
    var filtered = deep.hot100.filter(function (moment) {
      return state.hotCategory === "ALL EVIDENCE" || moment.category === state.hotCategory;
    });
    var visible = filtered.slice(0, state.hotLimit);
    document.getElementById("hotGrid").innerHTML = visible.map(function (moment, index) {
      var item = itemById[moment.tapeId];
      return '<article class="evidence-card ' + (index < 2 ? "featured" : "") + '" style="--accent:' +
        colors[item.franchise] + '">' +
        '<div class="evidence-top"><b>#' + String(moment.rank).padStart(3, "0") + '</b><span>' +
        esc(moment.category) + '</span><i>' + timestamp(moment.t) + '</i></div>' +
        '<blockquote>“' + esc(displayQuote(moment.quote)) + '”</blockquote>' +
        '<p>' + esc(categoryCopy[moment.category] || "A source-linked evidence fragment.") + '</p>' +
        '<footer><div><span>' + esc(item.franchise) + '</span><b>' + esc(item.film) + '</b></div>' +
        '<button data-play="' + item.id + '" data-time="' + moment.t + '">▶ PLAY RECEIPT</button></footer>' +
        '</article>';
    }).join("");
    document.getElementById("loadMore").hidden = visible.length >= filtered.length;
    bindPlayButtons(document.getElementById("hotGrid"));
  }

  function resolveSoundbyte(entry) {
    if (entry.source === "commentary") {
      var tape = tapeById[entry.id];
      var item = itemById[entry.id];
      var moment = tape && tape.moments.filter(function (candidate) { return candidate.t === entry.t; })[0];
      if (!item || !moment) return null;
      return {
        source: "commentary",
        id: entry.id,
        t: entry.t,
        label: entry.label,
        quote: moment.quote,
        category: moment.category,
        title: item.film,
        subtitle: item.franchise,
        thumbnail: item.thumbnail,
      };
    }
    var stream = streamById[entry.id];
    var liveMoment = stream && stream.moments.filter(function (candidate) { return candidate.t === entry.t; })[0];
    if (!stream || !liveMoment) return null;
    return {
      source: "livestream",
      id: entry.id,
      t: entry.t,
      label: entry.label,
      quote: liveMoment.quote,
      category: liveMoment.category,
      title: stream.title,
      subtitle: "FRESH FROM LIVE // " + shortDate(stream.date),
      thumbnail: stream.thumbnail,
    };
  }

  function soundbytes() {
    return curated.upInYa.map(resolveSoundbyte).filter(Boolean).filter(function (item) {
      return state.soundSource === "all" || item.source === state.soundSource;
    });
  }

  function renderSoundbytes() {
    var list = soundbytes();
    document.getElementById("soundbyteGrid").innerHTML = list.map(function (item, index) {
      return '<button class="soundbyte" data-sound-index="' + index + '">' +
        '<span><i></i>' + String(index + 1).padStart(2, "0") + ' // ' + esc(item.category) + '</span>' +
        '<b>' + esc(item.label) + '</b><p>“' + esc(displayQuote(item.quote)) + '”</p>' +
        '<em>' + esc(item.title) + ' @ ' + timestamp(item.t) + '</em></button>';
    }).join("");
    Array.prototype.forEach.call(document.querySelectorAll("#soundbyteGrid [data-sound-index]"), function (button) {
      button.onclick = function () {
        var item = list[Number(button.getAttribute("data-sound-index"))];
        if (item) cueSoundbyte(item);
      };
    });
  }

  function renderSoundFilters() {
    Array.prototype.forEach.call(document.querySelectorAll("#soundFilters [data-sound-source]"), function (button) {
      button.classList.toggle("on", button.getAttribute("data-sound-source") === state.soundSource);
    });
  }

  function cueSoundbyte(item) {
    document.getElementById("soundPlayer").innerHTML =
      '<div class="sound-video"><iframe src="https://www.youtube.com/embed/' + encodeURIComponent(item.id) +
      '?autoplay=1&rel=0&start=' + Math.max(0, Math.round(item.t)) +
      '" title="WWAM source soundbyte" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>' +
      '<div class="sound-now"><span>NOW VIOLATING THE SILENCE // ' + esc(item.category) + '</span><h3>' +
      esc(item.label) + '</h3><blockquote>“' + esc(displayQuote(item.quote)) + '”</blockquote><p>' +
      esc(item.title) + ' // ' + timestamp(item.t) + '</p><button data-open-sound="' + item.source +
      '" data-id="' + item.id + '" data-time="' + item.t + '">OPEN THE FULL RECEIPT →</button></div>';
    var button = document.querySelector("#soundPlayer [data-open-sound]");
    if (button) {
      button.onclick = function () {
        if (button.getAttribute("data-open-sound") === "livestream") {
          openLiveDossier(button.getAttribute("data-id"), Number(button.getAttribute("data-time")));
        } else {
          openDossier(button.getAttribute("data-id"), Number(button.getAttribute("data-time")));
        }
      };
    }
  }

  function characterProfiles() {
    var profiles = characterLore.characters || characterLore.profiles || [];
    return profiles.map(function (profile, index) {
      var id = profile.id || String(profile.name || "character-" + index).toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return Object.assign({
        id: id,
        name: profile.name || "UNKNOWN WITNESS",
        performer: profile.performer || profile.performedBy || "WWAM recurring performance",
        description: profile.description || profile.summary || profile.profile || "A recurring WWAM character bit reconstructed from source performances.",
        behaviors: profile.behaviors || profile.patterns || profile.behaviorPatterns || [],
        triggers: profile.triggers || profile.triggerSignals || [],
        soundbytes: profile.soundbytes || profile.receipts || profile.evidence || [],
        responseTemplates: profile.responseTemplates || profile.templates ||
          (profile.responseKit && profile.responseKit.templates) || [],
      }, profile, { id: id });
    });
  }

  function characterFallback(profile, topic) {
    var id = String(profile.id || "").toLowerCase();
    if (id.indexOf("loomis") >= 0) {
      return "I've spent years trying to warn you about " + topic + ". You want an explanation. I am telling you there is no explanation. There is only evil—and apparently nobody thought to lock the door.";
    }
    if (id.indexOf("challis") >= 0) {
      return "Wait a minute. " + topic + "? Turn off the television, get away from the mask, and somebody please tell me why no one is listening until eight seconds before disaster.";
    }
    if (id.indexOf("slender") >= 0) {
      return "You asked about " + topic + ". The trees have already answered. Please stop looking behind you. It is making this unnecessarily awkward.";
    }
    if (id.indexOf("feldman") >= 0) {
      return topic + " needs commitment, choreography, and the absolute confidence to keep performing after everyone else has realized this became a completely different scene.";
    }
    return "The recurring bit has reviewed " + topic + " and reached a conclusion no responsible witness is prepared to place on the record.";
  }

  function fillCharacterTemplate(template, topic, profile) {
    var replacements = {
      "SUBJECT": topic,
      "QUESTION": topic,
      "PROBLEM": topic,
      "FRANCHISE": topic,
      "ROLE": topic,
      "CHARACTER": topic,
      "CREATURE": topic,
      "ALARMING TRAIT": "the exact kind of confidence that gets people hurt in Haddonfield",
      "RESOURCE": "a state vehicle and a properly funded hospital",
      "ABSURD DIAGNOSIS": "acute Halloween exposure",
      "PRACTICAL OBJECT": "a flashlight",
      "BENIGN ACTION": "drink some water and sit down",
      "FICTIONAL DRINK": "Silver Shamrock boilermaker",
      "BODY PART": profile.id === "slenderman" ? "your nostrils" : "liver",
      "SANDWICH TYPE": "bologna",
      "SONG TYPE": "soft rock",
      "INVENTED RIVAL GROUP": "entirely fictional Wolf Pack",
    };
    var output = String(template)
      .replace(/\{topic\}/gi, topic)
      .replace(/\{question\}/gi, topic)
      .replace(/\{character\}/gi, profile.name)
      .replace(/\{performer\}/gi, profile.performer);
    return output.replace(/\[([A-Z ]+)\]/g, function (match, key) {
      return replacements[key] || topic;
    });
  }

  function generateCharacterRiff(profile, question) {
    var topic = question.trim().replace(/[?!.]+$/g, "") || "whatever is happening here";
    var templates = profile.responseTemplates || [];
    if (templates.length) {
      var hash = topic.split("").reduce(function (total, char) { return total + char.charCodeAt(0); }, 0);
      var template = templates[hash % templates.length];
      if (typeof template === "object") template = template.text || template.template || "";
      if (template) return fillCharacterTemplate(template, topic, profile);
    }
    return characterFallback(profile, topic);
  }

  function normalizeCharacterReceipt(receipt) {
    var playback = receipt.playback || {};
    return {
      source: receipt.source || receipt.sourceType || (itemById[receipt.id || receipt.sourceId] ? "commentary" : "livestream"),
      id: receipt.sourceId || receipt.videoId || receipt.id,
      t: Number(playback.start != null ? playback.start :
        receipt.t != null ? receipt.t : receipt.time || receipt.timestamp || 0),
      end: Number(playback.end != null ? playback.end : 0),
      clipSeconds: Number(playback.clipSeconds != null ? playback.clipSeconds : 0),
      quote: receipt.quote || receipt.excerpt || receipt.text || "Open the source performance.",
      label: receipt.label || receipt.title || receipt.note || receipt.context || "SOURCE PERFORMANCE",
      confidence: receipt.confidence != null ? Math.round(Number(receipt.confidence) * 100) + "% VERIFIED" :
        receipt.attributionConfidence || "SOURCE-LINKED",
    };
  }

  function renderCharacterRoster() {
    var profiles = characterProfiles();
    var locked = characterLore.lockedCandidates || [];
    if (!profiles.length) {
      document.getElementById("characterRoster").innerHTML = '<p class="character-empty">CHARACTER ARCHAEOLOGY IS STILL PROCESSING.</p>';
      return;
    }
    if (!state.character || !profiles.some(function (profile) { return profile.id === state.character; })) {
      state.character = profiles[0].id;
    }
    document.getElementById("characterRoster").innerHTML = profiles.map(function (profile, index) {
      return '<button class="' + (profile.id === state.character ? "on" : "") + '" data-character="' + esc(profile.id) +
        '"><span>WITNESS 0' + (index + 1) + '</span><b>' + esc(profile.name) + '</b><i>' +
        esc(profile.performer) + '</i></button>';
    }).join("") + locked.map(function (candidate) {
      return '<button class="locked" disabled aria-disabled="true" title="' + esc(candidate.whyLocked || "Human verification required") +
        '"><span>WITNESS LOCKED</span><b>' + esc(candidate.name || "UNVERIFIED CHARACTER") +
        '</b><i>PERFORMER IDENTITY NEEDS HUMAN REVIEW</i></button>';
    }).join("");
    Array.prototype.forEach.call(document.querySelectorAll("#characterRoster [data-character]"), function (button) {
      button.onclick = function () {
        state.character = button.getAttribute("data-character");
        renderCharacterRoster();
        renderCharacter();
      };
    });
  }

  function renderCharacter() {
    var profile = characterProfiles().filter(function (candidate) { return candidate.id === state.character; })[0];
    if (!profile) return;
    var behaviors = (profile.behaviors || []).slice(0, 5);
    var triggers = (profile.triggers || []).slice(0, 4);
    var receipts = (profile.soundbytes || []).map(normalizeCharacterReceipt).filter(function (receipt) { return receipt.id; }).slice(0, 6);
    document.getElementById("characterLine").textContent = profile.name + " // " + profile.performer;
    document.getElementById("characterPortrait").innerHTML =
      '<div><span>RECURRING BIT PROFILE</span><b>' + esc(profile.name) + '</b><i>' + esc(profile.performer) +
      '</i></div><p>' + esc(profile.description) + '</p><ul>' +
      behaviors.map(function (behavior) { return '<li>' + esc(typeof behavior === "string" ? behavior : behavior.label || behavior.pattern || "") + '</li>'; }).join("") +
      '</ul><footer><span>COMMON TRIGGERS</span><b>' +
      (triggers.length ? triggers.map(function (trigger) { return esc(typeof trigger === "string" ? trigger : trigger.label || trigger.topic || ""); }).join(" // ") : "ARCHIVE-DERIVED PROMPTS") +
      '</b></footer>';
    document.getElementById("characterReceiptLabel").textContent = receipts.length + " VERIFIED PERFORMANCE" + (receipts.length === 1 ? "" : "S");
    document.getElementById("characterReceipts").innerHTML = receipts.length ? receipts.map(function (receipt, index) {
      return '<article><div><span>VOICEPRINT 0' + (index + 1) + '</span><b>' + timestamp(receipt.t) +
        '</b></div><h3>' + esc(receipt.label) + '</h3><p>“' + esc(displayQuote(receipt.quote)) +
        '”</p><footer><span>' + esc(String(receipt.confidence).toUpperCase()) +
        '</span><button data-character-source="' + esc(receipt.source) + '" data-id="' + esc(receipt.id) +
        '" data-time="' + receipt.t + '" data-end="' + receipt.end + '" data-label="' + esc(receipt.label) + '">HEAR ' +
        (receipt.clipSeconds ? receipt.clipSeconds + ' SEC' : 'THE') + ' REAL BIT →</button></footer></article>';
    }).join("") : '<p class="character-empty">No defensible public soundbyte has cleared attribution yet. The profile remains visible; the archive does not counterfeit proof.</p>';
    bindCharacterReceipts();
  }

  function bindCharacterReceipts() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-character-source]"), function (button) {
      button.onclick = function () {
        var id = button.getAttribute("data-id");
        var at = Number(button.getAttribute("data-time") || 0);
        var end = Number(button.getAttribute("data-end") || 0);
        openLooseSource(id, at, button.getAttribute("data-label") || "WWAM CHARACTER PERFORMANCE", end);
      };
    });
  }

  function askCharacter(question) {
    var profile = characterProfiles().filter(function (candidate) { return candidate.id === state.character; })[0];
    if (!profile) return;
    var behaviors = (profile.behaviors || []).slice(0, 3).map(function (behavior) {
      return typeof behavior === "string" ? behavior : behavior.label || behavior.pattern || "";
    }).filter(Boolean);
    var riff = generateCharacterRiff(profile, question);
    document.getElementById("characterAnswer").innerHTML =
      '<div><span>FAN-MADE GENERATED RIFF</span><b>NOT AN ARCHIVAL QUOTE // NOT THE HOST SPEAKING</b></div>' +
      '<blockquote>“' + esc(displayQuote(riff)) + '”</blockquote><footer><span>BEHAVIORAL INGREDIENTS</span><b>' +
      esc(behaviors.length ? behaviors.join(" + ").toUpperCase() : "RECURRING CHARACTER PATTERN") +
      '</b></footer>';
  }

  function renderLiveProof() {
    var meta = live.meta || {};
    document.getElementById("liveProof").innerHTML = [
      [meta.streams, "NEWEST STREAMS"],
      [meta.captioned, "FULL LIVE MAPS"],
      [fmt(meta.wordsAudited), "WORDS AUDITED"],
      [meta.hours, "HOURS ON AIR"],
      [meta.moments, "COMEDY SPIKES"],
      [meta.topics, "TRACKED TOPICS"],
    ].map(function (stat) {
      return '<div><b>' + stat[0] + '</b><span>' + stat[1] + '</span></div>';
    }).join("");
  }

  function renderTopicRadar() {
    var topics = [{ name: "ALL TOPICS", mentions: 0, streams: live.streams }].concat(live.topicIndex.slice(0, 12));
    document.getElementById("topicRadar").innerHTML = topics.map(function (topic) {
      return '<button class="' + (state.liveTopic === topic.name ? "on" : "") + '" data-live-topic="' +
        esc(topic.name) + '"><b>' + esc(topic.name) + '</b><span>' +
        (topic.name === "ALL TOPICS" ? live.streams.length + " SHOWS" : topic.mentions + " MENTIONS // " + topic.streams.length + " SHOWS") +
        '</span></button>';
    }).join("");
    document.getElementById("topicRadarLabel").textContent = state.liveTopic === "ALL TOPICS" ?
      "EVERYTHING THEY WON'T STOP TALKING ABOUT" : state.liveTopic + " // SOURCE-DENSE STREAMS FIRST";
    Array.prototype.forEach.call(document.querySelectorAll("#topicRadar [data-live-topic]"), function (button) {
      button.onclick = function () {
        state.liveTopic = button.getAttribute("data-live-topic");
        renderTopicRadar();
        renderStreams();
      };
    });
  }

  function miniHeat(stream) {
    if (!stream.heatmap.length) return '<div class="mini-heat sealed"><span>NO CAPTION TRACK // MAP UNAVAILABLE</span></div>';
    return '<div class="mini-heat">' + stream.heatmap.map(function (bin) {
      return '<i style="--heat:' + bin.heat + '" title="' + esc(bin.signal + (bin.topic ? " // " + bin.topic : "")) + '"></i>';
    }).join("") + '</div>';
  }

  function streamCard(stream, index) {
    var topics = stream.topics.slice(0, 4);
    var peak = (stream.moments || []).slice().sort(function (a, b) { return (b.heat || b.score || 0) - (a.heat || a.score || 0); })[0];
    return '<article class="stream-card ' + (!stream.captioned ? "unmapped" : "") + '" data-live-id="' + stream.id + '">' +
      '<div class="stream-thumb"><img loading="lazy" src="' + esc(stream.thumbnail) + '" alt=""><span>LIVE 0' +
      (index + 1) + ' // ' + shortDate(stream.date) + '</span><b>' + duration(stream.duration) + '</b></div>' +
      '<div class="stream-body"><div><i class="' + (stream.captioned ? "" : "sealed") + '">' +
      (stream.captioned ? "FULL LIVE MAP" : "MAPPING UNAVAILABLE") + '</i><span>' + fmt(stream.wordsAudited) + ' WORDS</span></div>' +
      '<h3>' + esc(stream.title) + '</h3><p>' + esc(stream.summary) + '</p>' +
      '<div class="stream-topics">' + (topics.length ? topics.map(function (topic) {
        return '<button data-stream-topic="' + esc(topic.name) + '" data-live-id="' + stream.id + '" data-time="' +
          topic.peak + '">' + esc(topic.name) + ' <b>' + timestamp(topic.peak) + '</b></button>';
      }).join("") : '<span>THE SOURCE IS LIVE. THE CAPTION MAP IS NOT.</span>') + '</div>' +
      miniHeat(stream) + '<footer><span>' + (peak ? 'PEAK COMEDY // ' + timestamp(peak.t) + ' // ' + esc(peak.category) : 'ORIGINAL STREAM AVAILABLE') +
      '</span><button>OPEN LIVE MAP →</button></footer></div></article>';
  }

  function renderStreams() {
    var list = live.streams.slice();
    if (state.liveTopic !== "ALL TOPICS") {
      list = list.filter(function (stream) {
        return stream.topics.some(function (topic) { return topic.name === state.liveTopic; });
      }).sort(function (a, b) {
        var aTopic = a.topics.filter(function (topic) { return topic.name === state.liveTopic; })[0];
        var bTopic = b.topics.filter(function (topic) { return topic.name === state.liveTopic; })[0];
        return (bTopic ? bTopic.mentions : 0) - (aTopic ? aTopic.mentions : 0);
      });
    }
    document.getElementById("streamGrid").innerHTML = list.map(streamCard).join("");
    Array.prototype.forEach.call(document.querySelectorAll(".stream-card"), function (card) {
      card.onclick = function () { openLiveDossier(card.getAttribute("data-live-id")); };
    });
    Array.prototype.forEach.call(document.querySelectorAll(".stream-card [data-stream-topic]"), function (button) {
      button.onclick = function (event) {
        event.stopPropagation();
        openLiveDossier(button.getAttribute("data-live-id"), Number(button.getAttribute("data-time")));
      };
    });
  }

  function popularTopicNames() {
    var names = [];
    (popular.topicIndex || []).forEach(function (topic) {
      if (names.indexOf(topic.name) < 0) names.push(topic.name);
    });
    if (!names.length) {
      (popular.streams || []).forEach(function (stream) {
        (stream.topics || []).forEach(function (topic) {
          if (names.indexOf(topic.name) < 0) names.push(topic.name);
        });
      });
    }
    return names.slice(0, 14);
  }

  function renderPopularProof() {
    var meta = popular.meta || {};
    document.getElementById("popularProof").innerHTML = [
      [meta.streams || popular.streams.length, "FOUNDATIONAL STREAMS"],
      [fmt(meta.viewsAtSnapshot || meta.views || popular.streams.reduce(function (total, stream) { return total + Number(stream.views || 0); }, 0)), "COMBINED VIEWS"],
      [meta.captioned || popular.streams.filter(function (stream) { return stream.captioned; }).length, "FULL LIVE MAPS"],
      [fmt(meta.wordsAudited || 0), "WORDS AUDITED"],
      [meta.hours || 0, "HOURS ON AIR"],
      [meta.moments || 0, "COMEDY RECEIPTS"],
    ].map(function (stat) {
      return '<div><b>' + stat[0] + '</b><span>' + stat[1] + '</span></div>';
    }).join("");
  }

  function renderPopularTopics() {
    var names = ["ALL TOPICS"].concat(popularTopicNames());
    document.getElementById("popularTopics").innerHTML = names.map(function (name) {
      return '<button class="' + (state.popularTopic === name ? "on" : "") + '" data-popular-topic="' +
        esc(name) + '">' + esc(name) + '</button>';
    }).join("");
    Array.prototype.forEach.call(document.querySelectorAll("[data-popular-topic]"), function (button) {
      button.onclick = function () {
        state.popularTopic = button.getAttribute("data-popular-topic");
        renderPopularTopics();
        renderPopular();
      };
    });
  }

  function filteredPopular() {
    var query = state.popularQuery.toLowerCase();
    return (popular.streams || []).filter(function (stream) {
      var topics = (stream.topics || []).map(function (topic) { return topic.name; });
      var characters = (stream.characters || stream.characterSightings || []).map(function (character) {
        return character.name || character.character || character;
      });
      var blob = [stream.title, stream.summary, stream.whyItMatters,
        stream.editorial && stream.editorial.whyItMatters, topics.join(" "), characters.join(" ")].join(" ").toLowerCase();
      var matchesQuery = !query || blob.indexOf(query) >= 0;
      var matchesTopic = state.popularTopic === "ALL TOPICS" || topics.indexOf(state.popularTopic) >= 0;
      return matchesQuery && matchesTopic;
    });
  }

  function popularCard(stream) {
    var topics = (stream.topics || []).slice(0, 5);
    var sightings = (stream.characters || stream.characterSightings || []).slice(0, 3);
    var peak = (stream.moments || []).slice().sort(function (a, b) {
      return (b.heat || b.score || 0) - (a.heat || a.score || 0);
    })[0];
    var rank = stream.rank || stream.viewRank || popular.streams.indexOf(stream) + 1;
    return '<article class="popular-card ' + (!stream.captioned ? "unmapped" : "") + '" data-popular-id="' +
      esc(stream.id) + '"><div class="popular-rank"><b>#' + String(rank).padStart(2, "0") +
      '</b><span>' + fmt(stream.views) + ' OFFICIAL VIEWS</span></div><div class="popular-image"><img loading="lazy" src="' +
      esc(stream.thumbnail) + '" alt=""><span>' + shortDate(stream.date) + ' // ' + duration(stream.duration) +
      '</span></div><div class="popular-body"><div><i>' + (stream.captioned ? "FOUNDATIONAL LIVE MAP" : "SOURCE VISIBLE // MAP SEALED") +
      '</i><b>' + fmt(stream.wordsAudited) + ' WORDS</b></div><h3>' + esc(stream.title) +
      '</h3><p class="popular-why"><span>WHY IT MATTERS' +
      (stream.editorial && stream.editorial.showShape ? ' // ' + esc(stream.editorial.showShape) : '') + '</span>' +
      esc(stream.whyItMatters || stream.why_it_matters || (stream.editorial && stream.editorial.whyItMatters) ||
        stream.summary || "A high-gravity WWAM livestream in the foundational live canon.") +
      '</p><div class="popular-topic-row">' + topics.map(function (topic) {
        return '<button data-popular-jump="' + esc(stream.id) + '" data-time="' + Number(topic.peak || topic.t || 0) +
          '">' + esc(topic.name) + ' <b>' + timestamp(topic.peak || topic.t || 0) + '</b></button>';
      }).join("") + '</div>' + (sightings.length ? '<div class="character-sightings"><span>CHARACTER SIGHTINGS</span><b>' +
        sightings.map(function (sighting) { return esc(sighting.name || sighting.character || sighting); }).join(" // ") +
        '</b></div>' : '') + miniHeat(stream) + '<footer><span>' +
      (peak ? 'PEAK COMEDY // ' + timestamp(peak.t) + ' // ' + esc(peak.category) : 'ORIGINAL SOURCE READY') +
      '</span><button>OPEN FOUNDATIONAL AUTOPSY →</button></footer></div></article>';
  }

  function renderPopular() {
    var list = filteredPopular();
    document.getElementById("popularStatus").textContent = list.length + " OF " + popular.streams.length +
      " FOUNDATIONAL STREAMS // RANKED BY OFFICIAL VIEW COUNT";
    document.getElementById("popularGrid").innerHTML = list.length ? list.map(popularCard).join("") :
      '<p class="popular-empty">NO FOUNDATIONAL STREAM MATCHES THAT SEARCH.</p>';
    Array.prototype.forEach.call(document.querySelectorAll("[data-popular-id]"), function (card) {
      card.onclick = function () { openLiveDossier(card.getAttribute("data-popular-id")); };
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-popular-jump]"), function (button) {
      button.onclick = function (event) {
        event.stopPropagation();
        openLiveDossier(button.getAttribute("data-popular-jump"), Number(button.getAttribute("data-time") || 0));
      };
    });
  }

  function renderFranchises() {
    document.getElementById("franchiseGrid").innerHTML = deep.franchises.map(function (franchise, index) {
      var items = catalog.filter(function (item) { return item.franchise === franchise.name; });
      var tapes = items.map(function (item) { return tapeById[item.id]; }).filter(Boolean);
      var peak = tapes.slice().sort(function (a, b) { return b.unhinged - a.unhinged; })[0];
      var peakItem = peak ? itemById[peak.id] : items[0];
      var image = peakItem ? peakItem.thumbnail : "";
      return '<article class="franchise-card" style="--accent:' + colors[franchise.name] + '">' +
        '<div class="franchise-image"><img loading="lazy" src="' + esc(image) + '" alt=""><span>CASE FILE 0' + (index + 1) + '</span></div>' +
        '<div class="franchise-body"><p>' + esc(franchise.killer) + ' PATH // ' + franchise.tapes + ' TAPES</p>' +
        '<h3>' + esc(franchise.name) + '</h3><blockquote>“' + esc(franchise.prompt) + '”</blockquote>' +
        '<div class="franchise-stats"><span><b>' + fmt(franchise.wordsAudited) + '</b>WORDS</span><span><b>' +
        franchise.avgUnhinged + '</b>AVG. UNHINGED</span></div>' +
        '<button data-franchise="' + esc(franchise.name) + '">OPEN ' + esc(franchise.lab) + ' →</button></div></article>';
    }).join("");
    Array.prototype.forEach.call(document.querySelectorAll("#franchiseGrid [data-franchise]"), function (button) {
      button.onclick = function () {
        state.lab = button.getAttribute("data-franchise");
        renderLabs();
        document.getElementById("labs").scrollIntoView({ behavior: "smooth" });
      };
    });
  }

  function renderFranchiseFilters() {
    var names = ["ALL"].concat(franchiseOrder);
    document.getElementById("franchiseFilters").innerHTML = names.map(function (name) {
      return '<button class="' + (state.franchise === name ? "on" : "") + '" data-franchise="' + esc(name) + '">' +
        (name === "A Nightmare on Elm Street" ? "ELM STREET" : esc(name).toUpperCase()) + '</button>';
    }).join("");
    Array.prototype.forEach.call(document.querySelectorAll("#franchiseFilters button"), function (button) {
      button.onclick = function () { setFranchise(button.getAttribute("data-franchise")); };
    });
  }

  function setFranchise(name) {
    state.franchise = name;
    renderFranchiseFilters();
    renderVault();
  }

  function tapeCard(item) {
    var tape = tapeById[item.id] || { unhinged: 0, wordsAudited: 0, moments: [] };
    var sealed = !item.transcript;
    return '<article class="tape-card ' + franchiseSlug(item.franchise) + '" style="--accent:' + colors[item.franchise] +
      '" data-tape="' + item.id + '">' +
      '<div class="tape-image"><img loading="lazy" src="' + esc(item.thumbnail) + '" alt=""><span>' +
      esc(item.franchise) + '</span><b>' + duration(item.duration) + '</b></div>' +
      '<div class="tape-body"><div><span>TAPE ' + String(item.order).padStart(2, "0") + ' // ' + shortDate(item.date) +
      '</span><i class="' + (sealed ? "sealed" : "") + '">' + (sealed ? "TAPE SEALED" : "FULL DISTILL") + '</i></div>' +
      '<h3>' + esc(item.film) + '</h3><p>' + esc(tape.verdict || "Age gate prevents a defensible caption distill. The original tape remains linked.") + '</p>' +
      '<footer><span><b>' + (sealed ? "—" : tape.unhinged) + '</b>UNHINGED</span><span><b>' +
      (sealed ? "—" : fmt(tape.wordsAudited)) + '</b>WORDS</span><button>OPEN AUTOPSY →</button></footer>' +
      '</div></article>';
  }

  function renderVault() {
    var query = state.vaultQuery.trim().toLowerCase();
    var words = query.split(/\s+/).filter(Boolean);
    var list = catalog.filter(function (item) {
      if (state.franchise !== "ALL" && item.franchise !== state.franchise) return false;
      if (!words.length) return true;
      var tape = tapeById[item.id] || {};
      var hay = [item.film, item.title, item.franchise, tape.verdict].join(" ").toLowerCase();
      return words.every(function (word) { return hay.indexOf(word) >= 0; });
    });
    document.getElementById("vaultCount").textContent = list.length + " TAPE" + (list.length === 1 ? "" : "S") + " EXHUMED";
    document.getElementById("tapeGrid").innerHTML = list.length ? list.map(tapeCard).join("") :
      '<p class="no-tapes">NOTHING IN THIS DRAWER. TRY FEWER WORDS OR A DIFFERENT KILLER.</p>';
    Array.prototype.forEach.call(document.querySelectorAll(".tape-card"), function (card) {
      card.onclick = function () { openDossier(card.getAttribute("data-tape")); };
    });
  }

  function metricRows(tape) {
    var metrics = Object.keys(categoryCopy).map(function (category) {
      return [category, tape.metrics[category] || 0];
    }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 6);
    var max = metrics.length ? metrics[0][1] || 1 : 1;
    return metrics.map(function (metric) {
      return '<li><div><span>' + esc(metric[0]) + '</span><b>' + metric[1] + ' SIGNALS</b></div>' +
        '<i><em style="width:' + Math.max(3, Math.round(metric[1] / max * 100)) + '%"></em></i></li>';
    }).join("");
  }

  function arcMarkup(tape) {
    return tape.arc.map(function (chapter) {
      return '<div title="Chapter ' + chapter.chapter + ': ' + esc(chapter.dominant) + '"><i style="height:' +
        chapter.heat + '%"></i><span>' + chapter.chapter + '</span><b>' + esc(chapter.dominant) + '</b></div>';
    }).join("");
  }

  function momentsMarkup(tape, item) {
    if (!tape.moments.length) {
      return '<p class="sealed-copy">YouTube requires an age-confirmed session for this upload. The prototype refuses to invent a transcript or a score. Open the original tape to continue.</p>';
    }
    return tape.moments.map(function (moment) {
      return '<article><div><span>' + esc(moment.category) + '</span><b>' + timestamp(moment.t) + '</b></div>' +
        '<p>“' + esc(displayQuote(moment.quote)) + '”</p><footer><button data-play="' + item.id + '" data-time="' +
        moment.t + '">▶ PLAY</button><button data-share="' + item.id + '" data-time="' + moment.t + '">SHARE RECEIPT</button></footer></article>';
    }).join("");
  }

  function openDossier(id, startTime) {
    var item = itemById[id];
    var tape = tapeById[id] || {
      unhinged: 0, wordsAudited: 0, captionMinutes: 0, verdict: "Tape sealed by YouTube's age gate.",
      metrics: {}, arc: [], moments: [],
    };
    if (!item) return;
    var modal = document.getElementById("tapeModal");
    document.getElementById("modalContent").innerHTML =
      '<div class="modal-hero" style="--accent:' + colors[item.franchise] + '">' +
      '<img src="' + esc(item.thumbnail) + '" alt=""><div><p>' + esc(item.franchise) + ' // TAPE ' +
      String(item.order).padStart(2, "0") + '</p><h2>' + esc(item.film) + '</h2><span>' + shortDate(item.date) +
      ' // ' + duration(item.duration) + '</span></div></div>' +
      '<div class="modal-grid"><section class="modal-verdict"><p class="kicker">THE MACHINE-AUDITED VERDICT</p><blockquote>' +
      esc(tape.verdict) + '</blockquote><div class="index-dial"><i style="--score:' + tape.unhinged +
      '"></i><b>' + (item.transcript ? tape.unhinged : "—") + '</b><span>UNHINGED<br>INDEX</span></div>' +
      '<div class="source-actions"><a href="' + esc(item.url) + '" target="_blank" rel="noopener">OPEN ORIGINAL ON YOUTUBE ↗</a>' +
      '<button data-share="' + item.id + '">COPY DOSSIER LINK</button></div></section>' +
      '<section class="signal-profile"><p class="kicker">SIGNAL PROFILE // ' + fmt(tape.wordsAudited) + ' WORDS AUDITED</p>' +
      '<ul>' + metricRows(tape) + '</ul></section></div>' +
      (tape.arc.length ? '<section class="heat-section"><div><p class="kicker">THE EIGHT-CHAPTER HEAT ARC</p><span>DOMINANT SIGNAL BY RUNTIME OCTANT</span></div><div class="heat-arc">' +
      arcMarkup(tape) + '</div></section>' : '') +
      '<section class="receipt-section"><div><p class="kicker">PLAYABLE EVIDENCE LOCKER</p><span>SHORT AUTO-CAPTION FRAGMENTS // VERIFY AGAINST ORIGINAL</span></div>' +
      '<div class="modal-player" id="modalPlayer"><div><span>SELECT A RECEIPT TO CUE THE ORIGINAL TAPE.</span></div></div>' +
      '<div class="receipt-list">' + momentsMarkup(tape, item) + '</div></section>';
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    bindPlayButtons(document.getElementById("modalContent"), true);
    bindShareButtons(document.getElementById("modalContent"));
    if (startTime != null) loadPlayer(item.id, Number(startTime));
    history.replaceState(null, "", "?tape=" + encodeURIComponent(item.id) + (startTime != null ? "&at=" + Math.round(startTime) : "") + "#autopsies");
  }

  function liveHeatMarkup(stream) {
    if (!stream.heatmap.length) {
      return '<p class="sealed-copy">YouTube supplies no caption track for this stream, so comedy scoring and topic chapters are deliberately unavailable. The original upload remains playable.</p>';
    }
    return stream.heatmap.map(function (bin, index) {
      return '<button style="--heat:' + bin.heat + '" data-live-play="' + stream.id + '" data-time="' + bin.from +
        '" title="' + esc(bin.signal + (bin.topic ? " // " + bin.topic : "")) + '"><i></i><span>' +
        (index % 5 === 0 ? timestamp(bin.from) : "") + '</span></button>';
    }).join("");
  }

  function liveTopicsMarkup(stream) {
    if (!stream.topics.length) return '<li class="topic-empty">NO DEFENSIBLE TOPIC CHAPTERS WITHOUT CAPTIONS.</li>';
    return stream.topics.map(function (topic, index) {
      return '<li><button data-live-play="' + stream.id + '" data-time="' + topic.peak + '"><span>0' + (index + 1) +
        '</span><div><b>' + esc(topic.name) + '</b><small>' + topic.mentions + ' MENTIONS // PEAK CLUSTER ' +
        timestamp(topic.peak) + '</small></div><i>JUMP →</i></button></li>';
    }).join("");
  }

  function liveMomentsMarkup(stream) {
    if (!stream.moments.length) {
      return '<p class="sealed-copy">No caption-derived comedy receipts are published for this stream. Open the original source to watch it in full.</p>';
    }
    return stream.moments.map(function (moment) {
      return '<article><div><span>' + esc(moment.category) + ' // HEAT ' + moment.heat + '</span><b>' +
        timestamp(moment.t) + '</b></div><p>“' + esc(displayQuote(moment.quote)) +
        '”</p><footer><button data-live-play="' + stream.id + '" data-time="' + moment.t +
        '">▶ PLAY</button><button data-share-live="' + stream.id + '" data-time="' + moment.t +
        '">SHARE RECEIPT</button></footer></article>';
    }).join("");
  }

  function openLiveDossier(id, startTime) {
    var stream = streamById[id];
    if (!stream) return;
    var lane = stream._lane === "popular" ? "FOUNDATIONAL 25" : "FRESH 10";
    var laneList = stream._lane === "popular" ? popular.streams : live.streams;
    var laneRank = laneList.indexOf(stream) + 1;
    var peak = stream.moments.slice().sort(function (a, b) { return b.heat - a.heat; })[0];
    var streamSummary = stream.summary || stream.whyItMatters ||
      (stream.editorial && stream.editorial.whyItMatters) ||
      "This source remains in the archive with an honest, playable path back to the original upload.";
    var modal = document.getElementById("tapeModal");
    document.getElementById("modalContent").innerHTML =
      '<div class="modal-hero live-modal-hero" style="--accent:var(--cyan)"><img src="' + esc(stream.thumbnail) +
      '" alt=""><div><p>' + lane + ' // LIVE MAP ' + String(laneRank).padStart(2, "0") +
      '</p><h2>' + esc(stream.title) + '</h2><span>' + shortDate(stream.date) + ' // ' +
      duration(stream.duration) + ' // ' + fmt(stream.views) + ' VIEWS</span></div></div>' +
      '<div class="modal-grid live-modal-grid"><section class="modal-verdict"><p class="kicker">THE LIVE-ROOM AUTOPSY</p><blockquote>' +
      esc(streamSummary) + '</blockquote><div class="live-peak"><b>' + (peak ? peak.heat : "—") +
      '</b><span>PEAK<br>COMEDY HEAT</span></div><div class="source-actions"><a href="' + esc(stream.url) +
      '" target="_blank" rel="noopener">OPEN ORIGINAL ON YOUTUBE ↗</a><button data-share-live="' + stream.id +
      '">COPY LIVE MAP</button></div></section><section class="live-topic-index"><p class="kicker">JUMP TO A TOPIC // ' +
      fmt(stream.wordsAudited) + ' WORDS AUDITED</p><ol>' + liveTopicsMarkup(stream) + '</ol></section></div>' +
      '<section class="heat-section live-heat-section"><div><p class="kicker">THE 30-CHAPTER FUNNY-MOMENT HEAT MAP</p>' +
      '<span>CLICK ANY BAR TO JUMP THERE // HEIGHT = COMEDY-SIGNAL DENSITY</span></div><div class="live-heatmap">' +
      liveHeatMarkup(stream) + '</div></section>' +
      '<section class="receipt-section"><div><p class="kicker">' +
      (stream._lane === "popular" ? "FOUNDATIONAL CHAOS" : "FRESHLY UNWELL") + ' // SOURCE RECEIPTS</p>' +
      '<span>SHORT AUTO-CAPTION FRAGMENTS // VERIFY AGAINST ORIGINAL</span></div><div class="modal-player" id="modalPlayer">' +
      '<div><span>SELECT A TOPIC, HEAT BAR, OR COMEDY HIT TO CUE THE STREAM.</span></div></div><div class="receipt-list">' +
      liveMomentsMarkup(stream) + '</div></section>';
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    bindLivePlayButtons(document.getElementById("modalContent"));
    bindLiveShareButtons(document.getElementById("modalContent"));
    if (startTime != null) loadPlayer(stream.id, Number(startTime));
    history.replaceState(null, "", "?live=" + encodeURIComponent(stream.id) +
      (startTime != null ? "&at=" + Math.round(startTime) : "") +
      (stream._lane === "popular" ? "#popular25" : "#livewire"));
  }

  function openLooseSource(id, startTime, label, endTime) {
    if (!id) return;
    var at = Number(startTime || 0);
    var end = Number(endTime || 0);
    var clipSeconds = end > at ? Math.round(end - at) : 0;
    var modal = document.getElementById("tapeModal");
    document.getElementById("modalContent").innerHTML =
      '<div class="modal-hero live-modal-hero" style="--accent:var(--pink)"><img src="https://i.ytimg.com/vi/' +
      encodeURIComponent(id) + '/maxresdefault.jpg" alt=""><div><p>CHARACTER ARCHAEOLOGY // SOURCE PERFORMANCE</p><h2>' +
      esc(label || "WWAM SOURCE RECEIPT") + '</h2><span>' +
      (clipSeconds ? "BOUNDED " + clipSeconds + "-SECOND SOURCE CLIP" : "PLAYABLE ORIGINAL") + " // " + timestamp(at) +
      '</span></div></div><section class="receipt-section loose-source"><div><p class="kicker">THE ORIGINAL PERFORMANCE</p>' +
      '<span>THIS AUDIO IS WWAM’S SOURCE UPLOAD // THE GENERATED RIFF IS NOT' +
      (clipSeconds ? " // CLIP STOPS AFTER " + clipSeconds + " SECONDS" : "") +
      '</span></div><div class="modal-player" id="modalPlayer"></div>' +
      '<div class="loose-source-actions"><a href="https://www.youtube.com/watch?v=' +
      encodeURIComponent(id) + '&t=' + Math.round(at) + 's" target="_blank" rel="noopener">OPEN ORIGINAL ON YOUTUBE ↗</a></div></section>';
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    loadPlayer(id, at, end);
  }

  function loadPlayer(id, at, end) {
    var player = document.getElementById("modalPlayer");
    if (!player) return;
    player.innerHTML = '<iframe src="https://www.youtube.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0&start=' +
      Math.max(0, Math.round(at || 0)) + (Number(end || 0) > Number(at || 0) ? '&end=' + Math.round(end) : '') +
      '" title="WWAM commentary source playback" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
    player.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function closeDossier() {
    var modal = document.getElementById("tapeModal");
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    var url = new URL(window.location.href);
    url.searchParams.delete("tape");
    url.searchParams.delete("live");
    url.searchParams.delete("at");
    history.replaceState(null, "", url.pathname + url.hash);
  }

  function bindPlayButtons(root, inModal) {
    Array.prototype.forEach.call(root.querySelectorAll("[data-play]"), function (button) {
      button.onclick = function (event) {
        event.stopPropagation();
        var id = button.getAttribute("data-play");
        var at = Number(button.getAttribute("data-time") || 0);
        if (inModal) loadPlayer(id, at);
        else openDossier(id, at);
      };
    });
  }

  function bindLivePlayButtons(root) {
    Array.prototype.forEach.call(root.querySelectorAll("[data-live-play]"), function (button) {
      button.onclick = function (event) {
        event.stopPropagation();
        loadPlayer(button.getAttribute("data-live-play"), Number(button.getAttribute("data-time") || 0));
      };
    });
  }

  function shareUrl(id, at) {
    var url = new URL(window.location.href);
    url.search = "";
    url.hash = "autopsies";
    url.searchParams.set("tape", id);
    if (at != null) url.searchParams.set("at", Math.round(at));
    return url.toString();
  }

  function shareLiveUrl(id, at) {
    var url = new URL(window.location.href);
    url.search = "";
    url.hash = streamById[id] && streamById[id]._lane === "popular" ? "popular25" : "livewire";
    url.searchParams.set("live", id);
    if (at != null) url.searchParams.set("at", Math.round(at));
    return url.toString();
  }

  function copy(value) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(value).then(showToast);
    } else {
      var input = document.createElement("textarea");
      input.value = value;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
      showToast();
    }
  }

  function bindShareButtons(root) {
    Array.prototype.forEach.call(root.querySelectorAll("[data-share]"), function (button) {
      button.onclick = function () {
        copy(shareUrl(button.getAttribute("data-share"), button.hasAttribute("data-time") ? Number(button.getAttribute("data-time")) : null));
      };
    });
  }

  function bindLiveShareButtons(root) {
    Array.prototype.forEach.call(root.querySelectorAll("[data-share-live]"), function (button) {
      button.onclick = function () {
        copy(shareLiveUrl(button.getAttribute("data-share-live"),
          button.hasAttribute("data-time") ? Number(button.getAttribute("data-time")) : null));
      };
    });
  }

  function showToast() {
    var toast = document.getElementById("toast");
    toast.classList.add("show");
    setTimeout(function () { toast.classList.remove("show"); }, 2200);
  }

  function renderAskExamples() {
    var examples = (curated.askExamples || []).concat([
      "What is the most-viewed foundational livestream?",
      "Did their opinion on Halloween change?",
    ]).slice(0, 8);
    document.getElementById("askExamples").innerHTML = examples.map(function (example) {
      return '<button>' + esc(example) + '</button>';
    }).join("");
  }

  function ask(query) {
    var analysis = askEngine.ask(query, state.askContext);
    var results = analysis.results;
    var roleByKey = {};
    (analysis.evidenceChain || []).forEach(function (entry) {
      if (entry.result && entry.result.key) roleByKey[entry.result.key] = entry.role;
    });
    state.askContext = {
      entity: analysis.entity,
      intent: analysis.intent,
      source: analysis.source,
      query: query,
    };
    document.getElementById("askStatus").textContent = results.length ?
      (analysis.evidenceChain || []).length + " RECEIPT CHAIN // " + analysis.confidence + "% CONFIDENCE" : "NO DEFENSIBLE RECEIPT";
    document.getElementById("askResults").innerHTML =
      '<section class="answer-brief"><div><span>INTENT // ' + esc(analysis.intent.toUpperCase()) + '</span><b>' +
      (analysis.entity ? 'ENTITY // ' + esc(analysis.entity.toUpperCase()) : 'ENTITY // OPEN') + '</b><i>' +
      esc((analysis.source === "all" ? "ALL SOURCES" : analysis.source).toUpperCase()) +
      (analysis.continuedFrom ? ' // FOLLOW-UP MEMORY' : '') + '</i></div><h3>' +
      esc(analysis.answer) + '</h3><div class="confidence-track"><i style="width:' + analysis.confidence +
      '%"></i></div></section>' +
      (results.length ? results.map(function (result, index) {
        var role = roleByKey[result.key] || (index === 0 ? "DIRECT HIT" : result.label);
        return '<article class="' + (index === 0 ? "best" : "") + '"><div><span>' +
          esc(role) + '</span><b>' + esc((result.lane === "popular" ? "POPULAR 25" : result.source).toUpperCase()) +
          '</b></div><h3>' + esc(result.title) + '</h3><p>“' + esc(displayQuote(result.excerpt)) +
          '”</p><div class="why-row"><span>WHY THIS RANKED</span><b>' +
          esc(result.reasons.length ? result.reasons.join(" + ").toUpperCase() : "TEXTUAL EVIDENCE") +
          '</b></div><footer><span>' + esc(result.category) + (result.at ? ' // ' + timestamp(result.at) : '') +
          '</span><button data-ask-source="' + result.source + '" data-id="' + result.sourceId +
          '" data-time="' + result.at + '">SHOW ME →</button></footer></article>';
      }).join("") : '<p class="empty-state">No confident match in the current source scope. Try a specific film, a franchise alias, a live topic, “latest,” or a clear opinion.</p>');
    Array.prototype.forEach.call(document.querySelectorAll("#askResults [data-ask-source]"), function (button) {
      button.onclick = function () {
        if (button.getAttribute("data-ask-source") === "livestream") {
          openLiveDossier(button.getAttribute("data-id"), Number(button.getAttribute("data-time") || 0));
        } else {
          openDossier(button.getAttribute("data-id"), Number(button.getAttribute("data-time") || 0));
        }
      };
    });
  }

  function showcaseCall(method, fallback, args) {
    if (showcaseEngine && typeof showcaseEngine[method] === "function") {
      try {
        var result = showcaseEngine[method].apply(showcaseEngine, args || []);
        if (result != null) return result;
      } catch {
        // The public showcase remains usable if an optional derived surface fails.
      }
    }
    return fallback();
  }

  function sourceMoment(source, id, moment, title, date) {
    return {
      source: source,
      sourceId: id,
      id: id,
      at: Number(moment.t || moment.at || 0),
      t: Number(moment.t || moment.at || 0),
      title: title,
      date: date,
      category: moment.category || "SOURCE RECEIPT",
      excerpt: moment.quote || moment.excerpt || "",
      score: moment.score || moment.heat || 0,
    };
  }

  function fallbackTimeMachines() {
    return franchiseOrder.map(function (franchise) {
      var events = catalog.filter(function (item) { return item.franchise === franchise; })
        .sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); })
        .map(function (item) {
          var tape = tapeById[item.id];
          var moment = tape && tape.moments.slice().sort(function (a, b) { return b.score - a.score; })[0];
          return moment ? sourceMoment("commentary", item.id, moment, item.film, item.date) : null;
        }).filter(Boolean);
      return { name: franchise, entity: franchise, events: events, receipts: events };
    });
  }

  function fallbackBitLineages() {
    var characterBits = characterProfiles().map(function (profile) {
      var receipts = (profile.soundbytes || []).map(normalizeCharacterReceipt).map(function (receipt) {
        var source = receipt.source === "commentary" ? itemById[receipt.id] : streamById[receipt.id];
        return {
          source: receipt.source,
          sourceId: receipt.id,
          id: receipt.id,
          at: receipt.t,
          t: receipt.t,
          title: receipt.label,
          date: source && source.date,
          category: profile.name,
          excerpt: receipt.quote,
        };
      });
      return { name: profile.name, bit: profile.name, description: profile.description, events: receipts, receipts: receipts };
    }).filter(function (bit) { return bit.events.length; });
    if (characterBits.length) return characterBits;
    var events = [];
    deep.tapes.forEach(function (tape) {
      var item = itemById[tape.id];
      tape.moments.filter(function (moment) { return moment.category === "BIT ENERGY"; }).forEach(function (moment) {
        events.push(sourceMoment("commentary", tape.id, moment, item.film, item.date));
      });
    });
    return [{ name: "Recurring Callback Signals", bit: "Recurring Callback Signals", events: events, receipts: events }];
  }

  function fallbackChemistry() {
    var entries = [];
    live.streams.concat(popular.streams).forEach(function (stream) {
      var moments = stream.moments || [];
      if (!moments.length) return;
      var avg = Math.round(moments.reduce(function (total, moment) { return total + Number(moment.heat || 0); }, 0) / moments.length);
      entries.push({
        title: stream.title,
        source: "livestream",
        sourceId: stream.id,
        score: Math.min(99, Math.round(avg * .7 + moments.length * 4)),
        escalation: Math.min(99, avg + 5),
        callbacks: (stream.characters || stream.characterSightings || []).length * 18,
        roomBreaks: moments.filter(function (moment) { return moment.category === "THE ROOM BREAKS"; }).length,
        peak: moments.slice().sort(function (a, b) { return b.heat - a.heat; })[0],
      });
    });
    return entries.sort(function (a, b) { return b.score - a.score; }).slice(0, 8);
  }

  function fallbackCourtCases() {
    return franchiseOrder.map(function (franchise) {
      var prosecution = [];
      var defense = [];
      catalog.filter(function (item) { return item.franchise === franchise; }).forEach(function (item) {
        var tape = tapeById[item.id];
        (tape ? tape.moments : []).forEach(function (moment) {
          var evidence = sourceMoment("commentary", item.id, moment, item.film, item.date);
          if (moment.category === "FRANCHISE FELONY") prosecution.push(evidence);
          if (moment.category === "LOVE LETTER") defense.push(evidence);
        });
      });
      return {
        title: "THE PEOPLE VS. " + franchise.toUpperCase(),
        entity: franchise,
        prosecution: prosecution.sort(function (a, b) { return b.score - a.score; }).slice(0, 3),
        defense: defense.sort(function (a, b) { return b.score - a.score; }).slice(0, 3),
      };
    });
  }

  function fallbackDescent(options) {
    options = options || {};
    var mode = options.mode || state.descentMode;
    var categories = mode === "GRUDGES" ? ["FRANCHISE FELONY", "TAKE GETS NUCLEAR"] :
      mode === "LOVE" ? ["LOVE LETTER"] :
      mode === "LORE" ? ["HORROR BRAIN", "THEORY BOARD", "BIT ENERGY"] :
      ["OUT OF POCKET", "BREAKDOWN", "THE ROOM BREAKS", "FULL SEND", "UP IN YA"];
    var candidates = [];
    deep.tapes.forEach(function (tape) {
      var item = itemById[tape.id];
      tape.moments.forEach(function (moment) {
        if (categories.indexOf(moment.category) >= 0) candidates.push(sourceMoment("commentary", tape.id, moment, item.film, item.date));
      });
    });
    live.streams.concat(popular.streams).forEach(function (stream) {
      (stream.moments || []).forEach(function (moment) {
        if (categories.indexOf(moment.category) >= 0) candidates.push(sourceMoment("livestream", stream.id, moment, stream.title, stream.date));
      });
    });
    candidates.sort(function (a, b) { return b.score - a.score; });
    var count = Math.max(4, Math.min(12, Math.round((options.minutes || state.descentMinutes) / 3)));
    return { mode: mode, minutes: options.minutes || state.descentMinutes, path: candidates.slice(0, count) };
  }

  function evidenceButton(item, label) {
    var source = item.source || item.sourceType || (itemById[item.sourceId || item.id] ? "commentary" : "livestream");
    var id = item.sourceId || item.id || item.videoId;
    var at = Number(item.at != null ? item.at : item.t || item.time || 0);
    return '<button data-memory-source="' + esc(source) + '" data-id="' + esc(id) + '" data-time="' + at +
      '">' + esc(label || "PLAY RECEIPT") + ' →</button>';
  }

  function memoryReceipt(item, index) {
    return '<article class="memory-receipt"><div><span>' + String(index + 1).padStart(2, "0") + ' // ' +
      esc(item.category || item.role || "SOURCE RECEIPT") + '</span><b>' + (item.date ? shortDate(item.date) : timestamp(item.at || item.t)) +
      '</b></div><h4>' + esc(item.title || item.label || "WWAM SOURCE") + '</h4><p>“' +
      esc(displayQuote(item.excerpt || item.quote || "Open the source to inspect this evidence.")) +
      '”</p>' + evidenceButton(item, "OPEN " + timestamp(item.at || item.t || 0)) + '</article>';
  }

  function bindMemoryReceipts() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-memory-source]"), function (button) {
      button.onclick = function () {
        var id = button.getAttribute("data-id");
        var at = Number(button.getAttribute("data-time") || 0);
        if (button.getAttribute("data-memory-source") === "commentary" && itemById[id]) openDossier(id, at);
        else if (streamById[id]) openLiveDossier(id, at);
        else openLooseSource(id, at, "WWAM SOURCE RECEIPT");
      };
    });
  }

  function renderTimeMachine() {
    var machines = showcaseCall("getTimeMachines", fallbackTimeMachines);
    if (!Array.isArray(machines)) machines = machines.items || machines.timelines || [];
    if (!machines.length) return '<p class="memory-empty">THE TIME MACHINE NEEDS MORE VERIFIED EVENTS.</p>';
    var selected = machines.filter(function (machine) {
      return (machine.name || machine.entity || machine.title || machine.subject) === state.memoryEntity;
    })[0] || machines[0];
    state.memoryEntity = selected.name || selected.entity || selected.title || selected.subject;
    var events = (selected.events || selected.milestones || selected.timeline || []).map(enrichEvidence);
    return '<div class="memory-picker">' + machines.slice(0, 10).map(function (machine) {
      var name = machine.name || machine.entity || machine.title || machine.subject;
      return '<button class="' + (name === state.memoryEntity ? "on" : "") + '" data-memory-entity="' + esc(name) +
        '">' + esc(name) + '</button>';
    }).join("") + '</div><div class="time-machine"><div class="time-intro"><span>TAKE TIME MACHINE</span><h3>' +
      esc(state.memoryEntity) + '</h3><p>Follow the strongest surviving source evidence in chronological order. Category changes expose affection, hostility, theory, and reversal without inventing a final opinion.</p><b>' +
      events.length + ' VERIFIED STOPS</b></div><div class="time-track">' + events.slice(0, 10).map(function (event) {
        return '<article><i></i><div><span>' + esc(event.date ? shortDate(event.date) : "DATE IN SOURCE") + ' // ' +
          esc(event.category || "RECEIPT") + '</span><h4>' + esc(event.title || state.memoryEntity) + '</h4><p>“' +
          esc(displayQuote(event.excerpt || event.quote || "")) + '”</p>' + evidenceButton(event, "ENTER THIS MOMENT") +
          '</div></article>';
      }).join("") + '</div></div>';
  }

  function renderBitAncestry() {
    var lineages = showcaseCall("getBitLineages", fallbackBitLineages);
    if (!Array.isArray(lineages)) lineages = lineages.items || lineages.bits || [];
    if (!lineages.length) return '<p class="memory-empty">NO RECURRING BIT HAS ENOUGH VERIFIED SIGHTINGS YET.</p>';
    var selected = lineages[0];
    var events = (selected.events || selected.performances || selected.receipts || selected.sightings || []).map(enrichEvidence);
    return '<div class="bit-intro"><span>BIT ANCESTRY // ORIGIN TO LATEST SIGHTING</span><h3>' +
      esc(selected.name || selected.label || selected.bit || "RECURRING BIT") + '</h3><p>' +
      esc(selected.description || "A recurring performance or callback connected across its source appearances.") +
      '</p></div><div class="bit-chain">' + events.slice(0, 12).map(function (event, index) {
        var stage = index === 0 ? "EARLIEST SURVIVING SIGHTING" : index === events.length - 1 ? "LATEST SIGHTING" : "MUTATION 0" + index;
          return '<article><span>' + stage + '</span><b>' + esc(event.title || selected.name || selected.label || selected.bit) +
          '</b><p>“' + esc(displayQuote(event.excerpt || event.quote || "")) + '”</p>' +
          evidenceButton(event, "PLAY THE LINEAGE") + '</article>';
      }).join("") + '</div>';
  }

  function renderChemistry() {
    var entries = showcaseCall("getRiffChemistry", fallbackChemistry);
    if (!Array.isArray(entries)) entries = entries.moments || entries.items || entries.rankings || [];
    entries = entries.map(function (entry) {
      var evidence = enrichEvidence(entry);
      return Object.assign({}, entry, {
        title: evidence.title,
        source: evidence.source,
        sourceId: evidence.sourceId,
        at: evidence.at,
        category: evidence.category,
        peak: evidence,
        escalation: entry.escalation || (entry.dimensions && entry.dimensions.escalation),
        callbacks: entry.callbacks || (entry.dimensions && entry.dimensions.callbackDensity),
        roomBreaks: entry.roomBreaks || (entry.dimensions && entry.dimensions.roomBreak),
      });
    });
    return '<div class="chemistry-head"><span>RIFF VELOCITY IS NOT A PROFANITY COUNTER</span><p>Escalation, room-break signals, callbacks, character sightings, and the speed at which one remark infects the whole conversation.</p></div><div class="chemistry-grid">' +
      entries.slice(0, 8).map(function (entry, index) {
        var peak = entry.peak || {};
        return '<article><div><b>#' + String(index + 1).padStart(2, "0") + '</b><i>' +
          Number(entry.score || entry.riffVelocity || 0) + '</i></div><h3>' + esc(entry.title || entry.name) +
          '</h3><ul><li><span>ESCALATION</span><b>' + Number(entry.escalation || entry.score || 0) +
          '</b></li><li><span>CALLBACK PRESSURE</span><b>' + Number(entry.callbacks || entry.callbackDensity || 0) +
          '</b></li><li><span>ROOM BREAKS</span><b>' + Number(entry.roomBreaks || entry.breaks || 0) +
          '</b></li></ul>' + evidenceButton({
            source: entry.source || "livestream",
            sourceId: entry.sourceId || entry.id,
            at: peak.t || entry.at || 0,
          }, "INSPECT THE RIFF") + '</article>';
      }).join("") + '</div>';
  }

  function renderCourt() {
    var cases = showcaseCall("getCourtCases", fallbackCourtCases);
    if (!Array.isArray(cases)) cases = cases.items || cases.cases || [];
    var court = cases[0];
    if (!court) return '<p class="memory-empty">COURT IS ADJOURNED UNTIL BOTH SIDES HAVE RECEIPTS.</p>';
    var prosecution = (court.prosecution || court.negative || []).map(enrichEvidence);
    var defense = (court.defense || court.positive || []).map(enrichEvidence);
    return '<div class="court-title"><span>CASE 001 // RECEIPTS, NOT CONSENSUS</span><h3>' +
      esc(court.title || court.caseName || "THE PEOPLE VS. THE FRANCHISE") + '</h3><p>The archive does not force a verdict. It puts contradictory source evidence on the same table and lets the viewer inspect both sides.</p></div><div class="court-grid"><section><header>THE PROSECUTION</header>' +
      prosecution.slice(0, 3).map(memoryReceipt).join("") + '</section><div class="court-vs">VS</div><section><header>THE DEFENSE</header>' +
      defense.slice(0, 3).map(memoryReceipt).join("") + '</section></div>';
  }

  function renderDescent() {
    var descent = showcaseCall("buildDescent", function () {
      return fallbackDescent({ mode: state.descentMode, minutes: state.descentMinutes });
    }, [{ mode: state.descentMode, minutes: state.descentMinutes }]);
    var path = descent.path || descent.stops || descent.items || descent;
    if (!Array.isArray(path)) path = [];
    path = path.map(enrichEvidence);
    return '<div class="descent-builder"><div><span>GENERATE A PLAYABLE RABBIT HOLE</span><h3>' +
      state.descentMinutes + ' MINUTES OF ' + esc(state.descentMode) + '</h3></div><label>RUN TIME<input id="descentMinutes" type="range" min="10" max="45" step="5" value="' +
      state.descentMinutes + '"><b>' + state.descentMinutes + ' MIN</b></label><div class="descent-modes">' +
      ["CHAOS", "GRUDGES", "LOVE", "LORE"].map(function (mode) {
        return '<button class="' + (mode === state.descentMode ? "on" : "") + '" data-descent-mode="' + mode + '">' +
          mode + '</button>';
      }).join("") + '</div></div><div class="descent-path">' + path.slice(0, 12).map(function (item, index) {
        return '<article><b>' + String(index + 1).padStart(2, "0") + '</b><div><span>' +
          esc(item.category || "SOURCE RECEIPT") + '</span><h4>' + esc(item.title || item.label || "WWAM SOURCE") +
          '</h4><p>' + esc(displayQuote(item.excerpt || item.quote || "")) + '</p></div>' +
          evidenceButton(item, "PLAY") + '</article>';
      }).join("") + '</div>';
  }

  function renderMemory() {
    var content = state.memoryTab === "time" ? renderTimeMachine() :
      state.memoryTab === "bits" ? renderBitAncestry() :
      state.memoryTab === "chemistry" ? renderChemistry() :
      state.memoryTab === "court" ? renderCourt() : renderDescent();
    document.getElementById("memoryStage").innerHTML = content;
    document.getElementById("memoryProof").innerHTML = [
      [showcaseMetric("nodes", 0), "MEMORY NODES"],
      [showcaseMetric("edges", 0), "SOURCE-BACKED EDGES"],
      [showcaseMetric("timelines", fallbackTimeMachines().length), "TAKE TIMELINES"],
      [showcaseMetric("bits", fallbackBitLineages().length), "BIT LINEAGES"],
    ].map(function (stat) { return '<div><b>' + stat[0] + '</b><span>' + stat[1] + '</span></div>'; }).join("");
    Array.prototype.forEach.call(document.querySelectorAll("[data-memory-tab]"), function (button) {
      button.classList.toggle("on", button.getAttribute("data-memory-tab") === state.memoryTab);
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-memory-entity]"), function (button) {
      button.onclick = function () {
        state.memoryEntity = button.getAttribute("data-memory-entity");
        renderMemory();
      };
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-descent-mode]"), function (button) {
      button.onclick = function () {
        state.descentMode = button.getAttribute("data-descent-mode");
        renderMemory();
      };
    });
    var range = document.getElementById("descentMinutes");
    if (range) range.oninput = function () {
      state.descentMinutes = Number(range.value);
      renderMemory();
    };
    bindMemoryReceipts();
  }

  function fallbackAftermath() {
    var stream = live.streams[0] || {};
    return {
      title: "THE AFTERMATH // " + (stream.date ? shortDate(stream.date) : "LATEST STREAM"),
      sourceId: stream.id,
      summary: stream.summary || "The newest livestream is waiting for its source-backed aftermath report.",
      topics: (stream.topics || []).slice(0, 5),
      moments: (stream.moments || []).slice(0, 4),
      changes: (stream.topics || []).slice(0, 3).map(function (topic) { return topic.name + " re-entered the live memory graph"; }),
    };
  }

  function fallbackControlRoom() {
    var stream = live.streams[0] || {};
    return {
      approvals: (stream.moments || []).slice(0, 4).map(function (moment) {
        return { label: moment.category + " at " + timestamp(moment.t), confidence: moment.heat, sourceId: stream.id, at: moment.t };
      }),
      opportunities: (stream.topics || []).slice(0, 4).map(function (topic) {
        return { label: topic.name + " current-topic supercut", reason: topic.mentions + " mentions in the latest stream", sourceId: stream.id, at: topic.peak };
      }),
      resurfaced: (stream.topics || []).slice(0, 3).map(function (topic) {
        return { label: topic.name, reason: "Current live discussion can route viewers into the older archive", sourceId: stream.id, at: topic.peak };
      }),
    };
  }

  function renderControlRoom() {
    var aftermath = showcaseCall("getAftermath", fallbackAftermath);
    if (Array.isArray(aftermath)) aftermath = aftermath[0] || fallbackAftermath();
    var sourceId = aftermath.sourceId || aftermath.id || (live.streams[0] && live.streams[0].id);
    var aftermathTopics = aftermath.topics || aftermath.dominantTopics || [];
    var aftermathChanges = aftermath.changes || aftermath.deltas || aftermath.newSincePreviousIndexedStream || [];
    document.getElementById("aftermath").innerHTML =
      '<div class="aftermath-title"><span>THE LIVE AFTERMATH REPORT</span><h3>' +
      esc(aftermath.title || "WHAT THE NEWEST SHOW CHANGED") + '</h3><p>' +
      esc(aftermath.summary || "") + '</p>' + (sourceId ? evidenceButton({
        source: "livestream", sourceId: sourceId, at: aftermath.at || 0,
      }, "OPEN THE LATEST LIVE MAP") : "") + '</div><div class="aftermath-columns"><section><span>TOPICS THAT ENTERED THE ROOM</span>' +
      aftermathTopics.slice(0, 5).map(function (topic) {
        return '<b>' + esc(topic.name || topic.label || topic) + '</b>';
      }).join("") + '</section><section><span>WHAT CHANGED IN MEMORY</span>' +
      aftermathChanges.slice(0, 5).map(function (change) {
        return '<b>' + esc(change.label || change) + '</b>';
      }).join("") + '</section></div>';
    var control = showcaseCall("getControlRoom", fallbackControlRoom);
    var groups;
    if (control.queue && Array.isArray(control.queue)) {
      var sourceHealth = control.queue.filter(function (item) { return item.lane === "SOURCE HEALTH"; });
      var editorial = control.queue.filter(function (item) { return item.lane !== "SOURCE HEALTH" && item.lane !== "CONTENT STUDIO"; });
      var opportunities = control.queue.filter(function (item) { return item.lane === "CONTENT STUDIO"; });
      groups = [
        ["SOURCE HEALTH", sourceHealth],
        ["EDITORIAL APPROVAL QUEUE", editorial],
        ["CONTENT OPPORTUNITIES", opportunities],
      ];
    } else {
      groups = [
        ["EDITORIAL APPROVAL QUEUE", control.approvals || control.reviewQueue || []],
        ["CONTENT OPPORTUNITIES", control.opportunities || control.contentOpportunities || []],
        ["ARCHIVE RESURFACED", control.resurfaced || control.archiveResurfaced || []],
      ];
    }
    document.getElementById("controlGrid").innerHTML = groups.map(function (group) {
      return '<section><header><i></i><span>' + group[0] + '</span><b>' + group[1].length + ' OPEN</b></header>' +
        group[1].slice(0, 5).map(function (item) {
          return '<article><div><h4>' + esc(item.label || item.title || item.action || "SOURCE CANDIDATE") + '</h4><p>' +
            esc(item.reason || item.description || (item.confidence ? item.confidence + "% MACHINE CONFIDENCE" : "HUMAN REVIEW REQUIRED")) +
            '</p></div>' + ((item.sourceId || item.id) ? evidenceButton({
              source: item.source || "livestream", sourceId: item.sourceId || item.id, at: item.at || item.t || 0,
            }, "REVIEW") : '<button>REVIEW →</button>') + '</article>';
        }).join("") + '</section>';
    }).join("");
    bindMemoryReceipts();
  }

  function renderLabs() {
    document.getElementById("labTabs").innerHTML = deep.franchises.map(function (franchise) {
      return '<button class="' + (state.lab === franchise.name ? "on" : "") + '" data-lab="' + esc(franchise.name) +
        '"><span>' + esc(franchise.killer) + '</span><b>' + esc(franchise.lab) + '</b></button>';
    }).join("");
    var franchise = deep.franchises.filter(function (item) { return item.name === state.lab; })[0];
    var items = catalog.filter(function (item) { return item.franchise === state.lab; });
    var candidates = [];
    items.forEach(function (item) {
      var tape = tapeById[item.id];
      if (tape) tape.moments.forEach(function (moment) { candidates.push({ item: item, tape: tape, moment: moment }); });
    });
    var category = state.lab === "Scream" ? "THEORY BOARD" :
      state.lab === "Friday the 13th" ? "KILL ROOM" :
      state.lab === "Halloween" ? "HORROR BRAIN" : "FRANCHISE FELONY";
    candidates.sort(function (a, b) {
      return (b.moment.category === category) - (a.moment.category === category) || b.moment.score - a.moment.score;
    });
    var featured = candidates.slice(0, 4);
    document.getElementById("labPanel").style.setProperty("--accent", colors[state.lab]);
    document.getElementById("labPanel").innerHTML =
      '<div class="lab-intro"><span>LIVE CHAMBER // ' + esc(franchise.killer) + '</span><h3>' + esc(franchise.lab) +
      '</h3><p>' + esc(franchise.prompt) + '</p><div><b>' + franchise.tapes + '</b>TAPES UNDER OATH <b>' +
      fmt(franchise.wordsAudited) + '</b>WORDS IN EVIDENCE</div></div>' +
      '<div class="lab-receipts">' + featured.map(function (entry, index) {
        return '<article><span>EXHIBIT ' + String.fromCharCode(65 + index) + ' // ' + esc(entry.moment.category) +
          '</span><blockquote>“' + esc(displayQuote(entry.moment.quote)) + '”</blockquote><div><b>' +
          esc(entry.item.film) + '</b><button data-play="' + entry.item.id + '" data-time="' + entry.moment.t +
          '">CUE ' + timestamp(entry.moment.t) + ' →</button></div></article>';
      }).join("") + '</div>';
    Array.prototype.forEach.call(document.querySelectorAll("#labTabs button"), function (button) {
      button.onclick = function () { state.lab = button.getAttribute("data-lab"); renderLabs(); };
    });
    bindPlayButtons(document.getElementById("labPanel"));
  }

  function setBand(value, persist) {
    state.redBand = value === "red";
    if (persist) localStorage.setItem("wwam-band", state.redBand ? "red" : "bleep");
    document.body.classList.toggle("office-bleep", !state.redBand);
    document.getElementById("bandToggle").textContent = "OFFICE BLEEP: " + (state.redBand ? "OFF" : "ON");
    renderHeroConsole();
    renderHot100();
    renderSoundbytes();
    renderCharacter();
    renderMemory();
    renderControlRoom();
    renderLabs();
    var openModal = document.getElementById("tapeModal").classList.contains("show");
    if (openModal) {
      var params = new URLSearchParams(location.search);
      if (params.get("tape")) openDossier(params.get("tape"), params.get("at"));
      else if (params.get("live")) openLiveDossier(params.get("live"), params.get("at"));
    }
  }

  function renderTour() {
    var slide = tourSlides[state.tourSlide];
    document.getElementById("tourBody").innerHTML =
      '<div class="tour-number">' + slide.number + '</div><div><p>' + slide.eyebrow + '</p><h2>' + slide.title +
      '</h2><span>' + slide.body + '</span><blockquote>' + slide.proof + '</blockquote></div>';
    document.getElementById("tourProgress").style.width = ((state.tourSlide + 1) / tourSlides.length * 100) + "%";
    document.getElementById("tourCounter").textContent = (state.tourSlide + 1) + " / " + tourSlides.length;
    document.getElementById("tourBack").disabled = state.tourSlide === 0;
    document.getElementById("tourNext").textContent = state.tourSlide === tourSlides.length - 1 ? "COPY DEMO LINK" : "NEXT →";
  }

  function openTour() {
    state.tourSlide = 0;
    renderTour();
    document.getElementById("pitchTour").classList.add("show");
    document.getElementById("pitchTour").setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    history.replaceState(null, "", "#pitch");
  }

  function closeTour() {
    document.getElementById("pitchTour").classList.remove("show");
    document.getElementById("pitchTour").setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  function bindPage() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-band]"), function (button) {
      button.onclick = function () {
        setBand(button.getAttribute("data-band"), true);
        document.getElementById("contentGate").classList.add("gone");
      };
    });
    document.getElementById("bandToggle").onclick = function () { setBand(state.redBand ? "bleep" : "red", true); };
    document.getElementById("loadMore").onclick = function () { state.hotLimit += 12; renderHot100(); };
    document.getElementById("rouletteButton").onclick = function () {
      var moment = deep.hot100[Math.floor(Math.random() * deep.hot100.length)];
      if (moment) openDossier(moment.tapeId, moment.t);
    };
    Array.prototype.forEach.call(document.querySelectorAll("[data-sound-source]"), function (button) {
      button.onclick = function () {
        state.soundSource = button.getAttribute("data-sound-source");
        renderSoundFilters();
        renderSoundbytes();
      };
    });
    document.getElementById("soundRoulette").onclick = function () {
      var candidates = soundbytes();
      var item = candidates[Math.floor(Math.random() * candidates.length)];
      if (item) cueSoundbyte(item);
    };
    document.getElementById("characterForm").onsubmit = function (event) {
      event.preventDefault();
      var question = document.getElementById("characterInput").value.trim();
      if (question.length > 1) askCharacter(question);
    };
    document.getElementById("popularSearch").oninput = function (event) {
      state.popularQuery = event.target.value;
      renderPopular();
    };
    Array.prototype.forEach.call(document.querySelectorAll("[data-memory-tab]"), function (button) {
      button.onclick = function () {
        state.memoryTab = button.getAttribute("data-memory-tab");
        renderMemory();
      };
    });
    document.getElementById("vaultSearch").oninput = function (event) {
      state.vaultQuery = event.target.value;
      renderVault();
    };
    document.getElementById("askForm").onsubmit = function (event) {
      event.preventDefault();
      var query = document.getElementById("askInput").value.trim();
      if (query.length > 1) ask(query);
    };
    Array.prototype.forEach.call(document.querySelectorAll(".prompt-chips button"), function (button) {
      button.onclick = function () {
        document.getElementById("askInput").value = button.textContent;
        ask(button.textContent);
      };
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-category-jump]"), function (button) {
      button.onclick = function () {
        state.hotCategory = button.getAttribute("data-category-jump");
        state.hotLimit = 12;
        renderCategoryFilters();
        renderHot100();
        document.getElementById("red100").scrollIntoView({ behavior: "smooth" });
      };
    });
    document.getElementById("modalClose").onclick = closeDossier;
    document.getElementById("tapeModal").onclick = function (event) {
      if (event.target.id === "tapeModal") closeDossier();
    };
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        if (document.getElementById("pitchTour").classList.contains("show")) closeTour();
        else if (document.getElementById("tapeModal").classList.contains("show")) closeDossier();
      }
    });
    [document.getElementById("mikeButton"), document.getElementById("pitchTourButton"), document.getElementById("footerPitch")].forEach(function (button) {
      button.onclick = openTour;
    });
    document.getElementById("copyDemoButton").onclick = function () { copy(location.origin + location.pathname + "#pitch"); };
    document.getElementById("tourClose").onclick = closeTour;
    document.getElementById("tourBack").onclick = function () {
      if (state.tourSlide > 0) { state.tourSlide -= 1; renderTour(); }
    };
    document.getElementById("tourNext").onclick = function () {
      if (state.tourSlide < tourSlides.length - 1) { state.tourSlide += 1; renderTour(); }
      else copy(location.origin + location.pathname + "#pitch");
    };
  }

  function init() {
    document.getElementById("consoleStatus").textContent = "SCANNING " +
      fmt(deep.meta.wordsAudited + live.meta.wordsAudited + (popular.meta.wordsAudited || 0)) + " WORDS";
    renderProof();
    renderMarquee();
    renderHeroConsole();
    renderCategoryFilters();
    renderHot100();
    renderSoundFilters();
    renderSoundbytes();
    renderCharacterRoster();
    renderCharacter();
    renderLiveProof();
    renderTopicRadar();
    renderStreams();
    renderPopularProof();
    renderPopularTopics();
    renderPopular();
    renderMemory();
    renderControlRoom();
    renderAskExamples();
    renderFranchises();
    renderFranchiseFilters();
    renderVault();
    renderLabs();
    bindPage();
    setBand(state.redBand ? "red" : "bleep", false);

    if (localStorage.getItem("wwam-band")) document.getElementById("contentGate").classList.add("gone");
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInterval(function () {
        state.consoleIndex += 1;
        renderHeroConsole();
      }, 5200);
    }
    var params = new URLSearchParams(location.search);
    if (params.get("tape")) setTimeout(function () { openDossier(params.get("tape"), params.get("at")); }, 50);
    else if (params.get("live")) setTimeout(function () { openLiveDossier(params.get("live"), params.get("at")); }, 50);
    else if (location.hash === "#pitch") setTimeout(openTour, 50);
  }

  init();
})();
