(() => {
  // sprites.js
  var palette = { ".": "none", n: "#10243a", w: "#f6f4da", c: "#7ce3ed", b: "#3785ae", g: "#b1edce", y: "#e8c56d", p: "#f27d9f", r: "#bf5277", o: "#ecaa77" };
  var sprites = {
    bubbles: ["................", "......cccc......", "....cc....cc....", "...c..ww....c...", "...c.w......c...", "...c........c...", "....c......c....", ".....cccccc.....", "................", "..ccc...........", ".c...c....cc....", ".c...c...c..c...", "..ccc.....cc....", "................"],
    clever: ["....yyy.........", "...y...y........", "..y.ooo.y.......", "....ooo.........", "...nnnnnn.......", "..nnwwwwnn......", "..nwonnown......", "..nwwwwwwn......", "...nwpwnn.......", "....nnnn........", ".....oo.........", "....oooo........", "...oooooo.......", "................"],
    fish: ["................", ".....bbbb.......", "...bbccccbb.....", "..bccccccccb....", "nbcccwwccccbn...", "nbcccwnccccbn...", "nbcccccccccbnn..", "..bccccccccb....", "...bbccccbb.....", ".....bbbb.......", "................", "................", "................", "................"],
    squid: ["......pppp......", ".....pppppp.....", "....pppppppp....", "...pppppppppp...", "...ppwwppwwpp...", "...ppwnppwnpp...", "...pppppppppp...", "....pppppppp....", ".....pppppp.....", "...p.pp..pp.p...", "..p..p....p..p..", "..p..p....p..p..", "...p..p..p..p...", "................"],
    angler: ["........yyyy....", ".......y....y...", "......y.....y...", ".....nnnn...ww..", "...nnnbbnn..ww..", "..nbbbbwbnn.....", ".nbbbbbwnbnn....", "nnbbbbbbbnnnn...", "nnbbbbwnwnwn....", ".nnbbwwwwwn.....", "...nnnnnnn......", "................", "................", "................"],
    gem: [".....yyyyyy.....", "....yywwwwyy....", "...yywwwwwwyy...", "..yywwwyywwwyy..", ".yywwyyyyyywwyy.", "..yyyyyyyyyyyy..", "...yyyyyyyyyy...", "....yyyyyyyy....", ".....yyyyyy.....", "......yyyy......", ".......yy.......", "................", "................", "................"]
  };
  function tierSprite(points, classes = "") {
    if (points >= 100) return `<svg class="tier-sprite ${classes}" viewBox="0 0 48 38" aria-hidden="true" shape-rendering="crispEdges"><path fill="#584b2c" d="M5 16h7v-5h9V7h16v4h5v10h-7v5h-9v6H13v-3H7v-5H4v-5h1z"/><path fill="#e7bc5e" d="M8 16h8v-5h10V9h9v4h4v6h-7v5h-9v5h-9v-3H9v-5H7v-3h1z"/><path fill="#ffdf8d" d="M12 16h7v-3h8v2h-6v4h-6v4h-4v-3h1zM15 26h7v2h-7z"/><path fill="#c59647" d="M17 21h2v6h-2zM23 16h2v8h-2zM28 13h2v8h-2z"/><path fill="#fff3c8" d="M32 12h5v5h-5z"/><path fill="#2b3440" d="M35 13h2v4h-2z"/><path fill="#e7bd61" d="M38 18h4v-3h5v1h-4v3h-5zM38 20h4v3h4v1h-5v-3h-3zM8 12h4v4H6v-2H3v-2zM19 29h1v6h-4v-1h3zM25 26h1v6h-4v-1h3z"/></svg>`;
    const key = points >= 100 ? "gem" : points >= 85 ? "angler" : points >= 60 ? "squid" : points >= 30 ? "fish" : "bubbles";
    const rows = sprites[key];
    const colors = key === "angler" ? { ...palette, b: "#9272da", y: "#b8a0ef" } : key === "bubbles" ? { ...palette, c: "#9cafcc" } : key === "squid" ? { ...palette, p: "#fa676b" } : palette;
    return `<svg class="tier-sprite ${classes}" viewBox="0 0 16 14" aria-hidden="true" shape-rendering="crispEdges">${rows.flatMap((row, y) => [...row].flatMap((cell, x) => cell === "." ? [] : [`<rect x="${x}" y="${y}" width="1" height="1" fill="${colors[cell]}"/>`])).join("")}</svg>`;
  }

  // render-metrics.js
  var RenderMetrics = class {
    constructor() {
      this.enabled = ["localhost", "127.0.0.1"].includes(location.hostname) && new URLSearchParams(location.search).get("perf") === "1";
      if (!this.enabled) return;
      this.costs = [];
      this.intervals = [];
      this.last = 0;
      this.lastReport = 0;
      this.output = document.createElement("output");
      this.output.id = "render-stats";
      this.output.style.cssText = "position:fixed;left:10px;bottom:7px;z-index:100;font:12px monospace;color:#9dbfcc;background:#071424e8;padding:6px 8px;pointer-events:none";
      this.output.textContent = "Measuring render cost\u2026";
      document.body.append(this.output);
    }
    sample(start, now, ratio, rebuilds = 0) {
      if (!this.enabled) return;
      this.costs.push(performance.now() - start);
      if (this.costs.length > 180) this.costs.shift();
      if (this.last && now - this.last < 200) {
        this.intervals.push(now - this.last);
        if (this.intervals.length > 180) this.intervals.shift();
      }
      this.last = now;
      if (now - this.lastReport < 1e3) return;
      this.lastReport = now;
      const mean = this.costs.reduce((a, b) => a + b, 0) / this.costs.length, sorted = [...this.costs].sort((a, b) => a - b), p95 = sorted[Math.floor((sorted.length - 1) * 0.95)], fps = this.intervals.length ? 1e3 / (this.intervals.reduce((a, b) => a + b, 0) / this.intervals.length) : 0;
      Object.assign(this.output.dataset, { meanMs: mean.toFixed(3), p95Ms: p95.toFixed(3), fps: fps.toFixed(1), ratio: String(ratio), samples: String(this.costs.length), rebuilds: String(rebuilds) });
      this.output.textContent = `Draw ${mean.toFixed(2)}ms \xB7 p95 ${p95.toFixed(2)}ms \xB7 ${fps.toFixed(0)}fps \xB7 ${ratio}\xD7`;
    }
  };

  // ocean.js
  var clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  var smooth = (a, b, v) => {
    const x = clamp((v - a) / (b - a));
    return x * x * (3 - 2 * x);
  };
  var BIOMES = [{ at: 0, name: "SUNLIT WATERS", color: "#6de4e6" }, { at: 350, name: "THE TWILIGHT", color: "#6bbfd9" }, { at: 1100, name: "MIDNIGHT ZONE", color: "#8499d4" }, { at: 3e3, name: "THE ABYSS", color: "#bd92da" }, { at: 5500, name: "HADAL DEPTHS", color: "#e4b678" }];
  function biomeAt(depth) {
    return [...BIOMES].reverse().find((b) => depth >= b.at) || BIOMES[0];
  }
  var Ocean = class {
    constructor(canvas) {
      this.metrics = new RenderMetrics();
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d", { alpha: false });
      this.images = {};
      this.files = { sky: "sky-law.png", shallow: "water-open.png", mid: "mid-law.png", trench: "trench-law.png", hadal: "hadal-pixel.png" };
      this.mode = "home";
      this.depth = 0;
      this.visualDepth = 0;
      this.camera = 0;
      this.time = 0;
      this.previous = 0;
      this.lastPaint = 0;
      this._reduced = false;
      this.burst = 0;
      this.raf = null;
      this.cacheKey = "";
      this.cacheRebuilds = 0;
      this.backdrop = document.createElement("canvas");
      this.background = this.backdrop.getContext("2d", { alpha: false });
      this.loop = this.loop.bind(this);
      this.resize = () => {
        this.w = innerWidth;
        this.h = innerHeight;
        this.ratio = 1;
        canvas.width = this.w;
        canvas.height = this.h;
        this.backdrop.width = this.w;
        this.backdrop.height = this.h;
        this.ctx.imageSmoothingEnabled = false;
        this.background.imageSmoothingEnabled = false;
        this.cacheKey = "";
        this.schedule();
      };
      this.resize();
      addEventListener("resize", this.resize);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          cancelAnimationFrame(this.raf);
          this.raf = null;
        } else {
          this.previous = 0;
          this.schedule();
        }
      });
      this.load("sky");
    }
    load(key) {
      if (this.images[key]) return;
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        this.cacheKey = "";
        this.schedule();
      };
      img.src = "assets/" + this.files[key];
      this.images[key] = img;
    }
    schedule() {
      if (this.raf === null && !document.hidden) this.raf = requestAnimationFrame(this.loop);
    }
    set(mode, depth = 0) {
      if (mode === this.mode && depth === this.depth) return;
      this.mode = mode;
      this.depth = depth;
      if (mode === "dive" || mode === "party") {
        this.load("shallow");
        this.load("mid");
        if (depth >= 1300) this.load("trench");
        if (depth >= 4e3) this.load("hadal");
      }
      this.schedule();
    }
    set reduced(value) {
      if (this._reduced === value) return;
      this._reduced = value;
      this.cacheKey = "";
      this.schedule();
    }
    get reduced() {
      return this._reduced;
    }
    get displayedDepth() {
      return Math.round(this.visualDepth);
    }
    celebrate() {
      this.burst = 1;
      this.schedule();
    }
    ready(key) {
      return this.images[key]?.complete && this.images[key]?.naturalWidth > 0;
    }
    layer(key, alpha, y, height, drift = 0) {
      if (!this.ready(key) || alpha < 2e-3) return;
      const c = this.paintContext || this.ctx;
      c.globalAlpha = alpha;
      c.drawImage(this.images[key], -8 + drift, y, this.w + 16, height);
      c.globalAlpha = 1;
    }
    loop(now) {
      this.raf = null;
      if (document.hidden) return;
      const goal = this.mode === "dive" ? this.h * 0.68 + this.visualDepth * 0.09 : this.mode === "party" ? this.h * 0.62 : 0;
      const moving = Math.abs(this.depth - this.visualDepth) > 1 || Math.abs(goal - this.camera) > 1;
      const interval = moving ? 1e3 / 60 : 1e3 / 30;
      if (now - this.lastPaint < interval - 0.8) {
        this.schedule();
        return;
      }
      const dt = Math.min(0.1, (now - this.previous) / 1e3 || 0.033);
      this.previous = now;
      this.lastPaint += interval;
      if (now - this.lastPaint > interval) this.lastPaint = now;
      if (!this.reduced) this.time += dt * 0.42;
      const ease = this.reduced ? 1 : 1 - Math.exp(-dt * 1.3);
      this.visualDepth += (this.depth - this.visualDepth) * ease;
      if (Math.abs(this.depth - this.visualDepth) < 0.2) this.visualDepth = this.depth;
      const target = this.mode === "dive" ? this.h * 0.68 + this.visualDepth * 0.09 : this.mode === "party" ? this.h * 0.62 : 0;
      this.camera += (target - this.camera) * (this.reduced ? 1 : 1 - Math.exp(-dt * 1.6));
      if (Math.abs(target - this.camera) < 0.2) this.camera = target;
      this.burst = Math.max(0, this.burst - dt * 0.65);
      const started = this.metrics.enabled ? performance.now() : 0;
      this.draw(this.time);
      this.metrics.sample(started, now, this.ratio, this.cacheRebuilds);
      if (!this.reduced) this.schedule();
    }
    environment() {
      const key = [this.mode, Math.round(this.camera), Math.round(this.visualDepth / 8), ...Object.keys(this.images).map((k) => Number(this.ready(k)))].join(":");
      if (key === this.cacheKey) return;
      this.cacheKey = key;
      this.cacheRebuilds++;
      const c = this.background, W = this.w, H = this.h, d = this.visualDepth, surface = H * 0.48 - this.camera;
      this.paintContext = c;
      c.globalAlpha = 1;
      c.fillStyle = "#091829";
      c.fillRect(0, 0, W, H);
      if (surface > 0) {
        const sky = c.createLinearGradient(0, 0, 0, H * 0.48);
        sky.addColorStop(0, "#88cedd");
        sky.addColorStop(1, "#dfefec");
        c.fillStyle = sky;
        c.fillRect(0, 0, W, surface);
        this.layer("sky", 1, -this.camera, H * 0.48);
      }
      const start = Math.max(0, surface);
      c.save();
      c.beginPath();
      c.rect(0, start, W, H - start);
      c.clip();
      const mid = smooth(250, 1150, d), trench = smooth(2300, 3700, d), hadal = smooth(5100, 6300, d), g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, d < 400 ? "#143e5b" : d < 2500 ? "#0b2038" : "#081420");
      g.addColorStop(1, "#071323");
      c.fillStyle = g;
      c.fillRect(0, start, W, H);
      if (this.mode === "home" || this.mode === "summary") {
        const sea = c.createLinearGradient(0, start, 0, H);
        sea.addColorStop(0, "#17445f");
        sea.addColorStop(0.24, "#102f49");
        sea.addColorStop(1, "#081b30");
        c.fillStyle = sea;
        c.fillRect(0, start, W, H - start);
      } else {
        this.layer("shallow", 1 - mid, surface, Math.max(H * 1.65, W * 0.98));
        this.layer("mid", mid * (1 - trench), -H * 0.16 - d * 0.018, H * 1.75);
        this.layer("trench", trench * (1 - hadal), -H * 0.18 - (d - 2300) * 0.014, H * 1.7);
        this.layer("hadal", hadal, -H * 0.18 - (d - 5100) * 0.012, H * 1.7);
      }
      if (hadal) {
        c.fillStyle = `rgba(6,2,17,${hadal * 0.34})`;
        c.fillRect(0, 0, W, H);
      }
      const shade = c.createLinearGradient(0, 0, 0, H);
      shade.addColorStop(0, "#020b1700");
      shade.addColorStop(1, this.mode === "home" ? "#020b1744" : "#020b1733");
      c.fillStyle = shade;
      c.fillRect(0, 0, W, H);
      c.restore();
      if (this.mode === "summary") {
        c.fillStyle = "#071320b8";
        c.fillRect(0, 0, W, H);
      }
      this.paintContext = null;
    }
    draw(t) {
      const c = this.ctx, W = this.w, H = this.h, d = this.visualDepth, surface = H * 0.48 - this.camera;
      this.environment();
      c.globalAlpha = 1;
      c.drawImage(this.backdrop, 0, 0);
      const start = Math.max(0, surface), mid = smooth(250, 1150, d), hadal = smooth(5100, 6300, d);
      c.save();
      c.beginPath();
      c.rect(0, start, W, H - start);
      c.clip();
      this.fishSchool(t, d, mid);
      const wake = this.burst * 16;
      for (let i = 0; i < (this.mode === "home" ? 14 : 26); i++) {
        const x = (i * 127.73 + Math.sin(t * 0.28 + i) * 9 + W * 2) % W;
        const y = ((i * 83.41 - t * (3 + i % 5 + wake) + this.camera * 0.25) % (H + 50) + (H + 50)) % (H + 50) - 20;
        const a = 0.06 + i % 5 * 0.035;
        c.fillStyle = `rgba(${hadal > 0.4 ? "194,162,226" : "157,214,229"},${a})`;
        const size = i % 13 === 0 ? 3 : 1;
        c.fillRect(Math.round(x), Math.round(y), size, size);
        if (i % 13 === 0) {
          c.fillStyle = "#b9e6e855";
          c.fillRect(Math.round(x) + 1, Math.round(y) - 1, 2, 1);
        }
        if (wake > 4 && i % 2 === 0) {
          c.fillStyle = "#9dc9e41a";
          c.fillRect(Math.round(x), Math.round(y) + 4, 1, Math.min(22, wake * 0.3));
        }
      }
      if (d > 900) this.glowLife(t, d, hadal);
      if (this.burst > 0) {
        for (let i = 0; i < 24; i++) {
          const a = i * 2.4, r = (1 - this.burst) * 180;
          c.fillStyle = i % 3 === 0 ? "#f1c36b88" : "#6ee0ea66";
          c.fillRect(Math.round(W / 2 + Math.cos(a) * r), Math.round(H * 0.54 + Math.sin(a) * r * 0.5), 2, 3);
        }
      }
      c.restore();
      if (surface > -10 && surface < H + 8) {
        for (let row = 0; row < 7; row++) {
          c.fillStyle = row < 2 ? "#c4ede9" : "#69bbcd";
          c.globalAlpha = (1 - row / 8) * 0.58;
          for (let x = -20; x < W + 20; x += 23 + row * 7) {
            const length = 7 + (Math.sin(x * 0.019 + t * 0.8 + row) + 1) * 13;
            const y = Math.round(surface + row * 2 + Math.sin(x * 0.024 + t * 1.2 + row) * 1.3);
            c.fillRect(Math.round(x + Math.sin(t * 0.6 + row) * 8), y, Math.round(length), 1);
          }
        }
        c.globalAlpha = 1;
      }
    }
    fishSchool(t, d, mid) {
      const c = this.ctx;
      for (let i = 0; i < (this.mode === "home" ? 4 : 7); i++) {
        const dir = i % 2 ? 1 : -1, scale = 0.65 + i % 4 * 0.2, x = (i * 179 + t * dir * (7 + i % 3) + this.w * 8) % (this.w + 100) - 50, y = this.h * 0.2 + (i * 73 + this.camera * 0.16) % (this.h * 0.7);
        c.save();
        c.translate(Math.round(x), Math.round(y + Math.sin(t + i) * 2));
        c.scale(dir * scale, scale);
        c.globalAlpha = mid > 0.6 ? 0.15 : 0.24;
        c.fillStyle = mid > 0.6 ? "#3e7894" : "#051d32";
        const tail = Math.sin(t * 5 + i) > 0 ? 1 : 0;
        const rows = [[8, 0, 7, 1], [4, 1, 16, 1], [2, 2, 21, 1], [1, 3, 24, 2], [2, 5, 21, 1], [4, 6, 16, 1], [8, 7, 7, 1]];
        for (const r of rows) c.fillRect(...r);
        c.fillRect(-4, tail, 3, 7 - tail);
        c.fillRect(-1, 2, 3, 4);
        c.fillStyle = "#79bdc855";
        c.fillRect(19, 2, 1, 1);
        c.restore();
      }
    }
    glowLife(t, d, hadal) {
      const c = this.ctx;
      for (let j = 0; j < 3; j++) {
        const x = this.w * (0.1 + j * 0.4) + Math.sin(t * 0.2 + j) * 18, y = (j * 173 - t * 5 + this.h * 4) % (this.h + 140) - 60;
        c.save();
        c.translate(Math.round(x), Math.round(y));
        const pulse = Math.sin(t * 2 + j), w = 14 + Math.round(pulse * 2);
        c.globalAlpha = 0.16 + Math.max(0, pulse) * 0.08;
        c.fillStyle = hadal > 0.3 ? "#bd89c9" : "#7bc6da";
        for (let r = 0; r < 6; r++) c.fillRect(-w + r, 6 - r * 2, w * 2 - r * 2, 2);
        for (let k = 0; k < 4; k++) {
          const tx = -9 + k * 6;
          for (let n = 0; n < 7; n++) c.fillRect(tx + Math.round(Math.sin(t * 2 + n * 0.8 + k) * 3), 8 + n * 3, 1, 3);
        }
        c.restore();
      }
    }
  };

  // vehicle-bank.js
  var VEHICLE_PACK = { "id": "no-wheels", "topic": "VEHICLES WITHOUT WHEELS", "prompt": "Name a vehicle that doesn't travel on wheels.", "source": "User-supplied 1,194-answer reference bank", "answers": [{ "label": "Ground-effect vehicle", "points": 100, "aliases": ["Ground effect craft", "Ekranoplan", "Caspian Sea Monster"], "quip": "Soviet engineers built one nicknamed the Caspian Sea Monster." }, { "label": "Iceboat", "points": 100, "aliases": ["Ice yacht"], "quip": "Ice yachts can sail several times faster than the wind." }, { "label": "Aak", "points": 85, "aliases": [] }, { "label": "Abak", "points": 85, "aliases": [] }, { "label": "Abra", "points": 85, "aliases": [] }, { "label": "Actuaria", "points": 85, "aliases": [] }, { "label": "Adirondack guideboat", "points": 85, "aliases": [] }, { "label": "Aerobatic aircraft", "points": 85, "aliases": [] }, { "label": "Aerosani", "points": 85, "aliases": [] }, { "label": "Agricultural drone", "points": 85, "aliases": [] }, { "label": "Agricultural helicopter", "points": 85, "aliases": [] }, { "label": "Aircraft cruiser", "points": 85, "aliases": [] }, { "label": "Aircraft repair ship", "points": 85, "aliases": [] }, { "label": "Aka", "points": 85, "aliases": [] }, { "label": "Alia", "points": 85, "aliases": [] }, { "label": "Alligator boat", "points": 85, "aliases": [] }, { "label": "Amatasi", "points": 85, "aliases": [] }, { "label": "Amenities ship", "points": 85, "aliases": [] }, { "label": "Ammunition ship", "points": 85, "aliases": [] }, { "label": "Amphibious aircraft", "points": 85, "aliases": [] }, { "label": "Amphibious assault ship", "points": 85, "aliases": [] }, { "label": "Amphibious command ship", "points": 85, "aliases": [] }, { "label": "Amphibious tracked vehicle", "points": 85, "aliases": [] }, { "label": "Amphibious transport dock", "points": 85, "aliases": [] }, { "label": "Amphibious warfare ship", "points": 85, "aliases": [] }, { "label": "Anchor handling tug", "points": 85, "aliases": [] }, { "label": "Angga", "points": 85, "aliases": [] }, { "label": "Aquatic weed harvester", "points": 85, "aliases": [] }, { "label": "Armadahan", "points": 85, "aliases": [] }, { "label": "Armed boarding steamer", "points": 85, "aliases": [] }, { "label": "Armed merchantman", "points": 85, "aliases": [] }, { "label": "Armed yacht", "points": 85, "aliases": [] }, { "label": "Armored cruiser", "points": 85, "aliases": [] }, { "label": "Armoured recovery vehicle", "points": 85, "aliases": [] }, { "label": "Articulated tracked vehicle", "points": 85, "aliases": [] }, { "label": "Atakebune", "points": 85, "aliases": [] }, { "label": "Atmospheric probe", "points": 85, "aliases": [] }, { "label": "Attack aircraft", "points": 85, "aliases": [] }, { "label": "Attack submarine", "points": 85, "aliases": [] }, { "label": "Attack transport", "points": 85, "aliases": [] }, { "label": "\xC5ttring", "points": 85, "aliases": [] }, { "label": "Autonomous underwater vehicle", "points": 85, "aliases": [] }, { "label": "Auxiliary crane ship", "points": 85, "aliases": [] }, { "label": "Auxiliary ship", "points": 85, "aliases": [] }, { "label": "Avang", "points": 85, "aliases": [] }, { "label": "AWACS", "points": 85, "aliases": [] }, { "label": "Awang", "points": 85, "aliases": [] }, { "label": "Backpack helicopter", "points": 85, "aliases": [] }, { "label": "Badan", "points": 85, "aliases": [] }, { "label": "Bagan", "points": 85, "aliases": [] }, { "label": "Baghlah", "points": 85, "aliases": [] }, { "label": "Bago", "points": 85, "aliases": [] }, { "label": "Baidak", "points": 85, "aliases": [] }, { "label": "Baidarka", "points": 85, "aliases": [] }, { "label": "Bajak", "points": 85, "aliases": [] }, { "label": "Balaci\xF3n", "points": 85, "aliases": [] }, { "label": "Balam", "points": 85, "aliases": [] }, { "label": "Balangay", "points": 85, "aliases": [] }, { "label": "Baldie", "points": 85, "aliases": [] }, { "label": "Balinger", "points": 85, "aliases": [] }, { "label": "Ballistic missile submarine", "points": 85, "aliases": [] }, { "label": "Balloon carrier", "points": 85, "aliases": [] }, { "label": "Balsa raft", "points": 85, "aliases": [] }, { "label": "Baltimore clipper", "points": 85, "aliases": [] }, { "label": "Bangka", "points": 85, "aliases": [] }, { "label": "Bangka anak-anak", "points": 85, "aliases": [] }, { "label": "Bangkong", "points": 85, "aliases": [] }, { "label": "Banner plane", "points": 85, "aliases": [] }, { "label": "Banting", "points": 85, "aliases": [] }, { "label": "Barbette ship", "points": 85, "aliases": [] }, { "label": "Barca-longa", "points": 85, "aliases": [] }, { "label": "Barijah", "points": 85, "aliases": [] }, { "label": "Baris", "points": 85, "aliases": [] }, { "label": "Bark canoe", "points": 85, "aliases": [] }, { "label": "Barque", "points": 85, "aliases": [] }, { "label": "Barquentine", "points": 85, "aliases": [] }, { "label": "Barracks ship", "points": 85, "aliases": [] }, { "label": "Barrage balloon", "points": 85, "aliases": [] }, { "label": "Basket boat", "points": 85, "aliases": [] }, { "label": "Basnig", "points": 85, "aliases": [] }, { "label": "Bateau", "points": 85, "aliases": [] }, { "label": "Bateau mouche", "points": 85, "aliases": [] }, { "label": "Batela", "points": 85, "aliases": [] }, { "label": "Batheli", "points": 85, "aliases": [] }, { "label": "Bathyscaphe", "points": 85, "aliases": [] }, { "label": "Bathysphere", "points": 85, "aliases": [] }, { "label": "Battil", "points": 85, "aliases": [] }, { "label": "Battlecruiser", "points": 85, "aliases": [] }, { "label": "Baurua", "points": 85, "aliases": [] }, { "label": "Bawley", "points": 85, "aliases": [] }, { "label": "Bay boat", "points": 85, "aliases": [] }, { "label": "Beach catamaran", "points": 85, "aliases": [] }, { "label": "Bedar", "points": 85, "aliases": [] }, { "label": "Beden", "points": 85, "aliases": [] }, { "label": "Belly boat", "points": 85, "aliases": [] }, { "label": "Belyana", "points": 85, "aliases": [] }, { "label": "Benawa", "points": 85, "aliases": [] }, { "label": "Bergantina", "points": 85, "aliases": [] }, { "label": "Bermuda sloop", "points": 85, "aliases": [] }, { "label": "Bezaisen", "points": 85, "aliases": [] }, { "label": "Bhotbhoti", "points": 85, "aliases": [] }, { "label": "Bigiw", "points": 85, "aliases": [] }, { "label": "Bilander", "points": 85, "aliases": [] }, { "label": "Bilo", "points": 85, "aliases": [] }, { "label": "Binabina", "points": 85, "aliases": [] }, { "label": "Birau", "points": 85, "aliases": [] }, { "label": "Birchbark canoe", "points": 85, "aliases": [] }, { "label": "Bireme", "points": 85, "aliases": [] }, { "label": "Birlinn", "points": 85, "aliases": [] }, { "label": "Bisquine", "points": 85, "aliases": [] }, { "label": "Blackwall frigate", "points": 85, "aliases": [] }, { "label": "Blended wing body aircraft", "points": 85, "aliases": [] }, { "label": "Block Island boat", "points": 85, "aliases": [] }, { "label": "Blockade runner", "points": 85, "aliases": [] }, { "label": "Boeier", "points": 85, "aliases": [] }, { "label": "Boita", "points": 85, "aliases": [] }, { "label": "Bokkura", "points": 85, "aliases": [] }, { "label": "Bom (bomschuit)", "points": 85, "aliases": [] }, { "label": "Bomb vessel", "points": 85, "aliases": [] }, { "label": "Booby hut", "points": 85, "aliases": [] }, { "label": "Boom (dhow)", "points": 85, "aliases": [] }, { "label": "Borobudur ship", "points": 85, "aliases": [] }, { "label": "Botter", "points": 85, "aliases": [] }, { "label": "Bowrider", "points": 85, "aliases": [] }, { "label": "Bracera", "points": 85, "aliases": [] }, { "label": "Bragozzo", "points": 85, "aliases": [] }, { "label": "Breakbulk ship", "points": 85, "aliases": [] }, { "label": "Brig", "points": 85, "aliases": [] }, { "label": "Brigantine", "points": 85, "aliases": [] }, { "label": "Brixham trawler", "points": 85, "aliases": [] }, { "label": "Bucket-wheel excavator", "points": 85, "aliases": [] }, { "label": "Budgerow", "points": 85, "aliases": [] }, { "label": "Bugeye", "points": 85, "aliases": [] }, { "label": "Buggoh", "points": 85, "aliases": [] }, { "label": "Bulk carrier", "points": 85, "aliases": [] }, { "label": "Bull boat", "points": 85, "aliases": [] }, { "label": "Bumboat", "points": 85, "aliases": [] }, { "label": "Buoy tender", "points": 85, "aliases": [] }, { "label": "Burchiello", "points": 85, "aliases": [] }, { "label": "Butty", "points": 85, "aliases": [] }, { "label": "Buyboat", "points": 85, "aliases": [] }, { "label": "Byrding", "points": 85, "aliases": [] }, { "label": "Caballito de totora", "points": 85, "aliases": [] }, { "label": "Cabin cruiser", "points": 85, "aliases": [] }, { "label": "Cable ferry", "points": 85, "aliases": [] }, { "label": "Cable layer", "points": 85, "aliases": [] }, { "label": "Cacilheiro", "points": 85, "aliases": [] }, { "label": "Caique", "points": 85, "aliases": [] }, { "label": "CAM ship", "points": 85, "aliases": [] }, { "label": "Camakau", "points": 85, "aliases": [] }, { "label": "Canard aircraft", "points": 85, "aliases": [] }, { "label": "Cannery tender", "points": 85, "aliases": [] }, { "label": "Caorlina", "points": 85, "aliases": [] }, { "label": "Cape Islander", "points": 85, "aliases": [] }, { "label": "Car carrier ship", "points": 85, "aliases": [] }, { "label": "Car float", "points": 85, "aliases": [] }, { "label": "Carabus", "points": 85, "aliases": [] }, { "label": "Caramoussal", "points": 85, "aliases": [] }, { "label": "Caravel", "points": 85, "aliases": [] }, { "label": "Cargo liner", "points": 85, "aliases": [] }, { "label": "Cargo spacecraft", "points": 85, "aliases": [] }, { "label": "Carrack", "points": 85, "aliases": [] }, { "label": "Carrier-based aircraft", "points": 85, "aliases": [] }, { "label": "Carro de cesto", "points": 85, "aliases": [] }, { "label": "Casco", "points": 85, "aliases": [] }, { "label": "Casemate ironclad", "points": 85, "aliases": [] }, { "label": "Cat (ship)", "points": 85, "aliases": [] }, { "label": "Catboat", "points": 85, "aliases": [] }, { "label": "Cayuco", "points": 85, "aliases": [] }, { "label": "Celox", "points": 85, "aliases": [] }, { "label": "Cement carrier", "points": 85, "aliases": [] }, { "label": "Center console boat", "points": 85, "aliases": [] }, { "label": "Cerucuh", "points": 85, "aliases": [] }, { "label": "Chaika", "points": 85, "aliases": [] }, { "label": "Chain boat", "points": 85, "aliases": [] }, { "label": "Chalupa", "points": 85, "aliases": [] }, { "label": "Charrua", "points": 85, "aliases": [] }, { "label": "Chasse-mar\xE9e", "points": 85, "aliases": [] }, { "label": "Chelandion", "points": 85, "aliases": [] }, { "label": "Chemical tanker", "points": 85, "aliases": [] }, { "label": "Chialoup", "points": 85, "aliases": [] }, { "label": "Chinarem", "points": 85, "aliases": [] }, { "label": "Chinedkeran", "points": 85, "aliases": [] }, { "label": "Chipironier", "points": 85, "aliases": [] }, { "label": "Chugpin", "points": 85, "aliases": [] }, { "label": "Chundan vallam", "points": 85, "aliases": [] }, { "label": "Cluster balloon", "points": 85, "aliases": [] }, { "label": "Clyde puffer", "points": 85, "aliases": [] }, { "label": "Coastal defense ship", "points": 85, "aliases": [] }, { "label": "Coastal minesweeper", "points": 85, "aliases": [] }, { "label": "Coastal tanker", "points": 85, "aliases": [] }, { "label": "Coaster (ship)", "points": 85, "aliases": [] }, { "label": "Coasting schooner", "points": 85, "aliases": [] }, { "label": "Coaxial helicopter", "points": 85, "aliases": [] }, { "label": "Coble", "points": 85, "aliases": [] }, { "label": "Cockboat", "points": 85, "aliases": [] }, { "label": "Cog", "points": 85, "aliases": [] }, { "label": "Colandia", "points": 85, "aliases": [] }, { "label": "Coleopter", "points": 85, "aliases": [] }, { "label": "Collier", "points": 85, "aliases": [] }, { "label": "Columbia boat", "points": 85, "aliases": [] }, { "label": "Combat boat", "points": 85, "aliases": [] }, { "label": "Combat engineering vehicle", "points": 85, "aliases": [] }, { "label": "Combat stores ship", "points": 85, "aliases": [] }, { "label": "Communications satellite", "points": 85, "aliases": [] }, { "label": "Compact track loader", "points": 85, "aliases": [] }, { "label": "Composite aircraft", "points": 85, "aliases": [] }, { "label": "Compound helicopter", "points": 85, "aliases": [] }, { "label": "Concrete ship", "points": 85, "aliases": [] }, { "label": "Convict ship", "points": 85, "aliases": [] }, { "label": "Convoy rescue ship", "points": 85, "aliases": [] }, { "label": "Corvette (warship)", "points": 85, "aliases": [] }, { "label": "Cottonclad", "points": 85, "aliases": [] }, { "label": "Counter-insurgency aircraft", "points": 85, "aliases": [] }, { "label": "Couta boat", "points": 85, "aliases": [] }, { "label": "Crane vessel", "points": 85, "aliases": [] }, { "label": "Crawler carrier", "points": 85, "aliases": [] }, { "label": "Crawler crane", "points": 85, "aliases": [] }, { "label": "Crawler tractor", "points": 85, "aliases": [] }, { "label": "Crew boat", "points": 85, "aliases": [] }, { "label": "Crommesteven", "points": 85, "aliases": [] }, { "label": "Cruiseferry", "points": 85, "aliases": [] }, { "label": "Cruiser submarine", "points": 85, "aliases": [] }, { "label": "CubeSat", "points": 85, "aliases": [] }, { "label": "Cuddy cabin", "points": 85, "aliases": [] }, { "label": "Currach", "points": 85, "aliases": [] }, { "label": "Cutter sleigh", "points": 85, "aliases": [] }, { "label": "Cyclogyro", "points": 85, "aliases": [] }, { "label": "Cymba", "points": 85, "aliases": [] }, { "label": "Dahabiya", "points": 85, "aliases": [] }, { "label": "Dalca", "points": 85, "aliases": [] }, { "label": "Dandy (litter)", "points": 85, "aliases": [] }, { "label": "Danlayer", "points": 85, "aliases": [] }, { "label": "Daysailer", "points": 85, "aliases": [] }, { "label": "Deadrise", "points": 85, "aliases": [] }, { "label": "Deck boat", "points": 85, "aliases": [] }, { "label": "Deep-submergence rescue vehicle", "points": 85, "aliases": [] }, { "label": "Delta-wing aircraft", "points": 85, "aliases": [] }, { "label": "Depot ship", "points": 85, "aliases": [] }, { "label": "Destroyer escort", "points": 85, "aliases": [] }, { "label": "Destroyer leader", "points": 85, "aliases": [] }, { "label": "Destroyer minesweeper", "points": 85, "aliases": [] }, { "label": "Destroyer tender", "points": 85, "aliases": [] }, { "label": "Dg\u0127ajsa", "points": 85, "aliases": [] }, { "label": "Dhoni", "points": 85, "aliases": [] }, { "label": "Dinahit", "points": 85, "aliases": [] }, { "label": "Dispatch boat", "points": 85, "aliases": [] }, { "label": "Distilling ship", "points": 85, "aliases": [] }, { "label": "Dive boat", "points": 85, "aliases": [] }, { "label": "Dive bomber", "points": 85, "aliases": [] }, { "label": "Diver propulsion vehicle", "points": 85, "aliases": [] }, { "label": "Diving support vessel", "points": 85, "aliases": [] }, { "label": "Djenging", "points": 85, "aliases": [] }, { "label": "Djong", "points": 85, "aliases": [] }, { "label": "Dock landing ship", "points": 85, "aliases": [] }, { "label": "Dogger", "points": 85, "aliases": [] }, { "label": "Doonga", "points": 85, "aliases": [] }, { "label": "Dorna", "points": 85, "aliases": [] }, { "label": "Dory", "points": 85, "aliases": [] }, { "label": "Double acting ship", "points": 85, "aliases": [] }, { "label": "Double-decker plane", "points": 85, "aliases": [] }, { "label": "Double-hulled canoe", "points": 85, "aliases": [] }, { "label": "Down Easter", "points": 85, "aliases": [] }, { "label": "Dracone barge", "points": 85, "aliases": [] }, { "label": "Drag boat", "points": 85, "aliases": [] }, { "label": "Dragline excavator", "points": 85, "aliases": [] }, { "label": "Dragon boat", "points": 85, "aliases": [] }, { "label": "Dreadnought", "points": 85, "aliases": [] }, { "label": "Dredger", "points": 85, "aliases": [] }, { "label": "Drift boat", "points": 85, "aliases": [] }, { "label": "Drifter", "points": 85, "aliases": [] }, { "label": "Drillship", "points": 85, "aliases": [] }, { "label": "Dromon", "points": 85, "aliases": [] }, { "label": "Drone carrier", "points": 85, "aliases": [] }, { "label": "Drua", "points": 85, "aliases": [] }, { "label": "Dual console boat", "points": 85, "aliases": [] }, { "label": "Durham boat", "points": 85, "aliases": [] }, { "label": "Dutch barge", "points": 85, "aliases": [] }, { "label": "Earth observation satellite", "points": 85, "aliases": [] }, { "label": "East Indiaman", "points": 85, "aliases": [] }, { "label": "Electronic warfare aircraft", "points": 85, "aliases": [] }, { "label": "Eloha", "points": 85, "aliases": [] }, { "label": "Escort carrier", "points": 85, "aliases": [] }, { "label": "Escort fighter", "points": 85, "aliases": [] }, { "label": "Evacuation transport", "points": 85, "aliases": [] }, { "label": "eVTOL", "points": 85, "aliases": [] }, { "label": "Ewer", "points": 85, "aliases": [] }, { "label": "Examination vessel", "points": 85, "aliases": [] }, { "label": "Expedition cruise ship", "points": 85, "aliases": [] }, { "label": "Experimental aircraft", "points": 85, "aliases": [] }, { "label": "Explorer yacht", "points": 85, "aliases": [] }, { "label": "Express boat", "points": 85, "aliases": [] }, { "label": "Express cruiser", "points": 85, "aliases": [] }, { "label": "Factory ship", "points": 85, "aliases": [] }, { "label": "F\xE6ring", "points": 85, "aliases": [] }, { "label": "Fakatora", "points": 85, "aliases": [] }, { "label": "Falku\u0161a", "points": 85, "aliases": [] }, { "label": "Falmouth working boat", "points": 85, "aliases": [] }, { "label": "Falua", "points": 85, "aliases": [] }, { "label": "Fast attack craft", "points": 85, "aliases": [] }, { "label": "Fast battleship", "points": 85, "aliases": [] }, { "label": "Fast combat support ship", "points": 85, "aliases": [] }, { "label": "Fast ferry", "points": 85, "aliases": [] }, { "label": "Fast interceptor craft", "points": 85, "aliases": [] }, { "label": "Feeder ship", "points": 85, "aliases": [] }, { "label": "Felucca", "points": 85, "aliases": [] }, { "label": "Femb\xF8ring", "points": 85, "aliases": [] }, { "label": "Ferilla", "points": 85, "aliases": [] }, { "label": "Fifie", "points": 85, "aliases": [] }, { "label": "Fighter catapult ship", "points": 85, "aliases": [] }, { "label": "Fighter-bomber", "points": 85, "aliases": [] }, { "label": "Fire ship", "points": 85, "aliases": [] }, { "label": "Fireboat", "points": 85, "aliases": [] }, { "label": "Firefighting helicopter", "points": 85, "aliases": [] }, { "label": "Fish tug", "points": 85, "aliases": [] }, { "label": "Fish-and-ski boat", "points": 85, "aliases": [] }, { "label": "Fixed-wing drone", "points": 85, "aliases": [] }, { "label": "Flatboat", "points": 85, "aliases": [] }, { "label": "Flatiron gunboat", "points": 85, "aliases": [] }, { "label": "Flats boat", "points": 85, "aliases": [] }, { "label": "Floating battery", "points": 85, "aliases": [] }, { "label": "Floating fuel station", "points": 85, "aliases": [] }, { "label": "Flower boat", "points": 85, "aliases": [] }, { "label": "Fluyt", "points": 85, "aliases": [] }, { "label": "Flyboat", "points": 85, "aliases": [] }, { "label": "Flybridge cruiser", "points": 85, "aliases": [] }, { "label": "Flying platform", "points": 85, "aliases": [] }, { "label": "Flying wing", "points": 85, "aliases": [] }, { "label": "Foam slider", "points": 85, "aliases": [] }, { "label": "Folding kayak", "points": 85, "aliases": [] }, { "label": "Four-engine jet", "points": 85, "aliases": [] }, { "label": "Foyboat", "points": 85, "aliases": [] }, { "label": "FPSO", "points": 85, "aliases": [] }, { "label": "Frejgatina", "points": 85, "aliases": [] }, { "label": "Friendship sloop", "points": 85, "aliases": [] }, { "label": "Fuchuan", "points": 85, "aliases": [] }, { "label": "Full-rigged ship", "points": 85, "aliases": [] }, { "label": "Funifor", "points": 85, "aliases": [] }, { "label": "Funitel", "points": 85, "aliases": [] }, { "label": "Fusta", "points": 85, "aliases": [] }, { "label": "Fustereau", "points": 85, "aliases": [] }, { "label": "Gabare", "points": 85, "aliases": [] }, { "label": "Gabbart", "points": 85, "aliases": [] }, { "label": "Gajeta", "points": 85, "aliases": [] }, { "label": "Galea sottile", "points": 85, "aliases": [] }, { "label": "Galeas", "points": 85, "aliases": [] }, { "label": "Galleass", "points": 85, "aliases": [] }, { "label": "Galliot", "points": 85, "aliases": [] }, { "label": "Gallivat", "points": 85, "aliases": [] }, { "label": "Galway hooker", "points": 85, "aliases": [] }, { "label": "Gama (Korean palanquin)", "points": 85, "aliases": [] }, { "label": "Gandelow", "points": 85, "aliases": [] }, { "label": "Garay", "points": 85, "aliases": [] }, { "label": "Gas balloon", "points": 85, "aliases": [] }, { "label": "Gas carrier", "points": 85, "aliases": [] }, { "label": "General stores issue ship", "points": 85, "aliases": [] }, { "label": "Ghali", "points": 85, "aliases": [] }, { "label": "Ghanjah", "points": 85, "aliases": [] }, { "label": "Ghe", "points": 85, "aliases": [] }, { "label": "Ghurab", "points": 85, "aliases": [] }, { "label": "Gig", "points": 85, "aliases": [] }, { "label": "Gillnetter", "points": 85, "aliases": [] }, { "label": "Glider tug", "points": 85, "aliases": [] }, { "label": "Goina", "points": 85, "aliases": [] }, { "label": "Golekan", "points": 85, "aliases": [] }, { "label": "Gozzo", "points": 85, "aliases": [] }, { "label": "Grand Banks schooner", "points": 85, "aliases": [] }, { "label": "Great Lakes freighter", "points": 85, "aliases": [] }, { "label": "Guangchuan", "points": 85, "aliases": [] }, { "label": "Gubang", "points": 85, "aliases": [] }, { "label": "Guilalo", "points": 85, "aliases": [] }, { "label": "Gulet", "points": 85, "aliases": [] }, { "label": "Gundalow", "points": 85, "aliases": [] }, { "label": "Gunship", "points": 85, "aliases": [] }, { "label": "Gyassa", "points": 85, "aliases": [] }, { "label": "Gyrodyne", "points": 85, "aliases": [] }, { "label": "Haffboot", "points": 85, "aliases": [] }, { "label": "Hagboat", "points": 85, "aliases": [] }, { "label": "Hamatafua", "points": 85, "aliases": [] }, { "label": "Hampton boat", "points": 85, "aliases": [] }, { "label": "Head boat", "points": 85, "aliases": [] }, { "label": "Heavy cruiser", "points": 85, "aliases": [] }, { "label": "Heavy fighter", "points": 85, "aliases": [] }, { "label": "Heavy-lift helicopter", "points": 85, "aliases": [] }, { "label": "Heavy-lift ship", "points": 85, "aliases": [] }, { "label": "Helicopter carrier", "points": 85, "aliases": [] }, { "label": "Helicopter cruiser", "points": 85, "aliases": [] }, { "label": "Hellburner", "points": 85, "aliases": [] }, { "label": "Hemiolia", "points": 85, "aliases": [] }, { "label": "Hemmema", "points": 85, "aliases": [] }, { "label": "Hermaphrodite brig", "points": 85, "aliases": [] }, { "label": "Herring buss", "points": 85, "aliases": [] }, { "label": "Hexareme", "points": 85, "aliases": [] }, { "label": "Hickman sea sled", "points": 85, "aliases": [] }, { "label": "Hide raft", "points": 85, "aliases": [] }, { "label": "High-altitude balloon", "points": 85, "aliases": [] }, { "label": "High-performance boat", "points": 85, "aliases": [] }, { "label": "High-speed transport", "points": 85, "aliases": [] }, { "label": "Hoeker", "points": 85, "aliases": [] }, { "label": "Homebuilt aircraft", "points": 85, "aliases": [] }, { "label": "Hoogaars", "points": 85, "aliases": [] }, { "label": "Hooper Island draketail", "points": 85, "aliases": [] }, { "label": "Hopper balloon", "points": 85, "aliases": [] }, { "label": "H\u014Dren", "points": 85, "aliases": [] }, { "label": "Horn sledge", "points": 85, "aliases": [] }, { "label": "Horse-drawn boat", "points": 85, "aliases": [] }, { "label": "Hospital ship", "points": 85, "aliases": [] }, { "label": "Hotel barge", "points": 85, "aliases": [] }, { "label": "Hotel ship", "points": 85, "aliases": [] }, { "label": "Houario", "points": 85, "aliases": [] }, { "label": "Hover barge", "points": 85, "aliases": [] }, { "label": "Hoverbike", "points": 85, "aliases": [] }, { "label": "Hoy", "points": 85, "aliases": [] }, { "label": "Hulk", "points": 85, "aliases": [] }, { "label": "Human-powered aircraft", "points": 85, "aliases": [] }, { "label": "Human-powered helicopter", "points": 85, "aliases": [] }, { "label": "Humber keel", "points": 85, "aliases": [] }, { "label": "Humber sloop", "points": 85, "aliases": [] }, { "label": "Hybrid airship", "points": 85, "aliases": [] }, { "label": "Hybrid lift", "points": 85, "aliases": [] }, { "label": "Hydraulic tanker", "points": 85, "aliases": [] }, { "label": "Hydrogen tanker", "points": 85, "aliases": [] }, { "label": "Hydroplane", "points": 85, "aliases": [] }, { "label": "Hypersonic aircraft", "points": 85, "aliases": [] }, { "label": "Ice canoe", "points": 85, "aliases": [] }, { "label": "Ice scooter", "points": 85, "aliases": [] }, { "label": "Igara", "points": 85, "aliases": [] }, { "label": "Impactor", "points": 85, "aliases": [] }, { "label": "Infantry fighting vehicle", "points": 85, "aliases": [] }, { "label": "Inflatable pontoon boat", "points": 85, "aliases": [] }, { "label": "Interceptor", "points": 85, "aliases": [] }, { "label": "Intermeshing-rotor helicopter", "points": 85, "aliases": [] }, { "label": "Ipanitika", "points": 85, "aliases": [] }, { "label": "Irish galley", "points": 85, "aliases": [] }, { "label": "Ironclad", "points": 85, "aliases": [] }, { "label": "Itaomacip", "points": 85, "aliases": [] }, { "label": "Ivahah", "points": 85, "aliases": [] }, { "label": "Jacht", "points": 85, "aliases": [] }, { "label": "Jackass-barque", "points": 85, "aliases": [] }, { "label": "Jahazi", "points": 85, "aliases": [] }, { "label": "Jalibut", "points": 85, "aliases": [] }, { "label": "James River bateau", "points": 85, "aliases": [] }, { "label": "Jangada", "points": 85, "aliases": [] }, { "label": "Janggolan", "points": 85, "aliases": [] }, { "label": "Jellore", "points": 85, "aliases": [] }, { "label": "Jempana", "points": 85, "aliases": [] }, { "label": "Jet boat", "points": 85, "aliases": [] }, { "label": "Jet suit", "points": 85, "aliases": [] }, { "label": "Jhampan", "points": 85, "aliases": [] }, { "label": "Joint support ship", "points": 85, "aliases": [] }, { "label": "Jolly boat", "points": 85, "aliases": [] }, { "label": "Jon boat", "points": 85, "aliases": [] }, { "label": "Jongkong", "points": 85, "aliases": [] }, { "label": "Jukung", "points": 85, "aliases": [] }, { "label": "Jukung tambangan", "points": 85, "aliases": [] }, { "label": "Junk raft", "points": 85, "aliases": [] }, { "label": "Junkun", "points": 85, "aliases": [] }, { "label": "Junkung", "points": 85, "aliases": [] }, { "label": "Kadai", "points": 85, "aliases": [] }, { "label": "Kaep", "points": 85, "aliases": [] }, { "label": "Kago", "points": 85, "aliases": [] }, { "label": "Kai-to", "points": 85, "aliases": [] }, { "label": "Kaib\u014Dkan", "points": 85, "aliases": [] }, { "label": "Kajjik", "points": 85, "aliases": [] }, { "label": "Kakap", "points": 85, "aliases": [] }, { "label": "Kalia", "points": 85, "aliases": [] }, { "label": "Kalulis", "points": 85, "aliases": [] }, { "label": "Kangga", "points": 85, "aliases": [] }, { "label": "Karakoa", "points": 85, "aliases": [] }, { "label": "Karve", "points": 85, "aliases": [] }, { "label": "Kattumaram", "points": 85, "aliases": [] }, { "label": "Keelboat", "points": 85, "aliases": [] }, { "label": "Kelek", "points": 85, "aliases": [] }, { "label": "Kelulus", "points": 85, "aliases": [] }, { "label": "Ketch", "points": 85, "aliases": [] }, { "label": "Kettuvallam", "points": 85, "aliases": [] }, { "label": "Khlong boat", "points": 85, "aliases": [] }, { "label": "Kicksled", "points": 85, "aliases": [] }, { "label": "Ki\u1EC7u", "points": 85, "aliases": [] }, { "label": "Klotok", "points": 85, "aliases": [] }, { "label": "Knabat bogolu", "points": 85, "aliases": [] }, { "label": "Knarr", "points": 85, "aliases": [] }, { "label": "Kobaya", "points": 85, "aliases": [] }, { "label": "Koch", "points": 85, "aliases": [] }, { "label": "Koff", "points": 85, "aliases": [] }, { "label": "Kolae boat", "points": 85, "aliases": [] }, { "label": "Kolay", "points": 85, "aliases": [] }, { "label": "Kolek", "points": 85, "aliases": [] }, { "label": "Kolekole", "points": 85, "aliases": [] }, { "label": "Komatik", "points": 85, "aliases": [] }, { "label": "Kondura", "points": 85, "aliases": [] }, { "label": "Kora kora", "points": 85, "aliases": [] }, { "label": "Korkor", "points": 85, "aliases": [] }, { "label": "Kotia", "points": 85, "aliases": [] }, { "label": "Kotta mara", "points": 85, "aliases": [] }, { "label": "Kulibo", "points": 85, "aliases": [] }, { "label": "Kumpit", "points": 85, "aliases": [] }, { "label": "Kunlun bo", "points": 85, "aliases": [] }, { "label": "Kurenkahn", "points": 85, "aliases": [] }, { "label": "La'au", "points": 85, "aliases": [] }, { "label": "Ladjak", "points": 85, "aliases": [] }, { "label": "Lafitte skiff", "points": 85, "aliases": [] }, { "label": "Lakana", "points": 85, "aliases": [] }, { "label": "Lakatoi", "points": 85, "aliases": [] }, { "label": "Lambo (boat)", "points": 85, "aliases": [] }, { "label": "Lancang", "points": 85, "aliases": [] }, { "label": "Lancaran", "points": 85, "aliases": [] }, { "label": "Lander", "points": 85, "aliases": [] }, { "label": "Landing craft", "points": 85, "aliases": [] }, { "label": "Landing craft air cushion", "points": 85, "aliases": [] }, { "label": "Landing ship", "points": 85, "aliases": [] }, { "label": "Lanong", "points": 85, "aliases": [] }, { "label": "Lapis", "points": 85, "aliases": [] }, { "label": "Launch", "points": 85, "aliases": [] }, { "label": "Layout boat", "points": 85, "aliases": [] }, { "label": "LEG carrier", "points": 85, "aliases": [] }, { "label": "Lembus", "points": 85, "aliases": [] }, { "label": "Lepa", "points": 85, "aliases": [] }, { "label": "Lepa-lepa", "points": 85, "aliases": [] }, { "label": "Lerret", "points": 85, "aliases": [] }, { "label": "Leti leti", "points": 85, "aliases": [] }, { "label": "Liaison aircraft", "points": 85, "aliases": [] }, { "label": "Liburna", "points": 85, "aliases": [] }, { "label": "Liftboat", "points": 85, "aliases": [] }, { "label": "Lifting body", "points": 85, "aliases": [] }, { "label": "Light aircraft carrier", "points": 85, "aliases": [] }, { "label": "Light combat aircraft", "points": 85, "aliases": [] }, { "label": "Light cruiser", "points": 85, "aliases": [] }, { "label": "Light-sport aircraft", "points": 85, "aliases": [] }, { "label": "Lighter (barge)", "points": 85, "aliases": [] }, { "label": "Lighter aboard ship", "points": 85, "aliases": [] }, { "label": "Lightship", "points": 85, "aliases": [] }, { "label": "Lis-alis", "points": 85, "aliases": [] }, { "label": "Lisi", "points": 85, "aliases": [] }, { "label": "Litter", "points": 85, "aliases": [] }, { "label": "Littoral combat ship", "points": 85, "aliases": [] }, { "label": "Liveaboard dive boat", "points": 85, "aliases": [] }, { "label": "Livestock carrier", "points": 85, "aliases": [] }, { "label": "Llaut", "points": 85, "aliases": [] }, { "label": "LNG carrier", "points": 85, "aliases": [] }, { "label": "Lobster boat", "points": 85, "aliases": [] }, { "label": "Logging sled", "points": 85, "aliases": [] }, { "label": "Londe", "points": 85, "aliases": [] }, { "label": "Long-tail boat", "points": 85, "aliases": [] }, { "label": "Longboat", "points": 85, "aliases": [] }, { "label": "Longliner", "points": 85, "aliases": [] }, { "label": "Lorcha", "points": 85, "aliases": [] }, { "label": "Louchuan", "points": 85, "aliases": [] }, { "label": "LPG carrier", "points": 85, "aliases": [] }, { "label": "Lualua", "points": 85, "aliases": [] }, { "label": "Lugger", "points": 85, "aliases": [] }, { "label": "Lumber hooker", "points": 85, "aliases": [] }, { "label": "Luzzu", "points": 85, "aliases": [] }, { "label": "Machwa", "points": 85, "aliases": [] }, { "label": "Mackinaw boat", "points": 85, "aliases": [] }, { "label": "Magan boat", "points": 85, "aliases": [] }, { "label": "Mail boat", "points": 85, "aliases": [] }, { "label": "Malangbang", "points": 85, "aliases": [] }, { "label": "Malia", "points": 85, "aliases": [] }, { "label": "Man-of-war", "points": 85, "aliases": [] }, { "label": "Manchua", "points": 85, "aliases": [] }, { "label": "Maritime patrol aircraft", "points": 85, "aliases": [] }, { "label": "Mascareta", "points": 85, "aliases": [] }, { "label": "Mashoof", "points": 85, "aliases": [] }, { "label": "Masula boat", "points": 85, "aliases": [] }, { "label": "Mayang", "points": 85, "aliases": [] }, { "label": "Merchant aircraft carrier", "points": 85, "aliases": [] }, { "label": "Merchant raider", "points": 85, "aliases": [] }, { "label": "Merchant ship", "points": 85, "aliases": [] }, { "label": "Mersey flat", "points": 85, "aliases": [] }, { "label": "Metal-clad airship", "points": 85, "aliases": [] }, { "label": "Micro air vehicle", "points": 85, "aliases": [] }, { "label": "Microlift glider", "points": 85, "aliases": [] }, { "label": "Mid-deck tanker", "points": 85, "aliases": [] }, { "label": "Midget submarine", "points": 85, "aliases": [] }, { "label": "Military glider", "points": 85, "aliases": [] }, { "label": "Mine countermeasures vessel", "points": 85, "aliases": [] }, { "label": "Mine planter", "points": 85, "aliases": [] }, { "label": "Minehunter", "points": 85, "aliases": [] }, { "label": "Minelayer", "points": 85, "aliases": [] }, { "label": "Missile boat", "points": 85, "aliases": [] }, { "label": "Mistico", "points": 85, "aliases": [] }, { "label": "Mokoro", "points": 85, "aliases": [] }, { "label": "Monitor (warship)", "points": 85, "aliases": [] }, { "label": "Monocopter", "points": 85, "aliases": [] }, { "label": "Monohull", "points": 85, "aliases": [] }, { "label": "Monoplane", "points": 85, "aliases": [] }, { "label": "Montagu whaler", "points": 85, "aliases": [] }, { "label": "Mothership aircraft", "points": 85, "aliases": [] }, { "label": "Motor glider", "points": 85, "aliases": [] }, { "label": "Motor ship", "points": 85, "aliases": [] }, { "label": "Motor torpedo boat tender", "points": 85, "aliases": [] }, { "label": "Motorsailer", "points": 85, "aliases": [] }, { "label": "Mtepe", "points": 85, "aliases": [] }, { "label": "Mud sledge", "points": 85, "aliases": [] }, { "label": "Multi-purpose vessel", "points": 85, "aliases": [] }, { "label": "Narco-submarine", "points": 85, "aliases": [] }, { "label": "Narrow-body aircraft", "points": 85, "aliases": [] }, { "label": "Navicello", "points": 85, "aliases": [] }, { "label": "Navigation satellite", "points": 85, "aliases": [] }, { "label": "Navis lusoria", "points": 85, "aliases": [] }, { "label": "Nef", "points": 85, "aliases": [] }, { "label": "Neretva la\u0111a", "points": 85, "aliases": [] }, { "label": "Ngalawa", "points": 85, "aliases": [] }, { "label": "Night fighter", "points": 85, "aliases": [] }, { "label": "Nobby", "points": 85, "aliases": [] }, { "label": "Nordland boat", "points": 85, "aliases": [] }, { "label": "Norfolk wherry", "points": 85, "aliases": [] }, { "label": "Norimono", "points": 85, "aliases": [] }, { "label": "Nugger", "points": 85, "aliases": [] }, { "label": "Observation balloon", "points": 85, "aliases": [] }, { "label": "Ocean boarding vessel", "points": 85, "aliases": [] }, { "label": "Odam", "points": 85, "aliases": [] }, { "label": "Oiler", "points": 85, "aliases": [] }, { "label": "Ontang", "points": 85, "aliases": [] }, { "label": "Opduwer", "points": 85, "aliases": [] }, { "label": "Orbiter", "points": 85, "aliases": [] }, { "label": "Ore carrier", "points": 85, "aliases": [] }, { "label": "Orembai", "points": 85, "aliases": [] }, { "label": "Ornithopter", "points": 85, "aliases": [] }, { "label": "Oruwa", "points": 85, "aliases": [] }, { "label": "Oselvar", "points": 85, "aliases": [] }, { "label": "Owong", "points": 85, "aliases": [] }, { "label": "Oyster boat", "points": 85, "aliases": [] }, { "label": "Oyster schooner", "points": 85, "aliases": [] }, { "label": "Pacific Northwest canoe", "points": 85, "aliases": [] }, { "label": "Packet boat", "points": 85, "aliases": [] }, { "label": "Packraft", "points": 85, "aliases": [] }, { "label": "Padewakang", "points": 85, "aliases": [] }, { "label": "Paduwang", "points": 85, "aliases": [] }, { "label": "Pahi", "points": 85, "aliases": [] }, { "label": "Pajala", "points": 85, "aliases": [] }, { "label": "Palari", "points": 85, "aliases": [] }, { "label": "Paledang", "points": 85, "aliases": [] }, { "label": "Palliyodam", "points": 85, "aliases": [] }, { "label": "Pamphylon", "points": 85, "aliases": [] }, { "label": "Panga", "points": 85, "aliases": [] }, { "label": "Pangkur", "points": 85, "aliases": [] }, { "label": "Panineman", "points": 85, "aliases": [] }, { "label": "Panokseon", "points": 85, "aliases": [] }, { "label": "Panshi", "points": 85, "aliases": [] }, { "label": "Paopao", "points": 85, "aliases": [] }, { "label": "Papyrus boat", "points": 85, "aliases": [] }, { "label": "Para ice hockey sled", "points": 85, "aliases": [] }, { "label": "Paramotor", "points": 85, "aliases": [] }, { "label": "Parasite aircraft", "points": 85, "aliases": [] }, { "label": "Paraw", "points": 85, "aliases": [] }, { "label": "Pasaplap", "points": 85, "aliases": [] }, { "label": "Patorani", "points": 85, "aliases": [] }, { "label": "Pattamar", "points": 85, "aliases": [] }, { "label": "Pauzok", "points": 85, "aliases": [] }, { "label": "Peapod", "points": 85, "aliases": [] }, { "label": "Pelang", "points": 85, "aliases": [] }, { "label": "Pelota boat", "points": 85, "aliases": [] }, { "label": "Pencalang", "points": 85, "aliases": [] }, { "label": "P\xE9niche", "points": 85, "aliases": [] }, { "label": "Penjajap", "points": 85, "aliases": [] }, { "label": "Penteconter", "points": 85, "aliases": [] }, { "label": "Perahu payang", "points": 85, "aliases": [] }, { "label": "Perama", "points": 85, "aliases": [] }, { "label": "Personal submarine", "points": 85, "aliases": [] }, { "label": "Peter boat", "points": 85, "aliases": [] }, { "label": "Phoenix boat", "points": 85, "aliases": [] }, { "label": "Picket boat", "points": 85, "aliases": [] }, { "label": "Picnic boat", "points": 85, "aliases": [] }, { "label": "Pielego", "points": 85, "aliases": [] }, { "label": "Pilot boat", "points": 85, "aliases": [] }, { "label": "Pilot cutter", "points": 85, "aliases": [] }, { "label": "Pilothouse yacht", "points": 85, "aliases": [] }, { "label": "Pinas", "points": 85, "aliases": [] }, { "label": "Pinasse", "points": 85, "aliases": [] }, { "label": "Pinisi", "points": 85, "aliases": [] }, { "label": "Pink (ship)", "points": 85, "aliases": [] }, { "label": "Pinky schooner", "points": 85, "aliases": [] }, { "label": "Pinnace", "points": 85, "aliases": [] }, { "label": "Pipe-laying ship", "points": 85, "aliases": [] }, { "label": "Pipelayer", "points": 85, "aliases": [] }, { "label": "Pirogue", "points": 85, "aliases": [] }, { "label": "Platform supply vessel", "points": 85, "aliases": [] }, { "label": "Pocket cruiser", "points": 85, "aliases": [] }, { "label": "Pointer boat", "points": 85, "aliases": [] }, { "label": "Pojama", "points": 85, "aliases": [] }, { "label": "Polacca", "points": 85, "aliases": [] }, { "label": "Polyreme", "points": 85, "aliases": [] }, { "label": "P\u014Dpao", "points": 85, "aliases": [] }, { "label": "Popow", "points": 85, "aliases": [] }, { "label": "Poveiro", "points": 85, "aliases": [] }, { "label": "Powered parachute", "points": 85, "aliases": [] }, { "label": "Pram (warship)", "points": 85, "aliases": [] }, { "label": "Pram dinghy", "points": 85, "aliases": [] }, { "label": "Pre-dreadnought", "points": 85, "aliases": [] }, { "label": "Primary glider", "points": 85, "aliases": [] }, { "label": "Prison ship", "points": 85, "aliases": [] }, { "label": "Privateer", "points": 85, "aliases": [] }, { "label": "Proa", "points": 85, "aliases": [] }, { "label": "Product tanker", "points": 85, "aliases": [] }, { "label": "Protected cruiser", "points": 85, "aliases": [] }, { "label": "PT boat", "points": 85, "aliases": [] }, { "label": "Pulk", "points": 85, "aliases": [] }, { "label": "Pulwar", "points": 85, "aliases": [] }, { "label": "Pung", "points": 85, "aliases": [] }, { "label": "Pungy", "points": 85, "aliases": [] }, { "label": "P\xFCnte", "points": 85, "aliases": [] }, { "label": "Puparin", "points": 85, "aliases": [] }, { "label": "Pusher aircraft", "points": 85, "aliases": [] }, { "label": "Q-ship", "points": 85, "aliases": [] }, { "label": "Quadrireme", "points": 85, "aliases": [] }, { "label": "Quadruplane", "points": 85, "aliases": [] }, { "label": "Quffa", "points": 85, "aliases": [] }, { "label": "Quinquereme", "points": 85, "aliases": [] }, { "label": "Rabelo", "points": 85, "aliases": [] }, { "label": "Race-built galleon", "points": 85, "aliases": [] }, { "label": "Racing aircraft", "points": 85, "aliases": [] }, { "label": "Racing sailboat", "points": 85, "aliases": [] }, { "label": "Racing shell", "points": 85, "aliases": [] }, { "label": "Rafiot", "points": 85, "aliases": [] }, { "label": "Ramped cargo lighter", "points": 85, "aliases": [] }, { "label": "Rangeley boat", "points": 85, "aliases": [] }, { "label": "Razee", "points": 85, "aliases": [] }, { "label": "Reaction ferry", "points": 85, "aliases": [] }, { "label": "Recreational trawler", "points": 85, "aliases": [] }, { "label": "Red seal ship", "points": 85, "aliases": [] }, { "label": "Reed boat", "points": 85, "aliases": [] }, { "label": "Reedlighter", "points": 85, "aliases": [] }, { "label": "Reefer ship", "points": 85, "aliases": [] }, { "label": "Regional jet", "points": 85, "aliases": [] }, { "label": "Reindeer sled", "points": 85, "aliases": [] }, { "label": "Remotely operated vehicle", "points": 85, "aliases": [] }, { "label": "Repair ship", "points": 85, "aliases": [] }, { "label": "Research vessel", "points": 85, "aliases": [] }, { "label": "Revenue cutter", "points": 85, "aliases": [] }, { "label": "Rigid inflatable boat", "points": 85, "aliases": [] }, { "label": "River ark", "points": 85, "aliases": [] }, { "label": "River cruise ship", "points": 85, "aliases": [] }, { "label": "Ro-ro ship", "points": 85, "aliases": [] }, { "label": "Rock-dumping vessel", "points": 85, "aliases": [] }, { "label": "Rocket glider", "points": 85, "aliases": [] }, { "label": "Rocket plane", "points": 85, "aliases": [] }, { "label": "Rocket sled", "points": 85, "aliases": [] }, { "label": "Rocket vessel", "points": 85, "aliases": [] }, { "label": "Rodney boat", "points": 85, "aliases": [] }, { "label": "Rotor kite", "points": 85, "aliases": [] }, { "label": "Rotor ship", "points": 85, "aliases": [] }, { "label": "Row galley", "points": 85, "aliases": [] }, { "label": "Royal barge", "points": 85, "aliases": [] }, { "label": "Royal yacht", "points": 85, "aliases": [] }, { "label": "Rozi\xE8re balloon", "points": 85, "aliases": [] }, { "label": "Rum runner", "points": 85, "aliases": [] }, { "label": "Runabout", "points": 85, "aliases": [] }, { "label": "Sabani", "points": 85, "aliases": [] }, { "label": "Sailing dinghy", "points": 85, "aliases": [] }, { "label": "Sakman", "points": 85, "aliases": [] }, { "label": "Salambaw", "points": 85, "aliases": [] }, { "label": "Salisipan", "points": 85, "aliases": [] }, { "label": "Salvage tug", "points": 85, "aliases": [] }, { "label": "Sambuk", "points": 85, "aliases": [] }, { "label": "Sampan panjang", "points": 85, "aliases": [] }, { "label": "Sandeq", "points": 85, "aliases": [] }, { "label": "Sandolo", "points": 85, "aliases": [] }, { "label": "Sapyaw", "points": 85, "aliases": [] }, { "label": "Sarua", "points": 85, "aliases": [] }, { "label": "Saucer sled", "points": 85, "aliases": [] }, { "label": "Scaffie", "points": 85, "aliases": [] }, { "label": "Scanoe", "points": 85, "aliases": [] }, { "label": "Schokker", "points": 85, "aliases": [] }, { "label": "Schooner barge", "points": 85, "aliases": [] }, { "label": "Schuyt", "points": 85, "aliases": [] }, { "label": "Scout cruiser", "points": 85, "aliases": [] }, { "label": "Scow", "points": 85, "aliases": [] }, { "label": "Scow schooner", "points": 85, "aliases": [] }, { "label": "Screw sloop", "points": 85, "aliases": [] }, { "label": "Screw-propelled vehicle", "points": 85, "aliases": [] }, { "label": "Scull", "points": 85, "aliases": [] }, { "label": "Sea Bright skiff", "points": 85, "aliases": [] }, { "label": "Sealer", "points": 85, "aliases": [] }, { "label": "Seaplane tender", "points": 85, "aliases": [] }, { "label": "Seberen", "points": 85, "aliases": [] }, { "label": "Seeb\xE4derschiff", "points": 85, "aliases": [] }, { "label": "Seiner", "points": 85, "aliases": [] }, { "label": "Sekibune", "points": 85, "aliases": [] }, { "label": "Sekong", "points": 85, "aliases": [] }, { "label": "Self-propelled artillery", "points": 85, "aliases": [] }, { "label": "Self-unloader", "points": 85, "aliases": [] }, { "label": "Semi-rigid airship", "points": 85, "aliases": [] }, { "label": "Semi-submarine", "points": 85, "aliases": [] }, { "label": "Sesquiplane", "points": 85, "aliases": [] }, { "label": "Settee (ship)", "points": 85, "aliases": [] }, { "label": "Seventy-four (74-gun ship)", "points": 85, "aliases": [] }, { "label": "Sewn boat", "points": 85, "aliases": [] }, { "label": "Sgoth", "points": 85, "aliases": [] }, { "label": "Shachuan", "points": 85, "aliases": [] }, { "label": "Shad boat", "points": 85, "aliases": [] }, { "label": "Shallop", "points": 85, "aliases": [] }, { "label": "Sharpie", "points": 85, "aliases": [] }, { "label": "Shasha", "points": 85, "aliases": [] }, { "label": "Sheepskin raft", "points": 85, "aliases": [] }, { "label": "Shikara", "points": 85, "aliases": [] }, { "label": "Ship of the line", "points": 85, "aliases": [] }, { "label": "Shipentine", "points": 85, "aliases": [] }, { "label": "Shitik", "points": 85, "aliases": [] }, { "label": "Showboat", "points": 85, "aliases": [] }, { "label": "Shu'ai", "points": 85, "aliases": [] }, { "label": "Shuttle tanker", "points": 85, "aliases": [] }, { "label": "Silla", "points": 85, "aliases": [] }, { "label": "Sinagot", "points": 85, "aliases": [] }, { "label": "Sit-on-top kayak", "points": 85, "aliases": [] }, { "label": "Sit-ski", "points": 85, "aliases": [] }, { "label": "Sixareen", "points": 85, "aliases": [] }, { "label": "Skeid", "points": 85, "aliases": [] }, { "label": "Ski bike", "points": 85, "aliases": [] }, { "label": "Ski boat", "points": 85, "aliases": [] }, { "label": "Skiff", "points": 85, "aliases": [] }, { "label": "Skipjack", "points": 85, "aliases": [] }, { "label": "Skiplane", "points": 85, "aliases": [] }, { "label": "Skydiving plane", "points": 85, "aliases": [] }, { "label": "Skywriter", "points": 85, "aliases": [] }, { "label": "Slave ship", "points": 85, "aliases": [] }, { "label": "Slipper launch", "points": 85, "aliases": [] }, { "label": "Sloop-of-war", "points": 85, "aliases": [] }, { "label": "Smack", "points": 85, "aliases": [] }, { "label": "Snagboat", "points": 85, "aliases": [] }, { "label": "Sneakbox", "points": 85, "aliases": [] }, { "label": "Snekkja", "points": 85, "aliases": [] }, { "label": "Snow (brig)", "points": 85, "aliases": [] }, { "label": "Snow bike", "points": 85, "aliases": [] }, { "label": "Snowcoach", "points": 85, "aliases": [] }, { "label": "Solar balloon", "points": 85, "aliases": [] }, { "label": "Solar boat", "points": 85, "aliases": [] }, { "label": "Solar sail", "points": 85, "aliases": [] }, { "label": "Solar-powered aircraft", "points": 85, "aliases": [] }, { "label": "Solu", "points": 85, "aliases": [] }, { "label": "Sounding rocket", "points": 85, "aliases": [] }, { "label": "Space telescope", "points": 85, "aliases": [] }, { "label": "Space tug", "points": 85, "aliases": [] }, { "label": "Spaceplane", "points": 85, "aliases": [] }, { "label": "Sportfishing boat", "points": 85, "aliases": [] }, { "label": "Sprint canoe", "points": 85, "aliases": [] }, { "label": "Spy satellite", "points": 85, "aliases": [] }, { "label": "Spy ship", "points": 85, "aliases": [] }, { "label": "Stealth ship", "points": 85, "aliases": [] }, { "label": "Steam brig", "points": 85, "aliases": [] }, { "label": "Steam frigate", "points": 85, "aliases": [] }, { "label": "Steam launch", "points": 85, "aliases": [] }, { "label": "Steam shovel", "points": 85, "aliases": [] }, { "label": "Steam yacht", "points": 85, "aliases": [] }, { "label": "STOL aircraft", "points": 85, "aliases": [] }, { "label": "Stone boat", "points": 85, "aliases": [] }, { "label": "Straight decker", "points": 85, "aliases": [] }, { "label": "Strug", "points": 85, "aliases": [] }, { "label": "Sturgeon-nosed canoe", "points": 85, "aliases": [] }, { "label": "Submarine aircraft carrier", "points": 85, "aliases": [] }, { "label": "Submarine chaser", "points": 85, "aliases": [] }, { "label": "Submarine rescue ship", "points": 85, "aliases": [] }, { "label": "Submarine tender", "points": 85, "aliases": [] }, { "label": "Surf ski", "points": 85, "aliases": [] }, { "label": "Surface effect ship", "points": 85, "aliases": [] }, { "label": "Surfboat", "points": 85, "aliases": [] }, { "label": "Surveillance drone", "points": 85, "aliases": [] }, { "label": "Survey vessel", "points": 85, "aliases": [] }, { "label": "Swan boat (Thai racing)", "points": 85, "aliases": [] }, { "label": "SWATH ship", "points": 85, "aliases": [] }, { "label": "Swimmer delivery vehicle", "points": 85, "aliases": [] }, { "label": "Swing-wing aircraft", "points": 85, "aliases": [] }, { "label": "Tail-sitter", "points": 85, "aliases": [] }, { "label": "Taildragger", "points": 85, "aliases": [] }, { "label": "Takia", "points": 85, "aliases": [] }, { "label": "Tamar barge", "points": 85, "aliases": [] }, { "label": "Tambang", "points": 85, "aliases": [] }, { "label": "Tancook schooner", "points": 85, "aliases": [] }, { "label": "Tandem-rotor helicopter", "points": 85, "aliases": [] }, { "label": "Tank destroyer", "points": 85, "aliases": [] }, { "label": "Tanker aircraft", "points": 85, "aliases": [] }, { "label": "Tankette", "points": 85, "aliases": [] }, { "label": "Tankwa", "points": 85, "aliases": [] }, { "label": "Tapake", "points": 85, "aliases": [] }, { "label": "Tarada", "points": 85, "aliases": [] }, { "label": "Tarai-bune", "points": 85, "aliases": [] }, { "label": "Target drone", "points": 85, "aliases": [] }, { "label": "Tartane", "points": 85, "aliases": [] }, { "label": "Tatara", "points": 85, "aliases": [] }, { "label": "Tataya", "points": 85, "aliases": [] }, { "label": "Team boat", "points": 85, "aliases": [] }, { "label": "Technical research ship", "points": 85, "aliases": [] }, { "label": "Tempel", "points": 85, "aliases": [] }, { "label": "Tender (boat)", "points": 85, "aliases": [] }, { "label": "Teneh", "points": 85, "aliases": [] }, { "label": "Tepukei", "points": 85, "aliases": [] }, { "label": "Tessarakonteres", "points": 85, "aliases": [] }, { "label": "Tethered balloon", "points": 85, "aliases": [] }, { "label": "Thames sailing barge", "points": 85, "aliases": [] }, { "label": "Thames skiff", "points": 85, "aliases": [] }, { "label": "Thames wherry", "points": 85, "aliases": [] }, { "label": "Thermal airship", "points": 85, "aliases": [] }, { "label": "Three-decker (warship)", "points": 85, "aliases": [] }, { "label": "Tiltjet", "points": 85, "aliases": [] }, { "label": "Tiltrotor", "points": 85, "aliases": [] }, { "label": "Tiltwing", "points": 85, "aliases": [] }, { "label": "Timber carrier", "points": 85, "aliases": [] }, { "label": "Timberclad", "points": 85, "aliases": [] }, { "label": "Tip-jet helicopter", "points": 85, "aliases": [] }, { "label": "Tipairua", "points": 85, "aliases": [] }, { "label": "Tipnol", "points": 85, "aliases": [] }, { "label": "Tipoye", "points": 85, "aliases": [] }, { "label": "Tiririt", "points": 85, "aliases": [] }, { "label": "Tjalk", "points": 85, "aliases": [] }, { "label": "Tjotter", "points": 85, "aliases": [] }, { "label": "Tom Pudding boat", "points": 85, "aliases": [] }, { "label": "Tomako", "points": 85, "aliases": [] }, { "label": "Tomol", "points": 85, "aliases": [] }, { "label": "Tongiaki", "points": 85, "aliases": [] }, { "label": "Tongkang", "points": 85, "aliases": [] }, { "label": "Toop", "points": 85, "aliases": [] }, { "label": "Topo", "points": 85, "aliases": [] }, { "label": "Torpedo boat", "points": 85, "aliases": [] }, { "label": "Torpedo bomber", "points": 85, "aliases": [] }, { "label": "Torpedo cruiser", "points": 85, "aliases": [] }, { "label": "Torpedo gunboat", "points": 85, "aliases": [] }, { "label": "Torpedo ram", "points": 85, "aliases": [] }, { "label": "Totora reed boat", "points": 85, "aliases": [] }, { "label": "Tourist submarine", "points": 85, "aliases": [] }, { "label": "Towboat", "points": 85, "aliases": [] }, { "label": "Trabaccolo", "points": 85, "aliases": [] }, { "label": "Tracked armoured personnel carrier", "points": 85, "aliases": [] }, { "label": "Tracked combine harvester", "points": 85, "aliases": [] }, { "label": "Tracked wheelchair", "points": 85, "aliases": [] }, { "label": "Tracking ship", "points": 85, "aliases": [] }, { "label": "Traghetto", "points": 85, "aliases": [] }, { "label": "Trailer sailer", "points": 85, "aliases": [] }, { "label": "Train ferry", "points": 85, "aliases": [] }, { "label": "Trainer aircraft", "points": 85, "aliases": [] }, { "label": "Training ship", "points": 85, "aliases": [] }, { "label": "Trajinera", "points": 85, "aliases": [] }, { "label": "Tramp steamer", "points": 85, "aliases": [] }, { "label": "Transport helicopter", "points": 85, "aliases": [] }, { "label": "Transverse-rotor helicopter", "points": 85, "aliases": [] }, { "label": "Travois", "points": 85, "aliases": [] }, { "label": "Treasure ship", "points": 85, "aliases": [] }, { "label": "Trehantiri", "points": 85, "aliases": [] }, { "label": "Trekschuit", "points": 85, "aliases": [] }, { "label": "Triaconter", "points": 85, "aliases": [] }, { "label": "Trijet", "points": 85, "aliases": [] }, { "label": "Trimotor", "points": 85, "aliases": [] }, { "label": "Trincadour", "points": 85, "aliases": [] }, { "label": "Trireme", "points": 85, "aliases": [] }, { "label": "Troller", "points": 85, "aliases": [] }, { "label": "Trolley boat", "points": 85, "aliases": [] }, { "label": "Troopship", "points": 85, "aliases": [] }, { "label": "Trow", "points": 85, "aliases": [] }, { "label": "Trunk deck ship", "points": 85, "aliases": [] }, { "label": "Tub boat", "points": 85, "aliases": [] }, { "label": "Tuin", "points": 85, "aliases": [] }, { "label": "Tule boat", "points": 85, "aliases": [] }, { "label": "Tunnel boat", "points": 85, "aliases": [] }, { "label": "Turret deck ship", "points": 85, "aliases": [] }, { "label": "Turret ship", "points": 85, "aliases": [] }, { "label": "Turtle ship", "points": 85, "aliases": [] }, { "label": "Turuma", "points": 85, "aliases": [] }, { "label": "Tweendecker", "points": 85, "aliases": [] }, { "label": "Twin-boom aircraft", "points": 85, "aliases": [] }, { "label": "Twin-engine plane", "points": 85, "aliases": [] }, { "label": "Twin-fuselage aircraft", "points": 85, "aliases": [] }, { "label": "Two-decker", "points": 85, "aliases": [] }, { "label": "Tyne keel", "points": 85, "aliases": [] }, { "label": "Udema", "points": 85, "aliases": [] }, { "label": "Umiak", "points": 85, "aliases": [] }, { "label": "Unmanned surface vehicle", "points": 85, "aliases": [] }, { "label": "Unprotected cruiser", "points": 85, "aliases": [] }, { "label": "Uru", "points": 85, "aliases": [] }, { "label": "Utility aircraft", "points": 85, "aliases": [] }, { "label": "Utility helicopter", "points": 85, "aliases": [] }, { "label": "Va'a-alo", "points": 85, "aliases": [] }, { "label": "Va'a-tele", "points": 85, "aliases": [] }, { "label": "Vaka katea", "points": 85, "aliases": [] }, { "label": "Vaka tou'ua", "points": 85, "aliases": [] }, { "label": "Vallam", "points": 85, "aliases": [] }, { "label": "Very slender vessel", "points": 85, "aliases": [] }, { "label": "Vinta", "points": 85, "aliases": [] }, { "label": "Vlet", "points": 85, "aliases": [] }, { "label": "Voyageur canoe", "points": 85, "aliases": [] }, { "label": "Vozok", "points": 85, "aliases": [] }, { "label": "VTOL aircraft", "points": 85, "aliases": [] }, { "label": "Vytine", "points": 85, "aliases": [] }, { "label": "Wa canoe", "points": 85, "aliases": [] }, { "label": "Wahr", "points": 85, "aliases": [] }, { "label": "Waka", "points": 85, "aliases": [] }, { "label": "Wakeboard boat", "points": 85, "aliases": [] }, { "label": "Walap", "points": 85, "aliases": [] }, { "label": "Walkaround boat", "points": 85, "aliases": [] }, { "label": "Wangga", "points": 85, "aliases": [] }, { "label": "War canoe", "points": 85, "aliases": [] }, { "label": "Warbird", "points": 85, "aliases": [] }, { "label": "Waserak", "points": 85, "aliases": [] }, { "label": "Water ambulance", "points": 85, "aliases": [] }, { "label": "Water bike", "points": 85, "aliases": [] }, { "label": "Water bomber", "points": 85, "aliases": [] }, { "label": "Water bus", "points": 85, "aliases": [] }, { "label": "Wave power ship", "points": 85, "aliases": [] }, { "label": "Wave-piercer", "points": 85, "aliases": [] }, { "label": "Weather satellite", "points": 85, "aliases": [] }, { "label": "Weather ship", "points": 85, "aliases": [] }, { "label": "Weidling", "points": 85, "aliases": [] }, { "label": "Weight-shift trike", "points": 85, "aliases": [] }, { "label": "Wellboat", "points": 85, "aliases": [] }, { "label": "West Country ketch", "points": 85, "aliases": [] }, { "label": "West Indiaman", "points": 85, "aliases": [] }, { "label": "Whaleback", "points": 85, "aliases": [] }, { "label": "Whaleboat", "points": 85, "aliases": [] }, { "label": "Whaler", "points": 85, "aliases": [] }, { "label": "Wherry", "points": 85, "aliases": [] }, { "label": "Whitehall boat", "points": 85, "aliases": [] }, { "label": "Wide-body aircraft", "points": 85, "aliases": [] }, { "label": "Widebeam", "points": 85, "aliases": [] }, { "label": "Wind turbine installation vessel", "points": 85, "aliases": [] }, { "label": "Windjammer", "points": 85, "aliases": [] }, { "label": "Workboat", "points": 85, "aliases": [] }, { "label": "Wugongchuan", "points": 85, "aliases": [] }, { "label": "Wupan", "points": 85, "aliases": [] }, { "label": "Xebec", "points": 85, "aliases": [] }, { "label": "Yacht support vessel", "points": 85, "aliases": [] }, { "label": "Yakatabune", "points": 85, "aliases": [] }, { "label": "Yal", "points": 85, "aliases": [] }, { "label": "Yathra dhoni", "points": 85, "aliases": [] }, { "label": "Yawl", "points": 85, "aliases": [] }, { "label": "Yoal", "points": 85, "aliases": [] }, { "label": "Yole", "points": 85, "aliases": [] }, { "label": "York boat", "points": 85, "aliases": [] }, { "label": "Zabra", "points": 85, "aliases": [] }, { "label": "Zarook", "points": 85, "aliases": [] }, { "label": "Zeesboot", "points": 85, "aliases": [] }, { "label": "Zille", "points": 85, "aliases": [] }, { "label": "Zulu boat", "points": 85, "aliases": [] }, { "label": "Aerial cable car", "points": 60, "aliases": [] }, { "label": "Air ambulance", "points": 60, "aliases": [] }, { "label": "Airboat", "points": 60, "aliases": [] }, { "label": "Aircraft carrier", "points": 60, "aliases": [] }, { "label": "Attack helicopter", "points": 60, "aliases": [] }, { "label": "Autogyro", "points": 60, "aliases": [] }, { "label": "Bamboo raft", "points": 60, "aliases": [] }, { "label": "Barge", "points": 60, "aliases": [] }, { "label": "Bass boat", "points": 60, "aliases": [] }, { "label": "Battleship", "points": 60, "aliases": [] }, { "label": "Biplane", "points": 60, "aliases": [] }, { "label": "Bomber", "points": 60, "aliases": [] }, { "label": "Bulldozer", "points": 60, "aliases": [] }, { "label": "Bumper boat", "points": 60, "aliases": [] }, { "label": "Bush plane", "points": 60, "aliases": [] }, { "label": "Canal boat", "points": 60, "aliases": [] }, { "label": "Car ferry", "points": 60, "aliases": [] }, { "label": "Cargo plane", "points": 60, "aliases": [] }, { "label": "Cargo ship", "points": 60, "aliases": [] }, { "label": "Catamaran", "points": 60, "aliases": [] }, { "label": "Chairlift", "points": 60, "aliases": [] }, { "label": "Charter boat", "points": 60, "aliases": [] }, { "label": "Cigarette boat", "points": 60, "aliases": [] }, { "label": "Clipper", "points": 60, "aliases": [] }, { "label": "Coast Guard cutter", "points": 60, "aliases": [] }, { "label": "Commuter plane", "points": 60, "aliases": [] }, { "label": "Container ship", "points": 60, "aliases": [] }, { "label": "Coracle", "points": 60, "aliases": [] }, { "label": "Crab boat", "points": 60, "aliases": [] }, { "label": "Crop duster", "points": 60, "aliases": [] }, { "label": "Cruiser", "points": 60, "aliases": [] }, { "label": "Cruising sailboat", "points": 60, "aliases": [] }, { "label": "Cutter (boat)", "points": 60, "aliases": [] }, { "label": "Delivery drone", "points": 60, "aliases": [] }, { "label": "Destroyer", "points": 60, "aliases": [] }, { "label": "Dhow", "points": 60, "aliases": [] }, { "label": "Dinghy", "points": 60, "aliases": [] }, { "label": "Dog sled", "points": 60, "aliases": [] }, { "label": "Dugout canoe", "points": 60, "aliases": [] }, { "label": "Excavator", "points": 60, "aliases": [] }, { "label": "Fighter jet", "points": 60, "aliases": [] }, { "label": "Fishing boat", "points": 60, "aliases": [] }, { "label": "Fishing kayak", "points": 60, "aliases": [] }, { "label": "Flying boat", "points": 60, "aliases": [] }, { "label": "FPV drone", "points": 60, "aliases": [] }, { "label": "Frigate", "points": 60, "aliases": [] }, { "label": "Galleon", "points": 60, "aliases": [] }, { "label": "Galley", "points": 60, "aliases": [] }, { "label": "Glass-bottom boat", "points": 60, "aliases": [] }, { "label": "Glider", "points": 60, "aliases": [] }, { "label": "Gondola lift", "points": 60, "aliases": [] }, { "label": "Gunboat", "points": 60, "aliases": [] }, { "label": "Hang glider", "points": 60, "aliases": [] }, { "label": "Houseboat", "points": 60, "aliases": [] }, { "label": "Hydrofoil", "points": 60, "aliases": [] }, { "label": "Icebreaker", "points": 60, "aliases": [] }, { "label": "Inflatable boat", "points": 60, "aliases": [] }, { "label": "Inflatable kayak", "points": 60, "aliases": [] }, { "label": "Jetpack", "points": 60, "aliases": [] }, { "label": "Junk", "points": 60, "aliases": [] }, { "label": "Life raft", "points": 60, "aliases": [] }, { "label": "Lifeboat", "points": 60, "aliases": [] }, { "label": "Light aircraft", "points": 60, "aliases": [] }, { "label": "Log flume boat", "points": 60, "aliases": [] }, { "label": "Log raft", "points": 60, "aliases": [] }, { "label": "Longship", "points": 60, "aliases": [] }, { "label": "Luge", "points": 60, "aliases": [] }, { "label": "Lunar module", "points": 60, "aliases": [] }, { "label": "Maglev", "points": 60, "aliases": [] }, { "label": "Military drone", "points": 60, "aliases": [] }, { "label": "Minesweeper", "points": 60, "aliases": [] }, { "label": "Motor yacht", "points": 60, "aliases": [] }, { "label": "Narrowboat", "points": 60, "aliases": [] }, { "label": "Ocean liner", "points": 60, "aliases": [] }, { "label": "Oil tanker", "points": 60, "aliases": [] }, { "label": "Outrigger canoe", "points": 60, "aliases": [] }, { "label": "Paddle boat", "points": 60, "aliases": [] }, { "label": "Paddle steamer", "points": 60, "aliases": [] }, { "label": "Palanquin", "points": 60, "aliases": [] }, { "label": "Paraglider", "points": 60, "aliases": [] }, { "label": "Passenger ship", "points": 60, "aliases": [] }, { "label": "Patrol boat", "points": 60, "aliases": [] }, { "label": "Pirate ship", "points": 60, "aliases": [] }, { "label": "Police boat", "points": 60, "aliases": [] }, { "label": "Police helicopter", "points": 60, "aliases": [] }, { "label": "Pontoon boat", "points": 60, "aliases": [] }, { "label": "Propeller plane", "points": 60, "aliases": [] }, { "label": "Punt", "points": 60, "aliases": [] }, { "label": "Rescue boat", "points": 60, "aliases": [] }, { "label": "Rescue helicopter", "points": 60, "aliases": [] }, { "label": "Riverboat", "points": 60, "aliases": [] }, { "label": "Sailing ship", "points": 60, "aliases": [] }, { "label": "Sailing yacht", "points": 60, "aliases": [] }, { "label": "Sampan", "points": 60, "aliases": [] }, { "label": "Satellite", "points": 60, "aliases": [] }, { "label": "Schooner", "points": 60, "aliases": [] }, { "label": "Sea kayak", "points": 60, "aliases": [] }, { "label": "Seaplane", "points": 60, "aliases": [] }, { "label": "Sedan chair", "points": 60, "aliases": [] }, { "label": "Shrimp boat", "points": 60, "aliases": [] }, { "label": "Skeleton (sled)", "points": 60, "aliases": [] }, { "label": "Ski lift", "points": 60, "aliases": [] }, { "label": "Sloop", "points": 60, "aliases": [] }, { "label": "Snowcat", "points": 60, "aliases": [] }, { "label": "Space capsule", "points": 60, "aliases": [] }, { "label": "Space probe", "points": 60, "aliases": [] }, { "label": "Space station", "points": 60, "aliases": [] }, { "label": "Spy plane", "points": 60, "aliases": [] }, { "label": "Stealth aircraft", "points": 60, "aliases": [] }, { "label": "Stealth bomber", "points": 60, "aliases": [] }, { "label": "Stealth fighter", "points": 60, "aliases": [] }, { "label": "Steamboat", "points": 60, "aliases": [] }, { "label": "Steamship", "points": 60, "aliases": [] }, { "label": "Submersible", "points": 60, "aliases": [] }, { "label": "Supersonic jet", "points": 60, "aliases": [] }, { "label": "Supertanker", "points": 60, "aliases": [] }, { "label": "Superyacht", "points": 60, "aliases": [] }, { "label": "Tall ship", "points": 60, "aliases": [] }, { "label": "Tank", "points": 60, "aliases": [] }, { "label": "Tinnie", "points": 60, "aliases": [] }, { "label": "Toboggan", "points": 60, "aliases": [] }, { "label": "Tour boat", "points": 60, "aliases": [] }, { "label": "Trawler", "points": 60, "aliases": [] }, { "label": "Trimaran", "points": 60, "aliases": [] }, { "label": "Triplane", "points": 60, "aliases": [] }, { "label": "Tugboat", "points": 60, "aliases": [] }, { "label": "Ultralight", "points": 60, "aliases": [] }, { "label": "Warship", "points": 60, "aliases": [] }, { "label": "Water taxi", "points": 60, "aliases": [] }, { "label": "Weather balloon", "points": 60, "aliases": [] }, { "label": "Whitewater kayak", "points": 60, "aliases": [] }, { "label": "Whitewater raft", "points": 60, "aliases": [] }, { "label": "Airliner", "points": 30, "aliases": [] }, { "label": "Airship", "points": 30, "aliases": [] }, { "label": "Blimp", "points": 30, "aliases": [] }, { "label": "Bobsled", "points": 30, "aliases": [] }, { "label": "Canoe", "points": 30, "aliases": [] }, { "label": "Cruise ship", "points": 30, "aliases": [] }, { "label": "Drone", "points": 30, "aliases": [] }, { "label": "Ferry", "points": 30, "aliases": [] }, { "label": "Gondola (boat)", "points": 30, "aliases": [] }, { "label": "Hot air balloon", "points": 30, "aliases": [] }, { "label": "Hovercraft", "points": 30, "aliases": [] }, { "label": "Jet ski", "points": 30, "aliases": [] }, { "label": "Kayak", "points": 30, "aliases": [] }, { "label": "Motorboat", "points": 30, "aliases": [] }, { "label": "Private jet", "points": 30, "aliases": [] }, { "label": "Raft", "points": 30, "aliases": [] }, { "label": "Rocket", "points": 30, "aliases": [] }, { "label": "Rowboat", "points": 30, "aliases": [] }, { "label": "Sailboat", "points": 30, "aliases": [] }, { "label": "Sled", "points": 30, "aliases": [] }, { "label": "Sleigh", "points": 30, "aliases": [] }, { "label": "Snowmobile", "points": 30, "aliases": [] }, { "label": "Space shuttle", "points": 30, "aliases": [] }, { "label": "Spacecraft", "points": 30, "aliases": [] }, { "label": "Speedboat", "points": 30, "aliases": [] }, { "label": "Submarine", "points": 30, "aliases": [] }, { "label": "Yacht", "points": 30, "aliases": [] }, { "label": "Airplane", "points": 10, "aliases": ["Plane", "Aeroplane", "Airplaneyou"] }, { "label": "Boat", "points": 10, "aliases": ["Boats"] }, { "label": "Helicopter", "points": 10, "aliases": ["Helicopters", "Chopper"] }, { "label": "Ship", "points": 10, "aliases": ["Ships"] }] };

  // airline-bank.js
  var groups = {
    100: `Falcon in cabin`,
    85: `Award booking fee
Award redeposit fee
Baggage delivery
Baggage protection
Baggage subscription
Bassinet seat
Bike
Bundle
Buying elite status
Buying miles
Carbon offset
Celebration cake
Connection fee
Curbside check-in
DOT regulation fee
EU261 levy
Excess valuation
Express verification fee
Fare club membership
Fare lock
Firearms
Frequent flyer joining fee
Golf clubs
Group booking fee
Hands Free (easyJet)
Home check-in
In-flight phone calls
Infant equipment
Insurance surcharge
International service recovery fee
Medical oxygen
Meet and assist
Natural occurrence interruption fee
Online check-in fee
Paper ticket fee
Peak travel surcharge
Priority baggage
Quiet zone
Reactivating miles
Receipt fee
Refund administration fee
Scratch cards
Skycouch
Skynest
SMS confirmation
Status challenge
Stretcher
Surfboard
Travel SIM card
Wheelchair levy`,
    60: `Airport check-in fee
Amenity kit
Booking fee
Credit card fee
Duty-free
Early check-in
Empty adjacent seat
Extra seat
Fast-track security
Flexible fare
Fuel surcharge
Gate-checked bag
Lap infant
Missed flight fee
Musical instrument
Name change fee
No-show fee
Oversized bag
Pet in hold
Phone booking fee
Power outlet
Preferred seat
Priority check-in
Reclining seat
Refundable fare
Same-day change
Ski equipment
Sports equipment
Standby
Unaccompanied minor`,
    30: `Alcohol
Blanket
Boarding pass printing
Business class
Cancellation fee
Change fee
Exit row
Extra bag
First class
Headphones
Hot drinks
In-flight entertainment
Lounge access
Overweight bag
Pet in cabin
Pillow
Premium economy
Priority boarding
Seats together
Travel insurance
Upgrade
Water`,
    10: `Carry-on bag
Checked bag
Drinks
Extra legroom
Meals
Seat selection
Snacks
Wi-Fi`
  };
  var aliases = {
    "Falcon in cabin": ["Falcon", "Falcons", "Falcon seat", "Falcon cabin space"],
    "Alcohol": ["Alcoholyou", "Alcoholic drinks", "Beer", "Wine", "Liquor"],
    "Wi-Fi": ["Wifi", "Internet", "In-flight Wi-Fi", "Onboard internet"],
    "Carry-on bag": ["Carry on", "Carry-on", "Cabin bag", "Hand baggage", "Hand luggage"],
    "Checked bag": ["Checked baggage", "Checked luggage", "Check in bag", "Hold luggage"],
    "Seat selection": ["Seat choice", "Choosing a seat", "Choose seats"],
    "Extra legroom": ["Legroom", "Extra leg room", "Leg room"],
    "Meals": ["Meal", "Food", "In-flight meals"],
    "Snacks": ["Snack"],
    "Drinks": ["Drink", "Beverages", "Beverage"],
    "Bike": ["Bicycle"],
    "Duty-free": ["Duty free shopping", "Duty free goods"],
    "Meet and assist": ["Meet & assist", "Meet and greet"],
    "Hands Free (easyJet)": ["Hands Free", "Easyjet hands free"],
    "DOT regulation fee": ["DOT fee"],
    "EU261 levy": ["EU261 fee"],
    "SMS confirmation": ["Text confirmation", "SMS notification"],
    "Travel SIM card": ["SIM card", "Travel SIM"],
    "Boarding pass printing": ["Printed boarding pass", "Boarding pass printing fee"],
    "Power outlet": ["Power socket", "Charging outlet"],
    "Pet in cabin": ["Cabin pet", "Pet carry on"],
    "Pet in hold": ["Hold pet", "Pet in cargo"],
    "Musical instrument": ["Instrument"],
    "Surfboard": ["Surf board"],
    "Golf clubs": ["Golf bag"],
    "Lounge access": ["Airport lounge", "Lounge"],
    "Sports equipment": ["Sporting equipment"],
    "Unaccompanied minor": ["Unaccompanied child", "Child traveling alone"]
  };
  var AIRLINE_PACK = { id: "airline-extras", topic: "AIRLINE EXTRAS", prompt: "Name an extra that airlines charge for.", source: "User-supplied reference answer bank", answers: Object.entries(groups).flatMap(([points, lines]) => lines.split("\n").map((label) => ({ label, points: Number(points), aliases: aliases[label] ?? [], ...Number(points) === 100 ? { quip: "Qatar Airways lets passengers buy cabin space for their falcons." } : {} }))) };

  // data.js
  var pack = (id, topic, prompt, groups2) => ({ id, topic, prompt, answers: groups2.flatMap((group, i) => group.split(";").filter(Boolean).map((s, j) => {
    const [label, ...aliases2] = s.split("|");
    return { label, aliases: aliases2, points: i === 4 ? j === 0 ? 100 : 85 : [10, 30, 60, 85, 100][i] };
  })) });
  var PACKS = [
    pack("legal-words", "FUTURE COUNSEL", "Name a word used in a courtroom.", ["Judge;Jury;Lawyer|Attorney;Witness;Objection;Evidence", "Verdict;Trial;Defendant;Plaintiff;Prosecutor;Bailiff;Testimony;Oath;Appeal;Hearing;Sentence", "Subpoena;Deposition;Affidavit;Motion;Docket;Counsel;Exhibit;Recess;Sustained;Overruled;Cross examination|Cross-examination;Juror;Indictment;Arraignment;Plea;Bail;Probation", "Voir dire;Amicus curiae;Habeas corpus;Stipulation;Continuance;Remand;Acquittal;Injunction;Mandate;Petitioner;Respondent;Litigant;Rebuttal;Discovery;Summons", "Certiorari;Allocution;Proffer;Surrebuttal;Remittitur;Venire;Replevin;Demurrer;Mandamus;Estoppel"]),
    pack("landmark-cases", "CASE OF THE WEEK", "Name a US Supreme Court case.", ["Brown v. Board of Education|Brown v Board|Brown;Miranda v. Arizona|Miranda;Marbury v. Madison|Marbury", "Roe v. Wade|Roe;Plessy v. Ferguson|Plessy;Tinker v. Des Moines|Tinker;Gideon v. Wainwright|Gideon;Dred Scott v. Sandford|Dred Scott;Dobbs v. Jackson Women s Health Organization|Dobbs", "McCulloch v. Maryland|McCulloch;Mapp v. Ohio|Mapp;New York Times v. Sullivan|Sullivan;Obergefell v. Hodges|Obergefell;United States v. Nixon|US v Nixon;Citizens United v. FEC|Citizens United;Loving v. Virginia|Loving;Bush v. Gore|Bush v Gore;Korematsu v. United States|Korematsu;Terry v. Ohio|Terry", "J.D.B. v. North Carolina|JDB v North Carolina|JDB;West Virginia v. Barnette|Barnette;Wisconsin v. Yoder|Yoder;Katz v. United States|Katz;Gibbons v. Ogden|Gibbons;Engel v. Vitale|Engel;Schenck v. United States|Schenck;Texas v. Johnson;Brandenburg v. Ohio|Brandenburg;Hazelwood v. Kuhlmeier|Hazelwood;Bethel v. Fraser|Fraser", "Yick Wo v. Hopkins|Yick Wo;Morse v. Frederick|Morse;Safford v. Redding|Redding;West Virginia v. EPA;Mahanoy v. B. L.|Mahanoy;Riley v. California|Riley;Carpenter v. United States|Carpenter;Florida v. Jardines|Jardines;New Jersey v. T.L.O.|TLO;In re Gault|Gault"]),
    pack("first-amendment", "KNOW YOUR RIGHTS", "Name a freedom protected by the First Amendment.", ["Speech|Freedom of speech|Free speech", "Religion|Freedom of religion|Religious freedom", "Press|Freedom of the press|Free press", "Assembly|Freedom of assembly|Peaceful assembly", "Petition|Right to petition|Petition the government|Freedom to petition"]),
    pack("planets", "SPACE", "Name a planet in our solar system.", ["Earth;Mars", "Jupiter;Saturn", "Venus;Neptune", "Uranus", "Mercury"]),
    pack("elements", "SCIENCE", "Name a chemical element.", ["Oxygen;Hydrogen;Gold;Iron;Carbon;Silver", "Helium;Copper;Neon;Sodium;Calcium;Aluminum|Aluminium;Nitrogen;Chlorine", "Zinc;Silicon;Lithium;Potassium;Magnesium;Fluorine;Sulfur|Sulphur;Nickel;Titanium;Lead;Tin;Mercury;Platinum;Uranium", "Xenon;Krypton;Cobalt;Argon;Boron;Bromine;Iodine;Tungsten;Phosphorus;Radon;Radium;Barium;Chromium;Manganese;Vanadium;Selenium;Palladium;Bismuth", "Hafnium;Ytterbium;Praseodymium;Tantalum;Rhenium;Osmium;Iridium;Ruthenium;Scandium;Gallium;Indium;Tellurium;Polonium;Astatine;Francium;Cesium|Caesium;Rubidium;Strontium;Beryllium;Germanium;Antimony;Thallium;Cerium;Neodymium;Zirconium;Niobium;Technetium;Molybdenum;Einsteinium;Oganesson"]),
    pack("ocean", "THE DEEP", "Name an animal that lives in the ocean.", ["Shark;Dolphin;Whale;Fish;Octopus;Crab;Jellyfish;Sea turtle|Turtle", "Seahorse;Starfish|Sea star;Lobster;Squid;Clownfish;Stingray;Seal;Orca|Killer whale;Pufferfish|Puffer fish", "Manta ray;Sea lion;Sea urchin;Swordfish;Narwhal;Beluga;Manatee;Tuna;Shrimp|Prawn;Krill;Cuttlefish;Eel;Moray eel;Coral;Sea anemone", "Anglerfish;Nautilus;Dugong;Oarfish;Mantis shrimp;Goblin shark;Whale shark;Horseshoe crab;Sea cucumber;Nudibranch;Lionfish;Sunfish;Blue whale;Sperm whale;Humpback whale;Hammerhead shark;Sea otter;Walrus;Hagfish;Coelacanth", "Vampire squid;Dumbo octopus;Leafy sea dragon;Giant isopod;Barreleye;Siphonophore;Yeti crab;Comb jelly;Bobbit worm;Christmas tree worm;Blue dragon;Basket star"]),
    pack("languages", "FUTURE LAB", "Name a programming or web language.", ["Python;JavaScript|JS;Java;C++;HTML", "C;C#|C sharp;TypeScript|TS;Scratch;SQL;CSS", "Rust;Go|Golang;Swift;Ruby;PHP;Kotlin;R;Lua;Dart;Bash", "Haskell;Scala;Perl;Julia;Elixir;Erlang;Fortran;COBOL;Pascal;Objective-C|Objective C;MATLAB;Assembly", "Zig;OCaml;F#|F sharp;Lisp;Clojure;Scheme;Prolog;Ada;APL;Smalltalk;Nim;Gleam"]),
    pack("renewables", "TOMORROW", "Name a renewable energy source.", ["Solar|Solar power|Solar energy;Wind|Wind power|Wind energy", "Hydropower|Hydroelectric|Hydroelectric power|Water", "Geothermal|Geothermal energy;Biomass|Bioenergy", "Tidal|Tidal energy|Tidal power;Wave|Wave energy|Wave power", "Ocean thermal|Ocean thermal energy|OTEC"]),
    pack("school", "CAMPUS", "Name a subject taught in school.", ["Math|Maths|Mathematics;English;Science;History", "Art;Music;PE|Physical education|Gym;Biology;Chemistry;Physics;Geography", "Computer science|Computing;Spanish;French;Drama|Theater|Theatre;Economics;Psychology;Algebra;Geometry;Calculus", "Sociology;Philosophy;Statistics;Astronomy;Latin;Mandarin|Chinese;German;Japanese;Robotics;Engineering;Civics;Government;Environmental science;Literature;Health", "Anthropology;Linguistics;Geology;Oceanography;Architecture;Ethics;Horticulture;Archaeology;Political science"]),
    pack("council", "FUTURE COUNSEL", "Name a way students can improve their school.", ["Recycling|Recycle;Fundraising|Fundraise|Fundraiser;Volunteering|Volunteer;Tutoring|Tutor", "Student council;Peer mentoring|Mentoring;Food drive;Book drive;Cleanup|Clean up|Litter picking;School newspaper;Clubs|Start a club", "Community garden|School garden|Garden;Buddy system;Suggestion box;Composting;Charity event;Peer mediation;Mental health club;Accessibility;Anti bullying|Anti-bullying campaign;Petition", "Repair cafe|Repair caf\xE9;Clothing swap;Bike rack|Bike racks;Water refill station|Water bottle refill station;Study group;Energy audit;Uniform swap;Beach cleanup;Tree planting", "Seed library;Tool library;Citizen science;Pollinator garden;Participatory budgeting;Little free library;Rain garden;Food rescue"]),
    pack("fruit", "LUNCH BREAK", "Name a fruit.", ["Apple;Banana;Orange;Strawberry;Grape;Watermelon", "Mango;Pineapple;Blueberry;Raspberry;Peach;Pear;Lemon;Lime;Cherry;Kiwi", "Plum;Apricot;Grapefruit;Blackberry;Coconut;Pomegranate;Papaya;Passion fruit;Dragon fruit|Dragonfruit;Cantaloupe;Honeydew;Fig;Date;Avocado;Tomato", "Guava;Lychee;Persimmon;Nectarine;Cranberry;Gooseberry;Star fruit|Starfruit;Jackfruit;Durian;Tangerine;Clementine;Mulberry;Quince", "Rambutan;Mangosteen;Longan;Feijoa;Soursop;Salak;Physalis;Breadfruit;Cherimoya;Jabuticaba"]),
    pack("countries", "WORLD MAP", "Name a country in Europe.", ["France;Germany;Italy;Spain;United Kingdom|UK|Britain;Russia", "Portugal;Greece;Sweden;Norway;Finland;Ireland;Netherlands|Holland;Switzerland;Poland;Ukraine", "Austria;Belgium;Denmark;Iceland;Romania;Hungary;Czechia|Czech Republic;Croatia;Serbia;Bulgaria;Slovakia;Slovenia;Albania;Turkey|T\xFCrkiye", "Estonia;Latvia;Lithuania;Malta;Cyprus;Luxembourg;Montenegro;Bosnia and Herzegovina|Bosnia;North Macedonia|Macedonia;Moldova;Belarus;Kosovo", "Andorra;Liechtenstein;San Marino;Monaco;Vatican City|Vatican"]),
    pack("africa", "WORLD MAP", "Name a country in Africa.", ["Egypt;South Africa;Nigeria;Kenya", "Morocco;Ghana;Ethiopia;Tanzania;Algeria;Madagascar;Sudan", "Tunisia;Uganda;Senegal;Cameroon;Zimbabwe;Zambia;Somalia;Libya;Rwanda;Angola;Mozambique;Botswana;Namibia;Mali;Niger;Democratic Republic of the Congo|DRC|DR Congo;Republic of the Congo|Congo", "Benin;Togo;Gabon;Liberia;Sierra Leone;Chad;Burkina Faso;Mauritania;Mauritius;Seychelles;Malawi;Burundi;South Sudan;Guinea;Equatorial Guinea;Lesotho;Eswatini|Swaziland;Djibouti;Eritrea;Ivory Coast|Cote d Ivoire", "Comoros;Cape Verde|Cabo Verde;Sao Tome and Principe|S\xE3o Tom\xE9 and Pr\xEDncipe;Guinea Bissau|Guinea-Bissau;Central African Republic;Gambia|The Gambia"]),
    pack("sports", "AFTER SCHOOL", "Name a sport played with a ball.", ["Soccer|Football;Basketball;Baseball;Tennis;American football", "Volleyball;Golf;Rugby;Cricket;Softball;Table tennis|Ping pong;Bowling", "Handball;Water polo;Lacrosse;Field hockey|Hockey;Squash;Dodgeball;Kickball;Netball;Pool|Billiards;Snooker", "Racquetball;Futsal;Bocce;Petanque|P\xE9tanque;Croquet;Polo;Gaelic football;Hurling;Australian rules football|Aussie rules", "Sepak takraw;Goalball;Korfball;Bandy;Rounders;Bossaball;Pelota"]),
    pack("instruments", "SOUND CHECK", "Name a musical instrument.", ["Piano;Guitar;Drums|Drum;Violin;Flute", "Trumpet;Saxophone;Clarinet;Cello;Ukulele;Harp;Trombone;Bass guitar|Bass;Keyboard", "Viola;Oboe;Bassoon;French horn;Tuba;Recorder;Harmonica;Banjo;Mandolin;Accordion;Xylophone;Double bass;Organ;Bagpipes", "Sitar;Tabla;Marimba;Vibraphone;Glockenspiel;Djembe;Bongos;Conga;Lute;Ocarina;Theremin;Steelpan|Steel drum;Dulcimer", "Hurdy gurdy|Hurdy-gurdy;Nyckelharpa;Erhu;Koto;Shamisen;Kalimba;Mbira;Balalaika;Didgeridoo;Guqin;Hang|Handpan;Waterphone"]),
    pack("moons", "SPACE", "Name a moon in our solar system.", ["Moon|The Moon|Luna;Titan;Europa", "Ganymede;Io;Callisto;Enceladus;Triton", "Phobos;Deimos;Rhea;Mimas;Titania;Oberon;Miranda;Charon", "Iapetus;Dione;Tethys;Ariel;Umbriel;Nereid;Hyperion;Phoebe", "Proteus;Epimetheus;Janus;Amalthea;Himalia;Dysnomia;Nix;Hydra;Styx;Kerberos;Daphnis;Pan"]),
    pack("trees", "GREEN FUTURE", "Name a type of tree.", ["Oak;Pine;Maple;Palm;Apple", "Birch;Willow;Cherry;Cedar;Elm;Ash;Fir;Spruce;Redwood;Sequoia", "Beech;Chestnut;Walnut;Hickory;Poplar;Aspen;Cypress;Olive;Magnolia;Eucalyptus;Sycamore;Yew;Juniper;Acacia", "Baobab;Ginkgo;Banyan;Dogwood;Hawthorn;Rowan;Alder;Larch;Hemlock;Mahogany;Teak;Jacaranda;Tulip tree", "Wollemi pine;Monkey puzzle;Dragon blood tree;Kapok;Pawpaw;Serviceberry;Black locust;Hornbeam;Katsura"]),
    pack("birds", "SKY WATCH", "Name a bird.", ["Eagle;Parrot;Penguin;Owl;Duck;Chicken;Pigeon", "Robin;Sparrow;Crow;Raven;Flamingo;Swan;Goose;Peacock;Hawk;Falcon;Seagull|Gull;Turkey;Woodpecker", "Hummingbird;Kingfisher;Toucan;Pelican;Ostrich;Emu;Kiwi;Albatross;Puffin;Heron;Crane;Stork;Magpie;Blue jay;Cardinal;Finch;Swallow;Vulture;Canary", "Kookaburra;Cassowary;Secretary bird;Shoebill;Ibis;Spoonbill;Quail;Pheasant;Lapwing;Swift;Nightingale;Wren;Hoopoe;Cockatoo;Macaw", "Kakapo;Kea;Lyrebird;Bowerbird;Tawny frogmouth;Bee eater|Bee-eater;Potoo;Resplendent quetzal|Quetzal;Oilbird;Sunbittern"]),
    pack("shapes", "DESIGN LAB", "Name a two-dimensional geometric shape.", ["Circle;Square;Triangle;Rectangle", "Pentagon;Hexagon;Octagon;Oval|Ellipse;Diamond|Rhombus", "Parallelogram;Trapezoid|Trapezium;Heptagon;Nonagon;Decagon;Kite;Semicircle", "Dodecagon;Hendecagon|Undecagon;Crescent;Annulus;Sector;Quadrilateral;Star;Reuleaux triangle", "Icosagon;Enneagram;Lune;Deltoid;Astroid;Cardioid;Lemniscate;Superellipse"]),
    pack("chess", "STRATEGY", "Name a chess piece.", ["Pawn;King", "Queen", "Rook|Castle", "Bishop", "Knight|Horse"]),
    pack("us-states", "WORLD MAP", "Name a US state.", ["California;New York;Texas;Florida;Hawaii", "Alaska;Ohio;Washington;Nevada;Arizona;Colorado;Georgia;Pennsylvania;New Jersey", "Michigan;Illinois;Massachusetts;Virginia;North Carolina;South Carolina;Tennessee;Oregon;Louisiana;Alabama;Wisconsin;Indiana;Minnesota;Maryland;Utah;Kentucky", "Connecticut;Maine;Vermont;New Hampshire;Rhode Island;New Mexico;Oklahoma;Kansas;Missouri;Iowa;Arkansas;Mississippi;West Virginia;Nebraska;Idaho", "Delaware;Montana;Wyoming;North Dakota;South Dakota"]),
    pack("transport", "TOMORROW", "Name a way people travel.", ["Car;Bus;Train;Plane|Airplane|Aeroplane;Bicycle|Bike;Walking|Walk;Boat", "Subway|Metro|Underground;Tram|Streetcar;Motorcycle|Motorbike;Scooter;Ferry;Helicopter;Skateboard", "Cable car;Gondola;Monorail;Rickshaw;Kayak;Canoe;Sailboat;Hot air balloon;Horse;Roller skates|Rollerblades;Electric bike|Ebike", "Hovercraft;Funicular;Trolleybus;Snowmobile;Dogsled|Dog sled;Segway;Unicycle;Tandem bicycle;Hydrofoil", "Maglev;Airship|Zeppelin|Blimp;Coracle;Felucca;Outrigger canoe;Velomobile;Iceboat"]),
    pack("inventions", "FUTURE COUNSEL", "Name an invention created before 1900.", ["Wheel;Telephone;Light bulb|Lightbulb;Printing press;Steam engine", "Compass;Bicycle;Camera;Telegraph;Telescope;Microscope;Clock;Radio;Battery", "Sewing machine;Typewriter;Elevator;Thermometer;Barometer;Stethoscope;Dynamite;Cotton gin;Phonograph;Refrigerator;Flush toilet;Match|Matches", "Jacquard loom;Sextant;Astrolabe;Pendulum clock;Safety pin;Paper clip|Paperclip;Braille;Fountain pen;Mechanical calculator;Incandescent lamp;Gramophone;Zipper", "Antikythera mechanism;Spinning jenny;Flying shuttle;Bessemer converter;Hydraulic press;Voltaic pile;Pneumatic tire|Pneumatic tyre;Linotype"]),
    pack("flowers", "GREEN FUTURE", "Name a flowering plant.", ["Rose;Sunflower;Tulip;Daisy;Lily", "Orchid;Daffodil;Lavender;Poppy;Dandelion;Hibiscus;Lotus;Violet;Cherry blossom", "Peony;Iris;Marigold;Carnation;Chrysanthemum;Jasmine;Hydrangea;Magnolia;Bluebell;Foxglove;Snapdragon;Petunia;Geranium", "Wisteria;Azalea;Rhododendron;Camellia;Begonia;Zinnia;Cosmos;Dahlia;Crocus;Anemone;Freesia;Hellebore", "Fritillaria;Passionflower;Protea;Strelitzia|Bird of paradise;Edelweiss;Rafflesia;Corpse flower|Titan arum;Lisianthus;Scabiosa"]),
    pack("pasta", "LUNCH BREAK", "Name a type of pasta.", ["Spaghetti;Penne;Macaroni;Lasagna|Lasagne", "Fettuccine;Ravioli;Fusilli;Linguine;Farfalle|Bow tie;Rigatoni;Tortellini", "Tagliatelle;Pappardelle;Orzo;Cannelloni;Rotini;Vermicelli;Angel hair|Capellini;Ziti;Bucatini;Orecchiette", "Cavatappi;Ditalini;Conchiglie|Shells;Manicotti;Trofie;Stelline;Gemelli;Mafaldine;Paccheri", "Campanelle;Garganelli;Casarecce;Radiatori;Anelli;Fregola;Pici;Culurgiones;Maltagliati"]),
    pack("space-travel", "FUTURE LAB", "Name a person who has traveled to space.", ["Neil Armstrong;Buzz Aldrin;Yuri Gagarin", "Sally Ride;John Glenn;Alan Shepard;Chris Hadfield;Mae Jemison;Valentina Tereshkova", "Michael Collins;Scott Kelly;Mark Kelly;Tim Peake;Sunita Williams|Suni Williams;Peggy Whitson;Jim Lovell;Gus Grissom;Pete Conrad", "Alexei Leonov;Guion Bluford;Eileen Collins;Kalpana Chawla;Helen Sharman;Yang Liwei;Liu Yang;Jessica Meir;Christina Koch;Victor Glover;Bob Behnken;Doug Hurley", "Samantha Cristoforetti;Wally Funk;Sian Proctor;Anousheh Ansari;Franklin Chang Diaz|Franklin Chang-Diaz;Leland Melvin;Harrison Schmitt;Charles Duke;Alan Bean;Edgar Mitchell"]),
    pack("biomes", "OUR PLANET", "Name a biome or natural habitat.", ["Forest;Desert;Ocean;Rainforest|Rain forest;Jungle", "Tundra;Grassland;Savanna|Savannah;Coral reef;Wetland;Swamp;Lake;River", "Taiga|Boreal forest;Mangrove;Marsh;Temperate forest;Prairie;Steppe;Estuary;Woodland;Pond;Alpine tundra", "Chaparral;Bog;Fen;Salt marsh;Kelp forest;Seagrass meadow;Cloud forest;Floodplain;Peatland;Mediterranean scrub", "Hydrothermal vent;Cold seep;Abyssal plain;Vernal pool;P\xE1ramo|Paramo;Fynbos;Caatinga;Cerrado;Montane forest"]),
    pack("robots", "FUTURE COUNSEL", "Name a fictional robot or AI.", ["R2-D2|R2D2;C-3PO|C3PO;WALL-E|Walle|Wall E;Terminator", "Optimus Prime;Bumblebee;Baymax;HAL 9000|HAL;Ultron;Vision;BB-8|BB8;EVE", "Data;Bender;GLaDOS|Glados;Iron Giant|The Iron Giant;Astro Boy|Astroboy;Megatron;Chappie;Sonny;Marvin;RoboCop", "TARS;CASE;K-2SO|K2SO;Chopper;IG-11|IG11;Johnny 5;Rosie;BMO;Gort;Dolores;Ava;JARVIS|J.A.R.V.I.S.", "HK-47|HK47;Kryten;Robby the Robot|Robby;KITT;EDI;Cortana;Legion;Wheatley;Fisto;R. Daneel Olivaw|Daneel Olivaw"]),
    pack("mammals", "WILD WORLD", "Name a mammal that lays eggs.", ["Platypus|Duck billed platypus", "Echidna", "Short beaked echidna|Short-beaked echidna", "Western long beaked echidna|Western long-beaked echidna;Eastern long beaked echidna|Eastern long-beaked echidna", "Sir David s long beaked echidna|Sir David\u2019s long-beaked echidna|Attenborough s long beaked echidna"]),
    pack("tools", "MAKER SPACE", "Name a hand tool.", ["Hammer;Screwdriver;Wrench|Spanner;Saw;Pliers", "Chisel;File;Clamp;Tape measure;Level|Spirit level;Allen key|Hex key;Scissors", "Mallet;Rasp;Hand plane|Plane;Hacksaw;Coping saw;Utility knife;Wire cutters;Bolt cutters;Crowbar|Pry bar;Trowel", "Awl;Bradawl;Spokeshave;Drawknife;Gouge;Marking gauge;Bevel gauge;Caliper|Calipers;Brace;Punch;Tap;Die", "Adze;Froe;Scorp;Card scraper;Nail set;Pin vise|Pin vice;Gimlet;Swage;Burnisher"]),
    pack("boardgames", "COUNCIL COMMONS", "Name a board game.", ["Monopoly;Chess;Scrabble;Clue|Cluedo;Checkers|Draughts", "Risk;Catan|Settlers of Catan;Ticket to Ride;Battleship;Sorry;Life|The Game of Life;Trivial Pursuit;Connect Four|Connect 4", "Pandemic;Carcassonne;Go;Backgammon;Othello|Reversi;Stratego;Codenames;Azul;Wingspan;Splendor;Guess Who", "Terraforming Mars;Root;Scythe;7 Wonders|Seven Wonders;Gloomhaven;Betrayal at House on the Hill;Power Grid;Agricola;Dominion;Everdell;Dixit", "Spirit Island;Brass Birmingham;Concordia;Hansa Teutonica;Tzolk in|Tzolkin;Cascadia;Quacks of Quedlinburg;The Castles of Burgundy;Viticulture"])
  ];
  PACKS.push(
    pack("crack-open", "LUNCH RECESS", "Name a food with a shell you remove before eating.", ["Egg;Peanut;Walnut;Pistachio;Crab;Lobster", "Coconut;Almond;Pecan;Hazelnut;Shrimp|Prawn;Oyster;Mussel;Clam", "Macadamia;Brazil nut;Chestnut;Scallop;Sunflower seed;Pumpkin seed;Crawfish|Crayfish", "Quail egg;Duck egg;Pine nut;Cockle;Whelk;Winkle;Edamame;Fava bean", "Ginkgo nut;Geoduck;Razor clam;Abalone;Periwinkle"]),
    pack("no-wheels", "THINK SIDEWAYS", "Name a vehicle that can travel without rolling on wheels.", ["Boat;Ship;Helicopter;Submarine;Canoe;Kayak", "Sailboat;Jet ski|Jetski;Hot air balloon;Sled|Sledge;Hovercraft;Airship|Blimp|Zeppelin", "Snowmobile;Gondola;Catamaran;Raft;Hydrofoil;Cable car;Rocket;Spacecraft;Spaceship", "Dogsled|Dog sled;Paraglider;Hang glider;Wingsuit;Bathyscaphe;Coracle;Felucca;Outrigger canoe", "Iceboat;Bathysphere;Dugout canoe;Autogyro|Gyroplane;Paramotor"]),
    pack("courtroom-objects", "FUTURE COUNSEL", "Name a physical object you might see in a courtroom.", ["Gavel;Chair;Desk;Table;Flag;Microphone", "Bible;Witness stand;Jury box;Bench;Clock;Document;Evidence;Podium;Pen;Computer", "Nameplate;Exhibit;Court seal;Transcript;Stenotype|Stenotype machine;Lectern;Water pitcher;Handcuffs;Briefcase;Legal pad", "Sound recorder;Evidence bag;Court reporter keyboard;Video monitor;Law book;Jury instruction;Docket sheet;Subpoena", "Document camera;Gavel block;Exhibit sticker;Privacy screen;Assistive listening device"]),
    pack("latin-law", "FUTURE COUNSEL", "Name a Latin term or phrase used in law.", ["Habeas corpus;Pro bono;Alibi;Versus|V", "Amicus curiae;Subpoena;Mens rea;Actus reus;Prima facie;Bona fide", "Stare decisis;De facto;De jure;Res ipsa loquitur;Modus operandi;Ad hoc;Ex parte;Per se;Ultra vires", "Certiorari;Mandamus;Res judicata;Nolo contendere;Sua sponte;In camera;Inter alia;Per curiam;Obiter dictum;Locus standi", "Nunc pro tunc;Mutatis mutandis;In pari delicto;Lex loci;Sine qua non;In limine;Caveat emptor;Corpus delicti"]),
    pack("ologies", "WORDPLAY", "Name a field of study ending in \u201Cology\u201D.", ["Biology;Psychology;Geology;Sociology", "Zoology;Ecology;Archaeology|Archeology;Anthropology;Criminology;Meteorology", "Neurology;Cardiology;Dermatology;Oncology;Paleontology;Theology;Toxicology;Virology;Immunology;Pathology", "Entomology;Ornithology;Herpetology;Mycology;Seismology;Volcanology;Epidemiology;Etymology;Phonology;Morphology;Cosmology;Radiology", "Bryology;Malacology;Dendrochronology;Odonatology;Limnology;Palynology;Speleology;Tribology;Glaciology"]),
    pack("coastal-states", "MAP THE CASE", "Name a US state with an Atlantic Ocean coastline.", ["Florida;New York;North Carolina;South Carolina", "New Jersey;Virginia;Georgia;Massachusetts", "Maine;Maryland;Delaware;Connecticut", "Rhode Island", "New Hampshire"]),
    pack("court-jobs", "FUTURE COUNSEL", "Name a role involved in a court case.", ["Judge;Lawyer|Attorney;Witness;Juror|Jury;Defendant;Plaintiff", "Prosecutor;Defense attorney|Defence attorney;Bailiff;Court reporter;Clerk;Expert witness", "Public defender;Paralegal;Interpreter;Magistrate;Appellant;Appellee;Petitioner;Respondent;Mediator", "Guardian ad litem;Special master;Amicus curiae;Process server;Court administrator;Victim advocate;Probation officer", "Pro se litigant;Receiver;Conservator;Solicitor general;Notary"]),
    pack("silent-first", "WORDPLAY", "Name an English word beginning with a silent letter.", ["Knife;Knee;Know;Write;Wrong;Hour;Honest", "Knight;Knock;Wrist;Wrestle;Gnome;Psychology", "Knot;Knuckle;Wrinkle;Wrench;Wreck;Honour|Honor;Heir;Herb;Psalm;Pneumonia", "Mnemonic;Pterodactyl;Pseudonym;Psychic;Gnat;Gnaw;Wreath;Wry;Rheumatism", "Ptarmigan;Pneumatic;Cnidarian;Pteranodon;Gnomic;Knurl"])
  );
  var clever = { planets: "Uranus", elements: "Einsteinium", ocean: "Anglerfish", languages: "Rust", renewables: "Tidal", school: "Latin", fruit: "Durian", countries: "Liechtenstein", africa: "Madagascar", sports: "Croquet", instruments: "Theremin", moons: "Phobos", trees: "Baobab", birds: "Kiwi", shapes: "Dodecagon", "us-states": "Wyoming", transport: "Unicycle", inventions: "Cotton gin", flowers: "Corpse flower", pasta: "Orzo", robots: "GLaDOS", tools: "Spokeshave", boardgames: "Go", "legal-words": "Habeas corpus", "landmark-cases": "Korematsu v. United States" };
  for (const p of PACKS) {
    const a = p.answers.find((a2) => a2.label === clever[p.id]);
    if (a && a.points !== 100) a.points = 30;
  }
  PACKS.push(AIRLINE_PACK);
  PACKS[PACKS.findIndex((p) => p.id === "no-wheels")] = VEHICLE_PACK;

  // engine.js
  var normalize = (value) => String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9+#]/g, "");
  function hash(text) {
    let n = 2166136261;
    for (const c of text) {
      n ^= c.charCodeAt(0);
      n = Math.imul(n, 16777619);
    }
    return n >>> 0;
  }
  function random(seed) {
    return () => {
      seed += 1831565813;
      let t = seed;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function shuffle(items, rng = Math.random) {
    const a = [...items];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function dateKey(date = /* @__PURE__ */ new Date()) {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
    return ["year", "month", "day"].map((k) => parts.find((p) => p.type === k).value).join("-");
  }
  function dailyPacks(day = dateKey()) {
    return shuffle(PACKS, random(hash("councillion-v1:" + day))).slice(0, 7);
  }
  function tier(points) {
    return points >= 100 ? { name: "KRILLION", icon: "\u2726", color: "rarity-krillion" } : points >= 85 ? { name: "DEEP CUT", icon: "\u25C6", color: "rarity-deepcut" } : points >= 60 ? { name: "RARE", icon: "\u2727", color: "rarity-rare" } : points >= 30 ? { name: "SCHOOLER", icon: "\u25C8", color: "rarity-schooler" } : points > 0 ? { name: "PLANKTON", icon: "\xB7", color: "rarity-plankton" } : { name: "NO ECHO", icon: "\xD7", color: "muted" };
  }
  function oneEdit(a, b) {
    if (a.length === b.length) {
      const bad = [];
      for (let k = 0; k < a.length; k++) if (a[k] !== b[k]) bad.push(k);
      if (bad.length === 2 && bad[1] === bad[0] + 1 && a[bad[0]] === b[bad[1]] && a[bad[1]] === b[bad[0]]) return true;
    }
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0, j = 0, e = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) {
        i++;
        j++;
      } else {
        if (++e > 1) return false;
        if (a.length >= b.length) i++;
        if (b.length >= a.length) j++;
      }
    }
    return e + (i < a.length || j < b.length ? 1 : 0) <= 1;
  }
  var compiledBanks = /* @__PURE__ */ new WeakMap();
  function compileBank(pack2) {
    let cached = compiledBanks.get(pack2);
    if (cached) return cached;
    const exact = /* @__PURE__ */ new Map(), byLength = /* @__PURE__ */ new Map();
    for (const answer of pack2.answers) {
      for (const key of new Set([answer.label, ...answer.aliases].map(normalize))) {
        if (!exact.has(key)) exact.set(key, answer);
        if (!byLength.has(key.length)) byLength.set(key.length, []);
        byLength.get(key.length).push({ key, answer });
      }
    }
    cached = { exact, byLength };
    compiledBanks.set(pack2, cached);
    return cached;
  }
  function matchAnswer(pack2, input) {
    const query = normalize(input);
    if (!query) return null;
    const bank = compileBank(pack2), exact = bank.exact.get(query);
    if (exact) return { ...exact, corrected: false };
    if (query.length < 5) return null;
    const near = /* @__PURE__ */ new Map();
    for (const length of [query.length - 1, query.length, query.length + 1]) {
      for (const entry of bank.byLength.get(length) ?? []) {
        if (entry.key.length >= 5 && oneEdit(entry.key, query)) near.set(entry.answer.label, entry.answer);
      }
    }
    return near.size === 1 ? { ...[...near.values()][0], corrected: true } : null;
  }
  function newParty(players, rng = Math.random) {
    return { phase: "lobby", players: players.map((p) => ({ ...p, hearts: 2, meter: 0, score: 0, connected: true })), turn: 0, round: 0, packIds: shuffle(PACKS.filter((p) => p.answers.length >= 18), rng).map((p) => p.id), used: [], log: [], settings: { lives: 2, maxLives: 5, meterTarget: 600, minTurnMs: 8e3, fuseMinMs: 1e4, fuseMaxMs: 3e4, maxPlayers: 6 }, notice: "The court is assembling.", deadline: 0, startedAt: 0, revision: 0 };
  }
  var partyPack = (s) => PACKS.find((p) => p.id === s.packIds[(Math.max(s.round, 1) - 1) % s.packIds.length]);
  function alive(s) {
    return s.players.filter((p) => p.connected && p.hearts > 0);
  }
  function nextTurn(s) {
    for (let n = 1; n <= s.players.length; n++) {
      const i = (s.turn + n) % s.players.length;
      if (s.players[i].connected && s.players[i].hearts > 0) {
        s.turn = i;
        return;
      }
    }
  }
  function victory(s) {
    if (alive(s).length <= 1) {
      s.phase = "ended";
      s.deadline = 0;
      s.winner = alive(s)[0]?.id ?? null;
      s.notice = alive(s)[0] ? `${alive(s)[0].name} wins the verdict!` : "The room is empty.";
      return true;
    }
    return false;
  }
  function startParty(s, now = Date.now(), rng = Math.random) {
    if (alive(s).length < 2) return false;
    s.phase = "playing";
    s.round = 1;
    s.turn = s.players.findIndex((p) => p.connected && p.hearts > 0);
    s.deadline = now + Math.floor(s.settings.fuseMinMs + rng() * (s.settings.fuseMaxMs - s.settings.fuseMinMs));
    s.startedAt = now;
    s.notice = "Court is in session. Pass the puffer!";
    s.revision++;
    return true;
  }
  function answerParty(s, id, text, now = Date.now()) {
    if (s.phase !== "playing" || s.players[s.turn]?.id !== id) return { error: "Wait for your turn." };
    if (now >= s.deadline) return { error: "The puffer already popped!" };
    const answer = matchAnswer(partyPack(s), String(text).slice(0, 256));
    if (!answer) return { error: "Not in this answer bank. Try another answer." };
    if (s.used.includes(normalize(answer.label))) return { error: "Already on the record. Try a different answer." };
    const player = s.players[s.turn];
    s.used.push(normalize(answer.label));
    player.score += answer.points;
    player.meter += answer.points;
    let bonus = "";
    if (player.meter >= s.settings.meterTarget) {
      player.meter -= s.settings.meterTarget;
      if (player.hearts < s.settings.maxLives) {
        player.hearts++;
        bonus = " +1 heart";
      }
    }
    s.log.unshift({ name: player.name, answer: answer.label, points: answer.points });
    s.log = s.log.slice(0, 6);
    s.notice = `${player.name}: ${answer.label} (+${answer.points})${bonus}`;
    nextTurn(s);
    s.deadline = Math.max(s.deadline, now + s.settings.minTurnMs);
    if (s.used.length >= partyPack(s).answers.length) {
      s.phase = "burst";
      s.nextAt = now + 2500;
      s.notice = "Every answer found! A new case is coming.";
    }
    s.revision++;
    return { answer };
  }
  function tickParty(s, now = Date.now(), rng = Math.random) {
    if (s.phase === "playing" && now >= s.deadline) {
      const p = s.players[s.turn];
      p.hearts = Math.max(0, p.hearts - 1);
      s.notice = `POP! ${p.name} ${p.hearts ? "lost a heart." : "is out of the case."}`;
      s.phase = "burst";
      s.nextAt = now + 3e3;
      s.revision++;
      if (!victory(s)) nextTurn(s);
      return true;
    }
    if (s.phase === "burst" && now >= s.nextAt) {
      if (victory(s)) return true;
      s.round++;
      s.used = [];
      s.phase = "playing";
      s.deadline = now + Math.floor(s.settings.fuseMinMs + rng() * (s.settings.fuseMaxMs - s.settings.fuseMinMs));
      s.startedAt = now;
      s.notice = "New case. New answers. Same puffer.";
      s.revision++;
      return true;
    }
    return false;
  }
  function disconnectPlayer(s, id) {
    const p = s.players.find((p2) => p2.id === id);
    if (!p) return;
    p.connected = false;
    p.hearts = 0;
    if (s.phase === "lobby") s.players = s.players.filter((p2) => p2.id !== id);
    else if (!victory(s) && s.players[s.turn]?.id === id) nextTurn(s);
    s.notice = `${p.name} left the room.`;
    s.revision++;
  }

  // answer-bank.js
  var esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  function mountBank(root, pack2, chosen = "") {
    const sorted = [...pack2.answers].sort((a, b) => b.points - a.points || a.label.localeCompare(b.label));
    root.innerHTML = `<div class="bank-filters" aria-label="Filter by rarity"><button class="bank-filter selected" data-tier="all">All <small>${pack2.answers.length.toLocaleString()}</small></button>${[100, 85, 60, 30, 10].map((p) => `<button class="bank-filter ${tier(p).color}" data-tier="${p}">${tier(p).name} <small>${pack2.answers.filter((a) => a.points === p).length.toLocaleString()}</small></button>`).join("")}</div><label class="bank-search-label"><span aria-hidden="true">\u2315</span><input class="bank-search" type="search" aria-label="Search accepted answers" placeholder="Search ${pack2.answers.length.toLocaleString()} answers\u2026" autocomplete="off"></label><div class="bank-list" tabindex="0" aria-label="Accepted answers"></div><button class="text-button bank-more">SHOW 100 MORE \u2193</button><p class="bank-count fine-print"></p>`;
    let selected = "all", limit = 100;
    const list = root.querySelector(".bank-list"), search = root.querySelector("input");
    const render = () => {
      const q = search.value.trim().toLowerCase();
      const matches = sorted.filter((a) => (selected === "all" || a.points === Number(selected)) && a.label.toLowerCase().includes(q));
      const shown = matches.slice(0, limit);
      list.innerHTML = shown.map((a) => `<div class="bank-row ${tier(a.points).color}"><span class="bank-creature">${tierSprite(a.points)}</span><span class="bank-answer">${esc(a.label)}${chosen === a.label ? "<em>YOU</em>" : ""}${a.quip ? `<small>${esc(a.quip)}</small>` : ""}</span><strong>+${a.points}</strong></div>`).join("") || '<p class="bank-empty">No answers found.</p>';
      root.querySelector(".bank-count").textContent = shown.length.toLocaleString() + " of " + matches.length.toLocaleString() + " answers";
      root.querySelector(".bank-more").hidden = shown.length >= matches.length;
    };
    search.oninput = () => {
      limit = 100;
      list.scrollTop = 0;
      render();
    };
    root.querySelector(".bank-more").onclick = () => {
      limit += 100;
      render();
    };
    for (const b of root.querySelectorAll(".bank-filter")) b.onclick = () => {
      selected = b.dataset.tier;
      limit = 100;
      list.scrollTop = 0;
      for (const btn of root.querySelectorAll(".bank-filter")) {
        const on = btn === b;
        btn.classList.toggle("selected", on);
        btn.setAttribute("aria-pressed", String(on));
      }
      render();
    };
    render();
  }

  // benchmark.js
  var BENCHMARK_MODEL = Object.freeze({
    version: "challenge-v2",
    questions: 7,
    points: Object.freeze([0, 10, 30, 60, 85, 100]),
    profiles: Object.freeze([
      Object.freeze({ name: "casual", weight: 0.2, probabilities: Object.freeze([0.08, 0.25, 0.32, 0.23, 0.1, 0.02]) }),
      Object.freeze({ name: "regular", weight: 0.55, probabilities: Object.freeze([0.05, 0.14, 0.24, 0.3, 0.2, 0.07]) }),
      Object.freeze({ name: "experienced", weight: 0.25, probabilities: Object.freeze([0.02, 0.07, 0.18, 0.32, 0.28, 0.13]) })
    ])
  });
  function scoreDistribution(model = BENCHMARK_MODEL) {
    const max = model.questions * Math.max(...model.points), mixture = Array(max + 1).fill(0);
    for (const profile2 of model.profiles) {
      let mass = [1];
      for (let round = 0; round < model.questions; round++) {
        const next = Array((round + 1) * Math.max(...model.points) + 1).fill(0);
        mass.forEach((prob, score) => {
          if (prob === 0) return;
          model.points.forEach((points, i) => {
            next[score + points] += prob * profile2.probabilities[i];
          });
        });
        mass = next;
      }
      mass.forEach((p, score) => {
        mixture[score] += p * profile2.weight;
      });
    }
    const sum = mixture.reduce((a, b) => a + b, 0);
    return mixture.map((p) => p / sum);
  }
  var SCORE_DISTRIBUTION = Object.freeze(scoreDistribution());
  function estimatedPercentile(score) {
    const value = Number(score);
    if (!Number.isFinite(value)) return 0;
    let below = 0;
    for (let s = 0; s < SCORE_DISTRIBUTION.length && s < value; s++) below += SCORE_DISTRIBUTION[s];
    return Math.max(0, Math.min(100, below * 100));
  }
  function percentileText(percent) {
    if (percent >= 99.95) return "99.9%+";
    if (percent > 0 && percent < 0.05) return "<0.1%";
    if (percent < 1 || percent >= 99) return percent.toFixed(1) + "%";
    return Math.round(percent) + "%";
  }
  var MODEL_MEAN = SCORE_DISTRIBUTION.reduce((n, p, s) => n + p * s, 0);
  function densityAt(x) {
    let density = 0;
    for (let s = Math.max(0, Math.floor(x - 36)); s <= Math.min(700, Math.ceil(x + 36)); s++) density += SCORE_DISTRIBUTION[s] * Math.exp(-0.5 * ((s - x) / 12) ** 2);
    return density;
  }
  var densities = Array.from({ length: 141 }, (_, i) => densityAt(i * 5));
  var peak = Math.max(...densities);
  function renderBellCurve(score) {
    const value = Math.max(0, Math.min(700, Number(score) || 0)), percent = estimatedPercentile(value), base = 145, height = 131;
    const y = (x) => base - densityAt(x) / peak * height;
    const path = densities.map((d, i) => (i ? "L" : "M") + i * 5 + "," + (base - d / peak * height).toFixed(2)).join(" "), fill = path + " L700,145 L0,145 Z";
    const marker = Math.max(2, Math.min(698, value));
    return `<section class="result-benchmark" aria-label="Estimated score comparison"><div class="benchmark-heading"><span>ESTIMATED CHALLENGE CURVE</span><span>0\u2013700 POINTS</span></div><div class="bell-chart"><svg viewBox="0 0 700 157" preserveAspectRatio="none" role="img" aria-label="Modeled seven-question score distribution. Your score is ${value}. Estimated percentage of scores below yours: ${percentileText(percent)}."><defs><clipPath id="below-your-score"><rect x="0" y="0" width="${value}" height="157"/></clipPath></defs><path class="bell-area" d="${fill}"/><path class="bell-below" d="${fill}" clip-path="url(#below-your-score)"/><path class="bell-line" d="${path}"/><path class="bell-axis" d="M0 145H700"/><path class="bell-player-line" d="M${marker} ${Math.max(7, y(value) - 10).toFixed(2)}V145"/><circle class="bell-player-dot" cx="${marker}" cy="${y(value).toFixed(2)}" r="3.6"/></svg><span class="bell-you" style="left:${Math.max(2, Math.min(98, value / 7))}%">YOU</span><div class="bell-tooltip" hidden></div></div><div class="bell-scale">${Array.from({ length: 8 }, (_, i) => `<span>${i * 100}</span>`).join("")}</div><p class="benchmark-verdict">BETTER THAN AN ESTIMATED <strong>${percentileText(percent)}</strong></p><details class="benchmark-method"><summary>Estimated from a scoring model \xB7 how it works</summary><p>No live player results have been collected. This model mixes casual, regular, and experienced players (20%, 55%, 25%) across seven questions. This harder benchmark assumes more consistent correct answers and more Rare and Deep Cut finds. The modeled average is about ${Math.round(MODEL_MEAN)} points. \u201CBetter than\u201D counts lower scores and excludes ties. These estimates are not calibrated to actual players or individual prompt difficulty.</p></details></section>`;
  }
  function mountBellCurve(root) {
    const chart = root.querySelector(".bell-chart");
    if (!chart) return;
    const tooltip = chart.querySelector(".bell-tooltip");
    chart.addEventListener("pointermove", (e) => {
      const box = chart.getBoundingClientRect(), fraction = Math.max(0, Math.min(1, (e.clientX - box.left) / box.width)), score = Math.round(fraction * 140) * 5;
      tooltip.hidden = false;
      tooltip.textContent = score + " points \xB7 beats ~" + percentileText(estimatedPercentile(score));
      tooltip.style.left = Math.max(20, Math.min(80, fraction * 100)) + "%";
    });
    chart.addEventListener("pointerleave", () => {
      tooltip.hidden = true;
    });
  }

  // results.js
  var esc2 = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  function renderResults(app2, quiz2, packs) {
    const score = quiz2.results.reduce((n, r) => n + r.points, 0), rank = score >= 450 ? 100 : score >= 351 ? 85 : score >= 251 ? 60 : score >= 151 ? 30 : 10, t = tier(rank);
    const bands = [{ p: 10, lo: 0, hi: 150 }, { p: 30, lo: 151, hi: 250 }, { p: 60, lo: 251, hi: 350 }, { p: 85, lo: 351, hi: 449 }, { p: 100, lo: 450, hi: 700 }];
    app2.innerHTML = `<section class="results-page"><div class="results-masthead"><a href="#home" class="results-brand">COUNCILLION</a><span>${quiz2.mode === "daily" ? "DAILY DIVE \xB7 " + esc2(quiz2.day) : "UNLIMITED DIVE"}<br>COMPLETE</span></div><div class="results-headline"><div class="results-total"><strong>${score}</strong><span>/700</span><span class="results-metres">\u2212${(score * 10).toLocaleString()}m</span></div><div class="results-rank ${t.color}">${tierSprite(rank)}<span>${t.name}<small>YOUR VERDICT</small></span></div></div>${renderBellCurve(score)}<section class="dive-log"><div class="log-heading"><h2>DIVE LOG</h2><span>DEEPER = RARER</span></div><div class="log-chart"><div class="log-axis"><span>0m</span><span>250m</span><span>500m</span><span>750m</span><span>1,000m</span></div><div class="log-columns">${quiz2.results.map((r, i) => `<button class="log-column ${tier(r.points).color}" data-action="bank" data-pack="${r.packId}" aria-label="Question ${i + 1}: ${esc2(r.label)}, ${r.points} points. Explore answers."><span class="log-thread" style="height:${r.points}%"></span><span class="log-dot" style="top:${r.points}%">${r.points ? tierSprite(r.points) : "<i></i>"}</span><span class="log-round">${i + 1}</span></button>`).join("")}</div></div></section><div class="results-share"><button class="pixel-button primary" data-action="share">COPY RESULT \u2197</button><p>Seven answers. One descent.<br>Make your case to your friends.</p></div><section class="score-guide"><h2>THE DEPTH OF YOUR CASE</h2>${bands.map((b) => `<div class="score-guide-row ${tier(b.p).color} ${rank === b.p ? "your-band" : ""}">${tierSprite(b.p)}<span>${tier(b.p).name}</span><small>${b.lo}\u2013${b.hi}</small>${rank === b.p ? "<em>YOU</em>" : "<em></em>"}</div>`).join("")}</section><section class="the-catch"><div class="catch-heading"><h2>THE CATCH</h2><p>Every prompt. Every accepted answer.</p></div>${quiz2.results.map((r, i) => {
      const pack2 = packs.find((p) => p.id === r.packId);
      return `<details class="catch-round"><summary><span class="catch-number">${i + 1}</span><span class="catch-copy"><small>${esc2(pack2.prompt)}</small><strong class="${tier(r.points).color}">${tierSprite(r.points)}${esc2(r.label)}</strong></span><span class="catch-points ${tier(r.points).color}">${r.points}</span><span class="catch-toggle">+</span></summary><div class="catch-bank" data-pack="${r.packId}" data-chosen="${esc2(r.label)}"></div></details>`;
    }).join("")}</section><div class="results-next"><button class="pixel-button" data-action="practice">\u221E ANOTHER DIVE</button><button class="pixel-button" data-action="party">PUFFER PARTY \u25B8</button></div><a class="surface-link" href="#home">\u2191 BACK TO THE SURFACE</a><p class="results-reset">${quiz2.mode === "daily" ? "Next Daily Dive at midnight New York time." : "Practice scores do not change your daily result."}</p></section>`;
    mountBellCurve(app2);
    for (const details of app2.querySelectorAll(".catch-round")) details.addEventListener("toggle", () => {
      if (!details.open) return;
      const bank = details.querySelector(".catch-bank");
      if (bank.dataset.mounted) return;
      bank.dataset.mounted = "true";
      mountBank(bank, packs.find((p) => p.id === bank.dataset.pack), bank.dataset.chosen);
    });
  }

  // dive.js
  var esc3 = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  function renderDive(app2, quiz2, pack2, score) {
    const result = quiz2.results.at(-1), isResult = ["result", "sinking"].includes(quiz2.stage), t = tier(result?.points ?? 0);
    const depth = score * 10;
    const sceneDepth = isResult ? depth : depth;
    app2.innerHTML = `<section class="dive-screen" aria-label="Underwater trivia"><div class="dive-hud"><div class="hud-badge depth-badge"><small>DEPTH</small><strong id="dive-depth">${depth.toLocaleString()}m</strong></div><div class="dive-progress"><div class="dive-squares">${quiz2.ids.map((_, i) => `<span class="dive-square ${i < quiz2.results.length ? "completed " + tier(quiz2.results[i].points).color : i === quiz2.round ? "current" : ""}"></span>`).join("")}</div><small>PROMPT ${quiz2.round + 1} OF 7</small></div><div class="hud-badge score-badge"><small>SCORE</small><strong>${score}</strong></div></div><div class="biome-caption"><span class="biome-line"></span><span id="current-biome">SUNLIT WATERS</span></div><div class="depth-ruler" aria-hidden="true">${Array.from({ length: 11 }, (_, i) => `<span style="top:${i * 10}%">${Math.floor(depth / 100) * 100 + i * 50}m</span>`).join("")}</div><div class="dive-buddy" aria-hidden="true"><img src="assets/counsel-krill.svg" alt=""></div>${isResult ? `<section class="dive-verdict ${quiz2.stage === "sinking" ? "sinking" : ""}" aria-live="polite"><div class="verdict-creature ${t.color}">${result?.points ? tierSprite(result.points) : tierSprite(0)}</div><h1 class="${t.color}">${t.name}</h1><p class="verdict-answer">\u201C${esc3(result.label)}\u201D</p><p class="verdict-score">+${result.points} PTS \xB7 sink ${result.points * 10}m</p><p class="verdict-comment">${result.quip ? esc3(result.quip) : result.points >= 100 ? "An extraordinary find. Case closed." : result.points >= 85 ? "A precedent few would think of." : result.points >= 60 ? "A rare answer, well argued." : result.points >= 30 ? "A solid answer for the record." : result.points ? "A familiar answer. Still a valid case." : result.reason === "timeout" ? "The clock reached its verdict." : result.reason === "skip" ? "A new case awaits below." : "That answer isn\u2019t in this curated bank."}</p>${result.corrected ? `<p class="fine-print">Accepted for \u201C${esc3(result.input)}\u201D</p>` : ""}</section><div class="dive-controls result-controls"><button class="pixel-button primary" data-action="next">${quiz2.round === 6 ? "SURFACE" : "DESCEND"} ${quiz2.round === 6 ? "\u25B2" : "\u25BC"}</button><span class="continue-hint">ENTER TO CONTINUE</span></div>` : `<section class="floating-prompt"><p class="prompt-number">PROMPT ${quiz2.round + 1} OF 7 <span>${esc3(pack2.topic)}</span></p><h1>${esc3(pack2.prompt)}</h1><p class="prompt-hint">\u25BC rarer answers sink deeper \u25BC</p></section><div class="dive-controls ${quiz2.stage === "intro" ? "entering" : ""}"><div class="intro-message" id="intro-message">descending \xB7 the clock starts in 2</div><form id="answer-form" class="dive-answer-form"><div class="timer-orb" id="timer-orb"><span id="quiz-timer" role="timer" aria-label="Seconds remaining">25</span></div><div class="dive-input-wrap"><label class="sr-only" for="answer">Your answer</label><input id="answer" name="answer" placeholder="type one answer\u2026" maxlength="256" autocomplete="off" autocapitalize="off" spellcheck="false" required><div class="dive-time-bar"><span id="quiz-timer-fill"></span></div></div><button class="pixel-button dive-submit" id="dive-submit" type="submit" disabled>DIVE</button></form><div class="dive-under-controls"><button class="text-button" data-action="skip">SKIP \u25B8</button><span>FUTURE COUNSEL \xB7 THINK DEEPER</span><button class="text-button" data-action="help">? RULES</button></div></div>`}</section>`;
    return sceneDepth;
  }

  // party.js
  var PREFIX = "councillion-v1-";
  var cleanName = (name) => String(name ?? "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, 16) || "Counsel";
  var PartySession = class {
    constructor(onState, onError) {
      this.onState = onState;
      this.onError = onError;
      this.connections = /* @__PURE__ */ new Map();
      this.host = false;
      this.local = false;
      this.state = null;
      this.closed = false;
      this.offset = 0;
      this.timer = setInterval(() => this.tick(), 200);
    }
    snapshot() {
      if (!this.state) return;
      this.onState(this.state, this);
    }
    fail(text) {
      if (!this.closed) this.onError(text);
    }
    async openPeer(id) {
      if (!window.Peer) throw Error("The connection library could not load. Refresh and try again.");
      return new Promise((resolve, reject) => {
        const peer = new window.Peer(id, { debug: 0 });
        this.peer = peer;
        const timeout = setTimeout(() => {
          peer.destroy();
          reject(Error("Connection timed out. Try again, or play on one device."));
        }, 15e3);
        peer.on("open", () => {
          clearTimeout(timeout);
          resolve(peer);
        });
        peer.on("error", (err) => {
          clearTimeout(timeout);
          const message = err.type === "peer-unavailable" ? "Room not found. Check the code and make sure the host\u2019s tab is open." : err.type === "unavailable-id" ? "That room code is in use. Please host again." : "Could not connect. This network may block multiplayer connections. Try one-device mode.";
          reject(Error(message));
          if (this.state) this.fail(message);
        });
        peer.on("disconnected", () => {
          if (!this.closed) this.fail("Room signaling disconnected. Existing players can keep playing; new players may need a new room.");
        });
      });
    }
    async create(name) {
      this.host = true;
      this.code = Array.from(crypto.getRandomValues(new Uint8Array(4)), (x) => "ABCDEFGHJKLMNPQRSTUVWXYZ"[x % 24]).join("");
      this.myId = PREFIX + this.code;
      this.state = newParty([{ id: this.myId, name: cleanName(name) }]);
      const peer = await this.openPeer(this.myId);
      peer.on("connection", (conn) => this.accept(conn));
      this.snapshot();
    }
    async join(name, code) {
      this.code = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (this.code.length !== 4) throw Error("Enter the four-letter room code.");
      const peer = await this.openPeer();
      this.myId = peer.id;
      return new Promise((resolve, reject) => {
        const conn = peer.connect(PREFIX + this.code, { reliable: true, serialization: "json" });
        this.hostConn = conn;
        const timeout = setTimeout(() => {
          conn.close();
          reject(Error("The room did not answer. Keep the host\u2019s tab open, or try one-device mode."));
        }, 15e3);
        conn.on("open", () => conn.send({ type: "hello", name: cleanName(name), version: 1 }));
        conn.on("data", (msg) => {
          if (msg?.type === "reject") {
            clearTimeout(timeout);
            reject(Error(msg.message));
            this.fail(msg.message);
            conn.close();
            return;
          }
          if (msg?.type === "state" && msg.state) {
            clearTimeout(timeout);
            this.state = msg.state;
            this.offset = msg.now - Date.now();
            this.snapshot();
            resolve();
          }
          if (msg?.type === "error") this.fail(msg.message);
        });
        conn.on("close", () => {
          clearTimeout(timeout);
          if (!this.closed) {
            reject(Error("The host closed the room."));
            this.fail("The host closed the room. Return to Puffer Party to create a new one.");
            this.close(false);
          }
        });
        conn.on("error", () => {
          clearTimeout(timeout);
          reject(Error("Could not reach the host."));
        });
      });
    }
    accept(conn) {
      let admitted = false;
      const helloTimeout = setTimeout(() => {
        if (!admitted) conn.close();
      }, 8e3);
      conn.on("data", (msg) => {
        if (!msg || typeof msg !== "object") return;
        if (msg.type === "hello" && !admitted) {
          clearTimeout(helloTimeout);
          if (msg.version !== 1 || this.state.phase !== "lobby" || this.state.players.length >= this.state.settings.maxPlayers) {
            conn.send({ type: "reject", message: this.state.phase !== "lobby" ? "This game already started. Ask the host for a rematch." : "Room full or game version mismatch." });
            setTimeout(() => conn.close(), 500);
            return;
          }
          admitted = true;
          this.connections.set(conn.peer, conn);
          this.state.players.push({ id: conn.peer, name: cleanName(msg.name), hearts: this.state.settings.lives, meter: 0, score: 0, connected: true });
          this.state.revision++;
          this.broadcast();
        } else if (admitted && msg.type === "answer") {
          const result = answerParty(this.state, conn.peer, msg.text);
          if (result.error) conn.send({ type: "error", message: result.error });
          else this.broadcast();
        }
      });
      conn.on("close", () => {
        clearTimeout(helloTimeout);
        if (admitted && !this.closed) {
          this.connections.delete(conn.peer);
          disconnectPlayer(this.state, conn.peer);
          this.broadcast();
        }
      });
      conn.on("error", () => conn.close());
    }
    createLocal(names) {
      this.local = true;
      this.host = true;
      this.code = "LOCAL";
      this.myId = "local-0";
      this.state = newParty(names.map((name, i) => ({ id: "local-" + i, name: cleanName(name) })));
      this.snapshot();
    }
    broadcast() {
      const msg = { type: "state", state: this.state, now: Date.now() };
      for (const conn of this.connections.values()) if (conn.open) conn.send(msg);
      this.snapshot();
    }
    start() {
      if (!this.host) return;
      if (this.state.phase === "ended") {
        const config = this.state.settings;
        this.state = newParty(this.state.players.filter((p) => p.connected));
        this.state.settings = config;
        this.state.players.forEach((p) => p.hearts = config.lives);
      }
      if (!startParty(this.state)) return this.fail("You need at least two players.");
      this.broadcast();
    }
    submit(text) {
      if (this.closed) return;
      if (this.host) {
        const id = this.local ? this.state.players[this.state.turn].id : this.myId;
        const result = answerParty(this.state, id, text);
        if (result.error) this.fail(result.error);
        else this.broadcast();
      } else if (this.hostConn?.open) this.hostConn.send({ type: "answer", text: String(text).slice(0, 256) });
    }
    tick() {
      if (this.closed || !this.host || !this.state) return;
      if (tickParty(this.state)) this.broadcast();
    }
    close(clear = true) {
      this.closed = true;
      clearInterval(this.timer);
      for (const conn of this.connections.values()) conn.close();
      this.hostConn?.close();
      this.peer?.destroy();
      if (clear) this.state = null;
    }
  };

  // app.js
  var $ = (s) => document.querySelector(s);
  var app = $("#app");
  var ocean = new Ocean($("#world"));
  function screen(value) {
    document.body.dataset.screen = value;
    ocean.set(value === "dive" ? "dive" : value === "party" ? "party" : "home", value === "dive" && quiz ? total() * 10 : 0);
  }
  var esc4 = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  var read = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem("fc:" + key)) ?? fallback;
    } catch {
      return fallback;
    }
  };
  var save = (key, value) => {
    try {
      localStorage.setItem("fc:" + key, JSON.stringify(value));
    } catch {
      toast("Storage is unavailable. Keep this tab open to save your progress.");
    }
  };
  var settings = read("settings", { sound: false, scanlines: true, motion: true, answerCorrections: true, clearRejected: false });
  var profile = read("profile", { name: "", streak: 0, lastDay: null, best: 0 });
  var quiz = null;
  var party = null;
  var lastPartyTurn = null;
  var audio = null;
  var route = "home";
  var toastTimer;
  var tourPlaying = false;
  var tourPrevious = 0;
  var restorePracticeOnLoad = true;
  var quizSaveTimer;
  var puffer = (extra = "") => `<img class="puffer ${extra}" src="assets/puffer.svg" alt="Pufferfish counsel mascot">`;
  var button = (action2, text, cls = "") => `<button class="pixel-button ${cls}" data-action="${action2}">${text}</button>`;
  var back = () => '<a class="back" href="#home">\u25C2 SURFACE</a>';
  function toast(message) {
    $("#toast").textContent = message;
    $("#toast").classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 4500);
  }
  function beep(frequency = 440, duration = 0.09) {
    if (!settings.sound) return;
    try {
      audio ??= new (window.AudioContext || window.webkitAudioContext)();
      audio.resume();
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = "square";
      o.frequency.value = frequency;
      g.gain.setValueAtTime(0.035, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(1e-3, audio.currentTime + duration);
      o.connect(g);
      g.connect(audio.destination);
      o.start();
      o.stop(audio.currentTime + duration);
    } catch {
    }
  }
  function applySettings() {
    ocean.reduced = !settings.motion || matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.body.classList.toggle("clean", !settings.scanlines);
    document.body.classList.toggle("reduced", !settings.motion);
    const buddy = $(".dive-buddy img");
    if (buddy) buddy.src = ocean.reduced ? "assets/counsel-krill-still.svg" : "assets/counsel-krill.svg";
    $("#sound-button").textContent = settings.sound ? "\u266B" : "\u266A";
    $("#sound-button").setAttribute("aria-label", settings.sound ? "Turn sound off" : "Turn sound on");
  }
  function modal(content) {
    $("#modal-content").innerHTML = content;
    $("#modal").showModal();
  }
  function howTo() {
    modal(`<div class="eyebrow">FUTURE COUNSEL FIELD GUIDE</div><h2>HOW TO DIVE</h2><ol><li>Seven prompts. You have <span class="gold">25 seconds</span> to name one answer for each.</li><li>Find a less obvious answer. Curated rarity tiers award <span class="gold">10\u2013100 points</span>. Every point takes you 10 metres deeper. Rejected answers can be retried while the timer runs; any text left at zero is submitted automatically.</li><li>Everyone gets the same Daily Dive. A fresh set arrives at midnight in New York. Practice as often as you like.</li></ol><h3>PUFFER PARTY</h3><p>Host a room, share its code, and take turns naming answers. A valid answer passes the puffer. You cannot reuse an answer in the current round.</p><p>The shared fuse keeps burning between turns. If it pops on you, you lose a heart. Start with two hearts. Earn 600 rarity points to restore a heart, up to five. Each new turn gets at least eight seconds. Last counsel floating wins.</p><p class="muted">Original answer banks and editorial scores. Some valid answers may be missing. This is a Future Counsel fan game inspired by Krillion; it is not affiliated with Krillion.</p><a class="fc-link" href="https://futurecounsel.org/" target="_blank" rel="noopener">EXPLORE FUTURE COUNSEL \u2197</a>`);
  }
  function showSettings() {
    modal(`<div class="eyebrow">CONTROL ROOM</div><h2>SETTINGS</h2><label class="setting-row"><span>Sound effects<small>Little arcade bleeps.</small></span><input type="checkbox" data-setting="sound" ${settings.sound ? "checked" : ""}></label><label class="setting-row"><span>CRT scanlines<small>The old-school screen effect.</small></span><input type="checkbox" data-setting="scanlines" ${settings.scanlines ? "checked" : ""}></label><label class="setting-row"><span>Animations<small>Bobbing fish and gentle movement.</small></span><input type="checkbox" data-setting="motion" ${settings.motion ? "checked" : ""}></label><label class="setting-row"><span>Answer corrections<small>Confirm corrected spellings before scoring.</small></span><input type="checkbox" data-setting="answerCorrections" ${settings.answerCorrections !== false ? "checked" : ""}></label><label class="setting-row"><span>Clear rejected entries<small>Empty the input after an unrecognized answer.</small></span><input type="checkbox" data-setting="clearRejected" ${settings.clearRejected ? "checked" : ""}></label><p class="muted">Daily results and preferences are saved on this browser. Multiplayer uses direct connections between players; the host must keep their tab open.</p>`);
  }
  function home() {
    screen("home");
    const day = dateKey(), stored = read("daily:" + day, null), done = stored?.stage === "done";
    app.innerHTML = `<section class="hero"><p class="eyebrow">FUTURE COUNSEL PRESENTS</p><h1 class="brand-title">COUNCILLION</h1><p class="subtitle">THE DAILY DIVE</p><p class="hero-copy">Think of an answer no one else will.<br>Seven prompts. See how deep you go.</p></section><section class="home-panel"><div class="banner"><span>${esc4(day)} \xB7 DAILY DIVE</span><span id="reset-clock"></span></div>${button("daily", done ? "TODAY\u2019S VERDICT \u2197" : stored ? "CONTINUE DESCENT \u2193" : "BEGIN DESCENT \u2193", "primary")}<div class="home-play-options"><button class="pixel-button party-card" data-action="party">${puffer()}<span><strong>PUFFER PARTY</strong><small>Play with friends</small></span><span class="arrow">\u25B8</span></button><button class="pixel-button practice-card" data-action="practice"><span class="practice-icon">\u221E</span><span><strong>ENDLESS DIVE</strong><small>Play another seven</small></span></button></div><div class="sub-actions"><button class="text-button" data-action="help">? HOW TO PLAY</button><a class="text-button" href="#biomes">EXPLORE THE OCEAN \u2193</a></div><p class="fine-print"><a class="fc-link" href="https://futurecounsel.org/" target="_blank" rel="noopener">FUTURE COUNSEL</a> \xB7 ONE IN A COUNCILLION.</p></section>`;
    updateClock();
  }
  function showBank(id = quizPack()?.id) {
    if (quiz && quiz.stage !== "done" && ["daily", "practice"].includes(route)) return;
    const pack2 = PACKS.find((p) => p.id === id);
    if (!pack2) return;
    modal(`<div class="eyebrow">${esc4(pack2.topic)}</div><h2>THE ANSWER BANK</h2><p>${esc4(pack2.prompt)}</p><div id="bank-mount"></div>`);
    mountBank($("#bank-mount"), pack2, quiz?.results.find((r) => r.packId === id)?.label);
  }
  function updateClock() {
    const node = $("#reset-clock");
    if (!node) return;
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23" }).formatToParts(/* @__PURE__ */ new Date());
    const val = (k) => Number(parts.find((p) => p.type === k)?.value ?? 0);
    const secs = 86400 - val("hour") * 3600 - val("minute") * 60 - val("second");
    node.textContent = "NEXT SET " + [Math.floor(secs / 3600), Math.floor(secs / 60) % 60, secs % 60].map((n) => String(n).padStart(2, "0")).join(":");
  }
  function queueQuizSave() {
    clearTimeout(quizSaveTimer);
    quizSaveTimer = setTimeout(persistQuiz, 180);
  }
  function persistQuiz() {
    clearTimeout(quizSaveTimer);
    if (quiz?.mode === "daily") save("daily:" + quiz.day, quiz);
    else if (quiz?.mode === "practice" && ["localhost", "127.0.0.1"].includes(location.hostname)) {
      try {
        sessionStorage.setItem("fc:live-practice", JSON.stringify(quiz));
      } catch {
      }
    }
  }
  function startQuiz(mode) {
    let resumedLive = false;
    const day = dateKey();
    const chosen = new URLSearchParams(location.hash.split("?")[1] ?? "").get("pack");
    const featured = mode === "practice" ? PACKS.find((p) => p.id === chosen) : null;
    quiz = mode === "daily" ? read("daily:" + day, null) : null;
    if (mode === "practice" && restorePracticeOnLoad && ["localhost", "127.0.0.1"].includes(location.hostname)) {
      try {
        quiz = JSON.parse(sessionStorage.getItem("fc:live-practice"));
        if (featured && quiz?.ids[0] !== featured.id) quiz = null;
        resumedLive = !!quiz;
      } catch {
      }
    }
    restorePracticeOnLoad = false;
    if (!quiz || !Array.isArray(quiz.ids) || quiz.ids.some((id) => !PACKS.some((p) => p.id === id))) {
      quiz = { mode, day, ids: (mode === "daily" ? dailyPacks(day) : featured ? [featured, ...shuffle(PACKS.filter((p) => p.id !== featured.id)).slice(0, 6)] : shuffle(PACKS).slice(0, 7)).map((p) => p.id), round: 0, results: [], stage: "intro", readyAt: Date.now() + 3e3, deadline: Date.now() + 28e3 };
      persistQuiz();
    }
    if (resumedLive) {
      ocean.visualDepth = quiz.stage === "done" ? 0 : total() * 10;
      ocean.camera = quiz.stage === "done" ? 0 : ocean.h * 0.68 + ocean.visualDepth * 0.09;
    }
    if (quiz.pausedAt) delete quiz.pausedAt;
    route = mode;
    history.replaceState(null, "", "#" + mode + (featured ? "?pack=" + featured.id : ""));
    renderQuiz();
  }
  function quizPack() {
    return PACKS.find((p) => p.id === quiz.ids[quiz.round]);
  }
  function total() {
    return quiz.results.reduce((n, r) => n + r.points, 0);
  }
  function renderQuiz() {
    if (quiz.stage === "done") {
      summary();
      return;
    }
    screen("dive");
    const pack2 = quizPack();
    renderDive(app, quiz, pack2, total());
    applySettings();
    ocean.set("dive", total() * 10);
    if (quiz.stage === "sinking") ocean.celebrate();
    if (quiz.stage === "answer" || quiz.stage === "intro") {
      const form = $("#answer-form");
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        submitQuiz($("#answer").value);
      });
      const input = $("#answer");
      input.value = quiz.draft ?? "";
      input.addEventListener("input", () => {
        quiz.draft = input.value;
        quiz.correction = null;
        const msg = $("#quiz-rejection");
        if (msg) msg.remove();
        $("#dive-submit").disabled = !input.value.trim();
        queueQuizSave();
      });
      input.focus({ preventScroll: true });
      $("#dive-submit").disabled = !input.value.trim();
      updateTimer();
    }
  }
  function activateAnswerClock(early = false) {
    if (quiz?.stage !== "intro") return;
    quiz.stage = "answer";
    if (early) {
      quiz.readyAt = Date.now();
      quiz.deadline = quiz.readyAt + 25e3;
    }
    $(".dive-controls")?.classList.remove("entering");
    $("#intro-message")?.remove();
    $("#answer")?.focus({ preventScroll: true });
    persistQuiz();
  }
  function submitQuiz(text, reason) {
    if (quiz?.stage === "intro") activateAnswerClock(true);
    if (!quiz || quiz.stage !== "answer") return;
    const late = Date.now() >= quiz.deadline, skip = reason === "skip";
    const answer = !skip ? matchAnswer(quizPack(), text) : null;
    if (!answer && !late && !skip) {
      let message = $("#quiz-rejection");
      if (!message) {
        message = document.createElement("p");
        message.id = "quiz-rejection";
        message.className = "quiz-rejection";
        message.setAttribute("role", "status");
        $(".dive-controls").prepend(message);
      }
      message.textContent = `\u201C${String(text).slice(0, 70)}\u201D: no echo. Try again.`;
      $("#answer").classList.remove("shake");
      void $("#answer").offsetWidth;
      $("#answer").classList.add("shake");
      if (settings.clearRejected) {
        $("#answer").value = "";
        quiz.draft = "";
        $("#dive-submit").disabled = true;
      }
      $("#answer").focus();
      beep(140, 0.1);
      return;
    }
    if (answer?.corrected && !late && !skip && settings.answerCorrections !== false) {
      const input = $("#answer");
      const from = input.value;
      input.value = answer.label;
      quiz.draft = answer.label;
      quiz.correction = { from, to: answer.label };
      let message = $("#quiz-rejection");
      if (!message) {
        message = document.createElement("p");
        message.id = "quiz-rejection";
        message.className = "quiz-rejection correction";
        message.setAttribute("role", "status");
        $(".dive-controls").prepend(message);
      }
      message.textContent = `\u201C${from}\u201D \u2192 \u201C${answer.label}\u201D \xB7 DIVE again to confirm`;
      input.focus();
      persistQuiz();
      return;
    }
    quiz.results.push({ packId: quizPack().id, input: String(quiz.correction?.from ?? text).slice(0, 256), label: answer?.label ?? (late ? "Time\u2019s up" : skip ? "Skipped" : String(text).trim() || "No answer"), points: answer?.points ?? 0, quip: answer?.quip, corrected: !!quiz.correction || answer?.corrected || false, reason: answer ? "valid" : late ? "timeout" : skip ? "skip" : "unlisted" });
    quiz.stage = "sinking";
    quiz.landedAt = Date.now() + 2800;
    quiz.draft = "";
    persistQuiz();
    beep(answer ? answer.points >= 85 ? 740 : 540 : 180, 0.15);
    renderQuiz();
  }
  function nextQuiz() {
    if (quiz.round >= 6) {
      quiz.stage = "done";
      if (quiz.mode === "daily") {
        const yesterday = /* @__PURE__ */ new Date(quiz.day + "T12:00:00Z");
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        if (profile.lastDay !== quiz.day) {
          profile.streak = profile.lastDay === yesterday.toISOString().slice(0, 10) ? profile.streak + 1 : 1;
          profile.lastDay = quiz.day;
          profile.best = Math.max(profile.best, total());
          save("profile", profile);
        }
      }
      persistQuiz();
      summary();
      return;
    }
    quiz.round++;
    quiz.stage = "intro";
    quiz.readyAt = Date.now() + 3e3;
    quiz.deadline = quiz.readyAt + 25e3;
    quiz.draft = "";
    quiz.correction = null;
    persistQuiz();
    renderQuiz();
  }
  function summary() {
    screen("summary");
    ocean.set("summary", 0);
    renderResults(app, quiz, PACKS);
  }
  function oceanTour() {
    screen("biomes");
    tourPlaying = false;
    const initial = Number(new URLSearchParams(location.hash.split("?")[1] ?? "").get("depth") || 0);
    ocean.set("dive", Math.max(0, Math.min(7e3, initial)));
    app.innerHTML = `<section class="ocean-tour"><div class="tour-heading"><p>COUNCILLION \xB7 OCEAN PREVIEW</p><h1 id="tour-biome">SUNLIT WATERS</h1><strong id="tour-depth">0m</strong><span>Drag the depth marker to explore.</span></div><div class="tour-controls"><div class="tour-stops">${[0, 500, 1500, 3500, 6500].map((d, i) => `<button data-depth="${d}">${["SUNLIT", "TWILIGHT", "MIDNIGHT", "ABYSS", "HADAL"][i]}</button>`).join("")}</div><input id="tour-slider" type="range" min="0" max="7000" step="10" value="${ocean.depth}" aria-label="Preview ocean depth"><div class="tour-actions"><button class="text-button" id="tour-play">\u25B6 SLOW DESCENT</button><a href="#practice">PLAY A DIVE \u2197</a><a href="#home">\u2191 SURFACE</a></div></div></section>`;
    $("#tour-slider").oninput = (e) => {
      tourPlaying = false;
      ocean.set("dive", Number(e.target.value));
      $("#tour-play").textContent = "\u25B6 SLOW DESCENT";
    };
    for (const b of app.querySelectorAll("[data-depth]")) b.onclick = () => {
      ocean.set("dive", Number(b.dataset.depth));
      $("#tour-slider").value = b.dataset.depth;
    };
    $("#tour-play").onclick = () => {
      tourPlaying = !tourPlaying;
      tourPrevious = Date.now();
      if (ocean.depth >= 7e3) ocean.set("dive", 0);
      $("#tour-play").textContent = tourPlaying ? "\u2161 PAUSE" : "\u25B6 SLOW DESCENT";
    };
  }
  async function copyText(text, message) {
    try {
      await navigator.clipboard.writeText(text);
      toast(message);
    } catch {
      modal(`<h2>COPY & SHARE</h2><label class="sr-only" for="copy-text">Text to share</label><textarea class="field" id="copy-text" rows="7" readonly>${esc4(text)}</textarea>`);
      $("#copy-text").select();
    }
  }
  function share() {
    const marks = quiz.results.map((r) => r.points >= 100 ? "\u{1F7E8}" : r.points >= 85 ? "\u{1F7EA}" : r.points >= 60 ? "\u{1F7E5}" : r.points >= 30 ? "\u{1F7E6}" : r.points ? "\u2B1C" : "\u2B1B").join("");
    copyText(`COUNCILLION \u2696 ${quiz.mode === "daily" ? quiz.day : "PRACTICE"}
${marks}
${total()}/700 \xB7 ${(total() * 10).toLocaleString()}m deep
Estimated better-than: ${percentileText(estimatedPercentile(total()))} (scoring model)
Future Counsel \xB7 ${location.href.split("#")[0]}`, "Verdict copied. Send it to your friends!");
  }
  function partySetup() {
    screen("party");
    app.innerHTML = back() + `<section class="page-heading"><p class="eyebrow">FUTURE COUNSEL \xB7 MULTIPLAYER</p>${puffer()}<h1>PUFFER PARTY</h1><p>Name an answer. Pass the puffer.<br>Last counsel floating wins.</p></section><section class="panel"><div style="display:flex;justify-content:space-between;align-items:center"><h3 style="margin:0">WHO\u2019S PLAYING?</h3><button class="text-button cyan" data-action="help" style="font-size:16px">HOW TO PLAY \u2197</button></div><label class="field-label" for="player-name">YOUR NAME</label><input id="player-name" class="field" placeholder="Future counsel\u2026" value="${esc4(profile.name)}" maxlength="18" autocomplete="nickname"><div class="party-options">${button("host", "\u25BC HOST A ROOM<small>Get a code. Invite your friends.</small>")}${button("local", "\u2696 ONE DEVICE<small>Pass the keyboard. 2\u20136 players.</small>")}</div><div class="section-separator">OR JOIN YOUR FRIENDS</div><form id="join-form"><label class="sr-only" for="room-code">Four-letter room code</label><div class="join-row"><input id="room-code" class="field" placeholder="ROOM CODE" maxlength="4" autocomplete="off" autocapitalize="characters" pattern="[A-Za-z]{4}" required><button class="pixel-button" type="submit">JOIN \u25B8</button></div></form><p id="party-error" class="notice" hidden role="alert"></p><p class="fine-print" style="margin-top:21px">Private rooms \xB7 2\u20136 players \xB7 no account needed<br>The host keeps this tab open while you play.</p></section><p class="fine-print" style="margin-top:22px">On a network that blocks live connections?<br>Daily Dive and one-device mode work independently.</p>`;
    $("#join-form").addEventListener("submit", (e) => {
      e.preventDefault();
      connectParty("join");
    });
    const code = new URLSearchParams(location.hash.split("?")[1] ?? "").get("room");
    if (code) $("#room-code").value = code.slice(0, 4);
  }
  function playerName() {
    const value = $("#player-name")?.value.trim();
    if (!value) {
      $("#player-name")?.focus();
      throw Error("Enter your name first.");
    }
    profile.name = value;
    save("profile", profile);
    return value;
  }
  function partyError(message) {
    const el = $("#party-error");
    if (el) {
      el.textContent = message;
      el.hidden = false;
    } else toast(message);
  }
  async function connectParty(kind) {
    let name;
    try {
      name = playerName();
    } catch (e) {
      partyError(e.message);
      return;
    }
    const code = $("#room-code")?.value;
    const buttons = [...app.querySelectorAll("button")];
    buttons.forEach((b) => b.disabled = true);
    partyError(kind === "host" ? "Opening a room\u2026" : "Connecting to the room\u2026");
    party?.close();
    party = new PartySession(renderParty, partyError);
    try {
      if (kind === "host") await party.create(name);
      else await party.join(name, code);
    } catch (e) {
      party?.close();
      party = null;
      partyError(e.message);
      buttons.forEach((b) => b.disabled = false);
    }
  }
  function localSetup() {
    let name;
    try {
      name = playerName();
    } catch (e) {
      partyError(e.message);
      return;
    }
    modal(`<div class="eyebrow">PASS THE KEYBOARD</div><h2>ONE-DEVICE PARTY</h2><p>Enter 2\u20136 player names, separated by commas. Everyone plays on this screen.</p><label class="field-label" for="local-names">PLAYERS</label><input class="field" id="local-names" maxlength="160" value="${esc4(name)}, " placeholder="Gavin, Alex, Sam"><p id="local-error" class="notice error" hidden role="alert"></p><button class="pixel-button primary" id="local-create" style="margin-top:25px">ASSEMBLE THE COURT \u25B8</button>`);
    $("#local-create").onclick = () => {
      const names = $("#local-names").value.split(",").map((n) => n.trim()).filter(Boolean);
      if (names.length < 2 || names.length > 6) {
        $("#local-error").textContent = "Add between two and six players.";
        $("#local-error").hidden = false;
        return;
      }
      $("#modal").close();
      party?.close();
      party = new PartySession(renderParty, partyError);
      party.createLocal(names);
    };
    $("#local-names").focus();
  }
  function playersMarkup(s, session) {
    return `<div class="players">${s.players.map((p, i) => `<div class="player ${s.phase === "playing" && i === s.turn ? "active" : ""} ${p.hearts <= 0 ? "out" : ""}"><span class="avatar">${["\u2696", "\u2726", "\u25C6", "\u265C", "\u25C8", "\u2727", "\u265F", "\u25C9"][i % 8]}</span><div class="player-meta"><div class="name">${esc4(p.name)}${p.id === session.myId && !session.local ? ' <span class="cyan">YOU</span>' : ""}</div><div class="hearts" aria-label="${p.hearts} hearts">${"\u2665".repeat(p.hearts)}${"\u2661".repeat(Math.max(0, (s.settings?.lives ?? 2) - p.hearts))}</div><small>${p.connected ? p.score + " PTS" : "DISCONNECTED"}${p.id === s.players[0]?.id ? " \xB7 HOST" : ""}</small><div class="meter" title="${p.meter}/${s.settings?.meterTarget ?? 600} points toward a heart"><span style="width:${p.meter / (s.settings?.meterTarget ?? 600) * 100}%"></span></div></div></div>`).join("")}</div>`;
  }
  function renderParty(s, session) {
    if (route !== "party") return;
    screen("party");
    const input = $("#party-answer"), draft = input?.value ?? "", wasFocused = document.activeElement === input, turnKey = `${s.round}:${s.turn}:${s.phase}`;
    const sameTurn = lastPartyTurn === turnKey;
    lastPartyTurn = turnKey;
    const ownTurn = session.local || s.players[s.turn]?.id === session.myId;
    if (s.phase === "lobby") {
      app.innerHTML = back() + `<section class="panel"><p class="eyebrow" style="text-align:center">${session.local ? "ONE-DEVICE PARTY" : "YOUR COURTROOM IS OPEN"}</p><h1 class="room-code">${session.local ? "LOCAL" : esc4(session.code)}</h1><span class="room-label">${session.local ? "PASS THE KEYBOARD" : "ROOM CODE \xB7 SHARE WITH YOUR FRIENDS"}</span>${session.local ? "" : `<div class="two-actions">${button("copy-code", "COPY CODE")}${button("invite", "COPY INVITE \u2197")}</div>`}${playersMarkup(s, session)}${session.host ? button("start-party", s.players.length >= 2 ? "\u25B6 START THE PARTY" : "WAITING FOR FRIENDS\u2026", "primary") : '<p class="notice">Waiting for the host to start the party\u2026</p>'}<p id="party-error" class="notice error" hidden role="alert"></p><p class="fine-print" style="margin-top:22px">2 hearts each \xB7 600 rarity points restores a heart<br>${session.local ? "Take turns on this device." : "Keep this tab open. New players join before the game starts."}</p></section>`;
      const start = $('[data-action="start-party"]');
      if (start) start.disabled = s.players.length < 2;
      return;
    }
    if (s.phase === "ended") {
      const winner = s.players.find((p) => p.id === s.winner);
      app.innerHTML = back() + `<section class="panel result-card"><p class="eyebrow">THE COURT HAS REACHED ITS VERDICT</p>${puffer()}<h1 class="winner">${esc4(winner?.name ?? "No one")} WINS!</h1><p class="muted">Last counsel floating.</p>${playersMarkup(s, session)}${session.host ? button("start-party", "\u21BB PLAY A REMATCH", "primary") : '<p class="notice">Waiting for the host to start a rematch.</p>'}${button("leave-party", "\u25C2 LEAVE ROOM")}<p id="party-error" class="notice error" hidden></p></section>`;
      return;
    }
    app.innerHTML = back() + `<div class="round-top"><span>PUFFER PARTY \xB7 CASE ${s.round}</span><span class="gold">${session.local ? "ONE DEVICE" : "ROOM " + esc4(session.code)}</span></div><section class="panel"><div class="party-stage">${puffer(s.phase === "burst" ? "hot" : "")}<p class="turn-label">${s.phase === "burst" ? "PUFFER POPPED!" : ownTurn ? "YOUR TURN" + (session.local ? " \xB7 " + esc4(s.players[s.turn].name) : "") : esc4(s.players[s.turn].name) + " HAS THE PUFFER"}</p><div class="timer-row"><div class="timer-track"><div class="timer-fill" id="party-timer-fill"></div></div><span class="timer-number" id="party-timer" role="timer">\u2014</span></div></div><p class="eyebrow">${esc4(partyPack(s).topic)}</p><h1 class="party-prompt">${esc4(partyPack(s).prompt)}</h1><form id="party-answer-form" class="answer-form"><label class="sr-only" for="party-answer">Your answer</label><input id="party-answer" class="field" placeholder="${ownTurn ? "Answer to pass the puffer\u2026" : "Waiting for your turn\u2026"}" maxlength="120" autocomplete="off" autocapitalize="off" spellcheck="false" ${!ownTurn || s.phase !== "playing" ? "disabled" : ""} required><button class="pixel-button" type="submit" ${!ownTurn || s.phase !== "playing" ? "disabled" : ""}>PASS \u25B8</button></form><p class="form-caption">${s.used.length} answers used \xB7 ${partyPack(s).answers.length} in this bank \xB7 at least 8 seconds for each new turn</p><p class="notice" role="status">${esc4(s.notice)}</p><p id="party-error" class="notice error" hidden role="alert"></p>${playersMarkup(s, session)}<h3 class="small-title">ON THE RECORD</h3><ul class="party-log">${s.log.map((l) => `<li><span><span class="muted">${esc4(l.name)} \u2192 </span>${esc4(l.answer)}</span><span class="${tier(l.points).color}">+${l.points}</span></li>`).join("") || '<li class="muted">Your first answer goes here.</li>'}</ul></section><div class="inline-links"><button class="text-button" data-action="leave-party">\u25C2 LEAVE ROOM</button><button class="text-button" data-action="help">? RULES</button></div>`;
    if (sameTurn && $("#party-answer")) $("#party-answer").value = draft;
    $("#party-answer-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const text = $("#party-answer").value;
      party.submit(text);
    });
    if (ownTurn && s.phase === "playing" && (!sameTurn || wasFocused)) $("#party-answer")?.focus();
    updateTimer();
  }
  function updateTimer() {
    if (route === "biomes") {
      const now = Date.now();
      if (tourPlaying) {
        ocean.set("dive", Math.min(7e3, ocean.depth + (now - tourPrevious) * 0.08));
        $("#tour-slider").value = ocean.depth;
        if (ocean.depth >= 7e3) {
          tourPlaying = false;
          $("#tour-play").textContent = "\u25B6 SLOW DESCENT";
        }
      }
      tourPrevious = now;
      const b = biomeAt(ocean.displayedDepth);
      $("#tour-biome").textContent = b.name;
      $("#tour-biome").style.color = b.color;
      $("#tour-depth").textContent = ocean.displayedDepth.toLocaleString() + "m";
      return;
    }
    const biomeNode = $("#current-biome");
    if (biomeNode) {
      const b = biomeAt(ocean.displayedDepth);
      if (biomeNode.textContent !== b.name) {
        biomeNode.textContent = b.name;
        biomeNode.style.color = b.color;
      }
    }
    const depthLabel = $("#dive-depth");
    if (depthLabel && ocean.mode === "dive") {
      const value = ocean.displayedDepth.toLocaleString() + "m";
      if (depthLabel.textContent !== value) depthLabel.textContent = value;
    }
    if (quiz && ["daily", "practice"].includes(route)) {
      if (quiz.stage === "intro") {
        const remaining = quiz.readyAt - Date.now();
        const node = $("#intro-message");
        if (node) node.textContent = "clock starts in " + Math.max(1, Math.ceil(remaining / 1e3)) + " \xB7 or DIVE now";
        if (remaining <= 0) {
          activateAnswerClock();
        }
        return;
      }
      if (quiz.stage === "sinking") {
        if (Date.now() >= quiz.landedAt) {
          quiz.stage = "result";
          persistQuiz();
          $(".dive-verdict")?.classList.remove("sinking");
        }
        return;
      }
      if (quiz.stage === "answer") {
        const remaining = Math.max(0, quiz.deadline - Date.now()), n = $("#quiz-timer"), fill = $("#quiz-timer-fill");
        if (n) {
          const text = String(Math.ceil(remaining / 1e3));
          if (n.textContent !== text) n.textContent = text;
          n.classList.toggle("urgent", remaining <= 3050);
        }
        if (fill) {
          fill.style.transform = "scaleX(" + remaining / 25e3 + ")";
          fill.style.background = remaining <= 3050 ? "var(--pink)" : "var(--cyan)";
        }
        if (remaining <= 0) submitQuiz($("#answer")?.value ?? quiz.draft ?? "", "timeout");
      }
    }
    if (party?.state && route === "party") {
      const s = party.state, remaining = Math.max(0, s.deadline - (Date.now() + party.offset)), n = $("#party-timer"), fill = $("#party-timer-fill");
      if (n) {
        n.textContent = s.phase === "playing" ? Math.ceil(remaining / 1e3) + "s" : "POP";
        n.classList.toggle("urgent", remaining < 6e3 || s.phase === "burst");
      }
      if (fill) {
        fill.style.transform = "scaleX(" + (s.phase === "playing" ? Math.min(1, remaining / (s.deadline - s.startedAt)) : 0) + ")";
        fill.style.background = remaining < 6e3 ? "var(--pink)" : "var(--mint)";
      }
    }
  }
  function navigate() {
    const next = location.hash.slice(1).split("?")[0] || "home";
    if (party && next !== "party") {
      party.close();
      party = null;
      lastPartyTurn = null;
    }
    route = next;
    if (next === "daily" || next === "practice") startQuiz(next);
    else if (next === "biomes") oceanTour();
    else if (next === "party") {
      if (party?.state) renderParty(party.state, party);
      else partySetup();
    } else {
      route = "home";
      home();
    }
    restorePracticeOnLoad = false;
    window.scrollTo(0, 0);
  }
  function action(name, packId) {
    beep(350, 0.04);
    switch (name) {
      case "daily":
        startQuiz("daily");
        break;
      case "practice":
        quiz = null;
        startQuiz("practice");
        break;
      case "next":
        nextQuiz();
        break;
      case "skip":
        submitQuiz("", "skip");
        break;
      case "help":
        howTo();
        break;
      case "share":
        share();
        break;
      case "bank":
        showBank(packId);
        break;
      case "party":
        location.hash = "party";
        break;
      case "host":
        connectParty("host");
        break;
      case "local":
        localSetup();
        break;
      case "start-party":
        party?.start();
        break;
      case "copy-code":
        copyText(party.code, "Room code copied!");
        break;
      case "invite":
        copyText(location.href.split("#")[0] + "#party?room=" + party.code, "Invite link copied!");
        break;
      case "leave-party":
        party?.close();
        party = null;
        lastPartyTurn = null;
        partySetup();
        break;
    }
  }
  app.addEventListener("click", (e) => {
    const b = e.target.closest("[data-action]");
    if (b && !b.disabled) action(b.dataset.action, b.dataset.pack);
  });
  $("#modal-content").addEventListener("change", (e) => {
    if (e.target.dataset.setting) {
      settings[e.target.dataset.setting] = e.target.checked;
      save("settings", settings);
      applySettings();
      if (settings.sound) beep();
    }
  });
  $("#modal-close").onclick = () => $("#modal").close();
  $("#modal").addEventListener("click", (e) => {
    if (e.target === $("#modal")) $("#modal").close();
  });
  $("#about-button").onclick = howTo;
  $("#settings-button").onclick = showSettings;
  $("#sound-button").onclick = () => {
    settings.sound = !settings.sound;
    save("settings", settings);
    applySettings();
    beep();
  };
  $("#menu-button").onclick = () => {
    modal(`<div class="eyebrow">FUTURE COUNSEL PRESENTS</div><h2 class="menu-title">COUNCILLION</h2><nav class="menu-grid"><a href="#daily"><span>\u25BC</span><strong>DAILY DIVE</strong><small>Seven prompts. One shared dive.</small></a><a href="#practice"><span>\u221E</span><strong>ENDLESS DIVE</strong><small>A fresh set whenever you want.</small></a><a href="#party"><span>\u2726</span><strong>PUFFER PARTY</strong><small>Make your case with friends.</small></a><a href="#home"><span>\u2191</span><strong>THE SURFACE</strong><small>Back to open water.</small></a></nav><div class="menu-bottom"><a href="#biomes">EXPLORE THE OCEAN \u2197</a><a href="https://futurecounsel.org/" target="_blank" rel="noopener">FUTURE COUNSEL \u2197</a></div><p class="menu-timer-note">${quiz?.stage === "answer" ? "Your timer keeps running while this menu is open." : "Rarer answers sink deeper."}</p>`);
  };
  $("#modal-content").addEventListener("click", (e) => {
    if (e.target.closest("a")) $("#modal").close();
  });
  window.addEventListener("hashchange", navigate);
  window.addEventListener("beforeunload", (e) => {
    if (party && !party.local && party.host && party.state?.players.length > 1) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) updateTimer();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && ["daily", "practice"].includes(route) && ["sinking", "result"].includes(quiz?.stage) && !$("#modal").open && !e.target.closest("button,a,input,textarea,summary")) {
      e.preventDefault();
      nextQuiz();
    }
  });
  window.addEventListener("pagehide", () => {
    if (quiz) persistQuiz();
  });
  applySettings();
  navigate();
  setInterval(updateTimer, 100);
  setInterval(updateClock, 1e3);
})();
