(() => {
  const C = window.CONTENT;
  const MEETS = (window.MEETS || []).slice().sort((a, b) => a.date.localeCompare(b.date) || a.n - b.n);
  const $ = (s) => document.querySelector(s);
  const img = (n) => `assets/img/${n}.jpg`;

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
  const sinceFirst = daysBetween(C.firstMeet, C.birthday);

  /* ---------- Lock screen ---------- */
  const lock = $("#lock");
  lock.querySelector(".lock-wall").style.backgroundImage = `url(${img(C.heroPhoto)})`;
  drawMiniFlower($("#miniFlower"));

  function dhakaNow() { return new Date(Date.now() + 6 * 3600000); }
  function tick() {
    const d = dhakaNow();
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
      const dd = Math.floor(left / 86400000);
      const hh = Math.floor(left / 3600000) % 24;
      const mm = Math.floor(left / 60000) % 60;
      const ss = Math.floor(left / 1000) % 60;
      const two = (v) => bn(String(v).padStart(2, "0"));
      $("#notifTitle").textContent = "একটা জিনিস অপেক্ষা করছে";
      $("#notifText").textContent = `${bn(bd)} ${MONTHS[bm - 1]} রাত ১২টায় খুলবে।`;
      $("#notifWhen").textContent = "";
      $("#lockHint").textContent = `আর ${bn(dd)} দিন ${two(hh)}:${two(mm)}:${two(ss)}`;
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
  if (params.get("preview") === "open") openGift(true); // ?preview=open skips the lock screen while testing

  /* ---------- Hero ---------- */
  $("#heroImg").src = img(C.heroPhoto);
  $("#heroName").textContent = C.name;
  $("#heroLine").textContent = `আজ ${fmtDate(C.birthday, false)}, পরিচয়ের ${ord(dayNo)} দিন।`;

  /* ---------- Sunflower ---------- */
  $("#circleLede").textContent =
    `প্রতিটা বীজ একটা দেখা। ${fmtDate(C.firstMeet, false)} থেকে এখন পর্যন্ত ${bn(MEETS.length)}টা দেখা, ${bn(sinceFirst)} দিনে। যেকোনো বীজ ছুঁয়ে দেখুন।`;
  buildFlower($("#flower"));

  function buildFlower(svg) {
    const NS = "http://www.w3.org/2000/svg";
    const N = MEETS.length;
    const R = 118;                           // disc radius stays fixed
    const c = R / Math.sqrt(N + 0.5);        // seed spacing shrinks as meets grow
    const sr = Math.min(c * 0.47, 14);
    const golden = Math.PI * (3 - Math.sqrt(5));
    const el = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };

    const petals = el("g", {});
    const rings = [{ n: 21, len: 84, w: 30, col: "#E59E0C", off: 0 }, { n: 21, len: 92, w: 27, col: "#F2B01E", off: Math.PI / 21 }];
    rings.forEach((rg, ri) => {
      for (let i = 0; i < rg.n; i++) {
        const a = (i / rg.n) * Math.PI * 2 + rg.off;
        const deg = (a * 180) / Math.PI + 90;
        const base = R - 6;
        // outer <g> holds the position; the inner path is the one that animates
        const holder = el("g", { transform: `rotate(${deg - 180}) translate(0 ${-base})` });
        holder.appendChild(el("path", {
          class: "petal",
          d: `M0 0 C ${-rg.w / 2} ${-rg.len * 0.35}, ${-rg.w / 2.4} ${-rg.len * 0.85}, 0 ${-rg.len} C ${rg.w / 2.4} ${-rg.len * 0.85}, ${rg.w / 2} ${-rg.len * 0.35}, 0 0 Z`,
          fill: rg.col,
          style: `--d:${(ri * 0.15 + i * 0.02).toFixed(2)}s`
        }));
        petals.appendChild(holder);
      }
    });
    svg.appendChild(petals);
    svg.appendChild(el("circle", { r: R + 6, fill: "#3B2410" }));
    svg.appendChild(el("circle", { r: R + 2, fill: "#6E4A26" }));

    const seeds = el("g", {});
    MEETS.forEach((m, i) => {
      const r = c * Math.sqrt(i + 0.5);
      const a = i * golden;
      const x = r * Math.cos(a), y = r * Math.sin(a);
      const pos = el("g", { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})` });
      const g = el("g", {
        class: "seed" + (m.best ? " best" : ""), tabindex: "0", role: "button",
        "aria-label": `${ord(m.n)} দেখা, ${fmtDate(m.date)}`,
        style: `--d:${(0.6 + i * 0.035).toFixed(2)}s`
      });
      pos.appendChild(g);
      g.appendChild(el("circle", { class: "ring", r: (c * 0.5).toFixed(1) }));
      g.appendChild(el("circle", { class: "s", r: sr.toFixed(1) }));
      if (sr >= 6.5) {
        const t = el("text", { class: "num", "text-anchor": "middle", "dominant-baseline": "central", "font-size": (sr * 0.95).toFixed(1) });
        t.textContent = bn(m.n);
        g.appendChild(t);
      }
      const open = () => openMeet(i);
      g.addEventListener("click", open);
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
      seeds.appendChild(pos);
    });
    svg.appendChild(seeds);

    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { svg.classList.add("bloom"); io.disconnect(); } });
    }, { threshold: 0.3 });
    io.observe(svg);
  }

  function drawMiniFlower(g) {
    const NS = "http://www.w3.org/2000/svg";
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

  /* ---------- Meet sheet ---------- */
  const sheet = $("#sheet");
  let cur = 0;
  function photoStrip(list, group) {
    if (!list || !list.length) return "";
    return `<div class="strip">${list.map((p, k) =>
      `<button type="button" class="${p.startsWith("l-") ? "note" : "arch"}" data-lb="${group}" data-k="${k}" aria-label="ছবি বড় করে দেখুন"><img loading="lazy" src="${img(p)}" alt=""></button>`).join("")}</div>`;
  }
  function openMeet(i) {
    cur = i;
    const m = MEETS[i];
    $("#sheetDate").textContent = fmtDate(m.date);
    $("#sheetTitle").textContent = `${ord(m.n)} দেখা`;
    const tags = m.items && m.items.length ? `<ul class="tags">${m.items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : "";
    const note = m.note ? `<p class="day-note">${esc(m.note)}</p>` : "";
    const vid = m.video ? `<video controls playsinline preload="none" poster="assets/video/${m.video}-poster.jpg" src="assets/video/${m.video}.mp4"></video>` : "";
    $("#sheetBody").innerHTML = tags + note + vid + photoStrip(m.photos, "meet");
    lbGroups.meet = m.photos || [];
    $("#sheetPrev").disabled = i === 0;
    $("#sheetNext").disabled = i === MEETS.length - 1;
    if (!sheet.open) sheet.showModal();
    sheet.querySelector(".sheet-inner").scrollTop = 0;
    sheet.scrollTop = 0;
  }
  $("#sheetClose").addEventListener("click", () => sheet.close());
  $("#sheetPrev").addEventListener("click", () => cur > 0 && openMeet(cur - 1));
  $("#sheetNext").addEventListener("click", () => cur < MEETS.length - 1 && openMeet(cur + 1));
  sheet.addEventListener("click", (e) => { if (e.target === sheet) sheet.close(); });
  sheet.addEventListener("close", () => sheet.querySelectorAll("video").forEach((v) => v.pause()));

  /* ---------- Best days ---------- */
  const lbGroups = {};
  $("#bestList").innerHTML = C.bestDays.map((b, k) => {
    const m = MEETS.find((x) => x.n === b.meet) || {};
    lbGroups["best" + k] = b.photos;
    const note = m.note ? `<p class="day-note">${esc(m.note)}</p>` : "";
    const items = !m.note && m.items ? `<p class="day-items">${m.items.map(esc).join(", ")}</p>` : "";
    return `<article class="day">
      <p class="day-date">${m.date ? fmtDate(m.date) + ", " + ord(m.n) + " দেখা" : ""}</p>
      <h3 class="day-title">${esc(b.title)}</h3>
      ${note}${items}
      ${photoStrip(b.photos, "best" + k)}
    </article>`;
  }).join("");

  /* ---------- Receipt ---------- */
  (function receipt() {
    const text = MEETS.map((m) => (m.items || []).join(" , ") + " , " + (m.note || "")).join(" | ");
    const rows = C.receipt.map((r) => {
      const n = MEETS.reduce((s, m) => s + ((m.items || []).filter((it) => new RegExp(r.match, "i").test(it + " ")).length), 0);
      return { label: r.label, n };
    }).filter((r) => r.n > 0);
    const first = MEETS[0], last = MEETS[MEETS.length - 1];
    $("#receipt").innerHTML = `
      <div class="r-head">
        <p class="r-shop">Circle of Happiness</p>
        <p class="r-sub">${fmtDate(first.date, false)} থেকে ${fmtDate(last.date, false)}</p>
      </div>
      <div class="r-row"><span class="lbl">দেখা</span><span class="lead"></span><span class="qty">× ${bn(MEETS.length)}</span></div>
      ${rows.map((r) => `<div class="r-row"><span class="lbl">${esc(r.label)}</span><span class="lead"></span><span class="qty">× ${bn(r.n)}</span></div>`).join("")}
      <hr class="r-rule">
      <div class="r-row r-total"><span class="lbl">মোট</span><span class="lead"></span><span class="qty">অমূল্য</span></div>
      <p class="r-foot">পরিশোধিত: এক জীবনের হাসি দিয়ে</p>`;
    void text;
  })();

  /* ---------- Saree film roll ---------- */
  lbGroups.saree = C.sareeRoll;
  $("#film").innerHTML =
    `<video muted loop playsinline autoplay preload="metadata" poster="assets/video/saree-swing-poster.jpg" src="assets/video/saree-swing.mp4" aria-label="সাদা শাড়িতে দোলনায়"></video>` +
    C.sareeRoll.map((p, k) => `<button type="button" data-lb="saree" data-k="${k}" aria-label="ছবি বড় করে দেখুন"><img loading="lazy" src="${img(p)}" alt=""></button>`).join("");

  /* ---------- Letters ---------- */
  lbGroups.letters = C.letters.map((l) => l.img);
  $("#lettersLede").textContent = `${bn(C.letters.length)}টা চিঠি, ${fmtDate(C.letters[0].date, false)} থেকে। ছুঁয়ে পড়ুন।`;
  $("#desk").innerHTML = C.letters.map((l, k) => {
    const r = ((k * 37) % 7) - 3;
    return `<button type="button" data-lb="letters" data-k="${k}" style="--r:${r}deg" aria-label="${fmtDate(l.date, false)}-এর চিঠি"><img loading="lazy" src="${img(l.img)}" alt=""><small>${fmtDate(l.date, false)}</small></button>`;
  }).join("");

  /* ---------- Songs ---------- */
  $("#songList").innerHTML = C.songs.map((s) => `<li>${esc(s)}</li>`).join("");
  $("#favMovie").textContent = C.favMovie;

  /* ---------- Letter ---------- */
  $("#paper").innerHTML =
    C.letter.map((p, i) => `<p${i === 0 ? ' class="salute"' : ""}>${esc(p)}</p>`).join("") +
    `<p class="sign">${esc(C.signature)}</p>`;

  /* ---------- Cake ---------- */
  $("#meetBtn").href = C.meetLink;
  $("#cakeBtn").addEventListener("click", function () {
    if (this.classList.contains("blown")) return;
    this.classList.add("blown");
    this.setAttribute("aria-label", "মোমবাতি নিভে গেছে");
    $("#cakeLede").textContent = "";
    $("#afterWish").hidden = false;
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) petalRain();
  });
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

  /* ---------- Lightbox ---------- */
  const lb = $("#lightbox");
  let lbList = [], lbI = 0;
  function showLb() { $("#lbImg").src = img(lbList[lbI]); $("#lbPrev").hidden = lbI === 0; $("#lbNext").hidden = lbI === lbList.length - 1; }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-lb]");
    if (!b) return;
    lbList = lbGroups[b.dataset.lb] || [];
    lbI = Number(b.dataset.k) || 0;
    showLb();
    lb.showModal();
  });
  $("#lbClose").addEventListener("click", () => lb.close());
  $("#lbPrev").addEventListener("click", () => { if (lbI > 0) { lbI--; showLb(); } });
  $("#lbNext").addEventListener("click", () => { if (lbI < lbList.length - 1) { lbI++; showLb(); } });
  lb.addEventListener("click", (e) => { if (e.target === lb) lb.close(); });
  lb.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") $("#lbPrev").click();
    if (e.key === "ArrowRight") $("#lbNext").click();
  });
  let tx = null;
  lb.addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx; tx = null;
    if (dx > 50) $("#lbPrev").click(); else if (dx < -50) $("#lbNext").click();
  });
})();
