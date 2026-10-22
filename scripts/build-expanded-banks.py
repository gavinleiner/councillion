from pathlib import Path
import json,re,sys,unicodedata,collections
import argparse
from wordfreq import zipf_frequency
parser=argparse.ArgumentParser(description='Rebuild Councillion answer banks from the checked-in factual source snapshot.')
parser.add_argument('--source-dir',type=Path,default=Path(__file__).resolve().parents[1]/'data-snapshots')
parser.add_argument('--output-dir',type=Path,default=Path(__file__).resolve().parents[1])
args=parser.parse_args();src=args.source_dir;root=args.output_dir
load=lambda name:json.loads((src/(name+'.json')).read_text())
def norm(x):return re.sub('[^a-z0-9+#]','',unicodedata.normalize('NFKD',x).encode('ascii','ignore').decode().lower())
packs=[]
def bank(id,family,topic,prompt,items,gems=(),common=(),familiar=(),known=(),source='',aliases=None,notes=None):
 merged={}
 for item in items:
  label=item.strip();key=norm(label)
  if not key:continue
  if key not in merged:merged[key]={'label':label,'aliases':[]}
  elif label!=merged[key]['label']:merged[key]['aliases'].append(label)
 entries=list(merged.values());bykey={norm(a['label']):a for a in entries}
 for label,extra in (aliases or {}).items():
  if norm(label) in bykey:bykey[norm(label)]['aliases']+=extra
 # Labels win; aliases which could name two different records are discarded.
 owners=collections.defaultdict(set)
 for a in entries:
  for alias in [a['label']]+a['aliases']:owners[norm(alias)].add(a['label'])
 overrides={norm(x):points for seq,points in [(common,10),(familiar,30),(known,60),(gems,100)] for x in seq}
 for a in entries:
  a['aliases']=sorted({x for x in a['aliases'] if norm(x)!=norm(a['label']) and len(owners[norm(x)])==1})
  candidates={a['label'].lower()}
  if family=='words':
   # Familiar inflections should not become rare-answer loopholes.
   for _ in range(3):
    for word in list(candidates):
     stems=[]
     if word.endswith('ies'):stems.append(word[:-3]+'y')
     if word.endswith('ied'):stems.append(word[:-3]+'y')
     for ending in ['s','es','ed','ing']:
      if word.endswith(ending) and len(word)>len(ending)+2:
       base=word[:-len(ending)];stems.extend([base,base+'e'])
       if len(base)>2 and base[-1]==base[-2]:stems.append(base[:-1])
     candidates.update(w for w in stems if w in wordset)
  f=max(zipf_frequency(w,'en') for w in candidates)
  inherited=[overrides[norm(w)] for w in candidates if norm(w) in overrides]
  a['points']=overrides.get(norm(a['label']),min(inherited) if inherited else 10 if f>=5 else 30 if f>=4.1 else 60 if f>=3.1 else 85)
  if notes and norm(a['label']) in notes:a['note']=notes[norm(a['label'])]
 if not any(a['points']==100 for a in entries):raise ValueError('Missing gem '+id+' '+str(gems))
 pack={'id':id,'family':family,'topic':topic,'prompt':prompt,'source':source,'ranking':'familiarity-v1','answers':entries};packs.append(pack)
 print(id,len(entries),dict(sorted(collections.Counter(a['points'] for a in entries).items())))
