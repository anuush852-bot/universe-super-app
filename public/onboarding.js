/* UniVerse – first-launch onboarding (Zomato / Amazon style)
   1. Notification permission  2. Location (GPS or manual)  3. Sign in / Skip
   Works in: Android app (Capacitor plugins) and normal browser/PWA (web APIs). */
(function(){
const LS=localStorage,K_LOC='uv_loc',K_ONB='uv_onb';
const CAP=window.Capacitor,PL=(CAP&&CAP.Plugins)||{};
const h=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const q=s=>document.querySelector(s);
const say=m=>{typeof toast==='function'?toast(m):alert(m)};

/* ---------- saved location ---------- */
const getLoc=()=>{try{return JSON.parse(LS[K_LOC]||'null')}catch(e){return null}};
function setLoc(l,quiet){
  const old=getLoc();LS[K_LOC]=JSON.stringify(l);paintLoc();
  const p=q('#pickup');if(p&&!p.value)p.value=l.label;
  if(!quiet&&(!old||old.label!==l.label))Notify.show('📍 Location set',('Delivering to '+l.label));
}
function paintLoc(){
  const l=getLoc(),c=q('#locChip');if(!c)return;
  c.innerHTML=l?'📍 <span>'+h(l.label)+'</span> ▾':'📍 <span>Set location</span> ▾';
  c.classList.toggle('need',!l);
}

/* ---------- notifications ---------- */
const Notify={
  async ask(){
    try{
      if(PL.LocalNotifications){
        const p=await PL.LocalNotifications.checkPermissions();
        if(p.display==='granted')return true;
        if(p.display==='denied')return false;
        return (await PL.LocalNotifications.requestPermissions()).display==='granted';
      }
      if('Notification' in window){
        if(Notification.permission==='granted')return true;
        if(Notification.permission==='denied')return false;
        return (await Notification.requestPermission())==='granted';
      }
    }catch(e){}
    return false;
  },
  async show(title,body){
    if(navigator.vibrate)try{navigator.vibrate([200,100,200])}catch(e){}
    try{
      if(PL.LocalNotifications){
        await PL.LocalNotifications.schedule({notifications:[{id:Math.floor(Date.now()%2147483000),title,body,schedule:{at:new Date(Date.now()+300)}}]});
        return;
      }
      if('Notification' in window&&Notification.permission==='granted'){
        const reg=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration();
        if(reg&&reg.showNotification){await reg.showNotification(title,{body,icon:'/pwa-192.png',badge:'/pwa-192.png',vibrate:[200,100,200]});return}
        new Notification(title,{body,icon:'/pwa-192.png'});return;
      }
    }catch(e){}
    say(title+' – '+body); // fallback: in-app banner
  }
};

/* ---------- GPS + address lookup ---------- */
async function getPos(){
  if(PL.Geolocation){
    let p=await PL.Geolocation.checkPermissions();
    if(p.location!=='granted'&&p.coarseLocation!=='granted'){
      p=await PL.Geolocation.requestPermissions();
      if(p.location!=='granted'&&p.coarseLocation!=='granted')throw {code:1};
    }
    const r=await PL.Geolocation.getCurrentPosition({enableHighAccuracy:true,timeout:15000});
    return {lat:r.coords.latitude,lng:r.coords.longitude};
  }
  return new Promise((ok,no)=>{
    if(!navigator.geolocation)return no({code:0});
    navigator.geolocation.getCurrentPosition(p=>ok({lat:p.coords.latitude,lng:p.coords.longitude}),no,{enableHighAccuracy:true,timeout:15000,maximumAge:60000});
  });
}
function shape(j){
  const a=j.address||{};
  const area=a.suburb||a.neighbourhood||a.residential||a.village||a.city_district||'';
  const city=a.city||a.town||a.county||a.state_district||a.state||'';
  const label=[area,city].filter(Boolean).join(', ')||String(j.display_name||'').split(',').slice(0,2).join(',').trim()||'Selected location';
  return {label,addr:j.display_name||label,pin:a.postcode||''};
}
async function reverse(lat,lng){
  try{
    const r=await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&lat='+lat+'&lon='+lng,{headers:{'Accept-Language':'en'}});
    return shape(await r.json());
  }catch(e){return {label:'Current location',addr:'',pin:''}}
}
async function detect(){ // returns saved loc or throws
  const p=await getPos();
  const a=await reverse(p.lat,p.lng);
  const l={lat:p.lat,lng:p.lng,label:a.label,addr:a.addr,pin:a.pin,auto:1,ts:Date.now()};
  setLoc(l);return l;
}
const errMsg=e=>e&&e.code===1?'Location permission band hai. Phone Settings → App → Permissions mein allow karein, ya manually enter karein.'
  :e&&e.code===0?'Is device par GPS available nahi hai. Manually enter karein.'
  :'Location nahi mil payi. GPS on karke dobara try karein, ya manually enter karein.';

/* ---------- onboarding screen ---------- */
const ART=`<svg viewBox="0 0 320 270" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs><radialGradient id="og" cx="50%" cy="55%" r="55%"><stop offset="0" stop-color="#7657ff" stop-opacity=".35"/><stop offset="1" stop-color="#7657ff" stop-opacity="0"/></radialGradient></defs>
<ellipse cx="160" cy="165" rx="150" ry="100" fill="url(#og)"/>
<g stroke="#2b3350" stroke-width="2" fill="#141a2b"><path d="M160 90 L290 160 L160 235 L30 160Z"/><path d="M160 112 L250 160 L160 212 L70 160Z" fill="#181f33"/></g>
<g fill="#222a44"><path d="M95 150l22-12 22 12-22 12z"/><path d="M185 182l22-12 22 12-22 12z"/><path d="M200 135l16-9 16 9-16 9z"/></g>
<g class="onb-fl"><text x="62" y="130" font-size="34">🍔</text><text x="232" y="112" font-size="34">🍕</text><text x="128" y="232" font-size="34">🛍️</text></g>
<g class="onb-pin"><path d="M160 40c-20 0-36 15-36 34 0 26 36 62 36 62s36-36 36-62c0-19-16-34-36-34z" fill="#ff5c7a"/><circle cx="160" cy="74" r="13" fill="#fff"/></g>
<ellipse cx="160" cy="146" rx="22" ry="7" fill="#ff5c7a" opacity=".35"/></svg>`;

let busy=false;
function showOnb(){
  if(q('#onb'))return;
  const d=document.createElement('div');d.id='onb';
  d.innerHTML=`<div class="onb-in"><h1>Set your location to start exploring shops &amp; food near you</h1>
  <div class="onb-art">${ART}</div><p id="onbMsg" class="onb-msg"></p>
  <button id="onbGps" class="onb-btn"><span class="onb-lbl">📍 Use current location</span><i class="spin"></i></button>
  <button id="onbMan" class="onb-btn out">Enter your location manually</button>
  <a id="onbSkip" class="onb-skip">Skip for now</a></div>`;
  document.body.appendChild(d);document.body.classList.add('noscroll');
  q('#onbGps').onclick=()=>auto();
  q('#onbMan').onclick=()=>openSheet(true);
  q('#onbSkip').onclick=()=>{LS[K_ONB]='1';closeOnb(true)};
  // Like Zomato/Amazon: permissions are asked right at launch
  setTimeout(async()=>{await Notify.ask();auto(true)},500);
}
async function auto(first){
  if(busy)return;busy=true;
  const b=q('#onbGps'),m=q('#onbMsg');if(b)b.classList.add('load');if(m)m.textContent='';
  try{await detect();busy=false;closeOnb()}
  catch(e){busy=false;if(b)b.classList.remove('load');if(m)m.textContent=errMsg(e)}
}
function closeOnb(skipped){
  const d=q('#onb');if(d)d.remove();document.body.classList.remove('noscroll');
  closeSheet();afterLocation(skipped);
}

/* Amazon-style sign-in prompt, shown once */
function afterLocation(skipped){
  if(LS[K_ONB])return;LS[K_ONB]='1';
  if(LS.t||(typeof ME!=='undefined'&&ME))return;
  setTimeout(()=>{
    modal(`<h2>Sign in to your account</h2><ul class="onb-ul"><li>🎁 Get ₹100 welcome bonus</li><li>📦 Track your orders live</li><li>⚡ Faster checkout</li></ul>
    <button class="full" onclick="authM('login')">Already a customer? Sign in</button>
    <button class="full ghostb" onclick="authM('signup')">New to UniVerse? Create an account</button>
    <button class="full ghostb" onclick="closeM()">Skip sign in</button>`);
  },skipped?0:350);
}

/* ---------- manual search sheet ---------- */
let timer,reqId=0;
function openSheet(fromOnb){
  closeSheet();
  const s=document.createElement('div');s.id='locSheet';
  s.innerHTML=`<div class="ls-box"><button class="x" aria-label="Close">×</button><h2>Choose your location</h2>
  <input id="lsq" placeholder="Search area, street or pincode" autocomplete="off" enterkeyhint="search">
  <button class="ls-row gps"><span>🎯</span><div><b>Use current location</b><small>Using GPS</small></div></button>
  <div id="lsr" class="ls-res"></div></div>`;
  document.body.appendChild(s);
  const inp=q('#lsq');setTimeout(()=>inp.focus(),150);
  s.onclick=e=>{if(e.target===s)closeSheet()};
  s.querySelector('.x').onclick=closeSheet;
  s.querySelector('.gps').onclick=async()=>{
    const r=q('#lsr');r.innerHTML='<p class="ls-hint">📍 Location detect ho rahi hai…</p>';
    try{await detect();closeOnb()}catch(e){r.innerHTML='<p class="ls-hint">'+h(errMsg(e))+'</p>'}
  };
  inp.oninput=()=>{clearTimeout(timer);timer=setTimeout(()=>search(inp.value.trim()),450)};
  inp.onkeydown=e=>{if(e.key==='Enter'){clearTimeout(timer);search(inp.value.trim())}};
}
function closeSheet(){const s=q('#locSheet');if(s)s.remove()}
async function search(t){
  const r=q('#lsr');if(!r)return;
  if(t.length<3){r.innerHTML='';return}
  const my=++reqId;r.innerHTML='<p class="ls-hint">Searching…</p>';
  try{
    const res=await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&countrycodes=in&q='+encodeURIComponent(t),{headers:{'Accept-Language':'en'}});
    const list=await res.json();if(my!==reqId)return;
    r.innerHTML=(list.map((j,i)=>{const s=shape(j);return `<button class="ls-row" data-i="${i}"><span>📍</span><div><b>${h(s.label)}</b><small>${h(s.addr)}</small></div></button>`}).join(''))
      ||'<p class="ls-hint">Koi result nahi mila.</p>';
    r.insertAdjacentHTML('beforeend',`<button class="ls-row typed"><span>✍️</span><div><b>Use “${h(t)}” as my address</b><small>Without map pin</small></div></button>`);
    r.querySelectorAll('.ls-row[data-i]').forEach(b=>b.onclick=()=>{const j=list[b.dataset.i],s=shape(j);setLoc({lat:+j.lat,lng:+j.lon,label:s.label,addr:s.addr,pin:s.pin,ts:Date.now()});closeOnb()});
    r.querySelector('.typed').onclick=()=>typed(t);
  }catch(e){
    if(my!==reqId)return;
    r.innerHTML=`<p class="ls-hint">Internet slow hai. Aap apna address aise bhi save kar sakte hain.</p><button class="ls-row typed"><span>✍️</span><div><b>Use “${h(t)}” as my address</b></div></button>`;
    r.querySelector('.typed').onclick=()=>typed(t);
  }
}
function typed(t){setLoc({label:t.length>34?t.slice(0,32)+'…':t,addr:t,ts:Date.now()});closeOnb()}

/* ---------- order status notifications ---------- */
let seen=null;
const MSG=s=>/out for delivery/i.test(s)?'🛵 Out for delivery – keep your OTP ready'
  :/deliver/i.test(s)?'🎉 Delivered. Enjoy!'
  :/cancel/i.test(s)?'❌ Order cancelled'
  :/confirm/i.test(s)?'✅ Order confirmed'
  :/prepar/i.test(s)?'👨‍🍳 Being prepared'
  :/ready|pick/i.test(s)?'📦 Ready for pickup'
  :'Status: '+s;
async function poll(){
  if(typeof ME==='undefined'||!ME){seen=null;return}
  try{
    const d=await api('/orders'),cur={};
    d.orders.forEach(o=>cur[o.id]=o.status);
    if(seen)d.orders.forEach(o=>{if(seen[o.id]!==undefined&&seen[o.id]!==o.status)Notify.show('Order '+o.ref,MSG(o.status))});
    seen=cur;
  }catch(e){}
}

/* ---------- public API + start ---------- */
window.UVLoc={get:getLoc,paint:paintLoc,open:()=>openSheet(false),notify:Notify.show,askNotify:Notify.ask};
function start(){
  paintLoc();
  const l=getLoc();
  if(!l)showOnb();
  else{
    if(l.auto&&Date.now()-(l.ts||0)>6*3600e3)detect().catch(()=>{}); // refresh stale GPS silently
    afterLocation();
  }
  setInterval(poll,15000);setTimeout(poll,3000);
}
if(document.readyState==='complete')start();else window.addEventListener('load',start);
})();
