/* UniVerse Admin panel: login, stats, partners (drivers/delivery) approve, sellers approve, rides, orders */
var TAB = 'home';
var TABS = [['home','📊 Dashboard'],['partners','🚗 Drivers & Delivery'],['sellers','🏪 Sellers'],['rides','🧭 Rides'],['orders','📦 Orders'],['money','💰 Finance & Settings'],['users','👥 Users']];

function onUnauth() { view(); }

function view() {
  var loggedIn = !!(T && ME && ME.role === 'admin');
  $('#login').style.display = loggedIn ? 'none' : '';
  $('#panel').style.display = loggedIn ? '' : 'none';
  if (loggedIn) render();
}

async function boot() {
  if (T) {
    try { var d = await api('/me'); ME = d.user; if (!ME || ME.role !== 'admin') { ME = null; logout(); return; } }
    catch (e) { ME = null; }
  }
  view();
}

async function doLogin() {
  try {
    var identity = $('#em').value.trim(), password = $('#pw').value;
    if (!identity || !password) throw new Error('Email aur password daalo');
    var d = await api('/login', 'POST', { identity: identity, password: password });
    if (!d.user || d.user.role !== 'admin') throw new Error('Ye admin account nahi hai');
    T = d.token; localStorage[KEY] = T; ME = d.user;
    $('#pw').value = '';
    view();
  } catch (e) { toast('⚠️ ' + e.message); }
}

function tabsHtml() {
  return '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px">' + TABS.map(function (t) {
    return '<button type="button" class="' + (t[0] === TAB ? 'full' : 'ghost') + '" style="width:auto;padding:10px 16px" onclick="setTab(\'' + t[0] + '\')">' + t[1] + '</button>';
  }).join('') + '</div>';
}
function setTab(t) { TAB = t; render(); }

async function render() {
  var el = $('#admin');
  el.innerHTML = tabsHtml() + '<div id="tabBody" class="mu">Loading...</div>';
  $('#extra').innerHTML = '';
  try {
    var fn = { home: renderHome, partners: renderPartners, sellers: renderSellers, rides: renderRides, orders: renderOrders, money: renderMoney, users: renderUsers }[TAB];
    $('#tabBody').innerHTML = await fn();
  } catch (e) { $('#tabBody').innerHTML = '<p class="mu">⚠️ ' + esc(e.message) + '</p>'; }
}

function tbl(head, rows) {
  if (!rows.length) return '<p class="mu">Abhi kuch nahi hai.</p>';
  return '<div style="overflow-x:auto"><table><thead><tr>' + head.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';
}

async function renderHome() {
  var s = await api('/admin/stats');
  var card = function (l, v) { return '<div class="box" style="max-width:none;padding:18px;text-align:center"><div class="mu">' + l + '</div><div style="font-size:26px;font-weight:700;margin-top:6px">' + v + '</div></div>'; };
  var pend = s.pending > 0 ? '<p style="margin:16px 0">⏳ <b>' + s.pending + '</b> partner approval ka wait kar raha hai. <a href="#" onclick="setTab(\'partners\');return false" style="color:#c7beff">Dekho</a></p>' : '';
  return '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px">' +
    card('Users', s.users) + card('Products', s.products) + card('Orders', s.orders) + card('Revenue', inr(s.revenue)) +
    card('Rides', s.rides) + card('Partners', s.partners) + card('Pending approval', s.pending) + card('Low stock', s.lowStock) + '</div>' + pend;
}

async function renderPartners() {
  var d = await api('/admin/partners');
  var rows = d.partners.map(function (p) {
    return '<tr><td>' + esc(p.name) + '<br><span class="mu">' + esc(p.mobile) + '</span></td>' +
      '<td>' + esc(p.kind || '') + (p.vtype ? ' / ' + esc(p.vtype) : '') + '<br><span class="mu">' + esc(p.vehicle || '') + '</span></td>' +
      '<td>' + esc(p.city || '') + '</td>' +
      '<td>' + (p.approved ? '<span class="tag">Approved</span>' : '<span class="tag" style="background:#ff707033;color:#ffb0b0">Pending</span>') + (p.online ? ' 🟢' : '') + '</td>' +
      '<td>' + p.docs + ' docs <button type="button" class="sm" onclick="showDocs(' + p.id + ')">View</button></td>' +
      '<td><button type="button" class="sm" onclick="approvePartner(' + p.id + ',' + (p.approved ? 'false' : 'true') + ')">' + (p.approved ? 'Revoke' : '✅ Approve') + '</button></td></tr>';
  });
  return '<h3 style="margin-bottom:12px">Drivers & Delivery partners</h3>' + tbl(['Name', 'Type', 'City', 'Status', 'Documents', 'Action'], rows);
}
var approvePartner = wrap(async function (id, ok) { await api('/admin/partners/' + id + '/approve', 'POST', { approved: ok }); toast(ok ? 'Approved ✅' : 'Revoked'); render(); });

