/* UniVerse Driver app (/driver) – Ola-Partner-style onboarding, then the partner shell (pshell.js) */
const LS=localStorage,drv=$('#drv');
const PL=(window.Capacitor&&Capacitor.Plugins)||{};
const CITIES=['Delhi','Noida','Gurugram','Ghaziabad','Faridabad','Mumbai','Pune','Bengaluru','Hyderabad','Chennai','Kolkata','Ahmedabad','Jaipur','Lucknow','Kanpur','Bareilly','Chandigarh','Indore','Bhopal','Patna','Surat','Nagpur','Visakhapatnam','Tiruchirappalli','Coimbatore','Kochi','Guwahati','Dehradun','Ranchi','Ludhiana','Agra','Varanasi','Meerut','Prayagraj'];
const VEH=[['auto','🛺','Auto-rickshaw'],['bike','🏍️','Two Wheeler'],['car','🚗','Car'],['ev','🛵','Slow EV']];
const VLAB=Object.fromEntries(VEH.map(v=>[v[0],v[2]]));
const DOCS=[
 {k:'rc',t:'Vehicle RC',sub:'Upload Vehicle RC',ic:'🚘',types:['rc_front','rc_back'],lab:['front','back'],sample:['CERTIFICATE OF REGISTRATION','Registration No: <b>KA00HR1234</b>']},
 {k:'dl',t:'Driving Licence',sub:'Upload Driving Licence',ic:'🪪',types:['dl_front','dl_back'],lab:['front','back'],sample:['DRIVING LICENCE','DL No: <b>DL01 2020 0001234</b>']},
 {k:'aadhaar',t:'Aadhar Card',sub:'Upload Aadhar Card',ic:'🆔',types:['aadhaar_front','aadhaar_back'],lab:['front','back'],sample:['AADHAR CARD','<b>8928 6878 5175</b>']},
 {k:'photo',t:'Profile Photo',sub:'Upload Profile Photo',ic:'👤',types:['photo'],lab:['photo']}];
let REG={phone:'',name:'',city:'',email:'',pw:'',vtype:'',vnum:''},DSTAT={},STACK=[],PICK={};

/* ---------- tiny navigation stack (Android back works) ---------- */
let onboarding=true;
function show(fn,replace){if(replace&&STACK.length)STACK[STACK.length-1]=fn;else{STACK.push(fn);history.pushState({dv:1},'')}fn()}
function reset(fn){STACK=[fn];fn()}
window.addEventListener('popstate',()=>{if(!onboarding)return;if(STACK.length>1){STACK.pop();STACK[STACK.length-1]()}});
const back=()=>history.back();
function screen(html,cls){drv.className='dv '+(cls||'');drv.innerHTML=html;window.scrollTo(0,0)}
const topbar=(right)=>`<div class="dv-top"><button class="dv-back" onclick="back()" aria-label="Back">←</button>${right||''}</div>`;
const hero=t=>`<div class="dv-hero"><button class="dv-back w" onclick="back()" aria-label="Back">←</button><h2>${t}</h2><div class="dv-play">▶</div></div>`;
const fe=(id,m)=>{const e=$('#e_'+id),i=$('#'+id);if(e)e.textContent=m||'';if(i)i.classList.toggle('bad',!!m);return !m};
function sheet(html){const o=document.createElement('div');o.className='dv-sh';o.innerHTML=`<div class="dv-shb">${html}</div>`;o.onclick=e=>{if(e.target===o)o.remove()};document.body.appendChild(o);return o}

