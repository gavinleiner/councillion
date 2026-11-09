// Replays contain vectors rather than large rendered screenshots. Evict the
// oldest files when storage is tight; never claim a failed write was saved.
export function saveTestimonyReplay(storage,key,replay){
 let previous=[];try{const value=JSON.parse(storage.getItem(key));if(Array.isArray(value))previous=value;}catch{}
 const files=[replay,...previous.filter(f=>f?.id!==replay.id)].slice(0,3);
 while(files.length){try{storage.setItem(key,JSON.stringify(files));return {saved:true,count:files.length};}catch{files.pop();}}
 return {saved:false,count:previous.length};
}
