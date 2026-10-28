import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PACK_BY_ID} from '../data.js';
import {resolveAnswer} from '../answer-matching.js';
import {newParty,startParty,answerParty} from '../engine.js';
const dir=new URL('../data-snapshots/authored/',import.meta.url);
const specs=JSON.parse(readFileSync(new URL('world-calendar-specifications.json',dir))).questions;
const ledger=JSON.parse(readFileSync(new URL('world-calendar-review-ledger.json',dir)));
const awards=PACK_BY_ID.get('authored-named-awards-prizes');
const holidays=PACK_BY_ID.get('authored-holidays-observances');
const exact=(p,input)=>{const r=resolveAnswer(p,input);assert.equal(r.status,'exact',input);return r.answer;};
const same=(p,a,b)=>assert.equal(exact(p,a).label,exact(p,b).label,`${a}/${b}`);
const different=(p,a,b)=>assert.notEqual(exact(p,a).label,exact(p,b).label,`${a}/${b}`);

test('two independently proposed broad public-life questions preserve all81 original common inputs',()=>{
 assert.equal(specs.length,2);assert.deepEqual(specs.map(q=>q.familiar.length),[35,46]);
 assert.ok(awards.answers.length>=1750);assert.ok(holidays.answers.length>=350);
 for(const q of specs){const p=PACK_BY_ID.get('authored-'+q.key);for(const name of q.familiar)exact(p,name);for(const name of q.exclude)assert.notEqual(resolveAnswer(p,name).status,'exact',name);}
 assert.equal(exact(awards,'Oscar').points,10);assert.equal(exact(awards,'Dickin Medal').points,100);
 assert.equal(exact(holidays,'Christmas').points,10);assert.equal(exact(holidays,'Parwanaya').points,100);
});

test('documented award names share identity without collapsing different Carnegies, Kafkas or kinds of prizes',()=>{
 for(const[a,b]of [['Oscar','Academy Award'],['Grammy','Grammy Awards'],['Carnegie Medal','Carnegie Medal for Writing'],['Kate Greenaway Medal','Carnegie Medal for Illustration'],['Tiptree award','Otherwise Award'],['John W. Campbell Award for Best New Writer in Science Fiction','Astounding Award'],['DICE Awards','D.I.C.E. Award'],['Juno Award','Juno Awards'],['Strega Prize','Premio Strega'],['Screen Actors Guild Award','Actor Awards']])same(awards,a,b);
 for(const[a,b]of [['Carnegie Medal','Carnegie Medal for Heroism'],['Carnegie Medal for Writing','Carnegie Medal for Illustration'],['Franz Kafka Prize','Austrian Franz Kafka Prize'],["People's Choice Award",'Australian People’s Choice Award'],['Nautilus Award','Nautilus Book Award'],['Gold Glove Award','Golden Gloves'],['Booker Prize','International Booker Prize'],['Nobel Prize in Physics','Nobel Prize in Chemistry'],['John W. Campbell Memorial Award for Best Science Fiction Novel','Astounding Award'],['Academy Award for Best Actor','Academy Award for Best Supporting Actor']])different(awards,a,b);
 for(const name of ['FIFA Clubs of the 20th Century','Cannes Film Festival','Academy of Motion Picture Arts and Sciences','Pro Football Hall of Fame','First place','AB','XY'])assert.notEqual(resolveAnswer(awards,name).status,'exact',name);
});

test('calendar public translations work while shared dates and religious ancestry do not merge different observances',()=>{
 for(const[a,b]of [['Hanukkah','Chanukah'],['Diwali','Deepavali'],['Passover','Pesach'],['Día de Reyes','Epiphany'],['Eid al Fitr','Hari Raya Puasa'],['Eid al Adha','Hari Raya Haji'],['Nowruz','International Day of Nowruz'],['Qingming Festival','Ching Ming Festival'],['Dragon Boat Festival','Tuen Ng Festival'],['Vaisakhi','Baisakhi'],['Jummah',"Jumu'ah"],['Labor Day','Labour Day']])same(holidays,a,b);
 for(const[a,b]of [['Halloween','Samhain'],['Diwali','Bandi Chhor Divas'],['Yule','Christmas'],['Passover','Feast of Unleavened Bread'],['Remembrance Day','Veterans Day'],['Boxing Day',"Saint Stephen's Day"],['Día de los Muertos','All Souls’ Day'],['Nowruz','Baháʼí Naw-Rúz'],['May Day','Beltane']])different(holidays,a,b);
 for(const name of ['Jesus','Lakshmi','Saturday','Kislev','Spring','Coachella','Cannes Film Festival','XY'])assert.notEqual(resolveAnswer(holidays,name).status,'exact',name);
});

test('source role holds and access limitations remain inspectable rather than admitting every linked name',()=>{
 assert.ok(ledger['named-awards-prizes'].held.length>=400);assert.ok(ledger['holidays-observances'].held.length>=20);
 assert.ok(ledger['named-awards-prizes'].held.some(r=>r.sourceLine===196));
 assert.ok(ledger['named-awards-prizes'].held.some(r=>r.sourceLine===683));
 assert.ok(ledger['holidays-observances'].held.some(r=>r.sourceLine===375));
 const receipts=JSON.parse(readFileSync(new URL('world-calendar-source-receipts.json',dir)));
 assert.ok(receipts.some(r=>r.status==='unavailable-no-retry'));assert.ok(receipts.some(r=>r.key==='unesco-complete'&&r.sha256));
 assert.ok(receipts.some(r=>r.access==='public-indexed-source-text-not-raw-html'));
});

test('Puffer scores real different identities and rejects a repeated alias without consuming its turn',()=>{
 for(const[id,a,b,alias]of [['named-awards-prizes','Carnegie Medal','Carnegie Medal for Heroism','Carnegie Medal for Writing'],['holidays-observances','Diwali','Bandi Chhor Divas','Deepavali']]){
  const s=newParty([{id:'a',name:'A'},{id:'b',name:'B'}],()=>0);s.packIds=['authored-'+id];assert.ok(startParty(s,1000,()=>0));
  const x=answerParty(s,'a',a,1100),y=answerParty(s,'b',b,1200);assert.ok(x.answer,a);assert.ok(y.answer,b);assert.notEqual(x.answer.label,y.answer.label);
  assert.equal(s.players[0].score,x.answer.points);assert.equal(s.players[1].score,y.answer.points);assert.equal(s.used.length,2);
  const repeat=answerParty(s,'a',alias,1300);assert.match(repeat.error,/Already/);assert.equal(s.used.length,2);assert.equal(s.turn,0);
 }
});
