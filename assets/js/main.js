/* =========================================================================
   SAHA TOURS AND TRAVELS — main.js
   Scroll effects, motion graphics and the Trip Desk booking assistant.
   No dependencies beyond Bootstrap's bundle (already loaded in the page).
   ========================================================================= */

(function () {
  "use strict";

  /* ----- site config: change these in ONE place ------------------------ */
  window.ATTARI = window.ATTARI || {};
  const CFG = Object.assign({
    root: "/",
    phone: "+919832452222",
    phoneLabel: "+91 98324 52222",
    whatsapp: "919832452222",
    email: "sahatoursandtravels@gmail.com"
  }, window.ATTARI);

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.prototype.slice.call((c || document).querySelectorAll(s));

  /* =====================================================================
     1. Scroll reveal
     ===================================================================== */
  function initReveal() {
    const items = $$(".reveal, .reveal-l, .reveal-r, .reveal-z");
    if (!items.length) return;
    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach(el => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const d = parseInt(e.target.dataset.delay || 0, 10);
        setTimeout(() => e.target.classList.add("in"), d);
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
    items.forEach(el => io.observe(el));
  }

  /* =====================================================================
     2. Header state + scroll progress bar + back to top
     ===================================================================== */
  function initScrollChrome() {
    const header = $(".site-header");
    const speedo = $(".speedo");
    const arc = $(".sp-arc");
    const R = arc ? parseFloat(arc.getAttribute("r")) : 0;
    const C = 2 * Math.PI * R;
    if (arc) { arc.style.strokeDasharray = C; arc.style.strokeDashoffset = C; }
    let ticking = false;

    function onScroll() {
      const y = window.scrollY;
      if (header) header.classList.toggle("is-stuck", y > 20);
      if (speedo) speedo.classList.toggle("show", y > 480);
      if (arc) {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        const p = h > 0 ? Math.min(y / h, 1) : 0;
        arc.style.strokeDashoffset = C * (1 - p);
      }
      ticking = false;
    }
    window.addEventListener("scroll", () => {
      if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });
    onScroll();

    const btn = $(".speedo button");
    if (btn) btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }));
  }

  /* =====================================================================
     2b. Dashboard gauges — arc sweeps to its value when scrolled into view
     ===================================================================== */
  function initGauges() {
    const gauges = $$(".gauge");
    if (!gauges.length) return;
    const sweep = (g) => {
      const arc = $(".g-arc", g);
      if (!arc) return;
      const len = arc.getTotalLength();
      const pct = Math.min(Math.max(parseFloat(g.dataset.fill || 0.7), 0), 1);
      arc.style.strokeDasharray = len;
      arc.style.strokeDashoffset = len;
      if (reduced) { arc.style.strokeDashoffset = len * (1 - pct); return; }
      requestAnimationFrame(() => {
        arc.style.transition = "stroke-dashoffset 1.5s cubic-bezier(.2,.8,.3,1)";
        arc.style.strokeDashoffset = len * (1 - pct);
      });
    };
    if (!("IntersectionObserver" in window)) { gauges.forEach(sweep); return; }
    const io = new IntersectionObserver((es) => {
      es.forEach(e => { if (e.isIntersecting) { sweep(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.4 });
    gauges.forEach(g => io.observe(g));
  }

  /* =====================================================================
     2c. Odometer — value rolls up into individual digit cells
     ===================================================================== */
  function initOdometer() {
    const odos = $$("[data-odo]");
    if (!odos.length) return;

    const paint = (el, val) => {
      const target = parseFloat(el.dataset.odo);
      const decimals = (String(target).split(".")[1] || "").length;
      const txt = val.toFixed(decimals) + (el.dataset.suffix || "");
      const chars = txt.split("");
      if (el.children.length !== chars.length) {
        el.innerHTML = chars.map(c =>
          '<span class="digit' + (/[0-9]/.test(c) ? '' : ' sep') + '">' + c + '</span>'
        ).join("");
      } else {
        chars.forEach((c, i) => { el.children[i].textContent = c; });
      }
    };

    const roll = (el) => {
      const target = parseFloat(el.dataset.odo);
      if (reduced) { paint(el, target); return; }
      const dur = 1600, t0 = performance.now();
      const step = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        paint(el, target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      paint(el, 0);
      requestAnimationFrame(step);
    };

    if (!("IntersectionObserver" in window)) { odos.forEach(roll); return; }
    const io = new IntersectionObserver((es) => {
      es.forEach(e => { if (e.isIntersecting) { roll(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.45 });
    odos.forEach(o => io.observe(o));
  }

  /* =====================================================================
     3. Animated counters
     ===================================================================== */
  function initCounters() {
    const nums = $$("[data-count]");
    if (!nums.length) return;
    const run = (el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      const dur = 1400;
      const fmt = (n) => (target % 1 ? n.toFixed(1) : Math.round(n).toLocaleString("en-IN"));
      if (reduced) { el.textContent = fmt(target) + suffix; return; }
      const t0 = performance.now();
      const step = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((es) => {
      es.forEach(e => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.5 });
    nums.forEach(n => io.observe(n));
  }


  /* =====================================================================
     4b. Speedometer gauges — motion graphic for the stats band
     ===================================================================== */
  function initGauges() {
    const wraps = $$("[data-gauge]");
    if (!wraps.length) return;

    const A0 = 145, A1 = 395;              // sweep, in degrees
    const R = 78, CX = 100, CY = 100;
    const pol = (deg, r) => {
      const a = (deg * Math.PI) / 180;
      return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
    };
    const arc = (from, to) => {
      const [x1, y1] = pol(from, R), [x2, y2] = pol(to, R);
      const big = to - from > 180 ? 1 : 0;
      return `M ${x1} ${y1} A ${R} ${R} 0 ${big} 1 ${x2} ${y2}`;
    };

    wraps.forEach((w) => {
      const target = parseFloat(w.dataset.count);
      const suffix = w.dataset.suffix || "";
      const label = w.dataset.label || "";
      const frac = Math.min(Math.max(parseFloat(w.dataset.gauge) || 0.7, 0), 1);

      let ticks = "";
      for (let i = 0; i <= 10; i++) {
        const d = A0 + ((A1 - A0) * i) / 10;
        const [ax, ay] = pol(d, R - 14), [bx, by] = pol(d, R - (i % 5 === 0 ? 23 : 19));
        ticks += `<line x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="rgba(0,0,0,.35)" stroke-width="${i % 5 === 0 ? 3 : 1.6}"/>`;
      }

      w.innerHTML =
        `<svg class="gauge" viewBox="0 0 200 165" role="img" aria-label="${label}: ${target}${suffix}">
           <path class="gauge-track" d="${arc(A0, A1)}"/>
           <path class="gauge-fill" d="${arc(A0, A1)}"/>
           ${ticks}
           <line class="gauge-needle" x1="${CX}" y1="${CY}" x2="${CX}" y2="${CY - 52}"/>
           <circle class="gauge-hub" cx="${CX}" cy="${CY}" r="7"/>
         </svg>
         <div class="gauge-num"><span class="g-val">0</span>${suffix}</div>
         <div class="gauge-lbl">${label}</div>`;

      const fill = $(".gauge-fill", w);
      const needle = $(".gauge-needle", w);
      const val = $(".g-val", w);
      const len = fill.getTotalLength();
      fill.style.strokeDasharray = len;
      fill.style.strokeDashoffset = len;

      const paint = (p) => {
        fill.style.strokeDashoffset = len * (1 - p * frac);
        const deg = A0 + (A1 - A0) * p * frac + 90;
        needle.setAttribute("transform", `rotate(${deg.toFixed(1)} ${CX} ${CY})`);
        const n = target % 1 ? (target * p).toFixed(1) : Math.round(target * p);
        val.textContent = target > 999 ? Number(n).toLocaleString("en-IN") : n;
      };

      if (reduced) { paint(1); return; }

      const run = () => {
        const t0 = performance.now(), dur = 1700;
        const step = (t) => {
          const p = Math.min((t - t0) / dur, 1);
          paint(1 - Math.pow(1 - p, 3));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      };

      paint(0);
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver((es) => {
          es.forEach(e => { if (e.isIntersecting) { run(); io.disconnect(); } });
        }, { threshold: 0.45 });
        io.observe(w);
      } else { run(); }
    });
  }

  /* =====================================================================
     5. Motion graphic — car drives the route as you scroll
     ===================================================================== */
  function initRoadmap() {
    const wrap = $(".roadmap");
    if (!wrap) return;
    const path = $(".road-line", wrap);
    const prog = $(".road-progress", wrap);
    const car = $(".road-car", wrap);
    if (!path || !prog || !car) return;

    const len = path.getTotalLength();
    prog.style.strokeDasharray = len;
    prog.style.strokeDashoffset = len;

    function place(p) {
      prog.style.strokeDashoffset = len * (1 - p);
      const pt = path.getPointAtLength(len * p);
      const nx = path.getPointAtLength(Math.min(len, len * p + 6));
      const ang = Math.atan2(nx.y - pt.y, nx.x - pt.x) * 180 / Math.PI;
      car.setAttribute("transform", `translate(${pt.x} ${pt.y}) rotate(${ang}) translate(-18 -13)`);
    }

    if (reduced) { place(1); return; }

    let ticking = false;
    function update() {
      const r = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(Math.max((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0), 1);
      place(p);
      ticking = false;
    }
    window.addEventListener("scroll", () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    window.addEventListener("resize", update);
    place(0);
    update();
  }

  /* =====================================================================
     5. Light parallax on tagged elements
     ===================================================================== */
  function initParallax() {
    const els = $$("[data-parallax]");
    if (!els.length || reduced) return;
    let ticking = false;
    function move() {
      const vh = window.innerHeight;
      els.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const speed = parseFloat(el.dataset.parallax) || 0.12;
        const offset = (r.top + r.height / 2 - vh / 2) * -speed;
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      });
      ticking = false;
    }
    window.addEventListener("scroll", () => {
      if (!ticking) { requestAnimationFrame(move); ticking = true; }
    }, { passive: true });
    move();
  }

  /* =====================================================================
     6. Active nav link
     ===================================================================== */
  function initActiveNav() {
    let file = (location.pathname.replace(/\/$/, "").split("/").pop() || "home").replace(/\.(html|aspx)$/i, "");
    if (file === "index" || file === "default") file = "home";
    $$(".nav-link, .dropdown-item").forEach((a) => {
      const href = (a.getAttribute("href") || "").split("/").pop();
      if (href && href === file) {
        a.classList.add("active");
        const dd = a.closest(".dropdown");
        if (dd) $(".nav-link", dd) && $(".nav-link", dd).classList.add("active");
      }
    });
  }

  /* =====================================================================
     8. TRIP DESK — the booking assistant
     ===================================================================== */
  const VEHICLES = {
    "Hatchback (Wagon R / Alto)": { seats: 4, km: 13 },
    "Sedan (Dzire / Etios)": { seats: 4, km: 15 },
    "SUV (Scorpio / Bolero)": { seats: 7, km: 19 },
    "Innova Crysta": { seats: 6, km: 22 },
    "Tempo Traveller (12+1)": { seats: 12, km: 28 }
  };

  const ROUTES = {
    "njp-gangtok": { label: "NJP / Bagdogra → Gangtok", km: 125, hrs: "4 hrs 30 min", sedan: 3200 },
    "njp-darjeeling": { label: "NJP / Bagdogra → Darjeeling", km: 70, hrs: "3 hrs", sedan: 2800 },
    "njp-phuentsholing": { label: "Bagdogra → Phuentsholing (Bhutan gate)", km: 155, hrs: "4 hrs", sedan: 3800 },
    "gangtok-lachung": { label: "Gangtok → Lachung", km: 118, hrs: "6 hrs", sedan: 7500 },
    "guwahati-shillong": { label: "Guwahati → Shillong", km: 100, hrs: "3 hrs 15 min", sedan: 3400 }
  };

  class TripDesk {
    constructor(root) {
      this.root = root;
      this.body = $(".tripdesk-body", root);
      this.chips = $(".tripdesk-chips", root);
      this.input = $(".tripdesk-input", root);
      this.form = $(".tripdesk-foot", root);
      this.state = "idle";
      this.data = {};
      this.started = false;
      this.bind();
    }

    bind() {
      if (this.form) {
        this.form.addEventListener("submit", (e) => {
          e.preventDefault();
          const v = this.input.value.trim();
          if (!v) return;
          this.input.value = "";
          this.say(v, "user");
          setTimeout(() => this.handle(v), 340);
        });
      }
      this.chips && this.chips.addEventListener("click", (e) => {
        const c = e.target.closest(".chip");
        if (!c) return;
        const val = c.dataset.value || c.textContent.trim();
        this.say(c.textContent.trim(), "user");
        this.setChips([]);
        setTimeout(() => this.handle(val), 340);
      });
    }

    /* ---- rendering helpers ---- */
    say(html, who) {
      const w = document.createElement("div");
      w.className = "msg msg-" + (who === "user" ? "user" : "bot");
      w.innerHTML = '<div class="bubble">' + html + "</div>";
      this.body.appendChild(w);
      this.scroll();
      return w;
    }

    typing() {
      const w = document.createElement("div");
      w.className = "msg msg-bot t-hold";
      w.innerHTML = '<div class="bubble"><span class="typing"><span></span><span></span><span></span></span></div>';
      this.body.appendChild(w);
      this.scroll();
      return w;
    }

    /** bot message with a realistic typing pause */
    bot(html, delay) {
      return new Promise((res) => {
        const t = this.typing();
        setTimeout(() => {
          t.remove();
          this.say(html, "bot");
          res();
        }, reduced ? 60 : (delay || Math.min(260 + html.length * 7, 1100)));
      });
    }

    setChips(list) {
      if (!this.chips) return;
      this.chips.innerHTML = "";
      (list || []).forEach((c, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "chip";
        b.style.animationDelay = (i * 45) + "ms";
        b.textContent = typeof c === "string" ? c : c.text;
        if (c.value) b.dataset.value = c.value;
        this.chips.appendChild(b);
      });
    }

    scroll() { this.body.scrollTop = this.body.scrollHeight; }

    /* live taxi-meter readout above the conversation */
    meter(patch) {
      Object.assign(this.data, patch || {});
      const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
      const short = (t) => !t ? "\u2014" : String(t).split(/[ ,(]/)[0].slice(0, 11);
      set("mFrom", short(this.data.pickup));
      set("mTo", short(this.data.drop));
      set("mCar", this.data.vehicle ? short(this.data.vehicle) : "\u2014");

      let fare = 0;
      if (this.data.pickup && this.data.drop) {
        const key = (this.data.pickup + " " + this.data.drop).toLowerCase();
        const hit = Object.keys(ROUTES).find(k => {
          const parts = k.split("-");
          return key.indexOf(parts[0].slice(0, 4)) > -1 && key.indexOf(parts[1].slice(0, 5)) > -1;
        });
        fare = hit ? ROUTES[hit].sedan : 3000;
        const v = VEHICLES[this.data.vehicle];
        if (v) fare = Math.round((fare * v.km) / 15 / 50) * 50;
      }
      set("mFare", "\u20B9 " + (fare ? fare.toLocaleString("en-IN") : "0"));
    }

    /* ---- conversation ---- */
    async start() {
      if (this.started) return;
      this.started = true;
      await this.bot("Namaste! the trip desk at Saha Tours and Travels. 🚕<span class=\"b-mono\">Sikkim · Darjeeling · Bhutan · North East</span>");
      await this.bot("Tell me what you need and I'll put a quote together in about a minute.");
      this.state = "menu";
      this.setChips([
        { text: "Book a car", value: "book" },
        { text: "Tour packages", value: "packages" },
        { text: "Airport pickup", value: "airport" },
        { text: "Check fare", value: "fare" },
        { text: "Bhutan permit", value: "permit" }
      ]);
    }

    async handle(raw) {
      const t = String(raw).toLowerCase();

      /* free-text intent matching, checked before the step machine */
      if (/(human|call|phone|talk|agent)/.test(t) && this.state !== "name") return this.human();
      if (/(hi|hello|hey|namaste)$/.test(t.trim())) {
        await this.bot("Hello! What can I get sorted for you?");
        return this.menuChips();
      }

      switch (this.state) {
        case "menu": return this.route(t);
        case "pickup": return this.askDrop(raw);
        case "drop": return this.askDate(raw);
        case "date": return this.askVehicle(raw);
        case "vehicle": return this.askName(raw);
        case "name": return this.askPhone(raw);
        case "phone": return this.summary(raw);
        case "done": return this.route(t);
        default: return this.route(t);
      }
    }

    menuChips() {
      this.state = "menu";
      this.setChips([
        { text: "Book a car", value: "book" },
        { text: "Tour packages", value: "packages" },
        { text: "Check fare", value: "fare" },
        { text: "Bhutan permit", value: "permit" }
      ]);
    }

    async route(t) {
      if (/book|car|cab|taxi|hire|rent/.test(t)) return this.startBooking();
      if (/package|tour|itiner|trip|holiday/.test(t)) return this.packages();
      if (/airport|njp|bagdogra|station|pickup|transfer/.test(t)) return this.airport();
      if (/fare|rate|price|cost|charge|kitna|kitne/.test(t)) return this.fares();
      if (/permit|bhutan|inner line|ilp|nathula|visa/.test(t)) return this.permits();
      if (/sikkim|gangtok|lachung|pelling|tsomgo/.test(t)) return this.dest("Sikkim");
      if (/darjeeling|kalimpong|mirik|tiger hill/.test(t)) return this.dest("Darjeeling");
      if (/meghalaya|assam|shillong|guwahati|kaziranga|cherrapunji|north east|northeast/.test(t)) return this.dest("North East");
      if (/driver|safe|licence|license/.test(t)) {
        await this.bot("Every driver is police-verified, hill-trained and has driven these routes for years. You get the driver's name and number the evening before pickup.");
        return this.menuChips();
      }
      if (/cancel|refund/.test(t)) {
        await this.bot("Free cancellation up to 48 hours before pickup. Inside 48 hours the advance is adjusted against a future trip. Full policy is on the Cancellation &amp; Refund page.");
        return this.menuChips();
      }
      await this.bot("I can help with cab bookings, tour packages, fares, and Bhutan or Sikkim permits. Pick one and we'll move fast:");
      this.menuChips();
    }

    async startBooking() {
      this.data = {}; this.meter();
      await this.bot("Let's do it. <strong>Where should the car pick you up?</strong>");
      this.state = "pickup";
      this.setChips(["NJP Station", "Bagdogra Airport", "Siliguri", "Gangtok", "Guwahati"]);
    }

    async airport() {
      await this.bot("Airport and station transfers run <strong>24×7</strong>, with the driver waiting inside the arrivals gate holding your name board. Flight delayed? Waiting is free for 60 minutes.");
      return this.startBooking();
    }

    async askDrop(v) {
      this.data.pickup = v; this.meter();
      await this.bot("Noted — pickup from <strong>" + this.esc(v) + "</strong>. <strong>Where are you headed?</strong>");
      this.state = "drop";
      this.setChips(["Gangtok", "Darjeeling", "Pelling", "Lachung", "Phuentsholing", "Shillong"]);
    }

    async askDate(v) {
      this.data.drop = v; this.meter();
      await this.bot("<strong>" + this.esc(this.data.pickup) + " → " + this.esc(v) + "</strong>. Which date do you travel?");
      this.state = "date";
      this.setChips(["Today", "Tomorrow", "This weekend", "Next month"]);
    }

    async askVehicle(v) {
      this.data.date = v;
      await this.bot("Perfect. <strong>How many people are travelling?</strong> I'll suggest the right vehicle.");
      this.state = "vehicle";
      this.setChips(Object.keys(VEHICLES).map(k => ({ text: k.split(" (")[0], value: k })));
    }

    async askName(v) {
      const key = Object.keys(VEHICLES).find(k => k.toLowerCase().indexOf(String(v).toLowerCase()) === 0) || v;
      this.data.vehicle = key; this.meter();
      const meta = VEHICLES[key];
      await this.bot(meta
        ? "<strong>" + this.esc(key) + "</strong> it is — seats " + meta.seats + ", from ₹" + meta.km + "/km on hill routes.<span class=\"b-mono\">Toll, parking and driver allowance included in the final quote</span>"
        : "Got it.");
      await this.bot("Last two things. <strong>What's your name?</strong>");
      this.state = "name";
      this.setChips([]);
    }

    async askPhone(v) {
      this.data.name = v;
      await this.bot("Thanks " + this.esc(v.split(" ")[0]) + ". <strong>Your mobile number</strong> so the dispatcher can confirm?");
      this.state = "phone";
    }

    async summary(v) {
      this.data.mobile = v;
      const d = this.data;
      await this.bot("Here's your request:<span class=\"b-mono\">TRIP · " + this.esc(d.pickup) + " → " + this.esc(d.drop) +
        "<br>DATE · " + this.esc(d.date) +
        "<br>CAR · " + this.esc(d.vehicle || "To be advised") +
        "<br>NAME · " + this.esc(d.name) + " · " + this.esc(d.mobile) + "</span>");

      const msg = encodeURIComponent(
        "New booking request from the website\n" +
        "Trip: " + d.pickup + " to " + d.drop + "\n" +
        "Date: " + d.date + "\n" +
        "Vehicle: " + (d.vehicle || "-") + "\n" +
        "Name: " + d.name + "\n" +
        "Mobile: " + d.mobile
      );
      await this.bot('Send it across and the dispatcher will reply with a fixed all-inclusive fare, usually within 15 minutes.' +
        '<br><br><a class="btn btn-ink btn-sm-x mt-1" target="_blank" rel="noopener" href="https://wa.me/' + CFG.whatsapp + '?text=' + msg + '"><i class="fa-brands fa-whatsapp"></i> Send on WhatsApp</a>' +
        ' <a class="btn btn-line btn-sm-x mt-1" href="tel:' + CFG.phone + '"><i class="fa-solid fa-phone"></i> Call now</a>');
      this.state = "done";
      this.setChips([{ text: "Start a new booking", value: "book" }, { text: "Tour packages", value: "packages" }]);
    }

    async packages() {
      await this.bot("Our most-booked packages right now:<span class=\"b-mono\">GANGTOK + LACHUNG · 5N/6D · from ₹18,500 pp<br>DARJEELING + KALIMPONG · 3N/4D · from ₹11,900 pp<br>BHUTAN GRAND · 6N/7D · from ₹32,400 pp<br>MEGHALAYA CIRCUIT · 5N/6D · from ₹21,800 pp</span>All of them include the car, driver, hotels, permits and daily sightseeing.");
      await this.bot('Want the full day-by-day plan? <a href="' + (CFG.root || "/") + 'tour-packages"><strong>Open tour packages →</strong></a>');
      this.setChips([{ text: "Book a car instead", value: "book" }, { text: "Bhutan permit", value: "permit" }]);
      this.state = "menu";
    }

    async fares() {
      const r = ROUTES;
      await this.bot("Sample sedan fares, all-inclusive:<span class=\"b-mono\">" +
        r["njp-darjeeling"].label + " · ₹" + r["njp-darjeeling"].sedan + "<br>" +
        r["njp-gangtok"].label + " · ₹" + r["njp-gangtok"].sedan + "<br>" +
        r["njp-phuentsholing"].label + " · ₹" + r["njp-phuentsholing"].sedan + "<br>" +
        r["guwahati-shillong"].label + " · ₹" + r["guwahati-shillong"].sedan +
        "</span>Toll, parking, fuel and driver allowance are already in these numbers.");
      this.setChips([{ text: "Book this trip", value: "book" }, { text: "See full fare chart", value: "fare-page" }]);
      this.state = "menu";
    }

    async permits() {
      await this.bot("Permits are on us — we file them, you just carry the documents:<span class=\"b-mono\">BHUTAN · entry permit at Phuentsholing, 1 working day<br>SIKKIM PROTECTED AREAS · Nathula, Lachen, Lachung, Gurudongmar<br>NEED · passport or voter ID, photos, and a filled form</span>Foreign nationals need a RAP for Sikkim, which we arrange too.");
      this.setChips([{ text: "Plan a Bhutan trip", value: "packages" }, { text: "Book a car", value: "book" }]);
      this.state = "menu";
    }

    async dest(name) {
      const copy = {
        "Sikkim": "Sikkim runs on permits and altitude. We handle Nathu La, Lachen and Lachung protected-area passes and use hill-tested 4×4s for the North Sikkim leg.",
        "Darjeeling": "Darjeeling works best as a 3–4 day loop with Tiger Hill sunrise, Batasia, the toy train ride and Mirik on the way down.",
        "North East": "Meghalaya, Assam and Arunachal need long driving days, so we plan them with double drivers and pre-booked stays."
      };
      await this.bot(copy[name]);
      this.setChips([{ text: "Book a car", value: "book" }, { text: "See packages", value: "packages" }]);
      this.state = "menu";
    }

    async human() {
      await this.bot('Of course. Our dispatcher is on <strong>' + CFG.phoneLabel + '</strong>, 24×7.' +
        '<br><br><a class="btn btn-ink btn-sm-x mt-1" href="tel:' + CFG.phone + '"><i class="fa-solid fa-phone"></i> Call the desk</a>' +
        ' <a class="btn btn-line btn-sm-x mt-1" target="_blank" rel="noopener" href="https://wa.me/' + CFG.whatsapp + '"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a>');
      this.state = "menu";
      this.setChips([]);
    }

    esc(s) { return String(s).replace(/[<>&"]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c])); }
  }

  function initChat() {
    /* hero-embedded desk starts when it scrolls into view */
    const hero = $("#tripdeskHero");
    if (hero) {
      const desk = new TripDesk(hero);
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver((es) => {
          es.forEach(e => { if (e.isIntersecting) { desk.start(); io.disconnect(); } });
        }, { threshold: 0.25 });
        io.observe(hero);
      } else { desk.start(); }
    }

    /* floating desk on every page */
    const dock = $("#chatDock");
    const fab = $("#chatFab");
    if (dock && fab) {
      const desk2 = new TripDesk($(".tripdesk", dock));
      fab.addEventListener("click", () => {
        const open = dock.classList.toggle("open");
        fab.innerHTML = open
          ? '<i class="fa-solid fa-xmark"></i>'
          : '<span class="fab-ping"></span><i class="fa-solid fa-comment-dots"></i><span class="fab-badge">1</span>';
        fab.setAttribute("aria-expanded", open ? "true" : "false");
        if (open) { desk2.start(); const i = $(".tripdesk-input", dock); i && i.focus(); }
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && dock.classList.contains("open")) fab.click();
      });
    }
  }

  /* =====================================================================
     9. Booking / contact forms — client-side validation + WhatsApp handoff
     ===================================================================== */
  function initForms() {
    /* Every form carrying data-wa is saved to the database through
       Api/Enquiry.ashx and then handed over to WhatsApp with the same text
       the static site used to build. data-type / data-source tell the admin
       panel which page the enquiry came from. */
    const apiUrl = (CFG.root || "/") + "Api/Enquiry.ashx";

    /* Bot defence: every enquiry form gets (1) a honeypot field that is
       invisible to a person but visible to a script that blindly fills in
       every input, and (2) a render-time stamp so a submission that arrives
       suspiciously fast can be flagged as automated. Both travel to the
       server as ordinary form fields and Api/Enquiry.ashx decides what to
       do with them; injecting them here means every current and future
       form[data-wa] is covered without editing each page's markup. */
    let hpSeq = 0;
    $$("form[data-wa]").forEach((f) => {
      if (!f.querySelector('input[name="website_url"]')) {
        hpSeq++;
        const wrap = document.createElement("div");
        wrap.className = "hp-field";
        wrap.setAttribute("aria-hidden", "true");
        wrap.innerHTML = '<label for="hpUrl' + hpSeq + '">Leave this field blank</label>' +
          '<input type="text" id="hpUrl' + hpSeq + '" name="website_url" tabindex="-1" autocomplete="off">';
        f.appendChild(wrap);
      }
      f.dataset.renderedAt = String(Date.now());
    });

    /* Phone inputs: digits only, capped at the field's own maxlength (set in
       markup, normally 10 for an Indian mobile number) as the user types. */
    $$('input[type="tel"]').forEach((i) => {
      i.addEventListener("input", () => {
        const max = parseInt(i.getAttribute("maxlength"), 10) || 10;
        const digits = i.value.replace(/\D/g, "").slice(0, max);
        if (digits !== i.value) i.value = digits;
      });
    });

    $$("form[data-wa]").forEach((f) => {
      f.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!f.checkValidity()) { f.classList.add("was-validated"); return; }
        const fd = new FormData(f);
        let lines = [f.dataset.wa || "Website enquiry"];
        fd.forEach((v, k) => { if (v && k.indexOf("__") !== 0 && k !== "website_url") lines.push(k + ": " + v); });
        let waUrl = "https://wa.me/" + CFG.whatsapp + "?text=" + encodeURIComponent(lines.join("\n"));

        fd.append("__wa", f.dataset.wa || "");
        fd.append("__type", f.dataset.type || "Enquiry");
        fd.append("__source", f.dataset.source || document.title);
        fd.append("__url", location.href);
        fd.append("__ts", f.dataset.renderedAt || String(Date.now()));

        const btn = $('[type="submit"]', f);
        const err = $(".form-error", f);
        if (btn) btn.classList.add("is-busy");
        if (err) { err.style.display = "none"; err.textContent = ""; }

        // open the tab synchronously (popup blockers) and point it at WhatsApp once saved
        // WhatsApp redirection disabled — form now goes only to the thank-you page
        // const win = f.dataset.wa === "off" ? null : window.open("about:blank", "_blank");
        const win = null;

        const finish = (ok, msg) => {
          if (btn) btn.classList.remove("is-busy");
          if (!ok) {
            if (win) win.close();
            if (err) { err.textContent = msg || "Could not send right now. Please call or WhatsApp us."; err.style.display = "block"; }
            return;
          }
          // WhatsApp redirection disabled
          // if (win) { try { win.opener = null; win.location.href = waUrl; } catch (x) { window.open(waUrl, "_blank", "noopener"); } }
          const okBox = $(".form-success", f);
          if (okBox) { okBox.hidden = false; okBox.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" }); }
          f.reset(); f.classList.remove("was-validated");
          const done = f.dataset.done;
          if (done) setTimeout(() => { location.href = done; }, 700);
        };

        fetch(apiUrl, { method: "POST", body: fd, credentials: "same-origin" })
          .then((r) => r.json())
          .then((j) => {
            if (j && j.ok) { if (j.wa) waUrl = j.wa; finish(true); }
            else finish(false, j && j.error);
          })
          .catch(() => {
            // network hiccup: still take the visitor to the thank-you page
            // (old behaviour: still let the visitor reach WhatsApp)
            finish(true);
          });
      });
    });

    /* set today's date as the minimum on every date input */
    const today = new Date().toISOString().split("T")[0];
    $$('input[type="date"]').forEach(i => { if (!i.min) i.min = today; });
  }

  /* =====================================================================
     10. Filters (packages / gallery)
     ===================================================================== */
  function initFilters() {
    $$("[data-filter-group]").forEach((group) => {
      const targetSel = group.dataset.filterGroup;
      group.addEventListener("click", (e) => {
        const b = e.target.closest("[data-filter]");
        if (!b) return;
        $$("[data-filter]", group).forEach(x => x.classList.remove("btn-sun", "active"));
        $$("[data-filter]", group).forEach(x => x.classList.add("btn-line"));
        b.classList.remove("btn-line");
        b.classList.add("btn-sun", "active");
        const val = b.dataset.filter;
        $$(targetSel).forEach((card) => {
          // data-tags sits on the grid column, not on the card itself, and the
          // column is what has to be hidden — hiding only the card would leave
          // an empty cell holding the layout open.
          const holder = card.closest("[data-tags]") || card;
          const tags = (holder.dataset.tags || "").split(" ");
          const show = val === "all" || tags.indexOf(val) > -1;
          holder.style.display = show ? "" : "none";
        });
      });

      // The Tour Packages menu links straight to a region — tour-packages.html
      // ?region=sikkim. Clicking the matching button rather than duplicating
      // the filter logic keeps the active-button styling right for free.
      // The value goes into a selector, so only a plain slug is accepted.
      const want = (new URLSearchParams(location.search).get("region") || "").toLowerCase();
      if (/^[a-z0-9-]{1,32}$/.test(want)) {
        const pre = $('[data-filter="' + want + '"]', group);
        if (pre) {
          pre.click();
          // land on the filtered grid, not at the top of a page that looks
          // unchanged until you scroll
          group.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
        }
      }
    });
  }

  /* =====================================================================
     10a. Header call button — the two desk numbers share one slot and roll
     through it. The href follows whichever number is showing, so a tap always
     dials what the visitor can read.
     ===================================================================== */
  function initCallRoll() {
    $$(".call-roll").forEach((roll) => {
      const nums = $$(".call-num", roll);
      if (nums.length < 2) return;
      const link = roll.closest('a[href^="tel:"]');
      let i = Math.max(0, nums.findIndex((n) => n.classList.contains("is-on")));
      let timer = null;

      const step = () => {
        const out = nums[i];
        i = (i + 1) % nums.length;
        const next = nums[i];
        out.classList.remove("is-on");
        out.classList.add("is-out");
        next.classList.add("is-on");
        if (link && next.dataset.tel) link.href = "tel:" + next.dataset.tel;
        setTimeout(() => out.classList.remove("is-out"), 620);
      };

      // reduce-motion visitors keep the first number and no movement
      const start = () => { if (!timer && !reduced) timer = setInterval(step, 3600); };
      const stop = () => { clearInterval(timer); timer = null; };

      // A link whose target moves under the pointer is a trap, so it freezes
      // while hovered or focused — and there is nothing to animate for while
      // the tab sits in the background.
      if (link) {
        link.addEventListener("mouseenter", stop);
        link.addEventListener("mouseleave", start);
        link.addEventListener("focusin", stop);
        link.addEventListener("focusout", start);
      }
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) stop(); else start();
      });

      start();
    });
  }

  /* =====================================================================
     10b. Select boxes — a styled listbox in place of the OS dropdown.
     A native <select> renders its open list from the operating system and no
     stylesheet can touch it, so the list here is real markup. The original
     <select> stays in the DOM, visually hidden: it is what the form submits,
     what checkValidity() reads and what fires "change", so nothing else on
     the page has to know this happened. With JavaScript off the native
     control simply shows through unchanged.
     ===================================================================== */
  function initSelects() {
    const selects = $$("select.form-select");
    if (!selects.length) return;

    let open = null;
    const closeAll = () => { if (open) open.close(); };

    selects.forEach((sel, idx) => {
      if (sel.dataset.dd) return;
      sel.dataset.dd = "1";

      const wrap = document.createElement("div");
      wrap.className = "dd";
      sel.parentNode.insertBefore(wrap, sel);
      wrap.appendChild(sel);
      sel.classList.add("dd-native");
      sel.tabIndex = -1;
      sel.setAttribute("aria-hidden", "true");

      const id = sel.id || ("dd" + idx);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.id = id + "-btn";
      btn.className = "dd-btn form-select";
      btn.setAttribute("aria-haspopup", "listbox");
      btn.setAttribute("aria-expanded", "false");
      const tag = sel.id && $('label[for="' + sel.id + '"]');
      if (tag) btn.setAttribute("aria-labelledby", (tag.id || (tag.id = id + "-lbl")) + " " + btn.id);
      const val = document.createElement("span");
      val.className = "dd-val";
      btn.appendChild(val);
      wrap.insertBefore(btn, sel);

      // The menu lives on <body> and is positioned in viewport coordinates.
      // Inside the widget it would be cut off — .searchbox clips its own
      // overflow to keep the rounded corners.
      const menu = document.createElement("div");
      menu.className = "dd-menu";
      menu.id = id + "-menu";
      menu.setAttribute("role", "listbox");
      menu.hidden = true;
      document.body.appendChild(menu);
      btn.setAttribute("aria-controls", menu.id);

      const opts = Array.prototype.map.call(sel.options, (o, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "dd-opt";
        b.setAttribute("role", "option");
        b.dataset.i = i;
        b.textContent = o.textContent;
        menu.appendChild(b);
        return b;
      });

      let cursor = sel.selectedIndex;

      const paint = () => {
        const picked = sel.options[sel.selectedIndex];
        val.textContent = picked ? picked.textContent : "";
        opts.forEach((b, i) => {
          const on = i === sel.selectedIndex;
          b.classList.toggle("is-on", on);
          b.classList.toggle("is-cursor", i === cursor);
          b.setAttribute("aria-selected", on ? "true" : "false");
        });
        btn.disabled = sel.disabled;
      };

      const place = () => {
        const r = btn.getBoundingClientRect();
        const w = Math.max(r.width, 180);
        const below = window.innerHeight - r.bottom;
        const h = Math.min(menu.scrollHeight, 262);
        menu.style.minWidth = w + "px";
        menu.style.left = Math.max(10, Math.min(r.left, window.innerWidth - w - 10)) + "px";
        // flip above the field when there is no room under it
        if (below < h + 16 && r.top > below) {
          menu.style.top = "";
          menu.style.bottom = (window.innerHeight - r.top + 8) + "px";
        } else {
          menu.style.bottom = "";
          menu.style.top = (r.bottom + 8) + "px";
        }
      };

      const api = {
        get isOpen() { return !menu.hidden; },
        open() {
          if (sel.disabled) return;
          closeAll();
          cursor = sel.selectedIndex;
          paint();
          menu.hidden = false;
          place();
          requestAnimationFrame(() => menu.classList.add("is-open"));
          btn.setAttribute("aria-expanded", "true");
          open = api;
          if (opts[cursor]) opts[cursor].scrollIntoView({ block: "nearest" });
        },
        close() {
          menu.hidden = true;
          menu.classList.remove("is-open");
          btn.setAttribute("aria-expanded", "false");
          if (open === api) open = null;
        }
      };

      const pick = (i) => {
        if (i < 0 || i >= sel.options.length) return;
        sel.selectedIndex = i;
        cursor = i;
        paint();
        sel.dispatchEvent(new Event("change", { bubbles: true }));
        api.close();
        btn.focus();
      };

      const move = (step) => {
        cursor = Math.max(0, Math.min(sel.options.length - 1, cursor + step));
        paint();
        opts[cursor].scrollIntoView({ block: "nearest" });
      };

      btn.addEventListener("click", () => { api.isOpen ? api.close() : api.open(); });
      opts.forEach((b) => {
        b.addEventListener("click", () => pick(parseInt(b.dataset.i, 10)));
        b.addEventListener("mousemove", () => { cursor = parseInt(b.dataset.i, 10); paint(); });
      });

      btn.addEventListener("keydown", (e) => {
        const k = e.key;
        if (!api.isOpen) {
          if (k === "ArrowDown" || k === "ArrowUp" || k === "Enter" || k === " ") { e.preventDefault(); api.open(); }
          return;
        }
        if (k === "ArrowDown") { e.preventDefault(); move(1); }
        else if (k === "ArrowUp") { e.preventDefault(); move(-1); }
        else if (k === "Home") { e.preventDefault(); cursor = 0; paint(); }
        else if (k === "End") { e.preventDefault(); cursor = sel.options.length - 1; paint(); }
        else if (k === "Enter" || k === " ") { e.preventDefault(); pick(cursor); }
        else if (k === "Escape") { e.preventDefault(); api.close(); }
        else if (k === "Tab") api.close();
      });

      // the search widget enables and disables its selects as the tabs change,
      // and initForms() resets the form after a submit — mirror both
      if ("MutationObserver" in window) {
        new MutationObserver(paint).observe(sel, { attributes: true, attributeFilter: ["disabled"] });
      }
      sel.addEventListener("change", paint);
      if (sel.form) sel.form.addEventListener("reset", () => setTimeout(paint, 0));

      paint();
    });

    document.addEventListener("click", (e) => {
      if (!open || e.target.closest(".dd") || e.target.closest(".dd-menu")) return;
      closeAll();
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(); });
    window.addEventListener("resize", closeAll);
    window.addEventListener("scroll", closeAll, true);
  }

  /* =====================================================================
     11. Search widget — tab switching and the swap control
     ===================================================================== */
  function initSearchbox() {
    const box = $(".searchbox");
    if (!box) return;
    const tabs = $$(".sbtab", box);
    const hidden = $("#tripType", box);
    const cells = $$(".sb-cell", box);
    const swaps = $$("label[data-car]", box);
    const cta = $("#sbSubmit span", box);
    const dropInput = $("#sTo", box);
    const fromInput = $("#sFrom", box);

    // Each tab owns its own set of cells. Hiding one is not enough: a hidden
    // field is still submitted with the form and still blocks checkValidity(),
    // so the disabled flag is what actually takes it out of the enquiry.
    const showTab = (key) => {
      cells.forEach((c) => {
        const on = c.dataset.tab === "both" || c.dataset.tab === key;
        c.hidden = !on;
        $$("input, select", c).forEach((f) => { f.disabled = !on; });
      });
      swaps.forEach((l) => { if (l.dataset[key]) l.textContent = l.dataset[key]; });
    };

    tabs.forEach((t) => {
      t.addEventListener("click", () => {
        tabs.forEach(x => { x.classList.remove("active"); x.setAttribute("aria-selected", "false"); });
        t.classList.add("active");
        t.setAttribute("aria-selected", "true");
        if (hidden) hidden.value = t.dataset.trip || "";
        if (cta && t.dataset.cta) cta.textContent = t.dataset.cta;
        showTab(t.dataset.key);
      });
    });

    // the markup ships the car tab open; re-assert it so the two never drift
    const open = $(".sbtab.active", box) || tabs[0];
    if (open) showTab(open.dataset.key);

    const swap = $("#swapBtn", box);
    if (swap && fromInput && dropInput) {
      swap.addEventListener("click", () => {
        const a = fromInput.value;
        fromInput.value = dropInput.value;
        dropInput.value = a;
        swap.style.transform = "rotate(180deg)";
        setTimeout(() => { swap.style.transform = ""; }, 260);
      });
    }
  }

  /* =====================================================================
     Card and slide pictures
     Every .ph / .dest card is designed to look finished with or without
     a photograph. If the file is not there yet, drop the <img> so the browser
     does not draw its broken-image marker over the brand fallback.
     ===================================================================== */
  function initArtwork() {
    $$(".ph-img, .dest-img").forEach((img) => {
      const drop = () => { if (img.parentNode) img.parentNode.removeChild(img); };
      if (img.complete && img.naturalWidth === 0) drop();
      else img.addEventListener("error", drop, { once: true });
    });
  }

  /* =====================================================================
     Hero video — the markup already carries autoplay/muted/loop, so this
     only adds the manners: hold on the poster frame for reduce-motion
     visitors, retry once if a browser refused the autoplay, drop the video
     entirely if the file is missing so the poster stands in, and stop
     decoding while the hero is scrolled off screen or the tab is hidden.
     ===================================================================== */
  function initHeroVideo() {
    const vid = $("#heroMedia .hero-video");
    if (!vid) return;

    if (reduced) { vid.removeAttribute("autoplay"); vid.pause(); return; }

    const play = () => {
      const p = vid.play();
      if (p && p.catch) p.catch(() => {});
    };

    // Safari/iOS will not start until the element is muted in the DOM as well
    // as in the attribute, and some browsers only allow the call after a
    // gesture — in that case the poster simply stays up.
    vid.muted = true;
    play();
    vid.addEventListener("canplay", play, { once: true });
    vid.addEventListener("error", () => {
      // no file, or a codec the browser will not take: leave the poster.
      vid.style.display = "none";
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) vid.pause();
      else play();
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((e) => { e.isIntersecting ? play() : vid.pause(); });
      }, { threshold: 0.01 }).observe(vid);
    }
  }

  /* =====================================================================
     Video reviews — a YouTube facade. Each card ships as an ordinary link
     to the video with the poster frame on it, so it still works with no
     JavaScript. Here the click becomes an inline player instead, nothing
     is requested from YouTube until someone actually asks for it, and only
     one card plays at a time.
     ===================================================================== */
  function initVideoReviews() {
    const cards = $$(".vthumb[data-yt]");
    if (!cards.length) return;

    // The markup ships hqdefault.jpg, which YouTube generates for every
    // upload, so the poster is never missing. maxresdefault is sharper but
    // only exists for some videos — probe for it off-DOM and swap it in
    // only once it has actually loaded.
    cards.forEach((card) => {
      const img = $("img", card);
      if (!img) return;
      const hi = "https://i.ytimg.com/vi/" + card.dataset.yt + "/maxresdefault.jpg";
      const probe = new Image();
      probe.addEventListener("load", () => {
        // a missing maxres can come back as a 120x90 grey placeholder
        if (probe.naturalWidth > 320) img.src = hi;
      });
      probe.src = hi;
    });

    let live = null;
    const stop = (box) => {
      if (!box) return;
      const frame = $("iframe", box);
      if (frame) box.removeChild(frame);
      box.classList.remove("is-live");
    };

    cards.forEach((card) => {
      const box = card.closest(".vframe");
      if (!box) return;

      card.addEventListener("click", (e) => {
        // let ctrl / cmd / shift click still open YouTube in its own tab
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();

        if (live && live !== box) stop(live);

        const frame = document.createElement("iframe");
        frame.src = "https://www.youtube-nocookie.com/embed/" + card.dataset.yt +
                    "?autoplay=1&rel=0&modestbranding=1&playsinline=1";
        frame.title = card.getAttribute("aria-label") || "Guest video review";
        frame.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share";
        frame.allowFullscreen = true;
        box.appendChild(frame);
        box.classList.add("is-live");
        live = box;
      });
    });
  }

  /* =====================================================================
     Card carousels — Owl Carousel, four cards on a desktop. Every
     .owl-shell on the page (the fleet and the tour packages) gets the same
     behaviour. Bails out quietly if jQuery or Owl did not load, in which
     case the cards simply stay stacked in the markup order.
     ===================================================================== */
  function initCarousels() {
    const shells = $$(".owl-shell");
    const jq = window.jQuery;
    if (!shells.length || !jq || !jq.fn || !jq.fn.owlCarousel) return;

    shells.forEach(function (el) {
      const label = el.getAttribute("data-owl-label") || "cards";
      // how many fit at the widest breakpoint; the smaller steps never exceed it
      const max = parseInt(el.getAttribute("data-owl-items"), 10) || 4;
      jq(el).owlCarousel({
        items: max,
        margin: 16,
        loop: true,
        nav: true,
        dots: false,
        smartSpeed: 550,
        autoplay: !reduced,
        autoplayTimeout: 4800,
        autoplayHoverPause: true,
        navText: [
          '<i class="fa-solid fa-arrow-left" aria-hidden="true"></i><span class="visually-hidden">Previous ' + label + '</span>',
          '<i class="fa-solid fa-arrow-right" aria-hidden="true"></i><span class="visually-hidden">Next ' + label + '</span>'
        ],
        responsive: {
          0:    { items: 1 },
          576:  { items: Math.min(2, max) },
          992:  { items: Math.min(3, max) },
          1200: { items: max }
        }
      });
    });
  }

  /* =====================================================================
     boot
     ===================================================================== */
  document.addEventListener("DOMContentLoaded", function () {
    initArtwork();
    initHeroVideo();
    initCarousels();
    initVideoReviews();
    initReveal();
    initScrollChrome();
    initCounters();
    initGauges();
    initOdometer();
    initGauges();
    initOdometer();
    initRoadmap();
    initParallax();
    initActiveNav();
    initChat();
    initForms();
    initFilters();
    initSelects();
    initSearchbox();
    initCallRoll();
  });
})();
