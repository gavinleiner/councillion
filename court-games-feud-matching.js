import {normalize} from './answer-matching.js';
import {resolveShowAnswer} from './game-show-answer-matching.js';

// These are recognition aliases, not extra survey slots or new points. Expand
// a meaning only when exactly one answer on this particular board owns it.
// Never use generic semantic similarity: a related thing is not an equivalent.
export const FEUD_EQUIVALENTS=[
 ['cemetery','graveyard','burial ground','burial grounds','churchyard'],
 ['mortuary','funeral home','funeral parlour','funeral parlor'],
 ['couch','sofa','settee'],['refrigerator','fridge','icebox'],
 ['television','tv','telly'],['tv remote','remote control','television remote','remote'],
 ['cellphone','cell phone','mobile phone','mobile','smartphone'],
 ['bathroom','restroom','washroom','lavatory','loo'],
 ['toilet','commode'],['garbage','trash','rubbish'],
 ['garbage can','trash can','rubbish bin','trash bin','garbage bin','dustbin'],
 ['garbage collector','trash collector','sanitation worker','garbage man'],
 ['car','automobile','motorcar'],['car park','parking lot'],
 ['airplane','aeroplane','plane','aircraft'],['bicycle','bike','cycle'],
 ['motorcycle','motorbike'],['cab','taxi','taxicab'],
 ['subway','underground','metro'],['truck','lorry'],
 ['truck driver','trucker','lorry driver'],['gasoline','petrol','gas'],
 ['flat tire','flat tyre','puncture','punctured tire'],
 ['accident','crash','collision'],['breakdown','broken down','broke down'],
 ['jail','prison','penitentiary'],['prisoner','inmate','convict'],
 ['lawyer','attorney','legal counsel'],['doctor','physician','medical doctor'],
 ['vet','veterinarian'],['firefighter','fireman','fire fighter'],
 ['mail carrier','mailman','postman','postal worker','letter carrier'],
 ['police officer','policeman','policewoman','cop','police'],
 ['police station','police department','precinct'],
 ['lifeguard','life guard'],['fisherman','fisher','angler'],
 ['waiter','waitress','server'],['hairstylist','hairdresser'],
 ['teacher','educator','schoolteacher'],['principal','headmaster','headmistress'],
 ['dentures','false teeth','denture'],['eyeglasses','spectacles','reading glasses'],
 ['contact lenses','contacts','contact lens'],['hearing aid','hearing aids'],
 ['medicine','medication','medications','meds'],['illness','sickness','disease'],
 ['vomit','throw up','puke','barf','throwing up'],['belch','burp','burping','belching'],
 ['pass gas','fart','farting','flatulence','passing gas','breaking wind'],
 ['perspire','sweat','sweating','perspiring'],['sneeze','sneezing'],
 ['sleep','sleeping','slumber'],['snore','snoring'],
 ['cry','crying','weep','weeping','sob','sobbing'],
 ['laugh','laughing','laughter','giggle','giggling'],
 ['yell','yelling','shout','shouting'],['scream','screaming','shriek'],
 ['die','dying','pass away','passed away'],['quit','resign','resignation'],
 ['steal','stealing','theft','rob','robbing'],
 ['staying too long','overstay','overstaying','never leaves','wont leave','outstay welcome'],
 ['making a mess','messy','mess','being messy','leaving a mess'],
 ['complain','complaining','whining','whine'],
 ['large ears','big ears','huge ears','gigantic ears'],
 ['large feet','big feet','huge feet'],['big nose','large nose','huge nose'],
 ['money','cash','dollars','bucks','moolah','moola'],
 ['vacation','holiday','trip','getaway'],['house','home'],
 ['relative','family member','relation'],['relative\'s home','relatives house','family members house'],
 ['mom','mum','mother','mama'],['dad','father','papa'],
 ['grandma','grandmother','granny','nan','nana'],['grandpa','grandfather','grandad','granddad'],
 ['girlfriend','gf'],['boyfriend','bf'],['husband','hubby'],['wife','wifey'],
 ['partner','significant other'],['purse','handbag','pocketbook'],
 ['backpack','rucksack','bookbag'],['suitcase','luggage','baggage'],
 ['clothes','clothing','apparel','garments'],['pajamas','pyjamas','pjs'],
 ['footie pajamas','footed pajamas','footie pyjamas','onesie pajamas'],
 ['diaper','nappy'],['sneakers','trainers','tennis shoes'],['flip flops','flipflops','thongs'],
 ['sweater','jumper','pullover'],['swimsuit','bathing suit','swimming costume'],
 ['underwear','underpants','undies'],['bra','brassiere'],
 ['blanket','blankets','cover','covers'],['comforter','duvet'],
 ['closet','wardrobe'],['dresser','chest of drawers'],
 ['movie theater','movie theatre','cinema','theater','theatre','movies'],
 ['restaurant','eatery','diner'],['bar','pub','tavern'],
 ['supermarket','grocery store','grocery shop'],['mall','shopping mall','shopping center','shopping centre'],
 ['laundromat','launderette','laundry'],['amusement ride','fairground ride','carnival ride'],
 ['amusement park','theme park'],['ocean','sea'],['outside','outdoors'],
 ['beach','seashore','seaside'],['forest','woods','woodland'],
 ['yard','garden'],['lawn','grass'],['road','street'],
 ['sidewalk','pavement','footpath'],['elevator','lift'],
 ['stairs','staircase','steps'],['attic','loft'],['basement','cellar'],
 ['faucet','tap'],['flashlight','torch'],['outlet','socket','power outlet'],
 ['washcloth','facecloth'],['dish soap','dishwashing liquid','washing up liquid'],
 ['silverware','cutlery','flatware'],['colander','strainer','sieve'],
 ['stove','cooker'],['washing machine','washer','clothes washer'],
 ['dryer','tumble dryer','clothes dryer'],['vacuum','vacuum cleaner','hoover'],
 ['soda','pop','soft drink','soda pop'],['water','drinking water'],
 ['coffee','cup of coffee','java'],['tea','cup of tea'],
 ['alcohol','booze','liquor','alcoholic drinks'],['beer','brew','brewski'],
 ['candy','sweets','confectionery'],['chips','crisps','potato chips'],
 ['french fries','fries','french fried potatoes'],['cookies','biscuits'],
 ['ice cream','icecream'],['popsicle','ice pop','ice lolly'],
 ['candy bar','chocolate bar'],['jelly beans','jelly bean','jellybean','jellybeans'],
 ['peanut butter','pb'],['peanut butter and jelly','pb and j','pbj','pb&j'],
 ['hot dog','hotdog','frankfurter'],['hamburger','burger'],
 ['sandwich','sammie','sub sandwich'],['pasta','noodles'],
 ['corn on the cob','corn','sweetcorn'],['cotton candy','candy floss','candyfloss'],
 ['cotton swab','q tip','qtip','cotton bud'],
 ['rabbit','bunny','bunnies','rabbits'],['dog','dogs','pooch','canine'],
 ['puppy','puppies','baby dog'],['cat','cats','kitty','feline'],
 ['kitten','kittens','baby cat'],['pig','pigs','swine','hog'],
 ['hippo','hippopotamus'],['alligator','gator'],['crocodile','croc'],
 ['mouse','mice'],['rat','rats'],['bug','insect','bugs','insects'],
 ['spider','spiders'],['snake','snakes','serpent'],
 ['horse','horses','steed'],['cow','cows','cattle'],
 ['chicken','chickens','hen'],['rooster','cockerel'],
 ['donkey','ass'],['goat','goats'],['sheep','ewe'],
 ['fish','fishes'],['dolphin','dolphins'],['parrot','parrots'],
 ['bouquet','bunch of flowers','flowers'],['tornado','twister'],
 ['storm','stormy','tempest'],['lightning','lightning bolt'],
 ['snow','snowfall'],['rain','rainfall','raining'],
 ['saxophone','sax'],['cello','violoncello'],
 ['rubber band','elastic band','rubberband'],['paperclip','paper clip'],
 ['thumbtack','tack','drawing pin'],['razor blade','razor'],
 ['gun','firearm','pistol','handgun'],['wrestling','wrestle'],
 ['horse racing','horseracing','jockey'],['soccer ball','football soccer'],
 ['football','american football'],['basketball','basket ball'],
 ['new year\'s','new years','new years eve','new year'],
 ['christmas','xmas'],['valentine\'s day','valentines','valentine'],
 ['fourth of july','july fourth','july 4','4th of july','independence day']
];

