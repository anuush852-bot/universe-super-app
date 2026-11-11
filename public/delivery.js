/* UniVerse Delivery Partner app — Zomato-style UI (Feed / Pocket / Orders / Profile) */
const app=$('#app');
let TAB='feed',DASH=null,EARN=null,CASH=null,PAYS=null,BANK=null,LASTAV=null,WID=null,LASTSEND=0,AUTH='login',SKIP=new Set(),POP=null,POPT=null,WL=null;
const LS=localStorage,PL=(window.Capacitor&&window.Capacitor.Plugins)||{};
const soundOn=()=>LS.dp_sound!=='0';
async function notify(t,b){try{if(navigator.vibrate)navigator.vibrate([300,120,300,120,300]);if(PL.LocalNotifications){await PL.LocalNotifications.schedule({notifications:[{id:Date.now()%2147483000,title:t,body:b,schedule:{at:new Date(Date.now()+300)}}]});return}
 if('Notification' in window&&Notification.permission==='granted'){const r=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration();if(r&&r.showNotification)return r.showNotification(t,{body:b,icon:'/pwa-192.png',vibrate:[300,120,300]});new Notification(t,{body:b})}}catch(e){}}
function beep(){if(!soundOn())return;try{const C=window.AudioContext||window.webkitAudioContext,c=new C();[0,.25,.5].forEach(d=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type='square';o.frequency.value=d===.25?1040:880;g.gain.setValueAtTime(.3,c.currentTime+d);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+d+.22);o.start(c.currentTime+d);o.stop(c.currentTime+d+.24)});setTimeout(()=>c.close(),1200)}catch(e){}}
async function keepAwake(on){try{if(on&&'wakeLock' in navigator&&!WL){WL=await navigator.wakeLock.request('screen');WL.addEventListener('release',()=>WL=null)}else if(!on&&WL){await WL.release();WL=null}}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&DASH&&DASH.online)keepAwake(true)});
window.addEventListener('online',()=>{toast('Internet wapas aa gaya');ME&&load().catch(()=>{})});window.addEventListener('offline',()=>render());

/* ---------- first-launch permissions (Zomato/Amazon style) ---------- */
function onboardView(){
  app.innerHTML=`<div class="auth ob"><div class="obh">🛵</div><h1>Welcome, Delivery Partner</h1><p class="mu">Order alerts aur sahi pickup/drop ke liye 2 permissions chahiye.</p>
  <div class="card"><div class="row"><span style="font-size:26px">🔔</span><div style="flex:1"><b>Notifications</b><div class="mu">Naya order aate hi alert</div></div><span id="pn" class="tag" style="background:#eee;color:#666">Pending</span></div>
  <div class="row"><span style="font-size:26px">📍</span><div style="flex:1"><b>Location (GPS)</b><div class="mu">Nearby orders aur live tracking</div></div><span id="pl" class="tag" style="background:#eee;color:#666">Pending</span></div></div>
  <button class="btn" onclick="askPerms()">Allow & Continue</button><button class="btn o" style="margin-top:10px" onclick="finishOnb()">Skip for now</button></div>`;
}
function finishOnb(){LS.dp_onb='1';view()}
const askPerms=async()=>{
  let n=false,l=false;
  try{if(PL.LocalNotifications){n=(await PL.LocalNotifications.requestPermissions()).display==='granted'}else if('Notification' in window){n=(await Notification.requestPermission())==='granted'}}catch(e){}
  $('#pn').textContent=n?'Allowed ✓':'Denied';
  try{if(PL.Geolocation){const r=await PL.Geolocation.requestPermissions();l=r.location==='granted'||r.coarseLocation==='granted'}else l=await new Promise(ok=>navigator.geolocation?navigator.geolocation.getCurrentPosition(()=>ok(true),()=>ok(false),{enableHighAccuracy:true,timeout:15000}):ok(false))}catch(e){}
  $('#pl').textContent=l?'Allowed ✓':'Denied';
  if(!l)toast('Location band hai — nearby orders nahi dikhenge. Phone settings se allow karo.');
  setTimeout(finishOnb,900);
};

