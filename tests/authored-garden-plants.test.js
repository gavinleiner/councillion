import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PACK_BY_ID} from '../data.js';
import {resolveAnswer} from '../answer-matching.js';

const specs=JSON.parse(readFileSync(new URL('../data-snapshots/authored/garden-plants-specifications.json',import.meta.url))).questions;
const pack=id=>PACK_BY_ID.get('authored-'+id);
const exact=(id,input)=>{const r=resolveAnswer(pack(id),input);assert.equal(r.status,'exact',`${id}: ${input}`);return r.answer;};
const same=(id,a,b)=>assert.equal(exact(id,a).label,exact(id,b).label,`${a} / ${b}`);
const different=(id,a,b)=>assert.notEqual(exact(id,a).label,exact(id,b).label,`${a} / ${b}`);

test('three whole plant subjects grade every independent familiar input and reject their wrong boundaries',()=>{
 for(const q of specs){
  for(const input of q.familiar)exact(q.key,input);
  for(const input of q.exclude)assert.equal(resolveAnswer(pack(q.key),input).status,'missing',`${q.key}: ${input}`);
 }
});

test('ordinary houseplant result names, botanical synonyms and ambiguous public names preserve real identities',()=>{
 for(const [input,label]of [['Epipremnum aureum','Pothos'],['Dracaena trifasciata','Snake plant'],['Ficus lyrata','Fiddle-leaf fig'],['Streptocarpus ionanthus','African violet'],['Monstera deliciosa','Swiss cheese plant']])assert.equal(exact('houseplants',input).label,label);
 for(const[a,b]of [['Sansevieria trifasciata','Snake plant'],['Saintpaulia ionantha','African violet'],['Calathea insignis','Goeppertia insignis'],['Hens & chicks','Hens and chicks']])same('houseplants',a,b);
 for(const[a,b]of [['Monstera deliciosa','Monstera adansonii'],['Calathea crotalifera','Goeppertia insignis'],['Haworthiopsis attenuata','Haworthiopsis fasciata'],['Dracaena','Snake plant'],['Philodendron','Philodendron hederaceum'],['Anthurium','Anthurium andraeanum']])different('houseplants',a,b);
 for(const input of ['Fern','Orchid','Cactus','Bromeliad','ZZ plant','English ivy','Prayer plant','Moth orchid','Ponytail palm','Gasteria obliqua',"Echeveria 'Lola'",'Ficus bhotanica'])exact('houseplants',input);
 for(const input of ['SP','PP','AA','Big Seed Copperleaf',"Asparagus densiflorus Sprengeri Group 'Meyersii'",'Plant toolbox header'])assert.notEqual(resolveAnswer(pack('houseplants'),input).status,'exact',input);
});

test('succulent inventory repairs false metadata and missing familiar forms without merging mixed genera',()=>{
 for(const input of ['Madagascar palm','Ponytail palm','Tiger jaws',"Bear's paw",'Baby toes','Baseball plant','Split rock','Paddle plant','Elephant bush','Spekboom','Gasteria','Ox tongue','Cotyledon tomentosa','Haworthia cooperi',"Echeveria 'Lola'",'Oscularia piquetbergensis'])exact('succulent-kinds',input);
 for(const[a,b]of [['Golden barrel cactus','Echinocactus grusonii'],['Saguaro','Carnegiea gigantea'],['Hens & chicks','Hens and chicks'],['Jade plant','Crassula ovata'],['Gasteria bicolor','Gasteria obliqua'],['Baby toes','Fenestraria rhopalophylla']])same('succulent-kinds',a,b);
 for(const[a,b]of [['Elephant bush','Jade plant'],['Pachyphytum','Pachyphytum oviferum'],['Haworthia','Haworthiopsis fasciata'],['Sempervivum','Sempervivum tectorum']])different('succulent-kinds',a,b);
 for(const input of ["Prunus persica 'Carolina Red'",'Nectarine','Pereskia','Dracaena','African milkweed','Sunflower','SP','HJ'])assert.notEqual(resolveAnswer(pack('succulent-kinds'),input).status,'exact',input);
});

test('carnivorous names respect monotypic identities, current evidence and full cultivar qualifications',()=>{
 for(const[a,b]of [['Dionaea','Venus flytrap'],['Dionaea muscipula','Venus flytrap'],['Cephalotus','Australian pitcher plant'],['Darlingtonia','Cobra lily'],['Aldrovanda','Waterwheel plant'],['Drosophyllum','Dewy pine'],['Cape sundew','Drosera capensis'],['Nepenthes x ventrata','Nepenthes ventrata'],["Dionaea 'Akai Ryu'","Dionaea muscipula 'Red Dragon'"]])same('carnivorous-plant-kinds',a,b);
 for(const input of ['Nepenthes × hookeriana',"Nepenthes 'Miranda'",'Byblis liniflora','Roridula gorgonias','Brocchinia reducta','Brocchinia hechtioides','Catopsis berteroniana','Triantha occidentalis','Philcoxia minensis',"Dionaea muscipula 'Magikarp'",'Utricularia petertaylorii'])exact('carnivorous-plant-kinds',input);
 for(const[a,b]of [['Drosera capensis','Drosera rotundifolia'],['Drosera intermedia','Drosera binata'],['Nepenthes x ventrata','Nepenthes alata'],["Dionaea 'Akai Ryu'","Dionaea 'Petite Dragon'"],["Sarracenia 'Judith Hindle'","Sarracenia 'Ada Rawlings'"]])different('carnivorous-plant-kinds',a,b);
 // A cultivar may share a hybrid parentage with another cultivar. The older
 // database's taxonomic synonym comment does not mean the clones are identical.
 for(const input of ['Brocchinia micrantha','Ibicella lutea','Proboscidea louisianica','Dioncophyllum thollonii','Piranha Plant','Audrey II','Magikarp','DC','VFT'])assert.notEqual(resolveAnswer(pack('carnivorous-plant-kinds'),input).status,'exact',input);
});
