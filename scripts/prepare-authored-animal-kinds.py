#!/usr/bin/env python3
"""Whole animal groups from publisher taxonomies, not word/tag filtering."""
import collections, gzip, json, pathlib, re, sys, unicodedata

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA = ROOT / 'data-snapshots/authored'
birds = json.load(gzip.open(DATA / 'sources/clements-bird-orders.json.gz'))
mdd = json.load(gzip.open(DATA / 'sources/mdd-2.5-species.json.gz'))

def norm(value):
    return re.sub('[^a-z0-9+#]', '', unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode().lower())

specs = [
 dict(key='owl-kinds', source='owls', topic='Night watch', prompt='Name a kind of owl.',
      scope='Owl species and established named groups count, including recently extinct species in the source taxonomy. Common names and scientific names count. An owlet-nightjar or a nighthawk is not an owl.',
      yes='Barn owl|Snowy owl|Great horned owl|Burrowing owl|Tawny owl|Barred owl|Little owl|Elf owl|Long-eared owl|Short-eared owl|Northern saw-whet owl|Great gray owl|Eurasian eagle-owl|Eastern screech-owl|Western screech-owl|Northern hawk owl|Spectacled owl|Spotted owl|Screech owl|Scops owl|Eagle owl|Pygmy owl|Fishing owl',
      no='Nighthawk|Australian owlet-nightjar|Barn swallow', rare='Siau Scops-Owl',
      groups='Barn Owl|Screech Owl|Scops Owl|Eagle Owl|Pygmy Owl|Fishing Owl|Wood Owl|Hawk Owl',
      aliases={'Great Gray Owl':['Great grey owl'], 'Eurasian Eagle-Owl':['Eurasian eagle owl']}),
 dict(key='parrot-kinds', source='parrots', topic='Repeat after me', prompt='Name a kind of parrot.',
      scope='Parrot species and established named groups count, including recently extinct species in the source taxonomy. Common and scientific names count. Pet colour mutations share their species identity; a bird is not a parrot just because its name contains that word.',
      yes='Macaw|Cockatoo|Budgerigar|Cockatiel|African grey parrot|Lovebird|Parakeet|Lorikeet|Conure|Amazon parrot|Kea|Kakapo|Eclectus parrot|Scarlet macaw|Blue-and-yellow macaw|Hyacinth macaw|Palm cockatoo|Galah|Sulphur-crested cockatoo|Rose-ringed parakeet|Monk parakeet|Sun conure|Green-cheeked conure|Rainbow lorikeet|Vasa parrot|Caique|Parrotlet|Senegal parrot|Timneh parrot',
      no='Toucan|Parrotfish|Parrot crossbill', rare='Vulturine Parrot',
      groups='Macaw|Cockatoo|Lovebird|Parakeet|Lorikeet|Conure|Amazon Parrot|Eclectus Parrot|Vasa Parrot|Caique|Parrotlet',
      aliases={'Gray Parrot':['African grey parrot','African gray parrot','Congo African grey parrot'], 'Budgerigar':['Budgie'], 'Blue-and-yellow Macaw':['Blue and gold macaw','Blue-and-gold macaw'], 'Sun Parakeet':['Sun conure'], 'Green-cheeked Parakeet':['Green-cheeked conure']}),
 dict(key='penguin-kinds', source='penguins', topic='Penguin roll call', prompt='Name a kind of penguin.',
      scope='Species in the eBird/Clements penguin order and established common group names count. English or scientific names count. Puffins and auks are different kinds of bird.',
      yes='Emperor penguin|King penguin|Little penguin|Adelie penguin|Chinstrap penguin|Gentoo penguin|African penguin|Galapagos penguin|Humboldt penguin|Magellanic penguin|Yellow-eyed penguin|Rockhopper penguin|Macaroni penguin|Royal penguin|Fiordland penguin|Snares penguin|Erect-crested penguin|Fairy penguin|Little blue penguin|Jackass penguin',
      no='Puffin|Great auk|Penguin-shaped toy', rare='Snares Penguin',
      groups='Rockhopper Penguin', naturalFinite=True,
      aliases={'Little Penguin':['Little blue penguin','Fairy penguin','Blue penguin'], 'African Penguin':['Jackass penguin']}),
 dict(key='bat-kinds', source='bats', topic='After dark', prompt='Name a kind of bat.',
      scope='Living and recently extinct species in the Mammal Diversity Database, plus established named bat groups, count. Common names and documented scientific names count. A flying fox is a bat; a flying squirrel is not. Prehistoric fossil-only species are outside this current-species inventory.',
      yes='Vampire bat|Fruit bat|Flying fox|Little brown bat|Big brown bat|Horseshoe bat|Megabat|Microbat|Ghost bat|Bumblebee bat|Mexican free-tailed bat|Straw-coloured fruit bat|Egyptian fruit bat|Indian flying fox|Hammer-headed bat|Greater horseshoe bat|Lesser horseshoe bat|Greater mouse-eared bat|Natterer\'s bat|Serotine bat|Common noctule|Common pipistrelle|Pallid bat|Spotted bat|Tent-making bat',
      no='Flying squirrel|Pterodactyl|Baseball bat', rare='Wrinkle-faced Bat',
      groups='Fruit Bat~Megabat~Pteropodidae|Flying Fox~Pteropus|Horseshoe Bat~Rhinolophidae|Microbat|Free-tailed Bat~Molossidae|Leaf-nosed Bat|Sac-winged Bat|Disk-winged Bat~Disc-winged Bat|Vesper Bat~Vespertilionidae',
      aliases={'Desmodus rotundus':['Vampire bat'], 'Myotis lucifugus':['Little brown bat'], 'Craseonycteris thonglongyai':['Bumblebee bat'], 'Eidolon helvum':['Straw-coloured fruit bat','Straw-colored fruit bat'], 'Rousettus aegyptiacus':['Egyptian fruit bat'], 'Pteropus medius':['Indian flying fox'], 'Hypsignathus monstrosus':['Hammer-headed bat'], 'Eptesicus serotinus':['Serotine bat'], 'Uroderma bilobatum':['Tent-making bat']})
]

