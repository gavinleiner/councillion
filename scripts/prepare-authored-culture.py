#!/usr/bin/env python3
"""Whole culture subjects, with independent common-name and boundary probes.

Genre membership is intersected with actual films before reading film names.
No director, television series, tag intersection or year slice is a question.
"""
import collections, gzip, json, pathlib, re, sys, unicodedata

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA = ROOT / 'data-snapshots/authored'
source = json.load(gzip.open(DATA / 'sources/culture-whole-concepts.json.gz'))
fixes = json.loads((DATA / 'culture-supplements.json').read_text())
checks = json.loads((DATA / 'culture-challenges.json').read_text())

def norm(value):
    return re.sub('[^a-z0-9+#]', '', unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode().lower())

specs = [
 ('fictional-detectives', 'The case is open', 'Name a fictional detective.',
  'Named fictional professional detectives and amateur sleuths count across books, comics, film, TV and games. A character must actually investigate cases; merely appearing in a mystery does not qualify.',
  'Sherlock Holmes|Hercule Poirot|Miss Marple|Nancy Drew|Velma Dinkley|Benoit Blanc', 'Albert Einstein|Taylor Swift'),
 ('fictional-pirates', 'Raise the flag', 'Name a fictional pirate.',
  'Named fictional sea, air and space pirates count, including characters who were pirates earlier in their story. A smuggler, sailor or marine is not automatically a pirate.',
  'Jack Sparrow|Captain Hook|Long John Silver|Monkey D. Luffy|Davy Jones|Hector Barbossa', 'Luke Skywalker|Hermione Granger'),
 ('fictional-princesses', 'Royal introductions', 'Name a princess from fiction.',
  'Characters who are, were, or are explicitly known as princesses count, along with the official Disney Princess lineup. A character does not qualify simply by being female, wearing a crown or appearing in a Disney movie.',
  'Cinderella|Ariel|Princess Peach|Princess Zelda|Princess Leia|Jasmine', 'Woody|Mickey Mouse'),
 ('named-fictional-vehicles', 'Fictional transport', 'Name a named vehicle from fiction.',
  'Named fictional vehicles, ships and vehicle models count across film, TV, books, comics and games, including living vehicle characters. Generic words such as car or spaceship, and individual parts that are not vehicles, do not count.',
  'Millennium Falcon|Batmobile|Ecto-1|TARDIS|Chitty Chitty Bang Bang|Magic School Bus', 'Car|Flux capacitor'),
 ('fictional-schools', 'School of fiction', 'Name a school or college from fiction.',
  'Named fictional schools, colleges, universities and training academies count across books, TV, film, comics and games. A real school does not qualify just because a fictional story mentions it.',
  "Hogwarts|Xavier's School for Gifted Youngsters|Springfield Elementary|South Park Elementary|Bikini Bottom Boating School|U.A. High School", 'Harvard University|Stanford University'),
 ('heist-films', 'One last job', 'Name a heist movie.',
  'Films built around a robbery, theft, con or organized caper count, including comedies, animated movies and shorts. Television series, directors and a film with only an unrelated passing theft do not automatically count.',
  "Ocean's Eleven|Italian Job|Heat|Inside Man|The Town|Logan Lucky", 'Quentin Tarantino|Finding Nemo'),
 ('time-travel-films', 'Out of time', 'Name a movie involving time travel or a time loop.',
  'Films in which characters travel through time or experience a repeating time loop count, including animated movies and shorts. Ordinary flashbacks, dreams about the past and a futuristic setting alone do not count.',
  'Back to the Future|The Terminator|Groundhog Day|Edge of Tomorrow|Looper|The Time Machine', 'The Godfather|Jurassic Park'),
]

