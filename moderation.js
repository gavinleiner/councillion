// Keep these patterns shared with the generated Realtime Database validators.
// This is a conservative, local filter, not a claim to understand all language.
const repeated=word=>[...word].map(c=>c+'+').join('');
const severe=['nigger','nigga','faggot','retard','heilhitler','whitepower','whitesupremacy','fuck','asshole'];
const words=['fag','kike','spic','chink','tranny','nazi','cunt','bitch','shit','porn','rape','rapist','pedo','pedophile'];
export const SEVERE_PATTERN='.*('+severe.map(repeated).join('|')+').*';
export const WORD_PATTERN='('+words.map(repeated).join('|')+')';
export const NAME_FORMAT="[A-Za-z0-9][A-Za-z0-9 ._'\\-]*";
const severeRE=new RegExp('^'+SEVERE_PATTERN+'$'),wholeRE=new RegExp('^[0-9]*'+WORD_PATTERN+'[0-9]*$'),wordRE=new RegExp('(^|[ ._\\-\'])'+WORD_PATTERN+'($|[ ._\\-\'])'),formatRE=new RegExp('^'+NAME_FORMAT+'$');
const substitutions={'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','8':'b','6':'g','9':'g','@':'a','!':'i','$':'s','|':'i'};
const normalizeLanguage=value=>normalizedDisplayName(value).toLowerCase().replace(/[013457869@!$|]/g,c=>substitutions[c]);
const compact=value=>value.replace(/[ ._'\-]/g,'');
const lookalikes={'а':'a','ɑ':'a','α':'a','е':'e','ε':'e','і':'i','ı':'i','ι':'i','ӏ':'l','о':'o','ο':'o','р':'p','ρ':'p','с':'c','ϲ':'c','ѕ':'s','τ':'t','т':'t','υ':'u','ν':'v','х':'x','χ':'x','у':'y','к':'k','κ':'k','м':'m','н':'h','β':'b'};
export function normalizedDisplayName(value){return String(value??'').normalize('NFKD').replace(/[\u0300-\u036f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g,'').replace(/[^\x00-\x7f]/gu,c=>lookalikes[c.toLowerCase()]??c).replace(/\s+/g,' ').trim();}
export function containsBlockedLanguage(value){const normalized=normalizeLanguage(value),raw=normalizedDisplayName(value).toLowerCase();return severeRE.test(compact(normalized))||wholeRE.test(compact(normalized))||wordRE.test(normalized)||new RegExp('^[0-9]*'+WORD_PATTERN+'[0-9]*$').test(compact(raw));}
export function validateDisplayName(value){
 const name=normalizedDisplayName(value);
 if(!name)throw Error('Choose a display name first.');
 if(containsBlockedLanguage(name))throw Error('Choose a different name. Slurs and abusive names aren’t allowed.');
 if(name.length>16||!formatRE.test(name))throw Error('Use 1–16 letters or numbers, with spaces, periods, apostrophes, _ or - between them.');
 return name;
}
export function safeDisplayName(value){try{return validateDisplayName(value);}catch{return 'Counsel';}}
export function validateChat(value){const text=String(value??'').normalize('NFKC').trim().slice(0,160);if(containsBlockedLanguage(text))throw Error('Please keep court chat free of slurs and abuse.');return text;}
function ruleNormalized(path){let value=path+'.val().toLowerCase()';for(const [from,to]of Object.entries(substitutions))if(/[0-9]/.test(from))value+=`.replace('${from}', '${to}')`;return value;}
function ruleCompact(value){for(const from of [' ','.','_','-'])value+=`.replace('${from}', '')`;return value+`.replace("'", '')`;}
export function textValidationRule(path='newData'){
 const normalized=ruleNormalized(path),compactValue=ruleCompact(normalized),raw=ruleCompact(path+'.val().toLowerCase()');
 return `!${compactValue}.matches(/${SEVERE_PATTERN}/) && !${compactValue}.matches(/^[0-9]*${WORD_PATTERN}[0-9]*$/) && !(' ' + ${normalized} + ' ').matches(/.*[ ._'\\-]${WORD_PATTERN}[ ._'\\-].*/) && !${raw}.matches(/^[0-9]*${WORD_PATTERN}[0-9]*$/)`;
}
export function nameValidationRule(path='newData'){return `${path}.isString() && ${path}.val().length > 0 && ${path}.val().length <= 16 && ${path}.val().matches(/^${NAME_FORMAT}$/) && ${textValidationRule(path)}`;}
