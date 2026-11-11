import http from 'node:http';
import {readFileSync,createReadStream,statSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
const root=resolve(fileURLToPath(new URL('../',import.meta.url))),port=Number(process.env.DEEP_DEMO_PORT??4201);
const bundle=()=>build({entryPoints:[fileURLToPath(new URL('./deep-bots.mjs',import.meta.url))],bundle:true,write:false,format:'esm',platform:'browser',external:['./cloud.bundle.js*']});
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.ttf':'font/ttf','.json':'application/json'};
http.createServer(async(req,res)=>{const url=new URL(req.url,'http://localhost');res.setHeader('Cache-Control','no-store');try{if(['/','/__deep-bots'].includes(url.pathname)){let page=readFileSync(resolve(root,'index.html'),'utf8').replace(/<script defer src="entrance.bundle.js[^\"]*"><\/script>/,'').replace(/<script>if\(location.hostname[\s\S]*?<\/script>/,'');page=page.replace('</body>','<script type="module" src="/__deep-bots.mjs"></script></body>');res.setHeader('Content-Type','text/html');res.end(page);return;}if(url.pathname==='/__deep-bots.mjs'){res.setHeader('Content-Type','text/javascript');res.end((await bundle()).outputFiles[0].text);return;}const f=resolve(root,'.'+decodeURIComponent(url.pathname));if(!f.startsWith(root+sep)||!statSync(f).isFile())throw Error();res.setHeader('Content-Type',mime[extname(f)]??'application/octet-stream');createReadStream(f).pipe(res);}catch(e){res.writeHead(404).end();}}).listen(port,'127.0.0.1',()=>console.log('Deep Contempt full bot expedition: http://localhost:'+port+'/__deep-bots'));
