#!/usr/bin/env python3
"""Build deliberately authored questions. A recipe never approves itself.

Input files contain complete inventories, scopes, factual references and separate
familiar-answer checks. Only IDs explicitly listed in admission.json can enter
normal play. This builder also produces a review ledger rather than treating a
large source archive as 5,000 finished questions.
"""
import argparse, collections, gzip, hashlib, json, pathlib, re, unicodedata

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'data-snapshots/authored'
OUT = ROOT / 'authored-banks'
FAMILIES = {'gaming','sports','culture','music','food','nature','science','world','everyday'}
TIERS = (10,30,60,85,100)

def norm(s):
    return re.sub(r'[^a-z0-9+#]', '', unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower())

def digest(value):
    return hashlib.sha256(value).hexdigest()

def load_questions():
    result=[]
    for path in sorted((SOURCE/'batches').glob('*.json')):
        batch=json.loads(path.read_text())
        for q in batch['questions']:
            q={**q,'batch':path.stem}
            assert q['family'] in FAMILIES, q['id']
            assert re.fullmatch(r'authored-[a-z0-9-]+',q['id']),q['id']
            assert len(q['references'])>=1 and all(x.startswith('https://') for x in q['references']),q['id']
            assert len(q['familiar'])>=6 and len(q['exclude'])>=1,q['id']
            assert q['concept'] and q['scope'] and q['rationale'],q['id']
            rows=[]
            for tier,items in q['answers'].items():
                assert int(tier) in TIERS,q['id']
                for item in items.split('|') if isinstance(items,str) else items:
                    if isinstance(item,dict):name,aliases=item['label'],item.get('aliases',[])
                    else:name,*aliases=item.split('~')
                    assert name.strip() and len(name)<180,q['id']
                    rows.append([name.strip(),int(tier),sorted(set(a.strip() for a in aliases if a.strip()))])
            names={};canon=set()
            for name,points,aliases in rows:
                assert norm(name) not in canon,(q['id'],'duplicate answer',name)
                canon.add(norm(name))
                for a in [name,*aliases]:
                    k=norm(a)
                    assert k not in names or names[k]==name,(q['id'],'ambiguous alias',a)
                    names[k]=name
            minimum=12 if q.get('naturalFinite') else 24
            assert len(rows)>=minimum,(q['id'],'insufficient answer inventory',len(rows))
            for familiar in q['familiar']:
                assert norm(familiar) in names,(q['id'],'missing independently specified familiar answer',familiar)
            for wrong in q['exclude']:
                assert norm(wrong) not in names,(q['id'],'known false answer',wrong)
            for map_name in ['literalAliases','foldedLiteralAliases']:
                if not q.get(map_name):continue
                assert isinstance(q[map_name],dict), (q['id'],'public names must be a map',map_name)
                for literal,target in q[map_name].items():
                    assert isinstance(literal,str) and literal.strip()==literal and 0<len(literal)<=256, (q['id'],'invalid public name',map_name)
                    assert norm(target) in canon and literal not in q['exclude'], (q['id'],'invalid public identity target',literal,target)
                    if map_name=='foldedLiteralAliases':assert literal==literal.lower(), (q['id'],'folded public spelling must be lowercase',literal)
            if 'preserveNumericTokens' in q:assert isinstance(q['preserveNumericTokens'],bool), (q['id'],'numeric-token opt-in must be boolean')
            q['rows']=rows
            result.append(q)
    assert len(result)==len({q['id'] for q in result}),'Duplicate question ID'
    assert len(result)==len({q['concept'] for q in result}),'Same concept cannot count twice'
    assert len(result)==len({norm(q['prompt']) for q in result}),'Rewording/duplicate prompt'
    fingerprints={}
    for q in result:
        fp=digest('\n'.join(sorted(norm(r[0]) for r in q['rows'])).encode())
        assert fp not in fingerprints,(q['id'],'identical answer universe',fingerprints.get(fp))
        fingerprints[fp]=q['id']
    return result

def main():
    args=argparse.ArgumentParser()
    args.add_argument('--check',action='store_true')
    args.add_argument('--ledger-only',action='store_true')
    opts=args.parse_args()
    qs=load_questions()
    admission=json.loads((ROOT/'data-snapshots/reviewed-standard/admission.json').read_text())
    admitted={q['id'] for q in admission['questions']}
    summary={'target':5000,'authoredCandidates':len(qs),'admittedAuthored':sum(q['id'] in admitted for q in qs),
             'normalPoolAdmitted':len(admitted),'remaining':max(0,5000-len(admitted)),
             'candidateFamilies':dict(sorted(collections.Counter(q['family'] for q in qs).items())),
             'canonicalAnswerRows':sum(len(q['rows']) for q in qs),
             'familiarAnswerChecks':sum(len(q['familiar']) for q in qs)}
    print(json.dumps(summary,indent=2))
    if opts.ledger_only:return
    metadata=[];manifest=[]
    for q in qs:
        raw=json.dumps(q['rows'],ensure_ascii=False,separators=(',',':')).encode()
        sha=digest(raw);filename=q['id']+'.'+sha[:16]+'.json.gz'
        meta={k:q[k] for k in ['id','family','prompt','scope','concept']}
        meta.update(topic=q['topic'].upper(),group='authored-'+q['format'],source='; '.join(q['references']),
                    answerCount=len(q['rows']),familiarCount=sum(r[1]<=30 for r in q['rows']),
                    answerDirectory='authored-banks',answerFile=filename,funVersion=9,editorialVersion=1,contentStage='admitted' if q['id'] in admitted else 'candidate',
                    dailyEligible=True,partyEligible=True,mixed=True,ranking='editorial-familiarity-v1',
                    naturalFinite=q.get('naturalFinite',False),
                    identityHash=digest('\n'.join(sorted(norm(r[0])for r in q['rows'])).encode()))
        for map_name in ['literalAliases','foldedLiteralAliases']:
            if q.get(map_name):meta[map_name]=q[map_name]
        if q.get('preserveNumericTokens'):meta['preserveNumericTokens']=True
        metadata.append(meta);manifest.append({**meta,'sha256':sha,'familiar':q['familiar'],'exclude':q['exclude'],
                                             'rationale':q['rationale'],'batch':q['batch']})
        target=OUT/filename
        if opts.check:assert gzip.decompress(target.read_bytes())==raw,target
        else:
            OUT.mkdir(exist_ok=True);target.write_bytes(gzip.compress(raw,mtime=0))
    build=digest(json.dumps(metadata,sort_keys=True).encode())[:16]
    public_build=digest(json.dumps([p for p in metadata if p['id'] in admitted],sort_keys=True).encode())[:16]
    files={ROOT/'authored-question-catalog.js':"// Deliberately authored inventories; normal admission is separate.\nimport {createAuthoredCatalog} from './fun-bank-loader.js';\nexport const AUTHORED_PACKS=createAuthoredCatalog("+json.dumps(metadata,ensure_ascii=False,separators=(',',':'))+','+json.dumps(public_build)+');\n',
           ROOT/'authored-bank-manifest.json':json.dumps({'build':build,'count':len(qs),'categories':manifest},ensure_ascii=False,indent=2)+'\n',
           SOURCE/'progress.json':json.dumps(summary,indent=2)+'\n'}
    for path,content in files.items():
        if opts.check:assert path.read_text()==content,path
        else:path.write_text(content)

if __name__=='__main__':main()
