import {canAdmin,PRESIDENT_EMAIL} from './account-honors.js';
import {canPlayDeep} from './deep-data.js';
// The local bot preview and real multiplayer rooms have separate entitlements.
export const COMING_SOON_GAMES=Object.freeze(['deep']);
export const canPreviewOath=identity=>!!(canAdmin(identity)||(identity?.expires>Date.now()/1000&&String(identity?.email??'').toLowerCase()===PRESIDENT_EMAIL&&identity?.honor?.kind==='president'&&identity.honor.title==='pres'));
export const isGameAvailable=(mode,identity)=>mode==='deep'?canPlayDeep(identity):!COMING_SOON_GAMES.includes(mode)||!!canAdmin(identity);
export const isGameEntryAvailable=(mode,identity)=>isGameAvailable(mode,identity)||(mode==='oath'&&canPreviewOath(identity));
export function requireGameAvailable(mode,identity){if(!isGameAvailable(mode,identity))throw Error('Under Oath is coming soon. The private preview is owner-only.');}
