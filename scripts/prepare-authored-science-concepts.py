#!/usr/bin/env python3
"""Whole bone, unit and cell concepts; real SI prefixes expand answers, never questions."""
import json,pathlib,re,sys,unicodedata
ROOT=pathlib.Path(__file__).resolve().parents[1];D=ROOT/'data-snapshots/authored'
s=json.load(open(D/'science-concept-specifications.json'))
def norm(x):return re.sub('[^a-z0-9+#]','',unicodedata.normalize('NFKD',x).encode('ascii','ignore').decode().lower())
qs=s['questions']
# TA2 names the C1-C7, T1-T12, L1-L5 and paired rib positions.
# These are named bones within the one skeleton question, not new prompts.
bone=next(q for q in qs if q['id']=='authored-human-bone-names');bone_names={norm(n):row for rows in bone['answers'].values()for row in rows for n in [row['label'],*row['aliases']]}
ordinal=['','First','Second','Third','Fourth','Fifth','Sixth','Seventh','Eighth','Ninth','Tenth','Eleventh','Twelfth']
for region,code,count in [('cervical','C',7),('thoracic','T',12),('lumbar','L',5)]:
 for i in range(1,count+1):
  name=f'{code}{i} vertebra';als=[f'{code}{i}',f'{ordinal[i]} {region} vertebra',f'{region.capitalize()} vertebra {i}',f'Vertebra {code}{i}'];row=bone_names.get(norm(name))
  if not row:row={'label':name,'aliases':[]};bone['answers']['85'].append(row)
  row['aliases']=sorted(set(row['aliases']+als));bone_names.update({norm(n):row for n in [row['label'],*row['aliases']]})
for i in range(1,13):
 name=f'{ordinal[i]} rib';row=bone_names.get(norm(name))
 if not row:row={'label':name,'aliases':[]};bone['answers']['85'].append(row)
 row['aliases']=sorted(set(row['aliases']+[f'Rib {i}',f'Left {name.lower()}',f'Right {name.lower()}']))
paired='Femur|Tibia|Fibula|Humerus|Rib|Clavicle|Scapula|Radius|Ulna|Maxilla|Parietal bone|Temporal bone|Nasal bone|Lacrimal bone|Zygomatic bone|Palatine bone|Malleus|Incus|Stapes|Ilium|Ischium|Pubis|Talus|Calcaneus|Navicular|Cuboid|Medial cuneiform|Intermediate cuneiform|Lateral cuneiform|Scaphoid|Lunate|Triquetrum|Pisiform|Trapezium|Trapezoid|Capitate|Hamate|Hip bone|Inferior nasal concha'.split('|')
for label in paired:
 row=bone_names[norm(label)];aliases=[f'{side} {n.lower()}'for side in ['Left','Right']for n in [row['label'],*row['aliases']]];row['aliases']=sorted(set(row['aliases']+aliases))
p=next(q for q in qs if q['id']=='authored-measurement-unit-names');owners={} 
for tier,rows in p['answers'].items():
 for r in rows:
  for a in [r['label'],*r['aliases']]:owners[norm(a)]=r
proof=[]
for unit in s['prefixableSiNames']:
 for prefix in s['prefixes']:
  unit_name=unit[:1].lower()+unit[1:];name=(prefix+unit_name);name=name[:1].upper()+name[1:];aliases=[]
  if unit=='Meter':aliases.append((prefix+'metre').capitalize())
  if prefix=='deka':aliases.append(('deca'+unit_name)[:1].upper()+('deca'+unit_name)[1:])
  if prefix=='deka'and unit=='Meter':aliases.append('Decametre')
  hits={norm(owners[norm(a)]['label'])for a in [name,*aliases]if norm(a)in owners}
  assert len(hits)<=1,(name,'published name aliases bridge different units',hits)
  if hits:r=next(owners[norm(a)]for a in [name,*aliases]if norm(a)in owners)
  else:r={'label':name,'aliases':[]};p['answers']['85'].append(r)
  r['aliases']=sorted(set([*r['aliases'],*[a for a in [name,*aliases]if norm(a)!=norm(r['label'])]]))
  for a in [r['label'],*r['aliases']]:owners[norm(a)]=r
  proof.append({'prefix':prefix,'unit':unit,'acceptedName':name,'canonical':r['label']})
assert len(s['prefixes'])==24 and len(s['prefixableSiNames'])==29
path=D/'batches/04-science.json';batch=json.load(open(path));updates={q['id']:q for q in qs};batch['questions']=[updates.get(q['id'],q)for q in batch['questions']]
files={path:json.dumps(batch,ensure_ascii=False,indent=2)+'\n',D/'science-prefix-checks.json':json.dumps({'source':'https://www.nist.gov/pml/special-publication-811/nist-guide-si-chapter-4-two-classes-si-units-and-si-prefixes','combinations':len(proof),'answers':proof},ensure_ascii=False,indent=2)+'\n'}
for path,text in files.items():
 if '--check'in sys.argv:assert path.read_text()==text,path
 else:path.write_text(text)
print([(q['id'],sum(map(len,q['answers'].values())))for q in qs]);print(len(proof),'legal SI prefix/name combinations reconciled within one question')
