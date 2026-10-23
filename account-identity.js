import {honorForClaims} from './account-honors.js';
// A display name is never an authentication credential. Only the Firebase SDK's
// verified Google-provider session can supply the identity used by party gates.
export async function googleIdentity(user,expectedGoogleId){
 if(!user)return null;
 const provider=user.providerData.find(p=>p.providerId==='google.com');
 const token=await user.getIdTokenResult();
 if(!provider||token.signInProvider!=='google.com'||(expectedGoogleId&&provider.uid!==expectedGoogleId))throw Error('A Google account is required.');
 const expires=Date.parse(token.expirationTime)/1000;
 if(!Number.isFinite(expires)||expires<=Date.now()/1000)throw Error('Reconnect to refresh your Google sign-in.');
 const honor=honorForClaims(token.claims,token.signInProvider);
 return {id:provider.uid,uid:user.uid,name:String(user.displayName||provider.displayName||'Counsel').slice(0,80),email:String(user.email||provider.email||'').slice(0,200),expires,...(honor?{honor,role:honor.kind==='owner'?'super_admin':'player'}:{})};
}
