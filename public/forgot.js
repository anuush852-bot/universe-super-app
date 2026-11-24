/* Forgot password (OTP on email) – shared by customer, seller, delivery and driver apps */
(function () {
  function api(p, body) {
    return fetch((window.API_BASE || '') + '/api' + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok) throw new Error(d.error || 'Something went wrong'); return d; }); },
            function () { throw new Error('No internet connection. Please check and retry.'); });
  }
  var css = '#fpOv{position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:18px;font-family:system-ui,sans-serif}' +
    '#fpOv .fpc{background:#141a28;color:#fff;border:1px solid #2c3550;border-radius:18px;padding:22px;width:100%;max-width:400px}' +
    '#fpOv h3{margin:0 0 6px;font-size:20px}#fpOv p{color:#a9b2c7;font-size:14px;margin:6px 0 12px;line-height:1.4}' +
    '#fpOv input{width:100%;box-sizing:border-box;padding:13px;margin:6px 0;border-radius:12px;border:1px solid #38425f;background:#0c111c;color:#fff;font-size:16px}' +
    '#fpOv button{width:100%;padding:13px;margin-top:10px;border:0;border-radius:12px;font-size:16px;font-weight:700;background:#7657ff;color:#fff}' +
    '#fpOv button.g{background:transparent;border:1px solid #38425f;color:#a9b2c7}#fpOv .e{color:#ff8a8a;font-size:13px;min-height:18px}#fpOv a{color:#a895ff}';
  function close() { var o = document.getElementById('fpOv'); if (o) o.remove(); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function shell(html) {
    var o = document.getElementById('fpOv');
    if (!o) { var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); o = document.createElement('div'); o.id = 'fpOv'; document.body.appendChild(o); }
    o.innerHTML = '<div class="fpc">' + html + '</div>';
    return o;
  }
  var ID = '';
  function step1(msg) {
    shell('<h3>🔑 Password bhool gaye?</h3><p>Apna registered email ya mobile number daalo. Hum email par 6 digit OTP bhejenge.</p>' +
      '<input id="fpId" placeholder="Email ya mobile" autocapitalize="none" autocomplete="username" value="' + esc(ID) + '"><div class="e" id="fpE">' + esc(msg || '') + '</div>' +
      '<button id="fpGo">OTP bhejo</button><button class="g" id="fpX">Cancel</button>');
    document.getElementById('fpX').onclick = close;
    document.getElementById('fpGo').onclick = function () {
      var v = document.getElementById('fpId').value.trim(); if (!v) { document.getElementById('fpE').textContent = 'Email ya mobile daalo'; return; }
      ID = v; this.disabled = true; this.textContent = 'Bhej rahe hain...';
      api('/forgot', { identity: v }).then(function (d) { step2(d.emailConfigured); }).catch(function (e) { step1(e.message); });
    };
  }
  function step2(mailOk) {
    shell('<h3>OTP daalo</h3><p>' + (mailOk ? 'Agar ye account mila to email par OTP bhej diya gaya hai (10 minute valid). Spam folder bhi check karo.' :
      'Email service abhi set nahi hai. Admin ko WhatsApp karke password reset karwao: <a href="https://wa.me/919319949612">WhatsApp</a>') + '</p>' +
      '<input id="fpO" inputmode="numeric" maxlength="6" placeholder="6 digit OTP"><input id="fpP" type="password" placeholder="Naya password (8+ characters)" autocomplete="new-password">' +
      '<div class="e" id="fpE"></div><button id="fpGo">Password badlo</button><button class="g" id="fpB">Wapas</button>');
    document.getElementById('fpB').onclick = function () { step1(); };
    document.getElementById('fpGo').onclick = function () {
      var otp = document.getElementById('fpO').value.trim(), pw = document.getElementById('fpP').value, E = document.getElementById('fpE');
      if (!/^\d{6}$/.test(otp)) { E.textContent = '6 digit OTP daalo'; return; } if (pw.length < 8) { E.textContent = 'Password 8+ characters ka rakho'; return; }
      this.disabled = true; this.textContent = 'Please wait...';
      api('/reset', { identity: ID, otp: otp, password: pw }).then(function () {
        shell('<h3>✅ Password badal gaya</h3><p>Ab naye password se login karo.</p><button id="fpOk">Login karo</button>');
        document.getElementById('fpOk').onclick = function () { close(); var a = document.querySelector('input[autocomplete="current-password"]'); if (a) a.value = ''; };
      }).catch(function (e) { step2(mailOk); setTimeout(function () { var E2 = document.getElementById('fpE'); if (E2) E2.textContent = e.message; }, 0); });
    };
  }
  window.forgotPassword = function () { ID = ''; step1(); };
})();
