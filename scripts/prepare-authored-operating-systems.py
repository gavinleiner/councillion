"""One whole operating-system subject with explicit role and identity review.

Actual named operating systems, families, versions and distributions expand answers inside ONE subject.
Source rows and aliases never become extra prompts or automatically approve one.
"""
import collections, gzip, json, pathlib, re, sys, unicodedata

R = pathlib.Path(__file__).resolve().parents[1]
D = R / 'data-snapshots/authored'
spec = json.loads((D / 'operating-systems-specifications.json').read_text())['questions']
policies = json.loads((D / 'operating-systems-review-policies.json').read_text())
sources = json.load(gzip.open(D / 'sources/operating-systems-reviewed-source-rows.json.gz'))['questions']

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
    variants = collections.defaultdict(set)
    names, held = {}, list(sources[key].get('held', []))
    for row in sources[key]['rows']:
        if row['label'] in policy['holds']:
            held.append(dict(row=row, reason=policy['holds'][row['label']]))
            continue
        label = policy['renameRepairs'].get(row['label'], row['label'])
        n = norm(label)
        assert n and len(label) < 180 and not re.search(r'Endnote|TA2,|https?://', label), (key, label)
        variants[n].add(label)
        entry = names.setdefault(n, dict(label=label, aliases=set(), origins=[]))
        entry['aliases'].update(row['aliases'])
        entry['origins'].append(row)
    for n, labels in variants.items():
        if len(labels) > 1:
            assert set(policy.get('normalizedVariantReviews', {}).get(n, [])) == labels, (key, 'unreviewed punctuation/case identity collision', n, labels)
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
    # Prefer the actual familiar public name in result cards, while keeping
    # the source scientific identity as an exact searchable alias.
    for old, display in policy.get('displayNames', {}).items():
        entry = names.pop(norm(old))
        assert norm(display) not in names, (key, 'display-name collision', display)
        entry['aliases'].add(entry['label'])
        entry['label'] = display
        names[norm(display)] = entry
    for label, aliases in policy.get('aliasHolds', {}).items():
        entry = names[norm(label)]
        blocked = {norm(a) for a in aliases}
        entry['aliases'] = {a for a in entry['aliases'] if norm(a) not in blocked}
    owners = {n: n for n in names}
    collisions = []
    for n, entry in names.items():
        entry['aliases'] = {a for a in entry['aliases'] if norm(a) != n}
        for alias in entry['aliases']:
            a = norm(alias)
            assert a, (key, 'empty alias', alias)
            if a in owners and owners[a] != n:
                collisions.append((alias, entry['label'], names.get(owners[a], {}).get('label')))
            else: owners[a] = n
    assert not collisions, (key, 'unreviewed alias collisions', collisions)
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
                          format='whole-operating-systems', rationale='One independent whole operating-system subject preserves common entry answers and a documented rare tail. Public OS families, actual current/historical systems, implemented research systems, named real versions and Linux distributions are reviewed by role and identity. Vendors, hardware, applications, source headings and unverified proposal-only labels are held. Source rows and version/distro names expand answers, never question count.',
                          familiar=q['familiar'], exclude=q['exclude'], references=q['references'], answers=dict(tiers)))
    if policy.get('literalAliases'):
        for raw, target in policy['literalAliases'].items():
            assert raw.strip() == raw and raw and len(raw) <= 256 and norm(target) in names, (key, 'invalid literal identity', raw, target)
            assert raw not in q['exclude'], (key, 'excluded literal override', raw)
        questions[-1]['literalAliases'] = policy['literalAliases']
    if policy.get('foldedLiteralAliases'):
        for raw, target in policy['foldedLiteralAliases'].items():
            assert raw == raw.strip().lower() and norm(target) in names, (key, 'invalid folded public spelling', raw, target)
        questions[-1]['foldedLiteralAliases'] = policy['foldedLiteralAliases']
    questions[-1]['preserveNumericTokens'] = True
    ledgers[key] = dict(foldedPublicSpellings=policy.get('foldedLiteralAliases', {}), normalizedVariantReviews=policy.get('normalizedVariantReviews', {}), literalPublicNames=policy.get('literalAliases', {}), sourceRows=len(sources[key]['rows']), held=held, canonicalAnswers=len(names), independentFamiliarInputs=len(q['familiar']),
                        scoring='Explicit editorial familiarity tiers, not measured player frequencies and not spelling length.',
                        canonicalSourceMap={v['label']: v['origins'] for v in names.values()}, publicAliases={v['label']: sorted(v['aliases']) for v in names.values() if v['aliases']})
emit(D / 'batches/37-operating-systems.json', dict(version=1, questions=questions))
emit(D / 'operating-systems-review-ledger.json', ledgers)
print([(q['id'], sum(map(len, q['answers'].values()))) for q in questions])
