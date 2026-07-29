(function (root) {
  "use strict";

  var VERSION = "2.4.3";
  var POLICY = "strict-origin-when-cross-origin";
  var VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
  var HOSTED_PLAYER =
    "https://wwam-after-midnight.downndirtytn.chatgpt.site/demo/media-bridge.html";

  function pageIdentity() {
    var location = root.location || {};
    var origin = /^https?:$/.test(location.protocol || "") &&
      location.origin && location.origin !== "null"
      ? location.origin
      : "";
    return {
      origin: origin,
      pathname: String(location.pathname || "/"),
      referrer: origin ? origin + String(location.pathname || "/") : ""
    };
  }

  function bridgeUrl(forceHosted) {
    if (forceHosted === true) return HOSTED_PLAYER;
    var identity = pageIdentity();
    if (!identity.origin) return HOSTED_PLAYER;
    var directory = /\/$/.test(identity.pathname)
      ? identity.pathname
      : identity.pathname.replace(/[^/]*$/, "");
    return identity.origin + (directory || "/") + "media-bridge.html";
  }

  function playerQuery(options) {
    var config = options || {};
    var query = new URLSearchParams();
    query.set("autoplay", config.autoplay ? "1" : "0");
    query.set("enablejsapi", "1");
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
    if (identity.referrer) {
      query.set("widget_referrer", identity.referrer);
    }
    if (identity.origin && config.forceHostedBridge !== true) {
      query.set("origin", identity.origin);
      return "https://www.youtube.com/embed/" + encodeURIComponent(id) +
        "?" + query.toString();
    }
    query.set("video", id);
    return bridgeUrl(config.forceHostedBridge === true) + "?" + query.toString();
  }

  function escapeAttribute(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function iframe(videoId, options) {
    var config = options || {};
    if (!Object.prototype.hasOwnProperty.call(config, "forceHostedBridge")) {
      config = Object.assign({}, config, { forceHostedBridge: true });
    }
    var src = embedUrl(videoId, config);
    if (!src) return "";
    var start = Number.isFinite(Number(config.start))
      ? Math.max(0, Math.round(Number(config.start)))
      : 0;
    var end = Number.isFinite(Number(config.end)) && Number(config.end) > start
      ? Math.max(1, Math.round(Number(config.end)))
      : "";
    var title = config.title || "Official YouTube source playback";
    var recoveryCopy = config.forceHostedBridge === true
      ? "RELOAD PLAYER" : "HAVING TROUBLE? TRY RECOVERY";
    return '<div class="shokker-youtube-player" data-shokker-youtube-player' +
      ' data-video-id="' + escapeAttribute(videoId) +
      '" data-start="' + start +
      '" data-end="' + end +
      '" data-autoplay="' + (config.autoplay ? "1" : "0") +
      '" data-title="' + escapeAttribute(title) + '">' +
      '<iframe src="' + escapeAttribute(src) +
      '" title="' + escapeAttribute(config.title || "Official YouTube source playback") +
      '" referrerpolicy="' + POLICY +
      '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowfullscreen></iframe>' +
      '<button class="shokker-youtube-recover" type="button"' +
      ' data-shokker-youtube-recover aria-label="Reload this source inside the page">' +
      escapeAttribute(recoveryCopy) + '</button></div>';
  }

  function recoverPlayer(button) {
    var player = button && button.closest
      ? button.closest("[data-shokker-youtube-player]")
      : null;
    var frame = player && player.querySelector ? player.querySelector("iframe") : null;
    if (!player || !frame) return;
    var start = Number(player.getAttribute("data-start"));
    var end = Number(player.getAttribute("data-end"));
    var src = embedUrl(player.getAttribute("data-video-id"), {
      autoplay: player.getAttribute("data-autoplay") === "1",
      start: Number.isFinite(start) ? start : 0,
      end: Number.isFinite(end) && end > start ? end : undefined,
      forceHostedBridge: true
    });
    if (!src) return;
    frame.setAttribute("src", src);
    button.textContent = "RECOVERY PLAYER LOADED";
    button.setAttribute("aria-label", "Recovery player loaded for this source");
    button.disabled = true;
  }

  if (root.document && root.document.addEventListener) {
    root.document.addEventListener("click", function (event) {
      var button = event.target && event.target.closest
        ? event.target.closest("[data-shokker-youtube-recover]")
        : null;
      if (button) recoverPlayer(button);
    });
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
    version: VERSION,
    referrerPolicy: POLICY,
    hosted: function () { return Boolean(pageIdentity().origin); },
    bridgeUrl: bridgeUrl,
    embedUrl: embedUrl,
    iframe: iframe,
    recoverPlayer: recoverPlayer,
    playerVars: playerVars
  });
})(window);
