// Callers pass the identity returned by Google signature verification, never
// the editable display name or a profile read from localStorage.
export function canPlayParty(identity,now=Date.now()/1000){
 return !!identity&&typeof identity.id==='string'&&identity.id.length>0&&Number.isFinite(identity.expires)&&identity.expires>now;
}
export function requirePartyIdentity(identity,now=Date.now()/1000){
 if(!canPlayParty(identity,now))throw Error('Sign in with Google to play Puffer Party.');
 return identity;
}
