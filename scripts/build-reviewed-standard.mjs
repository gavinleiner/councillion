import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),m=JSON.parse(readFileSync(new URL('data-snapshots/reviewed-standard/admission.json',root)));
const ids=m.questions.map(p=>p.id);
if(ids.length!==new Set(ids).size)throw Error('Duplicate admitted question');
const boundaries=Object.fromEntries(m.questions.filter(p=>p.no.length).map(p=>[p.id,p.no]));
const js='// Explicit playability review anchored to the saved 98 Yes votes.\nexport const REVIEWED_STANDARD_BUILD='+JSON.stringify(m.build)+';\nexport const REVIEWED_QUESTION_IDS=new Set('+JSON.stringify(ids)+');\nexport const REVIEWED_BOUNDARIES='+JSON.stringify(boundaries)+';\n';
const target=new URL('reviewed-question-standard.js',root);
if(process.argv.includes('--check')){if(readFileSync(target,'utf8')!==js)throw Error('Run node scripts/build-reviewed-standard.mjs after the explicit editorial review.');}
else writeFileSync(target,js);
