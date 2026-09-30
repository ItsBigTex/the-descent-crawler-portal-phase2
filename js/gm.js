
(async()=>{
 let state=await getState();
 const party=document.querySelector('#party'),feed=document.querySelector('#feed');
 const selects=['who','questWho','messageWho','lootWho','noteWho'].map(id=>document.querySelector('#'+id));
 const lootProfiles={
  phillip:'Runs a collectibles/game store; long shifts; teaches card games; strong sales/social skills, number crunching, business, fantasy/game lore, and detail-heavy analysis.',
  philip:'Runs a collectibles/game store; long shifts; teaches card games; strong sales/social skills, number crunching, business, fantasy/game lore, and detail-heavy analysis.',
  jarod:'Repair and maintenance technician with nuclear electronics/submarine background; engineering, troubleshooting, woodworking, schematics, shooting, driving, hunting and strategy.',
  marvin:'Horror and Warhammer fan; painting and war-game strategy; lower physical confidence but useful tactical/genre instincts.',
  harold:'Animal handling and mechanical knowledge; corrections/self-defense experience; hobbies include card games, knife making and video games.',
  mike:'Paranormal/cryptid/alien/ghost enthusiast; strong agility/reflexes and problem solving; conspiracy and ghost-hunting interests.',
  brad:'Hands-on communications/electronics/computers/security-tech troubleshooter; gaming, hunting, camping, radios and tabletop RPGs; calm under pressure and resourceful.'
 };
 function normalize(){state.crawlers.forEach(c=>{if(!Array.isArray(c.messages))c.messages=[];if(!Array.isArray(c.quests))c.quests=[];if(c.pendingStatPoints==null)c.pendingStatPoints=0})}
 function render(){
  normalize();
  party.innerHTML=state.crawlers.map(c=>`<div class="panel"><div class="tag">${esc(c.systemTitle)}</div><h2>${esc(c.name)}</h2><div class="row"><b>HP ${c.hp}/${c.maxHp}</b><span class="pill">LV ${c.level}</span></div><div class="row"><span class="muted small">QUESTS ${c.quests.filter(q=>String(q.status).toLowerCase()!=='complete').length}</span><span class="muted small">UNREAD MSG ${(c.messages||[]).filter(m=>!m.read).length}</span></div><div class="controls"><button data-hp="${c.id}" data-d="-1">-1 HP</button><button data-hp="${c.id}" data-d="1">+1 HP</button><a class="btn" href="./character.html?id=${c.id}">OPEN</a></div></div>`).join('');
  const opts=state.crawlers.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');
  selects.forEach(s=>s.innerHTML=opts);
  feed.innerHTML=state.feed.length?state.feed.map(x=>`<div class="feeditem"><div>${esc(x.text)}</div><div class="tag">${esc(x.at)}</div></div>`).join(''):'<p class="muted">No activity yet.</p>';
  document.querySelectorAll('[data-hp]').forEach(b=>b.onclick=()=>{const c=state.crawlers.find(x=>x.id===b.dataset.hp),d=+b.dataset.d;c.hp=Math.max(0,Math.min(c.maxHp,c.hp+d));addFeed(state,`${c.name} ${d>0?'healed':'took damage'} (${d>0?'+':''}${d} HP).`);state=readState();render()})
 }
 document.querySelector('#award').onclick=()=>{
  const c=state.crawlers.find(x=>x.id===document.querySelector('#who').value),name=document.querySelector('#awardName').value.trim(),reward=document.querySelector('#awardReward').value.trim();
  if(!name)return alert('Enter an achievement name.');
  c.achievements.push({name,reward,claimStatus:'UNCLAIMED'});addFeed(state,`${c.name} unlocked achievement: ${name}.`);state=readState();
  document.querySelector('#awardName').value='';document.querySelector('#awardReward').value='';render()
 };
 document.querySelector('#assignQuest').onclick=()=>{
  const c=state.crawlers.find(x=>x.id===document.querySelector('#questWho').value),name=document.querySelector('#questName').value.trim(),detail=document.querySelector('#questDetail').value.trim();
  if(!name)return alert('Enter a quest name.');
  c.quests.push({name,detail,status:'ACTIVE'});addFeed(state,`${c.name} received quest: ${name}.`);state=readState();
  document.querySelector('#questName').value='';document.querySelector('#questDetail').value='';render()
 };
 document.querySelector('#sendMessage').onclick=()=>{
  const c=state.crawlers.find(x=>x.id===document.querySelector('#messageWho').value),text=document.querySelector('#messageText').value.trim();
  if(!text)return alert('Enter a System message.');
  c.messages=c.messages||[];c.messages.unshift({text,at:new Date().toLocaleString(),read:false});
  addFeed(state,`Private System message queued for ${c.name}.`);state=readState();document.querySelector('#messageText').value='';render()
 };

 document.querySelector('#loadNotes').onclick=()=>{const c=state.crawlers.find(x=>x.id===document.querySelector('#noteWho').value);document.querySelector('#noteText').value=c.notes||''};
 document.querySelector('#deployNotes').onclick=()=>{const c=state.crawlers.find(x=>x.id===document.querySelector('#noteWho').value);c.notes=document.querySelector('#noteText').value;addFeed(state,`GM Notes deployed to ${c.name}.`);state=readState();render()};

 function localLoot(c,tier,request){
   const req=String(request||'').trim(),q=req.toLowerCase(),id=String(c.id||'').toLowerCase();
   const pick=a=>a[Math.floor(Math.random()*a.length)], prefixes={phillip:["Appraiser's","Dealer's","Curator's"],philip:["Appraiser's","Dealer's","Curator's"],jarod:["Field Engineer's","Submariner's","Fixer's"],marvin:["Genre Savant's","Horror Nerd's","Miniature General's"],harold:["Handler's","Instigator's","Maker's"],mike:["Anomaly Hunter's","Cryptid Spotter's","Paranormal Investigator's"],brad:["Troubleshooter's","Signal Tech's","Field Technician's"]};
   const prefix=pick(prefixes[id]||["Crawler's","Dungeon-Issue","Questionably Certified"]);
   const theme=/demonic|hell|infernal/.test(q)?'demonic':/cursed|curse|haunted/.test(q)?'cursed':/serious|grim|military/.test(q)?'serious':/silly|funny|comedic|ridiculous|absurd/.test(q)?'funny':'system';
   let kind='utility',slot='Utility',bases=['Multitool','Field Device','Utility Rig'];
   const patterns=[[/monocle|eyepiece|lens/,['utility','Face / Accessory',['Monocle','Inspection Lens','Appraisal Eyepiece']]],[/cloak|cape|mantle/,['gear','Back / Clothing',['Cloak','Mantle','Cape']]],[/armor|chest|vest|jacket/,['armor','Torso / Armor',['Reinforced Vest','Crawler Jacket','Protective Harness']]],[/boot|shoe/,['gear','Feet',['Dungeon Boots','Crawler Boots','Hazard Stompers']]],[/glove|gauntlet/,['gear','Hands',['Specialist Gloves','Utility Gauntlets','Work Gloves']]],[/weapon|sword|axe|hammer|gun|rifle|bow|blade/,['weapon','Hands / Weapon',['Signature Weapon','Crawler Weapon','Problem Solver']]],[/potion|healing|heal/,['consumable','Consumable',['Healing Potion','Recovery Tonic','Emergency Health Draught']]],[/mana/,['consumable','Consumable',['Mana Potion','Arcane Refill','Mana Tonic']]],[/ring/,['accessory','Accessory',['Ring','Signet','Band']]],[/amulet|necklace/,['accessory','Accessory',['Amulet','Pendant','Charm']]],[/tool|kit|repair/,['utility','Utility / Tool',['Multitool','Repair Kit','Diagnostic Tool']]]];
   for(const [rx,v] of patterns)if(rx.test(q)){kind=v[0];slot=v[1];bases=v[2];break}
   const base=pick(bases), adjs={Bronze:['Serviceable','Slightly Improved','Budget'],Silver:['Enhanced','Polished','Upgraded'],Gold:['Premium','Golden','Superior'],Platinum:['Elite','Exceptional','Overqualified'],Legendary:['Legendary','Ridiculously Capable','Audience-Approved'],Celestial:['Celestial','Impossible','System-Blessed'],Custom:['Custom','Bespoke','Suspiciously Specific']};
   const adj=pick(adjs[tier]||adjs.Custom), item=`${adj} ${prefix} ${base}`;
   let effect;
   if(/apprais|value|worth|inspect|identify/.test(q)) effect=pick([`Inspecting an item provides a mostly-accurate estimate of its usefulness, rarity, and approximate value. Hidden properties and exact market prices are not guaranteed.`,`When ${c.name} deliberately examines an object, the item supplies an appraisal that is usually useful and occasionally sourced from expertise of deeply questionable quality.`,`Grants improved item inspection and approximate valuation. The System may identify obvious rarity and utility while leaving particularly sneaky properties undisclosed.`]);
   else if(/stealth|hide|sneak|invis/.test(q)) effect=pick([`Provides a modest situational benefit to hiding and moving unnoticed; exact bonus is GM-approved.`,`Helps ${c.name} avoid casual observation when deliberately sneaking or concealing themselves.`,`Improves stealth in favorable conditions, but does not make the crawler invisible.`]);
   else if(/repair|fix|engineer|technical|electronic/.test(q)) effect=pick([`Provides a modest benefit when diagnosing or repairing appropriate technical systems.`,`Assists with field repairs, diagnostics, and improvised technical work; exact bonus is GM-approved.`,`Highlights obvious faults and useful components in mechanical or electronic systems.`]);
   else if(/protect|armor|defen|resist/.test(q)) effect=pick([`Provides modest ${tier}-appropriate protection; exact DR or resistance is set by the GM.`,`Reduces a narrow category of incoming harm appropriate to the item's design; GM sets the final numeric benefit.`,`Offers practical defensive assistance without replacing proper armor.`]);
   else if(/damage|attack|weapon|hit/.test(q)) effect=pick([`Provides a modest offensive benefit appropriate to ${tier} tier; final attack or damage bonus requires GM approval.`,`Improves one narrow aspect of ${c.name}'s attacks without replacing their normal combat Skill.`,`Adds a small situational combat advantage chosen by the GM when awarded.`]);
   else effect=pick([`Provides a modest ${tier}-tier utility benefit related to the requested ${base.toLowerCase()}.`,`Offers a useful situational advantage consistent with ${c.name}'s role and the GM's request.`,`Performs the requested utility function with a small crawler-specific benefit; exact numeric bonus is GM-approved.`]);
   const funny=[`It looks like someone gave a product designer unlimited caffeine and exactly twelve minutes of supervision. The System claims it passed quality assurance. The quality assurance department was unavailable for comment.`,`The device activates with the smug little click of something that knows it has a warranty you will never successfully redeem. Somewhere inside, a tiny mechanism applauds itself.`,`The System calls this professional equipment. The System also considers televised mortal peril a sustainable business model, so calibrate your expectations accordingly.`];
   const desc=theme==='funny'?pick(funny):theme==='demonic'?pick([`The item is warm before you touch it. Thin symbols crawl across its surface whenever it works. The System insists this is normal. Something behind the symbols disagrees.`,`A faint sulfur smell follows the item despite there being no obvious source. It performs its task eagerly. Perhaps too eagerly.`]):theme==='cursed'?pick([`At first glance it looks ordinary. At second glance, you notice it was already looking back. The System has classified it as “probably fine.”`,`The item works exactly as advertised, which would be reassuring if it did not occasionally whisper the user's name when nobody is touching it.`]):theme==='serious'?pick([`Purpose-built, durable, and stripped of unnecessary ornamentation. The System documentation is unusually concise: maintain it, use it correctly, and it may keep you alive.`,`A practical piece of Dungeon equipment engineered for reliability rather than spectacle. Every component has a job and none of them appear interested in jokes.`]):pick([`The Dungeon System produced this specifically for ${c.name}. That is either flattering or deeply concerning. Possibly both.`,`The item looks almost normal until the System overlay identifies several features that definitely were not there a moment ago.`]);
   return {title:`${tier} ${base} Reward`,contents:`${item}\nCategory: ${kind==='consumable'?'Consumable':'Equipment / '+slot}\nTier: ${tier}\nEffect: ${effect}\nSystem Description: ${desc}`};
 }
 document.querySelector('#generateLoot').onclick=()=>{
   const c=state.crawlers.find(x=>x.id===document.querySelector('#lootWho').value),tier=document.querySelector('#lootTier').value,req=document.querySelector('#lootPrompt').value.trim();
   const out=localLoot(c,tier,req);document.querySelector('#lootTitle').value=out.title;document.querySelector('#lootContents').value=out.contents;addFeed(state,`Generated ${tier} reward draft for ${c.name}.`);state=readState();render();
 };
 document.querySelector('#buildLootPrompt').onclick=()=>{
   const c=state.crawlers.find(x=>x.id===document.querySelector('#lootWho').value);
   const tier=document.querySelector('#lootTier').value,request=document.querySelector('#lootPrompt').value.trim()||'Generate a useful, flavorful reward appropriate to this crawler.';
   const profile=lootProfiles[c.id]||lootProfiles[String(c.name).toLowerCase()]||'Use the crawler sheet, current skills, equipment and play style as context.';
   const skills=(c.skills||[]).map(s=>`${s[0]} Rank ${s[1]}`).join(', ');
   const equipment=(c.equipment||[]).map(x=>x.name||x).join(', ')||'none recorded';
   const inventory=(c.inventory||[]).map(x=>`${x.name} x${x.qty}`).join(', ')||'empty';
   const prompt=`You are the Dungeon System loot designer for a Dungeon Crawler Carl-inspired tabletop campaign. Generate a ${tier} loot box/reward for ${c.name} (Level ${c.level}, Floor ${c.floor}).\n\nPLAYER-SAFE REAL-WORLD PROFILE:\n${profile}\n\nCURRENT SHEET:\nStats: ${Object.entries(c.stats).map(([k,v])=>`${k} ${v}`).join(', ')}\nSkills: ${skills}\nEquipment: ${equipment}\nInventory: ${inventory}\n\nGM REQUEST:\n${request}\n\nDESIGN RULES:\n- Keep the reward appropriate to a ${tier} tier and the crawler's current floor/level.\n- Personalize usefulness around their job, practical skills, hobbies, and current build without using private fears, trauma, off-limits material, or sensitive personal information.\n- Reward categories may include consumables, healing/mana resources, permanent or temporary upgrades, armor, gear, weapons, utility items, scrolls/tomes, currency, crafting materials, or intentionally strange Dungeon items.\n- Avoid simply duplicating gear already listed unless an upgrade is the point.\n- Give each item: NAME, CATEGORY, RARITY/TIER, MECHANICAL EFFECT, QUANTITY, and a short sarcastic SYSTEM DESCRIPTION.\n- Finish with a compact LOOT BOX CONTENTS list suitable for pasting into the GM console.\n- Do not invent a rules mechanic without labeling it HOMEBREW/GM APPROVAL REQUIRED.`;
   document.querySelector('#lootBuiltPrompt').value=prompt;document.querySelector('#lootPromptResult').classList.remove('hidden');
 };
 document.querySelector('#copyLootPrompt').onclick=async()=>{const el=document.querySelector('#lootBuiltPrompt');try{await navigator.clipboard.writeText(el.value);document.querySelector('#copyLootPrompt').textContent='COPIED';setTimeout(()=>document.querySelector('#copyLootPrompt').textContent='COPY PROMPT',1200)}catch{el.select();document.execCommand('copy')}};

 document.querySelector('#awardLoot').onclick=()=>{
   const c=state.crawlers.find(x=>x.id===document.querySelector('#lootWho').value),title=document.querySelector('#lootTitle').value.trim(),contents=document.querySelector('#lootContents').value.trim();
   if(!title||!contents)return alert('Generate or enter a reward title and contents first.');
   c.achievements.push({name:title,reward:contents,claimStatus:'CLAIMED'});
   const blocks=contents.split(/\n\s*\n/).filter(Boolean);
   blocks.forEach(block=>{const lines=block.split('\n'),name=(lines[0]||'').trim();if(!name||/^GM Request Context:/i.test(name))return;const cat=(block.match(/Category:\s*(.+)/i)||[])[1]||'';const effect=(block.match(/Effect:\s*(.+)/i)||[])[1]||'';const qm=name.match(/^(.*?)(?:\s*[×x]\s*(\d+))$/i),base=(qm?qm[1]:name).trim(),qty=qm?+qm[2]:1;if(/equipment|armor|weapon|gear|utility/i.test(cat)&&!/consumable/i.test(cat)){c.equipment.push({name:base,type:cat,effect})}else{const ex=c.inventory.find(x=>String(x.name).toLowerCase()===base.toLowerCase());if(ex)ex.qty=Number(ex.qty||0)+qty;else c.inventory.push({name:base,type:cat||'Reward',qty})}});
   addFeed(state,`${c.name} claimed ${title}; generated contents were added to Equipment/Inventory.`);saveState(state);state=readState();document.querySelector('#lootTitle').value='';document.querySelector('#lootContents').value='';render();
 };
 document.querySelector('#stageLoot').onclick=()=>{
   const c=state.crawlers.find(x=>x.id===document.querySelector('#lootWho').value),name=document.querySelector('#lootTitle').value.trim(),reward=document.querySelector('#lootContents').value.trim();
   if(!name||!reward)return alert('Enter both a reward title and generated contents.');
   c.achievements.push({name,reward,claimStatus:'UNCLAIMED'});addFeed(state,`${c.name} received staged loot reward: ${name}.`);state=readState();document.querySelector('#lootTitle').value='';document.querySelector('#lootContents').value='';render();
 };
 
 document.querySelector('#reset').onclick=async()=>{if(confirm('Reset all Phase 1 local changes on this browser?')){localStorage.removeItem(STORAGE_KEY);state=await getState();render()}};
 render()
})().catch(e=>document.querySelector('#party').innerHTML=`<div class="notice">${esc(e.message)}</div>`);
