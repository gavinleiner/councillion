"""Reproducible factual-name repairs after the source bank generators.
No models, scraped prose or runtime answer guessing. See QUESTION-AUDIT.md.
"""
from pathlib import Path
import json,gzip,hashlib,re,unicodedata,collections,html
root=Path(__file__).resolve().parents[1];source=root/'data-snapshots/quality';out=root/'question-banks'
def norm(s):return re.sub('[^a-z0-9+#]','',unicodedata.normalize('NFKD',str(s)).encode('ascii','ignore').decode().lower())
def rows(meta):return json.loads(gzip.decompress((root/(meta.get('answerDirectory')or'question-banks')/meta['answerFile']).read_bytes()))
text=(root/'fun-question-catalog.js').read_text();metas=json.JSONDecoder().raw_decode(text.split('createFunCatalog(',1)[1])[0];by={m['id']:m for m in metas};banks={m['id']:rows(m)for m in metas}
patches=json.loads((source/'editorial-additions.json').read_text())['banks'];changes=[]
# This emote's actual name is punctuation, so a reviewed literal alias avoids
# silently dropping it during ordinary text normalization.
patches['fun-fortnite']['add'] += [['Exclamation Mark',60,['Exclamation Point','Exclamation Emote']]]
by['fun-fortnite']['literalAliases']={'!':'Exclamation Mark'}
credit=re.compile(r'^(?:additional\b|.*\bvoice(?:s| actor| actors| cast| talent| characterizations| character| characters| role| roles)?\b.*|narrat(?:or|ion)|sampling\b.*|combat choreography|orc walla|character voices?|male vocals?|female vocals?|various(?: characters| roles)?|uncredited|unknown)$',re.I)
def is_credit(label):return bool(credit.match(label.strip()))or bool(re.search(r'\b(?:french|german|italian|spanish|japanese|english) voice\b',label,re.I))or label.count('/')>=2
removed={}
for key in ['fun-game-characters','fun-fictional-characters']:
 removed[key]=[a[0]for a in banks[key]if is_credit(a[0])];banks[key]=[a for a in banks[key]if not is_credit(a[0])]
# Union only named vanilla items: blank IDs in Cargo are armour-set groupings.
terraria=json.loads(gzip.decompress((source/'terraria-items.json.gz').read_bytes()));items=[r for r in terraria if re.fullmatch(r'-?\d+',str(r['id']))and int(r['id'])!=0]
identifiers=json.loads(gzip.decompress((source/'terraria-identifiers.json.gz').read_bytes()));by_id=collections.defaultdict(list)
for r in identifiers:by_id[str(r['id'])].append(r['internalName'])
page_count=collections.Counter(norm(r['page'])for r in items)
for r in items:
 label=re.sub(r'<[^>]+>','',html.unescape(r['name'])).strip()
 aliases=[r['internalName']]if r['internalName']not in ['', 'None']else[]
 aliases+=by_id[str(r['id'])]
 if page_count[norm(r['page'])]==1:aliases.append(r['page'])
 banks['fun-terraria'].append([label,85,aliases])
common='Copper Shortsword|Wood|Stone Block|Dirt Block|Torch|Magic Mirror|Recall Potion|Life Crystal|Mana Crystal|Minishark|Megashark|Terra Blade|Zenith|Night\'s Edge|Excalibur|Copper Pickaxe|Iron Pickaxe|Terraprisma|Cell Phone|Last Prism|Meowmere|Shellphone|Fallen Star|Gel|Lesser Healing Potion|Healing Potion|Suspicious Looking Eye|Guide Voodoo Doll|Workbench|Work Bench|Furnace|Anvil|Iron Anvil|Rope|Bomb|Dynamite|Demonite Ore|Crimtane Ore|Hellstone|Chlorophyte Ore|Chlorophyte Bar|Gold Coin|Silver Coin|Copper Coin|Platinum Coin|Dirt Rod|Rod of Discord|Wormhole Potion|Golden Key|Shadow Key|Cobalt Shield|Obsidian Shield|Ankh Shield|Hermes Boots|Rocket Boots|Magic Carpet|Lucky Horseshoe|Cloud in a Bottle|Grappling Hook|Slime Crown|Abeemination|Mechanical Eye|Mechanical Worm|Mechanical Skull|Lihzahrd Power Cell|Celestial Sigil|Stardust Dragon Staff|Star Wrath|Solar Eruption|Daybreak|Phantasm|S.D.M.G.|Vortex Beater|Nebula Blaze|Nebula Arcanum|Lunar Flare'.split('|')
patches.setdefault('fun-terraria',{'add':[]})['add'] += [[s,10,[]]for s in common]
patches['fun-terraria']['add'] += [['The Dirtiest Block',100,['Dirtiest Block']],['Rod of Harmony',60,[]],['Celebration Mk2',30,['Celebration MKII']],['Torch God\'s Favor',30,['Torch Gods Favor']]]
# Updates propagate to broad parent questions, so a specific valid item never
# becomes invalid merely because the wider question is shown.
for key in ['fun-game-items']:
 banks[key] += banks['fun-terraria']
 for child in ['fun-elden-ring']:
  patches.setdefault(key,{'add':[]})['add'] += patches[child]['add']
 patches[key]['add'] += patches['fun-terraria']['add']
