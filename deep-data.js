// World distances are logical pixels; the renderer can scale independently.
export const DEEP_BUILD='20261111-deep-contempt-v50';
export const DEEP_EMAILS=Object.freeze(['gavin@theleiners.com','gavin.leiner@student.nhcs.net']);
export const canPlayDeep=(identity,now=Date.now())=>!!(identity?.uid&&identity.expires>now/1000&&DEEP_EMAILS.includes(String(identity.email??'').toLowerCase()));
export const isLocalDeepDemo=location=>['localhost','127.0.0.1'].includes(location?.hostname)&&location?.pathname==='/__deep-bots';
export const DEEP_WORLD=Object.freeze({roomW:768,roomH:480,cols:3,rows:2,width:2304,height:960,radius:14,speed:112});
export const DEEP_ROOMS=Object.freeze([
 {id:0,name:'THE AIRLOCK',label:'Safe water · bank evidence here',col:0,row:0,art:'airlock',tone:'#56c9c2'},
 {id:1,name:'DROWNED ARCHIVES',label:'The Bailiff hears your footsteps',col:1,row:0,art:'archive',tone:'#83b8d9'},
 {id:2,name:'HOLDING CELLS',label:'Restore the first court seal',col:2,row:0,art:'cells',tone:'#918bd1'},
 {id:3,name:'THE FLOOD GALLERY',label:'Watch the dark between the pillars',col:0,row:1,art:'archive',tone:'#7cbcb0'},
 {id:4,name:'THE EVIDENCE VAULT',label:'Restore the second seal · two-person exhibits',col:1,row:1,art:'vault',tone:'#e8bc77'},
 {id:5,name:'THE HIGH COURT',label:'Take the gavel. Wake the Judge.',col:2,row:1,art:'court',tone:'#c7979d'}
]);
export const DEEP_ART=Object.freeze(Object.fromEntries(['hub','airlock','archive','cells','vault','court','enemies'].map(n=>[n,`assets/deep/${n}-v50.${n==='enemies'?'png':'webp'}`])));
export const DEEP_COLORS=['#eacb82','#7ce2d2','#bda2ec','#f09c9b','#9bc6ed','#c4d991'];
export const DEEP_GEAR=Object.freeze({lamp:{name:'RELIABLE LAMP',description:'A wider beam. Keeps the Clerk in sight.'},tank:{name:'RESERVE TANK',description:'Forty extra seconds between air refills.'},boots:{name:'SOFT SOLES',description:'Quieter footsteps. The Bailiff hears less.'}});
export const DEEP_CONTROLS='WASD / arrows · move     E · interact / hold to rescue     SHIFT · sprint     F · lamp     Q · drop     SPACE · ping     M · chart';
export function roomAt(x,y){return Math.max(0,Math.min(2,Math.floor(x/768)))+3*Math.max(0,Math.min(1,Math.floor(y/480)));}
export function roomPoint(room,x,y){return {x:(room%3)*768+x,y:Math.floor(room/3)*480+y};}
export const DEEP_DOCK=Object.freeze({x:220,y:210,radius:110});
