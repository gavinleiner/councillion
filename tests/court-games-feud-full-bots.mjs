import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const out=new URL('../../../work/feud-pace-20261106/',import.meta.url);
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try{
 const p=await browser.newPage({viewport:{width:1366,height:650}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://localhost:4175/__feud-bots?seats=10&autoplay=1',{waitUntil:'domcontentloaded',timeout:90000});
 await p.waitForFunction(()=>window.__feudDemo?.snapshot().started,null,{timeout:90000});
 await p.evaluate(()=>{window.__feudDemo.setSpeed(8);window.__feudDemo.setSound(false);});
 await p.waitForFunction(()=>window.__feudDemo.snapshot().finished||window.__feudDemo.snapshot().errors.length,null,{timeout:120000});
 const s=await p.evaluate(()=>window.__feudDemo.snapshot());
 assert.deepEqual(errors,[]);assert.deepEqual(s.errors,[]);assert.equal(s.finished,true);assert.ok(s.fast.complete);assert.equal(s.fast.rows.length,5);assert.equal(s.fast.rows[0].answers.length,2,'both runners completed');assert.equal(s.events.filter(e=>e.from==='fastRead'&&e.stage==='fast').length,2);
 await p.screenshot({path:new URL('full-bot-finale.png',out).pathname});
 await writeFile(new URL('full-bots-verification.json',out),JSON.stringify({pass:true,errors,snapshot:s},null,2));
 console.log(JSON.stringify({pass:true,mainBoards:s.history.length,bonusRunners:2,virtualSeconds:Math.round(s.elapsed/1000),errors}));
}finally{await browser.close();}
