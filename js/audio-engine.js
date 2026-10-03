(()=>{
const KEY='descentAudioV4_3';
const defaults={master:.8,voice:.9,sfx:.8,ambience:.45,voiceEnabled:true,sfxEnabled:true};
let ctx=null,ambience=null;
function settings(){try{return {...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return {...defaults}}}
function save(x){localStorage.setItem(KEY,JSON.stringify({...settings(),...x}))}
function audioCtx(){if(!ctx)ctx=new (window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')ctx.resume().catch(()=>{});return ctx}
function gain(v){return Math.max(0,Math.min(1,Number(v)||0))*settings().master}
function tone(freq=440,dur=.12,type='sine',vol=.2,delay=0){
 if(!settings().sfxEnabled)return;
 try{const c=audioCtx(),o=c.createOscillator(),g=c.createGain(),t=c.currentTime+delay;o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0001,gain(vol*settings().sfx)),t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(c.destination);o.start(t);o.stop(t+dur+.03)}catch{}
}
function cue(kind='system_announcement'){
 const k=String(kind).toLowerCase();
 if(k.includes('achievement')){tone(392,.13,'square',.16);tone(523,.18,'square',.14,.12);tone(784,.28,'sawtooth',.11,.27)}
 else if(k.includes('quest')){tone(330,.14,'triangle',.14);tone(440,.22,'triangle',.12,.14)}
 else if(k.includes('loot')){tone(262,.12,'square',.13);tone(392,.12,'square',.13,.11);tone(659,.25,'triangle',.13,.22)}
 else if(k.includes('health')||k.includes('dying')||k.includes('warning')){tone(180,.18,'sawtooth',.16);tone(150,.22,'sawtooth',.14,.22)}
 else if(k.includes('level')){[262,330,392,523].forEach((f,i)=>tone(f,.18,'triangle',.13,i*.11))}
 else {tone(240,.08,'square',.12);tone(480,.12,'triangle',.1,.08)}
}
function bounce(intensity=.5){tone(75+intensity*55,.045,'triangle',.07*intensity)}
function speak(text,opts={}){
 const s=settings();if(!s.voiceEnabled||!('speechSynthesis'in window)||!text)return;
 try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(String(text));u.rate=opts.rate||.92;u.pitch=opts.pitch||.72;u.volume=gain(s.voice);const voices=speechSynthesis.getVoices();const preferred=voices.find(v=>/english/i.test(v.name)&&/male|david|mark|daniel|google us/i.test(v.name))||voices.find(v=>/^en/i.test(v.lang));if(preferred)u.voice=preferred;speechSynthesis.speak(u)}catch{}
}
function narrateEvent(n){cue(n.kind||n.event_type);const label=n.kind||'SYSTEM';const words=[label,n.title,n.body].filter(Boolean).join('. ');setTimeout(()=>speak(words),180)}
function startAmbience(){
 const s=settings();if(ambience){stopAmbience();return false}
 try{const c=audioCtx(),src=c.createBufferSource(),buf=c.createBuffer(1,c.sampleRate*2,c.sampleRate),data=buf.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.18;src.buffer=buf;src.loop=true;const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=180;const g=c.createGain();g.gain.value=gain(s.ambience*.16);src.connect(filter).connect(g).connect(c.destination);src.start();ambience={src,g};return true}catch{return false}
}
function stopAmbience(){try{ambience?.src.stop()}catch{}ambience=null}
function openSettings(){
 let m=document.querySelector('#audioSettings43');if(!m){m=document.createElement('div');m.id='audioSettings43';m.className='popupback';document.body.appendChild(m)}
 const s=settings();m.innerHTML=`<div class="systempopup audio43-panel"><div class="tag red">SYSTEM AUDIO ENGINE // 4.3</div><h2>Audio Control</h2>
 <label class="audio43-row">MASTER <input data-audio="master" type="range" min="0" max="1" step=".05" value="${s.master}"><span>${Math.round(s.master*100)}%</span></label>
 <label class="audio43-row">VOICE <input data-audio="voice" type="range" min="0" max="1" step=".05" value="${s.voice}"><span>${Math.round(s.voice*100)}%</span></label>
 <label class="audio43-row">SFX <input data-audio="sfx" type="range" min="0" max="1" step=".05" value="${s.sfx}"><span>${Math.round(s.sfx*100)}%</span></label>
 <label class="audio43-row">AMBIENCE <input data-audio="ambience" type="range" min="0" max="1" step=".05" value="${s.ambience}"><span>${Math.round(s.ambience*100)}%</span></label>
 <div class="controls"><button id="audio43Voice">${s.voiceEnabled?'VOICE ON':'VOICE OFF'}</button><button id="audio43Sfx">${s.sfxEnabled?'SFX ON':'SFX OFF'}</button><button id="audio43Test" class="primary">TEST SYSTEM</button><button id="audio43Ambience">${ambience?'STOP AMBIENCE':'START AMBIENCE'}</button></div>
 <p class="muted small">Voice uses the browser's local speech synthesis. No voice provider or API key is required. SFX and low ambience are generated locally with Web Audio.</p><button id="audio43Close">CLOSE</button></div>`;
 m.classList.remove('hidden');
 m.querySelectorAll('[data-audio]').forEach(el=>el.oninput=()=>{save({[el.dataset.audio]:Number(el.value)});el.nextElementSibling.textContent=Math.round(el.value*100)+'%';if(ambience&&el.dataset.audio==='ambience')ambience.g.gain.value=gain(Number(el.value)*.16)});
 m.querySelector('#audio43Voice').onclick=()=>{save({voiceEnabled:!settings().voiceEnabled});openSettings()};
 m.querySelector('#audio43Sfx').onclick=()=>{save({sfxEnabled:!settings().sfxEnabled});openSettings()};
 m.querySelector('#audio43Test').onclick=()=>{cue('achievement');setTimeout(()=>speak('System audio online. Try not to make this embarrassing.'),300)};
 m.querySelector('#audio43Ambience').onclick=()=>{ambience?stopAmbience():startAmbience();openSettings()};
 m.querySelector('#audio43Close').onclick=()=>m.classList.add('hidden');
}
window.addEventListener('pointerdown',()=>{try{audioCtx()}catch{}},{once:true});
window.DescentAudio={settings,save,cue,bounce,speak,narrateEvent,startAmbience,stopAmbience,openSettings};
})();