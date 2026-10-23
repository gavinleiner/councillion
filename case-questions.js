// Original close-reading questions based on Gavin's 16 published reviews.
// The first option here is stored as text, never as a fixed on-screen letter.
const slugs=['miranda-v-arizona','tarasoff-v-regents-of-the-university-of-california','case-v-montana','hamm-v-smith','pennsylvania-v-mimms','bush-v-gore','rodriguez-vazquez-v-bostock','brady-v-maryland','mahanoy-area-school-district-v-b.l.','walker-v-uber-technologies','robinson-v-commonwealth','colorado-v-connelly','kyllo-v-united-states','nolen-v-peopleconnect-inc','talbot-v-ainuu','jdb-v-north-carolina'];
const names=['Miranda v. Arizona','Tarasoff v. Regents','Case v. Montana','Hamm v. Smith','Pennsylvania v. Mimms','Bush v. Gore','Rodriguez Vazquez v. Bostock','Brady v. Maryland','Mahanoy v. B. L.','Walker v. Uber','Robinson v. Commonwealth','Colorado v. Connelly','Kyllo v. United States','Nolen v. PeopleConnect','Talbot v. Ainuu','J.D.B. v. North Carolina'];
export const CASE_SOURCES=slugs.map((slug,i)=>({name:names[i],url:'https://futurecounsel.org/case/'+slug}));
const questions=[];
function q(caseIndex,prompt,answer,distractors,explanation,category='CASE FILE'){questions.push({id:'fc-'+(caseIndex+1)+'-'+questions.filter(q=>q.caseIndex===caseIndex).length,caseIndex,prompt,answer,distractors,explanation,category,source:CASE_SOURCES[caseIndex].url,caseName:names[caseIndex]});}
q(0,'Why had the Arizona Supreme Court allowed Miranda’s confession before the U.S. Supreme Court reversed?',
 'He had not specifically requested an attorney.',
 ['He had already received a complete warning.','His confession was recorded before he entered custody.','The confession was never introduced at trial.'],
 'The review says Arizona relied on Miranda’s failure to request counsel. The later ruling required safeguards before custodial questioning.');
q(0,'Which sequence matches the Miranda review’s background?',
 'Identification in a lineup, roughly two hours of questioning, then a signed confession.',
 ['A signed confession, then a lineup, then his first police interview.','A warning and a lawyer, then two days of questioning.','An anonymous tip, acquittal, then a signed confession on appeal.'],
 'The background places the lineup before the interrogation and written confession, with no clear warning of the relevant rights.');
q(0,'Which contrast best captures the Miranda review’s majority–dissent disagreement?',
 'Practical safeguards against interrogation pressure versus concern about restricting investigations.',
 ['Whether Miranda was in Arizona versus whether he was in federal custody.','Whether a confession existed versus whether it was signed.','A ban on all questioning versus a requirement to question every suspect.'],
 'The majority wanted an advance, workable safeguard. The dissent worried the new rule was too rigid and would exclude reliable confessions.');
q(0,'What did the Miranda decision actually do to the conviction described in the review?',
 'Reversed it because the custodial confession lacked the required safeguards.',
 ['Declared him factually innocent of every allegation.','Upheld it because he never requested counsel.','Replaced the prison sentence with an award of civil damages.'],
 'The review reports reversal of the conviction, not a finding that Miranda was factually innocent.');
q(1,'Why does the Tarasoff review distinguish a 5–2 judgment from a four-justice majority?',
 'Five agreed on the result, but only four fully joined the main opinion’s reasoning.',
 ['Four voted to reverse and one voted to affirm.','The fifth justice joined only the dissent.','Only four justices participated in the case.'],
 'One justice agreed with the outcome in part while disagreeing with some broader reasoning. Result and full agreement with an opinion are different.');
q(1,'Which immunity distinction did the Tarasoff review draw?',
 'Immunity for failure to confine did not also provide immunity for failure to warn.',
 ['Immunity for failure to warn automatically covered failure to confine.','The therapists had no governmental immunity for any act.','Only the victim’s parents received governmental immunity.'],
 'The review separates psychiatric confinement from the failure to warn Tatiana or someone likely to warn her.');
q(1,'What did Tarasoff’s parents win at this stage, according to the review?',
 'The ability to pursue their claim against the therapists and Regents.',
 ['An automatic final finding that every defendant caused the death.','A Supreme Court ruling that Poddar was not responsible.','A rule requiring disclosure of every angry therapy comment.'],
 'The court recognized a legally viable claim. It did not automatically decide the therapists were liable for Tatiana’s death.');
q(1,'Which relationship supported the possible duty to protect Tatiana even though she was not the patient?',
 'The therapists’ professional relationship with Poddar.',
 ['Tatiana’s previous contract with the Regents.','A treatment relationship between Tatiana and Dr. Moore.','The parents’ employment relationship with campus police.'],
 'The special relationship was with the person making the threat; a duty could extend to the identifiable person in danger.');
