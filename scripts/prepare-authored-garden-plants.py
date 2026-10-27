"""Three whole plant subjects, with source scope and identity decisions kept inspectable.

Species, cultivars and recognized public plant groups expand answers inside
one question. They never become extra prompts or automatically approve one.
"""
import collections, gzip, json, pathlib, re, sys, unicodedata

R = pathlib.Path(__file__).resolve().parents[1]
D = R / 'data-snapshots/authored'
spec = json.loads((D / 'garden-plants-specifications.json').read_text())['questions']
policies = json.loads((D / 'garden-plants-review-policies.json').read_text())
sources = json.load(gzip.open(D / 'sources/garden-plants-reviewed-source-rows.json.gz'))['questions']

def norm(value):
    return re.sub('[^a-z0-9+#]', '', unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode().lower())

def emit(path, value):
    text = json.dumps(value, ensure_ascii=False, indent=2) + '\n'
    if '--check' in sys.argv:
        assert path.read_text() == text, path
    else:
        path.write_text(text)

questions, ledgers = [], {}
for q in spec:
    key = q['key']
    policy = policies[key]
    names, held = {}, list(sources[key].get('held', []))
    for row in sources[key]['rows']:
        if row['label'] in policy['holds']:
            held.append(dict(row=row, reason=policy['holds'][row['label']]))
            continue
        label = policy['renameRepairs'].get(row['label'], row['label'])
        n = norm(label)
        assert n and len(label) < 180 and not re.search(r'Endnote|Chapter|TA2,|https?://', label), (key, label)
        entry = names.setdefault(n, dict(label=label, aliases=set(), origins=[]))
        entry['aliases'].update(row['aliases'])
        entry['origins'].append(row)
    # Only these reviewed equivalences may join canonical identities.
    for canonical, aliases in policy['aliasMerges'].items():
        hits = list({id(names[norm(a)]): names[norm(a)] for a in [canonical, *aliases] if norm(a) in names}.values())
        assert hits, (key, 'merge has no source identity', canonical)
        entry = dict(label=canonical, aliases=set(), origins=[])
        for hit in hits:
            entry['aliases'].update([hit['label'], *hit['aliases']])
            entry['origins'].extend(hit['origins'])
            names.pop(norm(hit['label']))
        entry['aliases'].update(aliases)
        entry['aliases'].discard(canonical)
        names[norm(canonical)] = entry
    # Prefer the actual familiar public plant name in result cards, while keeping
    # the source scientific identity as an exact searchable alias.
    for old, display in policy.get('displayNames', {}).items():
        entry = names.pop(norm(old))
        assert norm(display) not in names, (key, 'display-name collision', display)
        entry['aliases'].add(entry['label'])
        entry['label'] = display
        names[norm(display)] = entry
    owners = {n: n for n in names}
    for n, entry in names.items():
        entry['aliases'] = {a for a in entry['aliases'] if norm(a) != n}
        for alias in entry['aliases']:
            a = norm(alias)
            assert a and (a not in owners or owners[a] == n), (key, 'unreviewed alias collision', alias, entry['label'], names.get(owners.get(a), {}).get('label'))
            owners[a] = n
    assert not [s for s in q['familiar'] if norm(s) not in owners], (key, 'missing independent common input')
    assert not [s for s in q['exclude'] if norm(s) in owners], (key, 'wrong boundary')
    familiar = {owners[norm(s)] for s in q['familiar']}
    entry = {owners[norm(s)] for s in q['entryAnswers']}
    recognizable = {owners[norm(s)] for s in q['recognizable']}
    rare = owners[norm(q['rare'])]
    assert rare not in familiar, (key, 'rare anchor is a familiar answer')
    tiers = collections.defaultdict(list)
    for n, answer in sorted(names.items()):
        points = 10 if n in entry else 30 if n in familiar else 100 if n == rare else 60 if n in recognizable else 85
        tiers[str(points)].append(dict(label=answer['label'], aliases=sorted(answer['aliases'])))
    questions.append(dict(id='authored-' + key, concept=key, family=q['family'], topic=q['topic'], prompt=q['prompt'], scope=q['scope'],
                          format='whole-garden-plants', rationale='One independently proposed familiar whole subject, with a documented rare tail. Scientific names, named cultivars and recognized public plant groups remain answers inside each whole subject. Source metadata errors and ambiguous names are reviewed explicitly; no tag, year or source-row slices create prompts.',
                          familiar=q['familiar'], exclude=q['exclude'], references=q['references'], answers=dict(tiers)))
    ledgers[key] = dict(sourceRows=len(sources[key]['rows']), held=held, canonicalAnswers=len(names), independentFamiliarInputs=len(q['familiar']),
                        scoring='Explicit editorial familiarity tiers, not measured player frequencies and not spelling length.',
                        canonicalSourceMap={v['label']: v['origins'] for v in names.values()}, publicAliases={v['label']: sorted(v['aliases']) for v in names.values() if v['aliases']})
emit(D / 'batches/33-garden-plants.json', dict(version=1, questions=questions))
emit(D / 'garden-plants-review-ledger.json', ledgers)
print([(q['id'], sum(map(len, q['answers'].values()))) for q in questions])
