import {chooseChessMove} from './chess-bot.js';
self.onmessage=e=>{try{self.postMessage({id:e.data.id,move:chooseChessMove(e.data.fen,e.data.options)});}catch(error){self.postMessage({id:e.data.id,error:error.message});}};
