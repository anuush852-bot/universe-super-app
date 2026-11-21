/* UniVerse Admin panel: login, stats, partners (drivers/delivery) approve, sellers approve, rides, orders */
var TAB = 'home';
var TABS = [['home','📊 Dashboard'],['partners','🚗 Drivers & Delivery'],['sellers','🏪 Sellers'],['rides','🧭 Rides'],['orders','📦 Orders']];

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
    var fn = { home: renderHome, partners: renderPartners, sellers: renderSellers, rides: renderRides, orders: renderOrders }[TAB];
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

document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && $('#login').style.display !== 'none') doLogin(); });
boot();
