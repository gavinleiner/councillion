// Word-aware matching. Exact aliases win, then the closest plausible spelling
// or phrase. Ties favor the more familiar answer. Cache a bounded working set.
export const normalize=value=>String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9+#]/g,'');
const keyboard=new Map();
for(const [row,letters] of ['qwertyuiop','asdfghjkl','zxcvbnm'].entries())for(const [col,letter]of [...letters].entries())keyboard.set(letter,[col+[0,.25,.75][row],row]);
function neighbor(a,b){const x=keyboard.get(a),y=keyboard.get(b);return x&&y&&Math.abs(x[0]-y[0])<=1.1&&Math.abs(x[1]-y[1])<=1;}
export function typoDistance(a,b,limit=600){
 if(a===b)return 0;if(Math.abs(a.length-b.length)*55>limit)return Infinity;
 let older,previous=Array.from({length:b.length+1},(_,i)=>i*100);
 for(let i=1;i<=a.length;i++){
  const row=[i*100];let minimum=row[0];
  for(let j=1;j<=b.length;j++){
   const substitution=a[i-1]===b[j-1]?0:neighbor(a[i-1],b[j-1])?65:100;
   const deletion=i>1&&a[i-1]===a[i-2]?55:100,insertion=j>1&&b[j-1]===b[j-2]?55:100;
   row[j]=Math.min(previous[j]+deletion,row[j-1]+insertion,previous[j-1]+substitution);
   if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])row[j]=Math.min(row[j],older[j-2]+65);
   minimum=Math.min(minimum,row[j]);
  }
  if(minimum>limit)return Infinity;older=previous;previous=row;
 }
 return previous[b.length];
}
const stopwords=new Set(['a','an','the','of','and','to','in','for','on','at','from','with']);
const roman={one:'1',two:'2',three:'3',four:'4',five:'5',six:'6',seven:'7',eight:'8',nine:'9',ten:'10',i:'1',v:'5',x:'10',ii:'2',iii:'3',iv:'4',vi:'6',vii:'7',viii:'8',ix:'9',xi:'11',xii:'12',xiii:'13',xiv:'14',xv:'15',xvi:'16'};
function tokens(value,pack){
 let text=String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/['’]s\b/g,'').replace(/^(?:i think (?:it is |its )?|it is |its called |the answer is )/,'');
 for(const phrase of pack.inputNoise??[])text=text.replaceAll(phrase.toLowerCase(),' ');
 return (text.match(/[a-z0-9+#]+/g)??[]).filter(w=>!stopwords.has(w)).map(w=>roman[w]??(w.length>4&&w.endsWith('s')&&!/(ss|us|ous|ies)$/.test(w)?w.slice(0,-1):w));
}
function abbreviations(label){
 const words=String(label).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().match(/[a-z0-9]+/g)||[];
 if(words.length<2)return [];
 const initials=items=>items.map(w=>/^[ivx]+$/.test(w)&&w.length<=4?w:w[0]).join('');
 return [...new Set([initials(words),initials(words.filter(w=>!stopwords.has(w)))])].filter(k=>k.length>=2&&k.length<=12&&/[a-z]/.test(k));
}
const banks=new Map();
function compile(pack){
 if(banks.has(pack)){const b=banks.get(pack);banks.delete(pack);banks.set(pack,b);return b;}
 const exact=new Map(),short=new Map(),byLength=new Map();
 for(const answer of pack.answers){
  for(const label of [answer.label,...(answer.aliases??[])]){
   const key=normalize(label);if(!key||exact.has(key))continue;exact.set(key,answer);
   if(!byLength.has(key.length))byLength.set(key.length,[]);byLength.get(key.length).push({key,label,answer});
  }
  for(const key of abbreviations(answer.label)){const old=short.get(key);if(!old||answer.points<old.points||answer.points===old.points&&answer.label.localeCompare(old.label)<0)short.set(key,answer);}
 }
 const b={exact,short,byLength};banks.set(pack,b);if(banks.size>8)banks.delete(banks.keys().next().value);return b;
}
function wordIndex(bank,pack){
 if(bank.words)return;
 bank.words=new Map();
 for(const rows of bank.byLength.values())for(const record of rows){record.tokens=tokens(record.label,pack);for(const token of new Set(record.tokens)){if(!bank.words.has(token))bank.words.set(token,[]);bank.words.get(token).push(record);}}
}
const generic=new Set(['sword','ring','star','super','world','great','black','white','gold','golden','dark','light','fire','flame','night','legend','final','fantasy','game','movie','series','story']);
function wordScore(query,target){
 if(Math.abs(query.length-target.length)>2)return 0;
 if(query.length===1){const q=query[0];return q.length>=5&&!generic.has(q)&&target.length<=2&&target.includes(q)?.87:0;}
 if(target.length<2)return 0;
 const digits=a=>a.filter(t=>/^\d+$/.test(t)).sort().join(',');if(digits(query)!==digits(target))return 0;
 const pairs=[];
 for(let i=0;i<query.length;i++)for(let j=0;j<target.length;j++){
  const a=query[i],b=target[j],limit=Math.min(350,Math.max(a.length,b.length)*42);
  const cost=a===b?0:Math.min(a.length,b.length)<4?Infinity:typoDistance(a,b,limit);
  if(cost<=limit)pairs.push({i,j,cost,quality:1-cost/(Math.max(a.length,b.length)*100)});
 }
 pairs.sort((a,b)=>b.quality-a.quality);const usedQ=new Set(),usedT=new Set();let quality=0;
 for(const p of pairs)if(!usedQ.has(p.i)&&!usedT.has(p.j)){usedQ.add(p.i);usedT.add(p.j);quality+=p.quality;}
 const matches=usedQ.size,missingQ=query.length-matches,missingT=target.length-matches;
 if((matches<2&&!(matches===1&&query.length===2&&target.length===2&&query.some((q,i)=>usedQ.has(i)&&q.length>=5)))||missingQ>1||missingT>2)return 0;
 return .98*quality/matches-.12*missingQ-.11*missingT;
}
function grams(value){const g=new Set();for(let i=0;i<value.length-1;i++)g.add(value.slice(i,i+2));return g;}
export function resolveAnswer(pack,input){
 const query=normalize(String(input??'').slice(0,256));if(!query)return {status:'missing',choices:[]};
 const bank=compile(pack),exact=bank.exact.get(query);if(exact)return {status:'exact',answer:{...exact,corrected:false},choices:[]};
 if(pack.excludedAnswers?.some(name=>normalize(name)===query))return {status:'missing',choices:[]};
 const short=bank.short.get(query);
 if(short)return {status:'matched',answer:{...short,corrected:true,abbreviated:true},choices:[]};
 if(query.length<4)return {status:'missing',choices:[]};
 const found=new Map(),add=(answer,score,cost)=>{if(score>(found.get(answer.label)?.score??0))found.set(answer.label,{answer,score,cost});};
 const limit=query.length>=18?600:query.length>=10?400:query.length>=7?350:query.length>=5?220:100;
 const span=Math.min(6,Math.ceil(limit/100)),qgrams=grams(query),qt=tokens(input,pack);
 const qdigits=qt.filter(t=>/^\d+$/.test(t)).sort().join(',');
 for(let n=Math.max(4,query.length-span);n<=query.length+span;n++)for(const record of bank.byLength.get(n)??[]){
  const rt=record.tokens??=tokens(record.label,pack),digitTokens=record.digits??=(rt.filter(t=>/^\d+$/.test(t)).sort().join(','));if(qdigits!==digitTokens)continue;
  let shared=0;for(const gram of qgrams)if(record.key.includes(gram))shared++;
  if(shared<Math.max(1,qgrams.size*.30))continue;
  const cost=typoDistance(query,record.key,limit),ws=qt.length>=2&&rt.length>=2&&pack.family!=='words'?wordScore(qt,rt):null;
  const score=(1-cost/(Math.max(n,query.length)*100))*(ws!==null&&ws<.66?.70:1);
  if(cost<=limit&&score>=(query.length<5?.80:query.length<8?.72:.68))add(record.answer,score,cost);
  if(ws!==null&&ws>=.66)add(record.answer,ws);
 }
 if(qt.length>=1&&pack.family!=='words'&&(qt.length>1||![...found.values()].some(r=>r.score>=.82))){
  wordIndex(bank,pack);const candidates=new Map();
  for(const t of new Set(qt))for(const record of bank.words.get(t)??[])candidates.set(record,(candidates.get(record)??0)+1);
  for(const [record,hits]of candidates)if(hits>=Math.max(1,Math.min(2,qt.length-1))){
   const score=wordScore(qt,record.tokens);if(score>=.66)add(record.answer,score);
  }
 }
 const ranked=[...found.values()].sort((a,b)=>b.score-a.score||(a.cost??Infinity)-(b.cost??Infinity)||a.answer.points-b.answer.points||a.answer.label.localeCompare(b.answer.label));
 if(!ranked.length)return {status:'missing',choices:[]};
 return {status:'matched',answer:{...ranked[0].answer,corrected:true},choices:[]};
}
export const matchAnswer=(pack,input)=>resolveAnswer(pack,input).answer??null;
export function warmAnswerBank(pack){const bank=compile(pack);if(pack.family!=='words')wordIndex(bank,pack);}
