import test from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {honorForClaims,canAdmin,OWNER_EMAIL,VICE_PRESIDENT_EMAIL} from '../account-honors.js';
import {googleIdentity} from '../account-identity.js';
import {bannerMarkup} from '../party-badges.js';
import {PartyView} from '../party-view.js';
import {newParty} from '../engine.js';
import {activeOwnerEffect,mountOwnerConsole} from '../party-admin.js';
test('only exact verified Google accounts receive their assigned entitlement',()=>{
 assert.deepEqual(honorForClaims({email:OWNER_EMAIL,email_verified:true},'google.com'),{kind:'owner',title:'super-admin'});
 assert.deepEqual(honorForClaims({email:VICE_PRESIDENT_EMAIL,email_verified:true},'google.com'),{kind:'vice-president',title:'vice-president'});
 for(const email of ['fake.'+OWNER_EMAIL,OWNER_EMAIL+'.invalid',VICE_PRESIDENT_EMAIL+'.invalid'])assert.equal(honorForClaims({email,email_verified:true},'google.com'),null);
 assert.equal(honorForClaims({email:OWNER_EMAIL,email_verified:false},'google.com'),null);
 assert.equal(honorForClaims({email:OWNER_EMAIL,email_verified:true},'password'),null);
});
test('Firebase signed claims determine admin access, never editable provider profile fields',async()=>{
 const mock=(claims,email=OWNER_EMAIL)=>({uid:'firebase-id',email,displayName:'Owner',providerData:[{providerId:'google.com',uid:'google-id',email}],async getIdTokenResult(){return {claims,signInProvider:'google.com',expirationTime:new Date(Date.now()+3600000).toISOString()};}});
 const owner=await googleIdentity(mock({email:OWNER_EMAIL,email_verified:true}));assert.equal(canAdmin(owner),true);
 const vp=await googleIdentity(mock({email:VICE_PRESIDENT_EMAIL,email_verified:true},VICE_PRESIDENT_EMAIL));assert.equal(vp.role,'player');assert.equal(canAdmin(vp),false);
 const spoof=await googleIdentity(mock({email:'other@example.invalid',email_verified:true}));assert.equal(canAdmin(spoof),false);
 assert.equal(canAdmin({...owner,expires:1}),false);
});
test('assigned honors use one text banner while keeping the normal earned rank image',()=>{
 const window=new Window();globalThis.document=window.document;
 document.body.innerHTML=bannerMarkup({name:'Logan',honor:{kind:'vice-president',title:'vice-president'}});
 assert.equal(document.querySelectorAll('.player-text-banner').length,1);assert.equal(document.querySelector('.player-text-banner').textContent,'VICE PRESIDENT');assert.match(document.querySelector('.player-image-badge').getAttribute('src'),/rank-unranked/);
 document.body.innerHTML=bannerMarkup({cosmetics:{honor:{kind:'owner',title:'super-admin'},role:'super_admin'}});assert.equal(document.querySelector('.account-honor'),null);
 assert.throws(()=>mountOwnerConsole(document.body,{identity:{role:'player',expires:Date.now()/1000+3600}}),/Only the owner/);
});
test('cosmetic owner effects expire and do not change game state or hide answer input',()=>{
 const window=new Window();globalThis.document=window.document;window.HTMLElement.prototype.animate=()=>({cancel(){}});
 document.body.innerHTML='<main></main>';const state=newParty([{id:'a',name:'Counsel',ready:true},{id:'b',name:'Logan',ready:true}]),before=JSON.stringify(state);
 const session={state,myId:'a',host:true,isAdmin:true,code:'TEST',connected:true,offset:0,meta:{host:'a'},chat:[],rules(){},visibility(){},start(){},autoJoin(){},ready(){},profile(id){return {honor:id==='a'?{kind:'owner',title:'super-admin'}:{kind:'vice-president',title:'vice-president'}};},ownerEffect:{id:'effect-1',kind:'giant',target:'b',at:Date.now(),expires:Date.now()+8000}};
 const view=new PartyView(document.querySelector('main'),{help(){},leave(){},invite(){}});view.render(state,session);
 assert.equal(document.querySelector('[data-player="a"] .player-buddy').dataset.ownerFx,undefined);assert.equal(document.querySelector('[data-player="b"] .player-buddy').dataset.ownerFx,'giant');assert.equal(document.querySelectorAll('.account-honor').length,2);assert.equal(document.querySelector('[data-owner-console]').hidden,false);assert.equal(JSON.stringify(state),before);
 session.ownerEffect.expires=Date.now()-1;view.updateClock();assert.equal(document.querySelector('[data-player="b"] .player-buddy').dataset.ownerFx,undefined);assert.equal(document.querySelector('.owner-effect-label'),null);
 assert.equal(activeOwnerEffect({kind:'unknown',target:'all',at:Date.now(),expires:Date.now()+5000}),null);
});
