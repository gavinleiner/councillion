import {ordinaryQuestionAllowed,ORDINARY_POLICY_BUILD} from './ordinary-question-policy.js';
// Deliberate admission to ordinary play. Source volume alone is not a quality
// signal: geographical micro-filters, cast-credit artifacts and ambiguous
// dictionary senses stay archived instead of resurfacing in random queues.
export const QUESTION_QUALITY_BUILD=ORDINARY_POLICY_BUILD;
const ids=text=>new Set(text.trim().split(/\s+/));
const general=ids(`
no-wheels airline-extras cultured-dairy seasonings condiment-counter
sandwiches sausage-varieties tea-varieties culinary-fruits culinary-vegetables edible-fish edible-shellfish cocktail-names
dog-breeds cat-breeds horse-breeds rabbit-breeds flower-names gem-materials weather-conditions
guitar-makers board-game-titles tolkien-characters egyptian-deities literary-authors tabletop-rpgs occupation-titles
fabric-types clothing-items household-appliances room-types rope-knots programming-languages named-colours academic-fields food-preparation-verbs
catalog-soups catalog-cakes catalog-breads catalog-desserts catalog-salads catalog-rice-dishes catalog-dumplings catalog-noodles
catalog-fermented-foods catalog-street-foods catalog-flatbreads catalog-stews catalog-snacks catalog-coffee-drinks catalog-confectionery catalog-edible-nuts catalog-citrus
animal-mammals animal-marsupials animal-primates animal-bats animal-rodents animal-snakes animal-salamanders animal-frogs animal-sharks
catalog-mineral-species catalog-space-missions catalog-space-probes catalog-cloud-types
catalog-instrument-types catalog-percussion-types catalog-string-instrument-types catalog-wind-instrument-types catalog-electronic-instrument-types
catalog-genre-clean catalog-rock-subgenres catalog-jazz-subgenres catalog-electronic-subgenres catalog-folk-subgenres
catalog-dances catalog-card-games catalog-mythical-creature-types catalog-musical-terms catalog-musical-scales catalog-poetic-forms
catalog-rhetorical-types catalog-literary-clean catalog-fictional-robots catalog-fictional-dragons
catalog-furniture-types catalog-jewelry-types catalog-hand-tool-types catalog-textile-types modern-art-movements world-capitals pokemon-species
`);
const semantic=ids(`
exercise-n-01 art-n-02 crime-n-01
domestic_animal-n-01 young-n-01 shark-n-01 bird_of_prey-n-01 frog-n-01 lizard-n-01 snake-n-01 aquatic_bird-n-01 aquatic_mammal-n-01
whale-n-02 canine-n-02 feline-n-01 insect-n-01 butterfly-n-01 rodent-n-01
aircraft-n-01 bag-n-01 ball-n-01 boat-n-01 box-n-01 bridge-n-01 building-n-01 car-n-01 chair-n-01 coat-n-01
computer-n-01 container-n-01 drawing-n-02 dwelling-n-01 electrical_device-n-01 electronic_device-n-01 engine-n-01 footwear-n-02
house-n-01 jacket-n-01 kitchen_appliance-n-01 knife-n-01 lamp-n-01 machine-n-01 measuring_instrument-n-01 military_vehicle-n-01
motor-n-01 optical_device-n-01 paint-n-01 photograph-n-01 photographic_equipment-n-01 place_of_business-n-01 place_of_worship-n-01
printer-n-03 road-n-01 scientific_instrument-n-01 sculpture-n-01 seat-n-03 shelter-n-01 ship-n-01 shoe-n-01 shop-n-01
source_of_illumination-n-01 sports_equipment-n-01 stitch-n-01 table-n-02 tower-n-01 vehicle-n-01 warship-n-01 weapon-n-01
reference_book-n-01 document-n-01 legal_document-n-01 software-n-01 publication-n-01 award-n-02 academic_degree-n-01
gesture-n-02 musical_composition-n-01 song-n-01 social_event-n-01 contest-n-01 race-n-02
meal-n-01 baked_goods-n-01 pastry-n-02 meat-n-01 cut-n-06 seafood-n-01 dairy_product-n-01 beverage-n-01 wine-n-01 liquor-n-01 mixed_drink-n-01
musical_organization-n-01 party-n-02 educational_institution-n-01 school-n-01 court-n-01
desert-n-01 deity-n-01 greek_deity-n-01 roman_deity-n-01
tree-n-01 fruit_tree-n-01 fungus-n-01 vine-n-01 shrub-n-01 aquatic_plant-n-01 seed-n-01 nut-n-01
alloy-n-01 rock-n-02 building_material-n-01 fiber-n-01 fuel-n-01 gas-n-02 oil-n-01 paper-n-01 wood-n-01
`);
const specialist=ids(`
word-isograms word-vowels word-silent-initial dinosaur-genera north-american-birds two-letter-elements first-thousand-minor-planets
best-picture-nominees best-picture-winners atlantic-rivers pacific-indian-rivers arctic-rivers
apple-varieties pepper-varieties pony-breeds donkey-breeds obsolete-jobs meteorology-terms computing-disciplines
catalog-physical-laws catalog-mathematical-theorems catalog-branches-mathematics catalog-writing-systems catalog-printing-techniques
nobel-physics nobel-chemistry nobel-physiologyormedicine nobel-literature nobel-peace nobel-economicsciences nobel-all
`);
// Conservative ordinary-play gate while the group reviews the new proposals.
// A large metadata intersection is not an approachable or complete category.
const broadDiscovery=ids(`discovery-nfl-players discovery-nba-players discovery-mlb-players discovery-wnba-players discovery-nfl-teams discovery-nba-teams discovery-mlb-teams discovery-nhl-teams discovery-worldcup-men discovery-worldcup-women discovery-olympic-gold`);
const holdSpecialist=ids(`catalog-cloud-types modern-art-movements guitar-makers tea-varieties catalog-percussion-types catalog-string-instrument-types catalog-wind-instrument-types catalog-electronic-instrument-types academic-fields food-preparation-verbs rope-knots programming-languages catalog-mineral-species catalog-space-missions catalog-space-probes catalog-jazz-subgenres catalog-rock-subgenres catalog-electronic-subgenres catalog-folk-subgenres catalog-musical-terms catalog-musical-scales catalog-poetic-forms catalog-rhetorical-types catalog-literary-clean catalog-textile-types catalog-fermented-foods catalog-stews rabbit-breeds horse-breeds animal-bats animal-rodents animal-salamanders animal-frogs fun-stardew fun-terraria fun-elden-ring`);
const broadSemantic=ids(`exercise-n-01 domestic_animal-n-01 aircraft-n-01 bag-n-01 ball-n-01 boat-n-01 building-n-01 car-n-01 chair-n-01 coat-n-01 computer-n-01 footwear-n-02 kitchen_appliance-n-01 knife-n-01 lamp-n-01 machine-n-01 place_of_business-n-01 shoe-n-01 shop-n-01 sports_equipment-n-01 vehicle-n-01 weapon-n-01 meal-n-01 baked_goods-n-01 pastry-n-02 meat-n-01 seafood-n-01 dairy_product-n-01 beverage-n-01 tree-n-01 fruit_tree-n-01`);
export function questionReview(pack){
 if(pack.ordinaryRetired)return {status:'specialist',reason:'Held out of ordinary play after the playability review; kept only for saved dives and published Daily history.'};
 if(pack.groupProfileVersion===1)return ordinaryQuestionAllowed(pack)?{status:'automatic',reason:'Broad normal-play question under the variety review; includes all approved tryout prompts.'}:{status:'specialist',reason:'Excluded from random games: multiple Steam labels, narrow metadata combinations or specialist title/artist constraints. Available only by explicit choice.'};
 // Legacy inventories remain addressable for saved dives and optional practice.
 // They do not silently expand the admitted ordinary-play pool.
 if(general.has(pack.id)||broadDiscovery.has(pack.id)||pack.id.startsWith('fun-')||pack.id.startsWith('pokemon-type-')||pack.id==='pokemon-abilities'||pack.id.startsWith('var-semantic-')&&semantic.has(pack.id.slice(13)))return {status:'specialist',reason:'Retained optional inventory; ordinary play uses the group-selected pool.'};
 if(holdSpecialist.has(pack.id)||pack.id.startsWith('var-semantic-')&&semantic.has(pack.id.slice(13))&&!broadSemantic.has(pack.id.slice(13)))return {status:'specialist',reason:'Held out of ordinary play while the group reviews category breadth and answer coverage.'};
 if(pack.id.startsWith('discovery-')&&!(pack.qualityVersion===1&&pack.ranking==='source-familiarity-v1'&&pack.mixed&&pack.answerCount>=30&&pack.familiarCount>=8))return {status:'archived',reason:'Source inventory has not passed its integrity gates.'};
 if(pack.id.startsWith('discovery-'))return broadDiscovery.has(pack.id)&&pack.qualityVersion===1&&pack.ranking==='source-familiarity-v1'&&pack.answerCount>=30&&pack.familiarCount>=8?{status:'automatic',reason:'Broad league or international sports inventory; no team, position, award, Steam tag or multi-facet restrictions.'}:{status:'specialist',reason:'Metadata filters and narrow historical/roster subsets are excluded from Daily, Practice shuffle and Puffer.'};
 if(pack.id.startsWith('fun-'))return {status:pack.mixed?'automatic':'specialist',reason:'Broad source inventory with explicit scope.'};
 if(general.has(pack.id)||pack.id.startsWith('pokemon-type-')||pack.id==='pokemon-abilities'||pack.id.startsWith('var-semantic-')&&semantic.has(pack.id.slice(13)))return {status:'automatic',reason:'Reviewed familiar category with a concrete answer boundary.'};
 if(specialist.has(pack.id)||pack.family==='words'||pack.id.startsWith('pokemon-'))return {status:'specialist',reason:'Explicit optional challenge; excluded from ordinary random play.'};
 const group=pack.group??'';
 return {status:'archived',reason:group.startsWith('places-')||group==='cities'?'Overly narrow geographical constraint.':group==='film-casts'?'Incomplete film-credit scope and excessive restrictions.':group==='game-characters'?'Franchise membership and voice-credit contamination.':group==='game-franchises'?'Edition-heavy franchise inventory.':group.startsWith('semantic-')?'Ambiguous or overly technical dictionary category.':'Specialist source has not passed the ordinary-play review.'};
}
