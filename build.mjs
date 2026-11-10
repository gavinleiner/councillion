import {mkdir,copyFile,chmod} from 'node:fs/promises';
import {build,context} from 'esbuild';
await mkdir('assets/chess/stockfish',{recursive:true});for(const f of ['stockfish-19-lite-single.js','stockfish-19-lite-single.wasm'])await copyFile('node_modules/stockfish/bin/'+f,'assets/chess/stockfish/'+f);await copyFile('node_modules/stockfish/Copying.txt','assets/chess/stockfish/COPYING.txt');await chmod('assets/chess/stockfish/stockfish-19-lite-single.wasm',0o644);
const targets=[{entryPoints:['chess-bot-worker.js'],bundle:true,format:'iife',minify:true,outfile:'chess-bot.bundle.js'},{entryPoints:['boot.js'],bundle:true,format:'iife',minify:true,external:['./cloud.bundle.js*'],outfile:'entrance.bundle.js'},{entryPoints:['app.js'],bundle:true,format:'iife',minify:true,external:['./cloud.bundle.js*','./question-answers.bundle.js'],outfile:'game.bundle.js'},{entryPoints:['cloud.js'],bundle:true,format:'esm',minify:true,outfile:'cloud.bundle.js'},{entryPoints:['question-answers.js'],bundle:true,format:'esm',minify:true,outfile:'question-answers.bundle.js'}];
if(process.argv.includes('--watch')){
 const contexts=await Promise.all(targets.map(options=>context(options)));await Promise.all(contexts.map(c=>c.watch()));console.log('Watching game and party cloud client.');
 const stop=async()=>{await Promise.all(contexts.map(c=>c.dispose()));process.exit();};process.on('SIGINT',stop);process.on('SIGTERM',stop);
}else await Promise.all(targets.map(options=>build(options)));