q(2,'Which explanation of the result in Case v. Montana is most precise?',
 'The entry was upheld under emergency aid without adopting a broad community-caretaking power.',
 ['The Court adopted unrestricted community caretaking inside any home.','The entry was upheld only after finding probable cause of a crime.','The Court required a warrant despite the apparent emergency.'],
 'The review emphasizes agreement with the result while narrowing the rationale to the emergency-aid exception.');
q(2,'Which standard did the Case v. Montana review say controlled the emergency entry?',
 'An objectively reasonable basis to believe someone was seriously injured or facing serious injury.',
 ['Proof beyond a reasonable doubt that a crime had happened.','Probable cause that the resident had violated a criminal statute.','An officer’s unreviewable personal feeling that entry might be useful.'],
 'The question was the apparent need for urgent aid, not probable cause to investigate a crime or an officer’s unsupported hunch.');
q(2,'Which combination did Gavin’s Case v. Montana review identify as supporting the apparent emergency?',
 'The 911 report, silence inside, empty holster, and possible note.',
 ['A visible injured neighbor, signed consent, and an open warrant.','A traffic violation, expired license, and refusal to identify a driver.','A noise complaint and evidence already seized during an earlier search.'],
 'The review describes a cluster of observations supporting urgent aid. It does not describe a consent search or a traffic stop.');
q(2,'What limit remained after the entry was upheld in Case v. Montana?',
 'Officers could address the emergency, not use it to justify an unrelated general search.',
 ['All rooms and devices became searchable for any crime.','The emergency created permanent authority to reenter later.','The resident lost all Fourth Amendment protection once the call was made.'],
 'The review repeatedly ties the scope of the entry to the immediate emergency.');
q(3,'What was the practical effect of the dismissal in Hamm v. Smith?',
 'The lower-court protection for Smith remained, without a new Supreme Court rule on multiple IQ scores.',
 ['Alabama won a new nationwide numerical cutoff.','The Court resolved the IQ issue and ordered a new execution date.','Smith lost the benefit of every lower-court ruling.'],
 'Dismissing certiorari as improvidently granted left the lower result undisturbed while declining to decide the main question.');
q(3,'Which evidence did the Hamm review distinguish from treating IQ scores as exact cutoffs?',
 'Testing uncertainty and evidence of adaptive functioning.',
 ['The jury’s preferred execution method and the prison’s budget.','Only the single highest score, regardless of other evidence.','A rule that a low score automatically erases the conviction.'],
 'Smith’s position involved more than one test number: measurement limits and functioning also mattered to the dispute.');
q(3,'Which pairing matches the separate opinions described in Hamm?',
 'Sotomayor favored waiting for a better vehicle; Alito wanted the Court to clarify the law.',
 ['Sotomayor demanded a new IQ cutoff; Alito favored dismissal to avoid guidance.','Both insisted the Court had already resolved the constitutional issue.','Alito wrote that every death sentence involving IQ evidence was invalid.'],
 'The review contrasts case suitability with the perceived need to resolve recurring confusion.');
q(3,'Which earlier case supplied the constitutional premise behind Smith’s claim?',
 'Atkins v. Virginia, which barred executing people with intellectual disabilities.',
 ['Miranda v. Arizona, which resolved the numerical IQ cutoff.','Bush v. Gore, which required a new sentencing hearing.','Pennsylvania v. Mimms, which excluded IQ evidence.'],
 'The review identifies Atkins as the foundation, while Hamm concerned how a disability claim was evaluated.');
q(4,'Which two-step distinction is essential to the Mimms review?',
 'A lawful stop supported ordering the driver out; the visible bulge separately supported the frisk.',
 ['An expired plate alone automatically authorized every search.','The frisk had to happen before an officer could order the driver out.','Ordering him out was unconstitutional even though the frisk was upheld.'],
 'The exit order and the weapons pat-down had separate justifications. The review does not merge them into one automatic search power.');
q(4,'Why did the Mimms majority characterize the exit order as a small added intrusion?',
 'Mimms was already lawfully stopped; the order changed where he waited.',
 ['He had signed a written waiver of all search rights.','He had already been convicted of the traffic offense.','No government instruction was involved.'],
 'The majority balanced the incremental burden against officer safety, starting from an already lawful detention.');
q(4,'What specific observation mattered to the pat-down in Mimms?',
 'A large bulge under his jacket that suggested he might be armed.',
 ['An expired plate by itself, with no other observation.','His refusal to consent to a search of his home.','An anonymous report about an unrelated person.'],
 'The visible bulge provided a particular reason to suspect a weapon, separate from the traffic violation.');
q(4,'What was Stevens’s objection to the exit-order rule in Mimms, as the review describes it?',
 'It gave police an automatic additional power without a reason specific to that driver.',
 ['It prevented officers from conducting any lawful traffic stop.','It required probable cause before police could see a license plate.','It made a visible weapon irrelevant to every frisk.'],
 'The dissent focused on individualized justification for the extra command, not on eliminating traffic enforcement.');
