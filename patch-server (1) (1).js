// Universe server.js auto-patch. Chalane ka tareeka: node patch-server.js
const fs=require('fs'),vm=require('vm');
const FILE='server.js';
if(!fs.existsSync(FILE)){console.log('server.js nahi mili. Is file ko universe-mvp folder mein rakho aur wahin se chalao.');process.exit(1)}
let s=fs.readFileSync(FILE,'utf8');const orig=s;
const P={
 "tables": "db.exec('CREATE TABLE IF NOT EXISTS live_loc(uid INTEGER PRIMARY KEY,lat REAL,lng REAL,ts INTEGER);CREATE TABLE IF NOT EXISTS order_pins(order_id INTEGER PRIMARY KEY,lat REAL,lng REAL);CREATE TABLE IF NOT EXISTS seller_pins(seller_id INTEGER PRIMARY KEY,lat REAL,lng REAL)');",
 "r1": "else if(m==='GET'&&/^\\/orders\\/\\d+\\/track$/.test(p)){const u=me(),id=+p.split('/')[2],o=db.prepare('SELECT * FROM orders WHERE id=?').get(id);if(!o)throw fail(404,'Order not found');const sids=[...new Set(JSON.parse(o.items||'[]').map(i=>i.seller_id).filter(Boolean))];if(!(u.role==='admin'||o.uid===u.id||(o.pid&&o.pid===u.id)||sids.includes(u.id)))throw fail(403,'Not allowed');\n   const live=o.pid&&o.status==='Out for delivery'?db.prepare('SELECT lat,lng,ts FROM live_loc WHERE uid=?').get(o.pid):null,pn=o.pid?db.prepare('SELECT name FROM users WHERE id=?').get(o.pid):null,drop=db.prepare('SELECT lat,lng FROM order_pins WHERE order_id=?').get(id)||null,shops=sids.length?db.prepare('SELECT seller_id,lat,lng FROM seller_pins WHERE seller_id IN ('+sids.map(()=>'?').join(',')+')').all(...sids):[];\n   r={status:o.status,assigned:!!o.pid,partner:live&&Date.now()-live.ts<120000?{...live,name:pn&&pn.name}:null,drop,shops}}\n else if(m==='POST'&&/^\\/orders\\/\\d+\\/pin$/.test(p)){const u=me(),id=+p.split('/')[2],b=await readBody(req),o=db.prepare('SELECT uid,status FROM orders WHERE id=?').get(id);if(!o||o.uid!==u.id)throw fail(404,'Order not found');if(['Delivered','Cancelled'].includes(o.status))throw fail(409,'Order closed');if(typeof b.lat!=='number'||typeof b.lng!=='number'||!(Math.abs(b.lat)<=90)||!(Math.abs(b.lng)<=180))throw fail(400,'Bad location');db.prepare('INSERT INTO order_pins(order_id,lat,lng) VALUES(?,?,?) ON CONFLICT(order_id) DO UPDATE SET lat=excluded.lat,lng=excluded.lng').run(id,b.lat,b.lng);r={ok:true}}\n else if(m==='POST'&&p==='/seller/pin'){const u=me(),b=await readBody(req);if(!db.prepare('SELECT 1 x FROM seller_profiles WHERE user_id=?').get(u.id))throw fail(403,'Seller account required');if(typeof b.lat!=='number'||typeof b.lng!=='number'||!(Math.abs(b.lat)<=90)||!(Math.abs(b.lng)<=180))throw fail(400,'Bad location');db.prepare('INSERT INTO seller_pins(seller_id,lat,lng) VALUES(?,?,?) ON CONFLICT(seller_id) DO UPDATE SET lat=excluded.lat,lng=excluded.lng').run(u.id,b.lat,b.lng);r={ok:true}}",
 "r2": "else if(m==='POST'&&p==='/partner/location'){const b=await readBody(req);if(typeof b.lat!=='number'||typeof b.lng!=='number'||!(Math.abs(b.lat)<=90)||!(Math.abs(b.lng)<=180))throw fail(400,'Bad location');db.prepare('INSERT INTO live_loc(uid,lat,lng,ts) VALUES(?,?,?,?) ON CONFLICT(uid) DO UPDATE SET lat=excluded.lat,lng=excluded.lng,ts=excluded.ts').run(u.id,b.lat,b.lng,Date.now());r={ok:true}}",
 "from": ".run(Date.now(),id,u.id);r={ok:true,status:'Picked Up'}",
 "to": ".run(Date.now(),id,u.id);db.prepare(\"UPDATE orders SET status='Out for delivery',pid=? WHERE id=? AND status NOT IN ('Delivered','Cancelled')\").run(u.id,so.parent_order_id);r={ok:true,status:'Picked Up'}"
};
const log=(ok,m)=>console.log((ok?'✅ ':'⚠️  ')+m);
function insertBefore(name,marker,anchor,text){
  if(s.includes(marker))return log(true,name+': pehle se laga hua hai, skip');
  const i=s.indexOf(anchor);
  if(i<0)return log(false,name+': jagah nahi mili, ye badlav nahi hua');
  s=s.slice(0,i)+text+'\n'+s.slice(i);log(true,name+': laga diya');
}
function replace(name,marker,from,to){
  if(s.includes(marker))return log(true,name+': pehle se laga hua hai, skip');
  const i=s.indexOf(from);
  if(i<0)return log(false,name+': jagah nahi mili, ye badlav nahi hua');
  s=s.slice(0,i)+to+s.slice(i+from.length);log(true,name+': laga diya');
}
insertBefore('Tables','CREATE TABLE IF NOT EXISTS live_loc','const hash=(p,s)=>',P.tables);
insertBefore('Track/pin routes','/track$/','else if(m===\'POST\'&&/^\\/orders\\/\\d+\\/cancel$/.test(p))',P.r1);
insertBefore('Partner location route',"p==='/partner/location'","else if(m==='GET'&&p==='/partner/earnings')",P.r2);
replace('Pickup par Out for delivery',"SET status='Out for delivery',pid=? WHERE id=? AND status NOT IN",P.from,P.to);
if(s===orig){console.log('Koi badlav nahi hua.');process.exit(0)}
try{new vm.Script(s)}catch(e){console.log('❌ Patch ke baad syntax error aaya, file nahi badli: '+e.message);process.exit(1)}
const bk='server.backup-'+Date.now()+'.js';fs.writeFileSync(bk,orig);fs.writeFileSync(FILE,s);
console.log('\nBackup bana: '+bk+'\nserver.js update ho gayi. Ab npm start chalao.');
