// Audit every shipped canonical row and alias; source-coverage assertions are
// separate from structural validity. Archived data is never called approved.
import{readFileSync,writeFileSync}from'node:fs';
import{gunzipSync}from'node:zlib';
import{createHash}from'node:crypto';
import{PACKS,PLAY_PACKS,REVIEWED_PACKS,MIXED_PACKS,PARTY_PACKS}from'../data.js';
import{questionReview,QUESTION_QUALITY_BUILD}from'../question-quality.js';
import{normalize}from'../answer-matching.js';
import{loadCatalogAnswers}from'../question-bank-loader.js';
import{registerFunDataReader}from'../fun-bank-loader.js';
import{CASE_QUESTIONS,CASE_SOURCES}from'../case-questions.js';
const root=new URL('../',import.meta.url),read=name=>readFileSync(new URL(name,root));
await loadCatalogAnswers();registerFunDataReader(p=>JSON.parse(gunzipSync(read((p.answerDirectory??'question-banks')+'/'+p.answerFile))));
const errors=[],rows=[];let total=0,aliases=0;
for(const p of PACKS){const keys=new Map(),canonical=new Set();const a=p.answers;let common=0;
 for(const answer of a){total++;aliases+=answer.aliases?.length??0;if(answer.points<=30)common++;
  const key=normalize(answer.label);if(!key||canonical.has(key))errors.push([p.id,'canonical',answer.label]);canonical.add(key);
  if(![10,15,30,60,85,100].includes(answer.points))errors.push([p.id,'score',answer.label]);
  for(const name of[answer.label,...answer.aliases??[]]){const k=normalize(name);if(!k)errors.push([p.id,'empty alias',answer.label]);if(keys.has(k)&&keys.get(k)!==answer.label)errors.push([p.id,'ambiguous alias',name]);keys.set(k,answer.label);}
 }
 if(p.answerCount!==undefined&&p.answerCount!==a.length)errors.push([p.id,'count']);
 rows.push({id:p.id,prompt:p.prompt,family:p.family,answers:a.length,aliases:a.reduce((n,r)=>n+(r.aliases?.length??0),0),familiarAnswers:common,...questionReview(p)});
}
for(const name of['fun-bank-manifest.json','variety-bank-manifest.json','discovery-manifest.json','group-bank-manifest.json']){const m=JSON.parse(read(name));for(const p of m.categories??m){const path=(p.answerDirectory??(name.startsWith('variety')?'variety-banks':'question-banks'))+'/'+p.answerFile,b=gunzipSync(read(path));if(createHash('sha256').update(b).digest('hex')!==p.sha256)errors.push([p.id,'hash']);}}
function coverage(id,expected){const p=PACKS.find(p=>p.id===id),keys=new Set(p.answers.flatMap(a=>[a.label,...a.aliases??[]]).map(normalize)),sourceKey=name=>normalize(name)||'literal:'+name;for(const[name,target]of Object.entries(p.literalAliases??{}))if(keys.has(normalize(target)))keys.add('literal:'+name);const names=new Set(expected.map(sourceKey)),missing=[...names].filter(k=>!keys.has(k));if(missing.length)errors.push([id,'source coverage',missing]);return {id,sourceNames:names.size,missing};}
const minecraft=JSON.parse(read('data-snapshots/rework/minecraft-official.json'));
const terraria=JSON.parse(gunzipSync(read('data-snapshots/quality/terraria-items.json.gz'))).filter(r=>/^-?\d+$/.test(String(r.id))&&Number(r.id)!==0);
const fortnite=JSON.parse(read('data-snapshots/rework/fortnite.json')).filter(r=>['outfit','emote','glider','pickaxe'].includes(r.type));
const sourceCoverage=[coverage('fun-minecraft',minecraft.map(r=>r.displayName)),coverage('fun-terraria',terraria.map(r=>r.name)),coverage('fun-fortnite',fortnite.map(r=>r.name))];
const elements=PACKS.find(p=>p.id==='fun-elements');if(elements.answers.length!==118)errors.push(['fun-elements','118 elements']);
const cases=new Set();for(const q of CASE_QUESTIONS){if(cases.has(q.id)||!CASE_SOURCES.some(s=>s.url===q.source)||q.distractors.length!==3||new Set([q.answer,...q.distractors].map(normalize)).size!==4)errors.push([q.id,'case choices']);cases.add(q.id);}
const report={build:QUESTION_QUALITY_BUILD,reviewed:'2026-10-23',counts:{shipped:PACKS.length,archive:PLAY_PACKS.length,reviewed:REVIEWED_PACKS.length,ordinary:MIXED_PACKS.length,puffer:PARTY_PACKS.length,canonicalEntries:total,aliases,caseQuestions:cases.size},integrity:{errors},sourceCoverage,limits:'Integrity checks cover every shipped row. Source checks establish coverage of the retained named inventories, not every possible real-world answer. Archived categories have not passed editorial admission and are unavailable in ordinary play.',categories:rows};
writeFileSync(new URL('question-audit-report.json',root),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,categories:undefined},null,2));if(errors.length)process.exitCode=1;
