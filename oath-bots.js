// Predictable local practice actors, not ranked opponents or an online AI service.
const broad={Games:['Winning','Friends','Levels'],Food:['Sharing','Hungry','Tasty'],Everyday:['Useful','Morning','Convenient'],Places:['Crowds','Weekends','Visiting'],Nature:['Outside','Wild','Nature'],Screen:['Adventure','Heroes','Funny']};
export function oathBotClue(question,impostor,index,round,lap=1){return impostor?broad[question.category][(index+round+lap-1)%3]:question.clues[(index+round+lap-1)%question.clues.length];}
export function oathBotVote(s,ref,id,index){const others=s.players.filter(p=>!p.spectator&&p.id!==id),suspect=others.find(p=>p.id===ref.impostor);return suspect&&s.round%3!==2&&(index+s.round)%4<2?suspect.id:others.filter(p=>p.id!==ref.impostor)[(index+s.round)%Math.max(1,others.length-1)]?.id??others[0].id;}
export function oathBotGuess(q,index,round){return (index+round)%2===0?q.answer:'Something else';}
