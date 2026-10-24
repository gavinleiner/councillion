import {QUESTION_SAMPLE} from './question-sample.js';
import {QuestionReviewStore,reviewTotals} from './question-review-state.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const subjects={gaming:'Gaming',sports:'Sports',culture:'Movies & TV',music:'Music',food:'Food',nature:'Nature',science:'Science',world:'Places & travel',everyday:'Everyday life'};

export function sampleFeedback(sample,items){
 return {version:sample.version,poolBuild:sample.poolBuild,selectionBuild:sample.selectionBuild,seed:sample.seed,poolCount:sample.poolCount,method:sample.method,counts:reviewTotals(items),questions:sample.questions.map((p,i)=>({number:i+1,id:p.id,subject:subjects[p.family]??p.family,format:p.format,prompt:p.prompt,answerCount:p.answerCount,vote:items[p.id]?.vote??'unrated',note:items[p.id]?.note??''}))};
}

export function mountLiveQuestionReview(root,{identity=null,storage=globalThis.localStorage,sample=QUESTION_SAMPLE}={}){
 let undo=null,closed=false;
 const questions=sample.questions,byId=new Map(questions.map(p=>[p.id,p]));
 const store=new QuestionReviewStore({uid:identity?.uid??'guest',storage,version:sample.version,questionIds:byId.keys(),onChange:()=>paint()});
 root.innerHTML=`<section class="live-question-review"><div class="sample-heading"><a href="#questions">◂ QUESTION LIBRARY</a><p class="eyebrow">COUNCILLION · LIVE POOL CHECK</p><h1>100 RANDOM QUESTIONS.</h1><p>Drawn from the actual ${sample.poolCount.toLocaleString()} in Puffer, Daily and Practice. These are the exact prompts, in random order.</p><p class="sample-fine">Every unseen question has an equal chance, using the same selection system as live play. Similar questions stay visible for your review. Your original tryout votes stay separate.</p><details id="sample-breakdown"><summary>WHAT’S IN THIS DRAW?</summary><p>${Object.entries(sample.families).map(([key,n])=>`${n} ${esc(subjects[key]??key)}`).join(' · ')}</p><table><caption>The format labels make similar templates easy to compare.</caption><thead><tr><th>Format</th><th>Questions</th></tr></thead><tbody>${Object.entries(sample.formats).sort((a,b)=>b[1]-a[1]).map(([format,n])=>`<tr><td>${esc(format)}</td><td>${n}</td></tr>`).join('')}</tbody></table><p class="sample-seed">Pool ${esc(sample.poolBuild)} · Seed ${esc(sample.seed)}</p><a href="question-sample-100.json" download>DOWNLOAD THIS EXACT DRAW ↧</a></details></div><div class="sample-toolbar"><div class="sample-progress"><strong id="sample-rated">0 / 100 RATED</strong><span id="sample-tally"></span><button id="sample-undo" disabled>UNDO</button></div><div class="sample-filters"><label><span class="sr-only">Filter sample by subject</span><select id="sample-subject"><option value="">Every subject</option>${Object.keys(sample.families).map(id=>`<option value="${id}">${subjects[id]??id}</option>`).join('')}</select></label><label><span class="sr-only">Filter sample by format</span><select id="sample-format"><option value="">Every format</option>${Object.keys(sample.formats).map(format=>`<option value="${esc(format)}">${esc(format)}</option>`).join('')}</select></label><label><span class="sr-only">Filter by your vote</span><select id="sample-vote"><option value="all">All 100</option><option value="unrated">Not rated</option><option value="yes">Your Yes choices</option><option value="no">Your No choices</option></select></label></div><div class="sample-toolbar-bottom"><p id="sample-visible" role="status"></p><button id="sample-download">DOWNLOAD YOUR REVIEW ↧</button></div></div><p class="sample-save" id="sample-save" role="status">Saved on this device. Download your review to send it back.</p><div class="sample-cards">${questions.map((p,i)=>`<article class="sample-card" data-sample-id="${esc(p.id)}"><div class="sample-question"><p class="sample-kicker"><b>${String(i+1).padStart(3,'0')}</b><span>${esc(subjects[p.family]??p.family)}</span><span>${esc(p.format)}</span></p><h2>${esc(p.prompt)}</h2><p class="sample-answer-count">${p.answerCount.toLocaleString()} answers in its current bank</p><details class="sample-note"><summary>ADD A NOTE</summary>${p.scope?`<p>${esc(p.scope)}</p>`:''}<label for="sample-note-${i}">Too specific, repeated format, missing answers, or a good one?</label><textarea id="sample-note-${i}" data-sample-note="${esc(p.id)}" maxlength="500" rows="2" placeholder="Optional note">${esc(store.items[p.id]?.note??'')}</textarea><small class="sample-id">${esc(p.id)}</small></details></div><div class="sample-votes" role="group" aria-label="Rate question ${i+1}"><button data-sample-vote="yes" data-id="${esc(p.id)}" aria-pressed="false">YES</button><button data-sample-vote="no" data-id="${esc(p.id)}" aria-pressed="false">NO</button><button data-sample-clear="${esc(p.id)}" hidden>CLEAR</button></div></article>`).join('')}</div><p id="sample-empty" hidden>No questions in this view. Change a filter to see more.</p><div class="sample-finish"><h2 id="sample-finish-heading">KEEP GOING.</h2><p>Votes and notes save in this browser as you go. Download your review when you’re ready, then attach it in our chat.</p><button id="sample-download-bottom">DOWNLOAD YOUR REVIEW ↧</button><a href="#review">REVISIT YOUR ORIGINAL TRYOUT ↗</a><p id="sample-export-status" role="status"></p></div></section>`;
 const q=s=>root.querySelector(s),cards=[...root.querySelectorAll('[data-sample-id]')];
 function paint(){
  if(closed)return;
  const totals=reviewTotals(store.items);q('#sample-rated').textContent=totals.rated+' / 100 RATED';q('#sample-tally').textContent=totals.yes+' YES · '+totals.no+' NO';q('#sample-undo').disabled=!undo;
  q('#sample-save').textContent=store.status+'. Download your review to send it back.';
  q('#sample-finish-heading').textContent=totals.rated===100?'ALL 100 REVIEWED.':'KEEP GOING.';
  let visible=0;
  for(const card of cards){const p=byId.get(card.dataset.sampleId),item=store.items[p.id],vote=item?.vote??'unset',selected=q('#sample-vote').value;
   card.hidden=!!((q('#sample-subject').value&&p.family!==q('#sample-subject').value)||(q('#sample-format').value&&p.format!==q('#sample-format').value)||(selected!=='all'&&(selected==='unrated'?vote!=='unset':vote!==selected)));
   if(!card.hidden)visible++;
   card.dataset.vote=vote;
   for(const b of card.querySelectorAll('[data-sample-vote]'))b.setAttribute('aria-pressed',String(b.dataset.sampleVote===vote));
   card.querySelector('[data-sample-clear]').hidden=vote==='unset';
   card.querySelector('summary').textContent=item?.note?'NOTE · SAVED':'ADD A NOTE';
  }
  q('#sample-visible').textContent=visible+' / 100 shown';q('#sample-empty').hidden=visible!==0;
 }
 function edit(id,vote,note){undo={id,item:store.items[id]?{...store.items[id]}:null};store.edit(id,vote,note);}
 const onClick=e=>{const vote=e.target.closest('[data-sample-vote]'),clear=e.target.closest('[data-sample-clear]');if(vote)edit(vote.dataset.id,vote.dataset.sampleVote);else if(clear)edit(clear.dataset.sampleClear,'unset');};
 const onInput=e=>{if(e.target.matches('[data-sample-note]')){const id=e.target.dataset.sampleNote;store.edit(id,store.items[id]?.vote??'unset',e.target.value);}};
 root.addEventListener('click',onClick);root.addEventListener('input',onInput);
 for(const id of ['#sample-subject','#sample-format','#sample-vote'])q(id).onchange=paint;
 q('#sample-undo').onclick=()=>{if(!undo)return;const last=undo;undo=null;store.edit(last.id,last.item?.vote??'unset',last.item?.note??'');root.querySelector(`[data-sample-note="${last.id}"]`).value=last.item?.note??'';};
 function download(){const url=URL.createObjectURL(new Blob([JSON.stringify(sampleFeedback(sample,store.items),null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='councillion-live-100-review.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);q('#sample-export-status').textContent='Review downloaded. Attach councillion-live-100-review.json in our chat.';}
 q('#sample-download').onclick=q('#sample-download-bottom').onclick=download;
 paint();return {store,destroy(){closed=true;root.removeEventListener('click',onClick);root.removeEventListener('input',onInput);store.destroy();}};
}
