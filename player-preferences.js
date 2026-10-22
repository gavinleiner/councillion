import {safeDisplayName,validateDisplayName} from './moderation.js';
export const BUDDY_IDS=['krill','schooler','squid','angler','evil'];
const key=identity=>'fc:player:'+(identity?.id??'guest');
export function readPlayerPreferences(storage,identity,fallbackName=''){
 let saved;try{saved=JSON.parse(storage.getItem(key(identity)));}catch{}
 return {name:safeDisplayName(saved?.name||fallbackName||identity?.name?.split(' ')[0]||'Counsel'),buddy:BUDDY_IDS.includes(saved?.buddy)?saved.buddy:'krill',publicRoom:saved?.publicRoom!==false};
}
export function savePlayerPreferences(storage,identity,value){
 const preferences={name:validateDisplayName(value.name),buddy:BUDDY_IDS.includes(value.buddy)?value.buddy:'krill',publicRoom:value.publicRoom!==false};
 storage.setItem(key(identity),JSON.stringify(preferences));return preferences;
}
