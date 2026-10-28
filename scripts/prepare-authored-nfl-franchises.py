import json,gzip,pathlib,hashlib,collections,re,unicodedata,sys
R=pathlib.Path(__file__).resolve().parents[1];D=R/'data-snapshots/authored'
spec=json.load(open(D/'nfl-franchise-specifications.json'));raw=json.load(gzip.open(D/'sources/nfl-franchise-rosters.json.gz'));players=json.load(gzip.open(D/'sources/nfl-public-names.json.gz'))
def norm(s):return re.sub('[^a-z0-9+#]','',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower())
# These are explicit raw-code/season rules. Sharing a city/code is not evidence
# of sharing franchise identity. Wartime joint rosters belong to both clubs.
rules={q['teamCode']:[(r['rawCode'],r['from'],r['through'])for r in q['franchiseRules']]for q in spec['questions']}
parent={}
def find(n):
 parent.setdefault(n,n)
 if parent[n]!=n:parent[n]=find(parent[n])
 return parent[n]
def union(a,b):
 a,b=find(a),find(b)
 if a!=b:parent[max(a,b)]=min(a,b)
for row in [*raw,*players]:
 g,p=row.get('gsis_id'),row.get('pfr_id')
 if g and p:union('gsis:'+g,'pfr:'+p)
def identity(row):
 if row.get('gsis_id'):return find('gsis:'+row['gsis_id'])
 if row.get('pfr_id'):return find('pfr:'+row['pfr_id'])
 return 'unidentified:'+norm(row['full_name'])
by_identity=collections.defaultdict(set)
for row in raw:
 if row.get('full_name'):by_identity[identity(row)].add(row['full_name'])
# Only published full display names and actual first/last fields are accepted.
# The publisher short_name field is deliberately excluded: initials such as
# J.Allen are not manufactured as shortcuts into a bank.
public_name_proof=[]
for row in players:
 if not row.get('gsis_id')and not row.get('pfr_id'):continue
 k=identity(row)
 if k not in by_identity:continue
 aliases={row.get('display_name','').strip()}
 for field in ['common_first_name','first_name','football_name']:
  first,last=row.get(field,''),row.get('last_name','')
  if first and last:
   suffix=row.get('suffix','');aliases.add(' '.join(x.strip()for x in [first,last,suffix]if x.strip()))
 aliases={a for a in aliases if len(norm(a))>=4 and ' 'in a}
 by_identity[k].update(aliases);public_name_proof.append({'identity':k,'aliases':sorted(aliases)})
name_counts=collections.Counter(r['full_name']for r in raw if r.get('full_name'))
canonical={k:sorted(v,key=lambda s:(-name_counts[s],len(s),s))[0]for k,v in by_identity.items()}
for k,v in by_identity.items():
 if 'Chad Johnson'in v and 'Chad Ochocinco'in v:canonical[k]='Chad Johnson'
 if 'Crazy Legs Hirsch'in v:canonical[k]='Elroy Hirsch'
 if 'Too Tall Jones'in v:canonical[k]='Ed “Too Tall” Jones'
