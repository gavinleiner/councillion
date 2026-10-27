import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PACK_BY_ID} from '../data.js';
import {resolveAnswer} from '../answer-matching.js';

const specs=JSON.parse(readFileSync(new URL('../data-snapshots/authored/practical-science-specifications.json',import.meta.url))).questions;
const pack=id=>PACK_BY_ID.get('authored-'+id);
const exact=(id,input)=>{const r=resolveAnswer(pack(id),input);assert.equal(r.status,'exact',id+': '+input);return r.answer;};
const same=(id,a,b)=>assert.equal(exact(id,a).label,exact(id,b).label,a+' / '+b);

test('independently proposed familiar science, safety and puzzle inputs actually grade',()=>{
 for(const q of specs)for(const input of q.familiar)exact(q.key,input);
 for(const q of specs)for(const input of q.exclude)assert.equal(resolveAnswer(pack(q.key),input).status,'missing',q.key+': '+input);
});
test('proper joint synonyms share identity, while real joint types remain separate',()=>{
 for(const[a,b]of [['Shoulder','Glenohumeral joint'],['Wrist','Radiocarpal joint'],['TMJ','Temporomandibular joint'],['Diarthrosis','Synovial joint'],['Dentoalveolar syndesmosis','Gomphosis'],['Ellipsoid joint','Condyloid joint'],['Sternochondral joints','Sternocostal joint']])same('human-joints',a,b);
 for(const[a,b]of [['Hinge joint','Pivot joint'],['Knee','Hip'],['Proximal radioulnar joint','Distal radioulnar joint'],['Synchondrosis','Symphysis']])assert.notEqual(exact('human-joints',a).label,exact('human-joints',b).label);
 for(const input of ['Coronal suture','Schindylesis','Interphalangeal joint of great toe','Patellofemoral joint','Sacroiliac joint'])exact('human-joints',input);
 for(const input of ['Synovial fluid','Articular capsule','Superior cavity of temporomandibular joint','TA2 Part 2','Joint'])assert.notEqual(resolveAnswer(pack('human-joints'),input).status,'exact',input);
});
test('blood vessel groups, public names and real abbreviations work without grading vessel parts as vessels',()=>{
 for(const[a,b]of [['Circle of Willis','Cerebral arterial circle'],['IVC','Inferior vena cava'],['SVC','Superior vena cava'],['Portal vein','Hepatic portal vein'],['LAD','Anterior interventricular artery'],['PDA','Inferior interventricular artery'],['Vein of Galen','Great cerebral vein']])same('human-blood-vessels',a,b);
 for(const input of ['Pulmonary vessels','Ductus arteriosus','Umbilical vein','Internal jugular vein','Coronary sinus','Rete mirabile','Transverse facial artery'])exact('human-blood-vessels',input);
 for(const input of ['Left ventricle','Lymphatic vessel','Valve of inferior vena cava','Tunica media of vessel','Ligamentum arteriosum','Occluded part of umbilical artery'])assert.notEqual(resolveAnswer(pack('human-blood-vessels'),input).status,'exact',input);
 assert.notEqual(exact('human-blood-vessels','Right coronary artery').label,exact('human-blood-vessels','Left coronary artery').label);
});
test('weather devices include ordinary and modern names without turning a source typo into an alias',()=>{
 for(const[a,b]of [['Weather vane','Wind vane'],['Pluviometer','Rain gauge'],['Recording barometer','Barograph'],['ASOS','Automated Surface Observing System']])same('weather-observation-instruments',a,b);
 for(const input of ['Disdrometer','Impact disdrometer','Optical disdrometer','Nephoscope','Weather drone','Stevenson screen','Black globe thermometer','Precipitation weighing gauge','Cloud mirror'])exact('weather-observation-instruments',input);
 for(const input of ['Hydrograph','Umbrella','Generic airplane','Barometric pressure'])assert.notEqual(resolveAnswer(pack('weather-observation-instruments'),input).status,'exact',input);
});
test('protective equipment retains actual international respirator classes and common omitted items',()=>{
 for(const input of ['N95','N99','N100','R95','R99','R100','P95','P99','P100','FFP1','FFP2','FFP3','KN95','KF94','DS2','DL3','PFF2','SCBA','PAPR','Lab coat','Sunscreen','Barrier cream','Lead apron','Life jacket','Metatarsal guards'])exact('personal-protective-equipment',input);
 same('personal-protective-equipment','N95 mask','N95 respirator');
 assert.notEqual(exact('personal-protective-equipment','N95').label,exact('personal-protective-equipment','KN95').label);
 assert.notEqual(exact('personal-protective-equipment','Life jacket').label,exact('personal-protective-equipment','Personal flotation device').label);
 for(const input of ['NG','KH','TV','Hand sanitizer','Notebook'])assert.notEqual(resolveAnswer(pack('personal-protective-equipment'),input).status,'exact',input);
});
test('physical generation methods and radiation bands are actual names rather than generated initials',()=>{
 for(const input of ['Solar power','Battery','Fuel cell','Microbial fuel cell','MFC','Pyroelectricity','Friction','RTG','Osmotic power','MHD generator'])exact('electricity-generation-methods',input);
 for(const input of ['UVA','UVB','UVC','UV','IR','CMB','Red light','Radio waves','Hawking radiation','Smith-Purcell radiation','Cyclotron radiation'])exact('radiation-forms',input);
 for(const[id,input]of [['electricity-generation-methods','Perpetual motion'],['electricity-generation-methods','Arc reactor'],['radiation-forms','Kryptonite radiation'],['radiation-forms','Ocean waves'],['radiation-forms','Gravity spell']])assert.equal(resolveAnswer(pack(id),input).status,'missing',input);
});
test('creator puzzle names share real forms without accepting arbitrary game titles',()=>{
 for(const[a,b]of [['Hashi','Hashiwokakero'],['Bridges','Hashiwokakero'],['Tentai Show','Spiral Galaxies'],['Light Up','Akari'],['Hidoku','Hidato'],['Keen','KenKen'],['Pegs','Peg solitaire'],['Galaxies','Tentai Show'],['Hanjie','Nonogram'],['Fifteen puzzle','15 puzzle'],['Fifteen','Fifteen puzzle']])same('puzzle-kinds',a,b);
 for(const input of ['Crossword','Rubiks Cube','Tangram','Chinese rings','Mastermind','Dominosa','Untangle','Netwalk','Netslide','Kakuro','Tapa','Arrow Sudoku','Jigsaw Sudoku','Killer Sudoku','Takuzu'])exact('puzzle-kinds',input);
 for(const input of ['Fortnite','Chess tournament','Lottery ticket'])assert.equal(resolveAnswer(pack('puzzle-kinds'),input).status,'missing',input);
 assert.notEqual(exact('puzzle-kinds','Sudoku').label,exact('puzzle-kinds','Killer Sudoku').label);
});
