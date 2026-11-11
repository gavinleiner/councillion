// Gameplay tests model a returning visitor. The dedicated daily-support tests
// keep fresh storage and exercise the real first-visit screen instead.
const prepared=new WeakSet();
export async function returningVisitor(page){
 if(prepared.has(page))return;prepared.add(page);
 await page.addInitScript(()=>{
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const part=k=>parts.find(p=>p.type===k).value;
  localStorage.setItem('fc:support:visited-on',`${part('year')}-${part('month')}-${part('day')}`);
 });
}
