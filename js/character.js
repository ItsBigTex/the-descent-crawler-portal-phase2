
(async()=>{
 const state=await getState();
 const id=new URLSearchParams(location.search).get('id');
 const c=state.crawlers.find(x=>x.id===id)||state.crawlers[0];
 if(c.pendingStatPoints==null)c.pendingStatPoints=0;
 if(!c.startingStats)c.startingStats=JSON.parse(JSON.stringify(c.stats));
 if(c.manaBonus==null)c.manaBonus=0;
 if(c.maxMana==null)c.maxMana=Number(c.stats.INT||0)+Number(c.manaBonus||0);
 if(c.mana==null)c.mana=Number(c.maxMana);
 c.inventory=(c.inventory||[]).map(x=>typeof x==='string'?{name:x,type:'Item',qty:1,effect:''}:{...x,effect:x.effect||''});
 c.spells=(c.spells||[]).map(x=>typeof x==='string'?{name:x,distance:'',attribute:'INT',rank:1,effect:'',damage:'',manaCost:0}:{...x,manaCost:Number(x.manaCost||0)});
 if(c.healthFlatBonus==null)c.healthFlatBonus=0;
 if(c.healthManualBonus==null)c.healthManualBonus=0;
 if(c.notes==null)c.notes='';

 if(c.level==null)c.level=1;
 c.messages=c.messages||[];
 const unread=c.messages.find(m=>!m.read);
 if(unread){
   const pop=document.querySelector('#systemPopup'),txt=document.querySelector('#popupText'),ack=document.querySelector('#popupAck');
   txt.textContent=unread.text;pop.classList.remove('hidden');
   ack.onclick=()=>{unread.read=true;saveState(state);pop.classList.add('hidden')};
 }
 let tab='character';
 const app=document.querySelector('#app');

 function skillBonus(s){const rank=Number(s[1]||0),stat=s[2];return rank+(c.stats[stat]?modFor(c.stats[stat]):0)}
 function persist(){saveState(state)}
 function render(){
  c.maxMana=Math.max(0,Number(c.stats.INT||0)+Number(c.manaBonus||0));
  c.mana=Math.max(0,Math.min(Number(c.mana||0),c.maxMana));
  c.maxHp=Math.max(1,10+(modFor(Number(c.stats.CON||0))*Number(c.level||1))+Number(c.healthFlatBonus||0)+Number(c.healthManualBonus||0));
  c.hp=Math.max(0,Math.min(Number(c.hp||0),c.maxHp));

  const hpPct=Math.max(0,Math.min(100,c.hp/c.maxHp*100));
  app.innerHTML=`<section class="panel">
   <div class="tag">CRAWLER // ${esc(c.id.toUpperCase())}</div>
   <div class="top" style="border:0;padding:0">
    <div><h1 style="margin-bottom:0">${esc(c.name)}</h1><div class="red system">${esc(c.systemTitle)}</div></div>
    <div class="system">LEVEL ${c.level} // FLOOR ${c.floor}</div>
   </div>
   <div style="margin-top:16px"><div class="row"><b>HEALTH ${c.hp} / ${c.maxHp}</b><span class="pill">MANA ${c.mana} / ${c.maxMana}</span></div><div class="bar"><i style="width:${hpPct}%"></i></div></div>
   <div class="statgrid" style="margin-top:14px">${Object.entries(c.stats).map(([k,v])=>`<div class="stat"><div class="tag">${k}</div><div class="n">${v}</div><div class="muted small">MOD +${modFor(v)}</div>${Number(c.floor)>=3?`<div class="statadjust"><button class="statminus" data-statminus="${k}" ${v<=Number(c.startingStats?.[k]??v)?'disabled':''} title="Return 1 assigned point from ${k}">−</button><button class="statplus" data-stat="${k}" ${c.pendingStatPoints<=0?'disabled':''} title="Spend 1 banked stat point on ${k}">+</button></div>`:''}</div>`).join('')}</div>
   ${c.pendingStatPoints>0?`<div class="notice" style="margin-top:12px"><b>BANKED STAT POINTS:</b> ${c.pendingStatPoints}${Number(c.floor)<3?' // ALLOCATION LOCKED UNTIL FLOOR 3':' // AVAILABLE FOR ASSIGNMENT'}</div>`:''}
  </section>
  <nav class="tabs">${['character','skills','spells','equipment','inventory','quests','achievements','messages','dice'].map(t=>`<button data-tab="${t}" class="${tab===t?'active':''}">${t.toUpperCase()}</button>`).join('')}</nav>
  <section id="view" class="panel"></section>`;
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;render()});
  document.querySelectorAll('[data-stat]').forEach(b=>b.onclick=()=>{if(c.pendingStatPoints>0){c.stats[b.dataset.stat]++;c.pendingStatPoints--;persist();addFeed(state,`${c.name} increased ${b.dataset.stat} to ${c.stats[b.dataset.stat]}.`);render()}});
  document.querySelectorAll('[data-statminus]').forEach(b=>b.onclick=()=>{const k=b.dataset.statminus,start=Number(c.startingStats?.[k]??c.stats[k]);if(Number(c.stats[k])>start){c.stats[k]--;c.pendingStatPoints++;persist();addFeed(state,`${c.name} returned 1 assigned ${k} point to the bank (${c.pendingStatPoints} available).`);render()}});
  renderView()
 }
 function renderView(){
  const v=document.querySelector('#view');
  if(tab==='character')v.innerHTML=`<h2>Character File</h2><div class="notice">${esc(c.derivedStatus)}</div><div class="field" style="margin:12px 0"><label>GM Notes</label><textarea id="gmNotes" rows="5" placeholder="GM notes for this crawler...">${esc(c.notes||'')}</textarea></div><div class="muted small">MAX HP FORMULA: 10 Base + (CON Mod ${modFor(Number(c.stats.CON||0))} × Level ${c.level}) + Flat/Manual Bonuses ${Number(c.healthFlatBonus||0)+Number(c.healthManualBonus||0)} = ${c.maxHp}</div><div class="controls" style="margin-top:10px">
<button id="heal">+1 HP</button><button id="hurt">-1 HP</button><button id="maxHpDown">- MAX HP</button><button id="maxHpUp">+ MAX HP</button><button id="manaDown">-1 MANA</button><button id="manaUp">+1 MANA</button><button id="maxManaDown">- MAX MANA</button><button id="maxManaUp">+ MAX MANA</button>
<button id="levelDown">- LEVEL</button><button id="levelUp" class="primary">+ LEVEL</button>
<button id="floorDown">- FLOOR</button><button id="floorUp" class="primary">+ FLOOR</button>
</div>
<p class="muted small">Each Level Up banks 3 stat points. Level Down removes 3 unspent banked points and will not reduce the level if fewer than 3 unspent points remain. Stat allocation unlocks on Floor 3.</p>`;
  if(tab==='skills')v.innerHTML=`<h2>Skills</h2>${c.skills.map((s,i)=>`<div class="row"><div><b>${esc(s[0])}</b><div class="muted small">${esc(s[2]||'None')} // estimated roll bonus +${skillBonus(s)}</div>${s[3]?`<div class="muted">${esc(s[3])}</div>`:''}</div><div class="controls"><button data-skilldown="${i}">−</button><span class="pill">RANK ${s[1]}</span><button data-skillup="${i}">+</button><button data-rollskill="${i}">ROLL</button><button data-removeskill="${i}" class="danger">REMOVE</button></div></div>`).join('')}<div class="itemeditor"><h3>Add Skill</h3><div class="field"><label>Name</label><input id="skillName" placeholder="Investigation"></div><div class="field"><label>Attribute</label><select id="skillStat">${['STR','DEX','CON','INT','CHA','None'].map(x=>`<option>${x}</option>`).join('')}</select></div><div class="field"><label>Starting Rank</label><input id="skillRank" type="number" min="0" max="20" value="1"></div><div class="field"><label>Effect / Description</label><textarea id="skillEffect" rows="2" placeholder="What does this skill help the crawler do?"></textarea></div><button id="addSkill" class="primary">ADD SKILL</button></div>`;
  if(tab==='spells')v.innerHTML=`<h2>Spells</h2>${c.spells.length?c.spells.map((x,i)=>`<div class="spellcard"><div class="row"><div><b>${esc(x.name||x)}</b><div class="muted small">${esc(x.distance||'—')} // ${esc(x.attribute||'INT')} // RANK ${Number(x.rank||1)} // MANA ${Number(x.manaCost||0)}</div></div><div class="controls"><button data-spelldown="${i}">− RANK</button><button data-spellup="${i}">+ RANK</button><button data-removespell="${i}" class="danger">REMOVE</button></div></div><div class="muted">${esc(x.effect||x.description||'No effect recorded.')}</div><div class="controls" style="margin-top:10px"><button data-spellattack="${i}">ATTACK / TO-HIT</button>${x.damage?`<button data-spelldamage="${i}">DAMAGE ${esc(x.damage)}</button>`:''}</div></div>`).join(''):'<p class="muted">No magical Skills unlocked.</p>'}<div class="spellform"><h3>Add Spell</h3><div class="field"><label>Name</label><input id="spellName" placeholder="Arc Bolt"></div><div class="field"><label>Distance</label><input id="spellDistance" placeholder="Touch / 30ft / 60ft / 15ft cone"></div><div class="field"><label>Attribute</label><select id="spellAttribute">${['STR','DEX','CON','INT','CHA'].map(x=>`<option>${x}</option>`).join('')}</select></div><div class="field"><label>Rank</label><input id="spellRank" type="number" min="0" max="20" value="1"></div><div class="field wide"><label>Description / Effect</label><textarea id="spellEffect" rows="3"></textarea></div><div class="field"><label>Damage Dice</label><input id="spellDamage" placeholder="1D8 / 2D6 / 3D10"></div><div class="field"><label>Mana Cost</label><input id="spellManaCost" type="number" min="0" max="999" value="0"></div><button id="addSpell" class="primary">ADD SPELL</button></div>`;
  if(tab==='equipment')v.innerHTML=`<h2>Equipment</h2>${c.equipment.length?c.equipment.map((x,i)=>`<div class="row"><div><b>${esc(x.name||x)}</b><div class="muted small">${esc(x.type||'Gear')}</div>${x.effect?`<div class="muted">${esc(x.effect)}</div>`:''}</div><div class="controls"><button data-removegear="${i}" class="danger">REMOVE</button></div></div>`).join(''):'<p class="muted">No equipment recorded yet.</p>'}<div class="itemeditor"><h3>Add Equipment</h3><div class="field"><label>Name</label><input id="gearName" placeholder="Reinforced Work Boots"></div><div class="field"><label>Type / slot</label><input id="gearType" placeholder="Feet / Armor / Weapon / Accessory"></div><div class="field"><label>Effects</label><textarea id="gearEffect" rows="2" placeholder="+1 Damage Resistance, magical effect, etc."></textarea></div><button id="addGear" class="primary">ADD GEAR</button></div>`;
  if(tab==='inventory')v.innerHTML=`<h2>Inventory</h2>${c.inventory.map((x,i)=>`<div class="row"><div><b>${esc(x.name)}</b><div class="muted small">${esc(x.type||'Item')}</div>${x.effect?`<div class="muted">${esc(x.effect)}</div>`:''}</div><div class="controls"><button data-invminus="${i}" title="Remove one">−</button><span class="pill">× ${x.qty}</span><button data-invplus="${i}" title="Add one">+</button><button data-use="${i}">USE / -1</button><button data-removeitem="${i}" class="danger">REMOVE ALL</button></div></div>`).join('')||'<p class="muted">Inventory empty.</p>'}<div class="itemeditor"><h3>Add Inventory Item</h3><div class="field"><label>Name</label><input id="itemName" placeholder="Standard Healing Potion"></div><div class="field"><label>Type</label><input id="itemType" placeholder="Consumable / Loot Box / Material / Utility"></div><div class="field"><label>Quantity</label><input id="itemQty" type="number" min="1" max="999" value="1"></div><div class="field"><label>Effect / Description</label><textarea id="itemEffect" rows="2" placeholder="Restores health, grants a buff, utility description, etc."></textarea></div><button id="addItem" class="primary">ADD ITEM</button></div>`;
  if(tab==='quests')v.innerHTML=`<h2>Quests</h2>${c.quests.map((x,i)=>`<div class="row"><div><b>${esc(x.name)}</b><div class="muted">${esc(x.detail)}</div></div><div class="field compact"><label class="tag">STATUS</label><select data-queststatus="${i}">${['ACTIVE','UPDATED','FAILED','COMPLETE'].map(s=>`<option value="${s}" ${String(x.status||'ACTIVE').toUpperCase()===s?'selected':''}>${s}</option>`).join('')}</select></div></div>`).join('')||'<p class="muted">No quests assigned.</p>'}`;
  if(tab==='achievements')v.innerHTML=`<h2>Achievements</h2>${c.achievements.map((x,i)=>{x.claimStatus=x.claimStatus||'UNCLAIMED';return `<div class="row"><div><b>${esc(x.name)}</b><div class="muted">${esc(x.reward||'')}</div></div><div class="field compact"><label class="tag">REWARD</label><select data-claimstatus="${i}"><option value="UNCLAIMED" ${x.claimStatus==='UNCLAIMED'?'selected':''}>UNCLAIMED</option><option value="CLAIMED" ${x.claimStatus==='CLAIMED'?'selected':''}>CLAIMED</option></select></div></div>`}).join('')||'<p class="muted">No achievements recorded on this device.</p>'}`;
  if(tab==='messages')v.innerHTML=`<h2>System Messages</h2>${(c.messages||[]).length?(c.messages||[]).map((x,i)=>`<div class="messagecard ${x.read?'read':''}"><div class="tag">${esc(x.at||'SYSTEM')}</div><div class="system">${esc(x.text)}</div>${!x.read?`<button data-read="${i}" style="margin-top:10px">ACKNOWLEDGE</button>`:''}</div>`).join(''):'<p class="muted">No private System messages.</p>'}`;
  if(tab==='dice')v.innerHTML=`<h2>Dice Roller</h2><div class="dicebuilder"><div class="field"><label>Quantity</label><input id="diceQty" type="number" min="1" max="100" value="1" inputmode="numeric"></div><div class="field"><label>Die</label><select id="diceSides">${[4,6,8,10,12,20,100].map(d=>`<option value="${d}">d${d}</option>`).join('')}</select></div><button id="rollDice" class="primary">ROLL</button></div><div class="controls" style="margin-top:12px">${[4,6,8,10,12,20].map(d=>`<button data-quickdie="${d}">1d${d}</button>`).join('')}</div><div class="rollbox"><div class="tag">LAST RESULT</div><div id="rolltotal" class="rolltotal">—</div><div id="rolldetail" class="muted"></div></div>`;
  bindView()
 }
 function doDice(qty,sides){
   qty=Math.max(1,Math.min(100,Number(qty)||1));sides=Number(sides)||20;
   const rolls=Array.from({length:qty},()=>rollDie(sides)),total=rolls.reduce((a,b)=>a+b,0);
   document.querySelector('#rolltotal').textContent=total;
   document.querySelector('#rolldetail').textContent=`${qty}d${sides}: [${rolls.join(', ')}]`;
   addFeed(state,`${c.name} rolled ${qty}d${sides}: [${rolls.join(', ')}] = ${total}.`);
 }
 function rollFormula(formula){
   const m=String(formula||'').trim().match(/^(\d+)\s*[dD]\s*(\d+)(?:\s*([+-])\s*(\d+))?$/);
   if(!m)return null;
   const qty=Math.max(1,Math.min(100,+m[1])),sides=Math.max(2,Math.min(1000,+m[2])),flat=m[4]?(m[3]==='-'?-1:1)*+m[4]:0;
   const rolls=Array.from({length:qty},()=>rollDie(sides)),total=rolls.reduce((a,b)=>a+b,0)+flat;
   return {qty,sides,flat,rolls,total};
 }
 function bindView(){
  document.querySelector('#heal')?.addEventListener('click',()=>{c.hp=Math.min(c.maxHp,c.hp+1);persist();render()});
  document.querySelector('#hurt')?.addEventListener('click',()=>{c.hp=Math.max(0,c.hp-1);persist();render()});
  document.querySelector('#maxHpUp')?.addEventListener('click',()=>{c.healthManualBonus++;c.hp=Math.min(c.hp+1,10+(modFor(Number(c.stats.CON||0))*Number(c.level||1))+Number(c.healthFlatBonus||0)+Number(c.healthManualBonus||0));addFeed(state,`${c.name}'s Max HP received a +1 manual/temporary bonus.`);persist();render()});
  document.querySelector('#maxHpDown')?.addEventListener('click',()=>{c.healthManualBonus--;addFeed(state,`${c.name}'s Max HP received a -1 manual/temporary adjustment.`);persist();render()});
  document.querySelector('#gmNotes')?.addEventListener('change',e=>{c.notes=e.target.value;addFeed(state,`GM Notes updated for ${c.name}.`);persist()});
  document.querySelector('#manaDown')?.addEventListener('click',()=>{c.mana=Math.max(0,c.mana-1);persist();render()});
  document.querySelector('#manaUp')?.addEventListener('click',()=>{c.mana=Math.min(c.maxMana,c.mana+1);persist();render()});
  document.querySelector('#maxManaUp')?.addEventListener('click',()=>{c.manaBonus++;c.maxMana=Number(c.stats.INT||0)+c.manaBonus;c.mana++;addFeed(state,`${c.name}'s Max Mana increased to ${c.maxMana}.`);persist();render()});
  document.querySelector('#maxManaDown')?.addEventListener('click',()=>{if(c.manaBonus>0){c.manaBonus--;c.maxMana=Number(c.stats.INT||0)+c.manaBonus;c.mana=Math.min(c.mana,c.maxMana);addFeed(state,`${c.name}'s Max Mana decreased to ${c.maxMana}.`);persist();render()}});
  document.querySelector('#levelUp')?.addEventListener('click',()=>{c.level++;c.pendingStatPoints+=3;addFeed(state,`${c.name} reached Level ${c.level} and banked 3 stat points (${c.pendingStatPoints} available).`);persist();render()});
  document.querySelector('#levelDown')?.addEventListener('click',()=>{if(c.level<=1)return alert('Level cannot go below 1.');if(c.pendingStatPoints<3)return alert('Level Down is locked because fewer than 3 unspent stat points remain. Reverse assigned stat points first if this level was added by mistake.');c.level--;c.pendingStatPoints-=3;addFeed(state,`${c.name} was corrected to Level ${c.level}; 3 banked stat points removed (${c.pendingStatPoints} remain).`);persist();render()});
  document.querySelector('#floorUp')?.addEventListener('click',()=>{c.floor=Math.min(99,Number(c.floor||1)+1);addFeed(state,`${c.name} advanced to Floor ${c.floor}.`);persist();render()});
  document.querySelector('#floorDown')?.addEventListener('click',()=>{c.floor=Math.max(1,Number(c.floor||1)-1);addFeed(state,`${c.name} was corrected to Floor ${c.floor}.`);persist();render()});
  document.querySelectorAll('[data-use]').forEach(b=>b.onclick=()=>{const x=c.inventory[+b.dataset.use];if(x.qty>0){x.qty--;addFeed(state,`${c.name} used ${x.name}.`);c.inventory=c.inventory.filter(y=>y.qty>0);persist();render()}});
  document.querySelectorAll('[data-invplus]').forEach(b=>b.onclick=()=>{const x=c.inventory[+b.dataset.invplus];x.qty=Number(x.qty||0)+1;addFeed(state,`${c.name} added 1 ${x.name} (×${x.qty}).`);persist();render()});
  document.querySelectorAll('[data-invminus]').forEach(b=>b.onclick=()=>{const x=c.inventory[+b.dataset.invminus];if(Number(x.qty)>1){x.qty--;addFeed(state,`${c.name} removed 1 ${x.name} (×${x.qty}).`)}else{addFeed(state,`${c.name} removed ${x.name} from Inventory.`);c.inventory.splice(+b.dataset.invminus,1)}persist();render()});
  document.querySelectorAll('[data-removeitem]').forEach(b=>b.onclick=()=>{const i=+b.dataset.removeitem,x=c.inventory[i];if(confirm(`Remove all ${x.name} from Inventory?`)){c.inventory.splice(i,1);addFeed(state,`${c.name} removed all ${x.name} from Inventory.`);persist();render()}});
  document.querySelector('#addItem')?.addEventListener('click',()=>{const name=document.querySelector('#itemName').value.trim(),type=document.querySelector('#itemType').value.trim()||'Item',qty=Math.max(1,Math.min(999,Number(document.querySelector('#itemQty').value)||1)),effect=document.querySelector('#itemEffect').value.trim();if(!name)return alert('Enter an item name.');const existing=c.inventory.find(x=>String(x.name).toLowerCase()===name.toLowerCase());if(existing){existing.qty=Number(existing.qty||0)+qty;if(effect)existing.effect=effect;addFeed(state,`${c.name} added ${qty} ${existing.name} (×${existing.qty}).`)}else{c.inventory.push({name,type,qty,effect});addFeed(state,`${c.name} added ${name} ×${qty} to Inventory.`)}persist();render()});
  document.querySelector('#addGear')?.addEventListener('click',()=>{const name=document.querySelector('#gearName').value.trim(),type=document.querySelector('#gearType').value.trim()||'Gear',effect=document.querySelector('#gearEffect').value.trim();if(!name)return alert('Enter an equipment name.');c.equipment.push({name,type,effect});addFeed(state,`${c.name} equipped/recorded ${name}.`);persist();render()});
  document.querySelectorAll('[data-removegear]').forEach(b=>b.onclick=()=>{const i=+b.dataset.removegear,x=c.equipment[i];if(confirm(`Remove ${x.name||x} from Equipment?`)){c.equipment.splice(i,1);addFeed(state,`${c.name} removed ${x.name||x} from Equipment.`);persist();render()}});

  document.querySelector('#rollDice')?.addEventListener('click',()=>doDice(document.querySelector('#diceQty').value,document.querySelector('#diceSides').value));
  document.querySelectorAll('[data-quickdie]').forEach(b=>b.onclick=()=>doDice(1,+b.dataset.quickdie));
  document.querySelectorAll('[data-rollskill]').forEach(b=>b.onclick=()=>{const s=c.skills[+b.dataset.rollskill],base=rollDie(20),bonus=skillBonus(s),total=base+bonus;addFeed(state,`${c.name} — ${s[0]}: d20 ${base} + ${bonus} = ${total}.`);alert(`${c.name} — ${s[0]}\n${base} + ${bonus} = ${total}`)});
  document.querySelectorAll('[data-skillup]').forEach(b=>b.onclick=()=>{const s=c.skills[+b.dataset.skillup];s[1]=Number(s[1]||0)+1;addFeed(state,`${c.name} increased ${s[0]} to Rank ${s[1]}.`);persist();render()});
  document.querySelectorAll('[data-skilldown]').forEach(b=>b.onclick=()=>{const s=c.skills[+b.dataset.skilldown];s[1]=Math.max(0,Number(s[1]||0)-1);addFeed(state,`${c.name} reduced ${s[0]} to Rank ${s[1]}.`);persist();render()});
  document.querySelectorAll('[data-removeskill]').forEach(b=>b.onclick=()=>{const i=+b.dataset.removeskill,s=c.skills[i];if(confirm(`Remove skill ${s[0]}?`)){c.skills.splice(i,1);addFeed(state,`${c.name} lost/removed skill ${s[0]}.`);persist();render()}});
  document.querySelector('#addSkill')?.addEventListener('click',()=>{const name=document.querySelector('#skillName').value.trim(),stat=document.querySelector('#skillStat').value,rank=Math.max(0,Math.min(20,Number(document.querySelector('#skillRank').value)||0));if(!name)return alert('Enter a skill name.');const effect=document.querySelector('#skillEffect').value.trim();c.skills.push([name,rank,stat,effect]);addFeed(state,`${c.name} gained skill ${name} at Rank ${rank}.`);persist();render()});
  document.querySelectorAll('[data-spellup]').forEach(b=>b.onclick=()=>{const s=c.spells[+b.dataset.spellup];s.rank=Number(s.rank||1)+1;addFeed(state,`${c.name} increased spell ${s.name} to Rank ${s.rank}.`);persist();render()});
  document.querySelectorAll('[data-spelldown]').forEach(b=>b.onclick=()=>{const s=c.spells[+b.dataset.spelldown];s.rank=Math.max(0,Number(s.rank||1)-1);addFeed(state,`${c.name} reduced spell ${s.name} to Rank ${s.rank}.`);persist();render()});
  document.querySelectorAll('[data-removespell]').forEach(b=>b.onclick=()=>{const i=+b.dataset.removespell,s=c.spells[i];if(confirm(`Remove spell ${s.name}?`)){c.spells.splice(i,1);addFeed(state,`${c.name} lost/removed spell ${s.name}.`);persist();render()}});
  document.querySelector('#addSpell')?.addEventListener('click',()=>{const name=document.querySelector('#spellName').value.trim();if(!name)return alert('Enter a spell name.');const s={name,distance:document.querySelector('#spellDistance').value.trim(),attribute:document.querySelector('#spellAttribute').value,rank:Math.max(0,Math.min(20,Number(document.querySelector('#spellRank').value)||1)),effect:document.querySelector('#spellEffect').value.trim(),damage:document.querySelector('#spellDamage').value.trim().toUpperCase(),manaCost:Math.max(0,Number(document.querySelector('#spellManaCost').value)||0)};c.spells.push(s);addFeed(state,`${c.name} gained spell ${name} at Rank ${s.rank}.`);persist();render()});
  document.querySelectorAll('[data-spellattack]').forEach(b=>b.onclick=()=>{const s=c.spells[+b.dataset.spellattack],cost=Number(s.manaCost||0);if(c.mana<cost)return alert(`Not enough Mana. ${s.name} costs ${cost}; ${c.mana} available.`);c.mana-=cost;const base=rollDie(20),attr=s.attribute||'INT',bonus=modFor(Number(c.stats[attr]||0)),total=base+bonus;addFeed(state,`${c.name} cast ${s.name} for ${cost} Mana (${c.mana}/${c.maxMana} remaining) — attack: d20 ${base} + ${attr} mod ${bonus} = ${total}.`);persist();render();alert(`${s.name} ATTACK / TO-HIT\nD20 ${base} + ${attr} modifier ${bonus} = ${total}\nMana: ${c.mana}/${c.maxMana}`)});
  document.querySelectorAll('[data-spelldamage]').forEach(b=>b.onclick=()=>{const s=c.spells[+b.dataset.spelldamage],r=rollFormula(s.damage);if(!r)return alert('Damage must look like 1D8, 2D6, or 2D6+3.');addFeed(state,`${c.name} — ${s.name} damage ${s.damage}: [${r.rolls.join(', ')}]${r.flat?` ${r.flat>0?'+':'-'} ${Math.abs(r.flat)}`:''} = ${r.total}.`);alert(`${s.name} DAMAGE\n${s.damage}: [${r.rolls.join(', ')}]${r.flat?` ${r.flat>0?'+':'-'} ${Math.abs(r.flat)}`:''} = ${r.total}`)});

  document.querySelectorAll('[data-read]').forEach(b=>b.onclick=()=>{c.messages[+b.dataset.read].read=true;persist();render()});
  document.querySelectorAll('[data-queststatus]').forEach(s=>s.onchange=()=>{const q=c.quests[+s.dataset.queststatus],old=q.status||'ACTIVE';q.status=s.value;addFeed(state,`${c.name} changed quest "${q.name}" from ${old} to ${q.status}.`);persist();render()});
  document.querySelectorAll('[data-claimstatus]').forEach(s=>s.onchange=()=>{const a=c.achievements[+s.dataset.claimstatus],old=a.claimStatus||'UNCLAIMED';a.claimStatus=s.value;addFeed(state,`${c.name} marked achievement reward "${a.name}" ${a.claimStatus}.`);persist();render()});
 }
 render()
})().catch(e=>document.querySelector('#app').innerHTML=`<div class="notice">${esc(e.message)}</div>`);
