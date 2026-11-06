// Local demonstration only: no Firebase rooms, accounts, ranks or profile writes.
import http from 'node:http';
import {readFileSync,createReadStream,statSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
const root=resolve(fileURLToPath(new URL('../',import.meta.url))),port=Number(process.env.OATH_DEMO_PORT??4180);
const result=await build({entryPoints:[fileURLToPath(new URL('./oath-bots.mjs',import.meta.url))],bundle:true,write:false,minify:true,format:'esm',platform:'browser',external:['./cloud.bundle.js*','./question-answers.bundle.js'],plugins:[{name:'project-imports',setup(b){b.onResolve({filter:/^\//},args=>args.kind==='entry-point'?undefined:{path:resolve(root,'.'+args.path)});}}]});
const bundle=result.outputFiles[0].text,mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.ttf':'font/ttf','.json':'application/json'};
http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');res.setHeader('Cache-Control','no-store');
 if(['/','/__oath-bots'].includes(url.pathname)){
  let page=readFileSync(resolve(root,'index.html'),'utf8').replace(/<script defer src="entrance.bundle.js[^\"]*"><\/script>/,'').replace(/<script>if\(location.hostname[\s\S]*?<\/script>/,'');page=page.replace('</body>','<script type="module" src="/__oath-bots.mjs"></script></body>');res.setHeader('Content-Type','text/html');res.end(page);return;
 }
 if(url.pathname==='/__oath-bots.mjs'){res.setHeader('Content-Type','text/javascript');res.end(bundle);return;}
 let file;try{file=resolve(root,'.'+decodeURIComponent(url.pathname));}catch{res.writeHead(400).end();return;}
 if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}
 try{if(!statSync(file).isFile())throw Error();res.setHeader('Content-Type',mime[extname(file)]??'application/octet-stream');createReadStream(file).pipe(res);}catch{res.writeHead(404).end();}
}).listen(port,'127.0.0.1',()=>console.log('Under Oath full bot trial: http://localhost:'+port+'/__oath-bots'));
