// app.js mein customer ka OTP + Track + Cancel wala hissa lagata hai.
// Chalane ka tareeka (universe-mvp folder mein): node patch-app.js
const fs=require('fs'),vm=require('vm');
const FILE='public/app.js';
if(!fs.existsSync(FILE)){console.log('public/app.js nahi mili. universe-mvp folder se chalao.');process.exit(1)}
let s=fs.readFileSync(FILE,'utf8');
if(s.length<5000){console.log('❌ public/app.js bahut chhoti hai ('+s.length+' bytes). Ye abhi tooti hui hai. Pehle isse restore karo, phir ye chalao.');process.exit(1)}
if(s.includes("openTrack(")){console.log('✅ Pehle se laga hua hai, kuch karna nahi.');process.exit(0)}
const NEW="const stx=(x,o)=>`<span class=\"tag\">${x.status}</span>${x.pname?`<br>🧑 ${esc(x.pname)}<br><a style=\"color:#a895ff\" href=\"tel:${esc(x.pmobile)}\">📞 ${esc(x.pmobile)}</a>`:''}${x.delivery_otp?`<br>🔐 Delivery OTP: <b>${esc(x.delivery_otp)}</b>`:''}${o&&/out/i.test(x.status)?`<br><button class=\"sm\" onclick=\"openTrack(${x.id},'customer')\">📍 Track</button>`:''}${o&&!['Delivered','Cancelled'].includes(x.status)?`<br><button class=\"sm d\" onclick=\"cancelOrder(${x.id})\">Cancel</button>`:''}`;";
const m=s.match(/^[ \t]*const stx\s*=.*;[ \t]*$/m);
if(!m){console.log('⚠️  "const stx=" wali line nahi mili. Koi badlav nahi hua.');process.exit(1)}
const t=s.replace(m[0],NEW);
try{new vm.Script(t)}catch(e){console.log('❌ Patch ke baad syntax error aaya, file nahi badli: '+e.message);process.exit(1)}
const bk='public/app.backup-'+Date.now()+'.js';fs.writeFileSync(bk,s);fs.writeFileSync(FILE,t);
console.log('✅ Laga diya. Backup: '+bk+'\nAb browser mein Ctrl+Shift+R dabao.');
