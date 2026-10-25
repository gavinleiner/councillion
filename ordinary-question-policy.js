import {REVIEWED_STANDARD_BUILD,REVIEWED_QUESTION_IDS} from './reviewed-question-standard.js';
// The saved Yes/No review is the standard. Neither generator flags, inventory
// size nor a familiar-looking template can silently admit another question.
export const ORDINARY_POLICY_BUILD=REVIEWED_STANDARD_BUILD;
export function ordinaryQuestionAllowed(pack){
 if(pack.ordinaryRetired)return false;
 if(['steam-tags','steam-any-tags'].includes(pack.predicate?.kind))return false;
 return REVIEWED_QUESTION_IDS.has(pack.id);
}
