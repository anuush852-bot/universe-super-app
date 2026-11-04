let TAB='login',D=null,EARN=null;
function view(){$('#nb').innerHTML=ME?'<button class="ghost" onclick="logout()">Logout</button>':'';if(!ME)return authV();dash()}
function authV(){const l=TAB=='login';$('#app').innerHTML=`<div class="box"><h2 style="margin-bottom:6px">${l?'Partner Login':'Join Universe as a Partner'}</h2><p class="mu" style="margin-bottom:16px">${l?'Login to see jobs and earnings.':'Deliver orders or drive cabs and earn on every job.'}</p>
<div class="tabs"><button class="${l?'on':''}" onclick="TAB='login';authV()">Login</button><button class="${l?'':'on'}" onclick="TAB='signup';authV()">Sign up</button></div>
${l?`<input id="a1" placeholder="Mobile or Email" style="margin-bottom:12px"><input id="a2" type="password" placeholder="Password" style="margin-bottom:12px">`
:`<input id="n" placeholder="Full name" style="margin-bottom:12px"><input id="m" maxlength="10" placeholder="Mobile (10 digits)" style="margin-bottom:12px"><input id="e" type="email" placeholder="Email" style="margin-bottom:12px">
<select id="k" style="margin-bottom:12px"><option value="delivery">🛵 Delivery Partner (orders)</option><option value="driver">🚕 Cab Driver (rides)</option></select><input id="v" placeholder="Vehicle number e.g. DL01AB1234" style="margin-bottom:12px"><input id="p" type="password" placeholder="Password (8+ chars)" style="margin-bottom:12px">`}
<button class="full" onclick="doAuth()">${l?'Login':'Apply Now'}</button></div>`}
const doAuth=wrap(async()=>{const l=TAB=='login',d=l?await api('/login','POST',{identity:$('#a1').value,password:$('#a2').value}):await api('/partner/signup','POST',{name:$('#n').value,mobile:$('#m').value,email:$('#e').value,kind:$('#k').value,vehicle:$('#v').value,password:$('#p').value});
 if(d.user.role!=='partner')throw new Error('This is not a partner account');T=d.token;localStorage[KEY]=T;ME=d.user;view();toast(l?'Welcome back!':'Application sent! Wait for admin approval.')});
const dash=wrap(async()=>{[D,EARN]=await Promise.all([api('/partner/jobs'),api('/partner/earnings')]);ME.online=D.online;ME.approved=D.approved;draw()});
const dl=()=>ME.kind=='delivery',done=()=>EARN.tx.filter(x=>x.amt>0&&x.note.startsWith('Earning')).length;
function draw(){const mine=D.mine,av=D.available;
 $('#app').innerHTML=`<div class="row sb wrap" style="margin-bottom:18px"><div><h2>Hi, ${esc(ME.name.split(' ')[0])} 👋</h2><p class="mu">${dl()?'🛵 Delivery Partner':'🚕 Cab Driver'} • ${esc(ME.vehicle)}</p></div>
 <button class="${ME.online?'full':'secondary'}" style="width:auto;padding:12px 22px;${ME.online?'background:#2fa36b':''}" onclick="toggle()">${ME.online?'🟢 Online':'⚪ Offline – tap to go online'}</button></div>
 ${ME.approved?'':'<div class="box" style="margin-bottom:18px">⏳ <b>Waiting for admin approval.</b><p class="mu">You can take jobs once the owner approves your account.</p></div>'}
 <div class="stats"><div class="stat">💰<h3>${inr(EARN.wallet)}</h3><p class="mu">Pending earnings</p></div><div class="stat">✅<h3>${done()}</h3><p class="mu">Jobs done</p></div></div>
 ${mine.map(j=>job(j,1)).join('')}${!mine.length&&ME.online&&ME.approved?`<h3 style="margin-bottom:10px">New ${dl()?'orders':'rides'} nearby ${av.length?'('+av.length+')':''}</h3>${av.map(j=>job(j,0)).join('')||'<div class="box mu">No jobs right now. Stay online – we refresh every few seconds.</div>'}`:''}
 ${!ME.online&&ME.approved&&!mine.length?'<div class="box mu">Go online to start receiving jobs.</div>':''}
 <h3 style="margin:24px 0 10px">Earnings history</h3><div class="tw"><table>${EARN.tx.map(x=>`<tr><td>${esc(x.note)}<br><span class="mu">${new Date(x.ts).toLocaleString()}</span></td><td style="color:${x.amt<0?'#ff7070':'#68e0a1'}">${x.amt<0?'−':'+'}${inr(Math.abs(x.amt))}</td></tr>`).join('')||'<tr><td class="mu">No earnings yet</td></tr>'}</table></div>`}
function job(j,active){const next=!dl()&&j.status=='Accepted'?'▶️ Start Trip':dl()?'✅ Mark Delivered':'🏁 Complete Ride';
 return `<div class="box" style="margin-bottom:14px;padding:20px"><div class="row sb"><b>${j.ref}</b><span class="tag">Earn ${inr(j.pearn)}</span></div>
 ${dl()?`<p style="margin:10px 0">📍 ${esc(j.addr)}</p><p class="mu">${j.items.map(i=>esc(i.name)+' ×'+i.qty).join(', ')}</p><p style="margin-top:8px">${j.pay=='COD'?'💵 Collect cash: <b>'+inr(j.total)+'</b>':'✅ Already paid by wallet'}</p>`
 :`<p style="margin:10px 0">📍 ${esc(j.pickup)}<br>➡️ ${esc(j.dest)}</p><p class="mu">${j.type} • ${j.km} km • Fare <b>${inr(j.fare)}</b> (collect cash)</p>`}
 ${active?`<p style="margin:10px 0">👤 ${esc(j.cname)} • <a style="color:#a895ff" href="tel:${esc(j.cmobile)}">📞 ${esc(j.cmobile)}</a></p><button class="full" onclick="step(${j.id})">${next}</button>`:`<button class="full" style="margin-top:12px" onclick="accept(${j.id})">Accept Job</button>`}</div>`}
const toggle=wrap(async()=>{await api('/partner/online','POST',{online:!ME.online});dash()});
const accept=wrap(async id=>{try{await api('/partner/accept/'+id,'POST')}finally{dash()}toast('Job accepted! 🚀')});
const step=wrap(async id=>{let body={};if(dl()){const otp=prompt('Customer se 6-digit Delivery OTP lein:');if(!otp)return;body.otp=otp.trim()}const r=await api('/partner/next/'+id,'POST',body);toast(r.status=='Delivered'||r.status=='Completed'?'🎉 Delivery verified! Earnings credited':'Status: '+r.status);dash()});
window.onUnauth=view;(async()=>{if(T)try{ME=(await api('/me')).user;if(ME.role!=='partner'){ME=null;T=''}}catch{}view();setInterval(()=>{if(ME&&!document.hidden)dash()},8000)})();
