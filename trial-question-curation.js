// Trial has its own admission list. Jeopardy dollar rows are not a useful
// difficulty estimate once a clue has four choices. These are familiar subjects
// with deliberately chosen, same-kind alternatives; no random category answers.
// Facts and source lineage come from bench-data; the other modes keep their pool.
export const TRIAL_LEGACY_PICKS=[
 // Gaming: other enchantments, mobs, playable characters or games.
 ['block-party-4',3,['Unbreaking','Fortune','Silk Touch']],
 ['block-party-5',3,['Ender Dragon','Warden','Elder Guardian']],
 ['block-party-alt-4',4,['Endermite','Guardian','Silverfish']],
 ['boss-room-alt-5',4,['Rennala','Ranni','Queen Marika']],
 ['game-worlds-alt-3',3,["Assassin’s Creed Rogue","Assassin’s Creed III","Assassin’s Creed Unity"]],
 ['game-faces-alt-5',3,['Isaac Clarke','Doom Slayer','Jack Cooper']],
 ['battle-ready-5',4,['Loba','Wattson','Bangalore']],
 ['battle-ready-alt-3',3,['Echo','Pharah','Sombra']],
 ['battle-ready-alt-4',4,['Neon','Reyna','Raze']],
 ['gaming-duos-4',3,['Dr. Nefarious','Captain Qwark','Orvus']],
 ['arcade-tokens-5',4,['Galaxian','Space Invaders','Asteroids']],
 ['nintendo-neighbors-alt-3',3,['Princess Daisy','Pauline','Princess Peach']],
 // Sports: comparable players, competitions and real rule terminology.
 ['court-side-alt-5',4,['Shaquille O’Neal','David Robinson','Patrick Ewing']],
 ['court-side-alt-4',3,['Kevin Garnett','Dirk Nowitzki','David Robinson']],
 ['on-the-pitch-alt-5',4,['Ivan Rakitić','Toni Kroos','Andrés Iniesta']],
 ['on-the-pitch-alt-3',3,['Manchester City','Liverpool','Chelsea']],
 ['olympic-headliners-4',3,['Missy Franklin','Katie Hoff','Simone Manuel']],
 ['olympic-headliners-alt-3',4,['Elaine Thompson-Herah','Veronica Campbell-Brown','Shericka Jackson']],
 ['racing-lines-5',3,['Nelson Piquet','Emerson Fittipaldi','Felipe Massa']],
 ['racing-lines-alt-3',3,['Lewis Hamilton','Sebastian Vettel','Fernando Alonso']],
 ['big-games-alt-4',3,['Presidents Cup','Solheim Cup','Walker Cup']],
 ['rule-book-5',4,['Offside','High-sticking','Interference'],'An untouched hockey shot travels from behind center ice past the goal line, missing the net. What’s usually called?'],
 ['racket-legends-alt-3',3,['Andy Roddick','Stan Wawrinka','Lleyton Hewitt']],
 ['sunday-stars-alt-3',3,['Barry Sanders','Emmitt Smith','Gale Sayers']],
 // Screen: no character-name clue with three movie titles as decoys.
 ['animated-evidence-5',3,["Howl’s Moving Castle",'Princess Mononoke','Ponyo']],
 ['animated-evidence-alt-5',3,['ParaNorman','Corpse Bride','The Boxtrolls']],
 ['small-screen-alt-3',3,['New Girl','Superstore','Abbott Elementary']],
 ['small-screen-alt-4',3,['The Office','Brooklyn Nine-Nine','Community']],
 ['small-screen-alt-5',4,['Black Mirror','Mr. Robot','Westworld']],
 ['cartoon-crew-5',3,['Benson','Muscle Man','Skips']],
 ['cartoon-crew-alt-5',3,['Wendy Corduroy','Pacifica Northwest','Candy Chiu']],
 ['secret-identities-alt-4',3,['Edward Nygma','Oswald Cobblepot','Hugo Strange']],
 ['secret-identities-alt-5',4,['Curt Connors','Norman Osborn','Adrian Toomes']],
 ['streaming-night-5',3,['DOTA: Dragon’s Blood','Cyberpunk: Edgerunners','Castlevania']],
 ['movie-night-alt-4',3,['La La Land','Birdman','Sound of Metal']],
 ['movie-night-alt-5',3,['Glass Onion','Murder on the Orient Express','Clue']],
 // Music: artist-vs-artist and songs from the same artist or genre.
 ['name-that-artist-alt-5',3,['Miguel','The Weeknd','Daniel Caesar']],
 ['name-that-artist-alt-4',3,['Childish Gambino','A$AP Rocky','Steve Lacy']],
 ['rap-city-5',4,['Jay-Z','The Notorious B.I.G.','Rakim']],
 ['rap-city-alt-5',4,['Denzel Curry','J. Cole','Joey Bada$$']],
 ['band-practice-alt-5',4,['Muse','Blur','Oasis']],
 ['album-sleeves-5',4,['Tusk','Mirage','Tango in the Night']],
 ['album-sleeves-alt-3',3,['To Pimp a Butterfly','good kid, m.A.A.d city','Mr. Morale & the Big Steppers']],
 ['sing-along-alt-4',3,['Somebody Told Me','When You Were Young','Human']],
 ['sing-along-5',3,['In the End','Breaking the Habit','Somewhere I Belong']],
 ['two-mics-3',3,['Kids See Ghosts','What a Time to Be Alive','Without Warning']],
 ['turn-it-up-5',4,['Chorus','Verse','Outro']],
 ['record-store-3',3,['The College Dropout','Late Registration','808s & Heartbreak']],
 // World: geography and history with alternatives that fit the actual question.
 ['passport-stamps-5',3,['Eswatini','Botswana','Namibia']],
 ['passport-stamps-4',4,['Cyprus','Croatia','Montenegro']],
 ['world-landmarks-alt-4',3,['Borobudur','Bagan','Prambanan']],
 ['world-landmarks-alt-5',4,['The Blue Mosque','Topkapı Palace','Süleymaniye Mosque']],
 ['historys-headliners-5',3,['Irène Joliot-Curie','Linus Pauling','John Bardeen']],
 ['historys-headliners-alt-4',3,['Clara Barton','Mary Seacole','Edith Cavell']],
 ['river-run-5',4,['Rhine','Elbe','Vistula']],
 ['river-run-alt-3',3,['Rio Grande','Columbia River','Missouri River']],
 ['map-key-alt-3',3,['Strait','Peninsula','Archipelago']],
 ['city-nicknames-alt-4',4,['Vienna','Budapest','Kraków']],
 ['flag-facts-alt-5',4,['Nepal','Sri Lanka','Mongolia']],
 ['earths-extremes-alt-3',3,['Lake Baikal','Lake Superior','Aral Sea']],
 // Nature: genuine lookalikes and near-neighbour concepts.
 ['original-venus-slow-spin',4,['Mercury','Mars','Jupiter']],
 ['planet-files-5',3,['Neptune','Saturn','Jupiter']],
 ['planet-files-alt-5',4,['Europa','Ganymede','Triton']],
 ['animal-evidence-4',3,['Beaver','Otter','Muskrat']],
 ['animal-evidence-alt-5',4,['Tarsier','Slow loris','Capuchin']],
 ['under-the-sea-alt-4',4,['Squid','Octopus','Nautilus']],
 ['under-the-sea-4',3,['Great white shark','Tiger shark','Hammerhead shark']],
 ['bug-life-alt-4',3,['Cricket','Katydid','Grasshopper']],
 ['natural-oddities-5',4,['Bongo','Kudu','Nyala']],
 ['natural-oddities-3',3,['Armadillo','Echidna','Aardvark']],
 ['body-of-evidence-alt-4',3,['Intercostal muscle','Larynx','Trachea']],
 ['body-of-evidence-alt-5',4,['Eardrum','Eustachian tube','Semicircular canals']],
 // Everyday: foods against similar foods, instruments against instruments.
 ['kitchen-counter-5',4,['Turmeric','Cardamom','Clove']],
 ['kitchen-counter-alt-5',3,['Hummus','Tzatziki','Harissa']],
 ['around-the-house-alt-5',4,['Shut-off valve','Aerator','Supply line']],
 ['tabletop-time-5',3,['Carcassonne','Ticket to Ride','Risk']],
 ['tabletop-time-alt-5',3,['Dixit','Decrypto','Taboo']],
 ['what-does-it-do-5',3,['Hygrometer','Anemometer','Altimeter']],
 ['what-does-it-do-alt-3',4,['Barometer','Hygrometer','Rain gauge']],
 ['drive-through-alt-4',3,['Chick-fil-A','Zaxby’s','Popeyes']],
 ['yes-chef-alt-3',4,['Reduce','Sauté','Simmer']],
 ['yes-chef-alt-4',3,['Poaching','Braising','Steaming']],
 ['sweet-tooth-5',4,['Fondant','Nougat','Praline']],
 ['breakfast-club-alt-5',3,['Polenta','Cream of Wheat','Oatmeal']],
 // Words, books and lore: no specialist spelling tests or grammar worksheets.
 ['story-shelf-alt-5',4,['Suzanne Collins','Madeleine L’Engle','S. E. Hinton']],
 ['greek-to-me-alt-5',4,['Perseus','Theseus','Jason']],
 ['greek-to-me-alt-4',3,['Epimetheus','Atlas','Hephaestus']],
 ['art-file-3',3,['Salvador Dalí','Diego Rivera','Joan Miró']],
 ['art-file-alt-3',3,['Roy Lichtenstein','Keith Haring','Jean-Michel Basquiat']],
 ['book-covers-alt-3',3,['The Maze Runner','Hatchet','The Giver']],
 ['book-covers-alt-5',3,['Tender Is the Night','The Catcher in the Rye','The Sun Also Rises']],
 ['fairy-tale-file-5',3,['The Pied Piper','The Miller’s Son','The Brave Little Tailor']],
 ['mythical-lineup-alt-5',4,['Manticore','Griffin','Cerberus']],
 ['make-some-art-5',4,['Tempera','Encaustic','Gouache']],
 ['puzzle-table-5',4,['Pentomino puzzle','Soma cube','Tetravex']],
 ['wordplay-3',3,['Palindrome','Acrostic','Homophone']]
];

export function trialLegacyQuestions(questions){
 const byId=new Map(questions.map(q=>[q.id,q]));
 return TRIAL_LEGACY_PICKS.map(([id,difficulty,distractors,prompt])=>{
  const q=byId.get('bench-'+id);
  if(!q)throw Error('Missing curated Trial clue: '+id);
  return {...q,...(prompt?{prompt}:{}),difficulty,distractors};
 });
}