/* ---------- splash + login ---------- */
function splash(){
  screen(`<div class="dv-logo"><span class="dot"></span><b>UniVerse</b> <i>DRIVER</i></div>
  <div class="dv-sky"><svg viewBox="0 0 360 150" preserveAspectRatio="xMidYMax slice"><g fill="#f4f5f7" stroke="#d3d6dc" stroke-width="2"><rect x="10" y="80" width="70" height="70"/><rect x="95" y="30" width="26" height="120"/><rect x="135" y="60" width="50" height="90"/><rect x="200" y="20" width="44" height="130"/><rect x="258" y="70" width="48" height="80"/><path d="M315 150V50l30 20v80z"/></g></svg></div>
  <div class="dv-foot"><button class="dv-btn" onclick="show(loginScreen)">LOGIN / REGISTER</button></div>`,'splash');
}
function loginScreen(){
  screen(topbar()+`<div class="dv-body"><h1>Login</h1><p class="dv-sub">Enter your registered mobile number or email.</p>
  <label class="dv-l">Mobile number or email</label><input class="dv-in" id="a1" autocapitalize="none" autocorrect="off" spellcheck="false" autocomplete="username" value="${esc(LS.uv_did||'')}"><small class="dv-e" id="e_a1"></small>
  <label class="dv-l">Password</label><div class="dv-pw"><input class="dv-in" id="a2" type="password" autocapitalize="none" autocomplete="current-password" onkeydown="if(event.key==='Enter')doLogin()"><button type="button" onclick="togglePw('a2',this)">👁️</button></div><small class="dv-e" id="e_a2"></small>
  <p id="aerr" class="dv-err"></p><p class="dv-sub" style="margin-top:22px">New driver? <a class="dv-a" onclick="startReg()">Register now</a></p></div>
  <div class="dv-foot"><button class="dv-btn" id="lbtn" onclick="doLogin()">LOGIN</button></div>`);
}
function togglePw(id,b){const i=document.getElementById(id);i.type=i.type=='password'?'text':'password';b.textContent=i.type=='password'?'👁️':'🙈'}
async function doLogin(){
  const id=$('#a1').value.trim(),pw=$('#a2').value,b=$('#lbtn'),er=$('#aerr');er.textContent='';
  let ok=fe('a1',id?'':'Enter mobile number or email');ok=fe('a2',pw?'':'Enter your password')&ok;if(!ok)return;
  b.disabled=true;b.textContent='PLEASE WAIT…';
  try{
    const d=await api('/login','POST',{identity:id,password:pw});
    if(d.user.role!=='partner'||d.user.kind!=='driver')throw new Error('This is not a cab driver account. Please use the correct app.');
    LS.uv_did=id;T=d.token;LS[KEY]=T;ME=d.user;toast('Welcome back, '+ME.name.split(' ')[0]+'!');route();
  }catch(e){b.disabled=false;b.textContent='LOGIN';const m=e.message||'';er.innerHTML='⚠️ '+(/wrong login/i.test(m)?'Mobile/email or password is incorrect. <a class="dv-a" onclick="startReg()">Register as a new driver</a>':esc(m))}
}

