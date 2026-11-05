// Project one painted scene into a cover-fit viewport. Foreground occlusion uses
// the SAME full scene and transform, so the podium cannot look like a pasted prop.
const source={width:1672,height:941,tableY:536};
const outlines=[[[0,520],[422,520],[445,534],[445,557],[429,559],[429,668],[464,668],[464,707],[0,746]],[[1240,520],[1672,520],[1672,746],[1194,707],[1194,668],[1248,668],[1248,559],[1227,557],[1227,534]]];
// Five permanent places on each shared podium. Captains occupy the end nearest
// the face-off, and joining/leaving a room never re-centres everyone else's seat.
export function courtBenchSeats(players,team){const crew=players.filter(p=>!p.spectator&&p.team===team);return Array.from({length:5},(_,place)=>({place,player:crew[team===0?4-place:place]??null}));}
export function courtStageGeometry(width,height){const scale=Math.max(width/source.width,height/source.height),x=(width-source.width*scale)/2,y=(height-source.height*scale)/2;return {scale,x,y,tableY:y+source.tableY*scale,fronts:outlines.map(points=>points.map(([px,py])=>[x+px*scale,y+py*scale]))};}
export function alignCourtPodiums(arena,stage){const r=arena.getBoundingClientRect(),s=stage.getBoundingClientRect(),g=courtStageGeometry(r.width,r.height);stage.style.setProperty('--podium-y',(g.tableY-s.y+r.y)+'px');stage.querySelectorAll('[data-podium-front]').forEach(el=>{const points=g.fronts[Number(el.dataset.podiumFront)];el.style.clipPath='polygon('+points.map(([x,y])=>(x+r.x)+'px '+(y+r.y)+'px').join(',')+')';});return g;}
