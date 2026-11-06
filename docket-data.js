// Original clues; source links describe the fact, not a copied television script.
// Each category is five distinct clues in increasing intended difficulty.
import {DOCKET_EXTRA_RAW} from './docket-extra-data.js';
const sourceCorrections={'Luigi':'Luigi_(character)','Fallout_(series)':'Fallout_(franchise)','Call_of_Duty:_Warzone':'Call_of_Duty:_Warzone_(2020_video_game)','Interest':'Interest_(finance)','Barry_Allen_(DC_Extended_Universe)':'Barry_Allen'};
const W=slug=>slug.startsWith('https://')?slug:'https://en.wikipedia.org/wiki/'+(sourceCorrections[slug]??slug);
const raw=[
 ['block-party','Gaming','BLOCK PARTY',[
  ['This green Minecraft mob hisses before it explodes.','Creeper','Creeper_(Minecraft)'],
  ['Ten obsidian blocks can form the minimum frame of a portal to this fiery Minecraft dimension.','The Nether','https://minecraft.wiki/w/Nether_portal','Nether'],
  ['In Minecraft, this fiery rod-dropping fortress mob supplies a key ingredient for Eyes of Ender.','Blaze','https://www.minecraft.net/en-us/article/meet-blaze'],
  ['This Minecraft enchantment repairs equipment using experience orbs.','Mending','https://minecraft.wiki/w/Mending'],
  ['This Minecraft boss is summoned with soul sand and three rare skeleton skulls from Nether fortresses.','The Wither','https://www.minecraft.net/en-us/article/meet-wither','Wither']]],
 ['game-faces','Gaming','GAME FACES',[
  ['This red-capped Nintendo plumber is Luigi’s brother.','Mario','Mario'],
  ['This speedy blue Sega mascot collects golden rings.','Sonic the Hedgehog','Sonic_the_Hedgehog_(character)','Sonic'],
  ['This green-clad hero, rather than Princess Zelda, is the usual playable protagonist of The Legend of Zelda.','Link','Link_(The_Legend_of_Zelda)'],
  ['This Tomb Raider adventurer shares her surname with a manor.','Lara Croft','Lara_Croft','Croft'],
  ['This armored Halo protagonist is a Spartan supersoldier often accompanied by the AI Cortana.','Master Chief','Master_Chief_(Halo)','John 117']]],
 ['boss-room','Gaming','GAME LOGIC',[
  ['This spiked-shell king is Mario’s long-running rival.','Bowser','Bowser'],
  ['Aboard the Skeld in this social-deduction game, crewmates try to find the impostors.','Among Us','Among_Us'],
  ['This fallen human’s journey through the Underground can end without killing any monsters in Toby Fox’s 2015 RPG.','Undertale','Undertale'],
  ['This FromSoftware game sends the Tarnished through the Lands Between to claim the title of Elden Lord.','Elden Ring','Elden_Ring'],
  ['This Portal science facility is run by the AI GLaDOS.','Aperture Science','Portal_(video_game)','Aperture']]],
 ['game-worlds','Gaming','GAME WORLDS',[
  ['A flying Battle Bus carries players into the battle royale mode of this Epic game.','Fortnite','Fortnite'],
  ['Vault dwellers explore a nuclear wasteland in this Bethesda-associated RPG series.','Fallout','Fallout_(series)'],
  ['This 2018 Rockstar western follows Arthur Morgan and the Van der Linde gang.','Red Dead Redemption 2','Red_Dead_Redemption_2','Red Dead 2'],
  ['This Valve puzzle series arms Chell with a device that links two doorways through space.','Portal','Portal_(series)'],
  ['This farming RPG begins when the player inherits a farm from their grandfather near Pelican Town.','Stardew Valley','Stardew_Valley']]],
 ['court-side','Sports','COURT SIDE',[
  ['This NBA team wears purple and gold and plays home games in Los Angeles.','Los Angeles Lakers','Los_Angeles_Lakers','Lakers'],
  ['This Chicago Bulls icon won six NBA titles and wore number 23.','Michael Jordan','Michael_Jordan','Jordan'],
  ['This Warriors guard became the first NBA player to reach 4,000 career regular-season three-pointers in March 2025.','Stephen Curry','Stephen_Curry','Steph Curry|Curry'],
  ['This Lakers star scored 100 points for Philadelphia in one NBA game in 1962.','Wilt Chamberlain','Wilt_Chamberlain','Chamberlain'],
  ['This Bucks star is nicknamed the Greek Freak.','Giannis Antetokounmpo','Giannis_Antetokounmpo','Giannis|Antetokounmpo']]],
 ['on-the-pitch','Sports','ON THE PITCH',[
  ['In association football, this player may handle the ball inside their own penalty area.','Goalkeeper','Goalkeeper_(association_football)','Goalie|Keeper'],
  ['This Argentine captain lifted the men’s World Cup trophy in 2022.','Lionel Messi','Lionel_Messi','Messi'],
  ['This country hosted the 2022 men’s FIFA World Cup.','Qatar','2022_FIFA_World_Cup'],
  ['This Portuguese star is widely known by the nickname CR7.','Cristiano Ronaldo','Cristiano_Ronaldo','Ronaldo'],
  ['This Spanish club plays at the Santiago Bernabéu Stadium.','Real Madrid','Real_Madrid_CF']]],
 ['big-games','Sports','BIG GAMES',[
  ['This championship game decides the NFL champion each season.','Super Bowl','Super_Bowl'],
  ['This annual tennis major is played on grass at the All England Club.','Wimbledon','Wimbledon_Championships','The Championships Wimbledon'],
  ['A yellow jersey identifies the overall leader in this famous French cycling race.','Tour de France','Tour_de_France'],
  ['The Stanley Cup is the championship trophy of this North American league.','National Hockey League','National_Hockey_League','NHL'],
  ['This golf tournament awards its champion a green jacket at Augusta National.','The Masters','Masters_Tournament','Masters|Masters Tournament']]],
 ['sporting-words','Sports','SPORTING WORDS',[
  ['In tennis scoring, this word means zero.','Love','Tennis_scoring_system'],
  ['In baseball, hitting the ball over the outfield fence in fair territory usually produces this score.','Home run','Home_run','Homer'],
  ['In golf, this bird-named score is one stroke under par on a hole.','Birdie','Par_(score)'],
  ['Three goals by one player in a single hockey or football match earn this name.','Hat-trick','Hat-trick','Hat trick'],
  ['In basketball, double figures in three statistical categories produce this achievement.','Triple-double','Double-double','Triple double']]],
 ['animated-evidence','Screen','ANIMATED EVIDENCE',[
  ['Woody and Buzz Lightyear are toys in this Pixar film.','Toy Story','Toy_Story'],
  ['This green ogre lives in a swamp and befriends Donkey.','Shrek','Shrek_(character)'],
  ['This Disney ice queen sings Let It Go in Frozen.','Elsa','Elsa_(Frozen)'],
  ['This Studio Ghibli film sends Chihiro to work in a bathhouse for spirits.','Spirited Away','Spirited_Away'],
  ['In Ratatouille, this rat dreams of becoming a chef.','Remy','Ratatouille_(film)','Rémy']]],
 ['movie-icons','Screen','MOVIE ICONS',[
  ['This masked Star Wars villain tells Luke that he is his father.','Darth Vader','Darth_Vader','Vader'],
  ['This archaeologist carries a whip and wears a fedora in Raiders of the Lost Ark.','Indiana Jones','Indiana_Jones','Indy'],
  ['This fictional African nation is home to Marvel’s Black Panther.','Wakanda','Wakanda'],
  ['In Back to the Future, this car brand becomes Doc Brown’s time machine.','DeLorean','DeLorean_time_machine','DMC DeLorean'],
  ['This pill color, rather than blue, lets Neo discover the truth in The Matrix.','Red','Red_pill_and_blue_pill','Red pill']]],
 ['small-screen','Screen','SMALL SCREEN',[
  ['This yellow cartoon dad lives at 742 Evergreen Terrace with Marge and their children.','Homer Simpson','Homer_Simpson','Homer'],
  ['This SpongeBob restaurant is famous for Krabby Patties.','The Krusty Krab','Krusty_Krab','Krusty Krab'],
  ['This Netflix series follows kids in Hawkins, Indiana, and a girl named Eleven.','Stranger Things','Stranger_Things'],
  ['This chemistry teacher adopts the alias Heisenberg in Breaking Bad.','Walter White','Walter_White_(Breaking_Bad)','Walt White'],
  ['This sitcom’s fictional paper company employs Michael Scott and Dwight Schrute.','Dunder Mifflin','Dunder_Mifflin']]],
 ['fantasy-file','Screen','FANTASY FILE',[
  ['This school of witchcraft and wizardry is attended by Harry Potter.','Hogwarts','Hogwarts'],
  ['This hobbit carries the One Ring toward Mount Doom.','Frodo Baggins','Frodo_Baggins','Frodo'],
  ['This lion rules Narnia in C. S. Lewis’s stories.','Aslan','Aslan'],
  ['This Tolkien creature calls the One Ring his precious.','Gollum','Gollum','Sméagol|Smeagol'],
  ['This Harry Potter map reveals people’s locations throughout Hogwarts and is opened with a solemn swear.','The Marauder’s Map','Magical_objects_in_Harry_Potter','Marauders Map|Marauder Map']]],
 ['name-that-artist','Music','NAME THAT ARTIST',[
  ['This singer released the albums 1989, Red and Folklore.','Taylor Swift','Taylor_Swift','Swift'],
  ['This Canadian artist released Take Care and Nothing Was the Same.','Drake','Drake_(musician)'],
  ['This singer’s hits include Blinding Lights and Starboy.','The Weeknd','The_Weeknd','Weeknd'],
  ['This rapper released 2014 Forest Hills Drive and The Off-Season.','J. Cole','J._Cole','J Cole|Jermaine Cole'],
  ['This rapper released the albums good kid, m.A.A.d city and To Pimp a Butterfly.','Kendrick Lamar','Kendrick_Lamar','Kendrick|Lamar']]],
 ['band-practice','Music','BAND PRACTICE',[
  ['John, Paul, George and Ringo formed this Liverpool band.','The Beatles','The_Beatles','Beatles'],
  ['Freddie Mercury was the lead singer of this Bohemian Rhapsody band.','Queen','Queen_(band)'],
  ['Kurt Cobain fronted this Seattle band behind Nevermind.','Nirvana','Nirvana_(band)'],
  ['This duo, known for Random Access Memories, performed in robot helmets.','Daft Punk','Daft_Punk'],
  ['This British band recorded The Dark Side of the Moon and The Wall.','Pink Floyd','Pink_Floyd']]],
 ['instrument-case','Music','INSTRUMENT CASE',[
  ['This keyboard instrument traditionally has 88 keys and strings struck by hammers.','Piano','Piano'],
  ['This orchestral string instrument is tucked beneath the chin and usually played with a bow.','Violin','Violin'],
  ['This brass instrument uses a long slide instead of valves to change most notes.','Trombone','Trombone'],
  ['Although often made of brass, this single-reed instrument belongs to the woodwind family.','Saxophone','Saxophone','Sax'],
  ['This large orchestral drum has a foot pedal that can change its pitch.','Timpani','Timpani','Kettledrum|Kettle drum']]],
 ['album-sleeves','Music','ALBUM SLEEVES',[
  ['This Michael Jackson album shares its name with a spooky title song and famous music video.','Thriller','Thriller_(album)'],
  ['This Nirvana album cover shows a baby swimming toward a dollar bill.','Nevermind','Nevermind'],
  ['This Beyoncé album shares its name with a lemon-based drink.','Lemonade','Lemonade_(Beyoncé_album)'],
  ['This 2019 Tyler, the Creator album is named for its central alter ego.','Igor','Igor_(album)'],
  ['This Fleetwood Mac album includes Dreams and Go Your Own Way.','Rumours','Rumours_(album)','Rumors']]],
 ['world-landmarks','World','WORLD LANDMARKS',[
  ['This Paris landmark was built for the 1889 world’s fair.','Eiffel Tower','Eiffel_Tower'],
  ['This white marble mausoleum in Agra was commissioned by Shah Jahan.','Taj Mahal','Taj_Mahal'],
  ['This Roman amphitheatre once hosted gladiatorial contests.','Colosseum','Colosseum','Coliseum|Flavian Amphitheatre'],
  ['This Inca site sits high in the Andes above Peru’s Urubamba River.','Machu Picchu','Machu_Picchu'],
  ['This Jordanian archaeological city is famous for facades carved into rose-colored rock.','Petra','Petra']]],
 ['passport-stamps','World','PASSPORT STAMPS',[
  ['This country is home to Tokyo, Kyoto and Mount Fuji.','Japan','Japan'],
  ['This country contains the cities of Rio de Janeiro and São Paulo.','Brazil','Brazil'],
  ['This country has a maple leaf at the center of its national flag.','Canada','Flag_of_Canada'],
  ['This Mediterranean island nation lies just south of Sicily and has Valletta as its capital.','Malta','Malta'],
  ['This country surrounds the separate nation of Lesotho on every side.','South Africa','Lesotho']]],
 ['historys-headliners','World','HISTORY’S HEADLINERS',[
  ['This first U.S. president appears on the one-dollar bill.','George Washington','George_Washington','Washington'],
  ['This Egyptian queen allied with Julius Caesar and Mark Antony.','Cleopatra','Cleopatra','Cleopatra VII'],
  ['This French military leader crowned himself emperor in 1804.','Napoleon Bonaparte','Napoleon','Napoleon'],
  ['This civil-rights leader delivered the I Have a Dream speech in 1963.','Martin Luther King Jr.','Martin_Luther_King_Jr.','Martin Luther King|MLK'],
  ['This scientist was the first person to win Nobel Prizes in two different scientific fields.','Marie Curie','Marie_Curie','Curie|Maria Sklodowska Curie']]],
 ['for-the-record','World','FOR THE RECORD',[
  ['This wooden hammer is used to call a meeting or court to order.','Gavel','Gavel'],
  ['This group of citizens hears evidence and delivers a verdict in a jury trial.','Jury','Jury'],
  ['This legal term means knowingly making a materially false statement under oath.','Perjury','Perjury'],
  ['This Latin legal phrase means for the public good and commonly describes free legal work.','Pro bono','Pro_bono','Pro bono publico'],
  ['This writ, named in Latin for produce the body, challenges unlawful detention.','Habeas corpus','Habeas_corpus','Writ of habeas corpus']]],
 ['planet-files','Nature','PLANET FILES',[
  ['This red planet is home to Olympus Mons.','Mars','Mars'],
  ['This largest planet has a Great Red Spot.','Jupiter','Jupiter'],
  ['This planet is famous for its bright, broad ring system.','Saturn','Saturn'],
  ['This hottest planet has a thick carbon-dioxide atmosphere and is named for a goddess of love.','Venus','Venus'],
  ['This planet rotates on its side, with an axial tilt of about 98 degrees.','Uranus','Uranus']]],
 ['animal-evidence','Nature','ANIMAL EVIDENCE',[
  ['This striped equine is native to Africa.','Zebra','Zebra'],
  ['This black-and-white bear mainly eats bamboo.','Giant panda','Giant_panda','Panda'],
  ['This egg-laying mammal has a duck-like bill and webbed feet.','Platypus','Platypus','Duck billed platypus'],
  ['This spotted big cat, rather than a leopard, is the fastest land animal.','Cheetah','Cheetah'],
  ['This amphibian, often kept as a pet, usually retains its feathery external gills as an adult.','Axolotl','Axolotl']]],
 ['under-the-sea','Nature','UNDER THE SEA',[
  ['This eight-armed mollusk has three hearts.','Octopus','Octopus'],
  ['This largest living animal is a baleen whale named for a color.','Blue whale','Blue_whale'],
  ['Male members of this horse-headed fish group carry the developing young in a pouch.','Seahorse','Seahorse','Sea horse'],
  ['This shark, despite being the largest fish, feeds by filtering plankton.','Whale shark','Whale_shark'],
  ['This tusked Arctic whale helped inspire stories about unicorn horns.','Narwhal','Narwhal','Narwhale']]],
 ['science-lab','Nature','SCIENCE LAB',[
  ['This force keeps planets in orbit and makes dropped objects fall toward Earth.','Gravity','Gravity','Gravitation'],
  ['This process lets plants use light to make sugars from water and carbon dioxide.','Photosynthesis','Photosynthesis'],
  ['This chemical element has the symbol Au.','Gold','Gold'],
  ['This organelle is often called the powerhouse of the cell.','Mitochondrion','Mitochondrion','Mitochondria'],
  ['This phenomenon splits white light into a spectrum when light passes through a prism.','Dispersion','Dispersion_(optics)','Optical dispersion']]],
 ['kitchen-counter','Everyday','KITCHEN COUNTER',[
  ['Guacamole is mainly made from this green-fleshed fruit.','Avocado','Guacamole','Avocados'],
  ['This Japanese dish features vinegared rice; raw fish is optional.','Sushi','Sushi'],
  ['This bean is the main ingredient in hummus.','Chickpea','Hummus','Chickpeas|Garbanzo bean|Garbanzo beans|Garbanzo|Garbanzos'],
  ['This spice comes from the dried stigmas of Crocus sativus flowers.','Saffron','Saffron'],
  ['This Italian dessert layers coffee-soaked ladyfingers with a mascarpone mixture.','Tiramisu','Tiramisu','Tiramisù']]],
 ['around-the-house','Everyday','AROUND THE HOUSE',[
  ['This device rings to wake you at a chosen time.','Alarm clock','Alarm_clock'],
  ['This household device uses suction to collect dust and dirt.','Vacuum cleaner','Vacuum_cleaner','Vacuum|Hoover'],
  ['This temperature-sensitive control switches heating or cooling on and off.','Thermostat','Thermostat'],
  ['This safety device detects smoke and sounds a warning.','Smoke detector','Smoke_detector','Smoke alarm'],
  ['This common two-piece fastener was inspired by burrs sticking to fur and clothing.','Hook-and-loop fastener','Hook-and-loop_fastener','Velcro|Hook and loop']]],
 ['tabletop-time','Everyday','TABLETOP TIME',[
  ['Kings, queens and bishops move across 64 squares in this board game.','Chess','Chess'],
  ['Boardwalk and Park Place are properties in the classic U.S. edition of this game.','Monopoly','Monopoly_(game)'],
  ['In this word game, players place letter tiles on a board for points.','Scrabble','Scrabble'],
  ['This game has players remove wooden blocks and stack them on top of a tower.','Jenga','Jenga'],
  ['Players build settlements and roads on a hexagonal island using brick, lumber, wool, grain and ore in this strategy game.','Catan','Catan','Settlers of Catan']]],
 ['what-does-it-do','Everyday','WHAT DOES IT DO?',[
  ['This tool’s magnetic needle points toward magnetic north.','Compass','Compass','Magnetic compass'],
  ['This device measures temperature.','Thermometer','Thermometer'],
  ['This device measures atmospheric pressure.','Barometer','Barometer'],
  ['This instrument records seismic motion from earthquakes.','Seismograph','Seismometer','Seismometer'],
  ['This navigational instrument measures the angle between a celestial object and the horizon.','Sextant','Sextant']]],
 ['wordplay','Words','WORDPLAY',[
  ['This punctuation mark ends a direct question.','Question mark','Question_mark'],
  ['This term describes a word such as level that reads the same backward and forward.','Palindrome','Palindrome'],
  ['A word formed by rearranging another word’s letters is called this.','Anagram','Anagram'],
  ['This term describes a word that imitates a sound, such as buzz or hiss.','Onomatopoeia','Onomatopoeia'],
  ['This word means a newly coined word or expression.','Neologism','Neologism']]],
 ['story-shelf','Words','STORY SHELF',[
  ['This young wizard has a lightning-shaped scar and an owl named Hedwig.','Harry Potter','Harry_Potter_(character)'],
  ['This consulting detective lives at 221B Baker Street.','Sherlock Holmes','Sherlock_Holmes','Holmes'],
  ['This author wrote The Cat in the Hat and Green Eggs and Ham.','Dr. Seuss','Dr._Seuss','Seuss|Theodor Geisel'],
  ['This dystopian novel has Katniss Everdeen volunteer to take her sister’s place in a televised contest.','The Hunger Games','The_Hunger_Games_(novel)','Hunger Games'],
  ['This Ray Bradbury novel takes its title from a temperature associated with burning paper.','Fahrenheit 451','Fahrenheit_451']]],
 ['greek-to-me','Words','GREEK TO ME',[
  ['This Greek god of thunder rules from Mount Olympus.','Zeus','Zeus'],
  ['This Greek sea god carries a trident.','Poseidon','Poseidon'],
  ['This snake-haired Gorgon could turn onlookers to stone.','Medusa','Medusa'],
  ['This Greek hero’s vulnerable heel gives its name to a common expression for a weakness.','Achilles','Achilles'],
  ['This craftsperson built the Labyrinth and made wings for himself and his son Icarus.','Daedalus','Daedalus']]],
 ['art-file','Words','ART FILE',[
  ['This Leonardo da Vinci portrait is famous for its subject’s mysterious smile.','Mona Lisa','Mona_Lisa'],
  ['This Vincent van Gogh painting shows a swirling night sky above a village.','The Starry Night','The_Starry_Night','Starry Night'],
  ['This Norwegian artist painted The Scream.','Edvard Munch','Edvard_Munch','Munch'],
  ['This Spanish artist painted the anti-war work Guernica.','Pablo Picasso','Guernica_(Picasso)','Picasso'],
  ['This Salvador Dalí painting features melting pocket watches.','The Persistence of Memory','The_Persistence_of_Memory','Persistence of Memory']]]
];
export const DOCKET_CATEGORIES=[...raw,...DOCKET_EXTRA_RAW].map(([id,family,title,clues])=>({id,family,title,clues:clues.map(([prompt,answer,slug,aliases=''],row)=>({id:id+'-'+(row+1),category:title,family,prompt,answer,aliases:aliases.split('|').filter(Boolean),source:W(slug)}))}));
export const DOCKET_FINALS=[
 ['monopoly-final','BOARD GAMES','In the classic U.S. Monopoly board, this property lies between the Short Line railroad and Luxury Tax.','Park Place','Monopoly_(game)'],
 ['space-final','SPACE','This moon of Saturn has lakes and seas of liquid methane and ethane on its surface.','Titan','Titan_(moon)'],
 ['screen-final','MOVIE MACHINES','This film’s title robot is a Waste Allocation Load Lifter: Earth-Class.','WALL-E','WALL-E','Wall E|Walle'],
 ['music-final','MUSIC HISTORY','This band’s final public live performance took place on a London rooftop in January 1969.','The Beatles','The_Beatles%27_rooftop_concert','Beatles'],
 ['world-final','WORLD WONDERS','This ancient wonder guided sailors to an Egyptian port before being destroyed by earthquakes.','Lighthouse of Alexandria','Lighthouse_of_Alexandria','Pharos|Alexandria Lighthouse'],
 ['sports-final','SPORTING TROPHIES','The men’s World Cup trophy awarded before 1974 was named for this former FIFA president.','Jules Rimet','Jules_Rimet_Trophy','Rimet'],
 ['gaming-final','VIDEO GAME LEGENDS','This Nintendo bounty hunter’s armor initially concealed that she was a woman at the end of the original Metroid.','Samus Aran','Samus_Aran','Samus'],
 ['nature-final','ANIMAL WORDS','The name of this long-necked dinosaur literally means arm lizard, referring to its unusually long forelimbs.','Brachiosaurus','Brachiosaurus'],
 ['history-final','NAMES THAT STUCK','The teddy bear was named after this U.S. president following a 1902 hunting incident.','Theodore Roosevelt','Teddy_bear','Teddy Roosevelt|Roosevelt'],
 ['words-final','FICTIONAL PLACES','Thomas More coined this word for an imaginary ideal society; its Greek roots suggest no place.','Utopia','Utopia'],
 ['film-final','MOVIE FIRSTS','This South Korean film became the first non-English-language film to win the Academy Award for Best Picture.','Parasite','Parasite_(2019_film)'],
 ['art-final','PAINTERS','This artist painted The Bedroom and The Starry Night while living in southern France.','Vincent van Gogh','Vincent_van_Gogh','Van Gogh|Vincent VanGogh'],
 ['hosts-final','HOST COUNTRIES','This country hosted the 2014 Winter Olympics in Sochi and the 2018 men’s FIFA World Cup.','Russia','Sport_in_Russia','Russian Federation'],
 ['novel-final','OPENING LINES','This Dickens novel begins with a passage contrasting the best of times and the worst of times.','A Tale of Two Cities','A_Tale_of_Two_Cities','Tale of Two Cities'],
 ['stealth-final','GAME FRANCHISES','Solid Snake and Big Boss are central characters in this Hideo Kojima stealth-action franchise.','Metal Gear','Metal_Gear','Metal Gear Solid'],
 ['earth-final','WHAT’S IN A NAME?','This ocean’s name comes from Ferdinand Magellan’s description of its peaceful waters.','Pacific Ocean','Pacific_Ocean','Pacific']
].map(([id,category,prompt,answer,slug,aliases=''])=>({id,category,prompt,answer,source:W(slug),aliases:aliases.split('|').filter(Boolean)}));
export const DOCKET_TIES=[
 ['tie-one','TIEBREAKER','This element makes up most of the Sun by mass.','Hydrogen','Sun'],
 ['tie-two','TIEBREAKER','This Italian city has canals, gondolas and St. Mark’s Square.','Venice','Venice'],
 ['tie-three','TIEBREAKER','This character is Bugs Bunny’s frequent shotgun-carrying hunter.','Elmer Fudd','Elmer_Fudd'],
 ['tie-four','TIEBREAKER','This geometric shape has three sides.','Triangle','Triangle'],
 ['tie-five','TIEBREAKER','This Greek letter is the name of the ratio of a circle’s circumference to its diameter.','Pi','Pi'],
 ['tie-six','TIEBREAKER','This chess piece moves in an L shape and can jump over other pieces.','Knight','Knight_(chess)'],
 ['tie-seven','TIEBREAKER','This Italian dish is made from rice slowly cooked in broth until creamy.','Risotto','Risotto'],
 ['tie-eight','TIEBREAKER','This ancient Greek city-state is strongly associated with the early development of democracy.','Athens','Athenian_democracy']
].map(([id,category,prompt,answer,slug])=>({id,category,prompt,answer,source:W(slug),aliases:[]}));
export const DOCKET_BY_ID=new Map([...DOCKET_CATEGORIES.flatMap(c=>c.clues),...DOCKET_FINALS,...DOCKET_TIES].map(q=>[q.id,q]));
