"""Broader, explicit alternatives to the weakest song-title constraints.

Run in build-group-banks.py's namespace. Each OR predicate uses the complete
recorded union, not an invented intersection or a few hand-picked examples.
"""
byid={c['id']:c for c in candidates}
for recipe in load(Path('group/accessible-prompts.json')):
 pred=recipe['predicate'];kind=pred['kind'];rs=[];scope=None
 if kind=='film-any-genres':
  wanted=set(pred['genres'])
  rs=[row(r[0],points(r[6],(10000,1000,100)),[r[1]]) for r in films if wanted.intersection(r[3])]
  source='TMDB recorded genre memberships in the retained released-movie snapshot; either listed genre counts.'
 elif kind=='tv-any-genres':
  wanted=set(pred['genres'])
  if not wanted.issubset({g for r in tv for g in r[2]}):continue
  rs=[row(r[0],points(r[4],(100,85,50))) for r in tv if wanted.intersection(r[2])]
  source='TVmaze recorded genre memberships in the retained full show index; either listed genre counts; CC BY-SA 4.0.'
 elif kind=='steam-any-tags':
  if not all(tag in tagsets for tag in pred['tags']):continue
  ids=set().union(*(tagsets[tag] for tag in pred['tags']))
  rs=[row(games[i][0],points(games[i][2],(20000,5000,500)),games[i][1]) for i in sorted(ids) if gamevalid(games[i][0])]
  source='Steam community tags via SteamSpy, retained 2026-10-23; complete union of either tag, not both.'
 elif kind=='song-title-any-words':
  wanted=set(pred['words'])
  rs=[row(r[0],points(r[4],(75,50,20)),songAliases[r[0]]) for r in music if words(r[0])&wanted]
  source='Recorded Spotify track titles, Maharshi Pandya BSD factual snapshot, revision 635b034; literal whole-word theme vocabulary.'
  scope='The title or subtitle must include at least one of these words: '+', '.join(pred['words'])+'. Lyrics do not count. Homonyms count as literal title words.'
 elif kind=='bank-union':
  if not all(id in byid for id in pred['banks']):continue
  rs=[r for id in pred['banks'] for r in byid[id]['rows']]
  source='Complete union of the retained league banks: '+', '.join(pred['banks'])+'. Source manifests and career indexes are retained under data-snapshots/.'
 else:raise ValueError('Unknown accessible predicate: '+kind)
 add(recipe['id'],recipe['prompt'],recipe['family'],'accessible-'+kind,rs,source,priority=78,minimum=30,known=16,predicate=pred,scope=scope)
 entry=next((c for c in candidates if c['id']==recipe['id']),None)
 if entry:entry['topic']={'film-any-genres':'MOVIE NIGHT','tv-any-genres':'TV & STREAMING','steam-any-tags':'STEAM GAMES','song-title-any-words':'SONG TITLES','bank-union':'SPORTS'}[kind]

# Retire only from ordinary games. Historical manifests/banks remain readable
# so already-published Daily runs and saved results cannot disappear.
policy=load(Path('group/playability-policy.json'))
def held_song(c):
 pred=c.get('predicate') or {}
 return (pred.get('kind')=='title-word' and pred.get('media')=='song' and c['familiarCount']<policy['minimumSongTitleFamiliar']) or (pred.get('kind')=='title-vocabulary' and pred.get('media')=='song' and (c['familiarCount']<policy['minimumSongTitleFamiliar'] or pred['wordnet'].split('.')[0].replace('_',' ') in policy['heldSongTitleKinds']))
candidates[:]=[c for c in candidates if not held_song(c)]
