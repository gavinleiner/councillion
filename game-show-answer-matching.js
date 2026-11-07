// Opt-in for Feud and The Docket. Puffer/Daily and numeric Final Figure never
// import this layer. Keep every typed word grounded in the proposed answer.
import {normalize,resolveAnswer,typoDistance} from './answer-matching.js';
export const SHOW_SHORT_FORMS=[
 ['United States','United States of America','US','USA'],['United Kingdom','UK'],
 ['European Union','EU'],['United Nations','UN'],['New York City','NYC'],['Los Angeles','LA'],['District of Columbia','DC'],
 ['World War II','Second World War','WWII','WW2'],['World War I','First World War','WWI','WW1'],
 ['National Aeronautics and Space Administration','NASA'],['Federal Bureau of Investigation','FBI'],
 ['Central Intelligence Agency','CIA'],['Internal Revenue Service','IRS'],
 ['National Basketball Association','NBA'],['National Football League','NFL'],
 ['National Hockey League','NHL'],['Major League Baseball','MLB'],['Major League Soccer','MLS'],
 ['Ultimate Fighting Championship','UFC'],['World Wrestling Entertainment','WWE'],
 ['National Collegiate Athletic Association','NCAA'],['Olympic Games','Olympics'],
 ['Massachusetts Institute of Technology','MIT'],['University of California Los Angeles','UCLA'],
 ['television','TV'],['personal computer','PC'],['artificial intelligence','AI'],['virtual reality','VR'],
 ['air conditioning','AC'],['air conditioner','AC'],['remote control','remote'],
 ['Minecraft','MC'],['Fortnite','FN'],['Valorant','Val'],['Overwatch','OW'],['Rocket League','RL'],['League of Legends','LoL'],['World of Warcraft','WoW'],
 ['Call of Duty','CoD'],['Counter-Strike','CS'],['Counter-Strike Global Offensive','CSGO'],
 ['Grand Theft Auto','GTA'],['Grand Theft Auto V','GTA5','GTAV'],
 ['Red Dead Redemption','RDR'],['Red Dead Redemption 2','RDR2'],
 ['The Legend of Zelda','LoZ'],['Super Mario Bros','SMB'],['Animal Crossing','AC'],["Assassin's Creed",'AC'],
 ['The Last of Us','TLOU'],['Breath of the Wild','BOTW'],['Tears of the Kingdom','TOTK'],
 ['Five Nights at Freddy\'s','FNAF'],['PlayerUnknown\'s Battlegrounds','PUBG'],
 ['Harry Potter','HP'],['The Lord of the Rings','LOTR'],['Star Wars','SW'],
 ['Game of Thrones','GoT'],['Stranger Things','ST'],['Attack on Titan','AoT'],
 ['Spider-Man','Spiderman','Spidey'],['Teenage Mutant Ninja Turtles','TMNT'],
 ['Facebook','FB'],['Instagram','IG','Insta'],['YouTube','YT'],['Snapchat','Snap'],
 ['peanut butter','PB'],['peanut butter and jelly','PBJ','PB&J'],['orange juice','OJ'],
 ['bacon lettuce and tomato','BLT'],['barbecue','BBQ'],['for your information','FYI'],
 ['macaroni and cheese','mac and cheese'],['mashed potatoes','mash'],
 ['Dr Martin Luther King Jr','Martin Luther King Jr','Martin Luther King','MLK'],
 ['John Fitzgerald Kennedy','John F Kennedy','JFK'],['Franklin Delano Roosevelt','Franklin D Roosevelt','FDR'],
 ['Theodore Roosevelt','Teddy Roosevelt','Teddy'],['Alexander the Great','Alexander III of Macedon'],
 ['Saint','St'],['Doctor','Dr'],['Mister','Mr'],['Professor','Prof'],['President','Pres'],['Vice President','VP'],
 ['Department','Dept'],['University','Univ'],['Apartment','Apt'],['Building','Bldg'],['Street','St'],['Road','Rd'],['Avenue','Ave'],
 ['temperature','temp'],['refrigerator','refrig','fridge'],['calculator','calc'],['microphone','mic'],['computer','comp']
];
const postal=[['Alabama','AL'],['Alaska','AK'],['Arizona','AZ'],['Arkansas','AR'],['California','CA'],['Colorado','CO'],['Connecticut','CT'],['Delaware','DE'],['Florida','FL'],['Georgia','GA'],['Hawaii','HI'],['Idaho','ID'],['Illinois','IL'],['Indiana','IN'],['Iowa','IA'],['Kansas','KS'],['Kentucky','KY'],['Louisiana','LA'],['Maine','ME'],['Maryland','MD'],['Massachusetts','MA'],['Michigan','MI'],['Minnesota','MN'],['Mississippi','MS'],['Missouri','MO'],['Montana','MT'],['Nebraska','NE'],['Nevada','NV'],['New Hampshire','NH'],['New Jersey','NJ'],['New Mexico','NM'],['New York','NY'],['North Carolina','NC'],['North Dakota','ND'],['Ohio','OH'],['Oklahoma','OK'],['Oregon','OR'],['Pennsylvania','PA'],['Rhode Island','RI'],['South Carolina','SC'],['South Dakota','SD'],['Tennessee','TN'],['Texas','TX'],['Utah','UT'],['Vermont','VT'],['Virginia','VA'],['Washington','WA'],['West Virginia','WV'],['Wisconsin','WI'],['Wyoming','WY']];
SHOW_SHORT_FORMS.push(...postal);
const stops=new Set(['a','an','the','and','of','to','in','for','on','at','jr','sr']);
const words=value=>(String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/['’]/g,'').match(/[a-z0-9]+/g)??[]).filter(w=>!stops.has(w));
const digits=w=>w.flatMap(t=>t.match(/\d+/g)??[]).sort().join(',');
const cache=new WeakMap();
// Exact, identifying words may stand for a longer show answer. This is token
// matching, never substring matching: PIT can identify PIT STOP; IT cannot.
const genericFragments=new Set(['thing','things','stuff','person','people','someone','something','place','new','old','big','small','great','little','black','white','red','blue','green','yellow','north','south','east','west','world','war','game','games','movie','film','book','song','show','city','country','state','stop']);
function identifyingFragment(pack,input){
 const query=words(input);if(!query.length||query.some(w=>w.length<3)||query.every(w=>genericFragments.has(w)))return null;
 const hits=pack.answers.filter(answer=>[answer.label,...answer.aliases].some(label=>{
  const target=words(label);if(query.length>=target.length||!query.every(w=>target.includes(w)))return false;
  const versions=target.filter(w=>/\d/.test(w)||/^(?:i{1,3}|iv|v|vi{1,3}|ix|x|xi{1,3}|xiv|xv|xx)$/.test(w));
  return versions.every(w=>query.includes(w));
 }));
 return hits.length===1?hits[0]:null;
}
export function showAnswerPack(source){
 if(cache.has(source))return cache.get(source);
 const answers=source.answers.map(a=>({...a,aliases:[...(a.aliases??[])]})),owners=new Map(),proposals=new Map();
 for(const [i,a]of answers.entries())for(const text of [a.label,...a.aliases]){const key=normalize(text);if(!owners.has(key))owners.set(key,new Set());owners.get(key).add(i);}
 const propose=(text,i)=>{const key=normalize(text);if(!key)return;if(!proposals.has(key))proposals.set(key,{text,owners:new Set()});proposals.get(key).owners.add(i);};
 for(const group of SHOW_SHORT_FORMS){const hits=new Set(group.flatMap(text=>[...(owners.get(normalize(text))??[])]));if(hits.size===1)for(const text of group)propose(text,[...hits][0]);}
 for(const [i,a]of answers.entries())for(const text of [a.label,...a.aliases]){
  if(text.includes('/'))continue;
  const parts=text.replace(/['’]s\b/g,'').match(/[A-Za-z0-9]+/g)??[],content=parts.filter(w=>!stops.has(w.toLowerCase()));
  if(content.length<2)continue;
  // Initial + an identifying surname/remaining name is normal shorthand.
  if(content.every(w=>/^[A-Z0-9]/.test(w))&&content.at(-1).length>=5)for(let n=1;n<content.length;n++)propose(content.slice(0,n).map(w=>w[0]).join(' ')+' '+content.slice(n).join(' '),i);
  for(const list of [parts,content]){const initials=list.map(w=>/^(?:\d+|[IVXLCDM]+)$/.test(w)?w:w[0]).join('').toUpperCase();if(initials.length>=2&&initials.length<=7)propose(initials,i);}
 }
 for(const [key,p]of proposals){const all=new Set([...(owners.get(key)??[]),...p.owners]);if(all.size!==1)continue;const i=[...all][0];if(!owners.has(key)){answers[i].aliases.push(p.text);owners.set(key,all);}}
 const pack={...source,answers};cache.set(source,pack);return pack;
}
function quality(a,b,anchored=false){
 if(a===b)return 1;
 if(a.length>=2&&b.startsWith(a))return .88;
 if(Math.min(a.length,b.length)<(anchored?3:4))return 0;
 // Sound-alike spellings need an independently correct word beside them.
 // For example, "beuro investigation" still identifies the whole answer.
 if(anchored&&Math.min(a.length,b.length)>=4&&a[0]===b[0]&&Math.abs(a.length-b.length)<=2&&sounds(a)===sounds(b))return .88;
 const budget=Math.min(a.length,b.length)<5?100:anchored?Math.min(a.length,b.length)<10?300:400:Math.min(a.length,b.length)<6?100:Math.min(a.length,b.length)<8?250:Math.min(a.length,b.length)<12?350:450;
 const distance=typoDistance(a,b,budget),score=1-distance/(Math.max(a.length,b.length)*100);
 const sameStart=a.slice(0,2)===b.slice(0,2)&&Math.min(a.length,b.length)>=8;
 return distance<=budget&&score>=(anchored ? .60 : sameStart?.68:.72)?score:0;
}
function sounds(word){return word.replace(/^kn/,'n').replace(/^wr/,'r').replace(/ph/g,'f').replace(/ck|qu/g,'k').replace(/c(?=[eiy])/g,'s').replace(/c/g,'k').replace(/[aeiouy]+/g,'').replace(/(.)\1+/g,'$1');}
function misspelledFragment(pack,query){
 if(query.length!==1||query[0].length<5||genericFragments.has(query[0]))return null;
 const candidates=[];
 for(const answer of pack.answers){let score=0;
  for(const label of [answer.label,...answer.aliases]){
   const target=words(label);if(target.some(w=>/\d/.test(w)||/^(?:i{1,3}|iv|v|vi{1,3}|ix|x|xi{1,3}|xiv|xv|xx)$/.test(w)))continue;
   for(const word of target)if(word.length>=5&&!genericFragments.has(word))score=Math.max(score,quality(query[0],word));
  }
  if(score>=.72||score>=.68&&query[0].length>=8)candidates.push({answer,score});
 }
 candidates.sort((a,b)=>b.score-a.score);
 return candidates.length&&(!candidates[1]||candidates[0].score-candidates[1].score>=.08)?candidates[0].answer:null;
}
function phraseQuality(query,target){
 if(!query.length||query.length>target.length||target.length-query.length>1||digits(query)!==digits(target))return 0;
 if(query.reduce((n,w)=>n+w.length,0)<5||query.join('').length/target.join('').length<.60)return 0;
 const missing=target.length-query.length;
 if(missing&&!(query.length>=2||query.length===1&&query[0].length>=6&&target.at(-1).length>=7))return 0;
 const anchored=query.length>=2&&query.some(w=>w.length>=4&&target.includes(w));let best=0,visits=0;
 function walk(i,used,sum){if(++visits>200)return;if(i===query.length){best=Math.max(best,sum/query.length);return;}
  for(let j=0;j<target.length;j++)if(!used.has(j)){let q=quality(query[i],target[j],anchored);
   // A. Einstein: one initial needs a full, identifying surname beside it.
   if(!q&&i===0&&query[i].length===1&&j===0&&target[0].startsWith(query[i])&&query.length===target.length&&query.at(-1)===target.at(-1)&&query.at(-1).length>=5)q=.83;
   if(q){used.add(j);walk(i+1,used,sum+q);used.delete(j);}
  }
 }
 walk(0,new Set(),0);return best>=(missing ? .87 : .78)?best-(missing ? .07 : 0):0;
}
export function resolveShowAnswer(source,input){
 const pack=showAnswerPack(source),literal=normalize(input),withoutArticle=String(input).replace(/^\s*(?:a|an|the)\s+/i,'');
 // Articles add no identifying information. Test whole titles first, then
 // accept an otherwise literal answer without forcing a typo confirmation.
 const exact=pack.answers.filter(a=>[a.label,...a.aliases].some(t=>normalize(t)===literal||normalize(t)===normalize(withoutArticle)));
 if(exact.length===1)return {status:'exact',answer:exact[0],choices:[]};
 const fragment=source.excludedAnswers?.some(t=>normalize(t)===literal)?null:identifyingFragment(pack,input);
 if(fragment)return {status:'exact',answer:fragment,choices:[],partial:true};
 const basic=resolveAnswer(pack,input);if(basic.status!=='missing')return basic;
 const query=words(input);if(String(input).length>120||!query.length||normalize(input).length<4||source.excludedAnswers?.some(t=>normalize(t)===normalize(input)))return basic;
 const fragmentTypo=misspelledFragment(pack,query);if(fragmentTypo)return {status:'matched',answer:{...fragmentTypo,corrected:true},choices:[]};
 const candidates=[];
 for(const answer of pack.answers){let score=0;for(const label of [answer.label,...answer.aliases])score=Math.max(score,phraseQuality(query,words(label)));if(score)candidates.push({answer,score});}
 candidates.sort((a,b)=>b.score-a.score);
 if(!candidates.length||candidates[1]&&candidates[0].score-candidates[1].score<.04)return basic;
 return {status:'matched',answer:{...candidates[0].answer,corrected:true},choices:[]};
}