q(5,'How does the Bush v. Gore review separate the justices’ two voting alignments?',
 'Seven saw constitutional problems; five chose the remedy that ended the recount.',
 ['Five saw no constitutional problem; seven voted to continue indefinitely.','All nine agreed that every manual recount was unconstitutional.','Only two justices objected to inconsistent counting standards.'],
 'Agreement that there was a problem did not produce the same agreement about what should happen next.');
q(5,'What was defective about the recount process described in Bush v. Gore?',
 'Similar disputed ballots could receive different treatment across counties or recount teams.',
 ['The mere existence of any hand-counted ballot.','A statewide rule requiring every disputed ballot to be rejected.','A constitutional prohibition on asking what voters intended.'],
 'The review focuses on inconsistent standards, including different judgments about chads, rather than a blanket rejection of manual counting.');
q(5,'What reason did the majority give for ending rather than repairing the recount?',
 'It believed new statewide standards could not be implemented in time for Florida’s December 12 deadline.',
 ['It had finished recounting every disputed ballot itself.','It found that every county had used exactly the same standard.','It held that the Constitution forbids states from correcting counting errors.'],
 'The remedy turned on timing as well as the equal-protection problem.');
q(5,'Which constitutional provision drove the counting-standard analysis in the Bush review?',
 'The Fourteenth Amendment’s Equal Protection Clause.',
 ['The Fifth Amendment’s custodial-warning rule.','The Eighth Amendment’s punishment clause.','The Fourth Amendment’s emergency-aid exception.'],
 'The issue was equal treatment of similar ballots in the state’s recount.');
q(6,'What did the detained class obtain in Rodriguez Vazquez v. Bostock?',
 'Access to request bond under the applicable framework, not guaranteed release.',
 ['Automatic release without an immigration judge’s review.','Citizenship for everyone arrested inside the country.','A ban on denying bond for danger or failure-to-appear risk.'],
 'The review stresses the difference between an opportunity for individualized review and winning release.');
q(6,'Which statutory distinction did the Rodriguez Vazquez review identify?',
 'Section 1225’s no-bond position versus the generally applicable Section 1226 bond framework.',
 ['Section 1226’s citizenship guarantee versus Section 1225’s jury-trial guarantee.','A choice between the First and Eighth Amendments only.','Two sections that both necessarily required immediate release.'],
 'The dispute concerned the detention framework for people arrested after living inside the country.');
q(6,'How did the Rodriguez Vazquez majority read “seeking admission” differently from the government?',
 'It focused on a person currently trying to enter, not everyone legally classified as an applicant forever.',
 ['It treated every long-term resident as physically waiting at the border.','It said “applicant for admission” could never describe anyone.','It made the phrase turn only on whether someone owned a home.'],
 'The review distinguishes a legal classification from what a person is actively doing when arrested.');
q(6,'Which qualification prevents overstating the Rodriguez Vazquez result?',
 'Separate mandatory-detention rules and individual danger or flight-risk findings could still matter.',
 ['The result eliminated all detention powers nationwide.','The ruling guaranteed bond without any hearing.','The majority required judges to ignore criminal records.'],
 'The review does not portray the decision as universal or unconditional release.');
q(7,'Why did Brady receive a new punishment proceeding rather than a full new trial on guilt?',
 'Boblit’s withheld confession could affect punishment without undoing Brady’s murder guilt under Maryland law.',
 ['The withheld statement had nothing to do with either guilt or punishment.','The Court found Brady had never taken part in the crime.','Brady had already been acquitted before his appeal.'],
 'The remedy tracked what the withheld evidence could change.');
q(7,'Which distinction did the Brady review say did NOT determine whether withholding helpful material evidence was unfair?',
 'Whether the prosecutor hid it intentionally or by mistake.',
 ['Whether it could matter to guilt or punishment.','Whether the evidence was favorable to the defendant.','Whether the defense was deprived of evidence that could help.'],
 'The focus was the deprivation of a fair opportunity, rather than requiring proof of a prosecutor’s bad motive.');
q(7,'What exactly was the evidence withheld in Brady’s case?',
 'Boblit’s statement that he had committed the actual killing.',
 ['A thermal image of Brady’s house.','A yearbook entry showing Brady’s name.','A warning that Brady had refused to sign.'],
 'The review identifies a co-participant’s statement as the missing evidence relevant to punishment.');
q(7,'Which description best preserves the scope of the Brady rule stated in the review?',
 'Favorable evidence material to guilt or punishment must not be suppressed.',
 ['Only evidence that conclusively proves innocence must be shared.','Evidence affecting punishment never has to be disclosed.','The rule applies only when a prosecutor admits deliberate misconduct.'],
 'The review includes material evidence affecting punishment, not only evidence that proves innocence outright.');