/* ---------- registration wizard ---------- */
function startReg(){REG={phone:'',name:'',city:'',email:'',pw:'',vtype:'',vnum:''};show(r1)}
function r1(){
  screen(topbar()+`<div class="dv-body"><div class="dv-ic">📱</div><h1>Enter your phone number</h1><p class="dv-sub">Payment info, ride details and important updates will be sent to this number.</p>
  <div class="dv-ph"><span>🇮🇳</span><div><small>Phone number</small><div class="r"><b>+91</b><input id="ph" inputmode="numeric" maxlength="10" value="${esc(REG.phone)}" oninput="this.value=this.value.replace(/\\D/g,'');$('#n1').disabled=!/^[6-9]\\d{9}$/.test(this.value)"></div></div></div><small class="dv-e" id="e_ph"></small>
  <p class="dv-sub" style="margin-top:22px">Already registered? <a class="dv-a" onclick="show(loginScreen)">Login</a></p></div>
  <div class="dv-foot"><button class="dv-btn" id="n1" disabled onclick="REG.phone=$('#ph').value;show(r2)">CONTINUE</button></div>`);
  setTimeout(()=>{const i=$('#ph');i&&i.focus();$('#n1').disabled=!/^[6-9]\d{9}$/.test(REG.phone)},120);
}
function r2(){
  screen(hero("Let's Get Started with UniVerse!")+`<div class="dv-sheet"><h1>Registration is super simple.</h1><p class="dv-sub">Please enter your details</p>
  <input class="dv-in" id="nm" placeholder="Full name" autocomplete="name" value="${esc(REG.name)}" oninput="REG.name=this.value;chk2()">
  <button class="dv-sel" onclick="REG.name=$('#nm').value;show(cityScreen)"><span class="${REG.city?'':'ph'}">${esc(REG.city||'Select City')}</span><i>⌄</i></button>
  <p class="dv-sub c" style="margin-top:26px">By continuing, you agree to UniVerse's <a class="dv-a">T&amp;C</a></p></div>
  <div class="dv-foot"><button class="dv-btn" id="n2" disabled onclick="show(r3)">NEXT</button></div>`,'hasHero');
  chk2();
}
function chk2(){const b=$('#n2');if(b)b.disabled=!(REG.name.trim().length>=2&&REG.city)}
function cityScreen(){
  const draw=q=>{const l=CITIES.filter(c=>c.toLowerCase().includes(q.toLowerCase()));$('#cl').innerHTML=l.map(c=>`<button class="dv-li" onclick="pickCity('${c}')">${c}<i>›</i></button>`).join('')+(q.trim().length>1&&!CITIES.some(c=>c.toLowerCase()==q.trim().toLowerCase())?`<button class="dv-li" onclick="pickCity('${esc(q.trim()).replace(/'/g,'')}')">Use “${esc(q.trim())}”<i>›</i></button>`:'')};
  screen(topbar()+`<div class="dv-body"><h1>Select the city you will drive in</h1><input class="dv-in" id="cq" placeholder="Search for a City" style="margin-top:18px" oninput="window._dc(this.value)"><div id="cl" class="dv-list"></div></div>`);
  window._dc=draw;draw('');
}
function pickCity(c){REG.city=c;back()}
function r3(){
  screen(topbar()+`<div class="dv-body"><div class="dv-ic">🔐</div><h1>Create your login</h1><p class="dv-sub">You will use these to sign in to the driver app.</p>
  <label class="dv-l">Email</label><input class="dv-in" id="em" type="email" autocapitalize="none" autocorrect="off" spellcheck="false" autocomplete="email" value="${esc(REG.email)}"><small class="dv-e" id="e_em"></small>
  <label class="dv-l">Password (8+ characters)</label><div class="dv-pw"><input class="dv-in" id="pw" type="password" autocapitalize="none" autocomplete="new-password"><button type="button" onclick="togglePw('pw',this)">👁️</button></div><small class="dv-e" id="e_pw"></small></div>
  <div class="dv-foot"><button class="dv-btn" onclick="n3()">NEXT</button></div>`);
}
function n3(){const e=$('#em').value.trim(),p=$('#pw').value;let ok=fe('em',/^\S+@\S+\.\S+$/.test(e)?'':'Enter a valid email');ok=fe('pw',p.length>=8?'':'Password must be at least 8 characters')&ok;if(!ok)return;REG.email=e;REG.pw=p;show(r4)}
function r4(){
  screen(hero('Add Your Vehicle - Unlock Your Earning Potential!')+`<div class="dv-sheet"><h1>Please select your vehicle</h1><p class="dv-sub">Which vehicle will you be driving?</p>
  <div class="dv-vg">${VEH.map(v=>`<button class="dv-v ${REG.vtype==v[0]?'on':''}" onclick="REG.vtype='${v[0]}';show(r5)"><span>${v[1]}</span>${v[2]}</button>`).join('')}</div>
  <div class="dv-bonus"><span>🎁</span><div><b>Earn 80% of every fare</b><p>Get paid for each completed ride, straight to your pocket.</p></div></div>
  <div class="dv-info">ⓘ You can add more vehicles after completing the onboarding process</div></div>`,'hasHero');
}
function r5(){
  screen(hero('Add Your Vehicle - Unlock Your Earning Potential!')+`<div class="dv-sheet"><h1>Vehicle Registration number</h1><p class="dv-sub">Please enter your vehicle Registration number</p>
  <input class="dv-in" id="vn" placeholder="Vehicle registration number" style="text-transform:uppercase" autocapitalize="characters" autocorrect="off" spellcheck="false" value="${esc(REG.vnum)}" oninput="this.value=this.value.toUpperCase().replace(/[^A-Z0-9 -]/g,'');$('#n5').disabled=this.value.trim().length<5"><small class="dv-e" id="e_vn"></small><p id="aerr" class="dv-err"></p>
  <div class="dv-info" style="margin-top:130px">ⓘ You can add more vehicles after completing the onboarding process</div></div>
  <div class="dv-foot"><button class="dv-btn" id="n5" disabled onclick="submitReg()">CONTINUE</button></div>`,'hasHero');
  setTimeout(()=>{const i=$('#vn');i&&i.focus();$('#n5').disabled=REG.vnum.trim().length<5},120);
}
async function submitReg(){
  REG.vnum=$('#vn').value.trim();const b=$('#n5'),er=$('#aerr');er.textContent='';b.disabled=true;b.textContent='PLEASE WAIT…';
  try{
    const d=await api('/partner/signup','POST',{name:REG.name.trim(),mobile:REG.phone,email:REG.email,password:REG.pw,vehicle:REG.vnum,kind:'driver',vtype:REG.vtype,city:REG.city});
    LS.uv_did=REG.phone;T=d.token;LS[KEY]=T;ME=d.user;delete LS.uv_dperm;toast('Registration done! Now upload your documents.');route();
  }catch(e){b.disabled=false;b.textContent='CONTINUE';const m=e.message||'';er.innerHTML='⚠️ '+(/already exists/i.test(m)?'This mobile/email is already registered. <a class="dv-a" onclick="reset(splash);show(loginScreen)">Login instead</a>':esc(m))}
}

