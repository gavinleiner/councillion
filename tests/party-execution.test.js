import test from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {PufferExecution} from '../party-execution.js';
const w=new Window();globalThis.document=w.document;
function fixture(){document.body.innerHTML='<section><div data-player="a"><strong><span class="player-display-name">Gavin</span></strong><div class="player-buddy"><img src="assets/counsel-krill.svg"></div></div></section>';return new PufferExecution(document.querySelector('section'));}
test('the puffer attack announces the actual player, shows exactly one heart, and never repeats on a snapshot',()=>{
 const fx=fixture(),e={id:'game:a:1',player:'a',at:1000};fx.render([e],1000);fx.render([e],1100);assert.equal(document.querySelectorAll('.puffer-sentence').length,1);assert.equal(document.querySelector('.sentence-caption b').textContent,'Gavin tried to cheat');assert.equal(document.querySelector('.sentence-heart small').textContent,'−1');assert.ok(document.querySelector('.bailiff-puffer img'));assert.equal(document.querySelectorAll('.sentence-blood i').length,15);assert.equal(document.querySelector('.sentence-impact'),null);assert.ok(document.querySelector('.sentence-wound'));assert.ok(document.querySelector('.sentenced-buddy img'));assert.ok(document.querySelector('[data-player]').classList.contains('puffer-sentenced'));fx.destroy();assert.equal(document.querySelector('.puffer-sentence'),null);assert.equal(document.querySelector('[data-player]').classList.contains('puffer-sentenced'),false);
});
test('stale events do not replay after reopening and reduced motion retains a readable verdict',()=>{
 const fx=fixture();fx.render([{id:'old',player:'a',at:1000}],12000);assert.equal(document.querySelector('.puffer-sentence'),null);document.body.classList.add('reduced');fx.render([{id:'new',player:'a',at:12000}],12000);assert.ok(document.querySelector('.reduced-sentence'));assert.match(document.querySelector('.sentence-caption').textContent,/−1 ♥/);fx.destroy();document.body.classList.remove('reduced');
});
test('the sentenced player sees their own deferred attack on return even after a long hidden interval',()=>{
 const fx=fixture();fx.myId=()=> 'a';fx.clock=()=>50000;
 Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true});fx.render([{id:'away',player:'a',at:1000}],1000);assert.equal(document.querySelector('.puffer-sentence'),null);
 Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true});document.dispatchEvent(new w.Event('visibilitychange'));assert.equal(document.querySelectorAll('.puffer-sentence').length,1);document.dispatchEvent(new w.Event('visibilitychange'));assert.equal(document.querySelectorAll('.puffer-sentence').length,1);fx.destroy();
});
