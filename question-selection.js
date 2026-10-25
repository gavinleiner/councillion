export const QUESTION_SELECTION_BUILD='20261025-reviewed-standard-v1';
export function hash(text){let n=2166136261;for(const c of text){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0;}
export function random(seed){return()=>{seed+=0x6D2B79F5;let t=seed;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function shuffle(items,rng=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function unseenDeck(packs,{seen=[],rng=Math.random}={}){const excluded=new Set(seen);return shuffle(packs.filter(p=>!excluded.has(p.id)).map(p=>p.id),rng);}
// A random integer selects from every remaining ID, with no subject, format,
// catalog-order or difficulty weighting. Fisher-Yates deals without replacement:
// every unseen question has the same chance, and played IDs cannot repeat.
export const uniformQuestionDeck=unseenDeck;
const formatOf=p=>p.group?.startsWith('group-approved-')?'approved':p.group?.startsWith('group-broad-')||p.group==='distinct-kinds'?'broad':p.group==='distinct-artist-songs'?'group-artist-songs':p.group??p.predicate?.kind??'broad';
// Random subjects, random formats, then a random unseen question in that
// format. A large source inventory gets no extra turns merely for being large.
// The last six subjects are avoided whenever another subject is available.
export function balancedQuestionDeck(packs,{seen=[],recent=[],rng=Math.random}={}){
 const excluded=new Set(seen),families=new Map(),formatTurns=new Map(),last=recent.slice(-6),result=[];
 for(const p of shuffle(packs,rng))if(!excluded.has(p.id)){
  const family=p.family??'everyday',format=formatOf(p);if(!families.has(family))families.set(family,new Map());
  const formats=families.get(family);if(!formats.has(format))formats.set(format,[]);formats.get(format).push(p.id);
 }
 while(families.size){
  const keys=[...families.keys()],frequency=f=>last.filter(x=>x===f).length;
  let available=keys.filter(f=>!last.includes(f));
  if(!available.length){const least=Math.min(...keys.map(frequency));available=keys.filter(f=>frequency(f)===least);if(available.length>1)available=available.filter(f=>f!==last.at(-1));}
  const family=available[Math.min(available.length-1,Math.floor(rng()*available.length))],formats=families.get(family),names=[...formats.keys()];
  const turns=k=>formatTurns.get(family+':'+k)??0,min=Math.min(...names.map(turns)),choices=names.filter(k=>turns(k)===min),format=choices[Math.min(choices.length-1,Math.floor(rng()*choices.length))];
  const bucket=formats.get(format);result.push(bucket.pop());formatTurns.set(family+':'+format,turns(format)+1);if(!bucket.length)formats.delete(format);if(!formats.size)families.delete(family);
  last.push(family);if(last.length>6)last.shift();
 }
 return result;
}
export function dailyQuestionDeck(packs,options={}){
 const byId=new Map(packs.map(p=>[p.id,p])),deck=balancedQuestionDeck(packs,options),result=[];
 for(let i=0;i+7<=deck.length;i+=7){const day=deck.slice(i,i+7);if(new Set(day.map(id=>byId.get(id).family)).size!==7)break;result.push(...day);}
 return result;
}
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
