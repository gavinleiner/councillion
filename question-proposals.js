// Proposed prompts for preference review, not playable or complete answer banks.
export const QUESTION_REVIEW_VERSION='group-100-v1';
export const QUESTION_PROPOSALS=[
  {
    "id": "q001",
    "family": "gaming",
    "prompt": "Name a video game where you can play as an animal.",
    "scope": "Animal protagonists and selectable animal characters count; fictional animal species count.",
    "examples": [
      "Sonic the Hedgehog",
      "Donkey Kong Country",
      "Stray",
      "Untitled Goose Game",
      "Goat Simulator",
      "Crash Bandicoot"
    ],
    "sources": [
      "nintendo"
    ],
    "status": "proposal"
  },
  {
    "id": "q002",
    "family": "gaming",
    "prompt": "Name a video game where you can drive a car or kart.",
    "scope": "The driving must be part of the unmodded game, not a fan modification.",
    "examples": [
      "Mario Kart 8 Deluxe",
      "Grand Theft Auto V",
      "Forza Horizon 5",
      "Rocket League",
      "Fortnite",
      "Gran Turismo 7"
    ],
    "sources": [
      "nintendo",
      "fortnite"
    ],
    "status": "proposal"
  },
  {
    "id": "q003",
    "family": "gaming",
    "prompt": "Name a free-to-play PC or console game.",
    "scope": "Games with an officially free base version count; a temporary free weekend does not.",
    "examples": [
      "Fortnite",
      "Rocket League",
      "Valorant",
      "Apex Legends",
      "Warframe",
      "Fall Guys"
    ],
    "sources": [
      "fortnite",
      "epic"
    ],
    "status": "proposal"
  },
  {
    "id": "q004",
    "family": "gaming",
    "prompt": "Name a video game you can play with someone on the same screen or console.",
    "scope": "Local co-op, split-screen and shared-screen multiplayer count.",
    "examples": [
      "Minecraft",
      "Mario Kart 8 Deluxe",
      "Overcooked 2",
      "It Takes Two",
      "Portal 2",
      "Stardew Valley"
    ],
    "sources": [
      "nintendo",
      "epic"
    ],
    "status": "proposal"
  },
  {
    "id": "q005",
    "family": "gaming",
    "prompt": "Name a video game with a crafting system.",
    "scope": "The player must be able to combine resources into an item in normal gameplay.",
    "examples": [
      "Minecraft",
      "Terraria",
      "Subnautica",
      "Rust",
      "Stardew Valley",
      "Animal Crossing: New Horizons"
    ],
    "sources": [
      "minecraft",
      "nintendo"
    ],
    "status": "proposal"
  },
  {
    "id": "q006",
    "family": "gaming",
    "prompt": "Name a video game where the player can go fishing.",
    "scope": "A player-controlled fishing activity counts, including optional minigames.",
    "examples": [
      "Minecraft",
      "Stardew Valley",
      "Animal Crossing: New Horizons",
      "Terraria",
      "Red Dead Redemption 2",
      "Fortnite"
    ],
    "sources": [
      "minecraft",
      "nintendo",
      "fortnite"
    ],
    "status": "proposal"
  },
  {
    "id": "q007",
    "family": "gaming",
    "prompt": "Name a villain from a video game.",
    "scope": "Named antagonists from any era or platform count; no voice-actor names.",
    "examples": [
      "Bowser",
      "Ganondorf",
      "Dr. Eggman",
      "Sephiroth",
      "Handsome Jack",
      "Vaas Montenegro"
    ],
    "sources": [
      "nintendo",
      "playstation"
    ],
    "status": "proposal"
  },
  {
    "id": "q008",
    "family": "gaming",
    "prompt": "Name an item that restores health in a video game.",
    "scope": "Named consumables, pickups and healing items count; name the actual item.",
    "examples": [
      "Golden Apple",
      "Estus Flask",
      "Med Kit",
      "Heart Container",
      "Red Potion",
      "First Aid Spray"
    ],
    "sources": [
      "minecraft",
      "fortnite",
      "nintendo"
    ],
    "status": "proposal"
  },
  {
    "id": "q009",
    "family": "gaming",
    "prompt": "Name a named weapon from a video game.",
    "scope": "Unique named weapons and established weapon/item names count across all platforms.",
    "examples": [
      "Master Sword",
      "Energy Sword",
      "BFG 9000",
      "Diamond Sword",
      "Blades of Chaos",
      "Lancer"
    ],
    "sources": [
      "nintendo",
      "minecraft",
      "playstation"
    ],
    "status": "proposal"
  },
  {
    "id": "q010",
    "family": "gaming",
    "prompt": "Name a named place or map from a video game.",
    "scope": "Named maps, towns, regions and locations count; ordinary real-world cities need a named in-game setting.",
    "examples": [
      "Tilted Towers",
      "Nuketown",
      "Dust II",
      "Los Santos",
      "Hyrule",
      "Raccoon City"
    ],
    "sources": [
      "fortnite",
      "nintendo"
    ],
    "status": "proposal"
  },
  {
    "id": "q011",
    "family": "gaming",
    "prompt": "Name a Minecraft mob that can attack a player.",
    "scope": "Vanilla hostile mobs and neutral mobs that attack when provoked count.",
    "examples": [
      "Creeper",
      "Zombie",
      "Skeleton",
      "Witch",
      "Enderman",
      "Piglin"
    ],
    "sources": [
      "minecraft"
    ],
    "status": "proposal"
  },
  {
    "id": "q012",
    "family": "gaming",
    "prompt": "Name something a player can eat in Minecraft.",
    "scope": "Vanilla food items count, including foods with negative effects.",
    "examples": [
      "Bread",
      "Cooked Beef",
      "Golden Apple",
      "Cake",
      "Pumpkin Pie",
      "Suspicious Stew"
    ],
    "sources": [
      "minecraft"
    ],
    "status": "proposal"
  },
  {
    "id": "q013",
    "family": "gaming",
    "prompt": "Name something you can craft using wood, planks or sticks in Minecraft.",
    "scope": "Any vanilla recipe that directly uses a log, plank or stick counts.",
    "examples": [
      "Crafting Table",
      "Chest",
      "Boat",
      "Ladder",
      "Wooden Sword",
      "Fence"
    ],
    "sources": [
      "minecraft"
    ],
    "status": "proposal"
  },
  {
    "id": "q014",
    "family": "gaming",
    "prompt": "Name a location that has appeared on a Fortnite Battle Royale map.",
    "scope": "Named locations from any past or present Battle Royale season count.",
    "examples": [
      "Tilted Towers",
      "Pleasant Park",
      "Retail Row",
      "Lazy Lake",
      "Frenzy Farm",
      "Sweaty Sands"
    ],
    "sources": [
      "fortnite"
    ],
    "status": "proposal"
  },
  {
    "id": "q015",
    "family": "gaming",
    "prompt": "Name a Fortnite item that restores health or shields.",
    "scope": "Battle Royale consumables from any season count, including vaulted items.",
    "examples": [
      "Bandage",
      "Med Kit",
      "Small Shield Potion",
      "Shield Potion",
      "Chug Jug",
      "Slurp Juice"
    ],
    "sources": [
      "fortnite"
    ],
    "status": "proposal"
  },
  {
    "id": "q016",
    "family": "gaming",
    "prompt": "Name a weapon that has appeared in Fortnite Battle Royale.",
    "scope": "Any season counts; ordinary loot, Mythic and vaulted weapons all count.",
    "examples": [
      "Assault Rifle",
      "Pump Shotgun",
      "Tactical Shotgun",
      "Minigun",
      "Rocket Launcher",
      "Hunting Rifle"
    ],
    "sources": [
      "fortnite"
    ],
    "status": "proposal"
  },
  {
    "id": "q017",
    "family": "gaming",
    "prompt": "Name a character from the Mario games.",
    "scope": "Characters from Mario games and their spin-offs count; actor names do not.",
    "examples": [
      "Luigi",
      "Yoshi",
      "Bowser",
      "Princess Peach",
      "Toad",
      "Wario"
    ],
    "sources": [
      "nintendo"
    ],
    "status": "proposal"
  },
  {
    "id": "q018",
    "family": "gaming",
    "prompt": "Name one of the original 151 Pokémon.",
    "scope": "The original species names count; you do not need to name a special form.",
    "examples": [
      "Pikachu",
      "Bulbasaur",
      "Squirtle",
      "Eevee",
      "Snorlax",
      "Mewtwo"
    ],
    "sources": [
      "pokemon"
    ],
    "status": "proposal"
  },
  {
    "id": "q019",
    "family": "gaming",
    "prompt": "Name a boss from Elden Ring.",
    "scope": "The base game and Shadow of the Erdtree count; common short boss names would be aliases.",
    "examples": [
      "Margit",
      "Godrick",
      "Radahn",
      "Rennala",
      "Malenia",
      "Rykard"
    ],
    "sources": [
      "elden"
    ],
    "status": "proposal"
  },
  {
    "id": "q020",
    "family": "gaming",
    "prompt": "Name a board or card game people can play together offline.",
    "scope": "Published games and traditional named games count; video games do not.",
    "examples": [
      "Monopoly",
      "Uno",
      "Catan",
      "Jenga",
      "Chess",
      "Exploding Kittens"
    ],
    "sources": [
      "hasbro"
    ],
    "status": "proposal"
  },
  {
    "id": "q021",
    "family": "sports",
    "prompt": "Name a team from the NFL, NBA, MLB, NHL, WNBA or MLS.",
    "scope": "Past and present teams from those six leagues count; familiar short team names would be accepted.",
    "examples": [
      "Carolina Panthers",
      "Boston Celtics",
      "New York Yankees",
      "Carolina Hurricanes",
      "Las Vegas Aces",
      "Inter Miami"
    ],
    "sources": [
      "nfl",
      "nba",
      "mlb",
      "nhl"
    ],
    "status": "proposal"
  },
  {
    "id": "q022",
    "family": "sports",
    "prompt": "Name an athlete who has played professionally in a team sport.",
    "scope": "Men's and women's sports, any country and any era count; no roster-year restriction.",
    "examples": [
      "LeBron James",
      "Tom Brady",
      "Lionel Messi",
      "Sidney Crosby",
      "Caitlin Clark",
      "Shohei Ohtani"
    ],
    "sources": [
      "nba",
      "nfl",
      "mlb"
    ],
    "status": "proposal"
  },
  {
    "id": "q023",
    "family": "sports",
    "prompt": "Name a sport or competitive game played with a ball.",
    "scope": "A ball must be part of normal play; variations with their own established names count.",
    "examples": [
      "Basketball",
      "Soccer",
      "Cricket",
      "Volleyball",
      "Rugby",
      "Water Polo"
    ],
    "sources": [
      "olympics"
    ],
    "status": "proposal"
  },
  {
    "id": "q024",
    "family": "sports",
    "prompt": "Name a sport played with a racket, bat, stick or club.",
    "scope": "Any one of those implements qualifies; named sport variants count.",
    "examples": [
      "Tennis",
      "Baseball",
      "Golf",
      "Ice Hockey",
      "Badminton",
      "Table Tennis"
    ],
    "sources": [
      "olympics"
    ],
    "status": "proposal"
  },
  {
    "id": "q025",
    "family": "sports",
    "prompt": "Name a sport or event that has appeared at the modern Olympics.",
    "scope": "Summer and Winter Games count, including discontinued events.",
    "examples": [
      "Swimming",
      "Skateboarding",
      "Curling",
      "Ski Jumping",
      "Fencing",
      "BMX Racing"
    ],
    "sources": [
      "olympics"
    ],
    "status": "proposal"
  },
  {
    "id": "q026",
    "family": "sports",
    "prompt": "Name an athlete who has won an Olympic gold medal.",
    "scope": "Any modern Summer or Winter Games count; team-event gold medals count too.",
    "examples": [
      "Michael Phelps",
      "Simone Biles",
      "Usain Bolt",
      "Katie Ledecky",
      "Shaun White",
      "Serena Williams"
    ],
    "sources": [
      "olympics"
    ],
    "status": "proposal"
  },
  {
    "id": "q027",
    "family": "sports",
    "prompt": "Name a brand that makes athletic shoes.",
    "scope": "Real sports-footwear brands count, including specialist running and court-shoe brands.",
    "examples": [
      "Nike",
      "Adidas",
      "Puma",
      "Reebok",
      "New Balance",
      "ASICS"
    ],
    "sources": [
      "sportsbrands"
    ],
    "status": "proposal"
  },
  {
    "id": "q028",
    "family": "sports",
    "prompt": "Name a player position in a team sport.",
    "scope": "Named playing positions from any established team sport count; shared names are one answer.",
    "examples": [
      "Quarterback",
      "Goalkeeper",
      "Pitcher",
      "Point Guard",
      "Striker",
      "Libero"
    ],
    "sources": [
      "nfl",
      "olympics"
    ],
    "status": "proposal"
  },
  {
    "id": "q029",
    "family": "sports",
    "prompt": "Name a professional sports team whose name includes an animal.",
    "scope": "Any professional league or country counts; the animal must appear in the team name.",
    "examples": [
      "Chicago Bulls",
      "Miami Dolphins",
      "Detroit Tigers",
      "Pittsburgh Penguins",
      "Carolina Panthers",
      "Anaheim Ducks"
    ],
    "sources": [
      "nba",
      "nfl",
      "mlb",
      "nhl"
    ],
    "status": "proposal"
  },
  {
    "id": "q030",
    "family": "sports",
    "prompt": "Name a stadium, arena or racetrack used for professional sports.",
    "scope": "Named venues anywhere in the world count; past venue names would be aliases.",
    "examples": [
      "Wembley Stadium",
      "Madison Square Garden",
      "Fenway Park",
      "Old Trafford",
      "Wrigley Field",
      "Indianapolis Motor Speedway"
    ],
    "sources": [
      "venues"
    ],
    "status": "proposal"
  },
  {
    "id": "q031",
    "family": "sports",
    "prompt": "Name a piece of equipment an athlete wears.",
    "scope": "Protective gear, specialist footwear and worn sporting equipment count; handheld equipment does not.",
    "examples": [
      "Helmet",
      "Shin Guards",
      "Mouthguard",
      "Cleats",
      "Goggles",
      "Boxing Gloves"
    ],
    "sources": [
      "olympics"
    ],
    "status": "proposal"
  },
  {
    "id": "q032",
    "family": "sports",
    "prompt": "Name an athlete featured on a video game's cover or in its title.",
    "scope": "An officially released sports game's cover athlete or title namesake qualifies.",
    "examples": [
      "Michael Jordan",
      "Tom Brady",
      "Lionel Messi",
      "Tony Hawk",
      "Tiger Woods",
      "Serena Williams"
    ],
    "sources": [
      "easports",
      "playstation"
    ],
    "status": "proposal"
  },
  {
    "id": "q033",
    "family": "culture",
    "prompt": "Name a movie that is a sequel to another movie.",
    "scope": "Direct sequels count, even if there is no number in the title.",
    "examples": [
      "Shrek 2",
      "Toy Story 2",
      "Spider-Man 2",
      "Finding Dory",
      "John Wick: Chapter 2",
      "Home Alone 2"
    ],
    "sources": [
      "pixar",
      "disney"
    ],
    "status": "proposal"
  },
  {
    "id": "q034",
    "family": "culture",
    "prompt": "Name a movie based on a video game.",
    "scope": "Released feature films count, including animation; a game based on a movie is the reverse and does not qualify.",
    "examples": [
      "Sonic the Hedgehog",
      "The Super Mario Bros. Movie",
      "A Minecraft Movie",
      "Mortal Kombat",
      "Detective Pikachu",
      "Resident Evil"
    ],
    "sources": [
      "nintendo",
      "pokemon",
      "warner"
    ],
    "status": "proposal"
  },
  {
    "id": "q035",
    "family": "culture",
    "prompt": "Name a movie with scenes set in outer space.",
    "scope": "Some of the story must take place beyond Earth's atmosphere.",
    "examples": [
      "Star Wars",
      "Alien",
      "Interstellar",
      "The Martian",
      "Guardians of the Galaxy",
      "Gravity"
    ],
    "sources": [
      "disney",
      "nasa"
    ],
    "status": "proposal"
  },
  {
    "id": "q036",
    "family": "culture",
    "prompt": "Name an animated movie with talking animal characters.",
    "scope": "Animal characters that speak qualify; they do not have to be the main character.",
    "examples": [
      "The Lion King",
      "Finding Nemo",
      "Zootopia",
      "Madagascar",
      "Kung Fu Panda",
      "Ice Age"
    ],
    "sources": [
      "disney",
      "pixar"
    ],
    "status": "proposal"
  },
  {
    "id": "q037",
    "family": "culture",
    "prompt": "Name a superhero movie.",
    "scope": "Live action and animation count; heroes from any publisher or original story count.",
    "examples": [
      "Iron Man",
      "Batman",
      "Black Panther",
      "Spider-Man",
      "Wonder Woman",
      "The Incredibles"
    ],
    "sources": [
      "disney",
      "dc",
      "pixar"
    ],
    "status": "proposal"
  },
  {
    "id": "q038",
    "family": "culture",
    "prompt": "Name an animated TV series.",
    "scope": "Shows for any audience count, including cartoons, anime and streaming series.",
    "examples": [
      "SpongeBob SquarePants",
      "The Simpsons",
      "Adventure Time",
      "Gravity Falls",
      "Regular Show",
      "Avatar: The Last Airbender"
    ],
    "sources": [
      "disney",
      "nick"
    ],
    "status": "proposal"
  },
  {
    "id": "q039",
    "family": "culture",
    "prompt": "Name a sitcom.",
    "scope": "Live-action and animated situation comedies count; sketch-only shows do not.",
    "examples": [
      "Friends",
      "The Office",
      "Modern Family",
      "Seinfeld",
      "Brooklyn Nine-Nine",
      "The Big Bang Theory"
    ],
    "sources": [
      "tv"
    ],
    "status": "proposal"
  },
  {
    "id": "q040",
    "family": "culture",
    "prompt": "Name a movie or TV character with superpowers.",
    "scope": "A named character must have a supernatural or superhuman ability in the story.",
    "examples": [
      "Superman",
      "Elsa",
      "Eleven",
      "Spider-Man",
      "The Flash",
      "Doctor Strange"
    ],
    "sources": [
      "dc",
      "disney"
    ],
    "status": "proposal"
  },
  {
    "id": "q041",
    "family": "culture",
    "prompt": "Name a fictional robot.",
    "scope": "Robots and droids from films, TV, books or games count; actors and real-world robots do not.",
    "examples": [
      "WALL-E",
      "R2-D2",
      "C-3PO",
      "Optimus Prime",
      "Baymax",
      "Bender"
    ],
    "sources": [
      "pixar",
      "disney"
    ],
    "status": "proposal"
  },
  {
    "id": "q042",
    "family": "culture",
    "prompt": "Name a fictional animal character.",
    "scope": "Named animal characters from any published story count; real celebrity pets do not.",
    "examples": [
      "Scooby-Doo",
      "Snoopy",
      "Garfield",
      "Simba",
      "Paddington",
      "Winnie the Pooh"
    ],
    "sources": [
      "disney",
      "warner"
    ],
    "status": "proposal"
  },
  {
    "id": "q043",
    "family": "culture",
    "prompt": "Name an actor who appears in a Marvel Cinematic Universe movie.",
    "scope": "Released MCU feature films count; voice and motion-capture performances count too.",
    "examples": [
      "Robert Downey Jr.",
      "Chris Evans",
      "Scarlett Johansson",
      "Tom Holland",
      "Zendaya",
      "Elizabeth Olsen"
    ],
    "sources": [
      "disney"
    ],
    "status": "proposal"
  },
  {
    "id": "q044",
    "family": "culture",
    "prompt": "Name a villain from a children's animated TV series.",
    "scope": "Named antagonists count even if they sometimes help the heroes.",
    "examples": [
      "Plankton",
      "Mojo Jojo",
      "Bill Cipher",
      "Azula",
      "Dr. Doofenshmirtz",
      "HIM"
    ],
    "sources": [
      "nick",
      "disney",
      "warner"
    ],
    "status": "proposal"
  },
  {
    "id": "q045",
    "family": "culture",
    "prompt": "Name a fictional city or town from a movie or TV show.",
    "scope": "A real place's fictional version qualifies only when it is clearly part of that story's setting.",
    "examples": [
      "Gotham City",
      "Metropolis",
      "Springfield",
      "Bikini Bottom",
      "Hawkins",
      "South Park"
    ],
    "sources": [
      "dc",
      "nick",
      "tv"
    ],
    "status": "proposal"
  },
  {
    "id": "q046",
    "family": "culture",
    "prompt": "Name a horror movie villain or monster.",
    "scope": "Named villains, creatures and monster species from horror films count.",
    "examples": [
      "Freddy Krueger",
      "Jason Voorhees",
      "Chucky",
      "Xenomorph",
      "Pennywise",
      "Michael Myers"
    ],
    "sources": [
      "warner",
      "horror"
    ],
    "status": "proposal"
  },
  {
    "id": "q047",
    "family": "music",
    "prompt": "Name a song with a person's name in its title.",
    "scope": "Released songs count; the name can be a real person or a fictional person.",
    "examples": [
      "Billie Jean",
      "Jolene",
      "Hey Jude",
      "Roxanne",
      "Sweet Caroline",
      "Stan"
    ],
    "sources": [
      "music"
    ],
    "status": "proposal"
  },
  {
    "id": "q048",
    "family": "music",
    "prompt": "Name a song with a color in its title.",
    "scope": "Ordinary color words in released song titles count; color names used as surnames need context.",
    "examples": [
      "Purple Rain",
      "Yellow",
      "Back in Black",
      "Red",
      "Blue Suede Shoes",
      "Paint It Black"
    ],
    "sources": [
      "music"
    ],
    "status": "proposal"
  },
  {
    "id": "q049",
    "family": "music",
    "prompt": "Name a musical artist or band with a number in their name.",
    "scope": "Numbers written as digits, words or Roman numerals count.",
    "examples": [
      "Maroon 5",
      "Blink-182",
      "Twenty One Pilots",
      "One Direction",
      "U2",
      "Three Days Grace"
    ],
    "sources": [
      "music"
    ],
    "status": "proposal"
  },
  {
    "id": "q050",
    "family": "music",
    "prompt": "Name a music group with at least three members.",
    "scope": "Bands and vocal groups from any era count; a solo artist's unnamed backing band does not.",
    "examples": [
      "Queen",
      "The Beatles",
      "BTS",
      "Metallica",
      "ABBA",
      "One Direction"
    ],
    "sources": [
      "music"
    ],
    "status": "proposal"
  },
  {
    "id": "q051",
    "family": "music",
    "prompt": "Name a rapper, past or present.",
    "scope": "Released professional hip-hop artists count; established stage names would be aliases.",
    "examples": [
      "Kendrick Lamar",
      "Drake",
      "Nicki Minaj",
      "Eminem",
      "Missy Elliott",
      "J. Cole"
    ],
    "sources": [
      "music"
    ],
    "status": "proposal"
  },
  {
    "id": "q052",
    "family": "music",
    "prompt": "Name a music festival.",
    "scope": "Named public music festivals anywhere in the world count; a one-off concert does not.",
    "examples": [
      "Coachella",
      "Glastonbury",
      "Lollapalooza",
      "Bonnaroo",
      "Rolling Loud",
      "Tomorrowland"
    ],
    "sources": [
      "festivals"
    ],
    "status": "proposal"
  },
  {
    "id": "q053",
    "family": "music",
    "prompt": "Name an act that has performed during a Super Bowl halftime show.",
    "scope": "Headliners and featured musical guests count; pregame anthem performances alone do not.",
    "examples": [
      "Rihanna",
      "Prince",
      "Beyoncé",
      "Coldplay",
      "Bruno Mars",
      "Shakira"
    ],
    "sources": [
      "halftime"
    ],
    "status": "proposal"
  },
  {
    "id": "q054",
    "family": "music",
    "prompt": "Name a musician known professionally by one name.",
    "scope": "An established one-word stage name counts even when their legal name has several words.",
    "examples": [
      "Prince",
      "Madonna",
      "Drake",
      "Adele",
      "Rihanna",
      "Beyoncé"
    ],
    "sources": [
      "music"
    ],
    "status": "proposal"
  },
  {
    "id": "q055",
    "family": "music",
    "prompt": "Name a song written for or performed in a movie musical.",
    "scope": "Songs sung as part of the story count; incidental background radio songs do not.",
    "examples": [
      "Let It Go",
      "We Don't Talk About Bruno",
      "Hakuna Matata",
      "This Is Me",
      "Mamma Mia",
      "Under the Sea"
    ],
    "sources": [
      "disney",
      "music"
    ],
    "status": "proposal"
  },
  {
    "id": "q056",
    "family": "music",
    "prompt": "Name a musical instrument played by blowing air into it.",
    "scope": "Mouth-blown instruments count, including reed, brass and free-reed instruments.",
    "examples": [
      "Flute",
      "Trumpet",
      "Clarinet",
      "Harmonica",
      "Bagpipes",
      "Saxophone"
    ],
    "sources": [
      "instruments"
    ],
    "status": "proposal"
  },
  {
    "id": "q057",
    "family": "food",
    "prompt": "Name something sold as a pizza topping.",
    "scope": "Established restaurant toppings count worldwide; you do not need to name a pizza brand.",
    "examples": [
      "Pepperoni",
      "Mushrooms",
      "Olives",
      "Pineapple",
      "Sausage",
      "Jalapeños"
    ],
    "sources": [
      "pizza"
    ],
    "status": "proposal"
  },
  {
    "id": "q058",
    "family": "food",
    "prompt": "Name something people put inside a sandwich.",
    "scope": "Established sandwich fillings count, including spreads and condiments.",
    "examples": [
      "Ham",
      "Tuna",
      "Peanut Butter",
      "Egg",
      "Cheese",
      "Falafel"
    ],
    "sources": [
      "recipes"
    ],
    "status": "proposal"
  },
  {
    "id": "q059",
    "family": "food",
    "prompt": "Name a food commonly cooked by frying.",
    "scope": "Named foods and dishes count; a one-off experiment is not enough.",
    "examples": [
      "French Fries",
      "Fried Chicken",
      "Doughnuts",
      "Tempura",
      "Falafel",
      "Onion Rings"
    ],
    "sources": [
      "recipes"
    ],
    "status": "proposal"
  },
  {
    "id": "q060",
    "family": "food",
    "prompt": "Name a food commonly served on a stick.",
    "scope": "Named foods and established skewer dishes count, including sweets.",
    "examples": [
      "Corn Dog",
      "Popsicle",
      "Lollipop",
      "Satay",
      "Yakitori",
      "Tanghulu"
    ],
    "sources": [
      "recipes"
    ],
    "status": "proposal"
  },
  {
    "id": "q061",
    "family": "food",
    "prompt": "Name a named breakfast food or breakfast dish.",
    "scope": "Named breakfast foods and dishes from any country count; plain beverages are separate.",
    "examples": [
      "Pancakes",
      "Waffles",
      "French Toast",
      "Omelette",
      "Congee",
      "Shakshuka"
    ],
    "sources": [
      "recipes"
    ],
    "status": "proposal"
  },
  {
    "id": "q062",
    "family": "food",
    "prompt": "Name a pasta shape.",
    "scope": "Named pasta shapes count; sauces and full dishes are separate.",
    "examples": [
      "Spaghetti",
      "Penne",
      "Fusilli",
      "Farfalle",
      "Rigatoni",
      "Orecchiette"
    ],
    "sources": [
      "pasta"
    ],
    "status": "proposal"
  },
  {
    "id": "q063",
    "family": "food",
    "prompt": "Name a named type of bread.",
    "scope": "Named breads, rolls and flatbreads count; filling-only variations do not create a new bread.",
    "examples": [
      "Baguette",
      "Naan",
      "Pita",
      "Focaccia",
      "Challah",
      "Sourdough"
    ],
    "sources": [
      "recipes"
    ],
    "status": "proposal"
  },
  {
    "id": "q064",
    "family": "food",
    "prompt": "Name a candy or chocolate brand.",
    "scope": "Brands and named candy products count; ordinary flavor names alone do not.",
    "examples": [
      "Kit Kat",
      "Skittles",
      "Snickers",
      "Haribo",
      "Reese's",
      "Sour Patch Kids"
    ],
    "sources": [
      "candy"
    ],
    "status": "proposal"
  },
  {
    "id": "q065",
    "family": "food",
    "prompt": "Name a fast-food or fast-casual restaurant chain.",
    "scope": "Real multi-location restaurant chains count worldwide; local independents do not.",
    "examples": [
      "McDonald's",
      "Taco Bell",
      "Wendy's",
      "Chipotle",
      "Popeyes",
      "Jollibee"
    ],
    "sources": [
      "restaurants"
    ],
    "status": "proposal"
  },
  {
    "id": "q066",
    "family": "food",
    "prompt": "Name a drink you can order at a coffee shop.",
    "scope": "Established drink names count, including non-coffee drinks; every flavor combination would not be a separate answer.",
    "examples": [
      "Latte",
      "Cappuccino",
      "Americano",
      "Mocha",
      "Chai Latte",
      "Hot Chocolate"
    ],
    "sources": [
      "coffee"
    ],
    "status": "proposal"
  },
  {
    "id": "q067",
    "family": "food",
    "prompt": "Name a dish made mainly from potatoes.",
    "scope": "Named dishes count when potato is a main ingredient rather than a garnish.",
    "examples": [
      "Hash Browns",
      "Gnocchi",
      "Potato Salad",
      "Latkes",
      "Patatas Bravas",
      "Poutine"
    ],
    "sources": [
      "recipes"
    ],
    "status": "proposal"
  },
  {
    "id": "q068",
    "family": "food",
    "prompt": "Name a fruit used in a sweet dessert.",
    "scope": "Fresh, dried or cooked fruit in an established dessert qualifies.",
    "examples": [
      "Apple",
      "Strawberry",
      "Banana",
      "Mango",
      "Peach",
      "Passion Fruit"
    ],
    "sources": [
      "recipes"
    ],
    "status": "proposal"
  },
  {
    "id": "q069",
    "family": "nature",
    "prompt": "Name an animal that can deliver venom.",
    "scope": "Venom must be injected or delivered by a bite, sting or spine; simply being poisonous is different.",
    "examples": [
      "Cobra",
      "Scorpion",
      "Box Jellyfish",
      "Black Widow",
      "Lionfish",
      "Platypus"
    ],
    "sources": [
      "zoo",
      "noaa"
    ],
    "status": "proposal"
  },
  {
    "id": "q070",
    "family": "nature",
    "prompt": "Name an animal that changes color.",
    "scope": "Rapid camouflage and seasonal changes both count.",
    "examples": [
      "Chameleon",
      "Octopus",
      "Cuttlefish",
      "Squid",
      "Arctic Fox",
      "Snowshoe Hare"
    ],
    "sources": [
      "zoo",
      "noaa"
    ],
    "status": "proposal"
  },
  {
    "id": "q071",
    "family": "nature",
    "prompt": "Name an animal that flies but is not a bird.",
    "scope": "Powered flight counts; an animal that only glides does not.",
    "examples": [
      "Bat",
      "Butterfly",
      "Dragonfly",
      "Bee",
      "Moth",
      "Flying Ant"
    ],
    "sources": [
      "zoo"
    ],
    "status": "proposal"
  },
  {
    "id": "q072",
    "family": "nature",
    "prompt": "Name a wild animal that spends time both in water and on land.",
    "scope": "The animal must normally use both habitats, not merely survive a brief swim.",
    "examples": [
      "Hippopotamus",
      "Crocodile",
      "Otter",
      "Frog",
      "Seal",
      "Beaver"
    ],
    "sources": [
      "zoo"
    ],
    "status": "proposal"
  },
  {
    "id": "q073",
    "family": "nature",
    "prompt": "Name a kind of shark or ray.",
    "scope": "Established groups and species count; familiar common names would be accepted.",
    "examples": [
      "Great White Shark",
      "Hammerhead Shark",
      "Whale Shark",
      "Manta Ray",
      "Stingray",
      "Sawfish"
    ],
    "sources": [
      "noaa",
      "zoo"
    ],
    "status": "proposal"
  },
  {
    "id": "q074",
    "family": "nature",
    "prompt": "Name an animal that lays eggs.",
    "scope": "Named animal groups and species qualify; males do not have to lay the eggs themselves.",
    "examples": [
      "Chicken",
      "Crocodile",
      "Sea Turtle",
      "Platypus",
      "Salmon",
      "Butterfly"
    ],
    "sources": [
      "zoo"
    ],
    "status": "proposal"
  },
  {
    "id": "q075",
    "family": "nature",
    "prompt": "Name an animal that is active at night.",
    "scope": "Normally nocturnal or regularly night-active animals count; occasional unusual behavior does not.",
    "examples": [
      "Owl",
      "Bat",
      "Raccoon",
      "Hedgehog",
      "Aardvark",
      "Opossum"
    ],
    "sources": [
      "zoo"
    ],
    "status": "proposal"
  },
  {
    "id": "q076",
    "family": "nature",
    "prompt": "Name an animal people have used for work or transport.",
    "scope": "Documented domesticated or trained working animals count, past or present.",
    "examples": [
      "Horse",
      "Donkey",
      "Camel",
      "Elephant",
      "Ox",
      "Dog"
    ],
    "sources": [
      "smithsonian"
    ],
    "status": "proposal"
  },
  {
    "id": "q077",
    "family": "nature",
    "prompt": "Name a plant people eat.",
    "scope": "Named edible plants count, including those eaten for fruit, leaves, roots or seeds; fungi are separate.",
    "examples": [
      "Spinach",
      "Carrot",
      "Rice",
      "Wheat",
      "Basil",
      "Lentil"
    ],
    "sources": [
      "recipes"
    ],
    "status": "proposal"
  },
  {
    "id": "q078",
    "family": "nature",
    "prompt": "Name a plant that has thorns, spines or prickles.",
    "scope": "The sharp growth can be on any ordinary part of the plant; edible plants count too.",
    "examples": [
      "Rose",
      "Blackberry",
      "Hawthorn",
      "Prickly Pear",
      "Agave",
      "Bougainvillea"
    ],
    "sources": [
      "zoo"
    ],
    "status": "proposal"
  },
  {
    "id": "q079",
    "family": "science",
    "prompt": "Name a named object in our Solar System.",
    "scope": "Planets, dwarf planets, moons, named asteroids and named comets count; stars beyond the Sun do not.",
    "examples": [
      "Mars",
      "Europa",
      "Titan",
      "Pluto",
      "Ceres",
      "Halley's Comet"
    ],
    "sources": [
      "nasa"
    ],
    "status": "proposal"
  },
  {
    "id": "q080",
    "family": "science",
    "prompt": "Name something people use to measure things.",
    "scope": "Named measuring instruments count; the quantity being measured can be distance, time, temperature or something else.",
    "examples": [
      "Ruler",
      "Thermometer",
      "Stopwatch",
      "Weighing Scale",
      "Barometer",
      "Speedometer"
    ],
    "sources": [
      "nist"
    ],
    "status": "proposal"
  },
  {
    "id": "q081",
    "family": "science",
    "prompt": "Name a machine or device that uses an electric motor.",
    "scope": "The motor can be internal and does not need to move the entire device.",
    "examples": [
      "Electric Fan",
      "Blender",
      "Washing Machine",
      "Cordless Drill",
      "Elevator",
      "Electric Toothbrush"
    ],
    "sources": [
      "energy"
    ],
    "status": "proposal"
  },
  {
    "id": "q082",
    "family": "science",
    "prompt": "Name something that produces visible light.",
    "scope": "Natural sources and human-made devices count; a reflector alone does not.",
    "examples": [
      "Sun",
      "Light Bulb",
      "Candle",
      "Glow Stick",
      "Firefly",
      "Lightning"
    ],
    "sources": [
      "nasa",
      "noaa"
    ],
    "status": "proposal"
  },
  {
    "id": "q083",
    "family": "science",
    "prompt": "Name a weather event or weather condition.",
    "scope": "Common and established technical names count; fictional weather does not.",
    "examples": [
      "Thunderstorm",
      "Hail",
      "Fog",
      "Blizzard",
      "Heat Wave",
      "Tornado"
    ],
    "sources": [
      "weather"
    ],
    "status": "proposal"
  },
  {
    "id": "q084",
    "family": "science",
    "prompt": "Name a body part a typical human has more than one of.",
    "scope": "Named bones, organs and body parts count; ordinary singular names would be accepted.",
    "examples": [
      "Eye",
      "Ear",
      "Lung",
      "Kidney",
      "Rib",
      "Finger"
    ],
    "sources": [
      "anatomy"
    ],
    "status": "proposal"
  },
  {
    "id": "q085",
    "family": "science",
    "prompt": "Name a chemical element used in everyday products.",
    "scope": "There must be a documented consumer, industrial or medical use; exact product names are not required.",
    "examples": [
      "Carbon",
      "Iron",
      "Aluminum",
      "Copper",
      "Silicon",
      "Calcium"
    ],
    "sources": [
      "elements"
    ],
    "status": "proposal"
  },
  {
    "id": "q086",
    "family": "science",
    "prompt": "Name a real vehicle that can fly.",
    "scope": "Real vehicle types and named models count; fictional vehicles and craft that only float on water do not.",
    "examples": [
      "Helicopter",
      "Glider",
      "Hot-Air Balloon",
      "Blimp",
      "Boeing 747",
      "Space Shuttle"
    ],
    "sources": [
      "faa",
      "nasa"
    ],
    "status": "proposal"
  },
  {
    "id": "q087",
    "family": "world",
    "prompt": "Name a landmark people can visit.",
    "scope": "Named natural or human-made visitor landmarks count, including ruins.",
    "examples": [
      "Eiffel Tower",
      "Taj Mahal",
      "Great Wall of China",
      "Colosseum",
      "Machu Picchu",
      "Statue of Liberty"
    ],
    "sources": [
      "unesco",
      "nps"
    ],
    "status": "proposal"
  },
  {
    "id": "q088",
    "family": "world",
    "prompt": "Name a country made up entirely of islands.",
    "scope": "Island countries and countries sharing an island count; Australia explicitly counts.",
    "examples": [
      "Japan",
      "Indonesia",
      "Iceland",
      "Cuba",
      "Madagascar",
      "Australia"
    ],
    "sources": [
      "world"
    ],
    "status": "proposal"
  },
  {
    "id": "q089",
    "family": "world",
    "prompt": "Name an amusement park or theme-park resort.",
    "scope": "Real parks and resort complexes count worldwide; familiar resort names would be accepted.",
    "examples": [
      "Disneyland",
      "Walt Disney World",
      "Universal Orlando",
      "Carowinds",
      "Alton Towers",
      "Europa-Park"
    ],
    "sources": [
      "parks"
    ],
    "status": "proposal"
  },
  {
    "id": "q090",
    "family": "world",
    "prompt": "Name a city that has hosted the modern Olympics.",
    "scope": "Summer and Winter hosts count; ancient host cities alone do not.",
    "examples": [
      "London",
      "Paris",
      "Tokyo",
      "Los Angeles",
      "Vancouver",
      "Beijing"
    ],
    "sources": [
      "olympics"
    ],
    "status": "proposal"
  },
  {
    "id": "q091",
    "family": "world",
    "prompt": "Name a food named after a place.",
    "scope": "The place name must appear in an established food or dish name.",
    "examples": [
      "Buffalo Wings",
      "Yorkshire Pudding",
      "Baked Alaska",
      "Peking Duck",
      "Boston Cream Pie",
      "New York Cheesecake"
    ],
    "sources": [
      "recipes"
    ],
    "status": "proposal"
  },
  {
    "id": "q092",
    "family": "world",
    "prompt": "Name a country whose national flag contains a star.",
    "scope": "A visible star on the official national flag qualifies; tiny stars inside a coat of arms count too.",
    "examples": [
      "United States",
      "China",
      "Brazil",
      "Australia",
      "Turkey",
      "Vietnam"
    ],
    "sources": [
      "world"
    ],
    "status": "proposal"
  },
  {
    "id": "q093",
    "family": "everyday",
    "prompt": "Name something students bring to school.",
    "scope": "Physical items brought for an ordinary school day count; people and pets do not.",
    "examples": [
      "Pencil",
      "Notebook",
      "Calculator",
      "Lunch Box",
      "Water Bottle",
      "Headphones"
    ],
    "sources": [
      "school"
    ],
    "status": "proposal"
  },
  {
    "id": "q094",
    "family": "everyday",
    "prompt": "Name an item used in a bathroom.",
    "scope": "Established bathroom, bathing, grooming and hygiene items count.",
    "examples": [
      "Toothbrush",
      "Towel",
      "Soap",
      "Shampoo",
      "Toilet Paper",
      "Hair Dryer"
    ],
    "sources": [
      "household"
    ],
    "status": "proposal"
  },
  {
    "id": "q095",
    "family": "everyday",
    "prompt": "Name something people open using a key or a code.",
    "scope": "Physical objects and devices count; the code can be a password or combination.",
    "examples": [
      "Door",
      "Padlock",
      "Phone",
      "Safe",
      "School Locker",
      "Suitcase"
    ],
    "sources": [
      "household"
    ],
    "status": "proposal"
  },
  {
    "id": "q096",
    "family": "everyday",
    "prompt": "Name an everyday object with wheels.",
    "scope": "Ordinary objects and vehicles count; named types count without needing a brand.",
    "examples": [
      "Bicycle",
      "Skateboard",
      "Wheelchair",
      "Stroller",
      "Shopping Cart",
      "Office Chair"
    ],
    "sources": [
      "household"
    ],
    "status": "proposal"
  },
  {
    "id": "q097",
    "family": "everyday",
    "prompt": "Name a way to pay for something without physical cash.",
    "scope": "Payment methods, payment networks and named payment services count.",
    "examples": [
      "Credit Card",
      "Debit Card",
      "PayPal",
      "Apple Pay",
      "Venmo",
      "Gift Card"
    ],
    "sources": [
      "payments"
    ],
    "status": "proposal"
  },
  {
    "id": "q098",
    "family": "everyday",
    "prompt": "Name something that can be controlled with a remote.",
    "scope": "A real consumer product type with a handheld or app-based remote qualifies.",
    "examples": [
      "Television",
      "Drone",
      "RC Car",
      "Ceiling Fan",
      "Garage Door",
      "Air Conditioner"
    ],
    "sources": [
      "household"
    ],
    "status": "proposal"
  },
  {
    "id": "q099",
    "family": "everyday",
    "prompt": "Name something you can wear that has a button, zipper or buckle.",
    "scope": "Clothes, footwear, accessories and protective wear count.",
    "examples": [
      "Jacket",
      "Shirt",
      "Jeans",
      "Belt",
      "Boots",
      "Helmet"
    ],
    "sources": [
      "household"
    ],
    "status": "proposal"
  },
  {
    "id": "q100",
    "family": "everyday",
    "prompt": "Name something people can borrow from a public library.",
    "scope": "Items must actually be offered by a public library somewhere; Library of Things collections count.",
    "examples": [
      "Book",
      "DVD",
      "Board Game",
      "Telescope",
      "Sewing Machine",
      "Fishing Pole"
    ],
    "sources": [
      "library"
    ],
    "status": "proposal"
  }
];
