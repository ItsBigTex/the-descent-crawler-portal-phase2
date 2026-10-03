const MODULE_ID='the-descent-bridge';
const API_PREFIX='/modules/the-descent-bridge/api';
const events=[]; let eventId=0;

function pushEvent(type,data={}) {
 const e={id:++eventId,type,data,created_at:new Date().toISOString()};
 events.push(e); if(events.length>200)events.splice(0,events.length-200);
 game.socket?.emit(`module.${MODULE_ID}`,{type:'bridge_event',event:e});
 return e;
}
function tokenOK(request){
 const expected=String(game.settings.get(MODULE_ID,'bridgeToken')||'');
 const got=String(request.headers.get('X-Descent-Bridge-Token')||'');
 return expected.length>=8 && got===expected;
}
function cors(headers=new Headers()){headers.set('Access-Control-Allow-Origin','*');headers.set('Access-Control-Allow-Headers','Content-Type, X-Descent-Bridge-Token');headers.set('Access-Control-Allow-Methods','GET, POST, OPTIONS');return headers}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:cors(new Headers({'Content-Type':'application/json'}))})}
async function handleCommand(action,payload){
 if(!game.user?.isGM)throw new Error('The active Foundry client is not a GM.');
 switch(action){
  case 'activate_scene': {
   const scene=game.scenes?.find(s=>s.name===payload.name);if(!scene)throw new Error(`Scene not found: ${payload.name}`);
   await scene.activate();ui.notifications.info(`The Descent: activated ${scene.name}`);pushEvent('scene_activated',{id:scene.id,name:scene.name});return {scene:scene.name};
  }
  case 'play_playlist': {
   const pl=game.playlists?.find(p=>p.name===payload.name);if(!pl)throw new Error(`Playlist not found: ${payload.name}`);
   await pl.playAll();ui.notifications.info(`The Descent: playing ${pl.name}`);pushEvent('playlist_started',{id:pl.id,name:pl.name});return {playlist:pl.name};
  }
  case 'system_announcement': {
   const text=String(payload.text||'').slice(0,2000);if(!text)throw new Error('Announcement is empty.');
   await ChatMessage.create({content:`<div class="descent-system-announcement"><b>THE SYSTEM</b><br>${foundry.utils.escapeHTML(text)}</div>`,speaker:{alias:'THE SYSTEM'}});
   ui.notifications.info('The Descent: System announcement received.');pushEvent('system_announcement',{text});return {announced:true};
  }
  case 'encounter': {
   const name=String(payload.name||'Encounter');ui.notifications.info(`The Descent encounter received: ${name}`);
   await ChatMessage.create({content:`<div class="descent-encounter"><b>THE DESCENT // ENCOUNTER</b><br>${foundry.utils.escapeHTML(name)}<br><small>Round ${Number(payload.round||1)} // ${foundry.utils.escapeHTML(String(payload.phase||''))}</small></div>`,speaker:{alias:'THE SYSTEM'}});
   pushEvent('encounter_received',{id:payload.id||null,name,round:payload.round||1,phase:payload.phase||''});return {encounter:name};
  }
  default: throw new Error(`Unsupported command: ${action}`);
 }
}

