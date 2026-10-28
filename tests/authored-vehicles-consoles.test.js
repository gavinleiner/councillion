import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';
import{PACK_BY_ID}from'../data.js';import{resolveAnswer}from'../answer-matching.js';
const specs=JSON.parse(readFileSync(new URL('../data-snapshots/authored/vehicle-console-specifications.json',import.meta.url))).questions;
const exact=(id,s)=>{const r=resolveAnswer(PACK_BY_ID.get('authored-'+id),s);assert.equal(r.status,'exact',id+': '+s);return r.answer;};
test('all independently selected familiar makers and gaming systems actually grade',()=>{for(const q of specs)for(const s of q.familiar)exact(q.key,s);});
test('real maker names and historical replacements share identity without erasing different marques',()=>{
 for(const[a,b]of [['Ford','Ford Motor Company'],['Ford Australia','Ford'],['BMW Motorrad','BMW'],['Mitsubishi Motors','Mitsubishi'],['Navistar','International'],['International Harvester','International'],['SsangYong','KG Mobility'],['Nissan Diesel','UD Trucks']])assert.equal(exact('motor-vehicle-brands',a).label,exact('motor-vehicle-brands',b).label);
 for(const[a,b]of [['Toyota','Lexus'],['Honda','Acura'],['Nissan','Infiniti'],['Land Rover','Range Rover'],['Daimler','Daimler AG'],['GMC','GM']])assert.notEqual(exact('motor-vehicle-brands',a).label,exact('motor-vehicle-brands',b).label);
 for(const s of ['Blue Bird','Thomas Built Buses','Prevost','New Flyer','BSA','Norton','Brabus','Mercedes-AMG','American LaFrance'])exact('motor-vehicle-brands',s);
 assert.equal(exact('motor-vehicle-brands','Gersix').label,exact('motor-vehicle-brands','Kenworth').label);
});
test('published regional hardware names share identity, while actual named revisions stay distinct',()=>{
 for(const[a,b]of [['NES','Famicom'],['SNES','Super Famicom'],['Sega Genesis','Mega Drive'],['Sega CD','Mega-CD'],['TurboGrafx-16','PC Engine'],['PlayStation TV','PS Vita TV'],['Game.com','Tiger Game.com'],['PS5','PlayStation 5']])assert.equal(exact('game-console-models',a).label,exact('game-console-models',b).label);
 for(const[a,b]of [['Wii','Wii U'],['Nintendo DS','Nintendo DS Lite'],['Nintendo 3DS','New Nintendo 3DS'],['PlayStation','PS one'],['Xbox Series X','Xbox Series S'],['Steam Deck','Steam Deck OLED']])assert.notEqual(exact('game-console-models',a).label,exact('game-console-models',b).label);
 assert.equal(exact('game-console-models','PlayStation 5').points,10);assert.equal(exact('motor-vehicle-brands','Toyota').points,10);
 assert.equal(exact('game-console-models','BBC Bridge Companion').points,100);assert.equal(exact('motor-vehicle-brands','Borgward').points,100);
});
test('source truck captions, linked countries and corrected source misspellings do not become brands',()=>{
 for(const s of ['Cyprus','Namibia','Manufacturer','Image','Iveco PowerStar 420 E5','Mercedes-Benz Actros','Hino 238','Kenworth W900','Hero Motocop','Nissian/Minsei'])assert.notEqual(resolveAnswer(PACK_BY_ID.get('authored-motor-vehicle-brands'),s).status,'exact',s);
 for(const s of ['Boeing','Michelin','Hot Wheels','Toyota Camry','Honda Civic','Range Rover Sport','FlixBus'])assert.notEqual(resolveAnswer(PACK_BY_ID.get('authored-motor-vehicle-brands'),s).status,'exact',s);
});
test('game hardware does not accept CPU/input metadata, unbuilt prototypes or bare game titles',()=>{
 for(const s of ['TV Game','Video Game','Image','Paddle','AY-3-8500','DualSense controller','Nintendo Dolphin prototype','Atari 2700','KFConsole','Phantom','Game & Watch Tetris Jr.','Donkey Kong','Fire TV','iPhone'])assert.notEqual(resolveAnswer(PACK_BY_ID.get('authored-game-console-models'),s).status,'exact',s);
 for(const s of ['Game & Watch Donkey Kong','Game & Watch DK-52','Game & Watch Toss-Up','Game & Watch Ball','Atari Paddle Controller','Visulex Computerized Ping Pong kit'])exact('game-console-models',s);
 for(const s of ['СУ-А','Shanghai Chunlei Electronic Instrument Factory'])assert.notEqual(resolveAnswer(PACK_BY_ID.get('authored-game-console-models'),s).status,'exact',s);
});
test('source public model names work without newly invented two-letter shortcuts',()=>{
 for(const s of ['NES','SNES','PSP','GBA','DS','PS5'])exact('game-console-models',s);
 for(const s of ['NP','SC','GC','FC'])assert.notEqual(resolveAnswer(PACK_BY_ID.get('authored-game-console-models'),s).status,'exact',s);
 for(const s of ['MG','GM','AC','DS','FN','CZ'])exact('motor-vehicle-brands',s);
 assert.notEqual(resolveAnswer(PACK_BY_ID.get('authored-motor-vehicle-brands'),'GA').status,'exact');
});