/* ---------- location sharing ---------- */
function shareLoc(){if(!navigator.geolocation||WID!==null)return;WID=navigator.geolocation.watchPosition(p=>{const n=Date.now();if(n-LASTSEND<5000)return;LASTSEND=n;api('/partner/location','POST',{lat:p.coords.latitude,lng:p.coords.longitude}).catch(()=>{})},()=>{},{enableHighAccuracy:true,maximumAge:3000,timeout:20000})}
function stopLoc(){if(WID!==null){navigator.geolocation.clearWatch(WID);WID=null}}

/* ---------- login / register ---------- */
function authView(){
  const l=AUTH==='login';
  app.innerHTML=`<div class="auth"><div class="card"><h2>${l?'Delivery Partner Login':'Register as Delivery Partner'}</h2>
  ${l?`<input id="identity" placeholder="Email or mobile"><input id="password" type="password" placeholder="Password"><button class="btn" onclick="loginPartner()">Login</button><p class="mu" style="margin-top:14px;text-align:center">Naye ho? <a style="color:var(--red);font-weight:700" href="#" onclick="AUTH='signup';authView();return false">Register karo</a></p>`
  :`<input id="name" placeholder="Full name"><input id="mobile" maxlength="10" placeholder="10 digit mobile"><input id="email" placeholder="Email"><input id="vehicle" placeholder="Vehicle number (e.g. DL01AB1234)"><input id="newpass" type="password" placeholder="Password (8+ characters)"><button class="btn" onclick="registerPartner()">Register</button><p class="mu" style="margin-top:14px;text-align:center">Pehle se account hai? <a style="color:var(--red);font-weight:700" href="#" onclick="AUTH='login';authView();return false">Login</a></p>`}
  </div></div>`;
}
const loginPartner=wrap(async()=>{const d=await api('/login','POST',{identity:$('#identity').value,password:$('#password').value});if(d.user.role!=='partner'||d.user.kind!=='delivery')throw Error('Ye delivery partner account nahi hai');T=d.token;localStorage[KEY]=T;ME=d.user;TAB='feed';load()});
const registerPartner=wrap(async()=>{const d=await api('/partner/signup','POST',{name:$('#name').value,mobile:$('#mobile').value,email:$('#email').value,vehicle:$('#vehicle').value,password:$('#newpass').value,kind:'delivery'});T=d.token;localStorage[KEY]=T;ME=d.user;toast('Registration submitted. Admin approval required.');TAB='feed';load()});

/* ---------- data ---------- */
async function load(){
  const [d,e,c]=await Promise.all([api('/delivery/jobs'),api('/partner/earnings'),api('/partner/cash')]);
  DASH=d;EARN=e;CASH=c;
  if(TAB==='pocket'){try{PAYS=(await api('/partner/payouts')).payouts}catch{PAYS=[]}}
  try{BANK=(await api('/partner/payout-profile')).profile}catch{BANK=null}
  d.online?shareLoc():stopLoc();
  const ids=d.available.map(x=>x.id);
  if(d.online){keepAwake(true);const nw=d.available.filter(x=>!SKIP.has(x.id)&&(LASTAV===null||!LASTAV.includes(x.id)));if(nw.length&&!POP)showPop(nw[0])}else keepAwake(false);
  if(POP&&!d.available.some(x=>x.id===POP)){closePop();toast('Ye order kisi aur ne le liya')}
  LASTAV=ids;render();
}
const initial=()=>esc((ME&&ME.name||'P').trim().charAt(0).toUpperCase());
const dt=ts=>new Date(ts).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});

