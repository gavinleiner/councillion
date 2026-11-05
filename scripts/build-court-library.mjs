import fs from 'node:fs';
import assert from 'node:assert/strict';
const source=new URL('../data-snapshots/court-games/library-expansion.json',import.meta.url),target=new URL('../court-games-expansion-data.js',import.meta.url);
const data=JSON.parse(fs.readFileSync(source,'utf8'));
assert.equal(data.clash.length,160);assert.equal(data.figure.length,168);
const output='// Generated from the reviewed court library snapshot. Run scripts/build-court-library.mjs.\n'+
 'export const EXTRA_CLASH_BOARDS='+JSON.stringify(data.clash,null,1)+';\n'+
 'export const EXTRA_FIGURE_QUESTIONS='+JSON.stringify(data.figure,null,1)+';\n';
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(target,'utf8'),output,'Court library output is stale.');
else fs.writeFileSync(target,output);
console.log('Court library generated output matches 160 additional survey boards and 168 numerical questions.');
