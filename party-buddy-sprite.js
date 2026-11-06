// Shared presentation-only character rendering; no game engine or question bank.
import {tierSprite} from './sprites.js';
import {detailedBuddySprite} from './party-buddy-art.js';
export const BUDDIES=[['krill','THE COUNSEL',10],['schooler','THE CLERK',30],['squid','THE ADVOCATE',60],['angler','DEEP COUNSEL',85],['evil','DEVIL’S ADVOCATE',100]];
export function buddySprite(kind='krill'){return kind==='krill'?`<img class="counsel-buddy" src="assets/${globalThis.document?.body?.classList.contains('reduced')||globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'counsel-krill-still.svg':'counsel-krill.svg'}?v=20261022" alt="Krill wearing a barrister wig">`:detailedBuddySprite(kind)||tierSprite(BUDDIES.find(b=>b[0]===kind)?.[2]??10,'party-buddy');}
