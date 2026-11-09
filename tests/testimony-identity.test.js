import test from 'node:test';
import assert from 'node:assert/strict';
import {TestimonyView} from '../testimony-view.js';
function view(){const v=Object.create(TestimonyView.prototype);let closed=0,rendered=0;Object.assign(v,{identity:()=>({id:'same',uid:'firebase-same'}),preferences:{},session:{googleId:'same',uid:'firebase-same',close(){closed++;}},renderEntry(){rendered++;}});return {v,closed:()=>closed,rendered:()=>rendered};}
test('Google credential refresh preserves an active Broken Testimony room',()=>{const f=view();f.v.identityChanged({id:'same',uid:'firebase-same'},{name:'Saved Counsel',buddy:'squid'});assert.equal(f.closed(),0);assert.equal(f.rendered(),0);assert.equal(f.v.preferences.name,'Saved Counsel');assert.equal(f.v.localKey,'councillion:testimony:same');});
test('switching accounts or signing out closes the previous private studio session',()=>{for(const identity of [null,{id:'different',uid:'different-firebase'},{id:'same',uid:'different-firebase'}]){const f=view();f.v.identityChanged(identity);assert.equal(f.closed(),1);assert.equal(f.rendered(),1);assert.equal(f.v.session,null);}});
test('local scripted practice survives sign-in changes without impersonating a real account',()=>{const f=view();f.v.session.preview=true;f.v.identityChanged(null);assert.equal(f.closed(),0);assert.equal(f.rendered(),0);assert.ok(f.v.session.preview);});
