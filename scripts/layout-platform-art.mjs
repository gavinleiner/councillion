// Position the original AI PNGs inside the existing 80x40 platform coordinate
// system. Pixels/alpha are retained verbatim; only the SVG image placement moves.
import {readFile,writeFile} from 'node:fs/promises';
const folder=new URL('../assets/party-platforms/',import.meta.url),layout=JSON.parse(await readFile(new URL('layout.json',folder),'utf8'));
for(const [id,entry]of Object.entries(layout)){
 if(!/^(slate|marble|reef|obsidian|gilded)$/.test(id))throw Error('Unknown platform');
 const bytes=await readFile(new URL(id+'.png',folder)),[w,h]=entry.size;
 if(bytes.readUInt32BE(16)!==w||bytes.readUInt32BE(20)!==h)throw Error('Update art bounds for '+id);
 const [left,top,right,bottom]=entry.alphaBounds,bw=right-left,bh=bottom-top;
 if(left<0||top<0||right>w||bottom>h||bw<=0||bh<=0)throw Error('Invalid art bounds for '+id);
 const scale=Math.min(74/bw,30/bh),x=(80-bw*scale)/2-left*scale,y=36-bottom*scale;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 40"><image x="${x.toFixed(5)}" y="${y.toFixed(5)}" width="${(w*scale).toFixed(5)}" height="${(h*scale).toFixed(5)}" preserveAspectRatio="none" style="image-rendering:pixelated" href="data:image/png;base64,${bytes.toString('base64')}"/></svg>`,file=new URL('../assets/party-stone-'+id+'.svg',import.meta.url);
 if(process.argv.includes('--check')){if(await readFile(file,'utf8')!==svg)throw Error('Regenerate platform layout: '+id);}else await writeFile(file,svg);
}
