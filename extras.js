/* Birthday extras: the newspaper (near the end of the birthday page) and the four things its
   highlighted stories open: a search page, a billboard, a cinema screen and a magazine. */
(() => {
  const C = window.CONTENT;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const img = (n) => `assets/img/${n}.jpg`;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const chunks = (w) => w.match(/[ঀ-৿](?:[া-ৌৗঁ-ঃ্][ঀ-৿]?)*|./g) || [w];
  const NAME = C.callName;             // মোবাশ্বিরা
  const HEAD = `আজ ${NAME}র জন্মদিন`;

  /* ---------------- newspaper ---------------- */
  const sun = `<svg viewBox="-60 -60 120 120" aria-hidden="true">${Array.from({ length: 16 }, (_, i) => `<path d="M0 -34 C -6 -44, -5 -54, 0 -58 C 5 -54, 6 -44, 0 -34 Z" fill="${i % 2 ? "#E59E0C" : "#F2B01E"}" transform="rotate(${i * 22.5})"/>`).join("")}<circle r="33" fill="#5B3A1E"/></svg>`;
  const stories = [
    { xp: "google", pic: "glasses-chin", text: "গুগলে সার্চ করলেও দেখা যাচ্ছে, " + HEAD },
    { xp: "billboard", pic: "b-pink-garden", text: "দেশের রাস্তায় রাস্তায় বিলবোর্ডে জন্মদিনের শুভেচ্ছা" },
    { xp: "cinema", pic: "b-kashful-smile", text: "সিনেমা হলের পর্দা খুলতেই ভেসে উঠছে শুভ জন্মদিন" },
    { xp: "magazine", pic: "blue-jhumka", text: "জন্মদিন উপলক্ষে বেরিয়েছে বিশেষ ম্যাগাজিন" }
  ];
  const sec = document.createElement("section");
  sec.className = "b-sec b-news"; sec.id = "bNews"; sec.setAttribute("aria-label", "আজকের পত্রিকা");
  sec.innerHTML = `
    <h2 class="torn torn-title rv">আজকের পত্রিকা</h2>
    <p class="b-hint rv">হাইলাইট করা খবরে ক্লিক করুন</p>
    <article class="np rv">
      <div class="np-top"><span>রবিবার, ৬ ডিসেম্বর ২০২৬</span><span>২১ অগ্রহায়ণ ১৪৩৩</span></div>
      <div class="np-mast">${sun}<span>প্রথম দেখা</span></div>
      <div class="np-rule"></div>
      <h3 class="np-head">${HEAD}</h3>
      <figure class="np-photo"><img src="${img(C.heroPhoto)}" alt="" loading="lazy"></figure>
      <div class="np-grid">${stories.map((s) => `
        <button type="button" class="np-hl" data-xp="${s.xp}">
          <img src="${img(s.pic)}" alt="" loading="lazy">
          <span class="np-hl-t"><mark>${s.text}</mark><small>দেখুন ›</small></span>
        </button>`).join("")}
      </div>
    </article>`;
  const end = $("#bEnd");
  end.parentNode.insertBefore(sec, end);
  // the page's own reveal-on-scroll: mark these visible when they scroll in
  const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.15 }) : null;
  $$(".rv", sec).forEach((el) => io ? io.observe(el) : el.classList.add("in"));

  /* ---------------- the full-screen viewer ---------------- */
  const xp = document.createElement("div");
  xp.className = "xp"; xp.hidden = true;
  xp.setAttribute("role", "dialog"); xp.setAttribute("aria-modal", "true");
  xp.innerHTML = `<div class="xp-stage" id="xpStage"></div><button type="button" class="xp-close" aria-label="বন্ধ করুন">✕</button>`;
  document.body.appendChild(xp);
  xp.insertAdjacentHTML("afterbegin", `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><clipPath id="xpHeart" clipPathUnits="objectBoundingBox"><path d="M .5 .93 C .2 .72, 0 .54, 0 .3 C 0 .12, .14 0, .3 0 C .4 0, .47 .06, .5 .15 C .53 .06, .6 0, .7 0 C .86 0, 1 .12, 1 .3 C 1 .54, .8 .72, .5 .93 Z"/></clipPath></svg>`);
  const stage = $("#xpStage");
  let timers = [], ac = null;
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  function audio() {
    if (!ac) { const A = window.AudioContext || window.webkitAudioContext; if (A) ac = new A(); }
    if (ac && ac.state === "suspended") ac.resume();
    return ac;
  }
  function open(kind) {
    timers.forEach(clearTimeout); timers = [];
    stage.className = "xp-stage xp-" + kind;
    xp.setAttribute("aria-label", { google: "সার্চ", billboard: "বিলবোর্ড", cinema: "সিনেমা হল", magazine: "ম্যাগাজিন" }[kind]);
    xp.hidden = false; document.body.classList.add("xp-on");
    ({ google, billboard, cinema, magazine })[kind]();
    $(".xp-close", xp).focus({ preventScroll: true });
  }
  function close() {
    timers.forEach(clearTimeout); timers = [];
    xp.hidden = true; stage.innerHTML = ""; document.body.classList.remove("xp-on");
  }
  $(".xp-close", xp).addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !xp.hidden) close(); });
  sec.addEventListener("click", (e) => { const b = e.target.closest("[data-xp]"); if (b) open(b.dataset.xp); });

  /* ---------------- 1. search page with live typing ---------------- */
  const GCOL = ["#4285F4", "#EA4335", "#FBBC05", "#4285F4", "#34A853", "#EA4335"];
  const logo = (cls) => `<span class="${cls}">${chunks(NAME).map((c, i) => `<span style="color:${GCOL[i % GCOL.length]}">${c}</span>`).join("")}</span>`;
  function key(kind) {
    const a = audio(); if (!a) return;
    const len = kind === "enter" ? 0.09 : 0.035;
    const buf = a.createBuffer(1, Math.floor(a.sampleRate * len), a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
    const src = a.createBufferSource(); src.buffer = buf;
    const f = a.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = kind === "space" ? 900 : kind === "enter" ? 700 : 1800 + Math.random() * 1600; f.Q.value = 1.2;
    const g = a.createGain(); g.gain.value = kind === "enter" ? 0.9 : 0.55;
    src.connect(f); f.connect(g); g.connect(a.destination); src.start();
  }
  function google() {
    stage.innerHTML = `
      <div class="gs-home" id="gsHome">
        ${logo("gs-logo")}
        <div class="gs-box"><svg viewBox="0 0 24 24" class="gs-ic"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="#9AA0A6" stroke-width="2"/><path d="M15.5 15.5 L21 21" stroke="#9AA0A6" stroke-width="2" stroke-linecap="round"/></svg><span class="gs-q" id="gsQ"></span><span class="gs-caret"></span></div>
        <ul class="gs-sug" id="gsSug" hidden></ul>
        <div class="gs-btns"><button type="button" class="gs-btn" id="gsGo" disabled>সার্চ করুন</button><button type="button" class="gs-btn" tabindex="-1">আজকের দিনটা দেখি</button></div>
        <p class="gs-hint" id="gsHint"></p>
      </div>
      <div class="gs-res" id="gsRes" hidden></div>`;
    const q = $("#gsQ"), sug = $("#gsSug"), go = $("#gsGo");
    const parts = chunks(HEAD);
    let i = 0;
    const type = () => {
      if (i >= parts.length) {
        go.disabled = false; go.classList.add("ready");
        $("#gsHint").textContent = "সার্চ করতে ক্লিক করুন";
        return;
      }
      const ch = parts[i++];
      q.textContent += ch;
      key(ch === " " ? "space" : "key");
      if (i > 3) {
        sug.hidden = false;
        const typed = q.textContent;
        sug.innerHTML = [HEAD, `${NAME}র জন্মদিন কবে`, `${NAME}র জন্মদিনের শুভেচ্ছা`].map((s) => `<li>${s.startsWith(typed) ? `<span>${typed}</span><b>${s.slice(typed.length)}</b>` : s}</li>`).join("");
      }
      later(type, ch === " " ? 260 : 120 + (i * 37) % 140);
    };
    later(type, calm ? 50 : 900);
    go.addEventListener("click", () => { key("enter"); results(); });
  }
  function results() {
    $("#gsHome").hidden = true;
    const r = $("#gsRes"); r.hidden = false;
    const pics = ["hero-pink-wall", "b-kashful-smile", "blue-jhumka", "b-deck-smile", "glasses-chin", "m38-swing"];
    r.innerHTML = `
      <header class="gr-head">${logo("gr-logo")}<div class="gr-box">${HEAD}</div></header>
      <nav class="gr-tabs"><span class="on">সব</span><span>ছবি</span><span>খবর</span><span>ভিডিও</span></nav>
      <p class="gr-count">প্রায় ২৬৬টি ফলাফল (০.০৬ সেকেন্ড)</p>
      <div class="gr-card">
        <div class="gr-balloons" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
        <img src="${img(C.heroPhoto)}" alt="">
        <p class="gr-big">${HEAD}</p>
        <p class="gr-sub">রবিবার, ৬ ডিসেম্বর</p>
      </div>
      <div class="gr-imgs">${pics.map((p) => `<img src="${img(p)}" alt="" loading="lazy">`).join("")}</div>
      <article class="gr-item"><p class="gr-site">প্রথম দেখা</p><h4>${HEAD}</h4><p>শহরজুড়ে উৎসবের আমেজ।</p></article>
      <article class="gr-item"><p class="gr-site">My Favourite Notification</p><h4>শুভ জন্মদিন, ${NAME}</h4><p>Life is so beautiful with you..</p></article>`;
    r.scrollTop = 0;
    if (!calm) confetti(r);
  }
  function confetti(host) {
    const cols = ["#4285F4", "#EA4335", "#FBBC05", "#34A853", "#D9578C"];
    for (let i = 0; i < 60; i++) {
      const s = document.createElement("i");
      s.className = "xp-conf";
      s.style.left = (i * 37) % 100 + "%";
      s.style.background = cols[i % cols.length];
      s.style.animationDelay = (i % 12) * 0.08 + "s";
      s.style.animationDuration = 2.2 + (i % 5) * 0.4 + "s";
      host.appendChild(s);
      later(() => s.remove(), 5000);
    }
  }

  /* ---------------- 2. billboard on the road ---------------- */
  function billboard() {
    const bld = Array.from({ length: 14 }, (_, i) => {
      const w = 40 + (i * 23) % 50, h = 90 + (i * 61) % 170, x = i * 62 - 20;
      const win = Array.from({ length: Math.floor(h / 22) * 2 }, (_, k) => (k * 7 + i) % 3 ? "" : `<rect x="${x + 8 + (k % 2) * (w / 2 - 4)}" y="${400 - h + 10 + Math.floor(k / 2) * 22}" width="8" height="10" fill="#FFD98A" opacity=".8"/>`).join("");
      return `<rect x="${x}" y="${400 - h}" width="${w}" height="${h}" fill="#1B2036"/>${win}`;
    }).join("");
    stage.innerHTML = `
      <div class="bb-scene">
        <div class="bb-sky"></div>
        <svg class="bb-city" viewBox="0 0 860 400" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${bld}</svg>
        <div class="bb-board">
          <div class="bb-lamps"><i></i><i></i><i></i></div>
          <div class="bb-face">
            <img src="${img("b-pink-garden")}" alt="">
            <div class="bb-txt"><p class="bb-wish">শুভ জন্মদিন</p><p class="bb-name">${NAME}</p><p class="bb-date">৬ ডিসেম্বর</p></div>
          </div>
          <div class="bb-poles"><i></i><i></i></div>
        </div>
        <div class="bb-road"><div class="bb-lane"></div></div>
        <div class="bb-cars"><i class="c1"></i><i class="c2"></i><i class="c3"></i></div>
        <div class="bb-lights"><i></i><i></i></div>
      </div>`;
    later(() => stage.classList.add("lit"), calm ? 0 : 900);
  }

  /* ---------------- 3. cinema: curtains open, the screen fills ---------------- */
  function cinema() {
    const shots = ["b-kashful-smile", "hero-pink-wall", "m38-swing"];
    stage.innerHTML = `
      <div class="cn-hall">
        <div class="cn-screen">
          <div class="cn-count" id="cnCount"><span>৩</span></div>
          ${shots.map((s, k) => `<img class="cn-shot s${k}" src="${img(s)}" alt="">`).join("")}
          <div class="cn-title"><p>শুভ জন্মদিন</p><p class="cn-name">${NAME}</p></div>
          <div class="cn-grain"></div>
        </div>
        <div class="cn-valance"></div>
        <div class="cn-curtain l"></div><div class="cn-curtain r"></div>
        <div class="cn-beam"></div>
        <div class="cn-seats">${Array.from({ length: 2 }, (_, r) => `<div class="row r${r}">${"<i></i>".repeat(9 + r)}</div>`).join("")}</div>
      </div>`;
    const cnt = $("#cnCount span");
    later(() => stage.classList.add("open"), calm ? 0 : 1400);
    if (calm) { stage.classList.add("play"); return; }
    later(() => { stage.classList.add("count"); }, 4400);
    later(() => { cnt.textContent = "২"; }, 5400);
    later(() => { cnt.textContent = "১"; }, 6400);
    later(() => { stage.classList.remove("count"); stage.classList.add("play"); }, 7400);
  }

  /* ---------------- 4. magazine (flip the pages) ---------------- */
  function magazine() {
    const pages = [
      `<div class="mg-cover"><img src="${img(C.heroPhoto)}" alt=""><p class="mg-mast">BIRTHDAY</p><p class="mg-issue">MAGAZINE · DECEMBER 2026</p>
        <p class="mg-line l1">The<br><b>Birthday</b><br>Edition</p><p class="mg-line l2">৬.১২</p>
        <p class="mg-name">MOBASHSHERA</p><p class="mg-tag">My Favourite Notification</p></div>`,
      `<div class="mg-who"><p class="mg-h">Who's that<br><i>girl?</i></p><img class="w-main" src="${img("b-pink-garden")}" alt="">
        <figure class="w-s1"><img src="${img("b-snap-pink")}" alt=""></figure><figure class="w-s2"><img src="${img("glasses-chin")}" alt=""></figure>
        <span class="mg-stk s1">♥</span><span class="mg-stk s2">✦</span><p class="w-note">সুচিস্মিতা</p></div>`,
      `<div class="mg-play" style="--bg:url(${img("blue-jhumka")})"><div class="p-art"><img src="${img("blue-jhumka")}" alt=""></div>
        <p class="p-now">NOW PLAYING</p><p class="p-song">Tujhe Dekha To</p><p class="p-by">My Circle of Happiness</p>
        <div class="p-bar"><i></i></div><div class="p-ctl"><span>⏮</span><b>⏸</b><span>⏭</span></div></div>`,
      `<div class="mg-moments"><p class="m-h">OUR MOMENTS</p><p class="m-s">· our memories ·</p>
        <div class="m-heart"><img src="${img("m38-swing")}" alt=""></div>
        <div class="m-col"><img src="${img("m15-pensive")}" alt=""><img src="${img("m40-smile")}" alt=""><img src="${img("m24-smile")}" alt=""></div></div>`,
      `<div class="mg-grid"><p class="g-h">সাদা শাড়ি, কাশফুল</p>
        <div class="g-ph">${["b-kashful-smile", "b-deck-smile", "b-door", "m38-kash2", "m38-side", "m38-garden"].map((p, k) => `<img src="${img(p)}" alt="" style="--r:${[-4, 3, -2, 4, -3, 2][k]}deg">`).join("")}</div>
        <span class="mg-stk s3">♥</span><span class="mg-stk s4">♥</span></div>`,
      `<div class="mg-end"><p class="e-h">Happy<br>Birthday</p><img src="${img("b-pensive")}" alt=""><p class="e-w">শুভ জন্মদিন, ${NAME}</p><p class="e-s">${C.signature}</p></div>`
    ];
    stage.innerHTML = `
      <div class="mg-book" id="mgBook">${pages.map((p, k) => `<section class="mg-pg" style="z-index:${pages.length - k}">${p}</section>`).join("")}</div>
      <div class="mg-nav"><button type="button" id="mgPrev" aria-label="আগের পাতা">‹</button><span id="mgNo"></span><button type="button" id="mgNext" aria-label="পরের পাতা">›</button></div>
      <p class="mg-hint">পাতা উল্টাতে ক্লিক বা সোয়াইপ করুন</p>`;
    const pgs = $$(".mg-pg", stage);
    let at = 0;
    const show = () => {
      pgs.forEach((p, k) => { p.classList.toggle("past", k < at); p.classList.toggle("cur", k === at); });
      $("#mgNo").textContent = `${at + 1} / ${pgs.length}`;
      $("#mgPrev").disabled = at === 0; $("#mgNext").disabled = at === pgs.length - 1;
    };
    const go = (d) => { const n = Math.max(0, Math.min(pgs.length - 1, at + d)); if (n !== at) { at = n; show(); } };
    $("#mgNext").addEventListener("click", () => go(1));
    $("#mgPrev").addEventListener("click", () => go(-1));
    const book = $("#mgBook");
    let swiped = false;
    book.addEventListener("click", (e) => { if (swiped) { swiped = false; return; } const r = book.getBoundingClientRect(); go(e.clientX - r.left < r.width * 0.35 ? -1 : 1); });
    let sx = null;
    book.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
    book.addEventListener("touchend", (e) => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 40) { swiped = true; setTimeout(() => { swiped = false; }, 400); go(dx < 0 ? 1 : -1); } });
    xp.onkeydown = (e) => { if (stage.classList.contains("xp-magazine")) { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); } };
    show();
  }
})();
