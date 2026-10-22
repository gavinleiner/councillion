export const ENDLESS_VERSION=1;
const SECRET=[0,1,2,3,0];
export function shuffleCopy(items,rng=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function newEndless(bank,rng=Math.random){return issueQuestion({version:ENDLESS_VERSION,deck:[],keyTail:[],choiceTail:[],streak:0,best:0,wins:0,answered:0,correct:0,cycle:0,phase:'question',lastId:null},bank,rng);}
export function issueQuestion(state,bank,rng=Math.random){
 if(!state.deck.length){state.deck=shuffleCopy(bank.map(q=>q.id),rng);state.cycle++;if(state.deck[0]===state.lastId&&state.deck.length>1)[state.deck[0],state.deck[1]]=[state.deck[1],state.deck[0]];}
 const id=state.deck.shift(),q=bank.find(q=>q.id===id);if(!q)throw Error('Unknown case question');
 const options=shuffleCopy([q.answer,...q.distractors],rng);let answer=options.indexOf(q.answer);
 // The legitimate answer key can never contain the five-choice Easter egg.
 if(state.keyTail.length===4&&state.keyTail.every((v,i)=>v===SECRET[i])&&answer===SECRET[4]){[options[0],options[1]]=[options[1],options[0]];answer=1;}
 state.keyTail=[...state.keyTail,answer].slice(-4);state.current={id,options,answer};state.lastId=id;state.selected=null;state.feedback=null;state.phase='question';return state;
}
export function answerEndless(state,index){
 if(state.phase!=='question'||!Number.isInteger(index)||index<0||index>3)return state;
 const correct=index===state.current.answer;state.answered++;if(correct)state.correct++;
 state.streak=correct?state.streak+1:0;state.best=Math.max(state.best,state.streak);state.choiceTail=[...state.choiceTail,index].slice(-5);
 const shortcut=state.choiceTail.length===5&&state.choiceTail.every((v,i)=>v===SECRET[i]);
 state.selected=index;state.feedback={correct,shortcut};
 if(shortcut||state.streak===5){state.phase='won';state.wins++;}else state.phase='feedback';
 return state;
}
export function continueEndless(state,bank,rng=Math.random){if(state.phase==='question')return state;if(state.phase==='won'){state.streak=0;state.choiceTail=[];}return issueQuestion(state,bank,rng);}
export function restoreEndless(raw,bank,rng=Math.random){
 if(!raw||raw.version!==ENDLESS_VERSION||!Array.isArray(raw.deck)||!Array.isArray(raw.current?.options)||!bank.some(q=>q.id===raw.current.id)||raw.deck.some(id=>!bank.some(q=>q.id===id)))return newEndless(bank,rng);
 const q=bank.find(q=>q.id===raw.current.id);
 if(raw.current.options.length!==4||new Set(raw.current.options).size!==4||raw.current.options[raw.current.answer]!==q.answer||raw.current.options.some(option=>![q.answer,...q.distractors].includes(option)))return newEndless(bank,rng);
 return raw;
}
