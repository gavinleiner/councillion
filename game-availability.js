import {canAdmin} from './account-honors.js';
// Public release flags; the verified owner may enter the private preview.
export const COMING_SOON_GAMES=Object.freeze(['oath']);
export const isGameAvailable=(mode,identity)=>!COMING_SOON_GAMES.includes(mode)||!!canAdmin(identity);
export function requireGameAvailable(mode,identity){if(!isGameAvailable(mode,identity))throw Error('Under Oath is coming soon. The private preview is owner-only.');}