/* ---------- shell ---------- */
function banner(){
  const d=DASH,c=CASH;
  if(!navigator.onLine)return`<div class="bn r"><b>📡</b><div>Internet nahi hai<small>Connection wapas aane tak orders update nahi honge</small></div></div>`;
  if(!d.approved)return`<div class="bn"><b>⚠️</b><div>Approval pending<small>Admin approval ke baad aap online ja sakte ho</small></div></div>`;
  if(c.blocked)return`<div class="bn r"><b>⛔</b><div>Cash limit reached (${inr(c.limit)})<small>Naye orders ke liye ${inr(c.inHand)} deposit karo</small></div><button onclick="deposit()">Pay now</button></div>`;
  if(BANK&&BANK.kyc_status&&BANK.kyc_status!=='verified'&&EARN.wallet>0)return`<div class="bn"><b>⚠️</b><div>Bank verification pending<small>Payout ke liye bank details submit karo</small></div><button onclick="goTab('pocket')">Retry</button></div>`;
  return'';
}
function render(){
  if(!DASH)return;
  const body={feed:feedV,pocket:pocketV,orders:ordersV,profile:profileV}[TAB]();
  const tabs=[['feed','📰','Feed'],['pocket','👛','Pocket'],['orders','📦','Orders'],['profile','👤','Profile']];
  app.innerHTML=`<div id="top"><button class="sw ${DASH.online?'on':''}" onclick="setOnline(${!DASH.online})"><i></i>${DASH.online?'Online':'Offline'}</button><span class="sp"></span><div class="ib" onclick="toast('Koi nayi notification nahi')">🔔${DASH.available.length?'<b></b>':''}</div><div class="av" onclick="goTab('profile')">${initial()}</div></div>${banner()}<div class="wrap">${body}</div><a class="help" href="tel:+919319949612" aria-label="Help">🎧</a><div id="tabs">${tabs.map(t=>`<button class="${TAB===t[0]?'on':''}" onclick="goTab('${t[0]}')"><span>${t[1]}</span>${t[2]}</button>`).join('')}</div>`;
}
const goTab=t=>{TAB=t;window.scrollTo(0,0);load().catch(e=>toast(e.message))};

/* ---------- Feed ---------- */
function feedV(){
  const d=DASH,done=(EARN.tx||[]).filter(x=>x.amt>0&&new Date(x.ts).toDateString()===new Date().toDateString());
  const today=done.reduce((s,x)=>s+x.amt,0);
  return`<div class="card"><div class="ch">Today's progress</div><div class="grid2"><div><div class="big">${inr(today)}</div><div class="mu">Earnings →</div></div><div><div class="big">${done.length}</div><div class="mu">Trips →</div></div><div><div class="big">${d.mine.length}</div><div class="mu">Active jobs</div></div><div><div class="big">${d.available.length}</div><div class="mu">Pickups nearby</div></div></div></div>
  ${d.mine.length?`<h3 class="sec">ACTIVE DELIVERY</h3>${d.mine.map(j=>jobCard(j,false)).join('')}`:''}
  <h3 class="sec">AVAILABLE PICKUPS</h3>
  ${d.available.map(j=>jobCard(j,true)).join('')||`<div class="card empty">${!d.approved?'Admin approval ka wait karo.':d.online?'Abhi koi order nahi. Seller orders Ready for Pickup hote hi yahan dikhenge.':'Orders dekhne ke liye upar se <b>Online</b> jao.'}</div>`}`;
}
const navA=(lat,lng,t)=>lat==null||lng==null?'':`<a class="tag" style="margin-right:8px;background:#eef2ff;color:#3b4cca" target="_blank" href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}">🧭 ${t}</a>`;
function jobCard(j,available){
  return`<div class="card"><div class="job"><div class="h"><b>Order #${j.id}</b><span class="tag">${esc(j.status)}</span></div>
  <div class="earn">${inr(j.delivery_earning)} <span class="mu" style="font-weight:400">earning</span></div>
  ${available?'':stepper(j.status)}
  <div class="pin"><em>🏪</em><div><b>${esc(j.shop_name)}</b><br><span class="mu">${esc(j.shop_address)}</span></div></div>
  <div class="pin"><em>📍</em><div><b>${esc(j.customer_name)}</b> • ${esc(j.customer_mobile)}<br><span class="mu">${esc(j.customer_address)}</span></div></div>
  <div class="mu">${j.pickup_km!=null?'🛵 Shop tak '+j.pickup_km+' km • ':''}${j.trip_km!=null?'Trip '+j.trip_km+' km':'Distance: location set nahi'}</div>
  <div>${j.cash_due?`💵 Customer se cash lena hai: <b>${inr(j.cash_due)}</b>`:'✅ Prepaid — cash nahi lena'}</div>
  ${available?`<button class="btn" onclick="acceptJob(${j.id})">Accept Delivery</button>`:`<div class="acts"><a class="tag act" href="tel:${esc(j.customer_mobile)}">📞 Customer</a><button class="tag act" onclick="copyTxt(this.dataset.a)" data-a="${esc(j.customer_address)}">📋 Address copy</button></div><div>${navA(j.shop_lat,j.shop_lng,'Shop route')}${navA(j.drop_lat,j.drop_lng,'Customer route')}${j.status==='Picked Up'?`<button class="tag" style="background:#e9f9ef" onclick="openTrack(${j.parent_order_id},'partner')">🗺️ Map</button>`:''}</div>
  ${j.status==='Ready for Pickup'?`<p class="mu">Demo Pickup OTP: ${esc(j.pickupOtp||'Seller ke paas bheja gaya')}</p><input id="pick${j.id}" inputmode="numeric" placeholder="Pickup OTP daalo"><button class="btn" onclick="pickup(${j.id})">Verify Pickup</button>`
  :j.status==='Picked Up'?`<input id="drop${j.id}" inputmode="numeric" placeholder="Customer delivery OTP"><button class="btn" onclick="deliver(${j.id})">Complete Delivery</button>`:''}`}
  </div></div>`;
}