words=(src/'enable1.txt').read_text().splitlines();wordset=set(words)
bank('word-isograms','words','NO LETTER TWICE','Name a ten-letter English word with no repeated letter. Inflections count; proper names do not.',[w for w in words if len(w)==10 and len(set(w))==10],gems=['lumberjack'],common=['background','playground','birthplace'],familiar=['aftershock','bankruptcy','blacksmith','downstream','upholstery'],source='ENABLE word list (Mendel Cooper), public domain; exact letter filter.')
bank('word-vowels','words','THREE VOWELS TOGETHER','Name an English word containing at least three consecutive vowels (A, E, I, O, U). Inflections count.',[w for w in words if re.search('[aeiou]{3}',w)],gems=['sequoia'],common=['beautiful','queue'],familiar=['beauty','queueing','serious','obvious','delicious','curious'],known=['onomatopoeia','sequoia','aqueous','beauteous'],source='ENABLE word list (Mendel Cooper), public domain; exact letter filter.')
phon=collections.defaultdict(list)
for line in (src/'cmudict.txt').read_text().splitlines():
 parts=line.split();w=re.sub(r'\(\d+\)$','',parts[0]);phon[w].append(re.sub('[0-9]','',parts[1]))
silent=[w for w in words if any(w.startswith(prefix) and first in phon.get(w,[]) for prefix,first in [('kn','N'),('wr','R'),('gn','N'),('ps','S'),('pn','N'),('pt','T'),('mn','N'),('honor','AA'),('honest','AA'),('hour','AW'),('heir','EH')]) or (w not in phon and w.startswith(('kn','wr','gn','ps','pn','pt','mn','honour')))]
bank('word-silent-initial','words','THE FIRST LETTER IS SILENT','Name an English word with a silent first letter in a standard pronunciation. Inflections count.',silent,gems=['ptarmigan'],common=['know','write','knife','wrong'],familiar=['knee','knight','psychology','hour','honest','wrap','wrist'],known=['pneumonia','gnome','heir','wren'],source='ENABLE × CMU Pronouncing Dictionary; initial consonant and first-phoneme checks. CMU BSD license in DATA-SOURCES.md.')
# Accepted regular extinct taxa; remove Aves descendants, ichnotaxa and form taxa.
birds={r['oid'] for r in load('birds-regular')['records']}
dinos=[r['nam'] for r in load('dinosaurs-regular')['records'] if r['oid'] not in birds and r.get('flg','') not in ['I','F']]
bank('dinosaur-genera','nature','BEFORE THE BIRDS','Name a non-avian dinosaur genus. Flying reptiles, marine reptiles, and modern birds do not count.',dinos,gems=['Irritator','Dracorex'],common=['Tyrannosaurus','Triceratops','Stegosaurus','Velociraptor','Brachiosaurus'],familiar=['Diplodocus','Allosaurus','Ankylosaurus','Spinosaurus','Iguanodon','Brontosaurus','Parasaurolophus'],known=['Therizinosaurus','Carnotaurus','Pachycephalosaurus','Compsognathus'],aliases={'Tyrannosaurus':['T rex','Tyrannosaurus rex'],'Stegosaurus':['Stego'],'Velociraptor':[]},source='Paleobiology Database API, accepted extinct regular genera under Dinosauria, excluding Aves. Snapshot 2026-10-21; CC BY 4.0.')
na=[x for group in load('birds-na')['birds'] for x in group['members']]
bank('north-american-birds','nature','FEATHERED VISITORS','Name a bird species recorded in North America. Vagrants, introduced birds, and extinct species count; use a species name, not just “eagle.”',na,gems=['Flammulated Owl','Violet-crowned Hummingbird'],common=['Bald Eagle','Mallard','Canada Goose','American Robin','Wild Turkey','Blue Jay'],familiar=['Northern Cardinal','Great Horned Owl','Snowy Owl','Peregrine Falcon','American Crow','Barn Owl'],known=['Roseate Spoonbill','Tufted Puffin','Whooping Crane','Pileated Woodpecker'],aliases={'Gray Catbird':['Grey Catbird']},source='Corpora birds_north_america, derived from ABA checklist; CC0. Historical checklist names retained.')
curds=load('cheeses')['curds']
# Collapse case/accent duplicates and “X cheese” when X is itself a record.
basekeys={norm(x):x for x in curds};ca={};cs=[]
for x in curds:
 bare=re.sub(r' cheese$','',x,flags=re.I)
 if bare!=x and norm(bare) in basekeys:ca.setdefault(basekeys[norm(bare)],[]).append(x)
 else:cs.append(x)
