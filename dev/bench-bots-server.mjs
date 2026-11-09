import http from 'node:http';
import {readFileSync,createReadStream,statSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
const root=resolve(fileURLToPath(new URL('../',import.meta.url))),port=Number(process.env.BENCH_DEMO_PORT??4186);
const output=await build({entryPoints:[fileURLToPath(new URL('./bench-bots.mjs',import.meta.url))],bundle:true,write:false,minify:true,format:'esm',platform:'browser',external:['./cloud.bundle.js*','./question-answers.bundle.js']});
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.ttf':'font/ttf','.json':'application/json'};
http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');res.setHeader('Cache-Control','no-store');if(['/','/__bench-bots'].includes(url.pathname)){let page=readFileSync(resolve(root,'index.html'),'utf8').replace(/<script defer src="entrance.bundle.js[^\"]*"><\/script>/,'').replace(/<script>if\(location.hostname[\s\S]*?<\/script>/,'');page=page.replace('</body>','<script type="module" src="/__bench-bots.mjs"></script></body>');res.setHeader('Content-Type','text/html');res.end(page);return;}if(url.pathname==='/__bench-bots.mjs'){res.setHeader('Content-Type','text/javascript');res.end(output.outputFiles[0].text);return;}let f;try{f=resolve(root,'.'+decodeURIComponent(url.pathname));if(!f.startsWith(root+sep)||!statSync(f).isFile())throw Error();res.setHeader('Content-Type',mime[extname(f)]??'application/octet-stream');createReadStream(f).pipe(res);}catch{res.writeHead(404).end();}}).listen(port,'127.0.0.1',()=>console.log('Beat the Bench full bot trial: http://localhost:'+port+'/__bench-bots'));