var showDocs = wrap(async function (id) {
  var d = await api('/admin/partners/' + id + '/docs');
  var html = '<div class="box" style="max-width:none"><h3 style="margin-bottom:10px">Documents (partner #' + id + ')</h3>';
  if (!d.docs.length) html += '<p class="mu">Koi document upload nahi hua.</p>';
  d.docs.forEach(function (x) {
    html += '<div style="padding:10px 0;border-bottom:1px solid #30384b"><b>' + esc(x.type) + '</b> <span class="tag">' + esc(x.status) + '</span> ' + (x.note ? '<span class="mu">' + esc(x.note) + '</span>' : '') +
      ' <button type="button" class="sm" onclick="viewDoc(' + id + ',\'' + esc(x.type) + '\')">Photo</button>' +
      ' <button type="button" class="sm" onclick="reviewDoc(' + id + ',\'' + esc(x.type) + '\',\'approved\')">Approve</button>' +
      ' <button type="button" class="sm" onclick="reviewDoc(' + id + ',\'' + esc(x.type) + '\',\'rejected\')">Reject</button><div id="doc-' + id + '-' + esc(x.type) + '"></div></div>';
  });
  $('#extra').innerHTML = html + '</div>';
  $('#extra').scrollIntoView({ behavior: 'smooth' });
});
var viewDoc = wrap(async function (id, type) {
  var d = await api('/admin/partners/' + id + '/docs/' + type);
  document.getElementById('doc-' + id + '-' + type).innerHTML = '<img src="' + d.image + '" style="max-width:100%;max-height:320px;margin-top:8px;border-radius:10px">';
});
var reviewDoc = wrap(async function (id, type, st) {
  var note = st === 'rejected' ? (prompt('Reject karne ka reason (optional)') || '') : '';
  await api('/admin/partners/' + id + '/docs/' + type + '/review', 'POST', { status: st, note: note });
  toast('Document ' + st); showDocs(id);
});

async function renderSellers() {
  var d = await api('/admin/sellers');
  var rows = d.sellers.map(function (s) {
    return '<tr><td>' + esc(s.shop_name) + '<br><span class="mu">' + esc(s.name) + ' · ' + esc(s.mobile) + '</span></td><td>' + esc(s.category || '') + '</td><td>' + esc(s.address || '') + '</td>' +
      '<td>' + (s.approved ? '<span class="tag">Approved</span>' : '<span class="tag" style="background:#ff707033;color:#ffb0b0">Pending</span>') + '</td>' +
      '<td><button type="button" class="sm" onclick="approveSeller(' + s.id + ',' + (s.approved ? 'false' : 'true') + ')">' + (s.approved ? 'Revoke' : '✅ Approve') + '</button></td></tr>';
  });
  return '<h3 style="margin-bottom:12px">Sellers</h3>' + tbl(['Shop', 'Category', 'Address', 'Status', 'Action'], rows);
}
var approveSeller = wrap(async function (id, ok) { await api('/admin/sellers/' + id + '/approve', 'POST', { approved: ok }); toast(ok ? 'Seller approved ✅' : 'Revoked'); render(); });

async function renderRides() {
  var d = await api('/admin/cabs');
  var rows = d.rides.map(function (r) {
    return '<tr><td>CAB' + (10000 + r.id) + '</td><td>' + esc(r.cname) + '<br><span class="mu">' + esc(r.cmobile) + '</span></td><td>' + esc(r.pickup) + ' → ' + esc(r.dest) + '</td><td>' + esc(r.type) + ' · ' + r.km + ' km</td><td>' + inr(r.fare) + '</td><td><span class="tag">' + esc(r.status) + '</span><br><span class="mu">' + esc(r.pname || 'No driver yet') + '</span></td></tr>';
  });
  return '<h3 style="margin-bottom:12px">Rides</h3>' + tbl(['Ride', 'Customer', 'Route', 'Type', 'Fare', 'Status / Driver'], rows);
}

async function renderOrders() {
  var d = await api('/orders?all=1');
  var sts = ['Placed', 'Confirmed', 'Out for delivery', 'Delivered', 'Cancelled'];
  var rows = d.orders.map(function (o) {
    var opts = sts.map(function (s) { return '<option' + (s === o.status ? ' selected' : '') + '>' + s + '</option>'; }).join('');
    return '<tr><td>' + esc(o.ref) + '</td><td>' + esc(o.name) + '<br><span class="mu">' + esc(o.addr) + '</span></td><td>' + inr(o.total) + '<br><span class="mu">' + esc(o.pay) + '</span></td><td>' + esc(o.pname || '-') + '</td><td><select onchange="setOrder(' + o.id + ',this.value)">' + opts + '</select></td></tr>';
  });
  return '<h3 style="margin-bottom:12px">Orders</h3>' + tbl(['Order', 'Customer', 'Amount', 'Delivery partner', 'Status'], rows);
}
var setOrder = wrap(async function (id, st) { await api('/orders/' + id, 'PATCH', { status: st }); toast('Status: ' + st); });


