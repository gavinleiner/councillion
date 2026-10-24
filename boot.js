// Councillion is public. Google sign-in is still enforced by Puffer and its server.
const VERSION='20261024-random-v1';
document.documentElement.removeAttribute('data-entrance');
document.querySelector('#entrance')?.remove();
const script=document.createElement('script');
script.src='game.bundle.js?v='+VERSION;
script.onerror=()=>{
 const app=document.querySelector('#app');if(!app)return;
 app.innerHTML='<section class="question-loading"><h1>THE GAME COULD NOT LOAD.</h1><p>Check your connection, then try again.</p><button class="pixel-button" id="retry-game-load">TRY AGAIN</button></section>';
 document.querySelector('#retry-game-load').onclick=()=>location.reload();
};
document.head.append(script);