/* ---------- permission screens ---------- */
const PERMS=[
 {ic:'🔔',t:'Notification Permission Required',d:'For us to alert you instantly when a new ride request arrives.',ask:async()=>{try{if(PL.LocalNotifications)await PL.LocalNotifications.requestPermissions();else if('Notification' in window&&Notification.permission==='default')await Notification.requestPermission()}catch(e){}}},
 {ic:'📍',t:'Location Permission Required',d:'For us to show nearby ride requests and let customers track your cab.',ask:async()=>{try{if(PL.Geolocation)await PL.Geolocation.requestPermissions();else if(navigator.geolocation)await new Promise(r=>navigator.geolocation.getCurrentPosition(r,r,{timeout:15000}))}catch(e){}}},
 {ic:'🚗',t:'Optimize App Performance',d:'Allow the app to run in the background so you never miss a ride request.',ask:async()=>{sheet(`<h2>Allow the app to always run in the background?</h2><p class="dv-sub">On your phone open <b>Settings → Battery → Background power control</b> (or App battery usage) and choose <b>Allow background usage</b> for UniVerse Driver.</p><button class="dv-btn" onclick="this.closest('.dv-sh').remove()">GOT IT</button>`);await new Promise(r=>setTimeout(r,300))}}];
function permStep(i){
  if(i>=PERMS.length){LS.uv_dperm='1';LS.uv_perm='1';return route()}
  const p=PERMS[i];
  screen(`<div class="dv-pill"><div class="dv-phone"><div class="dv-pbar">UNIVERSE <b>DRIVER</b></div><div class="dv-pcard"><span>${p.ic}</span><div><i></i><i></i><i class="s"></i></div></div></div></div>
  <div class="dv-body c" style="padding-top:34px"><h3 class="dv-pt">${p.t}</h3><p class="dv-pd">${p.d}</p></div>
  <div class="dv-foot"><button class="dv-btn blue" id="pb">ALLOW PERMISSION</button><a class="dv-skip" onclick="permStep(${i+1})">SKIP FOR NOW</a></div>`,'perm');
  $('#pb').onclick=async()=>{$('#pb').disabled=true;await p.ask();permStep(i+1)};
}

/* ---------- documents hub ---------- */
const imgOK=s=>s&&s!=='rejected';
function grp(g){const st=g.types.map(t=>DSTAT[t]);const up=st.filter(Boolean).length;
  if(st.some(s=>s==='rejected'))return{c:'bad',t:'Rejected – upload again'};
  if(up===g.types.length&&st.every(s=>s==='approved'))return{c:'ok',t:'Verified ✅'};
  if(up===g.types.length)return{c:'pend',t:'Uploaded • under review'};
  if(up>0)return{c:'pend',t:'Partially uploaded'};return{c:'',t:g.sub}}
