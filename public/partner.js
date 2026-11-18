/* UniVerse Driver Partner app — Ola/Uber-style onboarding + driver dashboard */
const app=$('#app'),LS=localStorage,PL=(window.Capacitor&&window.Capacitor.Plugins)||{};
const LOGO='<svg viewBox="0 0 512 512" class="lg"><rect width="512" height="512" rx="112" fill="#080b14"/><path d="M100 150h82l74 125 74-125h82L256 410z" fill="#7657ff"/><circle cx="256" cy="256" r="42" fill="#55d6ff"/></svg>';
const CITIES=['Delhi','Gurgaon','Noida','Ghaziabad','Faridabad','Greater Noida','Mumbai','Thane','Navi Mumbai','Pune','Nagpur','Nashik','Bengaluru','Mysuru','Hyderabad','Visakhapatnam','Vijayawada','Chennai','Coimbatore','Madurai','Tiruchirappalli','Kochi','Thiruvananthapuram','Kolkata','Howrah','Siliguri','Ahmedabad','Surat','Vadodara','Rajkot','Gandhidham','Jaipur','Jodhpur','Udaipur','Kota','Lucknow','Kanpur','Varanasi','Agra','Prayagraj','Meerut','Bareilly','Chandausi','Moradabad','Aligarh','Gorakhpur','Patna','Ranchi','Jamshedpur','Bhubaneswar','Cuttack','Raipur','Bhopal','Indore','Gwalior','Jabalpur','Chandigarh','Ludhiana','Amritsar','Jalandhar','Dehradun','Haridwar','Shimla','Jammu','Samba','Srinagar','Guwahati','Nagaon','Imphal','Goa','Mangaluru','Hubballi','Kalyani','Santipur','Panipat','Rohtak','Hisar'];
const DT={rc:{t:'Vehicle RC',ic:'🚗',h:'CERTIFICATE OF REGISTRATION',sides:['front','back']},dl:{t:'Driving Licence',ic:'🪪',h:'DRIVING LICENCE',sides:['front','back']},aadhaar:{t:'Aadhaar Card',ic:'🆔',h:'AADHAAR CARD',sides:['front','back']},photo:{t:'Profile Photo',ic:'👤',sides:['front']}};
const ORDER=['rc','dl','aadhaar','photo'];
const REASONS=['Need to change city of operation','Need to edit verified details','Not able to submit application','Other'];
let AUTH='login',STEP=null,CUR=null,REG={name:'',mobile:'',email:'',password:'',city:'',referral:''},DOCS=[],PICK={},TAB='home',D=null,EARN=null,PAYS=null,POP=null,POPT=null,SKIP=new Set(),LASTAV=null,WID=null,LASTSEND=0,WL=null,REASON=null;
const soundOn=()=>LS.dr_sound!=='0';
const initial=()=>esc((ME&&ME.name||'D').trim().charAt(0).toUpperCase());
const dt=ts=>new Date(ts).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
const VT={auto:['🛺','Auto-rickshaw'],bike:['🏍️','Two Wheeler'],car:['🚗','Car'],ev:['🛵','Slow EV']};

/* ---------- notifications / sound / gps / wake-lock ---------- */
async function notify(t,b){try{if(navigator.vibrate)navigator.vibrate([300,120,300,120,300]);if(PL.LocalNotifications){await PL.LocalNotifications.schedule({notifications:[{id:Date.now()%2147483000,title:t,body:b,schedule:{at:new Date(Date.now()+300)}}]});return}
 if('Notification' in window&&Notification.permission==='granted'){const r=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration();if(r&&r.showNotification)return r.showNotification(t,{body:b,icon:'/pwa-192.png',vibrate:[300,120,300]});new Notification(t,{body:b})}}catch(e){}}