q(8,'Which detail most undermined the school’s disruption argument in Mahanoy?',
 'The evidence amounted to brief classroom discussion and upset cheerleaders, not substantial disruption.',
 ['B.L. had threatened a named student during a scheduled class.','The school had documented weeks of canceled lessons.','The post had been sent through an official assignment system.'],
 'The review describes about five to ten minutes of discussion over a couple of days.');
q(8,'Which conclusion would overstate the Mahanoy ruling described in the review?',
 'Schools can never address off-campus threats or serious targeted bullying.',
 ['B.L. prevailed on her particular suspension.','The weekend, off-campus setting limited the school’s authority.','Her vulgar complaint did not justify this punishment on these facts.'],
 'The review explicitly preserves room to address more serious off-campus conduct.');
q(8,'Which combination matches the setting of B.L.’s post?',
 'A weekend, away from school, using her own phone.',
 ['An exam, in a classroom, using a school-issued testing device.','An official team meeting, using the coach’s account.','A school trip, under a teacher’s immediate supervision.'],
 'These surrounding facts mattered to how much regulatory authority the school could claim.');
q(8,'Which opinion alignment appears in the Mahanoy review?',
 'Breyer wrote the majority; Thomas was the lone dissenter.',
 ['Thomas wrote the majority; Breyer was the lone dissenter.','Scalia wrote for a unanimous Court.','Sotomayor wrote a 5–4 opinion joined by no other justice.'],
 'The review reports an 8–1 result for B.L. with those authorship details.');
q(9,'What factual gap defeated Uber’s arbitration argument against Carroll Walker?',
 'Sending the terms did not prove he had ever seen the offer or agreed to it.',
 ['Uber could not prove that Cheryl had ever ordered a ride.','Carroll had accepted the terms but changed his mind after the crash.','Every arbitration agreement was declared unlawful.'],
 'The review distinguishes not reading known terms from not knowing terms were offered at all.');
q(9,'Why did Cheryl’s agreement not automatically force Carroll into arbitration in Walker?',
 'His crash-related negligence claims did not seek a benefit under her contract.',
 ['Spouses are legally incapable of entering any contract.','Carroll had personally signed an agreement forbidding all lawsuits.','The court decided no crash had occurred.'],
 'The review keeps his independent claims separate from an attempt to enforce or benefit from Cheryl’s contract.');
q(9,'What did the Walker appeal leave unresolved?',
 'Whether Uber was actually responsible for Carroll’s injuries.',
 ['Whether Uber had proved the particular agreement bound Carroll.','Whether simply sending this message was enough in this dispute.','Whether these claims could proceed in court rather than compelled arbitration.'],
 'Winning the forum dispute did not establish liability for the accident.');
q(9,'Which missing step in Uber’s guest system mattered to the Walker reasoning?',
 'No required opening, acceptance, or confirmation of the terms by the guest rider.',
 ['No instruction to the driver to complete a criminal-background interview.','No signature from every passenger’s employer.','No requirement that Cheryl repeat her order in writing at the courthouse.'],
 'The review notes that Uber designed the system and could have required an actual acknowledgment.');
q(10,'Which query best matches the limited search discussed in Robinson?',
 'A white BMW with black rims near one gas station during a short period.',
 ['Every place Robinson slept, worked, and worshipped for several years.','Continuous live GPS tracking of every vehicle in Virginia.','A thermal scan revealing details inside Robinson’s home.'],
 'The decision described a narrow database query of exterior car features visible on public roads.');
q(10,'What distinction prevents treating Robinson as blanket approval of all future camera networks?',
 'The court considered a limited present system and left a much more extensive network open to different analysis.',
 ['The court ruled that public-road observations can never raise any privacy issue.','It approved indefinite records of everyone’s travel without qualification.','It held that all camera systems are identical to one officer seeing a car once.'],
 'Scope and aggregation were important limits in both the review’s legal analysis and Gavin’s opinion.');
q(10,'How long did the Robinson review say Norfolk’s camera data was retained?',
 '30 days.',
 ['24 hours.','Five years.','Permanently with no deletion.'],
 'The review pairs a 30-day retention period with still images from particular locations, not uninterrupted travel monitoring.');
q(10,'Which details did the Robinson court treat as exposed on public roads?',
 'The plate, the car’s exterior, and its black rims.',
 ['Private conversations recorded inside the house.','Every message on the driver’s phone.','The contents of a sealed backpack in the trunk.'],
 'The narrow query used visible exterior features rather than the private contents in the distractors.');
q(11,'Why did Connelly’s mental illness alone not satisfy the majority’s due-process test?',
 'The pressure had not been caused by coercive police conduct.',
 ['The Court found he had no mental illness.','A confession is admissible only if it is shouted in a public place.','Police had obtained a signed judicial order requiring him to confess.'],
 'The review contrasts internal pressure with government coercion; it does not deny that his illness affected him.');
