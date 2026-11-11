/* UniVerse Partner shell – Zomato-Delivery-style app used by /delivery and /partner
   Feed • Pocket • Trips • Profile, online toggle, alerts, notification centre, permissions. */
(function(){
const LS=localStorage,CAP=window.Capacitor,PL=(CAP&&CAP.Plugins)||{};
const q=s=>document.querySelector(s),fm=n=>inr(Math.round((+n||0)*100)/100);
let C=null,D=null,TAB='feed',LAST=null,LASTTX=null,tmr=null,tick=0,KYC=null,FILT='week',busy=false;
const OV=[];

/* ---------- helpers ---------- */
const sod=()=>{const d=new Date();d.setHours(0,0,0,0);return +d};
const wk0=()=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return +d};
const E=()=>(D?D.tx:[]).filter(x=>x.amt>0&&/^Earning/.test(x.note));
const sum=l=>l.reduce((a,x)=>a+x.amt,0);
const day=()=>new Date().toISOString().slice(0,10);
const OTK=()=>'uv_ot_'+(ME?ME.id:0)+'_'+day();
const hrs=s=>{s=Math.floor(s);return String(Math.floor(s/3600)).padStart(2,'0')+':'+String(Math.floor(s%3600/60)).padStart(2,'0')+' hrs'};
const dt=t=>new Date(t).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'});
const ref=n=>String(n).replace(/^Earning\s*/,'');

/* ---------- notification centre + alerts ---------- */
const NK=()=>'uv_pn_'+(ME?ME.id:0);
const nlist=()=>{try{return JSON.parse(LS[NK()]||'[]')}catch(e){return[]}};
function nlog(t,b){const l=nlist();l.unshift({t,b,ts:Date.now(),r:0});LS[NK()]=JSON.stringify(l.slice(0,50));bell()}
function bell(){const b=q('#psBell');if(b)b.classList.toggle('dot',nlist().some(x=>!x.r))}
async function sys(title,body){
  try{
    if(PL.LocalNotifications){await PL.LocalNotifications.schedule({notifications:[{id:Math.floor(Date.now()%2147483000),title,body,schedule:{at:new Date(Date.now()+300)}}]});return}
    if('Notification' in window&&Notification.permission==='granted'){const r=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration();if(r&&r.showNotification){await r.showNotification(title,{body,icon:'/pwa-192.png',vibrate:[250,120,250]});return}new Notification(title,{body,icon:'/pwa-192.png'})}
  }catch(e){}
}
function ring(){if(LS.uv_snd==='0')return;try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const c=new A();[0,.32,.64].forEach((t,i)=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type='sine';o.frequency.value=i==1?1040:880;g.gain.setValueAtTime(.3,c.currentTime+t);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+t+.28);o.start(c.currentTime+t);o.stop(c.currentTime+t+.3)});setTimeout(()=>c.close(),1500)}catch(e){}}
function alertU(t,b,loud){nlog(t,b);if(loud)ring();if(navigator.vibrate)try{navigator.vibrate([300,120,300])}catch(e){};sys(t,b);toast('🔔 '+t)}

