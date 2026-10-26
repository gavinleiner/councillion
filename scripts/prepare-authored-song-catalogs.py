#!/usr/bin/env python3
"""Build one whole credited-performer catalog per familiar artist.

The source snapshot preserves factual titles, original table contexts and row
holds. Artist, album, year and title predicates never multiply a catalog into
extra questions. Versions of a song share an answer identity.
"""
import collections,gzip,json,pathlib,re,sys,unicodedata
ROOT=pathlib.Path(__file__).resolve().parents[1];DATA=ROOT/'data-snapshots/authored'
raw=json.load(gzip.open(DATA/'sources/recorded-song-catalogs.json.gz'))
spec=json.loads((DATA/'artist-catalog-specifications.json').read_text())['questions']
def norm(s):return re.sub('[^a-z0-9+#]','',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower())
def base_title(s):
 s=re.sub(r'\s*†?\s*\((?:featuring|with|performed by|vocals by)\b.*$','',s,flags=re.I).strip()
 s=re.sub(r'\s*†\s*\([^)]*cover\)\s*$','',s,flags=re.I).strip()
 # A version label is accepted as a public spelling, but cannot score a
 # second time after the underlying song. Genuine title parentheticals stay.
 previous=None
 while s!=previous:
  previous=s
  s=re.sub(r'\s*\([^()]*(?:remix|demo|acoustic|live|version|radio edit|extended)[^()]*\)\s*$','',s,flags=re.I).strip()
 return s
questions=[];checks=[];holds={}
for q in spec:
 a=next(a for a in raw['artists']if a['artist']==q['artist']);names={};held=dict(q['hold'])
 def merge(label,aliases=(),links=(),sections=()):
  n=norm(label)
  if not n:return
  p=names.setdefault(n,{'label':label,'aliases':set(),'links':set(),'sections':set()})
  p['aliases'].update(x for x in aliases if norm(x)!=n);p['links'].update(links);p['sections'].update(sections)
 for r in a['names']:
  original=r['name']
  if original in held:continue
  label=base_title(q['fixes'].get(original,original))
  if not label:held[original]='No named song after version/credit cleanup.';continue
  merge(label,[original],r['songPageLinks'],r['sourceSections'])
 for extra in q.get('extra',[]):
  assert extra['source'].startswith('https://')and extra['reason']
  merge(extra['name'],extra.get('aliases',[]),[extra['source']],['Independently verified publisher release'])
 for canonical,aliases in q['aliases'].items():
  assert norm(canonical)in names,(q['artist'],'alias target absent from factual inventory',canonical)
  owner=names[norm(canonical)]
  for alias in aliases:
   other=names.get(norm(alias))
   if other and other is not owner:
    owner['aliases'].update([other['label'],*other['aliases']]);owner['links'].update(other['links']);owner['sections'].update(other['sections']);del names[norm(alias)]
   if norm(alias)!=norm(canonical):owner['aliases'].add(alias)
 # Canonical names own their spelling before any optional alias.
 exact={k:k for k in names};owners=collections.defaultdict(list)
 for k,p in names.items():
  for alias in p['aliases']:
   if norm(alias)not in names:owners[norm(alias)].append(k)
 for n,ks in owners.items():exact[n]=sorted(ks)[0]
 missing=[s for s in q['familiar']if norm(s)not in exact]
 assert not missing,(q['artist'],'missing independent familiar songs',missing)
 assert all(norm(s)not in exact for s in q['exclude']),(q['artist'],'an album boundary became a song')
 assert norm(q['rare'])in exact,(q['artist'],'rare title absent',q['rare'])
 familiar={exact[norm(s)]for s in q['familiar']};low={exact[norm(s)]for s in q['familiar'][:6]};rare=exact[norm(q['rare'])]
 tiers=collections.defaultdict(list)
 # Editorial tiers use recognizable probes and standalone-song context.
 # They are not represented as measured player response frequencies.
 for k,p in sorted(names.items()):
  pts=100 if k==rare else 10 if k in low else 30 if k in familiar else 60 if p['links']else 85
  tiers[str(pts)].append({'label':p['label'],'aliases':sorted(a for a in p['aliases']if exact.get(norm(a))==k)})
 key=re.sub('[^a-z0-9]+','-',unicodedata.normalize('NFKD',q['artist']).encode('ascii','ignore').decode().lower()).strip('-')+'-songs'
 scope='Released recordings credited to '+q['artist']+' count, including collaborations, features and released covers. Writing or production credit alone does not count. Different versions share one answer.'
 if q['artist']=='Maroon 5':scope+=' The same band\'s earlier releases as Kara\'s Flowers also count; solo-member features do not.'
 if q['artist']=='Linkin Park':scope+=' Released Xero and Hybrid Theory recordings from the same band also count; fan-contest songs do not.'
 questions.append(dict(id='authored-'+key,concept=key,family='music',topic='ON REPEAT',prompt='Name a song by '+q['artist']+'.',scope=scope,format='whole-artist-catalog',rationale='One recognizable artist and their full sourced catalog, with independent common-song inputs. No album/year/word slices or popularity cutoff. Source version and title-credit notes are not separate songs.',familiar=q['familiar'],exclude=q['exclude'],references=q['references'],answers=dict(tiers)))
 checks.append({'id':'authored-'+key,'artist':q['artist'],'canonicalAnswers':len(names),'familiarInputs':len(q['familiar']),'negativeBoundaries':len(q['exclude']),'heldRawRows':len(held)+len(a['heldRows']),'source':a['source'],'sourceHtmlSha256':a['htmlSha256']})
 holds[key]={'editorial':held,'source':a['heldRows']}
files={DATA/'batches/14-recorded-song-catalogs.json':json.dumps({'version':1,'questions':questions},ensure_ascii=False,separators=(',',':'))+'\n',DATA/'artist-catalog-checks.json':json.dumps(checks,ensure_ascii=False,indent=2)+'\n',DATA/'artist-catalog-holds.json':json.dumps(holds,ensure_ascii=False,indent=2)+'\n'}
for p,t in files.items():
 if '--check'in sys.argv:assert p.read_text()==t,p
 else:p.write_text(t)
print([(c['artist'],c['canonicalAnswers'])for c in checks])