const cache=new WeakMap();
export function feudAnswerPack(board){
 if(cache.has(board))return cache.get(board);
 // Transcripts shout ordinary words (CEMETERY, TANK). They are not acronyms;
 // lower-case recognition copies keep their spelling candidates available.
 const answers=board.answers.map(a=>({...a,aliases:(a.aliases??[]).map(text=>text.toLowerCase())}));
 const owners=new Map();
 for(const [i,a]of answers.entries())for(const text of [a.label,...a.aliases]){
  const key=normalize(text);if(!owners.has(key))owners.set(key,new Set());owners.get(key).add(i);
 }
 for(const group of FEUD_EQUIVALENTS){
  const matches=new Set(group.flatMap(text=>[...(owners.get(normalize(text))??[])]));
  if(matches.size!==1)continue;
  const i=[...matches][0];
  for(const text of group){const key=normalize(text),other=owners.get(key);if(other&&[...other].some(n=>n!==i))continue;
   if(!answers[i].aliases.some(a=>normalize(a)===key)&&normalize(answers[i].label)!==key){answers[i].aliases.push(text);owners.set(key,new Set([i]));}
  }
 }
 const pack={...board,answers};cache.set(board,pack);return pack;
}
export const resolveFeudAnswer=(board,input)=>resolveShowAnswer(feudAnswerPack(board),input);
export const matchFeudAnswer=(board,input)=>resolveFeudAnswer(board,input).answer??null;