cs+=[x for x in ['Yogurt','Kefir','Skyr','Cheddar','Brie','Mozzarella','Quark'] if norm(x) not in {norm(a) for a in cs}]
ca.update({'Yogurt':['Yoghurt'],'Casu marzu':['Casu martzu'],'Mozzarella':['Mozzarella cheese']})
bank('cultured-dairy','food','THE CULTURED COUNTER','Name a cheese, cultured milk, or other fermented dairy product. Traditional varieties and named cheeses count.',cs,gems=['Casu marzu','Stinking Bishop'],common=['Cheddar','Brie','Mozzarella','Parmesan','Yogurt','Cream cheese','Cottage cheese','Feta','Gouda'],familiar=['Camembert','Ricotta','Swiss cheese','Stilton','Provolone','Kefir','Roquefort','Halloumi'],known=['Manchego','Mimolette','Skyr','Quark','Paneer','Burrata'],aliases=ca,source='Corpora foods/curds, CC0; normalized duplicates merged, common dairy forms added. Scope includes fermented milks as well as cheeses.')
sp=load('spices');sa={'Cilantro':['Coriander leaf'],'Lemon grass':['Lemongrass'],'Clove':['Cloves'],'Liquorice':['Licorice'],'Nigella':['Nigella sativa'],'Chili Pepper':['Chilli Pepper','Chili','Chilli'],'Juniper berry':['Juniper berries']}
spitems=list(dict.fromkeys(sp['herbs']+sp['spices']+sp['mixtures']));spitems=[x for x in spitems if x not in ['Coriander leaf','Nigella sativa']]
bank('seasonings','food','THE SPICE DRAWER','Name a culinary herb, spice, or named spice blend. Both individual seasonings and traditional mixtures count.',spitems,gems=['Grains of Paradise','Grains of Selim'],common=['Basil','Oregano','Cinnamon','Garlic','Ginger','Paprika','Thyme','Rosemary','Parsley','Cumin','Black Peppercorn'],familiar=['Turmeric','Saffron','Nutmeg','Cardamom','Garam masala','Za’atar','Dill','Chili Pepper'],aliases=sa,source='Corpora herbs_n_spices, CC0; herbs/spices/blends combined and synonyms merged.')
co=load('condiments');key=next(k for k,v in co.items() if isinstance(v,list));cond=co[key]
bank('condiment-counter','food','ON THE SIDE','Name a sauce, condiment, or relish served with food. Named traditional condiments count.',cond,gems=['Monkey gland sauce'],common=['Ketchup','Mustard','Mayonnaise','Soy sauce','Hot sauce','Barbecue sauce','Salsa'],familiar=['Sriracha','Worcestershire sauce','Fish sauce','Hoisin sauce','Chutney','Pesto'],source='Corpora foods/condiments, CC0; ingredient names retained.')
elements=load('elements')['elements']
# The old snapshot used temporary names for 113/115/117/118.
modern={113:('Nihonium','Nh'),115:('Moscovium','Mc'),117:('Tennessine','Ts'),118:('Oganesson','Og')}
for e in elements:
 if e['atomic_number'] in modern:e['name'],e['symbol']=modern[e['atomic_number']]