q(11,'Which proof standard did the Connelly majority accept for a valid Miranda waiver?',
 'Preponderance of the evidence.',
 ['Beyond every possible doubt.','A unanimous psychiatric panel with no legal review.','Automatic validity whenever any words were spoken.'],
 'The review explains the standard as more likely than not, rejecting Colorado’s higher requirement.');
q(11,'What additional concern did Brennan raise in the Connelly review beyond whether police behaved badly?',
 'The reliability of a hallucinating person’s confession and the lack of independent physical corroboration in the described record.',
 ['Whether all confession evidence should automatically produce an acquittal.','Whether Connelly had requested a contract with the police.','Whether Miranda warnings were legally abolished.'],
 'The dissent’s concern included both meaningful choice and the risk of an unreliable confession.');
q(11,'Which factual detail matters to the majority’s account of how Connelly’s confession began?',
 'He approached officers himself and was repeatedly told he could remain silent.',
 ['Police abducted him from a therapy session without speaking.','He confessed only after a court ordered him to do so.','Officers admitted creating the hallucinations.'],
 'The review describes warnings and a self-initiated approach while still recognizing severe mental impairment.');
q(12,'What did the thermal camera in Kyllo actually measure, as the review explains?',
 'Heat escaping from the home, rather than pictures of people or objects through the walls.',
 ['A clear video of everyone moving through the rooms.','The contents of private phone calls.','A physical sample taken from inside the attic.'],
 'That limitation supported the government and dissent’s argument, but did not resolve the majority’s concern about interior privacy.');
q(12,'Which combination matches the Kyllo majority’s rule in the review?',
 'Technology not in general public use obtaining interior information otherwise requiring entry.',
 ['Any device outside a house is exempt because it never crosses a wall.','Only technology that shows a person’s face can count as a search.','Information inside a home is protected only if a judge finds it interesting.'],
 'The review emphasizes the device’s availability and the otherwise inaccessible interior information.');
q(12,'What happened after Kyllo won the search issue?',
 'The case was sent back to evaluate the warrant without the thermal-scan evidence.',
 ['The Court itself conducted a new thermal scan.','Kyllo automatically won damages against every officer.','The Court held that the remaining warrant evidence never needed review.'],
 'The remand left a further question about the warrant’s support once the scan was removed.');
q(12,'What was Stevens’s key contrast in Kyllo?',
 'Measuring heat already escaping outside versus observing activities inside.',
 ['A yearbook class action versus an arbitration clause.','A school’s weekend authority versus a traffic-stop frisk.','A signed confession versus an unsigned handwritten note.'],
 'The dissent considered the camera less invasive than technology that could reveal the interior directly.');
q(13,'What did Nolen win in the appeal covered by Future Counsel?',
 'The ability to continue the class action, not a final ruling that PeopleConnect violated California law.',
 ['A final judgment that every yearbook scan is illegal.','A ruling that every class member had already won damages.','A declaration that Classmates.com could never be sued.'],
 'The procedural question about proceeding as a group was distinct from ultimate liability.');
q(13,'Which theory allowed the Nolen class dispute to be addressed on a common basis?',
 'Making people searchable was alleged to be the relevant use, even if each name had not actually been searched.',
 ['Every member had individually negotiated the same private contract.','Only people with proof of an actual search could possibly remain in any class.','Each person’s claim concerned an unrelated website with a different business model.'],
 'The court allowed the shared searchability theory to proceed without deciding whether it would ultimately succeed.');
q(13,'How did the Nolen review describe handling possible individual class-membership problems?',
 'They could be addressed as the case developed instead of necessarily defeating the group at this stage.',
 ['The court had to award damages to everyone before examining membership.','Any possible individual issue automatically required dismissing every claim.','Individual issues were declared legally impossible in all class actions.'],
 'The appeal did not settle every later issue of membership, proof, or liability.');
q(13,'Which distinction makes the Nolen result particularly easy to overstate?',
 'Allowing a legal theory to be litigated is different from holding that the theory is correct.',
 ['Class certification and a final damages judgment are always the same event.','The court ruled that no common evidence existed.','The opinion concerned only whether printed yearbooks could be sold in stores.'],
 'The review separates a class-certification decision from a merits decision.');
q(14,'Which split accurately reflects the Talbot review?',
 'All three judges protected the racism statements; two also protected the assault statements.',
 ['All three found the assault accusation false as a matter of proven fact.','All three agreed every allegation had to go to trial.','Only one judge thought any challenged statement was protected.'],
 'The disagreement over assault did not erase agreement on the racism statements.');
q(14,'What separate request did Ainuu and The North Face fail to win in Talbot?',
 'Relief under Washington’s anti-SLAPP law, despite keeping the underlying claims dismissed.',
 ['Permission to keep the defamation lawsuit dismissed.','A ruling that every factual allegation had been proved true.','A new criminal conviction against Talbot.'],
 'A different two-judge majority viewed the posts as primarily a personal dispute for the anti-SLAPP question.');
