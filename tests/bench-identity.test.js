import test from 'node:test';
import assert from 'node:assert/strict';
import {BenchView} from '../bench-view.js';
function fixture(preview=false){const v=Object.create(BenchView.prototype);let closed=0,rendered=0;Object.assign(v,{identity:()=>({id:'same',uid:'same-firebase'}),preferences:{},session:{googleId:'same',uid:'same-firebase',preview,close(){closed++;}},renderEntry(){rendered++;}});return {v,closed:()=>closed,rendered:()=>rendered};}
test('credential refresh preserves a crew and updates the stored player preferences',()=>{const f=fixture();f.v.identityChanged({id:'same',uid:'same-firebase'},{name:'Counsel'});assert.equal(f.closed(),0);assert.equal(f.rendered(),0);assert.equal(f.v.preferences.name,'Counsel');});
test('sign-out and account switches close the old private crew session',()=>{for(const id of [null,{id:'another',uid:'another-firebase'},{id:'same',uid:'another-firebase'}]){const f=fixture();f.v.identityChanged(id);assert.equal(f.closed(),1);assert.equal(f.rendered(),1);}});
test('local bot practice survives identity changes without using a real account',()=>{const f=fixture(true);f.v.identityChanged(null);assert.equal(f.closed(),0);assert.equal(f.rendered(),0);});
test('an unchanged guest identity does not discard an open crew customization dialog',()=>{const f=fixture();f.v.session=null;f.v.entryGoogleId=null;f.v.identityChanged(null,{name:'Saved counsel'});assert.equal(f.rendered(),0);});