const FLOOR1_SCENES=[
 ['downtown','Downtown Brownwood — The Homecoming',4200,3000,'campaign-reconstruction'],
 ['bhs','Brownwood High School',4200,3000,'campaign-reconstruction'],
 ['coliseum','Brownwood Coliseum',3600,3600,'reference-derived'],
 ['jail','Brown County Lockup',3200,2600,'fictionalized-secure-interior'],
 ['rex',"Rex's Texas Lanes",4200,2600,'reference-derived'],
 ['weakley','Weakley-Watson Sporting Goods',3400,2600,'campaign-reconstruction'],
 ['stripes','Stripes — 601 W Commerce',3400,2600,'reference-derived'],
 ['stadium','Gordon Wood Stadium — Friday Night Forever',5000,3200,'reference-derived'],
 ['rr','R&R Cards and Games — 403 Fisk',4200,3000,'player-supplied-layout'],
 ['home','Home, Sweet Home?',3200,2400,'campaign-reconstruction']
];
async function descentFolder(name,type,key){
 let f=game.folders.find(x=>x.type===type&&x.getFlag(MODULE_ID,'key')===key);
 return f||Folder.create({name,type,flags:{[MODULE_ID]:{managed:true,key,phase:'4.4.1'}}});
}
async function initializeWorld(){
 if(!game.user?.isGM)throw new Error('GM permission required.');
 const folder=await descentFolder('THE DESCENT — FLOOR 1','Scene','floor1');
 const refs=await descentFolder('THE DESCENT — REFERENCE','JournalEntry','references');
 let created=0,updated=0;
 for(const [key,name,width,height,fidelity] of FLOOR1_SCENES){
  let scene=game.scenes.find(x=>x.getFlag(MODULE_ID,'key')===key);
  const flags={[MODULE_ID]:{managed:true,key,floor:1,fidelity,phase:'4.4.1'}};
  if(!scene){await Scene.create({name,width,height,grid:{type:1,size:100},folder:folder.id,navigation:false,flags});created++}
  else{await scene.update({folder:folder.id,flags});updated++}
 }
 let journal=game.journal.find(x=>x.getFlag(MODULE_ID,'key')==='floor1-reference');
 if(!journal)journal=await JournalEntry.create({name:'Floor 1 Reference Bible',folder:refs.id,flags:{[MODULE_ID]:{managed:true,key:'floor1-reference',phase:'4.4.1'}}});
 if(!journal.pages.find(x=>x.name==='Homecoming Reference'))await journal.createEmbeddedDocuments('JournalEntryPage',[{name:'Homecoming Reference',type:'text',text:{format:1,content:`<h1>Floor One — The Homecoming</h1><p><b>Reality Reference → Dungeon Reconstruction → System Corruption</b></p><p>R&amp;R uses the player-supplied layout. Brownwood High and Weakley-Watson are campaign reconstructions, not authentic floor plans. Brown County Lockup uses a fictionalized secure interior.</p>`}}]);
 pushEvent('world_initialized',{created,updated,total:FLOOR1_SCENES.length});
 ui.notifications.info(`The Descent initialized: ${created} created, ${updated} updated.`);
 return {created,updated,total:FLOOR1_SCENES.length,scenes:FLOOR1_SCENES.map(x=>x[1])};
}
async function initializeDialog(){
 const ok=await foundry.applications.api.DialogV2.confirm({window:{title:'Initialize The Descent World'},content:`<p>Create/update ${FLOOR1_SCENES.length} blank managed Floor 1 scenes?</p><p>This is safe to rerun and does not create map art, walls, tokens, or mechanics.</p>`,yes:{label:'Initialize Floor 1'},no:{label:'Cancel'}});
 if(ok)return initializeWorld();
}

Hooks.once('init',()=>{
 game.settings.register(MODULE_ID,'bridgeToken',{name:'Bridge Token',hint:'Local secret shared with The Descent Crawler Portal. Do not use your Foundry license key.',scope:'world',config:true,type:String,default:''});
 game.settings.register(MODULE_ID,'bridgeEnabled',{name:'Enable Local HTTP Bridge',hint:'Allows the local Crawler Portal to send GM-approved presentation commands to this Foundry world.',scope:'world',config:true,type:Boolean,default:false});
 game.settings.registerMenu(MODULE_ID,'initializer',{name:'Initialize The Descent World',label:'INITIALIZE FLOOR 1',hint:'Create/update the managed Homecoming scene structure.',icon:'fas fa-dungeon',type:class extends foundry.applications.api.ApplicationV2{render(){initializeDialog();return this}},restricted:true});
});
Hooks.once('ready',()=>{
 console.log('The Descent Bridge 0.4.4 ready.');
 game.socket?.on(`module.${MODULE_ID}`,msg=>{if(msg?.type==='bridge_event')Hooks.callAll('descentBridgeEvent',msg.event)});
 pushEvent('foundry_ready',{world:game.world?.title,version:game.version});
});

/*
 Foundry modules run in the browser, while the Foundry web server owns HTTP routes.
 Phase 4.4 therefore exposes a local bridge adapter contract below. If your Foundry
 host permits module route middleware, bind these handlers to API_PREFIX. The included
 portal UI and module command processor are already separated so 4.4 can be tested
 with Foundry socket/client integration before adding a host-side adapter.
*/
globalThis.TheDescentBridge={
 MODULE_ID,API_PREFIX,pushEvent,handleCommand,initializeWorld,initializeDialog,FLOOR1_SCENES,
 status:()=>({ok:true,foundry_version:game.version,world:game.world?.title||'',scene:canvas?.scene?.name||'',user:game.user?.name||'',is_gm:!!game.user?.isGM}),
 eventsAfter:(after=0)=>events.filter(e=>e.id>Number(after||0))
};