var SET_LABELS = {
  margin: ['Company profit % (seller price ke upar customer ko jodke dikhta hai)', '%'],
  delivery_fee: ['Customer se delivery fee', '₹'],
  free_above: ['Itne se upar delivery free', '₹'],
  partner_earning: ['Delivery partner ko har delivery par', '₹'],
  cash_limit: ['Delivery partner cash limit (isse upar naye orders band)', '₹'],
  cab_partner_percent: ['Cab: driver ko fare ka %', '%']
};
async function renderMoney() {
  var f = await api('/admin/finance'), st = await api('/admin/settings');
  var m = f.market, c = f.cab;
  var row = function (a, b, bold) { return '<tr><td>' + a + '</td><td style="text-align:right">' + (bold ? '<b>' + b + '</b>' : b) + '</td></tr>'; };
  var html = '<h3 style="margin-bottom:12px">Company ki kamai (sirf delivered orders / completed rides)</h3>' +
    '<div class="box" style="max-width:none"><table><tbody>' +
    row('Marketplace orders delivered', m.orders) +
    row('Customers ne items par diya', inr(m.customerPaidItems)) +
    row('Sellers ko milega', inr(m.sellerGets)) +
    row('Company margin (items)', inr(m.companyMargin)) +
    row('Delivery fee customers se aayi', inr(m.deliveryFeeCollected)) +
    row('Delivery partners ko diya', inr(m.partnerEarnings)) +
    row('Delivery se bacha / (ghata)', inr(m.deliveryProfit)) +
    row('Cab rides completed', c.rides) + row('Cab fare', inr(c.fare)) + row('Drivers ko', inr(c.partnerGets)) + row('Cab se company', inr(c.companyProfit)) +
    row('✅ COMPANY KA TOTAL PROFIT', inr(f.companyProfitTotal), true) +
    row('Delivery partners ke paas cash (abhi jama karna baaki)', inr(f.partnerCashOutstanding)) +
    '</tbody></table></div>' +
    '<h3 style="margin:22px 0 10px">Settings</h3><div class="box" style="max-width:none">';
  Object.keys(SET_LABELS).forEach(function (k) {
    html += '<label class="mu" style="display:block;margin-top:10px">' + SET_LABELS[k][0] + ' (' + SET_LABELS[k][1] + ')</label><input id="set_' + k + '" type="number" step="any" value="' + st.settings[k] + '">';
  });
  html += '<button type="button" class="full" onclick="saveSettings()">Save settings</button>' +
    '<p class="mu" style="margin-top:10px">Naye orders par ye settings turant lagu hoti hain. Purane orders ka hisaab nahi badlega.</p></div>' +
    '<h3 style="margin:22px 0 10px">Backup</h3><div class="box" style="max-width:none"><p class="mu">Poora database (users, orders, products) ek file me download karo. Free hosting par deploy se pehle zaroor karo.</p><button type="button" class="full ghostb" onclick="downloadBackup()">⬇️ Backup download karo</button></div>';
  return html;
}
var saveSettings = wrap(async function () {
  var b = {}; Object.keys(SET_LABELS).forEach(function (k) { b[k] = $('#set_' + k).value; });
  await api('/admin/settings', 'POST', b); toast('Settings save ho gayi ✅'); render();
});
var downloadBackup = wrap(async function () {
  var d = await api('/admin/backup');
  var bin = atob(d.data), arr = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([arr], { type: 'application/octet-stream' })); a.download = d.filename; document.body.appendChild(a); a.click(); a.remove();
  toast('Backup download ho gaya');
});

var USERQ = '';
async function renderUsers() {
  var d = await api('/admin/users?q=' + encodeURIComponent(USERQ));
  var rows = d.users.map(function (u) {
    return '<tr><td>' + esc(u.name) + '</td><td>' + esc(u.mobile) + '<br><span class="mu">' + esc(u.email) + '</span></td><td>' + esc(u.role) + (u.kind ? ' / ' + esc(u.kind) : '') +
      '</td><td><button type="button" class="sm" onclick="resetPw(' + u.id + ')">🔑 Reset password</button></td></tr>';
  });
  return '<h3 style="margin-bottom:12px">Users (customer, seller, delivery, driver)</h3><div style="display:flex;gap:8px;margin-bottom:12px"><input id="uq" placeholder="Naam, mobile ya email" value="' + esc(USERQ) + '" style="margin:0"><button type="button" class="sm" style="width:auto" onclick="USERQ=$(\'#uq\').value;render()">Search</button></div>' +
    tbl(['Name', 'Contact', 'Role', 'Action'], rows);
}
var resetPw = wrap(async function (id) {
  var p = prompt('Naya password likho (8+ characters). Khali chhodo to khud ban jayega:', '');
  if (p === null) return;
  var d = await api('/admin/users/' + id + '/reset-password', 'POST', { password: p });
  alert('Naya password: ' + d.password + '\n\nYe user ko bata do aur use login ke baad badalne ko bolo.');
});

document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && $('#login').style.display !== 'none') doLogin(); });
boot();
