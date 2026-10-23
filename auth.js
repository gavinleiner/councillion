import {GOOGLE_CLIENT_ID} from './auth-config.js';
import {verifyGoogleToken} from './google-token.js';
let gisPromise,keyCache;
const loadCloud=()=>import('./cloud.bundle.js?v=20261022-owner-v1');
async function googleKeys(){if(keyCache&&keyCache.until>Date.now())return keyCache.keys;const response=await fetch('https://www.googleapis.com/oauth2/v3/certs',{credentials:'omit'});if(!response.ok)throw Error('Google is temporarily unavailable. Try again.');const {keys}=await response.json();keyCache={keys,until:Date.now()+Math.min(3600,Number(response.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1])||300)*1000};return keys;}
function loadGoogle(){if(globalThis.google?.accounts?.id)return Promise.resolve();return gisPromise??=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;script.onload=resolve;script.onerror=()=>{gisPromise=null;script.remove();reject(Error('Could not load Google sign-in. Check your connection and try again.'));};document.head.append(script);});}
const forgetLegacy=()=>{try{sessionStorage.removeItem('fc:google-session');}catch{}};
export function connectAccount({button,modal,escape,onIdentity=()=>{},beforeSignOut=async()=>{},profileMarkup=()=>'',bindProfile=()=>{},getCloud=loadCloud}){
 let current=null,cloudModule,initialized=false,nonce='',revision=0,signingOut=false,disposed=false,stopWatching=()=>{},restoreError='';
 const cloud=()=>cloudModule??=getCloud();
 const update=()=>{button.textContent=current?'● '+current.name.split(' ')[0]:'SIGN IN';button.setAttribute('aria-label',current?'Open account for '+current.name:'Sign in with Google');};
 function publish(identity){if(disposed||signingOut)return;const changed=JSON.stringify(current)!==JSON.stringify(identity);current=identity;restoreError='';update();if(changed)onIdentity(identity);}
 async function accept(credential,expectedNonce){
  const turn=++revision;await verifyGoogleToken(credential,{clientId:GOOGLE_CLIENT_ID,nonce:expectedNonce,keys:await googleKeys()});
  if(turn!==revision||signingOut||disposed)return;
  const m=await cloud();if(turn!==revision||signingOut||disposed)return;
  const session=await m.googleSession(credential);
  if(turn!==revision&&signingOut){await m.logout();return;}
  if(turn===revision&&!signingOut&&!disposed)publish(session.identity??await m.restoreAccount());
  forgetLegacy();return current;
 }
 const ready=(async()=>{
  try{
   const turn=revision,m=await cloud();if(disposed)return;
   stopWatching=m.watchAccount(identity=>publish(identity),error=>{restoreError=error.message;});
   const restored=await m.restoreAccount();if(turn!==revision||signingOut||disposed)return;
   if(restored){publish(restored);forgetLegacy();return;}
   // Upgrade an unexpired tab session once. New Google tokens are exchanged
   // immediately; app-owned storage no longer keeps raw identity tokens.
   let legacy;try{legacy=JSON.parse(sessionStorage.getItem('fc:google-session'));}catch{}
   if(legacy)try{await accept(legacy.credential,legacy.nonce);}catch{}finally{forgetLegacy();}
  }catch(error){restoreError=error.message;}
 })();
 async function clearIdentity(){
  ++revision;signingOut=true;current=null;forgetLegacy();update();
  let cleanup;try{cleanup=beforeSignOut();}catch{}
  onIdentity(null);
  // Presence cleanup must not prevent removal of the durable auth session.
  const logout=cloud().then(m=>m.logout());let timer;
  try{await Promise.all([logout,Promise.race([Promise.resolve(cleanup).catch(()=>{}),new Promise(resolve=>{timer=setTimeout(resolve,2000);})])]);}
  finally{clearTimeout(timer);signingOut=false;}
 }
 async function refresh(){if(signingOut||disposed)return;await ready;const turn=revision;try{const m=await cloud(),identity=await m.restoreAccount();if(turn===revision)publish(identity);}catch(error){restoreError=error.message;/* Going offline must not sign the user out. */}}
 async function open(){
  modal('<p class="eyebrow">YOUR COUNSEL PROFILE</p><h2>OPENING YOUR PROFILE…</h2>');await ready;
  if(current){modal('<p class="eyebrow">YOUR COUNSEL PROFILE</p><h2>'+escape(current.name)+'</h2><p class="account-email">'+escape(current.email)+'</p>'+profileMarkup(current)+'<p class="muted">Google sign-in stays connected when you return to this browser, until you sign out. Your nickname, buddy, dives and settings stay on this device.</p><button class="pixel-button" id="google-signout">SIGN OUT</button><p class="fine-print">On a shared laptop, sign out when you finish. <a href="privacy.html" target="_blank" rel="noopener">Privacy & data</a></p>');bindProfile(current);document.querySelector('#google-signout').onclick=async()=>{try{await clearIdentity();globalThis.google?.accounts?.id.disableAutoSelect();open();}catch{modal('<h2>SIGN-OUT NEEDS ANOTHER TRY</h2><p>Please reconnect and choose Sign out again.</p><button class="pixel-button" id="google-signout">RETRY SIGN-OUT</button>');document.querySelector('#google-signout').onclick=async()=>{await clearIdentity();open();};}};return;}
  modal('<p class="eyebrow">WELCOME TO THE COURT</p><h2>SIGN IN</h2><p>Connect your Google profile to Councillion.</p><div id="google-button" class="google-button"></div><p id="auth-status" class="notice" role="status">'+(GOOGLE_CLIENT_ID?'Loading Google…':'Google sign-in is being configured.')+'</p><p class="muted">You’ll stay signed in on this browser. Daily, Practice and Endless also work as a guest.</p><p class="fine-print"><a href="privacy.html" target="_blank" rel="noopener">Privacy & data</a></p>');
  if(!GOOGLE_CLIENT_ID)return;
  const status=document.querySelector('#auth-status'),mount=document.querySelector('#google-button');
  try{
   await loadGoogle();if(!mount.isConnected)return;
   if(!initialized){nonce=Array.from(crypto.getRandomValues(new Uint8Array(24)),v=>v.toString(16).padStart(2,'0')).join('');google.accounts.id.initialize({client_id:GOOGLE_CLIENT_ID,nonce,auto_select:false,ux_mode:'popup',callback:async({credential})=>{const activeStatus=document.querySelector('#auth-status');if(activeStatus)activeStatus.textContent='Checking your Google profile…';try{await accept(credential,nonce);open();}catch(error){if(activeStatus?.isConnected)activeStatus.textContent=error.message;}}});initialized=true;}
   google.accounts.id.renderButton(mount,{theme:'outline',size:'large',text:'signin_with',shape:'rectangular',width:Math.min(320,mount.clientWidth)});status.textContent=restoreError?'Previous session couldn’t reconnect. You can sign in again.':'';
  }catch(error){status.textContent=error.message;}
 }
 button.onclick=open;update();
 const interval=setInterval(refresh,5*60*1000),onFocus=()=>refresh();globalThis.window?.addEventListener('focus',onFocus);
 return {open,ready,signOut:clearIdentity,async partySession(){await ready;if(!current||signingOut)throw Error('Sign in with Google to play Puffer Party.');const turn=revision,m=await cloud(),session=await m.currentSession(current.id);if(turn!==revision||signingOut)throw Error('Your account changed. Rejoin the room.');publish(session.identity??current);return session;},get identity(){return current&&current.expires>Date.now()/1000?current:null;},dispose(){disposed=true;++revision;stopWatching();clearInterval(interval);globalThis.window?.removeEventListener('focus',onFocus);}};
}
