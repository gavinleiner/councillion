import {readFile,writeFile} from 'node:fs/promises';
import {nameValidationRule,textValidationRule} from '../moderation.js';
const file=new URL('../database.rules.json',import.meta.url),data=JSON.parse(await readFile(file,'utf8')),rules=data.rules,room=rules.rooms.$code;
// Child validation also runs on the host's parent-path writes.
room.meta.hostName={'.validate':nameValidationRule()};
room.members.$uid.name={'.validate':nameValidationRule()};
room.state.players={$player:{name:{'.validate':nameValidationRule()}}};
room.chat.$message.name={'.validate':nameValidationRule()};
room.chat.$message.text={'.validate':`newData.isString() && ${textValidationRule()}`};
rules.directory.$code.hostName={'.validate':nameValidationRule()};
const next=JSON.stringify(data,null,2)+'\n';
if(process.argv.includes('--check')){if(await readFile(file,'utf8')!==next)throw Error('Regenerate moderation rules with node scripts/update-moderation-rules.mjs');}
else await writeFile(file,next);
