// Run during every production build. These are content checks, not a prompt
// count threshold or a generator's self-issued "editorial" flag.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {MIXED_PACKS,PARTY_PACKS,PACK_BY_ID} from '../data.js';
import {registerFunDataReader} from '../fun-bank-loader.js';
import {loadCatalogAnswers} from '../question-bank-loader.js';
import {REVIEWED_QUESTION_IDS} from '../reviewed-question-standard.js';
import {resolveAnswer} from '../answer-matching.js';
await loadCatalogAnswers();
registerFunDataReader(p=>{const raw=readFileSync(new URL('../'+(p.answerDirectory??'question-banks')+'/'+p.answerFile,import.meta.url));return JSON.parse((p.answerFile.endsWith('.gz')?gunzipSync(raw):raw).toString());});
const m=JSON.parse(readFileSync(new URL('../data-snapshots/reviewed-standard/admission.json',import.meta.url)));
assert.deepEqual(new Set(MIXED_PACKS.map(p=>p.id)),new Set(m.questions.map(p=>p.id)),'Live games have drifted from the explicit review');
assert.deepEqual(new Set(PARTY_PACKS.map(p=>p.id)),REVIEWED_QUESTION_IDS);
let positive=0,negative=0;
for(const q of m.questions){
 const p=PACK_BY_ID.get(q.id);assert.ok(p,q.id);assert.equal(p.prompt,q.prompt,q.id);assert.equal(p.family,q.family,q.id);assert.ok(q.yes.length>=3,q.id);
 assert.equal(p.answers.length,p.answerCount,q.id);
 for(const input of q.yes){assert.equal(resolveAnswer(p,input).status,'exact',q.id+': missing familiar answer '+input);positive++;}
 for(const input of q.no){assert.equal(resolveAnswer(p,input).status,'missing',q.id+': known wrong answer was accepted or suggested: '+input);negative++;}
}
console.log(`${m.questions.length} individually admitted questions; ${positive} familiar answers and ${negative} wrong-answer boundaries checked.`);
