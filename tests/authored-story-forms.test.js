import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PACK_BY_ID} from '../data.js';
import {resolveAnswer,normalize} from '../answer-matching.js';
const dir=new URL('../data-snapshots/authored/',import.meta.url);
const specs=JSON.parse(readFileSync(new URL('story-forms-specifications.json',dir))).questions;
const ledger=JSON.parse(readFileSync(new URL('story-forms-review-ledger.json',dir)));
const pack=id=>{const p=PACK_BY_ID.get('authored-'+id);assert.ok(p,id);return p;};
const exact=(id,input)=>{const r=resolveAnswer(pack(id),input);assert.equal(r.status,'exact',id+': '+input);return r.answer;};
const same=(id,a,b)=>assert.equal(exact(id,a).label,exact(id,b).label,`${a}/${b}`);
const different=(id,a,b)=>assert.notEqual(exact(id,a).label,exact(id,b).label,`${a}/${b}`);

test('two whole independently proposed cultural subjects preserve all94 original familiar inputs',()=>{
 assert.equal(specs.length,2);assert.equal(specs.reduce((n,q)=>n+q.familiar.length,0),94);
 for(const q of specs){
  assert.equal(q.family,'culture');
  assert.ok(ledger[q.key].canonicalAnswers>(q.key==='fairy-tales'?1800:400));
  for(const input of q.familiar)exact(q.key,input);
  for(const input of q.exclude)assert.equal(resolveAnswer(pack(q.key),input).status,'missing',input);
 }
 assert.equal(exact('fairy-tales','Cinderella').points,10);
 assert.equal(exact('fairy-tales','The Golden Bird').points,100);
 assert.equal(exact('literary-genres-forms','Fantasy').points,10);
 assert.equal(exact('literary-genres-forms','Robinsonade').points,100);
});

test('documented alternate tale titles share identity while distinct tales and shared source articles stay separate',()=>{
 for(const[a,b]of [['Cinderella','Ashputtel'],['Snow White','Snowdrop'],['Sleeping Beauty','Briar Rose'],['Little Red Riding Hood','Little Red-Cap'],['The Bremen Town Musicians','The Travelling Musicians'],['The Frog Prince','The Frog King'],['The Steadfast Tin Soldier','The Brave Tin Soldier'],['Thumbelina','Little Tiny or Thumbelina'],['The Singing, Springing Lark','Lily and the Lion'],['Donkey Cabbages','The Salad'],['Foundling-Bird','Fundevogel'],['The Adventures of Pinocchio','Pinocchio'],['Timun Mas','The Golden Cucumber'],['The Shepherdess and the Chimney Sweep','The Shepherdess and the Sweep']])same('fairy-tales',a,b);
 for(const[a,b]of [['Snow White','The Snowdrop'],['Snow White','Snow White and Rose Red'],['Goldilocks','The Story of Pretty Goldilocks'],['The Gingerbread Man','The Gingerbread Horse'],['The Happy Prince','The Nightingale and the Rose'],['The Three Little Pigs','The Three Billy Goats Gruff'],['The Stolen Veil','The Swan Suit'],['The Frog Prince','The Well of the World’s End']])different('fairy-tales',a,b);
});

test('qualified written genres and actual forms are accepted without source adjectives or UF over-merging',()=>{
 for(const input of ['Hard fantasy','Hard science fiction','Medical romance','Medical journalism','Science fiction comedy','Science fantasy','Fanfic','Microfiction','Graphic short story','Graphic novella','Novelette','Web novel','Web serial','Webcomic','Interactive novel','Manhua','Manhwa','Webtoon','Rom-com','Romantasy','Dark romance','Progression fantasy','Haiku','Sapphic ode','Horatian ode'])exact('literary-genres-forms',input);
 for(const[a,b]of [['Hard fantasy','Hard science fiction'],['Medical romance','Medical journalism'],['Science fiction','Science fiction comedy'],['Novelette','Novella'],['Graphic short story','Graphic novel'],['Graphic novella','Graphic novel'],['LitRPG','Progression fantasy'],['Web fiction','Web novel'],['Web novel','Web serial'],['Sapphic ode','Horatian ode']])different('literary-genres-forms',a,b);
 for(const[a,b]of [['Sci-fi','Science fiction'],['Fanfic','Fanfiction'],['Microfiction','Flash fiction'],['Rom-com','Romantic comedy'],['Western Romance literature','Western romance']])same('literary-genres-forms',a,b);
 for(const input of ['J K Rowling','Book cover','Medical','Hard','Science','Space','World','Cosmology','Lotus Sutra','Cape punk','Heroic noir','Iambic pentameter','FC','SF'])assert.notEqual(resolveAnswer(pack('literary-genres-forms'),input).status,'exact',input);
});

test('poem source correction gives the Sapphic form its own identity instead of a blanket Horatian alias',()=>{
 different('poem-forms','Sapphic ode','Horatian ode');
 same('poem-forms','Sapphic','Sapphic ode');
 const poemSpec=JSON.parse(readFileSync(new URL('object-concept-specifications.json',dir))).questions.find(q=>q.key==='poem-forms');
 assert.ok(poemSpec.aliasHolds['Horatian ode'].includes('Sapphic ode'));
});

test('source/hold ledgers protect source roles, malformed titles and identity ownership',()=>{
 const tales=ledger['fairy-tales'];
 assert.ok(tales.held.some(x=>x.label==='Bedside Tales of Sultan'));
 assert.ok(tales.held.some(x=>x.label==='A Chapter That you Can Skip'));
 assert.ok(tales.held.some(x=>x.label==='The Shepherdess and the Sheep'));
 const forms=ledger['literary-genres-forms'];
 assert.ok(forms.held.some(x=>x.row?.display==='Lotus Sutra'));
 assert.ok(forms.held.some(x=>x.row?.display==='Cape punk'));
 for(const q of specs){
  const owners=new Map();
  for(const a of pack(q.key).answers)for(const value of [a.label,...a.aliases]){
   const key=normalize(value);assert.ok(key);assert.ok(!owners.has(key)||owners.get(key)===a.label,value);owners.set(key,a.label);
  }
 }
 const receipts=JSON.parse(readFileSync(new URL('story-forms-source-receipts.json',dir)));
 assert.ok(receipts.some(x=>x.status==='unavailable-no-retry'));
 assert.ok(receipts.some(x=>x.status==='returned-library-card-login-shell-not-primary-content'));
 assert.ok(receipts.some(x=>x.source==='indexed-official-genre-hierarchy'));
});