/* ---------- permissions ---------- */
async function perm(){
  let n='default',l='default';
  try{
    if(PL.LocalNotifications)n=(await PL.LocalNotifications.checkPermissions()).display;else if('Notification' in window)n=Notification.permission;
    if(PL.Geolocation){const p=await PL.Geolocation.checkPermissions();l=p.location}else if(navigator.permissions){l=(await navigator.permissions.query({name:'geolocation'})).state}
  }catch(e){}
  return {n:n==='granted',l:l==='granted'};
}
async function askPerms(){
  try{if(PL.LocalNotifications)await PL.LocalNotifications.requestPermissions();else if('Notification' in window&&Notification.permission==='default')await Notification.requestPermission()}catch(e){}
  try{if(PL.Geolocation)await PL.Geolocation.requestPermissions();else if(navigator.geolocation)await new Promise(r=>navigator.geolocation.getCurrentPosition(r,r,{timeout:15000}))}catch(e){}
  return perm();
}
async function permSheet(force){
  const p=await perm();if(p.n&&p.l)return;if(!force&&LS.uv_perm)return;
  openOv(`<div class="ps-sheet"><div class="ps-sh"><b>Permission required</b><button onclick="PS.back()">×</button></div>
  <p class="ps-pp">Allow us to send you new ${C.word()} alerts and use your location to assign nearby ${C.word()}s.</p>
  <div class="ps-pr"><span>🔔</span><div><b>Notifications</b><small>Instant alerts for new ${C.word()}s</small></div><i id="pn">${p.n?'✅':'⚠️'}</i></div>
  <div class="ps-pr"><span>📍</span><div><b>Location</b><small>For nearby jobs and live tracking</small></div><i id="pl">${p.l?'✅':'⚠️'}</i></div>
  <button class="full big" onclick="PS.allow(this)">Allow access</button></div>`,'sheet');
}
async function allow(b){b.disabled=true;b.textContent='Please wait…';const p=await askPerms();LS.uv_perm='1';const a=q('#pn'),c=q('#pl');if(a)a.textContent=p.n?'✅':'⚠️';if(c)c.textContent=p.l?'✅':'⚠️';if(!p.n||!p.l)toast('Baaki permission phone Settings → App → Permissions se allow karein');setTimeout(()=>{back();draw()},700)}

/* ---------- live location ---------- */
let WID=null,LSEND=0;
async function locStart(){
  if(WID!==null)return;WID='p';
  const send=(a,b)=>{const n=Date.now();if(n-LSEND<5000)return;LSEND=n;api('/partner/location','POST',{lat:a,lng:b}).catch(()=>{})};
  try{
    if(PL.Geolocation){const p=await PL.Geolocation.checkPermissions();if(p.location!=='granted'&&(await PL.Geolocation.requestPermissions()).location!=='granted'){WID=null;return}
      WID=await PL.Geolocation.watchPosition({enableHighAccuracy:true},(pos)=>{if(pos)send(pos.coords.latitude,pos.coords.longitude)});return}
  }catch(e){WID=null;return}
  if(!navigator.geolocation){WID=null;return}
  WID=navigator.geolocation.watchPosition(p=>send(p.coords.latitude,p.coords.longitude),()=>{},{enableHighAccuracy:true,maximumAge:3000,timeout:20000});
}
function locStop(){if(WID===null)return;try{if(typeof WID==='string'&&WID!=='p')PL.Geolocation.clearWatch({id:WID});else if(typeof WID==='number')navigator.geolocation.clearWatch(WID)}catch(e){}WID=null}

/* ---------- overlays (history-aware, Android back button closes them) ---------- */
function openOv(html,cls){const o=document.createElement('div');o.className='ps-ov '+(cls||'page');o.innerHTML=html;if(cls==='sheet')o.onclick=e=>{if(e.target===o)back()};document.body.appendChild(o);OV.push(o);history.pushState({ps:1},'');document.body.classList.add('noscroll');return o}
function back(){if(OV.length)history.back()}
window.addEventListener('popstate',()=>{const o=OV.pop();if(o)o.remove();if(!OV.length)document.body.classList.remove('noscroll')});
const page=(t,b)=>openOv(`<div class="ps-ph"><button onclick="PS.back()" aria-label="Back">←</button><b>${t}</b></div><div class="ps-pb">${b}</div>`);

