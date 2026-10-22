(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // auth-config.js
  var GOOGLE_CLIENT_ID = "312825866122-hmkjuk1841ph7goh85bgav06p73pjua6.apps.googleusercontent.com";

  // google-token.js
  var decode = (value) => Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=")), (c) => c.charCodeAt(0));
  async function verifyGoogleToken(token, { clientId, nonce: nonce2, keys, now = Date.now() / 1e3, cryptoApi = globalThis.crypto }) {
    const parts = String(token).split(".");
    if (parts.length !== 3) throw Error("Invalid Google response.");
    let header, payload;
    try {
      header = JSON.parse(new TextDecoder().decode(decode(parts[0])));
      payload = JSON.parse(new TextDecoder().decode(decode(parts[1])));
    } catch {
      throw Error("Invalid Google response.");
    }
    if (header.alg !== "RS256" || !header.kid) throw Error("Unsupported Google signature.");
    if (!clientId || payload.aud !== clientId || payload.azp && payload.azp !== clientId || !["accounts.google.com", "https://accounts.google.com"].includes(payload.iss)) throw Error("This sign-in belongs to a different app.");
    if (!Number.isFinite(payload.exp) || payload.exp <= now || !Number.isFinite(payload.iat) || payload.iat > now + 120 || typeof payload.sub !== "string" || !payload.sub || !nonce2 || payload.nonce !== nonce2) throw Error("This sign-in expired. Please try again.");
    const jwk = keys.find((k) => k.kid === header.kid && k.kty === "RSA" && (!k.alg || k.alg === "RS256"));
    if (!jwk) throw Error("Google updated its signing keys. Please try again.");
    const key = await cryptoApi.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    if (!await cryptoApi.subtle.verify("RSASSA-PKCS1-v1_5", key, decode(parts[2]), new TextEncoder().encode(parts[0] + "." + parts[1]))) throw Error("Google\u2019s signature could not be verified.");
    return { id: payload.sub, name: String(payload.name || payload.given_name || "Counsel").slice(0, 80), email: String(payload.email || "").slice(0, 200), expires: payload.exp };
  }

  // auth.js
  var gisPromise;
  var keyCache;
  var initialized = false;
  var current = null;
  var nonce = "";
  var googleCredential = "";
  var cloudModule;
  var cloud = () => cloudModule ??= import("./cloud.bundle.js");
  var tokenKey = "fc:google-session";
  function session(value) {
    try {
      if (value) sessionStorage.setItem(tokenKey, JSON.stringify(value));
      else sessionStorage.removeItem(tokenKey);
    } catch {
    }
  }
  function getSession() {
    try {
      return JSON.parse(sessionStorage.getItem(tokenKey));
    } catch {
      return null;
    }
  }
  async function googleKeys() {
    if (keyCache && keyCache.until > Date.now()) return keyCache.keys;
    const response = await fetch("https://www.googleapis.com/oauth2/v3/certs", { credentials: "omit" });
    if (!response.ok) throw Error("Google is temporarily unavailable. Try again.");
    const { keys } = await response.json();
    keyCache = { keys, until: Date.now() + Math.min(3600, Number(response.headers.get("cache-control")?.match(/max-age=(\d+)/)?.[1]) || 300) * 1e3 };
    return keys;
  }
  function loadGoogle() {
    if (globalThis.google?.accounts?.id) return Promise.resolve();
    return gisPromise ??= new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = resolve;
      script.onerror = () => {
        gisPromise = null;
        script.remove();
        reject(Error("Could not load Google sign-in. Check your connection and try again."));
      };
      document.head.append(script);
    });
  }
  function connectAccount({ button: button2, modal: modal2, escape, onIdentity = () => {
  }, beforeSignOut = async () => {
  } }) {
    const update = () => {
      button2.textContent = current ? "\u25CF " + current.name.split(" ")[0] : "SIGN IN";
      button2.setAttribute("aria-label", current ? "Open account for " + current.name : "Sign in with Google");
    };
    async function clearIdentity() {
      current = null;
      googleCredential = "";
      session(null);
      update();
      await beforeSignOut();
      if (cloudModule) await cloud().then((m) => m.logout()).catch(() => {
      });
      onIdentity(null);
    }
    async function accept(credential, expectedNonce) {
      const identity = await verifyGoogleToken(credential, { clientId: GOOGLE_CLIENT_ID, nonce: expectedNonce, keys: await googleKeys() });
      current = identity;
      googleCredential = credential;
      session({ credential, nonce: expectedNonce });
      update();
      onIdentity(identity);
      return identity;
    }
    async function open() {
      if (current && current.expires <= Date.now() / 1e3) await clearIdentity();
      if (current) {
        modal2(`<p class="eyebrow">YOUR COUNSEL PROFILE</p><h2>${escape(current.name)}</h2><p class="account-email">${escape(current.email)}</p><p class="muted">Connected with Google. Your dives and settings are saved in this browser. This sign-in does not sync progress between devices.</p><button class="pixel-button" id="google-signout">SIGN OUT</button><p class="fine-print"><a href="privacy.html" target="_blank" rel="noopener">Privacy & data</a></p>`);
        document.querySelector("#google-signout").onclick = async () => {
          await clearIdentity();
          globalThis.google?.accounts?.id.disableAutoSelect();
          open();
        };
        return;
      }
      modal2(`<p class="eyebrow">WELCOME TO THE COURT</p><h2>SIGN IN</h2><p>Connect your Google profile to Councillion.</p><div id="google-button" class="google-button"></div><p id="auth-status" class="notice" role="status">${GOOGLE_CLIENT_ID ? "Loading Google\u2026" : "Google sign-in is being configured."}</p><p class="muted">Your progress stays in this browser. You can keep playing as a guest.</p><p class="fine-print"><a href="privacy.html" target="_blank" rel="noopener">Privacy & data</a></p>`);
      if (!GOOGLE_CLIENT_ID) return;
      const status = document.querySelector("#auth-status"), mount = document.querySelector("#google-button");
      try {
        await loadGoogle();
        if (!mount.isConnected) return;
        if (!initialized) {
          nonce = Array.from(crypto.getRandomValues(new Uint8Array(24)), (v) => v.toString(16).padStart(2, "0")).join("");
          google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, nonce, auto_select: false, ux_mode: "popup", callback: async ({ credential }) => {
            const activeStatus = document.querySelector("#auth-status");
            if (activeStatus) activeStatus.textContent = "Checking your Google profile\u2026";
            try {
              await accept(credential, nonce);
              open();
            } catch (error) {
              if (activeStatus?.isConnected) activeStatus.textContent = error.message;
            }
          } });
          initialized = true;
        }
        google.accounts.id.renderButton(mount, { theme: "outline", size: "large", text: "signin_with", shape: "rectangular", width: Math.min(320, mount.clientWidth) });
        status.textContent = "";
      } catch (error) {
        status.textContent = error.message;
      }
    }
    button2.onclick = open;
    update();
    const saved = getSession();
    if (saved && GOOGLE_CLIENT_ID) accept(saved.credential, saved.nonce).catch(() => {
      session(null);
    });
    setInterval(() => {
      if (current && current.expires <= Date.now() / 1e3) clearIdentity().catch(() => {
      });
    }, 1e3);
    return { open, async partySession() {
      if (!current || current.expires <= Date.now() / 1e3) throw Error("Sign in with Google to play Puffer Party.");
      const m = await cloud();
      try {
        return await m.currentSession(current.id);
      } catch {
        return m.googleSession(googleCredential);
      }
    }, get identity() {
      return current && current.expires > Date.now() / 1e3 ? current : null;
    } };
  }

  // case-questions.js
  var slugs = ["miranda-v-arizona", "tarasoff-v-regents-of-the-university-of-california", "case-v-montana", "hamm-v-smith", "pennsylvania-v-mimms", "bush-v-gore", "rodriguez-vazquez-v-bostock", "brady-v-maryland", "mahanoy-area-school-district-v-b.l.", "walker-v-uber-technologies", "robinson-v-commonwealth", "colorado-v-connelly", "kyllo-v-united-states", "nolen-v-peopleconnect-inc", "talbot-v-ainuu", "jdb-v-north-carolina"];
  var names = ["Miranda v. Arizona", "Tarasoff v. Regents", "Case v. Montana", "Hamm v. Smith", "Pennsylvania v. Mimms", "Bush v. Gore", "Rodriguez Vazquez v. Bostock", "Brady v. Maryland", "Mahanoy v. B. L.", "Walker v. Uber", "Robinson v. Commonwealth", "Colorado v. Connelly", "Kyllo v. United States", "Nolen v. PeopleConnect", "Talbot v. Ainuu", "J.D.B. v. North Carolina"];
  var CASE_SOURCES = slugs.map((slug, i) => ({ name: names[i], url: "https://futurecounsel.org/case/" + slug }));
  var questions = [];
  function q(caseIndex, prompt, answer, distractors, explanation, category = "CASE FILE") {
    questions.push({ id: "fc-" + (caseIndex + 1) + "-" + questions.filter((q2) => q2.caseIndex === caseIndex).length, caseIndex, prompt, answer, distractors, explanation, category, source: CASE_SOURCES[caseIndex].url, caseName: names[caseIndex] });
  }
  q(
    0,
    "Why had the Arizona Supreme Court allowed Miranda\u2019s confession before the U.S. Supreme Court reversed?",
    "He had not specifically requested an attorney.",
    ["He had already received a complete warning.", "His confession was recorded before he entered custody.", "The confession was never introduced at trial."],
    "The review says Arizona relied on Miranda\u2019s failure to request counsel. The later ruling required safeguards before custodial questioning."
  );
  q(
    0,
    "Which sequence matches the Miranda review\u2019s background?",
    "Identification in a lineup, roughly two hours of questioning, then a signed confession.",
    ["A signed confession, then a lineup, then his first police interview.", "A warning and a lawyer, then two days of questioning.", "An anonymous tip, acquittal, then a signed confession on appeal."],
    "The background places the lineup before the interrogation and written confession, with no clear warning of the relevant rights."
  );
  q(
    0,
    "Which contrast best captures the Miranda review\u2019s majority\u2013dissent disagreement?",
    "Practical safeguards against interrogation pressure versus concern about restricting investigations.",
    ["Whether Miranda was in Arizona versus whether he was in federal custody.", "Whether a confession existed versus whether it was signed.", "A ban on all questioning versus a requirement to question every suspect."],
    "The majority wanted an advance, workable safeguard. The dissent worried the new rule was too rigid and would exclude reliable confessions."
  );
  q(
    0,
    "What did the Miranda decision actually do to the conviction described in the review?",
    "Reversed it because the custodial confession lacked the required safeguards.",
    ["Declared him factually innocent of every allegation.", "Upheld it because he never requested counsel.", "Replaced the prison sentence with an award of civil damages."],
    "The review reports reversal of the conviction, not a finding that Miranda was factually innocent."
  );
  q(
    1,
    "Why does the Tarasoff review distinguish a 5\u20132 judgment from a four-justice majority?",
    "Five agreed on the result, but only four fully joined the main opinion\u2019s reasoning.",
    ["Four voted to reverse and one voted to affirm.", "The fifth justice joined only the dissent.", "Only four justices participated in the case."],
    "One justice agreed with the outcome in part while disagreeing with some broader reasoning. Result and full agreement with an opinion are different."
  );
  q(
    1,
    "Which immunity distinction did the Tarasoff review draw?",
    "Immunity for failure to confine did not also provide immunity for failure to warn.",
    ["Immunity for failure to warn automatically covered failure to confine.", "The therapists had no governmental immunity for any act.", "Only the victim\u2019s parents received governmental immunity."],
    "The review separates psychiatric confinement from the failure to warn Tatiana or someone likely to warn her."
  );
  q(
    1,
    "What did Tarasoff\u2019s parents win at this stage, according to the review?",
    "The ability to pursue their claim against the therapists and Regents.",
    ["An automatic final finding that every defendant caused the death.", "A Supreme Court ruling that Poddar was not responsible.", "A rule requiring disclosure of every angry therapy comment."],
    "The court recognized a legally viable claim. It did not automatically decide the therapists were liable for Tatiana\u2019s death."
  );
  q(
    1,
    "Which relationship supported the possible duty to protect Tatiana even though she was not the patient?",
    "The therapists\u2019 professional relationship with Poddar.",
    ["Tatiana\u2019s previous contract with the Regents.", "A treatment relationship between Tatiana and Dr. Moore.", "The parents\u2019 employment relationship with campus police."],
    "The special relationship was with the person making the threat; a duty could extend to the identifiable person in danger."
  );
  q(
    2,
    "Which explanation of the result in Case v. Montana is most precise?",
    "The entry was upheld under emergency aid without adopting a broad community-caretaking power.",
    ["The Court adopted unrestricted community caretaking inside any home.", "The entry was upheld only after finding probable cause of a crime.", "The Court required a warrant despite the apparent emergency."],
    "The review emphasizes agreement with the result while narrowing the rationale to the emergency-aid exception."
  );
  q(
    2,
    "Which standard did the Case v. Montana review say controlled the emergency entry?",
    "An objectively reasonable basis to believe someone was seriously injured or facing serious injury.",
    ["Proof beyond a reasonable doubt that a crime had happened.", "Probable cause that the resident had violated a criminal statute.", "An officer\u2019s unreviewable personal feeling that entry might be useful."],
    "The question was the apparent need for urgent aid, not probable cause to investigate a crime or an officer\u2019s unsupported hunch."
  );
  q(
    2,
    "Which combination did Gavin\u2019s Case v. Montana review identify as supporting the apparent emergency?",
    "The 911 report, silence inside, empty holster, and possible note.",
    ["A visible injured neighbor, signed consent, and an open warrant.", "A traffic violation, expired license, and refusal to identify a driver.", "A noise complaint and evidence already seized during an earlier search."],
    "The review describes a cluster of observations supporting urgent aid. It does not describe a consent search or a traffic stop."
  );
  q(
    2,
    "What limit remained after the entry was upheld in Case v. Montana?",
    "Officers could address the emergency, not use it to justify an unrelated general search.",
    ["All rooms and devices became searchable for any crime.", "The emergency created permanent authority to reenter later.", "The resident lost all Fourth Amendment protection once the call was made."],
    "The review repeatedly ties the scope of the entry to the immediate emergency."
  );
  q(
    3,
    "What was the practical effect of the dismissal in Hamm v. Smith?",
    "The lower-court protection for Smith remained, without a new Supreme Court rule on multiple IQ scores.",
    ["Alabama won a new nationwide numerical cutoff.", "The Court resolved the IQ issue and ordered a new execution date.", "Smith lost the benefit of every lower-court ruling."],
    "Dismissing certiorari as improvidently granted left the lower result undisturbed while declining to decide the main question."
  );
  q(
    3,
    "Which evidence did the Hamm review distinguish from treating IQ scores as exact cutoffs?",
    "Testing uncertainty and evidence of adaptive functioning.",
    ["The jury\u2019s preferred execution method and the prison\u2019s budget.", "Only the single highest score, regardless of other evidence.", "A rule that a low score automatically erases the conviction."],
    "Smith\u2019s position involved more than one test number: measurement limits and functioning also mattered to the dispute."
  );
  q(
    3,
    "Which pairing matches the separate opinions described in Hamm?",
    "Sotomayor favored waiting for a better vehicle; Alito wanted the Court to clarify the law.",
    ["Sotomayor demanded a new IQ cutoff; Alito favored dismissal to avoid guidance.", "Both insisted the Court had already resolved the constitutional issue.", "Alito wrote that every death sentence involving IQ evidence was invalid."],
    "The review contrasts case suitability with the perceived need to resolve recurring confusion."
  );
  q(
    3,
    "Which earlier case supplied the constitutional premise behind Smith\u2019s claim?",
    "Atkins v. Virginia, which barred executing people with intellectual disabilities.",
    ["Miranda v. Arizona, which resolved the numerical IQ cutoff.", "Bush v. Gore, which required a new sentencing hearing.", "Pennsylvania v. Mimms, which excluded IQ evidence."],
    "The review identifies Atkins as the foundation, while Hamm concerned how a disability claim was evaluated."
  );
  q(
    4,
    "Which two-step distinction is essential to the Mimms review?",
    "A lawful stop supported ordering the driver out; the visible bulge separately supported the frisk.",
    ["An expired plate alone automatically authorized every search.", "The frisk had to happen before an officer could order the driver out.", "Ordering him out was unconstitutional even though the frisk was upheld."],
    "The exit order and the weapons pat-down had separate justifications. The review does not merge them into one automatic search power."
  );
  q(
    4,
    "Why did the Mimms majority characterize the exit order as a small added intrusion?",
    "Mimms was already lawfully stopped; the order changed where he waited.",
    ["He had signed a written waiver of all search rights.", "He had already been convicted of the traffic offense.", "No government instruction was involved."],
    "The majority balanced the incremental burden against officer safety, starting from an already lawful detention."
  );
  q(
    4,
    "What specific observation mattered to the pat-down in Mimms?",
    "A large bulge under his jacket that suggested he might be armed.",
    ["An expired plate by itself, with no other observation.", "His refusal to consent to a search of his home.", "An anonymous report about an unrelated person."],
    "The visible bulge provided a particular reason to suspect a weapon, separate from the traffic violation."
  );
  q(
    4,
    "What was Stevens\u2019s objection to the exit-order rule in Mimms, as the review describes it?",
    "It gave police an automatic additional power without a reason specific to that driver.",
    ["It prevented officers from conducting any lawful traffic stop.", "It required probable cause before police could see a license plate.", "It made a visible weapon irrelevant to every frisk."],
    "The dissent focused on individualized justification for the extra command, not on eliminating traffic enforcement."
  );
  q(
    5,
    "How does the Bush v. Gore review separate the justices\u2019 two voting alignments?",
    "Seven saw constitutional problems; five chose the remedy that ended the recount.",
    ["Five saw no constitutional problem; seven voted to continue indefinitely.", "All nine agreed that every manual recount was unconstitutional.", "Only two justices objected to inconsistent counting standards."],
    "Agreement that there was a problem did not produce the same agreement about what should happen next."
  );
  q(
    5,
    "What was defective about the recount process described in Bush v. Gore?",
    "Similar disputed ballots could receive different treatment across counties or recount teams.",
    ["The mere existence of any hand-counted ballot.", "A statewide rule requiring every disputed ballot to be rejected.", "A constitutional prohibition on asking what voters intended."],
    "The review focuses on inconsistent standards, including different judgments about chads, rather than a blanket rejection of manual counting."
  );
  q(
    5,
    "What reason did the majority give for ending rather than repairing the recount?",
    "It believed new statewide standards could not be implemented in time for Florida\u2019s December 12 deadline.",
    ["It had finished recounting every disputed ballot itself.", "It found that every county had used exactly the same standard.", "It held that the Constitution forbids states from correcting counting errors."],
    "The remedy turned on timing as well as the equal-protection problem."
  );
  q(
    5,
    "Which constitutional provision drove the counting-standard analysis in the Bush review?",
    "The Fourteenth Amendment\u2019s Equal Protection Clause.",
    ["The Fifth Amendment\u2019s custodial-warning rule.", "The Eighth Amendment\u2019s punishment clause.", "The Fourth Amendment\u2019s emergency-aid exception."],
    "The issue was equal treatment of similar ballots in the state\u2019s recount."
  );
  q(
    6,
    "What did the detained class obtain in Rodriguez Vazquez v. Bostock?",
    "Access to request bond under the applicable framework, not guaranteed release.",
    ["Automatic release without an immigration judge\u2019s review.", "Citizenship for everyone arrested inside the country.", "A ban on denying bond for danger or failure-to-appear risk."],
    "The review stresses the difference between an opportunity for individualized review and winning release."
  );
  q(
    6,
    "Which statutory distinction did the Rodriguez Vazquez review identify?",
    "Section 1225\u2019s no-bond position versus the generally applicable Section 1226 bond framework.",
    ["Section 1226\u2019s citizenship guarantee versus Section 1225\u2019s jury-trial guarantee.", "A choice between the First and Eighth Amendments only.", "Two sections that both necessarily required immediate release."],
    "The dispute concerned the detention framework for people arrested after living inside the country."
  );
  q(
    6,
    "How did the Rodriguez Vazquez majority read \u201Cseeking admission\u201D differently from the government?",
    "It focused on a person currently trying to enter, not everyone legally classified as an applicant forever.",
    ["It treated every long-term resident as physically waiting at the border.", "It said \u201Capplicant for admission\u201D could never describe anyone.", "It made the phrase turn only on whether someone owned a home."],
    "The review distinguishes a legal classification from what a person is actively doing when arrested."
  );
  q(
    6,
    "Which qualification prevents overstating the Rodriguez Vazquez result?",
    "Separate mandatory-detention rules and individual danger or flight-risk findings could still matter.",
    ["The result eliminated all detention powers nationwide.", "The ruling guaranteed bond without any hearing.", "The majority required judges to ignore criminal records."],
    "The review does not portray the decision as universal or unconditional release."
  );
  q(
    7,
    "Why did Brady receive a new punishment proceeding rather than a full new trial on guilt?",
    "Boblit\u2019s withheld confession could affect punishment without undoing Brady\u2019s murder guilt under Maryland law.",
    ["The withheld statement had nothing to do with either guilt or punishment.", "The Court found Brady had never taken part in the crime.", "Brady had already been acquitted before his appeal."],
    "The remedy tracked what the withheld evidence could change."
  );
  q(
    7,
    "Which distinction did the Brady review say did NOT determine whether withholding helpful material evidence was unfair?",
    "Whether the prosecutor hid it intentionally or by mistake.",
    ["Whether it could matter to guilt or punishment.", "Whether the evidence was favorable to the defendant.", "Whether the defense was deprived of evidence that could help."],
    "The focus was the deprivation of a fair opportunity, rather than requiring proof of a prosecutor\u2019s bad motive."
  );
  q(
    7,
    "What exactly was the evidence withheld in Brady\u2019s case?",
    "Boblit\u2019s statement that he had committed the actual killing.",
    ["A thermal image of Brady\u2019s house.", "A yearbook entry showing Brady\u2019s name.", "A warning that Brady had refused to sign."],
    "The review identifies a co-participant\u2019s statement as the missing evidence relevant to punishment."
  );
  q(
    7,
    "Which description best preserves the scope of the Brady rule stated in the review?",
    "Favorable evidence material to guilt or punishment must not be suppressed.",
    ["Only evidence that conclusively proves innocence must be shared.", "Evidence affecting punishment never has to be disclosed.", "The rule applies only when a prosecutor admits deliberate misconduct."],
    "The review includes material evidence affecting punishment, not only evidence that proves innocence outright."
  );
  q(
    8,
    "Which detail most undermined the school\u2019s disruption argument in Mahanoy?",
    "The evidence amounted to brief classroom discussion and upset cheerleaders, not substantial disruption.",
    ["B.L. had threatened a named student during a scheduled class.", "The school had documented weeks of canceled lessons.", "The post had been sent through an official assignment system."],
    "The review describes about five to ten minutes of discussion over a couple of days."
  );
  q(
    8,
    "Which conclusion would overstate the Mahanoy ruling described in the review?",
    "Schools can never address off-campus threats or serious targeted bullying.",
    ["B.L. prevailed on her particular suspension.", "The weekend, off-campus setting limited the school\u2019s authority.", "Her vulgar complaint did not justify this punishment on these facts."],
    "The review explicitly preserves room to address more serious off-campus conduct."
  );
  q(
    8,
    "Which combination matches the setting of B.L.\u2019s post?",
    "A weekend, away from school, using her own phone.",
    ["An exam, in a classroom, using a school-issued testing device.", "An official team meeting, using the coach\u2019s account.", "A school trip, under a teacher\u2019s immediate supervision."],
    "These surrounding facts mattered to how much regulatory authority the school could claim."
  );
  q(
    8,
    "Which opinion alignment appears in the Mahanoy review?",
    "Breyer wrote the majority; Thomas was the lone dissenter.",
    ["Thomas wrote the majority; Breyer was the lone dissenter.", "Scalia wrote for a unanimous Court.", "Sotomayor wrote a 5\u20134 opinion joined by no other justice."],
    "The review reports an 8\u20131 result for B.L. with those authorship details."
  );
  q(
    9,
    "What factual gap defeated Uber\u2019s arbitration argument against Carroll Walker?",
    "Sending the terms did not prove he had ever seen the offer or agreed to it.",
    ["Uber could not prove that Cheryl had ever ordered a ride.", "Carroll had accepted the terms but changed his mind after the crash.", "Every arbitration agreement was declared unlawful."],
    "The review distinguishes not reading known terms from not knowing terms were offered at all."
  );
  q(
    9,
    "Why did Cheryl\u2019s agreement not automatically force Carroll into arbitration in Walker?",
    "His crash-related negligence claims did not seek a benefit under her contract.",
    ["Spouses are legally incapable of entering any contract.", "Carroll had personally signed an agreement forbidding all lawsuits.", "The court decided no crash had occurred."],
    "The review keeps his independent claims separate from an attempt to enforce or benefit from Cheryl\u2019s contract."
  );
  q(
    9,
    "What did the Walker appeal leave unresolved?",
    "Whether Uber was actually responsible for Carroll\u2019s injuries.",
    ["Whether Uber had proved the particular agreement bound Carroll.", "Whether simply sending this message was enough in this dispute.", "Whether these claims could proceed in court rather than compelled arbitration."],
    "Winning the forum dispute did not establish liability for the accident."
  );
  q(
    9,
    "Which missing step in Uber\u2019s guest system mattered to the Walker reasoning?",
    "No required opening, acceptance, or confirmation of the terms by the guest rider.",
    ["No instruction to the driver to complete a criminal-background interview.", "No signature from every passenger\u2019s employer.", "No requirement that Cheryl repeat her order in writing at the courthouse."],
    "The review notes that Uber designed the system and could have required an actual acknowledgment."
  );
  q(
    10,
    "Which query best matches the limited search discussed in Robinson?",
    "A white BMW with black rims near one gas station during a short period.",
    ["Every place Robinson slept, worked, and worshipped for several years.", "Continuous live GPS tracking of every vehicle in Virginia.", "A thermal scan revealing details inside Robinson\u2019s home."],
    "The decision described a narrow database query of exterior car features visible on public roads."
  );
  q(
    10,
    "What distinction prevents treating Robinson as blanket approval of all future camera networks?",
    "The court considered a limited present system and left a much more extensive network open to different analysis.",
    ["The court ruled that public-road observations can never raise any privacy issue.", "It approved indefinite records of everyone\u2019s travel without qualification.", "It held that all camera systems are identical to one officer seeing a car once."],
    "Scope and aggregation were important limits in both the review\u2019s legal analysis and Gavin\u2019s opinion."
  );
  q(
    10,
    "How long did the Robinson review say Norfolk\u2019s camera data was retained?",
    "30 days.",
    ["24 hours.", "Five years.", "Permanently with no deletion."],
    "The review pairs a 30-day retention period with still images from particular locations, not uninterrupted travel monitoring."
  );
  q(
    10,
    "Which details did the Robinson court treat as exposed on public roads?",
    "The plate, the car\u2019s exterior, and its black rims.",
    ["Private conversations recorded inside the house.", "Every message on the driver\u2019s phone.", "The contents of a sealed backpack in the trunk."],
    "The narrow query used visible exterior features rather than the private contents in the distractors."
  );
  q(
    11,
    "Why did Connelly\u2019s mental illness alone not satisfy the majority\u2019s due-process test?",
    "The pressure had not been caused by coercive police conduct.",
    ["The Court found he had no mental illness.", "A confession is admissible only if it is shouted in a public place.", "Police had obtained a signed judicial order requiring him to confess."],
    "The review contrasts internal pressure with government coercion; it does not deny that his illness affected him."
  );
  q(
    11,
    "Which proof standard did the Connelly majority accept for a valid Miranda waiver?",
    "Preponderance of the evidence.",
    ["Beyond every possible doubt.", "A unanimous psychiatric panel with no legal review.", "Automatic validity whenever any words were spoken."],
    "The review explains the standard as more likely than not, rejecting Colorado\u2019s higher requirement."
  );
  q(
    11,
    "What additional concern did Brennan raise in the Connelly review beyond whether police behaved badly?",
    "The reliability of a hallucinating person\u2019s confession and the lack of independent physical corroboration in the described record.",
    ["Whether all confession evidence should automatically produce an acquittal.", "Whether Connelly had requested a contract with the police.", "Whether Miranda warnings were legally abolished."],
    "The dissent\u2019s concern included both meaningful choice and the risk of an unreliable confession."
  );
  q(
    11,
    "Which factual detail matters to the majority\u2019s account of how Connelly\u2019s confession began?",
    "He approached officers himself and was repeatedly told he could remain silent.",
    ["Police abducted him from a therapy session without speaking.", "He confessed only after a court ordered him to do so.", "Officers admitted creating the hallucinations."],
    "The review describes warnings and a self-initiated approach while still recognizing severe mental impairment."
  );
  q(
    12,
    "What did the thermal camera in Kyllo actually measure, as the review explains?",
    "Heat escaping from the home, rather than pictures of people or objects through the walls.",
    ["A clear video of everyone moving through the rooms.", "The contents of private phone calls.", "A physical sample taken from inside the attic."],
    "That limitation supported the government and dissent\u2019s argument, but did not resolve the majority\u2019s concern about interior privacy."
  );
  q(
    12,
    "Which combination matches the Kyllo majority\u2019s rule in the review?",
    "Technology not in general public use obtaining interior information otherwise requiring entry.",
    ["Any device outside a house is exempt because it never crosses a wall.", "Only technology that shows a person\u2019s face can count as a search.", "Information inside a home is protected only if a judge finds it interesting."],
    "The review emphasizes the device\u2019s availability and the otherwise inaccessible interior information."
  );
  q(
    12,
    "What happened after Kyllo won the search issue?",
    "The case was sent back to evaluate the warrant without the thermal-scan evidence.",
    ["The Court itself conducted a new thermal scan.", "Kyllo automatically won damages against every officer.", "The Court held that the remaining warrant evidence never needed review."],
    "The remand left a further question about the warrant\u2019s support once the scan was removed."
  );
  q(
    12,
    "What was Stevens\u2019s key contrast in Kyllo?",
    "Measuring heat already escaping outside versus observing activities inside.",
    ["A yearbook class action versus an arbitration clause.", "A school\u2019s weekend authority versus a traffic-stop frisk.", "A signed confession versus an unsigned handwritten note."],
    "The dissent considered the camera less invasive than technology that could reveal the interior directly."
  );
  q(
    13,
    "What did Nolen win in the appeal covered by Future Counsel?",
    "The ability to continue the class action, not a final ruling that PeopleConnect violated California law.",
    ["A final judgment that every yearbook scan is illegal.", "A ruling that every class member had already won damages.", "A declaration that Classmates.com could never be sued."],
    "The procedural question about proceeding as a group was distinct from ultimate liability."
  );
  q(
    13,
    "Which theory allowed the Nolen class dispute to be addressed on a common basis?",
    "Making people searchable was alleged to be the relevant use, even if each name had not actually been searched.",
    ["Every member had individually negotiated the same private contract.", "Only people with proof of an actual search could possibly remain in any class.", "Each person\u2019s claim concerned an unrelated website with a different business model."],
    "The court allowed the shared searchability theory to proceed without deciding whether it would ultimately succeed."
  );
  q(
    13,
    "How did the Nolen review describe handling possible individual class-membership problems?",
    "They could be addressed as the case developed instead of necessarily defeating the group at this stage.",
    ["The court had to award damages to everyone before examining membership.", "Any possible individual issue automatically required dismissing every claim.", "Individual issues were declared legally impossible in all class actions."],
    "The appeal did not settle every later issue of membership, proof, or liability."
  );
  q(
    13,
    "Which distinction makes the Nolen result particularly easy to overstate?",
    "Allowing a legal theory to be litigated is different from holding that the theory is correct.",
    ["Class certification and a final damages judgment are always the same event.", "The court ruled that no common evidence existed.", "The opinion concerned only whether printed yearbooks could be sold in stores."],
    "The review separates a class-certification decision from a merits decision."
  );
  q(
    14,
    "Which split accurately reflects the Talbot review?",
    "All three judges protected the racism statements; two also protected the assault statements.",
    ["All three found the assault accusation false as a matter of proven fact.", "All three agreed every allegation had to go to trial.", "Only one judge thought any challenged statement was protected."],
    "The disagreement over assault did not erase agreement on the racism statements."
  );
  q(
    14,
    "What separate request did Ainuu and The North Face fail to win in Talbot?",
    "Relief under Washington\u2019s anti-SLAPP law, despite keeping the underlying claims dismissed.",
    ["Permission to keep the defamation lawsuit dismissed.", "A ruling that every factual allegation had been proved true.", "A new criminal conviction against Talbot."],
    "A different two-judge majority viewed the posts as primarily a personal dispute for the anti-SLAPP question."
  );
  q(
    14,
    "Which context especially concerned Judge Nelson in Talbot?",
    "A later direct assault accusation on an Outdoor Research post could read as a factual criminal allegation.",
    ["A private contract that required arbitration of all yearbook claims.", "A police officer ordering a driver out of a vehicle.", "A thermal image that revealed no outdoor activity."],
    "Nelson would have let that part proceed; he was not deciding Talbot had already proved falsity."
  );
  q(
    14,
    "Why did disclosed descriptions of the encounter matter to the Talbot majority?",
    "Readers could assess Ainuu\u2019s interpretation from the underlying conduct he described.",
    ["They made every statement in every post automatically true.", "They proved Talbot had admitted a crime in court.", "They established that no reader could ever interpret an assault accusation factually."],
    "The majority read the challenged language in context rather than assuming undisclosed supporting facts."
  );
  q(
    15,
    "When must a child\u2019s age enter the custody analysis under the J.D.B. review?",
    "When officers know it or it would be apparent to a reasonable officer.",
    ["Only after the child has been convicted.", "Only if a parent submits a birth certificate during questioning.", "Never, because custody must always be judged as if everyone were an adult."],
    "The review describes an objective consideration of age, not speculation about every private thought."
  );
  q(
    15,
    "What did J.D.B. NOT obtain directly from the Supreme Court?",
    "A final decision that he was in custody and his confession must be thrown out.",
    ["A ruling that known or apparent age belongs in the analysis.", "A remand for the state courts to reconsider custody.", "A 5\u20134 decision rejecting the omission of his age."],
    "Winning the legal issue meant another custody analysis, not automatic suppression or a finding of innocence."
  );
  q(
    15,
    "Why did the assistant principal\u2019s presence matter differently for J.D.B. than for an adult visitor?",
    "As a student, he was accustomed to the official\u2019s disciplinary authority.",
    ["The assistant principal had already served as his criminal defense lawyer.", "The assistant principal could personally issue search warrants.", "Every adult visitor was legally required to obey the school\u2019s student discipline rules."],
    "The majority connected the setting to the perspective of a child subject to school authority."
  );
  q(
    15,
    "Why did the J.D.B. majority reject relying only on later voluntariness review?",
    "That later safeguard does not replace warnings required before a custodial interrogation.",
    ["Age is never relevant to voluntariness.", "A later review automatically guarantees that no confession can be used.", "The majority abolished all separate custody analysis."],
    "The review distinguishes assessing custody and giving advance warnings from later evaluating whether a confession was voluntary."
  );
  q(
    0,
    "In Gavin\u2019s Miranda opinion, why does explaining the right matter beyond the right merely existing?",
    "A person needs to know the protection exists to have a real opportunity to use it.",
    ["The warning guarantees every confession is factually accurate.", "Knowing rights prevents police from investigating any crime.", "Constitutional language itself proves every suspect understands it."],
    "Gavin supports making the protection usable in the interrogation room, while acknowledging the need to investigate serious crimes.",
    "GAVIN\u2019S TAKE"
  );
  q(
    1,
    "Which tension does Gavin expressly acknowledge even while siding with the Tarasoff majority?",
    "A disclosure duty may discourage honest therapy or deter treatment.",
    ["There is no meaningful value in therapy confidentiality.", "Every unusual remark must automatically be reported.", "The parents had already proved every defendant liable at trial."],
    "His opinion accepts the dissent\u2019s trust concern but favors reasonable protective steps for serious threats to identifiable people.",
    "GAVIN\u2019S TAKE"
  );
  q(
    2,
    "What makes Gavin\u2019s support for the Case v. Montana result cautious rather than unlimited?",
    "The facts suggested a genuine emergency, but mental-health interventions can escalate danger and the exception must stay narrow.",
    ["He thinks any vague welfare concern creates a permanent search license.", "He believes the Court found probable cause of a crime was always required.", "He rejects every emergency entry unless a warrant has already issued."],
    "His opinion points to the concrete warning signs while taking Sotomayor\u2019s escalation concern seriously.",
    "GAVIN\u2019S TAKE"
  );
  q(
    3,
    "Why does Gavin disagree with the dismissal in Hamm even though Smith retained his lower-court win?",
    "The Court left a recurring, life-or-death uncertainty unresolved after full argument.",
    ["He thought dismissal created a binding nationwide IQ cutoff.", "He wanted all adaptive-functioning evidence removed automatically.", "He believed the dismissal itself reversed Smith\u2019s lower-court relief."],
    "His criticism concerns the missed opportunity for guidance, not a mistaken claim that Smith lost the existing protection.",
    "GAVIN\u2019S TAKE"
  );
  q(
    4,
    "Which description fits Gavin\u2019s Mimms opinion?",
    "Cautious agreement with the majority while warning against unnecessarily aggressive traffic stops.",
    ["Unqualified approval of searching every driver and vehicle.", "Complete agreement that ordering any lawfully stopped driver out is forbidden.", "A claim that an expired plate alone made every frisk reasonable."],
    "He sees the safety rationale, but also recognizes that even an extra command can feel serious to a driver.",
    "GAVIN\u2019S TAKE"
  );
  q(
    5,
    "Where does Gavin draw the line between agreeing and disagreeing with Bush v. Gore?",
    "He supports a consistent statewide standard but would prefer repairing and continuing the recount.",
    ["He rejects consistent standards but fully supports ending the count.", "He thinks all manual counting is inherently unconstitutional.", "He says the Court proved what a completed recount would have shown."],
    "His opinion separates the valid concern about unequal standards from the decision to halt the process.",
    "GAVIN\u2019S TAKE"
  );
  q(
    6,
    "What distinction is central to Gavin\u2019s support for the Rodriguez Vazquez majority?",
    "Giving a judge the chance to consider bond does not automatically release the person.",
    ["A bond hearing must always result in release.", "Danger and failure-to-appear risk must never be considered.", "The ruling grants citizenship to the detained class."],
    "His opinion favors individual review while preserving the ability to continue detention when justified.",
    "GAVIN\u2019S TAKE"
  );
  q(
    7,
    "Why does Gavin say accidental suppression can still be unfair in Brady?",
    "The defendant still loses access to helpful evidence regardless of the prosecutor\u2019s intention.",
    ["A prosecutor\u2019s innocent mistake proves the defendant is guilty.", "Only a written admission of bad motive can make a trial unfair.", "Evidence affecting punishment never affects fairness."],
    "He focuses on the effect on the defense rather than making fairness depend only on the prosecutor\u2019s motive.",
    "GAVIN\u2019S TAKE"
  );
  q(
    8,
    "Which line does Gavin draw in his Mahanoy opinion?",
    "An immature off-campus complaint differs from threats or serious targeted online bullying.",
    ["A school can never address any online behavior.", "Disrespect alone automatically grants a school control over all speech.", "Every upset teammate proves substantial disruption."],
    "He supports B.L.\u2019s result without giving all off-campus conduct blanket protection.",
    "GAVIN\u2019S TAKE"
  );
  q(
    9,
    "Which comparison does Gavin use to explain his agreement in Walker?",
    "Clicking accept without reading differs from never knowing an agreement was being offered.",
    ["A spouse\u2019s contract automatically binds every other family member.", "Taking a ride necessarily proves the rider read every text message.", "Losing arbitration proves Uber caused the passenger\u2019s injuries."],
    "His review keeps notice and assent separate from the underlying negligence case.",
    "GAVIN\u2019S TAKE"
  );
  q(
    10,
    "What future development worries Gavin even though he understands Robinson\u2019s loss?",
    "A larger database could reconstruct a person\u2019s movements far beyond a narrow sighting.",
    ["Any single observation of a publicly visible car is automatically a home search.", "The existing case proved every future tracking network constitutional.", "Privacy depends only on whether a car has unusual rims."],
    "He distinguishes one limited query from the power to rebuild a person\u2019s travel history.",
    "GAVIN\u2019S TAKE"
  );
  q(
    11,
    "Which distinction drives Gavin\u2019s disagreement with the Connelly majority?",
    "Understanding the words of a warning can differ from being mentally capable of acting on them.",
    ["The officers deliberately created Connelly\u2019s illness.", "The Court found Connelly had never received a warning.", "Every confession following any illness is automatically false."],
    "He does not accuse these officers of coercion; he questions meaningful choice and reliability despite their lack of misconduct.",
    "GAVIN\u2019S TAKE"
  );
  q(
    12,
    "Which part of Kyllo\u2019s formulation does Gavin specifically question while supporting the result?",
    "Why technology becoming common should automatically make the home less private.",
    ["Why police did not receive unrestricted permission to scan every home.", "Why only interesting interior details should count as private.", "Why the Court treated every machine as capable of seeing through walls."],
    "He questions the general-public-use boundary and favors a principle that survives technological progress.",
    "GAVIN\u2019S TAKE"
  );
  q(
    13,
    "What is Gavin\u2019s position on Nolen\u2019s underlying claim after supporting class certification?",
    "The searchable subscription system deserves review, but he is not sure it ultimately makes the conduct illegal.",
    ["Class certification already proves PeopleConnect owes everyone damages.", "A public yearbook can never raise any issue when aggregated online.", "The court had decided that every actual search was unlawful."],
    "He recognizes that large-scale searchable aggregation differs from a book on a shelf without claiming the merits are settled.",
    "GAVIN\u2019S TAKE"
  );
  q(
    14,
    "What aspect of Nelson\u2019s concern resonates with Gavin in Talbot?",
    "A standalone assault accusation on a company\u2019s post may read as a factual allegation without the earlier context.",
    ["Losing a job automatically proves every defamation element.", "All descriptions of an argument should automatically be treated as crimes.", "Every challenged post had already been proved false by a jury."],
    "Gavin focuses on wording, placement, and what a reader is likely to understand, while avoiding a claim that Talbot already proved his case.",
    "GAVIN\u2019S TAKE"
  );
  q(
    15,
    "Which combination best captures Gavin\u2019s J.D.B. position?",
    "Consider a child\u2019s age and the school authority setting without treating youth as immunity from consequences.",
    ["Age should erase every possible consequence for a suspected burglary.", "School questioning should always be judged exactly like an adult\u2019s voluntary interview.", "The Court had already proved J.D.B. innocent and excluded every statement."],
    "His opinion defends a fair custody inquiry while recognizing the interests of people whose homes were broken into.",
    "GAVIN\u2019S TAKE"
  );
  var closeReadingDistractors = {
    "fc-1-0": [
      "He had signed a confession that specifically waived counsel before questioning.",
      "The court treated warnings as necessary only after charges were formally filed.",
      "The court found that questioning ended before he was placed in custody."
    ],
    "fc-1-1": [
      "Roughly two hours of questioning, a signed confession, then the identification lineup.",
      "A lineup, a warning about silence and counsel, then a signed confession.",
      "An identification lineup, an immediate written confession, then two hours of questioning."
    ],
    "fc-1-2": [
      "A safeguard applied only at trial versus a warning required only after a confession.",
      "A voluntary-confession rule limited to juveniles versus a rule limited to adults.",
      "A rule demanding counsel in every interview versus a rule making all warnings optional."
    ],
    "fc-1-3": [
      "Affirmed the conviction while requiring warnings only in future investigations.",
      "Ordered a new punishment proceeding while leaving the guilt determination untouched.",
      "Dismissed the appeal without resolving the custodial-warning issue."
    ],
    "fc-2-2": [
      "A final finding of liability against the therapists, with damages left for later.",
      "Permission to sue the Regents only, with the therapists dismissed from the case.",
      "A new confinement hearing, while the failure-to-warn theory was rejected."
    ],
    "fc-2-3": [
      "Tatiana\u2019s own treatment relationship with the university\u2019s psychiatric clinic.",
      "The Regents\u2019 contractual promise to warn every student about dangerous patients.",
      "The parents\u2019 special relationship with the university as prior medical patients."
    ],
    "fc-3-2": [
      "The 911 report, a visible injured resident, a loaded holster, and written consent.",
      "A possible gunshot, an answer at the door, and a note authorizing police entry.",
      "Silence inside, an outstanding search warrant, and a request to inspect for evidence."
    ],
    "fc-4-1": [
      "The average of every score, with adaptive functioning excluded once the average exceeded a cutoff.",
      "The single lowest score, treated as conclusive regardless of measurement uncertainty.",
      "The single highest score, treated as controlling despite other evidence of disability."
    ],
    "fc-4-2": [
      "Sotomayor favored a merits ruling now; Alito wanted dismissal for a clearer future case.",
      "Sotomayor and Alito both supported dismissal, but differed about its effect on the lower judgment.",
      "Sotomayor wanted to revisit Atkins itself; Alito wanted to affirm on adaptive functioning alone."
    ],
    "fc-4-3": [
      "Hall v. Florida was described as the decision that first created the entire execution ban.",
      "Terry v. Ohio supplied the Eighth Amendment rule about intellectual disability.",
      "Miranda v. Arizona was the source of the constitutional ban on these executions."
    ],
    "fc-5-0": [
      "A lawful stop automatically justified both the exit order and the later frisk.",
      "The jacket bulge was required to justify the exit order, but not the frisk.",
      "The exit order was valid only after consent, while the frisk followed automatically."
    ],
    "fc-5-2": [
      "His expired license plate alone, without a separate indication that he was armed.",
      "His refusal to exit before the officer issued any command to leave the vehicle.",
      "An object discovered only after the pat-down had already been completed."
    ],
    "fc-6-3": [
      "The Fourteenth Amendment\u2019s Due Process Clause, based on a right to unlimited recount time.",
      "The Elections Clause, based on a rule that only Congress can count state ballots.",
      "The First Amendment, based on whether a disputed chad counted as political speech."
    ],
    "fc-7-1": [
      "Section 1226\u2019s no-bond position versus Section 1225\u2019s generally available bond hearings.",
      "Two parts of Section 1225 that differed only about who could set the bond amount.",
      "Section 1226 for people physically arriving, with Section 1225 restricted to long-term residents."
    ],
    "fc-8-2": [
      "Boblit\u2019s statement that Brady personally committed the actual killing.",
      "A statement that neither defendant had been present when the killing occurred.",
      "A witness\u2019s statement retracting an identification of Brady as a participant."
    ],
    "fc-9-1": [
      "Schools retain the same authority over every off-campus complaint as over classroom speech.",
      "The result depended on a categorical rule that extracurricular discipline never implicates speech.",
      "Any off-campus post using vulgar language is protected even when it contains a targeted threat."
    ],
    "fc-9-2": [
      "An after-school activity on campus, using her own phone after a team meeting.",
      "A weekend away from school, using a school-managed team account.",
      "A school-supervised trip, using her own phone outside scheduled lesson time."
    ],
    "fc-9-3": [
      "Breyer wrote the majority; Alito alone dissented from the result.",
      "Sotomayor wrote the majority; Thomas alone dissented from the result.",
      "Thomas wrote the majority; Breyer alone dissented from the result."
    ],
    "fc-10-1": [
      "Cheryl\u2019s contract lacked any arbitration language that could apply to passenger injuries.",
      "Carroll could claim rights under Cheryl\u2019s agreement while rejecting only its arbitration provision.",
      "The agreement automatically covered Carroll, but arbitration was invalid for negligence claims."
    ],
    "fc-10-3": [
      "Guests had to open the message but were not required to read each paragraph aloud.",
      "Guests had accepted the terms, but Uber failed to obtain a second signature after the trip.",
      "The guest confirmed the offer, but the driver had not separately signed the guest\u2019s copy."
    ],
    "fc-11-0": [
      "A white BMW with silver rims across every Norfolk camera over the full retention period.",
      "A white BMW with black rims reconstructed continuously over several weeks.",
      "A black BMW with white rims near one gas station during a short period."
    ],
    "fc-11-2": [
      "14 days.",
      "60 days.",
      "90 days."
    ],
    "fc-11-3": [
      "The plate and exterior, together with a continuously recorded history of every trip.",
      "The plate and black rims, together with private messages recovered from the vehicle.",
      "The vehicle\u2019s exterior, together with a thermal measurement of the driver\u2019s home."
    ],
    "fc-12-1": [
      "Clear and convincing evidence, because a waiver must meet a higher civil burden.",
      "Beyond a reasonable doubt, because all waiver questions use the conviction standard.",
      "No burden on the state once a defendant can repeat the warning back."
    ],
    "fc-12-3": [
      "Officers approached him first, withheld warnings, and obtained an unsolicited confession.",
      "He approached officers, but they refused to explain his right to stop talking.",
      "He began talking only after officers promised that no statement would be used in court."
    ],
    "fc-13-0": [
      "Images of activity inside the rooms, although the camera itself stayed across the street.",
      "Heat escaping only from public electrical equipment, rather than from the house.",
      "Temperature readings obtained by an officer physically placing a sensor inside the house."
    ],
    "fc-13-3": [
      "The majority\u2019s home-protection rule versus a rule requiring a physical trespass in every case.",
      "The difference between heat from a home and heat from a vehicle, with both fully protected.",
      "The type of drugs suspected rather than whether the device gathered interior information."
    ],
    "fc-14-1": [
      "The theory required proof that every name had actually produced a subscription purchase.",
      "The court had already held that mere searchability conclusively established liability.",
      "The theory depended on separate proof that every person had refused an individual contract."
    ],
    "fc-14-3": [
      "The class ruling conclusively established liability but left the exact damages calculation open.",
      "The appeal resolved whether every plaintiff\u2019s name had actually been searched.",
      "Allowing the class required the court to reject any possible later membership challenges."
    ],
    "fc-15-2": [
      "A later assault accusation in the same explanatory thread, which Nelson viewed as opinion.",
      "A later accusation on an Outdoor Research post, which Nelson thought already proved falsity.",
      "An early racism statement, which Nelson would have excluded from the context entirely."
    ],
    "fc-16-0": [
      "Only if the officer has actual knowledge; apparent youth is categorically irrelevant.",
      "Whenever a child later reports feeling unusually nervous, even if age was not apparent.",
      "Only if a court has already decided the child\u2019s eventual confession was involuntary."
    ],
    "fc-16-2": [
      "The principal\u2019s authority mattered equally because adults and pupils face the same school discipline.",
      "The principal\u2019s presence alone conclusively proved police custody regardless of age or context.",
      "The principal was acting as counsel and therefore replaced the need for any Miranda warning."
    ],
    "fc-1-4": [
      "He supports warnings because they conclusively establish that every later statement is voluntary.",
      "He supports warnings mainly because they eliminate the need for police questioning altogether.",
      "He supports the dissent because unwarned suspects can invoke rights they have never been told about."
    ],
    "fc-2-4": [
      "He agrees with the majority because confidentiality should never protect any disturbing statement.",
      "He agrees with the dissent that preserving trust must always outweigh a specific credible threat.",
      "He accepts a duty only after a court has already found the patient liable for an attack."
    ],
    "fc-4-4": [
      "He objects because the dismissal created the strict IQ cutoff he believes the Court should avoid.",
      "He agrees that uncertainty is better left unresolved once one defendant retains lower-court protection.",
      "He objects because dismissing certiorari automatically removed Smith\u2019s existing protection."
    ],
    "fc-6-4": [
      "He would keep inconsistent local standards if that were the only way to finish the recount quickly.",
      "He supports stopping the recount because a consistent standard could never be legally created.",
      "He thinks the deadline resolved every fairness concern raised by ending the recount early."
    ],
    "fc-8-4": [
      "He would excuse accidental withholding whenever the prosecutor personally believed the trial was fair.",
      "He would require proof of deliberate concealment before considering any lost defense opportunity.",
      "He thinks evidence affecting only punishment cannot create the same fairness concern as evidence of guilt."
    ],
    "fc-10-4": [
      "He treats entering the car as equivalent to clicking accept after seeing a notice of the terms.",
      "He thinks a spouse\u2019s acceptance is enough even if the guest never learns that terms were offered.",
      "He agrees with the result mainly because arbitration clauses are always invalid after an accident."
    ],
    "fc-11-4": [
      "He thinks any one public sighting already reveals the same thing as an aggregated travel history.",
      "He supports a broad rule because all future camera networks can use the same narrow-query justification.",
      "He favors banning every license-plate camera because even the limited query was a home search."
    ],
    "fc-12-4": [
      "He thinks the absence of officer misconduct proves that a mentally ill person made a meaningful choice.",
      "He believes recognizing the warning\u2019s words necessarily establishes the capacity to act on them.",
      "He disagrees because the review says these particular officers deliberately created the pressure."
    ],
    "fc-13-4": [
      "He thinks only unusual technology deserves scrutiny and common equipment should always be exempt.",
      "He believes an interior detail loses protection if a court decides it is too uninteresting.",
      "He would decide the case only by how much the existing camera revealed, ignoring future capability."
    ],
    "fc-14-4": [
      "He believes the class ruling already establishes that searchable yearbooks necessarily violate the law.",
      "He supports certification only because every class member has already proved an actual name search.",
      "He rejects the distinction between one public yearbook and a searchable subscription database."
    ],
    "fc-15-4": [
      "He thinks earlier context always governs every later accusation, regardless of wording or placement.",
      "He believes losing a job proves falsity and therefore would award Talbot a final judgment now.",
      "He agrees that a reader must treat any assault accusation as opinion if racism was discussed earlier."
    ],
    "fc-16-4": [
      "He believes age should determine the outcome automatically, without considering restrictions on freedom.",
      "He thinks the remand already established innocence, so considering consequences is unnecessary.",
      "He believes later voluntariness review is enough and a child\u2019s age need not affect custody."
    ]
  };
  for (const item of questions) if (closeReadingDistractors[item.id]) item.distractors = closeReadingDistractors[item.id];
  var finalDistractors = {
    "fc-3-3": [
      "Officers could continue searching for evidence once the original welfare concern had been resolved.",
      "The scope depended only on the officer\u2019s stated intentions, regardless of what the emergency required.",
      "A reasonable initial entry removed the need to justify later investigative searches inside the home."
    ],
    "fc-4-0": [
      "The Court affirmed a new IQ-scoring rule and made the lower judgment binding nationwide.",
      "The dismissal vacated Smith\u2019s relief and required the lower courts to start over without Atkins.",
      "The Court rejected the disability claim on the merits while leaving only the conviction intact."
    ],
    "fc-5-1": [
      "The Court found that police had individualized suspicion of a weapon before giving any exit order.",
      "The Court treated the exit order as consensual because Mimms had not verbally objected to leaving.",
      "The Court held that an exit order imposed no government restraint at all after the original stop."
    ],
    "fc-5-3": [
      "It allowed a frisk based solely on a plate violation without any concern about a weapon.",
      "It prevented judges from considering officer safety when evaluating a lawful traffic stop.",
      "It treated the exit order as valid only because Mimms had consented to all further police commands."
    ],
    "fc-6-0": [
      "Seven favored ending the recount; five disagreed that inconsistent standards posed any problem.",
      "Five saw an equal-protection defect, but seven favored the deadline-based remedy that stopped counting.",
      "Seven agreed on the remedy, while only five believed the recount raised a constitutional issue."
    ],
    "fc-6-1": [
      "Every county used one uniform rule, but the Court found that rule categorically prohibited manual counting.",
      "The Court objected to manual recounts even if each disputed ballot would be treated under the same rule.",
      "The statewide intent standard was held unconstitutional solely because it involved examining voter intent."
    ],
    "fc-6-2": [
      "It believed the recount had already conclusively resolved every disputed ballot under consistent standards.",
      "It held that the state court lacked authority to create any uniform counting standard at any time.",
      "It believed repairing the rules would violate equal protection even if a valid recount could finish on time."
    ],
    "fc-7-0": [
      "A presumption of automatic release unless the government first proved a new criminal conviction.",
      "A bond hearing that judges were required to grant regardless of danger or risk of nonappearance.",
      "A ruling that everyone in the group was exempt from any separate mandatory-detention provision."
    ],
    "fc-7-2": [
      "It read the applicant classification as conclusive proof that a person remains actively seeking entry indefinitely.",
      "It focused on how long someone had lived inside the country without examining the statute\u2019s distinct phrases.",
      "It treated seeking admission as meaning any request for release from detention after an interior arrest."
    ],
    "fc-7-3": [
      "The bond framework prevented judges from considering any past conduct once a person had lived inside the country.",
      "The ruling required release whenever a detained person asked for bond, without an individualized assessment.",
      "Separate mandatory-detention provisions could not apply to anyone included in the court\u2019s interpretation."
    ],
    "fc-8-0": [
      "The withheld confession undermined guilt, but the Court left the punishment proceeding entirely untouched.",
      "The Court required the prosecution to dismiss the case because any suppression automatically establishes innocence.",
      "The Court found no constitutional violation but granted a new punishment hearing solely as a discretionary remedy."
    ],
    "fc-10-0": [
      "He received and knowingly accepted the offered terms, but Uber could not prove he had read each paragraph.",
      "The court treated every passenger injury claim as legally incapable of being subject to arbitration.",
      "The terms were rejected because Cheryl\u2019s account could never be used to arrange a guest ride at all."
    ],
    "fc-11-1": [
      "Any information once exposed publicly can be aggregated indefinitely without changing the constitutional analysis.",
      "The court resolved the constitutionality of all larger networks by treating them as identical to this narrow query.",
      "Only how the car looked mattered; the geographic scope, duration, and aggregation were expressly irrelevant."
    ],
    "fc-12-0": [
      "The Court found the illness irrelevant even if officers knowingly exploited it to produce the confession.",
      "The Court treated receiving a warning as conclusive proof of voluntariness regardless of any later police coercion.",
      "The Court required proof that the illness affected the confession but found no evidence that it did."
    ],
    "fc-12-2": [
      "Whether the officers had concealed their identities before Connelly began speaking.",
      "Whether the officers themselves had created the psychiatric pressure that led him to approach them.",
      "Whether his earlier incompetency finding automatically barred trial even after he regained competence."
    ],
    "fc-13-2": [
      "The Court held the thermal scan invalid but affirmed the warrant without reviewing the remaining evidence.",
      "The Court reversed the conviction outright after deciding that no other warrant evidence could possibly matter.",
      "The Court remanded only to decide whether the thermal device had become generally available after the search."
    ],
    "fc-14-0": [
      "A final liability judgment, with only the amount of damages left for the class to establish.",
      "A ruling that searchability alone conclusively violated California law for every person named in a yearbook.",
      "An order requiring each person to bring a separate case before any shared legal theory could be considered."
    ],
    "fc-14-2": [
      "Every individualized membership question had to be definitively resolved before any common theory could proceed.",
      "Any possible membership disagreement required denying certification even if later procedures could resolve it.",
      "Certification prevented the court from revisiting whether particular people properly belonged in the class."
    ],
    "fc-15-0": [
      "All three protected the assault statements, while two separately protected the racism statements.",
      "Two protected the racism statements, while the third would allow only the related employment claim to proceed.",
      "All three agreed that every challenged statement was protected on the same reasoning with no disagreement."
    ],
    "fc-15-1": [
      "A final declaration that the challenged factual allegations were true, rather than merely protected speech.",
      "Dismissal of the underlying claims, despite obtaining a separate award under the anti-SLAPP statute.",
      "A finding that all speech in the dispute necessarily addressed a public concern for every legal purpose."
    ],
    "fc-15-3": [
      "The descriptions conclusively proved the accusations true, so context no longer mattered to the ruling.",
      "They showed that readers had to assume additional undisclosed facts rather than form their own view.",
      "They made all later statements protected regardless of whether later readers could see the descriptions."
    ],
    "fc-16-3": [
      "The majority held that considering age at a later hearing made the timing of custodial warnings irrelevant.",
      "The majority decided that age could be used only at the voluntariness stage and therefore excluded it from custody.",
      "The majority treated custody and voluntariness as interchangeable questions requiring only one final ruling."
    ],
    "fc-3-4": [
      "He supports entry because a welfare concern is sufficient even without concrete evidence that aid is urgently needed.",
      "He supports the result but thinks the community-caretaking label should replace the narrower emergency-aid limit.",
      "He would require evidence of a crime rather than imminent injury before officers could provide emergency aid."
    ],
    "fc-5-4": [
      "He supports the majority because the exit order and any ensuing frisk are the same safety measure legally.",
      "He sides entirely with the dissent because he considers every exit order equivalent to a full vehicle search.",
      "He supports any added command during a stop once police invoke safety, without concern about aggression."
    ],
    "fc-7-4": [
      "He supports the majority because the hearing must result in release once a person requests individual review.",
      "He supports the result only if judges stop considering danger and the chance of returning to court.",
      "He thinks access to a hearing is too weak and argues that the ruling already eliminated detention for the class."
    ],
    "fc-9-4": [
      "He thinks every off-campus post should be immune even if it directly threatens a particular student.",
      "He agrees that immature language by itself establishes enough disruption to justify removing a student from a team.",
      "He would make the result depend only on the coach\u2019s annoyance rather than the setting or actual disruption."
    ]
  };
  for (const item of questions) if (finalDistractors[item.id]) item.distractors = finalDistractors[item.id];
  var CASE_QUESTIONS = Object.freeze(questions.map((q2) => Object.freeze({ ...q2, distractors: Object.freeze(q2.distractors) })));

  // endless-engine.js
  var ENDLESS_VERSION = 1;
  var SECRET = [0, 1, 2, 3, 0];
  function shuffleCopy(items, rng = Math.random) {
    const a = [...items];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function newEndless(bank, rng = Math.random) {
    return issueQuestion({ version: ENDLESS_VERSION, deck: [], keyTail: [], choiceTail: [], streak: 0, best: 0, wins: 0, answered: 0, correct: 0, cycle: 0, phase: "question", lastId: null }, bank, rng);
  }
  function issueQuestion(state, bank, rng = Math.random) {
    if (!state.deck.length) {
      state.deck = shuffleCopy(bank.map((q3) => q3.id), rng);
      state.cycle++;
      if (state.deck[0] === state.lastId && state.deck.length > 1) [state.deck[0], state.deck[1]] = [state.deck[1], state.deck[0]];
    }
    const id = state.deck.shift(), q2 = bank.find((q3) => q3.id === id);
    if (!q2) throw Error("Unknown case question");
    const options = shuffleCopy([q2.answer, ...q2.distractors], rng);
    let answer = options.indexOf(q2.answer);
    if (state.keyTail.length === 4 && state.keyTail.every((v, i) => v === SECRET[i]) && answer === SECRET[4]) {
      [options[0], options[1]] = [options[1], options[0]];
      answer = 1;
    }
    state.keyTail = [...state.keyTail, answer].slice(-4);
    state.current = { id, options, answer };
    state.lastId = id;
    state.selected = null;
    state.feedback = null;
    state.phase = "question";
    return state;
  }
  function answerEndless(state, index) {
    if (state.phase !== "question" || !Number.isInteger(index) || index < 0 || index > 3) return state;
    const correct = index === state.current.answer;
    state.answered++;
    if (correct) state.correct++;
    state.streak = correct ? state.streak + 1 : 0;
    state.best = Math.max(state.best, state.streak);
    state.choiceTail = [...state.choiceTail, index].slice(-5);
    const shortcut = state.choiceTail.length === 5 && state.choiceTail.every((v, i) => v === SECRET[i]);
    state.selected = index;
    state.feedback = { correct, shortcut };
    if (shortcut || state.streak === 5) {
      state.phase = "won";
      state.wins++;
    } else state.phase = "feedback";
    return state;
  }
  function continueEndless(state, bank, rng = Math.random) {
    if (state.phase === "question") return state;
    if (state.phase === "won") {
      state.streak = 0;
      state.choiceTail = [];
    }
    return issueQuestion(state, bank, rng);
  }
  function restoreEndless(raw, bank, rng = Math.random) {
    if (!raw || raw.version !== ENDLESS_VERSION || !Array.isArray(raw.deck) || !Array.isArray(raw.current?.options) || !bank.some((q3) => q3.id === raw.current.id) || raw.deck.some((id) => !bank.some((q3) => q3.id === id))) return newEndless(bank, rng);
    const q2 = bank.find((q3) => q3.id === raw.current.id);
    if (raw.current.options.length !== 4 || new Set(raw.current.options).size !== 4 || raw.current.options[raw.current.answer] !== q2.answer || raw.current.options.some((option) => ![q2.answer, ...q2.distractors].includes(option))) return newEndless(bank, rng);
    return raw;
  }

  // endless.js
  var esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  var letters = ["A", "B", "C", "D"];
  var CaseChallenge = class {
    constructor(app2, ocean2, { read: read2, save: save2 }) {
      this.app = app2;
      this.ocean = ocean2;
      this.save = save2;
      this.state = restoreEndless(read2("endless-run", null), CASE_QUESTIONS);
      this.state.depth ??= 0;
    }
    persist() {
      this.save("endless-run", this.state);
    }
    render() {
      const s = this.state, q2 = CASE_QUESTIONS.find((q3) => q3.id === s.current.id), answered = s.phase !== "question", won = s.phase === "won", secret = s.feedback?.shortcut;
      this.ocean.set("dive", s.depth);
      this.app.innerHTML = `<section class="case-screen" aria-label="Endless Future Counsel cases"><div class="dive-hud"><div class="hud-badge"><small>STREAK</small><strong>${s.streak}<span class="case-of"> / 5</span></strong></div><div class="dive-progress"><div class="case-streak" aria-label="${s.streak} of five consecutive correct answers">${Array.from({ length: 5 }, (_, i) => `<span class="${i < s.streak ? "filled" : ""}"></span>`).join("")}</div><small>ENDLESS CASES \xB7 ${s.wins} CLEARED</small></div><div class="hud-badge score-badge"><small>CASE</small><strong>${s.answered + (answered ? 0 : 1)}</strong></div></div>${won ? `<section class="case-victory"><p class="case-kicker">${secret ? "A SEALED MOTION" : "FIVE CONSECUTIVE RULINGS"}</p><h1>${secret ? "PASSAGE GRANTED" : "CASE CLOSED."}</h1><p>${secret ? "The court grants your motion." : "Five right in a row. You earned this descent."}</p><div class="case-victory-rule"></div><p class="case-victory-stats">${s.wins} ${s.wins === 1 ? "CHALLENGE" : "CHALLENGES"} CLEARED \xB7 ${s.correct} / ${s.answered} ANSWERS CORRECT</p><button class="pixel-button primary" data-case-next>KEEP DIVING \u221E</button><a href="#home">\u2191 BACK TO THE SURFACE</a></section>${secret ? `<div class="sealed-motion" role="status" aria-label="Secret passage granted"><div class="motion-ripple"></div><div class="motion-ripple second"></div><div class="motion-stamp"><small>UNDER SEAL</small><strong>MOTION<br>GRANTED</strong><span>\u2696</span></div><div class="motion-flash"></div></div>` : ""}` : `<section class="case-panel"><div class="case-meta"><span>${esc(q2.category)}</span><span>GET FIVE RIGHT IN A ROW</span></div><h1 id="case-question">${esc(q2.prompt)}</h1><div class="case-options" role="group" aria-labelledby="case-question">${s.current.options.map((option, i) => `<button class="case-option ${answered ? i === s.current.answer ? "correct" : i === s.selected ? "incorrect" : "unchosen" : ""}" data-case-choice="${i}" ${answered ? "disabled" : ""}><span class="choice-letter">${letters[i]}</span><span>${esc(option)}</span>${answered && i === s.current.answer ? '<b aria-label="Correct answer">\u2713</b>' : answered && i === s.selected ? '<b aria-label="Your incorrect answer">\xD7</b>' : ""}</button>`).join("")}</div>${answered ? `<div class="case-feedback ${s.feedback.correct ? "right" : "wrong"}" aria-live="polite"><p>${s.feedback.correct ? `${s.streak} / 5 \xB7 CORRECT` : "STREAK BROKEN \xB7 BACK TO ZERO"}</p><div>${esc(q2.explanation)}</div><a href="${q2.source}" target="_blank" rel="noopener">READ GAVIN\u2019S REVIEW \xB7 ${esc(q2.caseName)} \u2197</a><button class="pixel-button case-next" data-case-next>NEXT CASE \u2193 <small>ENTER</small></button></div>` : `<p class="case-controls-hint">A\u2013D or 1\u20134 to answer \xB7 no timer \xB7 one mistake resets the streak</p><p class="case-source-note">Close reading of ${CASE_SOURCES.length} Future Counsel reviews \xB7 ${CASE_QUESTIONS.length} shuffled questions \xB7 unlimited rounds</p>`}</section>`}</section>`;
      this.app.querySelectorAll("[data-case-choice]").forEach((b) => b.onclick = () => this.answer(Number(b.dataset.caseChoice)));
      this.app.querySelector("[data-case-next]")?.addEventListener("click", () => this.next());
      this.persist();
    }
    answer(index) {
      if (this.state.phase !== "question") return;
      answerEndless(this.state, index);
      if (this.state.feedback.correct) this.state.depth = Math.min(7e3, this.state.depth + 350);
      if (this.state.feedback.shortcut) this.state.depth = Math.min(7e3, this.state.depth + 1e3);
      if (this.state.feedback.correct || this.state.feedback.shortcut) this.ocean.celebrate();
      this.render();
    }
    next() {
      continueEndless(this.state, CASE_QUESTIONS);
      this.render();
      document.querySelector("#case-question")?.scrollIntoView({ block: "nearest", behavior: "instant" });
    }
    keydown(e) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.target.closest("input,textarea,select") || document.querySelector("#modal").open) return;
      const key = e.key.toUpperCase(), index = /^[A-D]$/.test(key) ? letters.indexOf(key) : /^[1-4]$/.test(key) ? Number(key) - 1 : -1;
      if (this.state.phase === "question" && index >= 0) {
        e.preventDefault();
        this.answer(index);
      } else if (this.state.phase !== "question" && key === "ENTER") {
        e.preventDefault();
        this.next();
      }
    }
    reset() {
      this.state = newEndless(CASE_QUESTIONS);
      this.state.depth = 0;
      this.render();
    }
  };

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
    const rows2 = sprites[key];
    const colors = key === "angler" ? { ...palette, b: "#9272da", y: "#b8a0ef" } : key === "bubbles" ? { ...palette, c: "#9cafcc" } : key === "squid" ? { ...palette, p: "#fa676b" } : palette;
    return `<svg class="tier-sprite ${classes}" viewBox="0 0 16 14" aria-hidden="true" shape-rendering="crispEdges">${rows2.flatMap((row, y) => [...row].flatMap((cell, x) => cell === "." ? [] : [`<rect x="${x}" y="${y}" width="1" height="1" fill="${colors[cell]}"/>`])).join("")}</svg>`;
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

  // depth-world.js
  var BIOMES = [
    { at: 0, name: "SUNLIT WATERS", color: "#81dfe3" },
    { at: 200, name: "THE TWILIGHT", color: "#80cbdc" },
    { at: 650, name: "MIDNIGHT RUINS", color: "#9eade0" },
    { at: 1500, name: "THE ABYSS", color: "#bc9ee3" },
    { at: 3e3, name: "HADAL DEPTHS", color: "#e0b87b" }
  ];
  var STOPS = [[0, 0], [200, 1.1], [650, 2.7], [1500, 5.2], [3e3, 8.4], [7e3, 14.5], [8e3, 16]];
  function depthDistance(depth, height) {
    const d = Math.max(0, Math.min(8e3, depth));
    for (let i = 1; i < STOPS.length; i++) if (d <= STOPS[i][0]) {
      const [a, x] = STOPS[i - 1], [b, y] = STOPS[i];
      return (x + (y - x) * (d - a) / (b - a)) * height;
    }
    return STOPS.at(-1)[1] * height;
  }
  var worldAtDepth = (depth, height) => height * 0.86 + depthDistance(depth, height);
  var cameraAtDepth = (depth, height) => worldAtDepth(depth, height) - height * 0.4;
  var depthScreenY = (depth, camera, height) => worldAtDepth(depth, height) - camera;
  function biomeAt(depth) {
    return [...BIOMES].reverse().find((b) => depth >= b.at) || BIOMES[0];
  }
  function sceneryBands(height) {
    return [
      { key: "shallow", top: height * 0.48, bottom: worldAtDepth(220, height), color: "#1a4e70", opacity: 1 },
      { key: "mid", top: worldAtDepth(180, height), bottom: worldAtDepth(1550, height), color: "#102d49", opacity: 0.91 },
      { key: "trench", top: worldAtDepth(1450, height), bottom: worldAtDepth(3100, height), color: "#10273b", opacity: 0.9 },
      { key: "hadal", top: worldAtDepth(2950, height), bottom: worldAtDepth(8e3, height) + height, color: "#171d37", opacity: 0.9 }
    ];
  }
  var LANDMARKS = [
    { at: 200, text: "LIGHT BEGINS TO FADE", side: 0 },
    { at: 450, text: "THE LAST SUNBEAMS", side: 1 },
    { at: 650, text: "MIDNIGHT RUINS", side: 0 },
    { at: 1050, text: "THE SUNKEN COURT", side: 1 },
    { at: 1500, text: "THE ABYSS", side: 0 },
    { at: 2100, text: "LIFE IN THE DARK", side: 1 },
    { at: 3e3, text: "THE HADAL ZONE", side: 0 },
    { at: 4300, text: "THE DEEP APPEAL", side: 1 },
    { at: 6e3, text: "ONE IN A COUNCILLION", side: 0 }
  ];
  var fallEase = (t) => {
    const x = Math.max(0, Math.min(1, t));
    return x * x * (3 - 2 * x);
  };
  var fallDuration = (distance) => Math.min(3800, 1800 + Math.sqrt(Math.abs(distance)) * 34);
  var fallPose = (progress) => Math.sin(Math.PI * Math.max(0, Math.min(1, progress)));

  // ocean.js
  var clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  var smooth = (a, b, v) => {
    const x = clamp((v - a) / (b - a));
    return x * x * (3 - 2 * x);
  };
  var Ocean = class {
    constructor(canvas) {
      this.metrics = new RenderMetrics();
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d", { alpha: false });
      this.images = {};
      this.files = { sky: "sky-law.png", shallow: "water-open.png", mid: "mid-law.png", trench: "trench-law.png", hadal: "hadal-pixel.png" };
      this.fall = null;
      this.fallProgress = 1;
      this.buddy = null;
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
      this.tiles = /* @__PURE__ */ new Map();
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
        this.tiles.clear();
        this.locateBuddy();
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
        this.tiles.delete(key);
        this.schedule();
      };
      img.src = "assets/" + this.files[key];
      this.images[key] = img;
    }
    suspend(value) {
      this.suspended = value;
      if (value) {
        cancelAnimationFrame(this.raf);
        this.raf = null;
      } else this.schedule();
    }
    schedule() {
      if (this.raf === null && !document.hidden && !this.suspended) this.raf = requestAnimationFrame(this.loop);
    }
    set(mode, depth = 0) {
      if (mode === this.mode && depth === this.depth) return;
      const changedMode = mode !== this.mode;
      this.mode = mode;
      this.depth = depth;
      const target = mode === "dive" ? cameraAtDepth(depth, this.h) : mode === "party" ? cameraAtDepth(0, this.h) : 0;
      this.fall = { from: this.visualDepth, to: depth, fromCamera: this.camera, toCamera: target, elapsed: 0, duration: fallDuration(target - this.camera) };
      if (mode === "home" || changedMode && mode !== "dive") this.fall.duration = 1600;
      this.fallProgress = 0;
      if (mode === "dive" || mode === "party") {
        this.load("shallow");
        this.load("mid");
        if (depth >= 900) this.load("trench");
        if (depth >= 2400) this.load("hadal");
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
    get targetCamera() {
      return this.mode === "dive" ? cameraAtDepth(this.depth, this.h) : this.mode === "party" ? cameraAtDepth(0, this.h) : 0;
    }
    snap(depth = 0) {
      this.fall = null;
      this.fallProgress = 1;
      this.visualDepth = depth;
      this.camera = this.mode === "dive" ? cameraAtDepth(depth, this.h) : 0;
      this.cacheKey = "";
      this.schedule();
    }
    glide(depth) {
      this.set("dive", depth);
      if (this.fall) this.fall.duration = 200;
    }
    celebrate() {
      this.burst = 1;
      this.schedule();
    }
    ready(key) {
      return this.images[key]?.complete && this.images[key]?.naturalWidth > 0;
    }
    loop(now) {
      this.raf = null;
      if (document.hidden) return;
      const moving = !!this.fall || Math.abs(this.depth - this.visualDepth) > 1 || Math.abs(this.targetCamera - this.camera) > 1, interval = moving ? 1e3 / 60 : 1e3 / 30;
      if (now - this.lastPaint < interval - 0.8) {
        this.schedule();
        return;
      }
      const dt = Math.min(0.1, (now - this.previous) / 1e3 || 0.033);
      this.previous = now;
      this.lastPaint += interval;
      if (now - this.lastPaint > interval) this.lastPaint = now;
      if (!this.reduced) this.time += dt * 0.42;
      if (this.fall) {
        const f = this.fall;
        f.elapsed += dt * 1e3;
        this.fallProgress = this.reduced ? 1 : Math.min(1, f.elapsed / f.duration);
        const ease = fallEase(this.fallProgress);
        this.visualDepth = f.from + (f.to - f.from) * ease;
        this.camera = this.mode === "dive" ? cameraAtDepth(this.visualDepth, this.h) + (f.fromCamera - cameraAtDepth(f.from, this.h)) * (1 - ease) : f.fromCamera + (f.toCamera - f.fromCamera) * ease;
        if (this.fallProgress >= 1) {
          this.visualDepth = f.to;
          this.camera = f.toCamera;
          this.fall = null;
        }
      }
      this.moveBuddy();
      this.burst = Math.max(0, this.burst - dt * 0.65);
      const started = this.metrics.enabled ? performance.now() : 0;
      this.draw(this.time);
      this.metrics.sample(started, now, this.ratio, this.cacheRebuilds);
      if (!this.reduced) this.schedule();
    }
    tile(band) {
      if (!this.ready(band.key)) return null;
      if (this.tiles.has(band.key)) return this.tiles.get(band.key);
      const edge = Math.round(this.h * 0.12), height = Math.ceil(band.bottom - band.top + edge * 2), tile = document.createElement("canvas");
      tile.width = this.w;
      tile.height = height;
      const c = tile.getContext("2d");
      c.imageSmoothingEnabled = false;
      c.fillStyle = band.color;
      c.fillRect(0, 0, this.w, height);
      c.globalAlpha = band.opacity;
      c.drawImage(this.images[band.key], 0, 0, this.w, height);
      c.globalAlpha = 1;
      const mask = c.createLinearGradient(0, 0, 0, height);
      mask.addColorStop(0, "#fff0");
      mask.addColorStop(edge / height, "#fff");
      mask.addColorStop(1 - edge / height, "#fff");
      mask.addColorStop(1, "#fff0");
      c.globalCompositeOperation = "destination-in";
      c.fillStyle = mask;
      c.fillRect(0, 0, this.w, height);
      if (band.key !== "shallow") {
        const sides = c.createLinearGradient(0, 0, this.w, 0);
        for (const [x, a] of [[0, 1], [0.18, 1], [0.34, 0], [0.66, 0], [0.82, 1], [1, 1]]) sides.addColorStop(x, `rgba(255,255,255,${a})`);
        c.fillStyle = sides;
        c.fillRect(0, 0, this.w, height);
      }
      c.globalCompositeOperation = "source-over";
      const entry = { canvas: tile, top: band.top - edge, height };
      this.tiles.set(band.key, entry);
      return entry;
    }
    environment() {
      const key = [this.mode, Math.round(this.camera), ...Object.keys(this.images).map((k) => Number(this.ready(k)))].join(":");
      if (key === this.cacheKey) return;
      this.cacheKey = key;
      this.cacheRebuilds++;
      const c = this.background, W = this.w, H = this.h, surface = H * 0.48 - this.camera;
      c.globalAlpha = 1;
      const water = c.createLinearGradient(0, surface, 0, worldAtDepth(8e3, H) - this.camera);
      for (const [d, color] of [[0, "#225b7c"], [200, "#173b59"], [650, "#132e4b"], [1500, "#112d42"], [3e3, "#1b243b"], [8e3, "#152038"]]) water.addColorStop((worldAtDepth(d, H) - H * 0.48) / (worldAtDepth(8e3, H) - H * 0.48), color);
      water.addColorStop(0, "#286886");
      c.fillStyle = water;
      c.fillRect(0, 0, W, H);
      if (surface > 0) {
        const sky = c.createLinearGradient(0, -this.camera, 0, surface);
        sky.addColorStop(0, "#86ccdd");
        sky.addColorStop(1, "#dcefeb");
        c.fillStyle = sky;
        c.fillRect(0, 0, W, Math.min(H, surface));
        if (this.ready("sky")) {
          const image = this.images.sky, scale = Math.max(W / image.naturalWidth, H * 0.48 / image.naturalHeight), w = image.naturalWidth * scale, h = image.naturalHeight * scale;
          c.save();
          c.beginPath();
          c.rect(0, 0, W, Math.min(H, surface));
          c.clip();
          c.drawImage(image, (W - w) / 2, surface - h, w, h);
          c.restore();
        }
      }
      if (this.mode === "home" || this.mode === "summary") {
        const sea = c.createLinearGradient(0, surface, 0, H);
        sea.addColorStop(0, "#194760");
        sea.addColorStop(1, "#102c47");
        c.fillStyle = sea;
        c.fillRect(0, Math.max(0, surface), W, H - Math.max(0, surface));
      } else {
        c.save();
        c.beginPath();
        c.rect(0, Math.max(0, surface), W, H - Math.max(0, surface));
        c.clip();
        for (const band of sceneryBands(H)) {
          if (band.bottom + H * 0.12 < this.camera || band.top - H * 0.12 > this.camera + H) continue;
          this.load(band.key);
          const tile = this.tile(band);
          if (tile) c.drawImage(tile.canvas, 0, Math.round(tile.top - this.camera));
        }
        c.restore();
      }
      if (this.mode === "summary") {
        c.fillStyle = "#0c1d3099";
        c.fillRect(0, 0, W, H);
      }
    }
    draw(t) {
      const c = this.ctx, W = this.w, H = this.h, d = this.visualDepth, surface = H * 0.48 - this.camera, mid = smooth(200, 650, d), hadal = smooth(2800, 3300, d);
      this.environment();
      c.globalAlpha = 1;
      c.drawImage(this.backdrop, 0, 0);
      c.save();
      c.beginPath();
      c.rect(0, Math.max(0, surface), W, H - Math.max(0, surface));
      c.clip();
      this.fishSchool(t, d, mid);
      const wake = this.burst * 12;
      for (let i = 0; i < (this.mode === "home" ? 14 : 26); i++) {
        const x = (i * 127.73 + Math.sin(t * 0.28 + i) * 9 + W * 2) % W, y = ((i * 83.41 - t * (3 + i % 5 + wake) - this.camera * 0.55) % (H + 50) + (H + 50)) % (H + 50) - 20;
        c.fillStyle = `rgba(${hadal > 0.4 ? "194,162,226" : "157,214,229"},${0.09 + i % 5 * 0.035})`;
        const size = i % 13 === 0 ? 3 : 1;
        c.fillRect(Math.round(x), Math.round(y), size, size);
        if (wake > 4 && i % 2 === 0) {
          c.fillStyle = "#9dc9e41a";
          c.fillRect(Math.round(x), Math.round(y) + 4, 1, Math.min(22, wake * 0.3));
        }
      }
      if (d > 600) this.glowLife(t, d, hadal);
      c.restore();
      if (this.mode === "dive") {
        this.lantern(t);
        this.depthDetails();
      }
      if (surface > -10 && surface < H + 8) {
        for (let row = 0; row < 7; row++) {
          c.fillStyle = row < 2 ? "#c4ede9" : "#69bbcd";
          c.globalAlpha = (1 - row / 8) * 0.58;
          for (let x = -20; x < W + 20; x += 23 + row * 7) {
            const length = 7 + (Math.sin(x * 0.019 + t * 0.8 + row) + 1) * 13, y = Math.round(surface + row * 2 + Math.sin(x * 0.024 + t * 1.2 + row) * 1.3);
            c.fillRect(Math.round(x + Math.sin(t * 0.6 + row) * 8), y, Math.round(length), 1);
          }
        }
        c.globalAlpha = 1;
      }
    }
    attachBuddy(node) {
      this.buddy = node;
      this.locateBuddy();
    }
    locateBuddy() {
      if (!this.buddy?.isConnected) return;
      const box = this.buddy.getBoundingClientRect();
      this.buddyOrigin = { x: box.x + box.width * 0.94, y: box.y + box.height * 0.23 };
    }
    moveBuddy() {
      if (!this.buddy?.isConnected) return;
      const pose = this.reduced ? 0 : fallPose(this.fallProgress);
      this.buddyDrop = pose * Math.min(80, this.h * 0.11);
      this.buddy.style.setProperty("--fall-drop", this.buddyDrop.toFixed(1) + "px");
      this.buddy.style.setProperty("--fall-angle", (pose * 16).toFixed(1) + "deg");
    }
    lantern(t) {
      if (!this.buddy?.isConnected || !this.buddyOrigin) return;
      const c = this.ctx, d = this.visualDepth, strength = smooth(150, 900, d), x = this.buddyOrigin.x, y = this.buddyOrigin.y + (this.buddyDrop || 0);
      if (strength < 0.01) return;
      const radius = Math.min(220, this.w * 0.25), pulse = this.reduced ? 1 : 1 + Math.sin(t * 1.2) * 0.035;
      c.save();
      c.globalCompositeOperation = "screen";
      const halo = c.createRadialGradient(x, y, 3, x, y, radius * pulse);
      halo.addColorStop(0, `rgba(224,239,177,${0.26 * strength})`);
      halo.addColorStop(0.18, `rgba(124,210,222,${0.14 * strength})`);
      halo.addColorStop(0.6, `rgba(75,157,190,${0.065 * strength})`);
      halo.addColorStop(1, "rgba(47,113,159,0)");
      c.fillStyle = halo;
      c.fillRect(x - radius - 10, y - radius - 10, radius * 2 + 20, radius * 2 + 20);
      c.restore();
    }
    depthDetails() {
      const c = this.ctx, W = this.w, H = this.h, right = W - (W < 600 ? 14 : 24);
      c.save();
      c.fillStyle = "#a5c5d944";
      c.fillRect(right, 96, 1, H - 236);
      c.font = "11px VT,monospace";
      c.textAlign = "right";
      for (let d = 0; d <= 7500; d += 50) {
        const y = depthScreenY(d, this.camera, H);
        if (y < 100 || y > H - 145) continue;
        const major = d % 100 === 0;
        c.fillStyle = major ? "#a5c5d970" : "#a5c5d936";
        c.fillRect(right - (major ? 12 : 5), Math.round(y), major ? 12 : 5, 1);
        if (major && Math.abs(y - H * 0.4) > 18) c.fillText(d.toLocaleString() + "m", right - 17, Math.round(y) + 4);
      }
      c.fillStyle = "#ec8faf";
      c.fillRect(right - 15, Math.round(H * 0.4), 15, 1);
      c.fillText("YOU", right - 20, Math.round(H * 0.4) + 4);
      c.font = (W < 600 ? "10" : "12") + "px VT,monospace";
      for (const mark of LANDMARKS) {
        const y = depthScreenY(mark.at, this.camera, H);
        if (y < 120 || y > H - 160) continue;
        const x = mark.side ? W * 0.81 : W * 0.16;
        c.textAlign = mark.side ? "right" : "left";
        c.fillStyle = "#8bb4c980";
        c.fillText((mark.side ? "" : "\u2500\u2500  ") + mark.text + (mark.side ? "  \u2500\u2500" : ""), x, Math.round(y));
      }
      c.restore();
    }
    fishSchool(t, d, mid) {
      const c = this.ctx;
      for (let i = 0; i < (this.mode === "home" ? 4 : 7); i++) {
        const dir = i % 2 ? 1 : -1, scale = 0.65 + i % 4 * 0.2, x = (i * 179 + t * dir * (7 + i % 3) + this.w * 8) % (this.w + 100) - 50, y = this.h * 0.2 + ((i * 73 - this.camera * 0.8) % (this.h * 0.7) + this.h * 0.7) % (this.h * 0.7);
        c.save();
        c.translate(Math.round(x), Math.round(y + Math.sin(t + i) * 2));
        c.scale(dir * scale, scale);
        c.globalAlpha = mid > 0.6 ? 0.3 : 0.24;
        c.fillStyle = mid > 0.6 ? "#3e7894" : "#051d32";
        const tail = Math.sin(t * 5 + i) > 0 ? 1 : 0;
        const rows2 = [[8, 0, 7, 1], [4, 1, 16, 1], [2, 2, 21, 1], [1, 3, 24, 2], [2, 5, 21, 1], [4, 6, 16, 1], [8, 7, 7, 1]];
        for (const r of rows2) c.fillRect(...r);
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

  // expanded-banks.js
  var rows = [[{ "id": "word-isograms", "family": "words", "topic": "NO LETTER TWICE", "prompt": "Name a ten-letter English word with no repeated letter. Inflections count; proper names do not.", "source": "ENABLE word list (Mendel Cooper), public domain; exact letter filter.", "ranking": "familiarity-v1" }, [["abductions", 60, []], ["abductores", 85, []], ["abjections", 85, []], ["abortively", 85, []], ["abridgment", 85, []], ["abruptions", 85, []], ["absolutive", 85, []], ["absolutize", 85, []], ["absorptive", 85, []], ["achondrite", 85, []], ["adenovirus", 85, []], ["adipocytes", 85, []], ["adjunctive", 85, []], ["admixtures", 85, []], ["admonisher", 85, []], ["adoptively", 85, []], ["adsorptive", 85, []], ["advections", 85, []], ["afterglows", 85, []], ["aftershock", 30, []], ["aitchbones", 85, []], ["algorithms", 60, []], ["alpenstock", 85, []], ["ambrotypes", 85, []], ["amphiboles", 85, []], ["amphoteric", 85, []], ["amplidynes", 85, []], ["amplitudes", 60, []], ["anchorites", 85, []], ["androecium", 85, []], ["aneuploids", 85, []], ["aneuploidy", 85, []], ["angiosperm", 85, []], ["anglerfish", 85, []], ["angleworms", 85, []], ["anhydrites", 85, []], ["antechoirs", 85, []], ["antismoker", 85, []], ["apothecium", 85, []], ["archfiends", 85, []], ["archivolts", 85, []], ["artichokes", 85, []], ["arytenoids", 85, []], ["atrophying", 85, []], ["audiometry", 85, []], ["augmentors", 85, []], ["ausforming", 85, []], ["authorised", 60, []], ["authorized", 30, []], ["authorizes", 60, []], ["autolysing", 85, []], ["autolyzing", 85, []], ["autopsying", 60, []], ["autosexing", 85, []], ["avouchment", 85, []], ["backfields", 85, []], ["background", 10, []], ["backlights", 85, []], ["backlisted", 85, []], ["backslider", 85, []], ["bacteroids", 85, []], ["bandoliers", 85, []], ["bankruptcy", 30, []], ["bankrupted", 60, []], ["batfowling", 85, []], ["bawdyhouse", 85, []], ["beachfront", 85, []], ["bechalking", 85, []], ["becharming", 85, []], ["beclasping", 85, []], ["becloaking", 85, []], ["beclothing", 85, []], ["beclouding", 85, []], ["becomingly", 85, []], ["becrawling", 85, []], ["becrowding", 85, []], ["becrusting", 85, []], ["bedwarfing", 85, []], ["beglamours", 85, []], ["behaviours", 30, []], ["benchmarks", 60, []], ["bescouring", 85, []], ["beshouting", 85, []], ["bestrowing", 85, []], ["beswarming", 85, []], ["bethumping", 85, []], ["bichromate", 85, []], ["bifurcated", 85, []], ["bifurcates", 85, []], ["bigamously", 85, []], ["bigmouthed", 85, []], ["binoculars", 60, []], ["birthplace", 10, []], ["bivouacked", 85, []], ["blacksmith", 30, []], ["blackthorn", 85, []], ["blandisher", 85, []], ["blastoderm", 85, []], ["blathering", 85, []], ["blazonries", 85, []], ["blindworms", 85, []], ["blockaders", 85, []], ["blockading", 60, []], ["blockheads", 85, []], ["bluepoints", 85, []], ["blueprints", 60, []], ["blustering", 85, []], ["boldfacing", 85, []], ["bolstering", 60, []], ["boulevards", 60, []], ["boundaries", 30, []], ["bounderish", 85, []], ["boxhauling", 85, []], ["boyfriends", 30, []], ["bracketing", 60, []], ["branchiest", 85, []], ["branchlets", 85, []], ["breakdowns", 30, []], ["breathings", 30, []], ["bricolages", 85, []], ["bromelains", 85, []], ["bromeliads", 85, []], ["brominated", 85, []], ["brominates", 85, []], ["bronchites", 85, []], ["brutalised", 85, []], ["brutalized", 85, []], ["brutalizes", 85, []], ["bucklering", 85, []], ["buckraming", 85, []], ["buckthorns", 85, []], ["buckwheats", 85, []], ["bulwarking", 85, []], ["buoyancies", 85, []], ["butchering", 60, []], ["byproducts", 85, []], ["cabriolets", 85, []], ["cafetorium", 85, []], ["campground", 85, []], ["candlefish", 85, []], ["capsulized", 85, []], ["captiously", 85, []], ["carbonized", 85, []], ["carbonizes", 85, []], ["carpetings", 30, []], ["centigrams", 85, []], ["centralism", 85, []], ["chairwomen", 85, []], ["chambering", 30, []], ["chamfering", 85, []], ["championed", 30, []], ["chaptering", 30, []], ["charmingly", 85, []], ["chelations", 85, []], ["chemotaxis", 85, []], ["cherimoyas", 85, []], ["chipboards", 85, []], ["chivalrous", 85, []], ["chloramine", 85, []], ["chlordanes", 85, []], ["chlorinate", 85, []], ["chondrites", 85, []], ["chondrules", 85, []], ["chowdering", 85, []], ["chromatids", 85, []], ["chromatins", 85, []], ["chronaxies", 85, []], ["chrysolite", 85, []], ["chrysotile", 85, []], ["clambering", 85, []], ["clamouring", 85, []], ["clampdowns", 85, []], ["clangoured", 85, []], ["clearwings", 85, []], ["clipboards", 85, []], ["clofibrate", 85, []], ["clothespin", 85, []], ["clustering", 60, []], ["coadjutrix", 85, []], ["cobaltines", 85, []], ["coequality", 85, []], ["coequating", 85, []], ["cognizable", 85, []], ["cognizably", 85, []], ["coliphages", 85, []], ["columbines", 85, []], ["columbites", 85, []], ["combusting", 85, []], ["combustive", 85, []], ["comparting", 85, []], ["compatible", 60, []], ["compatibly", 85, []], ["complained", 30, []], ["complainer", 85, []], ["complaints", 30, []], ["completing", 10, []], ["complexify", 85, []], ["complexing", 30, []], ["complexity", 60, []], ["compulsive", 60, []], ["computable", 85, []], ["configured", 60, []], ["configures", 85, []], ["confitures", 85, []], ["confusedly", 85, []], ["conjugated", 85, []], ["conjugates", 85, []], ["consultive", 85, []], ["consumable", 85, []], ["consumedly", 85, []], ["copayments", 85, []], ["copulating", 85, []], ["copulative", 85, []], ["copyrights", 30, []], ["corbelings", 85, []], ["corelating", 85, []], ["cornfields", 85, []], ["cornflakes", 85, []], ["corybantes", 85, []], ["coryphaeus", 85, []], ["counterbid", 85, []], ["counterspy", 85, []], ["countryish", 85, []], ["covetingly", 85, []], ["coxswained", 85, []], ["cradlesong", 85, []], ["crashingly", 85, []], ["crawfished", 85, []], ["creditably", 85, []], ["cremations", 85, []], ["croqueting", 85, []], ["crumbliest", 85, []], ["crumblings", 60, []], ["crumpliest", 85, []], ["crushingly", 85, []], ["cryptogams", 85, []], ["crystalize", 85, []], ["culminated", 60, []], ["culminates", 85, []], ["cuneiforms", 85, []], ["curatively", 85, []], ["curtilages", 85, []], ["curtseying", 85, []], ["customized", 60, []], ["customizer", 85, []], ["cyberpunks", 85, []], ["cymophanes", 85, []], ["davenports", 60, []], ["dayflowers", 85, []], ["deathblows", 85, []], ["debauching", 85, []], ["debonairly", 85, []], ["debouching", 85, []], ["decathlons", 85, []], ["decorating", 60, []], ["decoupling", 85, []], ["decrypting", 85, []], ["decryption", 85, []], ["defaulting", 30, []], ["deflations", 85, []], ["defocusing", 85, []], ["defoliants", 85, []], ["defrocking", 85, []], ["defrosting", 85, []], ["demography", 85, []], ["depilatory", 85, []], ["depositary", 85, []], ["depurating", 85, []], ["designator", 85, []], ["desolating", 60, []], ["despicably", 85, []], ["destroying", 30, []], ["deutoplasm", 85, []], ["dichromate", 85, []], ["dichromats", 85, []], ["dicumarols", 85, []], ["diplomates", 60, []], ["disbarment", 85, []], ["discounter", 85, []], ["discourage", 60, []], ["discrepant", 85, []], ["disenthral", 85, []], ["disgruntle", 85, []], ["disharmony", 85, []], ["dispatcher", 85, []], ["disputable", 85, []], ["disputably", 85, []], ["dithyrambs", 85, []], ["dockmaster", 85, []], ["documental", 85, []], ["dogmatizer", 85, []], ["dogmatizes", 85, []], ["dogwatches", 85, []], ["dormancies", 85, []], ["doubtingly", 85, []], ["doughfaces", 85, []], ["dowitchers", 85, []], ["downstream", 30, []], ["drawknives", 85, []], ["drinkables", 85, []], ["driveshaft", 85, []], ["droplights", 85, []], ["dulcimores", 85, []], ["dumbwaiter", 85, []], ["duplicates", 60, []], ["duplicator", 85, []], ["dwarfishly", 85, []], ["dynamiters", 85, []], ["dystrophic", 85, []], ["earthbound", 85, []], ["earthlings", 85, []], ["educations", 10, []], ["elucidator", 85, []], ["emblazonry", 85, []], ["emulations", 85, []], ["endolymphs", 85, []], ["endophytic", 85, []], ["epistolary", 85, []], ["escaloping", 85, []], ["eukaryotic", 85, []], ["euphorbias", 85, []], ["euphoriant", 85, []], ["eurybathic", 85, []], ["eurythmics", 85, []], ["exactingly", 85, []], ["excusatory", 85, []], ["exhausting", 60, []], ["exhaustion", 60, []], ["exhumation", 85, []], ["explicator", 85, []], ["exudations", 85, []], ["factiously", 85, []], ["factorized", 85, []], ["factorizes", 85, []], ["factorship", 85, []], ["falconries", 85, []], ["fancyworks", 85, []], ["farsighted", 85, []], ["fetchingly", 85, []], ["fieldworks", 85, []], ["fingerhold", 85, []], ["fingerpost", 85, []], ["fishmonger", 85, []], ["flamingoes", 85, []], ["flavorings", 60, []], ["flavouring", 60, []], ["fletchings", 85, []], ["floribunda", 85, []], ["flounciest", 85, []], ["flourished", 60, []], ["flowcharts", 85, []], ["fluoridate", 85, []], ["fluorinate", 85, []], ["flustering", 85, []], ["flybridges", 85, []], ["flyweights", 85, []], ["folksinger", 85, []], ["foredating", 85, []], ["forestland", 85, []], ["forgivable", 85, []], ["forgivably", 85, []], ["formalised", 85, []], ["formalized", 85, []], ["formalizes", 85, []], ["formatives", 60, []], ["formidable", 60, []], ["formidably", 85, []], ["formulated", 60, []], ["formulates", 60, []], ["formulized", 85, []], ["formulizes", 85, []], ["fornicated", 85, []], ["fornicates", 85, []], ["fortalices", 85, []], ["fosterling", 85, []], ["foxhunters", 85, []], ["fractioned", 60, []], ["franchised", 30, []], ["freakishly", 85, []], ["fricandoes", 85, []], ["fruitcakes", 85, []], ["fulminated", 85, []], ["fulminates", 85, []], ["fumatories", 85, []], ["fumigators", 85, []], ["furanoside", 85, []], ["furcations", 85, []], ["gardenfuls", 85, []], ["gavelkinds", 85, []], ["gazehounds", 85, []], ["gelatinous", 85, []], ["gerfalcons", 85, []], ["girandoles", 85, []], ["glamorised", 85, []], ["glamorized", 85, []], ["glamorizes", 85, []], ["glamourize", 85, []], ["glauconite", 85, []], ["gluconates", 85, []], ["glutamines", 85, []], ["glycosuria", 85, []], ["goatsucker", 85, []], ["godfathers", 60, []], ["godparents", 85, []], ["goldbricks", 85, []], ["gormandise", 85, []], ["gormandize", 85, []], ["graciously", 85, []], ["gramineous", 85, []], ["granulites", 85, []], ["graphemics", 85, []], ["grapholect", 85, []], ["graticules", 85, []], ["greyhounds", 60, []], ["grievously", 85, []], ["grouchiest", 85, []], ["groundfish", 85, []], ["groupthink", 85, []], ["grubstaked", 85, []], ["gunpowders", 60, []], ["gynarchies", 85, []], ["gyrfalcons", 85, []], ["gyroplanes", 85, []], ["handiworks", 85, []], ["handsomely", 85, []], ["handwrites", 85, []], ["hardiments", 85, []], ["harlequins", 85, []], ["harmonised", 85, []], ["harmonized", 85, []], ["harmonizes", 85, []], ["harvesting", 60, []], ["headspring", 85, []], ["headstrong", 85, []], ["hectograms", 85, []], ["hemizygous", 85, []], ["hemolyzing", 85, []], ["hermatypic", 85, []], ["hexaploids", 85, []], ["hexaploidy", 85, []], ["hoactzines", 85, []], ["holidayers", 85, []], ["holstering", 85, []], ["hopsacking", 85, []], ["hospitable", 85, []], ["hospitably", 85, []], ["houseplant", 85, []], ["humanizers", 85, []], ["humdingers", 85, []], ["humpbacked", 85, []], ["hybridomas", 85, []], ["hydrations", 60, []], ["hydraulics", 60, []], ["hydrazines", 85, []], ["hydroniums", 85, []], ["hydroplane", 85, []], ["hydrospace", 85, []], ["hyperbolas", 85, []], ["hyperbolic", 60, []], ["hypergolic", 85, []], ["hypermanic", 85, []], ["hypersonic", 85, []], ["hypertonia", 85, []], ["hypertonic", 85, []], ["hypnotized", 85, []], ["hypnotizes", 85, []], ["hypocrites", 60, []], ["hypodermal", 85, []], ["hypodermic", 85, []], ["hypodermis", 85, []], ["hypoxemias", 85, []], ["hysterical", 60, []], ["ibuprofens", 85, []], ["ideographs", 85, []], ["ideography", 85, []], ["impersonal", 85, []], ["implanters", 85, []], ["importable", 85, []], ["importance", 30, []], ["importancy", 85, []], ["importuned", 85, []], ["importunes", 85, []], ["improvable", 85, []], ["impudently", 85, []], ["impugnable", 85, []], ["inchoately", 85, []], ["incubators", 60, []], ["incubatory", 85, []], ["inculpated", 85, []], ["inculpates", 85, []], ["incurables", 85, []], ["incurvated", 85, []], ["incurvates", 85, []], ["indecorums", 85, []], ["inexorably", 85, []], ["infamously", 85, []], ["informedly", 85, []], ["inoculated", 85, []], ["inoculates", 85, []], ["inosculate", 85, []], ["interfolds", 85, []], ["interlocks", 85, []], ["intermodal", 85, []], ["interplays", 60, []], ["introduces", 30, []], ["involucres", 85, []], ["isografted", 85, []], ["isothermal", 85, []], ["jackfruits", 85, []], ["jacklights", 85, []], ["jargonized", 85, []], ["jargonizes", 85, []], ["jeoparding", 85, []], ["jocularity", 85, []], ["journalism", 30, []], ["journalist", 30, []], ["journalize", 85, []], ["jubilances", 85, []], ["judgmental", 60, []], ["judicatory", 85, []], ["juniorates", 85, []], ["juxtaposed", 85, []], ["keratinous", 85, []], ["kerygmatic", 85, []], ["kiloparsec", 85, []], ["kingcrafts", 85, []], ["kohlrabies", 85, []], ["kurbashing", 85, []], ["kymographs", 85, []], ["labyrinths", 60, []], ["lachrymose", 85, []], ["lacquering", 85, []], ["lacqueying", 85, []], ["lacustrine", 85, []], ["ladyfinger", 85, []], ["lakefronts", 85, []], ["lambrequin", 85, []], ["languished", 85, []], ["languisher", 85, []], ["largemouth", 85, []], ["laryngites", 85, []], ["lawrencium", 85, []], ["lawyerings", 30, []], ["lectionary", 85, []], ["lengthways", 85, []], ["lifeguards", 85, []], ["lightfaced", 85, []], ["lightfaces", 85, []], ["lobstering", 60, []], ["lobsterman", 85, []], ["logarithms", 85, []], ["longhaired", 85, []], ["longitudes", 60, []], ["lovemaking", 85, []], ["lubricants", 85, []], ["lubricated", 85, []], ["lubricates", 85, []], ["luftmensch", 85, []], ["lumberjack", 100, []], ["lunchmeats", 85, []], ["lunchtimes", 60, []], ["lymphatics", 85, []], ["lymphokine", 85, []], ["mackintosh", 85, []], ["macrophyte", 85, []], ["magnitudes", 60, []], ["manifestly", 85, []], ["manticores", 85, []], ["manuscript", 60, []], ["marketings", 10, []], ["matchboxes", 85, []], ["mayflowers", 85, []], ["megaphonic", 85, []], ["megasporic", 85, []], ["mendacious", 85, []], ["mentorship", 85, []], ["mesophytic", 85, []], ["metalworks", 85, []], ["metaphoric", 85, []], ["metaphysic", 85, []], ["methodical", 85, []], ["methyldopa", 85, []], ["microluxes", 85, []], ["microphage", 85, []], ["micropyles", 85, []], ["microquake", 85, []], ["microwaved", 60, []], ["microwaves", 60, []], ["midwatches", 85, []], ["mindblower", 85, []], ["mineralogy", 85, []], ["mischarged", 85, []], ["miscounted", 85, []], ["misfortune", 60, []], ["misgrafted", 85, []], ["mislabored", 85, []], ["mislocated", 85, []], ["mispatched", 85, []], ["misplanted", 85, []], ["mistakenly", 60, []], ["mistouched", 85, []], ["moderating", 30, []], ["modularity", 85, []], ["modulating", 85, []], ["molybdates", 85, []], ["monarchies", 60, []], ["monarchist", 85, []], ["monetarily", 85, []], ["mordancies", 85, []], ["morganites", 85, []], ["morphactin", 85, []], ["motherland", 85, []], ["mouldering", 85, []], ["mudslinger", 85, []], ["multigrade", 85, []], ["multipaned", 85, []], ["multiphase", 85, []], ["multipower", 85, []], ["multirange", 85, []], ["myasthenic", 85, []], ["mycophiles", 85, []], ["myopathies", 85, []], ["narcolepsy", 85, []], ["narcotized", 85, []], ["narcotizes", 85, []], ["nebulosity", 85, []], ["neighborly", 85, []], ["neighbours", 60, []], ["nemophilas", 85, []], ["neoplastic", 85, []], ["nephrotics", 85, []], ["neuroglias", 85, []], ["neuropathy", 85, []], ["neutralism", 85, []], ["neutrophil", 85, []], ["nightclubs", 60, []], ["nightmares", 30, []], ["nightscope", 85, []], ["nomarchies", 85, []], ["normalcies", 85, []], ["normalised", 85, []], ["normalized", 60, []], ["normalizes", 85, []], ["noticeably", 60, []], ["novaculite", 85, []], ["nucleators", 85, []], ["nymphalids", 85, []], ["obduracies", 85, []], ["obdurately", 85, []], ["obeisantly", 85, []], ["obfuscated", 85, []], ["objurgated", 85, []], ["objurgates", 85, []], ["opalescing", 85, []], ["orbiculate", 85, []], ["osculating", 85, []], ["ostracized", 85, []], ["outbarking", 85, []], ["outbawling", 85, []], ["outbeaming", 85, []], ["outblazing", 85, []], ["outbraving", 85, []], ["outbrawled", 85, []], ["outcaviled", 85, []], ["outcharged", 85, []], ["outcharges", 85, []], ["outcharmed", 85, []], ["outclimbed", 85, []], ["outcrawled", 85, []], ["outdrawing", 85, []], ["outfabling", 85, []], ["outflanked", 85, []], ["outhearing", 85, []], ["outlanders", 85, []], ["outlandish", 85, []], ["outlawries", 85, []], ["outleaping", 85, []], ["outmarched", 85, []], ["outmarches", 85, []], ["outplaying", 85, []], ["outpraying", 85, []], ["outreading", 85, []], ["outrivaled", 85, []], ["outserving", 85, []], ["outshaming", 85, []], ["outslicked", 85, []], ["outsparkle", 85, []], ["outwalking", 85, []], ["outwearing", 85, []], ["outwhirled", 85, []], ["outyelping", 85, []], ["ovalbumins", 85, []], ["overacting", 85, []], ["overbaking", 85, []], ["overbuilds", 85, []], ["overbuying", 85, []], ["overclaims", 85, []], ["overflight", 85, []], ["overflying", 85, []], ["overhating", 85, []], ["overhyping", 85, []], ["overlading", 85, []], ["overlaying", 60, []], ["overlights", 85, []], ["overmighty", 85, []], ["overnights", 30, []], ["overpaying", 85, []], ["overplaids", 85, []], ["overplants", 85, []], ["overplying", 85, []], ["oversimply", 85, []], ["overslaugh", 85, []], ["overtaking", 60, []], ["overtaxing", 85, []], ["overthinks", 85, []], ["pachyderms", 85, []], ["padlocking", 85, []], ["paintbrush", 85, []], ["paintworks", 85, []], ["palindrome", 85, []], ["panbroiled", 85, []], ["panegyrics", 85, []], ["panegyrist", 85, []], ["parbuckled", 85, []], ["parbuckles", 85, []], ["parchments", 60, []], ["pargylines", 85, []], ["parqueting", 85, []], ["pasticheur", 85, []], ["patchoulis", 85, []], ["patchworks", 60, []], ["pathfinder", 85, []], ["pathogenic", 85, []], ["patronised", 85, []], ["patronized", 85, []], ["patronizes", 85, []], ["patronymic", 85, []], ["paunchiest", 85, []], ["peculating", 85, []], ["peculation", 85, []], ["peculators", 85, []], ["pelycosaur", 85, []], ["penultimas", 85, []], ["perigynous", 85, []], ["personalty", 85, []], ["persuading", 60, []], ["phagocytes", 85, []], ["phenocryst", 85, []], ["philanders", 85, []], ["phlebogram", 85, []], ["phlegmatic", 85, []], ["phonematic", 85, []], ["pictograms", 85, []], ["pigmentary", 85, []], ["pitcherful", 85, []], ["pitchforks", 85, []], ["pitchwoman", 85, []], ["pitchwomen", 85, []], ["planetoids", 85, []], ["plastering", 60, []], ["playground", 10, []], ["playthings", 85, []], ["playwright", 60, []], ["pleasuring", 30, []], ["pleonastic", 85, []], ["pleustonic", 85, []], ["pocketfuls", 85, []], ["pocketsful", 85, []], ["polyamides", 85, []], ["polyamines", 85, []], ["polyanthus", 85, []], ["polygamies", 85, []], ["polygamist", 85, []], ["polygamize", 85, []], ["polymathic", 85, []], ["polytheism", 85, []], ["polywaters", 85, []], ["ponytailed", 85, []], ["porcelains", 60, []], ["postlaunch", 85, []], ["postmarked", 85, []], ["postulancy", 85, []], ["poultryman", 85, []], ["poultrymen", 85, []], ["prankishly", 85, []], ["pratincole", 85, []], ["precasting", 85, []], ["precaution", 60, []], ["preciously", 85, []], ["precluding", 85, []], ["preclusion", 85, []], ["predacious", 85, []], ["predations", 85, []], ["preholiday", 85, []], ["premolding", 85, []], ["prequalify", 85, []], ["preshowing", 85, []], ["presoaking", 85, []], ["presumably", 60, []], ["previously", 30, []], ["prewashing", 85, []], ["princedoms", 85, []], ["printheads", 85, []], ["proclaimed", 60, []], ["procumbent", 85, []], ["producible", 85, []], ["productive", 30, []], ["profitable", 60, []], ["profitably", 85, []], ["profligacy", 85, []], ["profligate", 85, []], ["profundity", 85, []], ["projecting", 10, []], ["prolactins", 85, []], ["prolamines", 85, []], ["promulgate", 85, []], ["proscenium", 85, []], ["prosecting", 85, []], ["protamines", 85, []], ["prudential", 85, []], ["psalterium", 85, []], ["pterygiums", 85, []], ["pterygoids", 85, []], ["pulmonates", 85, []], ["punchboard", 85, []], ["punishable", 60, []], ["purchasing", 30, []], ["purgations", 85, []], ["purgatives", 85, []], ["puromycins", 85, []], ["putrefying", 85, []], ["pyranoside", 85, []], ["pyridoxals", 85, []], ["pyrolusite", 85, []], ["quadriceps", 85, []], ["quantizers", 85, []], ["quatrefoil", 85, []], ["quebrachos", 85, []], ["quizmaster", 85, []], ["quodlibets", 85, []], ["randomizes", 85, []], ["raunchiest", 85, []], ["ravenously", 85, []], ["ravishment", 85, []], ["readopting", 85, []], ["reclasping", 85, []], ["reclothing", 85, []], ["recoupling", 85, []], ["redactions", 85, []], ["rediscount", 85, []], ["redoubling", 85, []], ["reductions", 30, []], ["reflations", 85, []], ["refloating", 85, []], ["refocusing", 85, []], ["regulation", 30, []], ["reimplants", 85, []], ["relocating", 60, []], ["rematching", 60, []], ["repatching", 85, []], ["replumbing", 85, []], ["republican", 30, []], ["resaluting", 85, []], ["resampling", 85, []], ["restacking", 85, []], ["restamping", 85, []], ["restocking", 85, []], ["restudying", 85, []], ["resumption", 85, []], ["retackling", 85, []], ["retouching", 85, []], ["revanchism", 85, []], ["revanchist", 85, []], ["revictuals", 85, []], ["rhapsodize", 85, []], ["rheumatics", 85, []], ["rheumatoid", 85, []], ["rhizoplane", 85, []], ["rhodamines", 85, []], ["rhytidomes", 85, []], ["rosemaling", 85, []], ["roughnecks", 85, []], ["roundelays", 85, []], ["roundtable", 60, []], ["rudbeckias", 85, []], ["rudimental", 85, []], ["saprogenic", 85, []], ["scampering", 85, []], ["scathingly", 85, []], ["scheduling", 30, []], ["scherzando", 85, []], ["schlumping", 85, []], ["schmalzier", 85, []], ["sclerotium", 85, []], ["scorpaenid", 85, []], ["scowdering", 85, []], ["scrambling", 60, []], ["scrubwoman", 85, []], ["scrubwomen", 85, []], ["seaborgium", 85, []], ["secularity", 85, []], ["sextupling", 85, []], ["shadowlike", 85, []], ["shmaltzier", 85, []], ["shockingly", 60, []], ["shoplifted", 85, []], ["shoplifter", 85, []], ["shrievalty", 85, []], ["shrinkable", 85, []], ["shylocking", 85, []], ["silverback", 85, []], ["sjamboking", 85, []], ["skylighted", 85, []], ["slathering", 85, []], ["slipformed", 85, []], ["sloganized", 85, []], ["slumbering", 60, []], ["smoldering", 85, []], ["smothering", 85, []], ["soundalike", 85, []], ["soundtrack", 60, []], ["speculator", 85, []], ["sphenoidal", 85, []], ["spheroidal", 85, []], ["splotchier", 85, []], ["splotching", 85, []], ["sporangium", 85, []], ["sportingly", 85, []], ["sportively", 85, []], ["sporulated", 85, []], ["sprightful", 85, []], ["springhead", 85, []], ["squelching", 85, []], ["stampeding", 30, []], ["starveling", 85, []], ["stepfamily", 85, []], ["stewarding", 60, []], ["stockading", 85, []], ["stockinged", 30, []], ["stockpiled", 60, []], ["stockpiler", 85, []], ["stomaching", 30, []], ["stupefying", 85, []], ["subcentral", 85, []], ["subchapter", 85, []], ["subcordate", 85, []], ["subdialect", 85, []], ["subheading", 85, []], ["subjecting", 30, []], ["subjection", 85, []], ["subkingdom", 85, []], ["sublimated", 85, []], ["submarined", 60, []], ["submediant", 85, []], ["subnetwork", 85, []], ["suboptimal", 85, []], ["subpotency", 85, []], ["subprimate", 85, []], ["subproject", 85, []], ["subreption", 85, []], ["subrogated", 85, []], ["subtrahend", 85, []], ["subvariety", 85, []], ["subverting", 85, []], ["sulfonated", 85, []], ["sulphating", 85, []], ["superbitch", 85, []], ["superblock", 85, []], ["superflack", 85, []], ["supergiant", 85, []], ["superlight", 85, []], ["superlying", 85, []], ["supermacho", 85, []], ["superthick", 85, []], ["supertonic", 85, []], ["superwoman", 85, []], ["surjection", 85, []], ["suzerainty", 85, []], ["switchable", 85, []], ["switchyard", 85, []], ["symbolized", 85, []], ["symbolizer", 85, []], ["sympathize", 85, []], ["syncopated", 85, []], ["syndicator", 85, []], ["synoptical", 85, []], ["tambourine", 85, []], ["tambouring", 85, []], ["tamoxifens", 85, []], ["tendrilous", 85, []], ["terminably", 85, []], ["theurgical", 85, []], ["thimerosal", 85, []], ["thornbacks", 85, []], ["threadfins", 85, []], ["throwbacks", 60, []], ["thumbnails", 60, []], ["thumbscrew", 85, []], ["thylacines", 85, []], ["thylakoids", 85, []], ["thyroxines", 85, []], ["timberland", 85, []], ["touchingly", 85, []], ["touchlines", 85, []], ["touchmarks", 85, []], ["tourmaline", 85, []], ["tovariches", 85, []], ["toweringly", 85, []], ["trampoline", 60, []], ["transfixed", 85, []], ["trapezoids", 85, []], ["trauchling", 85, []], ["trialogues", 85, []], ["trichogyne", 85, []], ["trucklines", 85, []], ["truckloads", 85, []], ["tumbledown", 85, []], ["turophiles", 85, []], ["ulcerating", 85, []], ["ulceration", 85, []], ["ultrafiche", 85, []], ["ultrasonic", 85, []], ["unactorish", 85, []], ["unbaptized", 85, []], ["unchastely", 85, []], ["undercoats", 85, []], ["underplays", 85, []], ["underplots", 85, []], ["undogmatic", 85, []], ["undomestic", 85, []], ["unemphatic", 85, []], ["unfavorite", 85, []], ["ungodliest", 85, []], ["uniformest", 85, []], ["unimproved", 85, []], ["unmorality", 85, []], ["unpolished", 85, []], ["unprovable", 85, []], ["unravished", 85, []], ["unscramble", 85, []], ["unscripted", 85, []], ["unshackled", 85, []], ["unsociable", 85, []], ["unsociably", 85, []], ["unsteadily", 85, []], ["untowardly", 85, []], ["unworkable", 85, []], ["unworthies", 60, []], ["unworthily", 85, []], ["uphoarding", 85, []], ["upholstery", 30, []], ["upreaching", 85, []], ["upthrowing", 85, []], ["urogenital", 85, []], ["vanquished", 85, []], ["vanquisher", 85, []], ["venography", 85, []], ["vestibular", 85, []], ["vetchlings", 85, []], ["vibraphone", 85, []], ["victualers", 85, []], ["viperously", 85, []], ["viscometry", 85, []], ["vocalizers", 85, []], ["vociferant", 85, []], ["volumetric", 85, []], ["vouchering", 60, []], ["vouchsafed", 85, []], ["vulcanised", 85, []], ["vulcanized", 85, []], ["vulcanizer", 85, []], ["vulcanizes", 85, []], ["vulgarised", 85, []], ["vulgarized", 85, []], ["vulgarizes", 85, []], ["wainscoted", 85, []], ["waitperson", 85, []], ["wanderlust", 85, []], ["wardenship", 85, []], ["waterbucks", 85, []], ["waveringly", 85, []], ["windbreaks", 85, []], ["windhovers", 85, []], ["wingspread", 85, []], ["wolframite", 85, []], ["womanishly", 85, []], ["womanizers", 85, []], ["womanliest", 85, []], ["workplaces", 60, []], ["worktables", 85, []], ["worshipful", 85, []], ["wyliecoats", 85, []], ["xenografts", 85, []], ["xerophytic", 85, []], ["xylographs", 85, []]]], [{ "id": "word-vowels", "family": "words", "topic": "THREE VOWELS TOGETHER", "prompt": "Name an English word containing at least three consecutive vowels (A, E, I, O, U). Inflections count.", "source": "ENABLE word list (Mendel Cooper), public domain; exact letter filter.", "ranking": "familiarity-v1" }, [["aboideau", 85, []], ["aboideaus", 85, []], ["aboideaux", 85, []], ["aboiteau", 85, []], ["aboiteaus", 85, []], ["aboiteaux", 85, []], ["absenteeism", 85, []], ["absenteeisms", 85, []], ["abstemious", 85, []], ["abstemiously", 85, []], ["abstemiousness", 85, []], ["abstemiousnesses", 85, []], ["abstentious", 85, []], ["acequia", 85, []], ["acequias", 85, []], ["acquaint", 85, []], ["acquaintance", 60, []], ["acquaintances", 60, []], ["acquaintanceship", 85, []], ["acquaintanceships", 85, []], ["acquainted", 60, []], ["acquainting", 85, []], ["acquaints", 85, []], ["acquiesce", 85, []], ["acquiesced", 85, []], ["acquiescence", 85, []], ["acquiescences", 85, []], ["acquiescent", 85, []], ["acquiescently", 85, []], ["acquiesces", 85, []], ["acquiescing", 85, []], ["acrimonious", 85, []], ["acrimoniously", 85, []], ["acrimoniousness", 85, []], ["acrimoniousnesses", 85, []], ["actiniae", 85, []], ["adieu", 85, []], ["adieus", 85, []], ["adieux", 85, []], ["adscititious", 85, []], ["advantageous", 60, []], ["advantageously", 85, []], ["advantageousness", 85, []], ["advantageousnesses", 85, []], ["adventitious", 85, []], ["adventitiously", 85, []], ["aeneous", 85, []], ["aeolian", 85, []], ["aeon", 85, []], ["aeonian", 85, []], ["aeonic", 85, []], ["aeons", 85, []], ["agreeabilities", 85, []], ["agreeability", 85, []], ["agreeable", 60, []], ["agreeableness", 85, []], ["agreeablenesses", 85, []], ["agreeably", 85, []], ["agreeing", 30, []], ["aioli", 85, []], ["aiolis", 85, []], ["alleluia", 85, []], ["alleluias", 85, []], ["alliaceous", 85, []], ["althaea", 85, []], ["althaeas", 85, []], ["ambiguous", 60, []], ["ambiguously", 85, []], ["ambiguousness", 85, []], ["ambiguousnesses", 85, []], ["ambitious", 60, []], ["ambitiously", 85, []], ["ambitiousness", 85, []], ["ambitiousnesses", 85, []], ["amphibious", 85, []], ["amphibiously", 85, []], ["amphibiousness", 85, []], ["amphibiousnesses", 85, []], ["andouille", 85, []], ["andouilles", 85, []], ["andouillette", 85, []], ["andouillettes", 85, []], ["anfractuous", 85, []], ["antiair", 85, []], ["antiaircraft", 85, []], ["antiaircrafts", 85, []], ["antiauthoritarian", 85, []], ["antiauthoritarianism", 85, []], ["antiauthoritarianisms", 85, []], ["antiauthority", 85, []], ["antiauxin", 85, []], ["antiauxins", 85, []], ["antibourgeois", 85, []], ["antibureaucratic", 85, []], ["antireligious", 85, []], ["anxious", 60, []], ["anxiously", 85, []], ["anxiousness", 85, []], ["anxiousnesses", 85, []], ["aoudad", 85, []], ["aoudads", 85, []], ["apnoea", 85, []], ["apnoeal", 85, []], ["apnoeas", 85, []], ["apnoeic", 85, []], ["apologiae", 85, []], ["appliqueing", 85, []], ["aquae", 85, []], ["aqueous", 60, []], ["araceous", 85, []], ["arboreous", 85, []], ["archaeoastronomies", 85, []], ["archaeoastronomy", 85, []], ["archaeological", 60, []], ["archaeologically", 85, []], ["archaeologies", 60, []], ["archaeologist", 60, []], ["archaeologists", 60, []], ["archaeology", 60, []], ["archaeopteryx", 85, []], ["archaeopteryxes", 85, []], ["arduous", 60, []], ["arduously", 85, []], ["arduousness", 85, []], ["arduousnesses", 85, []], ["areae", 85, []], ["arenaceous", 85, []], ["argillaceous", 85, []], ["arsenious", 85, []], ["assagaied", 85, []], ["assagaiing", 85, []], ["assegaied", 85, []], ["assegaiing", 85, []], ["assiduous", 85, []], ["assiduously", 85, []], ["assiduousness", 85, []], ["assiduousnesses", 85, []], ["athenaeum", 85, []], ["athenaeums", 85, []], ["atrabilious", 85, []], ["atrabiliousness", 85, []], ["atrabiliousnesses", 85, []], ["atrocious", 60, []], ["atrociously", 85, []], ["atrociousness", 85, []], ["atrociousnesses", 85, []], ["audacious", 85, []], ["audaciously", 85, []], ["audaciousness", 85, []], ["audaciousnesses", 85, []], ["auspicious", 85, []], ["auspiciously", 85, []], ["auspiciousness", 85, []], ["auspiciousnesses", 85, []], ["autoecious", 85, []], ["autoeciously", 85, []], ["avaricious", 85, []], ["avariciously", 85, []], ["avariciousness", 85, []], ["avariciousnesses", 85, []], ["baaed", 30, []], ["baaing", 30, []], ["ballyhooed", 85, []], ["ballyhooing", 85, []], ["bandeau", 85, []], ["bandeaus", 85, []], ["bandeaux", 85, []], ["bateau", 85, []], ["bateaux", 85, []], ["batteau", 85, []], ["batteaux", 85, []], ["beau", 60, []], ["beaucoup", 85, []], ["beauish", 85, []], ["beaus", 60, []], ["beaut", 85, []], ["beauteous", 60, []], ["beauteously", 85, []], ["beauteousness", 85, []], ["beauteousnesses", 85, []], ["beautician", 85, []], ["beauticians", 85, []], ["beauties", 30, []], ["beautification", 85, []], ["beautifications", 85, []], ["beautified", 85, []], ["beautifier", 85, []], ["beautifiers", 85, []], ["beautifies", 85, []], ["beautiful", 10, []], ["beautifuler", 85, []], ["beautifulest", 85, []], ["beautifully", 60, []], ["beautifulness", 85, []], ["beautifulnesses", 85, []], ["beautify", 85, []], ["beautifying", 85, []], ["beauts", 85, []], ["beauty", 30, []], ["beaux", 85, []], ["bedouin", 85, []], ["bedouins", 85, []], ["bedsoniae", 85, []], ["befleaed", 85, []], ["befleaing", 85, []], ["behaviour", 30, []], ["behaviours", 30, []], ["bequeath", 85, []], ["bequeathal", 85, []], ["bequeathals", 85, []], ["bequeathed", 85, []], ["bequeathing", 85, []], ["bequeaths", 85, []], ["bilious", 85, []], ["biliously", 85, []], ["biliousness", 85, []], ["biliousnesses", 85, []], ["bioacoustics", 85, []], ["bioactive", 85, []], ["bioactivities", 85, []], ["bioactivity", 85, []], ["bioassay", 85, []], ["bioassayed", 85, []], ["bioassaying", 85, []], ["bioassays", 85, []], ["bioavailabilities", 85, []], ["bioavailability", 85, []], ["bioavailable", 85, []], ["bioelectric", 85, []], ["bioelectrical", 85, []], ["bioelectricities", 85, []], ["bioelectricity", 85, []], ["bioenergetic", 85, []], ["bioenergetics", 85, []], ["bioengineer", 85, []], ["bioengineered", 85, []], ["bioengineering", 85, []], ["bioengineerings", 85, []], ["bioengineers", 85, []], ["bioethic", 85, []], ["bioethical", 85, []], ["bioethicist", 85, []], ["bioethicists", 85, []], ["bioethics", 85, []], ["birdieing", 60, []], ["bivouac", 85, []], ["bivouacked", 85, []], ["bivouacking", 85, []], ["bivouacks", 85, []], ["bivouacs", 85, []], ["blooey", 85, []], ["blooie", 85, []], ["blueing", 10, []], ["blueings", 10, []], ["blueish", 85, []], ["bodacious", 85, []], ["bodaciously", 85, []], ["booed", 60, []], ["boohooed", 85, []], ["boohooing", 85, []], ["booing", 60, []], ["bordeaux", 60, []], ["bordereau", 85, []], ["bordereaux", 85, []], ["bougainvillaea", 85, []], ["bougainvillaeas", 85, []], ["bouillabaisse", 85, []], ["bouillabaisses", 85, []], ["bouillon", 85, []], ["bouillons", 85, []], ["bounteous", 85, []], ["bounteously", 85, []], ["bounteousness", 85, []], ["bounteousnesses", 85, []], ["bourgeois", 60, []], ["bourgeoise", 85, []], ["bourgeoises", 60, []], ["bourgeoisie", 85, []], ["bourgeoisies", 85, []], ["bourgeoisification", 85, []], ["bourgeoisifications", 85, []], ["bourgeoisified", 85, []], ["bourgeoisifies", 85, []], ["bourgeoisify", 85, []], ["bourgeoisifying", 85, []], ["branchiae", 85, []], ["buddleia", 85, []], ["buddleias", 85, []], ["bumptious", 85, []], ["bumptiously", 85, []], ["bumptiousness", 85, []], ["bumptiousnesses", 85, []], ["bureau", 30, []], ["bureaucracies", 60, []], ["bureaucracy", 60, []], ["bureaucrat", 85, []], ["bureaucratese", 85, []], ["bureaucrateses", 85, []], ["bureaucratic", 60, []], ["bureaucratically", 85, []], ["bureaucratise", 85, []], ["bureaucratised", 85, []], ["bureaucratises", 85, []], ["bureaucratising", 85, []], ["bureaucratism", 85, []], ["bureaucratisms", 85, []], ["bureaucratization", 85, []], ["bureaucratizations", 85, []], ["bureaucratize", 85, []], ["bureaucratized", 85, []], ["bureaucratizes", 85, []], ["bureaucratizing", 85, []], ["bureaucrats", 60, []], ["bureaus", 30, []], ["bureaux", 85, []], ["burglarious", 85, []], ["burglariously", 85, []], ["caeoma", 85, []], ["caeomas", 85, []], ["calcareous", 85, []], ["calcareously", 85, []], ["calumnious", 85, []], ["calumniously", 85, []], ["cameoed", 60, []], ["cameoing", 60, []], ["camphoraceous", 85, []], ["canoeable", 85, []], ["canoeing", 60, []], ["canoeist", 85, []], ["canoeists", 85, []], ["caoutchouc", 85, []], ["caoutchoucs", 85, []], ["capacious", 85, []], ["capaciously", 85, []], ["capaciousness", 85, []], ["capaciousnesses", 85, []], ["capricious", 85, []], ["capriciously", 85, []], ["capriciousness", 85, []], ["capriciousnesses", 85, []], ["captious", 85, []], ["captiously", 85, []], ["captiousness", 85, []], ["captiousnesses", 85, []], ["carbonaceous", 85, []], ["cardiae", 85, []], ["cardioid", 85, []], ["cardioids", 85, []], ["carious", 85, []], ["caseous", 85, []], ["cautious", 60, []], ["cautiously", 60, []], ["cautiousness", 85, []], ["cautiousnesses", 85, []], ["cementitious", 85, []], ["censorious", 85, []], ["censoriously", 85, []], ["censoriousness", 85, []], ["censoriousnesses", 85, []], ["cercariae", 85, []], ["ceremonious", 85, []], ["ceremoniously", 85, []], ["ceremoniousness", 85, []], ["ceremoniousnesses", 85, []], ["cernuous", 85, []], ["cetaceous", 85, []], ["chapeau", 85, []], ["chapeaus", 85, []], ["chapeaux", 85, []], ["chateau", 60, []], ["chateaubriand", 85, []], ["chateaubriands", 85, []], ["chateaus", 60, []], ["chateaux", 85, []], ["chemoautotrophic", 85, []], ["chemoautotrophies", 85, []], ["chemoautotrophy", 85, []], ["chiao", 85, []], ["chiaus", 85, []], ["chiauses", 85, []], ["chivareeing", 85, []], ["chlamydiae", 85, []], ["choreoid", 85, []], ["chorioallantoic", 85, []], ["chorioallantoides", 85, []], ["chorioallantois", 85, []], ["chorioid", 85, []], ["chorioids", 85, []], ["ciao", 85, []], ["cinereous", 85, []], ["cinquain", 85, []], ["cinquains", 85, []], ["circumfluous", 85, []], ["citreous", 85, []], ["claqueur", 85, []], ["claqueurs", 85, []], ["cliquier", 85, []], ["cliquiest", 85, []], ["closeout", 85, []], ["closeouts", 85, []], ["clueing", 30, []], ["clupeoid", 85, []], ["clupeoids", 85, []], ["coaeval", 85, []], ["coaevals", 85, []], ["coauthor", 85, []], ["coauthored", 85, []], ["coauthoring", 85, []], ["coauthors", 85, []], ["coauthorship", 85, []], ["coauthorships", 85, []], ["coccidioidomycoses", 85, []], ["coccidioidomycosis", 85, []], ["cochleae", 85, []], ["codeia", 85, []], ["codeias", 85, []], ["coetaneous", 85, []], ["colloquia", 85, []], ["colloquial", 85, []], ["colloquialism", 85, []], ["colloquialisms", 85, []], ["colloquialities", 85, []], ["colloquiality", 85, []], ["colloquially", 85, []], ["colloquials", 85, []], ["colloquies", 85, []], ["colloquium", 85, []], ["colloquiums", 85, []], ["commodious", 85, []], ["commodiously", 85, []], ["commodiousness", 85, []], ["commodiousnesses", 85, []], ["compendious", 85, []], ["compendiously", 85, []], ["compendiousness", 85, []], ["compendiousnesses", 85, []], ["compunctious", 85, []], ["congeeing", 85, []], ["congruous", 85, []], ["congruously", 85, []], ["congruousness", 85, []], ["congruousnesses", 85, []], ["conquian", 85, []], ["conquians", 85, []], ["consanguineous", 85, []], ["consanguineously", 85, []], ["conscientious", 60, []], ["conscientiously", 85, []], ["conscientiousness", 85, []], ["conscientiousnesses", 85, []], ["conscious", 30, []], ["consciouses", 30, []], ["consciously", 60, []], ["consciousness", 30, []], ["consciousnesses", 30, []], ["consentaneous", 85, []], ["consentaneously", 85, []], ["conspicuous", 60, []], ["conspicuously", 85, []], ["conspicuousness", 85, []], ["conspicuousnesses", 85, []], ["contagious", 60, []], ["contagiously", 85, []], ["contagiousness", 85, []], ["contagiousnesses", 85, []], ["contemporaneous", 85, []], ["contemporaneously", 85, []], ["contemporaneousness", 85, []], ["contemporaneousnesses", 85, []], ["contemptuous", 85, []], ["contemptuously", 85, []], ["contemptuousness", 85, []], ["contemptuousnesses", 85, []], ["contentious", 60, []], ["contentiously", 85, []], ["contentiousness", 85, []], ["contentiousnesses", 85, []], ["contiguous", 60, []], ["contiguously", 85, []], ["contiguousness", 85, []], ["contiguousnesses", 85, []], ["continuous", 30, []], ["continuously", 60, []], ["continuousness", 85, []], ["continuousnesses", 85, []], ["contradictious", 85, []], ["contrarious", 85, []], ["contumacious", 85, []], ["contumaciously", 85, []], ["contumelious", 85, []], ["contumeliously", 85, []], ["cooed", 60, []], ["cooee", 85, []], ["cooeed", 85, []], ["cooeeing", 85, []], ["cooees", 85, []], ["cooer", 85, []], ["cooers", 85, []], ["cooey", 85, []], ["cooeyed", 85, []], ["cooeying", 85, []], ["cooeys", 85, []], ["cooing", 60, []], ["cooingly", 85, []], ["copious", 60, []], ["copiously", 85, []], ["copiousness", 85, []], ["copiousnesses", 85, []], ["coriaceous", 85, []], ["corneous", 85, []], ["coryphaei", 85, []], ["coryphaeus", 85, []], ["coteau", 85, []], ["coteaux", 85, []], ["cotquean", 85, []], ["cotqueans", 85, []], ["courageous", 60, []], ["courageously", 85, []], ["courageousness", 85, []], ["courageousnesses", 85, []], ["courteous", 60, []], ["courteously", 85, []], ["courteousness", 85, []], ["courteousnesses", 85, []], ["couteau", 85, []], ["couteaux", 85, []], ["crustaceous", 85, []], ["cuckooed", 60, []], ["cuckooing", 60, []], ["cueing", 60, []], ["cupreous", 85, []], ["curiae", 85, []], ["curious", 30, []], ["curiouser", 85, []], ["curiousest", 85, []], ["curiously", 60, []], ["curiousness", 85, []], ["curiousnesses", 85, []], ["curvaceous", 85, []], ["curvacious", 85, []], ["cutaneous", 85, []], ["cutaneously", 85, []], ["cycadeoid", 85, []], ["cycadeoids", 85, []], ["deaerate", 85, []], ["deaerated", 85, []], ["deaerates", 85, []], ["deaerating", 85, []], ["deaeration", 85, []], ["deaerations", 85, []], ["deaerator", 85, []], ["deaerators", 85, []], ["deair", 85, []], ["deaired", 85, []], ["deairing", 85, []], ["deairs", 85, []], ["deciduae", 85, []], ["deciduous", 85, []], ["deciduousness", 85, []], ["deciduousnesses", 85, []], ["decreeing", 60, []], ["defleaed", 85, []], ["defleaing", 85, []], ["deionization", 85, []], ["deionizations", 85, []], ["deionize", 85, []], ["deionized", 85, []], ["deionizer", 85, []], ["deionizers", 85, []], ["deionizes", 85, []], ["deionizing", 85, []], ["deleterious", 85, []], ["deleteriously", 85, []], ["deleteriousness", 85, []], ["deleteriousnesses", 85, []], ["delicious", 30, []], ["deliciously", 85, []], ["deliciousness", 85, []], ["deliciousnesses", 85, []], ["delirious", 85, []], ["deliriously", 85, []], ["deliriousness", 85, []], ["deliriousnesses", 85, []], ["denouement", 85, []], ["denouements", 85, []], ["despiteous", 85, []], ["despiteously", 85, []], ["devious", 85, []], ["deviously", 85, []], ["deviousness", 85, []], ["deviousnesses", 85, []], ["diaereses", 85, []], ["diaeresis", 85, []], ["diaeretic", 85, []], ["diarrhoea", 85, []], ["diarrhoeas", 85, []], ["diastereoisomer", 85, []], ["diastereoisomeric", 85, []], ["diastereoisomerism", 85, []], ["diastereoisomerisms", 85, []], ["diastereoisomers", 85, []], ["diatomaceous", 85, []], ["diecious", 85, []], ["dieing", 10, []], ["differentiae", 85, []], ["dioecies", 85, []], ["dioecious", 85, []], ["dioecism", 85, []], ["dioecisms", 85, []], ["dioecy", 85, []], ["dioicous", 85, []], ["disadvantageous", 85, []], ["disadvantageously", 85, []], ["disadvantageousness", 85, []], ["disadvantageousnesses", 85, []], ["disagreeable", 85, []], ["disagreeableness", 85, []], ["disagreeablenesses", 85, []], ["disagreeably", 85, []], ["disagreeing", 60, []], ["discontinuous", 85, []], ["discontinuously", 85, []], ["discourteous", 85, []], ["discourteously", 85, []], ["discourteousness", 85, []], ["discourteousnesses", 85, []], ["disharmonious", 85, []], ["disingenuous", 85, []], ["disingenuously", 85, []], ["disingenuousness", 85, []], ["disingenuousnesses", 85, []], ["dispiteous", 85, []], ["disputatious", 85, []], ["disputatiously", 85, []], ["disputatiousness", 85, []], ["disputatiousnesses", 85, []], ["disquiet", 85, []], ["disquieted", 85, []], ["disquieting", 85, []], ["disquietingly", 85, []], ["disquietly", 85, []], ["disquiets", 85, []], ["disquietude", 85, []], ["disquietudes", 85, []], ["dissentious", 85, []], ["dreeing", 85, []], ["drupaceous", 85, []], ["dubious", 60, []], ["dubiously", 85, []], ["dubiousness", 85, []], ["dubiousnesses", 85, []], ["duteous", 85, []], ["dyspnoea", 85, []], ["dyspnoeas", 85, []], ["eau", 60, []], ["eaux", 85, []], ["ecclesiae", 85, []], ["edacious", 85, []], ["efficacious", 85, []], ["efficaciously", 85, []], ["efficaciousness", 85, []], ["efficaciousnesses", 85, []], ["egregious", 60, []], ["egregiously", 85, []], ["egregiousness", 85, []], ["egregiousnesses", 85, []], ["embourgeoisement", 85, []], ["embourgeoisements", 85, []], ["emceeing", 85, []], ["envious", 60, []], ["enviously", 85, []], ["enviousness", 85, []], ["enviousnesses", 85, []], ["epeeist", 85, []], ["epeeists", 85, []], ["epigeous", 85, []], ["epinaoi", 85, []], ["epithelioid", 85, []], ["epopoeia", 85, []], ["epopoeias", 85, []], ["equiangular", 85, []], ["ericaceous", 85, []], ["erroneous", 60, []], ["erroneously", 85, []], ["erroneousness", 85, []], ["erroneousnesses", 85, []], ["erythropoieses", 85, []], ["erythropoiesis", 85, []], ["erythropoietic", 85, []], ["erythropoietin", 85, []], ["erythropoietins", 85, []], ["eulogiae", 85, []], ["euonymus", 85, []], ["euonymuses", 85, []], ["euphonious", 85, []], ["euphoniously", 85, []], ["euphoniousness", 85, []], ["euphoniousnesses", 85, []], ["eupnoea", 85, []], ["eupnoeas", 85, []], ["eupnoeic", 85, []], ["evacuee", 85, []], ["evacuees", 85, []], ["excrementitious", 85, []], ["exequial", 85, []], ["exequies", 85, []], ["exiguous", 85, []], ["exiguously", 85, []], ["exiguousness", 85, []], ["exiguousnesses", 85, []], ["eximious", 85, []], ["expeditious", 85, []], ["expeditiously", 85, []], ["expeditiousness", 85, []], ["expeditiousnesses", 85, []], ["extemporaneous", 85, []], ["extemporaneously", 85, []], ["extemporaneousness", 85, []], ["extemporaneousnesses", 85, []], ["extraneous", 85, []], ["extraneously", 85, []], ["extraneousness", 85, []], ["extraneousnesses", 85, []], ["exuviae", 85, []], ["fabliau", 85, []], ["fabliaux", 85, []], ["facetiae", 85, []], ["facetious", 85, []], ["facetiously", 85, []], ["facetiousness", 85, []], ["facetiousnesses", 85, []], ["factious", 85, []], ["factiously", 85, []], ["factiousness", 85, []], ["factiousnesses", 85, []], ["factitious", 85, []], ["factitiously", 85, []], ["factitiousness", 85, []], ["factitiousnesses", 85, []], ["faience", 85, []], ["faiences", 85, []], ["fallacious", 85, []], ["fallaciously", 85, []], ["fallaciousness", 85, []], ["fallaciousnesses", 85, []], ["farinaceous", 85, []], ["farseeing", 85, []], ["fasciae", 85, []], ["fashious", 85, []], ["fastidious", 85, []], ["fastidiously", 85, []], ["fastidiousness", 85, []], ["fastidiousnesses", 85, []], ["fastuous", 85, []], ["fatuous", 85, []], ["fatuously", 85, []], ["fatuousness", 85, []], ["fatuousnesses", 85, []], ["fauteuil", 85, []], ["fauteuils", 85, []], ["feeing", 30, []], ["felonious", 85, []], ["feloniously", 85, []], ["feloniousness", 85, []], ["feloniousnesses", 85, []], ["feriae", 85, []], ["ferocious", 60, []], ["ferociously", 85, []], ["ferociousness", 85, []], ["ferociousnesses", 85, []], ["ferreous", 85, []], ["feuar", 85, []], ["feuars", 85, []], ["feued", 85, []], ["feuilleton", 85, []], ["feuilletonism", 85, []], ["feuilletonisms", 85, []], ["feuilletonist", 85, []], ["feuilletonists", 85, []], ["feuilletons", 85, []], ["feuing", 85, []], ["fictitious", 60, []], ["fictitiously", 85, []], ["fictitiousness", 85, []], ["fictitiousnesses", 85, []], ["filagreeing", 85, []], ["filariae", 85, []], ["filigreeing", 85, []], ["fimbriae", 85, []], ["flagitious", 85, []], ["flagitiously", 85, []], ["flagitiousness", 85, []], ["flagitiousnesses", 85, []], ["flambeau", 85, []], ["flambeaus", 85, []], ["flambeaux", 85, []], ["flameout", 85, []], ["flameouts", 85, []], ["fleeing", 60, []], ["flexuous", 85, []], ["flirtatious", 85, []], ["flirtatiously", 85, []], ["flirtatiousness", 85, []], ["flirtatiousnesses", 85, []], ["flooey", 85, []], ["flooie", 85, []], ["foliaceous", 85, []], ["folioed", 60, []], ["folioing", 60, []], ["folious", 85, []], ["foreseeabilities", 85, []], ["foreseeability", 85, []], ["foreseeable", 60, []], ["foreseeing", 60, []], ["fouette", 85, []], ["fouettes", 85, []], ["foveae", 85, []], ["fractious", 85, []], ["fractiously", 85, []], ["fractiousness", 85, []], ["fractiousnesses", 85, []], ["freeing", 10, []], ["fricandeau", 85, []], ["fricandeaus", 85, []], ["fricandeaux", 85, []], ["fricasseeing", 85, []], ["fructuous", 85, []], ["fugacious", 85, []], ["furcraea", 85, []], ["furcraeas", 85, []], ["furious", 60, []], ["furiously", 60, []], ["gaeing", 85, []], ["gaieties", 85, []], ["gaiety", 85, []], ["galeae", 85, []], ["gallinaceous", 85, []], ["garnisheeing", 85, []], ["gaseous", 85, []], ["gaseousness", 85, []], ["gaseousnesses", 85, []], ["gastraea", 85, []], ["gastraeas", 85, []], ["gateau", 85, []], ["gateaux", 85, []], ["geeing", 60, []], ["geoid", 85, []], ["geoidal", 85, []], ["geoids", 85, []], ["gheraoed", 85, []], ["gheraoes", 85, []], ["gheraoing", 85, []], ["giaour", 85, []], ["giaours", 85, []], ["gieing", 85, []], ["glorious", 60, []], ["gloriously", 85, []], ["gloriousness", 85, []], ["gloriousnesses", 85, []], ["glueing", 60, []], ["gluier", 85, []], ["gluiest", 85, []], ["gobioid", 85, []], ["gobioids", 85, []], ["gooey", 85, []], ["gooeyness", 85, []], ["gooeynesses", 85, []], ["gooier", 85, []], ["gooiest", 85, []], ["gorgeous", 30, []], ["gorgeously", 85, []], ["gorgeousness", 85, []], ["gorgeousnesses", 85, []], ["gouache", 85, []], ["gouaches", 85, []], ["gracious", 60, []], ["graciously", 85, []], ["graciousness", 85, []], ["graciousnesses", 85, []], ["gramineous", 85, []], ["granulocytopoieses", 85, []], ["granulocytopoiesis", 85, []], ["gratineeing", 85, []], ["greeing", 85, []], ["gregarious", 85, []], ["gregariously", 85, []], ["gregariousness", 85, []], ["gregariousnesses", 85, []], ["griseous", 85, []], ["guaiac", 85, []], ["guaiacol", 85, []], ["guaiacols", 85, []], ["guaiacs", 85, []], ["guaiacum", 85, []], ["guaiacums", 85, []], ["guaiocum", 85, []], ["guaiocums", 85, []], ["guaranteeing", 30, []], ["gumshoeing", 85, []], ["gypseian", 85, []], ["gypseous", 85, []], ["haeing", 60, []], ["halloaed", 85, []], ["halloaing", 85, []], ["hallooed", 85, []], ["hallooing", 85, []], ["harmonious", 60, []], ["harmoniously", 85, []], ["harmoniousness", 85, []], ["harmoniousnesses", 85, []], ["hausfrauen", 85, []], ["haviour", 85, []], ["haviours", 85, []], ["heaume", 85, []], ["heaumes", 85, []], ["hellacious", 85, []], ["hellaciously", 85, []], ["hematopoieses", 85, []], ["hematopoiesis", 85, []], ["hematopoietic", 85, []], ["hemopoieses", 85, []], ["hemopoiesis", 85, []], ["hemopoietic", 85, []], ["herbaceous", 85, []], ["hermaean", 85, []], ["herniae", 85, []], ["heteroauxin", 85, []], ["heteroauxins", 85, []], ["heteroecious", 85, []], ["heterogeneous", 85, []], ["heterogeneously", 85, []], ["heterogeneousness", 85, []], ["heterogeneousnesses", 85, []], ["hideous", 60, []], ["hideously", 85, []], ["hideousness", 85, []], ["hideousnesses", 85, []], ["hideout", 85, []], ["hideouts", 85, []], ["hieing", 85, []], ["hilarious", 30, []], ["hilariously", 85, []], ["hilariousness", 85, []], ["hilariousnesses", 85, []], ["hilloaed", 85, []], ["hilloaing", 85, []], ["hoeing", 60, []], ["hogtieing", 85, []], ["holloaed", 85, []], ["holloaing", 85, []], ["hollooed", 85, []], ["hollooing", 85, []], ["homogeneous", 60, []], ["homogeneously", 85, []], ["homogeneousness", 85, []], ["homogeneousnesses", 85, []], ["homoiotherm", 85, []], ["homoiothermic", 85, []], ["homoiotherms", 85, []], ["homoiousian", 85, []], ["homoiousians", 85, []], ["homoousian", 85, []], ["homoousians", 85, []], ["hoodooed", 85, []], ["hoodooing", 85, []], ["hoodooism", 85, []], ["hoodooisms", 85, []], ["hooey", 85, []], ["hooeys", 85, []], ["horseshoeing", 60, []], ["hugeous", 85, []], ["hugeously", 85, []], ["hulloaed", 85, []], ["hulloaing", 85, []], ["hydriae", 85, []], ["hygieist", 85, []], ["hygieists", 85, []], ["hypercautious", 85, []], ["hyperconscious", 85, []], ["hyperconsciousness", 85, []], ["hyperconsciousnesses", 85, []], ["hyperfastidious", 85, []], ["hypoeutectoid", 85, []], ["hypogeous", 85, []], ["hyponoia", 85, []], ["hyponoias", 85, []], ["idoneous", 85, []], ["igneous", 85, []], ["ignominious", 85, []], ["ignominiously", 85, []], ["ignominiousness", 85, []], ["ignominiousnesses", 85, []], ["illustrious", 60, []], ["illustriously", 85, []], ["illustriousness", 85, []], ["illustriousnesses", 85, []], ["impecunious", 85, []], ["impecuniously", 85, []], ["impecuniousness", 85, []], ["impecuniousnesses", 85, []], ["imperious", 85, []], ["imperiously", 85, []], ["imperiousness", 85, []], ["imperiousnesses", 85, []], ["impervious", 85, []], ["imperviously", 85, []], ["imperviousness", 85, []], ["imperviousnesses", 85, []], ["impetuous", 85, []], ["impetuously", 85, []], ["impetuousness", 85, []], ["impetuousnesses", 85, []], ["impious", 85, []], ["impiously", 85, []], ["inauspicious", 85, []], ["inauspiciously", 85, []], ["inauspiciousness", 85, []], ["inauspiciousnesses", 85, []], ["incautious", 85, []], ["incautiously", 85, []], ["incautiousness", 85, []], ["incautiousnesses", 85, []], ["incestuous", 85, []], ["incestuously", 85, []], ["incestuousness", 85, []], ["incestuousnesses", 85, []], ["incommodious", 85, []], ["incommodiously", 85, []], ["incommodiousness", 85, []], ["incommodiousnesses", 85, []], ["incongruous", 85, []], ["incongruously", 85, []], ["incongruousness", 85, []], ["incongruousnesses", 85, []], ["inconspicuous", 85, []], ["inconspicuously", 85, []], ["inconspicuousness", 85, []], ["inconspicuousnesses", 85, []], ["incurious", 85, []], ["incuriously", 85, []], ["incuriousness", 85, []], ["incuriousnesses", 85, []], ["industrious", 85, []], ["industriously", 85, []], ["industriousness", 85, []], ["industriousnesses", 85, []], ["inefficacious", 85, []], ["inefficaciously", 85, []], ["inefficaciousness", 85, []], ["inefficaciousnesses", 85, []], ["inertiae", 85, []], ["infectious", 60, []], ["infectiously", 85, []], ["infectiousness", 85, []], ["infectiousnesses", 85, []], ["ingenious", 60, []], ["ingeniously", 85, []], ["ingeniousness", 85, []], ["ingeniousnesses", 85, []], ["ingenuous", 85, []], ["ingenuously", 85, []], ["ingenuousness", 85, []], ["ingenuousnesses", 85, []], ["inglorious", 85, []], ["ingloriously", 85, []], ["ingloriousness", 85, []], ["ingloriousnesses", 85, []], ["inharmonious", 85, []], ["inharmoniously", 85, []], ["inharmoniousness", 85, []], ["inharmoniousnesses", 85, []], ["inhomogeneous", 85, []], ["injudicious", 85, []], ["injudiciously", 85, []], ["injudiciousness", 85, []], ["injudiciousnesses", 85, []], ["injurious", 85, []], ["injuriously", 85, []], ["injuriousness", 85, []], ["injuriousnesses", 85, []], ["innocuous", 85, []], ["innocuously", 85, []], ["innocuousness", 85, []], ["innocuousnesses", 85, []], ["inquiet", 85, []], ["inquieted", 85, []], ["inquieting", 85, []], ["inquiets", 85, []], ["inquietude", 85, []], ["inquietudes", 85, []], ["insalubrious", 85, []], ["insidious", 60, []], ["insidiously", 85, []], ["insidiousness", 85, []], ["insidiousnesses", 85, []], ["instantaneous", 60, []], ["instantaneously", 85, []], ["instantaneousness", 85, []], ["instantaneousnesses", 85, []], ["intaglioed", 85, []], ["intaglioing", 85, []], ["interreligious", 85, []], ["intracutaneous", 85, []], ["intracutaneously", 85, []], ["invidious", 85, []], ["invidiously", 85, []], ["invidiousness", 85, []], ["invidiousnesses", 85, []], ["ipomoea", 85, []], ["ipomoeas", 85, []], ["irreligious", 85, []], ["irreligiously", 85, []], ["jambeau", 85, []], ["jambeaux", 85, []], ["jeeing", 85, []], ["jiao", 85, []], ["joual", 85, []], ["jouals", 85, []], ["judicious", 85, []], ["judiciously", 85, []], ["judiciousness", 85, []], ["judiciousnesses", 85, []], ["kaiak", 85, []], ["kaiaks", 85, []], ["kamaaina", 85, []], ["kamaainas", 85, []], ["kiaugh", 85, []], ["kiaughs", 85, []], ["kneeing", 30, []], ["laborious", 85, []], ["laboriously", 85, []], ["laboriousness", 85, []], ["laboriousnesses", 85, []], ["lacteous", 85, []], ["lamiae", 85, []], ["lammergeier", 85, []], ["lammergeiers", 85, []], ["lascivious", 85, []], ["lasciviously", 85, []], ["lasciviousness", 85, []], ["lasciviousnesses", 85, []], ["lauan", 85, []], ["lauans", 85, []], ["leukopoieses", 85, []], ["leukopoiesis", 85, []], ["leukopoietic", 85, []], ["leveeing", 85, []], ["liaise", 85, []], ["liaised", 85, []], ["liaises", 85, []], ["liaising", 85, []], ["liaison", 60, []], ["liaisons", 60, []], ["licentious", 85, []], ["licentiously", 85, []], ["licentiousness", 85, []], ["licentiousnesses", 85, []], ["lieu", 60, []], ["lieus", 60, []], ["lieutenancies", 85, []], ["lieutenancy", 85, []], ["lieutenant", 30, []], ["lieutenants", 30, []], ["ligneous", 85, []], ["linguae", 85, []], ["liqueur", 85, []], ["liqueurs", 85, []], ["litigious", 85, []], ["litigiously", 85, []], ["litigiousness", 85, []], ["litigiousnesses", 85, []], ["logaoedic", 85, []], ["logaoedics", 85, []], ["longueur", 85, []], ["longueurs", 85, []], ["looed", 60, []], ["looey", 85, []], ["looeys", 85, []], ["looie", 85, []], ["looies", 85, []], ["looing", 60, []], ["loquacious", 85, []], ["loquaciously", 85, []], ["loquaciousness", 85, []], ["loquaciousnesses", 85, []], ["louie", 60, []], ["louies", 60, []], ["louis", 30, []], ["luau", 85, []], ["luaus", 85, []], ["lubricious", 85, []], ["lubriciously", 85, []], ["lugubrious", 85, []], ["lugubriously", 85, []], ["lugubriousness", 85, []], ["lugubriousnesses", 85, []], ["luscious", 85, []], ["lusciously", 85, []], ["lusciousness", 85, []], ["lusciousnesses", 85, []], ["luteous", 85, []], ["luxurious", 60, []], ["luxuriously", 85, []], ["luxuriousness", 85, []], ["luxuriousnesses", 85, []], ["maieutic", 85, []], ["maiolica", 85, []], ["maiolicas", 85, []], ["malarious", 85, []], ["malicious", 60, []], ["maliciously", 85, []], ["maliciousness", 85, []], ["maliciousnesses", 85, []], ["manoeuvre", 85, []], ["manoeuvred", 85, []], ["manoeuvres", 85, []], ["manoeuvring", 85, []], ["manteau", 85, []], ["manteaus", 85, []], ["manteaux", 85, []], ["marquee", 60, []], ["marquees", 60, []], ["mediae", 85, []], ["mediaeval", 85, []], ["mediaevals", 85, []], ["meioses", 85, []], ["meiosis", 85, []], ["meiotic", 85, []], ["meiotically", 85, []], ["mellifluous", 85, []], ["mellifluously", 85, []], ["mellifluousness", 85, []], ["mellifluousnesses", 85, []], ["melodious", 85, []], ["melodiously", 85, []], ["melodiousness", 85, []], ["melodiousnesses", 85, []], ["mendacious", 85, []], ["mendaciously", 85, []], ["mendaciousness", 85, []], ["mendaciousnesses", 85, []], ["meou", 85, []], ["meoued", 85, []], ["meouing", 85, []], ["meous", 85, []], ["meretricious", 85, []], ["meretriciously", 85, []], ["meretriciousness", 85, []], ["meretriciousnesses", 85, []], ["meritorious", 85, []], ["meritoriously", 85, []], ["meritoriousness", 85, []], ["meritoriousnesses", 85, []], ["mesogloea", 85, []], ["mesogloeas", 85, []], ["messieurs", 85, []], ["metacercariae", 85, []], ["metasequoia", 85, []], ["metasequoias", 85, []], ["miaou", 85, []], ["miaoued", 85, []], ["miaouing", 85, []], ["miaous", 85, []], ["miaow", 85, []], ["miaowed", 85, []], ["miaowing", 85, []], ["miaows", 85, []], ["miaul", 85, []], ["miauled", 85, []], ["miauling", 85, []], ["miauls", 85, []], ["micaceous", 85, []], ["microearthquake", 85, []], ["microearthquakes", 85, []], ["microfilariae", 85, []], ["milieu", 85, []], ["milieus", 85, []], ["milieux", 85, []], ["mimeoed", 85, []], ["mimeoing", 85, []], ["minutiae", 85, []], ["miscellaneous", 60, []], ["miscellaneously", 85, []], ["miscellaneousness", 85, []], ["miscellaneousnesses", 85, []], ["moieties", 85, []], ["moiety", 85, []], ["monecious", 85, []], ["monoecious", 85, []], ["monsieur", 60, []], ["mooed", 30, []], ["mooing", 30, []], ["morceau", 85, []], ["morceaux", 85, []], ["moue", 85, []], ["moues", 85, []], ["mouille", 85, []], ["movieola", 85, []], ["movieolas", 85, []], ["mucocutaneous", 85, []], ["multiauthor", 85, []], ["multifarious", 85, []], ["multifariousness", 85, []], ["multifariousnesses", 85, []], ["multireligious", 85, []], ["mustachioed", 85, []], ["mysterious", 30, []], ["mysteriously", 60, []], ["mysteriousness", 85, []], ["mysteriousnesses", 85, []], ["mythopoeia", 85, []], ["mythopoeias", 85, []], ["mythopoeic", 85, []], ["nacreous", 85, []], ["naiad", 85, []], ["naiades", 85, []], ["naiads", 85, []], ["naoi", 85, []], ["naumachiae", 85, []], ["nauseous", 85, []], ["nauseously", 85, []], ["nauseousness", 85, []], ["nauseousnesses", 85, []], ["nefarious", 85, []], ["nefariously", 85, []], ["neoorthodox", 85, []], ["neoorthodoxies", 85, []], ["neoorthodoxy", 85, []], ["nimious", 85, []], ["niveous", 85, []], ["noctuoid", 85, []], ["nocuous", 85, []], ["nocuously", 85, []], ["nonambiguous", 85, []], ["nonaqueous", 85, []], ["nonconscious", 85, []], ["noncontagious", 85, []], ["noncontiguous", 85, []], ["noncontinuous", 85, []], ["nongaseous", 85, []], ["nongregarious", 85, []], ["nonhomogeneous", 85, []], ["noninfectious", 85, []], ["nonnutritious", 85, []], ["nonobvious", 85, []], ["nonradioactive", 85, []], ["nonreligious", 85, []], ["nonsensuous", 85, []], ["nonserious", 85, []], ["nonsimultaneous", 85, []], ["notorious", 60, []], ["notoriously", 60, []], ["nouveau", 85, []], ["noxious", 85, []], ["noxiously", 85, []], ["noxiousness", 85, []], ["noxiousnesses", 85, []], ["nucleoid", 85, []], ["nucleoids", 85, []], ["nutritious", 60, []], ["nutritiously", 85, []], ["nutritiousness", 85, []], ["nutritiousnesses", 85, []], ["oblivious", 60, []], ["obliviously", 85, []], ["obliviousness", 85, []], ["obliviousnesses", 85, []], ["obloquies", 85, []], ["obnoxious", 60, []], ["obnoxiously", 85, []], ["obnoxiousness", 85, []], ["obnoxiousnesses", 85, []], ["obsequies", 85, []], ["obsequious", 85, []], ["obsequiously", 85, []], ["obsequiousness", 85, []], ["obsequiousnesses", 85, []], ["obvious", 30, []], ["obviously", 30, []], ["obviousness", 85, []], ["obviousnesses", 85, []], ["ochreae", 85, []], ["ochreous", 85, []], ["ocreae", 85, []], ["odious", 85, []], ["odiously", 85, []], ["odiousness", 85, []], ["odiousnesses", 85, []], ["oeillade", 85, []], ["oeillades", 85, []], ["oeuvre", 85, []], ["oeuvres", 85, []], ["officious", 85, []], ["officiously", 85, []], ["officiousness", 85, []], ["officiousnesses", 85, []], ["olivaceous", 85, []], ["omnifarious", 85, []], ["onomatopoeia", 60, []], ["onomatopoeias", 60, []], ["onomatopoeic", 85, []], ["onomatopoeically", 85, []], ["opioid", 60, []], ["opioids", 60, []], ["opprobrious", 85, []], ["opprobriously", 85, []], ["opprobriousness", 85, []], ["opprobriousnesses", 85, []], ["orchidaceous", 85, []], ["osmious", 85, []], ["osseous", 85, []], ["ostentatious", 85, []], ["ostentatiously", 85, []], ["ostentatiousness", 85, []], ["ostentatiousnesses", 85, []], ["osteoarthritic", 85, []], ["osteoarthritides", 85, []], ["osteoarthritis", 85, []], ["osteoid", 85, []], ["osteoids", 85, []], ["ouabain", 85, []], ["ouabains", 85, []], ["ouistiti", 85, []], ["ouistitis", 85, []], ["outrageous", 60, []], ["outrageously", 85, []], ["outrageousness", 85, []], ["outrageousnesses", 85, []], ["outseeing", 85, []], ["overambitious", 85, []], ["overambitiousness", 85, []], ["overambitiousnesses", 85, []], ["overanxious", 85, []], ["overcautious", 85, []], ["overconscientious", 85, []], ["overconscious", 85, []], ["overfastidious", 85, []], ["overingenious", 85, []], ["overobvious", 85, []], ["overseeing", 60, []], ["overserious", 85, []], ["overseriously", 85, []], ["oversuspicious", 85, []], ["paean", 85, []], ["paeanism", 85, []], ["paeanisms", 85, []], ["paeans", 85, []], ["paeon", 85, []], ["paeons", 85, []], ["paleae", 85, []], ["paleoanthropological", 85, []], ["paleoanthropologies", 85, []], ["paleoanthropologist", 85, []], ["paleoanthropologists", 85, []], ["paleoanthropology", 85, []], ["paleoecologic", 85, []], ["paleoecological", 85, []], ["paleoecologies", 85, []], ["paleoecologist", 85, []], ["paleoecologists", 85, []], ["paleoecology", 85, []], ["papilionaceous", 85, []], ["paranoea", 85, []], ["paranoeas", 85, []], ["paranoia", 60, []], ["paranoiac", 85, []], ["paranoiacs", 85, []], ["paranoias", 60, []], ["parsimonious", 85, []], ["parsimoniously", 85, []], ["paviour", 85, []], ["paviours", 85, []], ["pectinaceous", 85, []], ["peeing", 60, []], ["penurious", 85, []], ["penuriously", 85, []], ["penuriousness", 85, []], ["penuriousnesses", 85, []], ["percutaneous", 85, []], ["percutaneously", 85, []], ["pereia", 85, []], ["pereion", 85, []], ["pereiopod", 85, []], ["pereiopods", 85, []], ["perfidious", 85, []], ["perfidiously", 85, []], ["perfidiousness", 85, []], ["perfidiousnesses", 85, []], ["peripeteia", 85, []], ["peripeteias", 85, []], ["perjurious", 85, []], ["perjuriously", 85, []], ["pernicious", 85, []], ["perniciously", 85, []], ["perniciousness", 85, []], ["perniciousnesses", 85, []], ["perspicacious", 85, []], ["perspicaciously", 85, []], ["perspicaciousness", 85, []], ["perspicaciousnesses", 85, []], ["perspicuous", 85, []], ["perspicuously", 85, []], ["perspicuousness", 85, []], ["perspicuousnesses", 85, []], ["pertinacious", 85, []], ["pertinaciously", 85, []], ["pertinaciousness", 85, []], ["pertinaciousnesses", 85, []], ["pervious", 85, []], ["perviousness", 85, []], ["perviousnesses", 85, []], ["petechiae", 85, []], ["pharmacopeia", 85, []], ["pharmacopeial", 85, []], ["pharmacopeias", 85, []], ["pharmacopoeia", 85, []], ["pharmacopoeial", 85, []], ["pharmacopoeias", 85, []], ["phaseout", 85, []], ["phaseouts", 85, []], ["phenylthiourea", 85, []], ["phenylthioureas", 85, []], ["phooey", 85, []], ["photoautotroph", 85, []], ["photoautotrophic", 85, []], ["photoautotrophically", 85, []], ["photoautotrophs", 85, []], ["photoionization", 85, []], ["photoionizations", 85, []], ["photoionize", 85, []], ["photoionized", 85, []], ["photoionizes", 85, []], ["photoionizing", 85, []], ["piceous", 85, []], ["pieing", 30, []], ["pileous", 85, []], ["pious", 60, []], ["piously", 85, []], ["piousness", 85, []], ["piousnesses", 85, []], ["pipsqueak", 85, []], ["pipsqueaks", 85, []], ["pirouette", 85, []], ["pirouetted", 85, []], ["pirouettes", 85, []], ["pirouetting", 85, []], ["piteous", 85, []], ["piteously", 85, []], ["piteousness", 85, []], ["piteousnesses", 85, []], ["pixieish", 85, []], ["plateau", 60, []], ["plateaued", 60, []], ["plateauing", 60, []], ["plateaus", 60, []], ["plateaux", 85, []], ["plebeian", 85, []], ["plebeianism", 85, []], ["plebeianisms", 85, []], ["plebeianly", 85, []], ["plebeians", 85, []], ["pleiad", 85, []], ["pleiades", 85, []], ["pleiads", 85, []], ["pleiotropic", 85, []], ["pleiotropies", 85, []], ["pleiotropy", 85, []], ["plenteous", 85, []], ["plenteously", 85, []], ["plenteousness", 85, []], ["plenteousnesses", 85, []], ["pluvious", 85, []], ["poaceous", 85, []], ["pomaceous", 85, []], ["porcelaneous", 85, []], ["porcellaneous", 85, []], ["portmanteau", 85, []], ["portmanteaus", 85, []], ["portmanteaux", 85, []], ["postbourgeois", 85, []], ["preaudit", 85, []], ["preaudits", 85, []], ["precarious", 60, []], ["precariously", 85, []], ["precariousness", 85, []], ["precariousnesses", 85, []], ["precieuse", 85, []], ["precieux", 85, []], ["precious", 30, []], ["preciouses", 30, []], ["preciously", 85, []], ["preciousness", 85, []], ["preciousnesses", 85, []], ["precocious", 85, []], ["precociously", 85, []], ["precociousness", 85, []], ["precociousnesses", 85, []], ["preconscious", 85, []], ["preconsciouses", 85, []], ["preconsciously", 85, []], ["predaceous", 85, []], ["predaceousness", 85, []], ["predaceousnesses", 85, []], ["predacious", 85, []], ["preeing", 85, []], ["premeiotic", 85, []], ["prestigious", 60, []], ["prestigiously", 85, []], ["prestigiousness", 85, []], ["prestigiousnesses", 85, []], ["presumptuous", 85, []], ["presumptuously", 85, []], ["presumptuousness", 85, []], ["presumptuousnesses", 85, []], ["pretentious", 60, []], ["pretentiously", 85, []], ["pretentiousness", 85, []], ["pretentiousnesses", 85, []], ["previous", 10, []], ["previously", 30, []], ["previousness", 85, []], ["previousnesses", 85, []], ["priedieu", 85, []], ["priedieus", 85, []], ["priedieux", 85, []], ["proctodaea", 85, []], ["proctodaeum", 85, []], ["proctodaeums", 85, []], ["prodigious", 85, []], ["prodigiously", 85, []], ["prodigiousness", 85, []], ["prodigiousnesses", 85, []], ["promiscuous", 85, []], ["promiscuously", 85, []], ["promiscuousness", 85, []], ["promiscuousnesses", 85, []], ["propitious", 85, []], ["propitiously", 85, []], ["propitiousness", 85, []], ["propitiousnesses", 85, []], ["propylaea", 85, []], ["propylaeum", 85, []], ["prosopopoeia", 85, []], ["prosopopoeias", 85, []], ["proteinaceous", 85, []], ["psoae", 85, []], ["psoai", 85, []], ["pugnacious", 85, []], ["pugnaciously", 85, []], ["pugnaciousness", 85, []], ["pugnaciousnesses", 85, []], ["pumiceous", 85, []], ["punctilious", 85, []], ["punctiliously", 85, []], ["punctiliousness", 85, []], ["punctiliousnesses", 85, []], ["pureeing", 30, []], ["purlieu", 85, []], ["purlieus", 85, []], ["pygmaean", 85, []], ["quaalude", 85, []], ["quaaludes", 85, []], ["quaere", 85, []], ["quaeres", 85, []], ["quaestor", 85, []], ["quaestors", 85, []], ["quai", 85, []], ["quaich", 85, []], ["quaiches", 85, []], ["quaichs", 85, []], ["quaigh", 85, []], ["quaighs", 85, []], ["quail", 60, []], ["quailed", 60, []], ["quailing", 60, []], ["quails", 60, []], ["quaint", 60, []], ["quainter", 85, []], ["quaintest", 85, []], ["quaintly", 85, []], ["quaintness", 85, []], ["quaintnesses", 85, []], ["quais", 85, []], ["quean", 85, []], ["queans", 85, []], ["queasier", 85, []], ["queasiest", 85, []], ["queasily", 85, []], ["queasiness", 85, []], ["queasinesses", 85, []], ["queasy", 85, []], ["queazier", 85, []], ["queaziest", 85, []], ["queazy", 85, []], ["queen", 30, []], ["queendom", 85, []], ["queendoms", 85, []], ["queened", 30, []], ["queening", 30, []], ["queenlier", 85, []], ["queenliest", 85, []], ["queenliness", 85, []], ["queenlinesses", 85, []], ["queenly", 85, []], ["queens", 30, []], ["queenship", 85, []], ["queenships", 85, []], ["queenside", 85, []], ["queensides", 85, []], ["queer", 60, []], ["queered", 60, []], ["queerer", 85, []], ["queerest", 85, []], ["queering", 60, []], ["queerish", 85, []], ["queerly", 85, []], ["queerness", 85, []], ["queernesses", 85, []], ["queers", 60, []], ["queue", 10, []], ["queued", 10, []], ["queueing", 30, []], ["queuer", 85, []], ["queuers", 85, []], ["queues", 10, []], ["queuing", 10, []], ["quiescence", 85, []], ["quiescences", 85, []], ["quiescent", 85, []], ["quiescently", 85, []], ["quiet", 30, []], ["quieted", 30, []], ["quieten", 85, []], ["quietened", 85, []], ["quietening", 85, []], ["quietens", 85, []], ["quieter", 60, []], ["quieters", 60, []], ["quietest", 85, []], ["quieting", 30, []], ["quietism", 85, []], ["quietisms", 85, []], ["quietist", 85, []], ["quietistic", 85, []], ["quietists", 85, []], ["quietly", 30, []], ["quietness", 85, []], ["quietnesses", 85, []], ["quiets", 30, []], ["quietude", 85, []], ["quietudes", 85, []], ["quietus", 85, []], ["quietuses", 85, []], ["quillaia", 85, []], ["quillaias", 85, []], ["quoin", 85, []], ["quoined", 85, []], ["quoining", 85, []], ["quoins", 85, []], ["quoit", 85, []], ["quoited", 85, []], ["quoiting", 85, []], ["quoits", 85, []], ["radioactive", 60, []], ["radioactively", 85, []], ["radioactivities", 85, []], ["radioactivity", 85, []], ["radioallergosorbent", 85, []], ["radioautograph", 85, []], ["radioautographic", 85, []], ["radioautographies", 85, []], ["radioautographs", 85, []], ["radioautography", 85, []], ["radioecologies", 85, []], ["radioecology", 85, []], ["radioed", 10, []], ["radioelement", 85, []], ["radioelements", 85, []], ["radioimmunoassay", 85, []], ["radioimmunoassayable", 85, []], ["radioimmunoassays", 85, []], ["radioing", 10, []], ["radioisotope", 85, []], ["radioisotopes", 85, []], ["radioisotopic", 85, []], ["radioisotopically", 85, []], ["raia", 85, []], ["raias", 85, []], ["rambouillet", 85, []], ["rambouillets", 85, []], ["rambunctious", 85, []], ["rambunctiously", 85, []], ["rambunctiousness", 85, []], ["rambunctiousnesses", 85, []], ["rampageous", 85, []], ["rampageously", 85, []], ["rampageousness", 85, []], ["rampageousnesses", 85, []], ["rapacious", 85, []], ["rapaciously", 85, []], ["rapaciousness", 85, []], ["rapaciousnesses", 85, []], ["ratatouille", 85, []], ["ratatouilles", 85, []], ["razeeing", 85, []], ["reacquaint", 85, []], ["reacquainted", 85, []], ["reacquainting", 85, []], ["reacquaints", 85, []], ["reauthorization", 85, []], ["reauthorizations", 85, []], ["reauthorize", 85, []], ["reauthorized", 85, []], ["reauthorizes", 85, []], ["reauthorizing", 85, []], ["rebellious", 60, []], ["rebelliously", 85, []], ["rebelliousness", 85, []], ["rebelliousnesses", 85, []], ["rediae", 85, []], ["reearn", 85, []], ["reearned", 85, []], ["reearning", 85, []], ["reearns", 85, []], ["refereeing", 60, []], ["refugeeism", 85, []], ["refugeeisms", 85, []], ["religious", 30, []], ["religiously", 60, []], ["religiousness", 85, []], ["religiousnesses", 85, []], ["reliquiae", 85, []], ["reoil", 85, []], ["reoiled", 85, []], ["reoiling", 85, []], ["reoils", 85, []], ["reoutfit", 85, []], ["reoutfits", 85, []], ["reoutfitted", 85, []], ["reoutfitting", 85, []], ["repetitious", 85, []], ["repetitiously", 85, []], ["repetitiousness", 85, []], ["repetitiousnesses", 85, []], ["requiem", 85, []], ["requiems", 85, []], ["requiescat", 85, []], ["requiescats", 85, []], ["reseau", 85, []], ["reseaus", 85, []], ["reseaux", 85, []], ["reseeing", 85, []], ["reshoeing", 85, []], ["rickettsiae", 85, []], ["righteous", 60, []], ["righteously", 85, []], ["righteousness", 60, []], ["righteousnesses", 60, []], ["robustious", 85, []], ["robustiously", 85, []], ["robustiousness", 85, []], ["robustiousnesses", 85, []], ["rodeoed", 60, []], ["rodeoing", 60, []], ["rogueing", 60, []], ["rondeau", 85, []], ["rondeaux", 85, []], ["rosaceous", 85, []], ["roue", 85, []], ["rouen", 85, []], ["rouens", 85, []], ["roues", 85, []], ["rouille", 85, []], ["rouilles", 85, []], ["rouleau", 85, []], ["rouleaus", 85, []], ["rouleaux", 85, []], ["rousseau", 85, []], ["rousseaus", 85, []], ["rubious", 85, []], ["ructious", 85, []], ["rumbustious", 85, []], ["rumbustiously", 85, []], ["rumbustiousness", 85, []], ["rumbustiousnesses", 85, []], ["sacrilegious", 85, []], ["sacrilegiously", 85, []], ["sacrilegiousness", 85, []], ["sacrilegiousnesses", 85, []], ["sagacious", 85, []], ["sagaciously", 85, []], ["sagaciousness", 85, []], ["sagaciousnesses", 85, []], ["salacious", 85, []], ["salaciously", 85, []], ["salaciousness", 85, []], ["salaciousnesses", 85, []], ["salubrious", 85, []], ["salubriously", 85, []], ["salubriousness", 85, []], ["salubriousnesses", 85, []], ["sanctimonious", 85, []], ["sanctimoniously", 85, []], ["sanctimoniousness", 85, []], ["sanctimoniousnesses", 85, []], ["sanguineous", 85, []], ["sanious", 85, []], ["saponaceous", 85, []], ["saponaceousness", 85, []], ["saponaceousnesses", 85, []], ["sauerbraten", 85, []], ["sauerbratens", 85, []], ["sauerkraut", 85, []], ["sauerkrauts", 85, []], ["saviour", 60, []], ["saviours", 60, []], ["scabious", 85, []], ["scabiouses", 85, []], ["scarabaei", 85, []], ["scarabaeus", 85, []], ["scarabaeuses", 85, []], ["scarious", 85, []], ["sciaenid", 85, []], ["sciaenids", 85, []], ["scoriaceous", 85, []], ["scoriae", 85, []], ["scrumptious", 85, []], ["scrumptiously", 85, []], ["sebaceous", 85, []], ["seditious", 85, []], ["seditiously", 85, []], ["seditiousness", 85, []], ["seditiousnesses", 85, []], ["seeable", 85, []], ["seeing", 10, []], ["seeings", 10, []], ["segueing", 85, []], ["semeiologies", 85, []], ["semeiology", 85, []], ["semeiotic", 85, []], ["semeiotics", 85, []], ["semiautobiographical", 85, []], ["semiautomatic", 85, []], ["semiautomatically", 85, []], ["semiautomatics", 85, []], ["semiautonomous", 85, []], ["semiconscious", 85, []], ["semiconsciousness", 85, []], ["semiconsciousnesses", 85, []], ["semiprecious", 85, []], ["semireligious", 85, []], ["sensuous", 85, []], ["sensuously", 85, []], ["sensuousness", 85, []], ["sensuousnesses", 85, []], ["sententiae", 85, []], ["sententious", 85, []], ["sententiously", 85, []], ["sententiousness", 85, []], ["sententiousnesses", 85, []], ["sequacious", 85, []], ["sequaciously", 85, []], ["sequoia", 100, []], ["sequoias", 100, []], ["sericeous", 85, []], ["serious", 30, []], ["seriously", 30, []], ["seriousness", 60, []], ["seriousnesses", 60, []], ["setaceous", 85, []], ["shakeout", 85, []], ["shakeouts", 85, []], ["shampooed", 60, []], ["shampooer", 85, []], ["shampooers", 85, []], ["shampooing", 60, []], ["shanghaied", 60, []], ["shanghaier", 85, []], ["shanghaiers", 85, []], ["shanghaiing", 60, []], ["shivareeing", 85, []], ["shoeing", 30, []], ["shooed", 85, []], ["shooing", 85, []], ["sieur", 85, []], ["sieurs", 85, []], ["sightseeing", 60, []], ["silhouette", 60, []], ["silhouetted", 60, []], ["silhouettes", 60, []], ["silhouetting", 60, []], ["silhouettist", 85, []], ["silhouettists", 85, []], ["siliceous", 85, []], ["silicious", 85, []], ["siliquae", 85, []], ["simioid", 85, []], ["simious", 85, []], ["simultaneous", 60, []], ["simultaneously", 30, []], ["simultaneousness", 85, []], ["simultaneousnesses", 85, []], ["sinuous", 85, []], ["sinuously", 85, []], ["sinuousness", 85, []], ["sinuousnesses", 85, []], ["skeeing", 85, []], ["skiddooed", 85, []], ["skiddooing", 85, []], ["skidooed", 85, []], ["skidooing", 85, []], ["snowshoeing", 85, []], ["socioeconomic", 60, []], ["socioeconomically", 85, []], ["socioreligious", 85, []], ["solanaceous", 85, []], ["soliloquies", 85, []], ["sooey", 85, []], ["sortieing", 85, []], ["souari", 85, []], ["souaris", 85, []], ["spacious", 60, []], ["spaciously", 85, []], ["spaciousness", 85, []], ["spaciousnesses", 85, []], ["spaeing", 85, []], ["spaeings", 85, []], ["specious", 85, []], ["speciously", 85, []], ["speciousness", 85, []], ["speciousnesses", 85, []], ["spelaean", 85, []], ["spiraea", 85, []], ["spiraeas", 85, []], ["spirituous", 85, []], ["spontaneous", 60, []], ["spontaneously", 60, []], ["spontaneousness", 85, []], ["spontaneousnesses", 85, []], ["spurious", 85, []], ["spuriously", 85, []], ["spuriousness", 85, []], ["spuriousnesses", 85, []], ["squeak", 85, []], ["squeaked", 85, []], ["squeaker", 85, []], ["squeakers", 85, []], ["squeakier", 85, []], ["squeakiest", 85, []], ["squeaking", 85, []], ["squeaks", 85, []], ["squeaky", 85, []], ["squeal", 85, []], ["squealed", 85, []], ["squealer", 85, []], ["squealers", 85, []], ["squealing", 85, []], ["squeals", 85, []], ["squeamish", 85, []], ["squeamishly", 85, []], ["squeamishness", 85, []], ["squeamishnesses", 85, []], ["squeegee", 85, []], ["squeegeed", 85, []], ["squeegeeing", 85, []], ["squeegees", 85, []], ["squeezabilities", 85, []], ["squeezability", 85, []], ["squeezable", 85, []], ["squeeze", 60, []], ["squeezed", 60, []], ["squeezer", 85, []], ["squeezers", 85, []], ["squeezes", 60, []], ["squeezing", 60, []], ["squilgeeing", 85, []], ["squoosh", 85, []], ["squooshed", 85, []], ["squooshes", 85, []], ["squooshier", 85, []], ["squooshiest", 85, []], ["squooshing", 85, []], ["squooshy", 85, []], ["stakeout", 85, []], ["stakeouts", 85, []], ["stercoraceous", 85, []], ["stereoed", 60, []], ["stereoing", 60, []], ["stereoisomer", 85, []], ["stereoisomeric", 85, []], ["stereoisomerism", 85, []], ["stereoisomerisms", 85, []], ["stereoisomers", 85, []], ["stoae", 85, []], ["stoai", 85, []], ["stomodaea", 85, []], ["stomodaeal", 85, []], ["stomodaeum", 85, []], ["stomodaeums", 85, []], ["strenuous", 60, []], ["strenuously", 85, []], ["strenuousness", 85, []], ["strenuousnesses", 85, []], ["striae", 85, []], ["strikeout", 85, []], ["strikeouts", 85, []], ["struthious", 85, []], ["studious", 85, []], ["studiously", 85, []], ["studiousness", 85, []], ["studiousnesses", 85, []], ["stymieing", 85, []], ["subaqueous", 85, []], ["subconscious", 60, []], ["subconsciouses", 60, []], ["subconsciously", 85, []], ["subconsciousness", 85, []], ["subconsciousnesses", 85, []], ["subcoriaceous", 85, []], ["subcutaneous", 85, []], ["subcutaneously", 85, []], ["sublieutenant", 85, []], ["sublieutenants", 85, []], ["subreptitious", 85, []], ["subreptitiously", 85, []], ["subterraneous", 85, []], ["subterraneously", 85, []], ["succedaneous", 85, []], ["sulphureous", 85, []], ["sumptuous", 85, []], ["sumptuously", 85, []], ["sumptuousness", 85, []], ["sumptuousnesses", 85, []], ["superambitious", 85, []], ["superbureaucrat", 85, []], ["superbureaucrats", 85, []], ["supercautious", 85, []], ["supercilious", 85, []], ["superciliously", 85, []], ["superciliousness", 85, []], ["superciliousnesses", 85, []], ["superfluous", 85, []], ["superfluously", 85, []], ["superfluousness", 85, []], ["superfluousnesses", 85, []], ["superluxurious", 85, []], ["superstitious", 60, []], ["superstitiously", 85, []], ["suppositious", 85, []], ["supposititious", 85, []], ["supposititiously", 85, []], ["surreptitious", 85, []], ["surreptitiously", 85, []], ["suspicious", 60, []], ["suspiciously", 85, []], ["suspiciousness", 85, []], ["suspiciousnesses", 85, []], ["symphonious", 85, []], ["symphoniously", 85, []], ["tableau", 85, []], ["tableaus", 85, []], ["tableaux", 85, []], ["tabooed", 60, []], ["tabooing", 60, []], ["taeniae", 85, []], ["takeout", 85, []], ["takeouts", 85, []], ["tatouay", 85, []], ["tatouays", 85, []], ["tattooed", 30, []], ["tattooer", 85, []], ["tattooers", 85, []], ["tattooing", 30, []], ["tattooist", 85, []], ["tattooists", 85, []], ["tedious", 60, []], ["tediously", 85, []], ["tediousness", 85, []], ["tediousnesses", 85, []], ["teeing", 60, []], ["teiid", 85, []], ["teiids", 85, []], ["temerarious", 85, []], ["temerariously", 85, []], ["temerariousness", 85, []], ["temerariousnesses", 85, []], ["tempestuous", 85, []], ["tempestuously", 85, []], ["tempestuousness", 85, []], ["tempestuousnesses", 85, []], ["tenacious", 85, []], ["tenaciously", 85, []], ["tenaciousness", 85, []], ["tenaciousnesses", 85, []], ["tendencious", 85, []], ["tendentious", 85, []], ["tendentiously", 85, []], ["tendentiousness", 85, []], ["tendentiousnesses", 85, []], ["tenebrious", 85, []], ["teniae", 85, []], ["tenuous", 85, []], ["tenuously", 85, []], ["tenuousness", 85, []], ["tenuousnesses", 85, []], ["terraqueous", 85, []], ["testaceous", 85, []], ["thiouracil", 85, []], ["thiouracils", 85, []], ["thiourea", 85, []], ["thioureas", 85, []], ["tholeiite", 85, []], ["tholeiites", 85, []], ["tholeiitic", 85, []], ["thoued", 30, []], ["thouing", 30, []], ["thyreoid", 85, []], ["tibiae", 85, []], ["tieing", 30, []], ["timeous", 85, []], ["timeously", 85, []], ["timeout", 60, []], ["timeouts", 60, []], ["tippytoeing", 85, []], ["tiptoeing", 85, []], ["toea", 85, []], ["toeing", 60, []], ["tonneau", 85, []], ["tonneaus", 85, []], ["tonneaux", 85, []], ["tortious", 85, []], ["tortiously", 85, []], ["tortuous", 85, []], ["tortuously", 85, []], ["tortuousness", 85, []], ["tortuousnesses", 85, []], ["tracheae", 85, []], ["transcutaneous", 85, []], ["transpicuous", 85, []], ["treeing", 30, []], ["triiodothyronine", 85, []], ["triiodothyronines", 85, []], ["trochleae", 85, []], ["trousseau", 85, []], ["trousseaus", 85, []], ["trousseaux", 85, []], ["trueing", 10, []], ["trumeau", 85, []], ["trumeaux", 85, []], ["trusteeing", 60, []], ["tufaceous", 85, []], ["tuffaceous", 85, []], ["tumultuous", 85, []], ["tumultuously", 85, []], ["tumultuousness", 85, []], ["tumultuousnesses", 85, []], ["turquois", 85, []], ["turquoise", 60, []], ["turquoises", 60, []], ["ultracautious", 85, []], ["ultrafastidious", 85, []], ["ultraquiet", 85, []], ["ultraserious", 85, []], ["umbrageous", 85, []], ["umbrageously", 85, []], ["umbrageousness", 85, []], ["umbrageousnesses", 85, []], ["unacquainted", 85, []], ["unambiguous", 85, []], ["unambiguously", 85, []], ["unambitious", 85, []], ["unbeautiful", 85, []], ["unbeautifully", 85, []], ["unbureaucratic", 85, []], ["uncensorious", 85, []], ["unceremonious", 85, []], ["unceremoniously", 85, []], ["unceremoniousness", 85, []], ["unceremoniousnesses", 85, []], ["unciae", 85, []], ["unconscious", 60, []], ["unconsciouses", 60, []], ["unconsciously", 85, []], ["unconsciousness", 85, []], ["unconsciousnesses", 85, []], ["uncontentious", 85, []], ["uncourageous", 85, []], ["unctuous", 85, []], ["unctuously", 85, []], ["unctuousness", 85, []], ["unctuousnesses", 85, []], ["uncurious", 85, []], ["unenvious", 85, []], ["unfastidious", 85, []], ["unforeseeable", 85, []], ["unfreeing", 85, []], ["ungracious", 85, []], ["ungraciously", 85, []], ["ungraciousness", 85, []], ["ungraciousnesses", 85, []], ["unideaed", 85, []], ["unmalicious", 85, []], ["unmaliciously", 85, []], ["unmelodious", 85, []], ["unmelodiousness", 85, []], ["unmelodiousnesses", 85, []], ["unostentatious", 85, []], ["unostentatiously", 85, []], ["unpretentious", 85, []], ["unpretentiously", 85, []], ["unpretentiousness", 85, []], ["unpretentiousnesses", 85, []], ["unpropitious", 85, []], ["unquiet", 85, []], ["unquieter", 85, []], ["unquietest", 85, []], ["unquietly", 85, []], ["unquietness", 85, []], ["unquietnesses", 85, []], ["unquiets", 85, []], ["unreligious", 85, []], ["unrighteous", 85, []], ["unrighteously", 85, []], ["unrighteousness", 85, []], ["unrighteousnesses", 85, []], ["unseeing", 85, []], ["unserious", 85, []], ["unseriousness", 85, []], ["unseriousnesses", 85, []], ["unsuspicious", 85, []], ["untimeous", 85, []], ["unwooed", 85, []], ["uproarious", 85, []], ["uproariously", 85, []], ["uproariousness", 85, []], ["uproariousnesses", 85, []], ["uraei", 85, []], ["uraeus", 85, []], ["uraeuses", 85, []], ["usurious", 85, []], ["usuriously", 85, []], ["usuriousness", 85, []], ["usuriousnesses", 85, []], ["uveous", 85, []], ["uxorious", 85, []], ["uxoriously", 85, []], ["uxoriousness", 85, []], ["uxoriousnesses", 85, []], ["vacuous", 85, []], ["vacuously", 85, []], ["vacuousness", 85, []], ["vacuousnesses", 85, []], ["vagarious", 85, []], ["vagariously", 85, []], ["vainglorious", 85, []], ["vaingloriously", 85, []], ["vaingloriousness", 85, []], ["vaingloriousnesses", 85, []], ["various", 10, []], ["variously", 60, []], ["variousness", 85, []], ["variousnesses", 85, []], ["ventriloquial", 85, []], ["ventriloquially", 85, []], ["ventriloquies", 85, []], ["veracious", 85, []], ["veraciously", 85, []], ["veraciousness", 85, []], ["veraciousnesses", 85, []], ["vexatious", 85, []], ["vexatiously", 85, []], ["vexatiousness", 85, []], ["vexatiousnesses", 85, []], ["vibrioid", 85, []], ["vicarious", 85, []], ["vicariously", 85, []], ["vicariousness", 85, []], ["vicariousnesses", 85, []], ["vicious", 60, []], ["viciously", 85, []], ["viciousness", 85, []], ["viciousnesses", 85, []], ["victorious", 60, []], ["victoriously", 85, []], ["victoriousness", 85, []], ["victoriousnesses", 85, []], ["vinaceous", 85, []], ["violaceous", 85, []], ["virtuous", 60, []], ["virtuously", 85, []], ["virtuousness", 85, []], ["virtuousnesses", 85, []], ["vitreous", 85, []], ["vitreouses", 85, []], ["vivacious", 85, []], ["vivaciously", 85, []], ["vivaciousness", 85, []], ["vivaciousnesses", 85, []], ["vogueing", 60, []], ["voluptuous", 85, []], ["voluptuously", 85, []], ["voluptuousness", 85, []], ["voluptuousnesses", 85, []], ["voodooed", 60, []], ["voodooing", 60, []], ["voodooism", 85, []], ["voodooisms", 85, []], ["voodooist", 85, []], ["voodooistic", 85, []], ["voodooists", 85, []], ["voracious", 85, []], ["voraciously", 85, []], ["voraciousness", 85, []], ["voraciousnesses", 85, []], ["waterzooi", 85, []], ["waterzoois", 85, []], ["weeweeing", 85, []], ["weltanschauung", 85, []], ["weltanschauungen", 85, []], ["weltanschauungs", 85, []], ["whiteout", 85, []], ["whiteouts", 85, []], ["wideout", 85, []], ["wideouts", 85, []], ["wipeout", 85, []], ["wipeouts", 85, []], ["wooed", 60, []], ["wooer", 85, []], ["wooers", 85, []], ["wooing", 60, []], ["wooingly", 85, []], ["yahooism", 85, []], ["yahooisms", 85, []], ["zabaione", 85, []], ["zabaiones", 85, []], ["zoea", 85, []], ["zoeae", 85, []], ["zoeal", 85, []], ["zoeas", 85, []], ["zooecia", 85, []], ["zooecium", 85, []], ["zoogleae", 85, []], ["zoogloea", 85, []], ["zoogloeae", 85, []], ["zoogloeas", 85, []], ["zooid", 85, []], ["zooidal", 85, []], ["zooids", 85, []], ["zouave", 85, []], ["zouaves", 85, []]]], [{ "id": "word-silent-initial", "family": "words", "topic": "THE FIRST LETTER IS SILENT", "prompt": "Name an English word with a silent first letter in a standard pronunciation. Inflections count.", "source": "ENABLE \xD7 CMU Pronouncing Dictionary; initial consonant and first-phoneme checks. CMU BSD license in DATA-SOURCES.md.", "ranking": "familiarity-v1" }, [["gnar", 85, []], ["gnarl", 85, []], ["gnarled", 85, []], ["gnarlier", 85, []], ["gnarliest", 85, []], ["gnarling", 85, []], ["gnarls", 85, []], ["gnarly", 85, []], ["gnarr", 85, []], ["gnarred", 85, []], ["gnarring", 85, []], ["gnarrs", 85, []], ["gnars", 85, []], ["gnash", 85, []], ["gnashed", 85, []], ["gnashes", 85, []], ["gnashing", 85, []], ["gnat", 85, []], ["gnatcatcher", 85, []], ["gnatcatchers", 85, []], ["gnathal", 85, []], ["gnathic", 85, []], ["gnathion", 85, []], ["gnathions", 85, []], ["gnathite", 85, []], ["gnathites", 85, []], ["gnatlike", 85, []], ["gnats", 85, []], ["gnattier", 85, []], ["gnattiest", 85, []], ["gnatty", 85, []], ["gnaw", 85, []], ["gnawable", 85, []], ["gnawed", 85, []], ["gnawer", 85, []], ["gnawers", 85, []], ["gnawing", 85, []], ["gnawings", 85, []], ["gnawn", 85, []], ["gnaws", 85, []], ["gneiss", 85, []], ["gneisses", 85, []], ["gneissic", 85, []], ["gneissoid", 85, []], ["gneissose", 85, []], ["gnocchi", 85, []], ["gnome", 60, []], ["gnomelike", 85, []], ["gnomes", 60, []], ["gnomic", 85, []], ["gnomical", 85, []], ["gnomish", 85, []], ["gnomist", 85, []], ["gnomists", 85, []], ["gnomon", 85, []], ["gnomonic", 85, []], ["gnomons", 85, []], ["gnoses", 85, []], ["gnosis", 85, []], ["gnostic", 85, []], ["gnosticism", 85, []], ["gnosticisms", 85, []], ["gnotobiotic", 85, []], ["gnotobiotically", 85, []], ["gnu", 85, []], ["gnus", 85, []], ["heir", 60, []], ["heiress", 85, []], ["heiresses", 85, []], ["heirloom", 85, []], ["heirlooms", 85, []], ["heirs", 60, []], ["honest", 30, []], ["honestly", 30, []], ["honesty", 60, []], ["honor", 30, []], ["honorable", 60, []], ["honorably", 85, []], ["honoraria", 85, []], ["honorarium", 85, []], ["honorariums", 85, []], ["honorary", 60, []], ["honored", 30, []], ["honoree", 85, []], ["honorees", 85, []], ["honorific", 85, []], ["honoring", 30, []], ["honors", 30, []], ["honourer", 85, []], ["honourers", 85, []], ["honouring", 30, []], ["honours", 30, []], ["hour", 30, []], ["hourglass", 85, []], ["hourglasses", 85, []], ["hourly", 60, []], ["hours", 30, []], ["knack", 60, []], ["knacked", 60, []], ["knacker", 85, []], ["knackered", 85, []], ["knackeries", 85, []], ["knackers", 85, []], ["knackery", 85, []], ["knacking", 60, []], ["knacks", 60, []], ["knackwurst", 85, []], ["knackwursts", 85, []], ["knap", 85, []], ["knapped", 85, []], ["knapper", 85, []], ["knappers", 85, []], ["knapping", 85, []], ["knaps", 85, []], ["knapsack", 85, []], ["knapsacked", 85, []], ["knapsacks", 85, []], ["knapweed", 85, []], ["knapweeds", 85, []], ["knar", 85, []], ["knarred", 85, []], ["knarry", 85, []], ["knars", 85, []], ["knaur", 85, []], ["knaurs", 85, []], ["knave", 85, []], ["knaveries", 85, []], ["knavery", 85, []], ["knaves", 85, []], ["knavish", 85, []], ["knavishly", 85, []], ["knawel", 85, []], ["knawels", 85, []], ["knead", 85, []], ["kneadable", 85, []], ["kneaded", 85, []], ["kneader", 85, []], ["kneaders", 85, []], ["kneading", 85, []], ["kneads", 85, []], ["knee", 30, []], ["kneecap", 85, []], ["kneecapped", 85, []], ["kneecapping", 85, []], ["kneecappings", 85, []], ["kneecaps", 85, []], ["kneed", 30, []], ["kneehole", 85, []], ["kneeholes", 85, []], ["kneeing", 30, []], ["kneel", 60, []], ["kneeled", 60, []], ["kneeler", 85, []], ["kneelers", 85, []], ["kneeling", 60, []], ["kneels", 60, []], ["kneepad", 85, []], ["kneepads", 85, []], ["kneepan", 85, []], ["kneepans", 85, []], ["knees", 30, []], ["kneesock", 85, []], ["kneesocks", 85, []], ["knell", 85, []], ["knelled", 85, []], ["knelling", 85, []], ["knells", 85, []], ["knelt", 85, []], ["knesset", 85, []], ["knessets", 85, []], ["knew", 10, []], ["knickerbocker", 85, []], ["knickerbockers", 85, []], ["knickers", 85, []], ["knickknack", 85, []], ["knickknacks", 85, []], ["knife", 10, []], ["knifed", 10, []], ["knifelike", 85, []], ["knifepoint", 85, []], ["knifepoints", 85, []], ["knifer", 85, []], ["knifers", 85, []], ["knifes", 10, []], ["knifing", 10, []], ["knight", 30, []], ["knighted", 30, []], ["knighthood", 85, []], ["knighthoods", 85, []], ["knighting", 30, []], ["knightliness", 85, []], ["knightlinesses", 85, []], ["knightly", 85, []], ["knights", 30, []], ["knish", 85, []], ["knishes", 85, []], ["knit", 60, []], ["knits", 60, []], ["knitted", 60, []], ["knitter", 85, []], ["knitters", 85, []], ["knitting", 60, []], ["knittings", 60, []], ["knitwear", 85, []], ["knives", 60, []], ["knob", 60, []], ["knobbed", 60, []], ["knobbier", 85, []], ["knobbiest", 85, []], ["knobblier", 85, []], ["knobbliest", 85, []], ["knobbly", 85, []], ["knobby", 85, []], ["knobkerrie", 85, []], ["knobkerries", 85, []], ["knoblike", 85, []], ["knobs", 60, []], ["knock", 30, []], ["knockabout", 85, []], ["knockabouts", 85, []], ["knockdown", 85, []], ["knockdowns", 85, []], ["knocked", 30, []], ["knocker", 85, []], ["knockers", 85, []], ["knocking", 30, []], ["knockoff", 85, []], ["knockoffs", 85, []], ["knockout", 60, []], ["knockouts", 60, []], ["knocks", 30, []], ["knockwurst", 85, []], ["knockwursts", 85, []], ["knoll", 85, []], ["knolled", 85, []], ["knoller", 85, []], ["knollers", 85, []], ["knolling", 85, []], ["knolls", 85, []], ["knolly", 85, []], ["knop", 85, []], ["knopped", 85, []], ["knops", 85, []], ["knosp", 85, []], ["knosps", 85, []], ["knot", 60, []], ["knotgrass", 85, []], ["knotgrasses", 85, []], ["knothole", 85, []], ["knotholes", 85, []], ["knotless", 85, []], ["knotlike", 85, []], ["knots", 60, []], ["knotted", 60, []], ["knotter", 85, []], ["knotters", 85, []], ["knottier", 85, []], ["knottiest", 85, []], ["knottily", 85, []], ["knottiness", 85, []], ["knottinesses", 85, []], ["knotting", 60, []], ["knottings", 60, []], ["knotty", 85, []], ["knotweed", 85, []], ["knotweeds", 85, []], ["knout", 85, []], ["knouted", 85, []], ["knouting", 85, []], ["knouts", 85, []], ["know", 10, []], ["knowable", 85, []], ["knower", 85, []], ["knowers", 85, []], ["knowing", 10, []], ["knowinger", 85, []], ["knowingest", 85, []], ["knowingly", 60, []], ["knowingness", 85, []], ["knowingnesses", 85, []], ["knowings", 10, []], ["knowledge", 30, []], ["knowledgeabilities", 85, []], ["knowledgeability", 85, []], ["knowledgeable", 60, []], ["knowledgeableness", 85, []], ["knowledgeablenesses", 85, []], ["knowledgeably", 85, []], ["knowledges", 30, []], ["known", 10, []], ["knowns", 10, []], ["knows", 10, []], ["knubbier", 85, []], ["knubbiest", 85, []], ["knubby", 85, []], ["knuckle", 60, []], ["knuckleball", 85, []], ["knuckleballer", 85, []], ["knuckleballers", 85, []], ["knuckleballs", 85, []], ["knucklebone", 85, []], ["knucklebones", 85, []], ["knuckled", 60, []], ["knucklehead", 85, []], ["knuckleheaded", 85, []], ["knuckleheads", 85, []], ["knuckler", 85, []], ["knucklers", 85, []], ["knuckles", 60, []], ["knucklier", 85, []], ["knuckliest", 85, []], ["knuckling", 60, []], ["knuckly", 85, []], ["knur", 85, []], ["knurl", 85, []], ["knurled", 85, []], ["knurlier", 85, []], ["knurliest", 85, []], ["knurling", 85, []], ["knurls", 85, []], ["knurly", 85, []], ["knurs", 85, []], ["mnemonic", 85, []], ["mnemonically", 85, []], ["mnemonics", 85, []], ["pneuma", 85, []], ["pneumas", 85, []], ["pneumatic", 60, []], ["pneumatically", 85, []], ["pneumaticities", 85, []], ["pneumaticity", 85, []], ["pneumatologies", 85, []], ["pneumatology", 85, []], ["pneumatolytic", 85, []], ["pneumatophore", 85, []], ["pneumatophores", 85, []], ["pneumococcal", 85, []], ["pneumococci", 85, []], ["pneumococcus", 85, []], ["pneumoconioses", 85, []], ["pneumoconiosis", 85, []], ["pneumograph", 85, []], ["pneumographs", 85, []], ["pneumonectomies", 85, []], ["pneumonectomy", 85, []], ["pneumonia", 60, []], ["pneumonias", 60, []], ["pneumonic", 85, []], ["pneumonites", 85, []], ["pneumonitides", 85, []], ["pneumonitis", 85, []], ["pneumonitises", 85, []], ["pneumothoraces", 85, []], ["pneumothorax", 85, []], ["pneumothoraxes", 85, []], ["psalm", 60, []], ["psalmbook", 85, []], ["psalmbooks", 85, []], ["psalmed", 60, []], ["psalmic", 85, []], ["psalming", 60, []], ["psalmist", 85, []], ["psalmists", 85, []], ["psalmodies", 85, []], ["psalmody", 85, []], ["psalms", 60, []], ["psalter", 85, []], ["psalteria", 85, []], ["psalteries", 85, []], ["psalterium", 85, []], ["psalters", 85, []], ["psaltery", 85, []], ["psaltries", 85, []], ["psaltry", 85, []], ["psammite", 85, []], ["psammites", 85, []], ["psammon", 85, []], ["psammons", 85, []], ["pschent", 85, []], ["pschents", 85, []], ["psephite", 85, []], ["psephites", 85, []], ["psephological", 85, []], ["psephologies", 85, []], ["psephologist", 85, []], ["psephologists", 85, []], ["psephology", 85, []], ["pseud", 85, []], ["pseudepigraph", 85, []], ["pseudepigrapha", 85, []], ["pseudepigraphies", 85, []], ["pseudepigraphon", 85, []], ["pseudepigraphs", 85, []], ["pseudepigraphy", 85, []], ["pseudo", 60, []], ["pseudoallele", 85, []], ["pseudoalleles", 85, []], ["pseudocholinesterase", 85, []], ["pseudocholinesterases", 85, []], ["pseudoclassic", 85, []], ["pseudoclassicism", 85, []], ["pseudoclassicisms", 85, []], ["pseudoclassics", 85, []], ["pseudocoel", 85, []], ["pseudocoelomate", 85, []], ["pseudocoelomates", 85, []], ["pseudocoels", 85, []], ["pseudocyeses", 85, []], ["pseudocyesis", 85, []], ["pseudomonad", 85, []], ["pseudomonades", 85, []], ["pseudomonads", 85, []], ["pseudomonas", 85, []], ["pseudomorph", 85, []], ["pseudomorphic", 85, []], ["pseudomorphism", 85, []], ["pseudomorphisms", 85, []], ["pseudomorphous", 85, []], ["pseudomorphs", 85, []], ["pseudonym", 60, []], ["pseudonymities", 85, []], ["pseudonymity", 85, []], ["pseudonymous", 85, []], ["pseudonymously", 85, []], ["pseudonymousness", 85, []], ["pseudonymousnesses", 85, []], ["pseudonyms", 60, []], ["pseudoparenchyma", 85, []], ["pseudoparenchymas", 85, []], ["pseudoparenchymata", 85, []], ["pseudoparenchymatous", 85, []], ["pseudopod", 85, []], ["pseudopodal", 85, []], ["pseudopodia", 85, []], ["pseudopodial", 85, []], ["pseudopodium", 85, []], ["pseudopods", 85, []], ["pseudopregnancies", 85, []], ["pseudopregnancy", 85, []], ["pseudopregnant", 85, []], ["pseudorandom", 85, []], ["pseudos", 60, []], ["pseudoscience", 85, []], ["pseudosciences", 85, []], ["pseudoscientific", 85, []], ["pseudoscientist", 85, []], ["pseudoscientists", 85, []], ["pseudoscorpion", 85, []], ["pseudoscorpions", 85, []], ["pseudosophisticated", 85, []], ["pseudosophistication", 85, []], ["pseudosophistications", 85, []], ["pseudotuberculoses", 85, []], ["pseudotuberculosis", 85, []], ["pseuds", 85, []], ["pshawed", 85, []], ["pshawing", 85, []], ["pshaws", 85, []], ["psi", 60, []], ["psilocin", 85, []], ["psilocins", 85, []], ["psilocybin", 85, []], ["psilocybins", 85, []], ["psilophyte", 85, []], ["psilophytes", 85, []], ["psilophytic", 85, []], ["psiloses", 85, []], ["psilosis", 85, []], ["psilotic", 85, []], ["psis", 60, []], ["psittacine", 85, []], ["psittacines", 85, []], ["psittacoses", 85, []], ["psittacosis", 85, []], ["psittacosises", 85, []], ["psittacotic", 85, []], ["psoae", 85, []], ["psoai", 85, []], ["psoas", 85, []], ["psoatic", 85, []], ["psocid", 85, []], ["psocids", 85, []], ["psoralea", 85, []], ["psoraleas", 85, []], ["psoralen", 85, []], ["psoralens", 85, []], ["psoriases", 85, []], ["psoriasis", 85, []], ["psoriatic", 85, []], ["psoriatics", 85, []], ["psst", 85, []], ["psych", 60, []], ["psychasthenia", 85, []], ["psychasthenias", 85, []], ["psychasthenic", 85, []], ["psychasthenics", 85, []], ["psyche", 60, []], ["psyched", 60, []], ["psychedelia", 85, []], ["psychedelias", 85, []], ["psychedelic", 60, []], ["psychedelically", 85, []], ["psychedelics", 60, []], ["psyches", 60, []], ["psychiatric", 60, []], ["psychiatrically", 85, []], ["psychiatries", 60, []], ["psychiatrist", 60, []], ["psychiatrists", 60, []], ["psychiatry", 60, []], ["psychic", 60, []], ["psychical", 85, []], ["psychically", 85, []], ["psychics", 60, []], ["psyching", 60, []], ["psycho", 60, []], ["psychoacoustic", 85, []], ["psychoacoustics", 85, []], ["psychoactive", 85, []], ["psychoanalyses", 85, []], ["psychoanalysis", 85, []], ["psychoanalyst", 85, []], ["psychoanalysts", 85, []], ["psychoanalytic", 85, []], ["psychoanalytical", 85, []], ["psychoanalytically", 85, []], ["psychoanalyze", 85, []], ["psychoanalyzed", 85, []], ["psychoanalyzes", 85, []], ["psychoanalyzing", 85, []], ["psychobabble", 85, []], ["psychobabbler", 85, []], ["psychobabblers", 85, []], ["psychobabbles", 85, []], ["psychobiographer", 85, []], ["psychobiographers", 85, []], ["psychobiographical", 85, []], ["psychobiographies", 85, []], ["psychobiography", 85, []], ["psychobiologic", 85, []], ["psychobiological", 85, []], ["psychobiologies", 85, []], ["psychobiologist", 85, []], ["psychobiologists", 85, []], ["psychobiology", 85, []], ["psychochemical", 85, []], ["psychochemicals", 85, []], ["psychodrama", 85, []], ["psychodramas", 85, []], ["psychodramatic", 85, []], ["psychodynamic", 85, []], ["psychodynamically", 85, []], ["psychodynamics", 85, []], ["psychogeneses", 85, []], ["psychogenesis", 85, []], ["psychogenetic", 85, []], ["psychogenic", 85, []], ["psychogenically", 85, []], ["psychograph", 85, []], ["psychographs", 85, []], ["psychohistorian", 85, []], ["psychohistorians", 85, []], ["psychohistorical", 85, []], ["psychohistories", 85, []], ["psychohistory", 85, []], ["psychokineses", 85, []], ["psychokinesis", 85, []], ["psychokinetic", 85, []], ["psycholinguist", 85, []], ["psycholinguistic", 85, []], ["psycholinguistics", 85, []], ["psycholinguists", 85, []], ["psychologic", 85, []], ["psychological", 30, []], ["psychologically", 60, []], ["psychologies", 30, []], ["psychologise", 85, []], ["psychologised", 85, []], ["psychologises", 85, []], ["psychologising", 85, []], ["psychologism", 85, []], ["psychologisms", 85, []], ["psychologist", 60, []], ["psychologists", 60, []], ["psychologize", 85, []], ["psychologized", 85, []], ["psychologizes", 85, []], ["psychologizing", 85, []], ["psychology", 30, []], ["psychometric", 85, []], ["psychometrically", 85, []], ["psychometrician", 85, []], ["psychometricians", 85, []], ["psychometrics", 85, []], ["psychometries", 85, []], ["psychometry", 85, []], ["psychomotor", 85, []], ["psychoneuroses", 85, []], ["psychoneurosis", 85, []], ["psychoneurotic", 85, []], ["psychoneurotics", 85, []], ["psychopath", 60, []], ["psychopathic", 85, []], ["psychopathically", 85, []], ["psychopathics", 85, []], ["psychopathies", 85, []], ["psychopathologic", 85, []], ["psychopathological", 85, []], ["psychopathologically", 85, []], ["psychopathologies", 85, []], ["psychopathologist", 85, []], ["psychopathologists", 85, []], ["psychopathology", 85, []], ["psychopaths", 60, []], ["psychopathy", 85, []], ["psychopharmacologic", 85, []], ["psychopharmacological", 85, []], ["psychopharmacologies", 85, []], ["psychopharmacologist", 85, []], ["psychopharmacologists", 85, []], ["psychopharmacology", 85, []], ["psychophysical", 85, []], ["psychophysically", 85, []], ["psychophysicist", 85, []], ["psychophysicists", 85, []], ["psychophysics", 85, []], ["psychophysiologic", 85, []], ["psychophysiological", 85, []], ["psychophysiologically", 85, []], ["psychophysiologies", 85, []], ["psychophysiologist", 85, []], ["psychophysiologists", 85, []], ["psychophysiology", 85, []], ["psychos", 60, []], ["psychoses", 60, []], ["psychosexual", 85, []], ["psychosexualities", 85, []], ["psychosexuality", 85, []], ["psychosexually", 85, []], ["psychosis", 60, []], ["psychosocial", 85, []], ["psychosocially", 85, []], ["psychosomatic", 85, []], ["psychosomatically", 85, []], ["psychosomatics", 85, []], ["psychosurgeon", 85, []], ["psychosurgeons", 85, []], ["psychosurgeries", 85, []], ["psychosurgery", 85, []], ["psychosurgical", 85, []], ["psychosyntheses", 85, []], ["psychosynthesis", 85, []], ["psychotherapeutic", 85, []], ["psychotherapeutically", 85, []], ["psychotherapies", 60, []], ["psychotherapist", 85, []], ["psychotherapists", 85, []], ["psychotherapy", 60, []], ["psychotic", 60, []], ["psychotically", 85, []], ["psychotics", 60, []], ["psychotomimetic", 85, []], ["psychotomimetically", 85, []], ["psychotomimetics", 85, []], ["psychotropic", 85, []], ["psychotropics", 85, []], ["psychrometer", 85, []], ["psychrometers", 85, []], ["psychrometric", 85, []], ["psychrometries", 85, []], ["psychrometry", 85, []], ["psychrophilic", 85, []], ["psychs", 60, []], ["psylla", 85, []], ["psyllas", 85, []], ["psyllid", 85, []], ["psyllids", 85, []], ["psyllium", 85, []], ["psylliums", 85, []], ["psywar", 85, []], ["psywars", 85, []], ["ptarmigan", 100, []], ["ptarmigans", 100, []], ["pteranodon", 85, []], ["pteranodons", 85, []], ["pteridine", 85, []], ["pteridines", 85, []], ["pteridological", 85, []], ["pteridologies", 85, []], ["pteridologist", 85, []], ["pteridologists", 85, []], ["pteridology", 85, []], ["pteridophyte", 85, []], ["pteridophytes", 85, []], ["pteridosperm", 85, []], ["pteridosperms", 85, []], ["pterin", 85, []], ["pterins", 85, []], ["pterodactyl", 85, []], ["pterodactyls", 85, []], ["pteropod", 85, []], ["pteropods", 85, []], ["pterosaur", 85, []], ["pterosaurs", 85, []], ["pterygia", 85, []], ["pterygium", 85, []], ["pterygiums", 85, []], ["pterygoid", 85, []], ["pterygoids", 85, []], ["pteryla", 85, []], ["pterylae", 85, []], ["ptisan", 85, []], ["ptisans", 85, []], ["ptomain", 85, []], ["ptomaine", 85, []], ["ptomaines", 85, []], ["ptomains", 85, []], ["ptoses", 85, []], ["ptosis", 85, []], ["ptotic", 85, []], ["ptyalin", 85, []], ["ptyalins", 85, []], ["ptyalism", 85, []], ["ptyalisms", 85, []], ["wrack", 85, []], ["wracked", 85, []], ["wrackful", 85, []], ["wracking", 85, []], ["wracks", 85, []], ["wraith", 85, []], ["wraithlike", 85, []], ["wraiths", 85, []], ["wrang", 85, []], ["wrangle", 85, []], ["wrangled", 85, []], ["wrangler", 85, []], ["wranglers", 85, []], ["wrangles", 85, []], ["wrangling", 85, []], ["wrangs", 85, []], ["wrap", 30, []], ["wraparound", 85, []], ["wraparounds", 85, []], ["wrapped", 30, []], ["wrapper", 60, []], ["wrappers", 60, []], ["wrapping", 30, []], ["wrappings", 30, []], ["wraps", 30, []], ["wrapt", 85, []], ["wrasse", 85, []], ["wrasses", 85, []], ["wrassle", 85, []], ["wrassled", 85, []], ["wrassles", 85, []], ["wrassling", 85, []], ["wrastle", 85, []], ["wrastled", 85, []], ["wrastles", 85, []], ["wrastling", 85, []], ["wrath", 60, []], ["wrathed", 60, []], ["wrathful", 85, []], ["wrathfully", 85, []], ["wrathfulness", 85, []], ["wrathfulnesses", 85, []], ["wrathier", 85, []], ["wrathiest", 85, []], ["wrathily", 85, []], ["wrathing", 60, []], ["wraths", 60, []], ["wrathy", 85, []], ["wreak", 85, []], ["wreaked", 85, []], ["wreaker", 85, []], ["wreakers", 85, []], ["wreaking", 85, []], ["wreaks", 85, []], ["wreath", 60, []], ["wreathe", 85, []], ["wreathed", 60, []], ["wreathen", 85, []], ["wreathes", 60, []], ["wreathing", 60, []], ["wreaths", 60, []], ["wreathy", 85, []], ["wreck", 60, []], ["wreckage", 60, []], ["wreckages", 60, []], ["wrecked", 60, []], ["wrecker", 85, []], ["wreckers", 85, []], ["wreckful", 85, []], ["wrecking", 60, []], ["wreckings", 60, []], ["wrecks", 60, []], ["wren", 60, []], ["wrench", 60, []], ["wrenched", 60, []], ["wrenches", 60, []], ["wrenching", 60, []], ["wrenchingly", 85, []], ["wrens", 60, []], ["wrest", 85, []], ["wrested", 85, []], ["wrester", 85, []], ["wresters", 85, []], ["wresting", 85, []], ["wrestle", 60, []], ["wrestled", 60, []], ["wrestler", 60, []], ["wrestlers", 60, []], ["wrestles", 60, []], ["wrestling", 30, []], ["wrestlings", 30, []], ["wrests", 85, []], ["wretch", 85, []], ["wretched", 60, []], ["wretcheder", 85, []], ["wretchedest", 85, []], ["wretchedly", 85, []], ["wretchedness", 85, []], ["wretchednesses", 85, []], ["wretches", 85, []], ["wrick", 85, []], ["wricked", 85, []], ["wricking", 85, []], ["wricks", 85, []], ["wried", 85, []], ["wrier", 85, []], ["wries", 85, []], ["wriest", 85, []], ["wriggle", 85, []], ["wriggled", 85, []], ["wriggler", 85, []], ["wrigglers", 85, []], ["wriggles", 85, []], ["wrigglier", 85, []], ["wriggliest", 85, []], ["wriggling", 85, []], ["wriggly", 85, []], ["wright", 30, []], ["wrights", 30, []], ["wring", 85, []], ["wringed", 85, []], ["wringer", 85, []], ["wringers", 85, []], ["wringing", 85, []], ["wrings", 85, []], ["wrinkle", 60, []], ["wrinkled", 60, []], ["wrinkles", 60, []], ["wrinklier", 85, []], ["wrinkliest", 85, []], ["wrinkling", 60, []], ["wrinkly", 85, []], ["wrist", 30, []], ["wristband", 85, []], ["wristbands", 85, []], ["wristier", 85, []], ["wristiest", 85, []], ["wristlet", 85, []], ["wristlets", 85, []], ["wristlock", 85, []], ["wristlocks", 85, []], ["wrists", 30, []], ["wristwatch", 85, []], ["wristwatches", 85, []], ["wristy", 85, []], ["writ", 60, []], ["writable", 85, []], ["write", 10, []], ["writer", 30, []], ["writerly", 85, []], ["writers", 30, []], ["writes", 10, []], ["writhe", 85, []], ["writhed", 85, []], ["writhen", 85, []], ["writher", 85, []], ["writhers", 85, []], ["writhes", 85, []], ["writhing", 85, []], ["writing", 10, []], ["writings", 10, []], ["writs", 10, []], ["written", 10, []], ["wrong", 10, []], ["wrongdoer", 85, []], ["wrongdoers", 85, []], ["wrongdoing", 60, []], ["wrongdoings", 60, []], ["wronged", 10, []], ["wronger", 85, []], ["wrongers", 85, []], ["wrongest", 85, []], ["wrongful", 60, []], ["wrongfully", 85, []], ["wrongfulness", 85, []], ["wrongfulnesses", 85, []], ["wrongheaded", 85, []], ["wrongheadedly", 85, []], ["wrongheadedness", 85, []], ["wrongheadednesses", 85, []], ["wronging", 10, []], ["wrongly", 60, []], ["wrongness", 85, []], ["wrongnesses", 85, []], ["wrongs", 10, []], ["wrote", 10, []], ["wroth", 85, []], ["wrothful", 85, []], ["wrought", 60, []], ["wrung", 85, []], ["wry", 85, []], ["wryer", 85, []], ["wryest", 85, []], ["wrying", 85, []], ["wryly", 85, []], ["wryneck", 85, []], ["wrynecks", 85, []], ["wryness", 85, []], ["wrynesses", 85, []]]], [{ "id": "dinosaur-genera", "family": "nature", "topic": "BEFORE THE BIRDS", "prompt": "Name a non-avian dinosaur genus. Flying reptiles, marine reptiles, and modern birds do not count.", "source": "Paleobiology Database API, accepted extinct regular genera under Dinosauria, excluding Aves. Snapshot 2026-10-21; CC BY 4.0.", "ranking": "familiarity-v1" }, [["Nyasasaurus", 85, []], ["Daemonosaurus", 85, []], ["Ahvaytum", 85, []], ["Agnosphitys", 85, []], ["Guaibasaurus", 85, []], ["Huayracursor", 85, []], ["Anchisaurus", 85, []], ["Musankwa", 85, []], ["Riojasaurus", 85, []], ["Eucnemesaurus", 85, []], ["Coloradisaurus", 85, []], ["Sarahsaurus", 85, []], ["Glacialisaurus", 85, []], ["Pradhania", 85, []], ["Lufengosaurus", 85, []], ["Ngwevu", 85, []], ["Ignavusaurus", 85, []], ["Adeopapposaurus", 85, []], ["Massospondylus", 85, []], ["Leyesaurus", 85, []], ["Tuebingosaurus", 85, []], ["Xiangyunloong", 85, []], ["Wudingloong", 85, []], ["Gongxianosaurus", 85, []], ["Microsaurops", 85, []], ["Eosauropoda", 85, []], ["Lamplughsaura", 85, []], ["Archaeodontosaurus", 85, []], ["Oshanosaurus", 85, []], ["Chinshakiangosaurus", 85, []], ["Sanpasaurus", 85, []], ["Microdontosaurus", 85, []], ["Oplosaurus", 85, []], ["Vulcanodon", 85, []], ["Dachongosaurus", 85, []], ["Tapinosaurus", 85, []], ["Damalasaurus", 85, []], ["Ohmdenosaurus", 85, []], ["Isanosaurus", 85, []], ["Pulanesaura", 85, []], ["Kotasaurus", 85, []], ["Ingentia", 85, []], ["Lessemsaurus", 85, []], ["Antetonitrus", 85, []], ["Barapasaurus", 85, []], ["Spinophorosaurus", 85, []], ["Cetiosaurus", 85, []], ["Volkheimeria", 85, []], ["Amygdalodon", 85, []], ["Tazoudasaurus", 85, []], ["Ferganasaurus", 85, []], ["Anhuilong", 85, []], ["Omeisaurus", 85, []], ["Klamelisaurus", 85, []], ["Zigongosaurus", 85, []], ["Abrosaurus", 85, []], ["Xinjiangtitan", 85, []], ["Daanosaurus", 85, []], ["Mamenchisaurus", 85, []], ["Chuanjiesaurus", 85, []], ["Qijianglong", 85, []], ["Volgatitan", 85, []], ["Rhomaleopakhus", 85, []], ["Hudiesaurus", 85, []], ["Uragasaurus", 85, []], ["Tonganosaurus", 85, []], ["Jingiella", 85, []], ["Wamweracaudia", 85, []], ["Tienshanosaurus", 85, []], ["Yuanmousaurus", 85, []], ["Huangshanlong", 85, []], ["Analong", 85, []], ["Bellusaurus", 85, []], ["Eomamenchisaurus", 85, []], ["Tongnanlong", 85, []], ["Perijasaurus", 85, []], ["Huashanosaurus", 85, []], ["Protognathosaurus", 85, []], ["Chebsaurus", 85, []], ["Patagosaurus", 85, []], ["Haplocanthosaurus", 85, []], ["Amphicoelias", 85, []], ["Comahuesaurus", 85, []], ["Cienciargentina", 85, []], ["Nopcsaspondylus", 85, []], ["Itapeuasaurus", 85, []], ["Rebbachisaurus", 85, []], ["Nigersaurus", 85, []], ["Demandasaurus", 85, []], ["Tataouinea", 85, []], ["Limaysaurus", 85, []], ["Cathartesaura", 85, []], ["Campananeyen", 85, []], ["Astigmasaura", 85, []], ["Lavocatisaurus", 85, []], ["Rayososaurus", 85, []], ["Agustinia", 85, []], ["Sidersaura", 85, []], ["Katepensaurus", 85, []], ["Histriasaurus", 85, []], ["Xenoposeidon", 85, []], ["Zapalasaurus", 85, []], ["Amazonsaurus", 85, []], ["Maraapunisaurus", 85, []], ["Apatosaurus", 85, []], ["Brontosaurus", 30, []], ["Barosaurus", 85, []], ["Supersaurus", 85, []], ["Ardetosaurus", 85, []], ["Tornieria", 85, []], ["Galeamopus", 85, []], ["Leinkupal", 85, []], ["Diplodocus", 30, []], ["Dinheirosaurus", 85, []], ["Cetiosauriscus", 85, []], ["Lingwulong", 85, []], ["Amargasaurus", 85, []], ["Dicraeosaurus", 85, []], ["Bajadasaurus", 85, []], ["Brachytrachelopan", 85, []], ["Kaatedocus", 85, []], ["Athenar", 85, []], ["Smitanosaurus", 85, []], ["Suuwassea", 85, []], ["Pilmatueia", 85, []], ["Amargatitanis", 85, []], ["Dyslocosaurus", 85, []], ["Dashanpusaurus", 85, []], ["Galveosaurus", 85, []], ["Atlasaurus", 85, []], ["Bicharracosaurus", 85, []], ["Ceratocaudia", 85, []], ["Yuzhoulong", 85, []], ["Aragosaurus", 85, []], ["Tehuelchesaurus", 85, []], ["Europasaurus", 85, []], ["Lourinhasaurus", 85, []], ["Camarasaurus", 85, []], ["Fusuisaurus", 85, []], ["Fushanosaurus", 85, []], ["Ornithopsis", 85, []], ["Fukuititan", 85, []], ["Brontomerus", 85, []], ["Europatitan", 85, []], ["Dasosaurus", 85, []], ["Gannansaurus", 85, []], ["Jiangshanosaurus", 85, []], ["Jiangxititan", 85, []], ["Sibirotitan", 85, []], ["Dongbeititan", 85, []], ["Mansourasaurus", 85, []], ["Sarmientosaurus", 85, []], ["Savannasaurus", 85, []], ["Diamantinasaurus", 85, []], ["Wintonotitan", 85, []], ["Tastavinsaurus", 85, []], ["Phuwiangosaurus", 85, []], ["Huabeisaurus", 85, []], ["Xianshanosaurus", 85, []], ["Yongjinglong", 85, []], ["Qiaowanlong", 85, []], ["Silutitan", 85, []], ["Daxiatitan", 85, []], ["Ruixinia", 85, []], ["Euhelopus", 85, []], ["Erketu", 85, []], ["Nagatitan", 85, []], ["Tangvayosaurus", 85, []], ["Tambatitanis", 85, []], ["Ruyangosaurus", 85, []], ["Gobititan", 85, []], ["Dzharatitanis", 85, []], ["Triunfosaurus", 85, []], ["Huanghetitan", 85, []], ["Austrosaurus", 85, []], ["Padillasaurus", 85, []], ["Australodocus", 85, []], ["Liubangosaurus", 85, []], ["Astrophocaudia", 85, []], ["Yunmenglong", 85, []], ["Garumbatitan", 85, []], ["Sauroposeidon", 85, []], ["Ligabuesaurus", 85, []], ["Sonidosaurus", 85, []], ["Chubutisaurus", 85, []], ["Ninjatitan", 85, []], ["Baotianmansaurus", 85, []], ["Choconsaurus", 85, []], ["Borealosaurus", 85, []], ["Barrosasaurus", 85, []], ["Baalsaurus", 85, []], ["Narambuenatitan", 85, []], ["Karongasaurus", 85, []], ["Mnyamawamtuka", 85, []], ["Gandititan", 85, []], ["Yeneen", 85, []], ["Andesaurus", 85, []], ["Khanazeem", 85, []], ["Sulaimanisaurus", 85, []], ["Imrankhanhero", 85, []], ["Pakisaurus", 85, []], ["Khetranisaurus", 85, []], ["Saraikimasoom", 85, []], ["Ikqaumishan", 85, []], ["Gspsaurus", 85, []], ["Malarguesaurus", 85, []], ["Laplatasaurus", 85, []], ["Nullotitan", 85, []], ["Elaltitan", 85, []], ["Vahiny", 85, []], ["Jainosaurus", 85, []], ["Arackar", 85, []], ["Pellegrinisaurus", 85, []], ["Atacamatitan", 85, []], ["Bustingorrytitan", 85, []], ["Kaijutitan", 85, []], ["Uriash", 85, []], ["Malawisaurus", 85, []], ["Titanomachya", 85, []], ["Igai", 85, []], ["Abditosaurus", 85, []], ["Bonatitan", 85, []], ["Rocasaurus", 85, []], ["Neuquensaurus", 85, []], ["Saltasaurus", 85, []], ["Yamanasaurus", 85, []], ["Ibirania", 85, []], ["Alamosaurus", 85, []], ["Opisthocoelicaudia", 85, []], ["Qingxiusaurus", 85, []], ["Zhuchengtitan", 85, []], ["Nicksaurus", 85, []], ["Qunkasaura", 85, []], ["Rapetosaurus", 85, []], ["Udelartitan", 85, []], ["Tapuiasaurus", 85, []], ["Isisaurus", 85, []], ["Antarctosaurus", 85, []], ["Panamericansaurus", 85, []], ["Mesetasaurus", 85, []], ["Caieiria", 85, []], ["Baurutitan", 85, []], ["Aeolosaurus", 85, []], ["Gondwanatitan", 85, []], ["Paralititan", 85, []], ["Quaesitosaurus", 85, []], ["Nemegtosaurus", 85, []], ["Shingopana", 85, []], ["Epachthosaurus", 85, []], ["Marisaurus", 85, []], ["Balochisaurus", 85, []], ["Qaikshaheen", 85, []], ["Petrobrasaurus", 85, []], ["Chucarosaurus", 85, []], ["Tengrisaurus", 85, []], ["Arrudatitan", 85, []], ["Muyelensaurus", 85, []], ["Chadititan", 85, []], ["Bravasaurus", 85, []], ["Rukwatitan", 85, []], ["Overosaurus", 85, []], ["Rinconsaurus", 85, []], ["Pitekunsaurus", 85, []], ["Maxakalisaurus", 85, []], ["Uberabatitan", 85, []], ["Adamantisaurus", 85, []], ["Punatitan", 85, []], ["Brasilotitan", 85, []], ["Traukutitan", 85, []], ["Quetecsaurus", 85, []], ["Phosphatotitan", 85, []], ["Mendozasaurus", 85, []], ["Austroposeidon", 85, []], ["Drusilasaura", 85, []], ["Futalognkosaurus", 85, []], ["Puertasaurus", 85, []], ["Notocolossus", 85, []], ["Petrustitan", 85, []], ["Normanniasaurus", 85, []], ["Dreadnoughtus", 85, []], ["Ampelosaurus", 85, []], ["Lirainosaurus", 85, []], ["Garrigatitan", 85, []], ["Atsinganosaurus", 85, []], ["Menucocelsior", 85, []], ["Argentinosaurus", 85, []], ["Paludititan", 85, []], ["Magyarosaurus", 85, []], ["Bonitasaura", 85, []], ["Lohuecotitan", 85, []], ["Inawentu", 85, []], ["Patagotitan", 85, []], ["Hamititan", 85, []], ["Aegyptosaurus", 85, []], ["Abdarainurus", 85, []], ["Argyrosaurus", 85, []], ["Mongolosaurus", 85, []], ["Tiamat", 85, []], ["Dongyangosaurus", 85, []], ["Angolatitan", 85, []], ["Duriatitan", 85, []], ["Oceanotitan", 85, []], ["Liaoningotitan", 85, []], ["Pelorosaurus", 85, []], ["Vouivria", 85, []], ["Abydosaurus", 85, []], ["Soriatitan", 85, []], ["Cedarosaurus", 85, []], ["Galvesaurus", 85, []], ["Lusotitan", 85, []], ["Sonorasaurus", 85, []], ["Venenosaurus", 85, []], ["Brachiosaurus", 10, []], ["Giraffatitan", 85, []], ["Nebulasaurus", 85, []], ["Janenschia", 85, []], ["Jobaria", 85, []], ["Shunosaurus", 85, []], ["Bagualia", 85, []], ["Rhoetosaurus", 85, []], ["Cardiodon", 85, []], ["Lapparentosaurus", 85, []], ["Datousaurus", 85, []], ["Jinchuanloong", 85, []], ["Haestasaurus", 85, []], ["Dystrophaeus", 85, []], ["Tendaguria", 85, []], ["Losillasaurus", 85, []], ["Amanzia", 85, []], ["Moabosaurus", 85, []], ["Mierasaurus", 85, []], ["Zby", 85, []], ["Narindasaurus", 85, []], ["Turiasaurus", 85, []], ["Melanorosaurus", 85, []], ["Mussaurus", 85, []], ["Irisosaurus", 85, []], ["Jingshanosaurus", 85, []], ["Camelotia", 85, []], ["Aardonyx", 85, []], ["Lishulong", 85, []], ["Sefapanosaurus", 85, []], ["Seitaad", 85, []], ["Leonerasaurus", 85, []], ["Schleitheimia", 85, []], ["Yunnanosaurus", 85, []], ["Xingxiulong", 85, []], ["Blikanasaurus", 85, []], ["Yizhousaurus", 85, []], ["Ledumahadi", 85, []], ["Meroktenos", 85, []], ["Ammosaurus", 85, []], ["Gyposaurus", 85, []], ["Actiosaurus", 85, []], ["Yimenosaurus", 85, []], ["Bagualosaurus", 85, []], ["Saturnalia", 85, []], ["Panphagia", 85, []], ["Pampadromaeus", 85, []], ["Chromogisaurus", 85, []], ["Arcusaurus", 85, []], ["Kholumolumo", 85, []], ["Plateosaurus", 85, []], ["Unaysaurus", 85, []], ["Ruehleia", 85, []], ["Coloradia", 85, []], ["Xixiposaurus", 85, []], ["Issi", 85, []], ["Plateosauravus", 85, []], ["Pantydraco", 85, []], ["Efraasia", 85, []], ["Nambalia", 85, []], ["Buriolestes", 85, []], ["Macrocollum", 85, []], ["Jaklapallisaurus", 85, []], ["Thecodontosaurus", 85, []], ["Asylosaurus", 85, []], ["Qianlong", 85, []], ["Mbiresaurus", 85, []], ["Eoraptor", 85, []], ["Eodromaeus", 85, []], ["Sanjuansaurus", 85, []], ["Herrerasaurus", 85, []], ["Gnathovorax", 85, []], ["Staurikosaurus", 85, []], ["Tawa", 85, []], ["Nhandumirim", 85, []], ["Avalonianus", 85, []], ["Saltopus", 85, []], ["Alwalkeria", 85, []], ["Chindesaurus", 85, []], ["Ptychotherates", 85, []], ["Agilisaurus", 85, []], ["Hexinlusaurus", 85, []], ["Nanosaurus", 85, []], ["Kulindapteryx", 85, []], ["Stormbergia", 85, []], ["Minimocursor", 85, []], ["Prenocephale", 85, []], ["Homalocephale", 85, []], ["Stegoceras", 85, []], ["Pachycephalosaurus", 60, []], ["Wannanosaurus", 85, []], ["Goyocephale", 85, []], ["Zavacephale", 85, []], ["Alaskacephale", 85, []], ["Hanssuesia", 85, []], ["Foraminacephale", 85, []], ["Sphaerotholus", 85, []], ["Acrotholus", 85, []], ["Brontotholus", 85, []], ["Platytholus", 85, []], ["Amtocephale", 85, []], ["Tylocephale", 85, []], ["Colepiocephale", 85, []], ["Sinocephale", 85, []], ["Ajkaceratops", 85, []], ["Xuanhuasaurus", 85, []], ["Eucentrosaurus", 85, []], ["Medusaceratops", 85, []], ["Albertaceratops", 85, []], ["Lokiceratops", 85, []], ["Kosmoceratops", 85, []], ["Terminocavus", 85, []], ["Torosaurus", 85, []], ["Titanoceratops", 85, []], ["Eotriceratops", 85, []], ["Triceratops", 10, []], ["Regaliceratops", 85, []], ["Navajoceratops", 85, []], ["Agujaceratops", 85, []], ["Coahuilaceratops", 85, []], ["Arrhinoceratops", 85, []], ["Spiclypeus", 85, []], ["Chasmosaurus", 85, []], ["Judiceratops", 85, []], ["Bisticeratops", 85, []], ["Pentaceratops", 85, []], ["Utahceratops", 85, []], ["Bravoceratops", 85, []], ["Vagaceratops", 85, []], ["Anchiceratops", 85, []], ["Sierraceratops", 85, []], ["Pachyrhinosaurus", 85, []], ["Einiosaurus", 85, []], ["Achelousaurus", 85, []], ["Wendiceratops", 85, []], ["Diabloceratops", 85, []], ["Nasutoceratops", 85, []], ["Crittendenceratops", 85, []], ["Furcatoceratops", 85, []], ["Avaceratops", 85, []], ["Yehuecauhceratops", 85, []], ["Monoclonius", 85, []], ["Stellasaurus", 85, []], ["Menefeeceratops", 85, []], ["Spinops", 85, []], ["Rubeosaurus", 85, []], ["Coronosaurus", 85, []], ["Centrosaurus", 85, []], ["Styracosaurus", 85, []], ["Machairoceratops", 85, []], ["Sinoceratops", 85, []], ["Xenoceratops", 85, []], ["Ferenceratops", 85, []], ["Notoceratops", 85, []], ["Chaoyangsaurus", 85, []], ["Yinlong", 85, []], ["Stenopelix", 85, []], ["Xuanhuaceratops", 85, []], ["Hualianceratops", 85, []], ["Psittacosaurus", 85, []], ["Serendipaceratops", 85, []], ["Auroraceratops", 85, []], ["Bagaceratops", 85, []], ["Protoceratops", 85, []], ["Breviceratops", 85, []], ["Turanoceratops", 85, []], ["Zuniceratops", 85, []], ["Sasayamagnomus", 85, []], ["Graciliceratops", 85, []], ["Yamaceratops", 85, []], ["Mosaiceratops", 85, []], ["Asiaceratops", 85, []], ["Cerasinops", 85, []], ["Helioceratops", 85, []], ["Ferrisaurus", 85, []], ["Prenoceratops", 85, []], ["Zhuchengceratops", 85, []], ["Udanoceratops", 85, []], ["Leptoceratops", 85, []], ["Ischioceratops", 85, []], ["Montanoceratops", 85, []], ["Gryphoceratops", 85, []], ["Unescoceratops", 85, []], ["Gremlin", 85, []], ["Koreaceratops", 85, []], ["Archaeoceratops", 85, []], ["Beg", 60, []], ["Aquilops", 85, []], ["Liaoceratops", 85, []], ["Micropachycephalosaurus", 85, []], ["Albalophosaurus", 85, []], ["Burianosaurus", 85, []], ["Proyandusaurus", 85, []], ["Gideonmantellia", 85, []], ["Daurosaurus", 85, []], ["Vectidromeus", 85, []], ["Hypsilophodon", 85, []], ["Ponerosteus", 85, []], ["Craspedodon", 85, []], ["Lurdusaurus", 85, []], ["Callovosaurus", 85, []], ["Iyuku", 85, []], ["Owenodon", 85, []], ["Oblitosaurus", 85, []], ["Bayannurosaurus", 85, []], ["Hypselospinus", 85, []], ["Ouranosaurus", 85, []], ["Bolong", 85, []], ["Proiguanodon", 85, []], ["Barilium", 85, []], ["Lophorhothon", 85, []], ["Altirhinus", 85, []], ["Iguanacolossus", 85, []], ["Proa", 85, []], ["Brighstoneus", 85, []], ["Siamodon", 85, []], ["Comptonatus", 85, []], ["Portellsaurus", 85, []], ["Batyrosaurus", 85, []], ["Nanningosaurus", 85, []], ["Koshisaurus", 85, []], ["Ratchasimasaurus", 85, []], ["Cariocecus", 85, []], ["Zuoyunlong", 85, []], ["Eolambia", 85, []], ["Fylax", 85, []], ["Gilmoreosaurus", 85, []], ["Huehuecanauhtlus", 85, []], ["Xuwulong", 85, []], ["Gobihadros", 85, []], ["Yamatosaurus", 85, []], ["Nectosaurus", 85, []], ["Anasazisaurus", 85, []], ["Saurolophus", 85, []], ["Prosaurolophus", 85, []], ["Bonapartesaurus", 85, []], ["Augustynolophus", 85, []], ["Edmontosaurus", 85, []], ["Kerberosaurus", 85, []], ["Shantungosaurus", 85, []], ["Ugrunaaluk", 85, []], ["Mandschurosaurus", 85, []], ["Secernosaurus", 85, []], ["Naashoibitosaurus", 85, []], ["Kelumapusaura", 85, []], ["Gryposaurus", 85, []], ["Coahuilasaurus", 85, []], ["Kritosaurus", 85, []], ["Huallasaurus", 85, []], ["Ornatops", 85, []], ["Wulagasaurus", 85, []], ["Maiasaura", 85, []], ["Brachylophosaurus", 85, []], ["Probrachylophosaurus", 85, []], ["Hadrosaurus", 85, []], ["Acristavus", 85, []], ["Kamuysaurus", 85, []], ["Malefica", 85, []], ["Eotrachodon", 85, []], ["Aquilarhinus", 85, []], ["Rhinorex", 85, []], ["Gongshuilong", 85, []], ["Barsboldia", 85, []], ["Ahshislesaurus", 85, []], ["Laiyangosaurus", 85, []], ["Angulomastacator", 85, []], ["Amurosaurus", 85, []], ["Lambeosaurus", 85, []], ["Velafrons", 85, []], ["Corythosaurus", 85, []], ["Hypacrosaurus", 85, []], ["Kazaklambia", 85, []], ["Aralosaurus", 85, []], ["Magnapaulia", 85, []], ["Latirhinus", 85, []], ["Olorotitan", 85, []], ["Adelolophus", 85, []], ["Nipponosaurus", 85, []], ["Parasaurolophus", 30, []], ["Tlatolophus", 85, []], ["Charonosaurus", 85, []], ["Plesiolophus", 85, []], ["Jaxartosaurus", 85, []], ["Tsintaosaurus", 85, []], ["Adynomosaurus", 85, []], ["Arenysaurus", 85, []], ["Taleta", 85, []], ["Ajnabia", 85, []], ["Blasisaurus", 85, []], ["Pararhabdodon", 85, []], ["Minqaria", 85, []], ["Canardia", 85, []], ["Koutalisaurus", 85, []], ["Lapampasaurus", 85, []], ["Bactrosaurus", 85, []], ["Gonkoken", 85, []], ["Sirindhorna", 85, []], ["Haolong", 85, []], ["Datonglong", 85, []], ["Zhanghenglong", 85, []], ["Nanyangosaurus", 85, []], ["Morelladon", 85, []], ["Claosaurus", 85, []], ["Gongpoquansaurus", 85, []], ["Plesiohadros", 85, []], ["Tanius", 85, []], ["Kryptohadros", 85, []], ["Telmatosaurus", 85, []], ["Tethyshadros", 85, []], ["Levnesovia", 85, []], ["Jintasaurus", 85, []], ["Penelopognathus", 85, []], ["Protohadros", 85, []], ["Probactrosaurus", 85, []], ["Yunganglong", 85, []], ["Equijubus", 85, []], ["Cedrorestes", 85, []], ["Fukuisaurus", 85, []], ["Qianjiangsaurus", 85, []], ["Jeyawati", 85, []], ["Shuangmiaosaurus", 85, []], ["Theiophytalia", 85, []], ["Paulodon", 85, []], ["Hippodraco", 85, []], ["Istiorachis", 85, []], ["Riabininohadros", 85, []], ["Dakotadon", 85, []], ["Lanzhousaurus", 85, []], ["Cumnoria", 85, []], ["Calvarius", 85, []], ["Delapparentia", 85, []], ["Magnamanus", 85, []], ["Napaisaurus", 85, []], ["Camptosaurus", 85, []], ["Iguanodon", 30, []], ["Valdosaurus", 85, []], ["Dryosaurus", 85, []], ["Eousdryosaurus", 85, []], ["Elrhazosaurus", 85, []], ["Dysalotosaurus", 85, []], ["Hesperonyx", 85, []], ["Draconyx", 85, []], ["Weewarrasaurus", 85, []], ["Anabisetia", 85, []], ["Macrogryphosaurus", 85, []], ["Talenkauen", 85, []], ["Isasicursor", 85, []], ["Gasparinisaura", 85, []], ["Notohypsilophodon", 85, []], ["Galleonosaurus", 85, []], ["Tietasaura", 85, []], ["Qantassaurus", 85, []], ["Atlascopcosaurus", 85, []], ["Muttaburrasaurus", 85, []], ["Morrosaurus", 85, []], ["Kangnasaurus", 85, []], ["Sektensaurus", 85, []], ["Diluvicursor", 85, []], ["Chakisaurus", 85, []], ["Fostoria", 85, []], ["Leaellynasaura", 85, []], ["Mahuidacursor", 85, []], ["Trinisaura", 85, []], ["Osmakasaurus", 85, []], ["Foskeia", 85, []], ["Emiliasaura", 85, []], ["Ampelognathus", 85, []], ["Pareisactus", 85, []], ["Matheronodon", 85, []], ["Rhabdodon", 85, []], ["Mochlodon", 85, []], ["Zalmoxes", 85, []], ["Obelignathus", 85, []], ["Transylvanosaurus", 85, []], ["Iani", 85, []], ["Tenontosaurus", 85, []], ["Convolosaurus", 85, []], ["Planicoxa", 85, []], ["Choyrodon", 85, []], ["Mantellisaurus", 85, []], ["Kulindadromeus", 85, []], ["Jeholosaurus", 85, []], ["Doolysaurus", 85, []], ["Parksosaurus", 85, []], ["Changmiania", 85, []], ["Thescelosaurus", 85, []], ["Fona", 85, []], ["Oryctodromeus", 85, []], ["Zephyrosaurus", 85, []], ["Albertadromeus", 85, []], ["Yueosaurus", 85, []], ["Orodromeus", 85, []], ["Koreanosaurus", 85, []], ["Nevadadromeus", 85, []], ["Haya", 85, []], ["Yandusaurus", 85, []], ["Enigmacursor", 85, []], ["Sanxiasaurus", 85, []], ["Pulaosaurus", 85, []], ["Archaeocursor", 85, []], ["Sangonghesaurus", 85, []], ["Asilisaurus", 85, []], ["Soumyasaurus", 85, []], ["Amanasaurus", 85, []], ["Lewisuchus", 85, []], ["Sacisaurus", 85, []], ["Kwanasaurus", 85, []], ["Eucoelophysis", 85, []], ["Technosaurus", 85, []], ["Silesaurus", 85, []], ["Diodorus", 85, []], ["Lutungutali", 85, []], ["Gamatavus", 85, []], ["Eocursor", 85, []], ["Laquintasaura", 85, []], ["Scutellosaurus", 85, []], ["Lesothosaurus", 85, []], ["Yuxisaurus", 85, []], ["Euskelesaurus", 85, []], ["Adratiklit", 85, []], ["Alcovasaurus", 85, []], ["Kentrosaurus", 85, []], ["Thyreosaurus", 85, []], ["Dacentrurus", 85, []], ["Yanbeilong", 85, []], ["Hesperosaurus", 85, []], ["Loricatosaurus", 85, []], ["Wuerhosaurus", 85, []], ["Stegosaurus", 10, ["Stego"]], ["Jiangjunosaurus", 85, []], ["Priodontosaurus", 85, []], ["Mongolostegus", 85, []], ["Changdusaurus", 85, []], ["Yingshanosaurus", 85, []], ["Chungkingosaurus", 85, []], ["Tuojiangosaurus", 85, []], ["Paranthodon", 85, []], ["Sauraechmodon", 85, []], ["Gigantspinosaurus", 85, []], ["Huayangosaurus", 85, []], ["Isaberrysaura", 85, []], ["Bashanosaurus", 85, []], ["Baiyinosaurus", 85, []], ["Spicomellus", 85, []], ["Stegouros", 85, []], ["Antarctopelta", 85, []], ["Kunbarrasaurus", 85, []], ["Dracopelta", 85, []], ["Chuanqilong", 85, []], ["Ahshislepelta", 85, []], ["Crichtonpelta", 85, []], ["Minotaurasaurus", 85, []], ["Oohkotokia", 85, []], ["Dyoplosaurus", 85, []], ["Euoplocephalus", 85, []], ["Scolosaurus", 85, []], ["Anodontosaurus", 85, []], ["Platypelta", 85, []], ["Tarchia", 85, []], ["Ziapelta", 85, []], ["Akainacephalus", 85, []], ["Pinacosaurus", 85, []], ["Zaraapelta", 85, []], ["Talarurus", 85, []], ["Ankylosaurus", 30, []], ["Zuul", 85, []], ["Saichania", 85, []], ["Tsagantegia", 85, []], ["Nodocephalosaurus", 85, []], ["Jinyunpelta", 85, []], ["Eopinacosaurus", 85, []], ["Aletopelta", 85, []], ["Gobisaurus", 85, []], ["Huaxiazhoulong", 85, []], ["Shamosaurus", 85, []], ["Cedarpelta", 85, []], ["Liaoningosaurus", 85, []], ["Datai", 85, []], ["Bissektipelta", 85, []], ["Invictarx", 85, []], ["Europelta", 85, []], ["Borealopelta", 85, []], ["Peloroplites", 85, []], ["Silvisaurus", 85, []], ["Nodosaurus", 85, []], ["Stegopelta", 85, []], ["Glyptodontopelta", 85, []], ["Hungarosaurus", 85, []], ["Texasetes", 85, []], ["Acantholipan", 85, []], ["Animantarx", 85, []], ["Anoplosaurus", 85, []], ["Sauropelta", 85, []], ["Nipponopelta", 85, []], ["Panoplosaurus", 85, []], ["Gargoyleosaurus", 85, []], ["Dongyangopelta", 85, []], ["Tatankacephalus", 85, []], ["Propanoplosaurus", 85, []], ["Hoplitosaurus", 85, []], ["Hoplosaurus", 85, []], ["Hylosaurus", 85, []], ["Struthiosaurus", 85, []], ["Sauroplites", 85, []], ["Patagopelta", 85, []], ["Pawpawsaurus", 85, []], ["Edmontonia", 85, []], ["Niobrarasaurus", 85, []], ["Gastonia", 85, []], ["Polacanthus", 85, []], ["Taohelong", 85, []], ["Hylaeosaurus", 85, []], ["Mymoorapelta", 85, []], ["Sarcolestes", 85, []], ["Vectipelta", 85, []], ["Sinankylosaurus", 85, []], ["Jakapil", 85, []], ["Emausaurus", 85, []], ["Scelidosaurus", 85, []], ["Fruitadens", 85, []], ["Abrictosaurus", 85, []], ["Lycorhinus", 85, []], ["Heterodontosaurus", 85, []], ["Manidens", 85, []], ["Pegomastax", 85, []], ["Tianyulong", 85, []], ["Echinodon", 85, []], ["Pisanosaurus", 85, []], ["Chilesaurus", 85, []], ["Gongbusaurus", 85, []], ["Eugongbusaurus", 85, []], ["Xiaosaurus", 85, []], ["Krzyzanowskisaurus", 85, []], ["Ferganocephale", 85, []], ["Himeoolithus", 85, []], ["Anteavis", 85, []], ["Erythrovenator", 85, []], ["Yaverlandia", 85, []], ["Sinosaurus", 85, []], ["Velocipes", 85, []], ["Zupaysaurus", 85, []], ["Notatesseraeraptor", 85, []], ["Liliensternus", 85, []], ["Dilophosaurus", 85, []], ["Sarcosaurus", 85, []], ["Dracoraptor", 85, []], ["Lophostropheus", 85, []], ["Syntarsus", 85, []], ["Gojirasaurus", 85, []], ["Pendraig", 85, []], ["Panguraptor", 85, []], ["Camposaurus", 85, []], ["Segisaurus", 85, []], ["Lepidus", 85, []], ["Coelophysis", 85, []], ["Powellvenator", 85, []], ["Procompsognathus", 85, []], ["Lucianovenator", 85, []], ["Megapnosaurus", 85, []], ["Dracovenator", 85, []], ["Zuolong", 85, []], ["Aratasaurus", 85, []], ["Coelurus", 85, []], ["Santanaraptor", 85, []], ["Tanycolagreus", 85, []], ["Aniksosaurus", 85, []], ["Compsognathus", 60, []], ["Xunmenglong", 85, []], ["Huaxiagnathus", 85, []], ["Aristosuchus", 85, []], ["Ornitholestes", 85, []], ["Scipionyx", 85, []], ["Sinocalliopteryx", 85, []], ["Saurornithoides", 85, []], ["Invictibellatrix", 85, []], ["Aoniraptor", 85, []], ["Vayuraptor", 85, []], ["Siats", 85, []], ["Phuwiangvenator", 85, []], ["Australovenator", 85, []], ["Megaraptor", 85, []], ["Joaquinraptor", 85, []], ["Maip", 85, []], ["Orkoraptor", 85, []], ["Murusraptor", 85, []], ["Tratayenia", 85, []], ["Aerosteon", 85, []], ["Bicentenaria", 85, []], ["Xinjiangovenator", 85, []], ["Falcarius", 85, []], ["Erlikosaurus", 85, []], ["Fukuivenator", 85, []], ["Kayrasaurus", 85, []], ["Beipiaosaurus", 85, []], ["Alxasaurus", 85, []], ["Martharaptor", 85, []], ["Therizinosaurus", 60, []], ["Suzhousaurus", 85, []], ["Eshanosaurus", 85, []], ["Tiantaisaurus", 85, []], ["Paralitherizinosaurus", 85, []], ["Segnosaurus", 85, []], ["Duonychus", 85, []], ["Nanshiungosaurus", 85, []], ["Enigmosaurus", 85, []], ["Nothronychus", 85, []], ["Neimongosaurus", 85, []], ["Erliansaurus", 85, []], ["Jianchangosaurus", 85, []], ["Lingyuanosaurus", 85, []], ["Shishugounykus", 85, []], ["Aorun", 85, []], ["Haplocheirus", 85, []], ["Nemegtonykus", 85, []], ["Tugulusaurus", 85, []], ["Qiupanykus", 85, []], ["Bonapartenykus", 85, []], ["Patagonykus", 85, []], ["Elopteryx", 85, []], ["Alvarezsaurus", 85, []], ["Albertonykus", 85, []], ["Parvicursor", 85, []], ["Dzharaonyx", 85, []], ["Albinykus", 85, []], ["Khulsanurus", 85, []], ["Jaculinykus", 85, []], ["Linhenykus", 85, []], ["Mononykus", 85, []], ["Shuvuuia", 85, []], ["Ceratonykus", 85, []], ["Ondogurvel", 85, []], ["Shuuvuia", 85, []], ["Xixianykus", 85, []], ["Achillesaurus", 85, []], ["Alnashetri", 85, []], ["Trierarchuncus", 85, []], ["Xiyunykus", 85, []], ["Bannykus", 85, []], ["Khankhuuluu", 85, []], ["Gualicho", 85, []], ["Calamosaurus", 85, []], ["Teihivenator", 85, []], ["Raptorex", 85, []], ["Timurlengia", 85, []], ["Alectrosaurus", 85, []], ["Timimus", 85, []], ["Moros", 85, []], ["Proceratosaurus", 85, []], ["Guanlong", 85, []], ["Kileskus", 85, []], ["Yutyrannus", 85, []], ["Sinotyrannus", 85, []], ["Juratyrant", 85, []], ["Jinbeisaurus", 85, []], ["Xiongguanlong", 85, []], ["Appalachiosaurus", 85, []], ["Stokesosaurus", 85, []], ["Eotyrannus", 85, []], ["Dryptosaurus", 85, []], ["Nanotyrannus", 85, []], ["Dilong", 85, []], ["Suskityrannus", 85, []], ["Yezosaurus", 85, []], ["Daspletosaurus", 85, []], ["Thanatotheristes", 85, []], ["Lythronax", 85, []], ["Alioramus", 85, []], ["Qianzhousaurus", 85, []], ["Tarbosaurus", 85, []], ["Tyrannosaurus", 10, ["T rex", "Tyrannosaurus rex"]], ["Zhuchengtyrannus", 85, []], ["Bistahieversor", 85, []], ["Labocania", 85, []], ["Teratophoneus", 85, []], ["Dynamoterror", 85, []], ["Asiatyrannus", 85, []], ["Nanuqsaurus", 85, []], ["Gorgosaurus", 85, []], ["Albertosaurus", 85, []], ["Bagaraatan", 85, []], ["Ngexisaurus", 85, []], ["Lourinhanosaurus", 85, []], ["Mirischia", 85, []], ["Nedcolbertia", 85, []], ["Huadanosaurus", 85, []], ["Sinosauropteryx", 85, []], ["Juravenator", 85, []], ["Kol", 85, []], ["Migmanychion", 85, []], ["Fujianvenator", 85, []], ["Baminornis", 85, []], ["Zhengheornis", 85, []], ["Fukuipteryx", 85, []], ["Wellnhoferia", 85, []], ["Alcmonavis", 85, []], ["Gretcheniao", 85, []], ["Gobipteryx", 85, []], ["Eocathayornis", 85, []], ["Feitianius", 85, []], ["Flexomornis", 85, []], ["Orienantius", 85, []], ["Catenoleimus", 85, []], ["Gurilynia", 85, []], ["Sazavis", 85, []], ["Explorornis", 85, []], ["Lenesornis", 85, []], ["Kizylkumavis", 85, []], ["Incolornis", 85, []], ["Nanantius", 85, []], ["Alexornis", 85, []], ["Zhyraornis", 85, []], ["Abavornis", 85, []], ["Linyiornis", 85, []], ["Yatenavis", 85, []], ["Navaornis", 85, []], ["Otogornis", 85, []], ["Longirostravis", 85, []], ["Boluochia", 85, []], ["Longipteryx", 85, []], ["Rapaxavis", 85, []], ["Camptodontornis", 85, []], ["Shanweiniao", 85, []], ["Shengjingornis", 85, []], ["Chromeornis", 85, []], ["Gobipipus", 85, []], ["Musivavis", 85, []], ["Castignovolucris", 85, []], ["Shangyang", 85, []], ["Imparavis", 85, []], ["Martinavis", 85, []], ["Elbretornis", 85, []], ["Grabauornis", 85, []], ["Enantiornis", 85, []], ["Dalingheornis", 85, []], ["Cratoavis", 85, []], ["Eoalulavis", 85, []], ["Intiornis", 85, []], ["Soroavisaurus", 85, []], ["Neuquenornis", 85, []], ["Bauxitornis", 85, []], ["Enantiophoenix", 85, []], ["Mirarce", 85, []], ["Halimornis", 85, []], ["Gettyia", 85, []], ["Avisaurus", 85, []], ["Huoshanornis", 85, []], ["Dunhuangia", 85, []], ["Xiangornis", 85, []], ["Falcatakely", 85, []], ["Vescornis", 85, []], ["Parvavis", 85, []], ["Paraprotopteryx", 85, []], ["Mirusavis", 85, []], ["Eoenantiornis", 85, []], ["Concornis", 85, []], ["Yuornis", 85, []], ["Yuanchuavis", 85, []], ["Chiappeavis", 85, []], ["Pengornis", 85, []], ["Parapengornis", 85, []], ["Eopengornis", 85, []], ["Holbotia", 85, []], ["Monoenantiornis", 85, []], ["Fortunguavis", 85, []], ["Elsornis", 85, []], ["Fortipesavis", 85, []], ["Evgenavis", 85, []], ["Junornis", 85, []], ["Avimaia", 85, []], ["Piscivorenantiornis", 85, []], ["Microenantiornis", 85, []], ["Pterygornis", 85, []], ["Iberomesornis", 85, []], ["Brevirostruavis", 85, []], ["Houornis", 85, []], ["Protopteryx", 85, []], ["Gracilornis", 85, []], ["Longchengornis", 85, []], ["Alethoalaornis", 85, []], ["Cuspirostrisornis", 85, []], ["Largirostrornis", 85, []], ["Lectavis", 85, []], ["Sulcavis", 85, []], ["Neobohaiornis", 85, []], ["Parabohaiornis", 85, []], ["Bohaiornis", 85, []], ["Shenqiornis", 85, []], ["Zhouornis", 85, []], ["Longusunguis", 85, []], ["Yuanjiawaornis", 85, []], ["Cathayornis", 85, []], ["Cruralispennia", 85, []], ["Sinornis", 85, []], ["Qiliania", 85, []], ["Dapingfangornis", 85, []], ["Noguerornis", 85, []], ["Yungavolucris", 85, []], ["Elektorornis", 85, []], ["Alamitornis", 85, []], ["Kaririavis", 85, []], ["Bellulia", 85, []], ["Archaeorhynchus", 85, []], ["Vorona", 85, []], ["Chaoyangia", 85, []], ["Ambiortus", 85, []], ["Liaoningornis", 85, []], ["Antarcticavis", 85, []], ["Zhongjianornis", 85, []], ["Yixianornis", 85, []], ["Longicrusavis", 85, []], ["Songlingornis", 85, []], ["Parahongshanornis", 85, []], ["Hongshanornis", 85, []], ["Archaeornithura", 85, []], ["Tianyuornis", 85, []], ["Mengciusornis", 85, []], ["Apsaravis", 85, []], ["Changmaornis", 85, []], ["Hollanda", 85, []], ["Yumenornis", 85, []], ["Dingavis", 85, []], ["Patagopteryx", 85, []], ["Kookne", 85, []], ["Gargantuavis", 85, []], ["Tingmiatornis", 85, []], ["Pasquiaornis", 85, []], ["Brodavis", 85, []], ["Hesperornis", 85, []], ["Parahesperornis", 85, []], ["Canadaga", 85, []], ["Asiahesperornis", 85, []], ["Fumicollis", 85, []], ["Baptornis", 85, []], ["Judinornis", 85, []], ["Chupkaornis", 85, []], ["Enaliornis", 85, []], ["Potamornis", 85, []], ["Guildavis", 85, []], ["Cerebavis", 85, []], ["Iaceornis", 85, []], ["Limenavis", 85, []], ["Xorazmortyx", 85, []], ["Palintropus", 85, []], ["Ameripodius", 85, []], ["Quercymegapodius", 85, []], ["Archaealectrornis", 85, []], ["Nanortyx", 85, []], ["Miortyx", 85, []], ["Waltonortyx", 85, []], ["Percolinus", 85, []], ["Miophasianus", 85, []], ["Pirortyx", 85, []], ["Coturnipes", 85, []], ["Miogallus", 85, []], ["Palaeophasianus", 85, []], ["Diangallus", 85, []], ["Archaeophasianus", 85, []], ["Palaeortyx", 85, []], ["Palaeocryptonyx", 85, []], ["Litoripes", 85, []], ["Pliogallus", 85, []], ["Schaubortyx", 85, []], ["Plioperdix", 85, []], ["Sobniogallus", 85, []], ["Namaortyx", 85, []], ["Scopelortyx", 85, []], ["Paraortygoides", 85, []], ["Eortyx", 85, []], ["Gallinuloides", 85, []], ["Parapavo", 85, []], ["Amitabha", 85, []], ["Boreortalis", 85, []], ["Palaeonossax", 85, []], ["Aburria", 85, []], ["Mwalau", 85, []], ["Garrdimalga", 85, []], ["Latagallina", 85, []], ["Ngawupodius", 85, []], ["Progura", 85, []], ["Palaealectoris", 85, []], ["Procrax", 85, []], ["Bumbanortyx", 85, []], ["Paraortyx", 85, []], ["Bumbanipodius", 85, []], ["Argillipes", 85, []], ["Telecrex", 85, []], ["Gigantibis", 85, []], ["Taoperdix", 85, []], ["Eupterornis", 85, []], ["Crateropteryx", 85, []], ["Yanornis", 85, []], ["Abitusavis", 85, []], ["Similiyanornis", 85, []], ["Ichthyornis", 85, []], ["Janavis", 85, []], ["Archaeovolans", 85, []], ["Kuszholia", 85, []], ["Qinornis", 85, []], ["Apatornis", 85, []], ["Jiuquanornis", 85, []], ["Schizooura", 85, []], ["Juehuaornis", 85, []], ["Piscivoravis", 85, []], ["Jianchangornis", 85, []], ["Eogranivora", 85, []], ["Xinghaiornis", 85, []], ["Kunpengornis", 85, []], ["Neimengornis", 85, []], ["Kompsornis", 85, []], ["Aurornis", 85, []], ["Archaeopteryx", 85, []], ["Dalianraptor", 85, []], ["Ostromia", 85, []], ["Scansoriopteryx", 85, []], ["Ambopteryx", 85, []], ["Epidendrosaurus", 85, []], ["Yi", 60, []], ["Yuanyanglong", 85, []], ["Nankangia", 85, []], ["Jiangxisaurus", 85, []], ["Heyuannia", 85, []], ["Nemegtomaia", 85, []], ["Banji", 85, []], ["Khaan", 85, []], ["Oksoko", 85, []], ["Machairasaurus", 85, []], ["Shixinggia", 85, []], ["Ganzhousaurus", 85, []], ["Ingenia", 85, []], ["Conchoraptor", 85, []], ["Luoyanggia", 85, []], ["Oviraptor", 85, []], ["Yulong", 85, []], ["Citipati", 85, []], ["Tongtianlong", 85, []], ["Wulatelong", 85, []], ["Corythoraptor", 85, []], ["Rinchenia", 85, []], ["Huanansaurus", 85, []], ["Nemegtia", 85, []], ["Gobiraptor", 85, []], ["Similicaudipteryx", 85, []], ["Xingtianosaurus", 85, []], ["Anomalipes", 85, []], ["Gigantoraptor", 85, []], ["Chirostenotes", 85, []], ["Leptorhynchos", 85, []], ["Eoneophron", 85, []], ["Caenagnathus", 85, []], ["Elmisaurus", 85, []], ["Apatoraptor", 85, []], ["Caenagnathasia", 85, []], ["Anzu", 85, []], ["Hagryphus", 85, []], ["Citipes", 85, []], ["Epichirostenotes", 85, []], ["Beibeilong", 85, []], ["Microvenator", 85, []], ["Avimimus", 85, []], ["Incisivosaurus", 85, []], ["Caudipteryx", 85, []], ["Protarchaeopteryx", 85, []], ["Ningyuansaurus", 85, []], ["Epidexipteryx", 85, []], ["Overoraptor", 85, []], ["Pneumatoraptor", 85, []], ["Pamparaptor", 85, []], ["Tianyuraptor", 85, []], ["Zhenyuanlong", 85, []], ["Wulong", 85, []], ["Daurlong", 85, []], ["Richardoestesia", 85, []], ["Balaur", 85, []], ["Buitreraptor", 85, []], ["Austroraptor", 85, []], ["Unenlagia", 85, []], ["Diuqin", 85, []], ["Ypupiara", 85, []], ["Neuquenraptor", 85, []], ["Rahonavis", 85, []], ["Imperobator", 85, []], ["Vectiraptor", 85, []], ["Achillobator", 85, []], ["Dromaeosaurus", 85, []], ["Dakotaraptor", 85, []], ["Boreonykus", 85, []], ["Itemirus", 85, []], ["Yurgovuchia", 85, []], ["Zapsalis", 85, []], ["Adasaurus", 85, []], ["Atrociraptor", 85, []], ["Saurornitholestes", 85, []], ["Utahraptor", 85, []], ["Dineobellator", 85, []], ["Velociraptor", 10, []], ["Linheraptor", 85, []], ["Shri", 60, []], ["Tsaagan", 85, []], ["Acheroraptor", 85, []], ["Deinonychus", 85, []], ["Pyroraptor", 85, []], ["Dromaeosauroides", 85, []], ["Bambiraptor", 85, []], ["Changyuraptor", 85, []], ["Hesperonychus", 85, []], ["Jian", 85, []], ["Shanag", 85, []], ["Sinornithosaurus", 85, []], ["Zhongjianosaurus", 85, []], ["Microraptor", 85, []], ["Graciliraptor", 85, []], ["Nuthetes", 85, []], ["Hulsanpes", 85, []], ["Halszkaraptor", 85, []], ["Natovenator", 85, []], ["Mahakala", 85, []], ["Luanchuanraptor", 85, []], ["Kuru", 85, []], ["Variraptor", 85, []], ["Daliansaurus", 85, []], ["Harenadraco", 85, []], ["Hesperornithoides", 85, []], ["Geminiraptor", 85, []], ["Sinovenator", 85, []], ["Mei", 60, []], ["Xiaotingia", 85, []], ["Jianianhualong", 85, []], ["Pectinodon", 85, []], ["Tochisaurus", 85, []], ["Anchiornis", 85, []], ["Xixiasaurus", 85, []], ["Gobivenator", 85, []], ["Sinornithoides", 85, []], ["Troodon", 85, []], ["Talos", 85, []], ["Borogovia", 85, []], ["Zanabazar", 85, []], ["Byronosaurus", 85, []], ["Urbacodon", 85, []], ["Linhevenator", 85, []], ["Hypnovenator", 85, []], ["Xenovenator", 85, []], ["Stenonychosaurus", 85, []], ["Latenivenatrix", 85, []], ["Albertavenator", 85, []], ["Sinusonasus", 85, []], ["Liaoningvenator", 85, []], ["Philovenator", 85, []], ["Jinfengopteryx", 85, []], ["Tamarro", 85, []], ["Almas", 85, []], ["Papiliovenator", 85, []], ["Archaeornithoides", 85, []], ["Zhongornis", 85, []], ["Eosinopteryx", 85, []], ["Paronychodon", 85, []], ["Caihong", 85, []], ["Pedopenna", 85, []], ["Serikornis", 85, []], ["Changzhousaurus", 85, []], ["Yixianosaurus", 85, []], ["Chuandongocoelurus", 85, []], ["Kayentavenator", 85, []], ["Asfaltovenator", 85, []], ["Monolophosaurus", 85, []], ["Chilantaisaurus", 85, []], ["Neovenator", 85, []], ["Fukuiraptor", 85, []], ["Allosaurus", 30, []], ["Eocarcharia", 85, []], ["Concavenator", 85, []], ["Tyrannotitan", 85, []], ["Meraxes", 85, []], ["Unquillosaurus", 85, []], ["Giganotosaurus", 85, []], ["Tameryraptor", 85, []], ["Shaochilong", 85, []], ["Kelmayisaurus", 85, []], ["Mapusaurus", 85, []], ["Acrocanthosaurus", 85, []], ["Taurovenator", 85, []], ["Lajasvenator", 85, []], ["Veterupristisaurus", 85, []], ["Carcharodontosaurus", 85, []], ["Yuanmouraptor", 85, []], ["Erectopus", 85, []], ["Alpkarakush", 85, []], ["Yangchuanosaurus", 85, []], ["Sinraptor", 85, []], ["Metriacanthosaurus", 85, []], ["Siamotyrannus", 85, []], ["Shidaisaurus", 85, []], ["Ulughbegsaurus", 85, []], ["Lusovenator", 85, []], ["Datanglong", 85, []], ["Siamraptor", 85, []], ["Saurophaganax", 85, []], ["Vectaerovenator", 85, []], ["Yunyangosaurus", 85, []], ["Gasosaurus", 85, []], ["Pandoravenator", 85, []], ["Cryolophosaurus", 85, []], ["Streptospondylus", 85, []], ["Sciurumimus", 85, []], ["Baryonyx", 85, []], ["Vallibonavenatrix", 85, []], ["Riparovenator", 85, []], ["Suchomimus", 85, []], ["Ceratosuchops", 85, []], ["Riojavenatrix", 85, []], ["Protathlitis", 85, []], ["Oxalaia", 85, []], ["Angaturama", 85, []], ["Camarillasaurus", 85, []], ["Irritator", 100, []], ["Ichthyovenator", 85, []], ["Sigilmassasaurus", 85, []], ["Spinosaurus", 30, []], ["Iberospinus", 85, []], ["Afrovenator", 85, []], ["Eustreptospondylus", 85, []], ["Magnosaurus", 85, []], ["Dubreuillosaurus", 85, []], ["Piveteausaurus", 85, []], ["Leshansaurus", 85, []], ["Duriavenator", 85, []], ["Torvosaurus", 85, []], ["Wiehenvenator", 85, []], ["Megalosaurus", 85, []], ["Piatnitzkysaurus", 85, []], ["Marshosaurus", 85, []], ["Condorraptor", 85, []], ["Xuanhanosaurus", 85, []], ["Becklespinax", 85, []], ["Bahariasaurus", 85, []], ["Shanyangosaurus", 85, []], ["Cruxicheiros", 85, []], ["Kaijiangosaurus", 85, []], ["Chenanisaurus", 85, []], ["Spinostropheus", 85, []], ["Berberosaurus", 85, []], ["Fosterovenator", 85, []], ["Ceratosaurus", 85, []], ["Tralkasaurus", 85, []], ["Kryptops", 85, []], ["Indosuchus", 85, []], ["Xenotarsosaurus", 85, []], ["Eoabelisaurus", 85, []], ["Lametasaurus", 85, []], ["Rugops", 85, []], ["Vitosaura", 85, []], ["Spectrovenator", 85, []], ["Arcovenator", 85, []], ["Majungasaurus", 85, []], ["Genusaurus", 85, []], ["Rajasaurus", 85, []], ["Indosaurus", 85, []], ["Skorpiovenator", 85, []], ["Elemgasem", 85, []], ["Viavenator", 85, []], ["Llukalkan", 85, []], ["Koleken", 85, []], ["Abelisaurus", 85, []], ["Niebla", 85, []], ["Quilmesaurus", 85, []], ["Caletodraco", 85, []], ["Carnotaurus", 60, []], ["Pycnonemosaurus", 85, []], ["Guemesia", 85, []], ["Dahalokely", 85, []], ["Ilokelesia", 85, []], ["Ekrixinatosaurus", 85, []], ["Rahiolisaurus", 85, []], ["Aucasaurus", 85, []], ["Thanos", 85, []], ["Tarascosaurus", 85, []], ["Laevisuchus", 85, []], ["Kiyacursor", 85, []], ["Huinculsaurus", 85, []], ["Masiakasaurus", 85, []], ["Velocisaurus", 85, []], ["Noasaurus", 85, []], ["Vespersaurus", 85, []], ["Elaphrosaurus", 85, []], ["Limusaurus", 85, []], ["Deltadromeus", 85, []], ["Ligabueino", 85, []], ["Berthasaura", 85, []], ["Austrocheirus", 85, []], ["Genyodectes", 85, []], ["Saltriovenator", 85, []], ["Vitakridrinda", 85, []], ["Vitakrisaurus", 85, []], ["Kank", 85, []], ["Ovoraptor", 85, []], ["Fenestrosaurus", 85, []], ["Sauropus", 85, []], ["Aviatyrannis", 85, []], ["Shenzhousaurus", 85, []], ["Hexing", 85, []], ["Lepidocheirosaurus", 85, []], ["Kinnareemimus", 85, []], ["Garudimimus", 85, []], ["Tyrannomimus", 85, []], ["Deinocheirus", 85, []], ["Harpymimus", 85, []], ["Paraxenisaurus", 85, []], ["Nqwebasaurus", 85, []], ["Pelecanimimus", 85, []], ["Arkansaurus", 85, []], ["Rativates", 85, []], ["Sinornithomimus", 85, []], ["Ornithomimus", 85, []], ["Gallimimus", 85, []], ["Struthiomimus", 85, []], ["Tototlmimus", 85, []], ["Archaeornithomimus", 85, []], ["Anserimimus", 85, []], ["Dzharacursor", 85, []], ["Qiupalong", 85, []], ["Ornithomimidorum", 85, []], ["Mexidracon", 85, []], ["Aepyornithomimus", 85, []], ["Dromiceiomimus", 85, []], ["Beishanlong", 85, []], ["Afromimus", 85, []], ["Shuangbaisaurus", 85, []], ["Protoavis", 85, []], ["Altispinax", 85, []], ["Ancistrodon", 85, []]]], [{ "id": "north-american-birds", "family": "nature", "topic": "FEATHERED VISITORS", "prompt": "Name a bird species recorded in North America. Vagrants, introduced birds, and extinct species count; use a species name, not just \u201Ceagle.\u201D", "source": "Corpora birds_north_america, derived from ABA checklist; CC0. Historical checklist names retained.", "ranking": "familiarity-v1" }, [["Black-bellied Whistling-Duck", 85, []], ["Fulvous Whistling-Duck", 85, []], ["Taiga Bean-Goose", 85, []], ["Tundra Bean-Goose", 85, []], ["Pink-footed Goose", 60, []], ["Greater White-fronted Goose", 85, []], ["Lesser White-fronted Goose", 85, []], ["Graylag Goose", 85, []], ["Emperor Goose", 60, []], ["Snow Goose", 60, []], ["Ross's Goose", 85, []], ["Brant", 85, []], ["Barnacle Goose", 85, []], ["Cackling Goose", 85, []], ["Canada Goose", 10, []], ["Mute Swan", 60, []], ["Trumpeter Swan", 85, []], ["Tundra Swan", 85, []], ["Whooper Swan", 85, []], ["Egyptian Goose", 60, []], ["Muscovy Duck", 85, []], ["Wood Duck", 30, []], ["Gadwall", 85, []], ["Falcated Duck", 85, []], ["Eurasian Wigeon", 85, []], ["American Wigeon", 85, []], ["American Black Duck", 30, []], ["Mallard", 10, []], ["Mottled Duck", 85, []], ["Eastern Spot-billed Duck", 60, []], ["Blue-winged Teal", 85, []], ["Cinnamon Teal", 60, []], ["Northern Shoveler", 85, []], ["White-cheeked Pintail", 85, []], ["Northern Pintail", 85, []], ["Garganey", 85, []], ["Baikal Teal", 85, []], ["Green-winged Teal", 85, []], ["Canvasback", 85, []], ["Redhead", 60, []], ["Common Pochard", 85, []], ["Ring-necked Duck", 85, []], ["Tufted Duck", 85, []], ["Greater Scaup", 85, []], ["Lesser Scaup", 85, []], ["Steller's Eider", 85, []], ["Spectacled Eider", 85, []], ["King Eider", 85, []], ["Common Eider", 85, []], ["Harlequin Duck", 85, []], ["Labrador Duck", 60, []], ["Surf Scoter", 85, []], ["White-winged Scoter", 85, []], ["Common Scoter", 85, []], ["Black Scoter", 85, []], ["Long-tailed Duck", 60, []], ["Bufflehead", 85, []], ["Common Goldeneye", 85, []], ["Barrow's Goldeneye", 85, []], ["Smew", 85, []], ["Hooded Merganser", 85, []], ["Common Merganser", 85, []], ["Red-breasted Merganser", 85, []], ["Masked Duck", 60, []], ["Ruddy Duck", 85, []], ["Plain Chachalaca", 85, []], ["Mountain Quail", 60, []], ["Scaled Quail", 85, []], ["California Quail", 60, []], ["Gambel's Quail", 85, []], ["Northern Bobwhite", 85, []], ["Montezuma Quail", 85, []], ["Chukar", 85, []], ["Himalayan Snowcock", 85, []], ["Gray Partridge", 60, []], ["Ring-necked Pheasant", 85, []], ["Ruffed Grouse", 85, []], ["Greater Sage-Grouse", 85, []], ["Gunnison Sage-Grouse", 85, []], ["Spruce Grouse", 85, []], ["Willow Ptarmigan", 85, []], ["Rock Ptarmigan", 85, []], ["White-tailed Ptarmigan", 85, []], ["Dusky Grouse", 85, []], ["Sooty Grouse", 85, []], ["Sharp-tailed Grouse", 85, []], ["Greater Prairie-Chicken", 60, []], ["Lesser Prairie-Chicken", 60, []], ["Wild Turkey", 10, []], ["Red-throated Loon", 85, []], ["Arctic Loon", 85, []], ["Pacific Loon", 85, []], ["Common Loon", 85, []], ["Yellow-billed Loon", 85, []], ["Least Grebe", 85, []], ["Pied-billed Grebe", 85, []], ["Horned Grebe", 85, []], ["Red-necked Grebe", 85, []], ["Eared Grebe", 85, []], ["Western Grebe", 85, []], ["Clark's Grebe", 85, []], ["American Flamingo", 85, []], ["Yellow-nosed Albatross", 85, []], ["White-capped Albatross", 85, []], ["Salvin\u2019s Albatross", 85, []], ["Black-browed Albatross", 85, []], ["Light-mantled Albatross", 85, []], ["Wandering Albatross", 85, []], ["Laysan Albatross", 85, []], ["Black-footed Albatross", 85, []], ["Short-tailed Albatross", 85, []], ["Northern Fulmar", 85, []], ["Great-winged Petrel", 85, []], ["Providence Petrel", 85, []], ["Trindade Petrel", 85, []], ["Murphy's Petrel", 85, []], ["Mottled Petrel", 85, []], ["Bermuda Petrel", 85, []], ["Black-capped Petrel", 85, []], ["Hawaiian Petrel", 85, []], ["Fea's Petrel", 85, []], ["Zino\u2019s Petrel", 85, []], ["Cook's Petrel", 85, []], ["Stejneger's Petrel", 85, []], ["Bulwer's Petrel", 85, []], ["White-chinned Petrel", 85, []], ["Parkinson's Petrel", 85, []], ["Streaked Shearwater", 85, []], ["Cory's Shearwater", 85, []], ["Cape Verde Shearwater", 85, []], ["Pink-footed Shearwater", 85, []], ["Flesh-footed Shearwater", 85, []], ["Great Shearwater", 85, []], ["Wedge-tailed Shearwater", 85, []], ["Buller's Shearwater", 85, []], ["Sooty Shearwater", 85, []], ["Short-tailed Shearwater", 85, []], ["Manx Shearwater", 85, []], ["Newell\u2019s Shearwater", 85, []], ["Black-vented Shearwater", 85, []], ["Audubon's Shearwater", 85, []], ["Barolo Shearwater", 85, []], ["Wilson's Storm-Petrel", 85, []], ["White-faced Storm-Petrel", 85, []], ["European Storm-Petrel", 85, []], ["Black-bellied Storm-Petrel", 85, []], ["Fork-tailed Storm-Petrel", 85, []], ["Ringed Storm-Petrel", 85, []], ["Swinhoe's Storm-Petrel", 85, []], ["Leach's Storm-Petrel", 85, []], ["Townsend's Storm-Petrel", 85, []], ["Ashy Storm-Petrel", 85, []], ["Band-rumped Storm-Petrel", 85, []], ["Wedge-rumped Storm-Petrel", 85, []], ["Black Storm-Petrel", 85, []], ["Tristram's Storm-Petrel", 85, []], ["Least Storm-Petrel", 85, []], ["White-tailed Tropicbird", 85, []], ["Red-billed Tropicbird", 85, []], ["Red-tailed Tropicbird", 85, []], ["Jabiru", 85, []], ["Wood Stork", 85, []], ["Magnificent Frigatebird", 85, []], ["Great Frigatebird", 85, []], ["Lesser Frigatebird", 85, []], ["Masked Booby", 85, []], ["Blue-footed Booby", 85, []], ["Brown Booby", 85, []], ["Red-footed Booby", 85, []], ["Northern Gannet", 85, []], ["Brandt's Cormorant", 85, []], ["Neotropic Cormorant", 85, []], ["Double-crested Cormorant", 85, []], ["Great Cormorant", 85, []], ["Red-faced Cormorant", 85, []], ["Pelagic Cormorant", 85, []], ["Anhinga", 85, []], ["American White Pelican", 85, []], ["Brown Pelican", 85, []], ["American Bittern", 85, []], ["Yellow Bittern", 85, []], ["Least Bittern", 85, []], ["Bare-throated Tiger-Heron", 85, []], ["Great Blue Heron", 85, []], ["Gray Heron", 85, []], ["Great Egret", 85, []], ["Intermediate Egret", 85, []], ["Chinese Egret", 85, []], ["Little Egret", 85, []], ["Western Reef-Heron", 85, []], ["Snowy Egret", 85, []], ["Little Blue Heron", 85, []], ["Tricolored Heron", 85, []], ["Reddish Egret", 85, []], ["Cattle Egret", 85, []], ["Chinese Pond-Heron", 85, []], ["Green Heron", 85, []], ["Black-crowned Night-Heron", 85, []], ["Yellow-crowned Night-Heron", 85, []], ["White Ibis", 85, []], ["Scarlet Ibis", 85, []], ["Glossy Ibis", 85, []], ["White-faced Ibis", 85, []], ["Roseate Spoonbill", 60, []], ["Black Vulture", 60, []], ["Turkey Vulture", 60, []], ["California Condor", 85, []], ["Osprey", 85, []], ["Hook-billed Kite", 60, []], ["Swallow-tailed Kite", 85, []], ["White-tailed Kite", 60, []], ["Snail Kite", 60, []], ["Double-toothed Kite", 85, []], ["Mississippi Kite", 60, []], ["Bald Eagle", 10, []], ["White-tailed Eagle", 60, []], ["Steller's Sea-Eagle", 85, []], ["Northern Harrier", 85, []], ["Sharp-shinned Hawk", 85, []], ["Cooper's Hawk", 85, []], ["Northern Goshawk", 85, []], ["Crane Hawk", 60, []], ["Common Black Hawk", 60, []], ["Roadside Hawk", 60, []], ["Harris's Hawk", 85, []], ["White-tailed Hawk", 60, []], ["Gray Hawk", 60, []], ["Red-shouldered Hawk", 85, []], ["Broad-winged Hawk", 60, []], ["Short-tailed Hawk", 60, []], ["Swainson's Hawk", 85, []], ["Zone-tailed Hawk", 60, []], ["Red-tailed Hawk", 60, []], ["Rough-legged Hawk", 60, []], ["Ferruginous Hawk", 85, []], ["Golden Eagle", 60, []], ["Yellow Rail", 30, []], ["Black Rail", 30, []], ["Corn Crake", 85, []], ["Ridgway\u2019s Rail", 85, []], ["Clapper Rail", 85, []], ["King Rail", 30, []], ["Virginia Rail", 30, []], ["Rufous-necked Wood-Rail", 85, []], ["Sora", 85, []], ["Paint-billed Crake", 85, []], ["Spotted Rail", 60, []], ["Purple Swamphen", 85, []], ["Purple Gallinule", 85, []], ["Common Gallinule", 85, []], ["Common Moorhen", 85, []], ["Eurasian Coot", 85, []], ["American Coot", 85, []], ["Sungrebe", 85, []], ["Limpkin", 85, []], ["Sandhill Crane", 85, []], ["Common Crane", 60, []], ["Whooping Crane", 60, []], ["Double-striped Thick-knee", 60, []], ["Black-winged Stilt", 85, []], ["Black-necked Stilt", 85, []], ["American Avocet", 85, []], ["Eurasian Oystercatcher", 85, []], ["American Oystercatcher", 85, []], ["Black Oystercatcher", 85, []], ["Northern Lapwing", 85, []], ["Black-bellied Plover", 85, []], ["European Golden-Plover", 85, []], ["American Golden-Plover", 85, []], ["Pacific Golden-Plover", 85, []], ["Lesser Sand-Plover", 85, []], ["Greater Sand-Plover", 85, []], ["Collared Plover", 85, []], ["Snowy Plover", 85, []], ["Wilson's Plover", 85, []], ["Common Ringed Plover", 85, []], ["Semipalmated Plover", 85, []], ["Piping Plover", 85, []], ["Little Ringed Plover", 85, []], ["Killdeer", 85, []], ["Mountain Plover", 85, []], ["Eurasian Dotterel", 85, []], ["Northern Jacana", 85, []], ["Terek Sandpiper", 85, []], ["Common Sandpiper", 85, []], ["Spotted Sandpiper", 85, []], ["Green Sandpiper", 85, []], ["Solitary Sandpiper", 85, []], ["Gray-tailed Tattler", 85, []], ["Wandering Tattler", 85, []], ["Spotted Redshank", 85, []], ["Greater Yellowlegs", 85, []], ["Common Greenshank", 85, []], ["Willet", 85, []], ["Lesser Yellowlegs", 85, []], ["Marsh Sandpiper", 85, []], ["Wood Sandpiper", 85, []], ["Common Redshank", 85, []], ["Upland Sandpiper", 85, []], ["Little Curlew", 85, []], ["Eskimo Curlew", 85, []], ["Whimbrel", 85, []], ["Bristle-thighed Curlew", 85, []], ["Far Eastern Curlew", 85, []], ["Slender-billed Curlew", 85, []], ["Eurasian Curlew", 85, []], ["Long-billed Curlew", 85, []], ["Black-tailed Godwit", 85, []], ["Hudsonian Godwit", 85, []], ["Bar-tailed Godwit", 85, []], ["Marbled Godwit", 85, []], ["Ruddy Turnstone", 85, []], ["Black Turnstone", 85, []], ["Great Knot", 60, []], ["Red Knot", 60, []], ["Surfbird", 85, []], ["Ruff", 85, []], ["Broad-billed Sandpiper", 85, []], ["Sharp-tailed Sandpiper", 85, []], ["Stilt Sandpiper", 85, []], ["Curlew Sandpiper", 85, []], ["Temminck's Stint", 85, []], ["Long-toed Stint", 85, []], ["Spoon-billed Sandpiper", 85, []], ["Red-necked Stint", 85, []], ["Sanderling", 85, []], ["Dunlin", 85, []], ["Rock Sandpiper", 85, []], ["Purple Sandpiper", 85, []], ["Baird's Sandpiper", 85, []], ["Little Stint", 60, []], ["Least Sandpiper", 85, []], ["White-rumped Sandpiper", 85, []], ["Buff-breasted Sandpiper", 85, []], ["Pectoral Sandpiper", 85, []], ["Semipalmated Sandpiper", 85, []], ["Western Sandpiper", 85, []], ["Short-billed Dowitcher", 85, []], ["Long-billed Dowitcher", 85, []], ["Jack Snipe", 85, []], ["Wilson's Snipe", 85, []], ["Common Snipe", 85, []], ["Pin-tailed Snipe", 85, []], ["Solitary Snipe", 85, []], ["Eurasian Woodcock", 85, []], ["American Woodcock", 85, []], ["Wilson's Phalarope", 85, []], ["Red-necked Phalarope", 85, []], ["Red Phalarope", 85, []], ["Oriental Pratincole", 85, []], ["Great Skua", 85, []], ["South Polar Skua", 85, []], ["Pomarine Jaeger", 85, []], ["Parasitic Jaeger", 85, []], ["Long-tailed Jaeger", 85, []], ["Dovekie", 85, []], ["Common Murre", 85, []], ["Thick-billed Murre", 85, []], ["Razorbill", 85, []], ["Great Auk", 85, []], ["Black Guillemot", 85, []], ["Pigeon Guillemot", 85, []], ["Long-billed Murrelet", 85, []], ["Marbled Murrelet", 85, []], ["Kittlitz's Murrelet", 85, []], ["Scripps's Murrelet", 85, []], ["Guadalupe Murrelet", 85, []], ["Craveri's Murrelet", 85, []], ["Ancient Murrelet", 85, []], ["Cassin's Auklet", 85, []], ["Parakeet Auklet", 85, []], ["Least Auklet", 85, []], ["Whiskered Auklet", 85, []], ["Crested Auklet", 85, []], ["Rhinoceros Auklet", 85, []], ["Atlantic Puffin", 85, []], ["Horned Puffin", 85, []], ["Tufted Puffin", 60, []], ["Swallow-tailed Gull", 85, []], ["Black-legged Kittiwake", 85, []], ["Red-legged Kittiwake", 85, []], ["Ivory Gull", 85, []], ["Sabine's Gull", 85, []], ["Bonaparte's Gull", 85, []], ["Gray-hooded Gull", 85, []], ["Black-headed Gull", 85, []], ["Little Gull", 85, []], ["Ross's Gull", 85, []], ["Laughing Gull", 85, []], ["Franklin's Gull", 85, []], ["Belcher's Gull", 85, []], ["Black-tailed Gull", 85, []], ["Heermann's Gull", 85, []], ["Mew Gull", 85, []], ["Ring-billed Gull", 85, []], ["Western Gull", 85, []], ["Yellow-footed Gull", 85, []], ["California Gull", 85, []], ["Herring Gull", 85, []], ["Yellow-legged Gull", 85, []], ["Thayer's Gull", 85, []], ["Iceland Gull", 85, []], ["Lesser Black-backed Gull", 85, []], ["Slaty-backed Gull", 85, []], ["Glaucous-winged Gull", 85, []], ["Glaucous Gull", 85, []], ["Great Black-backed Gull", 85, []], ["Kelp Gull", 85, []], ["Brown Noddy", 85, []], ["Black Noddy", 85, []], ["Sooty Tern", 85, []], ["Bridled Tern", 85, []], ["Aleutian Tern", 85, []], ["Least Tern", 85, []], ["Large-billed Tern", 85, []], ["Gull-billed Tern", 85, []], ["Caspian Tern", 85, []], ["Black Tern", 85, []], ["White-winged Tern", 85, []], ["Whiskered Tern", 85, []], ["Roseate Tern", 85, []], ["Common Tern", 85, []], ["Arctic Tern", 85, []], ["Forster's Tern", 85, []], ["Royal Tern", 85, []], ["Sandwich Tern", 85, []], ["Elegant Tern", 85, []], ["Black Skimmer", 85, []], ["Rock Pigeon", 60, []], ["Scaly-naped Pigeon", 85, []], ["White-crowned Pigeon", 60, []], ["Red-billed Pigeon", 60, []], ["Band-tailed Pigeon", 60, []], ["Oriental Turtle-Dove", 60, []], ["European Turtle-Dove", 60, []], ["Eurasian Collared-Dove", 85, []], ["Spotted Dove", 60, []], ["Passenger Pigeon", 60, []], ["Inca Dove", 85, []], ["Common Ground-Dove", 60, []], ["Ruddy Ground-Dove", 85, []], ["Ruddy Quail-Dove", 85, []], ["Key West Quail-Dove", 85, []], ["White-tipped Dove", 60, []], ["White-winged Dove", 60, []], ["Zenaida Dove", 85, []], ["Mourning Dove", 60, []], ["Common Cuckoo", 60, []], ["Oriental Cuckoo", 85, []], ["Yellow-billed Cuckoo", 85, []], ["Mangrove Cuckoo", 85, []], ["Black-billed Cuckoo", 85, []], ["Greater Roadrunner", 85, []], ["Smooth-billed Ani", 85, []], ["Groove-billed Ani", 85, []], ["Barn Owl", 30, []], ["Flammulated Owl", 100, []], ["Oriental Scops-Owl", 85, []], ["Western Screech-Owl", 85, []], ["Eastern Screech-Owl", 85, []], ["Whiskered Screech-Owl", 85, []], ["Great Horned Owl", 30, []], ["Snowy Owl", 30, []], ["Northern Hawk Owl", 60, []], ["Northern Pygmy-Owl", 85, []], ["Ferruginous Pygmy-Owl", 85, []], ["Elf Owl", 60, []], ["Burrowing Owl", 85, []], ["Mottled Owl", 85, []], ["Spotted Owl", 60, []], ["Barred Owl", 60, []], ["Great Gray Owl", 60, []], ["Long-eared Owl", 85, []], ["Stygian Owl", 85, []], ["Short-eared Owl", 85, []], ["Boreal Owl", 85, []], ["Northern Saw-whet Owl", 85, []], ["Northern Boobook", 85, []], ["Lesser Nighthawk", 85, []], ["Common Nighthawk", 85, []], ["Antillean Nighthawk", 85, []], ["Common Pauraque", 85, []], ["Common Poorwill", 85, []], ["Chuck-will's-widow", 85, []], ["Buff-collared Nightjar", 85, []], ["Eastern Whip-poor-will", 60, []], ["Mexican Whip-poor-will", 60, []], ["Gray Nightjar", 85, []], ["Black Swift", 30, []], ["White-collared Swift", 85, []], ["Chimney Swift", 60, []], ["Vaux's Swift", 85, []], ["White-throated Needletail", 85, []], ["Common Swift", 30, []], ["Fork-tailed Swift", 60, []], ["White-throated Swift", 85, []], ["Antillean Palm-Swift", 85, []], ["Green Violetear", 85, []], ["Green-breasted Mango", 85, []], ["Magnificent Hummingbird", 85, []], ["Plain-capped Starthroat", 85, []], ["Blue-throated Hummingbird", 85, []], ["Bahama Woodstar", 85, []], ["Lucifer Hummingbird", 85, []], ["Ruby-throated Hummingbird", 85, []], ["Black-chinned Hummingbird", 85, []], ["Anna's Hummingbird", 85, []], ["Costa's Hummingbird", 85, []], ["Bumblebee Hummingbird", 85, []], ["Broad-tailed Hummingbird", 85, []], ["Rufous Hummingbird", 85, []], ["Allen's Hummingbird", 85, []], ["Calliope Hummingbird", 85, []], ["Broad-billed Hummingbird", 85, []], ["Berylline Hummingbird", 85, []], ["Buff-bellied Hummingbird", 85, []], ["Cinnamon Hummingbird", 85, []], ["Violet-crowned Hummingbird", 100, []], ["White-eared Hummingbird", 85, []], ["Xantus's Hummingbird", 85, []], ["Elegant Trogon", 85, []], ["Eared Quetzal", 85, []], ["Eurasian Hoopoe", 85, []], ["Ringed Kingfisher", 85, []], ["Belted Kingfisher", 85, []], ["Amazon Kingfisher", 85, []], ["Green Kingfisher", 85, []], ["Eurasian Wryneck", 85, []], ["Lewis's Woodpecker", 85, []], ["Red-headed Woodpecker", 85, []], ["Acorn Woodpecker", 85, []], ["Gila Woodpecker", 85, []], ["Golden-fronted Woodpecker", 85, []], ["Red-bellied Woodpecker", 85, []], ["Williamson's Sapsucker", 85, []], ["Yellow-bellied Sapsucker", 85, []], ["Red-naped Sapsucker", 85, []], ["Red-breasted Sapsucker", 85, []], ["Great Spotted Woodpecker", 85, []], ["Ladder-backed Woodpecker", 85, []], ["Nuttall's Woodpecker", 85, []], ["Downy Woodpecker", 85, []], ["Hairy Woodpecker", 85, []], ["Arizona Woodpecker", 85, []], ["Red-cockaded Woodpecker", 85, []], ["White-headed Woodpecker", 85, []], ["American Three-toed Woodpecker", 85, []], ["Black-backed Woodpecker", 85, []], ["Northern Flicker", 85, []], ["Gilded Flicker", 85, []], ["Pileated Woodpecker", 60, []], ["Ivory-billed Woodpecker", 85, []], ["Collared Forest-Falcon", 85, []], ["Crested Caracara", 85, []], ["Eurasian Kestrel", 85, []], ["American Kestrel", 85, []], ["Red-footed Falcon", 60, []], ["Merlin", 60, []], ["Eurasian Hobby", 85, []], ["Aplomado Falcon", 85, []], ["Gyrfalcon", 85, []], ["Peregrine Falcon", 30, []], ["Prairie Falcon", 60, []], ["Rosy-faced Lovebird", 85, []], ["Monk Parakeet", 85, []], ["Carolina Parakeet", 85, []], ["Nanday Parakeet", 85, []], ["Green Parakeet", 85, []], ["Thick-billed Parrot", 60, []], ["White-winged Parakeet", 85, []], ["Red-crowned Parrot", 60, []], ["Northern Beardless-Tyrannulet", 85, []], ["Greenish Elaenia", 85, []], ["White-crested Elaenia", 85, []], ["Tufted Flycatcher", 85, []], ["Olive-sided Flycatcher", 85, []], ["Greater Pewee", 85, []], ["Western Wood-Pewee", 85, []], ["Eastern Wood-Pewee", 85, []], ["Cuban Pewee", 85, []], ["Yellow-bellied Flycatcher", 85, []], ["Acadian Flycatcher", 85, []], ["Alder Flycatcher", 85, []], ["Willow Flycatcher", 85, []], ["Least Flycatcher", 85, []], ["Hammond's Flycatcher", 85, []], ["Gray Flycatcher", 85, []], ["Dusky Flycatcher", 85, []], ["Pacific-slope Flycatcher", 85, []], ["Cordilleran Flycatcher", 85, []], ["Buff-breasted Flycatcher", 85, []], ["Black Phoebe", 60, []], ["Eastern Phoebe", 60, []], ["Say's Phoebe", 85, []], ["Vermilion Flycatcher", 85, []], ["Dusky-capped Flycatcher", 85, []], ["Ash-throated Flycatcher", 85, []], ["Nutting's Flycatcher", 85, []], ["Great Crested Flycatcher", 85, []], ["Brown-crested Flycatcher", 85, []], ["La Sagra's Flycatcher", 85, []], ["Great Kiskadee", 85, []], ["Social Flycatcher", 85, []], ["Sulphur-bellied Flycatcher", 85, []], ["Piratic Flycatcher", 85, []], ["Variegated Flycatcher", 85, []], ["Crowned Slaty Flycatcher", 85, []], ["Tropical Kingbird", 85, []], ["Couch's Kingbird", 85, []], ["Cassin's Kingbird", 85, []], ["Thick-billed Kingbird", 85, []], ["Western Kingbird", 85, []], ["Eastern Kingbird", 85, []], ["Gray Kingbird", 85, []], ["Loggerhead Kingbird", 85, []], ["Scissor-tailed Flycatcher", 85, []], ["Fork-tailed Flycatcher", 85, []], ["Masked Tityra", 85, []], ["Gray-collared Becard", 85, []], ["Rose-throated Becard", 85, []], ["Brown Shrike", 85, []], ["Loggerhead Shrike", 85, []], ["Northern Shrike", 85, []], ["White-eyed Vireo", 85, []], ["Thick-billed Vireo", 85, []], ["Bell's Vireo", 85, []], ["Black-capped Vireo", 85, []], ["Gray Vireo", 85, []], ["Yellow-throated Vireo", 85, []], ["Plumbeous Vireo", 85, []], ["Cassin's Vireo", 85, []], ["Blue-headed Vireo", 85, []], ["Hutton's Vireo", 85, []], ["Warbling Vireo", 85, []], ["Philadelphia Vireo", 85, []], ["Red-eyed Vireo", 85, []], ["Yellow-green Vireo", 85, []], ["Black-whiskered Vireo", 85, []], ["Yucatan Vireo", 85, []], ["Gray Jay", 30, []], ["Brown Jay", 30, []], ["Green Jay", 30, []], ["Pinyon Jay", 85, []], ["Steller's Jay", 85, []], ["Blue Jay", 10, []], ["Florida Scrub-Jay", 60, []], ["Island Scrub-Jay", 60, []], ["California Scrub-Jay", 60, []], ["Woodhouse's Scrub-Jay", 85, []], ["Mexican Jay", 60, []], ["Clark's Nutcracker", 85, []], ["Black-billed Magpie", 85, []], ["Yellow-billed Magpie", 85, []], ["Eurasian Jackdaw", 85, []], ["American Crow", 30, []], ["Northwestern Crow", 60, []], ["Tamaulipas Crow", 85, []], ["Fish Crow", 60, []], ["Chihuahuan Raven", 85, []], ["Common Raven", 60, []], ["Eurasian Skylark", 85, []], ["Horned Lark", 85, []], ["Purple Martin", 30, []], ["Cuban Martin", 60, []], ["Gray-breasted Martin", 85, []], ["Southern Martin", 30, []], ["Brown-chested Martin", 85, []], ["Tree Swallow", 60, []], ["Mangrove Swallow", 85, []], ["Violet-green Swallow", 60, []], ["Bahama Swallow", 85, []], ["Northern Rough-winged Swallow", 60, []], ["Bank Swallow", 60, []], ["Cliff Swallow", 60, []], ["Cave Swallow", 60, []], ["Barn Swallow", 60, []], ["Common House-Martin", 30, []], ["Carolina Chickadee", 85, []], ["Black-capped Chickadee", 85, []], ["Mountain Chickadee", 85, []], ["Mexican Chickadee", 85, []], ["Chestnut-backed Chickadee", 85, []], ["Boreal Chickadee", 85, []], ["Gray-headed Chickadee", 85, []], ["Bridled Titmouse", 85, []], ["Oak Titmouse", 85, []], ["Juniper Titmouse", 85, []], ["Tufted Titmouse", 85, []], ["Black-crested Titmouse", 85, []], ["Verdin", 85, []], ["Bushtit", 85, []], ["Red-breasted Nuthatch", 85, []], ["White-breasted Nuthatch", 85, []], ["Pygmy Nuthatch", 85, []], ["Brown-headed Nuthatch", 85, []], ["Brown Creeper", 85, []], ["Rock Wren", 85, []], ["Canyon Wren", 85, []], ["House Wren", 85, []], ["Pacific Wren", 85, []], ["Winter Wren", 85, []], ["Sedge Wren", 85, []], ["Marsh Wren", 85, []], ["Carolina Wren", 85, []], ["Bewick's Wren", 85, []], ["Cactus Wren", 85, []], ["Sinaloa Wren", 85, []], ["Blue-gray Gnatcatcher", 85, []], ["California Gnatcatcher", 85, []], ["Black-tailed Gnatcatcher", 85, []], ["Black-capped Gnatcatcher", 85, []], ["American Dipper", 85, []], ["Red-whiskered Bulbul", 85, []], ["Golden-crowned Kinglet", 85, []], ["Ruby-crowned Kinglet", 85, []], ["Willow Warbler", 85, []], ["Common Chiffchaff", 85, []], ["Wood Warbler", 85, []], ["Dusky Warbler", 85, []], ["Pallas's Leaf Warbler", 85, []], ["Yellow-browed Warbler", 85, []], ["Arctic Warbler", 85, []], ["Kamchatka Leaf Warbler", 85, []], ["Lesser Whitethroat", 85, []], ["Wrentit", 85, []], ["Sedge Warbler", 85, []], ["Middendorff's Grasshopper-Warbler", 85, []], ["Lanceolated Warbler", 85, []], ["Gray-streaked Flycatcher", 85, []], ["Asian Brown Flycatcher", 85, []], ["Spotted Flycatcher", 85, []], ["Dark-sided Flycatcher", 85, []], ["Rufous-tailed Robin", 85, []], ["Siberian Rubythroat", 85, []], ["Bluethroat", 85, []], ["Siberian Blue Robin", 60, []], ["Red-flanked Bluetail", 85, []], ["Narcissus Flycatcher", 85, []], ["Mugimaki Flycatcher", 85, []], ["Taiga Flycatcher", 85, []], ["Northern Wheatear", 85, []], ["Common Redstart", 85, []], ["Stonechat", 85, []], ["Eastern Bluebird", 85, []], ["Western Bluebird", 85, []], ["Mountain Bluebird", 85, []], ["Townsend's Solitaire", 85, []], ["Brown-backed Solitaire", 85, []], ["Orange-billed Nightingale-Thrush", 85, []], ["Black-headed Nightingale-Thrush", 85, []], ["Veery", 85, []], ["Gray-cheeked Thrush", 85, []], ["Bicknell's Thrush", 85, []], ["Swainson's Thrush", 85, []], ["Hermit Thrush", 85, []], ["Wood Thrush", 85, []], ["Eurasian Blackbird", 85, []], ["Eyebrowed Thrush", 85, []], ["Dusky Thrush", 85, []], ["Fieldfare", 85, []], ["Redwing", 85, []], ["Song Thrush", 85, []], ["Clay-colored Thrush", 85, []], ["White-throated Thrush", 85, []], ["Rufous-backed Robin", 85, []], ["American Robin", 10, []], ["Red-legged Thrush", 85, []], ["Varied Thrush", 85, []], ["Aztec Thrush", 85, []], ["Blue Mockingbird", 85, []], ["Gray Catbird", 85, ["Grey Catbird"]], ["Curve-billed Thrasher", 85, []], ["Brown Thrasher", 85, []], ["Long-billed Thrasher", 85, []], ["Bendire's Thrasher", 85, []], ["California Thrasher", 85, []], ["Le Conte's Thrasher", 85, []], ["Crissal Thrasher", 85, []], ["Sage Thrasher", 85, []], ["Bahama Mockingbird", 85, []], ["Northern Mockingbird", 85, []], ["European Starling", 85, []], ["Common Myna", 85, []], ["Siberian Accentor", 85, []], ["Eastern Yellow Wagtail", 85, []], ["Citrine Wagtail", 85, []], ["Gray Wagtail", 85, []], ["White Wagtail", 85, []], ["Tree Pipit", 85, []], ["Olive-backed Pipit", 85, []], ["Pechora Pipit", 85, []], ["Red-throated Pipit", 85, []], ["American Pipit", 85, []], ["Sprague's Pipit", 85, []], ["Bohemian Waxwing", 85, []], ["Cedar Waxwing", 85, []], ["Gray Silky-flycatcher", 85, []], ["Phainopepla", 85, []], ["Olive Warbler", 85, []], ["Lapland Longspur", 85, []], ["Chestnut-collared Longspur", 85, []], ["Smith's Longspur", 85, []], ["McCown's Longspur", 85, []], ["Snow Bunting", 85, []], ["McKay's Bunting", 85, []], ["Ovenbird", 85, []], ["Worm-eating Warbler", 85, []], ["Louisiana Waterthrush", 85, []], ["Northern Waterthrush", 85, []], ["Bachman's Warbler", 85, []], ["Golden-winged Warbler", 85, []], ["Blue-winged Warbler", 85, []], ["Black-and-white Warbler", 85, []], ["Prothonotary Warbler", 85, []], ["Swainson's Warbler", 85, []], ["Crescent-chested Warbler", 85, []], ["Tennessee Warbler", 85, []], ["Orange-crowned Warbler", 85, []], ["Colima Warbler", 85, []], ["Lucy's Warbler", 85, []], ["Nashville Warbler", 85, []], ["Virginia's Warbler", 85, []], ["Connecticut Warbler", 85, []], ["Gray-crowned Yellowthroat", 85, []], ["MacGillivray's Warbler", 85, []], ["Mourning Warbler", 85, []], ["Kentucky Warbler", 85, []], ["Common Yellowthroat", 85, []], ["Hooded Warbler", 85, []], ["American Redstart", 85, []], ["Kirtland's Warbler", 85, []], ["Cape May Warbler", 85, []], ["Cerulean Warbler", 85, []], ["Northern Parula", 85, []], ["Tropical Parula", 85, []], ["Magnolia Warbler", 85, []], ["Bay-breasted Warbler", 85, []], ["Blackburnian Warbler", 85, []], ["Yellow Warbler", 85, []], ["Chestnut-sided Warbler", 85, []], ["Blackpoll Warbler", 85, []], ["Black-throated Blue Warbler", 85, []], ["Palm Warbler", 85, []], ["Pine Warbler", 85, []], ["Yellow-rumped Warbler", 85, []], ["Yellow-throated Warbler", 85, []], ["Prairie Warbler", 85, []], ["Grace's Warbler", 85, []], ["Black-throated Gray Warbler", 85, []], ["Townsend's Warbler", 85, []], ["Hermit Warbler", 85, []], ["Golden-cheeked Warbler", 85, []], ["Black-throated Green Warbler", 85, []], ["Fan-tailed Warbler", 85, []], ["Rufous-capped Warbler", 85, []], ["Golden-crowned Warbler", 85, []], ["Canada Warbler", 85, []], ["Wilson's Warbler", 85, []], ["Red-faced Warbler", 85, []], ["Painted Redstart", 85, []], ["Slate-throated Redstart", 85, []], ["Yellow-breasted Chat", 85, []], ["Western Spindalis", 85, []], ["Red-legged Honeycreeper", 85, []], ["Bananaquit", 85, []], ["Yellow-faced Grassquit", 85, []], ["Black-faced Grassquit", 85, []], ["White-collared Seedeater", 85, []], ["Olive Sparrow", 60, []], ["Green-tailed Towhee", 85, []], ["Spotted Towhee", 85, []], ["Eastern Towhee", 85, []], ["Rufous-crowned Sparrow", 85, []], ["Canyon Towhee", 85, []], ["California Towhee", 85, []], ["Abert's Towhee", 85, []], ["Rufous-winged Sparrow", 85, []], ["Botteri's Sparrow", 85, []], ["Cassin's Sparrow", 85, []], ["Bachman's Sparrow", 85, []], ["American Tree Sparrow", 60, []], ["Chipping Sparrow", 85, []], ["Clay-colored Sparrow", 60, []], ["Brewer's Sparrow", 85, []], ["Field Sparrow", 60, []], ["Worthen's Sparrow", 85, []], ["Black-chinned Sparrow", 85, []], ["Vesper Sparrow", 85, []], ["Lark Sparrow", 85, []], ["Five-striped Sparrow", 60, []], ["Black-throated Sparrow", 85, []], ["Sagebrush Sparrow", 85, []], ["Bell's Sparrow", 85, []], ["Lark Bunting", 85, []], ["Savannah Sparrow", 60, []], ["Grasshopper Sparrow", 85, []], ["Baird's Sparrow", 85, []], ["Henslow's Sparrow", 85, []], ["Le Conte's Sparrow", 85, []], ["Nelson's Sparrow", 85, []], ["Saltmarsh Sparrow", 85, []], ["Seaside Sparrow", 60, []], ["Fox Sparrow", 60, []], ["Song Sparrow", 60, []], ["Lincoln's Sparrow", 85, []], ["Swamp Sparrow", 60, []], ["White-throated Sparrow", 85, []], ["Harris's Sparrow", 85, []], ["White-crowned Sparrow", 60, []], ["Golden-crowned Sparrow", 60, []], ["Dark-eyed Junco", 85, []], ["Yellow-eyed Junco", 85, []], ["Pine Bunting", 85, []], ["Yellow-browed Bunting", 85, []], ["Little Bunting", 85, []], ["Rustic Bunting", 85, []], ["Yellow-throated Bunting", 85, []], ["Yellow-breasted Bunting", 85, []], ["Gray Bunting", 85, []], ["Pallas's Bunting", 85, []], ["Reed Bunting", 85, []], ["Hepatic Tanager", 85, []], ["Summer Tanager", 85, []], ["Scarlet Tanager", 85, []], ["Western Tanager", 85, []], ["Flame-colored Tanager", 85, []], ["Crimson-collared Grosbeak", 85, []], ["Northern Cardinal", 30, []], ["Pyrrhuloxia", 85, []], ["Yellow Grosbeak", 85, []], ["Rose-breasted Grosbeak", 85, []], ["Black-headed Grosbeak", 85, []], ["Blue Bunting", 85, []], ["Blue Grosbeak", 85, []], ["Lazuli Bunting", 85, []], ["Indigo Bunting", 85, []], ["Varied Bunting", 85, []], ["Painted Bunting", 85, []], ["Dickcissel", 85, []], ["Bobolink", 85, []], ["Red-winged Blackbird", 85, []], ["Tricolored Blackbird", 85, []], ["Tawny-shouldered Blackbird", 85, []], ["Eastern Meadowlark", 85, []], ["Western Meadowlark", 85, []], ["Yellow-headed Blackbird", 85, []], ["Rusty Blackbird", 85, []], ["Brewer's Blackbird", 85, []], ["Common Grackle", 85, []], ["Boat-tailed Grackle", 85, []], ["Great-tailed Grackle", 85, []], ["Shiny Cowbird", 85, []], ["Bronzed Cowbird", 85, []], ["Brown-headed Cowbird", 85, []], ["Black-vented Oriole", 85, []], ["Orchard Oriole", 85, []], ["Hooded Oriole", 85, []], ["Streak-backed Oriole", 85, []], ["Bullock's Oriole", 85, []], ["Spot-breasted Oriole", 85, []], ["Altamira Oriole", 85, []], ["Audubon's Oriole", 85, []], ["Baltimore Oriole", 85, []], ["Scott's Oriole", 85, []], ["Common Chaffinch", 85, []], ["Brambling", 85, []], ["Asian Rosy-Finch", 85, []], ["Gray-crowned Rosy-Finch", 85, []], ["Black Rosy-Finch", 85, []], ["Brown-capped Rosy-Finch", 85, []], ["Pine Grosbeak", 85, []], ["Eurasian Bullfinch", 85, []], ["Common Rosefinch", 85, []], ["Pallas's Rosefinch", 85, []], ["House Finch", 60, []], ["Purple Finch", 60, []], ["Cassin's Finch", 85, []], ["Red Crossbill", 85, []], ["White-winged Crossbill", 85, []], ["Common Redpoll", 85, []], ["Hoary Redpoll", 85, []], ["Eurasian Siskin", 85, []], ["Pine Siskin", 85, []], ["Lesser Goldfinch", 85, []], ["Lawrence's Goldfinch", 85, []], ["American Goldfinch", 85, []], ["Oriental Greenfinch", 85, []], ["Evening Grosbeak", 85, []], ["Hawfinch", 85, []], ["House Sparrow", 60, []], ["Eurasian Tree Sparrow", 85, []], ["Scaly-breasted Munia", 85, []]]], [{ "id": "cultured-dairy", "family": "food", "topic": "THE CULTURED COUNTER", "prompt": "Name a cheese, cultured milk, or other fermented dairy product. Traditional varieties and named cheeses count.", "source": "Corpora foods/curds, CC0; normalized duplicates merged, common dairy forms added. Scope includes fermented milks as well as cheeses.", "ranking": "familiarity-v1" }, [["aaruul", 85, []], ["Abaza", 85, []], ["Abbamare", 85, []], ["Abbaye de Belloc", 85, []], ["Abbaye de Tami\xE9", 85, []], ["Abertam", 85, []], ["Abondance", 85, []], ["Accasciato", 85, []], ["Acceglio", 85, []], ["Acidino", 85, []], ["Ackawi", 85, []], ["Adobera cheese", 85, []], ["Adygheysky", 85, []], ["Afuega'l pitu", 85, []], ["Aglino", 85, []], ["Agr\xEC di Valtorta", 85, []], ["Ainuzzi", 85, []], ["airag", 85, []], ["Akawi", 85, []], ["Akawieh", 85, []], ["Akkawi", 85, []], ["Aladino", 85, []], ["Algunder Bauernk\xE4se Halbfett", 85, []], ["Algunder Butterk\xE4se", 85, []], ["Algunder Ziegenk\xE4se", 85, []], ["Allerdale", 85, []], ["Allg\xE4uer Bergk\xE4se", 85, []], ["Almk\xE4se", 85, []], ["Alpeggio di Triora", 85, []], ["Alpepiana", 85, []], ["Alpepiana Macig", 85, []], ["Alpigiana", 85, []], ["Alpk\xE4se", 85, []], ["Altaysky", 85, []], ["amasi", 85, []], ["Amatriciano", 85, []], ["Ambra di Talamello", 85, []], ["Ambrosiana", 85, []], ["American Cheese", 30, []], ["Anari", 85, []], ["A\xF1ejo cheese", 85, []], ["Animaletti di Provola", 85, []], ["Antep", 85, []], ["Anthotyros", 85, []], ["Aostano", 85, []], ["Aostino", 85, []], ["Appenzeller", 85, []], ["Appleby Cheshire", 85, []], ["Appledore", 85, []], ["Applewood", 85, []], ["Arabieh", 85, []], ["Ardrahan", 85, []], ["Ardsallagh", 85, []], ["Areesh", 85, []], ["Ar\u012Bsh", 85, []], ["Armola", 85, []], ["Arnavut", 85, []], ["Arseniko Naxou", 85, []], ["Arunda", 85, []], ["Asadero cheese", 85, []], ["Aschbacher Magerk\xE4se", 85, []], ["Ashdown Foresters", 85, []], ["Asiago", 85, []], ["Asiago d'allevo", 85, []], ["Asiago Montasio", 85, []], ["Asiago pressato", 85, []], ["Asiago stravecchio", 85, []], ["As\xECno", 85, []], ["Aura", 60, []], ["Auricchio", 85, []], ["Ayibe", 85, []], ["Babybel", 85, []], ["Bachensteiner", 85, []], ["Bacio", 85, []], ["Bacio di latte di capra", 85, []], ["Bacio di latte di mucca", 85, []], ["Backstein", 85, []], ["Bag\xF2s", 85, []], ["Bagoss", 85, []], ["Bag\xF2ss di Bagolino", 85, []], ["bainne cl\xE1bair", 85, []], ["Baladi", 85, []], ["Balcombe Brown Ring", 85, []], ["Ballintubber Cheddar", 85, []], ["Ballyblue", 85, []], ["Ballybrie", 85, []], ["Ballyhooly Blue", 85, []], ["Ballyoak", 85, []], ["Ballyporeen", 85, []], ["Baltas s\u016Bris", 85, []], ["Ba\u0142tycki", 85, []], ["Bandel", 85, []], ["Banon", 85, []], ["Baricot", 85, []], ["Barkham Blue", 85, []], ["Basket cheese", 60, []], ["Bastardo del Grappa", 85, []], ["Bath Blue", 30, []], ["Bath Soft Cheese", 60, []], ["batti", 85, []], ["Batzos", 85, []], ["Bauernk\xE4se", 85, []], ["Beacon Fell traditional Lancashire", 60, ["Beacon Fell Traditional Lancashire Cheese"]], ["Beara Blue", 85, []], ["Beaufort", 85, []], ["Beb\xE9 di Sorrento", 85, []], ["Beddo", 85, []], ["Bedura", 85, []], ["Beenleigh Blue", 85, []], ["Begiunn", 85, []], ["Bel Paese", 85, []], ["beli sir", 85, []], ["Belicino", 85, []], ["Bella Badia", 85, []], ["Bella Lodi", 85, []], ["Belmonte", 85, []], ["Bergk\xE4se", 85, []], ["Berkswell", 85, []], ["Bernardo", 60, []], ["Berner Alpk\xE4se", 85, []], ["Bettelmatt", 85, []], ["Beyaz peynir", 85, []], ["bhuna khoa", 85, []], ["Bianco verde", 85, []], ["Biancospino", 85, []], ["biezpiena sieri\u0146\u0161", 85, []], ["biezpiens", 85, []], ["Bilozhar", 85, []], ["Bitto", 85, []], ["Bitto d'Alpe", 85, []], ["Bitto Valtellina", 85, []], ["Bl\xE5 Gotland", 85, []], ["Black Bevon Welsh", 85, []], ["Bleu d'Aoste", 85, []], ["Bleu d'Auvergne", 85, []], ["Bleu de Bresse", 85, []], ["Bleu de Gex", 85, []], ["Bleu de Septmoncel", 85, []], ["Bleu des Causses", 85, []], ["Bleu du Haut-Jura", 85, []], ["Bleu du Vercors-Sassenage", 85, []], ["Blu Alpi Cozzie", 85, []], ["Blu Antico", 85, []], ["Blu del Moncenisio", 85, []], ["Blu del Moncenisio d'alpeggio", 85, []], ["Blu di montagna", 85, []], ["Blu Val Chiusella", 85, []], ["Blue Wensleydale", 85, []], ["Bocconcini", 85, []], ["Bocconcini alla panna di bufala", 85, []], ["Bohinc Jo\u017Ee", 85, []], ["Bokmakiri", 85, []], ["Bonassai", 85, []], ["Bonchester", 85, []], ["Bonifaz", 85, []], ["bonny clabber", 85, []], ["Bonrus", 85, []], ["Bormino", 85, []], ["Boscatella di Fiav\xE8", 85, []], ["Boschetto al Tartufo", 85, []], ["Boule de Lille", 85, []], ["Boursin", 85, []], ["Boves", 85, []], ["Bov\u0161ki sir", 85, []], ["Bowland cheese", 85, []], ["Boyne Valley Blue", 85, []], ["Bra", 60, []], ["Bra d'alpeggio", 85, []], ["Bra duro", 85, []], ["Bra tenero", 85, []], ["Br\xE2nz\u0103", 85, []], ["Br\xE2nz\u01CE de burduf", 85, []], ["Br\xE2nz\u0103 de vaci", 85, []], ["Branzi", 85, []], ["Braunk\xE4se", 85, []], ["Brebiblu", 85, []], ["Brebidor", 85, []], ["Brenca", 85, []], ["Brenza", 85, []], ["Bresciannella", 85, []], ["Bricchetto tartufo", 85, []], ["Brick cheese", 60, []], ["Brie de Meaux", 85, []], ["Brie de Melun", 85, []], ["Brie Noir", 85, []], ["Brighton Blue", 60, []], ["Brillat-Savarin", 85, []], ["Brimsen", 85, []], ["Brinkburn", 85, []], ["Brocciu", 85, []], ["Brochocki", 85, []], ["Bros", 60, []], ["Bross", 85, []], ["Brossa", 85, []], ["Brotzu", 85, []], ["Brunost", 85, []], ["Brussels", 60, []], ["Bruz d'Murazzan", 85, []], ["Bruz d'Murazzanivan", 85, []], ["Bruzzu", 85, []], ["Bryndza", 85, []], ["Bryndza Podhala\u0144ska", 85, []], ["Bucheron", 85, []], ["Buffalo curd", 85, []], ["Buffalo Mozzarella", 85, []], ["Buflona", 85, []], ["Bukovinskyi", 85, []], ["bulgaros", 85, []], ["bunc", 85, []], ["B\xFCndner Bergk\xE4se", 85, []], ["Bundz", 85, []], ["Burrata", 60, []], ["Burrata delle Murge", 85, []], ["Burrata di bufala", 85, []], ["Burrell", 85, []], ["Burren Gold", 85, []], ["Burrino", 85, []], ["Bursztyn", 85, []], ["Busche", 85, []], ["Butirro", 85, []], ["butter", 30, []], ["Butterk\xE4se", 85, []], ["Buxton Blue", 85, []], ["Byaslag", 85, []], ["Cabecou", 85, []], ["Caboc", 85, []], ["Cachat", 85, []], ["Cacio a forma di limone", 85, []], ["Cacio di fossa", 85, []], ["Cacio di vacca bianca", 85, []], ["Cacio figurato", 85, []], ["Cacio magno", 85, []], ["Cacio marcetto", 85, []], ["Cacio ubriaco", 85, []], ["Caciocotto", 85, []], ["Caciofiore aquilino", 85, []], ["Cacioforte", 85, []], ["Cacioreale", 85, []], ["Cacioricotta", 85, []], ["Cacioricotta campana", 85, []], ["Cacioricotta di bufala", 85, []], ["Cacioricotta di capra cilentina", 85, []], ["Cacioricotta fresca", 85, []], ["Cacioricotta lucano", 85, []], ["Cacioricotta pugliese", 85, []], ["Caciotta", 85, []], ["Caciotta al peperoncino", 85, []], ["Caciotta amiatina", 85, []], ["Caciotta calabra", 85, []], ["Caciotta campana", 85, []], ["Caciotta degli Elimi", 85, []], ["Caciotta dei Monti della Laga", 85, []], ["Caciotta del Fermano", 85, []], ["Caciotta del Monte Lazzarina", 85, []], ["Caciotta del Montefeltro", 85, []], ["Caciotta della Lunigiana", 85, []], ["Caciotta della sabina", 85, []], ["Caciotta di Asiago", 85, []], ["Caciotta di Brugnato", 85, []], ["Caciotta di bufala", 85, []], ["Caciotta di bufala pontina", 85, []], ["Caciotta di capra", 85, []], ["Caciotta di latte caprino", 85, []], ["Caciotta di Montemauro", 85, []], ["Caciotta di pecora", 85, []], ["Caciotta dolce", 85, []], ["Caciotta Manzone", 85, []], ["Caciotta mista della Tuscia", 85, []], ["Caciotta misto pecora", 85, []], ["Caciotta sarda", 85, []], ["Caciotta senese", 85, []], ["Caciotta toscana", 85, []], ["Caciotta vaccina frentana", 85, []], ["Caciottina", 85, []], ["Caciottina canestrata", 85, []], ["Cadolet di capra", 85, []], ["Caerphilly", 85, []], ["Cafone", 85, []], ["Cais Dubh", 85, []], ["Cais Rua", 85, []], ["Caithness", 85, []], ["Calcagno", 85, []], ["Callu de cabreddu", 85, []], ["Camasciano", 85, []], ["Cambozola", 85, []], ["Camembert de Normandie", 85, []], ["\xC7amur", 85, []], ["Cancoillotte", 85, []], ["Candela di Langa", 85, []], ["Canestrato", 85, []], ["Canestrato crotonese", 85, []], ["Canestrato d'Aspromonte", 85, []], ["Canestrato di Calabria", 85, []], ["Canestrato di Moliterno Stagionato in Fondaco", 85, []], ["Canestrato pugliese", 85, []], ["Canestrato sardo", 85, []], ["Canestrato trentino", 85, []], ["Canestrato vacchino", 85, []], ["Cansiglio", 85, []], ["Cantal", 85, []], ["Cantalet", 85, []], ["Cappello del Mago", 85, []], ["Cappucetto roso", 85, []], ["Capretta", 85, []], ["Capridor", 85, []], ["Caprini bergamaschi", 85, []], ["Caprino", 85, []], ["Caprino a coagulazione lattica", 85, []], ["Caprino a coagulazione presamica", 85, []], ["Caprino al lattice di fico", 85, []], ["Caprino al pepe di Bagnolo", 85, []], ["Caprino bicchierino", 85, []], ["Caprino da grattugia", 85, []], ["Caprino degli Alburni", 85, []], ["Caprino dell'Aspromonte", 85, []], ["Caprino della Limina", 85, []], ["Caprino della Val Brevenna", 85, []], ["Caprino della Val Vigezzo", 85, []], ["Caprino di Baceno", 85, []], ["Caprino di Cavalese", 85, []], ["Caprino di Demonte", 85, []], ["Caprino di malga delle Alpi Marittime", 85, []], ["Caprino di Montefalcone del Sannio", 85, []], ["Caprino di Rimella", 85, []], ["Caprino Francese", 85, []], ["Caprino fresco", 85, []], ["Caprino fresco veneto", 85, []], ["Caprino lattico piemontese", 85, []], ["Caprino lombardo", 85, []], ["Caprino ossolano", 85, []], ["Caprino presamico piemontese", 85, []], ["Caprino sardo", 85, []], ["Caprino spazzacamino", 85, []], ["Caprino stagionato", 85, []], ["Caprino trentino", 85, []], ["Caprino vaccino", 85, []], ["Caprino Valle", 85, []], ["Caprino valsesiano", 85, []], ["Capriola", 85, []], ["Capritilla", 85, []], ["Caravane", 85, []], ["Carboncino", 85, []], ["Carletta-Tometta cremosa di pecora", 85, []], ["Carlina Robiola di pura capra", 85, []], ["Carlow Cheese", 85, []], ["Carmasciano", 85, []], ["Carnia", 85, []], ["Carr\xE9 de l'Est", 85, []], ["Carrigaline", 85, []], ["Carrowholly", 85, []], ["Ca\u0219", 85, []], ["Casale de Elva", 85, []], ["Casalina", 85, []], ["Casareccio di Gorreto", 85, []], ["Cas\xE0t Gardesano", 85, []], ["Casatella", 85, []], ["Casatella Romagnola", 85, []], ["Casatella Trevigiana", 85, []], ["Casatta nostrana di Corteno Golgi", 85, []], ["Ca\u0219caval", 85, []], ["Casciotta di Urbino", 85, []], ["Casel Bellunese", 85, []], ["Casera", 85, []], ["Casera Crotto", 85, []], ["Casera giovane Valtellina", 85, []], ["Casera uso monte", 85, []], ["Cashel Blue", 85, []], ["Casieddu di Moliterno", 85, []], ["Casizolu", 85, []], ["Casizolu di pecora", 85, []], ["Caso conzato", 85, []], ["Caso di Elva", 85, []], ["Caso peruto", 85, []], ["Casolet", 85, []], ["Casolet della Val di Sole", 85, []], ["Casoretta", 85, []], ["Cassatella", 85, []], ["Castel Ariund", 85, []], ["Castelmagno", 85, []], ["Castelo Branco", 85, []], ["Castelrosso", 85, []], ["Casu", 85, []], ["Casu axedu o Frue", 85, []], ["Casu becciu", 85, []], ["Casu cundh\xEDdu", 85, []], ["Casu de cabreddu", 85, []], ["Casu friscu", 85, []], ["Casu marzu", 100, ["Casu martzu"]], ["Casu modde", 85, []], ["Casu spiattatu", 85, []], ["Cathare", 85, []], ["Cathedral City Cheddar", 60, []], ["Catupiry", 85, []], ["Cavrin (Cevrin) di Coazze", 85, []], ["Cazelle de Saint Affrique", 85, []], ["\xC7erkes peyniri", 85, []], ["\xC7erkez F\xFCme", 85, []], ["Cesio", 85, []], ["Chabichou de Pitou", 85, []], ["Chabicou du Poitou", 85, []], ["Chabri stagionato", 85, []], ["chaka", 85, []], ["chal", 85, []], ["Chamois d'Or", 85, []], ["Chanco", 85, []], ["Chaorce", 85, []], ["Chaource", 85, []], ["Chaque\xF1o", 85, []], ["Charbonet", 85, []], ["Charkassiye", 85, []], ["Chaumes cheese", 85, []], ["Chavignol", 85, []], ["Chechil", 85, []], ["Cheddar", 10, []], ["cheese", 30, []], ["Cheese curds", 85, []], ["cheese product", 30, []], ["chena", 85, []], ["Cherni Vit", 85, []], ["Cherz", 85, []], ["Cheshire", 60, []], ["Cheshire Blue", 60, []], ["Chevington", 85, []], ["ch\xE8vre", 85, []], ["Ch\xE8vre Metsovou", 85, []], ["Chevrotin", 85, []], ["Chhena", 85, []], ["Chhurpi", 85, []], ["Chiapas cheese", 85, []], ["chickna", 85, []], ["Chihuahua cheese", 60, []], ["Chimay", 85, []], ["Chloro", 85, []], ["chortan", 85, []], ["Chulchoill", 85, []], ["Chura kampo", 85, []], ["Chura loenpa", 85, []], ["Churul", 85, []], ["Chyorny Altai", 85, []], ["Ciabutin", 85, []], ["Ciambella all'Aglio", 85, []], ["Cimbro", 85, []], ["Cingherlino", 85, []], ["circassian", 85, ["Circassian Cheese"]], ["Civil", 30, []], ["clabber", 85, []], ["clotted cream", 85, []], ["Cofanetto", 85, []], ["\xC7\xF6kelek", 85, []], ["Colby", 60, []], ["Colby-Jack", 60, []], ["Comelico", 85, []], ["\xC7\xF6mlek", 85, []], ["Comt\xE9", 85, []], ["Conciato romano", 85, []], ["Contrin", 85, []], ["Coolea Cheese", 85, []], ["Cooleeney Farmhouse Cheese", 85, []], ["Coquetdale", 85, []], ["Corkotta", 85, []], ["Cornish Blue", 60, []], ["Cornish Brie", 85, []], ["Cornish Pepper", 60, []], ["Cornish Yarg", 85, []], ["Cosacavaddu ibleo", 85, []], ["Costa d'Oro", 85, []], ["Cotherstone", 85, []], ["Cotija cheese", 85, []], ["Cotswold", 85, []], ["Cottage cheese", 10, []], ["Cougar Gold", 60, []], ["Coulommiers", 85, []], ["Coutances", 85, []], ["Coverdale", 85, []], ["Crava", 85, []], ["Cream cheese", 10, []], ["Creamy Lancashire", 60, []], ["Creeny", 85, []], ["Crema", 85, []], ["Crema del Cuc", 85, []], ["Crema del Friuli", 85, []], ["Crema del Gerrei", 85, []], ["Crema di Fobello capra", 85, []], ["Cr\xE8me fra\xEEche", 85, []], ["Cremoso cheese", 85, []], ["Creole cream cheese", 85, []], ["Crescenza", 85, []], ["Criollo", 85, ["Criollo cheese"]], ["Croghan", 85, []], ["Croglin", 85, []], ["Crottin de Chavignol", 85, []], ["Crottino al tartufo", 85, []], ["Crowdie", 85, []], ["Crozier Blue", 85, []], ["Crucolo", 85, []], ["Crutin", 85, []], ["Cuajada", 85, []], ["Cuc", 85, []], ["Cuincir", 85, []], ["Cuor", 85, []], ["Cuor di Neve", 85, []], ["Cuor di Valle", 85, []], ["Cuoricino pagina", 85, []], ["Cup cheese", 30, []], ["curd snack", 85, []], ["Cusi\xE8", 85, []], ["D'ora ligure", 85, []], ["daanedaar", 85, []], ["dahi", 85, []], ["Dahi chhena", 85, []], ["daigo", 85, []], ["daigo-mi", 85, []], ["Danablu", 85, []], ["Danbo", 85, []], ["Danilovsky", 85, []], ["Danish Blue", 60, []], ["Darraghetto di Viareggio", 85, []], ["Daru", 85, []], ["Davidstow Cheddar", 85, []], ["Degli Albanesi", 85, []], ["Del Colle", 85, []], ["D\xE9lice de Bourgogne", 85, []], ["D\xE9lice du Calvados", 85, []], ["Delizia del Colle", 85, []], ["Derby", 30, []], ["Desmond", 60, []], ["Devero", 85, []], ["Devon Blue", 60, []], ["Dhahi", 85, []], ["Dhaunro", 85, []], ["Dickmilch", 85, []], ["Dil", 85, []], ["Dilliskus", 85, []], ["Dimsi", 85, []], ["Djath i bardh\xEB", 85, []], ["Dobbiaco", 85, []], ["Dobrodar", 85, []], ["dohi", 85, []], ["doi", 60, []], ["Dolce Isola misto", 85, []], ["Dolce sardo", 85, []], ["Dolcelatte", 85, []], ["Dolcezza d'Asiago", 85, []], ["Dolomiti", 85, []], ["domiati", 85, []], ["Domya\u1E6Di", 85, []], ["Doolin", 85, []], ["Dorogobuzhsky", 85, []], ["Dorozhny", 85, []], ["Dorset Blue Vinney", 85, []], ["Dorstone", 85, []], ["Double Gloucester", 60, []], ["Dovedale", 85, []], ["Drumlin", 85, []], ["Dubliner", 85, []], ["Duddleswell", 85, []], ["Due latti quadrotta delle Langhe", 85, []], ["Duhallow", 85, []], ["Dunbarra", 85, []], ["Dunlop Cheese", 85, []], ["Dunsyre Blue", 85, []], ["Dziugas", 85, []], ["Edam", 85, []], ["Edamski", 85, []], ["\xC9del de Cl\xE9ron", 85, []], ["Edelpilzk\xE4se", 85, []], ["Edirne", 85, []], ["ela-ghitel", 85, []], ["Emmental", 85, []], ["Emmental de Savoie", 85, []], ["Emmental fran\xE7ais est-central", 85, []], ["Emmentaler", 85, []], ["Enredo", 85, []], ["\xC9poisses de Bourgogne", 85, []], ["erbo", 85, []], ["Erborinato", 85, []], ["Erborinato di Artavaggio", 85, []], ["Erborinato di capra", 85, []], ["Erborinato di monte", 85, []], ["Erborinato di pecora delle Alpi Cozzie", 85, []], ["Ericino", 85, []], ["Escarun di pecora", 85, []], ["Esrom", 85, []], ["etorki", 85, []], ["Exmoor Blue", 85, []], ["Explorateur", 85, []], ["Ezine", 85, []], ["Falagnone", 85, []], ["Farci-Provola", 85, []], ["Farmer cheese", 60, []], ["Farmhouse Llanboidy", 85, []], ["Fatul\xEC della Val Saviore", 85, []], ["Felciata di Calabria", 85, []], ["Feta", 10, []], ["Fiacco di capra", 85, []], ["fil", 60, []], ["filbunke", 85, []], ["filmjolk", 85, []], ["Finnish Squeaky Cheese", 85, []], ["Fior di latte", 85, []], ["Fior di latte laziale", 85, []], ["Fior di monte", 85, []], ["Fiordivalle", 85, []], ["Fiore sardo", 85, []], ["Fiore sicano", 85, []], ["Fioreta", 85, []], ["Fiorone della Valsassina", 85, []], ["Fiurit", 85, []], ["Flors", 85, []], ["Flower of Rajya", 85, []], ["Fod\xF2m", 85, []], ["Fonduta", 85, []], ["Fonduta savoiarda", 85, []], ["Fontal", 85, []], ["Fontina", 85, []], ["Formadi", 85, []], ["Formadi salat", 85, []], ["Formaela", 85, []], ["Formag lait brusc", 85, []], ["Formaggela della Val di Sabbia", 85, []], ["Formaggella", 85, []], ["Formaggella del Bec", 85, []], ["Formaggella del Luinese", 85, []], ["Formaggella dell'Adamello", 85, []], ["Formaggella della Val Brembana", 85, []], ["Formaggella della Val Camonica", 85, []], ["Formaggella della Val di Scalve", 85, []], ["Formaggella della Val Seriana", 85, []], ["Formaggella della Val Trompia", 85, []], ["Formaggella di caglio", 85, []], ["Formaggella tremosine", 85, []], ["Formaggella uso monte", 85, []], ["Formaggella Valcavallina", 85, []], ["Formaggello spazzacamino", 85, []], ["Formaggetta", 85, []], ["Formaggetta della Valle Argentina", 85, []], ["Formaggetta di Bonassola", 85, []], ["Formaggetta di mucca", 85, []], ["Formaggetta di Stella San Giovanni", 85, []], ["Formaggetta savonese", 85, []], ["Formaggina", 85, []], ["Formaggio", 85, []], ["Formaggio a crosta rossa", 85, []], ["Formaggio agordino di malga", 85, []], ["Formaggio Alta Pusteria", 85, []], ["Formaggio Bastardo del Grappa", 85, []], ["Formaggio caprino d'alpeggio", 85, []], ["Formaggio caprino del Cilento", 85, []], ["Formaggio caprino della Limina", 85, []], ["Formaggio coi vermi", 85, []], ["Formaggio d'alpe", 85, []], ["Formaggio d'alpeggio di Triora", 85, []], ["Formaggio da spalmare", 85, []], ["Formaggio dei Zaccuni", 85, []], ["Formaggio del cit", 85, []], ["Formaggio del fieno", 85, []], ["Formaggio del Gleno", 85, []], ["Formaggio del monte", 85, []], ["Formaggio delle Langue o Trifulin", 85, []], ['Formaggio di "caso"', 85, []], ["Formaggio di capra", 85, []], ["Formaggio di capra a pasta molle", 85, []], ["Formaggio di capra di Calabria", 85, []], ["Formaggio di colostro ovino", 85, []], ["Formaggio di Fossa", 85, []], ["Formaggio di malga dei 7 comuni", 85, []], ["Formaggio di Menconico", 85, []], ["Formaggio di montagna", 85, []], ["Formaggio di montagna di Sesto", 85, []], ["Formaggio di montagna friulano", 85, []], ["Formaggio di pecora o capra a pasta pressata", 85, []], ["Formaggio di S. Stefano di Quisquina", 85, []], ["Formaggio fiore", 85, []], ["Formaggio in crema", 85, []], ["Formaggio pecorino di Atri", 85, []], ["Formaggio Piave", 85, []], ["Formaggio pressato", 85, []], ["Formaggio salato o Asino", 85, []], ["Formaggio saltarello", 85, []], ["Formaggio semigrasso d'alpe", 85, []], ["Formaggio ubriaco", 85, []], ["Formaggio Val Seriana", 85, []], ["Formaggiola caprina", 85, []], ["Formaggiu ri capra", 85, []], ["Formai", 85, []], ["Formai de Livign", 85, []], ["Formai de Mut", 85, []], ["Formai de Mut dell'Alta Valle Brembana", 85, []], ["Formaio embriago", 85, []], ["Formandi frant", 85, []], ["Formatge de l'Alt Urgell i la Cerdanya", 85, []], ["Formatge de la Garrotxa", 85, []], ["Formatge llenguat", 85, []], ["Formatge pallar\xE8s", 85, []], ["Formatge serrat", 85, []], ["Formazza", 85, []], ["Formella del Friuli", 85, []], ["Fourme d'Ambert", 85, []], ["Fourme de Cantal", 85, []], ["Fourme de Montbrison", 85, []], ["Frachet", 85, []], ["Fresa", 85, []], ["Frico balacia - Friuli Venezia Giulia", 85, []], ["fromage \xE0 la pie", 85, []], ["Fromage blanc", 85, []], ["Fromager d'Affinois", 85, []], ["Froumaela Valmandouras", 85, []], ["Frue", 85, []], ["Furmaggitt di Montevecchia", 85, []], ["Furmaggiu du quagliu", 85, []], ["Furmai", 85, []], ["Furmai del sieur Mario", 85, []], ["Furmai mar\xE7\xE8t", 85, []], ["Fynbo", 85, []], ["gaimar", 85, []], ["Galbanino", 85, []], ["Gallybagger", 85, []], ["Galotyri", 85, []], ["Gamalost", 85, []], ["Gaperon", 85, []], ["Garda Tremosine", 85, []], ["Garstang Blue", 85, []], ["gatyk", 85, []], ["Gauda", 85, []], ["\u0120bejna", 85, []], ["Geitost", 85, []], ["gelato", 85, []], ["Gelundener K\xE4se", 85, []], ["Gevrik", 85, []], ["geymar", 85, []], ["ghee", 85, []], ["ghi", 85, []], ["ghio", 85, []], ["ghrta", 85, []], ["ghyu", 85, []], ["Giacobin de Zena", 85, []], ["gibna beyda", 85, []], ["Giganti", 85, []], ["Giglio sardo", 85, []], ["Gineprino", 85, []], ["Gingherlino", 85, []], ["Gioda", 85, []], ["Gioddu", 85, []], ["Giunc\xE0", 85, []], ["Giuncata", 85, []], ["gjetost", 85, []], ["Gleann Oir", 85, []], ["Glebe Brethan", 85, []], ["Gloucester", 60, []], ["goat cheese", 60, []], ["Golandsky", 85, []], ["Golden Cross", 30, []], ["Go\u0142ka", 85, []], ["Gorga Ciccarelli Viareggio", 85, []], ["Gorgonzola", 85, []], ["Gorgonzola a due paste", 85, []], ["Gorgonzola bresciano", 85, []], ["Gorgonzola con la coda", 85, []], ["Gorgonzola tipo picchante", 85, []], ["Gornoaltaysky", 85, []], ["Gortnamona", 85, []], ["Gotland Blau", 85, []], ["Gotland Blue", 85, []], ["Gouda", 10, []], ["Goudse kaas", 85, []], ["Goya", 85, []], ["gr\xE4ddfil", 85, []], ["Gran cacio di Morolo", 85, []], ["Grana", 85, []], ["Grana Calabrese", 85, []], ["Grana Padano", 85, []], ["Grana Trentino", 85, []], ["Grande Vecchio di Montefollonico", 85, []], ["Granone Lodigiano", 85, []], ["Grappino", 85, []], ["Grasso d'alpe", 85, []], ["Grauk\xE4se", 85, []], ["Grauk\xE4se della Valle Aurina", 85, []], ["Graviera", 85, []], ["Gravyer", 85, []], ["greek yogurt", 60, []], ["Gresal", 85, []], ["Grev\xE9", 85, []], ["Greyerzer", 85, []], ["grietin\u0117", 85, []], ["Groviera La Leonessa", 85, []], ["Gruth Dhu", 85, []], ["Gruy\xE8re", 85, []], ["Gryficki", 85, []], ["Grynost", 85, []], ["Guayan\xE9s", 85, []], ["Gubbeen", 85, []], ["Guda", 85, []], ["Gudbrandsdalsost", 85, []], ["gurt", 85, []], ["Guttus di pecora grossetano", 85, []], ["Gvina Levana", 85, []], ["halloumi", 30, []], ["H\xE2l\xFBmi", 85, []], ["Handk\xE4se", 85, []], ["Harbourne Blue", 85, []], ["Harlech", 85, []], ["Harzer", 85, []], ["Hauskyjza", 85, []], ["Havarti", 85, []], ["Hellim", 85, []], ["Hereford Hop", 85, []], ["Herrg\xE5rdsost", 85, []], ["Herve", 85, []], ["Hibernia", 85, []], ["Hirtenk\xE4se", 85, []], ["Hoch Pustertaler", 85, []], ["H\xF6f\xF0ingi", 85, []], ["Hohenheim", 85, []], ["Hoop cheese", 60, []], ["Huntsman", 85, []], ["Hush\xE5llsost", 85, []], ["Hytteost", 85, []], ["Imeruli", 85, []], ["Imokilly Regato", 85, []], ["Imsil", 85, []], ["Inca Volata", 85, []], ["Ircano", 85, []], ["Isle of Mull", 85, []], ["Isle of Wight Blue", 60, []], ["Italico", 85, []], ["izvara", 85, []], ["Jameed", 85, []], ["J\u0101\u0146u siers", 85, []], ["Jarlsberg", 85, []], ["Jasperino lombardo", 85, []], ["Jibne Khadra", 85, []], ["Jibneh Arabieh", 85, []], ["Jiho\u010Desk\xE1 Niva", 85, []], ["Jiho\u010Desk\xE1 Zlat\xE1 Niva", 85, []], ["jocoque", 85, []], ["Joghurt", 85, []], ["jonches", 85, []], ["juht\xFAr\xF3", 85, []], ["junket", 85, []], ["ka\u010Dkavalj", 85, []], ["Ka\xE7kavalli", 85, []], ["Kadchgall", 85, []], ["kaimak", 85, []], ["Kajmak", 85, []], ["kajmarak", 85, []], ["kalari", 85, []], ["Kalathaki", 85, []], ["Kalathotos", 85, []], ["kamats matzoon", 85, []], ["Karikeftos", 85, []], ["Karish", 85, []], ["kars gravyer", 85, []], ["ka\u015Far", 85, []], ["ka\u015Fer", 85, []], ["kashk", 85, []], ["Kashkaval", 85, []], ["Kashkawan", 85, []], ["ka\u015Fkaval", 85, []], ["Kasseri", 85, []], ["katik", 85, []], ["Katiki", 85, []], ["kat\u0131k ke\u015Fi", 85, []], ["Kaymak", 85, []], ["Ke\xE7i peyniri", 85, []], ["keefir", 85, []], ["Kefalograviera", 85, []], ["kefalotiri", 85, []], ["Kefalotyri", 85, []], ["kefir", 30, []], ["keimach", 85, []], ["Kelle peyniri", 85, []], ["kemez", 85, []], ["Kenafa", 85, []], ["kephir", 85, []], ["kermaviili", 85, []], ["Kerry Blue", 60, []], ["kesk", 85, []], ["Keso", 85, []], ["Kesong puti", 85, []], ["khlari", 85, []], ["khoa", 85, []], ["Kiba torinese", 85, []], ["Kidderton Ash", 85, []], ["Kilcummin", 85, []], ["kimis", 85, []], ["kimiz", 85, []], ["Kirlihan\u0131m", 85, []], ["kisela pavlaka", 85, []], ["kiselo mlyako", 85, []], ["kiselo vrhnje", 85, []], ["klari", 85, []], ["kohuke", 85, []], ["kohupiim", 85, []], ["komijnekaas", 85, []], ["Kopanisti", 85, []], ["Kopanisti Mykonou", 85, []], ["Korall", 85, []], ["Korb\xE1\u010Dik", 85, []], ["Korb\xE1\u010Diky", 85, []], ["korot", 85, []], ["K\u0151r\xF6z\xF6tt", 85, []], ["Kortowski", 85, []], ["Koryci\u0144ski", 85, []], ["Kostromskoy", 85, []], ["koumis", 85, []], ["Krasotyri", 85, []], ["Kravsk\xE1 hrudka", 85, []], ["K\xFCfl\xFC", 85, []], ["kulfi", 85, []], ["kuminost", 85, []], ["kumis", 85, []], ["kumiss", 85, []], ["K\xFCp", 85, []], ["kurt", 60, []], ["kuru yo\u011Furt", 85, []], ["kurut", 85, []], ["kvarg", 85, []], ["kvark", 85, []], ["Kwaito", 85, []], ["kwark", 85, []], ["L'Etivaz", 85, []], ["La Res", 60, []], ["Labnah", 85, []], ["Labne", 85, []], ["Labneh", 85, []], ["lac concretum", 85, []], ["Lacarian", 85, []], ["Ladenios", 85, []], ["Ladotyri", 85, []], ["Laguiole", 85, []], ["Lanark Blue", 85, []], ["Lancashire", 60, []], ["Lancashire Crumbly", 85, []], ["Langres", 85, []], ["Languiole", 85, []], ["Lappi", 85, []], ["Latvijas", 85, []], ["Lavistown", 85, []], ["Lavort", 85, []], ["Le Wavreumont", 85, []], ["Lechicki", 85, []], ["Leerdammer", 85, []], ["Leidse kaas", 85, []], ["Leip\xE4juusto", 85, []], ["Leyden", 85, []], ["Liederkranz", 85, []], ["Lighvan", 85, []], ["Liliput", 85, []], ["Limburger", 85, []], ["Lincolnshire Poacher", 85, []], ["Lingallin", 85, []], ["Liptauer", 85, []], ["Liptauer triestino", 85, []], ["Little Derby", 60, []], ["Little Wallop", 85, []], ["Livarot", 85, []], ["Livno", 85, []], ["Lor", 85, []], ["Lowerdale Goats Cheese", 85, []], ["\u0141owicki", 85, []], ["Lubuski", 85, []], ["L\xFCneberg", 85, []], ["Lymeswold", 85, []], ["maas", 85, []], ["Maasdam", 85, []], ["Maaslander", 85, []], ["Macagn", 85, []], ["Maccagnetta alle erbe", 85, []], ["Maccagnetta alle noci", 85, []], ["Maccagno", 85, []], ["Mac\xF4nnais", 85, []], ["Madonie Provola", 85, []], ["Magerquark", 85, []], ["Maggot cheese", 85, []], ["Magnocca", 85, []], ["Magro di latteria", 85, []], ["Magro di piatta", 85, []], ["Maighean", 85, []], ["Maiorchino", 85, []], ["Maiorchino di Novara di Sicilia", 85, []], ["Maish Krej", 85, []], ["Majdoule", 85, []], ["malai", 85, []], ["Malaka", 85, []], ["Malga", 85, []], ["Malga altopina o dei Sette Comuni", 85, []], ["Malga bellunese", 85, []], ["Malga Fane", 85, []], ["Malga o Ugovizza", 85, []], ["Malga stagionato nelle vinacce", 85, []], ["Malga Stelvio", 85, []], ["man shanu", 85, []], ["Manoura Sifnou", 85, []], ["Manouri", 85, []], ["Manteca", 85, []], ["Manyas", 85, []], ["maquee", 85, []], ["Maredsous", 85, []], ["Maria provolone di Potenza", 85, []], ["Maroilles", 85, []], ["Marolles", 85, []], ["Marzemino", 85, []], ["Marzolina", 85, []], ["Marzolino", 85, []], ["Marzolino del Chianti", 85, []], ["Marzolino di Lucardo", 85, []], ["Marzotica", 85, []], ["Mascarpa", 85, []], ["Mascarpin de la Calza", 85, []], ["Mascarpone", 85, []], ["Mascarpone di bufala", 85, []], ["Mascarpone di bufala di Battipaglia", 85, []], ["Mascarpone torta", 85, []], ["m\xE2st chekide", 85, []], ["Mastela", 85, []], ["Mastelo", 85, []], ["Mat\xF3", 85, []], ["matsoni", 85, []], ["Mattone", 85, []], ["Mattonella al rosmarino", 85, []], ["Matusc", 85, []], ["matzoon", 85, []], ["Maytag Blue", 85, []], ["Mazurski", 85, []], ["Medynsky", 85, []], ["Meekiri", 85, []], ["meesjuusto", 85, []], ["Melichloro", 85, []], ["Menonita", 85, []], ["mesost", 85, []], ["messm\xF6r", 85, []], ["Metsovella", 85, []], ["Metsovone", 85, []], ["Mezzapasta", 85, []], ["Mihali\xE7 peyniri", 85, []], ["Milbenk\xE4se", 85, []], ["mileram", 85, []], ["milk skin", 30, []], ["Millefoglie all'aceto balsamico", 85, []], ["Mimolette", 60, []], ["Minas", 85, []], ["Mine-gabhar", 85, []], ["minyak samin", 85, []], ["minyak sapi", 85, []], ["Mish", 85, []], ["Misto", 85, []], ["Misto capra", 85, []], ["Misto capra di malga", 85, []], ["Misto pecora fresco dei Berici", 85, []], ["Mizithra", 85, []], ["Moale", 85, []], ["Moesin di Fregona", 85, []], ["Mohant", 85, []], ["Molbo", 85, []], ["Mollana della Val Borbera", 85, []], ["Moncenisio", 85, []], ["Mondseer", 85, []], ["Mont Blanc", 60, []], ["Mont des Cats", 60, []], ["Montafoner Sauerk\xE4se", 85, []], ["Montagna", 85, []], ["Montanello", 85, []], ["Montasio", 85, []], ["Monte Veronese", 85, []], ["Monte Veronese d\u2019allevo", 85, []], ["Monte Veronese latte intero", 85, []], ["Mont\xE9bore", 85, []], ["Montegranero", 85, []], ["Monterey Jack", 60, []], ["Moose cheese", 60, []], ["Morbier", 85, []], ["Morello", 85, []], ["Morl\xE2c", 85, []], ["Morlacco", 85, []], ["Morlacco di Grappa", 85, []], ["Mortar\xE0t", 85, []], ["Mortar\xE0t Ciambella aromatica", 85, []], ["Mortrett", 85, []], ["Mosaru", 85, []], ["Moskovsky", 85, []], ["Motal", 85, []], ["Motel\xEC", 85, []], ["Motta", 85, []], ["Mottolina", 85, []], ["Mottolino", 85, []], ["Mozzarella", 10, ["Mozzarella cheese"]], ["Mozzarella di bufala campana", 85, []], ["Muenster", 85, []], ["Munster", 60, []], ["Munster-G\xE9rom\xE9", 85, []], ["Murazzano", 85, []], ["Murianengo", 85, []], ["mursik", 85, []], ["Mursin", 85, []], ["Murtarat", 85, []], ["Murtret", 85, []], ["Musulupu", 85, []], ["Mutschli", 85, []], ["myseost", 85, []], ["mysingur", 85, []], ["mysost", 85, []], ["mysuostur", 85, []], ["Myzithra", 85, []], ["Nano\u0161ki", 85, []], ["narskujuusto", 85, []], ["N\u0103sal", 85, []], ["Neufch\xE2tel", 85, []], ["Nevegal", 85, []], ["ney", 85, []], ["neyy", 85, []], ["neyyi", 85, []], ["Nguri", 85, []], ["Niolo", 85, []], ["Nis", 85, []], ["niur\u016D", 85, []], ["Nocciolino di ceva", 85, []], ["N\xF6kkelost", 85, []], ["N\xF8kkelost", 85, []], ["Norvegia", 85, []], ["Nostrale d'alpe", 85, []], ["Nostrano", 85, []], ["Nostrano d'alpe", 85, []], ["Nostrano de cas\xE8l", 85, []], ["Nostrano del Primiero", 85, []], ["Nostrano della Val di Fassa", 85, []], ["Nostrano di Costalta", 85, []], ["Nostrano di Crodo", 85, []], ["Nostrano di latteria", 85, []], ["Nostrano di malga", 85, []], ["Nostrano di malga trentino", 85, []], ["Nostrano Fiav\xE9", 85, []], ["Nostrano grasso", 85, []], ["Nostrano misto capra", 85, []], ["Nostrano prealpino", 85, []], ["Nostrano semigrasso", 85, []], ["Nostrano Valchiese", 85, []], ["Nostrano Valtrompia", 85, []], ["Nusnetto bresciano", 85, []], ["Oakwood", 85, []], ["Oaxaca cheese", 85, []], ["O\xE1zis", 85, []], ["Obatzda", 85, []], ["Obruk", 85, []], ["Olivet cendr\xE9", 85, []], ["Olomouck\xE9 syre\u010Dky", 85, []], ["Oltermanni", 85, []], ["Omichka", 85, []], ["Orda", 85, []], ["\xD6rg\xFC", 85, []], ["Orla Cheese", 85, []], ["Ormea", 85, []], ["Orrengigo di Pistoia", 85, []], ["Ortler", 85, []], ["Oscypek", 85, []], ["Ossau-Iraty", 85, []], ["Ossolano d'alpe", 85, []], ["O\u0161tiepok", 85, []], ["Ostrica di montagna", 85, []], ["Oszczypek", 85, []], ["Otlu", 85, []], ["Ov\u010Dia hrudka", 85, []], ["Oxford Blue", 30, []], ["Paddraccio", 85, []], ["Padduni", 85, []], ["Paddy Jack Cheese", 60, []], ["Paglierina", 85, []], ["Paglierina apassitta", 85, []], ["Paglierina di rifreddo", 85, []], ["Paglietta", 85, []], ["Paglietta delle Langhe", 85, []], ["Paglietta piemontese", 85, []], ["Pallone di Gravina", 85, []], ["P\xE1lpusztai", 85, []], ["Pampanella", 85, []], ["Pancette", 85, []], ["Paneer", 60, []], ["Pannarello", 85, []], ["Pannerone Lodigiano", 85, []], ["Panquehue", 85, []], ["Parenica", 85, []], ["Parmesan", 10, []], ["Parmigiano-Reggiano", 85, []], ["Parrano", 85, []], ["Pa\u0161ki sir", 85, []], ["Passendale", 85, []], ["Pasta filata", 85, []], ["pasteurized process cheese", 85, []], ["pasteurized process cheese food", 85, []], ["pasteurized process cheese spread", 85, []], ["Pastore", 85, []], ["Pastorella del Cerreto di Sorano", 85, []], ["Pastorino", 85, []], ["Pecora", 85, []], ["Pecoricco", 85, []], ["Pecorino", 85, []], ["Pecorino a crosta fiorita", 85, []], ["Pecorino baccellone", 85, []], ["Pecorino bagnolese", 85, []], ["Pecorino brindisino", 85, []], ["Pecorino d'Abruzzo", 85, []], ["Pecorino dei Berici", 85, []], ["Pecorino del Casentino", 85, []], ["Pecorino del Parco di Migliarino", 85, []], ["Pecorino della costa apuana", 85, []], ["Pecorino della Garfagnana", 85, []], ["Pecorino della Lunigiana", 85, []], ["Pecorino della Versilia", 85, []], ["Pecorino delle balze volterrane", 85, []], ["Pecorino di Carmasciano", 85, []], ["Pecorino di Farindola", 85, []], ["Pecorino di Filiano", 85, []], ["Pecorino di Garfagnina", 85, []], ["Pecorino di Moliterno", 85, []], ["Pecorino di montagna", 85, []], ["Pecorino di Osilo", 85, []], ["Pecorino di Pian di Vas", 85, []], ["Pecorino di Pienza stagionato", 85, []], ["Pecorino di Romagna", 85, []], ["Pecorino fiorone", 85, []], ["Pecorino foggiano", 85, []], ["Pecorino leccese", 85, []], ["Pecorino lucano", 85, []], ["Pecorino Monte Re", 85, []], ["Pecorino romano", 85, []], ["Pecorino rosso volterrano", 85, []], ["Pecorino sardo", 85, []], ["Pecorino senese", 85, []], ["Pecorino siciliano", 85, []], ["Pecorino stagionato in foglie di noce", 85, []], ["Pecorino subasio", 85, []], ["Pecorino toscano", 85, []], ["Pecorino umbro", 85, []], ["Pecorino veneto", 85, []], ["P\xE9lardon", 85, []], ["Pepato", 85, []], ["Pepper Jack", 60, []], ["Peretta", 85, []], ["Perlanera", 85, []], ["perugu", 85, []], ["Petroti", 85, []], ['Pettirosso "Tipo Norcia"', 85, []], ["Piacentinu di Enna or Piacentino ennese", 85, []], ["Piacentinu or Piacentino", 85, []], ["Piattone", 85, []], ["Piave", 85, []], ["Piave Fresco", 85, []], ["Piave Mezzano", 85, []], ["Piave Vecchio", 85, []], ["Piave Vecchio Riserva", 85, []], ["Piave Vecchio Selezione Oro", 85, []], ["Pichtogalo Chanion", 85, []], ["Picodon de l'Ard\xE9che", 85, []], ["Pic\xF3n Bejes-Tresviso", 85, []], ["Piddiato", 85, []], ["Pierino", 85, []], ["Pikantny", 85, []], ["Pinconning", 85, []], ["Pioda S.Maria", 85, []], ["Piodino", 85, []], ["Piramide", 85, []], ["Piramide di capra", 85, []], ["Piramide in foglia", 85, []], ["Pirittas", 85, []], ["Piscedda", 85, []], ["Planinski", 85, []], ["plattekaas", 85, []], ["Poina enfumegada", 85, []], ["Pojna enfumegada", 85, []], ["Poligny-Saint-Pierre", 85, []], ["Pont-l'\xC9v\xE9que", 85, []], ["Port Salut", 85, []], ["Poshekhonsky", 85, []], ["Pr\xE4stost", 85, []], ["Pratolina", 85, []], ["Prescinseua", 85, []], ["Presolana-Valseriana", 85, []], ["Pressato", 85, []], ["Prim", 85, []], ["Prima Donna", 60, []], ["Primo sale", 85, []], ["Primolino", 85, []], ["Primusali", 85, []], ["processed cheese", 60, []], ["Provola", 85, []], ["Provola affumicata", 85, []], ["Provola affumicata di bufala", 85, []], ["Provola Capizzi", 85, []], ["Provola dei Monti Sicari", 85, []], ["Provola dei Nebrodi", 85, []], ["Provola delle Madonie", 85, []], ["Provola di bufala", 85, []], ["Provola ragusana", 85, []], ["Provola siciliana", 85, []], ["Provola silana", 85, []], ["Provole", 85, []], ["Provolone", 30, []], ["Provolone del Monaco", 85, []], ["Provolone piccante", 85, []], ["Provolone sardo", 85, []], ["Provolone siciliano", 85, []], ["Provolone Valpadana", 85, []], ["Provolone Vernengo", 85, []], ["Provula casale", 85, []], ["Przeworski", 85, []], ["Pule", 85, []], ["Pultost", 85, []], ["Pusteria", 85, []], ["Pustertaler", 85, []], ["Puzzone", 85, []], ["Puzzone Bochiotti", 85, []], ["Puzzone di Moena", 85, []], ["Puzzone Vandercaro", 85, []], ["pyetia", 85, []], ["pytia", 85, []], ["qatiq", 85, []], ["qeyma\u011F", 85, []], ["qimiz", 85, []], ["qort", 85, []], ["Quadro", 85, []], ["Quadro di capra", 85, []], ["Quadro provenzale", 85, []], ["Quagliata ligure", 85, []], ["Quartirolo Lombardo", 85, []], ["Queijo Canastra", 85, []], ["Queijo coalho", 85, []], ["Queijo Coboc\xF3", 85, []], ["Queijo de Col\xF4nia", 85, []], ["Queijo de Nisa", 85, []], ["Queijo do Pico", 85, []], ["Queijo do Serro", 85, []], ["Queijo Manteiga", 85, []], ["Queijo prato", 85, []], ["Queijo S\xE3o Jorge", 85, []], ["Queijo seco", 85, []], ["Queijo Serra da Estrela", 85, []], ["Queijo-do-Reino", 85, []], ["Quesa\xEDlla", 85, []], ["Quesillo", 85, []], ["Quesitos de Zuheros", 85, []], ["Queso Arz\xFAa-Ulloa", 85, []], ["Queso blanco", 85, []], ["Queso blanquet", 85, []], ["Queso Cabanillas", 85, []], ["Queso Cabrero", 85, []], ["Queso Campesino", 85, []], ["Queso Cas\xEDn", 85, []], ["Queso castellano", 85, []], ["Queso Chistab\xEDn", 85, []], ["Queso Coste\xF1o", 85, []], ["Queso Crema", 85, []], ["Queso crineja", 85, []], ["Queso Cuajada", 85, []], ["Queso de Aceh\xFAche", 85, []], ["Queso de Afuega el pitu", 85, []], ["Queso de \xC1liva", 85, []], ["Queso de Benabarre", 85, []], ["Queso de Biescas", 85, []], ["Queso de Brez", 85, []], ["Queso de Burgos", 85, []], ["Queso de Cabra Payoya", 85, []], ["Queso de Cabrales", 85, []], ["Queso de cazoleta", 85, []], ["Queso de cuajo", 85, []], ["Queso de El Burgo", 85, []], ["Queso de Flor de gu\xEDa", 85, []], ["Queso de Gamonedo", 85, []], ["Queso de Gamon\xE9u", 85, []], ["Queso de Gata-Hurdes", 85, []], ["Queso de la Gomera", 85, []], ["Queso de la Nucia", 85, []], ["Queso de La Palma", 85, []], ["Queso de La Peral", 85, []], ["Queso de La Serena", 85, []], ["Queso de la Siberia extreme\xF1a", 85, []], ["Queso de la Vera", 85, []], ["Queso de Lanzarote", 85, []], ["Queso de las Alpujarras", 85, []], ["Queso de Los Beyos", 85, []], ["Queso de los Pedroches", 85, []], ["Queso de Mah\xF3n", 85, []], ["Queso de Mallorca", 85, []], ["Queso de mano", 85, []], ["Queso de Murcia", 85, []], ["Queso de Murcia al vino", 85, []], ["Queso de Oropesa", 85, []], ["Queso de Pe\xF1amellera", 85, []], ["Queso de Radiquero", 85, []], ["Queso de Sah\xFAn", 85, []], ["Queso de servilleta", 85, []], ["Queso de Tetilla", 85, []], ["Queso de Tronch\xF3n", 85, []], ["Queso de Urbi\xE9s", 85, []], ["Queso del Ti\xE9tar", 85, []], ["Queso Echo y Ans\xF3", 85, []], ["Queso fresco", 85, []], ["Queso herre\xF1o", 85, []], ["Queso Ibores", 85, []], ["Queso Idiaz\xE1bal", 85, []], ["Queso Lesaca", 85, []], ["Queso Llanero", 85, []], ["Queso majorero", 85, []], ["Queso Manchego", 85, []], ["Queso Nata de Cantabria", 85, []], ["Queso Paipa", 85, []], ["Queso palmero", 85, []], ["Queso Palmita", 85, []], ["Queso Panela", 85, []], ["Queso Pa\xF1oleta", 85, []], ["Queso Patamulo", 85, []], ["Queso Ribaforada", 85, []], ["Queso Roncal", 85, []], ["Queso San Sim\xF3n da Costa", 85, []], ["Queso semiduro", 85, []], ["Queso telita", 85, []], ["Queso Torta de Potes", 85, []], ["Queso Tronch\xF3n", 85, []], ["Queso Urbasa", 85, []], ["Quesu Gamon\xE9u", 85, []], ["Quesucos de Li\xE9bana", 85, []], ["Queto", 85, []], ["qurut", 85, []], ["Q\u04D9zana a p\u04D9\u04D9ner", 85, []], ["Raclette", 85, []], ["Radamer", 85, []], ["Radden Blue", 85, []], ["Raejuusto", 85, []], ["Ragusano", 85, []], ["rahka", 85, []], ["Rahmjoghurt", 85, []], ["Ras", 60, []], ["Ras malai", 85, []], ["Raschera", 85, []], ["Raschera d'alpeggio", 85, []], ["Rasco", 85, []], ["Raspadura", 85, []], ["Rauchk\xE4se", 85, []], ["Ravaggiolo romagnolo", 85, []], ["Raveggiolo", 85, []], ["Raviggiolo", 85, []], ["Raviggiolo di pecora", 85, []], ["Raviggiolu", 85, []], ["Reblec de crama", 85, []], ["R\xE9bl\xE8que", 85, []], ["Reblo", 85, []], ["Rebl\xF2 alpino", 85, []], ["Reblo cremoso Valle Susa", 85, []], ["Reblochon", 85, []], ["Rebruchon", 85, []], ["Recuit", 85, []], ["Red Leicester", 60, []], ["Red Windsor", 60, []], ["Redyko\u0142ka", 85, []], ["Regato", 85, []], ["Reggianito", 85, []], ["Remoudou", 85, []], ["Renaico", 85, []], ["Ren\xE0z", 85, []], ["Requeij\xE3o", 85, []], ["Riavulillo", 85, []], ["Ribblesdale Blue Goat", 85, []], ["Ricotta", 30, []], ["Ricotta affumicata di Mammola", 85, []], ["Ricotta caprina friulana", 85, []], ["Ricotta di bufala", 85, []], ["Ricotta di bufala affumicata", 85, []], ["Ricotta di bufala infornata", 85, []], ["Ricotta di bufala salata", 85, []], ["Ricotta di fuscella", 85, []], ["Ricotta essiccata di bufala", 85, []], ["Ricotta forte", 85, []], ["Ricotta fresca di bufala", 85, []], ["Ricotta gentile", 85, []], ["Ricotta moliterna", 85, []], ["Ricotta mustia", 85, []], ["Ricotta pecorina Monte Re", 85, []], ["Ricotta romana", 85, []], ["Ricotta salata", 85, []], ["Ricotta siciliana", 85, []], ["Ricotta vaccina affumicata ossolana", 85, []], ["Ricottadi", 85, []], ["Rigatino di Castel San Pietro", 85, []], ["Rigotte de Condrieu", 85, []], ["Robiola", 85, []], ["Robiola Alta Langa", 85, []], ["Robiola bresciana", 85, []], ["Robiola Cavour", 85, []], ["Robiola contadina", 85, []], ["Robiola d'Alba al tartufo", 85, []], ["Robiola della nonna", 85, []], ["Robiola della Val Bormida", 85, []], ["Robiola della Valsassina", 85, []], ["Robiola delle Langhe", 85, []], ["Robiola di Bossolasco", 85, []], ["Robiola di Castel San Giovanni", 85, []], ["Robiola di Ceva o Mondov\xEC", 85, []], ["Robiola di Cocconato", 85, []], ["Robiola di Intropio", 85, []], ["Robiola di Montevecchia", 85, []], ["Robiola di pecora", 85, []], ["Robiola di Roccaverano", 85, []], ["Robiola di serosa", 85, []], ["Robiola La Rustica", 85, []], ["Robiola Monte Rosa", 85, []], ["Robiola piemontese classica", 85, []], ["Rocamadour", 85, []], ["Rochebarron", 85, []], ["Rodoric", 85, []], ["roghan-e heiw\xE2ni", 85, []], ["Rokpol", 85, []], ["Romadur", 85, []], ["Romita piemontese", 85, []], ["r\xF8mme", 85, []], ["Roomano", 85, []], ["Roquefort", 30, []], ["Rosa Camuna", 85, []], ["Rosh malai", 85, []], ["rossi", 60, []], ["Rossiysky", 85, []], ["Roue de Brielove", 85, []], ["Roumy", 85, []], ["rubing", 85, []], ["R\u016Bmi", 85, []], ["run-i dan", 30, []], ["Rushan", 85, []], ["Sack cheese", 60, []], ["Saga", 60, []], ["Sage Derby", 60, []], ["Sahnequark", 85, []], ["Saint Albray", 85, []], ["Saint Andr\xE9", 60, []], ["Saint-F\xE9licien", 85, []], ["Saint-Marcellin", 85, []], ["Saint-Nectaire", 85, []], ["Saint-Paulin", 85, []], ["Sainte-Maure de Touraine", 85, []], ["Sakura", 60, []], ["Salagnun", 85, []], ["Salamura", 85, []], ["Salato", 85, []], ["Salato duro friulano", 85, []], ["Salato morbido del Friuli", 85, []], ["Salers", 85, []], ["Salgnun", 85, []], ["Salignon", 85, []], ["Salignun", 85, []], ["Saloio", 85, []], ["Salondro di malga", 85, []], ["Salondro magro", 85, []], ["Salondro or Solandro", 85, []], ["Salva", 85, []], ["samna", 85, []], ["Sams\xF8 cheese", 85, []], ["San Michali", 85, []], ["San St\xE8", 85, []], ["Santar\xE9m", 85, []], ["Santo Stefano d'Aveto", 85, []], ["Sappada", 85, []], ["Sapsago", 85, []], ["Saras del F\xE8n", 85, []], ["Sarasso", 85, []], ["Sarazzu", 85, []], ["Sardo", 85, []], ["Sargnon", 85, []], ["Savello di Roma", 85, []], ["Sayas", 85, []], ["Sbrinz", 85, []], ["Scacione", 85, []], ["Scamorza", 85, []], ["Scamorza calabra", 85, []], ["Scamorza di bufala", 85, []], ["Scamorza molisana", 85, []], ["Schabziger", 85, []], ["Scheggia", 85, []], ["Schiz", 85, []], ["Schlander", 85, []], ["Scimuda d'alpe", 85, []], ["Scimudin", 85, []], ["Scimut", 85, []], ["Scodellato", 85, []], ["Scuete frante", 85, []], ["Scuete fumade", 85, []], ["Secondo sale", 85, []], ["Seirass", 85, []], ["Seirass del Fen", 85, []], ["Seirass del Lausun", 85, []], ["Seirass di latte", 85, []], ["Seirass di siero di pecora", 85, []], ["Seirass stagionato", 85, []], ["Selles-sur-Cher", 85, []], ["Semicotto", 85, []], ["Semicotto caprino", 85, []], ["Semicotto ovino", 85, []], ["Semitenero loiano", 85, []], ["Semuda", 85, []], ["Ser", 60, []], ["ser bia\u0142y", 85, []], ["Seras", 85, []], ["Ser\xE9", 85, []], ["Serniun", 85, []], ["Sfela", 85, []], ["Shandrum", 85, []], ["Shanklish", 85, []], ["Shelal", 85, []], ["Shosha", 85, []], ["shrikhand", 85, []], ["Shropshire Blue", 60, []], ["Shtalp", 85, []], ["shubat", 85, []], ["Sigarot", 85, []], ["Sigarot cenese", 85, []], ["Sigarot miele", 85, []], ["Sigarot naturale", 85, []], ["Silandro", 85, []], ["Silter", 85, []], ["Silter della Val Camonica", 85, []], ["Single Gloucester", 60, []], ["Sir iz mijeha", 85, []], ["Sirene", 85, []], ["skorup", 85, []], ["\u0160kripavac", 85, []], ["skyr", 60, []], ["Slovensk\xE1 bryndza", 85, []], ["Slovensk\xE1 parenica", 85, []], ["Slovensk\xFD o\u0161tiepok", 85, []], ["S\u0142upski ch\u0142opczyk", 85, []], ["Sm\xE2nt\xE2n\u0103", 85, []], ["Smear-ripened cheese", 85, []], ["smetana", 85, []], ["Smetankowyi", 85, []], ["Smoked Ardrahan", 85, []], ["Smoked cheese", 60, []], ["Smoked Gubbeen", 85, []], ["Smorzasoel", 85, []], ["Sn\xF8frisk", 85, []], ["so", 10, []], ["Soera", 85, []], ["Sola", 85, []], ["Sola della Valcasotto", 85, []], ["Sola stagionata", 85, []], ["Somerset Brie", 85, []], ["Sora", 85, []], ["Sora di pecora brigasca", 85, []], ["Sora tre latti", 85, []], ["Sorke", 85, []], ["Sot la Trape", 85, []], ["Sottocenere al tartufo", 85, []], ["sour cream", 60, []], ["Sovetsky", 85, []], ["Spal\xE8m", 85, []], ["Sperrin Blue", 85, []], ["Spessa", 85, []], ["Spress", 85, []], ["Spressa delle Giudicarie", 85, []], ["Squarquaglione dei Monti Lepini", 85, []], ["Squarquerone di Romagna", 85, []], ["squeaky cheese", 85, []], ["St Brendan", 60, []], ["St Gall", 60, []], ["St Kevin Brie", 85, []], ["St Killian", 85, []], ["Sta'el", 85, []], ["Staazer", 85, []], ["Stagionato de Vaise", 85, []], ["Stamatini", 85, []], ["Steirerk\xE4se", 85, []], ["Stella di mare", 60, []], ["Stelvi", 85, []], ["Sterzinger", 85, []], ["Stichelton", 85, []], ["Stilfser", 85, []], ["Stilton", 30, []], ["Stinking Bishop", 100, []], ["Stintino di Luino", 85, []], ["Stracchino", 85, []], ["Stracchino della Valsassina", 85, []], ["Stracchino di bufala", 85, []], ["Stracchino di Nesso", 85, []], ["Stracchino nostrano di Monte Bronzone", 85, []], ["Stracchino orobico", 85, []], ["Stracchino tipico", 85, []], ["Stracchino toscano", 85, []], ["Stracciata", 85, []], ["Stracciatella di bufala", 85, []], ["Strachet", 85, []], ["Strachitunt", 85, []], ["Strac\xF2n", 85, []], ["straggist\xF3 giao\xFArti", 85, []], ["strained yogurt", 60, []], ["Stretched curd", 85, []], ["Strica", 85, []], ["String cheese", 30, []], ["subag", 85, []], ["Suffolk Gold", 60, []], ["Sulguni", 85, []], ["s\u016Breliai", 85, []], ["surk", 85, []], ["Surke", 85, []], ["Sussex Slipcote", 85, []], ["suzme", 85, []], ["Svecia", 85, []], ["Sveciaost", 85, []], ["Swaledale", 85, []], ["Swiss cheese", 30, []], ["swojski", 85, []], ["Syr", 85, []], ["s\xFDr\xF0ur rj\xF3mi", 85, []], ["Tabor", 85, []], ["Taburet", 85, []], ["Taleggio", 85, []], ["Taleggio bergamasco", 85, []], ["Taleggio mandello lario", 85, []], ["Tandil", 85, []], ["Tara Ban", 60, []], ["Tarentais", 85, []], ["ta\u015F yo\u011Furt", 85, []], ["Tasty Lancashire", 60, []], ["tejf\xF6l", 85, []], ["Tekovsk\xFD sal\xE1mov\xFD syr", 85, []], ["Tel panir", 85, []], ["Teleme", 85, []], ["Tella Alto Adige", 85, []], ["Telli", 85, []], ["Tendaio", 85, []], ["Test\xF9n", 85, []], ["Test\xF9n ciuc", 85, []], ["Tesyn", 85, []], ["T\xEAte de Moine", 85, []], ["Teviotdale", 85, []], ["Thayir", 85, []], ["Thayiru", 85, []], ["Thomas Morgan", 30, []], ["Tilsit", 85, []], ["Tintern", 85, []], ["Tipo", 85, []], ["Tipo dolce", 85, []], ["Tipo fresco", 85, []], ["Tipo malga friulano", 85, []], ["Tipo stagionato", 85, []], ["Tirabuscion", 85, []], ["Tiroler Grauk\xE4se", 85, []], ["Tirolese", 85, []], ["Toblach", 85, []], ["Toblacher Stangenk\xE4se", 85, []], ["Tolminc cheese", 85, []], ["Toma", 85, []], ["Toma Ajgra", 85, []], ["Toma alpigiana", 85, []], ["Toma biellese", 85, []], ["Toma brusca", 85, []], ["Toma del bot", 85, []], ["Toma del lait brusc", 85, []], ["Toma del Maccagno", 85, []], ["Toma del Mottarone", 85, []], ["Toma del Pastore", 85, []], ["Toma della Bassa Val d'Aosta", 85, []], ["Toma della Valle di Susa", 85, []], ["Toma della Valle Stura", 85, []], ["Toma della Valsesia", 85, []], ["Toma di Balme", 85, []], ["Toma di Boves", 85, []], ["Toma di capra", 85, []], ["Toma di capra d'alpeggio", 85, []], ["Toma di Celle", 85, []], ["Toma di Elva", 85, []], ["Toma di Gressoney", 85, []], ["Toma di Lanzo", 85, []], ["Toma di Mendatica", 85, []], ["Toma di Pragelato", 85, []], ["Toma di Valgrisenche", 85, []], ["Toma lucana", 85, []], ["Toma of Basilicata", 85, []], ["Toma ossolana", 85, []], ["Toma ossolana al prunent", 85, []], ["Toma ossolana d'alpeggio", 85, []], ["Toma ossolana di casa", 85, []], ["Toma ovicaprina", 85, []], ["Toma piemontese", 85, []], ["Toma Valle Pelice", 85, []], ["Tombea", 85, []], ["Tometta", 85, []], ["Tometta al barolo", 85, []], ["Tometta di Barge", 85, []], ["Tometta Monte Ciuc", 85, []], ["Tometta Valle Elvo", 85, []], ["Tometto", 85, []], ["Tomini di Bollengo e del Talucco", 85, []], ["Tomino", 85, []], ['Tomino "Montoso"', 85, []], ["Tomino canavesano asciutto", 85, []], ["Tomino canavesano fresco", 85, []], ["Tomino da padella", 85, []], ["Tomino del bec", 85, []], ["Tomino del boscaiolo", 85, []], ["Tomino del bot", 85, []], ["Tomino del mel", 85, []], ["Tomino del Talucco", 85, []], ["Tomino delle Valli Saluzzesi", 85, []], ["Tomino di Andrate", 85, []], ["Tomino di Bosconero", 85, []], ["Tomino di Casalborgone", 85, []], ["Tomino di Rivalta", 85, []], ["Tomino di San Giacomo di Boves", 85, []], ["Tomino di Saronsella (Chivassotto)", 85, []], ["Tomino di Sordevolo", 85, []], ["Tomino di Talucco", 85, []], ["Tomme au Fenouil", 85, []], ["Tomme au Revard", 85, []], ["Tomme de Bauges", 85, []], ["Tomme de Boudane", 85, []], ["Tomme de Butone", 85, []], ["Tomme de Savoie", 85, []], ["topfen", 85, []], ["Torta", 85, []], ["Torta del Casar", 85, []], ["Torta mascarpone", 85, []], ["Torta orobica", 85, []], ["Toscanello", 85, []], ["Tosela", 85, []], ["Tos\xE8la del Primiero", 85, []], ["Tou dels Til\xB7lers", 85, []], ["Touloumisio", 85, []], ["Toumin dal mel", 85, []], ["Tounjski", 85, []], ["Trappista", 85, []], ["Travni\u010Dki", 85, []], ["Tre Valli", 85, []], ["Treccia", 85, []], ["Treccia dei Cerviati e Centaurino", 85, []], ["Treccia dura", 85, []], ["Trifulin", 85, []], ["Triskel", 85, []], ["Trizza", 85, []], ["Tronchetto", 85, []], ["Tronchetto alpino", 85, []], ["Tronchetto di capra", 85, []], ["Tronchetto stagionato", 85, []], ["Trugole", 85, []], ["Tulum", 85, []], ["Tuma", 85, []], ["Tuma 'd Trausela", 85, []], ["Tuma di Celle", 85, []], ["Tuma di langa sotto vetro", 85, []], ["Tuma sicula", 85, []], ["Tumazzu", 85, []], ["Tumazzu di pecura ccu pipi", 85, []], ["Tumazzu di piecura", 85, []], ["Tumazzu di vacca", 85, []], ["Tumazzu di vacca ccu pipi", 85, []], ["Tumet", 85, []], ["Tumet di Pralungo", 85, []], ["Tumin", 85, []], ["Tumin del mello", 85, []], ["Tumo de Caso", 85, []], ["Tup\xED", 85, []], ["tuppa", 85, []], ["Turkomani", 85, []], ["t\xFAr\xF3", 85, []], ["turr", 85, []], ["tvarog", 85, []], ["tvaroh", 85, []], ["tvoro", 85, []], ["Tvorog", 85, []], ["Twar\xF3g", 85, []], ["Tybo", 85, []], ["Tyl\u017Cycki", 85, []], ["Tyrolean Grey", 85, []], ["Ubriaco", 85, []], ["Ubriaco al traminer di capra", 85, []], ["Uglichsky", 85, []], ["Ukra\u0457nskyi", 85, []], ["Uova di bufala", 85, []], ["urda", 85, []], ["Vacherin", 85, []], ["Vacherin Fribourgeois", 85, []], ["Vaciarin", 85, []], ["Val Brandet", 85, []], ["Valcasotto", 85, []], ["Valde\xF3n cheese", 85, []], ["Valen\xE7ay", 85, []], ["Valle d'Aosta Fromadzo", 85, []], ["Valligiano", 85, []], ["Valsevia ubriaca", 85, []], ["Valtellina casera", 85, []], ["var\u0161k\u0117s s\u016Brelis", 85, []], ["Vastedda", 85, []], ["Vastedda della Valle del Belice", 85, []], ["Vastedda palermitana", 85, []], ["V\xE4sterbottensost", 85, []], ["Velveeta", 85, []], ["Vesterhavsost", 85, []], ["V\xE9zzena", 85, []], ["Vieux-Boulogne", 85, []], ["villi", 85, []], ["Vla\u0161i\u0107ki", 85, []], ["Vlaskaas", 85, []], ["vurda", 85, []], ["Washed-rind cheese", 85, []], ["Waterloo", 60, []], ["wei\xDFer K\xE4s", 85, []], ["Wei\xDFk\xE4se", 85, []], ["Weisslacker", 85, []], ["Wensleydale", 85, []], ["West Country Farmhouse Cheddar", 85, []], ["White Stilton", 85, []], ["Whitehaven", 85, []], ["Wicklow Baun", 85, []], ["Wicklow Blue", 85, []], ["Wiltshire Loaf", 85, []], ["xianniunai", 85, []], ["Xygalo", 85, []], ["Xynomizithra", 85, []], ["Xynomyzithra Kritis", 85, []], ["Xynotyri", 85, []], ["Xynotyro", 85, []], ["Y Fenni", 85, []], ["Yaroslavsky", 85, []], ["ymer", 85, []], ["Yorkshire Blue", 60, []], ["zabadi", 85, []], ["zabedi", 85, []], ["Zakusochny", 85, []], ["Zamojski", 85, []], ["Zamorano cheese", 85, []], ["Z\xE1zrivsk\xFD korb\xE1\u010Dik", 85, []], ["Zeigel", 85, []], ["Zgorzelecki", 85, []], ["Ziegel", 85, []], ["Ziegenk\xE4se", 85, []], ["Ziger", 85, []], ["Zigerc\xE4se", 85, []], ["Zighera", 85, []], ["Zincarlin", 85, []], ["zsendice", 85, []], ["Zufi", 85, []], ["Zumelle", 85, []], ["Zuvi", 85, []], ["Yogurt", 10, ["Yoghurt"]], ["Brie", 10, []], ["Quark", 60, []]]], [{ "id": "seasonings", "family": "food", "topic": "THE SPICE DRAWER", "prompt": "Name a culinary herb, spice, or named spice blend. Both individual seasonings and traditional mixtures count.", "source": "Corpora herbs_n_spices, CC0; herbs/spices/blends combined and synonyms merged.", "ranking": "familiarity-v1" }, [["Angelica", 85, []], ["Basil", 10, []], ["Holy Basil", 60, []], ["Thai Basil", 60, []], ["Bay leaf", 30, []], ["Indian Bay leaf", 60, []], ["Boldo", 85, []], ["Borage", 85, []], ["Chervil", 85, []], ["Chives", 85, []], ["Garlic Chives", 85, []], ["Cicely", 85, []], ["Cilantro", 85, ["Coriander leaf"]], ["Bolivian Coriander", 85, []], ["Vietnamese Coriander", 85, []], ["Culantro", 85, []], ["Cress", 85, []], ["Curry leaf", 60, []], ["Dill", 30, []], ["Epazote", 85, []], ["Hemp", 60, []], ["Hoja santa", 85, []], ["Houttuynia cordata", 85, []], ["Hyssop", 85, []], ["Jimbu", 85, []], ["Kinh gioi", 85, []], ["Lavender", 60, []], ["Lemon balm", 60, []], ["Lemon grass", 60, []], ["Lemon myrtle", 60, []], ["Lemon verbena", 85, []], ["Limnophila aromatica", 85, []], ["Lovage", 85, []], ["Marjoram", 85, []], ["Mint", 60, []], ["Mugwort", 85, []], ["Mitsuba", 85, []], ["Oregano", 10, []], ["Parsley", 10, []], ["Perilla", 85, []], ["Rosemary", 10, []], ["Rue", 60, []], ["Sage", 60, []], ["Savory", 85, []], ["Sansho", 85, []], ["Shiso", 85, []], ["Sorrel", 85, []], ["Tarragon", 85, []], ["Thyme", 10, []], ["Woodruff", 85, []], ["Aonori", 85, []], ["Ajwain", 85, []], ["Allspice", 85, []], ["Amchoor", 85, []], ["Anise", 85, []], ["Star Anise", 85, []], ["Asafoetida", 85, []], ["Camphor", 85, []], ["Caraway", 85, []], ["Cardamom", 30, []], ["Black Cardamom", 85, []], ["Cassia", 85, []], ["Celery powder", 60, []], ["Celery seed", 60, []], ["Charoli", 85, []], ["Chenpi", 85, []], ["Cinnamon", 10, []], ["Clove", 85, ["Cloves"]], ["Coriander seed", 85, []], ["Cubeb", 85, []], ["Cumin", 10, []], ["Bunium persicum", 85, []], ["Dill seed", 85, []], ["Fennel", 85, []], ["Fenugreek", 85, []], ["Fingerroot", 85, []], ["Greater Galangal", 85, []], ["Lesser Galangal", 85, []], ["Garlic", 10, []], ["Ginger", 10, []], ["Aromatic Ginger", 60, []], ["Golpar", 85, []], ["Grains of Paradise", 100, []], ["Grains of Selim", 100, []], ["Horseradish", 85, []], ["Juniper berry", 85, ["Juniper berries"]], ["Kokum", 85, []], ["Korarima", 85, []], ["Dried Lime", 60, []], ["Liquorice", 85, ["Licorice"]], ["Litsea cubeba", 85, []], ["Mace", 60, []], ["Mango-ginger", 60, []], ["Mastic", 85, []], ["Mahlab", 85, []], ["Black Mustard", 60, []], ["Brown Mustard", 60, []], ["White Mustard", 60, []], ["Nigella", 85, ["Nigella sativa"]], ["Njangsa", 85, []], ["Nutmeg", 30, []], ["Alligator Pepper", 60, []], ["Brazilian Pepper", 60, []], ["Chili Pepper", 30, ["Chili", "Chilli", "Chilli Pepper"]], ["Cayenne pepper", 85, []], ["Paprika", 10, []], ["Long Pepper", 30, []], ["Peruvian Pepper", 60, []], ["East Asian Pepper", 60, []], ["Sichuan Pepper", 85, []], ["Tasmanian Pepper", 60, []], ["Black Peppercorn", 10, []], ["Green Peppercorn", 85, []], ["White Peppercorn", 85, []], ["Pomegranate seed", 85, []], ["Poppy seed", 60, []], ["Radhuni", 85, []], ["Rose", 30, []], ["Saffron", 30, []], ["Salt", 30, []], ["Sarsaparilla", 85, []], ["Sassafras", 85, []], ["Sesame", 60, []], ["Sumac", 85, []], ["Tamarind", 85, []], ["Tonka bean", 85, []], ["Turmeric", 30, []], ["Uzazi", 85, []], ["Vanilla", 60, []], ["Voatsiperifery", 85, []], ["Wasabi", 85, []], ["Yuzu", 85, []], ["Zedoary", 85, []], ["Zereshk", 85, []], ["Zest", 60, []], ["Adjika", 85, []], ["Advieh", 85, []], ["Baharat", 85, []], ["Beau Monde seasoning", 85, []], ["Berbere", 85, []], ["Bouquet garni", 85, []], ["Buknu", 85, []], ["Chaat masala", 85, []], ["Chaunk", 85, []], ["Chili powder", 60, []], ["Crab boil", 60, []], ["Curry powder", 60, []], ["Doubanjiang", 85, []], ["Douchi", 85, []], ["Duqqa", 85, []], ["Fines herbes", 85, []], ["Five-spice powder", 60, []], ["Garam masala", 30, []], ["Garlic powder", 60, []], ["Garlic salt", 60, []], ["Gochujang", 85, []], ["Harissa", 85, []], ["Hawaij", 85, []], ["Herbes de Provence", 85, []], ["Idli podi", 85, []], ["Jamaican jerk spice", 60, []], ["Khmeli suneli", 85, []], ["Lemon pepper", 60, []], ["Mitmita", 85, []], ["Mixed spice", 60, []], ["Montreal steak seasoning", 60, []], ["Mulling spices", 85, []], ["Old Bay Seasoning", 60, []], ["Onion powder", 60, []], ["Panch phoron", 85, []], ["Persillade", 85, []], ["Powder-douce", 85, []], ["Pumpkin pie spice", 60, []], ["Q\xE2lat daqqa", 85, []], ["Quatre \xE9pices", 85, []], ["Ras el hanout", 85, []], ["Recado rojo", 85, []], ["Sharena sol", 85, []], ["Shichimi", 85, []], ["Tabil", 85, []], ["Tandoori masala", 85, []], ["Vadouvan", 85, []], ["Yuzukosho", 85, []], ["Za'atar", 30, []]]], [{ "id": "condiment-counter", "family": "food", "topic": "ON THE SIDE", "prompt": "Name a sauce, condiment, or relish served with food. Named traditional condiments count.", "source": "Corpora foods/condiments, CC0; ingredient names retained.", "ranking": "familiarity-v1" }, [["Aioli", 85, []], ["Ajvar", 85, []], ["Amba", 85, []], ["Barbecue sauce", 10, []], ["Biber sal\xE7as\u0131", 85, []], ["Brown mustard", 60, []], ["Chili peppers", 60, []], ["Chili sauce", 60, []], ["Chili oil", 60, []], ["Chimichurri", 85, []], ["Chutney", 30, []], ["Cocktail sauce", 60, []], ["Colo-colo", 85, []], ["Crushed red pepper", 60, []], ["Dabu-dabu", 85, []], ["Dijon ketchup", 85, []], ["Dijon mustard", 85, []], ["Dip", 60, []], ["Fish paste", 60, []], ["Fish sauce", 30, []], ["Fritessaus", 85, []], ["Fruit preserves", 60, []], ["Fry sauce", 60, []], ["Gochujang", 85, []], ["Guacamole", 85, []], ["Honey dill", 85, []], ["Horseradish", 85, []], ["Hot mustard", 60, []], ["Hot sauce", 10, []], ["Skhug", 85, []], ["Kachumbari", 85, []], ["Kachumber", 85, []], ["Ketchup", 10, []], ["Fruit ketchup", 60, []], ["Banana ketchup", 60, []], ["Curry ketchup", 60, []], ["Kimchi", 85, []], ["Khrenovina", 85, []], ["Kyopolou", 85, []], ["Mayonnaise", 10, []], ["Mignonette sauce", 85, []], ["Milkette", 85, []], ["Monkey gland sauce", 100, []], ["Muhammara", 85, []], ["Mumbo sauce", 85, []], ["Murri", 85, []], ["Mushroom ketchup", 60, []], ["Mustard", 10, []], ["Mostarda", 85, []], ["Mustard oil", 60, []], ["Tewkesbury mustard", 85, []], ["Turun sinappi", 85, []], ["Nutritional yeast", 60, []], ["Olive oil", 60, []], ["Pepper jelly", 60, []], ["Pesto", 30, []], ["Piccalilli", 85, []], ["Pickled fruit", 60, []], ["Pico de gallo", 85, []], ["Mango pickle", 60, []], ["Pickled cucumber", 85, []], ["Pickled onion", 85, []], ["Pickled pepper", 60, []], ["Pin\u0111ur", 85, []], ["Popcorn seasoning", 60, []], ["Relish", 60, []], ["Chrain", 85, []], ["Ljutenica", 85, []], ["Remoulade", 85, []], ["Salad cream", 60, []], ["Salad dressing", 60, []], ["Salmoriglio", 85, []], ["Salsa", 10, []], ["Salsa golf", 60, []], ["Salt", 30, []], ["Salt and pepper", 60, []], ["Sambal", 85, []], ["Sauerkraut", 85, []], ["Sesame oil", 60, []], ["Skyronnes", 85, []], ["Soy sauce", 10, []], ["Sriracha", 30, []], ["Steak sauce", 60, []], ["Sumbala", 85, []], ["Sweet chilli sauce", 60, []], ["Syrup", 60, []], ["Tartar sauce", 85, []], ["Tekka", 85, []], ["Teriyaki sauce", 85, []], ["Tkemali", 85, []], ["Toum", 85, []], ["Vinegar", 60, []], ["Black vinegar", 60, []], ["Vincotto", 85, []], ["Vino cotto", 85, []], ["Watermelon rind preserves", 85, []], ["XO sauce", 60, []], ["Za'atar", 85, []], ["Zacusc\u0103", 85, []]]], [{ "id": "two-letter-elements", "family": "science", "topic": "TWO-LETTER SYMBOLS", "prompt": "Name a chemical element with a two-letter symbol. An element name or its official symbol is accepted.", "source": "Corpora periodic table, CC0; IUPAC permanent names for elements 113,115,117,118 applied.", "ranking": "familiarity-v1" }, [["Helium", 10, ["He"]], ["Lithium", 30, ["Li"]], ["Beryllium", 85, ["Be"]], ["Neon", 10, ["Ne"]], ["Sodium", 10, ["Na"]], ["Magnesium", 30, ["Mg"]], ["Aluminum", 60, ["Al"]], ["Silicon", 30, ["Si"]], ["Chlorine", 30, ["Cl"]], ["Argon", 85, ["Ar"]], ["Calcium", 10, ["Ca"]], ["Scandium", 85, ["Sc"]], ["Titanium", 60, ["Ti"]], ["Chromium", 60, ["Cr"]], ["Manganese", 60, ["Mn"]], ["Iron", 10, ["Fe"]], ["Cobalt", 60, ["Co"]], ["Nickel", 30, ["Ni"]], ["Copper", 30, ["Cu"]], ["Zinc", 30, ["Zn"]], ["Gallium", 85, ["Ga"]], ["Germanium", 85, ["Ge"]], ["Arsenic", 60, ["As"]], ["Selenium", 85, ["Se"]], ["Bromine", 85, ["Br"]], ["Krypton", 85, ["Kr"]], ["Rubidium", 85, ["Rb"]], ["Strontium", 85, ["Sr"]], ["Zirconium", 85, ["Zr"]], ["Niobium", 85, ["Nb"]], ["Molybdenum", 60, ["Mo"]], ["Technetium", 85, ["Tc"]], ["Ruthenium", 85, ["Ru"]], ["Rhodium", 85, ["Rh"]], ["Palladium", 60, ["Pd"]], ["Silver", 10, ["Ag"]], ["Cadmium", 85, ["Cd"]], ["Indium", 85, ["In"]], ["Tin", 60, ["Sn"]], ["Antimony", 60, ["Sb"]], ["Tellurium", 85, ["Te"]], ["Xenon", 85, ["Xe"]], ["Cesium", 85, ["Cs"]], ["Barium", 85, ["Ba"]], ["Lanthanum", 85, ["La"]], ["Cerium", 85, ["Ce"]], ["Praseodymium", 100, ["Pr"]], ["Neodymium", 85, ["Nd"]], ["Promethium", 85, ["Pm"]], ["Samarium", 85, ["Sm"]], ["Europium", 85, ["Eu"]], ["Gadolinium", 85, ["Gd"]], ["Terbium", 85, ["Tb"]], ["Dysprosium", 85, ["Dy"]], ["Holmium", 85, ["Ho"]], ["Erbium", 85, ["Er"]], ["Thulium", 85, ["Tm"]], ["Ytterbium", 85, ["Yb"]], ["Lutetium", 85, ["Lu"]], ["Hafnium", 85, ["Hf"]], ["Tantalum", 85, ["Ta"]], ["Rhenium", 85, ["Re"]], ["Osmium", 85, ["Os"]], ["Iridium", 85, ["Ir"]], ["Platinum", 60, ["Pt"]], ["Gold", 10, ["Au"]], ["Mercury", 60, ["Hg"]], ["Thallium", 85, ["Tl"]], ["Lead", 10, ["Pb"]], ["Bismuth", 85, ["Bi"]], ["Polonium", 85, ["Po"]], ["Astatine", 85, ["At"]], ["Radon", 85, ["Rn"]], ["Francium", 85, ["Fr"]], ["Radium", 85, ["Ra"]], ["Actinium", 85, ["Ac"]], ["Thorium", 85, ["Th"]], ["Protactinium", 85, ["Pa"]], ["Neptunium", 85, ["Np"]], ["Plutonium", 60, ["Pu"]], ["Americium", 85, ["Am"]], ["Curium", 85, ["Cm"]], ["Berkelium", 85, ["Bk"]], ["Californium", 85, ["Cf"]], ["Einsteinium", 85, ["Es"]], ["Fermium", 85, ["Fm"]], ["Mendelevium", 85, ["Md"]], ["Nobelium", 85, ["No"]], ["Lawrencium", 85, ["Lr"]], ["Rutherfordium", 85, ["Rf"]], ["Dubnium", 85, ["Db"]], ["Seaborgium", 85, ["Sg"]], ["Bohrium", 85, ["Bh"]], ["Hassium", 85, ["Hs"]], ["Meitnerium", 85, ["Mt"]], ["Darmstadtium", 85, ["Ds"]], ["Roentgenium", 85, ["Rg"]], ["Copernicium", 85, ["Cn"]], ["Nihonium", 85, ["Nh"]], ["Flerovium", 85, ["Fl"]], ["Moscovium", 85, ["Mc"]], ["Livermorium", 85, ["Lv"]], ["Tennessine", 85, ["Ts"]], ["Oganesson", 100, ["Og"]]]], [{ "id": "first-thousand-minor-planets", "family": "science", "topic": "THE FIRST THOUSAND", "prompt": "Name one of the first 1,000 numbered minor planets by name. Numbers alone do not count.", "source": "Corpora science/minor_planets, first 1,000 numbered objects, CC0. Numeric-only aliases intentionally excluded.", "ranking": "familiarity-v1" }, [["Ceres", 10, ["1 Ceres"]], ["Pallas", 10, ["2 Pallas"]], ["Juno", 10, ["3 Juno"]], ["Vesta", 10, ["4 Vesta"]], ["Astraea", 85, ["5 Astraea"]], ["Hebe", 60, ["6 Hebe"]], ["Iris", 60, ["7 Iris"]], ["Flora", 60, ["8 Flora"]], ["Metis", 85, ["9 Metis"]], ["Hygiea", 30, ["10 Hygiea"]], ["Parthenope", 85, ["11 Parthenope"]], ["Victoria", 30, ["12 Victoria"]], ["Egeria", 85, ["13 Egeria"]], ["Irene", 60, ["14 Irene"]], ["Eunomia", 85, ["15 Eunomia"]], ["Psyche", 30, ["16 Psyche"]], ["Thetis", 85, ["17 Thetis"]], ["Melpomene", 85, ["18 Melpomene"]], ["Fortuna", 85, ["19 Fortuna"]], ["Massalia", 85, ["20 Massalia"]], ["Lutetia", 85, ["21 Lutetia"]], ["Kalliope", 85, ["22 Kalliope"]], ["Thalia", 85, ["23 Thalia"]], ["Themis", 85, ["24 Themis"]], ["Phocaea", 85, ["25 Phocaea"]], ["Proserpina", 85, ["26 Proserpina"]], ["Euterpe", 85, ["27 Euterpe"]], ["Bellona", 85, ["28 Bellona"]], ["Amphitrite", 85, ["29 Amphitrite"]], ["Urania", 85, ["30 Urania"]], ["Euphrosyne", 85, ["31 Euphrosyne"]], ["Pomona", 85, ["32 Pomona"]], ["Polyhymnia", 85, ["33 Polyhymnia"]], ["Circe", 85, ["34 Circe"]], ["Leukothea", 85, ["35 Leukothea"]], ["Atalante", 85, ["36 Atalante"]], ["Fides", 85, ["37 Fides"]], ["Leda", 85, ["38 Leda"]], ["Laetitia", 85, ["39 Laetitia"]], ["Harmonia", 85, ["40 Harmonia"]], ["Daphne", 60, ["41 Daphne"]], ["Isis", 30, ["42 Isis"]], ["Ariadne", 85, ["43 Ariadne"]], ["Nysa", 85, ["44 Nysa"]], ["Eugenia", 85, ["45 Eugenia"]], ["Hestia", 85, ["46 Hestia"]], ["Aglaja", 85, ["47 Aglaja"]], ["Doris", 60, ["48 Doris"]], ["Pales", 85, ["49 Pales"]], ["Virginia", 30, ["50 Virginia"]], ["Nemausa", 85, ["51 Nemausa"]], ["Europa", 60, ["52 Europa"]], ["Kalypso", 85, ["53 Kalypso"]], ["Alexandra", 60, ["54 Alexandra"]], ["Pandora", 60, ["55 Pandora"]], ["Melete", 85, ["56 Melete"]], ["Mnemosyne", 85, ["57 Mnemosyne"]], ["Concordia", 60, ["58 Concordia"]], ["Elpis", 85, ["59 Elpis"]], ["Echo", 60, ["60 Echo"]], ["Danae", 85, ["61 Danae"]], ["Erato", 85, ["62 Erato"]], ["Ausonia", 85, ["63 Ausonia"]], ["Angelina", 60, ["64 Angelina"]], ["Cybele", 85, ["65 Cybele"]], ["Maja", 85, ["66 Maja"]], ["Asia", 30, ["67 Asia"]], ["Leto", 85, ["68 Leto"]], ["Hesperia", 85, ["69 Hesperia"]], ["Panopaea", 85, ["70 Panopaea"]], ["Niobe", 85, ["71 Niobe"]], ["Feronia", 85, ["72 Feronia"]], ["Klytia", 85, ["73 Klytia"]], ["Galatea", 85, ["74 Galatea"]], ["Eurydike", 85, ["75 Eurydike"]], ["Freia", 85, ["76 Freia"]], ["Frigga", 85, ["77 Frigga"]], ["Diana", 60, ["78 Diana"]], ["Eurynome", 85, ["79 Eurynome"]], ["Sappho", 85, ["80 Sappho"]], ["Terpsichore", 85, ["81 Terpsichore"]], ["Alkmene", 85, ["82 Alkmene"]], ["Beatrix", 85, ["83 Beatrix"]], ["Klio", 85, ["84 Klio"]], ["Io", 60, ["85 Io"]], ["Semele", 85, ["86 Semele"]], ["Sylvia", 60, ["87 Sylvia"]], ["Thisbe", 85, ["88 Thisbe"]], ["Julia", 30, ["89 Julia"]], ["Antiope", 85, ["90 Antiope"]], ["Aegina", 85, ["91 Aegina"]], ["Undina", 85, ["92 Undina"]], ["Minerva", 85, ["93 Minerva"]], ["Aurora", 60, ["94 Aurora"]], ["Arethusa", 85, ["95 Arethusa"]], ["Aegle", 85, ["96 Aegle"]], ["Klotho", 85, ["97 Klotho"]], ["Ianthe", 85, ["98 Ianthe"]], ["Dike", 85, ["99 Dike"]], ["Hekate", 85, ["100 Hekate"]], ["Helena", 60, ["101 Helena"]], ["Miriam", 60, ["102 Miriam"]], ["Hera", 85, ["103 Hera"]], ["Klymene", 85, ["104 Klymene"]], ["Artemis", 85, ["105 Artemis"]], ["Dione", 85, ["106 Dione"]], ["Camilla", 60, ["107 Camilla"]], ["Hecuba", 85, ["108 Hecuba"]], ["Felicitas", 85, ["109 Felicitas"]], ["Lydia", 60, ["110 Lydia"]], ["Ate", 30, ["111 Ate"]], ["Iphigenia", 85, ["112 Iphigenia"]], ["Amalthea", 85, ["113 Amalthea"]], ["Kassandra", 85, ["114 Kassandra"]], ["Thyra", 85, ["115 Thyra"]], ["Sirona", 85, ["116 Sirona"]], ["Lomia", 85, ["117 Lomia"]], ["Peitho", 85, ["118 Peitho"]], ["Althaea", 85, ["119 Althaea"]], ["Lachesis", 85, ["120 Lachesis"]], ["Hermione", 60, ["121 Hermione"]], ["Gerda", 85, ["122 Gerda"]], ["Brunhild", 85, ["123 Brunhild"]], ["Alkeste", 85, ["124 Alkeste"]], ["Liberatrix", 85, ["125 Liberatrix"]], ["Velleda", 85, ["126 Velleda"]], ["Johanna", 85, ["127 Johanna"]], ["Nemesis", 60, ["128 Nemesis"]], ["Antigone", 85, ["129 Antigone"]], ["Elektra", 85, ["130 Elektra"]], ["Vala", 85, ["131 Vala"]], ["Aethra", 85, ["132 Aethra"]], ["Cyrene", 85, ["133 Cyrene"]], ["Sophrosyne", 85, ["134 Sophrosyne"]], ["Hertha", 85, ["135 Hertha"]], ["Austria", 60, ["136 Austria"]], ["Meliboea", 85, ["137 Meliboea"]], ["Tolosa", 85, ["138 Tolosa"]], ["Juewa", 85, ["139 Juewa"]], ["Siwa", 85, ["140 Siwa"]], ["Lumen", 85, ["141 Lumen"]], ["Polana", 85, ["142 Polana"]], ["Adria", 85, ["143 Adria"]], ["Vibilia", 85, ["144 Vibilia"]], ["Adeona", 85, ["145 Adeona"]], ["Lucina", 85, ["146 Lucina"]], ["Protogeneia", 85, ["147 Protogeneia"]], ["Gallia", 85, ["148 Gallia"]], ["Medusa", 60, ["149 Medusa"]], ["Nuwa", 85, ["150 Nuwa"]], ["Abundantia", 85, ["151 Abundantia"]], ["Atala", 85, ["152 Atala"]], ["Hilda", 60, ["153 Hilda"]], ["Bertha", 60, ["154 Bertha"]], ["Scylla", 85, ["155 Scylla"]], ["Xanthippe", 85, ["156 Xanthippe"]], ["Dejanira", 85, ["157 Dejanira"]], ["Koronis", 85, ["158 Koronis"]], ["Aemilia", 85, ["159 Aemilia"]], ["Una", 60, ["160 Una"]], ["Athor", 85, ["161 Athor"]], ["Laurentia", 85, ["162 Laurentia"]], ["Erigone", 85, ["163 Erigone"]], ["Eva", 60, ["164 Eva"]], ["Loreley", 85, ["165 Loreley"]], ["Rhodope", 85, ["166 Rhodope"]], ["Urda", 85, ["167 Urda"]], ["Sibylla", 85, ["168 Sibylla"]], ["Zelia", 85, ["169 Zelia"]], ["Maria", 30, ["170 Maria"]], ["Ophelia", 85, ["171 Ophelia"]], ["Baucis", 85, ["172 Baucis"]], ["Ino", 85, ["173 Ino"]], ["Phaedra", 85, ["174 Phaedra"]], ["Andromache", 85, ["175 Andromache"]], ["Iduna", 85, ["176 Iduna"]], ["Irma", 85, ["177 Irma"]], ["Belisana", 85, ["178 Belisana"]], ["Klytaemnestra", 85, ["179 Klytaemnestra"]], ["Garumna", 85, ["180 Garumna"]], ["Eucharis", 85, ["181 Eucharis"]], ["Elsa", 60, ["182 Elsa"]], ["Istria", 85, ["183 Istria"]], ["Dejopeja", 85, ["184 Dejopeja"]], ["Eunike", 85, ["185 Eunike"]], ["Celuta", 85, ["186 Celuta"]], ["Lamberta", 85, ["187 Lamberta"]], ["Menippe", 85, ["188 Menippe"]], ["Phthia", 85, ["189 Phthia"]], ["Ismene", 85, ["190 Ismene"]], ["Kolga", 85, ["191 Kolga"]], ["Nausikaa", 85, ["192 Nausikaa"]], ["Ambrosia", 85, ["193 Ambrosia"]], ["Prokne", 85, ["194 Prokne"]], ["Eurykleia", 85, ["195 Eurykleia"]], ["Philomela", 85, ["196 Philomela"]], ["Arete", 85, ["197 Arete"]], ["Ampella", 85, ["198 Ampella"]], ["Byblis", 85, ["199 Byblis"]], ["Dynamene", 85, ["200 Dynamene"]], ["Penelope", 60, ["201 Penelope"]], ["Chryseis", 85, ["202 Chryseis"]], ["Pompeja", 85, ["203 Pompeja"]], ["Kallisto", 85, ["204 Kallisto"]], ["Martha", 60, ["205 Martha"]], ["Hersilia", 85, ["206 Hersilia"]], ["Hedda", 85, ["207 Hedda"]], ["Lacrimosa", 85, ["208 Lacrimosa"]], ["Dido", 85, ["209 Dido"]], ["Isabella", 60, ["210 Isabella"]], ["Isolda", 85, ["211 Isolda"]], ["Medea", 85, ["212 Medea"]], ["Lilaea", 85, ["213 Lilaea"]], ["Aschera", 85, ["214 Aschera"]], ["Oenone", 85, ["215 Oenone"]], ["Kleopatra", 85, ["216 Kleopatra"]], ["Eudora", 85, ["217 Eudora"]], ["Bianca", 60, ["218 Bianca"]], ["Thusnelda", 85, ["219 Thusnelda"]], ["Stephania", 85, ["220 Stephania"]], ["Eos", 60, ["221 Eos"]], ["Lucia", 60, ["222 Lucia"]], ["Rosa", 60, ["223 Rosa"]], ["Oceana", 85, ["224 Oceana"]], ["Henrietta", 85, ["225 Henrietta"]], ["Weringia", 85, ["226 Weringia"]], ["Philosophia", 85, ["227 Philosophia"]], ["Agathe", 85, ["228 Agathe"]], ["Adelinda", 85, ["229 Adelinda"]], ["Athamantis", 85, ["230 Athamantis"]], ["Vindobona", 85, ["231 Vindobona"]], ["Russia", 30, ["232 Russia"]], ["Asterope", 85, ["233 Asterope"]], ["Barbara", 30, ["234 Barbara"]], ["Carolina", 30, ["235 Carolina"]], ["Honoria", 85, ["236 Honoria"]], ["Coelestina", 85, ["237 Coelestina"]], ["Hypatia", 85, ["238 Hypatia"]], ["Adrastea", 85, ["239 Adrastea"]], ["Vanadis", 85, ["240 Vanadis"]], ["Germania", 85, ["241 Germania"]], ["Kriemhild", 85, ["242 Kriemhild"]], ["Ida", 30, ["243 Ida"]], ["Sita", 85, ["244 Sita"]], ["Vera", 60, ["245 Vera"]], ["Asporina", 85, ["246 Asporina"]], ["Eukrate", 85, ["247 Eukrate"]], ["Lameia", 85, ["248 Lameia"]], ["Ilse", 85, ["249 Ilse"]], ["Bettina", 85, ["250 Bettina"]], ["Sophia", 60, ["251 Sophia"]], ["Clementina", 85, ["252 Clementina"]], ["Mathilde", 85, ["253 Mathilde"]], ["Augusta", 60, ["254 Augusta"]], ["Oppavia", 85, ["255 Oppavia"]], ["Walpurga", 85, ["256 Walpurga"]], ["Silesia", 85, ["257 Silesia"]], ["Tyche", 85, ["258 Tyche"]], ["Aletheia", 85, ["259 Aletheia"]], ["Huberta", 85, ["260 Huberta"]], ["Prymno", 85, ["261 Prymno"]], ["Valda", 85, ["262 Valda"]], ["Dresda", 85, ["263 Dresda"]], ["Libussa", 85, ["264 Libussa"]], ["Anna", 30, ["265 Anna"]], ["Aline", 85, ["266 Aline"]], ["Tirza", 85, ["267 Tirza"]], ["Adorea", 85, ["268 Adorea"]], ["Justitia", 85, ["269 Justitia"]], ["Anahita", 85, ["270 Anahita"]], ["Penthesilea", 85, ["271 Penthesilea"]], ["Antonia", 85, ["272 Antonia"]], ["Atropos", 85, ["273 Atropos"]], ["Philagoria", 85, ["274 Philagoria"]], ["Sapientia", 85, ["275 Sapientia"]], ["Adelheid", 85, ["276 Adelheid"]], ["Elvira", 85, ["277 Elvira"]], ["Paulina", 85, ["278 Paulina"]], ["Thule", 85, ["279 Thule"]], ["Philia", 85, ["280 Philia"]], ["Lucretia", 85, ["281 Lucretia"]], ["Clorinde", 85, ["282 Clorinde"]], ["Emma", 30, ["283 Emma"]], ["Amalia", 85, ["284 Amalia"]], ["Regina", 60, ["285 Regina"]], ["Iclea", 85, ["286 Iclea"]], ["Nephthys", 85, ["287 Nephthys"]], ["Glauke", 85, ["288 Glauke"]], ["Nenetta", 85, ["289 Nenetta"]], ["Bruna", 85, ["290 Bruna"]], ["Alice", 30, ["291 Alice"]], ["Ludovica", 85, ["292 Ludovica"]], ["Brasilia", 85, ["293 Brasilia"]], ["Felicia", 85, ["294 Felicia"]], ["Theresia", 85, ["295 Theresia"]], ["Phaetusa", 85, ["296 Phaetusa"]], ["Caecilia", 85, ["297 Caecilia"]], ["Baptistina", 85, ["298 Baptistina"]], ["Thora", 85, ["299 Thora"]], ["Geraldina", 85, ["300 Geraldina"]], ["Bavaria", 60, ["301 Bavaria"]], ["Clarissa", 85, ["302 Clarissa"]], ["Josephina", 85, ["303 Josephina"]], ["Olga", 60, ["304 Olga"]], ["Gordonia", 85, ["305 Gordonia"]], ["Unitas", 85, ["306 Unitas"]], ["Nike", 60, ["307 Nike"]], ["Polyxo", 85, ["308 Polyxo"]], ["Fraternitas", 85, ["309 Fraternitas"]], ["Margarita", 60, ["310 Margarita"]], ["Claudia", 60, ["311 Claudia"]], ["Pierretta", 85, ["312 Pierretta"]], ["Chaldaea", 85, ["313 Chaldaea"]], ["Rosalia", 85, ["314 Rosalia"]], ["Constantia", 85, ["315 Constantia"]], ["Goberta", 85, ["316 Goberta"]], ["Roxane", 85, ["317 Roxane"]], ["Magdalena", 85, ["318 Magdalena"]], ["Leona", 85, ["319 Leona"]], ["Katharina", 85, ["320 Katharina"]], ["Florentina", 85, ["321 Florentina"]], ["Phaeo", 85, ["322 Phaeo"]], ["Brucia", 85, ["323 Brucia"]], ["Bamberga", 85, ["324 Bamberga"]], ["Heidelberga", 85, ["325 Heidelberga"]], ["Tamara", 60, ["326 Tamara"]], ["Columbia", 30, ["327 Columbia"]], ["Gudrun", 85, ["328 Gudrun"]], ["Svea", 85, ["329 Svea"]], ["Adalberta", 85, ["330 Adalberta"]], ["Etheridgea", 85, ["331 Etheridgea"]], ["Siri", 60, ["332 Siri"]], ["Badenia", 85, ["333 Badenia"]], ["Chicago", 30, ["334 Chicago"]], ["Roberta", 60, ["335 Roberta"]], ["Lacadiera", 85, ["336 Lacadiera"]], ["Devosa", 85, ["337 Devosa"]], ["Budrosa", 85, ["338 Budrosa"]], ["Dorothea", 85, ["339 Dorothea"]], ["Eduarda", 85, ["340 Eduarda"]], ["California", 10, ["341 California"]], ["Endymion", 85, ["342 Endymion"]], ["Ostara", 85, ["343 Ostara"]], ["Desiderata", 85, ["344 Desiderata"]], ["Tercidina", 85, ["345 Tercidina"]], ["Hermentaria", 85, ["346 Hermentaria"]], ["Pariana", 85, ["347 Pariana"]], ["May", 10, ["348 May"]], ["Dembowska", 85, ["349 Dembowska"]], ["Ornamenta", 85, ["350 Ornamenta"]], ["Yrsa", 85, ["351 Yrsa"]], ["Gisela", 85, ["352 Gisela"]], ["Ruperto-Carola", 85, ["353 Ruperto-Carola"]], ["Eleonora", 85, ["354 Eleonora"]], ["Gabriella", 85, ["355 Gabriella"]], ["Liguria", 85, ["356 Liguria"]], ["Ninina", 85, ["357 Ninina"]], ["Apollonia", 85, ["358 Apollonia"]], ["Georgia", 30, ["359 Georgia"]], ["Carlova", 85, ["360 Carlova"]], ["Bononia", 85, ["361 Bononia"]], ["Havnia", 85, ["362 Havnia"]], ["Padua", 85, ["363 Padua"]], ["Isara", 85, ["364 Isara"]], ["Corduba", 85, ["365 Corduba"]], ["Vincentina", 85, ["366 Vincentina"]], ["Amicitia", 85, ["367 Amicitia"]], ["Haidea", 85, ["368 Haidea"]], ["Aeria", 85, ["369 Aeria"]], ["Modestia", 85, ["370 Modestia"]], ["Bohemia", 85, ["371 Bohemia"]], ["Palma", 85, ["372 Palma"]], ["Melusina", 85, ["373 Melusina"]], ["Burgundia", 85, ["374 Burgundia"]], ["Ursula", 60, ["375 Ursula"]], ["Geometria", 85, ["376 Geometria"]], ["Campania", 85, ["377 Campania"]], ["Holmia", 85, ["378 Holmia"]], ["Huenna", 85, ["379 Huenna"]], ["Fiducia", 85, ["380 Fiducia"]], ["Myrrha", 85, ["381 Myrrha"]], ["Dodona", 85, ["382 Dodona"]], ["Janina", 85, ["383 Janina"]], ["Burdigala", 85, ["384 Burdigala"]], ["Ilmatar", 85, ["385 Ilmatar"]], ["Siegena", 85, ["386 Siegena"]], ["Aquitania", 85, ["387 Aquitania"]], ["Charybdis", 85, ["388 Charybdis"]], ["Industria", 85, ["389 Industria"]], ["Alma", 60, ["390 Alma"]], ["Ingeborg", 85, ["391 Ingeborg"]], ["Wilhelmina", 85, ["392 Wilhelmina"]], ["Lampetia", 85, ["393 Lampetia"]], ["Arduina", 85, ["394 Arduina"]], ["Delia", 85, ["395 Delia"]], ["Aeolia", 85, ["396 Aeolia"]], ["Vienna", 60, ["397 Vienna"]], ["Admete", 85, ["398 Admete"]], ["Persephone", 85, ["399 Persephone"]], ["Ducrosa", 85, ["400 Ducrosa"]], ["Ottilia", 85, ["401 Ottilia"]], ["Chloe", 60, ["402 Chloe"]], ["Cyane", 85, ["403 Cyane"]], ["Arsinoe", 85, ["404 Arsinoe"]], ["Thia", 85, ["405 Thia"]], ["Erna", 85, ["406 Erna"]], ["Arachne", 85, ["407 Arachne"]], ["Fama", 85, ["408 Fama"]], ["Aspasia", 85, ["409 Aspasia"]], ["Chloris", 85, ["410 Chloris"]], ["Xanthe", 85, ["411 Xanthe"]], ["Elisabetha", 85, ["412 Elisabetha"]], ["Edburga", 85, ["413 Edburga"]], ["Liriope", 85, ["414 Liriope"]], ["Palatia", 85, ["415 Palatia"]], ["Vaticana", 85, ["416 Vaticana"]], ["Suevia", 85, ["417 Suevia"]], ["Alemannia", 85, ["418 Alemannia"]], ["Aurelia", 85, ["419 Aurelia"]], ["Bertholda", 85, ["420 Bertholda"]], ["Zahringia", 85, ["421 Zahringia"]], ["Berolina", 85, ["422 Berolina"]], ["Diotima", 85, ["423 Diotima"]], ["Gratia", 85, ["424 Gratia"]], ["Cornelia", 85, ["425 Cornelia"]], ["Hippo", 60, ["426 Hippo"]], ["Galene", 85, ["427 Galene"]], ["Monachia", 85, ["428 Monachia"]], ["Lotis", 85, ["429 Lotis"]], ["Hybris", 85, ["430 Hybris"]], ["Nephele", 85, ["431 Nephele"]], ["Pythia", 85, ["432 Pythia"]], ["Eros", 30, ["433 Eros"]], ["Hungaria", 85, ["434 Hungaria"]], ["Ella", 60, ["435 Ella"]], ["Patricia", 60, ["436 Patricia"]], ["Rhodia", 85, ["437 Rhodia"]], ["Zeuxo", 85, ["438 Zeuxo"]], ["Ohio", 30, ["439 Ohio"]], ["Theodora", 85, ["440 Theodora"]], ["Bathilde", 85, ["441 Bathilde"]], ["Eichsfeldia", 85, ["442 Eichsfeldia"]], ["Photographica", 85, ["443 Photographica"]], ["Gyptis", 85, ["444 Gyptis"]], ["Edna", 60, ["445 Edna"]], ["Aeternitas", 85, ["446 Aeternitas"]], ["Valentine", 60, ["447 Valentine"]], ["Natalie", 60, ["448 Natalie"]], ["Hamburga", 85, ["449 Hamburga"]], ["Brigitta", 85, ["450 Brigitta"]], ["Patientia", 85, ["451 Patientia"]], ["Hamiltonia", 85, ["452 Hamiltonia"]], ["Tea", 30, ["453 Tea"]], ["Mathesis", 85, ["454 Mathesis"]], ["Bruchsalia", 85, ["455 Bruchsalia"]], ["Abnoba", 85, ["456 Abnoba"]], ["Alleghenia", 85, ["457 Alleghenia"]], ["Hercynia", 85, ["458 Hercynia"]], ["Signe", 85, ["459 Signe"]], ["Scania", 85, ["460 Scania"]], ["Saskia", 85, ["461 Saskia"]], ["Eriphyla", 85, ["462 Eriphyla"]], ["Lola", 60, ["463 Lola"]], ["Megaira", 85, ["464 Megaira"]], ["Alekto", 85, ["465 Alekto"]], ["Tisiphone", 85, ["466 Tisiphone"]], ["Laura", 30, ["467 Laura"]], ["Lina", 85, ["468 Lina"]], ["Argentina", 30, ["469 Argentina"]], ["Kilia", 85, ["470 Kilia"]], ["Papagena", 85, ["471 Papagena"]], ["Roma", 60, ["472 Roma"]], ["Nolli", 85, ["473 Nolli"]], ["Prudentia", 85, ["474 Prudentia"]], ["Ocllo", 85, ["475 Ocllo"]], ["Hedwig", 85, ["476 Hedwig"]], ["Italia", 60, ["477 Italia"]], ["Tergeste", 85, ["478 Tergeste"]], ["Caprera", 85, ["479 Caprera"]], ["Hansa", 85, ["480 Hansa"]], ["Emita", 85, ["481 Emita"]], ["Petrina", 85, ["482 Petrina"]], ["Seppina", 85, ["483 Seppina"]], ["Pittsburghia", 85, ["484 Pittsburghia"]], ["Genua", 85, ["485 Genua"]], ["Cremona", 85, ["486 Cremona"]], ["Venetia", 85, ["487 Venetia"]], ["Kreusa", 85, ["488 Kreusa"]], ["Comacina", 85, ["489 Comacina"]], ["Veritas", 85, ["490 Veritas"]], ["Carina", 85, ["491 Carina"]], ["Gismonda", 85, ["492 Gismonda"]], ["Griseldis", 85, ["493 Griseldis"]], ["Virtus", 85, ["494 Virtus"]], ["Eulalia", 85, ["495 Eulalia"]], ["Gryphia", 85, ["496 Gryphia"]], ["Iva", 85, ["497 Iva"]], ["Tokio", 85, ["498 Tokio"]], ["Venusia", 85, ["499 Venusia"]], ["Selinur", 85, ["500 Selinur"]], ["Urhixidur", 85, ["501 Urhixidur"]], ["Sigune", 85, ["502 Sigune"]], ["Evelyn", 60, ["503 Evelyn"]], ["Cora", 60, ["504 Cora"]], ["Cava", 85, ["505 Cava"]], ["Marion", 60, ["506 Marion"]], ["Laodica", 85, ["507 Laodica"]], ["Princetonia", 85, ["508 Princetonia"]], ["Iolanda", 85, ["509 Iolanda"]], ["Mabella", 85, ["510 Mabella"]], ["Davida", 60, ["511 Davida"]], ["Taurinensis", 85, ["512 Taurinensis"]], ["Centesima", 85, ["513 Centesima"]], ["Armida", 85, ["514 Armida"]], ["Athalia", 85, ["515 Athalia"]], ["Amherstia", 85, ["516 Amherstia"]], ["Edith", 60, ["517 Edith"]], ["Halawe", 85, ["518 Halawe"]], ["Sylvania", 85, ["519 Sylvania"]], ["Franziska", 85, ["520 Franziska"]], ["Brixia", 85, ["521 Brixia"]], ["Helga", 85, ["522 Helga"]], ["Ada", 60, ["523 Ada"]], ["Fidelio", 85, ["524 Fidelio"]], ["Adelaide", 60, ["525 Adelaide"]], ["Jena", 85, ["526 Jena"]], ["Euryanthe", 85, ["527 Euryanthe"]], ["Rezia", 85, ["528 Rezia"]], ["Preziosa", 85, ["529 Preziosa"]], ["Turandot", 85, ["530 Turandot"]], ["Zerlina", 85, ["531 Zerlina"]], ["Herculina", 85, ["532 Herculina"]], ["Sara", 60, ["533 Sara"]], ["Nassovia", 85, ["534 Nassovia"]], ["Montague", 85, ["535 Montague"]], ["Merapi", 85, ["536 Merapi"]], ["Pauly", 85, ["537 Pauly"]], ["Friederike", 85, ["538 Friederike"]], ["Pamina", 85, ["539 Pamina"]], ["Rosamunde", 85, ["540 Rosamunde"]], ["Deborah", 60, ["541 Deborah"]], ["Susanna", 85, ["542 Susanna"]], ["Charlotte", 30, ["543 Charlotte"]], ["Jetta", 85, ["544 Jetta"]], ["Messalina", 85, ["545 Messalina"]], ["Herodias", 85, ["546 Herodias"]], ["Praxedis", 85, ["547 Praxedis"]], ["Kressida", 85, ["548 Kressida"]], ["Jessonda", 85, ["549 Jessonda"]], ["Senta", 85, ["550 Senta"]], ["Ortrud", 85, ["551 Ortrud"]], ["Sigelinde", 85, ["552 Sigelinde"]], ["Kundry", 85, ["553 Kundry"]], ["Peraga", 85, ["554 Peraga"]], ["Norma", 60, ["555 Norma"]], ["Phyllis", 60, ["556 Phyllis"]], ["Violetta", 85, ["557 Violetta"]], ["Carmen", 60, ["558 Carmen"]], ["Nanon", 85, ["559 Nanon"]], ["Delila", 85, ["560 Delila"]], ["Ingwelde", 85, ["561 Ingwelde"]], ["Salome", 85, ["562 Salome"]], ["Suleika", 85, ["563 Suleika"]], ["Dudu", 85, ["564 Dudu"]], ["Marbachia", 85, ["565 Marbachia"]], ["Stereoskopia", 85, ["566 Stereoskopia"]], ["Eleutheria", 85, ["567 Eleutheria"]], ["Cheruskia", 85, ["568 Cheruskia"]], ["Misa", 85, ["569 Misa"]], ["Kythera", 85, ["570 Kythera"]], ["Dulcinea", 85, ["571 Dulcinea"]], ["Rebekka", 85, ["572 Rebekka"]], ["Recha", 85, ["573 Recha"]], ["Reginhild", 85, ["574 Reginhild"]], ["Renate", 85, ["575 Renate"]], ["Emanuela", 85, ["576 Emanuela"]], ["Rhea", 85, ["577 Rhea"]], ["Happelia", 85, ["578 Happelia"]], ["Sidonia", 85, ["579 Sidonia"]], ["Selene", 85, ["580 Selene"]], ["Tauntonia", 85, ["581 Tauntonia"]], ["Olympia", 60, ["582 Olympia"]], ["Klotilde", 85, ["583 Klotilde"]], ["Semiramis", 85, ["584 Semiramis"]], ["Bilkis", 85, ["585 Bilkis"]], ["Thekla", 85, ["586 Thekla"]], ["Hypsipyle", 85, ["587 Hypsipyle"]], ["Achilles", 60, ["588 Achilles"]], ["Croatia", 60, ["589 Croatia"]], ["Tomyris", 85, ["590 Tomyris"]], ["Irmgard", 85, ["591 Irmgard"]], ["Bathseba", 85, ["592 Bathseba"]], ["Titania", 85, ["593 Titania"]], ["Mireille", 85, ["594 Mireille"]], ["Polyxena", 85, ["595 Polyxena"]], ["Scheila", 85, ["596 Scheila"]], ["Bandusia", 85, ["597 Bandusia"]], ["Octavia", 85, ["598 Octavia"]], ["Luisa", 85, ["599 Luisa"]], ["Musa", 85, ["600 Musa"]], ["Nerthus", 85, ["601 Nerthus"]], ["Marianna", 85, ["602 Marianna"]], ["Timandra", 85, ["603 Timandra"]], ["Tekmessa", 85, ["604 Tekmessa"]], ["Juvisia", 85, ["605 Juvisia"]], ["Brangane", 85, ["606 Brangane"]], ["Jenny", 60, ["607 Jenny"]], ["Adolfine", 85, ["608 Adolfine"]], ["Fulvia", 85, ["609 Fulvia"]], ["Valeska", 85, ["610 Valeska"]], ["Valeria", 85, ["611 Valeria"]], ["Veronika", 85, ["612 Veronika"]], ["Ginevra", 85, ["613 Ginevra"]], ["Pia", 60, ["614 Pia"]], ["Roswitha", 85, ["615 Roswitha"]], ["Elly", 85, ["616 Elly"]], ["Patroclus", 85, ["617 Patroclus"]], ["Elfriede", 85, ["618 Elfriede"]], ["Triberga", 85, ["619 Triberga"]], ["Drakonia", 85, ["620 Drakonia"]], ["Werdandi", 85, ["621 Werdandi"]], ["Esther", 60, ["622 Esther"]], ["Chimaera", 85, ["623 Chimaera"]], ["Hektor", 85, ["624 Hektor"]], ["Xenia", 85, ["625 Xenia"]], ["Notburga", 85, ["626 Notburga"]], ["Charis", 85, ["627 Charis"]], ["Christine", 60, ["628 Christine"]], ["Bernardina", 85, ["629 Bernardina"]], ["Euphemia", 85, ["630 Euphemia"]], ["Philippina", 85, ["631 Philippina"]], ["Pyrrha", 85, ["632 Pyrrha"]], ["Zelima", 85, ["633 Zelima"]], ["Ute", 85, ["634 Ute"]], ["Vundtia", 85, ["635 Vundtia"]], ["Erika", 60, ["636 Erika"]], ["Chrysothemis", 85, ["637 Chrysothemis"]], ["Moira", 60, ["638 Moira"]], ["Latona", 85, ["639 Latona"]], ["Brambilla", 85, ["640 Brambilla"]], ["Agnes", 60, ["641 Agnes"]], ["Clara", 60, ["642 Clara"]], ["Scheherezade", 85, ["643 Scheherezade"]], ["Cosima", 85, ["644 Cosima"]], ["Agrippina", 85, ["645 Agrippina"]], ["Kastalia", 85, ["646 Kastalia"]], ["Adelgunde", 85, ["647 Adelgunde"]], ["Pippa", 85, ["648 Pippa"]], ["Josefa", 85, ["649 Josefa"]], ["Amalasuntha", 85, ["650 Amalasuntha"]], ["Antikleia", 85, ["651 Antikleia"]], ["Jubilatrix", 85, ["652 Jubilatrix"]], ["Berenike", 85, ["653 Berenike"]], ["Zelinda", 85, ["654 Zelinda"]], ["Briseis", 85, ["655 Briseis"]], ["Beagle", 85, ["656 Beagle"]], ["Gunlod", 85, ["657 Gunlod"]], ["Asteria", 85, ["658 Asteria"]], ["Nestor", 85, ["659 Nestor"]], ["Crescentia", 85, ["660 Crescentia"]], ["Cloelia", 85, ["661 Cloelia"]], ["Newtonia", 85, ["662 Newtonia"]], ["Gerlinde", 85, ["663 Gerlinde"]], ["Judith", 60, ["664 Judith"]], ["Sabine", 60, ["665 Sabine"]], ["Desdemona", 85, ["666 Desdemona"]], ["Denise", 60, ["667 Denise"]], ["Dora", 60, ["668 Dora"]], ["Kypria", 85, ["669 Kypria"]], ["Ottegebe", 85, ["670 Ottegebe"]], ["Carnegia", 85, ["671 Carnegia"]], ["Astarte", 85, ["672 Astarte"]], ["Edda", 85, ["673 Edda"]], ["Rachele", 85, ["674 Rachele"]], ["Ludmilla", 85, ["675 Ludmilla"]], ["Melitta", 85, ["676 Melitta"]], ["Aaltje", 85, ["677 Aaltje"]], ["Fredegundis", 85, ["678 Fredegundis"]], ["Pax", 60, ["679 Pax"]], ["Genoveva", 85, ["680 Genoveva"]], ["Gorgo", 85, ["681 Gorgo"]], ["Hagar", 85, ["682 Hagar"]], ["Lanzia", 85, ["683 Lanzia"]], ["Hildburg", 85, ["684 Hildburg"]], ["Hermia", 85, ["685 Hermia"]], ["Gersuind", 85, ["686 Gersuind"]], ["Tinette", 85, ["687 Tinette"]], ["Melanie", 60, ["688 Melanie"]], ["Zita", 85, ["689 Zita"]], ["Wratislavia", 85, ["690 Wratislavia"]], ["Lehigh", 85, ["691 Lehigh"]], ["Hippodamia", 85, ["692 Hippodamia"]], ["Zerbinetta", 85, ["693 Zerbinetta"]], ["Ekard", 85, ["694 Ekard"]], ["Bella", 60, ["695 Bella"]], ["Leonora", 85, ["696 Leonora"]], ["Galilea", 85, ["697 Galilea"]], ["Ernestina", 85, ["698 Ernestina"]], ["Hela", 85, ["699 Hela"]], ["Auravictrix", 85, ["700 Auravictrix"]], ["Oriola", 85, ["701 Oriola"]], ["Alauda", 85, ["702 Alauda"]], ["Noemi", 85, ["703 Noemi"]], ["Interamnia", 60, ["704 Interamnia"]], ["Erminia", 85, ["705 Erminia"]], ["Hirundo", 85, ["706 Hirundo"]], ["Steina", 85, ["707 Steina"]], ["Raphaela", 85, ["708 Raphaela"]], ["Fringilla", 85, ["709 Fringilla"]], ["Gertrud", 85, ["710 Gertrud"]], ["Marmulla", 85, ["711 Marmulla"]], ["Boliviana", 85, ["712 Boliviana"]], ["Luscinia", 85, ["713 Luscinia"]], ["Ulula", 85, ["714 Ulula"]], ["Transvaalia", 85, ["715 Transvaalia"]], ["Berkeley", 60, ["716 Berkeley"]], ["Wisibada", 85, ["717 Wisibada"]], ["Erida", 85, ["718 Erida"]], ["Albert", 30, ["719 Albert"]], ["Bohlinia", 85, ["720 Bohlinia"]], ["Tabora", 85, ["721 Tabora"]], ["Frieda", 85, ["722 Frieda"]], ["Hammonia", 85, ["723 Hammonia"]], ["Hapag", 85, ["724 Hapag"]], ["Amanda", 60, ["725 Amanda"]], ["Joella", 85, ["726 Joella"]], ["Nipponia", 85, ["727 Nipponia"]], ["Leonisis", 85, ["728 Leonisis"]], ["Watsonia", 85, ["729 Watsonia"]], ["Athanasia", 85, ["730 Athanasia"]], ["Sorga", 85, ["731 Sorga"]], ["Tjilaki", 85, ["732 Tjilaki"]], ["Mocia", 85, ["733 Mocia"]], ["Benda", 85, ["734 Benda"]], ["Marghanna", 85, ["735 Marghanna"]], ["Harvard", 30, ["736 Harvard"]], ["Arequipa", 85, ["737 Arequipa"]], ["Alagasta", 85, ["738 Alagasta"]], ["Mandeville", 85, ["739 Mandeville"]], ["Cantabia", 85, ["740 Cantabia"]], ["Botolphia", 85, ["741 Botolphia"]], ["Edisona", 85, ["742 Edisona"]], ["Eugenisis", 85, ["743 Eugenisis"]], ["Aguntina", 85, ["744 Aguntina"]], ["Mauritia", 85, ["745 Mauritia"]], ["Marlu", 85, ["746 Marlu"]], ["Winchester", 60, ["747 Winchester"]], ["Simeisa", 85, ["748 Simeisa"]], ["Malzovia", 85, ["749 Malzovia"]], ["Oskar", 85, ["750 Oskar"]], ["Faina", 85, ["751 Faina"]], ["Sulamitis", 85, ["752 Sulamitis"]], ["Tiflis", 85, ["753 Tiflis"]], ["Malabar", 85, ["754 Malabar"]], ["Quintilla", 85, ["755 Quintilla"]], ["Lilliana", 85, ["756 Lilliana"]], ["Portlandia", 85, ["757 Portlandia"]], ["Mancunia", 85, ["758 Mancunia"]], ["Vinifera", 85, ["759 Vinifera"]], ["Massinga", 85, ["760 Massinga"]], ["Brendelia", 85, ["761 Brendelia"]], ["Pulcova", 85, ["762 Pulcova"]], ["Cupido", 85, ["763 Cupido"]], ["Gedania", 85, ["764 Gedania"]], ["Mattiaca", 85, ["765 Mattiaca"]], ["Moguntia", 85, ["766 Moguntia"]], ["Bondia", 85, ["767 Bondia"]], ["Struveana", 85, ["768 Struveana"]], ["Tatjana", 85, ["769 Tatjana"]], ["Bali", 60, ["770 Bali"]], ["Libera", 85, ["771 Libera"]], ["Tanete", 85, ["772 Tanete"]], ["Irmintraud", 85, ["773 Irmintraud"]], ["Armor", 60, ["774 Armor"]], ["Lumiere", 85, ["775 Lumiere"]], ["Berbericia", 85, ["776 Berbericia"]], ["Gutemberga", 85, ["777 Gutemberga"]], ["Theobalda", 85, ["778 Theobalda"]], ["Nina", 60, ["779 Nina"]], ["Armenia", 60, ["780 Armenia"]], ["Kartvelia", 85, ["781 Kartvelia"]], ["Montefiore", 85, ["782 Montefiore"]], ["Nora", 60, ["783 Nora"]], ["Pickeringia", 85, ["784 Pickeringia"]], ["Zwetana", 85, ["785 Zwetana"]], ["Bredichina", 85, ["786 Bredichina"]], ["Moskva", 85, ["787 Moskva"]], ["Hohensteina", 85, ["788 Hohensteina"]], ["Lena", 60, ["789 Lena"]], ["Pretoria", 60, ["790 Pretoria"]], ["Ani", 60, ["791 Ani"]], ["Metcalfia", 85, ["792 Metcalfia"]], ["Arizona", 30, ["793 Arizona"]], ["Irenaea", 85, ["794 Irenaea"]], ["Fini", 85, ["795 Fini"]], ["Sarita", 85, ["796 Sarita"]], ["Montana", 60, ["797 Montana"]], ["Ruth", 60, ["798 Ruth"]], ["Gudula", 85, ["799 Gudula"]], ["Kressmannia", 85, ["800 Kressmannia"]], ["Helwerthia", 85, ["801 Helwerthia"]], ["Epyaxa", 85, ["802 Epyaxa"]], ["Picka", 85, ["803 Picka"]], ["Hispania", 85, ["804 Hispania"]], ["Hormuthia", 85, ["805 Hormuthia"]], ["Gyldenia", 85, ["806 Gyldenia"]], ["Ceraskia", 85, ["807 Ceraskia"]], ["Merxia", 85, ["808 Merxia"]], ["Lundia", 85, ["809 Lundia"]], ["Atossa", 85, ["810 Atossa"]], ["Nauheima", 85, ["811 Nauheima"]], ["Adele", 60, ["812 Adele"]], ["Baumeia", 85, ["813 Baumeia"]], ["Tauris", 85, ["814 Tauris"]], ["Coppelia", 85, ["815 Coppelia"]], ["Juliana", 85, ["816 Juliana"]], ["Annika", 85, ["817 Annika"]], ["Kapteynia", 85, ["818 Kapteynia"]], ["Barnardiana", 85, ["819 Barnardiana"]], ["Adriana", 85, ["820 Adriana"]], ["Fanny", 60, ["821 Fanny"]], ["Lalage", 85, ["822 Lalage"]], ["Sisigambis", 85, ["823 Sisigambis"]], ["Anastasia", 60, ["824 Anastasia"]], ["Tanina", 85, ["825 Tanina"]], ["Henrika", 85, ["826 Henrika"]], ["Wolfiana", 85, ["827 Wolfiana"]], ["Lindemannia", 85, ["828 Lindemannia"]], ["Academia", 60, ["829 Academia"]], ["Petropolitana", 85, ["830 Petropolitana"]], ["Stateira", 85, ["831 Stateira"]], ["Karin", 85, ["832 Karin"]], ["Monica", 60, ["833 Monica"]], ["Burnhamia", 85, ["834 Burnhamia"]], ["Olivia", 60, ["835 Olivia"]], ["Jole", 85, ["836 Jole"]], ["Schwarzschilda", 85, ["837 Schwarzschilda"]], ["Seraphina", 85, ["838 Seraphina"]], ["Valborg", 85, ["839 Valborg"]], ["Zenobia", 85, ["840 Zenobia"]], ["Arabella", 85, ["841 Arabella"]], ["Kerstin", 85, ["842 Kerstin"]], ["Nicolaia", 85, ["843 Nicolaia"]], ["Leontina", 85, ["844 Leontina"]], ["Naema", 85, ["845 Naema"]], ["Lipperta", 85, ["846 Lipperta"]], ["Agnia", 85, ["847 Agnia"]], ["Inna", 85, ["848 Inna"]], ["Ara", 60, ["849 Ara"]], ["Altona", 85, ["850 Altona"]], ["Zeissia", 85, ["851 Zeissia"]], ["Wladilena", 85, ["852 Wladilena"]], ["Nansenia", 85, ["853 Nansenia"]], ["Frostia", 85, ["854 Frostia"]], ["Newcombia", 85, ["855 Newcombia"]], ["Backlunda", 85, ["856 Backlunda"]], ["Glasenappia", 85, ["857 Glasenappia"]], ["El Djezair", 85, ["858 El Djezair"]], ["Bouzareah", 85, ["859 Bouzareah"]], ["Ursina", 85, ["860 Ursina"]], ["Aida", 85, ["861 Aida"]], ["Franzia", 85, ["862 Franzia"]], ["Benkoela", 85, ["863 Benkoela"]], ["Aase", 85, ["864 Aase"]], ["Zubaida", 85, ["865 Zubaida"]], ["Fatme", 85, ["866 Fatme"]], ["Kovacia", 85, ["867 Kovacia"]], ["Lova", 85, ["868 Lova"]], ["Mellena", 85, ["869 Mellena"]], ["Manto", 85, ["870 Manto"]], ["Amneris", 85, ["871 Amneris"]], ["Holda", 85, ["872 Holda"]], ["Mechthild", 85, ["873 Mechthild"]], ["Rotraut", 85, ["874 Rotraut"]], ["Nymphe", 85, ["875 Nymphe"]], ["Scott", 30, ["876 Scott"]], ["Walkure", 85, ["877 Walkure"]], ["Mildred", 60, ["878 Mildred"]], ["Ricarda", 85, ["879 Ricarda"]], ["Herba", 85, ["880 Herba"]], ["Athene", 85, ["881 Athene"]], ["Swetlana", 85, ["882 Swetlana"]], ["Matterania", 85, ["883 Matterania"]], ["Priamus", 85, ["884 Priamus"]], ["Ulrike", 85, ["885 Ulrike"]], ["Washingtonia", 85, ["886 Washingtonia"]], ["Alinda", 85, ["887 Alinda"]], ["Parysatis", 85, ["888 Parysatis"]], ["Erynia", 85, ["889 Erynia"]], ["Waltraut", 85, ["890 Waltraut"]], ["Gunhild", 85, ["891 Gunhild"]], ["Seeligeria", 85, ["892 Seeligeria"]], ["Leopoldina", 85, ["893 Leopoldina"]], ["Erda", 85, ["894 Erda"]], ["Helio", 85, ["895 Helio"]], ["Sphinx", 85, ["896 Sphinx"]], ["Lysistrata", 85, ["897 Lysistrata"]], ["Hildegard", 85, ["898 Hildegard"]], ["Jokaste", 85, ["899 Jokaste"]], ["Rosalinde", 85, ["900 Rosalinde"]], ["Brunsia", 85, ["901 Brunsia"]], ["Probitas", 85, ["902 Probitas"]], ["Nealley", 85, ["903 Nealley"]], ["Rockefellia", 85, ["904 Rockefellia"]], ["Universitas", 85, ["905 Universitas"]], ["Repsolda", 85, ["906 Repsolda"]], ["Rhoda", 85, ["907 Rhoda"]], ["Buda", 85, ["908 Buda"]], ["Ulla", 85, ["909 Ulla"]], ["Anneliese", 85, ["910 Anneliese"]], ["Agamemnon", 85, ["911 Agamemnon"]], ["Maritima", 85, ["912 Maritima"]], ["Otila", 85, ["913 Otila"]], ["Palisana", 85, ["914 Palisana"]], ["Cosette", 85, ["915 Cosette"]], ["America", 10, ["916 America"]], ["Lyka", 85, ["917 Lyka"]], ["Itha", 85, ["918 Itha"]], ["Ilsebill", 85, ["919 Ilsebill"]], ["Rogeria", 85, ["920 Rogeria"]], ["Jovita", 85, ["921 Jovita"]], ["Schlutia", 85, ["922 Schlutia"]], ["Herluga", 85, ["923 Herluga"]], ["Toni", 60, ["924 Toni"]], ["Alphonsina", 85, ["925 Alphonsina"]], ["Imhilde", 85, ["926 Imhilde"]], ["Ratisbona", 85, ["927 Ratisbona"]], ["Hildrun", 85, ["928 Hildrun"]], ["Algunde", 85, ["929 Algunde"]], ["Westphalia", 85, ["930 Westphalia"]], ["Whittemora", 85, ["931 Whittemora"]], ["Hooveria", 85, ["932 Hooveria"]], ["Susi", 85, ["933 Susi"]], ["Thuringia", 85, ["934 Thuringia"]], ["Clivia", 85, ["935 Clivia"]], ["Kunigunde", 85, ["936 Kunigunde"]], ["Bethgea", 85, ["937 Bethgea"]], ["Chlosinde", 85, ["938 Chlosinde"]], ["Isberga", 85, ["939 Isberga"]], ["Kordula", 85, ["940 Kordula"]], ["Murray", 30, ["941 Murray"]], ["Romilda", 85, ["942 Romilda"]], ["Begonia", 85, ["943 Begonia"]], ["Hidalgo", 85, ["944 Hidalgo"]], ["Barcelona", 30, ["945 Barcelona"]], ["Poesia", 85, ["946 Poesia"]], ["Monterosa", 85, ["947 Monterosa"]], ["Jucunda", 85, ["948 Jucunda"]], ["Hel", 85, ["949 Hel"]], ["Ahrensa", 85, ["950 Ahrensa"]], ["Gaspra", 30, ["951 Gaspra"]], ["Caia", 85, ["952 Caia"]], ["Painleva", 85, ["953 Painleva"]], ["Li", 30, ["954 Li"]], ["Alstede", 85, ["955 Alstede"]], ["Elisa", 85, ["956 Elisa"]], ["Camelia", 85, ["957 Camelia"]], ["Asplinda", 85, ["958 Asplinda"]], ["Arne", 85, ["959 Arne"]], ["Birgit", 85, ["960 Birgit"]], ["Gunnie", 85, ["961 Gunnie"]], ["Aslog", 85, ["962 Aslog"]], ["Iduberga", 85, ["963 Iduberga"]], ["Subamara", 85, ["964 Subamara"]], ["Angelica", 85, ["965 Angelica"]], ["Muschi", 85, ["966 Muschi"]], ["Helionape", 85, ["967 Helionape"]], ["Petunia", 85, ["968 Petunia"]], ["Leocadia", 85, ["969 Leocadia"]], ["Primula", 85, ["970 Primula"]], ["Alsatia", 85, ["971 Alsatia"]], ["Cohnia", 85, ["972 Cohnia"]], ["Aralia", 85, ["973 Aralia"]], ["Lioba", 85, ["974 Lioba"]], ["Perseverantia", 85, ["975 Perseverantia"]], ["Benjamina", 85, ["976 Benjamina"]], ["Philippa", 85, ["977 Philippa"]], ["Aidamina", 85, ["978 Aidamina"]], ["Ilsewa", 85, ["979 Ilsewa"]], ["Anacostia", 85, ["980 Anacostia"]], ["Martina", 85, ["981 Martina"]], ["Franklina", 85, ["982 Franklina"]], ["Gunila", 85, ["983 Gunila"]], ["Gretia", 85, ["984 Gretia"]], ["Rosina", 85, ["985 Rosina"]], ["Amelia", 60, ["986 Amelia"]], ["Wallia", 85, ["987 Wallia"]], ["Appella", 85, ["988 Appella"]], ["Schwassmannia", 85, ["989 Schwassmannia"]], ["Yerkes", 85, ["990 Yerkes"]], ["McDonalda", 85, ["991 McDonalda"]], ["Swasey", 85, ["992 Swasey"]], ["Moultona", 85, ["993 Moultona"]], ["Otthild", 85, ["994 Otthild"]], ["Sternberga", 85, ["995 Sternberga"]], ["Hilaritas", 85, ["996 Hilaritas"]], ["Priska", 85, ["997 Priska"]], ["Bodea", 85, ["998 Bodea"]], ["Zachia", 85, ["999 Zachia"]], ["Piazzia", 100, ["1000 Piazzia"]]]], [{ "id": "best-picture-nominees", "family": "culture", "topic": "ON THE BALLOT", "prompt": "Name a film nominated for the Academy Award for Best Picture, through the 2026 ceremony. Winners count too.", "source": "Wikidata, film instances with P166/P1411 Academy Award for Best Picture (Q102427), English labels/aliases; CC0. Snapshot 2026-10-21, releases through 2025.", "ranking": "familiarity-v1" }, [["Gone with the Wind", 30, ["GWTW"]], ["12 Angry Men", 30, ["Twelve Angry Men"]], ["Star Wars: Episode IV \u2013 A New Hope", 60, ["1977 Star Wars", "A New Hope", "Star Wars", "Star Wars: A New Hope", "Star Wars: Episode IV"]], ["Braveheart", 85, []], ["Casablanca", 85, []], ["The Sting", 60, ["Sting"]], ["Life Is Beautiful", 10, ["La vita e bella", "La vita \xE8 bella"]], ["Citizen Kane", 60, []], ["The Silence of the Lambs", 30, ["Silence of the Lambs"]], ["The Bridge on the River Kwai", 85, ["Bridge on the River Kwai"]], ["Gladiator", 30, []], ["Cleopatra", 60, []], ["Argo", 85, []], ["American Beauty", 30, []], ["A Beautiful Mind", 10, ["Beautiful Mind"]], ["The King and I", 10, ["King and I"]], ["E.T. the Extra-Terrestrial", 85, ["E.T.", "ET"]], ["Dances with Wolves", 60, []], ["Avatar", 10, ["Avatar 1", "James Cameron's Avatar"]], ["Stagecoach", 85, []], ["42nd Street", 85, []], ["Hamlet", 60, []], ["Slumdog Millionaire", 85, []], ["Midnight Cowboy", 60, []], ["Titanic", 10, []], ["One Flew Over the Cuckoo's Nest", 85, []], ["Oliver!", 30, []], ["Inception", 60, []], ["Rocky", 30, ["1976 Rocky"]], ["Les Mis\xE9rables", 85, ["Miserables", "Mis\xE9rables"]], ["Unforgiven", 85, []], ["The English Patient", 30, ["English Patient"]], ["Lincoln", 30, []], ["Taxi Driver", 60, ["Alien"]], ["The Sound of Music", 30, ["Sound of Music"]], ["The Lord of the Rings: The Return of the King", 10, ["LOTR ROTK", "LOTR Return of the King", "Lord of the Rings: The Return of the King", "ROTK"]], ["Ghost", 30, []], ["Goodbye, Mr. Chips", 60, []], ["Goodfellas", 85, ["Wise Guy"]], ["The Godfather", 10, ["Godfather", "Godfather Part 1", "Godfather Part I", "The Godfather Part I"]], ["No Country for Old Men", 10, []], ["The French Connection", 30, ["French Connection"]], ["All About Eve", 30, []], ["The King's Speech", 60, ["King's Speech"]], ["It Happened One Night", 10, ["Night Bus"]], ["Lawrence of Arabia", 60, []], ["Chariots of Fire", 85, []], ["The Departed", 60, ["Departed"]], ["Amadeus", 85, []], ["Million Dollar Baby", 30, []], ["Marty", 60, []], ["The Hurt Locker", 60, ["Hurt Locker"]], ["Platoon", 60, []], ["The Godfather Part II", 60, ["Godfather Part II", "Part II"]], ["Crash", 30, []], ["From Here to Eternity", 60, []], ["Out of Africa", 30, []], ["Rain Man", 30, []], ["Driving Miss Daisy", 60, []], ["Shakespeare in Love", 60, []], ["Chicago", 30, []], ["Gandhi", 60, []], ["Rebecca", 60, []], ["Terms of Endearment", 85, []], ["The Artist", 60, ["Artist"]], ["Ben-Hur", 85, []], ["On the Waterfront", 60, []], ["The Deer Hunter", 60, ["Deer Hunter", "Voyage au bout de l'enfer"]], ["Kramer vs. Kramer", 60, []], ["My Fair Lady", 30, []], ["Annie Hall", 60, []], ["The Best Years of Our Lives", 30, ["Best Years of Our Lives"]], ["The Great Dictator", 60, ["Great Dictator"]], ["The Great Ziegfeld", 85, ["Great Ziegfeld"]], ["Patton", 60, []], ["All Quiet on the Western Front", 60, ["Im Westen nichts Neues"]], ["Grand Hotel", 30, []], ["The Greatest Show on Earth", 30, ["Greatest Show on Earth"]], ["Places in the Heart", 30, []], ["She Done Him Wrong", 10, ["Lady Lou"]], ["The Lost Weekend", 30, ["Lost Weekend"]], ["The Broadway Melody", 60, ["Broadway Melody"]], ["Schindler's List", 85, []], ["Mutiny on the Bounty", 60, []], ["How Green Was My Valley", 30, []], ["In the Heat of the Night", 30, []], ["The Prince of Tides", 60, ["Prince of Tides"]], ["The Last Emperor", 30, ["L'ultimo imperatore", "Last Emperor", "Le dernier empereur"]], ["An American in Paris", 30, ["American in Paris"]], ["Wings", 30, []], ["Gigi", 60, []], ["Cimarron", 85, []], ["Tom Jones", 30, []], ["Dr. Strangelove", 85, ["Dr. Strangelove or: How I Learned to Stop Worrying and Love the Bomb", "How I Learned to Stop Worrying and Love the Bomb"]], ["A Man for All Seasons", 30, ["Man for All Seasons"]], ["Juno", 60, []], ["You Can't Take It With You", 10, []], ["West Side Story", 30, []], ["The Life of Emile Zola", 85, ["Life of Emile Zola"]], ["Mrs. Miniver", 85, []], ["Ordinary People", 30, []], ["The Apartment", 30, ["Apartment"]], ["Going My Way", 10, []], ["Pulp Fiction", 60, []], ["A Few Good Men", 10, ["Few Good Men"]], ["Z", 30, []], ["Gangs of New York", 60, []], ["Gentleman's Agreement", 85, []], ["Zero Dark Thirty", 30, []], ["How the West Was Won", 30, []], ["Brokeback Mountain", 85, []], ["All the King's Men", 60, []], ["The Piano", 30, ["Piano"]], ["In the Bedroom", 30, []], ["Apollo 13", 60, []], ["Silver Linings Playbook", 85, []], ["San Francisco", 30, []], ["Around the World in 80 Days", 30, []], ["Gosford Park", 85, []], ["The Pianist", 60, ["Le Pianiste", "Pianist"]], ["The Reader", 30, ["Reader"]], ["Munich", 60, []], ["The Fugitive", 60, ["Fugitive"]], ["The Hours", 10, ["Hours"]], ["Cavalcade", 85, []], ["Lost in Translation", 30, []], ["Working Girl", 10, []], ["Traffic", 30, []], ["12 Years a Slave", 30, ["Twelve Years a Slave"]], ["Beasts of the Southern Wild", 60, []], ["The Lord of the Rings: The Fellowship of the Ring", 60, ["FOTR", "LOTR FOTR", "LOTR Fellowship of the Ring", "Lord of the Rings: The Fellowship of the Ring", "The Fellowship of the Ring"]], ["One Hundred Men and a Girl", 30, ["100 men and a girl"]], ["Dead Poets Society", 60, []], ["The Lives of a Bengal Lancer", 85, ["Lives of a Bengal Lancer"]], ["Inglourious Basterds", 85, []], ["Life of Pi", 60, []], ["Apocalypse Now", 60, ["Apocalypse Now Final Cut"]], ["Dodsworth", 85, []], ["To Kill a Mockingbird", 85, []], ["Bonnie and Clyde", 60, []], ["The Sixth Sense", 30, ["6th Sense", "Sixth Sense"]], ["Sunset Boulevard", 60, ["Sunset Blvd."]], ["The Lord of the Rings: The Two Towers", 60, ["LOTR TTT", "LOTR Two Towers", "Lord of the Rings: The Two Towers", "TTT"]], ["Spotlight", 60, []], ["Saving Private Ryan", 30, []], ["Birdman", 85, ["Birdman or (The Unexpected Virtue of Ignorance)"]], ["Raiders of the Lost Ark", 60, ["Indiana Jones and the Raiders of the Lost Ark"]], ["The Crying Game", 30, ["Crying Game"]], ["Seabiscuit", 85, []], ["Midnight Express", 30, []], ["The Social Network", 30, ["Social Network"]], ["The Shawshank Redemption", 30, ["Shawshank", "Shawshank Redemption"]], ["Up", 10, []], ["A Clockwork Orange", 60, ["Clockwork Orange"]], ["Toy Story 3", 30, []], ["127 Hours", 60, []], ["Beauty and the Beast", 30, ["Beauty and the Beast (1991 film)"]], ["Black Swan", 60, []], ["The Aviator", 85, ["Aviator"]], ["The Shape of Water", 30, ["Shape of Water"]], ["Parasite", 30, ["Gisaengchung"]], ["Oppenheimer", 10, []], ["Nomadland", 85, []], ["Good Will Hunting", 30, []], ["Finding Neverland", 85, []], ["Midnight in Paris", 30, []], ["Everything Everywhere All at Once", 30, ["EEAAO"]], ["CODA", 60, []], ["A Room with a View", 30, ["Room with a View"]], ["Babel", 85, ["BlackSheep"]], ["The Talk of the Town", 10, ["Talk of the Town"]], ["Jaws", 30, []], ["Milk", 30, []], ["Moonlight", 60, []], ["The Curious Case of Benjamin Button", 60, ["Curious Case of Benjamin Button"]], ["Green Book", 30, []], ["District 9", 30, ["District Nine"]], ["The Godfather Part III", 60, ["Godfather Part III", "Part III"]], ["Moulin Rouge!", 85, []], ["The Adventures of Robin Hood", 60, ["Adventures of Robin Hood"]], ["It's a Wonderful Life", 30, []], ["Witness for the Prosecution", 60, []], ["The Wizard of Oz", 60, ["Wizard of Oz"]], ["The Blind Side", 30, ["Blind Side"]], ["Roman Holiday", 30, []], ["Anora", 60, []], ["Little Women", 10, []], ["The Help", 10, ["Help"]], ["One Battle After Another", 30, ["BC Project", "Baktan Cross", "Desert Highway", "The Battle of Baktan Cross"]], ["Erin Brockovich", 85, []], ["The Thin Red Line", 30, ["Thin Red Line"]], ["The Queen", 30, ["Queen"]], ["Mystic River", 60, []], ["Chocolat", 85, ["Le Chocolat"]], ["Hugo", 60, []], ["The Color Purple", 30, ["Color Purple"]], ["The Maltese Falcon", 85, ["Maltese Falcon"]], ["Raging Bull", 60, []], ["The Green Mile", 30, ["Green Mile"]], ["Mary Poppins", 85, []], ["A Streetcar Named Desire", 85, ["Streetcar Named Desire"]], ["Fargo", 60, []], ["The Graduate", 30, ["Graduate"]], ["Tootsie", 85, []], ["Up in the Air", 10, []], ["Bugsy", 85, []], ["As Good as It Gets", 10, []], ["War Horse", 30, []], ["Crouching Tiger, Hidden Dragon", 85, ["Wu Hu Zang Long"]], ["There Will Be Blood", 10, []], ["The Descendants", 60, ["Descendants", "Family Tree"]], ["The Fighter", 30, ["Fighter"]], ["Winter's Bone", 85, []], ["Who's Afraid of Virginia Woolf?", 60, []], ["Judgment at Nuremberg", 85, []], ["True Grit", 60, []], ["L.A. Confidential", 60, []], ["Doctor Zhivago", 85, []], ["Imitation of Life", 60, []], ["The Awful Truth", 30, ["Awful Truth"]], ["Butch Cassidy and the Sundance Kid", 85, []], ["The Mission", 30, ["Mission"]], ["Precious", 30, ['Precious: Based on the Novel "Push" by Sapphire']], ["Il Postino: The Postman", 85, ["Il Postino", "Postino: The Postman", "The Postman"]], ["The Treasure of the Sierra Madre", 85, ["Treasure of the Sierra Madre"]], ["Libeled Lady", 85, []], ["The Citadel", 60, ["Citadel", "The Citadel (1938)"]], ["The Exorcist", 85, ["Exorcist", "The Exorcist: Director's Cut"]], ["Lilies of the Field", 60, []], ["Letters from Iwo Jima", 85, []], ["Scent of a Woman", 60, []], ["In the Name of the Father", 10, []], ["The Elephant Man", 60, ["Elephant Man"]], ["Jerry Maguire", 60, []], ["The Accidental Tourist", 60, ["Accidental Tourist"]], ["Henry V", 30, []], ["A Serious Man", 10, ["Serious Man"]], ["Good Night, and Good Luck.", 30, ["Good Night", "and Good Luck"]], ["The Towering Inferno", 85, ["Towering Inferno"]], ["Moneyball", 85, []], ["Seventh Heaven", 60, ["7th Heaven"]], ["Captains Courageous", 60, []], ["High Noon", 30, []], ["Lady for a Day", 30, []], ["The Tree of Life", 30, ["Tree of Life"]], ["Random Harvest", 60, []], ["Secrets & Lies", 30, ["Secrets & Lies (movie)", "Secrets and Lies (film)"]], ["La Grande Illusion", 60, ["Grand Illusion", "Grande Illusion"]], ["The Kids Are All Right", 10, ["Kids Are All Right"]], ["MASH", 60, []], ["Prizzi's Honor", 85, []], ["Spellbound", 85, ["Spellbound (1945 film)"]], ["On Golden Pond", 60, []], ["The Insider", 60, ["Insider"]], ["The Turning Point", 30, ["Turning Point"]], ["Capote", 85, []], ["An Education", 10, []], ["The Longest Day", 30, ["Le Jour le plus long", "Longest Day"]], ["Anatomy of a Murder", 60, []], ["Missing", 10, []], ["American Graffiti", 60, []], ["Barry Lyndon", 60, []], ["All the President's Men", 60, ["Todos los hombres del presidente"]], ["Skippy", 85, []], ["Mr. Deeds Goes to Town", 60, []], ["The Quiet Man", 30, ["Quiet Man"]], ["The Informer", 85, ["Informer"]], ["Dog Day Afternoon", 30, []], ["Double Indemnity", 85, []], ["Born on the Fourth of July", 30, []], ["The Champ", 60, ["Champ"]], ["Born Yesterday", 30, []], ["Hello, Dolly!", 60, []], ["Alfie", 60, []], ["Airport", 30, []], ["Network", 10, ["Union Broadcasting System"]], ["Jezebel", 85, []], ["The Emigrants", 100, ["1971 Emigrants", "1971 The Emigrants", "Emigrants"]], ["The Killing Fields", 30, ["Killing Fields", "La Dechirure", "La D\xE9chirure"]], ["Nicholas and Alexandra", 60, []], ["Bound for Glory", 30, []], ["Crossfire", 85, []], ["Wilson", 30, []], ["The Philadelphia Story", 30, ["Philadelphia Story"]], ["Ninotchka", 85, []], ["Witness", 30, []], ["Here Comes Mr. Jordan", 30, []], ["Sayonara", 85, []], ["Django Unchained", 85, []], ["Reds", 60, []], ["Madame Curie", 85, []], ["For Whom the Bell Tolls", 60, []], ["The Red Shoes", 30, ["Red Shoes"]], ["Field of Dreams", 30, []], ["Sense and Sensibility", 60, []], ["Fatal Attraction", 60, []], ["The Magnificent Ambersons", 85, ["Magnificent Ambersons"]], ["The Big House", 10, ["Big House"]], ["Frost/Nixon", 60, []], ["Elizabeth", 30, []], ["Amour", 85, []], ["The Dresser", 60, ["Dresser"]], ["The Cider House Rules", 60, ["Cider House Rules"]], ["The Bells of St. Mary's", 60, ["Bells of St. Mary's"]], ["Romeo and Juliet", 60, []], ["Room at the Top", 10, []], ["The Front Page", 30, ["Front Page"]], ["Sideways", 60, []], ["Heaven Can Wait", 30, []], ["The Little Foxes", 60, ["Little Foxes"]], ["Anchors Aweigh", 85, []], ["The Rose Tattoo", 60, ["Rose Tattoo"]], ["The Snake Pit", 60, ["Snake Pit"]], ["The Good Earth", 10, ["Good Earth"]], ["Atlantic City", 30, []], ["The Verdict", 60, ["Verdict"]], ["The Diary of Anne Frank", 60, ["Diary of Anne Frank"]], ["My Left Foot", 30, ["My Left Foot: The Story of Christy Brown"]], ["Rachel, Rachel", 60, []], ["Dark Victory", 30, []], ["Seven Brides for Seven Brothers", 60, []], ["The Grapes of Wrath", 60, ["Grapes of Wrath"]], ["JFK", 60, []], ["The Goodbye Girl", 30, ["Goodbye Girl"]], ["The Ten Commandments", 60, ["Ten Commandments"]], ["The Full Monty", 60, ["Full Monty"]], ["Guess Who's Coming to Dinner", 30, []], ["Love Story", 10, []], ["Love Is a Many-Splendored Thing", 85, []], ["Shine", 30, []], ["Giant", 30, []], ["The Razor's Edge", 85, ["Razor's Edge"]], ["Babe", 30, ["A Pig Named Babe", "A Piglet Named Babe"]], ["The Nun's Story", 85, ["Nun's Story"]], ["Michael Clayton", 60, []], ["Her", 10, []], ["The Song of Bernadette", 60, ["Song of Bernadette"]], ["Chinatown", 60, []], ["A Place in the Sun", 30, ["Place in the Sun"]], ["The Guns of Navarone", 85, ["Carl Foreman's Production The Guns of Navarone", "Guns of Navarone"]], ["Breaking Away", 30, []], ["Ray", 30, ["Ray (film)"]], ["Disraeli", 85, []], ["The Music Man", 10, ["Music Man"]], ["Dead End", 10, []], ["In Old Arizona", 30, []], ["Cat on a Hot Tin Roof", 60, []], ["Julius Caesar", 60, []], ["Ivanhoe", 85, []], ["Arrowsmith", 85, []], ["Boys Town", 30, []], ["Zorba the Greek", 85, ["Zorba"]], ["Cabaret", 60, []], ["Deliverance", 85, []], ["Four Weddings and a Funeral", 60, []], ["Howards End", 85, []], ["Anne of the Thousand Days", 30, []], ["Cries and Whispers", 60, []], ["Dangerous Liaisons", 85, []], ["Blossoms in the Dust", 60, []], ["Awakenings", 85, []], ["Hannah and Her Sisters", 60, []], ["Becket", 85, []], ["Foreign Correspondent", 60, []], ["A Star Is Born", 30, ["Star Is Born"]], ["Gaslight", 85, []], ["Bad Girl", 10, []], ["Five Star Final", 30, []], ["Mr. Smith Goes to Washington", 30, ["Frank Capra's Mr. Smith Goes to Washington"]], ["The Patriot", 60, ["Patriot"]], ["Wuthering Heights", 85, []], ["Trader Horn", 60, []], ["Five Easy Pieces", 30, []], ["Master and Commander: The Far Side of the World", 30, []], ["Shane", 60, []], ["Coming Home", 10, []], ["One Foot in Heaven", 30, []], ["The Robe", 60, ["Robe"]], ["Tender Mercies", 85, []], ["East Lynne", 60, []], ["Mississippi Burning", 60, []], ["Mildred Pierce", 60, []], ["I Am a Fugitive from a Chain Gang", 60, []], ["Sergeant York", 60, []], ["The Sand Pebbles", 60, ["Sand Pebbles"]], ["The Heiress", 85, ["Heiress"]], ["In Which We Serve", 30, []], ["Stage Door", 30, []], ["The Gay Divorcee", 85, ["Gay Divorcee"]], ["The Conversation", 30, ["Conversation"]], ["Julia", 30, []], ["Watch on the Rhine", 60, []], ["The Divorcee", 85, ["Divorcee"]], ["Top Hat", 30, []], ["The Hustler", 85, ["Hustler"]], ["Ship of Fools", 60, ["El barco de los locos"]], ["The Defiant Ones", 60, ["Defiant Ones"]], ["Fiddler on the Roof", 85, []], ["The Hollywood Revue of 1929", 85, ["Hollywood Revue of 1929", "The Hollywood Revue"]], ["Doctor Dolittle", 85, []], ["Here Comes the Navy", 30, []], ["A Letter to Three Wives", 60, ["Letter to Three Wives"]], ["Flirtation Walk", 85, []], ["Father of the Bride", 60, []], ["Extremely Loud and Incredibly Close", 60, ["Extremely Loud & Incredibly Close"]], ["The Long Voyage Home", 60, ["Long Voyage Home"]], ["The Right Stuff", 10, ["Right Stuff"]], ["The Last Picture Show", 30, ["Last Picture Show"]], ["Tess", 60, []], ["Yankee Doodle Dandy", 85, []], ["The Thin Man", 30, ["Myrna Loy", "Thin Man"]], ["Ruggles of Red Gap", 85, []], ["A Passage to India", 30, ["Passage to India"]], ["Kiss of the Spider Woman", 60, []], ["Auntie Mame", 85, []], ["Naughty Marietta", 85, []], ["The Country Girl", 10, ["Country Girl"]], ["An Unmarried Woman", 60, ["Unmarried Woman"]], ["Hold Back the Dawn", 30, []], ["David Copperfield", 85, []], ["The Big Chill", 30, ["Big Chill"]], ["The Letter", 30, ["Letter"]], ["The White Parade", 30, ["White Parade"]], ["Picnic", 60, []], ["Elmer Gantry", 85, []], ["The Lion in Winter", 30, ["Lion in Winter"]], ["Pygmalion", 85, []], ["Great Expectations", 30, []], ["One Hour with You", 10, []], ["America America", 30, ["America"]], ["The Pride of the Yankees", 60, ["Pride of the Yankees"]], ["The Private Life of Henry VIII", 60, ["Private Life of Henry VIII"]], ["The Yearling", 85, ["Yearling"]], ["A Midsummer Night's Dream", 85, ["Midsummer Night's Dream"]], ["Twelve O'Clock High", 60, []], ["Moonstruck", 85, []], ["Coal Miner's Daughter", 85, []], ["Test Pilot", 30, []], ["Anthony Adverse", 60, []], ["The House of Rothschild", 60, ["House of Rothschild"]], ["The Barretts of Wimpole Street", 85, ["Barretts of Wimpole Street"]], ["Three Smart Girls", 30, []], ["The Sundowners", 85, ["Sundowners"]], ["The Smiling Lieutenant", 60, ["Smiling Lieutenant"]], ["The Russians Are Coming, the Russians Are Coming", 60, ["Russians Are Coming", "Russians Are Coming, the Russians Are Coming", "The \u042Fussia\u0438s Are Comin\u262D The \u042Fussia\u0438s Are Comin\u262D", "the Russians Are Coming"]], ["The Ox-Bow Incident", 100, ["Ox-Bow Incident"]], ["A Touch of Class", 30, ["Touch of Class"]], ["Lenny", 60, []], ["All That Jazz", 30, []], ["Suspicion", 60, []], ["In Old Chicago", 30, []], ["A Farewell to Arms", 60, ["Farewell to Arms"]], ["Of Mice and Men", 60, []], ["Hope and Glory", 30, []], ["Alexander's Ragtime Band", 85, []], ["Norma Rae", 60, []], ["Alice Adams", 60, []], ["Sounder", 85, []], ["Nashville", 60, []], ["Friendly Persuasion", 60, []], ["Separate Tables", 30, []], ["Sons and Lovers", 60, []], ["Peyton Place", 60, []], ["Wake Island", 30, []], ["Alibi", 60, []], ["Three Coins in the Fountain", 60, []], ["All This, and Heaven Too", 30, ["'' All This", "and Heaven Too ''"]], ["Mister Roberts", 60, []], ["Our Town", 10, []], ["King Solomon's Mines", 85, []], ["Miracle on 34th Street", 60, []], ["Battleground", 85, []], ["Love Affair", 30, []], ["Children of a Lesser God", 30, []], ["49th Parallel", 60, ["The Invaders"]], ["A Thousand Clowns", 60, ["Thousand Clowns"]], ["Broadcast News", 30, []], ["Funny Girl", 30, []], ["State Fair", 30, []], ["The Love Parade", 30, ["Love Parade"]], ["The Alamo", 85, ["Alamo"]], ["Smilin' Through", 85, []], ["The Story of Louis Pasteur", 85, ["Story of Louis Pasteur"]], ["The Wolf of Wall Street", 30, ["Wolf of Wall Street"]], ["The More the Merrier", 85, ["More the Merrier"]], ["Decision Before Dawn", 30, []], ["A Soldier's Story", 85, ["Soldier's Story"]], ["Since You Went Away", 10, []], ["The Bishop's Wife", 85, ["Bishop's Wife"]], ["One Night of Love", 10, []], ["Captain Blood", 30, []], ["The Pied Piper", 85, ["Pied Piper"]], ["The Racket", 60, ["Racket"]], ["Kitty Foyle", 85, ["The natural history of a woman"]], ["Fanny", 60, []], ["A Tale of Two Cities", 30, ["Tale of Two Cities"]], ["The Human Comedy", 30, ["Human Comedy"]], ["Shanghai Express", 60, []], ["Lost Horizon", 60, []], ["Kings Row", 30, []], ["Johnny Belinda", 85, []], ["Four Daughters", 30, []], ["Viva Villa!", 60, []], ["Broadway Melody of 1936", 60, []], ["Boyhood", 85, []], ["The Remains of the Day", 30, ["Remains of the Day"]], ["The Big Short", 10, ["Big Short"]], ["Mad Max: Fury Road", 60, ["Fury Road", "Mad Max 4"]], ["Arrival", 30, []], ["The Caine Mutiny", 85, ["Caine Mutiny"]], ["Brooklyn", 30, []], ["Selma", 60, []], ["The Martian", 60, ["Martian"]], ["Dallas Buyers Club", 60, []], ["Atonement", 85, []], ["Hacksaw Ridge", 85, []], ["Philomena", 85, []], ["Captain Phillips", 60, ["A Captain's Duty", "Capitaine Phillips"]], ["Avatar: The Way of Water", 60, ["Avatar 2", "Avatar 2: The Way of Water", "Avatar II"]], ["Manchester by the Sea", 30, []], ["Nebraska", 60, []], ["The Revenant", 85, ["Revenant"]], ["The Grand Budapest Hotel", 60, ["Grand Budapest Hotel"]], ["American Sniper", 60, []], ["Room", 10, []], ["The Imitation Game", 60, ["Imitation Game"]], ["Hell or High Water", 30, []], ["Whiplash", 85, []], ["Gravity", 30, []], ["The Theory of Everything", 30, ["Theory of Everything"]], ["Bridge of Spies", 60, []], ["American Hustle", 60, []], ["Dunkirk", 60, ["Dunkirk 70mm", "Dunkirk The IMAX 2D Experience", "Dunkirk The IMAX Experience in 70mm Film", "Dunkirk: The IMAX 2D Experience", "Dunkirk: The IMAX Experience in 70mm Film"]], ["Barbie", 10, ["Barbie The Movie", "Barbie: The Movie", "The Movie"]], ["The Irishman", 85, ["I Heard You Paint Houses", "Irishman"]], ["Vice", 30, []], ["Lion", 30, []], ["The Father", 10, ["Father"]], ["The Post", 10, ["Post"]], ["Three Billboards Outside Ebbing, Missouri", 85, ["3 Billboards", "3 Billboards Outside Ebbing", "Missouri", "Three Billboards"]], ["Get Out", 10, []], ["Bohemian Rhapsody", 85, []], ["BlacKkKlansman", 85, []], ["Sound of Metal", 30, []], ["Roma", 60, []], ["Fences", 60, []], ["Marriage Story", 30, []], ["1917", 60, []], ["King Richard", 30, []], ["The Favourite", 30, ["Favourite"]], ["Darkest Hour", 60, []], ["Lady Bird", 30, []], ["Minari", 85, []], ["Ford v Ferrari", 60, ["Ford versus Ferrari", "Ford vs Ferrari", "Le Mans '66", "Le Mans 1966", "Le Mans 66"]], ["Joker", 60, []], ["Once Upon a Time in Hollywood", 30, ["OUATIH", "Once In Hollywood"]], ["Hidden Figures", 30, []], ["Call Me by Your Name", 10, []], ["Jojo Rabbit", 60, []], ["The Power of the Dog", 30, ["Power of the Dog"]], ["The Trial of the Chicago 7", 30, ["Trial of the Chicago 7"]], ["Black Panther", 60, []], ["Phantom Thread", 60, []], ["Dune", 60, ["Dune (2021)", "Dune: Part One"]], ["The Zone of Interest", 30, ["Zone of Interest"]], ["T\xE1r", 85, []], ["Judas and the Black Messiah", 60, ["Jesus Was My Homeboy"]], ["Belfast", 60, []], ["Licorice Pizza", 85, []], ["Triangle of Sadness", 60, []], ["Past Lives", 30, []], ["The Banshees of Inisherin", 85, ["Banshees of Inisherin"]], ["The Fabelmans", 85, ["Fabelmans"]], ["The Brutalist", 85, ["Brutalist"]], ["Promising Young Woman", 60, []], ["Poor Things", 10, []], ["Mank", 85, []], ["Women Talking", 10, []], ["Elvis", 60, []], ["The Substance", 30, ["Substance"]], ["Drive My Car", 30, []], ["Nightmare Alley", 60, []], ["Don't Look Up", 10, []], ["Sentimental Value", 60, []], ["The Secret Agent", 30, ["O Agente Secreto", "Secret Agent"]], ["Emilia P\xE9rez", 85, []], ["Nickel Boys", 60, ["The Nickel Boys"]], ["Anatomy of a Fall", 60, ["Anatomie d'une chute"]], ["I'm Still Here", 10, ["Ainda Estou Aqui"]]]], [{ "id": "best-picture-winners", "family": "culture", "topic": "THE GOLD ENVELOPE", "prompt": "Name a film that won the Academy Award for Best Picture, through the 2026 ceremony.", "source": "Wikidata, film instances with P166/P1411 Academy Award for Best Picture (Q102427), English labels/aliases; CC0. Snapshot 2026-10-21, releases through 2025.", "ranking": "familiarity-v1" }, [["Gone with the Wind", 30, ["GWTW"]], ["Braveheart", 85, []], ["Casablanca", 85, []], ["The Sting", 60, ["Sting"]], ["The Silence of the Lambs", 30, ["Silence of the Lambs"]], ["The Bridge on the River Kwai", 85, ["Bridge on the River Kwai"]], ["Gladiator", 30, []], ["Argo", 85, []], ["American Beauty", 30, []], ["A Beautiful Mind", 10, ["Beautiful Mind"]], ["Dances with Wolves", 60, []], ["Hamlet", 60, []], ["Slumdog Millionaire", 85, []], ["Midnight Cowboy", 60, []], ["Titanic", 10, []], ["One Flew Over the Cuckoo's Nest", 85, []], ["Oliver!", 30, []], ["Rocky", 30, ["1976 Rocky"]], ["Unforgiven", 85, []], ["The English Patient", 30, ["English Patient"]], ["The Sound of Music", 30, ["Sound of Music"]], ["The Lord of the Rings: The Return of the King", 10, ["LOTR ROTK", "LOTR Return of the King", "Lord of the Rings: The Return of the King", "ROTK"]], ["The Godfather", 10, ["Godfather", "Godfather Part 1", "Godfather Part I", "The Godfather Part I"]], ["No Country for Old Men", 10, []], ["The French Connection", 30, ["French Connection"]], ["All About Eve", 30, []], ["The King's Speech", 60, ["King's Speech"]], ["It Happened One Night", 10, ["Night Bus"]], ["Lawrence of Arabia", 60, []], ["Chariots of Fire", 85, []], ["The Departed", 60, ["Departed"]], ["Amadeus", 85, []], ["Million Dollar Baby", 30, []], ["Marty", 60, []], ["The Hurt Locker", 60, ["Hurt Locker"]], ["Platoon", 60, []], ["The Godfather Part II", 60, ["Godfather Part II", "Part II"]], ["Crash", 30, []], ["From Here to Eternity", 60, []], ["Out of Africa", 30, []], ["Rain Man", 30, []], ["Driving Miss Daisy", 60, []], ["Shakespeare in Love", 60, []], ["Chicago", 30, []], ["Gandhi", 60, []], ["Rebecca", 60, []], ["Terms of Endearment", 85, []], ["The Artist", 60, ["Artist"]], ["Ben-Hur", 85, []], ["On the Waterfront", 60, []], ["The Deer Hunter", 60, ["Deer Hunter", "Voyage au bout de l'enfer"]], ["Kramer vs. Kramer", 60, []], ["My Fair Lady", 30, []], ["Annie Hall", 60, []], ["The Best Years of Our Lives", 30, ["Best Years of Our Lives"]], ["The Great Ziegfeld", 85, ["Great Ziegfeld"]], ["Patton", 60, []], ["All Quiet on the Western Front", 60, ["Im Westen nichts Neues"]], ["Grand Hotel", 30, []], ["The Greatest Show on Earth", 30, ["Greatest Show on Earth"]], ["The Lost Weekend", 30, ["Lost Weekend"]], ["The Broadway Melody", 100, ["Broadway Melody"]], ["Schindler's List", 85, []], ["Mutiny on the Bounty", 60, []], ["How Green Was My Valley", 30, []], ["In the Heat of the Night", 30, []], ["The Last Emperor", 30, ["L'ultimo imperatore", "Last Emperor", "Le dernier empereur"]], ["An American in Paris", 30, ["American in Paris"]], ["Wings", 30, []], ["Gigi", 60, []], ["Cimarron", 85, []], ["Tom Jones", 30, []], ["A Man for All Seasons", 30, ["Man for All Seasons"]], ["You Can't Take It With You", 10, []], ["West Side Story", 30, []], ["The Life of Emile Zola", 85, ["Life of Emile Zola"]], ["Mrs. Miniver", 85, []], ["Ordinary People", 30, []], ["The Apartment", 30, ["Apartment"]], ["Going My Way", 10, []], ["Gentleman's Agreement", 85, []], ["All the King's Men", 60, []], ["Around the World in 80 Days", 30, []], ["Cavalcade", 100, []], ["12 Years a Slave", 30, ["Twelve Years a Slave"]], ["Spotlight", 60, []], ["Birdman", 85, ["Birdman or (The Unexpected Virtue of Ignorance)"]], ["The Shape of Water", 30, ["Shape of Water"]], ["Parasite", 30, ["Gisaengchung"]], ["Oppenheimer", 10, []], ["Nomadland", 85, []], ["Everything Everywhere All at Once", 30, ["EEAAO"]], ["CODA", 60, []], ["Moonlight", 60, []], ["Green Book", 30, []], ["Anora", 60, []], ["One Battle After Another", 30, ["BC Project", "Baktan Cross", "Desert Highway", "The Battle of Baktan Cross"]]]], [{ "id": "atlantic-rivers", "family": "world", "topic": "TO THE ATLANTIC", "prompt": "Name a river whose water eventually reaches the Atlantic, including the Mediterranean, Black Sea, Baltic, or Gulf of Mexico. Tributaries count.", "source": "Corpora rivers, CC0; outflows recursively traced to ocean basins. River Plate and Hudson Bay classified with Atlantic drainage. Finite long-river source; additional valid rivers may be absent.", "ranking": "familiarity-v1" }, [["Nile", 10, ["Nile River"]], ["Kagera", 85, ["Kagera River"]], ["Amazon", 10, ["Amazon River"]], ["Ucayali", 85, ["Ucayali River"]], ["Apur\xEDmac", 85, ["Apur\xEDmac River"]], ["Mississippi", 10, ["Mississippi River"]], ["Missouri", 10, ["Missouri River"]], ["Jefferson", 60, ["Jefferson River"]], ["Paran\xE1", 85, ["Paran\xE1 River"]], ["R\xEDo de la Plata", 85, ["R\xEDo de la Plata River"]], ["Congo", 30, ["Congo River"]], ["Chambeshi", 100, ["Chambeshi River"]], ["Niger", 60, ["Niger River"]], ["Tocantins", 85, ["Tocantins River"]], ["Araguaia", 85, ["Araguaia River"]], ["Madeira", 85, ["Madeira River"]], ["Mamor\xE9", 85, ["Mamor\xE9 River"]], ["Grande", 60, ["Grande River"]], ["Caine", 85, ["Caine River"]], ["Rocha", 85, ["Rocha River"]], ["Pur\xFAs", 85, ["Pur\xFAs River"]], ["S\xE3o Francisco", 60, ["S\xE3o Francisco River"]], ["Saint Lawrence", 60, ["Saint Lawrence River", "St Lawrence", "St. Lawrence River"]], ["Niagara", 60, ["Niagara River"]], ["Detroit", 30, ["Detroit River"]], ["Saint Clair", 60, ["Saint Clair River"]], ["Saint Marys", 85, ["Saint Marys River"]], ["Saint Louis", 30, ["Saint Louis River"]], ["Rio Grande", 60, ["Rio Bravo", "Rio Grande River"]], ["Danube", 30, ["Danube River"]], ["Breg", 85, ["Breg River"]], ["Japur\xE1", 85, ["Japur\xE1 River"]], ["Nelson", 30, ["Nelson River"]], ["Saskatchewan", 60, ["Saskatchewan River"]], ["Paraguay", 60, ["Paraguay River"]], ["Pilcomayo", 85, ["Pilcomayo River"]], ["Juru\xE1", 85, ["Juru\xE1 River"]], ["Arkansas", 60, ["Arkansas River"]], ["Dnieper", 85, ["Dnieper River"]], ["Ubangi", 85, ["Ubangi River"]], ["Uele", 85, ["Uele River"]], ["Negro", 60, ["Negro River"]], ["Red", 10, ["Red River"]], ["Kasai", 85, ["Kasai River"]], ["Ohio", 30, ["Ohio River"]], ["Allegheny", 85, ["Allegheny River"]], ["Orinoco", 85, ["Orinoco River"]], ["Xingu", 85, ["Xingu River"]], ["Orange", 30, ["Orange River"]], ["Northern Salado", 85, ["Northern Salado River"]], ["Tapaj\xF3s", 85, ["Tapaj\xF3s River"]], ["Don", 30, ["Don River"]], ["Guapor\xE9", 85, ["Guapor\xE9 River"]], ["Senegal", 60, ["Senegal River"]], ["Uruguay", 60, ["Uruguay River"]], ["Blue Nile", 60, ["Blue Nile River"]], ["Churchill", 60, ["Churchill River"]], ["Volta", 85, ["Volta River"]], ["Beni", 85, ["Beni River"]], ["Platte", 85, ["Platte River"]], ["I\xE7\xE1", 85, ["I\xE7\xE1 River"]], ["Magdalena", 85, ["Magdalena River"]], ["Pecos", 85, ["Pecos River"]], ["Mara\xF1\xF3n", 85, ["Mara\xF1\xF3n River"]], ["Dniester", 85, ["Dniester River"]], ["Benue", 85, ["Benue River"]], ["Brazos", 85, ["Brazos River"]], ["Cauca", 85, ["Cauca River"]], ["Igua\xE7u", 85, ["Igua\xE7u River"]], ["Iriri", 85, ["Iriri River"]], ["Lomami", 85, ["Lomami River"]], ["Ottawa", 60, ["Ottawa River"]], ["Elbe", 85, ["Elbe River"]], ["Vltava", 85, ["Vltava River"]], ["Juruena", 85, ["Juruena River"]], ["Upper Mississippi", 60, ["Upper Mississippi River"]], ["Rhine", 30, ["Rhine River"]], ["Canadian", 30, ["Canadian River"]], ["North Saskatchewan", 60, ["North Saskatchewan River"]], ["Vaal", 85, ["Vaal River"]], ["K\u0131z\u0131l", 85, ["K\u0131z\u0131l River"]], ["Milk", 30, ["Milk River"]], ["Sankuru", 85, ["Sankuru River"]], ["James", 10, ["James River"]], ["Desna", 85, ["Desna River"]], ["Madre de Dios", 85, ["Madre de Dios River"]], ["Tiet\xEA", 85, ["Tiet\xEA River"]], ["Cimarron", 85, ["Cimarron River"]], ["Cumberland", 60, ["Cumberland River"]], ["White", 10, ["White River"]], ["Huallaga", 85, ["Huallaga River"]], ["Kwango", 85, ["Kwango River"]], ["Draa", 85, ["Draa River"]], ["Gambia", 85, ["Gambia River"]], ["Yellowstone", 60, ["Yellowstone River"]], ["Seversky Donets", 85, ["Seversky Donets River"]], ["Bermejo", 85, ["Bermejo River"]], ["Guaviare", 85, ["Guaviare River"]], ["Tennessee", 30, ["Tennessee River"]], ["Vistula", 85, ["Vistula River"]], ["Aruwimi", 85, ["Aruwimi River"]], ["Daugava", 85, ["Daugava River"]], ["Loire", 85, ["Loire River"]], ["Essequibo", 85, ["Essequibo River"]], ["Khoper", 85, ["Khoper River"]], ["Tagus", 85, ["Tagus River"]]]], [{ "id": "pacific-indian-rivers", "family": "world", "topic": "EASTWARD WATERS", "prompt": "Name a river whose water eventually reaches the Pacific or Indian Ocean. Tributaries count.", "source": "Corpora rivers, CC0; outflows recursively traced to ocean basins. River Plate and Hudson Bay classified with Atlantic drainage. Finite long-river source; additional valid rivers may be absent.", "ranking": "familiarity-v1" }, [["Yangtze", 10, ["Chang Jiang", "Yangtze River"]], ["Huang He", 60, ["Huang He River", "Yellow River"]], ["Amur", 85, ["Amur River"]], ["Argun", 85, ["Argun River"]], ["Mekong", 30, ["Mekong River"]], ["Shatt al-Arab", 100, ["Shatt al-Arab River"]], ["Euphrates", 30, ["Euphrates River"]], ["Yukon", 60, ["Yukon River"]], ["Indus", 10, ["Indus River"]], ["Salween", 85, ["Salween River"]], ["Brahmaputra", 85, ["Brahmaputra River"]], ["Tsangpo", 85, ["Tsangpo River"]], ["Zambezi", 85, ["Zambezi River"]], ["Ganges", 10, ["Ganges River"]], ["Hooghly", 85, ["Hooghly River"]], ["Padma", 85, ["Padma River"]], ["Colorado", 30, ["Colorado River"]], ["Columbia", 30, ["Columbia River"]], ["Pearl", 30, ["Pearl River"]], ["Zhu Jiang", 85, ["Zhu Jiang River"]], ["Ayeyarwady", 85, ["Ayeyarwady River", "Irrawaddy"]], ["Tigris", 30, ["Tigris River"]], ["Songhua", 85, ["Songhua River"]], ["Limpopo", 85, ["Limpopo River"]], ["Snake", 30, ["Snake River"]], ["Jubba", 85, ["Jubba River"]], ["Shebelle", 85, ["Shebelle River"]], ["Han", 60, ["Han River"]], ["Godavari", 85, ["Godavari River"]], ["Sutlej", 85, ["Sutlej River"]], ["Yamuna", 85, ["Yamuna River"]], ["Fraser", 60, ["Fraser River"]], ["Liao", 85, ["Liao River"]], ["Yalong", 85, ["Yalong River"]], ["Krishna", 60, ["Krishna River"]], ["Narmada", 85, ["Narmada River"]], ["Lerma", 85, ["Lerma River"]], ["Rio Grande de Santiago", 60, ["Rio Grande de Santiago River"]], ["Zeya", 85, ["Zeya River"]], ["Shire", 60, ["Shire River"]], ["Nen", 85, ["Nen River"]], ["Green", 10, ["Green River"]], ["Chindwin", 85, ["Chindwin River"]], ["Wu", 60, ["Wu River"]], ["Kapuas", 85, ["Kapuas River"]], ["Sepik", 85, ["Sepik River"]], ["Anadyr", 85, ["Anadyr River"]], ["Para\xEDba do Sul", 85, ["Para\xEDba do Sul River"]], ["Jialing River", 85, ["Jialing River River"]], ["Chenab", 85, ["Chenab River"]], ["Ghaghara", 85, ["Ghaghara River"]], ["Huai", 85, ["Huai River"]], ["Fly", 30, ["Fly River"]], ["Kuskokwim", 85, ["Kuskokwim River"]], ["Gila", 85, ["Gila River"]]]], [{ "id": "arctic-rivers", "family": "world", "topic": "NORTHBOUND", "prompt": "Name a river whose water eventually reaches the Arctic Ocean. Tributaries count.", "source": "Corpora rivers, CC0; outflows recursively traced to ocean basins. River Plate and Hudson Bay classified with Atlantic drainage. Finite long-river source; additional valid rivers may be absent.", "ranking": "familiarity-v1" }, [["Yenisei", 10, ["Yenisei River", "Yenisey"]], ["Angara", 85, ["Angara River"]], ["Selenge", 85, ["Selenge River"]], ["Ob", 10, ["Ob River"]], ["Irtysh", 85, ["Irtysh River"]], ["Lena", 10, ["Lena River"]], ["Mackenzie", 10, ["Mackenzie River"]], ["Slave", 30, ["Slave River"]], ["Peace", 10, ["Peace River"]], ["Finlay", 85, ["Finlay River"]], ["Lower Tunguska", 85, ["Lower Tunguska River"]], ["Vilyuy", 85, ["Vilyuy River"]], ["Kolyma", 85, ["Kolyma River"]], ["Upper Ob", 60, ["Upper Ob River"]], ["Katun", 85, ["Katun River"]], ["Ishim", 85, ["Ishim River"]], ["Olenyok", 85, ["Olenyok River"]], ["Aldan", 85, ["Aldan River"]], ["Vitim", 85, ["Vitim River"]], ["Stony Tunguska", 85, ["Stony Tunguska River"]], ["Pechora", 85, ["Pechora River"]], ["Indigirka", 85, ["Indigirka River"]], ["Khatanga", 85, ["Khatanga River"]], ["Tobol", 85, ["Tobol River"]], ["Upper Yenisei", 85, ["Upper Yenisei River"]], ["Little Yenisei", 85, ["Little Yenisei River"]], ["Olyokma", 85, ["Olyokma River"]], ["Northern Dvina", 100, ["Northern Dvina River"]], ["Sukhona", 85, ["Sukhona River"]], ["Athabasca", 85, ["Athabasca River"]], ["Vychegda", 85, ["Vychegda River"]], ["Liard", 85, ["Liard River"]]]]];
  var EXPANDED_PACKS = rows.map(([meta, answers]) => ({ ...meta, dailyEligible: true, answers: answers.map(([label, points, aliases2, note]) => ({ label, points, aliases: aliases2, ...note ? { note } : {} })) }));

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
  for (const p of PACKS) {
    p.dailyEligible = p === AIRLINE_PACK || p === VEHICLE_PACK;
    if (p.dailyEligible) p.family = "everyday";
  }
  PACKS.push(...EXPANDED_PACKS);
  var PLAY_PACKS = PACKS.filter((p) => p.dailyEligible);

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
  var DAILY_FAMILIES = ["words", "nature", "food", "science", "culture", "world", "everyday"];
  function familyCycle(family, cycle, pool) {
    const base = shuffle(pool, random(hash("councillion-pool-v2:" + family)));
    return base.length < 3 ? base : [base[0], ...shuffle(base.slice(1), random(hash(family + ":" + cycle)))];
  }
  function dailyPacks(day = dateKey()) {
    const ordinal = Math.floor(Date.parse(day + "T12:00:00Z") / 864e5);
    if (!Number.isFinite(ordinal)) throw Error("Invalid daily date.");
    const chosen = DAILY_FAMILIES.map((family) => {
      const pool = PLAY_PACKS.filter((p) => p.family === family);
      if (!pool.length) throw Error("Missing daily family: " + family);
      const offset = hash(family) % pool.length, index = ordinal + offset, cycle = Math.floor(index / pool.length);
      return familyCycle(family, cycle, pool)[index % pool.length];
    });
    return shuffle(chosen, random(hash("councillion-daily-v2:" + day)));
  }
  function tier(points) {
    return points >= 100 ? { name: "KRILLION", icon: "\u2726", color: "rarity-krillion" } : points >= 85 ? { name: "DEEP CUT", icon: "\u25C6", color: "rarity-deepcut" } : points >= 60 ? { name: "RARE", icon: "\u2727", color: "rarity-rare" } : points >= 30 ? { name: "SCHOOLER", icon: "\u25C8", color: "rarity-schooler" } : points > 0 ? { name: "PLANKTON", icon: "\xB7", color: "rarity-plankton" } : { name: "NO ECHO", icon: "\xD7", color: "muted" };
  }
  var keyboard = /* @__PURE__ */ new Map();
  for (const [row, letters2] of ["qwertyuiop", "asdfghjkl", "zxcvbnm"].entries()) for (const [col, letter] of [...letters2].entries()) keyboard.set(letter, [col + [0, 0.25, 0.75][row], row]);
  function neighbor(a, b) {
    const x = keyboard.get(a), y = keyboard.get(b);
    return x && y && Math.abs(x[0] - y[0]) <= 1.1 && Math.abs(x[1] - y[1]) <= 1;
  }
  function typoDistance(a, b, limit = 300) {
    if (a === b) return 0;
    let older, previous = Array.from({ length: b.length + 1 }, (_, i) => i * 100);
    for (let i = 1; i <= a.length; i++) {
      const row = [i * 100];
      let minimum = row[0];
      for (let j = 1; j <= b.length; j++) {
        const substitution = a[i - 1] === b[j - 1] ? 0 : neighbor(a[i - 1], b[j - 1]) ? 65 : 100;
        const deletion = i > 1 && a[i - 1] === a[i - 2] ? 55 : 100, insertion = j > 1 && b[j - 1] === b[j - 2] ? 55 : 100;
        row[j] = Math.min(previous[j] + deletion, row[j - 1] + insertion, previous[j - 1] + substitution);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) row[j] = Math.min(row[j], older[j - 2] + 65);
        minimum = Math.min(minimum, row[j]);
      }
      if (minimum > limit) return Infinity;
      older = previous;
      previous = row;
    }
    return previous[b.length];
  }
  var stopwords = /* @__PURE__ */ new Set(["a", "an", "the", "of", "and", "to", "in", "for", "on", "at", "from"]);
  function abbreviations(label) {
    const words = String(label).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().match(/[a-z0-9]+/g) || [];
    if (words.length < 2) return [];
    const initials = (items) => items.map((w) => /^[ivx]+$/.test(w) && w.length <= 4 ? w : w[0]).join("");
    return [.../* @__PURE__ */ new Set([initials(words), initials(words.filter((w) => !stopwords.has(w)))])].filter((k) => k.length >= 2 && k.length <= 10 && /[a-z]/.test(k));
  }
  var compiledBanks = /* @__PURE__ */ new WeakMap();
  function compileBank(pack2) {
    let cached = compiledBanks.get(pack2);
    if (cached) return cached;
    const exact = /* @__PURE__ */ new Map(), byLength = /* @__PURE__ */ new Map(), short = /* @__PURE__ */ new Map();
    for (const answer of pack2.answers) {
      for (const key of new Set([answer.label, ...answer.aliases].map(normalize))) {
        if (!exact.has(key)) exact.set(key, answer);
        if (!byLength.has(key.length)) byLength.set(key.length, []);
        byLength.get(key.length).push({ key, answer });
      }
      for (const key of abbreviations(answer.label)) {
        if (!short.has(key)) short.set(key, /* @__PURE__ */ new Map());
        short.get(key).set(answer.label, answer);
      }
    }
    cached = { exact, byLength, short };
    compiledBanks.set(pack2, cached);
    return cached;
  }
  function matchAnswer(pack2, input) {
    const query = normalize(input);
    if (!query) return null;
    const bank = compileBank(pack2), exact = bank.exact.get(query);
    if (exact) return { ...exact, corrected: false };
    const abbreviated = bank.short.get(query);
    if (abbreviated?.size === 1) return { ...[...abbreviated.values()][0], corrected: true, abbreviated: true };
    if (abbreviated?.size > 1 || query.length < 5) return null;
    const limit = query.length >= 18 ? 350 : query.length >= 10 ? 280 : query.length >= 8 ? 180 : 100;
    const span = query.length >= 10 ? 3 : query.length >= 8 ? 2 : 1, candidates = /* @__PURE__ */ new Map();
    for (let length = Math.max(5, query.length - span); length <= query.length + span; length++) for (const { key, answer } of bank.byLength.get(length) || []) {
      const cost = typoDistance(query, key, limit);
      if (cost <= limit && cost < (candidates.get(answer.label)?.cost ?? Infinity)) candidates.set(answer.label, { answer, cost });
    }
    const ordered = [...candidates.values()].sort((a, b) => a.cost - b.cost);
    if (!ordered.length || ordered[1] && ordered[1].cost - ordered[0].cost < 55) return null;
    return { ...ordered[0].answer, corrected: true };
  }
  function newParty(players, rng = Math.random) {
    return { phase: "lobby", players: players.map((p) => ({ ...p, hearts: 2, meter: 0, score: 0, connected: true })), turn: 0, round: 0, packIds: shuffle(PLAY_PACKS.filter((p) => p.answers.length >= 18), rng).map((p) => p.id), used: [], log: [], settings: { lives: 2, maxLives: 5, meterTarget: 600, minTurnMs: 8e3, fuseMinMs: 1e4, fuseMaxMs: 3e4, maxPlayers: 6 }, notice: "The court is assembling.", deadline: 0, startedAt: 0, revision: 0 };
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
    player.lastAnswer = { label: answer.label, points: answer.points, at: now };
    s.passed = { from: player.id, at: now };
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
  var esc2 = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  function mountBank(root, pack2, chosen = "") {
    const sorted = [...pack2.answers].sort((a, b) => b.points - a.points || a.label.localeCompare(b.label));
    root.innerHTML = `${pack2.ranking ? '<p class="bank-ranking-note">Rarity estimates familiarity within this question. Corpus frequency sets a starting tier; editorial choices and special discoveries refine it. These are not live player statistics.</p>' : ""}<div class="bank-filters" aria-label="Filter by rarity"><button class="bank-filter selected" data-tier="all">All <small>${pack2.answers.length.toLocaleString()}</small></button>${[100, 85, 60, 30, 10].map((p) => `<button class="bank-filter ${tier(p).color}" data-tier="${p}">${tier(p).name} <small>${pack2.answers.filter((a) => a.points === p).length.toLocaleString()}</small></button>`).join("")}</div><label class="bank-search-label"><span aria-hidden="true">\u2315</span><input class="bank-search" type="search" aria-label="Search accepted answers" placeholder="Search ${pack2.answers.length.toLocaleString()} answers\u2026" autocomplete="off"></label><div class="bank-list" tabindex="0" aria-label="Accepted answers"></div><button class="text-button bank-more">SHOW 100 MORE \u2193</button><p class="bank-count fine-print"></p>${pack2.source ? `<details class="bank-source"><summary>Answer sources & scope</summary><p>${esc2(pack2.source)}</p><a href="DATA-SOURCES.md" target="_blank" rel="noopener">Data credits and ranking method \u2197</a></details>` : ""}`;
    let selected = "all", limit = 100;
    const list = root.querySelector(".bank-list"), search = root.querySelector("input");
    const render = () => {
      const q2 = search.value.trim().toLowerCase();
      const matches = sorted.filter((a) => (selected === "all" || a.points === Number(selected)) && a.label.toLowerCase().includes(q2));
      const shown = matches.slice(0, limit);
      list.innerHTML = shown.map((a) => `<div class="bank-row ${tier(a.points).color}"><span class="bank-creature">${tierSprite(a.points)}</span><span class="bank-answer">${esc2(a.label)}${chosen === a.label ? "<em>YOU</em>" : ""}${a.quip ? `<small>${esc2(a.quip)}</small>` : ""}</span><strong>+${a.points}</strong></div>`).join("") || '<p class="bank-empty">No answers found.</p>';
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
    version: "target-265-v3",
    questions: 7,
    points: Object.freeze([0, 10, 30, 60, 85, 100]),
    profiles: Object.freeze([
      Object.freeze({ name: "casual", weight: 0.24, probabilities: Object.freeze([0.12, 0.32, 0.3, 0.18, 0.065, 0.015]) }),
      Object.freeze({ name: "regular", weight: 0.61, probabilities: Object.freeze([0.08, 0.24, 0.3, 0.24, 0.11, 0.03]) }),
      Object.freeze({ name: "experienced", weight: 0.15, probabilities: Object.freeze([0.04, 0.16, 0.26, 0.29, 0.18, 0.07]) })
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
    return `<section class="result-benchmark" aria-label="Estimated score comparison"><div class="benchmark-heading"><span>ESTIMATED CHALLENGE CURVE</span><span>0\u2013700 POINTS</span></div><div class="bell-chart"><svg viewBox="0 0 700 157" preserveAspectRatio="none" role="img" aria-label="Modeled seven-question score distribution. Your score is ${value}. Estimated percentage of scores below yours: ${percentileText(percent)}."><defs><clipPath id="below-your-score"><rect x="0" y="0" width="${value}" height="157"/></clipPath></defs><path class="bell-area" d="${fill}"/><path class="bell-below" d="${fill}" clip-path="url(#below-your-score)"/><path class="bell-line" d="${path}"/><path class="bell-axis" d="M0 145H700"/><path class="bell-player-line" d="M${marker} ${Math.max(7, y(value) - 10).toFixed(2)}V145"/><circle class="bell-player-dot" cx="${marker}" cy="${y(value).toFixed(2)}" r="3.6"/></svg><span class="bell-you" style="left:${Math.max(2, Math.min(98, value / 7))}%">YOU</span><div class="bell-tooltip" hidden></div></div><div class="bell-scale">${Array.from({ length: 8 }, (_, i) => `<span>${i * 100}</span>`).join("")}</div><p class="benchmark-verdict">BETTER THAN AN ESTIMATED <strong>${percentileText(percent)}</strong></p><details class="benchmark-method"><summary>Estimated from a scoring model \xB7 how it works</summary><p>No live player results have been collected. This model mixes casual, regular, and experienced players (24%, 61%, 15%) across seven questions. The question probabilities are set to place the seven-prompt average near 265/700. The modeled average is about ${Math.round(MODEL_MEAN)} points. \u201CBetter than\u201D counts lower scores and excludes ties. These estimates are not calibrated to actual players or individual prompt difficulty.</p></details></section>`;
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
  var esc3 = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  function renderResults(app2, quiz2, packs) {
    const score = quiz2.results.reduce((n, r) => n + r.points, 0), rank = score >= 450 ? 100 : score >= 351 ? 85 : score >= 251 ? 60 : score >= 151 ? 30 : 10, t = tier(rank);
    const bands = [{ p: 10, lo: 0, hi: 150 }, { p: 30, lo: 151, hi: 250 }, { p: 60, lo: 251, hi: 350 }, { p: 85, lo: 351, hi: 449 }, { p: 100, lo: 450, hi: 700 }];
    app2.innerHTML = `<section class="results-page"><div class="results-masthead"><a href="#home" class="results-brand">COUNCILLION</a><span>${quiz2.mode === "daily" ? "DAILY DIVE \xB7 " + esc3(quiz2.day) : "UNLIMITED DIVE"}<br>COMPLETE</span></div><div class="results-headline"><div class="results-total"><strong>${score}</strong><span>/700</span><span class="results-metres">\u2212${(score * 10).toLocaleString()}m</span></div><div class="results-rank ${t.color}">${tierSprite(rank)}<span>${t.name}<small>YOUR VERDICT</small></span></div></div>${renderBellCurve(score)}<section class="dive-log"><div class="log-heading"><h2>DIVE LOG</h2><span>DEEPER = RARER</span></div><div class="log-chart"><div class="log-axis"><span>0m</span><span>250m</span><span>500m</span><span>750m</span><span>1,000m</span></div><div class="log-columns">${quiz2.results.map((r, i) => `<button class="log-column ${tier(r.points).color}" data-action="bank" data-pack="${r.packId}" aria-label="Question ${i + 1}: ${esc3(r.label)}, ${r.points} points. Explore answers."><span class="log-thread" style="height:${r.points}%"></span><span class="log-dot" style="top:${r.points}%">${r.points ? tierSprite(r.points) : "<i></i>"}</span><span class="log-round">${i + 1}</span></button>`).join("")}</div></div></section><div class="results-share"><button class="pixel-button primary" data-action="share">COPY RESULT \u2197</button><p>Seven answers. One descent.<br>Make your case to your friends.</p></div><section class="score-guide"><h2>THE DEPTH OF YOUR CASE</h2>${bands.map((b) => `<div class="score-guide-row ${tier(b.p).color} ${rank === b.p ? "your-band" : ""}">${tierSprite(b.p)}<span>${tier(b.p).name}</span><small>${b.lo}\u2013${b.hi}</small>${rank === b.p ? "<em>YOU</em>" : "<em></em>"}</div>`).join("")}</section><section class="the-catch"><div class="catch-heading"><h2>THE CATCH</h2><p>Every prompt. Every accepted answer.</p></div>${quiz2.results.map((r, i) => {
      const pack2 = packs.find((p) => p.id === r.packId);
      return `<details class="catch-round"><summary><span class="catch-number">${i + 1}</span><span class="catch-copy"><small>${esc3(pack2.prompt)}</small><strong class="${tier(r.points).color}">${tierSprite(r.points)}${esc3(r.label)}</strong></span><span class="catch-points ${tier(r.points).color}">${r.points}</span><span class="catch-toggle">+</span></summary><div class="catch-bank" data-pack="${r.packId}" data-chosen="${esc3(r.label)}"></div></details>`;
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
  var esc4 = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  function renderDive(app2, quiz2, pack2, score) {
    const result = quiz2.results.at(-1), isResult = ["result", "sinking"].includes(quiz2.stage), t = tier(result?.points ?? 0);
    const depth = score * 10;
    const sceneDepth = isResult ? depth : depth;
    app2.innerHTML = `<section class="dive-screen" aria-label="Underwater trivia"><div class="dive-hud"><div class="hud-badge depth-badge"><small>DEPTH</small><strong id="dive-depth">${depth.toLocaleString()}m</strong></div><div class="dive-progress"><div class="dive-squares">${quiz2.ids.map((_, i) => `<span class="dive-square ${i < quiz2.results.length ? "completed " + tier(quiz2.results[i].points).color : i === quiz2.round ? "current" : ""}"></span>`).join("")}</div><small>PROMPT ${quiz2.round + 1} OF 7</small></div><div class="hud-badge score-badge"><small>SCORE</small><strong>${score}</strong></div></div><div class="biome-caption"><span class="biome-line"></span><span id="current-biome">SUNLIT WATERS</span></div><div class="dive-buddy" aria-hidden="true"><img src="assets/counsel-krill.svg" alt=""></div>${isResult ? `<section class="dive-verdict ${quiz2.stage === "sinking" ? "sinking" : ""}" aria-live="polite"><div class="verdict-creature ${t.color}">${result?.points ? tierSprite(result.points) : tierSprite(0)}</div><h1 class="${t.color}">${t.name}</h1><p class="verdict-answer">\u201C${esc4(result.label)}\u201D</p><p class="verdict-score">+${result.points} PTS \xB7 sink ${result.points * 10}m</p><p class="verdict-comment">${result.quip ? esc4(result.quip) : result.points >= 100 ? "An extraordinary find. Case closed." : result.points >= 85 ? "A precedent few would think of." : result.points >= 60 ? "A rare answer, well argued." : result.points >= 30 ? "A solid answer for the record." : result.points ? "A familiar answer. Still a valid case." : result.reason === "timeout" ? "The clock reached its verdict." : result.reason === "skip" ? "A new case awaits below." : "That answer isn\u2019t in this curated bank."}</p>${result.corrected ? `<p class="fine-print">Accepted for \u201C${esc4(result.input)}\u201D</p>` : ""}</section><div class="dive-controls result-controls"><button class="pixel-button primary" data-action="next">${quiz2.round === 6 ? "SURFACE" : "DESCEND"} ${quiz2.round === 6 ? "\u25B2" : "\u25BC"}</button><span class="continue-hint">ENTER TO CONTINUE</span></div>` : `<section class="floating-prompt"><p class="prompt-number">PROMPT ${quiz2.round + 1} OF 7 <span>${esc4(pack2.topic)}</span></p><h1>${esc4(pack2.prompt)}</h1><p class="prompt-hint">\u25BC rarer answers sink deeper \u25BC</p></section><div class="dive-controls ${quiz2.stage === "intro" ? "entering" : ""}"><div class="intro-message" id="intro-message">descending \xB7 the clock starts in 2</div><form id="answer-form" class="dive-answer-form"><div class="timer-orb" id="timer-orb"><span id="quiz-timer" role="timer" aria-label="Seconds remaining">25</span></div><div class="dive-input-wrap"><label class="sr-only" for="answer">Your answer</label><input id="answer" name="answer" placeholder="type one answer\u2026" maxlength="256" autocomplete="off" autocapitalize="off" spellcheck="false" required><div class="dive-time-bar"><span id="quiz-timer-fill"></span></div></div><button class="pixel-button dive-submit" id="dive-submit" type="submit" disabled>DIVE</button></form><div class="dive-under-controls"><button class="text-button" data-action="skip">SKIP \u25B8</button><span>FUTURE COUNSEL \xB7 THINK DEEPER</span><button class="text-button" data-action="help">? RULES</button></div></div>`}</section>`;
    return sceneDepth;
  }

  // party-rules.js
  var PARTY_DEFAULTS = { lives: 2, maxLives: 5, meterTarget: 600, minTurnMs: 8e3, fuseMinMs: 1e4, fuseMaxMs: 3e4, maxPlayers: 6 };
  var bounded = (value, fallback, min, max, step = 1) => Math.max(min, Math.min(max, Math.round((Number.isFinite(+value) ? +value : fallback) / step) * step));
  function partySettings(patch = {}, base = PARTY_DEFAULTS) {
    const s = { ...base };
    s.maxLives = bounded(patch.maxLives ?? s.maxLives, 5, 1, 10);
    s.lives = bounded(patch.lives ?? s.lives, 2, 1, s.maxLives);
    s.meterTarget = bounded(patch.meterTarget ?? s.meterTarget, 600, 50, 5e3, 50);
    s.minTurnMs = bounded(patch.minTurnMs ?? s.minTurnMs, 8e3, 3e3, 2e4, 1e3);
    s.maxPlayers = bounded(patch.maxPlayers ?? s.maxPlayers, 6, 2, 16);
    return s;
  }
  function syncRoster(state, members, now = Date.now()) {
    let changed = false;
    for (const [id, m] of Object.entries(members ?? {})) {
      let p = state.players.find((p2) => p2.id === id);
      const present = m.online || now - (m.lastSeen ?? m.joinedAt) < 3e4;
      if (!p && present) {
        p = { id, name: m.name, buddy: m.buddy, connected: true, ready: m.ready, autoJoin: m.autoJoin, hearts: state.phase === "lobby" ? state.settings.lives : 0, meter: 0, score: 0, spectator: state.phase !== "lobby" };
        state.players.push(p);
        changed = true;
      }
      if (p) {
        if (present && !p.connected) {
          p.connected = true;
          p.spectator = state.phase !== "lobby";
          p.hearts = p.spectator ? 0 : state.settings.lives;
          changed = true;
        }
        for (const k of ["name", "buddy", "ready", "autoJoin"]) if (p[k] !== m[k]) {
          p[k] = m[k];
          changed = true;
        }
        if (!present && p.connected) {
          disconnectPlayer(state, id);
          changed = true;
        }
      }
    }
    for (const p of [...state.players]) if (!members?.[p.id]) {
      disconnectPlayer(state, p.id);
      changed = true;
    }
    if (state.phase === "lobby") {
      const players = state.players.filter((p) => p.connected);
      if (players.length !== state.players.length) {
        state.players = players;
        changed = true;
      }
    }
    if (changed) state.revision++;
    return changed;
  }
  function beginParty(state, now = Date.now()) {
    if (!["lobby", "ended"].includes(state.phase)) return false;
    const players = state.players.filter((p) => p.connected && p.ready).slice(0, state.settings.maxPlayers);
    if (players.length < 2) return false;
    const old = state.settings, next = newParty(players);
    Object.assign(state, next, { settings: old, revision: state.revision + 1, phase: "countdown", nextAt: now + 3e3 });
    state.players.forEach((p) => {
      p.hearts = old.lives;
      p.spectator = false;
      delete p.lastAnswer;
    });
    state.notice = "Court is about to begin\u2026";
    return true;
  }
  function stepParty(state, now = Date.now()) {
    if (state.phase === "countdown" && now >= state.nextAt) return startParty(state, now);
    const who = state.players[state.turn];
    const didPop = state.phase === "playing" && now >= state.deadline;
    const changed = tickParty(state, now);
    if (didPop) {
      state.popped = { id: who.id, at: now };
      state.players.forEach((p) => {
        delete p.lastAnswer;
      });
    }
    return changed;
  }
  function setLobbyRules(state, patch) {
    if (!["lobby", "ended"].includes(state.phase)) throw Error("Rules can change between games.");
    state.settings = partySettings(patch, state.settings);
    const seated = state.players.filter((p) => p.ready && p.connected).length;
    if (state.settings.maxPlayers < seated) state.settings.maxPlayers = seated;
    state.players.forEach((p) => {
      if (state.phase === "lobby") p.hearts = state.settings.lives;
    });
    state.revision++;
  }

  // party-access.js
  function canPlayParty(identity, now = Date.now() / 1e3) {
    return !!identity && typeof identity.id === "string" && identity.id.length > 0 && Number.isFinite(identity.expires) && identity.expires > now;
  }
  function requirePartyIdentity(identity, now = Date.now() / 1e3) {
    if (!canPlayParty(identity, now)) throw Error("Sign in with Google to play Puffer Party.");
    return identity;
  }

  // party.js
  var cleanName = (name) => String(name ?? "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, 16) || "Counsel";
  var loadCloud = () => import("./cloud.bundle.js");
  var json = (value) => JSON.parse(JSON.stringify(value));
  var friendly = (e) => e?.code === "PERMISSION_DENIED" || e?.code === "database/permission-denied" ? "This room is unavailable, full, or your Google session needs refreshing." : e?.message || "Connection interrupted. Try again.";
  async function publicRooms(authorize, callback, onError) {
    await authorize();
    const c = await loadCloud();
    return c.onValue(c.query(c.ref(c.db, "directory"), c.orderByChild("updatedAt"), c.limitToLast(100)), (snapshot) => {
      const now = Date.now();
      callback(Object.entries(snapshot.val() ?? {}).filter(([, r]) => now - r.updatedAt < 45e3).map(([code, r]) => ({ code, ...r })).sort((a, b) => (a.phase === "lobby" ? -1 : 1) - (b.phase === "lobby" ? -1 : 1) || b.count - a.count));
    }, (e) => onError(friendly(e)));
  }
  var PartySession = class {
    constructor(onState, onError, getIdentity = () => null, authorize = null, getCloud = loadCloud) {
      Object.assign(this, { onState, onError, getIdentity, authorize, getCloud, host: false, local: false, state: null, closed: false, offset: 0, members: {}, chat: [], unsub: [], processed: /* @__PURE__ */ new Set(), processing: Promise.resolve() });
      this.timer = setInterval(() => this.tick(), 200);
    }
    fail(message) {
      if (!this.closed) this.onError(message);
    }
    snapshot() {
      if (!this.closed && this.state) this.onState(this.state, this);
    }
    async auth() {
      requirePartyIdentity(this.getIdentity());
      if (!this.authorize) throw Error("Google party sign-in is unavailable.");
      this.myId = (await this.authorize()).uid;
      this.c = await this.getCloud();
      requirePartyIdentity(this.getIdentity());
    }
    path(part = "") {
      return this.c.ref(this.c.db, `rooms/${this.code}${part ? "/" + part : ""}`);
    }
    async create(name, options = {}) {
      await this.auth();
      this.host = true;
      this.name = cleanName(name);
      this.buddy = options.buddy ?? "krill";
      for (let i = 0; i < 5; i++) {
        this.code = Array.from(crypto.getRandomValues(new Uint8Array(4)), (x) => "ABCDEFGHJKLMNPQRSTUVWXYZ"[x % 24]).join("");
        const m = { name: this.name, buddy: this.buddy, joinedAt: Date.now(), lastSeen: Date.now(), online: true, ready: true, autoJoin: false };
        const state = newParty([{ id: this.myId, ...m }]);
        this.meta = { host: this.myId, hostName: this.name, version: 3, createdAt: Date.now(), isPrivate: !!options.isPrivate, seats: 6, phase: "lobby" };
        try {
          await this.c.set(this.path(), { meta: this.meta, members: { [this.myId]: m }, state });
          this.state = state;
          this.members = { [this.myId]: m };
          await this.listen();
          return;
        } catch (e) {
          if (i === 4) throw Error(friendly(e));
        }
      }
    }
    async join(name, code, options = {}) {
      await this.auth();
      this.name = cleanName(name);
      this.buddy = options.buddy ?? "krill";
      this.code = String(code ?? "").toUpperCase().replace(/[^A-Z]/g, "");
      if (this.code.length !== 4) throw Error("Enter a four-letter room code.");
      const meta = (await this.c.get(this.path("meta"))).val();
      if (!meta || Date.now() - meta.createdAt > 24 * 36e5) throw Error("Room not found. Check the code or host a new room.");
      this.meta = meta;
      this.host = meta.host === this.myId;
      await this.c.set(this.path("members/" + this.myId), { name: this.name, buddy: this.buddy, joinedAt: Date.now(), lastSeen: Date.now(), online: true, ready: meta.phase === "lobby", autoJoin: false });
      await this.listen();
    }
    async listen() {
      const c = this.c;
      this.unsub.push(c.onValue(c.ref(c.db, ".info/serverTimeOffset"), (snap) => this.offset = snap.val() ?? 0));
      this.unsub.push(c.onValue(this.path("meta"), (snap) => {
        if (!snap.exists()) return this.fail("The host closed this room.");
        const wasHost = this.host;
        this.meta = snap.val();
        this.host = this.meta.host === this.myId;
        if (this.host && !wasHost) this.becomeHost();
        this.snapshot();
      }, (e) => this.fail(friendly(e))));
      this.unsub.push(c.onValue(this.path("state"), (snap) => {
        if (snap.exists()) {
          const s = snap.val();
          s.players = Object.values(s.players ?? {});
          s.used = Object.values(s.used ?? {});
          s.log = Object.values(s.log ?? {});
          s.packIds = Object.values(s.packIds ?? {});
          this.state = s;
          this.snapshot();
        }
      }, (e) => this.fail(friendly(e))));
      this.unsub.push(c.onValue(this.path("members"), (snap) => {
        const previous = this.members;
        this.members = snap.val() ?? {};
        if (this.host) {
          for (const [id, m] of Object.entries(this.members)) if (!previous[id]) this.system(m.name + " entered the courtroom.");
        }
        if (this.host) this.enforceSeats();
        if (!this.members[this.myId]) return this.fail("You left the room.");
        if (this.host && this.state && syncRoster(this.state, this.members, this.now())) this.broadcast();
        this.snapshot();
      }, (e) => this.fail(friendly(e))));
      this.unsub.push(c.onValue(c.query(this.path("chat"), c.limitToLast(60)), (snap) => {
        this.chat = Object.values(snap.val() ?? {}).sort((a, b) => a.at - b.at);
        this.snapshot();
      }));
      this.unsub.push(c.onValue(this.path("responses/" + this.myId), (snap) => {
        const r = snap.val();
        if (!r || this.lastResponse === r.requestId) return;
        this.lastResponse = r.requestId;
        if (r.error) this.fail(r.error);
        else if (r.answer) {
          this.lastAccepted = r.answer;
          this.snapshot();
        }
      }));
      this.unsub.push(c.onValue(c.ref(c.db, ".info/connected"), async (snap) => {
        this.connected = !!snap.val();
        if (this.connected && !this.closed) {
          await c.onDisconnect(this.path("members/" + this.myId)).update({ online: false, lastSeen: c.serverTimestamp() });
          await c.update(this.path("members/" + this.myId), { online: true, lastSeen: c.serverTimestamp() });
        }
        this.snapshot();
      }));
      this.presence = setInterval(() => {
        if (!this.closed) c.update(this.path("members/" + this.myId), { lastSeen: c.serverTimestamp() }).catch(() => {
        });
      }, 15e3);
      if (this.host) this.becomeHost();
      this.snapshot();
    }
    becomeHost() {
      if (this.hostListener || this.closed) return;
      this.hostListener = true;
      const name = this.members[this.myId]?.name ?? this.name;
      if (name && this.meta.hostName !== name) {
        this.meta.hostName = name;
        this.c.update(this.path("meta"), { hostName: name }).catch(() => {
        });
      }
      const listen = (snap) => {
        this.processing = this.processing.then(() => this.process(snap.key, snap.val())).catch((e) => this.fail(friendly(e)));
      };
      this.unsub.push(this.c.onChildAdded(this.path("requests"), listen), this.c.onChildChanged(this.path("requests"), listen));
      this.broadcast();
    }
    now() {
      return Date.now() + this.offset;
    }
    async enforceSeats() {
      if (!this.state) return;
      const ready = Object.entries(this.members).filter(([, m]) => m.online && m.ready).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
      const changes = {};
      for (const [id, m] of ready.slice(this.state.settings.maxPlayers)) {
        m.ready = false;
        changes["members/" + id + "/ready"] = false;
      }
      if (Object.keys(changes).length) await this.c.update(this.path(), changes);
    }
    async process(uid, r) {
      if (!this.host || !r || this.processed.has(r.id) || !this.members[uid]?.online) return;
      this.processed.add(r.id);
      let result = {};
      try {
        if (this.now() - r.at > 15e3) throw Error("That request expired. Please try again.");
        if (r.type === "answer") result = answerParty(this.state, uid, r.text, this.now());
        else if (uid !== this.myId) throw Error("Only the host can change the room.");
        else if (r.type === "start" || r.type === "rematch") {
          if (!beginParty(this.state, this.now())) throw Error("At least two ready players are needed.");
        } else if (r.type === "kick") {
          if (r.target === this.myId || !this.members[r.target]) throw Error("Choose another player.");
          await this.c.update(this.path(), { ["bans/" + r.target]: true, ["members/" + r.target]: null });
          disconnectPlayer(this.state, r.target);
        } else if (r.type === "rules") setLobbyRules(this.state, r.patch ?? {});
        else if (r.type === "visibility") {
          await this.c.update(this.path("meta"), { isPrivate: !!r.private });
          this.meta.isPrivate = !!r.private;
        }
        if (result.error) throw Error(result.error);
        await this.broadcast();
      } catch (e) {
        result = { error: e.message };
      }
      await this.c.set(this.path("responses/" + uid), json({ requestId: r.id, ...result, at: this.now() }));
      await this.c.runTransaction(this.path("requests/" + uid), (current2) => current2?.id === r.id ? null : void 0, { applyLocally: false });
    }
    async request(type, extra = {}) {
      try {
        requirePartyIdentity(this.getIdentity());
        if (!this.state || !this.connected) throw Error("Reconnecting to the courtroom\u2026");
        await this.c.set(this.path("requests/" + this.myId), { id: crypto.randomUUID(), type, ...extra, at: this.now() });
      } catch (e) {
        this.fail(friendly(e));
      }
    }
    async broadcast() {
      if (!this.host || !this.state || this.closed) return;
      this.state.revision++;
      const updates = { state: json(this.state), "meta/phase": this.state.phase, "meta/seats": this.state.settings.maxPlayers };
      try {
        await this.c.update(this.path(), updates);
        await this.publish();
        this.snapshot();
      } catch (e) {
        this.fail(friendly(e));
      }
    }
    async publish() {
      if (!this.host || this.closed) return;
      const path = this.c.ref(this.c.db, "directory/" + this.code);
      if (this.meta.isPrivate) return this.c.remove(path);
      await this.c.onDisconnect(path).remove();
      return this.c.set(path, { hostName: this.meta.hostName, count: Object.values(this.members).filter((m) => m.online && m.ready).length, seats: this.state.settings.maxPlayers, phase: this.state.phase, updatedAt: this.c.serverTimestamp() });
    }
    start() {
      if (!canPlayParty(this.getIdentity())) return this.fail("Sign in with Google to play Puffer Party.");
      if (this.local) {
        if (startParty(this.state)) this.snapshot();
        return;
      }
      this.request(this.state?.phase === "ended" ? "rematch" : "start");
    }
    submit(text) {
      if (!canPlayParty(this.getIdentity())) return this.fail("Sign in with Google to play Puffer Party.");
      if (this.local) {
        const result = answerParty(this.state, this.state.players[this.state.turn].id, text);
        if (result.error) this.fail(result.error);
        else this.snapshot();
        return;
      }
      this.request("answer", { text: String(text).slice(0, 256) });
    }
    rules(patch) {
      this.request("rules", { patch });
    }
    visibility(isPrivate) {
      this.request("visibility", { private: isPrivate });
    }
    async ready(value) {
      try {
        await this.c.update(this.path("members/" + this.myId), { ready: !!value });
      } catch (e) {
        this.fail(friendly(e));
      }
    }
    async autoJoin(value) {
      try {
        await this.c.update(this.path("members/" + this.myId), { autoJoin: !!value });
      } catch (e) {
        this.fail(friendly(e));
      }
    }
    kick(id) {
      this.request("kick", { target: id });
    }
    async system(text) {
      if (!this.host || this.closed) return;
      try {
        await this.c.set(this.c.push(this.path("chat")), { uid: this.myId, name: "THE COURT", system: true, text: String(text).slice(0, 160), at: this.c.serverTimestamp() });
      } catch {
      }
    }
    async sendChat(text) {
      text = String(text).trim().slice(0, 160);
      if (!text) return;
      try {
        const m = this.members[this.myId];
        await this.c.update(this.path(), { ["chat/" + this.c.push(this.path("chat")).key]: { uid: this.myId, name: m.name, text, at: this.c.serverTimestamp() }, ["members/" + this.myId + "/lastChat"]: this.c.serverTimestamp() });
      } catch (e) {
        this.fail("Chat is unavailable. Wait a moment and try again.");
      }
    }
    tick() {
      if (this.closed || !this.state) return;
      if (!canPlayParty(this.getIdentity())) {
        this.fail("Your Google sign-in expired. Sign in again to play.");
        this.close();
        return;
      }
      if (this.local) {
        if (tickParty(this.state)) this.snapshot();
        return;
      }
      if (this.host) {
        const prior = this.state.phase;
        const roster = syncRoster(this.state, this.members, this.now()), step = stepParty(this.state, this.now());
        if (prior !== "ended" && this.state.phase === "ended") {
          this.system(this.state.notice);
          const changes = {};
          for (const [id, m] of Object.entries(this.members)) {
            m.ready = id === this.myId || !!m.autoJoin;
            changes["members/" + id + "/ready"] = m.ready;
          }
          this.c.update(this.path(), changes).catch(() => {
          });
        }
        if (roster || step) this.broadcast();
        if (!this.publishedAt || this.now() - this.publishedAt > 15e3) {
          this.publishedAt = this.now();
          this.publish().catch(() => {
          });
        }
      } else {
        const host = this.members[this.meta?.host];
        if (host?.online === false && this.now() - host.lastSeen > 3e4 && !this.claiming) {
          this.claiming = true;
          this.c.runTransaction(this.path("meta/host"), (id) => id === this.meta.host ? this.myId : void 0, { applyLocally: false }).catch(() => {
          }).finally(() => {
            this.claiming = false;
          });
        }
      }
    }
    createLocal(names2) {
      requirePartyIdentity(this.getIdentity());
      this.local = true;
      this.host = true;
      this.code = "LOCAL";
      this.myId = "local-0";
      this.state = newParty(names2.map((name, i) => ({ id: "local-" + i, name: cleanName(name) })));
      this.snapshot();
    }
    close(clear = true) {
      if (this.closed) return this.cleanup ?? Promise.resolve();
      this.closed = true;
      clearInterval(this.timer);
      clearInterval(this.presence);
      for (const off of this.unsub) off();
      const pending = [];
      if (this.c && this.code) pending.push(this.c.update(this.path("members/" + this.myId), { online: false, lastSeen: this.c.serverTimestamp() }).catch(() => {
      }));
      if (this.host && this.c) pending.push(this.c.remove(this.c.ref(this.c.db, "directory/" + this.code)).catch(() => {
      }));
      if (clear) this.state = null;
      return this.cleanup = Promise.all(pending);
    }
  };

  // party-view.js
  var esc5 = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  var BUDDIES = [["krill", "THE COUNSEL", 10], ["schooler", "THE CLERK", 30], ["squid", "THE ADVOCATE", 60], ["angler", "DEEP COUNSEL", 85], ["evil", "DEVIL\u2019S ADVOCATE", 100]];
  function buddySprite(kind = "krill") {
    return kind === "krill" ? `<img class="counsel-buddy" src="assets/${globalThis.document?.body?.classList.contains("reduced") || globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "counsel-krill-still.svg" : "counsel-krill.svg"}" alt="Krill wearing a barrister wig">` : tierSprite(BUDDIES.find((b) => b[0] === kind)?.[2] ?? 10, "party-buddy");
  }
  function entryMarkup(name, connected) {
    return `<section class="party-entry"><a class="back" href="#home">\u25C2 SURFACE</a><div class="party-title"><small>FUTURE COUNSEL PRESENTS</small><h1>PUFFER PARTY</h1><p>Pass the puffer. Make your case. Stay afloat.</p></div><section class="party-entry-card"><div class="party-entry-heading"><h2>WHO\u2019S PLAYING?</h2><button class="text-button" data-p-help>HOW TO PLAY \u2197</button></div><label class="field-label" for="player-name">YOUR DISPLAY NAME</label><input id="player-name" class="field" maxlength="16" value="${esc5(name)}" autocomplete="nickname" placeholder="Future counsel\u2026"><div class="buddy-picker" role="group" aria-label="Choose your buddy">${BUDDIES.map(([key, label]) => `<button class="buddy-choice ${key === "krill" ? "selected" : ""}" data-buddy="${key}" aria-label="${label}" aria-pressed="${key === "krill"}">${buddySprite(key)}<span>${label}</span></button>`).join("")}</div><button class="party-quick" data-p-connect="quick">QUICK PLAY <span>\u2197</span><small>Join an open courtroom</small></button><div class="party-host-row"><button class="pixel-button" data-p-connect="host">HOST A ROOM <span>\uFF0B</span></button><label><input type="checkbox" id="party-public" checked> PUBLIC \xB7 LISTED</label></div><div class="party-divider">OR JOIN BY CODE</div><form id="join-form" class="join-row"><label class="sr-only" for="room-code">Room code</label><input id="room-code" class="field" placeholder="ABCD" maxlength="4" pattern="[A-Za-z]{4}" required autocomplete="off"><button class="pixel-button" type="submit">JOIN \u25B8</button></form><p class="party-auth-note">${connected ? "\u25CF GOOGLE CONNECTED" : "GOOGLE SIGN-IN REQUIRED TO PLAY"} \xB7 YOUR EMAIL STAYS PRIVATE</p><p id="party-error" class="notice error" hidden role="alert"></p></section><section class="party-directory"><div class="party-entry-heading"><h2>PUBLIC COURTROOMS</h2><button class="text-button" data-p-refresh>\u21BB REFRESH</button></div><div id="party-rooms"><p class="party-empty">${connected ? "Looking for open courtrooms\u2026" : "Sign in with Google to see open rooms."}</p></div></section><div class="party-how"><span><b>1</b> ANSWER BEFORE IT POPS</span><span><b>2</b> RARITY RESTORES HEARTS</span><span><b>3</b> NO REPEATED ANSWERS</span></div></section>`;
  }
  function roomsMarkup(rooms, limit = 50) {
    return rooms.length ? rooms.slice(0, limit).map((r) => `<button class="directory-room" data-room="${esc5(r.code)}" ${r.count >= r.seats ? "disabled" : ""}><span>${esc5(r.hostName)}\u2019s court<small>${esc5(r.code)} \xB7 ${r.phase === "lobby" ? "LOBBY" : "PLAYING"}</small></span><b>${r.count}/${r.seats}</b><em>${r.count >= r.seats ? "FULL" : "JOIN \u2197"}</em></button>`).join("") + (rooms.length > limit ? '<button class="party-more text-button" data-room-more>LOAD MORE COURTROOMS \u2193</button>' : "") : '<p class="party-empty">The court is quiet. Host a room and invite your friends.</p>';
  }
  var hearts = (p) => '<span aria-label="' + p.hearts + ' hearts">' + Array.from({ length: Math.max(1, p.hearts) }, (_, i) => `<i class="${p.hearts ? "" : "empty"}">\u2665</i>`).join("") + "</span>";
  function arenaPositions(count) {
    return Array.from({ length: count }, (_, i) => {
      const a = -Math.PI / 2 + i / count * Math.PI * 2;
      return { x: 50 + Math.sin(a) * 34, y: 51 + Math.cos(a) * 29 };
    });
  }
  var PartyView = class {
    constructor(root, { help, leave, invite, error }) {
      Object.assign(this, { root, help, leave, invite, error, chatOpen: false, rulesOpen: false, lastTurn: null, lastAccepted: null });
    }
    mount() {
      this.root.innerHTML = `<section class="party-arena"><div class="arena-water" aria-hidden="true"></div><div class="party-hud"><button class="room-badge" id="p-room" aria-label="Change room visibility"></button><span id="p-phase"></span><span id="p-count"></span></div><button class="arena-leave icon" aria-label="Leave room">\u21B6</button><button class="arena-chat icon" aria-label="Open chat" aria-expanded="false">\u25A4<i hidden></i></button><div class="arena-prompt" id="p-prompt"></div><div class="arena-ring" id="p-ring"></div><div class="puffer-flight-layer"><div class="passing-puffer" id="p-puffer"><img src="assets/puffer.svg" alt="The puffer"><span class="puffer-zzz">z z z</span></div></div><div class="puffer-pop" id="p-pop" aria-hidden="true">${Array.from({ length: 16 }, (_, i) => `<i style="--i:${i}"></i>`).join("")}</div><div class="arena-center" id="p-center"></div><div class="arena-status" id="p-status" role="status"></div><p id="party-error" class="arena-error" hidden role="alert"></p><div class="party-bottom" id="p-bottom"></div><aside class="party-drawer" id="p-drawer" hidden></aside></section>`;
      this.root.querySelector(".arena-leave").onclick = this.leave;
      this.root.querySelector(".arena-chat").onclick = () => {
        this.chatOpen = !this.chatOpen;
        this.rulesOpen = false;
        this.drawer();
      };
      this.root.querySelector("#p-room").onclick = () => {
        if (this.session.host) this.session.visibility(!this.session.meta.isPrivate);
      };
    }
    render(s, session2) {
      this.s = s;
      this.session = session2;
      if (!this.root.querySelector(".party-arena")) this.mount();
      const q2 = (sel) => this.root.querySelector(sel), lobby = ["lobby", "ended"].includes(s.phase), playing = s.phase === "playing", me = s.players.find((p) => p.id === session2.myId), mine = s.players[s.turn]?.id === session2.myId, alive2 = s.players.filter((p) => p.connected && p.hearts > 0 && !p.spectator), ready = s.players.filter((p) => p.connected && p.ready), positions = arenaPositions(s.players.length);
      this.root.querySelector(".party-arena").classList.toggle("dense-room", s.players.length > 8);
      q2("#p-room").innerHTML = `<small>${session2.preview ? "ART PREVIEW" : session2.meta?.isPrivate ? "PRIVATE" : "PUBLIC"}</small><strong>${esc5(session2.code)}</strong>`;
      q2("#p-room").disabled = !session2.host;
      q2("#p-phase").textContent = lobby ? "LOBBY" : s.phase === "countdown" ? "COURT CONVENES" : "CATEGORY " + s.round;
      q2("#p-count").innerHTML = lobby ? `READY <b>${ready.length}/${s.settings.maxPlayers}</b>` : `FLOATING <b>${alive2.length}/${s.players.filter((p) => !p.spectator).length}</b>`;
      q2("#p-prompt").hidden = lobby;
      q2("#p-prompt").innerHTML = !lobby && s.round ? `<small>CATEGORY ${s.round} \xB7 ${esc5(partyPack(s).topic)}</small><h1>${esc5(partyPack(s).prompt)}</h1>` : "";
      const rosterKey = JSON.stringify([s.players, s.turn, s.phase, s.settings.meterTarget]);
      if (this.rosterKey !== rosterKey) {
        this.rosterKey = rosterKey;
        q2("#p-ring").innerHTML = s.players.map((p, i) => `<div class="arena-player ${playing && s.turn === i ? "holding" : ""} ${p.hearts === 0 && !lobby ? "eliminated" : ""} ${p.id === session2.myId ? "you" : ""}" style="--x:${positions[i].x}%;--y:${positions[i].y}%;--delay:${-i * 0.72}s" data-player="${esc5(p.id)}">${p.lastAnswer ? `<div class="player-answer ${tier(p.lastAnswer.points).color}">${esc5(p.lastAnswer.label)} <b>+${p.lastAnswer.points}</b></div>` : ""}<div class="player-buddy">${buddySprite(p.buddy)}</div><div class="player-pedestal"></div><strong>${esc5(p.name)}${p.id === session2.myId ? "<small> YOU</small>" : ""}</strong><div class="player-hearts">${p.spectator && !lobby ? "<small>NEXT GAME</small>" : hearts(p)}</div><div class="player-meter"><i style="width:${100 * Math.min(1, p.meter / s.settings.meterTarget)}%"></i></div>${lobby ? `<span class="player-ready">${p.connected ? p.ready ? "READY" : "WATCHING" : "OFFLINE"}</span>` : ""}</div>`).join("");
      }
      const centerKey = s.phase + ":" + s.winner;
      if (this.centerKey !== centerKey) {
        this.centerKey = centerKey;
        q2("#p-center").innerHTML = s.phase === "lobby" ? "<small>THE COURT IS ASSEMBLING</small><h2>PUFFER<br>PARTY</h2>" : s.phase === "ended" ? `<small>THE VERDICT IS IN</small><h2>${esc5(s.players.find((p) => p.id === s.winner)?.name ?? "No one")}<br><em>WINS!</em></h2>` : s.phase === "countdown" ? '<strong id="p-countdown">3</strong>' : "";
      }
      const bottomKey = [lobby, !!me?.spectator, !!me?.hearts, me?.ready, me?.autoJoin, session2.host, ready.length, s.phase, JSON.stringify(s.settings)].join(":");
      if (this.bottomKey !== bottomKey) {
        const draft = q2("#party-answer")?.value ?? "", focused = document.activeElement === q2("#party-answer");
        this.bottomKey = bottomKey;
        if (lobby) {
          q2("#p-bottom").innerHTML = `${session2.host ? `<div class="lobby-settings">${[["lives", "LIVES", s.settings.lives], ["minTurnMs", "MIN. TURN", s.settings.minTurnMs / 1e3 + "s"], ["maxPlayers", "SEATS", s.settings.maxPlayers]].map(([key, label, value]) => `<div><small>${label}</small><div><button data-step="${key}" data-dir="-1" aria-label="Decrease ${label}">\u2039</button><strong>${value}</strong><button data-step="${key}" data-dir="1" aria-label="Increase ${label}">\u203A</button></div></div>`).join("")}<button data-rules><small>HEART RULES</small>EDIT \u2197</button></div>` : ""}<button class="wake-puffer" data-start ${session2.host ? ready.length < 2 ? "disabled" : "" : ""}>${session2.host ? s.phase === "ended" ? "\u21BB WAKE IT AGAIN" : "WAKE THE PUFFER" : me?.ready ? "\u2713 READY \xB7 WAITING FOR HOST" : "JOIN NEXT GAME"}</button><div class="lobby-foot"><label><input type="checkbox" data-auto ${me?.autoJoin ? "checked" : ""}> AUTO-JOIN</label><span>${ready.length} READY \xB7 ${Math.max(0, s.settings.maxPlayers - ready.length)} OPEN</span><button data-invite>INVITE \u2197</button></div><button class="party-help-link" data-help>HOW TO PLAY</button>`;
          q2("[data-start]").onclick = () => session2.host ? session2.start() : session2.ready(!me?.ready);
          q2("[data-auto]").onchange = (e) => session2.autoJoin(e.target.checked);
          q2("[data-invite]").onclick = this.invite;
          q2("[data-help]").onclick = this.help;
          q2("[data-rules]")?.addEventListener("click", () => {
            this.rulesOpen = !this.rulesOpen;
            this.chatOpen = false;
            this.drawer();
          });
          q2("#p-bottom").querySelectorAll("[data-step]").forEach((b) => b.onclick = () => {
            const k = b.dataset.step;
            session2.rules({ [k]: s.settings[k] + Number(b.dataset.dir) * (k === "minTurnMs" ? 1e3 : 1) });
          });
        } else {
          q2("#p-bottom").innerHTML = `<form class="party-answer-dock" id="party-answer-form"><div class="dock-heart"><b>\u2665</b><span id="p-myhearts">${me?.hearts ?? 0}</span><i style="--meter:${100 * (me?.meter ?? 0) / s.settings.meterTarget}%"></i></div><label class="sr-only" for="party-answer">Your answer</label><input id="party-answer" class="field" placeholder="Your answer\u2026" maxlength="120" required autocomplete="off" spellcheck="false" ${!me || me.spectator || me.hearts <= 0 ? "disabled" : ""}><button type="submit" id="p-send" ${!mine || !playing ? "disabled" : ""}>SEND \u2197</button></form><div class="dock-caption"><span id="p-turn"></span><span id="p-fuse" aria-label="Puffer fuse"><i id="party-timer-fill"></i></span><span class="sr-only" id="party-timer"></span></div>${me?.spectator ? `<button class="join-next" data-next ${me?.ready ? "disabled" : ""}>${me?.ready ? "\u2713 READY FOR NEXT GAME" : "JOIN NEXT GAME"}</button>` : ""}`;
          q2("#party-answer").value = draft;
          q2("#party-answer-form").onsubmit = (e) => {
            e.preventDefault();
            session2.submit(q2("#party-answer").value);
          };
          q2("[data-next]")?.addEventListener("click", () => session2.ready(true));
          if ((focused || s.phase === "countdown") && !q2("#party-answer").disabled) q2("#party-answer").focus({ preventScroll: true });
        }
      }
      if (!lobby) {
        q2("#p-send").disabled = !mine || !playing || !session2.connected;
        q2("#p-turn").textContent = me?.spectator ? "WATCHING \xB7 YOU CAN JOIN THE NEXT GAME" : s.phase === "burst" ? "PUFFER POPPED!" : mine ? "\u25B8 YOUR TURN" : "\u25B8 " + (s.players[s.turn]?.name ?? "Counsel") + " IS UP";
        q2("#p-myhearts").textContent = me?.hearts ?? 0;
        const meter = q2(".dock-heart>i");
        if (meter) meter.style.setProperty("--meter", Math.min(100, 100 * (me?.meter ?? 0) / s.settings.meterTarget) + "%");
      }
      if (session2.lastAccepted && this.lastAccepted !== session2.lastAccepted) {
        this.lastAccepted = session2.lastAccepted;
        if (q2("#party-answer")) q2("#party-answer").value = "";
      }
      const target = lobby || s.phase === "countdown" ? { x: 50, y: 40 } : positions[s.turn] ?? { x: 50, y: 50 };
      q2("#p-puffer").classList.toggle("sleeping", lobby);
      q2("#p-puffer").classList.toggle("hidden", s.phase === "burst" || s.phase === "ended");
      q2("#p-puffer").style.left = target.x + "%";
      q2("#p-puffer").style.top = target.y - 8 + "%";
      const turnKey = s.round + ":" + s.turn;
      if (this.lastTurn && this.lastTurn !== turnKey && playing && !document.body.classList.contains("reduced") && !globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
        q2("#p-puffer").animate([{ translate: "0 0", rotate: "-12deg" }, { translate: "0 -55px", rotate: "8deg", offset: 0.5 }, { translate: "0 0", rotate: "0deg" }], { duration: 850, easing: "cubic-bezier(.2,.7,.3,1)" });
      }
      this.lastTurn = turnKey;
      if (s.popped?.at !== this.popAt) {
        this.popAt = s.popped?.at;
        if (s.popped) {
          q2("#p-pop").classList.remove("burst");
          void q2("#p-pop").offsetWidth;
          const i = s.players.findIndex((p) => p.id === s.popped.id), pos = positions[i] ?? { x: 50, y: 50 };
          q2("#p-pop").style.left = pos.x + "%";
          q2("#p-pop").style.top = pos.y - 8 + "%";
          q2("#p-pop").classList.add("burst");
        }
      }
      q2("#p-status").textContent = session2.connected === false ? "Reconnecting\u2026" : session2.preview ? "SIMULATED ART PREVIEW \xB7 NO ONLINE ROOM" : s.phase === "burst" ? s.notice : "";
      this.drawer();
      this.updateClock();
    }
    updateClock() {
      const s = this.s;
      if (!s) return;
      const q2 = (sel) => this.root.querySelector(sel), remaining = Math.max(0, s.deadline - (Date.now() + this.session.offset));
      if (q2("#party-timer")) q2("#party-timer").textContent = s.phase === "playing" ? Math.ceil(remaining / 1e3) + " seconds remaining" : s.phase;
      if (q2("#party-timer-fill")) {
        q2("#party-timer-fill").style.transform = `scaleX(${s.phase === "playing" ? Math.min(1, remaining / 3e4) : 0})`;
        q2("#p-fuse").classList.toggle("urgent", remaining < 5e3);
      }
      q2("#p-puffer")?.classList.toggle("urgent", s.phase === "playing" && remaining < 5e3);
      if (q2("#p-countdown")) q2("#p-countdown").textContent = Math.max(1, Math.ceil((s.nextAt - Date.now() - this.session.offset) / 1e3));
    }
    drawer() {
      const el = this.root.querySelector("#p-drawer");
      if (!el) return;
      el.hidden = !this.chatOpen && !this.rulesOpen;
      this.root.querySelector(".arena-chat").setAttribute("aria-expanded", String(this.chatOpen));
      if (el.hidden) {
        this.drawerKind = null;
        this.chatKey = null;
        return;
      }
      const session2 = this.session, s = this.s;
      if (this.rulesOpen) {
        if (this.drawerKind === "rules" && this.rulesKey === JSON.stringify([s.settings, session2.meta.isPrivate])) return;
        this.rulesKey = JSON.stringify([s.settings, session2.meta.isPrivate]);
        this.drawerKind = "rules";
        el.innerHTML = `<div class="drawer-heading"><h2>HEART RULES</h2><button data-close aria-label="Close rules">\xD7</button></div>${[["maxLives", "HEART CAP", s.settings.maxLives, 1], ["meterTarget", "POINTS / HEART", s.settings.meterTarget, 50]].map(([key2, label, value]) => `<div class="heart-rule"><span>${label}</span><button data-rule="${key2}" data-dir="-1" aria-label="Decrease ${label}">\u2039</button><strong>${value}</strong><button data-rule="${key2}" data-dir="1" aria-label="Increase ${label}">\u203A</button></div>`).join("")}<button class="drawer-visibility" data-visibility>ROOM \xB7 ${session2.meta.isPrivate ? "PRIVATE" : "PUBLIC"} \u2194</button>`;
        el.querySelector("[data-close]").onclick = () => {
          this.rulesOpen = false;
          this.drawer();
        };
        el.querySelector("[data-visibility]").onclick = () => session2.visibility(!session2.meta.isPrivate);
        el.querySelectorAll("[data-rule]").forEach((b) => b.onclick = () => {
          const k = b.dataset.rule;
          session2.rules({ [k]: s.settings[k] + Number(b.dataset.dir) * (k === "meterTarget" ? 50 : 1) });
        });
        return;
      }
      if (this.drawerKind !== "chat") {
        this.drawerKind = "chat";
        el.innerHTML = `<div class="drawer-heading"><h2>COURT CHAT</h2><button data-close aria-label="Close chat">\xD7</button></div><details class="chat-roster"><summary>PLAYERS \xB7 ${s.players.length}</summary><div>${s.players.map((p) => `<p>${esc5(p.name)}${p.id === session2.meta.host ? " <small>HOST</small>" : ""}${session2.host && p.id !== session2.myId ? `<button data-kick="${esc5(p.id)}" aria-label="Remove ${esc5(p.name)} from room">REMOVE</button>` : ""}</p>`).join("")}</div></details><div class="chat-messages" id="p-messages" role="log" aria-label="Room chat"></div><form id="chat-form"><label class="sr-only" for="chat-message">Chat message</label><input id="chat-message" placeholder="Message the courtroom\u2026" maxlength="160" autocomplete="off"><button type="submit">SEND</button></form>`;
        el.querySelector("[data-close]").onclick = () => {
          this.chatOpen = false;
          this.drawer();
        };
        el.querySelectorAll("[data-kick]").forEach((b) => b.onclick = () => session2.kick(b.dataset.kick));
        el.querySelector("#chat-form").onsubmit = (e) => {
          e.preventDefault();
          session2.sendChat(el.querySelector("input").value);
          el.querySelector("input").value = "";
        };
      }
      const messages = el.querySelector("#p-messages"), key = JSON.stringify(session2.chat);
      if (this.chatKey !== key) {
        this.chatKey = key;
        messages.innerHTML = session2.chat.length ? session2.chat.map((m) => `<p class="${m.system ? "system" : ""}">${m.system ? "" : `<b>${esc5(m.name)}</b>`}<span>${esc5(m.text)}</span></p>`).join("") : '<p class="system">The courtroom is open. Say hello to your friends.</p>';
        messages.scrollTop = messages.scrollHeight;
      }
    }
  };

  // app.js
  var $ = (s) => document.querySelector(s);
  var app = $("#app");
  var ocean = new Ocean($("#world"));
  function screen(value) {
    if (value !== "party") {
      document.body.dataset.partyArena = "false";
      ocean.suspend(false);
    }
    document.body.dataset.screen = value;
    ocean.set(value === "dive" ? "dive" : value === "party" ? "party" : "home", value === "dive" && quiz ? total() * 10 : 0);
  }
  var esc6 = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
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
  var caseChallenge = null;
  var account = null;
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
    ocean.attachBuddy($(".dive-buddy"));
    $("#sound-button").textContent = settings.sound ? "\u266B" : "\u266A";
    $("#sound-button").setAttribute("aria-label", settings.sound ? "Turn sound off" : "Turn sound on");
  }
  function modal(content) {
    $("#modal").classList.remove("site-menu");
    $("#modal-content").innerHTML = content;
    if (!$("#modal").open) $("#modal").showModal();
  }
  function howTo() {
    modal(`<div class="eyebrow">FUTURE COUNSEL FIELD GUIDE</div><h2>HOW TO DIVE</h2><ol><li>Seven prompts. You have <span class="gold">25 seconds</span> to name one answer for each.</li><li>Find a less obvious answer. Curated rarity tiers award <span class="gold">10\u2013100 points</span>. Every point takes you 10 metres deeper. Rejected answers can be retried while the timer runs; any text left at zero is submitted automatically.</li><li>Everyone gets the same Daily Dive: one prompt each from wordplay, nature, food, science, culture, geography, and everyday curiosities. Each topic rotates through its pool without repeating yesterday\u2019s prompt. A fresh set arrives at midnight in New York. Practice as often as you like.</li></ol><h3>ENDLESS CASES</h3><p>Read the details. Four choices per question. Get five right in a row to clear a challenge; one wrong answer resets the streak. Questions and answer positions shuffle. Keep diving through unlimited rounds drawn from Gavin\u2019s 16 published case reviews and his own analysis.</p><h3>PUFFER PARTY</h3><p>Sign in with Google to host or join. Host a room, share its code, and take turns naming answers. A valid answer passes the puffer. You cannot reuse an answer in the current round.</p><p>The shared fuse keeps burning between turns. If it pops on you, you lose a heart. Start with two hearts. Earn 600 rarity points to restore a heart, up to five. Each new turn gets at least eight seconds. Last counsel floating wins.</p><p class="muted">Source-backed answer banks and original familiarity rankings. Scores combine corpus familiarity with editorial tiers and special 100-point discoveries; they do not measure how often players choose an answer. Some valid answers may be missing. This is a Future Counsel fan game inspired by Krillion; it is not affiliated with Krillion.</p><a class="fc-link" href="https://futurecounsel.org/" target="_blank" rel="noopener">EXPLORE FUTURE COUNSEL \u2197</a>`);
  }
  function showSettings() {
    modal(`<div class="eyebrow">CONTROL ROOM</div><h2>SETTINGS</h2><label class="setting-row"><span>Sound effects<small>Little arcade bleeps.</small></span><input type="checkbox" data-setting="sound" ${settings.sound ? "checked" : ""}></label><label class="setting-row"><span>CRT scanlines<small>The old-school screen effect.</small></span><input type="checkbox" data-setting="scanlines" ${settings.scanlines ? "checked" : ""}></label><label class="setting-row"><span>Animations<small>Bobbing fish and gentle movement.</small></span><input type="checkbox" data-setting="motion" ${settings.motion ? "checked" : ""}></label><label class="setting-row"><span>Answer corrections<small>Confirm typos and abbreviations before scoring.</small></span><input type="checkbox" data-setting="answerCorrections" ${settings.answerCorrections !== false ? "checked" : ""}></label><label class="setting-row"><span>Clear rejected entries<small>Empty the input after an unrecognized answer.</small></span><input type="checkbox" data-setting="clearRejected" ${settings.clearRejected ? "checked" : ""}></label><p class="muted">Daily results and preferences are saved on this browser. Multiplayer uses Google-authenticated rooms. Keep the host\u2019s tab open during play.</p>`);
  }
  function home() {
    screen("home");
    const day = dateKey(), stored = read("daily:" + day, null), done = stored?.stage === "done";
    app.innerHTML = `<section class="hero"><p class="eyebrow">FUTURE COUNSEL PRESENTS</p><h1 class="brand-title" aria-label="Councillion">${[..."COUNCILLION"].map((c, i) => `<span aria-hidden="true" style="--letter:${i}">${c}</span>`).join("")}</h1><p class="subtitle">THE DAILY DIVE</p><p class="hero-copy">7 prompts \xB7 25 seconds each \xB7 rarer answers sink deeper</p></section><section class="home-panel"><div class="banner"><span>DAILY DIVE \xB7 ${esc6(day)}</span><span id="reset-clock"></span></div><button class="pixel-button home-party" data-action="party">${puffer()}<span>PUFFER PARTY<small>Play with your friends</small></span><b>\u2197</b></button>${button("daily", done ? "VIEW TODAY\u2019S DIVE \u2197" : stored ? "CONTINUE DESCENT \u25BC" : "BEGIN DESCENT \u25BC", "primary")}<div class="surface-secondary"><button class="text-button" data-action="endless">\u221E ENDLESS CASES</button><button class="text-button" data-action="help">? HOW TO PLAY</button></div><p class="endless-tagline">16 case reviews. Four choices. Five right in a row.</p><p class="surface-signoff"><a href="https://futurecounsel.org/" target="_blank" rel="noopener">FUTURE COUNSEL</a><span>one in a councillion.</span></p></section>`;
    updateClock();
  }
  function showBank(id = quizPack()?.id) {
    if (quiz && quiz.stage !== "done" && ["daily", "practice"].includes(route)) return;
    const pack2 = PACKS.find((p) => p.id === id);
    if (!pack2) return;
    modal(`<div class="eyebrow">${esc6(pack2.topic)}</div><h2>THE ANSWER BANK</h2><p>${esc6(pack2.prompt)}</p><div id="bank-mount"></div>`);
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
      quiz = { mode, day, ids: (mode === "daily" ? dailyPacks(day) : featured ? [featured, ...shuffle(PLAY_PACKS.filter((p) => p.id !== featured.id)).slice(0, 6)] : shuffle(PLAY_PACKS).slice(0, 7)).map((p) => p.id), round: 0, results: [], stage: "intro", readyAt: Date.now() + 3e3, deadline: Date.now() + 28e3 };
      persistQuiz();
    }
    if (resumedLive) {
      if (quiz.stage !== "done") ocean.set("dive", total() * 10);
      ocean.snap(quiz.stage === "done" ? 0 : total() * 10);
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
      message.textContent = `\u201C${String(text).slice(0, 70)}\u201D: not recognized. Try a fuller name or another spelling.`;
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
      message.textContent = `${answer.abbreviated ? "Abbreviation recognized: " : "Did you mean "}\u201C${answer.label}\u201D? \xB7 DIVE again to confirm`;
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
  function startEndless() {
    screen("endless");
    caseChallenge ??= new CaseChallenge(app, ocean, { read, save });
    caseChallenge.render();
    applySettings();
  }
  function oceanTour() {
    screen("biomes");
    tourPlaying = false;
    const initial = Number(new URLSearchParams(location.hash.split("?")[1] ?? "").get("depth") || 0);
    ocean.set("dive", Math.max(0, Math.min(7e3, initial)));
    app.innerHTML = `<section class="ocean-tour"><div class="tour-heading"><p>COUNCILLION \xB7 OCEAN PREVIEW</p><h1 id="tour-biome">SUNLIT WATERS</h1><strong id="tour-depth">0m</strong><span>Drag the depth marker to explore.</span></div><div class="tour-controls"><div class="tour-stops">${[0, 250, 750, 1700, 3200].map((d, i) => `<button data-depth="${d}">${["SUNLIT", "TWILIGHT", "MIDNIGHT", "ABYSS", "HADAL"][i]}</button>`).join("")}</div><input id="tour-slider" type="range" min="0" max="7000" step="10" value="${ocean.depth}" aria-label="Preview ocean depth"><div class="tour-actions"><button class="text-button" id="tour-play">\u25B6 SLOW DESCENT</button><a href="#practice">PLAY A DIVE \u2197</a><a href="#home">\u2191 SURFACE</a></div></div></section>`;
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
      modal(`<h2>COPY & SHARE</h2><label class="sr-only" for="copy-text">Text to share</label><textarea class="field" id="copy-text" rows="7" readonly>${esc6(text)}</textarea>`);
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
  var partyView = null;
  var roomUnsubscribe = null;
  var roomList = [];
  var chosenBuddy = "krill";
  var roomLimit = 50;
  function showRooms() {
    const mount = $("#party-rooms");
    if (!mount) return;
    mount.innerHTML = roomsMarkup(roomList, roomLimit);
    mount.querySelectorAll("[data-room]").forEach((b) => b.onclick = () => {
      $("#room-code").value = b.dataset.room;
      connectParty("join");
    });
    mount.querySelector("[data-room-more]")?.addEventListener("click", () => {
      roomLimit += 50;
      showRooms();
    });
  }
  function partySetup() {
    screen("party");
    ocean.suspend(false);
    document.body.dataset.partyArena = "false";
    partyView = null;
    roomUnsubscribe?.();
    roomUnsubscribe = null;
    const identity = account?.identity;
    app.innerHTML = entryMarkup(profile.name || identity?.name || "", canPlayParty(identity));
    $("#join-form").onsubmit = (e) => {
      e.preventDefault();
      connectParty("join");
    };
    app.querySelectorAll("[data-p-connect]").forEach((b) => b.onclick = () => connectParty(b.dataset.pConnect));
    app.querySelectorAll("[data-buddy]").forEach((b) => b.onclick = () => {
      chosenBuddy = b.dataset.buddy;
      app.querySelectorAll("[data-buddy]").forEach((x) => {
        x.classList.toggle("selected", x === b);
        x.setAttribute("aria-pressed", String(x === b));
      });
    });
    $("[data-p-help]").onclick = howTo;
    $("[data-p-refresh]").onclick = refreshRooms;
    const code = new URLSearchParams(location.hash.split("?")[1] ?? "").get("room");
    if (code) $("#room-code").value = code.slice(0, 4);
    if (canPlayParty(identity)) refreshRooms();
  }
  async function refreshRooms() {
    if (!canPlayParty(account?.identity)) {
      account?.open();
      return;
    }
    roomUnsubscribe?.();
    try {
      roomUnsubscribe = await publicRooms(() => account.partySession(), (rooms) => {
        roomList = rooms;
        showRooms();
      }, partyError);
    } catch (e) {
      partyError(e.message);
    }
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
      clearTimeout(el._hide);
      if (party?.state) el._hide = setTimeout(() => el.hidden = true, 6500);
    } else toast(message);
  }
  async function connectParty(kind) {
    if (!canPlayParty(account?.identity)) {
      account?.open();
      return;
    }
    let name;
    try {
      name = playerName();
    } catch (e) {
      partyError(e.message);
      return;
    }
    let code = $("#room-code")?.value;
    const options = { buddy: chosenBuddy, isPrivate: !$("#party-public")?.checked };
    if (kind === "quick") {
      const open = roomList.find((r) => r.phase === "lobby" && r.count < r.seats) ?? roomList.find((r) => r.count < r.seats);
      if (open) {
        code = open.code;
        kind = "join";
      } else {
        kind = "host";
        options.isPrivate = false;
      }
    }
    const buttons = [...app.querySelectorAll("button")];
    buttons.forEach((b) => b.disabled = true);
    partyError(kind === "host" ? "Opening a courtroom\u2026" : "Connecting to the courtroom\u2026");
    party?.close();
    party = new PartySession(renderParty, partyError, () => account?.identity, () => account.partySession());
    try {
      if (kind === "host") await party.create(name, options);
      else await party.join(name, code, options);
      roomUnsubscribe?.();
      roomUnsubscribe = null;
      history.replaceState(null, "", "#party?room=" + party.code);
    } catch (e) {
      party?.close();
      party = null;
      partyError(e.message);
      buttons.forEach((b) => b.disabled = false);
    }
  }
  function leaveParty() {
    party?.close();
    party = null;
    lastPartyTurn = null;
    history.replaceState(null, "", "#party");
    partySetup();
  }
  function renderParty(s, session2) {
    if (route !== "party") return;
    screen("party");
    document.body.dataset.partyArena = "true";
    ocean.suspend(true);
    partyView ??= new PartyView(app, { help: howTo, leave: leaveParty, invite: () => copyText(location.href.split("#")[0] + "#party?room=" + party.code, "Invite link copied!"), error: partyError });
    partyView.render(s, session2);
  }
  function updateTimer() {
    if (route === "biomes") {
      const now = Date.now();
      if (tourPlaying) {
        ocean.glide(Math.min(7e3, ocean.depth + (now - tourPrevious) * 0.08));
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
    if (party?.state && route === "party") partyView?.updateClock();
  }
  function navigate() {
    const next = location.hash.slice(1).split("?")[0] || "home";
    if (party && next !== "party") {
      party.close();
      party = null;
      lastPartyTurn = null;
      partyView = null;
    }
    if (next !== "party") {
      roomUnsubscribe?.();
      roomUnsubscribe = null;
    }
    route = next;
    if (next === "daily" || next === "practice") startQuiz(next);
    else if (next === "endless") startEndless();
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
      case "endless":
        location.hash = "endless";
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
  function openMenu() {
    modal(`<div class="menu-kicker">COUNCILLION</div><h2 class="menu-title">MENU</h2><div class="menu-section-label">DIVE IN <span></span></div><nav class="menu-grid" aria-label="Main navigation"><a href="#daily" class="${route === "daily" ? "selected" : ""}"><span>\u2193</span><strong>DAILY DIVE</strong></a><a href="#endless" class="${route === "endless" ? "selected" : ""}"><span>\u221E</span><strong>ENDLESS CASES</strong></a><a href="#party" class="${route === "party" ? "selected" : ""}">${puffer()}<strong>PUFFER PARTY</strong></a><a href="#home"><span>\u2191</span><strong>THE SURFACE</strong></a><a href="#biomes"><span>\u224B</span><strong>OCEAN EXPLORER</strong></a><button data-menu-settings><span>\u2699</span><strong>SETTINGS</strong></button><button data-menu-help><span>?</span><strong>HOW TO PLAY</strong></button><a href="#practice"><span>\u25C7</span><strong>TRIVIA PRACTICE</strong></a></nav><a class="menu-counsel" href="https://futurecounsel.org/archive" target="_blank" rel="noopener"><span>\u2696</span><div>FUTURE COUNSEL<small>Read the 16 case reviews</small></div><b>\u2197</b></a><p class="menu-timer-note">${quiz?.stage === "answer" && ["daily", "practice"].includes(route) ? "Your timer keeps running while the menu is open." : "one in a councillion."}</p>`);
    $("#modal").classList.add("site-menu");
    $("#modal-content [data-menu-settings]").onclick = () => {
      showSettings();
    };
    $("#modal-content [data-menu-help]").onclick = () => {
      howTo();
    };
  }
  $("#menu-button").onclick = openMenu;
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
    if (route === "endless") {
      caseChallenge?.keydown(e);
      return;
    }
    if (e.key === "Enter" && ["daily", "practice"].includes(route) && ["sinking", "result"].includes(quiz?.stage) && !$("#modal").open && !e.target.closest("button,a,input,textarea,summary")) {
      e.preventDefault();
      nextQuiz();
    }
  });
  window.addEventListener("pagehide", () => {
    if (quiz) persistQuiz();
  });
  account = connectAccount({ button: $("#account-button"), modal, escape: esc6, beforeSignOut: async () => {
    await party?.close();
  }, onIdentity: (identity) => {
    if (identity) {
      profile.name = identity.name;
      save("profile", profile);
    }
    if (route === "party") {
      if (!identity) {
        party?.close();
        party = null;
        lastPartyTurn = null;
      }
      if (!party) partySetup();
    }
  } });
  applySettings();
  navigate();
  setInterval(updateTimer, 100);
  setInterval(updateClock, 1e3);
})();