async function loadDocs(){try{const d=await api('/partner/docs');DSTAT={};d.docs.forEach(x=>DSTAT[x.type]=x.status);if(d.approved&&!ME.approved){ME.approved=1;route();return false}}catch(e){}return true}
let hubT=null;
async function hub(){
  clearInterval(hubT);
  if(!(await loadDocs()))return;
  const all=DOCS.every(g=>g.types.every(t=>DSTAT[t])),next=DOCS.find(g=>g.types.some(t=>!DSTAT[t]||DSTAT[t]==='rejected'));
  screen(`<div class="dv-hero"><button class="dv-prof" onclick="profSheet()" aria-label="Profile">👤</button><h2>${all?'Application under review':'Upload Your Documents - Quick &amp; Simple Process'}</h2><div class="dv-play">${all?'⏳':'▶'}</div></div>
  <div class="dv-sheet"><div class="dv-chip">${(VEH.find(v=>v[0]===ME.vtype)||['','🚕',''])[1]} ${esc(VLAB[ME.vtype]||'Cab')} • ${esc(ME.vehicle||'')} ${ME.city?'• '+esc(ME.city):''}</div>
  <h1>${all?'Documents submitted':'Upload documents'}</h1><p class="dv-sub">${all?'Our team will verify your documents and approve your account soon. You will get a notification.':'Keep all these documents handy'}</p>
  ${DOCS.map((g,i)=>{const s=grp(g);return `<button class="dv-doc ${s.c}" onclick="show(()=>docScreen(${i}))"><span class="ic">${g.ic}</span><div><b>${g.t}</b><small>${s.t}</small></div><i>›</i></button>`}).join('')}
  <div style="height:150px"></div></div>
  <div class="dv-foot">${all?`<button class="dv-btn" onclick="hub()">CHECK STATUS</button>`:`<button class="dv-btn" onclick="show(()=>docScreen(${DOCS.indexOf(next)}))">Start Upload</button>`}<a class="dv-skip red" onclick="show(cancelScreen)">Cancel Application</a></div>`,'hasHero');
  hubT=setInterval(async()=>{if(!onboarding||!$('.dv-doc'))return clearInterval(hubT);try{const m=(await api('/me')).user;if(m.approved){ME=m;clearInterval(hubT);toast('🎉 Account approved!');route()}}catch(e){}},10000);
}
function profSheet(){const o=sheet(`<h2>${esc(ME.name)}</h2><p class="dv-sub">${esc(ME.mobile)} • ${esc(ME.email)}</p><button class="dv-btn" onclick="this.closest('.dv-sh').remove();logout()">LOGOUT</button><a class="dv-skip" href="https://wa.me/919319949612">Need help? WhatsApp us</a>`)}

/* ---------- document upload ---------- */
function toJpeg(file,max=1280){return new Promise((ok,no)=>{const r=new FileReader();r.onerror=()=>no(new Error('Could not read the file'));r.onload=()=>{const im=new Image();im.onerror=()=>no(new Error('Please choose a photo (JPG/PNG)'));im.onload=()=>{const s=Math.min(1,max/Math.max(im.width,im.height)),w=Math.round(im.width*s),h=Math.round(im.height*s),c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(im,0,0,w,h);let q=.75,d=c.toDataURL('image/jpeg',q);while(d.length>820000&&q>.3){q-=.1;d=c.toDataURL('image/jpeg',q)}ok(d)};im.src=r.result};r.readAsDataURL(file)})}
function docScreen(i){
  const g=DOCS[i];PICK={};
  const tiles=g.types.map((t,k)=>{const has=DSTAT[t];return g.k==='photo'
   ?`<label class="dv-ph2" id="t_${t}"><input type="file" accept="image/*" capture="user" hidden onchange="pick('${t}',this)"><div class="circ" id="p_${t}">${has?'<span class="done">✓</span>':'👤'}</div><span class="plus">+</span></label>`
   :`<label class="dv-up ${has?'has':''}" id="t_${t}"><input type="file" accept="image/*" hidden onchange="pick('${t}',this)"><div id="p_${t}"><b>${has?'✓':'⬆'}</b><span>${has?'Uploaded – tap to replace':'Upload '+g.lab[k]+' side'}</span></div></label>`}).join('');
  screen(topbar()+`<div class="dv-body"><h1>${g.t}</h1><p class="dv-sub">Make sure that ${g.k==='photo'?'your photo is entirely visible, glare free and not blurred.':'all the data on your document is fully visible, glare free and not blurred'}</p>
  ${g.sample?`<div class="dv-samp"><div class="h">${g.sample[0]}</div><div class="b"><span class="ph"></span><div><i></i><i></i><i class="s"></i><p>${g.sample[1]}</p></div></div></div>`:''}
  <div class="${g.k==='photo'?'dv-pc':'dv-ug'}">${tiles}</div><p id="aerr" class="dv-err"></p></div>
  <div class="dv-foot"><button class="dv-btn" id="ub" disabled onclick="uploadGrp(${i})">Upload &amp; continue</button><a class="dv-skip blue" onclick="back()">Upload Later</a></div>`);
  upState(g);
}
async function pick(t,inp){
  const f=inp.files&&inp.files[0];if(!f)return;const el=$('#p_'+t);
  try{const d=await toJpeg(f);PICK[t]=d;const g=DOCS.find(x=>x.types.includes(t));
    if(g.k==='photo')el.innerHTML=`<img src="${d}" alt="">`;else{el.innerHTML=`<img src="${d}" alt="">`;$('#t_'+t).classList.add('has')}
    upState(g)}catch(e){toast('⚠️ '+e.message)}
}
function upState(g){const b=$('#ub');if(!b)return;const need=g.types.filter(t=>!DSTAT[t]||DSTAT[t]==='rejected'),ok=need.every(t=>PICK[t])&&(Object.keys(PICK).length>0||need.length===0);b.disabled=!ok}
async function uploadGrp(i){
  const g=DOCS[i],b=$('#ub'),er=$('#aerr');er.textContent='';b.disabled=true;b.textContent='Uploading…';
  try{for(const t of g.types){if(PICK[t]){await api('/partner/docs','POST',{type:t,image:PICK[t]});DSTAT[t]='pending'}}
    toast('✅ '+g.t+' uploaded');PICK={};
    const nx=DOCS.findIndex((x,k)=>k>i&&x.types.some(t=>!DSTAT[t]||DSTAT[t]==='rejected'));
    if(nx>=0)show(()=>docScreen(nx),true);else{STACK=[hub];hub()}
  }catch(e){b.disabled=false;b.textContent='Upload & continue';er.textContent='⚠️ '+e.message}
}

