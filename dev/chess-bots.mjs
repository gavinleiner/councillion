import {ChessView} from '../chess-view.js';
document.body.dataset.screen='chess';
const view=new ChessView(document.querySelector('#app'),{preferences:{name:'Counsel',buddy:'krill'}});
window.chessDemo={view,get session(){return view.session;},get state(){return view.current;}};
if(new URLSearchParams(location.search).get('format')==='doubles')view.settings.format='doubles';
view.practice(location.pathname==='/__chess-bots');
