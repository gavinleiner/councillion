import test from 'node:test';
import assert from 'node:assert/strict';
import {depthDistance,cameraAtDepth,depthScreenY,sceneryBands,biomeAt} from '../depth-world.js';
test('common scores reach later scenes while the 10m-per-point scoring scale is preserved',()=>{assert.equal(biomeAt(30*10).name,'THE TWILIGHT');assert.equal(biomeAt(70*10).name,'MIDNIGHT RUINS');assert.equal(biomeAt(150*10).name,'THE ABYSS');assert.equal(biomeAt(300*10).name,'HADAL DEPTHS');});
test('descent moves landmarks past the fixed camera anchor in the correct direction',()=>{
 for(const height of [600,768,900]){let previous=-1;for(let d=0;d<=7000;d+=10){const distance=depthDistance(d,height);assert.ok(distance>previous);previous=distance;assert.ok(Math.abs(depthScreenY(d,cameraAtDepth(d,height),height)-height*.4)<1e-8);}
 const before=depthScreenY(650,cameraAtDepth(100,height),height),after=depthScreenY(650,cameraAtDepth(350,height),height);assert.ok(before-after>height*.4);}
});
test('scenery occupies contiguous world positions rather than following the camera',()=>{const bands=sceneryBands(768);assert.deepEqual(bands.map(b=>b.key),['shallow','mid','trench','hadal']);for(let i=1;i<bands.length;i++)assert.ok(bands[i].top<bands[i-1].bottom);assert.ok(bands[3].bottom>cameraAtDepth(7000,768)+768);});

test('fall accelerates, settles without overshoot, and travels at least a screen for 20 points',async()=>{
 const {fallEase,fallPose,fallDuration}=await import('../depth-world.js');
 assert.equal(fallEase(0),0);assert.equal(fallEase(1),1);
 assert.ok(fallEase(.2)-fallEase(.1)>fallEase(.1)-fallEase(0));
 assert.ok(fallEase(1)-fallEase(.9)<fallEase(.6)-fallEase(.5));
 assert.equal(fallPose(0),0);assert.ok(Math.abs(fallPose(1))<1e-10);assert.equal(fallPose(.5),1);
 assert.ok(depthDistance(200,768)>=768);assert.ok(fallDuration(400)>1800&&fallDuration(100000)<=3800);
});
