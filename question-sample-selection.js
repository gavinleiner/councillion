import {random,hash,uniformQuestionDeck,QUESTION_SELECTION_BUILD} from './question-selection.js';
import {questionFormat} from './question-formats.js';

// Use the same uniform full-pool random draw as live play, with a frozen seed.
export function sampleQuestionPool(categories,{seed,count=100,build}={}){
 if(!seed||!build||count<1||count>categories.length)throw Error('A seed, pool build and valid sample size are required');
 if(new Set(categories.map(p=>p.id)).size!==categories.length)throw Error('Question IDs must be unique');
 const tally=(items,key)=>Object.fromEntries([...new Set(items.map(p=>p[key]))].sort().map(value=>[value,items.filter(p=>p[key]===value).length]));
 const byId=new Map(categories.map(p=>[p.id,p]));
 const questions=uniformQuestionDeck(categories,{rng:random(hash(seed))}).slice(0,count).map(id=>byId.get(id)).map(p=>({id:p.id,prompt:p.prompt,family:p.family,format:questionFormat(p),group:p.group,answerCount:p.answerCount,scope:p.scope??''}));
 return {version:`livepool-${build}-${QUESTION_SELECTION_BUILD}-${seed}`,selectionBuild:QUESTION_SELECTION_BUILD,seed,poolBuild:build,poolCount:categories.length,method:`Same selection system as live play: uniform random shuffle of every admitted question, without account or previous-game history; first ${count}.`,families:tally(questions,'family'),formats:tally(questions,'format'),questions};
}