q(14,'Which context especially concerned Judge Nelson in Talbot?',
 'A later direct assault accusation on an Outdoor Research post could read as a factual criminal allegation.',
 ['A private contract that required arbitration of all yearbook claims.','A police officer ordering a driver out of a vehicle.','A thermal image that revealed no outdoor activity.'],
 'Nelson would have let that part proceed; he was not deciding Talbot had already proved falsity.');
q(14,'Why did disclosed descriptions of the encounter matter to the Talbot majority?',
 'Readers could assess Ainuu’s interpretation from the underlying conduct he described.',
 ['They made every statement in every post automatically true.','They proved Talbot had admitted a crime in court.','They established that no reader could ever interpret an assault accusation factually.'],
 'The majority read the challenged language in context rather than assuming undisclosed supporting facts.');
q(15,'When must a child’s age enter the custody analysis under the J.D.B. review?',
 'When officers know it or it would be apparent to a reasonable officer.',
 ['Only after the child has been convicted.','Only if a parent submits a birth certificate during questioning.','Never, because custody must always be judged as if everyone were an adult.'],
 'The review describes an objective consideration of age, not speculation about every private thought.');
q(15,'What did J.D.B. NOT obtain directly from the Supreme Court?',
 'A final decision that he was in custody and his confession must be thrown out.',
 ['A ruling that known or apparent age belongs in the analysis.','A remand for the state courts to reconsider custody.','A 5–4 decision rejecting the omission of his age.'],
 'Winning the legal issue meant another custody analysis, not automatic suppression or a finding of innocence.');
q(15,'Why did the assistant principal’s presence matter differently for J.D.B. than for an adult visitor?',
 'As a student, he was accustomed to the official’s disciplinary authority.',
 ['The assistant principal had already served as his criminal defense lawyer.','The assistant principal could personally issue search warrants.','Every adult visitor was legally required to obey the school’s student discipline rules.'],
 'The majority connected the setting to the perspective of a child subject to school authority.');
q(15,'Why did the J.D.B. majority reject relying only on later voluntariness review?',
 'That later safeguard does not replace warnings required before a custodial interrogation.',
 ['Age is never relevant to voluntariness.','A later review automatically guarantees that no confession can be used.','The majority abolished all separate custody analysis.'],
 'The review distinguishes assessing custody and giving advance warnings from later evaluating whether a confession was voluntary.');
// These questions concern Gavin's published analysis, not private biographical details.
q(0,'In Gavin’s Miranda opinion, why does explaining the right matter beyond the right merely existing?',
 'A person needs to know the protection exists to have a real opportunity to use it.',
 ['The warning guarantees every confession is factually accurate.','Knowing rights prevents police from investigating any crime.','Constitutional language itself proves every suspect understands it.'],
 'Gavin supports making the protection usable in the interrogation room, while acknowledging the need to investigate serious crimes.',"GAVIN’S TAKE");
q(1,'Which tension does Gavin expressly acknowledge even while siding with the Tarasoff majority?',
 'A disclosure duty may discourage honest therapy or deter treatment.',
 ['There is no meaningful value in therapy confidentiality.','Every unusual remark must automatically be reported.','The parents had already proved every defendant liable at trial.'],
 'His opinion accepts the dissent’s trust concern but favors reasonable protective steps for serious threats to identifiable people.',"GAVIN’S TAKE");
q(2,'What makes Gavin’s support for the Case v. Montana result cautious rather than unlimited?',
 'The facts suggested a genuine emergency, but mental-health interventions can escalate danger and the exception must stay narrow.',
 ['He thinks any vague welfare concern creates a permanent search license.','He believes the Court found probable cause of a crime was always required.','He rejects every emergency entry unless a warrant has already issued.'],
 'His opinion points to the concrete warning signs while taking Sotomayor’s escalation concern seriously.',"GAVIN’S TAKE");
q(3,'Why does Gavin disagree with the dismissal in Hamm even though Smith retained his lower-court win?',
 'The Court left a recurring, life-or-death uncertainty unresolved after full argument.',
 ['He thought dismissal created a binding nationwide IQ cutoff.','He wanted all adaptive-functioning evidence removed automatically.','He believed the dismissal itself reversed Smith’s lower-court relief.'],
 'His criticism concerns the missed opportunity for guidance, not a mistaken claim that Smith lost the existing protection.',"GAVIN’S TAKE");
q(4,'Which description fits Gavin’s Mimms opinion?',
 'Cautious agreement with the majority while warning against unnecessarily aggressive traffic stops.',
 ['Unqualified approval of searching every driver and vehicle.','Complete agreement that ordering any lawfully stopped driver out is forbidden.','A claim that an expired plate alone made every frisk reasonable.'],
 'He sees the safety rationale, but also recognizes that even an extra command can feel serious to a driver.',"GAVIN’S TAKE");