questions, report = [], []
for key, topic, prompt, scope, familiar, wrong in specs:
    fix = fixes[key]
    raw = {p['id']: {**p, 'aliases': set(p['aliases'])} for p in source['groups'][key]}
    for qid in fix.get('hold', {}):
        raw.pop(qid, None)
    for qid, patch in fix.get('patch', {}).items():
        assert qid in raw, (key, qid)
        if 'name' in patch:
            # A corrupt source label is not an alias of the repaired name.
            raw[qid]['name'] = patch['name']
        raw[qid]['aliases'].update(patch.get('aliases', []))
        raw[qid]['aliases'].difference_update(patch.get('removeAliases', []))
    names = {}
    def merge(name, aliases=(), links=0):
        n = norm(name)
        if not n or len(name) >= 180 or re.fullmatch('Q[0-9]+', name):
            return
        existing = next((k for k, p in names.items() if n == k or any(norm(a) == n for a in p['aliases'])), None)
        k = existing or n
        p = names.setdefault(k, {'label': name, 'aliases': set(), 'sitelinks': 0})
        p['aliases'].update(aliases)
        if n != k:
            p['aliases'].add(name)
        p['sitelinks'] = max(links, p['sitelinks'])
    for p in raw.values():
        label = p['name']
        if key == 'named-fictional-vehicles' and re.search(r'^(?:fictional |anthropomorphic |abandoned |space station from |ships and other |aftercolony ships)|ships and other weapons|^mecha$|^mobile suit$|^starfighter$|^space colony$', label, re.I):
            continue
        merge(label, p['aliases'], p['sitelinks'])
    for title in fix.get('lists', []):
        for label in source['lists'][title]['names']:
            if label not in fix.get('heldListLabels', {}):
                merge(label)
    for p in fix.get('add', []):
        documented = {norm(a) for a in p.get('aliases', [])}
        existing = [k for k in names if k in documented]
        if norm(p['name']) not in names and len(existing) == 1:
            merge(names[existing[0]]['label'], [p['name'], *p.get('aliases', [])], p.get('sitelinks', 0))
        else:
            merge(p['name'], p.get('aliases', []), p.get('sitelinks', 0))
    for canonical, aliases in fix.get('aliases', {}).items():
        owners = [names[norm(canonical)]] if norm(canonical) in names else [p for p in names.values() if any(norm(a) == norm(canonical) for a in p['aliases'])]
        assert len(owners) == 1, (key, 'Ambiguous alias owner', canonical)
        owner = owners[0]
        owner_key = next(k for k, p in names.items() if p is owner)
        for alias in aliases:
            other = names.get(norm(alias))
            if other is not None and other is not owner:
                owner['aliases'].update([other['label'], *other['aliases']])
                owner['sitelinks'] = max(owner['sitelinks'], other['sitelinks'])
                del names[norm(alias)]
        owner['aliases'].update(aliases)
    exact = {norm(a): k for k, p in names.items() for a in [p['label'], *p['aliases']]}
    positive = checks[key]['yes']
    missing = [a for a in positive if norm(a) not in exact]
    assert not missing, (key, 'Missing independently written common guesses', missing)
    low = {exact[norm(a)] for a in familiar.split('|')}
    common = {exact[norm(a)] for a in positive}
    for k, p in names.items():
        p['points'] = 100 if k == exact[norm(fix['rare'])] else 10 if k in low or p['sitelinks'] >= 65 else 30 if k in common or p['sitelinks'] >= 20 else 60 if p['sitelinks'] >= 4 else 85
    # Keep actual short names such as Death Note's L. Do not synthesize an
    # acronym or accept source working-title codes as if they were real names.
    owners = collections.defaultdict(list)
    for k, p in names.items():
        for a in p['aliases']:
            n = norm(a)
            if n not in names and n and not re.search(r'fake working title|\(fictitious character\)|\(character\)|\(Blu-ray', a, re.I):
                if re.fullmatch(r'[A-Z][A-Z0-9: .-]{0,7}', a) and a not in fixes['actualShortNames']:
                    continue
                owners[n].append(k)
    chosen = {n: min(keys, key=lambda k: (names[k]['points'], -names[k]['sitelinks'], names[k]['label'])) for n, keys in owners.items()}
    tiers = collections.defaultdict(list)
    for k, p in sorted(names.items()):
        tiers[str(p['points'])].append({'label': p['label'], 'aliases': sorted(a for a in p['aliases'] if norm(a) != k and chosen.get(norm(a)) == k)})
    final = {norm(a) for rows in tiers.values() for p in rows for a in [p['label'], *p['aliases']]}
    assert all(norm(a) in final for a in positive), (key, 'A genuine common name was lost to alias filtering')
    assert all(norm(a) not in final for a in checks[key]['no']), (key, 'Known wrong answer')
    questions.append(dict(id='authored-' + key, concept=key, family='culture', topic=topic, prompt=prompt, scope=scope,
        format='whole-concept', rationale='One recognizable whole subject. Independent common guesses are checked separately from typed source membership; no title words, arbitrary dates, geographic slices or pairs of tags create extra questions.',
        familiar=positive, exclude=checks[key]['no'], references=fix['references'], answers=dict(tiers)))
    report.append({'id': 'authored-' + key, 'answers': len(names), 'independentYesChecks': len(positive), 'independentNoChecks': len(checks[key]['no']), 'heldSourceRecords': fix.get('hold', {})})

files = {
    DATA / 'batches/10-culture-whole-concepts.json': json.dumps({'version': 1, 'questions': questions}, ensure_ascii=False, separators=(',', ':')) + '\n',
    DATA / 'culture-checks.json': json.dumps(report, ensure_ascii=False, indent=2) + '\n',
}
for path, text in files.items():
    if '--check' in sys.argv:
        assert path.read_text() == text, path
    else:
        path.write_text(text)
print([(p['id'], p['answers']) for p in report])
