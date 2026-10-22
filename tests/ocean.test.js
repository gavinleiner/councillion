import test from 'node:test';
import assert from 'node:assert/strict';
import {Ocean} from '../ocean.js';
function browserHarness(){
 const frames=new Map(),listeners={};let id=0,time=0,paints=0;
 const context=()=>({imageSmoothingEnabled:false,createLinearGradient:()=>({addColorStop(){}}),fillRect(){},save(){},restore(){},beginPath(){},rect(){},clip(){},translate(){},scale(){},moveTo(){},lineTo(){},fill(){},drawImage(){paints++;}});
 const canvas=()=>({width:0,height:0,getContext:()=>context()});
 Object.assign(globalThis,{innerWidth:1366,innerHeight:768,location:{hostname:'example.test',search:''},document:{hidden:false,createElement:()=>canvas(),addEventListener:(name,fn)=>{listeners[name]=fn;}},Image:class{complete=false;naturalWidth=0;},addEventListener:(name,fn)=>{listeners[name]=fn;},requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:key=>frames.delete(key)});
 return {canvas:canvas(),frames,listeners,tick(n=1){for(let i=0;i<n;i++){time+=1000/60;const pending=[...frames.values()];frames.clear();for(const fn of pending)fn(time);}},get paints(){return paints;}};
}
test('stationary scenery is cached and the home does not request deeper textures',()=>{const b=browserHarness(),ocean=new Ocean(b.canvas);b.tick(180);assert.deepEqual(Object.keys(ocean.images),['sky']);assert.equal(ocean.cacheRebuilds,1);assert.ok(b.paints>=85&&b.paints<=92,'ambient painting stays near 30 fps at 60 display ticks');ocean.set('dive',1000);assert.ok(ocean.images.shallow&&ocean.images.mid);assert.equal(ocean.images.trench,undefined);ocean.set('dive',4500);assert.ok(ocean.images.trench&&ocean.images.hadal);});
test('hidden tabs cancel animation and resume on visibility',()=>{const b=browserHarness();new Ocean(b.canvas);b.tick(4);document.hidden=true;b.listeners.visibilitychange();assert.equal(b.frames.size,0);const before=b.paints;b.tick(20);assert.equal(b.paints,before);document.hidden=false;b.listeners.visibilitychange();assert.equal(b.frames.size,1);b.tick(4);assert.ok(b.paints>before);});
test('reduced motion renders a changed scene once and then stops scheduling',()=>{const b=browserHarness(),ocean=new Ocean(b.canvas);ocean.reduced=true;b.tick(10);assert.equal(b.frames.size,0);const before=b.paints;ocean.set('dive',3500);b.tick(10);assert.ok(b.paints>before);assert.equal(ocean.displayedDepth,3500);assert.equal(b.frames.size,0);});