function beep(){if(!soundOn())return;try{const C=window.AudioContext||window.webkitAudioContext,c=new C();[0,.25,.5].forEach(d=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type='square';o.frequency.value=d===.25?1040:880;g.gain.setValueAtTime(.3,c.currentTime+d);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+d+.22);o.start(c.currentTime+d);o.stop(c.currentTime+d+.24)});setTimeout(()=>c.close(),1200)}catch(e){}}
function shareLoc(){if(!navigator.geolocation||WID!==null)return;WID=navigator.geolocation.watchPosition(p=>{const n=Date.now();if(n-LASTSEND<5000)return;LASTSEND=n;api('/partner/location','POST',{lat:p.coords.latitude,lng:p.coords.longitude}).catch(()=>{})},()=>{},{enableHighAccuracy:true,maximumAge:3000,timeout:20000})}
function stopLoc(){if(WID!==null){navigator.geolocation.clearWatch(WID);WID=null}}
async function keepAwake(on){try{if(on&&'wakeLock' in navigator&&!WL){WL=await navigator.wakeLock.request('screen');WL.addEventListener('release',()=>WL=null)}else if(!on&&WL){await WL.release();WL=null}}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&D&&D.online)keepAwake(true)});
window.addEventListener('online',()=>{toast('Internet wapas aa gaya');ME&&view()});window.addEventListener('offline',()=>{if(D)render()});

/* ---------- small ui helpers ---------- */
const hero=(t,back)=>`<div class="hero">${back?`<button class="bk" onclick="${back}">←</button>`:''}${LOGO}<h1>${t}</h1></div>`;
function sheet(h,p,yes,fn,no){const e=document.createElement('div');e.className='ov';e.id='ov';e.innerHTML=`<div class="sheet"><h3>${h}</h3><p>${p}</p><button class="cta" id="sy">${yes}</button><button class="cta g" id="sn">${no||'Cancel'}</button></div>`;document.body.appendChild(e);$('#sn').onclick=closeSheet;$('#sy').onclick=()=>{closeSheet();fn()}}
function closeSheet(){const e=$('#ov');if(e)e.remove()}
const refreshMe=async()=>{ME=(await api('/me')).user};

/* ---------- 1. permissions ---------- */
function permV(){app.innerHTML=`<div class="perm"><div class="ill">${LOGO}</div><h2>Permissions Required</h2><p>Ride request alert aur live location ke liye notification aur location permission chahiye.</p><div class="pl"><div><span>🔔</span>Notifications<b id="pn"></b></div><div><span>📍</span>Location (GPS)<b id="pl"></b></div></div><button class="cta blue" onclick="askPerms()">ALLOW PERMISSION</button><a class="lnk" onclick="finishPerm()">Skip for now</a></div>`}
function finishPerm(){LS.dr_onb='1';view()}
const askPerms=async()=>{let n=false,l=false;
 try{if(PL.LocalNotifications)n=(await PL.LocalNotifications.requestPermissions()).display==='granted';else if('Notification' in window)n=(await Notification.requestPermission())==='granted'}catch(e){}
 $('#pn').textContent=n?'Allowed ✓':'Denied';
 try{if(PL.Geolocation){const r=await PL.Geolocation.requestPermissions();l=r.location==='granted'||r.coarseLocation==='granted'}else l=await new Promise(ok=>navigator.geolocation?navigator.geolocation.getCurrentPosition(()=>ok(true),()=>ok(false),{enableHighAccuracy:true,timeout:15000}):ok(false))}catch(e){}
 $('#pl').textContent=l?'Allowed ✓':'Denied';if(!l)toast('Location band hai — phone settings se allow karo');setTimeout(finishPerm,900)};

