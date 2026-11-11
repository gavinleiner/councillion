import { CourtGameSession, listCourtRooms } from "./court-games-session.js";
import { TrialPreviewSession } from "./trial-preview.js";
import { TRIAL_GAMES, TRIAL_PROPS, TRIAL_TIMING } from "./trial-data.js";
import { trialSettings } from "./trial-engine.js";
import { buddySprite, BUDDIES } from "./party-buddy-sprite.js";
import { validateDisplayName } from "./moderation.js";
import { mountCourtAmbience } from "./party-ambience.js";
import { HostVoice } from "./court-games-dialogue.js";
const esc = (x) => String(x ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const cash = (n) => "$" + Number(n ?? 0).toLocaleString(), values = (x) => Object.values(x ?? {}), judge = (pose = 0) => '<span class="tr-judge" data-pose="' + pose + '" role="img" aria-label="The puffer magistrate"></span>';
const prop = (n, label = TRIAL_PROPS[n]) => '<span class="tr-prop tr-prop-' + n + '" role="img" aria-label="' + esc(label) + '"></span>';
const gridMarkup = (cells, cls = "") => '<span class="tr-grid ' + cls + '">' + Array.from({ length: 9 }, (_, i) => '<i class="' + (cells.includes(i) ? "lit" : "") + '"></i>').join("") + "</span>";
function buddy(id = "krill") {
  return ["schooler", "squid", "angler"].includes(id) ? '<img src="assets/party-buddies/' + id + '-ai-v1.png" alt="">' : buddySprite(id);
}
const how = "<p>Everyone answers the same multiple-choice trivia. Correct answers bank $1,000.</p><p>Living players who miss face a survival challenge. Read its short briefing; it starts automatically.</p><p>If sentenced, you become a ghost. Keep answering, earn cash, and interfere in survival trials.</p><p>The finale is an escape race. Judge every item in a category. Each correct inclusion or exclusion moves you one stone.</p><p>The living player sees two choices. Ghosts see three and can steal a life by passing them. At the exit, all three judgments must be correct. Watch the pursuing darkness.</p>";
function dieMarkup(value=0){
 const dots={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]}[value]??[];
 return `<span class="tr-die" data-value="${value}" aria-label="${value?'Die showing '+value:'Roll the die'}">${Array.from({length:9},(_,i)=>`<i class="${dots.includes(i)?'pip':''}"></i>`).join('')}${value?'':'<b>?</b>'}</span>`;
}
const briefSteps=s=>({
 memory:[`Watch ${s.challenge.size} pieces of evidence.`,`Rebuild the exact order.`,`Seal once. A wrong chain costs your life.`],
 maths:['Solve the short calculations.','Correct +1. Wrong −1.','Beat the lowest score; alone, reach 3.'],
 cups:['Poisoners lay a trap now.','Then defendants choose a chalice.','Witnesses predict who drinks poison.'],
 greed:s.challenge.partner?['The defendant faces one deal partner.','Both share: the defendant survives.','A thief beats a sharer. Both steal: the defendant dies.']:['Everyone shares: everyone survives.','A thief beats anyone who shares.','Everyone steals: everyone loses.'],
 bids:s.challenge.soloBail?['The hidden court reserve is $100–$350.','Seal a bid. Every dollar is paid.','Match or beat the reserve to survive.']:['Seal a bid from $0 to $500.','Every bid leaves your wallet.','The lowest bid loses. Ties lose together.'],
 pulse:['Watch the moving balance needle.','Stop inside the gold band.','Three tries. Your best attempt counts.'],
 dice:['Roll to reach a total of 8.','Bank to survive, or roll for extra cash.','A 1 busts your run. Safe totals auto-bank.'],
 mirror:['Study the original evidence grid.','Find its left-to-right reflection.','One answer. Watch the decoys.']
})[s.challenge.kind];
function roleCopy(s,session){
 const p=s.players.find(p=>p.id===session.uid),r=session.response?.trial;
 if(!p||p.spectator)return {title:'SPECTATOR',text:'Take a seat in the next trial.',tone:'gallery'};
 if((s.atRisk??[]).includes(p.id))return {title:'YOUR LIFE IS ON TRIAL',text:'Survive this challenge to keep your life.',tone:'risk'};
 if(r?.role==='partner')return {title:'YOU ARE THE DEAL PARTNER',text:'Share together: +$350. Betray a sharer: +$700. Both steal: nobody profits.',tone:'ghost'};
 if(s.challenge?.kind==='cups'&&r?.role==='poisoner')return {title:'YOU HOLD THE POISON',text:s.stage==='trial-brief'?'Choose a chalice below. It locks when the briefing ends.':'Your trap is set. Watch who drinks.',tone:'ghost'};
 return {title:p.alive?'THE GALLERY PLAYS TOO':'GHOST COUNSEL · STILL IN IT',text:s.challenge?.kind==='cups'?'Predict a poisoned defendant, or nobody, for $500.':'Play for bonus cash. Cash helps your escape position.',tone:p.alive?'gallery':'ghost'};
}
class TrialView {
  constructor(root, options = {}) {
    this.root = root;
    this.options = { identity: () => null, signIn: () => {
    }, ...options };
    this.preferences = { name: "", buddy: "krill", ...options.preferences };
    this.identity = this.options.identity;
    this.settings = trialSettings();
    this.session = null;
    this.disposed = false;
    this.chain = [];
    this.escapeMask = 0;
    this.escapeJudged = 0;
    this.voiceOn = globalThis.localStorage?.getItem("councillion-trial-voice") !== "off";
    this.voice = new HostVoice((talking) => this.shellEl?.classList.toggle("tr-speaking", talking));
    this.voice.setEnabled(this.voiceOn);
    this.keyHandler = (e) => this.keyboard(e);
    document.addEventListener("keydown", this.keyHandler);
    this.clockFrame = () => {
      if (this.disposed) return;
      this.paintClock();
      this.frame = requestAnimationFrame(this.clockFrame);
    };
    this.frame = requestAnimationFrame(this.clockFrame);
    this.renderEntry();
    this.preloads = ["court", "archive", "scales", "cells", "escape", "gate", "win", "evidence", "table", "chance", "verdict"].map((scene) => {
      const image = new Image();
      image.decoding = "async";
      image.src = "assets/court-games/trial-" + scene + (["evidence","table","chance","verdict"].includes(scene)?"-v42.webp":"-v38.webp");
      return image;
    });
    const params = new URLSearchParams(location.hash.split("?")[1] ?? "");
    if (params.get("demo") === "bots") this.practice({ autoplay: true });
  }
  shell(game = false) {
    this.ambience?.dispose();
    this.root.innerHTML = '<section class="tr-shell ' + (game ? "tr-game" : "tr-entry") + '"><div class="tr-world" aria-hidden="true"><div class="tr-scene"></div><div class="tr-scene tr-scene-next"></div><div class="tr-caustics"></div><div class="tr-lantern-glow"></div><div class="tr-verdict-motes"><i style="--m:0"></i><i style="--m:1"></i><i style="--m:2"></i><i style="--m:3"></i><i style="--m:4"></i><i style="--m:5"></i></div><canvas class="tr-life"></canvas><div class="tr-drift">' + Array.from({ length: 14 }, (_, i) => '<i style="--i:' + i + '"></i>').join("") + '</div></div><nav class="tr-nav"><button data-tr-leave aria-label="Leave Trial by Puffer">\u25C2 ' + (game ? "LEAVE COURT" : "PUFFER GAMES") + '</button><span>FUTURE COUNSEL <b>\xB7</b> <strong data-tr-phase>TRIAL BY PUFFER</strong></span><div><button data-tr-voice aria-pressed="' + this.voiceOn + '">VOICE ' + (this.voiceOn ? "ON" : "OFF") + '</button><button data-tr-full aria-label="Toggle fullscreen">\u26F6</button><button data-tr-help aria-label="How to play">?</button></div></nav><div class="tr-statusbar"></div><div class="tr-time"><span data-tr-timer></span><i><b></b></i></div><div class="tr-host">' + judge() + '<div class="tr-speech" role="status">The court is waiting for its next poor decision.</div></div><main class="tr-main"></main><div class="tr-roster"></div><div class="tr-race"></div><p class="tr-error" role="alert" hidden></p><dialog class="tr-help"><button data-tr-help-close aria-label="Close rules">\xD7</button><p class="tr-kicker">FUTURE COUNSEL \xB7 FIELD GUIDE</p><h2>SURVIVE. HAUNT. ESCAPE.</h2>' + how + "</dialog></section>";
    this.shellEl = this.root.querySelector(".tr-shell");
    this.main = this.root.querySelector(".tr-main");
    this.roster = this.root.querySelector(".tr-roster");
    this.race = this.root.querySelector(".tr-race");
    this.ambience = mountCourtAmbience(this.root.querySelector(".tr-life"), { cove: true });
    this.scene = "";
    this.sceneSerial = 0;
    this.lastKey = "";
    this.rosterKey = "";
    this.taskKey = "";
    this.root.querySelector("[data-tr-leave]").onclick = () => game ? this.leave() : location.hash = "#games";
    this.root.querySelector("[data-tr-help]").onclick = () => this.root.querySelector(".tr-help").showModal();
    this.root.querySelector("[data-tr-help-close]").onclick = () => this.root.querySelector(".tr-help").close();
    this.root.querySelector("[data-tr-full]").onclick = () => document.fullscreenElement ? document.exitFullscreen() : this.shellEl.requestFullscreen?.().catch(() => {
    });
    this.root.querySelector("[data-tr-voice]").onclick = (e) => {
      this.voiceOn = !this.voiceOn;
      this.voice.setEnabled(this.voiceOn);
      this.voice.unlock();
      localStorage.setItem("councillion-trial-voice", this.voiceOn ? "on" : "off");
      e.currentTarget.textContent = "VOICE " + (this.voiceOn ? "ON" : "OFF");
      e.currentTarget.setAttribute("aria-pressed", String(this.voiceOn));
    };
  }
  setScene(scene) {
    if (scene === this.scene) return;
    const next = this.root.querySelector(".tr-scene-next"), base = this.root.querySelector(".tr-scene:not(.tr-scene-next)");
    const url = 'url("assets/court-games/trial-' + scene + (["evidence","table","chance","verdict"].includes(scene)?'-v42.webp':'-v38.webp')+'")';
    this.scene = scene;
    this.shellEl.dataset.scene=scene;
    const serial = ++this.sceneSerial;
    next.style.backgroundImage = url;
    next.classList.remove("tr-scene-visible");
    requestAnimationFrame(() => {
      if (serial !== this.sceneSerial) return;
      next.classList.add("tr-scene-visible");
      clearTimeout(this.sceneTimeout);
      this.sceneTimeout = setTimeout(() => {
        if (serial !== this.sceneSerial || this.disposed) return;
        base.style.backgroundImage = url;
        next.classList.remove("tr-scene-visible");
      }, 950);
    });
  }
  talk(text, pose = 0, key = text, voiceText = text) {
    const bubble = this.root.querySelector(".tr-speech");
    if (bubble && bubble.textContent !== text) bubble.textContent = text;
    this.root.querySelector(".tr-host .tr-judge")?.setAttribute("data-pose", String(pose));
    this.voice.cue({ key, text: voiceText });
  }
  renderEntry() {
    if (this.disposed) return;
    this.offRooms?.();
    this.shell();
    this.setScene("hall");
    this.shellEl.dataset.stage = "hub";
    this.shellEl.classList.add("tr-hub");
    this.main.innerHTML = '<div class="tr-entry-heading"><p class="tr-kicker">FUTURE COUNSEL PRESENTS</p><h1>TRIAL <small>BY</small> PUFFER</h1><p class="tr-tagline">DEATH IS NOT DISMISSAL.</p></div><button class="tr-enter-court" data-tr-setup aria-label="Enter the Trial by Puffer courthouse"><span class="tr-door-light"></span><span>' + prop(0) + '</span><b>ENTER THE COURTHOUSE</b><small>2\u20138 COUNSEL \xB7 TRIVIA \xB7 SURVIVAL \xB7 ESCAPE</small></button><div class="tr-your-stand"><div>' + buddy(this.preferences.buddy) + "</div><strong>" + esc(this.preferences.name || "YOUR COUNSEL") + '</strong><small>YOUR DEFENSE STARTS HERE</small></div><div class="tr-entry-actions"><button data-tr-practice>PLAY WITH BOTS \u2197</button><button data-tr-watch>WATCH A FULL BOT GAME \u2197</button></div><form class="tr-invite"><label for="tr-invite-code">ALREADY SUMMONED?</label><div><input id="tr-invite-code" maxlength="4" placeholder="ROOM CODE" autocomplete="off" autocapitalize="characters"><button type="submit">JOIN \u2192</button></div></form><p class="tr-entry-note">Stay sharp. Survive eight different trials. Steal your life back.</p>';
    this.root.querySelector("[data-tr-setup]").onclick = () => {
      this.voice.unlock();
      this.setup();
    };
    this.root.querySelector("[data-tr-practice]").onclick = () => {
      this.voice.unlock();
      this.practice();
    };
    this.root.querySelector("[data-tr-watch]").onclick = () => {
      this.voice.unlock();
      this.practice({ autoplay: true });
    };
    this.root.querySelector(".tr-invite").onsubmit = (e) => {
      e.preventDefault();
      this.pendingCode = this.root.querySelector("#tr-invite-code").value;
      this.setup();
    };
    const params = new URLSearchParams(location.hash.split("?")[1] ?? "");
    if (params.get("room")) {
      this.pendingCode = params.get("room").slice(0, 4);
      this.setup();
    }
  }
  setup() {
    this.offRooms?.();
    this.shell();
    this.setScene("cells");
    this.shellEl.dataset.stage = "setup";
    this.talk("Choose your counsel. The magistrate has already chosen violence.", 0, "setup");
    this.main.innerHTML = '<section class="tr-setup"><div class="tr-profile-stage"><div class="tr-profile-character">' + buddy(this.preferences.buddy) + '</div><div class="tr-profile-stone"></div><strong data-tr-name-preview>' + esc(this.preferences.name || "YOUR COUNSEL") + '</strong><p>YOUR WITNESS STAND</p></div><form class="tr-desk"><p class="tr-kicker">ENTER YOUR PLEA</p><h1>TRIAL BY PUFFER</h1><label for="tr-name">COUNSEL NAME</label><input id="tr-name" maxlength="16" value="' + esc(this.preferences.name) + '" autocomplete="nickname" placeholder="Your name"><div class="tr-buddies" aria-label="Choose your counsel">' + BUDDIES.map(([id, title]) => '<button type="button" data-tr-buddy="' + id + '" aria-label="' + esc(title) + '" aria-pressed="' + (this.preferences.buddy === id) + '">' + buddy(id) + "</button>").join("") + '</div><label class="tr-public"><input id="tr-public" type="checkbox" ' + (this.preferences.trialPublic ? "checked" : "") + '> Show this room in open courts</label><button class="tr-primary" data-tr-host type="submit">' + (this.identity() ? "HOST A TRIAL" : "SIGN IN WITH GOOGLE TO PLAY") + ' \u2192</button><div class="tr-join"><input id="tr-code" maxlength="4" value="' + esc(this.pendingCode || "") + '" placeholder="ROOM CODE" aria-label="Four-letter room code" autocomplete="off" autocapitalize="characters"><button type="button" data-tr-join>JOIN \u2192</button></div><button class="tr-text-button" type="button" data-tr-practice>PRACTICE WITH BOTS</button></form><section class="tr-open-rooms"><h2>OPEN COURTS</h2><div data-tr-rooms>' + (this.identity() ? "Checking the summons\u2026" : "Sign in to see open courts.") + "</div></section></section>";
    this.root.querySelector("#tr-name").oninput = (e) => {
      this.root.querySelector("[data-tr-name-preview]").textContent = e.target.value || "YOUR COUNSEL";
    };
    this.root.querySelectorAll("[data-tr-buddy]").forEach((b) => b.onclick = () => {
      this.preferences.buddy = b.dataset.trBuddy;
      this.root.querySelector(".tr-profile-character").innerHTML = buddy(this.preferences.buddy);
      this.root.querySelectorAll("[data-tr-buddy]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    });
    this.root.querySelector(".tr-desk").onsubmit = (e) => {
      e.preventDefault();
      this.connect("host");
    };
    this.root.querySelector("[data-tr-join]").onclick = () => this.connect("join");
    this.root.querySelector("#tr-code").onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.connect("join");
      }
    };
    this.root.querySelector("[data-tr-practice]").onclick = () => {
      this.preferences.name = this.root.querySelector("#tr-name").value;
      this.practice();
    };
    this.loadRooms();
  }
  async loadRooms() {
    if (!this.identity()) return;
    try {
      const c = await (this.options.getCloud?.() ?? import("./cloud.bundle.js?v=20261106-final-saves-v28"));
      if (this.disposed || this.session) return;
      this.offRooms = await listCourtRooms(c, "trial", (rooms) => {
        const mount = this.root.querySelector("[data-tr-rooms]");
        if (!mount) return;
        mount.innerHTML = rooms.length ? rooms.slice(0, 4).map((r) => '<button data-tr-room="' + r.code + '"><strong>' + esc(r.hostName) + "</strong><span>" + r.count + "/8 \xB7 " + r.code + " \u2192</span></button>").join("") : "<p>No trial is waiting. Host the first court.</p>";
        mount.querySelectorAll("button").forEach((b) => b.onclick = () => {
          this.root.querySelector("#tr-code").value = b.dataset.trRoom;
          this.connect("join");
        });
      }, (e) => this.error(e.message));
    } catch (e) {
      this.error(e.message);
    }
  }
  async connect(kind) {
    if (!this.identity()) {
      this.options.signIn();
      return;
    }
    try {
      this.preferences.name = validateDisplayName(this.root.querySelector("#tr-name").value);
      this.preferences.trialPublic = this.root.querySelector("#tr-public").checked;
      this.options.savePreferences?.(this.preferences);
      const code = this.root.querySelector("#tr-code").value;
      this.root.querySelectorAll(".tr-desk button").forEach((b) => b.disabled = true);
      this.error("Calling the bailiff\u2026");
      this.offRooms?.();
      this.session = new CourtGameSession({ mode: "trial", identity: this.identity, authorize: this.options.authorize, getCloud: this.options.getCloud, appearance: this.preferences.courtAppearance, settings: this.settings, onState: (s, session) => {
        if (!s || this.disposed) return;
        this.render(s, session);
      }, onError: (m) => this.error(m) });
      if (kind === "host") await this.session.create(this.preferences.name, this.preferences.buddy, !this.preferences.trialPublic);
      else await this.session.join(this.preferences.name, code, this.preferences.buddy);
      if (!this.disposed) history.replaceState(null, "", "#trial?room=" + this.session.code);
    } catch (e) {
      await this.session?.close();
      this.session = null;
      if (!this.disposed) {
        this.setup();
        this.error(e.message);
      }
    }
  }
  practice({ autoplay = false, seed = 38117, seats = 6 } = {}) {
    this.offRooms?.();
    this.session?.close();
    this.shell(true);
    this.session = new TrialPreviewSession({ name: this.preferences.name || "Counsel", buddy: this.preferences.buddy, settings: { ...this.settings, length: autoplay ? "tour" : this.settings.length }, autoplay, seed, seats, onState: (s, session) => this.render(s, session), onError: (m) => this.error(m) });
    this.render(this.session.state, this.session);
  }
  render(s, session) {
    if (this.disposed) return;
    this.current = s;
    this.currentSession = session;
    if (!this.shellEl?.classList.contains("tr-game")) this.shell(true);
    const stageKey=[s.matchId||'lobby',s.stage,s.stageAt||0].join(':');
    const receipt=session.response?.trial,needsReceipt=['trial-question','trial-brief','trial-challenge','trial-escape-question'].includes(s.stage)&&s.players.some(p=>p.id===session.uid&&!p.spectator);
    this.waitForReceipt=needsReceipt&&(receipt?.stageAt!==s.stageAt||receipt?.matchId!==s.matchId);
    const key=stageKey+':'+(needsReceipt?(this.waitForReceipt?'waiting':receipt.role):'public');
    const fresh = key !== this.lastKey;
    this.shellEl.dataset.stage = s.stage;
    this.shellEl.dataset.part = s.part || "trial";
    this.shellEl.dataset.kind = s.challenge?.kind || "";
    this.shellEl.style.setProperty("--escape-progress",String((s.escape?.positions?.[s.escape?.soul]??0)/(s.escape?.goal??24)));
    this.shellEl.dataset.seats = String(s.players.filter((p) => !p.spectator).length);
    this.shellEl.style.setProperty("--players", String(s.players.filter((p) => !p.spectator).length));
    this.root.querySelector("[data-tr-phase]").textContent = s.stage === "lobby" ? session.preview ? "BOT TRIAL \xB7 " + (session.demo ? "WATCHING" : "YOU PLAY") : "ROOM " + session.code : s.part === "escape" ? "THE FINAL ESCAPE \xB7 " + s.escape.turn : "TRIAL " + s.round + " / 8";
    if (fresh) {
      this.lastKey = key;
      this.chain = [];
      this.escapeMask = 0;
    this.escapeJudged = 0;
      this.taskKey = "";
      this.diceKey = "";
      this.diceControlKey="";
      this.pulseAttempt=0;
      this.main.classList.remove("tr-arrive");
      void this.main.offsetWidth;
      this.main.classList.add("tr-arrive");
      this.error("");
      this.main.scrollTop=0;
      if(this.waitForReceipt)this.main.innerHTML='<section class="tr-role-delivery"><div class="tr-challenge-emblem">'+prop(6)+'</div><p class="tr-kicker">THE COURT IS DEALING</p><h1>YOUR SEALED INSTRUCTIONS…</h1></section>';
      else this.stageMarkup(s, session);
      this.setScene(this.sceneFor(s));
      this.talk(this.speech(s, session), s.stage === "trial-verdict" ? 2 : s.stage === "finish" ? 3 : s.stage === "trial-escape-run" ? 1 : 0, stageKey, s.stage === "trial-question" ? s.question.prompt : s.stage === "trial-escape-question" ? s.escape.prompt : void 0);
      this.ping(s.event?.type);
    }
    this.renderRoster(s, session);
    if (s.part === "escape" && s.stage !== "finish") this.renderRace(s, session);
    else this.race.innerHTML = "";
    this.renderHUD(s, session);
    this.refreshControls(s, session);
    this.paintClock();
  }
  sceneFor(s) {
    if (s.stage === "lobby") return "hall";
    if (s.stage === "finish") return s.result.escaped ? "win" : "cells";
    if (s.stage === "trial-gate" || s.escape?.gate) return "gate";
    if (s.part === "escape") return "escape";
    if(s.stage==='trial-verdict')return 'verdict';
    if(s.stage==='trial-brief')return s.challenge?.scene||'floor';
    if(['trial-watch','trial-challenge'].includes(s.stage))return s.challenge?.playScene||s.challenge?.scene||'floor';
    return "court";
  }
  speech(s, session) {
    if (s.stage === "lobby") return session.demo ? "Six scripted counsel. Every round, every survival trial, and the entire escape. Press PLAY FULL GAME." : "Correct answers buy freedom. Wrong ones buy me entertainment.";
    if (s.stage === "trial-intro") return "Answer trivia. Miss, and face a survival trial. Ghosts can steal a life and escape.";
    if (s.stage === "trial-escape-intro") return "Judge every item. Correct judgments move you forward. Ghosts get an extra choice. Pass the living counsel to steal their life.";
    if (s.stage === "trial-brief") return { memory: "Watch the evidence. Rebuild its exact order when it disappears.", maths: "Solve short calculations. Lowest defendants lose. A lone defendant needs three marks.", cups: "Poisoners set the trap now. Defendants choose a drink next. Other witnesses predict the victim.", greed: s.challenge.partner?"The defendant faces one deal partner. Share together to survive. A thief beats a sharer.":"Share or steal. A thief beats sharers. If everyone steals, everyone loses.", bids: s.challenge.soloBail?"Match the hidden court reserve, between one hundred and three hundred fifty dollars. Every bid is paid.":"Bid secretly. Every bid is paid. The lowest bidder loses their life.", pulse: "Stop the needle inside the gold band. Three attempts; your best counts.", dice: "Roll to reach eight. Bank to survive, or risk another roll for more cash. A one busts your run.", mirror: "Find the exact left-to-right reflection of the evidence grid." }[s.challenge.kind];
    if (s.stage === "trial-question") return "An excellent time to know something. Ghosts, you answer too.";
    if (s.stage === "trial-challenge") return s.challenge.kind === "cups" ? session.response?.trial?.role === "poisoner" ? "Your poison is locked. Watch who drinks." : "The trap is set. Choose a drink or predict the victim." : "The clock is yours. The floor is mine.";
    if (s.stage === "trial-escape-question") return s.escape.gate ? "Three judgments. One exit. No room for a mistake." : "Ghosts get an extra choice. Pass the living to steal their life.";
    return s.notice || "The court is watching.";
  }
  stageMarkup(s, session) {
    const m = this.main, own = s.players.find((p) => p.id === session.uid);
    if (s.stage === "lobby") {
      m.innerHTML = '<section class="tr-lobby"><p class="tr-kicker">' + (session.demo ? "FULL BOT SHOWCASE" : session.preview ? "PRACTICE COURT" : "THE SUMMONS IS OPEN") + '</p><h1>TRIAL BY PUFFER</h1><p class="tr-lobby-sub">Correct answers. Survival trials. A second life.</p><div class="tr-lobby-route"><span>' + prop(3) + "<b>ANSWER</b></span><i>\u2192</i><span>" + prop(2) + "<b>SURVIVE</b></span><i>\u2192</i><span>" + prop(0) + '<b>ESCAPE</b></span></div><div class="tr-lobby-settings"><label>PACE <select data-tr-seconds ' + (!session.host ? "disabled" : "") + '><option value="15">15 SEC</option><option value="20">20 SEC</option><option value="25">25 SEC</option></select></label><label>LENGTH <select data-tr-length ' + (!session.host ? "disabled" : "") + '><option value="standard">CLASSIC · 4–8 CASES</option><option value="tour">FULL COURT · 8 CASES</option></select></label></div><div class="tr-lobby-actions">' + (session.host ? '<button class="tr-primary" data-tr-start>' + (session.demo ? "PLAY FULL GAME" : "OPEN THE TRIAL") + " \u2192</button>" : '<button class="tr-primary" data-tr-ready>' + (own?.ready ? "READY \u2713" : "READY UP") + "</button>") + (!session.preview ? "<button data-tr-invite>COPY INVITE \u2197</button>" : "") + "</div><small>" + (session.demo ? "All seats are scripted bots. No ranks or online room." : session.preview ? "You control your counsel. Five bots play with you." : "Everyone must ready up. The rest runs automatically.") + "</small></section>";
      m.querySelector("[data-tr-seconds]").value = String(s.settings.seconds);
      m.querySelector("[data-tr-length]").value = s.settings.length;
      for (const select of m.querySelectorAll("select")) select.onchange = () => this.action("settings", { settings: { seconds: Number(m.querySelector("[data-tr-seconds]").value), length: m.querySelector("[data-tr-length]").value } });
      m.querySelector("[data-tr-start]")?.addEventListener("click", () => {
        this.voice.unlock();
        this.unlockSound();
        this.action("start");
      });
      m.querySelector("[data-tr-ready]")?.addEventListener("click", () => session.ready(!own?.ready));
      m.querySelector("[data-tr-invite]")?.addEventListener("click", () => navigator.clipboard?.writeText(location.href.split("#")[0] + "#trial?room=" + session.code).then(() => this.options.notice?.("Trial invite copied.")).catch(() => this.error("Share room code " + session.code)));
      return;
    }
    if (s.stage === "trial-intro") {
      m.innerHTML = '<section class="tr-title-beat"><p class="tr-kicker">THE COURT IS NOW IN SESSION</p><h1>YOUR LIFE.<br>MY DOCKET.</h1><p>Answer together. Survive your mistakes.<br>Ghosts still get their day in court.</p><div class="tr-rule-steps"><span>1 \xB7 TRIVIA</span><span>2 \xB7 SURVIVAL</span><span>3 \xB7 ESCAPE</span></div></section>';
      return;
    }
    if (s.stage === "trial-question") {
      m.innerHTML = '<section class="tr-question"><p class="tr-kicker">' + esc(s.question.subject) + " \xB7 " + esc(s.question.category) + "</p><h1>" + esc(s.question.prompt) + '</h1><div class="tr-answers">' + s.question.options.map((o, i) => '<button class="tr-option" data-choice="' + o.id + '" data-index="' + i + '"><kbd>' + String.fromCharCode(65 + i) + "</kbd><span>" + esc(o.text) + "</span><i></i></button>").join("") + '</div><p class="tr-own-status">Choose an answer. It stays private until the reveal.</p></section>';
      m.querySelectorAll("[data-choice]").forEach((b) => b.onclick = () => this.action("trial-answer", { choice: b.dataset.choice }));
      return;
    }
    if(s.stage==='trial-answer-reveal'){
      const ownRow=s.trialRows.find(r=>r.id===session.uid),choice=s.question.options.find(o=>o.id===ownRow?.choice)?.text;
      m.innerHTML=`<section class="tr-answer-reveal"><p class="tr-kicker">THE RECORD IS OPEN</p><div class="tr-answer-seal">✓</div><h1>${esc(s.answerReveal.text)}</h1>${s.answerReveal.explanation?`<p class="tr-answer-context">${esc(s.answerReveal.explanation)}</p>`:''}<p class="tr-answer-personal ${ownRow?.correct?'tr-safe':'tr-danger'}">${ownRow?.correct?'YOU GOT IT · +$1,000':choice?'You chose '+esc(choice):'No answer sealed'}${ownRow&&!ownRow.correct&&!ownRow.ghost?' · TO THE SURVIVAL FLOOR':''}</p><div class="tr-verdict-chips">${s.trialRows.map(r=>`<span class="${r.correct?'tr-safe':'tr-danger'}">${esc(s.players.find(p=>p.id===r.id).name)}<b>${r.correct?'+$1,000':r.ghost?'GHOST · NO CASH':'ON TRIAL'}</b></span>`).join('')}</div><a href="${esc(s.answerReveal.source)}" target="_blank" rel="noopener">CHECK THE RECORD ↗</a></section>`;return;
    }
    if(s.stage==='trial-brief'){
      const role=roleCopy(s,session),poisoner=s.challenge.kind==='cups'&&session.response?.trial?.role==='poisoner';
      m.innerHTML=`<section class="tr-brief"><p class="tr-kicker">SURVIVAL TRIAL · ${esc(s.challenge.tag)}</p><h1>${esc(s.challenge.name)}</h1><div class="tr-brief-directions"><div class="tr-challenge-emblem">${prop(s.challenge.icon)}</div><ol>${briefSteps(s).map(t=>`<li>${esc(t)}</li>`).join('')}</ol></div><div class="tr-role-card tr-role-${role.tone}"><b>${role.title}</b><span>${role.text}</span></div>${poisoner?`<div class="tr-cups tr-prepare-cups">${Array.from({length:6},(_,i)=>`<button data-poison="${i}" data-index="${i}" aria-label="Poison chalice ${i+1}">${prop(2)}<b>${i+1}</b></button>`).join('')}</div><p class="tr-own-status">Choose your poison now. It stays private.</p>`:`<div class="tr-at-risk"><span>ON TRIAL</span>${s.atRisk.map(id=>`<strong>${esc(s.players.find(p=>p.id===id).name)}</strong>`).join('')}</div>`}<small>STARTS AUTOMATICALLY</small></section>`;
      m.querySelectorAll('[data-poison]').forEach(b=>b.onclick=()=>this.action('trial-poison',{choice:Number(b.dataset.poison)}));return;
    }
    if (s.stage === "trial-watch") {
      m.innerHTML = '<section class="tr-memory-watch"><p class="tr-kicker">CHAIN OF CUSTODY \xB7 LOOK NOW</p><h1>REMEMBER THE ORDER.</h1><div class="tr-memory-evidence">' + s.challenge.pattern.map((n, i) => '<div style="--order:' + i + '">' + prop(n) + "<b>" + (i + 1) + "</b></div>").join("") + "</div><p>The evidence will disappear. Rebuild it in the same order.</p></section>";
      return;
    }
    if (s.stage === "trial-challenge") {
      this.challengeMarkup(s, session);
      return;
    }
    if(s.stage==='trial-verdict'){
      const ownRow=s.verdictRows.find(r=>r.id===session.uid),died=s.lastDeaths.includes(session.uid),message=died?'YOU ARE A GHOST NOW.':ownRow?.defendant?'YOU SURVIVED.':'THE GALLERY HAS ITS VERDICT.';
      m.innerHTML=`<section class="tr-verdict"><div class="tr-stamp ${died?'':'tr-stamp-safe'}">${died?'SENTENCED':ownRow?.defendant?'SURVIVED':'VERDICT'}</div><h1>${message}</h1><p class="tr-verdict-personal">${died?'You still answer, earn cash, and can steal a life in the escape.':esc(ownRow?.detail??'Watch the court’s ruling.')}${ownRow?.bonus?' · +'+cash(ownRow.bonus):''}</p><div class="tr-trial-results">${s.verdictRows.map(r=>`<div class="${r.defendant?r.survived?'tr-safe':'tr-danger':''}"><strong>${esc(s.players.find(p=>p.id===r.id).name)}</strong><span>${esc(r.detail)}</span><b>${r.defendant?r.survived?'SURVIVED':'GHOST':r.bonus?'+'+cash(r.bonus):'GALLERY'}</b></div>`).join('')}</div>${this.solution(s)}</section>`;return;
    }
    if (s.stage === "trial-transition") {
      m.innerHTML = '<section class="tr-title-beat"><p class="tr-kicker">THE NEXT CASE</p><h1>STILL ON THE DOCKET.</h1><p>Living counsel, keep your life.<br>Ghosts, keep your options open.</p>' + prop(3) + "</section>";
      return;
    }
    if (s.stage === "trial-escape-intro") {
      m.innerHTML = '<section class="tr-escape-intro"><p class="tr-kicker">ONE LIFE. EVERYONE WANTS IT.</p><h1>THE FINAL ESCAPE</h1><div class="tr-escape-rules"><p><b>JUDGE EVERY ITEM.</b> Each correct inclusion or exclusion moves you one stone.</p><p><b>STEAL A LIFE.</b> Ghosts get an extra choice. Pass the living counsel to take their life.</p><p><b>BREAK THE SEAL.</b> All three judgments must be correct at the exit. Stay ahead of the darkness.</p></div></section>';
      return;
    }
    if(s.stage==='trial-escape-question'){
      const caught=s.escape.caught[session.uid],count=session.uid===s.escape.soul&&!s.escape.gate?2:3;
      m.innerHTML=`<section class="tr-escape-question"><p class="tr-kicker">${caught?'THE DARKNESS CAUGHT YOU':s.escape.gate?'THE FINAL SEAL · ALL THREE MUST BE RIGHT':s.escape.soul===session.uid?'YOU HOLD THE LIFE · TWO JUDGMENTS':'GHOST COUNSEL · THREE JUDGMENTS'}</p><h1>${esc(s.escape.prompt)}</h1><div class="tr-escape-options">${s.escape.options.slice(0,count).map((o,i)=>`<article class="tr-judgment" data-judgment="${i}"><kbd>${String.fromCharCode(65+i)}</kbd><strong>${esc(o.text)}</strong><div><button data-escape="${i}" aria-pressed="false">YES</button><button data-escape-no="${i}" aria-pressed="false">NO</button></div></article>`).join('')}</div><button class="tr-primary tr-seal" data-tr-seal>SEAL MY JUDGMENTS ↵</button><p class="tr-own-status">Judge each item YES or NO, then press Enter.</p></section>`;
      m.querySelectorAll('[data-escape]').forEach(b=>b.onclick=()=>this.chooseEscape(Number(b.dataset.escape),true));m.querySelectorAll('[data-escape-no]').forEach(b=>b.onclick=()=>this.chooseEscape(Number(b.dataset.escapeNo),false));
      m.querySelector('[data-tr-seal]').onclick=()=>this.sealEscape();return;
    }
    if (s.stage === "trial-escape-run") {
      const steal = s.event.type === "life-steal";
      m.innerHTML = '<section class="tr-escape-reveal"><p class="tr-kicker">' + (steal ? "A GHOST PASSED THE LIVING" : "THE JUDGMENTS ARE IN") + '</p><h1 class="' + (steal ? "tr-life-stolen" : "") + '">' + (steal ? "LIFE STOLEN" : esc(s.players.find((p) => p.id === s.escape.soul).name) + " HOLDS THE LIFE") + '</h1><div class="tr-category-verdict">' + s.escape.reveal.map((o) => '<span class="' + (o.correct ? "tr-safe" : "tr-danger") + '">' + (o.correct ? "\u2713 " : "\xD7 ") + esc(o.text) + "</span>").join("") + "</div><p>" + esc(s.escape.prompt) + ' \xB7 <a href="' + esc(s.escape.source) + '" target="_blank" rel="noopener">SOURCE \u2197</a></p></section>';
      return;
    }
    if (s.stage === "trial-gate") {
      m.innerHTML = '<section class="tr-gate-beat"><p class="tr-kicker">FUTURE COUNSEL \xB7 THE FINAL SEAL</p><div class="tr-gate-keys">' + [0, 1, 2].map((i) => '<span style="--i:' + i + '">' + prop(0) + "</span>").join("") + "</div><h1>THREE JUDGMENTS.<br>ONE WAY OUT.</h1><p>At the barrier, every inclusion and exclusion must be right.</p></section>";
      return;
    }
    if (s.stage === "finish") {
      const winner = s.players.find((p) => p.id === s.result.winner);
      m.innerHTML = '<section class="tr-ending"><p class="tr-kicker">THE COURT HAS REACHED ITS VERDICT</p><h1>' + (winner ? esc(winner.name) + " ESCAPED" : "NO ONE ESCAPED") + '</h1><div class="tr-winner">' + (winner ? buddy(winner.buddy) : judge(1)) + "</div><p>" + (winner ? "The magistrate requests a rematch." : "The courthouse keeps its secrets. Try another defense.") + '</p><div class="tr-final-scores">' + s.result.rows.map((r) => '<div class="' + (r.escaped ? "tr-safe" : "") + '"><strong>' + esc(s.players.find((p) => p.id === r.id).name) + "</strong><span>" + cash(r.cash) + "</span><small>" + r.stats.correct + " RIGHT \xB7 " + r.stats.survived + " SURVIVED \xB7 " + r.stats.lifeSteals + " LIFE STEALS</small></div>").join("") + '</div><div class="tr-ending-actions">' + (session.host ? '<button class="tr-primary" data-tr-rematch>ANOTHER TRIAL \u21BB</button>' : "") + "<button data-tr-home>BACK TO THE HUB</button></div></section>";
      m.querySelector("[data-tr-rematch]")?.addEventListener("click", () => this.action("start"));
      m.querySelector("[data-tr-home]").onclick = () => this.leave();
      const share=document.createElement('button');share.textContent='COPY CASE FILE ↗';share.onclick=()=>navigator.clipboard?.writeText(`Trial by Puffer · ${winner?winner.name+' escaped':'The court won'}\n${s.result.rows.map(r=>s.players.find(p=>p.id===r.id).name+': '+cash(r.cash)+' · '+r.stats.correct+' right · '+r.stats.lifeSteals+' life steals').join('\n')}\nhttps://gavinleiner.github.io/councillion/#trial`).then(()=>{share.textContent='CASE FILE COPIED ✓';}).catch(()=>this.error('Clipboard access is unavailable.'));m.querySelector('.tr-ending-actions').append(share);
      return;
    }
  }
  solution(s) {
    const k = s.challenge.kind;
    if (k === "memory") return '<div class="tr-solution">THE TRUE CHAIN ' + values(s.challenge.solution).map((n) => prop(n)).join("") + "</div>";
    if (k === "cups") return '<div class="tr-poison-reveal">' + Array.from({ length: 6 }, (_, i) => '<span class="' + (values(s.challenge.solution).includes(i) ? "tr-poisoned" : "") + '">' + prop(2) + "<b>" + (i + 1) + "</b>" + (values(s.challenge.solution).includes(i) ? "<i></i><i></i><i></i>" : "") + "</span>").join("") + "</div>";
    return "";
  }
  challengeMarkup(s, session) {
    const m = this.main, k = s.challenge.kind, r = session.response?.trial, defendant = s.atRisk.includes(session.uid), role = r?.role ?? (defendant ? "defendant" : "gallery");
    let body = "", label = defendant ? "YOUR LIFE IS ON THE FLOOR" : role==='partner'?'YOU ARE THE DEAL PARTNER':role === "poisoner" ? "YOU HOLD THE POISON" : "THE GALLERY PLAYS TOO";
    if (k === "memory") body = '<div class="tr-chain" aria-label="Your evidence chain">' + Array.from({ length: s.challenge.size??5 }, (_, i) => '<span data-chain-slot="' + i + '"><small>' + (i + 1) + "</small></span>").join("") + '</div><div class="tr-evidence-picks">' + TRIAL_PROPS.map((name, i) => '<button data-evidence="' + i + '" data-index="'+i+'" aria-label="Add ' + name + '">' + prop(i) + "<small>" + name + "</small></button>").join("") + '</div><div class="tr-small-actions"><button data-chain-back>\u232B UNDO</button><button class="tr-primary" data-chain-seal disabled>SEAL THE CHAIN \u21B5</button></div>';
    if (k === "maths") body = '<div class="tr-math" aria-live="polite"></div>';
    if(k==='cups')body=defendant?`<p>The poison is locked. Choose your drink.</p><div class="tr-cups">${Array.from({length:6},(_,i)=>`<button data-cup="${i}" data-index="${i}">${prop(2)}<b>${i+1}</b><i>DRINK</i></button>`).join('')}</div>`:role==='poisoner'?`<div class="tr-poison-watch">${prop(2)}<strong>${!Number.isInteger(r?.poison)?'THE COURT LAID YOUR TRAP':'YOU POISONED CHALICE '+(r.poison+1)}</strong><p>The poison is sealed. Watch who drinks.</p></div>`:`<p>Who will drink poison? A correct prediction earns $500.</p><div class="tr-predictions">${[...s.atRisk,'none'].map((id,i)=>`<button data-cup-bet="${id}" data-index="${i}">${id==='none'?'NOBODY':esc(s.players.find(p=>p.id===id).name)}</button>`).join('')}</div>`;
    if (k === "greed") body = (defendant||role==='partner') ? '<div class="tr-pleas"><button data-plea="share">' + prop(4) + '<b>SHARE</b><small>Safe if nobody steals.</small></button><button data-plea="steal">' + prop(7) + "<b>STEAL</b><small>Beats sharers. Everyone stealing loses.</small></button></div>" : '<p>How many players in the deal will choose STEAL?</p><div class="tr-predictions">' + Array.from({ length: (s.challenge.partner?2:s.atRisk.length) + 1 }, (_, n) => '<button data-plea="' + n + '">' + n + "</button>").join("") + "</div>";
    if(k==='greed'&&s.challenge.partner)body=`<p class="tr-deal-pair">DEAL: ${esc(s.players.find(p=>p.id===s.atRisk[0])?.name)} × ${esc(s.players.find(p=>p.id===s.challenge.partner)?.name??'THE MAGISTRATE')}</p>`+body;
    if (k === "bids") body = defendant ? '<form class="tr-bid-form"><label for="tr-bid">YOUR SEALED BID \xB7 ' + cash(ownCash(s, session.uid)) + " AVAILABLE</label><div>" + prop(4) + '<input id="tr-bid" type="number" inputmode="numeric" min="0" max="' + Math.min(500, ownCash(s, session.uid)) + '" value="100" step="1"></div><input data-bid-slider type="range" min="0" max="' + Math.min(500, ownCash(s, session.uid)) + '" value="100" aria-label="Choose your bid"><button class="tr-primary" type="submit">SEAL MY BID \u21B5</button><small>Every bid is paid. '+(s.challenge.soloBail?'Match the hidden $100–$350 reserve.':'Lowest bid loses.')+' $500 maximum.</small></form>' : s.challenge.soloBail?'<p>Will the defendant post bail? A correct prediction earns $500.</p><div class="tr-predictions"><button data-bid-predict="yes" data-index="0">BAIL POSTED</button><button data-bid-predict="no" data-index="1">BAIL DENIED</button></div>':'<p>Who will submit the lowest bid? Correct predictions earn $500.</p><div class="tr-predictions">' + s.atRisk.map((id) => '<button data-bid-predict="' + id + '">' + esc(s.players.find((p) => p.id === id).name) + "</button>").join("") + "</div>";
    if (k === "pulse") body = '<div class="tr-balance-emblem">' + prop(4) + '</div><div class="tr-pulse-track" aria-label="Moving balance needle; stop in the gold center"><div class="tr-gold-band"></div><i class="tr-needle"></i><i class="tr-last-stop" hidden></i></div><button class="tr-primary tr-stop" data-tr-stop>STOP THE SCALES \xB7 SPACE</button><div class="tr-attempts"><i></i><i></i><i></i><strong>3 ATTEMPTS \xB7 BEST COUNTS</strong></div>';
    if(k==='dice')body=`<div class="tr-dice-stage"><div class="tr-dice-hero" data-dice-hero>${dieMarkup()}</div><div class="tr-dice-meter"><small>YOUR TOTAL</small><strong data-dice-total>0 <em>/ 8</em></strong><span data-dice-outcome>Reach eight. A one busts your run.</span></div></div><div class="tr-your-dice" aria-label="Your rolls"></div><div class="tr-dice-controls"><button class="tr-primary" data-dice-roll>ROLL · SPACE</button><button data-dice-bank disabled>BANK & SURVIVE ↵</button></div>`;
    if (k === "mirror") body = '<div class="tr-mirror-source"><span>ORIGINAL</span>' + gridMarkup(values(s.challenge.mirrorPattern)) + '<i>\u2192</i><span>ITS REFLECTION?</span></div><div class="tr-mirror-options">' + s.challenge.mirrorOptions.map((o, i) => '<button data-mirror="' + o.id + '" data-index="' + i + '">' + gridMarkup(o.cells) + "<kbd>" + String.fromCharCode(65 + i) + "</kbd></button>").join("") + "</div>";
    m.innerHTML = '<section class="tr-challenge tr-kind-' + k + '"><p class="tr-kicker">' + label + "</p><h1>" + esc(s.challenge.name) + "</h1>" + body + '<p class="tr-own-status">Your action stays private until the verdict.</p></section>';
    m.querySelectorAll("[data-evidence]").forEach((b) => b.onclick = () => {
      if (this.current.locked[session.uid] || this.currentSession.pending || this.chain.length >= (this.current.challenge.size??5)) return;
      this.chain.push(Number(b.dataset.evidence));
      this.paintChain();
    });
    m.querySelector("[data-chain-back]")?.addEventListener("click", () => {
      if (!this.current.locked[session.uid] && !this.currentSession.pending) {
        this.chain.pop();
        this.paintChain();
      }
    });
    m.querySelector("[data-chain-seal]")?.addEventListener("click", () => this.action("trial-play", { sequence: [...this.chain] }));
    m.querySelectorAll('[data-cup-bet]').forEach(b=>b.onclick=()=>this.action('trial-play',{choice:b.dataset.cupBet}));
    m.querySelectorAll("[data-cup]").forEach((b) => b.onclick = () => this.action("trial-play", { choice: Number(b.dataset.cup) }));
    m.querySelectorAll("[data-plea]").forEach((b) => b.onclick = () => this.action("trial-play", { choice: (defendant||role==='partner') ? b.dataset.plea : Number(b.dataset.plea) }));
    m.querySelector(".tr-bid-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.action("trial-play", { choice: Number(m.querySelector("#tr-bid").value) });
    });
    m.querySelector("#tr-bid")?.addEventListener("input", (e) => {
      m.querySelector("[data-bid-slider]").value = e.target.value;
    });
    m.querySelector("[data-bid-slider]")?.addEventListener("input", (e) => {
      m.querySelector("#tr-bid").value = e.target.value;
    });
    m.querySelectorAll("[data-bid-predict]").forEach((b) => b.onclick = () => this.action("trial-play", { choice: b.dataset.bidPredict }));
    m.querySelector("[data-tr-stop]")?.addEventListener("click", () => this.action("trial-play", {}));
    m.querySelector('[data-dice-roll]')?.addEventListener('click',()=>this.action('trial-play',{move:'roll'}));m.querySelector('[data-dice-bank]')?.addEventListener('click',()=>this.action('trial-play',{move:'bank'}));
    m.querySelectorAll("[data-mirror]").forEach((b) => b.onclick = () => this.action("trial-play", { choice: b.dataset.mirror }));
  }
  paintChain() {
    for (const [i, slot] of [...this.main.querySelectorAll("[data-chain-slot]")].entries()) slot.innerHTML = "<small>" + (i + 1) + "</small>" + (this.chain[i] !== void 0 ? prop(this.chain[i]) : "");
    const seal = this.main.querySelector("[data-chain-seal]");
    if (seal) seal.disabled = this.chain.length !== (this.current.challenge.size??5) || this.currentSession.pending || this.current.locked[this.currentSession.uid];
  }
  refreshControls(s, session) {
    if(this.waitForReceipt)return;
    const r = session.response?.trial, locked = !!s.locked?.[session.uid], spectator = !s.players.some((p) => p.id === session.uid && !p.spectator), pending = !!session.pending || spectator, status = this.main.querySelector(".tr-own-status"), ghost = s.players.find((p) => p.id === session.uid)?.alive === false;
    if (s.stage === "trial-question") {
      this.main.querySelectorAll("[data-choice]").forEach((b) => {
        b.disabled = locked || pending;
        b.classList.toggle("tr-chosen", r?.answer === b.dataset.choice);
      });
      if (status) status.textContent = pending ? "Sealing your answer\u2026" : locked ? "ANSWER SEALED \xB7 waiting for the court" : ghost ? "GHOST COUNSEL \xB7 you still earn $1,000 for a correct answer." : "A\u2013D or click. Your answer stays private.";
    }
    if(s.stage==='trial-escape-question'){
      if(locked&&Number.isInteger(r?.answer)){this.escapeMask=r.answer;this.escapeJudged=r.judged??((1<<(session.uid===s.escape.soul&&!s.escape.gate?2:3))-1);}
      this.paintEscape();
    }
    if(s.stage==='trial-brief'&&s.challenge.kind==='cups'){
      this.main.querySelectorAll('[data-poison]').forEach(b=>{b.disabled=pending;b.classList.toggle('tr-chosen',r?.poison===Number(b.dataset.poison));});
      if(status)status.textContent=r?.poison!==null&&r?.poison!==undefined?'TRAP SET · chalice '+(r.poison+1)+'. You may change it before the briefing ends.':'Choose a chalice to poison. Only you can see this.';
    }
    if (spectator && status) status.textContent = "WATCHING THIS TRIAL \xB7 You can take a seat in the next game.";
    if (s.stage !== "trial-challenge") return;
    if (locked && r?.sequence?.length === (s.challenge.size??5) && s.challenge.kind === "memory") {
      this.chain = [...r.sequence];
      this.paintChain();
    }
    if (locked && typeof r?.choice === "number" && s.challenge.kind === "bids") {
      const input = this.main.querySelector("#tr-bid");
      if (input) input.value = String(r.choice);
    }
    const kind = s.challenge.kind, editable = false, done = locked;
    if (kind === "maths" && r?.task) {
      const tk = r.task.index + ":" + r.task.prompt;
      if (tk !== this.taskKey) {
        this.taskKey = tk;
        this.main.querySelector(".tr-math").innerHTML = '<div class="tr-math-score"><strong>' + r.score + '</strong> MARKS <span class="' + (r.last === "wrong" ? "tr-danger" : "tr-safe") + '">' + (r.last === "wrong" ? "WRONG \xB7 \u22121" : r.last === "correct" ? "CORRECT \xB7 +1" : "") + "</span></div><h2>" + esc(r.task.prompt) + ' = ?</h2><div class="tr-answers">' + r.task.options.map((o, i) => '<button class="tr-option" data-math="' + o.id + '" data-index="' + i + '"><kbd>' + String.fromCharCode(65 + i) + "</kbd><span>" + esc(o.text) + "</span></button>").join("") + "</div>";
        this.main.querySelectorAll("[data-math]").forEach((b) => b.onclick = () => this.action("trial-play", { index: r.task.index, choice: b.dataset.math }));
      }
    }
    this.main.querySelectorAll("button,input").forEach((b) => {
      if(b.matches("[data-dice-roll],[data-dice-bank]"))return;
      if (b.matches("[data-chain-seal]")) b.disabled = done || pending || this.chain.length !== (s.challenge.size??5);
      else if (b.matches("[data-math]")) b.disabled = done || pending || session.now() < (r?.retryAt ?? 0);
      else b.disabled = done || pending;
    });
    if (status) status.textContent = pending ? "Sealing your choice\u2026" : kind === "maths" ? (r?.score ?? 0) + " marks \xB7 every wrong answer costs one." : kind === "pulse" ? (r?.attempts ?? 0) + " / 3 attempts \xB7 " + (r?.error !== null && r?.error !== void 0 ? "best precision " + Math.round((1 - r.error) * 100) + "%" : "aim for the gold center") : editable ? "Your poison is private. You can move it until time runs out." : done ? "CHOICE SEALED \xB7 the court will reveal everyone together." : "Your action stays private until the verdict.";
    for (const b of this.main.querySelectorAll("[data-cup]")) b.classList.toggle("tr-chosen", r?.choice === Number(b.dataset.cup));
    for (const b of this.main.querySelectorAll("[data-plea]")) b.classList.toggle("tr-chosen", String(r?.choice) === b.dataset.plea);
    for (const b of this.main.querySelectorAll("[data-mirror]")) b.classList.toggle("tr-chosen", r?.choice === b.dataset.mirror);
    for(const b of this.main.querySelectorAll('[data-cup-bet]'))b.classList.toggle('tr-chosen',r?.choice===b.dataset.cupBet);
    if(kind==='dice')this.paintDice(s,session);
    if (spectator && status) status.textContent = "WATCHING THIS TRIAL \xB7 You can take a seat in the next game.";
    if(kind==='pulse'&&r?.lastValue!==null&&r?.lastValue!==undefined){const mark=this.main.querySelector('.tr-last-stop');if(mark){mark.hidden=false;mark.style.left=r.lastValue*100+'%';mark.classList.toggle('tr-good-stop',Math.abs(.5-r.lastValue)<=.145);}if(this.pulseAttempt!==r.attempts){this.pulseAttempt=r.attempts;this.ping(Math.abs(.5-r.lastValue)<=.145?'safe':'wrong');}}
    if (kind === "pulse") this.main.querySelectorAll(".tr-attempts>i").forEach((el, i) => el.classList.toggle("used", i < (r?.attempts ?? 0)));
  }
  chooseEscape(index,yes){
    const s=this.current,session=this.currentSession;
    if(session.pending||s.locked[session.uid]||s.escape.caught[session.uid])return;
    const bit=1<<index;this.escapeJudged|=bit;this.escapeMask=yes?this.escapeMask|bit:this.escapeMask&~bit;this.error('');this.paintEscape();
  }
  sealEscape(){
    const count=this.currentSession.uid===this.current.escape.soul&&!this.current.escape.gate?2:3;
    if(this.escapeJudged!==(1<<count)-1){this.error('Judge every item YES or NO first.');return;}
    this.error('');this.action('trial-escape',{mask:this.escapeMask,judged:this.escapeJudged});
  }
  paintEscape(){
    const s=this.current,session=this.currentSession,locked=!!s.locked[session.uid],caught=s.escape.caught[session.uid],spectator=!s.players.some(p=>p.id===session.uid&&!p.spectator),count=session.uid===s.escape.soul&&!s.escape.gate?2:3;
    for(let i=0;i<count;i++){
      const decided=Boolean(this.escapeJudged&(1<<i)),yes=Boolean(this.escapeMask&(1<<i)),card=this.main.querySelector(`[data-judgment="${i}"]`);if(!card)continue;
      card.dataset.answer=decided?yes?'yes':'no':'waiting';for(const b of card.querySelectorAll('button')){const selected=b.hasAttribute('data-escape')?yes:!yes;b.setAttribute('aria-pressed',String(decided&&selected));b.disabled=locked||session.pending||caught||spectator;}
    }
    const seal=this.main.querySelector('[data-tr-seal]');if(seal)seal.disabled=locked||session.pending||caught||spectator;
    const status=this.main.querySelector('.tr-own-status');if(status)status.textContent=caught?'The darkness caught you. Watch the survivors.':locked?'JUDGMENTS SEALED · watch the race.':this.escapeJudged===(1<<count)-1?'READY TO SEAL · press Enter.':'YES or NO for each item · A–C toggles · Enter seals.';
  }
  paintDice(s,session){
    const r=session.response?.trial;if(!r)return;const key=(r.dice??[]).join(',');
    if(key!==this.diceKey){this.diceKey=key;const hero=this.main.querySelector('[data-dice-hero]');if(hero)hero.innerHTML=dieMarkup(r.dice?.at(-1)??0);const row=this.main.querySelector('.tr-your-dice');if(row)row.innerHTML=(r.dice??[]).map(n=>dieMarkup(n)).join('');if(hero&&r.dice?.length){hero.classList.remove('tr-dice-toss');void hero.offsetWidth;hero.classList.add('tr-dice-toss');this.ping(r.busted?'wrong':'roll');}}
    const controlKey=[key,r.score,r.busted,r.banked,session.pending,s.locked[session.uid],session.now()<(r.rollAt??0)+800].join(':');if(controlKey===this.diceControlKey)return;this.diceControlKey=controlKey;
    const total=this.main.querySelector('[data-dice-total]');if(total)total.innerHTML=String(r.score??0)+' <em>/ 8</em>';
    const outcome=this.main.querySelector('[data-dice-outcome]');if(outcome)outcome.textContent=r.busted?'BUST · rolled a one':r.banked?'BANKED · your run is safe':(r.score??0)>=8?'SAFE TOTAL · bank, or risk more for extra cash':'Reach eight. A one busts your run.';
    const roll=this.main.querySelector('[data-dice-roll]'),bank=this.main.querySelector('[data-dice-bank]'),done=!!s.locked[session.uid],cool=session.now()<(r.rollAt??0)+800,watching=!s.players.some(p=>p.id===session.uid&&!p.spectator);
    if(roll){roll.disabled=done||session.pending||cool||watching;roll.textContent=r.dice?.length?'ROLL AGAIN · SPACE':'ROLL · SPACE';}if(bank)bank.disabled=done||session.pending||cool||watching||(r.score??0)<8;
    const status=this.main.querySelector('.tr-own-status');if(status)status.textContent=r.busted?'Your run busted. The verdict will reveal everyone.':r.banked?'TOTAL BANKED · '+r.score+' · watch the other counsel.':(r.score??0)>=8?'BANK now, or roll for more. Your safe total auto-banks at the buzzer.':'SPACE to roll · reach 8 to bank · no more than 6 rolls.';
  }
  renderHUD(s,session){
    const box=this.root.querySelector('.tr-statusbar');if(!box)return;box.hidden=s.stage==='lobby'||s.stage==='finish';
    const own=s.players.find(p=>p.id===session.uid),actors=s.players.filter(p=>!p.spectator&&p.connected!==false&&p.online!==false&&!(s.part==='escape'&&s.escape.caught[p.id])),sealed=actors.filter(p=>s.locked[p.id]).length,phase=s.part==='escape'?2:['trial-brief','trial-watch','trial-challenge','trial-verdict'].includes(s.stage)?1:0;
    const html=`<span class="tr-personal ${own?.alive===false?'tr-safe-ghost':''}">${own?.alive===false?'◇ GHOST':'♥ LIVING'}<b>${cash(own?.cash)}</b></span><div class="tr-stage-map">${['TRIVIA','SURVIVAL','ESCAPE'].map((x,i)=>`<span class="${i===phase?'active':i<phase?'done':''}">${i+1} · ${x}</span>`).join('')}</div><span class="tr-sealed-count">${s.settleAt?'REVEALING…':sealed+' / '+actors.length+' SEALED'}</span>`;
    if(box.innerHTML!==html)box.innerHTML=html;
  }
  renderRoster(s, session) {
    if (s.part === "escape" || s.stage === "finish") {
      this.roster.hidden = true;
      return;
    }
    this.roster.hidden = false;
    const rows = s.players.filter((p) => !p.spectator), fingerprint = JSON.stringify([s.stage, s.atRisk, s.lastDeaths, rows.map((p) => [p.id, p.name, p.buddy, p.ready, p.alive, p.cash, p.online]), s.locked]);
    if (fingerprint === this.rosterKey) return;
    this.rosterKey = fingerprint;
    this.roster.innerHTML = rows.map((p, i) => '<article class="tr-seat ' + (p.alive === false ? "tr-is-ghost" : "") + " " + (p.id === session.uid ? "tr-is-you" : "") + ((s.atRisk??[]).includes(p.id)?" tr-is-risk":"") + '" data-sentenced="' + (s.stage === "trial-verdict" && s.lastDeaths?.includes(p.id)) + '" style="--seat:' + i + '"><span class="tr-seat-glow"></span><div class="tr-seat-character">' + buddy(p.buddy) + '</div><img class="tr-seat-stone" src="assets/party-platform-0.svg" alt=""><strong>' + esc(p.name) + (p.id === session.uid ? "<small>YOU</small>" : "") + '</strong><span class="tr-seat-cash">' + (s.stage === "lobby" ? p.ready ? "READY \u2713" : "WAITING" : cash(p.cash)) + '</span><span class="tr-seat-state">' + (s.stage === "lobby" ? "SEAT " + (i + 1) : s.locked[p.id] ? "SEALED \u2713" : p.alive === false ? "GHOST" : (s.atRisk??[]).includes(p.id) ? "ON TRIAL" : "LIVING") + "</span></article>").join("");
  }
  renderRace(s, session) {
    const rows = s.players.filter((p) => !p.spectator), key = s.matchId + ":" + rows.map((p) => p.id).join(",");
    if (this.race.dataset.key !== key) {
      this.race.dataset.key = key;
      this.race.innerHTML = '<div class="tr-race-label"><span>THE DARKNESS</span><span>THE EXIT \u2192</span></div><div class="tr-race-field"><div class="tr-race-dark"></div><div class="tr-exit-line"></div>' + rows.map((p, i) => '<div class="tr-race-lane" data-lane="' + p.id + '" style="--lane:' + i + '"><strong>' + esc(p.name) + '</strong><div class="tr-runner" data-runner="' + p.id + '">' + buddy(p.buddy) + "<b></b><i></i></div></div>").join("") + "</div>";
      this.race.style.setProperty("--lanes", String(rows.length));
    }
    const field = this.race.querySelector(".tr-race-field"), percent = (n) => Math.max(0, Math.min(100, 8 + n / (s.escape.goal + 3) * 84));
    if (s.stage === "trial-escape-run" && s.event?.type === "life-steal" && this.soulEvent !== s.matchId + ":" + s.event.id) {
      this.soulEvent = s.matchId + ":" + s.event.id;
      const from = rows.findIndex((p) => p.id === s.event.oldSoul), to = rows.findIndex((p) => p.id === s.event.soul), step = field.clientHeight / rows.length, x1 = percent(s.escape.positions[s.event.oldSoul]), x2 = percent(s.escape.positions[s.event.soul]), orb = document.createElement("i");
      orb.className = "tr-soul-orb";
      orb.style.left = x1 + "%";
      orb.style.top = from * step + 12 + "px";
      orb.style.setProperty("--dx", (x2 - x1) / 100 * field.clientWidth + "px");
      orb.style.setProperty("--dy", (to - from) * step + "px");
      orb.style.setProperty("--my", (to - from) * step / 2 - 35 + "px");
      orb.style.setProperty("--mx", (x2 - x1) / 200 * field.clientWidth + "px");
      field.append(orb);
      setTimeout(() => orb.remove(), 1800);
    }
    field.style.setProperty("--dark", percent(s.escape.dark) + "%");
    for (const p of rows) {
      const runner = this.race.querySelector('[data-runner="' + p.id + '"]'), row = s.escapeRows?.find((r) => r.id === p.id), soul = s.escape.soul === p.id;
      runner.style.left = percent(s.escape.positions[p.id] ?? 0) + "%";
      runner.classList.toggle("tr-runner-ghost", !soul);
      runner.classList.toggle("tr-runner-living", soul);
      runner.classList.toggle("tr-caught", !!s.escape.caught[p.id]);
      runner.querySelector("b").textContent = soul ? "LIVING" : "";
      runner.querySelector("i").textContent = s.stage === "trial-escape-run" && row ? "+" + row.marks : "";
      runner.closest(".tr-race-lane").classList.toggle("tr-lane-you", p.id === session.uid);
    }
  }
  paintClock() {
    const s = this.current, session = this.currentSession;
    if (!s || !session || !this.shellEl?.classList.contains("tr-game")) return;
    const left = Math.max(0, Math.min(s.deadline??0,s.settleAt||Infinity) - session.now()), duration = Math.max(1, (s.deadline ?? 0) - (s.stageAt ?? 0)), label = this.root.querySelector("[data-tr-timer]"), bar = this.root.querySelector(".tr-time b");
    const clockText = s.deadline ? (s.settleAt?"REVEAL IN ":"")+Math.ceil(left / 1e3)+" SEC" : "";
    if(label.textContent!==clockText)label.textContent=clockText;
    bar.style.transform = "scaleX(" + Math.min(1, left / duration) + ")";
    this.root.querySelector(".tr-time").classList.toggle("tr-time-low", left < 5e3 && left > 0);
    if (s.stage === "trial-brief") {
      const label2 = this.main.querySelector(".tr-brief>small");
      if (label2) label2.textContent = left <= 3e3 ? "STARTING IN " + Math.ceil(left / 1e3) : "Starts automatically. Read the rules; no ready button.";
    }
    if (s.stage === "trial-challenge" && s.challenge.kind === "pulse") {
      const elapsed = (session.now() - s.stageAt) % 2600 / 2600, wave = (1 - Math.cos(elapsed * Math.PI * 2)) / 2;
      const needle = this.main.querySelector(".tr-needle");
      if (needle) needle.style.left = wave * 100 + "%";
    }
    if(s.stage==='trial-challenge'&&s.challenge.kind==='dice')this.paintDice(s,session);
    if (s.stage === "trial-challenge" && s.challenge.kind === "maths") {
      const r = session.response?.trial;
      this.main.querySelectorAll("[data-math]").forEach((b) => b.disabled = !!session.pending || !s.players.some((p) => p.id === session.uid && !p.spectator) || !!s.locked[session.uid] || session.now() < (r?.retryAt ?? 0));
    }
  }
  keyboard(e) {
    if (this.disposed || !this.current || this.root.querySelector("dialog[open]") || e.ctrlKey || e.metaKey || e.altKey || e.repeat || e.target?.closest?.("input,textarea,select")) return;
    const s = this.current, letter = e.key.toUpperCase(), index = "ABCD".indexOf(letter) >= 0 ? "ABCD".indexOf(letter) : /^[1-8]$/.test(e.key) ? Number(e.key) - 1 : -1;
    if(s.stage==='trial-escape-question'&&index>=0&&index<3){e.preventDefault();this.chooseEscape(index,!Boolean(this.escapeMask&(1<<index)));return;}
    if(s.stage==='trial-challenge'&&s.challenge.kind==='dice'&&(e.code==='Space'||e.key==='Enter')){e.preventDefault();this.main.querySelector(e.code==='Space'?'[data-dice-roll]:not(:disabled)':'[data-dice-bank]:not(:disabled)')?.click();return;}
    if (e.code === "Space" && s.stage === "trial-challenge" && s.challenge.kind === "pulse") {
      e.preventDefault();
      this.main.querySelector("[data-tr-stop]:not(:disabled)")?.click();
      return;
    }
    if (e.key === "Enter") {
      const button = this.main.querySelector("[data-tr-seal]:not(:disabled),[data-chain-seal]:not(:disabled)");
      if (button) {
        e.preventDefault();
        button.click();
        return;
      }
    }
    if (e.key === "Backspace" && s.stage === "trial-challenge" && s.challenge.kind === "memory") {
      e.preventDefault();
      this.main.querySelector("[data-chain-back]:not(:disabled)")?.click();
      return;
    }
    if (index >= 0) {
      const b = this.main.querySelector('[data-index="' + index + '"]:not(:disabled)');
      if (b) {
        e.preventDefault();
        b.click();
      }
    }
  }
  async action(action, payload = {}) {
    if (!this.session || this.session.pending) return;
    this.voice.unlock();
    try {
      await this.session.request(action, payload);
      if(['trial-answer','trial-escape','trial-poison'].includes(action)||action==='trial-play'&&payload.sequence)this.ping('seal');
    } catch (e) {
      this.error(e.message);
    }
  }
  unlockSound() {
    try {
      const C = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (C && !this.audio) this.audio = new C();
      this.audio?.resume();
    } catch {
    }
  }
  ping(type) {
    if (!this.audio || this.audio.state !== "running") return;
    const frequency = type === "roll" ? 170 : type === "safe"?660:type === "wrong"?90:type === "seal"?160:type === "life-steal" ? 660 : type === "sentence" ? 100 : type === "answer" ? 420 : type === "finish" ? 740 : 220;
    const osc = this.audio.createOscillator(), gain = this.audio.createGain(), now = this.audio.currentTime;
    osc.type = "triangle";
    osc.frequency.setValueAtTime(frequency, now);
    osc.frequency.exponentialRampToValueAtTime(frequency * (type === "sentence" ? 0.5 : 1.4), now + 0.15);
    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.22);
    osc.connect(gain);
    gain.connect(this.audio.destination);
    osc.start(now);
    osc.stop(now + 0.23);
  }
  error(message) {
    const box = this.root.querySelector(".tr-error");
    if (box) {
      box.hidden = !message;
      box.textContent = message || "";
    }
  }
  async leave() {
    await this.session?.close();
    this.session = null;
    this.current = null;
    this.currentSession = null;
    this.lastKey = "";
    if (!this.disposed) {
      history.replaceState(null, "", "#trial");
      this.renderEntry();
    }
  }
  identityChanged(identity = this.identity(), preferences) {
    if (preferences) this.preferences = { ...preferences };
    if (this.session && !this.session.preview && (!identity || identity.id !== this.session.googleId)) {
      this.session.close();
      this.session = null;
    }
    if (!this.session) this.renderEntry();
  }
  destroy() {
    this.disposed = true;
    this.offRooms?.();
    this.session?.close();
    this.ambience?.dispose();
    this.voice.dispose();
    this.audio?.close();
    cancelAnimationFrame(this.frame);
    clearTimeout(this.sceneTimeout);
    document.removeEventListener("keydown", this.keyHandler);
  }
}
const ownCash = (s, id) => s.players.find((p) => p.id === id)?.cash ?? 0;
export {
  TrialView
};
