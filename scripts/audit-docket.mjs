import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {DOCKET_CATEGORIES,DOCKET_FINALS,DOCKET_TIES,DOCKET_BY_ID} from '../docket-data.js';
import {docketResponse} from '../docket-engine.js';
const sha=v=>createHash('sha256').update(v).digest('hex');
const questions=[...DOCKET_BY_ID.values()],families=Object.fromEntries([...new Set(DOCKET_CATEGORIES.map(c=>c.family))].map(f=>[f,DOCKET_CATEGORIES.filter(c=>c.family===f).reduce((n,c)=>n+c.clues.length,0)]));
assert.equal(DOCKET_CATEGORIES.length,100);assert.equal(questions.length,524);assert.equal(new Set(questions.map(q=>q.prompt.toLowerCase())).size,524);
assert.equal(DOCKET_CATEGORIES.flatMap(c=>c.clues).length,500);assert.equal(DOCKET_FINALS.length,16);assert.equal(DOCKET_TIES.length,8);
for(const c of DOCKET_CATEGORIES)assert.equal(c.clues.length,5);
for(const n of Object.values(families))assert.ok(n>=60&&n<=65);
for(const q of questions){assert.ok(q.prompt.length<260);assert.match(q.source,/^https:\/\//);assert.equal(docketResponse(q,q.answer).answer?.label,q.answer);for(const alias of q.aliases)assert.equal(docketResponse(q,alias).answer?.label,q.answer);}
const result={version:'20261105-docket-polish-v15',boardClues:500,categories:100,finalClues:16,tiebreakClues:8,totalClues:524,families,questions:questions.map(q=>({...q,sha256:sha(JSON.stringify(q))}))};
const file=new URL('../data-snapshots/court-games/docket-v15.json',import.meta.url),text=JSON.stringify(result,null,2)+'\n';
if(process.argv.includes('--write'))await writeFile(file,text);else assert.equal(await readFile(file,'utf8'),text,'Docket snapshot is stale. Review changes, then run --write.');
console.log(JSON.stringify({board:500,categories:100,finals:16,tiebreakers:8,total:524,families}));
