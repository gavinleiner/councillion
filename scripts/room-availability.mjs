import {COMING_SOON_GAMES} from '../game-availability.js';
import {OWNER_EMAIL} from '../account-honors.js';
export function applyRoomAvailability(r){
const google="auth !== null && auth.token.firebase.sign_in_provider === 'google.com'";
const owner=`${google} && auth.token.email_verified === true && auth.token.email === '${OWNER_EMAIL}'`;
// Every grant beneath a room must carry the gate: a shallow .read/.write
// restriction alone can be bypassed by an existing member's child grant.
const roomGate='('+COMING_SOON_GAMES.flatMap(mode=>["root.child('rooms').child($code).child('meta/game').val() !== '"+mode+"'","root.child('rooms').child($code).child('state/variant').val() !== '"+mode+"'"]).join(' && ')+') || ('+owner+')';
const gateMarker=") && ((root.child('rooms').child($code).child('meta/game').val() !==";
function availabilityGrants(node){
 for(const key of Object.keys(node)){
  if(['.read','.write'].includes(key)){
   let rule=node[key];const i=typeof rule==='string'?rule.lastIndexOf(gateMarker):-1;
   if(i>0&&rule.startsWith('('))rule=rule.slice(1,i);
   node[key]=COMING_SOON_GAMES.length?`(${rule}) && (${roomGate})`:rule;
  }else if(node[key]&&typeof node[key]==='object')availabilityGrants(node[key]);
 }
}
availabilityGrants(r.rooms.$code);
}
