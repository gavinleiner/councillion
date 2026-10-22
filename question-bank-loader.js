import {funBuild} from './fun-bank-loader.js';
// The large answer table is fetched only when a dive or party needs it.
let pool, pending, version;
const cache=[];
export function catalogAnswersReady(){return !!pool;}
export async function loadCatalogAnswers(){
 if(pool)return;
 const asset='./question-answers.bundle.js?v='+version;
 return pending??=import(asset).then(module=>{if(module.CATALOG_ANSWER_BUILD!==version)throw Error('Question update is still arriving. Reload in a moment.');pool=module.ANSWER_ROWS;},error=>{pending=null;throw Error('Could not load the answer banks. Check your connection and try again.',{cause:error});});
}
export function catalogBuild(){return version+'-'+funBuild()+'-match4';}
export function createCatalog(rows,build){
 version=build;
 return rows.map(([meta,ids])=>{let answers;return Object.defineProperty({...meta,catalogVersion:3},'answers',{enumerable:true,get(){
  if(!pool)throw Error('The answer banks are still loading.');
  return answers??=ids.map(id=>cache[id]??=({label:pool[id][0],points:pool[id][1],aliases:pool[id][2]}));
 }});});
}