/* ---------- 2. login / registration ---------- */
function loginV(){app.innerHTML=hero('Welcome back, Partner')+`<div class="pg"><h2>Login</h2><p class="mu">Mobile ya email aur password se login karo</p><input id="i1" placeholder="Mobile number or email" autocomplete="username"><input id="i2" type="password" placeholder="Password" autocomplete="current-password"><div class="push"></div><button class="cta" onclick="doLogin()">Login</button><p class="alt">Naye ho? <a onclick="AUTH='signup';view()">Register karo</a></p></div>`}
const doLogin=wrap(async()=>{const d=await api('/login','POST',{identity:$('#i1').value,password:$('#i2').value});if(d.user.role!=='partner')throw Error('Ye partner account nahi hai');T=d.token;LS[KEY]=T;ME=d.user;STEP=null;view()});
const regOk=()=>REG.name.trim().length>1&&/^\d{10}$/.test(REG.mobile)&&/^\S+@\S+\.\S+$/.test(REG.email)&&REG.password.length>=8&&!!REG.city;
const chk=()=>{const b=$('#nx');if(b)b.disabled=!regOk()};
function regV(){const f=(k,ph,ty,ex)=>`<input placeholder="${ph}" type="${ty||'text'}" value="${esc(REG[k])}" ${ex||''} oninput="REG.${k}=this.value;chk()">`;
 app.innerHTML=hero('Let’s Get Started with UniVerse!',"AUTH='login';view()")+`<div class="pg"><h2>Registration is super simple.</h2><p class="mu">Please enter your details</p>${f('name','Full name')}${f('mobile','Mobile number (10 digits)','tel','maxlength="10" inputmode="numeric"')}${f('email','Email','email')}${f('password','Password (8+ characters)','password')}<button class="sel" onclick="cityV()">${esc(REG.city)}</button>${f('referral','Referral code (optional)')}<div class="push"></div><p class="tc">By continuing, you agree to UniVerse T&amp;C</p><button id="nx" class="cta" ${regOk()?'':'disabled'} onclick="doReg()">Next</button></div>`}
function cityV(){app.innerHTML=`<div class="pg plain"><button class="bk" style="color:#222" onclick="regV()">←</button><h2>Select the city you will drive in</h2><input id="cq" placeholder="Search for a City" oninput="drawCities(this.value)"><div id="cl"></div></div>`;drawCities('')}
function drawCities(q){q=q.trim().toLowerCase();$('#cl').innerHTML=CITIES.filter(c=>c.toLowerCase().includes(q)).map(c=>`<div class="row" style="font-size:19px;padding:22px 4px" onclick="REG.city='${c}';regV()">${c}<span class="mu">›</span></div>`).join('')||'<div class="empty">Koi city nahi mili</div>'}
const doReg=wrap(async()=>{const d=await api('/partner/signup','POST',{name:REG.name.trim(),mobile:REG.mobile,email:REG.email.trim(),password:REG.password,kind:'driver',city:REG.city,referral:REG.referral.trim()});T=d.token;LS[KEY]=T;ME=d.user;STEP=null;REG.password='';toast('Account ban gaya! Ab vehicle add karo');view()});

