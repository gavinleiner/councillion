// One release flag shared by the hub, direct entry, sessions and database rules.
export const COMING_SOON_GAMES=Object.freeze(['oath']);
export const isGameAvailable=mode=>!COMING_SOON_GAMES.includes(mode);
export function requireGameAvailable(mode){if(!isGameAvailable(mode))throw Error('Under Oath is coming soon.');}
