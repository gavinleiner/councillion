import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {loadCatalogAnswers} from '../question-bank-loader.js';
import {registerFunDataReader} from '../fun-bank-loader.js';
import '../data.js';
await loadCatalogAnswers();
registerFunDataReader(pack=>{const bytes=readFileSync(new URL('../question-banks/'+pack.answerFile,import.meta.url));return JSON.parse((pack.answerFile.endsWith('.gz')?gunzipSync(bytes):bytes).toString());});
