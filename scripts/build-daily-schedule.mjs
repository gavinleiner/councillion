// Append-only calendar: existing dates never move when the pool grows.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {MIXED_PACKS,ORIGINAL_PLAY_PACKS,canonicalQuestionId} from '../data.js';
import {unseenDeck,random,hash} from '../question-selection.js';
import {QUESTION_QUALITY_BUILD} from '../question-quality.js';
const root=new URL('../',import.meta.url),path=new URL('daily-schedule.json',root);
let schedule;try{schedule=JSON.parse(readFileSync(path));}catch{schedule={start:'2026-10-23',ids:[]};}
const reviewFrom=process.argv.find(a=>a.startsWith('--review-from='))?.slice(14);
if(reviewFrom){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(reviewFrom)||reviewFrom<schedule.start)throw Error('Review date precedes the shared calendar.');
 const keep=Math.round((Date.parse(reviewFrom+'T12:00:00Z')-Date.parse(schedule.start+'T12:00:00Z'))/86400000)*7;
 if(keep>schedule.ids.length)throw Error('Review date lies outside the calendar.');
 const previousBuild=schedule.build,prefix=schedule.ids.slice(0,keep),excluded=[...prefix,...ORIGINAL_PLAY_PACKS.map(p=>p.id)];
 const first=reviewFrom==='2026-10-23'?['fun-terraria','fun-sea-life','fun-tv','occupation-titles','fun-elements','catalog-snacks','fun-water-world']:[];
 if(first.some(id=>!MIXED_PACKS.some(p=>p.id===id)))throw Error('The reviewed first day contains a retired prompt.');
 const deck=unseenDeck(MIXED_PACKS,{seen:[...excluded,...first],rng:random(hash('councillion-quality-calendar:'+QUESTION_QUALITY_BUILD))});
 // Freeze one shuffled unseen pool. Every client reads these same seven IDs.
 schedule.ids=[...prefix,...first,...deck];
 const revisions=(schedule.revisions??[]).filter(r=>r.from!==reviewFrom||r.quality!==QUESTION_QUALITY_BUILD);
 schedule.revisions=[...revisions,{from:reviewFrom,previousBuild:revisions.length===schedule.revisions?.length?previousBuild:schedule.revisions.find(r=>r.from===reviewFrom&&r.quality===QUESTION_QUALITY_BUILD)?.previousBuild,quality:QUESTION_QUALITY_BUILD,reason:'Apply the 98 approved prompts and source-backed group expansion consistently for every player.'}];
}
const assigned=schedule.ids.map(canonicalQuestionId);if(new Set(assigned).size!==assigned.length)throw Error('Equivalent requests exist in the calendar; review without moving published dates.');
const excluded=[...assigned,...ORIGINAL_PLAY_PACKS.map(p=>canonicalQuestionId(p.id))];
const extra=unseenDeck(MIXED_PACKS,{seen:excluded,rng:random(hash('councillion-fresh-daily-v1'))});
schedule.ids.push(...extra);schedule.build=createHash('sha256').update(JSON.stringify(schedule.ids)).digest('hex').slice(0,16);
writeFileSync(path,JSON.stringify(schedule,null,2)+'\n');
writeFileSync(new URL('daily-schedule.js',root),'// Generated append-only schedule. No modulo/cycling; see DATA-SOURCES.md.\nexport const FRESH_DAILY_START='+JSON.stringify(schedule.start)+';\nexport const FRESH_DAILY_IDS='+JSON.stringify(schedule.ids)+';\nexport const DAILY_SCHEDULE_BUILD='+JSON.stringify(schedule.build)+';\n');
console.log(JSON.stringify({prompts:schedule.ids.length,completeDays:Math.floor(schedule.ids.length/7),start:schedule.start,lastCompleteDate:new Date(Date.parse(schedule.start+'T12:00:00Z')+(Math.floor(schedule.ids.length/7)-1)*86400000).toISOString().slice(0,10),build:schedule.build}));
