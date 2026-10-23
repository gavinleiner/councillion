import {canAdmin,OWNER_TITLES,honorMarkup} from './account-honors.js';
import {escape as esc} from './party-badges.js';
export const OWNER_EFFECTS={objection:'OBJECTION!',papers:'PAPER STORM',bubbles:'BUBBLE WRAP',wig:'JUDGE’S WIG',wobble:'WOBBLE',giant:'BIG COUNSEL'};
export const OWNER_ACTIONS={start:'START / REMATCH',kick:'REMOVE PLAYER',end:'END MATCH · NO CONTEST',public:'MAKE PUBLIC',private:'MAKE PRIVATE'};
export function activeOwnerEffect(value,now=Date.now()){
 return value&&Object.hasOwn(OWNER_EFFECTS,value.kind)&&typeof value.target==='string'&&Number.isFinite(value.at)&&value.at<=now+5000&&value.expires>now&&value.expires-value.at<=10000?value:null;
}
export async function sendOwnerEffect(c,identity,code,kind,target='all'){
 if(!canAdmin(identity))throw Error('Only the owner can use these controls.');
 if(!/^[A-Z]{4}$/.test(code))throw Error('Choose an active room.');
 if(!Object.hasOwn(OWNER_EFFECTS,kind))throw Error('Unknown effect.');
 await c.set(c.ref(c.db,`rooms/${code}/admin/effect`),{id:crypto.randomUUID(),uid:identity.uid,kind,target,at:c.serverTimestamp(),expires:Date.now()+8000});
}
export async function sendOwnerAction(c,identity,code,action,target='all'){
 if(!canAdmin(identity))throw Error('Only the owner can use these controls.');
 if(!/^[A-Z]{4}$/.test(code))throw Error('Choose an active room.');
 if(!Object.hasOwn(OWNER_ACTIONS,action))throw Error('Unknown control.');
 if(action==='kick'&&target==='all')throw Error('Choose a specific player to remove.');
 await c.set(c.ref(c.db,`rooms/${code}/admin/control`),{id:crypto.randomUUID(),uid:identity.uid,action,target,at:c.serverTimestamp()});
}
export function mountOwnerConsole(root,{cloud:c,identity,onJoin=()=>{},initialCode='',onSaveHonor=()=>{}}){
 if(!canAdmin(identity))throw Error('Only the owner can open the owner console.');
 root.innerHTML=`<p class="eyebrow">VERIFIED OWNER</p><h2>THE OWNER’S BENCH</h2>${honorMarkup({kind:'owner',title:'super-admin'})}<p class="profile-explainer">Room controls and temporary visual effects. Effects last eight seconds and leave scores, hearts and answers alone.</p><label class="field-label" for="owner-title">YOUR EXCLUSIVE TITLE</label><select id="owner-title" class="field">${Object.entries(OWNER_TITLES).map(([id,label])=>`<option value="${id}">${label}</option>`).join('')}</select><button data-owner-title class="text-button">EQUIP TITLE</button><h3>LIVE COURTROOMS</h3><div class="owner-room-list" data-owner-rooms>Connecting…</div><section class="owner-room-controls" hidden><h3 data-owner-heading></h3><label class="field-label" for="owner-target">TARGET</label><select id="owner-target" class="field"></select><h3>JUST FOR FUN</h3><div class="owner-button-grid">${Object.entries(OWNER_EFFECTS).map(([id,label])=>`<button data-owner-effect="${id}">${label}</button>`).join('')}</div><button data-owner-clear class="text-button">CLEAR EFFECTS</button><h3>ROOM ADMIN</h3><div class="owner-button-grid">${Object.entries(OWNER_ACTIONS).map(([id,label])=>`<button data-owner-action="${id}">${label}</button>`).join('')}</div><button data-owner-join class="text-button">OPEN ROOM ↗</button><button data-owner-close class="text-button owner-danger">CLOSE ROOM</button></section><p data-owner-status class="notice" role="status"></p>`;
 let rooms={},selected=initialCode,closed=false;const status=root.querySelector('[data-owner-status]'),controls=root.querySelector('.owner-room-controls');
 const run=async (task,success='Done.')=>{try{status.textContent='Sending…';await task();status.textContent=success;}catch(error){status.textContent=error.message;}};
 const paint=()=>{const active=Object.entries(rooms).filter(([,r])=>Date.now()-(r.meta?.createdAt??0)<86400000&&Object.values(r.members??{}).some(m=>m.online));root.querySelector('[data-owner-rooms]').innerHTML=active.length?active.map(([code,r])=>`<button data-owner-room="${code}" aria-pressed="${selected===code}"><b>${code}</b><span>${esc(r.meta.hostName)} · ${esc(r.state?.phase)} · ${Object.values(r.members??{}).filter(m=>m.online).length} online${r.meta.isPrivate?' · PRIVATE':''}</span></button>`).join(''):'<p>No active rooms.</p>';root.querySelectorAll('[data-owner-room]').forEach(b=>b.onclick=()=>{selected=b.dataset.ownerRoom;paint();});const room=rooms[selected];controls.hidden=!room;if(!room)return;root.querySelector('[data-owner-heading]').textContent=selected+' · '+(room.meta.hostName??'Court');const target=root.querySelector('#owner-target'),prior=target.value;target.innerHTML='<option value="all">EVERYONE</option>'+Object.entries(room.members??{}).filter(([,m])=>m.online).map(([id,m])=>`<option value="${esc(id)}">${esc(m.name)}</option>`).join('');if([...target.options].some(o=>o.value===prior))target.value=prior;};
 const off=c.onValue(c.ref(c.db,'rooms'),snapshot=>{if(closed)return;rooms=snapshot.val()??{};paint();},error=>{status.textContent=error.message;});
 root.querySelectorAll('[data-owner-effect]').forEach(b=>b.onclick=()=>run(()=>sendOwnerEffect(c,identity,selected,b.dataset.ownerEffect,root.querySelector('#owner-target').value)));
 root.querySelectorAll('[data-owner-action]').forEach(b=>b.onclick=()=>run(()=>sendOwnerAction(c,identity,selected,b.dataset.ownerAction,root.querySelector('#owner-target').value),'Sent to the room host.'));
 root.querySelector('[data-owner-clear]').onclick=()=>run(()=>c.remove(c.ref(c.db,`rooms/${selected}/admin/effect`)));
 root.querySelector('[data-owner-join]').onclick=()=>onJoin(selected);
 root.querySelector('[data-owner-title]').onclick=()=>run(async()=>{await c.set(c.ref(c.db,'accountHonors/'+identity.uid),{kind:'owner',title:root.querySelector('#owner-title').value});onSaveHonor();});
 root.querySelector('[data-owner-close]').onclick=()=>run(async()=>{await c.remove(c.ref(c.db,'directory/'+selected));await c.remove(c.ref(c.db,'rooms/'+selected));selected='';paint();});
 c.get(c.ref(c.db,'accountHonors/'+identity.uid)).then(snapshot=>{const title=snapshot.val()?.title;if(root.isConnected&&Object.hasOwn(OWNER_TITLES,title))root.querySelector('#owner-title').value=title;}).catch(()=>{});
 const dialog=root.closest('dialog'),observer=new MutationObserver(()=>{if(!root.isConnected)dispose();});observer.observe(document.body,{childList:true,subtree:true});dialog?.addEventListener('close',dispose,{once:true});
 function dispose(){if(closed)return;closed=true;off();observer.disconnect();dialog?.removeEventListener('close',dispose);}
 return dispose;
}
