import test from 'node:test';
import assert from 'node:assert/strict';
import{readFileSync}from'node:fs';
import{gunzipSync}from'node:zlib';
import{createHash}from'node:crypto';
import{PACK_BY_ID,PACKS,MIXED_PACKS,PARTY_PACKS,PARTY_IDS,canonicalQuestionId}from'../data.js';
import{DISCOVERY_PACKS}from'../discovery-question-catalog.js';
import{normalize,resolveAnswer}from'../answer-matching.js';
import{partyDeck,random,dailyPacks}from'../engine.js';
import{FRESH_DAILY_IDS}from'../daily-schedule.js';
import{PartySession}from'../party.js';
const read=f=>readFileSync(new URL('../'+f,import.meta.url));
test('thousands of admitted prompts include substantial sports and retain finite answer inventories',()=>{
 assert.ok(MIXED_PACKS.length>=3000);assert.ok(PARTY_PACKS.length>=3000);assert.ok(PARTY_PACKS.filter(p=>p.family==='sports').length>=200);
 const sets=new Set(),prompts=new Set();const manifest=JSON.parse(read('discovery-manifest.json'));
 assert.equal(DISCOVERY_PACKS.length,manifest.length);
 for(const m of manifest){const p=PACK_BY_ID.get(m.id);assert.ok(PARTY_IDS.has(m.id));assert.ok(p.answerCount>=30&&p.familiarCount>=8);assert.equal(p.answerCount,m.answerCount);assert.ok(!sets.has(m.identityHash));sets.add(m.identityHash);assert.ok(!prompts.has(p.prompt));prompts.add(p.prompt);
  const bytes=gunzipSync(read(p.answerDirectory+'/'+p.answerFile));assert.equal(createHash('sha256').update(bytes).digest('hex'),m.sha256);const rows=JSON.parse(bytes);assert.equal(rows.length,p.answerCount);assert.equal(new Set(rows.map(r=>normalize(r[0]))).size,rows.length);
 }
 assert.ok(DISCOVERY_PACKS.some(p=>p.answerCount>=10000));assert.ok(DISCOVERY_PACKS.every(p=>!/^Name a (?:action|adventure|animated|MLB|NBA|NFL)/.test(p.prompt)));
});
test('sports, console games and entertainment accept recognizable exact answers, rather than accidental fuzzy matches',()=>{
 const checks={
 'nfl-players':['Tom Brady','Patrick Mahomes','Jayden Daniels','Warren Moon'],
 'nfl-team-ne':['Tom Brady','Rob Gronkowski','Julian Edelman','Drake Maye'],
 'nfl-team-ten':['Warren Moon','Earl Campbell','Derrick Henry'],
 'mlb-players':['Babe Ruth','Shohei Ohtani','Aaron Judge','Paul Skenes'],
 'nba-players':['Michael Jordan','LeBron James','Victor Wembanyama','Cooper Flagg'],
 'wnba-players':['Caitlin Clark','Angel Reese','A’ja Wilson','Paige Bueckers'],
 'worldcup-men':['Pelé','Lionel Messi','Cristiano Ronaldo','Neymar'],
 'olympic-gold':['Michael Phelps','Katie Ledecky','Simone Biles','Usain Bolt','Leon Marchand'],
 'console-130':['The Legend of Zelda: Breath of the Wild','Super Mario Odyssey','Animal Crossing: New Horizons'],
 'film-genre-animation':['Toy Story','Shrek','Spirited Away','Inside Out 2'],
 'film-genre-science-fiction':['Dune: Part Two','Deadpool & Wolverine'],
 'film-genre-family':['A Minecraft Movie'],
 'film-genre-horror':['Sinners'],
 'tv-comedy':['The Office','Friends','The Simpsons'],
 'nhl-teams':['Carolina Hurricanes','Maple Leafs','Golden Knights'],
 'nba-teams':['Lakers','Celtics'],
 'mlb-teams':['Red Sox','White Sox','Blue Jays','Los Angeles Angels']};
 for(const[id,queries]of Object.entries(checks)){const p=PACK_BY_ID.get('discovery-'+id);assert.ok(p,id);const names=new Set(p.answers.flatMap(a=>[a.label,...a.aliases]).map(normalize));for(const q of queries)assert.ok(names.has(normalize(q)),id+': '+q);}
 const steam=DISCOVERY_PACKS.find(p=>p.id.startsWith('discovery-steam-')&&p.id.includes('open-world')&&p.id.includes('rpg'));assert.ok(steam);assert.match(steam.prompt,/Steam/);for(const q of ['Elden Ring','The Witcher 3: Wild Hunt'])assert.equal(resolveAnswer(steam,q).status,'exact');
 const qb=PACK_BY_ID.get('discovery-nfl-quarterback');assert.equal(resolveAnswer(qb,'Tom Brady').status,'exact');assert.equal(resolveAnswer(qb,'Michael Jordan').status,'missing');
});
test('large pools preserve published daily dates and account-independent selections; party histories exclude every seen ID',()=>{
 const baseline=JSON.parse(read('data-snapshots/discovery/published-daily-prefix.json'));
 assert.deepEqual(FRESH_DAILY_IDS.slice(0,baseline.length),baseline);assert.equal(new Set(FRESH_DAILY_IDS).size,FRESH_DAILY_IDS.length);assert.ok(FRESH_DAILY_IDS.length>3000);
 assert.deepEqual(dailyPacks('2026-10-23').map(p=>p.id),['fun-terraria','fun-sea-life','fun-tv','occupation-titles','fun-elements','catalog-snacks','fun-water-world']);
 const sports=new Set(PARTY_PACKS.filter(p=>p.family==='sports').map(p=>p.id));
 for(let seed=1;seed<=4;seed++){const deck=partyDeck(random(seed));assert.equal(deck.length,PARTY_PACKS.length);assert.equal(new Set(deck).size,deck.length);assert.ok(deck.slice(0,14).some(id=>sports.has(id)));const seen=deck.slice(0,500);const next=partyDeck(random(seed),seen);assert.equal(next.length,deck.length-500);assert.ok(next.every(id=>!seen.includes(id)));}
 for(const p of PACKS)assert.equal(PACK_BY_ID.get(p.id),p);assert.equal(new Set(PARTY_PACKS.map(p=>canonicalQuestionId(p.id))).size,PARTY_PACKS.length);
});

test('ordinary answers do not retransmit the thousands-entry room deck',async()=>{
 const writes=[],session=new PartySession(()=>{},()=>{});clearInterval(session.timer);
 try{session.host=true;session.code='TEST';session.c={db:{},ref:(_,p)=>p,update:async(path,patch)=>writes.push(patch)};session.state={revision:1,phase:'playing',settings:{maxPlayers:6},packIds:PARTY_PACKS.map(p=>p.id),notice:'Starting'};session.publish=async()=>{};session.snapshot=()=>{};await session.broadcast();assert.ok(writes[0]['state/packIds'].length>3000);session.state.notice='Accepted answer';await session.broadcast();assert.equal('state/packIds' in writes[1],false);assert.ok(JSON.stringify(writes[1]).length<500);}finally{clearInterval(session.timer);}
});