q(5,'Where does Gavin draw the line between agreeing and disagreeing with Bush v. Gore?',
 'He supports a consistent statewide standard but would prefer repairing and continuing the recount.',
 ['He rejects consistent standards but fully supports ending the count.','He thinks all manual counting is inherently unconstitutional.','He says the Court proved what a completed recount would have shown.'],
 'His opinion separates the valid concern about unequal standards from the decision to halt the process.',"GAVIN’S TAKE");
q(6,'What distinction is central to Gavin’s support for the Rodriguez Vazquez majority?',
 'Giving a judge the chance to consider bond does not automatically release the person.',
 ['A bond hearing must always result in release.','Danger and failure-to-appear risk must never be considered.','The ruling grants citizenship to the detained class.'],
 'His opinion favors individual review while preserving the ability to continue detention when justified.',"GAVIN’S TAKE");
q(7,'Why does Gavin say accidental suppression can still be unfair in Brady?',
 'The defendant still loses access to helpful evidence regardless of the prosecutor’s intention.',
 ['A prosecutor’s innocent mistake proves the defendant is guilty.','Only a written admission of bad motive can make a trial unfair.','Evidence affecting punishment never affects fairness.'],
 'He focuses on the effect on the defense rather than making fairness depend only on the prosecutor’s motive.',"GAVIN’S TAKE");
q(8,'Which line does Gavin draw in his Mahanoy opinion?',
 'An immature off-campus complaint differs from threats or serious targeted online bullying.',
 ['A school can never address any online behavior.','Disrespect alone automatically grants a school control over all speech.','Every upset teammate proves substantial disruption.'],
 'He supports B.L.’s result without giving all off-campus conduct blanket protection.',"GAVIN’S TAKE");
q(9,'Which comparison does Gavin use to explain his agreement in Walker?',
 'Clicking accept without reading differs from never knowing an agreement was being offered.',
 ['A spouse’s contract automatically binds every other family member.','Taking a ride necessarily proves the rider read every text message.','Losing arbitration proves Uber caused the passenger’s injuries.'],
 'His review keeps notice and assent separate from the underlying negligence case.',"GAVIN’S TAKE");
q(10,'What future development worries Gavin even though he understands Robinson’s loss?',
 'A larger database could reconstruct a person’s movements far beyond a narrow sighting.',
 ['Any single observation of a publicly visible car is automatically a home search.','The existing case proved every future tracking network constitutional.','Privacy depends only on whether a car has unusual rims.'],
 'He distinguishes one limited query from the power to rebuild a person’s travel history.',"GAVIN’S TAKE");
q(11,'Which distinction drives Gavin’s disagreement with the Connelly majority?',
 'Understanding the words of a warning can differ from being mentally capable of acting on them.',
 ['The officers deliberately created Connelly’s illness.','The Court found Connelly had never received a warning.','Every confession following any illness is automatically false.'],
 'He does not accuse these officers of coercion; he questions meaningful choice and reliability despite their lack of misconduct.',"GAVIN’S TAKE");
q(12,'Which part of Kyllo’s formulation does Gavin specifically question while supporting the result?',
 'Why technology becoming common should automatically make the home less private.',
 ['Why police did not receive unrestricted permission to scan every home.','Why only interesting interior details should count as private.','Why the Court treated every machine as capable of seeing through walls.'],
 'He questions the general-public-use boundary and favors a principle that survives technological progress.',"GAVIN’S TAKE");
q(13,'What is Gavin’s position on Nolen’s underlying claim after supporting class certification?',
 'The searchable subscription system deserves review, but he is not sure it ultimately makes the conduct illegal.',
 ['Class certification already proves PeopleConnect owes everyone damages.','A public yearbook can never raise any issue when aggregated online.','The court had decided that every actual search was unlawful.'],
 'He recognizes that large-scale searchable aggregation differs from a book on a shelf without claiming the merits are settled.',"GAVIN’S TAKE");
q(14,'What aspect of Nelson’s concern resonates with Gavin in Talbot?',
 'A standalone assault accusation on a company’s post may read as a factual allegation without the earlier context.',
 ['Losing a job automatically proves every defamation element.','All descriptions of an argument should automatically be treated as crimes.','Every challenged post had already been proved false by a jury.'],
 'Gavin focuses on wording, placement, and what a reader is likely to understand, while avoiding a claim that Talbot already proved his case.',"GAVIN’S TAKE");
q(15,'Which combination best captures Gavin’s J.D.B. position?',
 'Consider a child’s age and the school authority setting without treating youth as immunity from consequences.',
 ['Age should erase every possible consequence for a suspected burglary.','School questioning should always be judged exactly like an adult’s voluntary interview.','The Court had already proved J.D.B. innocent and excluded every statement.'],
 'His opinion defends a fair custody inquiry while recognizing the interests of people whose homes were broken into.',"GAVIN’S TAKE");

