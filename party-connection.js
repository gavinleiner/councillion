export const permissionDenied=error=>['PERMISSION_DENIED','database/permission-denied'].includes(error?.code);
export function partyConnectionError(error){
 if(permissionDenied(error))return 'The server refused this room request. Sign out of Councillion and sign back in with Google, then try again. If it continues, report PUFFER_ACCESS.';
 if(['auth/user-token-expired','auth/invalid-user-token','auth/requires-recent-login'].includes(error?.code))return 'Your Google session needs a new sign-in. Use SIGN OUT in your profile, then SIGN IN again.';
 if(error?.code==='auth/user-disabled')return 'This Google account is disabled in Councillion. Contact the site owner.';
 if(['auth/network-request-failed','database/disconnected','database/unavailable'].includes(error?.code))return 'The multiplayer server could not connect. Check your connection and try again.';
 return error?.message||'The multiplayer connection was interrupted. Try again.';
}

export function waitForDatabaseConnection(c,timeoutMs=12000){
 return new Promise((resolve,reject)=>{
  let off,settled=false;
  const finish=error=>{if(settled)return;settled=true;clearTimeout(timer);off?.();error?reject(error):resolve();};
  const timer=setTimeout(()=>finish(Error('Could not reach the multiplayer server. Check your connection, then try Host or Join again.')),timeoutMs);
  off=c.onValue(c.ref(c.db,'.info/connected'),snapshot=>{if(snapshot.val()===true)finish();},finish);
  if(settled)off?.();
 });
}

export function databaseClockOffset(c,timeoutMs=12000){
 return new Promise((resolve,reject)=>{
  let off,settled=false;
  const finish=(error,value)=>{if(settled)return;settled=true;clearTimeout(timer);off?.();error?reject(error):resolve(value);};
  const timer=setTimeout(()=>finish(Error('The multiplayer clock could not synchronize. Check your connection and try again.')),timeoutMs);
  // .info is client-maintained SDK state; use its listener, not a server get().
  off=c.onValue(c.ref(c.db,'.info/serverTimeOffset'),snapshot=>{const value=snapshot.val();if(typeof value==='number'&&Number.isFinite(value))finish(null,value);},error=>finish(error));
  if(settled)off?.();
 });
}

export function compatiblePublicRooms(entries,build,now=Date.now()){
 return Object.entries(entries??{})
  .filter(([,r])=>r&&Number.isFinite(r.updatedAt)&&now-r.updatedAt>=-5000&&now-r.updatedAt<45000&&r.protocol===4&&r.catalogBuild===build)
  .map(([code,r])=>({code,...r}))
  .sort((a,b)=>Number(b.phase==='lobby')-Number(a.phase==='lobby')||b.count-a.count);
}
