import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GROUP_PACKS} from '../group-question-catalog.js';
import {GROUP_ARCHIVED_PACKS} from '../group-question-archive.js';
import {PARTY_PACKS,MIXED_PACKS,PACK_BY_ID} from '../data.js';
import {ordinaryQuestionAllowed} from '../ordinary-question-policy.js';
import {resolveAnswer} from '../answer-matching.js';
import {loadQuestionData} from '../question-data.js';
const policy=JSON.parse(readFileSync(new URL('../data-snapshots/group/playability-policy.json',import.meta.url)));

test('held song prompts never re-enter ordinary selection and remain readable for saved results',async()=>{
 const retired=Object.keys(policy.retired);assert.equal(retired.length,118);
 for(const id of retired){assert.ok(!MIXED_PACKS.some(p=>p.id===id),id);assert.ok(!PARTY_PACKS.some(p=>p.id===id),id);const p=PACK_BY_ID.get(id);assert.ok(p?.ordinaryRetired,id);assert.ok(GROUP_ARCHIVED_PACKS.includes(p));await loadQuestionData([p]);assert.equal(p.answers.length,p.answerCount);}
 for(const p of GROUP_PACKS){const pred=p.predicate;if(pred?.media==='song'&&['title-word','title-vocabulary'].includes(pred.kind)){assert.ok(p.familiarCount>=16,p.id);if(pred.kind==='title-vocabulary')assert.ok(!policy.heldSongTitleKinds.includes(pred.wordnet.split('.')[0].replaceAll('_',' ')),p.id);}}
});

test('118 broader replacements retain large complete banks and no invented user approvals',()=>{
 const additions=GROUP_PACKS.filter(p=>p.id.startsWith('group-open-'));assert.equal(additions.length,118);
 for(const p of additions){assert.ok(p.answerCount>=30,p.id);assert.ok(p.familiarCount>=16,p.id);assert.equal(p.reviewId,undefined);assert.equal(PARTY_PACKS.includes(p),ordinaryQuestionAllowed(p));}
 for(const kind of ['steam-any-tags','film-any-genres','tv-any-genres','song-title-any-words','bank-union'])assert.ok(additions.some(p=>p.predicate.kind===kind),kind);
 assert.equal(GROUP_PACKS.filter(p=>p.reviewId).length,98);
});

test('either-tag questions accept a game satisfying only one tag; unrelated games stay out',async()=>{
 const p=GROUP_PACKS.find(p=>p.predicate.kind==='steam-any-tags'&&p.predicate.tags.includes('Puzzle'));assert.ok(p);await loadQuestionData([p]);
 assert.equal(resolveAnswer(p,'Portal').status,'exact');assert.equal(resolveAnswer(p,'Counter-Strike 2').status,'missing');
});

test('broad music themes accept multiple easy words while keeping title membership literal',async()=>{
 const p=GROUP_PACKS.find(p=>p.predicate.kind==='song-title-any-words'&&p.predicate.words.includes('moon'));assert.ok(p);await loadQuestionData([p]);
 for(const title of ['Talking to the Moon','Counting Stars','Fly Me To The Moon'])assert.equal(resolveAnswer(p,title).status,'exact',title);
 assert.equal(resolveAnswer(p,'Shake It Off').status,'missing');assert.ok(p.scope.includes('Lyrics do not count'));
});
