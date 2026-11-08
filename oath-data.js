// Specific but recognizable words. Each private hint is shared by ten words;
// it offers a direction without narrowing the case to one obvious first guess.
const groups={
 Games:`Hotbar|Part of a player's setup or progress|Slots;Keys;Quick;Items;Bottom
Inventory|Part of a player's setup or progress|Storage;Bag;Items;Space;Sorting
Loadout|Part of a player's setup or progress|Preset;Equipment;Choice;Preparation;Custom
Health bar|Part of a player's setup or progress|Meter;Healing;Red;Survival;Screen
Minimap|Part of a player's setup or progress|Corner;Awareness;Icons;Route;Radar
Cooldown|Part of a player's setup or progress|Waiting;Ability;Timer;Recharge;Patience
Skill tree|Part of a player's setup or progress|Branches;Points;Upgrade;Build;Choices
Battle pass|Part of a player's setup or progress|Season;Tiers;Rewards;Progress;Levels
Save file|Part of a player's setup or progress|Memory;Slot;Progress;Continue;Storage
Difficulty setting|Part of a player's setup or progress|Challenge;Menu;Choice;Balance;Adjust
Fall damage|Something that affects a player's next move|Height;Landing;Gravity;Drop;Careful
Friendly fire|Something that affects a player's next move|Teammate;Accident;Aim;Damage;Oops
Critical hit|Something that affects a player's next move|Chance;Bonus;Lucky;Damage;Impact
Double jump|Something that affects a player's next move|Airborne;Platform;Twice;Height;Leap
Fast travel|Something that affects a player's next move|Destination;Instant;Distance;Waypoint;Journey
Respawn point|Something that affects a player's next move|Return;Bed;Restart;Location;Safety
Spawn protection|Something that affects a player's next move|Temporary;Safety;Return;Fairness;Shield
Wall jump|Something that affects a player's next move|Vertical;Surface;Agility;Climb;Timing
Quick-time event|Something that affects a player's next move|Reaction;Buttons;Prompt;Sequence;Timing
Stealth mission|Something that affects a player's next move|Quiet;Patrol;Shadow;Hidden;Careful`,
 Food:`Garlic bread|Usually part of a meal or a snack|Butter;Crust;Italian;Toasted;Aroma
Grilled cheese|Usually part of a meal or a snack|Melted;Pan;Golden;Stretch;Lunch
French toast|Usually part of a meal or a snack|Breakfast;Soaked;Pan;Syrup;Thick
Baked potato|Usually part of a meal or a snack|Foil;Toppings;Oven;Fluffy;Side
Stuffed crust|Usually part of a meal or a snack|Edge;Filling;Slice;Melted;Extra
Deviled eggs|Usually part of a meal or a snack|Halves;Paprika;Filling;Picnic;Tray
Fried rice|Usually part of a meal or a snack|Wok;Grains;Egg;Leftovers;Soy
Chicken pot pie|Usually part of a meal or a snack|Crust;Filling;Warm;Vegetables;Comfort
Egg roll|Usually part of a meal or a snack|Wrapper;Crispy;Filling;Restaurant;Dip
Crab cake|Usually part of a meal or a snack|Coast;Patty;Seafood;Crumbs;Pan
Cinnamon roll|Often chosen as a treat|Spiral;Icing;Bakery;Spice;Soft
Fortune cookie|Often chosen as a treat|Message;Crack;Paper;Prediction;Restaurant
Ice cream sandwich|Often chosen as a treat|Frozen;Layers;Wrapper;Melting;Rectangular
Peanut butter cup|Often chosen as a treat|Wrapper;Chocolate;Ridged;Sweet;Filling
Jelly donut|Often chosen as a treat|Bakery;Filling;Powder;Round;Sweet
Funnel cake|Often chosen as a treat|Fair;Powder;Tangle;Fried;Sharing
Banana split|Often chosen as a treat|Boat;Scoops;Cherry;Toppings;Dessert
Rice pudding|Often chosen as a treat|Creamy;Bowl;Grains;Cinnamon;Spoon
Caramel apple|Often chosen as a treat|Stick;Sticky;Autumn;Coating;Crunch
Lemon meringue pie|Often chosen as a treat|Peaks;Tart;Slice;Fluffy;Yellow`,
 Everyday:`Paper clip|Helps with a small everyday job|Wire;Office;Documents;Bent;Desk
Rubber band|Helps with a small everyday job|Stretch;Elastic;Loop;Snap;Bundle
Safety pin|Helps with a small everyday job|Metal;Clasp;Point;Clothing;Fastener
Zip tie|Helps with a small everyday job|Plastic;Loop;Tighten;Teeth;Cable
Binder clip|Helps with a small everyday job|Handles;Stack;Office;Pinch;Fold
Staple remover|Helps with a small everyday job|Office;Teeth;Paper;Pinch;Metal
Pencil sharpener|Helps with a small everyday job|Point;Shavings;Blade;Classroom;Turn
Tape dispenser|Helps with a small everyday job|Roll;Teeth;Desk;Sticky;Pull
Measuring cup|Helps with a small everyday job|Recipe;Lines;Handle;Kitchen;Amount
Can opener|Helps with a small everyday job|Lid;Turning;Kitchen;Wheel;Metal
Seat belt|Useful in a familiar situation|Buckle;Car;Click;Safety;Strap
Sleeping bag|Useful in a familiar situation|Camping;Zipper;Warm;Pack;Tent
Keychain|Useful in a familiar situation|Ring;Pocket;Charm;Metal;Carry
Flashlight|Useful in a familiar situation|Beam;Battery;Dark;Switch;Camping
Extension cord|Useful in a familiar situation|Outlet;Reach;Cable;Power;Plug
Power bank|Useful in a familiar situation|Portable;Charge;Battery;Cable;Travel
Shower curtain|Useful in a familiar situation|Rings;Privacy;Water;Rail;Fabric
Smoke detector|Useful in a familiar situation|Ceiling;Battery;Warning;Safety;Beep
Screen protector|Useful in a familiar situation|Glass;Bubble;Scratch;Phone;Thin
Walkie-talkie|Useful in a familiar situation|Radio;Button;Over;Channel;Antenna`,
 Places:`Train platform|One part of a place people visit|Tracks;Departure;Station;Edge;Timetable
Bus stop|One part of a place people visit|Shelter;Route;Bench;Schedule;Curb
Waiting room|One part of a place people visit|Appointment;Chairs;Magazine;Reception;Names
Locker room|One part of a place people visit|Bench;Team;Changing;Showers;Padlock
Dressing room|One part of a place people visit|Mirror;Curtain;Clothes;Try;Size
Parking garage|One part of a place people visit|Ramps;Cars;Levels;Ticket;Concrete
Airport security|One part of a place people visit|Tray;Shoes;Scanner;Line;Check
Hotel lobby|One part of a place people visit|Reception;Suitcases;Arrival;Sofa;Desk
Baggage claim|One part of a place people visit|Carousel;Suitcase;Arrival;Waiting;Tag
Food court|One part of a place people visit|Trays;Mall;Choices;Tables;Lunch
Escape room|People go here with a plan in mind|Puzzle;Timer;Clues;Locked;Teamwork
Skate park|People go here with a plan in mind|Ramps;Rails;Helmet;Tricks;Concrete
Mini golf|People go here with a plan in mind|Putter;Windmill;Obstacles;Scorecard;Hole
Drive-in theater|People go here with a plan in mind|Cars;Night;Screen;Speakers;Snacks
Flea market|People go here with a plan in mind|Stalls;Bargain;Used;Browsing;Weekend
Bowling alley|People go here with a plan in mind|Lane;Rental;Shoes;Score;Friends
Thrift store|People go here with a plan in mind|Secondhand;Racks;Finds;Bargain;Browsing
Farmers market|People go here with a plan in mind|Stalls;Fresh;Weekend;Local;Basket
Botanical garden|People go here with a plan in mind|Paths;Labels;Flowers;Greenhouse;Visit
Amusement arcade|People go here with a plan in mind|Tokens;Tickets;Lights;Prizes;Machines`,
 Nature:`Praying mantis|A living thing with something distinctive|Insect;Camouflage;Arms;Green;Predator
Hummingbird|A living thing with something distinctive|Hover;Nectar;Wings;Flowers;Tiny
Hermit crab|A living thing with something distinctive|Shell;Beach;Claws;Home;Borrowed
Sea turtle|A living thing with something distinctive|Shell;Flippers;Beach;Eggs;Ocean
Axolotl|A living thing with something distinctive|Gills;Pink;Aquatic;Smile;Regrow
Leaf insect|A living thing with something distinctive|Camouflage;Green;Veins;Still;Branch
Flying squirrel|A living thing with something distinctive|Glide;Trees;Night;Fur;Membrane
Pufferfish|A living thing with something distinctive|Inflate;Spines;Ocean;Round;Defense
Venus flytrap|A living thing with something distinctive|Plant;Snap;Insect;Teeth;Leaves
Dandelion|A living thing with something distinctive|Yellow;Seeds;Wish;Lawn;Floating
Tide pool|A feature of the natural world|Shallow;Rocks;Coast;Anemone;Trapped
Pine cone|A feature of the natural world|Scales;Tree;Seeds;Forest;Brown
Northern lights|A feature of the natural world|Colors;Sky;Polar;Night;Dancing
Solar eclipse|A feature of the natural world|Shadow;Daytime;Moon;Glasses;Darkness
Coral reef|A feature of the natural world|Colorful;Colony;Shallow;Ocean;Habitat
Morning dew|A feature of the natural world|Droplets;Grass;Cool;Dawn;Moisture
Whirlpool|A feature of the natural world|Spiral;Current;Water;Spin;Pull
Shooting star|A feature of the natural world|Wish;Streak;Night;Trail;Quick
Petrified wood|A feature of the natural world|Stone;Ancient;Trunk;Minerals;Pattern
Meteor crater|A feature of the natural world|Impact;Bowl;Rock;Ancient;Surface`,
 Screen:`Infinity Gauntlet|Part of a fictional world|Stones;Glove;Power;Gold;Collect
Sorting Hat|Part of a fictional world|Choice;Head;Tradition;Talking;School
Batmobile|Part of a fictional world|Car;Gadgets;Black;Garage;City
Lightsaber|Part of a fictional world|Glow;Duel;Handle;Blade;Humming
Magic carpet|Part of a fictional world|Woven;Journey;Pattern;Sky;Tassels
Glass slipper|Part of a fictional world|Fit;Delicate;Lost;Stairs;Midnight
Golden Snitch|Part of a fictional world|Wings;Chase;Tiny;Fast;Catch
The One Ring|Part of a fictional world|Inscription;Temptation;Journey;Circle;Precious
Spider-suit|Part of a fictional world|Fabric;Mask;Red;Stretch;Identity
DeLorean|Part of a fictional world|Retro;Journey;Metal;Garage;Road
Dobby|A character with a recognizable role|Sock;Freedom;Elf;Helpful;Loyal
Chewbacca|A character with a recognizable role|Furry;Growl;Copilot;Tall;Loyal
Wednesday Addams|A character with a recognizable role|Braids;Gothic;Deadpan;Dance;School
Optimus Prime|A character with a recognizable role|Truck;Robot;Leader;Transform;Voice
Green Goblin|A character with a recognizable role|Glider;Pumpkin;Mask;Cackle;Enemy
Fairy Godmother|A character with a recognizable role|Wand;Helper;Transformation;Wish;Sparkle
Captain Jack Sparrow|A character with a recognizable role|Compass;Hat;Ship;Witty;Escape
Toothless|A character with a recognizable role|Wings;Trust;Black;Friendship;Flight
Lord Farquaad|A character with a recognizable role|Castle;Short;Haircut;Ruler;Perfect
Dr. Doofenshmirtz|A character with a recognizable role|Invention;Rival;Coat;Plans;Backstory`
};
const aliases={
 Hotbar:['Hot bar'],Inventory:['Item inventory'],Loadout:['Weapon loadout'],
 'Health bar':['HP bar','Life bar'],Minimap:['Mini map'],Cooldown:['Cool down'],
 'Skill tree':['Talent tree'],'Battle pass':['Battlepass'],'Save file':['Save game','Saved game'],
 'Difficulty setting':['Difficulty level'],'Fall damage':['Falling damage'],'Friendly fire':['Team damage'],
 'Critical hit':['Crit','Critical strike'],'Double jump':['Double-jump'],'Fast travel':['Fast-travel'],
 'Respawn point':['Spawn point'],'Spawn protection':['Spawn shield'],'Wall jump':['Wall-jump'],
 'Quick-time event':['Quick time event','QTE'],'Stealth mission':['Stealth level'],
 'Grilled cheese':['Grilled cheese sandwich'],'Baked potato':['Jacket potato'],
 'Chicken pot pie':['Chicken potpie'],'Egg roll':['Egg rolls'],'Crab cake':['Crab cakes'],
 'Fortune cookie':['Fortune cookies'],'Peanut butter cup':['Peanut butter cups'],
 'Jelly donut':['Jelly doughnut','Jam doughnut','Jam donut'],'Funnel cake':['Funnel cakes'],
 'Caramel apple':['Toffee apple'],'Lemon meringue pie':['Lemon meringue'],
 'Paper clip':['Paperclip'],'Rubber band':['Elastic band'],'Zip tie':['Cable tie'],
 'Binder clip':['Foldback clip','Bulldog clip'],'Staple remover':['Destapler'],'Pencil sharpener':['Sharpener'],
 'Tape dispenser':['Sticky tape dispenser'],'Measuring cup':['Measuring jug'],'Can opener':['Tin opener'],
 'Seat belt':['Seatbelt'],'Keychain':['Key chain','Keyring','Key ring'],
 'Power bank':['Powerbank','Portable charger'],'Smoke detector':['Smoke alarm'],
 'Walkie-talkie':['Walkie talkie','Two-way radio'],'Train platform':['Railway platform'],
 'Dressing room':['Fitting room'],'Parking garage':['Parking deck','Car park'],
 'Airport security':['Airport security checkpoint','TSA checkpoint'],'Baggage claim':['Baggage reclaim'],
 'Mini golf':['Miniature golf','Minigolf','Putt putt'],'Drive-in theater':['Drive in theater','Drive-in theatre','Drive in cinema'],
 'Thrift store':['Thrift shop','Charity shop'],'Farmers market':["Farmer's market"],
 'Botanical garden':['Botanic garden','Botanical gardens'],'Amusement arcade':['Arcade','Video arcade'],
 'Praying mantis':['Mantis'],'Hermit crab':['Hermit crabs'],'Sea turtle':['Marine turtle'],
 'Pufferfish':['Puffer fish','Blowfish'],'Venus flytrap':['Flytrap','Venus fly trap'],
 'Tide pool':['Tidepool','Rock pool'],'Pine cone':['Pinecone'],
 'Northern lights':['Aurora borealis','Aurora'],'Solar eclipse':['Eclipse of the sun'],
 'Morning dew':['Dew'],'Whirlpool':['Water vortex'],'Shooting star':['Meteor'],
 'Petrified wood':['Fossilized wood','Fossilised wood'],'Meteor crater':['Impact crater','Meteorite crater'],
 'Infinity Gauntlet':['Thanos gauntlet'],'Sorting Hat':['The Sorting Hat'],'Batmobile':['The Batmobile'],
 Lightsaber:['Light saber'],'Magic carpet':['Flying carpet'],'Glass slipper':['Cinderella slipper'],
 'Golden Snitch':['Snitch'],'The One Ring':['One Ring','Sauron ring'],
 'Spider-suit':['Spider suit','Spiderman suit','Spider-Man suit'],'DeLorean':['Delorean time machine'],
 Chewbacca:['Chewie'],'Wednesday Addams':['Wednesday'],'Optimus Prime':['Optimus'],
 'Green Goblin':['The Green Goblin'],'Fairy Godmother':['The Fairy Godmother'],
 'Captain Jack Sparrow':['Jack Sparrow'],'Lord Farquaad':['Farquaad'],
 'Dr. Doofenshmirtz':['Dr Doofenshmirtz','Doctor Doofenshmirtz','Heinz Doofenshmirtz','Doofenshmirtz']
};
export const OATH_QUESTIONS=Object.entries(groups).flatMap(([category,text])=>text.split('\n').map((row,i)=>{const [answer,hint,clues]=row.split('|');return {id:'oath-'+category.toLowerCase()+'-'+(i+1),category,prompt:'One witness is bluffing. Find out who.',answer,aliases:aliases[answer]??[],hint,clues:clues.split(';')};}));
export const OATH_BY_ID=new Map(OATH_QUESTIONS.map(q=>[q.id,q]));
