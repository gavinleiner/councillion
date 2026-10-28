#!/usr/bin/env python3
"""All paginated driver records, with real names rather than guessed initials."""
import collections,json,pathlib,re,sys,unicodedata
ROOT=pathlib.Path(__file__).resolve().parents[1]
s=json.load(open(ROOT/'data-snapshots/authored/sources/f1-drivers.json'))
assert len(s['drivers'])==s['total']==881
assert len({d['driverId']for d in s['drivers']})==s['total']
assert sum(p['returned']for p in s['requests'])==s['total']
expected_offset=0
for p in s['requests']:
 assert p['offset']==expected_offset
 expected_offset+=p['returned']
assert expected_offset==s['total']
def norm(v):return re.sub('[^a-z0-9+#]','',unicodedata.normalize('NFKD',v).encode('ascii','ignore').decode().lower())
familiar='Lewis Hamilton|Max Verstappen|Michael Schumacher|Ayrton Senna|Lando Norris|Charles Leclerc|Fernando Alonso|Sebastian Vettel|Kimi Raikkonen|Nico Rosberg|Jenson Button|Nigel Mansell|Alain Prost|Nelson Piquet|Niki Lauda|James Hunt|Jackie Stewart|Jack Brabham|Stirling Moss|Juan Manuel Fangio|Alberto Ascari|Graham Hill|Damon Hill|Jim Clark|John Surtees|Mario Andretti|Emerson Fittipaldi|Alan Jones|Keke Rosberg|Oscar Piastri|George Russell|Carlos Sainz|Sergio Perez|Valtteri Bottas|Daniel Ricciardo|Yuki Tsunoda|Pierre Gasly|Esteban Ocon|Lance Stroll|Alex Albon|Nico Hulkenberg|Kevin Magnussen|Oliver Bearman|Liam Lawson|Isack Hadjar|Gabriel Bortoleto|Franco Colapinto|Jack Doohan|Kimi Antonelli|Arvid Lindblad|Zhou Guanyu|Guanyu Zhou'.split('|')
manual={
 'Juan Fangio':['Juan Manuel Fangio'],
 'Kimi Räikkönen':['Kimi Raikkonen','Iceman'],
 'Nico Hülkenberg':['Nico Hulkenberg','Hulk'],
 'Sergio Pérez':['Sergio Perez','Checo Perez','Checo'],
 'Carlos Sainz':['Carlos Sainz Jr.','Carlos Sainz Junior'],
 'Alexander Albon':['Alex Albon'],
 'Andrea Kimi Antonelli':['Kimi Antonelli'],
 'Giuseppe Farina':['Nino Farina'],
 'Maurice Trintignant':['Trintignant'],
 'José Froilán González':['Jose Froilan Gonzalez'],
 'A. J. Foyt':['AJ Foyt','A.J. Foyt'],
 'Michael Schumacher':['Schumi'],
 'Lewis Hamilton':['Sir Lewis Hamilton'],
 'Jackie Stewart':['Sir Jackie Stewart'],
 'Stirling Moss':['Sir Stirling Moss'],
 'Jack Brabham':['Sir Jack Brabham'],
}
rows={}
for d in s['drivers']:
 original=d['givenName']+' '+d['familyName']
 name={'zhou':'Zhou Guanyu'}.get(d['driverId'],original);k=norm(name)
 if k not in rows:rows[k]={'label':name,'aliases':set(),'family':d['familyName']}
 rows[k]['aliases'].update(manual.get(name,[]))
 if name!=original:rows[k]['aliases'].add(original)
 # Real surname: an actual part of the driver's name. Never turn the official
 # three-letter code or initials into a new alias for a non-abbreviated name.
 rows[k]['aliases'].add(d['familyName'])
exact={norm(a):k for k,r in rows.items()for a in [r['label'],*r['aliases']]}
missing=[name for name in familiar if norm(name)not in exact]
assert not missing,('Missing independently written current/historical driver names',missing)
common={exact[norm(n)]for n in familiar}
easy={exact[norm(n)]for n in familiar[:6]}
rare=norm('Eitel Cantoni');assert rare in rows
owners=collections.defaultdict(list)
for k,r in rows.items():
 r['points']=100 if k==rare else 10 if k in easy else 30 if k in common else 85
 for a in r['aliases']:
  if norm(a)not in rows:owners[norm(a)].append(k)
choice={n:min(ks,key=lambda k:(rows[k]['points'],rows[k]['label']))for n,ks in owners.items()}
tiers=collections.defaultdict(list)
for k,r in sorted(rows.items()):
 tiers[str(r['points'])].append({'label':r['label'],'aliases':sorted(a for a in r['aliases']if norm(a)!=k and choice.get(norm(a))==k)})
q=dict(id='authored-formula-one-drivers',concept='formula-one-drivers',family='sports',topic='ON THE GRID',prompt='Name a driver who has competed in Formula One.',scope='Drivers in the complete Jolpica/Ergast Formula One World Championship driver inventory count, including historical entrants and the Indianapolis 500 when it was part of that championship. A real surname can identify a valid driver; invented initials and racing three-letter codes do not count as names.',format='whole-roster',rationale='An accessible whole sports roster with current stars and a full historical tail. It is not split by team, nationality, season or combinations of tags.',familiar=familiar,exclude=['Dale Earnhardt','Valentino Rossi','HAM','VER'],references=[s['source'],s['documentation'],s['terms'],'https://creativecommons.org/licenses/by-nc-sa/4.0/'],answers=dict(tiers))
target=ROOT/'data-snapshots/authored/batches/09-formula-one-drivers.json';text=json.dumps({'version':1,'questions':[q]},ensure_ascii=False,indent=2)+'\n'
if '--check'in sys.argv:assert target.read_text()==text
else:target.write_text(text)
print('Complete F1 driver inventory:',len(rows),'answers;',len(familiar),'independent familiar names checked; all',len(s['requests']),'source pages reconciled.')
