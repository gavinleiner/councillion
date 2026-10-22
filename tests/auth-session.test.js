import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {setImmediate as nextTurn} from 'node:timers/promises';
import {Window} from 'happy-dom';
import {connectAccount} from '../auth.js';
import {GOOGLE_CLIENT_ID} from '../auth-config.js';

test('sign-out clears the identity and UI even when party presence cleanup is offline',async t=>{
 const window=new Window({url:'http://localhost:4173/'}),oldFetch=globalThis.fetch;
 globalThis.document=window.document;globalThis.sessionStorage=window.sessionStorage;document.body.innerHTML='<button id="account"></button><div id="content"></div>';
 const pair=await webcrypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
 const jwk={...await webcrypto.subtle.exportKey('jwk',pair.publicKey),kid:'offline-signout-test',alg:'RS256'},now=Math.floor(Date.now()/1000),nonce='offline-cleanup';
 const encode=v=>Buffer.from(JSON.stringify(v)).toString('base64url');const message=encode({alg:'RS256',kid:jwk.kid})+'.'+encode({iss:'https://accounts.google.com',aud:GOOGLE_CLIENT_ID,sub:'test-google-user',nonce,iat:now,exp:now+3600,name:'Counsel',email:'test@example.invalid'});const credential=message+'.'+Buffer.from(await webcrypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,Buffer.from(message))).toString('base64url');
 sessionStorage.setItem('fc:google-session',JSON.stringify({credential,nonce}));globalThis.fetch=async()=>new Response(JSON.stringify({keys:[jwk]}),{headers:{'cache-control':'max-age=60'}});
 let disconnected=false,disableAuto=false;globalThis.google={accounts:{id:{initialize(){},renderButton(){},disableAutoSelect(){disableAuto=true;}}}};
 t.mock.timers.enable({apis:['setTimeout','setInterval']});
 try{
  const account=connectAccount({button:document.querySelector('#account'),escape:s=>s,modal:html=>document.querySelector('#content').innerHTML=html,onIdentity:value=>{if(value===null)disconnected=true;},beforeSignOut:()=>new Promise(()=>{})});
  for(let n=0;n<100&&!account.identity;n++)await nextTurn();assert.equal(account.identity?.name,'Counsel');
  await account.open();const signingOut=document.querySelector('#google-signout').onclick();
  assert.equal(account.identity,null);assert.equal(disconnected,true);assert.equal(sessionStorage.getItem('fc:google-session'),null);assert.equal(document.querySelector('#account').textContent,'SIGN IN');
  t.mock.timers.tick(2001);await signingOut;assert.equal(disableAuto,true);assert.ok(document.querySelector('#google-button'));
 }finally{t.mock.timers.reset();globalThis.fetch=oldFetch;delete globalThis.google;await window.happyDOM.close();}
});
