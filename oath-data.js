// Familiar secret words, with a deliberately broad hint for the impostor.
// Honest witnesses receive the word; the impostor never receives its aliases or clue bank.
const groups={
 Games:`Minecraft|You can change almost everything around you.|Blocks;Pickaxe;Mining;Creeper;Crafting
Fortnite|The playable area does not stay the same size.|Storm;Bus;Building;Loot;Dropping
Mario|A familiar hero often gets a change of clothes.|Mushroom;Plumber;Jumping;Peach;Coins
Pokémon|Making new friends can involve a little competition.|Trading;Evolution;Badges;Trainer;Catching
Roblox|One place can contain thousands of different experiences.|Obby;Avatar;Robux;Servers;Creator
Among Us|Trust is a risky thing to give away.|Tasks;Vent;Meeting;Sabotage;Crew
Tetris|Good organization makes things disappear.|Falling;Rows;Rotation;Stacking;Four
Pac-Man|Taking a wrong turn can get you chased.|Maze;Ghosts;Cherries;Pellets;Arcade
Sonic|This hero rarely takes the slow route.|Rings;Blue;Speed;Hedgehog;Loops
Zelda|A big adventure often starts with someone needing help.|Hyrule;Link;Triforce;Sword;Princess
The Sims|Ordinary life can get surprisingly chaotic.|Household;Needs;Furniture;Simlish;Neighbors
Grand Theft Auto|Getting around a city can attract unwanted attention.|Wanted;Heist;Cars;Los Santos;Rockstar
Call of Duty|Teamwork matters, but the next round starts quickly.|Loadout;Killstreak;Soldiers;Campaign;Zombies
Rocket League|An ordinary sport gets a very unusual set of players.|Boost;Goal;Cars;Aerial;Arena
Animal Crossing|Your neighbors may have very different personalities.|Island;Bells;Villagers;Fishing;Nook
Clash of Clans|A good home needs a good defense.|Village;Raid;Walls;Builder;Troops
Chess|Protecting one important person is the whole point.|Check;Castle;Knight;Pawn;Board
Monopoly|A bad stop can cost you a lot.|Rent;Jail;Property;Railroad;Bank
Uno|The smaller your collection gets, the better you are doing.|Colors;Reverse;Skip;Draw;Last card
Minecraft Creeper|Getting too close can end badly.|Green;Hissing;Explosion;Sneaking;Mob`,
 Food:`Pizza|People often order this for a group.|Slice;Crust;Oven;Delivery;Cheese
Burger|This is often hard to eat neatly with one hand.|Patty;Bun;Grill;Pickles;Drive-through
French fries|People disagree about the best thing to dip these in.|Potatoes;Salt;Crispy;Ketchup;Basket
Sushi|Presentation is often a big part of the experience.|Rice;Roll;Seaweed;Chopsticks;Wasabi
Tacos|Putting too much inside can cause a mess.|Tortilla;Salsa;Folded;Tuesday;Filling
Spaghetti|Eating this neatly takes a little technique.|Twirl;Pasta;Sauce;Long;Fork
Ice cream|Taking too long is a problem.|Cone;Scoop;Melting;Sprinkles;Frozen
Popcorn|People associate this with sitting in the dark.|Kernel;Butter;Cinema;Popping;Bucket
Pancakes|This often arrives in a stack.|Syrup;Breakfast;Flip;Batter;Griddle
Waffles|Its shape helps it hold on to toppings.|Squares;Breakfast;Syrup;Iron;Crisp
Donut|This treat often comes in a box for everyone.|Glaze;Hole;Sprinkles;Bakery;Fried
Chocolate|A small piece can be enough for a gift.|Cocoa;Bar;Sweet;Wrapper;Melt
Watermelon|This is easier to share after somebody brings a knife.|Seeds;Summer;Rind;Pink;Slice
Banana|Its packaging is part of the joke.|Peel;Yellow;Bunch;Monkey;Curved
Pineapple|Its outside is less welcoming than its inside.|Spiky;Tropical;Crown;Juice;Yellow
Peanut butter|Some people want a smooth experience and others do not.|Jar;Spread;Crunchy;Sandwich;Sticky
Cereal|People argue about which ingredient goes in first.|Bowl;Milk;Breakfast;Crunch;Box
Mac and cheese|This comfort food usually has a very obvious color.|Pasta;Elbows;Cheddar;Creamy;Orange
Birthday cake|You usually do something before anyone gets a piece.|Candles;Frosting;Party;Wish;Slices
Chicken nuggets|People have strong feelings about the sauce.|Dipping;Crispy;Bite-sized;Chicken;Box`,
 Everyday:`Backpack|This is useful when you need both hands free.|Straps;Books;Zipper;School;Pockets
Headphones|Other people may not hear what you are enjoying.|Ears;Music;Cable;Noise;Volume
Toothbrush|People generally expect you not to share this.|Bristles;Bathroom;Paste;Morning;Teeth
Umbrella|You may regret forgetting it after you leave home.|Rain;Handle;Open;Canopy;Dry
Alarm clock|Its job is to interrupt something pleasant.|Snooze;Morning;Ringing;Bedside;Wake
Sunglasses|These can change how a person looks and sees.|Shade;Lenses;Sun;Frames;Eyes
Mirror|It is very hard to surprise the person in this.|Reflection;Glass;Bathroom;Face;Looking
Pillow|People have strong opinions about its temperature.|Bed;Soft;Sleep;Case;Fluffy
Microwave|Waiting beside this can make time feel slower.|Reheat;Beep;Kitchen;Turntable;Leftovers
Refrigerator|People open this even when they do not know what they want.|Cold;Kitchen;Shelves;Milk;Magnets
Remote control|Losing this can cause an argument over a very small distance.|Buttons;Television;Sofa;Battery;Channel
Phone charger|You usually need this most when you cannot find it.|Battery;Cable;Outlet;Power;Plug
Scissors|This tool comes in left-handed versions.|Blades;Cut;Paper;Handles;Crafts
Stapler|This helps separate things stay together.|Paper;Office;Metal;Squeeze;Desk
Bicycle|Keeping your balance gets easier after you get moving.|Pedals;Wheels;Chain;Helmet;Handlebars
Skateboard|A small change in balance can send this somewhere else.|Deck;Trucks;Wheels;Kickflip;Ramp
Elevator|Small talk is not always comfortable in here.|Buttons;Floors;Doors;Lift;Building
Vending machine|Sometimes your purchase gets stuck just out of reach.|Coins;Snacks;Buttons;Spiral;Change
Washing machine|This can turn one missing item into a mystery.|Laundry;Spin;Detergent;Drum;Socks
Fire extinguisher|You hope you will never need to use this.|Red;Safety;Pin;Spray;Emergency`,
 Places:`Beach|People often bring home a little of this place by accident.|Sand;Waves;Towel;Shells;Sun
Movie theater|Everyone is expected to face the same direction.|Screen;Tickets;Popcorn;Seats;Dark
Airport|Being early is much better than being late here.|Runway;Terminal;Suitcase;Security;Boarding
Library|The quietest room can contain the most stories.|Books;Borrow;Shelves;Reading;Librarian
Swimming pool|There is a very specific kind of running you should not do here.|Chlorine;Lanes;Splash;Lifeguard;Deep end
Amusement park|People choose to stand in long lines here.|Rides;Roller coaster;Tickets;Loops;Cotton candy
Bowling alley|People wear shoes that belong to someone else here.|Pins;Lanes;Strike;Gutter;Ball
Gym|People pay to do difficult things here.|Weights;Workout;Treadmill;Sweat;Training
Museum|You are often allowed to look but not touch.|Exhibits;History;Artifacts;Gallery;Display
Hospital|People are very happy when they get permission to leave.|Doctors;Nurses;Patients;Emergency;Beds
Restaurant|You can finish something here and still be waiting for one thing.|Menu;Waiter;Bill;Table;Kitchen
Supermarket|Coming here hungry can be expensive.|Aisles;Cart;Checkout;Groceries;Shelves
Zoo|Visitors often look for their favorites first.|Animals;Enclosures;Keeper;Habitats;Tickets
Aquarium|You can spend a long time looking through glass here.|Tanks;Fish;Water;Jellyfish;Sharks
Campground|Your bedroom may be something you carried with you.|Tent;Fire;Sleeping bag;Marshmallows;Outdoors
Stadium|A lot of people can become very loud at the same time.|Crowd;Seats;Scoreboard;Team;Field
Courtroom|People take turns explaining very different versions of events.|Judge;Witness;Gavel;Jury;Objection
Classroom|People sometimes hope their name will not be called here.|Teacher;Desk;Board;Lesson;Homework
Barber shop|You can leave here with less than you arrived with.|Hair;Chair;Clippers;Mirror;Trim
Gas station|A long trip can come to a stop without this place.|Pump;Fuel;Car;Nozzle;Price`,
 Nature:`Penguin|This bird is better at getting around in water.|Ice;Waddle;Flippers;Colony;Black and white
Shark|People often worry about this animal more than they need to.|Fin;Ocean;Teeth;Predator;Gills
Octopus|This animal can solve a problem without having any bones.|Tentacles;Ink;Eight;Suction;Camouflage
Giraffe|Reaching a snack is rarely a problem for this animal.|Neck;Spots;Tall;Leaves;Africa
Elephant|This animal can pick things up without using its feet.|Trunk;Tusks;Ears;Herd;Huge
Kangaroo|A passenger can travel without taking any steps.|Pouch;Jump;Australia;Joey;Tail
Dolphin|This animal can seem unusually interested in people.|Clicks;Ocean;Pod;Leaping;Blowhole
Sloth|A busy schedule would not suit this animal.|Slow;Tree;Claws;Hanging;Sleepy
Chameleon|Blending in is part of this animal's reputation.|Color;Tongue;Lizard;Eyes;Branch
Peacock|One member of this species is very hard to overlook.|Feathers;Tail;Display;Blue;Bird
Flamingo|People sometimes copy the way this animal stands.|Pink;Leg;Bird;Water;Flock
Bee|A tiny worker can be very important to your food.|Honey;Hive;Pollen;Buzz;Sting
Butterfly|This animal has a very different childhood.|Wings;Caterpillar;Cocoon;Flowers;Flutter
Cactus|This plant does not want a hug.|Spines;Desert;Succulent;Dry;Pot
Sunflower|The name gives a clue about its appearance.|Yellow;Seeds;Tall;Petals;Garden
Volcano|This can be quiet for a very long time before causing trouble.|Lava;Crater;Eruption;Mountain;Ash
Rainbow|You can see this without being able to walk up to it.|Colors;Rain;Arc;Sunshine;Sky
Snowflake|People use this as a symbol for something unique.|Ice;Winter;Crystal;Falling;Six sides
Waterfall|Sometimes the journey down is much faster than the journey up.|River;Drop;Mist;Roar;Cliff
Tornado|This is the wrong kind of thing to see spinning nearby.|Funnel;Wind;Storm;Twister;Cloud`,
 Screen:`Batman|This hero's equipment is more important than superpowers.|Gotham;Cave;Cape;Bruce;Signal
Spider-Man|This hero has a complicated relationship with getting to school.|Web;Swing;Peter;Mask;Spider
Superman|Ordinary clothes make a surprisingly effective disguise.|Cape;Krypton;Clark;Flying;Metropolis
Harry Potter|A school letter changed this person's whole life.|Wand;Hogwarts;Glasses;Scar;Wizard
Darth Vader|You can recognize this character without seeing their face.|Helmet;Breathing;Force;Black;Father
Yoda|This character makes age look rather surprising.|Green;Small;Jedi;Wisdom;Ears
Shrek|This character would usually prefer visitors to go away.|Ogre;Swamp;Donkey;Green;Fiona
SpongeBob|Having a normal job does not prevent a strange daily life.|Pineapple;Spatula;Square;Sponge;Patrick
Minions|A group of very small helpers can cause very big problems.|Yellow;Goggles;Banana;Gru;Overalls
Toy Story|Ordinary objects have a very busy life when people leave.|Woody;Buzz;Andy;Toys;Playroom
Frozen|A family argument can have an effect on the weather.|Elsa;Snow;Anna;Olaf;Sisters
Jurassic Park|An exciting attraction has a very serious safety problem.|Dinosaurs;Island;Amber;Raptor;Fences
Star Wars|Family problems can have consequences for an entire galaxy.|Lightsaber;Force;Space;Jedi;Empire
Stranger Things|Life in a small town becomes much less ordinary.|Eleven;Hawkins;Upside Down;Bikes;Demogorgon
Scooby-Doo|A frightening problem often has an ordinary explanation.|Mystery;Van;Dog;Snacks;Mask
The Simpsons|One family has stayed the same age for a very long time.|Springfield;Homer;Yellow;Donut;Bart
WALL-E|Tidying up can be lonely work.|Robot;Trash;Space;Eve;Earth
Lightning McQueen|This character wants to be known for being fast.|Race;Red;Cars;Ninety-five;Radiator Springs
Willy Wonka|Getting into this person's workplace is a very unusual prize.|Chocolate;Factory;Golden ticket;Candy;Inventor
The Grinch|This character is not very enthusiastic about a popular celebration.|Green;Christmas;Whoville;Heart;Max`
};
const aliases={
 'Pokémon':['Pokemon'],'The Sims':['Sims'],'Grand Theft Auto':['GTA'],
 'Minecraft Creeper':['Creeper'],'French fries':['Fries','French fry'],'Donut':['Doughnut'],
 'Mac and cheese':['Macaroni and cheese'],'Chicken nuggets':['Nuggets'],'Peanut butter':['PB'],
 'Refrigerator':['Fridge'],'Remote control':['Remote'],'Phone charger':['Charger'],
 'Washing machine':['Washer'],'Movie theater':['Cinema','Movie theatre'],'Swimming pool':['Pool'],
 'Amusement park':['Theme park'],'Supermarket':['Grocery store'],'Barber shop':['Barbershop'],
 'Gas station':['Petrol station'],'Spider-Man':['Spiderman'],'SpongeBob':['SpongeBob SquarePants'],
 'Minions':['Minion'],'WALL-E':['Walle','Wall E'],'The Grinch':['Grinch'],
 'The Simpsons':['Simpsons'],'Scooby-Doo':['Scooby Doo','Scooby'],'Lightning McQueen':['McQueen']
};
export const OATH_QUESTIONS=Object.entries(groups).flatMap(([category,text])=>text.split('\n').map((row,i)=>{const [answer,hint,clues]=row.split('|');return {id:'oath-'+category.toLowerCase()+'-'+(i+1),category,prompt:'One witness is bluffing. Find out who.',answer,aliases:aliases[answer]??[],hint,clues:clues.split(';')};}));
export const OATH_BY_ID=new Map(OATH_QUESTIONS.map(q=>[q.id,q]));