/* ---------- cancel application ---------- */
let REASON='';
function cancelScreen(){
  REASON='';const R=['Need to change city of operation','Need to edit verified details','Not able to submit application','Other'];
  screen(topbar()+`<div class="dv-body"><h1>Tell us why do you want to cancel application</h1><div class="dv-rad">${R.map((r,i)=>`<button onclick="selReason(${i},this)"><span class="rd"></span>${r}</button>`).join('')}</div></div>
  <div class="dv-foot"><button class="dv-btn" id="cb" disabled onclick="confirmCancel()">Cancel Application</button></div>`);
  window._R=R;
}
function selReason(i,b){REASON=window._R[i];document.querySelectorAll('.dv-rad button').forEach(x=>x.classList.remove('on'));b.classList.add('on');$('#cb').disabled=false}
function confirmCancel(){
  const o=sheet(`<div class="dv-warn">!</div><h2>Are you sure?</h2><p class="dv-sub">In order to change your vehicle registration number, cancel the application and restart again.<br>By continuing, all the documents and information you’ve entered will be deleted.</p>
  <button class="dv-btn" id="yc">Yes! Cancel Application</button><button class="dv-btn gray" onclick="this.closest('.dv-sh').remove()">No! Go back</button>`);
  o.querySelector('#yc').onclick=async()=>{const b=o.querySelector('#yc');b.disabled=true;b.textContent='Please wait…';try{await api('/partner/cancel-application','POST',{reason:REASON});o.remove();T='';delete LS[KEY];delete LS.uv_dperm;ME=null;PS.stop();toast('Application cancelled. You can register again.');route()}catch(e){b.disabled=false;b.textContent='Yes! Cancel Application';toast('⚠️ '+e.message)}};
}

/* ---------- main driver app (after approval) ---------- */
const mapsA=(t,l)=>`<a class="jc-nav" target="_blank" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(t)}">🧭 ${l}</a>`;
function rideCard(j,mode){
  const mine=mode==='mine';
  return `<div class="jc"><div class="jc-h"><div><b>${esc(j.ref)}</b> <span class="tag">${esc(j.type)}</span></div><div class="jc-e">${inr(j.pearn)}<small>your earning</small></div></div>
  <div class="jc-r"><span>🟢</span><div><small>PICKUP</small><p style="color:#fff">${esc(j.pickup)}</p></div></div><div class="jc-r"><span>🔴</span><div><small>DROP</small><p style="color:#fff">${esc(j.dest)}</p></div></div>
  <div class="jc-c"><span class="chip2">${j.km} km</span><span class="chip2 cash">💵 Collect ${inr(j.fare)}</span></div>
  ${mine?`<div class="jc-a">${mapsA(j.pickup,'Navigate to pickup')}${mapsA(j.dest,'Navigate to drop')}<a class="jc-nav" href="tel:${esc(j.cmobile)}">📞 ${esc(j.cname)}</a></div>
  <button class="full big" onclick="rideStep(${j.id})">${j.status=='Accepted'?'▶️ Start trip':'🏁 Complete ride'}</button>${j.status=='Accepted'?`<button class="full ghostb big" onclick="rideRelease(${j.id})">↩️ Release ride</button>`:''}`
  :`<button class="full big" onclick="rideAccept(${j.id})">Accept ride</button>`}</div>`}
