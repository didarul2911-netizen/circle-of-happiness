(() => {
  const C = window.CONTENT;
  const MEETS = (window.MEETS || []).slice().sort((a, b) => a.date.localeCompare(b.date) || a.n - b.n);
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const img = (n) => `assets/img/${n}.jpg`;
  const lbGroups = {};
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NS = "http://www.w3.org/2000/svg";

  /* ---------- Bangla helpers ---------- */
  const BN = "০১২৩৪৫৬৭৮৯";
  const bn = (v) => String(v).replace(/\d/g, (d) => BN[d]);
  const MONTHS = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];
  const DAYS = ["রবিবার","সোমবার","মঙ্গলবার","বুধবার","বৃহস্পতিবার","শুক্রবার","শনিবার"];
  const ORD = { 1: "প্রথম", 2: "দ্বিতীয়", 3: "তৃতীয়", 4: "চতুর্থ", 5: "পঞ্চম", 6: "ষষ্ঠ", 7: "সপ্তম", 8: "অষ্টম", 9: "নবম", 10: "দশম" };
  const ord = (n) => ORD[n] || bn(n) + "তম";
  const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)); };
  const fmtDate = (s, withDay = true) => {
    const d = parse(s);
    return (withDay ? DAYS[d.getUTCDay()] + ", " : "") + bn(d.getUTCDate()) + " " + MONTHS[d.getUTCMonth()];
  };
  const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- Dates ---------- */
  const [by, bm, bd] = C.birthday.split("-").map(Number);
  const unlockAt = Date.UTC(by, bm - 1, bd) - 6 * 3600000; // 00:00 in Dhaka (UTC+6)
  const params = new URLSearchParams(location.search);
  const preview = params.has("preview");
  const isUnlocked = () => preview || Date.now() >= unlockAt;
  const dayNo = daysBetween(C.porichoy, C.birthday);

  /* ---------- Lock screen ---------- */
  const lock = $("#lock");
  lock.querySelector(".lock-wall").style.backgroundImage = `url(${img(C.heroPhoto)})`;
  drawMiniFlower($("#miniFlower"));
  function tick() {
    const d = new Date(Date.now() + 6 * 3600000);
    let h = d.getUTCHours() % 12; if (h === 0) h = 12;
    $("#lockTime").textContent = bn(h) + ":" + bn(String(d.getUTCMinutes()).padStart(2, "0"));
    $("#lockDate").textContent = DAYS[d.getUTCDay()] + ", " + bn(d.getUTCDate()) + " " + MONTHS[d.getUTCMonth()];
    const notif = $("#notif");
    if (isUnlocked()) {
      $("#notifTitle").textContent = `শুভ জন্মদিন, ${C.callName} 🌻`;
      $("#notifText").textContent = "আপনার জন্য ছোট্ট একটা জিনিস বানিয়েছি। ছুঁয়ে খুলুন।";
      $("#notifWhen").textContent = "এখন";
      $("#lockHint").textContent = "";
      notif.disabled = false;
    } else {
      const left = Math.max(0, unlockAt - Date.now());
      const two = (v) => bn(String(v).padStart(2, "0"));
      $("#notifTitle").textContent = "একটা জিনিস অপেক্ষা করছে";
      $("#notifText").textContent = `${bn(bd)} ${MONTHS[bm - 1]} রাত ১২টায় খুলবে।`;
      $("#notifWhen").textContent = "";
      $("#lockHint").textContent = `আর ${bn(Math.floor(left / 86400000))} দিন ${two(Math.floor(left / 3600000) % 24)}:${two(Math.floor(left / 60000) % 60)}:${two(Math.floor(left / 1000) % 60)}`;
      notif.disabled = true;
    }
    updatePoster(d);
    letterBtn.hidden = isUnlocked();
    if (isUnlocked() && !letterView.hidden) closeLetter();
  }

  /* ---------- Today's countdown poster (changes at 00:00 Dhaka) ---------- */
  // assets/posters/dN.jpg = the poster for the day when N days are left (14 … 1).
  const POSTER_MAX = 14;
  const letterBtn = $("#letterBtn"), letterView = $("#letterView");
  const posterBtn = $("#posterBtn"), posterView = $("#posterView"), posterImg = $("#posterImg");
  let posterDay = null;
  function updatePoster(dhakaNow) {
    const today = Date.UTC(dhakaNow.getUTCFullYear(), dhakaNow.getUTCMonth(), dhakaNow.getUTCDate());
    let left = Math.round((Date.UTC(by, bm - 1, bd) - today) / 86400000);
    if (params.has("posterDay")) left = Number(params.get("posterDay")); // for checking a given day
    const show = !isUnlocked() && left >= 1 && left <= POSTER_MAX;
    posterBtn.hidden = !show;
    if (!show) { if (!posterView.hidden) closePoster(); posterDay = null; return; }
    if (left === posterDay) return;
    posterDay = left;
    $("#posterBtnDay").textContent = bn(dhakaNow.getUTCDate());
    posterImg.src = `assets/posters/d${left}.jpg?v=20261128b`;
    posterImg.alt = `আর ${bn(left)} দিনের পোস্টার`;
  }
  function closePoster() { posterView.hidden = true; posterBtn.focus({ preventScroll: true }); }
  posterBtn.addEventListener("click", () => { posterView.hidden = false; $("#posterClose").focus(); });
  $("#posterClose").addEventListener("click", closePoster);
  posterView.addEventListener("click", (e) => { if (e.target === posterView) closePoster(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !posterView.hidden) closePoster(); });

  /* ---------- Appointment letter (until the gift opens) ---------- */
  function openLetter() {
    const li = $("#letterImg");
    if (!li.getAttribute("src")) li.src = "assets/letters/appointment.jpg?v=20261128b";
    letterView.hidden = false; letterView.scrollTop = 0; $("#letterClose").focus();
  }
  function closeLetter() { letterView.hidden = true; letterBtn.focus({ preventScroll: true }); }
  letterBtn.addEventListener("click", openLetter);
  $("#letterClose").addEventListener("click", closeLetter);
  letterView.addEventListener("click", (e) => { if (e.target === letterView) closeLetter(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !letterView.hidden) closeLetter(); });

  tick(); setInterval(tick, 1000);

  function openGift(instant) {
    document.body.classList.add("is-open");
    document.body.classList.remove("is-locked");
    $("#main").removeAttribute("aria-hidden");
    if (instant) { lock.hidden = true; return; }
    setTimeout(() => { lock.hidden = true; window.scrollTo(0, 0); }, 950);
  }
  $("#notif").addEventListener("click", () => { if (isUnlocked()) openGift(false); });
  if (params.get("preview") === "open") openGift(true);

  /* ---------- Two parts ---------- */
  function goPart(id) {
    ["bday", "mem"].forEach((v) => { $("#" + v).hidden = v !== id; });
    $$(".part-tab").forEach((t) => t.dataset.go === id ? t.setAttribute("aria-current", "page") : t.removeAttribute("aria-current"));
    $$("video").forEach((v) => { if (!v.closest("#" + id)) v.pause(); });
    document.body.classList.toggle("gift-on", id === "bday" && !$("#gIntro").hidden);
    window.scrollTo(0, 0);
    if (history.replaceState) history.replaceState(null, "", location.search + (id === "mem" ? "#memories" : ""));
  }
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); if (b) goPart(b.dataset.go); });
  if (location.hash === "#memories") goPart("mem");

  /* =====================================================================
     PART 1: BIRTHDAY, one scrolling page (gift → wish → letter → photos → cake → end)
     ===================================================================== */
  const bday = $("#bday");

  /* Happy Birthday tune, played as a soft music box (the melody is public domain) */
  function playHappyBirthday() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ac = new AC();
    const beat = 0.44;
    const N = { G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99 };
    const tune = [["G4",.75],["G4",.25],["A4",1],["G4",1],["C5",1],["B4",2],
                  ["G4",.75],["G4",.25],["A4",1],["G4",1],["D5",1],["C5",2],
                  ["G4",.75],["G4",.25],["G5",1],["E5",1],["C5",1],["B4",1],["A4",2],
                  ["F5",.75],["F5",.25],["E5",1],["C5",1],["D5",1],["C5",3]];
    const master = ac.createGain(); master.gain.value = 0.22; master.connect(ac.destination);
    let t = ac.currentTime + 0.25;
    tune.forEach(([n, d]) => {
      const len = d * beat;
      [[1, "sine", 1], [2, "triangle", 0.25], [4, "sine", 0.08]].forEach(([mul, type, amp]) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = type; o.frequency.value = N[n] * mul;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(amp, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0008, t + Math.max(0.5, len * 1.6));
        o.connect(g); g.connect(master);
        o.start(t); o.stop(t + Math.max(0.55, len * 1.7));
      });
      t += len;
    });
    setTimeout(() => ac.close && ac.close(), (t - ac.currentTime + 2) * 1000);
  }

  /* reveal on scroll */
  const rvObs = "IntersectionObserver" in window ? new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); rvObs.unobserve(e.target); } });
  }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }) : null;
  const watch = (el) => rvObs ? rvObs.observe(el) : el.classList.add("in");

  /* floating petals and butterflies */
  if (!calm) {
    const fl = $("#bFloat");
    for (let i = 0; i < 9; i++) {
      const s = document.createElement("i");
      s.className = i % 3 === 0 ? "fly bfly" : "fly pet";
      s.style.left = (i * 11 + 4) % 100 + "%";
      s.style.animationDuration = 14 + (i % 4) * 4 + "s";
      s.style.animationDelay = -(i * 2.7) + "s";
      fl.appendChild(s);
    }
  }

  /* 0. Gift: ribbon off, lid up, a flash, then the page */
  const gIntro = $("#gIntro"), gBox = $("#gBox");
  function openBox() {
    if (gBox.classList.contains("open")) return;
    gBox.classList.add("open");
    $("#gHint").textContent = "";
    playHappyBirthday();
    setTimeout(() => {
      gIntro.classList.add("flash");
      const hb = $("#hbText"); hb.textContent = "Happy Birthday to you"; hb.classList.add("show");
    }, calm ? 100 : 1500);
    setTimeout(() => {
      gIntro.classList.add("gone");
      document.body.classList.remove("gift-on");
      window.scrollTo(0, 0);
      $$("#bHero .rv").forEach((el) => el.classList.add("in"));
      playWish();
    }, calm ? 900 : 4300);
    setTimeout(() => { gIntro.hidden = true; }, calm ? 1200 : 5200);
  }
  gBox.addEventListener("click", openBox);
  function resetGift() {
    gIntro.hidden = false;
    gIntro.classList.remove("flash", "gone");
    gBox.classList.remove("open");
    $("#hbText").textContent = ""; $("#hbText").classList.remove("show");
    $("#gHint").textContent = "উপহারটা খুলতে ক্লিক করুন";
    document.body.classList.add("gift-on");
    window.scrollTo(0, 0);
  }
  document.body.classList.add("gift-on");

  /* 1. Wish */
  $("#heroImg").src = img(C.heroPhoto);
  $("#heroName").textContent = C.name;
  $("#heroLine").textContent = `পরিচয়ের ${ord(dayNo)} দিন`;
  $("#heroDate").textContent = fmtDate(C.birthday) + " " + bn(by);
  // split into grapheme-ish chunks so Bangla vowel signs stay with their letter
  const chunks = (w) => w.match(/[ঀ-৿](?:[া-ৌৗঁ-ঃ্][ঀ-৿]?)*|./g) || [w];
  $("#bigWish").innerHTML = ["শুভ", "জন্মদিন!"].map((w, wi) =>
    `<span class="w w${wi}">${chunks(w).map((ch, k) => `<span class="ch" style="--k:${k + wi * 3}">${ch}</span>`).join("")}</span>`).join(" ");
  function playWish() {
    const s = $("#bigWish");
    s.classList.remove("play"); void s.offsetWidth; s.classList.add("play");
  }

  /* 2. Letter: envelope opens, then a fountain pen writes it on the pad */
  const pad = $("#pad"), padBody = $("#padBody"), pen = $("#pen");
  $("#padDate").textContent = bn(bd) + " " + MONTHS[bm - 1] + " " + bn(by);
  let writing = null;
  $("#envelope").addEventListener("click", function () {
    if (this.classList.contains("open")) return;
    this.classList.add("open");
    $("#letterHint").textContent = "";
    setTimeout(() => {
      this.hidden = true; pad.hidden = false;
      requestAnimationFrame(() => pad.classList.add("show"));
      setTimeout(writeLetter, calm ? 50 : 700);
    }, calm ? 100 : 1500);
  });
  function writeLetter() {
    const texts = [...C.letter, C.signature];
    padBody.innerHTML = texts.map((t, i) => {
      const cls = i === 0 ? "salute" : i === texts.length - 1 ? "sign" : "";
      return `<p class="${cls}">${t.split(/(\s+)/).map((w) => /^\s+$/.test(w) ? w : `<span class="wd">${esc(w)}</span>`).join("")}</p>`;
    }).join("");
    const words = $$("#padBody .wd");
    let i = 0, timer = null, over = false, userScrolled = false;
    const onScroll = () => { userScrolled = true; };
    const finish = () => {
      if (over) return; over = true;
      clearTimeout(timer);
      words.forEach((w) => w.classList.add("done"));
      pen.classList.add("away");
      $("#letterHint").textContent = "";
      window.removeEventListener("wheel", onScroll); window.removeEventListener("touchmove", onScroll);
    };
    writing = finish;
    if (calm) return finish();
    $("#letterHint").textContent = "একসাথে পড়তে চিঠিতে ক্লিক করুন";
    pad.addEventListener("click", finish, { once: true });
    window.addEventListener("wheel", onScroll, { passive: true });
    window.addEventListener("touchmove", onScroll, { passive: true });
    const padBox = () => pad.getBoundingClientRect();
    const step = () => {
      if (over) return;
      if (i >= words.length) return finish();
      const w = words[i];
      const len = Math.max(2, chunks(w.textContent).length);
      const dur = Math.min(900, 70 + len * 55);
      const pr = padBox(), r = w.getBoundingClientRect();
      const x0 = r.left - pr.left, x1 = r.right - pr.left, y = r.bottom - pr.top - 4;
      pen.style.transition = "none";
      pen.style.transform = `translate(${x0}px, ${y}px)`;
      void pen.offsetWidth;
      pen.style.transition = `transform ${dur}ms linear`;
      pen.style.transform = `translate(${x1}px, ${y - 2}px)`;
      w.style.setProperty("--dur", dur + "ms");
      w.classList.add("writing");
      // keep the pen in view unless she is scrolling by herself
      if (!userScrolled && r.bottom > innerHeight - 90) window.scrollBy({ top: r.bottom - innerHeight + 200, behavior: "smooth" });
      const isEnd = /[।?!,]$/.test(w.textContent) || w === w.parentElement.lastElementChild;
      timer = setTimeout(() => { w.classList.add("done"); i++; step(); }, dur + (isEnd ? 260 : 70));
    };
    step();
  }

  /* 3. Photos: scattered polaroids, click to see big */
  const photos = [C.childhood, ...C.stack].map((p) => p.img);
  lbGroups.bday = photos;
  $("#scatter").innerHTML = photos.map((p, k) => {
    const r = [-4, 3, -2, 5, -5, 2, -3, 4, -1, 3][k % 10];
    return `<button type="button" class="sc-card${k === 0 ? " first" : ""} rv" data-lb="bday" data-k="${k}" style="--r:${r}deg; --d:${(k % 2) * 0.12}s" aria-label="ছবি ${bn(k + 1)}"><span class="tape"></span><img src="${img(p)}" alt="" loading="lazy"></button>`;
  }).join("");

  /* 4. Cake: real-looking flames, click a candle to blow it out */
  const cf = $("#cakeFlowers");
  [[118, 158, 1], [150, 168, .8], [262, 160, 1.05], [296, 170, .75], [72, 268, 1], [104, 282, .8], [312, 276, 1.1], [342, 292, .7], [200, 380, 0]].forEach(([x, y, s]) => {
    if (!s) return;
    const g = document.createElementNS(NS, "g");
    g.setAttribute("transform", `translate(${x} ${y}) scale(${s})`);
    g.innerHTML = `<g fill="#7FA36B"><ellipse cx="-16" cy="6" rx="10" ry="4" transform="rotate(-25 -16 6)"/><ellipse cx="17" cy="8" rx="10" ry="4" transform="rotate(30 17 8)"/></g>` +
      [0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-10" rx="7.5" ry="11" fill="url(#petal)" transform="rotate(${a})"/>`).join("") +
      `<circle r="5" fill="#E9B23A"/><circle r="2.4" fill="#C98A0C"/>`;
    cf.appendChild(g);
  });
  const CANDLES = 5;
  $("#candles").innerHTML = Array.from({ length: CANDLES }, (_, k) =>
    `<button type="button" class="candle" style="--x:${(k - (CANDLES - 1) / 2) * 13}%; --h:${[78, 92, 100, 88, 74][k]}%" aria-label="মোমবাতি ${bn(k + 1)}">
      <span class="wick"></span><span class="flame"><i></i></span><span class="smoke"><i></i><i></i><i></i></span><span class="stick"></span></button>`).join("");
  let lit = CANDLES;
  function blow(c) {
    if (!c || c.classList.contains("out")) return;
    c.classList.add("out");
    lit--;
    $("#cakeGlow").style.opacity = String(lit / CANDLES);
    if (lit === 0) {
      $("#cakeHint").textContent = "";
      $("#cakeDone").hidden = false;
      if (!calm) { burst($("#cakeWrap")); setTimeout(petalRain, 400); }
    }
  }
  $("#candles").addEventListener("click", (e) => blow(e.target.closest(".candle")));
  $(".cake-svg").addEventListener("click", () => blow($(".candle:not(.out)")));
  function resetCake() {
    $$(".candle").forEach((c) => c.classList.remove("out"));
    lit = CANDLES; $("#cakeGlow").style.opacity = "1";
    $("#cakeDone").hidden = true; $("#cakeHint").textContent = "মোমবাতিতে ক্লিক করুন";
  }

  /* 5. End */
  $("#endSign").textContent = C.signature;
  $("#replayBtn").addEventListener("click", () => {
    if (writing) writing();
    $("#envelope").hidden = false; $("#envelope").classList.remove("open");
    pad.hidden = true; pad.classList.remove("show"); pen.classList.remove("away"); padBody.innerHTML = "";
    $("#letterHint").textContent = "চিঠিটা খুলতে ক্লিক করুন";
    resetCake();
    resetGift();
  });

  $$("#bday .rv").forEach((el) => { if (!el.closest("#bHero")) watch(el); });
  if (params.get("preview") === "open" && params.has("skipgift")) { gIntro.hidden = true; document.body.classList.remove("gift-on"); $$("#bHero .rv").forEach((el) => el.classList.add("in")); playWish(); }


  /* ---------- effects ---------- */
  function burst(anchor) {
    if (calm) return;
    const r = anchor.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height * 0.35;
    for (let i = 0; i < 40; i++) {
      const p = document.createElement("span");
      p.className = "burst";
      const a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 160;
      p.style.left = cx + "px"; p.style.top = cy + "px";
      p.style.setProperty("--x", Math.cos(a) * d + "px");
      p.style.setProperty("--y", Math.sin(a) * d - 60 + "px");
      p.style.setProperty("--rot", Math.random() * 540 + "deg");
      p.style.background = ["#F2B01E", "#D9578C", "#5F8B4C", "#F7C9DA"][i % 4];
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1600);
    }
  }
  function petalRain() {
    for (let i = 0; i < 46; i++) {
      const p = document.createElement("span");
      p.className = "petal-fall";
      p.style.left = Math.random() * 100 + "vw";
      p.style.setProperty("--x", (Math.random() * 120 - 60) + "px");
      p.style.setProperty("--rot", (Math.random() * 720 - 360) + "deg");
      p.style.animationDuration = 2.6 + Math.random() * 2.4 + "s";
      p.style.animationDelay = Math.random() * 1.2 + "s";
      if (i % 4 === 0) p.style.background = "#D9578C";
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 6500);
    }
  }

  /* =====================================================================
     PART 2: MEMORIES, only his own words from the meet log
     ===================================================================== */
  buildFlower($("#flower"));

  function photoStrip(list, group) {
    if (!list || !list.length) return "";
    return `<div class="strip">${list.map((p, k) =>
      `<button type="button" class="${p.startsWith("l-") ? "note" : "arch"}" data-lb="${group}" data-k="${k}" aria-label="ছবি বড় করে দেখুন"><img loading="lazy" src="${img(p)}" alt=""></button>`).join("")}</div>`;
  }
  const videoTag = (m, extra = "") => m.video
    ? `<video ${extra} playsinline preload="none" poster="assets/video/${m.poster || m.video + "-poster"}.jpg" src="assets/video/${m.video}.mp4"></video>` : "";

  // group meets by month, starting from the porichoy month
  const byMonth = new Map();
  const startYM = C.porichoy.slice(0, 7);
  byMonth.set(startYM, []);
  MEETS.forEach((m) => { const k = m.date.slice(0, 7); if (!byMonth.has(k)) byMonth.set(k, []); byMonth.get(k).push(m); });
  const monthTitle = (ym) => MONTHS[Number(ym.slice(5)) - 1];

  $("#months").innerHTML = [...byMonth.entries()].map(([ym, list]) => {
    const cover = C.monthPhotos && C.monthPhotos[ym];
    if (cover) lbGroups["cover" + ym] = [cover];
    const count = list.length ? `<p class="m-count">${bn(list.length)} বার দেখা</p>` : "";
    const porichoy = ym === startYM ? `<p class="m-porichoy">${fmtDate(C.porichoy, false)}, পরিচয়</p>` : "";
    const coverHtml = cover ? `<button type="button" class="m-cover" data-lb="cover${ym}" data-k="0" aria-label="ছবি বড় করে দেখুন"><img loading="lazy" src="${img(cover)}" alt=""></button>` : "";
    return `<section class="month">
      <div class="m-head"><h2 class="m-name">${monthTitle(ym)}</h2>${count}</div>
      ${porichoy}${coverHtml}
      <div class="m-meets">${list.map(meetCard).join("")}</div>
    </section>`;
  }).join("");

  function meetCard(m) {
    const key = "m" + m.n;
    const head = `<p class="mc-date">${fmtDate(m.date)}, ${ord(m.n)} দেখা</p>`;
    const note = m.note ? `<p class="mc-note">${esc(m.note)}</p>` : "";
    let media;
    if (m.n === 38 && C.sareeRoll) {
      lbGroups[key] = C.sareeRoll;
      media = `<div class="film">${videoTag(m, "muted loop autoplay")}${C.sareeRoll.map((p, k) =>
        `<button type="button" data-lb="${key}" data-k="${k}" aria-label="ছবি বড় করে দেখুন"><img loading="lazy" src="${img(p)}" alt=""></button>`).join("")}</div>`;
    } else {
      lbGroups[key] = m.photos || [];
      media = (m.video ? `<div class="mc-video">${videoTag(m, "controls")}</div>` : "") + photoStrip(m.photos, key);
    }
    if (m.best) {
      return `<article class="mc best" id="meet-${m.n}">
        ${head}<span class="badge">একেবারেই ভোলার মতো না</span>
        <ul class="tags">${m.items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
        ${note}${media}
      </article>`;
    }
    return `<article class="mc" id="meet-${m.n}">${head}<p class="mc-items">${m.items.map(esc).join(", ")}</p>${note}${media}</article>`;
  }

  /* ---------- Letters ---------- */
  lbGroups.letters = C.letters.map((l) => l.img);
  $("#desk").innerHTML = C.letters.map((l, k) => {
    const r = ((k * 37) % 7) - 3;
    return `<button type="button" data-lb="letters" data-k="${k}" style="--r:${r}deg" aria-label="${fmtDate(l.date, false)}-এর চিঠি"><img loading="lazy" src="${img(l.img)}" alt=""><small>${fmtDate(l.date, false)}</small></button>`;
  }).join("");

  /* ---------- Sunflower ---------- */
  function buildFlower(svg) {
    const N = MEETS.length;
    const R = 118;
    const c = R / Math.sqrt(N + 0.5);
    const sr = Math.min(c * 0.47, 14);
    const golden = Math.PI * (3 - Math.sqrt(5));
    const el = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
    const petals = el("g", {});
    [{ n: 21, len: 84, w: 30, col: "#E59E0C", off: 0 }, { n: 21, len: 92, w: 27, col: "#F2B01E", off: Math.PI / 21 }].forEach((rg, ri) => {
      for (let i = 0; i < rg.n; i++) {
        const a = (i / rg.n) * Math.PI * 2 + rg.off;
        const deg = (a * 180) / Math.PI + 90;
        const holder = el("g", { transform: `rotate(${deg - 180}) translate(0 ${-(R - 6)})` });
        holder.appendChild(el("path", {
          class: "petal",
          d: `M0 0 C ${-rg.w / 2} ${-rg.len * 0.35}, ${-rg.w / 2.4} ${-rg.len * 0.85}, 0 ${-rg.len} C ${rg.w / 2.4} ${-rg.len * 0.85}, ${rg.w / 2} ${-rg.len * 0.35}, 0 0 Z`,
          fill: rg.col, style: `--d:${(ri * 0.15 + i * 0.02).toFixed(2)}s`
        }));
        petals.appendChild(holder);
      }
    });
    svg.appendChild(petals);
    svg.appendChild(el("circle", { r: R + 6, fill: "#3B2410" }));
    svg.appendChild(el("circle", { r: R + 2, fill: "#6E4A26" }));
    const seeds = el("g", {});
    MEETS.forEach((m, i) => {
      const r = c * Math.sqrt(i + 0.5), a = i * golden;
      const pos = el("g", { transform: `translate(${(r * Math.cos(a)).toFixed(1)} ${(r * Math.sin(a)).toFixed(1)})` });
      const g = el("g", { class: "seed" + (m.best ? " best" : ""), tabindex: "0", role: "button", "aria-label": `${ord(m.n)} দেখা, ${fmtDate(m.date)}`, style: `--d:${(0.6 + i * 0.035).toFixed(2)}s` });
      pos.appendChild(g);
      g.appendChild(el("circle", { class: "ring", r: (c * 0.5).toFixed(1) }));
      g.appendChild(el("circle", { class: "s", r: sr.toFixed(1) }));
      if (sr >= 6.5) {
        const t = el("text", { class: "num", "text-anchor": "middle", "dominant-baseline": "central", "font-size": (sr * 0.95).toFixed(1) });
        t.textContent = bn(m.n); g.appendChild(t);
      }
      const open = () => openMeet(i);
      g.addEventListener("click", open);
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
      seeds.appendChild(pos);
    });
    svg.appendChild(seeds);
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { svg.classList.add("bloom"); io.disconnect(); } }), { threshold: 0.3 });
    io.observe(svg);
  }
  function drawMiniFlower(g) {
    for (let i = 0; i < 12; i++) {
      const e = document.createElementNS(NS, "ellipse");
      e.setAttribute("cx", 20); e.setAttribute("cy", 9); e.setAttribute("rx", 3.6); e.setAttribute("ry", 7);
      e.setAttribute("fill", "#F2B01E"); e.setAttribute("transform", `rotate(${i * 30} 20 20)`);
      g.appendChild(e);
    }
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", 20); c.setAttribute("cy", 20); c.setAttribute("r", 7); c.setAttribute("fill", "#5B3A1E");
    g.appendChild(c);
  }

  /* ---------- Meet sheet (from a seed) ---------- */
  const sheet = $("#sheet");
  let cur = 0;
  function openMeet(i) {
    cur = i;
    const m = MEETS[i];
    $("#sheetDate").textContent = fmtDate(m.date);
    $("#sheetTitle").textContent = `${ord(m.n)} দেখা`;
    const badge = m.best ? `<span class="badge">একেবারেই ভোলার মতো না</span>` : "";
    const tags = m.items && m.items.length ? `<ul class="tags">${m.items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : "";
    const note = m.note ? `<p class="mc-note">${esc(m.note)}</p>` : "";
    $("#sheetBody").innerHTML = badge + tags + note + videoTag(m, "controls") + photoStrip(m.photos, "meet");
    lbGroups.meet = m.photos || [];
    $("#sheetPrev").disabled = i === 0;
    $("#sheetNext").disabled = i === MEETS.length - 1;
    if (!sheet.open) sheet.showModal();
    sheet.scrollTop = 0;
  }
  $("#sheetClose").addEventListener("click", () => sheet.close());
  $("#sheetPrev").addEventListener("click", () => cur > 0 && openMeet(cur - 1));
  $("#sheetNext").addEventListener("click", () => cur < MEETS.length - 1 && openMeet(cur + 1));
  sheet.addEventListener("click", (e) => { if (e.target === sheet) sheet.close(); });
  sheet.addEventListener("close", () => sheet.querySelectorAll("video").forEach((v) => v.pause()));

  /* ---------- Lightbox ---------- */
  const lb = $("#lightbox");
  let lbList = [], lbI = 0;
  function showLb() { $("#lbImg").src = img(lbList[lbI]); $("#lbPrev").hidden = lbI === 0; $("#lbNext").hidden = lbI === lbList.length - 1; }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-lb]");
    if (!b) return;
    lbList = lbGroups[b.dataset.lb] || [];
    lbI = Number(b.dataset.k) || 0;
    showLb(); lb.showModal();
  });
  $("#lbClose").addEventListener("click", () => lb.close());
  $("#lbPrev").addEventListener("click", () => { if (lbI > 0) { lbI--; showLb(); } });
  $("#lbNext").addEventListener("click", () => { if (lbI < lbList.length - 1) { lbI++; showLb(); } });
  lb.addEventListener("click", (e) => { if (e.target === lb) lb.close(); });
  lb.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") $("#lbPrev").click(); if (e.key === "ArrowRight") $("#lbNext").click(); });
  let tx = null;
  lb.addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx; tx = null;
    if (dx > 50) $("#lbPrev").click(); else if (dx < -50) $("#lbNext").click();
  });
})();
