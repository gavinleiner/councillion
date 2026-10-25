// A candidate file or a large answer count cannot satisfy the 5,000-question
// request. This reads the real normal-play pool used by Daily and Puffer.
import {readFileSync,writeFileSync} from 'node:fs';
import {MIXED_PACKS,PARTY_PACKS} from '../data.js';
const root=new URL('../',import.meta.url);
const admission=JSON.parse(readFileSync(new URL('data-snapshots/reviewed-standard/admission.json',root)));
const candidates=JSON.parse(readFileSync(new URL('authored-bank-manifest.json',root)));
const expected=new Set(admission.questions.map(p=>p.id));
const families=Object.fromEntries(Object.entries(Object.groupBy(MIXED_PACKS,p=>p.family)).map(([k,v])=>[k,v.length]));
const subjects=['gaming','sports','culture','music','food','nature','science','world','everyday'];
const reasons=[];
if(MIXED_PACKS.length<5000)reasons.push(`${5000-MIXED_PACKS.length} more admitted, distinct normal-play questions required.`);
if(expected.size!==MIXED_PACKS.length||MIXED_PACKS.some(p=>!expected.has(p.id)))reasons.push('Admission does not match the actual playable pool.');
if(new Set(MIXED_PACKS.map(p=>p.questionKey)).size!==MIXED_PACKS.length)reasons.push('Equivalent questions are being counted more than once.');
if(PARTY_PACKS.length!==MIXED_PACKS.length||PARTY_PACKS.some((p,i)=>p!==MIXED_PACKS[i]))reasons.push('Puffer and Daily have different admitted pools.');
for(const f of subjects){const share=(families[f]??0)/Math.max(1,MIXED_PACKS.length);if(share<.08||share>.15)reasons.push(`${f} has ${(share*100).toFixed(1)}% of questions; the completed inventory must keep each subject between 8% and 15%.`);}
const forbidden=MIXED_PACKS.filter(p=>['steam-tags','steam-any-tags','title-word','title-words'].includes(p.predicate?.kind)||/^group-(?:open-|(?:song|show|movie)-word-)/.test(p.id));
if(forbidden.length)reasons.push(`Forbidden tag/title padding admitted: ${forbidden.map(p=>p.id).join(', ')}.`);
const steam=MIXED_PACKS.filter(p=>p.predicate?.kind==='steam-tag');
if(steam.length>24)reasons.push('Single Steam labels exceed the deliberately limited set.');
for(const q of admission.questions){if(!q.prompt||!q.family||!q.basis||q.yes.length<3)reasons.push('Missing independent editorial evidence for '+q.id);}
const report={target:5000,normalPlayQuestions:MIXED_PACKS.length,remaining:Math.max(0,5000-MIXED_PACKS.length),families,
 candidateInventories:candidates.count,admittedCandidates:candidates.categories.filter(p=>expected.has(p.id)).length,
 candidateCanonicalAnswerRows:candidates.categories.reduce((n,p)=>n+p.answerCount,0),
 ready:!reasons.length,reasons,
 note:'This is an admission/volume gate. Passing it is not factual validation: the full source, alias, familiar-answer, selection, browser and publication checks are also required.'};
if(process.argv.includes('--write'))writeFileSync(new URL('data-snapshots/authored/release-readiness.json',root),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--enforce')&&!report.ready)process.exitCode=1;