eles=[e for e in elements if len(e['symbol'])==2]
bank('two-letter-elements','science','TWO-LETTER SYMBOLS','Name a chemical element with a two-letter symbol. An element name or its official symbol is accepted.',[e['name'] for e in eles],gems=['Oganesson','Praseodymium'],common=['Helium','Iron','Gold','Silver','Neon','Calcium','Sodium'],familiar=['Lithium','Copper','Aluminium','Magnesium','Chlorine','Zinc','Silicon','Nickel'],known=['Antimony','Tungsten','Molybdenum'],aliases={e['name']:[e['symbol']]+(['Aluminum'] if e['name']=='Aluminium' else [])+(['Sulphur'] if e['name']=='Sulfur' else []) for e in eles},source='Corpora periodic table, CC0; IUPAC permanent names for elements 113,115,117,118 applied.')
aster=load('asteroids');ast=next(v for v in aster.values() if isinstance(v,list));nums={re.sub(r'^\d+\s+','',s):s for s in ast}
bank('first-thousand-minor-planets','science','THE FIRST THOUSAND','Name one of the first 1,000 numbered minor planets by name. Numbers alone do not count.',nums.keys(),gems=['Hippopotamus','Piazzia'],common=['Ceres','Vesta','Pallas','Juno'],familiar=['Eros','Ida','Gaspra','Psyche','Hygiea'],known=['Bennu','Davida','Interamnia','Hebe','Iris'],aliases={label:[num] for label,num in nums.items()},source='Corpora science/minor_planets, first 1,000 numbered objects, CC0. Numeric-only aliases intentionally excluded.')
films={}
for r in load('best-picture-films')['results']['bindings']:
 label=r['filmLabel']['value'];f=films.setdefault(r['film']['value'],{'label':label,'years':[],'winner':False,'aliases':set()})
 f['winner']|=r['award']['value']=='winner'
 if 'released' in r:f['years'].append(int(r['released']['value'][:4]))
 if 'filmAltLabel' in r:f['aliases'].update(r['filmAltLabel']['value'].split(', '))
filmrows=[f for f in films.values() if not f['label'].startswith('Q') and f['years'] and min(f['years'])<=2025]
filmnames=[f['label'] for f in filmrows];winners=[f['label'] for f in filmrows if f['winner']]
filmAlias={f['label']:list(f['aliases'])+([f['label'][4:]] if f['label'].startswith('The ') else []) for f in filmrows}
for title,shorts in {
 'The Lord of the Rings: The Return of the King':['LOTR Return of the King','LOTR ROTK','ROTK'],
 'The Lord of the Rings: The Fellowship of the Ring':['LOTR Fellowship of the Ring','LOTR FOTR','FOTR'],
 'The Lord of the Rings: The Two Towers':['LOTR Two Towers','LOTR TTT','TTT']
}.items():filmAlias.setdefault(title,[]).extend(shorts)
for id,topic,prompt,names,gems in [('best-picture-nominees','ON THE BALLOT','Name a film nominated for the Academy Award for Best Picture, through the 2026 ceremony. Winners count too.',filmnames,['The Ox-Bow Incident','The Emigrants']),('best-picture-winners','THE GOLD ENVELOPE','Name a film that won the Academy Award for Best Picture, through the 2026 ceremony.',winners,['The Broadway Melody','Cavalcade'])]:
 bank(id,'culture',topic,prompt,names,gems=gems,common=['Titanic','The Godfather','Forrest Gump','Oppenheimer','Barbie','Avatar','The Lord of the Rings: The Return of the King'],familiar=['Gladiator','Parasite','Rocky','The Silence of the Lambs','Jaws','Star Wars','The Shawshank Redemption'],known=['CODA','Anora','The Artist','Moonlight','All Quiet on the Western Front'],aliases=filmAlias,source='Wikidata, film instances with P166/P1411 Academy Award for Best Picture (Q102427), English labels/aliases; CC0. Snapshot 2026-10-21, releases through 2025.')