questions, checks = [], []
for spec in specs:
    key = spec['key']
    if spec['source'] == 'bats':
        records = [p for p in mdd['species'] if p['order'] == 'Chiroptera']
        assert len(records) == 1514
        entries = []
        for p in records:
            scientific = p['sciName'].replace('_', ' ')
            aliases = [scientific, *p['otherCommonNames'].split('|')]
            for field in ['originalNameCombination','CMW_sciName','MSW3_sciName']:
                name = p.get(field, '').replace('_',' ').strip()
                if re.fullmatch(r'[A-Z][A-Za-z]+ [a-z]+(?: [a-z]+)?', name):
                    aliases.append(name)
            entries.append(dict(name=p['mainCommonName'], aliases=aliases))
        refs = [mdd['source'], mdd['archive'], 'https://www.mammalsociety.org/']
    else:
        records = birds['groups'][spec['source']]['species']
        assert len(records) == birds['groups'][spec['source']]['speciesCount']
        entries = [dict(name=p['name'], aliases=[p['scientificName']]) for p in records]
        refs = [birds['source'], 'https://www.birds.cornell.edu/clementschecklist/', 'https://science.ebird.org/en/use-ebird-data/the-ebird-taxonomy']
    primary_scientific = {norm(p['sciName'].replace('_',' ')):norm(p['mainCommonName']) for p in records} if spec['source']=='bats' else {norm(p['scientificName']):norm(p['name']) for p in records}
    names = {}
    for p in entries:
        n = norm(p['name'])
        target = names.setdefault(n, dict(label=p['name'], aliases=set()))
        target['aliases'].update(a for a in p['aliases'] if a and a != 'NA')
    for text in spec['groups'].split('|'):
        label, *aliases = text.split('~')
        names.setdefault(norm(label), dict(label=label, aliases=set()))['aliases'].update(aliases)
    for canonical, aliases in spec['aliases'].items():
        owners = [p for n,p in names.items() if n == norm(canonical) or any(norm(a) == norm(canonical) for a in p['aliases'])]
        assert len(owners) == 1, (key, 'Unknown or ambiguous synonym owner', canonical)
        owners[0]['aliases'].update(aliases)
    exact = {norm(a): k for k,p in names.items() for a in [p['label'], *p['aliases']]}
    positive = spec['yes'].split('|')
    assert all(norm(a) in exact for a in positive), (key, 'Missing independent common name', [a for a in positive if norm(a) not in exact])
    assert norm(spec['rare']) in exact, (key, 'Missing source-backed rare anchor')
    low = {exact[norm(a)] for a in positive[:6]}
    common = {exact[norm(a)] for a in positive}
    for k,p in names.items():
        p['points'] = 100 if k == exact[norm(spec['rare'])] else 10 if k in low else 30 if k in common else 60 if len(p['label']) <= 25 else 85
    owners = collections.defaultdict(list)
    for k,p in names.items():
        for a in p['aliases']:
            if norm(a) not in names:
                owners[norm(a)].append(k)
    # A current accepted scientific name owns its current species even when an
    # older taxonomy also listed that string as another species' synonym.
    chosen = {n:primary_scientific.get(n) if primary_scientific.get(n) in v else min(v, key=lambda k:(names[k]['points'], names[k]['label'])) for n,v in owners.items()}
    tiers = collections.defaultdict(list)
    for k,p in sorted(names.items()):
        tiers[str(p['points'])].append({'label':p['label'], 'aliases':sorted(a for a in p['aliases'] if norm(a) != k and chosen.get(norm(a)) == k)})
    questions.append(dict(id='authored-'+key, concept=key, family='nature', topic=spec['topic'], prompt=spec['prompt'], scope=spec['scope'], format='whole-taxonomic-group',
        rationale='One recognizable whole animal group, with a complete publisher species inventory and independent familiar-name cases. No country, colour, habitat or other tag creates extra questions.',
        familiar=positive, exclude=spec['no'].split('|'), references=refs, naturalFinite=spec.get('naturalFinite',False), answers=dict(tiers)))
    checks.append({'id':'authored-'+key, 'publisherSpecies':len(records), 'answerIdentities':len(names), 'familiarChecks':len(positive)})

files = {DATA/'batches/11-animal-kinds.json':json.dumps({'version':1,'questions':questions},ensure_ascii=False,separators=(',',':'))+'\n',
         DATA/'animal-kind-checks.json':json.dumps(checks,indent=2)+'\n'}
for path,text in files.items():
    if '--check' in sys.argv:
        assert path.read_text() == text, path
    else:
        path.write_text(text)
print(checks)
