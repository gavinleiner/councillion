import {mountDailySupport} from './daily-support.js';
// The daily support visit happens before timers, room connections or auth UI.
const VERSION='20261111-deep-contempt-v50';
document.documentElement.removeAttribute('data-entrance');
document.querySelector('#entrance')?.remove();
function startGame(){
const script=document.createElement('script');
script.src='game.bundle.js?v='+VERSION;
script.onerror=()=>{
 const app=document.querySelector('#app');if(!app)return;
 app.innerHTML='<section class="question-loading"><h1>THE GAME COULD NOT LOAD.</h1><p>Check your connection, then try again.</p><button class="pixel-button" id="retry-game-load">TRY AGAIN</button></section>';
 document.querySelector('#retry-game-load').onclick=()=>location.reload();
};
document.head.append(script);
}
mountDailySupport({onContinue:startGame});
