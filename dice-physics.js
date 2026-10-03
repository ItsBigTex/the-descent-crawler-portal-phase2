(()=>{
let running=false,raf=0;
const shapes={4:3,6:4,8:3,10:5,12:6,20:6};
function ensure(){
 let o=document.querySelector('#dicePhysics43');if(o)return o;
 o=document.createElement('div');o.id='dicePhysics43';o.className='dice43 hidden';
 o.innerHTML='<canvas></canvas><div class="dice43-hud"><div class="tag red" id="dice43Label">SYSTEM DICE</div><div id="dice43Detail" class="system"></div><div id="dice43Total" class="dice43-total"></div><div id="dice43Flavor" class="system"></div><button id="dice43Close">DISMISS</button></div>';
 document.body.appendChild(o);o.querySelector('#dice43Close').onclick=()=>{o.classList.add('hidden');cancelAnimationFrame(raf);running=false};return o
}
function poly(ctx,x,y,r,n,rot){
 ctx.beginPath();for(let i=0;i<n;i++){const a=rot+i*Math.PI*2/n-Math.PI/2,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath()
}
function roll({rolls=[1],sides=20,label='SYSTEM DICE',bonus=0,total=null,detail=''}) {
 const o=ensure(),canvas=o.querySelector('canvas'),ctx=canvas.getContext('2d'),dpr=Math.min(2,devicePixelRatio||1);
 o.classList.remove('hidden');o.querySelector('#dice43Label').textContent=label;o.querySelector('#dice43Detail').textContent='ROLLING…';o.querySelector('#dice43Total').textContent='';o.querySelector('#dice43Flavor').textContent='';
 const resize=()=>{canvas.width=innerWidth*dpr;canvas.height=innerHeight*dpr;canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';ctx.setTransform(dpr,0,0,dpr,0,0)};resize();
 const W=innerWidth,H=innerHeight,count=Math.min(8,rolls.length),r=Math.max(32,Math.min(54,W/(count*3.4)));
 const dice=rolls.slice(0,count).map((value,i)=>({value,x:W*.12+i*(W*.76/Math.max(1,count-1)),y:-r-Math.random()*H*.15,vx:(Math.random()-.5)*520,vy:220+Math.random()*260,rot:Math.random()*6,spin:(Math.random()-.5)*14,bounces:0,settled:false}));
 const start=performance.now(),duration=2200;running=true;
 function frame(now){
  if(!running)return;const dt=Math.min(.028,(now-(frame.last||now))/1000);frame.last=now;ctx.clearRect(0,0,W,H);
  ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(0,0,W,H);
  for(const d of dice){
   if(!d.settled){d.vy+=1250*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;d.rot+=d.spin*dt;
    if(d.x<r){d.x=r;d.vx=Math.abs(d.vx)*.72;d.spin*=-.82}
    if(d.x>W-r){d.x=W-r;d.vx=-Math.abs(d.vx)*.72;d.spin*=-.82}
    const floor=H*.72;
    if(d.y>floor-r){d.y=floor-r;if(Math.abs(d.vy)>85){d.vy=-Math.abs(d.vy)*(.38+Math.random()*.12);d.vx*=.78;d.spin*=.72;d.bounces++;window.DescentAudio?.bounce(Math.min(1,Math.abs(d.vy)/600))}else{d.vy=0;d.vx*=.86;d.spin*=.82;if(Math.abs(d.vx)<8&&Math.abs(d.spin)<.18)d.settled=true}}
   }
   const n=shapes[sides]||6;ctx.save();ctx.shadowColor='#000';ctx.shadowBlur=18;ctx.shadowOffsetY=10;poly(ctx,d.x,d.y,r,n,d.rot);ctx.fillStyle='#d9dde1';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#707981';ctx.stroke();ctx.shadowColor='transparent';
   poly(ctx,d.x,d.y,r*.72,n,d.rot+Math.PI/n);ctx.strokeStyle='#a4abb1';ctx.lineWidth=1.5;ctx.stroke();
   ctx.fillStyle='#080a0c';ctx.font=`900 ${Math.round(r*.62)}px ui-monospace`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(d.value),d.x,d.y);ctx.restore()
  }
  const elapsed=now-start;if(elapsed<duration||dice.some(d=>!d.settled)){raf=requestAnimationFrame(frame)}
  else{const sum=rolls.reduce((a,b)=>a+b,0),finalTotal=total??sum+Number(bonus||0);o.querySelector('#dice43Detail').textContent=detail||`${rolls.length}d${sides}: [${rolls.join(', ')}]${bonus?` + ${bonus}`:''}`;o.querySelector('#dice43Total').textContent=String(finalTotal);o.querySelector('#dice43Flavor').textContent=sides===20&&rolls.length===1&&rolls[0]===20?'NATURAL 20. THE SYSTEM IS MILDLY IMPRESSED.':sides===20&&rolls.length===1&&rolls[0]===1?'NATURAL 1. ENTERTAINING.':'';window.DescentAudio?.cue(rolls[0]===20?'level_gained':'dice_result')}
 }
 cancelAnimationFrame(raf);raf=requestAnimationFrame(frame)
}
window.DescentDice={roll};
})();
