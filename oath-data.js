// Recognizable, specific words rather than generic first guesses. Each broad
// impostor hint deliberately fits four different words in the same category.
const groups={
 Games:`Hotbar|Part of your setup|Slots;Keys;Quick;Items;Bottom
Inventory|Part of your setup|Storage;Bag;Items;Space;Sorting
Loadout|Part of your setup|Weapons;Preset;Equipment;Match;Choice
Health bar|Part of your setup|Damage;Red;Healing;Meter;Survival
Fall damage|Can change a match|Height;Landing;Gravity;Drop;Ouch
Friendly fire|Can change a match|Teammate;Accident;Aim;Damage;Oops
Lag|Can change a match|Delay;Connection;Frozen;Ping;Stutter
Headshot|Can change a match|Accuracy;Helmet;Aim;Critical;Sniper
Battle pass|Something to unlock|Season;Tiers;Rewards;Progress;Levels
Skill tree|Something to unlock|Branches;Abilities;Points;Upgrade;Build
Achievement|Something to unlock|Trophy;Challenge;Milestone;Badge;Completed
Character skin|Something to unlock|Outfit;Cosmetic;Style;Shop;Appearance
Loot chest|Worth looking for|Treasure;Opening;Gear;Hidden;Lucky
Medkit|Worth looking for|Healing;Emergency;Bandage;Recovery;Supplies
Supply drop|Worth looking for|Parachute;Crate;Landing;Gear;Sky
Hidden level|Worth looking for|Secret;Entrance;Bonus;Explore;Surprise
Fast travel|A way around danger|Map;Destination;Instant;Distance;Waypoint
Double jump|A way around danger|Airborne;Platform;Twice;Height;Leap
Respawn point|A way around danger|Return;Death;Bed;Restart;Location
Shield potion|A way around danger|Blue;Drink;Protection;Bottle;Survival`,
 Food:`Garlic bread|Often served warm|Butter;Crust;Italian;Toasted;Aroma
Grilled cheese|Often served warm|Melted;Sandwich;Pan;Golden;Stretch
Fried rice|Often served warm|Wok;Grains;Egg;Leftovers;Soy
Quesadilla|Often served warm|Folded;Tortilla;Melted;Wedges;Pan
Cinnamon roll|A sweet treat|Spiral;Icing;Bakery;Spice;Soft
Fortune cookie|A sweet treat|Message;Crack;Paper;Prediction;Restaurant
Milkshake|A sweet treat|Straw;Blender;Thick;Cold;Glass
Gingerbread|A sweet treat|House;Spices;Decorate;Holiday;Baking
Onion rings|Crunch is part of it|Circles;Batter;Fried;Side;Dip
Pretzel|Crunch is part of it|Knot;Salt;Twisted;Snack;Bakery
Nachos|Crunch is part of it|Chips;Toppings;Melted;Sharing;Jalapeño
Mozzarella sticks|Crunch is part of it|Stretch;Breaded;Marinara;Fried;Appetizer
Corn dog|May come with a dip|Stick;Fair;Batter;Mustard;Sausage
Spring roll|May come with a dip|Wrapper;Vegetables;Crispy;Filling;Restaurant
Chicken wings|May come with a dip|Sauce;Bones;Basket;Spicy;Napkins
Breadsticks|May come with a dip|Long;Basket;Bakery;Butter;Restaurant
Ice cream sandwich|Something in the middle|Frozen;Layers;Cookie;Wrapper;Melting
Peanut butter cup|Something in the middle|Wrapper;Chocolate;Ridged;Sweet;Filling
Jelly donut|Something in the middle|Bakery;Filling;Powder;Round;Sweet
Ravioli|Something in the middle|Pasta;Pillow;Stuffed;Sauce;Square`,
 Everyday:`Paper clip|Helps things stay together|Wire;Office;Documents;Bent;Desk
Rubber band|Helps things stay together|Stretch;Elastic;Loop;Snap;Bundle
Safety pin|Helps things stay together|Metal;Clasp;Point;Clothing;Fastener
Zip tie|Helps things stay together|Plastic;Loop;Tighten;Teeth;Cable
Keychain|Useful away from home|Ring;Pocket;Charm;Metal;Carry
Sleeping bag|Useful away from home|Camping;Zipper;Warm;Roll;Tent
Flashlight|Useful away from home|Beam;Battery;Dark;Switch;Camping
Seat belt|Useful away from home|Buckle;Car;Click;Safety;Strap
Tape measure|Often kept in a drawer|Length;Retract;Numbers;Builder;Yellow
Bottle opener|Often kept in a drawer|Cap;Lever;Kitchen;Metal;Drink
Lint roller|Often kept in a drawer|Sticky;Clothing;Pet hair;Handle;Peel
Staple remover|Often kept in a drawer|Office;Teeth;Paper;Pinch;Metal
Extension cord|Makes a small job easier|Outlet;Reach;Cable;Power;Plug
Hand sanitizer|Makes a small job easier|Pump;Gel;Clean;Pocket;Alcohol
Sticky note|Makes a small job easier|Reminder;Yellow;Desk;Message;Peel
Pencil sharpener|Makes a small job easier|Point;Shavings;Blade;Classroom;Turn
Doorbell|Can get your attention|Visitor;Button;Chime;Porch;Delivery
Fire alarm|Can get your attention|Emergency;Loud;Drill;Building;Warning
Traffic cone|Can get your attention|Orange;Road;Safety;Construction;Triangle
Walkie-talkie|Can get your attention|Radio;Button;Over;Channel;Antenna`,
 Places:`Train platform|People wait here|Tracks;Departure;Station;Edge;Timetable
Bus stop|People wait here|Shelter;Route;Bench;Schedule;Curb
Waiting room|People wait here|Appointment;Chairs;Magazine;Reception;Names
Rest stop|People wait here|Highway;Break;Bathrooms;Picnic;Road trip
Food court|Part of a bigger building|Trays;Mall;Choices;Tables;Lunch
Locker room|Part of a bigger building|Bench;Team;Changing;Showers;Padlock
Dressing room|Part of a bigger building|Mirror;Curtain;Clothes;Try;Size
Parking garage|Part of a bigger building|Ramps;Cars;Levels;Ticket;Concrete
Escape room|A visit is an activity|Puzzle;Timer;Clues;Locked;Teamwork
Skate park|A visit is an activity|Ramps;Rails;Helmet;Tricks;Concrete
Mini golf|A visit is an activity|Putter;Windmill;Obstacles;Scorecard;Hole
Water park|A visit is an activity|Slides;Tubes;Splash;Queue;Swimsuit
Drive-through|A short stop|Window;Order;Car;Speaker;Lane
Lost and found|A short stop|Missing;Claim;Office;Box;Forgotten
Souvenir shop|A short stop|Postcards;Magnets;Tourist;Gift;Keepsake
Photo booth|A short stop|Curtain;Pictures;Strip;Flash;Posing
Laundromat|Not usually in your house|Machines;Coins;Laundry;Spin;Waiting
Boardwalk|Not usually in your house|Wooden;Beach;Strolling;Shops;Summer
School cafeteria|Not usually in your house|Trays;Lunch;Tables;Queue;Students
Haunted house|Not usually in your house|Scary;Dark;Screams;Actors;Halloween`,
 Nature:`Praying mantis|Small but distinctive|Insect;Camouflage;Arms;Green;Predator
Firefly|Small but distinctive|Glow;Night;Insect;Summer;Blink
Hummingbird|Small but distinctive|Hover;Nectar;Wings;Flowers;Tiny
Hermit crab|Small but distinctive|Shell;Beach;Claws;Home;Borrowed
Tide pool|Close to the water|Shallow;Rocks;Coast;Anemone;Trapped
Starfish|Close to the water|Arms;Ocean;Regrow;Seafloor;Five
Seahorse|Close to the water|Tail;Snout;Upright;Ocean;Tiny
Sea turtle|Close to the water|Shell;Flippers;Beach;Eggs;Ocean
Coconut|Something with a covering|Palm;Shell;Tropical;White;Water
Acorn|Something with a covering|Oak;Squirrel;Cap;Seed;Autumn
Pine cone|Something with a covering|Scales;Tree;Seeds;Forest;Brown
Sea urchin|Something with a covering|Spines;Ocean;Round;Rock;Careful
Northern lights|Worth looking up for|Colors;Sky;Polar;Night;Dancing
Shooting star|Worth looking up for|Wish;Streak;Night;Trail;Quick
Solar eclipse|Worth looking up for|Shadow;Daytime;Moon;Glasses;Darkness
Full moon|Worth looking up for|Round;Night;Bright;Werewolf;Sky
Venus flytrap|Easy to notice outside|Plant;Snap;Insect;Teeth;Leaves
Spiderweb|Easy to notice outside|Silk;Sticky;Dew;Threads;Corner
Dandelion|Easy to notice outside|Yellow;Seeds;Wish;Lawn;Floating
Tumbleweed|Easy to notice outside|Rolling;Desert;Dry;Wind;Western`,
 Screen:`Dobby|Usually has company|Sock;Freedom;Elf;Hogwarts;Helpful
Chewbacca|Usually has company|Furry;Wookiee;Growl;Copilot;Han
Donkey|Usually has company|Talkative;Ogre;Waffles;Dragon;Swamp
Olaf|Usually has company|Snowman;Carrot;Summer;Hugs;Frozen
Infinity Gauntlet|More than ordinary equipment|Stones;Glove;Snap;Gold;Thanos
Sorting Hat|More than ordinary equipment|Houses;Head;Hogwarts;Talking;Choice
Batmobile|More than ordinary equipment|Gotham;Car;Gadgets;Black;Cave
Lightsaber|More than ordinary equipment|Glow;Duel;Jedi;Blade;Humming
Wolverine|A recognizable look|Claws;Healing;Yellow;Logan;Mutant
Deadpool|A recognizable look|Red;Mask;Jokes;Healing;Swords
Optimus Prime|A recognizable look|Truck;Robot;Leader;Autobot;Transform
Wednesday Addams|A recognizable look|Braids;Gothic;Deadpan;Dance;School
Hogwarts|A place with a reputation|Castle;Wizard;Houses;School;Express
Wakanda|A place with a reputation|Vibranium;Panther;Kingdom;Africa;Hidden
Bikini Bottom|A place with a reputation|Pineapple;Underwater;Krab;Sponge;Neighbors
Death Star|A place with a reputation|Space;Station;Laser;Empire;Moon
The Joker|Often causes trouble|Clown;Gotham;Purple;Laugh;Cards
Green Goblin|Often causes trouble|Glider;Pumpkin;Mask;Osborn;Spider
Thanos|Often causes trouble|Purple;Titan;Stones;Snap;Balance
Team Rocket|Often causes trouble|Meowth;Jessie;James;Balloon;Trouble`
};
const aliases={
 Hotbar:['Hot bar'],Inventory:['Item inventory'],Loadout:['Weapon loadout'],
 'Health bar':['HP bar','Life bar'],'Fall damage':['Falling damage'],'Friendly fire':['Team damage'],
 'Battle pass':['Battlepass'],'Skill tree':['Talent tree'],'Character skin':['Skin','Player skin'],
 'Loot chest':['Treasure chest'],'Medkit':['Med kit','Medical kit'],'Supply drop':['Airdrop','Air drop'],
 'Hidden level':['Secret level'],'Fast travel':['Fast-travel'],'Double jump':['Double-jump'],
 'Respawn point':['Spawn point'],'Shield potion':['Shield pot'],
 'Grilled cheese':['Grilled cheese sandwich'],'Fortune cookie':['Fortune cookies'],
 'Onion rings':['Onion ring'],'Mozzarella sticks':['Mozzarella stick','Mozz sticks'],
 'Corn dog':['Corndog'],'Spring roll':['Spring rolls'],'Chicken wings':['Chicken wing'],
 'Breadsticks':['Bread sticks','Breadstick'],'Peanut butter cup':['Peanut butter cups'],
 'Jelly donut':['Jelly doughnut','Jam doughnut','Jam donut'],
 'Paper clip':['Paperclip'],'Rubber band':['Elastic band'],'Zip tie':['Cable tie'],
 'Keychain':['Key chain','Keyring','Key ring'],'Seat belt':['Seatbelt'],'Tape measure':['Measuring tape'],
 'Staple remover':['Destapler'],'Hand sanitizer':['Hand sanitiser'],'Sticky note':['Post-it','Post it','Postit'],
 'Pencil sharpener':['Sharpener'],'Walkie-talkie':['Walkie talkie','Two-way radio'],
 'Train platform':['Railway platform'],'Dressing room':['Fitting room'],'Parking garage':['Parking deck','Car park'],
 'Mini golf':['Miniature golf','Minigolf','Putt putt'],'Water park':['Waterpark'],
 'Drive-through':['Drive thru','Drive-thru','Drive through'],'Lost and found':['Lost property'],
 'Photo booth':['Photobooth'],'Laundromat':['Launderette'],'School cafeteria':['Cafeteria','School canteen'],
 'Praying mantis':['Mantis'],'Firefly':['Lightning bug'],'Hermit crab':['Hermit crabs'],
 'Tide pool':['Tidepool','Rock pool'],'Starfish':['Sea star'],'Sea turtle':['Marine turtle'],
 'Pine cone':['Pinecone'],'Sea urchin':['Urchin'],'Northern lights':['Aurora borealis','Aurora'],
 'Shooting star':['Meteor'],'Solar eclipse':['Eclipse of the sun'],'Venus flytrap':['Flytrap','Venus fly trap'],
 'Spiderweb':['Spider web','Cobweb'],'Chewbacca':['Chewie'],'Infinity Gauntlet':['Thanos gauntlet'],
 'Sorting Hat':['The Sorting Hat'],'Batmobile':['The Batmobile'],'Lightsaber':['Light saber'],
 'Optimus Prime':['Optimus'],'Wednesday Addams':['Wednesday'],'Hogwarts':['Hogwarts school'],
 'Bikini Bottom':['BikiniBottom'],'Death Star':['The Death Star'],'The Joker':['Joker'],
 'Green Goblin':['The Green Goblin'],'Team Rocket':['Rocket trio']
};
export const OATH_QUESTIONS=Object.entries(groups).flatMap(([category,text])=>text.split('\n').map((row,i)=>{const [answer,hint,clues]=row.split('|');return {id:'oath-'+category.toLowerCase()+'-'+(i+1),category,prompt:'One witness is bluffing. Find out who.',answer,aliases:aliases[answer]??[],hint,clues:clues.split(';')};}));
export const OATH_BY_ID=new Map(OATH_QUESTIONS.map(q=>[q.id,q]));
