const STORAGE_KEY='descentPortalStateV2_5';
let CLOUD={ready:false,profile:null,client:null,applying:false,channel:null};
function modFor(stat){if(stat<=2)return 1;if(stat<=5)return 2;if(stat<=9)return 3;if(stat<=19)return 4;if(stat<=49)return 5;if(stat<=99)return 6;if(stat<=149)return 7;if(stat<=199)return 8;if(stat<=299)return 9;return 10}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function rollDie(sides){return Math.floor(Math.random()*sides)+1}
function readState(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')}catch{return null}}
function localSave(s){localStorage.setItem(STORAGE_KEY,JSON.stringify(s))}
function showCloudStatus(msg,bad=false){let e=document.querySelector('#cloudStatus');if(!e){e=document.createElement('div');e.id='cloudStatus';e.style.cssText='position:fixed;right:12px;bottom:12px;z-index:9999;padding:8px 10px;border:1px solid #3a6;background:#080808;color:#ddd;font:12px monospace';document.body.appendChild(e)}e.textContent=msg;e.style.borderColor=bad?'#a33':'#3a6'}
function showLogin(){return new Promise(resolve=>{document.body.innerHTML=`<main class="shell"><section class="panel" style="max-width:460px;margin:12vh auto"><div class="tag red">DUNGEON ACCESS AUTHENTICATION</div><h1>IDENTIFY YOURSELF.</h1><p class="muted">Sign in with the account assigned by the GM.</p><div class="field"><label>Email</label><input id="loginEmail" type="email"></div><div class="field"><label>Password</label><input id="loginPassword" type="password"></div><button id="loginButton" class="primary">ENTER THE DUNGEON</button><p id="loginError" class="red system"></p></section></main>`;document.querySelector('#loginButton').onclick=async()=>{try{await DSCloud.signIn(document.querySelector('#loginEmail').value.trim(),document.querySelector('#loginPassword').value);location.reload()}catch(e){document.querySelector('#loginError').textContent=e.message}}})}
async function initCloud(){if(CLOUD.ready)return CLOUD;const init=await DSCloud.init();if(!init.configured)throw new Error('Supabase is not configured. Keep your configured js/supabase-config.js in the repository.');if(!DSCloud.user){await showLogin();return new Promise(()=>{})}CLOUD.client=DSCloud.client;CLOUD.profile=await DSCloud.profile();CLOUD.ready=true;showCloudStatus(`CLOUD LIVE // ${String(CLOUD.profile.role).toUpperCase()}`);return CLOUD}
async function getState(){await initCloud();let q=CLOUD.client.from('crawlers').select('id,data');if(CLOUD.profile.role!=='gm')q=q.eq('id',CLOUD.profile.crawler_id);const {data,error}=await q;if(error)throw error;const {data:feedRows,error:feedError}=await CLOUD.client.from('activity_feed').select('id,crawler_id,text,created_at').order('created_at',{ascending:false}).limit(100);if(feedError)console.warn('Feed load:',feedError.message);const {data:messageRows,error:messageError}=await CLOUD.client.from('private_messages').select('id,crawler_id,text,read,created_at').order('created_at',{ascending:false}).limit(200);if(messageError)console.warn('Message load:',messageError.message);let s={crawlers:(data||[]).map(r=>r.data),feed:(feedRows||[]).map(r=>({id:r.id,at:new Date(r.created_at).toLocaleString(),text:r.text}))};for(const c of s.crawlers){c.messages=(messageRows||[]).filter(m=>String(m.crawler_id)===String(c.id)).map(m=>({dbId:m.id,text:m.text,at:new Date(m.created_at).toLocaleString(),read:m.read}))}if(!s.crawlers.length)throw new Error('No crawler record is mapped to this account. Check public.profiles.crawler_id.');localSave(s);subscribeCloud();if(location.pathname.endsWith('/gm.html')&&CLOUD.profile.role!=='gm'){document.body.innerHTML='<main class="shell"><section class="panel"><h1>ACCESS DENIED</h1><p class="muted">GM authorization required.</p><a class="btn" href="./index.html">RETURN</a></section></main>';return new Promise(()=>{})}return s}
function saveState(s){localSave(s);if(!CLOUD.ready||CLOUD.applying)return;clearTimeout(window.__cloudSaveTimer);window.__cloudSaveTimer=setTimeout(async()=>{for(const c of s.crawlers||[]){const payload=JSON.parse(JSON.stringify(c));delete payload.messages;const {error}=await CLOUD.client.from('crawlers').update({data:payload,updated_at:new Date().toISOString()}).eq('id',c.id);if(error){console.error(error);showCloudStatus('CLOUD WRITE FAILED // '+error.message,true);return}}showCloudStatus('CLOUD SAVED // '+new Date().toLocaleTimeString())},120)}
async function saveCrawlerNow(c){
 if(!CLOUD.ready)throw new Error('Cloud is not ready.');
 const payload=JSON.parse(JSON.stringify(c));delete payload.messages;
 const {data,error}=await CLOUD.client.from('crawlers').update({data:payload,updated_at:new Date().toISOString()}).eq('id',c.id).select('id,data').single();
 if(error)throw error;if(!data)throw new Error('Supabase did not confirm the crawler update.');
 showCloudStatus('CLOUD SAVED // '+new Date().toLocaleTimeString());return data.data;
}
function addFeed(state,text){state.feed=state.feed||[];state.feed.unshift({at:new Date().toLocaleString(),text});state.feed=state.feed.slice(0,100);localSave(state);if(CLOUD.ready){const crawler=(state.crawlers||[]).find(c=>text.startsWith(c.name));CLOUD.client.from('activity_feed').insert({crawler_id:crawler?.id||null,text,visibility:'party'}).then(({error})=>{if(error)console.warn('Feed sync:',error.message)})}}
async function refreshPrivateMessages(){
 if(!CLOUD.ready)return;
 let q=CLOUD.client.from('private_messages').select('id,crawler_id,text,read,created_at').order('created_at',{ascending:false}).limit(200);
 if(CLOUD.profile.role!=='gm')q=q.eq('crawler_id',CLOUD.profile.crawler_id);
 const {data,error}=await q;if(error){showCloudStatus('MESSAGE SYNC FAILED // '+error.message,true);return}
 const st=readState()||{crawlers:[],feed:[]};let changed=false;
 for(const c of st.crawlers){const next=(data||[]).filter(m=>String(m.crawler_id)===String(c.id)).map(m=>({dbId:m.id,text:m.text,at:new Date(m.created_at).toLocaleString(),read:m.read}));if(JSON.stringify(c.messages||[])!==JSON.stringify(next)){c.messages=next;changed=true}}
 if(changed){localSave(st);window.dispatchEvent(new CustomEvent('descent-message-refresh'))}
}
function startMessageFallback(){if(window.__messagePoll)return;window.__messagePoll=setInterval(refreshPrivateMessages,2000)}
function subscribeCloud(){if(CLOUD.channel)return;CLOUD.channel=CLOUD.client.channel('crawler-sync-v2-2')
.on('postgres_changes',{event:'UPDATE',schema:'public',table:'crawlers'},p=>{const row=p.new;if(CLOUD.profile.role!=='gm'&&row.id!==CLOUD.profile.crawler_id)return;const st=readState()||{crawlers:[],feed:[]},i=st.crawlers.findIndex(c=>String(c.id)===String(row.id));if(i>=0){const keepMessages=st.crawlers[i].messages||[];st.crawlers[i]=row.data;st.crawlers[i].messages=keepMessages}else st.crawlers.push(row.data);CLOUD.applying=true;localSave(st);CLOUD.applying=false;showCloudStatus('LIVE UPDATE // '+new Date().toLocaleTimeString());window.dispatchEvent(new CustomEvent('descent-crawler-update',{detail:{id:row.id,data:row.data}}))})
.on('postgres_changes',{event:'INSERT',schema:'public',table:'activity_feed'},p=>{const row=p.new,st=readState()||{crawlers:[],feed:[]};st.feed=st.feed||[];if(!st.feed.some(x=>String(x.id)===String(row.id)))st.feed.unshift({id:row.id,at:new Date(row.created_at).toLocaleString(),text:row.text});st.feed=st.feed.slice(0,100);localSave(st);window.dispatchEvent(new CustomEvent('descent-feed-update',{detail:row}))})
.on('postgres_changes',{event:'INSERT',schema:'public',table:'private_messages'},p=>{const row=p.new;if(CLOUD.profile.role!=='gm'&&String(row.crawler_id)!==String(CLOUD.profile.crawler_id))return;const st=readState()||{crawlers:[],feed:[]},c=st.crawlers.find(x=>String(x.id)===String(row.crawler_id));if(c){c.messages=c.messages||[];if(!c.messages.some(m=>String(m.dbId)===String(row.id)))c.messages.unshift({dbId:row.id,text:row.text,at:new Date(row.created_at).toLocaleString(),read:row.read});localSave(st);window.dispatchEvent(new CustomEvent('descent-message-update',{detail:row}))}})
.on('postgres_changes',{event:'UPDATE',schema:'public',table:'private_messages'},p=>{const row=p.new,st=readState()||{crawlers:[],feed:[]},c=st.crawlers.find(x=>String(x.id)===String(row.crawler_id));if(c){const m=(c.messages||[]).find(x=>String(x.dbId)===String(row.id));if(m)m.read=row.read;localSave(st);window.dispatchEvent(new CustomEvent('descent-message-update',{detail:row}))}})
.subscribe();startMessageFallback()}
async function signOutDescent(){if(CLOUD.ready)await DSCloud.signOut();localStorage.removeItem(STORAGE_KEY);location.href='./index.html'}

async function sendPrivateSystemMessage(crawlerId,text){
 if(!CLOUD.ready)throw new Error('Cloud is not ready.');
 const {data,error}=await CLOUD.client.from('private_messages').insert({crawler_id:crawlerId,text,read:false}).select().single();
 if(error)throw error;return data;
}
async function markPrivateMessageRead(messageId){
 if(!CLOUD.ready||!messageId)throw new Error('Message is missing its database ID.');
 const {data,error}=await CLOUD.client.from('private_messages').update({read:true}).eq('id',messageId).select('id,read').single();
 if(error)throw error;
 if(!data||data.read!==true)throw new Error('Supabase did not confirm the acknowledgement.');
 await refreshPrivateMessages();
 return true;
}