rivers=load('rivers')['rivers'];byname={r['name']:r for r in rivers}
seas={'Atlantic Ocean':'Atlantic','Mediterranean':'Atlantic','Black Sea':'Atlantic','Gulf of Mexico':'Atlantic','Gulf of Saint Lawrence':'Atlantic','Río de la Plata':'Atlantic','Gulf of Guinea':'Atlantic','North Sea':'Atlantic','Caribbean':'Atlantic','Baltic Sea':'Atlantic','Gulf of Riga':'Atlantic','Sea of Azov':'Atlantic','Hudson Bay':'Atlantic','East China Sea':'Pacific','South China Sea':'Pacific','Bohai Sea':'Pacific','Pacific Ocean':'Pacific','Sea of Okhotsk':'Pacific','Bering Sea':'Pacific','Gulf of California':'Pacific','Gulf of Anadyr':'Pacific','Gulf of Papua':'Pacific','Indian Ocean':'Indian','Bay of Bengal':'Indian','Mozambique Channel':'Indian','Persian Gulf':'Indian','Arabian Sea':'Indian','Andaman Sea':'Indian','Kara Sea':'Arctic','Gulf of Ob':'Arctic','Laptev Sea':'Arctic','Beaufort Sea':'Arctic','East Siberian Sea':'Arctic','White Sea':'Arctic','Barents Sea':'Arctic'}
def basin(name,seen=None):
 seen=set(seen or []);
 if name in seas:return seas[name]
 if name in seen:return 'inland'
 seen.add(name)
 return basin(byname[name]['outflow'],seen) if name in byname else 'inland'
ralias={'Huang He':['Yellow River'],'Yangtze':['Chang Jiang','Yangtze River'],'Ayeyarwady':['Irrawaddy'],'Saint Lawrence':['St Lawrence','St. Lawrence River'],'Rio Grande':['Rio Bravo'],'Yenisei':['Yenisey']}
for name in byname:ralias.setdefault(name,[]).append(name+' River')
for id,topic,prompt,basins,gems in [('atlantic-rivers','TO THE ATLANTIC','Name a river whose water eventually reaches the Atlantic, including the Mediterranean, Black Sea, Baltic, or Gulf of Mexico. Tributaries count.',['Atlantic'],['Chambeshi']),('pacific-indian-rivers','EASTWARD WATERS','Name a river whose water eventually reaches the Pacific or Indian Ocean. Tributaries count.',['Pacific','Indian'],['Selenge'] if False else ['Shatt al-Arab']),('arctic-rivers','NORTHBOUND','Name a river whose water eventually reaches the Arctic Ocean. Tributaries count.',['Arctic'],['Northern Dvina'])]:
 names=[n for n in byname if basin(n) in basins]
 bank(id,'world',topic,prompt,names,gems=gems,common=['Nile','Amazon','Mississippi','Missouri','Yangtze','Ganges','Indus','Lena','Ob','Yenisei','Mackenzie'],familiar=['Danube','Rhine','Thames','Seine','Congo','Volga','Colorado','Columbia','Mekong','Tigris','Euphrates'],aliases=ralias,source='Corpora rivers, CC0; outflows recursively traced to ocean basins. River Plate and Hudson Bay classified with Atlantic drainage. Finite long-river source; additional valid rivers may be absent.')
# Compact immutable source rows; runtime materializes only normal answer objects.
rows=[]
for p in packs:
 meta={k:v for k,v in p.items() if k!='answers'}
 rows.append([meta,[[a['label'],a['points'],a['aliases']]+([a['note']] if a.get('note') else []) for a in p['answers']]])
(root/'expanded-banks.js').write_text('// Generated source-backed banks. Provenance and ranking: DATA-SOURCES.md.\nconst rows='+json.dumps(rows,ensure_ascii=False,separators=(',',':'))+';\nexport const EXPANDED_PACKS=rows.map(([meta,answers])=>({...meta,dailyEligible:true,answers:answers.map(([label,points,aliases,note])=>({label,points,aliases,...(note?{note}:{} )}))}));\n')
(root/'bank-manifest.json').write_text(json.dumps([{**{k:v for k,v in p.items() if k!='answers'},'count':len(p['answers']),'tiers':dict(sorted(collections.Counter(a['points'] for a in p['answers']).items()))} for p in packs],indent=2,ensure_ascii=False))
print('TOTAL',len(packs),sum(len(p['answers']) for p in packs))