patches.setdefault('fun-animals',{'add':[]})['add']+=patches['fun-sea-life']['add']
patches['fun-game-items']['add'] += [['Master Sword',10,[]],['Hylian Shield',30,[]],['Portal Gun',30,[]],['Gravity Gun',30,[]]]
# Expand the general plant bank from the retained plant-kind inventories.
varmeta=json.loads((root/'variety-bank-manifest.json').read_text())['categories'];var={m['id']:m for m in varmeta}
for short in ['tree-n-01','shrub-n-01','vine-n-01','grass-n-01','fruit_tree-n-01','aquatic_plant-n-01','pine-n-01','woody_plant-n-01','herb-n-01']:
 id='var-semantic-'+short
 if id in var:banks['fun-plants']+=rows(var[id])
# Older food-derived plant lists incorrectly included fungi. Retain them in the
# fungus/food banks, while rejecting their exact names in the botanical bank.
fungi={norm(s)for a in rows(var['var-semantic-fungus-n-01'])for s in[a[0]]+a[2]}
fungi.update(map(norm,['mushroom','mushrooms','yeast','mold','mould','lichen','truffle']))
plant_exclusions=[a[0]for a in banks['fun-plants']if norm(a[0])in fungi]
banks['fun-plants']=[a for a in banks['fun-plants']if norm(a[0])not in fungi]
by['fun-plants']['excludedAnswers']=sorted(set(by['fun-plants'].get('excludedAnswers',[])+plant_exclusions+['mushroom','mushrooms','yeast','mold','mould','lichen','truffle']))
# Parent fictional-character questions inherit every reviewed real game name.
patches.setdefault('fun-fictional-characters',{'add':[]})['add'] += patches['fun-game-characters']['add']
for key,patch in patches.items():
 banks[key]=[a for a in banks[key]if norm(a[0])not in {norm(s)for s in patch.get('remove',[])}]
 banks[key]+=patch.get('add',[])

def merge(key,data):
 merged={}
 for label,points,aliases in data:
  label=html.unescape(str(label)).strip();k=norm(label)
  if not k:continue
  if k in merged:merged[k][2]+=aliases+([label]if label!=merged[k][0]else[])
  else:merged[k]=[label,points,list(aliases)]
 # Explicit synonyms merge identities rather than shadow another canonical row.
 for label,points,aliases in patches.get(key,{}).get('add',[]):
  parent=merged[norm(label)];parent[1]=points
  for alias in aliases:
   k=norm(alias)
   if k in merged and k!=norm(label):
    child=merged.pop(k);parent[2]+=[child[0]]+child[2]
 owners=collections.defaultdict(set)
 for k,(_,_,aliases)in merged.items():
  for alias in aliases:owners[norm(alias)].add(k)
 for k,a in merged.items():a[2]=sorted({str(alias).strip()for alias in a[2]if norm(alias)and norm(alias)!=k and norm(alias)not in merged and len(owners[norm(alias)])==1})
 return sorted(merged.values(),key=lambda a:a[0].casefold())
for m in metas:
 key=m['id'];before=rows(m);data=merge(key,banks[key]);
 if before==data:continue
 payload=json.dumps(data,ensure_ascii=False,separators=(',',':')).encode();sha=hashlib.sha256(payload).hexdigest();filename=key+'.'+sha[:16]+'.json.gz';(out/filename).write_bytes(gzip.compress(payload,mtime=0))
 m.update(answerFile=filename,answerCount=len(data),ranking='familiarity-v5-reviewed')
 if key=='fun-terraria':m.update(prompt='Name a Terraria item. Vanilla items from any version count.',source='Official Terraria Wiki Cargo Items name/internal-name inventory, retrieved 2026-10-23; tModLoader ItemID identifiers and earlier retained inventory. Factual names only.')
 if key=='fun-sea-life':m['prompt']='Name an aquatic or semi-aquatic animal. Sea and freshwater creatures count.'
 changes.append({'id':key,'before':len(before),'after':len(data),'added':len({norm(a[0])for a in data}-{norm(a[0])for a in before}),'removed':len({norm(a[0])for a in before}-{norm(a[0])for a in data}),'removedCredits':removed.get(key,[])})
version=hashlib.sha256(json.dumps(metas,sort_keys=True).encode()).hexdigest()[:16]
(root/'fun-question-catalog.js').write_text('// Generated broad metadata; run source generators, then scripts/repair-question-banks.py.\nimport {createFunCatalog} from \'./fun-bank-loader.js\';\nexport const FUN_BUILD='+json.dumps(version)+';\nexport const FUN_PACKS=createFunCatalog('+json.dumps(metas,ensure_ascii=False,separators=(',',':'))+',FUN_BUILD);\n')
manifest=[]
for m in metas:
 payload=gzip.decompress((out/m['answerFile']).read_bytes());data=json.loads(payload)
 manifest.append({**m,'tiers':dict(collections.Counter(a[1]for a in data)),'bytes':len(payload),'downloadBytes':len((out/m['answerFile']).read_bytes()),'sha256':hashlib.sha256(payload).hexdigest()})
(root/'fun-bank-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
active={m['answerFile']for m in metas}
for path in out.glob('*.json.gz'):
 if path.name not in active:path.unlink()
baseline={m['id']:m for m in json.loads((source/'baseline-manifest.json').read_text())}
ledger=[{'id':m['id'],'before':baseline[m['id']]['answerCount'],'after':m['answerCount'],'beforeSha256':baseline[m['id']]['sha256'],'sha256':m['sha256']}for m in manifest if baseline[m['id']]['sha256']!=m['sha256']]
(source/'repair-log.json').write_text(json.dumps({'reviewed':'2026-10-23','changes':ledger,'build':version},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'changes':changes,'build':version},ensure_ascii=False,indent=2))
