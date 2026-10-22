// A continuous vertical ocean. Scores keep the original 10 m per point;
// visual zones arrive earlier so ordinary dives pass several environments.
export const BIOMES = [
 {at:0,name:'SUNLIT WATERS',color:'#81dfe3'},
 {at:200,name:'THE TWILIGHT',color:'#80cbdc'},
 {at:650,name:'MIDNIGHT RUINS',color:'#9eade0'},
 {at:1500,name:'THE ABYSS',color:'#bc9ee3'},
 {at:3000,name:'HADAL DEPTHS',color:'#e0b87b'}
];
const STOPS=[[0,0],[200,.45],[650,1.35],[1500,2.7],[3000,4.3],[7000,7.8],[8000,8.6]];
export function depthDistance(depth,height){
 const d=Math.max(0,Math.min(8000,depth));
 for(let i=1;i<STOPS.length;i++)if(d<=STOPS[i][0]){
  const [a,x]=STOPS[i-1],[b,y]=STOPS[i];
  return (x+(y-x)*(d-a)/(b-a))*height;
 }
 return STOPS.at(-1)[1]*height;
}
export const worldAtDepth=(depth,height)=>height*.86+depthDistance(depth,height);
export const cameraAtDepth=(depth,height)=>worldAtDepth(depth,height)-height*.4;
export const depthScreenY=(depth,camera,height)=>worldAtDepth(depth,height)-camera;
export function biomeAt(depth){return [...BIOMES].reverse().find(b=>depth>=b.at)||BIOMES[0];}
export function sceneryBands(height){return [
 {key:'shallow',top:height*.48,bottom:worldAtDepth(220,height),color:'#1a4e70',opacity:1},
 {key:'mid',top:worldAtDepth(180,height),bottom:worldAtDepth(1550,height),color:'#102d49',opacity:.91},
 {key:'trench',top:worldAtDepth(1450,height),bottom:worldAtDepth(3100,height),color:'#10273b',opacity:.9},
 {key:'hadal',top:worldAtDepth(2950,height),bottom:worldAtDepth(8000,height)+height,color:'#171d37',opacity:.9}
 ];}
export const LANDMARKS=[
 {at:200,text:'LIGHT BEGINS TO FADE',side:0},
 {at:450,text:'THE LAST SUNBEAMS',side:1},
 {at:650,text:'MIDNIGHT RUINS',side:0},
 {at:1050,text:'THE SUNKEN COURT',side:1},
 {at:1500,text:'THE ABYSS',side:0},
 {at:2100,text:'LIFE IN THE DARK',side:1},
 {at:3000,text:'THE HADAL ZONE',side:0},
 {at:4300,text:'THE DEEP APPEAL',side:1},
 {at:6000,text:'ONE IN A COUNCILLION',side:0}
];
