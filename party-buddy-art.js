// AI-remodeled sprites, animated in separate clipped regions so the approved
// shapes and pixel artwork remain intact. Each copy reuses the same cached PNG.
let serial=0;
export function detailedBuddySprite(kind){
 if(!['schooler','squid','angler'].includes(kind))return '';
 const id='buddy-ai-'+(++serial),href=`assets/party-buddies/${kind}-ai-v1.png?v=20261022-ai1`,image=attrs=>`<image href="${href}" width="64" height="52" ${attrs??''}/>`;let content;
 if(kind==='schooler')content=`<g transform="translate(4 0)">${image()}<g class="ai-buddy-lid"><path fill="#79dfe9" d="M20.5 19.5h8v9h-8z"/><path fill="#142b3f" d="M22 24.5h5v.75h-5z"/></g></g>`;
 else if(kind==='squid')content=`<defs><clipPath id="${id}-body"><path d="M0 0h64v31H0z"/></clipPath>${[[0,20],[20,12],[32,12],[44,20]].map(([x,w],i)=>`<clipPath id="${id}-leg${i}"><path d="M${x} 31h${w}v21H${x}z"/></clipPath>`).join('')}</defs>${image(`clip-path="url(#${id}-body)"`)}${[0,1,2,3].map(i=>`<g class="ai-squid-leg leg-${i}" style="--leg-pivot:${[25,40,60,78][i]}% 60%">${image(`clip-path="url(#${id}-leg${i})"`)}</g>`).join('')}<g class="ai-buddy-lid"><path fill="#f86d72" d="M22 17h7v7h-7zM35 17h7v7h-7z"/><path fill="#142b3f" d="M23 20.5h5v.75h-5zM36 20.5h5v.75h-5z"/></g>`;
 else{const lure='M30 0H64V24H49V16H30z';content=`<defs><clipPath id="${id}-lure"><path d="${lure}"/></clipPath><mask id="${id}-body" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="52"><path fill="white" d="M0 0h64v52H0z"/><path fill="black" d="${lure}"/></mask></defs>${image(`mask="url(#${id}-body)"`)}<g class="ai-angler-lure">${image(`clip-path="url(#${id}-lure)"`)}<circle class="ai-lure-light" cx="56" cy="20" r="3" fill="#fff7ca"/></g><g class="ai-buddy-lid"><path fill="#9678d5" d="M33.5 21.5h8v7.5h-8z"/><path fill="#142b3f" d="M35 25h5v.75h-5z"/></g>`;}
 const phase=-((Date.now()/1000+{schooler:0,squid:3,angler:6}[kind])%11);
 return `<svg class="tier-sprite party-buddy party-ai-buddy ai-${kind}" viewBox="0 0 64 52" aria-hidden="true" style="--blink-phase:${phase}s" shape-rendering="crispEdges">${content}</svg>`;
}