/* ---------- 3. vehicle ---------- */
function vtypeV(){app.innerHTML=hero('Add Your Vehicle - Unlock Your Earning Potential!',"logout()")+`<div class="pg"><h2>Please select your vehicle</h2><p class="mu">Which vehicle will you be driving?</p><div class="tiles">${Object.keys(VT).map(k=>`<button class="tile ${ME.vehicle_type===k?'on':''}" onclick="pickType('${k}')"><span>${VT[k][0]}</span>${VT[k][1]}</button>`).join('')}</div><div class="info"><i>ℹ️</i>You can add more vehicles after completing the onboarding process</div></div>`}
const pickType=wrap(async t=>{await api('/partner/profile','POST',{city:ME.city||REG.city,vehicleType:t});await refreshMe();STEP='vnum';view()});
function vnumV(){const v=ME.vehicle&&ME.vehicle!=='PENDING'?ME.vehicle:'';app.innerHTML=hero('Add Your Vehicle - Unlock Your Earning Potential!',"STEP='vtype';view()")+`<div class="pg"><h2>Vehicle Registration number</h2><p class="mu">Please enter your vehicle Registration number</p><input id="vn" placeholder="Vehicle registration number" value="${esc(v)}" autocapitalize="characters" oninput="this.value=this.value.toUpperCase();vchk()"><div class="push"></div><div class="info"><i>ℹ️</i>You can add more vehicles after completing the onboarding process</div><button id="vc" class="cta" disabled onclick="saveVeh()">Continue</button></div>`;vchk()}
const vOk=s=>/^[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{4}$/.test(s.replace(/[\s-]/g,''));
const vchk=()=>{const b=$('#vc');if(b)b.disabled=!vOk($('#vn').value)};
const saveVeh=wrap(async()=>{await api('/partner/profile','POST',{vehicle:$('#vn').value,vehicleType:ME.vehicle_type});await refreshMe();STEP='docs';view()});

/* ---------- 4. documents ---------- */
const dget=(t,s)=>DOCS.find(d=>d.doc_type===t&&d.side===s);
const haveAll=()=>ORDER.every(t=>dget(t,'front'));
function docState(t){const f=dget(t,'front');if(!f)return['Upload '+DT[t].t,''];if(f.status==='approved')return['Verified ✓','ok'];if(f.status==='rejected')return['Rejected'+(f.note?': '+esc(f.note):'')+' — dobara upload karo','bad'];return['Uploaded • review mein',''+'']}
function docsV(){const sub=ME.app_status==='submitted';
 app.innerHTML=hero('Upload Your Documents - Quick &amp; Simple Process',"STEP='vnum';view()")+`<div class="pg"><h2>Upload documents</h2><p class="mu">Keep all these documents handy</p>${ORDER.map(t=>{const s=docState(t);return`<div class="dr" onclick="openDoc('${t}')"><span>${DT[t].ic}</span><div><b>${DT[t].t}</b><small class="${s[1]}">${s[0]}</small></div><i>›</i></div>`}).join('')}<div class="push"></div>${haveAll()?`<button class="cta" onclick="submitApp()">${sub?'Re-submit Application':'Submit Application'}</button>`:`<button class="cta" onclick="openDoc(ORDER.find(t=>!dget(t,'front')))">Start Upload</button>`}<a class="lnk red" onclick="STEP='cancel';view()">Cancel Application</a></div>`}
function openDoc(t){CUR=t;PICK={};STEP='doc';view()}
function docV(){const c=DT[CUR],one=c.sides.length===1;
 const samp=one?'':`<div class="samp"><div class="h">${c.h}</div><div class="b"><div class="ph"></div><div style="flex:1"><div class="ln"></div><div class="ln" style="width:70%"></div><div class="ln" style="width:85%"></div></div></div><div class="no">XXXX XXXX XXXX</div></div>`;
 const tile=s=>{const ex=dget(CUR,s);return`<label class="up ${one?'one':''} ${ex?'has':''}" id="t_${s}"><input type="file" accept="image/*" onchange="pickFile('${s}',this)"><span class="ic">⬆️</span>${one?'<span class="ic" style="display:block">➕</span>Add photo':'Upload '+s+' side'}<span class="tx" ${ex?'':'style="display:none"'}>${ex?'✓ Uploaded — tap to change':''}</span></label>`};
 app.innerHTML=`<div class="pg plain"><button class="bk" style="color:#222" onclick="STEP='docs';view()">←</button><h2>${c.t}</h2><p style="color:#444;font-size:18px;line-height:1.5">${one?'Make sure your photo is entirely visible, glare free and not blurred.':'Make sure that all the data on your document is fully visible, glare free and not blurred'}</p>${samp}<div class="ups">${c.sides.map(tile).join('')}</div><div class="push"></div><button id="ub" class="cta" disabled onclick="uploadDoc()">Upload &amp; continue</button><a class="lnk" onclick="STEP='docs';view()">Upload Later</a></div>`}
function pickFile(s,inp){const f=inp.files[0];if(!f)return;PICK[s]=f;const t=$('#t_'+s);t.classList.add('has');t.style.backgroundImage=`url(${URL.createObjectURL(f)})`;const x=t.querySelector('.tx');x.style.display='block';x.textContent='✓ Selected — tap to change';$('#ub').disabled=false}
function compress(file){return new Promise((ok,no)=>{const im=new Image(),u=URL.createObjectURL(file);im.onload=()=>{const s=Math.min(1,1280/Math.max(im.width,im.height)),w=Math.round(im.width*s),h=Math.round(im.height*s),c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(im,0,0,w,h);let q=.8,d=c.toDataURL('image/jpeg',q);while(d.length>1150000&&q>.3){q-=.1;d=c.toDataURL('image/jpeg',q)}URL.revokeObjectURL(u);ok(d)};im.onerror=()=>no(Error('Photo khul nahi paayi, dusri photo try karo'));im.src=u})}
const uploadDoc=wrap(async()=>{const b=$('#ub');b.disabled=true;b.textContent='Uploading…';try{for(const s of Object.keys(PICK))await api('/partner/docs','POST',{type:CUR,side:s,data:await compress(PICK[s])});}catch(e){b.disabled=false;b.textContent='Upload & continue';throw e}
 DOCS=(await api('/partner/docs')).docs;PICK={};const nx=ORDER.find(t=>!dget(t,'front'));toast('Upload ho gaya ✅');if(nx)openDoc(nx);else{STEP='docs';view()}});
const submitApp=wrap(async()=>{await api('/partner/application/submit','POST',{});await refreshMe();STEP=null;toast('Application submit ho gayi 🎉');view()});

/* ---------- 5. cancel application ---------- */
function cancelV(){app.innerHTML=`<div class="pg plain"><button class="bk" style="color:#222" onclick="STEP=null;REASON=null;view()">←</button><h2 style="font-size:25px">Tell us why do you want to cancel application</h2><div class="rs">${REASONS.map((r,i)=>`<label><input type="radio" name="rs" ${REASON===r?'checked':''} onchange="REASON='${r}';$('#cb').disabled=false"> ${r}</label>`).join('')}</div><div class="push"></div><button id="cb" class="cta" ${REASON?'':'disabled'} onclick="askCancel()">Cancel Application</button></div>`}
const askCancel=()=>sheet('Are you sure?','Vehicle ya details badalne ke liye application cancel karke dobara shuru karna hoga. Continue karne par aapke saare documents aur jaankari delete ho jayegi.','Yes! Cancel Application',doCancel,'No! Go back');
const doCancel=wrap(async()=>{await api('/partner/application/cancel','POST',{reason:REASON});await refreshMe();DOCS=[];STEP=null;REASON=null;toast('Application cancel ho gayi');view()});

/* ---------- 6. under review ---------- */
function reviewV(){const rej=ORDER.some(t=>{const f=dget(t,'front');return f&&f.status==='rejected'});
 app.innerHTML=hero(rej?'Kuch documents reject hue':'Application Under Review')+`<div class="pg"><h2>${rej?'Documents fix karo':'Aapki application submit ho gayi'}</h2><p class="mu">${rej?'Reject hue documents dobara upload karke Re-submit karo.':'Admin aapke documents verify karega. Approval ke baad aap online ja sakte ho.'}</p>${ORDER.map(t=>{const s=docState(t);return`<div class="dr"><span>${DT[t].ic}</span><div><b>${DT[t].t}</b><small class="${s[1]}">${s[0]}</small></div></div>`}).join('')}<div class="push"></div>${rej?`<button class="cta" onclick="STEP='docs';view()">Fix Documents</button>`:`<button class="cta" onclick="view()">Refresh Status</button>`}<a class="lnk red" onclick="STEP='cancel';view()">Cancel Application</a><a class="lnk" onclick="logout()">Logout</a></div>`}

/* ---------- 7. driver dashboard (approved) ---------- */
async function load(){try{[D,EARN]=await Promise.all([api('/partner/jobs'),api('/partner/earnings')]);if(TAB==='earn'){try{PAYS=(await api('/partner/payouts')).payouts}catch{PAYS=[]}}}catch(e){if(!D){app.innerHTML=`<div class="perm"><h2>Connection problem</h2><p>${esc(e.message)}</p><button class="cta" onclick="view()" style="margin-top:20px">Retry</button></div>`}return}
 ME.online=D.online;ME.approved=D.approved;
 if(D.online){keepAwake(true);shareLoc();const nw=D.available.filter(x=>!SKIP.has(x.id)&&(LASTAV===null||!LASTAV.includes(x.id)));if(nw.length&&!POP&&!D.mine.length)showPop(nw[0])}else{keepAwake(false);stopLoc()}
 if(POP&&!D.available.some(x=>x.id===POP)){closePop();toast('Ye ride kisi aur ne le li')}
 LASTAV=D.available.map(x=>x.id);render()}
function banner(){if(!navigator.onLine)return`<div class="bn r"><b>📡</b><div>Internet nahi hai<small>Connection wapas aane tak rides update nahi hongi</small></div></div>`;
 if(D.cash.blocked)return`<div class="bn r"><b>⛔</b><div>Cash limit reached (${inr(D.cash.limit)})<small>Nayi rides ke liye ${inr(D.cash.inHand)} deposit karo</small></div><button onclick="deposit()">Pay now</button></div>`;return''}
function render(){if(!D)return;const body={home:homeV,earn:earnV,acct:acctV}[TAB]();
 const tabs=[['home','🏠','Home'],['earn','👛','Earnings'],['acct','👤','Account']];
 app.innerHTML=`<div class="top">${LOGO}<b>UniVerse Driver</b><span class="sp"></span><span class="pill ${D.online?'on':''}">${D.online?'● Online':'Offline'}</span></div>${banner()}<div class="main">${body}</div><div class="tabs">${tabs.map(t=>`<button class="${TAB===t[0]?'on':''}" onclick="goTab('${t[0]}')"><span>${t[1]}</span>${t[2]}</button>`).join('')}</div>`}
const goTab=t=>{TAB=t;window.scrollTo(0,0);load()};
const today=()=>EARN.tx.filter(x=>x.amt>0&&x.note.startsWith('Earning')&&new Date(x.ts).toDateString()===new Date().toDateString());
function homeV(){const tr=today(),sum=tr.reduce((a,x)=>a+x.amt,0);
 const stats=`<div class="card st"><div><b>${inr(sum)}</b><small>Today's earnings</small></div><div><b>${tr.length}</b><small>Rides today</small></div><div><b>${inr(D.cash.inHand)}</b><small>Cash in hand</small></div></div>`;
 if(D.mine.length)return D.mine.map(rideCard).join('')+stats;
 const go=!D.online?`<div class="card go"><button class="gob off" onclick="setOnline(true)">GO<br>ONLINE</button><b style="font-size:20px">You're offline</b><p class="mu" style="margin-top:6px">${D.approved?'Ride requests lene ke liye online jao':'Admin approval pending'}</p></div>`
  :`<div class="card go"><div class="pulse"><i></i></div><b style="font-size:20px">Finding rides near you…</b><p class="mu" style="margin:6px 0 14px">Stay on this screen — ride request aate hi alert milega</p><button class="cta o" style="width:auto;display:inline-block;padding:12px 26px" onclick="setOnline(false)">Go offline</button></div>`;
 return go+stats+(D.online&&D.available.length?`<h3 class="sec">NEARBY RIDE REQUESTS</h3>${D.available.map(j=>`<div class="card ride"><div class="rh"><b>${esc(j.ref)}</b><span class="chip">${esc(j.type||'')}</span></div><div class="pin"><em>🟢</em><div>${esc(j.pickup)}</div></div><div class="pin"><em>🔴</em><div>${esc(j.dest)}</div></div><div class="fare">${inr(j.fare)} <small>${j.km} km • aapki earning ${inr(j.pearn)}</small></div><button class="cta" onclick="acceptRide(${j.id})">Accept Ride</button></div>`).join('')}`:'')}
const stepper=st=>{const i=st==='On trip'?2:1,L=['Accepted','On trip','Completed'];return`<div class="stp">${L.map((x,k)=>`<div class="${k<i?'d':k===i?'c':''}"><i>${k<i?'✓':k+1}</i><span>${x}</span></div>`).join('')}</div>`};
const nav=a=>`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(a)}`;
function rideCard(j){const trip=j.status==='On trip';
 return`<div class="card ride"><div class="rh"><b>${esc(j.ref)}</b><span class="chip">${esc(j.type||'ride')}</span></div>${stepper(j.status)}<div class="pin"><em>🟢</em><div><b>Pickup</b><br>${esc(j.pickup)}</div></div><div class="pin"><em>🔴</em><div><b>Drop</b><br>${esc(j.dest)}</div></div><div class="fare">${inr(j.fare)} <small>cash collect karo • ${j.km} km • aapki earning ${inr(j.pearn)}</small></div>
 <div class="pin"><em>👤</em><div>${esc(j.cname)}</div></div><div class="acts"><a class="act" target="_blank" href="${nav(trip?j.dest:j.pickup)}">🧭 Navigate ${trip?'to drop':'to pickup'}</a><a class="act" href="tel:${esc(j.cmobile)}">📞 Call rider</a></div>
 <button class="cta" onclick="nextStep(${j.id},${j.fare},${trip})">${trip?'Complete Ride':'Start Trip'}</button>${trip?'':`<a class="lnk red" onclick="releaseRide(${j.id})">Release ride</a>`}</div>`}
const setOnline=wrap(async v=>{await api('/partner/online','POST',{online:v});toast(v?'Aap online ho 🟢':'Aap offline ho');load()});
const acceptRide=wrap(async id=>{try{await api('/partner/accept/'+id,'POST')}finally{load()}toast('Ride accept ho gayi 🚀')});
const nextStep=(id,fare,trip)=>trip?sheet('Ride complete?',`Rider se ${inr(fare)} cash collect kar liya?`,'Yes, Complete Ride',()=>doNext(id),'Not yet'):doNext(id);
const doNext=wrap(async id=>{const r=await api('/partner/next/'+id,'POST',{});if(r.status==='Completed'){const e=document.createElement('div');e.className='ov';e.id='ov';e.innerHTML=`<div class="sheet" style="text-align:center"><div style="font-size:56px">🎉</div><h3>Ride complete!</h3><p>Earning aapke pocket mein add ho gayi</p><button class="cta" onclick="closeSheet()">Done</button></div>`;document.body.appendChild(e)}else toast('Trip shuru ho gayi');load()});
const releaseRide=id=>sheet('Ride release karein?','Ye ride kisi doosre driver ko mil jayegi.','Yes, Release',async()=>{try{await api('/partner/release/'+id,'POST');toast('Ride released')}catch(e){toast(e.message)}load()},'No');
/* new-ride popup */
function showPop(j){POP=j.id;let t=30;beep();notify('🚕 Nayi ride request',inr(j.fare)+' • '+j.km+' km');const e=document.createElement('div');e.className='ov';e.id='pop';
 e.innerHTML=`<div class="sheet"><div class="mu" style="text-align:center">NEW RIDE • <span id="pt">30</span>s</div><div class="fare" style="text-align:center">${inr(j.fare)} <small>${j.km} km</small></div><div class="pin"><em>🟢</em><div>${esc(j.pickup)}</div></div><div class="pin"><em>🔴</em><div>${esc(j.dest)}</div></div><div class="mu">Aapki earning ${inr(j.pearn)} • ${esc(j.type||'ride')} • cash fare</div><div class="two" style="padding:0"><button class="cta g" onclick="skipPop(${j.id})">Skip</button><button class="cta" onclick="acceptPop(${j.id})">Accept</button></div></div>`;
 document.body.appendChild(e);clearInterval(POPT);POPT=setInterval(()=>{t--;const x=$('#pt');if(x)x.textContent=t;if(t<=0)skipPop(j.id)},1000)}
function closePop(){clearInterval(POPT);POP=null;const e=$('#pop');if(e)e.remove()}
const skipPop=id=>{SKIP.add(id);closePop()};
const acceptPop=id=>{closePop();acceptRide(id)};
/* earnings */
function weekChart(tx){const days=[...Array(7)].map((_,k)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-6+k);return d}),v=days.map(d=>tx.filter(x=>x.amt>0&&new Date(x.ts).toDateString()===d.toDateString()).reduce((a,x)=>a+x.amt,0)),m=Math.max(1,...v),tot=v.reduce((a,b)=>a+b,0);
 return`<div class="card"><div class="cb"><div class="mu">Last 7 days</div><div class="big">${inr(tot)}</div><div class="bars">${v.map((x,k)=>`<div><b style="height:${Math.max(4,x/m*70)}px"></b><span>${'SMTWTFS'[days[k].getDay()]}</span></div>`).join('')}</div></div></div>`}
