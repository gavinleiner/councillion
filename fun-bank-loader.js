// Each broad bank is fetched separately; home/library use metadata only.
const loaded=new Map(),pending=new Map();let build='',localReader;
export function registerFunDataReader(reader){localReader=reader;}
function readLocal(pack){if(localReader&&!loaded.has(pack.id))seedFunAnswers(pack,localReader(pack));}
export const funBuild=()=>build;
export const funAnswersReady=packs=>packs.every(p=>{if(p.funVersion)readLocal(p);return !p.funVersion||loaded.has(p.id);});
export function seedFunAnswers(pack,rows){
 if(!Array.isArray(rows)||rows.length!==pack.answerCount)throw Error('The question bank update is incomplete. Refresh and try again.');
 loaded.set(pack.id,rows.map(([label,points,aliases])=>({label,points,aliases})));
}
export async function loadFunAnswers(packs){
 for(const pack of packs)if(pack.funVersion)readLocal(pack);
 await Promise.all(packs.filter(p=>p.funVersion&&!loaded.has(p.id)).map(pack=>{
  if(!pending.has(pack.id))pending.set(pack.id,fetch('./question-banks/'+pack.answerFile).then(r=>{if(!r.ok)throw Error('The answer archive could not be loaded. Check your connection and retry.');return r.arrayBuffer();}).then(async bytes=>{const data=new Uint8Array(bytes);if(data[0]===31&&data[1]===139){const stream=new Blob([data]).stream().pipeThrough(new DecompressionStream('gzip'));return JSON.parse(await new Response(stream).text());}return JSON.parse(new TextDecoder().decode(data));}).then(rows=>seedFunAnswers(pack,rows)).catch(e=>{pending.delete(pack.id);throw e;}));
  return pending.get(pack.id);
 }));
}
export function createFunCatalog(metadata,version){build=version;return metadata.map(meta=>Object.defineProperty({...meta},'answers',{enumerable:true,get(){readLocal(meta);if(!loaded.has(meta.id))throw Error('This answer bank is still loading.');return loaded.get(meta.id);}}));}
