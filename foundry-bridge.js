(()=>{
const KEY='descentFoundryBridgeV4_4';
const DEFAULT={enabled:false,bridgeUrl:'http://127.0.0.1:30000',token:'',pollMs:1500,lastEventId:0};
let timer=null;
function cfg(){try{return {...DEFAULT,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return {...DEFAULT}}}
function save(x){localStorage.setItem(KEY,JSON.stringify({...cfg(),...x}))}
function headers(){const c=cfg();return {'Content-Type':'application/json','X-Descent-Bridge-Token':c.token||''}}
async function request(path,options={}){
 const c=cfg(); if(!c.enabled) throw new Error('Foundry Bridge is disabled.');
 const url=c.bridgeUrl.replace(/\/$/,'')+'/modules/the-descent-bridge/api/'+path.replace(/^\//,'');
 const r=await fetch(url,{...options,headers:{...headers(),...(options.headers||{})}});
 const data=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(data.error||`Bridge HTTP ${r.status}`);
 return data
}
async function status(){return request('status')}
async function command(action,payload={}){return request('command',{method:'POST',body:JSON.stringify({action,payload,source:'crawler-portal',sent_at:new Date().toISOString()})})}
async function poll(){
 const c=cfg();if(!c.enabled)return;
 try{
  const data=await request(`events?after=${Number(c.lastEventId||0)}`);
  for(const e of (data.events||[])){save({lastEventId:Math.max(Number(cfg().lastEventId||0),Number(e.id||0))});window.dispatchEvent(new CustomEvent('descent-foundry-event',{detail:e}))}
  window.dispatchEvent(new CustomEvent('descent-foundry-status',{detail:{online:true,status:data.status}}));
 }catch(e){window.dispatchEvent(new CustomEvent('descent-foundry-status',{detail:{online:false,error:e.message}}))}
}
function start(){stop();if(!cfg().enabled)return;poll();timer=setInterval(poll,Math.max(750,Number(cfg().pollMs||1500)))}
function stop(){if(timer)clearInterval(timer);timer=null}
async function openSettings(){
 let m=document.querySelector('#foundryBridge44');if(!m){m=document.createElement('div');m.id='foundryBridge44';m.className='popupback';document.body.appendChild(m)}
 const c=cfg();
 m.innerHTML=`<div class="systempopup bridge44-panel"><div class="tag red">FOUNDRY BRIDGE // 4.4</div><h2>Local Bridge</h2>
 <label class="bridge44-row">ENABLED <input id="fbEnabled" type="checkbox" ${c.enabled?'checked':''}></label>
 <label class="bridge44-row">FOUNDRY URL <input id="fbUrl" value="${String(c.bridgeUrl).replace(/"/g,'&quot;')}"></label>
 <label class="bridge44-row">BRIDGE TOKEN <input id="fbToken" type="password" value="${String(c.token).replace(/"/g,'&quot;')}" placeholder="Set the same token in Foundry"></label>
 <div id="fbStatus" class="notice small">Not tested.</div><div class="controls"><button id="fbTest" class="primary">TEST CONNECTION</button><button id="fbSave">SAVE</button><button id="fbClose">CLOSE</button></div>
 <p class="muted small">The token is a local bridge secret, not your Foundry license key. Never enter your Foundry license key here.</p></div>`;
 m.classList.remove('hidden');
 m.querySelector('#fbSave').onclick=()=>{save({enabled:m.querySelector('#fbEnabled').checked,bridgeUrl:m.querySelector('#fbUrl').value.trim(),token:m.querySelector('#fbToken').value});start();m.querySelector('#fbStatus').textContent='Saved.'};
 m.querySelector('#fbTest').onclick=async()=>{save({enabled:true,bridgeUrl:m.querySelector('#fbUrl').value.trim(),token:m.querySelector('#fbToken').value});const el=m.querySelector('#fbStatus');el.textContent='Connecting…';try{const x=await status();el.innerHTML=`<b>ONLINE</b> // Foundry ${x.foundry_version||'?'} // ${x.world||'No world'} // ${x.scene||'No active scene'}`}catch(e){el.textContent='OFFLINE // '+e.message}};
 m.querySelector('#fbClose').onclick=()=>m.classList.add('hidden');
}
window.DescentFoundry={cfg,save,status,command,poll,start,stop,openSettings};
document.addEventListener('DOMContentLoaded',start);
})();