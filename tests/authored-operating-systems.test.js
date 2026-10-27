import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PACK_BY_ID} from '../data.js';
import {resolveAnswer,normalize} from '../answer-matching.js';
import {newParty,startParty,answerParty} from '../engine.js';
const dir=new URL('../data-snapshots/authored/',import.meta.url);
const specs=JSON.parse(readFileSync(new URL('operating-systems-specifications.json',dir))).questions;
const ledger=JSON.parse(readFileSync(new URL('operating-systems-review-ledger.json',dir)))['operating-systems'];
const p=PACK_BY_ID.get('authored-operating-systems');
const exact=input=>{const r=resolveAnswer(p,input);assert.equal(r.status,'exact',input);return r.answer;};
const same=(a,b)=>assert.equal(exact(a).label,exact(b).label,`${a}/${b}`);
const different=(a,b)=>assert.notEqual(exact(a).label,exact(b).label,`${a}/${b}`);

test('one whole operating-system question keeps all66 original independently supplied common names',()=>{
 assert.equal(specs.length,1);assert.equal(specs[0].familiar.length,66);assert.ok(ledger.canonicalAnswers>=950);
 assert.equal(p.preserveNumericTokens,true);
 for(const input of specs[0].familiar)exact(input);
 for(const input of specs[0].exclude)assert.equal(resolveAnswer(p,input).status,'missing',input);
 assert.equal(exact('Windows').points,10);assert.equal(exact('Windows 10').points,10);assert.equal(exact('MenuetOS').points,100);
});

test('meaningful public punctuation and letter case keep different systems separate',()=>{
 for(const[a,b]of [['RISC OS','RISC/os'],['iOS','IOS'],['Mint','MiNT'],['EOS','/e/OS'],['Mac OS','macOS'],['Windows 1.0','Windows 10'],['Android 1.0','Android 10'],['Android 1.1','Android 11'],['Android 1.5','Android 15'],['Android 1.6','Android 16']])different(a,b);
 same('RiSc/Os','MIPS RISC/os');
 same('WINDOWS 1.0','Windows version 1.0');same('android1.6','Android Donut');same('ANDROID 1.5','Android Cupcake');
 for(const input of ['Windows 9.5','Windows 9-5','Android 99','Windows 9','OS','WM','MC','FB'])assert.equal(resolveAnswer(p,input).status,'missing',input);
});

test('actual renames/short public names share identity without collapsing forks, predecessors or marketing siblings',()=>{
 for(const[a,b]of [['Plan 9','Plan 9 from Bell Labs'],['OS X','macOS'],['iPhone OS','iOS'],['AROS','AROS Research Operating System'],['VMS','OpenVMS'],['CBL-Mariner','Azure Linux'],['PC-BSD','TrueOS'],['PC DOS','IBM DOS'],['RHEL','Red Hat Enterprise Linux'],['GNU/Linux','Linux'],['FreeMiNT','MiNT'],['Windows 11 Pro','Windows 11'],['Windows 10 Enterprise LTSC','Windows 10']])same(a,b);
 for(const[a,b]of [['Raspbian','Raspberry Pi OS'],['Fedora','Red Hat Enterprise Linux'],['ChromiumOS','ChromeOS'],['ChromeOS','Googlebook OS'],['Android','Googlebook OS'],['FreeRTOS','OpenRTOS'],['FreeRTOS','SafeRTOS'],['Datapoint CTOS','CTOS'],['Data General AOS','IBM AOS'],['Data General DOS','MS-DOS'],['QNX','INTEGRITY']])different(a,b);
});

test('real historical/research and embedded systems count while hardware and environment-only labels are held',()=>{
 for(const input of ['osakaOS','SerpaeOS','Sculpt OS','Mach','T2 Linux','Cisco IOS XE','FreeRTOS','OpenRTOS','SafeRTOS','TempleOS','Haiku','IBM i','Apple SOS','Windows 95','macOS Golden Gate','Mac OS X Snow Leopard','Android Nougat','Android 12L'])exact(input);
 for(const input of ['Azumanga daioh','Apple II','XTS-400','DeskMate','KERNAL','OpenEmbedded','Yocto Project','GEM','MS-Net','LAN Manager','Cosmos','Cambridge CAP computer','Google Chrome browser'])assert.notEqual(resolveAnswer(p,input).status,'exact',input);
 assert.ok(ledger.held.some(x=>x.sourceIndex===754));assert.ok(ledger.held.some(x=>x.sourceIndex===596));assert.ok(ledger.held.some(x=>x.sourceIndex===59));
});

test('frozen role, source and literal-name decisions remain inspectable and do not generate initials',()=>{
 const owners=new Map();for(const a of p.answers)for(const name of [a.label,...a.aliases]){const n=normalize(name);assert.ok(n);assert.ok(!owners.has(n)||owners.get(n)===a.label,name);owners.set(n,a.label);}
 assert.equal(ledger.literalPublicNames.IOS,'Cisco IOS');assert.equal(ledger.literalPublicNames['Windows 1.0'],'Windows version 1.0');
 assert.ok(ledger.normalizedVariantReviews.osiv.includes('OS/IV'));
 const receipts=JSON.parse(readFileSync(new URL('operating-systems-source-receipts.json',dir)));
 assert.ok(receipts.some(x=>x.status==='unavailable-no-retry'));assert.ok(receipts.some(x=>x.key==='apple-version-table'&&x.status==='captured'));
 assert.ok(receipts.some(x=>x.key==='osaka'&&x.status===200));
});

test('Puffer awards distinct real numeric/case identities and rejects fabricated versions without consuming a turn',()=>{
 for(const[a,b]of [['Windows 1.0','Windows 10'],['Android 1.6','Android 16'],['iOS','IOS'],['Mint','MiNT'],['RISC OS','RISC/os']]){
  const state=newParty([{id:'a',name:'A'},{id:'b',name:'B'}],()=>0);state.packIds=['authored-operating-systems'];
  assert.equal(startParty(state,1000,()=>0),true);
  const wrong=answerParty(state,'a','Windows 9.5',1100);assert.ok(wrong.error);assert.equal(state.turn,0);assert.equal(state.used.length,0);
  const first=answerParty(state,'a',a,1200),second=answerParty(state,'b',b,1300);
  assert.ok(first.answer,a);assert.ok(second.answer,b);assert.notEqual(first.answer.label,second.answer.label);
  assert.equal(new Set(state.used).size,2);assert.equal(state.players[0].score,first.answer.points);assert.equal(state.players[1].score,second.answer.points);
  const repeat=answerParty(state,'a',a,1400);assert.match(repeat.error,/Already/);assert.equal(state.used.length,2);
 }
});
