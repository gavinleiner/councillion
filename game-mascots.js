// Small-grid original mascots share Puffer's outline, wig and eye palette.
// These identify games; player characters and customization are independent.
export const GAME_MASCOTS=Object.freeze({
 deep:{src:'assets/game-mascots/deep-diver-v50.svg',name:'Deep Contempt brass-helmet diver'},
 objection:{src:'assets/game-mascots/objection-dealer-v47.svg',name:'Objection card dealer'},
 chess:{sprite:true,name:"Counsel Chess ivory king"},
 trial:{src:'assets/game-mascots/trial-puffer-v41.svg',name:'Trial by Puffer ghost magistrate'},
 bench:{src:'assets/game-mascots/bench-judge-v40.svg',name:'Beat the Bench judge'},
 testimony:{src:'assets/game-mascots/testimony-artist-v40.svg',name:'Ink the courtroom artist'},
 party:{src:'assets/puffer.svg',name:'Puffer judge'},
 clash:{src:'assets/game-mascots/clash-crab-v1.svg',name:'Clash crab'},
 figure:{src:'assets/game-mascots/figure-nautilus-v1.svg',name:'Figure nautilus'},
 docket:{src:'assets/game-mascots/docket-turtle-v1.svg',name:'Docket turtle'},
 oath:{src:'assets/game-mascots/oath-cuttlefish-v1.svg',name:'Oath cuttlefish'}
});
export function gameLogoMarkup(mode,{decorative=false}={}){
 const mascot=GAME_MASCOTS[mode];
 if(mascot?.sprite)return `<span class="game-mascot game-mascot-${mode}" role="img" ${decorative?'aria-hidden="true"':`aria-label="${mascot.name}"`}></span>`;
 return mascot?`<img class="game-mascot game-mascot-${mode}" src="${mascot.src}" alt="${decorative?'':mascot.name}" ${decorative?'aria-hidden="true"':''} width="96" height="96" draggable="false">`:'';
}