function earnV(){const w=EARN.wallet||0,c=D.cash;
 return`<div class="card"><div class="cb" style="text-align:center"><div class="mu">Pocket balance</div><div class="big">${inr(w)}</div></div><div class="row"><span>Cash in hand</span><b>${inr(c.inHand)}</b></div><div class="row"><span>Available cash limit</span><b>${inr(Math.max(0,c.limit-c.inHand))}</b></div><div class="two"><button class="cta o" ${c.inHand>0?'':'disabled'} onclick="deposit()">Deposit</button><button class="cta" ${w>0?'':'disabled'} onclick="withdraw()">Withdraw</button></div></div>${weekChart(EARN.tx)}
 <h3 class="sec">PAYOUTS</h3><div class="card">${(PAYS||[]).map(p=>`<div class="row"><div><b>${inr(p.amount)}</b><div class="mu">${dt(p.created_at)}</div></div><span class="chip">${esc(p.status)}</span></div>`).join('')||'<div class="empty">Abhi koi payout nahi</div>'}</div>
 <h3 class="sec">EARNINGS STATEMENT</h3><div class="card">${EARN.tx.map(x=>`<div class="row"><div><b>${esc(x.note)}</b><div class="mu">${dt(x.ts)}</div></div><b style="color:${x.amt>=0?'#0d7a37':'#c0182b'}">${x.amt>=0?'+':''}${inr(x.amt)}</b></div>`).join('')||'<div class="empty">Abhi koi earning nahi</div>'}</div>`}
