// Small-grid original mascots share Puffer's outline, wig and eye palette.
// These identify games; player characters and customization are independent.
export const GAME_MASCOTS=Object.freeze({
 party:{src:'assets/puffer.svg',name:'Puffer judge'},
 clash:{src:'assets/game-mascots/clash-crab-v1.svg',name:'Clash crab'},
 figure:{src:'assets/game-mascots/figure-nautilus-v1.svg',name:'Figure nautilus'},
 docket:{src:'assets/game-mascots/docket-turtle-v1.svg',name:'Docket turtle'},
 oath:{src:'assets/game-mascots/oath-cuttlefish-v1.svg',name:'Oath cuttlefish'}
});
export function gameLogoMarkup(mode,{decorative=false}={}){
 const mascot=GAME_MASCOTS[mode];
 return mascot?`<img class="game-mascot game-mascot-${mode}" src="${mascot.src}" alt="${decorative?'':mascot.name}" ${decorative?'aria-hidden="true"':''} width="96" height="96" draggable="false">`:'';
}
