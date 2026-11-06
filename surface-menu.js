const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function surfaceGames({day,dailyLabel,puffer}){
 const action=String(dailyLabel).replace(/[↗↓▼]/g,'').trim();
 return `<div class="surface-play-links"><a class="pixel-button home-party surface-games-button" href="#games">${puffer}<span>PUFFER GAMES</span><small>CHOOSE<br>YOUR COURT →</small><i aria-hidden="true"></i></a><p class="surface-games-note">MULTIPLAYER · CHOOSE YOUR COURT</p></div><button class="pixel-button primary surface-descent" data-action="daily"><span aria-hidden="true">▼</span>${esc(action)}<span aria-hidden="true">▼</span></button><div class="banner"><span>DAILY DIVE · ${esc(day)}</span><span id="reset-clock"></span></div>`;
}