const rideAccept=wrap(async id=>{try{await api('/partner/accept/'+id,'POST');toast('Ride accepted! 🚀')}finally{PS.refresh()}});
const rideRelease=wrap(async id=>{if(!confirm('Release this ride? It will go to another driver.'))return;await api('/partner/release/'+id,'POST');toast('Ride released');PS.refresh()});
const rideStep=wrap(async id=>{const r=await api('/partner/next/'+id,'POST',{});toast(r.status=='Completed'?'🎉 Ride completed! Earnings credited':'Trip started');PS.refresh()});
let RT=null;
function incoming(j){
  let n=20;clearInterval(RT);
  const o=PS.ov(`<div class="ps-sheet rq"><div class="rq-t"><div class="rq-ring"><b id="rqn">${n}</b></div><div><h2>New ride request</h2><small>${esc(j.type)} • ${j.km} km</small></div></div>
  <div class="rq-r"><span>🟢</span><div><small>PICKUP</small><b>${esc(j.pickup)}</b></div></div><div class="rq-r"><span>🔴</span><div><small>DROP</small><b>${esc(j.dest)}</b></div></div>
  <div class="rq-f"><div><small>Fare (cash)</small><b>${inr(j.fare)}</b></div><div><small>You earn</small><b class="g">${inr(j.pearn)}</b></div></div>
  <button class="full big" id="rqa">Accept ride</button><button class="full ghostb big" id="rqs" style="color:#111;border-color:#ccc">Skip</button></div>`,'sheet');
  const close=()=>{clearInterval(RT);if(o.isConnected)PS.back()};
  o.querySelector('#rqs').onclick=close;
  o.querySelector('#rqa').onclick=async()=>{o.querySelector('#rqa').disabled=true;clearInterval(RT);try{await api('/partner/accept/'+j.id,'POST');toast('Ride accepted! 🚀');PS.back();PS.refresh()}catch(e){toast('⚠️ '+e.message);PS.back();PS.refresh()}};
  RT=setInterval(()=>{if(!o.isConnected){clearInterval(RT);return}n--;const e=$('#rqn');if(!e||n<=0){close();return}e.textContent=n},1000);
}
PS.setup({label:()=>'Cab Driver',word:()=>'ride',icon:()=>'🚕',roleOk:u=>u.role==='partner'&&u.kind==='driver',
  fetch:async()=>{const[d,e]=await Promise.all([api('/partner/jobs'),api('/partner/earnings')]);return{approved:d.approved,online:d.online,cash:d.cash,wallet:e.wallet,tx:e.tx,available:d.available,mine:d.mine}},
  card:rideCard,incoming,alertBody:j=>'Earn '+inr(j.pearn)+' • '+(j.pickup||'')+' → '+(j.dest||''),shareWhen:d=>d.mine.length>0});

/* ---------- router ---------- */
function route(){
  clearInterval(hubT);
  if(!ME||ME.role!=='partner'||ME.kind!=='driver'){if(ME){T='';delete LS[KEY];ME=null}onboarding=true;$('#psroot').style.display='none';document.body.className='dvbody';PS.stop();return reset(splash)}
  if(!LS.uv_dperm){onboarding=true;$('#psroot').style.display='none';document.body.className='dvbody';return permStep(0)}
  if(!ME.approved){onboarding=true;$('#psroot').style.display='none';document.body.className='dvbody';return reset(hub)}
  onboarding=false;drv.innerHTML='';drv.className='';document.body.className='psbody';$('#psroot').style.display='block';PS.show();
}
window.view=route;window.onUnauth=()=>{ME=null;route()};
(async()=>{if(T)try{ME=(await api('/me')).user}catch(e){}history.replaceState({dv:1},'');route()})();