/* ---------- auth (same look as customer app) ---------- */
let ATAB='login';
window.togglePw=(id,b)=>{const i=document.getElementById(id);i.type=i.type=='password'?'text':'password';b.textContent=i.type=='password'?'👁️':'🙈'};
const AA='autocapitalize="none" autocorrect="off" spellcheck="false"';
function authView(tab){
  ATAB=tab||ATAB;const L=ATAB=='login',kinds=C.kinds||[];
  q('#psroot').innerHTML=`<div class="au-wrap"><div class="au-h"><span>${C.icon()} <b>UniVerse</b> <small class="mu">Partner</small></span></div><div class="au-b">
  <h1>${L?'Partner sign in':'Become a partner'}</h1><p class="mu au-sub">${L?'Login to receive jobs and track your earnings.':'Apply now. Admin approves your account, then you can start earning.'}</p>
  ${L?`<div class="fld"><label>Mobile number or email</label><input id="a1" ${AA} autocomplete="username" value="${esc(LS.uv_pid||'')}"><small class="fe" id="e_a1"></small></div>
  <div class="fld"><label>Password</label><div class="pw"><input id="a2" type="password" ${AA} autocomplete="current-password" onkeydown="if(event.key==='Enter')PS.auth()"><button type="button" class="eye" onclick="togglePw('a2',this)">👁️</button></div><small class="fe" id="e_a2"></small></div>`
  :`<div class="fld"><label>Full name</label><input id="n" autocomplete="name"><small class="fe" id="e_n"></small></div>
  <div class="fld"><label>Mobile number</label><div class="pre"><span>+91</span><input id="m" maxlength="10" inputmode="numeric" oninput="this.value=this.value.replace(/\\D/g,'')"></div><small class="fe" id="e_m"></small></div>
  <div class="fld"><label>Email</label><input id="e" type="email" ${AA}><small class="fe" id="e_e"></small></div>
  ${kinds.length>1?`<div class="fld"><label>I want to work as</label><select id="k">${kinds.map(k=>`<option value="${k[0]}">${k[1]}</option>`).join('')}</select></div>`:''}
  <div class="fld"><label>Vehicle number</label><input id="v" ${AA} style="text-transform:uppercase" placeholder="e.g. DL01AB1234"><small class="fe" id="e_v"></small></div>
  <div class="fld"><label>Create password</label><div class="pw"><input id="pw" type="password" ${AA} placeholder="At least 8 characters"><button type="button" class="eye" onclick="togglePw('pw',this)">👁️</button></div><small class="fe" id="e_pw"></small></div>`}
  <p id="aerr" class="aerr"></p><button class="full big" id="abtn" onclick="PS.auth()">${L?'Sign in':'Apply now'}</button>
  <div class="au-or"><span>${L?'New partner?':'Already a partner?'}</span></div><button class="full ghostb big" onclick="PS.tab('${L?'signup':'login'}')">${L?'Create partner account':'Sign in'}</button>
  <p class="au-s"><a href="https://wa.me/919319949612">Need help? WhatsApp us</a></p></div></div>`;
}
function fe(id,m){const e=q('#e_'+id),i=q('#'+id);if(e)e.textContent=m||'';if(i)i.classList.toggle('bad',!!m);return !m}
async function auth(){
  const L=ATAB=='login',V=id=>q('#'+id)?q('#'+id).value:'',btn=q('#abtn'),er=q('#aerr');er.textContent='';let ok=true;
  if(L){ok=fe('a1',V('a1').trim()?'':'Enter mobile number or email')&ok;ok=fe('a2',V('a2')?'':'Enter your password')&ok}
  else{ok=fe('n',V('n').trim().length>=2?'':'Enter your name')&ok;ok=fe('m',/^\d{10}$/.test(V('m'))?'':'Enter a valid 10-digit mobile number')&ok;ok=fe('e',/^\S+@\S+\.\S+$/.test(V('e').trim())?'':'Enter a valid email')&ok;ok=fe('v',V('v').trim().length>=4?'':'Enter your vehicle number')&ok;ok=fe('pw',V('pw').length>=8?'':'Password must be at least 8 characters')&ok}
  if(!ok)return;btn.disabled=true;const old=btn.textContent;btn.textContent='Please wait…';
  try{
    const d=L?await api('/login','POST',{identity:V('a1').trim(),password:V('a2')})
      :await api('/partner/signup','POST',{name:V('n').trim(),mobile:V('m'),email:V('e').trim(),vehicle:V('v').trim().toUpperCase(),password:V('pw'),kind:q('#k')?V('k'):(C.kinds&&C.kinds[0]?C.kinds[0][0]:'delivery')});
    if(!C.roleOk(d.user))throw new Error('This account is not a '+C.label().toLowerCase()+' account. Please use the correct app.');
    if(L)LS.uv_pid=V('a1').trim();T=d.token;localStorage[KEY]=T;ME=d.user;LAST=null;LASTTX=null;
    toast(L?'Welcome back!':'Application sent! Wait for admin approval.');render();
  }catch(e){btn.disabled=false;btn.textContent=old;const m=e.message||'';
    er.innerHTML='⚠️ '+(/wrong login/i.test(m)?'Mobile/email or password is incorrect. Please try again.':/already exists/i.test(m)?'Account already exists. <a onclick="PS.tab(\'login\')">Sign in instead</a>.':esc(m))}
}

