// Public entry replaces the former owner-only entry; private utility tests remain in oath-preview.test.js.
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const work='/Users/gavin/Documents/Codex/2026-10-21/can-2/work/public-oath-logo-v37';
await mkdir(work,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH??'/Users/gavin/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell'}),errors=[];
try{
 const p=await browser.newPage({viewport:{width:1366,height:650},reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://localhost:4173/#games');await p.getByRole('button',{name:'NEXT COVE →'}).click();
 assert.equal(await p.locator('.pg-coming-ribbon').count(),0);assert.ok(await p.getByRole('link',{name:'Play Under Oath',exact:true}).isEnabled());
 const logo=p.locator('.game-mascot-bench');assert.equal(await logo.count(),1);const style=await logo.evaluate(el=>({image:getComputedStyle(el).backgroundImage,motion:getComputedStyle(el).animationName,w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height}));assert.match(style.image,/bench-judge-v36.webp/);assert.equal(style.motion,'none');assert.ok(style.w>0&&style.h>0);
 await p.screenshot({path:work+'/public-cove-laptop.png'});
 await p.goto('http://localhost:4173/#oath?room=ABCD');await p.locator('#oa-join').waitFor();assert.equal(await p.locator('#oa-code').inputValue(),'ABCD');assert.equal(await p.getByText('COMING SOON',{exact:true}).count(),0);await p.getByRole('button',{name:'SIGN IN WITH GOOGLE TO PLAY →',exact:true}).waitFor();
 await p.screenshot({path:work+'/public-oath-entry.png'});
 // An ordinary player sees the real network hub, including hosting, invites and room discovery.
 await p.evaluate(async()=>{const {OathView}=await import('/oath-view.js');window.identityFixture={id:'ordinary-fixture',email:'ordinary@example.invalid',role:'player',expires:Date.now()/1000+3600};window.fixtureView=new OathView(document.querySelector('#app'),{preferences:{name:'Witness',buddy:'krill'},identity:()=>window.identityFixture,getCloud:async()=>({db:{},ref:(_,path)=>path,query:path=>path,orderByChild:()=>{},limitToLast:()=>{},onValue:(_,cb)=>{cb({val:()=>null});return ()=>{};}}),signIn(){}});});
 await p.getByRole('button',{name:'HOST A COURT →',exact:true}).waitFor();assert.equal(await p.locator('#oa-join,.oa-public,.oa-open-courts').count(),3);assert.equal(await p.getByText('COMING SOON',{exact:true}).count(),0);
 await p.evaluate(()=>window.fixtureView.destroy());assert.deepEqual(errors,[]);await writeFile(work+'/public-entry-verification.json',JSON.stringify({errors,ordinaryGooglePlayerEntry:true,guestSignInRequired:true,joinInviteRetained:true,comingSoonRemoved:true,benchJudgeLogo:style,reducedMotion:true},null,2));console.log('PASS: new judge logo, reduced motion, public Under Oath entry, sign-in requirement, ordinary-player hosting and four-letter invites.');
}finally{await browser.close();}
