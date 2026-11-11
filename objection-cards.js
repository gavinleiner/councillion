import {obLabel,OB_COLOR_NAMES,OB_SYMBOLS} from './objection-engine.js';
export const obEscape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const obMark=c=>({skip:'⊘',reverse:'↶',draw2:'+2',wild:'⚖',wild4:'+4'}[c.value]??c.value);
export function obCard(c,{button=false,playable=false,small=false}={}){
 if(!c)return '<span class="ob-card ob-card-back" aria-hidden="true"></span>';
 const tag=button?'button':'span',attrs=button?'type="button" data-ob-card="'+obEscape(c.id)+'" aria-label="'+obEscape(obLabel(c))+'" '+(!playable?'disabled':''):'aria-label="'+obEscape(obLabel(c))+'" role="img"';
 return `<${tag} ${attrs} class="ob-card ob-card-${c.color} ${small?'ob-card-small':''} ${playable?'ob-playable':''}" data-card-key="${obEscape(c.id)}"><span class="ob-card-corner">${obMark(c)}<i>${OB_SYMBOLS[c.color]}</i></span><span class="ob-card-medallion"><b>${obMark(c)}</b>${c.color==='wild'?'<i class="ob-wild-colors"><em></em><em></em><em></em><em></em></i>':'<i>'+OB_SYMBOLS[c.color]+'</i>'}</span><span class="ob-card-corner ob-card-bottom">${obMark(c)}<i>${OB_SYMBOLS[c.color]}</i></span><small>${c.color==='wild'?'WILD':OB_COLOR_NAMES[c.color]}</small></${tag}>`;
}
export const obDealer=(pose='idle')=>`<span class="ob-dealer" data-pose="${pose}" role="img" aria-label="Puffer card dealer"></span>`;
