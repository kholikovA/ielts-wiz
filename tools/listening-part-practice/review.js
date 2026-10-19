// Listening transcript review (Part Practice). Inlined by build.mjs after the
// page's own scripts. Data comes from #iwReviewData (built from
// transcripts/test_N.txt); the grade comes from the page's submitTest(), which
// publishes window.__iwGrade and fires "iw:graded".
(function () {
  "use strict";
  var dataEl = document.getElementById("iwReviewData");
  if (!dataEl) return;
  var D = JSON.parse(dataEl.textContent);
  var grade = null;
  var built = false;
  var currentQ = null;
  var root, passage, right, foot, audio, playBtn, seek, timeLbl, followBox;
  var cueEls = [];
  var cueTimes = [];

  var ICON = {
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="4.5" height="16" rx="1"/><rect x="14.5" y="4" width="4.5" height="16" rx="1"/></svg>',
    ok: '<svg class="rv-mark correct" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    bad: '<svg class="rv-mark wrong" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    none: '<svg class="rv-mark unanswered" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    chev: '<svg class="rv-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    ear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>'
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmt(t) {
    if (!isFinite(t)) t = 0;
    var m = Math.floor(t / 60), s = Math.floor(t % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  // ---- evidence index: question -> { cue index, cue time, quote html }
  var EV = {};
  D.paras.forEach(function (para) {
    para.forEach(function (cue) {
      cue.parts.forEach(function (p) {
        if (typeof p === "object") EV[p.q] = { t: cue.t, cue: cue };
      });
    });
  });
  function quoteHtml(cue, q) {
    return cue.parts.map(function (p) {
      if (typeof p === "string") return esc(p);
      return p.q === q ? "<b>" + esc(p.x) + "</b>" : esc(p.x);
    }).join("");
  }

  // The grader's key lists every accepted spelling ("5/five km/kilometres",
  // "website / web site"); show the first one and keep the rest as a note.
  function primary(key) {
    var s = String(key == null ? "" : key);
    var tail = "";
    var m = s.match(/\s*\(in either order\)$/);
    if (m) { tail = " (in either order)"; s = s.slice(0, m.index); }
    return s.split(/\s*;\s*/).map(function (one) {
      return one.split(/\s+\/\s+|\s*\|\s*/)[0].split(/\s+/).map(function (w) {
        return w.indexOf("/") > 0 ? w.split("/")[0] : w;
      }).join(" ").replace(/(^|\s)\([^)]*\)\s+/g, "$1").replace(/\(([^)]*)\)/g, "$1").trim();
    }).join("; ") + tail;
  }
  function correctHtml(key) {
    var p = primary(key);
    var also = String(key).replace(/\s*\(in either order\)$/, "") !== p.replace(/ \(in either order\)$/, "");
    return '<span class="rv-correct">' + esc(p) + '</span>' + (also ? ' <span class="rv-also" title="' + esc(key) + '">(other spellings accepted)</span>' : '');
  }

  function statusOf(q) {
    var r = grade && grade.byQ[q];
    if (!r) return "unanswered";
    return r.unanswered ? "unanswered" : (r.correct ? "correct" : "wrong");
  }

  // ---- build the overlay once
  function build() {
    built = true;
    root = document.createElement("div");
    root.className = "rv-root";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-label", "Transcript and answers");
    root.innerHTML =
      '<header class="rv-top">'
      + '<button type="button" class="rv-back" id="rvBack">' + ICON.back + 'Results</button>'
      + '<h2 class="rv-title">' + esc(D.title) + ' · Transcript</h2>'
      + '<span class="rv-score" id="rvScore"></span>'
      + '</header>'
      + '<div class="rv-audio">'
      + '<button type="button" class="rv-play" id="rvPlay" aria-label="Play">' + ICON.play + '</button>'
      + '<span class="rv-time" id="rvTime">0:00 / 0:00</span>'
      + '<input type="range" class="rv-seek" id="rvSeek" min="0" max="1000" value="0" step="1" aria-label="Seek">'
      + '<select class="rv-speed" id="rvSpeed" aria-label="Playback speed"><option value="0.75">0.75x</option><option value="1" selected>1x</option><option value="1.25">1.25x</option><option value="1.5">1.5x</option></select>'
      + '<label class="rv-follow"><input type="checkbox" id="rvFollow" checked> Follow along</label>'
      + '</div>'
      + '<div class="rv-body"><div class="rv-passage" id="rvPassage"></div><div class="rv-right" id="rvRight"></div></div>'
      + '<footer class="rv-foot" id="rvFoot"></footer>';
    document.body.appendChild(root);
    passage = root.querySelector("#rvPassage");
    right = root.querySelector("#rvRight");
    foot = root.querySelector("#rvFoot");
    playBtn = root.querySelector("#rvPlay");
    seek = root.querySelector("#rvSeek");
    timeLbl = root.querySelector("#rvTime");
    followBox = root.querySelector("#rvFollow");

    audio = new Audio();
    audio.preload = "metadata";
    audio.src = D.audio;
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onTime);
    audio.addEventListener("play", function () { playBtn.innerHTML = ICON.pause; playBtn.setAttribute("aria-label", "Pause"); });
    audio.addEventListener("pause", function () { playBtn.innerHTML = ICON.play; playBtn.setAttribute("aria-label", "Play"); });
    playBtn.addEventListener("click", function () { if (audio.paused) audio.play().catch(function () {}); else audio.pause(); });
    seek.addEventListener("input", function () {
      if (audio.duration) audio.currentTime = (seek.value / 1000) * audio.duration;
    });
    root.querySelector("#rvSpeed").addEventListener("change", function (e) { audio.playbackRate = parseFloat(e.target.value) || 1; });
    root.querySelector("#rvBack").addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (!root.classList.contains("open")) return;
      if (e.key === "Escape") close();
    });

    renderPassage();
  }

  function renderPassage() {
    var h = '<h1 class="rv-passage-title">' + esc(D.title) + '</h1>'
      + '<p class="rv-passage-sub">Highlighted text shows where each answer is heard. Click any line to play the recording from there.</p>';
    var idx = 0;
    D.paras.forEach(function (para) {
      h += '<p class="rv-para">';
      para.forEach(function (cue, ci) {
        cueTimes.push(cue.t);
        h += (ci ? " " : "") + '<span class="rv-cue" data-i="' + idx + '" data-t="' + cue.t + '">';
        cue.parts.forEach(function (p) {
          if (typeof p === "string") { h += esc(p); return; }
          h += '<mark class="ev-span" id="rv-ev' + p.q + '" data-q="' + p.q + '"><sup class="ev-badge" data-q="' + p.q + '">Q' + p.q + '</sup>' + esc(p.x) + '</mark>';
        });
        h += '</span>';
        idx++;
      });
      h += '</p>';
    });
    passage.innerHTML = h;
    cueEls = Array.prototype.slice.call(passage.querySelectorAll(".rv-cue"));
    passage.addEventListener("click", function (e) {
      var mark = e.target.closest(".ev-span");
      if (mark) { select(+mark.dataset.q, { scrollPassage: false }); return; }
      var cue = e.target.closest(".rv-cue");
      if (cue) playFrom(+cue.dataset.t);
    });
  }

  function renderRight() {
    var byQ = grade ? grade.byQ : {};
    var h = "";
    D.groups.forEach(function (g) {
      h += '<div class="rv-group-head">' + esc(g.label) + '</div>';
      if (g.multi) { h += rowMulti(g, byQ); return; }
      g.nums.forEach(function (n) { h += rowSingle(n, byQ[n]); });
    });
    right.innerHTML = h;
    right.querySelectorAll("[data-sel]").forEach(function (b) {
      b.addEventListener("click", function () { select(+b.dataset.sel, { scrollRight: false }); });
    });
    right.querySelectorAll("[data-play]").forEach(function (b) {
      b.addEventListener("click", function () { var q = +b.dataset.play; select(q, { scrollRight: false }); playFrom(EV[q] ? EV[q].t : 0); });
    });
    right.querySelectorAll("[data-explain]").forEach(function (b) {
      b.addEventListener("click", function () {
        var panel = right.querySelector("#rv-panel" + b.dataset.explain);
        var open = panel.hidden;
        panel.hidden = !open;
        b.classList.toggle("open", open);
        b.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
    right.querySelectorAll("[data-jump]").forEach(function (b) {
      b.addEventListener("click", function () { select(+b.dataset.jump, { scrollRight: false }); });
    });

    var score = grade ? grade.correct + " / " + grade.total + " correct" : "";
    root.querySelector("#rvScore").textContent = score;

    var f = '<span class="rv-foot-label">Questions</span>';
    D.order.forEach(function (n) {
      f += '<button type="button" class="rv-chip ' + statusOf(n) + '" data-chip="' + n + '">' + n + '</button>';
    });
    foot.innerHTML = f;
    foot.querySelectorAll("[data-chip]").forEach(function (b) {
      b.addEventListener("click", function () { select(+b.dataset.chip, {}); });
    });

    // colour the transcript badges by result
    passage.querySelectorAll(".ev-badge").forEach(function (b) {
      b.classList.remove("correct", "wrong");
      var st = statusOf(+b.dataset.q);
      if (st !== "unanswered") b.classList.add(st);
    });
  }

  function promptHtml(n) {
    var p = D.prompts[n];
    if (!p) return '<span class="rv-blank">Question ' + n + '</span>';
    return esc(p).replace(/\{\{_\}\}/g, '<span class="rv-gap"></span>');
  }
  function explainPanel(key, qs) {
    var h = '<div class="rv-q-panel" id="rv-panel' + key + '" hidden>';
    var quotes = qs.filter(function (q) { return EV[q]; });
    if (quotes.length) {
      h += '<div class="rv-ev"><div class="rv-ev-label">In the recording</div>';
      quotes.forEach(function (q) {
        h += '<blockquote class="rv-ev-quote" data-jump="' + q + '" title="Show in transcript">'
          + (qs.length > 1 ? '<span class="rv-ev-q">Q' + q + '</span>' : '')
          + '“' + quoteHtml(EV[q].cue, q) + '”</blockquote>';
      });
      h += '</div>';
    }
    var whys = qs.map(function (q) { return D.why[q]; }).filter(Boolean);
    if (whys.length) {
      h += '<div class="rv-why"><div class="rv-why-label">Why</div>' + whys.map(function (w) { return '<p>' + esc(w) + '</p>'; }).join("") + '</div>';
    }
    return h + '</div>';
  }
  function actions(key, q) {
    return '<div class="rv-actions">'
      + '<button type="button" class="rv-btn" data-explain="' + key + '" aria-expanded="false">' + ICON.chev + 'Explain</button>'
      + (EV[q] ? '<button type="button" class="rv-btn" data-play="' + q + '">' + ICON.ear + 'Listen from ' + fmt(EV[q].t) + '</button>' : '')
      + '</div>';
  }
  function rowSingle(n, r) {
    var st = statusOf(n);
    var mark = st === "correct" ? ICON.ok : st === "wrong" ? ICON.bad : ICON.none;
    var ans;
    if (!r) ans = '<span class="rv-ans"><span class="rv-ans-label">Answer</span>' + correctHtml(D.answers[n]) + '</span>';
    else if (st === "correct") ans = '<span class="rv-ans"><span class="rv-ans-label">Your answer</span><span class="rv-your correct">' + esc(r.user) + '</span></span>';
    else ans = '<span class="rv-ans"><span class="rv-ans-label">Your answer</span>' + (r.user ? '<span class="rv-your wrong">' + esc(r.user) + '</span>' : '<span class="rv-blank">No answer</span>') + '</span>'
      + '<span class="rv-ans"><span class="rv-ans-label">Correct</span>' + correctHtml(r.answer) + '</span>';
    return '<div class="rv-q ' + st + '" id="rv-q' + n + '">'
      + '<button type="button" class="rv-q-head" data-sel="' + n + '"><span class="rv-q-num ' + st + '">' + n + '</span><span class="rv-q-prompt">' + promptHtml(n) + '</span>' + mark + '</button>'
      + '<div class="rv-q-answers">' + ans + '</div>'
      + actions(n, n) + explainPanel(n, [n])
      + '</div>';
  }
  function rowMulti(g, byQ) {
    var first = g.nums[0];
    var r = byQ[first];
    var m = r && r.multi;
    var hits = g.nums.filter(function (n) { return statusOf(n) === "correct"; }).length;
    var st = !r ? "unanswered" : hits === g.nums.length ? "correct" : (g.nums.every(function (n) { return statusOf(n) === "unanswered"; }) ? "unanswered" : "wrong");
    var mark = st === "correct" ? ICON.ok : st === "wrong" ? ICON.bad : ICON.none;
    var ans = m
      ? '<span class="rv-ans"><span class="rv-ans-label">Your answers</span>' + m.userHtml + '</span>'
        + '<span class="rv-ans"><span class="rv-ans-label">Correct</span>' + m.correctHtml + ' <span class="rv-blank">(' + m.hits + '/' + m.size + ')</span></span>'
      : '<span class="rv-ans"><span class="rv-ans-label">Answer</span>' + correctHtml(D.answers[first]) + '</span>';
    var ids = g.nums.map(function (n) { return '<span id="rv-q' + n + '"></span>'; }).join("");
    return '<div class="rv-q ' + st + '" id="rv-qg' + first + '">' + ids
      + '<button type="button" class="rv-q-head" data-sel="' + first + '"><span class="rv-q-num ' + st + '">' + g.nums[0] + '–' + g.nums[g.nums.length - 1] + '</span><span class="rv-q-prompt">' + promptHtml(first) + '</span>' + mark + '</button>'
      + '<div class="rv-q-answers">' + ans + '</div>'
      + actions("g" + first, first) + explainPanel("g" + first, g.nums)
      + '</div>';
  }

  // ---- selection + audio
  function select(q, opt) {
    opt = opt || {};
    currentQ = q;
    root.querySelectorAll(".ev-span.current").forEach(function (el) { el.classList.remove("current"); });
    root.querySelectorAll(".rv-q.current, .rv-chip.current").forEach(function (el) { el.classList.remove("current"); });
    var ev = passage.querySelector("#rv-ev" + q);
    if (ev) {
      ev.classList.add("current");
      if (opt.scrollPassage !== false) ev.scrollIntoView({ behavior: "smooth", block: "center" });
      ev.classList.remove("flash"); void ev.offsetWidth; ev.classList.add("flash");
    }
    var row = right.querySelector("#rv-q" + q);
    var card = row && (row.classList.contains("rv-q") ? row : row.closest(".rv-q"));
    if (card) {
      card.classList.add("current");
      if (opt.scrollRight !== false) card.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    var chip = foot.querySelector('[data-chip="' + q + '"]');
    if (chip) chip.classList.add("current");
  }
  // Seeking only sticks once the metadata is in, so wait for it on first use.
  function playFrom(t) {
    var go = function () {
      try { audio.currentTime = Math.max(0, t - 0.6); } catch (e) {}
      audio.play().catch(function () {});
    };
    if (audio.readyState >= 1) go();
    else { audio.addEventListener("loadedmetadata", go, { once: true }); audio.load(); }
  }
  var lastCue = -1;
  function onTime() {
    var d = audio.duration || 0, t = audio.currentTime || 0;
    timeLbl.textContent = fmt(t) + " / " + fmt(d);
    if (d) seek.value = Math.round((t / d) * 1000);
    // the cue being spoken: last cue whose start <= t
    var lo = 0, hi = cueTimes.length - 1, k = -1;
    while (lo <= hi) { var mid = (lo + hi) >> 1; if (cueTimes[mid] <= t + 0.05) { k = mid; lo = mid + 1; } else hi = mid - 1; }
    if (audio.paused && t === 0) k = -1;
    if (k === lastCue) return;
    if (lastCue >= 0 && cueEls[lastCue]) cueEls[lastCue].classList.remove("speaking");
    lastCue = k;
    if (k >= 0 && cueEls[k]) {
      cueEls[k].classList.add("speaking");
      if (followBox.checked && !audio.paused) {
        var box = passage.getBoundingClientRect(), r = cueEls[k].getBoundingClientRect();
        if (r.top < box.top + 40 || r.bottom > box.bottom - 40) cueEls[k].scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }

  function open(q) {
    if (!built) build();
    renderRight();
    try { var a = document.getElementById("testAudio"); if (a) a.pause(); } catch (e) {}
    root.classList.add("open");
    document.body.classList.add("rv-active");
    passage.scrollTop = 0;
    right.scrollTop = 0;
    if (q) select(q, {});
  }
  function close() {
    if (audio) audio.pause();
    root.classList.remove("open");
    document.body.classList.remove("rv-active");
  }

  function setGrade(g) {
    var byQ = {};
    (g.rows || []).forEach(function (r) { byQ[r.q] = r; });
    grade = { byQ: byQ, correct: g.correct, total: g.total };
    var btn = document.getElementById("rvOpenBtn");
    if (btn) btn.hidden = false;
    if (built && root.classList.contains("open")) renderRight();
  }
  if (window.__iwGrade) setGrade(window.__iwGrade);
  document.addEventListener("iw:graded", function (e) { setGrade(e.detail); });

  // Entry point on the results screen.
  var host = document.getElementById("resultsStats");
  if (host && host.parentNode) {
    var b = document.createElement("button");
    b.type = "button";
    b.id = "rvOpenBtn";
    b.className = "rv-open-btn";
    b.innerHTML = ICON.doc + "Transcript &amp; answer locations";
    b.hidden = !grade;
    b.addEventListener("click", function () { open(null); });
    host.parentNode.insertBefore(b, host.nextSibling);
  }
})();