const stepper=st=>{const i=st==='Picked Up'?2:1,L=['Accepted','Pickup','Delivered'];return`<div class="stp">${L.map((x,k)=>`<div class="${k<i?'d':k===i?'c':''}"><i>${k<i?'✓':k+1}</i><span>${x}</span></div>`).join('')}</div>`};
const copyTxt=t=>{try{navigator.clipboard.writeText(t);toast('Address copy ho gaya')}catch(e){toast(t)}};

/* ---------- Pocket ---------- */
function pocketV(){
  const c=CASH,w=EARN.wallet||0,tx=EARN.tx||[],ev=c.events||[];
  return`<div class="card"><div class="cb" style="text-align:center"><div class="mu">Total earnings (wallet)</div><div class="big" style="font-size:40px;margin-top:6px">${inr(w)}</div></div></div>
  ${weekChart(tx)}
  <h3 class="sec">POCKET</h3>
  <div class="card"><div class="row"><span>Pocket balance</span><b>${inr(w)}</b></div><div class="row"><span>Cash in hand</span><b>${inr(c.inHand)}</b></div><div class="row"><span>Available cash limit</span><b>${inr(Math.max(0,c.limit-c.inHand))}</b></div>
  <div class="two"><button class="btn o" ${c.inHand>0?'':'disabled'} onclick="deposit()">Deposit</button><button class="btn" ${w>0?'':'disabled'} style="${w>0?'':'background:#ddd;color:#999'}" onclick="withdraw()">Withdraw</button></div></div>
  <h3 class="sec">BANK DETAILS</h3>
  <div class="card"><div class="row"><div><b>${BANK&&BANK.beneficiary_name?esc(BANK.beneficiary_name):'Bank add nahi hai'}</b><div class="mu">Payout ke liye bank verify hona zaroori</div></div><span class="tag" style="${BANK&&BANK.kyc_status==='verified'?'':'background:#fff3d6;color:#8a5a00'}">${esc((BANK&&BANK.kyc_status||'not_submitted').replace('_',' '))}</span></div><div style="padding:0 16px 16px"><input id="bn" placeholder="Account holder name" value="${BANK&&BANK.beneficiary_name?esc(BANK.beneficiary_name):''}" style="margin-bottom:10px"><button class="btn o" onclick="saveBank()">Submit bank details</button></div></div>
  <h3 class="sec">PAYOUTS</h3>
  <div class="card">${(PAYS||[]).map(p=>`<div class="row"><div><b>${inr(p.amount)}</b><div class="mu">${dt(p.created_at)}</div></div><span class="tag">${esc(p.status)}</span></div>`).join('')||'<div class="empty">Abhi koi payout nahi</div>'}</div>
  <h3 class="sec">EARNINGS STATEMENT</h3>
  <div class="card">${tx.map(x=>`<div class="row"><div><b>${esc(x.note)}</b><div class="mu">${dt(x.ts)}</div></div><b style="color:${x.amt>=0?'#0d7a37':'#c0182b'}">${x.amt>=0?'+':''}${inr(x.amt)}</b></div>`).join('')||'<div class="empty">Abhi koi earning nahi</div>'}</div>
  <h3 class="sec">CASH STATEMENT</h3>
  <div class="card">${ev.map(x=>`<div class="row"><div><b>${esc(x.note||x.type)}</b><div class="mu">${dt(x.created_at)}</div></div><b style="color:${x.amount>=0?'#c0182b':'#0d7a37'}">${x.amount>=0?'+':''}${inr(x.amount)}</b></div>`).join('')||'<div class="empty">Koi cash entry nahi</div>'}</div>`;
}
function weekChart(tx){const days=[...Array(7)].map((_,k)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-6+k);return d}),v=days.map(d=>tx.filter(x=>x.amt>0&&new Date(x.ts).toDateString()===d.toDateString()).reduce((a,x)=>a+x.amt,0)),m=Math.max(1,...v),tot=v.reduce((a,b)=>a+b,0);
 return`<div class="card"><div class="cb"><div class="mu">Last 7 days</div><div class="big">${inr(tot)}</div><div class="bars">${v.map((x,k)=>`<div><b style="height:${Math.max(4,x/m*70)}px"></b><span>${'SMTWTFS'[days[k].getDay()]}</span></div>`).join('')}</div></div></div>`}
