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
  }
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
    window.scrollTo(0, 0);
    if (history.replaceState) history.replaceState(null, "", location.search + (id === "mem" ? "#memories" : ""));
  }
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); if (b) goPart(b.dataset.go); });
  if (location.hash === "#memories") goPart("mem");

  /* =====================================================================
     PART 1: BIRTHDAY, one page at a time
     ===================================================================== */
  const scenes = $$(".scene");
  const done = new Set(["s-wish", "s-collage"]);   // pages that need no action before "next"
  let si = 0;
  $("#dots").innerHTML = scenes.map(() => `<span class="dot-pg"></span>`).join("");

  function show(i) {
    const prev = scenes[si];
    si = Math.max(0, Math.min(scenes.length - 1, i));
    const cur = scenes[si];
    if (prev !== cur) prev.hidden = true;
    cur.hidden = false;
    cur.classList.remove("enter"); void cur.offsetWidth; cur.classList.add("enter");
    $$(".dot-pg").forEach((d, k) => d.classList.toggle("on", k === si));
    $("#pgPrev").disabled = si === 0;
    updateNext();
    window.scrollTo(0, 0);
    if (cur.id === "s-wish") playWish();
  }
  function updateNext() {
    const cur = scenes[si];
    $("#pgNext").hidden = si === scenes.length - 1 || !done.has(cur.id);
  }
  function complete(id) { done.add(id); if (scenes[si].id === id) updateNext(); }
  $("#pgNext").addEventListener("click", () => show(si + 1));
  $("#pgPrev").addEventListener("click", () => show(si - 1));

  /* 1. Gift */
  $("#gift").addEventListener("click", function () {
    if (this.classList.contains("open")) return;
    this.classList.add("open");
    $("#giftHint").textContent = "";
    burst(this);
    complete("s-gift");
    setTimeout(() => { if (scenes[si].id === "s-gift") show(1); }, calm ? 300 : 1700);
  });

  /* 2. Wish */
  $("#heroImg").src = img(C.heroPhoto);
  $("#heroName").textContent = C.name;
  $("#heroLine").textContent = `${fmtDate(C.birthday, false)}, পরিচয়ের ${ord(dayNo)} দিন`;
  // split into grapheme-ish chunks so Bangla vowel signs stay with their letter
  const chunks = (w) => w.match(/[ঀ-৿](?:[া-ৌৗঁ-ঃ্][ঀ-৿]?)*|./g) || [w];
  $("#bigWish").innerHTML = ["শুভ", "জন্মদিন"].map((w, wi) =>
    `<span class="w w${wi}">${chunks(w).map((ch, k) => `<span class="ch" style="--k:${k + wi * 3}">${ch}</span>`).join("")}</span>`).join("");
  function playWish() {
    const s = $("#s-wish");
    s.classList.remove("play"); void s.offsetWidth; s.classList.add("play");
  }

  /* 3. Stack (childhood first) */
  const stackList = [C.childhood, ...C.stack];
  const stackEl = $("#stack");
  stackEl.innerHTML = stackList.map((p, k) => {
    const r = [-3, 4, -5, 2, -2, 5, -4][k % 7];
    return `<figure class="pola stack-card${k === 0 ? " child" : ""}" style="--r:${r}deg; z-index:${stackList.length - k}"><span class="tape"></span><img src="${img(p.img)}" alt="" loading="${k < 2 ? "eager" : "lazy"}"><figcaption>${esc(p.cap)}</figcaption></figure>`;
  }).join("");
  let top = 0;
  const cards = $$(".stack-card");
  stackEl.addEventListener("click", () => {
    if (top >= cards.length) return;
    const c = cards[top];
    c.style.setProperty("--fly", (top % 2 ? -1 : 1) * 130 + "%");
    c.classList.add("gone");
    top++;
    if (top === cards.length) {
      $("#stackHint").textContent = "";
      complete("s-stack");
      setTimeout(() => cards.forEach((x, k) => {
        x.classList.remove("gone"); x.classList.add("fan");
        x.style.setProperty("--fan", (k - (cards.length - 1) / 2) * 5 + "deg");
        x.style.zIndex = k;
      }), 450);
    } else {
      $("#stackHint").textContent = `আরও ${bn(cards.length - top)}টা`;
    }
  });

  /* 4. Letter: envelope opens, then the words type out */
  const paper = $("#paper");
  $("#envelope").addEventListener("click", function () {
    if (this.classList.contains("open")) return;
    this.classList.add("open");
    $("#letterHint").textContent = "";
    setTimeout(() => { this.hidden = true; paper.hidden = false; typeLetter(); }, calm ? 100 : 1500);
  });
  function typeLetter() {
    const texts = [...C.letter, C.signature];
    paper.innerHTML = texts.map((_, i) => `<p class="${i === 0 ? "salute" : i === texts.length - 1 ? "sign" : ""}"></p>`).join("");
    const els = $$("#paper p");
    let pi = 0, ci = 0, timer = null, over = false;
    const finish = () => {
      if (over) return; over = true;
      clearTimeout(timer);
      els.forEach((e, k) => { e.textContent = texts[k]; e.classList.remove("typing"); });
      $("#letterHint").textContent = "";
      complete("s-letter");
    };
    if (calm) return finish();
    $("#letterHint").textContent = "পুরোটা একসাথে দেখতে চিঠিতে টোকা দিন";
    paper.addEventListener("click", finish, { once: true });
    const step = () => {
      if (pi >= texts.length) return finish();
      const chars = chunks(texts[pi]);
      els[pi].textContent = chars.slice(0, ++ci).join("");
      els[pi].classList.add("typing");
      if (ci >= chars.length) { els[pi].classList.remove("typing"); pi++; ci = 0; timer = setTimeout(step, 380); }
      else timer = setTimeout(step, 34);
    };
    step();
  }

  /* 5. Collage: drag the photos around, tap to enlarge */
  lbGroups.collage = C.collage;
  const col = $("#collage");
  const spots = [[2, 2, -6], [48, 0, 5], [24, 24, -2], [0, 48, 4], [50, 44, -5], [22, 66, 3]];
  col.innerHTML = C.collage.map((p, k) => {
    const [x, y, r] = spots[k % spots.length];
    return `<figure class="pola drag" style="left:${x}%; top:${y}%; --r:${r}deg; --k:${k}"><span class="tape"></span><img src="${img(p)}" alt="" loading="lazy" draggable="false"></figure>`;
  }).join("");
  let zTop = 10;
  $$(".drag").forEach((el, idx) => {
    let sx, sy, ox, oy, moved;
    el.addEventListener("pointerdown", (e) => {
      el.setPointerCapture(e.pointerId);
      sx = e.clientX; sy = e.clientY; ox = el.offsetLeft; oy = el.offsetTop; moved = false;
      el.style.zIndex = ++zTop; el.classList.add("held");
    });
    el.addEventListener("pointermove", (e) => {
      if (sx === undefined) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
      const W = col.clientWidth - el.offsetWidth, H = col.clientHeight - el.offsetHeight;
      el.style.left = Math.max(-20, Math.min(W + 20, ox + dx)) + "px";
      el.style.top = Math.max(-10, Math.min(H + 10, oy + dy)) + "px";
    });
    const up = () => {
      if (sx === undefined) return;
      sx = undefined; el.classList.remove("held");
      if (!moved) { lbList = C.collage; lbI = idx; showLb(); lb.showModal(); }
    };
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  });

  /* 6. Cake: candles go out by tap or by blowing into the mic */
  const candleG = $("#candles");
  [84, 120, 156].forEach((x, k) => {
    const g = document.createElementNS(NS, "g");
    g.innerHTML = `<rect x="${x - 4}" y="72" width="8" height="40" rx="3" fill="${["#D9578C", "#F2B01E", "#5F8B4C"][k]}"/>
      <g class="flame" style="transform-origin:${x}px 72px; animation-delay:${k * 0.2}s"><ellipse cx="${x}" cy="58" rx="7" ry="13" fill="#F2B01E"/><ellipse cx="${x}" cy="62" rx="3.4" ry="7" fill="#FFF3C4"/></g>
      <g class="smoke"><circle cx="${x}" cy="48" r="5"/><circle cx="${x + 4}" cy="38" r="4"/><circle cx="${x - 2}" cy="28" r="3"/></g>`;
    candleG.appendChild(g);
  });
  let blown = false, stream = null;
  function blowOut() {
    if (blown) return;
    blown = true;
    $("#cakeBtn").classList.add("blown");
    $("#cakeBtn").setAttribute("aria-label", "মোমবাতি নিভে গেছে");
    $("#micBtn").hidden = true; $("#cakeHint").hidden = true;
    $("#cakeTitle").textContent = "ইচ্ছাটা পূরণ হোক";
    $("#cakeDone").hidden = false;
    if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
    if (!calm) setTimeout(petalRain, 500);
    complete("s-cake");
  }
  $("#cakeBtn").addEventListener("click", blowOut);
  $("#micBtn").addEventListener("click", async function () {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.textContent = "এবার জোরে ফুঁ দিন…";
      this.disabled = true;
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const an = ac.createAnalyser(); an.fftSize = 512;
      ac.createMediaStreamSource(stream).connect(an);
      const buf = new Uint8Array(an.fftSize);
      let loud = 0;
      const listen = () => {
        if (blown) { ac.close(); return; }
        an.getByteTimeDomainData(buf);
        let sum = 0; for (const v of buf) { const x = (v - 128) / 128; sum += x * x; }
        loud = Math.sqrt(sum / buf.length) > 0.18 ? loud + 1 : Math.max(0, loud - 1);
        if (loud > 6) { blowOut(); ac.close(); return; }
        requestAnimationFrame(listen);
      };
      listen();
    } catch (err) {
      this.hidden = true;
      $("#cakeHint").textContent = "মাইক চালু হলো না। মোমবাতিগুলো ছুঁয়ে দিন।";
    }
  });

  /* 7. Wish */
  $("#meetBtn").href = C.meetLink;
  $("#wishForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = $("#wishForm");
    f.classList.add("fold");
    setTimeout(() => {
      f.hidden = true;
      $("#wishText").value = "";
      $("#wishSent").hidden = false;
      if (!calm) petalRain();
    }, calm ? 50 : 1100);
  });

  show(0);

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
