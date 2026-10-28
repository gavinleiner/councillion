// Canonical names and explicit aliases win. Corrections need spelling evidence
// for every content word; the UI asks the player to confirm the best proposal.
export const ANSWER_MATCHING_VERSION='word-evidence-2';
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
const roman={i:'1',v:'5',x:'10',ii:'2',iii:'3',iv:'4',vi:'6',vii:'7',viii:'8',ix:'9',xi:'11',xii:'12',xiii:'13',xiv:'14',xv:'15',xvi:'16'};
const fold=value=>String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const escapeRE=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function tokens(value,pack,query=false){
 let text=fold(value).replace(/['’]s\b/g,'').replace(/['’]/g,'').replace(/&/g,' and ');
 if(query){
  text=text.replace(/^(?:i think (?:it is |its )?|it is |its called |the answer is )/,'');
  // Only explicit context phrases, at whole-word boundaries. Never remove
  // arbitrary substrings or a word merely because it appears in the prompt.
  for(const phrase of pack.inputNoise??[])text=text.replace(new RegExp('(^|[^a-z0-9])'+escapeRE(fold(phrase)).replace(/\s+/g,'\\s+')+'(?=$|[^a-z0-9])','g'),' ');
 }
 const words=text.match(/[a-z0-9+#]+/g)??[];
 return words.map((word,i)=>i>0&&i===words.length-1?(roman[word]??word):word).filter(w=>pack.family==='words'||!stopwords.has(w));
}
const digits=words=>words.flatMap(w=>w.match(/\d+/g)??[]).sort().join(',');
// Short words have very little identifying evidence. Longer words can have
// several actual typing mistakes, but never an arbitrary fraction replaced.
function editBudget(a,b){
 const min=Math.min(a.length,b.length),max=Math.max(a.length,b.length);
 if(min<3||digits([a])!==digits([b])||(a.match(/[+#]/g)??[]).join('')!==(b.match(/[+#]/g)??[]).join(''))return 0;
 if(min===3)return max===4&&(a.includes(b)||b.includes(a))?100:0;
 return min<5?100:min===5?(max>=7?265:100):min<10?200:300;
}
function wordCost(a,b,context=false){
 if(a===b)return 0;
 const limit=editBudget(a,b);if(!limit)return Infinity;
 const cost=typoDistance(a,b,limit);
 return cost<=limit&&1-cost/(Math.max(a.length,b.length)*100)>=(context ? .60 : .70)?cost:Infinity;
}
// Numeric version punctuation can identify different real systems (1.0 vs10).
// Whole numeric tokens preserve that evidence only for explicitly opted-in packs.
const numericKey=value=>normalize(value)+'\0'+(String(value).match(/\d+(?:\.\d+)*/g)??[]).join('|');
const banks=new Map();
function compile(pack){
 if(banks.has(pack)){const b=banks.get(pack);banks.delete(pack);banks.set(pack,b);return b;}
 const exact=new Map(),byLength=new Map();
 for(const answer of pack.answers)for(const label of [answer.label,...(answer.aliases??[])]){
  const key=normalize(label);if(!key||exact.has(key))continue;exact.set(key,answer);
  if(!byLength.has(key.length))byLength.set(key.length,[]);
  byLength.get(key.length).push({key,label,answer,acronym:label!==answer.label&&/^[A-Z][A-Z0-9. -]{1,7}$/.test(label)});
 }
 const numericExact=pack.preserveNumericTokens?new Map():null;
 if(numericExact){
  for(const rows of byLength.values())for(const record of rows)numericExact.set(numericKey(record.label),record.answer);
  // Explicit public dotted-version names may collide under the usual punctuation
  // folding. Preserve their actual case-insensitive spelling for exact matching
  // and post-submit typo proposals, while letter-case identity exceptions stay literal.
  for(const [label,target]of Object.entries(pack.literalAliases??{})){
   if(!/\d/.test(label))continue;const answer=exact.get(normalize(target));if(!answer)continue;
   numericExact.set(numericKey(label),answer);const key=normalize(label);
   if(!byLength.has(key.length))byLength.set(key.length,[]);
   if(!byLength.get(key.length).some(r=>r.label===label&&r.answer===answer))byLength.get(key.length).push({key,label,answer,acronym:false});
  }
 }
 // No generated initials: a short form must actually be a name or alias in
 // the inventory. In particular, two random letters never expand to a title.
 const b={exact,byLength,numericExact};banks.set(pack,b);if(banks.size>8)banks.delete(banks.keys().next().value);return b;
}
function recordWords(record,pack){return record.tokens??=tokens(record.label,pack);}
function wordIndex(bank,pack){
 if(bank.words)return;
 bank.words=new Map();
 for(const rows of bank.byLength.values())for(const record of rows)for(const token of new Set(recordWords(record,pack))){
  if(!bank.words.has(token))bank.words.set(token,[]);bank.words.get(token).push(record);
 }
}
function phraseMatch(query,target,pairCost=wordCost){
 if(!query.length||!target.length||query.length>target.length||target.length-query.length>1||digits(query)!==digits(target))return null;
 // Require all typed content words. Missing one answer word needs two strong
 // anchors; one shared noun cannot stand for an arbitrary compound answer.
 const missing=target.length-query.length;
 if(missing&&query.filter(w=>w.length>=4&&!/\d/.test(w)).length<2)return null;
 const pairs=[];
 for(let i=0;i<query.length;i++)for(let j=0;j<target.length;j++){
  const cost=pairCost(query[i],target[j],query.length>=2);if(Number.isFinite(cost))pairs.push({i,j,cost,quality:1-cost/(Math.max(query[i].length,target[j].length)*100)});
 }
 // Small phrases use a bounded assignment search rather than a greedy pairing
 // that can consume the wrong occurrence in repeated/similar-word names.
 const choices=query.map((_,i)=>pairs.filter(p=>p.i===i).sort((a,b)=>a.cost-b.cost));
 if(choices.some(a=>!a.length))return null;
 const order=choices.map((_,i)=>i).sort((a,b)=>choices[a].length-choices[b].length);
 let best=null,visited=0;
 const walk=(k,used,cost,quality,positions)=>{
  if(++visited>512)return;
  if(k===order.length){if(!best||cost<best.cost||cost===best.cost&&quality>best.quality)best={cost,quality,positions:[...positions]};return;}
  const i=order[k];for(const pair of choices[i])if(!used.has(pair.j)){
   used.add(pair.j);positions[i]=pair.j;walk(k+1,used,cost+pair.cost,quality+pair.quality,positions);used.delete(pair.j);
  }
 };
 walk(0,new Set(),0,0,[]);if(!best)return null;
 const quality=best.quality/query.length;if(quality<.70)return null;
 if(missing&&(quality<.88||query.reduce((n,w)=>n+w.length,0)/target.reduce((n,w)=>n+w.length,0)<.60))return null;
 const reordered=best.positions.some((p,i)=>i>0&&p<best.positions[i-1]);
 return {score:quality-(missing ? .12 : 0)-(reordered ? .015 : 0),cost:best.cost,missing};
}
function gramMask(value){
 const mask=[0,0,0,0];for(let i=0;i<value.length-1;i++){const n=(value.charCodeAt(i)*37^value.charCodeAt(i+1))&127;mask[n>>>5]|=1<<(n&31);}return mask;
}
function bitCount(n){n-=n>>>1&0x55555555;n=(n&0x33333333)+(n>>>2&0x33333333);return ((n+(n>>>4)&0x0f0f0f0f)*0x01010101)>>>24;}
function grams(value){const g=new Set();for(let i=0;i<value.length-1;i++)g.add(value.slice(i,i+2));return g;}
export function resolveAnswer(pack,input){
 const raw=String(input??'');if(raw.length>256)return {status:'missing',choices:[]};
 const bank=compile(pack),spelling=raw.trim();
 const own=(map,key)=>map&&Object.hasOwn(map,key)?map[key]:null;
 const literal=own(pack.literalAliases,spelling)??own(pack.foldedLiteralAliases,spelling.toLowerCase());
 if(literal){const answer=bank.exact.get(normalize(literal));if(answer)return {status:'exact',answer:{...answer,corrected:false},choices:[]};}
 const query=normalize(raw);if(!query)return {status:'missing',choices:[]};
 const exact=pack.preserveNumericTokens?bank.numericExact.get(numericKey(raw)):bank.exact.get(query);if(exact)return {status:'exact',answer:{...exact,corrected:false},choices:[]};
 if(query.length<4||pack.excludedAnswers?.some(name=>normalize(name)===query))return {status:'missing',choices:[]};
 const qt=tokens(raw,pack,true),qdigits=digits(qt),found=new Map(),checked=new Set();
 if(!qt.length)return {status:'missing',choices:[]};
 const costs=new Map(),pairCost=(a,b,context)=>{
  if(!context)return wordCost(a,b,context);const key=a+'\0'+b;
  if(costs.has(key))return costs.get(key);const cost=wordCost(a,b,context);if(costs.size<20000)costs.set(key,cost);return cost;
 };
 const add=(answer,result)=>{const old=found.get(answer.label);if(!old||result.score>old.score||result.score===old.score&&result.cost<old.cost)found.set(answer.label,{answer,...result});};
 const consider=record=>{
  if(checked.has(record)||record.key.length<4||record.acronym)return;checked.add(record);
  const rt=recordWords(record,pack);if(qdigits!==digits(rt))return;
  const phrase=phraseMatch(qt,rt,pairCost);
  if(phrase){add(record.answer,phrase);return;}
  // Joined/split words still work ("dimondsword"). This fallback cannot delete
  // a short meaningful word from a multiword input, or turn an acronym into a
  // longer name. Bound the whole edit budget as well as per-word mistakes.
  if(qt.length!==1&&rt.length!==1)return;
  const a=qt.join(''),b=rt.join('');if(Math.min(a.length,b.length)<4)return;
  const limit=editBudget(a,b),cost=typoDistance(a,b,limit);
  if(cost<=limit&&1-cost/(Math.max(a.length,b.length)*100)>=.82)add(record.answer,{score:1-cost/(Math.max(a.length,b.length)*100),cost,missing:0});
 };
 for(const seed of new Set([query,qt.join('')])){
  const span=seed.length>=10?5:seed.length>=6?3:1,qgrams=grams(seed),mask=gramMask(seed);
  const minimum=qgrams.size<6?1:Math.ceil(qgrams.size*.45),collisions=qgrams.size-mask.reduce((n,b)=>n+bitCount(b),0);
  // A lossy bit mask is only a rejection prefilter. Subtract collisions so it
  // cannot discard a record that would pass the exact shared-bigram check.
  const maskMinimum=Math.max(0,minimum-collisions);
  for(let n=Math.max(4,seed.length-span);n<=seed.length+span;n++)for(const record of bank.byLength.get(n)??[]){
   const rm=record.mask??=gramMask(record.key);if(mask.reduce((n,b,i)=>n+bitCount(b&rm[i]),0)<maskMinimum)continue;
   let shared=0;for(const gram of qgrams)if(record.key.includes(gram))shared++;
   if(shared>=minimum)consider(record);
  }
 }
 if(pack.family!=='words'){
  wordIndex(bank,pack);
  // Exact anchors find reordered phrases, harmless extra context, and a
  // possible missing word without scanning every title in a huge bank.
  const candidates=new Map();for(const t of new Set(qt))for(const record of bank.words.get(t)??[])candidates.set(record,(candidates.get(record)??0)+1);
  for(const [record,hits]of candidates)if(hits>=Math.min(2,qt.length))consider(record);
 }
 const ranked=[...found.values()].sort((a,b)=>b.score-a.score||a.cost-b.cost||a.answer.points-b.answer.points||a.answer.label.localeCompare(b.answer.label));
 if(!ranked.length)return {status:'missing',choices:[]};
 // Completing an omitted content word must identify one answer. Do not choose
 // "Chicken tikka masala" over "Paneer tikka masala" just by rarity or order.
 const best=ranked[0];if(best.missing&&ranked.some(r=>r!==best&&best.score-r.score<.08))return {status:'missing',choices:[]};
 return {status:'matched',answer:{...best.answer,corrected:true},choices:[]};
}
export const matchAnswer=(pack,input)=>resolveAnswer(pack,input).answer??null;
export function warmAnswerBank(pack){const bank=compile(pack);if(pack.family!=='words')wordIndex(bank,pack);}
