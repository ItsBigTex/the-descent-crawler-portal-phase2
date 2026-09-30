const STORAGE_KEY='descentPortalStateV1_10';
async function loadBase(){
 if(Array.isArray(window.CRAWLER_DATA)&&window.CRAWLER_DATA.length)return JSON.parse(JSON.stringify(window.CRAWLER_DATA));
 const r=await fetch('./data/crawlers.json',{cache:'no-store'});
 if(!r.ok)throw new Error(`Could not load crawler data (${r.status})`);
 const d=await r.json(); if(!Array.isArray(d)||!d.length)throw new Error('Crawler data contained no files'); return d;
}
function readState(){try{const s=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');return s&&Array.isArray(s.crawlers)&&s.crawlers.length?s:null}catch{return null}}
function saveState(s){localStorage.setItem(STORAGE_KEY,JSON.stringify(s))}
async function getState(){let s=readState();if(!s){s={crawlers:await loadBase(),feed:[]};saveState(s)}return s}
function modFor(stat){if(stat<=2)return 1;if(stat<=5)return 2;if(stat<=9)return 3;if(stat<=19)return 4;if(stat<=49)return 5;if(stat<=99)return 6;if(stat<=149)return 7;if(stat<=199)return 8;if(stat<=299)return 9;return 10}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function addFeed(state,text){state.feed.unshift({at:new Date().toLocaleString(),text});state.feed=state.feed.slice(0,100);saveState(state)}
function rollDie(sides){return Math.floor(Math.random()*sides)+1}
