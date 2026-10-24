import {readFile,writeFile} from 'node:fs/promises';
import {OWNER_EMAIL} from '../account-honors.js';
const file=new URL('../database.rules.json',import.meta.url),data=JSON.parse(await readFile(file,'utf8'));
const google="auth !== null && auth.token.firebase.sign_in_provider === 'google.com'";
const owner=`${google} && auth.token.email_verified === true && auth.token.email === '${OWNER_EMAIL}'`;
const itemValidation="$id.matches(/^q(00[1-9]|0[1-9][0-9]|100)$/) && newData.hasChildren(['vote','note','at']) && newData.child('vote').isString() && newData.child('vote').val().matches(/^(yes|no|unset)$/) && newData.child('note').isString() && newData.child('note').val().length <= 500 && newData.child('at').isNumber() && newData.child('at').val() > 0 && newData.child('at').val() <= now + 5000";
data.rules.questionReviews={
 '.read':owner,
 $uid:{
  '.read':`${google} && auth.uid === $uid`,
  $version:{
   '.write':`${google} && auth.uid === $uid && $version === 'group-100-v1'`,
   '.validate':"newData.hasChildren(['version','updatedAt','items']) && newData.child('version').val() === 1 && newData.child('updatedAt').isNumber() && newData.child('updatedAt').val() > 0 && newData.child('updatedAt').val() <= now + 5000",
   items:{$id:{'.validate':itemValidation,$field:{'.validate':"$field.matches(/^(vote|note|at)$/)"}}},
   $field:{'.validate':"$field.matches(/^(version|updatedAt|items)$/)"}
  }
 }
};
const next=JSON.stringify(data,null,2)+'\n';if(process.argv.includes('--check')){if(await readFile(file,'utf8')!==next)throw Error('Run node scripts/update-question-review-rules.mjs');}else await writeFile(file,next);