/* ---------- shell ---------- */
function mount(){
  q('#psroot').innerHTML=`<header class="ps-top"><button id="psSw" class="ps-sw" onclick="PS.toggle()"><i></i><span>Offline</span></button><div class="ps-r">
   <button id="psBell" class="ps-ib" onclick="PS.nc()" aria-label="Notifications">🔔</button><button class="ps-av" onclick="PS.go('profile')" aria-label="Profile">${esc((ME.name.trim()[0]||'P').toUpperCase())}</button></div></header>
   <div id="psbn"></div><main id="psb"><div class="ps-load">Loading…</div></main>
   <nav class="ps-tabs">${[['feed','📋','Feed'],['pocket','👛','Pocket'],['trips','🧾','Trips'],['profile','👤','Profile']].map(t=>`<button data-t="${t[0]}" onclick="PS.go('${t[0]}')"><i>${t[1]}</i>${t[2]}</button>`).join('')}</nav>`;
  bell();
}
function sw(){const b=q('#psSw');if(!b||!D)return;b.classList.toggle('on',!!D.online);b.querySelector('span').textContent=D.online?'Online':'Offline'}
function banners(p){
  let h='';const c=D.cash;
  if(!D.approved)h+=`<div class="ps-bn warn"><b>⏳ Approval pending</b><small>Admin will approve your account. You can go online after approval.</small><a href="tel:919319949612">Call help</a></div>`;
  if(c&&c.blocked)h+=`<div class="ps-bn bad"><b>⛔ Cash limit reached (${fm(c.limit)})</b><small>Deposit your cash to start receiving ${C.word()}s again.</small><button onclick="PS.deposit()">Deposit</button></div>`;
  else if(c&&c.inHand>0&&c.inHand>=c.limit*.8)h+=`<div class="ps-bn warn"><b>💵 Cash in hand ${fm(c.inHand)}</b><small>Limit is ${fm(c.limit)}. Deposit soon.</small><button onclick="PS.deposit()">Deposit</button></div>`;
  if(p&&!(p.n&&p.l))h+=`<div class="ps-bn warn"><b>🔔 Allow permissions</b><small>${!p.n?'Notifications':''}${!p.n&&!p.l?' & ':''}${!p.l?'Location':''} needed to get ${C.word()}s.</small><button onclick="PS.perm()">Allow</button></div>`;
  if(KYC&&KYC.kyc_status==='not_submitted')h+=`<div class="ps-bn info"><b>🏦 Add bank details</b><small>Needed to withdraw your earnings.</small><button onclick="PS.bank()">Add</button></div>`;
  return h;
}
async function draw(){
  if(!D)return;sw();const p=await perm();q('#psbn').innerHTML=banners(p);
  document.querySelectorAll('.ps-tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===TAB));
  q('#psb').innerHTML=({feed,pocket,trips,profile})[TAB]();
}
function typing(){const a=document.activeElement;return (a&&/INPUT|TEXTAREA/.test(a.tagName)&&a.closest&&a.closest('#psb'))||[...document.querySelectorAll('#psb input')].some(i=>i.value)}

/* ---------- Feed ---------- */
function feed(){
  const mine=D.mine,av=D.available,w=C.word(),e=E(),t0=sod(),today=e.filter(x=>x.ts>=t0),ot=+(LS[OTK()]||0);
  let h=`<div class="ps-hi"><h2>Hi, ${esc(ME.name.split(' ')[0])} 👋</h2><p class="mu">${C.icon()} ${C.label()} • ${esc(ME.vehicle||'')}</p></div>`;
  if(mine.length)h+=`<h3 class="ps-h">Active ${w}${mine.length>1?'s':''}</h3>`+mine.map(j=>C.card(j,'mine')).join('');
  if(D.online&&D.approved&&!(D.cash&&D.cash.blocked)&&(C.multi||!mine.length))
    h+=`<h3 class="ps-h">New ${w}s nearby ${av.length?'('+av.length+')':''}</h3>`+(av.length?av.map(j=>C.card(j,'avail')).join(''):`<div class="ps-radar"><i></i><i></i><i></i><span>🛵</span></div><p class="mu c">Looking for ${w}s near you…<br>Stay online – we refresh automatically.</p>`);
  else if(!D.online&&!mine.length)h+=`<div class="ps-off"><div>😴</div><b>You're offline</b><p class="mu">Go online to start receiving ${w}s.</p><button class="full big" onclick="PS.toggle()">Go online</button></div>`;
  h+=`<div class="ps-card"><div class="ps-ct">📅 Today's progress</div><div class="ps-g"><div><b>${fm(sum(today))}</b><small>Earnings</small></div><div><b>${today.length}</b><small>Trips</small></div><div><b>${hrs(ot)}</b><small>Online time</small></div><div><b>${fm(D.cash?D.cash.inHand:0)}</b><small>Cash in hand</small></div></div></div>`;
  return h;
}

/* ---------- Pocket ---------- */
function pocket(){
  const wk=sum(E().filter(x=>x.ts>=wk0())),c=D.cash||{inHand:0,limit:0},av=Math.max(0,c.limit-c.inHand),a=new Date(wk0()),b=new Date(wk0()+6*864e5),f=d=>d.toLocaleDateString('en-IN',{day:'numeric',month:'short'});
  return `<div class="ps-card c"><small>Earnings: ${f(a)} – ${f(b)}</small><div class="ps-big">${fm(wk)}</div></div>
  <div class="ps-sec"><span>POCKET</span></div>
  <div class="ps-card"><div class="rw"><b>Pocket balance</b><b>${fm(D.wallet)}</b></div><div class="rw dashed"><b>Available cash limit</b><b>${fm(av)}</b></div>
  <div class="ps-btns"><button class="out" onclick="PS.deposit()" ${c.inHand>0?'':'disabled'}>Deposit</button><button class="sol" onclick="PS.withdraw()" ${D.wallet>0?'':'disabled'}>Withdraw</button></div></div>
  <div class="ps-card rw"><b>💵 Cash in hand</b><b>${fm(c.inHand)} / ${fm(c.limit)}</b></div>
  <div class="ps-sec"><span>MORE SERVICES</span></div>
  <div class="ps-grid"><button onclick="PS.sub('payouts')"><i>🏦</i>Payout history</button><button onclick="PS.sub('stmt')"><i>🧾</i>Pocket statement</button><button onclick="PS.sub('cash')"><i>💵</i>Cash statement</button><button onclick="PS.bank()"><i>💳</i>Bank details</button></div>`;
}

/* ---------- Trips ---------- */
function trips(){
  const all=E(),l=FILT=='today'?all.filter(x=>x.ts>=sod()):FILT=='week'?all.filter(x=>x.ts>=wk0()):all;
  return `<div class="chips ps-ch">${[['today','Today'],['week','This week'],['all','All']].map(f=>`<button class="chip ${FILT==f[0]?'on':''}" onclick="PS.filt('${f[0]}')">${f[1]}</button>`).join('')}</div>
  <div class="ps-card c"><small>${l.length} trips</small><div class="ps-big">${fm(sum(l))}</div></div>
  ${l.map(x=>`<div class="ps-li"><span class="ic">✅</span><div><b>${esc(C.word()=='ride'?'Ride':'Order')} ${esc(ref(x.note))}</b><small>${dt(x.ts)}</small></div><b class="g">+${fm(x.amt)}</b></div>`).join('')||'<div class="ps-off"><div>🧾</div><b>No trips yet</b><p class="mu">Completed deliveries will show here.</p></div>'}`;
}

/* ---------- Profile ---------- */
function profile(){
  const p=nlist().filter(x=>!x.r).length,snd=LS.uv_snd!=='0';
  return `<div class="ps-card prof"><div class="av2">${esc((ME.name.trim()[0]||'P').toUpperCase())}</div><div><h2>${esc(ME.name)}</h2><p class="mu">UVP${10000+ME.id} • ${esc(ME.vehicle||'')}</p><span class="tag">${D.approved?'✅ Approved':'⏳ Pending approval'}</span></div></div>
  <div class="ps-grid g3"><button onclick="PS.go('trips')"><i>🧾</i>Trips history</button><button onclick="PS.go('pocket')"><i>👛</i>Pocket</button><button onclick="PS.nc()"><i>🔔</i>Alerts${p?' ('+p+')':''}</button></div>
  <div class="ps-card"><div class="ps-ct">Support</div><a class="ps-row" href="https://wa.me/919319949612"><span>💬</span>Chat on WhatsApp<i>›</i></a><a class="ps-row" href="tel:919319949612"><span>📞</span>Call helpline<i>›</i></a></div>
  <div class="ps-card"><div class="ps-ct">Account</div><a class="ps-row" onclick="PS.bank()"><span>🏦</span>Bank details<i>›</i></a><a class="ps-row" onclick="PS.info()"><span>🪪</span>My details<i>›</i></a></div>
  <div class="ps-card"><div class="ps-ct">App settings</div>
  <a class="ps-row" onclick="PS.snd()"><span>🔔</span>Order alert sound<em class="sw2 ${snd?'on':''}"><u></u></em></a>
  <a class="ps-row" onclick="PS.perm(1)"><span>📍</span>Notification &amp; location access<i>›</i></a></div>
  <button class="full ghostb big" onclick="PS.logout()">⎋ Logout</button><p class="mu c" style="margin-top:20px">UniVerse Partner</p>`;
}
function info(){page('My details',`<div class="ps-card">${[['Name',ME.name],['Mobile',ME.mobile],['Email',ME.email],['Type',C.label()],['Vehicle',ME.vehicle||'-'],['Partner ID','UVP'+(10000+ME.id)]].map(r=>`<div class="rw"><span class="mu">${r[0]}</span><b>${esc(r[1])}</b></div>`).join('')}</div>`)}

/* ---------- sub pages ---------- */
async function sub(k){
  if(k==='stmt')return page('Pocket statement',(D.tx.map(x=>`<div class="ps-li"><span class="ic">${x.amt<0?'⬆️':'⬇️'}</span><div><b>${esc(x.note)}</b><small>${dt(x.ts)}</small></div><b class="${x.amt<0?'r':'g'}">${x.amt<0?'−':'+'}${fm(Math.abs(x.amt))}</b></div>`).join(''))||'<p class="mu c">No transactions yet</p>');
  try{
    if(k==='cash'){const d=await api('/partner/cash');return page('Cash statement',`<div class="ps-card"><div class="rw"><b>Cash in hand</b><b>${fm(d.inHand)}</b></div><div class="rw"><b>Limit</b><b>${fm(d.limit)}</b></div></div>`+(d.events.map(x=>`<div class="ps-li"><span class="ic">💵</span><div><b>${esc(x.note||x.type)}</b><small>${dt(x.created_at)}</small></div><b class="${x.amount<0?'g':'r'}">${fm(Math.abs(x.amount))}</b></div>`).join('')||'<p class="mu c">No cash events</p>'))}
    if(k==='payouts'){const d=await api('/partner/payouts');return page('Payout history',d.payouts.map(x=>`<div class="ps-li"><span class="ic">🏦</span><div><b>${fm(x.amount)}</b><small>${dt(x.created_at)}</small></div><span class="tag">${esc(x.status)}</span></div>`).join('')||'<p class="mu c">No payouts yet</p>')}
  }catch(e){toast('⚠️ '+e.message)}
}
async function bank(){
  try{KYC=(await api('/partner/payout-profile')).profile}catch(e){}
  const st=(KYC&&KYC.kyc_status)||'not_submitted',lab={not_submitted:'Not submitted',pending:'Verification pending',verified:'Verified ✅',failed:'Verification failed'}[st]||st;
  page('Bank details',`<div class="ps-card"><div class="rw"><b>Status</b><b>${lab}</b></div></div>
  <div class="fld"><label>Beneficiary name (as per bank)</label><input id="bn" value="${esc((KYC&&KYC.beneficiary_name)||ME.name)}"></div>
  <p class="mu" style="font-size:13px;margin-bottom:12px">Bank account verification is done securely by our payment partner.</p>
  <button class="full big" onclick="PS.bankSave(this)">Submit for verification</button>`);
}
async function bankSave(b){const n=q('#bn').value.trim();if(!n)return toast('Enter beneficiary name');b.disabled=true;try{const r=await api('/partner/payout-profile','POST',{beneficiaryName:n});toast(r.message||'Submitted');KYC=null;back();refresh()}catch(e){b.disabled=false;msg('Bank details',e.message)}}
function msg(t,m){openOv(`<div class="ps-sheet"><div class="ps-sh"><b>${esc(t)}</b><button onclick="PS.back()">×</button></div><p class="ps-pp">${esc(m)}</p><button class="full big" onclick="PS.back()">OK</button></div>`,'sheet')}
async function withdraw(){try{const r=await api('/partner/payout-request','POST');msg('Withdraw',r.message||'Payout requested ✅');refresh()}catch(e){msg('Withdraw',e.message)}}
const deposit=()=>payCashDue(()=>refresh()).catch(e=>msg('Deposit',e.message));
function nc(){
  const l=nlist();l.forEach(x=>x.r=1);LS[NK()]=JSON.stringify(l);bell();
  page('Notification centre',l.map(x=>`<div class="ps-li"><span class="ic">🔔</span><div><b>${esc(x.t)}</b><small>${esc(x.b||'')}<br>${dt(x.ts)}</small></div></div>`).join('')||'<div class="ps-off"><div>🔔</div><b>No notifications yet</b><p class="mu">New order alerts will appear here.</p></div>');
}
/* OTP entry sheet (replaces prompt()) */
function otp(title,cb){openOv(`<div class="ps-sheet"><div class="ps-sh"><b>${esc(title)}</b><button onclick="PS.back()">×</button></div><input id="psOtp" class="otp" inputmode="numeric" maxlength="6" placeholder="• • • • • •" oninput="this.value=this.value.replace(/\\D/g,'')"><button class="full big" id="psOk">Confirm</button></div>`,'sheet');
  setTimeout(()=>{const i=q('#psOtp');i&&i.focus()},200);q('#psOk').onclick=async()=>{const v=q('#psOtp').value;if(v.length<4)return toast('Enter the OTP');q('#psOk').disabled=true;try{await cb(v);back()}catch(e){q('#psOk').disabled=false;toast('⚠️ '+e.message)}}}

/* ---------- data loop ---------- */
async function refresh(){
  if(!ME||busy)return;busy=true;
  try{
    const n=await C.fetch(),old=D;D=n;
    if(LAST!==null){
      if(old&&!old.approved&&n.approved)alertU('Account approved 🎉','You can now go online and start earning.');
      if(old&&!old.cash.blocked&&n.cash.blocked)alertU('Cash limit reached','Deposit your cash to receive new '+C.word()+'s.');
      const fresh=n.available.filter(j=>!LAST.includes(j.id));if(n.online&&fresh.length){alertU('New '+C.word()+' nearby!',C.alertBody(fresh[0]),true);if(C.incoming&&!OV.length)C.incoming(fresh[0])}
    }
    LAST=n.available.map(j=>j.id);
    const ids=new Set(n.tx.map(x=>x.id));if(LASTTX!==null)n.tx.filter(x=>!LASTTX.has(x.id)&&x.amt>0&&/^Earning/.test(x.note)).forEach(x=>alertU('💰 Earning credited',fm(x.amt)+' • '+ref(x.note)));LASTTX=ids;
    const now=Date.now();if(n.online&&tick)LS[OTK()]=(+(LS[OTK()]||0))+Math.min(30,(now-tick)/1000);tick=now;
    C.shareWhen(n)?locStart():locStop();
    if(!OV.length&&!typing())await draw();else sw();
  }catch(e){if(!D)q('#psb').innerHTML='<div class="ps-off"><div>📡</div><b>Could not load</b><p class="mu">'+esc(e.message)+'</p><button class="full big" onclick="PS.refresh()">Retry</button></div>'}
  busy=false;
}
async function toggle(){
  if(!D)return;if(!D.approved)return toast('⏳ Admin approval pending – abhi online nahi ja sakte');
  try{
    const go=!D.online;await api('/partner/online','POST',{online:go});
    if(go){const p=await perm();if(!p.l||!p.n)permSheet(true)}
    tick=0;await refresh();toast(go?'🟢 You are online':'You are offline')
  }catch(e){toast('⚠️ '+e.message)}
}
function render(){
  if(!ME||!C.roleOk(ME)){if(ME&&!C.roleOk(ME)){T='';delete localStorage[KEY];ME=null}locStop();return authView('login')}
  D=null;LAST=null;LASTTX=null;tick=0;mount();refresh().then(()=>{if(!LS.uv_perm)permSheet()});
  api('/partner/payout-profile').then(r=>{KYC=r.profile}).catch(()=>{});
}
function setup(cfg){
  C=Object.assign({kinds:null,multi:false,shareWhen:d=>d.online},cfg);
  clearInterval(tmr);tmr=setInterval(()=>{if(ME&&!document.hidden&&D&&q('#psb'))refresh()},8000);
}
function start(cfg){
  C=Object.assign({kinds:null,multi:false,shareWhen:d=>d.online},cfg);
  window.view=render;window.onUnauth=()=>{ME=null;locStop();render()};
  (async()=>{if(T)try{ME=(await api('/me')).user}catch(e){}render();clearInterval(tmr);tmr=setInterval(()=>{if(ME&&!document.hidden&&D)refresh()},8000)})();
}
window.PS={start,setup,show:render,ov:openOv,ovn:()=>OV.length,stop:()=>{locStop();D=null;LAST=null;LASTTX=null},back,toggle,refresh,auth,tab:authView,allow,perm:f=>permSheet(f),otp,deposit,withdraw,sub,bank,bankSave,nc,info,
  go:t=>{TAB=t;window.scrollTo(0,0);draw()},filt:f=>{FILT=f;draw()},
  snd:()=>{LS.uv_snd=LS.uv_snd==='0'?'1':'0';draw()},
  logout:()=>{if(confirm('Log out?')){locStop();logout()}}};
})();
