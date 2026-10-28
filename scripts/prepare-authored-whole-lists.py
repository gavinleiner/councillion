#!/usr/bin/env python3
"""Six distinct whole subjects with explicit common-guess and boundary checks.

Raw name lists are reviewed at the question level. Source rows, aliases and
national sublists are answer inventory, never additional question counts.
"""
import collections,gzip,json,pathlib,re,sys,unicodedata
ROOT=pathlib.Path(__file__).resolve().parents[1];DATA=ROOT/'data-snapshots/authored'
source=json.load(gzip.open(DATA/'sources/whole-playable-lists.json.gz'))
specs=json.loads((DATA/'whole-list-specifications.json').read_text())['questions']
def norm(s):return re.sub('[^a-z0-9+#]','',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower())
def clean(s):return re.sub(r'\s+',' ',re.sub(r'\s*\[[^]]*\]','',s)).strip()
cheese_fixes={
 'Asiago Asiago d\'allevo "mezzano" Asiago d\'allevo "vecchio" Asiago pressato':('Asiago',["Asiago d'allevo mezzano","Asiago d'allevo vecchio",'Asiago pressato']),
 'Begiunn − Piedmont; a creamy-granular ricotta made in summer in the alpine pastures of Sauze d’Oulx and San Sicario':('Begiunn',[]),
 'Queso de Fuente Palmera Mainly goat milk with Quinkana brand and mixture milk':('Queso de Fuente Palmera',[]),
 'Queso de los Pedroches from raw sheep milk':('Queso de los Pedroches',[]),
 'Swiss cheese related to the Emmental cheese of Switzerland but slightly different':('Swiss cheese',[]),
 'String cheese refers to several different types of cheese whose manufacturing process aligns the proteins in the cheese':('String cheese',[]),
 'Formai de Mut from Alta Valle Brembana':('Formai de Mut dell Alta Valle Brembana',['Formai de Mut from Alta Valle Brembana','Formai de Mut']),
}
result=[];report=[];all_holds={}
for q in specs:
 key=q['key'];names={};held=dict(q['hold'])
 def merge(label,aliases=()):
  label=clean(label);n=norm(label)
  if not n:return
  row=names.setdefault(n,{'label':label,'aliases':set()});row['aliases'].update(a for a in aliases if norm(a)and norm(a)!=n)
 for original in source['groups'][key]['names']:
  if original in held:continue
  name=clean(original);aliases=[]
  if key=='cheese-types':
   if original in cheese_fixes:name,aliases=cheese_fixes[original]
   else:
    # Actual alternate names are joined only inside the source's name cell.
    parts=re.split(r'\s*/\s*|\s+or\s+',name);parts=[p.strip(' )')for p in parts if norm(p)]
    if parts:name,*aliases=parts
    name=re.sub(r'\s*\((?:PDO|Brand|tr|original, smoked, and varieties|with additions)\)','',name,flags=re.I)
    m=re.fullmatch(r'(.+?)\s*\(([^()]{2,35})\)',name)
    if m:
     name=m[1]
     if m[2]not in ['and smoked','PDO','Brand']and not m[2].startswith('transl.'):aliases.append(m[2].removeprefix('or '))
   if not norm(name):held[original]='No usable transliterated name in the source name cell.';continue
  elif key=='web-browsers':
   name=re.split(r'\s*\(|\s*,\s*|\s+for macOS|\s+before acquisition|\s+since version|\s+since Version|\s+from version|\s+with the IE Tab|\s+based on|\s*, based',name,1)[0].strip()
   if name=='Qt WebEngine':continue
  elif key=='stew-dishes':
   if name=='Islim or patlıcan kebabı':name='Islim kebabı';aliases=['Patlıcan kebabı']
  merge(name,aliases)
 for name in q['extra']:merge(name)
 # Explicit real-name synonym merges preserve one scoreable identity.
 for canonical,aliases in q['aliases'].items():
  if norm(canonical)not in names:merge(canonical)
  owner=names[norm(canonical)]
  for alias in aliases:
   other=names.get(norm(alias))
   if other is not None and other is not owner:
    owner['aliases'].update([other['label'],*other['aliases']]);del names[norm(alias)]
   if norm(alias)!=norm(canonical):owner['aliases'].add(alias)
 # Resolve equivalent source-label punctuation variants deterministically.
 owners=collections.defaultdict(list)
 for k,p in names.items():
  for alias in p['aliases']:
   n=norm(alias)
   if n not in names:owners[n].append(k)
 chosen={n:sorted(ks)[0]for n,ks in owners.items()}
 exact={k:k for k in names}
 for n,k in chosen.items():exact[n]=k
 missing=[s for s in q['familiar']if norm(s)not in exact]
 assert not missing,(key,'missing independent common inputs',missing)
 assert all(norm(s)not in exact for s in q['exclude']),(key,'wrong-category boundary became an answer',[s for s in q['exclude']if norm(s)in exact])
 low={exact[norm(s)]for s in q['familiar'][:8]};common={exact[norm(s)]for s in q['familiar']};rare=exact[norm(q['rare'])]
 assert all(norm(s)in exact for s in q.get('common',[])),(key,'Unknown common-tier name')
 assert all(norm(s)in exact for s in q.get('deep',[])),(key,'Unknown editorial deep-cut name',[s for s in q.get('deep',[])if norm(s)not in exact])
 common.update(exact[norm(s)]for s in q.get('common',[]));deep={exact[norm(s)]for s in q.get('deep',[])}
 tiers=collections.defaultdict(list)
 for k,p in sorted(names.items()):
  points=100 if k==rare else 10 if k in low else 30 if k in common else 85 if k in deep else 60
  tiers[str(points)].append({'label':p['label'],'aliases':sorted(a for a in p['aliases']if chosen.get(norm(a))==k)})
 result.append(dict(id='authored-'+key,concept=key,family=q['family'],topic=q['topic'],prompt=q['prompt'],scope=q['scope'],format='whole-concept',rationale='One recognizable whole subject with independent common-input checks. Linked source sublists and aliases expand answers, not question count. No title-word, country, year or tag-pair multiplication.',familiar=q['familiar'],exclude=q['exclude'],references=q['references'],answers=dict(tiers)))
 report.append({'id':'authored-'+key,'canonicalAnswers':len(names),'familiarInputs':len(q['familiar']),'negativeBoundaries':len(q['exclude']),'heldRawRows':len(held)})
 all_holds[key]=held
files={DATA/'batches/13-whole-playable-lists.json':json.dumps({'version':1,'questions':result},ensure_ascii=False,separators=(',',':'))+'\n',DATA/'whole-list-checks.json':json.dumps(report,ensure_ascii=False,indent=2)+'\n',DATA/'whole-list-holds.json':json.dumps(all_holds,ensure_ascii=False,indent=2)+'\n'}
for p,text in files.items():
 if '--check'in sys.argv:assert p.read_text()==text,p
 else:p.write_text(text)
print([(x['id'],x['canonicalAnswers'])for x in report])