const deposit=wrap(async()=>{await payCashDue(()=>load().catch(()=>{}))});
const withdraw=wrap(async()=>{await api('/partner/payout-request','POST',{});toast('Withdraw request bheja gaya ✅');load()});
/* account */
function acctV(){const u=ME,vt=VT[u.vehicle_type]||['🚕','Vehicle'];
 return`<div class="card"><div class="me"><div class="avt">${initial()}</div><div><h2 style="font-size:21px">${esc(u.name)}</h2><div class="mu">${esc(u.mobile)} • ${esc(u.city||'')}</div><span class="chip">${vt[0]} ${esc(u.vehicle||'')}</span></div></div><div class="row"><span>Account status</span><b style="color:#0d7a37">✅ Approved driver</b></div><div class="row"><span>Vehicle type</span><b>${vt[1]}</b></div></div>
 <div class="card menu"><a href="tel:919319949612"><span>🎧</span>Helpline<span>›</span></a><a href="https://wa.me/919999999999" target="_blank"><span>💬</span>WhatsApp support<span>›</span></a><button onclick="goTab('earn')"><span>👛</span>Pocket & statements<span>›</span></button><button onclick="toggleSound()"><span>🔔</span>Ride alert sound: ${soundOn()?'ON':'OFF'}<span>›</span></button><button onclick="beep();notify('Test alert','Ride alert aise aayega')"><span>🧪</span>Test ride alert<span>›</span></button></div>
 <button class="cta o" onclick="logout()">Logout</button><div class="mu" style="text-align:center;margin:14px 0;display:flex;gap:8px;justify-content:center;align-items:center">${LOGO.replace('class="lg"','class="lg" style="width:22px;height:22px"')}UniVerse Driver</div>`}
