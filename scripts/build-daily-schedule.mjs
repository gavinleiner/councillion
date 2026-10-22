// Append-only calendar: existing dates never move when the pool grows.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {MIXED_PACKS,ORIGINAL_PLAY_PACKS,canonicalQuestionId} from '../data.js';
import {varietyDeck,random,hash} from '../question-selection.js';
const root=new URL('../',import.meta.url),path=new URL('daily-schedule.json',root);
let schedule;try{schedule=JSON.parse(readFileSync(path));}catch{schedule={start:'2026-10-23',ids:[]};}
const assigned=schedule.ids.map(canonicalQuestionId);if(new Set(assigned).size!==assigned.length)throw Error('Equivalent requests exist in the calendar; review without moving published dates.');
const excluded=[...assigned,...ORIGINAL_PLAY_PACKS.map(p=>canonicalQuestionId(p.id))];
const extra=varietyDeck(MIXED_PACKS,{seen:excluded,rng:random(hash('councillion-fresh-daily-v1'))});
schedule.ids.push(...extra);schedule.build=createHash('sha256').update(JSON.stringify(schedule.ids)).digest('hex').slice(0,16);
writeFileSync(path,JSON.stringify(schedule,null,2)+'\n');
writeFileSync(new URL('daily-schedule.js',root),'// Generated append-only schedule. No modulo/cycling; see DATA-SOURCES.md.\nexport const FRESH_DAILY_START='+JSON.stringify(schedule.start)+';\nexport const FRESH_DAILY_IDS='+JSON.stringify(schedule.ids)+';\nexport const DAILY_SCHEDULE_BUILD='+JSON.stringify(schedule.build)+';\n');
console.log(JSON.stringify({prompts:schedule.ids.length,completeDays:Math.floor(schedule.ids.length/7),start:schedule.start,lastCompleteDate:new Date(Date.parse(schedule.start+'T12:00:00Z')+(Math.floor(schedule.ids.length/7)-1)*86400000).toISOString().slice(0,10),build:schedule.build}));
