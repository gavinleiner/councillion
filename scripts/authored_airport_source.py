"""Full OurAirports reconciliation; codes come from fields, never name initials."""
import collections,gzip,json,pathlib,re,unicodedata
D=pathlib.Path(__file__).resolve().parents[1]/'data-snapshots/authored'
def norm(x):return re.sub('[^a-z0-9+#]','',unicodedata.normalize('NFKD',x).encode('ascii','ignore').decode().lower())
def augment_airports(raw):
 s=json.load(gzip.open(D/'sources/ourairports-full.json.gz'));assert len(s['airports'])==s['rowCount']
 name_index=collections.defaultdict(set);code_index=collections.defaultdict(set)
 for qid,row in raw.items():
  for name in [row['name'],*row['aliases']]:
   name_index[norm(name)].add(qid)
   if re.fullmatch('[A-Z]{3,4}',name):code_index[name].add(qid)
 # Historical and current codes can collide. Current facilities precede closed
 # records, and stable ICAO matching precedes IATA and local name guesses.
 records=sorted(s['airports'],key=lambda r:(r['type']=='closed',r['scheduled_service']!='yes',{'large_airport':0,'medium_airport':1}.get(r['type'],2),int(r['id'])))
 choices={};held=[];matched=0;created=0;type_codes={k:set()for k in ['IATA','ICAO','FAA']}
 for row in records:
  name=row['name'].strip();n=norm(name)
  if not n or len(name)>=180 or re.match(r'^(?:unnamed|unknown|unidentified|duplicate|not an airport)\b',name,re.I):held.append({'id':row['id'],'name':name,'reason':'No qualified usable actual facility name.'});continue
  icao=row.get('icao_code','').strip();iata=row['iata_code'].strip()
  valid_icao=icao if re.fullmatch('[A-Z]{4}',icao)and icao not in ['XXXX','ZZZZ']else None
  valid_iata=iata if re.fullmatch('[A-Z]{3}',iata)and iata not in ['XXX','ZZZ']else None
  local=row['local_code'].strip();valid_faa=local if row['iso_country']=='US'and re.fullmatch('[A-Z0-9]{3,4}',local)and local not in ['XXX','XXXX','ZZZ','ZZZZ']else None
  candidates=(code_index.get(valid_icao,set())if valid_icao else set())or name_index.get(n,set())or(code_index.get(valid_iata,set())if valid_iata else set())
  if candidates:
   qid=min(candidates,key=lambda k:(-raw[k].get('sitelinks',0),raw[k]['name'],k));owner=raw[qid];matched+=1
   if n!=norm(owner['name']):owner['aliases'].append(name)
  else:
   qid='ourairports-'+row['id'];owner={'id':qid,'name':name,'aliases':[],'sitelinks':0};raw[qid]=owner;created+=1
  name_index[n].add(qid)
  for kind,code in [('ICAO',valid_icao),('IATA',valid_iata),('FAA',valid_faa)]:
   if code:type_codes[kind].add(code)
   if code:
    choices.setdefault(code,qid);code_index[code].add(qid)
 # Keep actual current code ownership rather than retaining a stale source
 # alias solely because its old airport had more sitelinks or higher rarity.
 for qid,row in raw.items():row['aliases']=[a for a in row['aliases']if not(re.fullmatch('[A-Z]{3,4}',a)and a in choices and choices[a]!=qid)]
 preferred={}
 for code,qid in choices.items():raw[qid]['aliases'].append(code);preferred[norm(code)]=norm(raw[qid]['name'])
 proof={'source':s['source'],'csvSha256':s['csvSha256'],'sourceRows':s['rowCount'],'matchedRows':matched,'addedRows':created,'heldRows':held,'documentedCodes':len(choices),'iataCodes':len(type_codes['IATA']),'icaoCodes':len(type_codes['ICAO']),'faaCodes':len(type_codes['FAA'])}
 return raw,set(choices),preferred,proof