const toggleSound=()=>{LS.dr_sound=soundOn()?'0':'1';render()};

/* ---------- router ---------- */
async function view(){
 closeSheet();
 if(!ME){stopLoc();D=null;if(!LS.dr_onb)return permV();return AUTH==='login'?loginV():regV()}
 if(ME.role!=='partner'){ME=null;T='';delete LS[KEY];return loginV()}
 if(ME.kind!=='driver'){app.innerHTML=`<div class="perm"><div class="ill">${LOGO}</div><h2>Ye delivery partner account hai</h2><p>Delivery partner app use karo.</p><a class="cta blue" href="/delivery" style="margin-top:24px">Open Delivery App</a><a class="lnk" onclick="logout()">Logout</a></div>`;return}
 if(ME.approved)return load();
 stopLoc();D=null;
 try{const r=await api('/partner/docs');DOCS=r.docs;if(r.user)ME=r.user}catch(e){toast(e.message)}
 const s=STEP||(ME.app_status==='submitted'?'review':!ME.vehicle_type?'vtype':(!ME.vehicle||ME.vehicle==='PENDING')?'vnum':'docs');
 ({vtype:vtypeV,vnum:vnumV,docs:docsV,doc:docV,cancel:cancelV,review:reviewV}[s]||docsV)();
}
window.onUnauth=()=>{ME=null;D=null;STEP=null;view()};
(async()=>{if(T)try{ME=(await api('/me')).user}catch{}view();
 setInterval(()=>{if(!ME||document.hidden||!navigator.onLine)return;if(ME.approved){if(!POP&&!$('#ov')&&idleForRefresh())load()}else if(!STEP&&$('.hero'))refreshMe().then(view).catch(()=>{})},5000)})();
