import {catalogAnswersReady,loadCatalogAnswers} from './question-bank-loader.js';
import {funAnswersReady,loadFunAnswers} from './fun-bank-loader.js';
export const questionDataReady=packs=>(!packs.some(p=>p.catalogVersion)||catalogAnswersReady())&&funAnswersReady(packs);
export async function loadQuestionData(packs){await Promise.all([packs.some(p=>p.catalogVersion)?loadCatalogAnswers():null,loadFunAnswers(packs)]);}
