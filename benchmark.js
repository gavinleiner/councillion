// A prior estimate, not player telemetry. Seven discrete question outcomes, mixed
// over three assumed skill profiles to retain between-player differences.
export const BENCHMARK_MODEL=Object.freeze({
 version:'challenge-v2',questions:7,points:Object.freeze([0,10,30,60,85,100]),
 profiles:Object.freeze([
  Object.freeze({name:'casual',weight:.20,probabilities:Object.freeze([.08,.25,.32,.23,.10,.02])}),
  Object.freeze({name:'regular',weight:.55,probabilities:Object.freeze([.05,.14,.24,.30,.20,.07])}),
  Object.freeze({name:'experienced',weight:.25,probabilities:Object.freeze([.02,.07,.18,.32,.28,.13])})
 ])
});
export function scoreDistribution(model=BENCHMARK_MODEL){
 const max=model.questions*Math.max(...model.points),mixture=Array(max+1).fill(0);
 for(const profile of model.profiles){let mass=[1];for(let round=0;round<model.questions;round++){const next=Array((round+1)*Math.max(...model.points)+1).fill(0);mass.forEach((prob,score)=>{if(prob===0)return;model.points.forEach((points,i)=>{next[score+points]+=prob*profile.probabilities[i];});});mass=next;}mass.forEach((p,score)=>{mixture[score]+=p*profile.weight;});}
 const sum=mixture.reduce((a,b)=>a+b,0);return mixture.map(p=>p/sum);
}
export const SCORE_DISTRIBUTION=Object.freeze(scoreDistribution());
// Strict comparison: tied scores do not count as scores beaten.
export function estimatedPercentile(score){const value=Number(score);if(!Number.isFinite(value))return 0;let below=0;for(let s=0;s<SCORE_DISTRIBUTION.length&&s<value;s++)below+=SCORE_DISTRIBUTION[s];return Math.max(0,Math.min(100,below*100));}
export function percentileText(percent){if(percent>=99.95)return '99.9%+';if(percent>0&&percent<.05)return '<0.1%';if(percent<1||percent>=99)return percent.toFixed(1)+'%';return Math.round(percent)+'%';}
export const MODEL_MEAN=SCORE_DISTRIBUTION.reduce((n,p,s)=>n+p*s,0);
// Smoothing is presentation-only. Percentiles always use the exact discrete mass.
function densityAt(x){let density=0;for(let s=Math.max(0,Math.floor(x-36));s<=Math.min(700,Math.ceil(x+36));s++)density+=SCORE_DISTRIBUTION[s]*Math.exp(-.5*((s-x)/12)**2);return density;}
const densities=Array.from({length:141},(_,i)=>densityAt(i*5)),peak=Math.max(...densities);
export function renderBellCurve(score){const value=Math.max(0,Math.min(700,Number(score)||0)),percent=estimatedPercentile(value),base=145,height=131;const y=x=>base-densityAt(x)/peak*height;const path=densities.map((d,i)=>(i?'L':'M')+(i*5)+','+(base-d/peak*height).toFixed(2)).join(' '),fill=path+' L700,145 L0,145 Z';const marker=Math.max(2,Math.min(698,value));
 return `<section class="result-benchmark" aria-label="Estimated score comparison"><div class="benchmark-heading"><span>ESTIMATED CHALLENGE CURVE</span><span>0–700 POINTS</span></div><div class="bell-chart"><svg viewBox="0 0 700 157" preserveAspectRatio="none" role="img" aria-label="Modeled seven-question score distribution. Your score is ${value}. Estimated percentage of scores below yours: ${percentileText(percent)}."><defs><clipPath id="below-your-score"><rect x="0" y="0" width="${value}" height="157"/></clipPath></defs><path class="bell-area" d="${fill}"/><path class="bell-below" d="${fill}" clip-path="url(#below-your-score)"/><path class="bell-line" d="${path}"/><path class="bell-axis" d="M0 145H700"/><path class="bell-player-line" d="M${marker} ${Math.max(7,y(value)-10).toFixed(2)}V145"/><circle class="bell-player-dot" cx="${marker}" cy="${y(value).toFixed(2)}" r="3.6"/></svg><span class="bell-you" style="left:${Math.max(2,Math.min(98,value/7))}%">YOU</span><div class="bell-tooltip" hidden></div></div><div class="bell-scale">${Array.from({length:8},(_,i)=>`<span>${i*100}</span>`).join('')}</div><p class="benchmark-verdict">BETTER THAN AN ESTIMATED <strong>${percentileText(percent)}</strong></p><details class="benchmark-method"><summary>Estimated from a scoring model · how it works</summary><p>No live player results have been collected. This model mixes casual, regular, and experienced players (20%, 55%, 25%) across seven questions. This harder benchmark assumes more consistent correct answers and more Rare and Deep Cut finds. The modeled average is about ${Math.round(MODEL_MEAN)} points. “Better than” counts lower scores and excludes ties. These estimates are not calibrated to actual players or individual prompt difficulty.</p></details></section>`;
}
export function mountBellCurve(root){const chart=root.querySelector('.bell-chart');if(!chart)return;const tooltip=chart.querySelector('.bell-tooltip');chart.addEventListener('pointermove',e=>{const box=chart.getBoundingClientRect(),fraction=Math.max(0,Math.min(1,(e.clientX-box.left)/box.width)),score=Math.round(fraction*140)*5;tooltip.hidden=false;tooltip.textContent=score+' points · beats ~'+percentileText(estimatedPercentile(score));tooltip.style.left=Math.max(20,Math.min(80,fraction*100))+'%';});chart.addEventListener('pointerleave',()=>{tooltip.hidden=true;});}
