import test from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {connectAccount} from '../auth.js';
import {googleIdentity} from '../account-identity.js';
const identity={id:'google-one',uid:'firebase-one',name:'Counsel One',email:'one@example.invalid',expires:Date.now()/1000+3600};
function fixture(saved=identity){
 const window=new Window({url:'http://localhost:4173/'});globalThis.document=window.document;globalThis.sessionStorage=window.sessionStorage;
 document.body.innerHTML='<button id="account"></button><div id="content"></div>';let listener=()=>{},value=saved,offline=false,logouts=0;
 const cloud={async restoreAccount(){if(offline)throw Error('Offline');return value;},watchAccount(fn){listener=fn;return ()=>{listener=()=>{};};},async currentSession(expected){assert.equal(expected,value.id);return {uid:value.uid,identity:value};},async logout(){logouts++;value=null;listener(null);}};
 const options={button:document.querySelector('#account'),escape:s=>s,modal:html=>document.querySelector('#content').innerHTML=html,getCloud:async()=>cloud};
 return {window,cloud,options,emit(v){value=v;listener(v);},offline(v){offline=v;},get logouts(){return logouts;}};
}
test('restores a persistent verified Google session and receives refresh/account/sign-out events',async()=>{
 const f=fixture(),seen=[],account=connectAccount({...f.options,onIdentity:i=>seen.push(i)});
 try{await account.ready;assert.equal(account.identity.id,identity.id);assert.match(document.querySelector('#account').textContent,/Counsel/);assert.equal((await account.partySession()).uid,'firebase-one');
 const refreshed={...identity,expires:identity.expires+3600};f.emit(refreshed);assert.equal(account.identity.expires,refreshed.expires);
 f.emit({...identity,id:'google-two',uid:'firebase-two'});assert.equal(account.identity.id,'google-two');f.emit(null);assert.equal(account.identity,null);assert.equal(document.querySelector('#account').textContent,'SIGN IN');assert.equal(seen.length,4);
 }finally{account.dispose();await f.window.happyDOM.close();}
});
test('sign-out removes the durable session even when party cleanup hangs',async t=>{
 const f=fixture();let disconnected=false;const account=connectAccount({...f.options,onIdentity:i=>{if(i===null)disconnected=true;},beforeSignOut:()=>new Promise(()=>{})});
 try{await account.ready;t.mock.timers.enable({apis:['setTimeout']});const signingOut=account.signOut();assert.equal(account.identity,null);assert.equal(disconnected,true);await Promise.resolve();await Promise.resolve();assert.equal(f.logouts,1);t.mock.timers.tick(2001);await signingOut;assert.equal(await f.cloud.restoreAccount(),null);
 }finally{t.mock.timers.reset();account.dispose();await f.window.happyDOM.close();}
});
test('late startup cannot restore a signed-out account and forged local profile flags are ignored',async()=>{
 const f=fixture(null);let resolve;f.cloud.restoreAccount=()=>new Promise(r=>{resolve=r;});sessionStorage.setItem('fc:profile',JSON.stringify(identity));const account=connectAccount(f.options);
 try{await Promise.resolve();await Promise.resolve();const out=account.signOut();resolve(identity);await account.ready;await out;assert.equal(account.identity,null);await assert.rejects(account.partySession(),/Sign in/);
 }finally{account.dispose();await f.window.happyDOM.close();}
});
test('provider validation rejects non-Google accounts, wrong binding and expired sessions',async()=>{
 const token={signInProvider:'google.com',expirationTime:new Date(Date.now()+3600000).toISOString()},user={uid:'firebase-one',providerData:[{providerId:'google.com',uid:'google-one'}],displayName:'Counsel',async getIdTokenResult(){return token;}};
 assert.equal((await googleIdentity(user,'google-one')).id,'google-one');await assert.rejects(googleIdentity(user,'another-google'),/Google/);
 token.signInProvider='password';await assert.rejects(googleIdentity(user),/Google/);token.signInProvider='google.com';token.expirationTime='1970-01-01';await assert.rejects(googleIdentity(user),/refresh/);assert.equal(await googleIdentity(null),null);
});
