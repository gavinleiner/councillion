// Each broad bank is fetched separately; home/library use metadata only.
const loaded=new Map(),pending=new Map();let build='',extraBuild='',discoveryBuild='',groupBuild='',localReader;
export function registerFunDataReader(reader){localReader=reader;}
const bankKey=pack=>pack.id+'@'+(pack.answerFile??'inline');
function readLocal(pack){if(localReader&&!loaded.has(bankKey(pack)))seedFunAnswers(pack,localReader(pack));}
export const funBuild=()=>build+'-'+extraBuild+'-'+discoveryBuild+'-'+groupBuild;
export const funAnswersReady=packs=>packs.every(p=>{if(p.funVersion)readLocal(p);return !p.funVersion||loaded.has(bankKey(p));});
export function seedFunAnswers(pack,rows){
 if(!Array.isArray(rows)||rows.length!==pack.answerCount)throw Error('The question bank update is incomplete. Refresh and try again.');
 loaded.delete(bankKey(pack));loaded.set(bankKey(pack),rows.map(([label,points,aliases])=>({label,points,aliases})));while(loaded.size>16)loaded.delete(loaded.keys().next().value);
}
export async function loadFunAnswers(packs){
 for(const pack of packs)if(pack.funVersion)readLocal(pack);
 await Promise.all(packs.filter(p=>p.funVersion&&!loaded.has(bankKey(p))).map(pack=>{
  if(!pending.has(bankKey(pack)))pending.set(bankKey(pack),fetch('./'+(pack.answerDirectory??'question-banks')+'/'+pack.answerFile).then(r=>{if(!r.ok)throw Error('The answer archive could not be loaded. Check your connection and retry.');return r.arrayBuffer();}).then(async bytes=>{const data=new Uint8Array(bytes);if(data[0]===31&&data[1]===139){const stream=new Blob([data]).stream().pipeThrough(new DecompressionStream('gzip'));return JSON.parse(await new Response(stream).text());}return JSON.parse(new TextDecoder().decode(data));}).then(rows=>seedFunAnswers(pack,rows)).finally(()=>pending.delete(bankKey(pack))));
  return pending.get(bankKey(pack));
 }));
}
export function createFunCatalog(metadata,version){build=version;return metadata.map(meta=>Object.defineProperty({...meta},'answers',{enumerable:true,get(){readLocal(meta);if(!loaded.has(bankKey(meta)))throw Error('This answer bank is still loading.');return loaded.get(bankKey(meta));}}));}

export function createExtraCatalog(metadata,version){extraBuild=version;return metadata.map(meta=>Object.defineProperty({...meta},'answers',{enumerable:true,get(){readLocal(meta);if(!loaded.has(bankKey(meta)))throw Error('This answer bank is still loading.');return loaded.get(bankKey(meta));}}));}

export function createDiscoveryCatalog(metadata,version){discoveryBuild=version;return metadata.map(meta=>Object.defineProperty({...meta},'answers',{enumerable:true,get(){readLocal(meta);if(!loaded.has(bankKey(meta)))throw Error('This answer bank is still loading.');return loaded.get(bankKey(meta));}}));}
export function createGroupCatalog(metadata,version){groupBuild=version;return metadata.map(meta=>Object.defineProperty({...meta},'answers',{enumerable:true,get(){readLocal(meta);if(!loaded.has(bankKey(meta)))throw Error('This answer bank is still loading.');return loaded.get(bankKey(meta));}}));}
