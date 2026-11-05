import {figureHub} from './court-games-figure.js';
import {feudMenu} from './court-games-feud-menu.js';
const captions={clash:['Two counsel step up. First to buzz gets the first answer.','Win the face-off, then choose to play or pass.','Three strikes give the other bench one answer to steal.'],figure:['Everyone sees the same question. Make your best estimate.','Seal your number. Other guesses stay hidden.','Closer estimates take you deeper. The deepest counsel wins.']};
export function courtHub(mode,p={},signed=false,rules=''){return mode==='clash'?feudMenu(p,signed,rules):figureHub(p,signed,rules);}
export function bindHubPreview(root,mode){
 const stage=root.querySelector('.cg-mode-preview');for(const button of root.querySelectorAll('[data-hub-demo]'))button.onclick=()=>{stage.dataset.demo=button.dataset.hubDemo;root.querySelectorAll('[data-hub-demo]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));root.querySelector('.cg-preview-caption').textContent=captions[mode][Number(button.dataset.hubDemo)];};
}