const saveBank=wrap(async()=>{const r=await api('/partner/payout-profile','POST',{beneficiaryName:$('#bn').value});toast(r.message||'Submit ho gaya');load()});
const deposit=wrap(async()=>{await payCashDue(()=>load().catch(()=>{}))});
const withdraw=wrap(async()=>{const r=await api('/partner/payout-request','POST',{});toast('Withdraw request bheja gaya ✅');load()});

/* ---------- Orders (history of current jobs) ---------- */
function ordersV(){
  const d=DASH;
  return`<h3 class="sec">MY ACTIVE JOBS</h3>${d.mine.map(j=>jobCard(j,false)).join('')||'<div class="card empty">Koi active job nahi</div>'}`;
}

/* ---------- Profile ---------- */
function profileV(){
  const d=DASH,u=ME||{};
  return`<div class="card"><div class="hd"><div><h2>${esc(u.name||'Partner')}</h2><div class="mu">ID: UV${esc(u.id||'')}</div><span class="chip">🛵 ${esc(u.vehicle||'Vehicle not set')}</span></div><div class="av">${initial()}</div></div><div class="lvl"><span>${d.approved?'✅ Approved Partner':'⏳ Approval pending'}</span><span>${d.online?'Online':'Offline'}</span></div></div>
  <div class="card menu"><a href="tel:+919319949612"><span>🎧</span>Help centre<span>›</span></a><button onclick="goTab('pocket')"><span>👛</span>Pocket & statements<span>›</span></button><button onclick="goTab('orders')"><span>📦</span>My jobs<span>›</span></button><a href="mailto:support@universe.app"><span>✉️</span>Support<span>›</span></a><button onclick="toggleSound()"><span>🔔</span>Order alert sound: ${soundOn()?'ON':'OFF'}<span>›</span></button><button onclick="beep();notify('Test alert','Order alert aise aayega')"><span>🧪</span>Test order alert<span>›</span></button></div>
  <button class="btn o" onclick="logout()">Logout</button>
  <div class="mu" style="text-align:center;margin:10px 0"><b>UniVerse</b> Delivery</div>`;
}

