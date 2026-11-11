import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {TRIAL_QUESTIONS} from '../trial-data.js';
const work=process.env.TRIAL_QA_WORK??'/Users/gavin/Documents/Codex/2026-10-21/can-2/work/trial-questions-v44';
await mkdir(work,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH??'/Users/gavin/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell'});
const errors=[],report=[];
try{
 for(const [width,height] of [[1366,768],[1280,600],[1024,600],[390,844]]){
  const p=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto(process.env.TRIAL_DEMO_URL??'http://localhost:4197/__trial-bots');
  await p.locator('#tr-demo-play').waitFor();
  await p.evaluate(async()=>{
   window.trDemo.view.practice({autoplay:true,seats:8});
   const session=window.trDemo.session;clearInterval(session.timer);
   let now=1000000;session.clock=()=>now;session.virtual=now;session.previous=now;
   await session.request('start');
   session.secret.trial.deck=['trial-v44-nba-second-chance','trial-v44-nether-bed'];
   window.advanceTo=stage=>{
    for(let i=0;i<30000&&session.state.stage!==stage;i++){now+=60;session.tick();}
    if(session.state.stage!==stage)throw Error('Did not reach '+stage);
   };
   window.advanceTo('trial-question');
  });
  assert.equal(await p.locator('.tr-option').count(),4);
  assert.equal(await p.locator('.tr-answer-context').count(),0);
  await p.screenshot({path:work+'/question-'+width+'x'+height+'.png'});
  const question=await p.evaluate(()=>({prompt:window.trDemo.state.question.prompt,options:window.trDemo.state.question.options}));
  await p.evaluate(()=>window.advanceTo('trial-answer-reveal'));
  assert.equal(await p.locator('.tr-answer-reveal h1').innerText(),'14 seconds');
  assert.match(await p.locator('.tr-answer-context').innerText(),/14, not a fresh 24/);
  await p.screenshot({path:work+'/reveal-'+width+'x'+height+'.png'});
  const layout=await p.evaluate(()=>{
   const main=document.querySelector('.tr-main'),r=main.getBoundingClientRect();
   return {horizontal:document.documentElement.scrollWidth>innerWidth,mainHeight:main.clientHeight,mainScroll:main.scrollHeight,
    explanation:document.querySelector('.tr-answer-context').getBoundingClientRect().bottom,
    source:document.querySelector('.tr-answer-reveal>a').getBoundingClientRect().bottom,mainBottom:r.bottom};
  });
  assert.equal(layout.horizontal,false);
  // Compact phone layouts may scroll within the main panel; the source and
  // explanation must remain reachable there, never clipped by overflow:hidden.
  if(width>=1024){assert.ok(layout.mainScroll<=layout.mainHeight+2,JSON.stringify(layout));assert.ok(layout.source<=layout.mainBottom+1);}
  else await p.locator('.tr-answer-reveal>a').scrollIntoViewIfNeeded();
  let allQuestions;
  if(width===1024){
   allQuestions=await p.evaluate(qs=>qs.map(q=>{
    const session=window.trDemo.session,s=session.state;
    s.stage='trial-question';s.locked={};session.secret.trial.answers={};
    s.question={id:q.id,prompt:q.prompt,subject:q.subject,category:q.category,options:[q.answer,...q.distractors].map((text,i)=>({id:String(i),text}))};
    s.stageAt++;window.trDemo.view.lastKey='';session.render();
    const main=document.querySelector('.tr-main'),r=main.getBoundingClientRect();
    return {id:q.id,overflow:main.scrollHeight-main.clientHeight,mainBottom:r.bottom,choicesBottom:Math.max(...[...main.querySelectorAll('.tr-option')].map(b=>b.getBoundingClientRect().bottom))};
   }),TRIAL_QUESTIONS);
   assert.equal(allQuestions.length,128);
   assert.deepEqual(allQuestions.filter(q=>q.overflow>2||q.choicesBottom>q.mainBottom+1),[]);
  }
  report.push({width,height,question,layout,...(allQuestions?{allQuestions}: {})});await p.close();
 }
 assert.deepEqual(errors,[]);
 await writeFile(work+'/question-browser.json',JSON.stringify({report,errors},null,2));
 console.log(JSON.stringify({viewports:report.length,errors}));
}finally{await browser.close();}
