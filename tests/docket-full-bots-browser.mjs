import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true}),errors=[],seen=new Set(),out=new URL('../../../work/docket-20261105/',import.meta.url);
try{
 const p=await browser.newPage({viewport:{width:1366,height:650}});p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await p.goto('http://localhost:4177/__docket-bots?seats=6',{waitUntil:'domcontentloaded'});await p.locator('.dk-match').waitFor();await p.locator('#play-demo').click();
 // Test the real local director and renderer with accelerated virtual time.
 // The user-facing controls remain 1x, 2x and 8x.
 await p.evaluate(()=>window.docketDemo.setSpeed(16));const until=Date.now()+240000;let snap;
 while(Date.now()<until){snap=await p.evaluate(()=>({stage:window.docketDemo.state.stage,history:window.docketDemo.state.history.length,result:window.docketDemo.state.result,rows:window.docketDemo.state.finalRows,progress:document.querySelector('#demo-progress').textContent}));
  if(!seen.has(snap.stage)){seen.add(snap.stage);console.log(snap.stage,snap.history);if(['docketDouble','docketFinalWager','docketFinalReveal','finish'].includes(snap.stage))await p.screenshot({path:new URL('full-demo-'+snap.stage+'.png',out).pathname});}
  if(snap.stage==='finish'||errors.length)break;await p.waitForTimeout(150);
 }
 const rendered=await p.evaluate(()=>window.docketDemo.phases);await writeFile(new URL('full-bot-ui-final.json',out),JSON.stringify({seen:[...seen],rendered,snapshot:snap,errors},null,2));assert.deepEqual(errors,[]);assert.equal(snap.stage,'finish');assert.equal(snap.history,60);assert.ok(snap.rows.length>0);assert.equal(snap.result.winners.length,1);for(const phase of ['docketBriefing','docketBoardIntro','docketDouble','docketAnswer','docketVerdict','docketBreak','docketFinalWager','docketFinalRead','docketFinalAnswer','docketFinalReveal','finish'])assert.ok(rendered.includes(phase),phase+' was rendered');console.log('PASS: real six-bot director completes two 30-clue boards, wagers, final seals, ordered reveals and finale.');
}finally{await browser.close();}