/* ---------- new order popup with countdown ---------- */
function showPop(j){
  POP=j.id;let t=30;beep();notify('🛵 Naya order #'+j.id,inr(j.delivery_earning)+' • '+(j.pickup_km!=null?j.pickup_km+' km shop tak':j.shop_name));
  const el=document.createElement('div');el.id='pop';
  el.innerHTML=`<div class="sheet"><div class="mu" style="text-align:center">NEW ORDER • <span id="pt">30</span>s</div><div class="earn" style="font-size:36px;text-align:center;margin:6px 0">${inr(j.delivery_earning)}</div><div class="pin"><em>🏪</em><div><b>${esc(j.shop_name)}</b><br><span class="mu">${esc(j.shop_address)}</span></div></div><div class="pin"><em>📍</em><div class="mu">${esc(j.customer_address)}</div></div><div class="mu" style="margin:8px 0">${j.pickup_km!=null?'🛵 Shop tak '+j.pickup_km+' km • ':''}${j.trip_km!=null?'Trip '+j.trip_km+' km':''}${j.cash_due?' • 💵 Cash '+inr(j.cash_due):' • ✅ Prepaid'}</div><div class="two" style="padding:0"><button class="btn o" onclick="skipPop(${j.id})">Reject</button><button class="btn" onclick="acceptPop(${j.id})">Accept</button></div></div>`;
  document.body.appendChild(el);clearInterval(POPT);POPT=setInterval(()=>{t--;const e=$('#pt');if(e)e.textContent=t;if(t<=0)skipPop(j.id)},1000);
}
function closePop(){clearInterval(POPT);POP=null;const e=$('#pop');if(e)e.remove()}
function skipPop(id){SKIP.add(id);closePop()}
const acceptPop=wrap(async id=>{closePop();await api(`/delivery/jobs/${id}/accept`,'POST',{});toast('Order accept ho gaya ✅');TAB='feed';load()});
const toggleSound=()=>{LS.dp_sound=soundOn()?'0':'1';render()};

/* ---------- actions ---------- */
const setOnline=wrap(async v=>{await api('/partner/online','POST',{online:v});load()});
const acceptJob=wrap(async id=>{await api(`/delivery/jobs/${id}/accept`,'POST',{});toast('Job accepted');load()});
const pickup=wrap(async id=>{await api(`/delivery/jobs/${id}/pickup`,'POST',{otp:$('#pick'+id).value});toast('Pickup verified');load()});
const deliver=wrap(async id=>{const j=(DASH.mine||[]).find(x=>x.id===id),e=j?j.delivery_earning:0;await api(`/delivery/jobs/${id}/deliver`,'POST',{otp:$('#drop'+id).value});const el=document.createElement('div');el.id='pop';el.innerHTML=`<div class="sheet" style="text-align:center"><div style="font-size:56px">🎉</div><h2>Delivery complete!</h2><div class="earn" style="font-size:34px;margin:8px 0">+${inr(e)}</div><p class="mu">Earning aapke pocket mein add ho gayi</p><button class="btn" style="margin-top:14px" onclick="closePop()">Done</button></div>`;document.body.appendChild(el);load()});

/* ---------- boot ---------- */
function view(){if(!LS.dp_onb){onboardView();return}if(!ME||ME.role!=='partner'||ME.kind!=='delivery'){DASH=null;stopLoc();authView();return}load().catch(e=>toast(e.message))}
window.onUnauth=()=>{ME=null;DASH=null;stopLoc();authView()};
(async()=>{if(T)try{ME=(await api('/me')).user}catch{}view();setInterval(()=>{if(ME&&DASH&&idleForRefresh()&&!POP)load().catch(()=>{})},5000)})();
