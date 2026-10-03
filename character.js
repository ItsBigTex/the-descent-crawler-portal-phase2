window.DESCENT_CRAWLER_BUILD='3.7.7';

(async()=>{
 const state=await getState();
 const id=new URLSearchParams(location.search).get('id');
 const c=state.crawlers.find(x=>x.id===id)||state.crawlers[0];
 if(c.pendingStatPoints==null)c.pendingStatPoints=0;
 const STAT_KEYS=['STR','INT','CON','DEX','CHA'];
 if(!c.statsUnenhanced)c.statsUnenhanced=JSON.parse(JSON.stringify(c.stats||{}));
 if(!c.startingStatsUnenhanced)c.startingStatsUnenhanced=JSON.parse(JSON.stringify(c.startingStats||c.statsUnenhanced));
 if(!c.statEnhancements)c.statEnhancements={STR:0,INT:0,CON:0,DEX:0,CHA:0};
 function gearStatModifiers(){const out={STR:0,INT:0,CON:0,DEX:0,CHA:0};for(const iid of equippedItemIds()){const x=itemById(iid);const mods=x?.mechanics?.stat_modifiers||x?.snapshot?.mechanics?.stat_modifiers||{};for(const k of STAT_KEYS)out[k]+=Number(mods[k]||0)}return out}
 function syncEnhancedStats(){c.stats=c.stats||{};const gear=gearStatModifiers();for(const k of STAT_KEYS)c.stats[k]=Math.max(1,Number(c.statsUnenhanced[k]||1)+Number(c.statEnhancements[k]||0)+Number(gear[k]||0));c.gearStatModifiers=gear}
 syncEnhancedStats();
 c.maxMana=Math.max(0,Number(c.stats.INT||0));
 if(c.mana==null)c.mana=Number(c.maxMana); else c.mana=Math.max(0,Math.min(Number(c.mana||0),c.maxMana));
 c.inventory=(c.inventory||[]).map((x,i)=>typeof x==='string'?{id:`legacy_item_${i}_${Date.now()}`,name:x,category:'Other',type:'Item',qty:1,effect:'',gearSlot:''}:{id:x.id||`item_${i}_${Date.now()}`,...x,category:x.category||(/consumable|potion|food|scroll/i.test(x.type||'')?'Consumable':(/gear|equipment|armor|weapon/i.test(x.type||'')?'Equipment':'Other')),effect:x.effect||'',gearSlot:x.gearSlot||''});
 c.spells=(c.spells||[]).map(x=>typeof x==='string'?{name:x,distance:'',attribute:'INT',rank:1,effect:'',damage:'',manaCost:0}:{...x,manaCost:Number(x.manaCost||0)});
 if(c.notes==null)c.notes='';
 c.lootBoxes=c.lootBoxes||[];
 if(c.healthSlotsRemaining==null){const oldMax=Math.max(1,Number(c.maxHp||1)),oldHp=Math.max(0,Number(c.hp??oldMax));c.healthSlotsRemaining=Math.max(0,Math.min(10,Math.ceil((oldHp/oldMax)*10)))}
 c.hotlist=Array.isArray(c.hotlist)?c.hotlist.slice(0,10):[];while(c.hotlist.length<10)c.hotlist.push(null);
 if(!c.equipmentSlots)c.equipmentSlots={Head:null,Torso:null,Arms:null,Legs:null,Feet:null,HandsGloves:null,LeftHand:null,RightHand:null,Accessories:Array(10).fill(null)};
 if(!Array.isArray(c.equipmentSlots.Accessories))c.equipmentSlots.Accessories=Array(10).fill(null);
 while(c.equipmentSlots.Accessories.length<10)c.equipmentSlots.Accessories.push(null);
 if(!c.rawMigration31){
   for(const g of (c.equipment||[])){const obj=typeof g==='string'?{name:g}:{...g};if(!c.inventory.some(x=>String(x.name).toLowerCase()===String(obj.name||'').toLowerCase()))c.inventory.push({id:`legacy_gear_${Date.now()}_${Math.random().toString(36).slice(2)}`,name:obj.name||'Legacy Gear',category:'Equipment',type:obj.type||'Gear',qty:1,effect:obj.effect||'',gearSlot:'',legacyEquipment:true})}
   c.equipment=[];c.rawMigration31=true;
 }
 const RAW_GEAR_SLOTS=['Head','Torso','Arms','Hands/Holding','Legs','Feet','Accessories'];
 function itemById(id){return c.inventory.find(x=>String(x.id)===String(id))}
 function equippedItemIds(){const s=c.equipmentSlots||{},ids=[s.Head,s.Torso,s.Arms,s.Legs,s.Feet,s.HandsGloves,s.LeftHand,s.RightHand,...(s.Accessories||[])];return new Set(ids.filter(Boolean).map(String))}
 function isEquipped(id){return equippedItemIds().has(String(id))}

 if(c.level==null)c.level=1;
 if(c.dying==null)c.dying=false;if(c.dyingRoundsRemaining==null)c.dyingRoundsRemaining=null;
 let activeEncounter=null,activeEncounterChannel=null,partyMessages=[],partyMessageChannel=null;
 function rawConMod(){return modFor(Number(c.stats.CON||1))}
 function applyDamage(amount){
   amount=Math.max(0,Number(amount)||0);const dr=Math.max(0,Number(c.dr||c.damageResistance||0));const after=Math.max(0,amount-dr),slot=Math.max(1,rawConMod());
   const lost=after<slot?0:Math.min(c.healthSlotsRemaining,Math.ceil(after/slot));
   c.healthSlotsRemaining=Math.max(0,c.healthSlotsRemaining-lost);
   if(c.healthSlotsRemaining===0&&!c.dying){c.dying=true;c.dyingRoundsRemaining=Math.max(1,rawConMod());queueSystemNotification('DYING','0% HEALTH BAR',`You cannot take Actions, Move, speak, or use the HUD. ${c.dyingRoundsRemaining} Dying rounds remain.`)}
   addFeed(state,`${c.name} took ${amount} damage${dr?` (${dr} DR → ${after})`:''}; ${lost} Health Bar slot${lost===1?'':'s'} lost (${c.healthSlotsRemaining}/10).`);persist();render();
 }
 function healSlots(n,source='healing'){n=Math.max(0,Number(n)||0);const before=c.healthSlotsRemaining;c.healthSlotsRemaining=Math.min(10,before+n);if(c.healthSlotsRemaining>0&&c.dying){c.dying=false;c.dyingRoundsRemaining=null;queueSystemNotification('STABILIZED','HEALTH RESTORED','Dying removed.')}addFeed(state,`${c.name} restored ${c.healthSlotsRemaining-before} Health Bar slot(s) via ${source}.`);persist();render()}
 async function initEncounterHud(){try{activeEncounter=await DSCloud.activeEncounter();activeEncounterChannel=DSCloud.subscribeActiveEncounter(async()=>{activeEncounter=await DSCloud.activeEncounter();render()})}catch(e){console.warn('Encounter HUD:',e.message)}}
 async function initPartyComms(){try{
   partyMessages=await DSCloud.partyMessages(100);
   partyMessageChannel=DSCloud.subscribePartyMessages(row=>{
     partyMessages.unshift(row);
     if(tab==='comms')renderView();
   })
 }catch(e){console.warn('Party comms unavailable (run Phase 3.7 migration):',e.message)}}

 let knownAchievementKeys=new Set((c.achievements||[]).map(x=>`${x.name}|${x.reward||''}`)),knownQuestKeys=new Set((c.quests||[]).map(x=>`${x.name}|${x.detail||''}`)),knownLootKeys=new Set((c.lootBoxes||[]).map(x=>`${x.id||''}|${x.name}`));
 let notificationQueue=[],notificationShowing=false,seenSystemEvents=new Set(),systemEventChannel=null;
 function queueSystemNotification(kind,title,body='',meta={}){notificationQueue.push({kind,title,body,...meta});showNextNotification()}
 function eventLabel(type){return ({achievement:'NEW ACHIEVEMENT!',quest_received:'NEW QUEST!',quest_updated:'QUEST UPDATED!',quest_completed:'QUEST COMPLETE!',quest_failed:'QUEST FAILED!',loot_box_received:'LOOT BOX RECEIVED!',system_announcement:'SYSTEM ANNOUNCEMENT',private_message:'SYSTEM MESSAGE',level_gained:'LEVEL GAINED!',floor_changed:'FLOOR UPDATE',health_warning:'HEALTH WARNING',mana_warning:'MANA WARNING',item_received:'ITEM RECEIVED!'})[type]||'SYSTEM NOTIFICATION'}
 async function dismissCurrentNotification(n,pop,ack){
   if(!notificationShowing)return;
   ack.disabled=true;
   try{
     if(n?.event_id&&n.acknowledgement_required!==false)await DSCloud.acknowledgeSystemEvent(n.event_id);
   }catch(e){
     ack.disabled=false;
     alert('System event acknowledgement failed: '+e.message);
     return;
   }
   pop.classList.add('hidden');
   notificationShowing=false;
   ack.disabled=false;
   showNextNotification();
 }
 async function showNextNotification(){
   if(notificationShowing||!notificationQueue.length)return;
   const n=notificationQueue.shift(),pop=document.querySelector('#eventPopup'),kind=document.querySelector('#eventKind'),title=document.querySelector('#eventTitle'),body=document.querySelector('#eventBody'),ack=document.querySelector('#eventAck');
   if(!pop||!kind||!title||!body||!ack){notificationQueue.unshift(n);return}
   notificationShowing=true;
   pop._descentNotification=n;
   pop.dataset.priority=n.priority||'normal';
   pop.dataset.presentation=n.presentation||'popup';
   kind.textContent=n.kind;title.textContent=n.title;body.textContent=n.body||'';
   ack.textContent=n.acknowledgement_required===false?'DISMISS':'ACKNOWLEDGE';
   ack.disabled=false;
   pop.classList.remove('hidden');
   window.DescentAudio?.narrateEvent(n);
   if(n.presentation==='banner'&&n.acknowledgement_required===false){
     clearTimeout(pop._descentAutoDismiss);
     pop._descentAutoDismiss=setTimeout(()=>{if(!pop.classList.contains('hidden')&&pop._descentNotification===n)dismissCurrentNotification(n,pop,ack)},8000);
   }
 }
 function ingestSystemEvent(row){
   if(!row||seenSystemEvents.has(String(row.id))||row.status==='acknowledged'||row.status==='recorded'||row.event_type==='content_created')return;
   const d=row.data||row,type=d.event_type||row.event_type,relatedId=d.related_object_id||row.related_object_id,title=d.title||row.name||'SYSTEM EVENT';
   if(type==='quest_received'){
     const stillAssigned=(c.quests||[]).some(q=>(relatedId&&String(q.definition_id||q.id)===String(relatedId))||String(q.name||'')===String(title));
     if(!stillAssigned){
       seenSystemEvents.add(String(row.id));
       if(row.id)DSCloud.acknowledgeSystemEvent(row.id).catch(()=>{});
       return;
     }
   }
   seenSystemEvents.add(String(row.id));
   queueSystemNotification(eventLabel(type),title,d.body||'',{event_id:row.id,priority:d.priority||row.priority||'normal',presentation:d.presentation||row.presentation||'popup',acknowledgement_required:d.acknowledgement_required!==false})
 }
 async function initSystemEvents(){if(!DSCloud.client||!c?.id)return;try{const rows=await DSCloud.systemEvents(c.id,50);for(const row of rows)ingestSystemEvent(row);systemEventChannel=DSCloud.subscribeSystemEvents(c.id,row=>ingestSystemEvent(row))}catch(e){console.warn('System Event sync:',e.message)}}
 function detectNewCrawlerEvents(fresh){for(const a of fresh.achievements||[]){const k=`${a.name}|${a.reward||''}`;if(!knownAchievementKeys.has(k)){knownAchievementKeys.add(k);queueSystemNotification('NEW ACHIEVEMENT!',a.name,a.reward||'Reward classification pending.')}}for(const q of fresh.quests||[]){const k=`${q.name}|${q.detail||''}`;if(!knownQuestKeys.has(k)){knownQuestKeys.add(k);queueSystemNotification('NEW QUEST!',q.name,q.detail||'No additional briefing supplied.')}}for(const b of fresh.lootBoxes||[]){const k=`${b.id||''}|${b.name}`;if(!knownLootKeys.has(k)){knownLootKeys.add(k);queueSystemNotification('NEW LOOT BOX!',b.name,'A reward has been delivered to your Loot tab. The System recommends opening it before somebody else develops character growth.')}}}
 c.messages=c.messages||[];
 async function refreshSystemPopup(){
   const pop=document.querySelector('#systemPopup'),txt=document.querySelector('#popupText'),ack=document.querySelector('#popupAck');
   if(!pop||!txt||!ack)return;
   const unread=(c.messages||[]).find(m=>!m.read);
   if(!unread){pop.classList.add('hidden');return}
   txt.textContent=unread.text;pop.classList.remove('hidden');ack.disabled=false;ack.textContent='ACKNOWLEDGE';
   ack.onclick=async()=>{ack.disabled=true;ack.textContent='ACKNOWLEDGING...';try{await markPrivateMessageRead(unread.dbId);unread.read=true;pop.classList.add('hidden');render()}catch(e){ack.disabled=false;ack.textContent='ACKNOWLEDGE';alert('Acknowledgement failed: '+e.message)}};
 }
 document.addEventListener('click',e=>{
   const ack=e.target.closest?.('#eventAck');
   if(!ack)return;
   e.preventDefault();e.stopPropagation();
   const pop=document.querySelector('#eventPopup'),n=pop?._descentNotification;
   if(pop&&n)dismissCurrentNotification(n,pop,ack);
 },true);

 // Clean up legacy duplicate NEW QUEST private messages created by older reward deployment.
 // If the quest is no longer assigned, mark that old private message read before showing popups.
 for(const m of (c.messages||[])){
   if(m.read||!m.dbId)continue;
   const match=String(m.text||'').match(/^NEW QUEST!\s*\/\/\s*(.+?)(?:\n|$)/i);
   if(!match)continue;
   const questName=match[1].trim();
   const stillAssigned=(c.quests||[]).some(q=>String(q.name||'').trim()===questName);
   if(!stillAssigned){
     try{await markPrivateMessageRead(m.dbId);m.read=true}catch(e){console.warn('Legacy quest message cleanup:',e.message)}
   }
 }
 refreshSystemPopup();
 await initSystemEvents();
 await initEncounterHud();
 await initPartyComms();
 let tab='character';
 const app=document.querySelector('#app');
 window.addEventListener('descent-crawler-update',e=>{if(String(e.detail.id)!==String(c.id))return;const fresh=e.detail.data||{};detectNewCrawlerEvents(fresh);const keepMessages=c.messages||[];for(const k of Object.keys(c))delete c[k];Object.assign(c,fresh);c.messages=keepMessages;render();showNextNotification()});
 window.addEventListener('descent-message-update',()=>{const fresh=readState(),fc=(fresh?.crawlers||[]).find(x=>String(x.id)===String(c.id));if(fc){c.messages=fc.messages||[];render();refreshSystemPopup()}});
 window.addEventListener('descent-message-refresh',()=>{const fresh=readState(),fc=(fresh?.crawlers||[]).find(x=>String(x.id)===String(c.id));if(fc){c.messages=fc.messages||[];render();refreshSystemPopup()}});

 function showDiceRoll(label,base,bonus,total,detail='',sides=20,rolls=null){
   const values=Array.isArray(rolls)&&rolls.length?rolls:[base];
   if(window.DescentDice){window.DescentDice.roll({rolls:values,sides,label,bonus,total,detail});return}
   const overlay=document.querySelector('#diceOverlay'),die=document.querySelector('#dice3d'),lab=document.querySelector('#diceRollLabel'),det=document.querySelector('#diceRollDetail'),tot=document.querySelector('#diceRollTotal'),flavor=document.querySelector('#diceRollFlavor'),close=document.querySelector('#diceRollClose');
   if(!overlay)return;lab.textContent=label||'SYSTEM DICE';die.textContent=base;det.textContent=detail||`d${sides} ${base}${bonus?` + ${bonus}`:''}`;tot.textContent=total;flavor.textContent=base===20&&sides===20?'NATURAL 20. THE SYSTEM IS MILDLY IMPRESSED.':base===1&&sides===20?'NATURAL 1. ENTERTAINING.':'';overlay.classList.remove('hidden');close.onclick=()=>overlay.classList.add('hidden');
 }
 function doDice(qty,sides){
   qty=Math.max(1,Math.min(100,Number(qty)||1));sides=Math.max(2,Number(sides)||20);
   const rolls=Array.from({length:qty},()=>rollDie(sides)),total=rolls.reduce((a,b)=>a+b,0);
   const totalEl=document.querySelector('#rolltotal'),detailEl=document.querySelector('#rolldetail');
   if(totalEl)totalEl.textContent=total;if(detailEl)detailEl.textContent=`${qty}d${sides}: [${rolls.join(', ')}]`;
   addFeed(state,`${c.name} rolled ${qty}d${sides}: [${rolls.join(', ')}] = ${total}.`);
   showDiceRoll(`${qty}d${sides}`,rolls[0],0,total,`${qty}d${sides}: [${rolls.join(', ')}]`,sides,rolls);
 }
 function skillBonus(s){const rank=Number(s[1]||0),stat=s[2];return rank+(c.stats[stat]?modFor(c.stats[stat]):0)}
 function persist(){saveState(state)}
 function render(){
  syncEnhancedStats();
  c.maxMana=Math.max(0,Number(c.stats.INT||0));
  c.mana=Math.max(0,Math.min(Number(c.mana||0),c.maxMana));
  c.healthSlotsRemaining=Math.max(0,Math.min(10,Number(c.healthSlotsRemaining||0)));
  const conMod=modFor(Number(c.stats.CON||0)),rawHealthTotal=conMod*10;
  c.maxHp=rawHealthTotal;c.hp=c.healthSlotsRemaining*conMod;
  const hpPct=c.healthSlotsRemaining*10;
  const actionCount=activeEncounter?.phase==='crawlers'?Number(activeEncounter.actions_remaining?.[c.id]??2):null;
  const manaPct=c.maxMana?Math.max(0,Math.min(100,c.mana/c.maxMana*100)):0;
  const healthSegments=Array.from({length:10},(_,i)=>`<i class="${i<c.healthSlotsRemaining?'filled':'empty'}" title="${(i+1)*10}%"></i>`).join('');
  app.innerHTML=`<section class="p3-identity"><div class="p3-portrait" data-initial="${esc((c.name||'?').slice(0,1).toUpperCase())}"></div><div class="p3-profile"><div class="tag">AUTHORIZED CRAWLER // ${esc(c.id.toUpperCase())}</div><h1>${esc(c.name)}</h1><div class="p3-title">${esc(c.systemTitle)}</div><div class="controls" style="margin-top:20px">${c.pendingStatPoints?`<span class="pill amber">${c.pendingStatPoints} BANKED STAT PTS</span>`:''}<span class="pill">RAW HUD v2</span>${c.dying?`<span class="pill amber">DYING // ${c.dyingRoundsRemaining} ROUNDS</span>`:""}${actionCount!=null?`<span class="pill">${actionCount}/2 ACTIONS</span>`:""}</div><div class="muted small" style="margin-top:16px">${esc(c.derivedStatus||'Dungeon System crawler record active.')}</div></div><div class="p3-vitals"><div class="p3-vital p3-hp"><div class="p3-vital-top"><span>HEALTH BAR</span><span>${c.healthSlotsRemaining}/10 SLOTS // ${c.hp}/${c.maxHp}</span></div><div class="p31-healthbar">${healthSegments}</div><div class="p3-vital-controls"><button id="hurt" title="Lose one Health Bar slot">− SLOT</button><b>${hpPct}%</b><button id="heal" title="Restore one Health Bar slot">+ SLOT</button></div><div class="muted small">Each slot threshold: ${conMod} damage // Total Health ${rawHealthTotal}</div><div class="controls" style="margin-top:8px"><input id="damageAmount" type="number" min="0" placeholder="Incoming damage" style="max-width:150px"><button id="applyDamage">APPLY RAW DAMAGE</button><button id="castHeal" ${c.mana<2||c.healthSlotsRemaining>=10?'disabled':''}>HEAL // 2 MANA</button></div></div><div class="p3-vital p3-mana"><div class="p3-vital-top"><span>MANA</span><span>${c.mana} / ${c.maxMana}</span></div><div class="p3-meter"><i style="width:${manaPct}%"></i></div><div class="p3-vital-controls"><button id="manaDown">−</button><b>${c.mana}</b><button id="manaUp">+</button></div><div class="muted small">Max Mana = Enhanced Intelligence (${c.stats.INT})</div></div><div class="p3-vital p3-progress"><div class="p3-progress-row"><span>LEVEL</span><div><button id="levelDown">−</button><b>${c.level}</b><button id="levelUp">+</button></div></div><div class="p3-progress-row"><span>FLOOR</span><div><button id="floorDown">−</button><b>${c.floor}</b><button id="floorUp">+</button></div></div><div class="muted small" style="margin-top:8px">${Number(c.floor)>=3?'STAT ALLOCATION ONLINE':'STAT ALLOCATION LOCKED'}</div></div></div></section><section class="p3-sheet"><aside class="p3-sidebar">${STAT_KEYS.map(k=>{const u=Number(c.statsUnenhanced[k]||0),e=Number(c.stats[k]||0),enh=e!==u;return `<div class="p3-stat"><button class="p3-stat-roll" data-rollstat="${k}" title="Roll ${k}"><span class="p3-stat-key">${k}</span><span class="p3-stat-score">UNENH ${u}${enh?` // ENH ${e}`:''}</span><span class="p3-stat-mod">+${modFor(e)}<small>MOD</small></span></button>${Number(c.floor)>=3?`<div class="p3-stat-allocate"><button data-statminus="${k}" ${u<=Number(c.startingStatsUnenhanced?.[k]??u)?'disabled':''}>−</button><span>${u}</span><button data-stat="${k}" ${c.pendingStatPoints<=0?'disabled':''}>+</button></div>`:''}</div>`}).join('')}${c.pendingStatPoints>0?`<div class="notice p3-bank"><b>${c.pendingStatPoints}</b> BANKED<br><span class="small">${Number(c.floor)<3?'LOCKED UNTIL FLOOR 3':'AVAILABLE IN SAFEROOM / GM APPROVAL'}</span></div>`:''}</aside><div class="p3-main"><nav class="tabs">${['character','actions','skills','spells','hotlist','inventory','equipment','loot','quests','achievements','comms','dice'].map(t=>`<button data-tab="${t}" class="${tab===t?'active':''}">${t.toUpperCase()}</button>`).join('')}</nav><section id="view" class="panel"></section></div></section>`;
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;render()});
  document.querySelectorAll('[data-stat]').forEach(b=>b.onclick=()=>{if(c.pendingStatPoints>0){const k=b.dataset.stat;c.statsUnenhanced[k]=Number(c.statsUnenhanced[k]||0)+1;c.pendingStatPoints--;syncEnhancedStats();persist();addFeed(state,`${c.name} increased Unenhanced ${k} to ${c.statsUnenhanced[k]}.`);render()}});
  document.querySelectorAll('[data-statminus]').forEach(b=>b.onclick=()=>{const k=b.dataset.statminus,start=Number(c.startingStatsUnenhanced?.[k]??c.statsUnenhanced[k]);if(Number(c.statsUnenhanced[k])>start){c.statsUnenhanced[k]--;c.pendingStatPoints++;syncEnhancedStats();persist();addFeed(state,`${c.name} returned 1 assigned ${k} point to the bank (${c.pendingStatPoints} available).`);render()}});
  document.querySelectorAll('[data-rollstat]').forEach(b=>b.onclick=()=>{const stat=b.dataset.rollstat,base=rollDie(20),bonus=modFor(Number(c.stats[stat]||0)),total=base+bonus;addFeed(state,`${c.name} — ${stat} check: d20 ${base} + ${bonus} = ${total}.`);showDiceRoll(`${stat} CHECK`,base,bonus,total)});
  renderView()
 }
 function renderView(){
  const v=document.querySelector('#view');
  if(tab==='character')v.innerHTML=`<h2>Character File</h2><div class="notice">${esc(c.derivedStatus||'')}</div><div class="p31-rulegrid"><div><span class="tag">HEALTH</span><b>${c.healthSlotsRemaining}/10 slots</b><small>${c.hp}/${c.maxHp} total Health representation</small></div><div><span class="tag">MANA</span><b>${c.mana}/${c.maxMana}</b><small>Maximum = Enhanced Intelligence</small></div><div><span class="tag">EVADE</span><b>DEX MOD +${modFor(Number(c.stats.DEX||0))}</b><small>Additional buffs are not yet automated</small></div><div><span class="tag">GEAR</span><b>${equippedItemIds().size} equipped</b><small>Only equipped gear grants structured bonuses // ${STAT_KEYS.map(k=>`${k} ${Number(c.gearStatModifiers?.[k]||0)>=0?'+':''}${Number(c.gearStatModifiers?.[k]||0)}`).join(' / ')}</small></div></div><div class="field" style="margin:12px 0"><label>GM Notes</label><textarea id="gmNotes" rows="5" placeholder="GM notes for this crawler...">${esc(c.notes||'')}</textarea></div><div class="notice"><b>RAW STAT MODEL</b><br>Unenhanced = permanent/base progression. Enhanced = Unenhanced + gear/spell/buff effects. Stat Mods are derived from Enhanced values.</div>`;
  if(tab==='actions')v.innerHTML=`<h2>Actions</h2><div class="notice">${activeEncounter?`ROUND ${activeEncounter.round} // ${String(activeEncounter.phase||'').toUpperCase()} PHASE // ${actionCount??2}/2 ACTIONS REMAINING`:'No active structured encounter. Outside combat, Actions are taken in any order.'}</div>${['Attack','Cast a Spell','Move','Help','Retrieve','Use a Hotlist Item','Evade (Interrupt)','Heal (Interrupt)','Intervene (Interrupt)','Taunt (Interrupt)'].map(x=>`<div class="row"><div><b>${x}</b></div><span class="pill">ACTION</span></div>`).join('')}<div class="notice">Each Action permits a Step (default 10 ft). Move is normally 20 ft. Actions cannot be held for the next round.</div>`;
  if(tab==='skills')v.innerHTML=`<h2>Skills</h2><div class="notice">Skill Check = d20 + Skill Rank + applicable Stat Mod, plus other benefits/penalties.</div>${c.skills.map((s,i)=>`<div class="row"><div><b>${esc(s[0])}</b><div class="muted small">${esc(s[2]||'None')} // roll bonus +${skillBonus(s)}</div>${s[3]?`<div class="muted">${esc(s[3])}</div>`:''}</div><div class="controls"><button data-skilldown="${i}">−</button><span class="pill">RANK ${s[1]}</span><button data-skillup="${i}">+</button><button data-rollskill="${i}">ROLL</button><button data-removeskill="${i}" class="danger">REMOVE</button></div></div>`).join('')}<div class="itemeditor"><h3>Add Skill</h3><div class="field"><label>Name</label><input id="skillName"></div><div class="field"><label>Stat</label><select id="skillStat">${['STR','DEX','CON','INT','CHA','None'].map(x=>`<option>${x}</option>`).join('')}</select></div><div class="field"><label>Rank</label><input id="skillRank" type="number" min="0" max="20" value="1"></div><div class="field"><label>Description</label><textarea id="skillEffect"></textarea></div><button id="addSkill" class="primary">ADD SKILL</button></div>`;
  if(tab==='spells')v.innerHTML=`<h2>Spells</h2>${c.spells.length?c.spells.map((x,i)=>`<div class="spellcard"><div class="row"><div><b>${esc(x.name||x)}</b><div class="muted small">${esc(x.distance||'—')} // ${esc(x.attribute||'INT')} // RANK ${Number(x.rank||1)} // MANA ${Number(x.manaCost||0)}</div></div><div class="controls"><button data-spelldown="${i}">− RANK</button><button data-spellup="${i}">+ RANK</button><button data-removespell="${i}" class="danger">REMOVE</button></div></div><div class="muted">${esc(x.effect||x.description||'No effect recorded.')}</div><div class="controls" style="margin-top:10px"><button data-spellattack="${i}">ATTACK / TO-HIT</button>${x.damage?`<button data-spelldamage="${i}">DAMAGE ${esc(x.damage)}</button>`:''}<button data-hotspell="${i}">ADD TO HOTLIST</button></div></div>`).join(''):'<p class="muted">No spells recorded.</p>'}`;
  if(tab==='hotlist')v.innerHTML=`<h2>Hotlist</h2><div class="notice">10 RAW quick-access slots. Activating an item normally costs an Action; swapping a Hotlist weapon as part of Attack is free.</div><div class="p31-hotlist">${c.hotlist.map((ref,i)=>{let label='EMPTY SLOT',kind='';if(ref?.kind==='item'){const it=itemById(ref.id);label=it?.name||'MISSING ITEM';kind=it?.type||it?.category||'ITEM'}if(ref?.kind==='spell'){const sp=c.spells[ref.index];label=sp?.name||ref.name||'MISSING SPELL';kind=`SPELL // MANA ${Number(sp?.manaCost||0)}`}return `<div class="p31-hotslot"><span class="tag">SLOT ${i+1}</span><b>${esc(label)}</b><span class="muted small">${esc(kind)}</span>${ref?`<div class="controls"><button data-activatehot="${i}" ${c.dying?'disabled':''}>ACTIVATE</button><button data-clearhot="${i}" class="danger">CLEAR</button></div>`:'<span class="muted small">AVAILABLE</span>'}</div>`}).join('')}</div>`;
  if(tab==='inventory'){const groups=['Equipment','Consumable','Quest Item','Material','Other'];v.innerHTML=`<h2>Inventory</h2><div class="notice">Inventory is the source of truth for owned items. Gear bonuses apply only while equipped. Hotlist entries reference Inventory items rather than moving them.</div>${groups.map(g=>{const rows=c.inventory.map((x,i)=>({x,i})).filter(o=>(o.x.category||'Other')===g);if(!rows.length)return'';return `<details open><summary><b>${g.toUpperCase()}</b> (${rows.length})</summary>${rows.map(({x,i})=>`<div class="row"><div><b>${esc(x.name)}</b><div class="muted small">${esc(x.type||x.category||'Item')}${x.gearSlot?` // ${esc(x.gearSlot)}`:''}${isEquipped(x.id)?' // EQUIPPED':''}</div>${x.effect?`<div class="muted">${esc(x.effect)}</div>`:''}</div><div class="controls"><span class="pill">× ${x.qty}</span>${x.category==='Equipment'?`<select data-gearslot="${i}"><option value="">SET SLOT...</option>${RAW_GEAR_SLOTS.map(s=>`<option ${x.gearSlot===s?'selected':''}>${s}</option>`).join('')}</select>${isEquipped(x.id)?`<button data-unequipitem="${i}">UNEQUIP</button>`:`<button data-equipitem="${i}" ${!x.gearSlot?'disabled':''}>EQUIP</button>`}`:''}<button data-hotitem="${i}">HOTLIST</button><button data-invminus="${i}">−</button><button data-invplus="${i}">+</button>${x.category==='Consumable'?`<button data-use="${i}">USE / -1</button>`:''}<button data-removeitem="${i}" class="danger">REMOVE</button></div></div>`).join('')}</details>`}).join('')||'<p class="muted">Inventory empty.</p>'}<div class="itemeditor"><h3>Add Inventory Item</h3><div class="field"><label>Name</label><input id="itemName"></div><div class="field"><label>Category</label><select id="itemCategory">${groups.map(x=>`<option>${x}</option>`).join('')}</select></div><div class="field"><label>Type / Subcategory</label><input id="itemType" placeholder="Boots / Potion / Weapon"></div><div class="field"><label>Gear Slot</label><select id="itemGearSlot"><option value="">Not equippable</option>${RAW_GEAR_SLOTS.map(x=>`<option>${x}</option>`).join('')}</select></div><div class="field"><label>Quantity</label><input id="itemQty" type="number" min="1" value="1"></div><div class="field"><label>Effect / Description</label><textarea id="itemEffect"></textarea></div><button id="addItem" class="primary">ADD ITEM</button></div>`}
  if(tab==='equipment'){const slot=(label,id)=>{const it=itemById(c.equipmentSlots[id]);return `<div class="p31-gearslot"><span class="tag">${label}</span><b>${esc(it?.name||'EMPTY')}</b>${it?`<button data-unequipslot="${id}">UNEQUIP</button>`:'<span class="muted small">NO ITEM EQUIPPED</span>'}</div>`};v.innerHTML=`<h2>Equipment</h2><div class="notice">RAW Gear Slots. Only equipped gear grants bonuses. Inventory retains ownership.</div><div class="p31-paperdoll"><div>${slot('HEAD','Head')}${slot('ARMS','Arms')}${slot('LEFT HAND / HOLDING','LeftHand')}${slot('LEGS','Legs')}</div><div class="p31-body">CRAWLER<br><span>GEAR SLOTS</span></div><div>${slot('TORSO','Torso')}${slot('GLOVES','HandsGloves')}${slot('RIGHT HAND / HOLDING','RightHand')}${slot('FEET','Feet')}</div></div><h3>Accessories // Max 10</h3><div class="p31-accessories">${c.equipmentSlots.Accessories.map((id,i)=>{const it=itemById(id);return `<div class="p31-gearslot"><span class="tag">ACCESSORY ${i+1}</span><b>${esc(it?.name||'EMPTY')}</b>${it?`<button data-unequipacc="${i}">UNEQUIP</button>`:''}</div>`}).join('')}</div>`}
  if(tab==='loot')v.innerHTML=`<h2>Loot Boxes</h2><div class="notice">System rewards delivered to the crawler. Opened history may be removed without deleting already transferred items.</div>${c.lootBoxes.length?c.lootBoxes.map((x,i)=>`<div class="spellcard"><div class="row"><div><div class="tag">${esc(x.tier||'SYSTEM REWARD')}</div><h3>${esc(x.name)}</h3><div class="muted small">${x.opened?'OPENED':'SEALED // CONTENTS CLASSIFIED'}</div></div><div class="controls">${x.opened?`<span class="pill">OPENED</span><button class="danger" data-removeloot="${i}">REMOVE</button>`:`<button class="primary" data-openloot="${i}">OPEN BOX</button>`}</div></div>${x.opened?`<div class="notice" style="white-space:pre-wrap">${esc(x.contents||'No contents recorded.')}</div>`:''}</div>`).join(''):'<p class="muted">No loot boxes recorded.</p>'}`;
  if(tab==='quests')v.innerHTML=`<h2>Quests</h2>${c.quests.map((x,i)=>`<div class="row"><div><b>${esc(x.name)}</b><div class="muted">${esc(x.detail)}</div></div><div class="controls"><select data-queststatus="${i}">${['ACTIVE','UPDATED','FAILED','COMPLETE'].map(s=>`<option value="${s}" ${String(x.status||'ACTIVE').toUpperCase()===s?'selected':''}>${s}</option>`).join('')}</select><button class="danger" data-removequest="${i}">REMOVE</button></div></div>`).join('')||'<p class="muted">No quests assigned.</p>'}`;
  if(tab==='achievements')v.innerHTML=`<h2>Achievements</h2>${c.achievements.map((x,i)=>{x.claimStatus=x.claimStatus||'UNCLAIMED';return `<div class="row"><div><b>${esc(x.name)}</b><div class="muted">${esc(x.reward||'')}</div></div><div class="controls"><select data-claimstatus="${i}"><option value="UNCLAIMED" ${x.claimStatus==='UNCLAIMED'?'selected':''}>UNCLAIMED</option><option value="CLAIMED" ${x.claimStatus==='CLAIMED'?'selected':''}>CLAIMED</option></select><button class="danger" data-removeachievement="${i}">REMOVE</button></div></div>`}).join('')||'<p class="muted">No achievements recorded.</p>'}`;
  if(tab==='comms')v.innerHTML=`<h2>Communications</h2><div class="notice">PARTY HUD CHAT // silent text-style communication. External fist-bump links are reserved for a later contact-link system.</div>${c.dying?'<div class="notice"><b>HUD OFFLINE // DYING</b><br>Communication unavailable until Health is restored.</div>':`<div class="field"><label>Party Message</label><textarea id="partyMessage" rows="3" maxlength="1000" placeholder="Think at your party..."></textarea></div><button id="sendPartyMessage" class="primary">SEND TO PARTY</button>`}<h3>Party Channel</h3>${partyMessages.length?partyMessages.map(x=>`<div class="messagecard"><div class="tag">${esc(x.sender_name||x.sender_crawler_id||'CRAWLER')} // ${new Date(x.created_at).toLocaleString()}</div><div>${esc(x.text)}</div></div>`).join(''):'<p class="muted">No party messages yet.</p>'}<h3>System Messages</h3>${(c.messages||[]).length?(c.messages||[]).map((x,i)=>`<div class="messagecard ${x.read?'read':''}"><div class="tag">PRIVATE SYSTEM // ${esc(x.at||'SYSTEM')}</div><div class="system">${esc(x.text)}</div>${!x.read?`<button data-read="${i}" style="margin-top:10px">ACKNOWLEDGE</button>`:''}</div>`).join(''):'<p class="muted">No private System messages.</p>'}`;
  if(tab==='dice')v.innerHTML=`<h2>Dice Roller</h2><div class="dicebuilder"><div class="field"><label>Quantity</label><input id="diceQty" type="number" min="1" max="100" value="1"></div><div class="field"><label>Die</label><select id="diceSides">${[4,6,8,10,12,20,100].map(d=>`<option value="${d}">d${d}</option>`).join('')}</select></div><button id="rollDice" class="primary">ROLL</button></div><div class="controls">${[4,6,8,10,12,20].map(d=>`<button data-quickdie="${d}">1d${d}</button>`).join('')}</div><div class="rollbox"><div class="tag">LAST RESULT</div><div id="rolltotal" class="rolltotal">—</div><div id="rolldetail" class="muted"></div></div>`;
  document.querySelector('#gmNotes')?.addEventListener('change',e=>{c.notes=e.target.value;addFeed(state,`GM Notes updated for ${c.name}.`);persist()});
  document.querySelector('#hurt')?.addEventListener('click',()=>{c.healthSlotsRemaining=Math.max(0,Number(c.healthSlotsRemaining||0)-1);addFeed(state,`${c.name} lost 1 Health Bar slot (${c.healthSlotsRemaining}/10).`);persist();render()});
  document.querySelector('#heal')?.addEventListener('click',()=>healSlots(1,'manual GM/HUD adjustment'));
  document.querySelector('#applyDamage')?.addEventListener('click',()=>applyDamage(document.querySelector('#damageAmount').value));
  document.querySelector('#castHeal')?.addEventListener('click',()=>{if(c.dying)return alert('A Dying crawler cannot use the HUD or take Actions. Another crawler must restore Health.');if(c.mana<2)return alert('Heal requires 2 Mana.');c.mana-=2;healSlots(2,'Heal Spell');});
  document.querySelector('#manaDown')?.addEventListener('click',()=>{c.mana=Math.max(0,c.mana-1);persist();render()});
  document.querySelector('#manaUp')?.addEventListener('click',()=>{c.mana=Math.min(c.maxMana,c.mana+1);persist();render()});
  document.querySelector('#levelUp')?.addEventListener('click',()=>{c.level++;c.pendingStatPoints+=3;addFeed(state,`${c.name} reached Level ${c.level} and banked 3 stat points (${c.pendingStatPoints} available).`);persist();render()});
  document.querySelector('#levelDown')?.addEventListener('click',()=>{if(c.level<=1)return alert('Level cannot go below 1.');if(c.pendingStatPoints<3)return alert('Level Down is locked because fewer than 3 unspent stat points remain. Reverse assigned stat points first if this level was added by mistake.');c.level--;c.pendingStatPoints-=3;addFeed(state,`${c.name} was corrected to Level ${c.level}; 3 banked stat points removed (${c.pendingStatPoints} remain).`);persist();render()});
  document.querySelector('#floorUp')?.addEventListener('click',()=>{c.floor=Math.min(99,Number(c.floor||1)+1);addFeed(state,`${c.name} advanced to Floor ${c.floor}.`);persist();render()});
  document.querySelector('#floorDown')?.addEventListener('click',()=>{c.floor=Math.max(1,Number(c.floor||1)-1);addFeed(state,`${c.name} was corrected to Floor ${c.floor}.`);persist();render()});
  document.querySelectorAll('[data-use]').forEach(b=>b.onclick=()=>{const x=c.inventory[+b.dataset.use];if(x.qty>0){x.qty--;addFeed(state,`${c.name} used ${x.name}.`);c.inventory=c.inventory.filter(y=>y.qty>0);persist();render()}});
  document.querySelectorAll('[data-invplus]').forEach(b=>b.onclick=()=>{const x=c.inventory[+b.dataset.invplus];x.qty=Number(x.qty||0)+1;addFeed(state,`${c.name} added 1 ${x.name} (×${x.qty}).`);persist();render()});
  document.querySelectorAll('[data-invminus]').forEach(b=>b.onclick=()=>{const x=c.inventory[+b.dataset.invminus];if(Number(x.qty)>1){x.qty--;addFeed(state,`${c.name} removed 1 ${x.name} (×${x.qty}).`)}else{addFeed(state,`${c.name} removed ${x.name} from Inventory.`);c.inventory.splice(+b.dataset.invminus,1)}persist();render()});
  document.querySelectorAll('[data-removeitem]').forEach(b=>b.onclick=()=>{const i=+b.dataset.removeitem,x=c.inventory[i];if(confirm(`Remove all ${x.name} from Inventory?`)){unequipId(x.id);c.hotlist=c.hotlist.map(r=>r?.kind==='item'&&String(r.id)===String(x.id)?null:r);c.inventory.splice(i,1);addFeed(state,`${c.name} removed all ${x.name} from Inventory.`);persist();render()}});
  document.querySelector('#addItem')?.addEventListener('click',()=>{const name=document.querySelector('#itemName').value.trim(),category=document.querySelector('#itemCategory').value,type=document.querySelector('#itemType').value.trim()||category,gearSlot=document.querySelector('#itemGearSlot').value,qty=Math.max(1,Math.min(999,Number(document.querySelector('#itemQty').value)||1)),effect=document.querySelector('#itemEffect').value.trim();if(!name)return alert('Enter an item name.');c.inventory.push({id:`item_${Date.now()}_${Math.random().toString(36).slice(2)}`,name,category,type,gearSlot,qty,effect});addFeed(state,`${c.name} added ${name} ×${qty} to Inventory.`);persist();render()});

  document.querySelectorAll('[data-gearslot]').forEach(s=>s.onchange=()=>{const x=c.inventory[+s.dataset.gearslot];x.gearSlot=s.value;persist();render()});
  function unequipId(id){for(const k of ['Head','Torso','Arms','Legs','Feet','HandsGloves','LeftHand','RightHand'])if(String(c.equipmentSlots[k])===String(id))c.equipmentSlots[k]=null;c.equipmentSlots.Accessories=c.equipmentSlots.Accessories.map(x=>String(x)===String(id)?null:x)}
  document.querySelectorAll('[data-equipitem]').forEach(b=>b.onclick=()=>{const x=c.inventory[+b.dataset.equipitem],slot=x.gearSlot;if(!slot)return alert('Set a RAW Gear Slot first.');unequipId(x.id);if(slot==='Accessories'){const i=c.equipmentSlots.Accessories.findIndex(v=>!v);if(i<0)return alert('All 10 Accessory slots are occupied.');c.equipmentSlots.Accessories[i]=x.id}else if(slot==='Hands/Holding'){const choice=prompt('Hands/Holding target: type LEFT, RIGHT, or GLOVES','LEFT');if(!choice)return;const key=/^r/i.test(choice)?'RightHand':/^g/i.test(choice)?'HandsGloves':'LeftHand';if(c.equipmentSlots[key]&&!confirm('That slot is occupied. Replace it?'))return;c.equipmentSlots[key]=x.id}else{if(c.equipmentSlots[slot]&&!confirm(`${slot} is occupied. Replace it?`))return;c.equipmentSlots[slot]=x.id}addFeed(state,`${c.name} equipped ${x.name} (${slot}).`);persist();render()});
  document.querySelectorAll('[data-unequipitem]').forEach(b=>b.onclick=()=>{const x=c.inventory[+b.dataset.unequipitem];unequipId(x.id);addFeed(state,`${c.name} unequipped ${x.name}.`);persist();render()});
  document.querySelectorAll('[data-unequipslot]').forEach(b=>b.onclick=()=>{const key=b.dataset.unequipslot,id=c.equipmentSlots[key],x=itemById(id);c.equipmentSlots[key]=null;if(x)addFeed(state,`${c.name} unequipped ${x.name}.`);persist();render()});
  document.querySelectorAll('[data-unequipacc]').forEach(b=>b.onclick=()=>{const i=+b.dataset.unequipacc,id=c.equipmentSlots.Accessories[i],x=itemById(id);c.equipmentSlots.Accessories[i]=null;if(x)addFeed(state,`${c.name} unequipped ${x.name}.`);persist();render()});
  function addHot(ref,label){const i=c.hotlist.findIndex(x=>!x);if(i<0)return alert('Hotlist is full. Clear a slot first.');c.hotlist[i]=ref;addFeed(state,`${c.name} added ${label} to Hotlist slot ${i+1}.`);persist();render()}
  document.querySelectorAll('[data-hotitem]').forEach(b=>b.onclick=()=>{const x=c.inventory[+b.dataset.hotitem];addHot({kind:'item',id:x.id},x.name)});
  document.querySelectorAll('[data-hotspell]').forEach(b=>b.onclick=()=>{const i=+b.dataset.hotspell,s=c.spells[i];addHot({kind:'spell',index:i,name:s.name},s.name)});
  document.querySelectorAll('[data-clearhot]').forEach(b=>b.onclick=()=>{c.hotlist[+b.dataset.clearhot]=null;persist();render()});
  document.querySelectorAll('[data-activatehot]').forEach(b=>b.onclick=()=>{if(c.dying)return alert('HUD OFFLINE // DYING');const i=+b.dataset.activatehot,ref=c.hotlist[i];if(!ref)return;if(activeEncounter&&activeEncounter.phase!=='crawlers')return alert('It is not the Crawler Action Phase. Interrupt timing is adjudicated by the GM.');if(activeEncounter&&Number(activeEncounter.actions_remaining?.[c.id]??2)<=0)return alert('No Actions remain this round.');if(ref.kind==='spell'){const sp=c.spells[ref.index];if(!sp)return alert('Spell reference missing.');const cost=Number(sp.manaCost||0);if(c.mana<cost)return alert(`Not enough Mana. ${sp.name} costs ${cost}.`);c.mana-=cost;addFeed(state,`${c.name} activated ${sp.name} from Hotlist for ${cost} Mana.`)}else{const it=itemById(ref.id);if(!it)return alert('Item reference missing.');if(/consumable/i.test(it.category||'')){it.qty=Math.max(0,Number(it.qty||1)-1);if(it.qty===0){c.inventory=c.inventory.filter(x=>x.id!==it.id);c.hotlist[i]=null}}addFeed(state,`${c.name} activated ${it.name} from Hotlist.`)}persist();render();alert('Action use recorded on the crawler sheet. If an encounter is active, the GM Console remains authoritative for shared Action count.');});
  document.querySelector('#sendPartyMessage')?.addEventListener('click',async()=>{const box=document.querySelector('#partyMessage'),txt=box.value.trim();if(!txt)return;if(c.dying)return alert('HUD OFFLINE // DYING');const b=document.querySelector('#sendPartyMessage');b.disabled=true;try{await DSCloud.sendPartyMessage(c.id,txt,c.name);box.value=''}catch(e){alert('Party message failed: '+e.message)}finally{b.disabled=false}});

  document.querySelector('#rollDice')?.addEventListener('click',()=>doDice(document.querySelector('#diceQty').value,document.querySelector('#diceSides').value));
  document.querySelectorAll('[data-quickdie]').forEach(b=>b.onclick=()=>doDice(1,+b.dataset.quickdie));
  document.querySelectorAll('[data-rollskill]').forEach(b=>b.onclick=()=>{const s=c.skills[+b.dataset.rollskill],base=rollDie(20),bonus=skillBonus(s),total=base+bonus;addFeed(state,`${c.name} — ${s[0]}: d20 ${base} + ${bonus} = ${total}.`);showDiceRoll(`${s[0]} CHECK`,base,bonus,total)});
  document.querySelectorAll('[data-skillup]').forEach(b=>b.onclick=()=>{const s=c.skills[+b.dataset.skillup];s[1]=Number(s[1]||0)+1;addFeed(state,`${c.name} increased ${s[0]} to Rank ${s[1]}.`);persist();render()});
  document.querySelectorAll('[data-skilldown]').forEach(b=>b.onclick=()=>{const s=c.skills[+b.dataset.skilldown];s[1]=Math.max(0,Number(s[1]||0)-1);addFeed(state,`${c.name} reduced ${s[0]} to Rank ${s[1]}.`);persist();render()});
  document.querySelectorAll('[data-removeskill]').forEach(b=>b.onclick=()=>{const i=+b.dataset.removeskill,s=c.skills[i];if(confirm(`Remove skill ${s[0]}?`)){c.skills.splice(i,1);addFeed(state,`${c.name} lost/removed skill ${s[0]}.`);persist();render()}});
  document.querySelector('#addSkill')?.addEventListener('click',()=>{const name=document.querySelector('#skillName').value.trim(),stat=document.querySelector('#skillStat').value,rank=Math.max(0,Math.min(20,Number(document.querySelector('#skillRank').value)||0));if(!name)return alert('Enter a skill name.');const effect=document.querySelector('#skillEffect').value.trim();c.skills.push([name,rank,stat,effect]);addFeed(state,`${c.name} gained skill ${name} at Rank ${rank}.`);persist();render()});
  document.querySelectorAll('[data-spellup]').forEach(b=>b.onclick=()=>{const s=c.spells[+b.dataset.spellup];s.rank=Number(s.rank||1)+1;addFeed(state,`${c.name} increased spell ${s.name} to Rank ${s.rank}.`);persist();render()});
  document.querySelectorAll('[data-spelldown]').forEach(b=>b.onclick=()=>{const s=c.spells[+b.dataset.spelldown];s.rank=Math.max(0,Number(s.rank||1)-1);addFeed(state,`${c.name} reduced spell ${s.name} to Rank ${s.rank}.`);persist();render()});
  document.querySelectorAll('[data-removespell]').forEach(b=>b.onclick=()=>{const i=+b.dataset.removespell,s=c.spells[i];if(confirm(`Remove spell ${s.name}?`)){c.spells.splice(i,1);addFeed(state,`${c.name} lost/removed spell ${s.name}.`);persist();render()}});
  document.querySelector('#addSpell')?.addEventListener('click',()=>{const name=document.querySelector('#spellName').value.trim();if(!name)return alert('Enter a spell name.');const s={name,distance:document.querySelector('#spellDistance').value.trim(),attribute:document.querySelector('#spellAttribute').value,rank:Math.max(0,Math.min(20,Number(document.querySelector('#spellRank').value)||1)),effect:document.querySelector('#spellEffect').value.trim(),damage:document.querySelector('#spellDamage').value.trim().toUpperCase(),manaCost:Math.max(0,Number(document.querySelector('#spellManaCost').value)||0)};c.spells.push(s);addFeed(state,`${c.name} gained spell ${name} at Rank ${s.rank}.`);persist();render()});
  document.querySelectorAll('[data-spellattack]').forEach(b=>b.onclick=()=>{const s=c.spells[+b.dataset.spellattack],cost=Number(s.manaCost||0);if(c.mana<cost)return alert(`Not enough Mana. ${s.name} costs ${cost}; ${c.mana} available.`);c.mana-=cost;const base=rollDie(20),attr=s.attribute||'INT',bonus=modFor(Number(c.stats[attr]||0)),total=base+bonus;addFeed(state,`${c.name} cast ${s.name} for ${cost} Mana (${c.mana}/${c.maxMana} remaining) — attack: d20 ${base} + ${attr} mod ${bonus} = ${total}.`);persist();render();showDiceRoll(`${s.name} // ATTACK`,base,bonus,total,`d20 ${base} + ${attr} modifier ${bonus} // Mana ${c.mana}/${c.maxMana}`)});
  document.querySelectorAll('[data-spelldamage]').forEach(b=>b.onclick=()=>{const s=c.spells[+b.dataset.spelldamage],r=rollFormula(s.damage);if(!r)return alert('Damage must look like 1D8, 2D6, or 2D6+3.');addFeed(state,`${c.name} — ${s.name} damage ${s.damage}: [${r.rolls.join(', ')}]${r.flat?` ${r.flat>0?'+':'-'} ${Math.abs(r.flat)}`:''} = ${r.total}.`);alert(`${s.name} DAMAGE\n${s.damage}: [${r.rolls.join(', ')}]${r.flat?` ${r.flat>0?'+':'-'} ${Math.abs(r.flat)}`:''} = ${r.total}`)});

  document.querySelectorAll('[data-read]').forEach(b=>b.onclick=async()=>{const m=c.messages[+b.dataset.read],btn=b;btn.disabled=true;btn.textContent='ACKNOWLEDGING...';try{await markPrivateMessageRead(m.dbId);m.read=true;render()}catch(e){btn.disabled=false;btn.textContent='ACKNOWLEDGE';alert('Acknowledgement failed: '+e.message)}});
  function transferLootContents(contents){
   const blocks=String(contents||'').split(/\n\s*\n/).filter(Boolean);
   let added=0;
   blocks.forEach(block=>{const lines=block.split('\n'),name=(lines[0]||'').trim();if(!name||/^SYSTEM AI OFFLINE/i.test(name)||/^GM Request Context:/i.test(name))return;const cat=(block.match(/Category:\s*(.+)/i)||[])[1]||'';const effect=(block.match(/Effect:\s*(.+)/i)||[])[1]||'';const quantity=Number((block.match(/Quantity:\s*(\d+)/i)||[])[1]||1);const qm=name.match(/^(.*?)(?:\s*[×x]\s*(\d+))$/i),base=(qm?qm[1]:name).trim(),qty=qm?+qm[2]:quantity;if(!base)return;{const category=/equipment|armor|weapon|gear/i.test(cat)&&!/consumable/i.test(cat)?'Equipment':(/consumable|potion|food/i.test(cat)?'Consumable':'Other');const ex=c.inventory.find(x=>String(x.name).toLowerCase()===base.toLowerCase());if(ex){ex.qty=Number(ex.qty||0)+qty;if(effect)ex.effect=effect}else c.inventory.push({id:`loot_${Date.now()}_${Math.random().toString(36).slice(2)}`,name:base,category,type:cat||'Reward',gearSlot:'',qty,effect});added++}});
   return added;
  }
  document.querySelectorAll('[data-openloot]').forEach(b=>b.onclick=()=>{const box=c.lootBoxes[+b.dataset.openloot];if(!box||box.opened)return;if(!confirm(`Open ${box.name}?`))return;box.opened=true;box.openedAt=new Date().toISOString();const added=transferLootContents(box.contents);c.achievements.push({name:`LOOT OPENED: ${box.name}`,reward:box.contents,claimStatus:'CLAIMED'});addFeed(state,`${c.name} opened ${box.name}; ${added} reward entr${added===1?'y':'ies'} transferred to the crawler sheet.`);persist();queueSystemNotification('LOOT BOX OPENED!',box.name,box.contents||'The box was empty. The System finds this hilarious.');render();showNextNotification()});
  document.querySelectorAll('[data-removeloot]').forEach(b=>b.onclick=()=>{const i=+b.dataset.removeloot,box=c.lootBoxes[i];if(!box||!box.opened)return;if(!confirm(`Remove opened loot box "${box.name}" from this crawler's history?\n\nItems already transferred to Inventory/Equipment will NOT be removed.`))return;c.lootBoxes.splice(i,1);addFeed(state,`${c.name} removed opened loot history: ${box.name}.`);persist();render()});
  document.querySelectorAll('[data-removequest]').forEach(b=>b.onclick=async()=>{const i=+b.dataset.removequest,q=c.quests[i];if(!q)return;if(!confirm(`Remove quest "${q.name}" from this crawler's sheet?`))return;c.quests.splice(i,1);addFeed(state,`${c.name} removed quest record: ${q.name}.`);localSave(state);render();try{if(DSCloud.client&&DSCloud.user){const payload=JSON.parse(JSON.stringify(c));delete payload.messages;await DSCloud.updateCrawler(c.id,{data:payload,updated_at:new Date().toISOString()})}else persist()}catch(e){alert('Quest was removed locally, but cloud save failed: '+e.message)}});
  document.querySelectorAll('[data-removeachievement]').forEach(b=>b.onclick=()=>{const i=+b.dataset.removeachievement,a=c.achievements[i];if(!a)return;if(!confirm(`Remove achievement "${a.name}" from this crawler's sheet?\n\nAny reward already transferred elsewhere will NOT be reversed.`))return;c.achievements.splice(i,1);addFeed(state,`${c.name} removed achievement record: ${a.name}.`);persist();render()});
  document.querySelectorAll('[data-queststatus]').forEach(s=>s.onchange=()=>{const q=c.quests[+s.dataset.queststatus],old=q.status||'ACTIVE';q.status=s.value;addFeed(state,`${c.name} changed quest "${q.name}" from ${old} to ${q.status}.`);persist();render()});
  document.querySelectorAll('[data-claimstatus]').forEach(s=>s.onchange=()=>{const a=c.achievements[+s.dataset.claimstatus],old=a.claimStatus||'UNCLAIMED';a.claimStatus=s.value;addFeed(state,`${c.name} marked achievement reward "${a.name}" ${a.claimStatus}.`);persist();render()});
  refreshSystemPopup();
 }
 render()
})().catch(e=>document.querySelector('#app').innerHTML=`<div class="notice">${esc(e.message)}</div>`);
