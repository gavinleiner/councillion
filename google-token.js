// Identity verification for a browser-local profile. There is no remote save API.
// Any future backend must independently verify tokens on that backend.
const decode=value=>Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(value.length/4)*4,'=')),c=>c.charCodeAt(0));
export async function verifyGoogleToken(token,{clientId,nonce,keys,now=Date.now()/1000,cryptoApi=globalThis.crypto}){
 const parts=String(token).split('.');if(parts.length!==3)throw Error('Invalid Google response.');
 let header,payload;try{header=JSON.parse(new TextDecoder().decode(decode(parts[0])));payload=JSON.parse(new TextDecoder().decode(decode(parts[1])));}catch{throw Error('Invalid Google response.');}
 if(header.alg!=='RS256'||!header.kid)throw Error('Unsupported Google signature.');
 if(!clientId||payload.aud!==clientId||(payload.azp&&payload.azp!==clientId)||!['accounts.google.com','https://accounts.google.com'].includes(payload.iss))throw Error('This sign-in belongs to a different app.');
 if(!Number.isFinite(payload.exp)||payload.exp<=now||!Number.isFinite(payload.iat)||payload.iat>now+120||typeof payload.sub!=='string'||!payload.sub||!nonce||payload.nonce!==nonce)throw Error('This sign-in expired. Please try again.');
 const jwk=keys.find(k=>k.kid===header.kid&&k.kty==='RSA'&&(!k.alg||k.alg==='RS256'));if(!jwk)throw Error('Google updated its signing keys. Please try again.');
 const key=await cryptoApi.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 if(!await cryptoApi.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1])))throw Error('Google’s signature could not be verified.');
 return {id:payload.sub,name:String(payload.name||payload.given_name||'Counsel').slice(0,80),email:String(payload.email||'').slice(0,200),expires:payload.exp};
}
