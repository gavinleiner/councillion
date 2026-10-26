#!/usr/bin/env python3
"""One broad rock question; source list entries are not extra questions."""
import collections,gzip,json,pathlib,re,sys,unicodedata
ROOT=pathlib.Path(__file__).resolve().parents[1]
DATA=ROOT/'data-snapshots/authored'
source=json.load(gzip.open(DATA/'sources/rock-type-list.json.gz'))
def norm(s):return re.sub('[^a-z0-9+#]','',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower())
fixes={
 'Diabase , also known as dolerite':('Diabase',['Dolerite']),
 'Dolomite (rock) , also known as Dolostone':('Dolostone',['Dolomite rock','Dolomite']),
 'Metaconglomerate - A type of metamorphic rock formed through the recrystallization of conglomerates':('Metaconglomerate',[]),
 'Monzodiorite An intrusive igneous rock intermediate in composition between diorite and monzonite':('Monzodiorite',[]),
 'Napoleonite , also known as corsite':('Napoleonite',['Corsite']),
 'Minette (ore)':('Minette',[]),
}
held={'Wad (mineral)':'An indefinite oxide/mineraloid mixture needs an eligibility decision before treating it as a rock type.','Pyrolite':'An idealised mantle composition is not included as an ordinary natural rock type.'}
common='Granite|Basalt|Marble|Sandstone|Limestone|Slate|Obsidian|Pumice|Shale|Chalk|Flint|Gneiss|Quartzite|Schist|Coal|Breccia|Conglomerate|Tuff|Gabbro|Diorite|Andesite|Rhyolite|Siltstone|Mudstone|Soapstone|Travertine|Coquina|Lignite|Anthracite|Hornfels'.split('|')
negative=['Diamond','Quartz','Gold','Concrete','Mount Everest']
names={}
for p in source['groups']['rock-types']['rows']:
 if p['name']in held:continue
 name,aliases=fixes.get(p['name'],(p['name'],[]));k=norm(name)
 row=names.setdefault(k,{'label':name,'aliases':set()});row['aliases'].update(aliases)
for name,aliases in {
 'Igneous rock':['Igneous'],
 'Sedimentary rock':['Sedimentary'],
 'Metamorphic rock':['Metamorphic'],
 'Intrusive igneous rock':['Intrusive rock','Intrusive','Plutonic rock','Plutonic'],
 'Extrusive igneous rock':['Extrusive rock','Extrusive','Volcanic rock','Volcanic'],
 'Lava rock':['Lava stone'],
}.items():names[norm(name)]={'label':name,'aliases':set(aliases)}
common+=['Igneous','Sedimentary','Metamorphic','Intrusive','Plutonic','Extrusive','Volcanic','Lava rock','Dolerite','Dolostone','Dolomite rock']
for name,aliases in {'Greywacke':['Graywacke'],'Soapstone':['Steatite'],'Tachylite':['Tachylyte'],'ʻAʻā':['Aa',"A'a"],'Pāhoehoe':['Pahoehoe']}.items():
 k=norm(name);assert k in names,name
 for alias in aliases:
  other=names.get(norm(alias))
  if other is not None and other is not names[k]:names[k]['aliases'].update([other['label'],*other['aliases']]);del names[norm(alias)]
 names[k]['aliases'].update(aliases)
exact={norm(a):k for k,p in names.items()for a in[p['label'],*p['aliases']]}
assert all(norm(s)in exact for s in common)
assert all(norm(s)not in exact for s in negative)
low={exact[norm(s)]for s in common[:6]+['Igneous','Sedimentary','Metamorphic']};familiar={exact[norm(s)]for s in common}
tiers=collections.defaultdict(list)
for k,p in sorted(names.items()):
 points=100 if k==norm('Boninite')else 10 if k in low else 30 if k in familiar else 60 if len(p['label'])<18 else 85
 tiers[str(points)].append({'label':p['label'],'aliases':sorted(p['aliases'])})
q=dict(id='authored-rock-types',concept='rock-types',family='science',topic='Rock collection',prompt='Name a type of rock.',
 scope='Recognized geological rock names, rock families and established natural stone varieties count. Common and scientific rock names are accepted. Individual minerals, chemical elements, whole mountains and manufactured building products are not rock types.',
 format='whole-concept',rationale='One recognizable science subject, with independently supplied common-rock inputs and a sourced long tail. It is not split into a question for each colour, country, age or chemical filter.',
 familiar=common,exclude=negative,references=source['groups']['rock-types']['references']+['https://www.usgs.gov/faqs/what-difference-between-a-rock-and-a-mineral','https://www.nps.gov/subjects/geology/how-rocks-are-classified.htm','https://www.nps.gov/subjects/geology/igneous.htm','https://www.bgs.ac.uk/discovering-geology/rocks-and-minerals/'],answers=dict(tiers))
files={DATA/'batches/12-rock-types.json':json.dumps({'version':1,'questions':[q]},ensure_ascii=False,indent=2)+'\n',DATA/'rock-source-holds.json':json.dumps(held,indent=2)+'\n'}
for p,text in files.items():
 if '--check'in sys.argv:assert p.read_text()==text,p
 else:p.write_text(text)
print(q['id'],len(names),'answer identities;',len(common),'common input checks')
