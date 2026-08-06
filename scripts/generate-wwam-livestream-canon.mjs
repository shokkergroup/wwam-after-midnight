import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEMO = path.join(ROOT, "public", "demo");
const METADATA_DIR = path.join(ROOT, "source-cache", "metadata");
const CAPTIONS_DIR = path.join(ROOT, "source-cache", "captions");

function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function loadScript(file) {
  const context = { console };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(DEMO, file), "utf8"), context, { filename: file });
  return context;
}
function clean(value) { return String(value == null ? "" : value).replace(/\s+/g, " ").trim(); }
function words(value) { return clean(value).split(/\s+/).filter(Boolean); }
function collapseRepeatedPhrases(value) {
  const tokens = clean(value).split(/\s+/).filter(Boolean);
  const key = (token) => token.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, "");
  const filler = new Set(["uh", "um", "er", "like"]);
  for (let size = 7; size >= 2; size -= 1) {
    for (let index = 0; index + size * 2 <= tokens.length; index += 1) {
      const left = tokens.slice(index, index + size).map(key);
      const right = tokens.slice(index + size, index + size * 2).map(key);
      if (left.every(Boolean) && left.join("|") === right.join("|")) {
        tokens.splice(index + size, size);
        index = Math.max(-1, index - size);
      } else if (index + size + 1 + size <= tokens.length && filler.has(key(tokens[index + size]))) {
        const bridged = tokens.slice(index + size + 1, index + size + 1 + size).map(key);
        if (left.every(Boolean) && left.join("|") === bridged.join("|")) {
          tokens.splice(index + size, size + 1);
          index = Math.max(-1, index - size);
        }
      }
    }
  }
  return tokens.join(" ");
}
function trimDanglingClause(value) {
  const text = clean(value);
  // A hard public word bound can cut a sentence just after a subordinate
  // clause ("...because I hate."). That is not a caption error we should
  // publish as prose. Keep the complete main clause and let the player carry
  // the rest of the exchange.
  const trimmed = text
    .replace(/\s+(?:because|since|although|while|when|if|which|that|who)\s+(?:i|you|he|she|we|they)\s+[a-z0-9'â€™-]+\s*\.?\s*$/i, "")
    .replace(/\s+(?:because|since|although|while|when|if)\s*\.?\s*$/i, "")
    .replace(/\s+(?:in|on|at|for|with|to|of|from)\s+(?:so|the|a|an|this|that|it|one)\s*\.?\s*$/i, "")
    .trim();
  return trimmed || text;
}
function isLikelyFragment(value) {
  const text = clean(value);
  if (/^(?:no local transcript window aligned|no caption fragment aligned|title signal only|open the source before treating)/i.test(text)) return true;
  if (/\b(?:and|but|or|because|since|although|while|when|if|which|that|who|with|for|to|of|about|using|like|as|all)\.?\s*$/i.test(text)) return true;
  if (/\b(?:can|could|should|would|will|did|does|do|is|are)\s+[a-z][a-z'-]*\.?\s*$/i.test(clean(value))) return true;
  if (/\b(?:that|this|it)\s+(?:makes?|was|is|are|does|did|will|would|could|should|can|have|has|had)\.?\s*$/i.test(clean(value))) return true;
  if (/\b(?:i|you|he|she|we|they)\s+(?:was|were|am|is|are|have|has|had|did|do|does|will|would|could|should|can|makes?)\.?\s*$/i.test(clean(value))) return true;
  if (/\b(?:i'd|i'll|i'm|you're|he's|she's|we're|they're)\s+(?:be|been|being|was|were|am|is|are|have|has|had|did|do|does|will|would|could|should|can)\.?\s*$/i.test(text)) return true;
  if (/\b(?:i|you|he|she|we|they)\s+(?:said|says|told|asked|thought|felt|wanted|tried|made|doing|going)\.?\s*$/i.test(text)) return true;
  if (/\b(?:is|are|was|were|be|been|being|have|has|had|will|would|could|should|can|do|does|did|going|trying|want|wanted|need|needs|got|made|doing|already|yet|again)\.?\s*$/i.test(text)) return true;
  if (/\b(?:i'm|you're|he's|she's|it's|we're|they're|that's|there's|here's|i've|you've|we've|they've)\.?\s*$/i.test(text)) return true;
  if (/\b(?:so|but|and|yeah|well|like)\s*,?\s+(?:so|but|and|yeah|well|like)\b/i.test(text)) return true;
  if ((text.match(/\b(?:so|but|and|yeah|well|like)\b/gi) || []).length >= 3) return true;
  if (/\b(?:hate|love|like|want|need|know|think|believe|feel|see|say|tell|make|put|give|take|get|go|come|told|asked|thought|felt)\.?\s*$/i.test(text)) return true;
  return /\b(?:this|that|it)\s+is\s+(?:a|an|the)\s+[a-z0-9'â€™-]+\.?$/i.test(text)
    || /\b(?:because|since|although|while|when|if|which|that|who)\s+(?:i|you|he|she|we|they)\s+[a-z0-9'â€™-]+\.?$/i.test(text);
}
function sanitizePublicExcerpt(value) {
  let text = clean(value)
    .replace(/^\s*["”]\s*/, "")
    .replace(/\s+([,.!?])/g, "$1")
    // Whisper sometimes leaves a comma/colon before the sentence terminator
    // ("which you guys,."). Keep the words, but make the public receipt
    // read like normal punctuation instead of decoder debris.
    .replace(/[,:;]\s*\.$/, ".")
    .replace(/\s{2,}/g, " ")
    .trim();
  // Caption windows routinely stop inside a quoted sentence. A dangling
  // quote is visual decoder noise, not evidence that a speaker finished the
  // thought. Remove the marker rather than fabricating a closing sentence.
  if ((text.match(/"/g) || []).length % 2 === 1) text = text.replace(/"/g, "");
  const smartOpen = (text.match(/[“]/g) || []).length;
  const smartClose = (text.match(/[”]/g) || []).length;
  if (smartOpen !== smartClose) text = text.replace(/[“”]/g, "");
  return text
    .replace(/\b(said|says|asked|asks|was like|were like|be like)\s*,\s+(?=[A-Z])/i, "$1: ")
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}
function excerpt(value, limit = 20) {
  const tokens = words(String(value).replace(/\s*\n\s*/g, " "));
  return tokens.length <= limit ? tokens.join(" ") : `${tokens.slice(0, limit).join(" ")}...`;
}
function quoteExcerpt(value, limit = 22) {
  const text = clean(value);
  const boundedSentence = (sentence) => {
    const sentenceWords = words(sentence);
    if (sentenceWords.length <= limit) return sentence.trim();
    const clippedSentence = trimDanglingClause(sentenceWords.slice(0, limit).join(" "))
      .replace(/\s+(?:the|a|an|and|or|but|to|of|in|on|for|with|from|that|this|it|i|you|he|she|we|they)$/i, "")
      .trim();
    return /[.!?]$/.test(clippedSentence) ? clippedSentence : `${clippedSentence}.`;
  };
  // Captions often splice speaker markers or bracketed sound cues directly
  // after punctuation ("that. >> Yeah" / "that. [laughter]"). Split on a
  // punctuation boundary followed by a plausible sentence starter instead of
  // requiring a plain whitespace-only boundary. This preserves the first
  // substantive sentence rather than falling through to a punctuation-free
  // token slice that reads like decoder sludge.
  const sentenceList = text.match(/[^.!?]+[.!?](?=\s*(?:>>\s*)?[A-Z0-9"'“‘])/g)?.map((sentence) => sentence.trim()) || [];
  const substantive = sentenceList.filter((sentence) => {
    const adminOnly = /\b(?:streamyard|chat|internet|subscribe|microphone|camera|technical|screen|audio|live chat|can you see|are we live)\b/i.test(sentence)
      && !/\b(?:fuck|fucking|shit|dick|ass|bitch|suck|horror|halloween|loomis|challis|freddy|jason|scream|terrifier|michael|movie|kill|dead|garbage|poop)\b/i.test(sentence);
    return words(sentence).length >= 8 && !adminOnly && !isLikelyFragment(sentence);
  }).sort((left, right) => excerptQuality(right) - excerptQuality(left))[0];
  if (substantive && excerptQuality(substantive) >= 5) return boundedSentence(substantive);
  const sentence = sentenceList.filter((candidate) => words(candidate).length >= 4 && !isLikelyFragment(candidate))
    .sort((left, right) => excerptQuality(right) - excerptQuality(left))[0];
  if (sentence) return boundedSentence(sentence);
  const tokens = words(text);
  if (tokens.length <= limit) return tokens.join(" ");
  const clipped = tokens.slice(0, limit).join(" ")
    .replace(/\s+(?:the|a|an|and|or|but|to|of|in|on|for|with|from|that|this|it|i|you|he|she|we|they)$/i, "")
    .trim();
  const bounded = trimDanglingClause(clipped || tokens.slice(0, limit).join(" "));
  return /[.!?]$/.test(bounded) ? bounded : `${bounded}.`;
}
// Public receipts should read like bounded doors, not raw decoder fragments.
// Keep the underlying ledger untouched for evidence while applying one
// sentence-safe cleanup path to moments, fan cues, character cues, and topic
// shelves.
function safeExcerpt(value, limit = 20) {
  const normalized = normalizeCaptionText(value)
    .replace(/(?:\s*\.{3,}|\u2026)\s*$/g, "")
    .trim();
  // The public transcript policy is intentionally tighter than the internal
  // ledger. Sixteen words is enough to identify the bit while preventing a
  // raw Whisper paragraph from becoming a wall of run-on text in the UI.
  const publicLimit = Math.min(16, Math.max(8, Number(limit) || 20));
  const publicWindow = words(normalized).slice(0, publicLimit).join(" ");
  if (!/[.!?](?:\s|$)/.test(publicWindow)) return "";
  const text = quoteExcerpt(normalized, publicLimit)
    .replace(/(?:\s*\.{3,}|\u2026)\s*$/g, "")
    .trim();
  if (!text) return "";
  let cased = `${text.charAt(0).toUpperCase()}${text.slice(1)}`
    .replace(/\bi\b/g, "I")
    .replace(/\s*>>\s*/g, "")
    .replace(/(?:\.{3,}|\u2026)/g, ".")
    .replace(/\s{2,}/g, " ")
    .trim();
  for (let pass = 0; pass < 3; pass += 1) {
    cased = cased.replace(/\b([A-Za-z0-9][A-Za-z0-9'-]*)\s+([A-Za-z0-9][A-Za-z0-9'-]*)\s+\1\s+\2\b/gi, "$1 $2");
  }
  cased = cased.replace(/^(?:uh|um|er|like)\s*[,.]?\s+/i, "");
  const casedWords = words(cased);
  const fillerCount = (cased.match(/\b(?:uh|um|er|like|you know|i mean)\b/gi) || []).length;
  if (casedWords.length >= 8 && fillerCount >= 3 && fillerCount / casedWords.length >= 0.18) return "";
  if (/[,.]\s*\.$/.test(cased)) return "";
  cased = trimDanglingClause(cased);
  cased = sanitizePublicExcerpt(cased);
  if (isLikelyFragment(cased)) return "";
  if (isNoisyTranscript(cased)) return "";
  if (excerptQuality(cased) <= 5) return "";
  return /[.!?]$/.test(cased) ? cased : `${cased}.`;
}
function dateFrom(value) {
  const text = clean(value);
  return /^\d{8}$/.test(text) ? `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}` : text || null;
}
function clock(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}
function normalizeCaptionText(value) {
  let text = clean(value).replace(/\[(?:\s*[_-]+\s*)+\]/g, " ")
    .replace(/\[(?:music|applause|laughter|laughs?|screaming|yelling|shouting|inaudible|bleep|snorts?|coughs?|sighs?|gasps?|crying|breathing|clears?\s+throat|chuckles?)\]/gi, " ")
    .replace(/[_]+/g, " ")
    .replace(/[»>]{1,3}(?=\s)/g, " ")
    .replace(/â€™/g, "'").replace(/â€œ|â€/g, '"').replace(/â€”|â€“/g, "—")
    .replace(/\s+([,.!?])/g, "$1")
    // Normalize UTF-8/Windows-1252 quote artifacts before the public
    // receipt filters see the caption window.
    .replace(/\u00e2\u20ac\u2122/g, "'")
    .replace(/\u00e2\u20ac\u0153|\u00e2\u20ac\u009c|\u00e2\u20ac\u009d/g, '"')
    .replace(/\u00e2\u20ac\u2014|\u00e2\u20ac\u0094/g, "—")
    .replace(/\s{2,}/g, " ").trim();
  // Whisper and automatic captions occasionally stutter the same token over
  // several adjacent segments. Keep a genuine repeated phrase, but collapse
  // obvious decoder runs before the text reaches a visitor-facing card.
  for (let pass = 0; pass < 4; pass += 1) {
    text = text.replace(/\b([A-Za-z][A-Za-z'’-]*)\b(?:\s+\1\b){3,}/gi, "$1 $1");
  }
  // Whisper can leave a two-token decoder stutter in a bounded window. Keep
  // the audio as the authority, but collapse the obvious duplicate before a
  // transcript line is promoted into visitor-facing prose.
  text = text.replace(/\b([A-Za-z][A-Za-z'-]*)\b(?:\s+\1\b)+/gi, "$1");
  // A second common stutter repeats a short phrase rather than one token
  // ("there was there was", "not only not only"). Collapse only an exact
  // adjacent pair so intentional emphasis elsewhere remains intact.
  for (let pass = 0; pass < 3; pass += 1) {
    text = text.replace(/\b([A-Za-z0-9][A-Za-z0-9'-]*)\s+([A-Za-z0-9][A-Za-z0-9'-]*)\s+\1\s+\2\b/gi, "$1 $2");
  }
  text = collapseRepeatedPhrases(text);
  return text.replace(/\s{2,}/g, " ").trim();
}
function automaticCaptionEvents(id) {
  const file = path.join(CAPTIONS_DIR, `${id}.json`);
  if (!fs.existsSync(file)) return [];
  const payload = readJson(file);
  return (payload.events || []).filter((event) => Array.isArray(event.segs) && event.segs.length)
    .map((event) => ({
      t: Math.max(0, Number(event.tStartMs || 0) / 1000),
      end: Math.max(0, Number(event.tStartMs || 0) / 1000 + Number(event.dDurationMs || 0) / 1000),
      text: normalizeCaptionText(event.segs.map((segment) => segment && segment.utf8 || "").join("")),
      evidenceType: "youtube-automatic-caption",
    })).filter((event) => event.text);
}
function needsAutomaticRepair(events) {
  if (!events.length) return true;
  // Local Whisper is the evidence authority. Only reopen the much larger
  // automatic-caption corpus when the local ledger is sparse or contains a
  // meaningful share of visibly noisy windows that could benefit from a
  // time-aligned repair candidate.
  const sample = events.slice(0, Math.min(events.length, 48));
  const weak = sample.filter((event) => {
    const text = clean(event.text);
    return words(text).length < 3 || isNoisyTranscript(text) || !/[.!?]/.test(text);
  }).length;
  return events.length < 12 || weak / sample.length >= 0.2;
}
function captionEvents(id) {
  const asrFile = path.join(CAPTIONS_DIR, `${id}.asr.json`);
  if (fs.existsSync(asrFile)) {
    const payload = readJson(asrFile);
    const asrEvents = (payload.segments || [])
      .map((segment) => ({
        t: Math.max(0, Number(segment.start || 0)),
        end: Math.max(0, Number(segment.end || segment.start || 0)),
        text: normalizeCaptionText(segment.text),
        evidenceType: "local-whisper-transcript"
      }))
      .filter((event) => event.text);
    const automatic = needsAutomaticRepair(asrEvents) ? automaticCaptionEvents(id) : [];
    // Keep the local Whisper line as the evidence authority, but retain a
    // time-aligned automatic-caption window as a repair candidate when the
    // Whisper decoder stutters or drops a short phrase. This is not mixed
    // provenance: the public card still labels the route as local Whisper.
    if (!automatic.length) return asrEvents;
    // Both tracks are chronological. A moving cursor turns the old
    // event-times-caption-events scan into a linear merge while preserving
    // the exact nearest-window choice for every Whisper segment.
    let nearest = 0;
    return asrEvents.map((event) => {
      const target = Number(event.t || 0);
      while (nearest + 1 < automatic.length) {
        const currentDistance = Math.abs(Number(automatic[nearest]?.t || 0) - target);
        const nextDistance = Math.abs(Number(automatic[nearest + 1]?.t || 0) - target);
        if (nextDistance > currentDistance) break;
        nearest += 1;
      }
      return { ...event, fallbackText: captionWindow(automatic, nearest) };
    });
  }
  return automaticCaptionEvents(id);
}
function captionWindow(events, index, before = 5, after = 12, field = "text") {
  const anchor = events[index];
  if (!anchor) return "";
  const lines = [];
  for (let cursor = Math.max(0, index - 3); cursor <= Math.min(events.length - 1, index + 5); cursor += 1) {
    const event = events[cursor];
    if (event.t < anchor.t - before || event.t > anchor.t + after) continue;
    if (lines.length && event.t - events[cursor - 1].t > 6) continue;
    lines.push(event[field] || (field === "fallbackText" ? "" : event.text));
  }
  const deduped = [];
  lines.join(" ").split(/\s+/).forEach((token) => {
    if (token && (!deduped.length || deduped.at(-1).toLowerCase() !== token.toLowerCase())) deduped.push(token);
  });
  return deduped.join(" ");
}
function captionFragments(events, index, before = 5, after = 12, field = "text") {
  const anchor = events[index];
  if (!anchor) return [];
  const nearby = [];
  for (let cursor = Math.max(0, index - 3); cursor <= Math.min(events.length - 1, index + 5); cursor += 1) {
    const event = events[cursor];
    if (event.t < anchor.t - before || event.t > anchor.t + after) continue;
    if (nearby.length && event.t - events[cursor - 1].t > 6) continue;
    const text = clean(event[field] || (field === "fallbackText" ? "" : event.text));
    if (text) nearby.push({ event, text });
  }
  const fragments = [captionWindow(events, index, before, after, field)];
  nearby.forEach((item) => fragments.push(item.text));
  for (let cursor = 0; cursor < nearby.length - 1; cursor += 1) {
    if (nearby[cursor + 1].event.t - nearby[cursor].event.t <= 6) {
      fragments.push(`${nearby[cursor].text} ${nearby[cursor + 1].text}`);
    }
  }
  return Array.from(new Set(fragments.map(clean).filter(Boolean)));
}
function captionWindowAt(events, seconds, maxDistance = 42, field = "text") {
  if (!events.length) return "";
  let nearest = 0;
  let distance = Infinity;
  events.forEach((event, index) => {
    const nextDistance = Math.abs(Number(event.t || 0) - Number(seconds || 0));
    if (nextDistance < distance) {
      nearest = index;
      distance = nextDistance;
    }
  });
  // A bounded Whisper ledger intentionally skips long quiet stretches. Do
  // not borrow a sentence from the nearest unrelated window just to fill a
  // card; that creates the same misleading caption drift we are removing.
  if (distance > maxDistance) return "";
  if (field === "fallbackText") return clean(events[nearest]?.fallbackText || "");
  return captionWindow(events, nearest, 5, 12, field);
}
function excerptQuality(value) {
  const text = clean(value);
  if (!text || /^(?:no local transcript window aligned|no caption fragment aligned|title signal only)/i.test(text)) return -100;
  const tokenCount = words(text).length;
  let score = Math.min(18, tokenCount);
  if (/[.!?]$/.test(text)) score += 5;
  if (/[,.]\s*\.$/.test(text)) score -= 8;
  if (/\b(?:uh|um|er|like|you know|i mean)\b/gi.test(text)) score -= 1;
  if (/\b(?:i|you|we|they|he|she)\b(?:\s+[a-z'-]+){0,6}\s+\b(?:i|you|we|they|he|she)\b/i.test(text)) score -= 10;
  if (/\b(?:the|a|an)\s+(?:the|a|an)\b/i.test(text)) score -= 8;
  if (/\b(?:the|a|an)\s+(?:pause|movie|film|show|thing)\s+the\b/i.test(text)) score -= 10;
  if (/\b(?:better never|never if|if they put)\b/i.test(text)) score -= 12;
  if (/\b(?:so|but|and|yeah|well|like)\s*,?\s+(?:so|but|and|yeah|well|like)\b/i.test(text)) score -= 12;
  if (/^(?:and then|then|someone says|somebody says)\b/i.test(text)) score -= 12;
  if (/\b(?:welcome to|hello|hi there|hey there)\b/i.test(text)) score -= 8;
  if (/\b(?:says|asks|asked)\s*[,:]?\s*["“]/i.test(text)) score -= 6;
  if (tokenCount <= 4 && !/\b(?:fuck|shit|ass|dick|bitch|horror|movie|film|love|hate|terrible|great)\b/i.test(text)) score -= 4;
  return score;
}
function isNoisyTranscript(value) {
  const text = clean(value);
  return [
    /\b(?:he|she|it|they|we|you|i)(?:'s|'re|'m)?\s+(?:a|an|the)\s+(?:all|by|with|to|from)\b/i,
    /\b(?:want to|trying to|going to)\s+(?:your|my|his|her|their)\b/i,
    /\b(?:from their pov, from their|getting woke with the|nonp prejudice|is ruth)\b/i,
    /\b(?:and|but|so)\s+(?:he|she|they|we|it)\s+(?:up|down|out|off)\s+(?:that|the)\b/i,
    /\b(?:like|so|yeah|well)\b.*\b(?:like|so|yeah|well)\b.*\b(?:like|so|yeah|well)\b/i,
    /\b(?:do you do|the both of you|i just don't i|the just the|i saw it in the just the)\b/i,
    // Decoder clause collisions can look grammatical word-by-word while
    // splicing two competing starts together ("I hate this is the To me").
    // Keep the audio route, but do not promote the stitched text as a quote.
    /\b(?:this|that|it)\s+is\s+the\s+(?:to|for)\s+me\b/i,
    /\b(?:i|you|he|she|we|they)\s+(?:hate|love|like)\s+(?:this|that|it)\s+is\s+the\b/i,
    // Adjacent pronouns followed by a fresh clause start are a strong
    // boundary-splice signal ("you I don't", "I You got"). Keep the softer
    // conversational "we, I mean" form eligible for publication.
    /\b(?:i|you|he|she|we|they)\s+(?:i|you|he|she|we|they)\s+(?:don't|can't|won't|didn't|haven't|hasn't|am|is|are|was|were|thought|got|just)\b/i,
    // Whisper sometimes preserves the capitalization of two competing
    // sentence starts: "I If...", "I What...", or "I You...". Those are
    // high-confidence boundary splices, not a reason to publish a quote.
    /\bI\s+(?:if|what|well|you|she|it|they|he|we)\b/,
    // Three competing negative starts in one bounded receipt are decoder
    // overlap, not a useful sentence. Preserve the listening door instead.
    /\b(?:i|you|he|she|we|they)\s+(?:don't|can't|won't|didn't)\b(?:\s+[a-z']+){0,3}\s+\b(?:i|you|he|she|we|they)\s+(?:don't|can't|won't|didn't)\b(?:\s+[a-z']+){0,3}\s+\b(?:i|you|he|she|we|they)\s+(?:don't|can't|won't|didn't)\b/i,
    /\b(?:between\d|what the do|i'm not it's not|he never got a chance.*never|top\s*\.)\b/i,
    // Low-confidence decoder joins that look grammatical one word at a time
    // but read as a broken caption on the page ("the step the way", "the
    // truck wash the bathroom", "What the Who..."). Keep the timestamped
    // door; suppress the false promise of a clean quotation.
    /\b(?:the|a|an)\s+[a-z][a-z'-]*\s+(?:the|a|an)\s+[a-z][a-z'-]*\b/i,
    /\b(?:what|who)\s+the\s+(?:who|what|is|the)\b/i,
    /\b(?:got|have|has|was|were|is|are)\s+to\s+(?:this|that)\s+[a-z][a-z'-]*\s+(?:up|down)\b/i,
    /^\s*(?:i|you|we|they|he|she)\s+maybe\b/i,
    /\b(?:between|because|since|although|while|when|if|which|that|who|from|with|for|to|of|in|on|at|by|probably|perhaps|maybe)\.?$/i,
    // A lower-case restart after punctuation and a repeated word stem are
    // common decoder boundary artifacts ("... January. hey ...", "reach
    // reaches"). They are useful audio routes, not clean public quotes.
    /[.!?]\s+[a-z]/,
    /\b([a-z]{4,})(?:s|es|ed|ing)?\s+\1(?:s|es|ed|ing)?\b/i,
    /\b(?:the|a|an)\s+(?:his|her|their|my|your|our|its)\b/i,
    /\b(?:all|both|three)\s+(?:of\s+)?those\s+that\s+right\b/i,
    /\b(?:these|those)\s+(?:this|that)\s+(?:one|right|is|was)\b/i,
    /\bthat(?:'s|\s+is)\s+not\s+that\s+one(?:'s|\s+is)\b/i,
    /\b(?:these|those)\s+and\s+these\s+this\b/i,
    /\b(?:the|a|an)\s+(?:that|this)\b/i,
    /\b(?:said|says|asked|asks|was like|were like|be like)\s*[,;:]\s*["']?\s*$/i,
    /\b(?:uh|um|er|like)[,.]?\s+(?:uh|um|er|like)[,.]?\s+(?:uh|um|er|like)\b/i,
    // Two decoder hypotheses can leave duplicated filler or a stacked verb
    // behind ("uh um ...", "my car is has ..."). Those fragments are useful
    // as audio doors only; they are not safe visitor-facing quotations.
    /\b(?:uh|um|er)\s+(?:uh|um|er)\b/i,
    /\b(?:is|are|was|were)\s+(?:is|are|was|were|has|have)\b/i,
    /\b([a-z]{2,})\s+(?:is|are|was|were)\s+(?:a|an|the)\s+\1\b/i,
    /\b([a-z]{2,})\s+(?:is|are|was|were)\s+\1\b/i,
    /\b(?:like|just)\s+(?:like|just)\b/i,
    /\b(?:it|this|that)\s+(?:is|was|are|were|like)\s+(?:it|this|that)\b/i,
    /\b(?:is|are|was|were),\s+(?:is|are|was|were)\b/i,
    /\b(?:is|are|was|were)\s+(?:the|a|an)\s+(?:is|are|was|were|it|that|this)\b/i,
    /\b(?:don't|never|ever|always)\s+(?:you|we|they|he|she|i)\s+[A-Za-z][^.!?]*\s+(?:again|but|and)\b/i,
    /\b(?:he|she|it|they|we|you|i)(?:'s|\s+is|\s+are|\s+was|\s+were)\s+[A-Z][a-z'-]+\s+(?:but|and|so)\b/,
    // A bounded window can glue a new clause onto the previous one.
    /\blook at\s+(?:his|her|the)\s+look at\b/i,
    /\b(?:it's got|it has)\s+(?:we got|we have|they got|they have)\b/i,
    /\b(?:that's|there's|it's)\s+(?:just|one|the)\s+(?:that's|there's|it's)\b/i,
    /\bbefore\b[^.!?]{0,50}\bbefore\s+(?:just|you|we|i)\b/i,
    /\b[A-Z][a-z]+,\s+[A-Z]{3,}\b/,
    /\b(?:oh|he|hey)\s+(?:he|hey)\s+(?:hey|he)\b/i,
  ].some((pattern) => pattern.test(text));
}
function isWeakPublicReceipt(value) {
  const text = clean(value);
  return !text || /[,.]\s*\.$/.test(text) || isNoisyTranscript(text);
}
function bestCaptionExcerpt(primary, fallback, limit = 24) {
  const expand = (value) => Array.isArray(value) ? value : [value];
  const candidates = [...expand(primary), ...expand(fallback)].map((value) => safeExcerpt(value, limit)).filter((value) => !isWeakPublicReceipt(value));
  if (!candidates.length) return "";
  return candidates.slice().sort((left, right) => excerptQuality(right) - excerptQuality(left) || words(right).length - words(left).length)[0];
}
function captionExcerptAt(events, seconds, limit = 24) {
  const primaryIndex = events.reduce((best, event, index) => Math.abs(Number(event.t || 0) - Number(seconds || 0)) < Math.abs(Number(events[best]?.t || 0) - Number(seconds || 0)) ? index : best, 0);
  const distance = events.length ? Math.abs(Number(events[primaryIndex]?.t || 0) - Number(seconds || 0)) : Infinity;
  if (distance > 42) return "";
  const primary = captionFragments(events, primaryIndex, 5, 12, "text");
  const fallback = captionFragments(events, primaryIndex, 5, 12, "fallbackText");
  return bestCaptionExcerpt(primary, fallback, limit);
}
function refreshMachineMomentExcerpt(moment, events) {
  if (!events.length || moment?.reviewStatus === "full-tape-human-editorial-read") return moment;
  const localExcerpt = captionExcerptAt(events, moment.t, 24);
  const localWhisper = events.some((event) => event.evidenceType === "local-whisper-transcript");
  return {
    ...moment,
    excerpt: localExcerpt || "No local transcript window aligned; open the player at this timestamp.",
    evidenceBasis: localWhisper ? "source-local Whisper transcript alignment" : "source-local automatic caption alignment",
    reviewStatus: "machine-candidate"
  };
}
function refreshArchiveSummary(value, localWhisper) {
  const text = clean(value);
  if (!localWhisper || !text) return text;
  return text
    .replace(/Automatic captions support/gi, "The local Whisper transcript supports")
    .replace(/caption map/gi, "transcript map");
}
function topicAnchor(events, term) {
  const pattern = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&").replace(/\\s+/g, "\\s+")}\\b`, "i");
  const hits = events.map((event, index) => ({ event, index })).filter(({ event }) => pattern.test(event.text));
  if (!hits.length) return null;
  const peak = hits.slice().sort((a, b) => b.event.text.length - a.event.text.length || a.event.t - b.event.t)[0];
  const rawReceipt = captionWindow(events, peak.index);
  const fallbackReceipt = captionWindow(events, peak.index, 5, 12, "fallbackText");
  return { name: term, mentions: hits.length, first: hits[0].event.t, peak: peak.event.t, cluster: Math.min(24, hits.length), rawReceipt, receipt: bestCaptionExcerpt(rawReceipt, fallbackReceipt, 20), at: Math.round(peak.event.t) };
}

const metadata = fs.readdirSync(METADATA_DIR).filter((file) => file.endsWith(".json")).map((file) => readJson(path.join(METADATA_DIR, file)));
const catalog = loadScript("catalog.js").WWAM_CATALOG || [];
const atlas = loadScript("archive-atlas-data.js").WWAM_ARCHIVE_ATLAS || { records: [] };
const completion = loadScript("archive-completion.js").WWAM_ARCHIVE_COMPLETION || { streams: [] };
const deep = loadScript("archive-deep-distill.js").WWAM_ARCHIVE_DEEP || { streams: [] };
const fresh = loadScript("livestream-distill.js").WWAM_LIVESTREAMS || { streams: [] };
const yearCanon = loadScript("year-canon-2025-2026.js").WWAM_YEAR_CANON_2025_2026 || { streams: [] };
const watchPilot = loadScript("wwam-watch-pass-pilot.js").WWAM_WATCH_PASS_PILOT || { episodes: {} };
const editorialPackById = new Map();
function mergeEditorialPacks(previous, incoming) {
  if (!previous) return incoming;
  const highlights = [...(previous.highlights || []), ...(incoming.highlights || [])];
  const seenAt = new Set();
  const uniqueHighlights = highlights.filter((item) => {
    const key = String(item?.at ?? "");
    if (!key || seenAt.has(key)) return false;
    seenAt.add(key);
    return true;
  }).sort((left, right) => Number(left?.at || 0) - Number(right?.at || 0));
  const story = (previous.story?.length || 0) > (incoming.story?.length || 0)
    ? previous.story
    : incoming.story;
  return {
    ...previous,
    ...incoming,
    evidence: { ...(previous.evidence || {}), ...(incoming.evidence || {}), localAudioPass: incoming.evidence?.audioPass },
    story,
    highlights: uniqueHighlights,
    fanRead: { ...(previous.fanRead || {}), ...(incoming.fanRead || {}) },
  };
}
for (const file of fs.readdirSync(DEMO).filter((name) => /^episode-editorial-packs(?:-recent|-wave\d+)?\.js$/.test(name))) {
  const registry = loadScript(file).WWAM_EPISODE_EDITORIAL_PACKS || { sources: {} };
  for (const [sourceId, pack] of Object.entries(registry.sources || {})) {
    if (pack && pack.sourceId === sourceId && pack.reviewState === "full-tape-human-editorial-read") {
      editorialPackById.set(sourceId, mergeEditorialPacks(editorialPackById.get(sourceId), pack));
    }
  }
}
const livestreamAudio = fs.existsSync(path.join(DEMO, "wwam-livestream-audio-pass.js"))
  ? loadScript("wwam-livestream-audio-pass.js").WWAM_LIVESTREAM_AUDIO_PASS || { episodes: {}, coverage: null }
  : { episodes: {}, coverage: null };
const livestreamRssAudio = fs.existsSync(path.join(DEMO, "wwam-livestream-rss-audio-pass.js"))
  ? loadScript("wwam-livestream-rss-audio-pass.js").WWAM_LIVESTREAM_RSS_AUDIO_PASS || { records: {} }
  : { records: {} };
// source-cache/metadata is shared with the watchalong audio acquisition lane.
// Keep the livestream registry source-bounded: the official atlas plus the
// original catalog are allowed in; newly acquired movie-commentary metadata
// must not silently turn into livestream episodes just because it exists
// locally. This preserves the existing 509-source livestream contract while
// the watchalong registry grows independently.
const atlasById = new Map((atlas.records || []).map((record) => [record.id, record]));
const completionById = new Map((completion.streams || []).map((record) => [record.id, record]));
const deepById = new Map((deep.streams || []).map((record) => [record.id, record]));
const freshById = new Map((fresh.streams || []).map((record) => [record.id, record]));
const yearCanonById = new Map((yearCanon.streams || []).map((record) => [record.id, record]));
const livestreamAllowIds = new Set([
  ...atlasById.keys(),
  ...catalog.map((record) => record.id),
]);
const canonicalMetadata = metadata.filter((record) => livestreamAllowIds.has(record.id));

const TOPIC_TERMS = [
  "Halloween", "Scream", "Friday the 13th", "A Nightmare on Elm Street", "Chucky", "Child's Play", "Michael Myers", "Freddy", "Jason", "Batman", "Marvel", "DC", "Superman", "Alien", "Predator", "Evil Dead", "Hellraiser", "Texas Chainsaw", "The Conjuring", "Terrifier", "Saw", "Mortal Kombat", "Ghostbusters", "Star Wars", "Jurassic", "Trailers", "Streaming", "Box Office", "Retro Rewind", "Rankings & Lists", "Horror", "Comedy", "Video Games", "Halloween Ends", "Scream 7", "Feldman", "Loomis", "Challis", "Slenderman"
];
const LANE_DEFS = [
  { key: "up-in-ya", label: "WWAM UP IN YA", pattern: /\b(fuck|fucking|dick|cock|balls?|cum|fart|shit|bitch|piss|boob|tits?|asshole|suck|boner|poop)\b/i },
  { key: "steves-asshole", label: "STRAIGHT TO STEVE'S ASSHOLE", pattern: /\b(hate|hated|worst|terrible|awful|sucks?|stupid|dumb|bullshit|garbage|lazy|weak|ruined|don't like|didn't like|not good)\b/i },
  { key: "room-breaks", label: "THE ROOM BREAKS", pattern: /\b(laugh|laughter|hilarious|funny|crying|dying|oh my god|what the fuck|no way)\b/i },
  { key: "character", label: "CHARACTER SIGNAL", pattern: /\b(loomis|chall[ie]s|slenderman|corey feldman|feldman|michael myers|freddy|jason|chucky|tiffany)\b/i },
  { key: "fan", label: "FAN SIGNAL", pattern: /super\s*chat|\bdonat(?:e|ed|ion)\b|lee(?:\s+the)?\s+machine|michael\s+part(?:on|in)|chat(?:'s| is) asking|question from (?:the )?chat|(?:thanks|welcome|appreciate|thank you).{0,45}(?:member|membership)|(?:new|another|our) member|(?:member|membership).{0,45}(?:joined|join|thanks|thank|gift)/i },
  { key: "take", label: "TAKE GETS NUCLEAR", pattern: /\b(obviously|literally|never|always|worst|best|greatest|insane|ridiculous|unacceptable|wrong|right|point blank|period)\b/i },
];
const CHARACTER_DEFS = [
  { key: "loomis", name: "Dr. Loomis", pattern: /\b(?:dr\.?\s*)?loomis\b/i },
  { key: "challis", name: "Dr. Challis", pattern: /\b(?:dr\.?\s*)?chall[ie]s\b/i },
  { key: "slenderman", name: "Slenderman", pattern: /\bslender\s*man\b/i },
  { key: "feldman", name: "Corey Feldman", pattern: /\b(?:corey\s+feldman|feldman)\b/i },
  { key: "myers", name: "Michael Myers", pattern: /\bmichael\s+myers\b/i },
  { key: "freddy", name: "Freddy Krueger", pattern: /\b(?:freddy(?:\s+krueger)?|krueger)\b/i },
  { key: "jason", name: "Jason Voorhees", pattern: /\bjason\s+voorhees\b/i },
  { key: "chucky", name: "Chucky", pattern: /\bchucky\b|\bchild['’]?s\s+play\b/i },
  { key: "ghostface", name: "Ghostface", pattern: /\bghostface\b/i },
  { key: "pleasence", name: "Donald Pleasence", pattern: /\bdonald\s+pleasence\b|\bpleasence\b/i },
  { key: "rob-zombie", name: "Rob Zombie", pattern: /\brob\s+zombie\b/i },
  { key: "leatherface", name: "Leatherface", pattern: /\bleatherface\b/i },
];
const RESTRICTED_MODES = new Set(["trailer-reaction", "source-video-watch-party"]);

function inferMode(title) {
  const text = clean(title);
  if (/commentary|watch\s*(party|along)|watchalong/i.test(text)) return /watch\s*(party|along)/i.test(text) ? "source-video-watch-party" : "movie-commentary";
  if (/trailer|teaser|breakdown/i.test(text)) return "trailer-reaction";
  if (/tier list|rank(?:ed|ing)?|bracket|versus|\bvs\.?\b|royal rumble|friday night fight/i.test(text)) return "ranking-show";
  if (/q\s*&?\s*a|questions|50 million views/i.test(text)) return "q-and-a";
  if (/interview|with (?:director|writer|actor|guest)|director .+\+|writer .+\+/i.test(text)) return "interview";
  if (/spoiler|review party/i.test(text)) return "spoiler-review";
  if (/review|movie reviews?/i.test(text)) return "review-show";
  if (/game|gaming|play(?:ing)? scary|video store/i.test(text)) return "special-event";
  if (/live|stream|movie news|we watched a movie/i.test(text)) return "livestream";
  return "special-event";
}
function inferSeries(title, mode) {
  const text = clean(title).toLowerCase();
  if (/friday night fight/.test(text)) return { key: "friday-night-fights", label: "Friday Night Fights" };
  if (/retro rewind|video store/.test(text)) return { key: "retro-rewind", label: "Retro Rewind" };
  if (/commentary|watch\s*(party|along)|watchalong/.test(text)) return { key: "watchalongs", label: "Movie Watchalongs" };
  if (/trailer|teaser|breakdown/.test(text)) return { key: "trailer-desk", label: "Trailer Desk" };
  if (/tier list|rank|bracket|versus|\bvs\.?\b|royal rumble/.test(text)) return { key: "ranking-room", label: "Ranking Room" };
  if (/q\s*&?\s*a|questions/.test(text)) return { key: "fan-mail", label: "Fan Mail / Q&A" };
  if (/interview|with (?:director|writer|actor|guest)/.test(text)) return { key: "guest-room", label: "Guest Room" };
  if (mode === "spoiler-review" || mode === "review-show") return { key: "review-desk", label: "Review Desk" };
  return { key: "wwam-live", label: "WWAM Live" };
}
function inferShape(title, mode, existing, yearSnapshot) {
  if (existing?.editorial?.showShape) return existing.editorial.showShape;
  if (yearSnapshot?.editorial?.showShape) return yearSnapshot.editorial.showShape;
  const text = clean(title);
  if (/friday night fights/i.test(text)) return "FIGHT NIGHT";
  if (/retro rewind|video store/i.test(text)) return "VIDEO STORE BUILD NIGHT";
  if (/tier list/i.test(text)) return "TIER-LIST NIGHT";
  if (/bracket|tournament/i.test(text)) return "BRACKET NIGHT";
  if (/trailer|teaser|breakdown/i.test(text)) return "TRAILER EMERGENCY";
  if (/review|spoiler/i.test(text)) return "REVIEW NIGHT";
  if (/movie news|news and more/i.test(text)) return "LIVE NEWS DESK";
  if (mode === "ranking-show") return "RANKING NIGHT";
  if (mode === "movie-commentary") return "MOVIE COMMENTARY";
  if (mode === "q-and-a") return "FAN MAIL";
  return "OPEN-LINE MOVIE NEWS";
}
function derivedTopics(events, title) {
  const titleTerms = TOPIC_TERMS.filter((term) => new RegExp(term.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"), "i").test(title));
  const found = TOPIC_TERMS.map((term) => topicAnchor(events, term)).filter(Boolean);
  const merged = [...found, ...titleTerms.filter((term) => !found.some((item) => item.name === term)).map((term) => ({ name: term, mentions: 0, first: 0, peak: 0, cluster: 0, receipt: "Title signal only; open the source before treating the topic as spoken.", at: 0 }))];
  return merged.sort((a, b) => b.mentions - a.mentions || a.name.localeCompare(b.name)).slice(0, 10);
}
function derivedMoments(events, duration, restricted = false) {
  if (!events.length || restricted) return [];
  const perLane = Math.max(3, Math.round((duration || 1) / 1800));
  const output = [];
  for (const lane of LANE_DEFS) {
    const ranked = events.map((event, index) => ({ event, index, hits: lane.pattern.test(event.text) })).filter((item) => item.hits)
      .sort((a, b) => b.event.text.length - a.event.text.length || a.event.t - b.event.t);
    const picked = [];
    for (const item of ranked) {
      if (picked.length >= perLane) break;
      if (picked.some((other) => Math.abs(other.event.t - item.event.t) < 50)) continue;
      picked.push(item);
    }
    for (const item of picked) output.push({
      id: `${lane.key}-${Math.round(item.event.t)}`, t: Math.round(item.event.t), end: Math.round(item.event.end || item.event.t + 36),
      category: lane.label, label: lane.label, score: Math.min(99, 62 + Math.min(28, words(item.event.text).length)),
      excerpt: bestCaptionExcerpt(captionWindow(events, item.index), captionWindow(events, item.index, 5, 12, "fallbackText"), 24), evidenceBasis: events.some((event) => event.evidenceType === "local-whisper-transcript") ? "source-local Whisper transcript lane cluster" : "source-local automatic caption lane cluster", reviewStatus: "machine-candidate"
    });
  }
  return output.sort((a, b) => a.t - b.t);
}
function mergeTranscriptMoments(primary, transcriptMoments) {
  const merged = [...(primary || [])];
  for (const candidate of transcriptMoments || []) {
    if (merged.some((existing) => Math.abs(Number(existing.t || 0) - Number(candidate.t || 0)) < 28)) continue;
    merged.push(candidate);
  }
  return merged.sort((left, right) => Number(left.t || 0) - Number(right.t || 0));
}
function fanSignals(events, duration) {
  const lane = LANE_DEFS.find((item) => item.key === "fan");
  const ranked = events.map((event, index) => ({ event, index })).filter((item) => lane.pattern.test(item.event.text));
  const evidenceBasis = events.some((event) => event.evidenceType === "local-whisper-transcript")
    ? "source-local Whisper transcript fan-callout cluster"
    : "source-local automatic caption fan-callout cluster";
  const max = Math.max(3, Math.round((duration || 1) / 1800) + 2);
  const picked = [];
  ranked.forEach((item) => {
    if (picked.length >= max || picked.some((other) => Math.abs(other.event.t - item.event.t) < 55)) return;
    picked.push(item);
  });
  return picked.map((item) => {
    const sourceExcerpt = bestCaptionExcerpt(captionWindow(events, item.index), captionWindow(events, item.index, 5, 12, "fallbackText"), 24);
    const identity = fanIdentity(sourceExcerpt) || fanIdentity(item.event.text);
    return { id: `fan-${Math.round(item.event.t)}`, t: Math.round(item.event.t), end: Math.round(item.event.end || item.event.t + 36), category: "FAN SIGNAL", label: "FAN SIGNAL", signalType: fanSignalType(item.event.text), fanEntity: identity?.key || null, fanEntityLabel: identity?.label || null, fanEntityMatch: identity?.match || null, fanIdentityBasis: identity?.identityBasis || null, score: 78, excerpt: sourceExcerpt, evidenceBasis, reviewStatus: "machine-candidate" };
  });
}
function fanSignalType(text) {
  const value = clean(text);
  if (/lee(?:\s+the)?\s+machine/i.test(value)) return "LEE THE MACHINE CUE";
  if (/michael\s+part(?:on|in)/i.test(value)) return "MICHAEL PARTON/PARTIN CUE";
  if (/super\s*chat|donat(?:e|ed|ion)/i.test(value)) return "SUPER CHAT / DONATION CUE";
  if (/member|membership/i.test(value)) return "MEMBERSHIP CUE";
  return "CHAT / FAN CALLOUT";
}
// Captions reduce names to nicknames or flip a surname. Keep this alias map
// explicit and small so the Fam Hall is useful without becoming an identity or
// donation ledger.
function fanIdentity(text) {
  const value = clean(text);
  if (/\blee(?:\s+the)?\s+machine\b|\blee\s+bowers\b/i.test(value)) {
    return { key: "lee-the-machine", label: 'Lee "The Machine" Bowers', match: "Lee / The Machine / Bowers", identityBasis: "explicit WWAM alias map + caption cue" };
  }
  if (/\bmichael\s+part(?:on|in)\b/i.test(value)) {
    return { key: "michael-parton-partin", label: "Michael Parton / Partin", match: "Parton / Partin", identityBasis: "caption surname-variant cue; spelling remains unresolved" };
  }
  return null;
}
function laneLabelMatches(value, laneLabel) {
  const candidate = canonicalLaneLabel(value).toLowerCase();
  const lane = canonicalLaneLabel(laneLabel).toLowerCase();
  if (candidate === lane) return true;
  const aliases = { "wwam up in ya": "up in ya" };
  return aliases[lane] === candidate;
}
function canonicalLaneLabel(value) {
  const label = clean(value);
  if (/^(?:the )?room breaks?$/i.test(label)) return "THE ROOM BREAKS";
  if (/^(?:wwam )?up in ya$/i.test(label)) return "WWAM UP IN YA";
  return label;
}
function recurringBits(events, moments, fan, duration, listeningRoutes = []) {
  const receiptLimit = Math.max(6, Math.round((duration || 1) / 450));
  const eventEvidenceBasis = events.some((event) => event.evidenceType === "local-whisper-transcript")
    ? "source-local Whisper transcript lane cue"
    : "source-local automatic caption lane cue";
  return LANE_DEFS.map((lane) => {
    const hits = lane.key === "fan"
      ? fan.map((signal) => ({ t: signal.t, end: signal.end, text: signal.excerpt, index: -1, signalType: signal.signalType }))
      : events.map((event, index) => ({ event, index, t: event.t, end: event.end, text: event.text })).filter((item) => lane.pattern.test(item.text));
    if (!hits.length) return null;
    const ranked = hits.slice().sort((a, b) => words(b.text).length - words(a.text).length || a.t - b.t);
    const receipts = ranked.slice(0, receiptLimit).map((item) => ({
      t: Math.round(item.t), end: Math.round(item.end || item.t + 36),
      excerpt: item.index >= 0 ? bestCaptionExcerpt(captionFragments(events, item.index), captionFragments(events, item.index, 5, 12, "fallbackText"), 24) : safeExcerpt(item.text, 24),
      signalType: item.signalType || null, evidenceBasis: eventEvidenceBasis, reviewStatus: "machine-candidate"
    }));
    const laneMoments = moments.filter((moment) => laneLabelMatches(moment.category || moment.label, lane.label));
    const listeningLaneMoments = listeningRoutes.filter((moment) => laneLabelMatches(moment.category || moment.label, lane.label));
    const peak = ranked[0];
    return {
      key: lane.key, label: lane.label, candidateCount: hits.length, momentReceipts: laneMoments.length + listeningLaneMoments.length,
      first: Math.round(hits.slice().sort((a, b) => a.t - b.t)[0].t), peak: Math.round(peak.t),
      receipts, evidenceBasis: `${eventEvidenceBasis} + bounded timestamp receipts; not speaker-diarized`, reviewStatus: "machine-candidate"
    };
  }).filter(Boolean);
}
function bestBits(moments, fan, listeningRoutes = [], audioCandidates = []) {
  const routeKey = (moment) => `${Math.round(Number(moment?.t || 0))}|${canonicalLaneLabel(moment?.category || moment?.label || "SOURCE RECEIPT")}`;
  const routeRank = (moment) => {
    const evidence = clean(moment?.evidenceBasis || "").toLowerCase();
    const excerptPresent = Boolean(clean(moment?.excerpt || moment?.quote || moment?.captionExcerpt));
    let rank = 0;
    // A local Whisper route is the most trustworthy public navigation source,
    // even when the exact window is acoustic-only and therefore has no quote.
    if (/whisper/.test(evidence)) rank += 5;
    if (moment?.captionAligned === true) rank += 4;
    if (excerptPresent) rank += 2;
    if (/canonical audio/.test(evidence)) rank += 1;
    return rank;
  };
  // A caption-ledger episode can already have a real audio watch pass while
  // its caption window is too weak to print as a quote. Keep those acoustic
  // doors in BEST BITS anyway: the UI renders them as “press play” routes,
  // never as invented dialogue. Otherwise a show with dozens of ranked audio
  // candidates falsely looks like it has no best bits at all.
  // Reserve every timestamp/lane already represented by the listening shelf,
  // not only caption-aligned routes. Otherwise a Whisper acoustic-only door is
  // immediately duplicated by the stale automatic-caption candidate at the
  // same instant.
  const listeningKeys = new Set(listeningRoutes.map(routeKey));
  const coveredAudioKeys = new Set(listeningRoutes.filter((route) => route.captionAligned === true).map(routeKey));
  const acousticSeen = new Set();
  const acousticRoutes = audioCandidates.filter((candidate) => {
    const key = routeKey(candidate);
    if (listeningKeys.has(key) || coveredAudioKeys.has(key) || acousticSeen.has(key)) return false;
    acousticSeen.add(key);
    return true;
  }).map((candidate) => ({
    ...candidate,
    excerpt: "",
    captionExcerpt: "",
    captionAligned: false,
    evidenceBasis: candidate.evidenceBasis || "canonical YouTube audio route; playback remains the authority",
    reviewStatus: candidate.reviewStatus || "audio-feature-candidate; playback remains the authority"
  }));
  const routeMap = new Map();
  moments.concat(fan, listeningRoutes, acousticRoutes).forEach((moment) => {
    const key = routeKey(moment);
    const previous = routeMap.get(key);
    if (!previous || routeRank(moment) > routeRank(previous) || (routeRank(moment) === routeRank(previous) && Number(moment.score || 0) > Number(previous.score || 0))) {
      routeMap.set(key, moment);
    }
  });
  const routes = Array.from(routeMap.values());
  return routes.slice().sort((a, b) => Number(b.score || 0) - Number(a.score || 0) || Number(a.t || 0) - Number(b.t || 0)).map((moment, index) => ({
    rank: index + 1, t: Number(moment.t || 0), end: Number(moment.end || moment.t || 0), category: canonicalLaneLabel(moment.category || moment.label || "SOURCE RECEIPT"),
    label: canonicalLaneLabel(moment.label || moment.category || "SOURCE RECEIPT"), excerpt: safeExcerpt(moment.excerpt || moment.quote || moment.captionExcerpt || "", 16), captionAligned: moment.captionAligned === false ? false : moment.captionAligned === true ? true : null, score: Number(moment.score || 0),
    evidenceBasis: moment.evidenceBasis || "source-local listening route", reviewStatus: moment.reviewStatus || "machine-candidate"
  })).filter((moment) => moment.excerpt || moment.captionAligned === false);
}
function listPhrase(items) {
  const names = items.filter(Boolean).map(clean).filter(Boolean);
  if (!names.length) return "the night's open room";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
}
function contentFrame(title, shape, topics = []) {
  const text = `${clean(title)} ${clean(shape)} ${topics.map((topic) => topic?.name || "").join(" ")}`;
  if (/game of thrones|welcome to derry|episode\s+\d+|season\s+\d+|\brecap\b/i.test(text)) return "an episode-recap room";
  if (/trailer|teaser|spot|description|coming soon|\bbreakdown\b|delay talk|super bowl/i.test(text)) return "a trailer-and-news roundtable";
  if (/ranking|tier|bracket|mount rushmore|\bvs\b|versus/i.test(text)) return "a ranking-night argument";
  if (/q\s*&?\s*a|fan mail|super chat|member/i.test(text)) return "a fan-driven open line";
  if (/spoiler|review/i.test(text)) return "a spoiler-review hang";
  if (/commentary|watch\s*along|watch party/i.test(text)) return "a movie-side conversation";
  return "an open-line movie-news room";
}
function tapeNote(title, shape, topics, moments, fan, recurring, characterCues, listeningRoutes = []) {
  const topicList = listPhrase(topics.slice(0, 4).map((topic) => topic.name));
  const laneLead = recurring.slice().sort((a, b) => Number(b.candidateCount || 0) - Number(a.candidateCount || 0))[0];
  // When decoded audio has been analyzed, its bounded routes are the strongest
  // source-local receipts for the prose. The legacy/topic moment list can carry
  // a loose automatic-caption fragment even when a cleaner aligned audio route
  // exists, which is exactly the kind of machine-smell we refuse to print.
  const routeMoments = listeningRoutes.length ? listeningRoutes : moments;
  const hot = routeMoments.slice().sort((a, b) => Number(b.score || 0) - Number(a.score || 0) || Number(a.t || 0) - Number(b.t || 0))[0];
  const characterNames = characterCues.slice().sort((a, b) => Number(b.mentions || 0) - Number(a.mentions || 0)).slice(0, 3).map((character) => character.name);
  const characterList = listPhrase(characterNames);
  const fanTypes = Array.from(new Set(fan.map((signal) => signal.signalType))).slice(0, 2);
  const frame = contentFrame(title, shape, topics);
  const hook = hot ? `The first door worth pressing is ${clock(hot.t)} // ${hot.category}; open the source there and hear the exchange in full.` : "No bounded first-play hook survived this evidence tier.";
  const laneMood = canonicalLaneLabel(laneLead?.label) === "THE ROOM BREAKS" ? "breakdown territory" : canonicalLaneLabel(laneLead?.label) === "TAKE GETS NUCLEAR" ? "an argumentative register" : canonicalLaneLabel(laneLead?.label) === "WWAM UP IN YA" ? "out-of-pocket territory" : canonicalLaneLabel(laneLead?.label) === "STRAIGHT TO STEVE'S ASSHOLE" ? "a hostile verdict lane" : "a sharp side-channel";
  const lane = laneLead ? `The dominant recurring lane is ${laneLead.label} (${laneLead.candidateCount} surfaced moments), which puts the night in ${laneMood}.` : "The recurring-bit lanes stay quiet in this pass.";
  const fanLine = fan.length ? `The audience leaves ${fan.length} ${fan.length === 1 ? "fan callout" : "fan callouts"}${fanTypes.length ? `, including ${listPhrase(fanTypes)}` : ""}.` : "No fan-callout cluster survived this pass.";
  const characterLine = characterCues.length ? `Character traffic includes ${characterList}; the page cannot prove who performed each cue.` : "No character cue was strong enough to retain in this pass.";
  return `${shape} circles ${topicList} and plays like ${frame}. ${lane} ${hook} ${fanLine} ${characterLine}`;
}
function machineShapedSummary(value) {
  const text = clean(value);
  return !text || /(?:This completion pass maps|A bracket-and-ranking night from|A trailer-and-news night from|A movie watchalong from|A fan-mail night from|A spoiler-heavy review night from|An open-line movie-news night from|caption map opens on|timestamp candidates across|If you are dropping into this|The shape of the night is|has indexed doors on|The 2026 second pass maps|This is a machine-surfaced caption map|Ranked #\d+ among eligible archived livestreams|Selected #\d+ by the frozen Archive Atlas|Automatic captions support timestamped|Its caption map concentrates on|side conversations keep finding new trouble|turns .* into a long night of movie talk|keeps widening whenever somebody says|the takes keep catching fire|the rankings out and the gloves off|argument with receipts|The local route rail gives you|WWAM's fingerprints show up as|The chat is not background noise here|Character-shaped callbacks include|A separate listening pass marks|The text can point to the moment|The recap points you at the moment|One source receipt at|The cleanest bit of tape I found starts at|the transcript catches the show's temperature|For a quick taste, press)/i.test(text);
}
function machineShapedWhyItMatters(value) {
  const text = clean(value);
  return !text || /(?:final canonical shows without an episode recap|recovered caption map now supplies|This episode is part of the .* shelf\. Its evidence tier is .*Use the bounded receipts as navigation|This source is a source-linked machine index|Ranked #\d+ among eligible archived livestreams|Selected #\d+ by the frozen Archive Atlas|caption map concentrates on|Frozen Atlas priority|source-linked machine index)/i.test(text);
}
function whyItMattersRead(title, series, tier, shape, topics, moments, audioCandidates, audioStrongest, audioSignalMix, fan, characterCues, recurring, decodedAudio) {
  const variant = voiceVariant(title, series.key || shape || tier);
  const routeCount = Math.max(moments.length, audioCandidates.length);
  const routeLine = routeCount
    ? `${routeCount} jump-in point${routeCount === 1 ? "" : "s"} wait on the page`
    : "the topic and chapter rails are the best way in";
  const lane = audioSignalMix[0] || recurring.slice().sort((left, right) => Number(right.candidateCount || 0) - Number(left.candidateCount || 0))[0]?.label || "OPEN MIC";
  const lead = audioStrongest || moments.slice().sort((left, right) => Number(right.score || 0) - Number(left.score || 0))[0] || null;
  const leadLine = lead
    ? [
      `Start at ${clock(lead.t)}: ${humanMomentLabel(lead.category || lead.label || "SOURCE RECEIPT")} is the cleanest first turn.`,
      `For the quickest temperature check, use ${clock(lead.t)}; ${humanMomentLabel(lead.category || lead.label || "SOURCE RECEIPT")} takes over.`,
      `The first hard turn arrives at ${clock(lead.t)}—${humanMomentLabel(lead.category || lead.label || "SOURCE RECEIPT")}—so that is the doorway I would use.`,
    ][variant]
    : "There is no single loudest moment, so start with the chapter rail.";
  const topicList = listPhrase(topics.slice(0, 3).map((topic) => topic.name));
  const fanLine = fan.length
    ? [
      `The chat leaves ${fan.length} fan callout${fan.length === 1 ? "" : "s"} in the mix`,
      `Fan traffic shows up ${fan.length} time${fan.length === 1 ? "" : "s"} here`,
      `The audience gets ${fan.length} callout${fan.length === 1 ? "" : "s"} into the room`,
    ][variant]
    : "The chat stays quiet on this tape";
  const characterList = listPhrase(characterCues.slice().sort((left, right) => Number(right.mentions || 0) - Number(left.mentions || 0)).slice(0, 3).map((character) => character.name));
  const characterLine = characterCues.length
    ? [
      `The character traffic runs through ${characterList}; open the surrounding exchange to hear the bit land.`,
      `${characterList} ${characterCues.length === 1 ? "keeps" : "keep"} turning up in the tape; use the timestamp to decide whether it is a bit or a mention.`,
      `The character lane touches ${characterList}; the surrounding audio tells you how far the performance actually goes.`,
    ][variant]
    : "No recurring character bit rises above the rest here.";
  const audioLine = decodedAudio && audioCandidates.length
    ? [
      `The listening pass adds ${audioCandidates.length} more places to jump in; its busiest lane is ${lane.toLowerCase()}.`,
      `There are ${audioCandidates.length} audio-ranked doors behind the read, with ${lane.toLowerCase()} doing the most work.`,
      `The local listening shelf contributes ${audioCandidates.length} extra stops, led by ${lane.toLowerCase()}.`,
    ][variant]
    : audioCandidates.length
      ? `${audioCandidates.length} bounded listening doors sit beside the text.`
      : "There is no extra listening lane attached to this one yet.";
  const shelf = clean(series.label || "WWAM archive").toLowerCase();
  const subjectLine = topicList === "the night's open room"
    ? "The subject spine stays loose, so the route rail matters more than the thumbnail."
    : [
      `The useful subject doors are ${topicList}.`,
      `The conversation keeps circling ${topicList}.`,
      `The tape's center of gravity is ${topicList}.`,
    ][variant];
  const opening = [
    `${title} lives in the ${shelf} shelf, but the useful part is the argument inside it.`,
    `The fastest way into ${title} is through the tape, not the title card: ${routeLine}.`,
    `Treat ${title} like a room you can walk into at any point; ${routeLine}.`,
  ][variant];
  const ending = [
    "Use that timestamp as the doorway; the source supplies the timing and delivery.",
    "Start there, then widen the window until the exchange makes sense in its own voice.",
    "The page gives you the door; playback is where the joke, argument, or character bit actually earns its keep.",
  ][variant];
  return `${opening} ${subjectLine} ${leadLine} ${fanLine}. ${characterLine} ${audioLine} ${ending}`;
}
function voiceVariant(title, date) {
  return Array.from(`${title}|${date}`).reduce((sum, character) => sum + character.charCodeAt(0), 0) % 3;
}
function humanMomentLabel(value) {
  const label = clean(value).toLowerCase();
  const labels = {
    "take gets nuclear": "a nuclear take",
    "room break": "a room break",
    "the room breaks": "a room break",
    "wwam up in ya": "an Up In Ya hit",
    "up in ya": "an Up In Ya hit",
    "straight to steve's asshole": "a Straight to Steve's Asshole verdict",
    "steve's asshole": "a Straight to Steve's Asshole verdict",
    "fan signal": "a fan callout",
    "character signal": "a character callback",
    "full send": "a full-send moment"
  };
  return labels[label] || label || "the first big turn";
}
function voiceSummaryV2(title, date, shape, topics, moments, fan, recurring, characterCues, evidenceTier, listeningRoutes = []) {
  const variant = voiceVariant(title, date);
  const topicList = listPhrase(topics.slice(0, 4).map((topic) => topic.name));
  // Prefer decoded-audio routes when available: they are bounded to the
  // canonical source and carry the strongest aligned transcript window.
  const routeMoments = listeningRoutes.length ? listeningRoutes : moments;
  const hot = routeMoments.slice().sort((a, b) => Number(b.score || 0) - Number(a.score || 0) || Number(a.t || 0) - Number(b.t || 0))[0];
  const characterNames = characterCues.slice().sort((a, b) => Number(b.mentions || 0) - Number(a.mentions || 0)).slice(0, 3).map((character) => character.name);
  const characterList = listPhrase(characterNames);
  const fanTypes = Array.from(new Set(fan.map((signal) => signal.signalType))).slice(0, 2);
  const laneNames = recurring.slice()
    .sort((a, b) => Number(b.candidateCount || 0) - Number(a.candidateCount || 0))
    .slice(0, 3)
    .map((lane) => lane.label)
    .filter(Boolean);
  // A topic list is useful navigation, but it is not a recap. Put one
  // bounded source receipt in the prose so a visitor can feel the tape's
  // actual voice immediately. This deliberately refuses placeholders and
  // title-only topic signals; when no nearby receipt exists we simply omit
  // the quote instead of inventing connective tissue.
  const receiptOptions = [
    hot ? { text: hot.rawExcerpt || hot.excerpt || hot.captionExcerpt, at: hot.t, weight: Number(hot.score || 0) } : null,
    ...topics.map((item) => ({ text: item?.rawReceipt || item?.receipt, at: item?.at, weight: Number(item?.mentions || 0) }))
  ].filter(Boolean).map((item) => {
    const sourceText = normalizeCaptionText(item.text);
    // A bounded window without a real punctuation boundary is navigation
    // evidence, not a quote. Do not make it sound complete by appending a
    // period; that is how caption fragments turn into AI-smelling prose.
    const publicWindow = words(sourceText).slice(0, 16).join(" ");
    const sentenceBound = /[.!?](?:\s|$)/.test(publicWindow);
    let text = safeExcerpt(sourceText, 16);
    text = text.replace(/^(?:yeah|and|but|so|well|just|i mean|you know)\s+/i, "");
    text = text.replace(/^(?:[.…]+\s*)+/, "");
    if (text) text = `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
    const tokenList = words(text).map((token) => token.toLowerCase());
    const tokenCount = tokenList.length;
    const fillerWords = (text.toLowerCase().match(/\b(?:uh|um|like|yeah|you know|i mean|i know|i gotta|okay|just)\b/g) || []).length;
    const repeatedWords = (text.match(/\b([A-Za-z][A-Za-z'-]*)\b\s+\1\b/gi) || []).length;
    const repeatedPhrases = [2, 3].reduce((total, size) => {
      let hits = 0;
      for (let index = 0; index + size * 2 <= tokenList.length; index += 1) {
        if (tokenList.slice(index, index + size).join(" ") === tokenList.slice(index + size, index + size * 2).join(" ")) hits += 1;
      }
      return total + hits;
    }, 0);
    const fillerPenalty = fillerWords * 4 + repeatedWords * 8 + repeatedPhrases * 10 + (/^(?:the|a|an|this|that|it|he|she|we|they)\b/i.test(text) ? 2 : 0);
    const fragmentPenalty = /\.\.\.$/.test(text) ? 4 : 0;
    const punctuationBonus = /[.!?]/.test(text) ? 3 : 0;
    const quality = Math.max(0, Math.min(30, tokenCount * 1.5 + punctuationBonus - fillerPenalty - fragmentPenalty));
    const startsFragment = /^(?:are|is|was|were|and|but|because|so|then|which|that)\b/i.test(text);
    const vividHits = (text.match(/\b(?:fuck|fucking|shit|dick|ass|bitch|suck|sucks|horror|halloween|loomis|challis|freddy|jason|scream|terrifier|michael|movie|kill|dead|garbage|poop)\b/gi) || []).length;
    const adminHits = (text.match(/\b(?:streamyard|chat|internet|subscribe|microphone|camera|technical|screen|audio|live chat|can you see|are we live)\b/gi) || []).length;
    const editorialVibe = Math.min(120, vividHits * 12) - adminHits * 70;
    return { ...item, text, sentenceBound, tokenCount, fillerWords, repeatedPhrases, startsFragment, vividHits, adminHits, score: quality * 100 + Math.min(10, Number(item.weight || 0)) + editorialVibe };
  }).filter((item) => item.text && item.sentenceBound && item.tokenCount >= 8 && item.fillerWords <= 2 && item.repeatedPhrases === 0 && !item.startsFragment && !/\.\.\.$/.test(item.text) && !(item.adminHits > 0 && item.vividHits === 0) && item.score >= 1000 && !/^(?:No local transcript window aligned|No caption fragment aligned|Title signal only|open the source before treating)/i.test(item.text));
  const receiptCandidate = receiptOptions.sort((a, b) => b.score - a.score || Number(a.at || 0) - Number(b.at || 0))[0];
  const receiptLine = receiptCandidate
    ? [
      `A clean source line lands at ${clock(receiptCandidate.at || 0)}: "${safeExcerpt(receiptCandidate.text, 16)}"`,
      `At ${clock(receiptCandidate.at || 0)}, the source gives us a clean line: "${safeExcerpt(receiptCandidate.text, 16)}"`,
      `For a quick taste, press ${clock(receiptCandidate.at || 0)}: "${safeExcerpt(receiptCandidate.text, 16)}"`
    ][variant]
    : [
      "The transcript stayed too ragged for a clean pull quote here; the player is the honest way to catch the room's tone",
      "No single line survived cleanly enough to print; tap a timestamp and hear the room do the talking",
      "This show is better heard than paraphrased here; tap a timestamp and catch the timing in the source"
    ][variant];
  const frame = contentFrame(title, shape, topics);
  const cleanTitle = clean(title);
  const opening = frame === "a ranking-night argument"
    ? `${cleanTitle} is a ${date} ranking night with the gloves off.`
    : frame === "a trailer-and-news roundtable"
      ? `${cleanTitle} is ${date}'s trailer-and-news watch-and-react.`
      : frame === "an episode-recap room"
        ? `${cleanTitle} is ${date}'s episode-recap room, detours included.`
        : frame === "a fan-driven open line"
          ? `${cleanTitle} is ${date}'s fan-driven open line; the chat gets a real vote.`
          : frame === "a spoiler-review hang"
            ? `${cleanTitle} is ${date}'s spoiler-review hang, with the polite version left outside.`
            : frame === "a movie-side conversation"
              ? `${cleanTitle} settles into a movie-side conversation on ${date}.`
              : `${cleanTitle} is ${date}'s open-line movie-news show.`;
  const topicLine = topicList
    ? [
      `The main subject doors are ${topicList}.`,
      `The index keeps ${topicList} in view.`,
      `The night touches ${topicList}, with the side roads left in.`
    ][variant]
    : "The subject spine stays loose on this tape.";
  const route = hot
    ? `${moments.length ? "Best starting door:" : "Best listening door:"} ${clock(hot.t)} // ${humanMomentLabel(hot.category || "the first big turn")}.`
    : "Start with the chapter rail and let the tape choose the first detour.";
  const routeLine = routeMoments.length
    ? [
      `The page has ${routeMoments.length} playable doors.`,
      `${routeMoments.length} timestamped doors are ready.`,
      `There are ${routeMoments.length} marked places to drop in.`
    ][variant]
    : [
      "The page keeps the topic doors and the full official player together.",
      "Use the topic doors first; the full official player is right beside them.",
      "There is no extra timestamp rail yet, so the topic doors are the best way in."
    ][variant];
  const laneLine = laneNames.length
    ? [
      `The recurring WWAM lanes are ${listPhrase(laneNames)}.`,
      `The bits that keep resurfacing are ${listPhrase(laneNames)}.`,
      `The strongest WWAM fingerprints here: ${listPhrase(laneNames)}.`
    ][variant]
    : "No recurring WWAM lane cleared the headline check on this pass.";
  const fanLine = fan.length
    ? [
      `The audience leaves ${fan.length} fan callout${fan.length === 1 ? "" : "s"}${fanTypes.length ? `, including ${listPhrase(fanTypes).replace(/ CUE/g, "")}` : ""}.`,
      `The chat contributes ${fan.length} callout${fan.length === 1 ? "" : "s"}${fanTypes.length ? `, including ${listPhrase(fanTypes).replace(/ CUE/g, "")}` : ""}.`,
      `Fan traffic shows up ${fan.length} time${fan.length === 1 ? "" : "s"}${fanTypes.length ? `, through ${listPhrase(fanTypes).replace(/ CUE/g, "")}` : ""}.`
    ][variant]
    : ["No fan-callout cluster cleared this pass.", "The audience lane stays quiet here.", "No fan signal was retained for this tape."][variant];
  const characterLine = characterCues.length
    ? [
      `Character cues include ${characterList}; open the timestamped exchange for the performance.`,
      `${characterList} ${characterNames.length === 1 ? "is" : "are"} flagged in the source; the surrounding audio decides whether it is a bit or a mention.`,
      `The character lane touches ${characterList}; use the door, not just the keyword.`
    ][variant]
    : "No recurring-character bit takes over this tape.";
  const listeningLine = listeningRoutes.length
    ? [
      `The listening pass adds ${listeningRoutes.length} source-audio doors; the player carries timing and delivery.`,
      `A local audio pass adds ${listeningRoutes.length} more places to press play; hear the exchange before judging it.`,
      `There are ${listeningRoutes.length} additional audio doors here; let the tape supply the timing.`
    ][variant]
    : "There is no separate audio-ranked lane attached to this file yet.";
  const tierLine = evidenceTier === "source-brief"
    ? "This one stays compact until a stronger local receipt arrives."
    : [
      "Use the timestamp as a starting point; the full exchange supplies the punchline.",
      "Start with the door, then widen the window until the bit lands.",
      "The route points at the moment; playback supplies the rest."
    ][variant];
  return `${opening} ${topicLine} ${receiptLine}. ${route} ${routeLine} ${laneLine} ${fanLine} ${characterLine} ${listeningLine} ${tierLine}`;
}

function voiceSummary(title, date, shape, topics, moments, fan, recurring, characterCues, evidenceTier, listeningRoutes = []) {
  const topicList = listPhrase(topics.slice(0, 4).map((topic) => topic.name));
  const laneLead = recurring.slice().sort((a, b) => Number(b.candidateCount || 0) - Number(a.candidateCount || 0))[0];
  const routeMoments = moments.length ? moments : listeningRoutes;
  const hot = routeMoments.slice().sort((a, b) => Number(b.score || 0) - Number(a.score || 0) || Number(a.t || 0) - Number(b.t || 0))[0];
  const characterList = listPhrase(characterCues.slice().sort((a, b) => Number(b.mentions || 0) - Number(a.mentions || 0)).slice(0, 3).map((character) => character.name));
  const fanTypes = Array.from(new Set(fan.map((signal) => signal.signalType))).slice(0, 2);
  const frame = contentFrame(title, shape, topics);
  const mood = canonicalLaneLabel(laneLead?.label) === "THE ROOM BREAKS" ? "the room keeps losing its composure" : canonicalLaneLabel(laneLead?.label) === "TAKE GETS NUCLEAR" ? "the takes keep catching fire" : canonicalLaneLabel(laneLead?.label) === "WWAM UP IN YA" ? "the conversation gets gloriously filthy" : canonicalLaneLabel(laneLead?.label) === "STRAIGHT TO STEVE'S ASSHOLE" ? "the verdict lane gets mean" : "the side conversations keep widening";
  const variant = voiceVariant(title, date);
  const frameText = String(frame).replace(/^an? /i, "");
  const openerSets = /ranking-night/i.test(frame)
    ? [
      `${clean(title)} is a ranking-night argument from ${date}; nobody came to quietly agree.`,
      `On ${date}, ${clean(title)} turns a simple ranking into the kind of argument WWAM does best.`,
      `${clean(title)} lands on ${date} with the rankings out and the gloves off.`
    ]
    : /fan-driven/i.test(frame)
      ? [
        `${clean(title)} is a fan-powered open line from ${date}, with the room taking requests as it goes.`,
        `On ${date}, ${clean(title)} lets the audience steer the conversation into its best side streets.`,
        `${clean(title)} is the kind of ${frameText} where the chat is part of the cast.`
      ]
      : /spoiler-review/i.test(frame)
        ? [
          `${clean(title)} is a spoiler-review hang from ${date}; the polite version of the take did not make the edit.`,
          `On ${date}, ${clean(title)} pulls the spoiler curtain back and lets the verdicts get loud.`,
          `${clean(title)} arrives on ${date} with spoilers, hard opinions, and very little patience.`
        ]
        : [
          `${clean(title)} is ${frame} from ${date}, and the side conversations keep finding new trouble.`,
          `On ${date}, ${clean(title)} turns ${frame} into a long night of movie talk and sudden detours.`,
          `${clean(title)} is ${frame} that keeps widening whenever somebody says “one more thing.”`
        ];
  const opening = openerSets[variant];
  const topicLine = topicList ? `The route runs through ${topicList}` : "The route stays loose";
  const route = hot
    ? `${moments.length ? "For the quickest temperature check, jump to" : "Your best first listening stop is"} ${clock(hot.t)} for ${humanMomentLabel(hot.category || "the first big turn")}.`
    : "Start with the chapter rail and let the room choose the first detour.";
  const fanLine = fan.length
    ? `The chat is part of the show too: ${fan.length} fan callout${fan.length === 1 ? "" : "s"}${fanTypes.length ? `, including ${listPhrase(fanTypes).replace(/ CUE/g, "")}` : ""}.`
    : "The fan lane stays quiet on this tape.";
  const characterLine = characterCues.length
    ? `The recurring-character traffic includes ${characterList}; open the surrounding exchange, not just the keyword.`
    : "No recurring-character bit takes over this tape.";
  const routeLine = routeMoments.length
    ? `The page marks ${routeMoments.length} playable doors—places to jump straight into the tape.`
    : "The page keeps the topic doors and the full official player.";
  const tierLine = evidenceTier === "source-brief"
    ? "This one stays compact until a stronger local receipt arrives."
    : "Press play for the delivery and timing that the text can only point toward.";
  return `${opening} ${topicLine} while ${mood}. ${route} ${routeLine} ${fanLine} ${characterLine} ${tierLine}`;
}
function normalizeFanSignals(items) {
  return (items || []).map((signal) => ({ ...signal, signalType: clean(signal.signalType || fanSignalType(signal.excerpt || "")) })).filter((signal) => signal.excerpt || Number(signal.t || 0) >= 0);
}
function chapters(duration, moments, topics, restricted = false, routeEvidenceBasis = "source-local caption route checkpoint") {
  const output = [];
  for (let index = 0; index < 8; index += 1) {
    const target = Math.round((duration || 1) * index / 8);
    const route = moments.length ? moments.slice().sort((a, b) => Math.abs(a.t - target) - Math.abs(b.t - target))[0] : topics.slice().sort((a, b) => Math.abs((a.at || a.peak || 0) - target) - Math.abs((b.at || b.peak || 0) - target))[0];
    if (!route) continue;
    output.push({ id: `act-${String(index + 1).padStart(2, "0")}`, act: index + 1, at: Math.round(route.t ?? route.at ?? route.peak ?? target), end: Math.round(route.end ?? route.at ?? route.peak ?? target), label: route.label || route.category || route.name || "WATCH ROUTE", category: route.category || "TOPIC DOOR", excerpt: restricted ? "Topic-navigation checkpoint; excerpt withheld for this content mode." : safeExcerpt(route.excerpt || route.receipt || "Open the source at this chapter checkpoint.", 24), body: restricted ? "The archive preserves this chapter as a source-local route without manufacturing a quote or visual claim." : `The tape's ${String(route.label || route.category || route.name || "route").toLowerCase()} lane surfaces here. Open the timestamp and hear the full exchange.`, evidenceBasis: restricted ? "restricted topic checkpoint" : routeEvidenceBasis });
  }
  return output;
}
function heatmap(duration, events, moments, topics) {
  const count = duration > 10000 ? 24 : duration > 5400 ? 18 : 12;
  const step = Math.max(1, (duration || 1) / count);
  return Array.from({ length: count }, (_, index) => {
    const from = Math.round(index * step), to = Math.round(Math.min(duration || 1, (index + 1) * step));
    const local = events.filter((event) => event.t >= from && event.t < to);
    const signal = moments.filter((moment) => moment.t >= from && moment.t < to);
    const topic = topics.slice().sort((a, b) => Math.abs((a.at || a.peak || 0) - (from + to) / 2) - Math.abs((b.at || b.peak || 0) - (from + to) / 2))[0];
    return { from, to, heat: Math.min(100, Math.max(8, 10 + signal.length * 12 + Math.min(40, local.length / 8))), signal: signal[0]?.category || "OPEN MIC", topic: topic?.name || null };
  });
}
function characters(events) {
  const evidenceBasis = events.some((event) => event.evidenceType === "local-whisper-transcript")
    ? "source-local Whisper transcript character cue"
    : "source-local automatic caption character cue";
  return ["Dr. Loomis", "Dr. Challis", "Slenderman", "Corey Feldman", "Michael Myers", "Freddy", "Jason", "Chucky"].map((name) => {
    const pattern = new RegExp(name.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"), "i");
    const hits = events.filter((event) => pattern.test(event.text));
    return hits.length ? { name, mentions: hits.length, first: Math.round(hits[0].t), peak: Math.round(hits[0].t), receipt: safeExcerpt(hits[0].text, 18), evidenceBasis, reviewStatus: "machine-candidate" } : null;
  }).filter(Boolean);
}
function characterCues(events, duration, listeningRoutes = []) {
  const receiptLimit = Math.max(4, Math.round((duration || 1) / 600));
  const localWhisper = events.some((event) => event.evidenceType === "local-whisper-transcript");
  const captionEvidenceBasis = localWhisper ? "source-local Whisper transcript character cue" : "source-local automatic caption character cue";
  return CHARACTER_DEFS.map((character) => {
    const hits = events.map((event, index) => ({ event, index })).filter((item) => character.pattern.test(item.event.text));
    const routeHits = listeningRoutes.filter((route) => character.pattern.test(route.captionExcerpt || route.excerpt || ""));
    if (!hits.length && !routeHits.length) return null;
    const ranked = hits.slice().sort((a, b) => words(b.event.text).length - words(a.event.text).length || a.event.t - b.event.t);
    const captionReceipts = ranked.map((item) => ({ t: Math.round(item.event.t), end: Math.round(item.event.end || item.event.t + 36), excerpt: bestCaptionExcerpt(captionWindow(events, item.index), captionWindow(events, item.index, 5, 12, "fallbackText"), 24), evidenceBasis: captionEvidenceBasis, reviewStatus: "machine-candidate", receiptKind: "caption-cue" }));
    const audioReceipts = routeHits.slice().sort((a, b) => Number(b.score || 0) - Number(a.score || 0) || Number(a.t || 0) - Number(b.t || 0)).map((route) => ({ t: Math.round(route.t || 0), end: Math.round(route.end || route.t || 0), excerpt: safeExcerpt(route.captionExcerpt || route.excerpt || "", 24), evidenceBasis: localWhisper ? "canonical YouTube audio route + source-local Whisper transcript character cue; performance not established" : "canonical YouTube audio route + source-local caption character cue; performance not established", reviewStatus: "audio-feature-candidate; playback remains the authority", receiptKind: "audio-character-route" }));
    const receipts = [...captionReceipts, ...audioReceipts].sort((a, b) => Number(b.receiptKind === "audio-character-route") - Number(a.receiptKind === "audio-character-route") || a.t - b.t).filter((receipt, index, all) => index === all.findIndex((candidate) => Math.abs(candidate.t - receipt.t) < 4)).slice(0, receiptLimit);
    return {
      key: character.key, name: character.name, mentions: hits.length + routeHits.length, captionMentions: hits.length, listeningRouteMentions: routeHits.length, first: Math.round((hits[0]?.event?.t ?? routeHits[0]?.t ?? 0)), peak: Math.round((ranked[0]?.event?.t ?? routeHits[0]?.t ?? 0)),
      receipts,
      evidenceBasis: routeHits.length ? `${captionEvidenceBasis} + bounded audio routes; host identity and performance are not diarized` : `${captionEvidenceBasis}; host identity is not diarized`, reviewStatus: "machine-candidate"
    };
  }).filter(Boolean);
}
function normalizeTopics(items) { return (items || []).slice(0, 10).map((topic) => ({ name: clean(topic.name), mentions: Number(topic.mentions || 0), first: Math.round(Number(topic.first || 0)), peak: Math.round(Number(topic.peak || topic.at || 0)), cluster: Number(topic.cluster || 0), rawReceipt: clean(topic.rawReceipt || ""), receipt: clean(topic.receipt || ""), at: Math.round(Number(topic.at || topic.peak || topic.first || 0)), evidence: topic.evidence || { type: "source-local caption", speakerStatus: "not-diarized", reviewStatus: "machine-candidate" } })).filter((topic) => topic.name); }
function normalizeMoments(items, restricted = false) {
  if (restricted) return [];
  return (items || [])
    .map((moment, index) => ({
      id: moment.id || `moment-${index + 1}`,
      t: Math.round(Number(moment.t || 0)),
      end: Math.round(Number(moment.end || moment.t || 0)),
      category: canonicalLaneLabel(clean(moment.category || moment.label || "SOURCE RECEIPT")),
      label: canonicalLaneLabel(clean(moment.label || moment.category || "SOURCE RECEIPT")),
      score: Number(moment.heat || moment.score || 0),
      excerpt: safeExcerpt(moment.excerpt || moment.quote || "", 24),
      evidenceBasis: moment.evidenceBasis || "source-local caption candidate",
      reviewStatus: moment.reviewStatus || "machine-candidate"
    }))
    .filter((moment) => moment.excerpt && !isWeakPublicReceipt(moment.excerpt));
}
function conversationThreads(topics, localWhisper = false) {
  const evidenceBasis = localWhisper ? "source-local Whisper transcript topic anchor" : "source-local automatic caption topic anchor";
  return topics.slice().sort((a, b) => Number(a.first || a.at || 0) - Number(b.first || b.at || 0) || Number(b.mentions || 0) - Number(a.mentions || 0)).map((topic, index) => ({
    rank: index + 1, name: topic.name, first: Number(topic.first || topic.at || 0), peak: Number(topic.peak || topic.at || topic.first || 0), mentions: Number(topic.mentions || 0), receipt: clean(topic.receipt || "Open the source at this topic door."), evidenceBasis, reviewStatus: "machine-candidate"
  }));
}
function yearPass(record, events, topics, moments, fan, recurring, characterCues, existing, evidence, yearSnapshot) {
  const year = Number(String(record.upload_date || "").slice(0, 4) || 0);
  if (year !== 2026) return null;
  const duration = Number(record.duration || 0);
  const usableRoutes = moments.concat(fan).filter((route) => Number.isFinite(Number(route.t)));
  const segmentCount = duration >= 10800 ? 6 : duration >= 5400 ? 5 : 4;
  const sceneBeats = Array.from({ length: segmentCount }, (_, index) => {
    const from = Math.round(duration * index / segmentCount);
    const to = Math.round(duration * (index + 1) / segmentCount);
    const localMoments = moments.filter((moment) => moment.t >= from && moment.t < to);
    const localFans = fan.filter((signal) => signal.t >= from && signal.t < to);
    const localCharacters = characterCues.filter((character) => character.first >= from && character.first < to);
    const localTopics = topics.filter((topic) => (topic.at || topic.peak || topic.first || 0) >= from && (topic.at || topic.peak || topic.first || 0) < to);
    const topic = localTopics.slice().sort((a, b) => Number(b.mentions || 0) - Number(a.mentions || 0))[0]
      || topics.slice().sort((a, b) => Math.abs(Number(a.at || a.peak || a.first || 0) - (from + to) / 2) - Math.abs(Number(b.at || b.peak || b.first || 0) - (from + to) / 2))[0];
    const moment = localMoments.slice().sort((a, b) => Number(b.score || 0) - Number(a.score || 0) || Number(a.t || 0) - Number(b.t || 0))[0]
      || usableRoutes.slice().sort((a, b) => Math.abs(Number(a.t || 0) - (from + to) / 2) - Math.abs(Number(b.t || 0) - (from + to) / 2))[0];
    const label = clean(topic?.name || moment?.category || moment?.label || "OPEN ROOM");
    const at = Math.round(Number(moment?.t ?? topic?.at ?? topic?.peak ?? from) || from);
    const lane = clean(moment?.category || moment?.label || "TOPIC DOOR");
    const routeExcerpt = safeExcerpt(moment?.excerpt || topic?.receipt || "", 18);
    return {
      act: index + 1, from, to, at, label, lane,
      topic: topic?.name || null,
      receipt: routeExcerpt,
      momentCandidates: localMoments.length,
      fanSignals: localFans.length,
      characterCues: localCharacters.reduce((sum, character) => sum + (character.receipts || []).length, 0),
      description: `${label} is the clearest searchable door in this stretch of the source. The map holds ${localMoments.length} moment candidate${localMoments.length === 1 ? "" : "s"}, ${localFans.length} fan signal${localFans.length === 1 ? "" : "s"}, and ${localCharacters.reduce((sum, character) => sum + (character.receipts || []).length, 0)} character cue${localCharacters.reduce((sum, character) => sum + (character.receipts || []).length, 0) === 1 ? "" : "s"}. Open ${clock(at)} for the actual exchange.`,
      evidenceBasis: events.length
        ? (events.some((event) => event.evidenceType === "local-whisper-transcript") ? "2026 second-pass Whisper route; machine-surfaced" : "2026 second-pass caption route; machine-surfaced")
        : "2026 second-pass source dossier route; machine-surfaced",
      reviewStatus: "machine-candidate"
    };
  });
  const laneTotals = recurring.slice().sort((a, b) => Number(b.candidateCount || 0) - Number(a.candidateCount || 0)).map((lane) => ({ key: lane.key, label: lane.label, candidateCount: Number(lane.candidateCount || 0), receipts: Number(lane.receipts?.length || 0) }));
  const characterReceipts = characterCues.reduce((sum, character) => sum + (character.receipts || []).length, 0);
  const eventCount = Number(evidence?.eventsAudited || evidence?.eventsObserved || events.length || 0);
  const crossCheck = yearSnapshot ? {
    observedAt: yearCanon.observedAt || null,
    showShape: clean(yearSnapshot.editorial?.showShape || ""),
    signature: clean(yearSnapshot.editorial?.signature || ""),
    note: "Retained as a cross-check from the earlier 2025–2026 machine pass; it does not upgrade this source's review state."
  } : null;
  return {
    version: "2026-wave-01",
    label: "2026 SECOND PASS // MACHINE ROUTE MAP",
    status: "machine-repass",
    note: `This 2026 file was run through the second-pass route map: ${topics.length} topic doors, ${moments.length} moment candidates, ${fan.length} fan signals, and ${characterReceipts} character cue receipts across ${clock(duration)}. It is built to make the source easier to explore; it is not a diarized transcript or a claim of human review.`,
    density: { durationSeconds: duration, eventsAudited: eventCount, wordsAudited: Number(existing?.wordsAudited || words(events.map((event) => event.text).join(" ")).length), topicDoors: topics.length, momentCandidates: moments.length, fanSignals: fan.length, characterCueReceipts: characterReceipts, recurringBitCues: recurring.reduce((sum, lane) => sum + Number(lane.candidateCount || 0), 0), evidenceTier: existing ? (completionById.has(record.id) ? "completion-dossier" : deepById.has(record.id) || freshById.has(record.id) ? "distill-dossier" : "caption-ledger") : "caption-ledger" },
    laneTotals, sceneBeats, crossCheck,
    sourceAuthority: "Official WWAM upload; captions are navigation, playback is the authority."
  };
}
const episodes = canonicalMetadata.map((record) => {
  const id = record.id;
  const editorialPack = editorialPackById.get(id) || null;
  const editorialPackBound = editorialPack && Number(editorialPack.evidence?.duration || 0) === Number(record.duration || 0);
  const events = captionEvents(id);
  const localWhisper = events.some((event) => event.evidenceType === "local-whisper-transcript");
  const existing = completionById.get(id) || deepById.get(id) || freshById.get(id) || null;
  const mode = existing?.contentMode || inferMode(record.title);
  // A verified local Whisper ledger is a stronger source boundary than the
  // older empty machine record. Let it produce bounded commentary moments for
  // trailer reactions and watch-parties; keep the conservative hold only when
  // no local audio receipt exists yet.
  const restricted = RESTRICTED_MODES.has(mode) && !localWhisper && existing && existing.moments && existing.moments.length === 0;
  const existingTopics = normalizeTopics(existing?.topics);
  const existingMoments = normalizeMoments(existing?.moments, restricted);
  // Once a verified local Whisper ledger exists, rebuild machine-surfaced
  // topics and moments from that transcript. Human editorial packs remain
  // authoritative; older caption-derived moments do not get to hide a better
  // source just because they were generated first.
  const topics = localWhisper && !editorialPackBound ? derivedTopics(events, record.title) : (existingTopics.length ? existingTopics : derivedTopics(events, record.title));
  const transcriptMoments = localWhisper ? derivedMoments(events, Number(record.duration || 0), restricted) : [];
  const refreshedExistingMoments = events.length
    ? existingMoments.map((moment) => refreshMachineMomentExcerpt(moment, events))
    : existingMoments;
  const moments = localWhisper
    ? mergeTranscriptMoments(refreshedExistingMoments, transcriptMoments)
    : (existingMoments.length ? existingMoments : transcriptMoments);
  const fan = fanSignals(events, Number(record.duration || 0));
  const chapterList = chapters(Number(record.duration || 0), moments, topics, restricted, localWhisper ? "source-local Whisper transcript route checkpoint" : "source-local caption route checkpoint");
  const yearSnapshot = yearCanonById.get(id) || null;
  const shape = inferShape(record.title, mode, existing, yearSnapshot);
  const series = inferSeries(record.title, mode);
  const tier = completionById.has(id) ? "completion-dossier" : deepById.has(id) || freshById.has(id) ? "distill-dossier" : events.length ? "caption-ledger" : "source-brief";
  const watchPassRaw = livestreamAudio.episodes?.[id] || watchPilot.episodes?.[id] || null;
  const audioCandidates = Array.isArray(watchPassRaw?.candidates) ? watchPassRaw.candidates : [];
  const listeningRoutes = audioCandidates.map((candidate) => {
    const rawExcerpt = localWhisper
      ? captionWindowAt(events, candidate.t)
      : (candidate.captionExcerpt || candidate.excerpt || "");
    const repairedExcerpt = localWhisper
      ? captionExcerptAt(events, candidate.t, 24)
      : safeExcerpt(rawExcerpt, 24);
    return {
    ...candidate,
    rawExcerpt,
    // The audio pass was originally aligned to YouTube automatic captions.
    // Once a verified Whisper ledger exists, put that transcript on the
    // clickable route so the listening shelf cannot reintroduce stale or
    // mangled caption text while the main dossier is already clean.
    excerpt: repairedExcerpt || "No local transcript window aligned; open the player at this timestamp.",
    captionAligned: Boolean(repairedExcerpt),
    evidenceBasis: localWhisper && rawExcerpt
      ? "canonical YouTube audio + source-local Whisper transcript alignment"
      : localWhisper
        ? "canonical YouTube audio route; local Whisper window unavailable at this timestamp"
        : candidate.evidenceBasis || "source-local listening route",
    reviewStatus: candidate.reviewStatus || "machine-candidate"
    };
  });
  const decodedAudio = watchPassRaw?.status === "audio-feature-pass" && watchPassRaw?.media?.canonicalAudioAvailable !== false;
  const audioStrongest = audioCandidates.slice().sort((left, right) => Number(right.score || 0) - Number(left.score || 0) || Number(left.t || 0) - Number(right.t || 0))[0] || null;
  const audioSignalMix = Array.isArray(watchPassRaw?.listeningDigest?.signalMix)
    ? watchPassRaw.listeningDigest.signalMix
    : Object.entries(watchPassRaw?.audit?.candidateCategories || {}).sort((left, right) => Number(right[1]) - Number(left[1])).map(([label, count]) => `${label} (${count})`);
  const audioLine = decodedAudio && audioCandidates.length
    ? `The listening pass adds ${audioCandidates.length} extra doors; its strongest lane lands at ${clock(audioStrongest?.t || 0)} // ${audioStrongest?.category || "SOURCE RECEIPT"}. ${audioSignalMix.length ? `The room leans ${audioSignalMix.slice(0, 3).join(", ")}.` : ""}`
    : watchPassRaw && audioCandidates.length
      ? `The listening shelf retains ${audioCandidates.length} extra doors, led by ${clock(audioStrongest?.t || 0)} // ${audioStrongest?.category || "SOURCE RECEIPT"}.`
      : "No extra listening lane is attached to this file yet.";
  const topicNames = topics.slice(0, 3).map((topic) => topic.name);
  const topicRead = topicNames.length === 1 ? topicNames[0] : topicNames.length === 2 ? `${topicNames[0]} and ${topicNames[1]}` : topicNames.length > 2 ? `${topicNames.slice(0, -1).join(", ")}, and ${topicNames.at(-1)}` : "the night's open mic";
  const lead = mode === "ranking-show" ? "A bracket-and-ranking night" : mode === "trailer-reaction" ? "A trailer-and-news night" : mode === "movie-commentary" ? "A movie watchalong" : mode === "q-and-a" ? "A fan-mail night" : mode === "spoiler-review" ? "A spoiler-heavy review night" : "An open-line movie-news night";
  const hotLane = moments.slice().sort((left, right) => Number(right.score || 0) - Number(left.score || 0))[0]?.category;
  const hotMoment = moments.slice().sort((left, right) => Number(right.score || 0) - Number(left.score || 0) || Number(left.t || 0) - Number(right.t || 0))[0] || null;
  const currentYear = Number(String(record.upload_date || "").slice(0, 4) || 0);
  const summaryVariant = Array.from(id).reduce((total, character) => total + character.charCodeAt(0), 0) % 4;
  const hookLine = hotMoment ? `The first door worth pressing is ${clock(hotMoment.t)} // ${hotLane || hotMoment.category}; open that timestamp to hear the exchange.` : "No bounded tape hook survived this evidence tier.";
  const fanLine = fan.length ? `The file also keeps ${fan.length} ${fan.length === 1 ? "fan-signal receipt" : "fan-signal receipts"} in the room.` : "No fan-signal cluster was retained in this ledger.";
  const ledgerSummary = [
    `${lead} from ${dateFrom(record.upload_date)}. The caption map opens on ${topicRead}, with ${moments.length} timestamp candidates across ${clock(record.duration)}. ${hookLine} ${fanLine}`,
    `If you are dropping into this ${shape.toLowerCase()}, start with ${topicRead}. The ledger marks ${moments.length} places to press play across ${clock(record.duration)}; ${hookLine} ${fanLine}`,
    `The shape of the night is ${shape.toLowerCase()}. The clearest doors are ${topicRead}. There are ${moments.length} bounded routes across ${clock(record.duration)}. ${hookLine} ${fanLine}`,
    `This ${shape.toLowerCase()} has indexed doors on ${topicRead}. The source-local map surfaces ${moments.length} candidates across ${clock(record.duration)}. ${hookLine} ${fanLine}`
  ][summaryVariant];
  const secondPassSummary = currentYear === 2026
    ? `The 2026 second pass maps this ${shape.toLowerCase()} through ${topicRead}. It keeps ${topics.length} topic doors, ${moments.length} moment candidates, ${fan.length} ${fan.length === 1 ? "fan-signal receipt" : "fan-signal receipts"}, and ${characterCues(events, Number(record.duration || 0), listeningRoutes).reduce((sum, character) => sum + character.receipts.length, 0)} character cue receipts across ${clock(record.duration)}. Start at ${hookLine.replace(/\.$/, "")} and use the scene beats below as a route through the night. Playback remains the authority; captions do not certify a speaker or intent.`
    : null;
  const summary = clean(editorialPackBound ? editorialPack.overview : existing?.summary || secondPassSummary || (events.length
    ? `${ledgerSummary} Captions are navigation, not a final quote or speaker verdict—open a receipt and hear the full exchange.`
    : `A source brief for ${clean(record.title)}. Metadata is preserved, but no local caption route survived for a responsible episode breakdown.`));
  const evidence = {
    ...(localWhisper ? {} : (existing?.captionEvidence || {})),
    track: localWhisper ? "Local Whisper transcript (source audio)" : (existing?.captionEvidence?.track || "English YouTube automatic captions (JSON3)"),
    sourceFile: localWhisper ? `source-cache/captions/${id}.asr.json` : (existing?.captionEvidence?.sourceFile || `source-cache/captions/${id}.json`),
    engine: localWhisper ? "faster-whisper" : (existing?.captionEvidence?.engine || "youtube"),
    model: localWhisper ? "large-v3-turbo" : (existing?.captionEvidence?.model || ""),
    type: localWhisper ? "local-whisper-transcript" : existing?.captionEvidence?.type || (events.length ? "youtube-automatic-caption" : "metadata-only"),
    eventsAudited: events.length || Number(existing?.captionEvidence?.eventsAudited || 0),
    speakerDiarized: false,
    originAttribution: false,
    reviewStatus: events.length ? "machine-candidate" : (existing?.captionEvidence?.reviewStatus || "held")
  };
  const cueList = characterCues(events, Number(record.duration || 0), listeningRoutes);
  const recurring = recurringBits(events, moments, fan, Number(record.duration || 0), listeningRoutes);
  const note = tapeNote(record.title, shape, topics, moments, fan, recurring, cueList, listeningRoutes);
  // Rebuild every caption-backed file through the same voice pass. Reusing an
  // older summary was allowing pre-cleanup transcript fragments to survive
  // indefinitely in otherwise healthy dossiers. Human editorial packs and
  // metadata-only source briefs remain untouched.
  const generatedSummary = editorialPackBound || (!events.length && tier === "source-brief")
    ? summary
    : voiceSummaryV2(record.title, dateFrom(record.upload_date), shape, topics, moments, fan, recurring, cueList, tier, listeningRoutes);
  // Keep the visitor-facing summary conversational and compact. Acoustic
  // method/evidence belongs in audioRead and tapeNote; appending it here made
  // every livestream card end with the same machine-room disclaimer.
  const finalSummary = clean(editorialPackBound ? editorialPack.overview : generatedSummary);
  const existingWhyItMatters = existing?.editorial?.whyItMatters;
  const whyItMatters = editorialPackBound && clean(editorialPack.deck)
    ? clean(editorialPack.deck)
    : machineShapedWhyItMatters(existingWhyItMatters)
    ? whyItMattersRead(record.title, series, tier, shape, topics, moments, audioCandidates, audioStrongest, audioSignalMix, fan, cueList, recurring, decodedAudio)
    : clean(existingWhyItMatters);
  const pass = yearPass(record, events, topics, moments, fan, recurring, cueList, existing, evidence, yearSnapshot);
  const watchPass = watchPassRaw ? {
    ...watchPassRaw,
    candidates: (watchPassRaw.candidates || []).map((candidate) => {
      const localExcerpt = localWhisper ? captionWindowAt(events, candidate.t) : "";
      const captionExcerpt = localWhisper
        ? captionExcerptAt(events, candidate.t, 16)
        : safeExcerpt(candidate.captionExcerpt || "", 16);
      const publicCaptionExcerpt = isWeakPublicReceipt(captionExcerpt) ? "" : captionExcerpt;
      return {
        ...candidate,
        captionExcerpt: publicCaptionExcerpt || (localWhisper ? "No local transcript window aligned; open the player at this timestamp." : "No caption fragment aligned; open the source and listen to this acoustic window."),
        excerpt: publicCaptionExcerpt || (localWhisper ? "No local transcript window aligned; open the player at this timestamp." : "No caption fragment aligned; open the source and listen to this acoustic window."),
        captionAligned: Boolean(publicCaptionExcerpt),
        evidenceBasis: localWhisper && publicCaptionExcerpt
          ? "canonical YouTube audio + source-local Whisper transcript alignment"
          : localWhisper
            ? "canonical YouTube audio route; local Whisper window unavailable at this timestamp"
            : candidate.evidenceBasis || "source-local listening route"
      };
    })
  } : null;
  const rssAudioPass = livestreamRssAudio.records?.[id] || null;
  const publicTopics = topics.map(({ rawReceipt, ...topic }) => topic);
  return {
    id, title: clean(record.title), date: dateFrom(record.upload_date), duration: Number(record.duration || 0), durationLabel: clock(record.duration), views: Number(record.view_count || 0),
    thumbnail: record.thumbnail || `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`, url: `https://www.youtube.com/watch?v=${id}`, channel: record.channel || "WeWatchedAMovie", publicSource: true,
    format: mode, seriesKey: series.key, seriesTitle: series.label, year: Number(String(record.upload_date || "").slice(0, 4) || 0),
    sourceInAtlas: atlasById.has(id), latestOutsideAtlas: !atlasById.has(id), atlasCoverage: atlasById.get(id)?.coverage || null, archiveLanes: atlasById.get(id)?.lanes || [],
    evidenceTier: tier, captioned: Boolean(events.length || existing?.captioned), wordsAudited: Number(existing?.wordsAudited || words(events.map((event) => event.text).join(" ")).length),
    topics: publicTopics, conversationThreads: conversationThreads(publicTopics, localWhisper), moments, chapters: chapterList, heatmap: existing?.heatmap?.length ? existing.heatmap : heatmap(Number(record.duration || 0), events, moments, publicTopics), fanSignals: normalizeFanSignals(fan),
    recurringBits: recurring, bestBits: bestBits(moments, fan, listeningRoutes, audioCandidates), characterCues: cueList,
    characters: existing?.characters || characters(events), peak: existing?.peak || moments.slice().sort((a, b) => b.score - a.score)[0] || null,
    yearPass: pass, watchPass, rssAudioPass,
     dossier: { summary: finalSummary, tapeNote: clean(`${note} ${audioLine}`), archiveSummary: currentYear === 2026 && existing?.summary ? refreshArchiveSummary(existing.summary, localWhisper) : null, shape, hook: hotMoment ? { at: Number(hotMoment.t || 0), category: hotMoment.category || hotMoment.label || "SOURCE RECEIPT", excerpt: hotMoment.excerpt || "", evidenceBasis: hotMoment.evidenceBasis || "source-local caption candidate", reviewStatus: hotMoment.reviewStatus || "machine-candidate" } : null, audioRead: watchPassRaw ? { mode: decodedAudio ? "decoded-audio" : "caption-only", routeCount: audioCandidates.length, strongest: audioStrongest ? { t: Number(audioStrongest.t || 0), category: audioStrongest.category || audioStrongest.label || "SOURCE RECEIPT", score: Number(audioStrongest.score || 0) } : null, signalMix: audioSignalMix.slice(0, 8), evidence: decodedAudio ? "Decoded canonical audio re-ranked source-local windows; playback remains the authority." : "Caption-only source-local routes; no acoustic intensity claim is made." } : null, whyItMatters, evidence, restricted, editorialRead: Boolean(editorialPackBound), reviewStatus: editorialPackBound ? "full-tape-human-editorial-read" : tier === "source-brief" ? "held-source-brief" : tier === "completion-dossier" ? "distilled-machine-candidate" : "machine-surfaced" }
  };
}).sort((left, right) => right.date.localeCompare(left.date) || right.id.localeCompare(left.id));

// Repeated livestream titles are legitimate (the channel reused the same
// weekly headline), but a title-only card makes two tapes indistinguishable.
// Keep the source title intact for search and provenance, and add a derived
// navigation title only when a collision exists. Same-day duplicates receive a
// short source-id suffix so every card still has a stable human-facing handle.
const titleGroups = new Map();
episodes.forEach((episode) => {
  const key = clean(episode.title).toLowerCase();
  if (!titleGroups.has(key)) titleGroups.set(key, []);
  titleGroups.get(key).push(episode);
});
titleGroups.forEach((group) => {
  if (group.length < 2) return;
  const dateCounts = new Map();
  group.forEach((episode) => dateCounts.set(episode.date, (dateCounts.get(episode.date) || 0) + 1));
  group.forEach((episode) => {
    const sameDay = Number(dateCounts.get(episode.date) || 0) > 1;
    const suffix = sameDay ? `${episode.date} // TAPE ${episode.id.slice(0, 6)}` : episode.date;
    episode.displayTitle = `${episode.title} // ${suffix}`;
  });
});

const seriesMap = new Map();
episodes.forEach((episode) => {
  if (!seriesMap.has(episode.seriesKey)) seriesMap.set(episode.seriesKey, { key: episode.seriesKey, title: episode.seriesTitle, episodeIds: [], totalDuration: 0, latestDate: episode.date, formats: new Set() });
  const series = seriesMap.get(episode.seriesKey); series.episodeIds.push(episode.id); series.totalDuration += episode.duration; series.formats.add(episode.format);
});
const series = Array.from(seriesMap.values()).map((item) => ({ ...item, formats: Array.from(item.formats), episodeCount: item.episodeIds.length }));
const years = {};
episodes.forEach((episode) => { years[episode.year] = (years[episode.year] || 0) + 1; });
function buildYearIndex(year) {
  const set = episodes.filter((episode) => episode.year === year);
  if (!set.length) return null;
  const topicMap = new Map();
  const laneMap = new Map();
  const monthMap = new Map();
  set.forEach((episode) => {
    const month = String(episode.date || "").slice(0, 7) || "unknown";
    monthMap.set(month, (monthMap.get(month) || 0) + 1);
    episode.topics.forEach((topic) => {
      if (!topicMap.has(topic.name)) topicMap.set(topic.name, { name: topic.name, mentions: 0, episodeIds: [] });
      const item = topicMap.get(topic.name); item.mentions += Number(topic.mentions || 0); if (!item.episodeIds.includes(episode.id)) item.episodeIds.push(episode.id);
    });
    episode.recurringBits.forEach((lane) => {
      if (!laneMap.has(lane.key)) laneMap.set(lane.key, { key: lane.key, label: lane.label, candidateCount: 0, episodeIds: [] });
      const item = laneMap.get(lane.key); item.candidateCount += Number(lane.candidateCount || 0); if (!item.episodeIds.includes(episode.id)) item.episodeIds.push(episode.id);
    });
  });
  const passEpisodes = set.filter((episode) => episode.yearPass);
  const evidenceMix = {};
  set.forEach((episode) => { evidenceMix[episode.evidenceTier] = (evidenceMix[episode.evidenceTier] || 0) + 1; });
  return {
    year, label: `${year} SECOND PASS // YEAR AT A GLANCE`, episodeCount: set.length, episodeIds: set.map((episode) => episode.id), months: Object.fromEntries(Array.from(monthMap.entries()).sort()),
    totalDurationSeconds: set.reduce((sum, episode) => sum + episode.duration, 0), totalViewsSnapshot: set.reduce((sum, episode) => sum + episode.views, 0), wordsAudited: set.reduce((sum, episode) => sum + episode.wordsAudited, 0),
    captionBacked: set.filter((episode) => episode.captioned).length, sourceBriefs: set.filter((episode) => episode.evidenceTier === "source-brief").length,
    topicDoors: set.reduce((sum, episode) => sum + episode.topics.length, 0), momentCandidates: set.reduce((sum, episode) => sum + episode.moments.length, 0), fanSignals: set.reduce((sum, episode) => sum + episode.fanSignals.length, 0),
    characterCueReceipts: set.reduce((sum, episode) => sum + episode.characterCues.reduce((inner, character) => inner + character.receipts.length, 0), 0), recurringBitCues: set.reduce((sum, episode) => sum + episode.recurringBits.reduce((inner, lane) => inner + Number(lane.candidateCount || 0), 0), 0),
    topTopics: Array.from(topicMap.values()).sort((a, b) => b.mentions - a.mentions || a.name.localeCompare(b.name)).slice(0, 12),
    topLanes: Array.from(laneMap.values()).sort((a, b) => b.candidateCount - a.candidateCount || a.label.localeCompare(b.label)), evidenceMix,
    passEpisodes: passEpisodes.length, note: `All ${set.length} official ${year} source records are present. This is a machine-surfaced second pass built for navigation and comparison; playback remains the authority and human review is still required for speaker, intent, visual context, and final clip selection.`
  };
}
const yearIndex = Object.fromEntries(Object.keys(years).sort((left, right) => Number(right) - Number(left)).map((year) => [year, buildYearIndex(Number(year))]));
const topicMap = new Map();
episodes.forEach((episode) => episode.topics.forEach((topic) => {
  if (!topicMap.has(topic.name)) topicMap.set(topic.name, { name: topic.name, mentions: 0, episodeIds: [], latest: topic.at });
  const item = topicMap.get(topic.name); item.mentions += topic.mentions; item.episodeIds.push(episode.id); item.latest = Math.max(item.latest || 0, topic.at || 0);
}));
const topicIndex = Array.from(topicMap.values()).sort((a, b) => b.mentions - a.mentions).slice(0, 60);
const fanHallMap = new Map();
episodes.forEach((episode) => episode.fanSignals.forEach((signal) => {
  const key = signal.signalType || "CHAT / FAN CALLOUT";
  if (!fanHallMap.has(key)) fanHallMap.set(key, { key, label: key, receipts: 0, episodeIds: [], firstDate: episode.date, latestDate: episode.date });
  const item = fanHallMap.get(key); item.receipts += 1; if (!item.episodeIds.includes(episode.id)) item.episodeIds.push(episode.id); item.firstDate = item.firstDate < episode.date ? item.firstDate : episode.date; item.latestDate = item.latestDate > episode.date ? item.latestDate : episode.date;
}));
const fanHall = Array.from(fanHallMap.values()).sort((a, b) => b.receipts - a.receipts || a.label.localeCompare(b.label));
const fanPeopleMap = new Map();
episodes.forEach((episode) => episode.fanSignals.forEach((signal) => {
  if (!signal.fanEntity) return;
  if (!fanPeopleMap.has(signal.fanEntity)) fanPeopleMap.set(signal.fanEntity, { key: signal.fanEntity, label: signal.fanEntityLabel, receipts: 0, episodeIds: [], firstDate: episode.date, latestDate: episode.date, matches: new Set(), identityBasis: signal.fanIdentityBasis });
  const item = fanPeopleMap.get(signal.fanEntity);
  item.receipts += 1;
  if (!item.episodeIds.includes(episode.id)) item.episodeIds.push(episode.id);
  if (signal.fanEntityMatch) item.matches.add(signal.fanEntityMatch);
  item.firstDate = item.firstDate < episode.date ? item.firstDate : episode.date;
  item.latestDate = item.latestDate > episode.date ? item.latestDate : episode.date;
}));
const fanHallPeople = Array.from(fanPeopleMap.values()).map((item) => ({ ...item, matches: Array.from(item.matches) })).sort((a, b) => b.receipts - a.receipts || a.label.localeCompare(b.label));
const characterMap = new Map();
episodes.forEach((episode) => episode.characterCues.forEach((character) => {
  const key = character.key;
  if (!characterMap.has(key)) characterMap.set(key, { key, name: character.name, mentions: 0, episodeIds: [], receipts: 0, firstDate: episode.date, latestDate: episode.date });
  const item = characterMap.get(key); item.mentions += character.mentions; item.receipts += character.receipts.length; if (!item.episodeIds.includes(episode.id)) item.episodeIds.push(episode.id); item.firstDate = item.firstDate < episode.date ? item.firstDate : episode.date; item.latestDate = item.latestDate > episode.date ? item.latestDate : episode.date;
}));
const characterIndex = Array.from(characterMap.values()).sort((a, b) => b.mentions - a.mentions || a.name.localeCompare(b.name));
const audioPassCoverage = { ...(livestreamAudio.coverage || {}) };
const canonicalAudioIds = new Set(Object.entries(livestreamAudio.episodes || {}).filter(([, record]) => record?.status === "audio-feature-pass").map(([id]) => id));
const alternateAudioIds = new Set(episodes.filter((episode) => episode.rssAudioPass?.status === "rss-audio-feature-pass" && !canonicalAudioIds.has(episode.id)).map((episode) => episode.id));
audioPassCoverage.alternateAudio = alternateAudioIds.size;
audioPassCoverage.alternateAudioSeconds = episodes.filter((episode) => alternateAudioIds.has(episode.id)).reduce((sum, episode) => sum + Number(episode.rssAudioPass?.media?.durationSeconds || 0), 0);
audioPassCoverage.effectiveAudioAnalyzed = Number(audioPassCoverage.audioAnalyzed || 0) + alternateAudioIds.size;
audioPassCoverage.effectiveHeld = Math.max(0, episodes.length - audioPassCoverage.effectiveAudioAnalyzed);
const stats = {
  episodes: episodes.length, atlasRecords: atlas.records?.length || 0, latestOutsideAtlas: episodes.filter((episode) => episode.latestOutsideAtlas).length,
  completionDossiers: episodes.filter((episode) => episode.evidenceTier === "completion-dossier").length, distillDossiers: episodes.filter((episode) => episode.evidenceTier === "distill-dossier").length,
  captionLedgers: episodes.filter((episode) => episode.evidenceTier === "caption-ledger").length, sourceBriefs: episodes.filter((episode) => episode.evidenceTier === "source-brief").length,
  captionBacked: episodes.filter((episode) => episode.captioned).length, totalDurationSeconds: episodes.reduce((sum, episode) => sum + episode.duration, 0), totalViewsSnapshot: episodes.reduce((sum, episode) => sum + episode.views, 0),
  fanSignalReceipts: episodes.reduce((sum, episode) => sum + episode.fanSignals.length, 0), episodesWithFanSignals: episodes.filter((episode) => episode.fanSignals.length).length,
  recurringBitReceipts: episodes.reduce((sum, episode) => sum + episode.recurringBits.reduce((inner, lane) => inner + lane.candidateCount, 0), 0),
  characterCueReceipts: episodes.reduce((sum, episode) => sum + episode.characterCues.reduce((inner, character) => inner + character.receipts.length, 0), 0),
  yearPassEpisodes: episodes.filter((episode) => episode.yearPass).length,
  audioPassCoverage: audioPassCoverage,
  rssAudioMirrors: Object.keys(livestreamRssAudio.records || {}).length,
  firstDate: episodes.at(-1)?.date || null, lastDate: episodes[0]?.date || null, years
};
const payload = {
  schema: "shokker-wwam-livestream-canon/v1", generated: new Date().toISOString(), observedAt: "2026-07-31",
  sourcePolicy: "Every public WWAM source represented in the local official metadata snapshot is retained. Completion and distill artifacts are reused when present; remaining episodes receive bounded caption-ledger routes or a held source brief. Speaker, intent, visual context, rights, and creator approval are never inferred.",
  scope: { metadataSources: canonicalMetadata.length, rawMetadataSources: metadata.length, captionFiles: fs.readdirSync(CAPTIONS_DIR).filter((file) => file.endsWith(".json")).length, atlasRecords: atlas.records?.length || 0, completionSources: completion.streams?.length || 0, deepSources: deep.streams?.length || 0, freshSources: fresh.streams?.length || 0, yearCanonSources: yearCanon.streams?.length || 0 },
  stats, series, yearIndex, topicIndex, fanHall, fanHallPeople, characterIndex, episodes
};
fs.writeFileSync(path.join(DEMO, "wwam-livestream-canon.js"), `/* Generated by scripts/generate-wwam-livestream-canon.mjs. */\nwindow.WWAM_LIVESTREAM_CANON = ${JSON.stringify(payload)};\n`);
// Cold Show Wiki routes do not need the 65 MB full canon just to paint a
// useful page. Keep a compact, source-local shelf with the visitor summary
// and a bounded set of story/audio/fan doors; the full canon can still hydrate
// later when a visitor opens the deeper livestream tools.
const COLD_ROUTE_PRIORITY = ["STRAIGHT TO STEVE'S ASSHOLE", "WWAM UP IN YA", "CHARACTER SIGNAL", "FAN SIGNAL", "TAKE GETS NUCLEAR", "THE ROOM BREAKS"];
function chooseDiverseColdCuts(cuts, limit = 12) {
  const deduped = [];
  const seen = new Set();
  for (const cut of cuts) {
    const key = `${Math.round(Number(cut.at || 0))}|${String(cut.category || cut.label || "").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(cut);
  }
  const chosen = [];
  for (const lane of COLD_ROUTE_PRIORITY) {
    const match = deduped
      .filter((cut) => String(cut.category || cut.label || "").toUpperCase() === lane)
      .sort((left, right) => Number(right.score || 0) - Number(left.score || 0) || Number(left.at || 0) - Number(right.at || 0))[0];
    if (match) chosen.push(match);
    if (chosen.length >= limit) return chosen.sort((left, right) => Number(left.at || 0) - Number(right.at || 0));
  }
  const ranked = deduped.slice().sort((left, right) => Number(right.score || 0) - Number(left.score || 0) || Number(left.at || 0) - Number(right.at || 0));
  for (const cut of ranked) {
    if (chosen.length >= limit || chosen.includes(cut)) continue;
    const crowded = chosen.some((other) => Math.abs(Number(other.at || 0) - Number(cut.at || 0)) < 45 && cut.sourceKind === "audio-pass" && other.sourceKind === "audio-pass");
    if (crowded) continue;
    chosen.push(cut);
  }
  // Very short or sparse episodes may not have enough spaced candidates; fill
  // the remaining doors rather than silently shrinking the Show Wiki.
  for (const cut of deduped) {
    if (chosen.length >= limit) break;
    if (!chosen.includes(cut)) chosen.push(cut);
  }
  return chosen.sort((left, right) => Number(left.at || 0) - Number(right.at || 0));
}
const coldEpisodes = {};
episodes.forEach((episode) => {
  const cuts = [
    ...(episode.moments || []).map((moment) => ({ ...moment, at: moment.t, sourceKind: moment.sourceKind || "caption-route" })),
    ...(episode.watchPass?.candidates || []).map((candidate) => ({
      at: Number(candidate.t || 0), end: Number(candidate.end || candidate.t || 0),
      category: candidate.category || candidate.label || "LISTENING ROUTE",
      label: candidate.label || candidate.category || "LISTENING ROUTE",
      score: Number(candidate.score || 0), excerpt: candidate.captionExcerpt || candidate.excerpt || "",
      sourceKind: "audio-pass", reviewStatus: candidate.reviewStatus || "audio-feature-candidate; playback remains the authority",
    })),
    ...(episode.fanSignals || []).map((signal) => ({
      at: Number(signal.t || 0), end: Number(signal.end || signal.t || 0), category: "FAN SIGNAL",
      label: signal.signalType || "FAN SIGNAL", score: Number(signal.score || 0), excerpt: signal.excerpt || "",
      sourceKind: "fan-signal", reviewStatus: signal.reviewStatus || "machine-candidate",
    })),
  ].filter((cut) => Number.isFinite(Number(cut.at)) && Number(cut.at) > 0 && (cut.excerpt || cut.label));
  const boundedCuts = chooseDiverseColdCuts(cuts, 12)
    .map((cut) => ({ ...cut, excerpt: safeExcerpt(cut.excerpt || "", 14) }));
  coldEpisodes[episode.id] = {
    id: episode.id, title: episode.title, date: episode.date, duration: episode.duration,
    durationLabel: episode.durationLabel, topics: (episode.topics || []).slice(0, 8).map((topic) => ({
      name: topic.name, mentions: Number(topic.mentions || 0), at: Number(topic.at || topic.first || topic.peak || 0), peak: Number(topic.peak || topic.at || 0),
    })),
    summary: episode.dossier?.summary || "", moments: boundedCuts,
    dossier: { summary: episode.dossier?.summary || "" },
  };
});
const coldPayload = {
  schema: "shokker-wwam-livestream-cold-index/v1", generated: payload.generated,
  policy: "Compact source-local summaries and bounded playable doors for cold Show Wiki routes; the full canon remains the authority.",
  episodes: coldEpisodes,
};
fs.writeFileSync(path.join(DEMO, "wwam-livestream-cold-index.js"), `/* Generated from the livestream canon for cold Show Wiki routes. */\nwindow.WWAM_LIVESTREAM_COLD_INDEX = ${JSON.stringify(coldPayload)};\n`);
console.log(`Generated ${episodes.length} livestream episodes; ${stats.completionDossiers} completion dossiers, ${stats.distillDossiers} distill dossiers, ${stats.captionLedgers} caption ledgers, ${stats.sourceBriefs} source briefs.`);
