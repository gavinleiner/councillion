"""Explicit factual name repairs after complete food-source reconciliation."""
import json,pathlib,re,unicodedata
D=pathlib.Path(__file__).resolve().parents[1]/'data-snapshots/authored'
def norm(s):return re.sub('[^a-z0-9+#]','',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower())
def apply_food_repairs(questions):
 source=json.load(open(D/'food-admission-repairs.json'));fixes=source['repairs'];retired=set(source.get('retiredReferenceUrls',[]))
 for q in questions:
  fix=fixes.get(q['concept'])
  if not fix:continue
  rows=[]
  for tier,items in q['answers'].items():
   for x in items.split('|')if isinstance(items,str)else items:
    if isinstance(x,str):name,*aliases=x.split('~');x={'label':name,'aliases':aliases}
    rows.append({**x,'points':int(tier)})
  owners={norm(r['label']):r for r in rows}
  for label,aliases in fix['aliases'].items():
   assert norm(label)in owners,(q['id'],'missing alias owner',label)
   row=owners[norm(label)];row['aliases']=sorted(set(row.get('aliases',[])+aliases))
  for addition in fix['additions']:
   n=norm(addition['label'])
   if n in owners:
    row=owners[n];row['aliases']=sorted(set(row.get('aliases',[])+addition.get('aliases',[])));row['points']=addition['points']
   else:row={**addition};rows.append(row);owners[n]=row
  for label,points in fix.get('points',{}).items():
   assert norm(label)in owners,(q['id'],'missing tier owner',label)
   owners[norm(label)]['points']=points
  tiers={}
  for row in rows:
   tier=str(row.pop('points'));tiers.setdefault(tier,[]).append(row)
  q['answers']=tiers;q['familiar']=fix['familiar'];q['exclude']=fix['exclude']
  for field in ['prompt','scope']:
   if field in fix:q[field]=fix[field]
  q['references']=list(dict.fromkeys(r for r in q['references']+fix['references']if r not in retired))
