import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {PACK_BY_ID} from '../data.js';
import {resolveAnswer} from '../answer-matching.js';
const root=new URL('../data-snapshots/authored/',import.meta.url);
const specs=JSON.parse(readFileSync(new URL('pepper-messengers-specifications.json',root))).questions;
const ledger=JSON.parse(readFileSync(new URL('pepper-messengers-review-ledger.json',root)));
const pack=id=>PACK_BY_ID.get('authored-'+id);
const pepper='chili-bell-pepper-types',messenger='human-chemical-messengers';
const exact=(id,input)=>{const r=resolveAnswer(pack(id),input);assert.equal(r.status,'exact',`${id}: ${input}`);return r.answer;};
const same=(id,a,b)=>assert.equal(exact(id,a).label,exact(id,b).label,`${a} / ${b}`);
const different=(id,a,b)=>assert.notEqual(exact(id,a).label,exact(id,b).label,`${a} / ${b}`);

test('two whole pepper and human-messenger subjects cover every independent familiar input',()=>{
 assert.equal(specs.length,2);
 for(const q of specs){
  assert.ok(ledger[q.key].canonicalAnswers>=100);
  for(const input of q.familiar)exact(q.key,input);
  for(const input of q.exclude)assert.equal(resolveAnswer(pack(q.key),input).status,'missing',`${q.key}: ${input}`);
 }
});

test('pepper fresh/dried names and cultivar aliases share identity, distinct strains do not',()=>{
 for(const[a,b]of [['Jalapeño','Chipotle'],['Poblano','Ancho'],['Chilaca','Pasilla'],['Mirasol','Guajillo'],['Bhut Jolokia','Ghost pepper'],['Aji Limon','Lemon drop'],['NuMex Sandia','Sandia'],['Pimento','Pimiento'],["NuMex CaJohn's Jumbo Serrano",'NuMex CaJohns'],['Fish','Fish pepper']])same(pepper,a,b);
 for(const[a,b]of [['New Mexico 6','New Mexico 6-4'],['New Mexico 6-4','NuMex Heritage 6-4'],['NuMex Big Jim','NuMex Heritage Big Jim'],['Sandia','NuMex Sandia Select'],['Española Improved','Espanola Select'],['Mirasol','NuMex Mirasol'],['Mirasol','Aji amarillo'],['Ghost pepper','Naga Viper'],['Habanero','Chocolate habanero'],['Habanero','Habanada'],['Poblano','Mulato'],['Trinidad Scorpion','Trinidad Moruga Scorpion'],['Hontaka','Takanotsume'],['Takanotsume','Santaka'],['Cascabel','Guajillo']])different(pepper,a,b);
 assert.equal(exact(pepper,'Jalapeño').points,10);assert.equal(exact(pepper,'Tabasco pepper').points,30);assert.equal(exact(pepper,'NuMex LotaLutein').points,100);
 for(const input of ['NuMex PWB','NuMex Sunflare','NuMex Sunglo','NuMex Sunburst','NuMex Sunrise','NuMex Sunset','NuMex Eclipse','Pepper X','Greek Pepperoncini','Jimmy Nardello','Resilient Shishito'])exact(pepper,input);
 for(const input of ['NM','NV','GH','Sunrise','Christmas','NuMex Camino Onion','NuMex Jalapeño Spice Mix','Some Like it Hot Blend'])assert.notEqual(resolveAnswer(pack(pepper),input).status,'exact',input);
});

test('natural human messenger aliases preserve different molecules, classes and mature products',()=>{
 for(const[a,b]of [['Adrenaline','Epinephrine'],['Norepinephrine','Noradrenaline'],['Cortisol','Hydrocortisone'],['Vasopressin','ADH'],['Growth hormone','hGH'],['Dopamine','Prolactin inhibiting hormone'],['GABA','Gamma aminobutyric acid'],['Glutamate','Glutamic acid'],['Kisspeptin','Metastin'],['Orexin A','Hypocretin 1'],['Orexin B','Hypocretin 2'],['Amylin','IAPP'],['GLP1','Glucagon like peptide 1']])same(messenger,a,b);
 for(const[a,b]of [['Cortisol','Cortisone'],['DHEA','DHEAS'],['Estrogen','Estradiol'],['Estradiol','Estrone'],['T3','T4'],['T3','rT3'],['TSH','TRH'],['Prolactin','Prolactin releasing peptide'],['Orexin','Orexin A'],['Orexin A','Orexin B'],['Alpha CGRP','Beta CGRP'],['Alpha MSH','Beta MSH'],['Somatotropin','Placental growth hormone'],['NPY','PYY'],['Met enkephalin','Leu enkephalin']])different(messenger,a,b);
 assert.equal(exact(messenger,'Epinephrine').points,10);assert.equal(exact(messenger,'GABA').points,30);assert.equal(exact(messenger,'Metastin').points,100);
 for(const input of ['ATP','Estetrol','Calcitriol','Nitric oxide','Carbon monoxide','Anandamide','2AG','Asprosin','Placensin','Irisin'])exact(messenger,input);
 for(const input of ['DA','NE','SP','PP','NT','AM','OT','Insulin A chain','Insulin B chain','Neurophysin','Copeptin','Proopiomelanocortin','Fibrillin 1','GFRAL','Cholecalciferol','Vitamin D','Thyroglobulin','NT proBNP','EpiPen','Pitocin','Ozempic'])assert.notEqual(resolveAnswer(pack(messenger),input).status,'exact',input);
});

test('complete sources remain evidence rather than automatic keyword, product or subunit admissions',()=>{
 const s=JSON.parse(readFileSync(new URL('pepper-messengers-source-selection.json',root)));
 assert.equal(s.pepperCPIExpected,116);assert.equal(s.pepperCPIRepresented,116);assert.equal(s.pepperFedcoProducts,56);
 const u=JSON.parse(gunzipSync(readFileSync(new URL('sources/pepper-messengers-uniprot-human-source.json.gz',root)))).results;
 assert.equal(u.length,98);assert.equal(new Set(u.map(r=>r.primaryAccession)).size,98);
 assert.ok(u.every(r=>r.organism.taxonId===9606&&r.entryType==='UniProtKB reviewed (Swiss-Prot)'));
 for(const name of ['NuMex Camino Onion','NuMex Chaco Onion','NuMex Freedom Onion','NuMex Starlite Onion','NuMex Jalapeño Spice Mix'])assert.ok(ledger[pepper].held.some(r=>r.label===name),name);
 for(const acc of ['Q6UXV0','P02766','P01266','P01215','P0DN86'])assert.ok(ledger[messenger].held.some(r=>r.accession===acc),acc);
 assert.equal(specs.flatMap(q=>q.familiar).length,62);
});
