// Permanent cosmetics require distinct immutable game receipts. No rank or role
// grants a stone, and equipped styles never alter collision or game rules.
export const STONES=[
 {id:'court',name:'COURT STONE',description:'The original seabed stone.',count:0,source:'none',test:()=>true},
 {id:'slate',name:'QUARRIED SLATE',description:'25 rated first-place finishes in courts of 4+ players, with 10+ accepted answers in each.',count:25,source:'puffer',criteria:{playersCount:4,answers:10},test:r=>r.rated&&r.counted&&r.win&&!r.forfeit&&r.playersCount>=4&&r.answers>=10},
 {id:'marble',name:'JURY MARBLE',description:'5 flawless rated wins in courts of 4+ players. Each needs 12+ answers and no hearts lost.',count:5,source:'puffer',criteria:{playersCount:4,answers:12,heartsLost:0},test:r=>r.rated&&r.counted&&r.win&&!r.forfeit&&r.playersCount>=4&&r.answers>=12&&r.heartsLost===0},
 {id:'reef',name:'REEFSTONE',description:'10 different Daily Dives with seven valid answers and at least 550 points each.',count:10,source:'daily',criteria:{points:550,answers:7},test:r=>r.mode==='daily'&&r.points>=550&&r.answers===7&&r.perfect===true},
 {id:'obsidian',name:'OBSIDIAN BENCH',description:'5 rated six-player wins with 25+ answers and 5+ Deep Cuts in each.',count:5,source:'puffer',criteria:{playersCount:6,answers:25,rare:5},test:r=>r.rated&&r.counted&&r.win&&!r.forfeit&&r.playersCount>=6&&r.answers>=25&&r.rare>=5},
 {id:'gilded',name:'GILDED COURT',description:'Finish a Daily Dive with all seven Krillions: 700 points.',count:1,source:'daily',criteria:{points:700,answers:7,krillions:7},test:r=>r.mode==='daily'&&r.points===700&&r.answers===7&&r.krillions===7&&r.perfect===true}
];
export const STONE_IDS=new Set(STONES.map(s=>s.id));
export function stoneProofs(profile={},id){const stone=STONES.find(s=>s.id===id);if(!stone||!stone.count)return [];const raw=stone.source==='puffer'?profile.partyRaw:profile.soloRaw;return Object.entries(raw??{}).filter(([key,r])=>r?.version===1&&r.game===key&&stone.test(r)).sort(([a],[b])=>a.localeCompare(b)).map(([id])=>id);}
export function stoneProgress(profile={},id){const stone=STONES.find(s=>s.id===id)??STONES[0],count=stoneProofs(profile,id).length,unlocked=!stone.count||!!profile.unlocks?.[id]||count>=stone.count;return {...stone,progress:Math.min(stone.count,count),unlocked};}
export function equippedStone(value={},unlocks={}){return STONE_IDS.has(value.stone)&&(value.stone==='court'||unlocks?.[value.stone])?value.stone:'court';}
export const stoneAsset=id=>'assets/'+(!STONE_IDS.has(id)||id==='court'?'party-platform-0.svg':'party-stone-'+id+'.svg');
