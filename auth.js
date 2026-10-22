import {GOOGLE_CLIENT_ID} from './auth-config.js';
import {verifyGoogleToken} from './google-token.js';
let gisPromise,keyCache,initialized=false,current=null,nonce='';
const tokenKey='fc:google-session';
function session(value){try{if(value)sessionStorage.setItem(tokenKey,JSON.stringify(value));else sessionStorage.removeItem(tokenKey);}catch{}}
function getSession(){try{return JSON.parse(sessionStorage.getItem(tokenKey));}catch{return null;}}
async function googleKeys(){if(keyCache&&keyCache.until>Date.now())return keyCache.keys;const response=await fetch('https://www.googleapis.com/oauth2/v3/certs',{credentials:'omit'});if(!response.ok)throw Error('Google is temporarily unavailable. Try again.');const {keys}=await response.json();keyCache={keys,until:Date.now()+Math.min(3600,Number(response.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1])||300)*1000};return keys;}
function loadGoogle(){if(globalThis.google?.accounts?.id)return Promise.resolve();return gisPromise??=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;script.onload=resolve;script.onerror=()=>{gisPromise=null;script.remove();reject(Error('Could not load Google sign-in. Check your connection and try again.'));};document.head.append(script);});}
export function connectAccount({button,modal,escape,onIdentity=()=>{}}){
 const update=()=>{button.textContent=current?'● '+current.name.split(' ')[0]:'SIGN IN';button.setAttribute('aria-label',current?'Open account for '+current.name:'Sign in with Google');};
 async function accept(credential,expectedNonce){const identity=await verifyGoogleToken(credential,{clientId:GOOGLE_CLIENT_ID,nonce:expectedNonce,keys:await googleKeys()});current=identity;session({credential,nonce:expectedNonce});update();onIdentity(identity);return identity;}
 async function open(){
  if(current&&current.expires<=Date.now()/1000){current=null;session(null);update();}
  if(current){modal(`<p class="eyebrow">YOUR COUNSEL PROFILE</p><h2>${escape(current.name)}</h2><p class="account-email">${escape(current.email)}</p><p class="muted">Connected with Google. Your dives and settings are saved in this browser. This sign-in does not sync progress between devices.</p><button class="pixel-button" id="google-signout">SIGN OUT</button><p class="fine-print"><a href="privacy.html" target="_blank" rel="noopener">Privacy & data</a></p>`);document.querySelector('#google-signout').onclick=()=>{current=null;session(null);globalThis.google?.accounts?.id.disableAutoSelect();update();open();};return;}
  modal(`<p class="eyebrow">WELCOME TO THE COURT</p><h2>SIGN IN</h2><p>Connect your Google profile to Councillion.</p><div id="google-button" class="google-button"></div><p id="auth-status" class="notice" role="status">${GOOGLE_CLIENT_ID?'Loading Google…':'Google sign-in is being configured.'}</p><p class="muted">Your progress stays in this browser. You can keep playing as a guest.</p><p class="fine-print"><a href="privacy.html" target="_blank" rel="noopener">Privacy & data</a></p>`);
  if(!GOOGLE_CLIENT_ID)return;
  const status=document.querySelector('#auth-status'),mount=document.querySelector('#google-button');
  try{
   await loadGoogle();if(!mount.isConnected)return;
   if(!initialized){nonce=Array.from(crypto.getRandomValues(new Uint8Array(24)),v=>v.toString(16).padStart(2,'0')).join('');google.accounts.id.initialize({client_id:GOOGLE_CLIENT_ID,nonce,auto_select:false,ux_mode:'popup',callback:async({credential})=>{const activeStatus=document.querySelector('#auth-status');if(activeStatus)activeStatus.textContent='Checking your Google profile…';try{await accept(credential,nonce);open();}catch(error){if(activeStatus?.isConnected)activeStatus.textContent=error.message;}}});initialized=true;}
   google.accounts.id.renderButton(mount,{theme:'outline',size:'large',text:'signin_with',shape:'rectangular',width:Math.min(320,mount.clientWidth)});status.textContent='';
  }catch(error){status.textContent=error.message;}
 }
 button.onclick=open;update();const saved=getSession();if(saved&&GOOGLE_CLIENT_ID)accept(saved.credential,saved.nonce).catch(()=>{session(null);});
 setInterval(()=>{if(current&&current.expires<=Date.now()/1000){current=null;session(null);update();}},60000);
 return {open};
}
