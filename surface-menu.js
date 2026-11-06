const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function surfaceGames({day,dailyLabel,puffer}){
 const action=String(dailyLabel).replace(/[↗↓▼]/g,'').trim();
 return `<div class="surface-play-links"><button class="pixel-button home-party" data-action="party">${puffer}<span>PUFFER PARTY</span><small>WITH FRIENDS</small></button><div class="surface-court-links"><a href="#clash"><strong>COUNSEL CLASH</strong><small>TEAM FEUD</small></a><a href="#figure"><strong>FINAL FIGURE</strong><small>CLOSEST WINS</small></a><a href="#docket"><strong>THE DOCKET</strong><small>BUZZ & WAGER</small></a></div></div><button class="pixel-button primary surface-descent" data-action="daily"><span aria-hidden="true">▼</span>${esc(action)}<span aria-hidden="true">▼</span></button><div class="banner"><span>DAILY DIVE · ${esc(day)}</span><span id="reset-clock"></span></div>`;
}
