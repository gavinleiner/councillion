export function hash(text){let n=2166136261;for(const c of text){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0;}
export function random(seed){return()=>{seed+=0x6D2B79F5;let t=seed;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function shuffle(items,rng=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function unseenDeck(packs,{seen=[],rng=Math.random}={}){const excluded=new Set(seen);return shuffle(packs.filter(p=>!excluded.has(p.id)).map(p=>p.id),rng);}
// Choose subject groups with equal opportunity, then a prompt in that group.
// Large film/franchise inventories cannot drown out food, language or tools.
export function varietyDeck(packs,{seen=[],recent=[],rng=Math.random}={}){
 const excluded=new Set(seen),groups=new Map(),familyTurns=new Map();
 for(const p of shuffle(packs,rng))if(!excluded.has(p.id)){const k=p.group??p.id;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(p);}
 const result=[],lastGroups=recent.slice(-4),lastFamilies=[];
 while(groups.size){
  let choices=[...groups].filter(([k])=>!lastGroups.includes(k));if(!choices.length)choices=[...groups];
  const families=[...new Set(choices.map(([,a])=>a[0].family))];let candidates=families.filter(f=>f!==lastFamilies.at(-1));if(!candidates.length)candidates=families;
  const min=Math.min(...candidates.map(f=>familyTurns.get(f)??0));candidates=candidates.filter(f=>(familyTurns.get(f)??0)===min);const family=candidates[Math.floor(rng()*candidates.length)];choices=choices.filter(([,a])=>a[0].family===family);
  const [group,items]=choices[Math.floor(rng()*choices.length)],p=items.pop();result.push(p.id);familyTurns.set(family,(familyTurns.get(family)??0)+1);lastGroups.push(group);if(lastGroups.length>4)lastGroups.shift();lastFamilies.push(family);if(!items.length)groups.delete(group);
 }
 return result;
}
