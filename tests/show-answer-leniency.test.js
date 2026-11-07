import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveShowAnswer} from '../game-show-answer-matching.js';
import {resolveAnswer} from '../answer-matching.js';
import {DOCKET_BY_ID} from '../docket-data.js';
import {docketResponse} from '../docket-engine.js';
const pack=label=>({answers:[{label,aliases:[]}]});
test('ordinary misspellings and meaningful shortened answers are recognized in game shows',()=>{
 for(const [label,input]of [['Pit stop','pit'],['Pit stop','pit stoop'],['Restaurant','restraunt'],['Cemetery','cemetary'],['Hippopotamus','hippopotomus'],['Broccoli','brocolli'],['Harry Potter','hary poter'],['Albert Einstein','alber einsten'],['Albert Einstein','einstien'],['Christopher Columbus','cristopher colombus'],['Refrigerator','refridgerater'],['Michael Jordan','micheal jordon'],['Tyrannosaurus rex','tyranasaurus'],['Mediterranean Sea','mediteranian'],['Bureau of Investigation','beuro investigation'],['Alexander the Great','alexander']])assert.equal(resolveShowAnswer(pack(label),input).answer?.label,label,input);
 assert.equal(resolveShowAnswer(pack('Pit stop'),'pit').status,'exact','literal words do not need a typo confirmation');
 assert.equal(resolveShowAnswer(pack('Restaurant'),'restraunt').status,'matched','real typos still use after-submit confirmation');
});
test('the actual racing clue accepts pit and existing unrelated-word regressions stay rejected',()=>{
 const clue=[...DOCKET_BY_ID.values()].find(q=>q.answer.toLowerCase()==='pit stop');assert.ok(clue);assert.equal(docketResponse(clue,'pit').answer?.label,'Pit stop');
 for(const input of ['locals coffee','brown coffee','white coffee','zz','zzzz'])assert.equal(resolveShowAnswer(pack('Black coffee'),input).status,'missing',input);
 for(const input of ['it','pi','thing','stop'])assert.equal(resolveShowAnswer(pack('Pit stop'),input).status,'missing',input);
 assert.equal(resolveShowAnswer(pack('World War II'),'WWI').status,'missing');
 const ambiguous={answers:[{label:'Apple pie',aliases:[]},{label:'Apple juice',aliases:[]}]};assert.equal(resolveShowAnswer(ambiguous,'apple').status,'missing');
});
test('Puffer and Daily keep their separate matcher',()=>{
 assert.equal(resolveAnswer(pack('Minecraft'),'MC').status,'missing');
 assert.equal(resolveAnswer(pack('Black coffee'),'locals coffee').status,'missing');
});
