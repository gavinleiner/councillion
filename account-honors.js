// Entitlements come from Firebase's signed Google token, never a nickname.
export const OWNER_EMAIL='gavin@theleiners.com';
export const VICE_PRESIDENT_EMAIL='logan.lewis@student.nhcs.net';
export const OWNER_TITLES={'super-admin':'SUPER ADMIN','the-owner':'THE OWNER','final-authority':'FINAL AUTHORITY'};
export function honorForClaims(claims={},provider){
 if(provider!=='google.com'||claims.email_verified!==true)return null;
 const email=String(claims.email??'').toLowerCase();
 if(email===OWNER_EMAIL)return {kind:'owner',title:'super-admin'};
 if(email===VICE_PRESIDENT_EMAIL)return {kind:'vice-president',title:'vice-president'};
 return null;
}
export const canAdmin=identity=>identity?.role==='super_admin'&&identity.expires>Date.now()/1000;
export function cleanHonor(value){
 if(value?.kind==='owner'&&Object.hasOwn(OWNER_TITLES,value.title))return {kind:'owner',title:value.title};
 if(value?.kind==='vice-president'&&value.title==='vice-president')return {kind:'vice-president',title:'vice-president'};
 return null;
}
export function honorLabel(honor){const h=cleanHonor(honor);return h?.kind==='owner'?OWNER_TITLES[h.title]:h?'VICE PRESIDENT':'';}
export function honorMarkup(honor){const h=cleanHonor(honor);return h?`<span class="player-text-banner account-honor ${h.kind==='owner'?'owner-honor':'vice-president-honor'}" title="${h.kind==='owner'?'Councillion owner · verified Google account':'Vice President · normal player permissions'}">${honorLabel(h)}</span>`:'';}
