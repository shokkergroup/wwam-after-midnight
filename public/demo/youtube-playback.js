(function (root) {
  "use strict";

  var POLICY = "strict-origin-when-cross-origin";
  var VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
  var HOSTED_PLAYER =
    "https://wwam-after-midnight.downndirtytn.chatgpt.site/demo/youtube-player.html";

  function pageIdentity() {
    var location = root.location || {};
    var origin = /^https?:$/.test(location.protocol || "") &&
      location.origin && location.origin !== "null"
      ? location.origin
      : "";
    return { origin: origin };
  }

  function playerQuery(options) {
    var config = options || {};
    var query = new URLSearchParams();
    query.set("autoplay", config.autoplay ? "1" : "0");
    query.set("rel", "0");
    query.set("playsinline", "1");
    if (Number.isFinite(Number(config.start))) {
      query.set("start", String(Math.max(0, Math.round(Number(config.start)))));
    }
    if (
      Number.isFinite(Number(config.end)) &&
      Number(config.end) > Number(config.start || 0)
    ) {
      query.set("end", String(Math.max(1, Math.round(Number(config.end)))));
    }
    return query;
  }

  function embedUrl(videoId, options) {
    var id = String(videoId || "");
    if (!VIDEO_ID.test(id)) return "";
    var config = options || {};
    var query = playerQuery(config);
    var identity = pageIdentity();
    if (identity.origin && config.forceHostedBridge !== true) {
      query.set("origin", identity.origin);
      return "https://www.youtube.com/embed/" + encodeURIComponent(id) +
        "?" + query.toString();
    }
    query.set("video", id);
    return HOSTED_PLAYER + "?" + query.toString();
  }

  function escapeAttribute(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function iframe(videoId, options) {
    var config = options || {};
    var src = embedUrl(videoId, config);
    if (!src) return "";
    return '<iframe src="' + escapeAttribute(src) +
      '" title="' + escapeAttribute(config.title || "Official YouTube source playback") +
      '" referrerpolicy="' + POLICY +
      '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
  }

  function playerVars(options) {
    var config = options || {};
    var output = {
      autoplay: config.autoplay ? 1 : 0,
      controls: 1,
      rel: 0,
      playsinline: 1,
      start: Math.max(0, Math.floor(Number(config.start) || 0))
    };
    var identity = pageIdentity();
    if (identity.origin) {
      output.origin = identity.origin;
    }
    return output;
  }

  root.ShokkerYouTubePlayback = Object.freeze({
    referrerPolicy: POLICY,
    hosted: function () { return Boolean(pageIdentity().origin); },
    embedUrl: embedUrl,
    iframe: iframe,
    playerVars: playerVars
  });
})(window);
