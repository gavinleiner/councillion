// Permanent cosmetics use distinct immutable receipts. Existing grants remain
// unlocked when the art or milestone changes; stones never affect game rules.
export const STONES=[
 {id:'court',name:'COURT STONE',description:'The original seabed stone.',count:0,source:'none',criteria:{}},
 {id:'slate',name:'DRIFTWOOD PERCH',description:'Finish 15 rated matches with 3+ accepted answers each. Any placement; 1v1 counts.',count:15,source:'puffer',criteria:{answers:3}},
 {id:'marble',name:'SHELL PERCH',description:'Win 12 rated matches with 3+ accepted answers each. 1v1 counts.',count:12,source:'puffer',criteria:{win:true,answers:3}},
 {id:'reef',name:'CORAL SHELF',description:'Finish 8 different Daily Dives with 250+ points and at least 5 valid answers each.',count:8,source:'daily',criteria:{points:250,answers:5}},
 {id:'obsidian',name:'COURTHOUSE REMNANT',description:'Finish 25 rated matches with 6+ accepted answers each. Any placement; 1v1 counts.',count:25,source:'puffer',criteria:{answers:6}},
 {id:'gilded',name:'WRECK DECK',description:'Win 20 rated matches with 5+ accepted answers each. 1v1 counts.',count:20,source:'puffer',criteria:{win:true,answers:5}}
];
for(const stone of STONES)stone.test=r=>(stone.source==='none'||(stone.source==='puffer'?r.rated===true&&r.counted===true&&r.forfeit===false:r.mode==='daily'))&&Object.entries(stone.criteria).every(([key,value])=>typeof value==='boolean'?r[key]===value:Number.isFinite(r[key])&&r[key]>=value);
export const STONE_IDS=new Set(STONES.map(s=>s.id));
export function stoneProofs(profile={},id){const stone=STONES.find(s=>s.id===id);if(!stone||!stone.count)return [];const raw=stone.source==='puffer'?profile.partyRaw:profile.soloRaw;return Object.entries(raw??{}).filter(([key,r])=>r?.version===1&&r.game===key&&stone.test(r)).sort(([a],[b])=>a.localeCompare(b)).map(([id])=>id);}
export function stoneProgress(profile={},id){const stone=STONES.find(s=>s.id===id)??STONES[0],count=stoneProofs(profile,id).length,unlocked=!stone.count||!!profile.unlocks?.[id]||count>=stone.count;return {...stone,progress:Math.min(stone.count,count),unlocked};}
export function equippedStone(value={},unlocks={}){return STONE_IDS.has(value.stone)&&(value.stone==='court'||unlocks?.[value.stone])?value.stone:'court';}
export const stoneAsset=id=>'assets/'+(!STONE_IDS.has(id)||id==='court'?'party-platform-0.svg':'party-stone-'+id+'.svg?v=20261023-platforms-v3');