missing=[];counts=[];built=[];alias_decisions=[];holds=collections.Counter();admitted_rows=[]
for q in spec['questions']:
 code=q['teamCode']
 memberships=collections.defaultdict(list)
 for i,row in enumerate(raw):
  if not row.get('full_name'):continue
  if any(row['team']==t and a<=row['season']<=b for t,a,b in rules[code]):memberships[identity(row)].append(i)
 # Merge only the identical submitted canonical label inside this roster;
 # this cannot create more than one score for an indistinguishable public name.
 names={};years_by_name=collections.defaultdict(set)
 for k,indices in memberships.items():
  label=canonical[k];n=norm(label);r=names.setdefault(n,{'label':label,'aliases':set()});r['aliases'].update(by_identity[k]);years_by_name[n].update(raw[i]['season']for i in indices)
 # Exact source spellings of a common public nickname are preserved. Scope any
 # editorial alias to the verified franchise rather than sharing it by surname.
 for label,aliases in q['publicAliases'].items():
  n=norm(label)
  if n not in names:
   hits=[n2 for n2,p in names.items()if any(norm(a)==n for a in p['aliases'])]
   if not hits:missing.append({'team':code,'unknownExplicitAliasOwner':label});continue
   n=hits[0]
  names[n]['aliases'].update(aliases)
 owners=collections.defaultdict(set)
 for n,p in names.items():
  p['aliases']={a for a in p['aliases']if norm(a)!=n and norm(a)not in names}
  for a in p['aliases']:owners[norm(a)].add(n)
 conflicts={a:sorted(v)for a,v in owners.items()if len(v)>1}
 # An actual full alias shared by two eligible people can score only once.
 # Prefer the recognizable common player, then longer franchise participation.
 # Preserve the entire eligibility decision in the review ledger.
 familiar_labels={norm(v)for v in q['familiar']};chosen={}
 for a,v in owners.items():chosen[a]=max(v,key=lambda n:(n in familiar_labels,len(years_by_name[n]),names[n]['label']))
 alias_decisions.append({'team':code,'sharedEligibleAliases':{a:{'eligible':[names[n]['label']for n in v],'chosen':names[chosen[a]]['label']}for a,v in conflicts.items()}})
 lookup={**{n:n for n in names},**chosen}
 for n,p in names.items():p['aliases']={a for a in p['aliases']if lookup.get(norm(a))==n}
 common={lookup[norm(s)]for s in q['familiar']if norm(s)in lookup};lo={lookup[norm(s)]for s in q['familiar'][:6]if norm(s)in lookup}
 not_found=[s for s in q['familiar']if norm(s)not in lookup]
 if not_found:missing.append({'team':code,'familiarMissing':not_found})
 if norm(q['rare'])not in lookup:missing.append({'team':code,'rareMissing':q['rare']});continue
 rk=lookup[norm(q['rare'])];assert rk not in common,(code,'rare in common')
 assert not[s for s in q['exclude']if norm(s)in lookup],(code,'known ineligible input accepted')
 tiers=collections.defaultdict(list)
 for k,p in sorted(names.items(),key=lambda x:norm(x[1]['label'])):
  yrs=years_by_name[k];score=10 if k in lo else 30 if k in common else 100 if k==rk else 60 if len(yrs)>=5 else 85
  tiers[str(score)].append({'label':p['label'],'aliases':sorted(p['aliases'])})
 built.append(dict(id='authored-'+q['key'],concept=q['key'],family='sports',topic='NFL FRANCHISE ROSTERS',prompt=q['prompt'],scope=q['scope'],format='whole-nfl-franchise-roster',rationale='One all-time recognizable NFL franchise, with its entire captured annual roster history reconciled against documented franchise identity. Team moves, renames, seasons, positions, city-name collisions and individual source records expand or repair the answer inventory, never create additional prompts. Familiar player probes were written before this extraction.',familiar=q['familiar'],exclude=q['exclude'],references=q['references'],answers=dict(tiers)))
 counts.append({'id':'authored-'+q['key'],'rawRosterRows':sum(map(len,memberships.values())),'canonicalNames':len(names),'familiarInputs':len(q['familiar']),'rare':names[rk]['label'],'coverageYears':sorted({raw[i]['season']for v in memberships.values()for i in v})})
 admitted_rows.extend((code,i)for v in memberships.values()for i in v)
assert not missing,missing
files={D/'batches/29-nfl-franchise-rosters.json':json.dumps({'version':1,'questions':built},ensure_ascii=False,separators=(',',':'))+'\n',D/'nfl-franchise-checks.json':json.dumps({'sourceRosterRecords':len(raw),'sourcePublicNameRecords':len(players),'sharedAliasDecisions':alias_decisions,'checks':counts},ensure_ascii=False,indent=2)+'\n',D/'nfl-public-name-proof.json':json.dumps(public_name_proof,ensure_ascii=False,indent=2)+'\n'}
for p,t in files.items():
 if '--check'in sys.argv:assert p.read_text()==t,p
 else:p.write_text(t)
print('Prepared',len(built),'whole franchise inventories;',sum(x['canonicalNames']for x in counts),'canonical names. Normal admission is separate.')
