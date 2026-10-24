export function questionFormat(pack){
 const group=pack.group??'';
 if(group.startsWith('group-approved-'))return 'Group-approved prompt';
 if(group.startsWith('group-broad-'))return 'Broad category';
 return ({
  'group-steam-single-tag':'Steam · one tag',
  'group-steam-two-tags':'Steam · two tags',
  'group-artist-songs':'Songs by one artist',
  'group-game-developers':'Games by developer',
  'group-game-publishers':'Games by publisher',
  'group-game-title-category':'Game title · word category',
  'group-game-title-word':'Game title · one word',
  'group-movie-genre':'Movies · one genre',
  'group-movie-genre-theme':'Movies · genre + theme',
  'group-movie-story-tag':'Movies · story tag',
  'group-movie-studio':'Movies by studio',
  'group-movie-title-category':'Movie title · word category',
  'group-movie-title-word':'Movie title · one word',
  'group-movie-two-genres':'Movies · two genres',
  'group-music-genre-artist':'Artists · one genre',
  'group-music-genre-song':'Songs · one genre',
  'group-show-genre':'TV · one genre',
  'group-show-title-category':'TV title · word category',
  'group-show-title-word':'TV title · one word',
  'group-song-title-category':'Song title · word category',
  'group-song-title-word':'Song title · one word',
 })[group]??group;
}

