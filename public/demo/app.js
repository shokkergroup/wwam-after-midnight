(function () {
"use strict";
var catalog = window.WWAM_CATALOG || [];
var grid = document.getElementById("vaultGrid");
var activeFranchise = "Halloween";
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
function dur(s) { s = Math.round(s || 0); return Math.floor(s / 3600) + ":" + String(Math.floor(s % 3600 / 60)).padStart(2,"0") + ":" + String(s % 60).padStart(2,"0"); }
function date(s) { if (!s) return "DATE BURIED"; var d = new Date(s + "T12:00:00"); return d.toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"}).toUpperCase(); }
function renderProof() {
  var seconds = catalog.reduce(function (sum,item) { return sum + (item.duration || 0); },0);
  var transcripts = catalog.filter(function (item) { return item.transcript; }).length;
  document.getElementById("proof").innerHTML =
    '<div><b>' + catalog.length + '</b><span>VERIFIED COMMENTARIES</span></div><div><b>' + Math.round(seconds / 3600) +
    '</b><span>HOURS IN THE BASEMENT</span></div><div><b>2</b><span>COMPLETE FRANCHISE PATHS</span></div><div><b>' +
    transcripts + '</b><span>SEARCH-READY TAPES</span></div>';
}
function card(item) {
  return '<article class="card" data-id="' + item.id + '"><div class="thumb"><img loading="lazy" src="' + esc(item.thumbnail) +
    '" alt=""><i>' + esc(item.franchise === "Halloween" ? "MICHAEL" : "JASON") + '</i><b>▶ ' + dur(item.duration) +
    '</b></div><div class="card-body"><span>TAPE ' + String(item.order).padStart(2,"0") + ' · ' + date(item.date) + '</span><h3>' +
    esc(item.film) + '</h3><p>' + esc(item.title) + '</p><div><em>' + (item.transcript ? "TAPE SEARCH READY" : "TRANSCRIPT NEXT") +
    '</em><button>PLAY COMMENTARY</button></div></div></article>';
}
function renderVault(filter) {
  var list = catalog.filter(function (item) { return filter === "all" || item.franchise === filter || (filter === "captioned" && item.transcript); });
  document.getElementById("vaultCount").textContent = list.length + " TAPES";
  grid.innerHTML = list.map(card).join("");
  Array.prototype.forEach.call(grid.querySelectorAll(".card"), function (el) {
    el.onclick = function () { play(el.getAttribute("data-id")); };
  });
}
function renderTrauma(franchise) {
  activeFranchise = franchise;
  var list = catalog.filter(function (item) { return item.franchise === franchise; }).sort(function (a,b) { return a.order-b.order; });
  document.getElementById("traumaLine").innerHTML = list.map(function (item) {
    return '<button data-id="' + item.id + '"><i>' + String(item.order).padStart(2,"0") + '</i><span>' + esc(item.film) + '</span><b>' +
      (item.duration ? dur(item.duration) : "GATED") + '</b></button>';
  }).join("");
  Array.prototype.forEach.call(document.querySelectorAll("#traumaLine button"), function (button) { button.onclick = function () { play(button.getAttribute("data-id")); }; });
}
function play(id) {
  var item = catalog.filter(function (x) { return x.id === id; })[0]; if (!item) return;
  document.getElementById("ytFrame").src = "https://www.youtube.com/embed/" + id + "?autoplay=1&rel=0";
  document.getElementById("playingTitle").textContent = item.film;
  document.getElementById("youtubeLink").href = item.url;
  document.getElementById("playerModal").classList.add("show");
}
function close() { document.getElementById("playerModal").classList.remove("show"); document.getElementById("ytFrame").src = ""; }
Array.prototype.forEach.call(document.querySelectorAll(".filters button"), function (button) {
  button.onclick = function () {
    Array.prototype.forEach.call(document.querySelectorAll(".filters button"), function (x) { x.classList.remove("on"); });
    button.classList.add("on"); renderVault(button.getAttribute("data-filter"));
  };
});
Array.prototype.forEach.call(document.querySelectorAll(".switch button"), function (button) {
  button.onclick = function () {
    Array.prototype.forEach.call(document.querySelectorAll(".switch button"), function (x) { x.classList.remove("on"); });
    button.classList.add("on"); renderTrauma(button.getAttribute("data-franchise"));
  };
});
document.getElementById("randomBtn").onclick = function () { var item = catalog[Math.floor(Math.random()*catalog.length)]; if (item) play(item.id); };
document.getElementById("closePlayer").onclick = close;
document.getElementById("playerModal").onclick = function (e) { if (e.target.id === "playerModal") close(); };
function ask() {
  var q = document.getElementById("askQ").value.trim().toLowerCase(); if (q.length < 2) return;
  var synonyms = q.indexOf("space") >= 0 ? ["jason x"] : q.indexOf("manhattan") >= 0 ? ["manhattan"] : q.indexOf("rob zombie") >= 0 ? ["rob zombie"] : q.split(/\s+/);
  var hits = catalog.filter(function (item) { var hay = (item.film + " " + item.title + " " + item.franchise).toLowerCase(); return synonyms.some(function (term) { return hay.indexOf(term) >= 0; }); });
  document.getElementById("askAnswer").innerHTML = hits.length ?
    'I found <b>' + hits.length + '</b> verified tape' + (hits.length === 1 ? "" : "s") + ': ' + hits.slice(0,5).map(function (item) { return '<button data-id="' + item.id + '">' + esc(item.film) + ' ▶</button>'; }).join(" ") :
    'Nothing confident in the first-pass canon. The deep transcript distill is what turns this into a real conversation with the show.';
  Array.prototype.forEach.call(document.querySelectorAll("#askAnswer button"), function (button) { button.onclick = function () { play(button.getAttribute("data-id")); }; });
}
document.getElementById("askBtn").onclick = ask;
document.getElementById("askQ").onkeydown = function (e) { if (e.key === "Enter") ask(); };
renderProof(); renderVault("all"); renderTrauma(activeFranchise);
})();