const closeReadingDistractors={
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
  "Tatiana’s own treatment relationship with the university’s psychiatric clinic.",
  "The Regents’ contractual promise to warn every student about dangerous patients.",
  "The parents’ special relationship with the university as prior medical patients."
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
  "The Fourteenth Amendment’s Due Process Clause, based on a right to unlimited recount time.",
  "The Elections Clause, based on a rule that only Congress can count state ballots.",
  "The First Amendment, based on whether a disputed chad counted as political speech."
 ],
 "fc-7-1": [
  "Section 1226’s no-bond position versus Section 1225’s generally available bond hearings.",
  "Two parts of Section 1225 that differed only about who could set the bond amount.",
  "Section 1226 for people physically arriving, with Section 1225 restricted to long-term residents."
 ],
 "fc-8-2": [
  "Boblit’s statement that Brady personally committed the actual killing.",
  "A statement that neither defendant had been present when the killing occurred.",
  "A witness’s statement retracting an identification of Brady as a participant."
 ],
 "fc-9-1": [
  "B.L.’s particular vulgar complaint was protected on the facts described in the review.",
  "Schools may still have grounds to address serious threats or targeted off-campus bullying.",
  "Brief classroom discussion and upset cheerleaders did not establish substantial disruption here."
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
  "Cheryl’s contract lacked any arbitration language that could apply to passenger injuries.",
  "Carroll could claim rights under Cheryl’s agreement while rejecting only its arbitration provision.",
  "The agreement automatically covered Carroll, but arbitration was invalid for negligence claims."
 ],
 "fc-10-3": [
  "Guests had to open the message but were not required to read each paragraph aloud.",
  "Guests had accepted the terms, but Uber failed to obtain a second signature after the trip.",
  "The guest confirmed the offer, but the driver had not separately signed the guest’s copy."
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
  "The vehicle’s exterior, together with a thermal measurement of the driver’s home."
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
  "The majority’s home-protection rule versus a rule requiring a physical trespass in every case.",
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
  "The appeal resolved whether every plaintiff’s name had actually been searched.",
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
  "Only if a court has already decided the child’s eventual confession was involuntary."
 ],
 "fc-16-2": [
  "The principal’s authority mattered equally because adults and pupils face the same school discipline.",
  "The principal’s presence alone conclusively proved police custody regardless of age or context.",
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
  "He objects because dismissing certiorari automatically removed Smith’s existing protection."
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
  "He thinks a spouse’s acceptance is enough even if the guest never learns that terms were offered.",
  "He agrees with the result mainly because arbitration clauses are always invalid after an accident."
 ],
 "fc-11-4": [
  "He thinks any one public sighting already reveals the same thing as an aggregated travel history.",
  "He supports a broad rule because all future camera networks can use the same narrow-query justification.",
  "He favors banning every license-plate camera because even the limited query was a home search."
 ],
 "fc-12-4": [
  "He thinks the absence of officer misconduct proves that a mentally ill person made a meaningful choice.",
  "He believes recognizing the warning’s words necessarily establishes the capacity to act on them.",
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
  "He believes later voluntariness review is enough and a child’s age need not affect custody."
 ]
};
for(const item of questions)if(closeReadingDistractors[item.id])item.distractors=closeReadingDistractors[item.id];

const finalDistractors={
 "fc-3-3": [
  "Officers could continue searching for evidence once the original welfare concern had been resolved.",
  "The scope depended only on the officer’s stated intentions, regardless of what the emergency required.",
  "A reasonable initial entry removed the need to justify later investigative searches inside the home."
 ],
 "fc-4-0": [
  "The Court affirmed a new IQ-scoring rule and made the lower judgment binding nationwide.",
  "The dismissal vacated Smith’s relief and required the lower courts to start over without Atkins.",
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
  "It focused on how long someone had lived inside the country without examining the statute’s distinct phrases.",
  "It treated seeking admission as meaning any request for release from detention after an interior arrest."
 ],
 "fc-7-3": [
  "The bond framework prevented judges from considering any past conduct once a person had lived inside the country.",
  "The ruling required release whenever a detained person asked for bond, without an individualized assessment.",
  "Separate mandatory-detention provisions could not apply to anyone included in the court’s interpretation."
 ],
 "fc-8-0": [
  "The withheld confession undermined guilt, but the Court left the punishment proceeding entirely untouched.",
  "The Court required the prosecution to dismiss the case because any suppression automatically establishes innocence.",
  "The Court found no constitutional violation but granted a new punishment hearing solely as a discretionary remedy."
 ],
 "fc-10-0": [
  "He received and knowingly accepted the offered terms, but Uber could not prove he had read each paragraph.",
  "The court treated every passenger injury claim as legally incapable of being subject to arbitration.",
  "The terms were rejected because Cheryl’s account could never be used to arrange a guest ride at all."
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
  "He would make the result depend only on the coach’s annoyance rather than the setting or actual disruption."
 ]
};
for(const item of questions)if(finalDistractors[item.id])item.distractors=finalDistractors[item.id];
export const CASE_QUESTIONS=Object.freeze(questions.map(q=>Object.freeze({...q,distractors:Object.freeze(q.distractors)})));
