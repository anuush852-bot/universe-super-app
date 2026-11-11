# Update: Zomato/Amazon-style start flow

## Naya kya hai
- App kholte hi: **Notification permission → Location permission (GPS) → Sign in / Skip** (Amazon jaisa).
- "Enter your location manually" – area/street/pincode search (OpenStreetMap, free).
- Location set hote hi notification: "📍 Location set – Delivering to ...".
- Navbar mein location chip (tap karke badal sakte hain); checkout aur cab pickup mein location auto-fill.
- Order status badalte hi notification (Confirmed / Out for delivery / Delivered).
- Mobile app feel: bottom tab bar, 2-column products, bottom-sheet popups, safe-area support.

## Android app mein chalane ke steps
```
npm install
npx cap sync android
npx cap open android      # Android Studio se Run / Build
```
Zaroori: `capacitor.config.json` mein `"server": {"url": "https://APNA-RENDER-URL"}` daalein, warna app ke andar `/api` calls server tak nahi pahunchengi.

## Limitations
- Notifications abhi app ke andar se (local) aate hain; app band hone par push ke liye Firebase (FCM) chahiye.
- Browser mein GPS sirf HTTPS (ya localhost) par chalta hai.
- Address search Nominatim use karta hai (light use ke liye free; bade scale par paid geocoder).

## Update 2: Cart + Login fix
- Bug: mobile tab bar popup/cart ke upar aa jati thi, isliye Cart aur Login button chhup jate the. Ab popup tab bar ke upar aata hai.
- Cart ab poora page hai (Amazon jaisa): empty state (Sign in / Sign up / Continue shopping), qty +/−, Remove, free-delivery progress, bill summary, sticky "Proceed to Order".
- Product card par seedha "Add to Cart"; Android back button se cart/popup band hota hai.
- Login: error form ke andar dikhta hai, password show/hide, keyboard auto-capital/space ki dikkat theek, Enter se login.
- My Orders / Rides / Wallet ab mobile-friendly cards hain.

## Update 3: Login / Sign up
- Login ab poora screen hai (Amazon jaisa): Sign in, Create account, Skip sign in, Need help (WhatsApp).
- Har field ke neeche saaf error, password show/hide, password strength bar, +91 mobile box.
- Pichla mobile/email yaad rehta hai; sign in ke baad checkout wahin se aage badhta hai.
- "Account already exists" / "wrong details" ke liye seedhe Sign in / Sign up ke links.
- Account sheet: naam, wallet, orders, location badlo, Log out (confirm ke saath).

## Update 4: Delivery / Partner / Cab Driver apps
Shared Zomato-Delivery-style shell (`public/pshell.js`): Online toggle, bell + notification centre, Feed / Pocket / Trips / Profile tabs,
new-order alerts (sound + vibration + notification), cash-limit & approval banners, permission sheet, OTP entry sheet, Android back support.
- `/delivery` - Delivery partner (seller pickups, pickup OTP + drop OTP)
- `/partner`  - Legacy delivery + cab partner
- `/driver`   - NEW cab driver app (Ola-Partner-style): Login/Register, phone, name+city, login, vehicle (Auto/Two Wheeler/Car/Slow EV),
  vehicle number, permission screens, documents upload (RC, Licence, Aadhaar, Photo), under-review screen, cancel application.
  After admin approval: Feed with full-screen "New ride request" (20s countdown, Accept/Skip).
- Server: documents stored in `partner_docs` (images max ~800 KB, compressed on phone); endpoints /partner/docs, /partner/cancel-application,
  admin /admin/partners/:id/docs (+ review). Admin panel: "Docs" button per partner with Approve/Reject.
- New ride type "Bike" in customer cab booking; drivers only see rides matching their vehicle (Auto/EV -> Auto, Bike -> Bike, Car -> Mini/Sedan).
Limitations: no SMS OTP (login = mobile/email + password); documents live in the database - restrict admin access and back up securely;
background location when the app is closed needs a native foreground-service plugin.

## Update 5: Delivery + Partner = ek app, Seller photo upload, sab apps mein start-up permission
- `/partner` ab alag app nahi hai: ye seedha `/delivery` par bhej deta hai. Delivery app (aapka Zomato-style design) hi ek single partner app hai.
  Cab ke liye `/driver` app alag hai. (`partner.html` / `partner.js` hata diye; `/partner/...` API chalti rehti hai kyunki delivery aur driver app use karte hain.)
- Seller: Add Product mein "📷 Add product photo" (camera ya gallery). Photo phone par chhoti hoti hai, server par `/img/<id>` se milti hai.
  Product list mein thumbnail + har product par "📷 Photo" (photo badalne ke liye). Customer app mein photo apne aap dikhti hai.
- Start-up permission + notification sab apps mein:
  Customer (notification + location, "Location set" notification), Delivery (permissions screen sabko ek baar),
  Driver (notification, location, background), Seller (notification + shop location khud set, naye order ka notification),
  Admin (notification; naye order / pending approval ka notification).
- Helpline/WhatsApp number sab apps mein ek jaisa (919319949612).
Note: purane `orders` jo seller_orders ke bina bane the (marketplace se pehle), delivery app mein nahi dikhte. Naye sab orders seller_orders se aate hain.

## Update 6: Saved accounts (customer + seller)
Logout ke baad login screen par "Saved accounts" dikhta hai (naam + masked number/email, jaise +91 98••••••10).
Tap karte hi number/email bhar jata hai aur cursor password par aa jata hai. Sirf 3 recent accounts yaad rehte hain, ✕ se hata sakte hain.
Password kabhi save nahi hota (security). Delivery app mein ye nahi joda gaya.
Files: public/acct.js (naya), app.js, seller.js, index.html, seller.html, style.css.
Note: Amazon/Zomato mein ye OTP se hota hai; abhi SMS OTP nahi hai, isliye password dalna padta hai.
